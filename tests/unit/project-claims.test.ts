import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  claimCommand,
  milestonesInput,
  scheduleTotal,
} from "../../src/projects/commercial/claim-model";
import { crmBase } from "../helpers/crm";

const row = (amount = "0.10") => ({
  id: randomUUID(),
  title: "Acceptance",
  trigger: "Exact customer acceptance recorded",
  amount,
});
test("B2 schedules retain order and exact cents, including amounts beyond floating-point precision", () => {
  const input = [row("999999999999.99"), row("0.01")];
  assert.deepEqual(milestonesInput(input), input);
  assert.equal(scheduleTotal(milestonesInput(input)), "1000000000000.00");
  assert.equal(
    scheduleTotal(milestonesInput([row("0.1"), row("0.2")])),
    "0.30",
  );
});
test("B2 refuses duplicate identities, nonpositive amounts, excess precision and incomplete triggers", () => {
  const r = row();
  for (const input of [
    [r, r],
    [],
    [row("0")],
    [row("-1")],
    [row("0.001")],
    [row("1e2")],
    [{ ...r, trigger: "" }],
    Array.from({ length: 51 }, () => row()),
  ])
    assert.throws(() => milestonesInput(input));
});
test("B2 command schema cannot smuggle schedule edits into approval or completion decisions", () => {
  const base = {
    ...crmBase(),
    basis_id: randomUUID(),
    expected_version: 1,
    action: "Approve",
  };
  assert.equal(claimCommand(randomUUID(), base).milestones, null);
  for (const extra of [
    { milestones: [row()] },
    { completion: {} },
    { state: "Approved" },
    { expected_version: -1 },
    { expected_version: 1.2 },
  ])
    assert.throws(() => claimCommand(randomUUID(), { ...base, ...extra }));
});
