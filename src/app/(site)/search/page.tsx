import Link from 'next/link';
import { Suspense } from 'react';
import SearchBox from '@/components/SearchBox';
import Pagination from '@/components/Pagination';

// 分页配置
const PAGE_SIZE = 10;

// 模拟搜索结果
function searchArticles(query: string) {
  // TODO: 从API搜索
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/search?q=${query}`);
  
  // 临时返回模拟数据
  const allArticles = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    title: `${query}相关的法律文章 ${i + 1}`,
    summary: `关于${query}的专业法律分析和案例解读，帮助您了解相关法律知识和实务操作。`,
    category: ['刑事辩护', '婚姻家庭', '房产纠纷', '工伤交通'][i % 4],
    categoryId: [4, 5, 6, 7][i % 4],
    date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    views: Math.floor(Math.random() * 5000) + 100,
  }));
  
  // 简单过滤模拟搜索
  return allArticles;
}

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || '';
  return {
    title: query ? `搜索: ${query} - 吕婷律师` : '搜索 - 吕婷律师',
    description: `在吕婷律师网站搜索${query}相关文章`,
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const currentPage = parseInt(params.page || '1');
  
  const results = searchArticles(query);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const paginatedResults = results.slice(start, end);
  const totalPages = Math.ceil(results.length / PAGE_SIZE);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">搜索</h1>
          
          {/* 搜索框 */}
          <Suspense fallback={<div className="h-12" />}>
            <div className="max-w-xl">
              <SearchBox />
            </div>
          </Suspense>
        </div>

        {query ? (
          <>
            {/* 搜索结果统计 */}
            <div className="mb-6">
              <p className="text-gray-600">
                关键词 "<span className="font-semibold">{query}</span>" 
                找到约 {results.length} 个结果
              </p>
            </div>

            {/* 搜索结果列表 */}
            {paginatedResults.length > 0 ? (
              <div className="space-y-6 mb-12">
                {paginatedResults.map((article) => (
                  <article
                    key={article.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-900 text-sm px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500 text-sm">{article.date}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2 hover:text-blue-900 transition-colors">
                      <a href={(article as any).old_path || `/articles/${article.id}`} className="hover:text-blue-900 transition-colors">
                        {article.title}
                      </a>
                    </h2>
                    <p className="text-gray-600 mb-2">{article.summary}</p>
                    <div className="text-sm text-gray-500">
                      阅读 {article.views} 次
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 mb-4">未找到相关结果</p>
                <p className="text-gray-400 text-sm">
                  尝试使用不同的关键词，或浏览我们的{" "}
                  <Link href="/articles" className="text-blue-900 hover:underline">
                    文章列表
                  </Link>
                </p>
              </div>
            )}

            {/* 分页 */}
            {paginatedResults.length > 0 && (
              <Suspense fallback={<div className="h-12" />}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={`/search?q=${encodeURIComponent(query)}`}
                />
              </Suspense>
            )}
          </>
        ) : (
          /* 空搜索状态 */
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">请输入搜索关键词</p>
            <p className="text-gray-400 text-sm">
              浏览我们的{" "}
              <Link href="/articles" className="text-blue-900 hover:underline">
                文章列表
              </Link>
              {" "}或使用顶部搜索框
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
