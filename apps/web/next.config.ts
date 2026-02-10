import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: true,

  // Optimize package imports for smaller bundles (now stable in Next.js 16)
  optimizePackageImports: [
    '@radix-ui/react-icons',
    'lucide-react',
    'framer-motion',
    'recharts',
  ],

  // Fix workspace root warning
  turbopack: {
    root: '/Users/jhigh/agency-access-platform',
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.brandfetch.io',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [24, 32, 64, 96, 128],
    imageSizes: [24, 32, 64, 96, 128],
  },
  // Proxy API requests to backend server (running on port 3001)
  // Only enabled in development. In production, NEXT_PUBLIC_API_URL should point to the deployed backend.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

    // PostHog reverse proxy rewrites (always enabled to avoid ad blockers)
    const posthogRewrites = [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];

    // In production, only return PostHog rewrites
    if (process.env.NODE_ENV === 'production') {
      return posthogRewrites;
    }

    // In development, include both PostHog and API proxy rewrites
    return [
      ...posthogRewrites,
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/agency-platforms/:path*',
        destination: `${backendUrl}/agency-platforms/:path*`,
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
