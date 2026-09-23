import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { baseRecord } from "../../src/estimating/fertigation/definition";
import { calculate } from "../../src/estimating/fertigation/engine";
import { validateScope } from "../../src/estimating/fertigation/validation";
import {
  resolvables,
  splitGroup,
} from "../../src/estimating/fertigation/resolutions";
import {
  injectionConflictScope as injectionScope,
  scenarioComparisonScope,
} from "../helpers/fertigation-scenarios";

test("FN-T104 splitting a group keeps its place, durations and recipe, and clears the injection failure", () => {
  const scope = injectionScope();
  const calc = calculate(scope);
  assert.ok(
    calc.candidates[0].failures.some((f) => /injection limits/.test(f)),
    "starting candidate fails its entered injection limit",
  );
  const [injection] = resolvables(scope, calc).filter((r) =>
    r.key.startsWith("injection:"),
  );
  assert.ok(injection, "injection failure is resolvable");
  assert.match(
    injection.options.find((o) => o.id === "dose")!.condition,
    /8 ÷ 5 = 1\.6 L\/m³/,
  );
  const split = injection.options.find((o) => o.id === "split")!;
  const next = validateScope(split.transform!(scope));
  assert.equal(next.groups.length, 2);
  assert.deepEqual(
    next.scenarios[0].group_ids,
    next.groups.map((g) => g.id),
  );
  assert.ok(
    next.groups.every(
      (g) =>
        g.recipe_id === scope.groups[0].recipe_id &&
        g.delivery_seconds === scope.groups[0].delivery_seconds &&
        g.valve_ids.length === 1,
    ),
  );
  assert.equal(
    next.groups[0].id,
    scope.groups[0].id,
    "first part keeps its identity",
  );
  const after = calculate(next);
  assert.ok(
    !after.candidates[0].failures.some((f) => /injection limits/.test(f)),
    "each part is within the entered channel maximum",
  );
  assert.equal(
    after.connected_flow_m3h.value,
    calc.connected_flow_m3h.value,
    "splitting never changes the valve inventory",
  );
});

test("FN-T105 aligning declared bank demand with recorded devices clears io_reconcile", () => {
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
    installed: 8,
    used: 2,
    reserved: 0,
    faulty: 0,
    manual_required: 3,
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
  assert.ok(calc.findings.some((f) => f.id.startsWith("io_reconcile:")));
  const r = resolvables(scope, calc).find((x) =>
    x.key.startsWith("io_reconcile:"),
  )!;
  const use = r.options.find((o) => o.id === "use-devices")!;
  assert.match(use.title, /2 additional channels/);
  const after = calculate(validateScope(use.transform!(scope)));
  assert.ok(!after.findings.some((f) => f.id.startsWith("io_reconcile:")));
  assert.ok(
    r.options.some((o) => !o.transform),
    "a non-automatic option is always offered",
  );
});

test("FN-T106 splitting a single-valve group is a no-op", () => {
  const scope = scenarioComparisonScope();
  const next = splitGroup(scope, scope.groups[0].id);
  assert.deepEqual(next.groups, scope.groups);
});
