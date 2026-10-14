import assert from "node:assert/strict";
import { test } from "node:test";
import {
  qualityResults,
  qualityMembers,
  qualityLimits,
} from "../../src/cpq/quality-model";
import { qualityBound } from "../../src/cpq/quality-report";
import { evaluate } from "../../src/cpq/engine";
import { hash } from "../../src/cpq/hash";
import { definition, calculationInput } from "../../src/cpq/validation";
import { cpqDefinition, cpqInput } from "../helpers/cpq";

test("quality reports intentional regression deltas without changing engine results or source hashes", () => {
  const baseline = cpqDefinition(),
    candidate = cpqDefinition();
  candidate.parts[0].tiers[0].unit_cost = "12.00";
  candidate.fixtures[0].expected.cost = "74.00";
  const original = hash({ baseline, candidate });
  const result = qualityResults({
    definition: candidate,
    baseline,
    estimates: [{ id: "native-estimate", input: cpqInput() }],
  });
  assert.equal(result.approval_eligible, true);
  assert.equal(result.baseline_regression[0].passed, false);
  assert.equal(result.baseline_regression[0].actual!.cost, "74.00");
  assert.ok(result.changes.some((c) => c.path.includes("sensor")));
  assert.deepEqual(
    result.simulations[0].result,
    evaluate(candidate, calculationInput(cpqInput(), candidate.facts)),
  );
  assert.equal(result.baseline_regression[0].result_hash, result.simulations[0].result!.result_hash);
  assert.equal(hash({ baseline, candidate }), original);
  assert.equal(result.coverage.scope, "ObservedFixturesOnly");
  assert.deepEqual(result.coverage.rules[0].contributing_fixtures, [0]);
});

test("expected negative fixtures retain visible conflicts; unobserved rules are not global coverage claims", () => {
  const d = cpqDefinition();
  d.fixtures[0].input.instances[0].facts.count = "21";
  const actual = evaluate(d, d.fixtures[0].input);
  d.fixtures[0].expected = {
    ready: false,
    cost: actual.totals.cost,
    sell: actual.totals.sell,
    diagnostic_codes: actual.diagnostics.map((x) => x.code),
  };
  const result = qualityResults({
    definition: d,
    baseline: null,
    estimates: [],
  });
  assert.equal(result.approval_eligible, true);
  assert.ok(result.conflicts.some((c) => c.code === "ConstraintConflict"));
  d.fixtures[0].expected.cost = "0.00";
  assert.equal(
    qualityResults({ definition: d, baseline: null, estimates: [] })
      .approval_eligible,
    false,
  );
});

test("schema-three table partitions and native definition members remain explicit", () => {
  const d = definition({
    ...cpqDefinition(),
    schema_version: 3,
    design: {
      option_sets: [],
      structure: [],
      shared_capacity: [],
      decision_tables: [],
      pricing: { mode: "Catalog", percent: "0", allow_override: false },
    },
  });
  const result = qualityResults({
    definition: d,
    baseline: null,
    estimates: [],
  });
  assert.equal(result.approval_eligible, true);
  assert.deepEqual(result.coverage.rules[0].observed_outcomes, ["Applied"]);
  assert.ok(
    qualityMembers(d).some(
      (m) => m.kind === "design" && m.content_hash === hash(d.design),
    ),
  );
  assert.ok(
    qualityMembers(d).some(
      (m) => m.key === "sensors" && m.content_hash === hash(d.rules[0]),
    ),
  );
});

test("quality byte bound refuses rather than silently truncates", () => {
  qualityBound({ value: "ok" }, 100);
  assert.throws(
    () =>
      qualityBound(
        { value: "x".repeat(qualityLimits.input_bytes) },
        qualityLimits.input_bytes,
      ),
    (e: unknown) => (e as { code: string }).code === "CpqQualityLimit",
  );
});

test("expected table conflicts remain visible and prevent impact approval", () => {
  const d = definition({ ...cpqDefinition(), schema_version: 3, design: {
    option_sets: [], structure: [], shared_capacity: [], decision_tables: [],
    pricing: { mode: "Catalog", percent: "0", allow_override: false },
  } });
  d.design!.decision_tables = [{ key: "conflicting_install", label: "SYN conflict", hit_policy: "UNIQUE",
    required: true, columns: ["install"], rows: ["first", "second"].map((key) => ({ key,
      when: { op: "EQ" as const, fact: "install", value: true }, rules: ["install_sensors"], priority: 1 })) }];
  const result = evaluate(d, d.fixtures[0].input);
  d.fixtures[0].expected = { ready: result.ready, cost: result.totals.cost, sell: result.totals.sell,
    diagnostic_codes: result.diagnostics.map((x) => x.code) };
  const report = qualityResults({ definition: d, baseline: null, estimates: [] });
  assert.equal(report.fixtures[0].passed, true);
  assert.equal(report.approval_eligible, false);
  assert.ok(report.coverage.tables[0].issues.length > 0);
});

test("removed facts and schema fields demand explicit input review instead of a misleading ready simulation", () => {
  const baseline = cpqDefinition(), candidate = cpqDefinition();
  candidate.facts = candidate.facts.filter((f) => f.key !== "install");
  candidate.rules = [candidate.rules[0]];
  candidate.constraints = [];
  delete candidate.fixtures[0].input.instances[0].facts.install;
  candidate.fixtures[0].expected = { ready: true, cost: "20.00", sell: "30.00", diagnostic_codes: [] };
  const report = qualityResults({ definition: candidate, baseline, estimates: [{ id: "native", input: cpqInput() }] });
  assert.equal(report.approval_eligible, true);
  assert.equal(report.simulations[0].input_status, "NeedsInputReview");
  assert.equal(report.simulations[0].result, null);
  assert.equal(report.simulations[0].input_errors[0].field, "install");
  assert.equal(report.baseline_regression[0].passed, false);
  assert.equal(report.baseline_regression[0].result_hash, null);
  const compatible = qualityResults({ definition: candidate, baseline: null,
    estimates: [{ id: "native", input: candidate.fixtures[0].input }] });
  assert.equal(compatible.simulations[0].result!.definition_hash, hash(candidate));
});
