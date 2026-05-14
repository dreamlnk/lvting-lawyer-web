import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "lvting2024";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ error: "用户名不存在" }, { status: 401 });
    }
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, message: "登录成功" });
    response.cookies.set("admin", "1", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 小时
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
