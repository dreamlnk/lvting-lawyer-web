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

  // 2. 如果是登录页，不检查认证
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 3. 检查 admin 路由认证
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      // 未登录，重定向到登录页
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
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
