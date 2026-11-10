import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { financeSources } from "../../src/finance/reads";
import { cancelFinance } from "../../src/finance/service";
import { base, readFinance, reconciledFinance } from "../helpers/finance";
import {
  linkedFinanceDraft,
  reviseWork,
  costLines,
  submitWork,
  reviewWork,
  beginWork,
  recordWork,
  reconcileWork,
  historicalLink,
  historicalClosedProject,
  assertNoNewEffects,
} from "../helpers/project-work-finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const refusal = (e: unknown) => {
  assert.equal((e as { status: number }).status, 409);
  assert.equal((e as { code: string }).code, "ProjectWorkNotBillable");
  assert.equal(
    (e as Error).message,
    "This work order is included in a project contract. Charge additional work through an approved variation claim.",
  );
  return true;
};
const holds = async (id: string) =>
  (
    await database().query(
      "SELECT state FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY line_id",
      [id],
    )
  ).rows;
for (const line of [0, 2])
  test(`B4 refuses ${line === 0 ? "Labour" : "Consumed part"} at submit and revised Returned Draft; no override by reason`, async () => {
    const f = await linkedFinanceDraft();
    const lines = costLines(f);
    lines[line] = {
      ...f.cmd.lines[line],
      reason: "Extra site time requested by customer",
    };
    await reviseWork(f, lines);
    const before = await readFinance(f.p, f.id);
    await assert.rejects(submitWork(f), refusal);
    assert.equal(
      (await readFinance(f.p, f.id)).handoff.version,
      before.handoff.version,
    );
    assert.deepEqual(await holds(f.id), []);
    await reviseWork(f, costLines(f));
    await submitWork(f);
    await reviewWork(f, "Returned");
    await reviseWork(f, lines);
    await assert.rejects(submitWork(f), refusal);
    assert.equal((await readFinance(f.p, f.id)).handoff.status, "Draft");
    assert.equal(
      (await holds(f.id)).filter((x) => x.state === "Held").length,
      0,
    );
  });
test("B4 backend prefill and changed reason retain NonBillable and reconcile without a target", async () => {
  const f = await linkedFinanceDraft();
  const sources = await financeSources(f.p, f.work.id);
  assert.deepEqual(sources.allocation_defaults, {
    disposition: "NonBillable",
    reason: "Included in project contract",
    target_group: null,
  });
  const lines = costLines(f).map(({ reason: ignored, ...l }) => {
    void ignored;
    return l;
  });
  // Omitted reasons receive the server default, while explicit reasons are retained.
  await reviseWork(f, lines as typeof f.cmd.lines);
  assert.ok(
    (await readFinance(f.p, f.id)).lines.every(
      (l) => l.reason === "Included in project contract",
    ),
  );
  await reviseWork(
    f,
    costLines(f).map((l) => ({
      ...l,
      reason: "Extra site time requested by customer",
    })),
  );
  await submitWork(f);
  await reviewWork(f);
  await beginWork(f);
  await recordWork(f);
  await reconcileWork(f);
  const r = await readFinance(f.reconciler, f.id);
  assert.equal(r.handoff.status, "Reconciled");
  assert.equal(r.reconciliations[0].result, "NoPostingRequired");
  assert.equal(r.targets.length, 0);
  assert.ok(
    r.lines.every(
      (l) =>
        l.disposition === "NonBillable" && Number(l.billable_quantity) === 0,
    ),
  );
});
for (const boundary of ["submit", "approval", "begin"] as const)
  test(`B4 current link at ${boundary}, including legacy Billable handoffs; Return and Cancel remain safe`, async () => {
    const f = await linkedFinanceDraft();
    await historicalLink(f, null);
    if (boundary !== "submit") await submitWork(f);
    if (boundary === "begin") await reviewWork(f);
    await historicalLink(f, f.project.id);
    const call =
      boundary === "submit"
        ? submitWork
        : boundary === "approval"
          ? reviewWork
          : beginWork;
    await assert.rejects(call(f), refusal);
    assert.deepEqual(await assertNoNewEffects(f.id), {
      attempts: "0",
      targets: "0",
    });
    if (boundary === "approval") {
      await reviewWork(f, "Returned");
      assert.ok((await holds(f.id)).every((x) => x.state === "Held"));
    }
    const r = await readFinance(f.p, f.id);
    await cancelFinance(f.p, f.id, {
      ...base(),
      expected_version: r.handoff.version,
    });
    assert.ok((await holds(f.id)).every((x) => x.state === "Released"));
  });
for (const boundary of ["submit", "approval", "begin"] as const)
  test(`B4 removal of current link before ${boundary} restores ordinary WorkOrder rules`, async () => {
    const f = await linkedFinanceDraft();
    await historicalLink(f, null);
    if (boundary !== "submit") await submitWork(f);
    if (boundary === "begin") await reviewWork(f);
    await historicalLink(f, f.project.id);
    const call =
      boundary === "submit"
        ? submitWork
        : boundary === "approval"
          ? reviewWork
          : beginWork;
    await assert.rejects(call(f), refusal);
    await historicalLink(f, null);
    await call(f);
    assert.equal(
      (await readFinance(f.p, f.id)).handoff.status,
      { submit: "ReadyForReview", approval: "Approved", begin: "AwaitingERP" }[
        boundary
      ],
    );
  });
for (const boundary of ["submit", "approval", "begin"] as const)
  test(`B4 Closed project still refuses at ${boundary}`, async () => {
    const f = await linkedFinanceDraft();
    await historicalLink(f, null);
    if (boundary !== "submit") await submitWork(f);
    if (boundary === "begin") await reviewWork(f);
    await historicalLink(f, f.project.id);
    await historicalClosedProject(f);
    await assert.rejects(
      (boundary === "submit"
        ? submitWork
        : boundary === "approval"
          ? reviewWork
          : beginWork)(f),
      refusal,
    );
  });
test("B4 Pending and review dispositions cannot pass submission on linked work", async () => {
  const f = await linkedFinanceDraft();
  for (const disposition of ["Pending", "WarrantyReview", "GoodwillReview"]) {
    await reviseWork(
      f,
      costLines(f).map((l) => ({ ...l, disposition })),
    );
    await assert.rejects(submitWork(f), refusal);
  }
});
test("B4 does not alter AwaitingERP dispatch, unknown original lookup or reconciliation", async () => {
  const f = await linkedFinanceDraft();
  await historicalLink(f, null);
  await submitWork(f);
  await reviewWork(f);
  await beginWork(f, "AcceptedThenTimeout");
  await historicalLink(f, f.project.id);
  await recordWork(f);
  assert.equal((await readFinance(f.p, f.id)).handoff.status, "OutcomeUnknown");
  await recordWork(f, "LookupOriginal");
  await reconcileWork(f);
  assert.equal((await readFinance(f.p, f.id)).handoff.status, "Reconciled");
  assert.deepEqual(await assertNoNewEffects(f.id), {
    attempts: "1",
    targets: "1",
  });
});
test("B4 unlinked F-06 still posts 60 MIN and retains 30 MIN cost evidence", async () => {
  const f = await reconciledFinance();
  const r = await readFinance(f.reconciler, f.id);
  assert.equal(r.handoff.status, "Reconciled");
  assert.equal(r.reconciliations[0].result, "Matched");
  assert.deepEqual(
    r.lines
      .filter((l) => l.uom === "MIN")
      .map((l) => [l.disposition, Number(l.allocated_quantity)])
      .sort(),
    [
      ["Billable", 60],
      ["NonBillable", 30],
    ],
  );
  assert.equal(
    (await financeSources(f.p, f.cmd.work_order_id)).allocation_defaults,
    null,
  );
});
