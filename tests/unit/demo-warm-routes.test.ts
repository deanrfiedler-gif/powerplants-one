import assert from "node:assert/strict";
import { test } from "node:test";
import config from "../../playwright.demo.config";
import { PLACEHOLDER_ID } from "../../scripts/warm-routes";
import { demoWarmRoutes } from "../helpers/demo-warm-routes";

test("demo setup covers its page, read and command routes without the unrelated application", () => {
  const paths = new Set(demoWarmRoutes().map((r) => r.path));
  for (const path of [
    "/schedule",
    `/service/appointments/${PLACEHOLDER_ID}`,
    `/service/work-orders/${PLACEHOLDER_ID}`,
    "/sales/opportunities",
    `/sales/opportunities/${PLACEHOLDER_ID}`,
    "/email",
    `/email/${PLACEHOLDER_ID}`,
    "/calendar",
    "/api/v1/schedule",
    "/api/v1/schedule/demand",
    `/api/v1/appointments/${PLACEHOLDER_ID}`,
    "/api/v1/crm/opportunities",
    "/api/v1/email",
    "/api/v1/calendar",
  ])
    assert.ok(paths.has(path), `missing demo dependency ${path}`);
  assert.ok(!paths.has("/finance/handoffs"));
  assert.ok(!paths.has("/api/v1/sync/recovery"));
  const setup = config.projects!.find((p) => p.name === "warm-up")!;
  assert.equal(setup.testDir, undefined); // Inherit tests/demo, not tests/browser.
  assert.ok((setup.testMatch as RegExp).test("warm-up.setup.ts"));
  for (const p of config.projects!.filter((p) => p.name !== "warm-up"))
    assert.deepEqual(p.dependencies, ["warm-up"]);
  assert.equal(config.timeout, 120000);
});
