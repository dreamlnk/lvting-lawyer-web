import { NextRequest, NextResponse } from "next/server";
import { getFullArticle } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const id = parseInt(slug);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const article = await getFullArticle(id);
    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
  }
}
