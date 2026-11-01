import assert from "node:assert/strict";
import test from "node:test";
import { breadcrumb } from "../../src/shell/breadcrumb";
import { destinations, pageForPath } from "../../src/shell/navigation";
import { moduleWorkspaceForPath } from "../../src/shell/module-workspaces";
test("Excel import is contextual under the Wizard and keeps its expressly requested full breadcrumb", () => {
  const page = pageForPath("/estimating/import");
  assert.equal(page?.id, "wizard");
  assert.equal(page?.label, "Excel import");
  assert.equal(
    destinations.some((d) => d.href === "/estimating/import"),
    false,
  );
  const result = breadcrumb({
    path: "/estimating/import",
    query: new URLSearchParams(),
    record: null,
    signedIn: true,
    permitted: destinations.map((d) => d.id),
    hosted: false,
    preference: "estimate",
  });
  assert.deepEqual(
    result.crumbs.map((c) => c.label),
    ["Estimating & quotation", "Estimation wizard", "Excel import"],
  );
  assert.equal(result.crumbs.at(-1)?.href, undefined);
  assert.equal(
    moduleWorkspaceForPath("/estimating/import")?.scope,
    "ppo-excel-import",
  );
});
