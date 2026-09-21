import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const port = process.env.PPO_PORT ?? "3018",
  url = `http://127.0.0.1:${port}`;
export default defineConfig({
  ...base,
  testMatch: /specialist-workbench\.spec\.ts$/,
  timeout: 180000,
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1920, height: 1200 } },
    },
  ],
  use: { ...base.use, baseURL: url },
  webServer: {
    command: "npm run serve:compiled",
    url,
    reuseExistingServer: false,
    timeout: 120000,
    env: { PPO_PORT: port },
  },
});
