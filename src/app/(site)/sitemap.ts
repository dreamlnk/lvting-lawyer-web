import { MetadataRoute } from 'next';

// 静态页面
const staticPages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/about', priority: 0.8, changefreq: 'monthly' },
  { url: '/articles', priority: 0.9, changefreq: 'daily' },
  { url: '/category', priority: 0.8, changefreq: 'weekly' },
  { url: '/fees', priority: 0.7, changefreq: 'monthly' },
  { url: '/contact', priority: 0.7, changefreq: 'monthly' },
  { url: '/search', priority: 0.6, changefreq: 'weekly' },
];

// 栏目列表（10个栏目）
const categoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 文章ID范围（假设迁移后有2664篇文章）
const articleIds = Array.from({ length: 100 }, (_, i) => i + 1); // 示例100篇

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.lvting-lawyer.com'; // 替换为实际域名

  // 静态页面
  const staticUrls = staticPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: page.changefreq as any,
    priority: page.priority,
  }));

  // 栏目页面
  const categoryUrls = categoryIds.map((id) => ({
    url: `${baseUrl}/category/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 文章页面
  const articleUrls = articleIds.map((id) => ({
    url: `${baseUrl}/articles/${id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...categoryUrls, ...articleUrls];
}
