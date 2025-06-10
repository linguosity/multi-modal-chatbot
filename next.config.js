/** @type {import('next').NextConfig} */
const isTurbopack = process.env.TURBOPACK === '1';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  experimental: {
    // optimizeServerReact: true, // Disabled to prevent dev server hangs
  },
  httpAgentOptions: {
    keepAlive: true,
  },
  async headers() {
    return [
      {
        source: '/templates/:path*',
        headers: [
          {
            key: 'Content-Type',
            value:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      },
    ];
  },
  // output: 'standalone', // This can cause issues in development
  compress: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

// Temporarily disable bundle analyzer to debug startup issues
module.exports = nextConfig;

// if (!isTurbopack) {
//   const withBundleAnalyzer = require('@next/bundle-analyzer')({
//     enabled: process.env.ANALYZE === 'true',
//   });
//   module.exports = withBundleAnalyzer(nextConfig);
// } else {
//   module.exports = nextConfig;
// }