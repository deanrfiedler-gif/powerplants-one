import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reportIssued, principal, base, rows } from "../helpers/reports";
import { timePayload } from "../helpers/field";
import {
  financeOptions,
  financeSources,
  readFinance,
} from "../../src/finance/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import type { SourceEntry } from "../../src/finance/context";
import { insert } from "../../src/documents/packs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function source() {
  const q = await reportIssued({
    time_payload: { ...timePayload(), time_kind: "Travel" },
  });
  const p = await principal("finance"),
    o = await financeOptions(p);
  const w = o.works.find(
    (w) => w.id === q.report.revisions[0].snapshot.work.id,
  )!;
  const s = (await financeSources(p, w.id)).items.find(
    (s) => s.id === q.report.id,
  )!;
  if (!s.ready || !("source" in s) || !s.source) throw Error(JSON.stringify(s));
  const entries: SourceEntry[] = s.source.entries;
  const time = entries.find((e) => e.direction === "Travel")!;
  const cmd = {
    ...base(),
    id: randomUUID(),
    work_order_id: w.id,
    account_id: o.accounts.find((a) => a.customer_id === w.customer_id)!.id,
    mode: "SyntheticApi",
    definition_id: o.definition.id,
    definition_version: o.definition.version,
    policy_version: o.definition.policy_version,
    reports: [
      {
        report_id: s.id,
        revision_id: s.revision_id,
        review_id: s.review_id,
        issue_id: s.issue_id,
      },
    ],
    lines: entries.map((e) => ({
      entry_id: e.id,
      quantity: e.quantity,
      disposition: "NonBillable",
      reason:
        "P11 exact synthetic source retained as non-billable; no accounting posting.",
      target_group: null as string | null,
    })),
    treatment_basis:
      "ADR-0018 Travel is separately non-billable; no payroll or cost inference. Material explicitly has no posting in this case.",
    remaining_work_basis:
      "Accepted Partial attendance only; owned remaining physical work still requires a separately authorised visit.",
  };
  return { q, p, w, time, cmd };
}

test("P11 Travel charges, reclassification, omitted quantities, unknown fields and stale policy fail without losing originals", async () => {
  const q = await source();
  const originals = await rows("SELECT * FROM ppo.field_entries ORDER BY id");
  for (const disposition of [
    "Billable",
    "Pending",
    "WarrantyReview",
    "GoodwillReview",
  ])
    await assert.rejects(
      saveFinance(q.p, null, {
        ...q.cmd,
        ...base(),
        id: randomUUID(),
        lines: q.cmd.lines.map((l) =>
          l.entry_id === q.time.id
            ? {
                ...l,
                disposition,
                target_group:
                  disposition === "Billable" ? "TRAVEL-CHARGE" : null,
              }
            : l,
        ),
      }),
      code("TravelNoPostingRequired"),
    );
  await assert.rejects(
    saveFinance(q.p, null, {
      ...q.cmd,
      ...base(),
      id: randomUUID(),
      lines: q.cmd.lines.map((l) => ({ ...l, direction: "Labour" })),
    }),
  );
  await saveFinance(q.p, null, q.cmd);
  const d = await readFinance(q.p, q.cmd.id);
  const l = d.lines.find((l) => l.entry_id === q.time.id)!;
  // Explicit columns avoid a read-only projection becoming a physical insert.
  const physical = (
    await rows("SELECT * FROM ppo.finance_lines WHERE id=$1", [l.id])
  )[0];
  await assert.rejects(
    insert(database(), "finance_lines", {
      ...physical,
      id: randomUUID(),
      direction: "Labour",
    }),
    code("23514"),
  );
  await assert.rejects(
    insert(database(), "finance_lines", {
      ...physical,
      id: randomUUID(),
      disposition: "Billable",
      billable_quantity: physical.allocated_quantity,
      target_group: "TRAVEL-CHARGE",
    }),
    code("23514"),
  );
  const omitted = {
    ...q.cmd,
    ...base(),
    id: randomUUID(),
    lines: q.cmd.lines.filter((l) => l.entry_id !== q.time.id),
  };
  await saveFinance(q.p, null, omitted);
  await assert.rejects(
    submitFinance(q.p, omitted.id, {
      ...base(),
      expected_version: (await readFinance(q.p, omitted.id)).handoff.version,
    }),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_allocation_holds"))[0]
      .n,
    0,
  );
  await database().query(
    "UPDATE ppo.finance_policy SET definition_id='f1000000-0000-4000-8000-000000000001',version=version+1",
  );
  const old = (await financeSources(q.p, q.w.id)).items.find(
    (s) => s.id === q.q.report.id,
  )!;
  assert.equal(old.ready, false);
  assert.equal("code" in old && old.code, "UnsupportedTimeBasis");
  await assert.rejects(
    submitFinance(q.p, q.cmd.id, {
      ...base(),
      expected_version: d.handoff.version,
    }),
    code("FinancePolicyChanged"),
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.field_entries ORDER BY id"),
    originals,
  );
});

test("P11 full Travel quantity is reserved, separately approved and consumed through original no-posting reconciliation", async () => {
  const q = await source();
  await saveFinance(q.p, null, q.cmd);
  let d = await readFinance(q.p, q.cmd.id);
  await submitFinance(q.p, q.cmd.id, {
    ...base(),
    expected_version: d.handoff.version,
  });
  const competing = { ...q.cmd, ...base(), id: randomUUID() };
  await saveFinance(q.p, null, competing);
  await assert.rejects(
    submitFinance(q.p, competing.id, {
      ...base(),
      expected_version: (await readFinance(q.p, competing.id)).handoff.version,
    }),
  );
  d = await readFinance(q.p, q.cmd.id);
  const reviewer = await principal("finance-reviewer"),
    processor = await principal("finance-processor"),
    reconciler = await principal("finance-reconciler");
  const v = d.revisions[0];
  await reviewFinance(reviewer, q.cmd.id, {
    ...base(),
    expected_version: d.handoff.version,
    revision_id: v.id,
    source_hash: v.source_hash,
    decision: "Approved",
  });
  d = await readFinance(processor, q.cmd.id);
  await beginFinanceProcessing(processor, q.cmd.id, {
    ...base(),
    expected_version: d.handoff.version,
    scenario: "NotProcessed",
  });
  d = await readFinance(processor, q.cmd.id);
  const claim = (
    await rows("SELECT * FROM ppo.finance_processing_attempts WHERE id=$1", [
      d.handoff.active_attempt_id,
    ])
  )[0];
  const travelLine = d.lines.find((l) => l.entry_id === q.time.id)!;
  for (const direction of ["Travel", "Labour"]) {
    const c = await database().connect();
    try {
      await c.query("BEGIN");
      await c.query(
        "UPDATE ppo.finance_processing_attempts SET dispatch_started_at=clock_timestamp() WHERE id=$1",
        [claim.id],
      );
      await assert.rejects(
        insert(c, "finance_simulator_targets", {
          id: randomUUID(),
          workspace_id: d.handoff.workspace_id,
          handoff_id: q.cmd.id,
          account_id: d.handoff.account_id,
          company_id: d.handoff.company_id,
          customer_id: d.handoff.customer_id,
          currency: d.handoff.currency,
          correlation_id: claim.correlation_id,
          input_hash: claim.input_hash,
          attempt_id: claim.id,
          kind: "SyntheticServiceCharge",
          status: "Accepted",
          lines: JSON.stringify([
            {
              id: randomUUID(),
              group: "FORGED-TRAVEL",
              quantity: "90",
              uom: "MIN",
              direction,
              source_allocations: [{ line_id: travelLine.id, quantity: "90" }],
            },
          ]),
        }),
        (e: unknown) =>
          code("23514")(e) && /Travel cannot create/.test((e as Error).message),
      );
    } finally {
      await c.query("ROLLBACK");
      c.release();
    }
  }
  const command = {
    ...base(),
    expected_version: d.handoff.version,
    attempt_id: d.handoff.active_attempt_id,
    action: "Dispatch",
  };
  const accepted = await recordFinanceOutcome(processor, q.cmd.id, command);
  assert.deepEqual(
    (await recordFinanceOutcome(processor, q.cmd.id, command)).receipt,
    accepted.receipt,
  );
  d = await readFinance(reconciler, q.cmd.id);
  await reconcileFinance(reconciler, q.cmd.id, {
    ...base(),
    expected_version: d.handoff.version,
    outcome_id: d.outcomes[0].id,
    basis:
      "Separate exact source review confirms all 90 Travel MIN and 2 EA are non-billable, with no target posting required.",
  });
  d = await readFinance(reconciler, q.cmd.id);
  assert.equal(d.handoff.status, "Reconciled");
  assert.equal(d.reconciliations[0].result, "NoPostingRequired");
  const l = d.lines.find((l) => l.entry_id === q.time.id)!;
  assert.deepEqual(
    [
      l.direction,
      l.captured_quantity,
      l.reviewed_quantity,
      l.allocated_quantity,
      l.billable_quantity,
      l.target_group,
    ],
    ["Travel", "90.000000", "90.000000", "90.000000", "0.000000", null],
  );
  assert.deepEqual(
    await rows(
      "SELECT state,quantity::text FROM ppo.finance_allocation_holds WHERE handoff_id=$1 AND root_entry_id=$2",
      [q.cmd.id, q.time.root_entry_id],
    ),
    [{ state: "Consumed", quantity: "90.000000" }],
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    0,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT payload->>'time_kind' kind,review_status FROM ppo.field_entries WHERE id=$1",
        [q.time.id],
      )
    )[0],
    { kind: "Travel", review_status: "Draft" },
  );
});

test("P11 fractional-minute Travel retains exact seconds and blocks without rounding", async () => {
  const t = timePayload();
  const q = await reportIssued({
    time_payload: {
      ...t,
      time_kind: "Travel",
      end_at: new Date(Date.parse(t.end_at) + 1000).toISOString(),
    },
  });
  const p = await principal("finance");
  const s = (
    await financeSources(p, q.report.revisions[0].snapshot.work.id)
  ).items.find((s) => s.id === q.report.id)!;
  assert.equal(s.ready, false);
  assert.equal("code" in s && s.code, "UnsupportedQuantityBasis");
  assert.deepEqual(
    (
      await rows(
        "SELECT payload->>'time_kind' kind,payload->>'elapsed_seconds' seconds,review_status FROM ppo.field_entries WHERE kind='Time'",
      )
    )[0],
    { kind: "Travel", seconds: "5401", review_status: "Draft" },
  );
});
