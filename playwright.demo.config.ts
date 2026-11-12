import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "tests/demo",
  testMatch: "ui.spec.ts",
  timeout: 120000,
  // Keep the inherited dependency in its actual directory. The demo testDir
  // otherwise hides it, leaving the first invited-actor read to compile inside
  // the ordinary assertion deadline.
  projects: base.projects!.map((project) =>
    project.name === "warm-up"
      ? { ...project, testDir: "tests/browser" }
      : project,
  ),
});
