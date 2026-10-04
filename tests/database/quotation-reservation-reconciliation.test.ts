import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readOperation } from "../../src/shared/receipts";
import { createSession } from "../../src/platform/identity";
import { recordFact, saveRecord } from "../../src/supply/commands";
import { workspace } from "../../src/supply/reads";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import { readConversion } from "../../src/estimating/conversion/reads";
import { receiveQuotation } from "../../src/estimating/conversion/service";
import { receiving } from "../helpers/quotation-conversion";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import {
  dispositionReview,
  dispositionApply,
  completedFixture,
} from "../helpers/quotation-disposition";
import {
  referSupply,
  receiveSupply,
  reviewSupply,
  applySupply,
} from "../../src/estimating/supply-followup/service";
import {
  acceptedFixture,
  reviewedFixture,
  currentFollowup,
  supplyApply,
  supplyReview,
  reservationReview,
  acknowledgement,
  referral,
} from "../helpers/quotation-supply-followup";
import { supplyFact, supplyInput } from "../helpers/supply";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
async function fixture() {
  const f = await acceptedFixture();
  const unknown = supplyFact(
    "ExternalOutcome",
    f.t.basis.conversion.target.version,
    {
      source_operation: "SYN-reservation-" + randomUUID(),
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence:
        "SYN original response unavailable; absence inconclusive",
    },
  );
  const original = await recordFact(f.owner, f.t.target_id, unknown);
  return { ...f, unknown, original, t: await currentFollowup(f) };
}
test("ES07 dependency executes exact native successor, conserves shared quantities, recovers originals and requires fresh disposition", async () => {
  const f = await fixture();
  const before = await workspace(f.owner, f.t.target_id),
    other = await workspace(f.owner, f.other.id),
    supply = await workspace(f.owner, f.supply.id);
  let d = await readConversion(f.owner, f.id);
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  const oldDisposition = dispositionApply(d.dispositions[0]);
  const review = reservationReview(await currentFollowup(f));
  const reviewed = await reviewSupply(f.owner, f.id, review);
  assert.deepEqual(
    (await reviewSupply(f.owner, f.id, review)).receipt,
    reviewed.receipt,
  );
  await assert.rejects(
    reviewSupply(f.owner, f.id, { ...review, outcome_state: "Absent" }),
    code("OperationConflict"),
  );
  let t = await currentFollowup(f);
  const native = t.review!.command!;
  assert.ok("record_id" in native);
  const { record_id, ...fact } = native;
  await assert.rejects(
    recordFact(f.owner, record_id, fact),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    recordFact(f.owner, f.other.id, fact),
    code("SupplyFollowupConflict"),
  );
  const wrong = { ...supplyInput("Supply"), operation_id: native.operation_id };
  await assert.rejects(saveRecord(f.owner, wrong), code("InvalidRelationship"));
  assert.equal(
    (
      await database().query("SELECT 1 FROM ppo.supply_records WHERE id=$1", [
        wrong.id,
      ])
    ).rowCount,
    0,
  );
  const command = supplyApply(t);
  const [a, b] = await Promise.all([
    applySupply(f.owner, f.id, command),
    applySupply(f.owner, f.id, command),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.equal(a.receipt.state, "ReservationOutcomeReconciled");
  t = await currentFollowup(f);
  assert.equal(t.status, "Reservation outcome reconciled");
  assert.equal(t.events.filter((e) => e.action === "Apply").length, 1);
  const after = await workspace(f.owner, t.target_id);
  assert.equal(after.record.version, before.record.version + 1);
  assert.equal(after.record.quantity, before.record.quantity);
  assert.deepEqual(after.record.data, before.record.data);
  assert.deepEqual(
    t.basis.conversion.dependencies.allocations,
    f.t.basis.conversion.dependencies.allocations,
  );
  assert.deepEqual(await workspace(f.owner, f.other.id), other);
  assert.deepEqual(await workspace(f.owner, f.supply.id), supply);
  const current = t.reservation_dependencies[0].fact;
  assert.equal(current.id, native.id);
  assert.equal(current.predecessor_id, f.unknown.id);
  assert.equal(current.data.source_operation, f.unknown.data.source_operation);
  assert.equal(current.data.state, "Confirmed");
  assert.deepEqual(
    (await recordFact(f.owner, record_id, fact)).receipt,
    t.outcome!.native_receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, native.operation_id),
    t.outcome!.native_receipt,
  );
  assert.deepEqual(
    (await recordFact(f.owner, record_id, f.unknown)).receipt,
    f.original.receipt,
  );
  await assert.rejects(
    applySupply(f.owner, f.id, { ...command, reason: "changed" }),
    code("OperationConflict"),
  );
  await assert.rejects(applyDisposition(f.owner, f.id, oldDisposition));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
  await reviewDisposition(f.owner, f.id, dispositionReview(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(d.dispositions[0]));
  d = await readConversion(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Resolved");
  assert.ok(
    d.followups[0].adjustment_holds.some((h) => h.includes("Consequential")),
  );
  assert.ok(
    d.dispositions[0].revision_holds.some((h) => h.includes("Approved")),
  );
  assert.equal(t.outcome!.receiving_id, t.receiving!.id);
  assert.equal(t.outcome!.execution_id, f.t.execution_id);
});
test("ES07 dependency records evidenced Failed on Forecast demand without changing quantity or needing an allocation", async () => {
  const f=await completedFixture(); let t=await currentFollowup(f);
  const original=supplyFact("ExternalOutcome",t.basis.conversion.target.version,{source_operation:"SYN-failed-reservation-"+randomUUID(),effect:"Reservation",state:"Unknown"});
  await recordFact(f.owner,t.target_id,original);
  t=await currentFollowup(f); await referSupply(f.owner,f.id,referral(t));
  t=await currentFollowup(f); await receiveSupply(f.owner,f.id,acknowledgement(t));
  t=await currentFollowup(f); await reviewSupply(f.owner,f.id,reservationReview(t,"Failed"));
  t=await currentFollowup(f); await applySupply(f.owner,f.id,supplyApply(t));
  t=await currentFollowup(f); assert.equal(t.reservation_dependencies[0].fact.data.state,"Failed");
  assert.equal(t.basis.conversion.target.data.demand_class,"Forecast");
  assert.equal(t.basis.conversion.target.quantity,"2"); assert.equal(t.basis.conversion.dependencies.allocations.length,0);
  assert.ok((await readConversion(f.owner,f.id)).dispositions[0].revision_holds.length);
});
test("ES07 dependency refuses unsupported facts, unaccepted work and partial/invented payloads; retains owned holds", async () => {
  const f = await fixture();
  for (const changes of [
    { dependency_id: randomUUID() },
    { outcome_state: "Unknown" },
    { completeness: "Partial" },
    { source_operation: "replacement" },
  ])
    await assert.rejects(
      reviewSupply(f.owner, f.id, { ...reservationReview(f.t), ...changes }),
    );
  await receiveSupply(f.owner, f.id, acknowledgement(f.t, "Returned"));
  await assert.rejects(
    reviewSupply(f.owner, f.id, reservationReview(await currentFollowup(f))),
  );
  let t = await currentFollowup(f);
  const original = t.referral!.id;
  await referSupply(f.owner, f.id, referral(t));
  t = await currentFollowup(f);
  assert.equal(t.referral!.predecessor_id, original);
  await receiveSupply(f.owner, f.id, acknowledgement(t));
  t = await currentFollowup(f);
  await reviewSupply(f.owner, f.id, supplyReview(t, "Hold"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  assert.equal((await currentFollowup(f)).status, "Continuing hold");
  assert.equal((await currentFollowup(f)).outcome!.native_receipt, null);
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
});
test("ES07 dependency selectively holds changed native and quotation evidence and preserves corrected reviews", async () => {
  const f = await fixture();
  await reviewSupply(f.owner, f.id, reservationReview(f.t, "Failed"));
  let t = await currentFollowup(f);
  const original = t.review!;
  await saveRecord(f.owner, supplyInput("Supply"));
  assert.equal((await currentFollowup(f)).can_apply, true);
  await recordFact(
    f.owner,
    t.target_id,
    supplyFact("Assessment", t.basis.conversion.target.version),
  );
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  t = await currentFollowup(f);
  await reviewSupply(f.owner, f.id, reservationReview(t, "Absent"));
  t = await currentFollowup(f);
  assert.equal(t.review!.predecessor_id, original.id);
  const d = await readConversion(f.owner, f.id);
  await receiveQuotation(f.owner, f.id, {
    ...receiving(d, "Held"),
    reason: "SYN corrected source receiving",
  });
  assert.equal((await currentFollowup(f)).can_apply, false);
  await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  t = await currentFollowup(f);
  await reviewSupply(f.owner, f.id, reservationReview(t, "Absent"));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  t = await currentFollowup(f);
  assert.equal(t.reservation_dependencies[0].fact.data.state, "Absent");
  assert.ok(t.events.some((e) => e.id === original.id));
  await assert.rejects(
    reviewSupply(f.owner, f.id, {
      ...reservationReview(t),
      dependency_id: f.unknown.id,
    }),
  );
});
test("ES07 dependency current authority precedes effects, original receipts and restricted shared history", async () => {
  const f = await fixture();
  const other = (await createSession("second-company")).principal;
  await assert.rejects(reviewSupply(other, f.id, reservationReview(f.t)));
  await reviewSupply(f.owner, f.id, reservationReview(f.t));
  let t = await currentFollowup(f);
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.coordinate' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(applySupply(f.owner, f.id, supplyApply(t)));
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
  await applySupply(f.owner, f.id, supplyApply(t));
  t = await currentFollowup(f);
  const original = supplyApply({ ...t, sequence: t.sequence - 1 });
  const readGrants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='supply.read' RETURNING *",
      [f.owner.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(
      readOperation(f.owner, t.outcome!.native_receipt!.operation_id),
    );
    await assert.rejects(readOperation(f.owner, t.outcome!.operation_id));
    await assert.rejects(readConversion(f.owner, f.id));
    await assert.rejects(applySupply(f.owner, f.id, original));
  } finally {
    for (const g of readGrants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
});
test("ES07 dependency populated 0063 upgrade preserves all rows, accepted reviews, receipts, grants, histories and output bytes", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(63);
  await seed(63);
  const f = await reviewedFixture();
  const original = supplyApply(f.t);
  await applySupply(f.owner, f.id, original);
  await retryQuote(f.owner, f.draft.id);
  const draft = await draftBytes(f.owner, f.draft.id),
    issued = await draftBytes(f.owner, f.id);
  const tables = (
    await database().query(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows;
  const snapshot = () =>
    Promise.all(
      tables.map(
        async ({ tablename }) =>
          (
            await database().query(
              `SELECT to_jsonb(t) row FROM ppo.${tablename} t ORDER BY to_jsonb(t)::text`,
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
    after.filter((r) => r.version <= 63),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 63).map((r) => r.version),
    [64],
  );
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  assert.deepEqual(await draftBytes(f.owner, f.id), issued);
  const receipt = (await applySupply(f.owner, f.id, original)).receipt;
  assert.deepEqual(
    receipt,
    (await currentFollowup(f)).outcome &&
      (await readOperation(f.owner, original.operation_id)),
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
});
