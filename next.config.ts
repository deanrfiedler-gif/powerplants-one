import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Recompile dev routes after a process restart; business records remain in PostgreSQL.
  experimental: { turbopackFileSystemCacheForDev: false },
};
export default config;
