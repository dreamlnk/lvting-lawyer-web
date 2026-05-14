import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/search?q='],
    },
    sitemap: 'https://www.lvting-lawyer.com/sitemap.xml',
  };
}
