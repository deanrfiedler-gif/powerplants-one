import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readFile } from "node:fs/promises";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import { createSession } from "../../src/platform/identity";
import { readOperation } from "../../src/shared/receipts";
import { readConversion } from "../../src/estimating/conversion/reads";
import { receiveQuotation } from "../../src/estimating/conversion/service";
import {
  referSupply,
  receiveSupply,
  reviewSupply,
  applySupply,
} from "../../src/estimating/supply-followup/service";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import { saveRecord, allocate, recordFact } from "../../src/supply/commands";
import { workspace } from "../../src/supply/reads";
import { supplyFact, supplyInput } from "../helpers/supply";
import { crmBase } from "../helpers/crm";
import { receiving } from "../helpers/quotation-conversion";
import {
  completedFixture,
  dispositionReview,
  dispositionApply,
} from "../helpers/quotation-disposition";
import {
  allocatedFixture,
  acceptedFixture,
  reviewedFixture,
  currentFollowup,
  referral,
  acknowledgement,
  supplyReview,
  supplyApply,
} from "../helpers/quotation-supply-followup";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;

test("ES07 Supply exact owned referral, original replay, receiving return/hold and explicit replacement", async () => {
  const f = await allocatedFixture();
  const cmd = referral(f.t);
  const saved = await referSupply(f.owner, f.id, cmd);
  assert.deepEqual(
    (await referSupply(f.owner, f.id, cmd)).receipt,
    saved.receipt,
  );
  await assert.rejects(
    referSupply(f.owner, f.id, { ...cmd, reason: "changed" }),
    code("OperationConflict"),
  );
  let t = await currentFollowup(f);
  assert.equal(t.status, "Awaiting owner");
  assert.equal(t.referral!.date_needed, true);
  assert.ok(
    (await receivingWorklist(f.owner)).rows.some(
      (r) => r.referral_id === t.referral!.id,
    ),
  );
  await assert.rejects(
    referSupply(f.owner, f.id, referral(t)),
    code("SupplyFollowupConflict"),
  );
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Returned"));
  t = await currentFollowup(f);
  const original = t.referral!.id;
  assert.equal(t.status, "Returned");
  await referSupply(f.owner, f.id, referral(t));
  t = await currentFollowup(f);
  assert.equal(t.referral!.predecessor_id, original);
  assert.equal(t.events.length, 3);
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Held"));
  t = await currentFollowup(f);
  assert.equal(t.status, "Continuing hold");
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
  for (const sql of [
    "UPDATE ppo.quote_supply_events SET reason='rewrite' WHERE target_id=$1",
    "DELETE FROM ppo.quote_supply_events WHERE target_id=$1",
  ])
    await assert.rejects(database().query(sql, [t.target_id]), code("55000"));
});
test("ES07 Supply real exact allocation mutation preserves shared demand and returns native receipt; explicit new ES07 disposition required", async () => {
  const f = await acceptedFixture();
  let d = await readConversion(f.owner, f.id);
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  const old = dispositionApply(
    (await readConversion(f.owner, f.id)).dispositions[0],
  );
  let t = await currentFollowup(f);
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(t, "AdjustAllocation", "1.375001"),
  );
  t = await currentFollowup(f);
  const otherBefore = await workspace(f.owner, f.other.id);
  const reviewed = t.review!;
  const cmd = supplyApply(t);
  await assert.rejects(
    allocate(f.owner, reviewed.command),
    code("SupplyFollowupConflict"),
  );
  const retargeted = {
    ...f.allocations[1],
    operation_id: reviewed.command!.operation_id,
    expected_version: 1,
    demand_version: otherBefore.record.version,
    supply_version: t.basis.position[0].supply.version,
    quantity: "7.5",
  };
  await assert.rejects(
    allocate(f.owner, retargeted),
    code("SupplyFollowupConflict"),
  );
  const wrongCommand = {
    ...supplyInput("Supply"),
    operation_id: reviewed.command!.operation_id,
  };
  await assert.rejects(
    saveRecord(f.owner, wrongCommand),
    code("InvalidRelationship"),
  );
  assert.equal(
    (await database().query("SELECT 1 FROM ppo.supply_records WHERE id=$1", [
      wrongCommand.id,
    ])).rowCount,
    0,
  );
  assert.equal(
    (await database().query(
      "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND operation_id=$2",
      [f.owner.workspace_id, reviewed.command!.operation_id],
    )).rowCount,
    0,
  );
  const saved = await applySupply(f.owner, f.id, cmd);
  t = await currentFollowup(f);
  assert.equal(t.status, "Allocation adjusted");
  assert.equal(
    t.basis.conversion.dependencies.allocations[0].quantity,
    "1.375001",
  );
  assert.equal(t.basis.conversion.dependencies.allocations[0].version, 2);
  assert.equal(t.basis.conversion.target.quantity, "2");
  assert.equal(t.basis.conversion.target.data.demand_class, "Approved");
  assert.equal(t.basis.position[0].usable_allocated, "9.375001");
  const otherAfter = await workspace(f.owner, f.other.id);
  assert.deepEqual(
    { ...otherAfter, basis: undefined },
    { ...otherBefore, basis: undefined },
  );
  assert.deepEqual(
    { ...otherAfter.basis, sources: undefined },
    { ...otherBefore.basis, sources: undefined },
  );
  assert.equal(
    otherAfter.basis!.sources[0].version,
    otherBefore.basis!.sources[0].version + 1,
  );
  assert.deepEqual(
    { ...otherAfter.basis!.sources[0], version: undefined },
    { ...otherBefore.basis!.sources[0], version: undefined },
  );
  assert.deepEqual(
    (await applySupply(f.owner, f.id, cmd)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    (await allocate(f.owner, reviewed.command)).receipt,
    t.outcome!.native_receipt,
  );
  await assert.rejects(
    allocate(f.owner, retargeted),
    code("SupplyFollowupConflict"),
  );
  assert.deepEqual(
    await readOperation(f.owner, reviewed.command!.operation_id),
    t.outcome!.native_receipt,
  );
  assert.equal(t.outcome!.review_id, reviewed.id);
  assert.equal(t.outcome!.receiving_id, t.receiving!.id);
  await assert.rejects(applyDisposition(f.owner, f.id, old));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Resolved");
  assert.ok(
    d.dispositions[0].revision_holds.some((h) => h.includes("Approved")),
  );
  assert.ok(
    d.dispositions[0].basis.dependencies.facts.some((f) => f.kind === "Impact"),
  );
});
test("ES07 Supply exact zero retains allocation identity; native Approved state remains held for demand quantity disposition", async () => {
  const f = await reviewedFixture("0");
  await applySupply(f.owner, f.id, supplyApply(f.t));
  const t = await currentFollowup(f);
  assert.equal(t.basis.conversion.dependencies.allocations[0].quantity, "0");
  assert.equal(
    t.basis.conversion.dependencies.allocations[0].id,
    f.allocations[0].id,
  );
  const d = await readConversion(f.owner, f.id);
  await assert.rejects(
    reviewDisposition(
      f.owner,
      f.id,
      dispositionReview(d.dispositions[0], "ReviseQuantity", "1"),
    ),
    code("DispositionConflict"),
  );
});
test("ES07 Supply retention and continuing hold are explicit applied outcomes; review and Activity alone do not resolve ES07", async () => {
  const f = await acceptedFixture();
  await reviewSupply(f.owner, f.id, supplyReview(f.t, "Retain"));
  let t = await currentFollowup(f);
  assert.equal(t.outcome, null);
  const { activityCommand } = await import("../../src/activities/activities");
  await activityCommand(
    f.owner,
    t.referral!.activity_id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN coordination note completed; no native outcome",
    },
    "complete",
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
  assert.equal((await currentFollowup(f)).outcome, null);
  const before = t.basis.conversion.target;
  await applySupply(f.owner, f.id, supplyApply(t));
  t = await currentFollowup(f);
  assert.equal(t.status, "Position retained");
  assert.deepEqual(t.basis.conversion.target, before);
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.status, "Continuing hold");
  assert.equal(t.outcome!.native_receipt, null);
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
});
test("ES07 Supply selective applicability: unrelated records survive; shared-supply edits and corrected receiving hold pending effects", async () => {
  const f = await reviewedFixture();
  const cmd = supplyApply(f.t);
  await saveRecord(f.owner, supplyInput("Supply"));
  assert.equal((await currentFollowup(f)).can_apply, true);
  const other = (await workspace(f.owner, f.other.id)).record,
    s = (await workspace(f.owner, f.supply.id)).record;
  const a = f.allocations[1];
  await allocate(f.owner, {
    ...a,
    ...crmBase(),
    expected_version: 1,
    demand_version: other.version,
    supply_version: s.version,
    quantity: "7.5",
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  let t = await currentFollowup(f);
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(t, "AdjustAllocation", "1.25"),
  );
  let d = await readConversion(f.owner, f.id);
  await receiveQuotation(f.owner, f.id, {
    ...receiving(d, f.owner.actor_id),
    decision: "Returned",
  });
  t = await currentFollowup(f);
  assert.equal(t.can_apply, false);
  assert.ok(t.review_holds.some((h) => h.includes("evidence changed")));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
});
test("ES07 Supply conservation rejects excessive exact proposals and consequential dependencies hold adjustment but retain useful review", async () => {
  const f = await acceptedFixture();
  await assert.rejects(
    reviewSupply(
      f.owner,
      f.id,
      supplyReview(f.t, "AdjustAllocation", "2.000001"),
    ),
    code("SupplyFollowupConflict"),
  );
  await recordFact(
    f.owner,
    f.t.target_id,
    supplyFact("ExternalOutcome", f.t.basis.conversion.target.version, {
      source_operation: randomUUID(),
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence: "SYN original uncertainty",
    }),
  );
  let t = await currentFollowup(f);
  assert.ok(t.adjustment_holds.some((h) => h.includes("Consequential")));
  await assert.rejects(
    reviewSupply(f.owner, f.id, supplyReview(t, "AdjustAllocation", "1")),
    code("SupplyFollowupConflict"),
  );
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  t = await currentFollowup(f);
  await applySupply(f.owner, f.id, supplyApply(t));
  assert.equal((await currentFollowup(f)).status, "Continuing hold");
});
test("ES07 Supply duplicate and competing commands have one exact effect; changed-payload retry fails", async () => {
  const f = await reviewedFixture();
  const cmd = supplyApply(f.t);
  const results = await Promise.all([
    applySupply(f.owner, f.id, cmd),
    applySupply(f.owner, f.id, cmd),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  await assert.rejects(
    applySupply(f.owner, f.id, { ...cmd, evidence: "changed" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    applySupply(f.owner, f.id, { ...cmd, operation_id: randomUUID() }),
  );
  assert.equal(
    (await currentFollowup(f)).events.filter((e) => e.action === "Apply")
      .length,
    1,
  );
});
test("ES07 Supply current permissions protect referral, worklist, snapshots, original receipt and native replay", async () => {
  const f = await reviewedFixture();
  const cmd = supplyApply(f.t);
  const saved = await applySupply(f.owner, f.id, cmd);
  const denied = (await createSession("second-company")).principal;
  await assert.rejects(referSupply(denied, f.id, referral(f.t)));
  await assert.rejects(receivingWorklist(denied), code("Forbidden"));
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate'",
    [f.owner.actor_id],
  );
  try {
    await assert.rejects(readOperation(f.owner, saved.receipt.operation_id));
    await assert.rejects(applySupply(f.owner, f.id, cmd));
    await assert.rejects(
      readOperation(
        f.owner,
        (await currentFollowup(f)).outcome!.native_receipt!.operation_id,
      ),
    );
  } finally {
    await reset();
  }
});
test("ES07 Supply Forecast without held dependencies cannot manufacture a referral; unknown reads and mismatched lineage are refused", async () => {
  const f = await completedFixture();
  const t = await currentFollowup(f);
  assert.equal(t.can_refer, false);
  await assert.rejects(
    referSupply(f.owner, f.id, referral(t)),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    referSupply(f.owner, f.id, { ...referral(t), execution_id: randomUUID() }),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(receivingWorklist(f.owner, { all: "true" }));
  // A deliberate Hold review supplies an owned exception without inventing an allocation.
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(
      (await readConversion(f.owner, f.id)).dispositions[0],
      "Hold",
    ),
  );
  await referSupply(f.owner, f.id, referral(await currentFollowup(f)));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  const current = await currentFollowup(f);
  assert.ok(current.adjustment_holds.some((h) => h.includes("Approved")));
  await reviewSupply(f.owner, f.id, supplyReview(current, "Hold"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
});
test("ES07 Supply explicit reassignment preserves acknowledgements and rejects the previous owner's new actions", async () => {
  const f = await allocatedFixture(false),
    id = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN follow-up receiving owner',true,true)",
    [id, f.owner.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [id, f.owner.actor_id],
  );
  const nextOwner = {
    ...f.owner,
    actor_id: id,
    display_name: "SYN follow-up receiving owner",
  };
  await referSupply(f.owner, f.id, referral(f.t));
  await receiveSupply(
    f.owner,
    f.id,
    acknowledgement(await currentFollowup(f), "Held"),
  );
  let t = await currentFollowup(f);
  const original = t.referral!.id;
  await referSupply(f.owner, f.id, referral(t, id));
  t = await currentFollowup(f);
  await assert.rejects(receiveSupply(f.owner, f.id, acknowledgement(t)));
  await receiveSupply(nextOwner, f.id, acknowledgement(t));
  t = await currentFollowup(f);
  await reviewSupply(nextOwner, f.id, supplyReview(t, "Retain"));
  t = await currentFollowup(f);
  const reviewed = t.review!.id;
  await receiveSupply(nextOwner, f.id, acknowledgement(t, "Held"));
  t = await currentFollowup(f);
  assert.equal(t.can_apply, false);
  assert.ok(t.events.some((e) => e.id === original));
  assert.ok(t.events.some((e) => e.id === reviewed));
  assert.ok(
    (await receivingWorklist(nextOwner)).rows.some(
      (r) => r.referral_id === t.referral!.id,
    ),
  );
  assert.ok(
    !(await receivingWorklist(f.owner)).rows.some(
      (r) => r.target_id === t.target_id,
    ),
  );
});
test("ES07 Supply late transaction failure rolls back actual allocation, revisions, activities, histories and receipts", async () => {
  const f = await reviewedFixture(),
    cmd = supplyApply(f.t);
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
  ];
  const snapshot = () =>
    Promise.all(
      tables.map(
        async (table) =>
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
      ),
    );
  const before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.es07_supply_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='Apply' THEN RAISE EXCEPTION 'SYN late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER es07_supply_injected BEFORE INSERT ON ppo.quote_supply_events FOR EACH ROW EXECUTE FUNCTION ppo.es07_supply_injected()",
  );
  try {
    await assert.rejects(applySupply(f.owner, f.id, cmd));
  } finally {
    await database().query(
      "DROP TRIGGER es07_supply_injected ON ppo.quote_supply_events; DROP FUNCTION ppo.es07_supply_injected()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  await applySupply(f.owner, f.id, cmd);
  assert.equal(
    (await currentFollowup(f)).basis.conversion.dependencies.allocations[0]
      .quantity,
    "1.375001",
  );
});
test("ES07 Supply SQL evidence guards refuse forged commands, assignment, stale acceptance and receipt-free history", async () => {
  const f = await reviewedFixture();
  const row = (
    await database().query(
      "SELECT to_jsonb(e) row FROM ppo.quote_supply_events e WHERE id=$1",
      [f.t.review!.id],
    )
  ).rows[0].row;
  for (const change of [
    { command: { ...row.command, unit: "kg" } },
    { command: { ...row.command, basis: "Incoming" } },
    { owner_id: randomUUID() },
    { receiving_id: randomUUID() },
    {
      basis: {
        ...row.basis,
        conversion: { ...row.basis.conversion, execution_id: randomUUID() },
      },
    },
    {},
  ]) {
    await assert.rejects(
      database().query(
        "INSERT INTO ppo.quote_supply_events SELECT (jsonb_populate_record(NULL::ppo.quote_supply_events,$1)).*",
        [
          {
            ...row,
            id: randomUUID(),
            operation_id: randomUUID(),
            sequence: row.sequence + 1,
            predecessor_id: row.id,
            command: { ...row.command, operation_id: randomUUID() },
            ...change,
          },
        ],
      ),
    );
  }
  assert.equal((await currentFollowup(f)).events.length, 3);
});
test("ES07 Supply populated 0062 upgrade preserves all earlier commercial evidence, disposition, allocations, grants, identities and original bytes", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(62);
  await seed(62);
  const f = await allocatedFixture();
  let d = await readConversion(f.owner, f.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(d.dispositions[0], "Hold"),
  );
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    issued = await draftBytes(f.owner, f.id);
  const tables = (
    await database().query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((r) => r.tablename);
  const snapshot = () =>
    Promise.all(
      tables.map(
        async (table) =>
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
            )
          ).rows,
      ),
    );
  const before = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    after.filter((r) => r.version <= 62),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 62).map((r) => r.version),
    [63, 64, 65, 66, 67, 68, 69, 70, 71],
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  d = await readConversion(f.owner, f.id);
  await referSupply(f.owner, f.id, referral(d.followups[0]));
  assert.equal((await currentFollowup(f)).status, "Awaiting owner");
});

test("ES07 Supply pending actions follow exact corrected mapping and response", async () => {
  const f = await reviewedFixture();
  const original = supplyApply(f.t);
  const { resolveQuotationItem } =
      await import("../../src/estimating/conversion/service"),
    { resolution } = await import("../helpers/quotation-conversion");
  const d = await readConversion(f.owner, f.id);
  await resolveQuotationItem(f.owner, f.id, {
    ...resolution(d, d.lines[0]),
    label: "SYN corrected mapping evidence",
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, original),
    code("SupplyFollowupConflict"),
  );
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(await currentFollowup(f), "Retain"),
  );
  const { recordResponse } =
      await import("../../src/estimating/response/service"),
    { readResponse } = await import("../../src/estimating/response/reads"),
    { response } = await import("../helpers/quotation-response");
  await recordResponse(f.owner, f.id, {
    ...response(await readResponse(f.owner, f.id), "Declined"),
    action: "Correct",
  });
  const t = await currentFollowup(f);
  assert.equal(t.can_apply, false);
  assert.equal(t.events.filter((e) => e.action === "Apply").length, 0);
});

test("ES07 Supply successor issue holds pending review while original owned follow-up remains usable", async () => {
  const f = await reviewedFixture();
  const { readRelease } = await import("../../src/estimating/release/reads"),
    { prepareRelease } = await import("../../src/estimating/release/service"),
    { preparation, issued } = await import("../helpers/quotation-release");
  const successor = preparation(await readRelease(f.owner, f.id));
  await prepareRelease(f.owner, f.id, successor);
  await retryQuote(f.owner, successor.id);
  await issued(f, successor.id);
  const t = await currentFollowup(f);
  assert.equal(t.can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, supplyApply(f.t)),
    code("SupplyFollowupConflict"),
  );
  assert.equal(
    (await readConversion(f.owner, successor.id)).followups[0].target_id,
    t.target_id,
  );
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  assert.equal((await currentFollowup(f)).status, "Continuing hold");
});

test("ES07 Supply new shared-demand dependency holds pending adjustment and restricted linked evidence cannot leak", async () => {
  const f = await reviewedFixture();
  const cmd = supplyApply(f.t);
  const other = (await workspace(f.owner, f.other.id)).record;
  await recordFact(
    f.owner,
    other.id,
    supplyFact("ExternalOutcome", other.version, {
      source_operation: "SYN unrelated-demand-original",
      state: "Unknown",
    }),
  );
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(
    applySupply(f.owner, f.id, cmd),
    code("SupplyFollowupConflict"),
  );
  const { supplyRecord } = await import("../../src/supply/context");
  const current = (await workspace(f.owner, f.other.id)).record;
  const child = supplyInput("Return", {
    item: current.item,
    site_id: current.site_id,
    unit: current.unit,
    quantity: "1",
    data: {
      direction: "Customer",
      demand_id: current.id,
      identity_evidence: "SYN reported only",
      identity_status: "Unresolved",
      reported_symptom: "SYN damaged",
      warranty_reference: null,
      source_reference: "SYN observation",
    },
  });
  await saveRecord(f.owner, child);
  const t = await currentFollowup(f);
  assert.ok(
    t.basis.position[0].demands.find((d) => d.record.id === other.id)!.children
      .length,
  );
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  // The quotation target and supply remain readable in the same site scope;
  // the other linked demand belongs to another site and must not leak through stored graphs.
  const grants = (
    await database().query(
      "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read'",
      [f.owner.actor_id],
    )
  ).rows;
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read'",
    [f.owner.actor_id],
  );
  const scoped = {
    ...grants[0],
    scope_type: "Site",
    scope_id: f.t.basis.conversion.target.site_id,
    site_id: f.t.basis.conversion.target.site_id,
  };
  await database().query(
    "INSERT INTO ppo.permission_grants SELECT * FROM json_populate_record(NULL::ppo.permission_grants,$1)",
    [JSON.stringify(scoped)],
  );
  try {
    await supplyRecord(database(), f.owner, f.t.target_id);
    await assert.rejects(supplyRecord(database(), f.owner, f.other.id));
    await assert.rejects(readConversion(f.owner, f.id));
    await assert.rejects(readOperation(f.owner, f.t.review!.operation_id));
    await assert.rejects(applySupply(f.owner, f.id, cmd));
    assert.equal((await receivingWorklist(f.owner)).rows.length, 0);
  } finally {
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read'",
      [f.owner.actor_id],
    );
    await database().query(
      "INSERT INTO ppo.permission_grants SELECT * FROM json_populate_recordset(NULL::ppo.permission_grants,$1)",
      [JSON.stringify(grants)],
    );
  }
});
