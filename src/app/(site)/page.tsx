import Link from 'next/link';
import Image from 'next/image';
import { contact } from '@/lib/config';
import { getAllCategories, getArticles, getLatestArticles } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 独立页面不显示在栏目中
const STANDALONE_SLUGS = ["jj", "fengcai", "shoufeibiaozhun"];
const PAGE_SIZE = 5;

// 栏目图标（固定映射）
const CATEGORY_ICONS: Record<string, string> = {
  xingshibianhu: '⚖️', hunyinjiating: '💑', jiaotongshigu: '🚑',
  laodonggongshang: '🔧', fangchan: '🏠', jingjihetong: '💰', cx: '📂',
};

/** 生成文章链接：有 old_path 用旧路径，否则用新路径 */
function articleHref(a: { old_path?: string | null; id: number }): string {
  return a.old_path || `/articles/${a.id}`;
}

export default async function HomePage() {
  const allCats = await getAllCategories();
  const displayCats = allCats.filter(c => !STANDALONE_SLUGS.includes(c.slug));

  // 每个栏目取最新 N 篇文章
  const catArticles = await Promise.all(
    displayCats.map(async (cat) => {
      const data = await getArticles({ categoryId: cat.id, page: 1, pageSize: PAGE_SIZE, status: "published" });
      return { cat, articles: data.articles };
    })
  );
  // 全站最新文章（不限制栏目）
  const latestArticles = await getLatestArticles(10);
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[400px] md:min-h-[600px] lg:min-h-[800px]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg-new.jpg"
            alt="吕婷律师"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 h-full min-h-[400px] md:min-h-[600px] lg:min-h-[800px] flex items-end justify-end">
          <div className="mb-0 md:mb-custom">
            <div className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-sm">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">
                专业法律服务
                <span className="text-yellow-400">为您保驾护航</span>
              </h1>
              <p className="text-lg md:text-xl mb-3 text-blue-100 drop-shadow-md">
                吕婷律师，拥有丰富的法律实务经验，专注于刑事辩护、婚姻家庭、房产纠纷等领域，
                为您提供专业、高效、贴心的法律服务。
              </p>
              <div className="flex flex-wrap gap-3 justify-end">
                <Link
                  href="/xingshibianhu/"
                  className="btn-primary text-sm px-4 py-2"
                >
                  浏览文章
                </Link>
                <Link
                  href="/contact"
                  className="btn-secondary text-sm px-4 py-2 text-white hover:text-blue-900"
                >
                  免费咨询
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 栏目导航 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2 text-center">专业领域</h2>
          <p className="text-gray-500 text-center mb-10">点击进入各专业领域的文章目录</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayCats.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}/`}
                className="bg-gray-50 rounded-xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
              >
                <div className="text-3xl mb-2">{CATEGORY_ICONS[cat.slug] || '📄'}</div>
                <h3 className="font-semibold text-sm">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 最新文章 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">最新文章</h2>
            <Link
              href="/xingshibianhu/"
              className="text-blue-900 hover:text-yellow-500 font-semibold"
            >
              更多文章 →
            </Link>
          </div>

          {/* 按栏目分组的最新文章列表 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {catArticles.map(({ cat, articles }) => (
              <div key={cat.id}>
                <h3 className="text-lg font-bold mb-3">{cat.name}</h3>
                <div className="space-y-2">
                  {articles.map((a) => {
                    const anyA = a as any;
                    return (
                      <div key={a.id} className="flex items-baseline gap-2 text-sm">
                        <a href={anyA.old_path || `/articles/${a.id}`} className="text-gray-700 hover:text-blue-900 transition-colors">
                          {a.title}
                        </a>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(a.published_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 全站最新文章 */}
      {latestArticles.length > 0 && (
        <section className="py-10 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl font-bold mb-4 text-center">最新发布</h2>
            <div className="space-y-2">
              {latestArticles.map((a) => (
                <div key={a.id} className="flex items-baseline gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                  <a
                    href={(a as any).old_path || `/articles/${a.id}`}
                    className="text-gray-700 hover:text-blue-900 transition-colors flex-1 truncate"
                  >
                    {a.title}
                  </a>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {new Date(a.published_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/about-lawyer.jpg"
                alt="吕婷律师"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">关于吕婷律师</h2>
              <p className="text-lg text-gray-600 mb-6">
                吕婷律师拥有多年的法律实务经验，擅长处理各类复杂法律案件。
                秉持"专业、负责、高效"的服务理念，为每一位客户提供优质的法律服务。
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500 text-xl">✓</span>
                  <span>专业领域涵盖刑事、民事、经济等多个法律领域</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500 text-xl">✓</span>
                  <span>成功办理数百起各类案件，经验丰富</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500 text-xl">✓</span>
                  <span>注重与客户的沟通，及时了解客户需求</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500 text-xl">✓</span>
                  <span>收费透明合理，让客户明明白白消费</span>
                </li>
                <li>
                  咨询热线：{contact.phone}
                </li>
                <li>
                  24小时热线：{contact.phone24h}
                </li>
                <li>
                  微信：{contact.wechat}（{contact.wechatNote}）
                </li>
                <li>
                  地址：{contact.address}
                </li>
              </ul>
              <Link href="/about" className="btn-primary">
                了解更多
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            有法律问题？立即咨询吕婷律师
          </h2>
          <p className="text-xl mb-8 text-blue-200 max-w-2xl mx-auto">
            专业、高效、贴心的法律服务，为您解决法律难题
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              在线预约
            </Link>
            <a href={`tel:${contact.phone}`} className="btn-secondary">
              📞 立即拨打
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
