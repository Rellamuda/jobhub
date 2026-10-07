import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://backend:3001/:path*',
        },
        {
          source: '/uploads/:path*',
          destination: 'http://backend:3001/uploads/:path*',
        },
      ]
    };
  },
};

export default nextConfig;
