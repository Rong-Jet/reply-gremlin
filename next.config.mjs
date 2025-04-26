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
  }
}

export default nextConfig
