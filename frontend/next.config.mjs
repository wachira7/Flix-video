import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
    
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // The repo root has its own yarn.lock; build from this folder
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  async redirects() {
    return [
      // These pages became sections of the landing page
      { source: '/pricing', destination: '/#pricing', permanent: true },
      { source: '/features', destination: '/#how-it-works', permanent: true },
    ];
  },
};

export default nextConfig;