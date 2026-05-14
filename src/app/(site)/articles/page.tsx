import Link from 'next/link';
import { Suspense } from 'react';
import Pagination from '@/components/Pagination';
import { getCategoriesWithCounts, getArticles } from '@/lib/db';

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ArticlesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1'));
  const categoryId = params.category ? parseInt(params.category) : undefined;

  const [cats, result] = await Promise.all([
    getCategoriesWithCounts(),
    getArticles({ page: currentPage, pageSize: PAGE_SIZE, categoryId }),
  ]);

  const total = result.total;
  const totalPages = result.totalPages;
  const currentCategory = categoryId
    ? cats.find(c => c.id === categoryId)
    : null;

  // 过滤掉非文章栏目：律师简介(jj)、律师风采(fengcai)、收费标准(shoufeibiaozhun)
  const hiddenSlugs = ['jj', 'fengcai', 'shoufeibiaozhun'];
  const visibleCats = cats.filter(c => !hiddenSlugs.includes(c.slug));

  const totalCount = visibleCats.reduce((sum, c) => sum + (c.article_count ?? 0), 0);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {currentCategory ? currentCategory.name : '文章列表'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {currentCategory
              ? `浏览${currentCategory.name}相关的专业文章`
              : '浏览吕婷律师的专业文章，了解各类法律知识和案例分析'}
          </p>
        </div>

        {/* 筛选栏 */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/articles"
            className={`px-4 py-2 rounded-lg transition-colors ${
              !categoryId
                ? 'bg-blue-900 text-white'
                : 'border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white'
            }`}
          >
            全部（{totalCount}）
          </Link>
          {visibleCats.map((cat) => (
            <Link
              key={cat.id}
              href={`/articles?category=${cat.id}`}
              className={`px-4 py-2 rounded-lg transition-colors ${
                categoryId === cat.id
                  ? 'bg-blue-900 text-white'
                  : 'border border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white'
              }`}
            >
              {cat.name}（{cat.article_count ?? 0}）
            </Link>
          ))}
        </div>

        {/* 文章数量 */}
        <p className="text-gray-500 text-sm mb-6 text-center">
          共 {total} 篇文章
        </p>

        {/* 文章列表 */}
        <div className="space-y-3 mb-12">
          {result.articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg shadow-sm px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <span className="bg-blue-100 text-blue-900 text-sm px-3 py-1 rounded-full whitespace-nowrap">
                {article.category?.name || '未分类'}
              </span>
              <h3 className="flex-1 text-lg font-medium hover:text-blue-900 transition-colors">
                <a href={(article as any).old_path || `/articles/${article.id}`} className="hover:text-blue-900 transition-colors">
                  {article.title}
                </a>
                {article.is_top === 1 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded">置顶</span>
                )}
              </h3>
              <div className="text-sm text-gray-500 whitespace-nowrap">
                <span className="mr-4">{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
                <span>{article.view_count}次阅读</span>
              </div>
            </article>
          ))}
        </div>

        {/* 空状态 */}
        {result.articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无文章</p>
          </div>
        )}

        {/* 分页 */}
        <Suspense fallback={<div className="h-12" />}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl={categoryId ? `/articles?category=${categoryId}` : '/articles'}
          />
        </Suspense>
      </div>
    </div>
  );
}
