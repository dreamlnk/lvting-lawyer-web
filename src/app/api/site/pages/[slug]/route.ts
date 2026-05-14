import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/db";

const VALID_SLUGS = ["about", "fengcai", "fees"];

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "页面不存在" }, { status: 404 });
  }
  try {
    const content = await getSiteConfig(`page_${slug}`);
    return NextResponse.json({ slug, content: content || "" });
  } catch (error) {
    console.error("[/api/site/pages/[slug] GET]", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
