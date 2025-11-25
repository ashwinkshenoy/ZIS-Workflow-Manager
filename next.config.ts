import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',

  // Zendesk app specific
  distDir: 'dist/assets',

  // ✅ only add './' in production else HMR will break (Zendesk app specific)
  assetPrefix: isProd ? './' : undefined,

  // required for static export
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
