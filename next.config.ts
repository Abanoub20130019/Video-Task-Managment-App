import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'mongoose',
    'bcryptjs',
    'ioredis',
    'pino',
    'pino-pretty',
    'pusher',
    'firebase-admin'
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        'mongoose',
        'bcryptjs',
        'ioredis',
        'pino',
        'pino-pretty',
        'pusher',
        'firebase-admin'
      ];
    } else {
      // For client-side, exclude Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      'mongoose',
      'ioredis',
      'pino',
      'pusher',
      'firebase-admin'
    ],
  },
};

export default nextConfig;
