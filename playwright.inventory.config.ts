import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const port = process.env.PPO_PORT ?? "3085";
export default defineConfig({
  ...base,
  timeout: 180000,
  expect: { timeout: 60000 },
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  projects: base.projects
    ?.filter((p) => p.name !== "warm-up")
    .map((p) => ({ ...p, dependencies: [] })),
  webServer: undefined,
});
