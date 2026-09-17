/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@astra/shared"],
  experimental: {
    // Required for Three.js worker usage
    serverComponentsExternalPackages: ["three"],
  },
}

module.exports = nextConfig
