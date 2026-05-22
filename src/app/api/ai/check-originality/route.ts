import { NextRequest, NextResponse } from "next/server";
import { getModelConfig } from "@/lib/model-config";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, "").trim();
}

function countWords(text: string) {
  const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const nonCjk = text.replace(/[一-鿿㐀-䶿]/g, " ").replace(/\s+/g, " ").trim();
  const en = nonCjk ? nonCjk.split(/\s+/).filter(w => w.length > 0).length : 0;
  return cjk + en;
}

function extractSentences(text: string, count: number): string[] {
  const raw = text.split(/[。！？；\n]/).map(s => s.trim()).filter(s => s.length >= 10 && s.length <= 60);
  if (raw.length <= count) return raw;
  const step = Math.floor(raw.length / count);
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i * step + Math.floor(Math.random() * Math.max(1, step - 1));
    if (idx < raw.length) selected.push(raw[idx]);
  }
  return selected;
}

function titleSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().replace(/\s+/g, "");
  const lb = b.toLowerCase().replace(/\s+/g, "");
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.8;
  const wordsA = new Set([...la]);
  const wordsB = new Set([...lb]);
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

async function searchBing(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const results: { title: string; url: string; snippet: string }[] = [];
  try {
    const res = await fetch(
      `https://cn.bing.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept-Language": "zh-CN,zh;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return results;
    const html = await res.text();
    const re = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const item = m[1];
      const h2 = item.match(/<h2[^>]*>\s*<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const s = item.match(/<p class="b_lineclamp\d*">([\s\S]*?)<\/p>/i);
      if (h2) {
        results.push({
          title: h2[2].replace(/<[^>]+>/g, "").trim(),
          url: h2[1],
          snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
        });
      }
      if (results.length >= 5) break;
    }
  } catch {}
  return results;
}

async function detectAI(text: string): Promise<{
  aiScore: number; level: string; summary: string;
  dimensions: { name: string; score: number; comment: string }[];
  markers: string[];
} | null> {
  const cfg = getModelConfig();
  if (!cfg) return null;

  // 截取前2000字，节省token
  const sample = text.substring(0, 2000);

  const prompt = `分析以下文章是AI生成还是真人写作的。评估AI化程度，5个维度，每个维度0-100分（分数越高越像AI）。

维度说明：
- 句式多样性: 分数高=句式单一工整像AI；分数低=长短错落像真人
- 用词自然度: 分数高=出现"首先其次""总而言之""值得注意的是"等模板词；分数低=用词自然
- 细节具体性: 分数高=抽象概括缺少细节像AI；分数低=有具体数字、场景、对话像真人
- 语气变化: 分数高=平稳书面语像AI；分数低=语气有起伏像真人
- 结构灵活性: 分数高=开头-分点-总结的模板结构像AI；分数低=结构随性像真人

只返回JSON，格式：
{"aiScore":65,"level":"偏AI","summary":"整体偏AI风格，句式较整齐，缺少细节","dimensions":[{"name":"句式多样性","score":70,"comment":"句子长度接近，缺少变化"},{"name":"用词自然度","score":60,"comment":"出现多处模板化连接词"},{"name":"细节具体性","score":75,"comment":"缺少具体案例和场景描写"},{"name":"语气变化","score":50,"comment":"语气平稳，缺少情感起伏"},{"name":"结构灵活性","score":70,"comment":"结构较模板化"}],"markers":["总而言之","值得注意的是","首先"]}
aiScore: 0=肯定真人写作, 100=肯定AI生成
level: "人工"|"偏人工"|"偏AI"|"AI"
只返回JSON，不要其他内容。`;

  try {
    const res = await fetch(cfg.apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: sample },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    // 提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();
    if (!title && !content) {
      return NextResponse.json({ error: "请提供标题或内容" }, { status: 400 });
    }

    const plainContent = content ? stripHtml(content) : "";
    const wordCount = countWords(plainContent);

    // 标题查重
    const titleMatches: { title: string; url: string; similarity: number }[] = [];
    if (title?.trim()) {
      const results = await searchBing(`"${title.trim()}"`);
      for (const r of results) {
        const sim = titleSimilarity(title.trim(), r.title);
        if (sim > 0.3) {
          titleMatches.push({ title: r.title, url: r.url, similarity: Math.round(sim * 100) });
        }
      }
    }

    // 内容抽样查重
    const contentMatches: { sentence: string; sourceTitle: string; url: string }[] = [];
    let totalSentences = 0;
    if (plainContent) {
      const sentences = extractSentences(plainContent, 5);
      totalSentences = sentences.length;
      for (const sentence of sentences) {
        const results = await searchBing(`"${sentence.substring(0, 30)}"`);
        const matched = results.some(r => {
          const sim = titleSimilarity(sentence, r.title + " " + r.snippet);
          return sim > 0.4;
        });
        if (matched && results.length > 0) {
          contentMatches.push({
            sentence: sentence.substring(0, 40) + (sentence.length > 40 ? "…" : ""),
            sourceTitle: results[0].title,
            url: results[0].url,
          });
        }
      }
    }

    // 综合查重评分
    let score = 100;
    const exactTitleMatch = titleMatches.some(m => m.similarity >= 90);
    const similarTitleMatch = titleMatches.some(m => m.similarity >= 50 && m.similarity < 90);
    if (exactTitleMatch) score -= 30;
    else if (similarTitleMatch) score -= 15;
    if (totalSentences > 0) {
      score -= Math.round((contentMatches.length / totalSentences) * 50);
    }
    score = Math.max(0, Math.min(100, score));
    const level = score >= 80 ? "高" : score >= 50 ? "中" : "低";

    // AI检测（有内容时才做，和查重并行）
    const aiDetection = plainContent ? await detectAI(plainContent) : null;

    return NextResponse.json({
      ok: true,
      score,
      level,
      wordCount,
      titleCheck: {
        matched: exactTitleMatch,
        similarCount: titleMatches.length,
        similar: titleMatches.slice(0, 5),
      },
      contentCheck: {
        totalSentences,
        matchedCount: contentMatches.length,
        matches: contentMatches,
      },
      aiDetection,
    });
  } catch (err: any) {
    console.error("[/api/ai/check-originality]", err);
    return NextResponse.json({ error: "检测失败" }, { status: 502 });
  }
}
