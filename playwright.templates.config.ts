import { defineConfig } from "@playwright/test";
// Dedicated compiled synthetic app; never start or reuse Dean's port-3000 server.
export default defineConfig({
  testDir: "tests/browser",
  testMatch: /templates-(workspace|native)\.spec\.ts$/,
  workers: 1,
  fullyParallel: false,
  timeout: 180000,
  use: {
    baseURL: process.env.PPO_TEST_BASE_URL ?? "http://127.0.0.1:3474",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    locale: "en-AU",
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
  outputDir: "tmp/templates-browser-results",
});
