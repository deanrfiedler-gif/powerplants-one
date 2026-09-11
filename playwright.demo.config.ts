import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "tests/demo",
  testMatch: "ui.spec.ts",
  timeout: 120000,
});
