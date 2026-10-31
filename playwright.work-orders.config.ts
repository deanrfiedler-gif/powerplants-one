import { defineConfig } from "@playwright/test";
import compiled from "./playwright.compiled.config";

// Existing compiled app, browsers and deadlines; only the SV-03 journeys.
export default defineConfig({
  ...compiled,
  testMatch: [
    "work-order-register.spec.ts",
    "work-orders.spec.ts",
    "work-order-record.spec.ts",
  ],
  projects: compiled.projects
    ?.filter((p) => p.name !== "warm-up")
    .map((p) => ({ ...p, dependencies: [] })),
});
