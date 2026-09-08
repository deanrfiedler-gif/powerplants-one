import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    // Exercise the pinned full Chromium implementation. The separate headless
    // shell stalled before API execution in retained mobile browser evidence.
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
  // Ordinary workflow browser steps do not start an external server. Keep
  // ownership here in CI; the separate HTTP/restart scripts own their servers.
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
