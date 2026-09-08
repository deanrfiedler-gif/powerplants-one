import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Next 16.3 can reclaim compiler memory only after a filesystem snapshot.
  // The local launcher clears this compiler cache before each new process.
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackMemoryEviction: "auto",
  },
};
export default config;
