import { NextResponse } from "next/server";
import { getSiteConfig, setSiteConfig } from "@/lib/db";

const PAGE_KEYS = ["about", "fengcai", "fees"];
const PAGE_LABELS: Record<string, string> = {
  about: "律师简介",
  fengcai: "律师风采",
  fees: "收费标准",
};

export async function GET() {
  try {
    const pages = await Promise.all(
      PAGE_KEYS.map(async (slug) => {
        const content = await getSiteConfig(`page_${slug}`);
        return { slug, label: PAGE_LABELS[slug], content: content || "" };
      })
    );
    return NextResponse.json({ data: pages });
  } catch (error) {
    console.error("[/api/admin/site/pages GET]", error);
    return NextResponse.json({ error: "获取页面失败" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { slug, content } = body;
    if (!slug || !PAGE_KEYS.includes(slug)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }
    await setSiteConfig(`page_${slug}`, content || "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/admin/site/pages PUT]", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
