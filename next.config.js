/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SSR for all pages
  output: 'standalone',

  // Configure for AWS Amplify deployment
  trailingSlash: true,

  // Enable experimental features for better SSR support
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },

  // Configure images for AWS Amplify
  images: {
    domains: ['main.d2q8k9j5m6l3x4.amplifyapp.com', 'vantagepointcrm.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Configure API routes to work with Lambda backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod/api/:path*',
      },
    ]
  },

  // Enable CORS for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // Configure webpack for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // Enable TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
