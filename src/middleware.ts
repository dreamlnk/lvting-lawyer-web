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
      if (admin?.value !== "1") {
        return NextResponse.json({ error: "未授权" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
