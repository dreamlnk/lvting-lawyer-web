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
  const dictDomains = ["baike.baidu.com", "zdic.net", "hanyuguoxue.com", "gushici.net", "hancibao.com", "zidian.", "qianp.com", "dict."];
  if (dictDomains.some(d => url.includes(d))) return true;
  // 标题带词典/字典/百科特征
  if (/的意思|的读音|的拼音|的解释|的笔顺|怎么读|怎么念|怎么讲/.test(title)) return true;
  if (/字典|词典|汉典|百科|国学|辞海|辞源/.test(title)) return true;
  // 标题是单字或单字+_
  if (/^[一二三四五六七八九十百千万亿](_|，|：)/.test(title)) return true;
  if (/^.\s*(汉语|词语|汉字)/.test(title)) return true;
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

    // 搜索 Bing
    async function bingSearch(query: string, extraParams = ""): Promise<void> {
      try {
        const res = await fetch(
          `https://cn.bing.com/search?q=${encodeURIComponent(query)}${extraParams}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "zh-CN,zh;q=0.9",
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!res.ok) return;
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
      } catch {}
    }

    // 并发搜索：原始词 + 去问词版 + 浏览器版 + 长词组版
    const qwords = /[吗呢吧啊哦呀]|[能否]不能|[可好]不可以|[会要]不要|是不是|有没有|怎么办|怎么做|怎样|如何|怎么|什么|为啥|为何/g;
    const cleaned = keyword.trim().replace(qwords, " ").replace(/[？?！!，,。、：:\s]+/g, " ").trim();
    const phrases = extractKeyPhrases(keyword.trim());

    const tasks = [bingSearch(keyword.trim())];
    if (cleaned !== keyword.trim()) tasks.push(bingSearch(cleaned));
    tasks.push(bingSearch(keyword.trim(), "&pc=CNNDDB&adppc=EDGESSB"));
    if (phrases) tasks.push(bingSearch(phrases));

    await Promise.all(tasks);

    if (results.length === 0) {
      return NextResponse.json({ ok: false, error: "未找到相关结果，请换个关键词试试" });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("[/api/ai/search]", err);
    return NextResponse.json({ error: "搜索失败" }, { status: 502 });
  }
}
