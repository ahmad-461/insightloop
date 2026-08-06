import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Avoid webpack critical dependency warnings for duckdb dynamic imports
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
