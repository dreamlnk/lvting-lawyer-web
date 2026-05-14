import { NextResponse } from "next/server";
import { getCategoriesWithCounts, createCategory } from "@/lib/db";

export async function GET() {
  try {
    const categories = await getCategoriesWithCounts();
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("[/api/categories GET]", error);
    return NextResponse.json({ error: "获取栏目失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: "名称和别名为必填" }, { status: 400 });
    }
    const id = await createCategory({ name: body.name, slug: body.slug, sort_order: body.sort_order || 0, description: body.description });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[/api/categories POST]", error);
    return NextResponse.json({ error: "创建栏目失败" }, { status: 500 });
  }
}
