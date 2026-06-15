import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@scope4/types'],
}

export default nextConfig
// force railway build web
