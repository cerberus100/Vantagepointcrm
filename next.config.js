/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Amplify
  output: 'export',

  // Configure images for static export
  images: {
    unoptimized: true,
  },

  // Disable TypeScript errors during build (temporary)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable ESLint during builds (temporary)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
