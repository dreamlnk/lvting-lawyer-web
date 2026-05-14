import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const categoryId = searchParams.get("categoryId");
    const keyword = searchParams.get("search") || undefined;

    const result = await getArticles({
      page,
      pageSize,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      keyword,
    });

    return NextResponse.json({ data: result.articles, pagination: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages } });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "获取文章列表失败" }, { status: 500 });
  }
}
