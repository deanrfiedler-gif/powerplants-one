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
    // Dependency project: requests every route once after the dev server is up
    // so first-request compilation never lands inside a spec's assertion window.
    // Dependencies run unfiltered, so single-file and --grep steps still warm.
    { name: "warm-up", testMatch: /warm-up\.setup\.ts$/ },
    {
      name: "desktop-chromium",
      dependencies: ["warm-up"],
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      dependencies: ["warm-up"],
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
