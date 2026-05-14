import { NextRequest, NextResponse } from "next/server";
import { downloadImagesInHtml, extractImageUrls } from "@/lib/image-download";

/**
 * POST /api/upload/download-images
 *
 * 请求体:
 *   { html: string }          — 传入 HTML，自动提取所有外部图片并下载
 *   { urls: string[] }        — 直接传入图片 URL 列表
 *
 * 响应:
 *   { ok: true, html: string, images: { original, local, error? }[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.html) {
      // 从 HTML 中提取并下载图片
      const result = await downloadImagesInHtml(body.html);
      return NextResponse.json({ ok: true, html: result.html, images: result.images });
    }

    if (body.urls && Array.isArray(body.urls)) {
      // 直接下载指定的 URL 列表
      const urls = body.urls.filter((u: string) => u.startsWith("http"));
      if (urls.length === 0) {
        return NextResponse.json({ ok: true, html: "", images: [] });
      }
      const result = await downloadImagesInHtml(urls.map((u: string) => `<img src="${u}">`).join(""));
      return NextResponse.json({ ok: true, html: "", images: result.images });
    }

    return NextResponse.json({ ok: false, error: "请提供 html 或 urls 参数" }, { status: 400 });
  } catch (err: any) {
    console.error("[/api/upload/download-images]", err);
    return NextResponse.json({ ok: false, error: err?.message || "服务器错误" }, { status: 500 });
  }
}
