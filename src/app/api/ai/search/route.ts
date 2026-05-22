import { NextRequest, NextResponse } from "next/server";

// 从中文查询中提取长词组（>=3个字），用于 Bing 锚错单字时的兜底搜索
function extractKeyPhrases(text: string): string {
  // 去问词、去口语、去标点、去数字
  const cleaned = text
    .replace(/[吗呢吧啊哦呀]|[能否]不能|[可好]不可以|[会要]不要|是不是|有没有|怎么办|怎么做|怎样|如何|怎么|什么|为啥|为何/g, " ")
    .replace(/[？?！!，,。、：:\s\d]+/g, " ")
    .trim();
  // 提取连续中文 >= 3 字的片段，取最长的不超过 5 个
  const segments = cleaned.match(/[一-鿿]{3,}/g) || [];
  segments.sort((a, b) => b.length - a.length);
  return segments.slice(0, 5).join(" ");
}

// 判断结果是否都是词典释义（说明 Bing 锚错了单字）
function looksLikeDictionary(title: string, url: string): boolean {
  const dictDomains = ["baike.baidu.com", "zdic.net", "hanyuguoxue.com", "gushici.net", "hancibao.com", "zidian.", "qianp.com"];
  if (dictDomains.some(d => url.includes(d))) return true;
  if (/^[一二三四五六七八九十百千万亿]$/.test(title)) return true;
  if (/[（(].{0,4}汉语.{0,4}[)）]/.test(title)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    const results: { title: string; url: string; snippet: string }[] = [];
    const seenUrls = new Set<string>();

    // 搜索 Bing，收集结果的同时检测是否为词典结果
    async function bingSearch(query: string): Promise<number> {
      let count = 0;
      if (results.length >= 8) return 0;
      try {
        const res = await fetch(
          `https://cn.bing.com/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "zh-CN,zh;q=0.9",
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!res.ok) return 0;
        const html = await res.text();
        const itemRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
        let match;
        while ((match = itemRegex.exec(html)) !== null) {
          const item = match[1];
          const h2Match = item.match(/<h2[^>]*>\s*<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          const s = item.match(/<p class="b_lineclamp\d*">([\s\S]*?)<\/p>/i)
            || item.match(/<div class="b_caption"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
          if (h2Match) {
            const url = h2Match[1];
            const title = h2Match[2].replace(/<[^>]+>/g, "").trim();
            if (url.includes("go.microsoft.com") || seenUrls.has(url)) continue;
            // 词典结果不计入正常结果
            if (looksLikeDictionary(title, url)) continue;
            seenUrls.add(url);
            results.push({
              title,
              url,
              snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
            });
            count++;
          }
          if (results.length >= 8) break;
        }
      } catch {}
      return count;
    }

    // 1. 原始查询
    await bingSearch(keyword.trim());

    // 2. 如果结果少于 3 条，尝试去问词版本
    if (results.length < 3) {
      const qwords = /[吗呢吧啊哦呀]|[能否]不能|[可好]不可以|[会要]不要|是不是|有没有|怎么办|怎么做|怎样|如何|怎么|什么|为啥|为何/g;
      const cleaned = keyword.trim().replace(qwords, " ").replace(/[？?！!，,。、：:\s]+/g, " ").trim();
      if (cleaned !== keyword.trim()) await bingSearch(cleaned);
    }

    // 3. 仍少于 3 条，用长词组兜底
    if (results.length < 3) {
      const phrases = extractKeyPhrases(keyword.trim());
      if (phrases) await bingSearch(phrases);
    }

    if (results.length === 0) {
      return NextResponse.json({ ok: false, error: "未找到相关结果，请换个关键词试试" });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("[/api/ai/search]", err);
    return NextResponse.json({ error: "搜索失败" }, { status: 502 });
  }
}
