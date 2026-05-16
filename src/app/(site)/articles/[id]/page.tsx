import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getFullArticle, getLatestArticles } from '@/lib/db';
import ViewCounter from '@/components/ViewCounter';
import '../article-themes.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getFullArticle(parseInt(id));

  if (!article) {
    return { title: '文章未找到 - 吕婷律师' };
  }

  const plainText = article.content.replace(/<[^>]*>/g, '').slice(0, 160);

  return {
    title: `${article.title} - 吕婷律师`,
    description: plainText,
    openGraph: {
      title: article.title,
      description: plainText,
      type: 'article',
      publishedTime: article.published_at,
      authors: ['吕婷律师'],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const articleId = parseInt(id);
  const article = await getFullArticle(articleId);

  if (!article) {
    notFound();
  }

  // 获取相关文章（同栏目，排除当前文章）
  const sameCategory = article.category_id
    ? await getLatestArticles(4, article.category_id)
    : [];
  const related = sameCategory.filter(a => a.id !== articleId).slice(0, 3);

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 面包屑导航 */}
        <nav className="mb-6 text-sm text-gray-500 bg-white px-5 py-3 rounded-lg shadow-sm">
          <Link href="/" className="hover:text-blue-900 transition-colors">首页</Link>
          <span className="mx-2">/</span>
          {article.category && (
            <>
              <Link href={`/category/${article.category.id}`} className="hover:text-blue-900 transition-colors">
                {article.category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900 font-medium truncate inline-block max-w-[300px] align-bottom">{article.title}</span>
        </nav>

        {/* 文章主体卡片 */}
        <article className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 头部 */}
          <div className="px-6 md:px-10 pt-8 pb-6 border-b border-gray-100">
            {/* 栏目标签 */}
            {article.category && (
              <Link
                href={`/category/${article.category.id}`}
                className="inline-block bg-blue-900 text-white text-xs px-3 py-1 rounded-full mb-4 hover:bg-blue-800 transition-colors"
              >
                {article.category.name}
              </Link>
            )}

            {/* 标题 */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4">
              {article.title}
            </h1>

            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                吕婷律师
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {new Date(article.published_at).toLocaleDateString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {article.view_count} 次阅读
              </span>
            </div>
          </div>

          {/* 正文 */}
          <div className="px-6 md:px-10 py-8">
            {article.subtitle && (
              <p className="text-gray-500 text-base mb-6 italic border-l-4 border-blue-200 pl-4">
                {article.subtitle}
              </p>
            )}
            <div
              className="article-body theme-classic"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>

        {/* 联系栏 */}
        <div className="bg-blue-900 text-white rounded-xl p-6 md:p-8 mt-8 text-center">
          <h3 className="text-xl font-bold mb-2">需要法律帮助？</h3>
          <p className="text-blue-200 mb-4">吕婷律师为您提供专业法律咨询服务</p>
          <a href="/contact" className="inline-block bg-yellow-500 text-blue-900 font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
            立即咨询
          </a>
        </div>

        {/* 相关推荐 */}
        {related.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">相关文章推荐</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((a) => (
                <a
                  key={a.id}
                  href={(a as any).old_path || `/articles/${a.id}`}
                  className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
                >
                  <span className="text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {article.category?.name}
                  </span>
                  <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed">
                    {a.title}
                  </h4>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date(a.published_at).toLocaleDateString('zh-CN')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 浏览计数 */}
      <ViewCounter articleId={articleId} />

      {/* 返回 */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-500 hover:text-blue-900 text-sm transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
