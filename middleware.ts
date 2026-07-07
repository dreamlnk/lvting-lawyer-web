import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleRedirect } from '@/lib/redirects';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 检查301重定向（旧帝国CMS URL）
  const redirectResponse = handleRedirect(request);
  if (redirectResponse) {
    return redirectResponse;
  }

  // 2. admin 页面认证与角色控制
  const adminCookie = request.cookies.get("admin");
  let auth: { userId: number; username: string; role: string } | null = null;
  if (adminCookie?.value) {
    try { auth = JSON.parse(adminCookie.value); } catch {}
  }

  // 登录页：已登录则跳转对应首页
  if (pathname === '/admin/login') {
    if (auth) {
      const target = auth.role === "admin" ? "/admin" : "/admin/ai-tool";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // admin 路由：未登录跳登录页
  if (pathname.startsWith('/admin')) {
    if (!auth) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
    // 普通用户只能访问 ai-tool
    if (auth.role === "user" && !pathname.startsWith('/admin/ai-tool')) {
      return NextResponse.redirect(new URL('/admin/ai-tool', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 排除静态文件、API路由、栏目目录（旧文章，这些走 public/ 静态文件）
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)|xingshibianhu|hunyinjiating|jiaotongshigu|laodonggongshang|fangchan|jingjihetong|fengcai|cx|shoufeibiaozhun|jj|e|d).*)',
  ],
};
