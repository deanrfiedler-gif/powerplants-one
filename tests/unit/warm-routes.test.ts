import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PLACEHOLDER_ID, enumerateRoutes, routePathFromFile } from "../../scripts/warm-routes";

test("route paths drop groups and slots and substitute a well-formed placeholder for dynamic segments", () => {
  const app = "/x/src/app";
  assert.equal(routePathFromFile(app, `${app}/page.tsx`), "/");
  assert.equal(routePathFromFile(app, `${app}/(business)/finance/handoffs/page.tsx`), "/finance/handoffs");
  assert.equal(routePathFromFile(app, `${app}/api/v1/sync/operations/route.ts`), "/api/v1/sync/operations");
  assert.equal(
    routePathFromFile(app, `${app}/api/v1/sync/recovery/[id]/route.ts`),
    `/api/v1/sync/recovery/${PLACEHOLDER_ID}`,
  );
  assert.equal(routePathFromFile(app, `${app}/docs/[...slug]/page.tsx`), `/docs/${PLACEHOLDER_ID}`);
  assert.equal(routePathFromFile(app, `${app}/@modal/(.)photo/page.tsx`), `/(.)photo`);
});

test("enumeration finds only route and page files, pages first, in a stable order", () => {
  const dir = mkdtempSync(join(tmpdir(), "ppo-warm-"));
  for (const f of ["b/route.ts", "a/page.tsx", "(g)/c/[id]/page.tsx", "a/layout.tsx", "a/loading.tsx"]) {
    mkdirSync(join(dir, f, ".."), { recursive: true });
    writeFileSync(join(dir, f), "");
  }
  const routes = enumerateRoutes(dir);
  assert.deepEqual(
    routes.map((r) => [r.path, r.kind]),
    [["/a", "page"], [`/c/${PLACEHOLDER_ID}`, "page"], ["/b", "api"]],
  );
});

test("the real application tree yields the routes the browser suite depends on", () => {
  const routes = enumerateRoutes();
  const paths = new Set(routes.map((r) => r.path));
  assert.ok(routes.length >= 150, `expected the full route set, found ${routes.length}`);
  for (const p of ["/", "/finance/handoffs", "/api/v1/sync/operations", "/api/v1/sync/recovery", "/offline"]) {
    assert.ok(paths.has(p), `missing ${p}`);
  }
  assert.ok(!routes.some((r) => /[()@]/.test(r.path)), "route groups and slots must not leak into URLs");
  assert.ok(routes.every((r) => /^src\/app\//.test(r.source)), "sources are recorded relative to the repository");
});
