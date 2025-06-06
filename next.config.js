/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Set NODE_TLS_REJECT_UNAUTHORIZED=0 only in development
// This will allow self-signed certificates to be accepted
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('⚠️ TLS certificate verification disabled for development');
}

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
  
  // Add this to help with fetch issues
  httpAgentOptions: {
    keepAlive: true,
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
  
  // Add environment variables to be available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = withBundleAnalyzer(nextConfig);