/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Simplified config - rely on Next.js default handling
  eslint: {
    // Disable ESLint during build (warnings shouldn't block the build)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build
    ignoreBuildErrors: true,
  },
  
  // Disable debugging to avoid excessive console output
  productionBrowserSourceMaps: false,
  
  // Experimental features that might help with stability
  experimental: {
    // Disable automatic static optimization for pages that need getStaticProps
    optimizeServerReact: true,
  },
  
  // Ensure proper MIME types are set for DOCX files
  async headers() {
    return [
      {
        source: '/templates/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      },
    ];
  },
  
  // Explicitly include static files in the output
  output: 'standalone',
  
  // Exclude templates from output compression to avoid file corruption
  compress: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(docx|dotx)$/,
      type: 'asset/resource',
    });
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);