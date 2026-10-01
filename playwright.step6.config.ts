import { defineConfig } from "@playwright/test";

// The caller owns the compiled release and the task-only PostgreSQL instance.
// No reset, development server, retry or conditional skip is hidden here.
const mobile = process.env.PPO_STEP6_DEVICE === "mobile";
export default defineConfig({
  globalSetup: "./scripts/check-browser.ts",
  testDir: "tests/step6-browser",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 600000,
  use: {
    channel: "chrome",
    baseURL: `http://127.0.0.1:${process.env.PPO_PORT}`,
    actionTimeout: 15000,
    navigationTimeout: 60000,
    timezoneId: "UTC",
    locale: "en-AU",
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: mobile ? "mobile-step6" : "desktop-step6" }],
  reporter: [["list"]],
});
