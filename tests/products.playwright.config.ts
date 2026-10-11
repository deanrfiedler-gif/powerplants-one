import { defineConfig } from "@playwright/test";
export default defineConfig({
  globalSetup: "../scripts/check-browser.ts",
  testDir: "./browser",
  testMatch: "products.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    channel: "chrome",
    baseURL: process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000",
    locale: "en-AU",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "products-desktop",
      use: { viewport: { width: 1440, height: 960 } },
    },
    {
      name: "products-phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  reporter: [["list"]],
});
