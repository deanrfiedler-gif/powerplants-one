import { defineConfig } from "@playwright/test";
export default defineConfig({
  globalSetup: "./scripts/check-browser.ts",
  testDir: "tests/projects-ui",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 30000,
  use: {
    channel: "chrome",
    locale: "en-AU",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  outputDir: "verification-evidence/projects-ui-tests",
  reporter: [["list"]],
});
