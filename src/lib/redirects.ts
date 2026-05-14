/**
 * 301重定向映射配置
 * 从帝国CMS迁移到新站
 * 
 * 旧站URL格式：
 *   文章: /e/action/ShowInfo/?classid=X&id=Y
 *   列表: /e/action/ListInfo/?classid=X&page=Y
 * 
 * 新站URL格式：
 *   文章: /articles/{id}
 *   栏目: /category/{id}
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 栏目ID映射 (旧classid → 新id)
export const CATEGORY_REDIRECTS: Record<string, string> = {
  '4': '/category/3',   // 律师风采
  '6': '/category/2',    // 律师简介  
  '8': '/category/1',    // 首页/关于我们
  '11': '/category/3',   // 律师风采
  '12': '/category/4',  // 刑事辩护
  '15': '/category/5',  // 婚姻家庭
  '16': '/category/6',  // 房产纠纷
  '17': '/category/7',  // 工伤交通
  '18': '/category/8',  // 公司劳务
  '19': '/category/9',  // 经济生活
};

// 特殊URL重定向（直接从URL到URL的映射）
export const EXACT_REDIRECTS: Record<string, string> = {
  '/index.html': '/',
  '/contact.html': '/contact',
  '/about.html': '/about',
  '/fees.html': '/fees',
  '/lawyers.html': '/about',
  '/news.html': '/articles',
  '/cases.html': '/articles',
  '/default.html': '/',
  '/e/diguo/css/index.css': '/styles/diguo.css', // 静态资源
};

// 文章详情页重定向正则
// 匹配: /e/action/ShowInfo/?classid=X&id=Y 或 /e/action/ShowInfo/?id=Y&classid=X
export function parseArticleRedirect(url: string): string | null {
  // 匹配 /e/action/ShowInfo/ 格式
  const showInfoMatch = url.match(/\/e\/action\/ShowInfo\/?.*(?:^|\?)id=(\d+)/);
  if (showInfoMatch) {
    const articleId = showInfoMatch[1];
    return `/articles/${articleId}`;
  }
  return null;
}

// 栏目列表页重定向正则
// 匹配: /e/action/ListInfo/?classid=X&page=Y
export function parseListRedirect(url: string): string | null {
  const listMatch = url.match(/\/e\/action\/ListInfo\/?.*(?:^|\?)classid=(\d+)/);
  if (listMatch) {
    const classid = listMatch[1];
    const categoryRedirect = CATEGORY_REDIRECTS[classid];
    if (categoryRedirect) {
      // 检查是否有页码参数
      const pageMatch = url.match(/page=(\d+)/);
      if (pageMatch && pageMatch[1] !== '1') {
        return `${categoryRedirect}?page=${pageMatch[1]}`;
      }
      return categoryRedirect;
    }
    // 未知栏目，重定向到首页
    return '/articles';
  }
  return null;
}

// 处理重定向的主函数
export function handleRedirect(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // 1. 检查精确匹配
  if (EXACT_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(EXACT_REDIRECTS[pathname], request.url), 301);
  }
  
  // 2. 检查首页变体
  if (pathname === '/index.htm' || pathname === '/index.php' || pathname === '/index') {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }
  
  // 3. 检查栏目页面
  const listRedirect = parseListRedirect(pathname + url.search);
  if (listRedirect) {
    return NextResponse.redirect(new URL(listRedirect, request.url), 301);
  }
  
  // 4. 检查文章页面
  const articleRedirect = parseArticleRedirect(pathname + url.search);
  if (articleRedirect) {
    return NextResponse.redirect(new URL(articleRedirect, request.url), 301);
  }
  
  // 5. 检查 /e/ 路径下的其他请求
  if (pathname.startsWith('/e/')) {
    // 无法识别的帝国CMS路径，尝试提取ID
    const idMatch = pathname.match(/id=(\d+)/);
    if (idMatch) {
      return NextResponse.redirect(new URL(`/articles/${idMatch[1]}`, request.url), 301);
    }
    // 重定向到首页
    return NextResponse.redirect(new URL('/', request.url), 301);
  }
  
  return null;
}
