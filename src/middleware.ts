import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 保护 API 写操作（排除登录接口）
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin/login")) {
    const isWrite =
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.method !== "OPTIONS";

    if (isWrite) {
      const admin = req.cookies.get("admin");
      if (!admin?.value) {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
      }
      try {
        const data = JSON.parse(admin.value);
        if (!data.userId || !data.role) throw new Error();
        // 普通用户只允许 /api/ai/* /api/prompts/* /api/config
        if (data.role === "user") {
          const allowed = pathname.startsWith("/api/ai/") || pathname.startsWith("/api/prompts/") || pathname.startsWith("/api/config");
          if (!allowed) {
            return NextResponse.json({ error: "无权限" }, { status: 403 });
          }
        }
      } catch {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
