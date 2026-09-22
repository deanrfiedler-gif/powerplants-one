import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3042"}`;
export default defineConfig({
  ...base,
  testMatch: /fertigation\.spec\.ts$/,
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
  use: { ...base.use, baseURL: origin },
  webServer: {
    command:
      process.env.PPO_FERTIGATION_ENV === "isolated"
        ? "node --env-file=.env.fertigation --import tsx scripts/local-server.ts --compiled"
        : "npm run serve:compiled",
    url: origin,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
