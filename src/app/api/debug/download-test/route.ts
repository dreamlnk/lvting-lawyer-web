import { NextRequest, NextResponse } from "next/server";
import { downloadImagesInHtml, extractImageUrls } from "@/lib/image-download";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const html = body.html || "";

    // 1. 测试 URL 提取
    const urls = extractImageUrls(html);
    console.log("[Debug] extractImageUrls found:", urls.length, urls);

    // 2. 测试下载
    const result = await downloadImagesInHtml(html);
    console.log("[Debug] download result images:", result.images.length);
    for (const img of result.images) {
      console.log(`[Debug]   ${img.original} → ${img.local || "FAIL: " + img.error}`);
    }

    return NextResponse.json({
      ok: true,
      urlsFound: urls.length,
      urls,
      imagesDownloaded: result.images.filter(i => i.local).length,
      imagesFailed: result.images.filter(i => i.error).length,
      details: result.images,
      htmlChanged: html !== result.html,
    });
  } catch (err: any) {
    console.error("[Debug] error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
