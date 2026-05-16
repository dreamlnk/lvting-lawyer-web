import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    // 查询所有文章的 id、content、summary
    const stmt = db.prepare("SELECT id, content, summary FROM articles");
    const ids: number[] = [];
    const newContents: string[] = [];
    const newSummaries: (string | null)[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      const id = row.id as number;
      let content = (row.content as string) || "";
      let summary = (row.summary as string) || "";

      const hasContent = content.includes("[Unsupported Image]");
      const hasSummary = summary.includes("[Unsupported Image]");

      if (hasContent || hasSummary) {
        if (hasContent) content = content.replace(/\[Unsupported Image\]/gi, "");
        if (hasSummary) summary = summary.replace(/\[Unsupported Image\]/gi, "");
        ids.push(id);
        newContents.push(content);
        newSummaries.push(summary);
      }
    }
    stmt.free();

    // 批量更新
    for (let i = 0; i < ids.length; i++) {
      db.run("UPDATE articles SET content = ?, summary = ? WHERE id = ?", [
        newContents[i], newSummaries[i], ids[i],
      ]);
    }

    saveDb();
    return NextResponse.json({ ok: true, cleaned: ids.length });
  } catch (err: any) {
    console.error("[/api/admin/cleanup]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
