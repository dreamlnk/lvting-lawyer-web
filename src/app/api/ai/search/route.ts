import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || !keyword.trim()) {
      return NextResponse.json({ error: "请输入关键词" }, { status: 400 });
    }

    // 用 Bing 的 syndicated API 获取搜索结果（JSON 格式，比 HTML 稳定）
    const results: { title: string; url: string; snippet: string }[] = [];

    // 尝试 Bing 搜索
    try {
      const bingRes = await fetch(
        `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "zh-CN,zh;q=0.9",
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (bingRes.ok) {
        const html = await bingRes.text();
        const itemRegex = /<li class="b_algo"[^>]*>[\s\S]*?<\/li>/gi;
        let match;
        while ((match = itemRegex.exec(html)) !== null) {
          const item = match[0];
          const t = item.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
          const s = item.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
          if (t && !t[1].includes("baike.baidu.com") && !t[1].includes("gov.cn")) {
            results.push({
              title: t[2].replace(/<[^>]+>/g, "").trim(),
              url: t[1],
              snippet: s ? s[1].replace(/<[^>]+>/g, "").trim() : "",
            });
          }
          if (results.length >= 8) break;
        }
      }
    } catch {}

    // 如果 Bing 没结果，尝试百度
    if (results.length === 0) {
      try {
        const bdRes = await fetch(
          `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "zh-CN,zh;q=0.9",
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (bdRes.ok) {
          const html = await bdRes.text();
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
      } catch {}
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
