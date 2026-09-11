import { test, expect } from "@playwright/test";
import { enumerateRoutes, slowest, warmRoutes } from "../../scripts/warm-routes";

// Runs once as a dependency of every browser project, after Playwright has
// started the dev server and before any spec. It requests each route once so
// Turbopack's first-request compilation is paid here, with its timing recorded,
// rather than inside a test's assertion window. No status is asserted: a 401 or
// 404 proves the module compiled just as well as a 200. The only failure is a
// server that could not be reached at all.
test("warm every route once before the browser projects", async ({}, info) => {
  test.setTimeout(15 * 60 * 1000);
  const base = info.config.webServer && !Array.isArray(info.config.webServer) && info.config.webServer.url
    ? info.config.webServer.url
    : "http://127.0.0.1:3000";
  const routes = enumerateRoutes();
  expect(routes.length).toBeGreaterThan(0);
  const summary = await warmRoutes(base, routes);
  await info.attach("warm-up-timings", {
    body: JSON.stringify(summary, null, 2),
    contentType: "application/json",
  });
  const top = slowest(summary)
    .map((r) => `${String(r.elapsed_ms).padStart(6)} ms  ${r.status ?? "ERR"}  ${r.path}`)
    .join("\n");
  console.log(
    `[warm-up] ${summary.routes} routes in ${summary.total_ms} ms, ${summary.unreachable} unreachable. Slowest:\n${top}`,
  );
  expect(summary.unreachable, "every route must be reachable; the dev server is up").toBe(0);
});
