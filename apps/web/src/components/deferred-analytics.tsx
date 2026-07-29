'use client';

import dynamic from 'next/dynamic';

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((mod) => mod.Analytics),
  { ssr: false }
);

/**
 * Deferred Analytics Component
 *
 * Loads analytics scripts only on the client after hydration,
 * preventing them from blocking First Contentful Paint.
 */
export function DeferredAnalytics() {
  return (
    <>
      <Analytics />
    </>
  );
}

