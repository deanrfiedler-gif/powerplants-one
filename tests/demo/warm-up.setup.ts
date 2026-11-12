import { test, expect } from "@playwright/test";
import { warmRoutes } from "../../scripts/warm-routes";
import { demoWarmRoutes } from "../helpers/demo-warm-routes";

test("warm the invited-actor demo routes before desktop and phone", async ({}, info) => {
  test.setTimeout(15 * 60 * 1000);
  const routes = demoWarmRoutes();
  expect(routes.length).toBeGreaterThan(0);
  const summary = await warmRoutes("http://127.0.0.1:3000", routes, {
    log: (line) => console.log(`[demo warm-up] ${line}`),
  });
  await info.attach("demo-warm-up-timings", {
    body: JSON.stringify(summary, null, 2),
    contentType: "application/json",
  });
  expect(summary.unreachable, "every demo route must be reachable").toBe(0);
});
