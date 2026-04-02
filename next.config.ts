import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const version = readFileSync(join(process.cwd(), "VERSION"), "utf8").trim();

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  /* config options here */
};

export default nextConfig;
