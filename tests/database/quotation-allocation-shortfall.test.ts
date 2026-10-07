import { conversionReadClient } from "../../src/estimating/conversion/source-authority";
import { supplyRecord } from "../../src/supply/context";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import { workspace } from "../../src/supply/reads";
import {
  allocate,
  reduceAllocations,
  saveRecord,
  recordFact,
} from "../../src/supply/commands";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  proposeShortfall,
  receiveAllocationEffect,
} from "../../src/estimating/supply-followup/shortfall-service";
import {
  reviewSupply,
  applySupply,
  referSupply,
  receiveSupply,
} from "../../src/estimating/supply-followup/service";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import {
  dispositionReview,
  dispositionApply,
  nativeRevision,
} from "../helpers/quotation-disposition";
import {
  shortfallFixture,
  shortfallProposal,
  shortfallReceiving,
  shortfallReview,
  receiveAllAllocations,
} from "../helpers/quotation-allocation-shortfall";
import {
  currentFollowup,
  supplyApply,
  referral,
  acknowledgement,
  supplyReview,
} from "../helpers/quotation-supply-followup";
import { supplyInput, supplyFact } from "../helpers/supply";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (v: string) => (e: unknown) => (e as { code: string }).code === v;
const snapshot = async (table: string) =>
  (
    await database().query(
      `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
    )
  ).rows;

test("ES07 shortfall independently receives exact atomic reductions, preserves identities and returns honest unmet Demand", async () => {
  const f = await shortfallFixture(),
    before = await workspace(f.owner, f.supply.id),
    other = await workspace(f.owner, f.other.id);
  const cmd = shortfallProposal(f.t);
  const proposed = await proposeShortfall(f.owner, f.id, cmd);
  assert.deepEqual(
    (await proposeShortfall(f.owner, f.id, cmd)).receipt,
    proposed.receipt,
  );
  await assert.rejects(
    proposeShortfall(f.owner, f.id, { ...cmd, evidence: "SYN different" }),
    code("OperationConflict"),
  );
  let t = await currentFollowup(f);
  assert.equal(t.allocation_shortfall.required.length, 2);
  await assert.rejects(
    reviewSupply(f.owner, f.id, shortfallReview(t)),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    reviewSupply(f.owner, f.id, supplyReview(t, "AdjustAllocation", "0")),
    code("SupplyFollowupConflict"),
  );
  const first = shortfallReceiving(t, t.target_id);
  const accepted = await receiveAllocationEffect(f.owner, f.id, first);
  assert.deepEqual(
    (await receiveAllocationEffect(f.owner, f.id, first)).receipt,
    accepted.receipt,
  );
  await assert.rejects(
    receiveAllocationEffect(f.owner, f.id, { ...first, decision: "Held" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f))),
    code("SupplyFollowupConflict"),
  );
  await receiveAllocationEffect(
    f.owner,
    f.id,
    shortfallReceiving(await currentFollowup(f), f.other.id),
  );
  t = await currentFollowup(f);
  await reviewSupply(f.owner, f.id, shortfallReview(t));
  t = await currentFollowup(f);
  assert.equal(t.can_apply, true);
  const native = t.allocation_shortfall.proposal!.command;
  assert.ok("changes" in native);
  // Neither first reduction can produce a valid shared position under the native command.
  for (const change of native.changes)
    await assert.rejects(
      allocate(f.owner, { ...change, operation_id: randomUUID() }),
    );
  await assert.rejects(
    reduceAllocations(f.owner, native),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    saveRecord(f.owner, {
      ...supplyInput(),
      operation_id: native.operation_id,
    }),
  );
  const apply = supplyApply(t);
  const results = await Promise.all([
    applySupply(f.owner, f.id, apply),
    applySupply(f.owner, f.id, apply),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.deepEqual(
    await readOperation(f.owner, native.operation_id),
    (await currentFollowup(f)).outcome!.native_receipt,
  );
  assert.deepEqual(
    (await reduceAllocations(f.owner, native)).receipt,
    (await currentFollowup(f)).outcome!.native_receipt,
  );
  t = await currentFollowup(f);
  const allocations = t.basis.position[0].allocations;
  assert.equal(t.basis.position[0].usable_allocated, "4.375001");
  assert.deepEqual(
    allocations.map((a) => a.id).sort(),
    f.allocations.map((a) => a.id).sort(),
  );
  assert.equal(
    allocations.find((a) => a.demand_id === t.target_id)!.quantity,
    "0",
  );
  assert.equal(t.basis.conversion.target.quantity, "2");
  assert.equal(t.basis.conversion.target.data.demand_class, "Approved");
  assert.equal(
    (await workspace(f.owner, f.supply.id)).record.version,
    before.record.version + 1,
  );
  assert.equal(
    (await workspace(f.owner, f.other.id)).record.quantity,
    other.record.quantity,
  );
  assert.deepEqual((await workspace(f.owner, f.supply.id)).facts, before.facts);
  assert.ok(
    t.allocation_shortfall.effects!.demands.some((d) => d.unmet === "3.624999"),
  );
  assert.ok(
    t.basis.position[0].demands.every((d) =>
      d.facts.some((x) => x.kind === "Impact" && x.data.state === "Requested"),
    ),
  );
  assert.equal(
    t.outcome!.allocation_proposal_id,
    t.allocation_shortfall.proposal!.id,
  );
  assert.equal(t.outcome!.effect_receiving_ids.length, 2);
  assert.deepEqual(
    (await receivingWorklist(f.owner)).rows.find(
      (row) => row.target_id === t.target_id,
    ),
    {
      revision_id: f.id,
      target_id: t.target_id,
      referral_id: t.referral!.id,
      title: t.basis.conversion.target.title,
      status: t.status,
      due_date: t.referral!.due_date,
      date_needed: t.referral!.date_needed,
      next_action: t.referral!.next_action,
      owner_id: t.referral!.owner_id,
    },
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
  await assert.rejects(
    receiveAllocationEffect(
      f.owner,
      f.id,
      shortfallReceiving(t, t.target_id, "Returned"),
    ),
  );
});

test("ES07 shortfall supports a single other-owner allocation reduction without versioning unchanged Demand", async () => {
  const f = await shortfallFixture("5"),
    before = await workspace(f.owner, f.t.target_id);
  const cmd = shortfallProposal(f.t, false);
  cmd.reductions[0].quantity = "3";
  await proposeShortfall(f.owner, f.id, cmd);
  let t = await currentFollowup(f);
  assert.equal(t.allocation_shortfall.required.length, 1);
  await assert.rejects(
    receiveAllocationEffect(f.owner, f.id, shortfallReceiving(t, t.target_id)),
  );
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.ok(t.can_apply);
  await applySupply(f.owner, f.id, supplyApply(t));
  t = await currentFollowup(f);
  assert.deepEqual(
    (await workspace(f.owner, f.t.target_id)).record,
    before.record,
  );
  assert.deepEqual(
    (await workspace(f.owner, f.t.target_id)).facts,
    before.facts,
  );
  assert.equal(t.basis.position[0].usable_allocated, "5");
  assert.equal(t.outcome!.decision, "ReduceAllocations");
  assert.equal(
    (
      await database().query(
        "SELECT details->>'command' command FROM ppo.audit_events WHERE operation_id=$1",
        [t.outcome!.native_receipt!.operation_id],
      )
    ).rows[0].command,
    "Supply:Allocate",
  );
});

test("ES07 shortfall retains quotation resolution, permits continuing referral, and keeps receiving corrections and reassignment lineage", async () => {
  const f = await shortfallFixture();
  let d = await readConversion(f.owner, f.id);
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Resolved");
  assert.ok(d.followups[0].can_refer);
  const prior = d.followups[0].referral!.id;
  await referSupply(f.owner, f.id, referral(d.followups[0]));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  let t = await currentFollowup(f);
  assert.equal(t.referral!.predecessor_id, prior);
  await proposeShortfall(f.owner, f.id, shortfallProposal(t));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  const old = supplyApply(t),
    decision = t.allocation_shortfall.required[0].decision!;
  await receiveAllocationEffect(
    f.owner,
    f.id,
    shortfallReceiving(t, decision.demand_id!, "Returned"),
  );
  await assert.rejects(applySupply(f.owner, f.id, old));
  t = await currentFollowup(f);
  assert.equal(
    t.allocation_shortfall.required[0].decision!.predecessor_id,
    decision.id,
  );
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Held"));
  await referSupply(f.owner, f.id, referral(await currentFollowup(f)));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(await currentFollowup(f), "Hold"),
  );
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.status, "Continuing hold");
  assert.ok(t.can_refer);
  assert.equal(
    t.allocation_shortfall.events.filter((e) => e.action === "ShortfallPropose")
      .length,
    1,
  );
  await assert.rejects(reduceAllocations(f.owner, decision.command));
});

test("ES07 atomic shortfall late refusal rolls back every allocation history impact and receipt; original retry remains exact", async () => {
  const f = await shortfallFixture();
  await proposeShortfall(f.owner, f.id, shortfallProposal(f.t));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  const t = await currentFollowup(f),
    cmd = supplyApply(t);
  const tables = [
    "supply_records",
    "supply_allocations",
    "supply_allocation_history",
    "supply_revisions",
    "supply_facts",
    "activities",
    "activity_links",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "quote_supply_events",
    "quote_supply_shortfall_events",
  ];
  const original = await Promise.all(tables.map(snapshot));
  await database().query(
    "CREATE FUNCTION ppo.shortfall_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='Apply' AND NEW.decision='ReduceAllocations' THEN RAISE EXCEPTION 'SYN late refusal'; END IF; RETURN NEW; END $$; CREATE TRIGGER shortfall_injected BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.shortfall_injected()",
  );
  try {
    await assert.rejects(applySupply(f.owner, f.id, cmd));
  } finally {
    await database().query(
      "DROP TRIGGER shortfall_injected ON ppo.quote_supply_events; DROP FUNCTION ppo.shortfall_injected()",
    );
  }
  assert.deepEqual(await Promise.all(tables.map(snapshot)), original);
  await assert.rejects(readOperation(f.owner, cmd.operation_id));
  await applySupply(f.owner, f.id, cmd);
  assert.deepEqual(
    (await applySupply(f.owner, f.id, cmd)).receipt,
    await readOperation(f.owner, cmd.operation_id),
  );
});

test("ES07 allocation receiving is independently owned, site scoped, revocable and never delegated by Supply ownership", async () => {
  const f = await shortfallFixture(),
    id = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN allocation Demand owner',true,true)",
    [id, f.owner.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [id, f.owner.actor_id],
  );
  const owner = {
      ...f.owner,
      actor_id: id,
      display_name: "SYN allocation Demand owner",
    },
    site = "70000000-0000-4000-8000-000000000002";
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2,company_id=$3 WHERE user_id=$1 AND capability='supply.coordinate'",
    [id, site, f.t.basis.conversion.target.company_id],
  );
  const r = (await workspace(f.owner, f.other.id)).record;
  await saveRecord(
    f.owner,
    nativeRevision(
      { basis: { target: r } } as Parameters<typeof nativeRevision>[0],
      { owner_id: id, site_id: site },
    ),
    true,
  );
  await proposeShortfall(
    f.owner,
    f.id,
    shortfallProposal(await currentFollowup(f)),
  );
  let t = await currentFollowup(f);
  assert.ok(
    (await receivingWorklist(owner)).rows.some(
      (x) => x.target_id === t.target_id,
    ),
  );
  assert.equal((await readConversion(owner, f.id)).can_write, false);
  const cmd = shortfallReceiving(t, f.other.id);
  await assert.rejects(receiveAllocationEffect(f.owner, f.id, cmd));
  await assert.rejects(
    receiveAllocationEffect(owner, f.id, shortfallReceiving(t, t.target_id)),
  );
  const received = await receiveAllocationEffect(owner, f.id, cmd);
  await receiveAllocationEffect(
    f.owner,
    f.id,
    shortfallReceiving(await currentFollowup(f), t.target_id),
  );
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.ok(t.can_apply);
  const sourceGrants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read' RETURNING *",
      [id],
    )
  ).rows;
  try {
    await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        f.owner.workspace_id,
      ]);
      const read = await conversionReadClient(c, f.owner);
      await supplyRecord(read, f.owner, t.target_id);
      // A successful source read by the first actor grants nothing to a second
      // actor using the same bounded read client and converted target.
      await assert.rejects(
        supplyRecord(read, owner, t.target_id),
        code("RecordUnavailable"),
      );
    });
    assert.equal((await currentFollowup(f)).can_apply, false);
    await assert.rejects(readConversion(owner, f.id));
    await assert.rejects(readOperation(owner, cmd.operation_id));
    await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
    assert.equal(
      (await receivingWorklist(owner)).rows.some(
        (row) => row.target_id === t.target_id,
      ),
      false,
    );
  } finally {
    for (const g of sourceGrants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
  assert.equal((await currentFollowup(f)).can_apply, true);
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *",
      [id],
    )
  ).rows;
  try {
    assert.equal((await currentFollowup(f)).can_apply, false);
    await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
    await assert.rejects(readOperation(owner, cmd.operation_id));
    await assert.rejects(receivingWorklist(owner), code("Forbidden"));
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
  assert.deepEqual(
    await readOperation(owner, cmd.operation_id),
    received.receipt,
  );
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  const outcome = (await currentFollowup(f)).outcome!;
  const reads = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    for (const op of [
      outcome.operation_id,
      outcome.native_receipt!.operation_id,
    ])
      await assert.rejects(readOperation(f.owner, op));
    await assert.rejects(readConversion(f.owner, f.id));
    assert.equal(
      (await receivingWorklist(f.owner)).rows.some(
        (row) => row.target_id === t.target_id,
      ),
      false,
    );
  } finally {
    for (const g of reads)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
});

test("ES07 shortfall refuses incomplete or increasing proposals and selectively holds changed dependencies while preserving originals", async () => {
  const f = await shortfallFixture();
  const one = shortfallProposal(f.t, false);
  await assert.rejects(
    proposeShortfall(f.owner, f.id, one),
    code("SupplyFollowupConflict"),
  );
  const increasing = shortfallProposal(f.t);
  increasing.reductions[0].quantity = "100";
  await assert.rejects(
    proposeShortfall(f.owner, f.id, increasing),
    code("SupplyFollowupConflict"),
  );
  const proposal = shortfallProposal(f.t);
  const results = await Promise.allSettled([
    proposeShortfall(f.owner, f.id, proposal),
    proposeShortfall(f.owner, f.id, {
      ...proposal,
      operation_id: randomUUID(),
    }),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  const t = await currentFollowup(f);
  await saveRecord(f.owner, supplyInput());
  assert.ok((await currentFollowup(f)).can_apply);
  const other = (await workspace(f.owner, f.other.id)).record;
  await recordFact(
    f.owner,
    other.id,
    supplyFact("ExternalOutcome", other.version, {
      source_operation: "SYN independently unresolved",
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence: "SYN no conclusive receipt",
    }),
  );
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  await assert.rejects(
    proposeShortfall(
      f.owner,
      f.id,
      shortfallProposal(await currentFollowup(f)),
    ),
  );
  await receiveSupply(
    f.owner,
    f.id,
    acknowledgement(await currentFollowup(f), "Returned"),
  );
  await referSupply(f.owner, f.id, referral(await currentFollowup(f)));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(await currentFollowup(f), "Retain"),
  );
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  assert.equal((await currentFollowup(f)).status, "Position retained");
  assert.equal(
    (await currentFollowup(f)).basis.position[0].usable_allocated,
    "10",
  );
});

test("ES07 shortfall enforces actual picked lower bounds, retains Pick evidence and never clears owned impacts", async () => {
  const f = await shortfallFixture("5", async (f) => {
      const r = (await workspace(f.owner, f.other.id)).record;
      await recordFact(
        f.owner,
        r.id,
        supplyFact("Pick", r.version, { quantity: "4.5" }),
      );
    }),
    r = (await workspace(f.owner, f.other.id)).record;
  let t = await currentFollowup(f),
    cmd = shortfallProposal(t);
  await assert.rejects(
    proposeShortfall(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  const a = t.basis.position[0].allocations.find((a) => a.demand_id === r.id)!;
  await assert.rejects(
    allocate(f.owner, {
      schema_version: 1,
      operation_id: randomUUID(),
      reason: "SYN cannot release picked goods",
      id: a.id,
      expected_version: a.version,
      demand_id: r.id,
      demand_version: t.basis.position[0].demands.find(
        (d) => d.record.id === r.id,
      )!.record.version,
      supply_id: a.supply_id,
      supply_version: t.basis.position[0].supply.version,
      quantity: "3",
      unit: a.unit,
      basis: a.basis,
    }),
  );
  cmd = shortfallProposal(await currentFollowup(f));
  cmd.reductions.find(
    (a) =>
      a.allocation_id ===
      t.basis.position[0].allocations.find((x) => x.demand_id === r.id)!.id,
  )!.quantity = "4.5";
  await proposeShortfall(f.owner, f.id, cmd);
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.basis.position[0].usable_allocated, "4.5");
  const d = t.basis.position[0].demands.find((d) => d.record.id === r.id)!;
  assert.equal(d.facts.find((f) => f.kind === "Pick")!.data.quantity, "4.5");
  assert.ok(
    d.facts.some((f) => f.kind === "Impact" && f.data.state === "Requested"),
  );
  assert.equal(d.record.quantity, "8");
  assert.equal(
    t.allocation_shortfall.effects!.demands.find((d) => d.record.id === r.id)!
      .unmet,
    "3.5",
  );
});

test("ES07 shortfall new other-source allocation and changed owner hold the exact received proposal and retain predecessor lineage", async () => {
  const f = await shortfallFixture();
  await proposeShortfall(f.owner, f.id, shortfallProposal(f.t));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  const original = await currentFollowup(f),
    old = supplyApply(original),
    source = supplyInput("Supply", {
      item: f.supply.item,
      unit: f.supply.unit,
    });
  await saveRecord(f.owner, source);
  assert.ok((await currentFollowup(f)).can_apply);
  const other = (await workspace(f.owner, f.other.id)).record;
  await allocate(f.owner, {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN independent new source dependency",
    id: randomUUID(),
    expected_version: null,
    demand_id: other.id,
    demand_version: other.version,
    supply_id: source.id,
    supply_version: 1,
    quantity: "0",
    unit: source.unit,
    basis: "Usable",
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(applySupply(f.owner, f.id, old));
  await proposeShortfall(
    f.owner,
    f.id,
    shortfallProposal(await currentFollowup(f)),
  );
  let t = await currentFollowup(f);
  assert.equal(
    t.allocation_shortfall.proposal!.predecessor_id,
    original.allocation_shortfall.proposal!.id,
  );
  assert.ok(t.allocation_shortfall.required.every((r) => !r.decision));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  const r = (await workspace(f.owner, other.id)).record;
  const { createSession } = await import("../../src/platform/identity");
  const restricted = (await createSession("materials-supply")).principal;
  // This profile cannot own the native Activity. Prove that refusal first,
  // then change to an explicitly permitted synthetic owner to isolate staleness.
  await assert.rejects(
    saveRecord(
      f.owner,
      nativeRevision(
        { basis: { target: r } } as Parameters<typeof nativeRevision>[0],
        { owner_id: restricted.actor_id },
      ),
      true,
    ),
    code("RecordUnavailable"),
  );
  const nextOwner = { ...f.owner, actor_id: randomUUID() };
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN replacement allocation owner',true,true)",
    [nextOwner.actor_id, f.owner.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [nextOwner.actor_id, f.owner.actor_id],
  );
  await saveRecord(
    f.owner,
    nativeRevision(
      { basis: { target: r } } as Parameters<typeof nativeRevision>[0],
      { owner_id: nextOwner.actor_id },
    ),
    true,
  );
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  assert.ok(
    (await currentFollowup(f)).allocation_shortfall.events.some(
      (e) => e.id === original.allocation_shortfall.proposal!.id,
    ),
  );
});

test("ES07 allocation received review is held by corrected quotation response and successor issue with original effects preserved", async () => {
  const f = await shortfallFixture();
  await proposeShortfall(f.owner, f.id, shortfallProposal(f.t));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  const original = await currentFollowup(f),
    cmd = supplyApply(original),
    before = await snapshot("supply_allocations");
  const { recordResponse } =
      await import("../../src/estimating/response/service"),
    { readResponse } = await import("../../src/estimating/response/reads"),
    { response } = await import("../helpers/quotation-response");
  await recordResponse(f.owner, f.id, {
    ...response(await readResponse(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  await assert.rejects(
    applySupply(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  assert.ok((await currentFollowup(f)).allocation_shortfall.holds.length);
  const { readRelease } = await import("../../src/estimating/release/reads"),
    { prepareRelease } = await import("../../src/estimating/release/service"),
    { preparation, issued } = await import("../helpers/quotation-release");
  const successor = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, successor);
  await retryQuote(f.owner, successor.id);
  await issued(f, successor.id);
  const current = (await readConversion(f.owner, successor.id)).followups[0];
  assert.equal(current.target_id, original.target_id);
  assert.equal(current.can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  assert.deepEqual(await snapshot("supply_allocations"), before);
});

test("ES07 Receipt successor holds received allocation work while preserving accurate evidence and its original correction receipt", async () => {
  const f = await shortfallFixture();
  await proposeShortfall(f.owner, f.id, shortfallProposal(f.t));
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  const t = await currentFollowup(f),
    old = supplyApply(t);
  const correction = t.allocation_shortfall.proposal!.dependencies.correction;
  const command = correction.command;
  assert.ok(command && "record_id" in command);
  const source = await workspace(f.owner, f.supply.id);
  const prior = source.facts.find((x) => x.id === command.id)!;
  const successor = {
    ...supplyFact("Receipt", source.record.version, {
      ...prior.data,
      usable: "4",
    }),
    predecessor_id: prior.id,
  };
  await recordFact(f.owner, source.record.id, successor);
  const current = await currentFollowup(f);
  assert.equal(current.can_apply, false);
  assert.equal(current.allocation_shortfall.candidates.length, 0);
  assert.ok(
    current.allocation_shortfall.holds.some((h) => h.includes("changed")),
  );
  assert.equal(current.basis.position[0].usable, "4");
  assert.equal(current.basis.position[0].usable_allocated, "10");
  await assert.rejects(
    applySupply(f.owner, f.id, old),
    code("SupplyFollowupConflict"),
  );
  assert.deepEqual(
    await readOperation(f.owner, correction.native_receipt!.operation_id),
    correction.native_receipt,
  );
  assert.ok(
    (await workspace(f.owner, source.record.id)).facts.some(
      (x) => x.id === prior.id,
    ),
  );
});

test("ES07 populated 0065 upgrade preserves ES04–07 corrections histories grants allocations exact outputs and original operations", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(65);
  await seed(65);
  const f = await shortfallFixture();
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    issued = await draftBytes(f.owner, f.id);
  const tables = (
    await database().query(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((x) => x.tablename as string);
  const original = await Promise.all(tables.map(snapshot));
  for (const row of original[tables.indexOf("quote_supply_events")])
    Object.assign(row.row, { allocation_proposal_id: null });
  const ledger = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await Promise.all(tables.map(snapshot)), original);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    after.filter((x) => x.version <= 65),
    ledger,
  );
  assert.deepEqual(
    after.filter((x) => x.version > 65).map((x) => x.version),
    [66, 67, 68, 69, 70, 71, 72],
  );
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  for (const e of f.t.events)
    assert.ok(await readOperation(f.owner, e.operation_id));
  await proposeShortfall(
    f.owner,
    f.id,
    shortfallProposal(await currentFollowup(f)),
  );
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  const preserved = await Promise.all(tables.map(snapshot));
  await migrate();
  await seed();
  assert.deepEqual(await Promise.all(tables.map(snapshot)), preserved);
});
