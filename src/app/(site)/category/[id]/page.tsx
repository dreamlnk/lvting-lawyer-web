import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryById, getCategoryBySlug, getAllCategories, getArticles } from '@/lib/db';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

/** 查找分类：支持 id / old_classid / slug */
async function resolveCategory(id: string) {
  const num = parseInt(id);
  if (!isNaN(num)) {
    const byId = await getCategoryById(num);
    if (byId) return byId;
    const all = await getAllCategories();
    const byOld = all.find(c => c.old_classid === num);
    if (byOld) return byOld;
  }
  return getCategoryBySlug(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cat = await resolveCategory(id);
  if (!cat) return {};
  return {
    title: `${cat.name} - 苏州吕婷律师`,
    description: cat.description || `${cat.name}相关文章，吕婷律师专业法律服务。`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const catRow = await resolveCategory(id);
  if (!catRow) notFound();

  const articlesData = await getArticles({ categoryId: catRow.id, page: 1, pageSize: 20, status: "published" });
  const articles = articlesData.articles;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 分类标题 */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">{catRow.name}</h1>
          {catRow.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{catRow.description}</p>
          )}
        </div>

        {/* 文章列表 */}
        {articles.length === 0 ? (
          <p className="text-center text-gray-400 py-12">暂无文章</p>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => {
              const articleId = article.id as number;
              const href = (article as any).old_path || `/articles/${articleId}`;
              return (
                <Link
                  key={articleId}
                  href={href}
                  className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold hover:text-blue-900 flex-1">
                      {article.title as string}
                    </h2>
                    <span className="text-sm text-gray-400 whitespace-nowrap">
                      {article.published_at
                        ? new Date(article.published_at as string | Date).toISOString().split('T')[0]
                        : ''}
                    </span>
                  </div>
                  {article.summary != null && (
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {article.summary as string}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>{(article.view_count as number) || 0} 次阅读</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {articlesData.totalPages > 1 && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            共 {articlesData.total} 篇，当前第 {articlesData.page}/{articlesData.totalPages} 页
          </div>
        )}

        {/* 返回 */}
        <div className="mt-12 text-center">
          <Link href="/category" className="btn-secondary">
            ← 返回所有领域
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
