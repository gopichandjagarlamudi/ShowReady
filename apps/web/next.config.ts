import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@showready/types", "@showready/scoring", "@showready/db"]
};

export default nextConfig;
