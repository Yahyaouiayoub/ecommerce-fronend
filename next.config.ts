import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Enable Next.js Image Optimization for better SEO (alt tags, responsive images)
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 768, 1024, 1280, 1536],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
  // Enable compression and strict mode
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
