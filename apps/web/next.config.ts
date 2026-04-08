import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingRoot: path.resolve(configDir, "../.."),
  transpilePackages: ["@showready/types", "@showready/scoring", "@showready/db"],
  turbopack: {
    root: path.resolve(configDir, "../..")
  }
}

export default nextConfig
