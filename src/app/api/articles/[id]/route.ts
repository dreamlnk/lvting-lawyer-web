import { NextRequest, NextResponse } from "next/server";
import { getArticleById, getArticleContent, updateArticle, deleteArticle, type ArticleInput } from "@/lib/db";
import { downloadImagesInHtml, extractLocalImageFilenames } from "@/lib/image-download";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "images");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const article = await getArticleById(articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const content = await getArticleContent(articleId);

    return NextResponse.json({
      ...article,
      content: content || "",
    });
  } catch (err) {
    console.error("[/api/articles/[id] GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const input: Partial<ArticleInput> = {};
    if (body.title !== undefined)       input.title = body.title;
    if (body.subtitle !== undefined)    input.subtitle = body.subtitle || null;
    if (body.content !== undefined) {
      // 自动下载内容中的外部图片
      const { html: processedContent } = await downloadImagesInHtml(body.content);
      input.content = processedContent;
    }
    if (body.summary !== undefined)     input.summary = body.summary || null;
    if (body.categoryId !== undefined) input.categoryId = Number(body.categoryId);
    if (body.coverImage !== undefined) input.coverImage = body.coverImage || null;
    if (body.author !== undefined)      input.author = body.author;
    if (body.source !== undefined)      input.source = body.source || null;
    if (body.isTop !== undefined)       input.isTop = body.isTop;
    if (body.status !== undefined)      input.status = body.status;
    if (body.publishedAt !== undefined) input.publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
    if (body.pubGzh !== undefined) input.pubGzh = body.pubGzh;
    if (body.pubBjh !== undefined) input.pubBjh = body.pubBjh;
    if (body.pubTt !== undefined) input.pubTt = body.pubTt;
    if (body.pubXhs !== undefined) input.pubXhs = body.pubXhs;

    await updateArticle(articleId, input);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/articles/[id] PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // 删除前获取文章内容，清理关联的本地图片
    const content = await getArticleContent(articleId);
    if (content) {
      const filenames = extractLocalImageFilenames(content);
      for (const filename of filenames) {
        const filepath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log("[Delete] removed image:", filename);
        }
      }
    }

    await deleteArticle(articleId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/articles/[id] DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
