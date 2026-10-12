import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "projects-register.spec.ts",
  workers: 1,
  timeout: 180000,
  use: {
    channel: "chrome",
    baseURL: process.env.PPO_TEST_ORIGIN ?? `http://127.0.0.1:${process.env.PPO_PORT ?? 3000}`,
    locale: "en-AU",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
