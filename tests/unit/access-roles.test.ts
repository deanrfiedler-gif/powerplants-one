import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { roleProposals } from "../../src/access/roles";
import { capabilityLabels } from "../../src/access/capabilities";
import { pageForPath } from "../../src/shell/navigation";

test("AD-01 role comparisons preserve the seven retained proposals and exact revision deltas", () => {
  const context = {} as {
    ACCESS_MODEL: { seed: () => { bundles: typeof roleProposals } };
  };
  for (const file of ["capabilities.js", "model.js"])
    runInNewContext(
      readFileSync(
        new URL(`../../docs/design/access-review/${file}`, import.meta.url),
        "utf8",
      ),
      context,
    );
  const source = context.ACCESS_MODEL.seed().bundles.filter(
    (item) => item.id !== "bundle-hosted-demo",
  );
  assert.deepEqual(roleProposals, JSON.parse(JSON.stringify(source)));
  assert.equal(new Set(roleProposals.map((item) => item.id)).size, 7);
  for (const bundle of roleProposals)
    for (const revision of bundle.revisions) {
      assert(["Draft", "Proposed"].includes(revision.state));
      assert.equal(new Set(revision.caps).size, revision.caps.length);
      assert(
        revision.caps.every((key) => Object.hasOwn(capabilityLabels, key)),
      );
      assert(revision.caps.length <= 14);
    }
});

test("AD-01 role routes retain the access destination with task-specific titles", () => {
  assert.equal(
    pageForPath("/admin/access/roles")?.label,
    "Proposed role bundles",
  );
  assert.equal(
    pageForPath("/admin/access/30000000-0000-4000-8000-000000000005/roles")
      ?.label,
    "Compare proposed role bundle",
  );
  assert.equal(pageForPath("/admin/access/roles")?.id, "access");
  assert.equal(
    pageForPath("/admin/access/requests")?.label,
    "Access-change requests",
  );
  assert.equal(
    pageForPath("/admin/access/requests/30000000-0000-4000-8000-000000000005")
      ?.label,
    "Access request",
  );
});
