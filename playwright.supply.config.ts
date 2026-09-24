import { defineConfig } from "@playwright/test";
export default defineConfig({
  expect: { timeout: 30000 },
  testDir: "tests/browser",
  testMatch: "supply.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  use: {
    channel: "chrome",
    baseURL: process.env.PPO_SUPPLY_ORIGIN ?? "http://127.0.0.1:3059",
    locale: "en-AU",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "supply-1440", use: { viewport: { width: 1440, height: 960 } } },
    { name: "supply-1024", use: { viewport: { width: 1024, height: 768 } } },
    {
      name: "supply-390",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "supply-320",
      use: {
        viewport: { width: 320, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/supply" }],
  ],
});
