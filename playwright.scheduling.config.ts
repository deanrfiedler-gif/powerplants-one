import { defineConfig } from "@playwright/test";
import base from "./playwright.compiled.config";
// Isolated publication fixtures must never reset another browser journey's data.
// This dedicated suite uses the same compiled launcher and Chrome/viewport pins.
export default defineConfig({
  ...base,
  testDir: "tests/scheduling-browser",
  timeout: 120000,
  projects: base
    .projects!.filter((p) => p.name !== "warm-up")
    .map((p) => ({ ...p, dependencies: [] })),
  webServer: {
    command: "npm run serve:compiled",
    url: `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
