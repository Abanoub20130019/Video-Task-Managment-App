import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'bcryptjs'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'mongoose', 'bcryptjs'];
    }
    return config;
  },
};

export default nextConfig;
