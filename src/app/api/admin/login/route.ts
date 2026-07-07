import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, hashPassword } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const user = await getUserByUsername(username);
    if (!user || user.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const payload = JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      message: "登录成功",
      user: { id: user.id, username: user.username, role: user.role },
    });

    response.cookies.set("admin", payload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" as const : "lax" as const,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    // 非 httpOnly 用于前端显示用户名
    response.cookies.set("user_info", JSON.stringify({ userId: user.id, username: user.username, role: user.role }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? "none" as const : "lax" as const,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
