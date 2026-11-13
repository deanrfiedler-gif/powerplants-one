import { defineConfig } from "@playwright/test";
import { browserChannel } from "../../src/platform/browser";

// Invoked only by the parent regression. Its deliberate timeout must never be
// discovered as an ordinary failing application test.
export default defineConfig({
  testDir: "../fixtures",
  testMatch: "crm-return-timeout.spec.ts",
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: "json",
  use: { channel: browserChannel, headless: true },
});
