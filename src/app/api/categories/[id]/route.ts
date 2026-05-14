import { NextRequest, NextResponse } from "next/server";
import { getCategoryById, updateCategory, deleteCategory, type CategoryInput } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  try {
    const category = await getCategoryById(numericId);
    if (!category) {
      return NextResponse.json({ error: "栏目不存在" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (err) {
    console.error("[/api/categories/[id] GET]", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const input: Partial<CategoryInput> = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.slug !== undefined) input.slug = body.slug;
    if (body.description !== undefined) input.description = body.description;
    if (body.sortOrder !== undefined) input.sort_order = body.sortOrder;
    if (body.isVisible !== undefined) input.is_visible = body.isVisible;

    await updateCategory(numericId, input);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/categories/[id] PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  try {
    await deleteCategory(numericId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/categories/[id] DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
