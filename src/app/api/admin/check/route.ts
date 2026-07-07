import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin");
  if (cookie?.value) {
    try {
      const data = JSON.parse(cookie.value);
      if (data.userId && data.role) {
        return NextResponse.json({ loggedIn: true, userId: data.userId, username: data.username, role: data.role });
      }
    } catch {}
  }
  return NextResponse.json({ loggedIn: false }, { status: 401 });
}
