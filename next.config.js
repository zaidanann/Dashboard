/** @type {import('next').NextConfig} */
const nextConfig = {
  // googleapis hanya dipakai di server (API routes), exclude dari client bundle
  serverExternalPackages: ['googleapis'],
}

module.exports = nextConfig
