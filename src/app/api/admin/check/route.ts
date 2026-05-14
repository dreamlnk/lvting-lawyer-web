import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const admin = req.cookies.get("admin");
  if (admin?.value === "1") {
    return NextResponse.json({ loggedIn: true });
  }
  return NextResponse.json({ loggedIn: false }, { status: 401 });
}
