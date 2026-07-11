import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/welcome', '/auth/login', '/auth/register'],
        disallow: [
          '/api/',
          '/dev/',
          '/dashboard/',
          '/pos/',
          '/inventory/',
          '/reports/',
          '/settings/',
          '/staff/',
          '/products/',
          '/invoices/',
          '/customers/',
        ],
      },
    ],
    sitemap: 'https://pharma-nile.com/sitemap.xml',
  };
}
