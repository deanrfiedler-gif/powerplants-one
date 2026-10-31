import { defineConfig } from "@playwright/test";
import { localConfig } from "./src/platform/config";

// Run after build/migrate/seed, with the environment loaded into this process.
// The native spec refuses databases other than ppo_synthetic_test.
const { origin } = localConfig();
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "library-native.spec.ts",
  workers: 1,
  timeout: 180_000,
  use: {
    channel: "chrome",
    baseURL: origin,
    viewport: { width: 1440, height: 900 },
    locale: "en-AU",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node --env-file=.env.local --import tsx scripts/local-server.ts --compiled",
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  outputDir: "test-results/library-native",
  reporter: [["list"]],
});
