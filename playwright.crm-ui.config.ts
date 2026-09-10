import { defineConfig } from "@playwright/test";

// Fast component presentation checks, explicitly separate from database proof.
export default defineConfig({
  testDir: "tests/ui",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 30000,
  use: { channel: "chromium", locale: "en-AU", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "narrow-phone",
      use: {
        viewport: { width: 320, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  outputDir: "verification-evidence/crm-ui-tests",
  reporter: [["list"]],
});
