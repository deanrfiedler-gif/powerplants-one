import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  packageContent,
  coverage,
  interfaceHash,
  measurePackage,
  packageReferences,
} from "../../src/cpq/package-model";
import { packageIsolated } from "../../src/cpq/runner";
import { packageFixture } from "../helpers/cpq-packages";
import { cpqDefinition } from "../helpers/cpq";

test("owned workloads execute small, typical and boundary fixtures with measured sizes and three samples", async () => {
  const c = packageFixture(randomUUID());
  const report = await packageIsolated(c);
  assert.equal(report.passed, true);
  assert.equal(report.scope, "SyntheticInWorkerEvaluation");
  assert.deepEqual(
    report.cases.map((c) => c.instances),
    [1, 10, 20],
  );
  assert.ok(
    report.cases.every(
      (c) =>
        c.samples.length === 3 &&
        c.samples.every((s) => s.result_bytes > 1000 && s.evaluation_ms >= 0),
    ),
  );
  const limited = measurePackage({
    ...c,
    workload: { ...c.workload, result_bytes: 1024 },
  });
  assert.equal(limited.passed, false);
  assert.ok(limited.fixtures.every((f) => f.passed));
});
test("package membership refuses omitted, overlapping, changed and incompatible technical members", () => {
  const content = packageFixture(randomUUID()),
    d = content.definition;
  const packages = [{ kind: "Rules" as const, content }];
  assert.deepEqual(coverage(d, packages), []);
  assert.ok(coverage(d, []).length);
  assert.ok(coverage(d, [...packages, ...packages]).length);
  const changed = structuredClone(d);
  changed.rules[0].quantity = "count * 2";
  assert.ok(coverage(changed, packages).length);
  const units = structuredClone(d);
  units.parts[0].unit = "metre";
  assert.notEqual(interfaceHash(units), interfaceHash(d));
  const prices = structuredClone(d);
  prices.parts[0].tiers[0].unit_cost = "12.00";
  assert.equal(interfaceHash(prices), interfaceHash(d));
});
test("strict package contract requires native fixture ownership and explicit complete workload roles", () => {
  const c = packageFixture(randomUUID());
  assert.throws(() =>
    packageContent({ ...c, fixture_owner_id: "someone" }, "Rules"),
  );
  assert.throws(() =>
    packageContent(
      { ...c, workload: { ...c.workload, cases: c.workload.cases.slice(1) } },
      "Rules",
    ),
  );
  assert.throws(() =>
    packageContent(
      { ...c, workload: { ...c.workload, evaluation_ms: 5001 } },
      "Rules",
    ),
  );
  assert.throws(() =>
    packageContent({ ...c, definition: cpqDefinition() }, "Rules"),
  );
  assert.throws(() => packageContent(c, "Tables"));
  const r = {
    package_id: randomUUID(),
    revision_id: randomUUID(),
    publication_id: randomUUID(),
    content_hash: "a".repeat(64),
  };
  assert.throws(() => packageReferences([r, r]));
  assert.throws(() => packageReferences([{ ...r, latest: true }]));
});
