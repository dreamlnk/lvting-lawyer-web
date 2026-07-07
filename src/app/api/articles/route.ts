import { NextRequest, NextResponse } from "next/server";
import { getArticles, createArticle, type ArticleInput } from "@/lib/db";
import { downloadImagesInHtml } from "@/lib/image-download";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  const page = rawPage ? parseInt(rawPage) : 1;
  const pageSize = rawLimit ? parseInt(rawLimit) : parseInt(searchParams.get("pageSize") || "20");
  const categoryId = searchParams.get("categoryId");
  const keyword = searchParams.get("keyword") || undefined;
  const rawStatus = searchParams.get("status");
  const status = (!rawStatus || rawStatus === "all") ? undefined : rawStatus;

  try {
    const result = await getArticles({
      page,
      pageSize,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      keyword,
      status,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/articles GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 本地保存
    const { html: processedContent, images } = await downloadImagesInHtml(body.content || "");
    const input: ArticleInput = {
      title: body.title,
      subtitle: body.ftitle || body.subtitle || null,
      content: processedContent,
      summary: body.summary || null,
      categoryId: Number(body.categoryId),
      coverImage: body.coverImage || null,
      author: body.author || "吕婷律师",
      source: body.source || null,
      isTop: body.isTop || false,
      status: body.status || "published",
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    };
    const newId = await createArticle(input);
    return NextResponse.json({ ok: true, id: newId });
  } catch (err: any) {
    console.error("[/api/articles POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
