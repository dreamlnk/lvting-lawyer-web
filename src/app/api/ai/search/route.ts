import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    const results: { title: string; url: string; snippet: string }[] = [];

    // 提取核心搜索词：去问词、去口语
    const qwords = /[吗呢吧啊哦呀]|[能否]不能|[可好]不可以|[会要]不要|是不是|有没有|怎么办|怎么做|怎样|如何|怎么|什么|为啥|为何/g;
    const searchQuery = keyword.trim().replace(qwords, " ").replace(/[？?！!，,。、：:\s]+/g, " ").trim();
    const queries = searchQuery !== keyword.trim() ? [keyword.trim(), searchQuery] : [keyword.trim()];

    // Bing 搜索
    try {
      const seenUrls = new Set<string>();

      for (const q of queries) {
        if (results.length >= 8) break;
        const res = await fetch(
          `https://cn.bing.com/search?q=${encodeURIComponent(q)}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "zh-CN,zh;q=0.9",
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!res.ok) continue;
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
            if (url.includes("go.microsoft.com") || url.includes("baike.baidu.com") || seenUrls.has(url)) continue;
            seenUrls.add(url);
            results.push({
              title: h2Match[2].replace(/<[^>]+>/g, "").trim(),
              url,
              snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
            });
          }
          if (results.length >= 8) break;
        }
      }
    } catch (e) {
      console.error("[search] Bing failed:", (e as Error).message);
    }

    // Bing 没结果，百度兜底
    if (results.length === 0) {
      try {
        const res = await fetch(
          `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "zh-CN,zh;q=0.9",
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          const html = await res.text();
          const itemRegex = /<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*c-abstract[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
          let match;
          while ((match = itemRegex.exec(html)) !== null) {
            const item = match[0];
            const t = item.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>/i);
            const s = item.match(/<div[^>]*class="c-abstract"[^>]*>([\s\S]*?)<\/div>/i);
            if (t && !t[1].includes("baike.baidu.com") && !t[1].includes("gov.cn")) {
              results.push({
                url: t[1],
                title: item.replace(/<[^>]+>/g, "").substring(0, 80).trim(),
                snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
              });
            }
            if (results.length >= 8) break;
          }
        }
      } catch (e) {
        console.error("[search] Baidu fallback failed:", (e as Error).message);
      }
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
