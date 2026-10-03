import { defineConfig } from "@playwright/test";

// Caller owns the compiled current application and isolated synthetic database.
// Each phase is explicit; there is no hidden reset, rollback writer or retry.
export default defineConfig({
  globalSetup: "./scripts/check-browser.ts",
  testDir: "tests/acceptance-browser",
  workers: 1,
  retries: 0,
  timeout: 600000,
  use: {
    channel: "chrome",
    baseURL: `http://127.0.0.1:${process.env.PPO_PORT}`,
    actionTimeout: 15000,
    navigationTimeout: 60000,
    timezoneId: "UTC",
    locale: "en-AU",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "desktop-acceptance" }],
  reporter: [["list"]],
});
