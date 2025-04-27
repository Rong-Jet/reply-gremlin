/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  // Resolve hydration issues
  experimental: {
    // This will help with hydration issues in development
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to resolve these Node.js modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        // tls: false,
        // fs: false,
        // http: false,
        // https: false,
        // stream: false,
        // crypto: false,
        // zlib: false,
        // path: false,
        // os: false
      };
    }
    return config;
  },
}

export default nextConfig
