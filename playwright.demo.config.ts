import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "tests/demo",
  testMatch: "ui.spec.ts",
  timeout: 120000,
  // Compile the demo's route families before its six invited-actor cases.
  // The full application's warm-up exceeds this small workflow's setup budget.
  projects: base.projects!.map((project) =>
    project.name === "warm-up"
      ? { ...project, testMatch: /warm-up\.setup\.ts$/ }
      : project,
  ),
});
