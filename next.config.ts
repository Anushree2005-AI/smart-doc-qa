import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {},
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://192.168.1.41:3000',
  ],
};

export default nextConfig;