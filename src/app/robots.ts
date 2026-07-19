import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings/', '/settings/audit'],
    },
    sitemap: 'https://pharma-nile.vercel.app/sitemap.xml',
  };
}
