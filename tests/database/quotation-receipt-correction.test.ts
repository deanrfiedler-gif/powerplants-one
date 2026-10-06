import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import { readConversion } from "../../src/estimating/conversion/reads";
import { receiveQuotation } from "../../src/estimating/conversion/service";
import { receiving } from "../helpers/quotation-conversion";
import { workspace } from "../../src/supply/reads";
import { recordFact, saveRecord } from "../../src/supply/commands";
import {
  reviewSupply,
  applySupply,
  receiveSupply,
  referSupply,
} from "../../src/estimating/supply-followup/service";
import {
  proposeReceipt,
  receiveReceiptEffect,
} from "../../src/estimating/supply-followup/receipt-service";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
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
  currentFollowup,
  supplyApply,
  supplyReview,
  acknowledgement,
  referral,
  reviewedFixture,
  reservationReview,
} from "../helpers/quotation-supply-followup";
import {
  receiptFixture,
  proposedReceiptFixture,
  receiptProposal,
  receiptReceiving,
  receiptReview,
  receiveAll,
} from "../helpers/quotation-receipt-correction";
import { supplyFact, supplyInput } from "../helpers/supply";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
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

test("ES07 Receipt correction requires every receiving decision, commits native predecessor/successor and honest shared shortfall, and recovers exact originals", async () => {
  const f = await receiptFixture();
  let d = await readConversion(f.owner, f.id);
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  const old = dispositionApply(d.dispositions[0]);
  const before = await workspace(f.owner, f.supply.id),
    target = await workspace(f.owner, f.t.target_id),
    other = await workspace(f.owner, f.other.id);
  const unrelatedInput = supplyInput();
  await saveRecord(f.owner, unrelatedInput);
  const unrelated = await workspace(f.owner, unrelatedInput.id);
  const allocations = await snapshot("supply_allocations");
  const command = {
    ...receiptProposal(await currentFollowup(f)),
    reason: "SYN newly attributed corrected Receipt finding",
  };
  const proposed = await proposeReceipt(f.owner, f.id, command);
  assert.deepEqual(
    (await proposeReceipt(f.owner, f.id, command)).receipt,
    proposed.receipt,
  );
  await assert.rejects(
    proposeReceipt(f.owner, f.id, { ...command, fact_evidence: "SYN changed" }),
    code("OperationConflict"),
  );
  let t = await currentFollowup(f);
  assert.equal(t.receipt_correction.effects!.shortfall, "5.624999");
  await assert.rejects(
    reviewSupply(f.owner, f.id, receiptReview(t)),
    code("SupplyFollowupConflict"),
  );
  const first = receiptReceiving(t, t.target_id);
  const received = await receiveReceiptEffect(f.owner, f.id, first);
  assert.deepEqual(
    (await receiveReceiptEffect(f.owner, f.id, first)).receipt,
    received.receipt,
  );
  await assert.rejects(
    receiveReceiptEffect(f.owner, f.id, { ...first, decision: "Held" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f))),
    code("SupplyFollowupConflict"),
  );
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(await currentFollowup(f), f.other.id),
  );
  t = await currentFollowup(f);
  const review = receiptReview(t);
  const reviewed = await reviewSupply(f.owner, f.id, review);
  assert.deepEqual(
    (await reviewSupply(f.owner, f.id, review)).receipt,
    reviewed.receipt,
  );
  t = await currentFollowup(f);
  assert.equal(t.can_apply, true);
  const native = t.receipt_correction.proposal!.command;
  const { record_id, ...fact } = native;
  await assert.rejects(
    recordFact(f.owner, record_id, fact),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    recordFact(f.owner, f.other.id, fact),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    saveRecord(f.owner, {
      ...supplyInput(),
      operation_id: native.operation_id,
    }),
    code("InvalidRelationship"),
  );
  const apply = supplyApply(t);
  const results = await Promise.all([
    applySupply(f.owner, f.id, apply),
    applySupply(f.owner, f.id, apply),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((x) => !x.replayed).length, 1);
  const after = await workspace(f.owner, f.supply.id),
    next = await workspace(f.owner, f.t.target_id),
    shared = await workspace(f.owner, f.other.id);
  assert.deepEqual(
    after.facts.filter((x) => x.id !== native.id),
    before.facts,
  );
  const successor = after.facts.find((x) => x.id === native.id)!;
  assert.equal(successor.predecessor_id, command.dependency_id);
  assert.deepEqual(successor.data, command.data);
  assert.equal(after.record.version, before.record.version + 1);
  for (const [a, b] of [
    [next, target],
    [shared, other],
  ]) {
    assert.equal(a.record.version, b.record.version + 1);
    assert.equal(a.record.quantity, b.record.quantity);
    assert.deepEqual(a.record.data, b.record.data);
    assert.equal(
      a.facts.filter((x) => x.kind === "Impact").length,
      b.facts.filter((x) => x.kind === "Impact").length + 1,
    );
    assert.equal(a.basis?.readiness.state, "Evidence needed");
  }
  assert.deepEqual(await snapshot("supply_allocations"), allocations);
  assert.deepEqual(await workspace(f.owner, unrelatedInput.id), unrelated);
  t = await currentFollowup(f);
  assert.equal(t.status, "Receipt evidence corrected");
  assert.equal(t.outcome!.effect_receiving_ids.length, 2);
  assert.deepEqual(
    await readOperation(f.owner, native.operation_id),
    t.outcome!.native_receipt,
  );
  assert.deepEqual(
    (await recordFact(f.owner, record_id, fact)).receipt,
    t.outcome!.native_receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, command.operation_id),
    proposed.receipt,
  );
  await assert.rejects(
    applyDisposition(f.owner, f.id, old),
    code("DispositionConflict"),
  );
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  await applyDisposition(
    f.owner,
    f.id,
    dispositionApply((await readConversion(f.owner, f.id)).dispositions[0]),
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Resolved",
  );
  assert.equal(
    (await workspace(f.owner, f.other.id)).basis?.readiness.state,
    "Evidence needed",
  );
});

test("ES07 Receipt immutable return, hold, receiving corrections and proposal replacements require fresh exact decisions", async () => {
  const f = await proposedReceiptFixture();
  let t = f.t;
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(t, t.target_id, "Returned"),
  );
  t = await currentFollowup(f);
  assert.equal(
    t.receipt_correction.required.find((x) => x.demand.id === t.target_id)!
      .decision!.decision,
    "Returned",
  );
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(t, t.target_id, "Held"),
  );
  await assert.rejects(
    reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f))),
    code("SupplyFollowupConflict"),
  );
  await receiveAll(f);
  t = await currentFollowup(f);
  await reviewSupply(f.owner, f.id, receiptReview(t));
  const prior = await currentFollowup(f),
    apply = supplyApply(prior);
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(prior, f.other.id, "Held"),
  );
  await assert.rejects(
    applySupply(f.owner, f.id, apply),
    code("SupplyFollowupConflict"),
  );
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(await currentFollowup(f), f.other.id),
  );
  t = await currentFollowup(f);
  assert.equal(t.can_apply, false);
  await reviewSupply(f.owner, f.id, receiptReview(t));
  t = await currentFollowup(f);
  assert.equal(t.can_apply, true);
  const originalProposal = t.receipt_correction.proposal!.id;
  await proposeReceipt(f.owner, f.id, receiptProposal(t, "3.000001"));
  t = await currentFollowup(f);
  assert.equal(t.receipt_correction.proposal!.predecessor_id, originalProposal);
  assert.equal(t.can_apply, false);
  assert.ok(t.receipt_correction.required.every((x) => !x.decision));
  await assert.rejects(
    database().query(
      "UPDATE ppo.quote_supply_receipt_events SET reason='forged' WHERE id=$1",
      [originalProposal],
    ),
  );
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.status, "Continuing hold");
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Returned"));
  t = await currentFollowup(f);
  await referSupply(f.owner, f.id, referral(t));
  t = await currentFollowup(f);
  assert.equal(t.receipt_correction.proposal, null);
  assert.equal(t.receipt_correction.events.length, 8);
});

test("ES07 Receipt refuses invalid arithmetic and absent predecessor, invalidates only relevant unexecuted decisions", async () => {
  const f = await receiptFixture();
  const base = receiptProposal(f.t);
  for (const data of [
    { ...base.data, inspected: "11" },
    { ...base.data, damaged: "6" },
    { ...base.data, usable: "6" },
    { ...base.data, identity_status: "Unresolved" },
  ])
    await assert.rejects(async () =>
      proposeReceipt(f.owner, f.id, {
        ...base,
        operation_id: randomUUID(),
        data,
      }),
    );
  await assert.rejects(
    proposeReceipt(f.owner, f.id, { ...base, dependency_id: randomUUID() }),
    code("SupplyFollowupConflict"),
  );
  await proposeReceipt(f.owner, f.id, base);
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  const original = supplyApply(await currentFollowup(f));
  await saveRecord(f.owner, supplyInput());
  assert.equal((await currentFollowup(f)).can_apply, true);
  let d = await readConversion(f.owner, f.id);
  await receiveQuotation(f.owner, f.id, {
    ...receiving(d, f.owner.actor_id),
    decision: "Held",
    reason: "SYN corrected quotation evidence while receipt work pending",
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, original),
    code("SupplyFollowupConflict"),
  );
  let t = await currentFollowup(f);
  await proposeReceipt(f.owner, f.id, receiptProposal(t));
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  const s = (await workspace(f.owner, f.supply.id)).record;
  await recordFact(f.owner, s.id, {
    ...supplyFact("Receipt", s.version, {
      received: "10",
      inspected: "10",
      usable: "9",
      quarantined: "1",
    }),
    predecessor_id: base.dependency_id,
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, supplyApply(t)),
    code("SupplyFollowupConflict"),
  );
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
});

test("ES07 Receipt independently owned demands require their own decisions, current permissions and reassignment lineage", async () => {
  const f = await receiptFixture(),
    id = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN affected Demand owner',true,true)",
    [id, f.owner.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [id, f.owner.actor_id],
  );
  const owner = {
    ...f.owner,
    actor_id: id,
    display_name: "SYN affected Demand owner",
  };
  const otherSite = "70000000-0000-4000-8000-000000000002";
  await database().query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2,company_id=$3 WHERE user_id=$1 AND capability='supply.coordinate'",
    [id, otherSite, f.t.basis.conversion.target.company_id],
  );
  const r = (await workspace(f.owner, f.other.id)).record;
  await saveRecord(
    f.owner,
    nativeRevision(
      { basis: { target: r } } as Parameters<typeof nativeRevision>[0],
      { owner_id: id, site_id: otherSite },
    ),
    true,
  );
  await proposeReceipt(
    f.owner,
    f.id,
    receiptProposal(await currentFollowup(f)),
  );
  let t = await currentFollowup(f);
  assert.ok(
    (await receivingWorklist(owner)).rows.some(
      (x) => x.target_id === t.target_id,
    ),
  );
  const ownedView = await readConversion(owner, f.id);
  assert.equal(ownedView.can_write, false);
  assert.equal(
    ownedView.followups[0].receipt_correction.required.find(
      (x) => x.demand.id === f.other.id,
    )!.can_receive,
    true,
  );
  await assert.rejects(
    recordFact(
      owner,
      t.target_id,
      supplyFact("Assessment", t.basis.conversion.target.version),
    ),
  );
  const receive = receiptReceiving(t, f.other.id);
  await assert.rejects(receiveReceiptEffect(f.owner, f.id, receive));
  const result = await receiveReceiptEffect(owner, f.id, receive);
  await receiveReceiptEffect(
    f.owner,
    f.id,
    receiptReceiving(await currentFollowup(f), t.target_id),
  );
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.can_apply, true);
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *",
      [id],
    )
  ).rows;
  try {
    assert.equal((await currentFollowup(f)).can_apply, false);
    await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
    await assert.rejects(readOperation(owner, receive.operation_id));
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
  assert.deepEqual(
    await readOperation(owner, receive.operation_id),
    result.receipt,
  );
  const current = (await workspace(f.owner, f.other.id)).record;
  await saveRecord(
    f.owner,
    nativeRevision(
      { basis: { target: current } } as Parameters<typeof nativeRevision>[0],
      { owner_id: f.owner.actor_id },
    ),
    true,
  );
  await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  await proposeReceipt(
    f.owner,
    f.id,
    receiptProposal(await currentFollowup(f)),
  );
  await receiveAll(f);
  t = await currentFollowup(f);
  assert.equal(
    t.receipt_correction.events.find(
      (x) => x.operation_id === receive.operation_id,
    )!.created_by,
    id,
  );
  await reviewSupply(f.owner, f.id, receiptReview(t));
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
  } finally {
    for (const g of reads)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
});

test("ES07 Receipt late failure preserves facts allocations impacts and receipts atomically; missing lookup is inconclusive", async () => {
  const f = await proposedReceiptFixture();
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  const t = await currentFollowup(f),
    cmd = supplyApply(t);
  const tables = [
    "supply_records",
    "supply_facts",
    "supply_revisions",
    "supply_allocations",
    "supply_allocation_history",
    "activities",
    "activity_links",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "quote_supply_events",
    "quote_supply_receipt_events",
  ];
  const snap = () => Promise.all(tables.map(snapshot));
  const original = await snap();
  await database().query(
    "CREATE FUNCTION ppo.receipt_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='Apply' THEN RAISE EXCEPTION 'SYN late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER receipt_injected BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.receipt_injected()",
  );
  try {
    await assert.rejects(applySupply(f.owner, f.id, cmd));
  } finally {
    await database().query(
      "DROP TRIGGER receipt_injected ON ppo.quote_supply_events; DROP FUNCTION ppo.receipt_injected()",
    );
  }
  assert.deepEqual(await snap(), original);
  await assert.rejects(readOperation(f.owner, cmd.operation_id));
  await applySupply(f.owner, f.id, cmd);
  assert.equal((await currentFollowup(f)).status, "Receipt evidence corrected");
});

test("ES07 Receipt populated 0064 upgrade preserves prior generations grants histories allocations outputs and original operations", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(64);
  await seed(64);
  const f = await reviewedFixture(),
    allocation = supplyApply(f.t);
  await applySupply(f.owner, f.id, allocation);
  const t = await currentFollowup(f);
  await recordFact(
    f.owner,
    t.target_id,
    supplyFact("ExternalOutcome", t.basis.conversion.target.version, {
      source_operation: "SYN retained original operation",
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence: "SYN original unknown",
    }),
  );
  await reviewSupply(
    f.owner,
    f.id,
    reservationReview(await currentFollowup(f)),
  );
  const reservation = supplyApply(await currentFollowup(f));
  await applySupply(f.owner, f.id, reservation);
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    issued = await draftBytes(f.owner, f.id);
  const tables = (
    await database().query(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((x) => x.tablename as string);
  const snap = () => Promise.all(tables.map(snapshot));
  const original = await snap(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  for (const x of original[tables.indexOf("quote_supply_events")])
    Object.assign(x.row, {
      allocation_proposal_id: null,
      receipt_proposal_id: null,
      effect_receiving_ids: [],
    });
  await migrate();
  await seed();
  assert.deepEqual(await snap(), original);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    after.filter((x) => x.version <= 64),
    ledger,
  );
  assert.deepEqual(
    after.filter((x) => x.version > 64).map((x) => x.version),
    [65, 66, 67],
  );
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  for (const cmd of [allocation, reservation])
    assert.deepEqual(
      (await applySupply(f.owner, f.id, cmd)).receipt,
      await readOperation(f.owner, cmd.operation_id),
    );
  await migrate();
  await seed();
  assert.deepEqual(await snap(), original);
});

test("ES07 Receipt partial unresolved correction retains separate Stock observation; unknown original Supply outcome holds replacement", async () => {
  const f = await receiptFixture("Stock"),
    original = (await workspace(f.owner, f.supply.id)).record;
  const t = await currentFollowup(f),
    proposal = receiptProposal(t, "0");
  Object.assign(proposal.data, { identity_status: "Unresolved" });
  proposal.completeness = "Partial";
  await proposeReceipt(f.owner, f.id, proposal);
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  const after = await currentFollowup(f);
  assert.equal(after.receipt_correction.effects!.usable, "10");
  assert.equal(after.receipt_correction.effects!.incomplete, true);
  assert.equal(after.receipt_correction.effects!.shortfall, "0");
  assert.deepEqual(
    (await workspace(f.owner, f.supply.id)).record.data,
    original.data,
  );
  const current = (await workspace(f.owner, f.supply.id)).record;
  await recordFact(
    f.owner,
    current.id,
    supplyFact("ExternalOutcome", current.version, {
      source_operation: "SYN original uncertain Supply effect",
      effect: "Receipt",
      state: "Unknown",
      lookup_evidence: "SYN inconclusive",
    }),
  );
  const held = await currentFollowup(f);
  assert.ok(held.receipt_correction.candidates[0].holds.length);
  await assert.rejects(
    proposeReceipt(f.owner, f.id, receiptProposal(held)),
    code("SupplyFollowupConflict"),
  );
});

test("ES07 Receipt new shared Demand invalidates receiving and competing referrals preserve immutable item identity", async () => {
  const f = await proposedReceiptFixture();
  const original = f.t.receipt_correction.proposal!;
  const { completedFixture } = await import("../helpers/quotation-disposition");
  const { allocate } = await import("../../src/supply/commands");
  const { crmBase } = await import("../helpers/crm");
  // Distinct converted OneOff items cannot be relabelled to manufacture a shared
  // source. Keep this native refusal while exercising valid shared native Demand.
  const g = await completedFixture();
  const otherQuote = (await readConversion(g.owner, g.id)).dispositions[0];
  await assert.rejects(
    saveRecord(
      g.owner,
      nativeRevision(otherQuote, { item: f.supply.item }),
      true,
    ),
    code("InvalidRelationship"),
  );
  assert.equal(
    (await workspace(g.owner, otherQuote.target_id)).record.item,
    otherQuote.basis.target.item,
  );
  const extra = supplyInput("Demand", {
    item: f.supply.item,
    unit: f.supply.unit,
  });
  await saveRecord(f.owner, extra);
  const r = (await workspace(f.owner, extra.id)).record,
    source = (await workspace(f.owner, f.supply.id)).record;
  await allocate(f.owner, {
    ...crmBase(),
    id: randomUUID(),
    expected_version: null,
    demand_id: r.id,
    supply_id: source.id,
    demand_version: r.version,
    supply_version: source.version,
    quantity: "0",
    unit: r.unit,
    basis: "Usable",
  });
  let t = await currentFollowup(f);
  assert.ok(t.receipt_correction.holds.length);
  await assert.rejects(
    receiveReceiptEffect(f.owner, f.id, receiptReceiving(t, t.target_id)),
    code("SupplyFollowupConflict"),
  );
  await proposeReceipt(f.owner, f.id, receiptProposal(t));
  t = await currentFollowup(f);
  assert.equal(t.receipt_correction.required.length, 3);
  assert.equal(t.receipt_correction.proposal!.predecessor_id, original.id);
  // Existing active receiving cannot be replaced by a competing referral.
  const previousReferral = t.referral!.id;
  await assert.rejects(
    referSupply(f.owner, f.id, referral(t)),
    code("SupplyFollowupConflict"),
  );
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Returned"));
  t = await currentFollowup(f);
  assert.equal(t.status, "Returned");
  await referSupply(f.owner, f.id, referral(t));
  t = await currentFollowup(f);
  assert.equal(t.referral!.predecessor_id, previousReferral);
  await receiveSupply(f.owner, f.id, acknowledgement(t));
  await proposeReceipt(
    f.owner,
    f.id,
    receiptProposal(await currentFollowup(f)),
  );
  t = await currentFollowup(f);
  assert.equal(
    t.receipt_correction.proposal!.command.predecessor_id,
    original.command.predecessor_id,
  );
  assert.ok(t.receipt_correction.events.some((e) => e.id === original.id));
  assert.ok(t.receipt_correction.required.every((x) => !x.decision));
  const { record_id, ...reservedOriginal } = original.command;
  await assert.rejects(
    recordFact(f.owner, record_id, reservedOriginal),
    code("SupplyFollowupConflict"),
  );
});

test("ES07 Receipt corrected response and successor issue invalidate pending received review without changing originals", async () => {
  const f = await proposedReceiptFixture();
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  const original = await currentFollowup(f),
    cmd = supplyApply(original);
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
  assert.ok((await currentFollowup(f)).receipt_correction.holds.length);
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
  assert.equal(current.review!.id, original.review!.id);
  await assert.rejects(
    applySupply(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  assert.equal(
    (await workspace(f.owner, f.supply.id)).record.version,
    original.receipt_correction.proposal!.command.expected_version,
  );
});
