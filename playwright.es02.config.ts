import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
// Focused compiled ES-02 proof on its own loopback port. Existing dev server and
// repository-wide browser configuration remain independently usable.
const url = `http://127.0.0.1:${process.env.PPO_PORT ?? "3012"}`;
export default defineConfig({
  ...base,
  testMatch:
    /(estimating-(wizard|discovery|cost-basis)|shell|my-work|engineering-materials)\.spec\.ts$/,
  timeout: 180000,
  projects: [
    {
      name: "desktop-chromium",
      grepInvert: /EN06-A30/,
      use: { browserName: "chromium", viewport: { width: 1920, height: 1200 } },
    },
    {
      name: "mobile-chromium",
      testMatch: /engineering-materials\.spec\.ts$/,
      grep: /EN06-A30/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  use: { ...base.use, baseURL: url },
  webServer: {
    command: "npm run serve:compiled",
    url,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
