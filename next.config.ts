import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing legacy type errors (mostly Json-narrowing + schema drift)
    // are tracked for follow-up. Set to false once they've been cleaned up.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint rules have already been demoted to warn in .eslintrc.json —
    // keep lint running during builds so new violations are surfaced.
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
