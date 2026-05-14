import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// 允许的旧栏目目录
const ALLOWED_DIRS = [
  'xingshibianhu', 'hunyinjiating', 'jiaotongshigu',
  'laodonggongshang', 'fangchan', 'jingjihetong',
  'fengcai', 'cx', 'shoufeibiaozhun', 'jj', 'e', 'd',
];

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 如果没有slug，不处理（交给其他路由）
  if (!slug || slug.length === 0) {
    notFound();
    return;
  }

  // 构建文件路径
  const filePath = slug.join('/');

  // 检查是否符合旧文章URL模式：{dir}/{id}.html
  const match = filePath.match(/^([^/]+)\/(\d+)\.html$/);
  if (!match) {
    notFound();
    return;
  }

  const [, dir, id] = match;

  // 检查是否在允许的目录中
  if (!ALLOWED_DIRS.includes(dir)) {
    notFound();
    return;
  }

  // 读取静态HTML文件
  const fullPath = path.join(process.cwd(), 'public', filePath);

  try {
    const htmlContent = fs.readFileSync(fullPath, 'utf-8');

    // 检查文件是否有效（是否以HTML标签开头）
    const trimmed = htmlContent.trim();
    if (!trimmed.startsWith('<')) {
      // 文件损坏，尝试通过ID跳转
      const match = filePath.match(/(\d+)\.html$/);
      if (match) {
        const articleId = parseInt(match[1]);
        // 查找文章数据库中的真实ID
        return (
          <html>
            <head>
              <meta httpEquiv="refresh" content={`0;url=/articles/${articleId}`} />
            </head>
            <body><p>文件损坏，正在跳转...</p></body>
          </html>
        );
      }
      notFound();
      return;
    }

    // 返回HTML内容
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>苏州律师吕婷 - 专业法律服务</title>
        </head>
        <body dangerouslySetInnerHTML={{ __html: extractBody(htmlContent) }} />
      </html>
    );
  } catch {
    notFound();
    return;
  }
}

export async function generateStaticParams() {
  return [];
}

// 从完整HTML中提取body内容
function extractBody(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1];
  }
  return html;
}
