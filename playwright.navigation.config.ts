import { defineConfig } from "@playwright/test";
// Run against an explicitly started compiled app; it may use an isolated port/database.
export default defineConfig({
  testDir: "tests/browser", testMatch: /(?:department-navigation|shell)\.spec\.ts$/,
  fullyParallel: false, workers: 1, timeout: 60000,
  use: { channel: "chrome", baseURL: process.env.PPO_NAV_BASE_URL ?? "http://127.0.0.1:3043", viewport: { width: 1440, height: 900 }, locale: "en-AU", trace: "retain-on-failure", screenshot: "only-on-failure" },
  outputDir: "verification-evidence/department-navigation/browser",
  reporter: [["list"]],
});
