import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://revbid.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/checkout/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
