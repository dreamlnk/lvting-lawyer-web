import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CSS_PATH = path.join(process.cwd(), "node_modules", "suneditor", "dist", "suneditor.min.css");

export async function GET() {
  try {
    const css = fs.readFileSync(CSS_PATH, "utf-8");
    return new NextResponse(css, {
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("/* not found */", {
      status: 404,
      headers: { "Content-Type": "text/css" },
    });
  }
}
