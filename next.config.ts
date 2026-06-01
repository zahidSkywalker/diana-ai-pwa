import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "standalone" output — Vercel uses its own build system
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Increase API body size for file uploads (up to 10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
