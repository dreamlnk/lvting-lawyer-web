import { NextRequest, NextResponse } from "next/server";

// 已知有效的 FORM+PC 组合，Bing 改参数时加新的即可
const PARAMS_SETS = [
  "form=ANNTH1&pc=CNNDDB",
  "form=ANNTA1&pc=PCMEDGEDP",
];

function looksLikeDictionary(title: string, url: string): boolean {
  const dictDomains = ["baike.baidu.com", "zdic.net", "hanyuguoxue.com", "gushici.net", "hancibao.com", "zidian.", "qianp.com", "dict."];
  if (dictDomains.some(d => url.includes(d))) return true;
  if (/的意思|的读音|的拼音|的解释|的笔顺|怎么读|怎么念|怎么讲/.test(title)) return true;
  if (/字典|词典|汉典|百科|国学|辞海|辞源/.test(title)) return true;
  if (/^[一二三四五六七八九十百千万亿](_|，|：)/.test(title)) return true;
  if (/^.\s*(汉语|词语|汉字)/.test(title)) return true;
  return false;
}

// 计算查询词和结果标题的重叠度，判断是否跑偏
function relevance(title: string, query: string): number {
  const qChars = new Set(query.replace(/\s+/g, ""));
  let hit = 0;
  for (const c of title) { if (qChars.has(c)) hit++; }
  return hit / Math.max(title.length, 1);
}

async function fetchBing(query: string, params: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const results: { title: string; url: string; snippet: string }[] = [];
  const seenUrls = new Set<string>();

  const res = await fetch(
    `https://www.bing.com/search?q=${encodeURIComponent(query)}&${params}&setmkt=zh-CN&cc=cn`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) return results;

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
      if (looksLikeDictionary(title, url)) continue;
      seenUrls.add(url);
      results.push({
        title,
        url,
        snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
      });
    }
    if (results.length >= 8) break;
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    const query = keyword.trim();
    let best = await fetchBing(query, PARAMS_SETS[0]);

    // 自愈：结果跑偏则换参数组合重试
    if (best.length > 0) {
      const avgRel = best.slice(0, 3).reduce((s, r) => s + relevance(r.title, query), 0) / Math.min(3, best.length);
      if (avgRel < 0.3) {
        for (let i = 1; i < PARAMS_SETS.length; i++) {
          const retry = await fetchBing(query, PARAMS_SETS[i]);
          if (retry.length > 0) {
            const retryRel = retry.slice(0, 3).reduce((s, r) => s + relevance(r.title, query), 0) / Math.min(3, retry.length);
            if (retryRel > avgRel) {
              best = retry;
              break;
            }
          }
        }
      }
    }

    if (best.length === 0) {
      return NextResponse.json({ ok: false, error: "未找到相关结果，请换个关键词试试" });
    }

    return NextResponse.json({ ok: true, results: best });
  } catch (err: any) {
    console.error("[/api/ai/search]", err);
    return NextResponse.json({ error: "搜索失败" }, { status: 502 });
  }
}
