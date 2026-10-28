import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'host',
            value: '(jobhub-app\\.duckdns\\.org|www\\.skillskonnect\\.online)',
          },
        ],
        destination: 'https://skillskonnect.online/:path*',
        permanent: false,
      },
    ];
  },
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
        {
          source: '/downloads/:path*',
          destination: 'http://backend:3001/downloads/:path*',
        },
      ]
    };
  },
};

export default nextConfig;
