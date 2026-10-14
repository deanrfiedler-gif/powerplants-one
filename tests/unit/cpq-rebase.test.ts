import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../../src/cpq/engine";
import {
  evaluateRebase,
  rebaseDecisions,
  type RebaseDecision,
} from "../../src/cpq/rebase-model";
import {
  lineDecisions,
  reconcileLines,
} from "../../src/cpq/adoption-resolution";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import type { Override } from "../../src/cpq/types";
import { definition } from "../../src/cpq/validation";
const decision = (
  o: Override,
  action: RebaseDecision["action"] = "Keep",
  target: string | null = null,
  value: string | null = null,
): RebaseDecision => ({
  source_target: o.target,
  kind: o.kind,
  action,
  target,
  value,
  reason: "SYN explicit review",
});
test("rebase applies material choices before deriving labour bases; legacy evaluation hashes are unchanged", () => {
  const d = cpqDefinition(),
    original = cpqInput(),
    first = evaluate(d, original);
  const material: Override = {
    target: first.lines[0].target,
    basis_hash: first.lines[0].basis_hash,
    kind: "Quantity",
    value: "4.000",
    reason: "SYN quantity",
  };
  const materialRun = evaluate(d, { ...original, overrides: [material] });
  const labour: Override = {
    target: materialRun.lines[1].target,
    basis_hash: materialRun.lines[1].basis_hash,
    kind: "SellPrice",
    value: "90.00",
    reason: "SYN labour",
  };
  const proposal = cpqInput();
  proposal.instances[0].facts.count = "6";
  const rebased = evaluateRebase(
    d,
    proposal,
    d,
    [material, labour],
    [decision(material), decision(labour)],
  );
  assert.equal(rebased.ready, true);
  assert.equal(rebased.result.ready, true);
  assert.equal(rebased.result.lines[0].line.quantity, "4.000");
  assert.equal(rebased.result.lines[1].line.quantity, "2.000");
  assert.equal(rebased.result.lines[1].line.unit_sell, "90.00");
  assert.deepEqual(rebased.result, evaluate(d, rebased.input));
  const targets: unknown[] = [];
  assert.deepEqual(
    evaluate(d, original, (t) => targets.push(t)),
    first,
  );
  assert.equal(targets.length, 2);
});
test("rebase requires every decision and supports explicit replacement, revocation and compatible remap", () => {
  const d = cpqDefinition(),
    input = cpqInput(),
    before = evaluate(d, input);
  const o: Override = {
    target: before.lines[0].target,
    basis_hash: before.lines[0].basis_hash,
    kind: "Quantity",
    value: "4.000",
    reason: "SYN original",
  };
  assert.equal(
    evaluateRebase(d, input, d, [o], []).unresolved[0].code,
    "OverrideDecisionRequired",
  );
  const replacement = evaluateRebase(
    d,
    input,
    d,
    [o],
    [decision(o, "Replace", null, "8.000")],
  );
  assert.equal(replacement.result.lines[0].line.quantity, "8.000");
  assert.deepEqual(
    evaluateRebase(d, input, d, [o], [decision(o, "Revoke")]).input.overrides,
    [],
  );
  const next = structuredClone(d);
  next.parts[0].key = "new_sensor";
  next.rules[0].part = "new_sensor";
  next.rules[1].quantity = "bom_new_sensor / 2";
  const destination = before.lines[0].target.replace(
    ":sensor:",
    ":new_sensor:",
  );
  const remapped = evaluateRebase(
    next,
    input,
    d,
    [o],
    [decision(o, "Remap", destination)],
  );
  assert.equal(remapped.ready, true);
  assert.equal(remapped.input.overrides[0].target, destination);
  assert.equal(
    evaluateRebase(
      d,
      input,
      d,
      [o],
      [decision(o, "Remap", before.lines[1].target)],
    ).unresolved[0].code,
    "OverrideRemapIncompatible",
  );
  assert.throws(() => rebaseDecisions([decision(o), decision(o)]));
});
test("rebase distinguishes missing targets, remap collisions and fabricated decisions", () => {
  const d = cpqDefinition(),
    input = cpqInput(),
    before = evaluate(d, input);
  const o: Override = {
    target: before.lines[0].target,
    basis_hash: before.lines[0].basis_hash,
    kind: "Quantity",
    value: "4.000",
    reason: "SYN original",
  };
  const absent = cpqInput();
  absent.instances[0].facts.count = "0";
  assert.equal(
    evaluateRebase(d, absent, d, [o], [decision(o)]).unresolved[0].code,
    "OverrideTargetMissing",
  );
  assert.equal(
    evaluateRebase(d, input, d, [], [decision(o)]).unresolved[0].code,
    "UnknownOverrideDecision",
  );
  const second = {
    ...o,
    target: o.target.replace(
      input.instances[0].id,
      "c0860000-0000-4000-8000-000000000002",
    ),
  };
  assert.equal(
    evaluateRebase(
      d,
      input,
      d,
      [o, second],
      [decision(o), decision(second, "Remap", o.target)],
    ).unresolved[0].code,
    "OverrideTargetCollision",
  );
});
test("receiving preserves manual edits by explicit keep, records removals, and never overwrites unrelated lines", () => {
  const lines = evaluate(cpqDefinition(), cpqInput()).lines.map((l) => l.line);
  const manual = {
    ...lines[0],
    id: "c0860000-0000-4000-8000-000000000099",
    description: "SYN unrelated",
  };
  const changed = { ...lines[0], quantity: "9.000" };
  const prior = {
    run_id: "c0860000-0000-4000-8000-000000000003",
    lines,
    retained_cpq_lines: [],
  };
  const undecided = reconcileLines(
    prior,
    [changed, lines[1], manual],
    [lines[0]],
    [],
  );
  assert.equal(undecided.unresolved.length, 2);
  const decisions = lineDecisions([
    {
      line_id: lines[0].id,
      action: "Keep",
      reason: "SYN retain manual quantity",
    },
    {
      line_id: lines[1].id,
      action: "Remove",
      reason: "SYN acknowledge obsolete labour",
    },
  ]);
  const resolved = reconcileLines(
    prior,
    [changed, lines[1], manual],
    [lines[0]],
    decisions,
  );
  assert.deepEqual(resolved.lines, [changed, manual]);
  assert.equal(resolved.generated.length, 0);
  assert.equal(resolved.retained_cpq_lines.length, 1);
  const later = reconcileLines(
    { ...prior, lines: [], retained_cpq_lines: resolved.retained_cpq_lines },
    resolved.lines,
    [lines[0]],
    [],
  );
  assert.equal(later.unresolved[0].code, "CpqOwnedLineChanged");
  const removed = reconcileLines(prior, lines, lines, [
    {
      line_id: lines[0].id,
      action: "Remove",
      reason: "SYN deliberate omission",
    },
  ]);
  assert.equal(removed.retained_cpq_lines[0].retained_line, null);
  assert.equal(
    reconcileLines(null, [manual], [manual], []).unresolved[0].code,
    "CpqLineIdentityConflict",
  );
  assert.throws(() =>
    reconcileLines(prior, lines, lines, [
      {
        line_id: manual.id,
        action: "Remove",
        reason: "SYN forbidden unrelated edit",
      },
    ]),
  );
});

test("schema-3 configuration suppression rebases its exact target and can be explicitly revoked", () => {
  const raw = cpqDefinition();
  raw.schema_version = 3;
  raw.design = {
    option_sets: [],
    structure: [],
    shared_capacity: [],
    decision_tables: [],
    pricing: { mode: "Catalog", percent: "0", allow_override: true },
  };
  raw.parts.forEach((part) => {
    part.scope = { kind: "Configuration", group_fact: null };
  });
  const d = definition(raw),
    input = cpqInput(),
    first = evaluate(d, input);
  const sensor = first.lines.find((line) => line.line.unit === "each")!;
  const suppression: Override = {
    target: sensor.target,
    basis_hash: sensor.basis_hash,
    kind: "Suppress",
    value: null,
    reason: "SYN original exclusion",
  };
  const proposal = cpqInput();
  proposal.instances[0].facts.count = "6";
  const kept = evaluateRebase(
    d,
    proposal,
    d,
    [suppression],
    [decision(suppression)],
  );
  assert.equal(kept.ready, true);
  assert.equal(kept.input.overrides[0].target, sensor.target);
  assert.notEqual(kept.input.overrides[0].basis_hash, suppression.basis_hash);
  assert.equal(
    kept.result.lines.some((line) => line.target === sensor.target),
    false,
  );
  assert.deepEqual(kept.result, evaluate(d, kept.input));
  const restored = evaluateRebase(
    d,
    proposal,
    d,
    [suppression],
    [decision(suppression, "Revoke")],
  );
  assert.equal(
    restored.result.lines.find((line) => line.target === sensor.target)!.line
      .quantity,
    "6.000",
  );
  assert.throws(() => rebaseDecisions([decision(suppression, "Replace")]));
});
