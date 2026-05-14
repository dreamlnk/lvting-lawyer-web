import { getArticleCount, getCategories, getLatestArticles } from "@/lib/db";
import Link from "next/link";

export default async function Dashboard() {
  const [articleCount, categoryCount, recentArticles] = await Promise.all([
    getArticleCount(),
    getCategories().then((c) => c.length),
    getLatestArticles(5),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">{articleCount}</div>
          <div className="text-gray-500 mt-1">文章总数</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">{categoryCount}</div>
          <div className="text-gray-500 mt-1">栏目总数</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-3xl font-bold text-orange-600">{recentArticles.length}</div>
          <div className="text-gray-500 mt-1">最近新增</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">最近文章</h2>
          <Link
            href="/admin/articles"
            className="text-sm text-blue-600 hover:underline"
          >
            查看全部
          </Link>
        </div>
        {recentArticles.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">
            暂无文章，<Link href="/admin/articles/new" className="text-blue-600 hover:underline">立即添加</Link>
          </div>
        ) : (
          <ul className="divide-y">
            {recentArticles.map((a) => (
              <li key={a.id} className="px-6 py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-gray-500">
                    {a.category?.name || "未分类"} ·{" "}
                    {a.published_at
                      ? new Date(a.published_at).toLocaleDateString("zh-CN")
                      : "未发布"}
                  </div>
                </div>
                <Link
                  href={`/admin/articles/${a.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  编辑
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
