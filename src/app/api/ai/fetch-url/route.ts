import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "请输入有效的链接地址" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `无法访问该链接 (HTTP ${res.status})` }, { status: 502 });
    }

    const html = await res.text();

    // 用 Readability 精确提取正文
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    let title = "";
    let text = "";

    if (article) {
      title = article.title || "";
      text = stripHtml(article.textContent || "");
    } else {
      // 兜底：去掉常见非正文区域后转纯文本
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : "";
      text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "");
      text = stripHtml(text);
    }

    const MAX_LEN = 8000;
    if (text.length > MAX_LEN) {
      text = text.substring(0, MAX_LEN) + "...（内容过长，已截断）";
    }

    return NextResponse.json({ ok: true, title, content: text, url });
  } catch (err: any) {
    console.error("[/api/ai/fetch-url]", err);
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "链接访问超时" }, { status: 504 });
    }
    return NextResponse.json({ error: "无法获取链接内容" }, { status: 502 });
  }
}
