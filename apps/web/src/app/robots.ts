import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for AuthHub
 *
 * Next.js 16 App Router convention: export a robots function
 * that returns MetadataRoute.Robots format
 *
 * This generates robots.txt at build time.
 *
 * Robots.txt rules:
 * - Allow all crawlers (default)
 * - Disallow API routes (no index needed for backend endpoints)
 * - Disallow admin/agency routes (authenticated areas)
 * - Reference sitemap.xml for discovery
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://authhub.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/agency/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
