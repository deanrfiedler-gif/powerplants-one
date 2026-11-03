import { defineConfig } from "@playwright/test";
import { localConfig } from "../../src/platform/config";

// A task-owned server is started separately against the disposable synthetic DB.
// Require its explicit free port rather than using the shared default server.
if (!process.env.PPO_PORT || process.env.PPO_PORT === "3000")
  throw Error(
    "Set PPO_PORT to the task-owned dev server's free non-3000 port.",
  );

export default defineConfig({
  testDir: ".",
  testMatch: "project-commercial-ui.spec.ts",
  workers: 1,
  timeout: 300000,
  expect: { timeout: 90000 },
  use: {
    baseURL: localConfig().origin,
    channel: process.platform === "win32" ? "chrome" : undefined,
    locale: "en-AU",
    viewport: { width: 1440, height: 960 },
    navigationTimeout: 180000,
    trace: "retain-on-failure",
  },
  reporter: [["list"]],
});
