import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    // Use the pinned bundled full Chromium browser's headless mode for UI
    // assurance; preserve every case/deadline and record this profile change.
    channel: "chromium",
    baseURL: "http://127.0.0.1:3000",
    locale: "en-AU",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  // CI alone does not establish an externally started server. Only opt out
  // when the invoking harness actually owns that server's lifecycle.
  webServer: process.env.PPO_BROWSER_SERVER_EXTERNAL === "1"
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
  reporter: [["list"], ["html", { open: "never" }]],
});
