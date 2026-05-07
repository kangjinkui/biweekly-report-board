import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: process.env.SKIP_NEXT_TYPECHECK === "1",
  },
};

export default nextConfig;
