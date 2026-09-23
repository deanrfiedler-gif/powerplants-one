import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { calculate } from "../../src/estimating/fertigation/engine";
import {
  baseRecord,
  blankValve,
} from "../../src/estimating/fertigation/definition";
import {
  capacityRows,
  countsByView,
  evidenceCoverage,
  findingGuidance,
  guidanceFor,
  nextActions,
  outputReadiness,
  severityCounts,
} from "../../src/estimating/fertigation/guidance";
import type { Finding } from "../../src/estimating/fertigation/types";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";

const engineCodes = () => {
  const source = readFileSync("src/estimating/fertigation/engine.ts", "utf8");
  return new Set(
    [...source.matchAll(/\bfind\(\s*"([a-z_]+)"/g)].map((m) => m[1]),
  );
};

test("FN-T94 every finding code the engine can emit has guidance, and no stale entries remain", () => {
  const codes = engineCodes();
  assert.ok(
    codes.size >= 60,
    `expected the full engine catalogue, saw ${codes.size}`,
  );
  for (const code of codes)
    assert.ok(findingGuidance[code], `missing guidance for ${code}`);
  for (const code of Object.keys(findingGuidance))
    assert.ok(codes.has(code), `stale guidance entry ${code}`);
});

test("FN-T95 customer phrases are plain: no codes, identifiers or trailing punctuation", () => {
  for (const [code, entry] of Object.entries(findingGuidance)) {
    assert.doesNotMatch(entry.customer, /_|\bid\b|[.:;]$/, code);
    assert.match(entry.customer, /^[A-Z]/, code);
    assert.ok(entry.customer.length <= 80, code);
  }
});

test("FN-T96 an unregistered code from a later edition is shown, not dropped", () => {
  const g = guidanceFor({ id: "future_rule:scope:field" });
  assert.equal(g.registered, false);
  assert.equal(g.view, "review");
  assert.equal(g.customer, "Future rule");
});

const finding = (
  code: string,
  severity: Finding["severity"],
  record: string | null = null,
): Finding => ({
  id: `${code}:${record ?? "scope"}:field`,
  severity,
  record_id: record,
  field: "field",
  message: `${code} message`,
});

test("FN-T97 next actions rank conflicts, then incomplete, then review, grouping one code", () => {
  const scope = scenarioComparisonScope();
  const findings = [
    finding("head_flow_basis", "review"),
    finding("control_unknown", "incomplete", "a"),
    finding("control_unknown", "incomplete", "b"),
    finding("timing_incomplete", "incomplete"),
    finding("io_deficit", "conflict", "bank"),
  ];
  const actions = nextActions(scope, findings);
  assert.deepEqual(
    actions.map((a) => [a.code, a.severity, a.count]),
    [
      ["io_deficit", "conflict", 1],
      ["control_unknown", "incomplete", 2],
      ["timing_incomplete", "incomplete", 1],
      ["head_flow_basis", "review", 1],
    ],
  );
  assert.deepEqual(actions[1].record_ids, ["a", "b"]);
  assert.equal(actions[0].role, "priva_specialist");
  const counts = severityCounts(findings);
  assert.deepEqual(counts, { conflict: 1, incomplete: 3, review: 1, total: 5 });
});

test("FN-T98 a record-level finding is counted against the view that holds the record", () => {
  const scope = scenarioComparisonScope();
  const valve = scope.valves[0];
  const counts = countsByView(scope, [
    finding("measurement_source", "review", valve.id),
    finding("scenario_missing", "incomplete"),
  ]);
  assert.equal(counts.growing?.review, 1);
  assert.equal(counts.operating?.incomplete, 1);
});

test("FN-T99 capacity rows reuse the engine's inequality and never invent a value", () => {
  const scope = scenarioComparisonScope();
  const controller = {
    ...baseRecord(randomUUID(), "SYN controller"),
    phase: "existing" as const,
    family: "Compact CC" as const,
    asset_id: null,
    model: "SYN",
    serial: "SYN",
    software: "SYN",
    licences: "SYN",
  };
  const bank = {
    ...baseRecord(randomUUID(), "SYN outputs"),
    phase: "existing" as const,
    controller_id: controller.id,
    physical_bank: "SYN-DO",
    signal: "digital_output" as const,
    voltage: "24 V AC",
    installed: 4,
    used: 3,
    reserved: 0,
    faulty: 0,
    manual_required: null,
  };
  scope.controllers = [controller];
  scope.banks = [bank];
  scope.valves = scope.valves.map((v, i) => ({
    ...v,
    control: {
      ...v.control,
      owner: "ppo_controller" as const,
      controller_id: controller.id,
      bank_id: bank.id,
      channel: `DO-${i + 1}`,
      signal: "digital_output" as const,
      voltage: "24 V AC",
      additional_channels: 1,
    },
  }));
  const calc = calculate(scope);
  const rows = capacityRows(scope, calc);
  const io = rows.find((r) => r.key === `io:${bank.id}`);
  assert.ok(io, "bank row present");
  const engine = calc.io.find((b) => b.bank_id === bank.id)!;
  assert.equal(io.demand, engine.required.value);
  assert.equal(io.capacity, engine.available.value);
  assert.equal(
    io.state,
    engine.spare.value !== null && engine.spare.value < 0
      ? "over"
      : io.demand === null
        ? "unknown"
        : "within",
  );
  const flagged = calc.findings.some((f) => f.id.startsWith("io_deficit:"));
  assert.equal(io.state === "over", flagged);
  for (const r of rows) {
    if (r.ratio !== null)
      assert.equal(r.ratio, (r.demand as number) / (r.capacity as number));
    if (r.state === "unknown")
      assert.equal(r.ratio === null || r.key === "pump_head", true);
  }
});

test("FN-T100 evidence coverage counts every active record once by its strongest link", () => {
  const scope = scenarioComparisonScope();
  const evidence = {
    id: randomUUID(),
    label: "SYN flow test",
    kind: "observation" as const,
    reference: "SYN",
    source_revision: "",
    sha256: null,
    captured_date: null,
    attribution: "SYN",
    applicability: "SYN",
    notes: "",
  };
  const assumption = {
    ...evidence,
    id: randomUUID(),
    kind: "assumption" as const,
  };
  scope.evidence = [evidence, assumption];
  scope.valves[0] = {
    ...scope.valves[0],
    evidence_ids: [assumption.id, evidence.id],
  };
  const coverage = evidenceCoverage(scope);
  assert.equal(coverage.counts.observation, 1);
  assert.equal(
    coverage.total,
    Object.values(coverage.counts).reduce((a, b) => a + b, 0),
  );
  assert.ok(!coverage.weakest.some((w) => w.id === scope.valves[0].id));
  scope.valves.push({
    ...blankValve(randomUUID()),
    label: "SYN excluded",
    phase: "excluded",
  });
  assert.equal(evidenceCoverage(scope).total, coverage.total);
});

test("FN-T101 output readiness mirrors the server's preconditions; open findings never block", () => {
  const base = {
    dirty: false,
    historical: false,
    sourceChanged: false,
    canEdit: true,
    revision: 3,
    openFindings: 4,
  };
  const now = Object.fromEntries(outputReadiness(base).map((o) => [o.key, o]));
  assert.equal(now.report.state, "available");
  assert.equal(now.review.state, "available");
  assert.equal(now.handover.state, "needs");
  assert.match(now.review.reason, /Carries 4 open findings/);
  const old = Object.fromEntries(
    outputReadiness({ ...base, historical: true }).map((o) => [o.key, o]),
  );
  assert.equal(old.review.state, "blocked");
  assert.equal(old.handover.state, "blocked");
  const changed = Object.fromEntries(
    outputReadiness({ ...base, sourceChanged: true }).map((o) => [o.key, o]),
  );
  assert.match(changed.review.reason, /Refresh the changed Discovery source/);
  const draft = Object.fromEntries(
    outputReadiness({ ...base, dirty: true }).map((o) => [o.key, o]),
  );
  assert.match(draft.export.reason, /not included until saved/);
});
