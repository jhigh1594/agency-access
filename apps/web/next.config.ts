import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Proxy API requests to backend server (running on port 3001)
  // Only enabled in development. In production, NEXT_PUBLIC_API_URL should point to the deployed backend.
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    return [
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
};

export default nextConfig;
