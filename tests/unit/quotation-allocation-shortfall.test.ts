import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  shortfallProposalInput,
  shortfallReceivingInput,
} from "../../src/estimating/supply-followup/shortfall-input";
import {
  reductionCommand,
  reductionHolds,
  pickedMinimum,
} from "../../src/supply/reductions";
import {
  shortfallEffects,
  type ShortfallDependencies,
} from "../../src/estimating/supply-followup/shortfall-context";
import type { SupplyRecord, Fact } from "../../src/supply/model";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN exact proposal",
  synthetic_only: true,
  target_id: randomUUID(),
  execution_id: randomUUID(),
  expected_sequence: 0,
  basis_hash: "a".repeat(64),
  evidence: "SYN observed",
  referral_id: randomUUID(),
  receiving_id: randomUUID(),
  predecessor_id: null,
  correction_id: randomUUID(),
  reductions: [{ allocation_id: randomUUID(), quantity: "0" }],
});
test("shortfall commands require exact bounded decimal reductions and independently attributed receiving", () => {
  const id = randomUUID(),
    cmd = base();
  assert.equal(shortfallProposalInput(id, cmd).reductions[0].quantity, "0");
  for (const q of ["-1", "1.0000001", "1e3", 1])
    assert.throws(() =>
      shortfallProposalInput(id, {
        ...cmd,
        reductions: [{ ...cmd.reductions[0], quantity: q }],
      }),
    );
  assert.throws(() =>
    shortfallProposalInput(id, {
      ...cmd,
      reductions: [cmd.reductions[0], cmd.reductions[0]],
    }),
  );
  assert.throws(() => shortfallProposalInput(id, { ...cmd, approval: true }));
  const { receiving_id: _r, correction_id: _c, reductions: _a, ...b } = cmd;
  void _r;
  void _c;
  void _a;
  const receive = {
    ...b,
    proposal_id: randomUUID(),
    proposal_hash: "b".repeat(64),
    demand_id: randomUUID(),
    decision: "Accepted",
  };
  assert.equal(shortfallReceivingInput(id, receive).action, "ShortfallReceive");
  assert.throws(() =>
    shortfallReceivingInput(id, { ...receive, decision: "ReceiptAccepted" }),
  );
});
test("atomic native reduction is one operation with distinct unchanged Supply identity and Usable basis", () => {
  const op = randomUUID(),
    s = randomUUID();
  const changes = [0, 1].map(() => ({
    schema_version: 1,
    operation_id: op,
    reason: "SYN reduce",
    id: randomUUID(),
    expected_version: 2,
    demand_id: randomUUID(),
    demand_version: 3,
    supply_id: s,
    supply_version: 4,
    quantity: "0",
    unit: "ea",
    basis: "Usable",
  }));
  const cmd = {
    schema_version: 1,
    operation_id: op,
    reason: "SYN reduce",
    supply_id: s,
    supply_version: 4,
    changes,
  };
  assert.equal(reductionCommand(cmd).changes.length, 2);
  assert.throws(() => reductionCommand({ ...cmd, changes: [changes[0]] }));
  assert.throws(() =>
    reductionCommand({
      ...cmd,
      changes: [changes[0], { ...changes[1], basis: "Incoming" }],
    }),
  );
  assert.throws(() =>
    reductionCommand({
      ...cmd,
      changes: [changes[0], { ...changes[1], supply_id: randomUUID() }],
    }),
  );
});
test("exact arithmetic retains picked lower bounds and unmet Demand independently of capacity validity", () => {
  const d = {
    id: randomUUID(),
    version: 1,
    reference: "SYN demand",
    quantity: "8",
    unit: "ea",
    data: { demand_class: "Approved" },
  } as unknown as SupplyRecord;
  const facts = [
    { kind: "Pick", data: { quantity: "1.000001" } },
  ] as unknown as Fact[];
  assert.equal(pickedMinimum(facts), "1.000001");
  assert.equal(reductionHolds({ record: d, facts, children: [] }).length, 0);
  assert.ok(
    reductionHolds({
      record: d,
      facts: [...facts, { kind: "Dispatch" } as Fact],
      children: [],
    }).length,
  );
  assert.ok(reductionHolds({ record: d, facts, children: [{}] }).length);
  const s = {
    id: randomUUID(),
    version: 2,
    data: { supply_kind: "Shipment" },
  } as unknown as SupplyRecord;
  const allocation = {
    id: randomUUID(),
    supply_id: s.id,
    demand_id: d.id,
    quantity: "8",
    version: 1,
    basis: "Usable",
    unit: "ea",
  };
  const deps = {
    group: {
      supply: s,
      usable: "4.375001",
      usable_allocated: "8",
      facts: [],
      allocations: [allocation],
      demands: [{ record: d, facts, children: [], material: {} }],
    },
    demand_allocations: [allocation],
  } as unknown as ShortfallDependencies;
  const cmd = {
    schema_version: 1 as const,
    operation_id: randomUUID(),
    reason: "SYN reduction",
    id: allocation.id,
    expected_version: 1,
    demand_id: d.id,
    demand_version: 1,
    supply_id: s.id,
    supply_version: 2,
    quantity: "4.375001",
    unit: "ea",
    basis: "Usable" as const,
  };
  const effects = shortfallEffects(deps, cmd);
  assert.deepEqual(effects.holds, []);
  assert.equal(effects.shortfall, "0");
  assert.equal(effects.demands[0].unmet, "3.624999");
  assert.ok(
    shortfallEffects(deps, { ...cmd, quantity: "1" }).holds.some((h) =>
      h.includes("already picked"),
    ),
  );
  assert.ok(
    shortfallEffects(deps, { ...cmd, quantity: "4.375002" }).holds.some((h) =>
      h.includes("exceed"),
    ),
  );
});
