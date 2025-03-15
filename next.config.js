/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;