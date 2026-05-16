import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  try {
    await incrementViewCount(articleId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/articles/[id]/view POST]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
