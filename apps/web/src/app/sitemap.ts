import { MetadataRoute } from 'next';

/**
 * Dynamic sitemap generation for AuthHub
 *
 * Next.js 16 App Router convention: export a sitemap function
 * that returns MetadataRoute.Sitemap format
 *
 * This generates sitemap.xml at build time, including:
 * - Static marketing pages
 * - Blog posts (dynamically from blog-data.ts)
 * - Changelog entries
 * - Pricing and other core pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://authhub.co';
  const currentDate = new Date().toISOString();

  // Core marketing pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  // Dynamic blog posts
  // Import here to avoid build-time issues with circular dependencies
  const { getBlogPosts } = require('@/lib/blog-data');
  const blogPosts = getBlogPosts();

  const blogUrls = blogPosts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt || currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Platform guides
  const guideUrls = [
    {
      url: `${baseUrl}/guides/meta-ads-access`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides/google-ads-access`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ];

  // Changelog entries (if changelog exists)
  const changelogUrls: MetadataRoute.Sitemap = [];

  return [...staticPages, ...blogUrls, ...guideUrls, ...changelogUrls];
}
