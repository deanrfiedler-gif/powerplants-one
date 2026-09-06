import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { reset, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  financeDraft,
  approvedFinance,
  claimedFinance,
  processedFinance,
  reconciledFinance,
  principal,
  base,
  rows,
  readFinance,
} from "../helpers/finance";
import { reportIssued } from "../helpers/reports";
import { timePayload, entry } from "../helpers/field";
import { captureEntry } from "../../src/field/entries";
import { readFieldJob } from "../../src/field/reads";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { financeSources } from "../../src/finance/reads";
import { observeAccount, readAccount } from "../../src/finance/accounts";
import { readOperation } from "../../src/shared/receipts";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
  retryFinanceJob,
} from "../../src/finance/worker";
import { amendReport } from "../../src/reports/service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...names: string[]) =>
  (e: unknown) =>
    names.includes((e as { code: string }).code);
const h = async (id: string) =>
  (await rows("SELECT * FROM ppo.finance_handoffs WHERE id=$1", [id]))[0];

test("P10 simultaneous competing handoffs reserve one complete source quantity only", async () => {
  const q = await financeDraft(),
    other = { ...q.cmd, ...base(), id: randomUUID() };
  await saveFinance(q.p, null, other);
  const attempts = await Promise.allSettled(
    [q.id, other.id].map(async (id) =>
      submitFinance(q.p, id, {
        ...base(),
        expected_version: (await h(id)).version,
      }),
    ),
  );
  assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (
      await rows(
        "SELECT count(DISTINCT handoff_id)::int n FROM ppo.finance_allocation_holds WHERE state='Held'",
      )
    )[0].n,
    1,
  );
  assert.deepEqual(
    await rows(
      "SELECT l.uom,sum(a.quantity)::text quantity FROM ppo.finance_allocation_holds a JOIN ppo.finance_lines l ON l.id=a.line_id GROUP BY l.uom ORDER BY l.uom",
    ),
    [
      { uom: "EA", quantity: "2.000000" },
      { uom: "MIN", quantity: "90.000000" },
    ],
  );
});

test("P10 factual material successor retains captured original and invalidates downstream exact review", async () => {
  const q = await approvedFinance(),
    before = (
      await rows("SELECT * FROM ppo.field_entries WHERE kind='Material'")
    )[0];
  await assert.rejects(
    database().query(
      "UPDATE ppo.field_entries SET payload=jsonb_set(payload,'{quantity}','\"3\"') WHERE id=$1",
      [before.id],
    ),
    code("55000"),
  );
  await amendReport(q.q.p, q.q.report.id, {
    ...base(),
    expected_version: q.q.report.version,
    revision_id: q.q.report.revisions[0].id,
  });
  const j = (await readFieldJob(q.q.p, q.q.job.id)).items[0];
  const correction = {
    ...entry(j, "Material", {
      ...before.payload,
      quantity: "3",
      description:
        "SYN factual correction from two to three sleeves; original retained.",
    }),
    expected_version: before.version,
  };
  await captureEntry(q.q.p, correction, before.id);
  assert.deepEqual(
    (await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [before.id]))[0],
    before,
  );
  const successor = (
    await rows("SELECT * FROM ppo.field_entries WHERE id=$1", [correction.id])
  )[0];
  assert.equal(successor.root_id, before.root_id);
  assert.equal(successor.supersedes_entry_id, before.id);
  assert.equal(successor.payload.quantity, "3");
  assert.equal((await h(q.id)).status, "Returned");
  assert.equal(
    (await readFinance(q.p, q.id)).lines.find((l) => l.entry_id === before.id)!
      .captured_quantity,
    "2.000000",
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.attendance_acceptances"))[0].n,
    1,
  );
});
async function evidence(q: Awaited<ReturnType<typeof reconciledFinance>>) {
  const d = await readFinance(q.reconciler, q.id),
    cmd = {
      ...base(),
      expected_version: d.handoff.version,
      revision_id: d.handoff.current_revision_id,
      review_id: (d.reviews as { id: string }[])[0].id,
      reconciliation_id: (d.reconciliations as { id: string }[])[0].id,
    };
  const result = await requestFinanceEvidence(q.reconciler, q.id, cmd);
  return {
    cmd,
    result,
    job: (
      await rows("SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
        q.id,
      ])
    )[0],
  };
}
for (const declaration of ["time_declaration", "material_declaration"] as const)
  test(`P10 accepted Partial attendance with ${declaration} Incomplete is a Finance blocker, never zero`, async () => {
    const q = await reportIssued({ [declaration]: "Incomplete" }),
      p = await principal("finance"),
      sources = await financeSources(p, q.report.revisions[0].snapshot.work.id),
      s = sources.items.find((s) => s.id === q.report.id)!;
    assert.equal(q.report.appointment.status, "Completed");
    assert.equal(
      q.report.revisions[0].snapshot.completion[declaration],
      "Incomplete",
    );
    assert.equal(s.ready, false);
    assert.match("blocker" in s ? s.blocker : "", /declaration/i);
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.finance_handoffs"))[0].n,
      0,
    );
  });
test("P10 fractional-minute capture stays exact and refuses unapproved payroll rounding", async () => {
  const t = timePayload();
  t.end_at = new Date(Date.parse(t.end_at) + 1000).toISOString();
  const q = await reportIssued({ time_payload: t }),
    p = await principal("finance"),
    s = (
      await financeSources(p, q.report.revisions[0].snapshot.work.id)
    ).items.find((s) => s.id === q.report.id)!;
  assert.equal(s.ready, false);
  assert.match("blocker" in s ? s.blocker : "", /minute|quantity/i);
  assert.equal(
    (
      await rows(
        "SELECT payload->>'elapsed_seconds' seconds FROM ppo.field_entries WHERE kind='Time'",
      )
    )[0].seconds,
    "5401",
  );
});
test("P10 exact source/review/issue IDs and mixed target grains refuse substitution atomically", async () => {
  const q = await financeDraft();
  for (const key of ["report_id", "revision_id", "review_id", "issue_id"])
    await assert.rejects(
      saveFinance(q.p, null, {
        ...q.cmd,
        ...base(),
        id: randomUUID(),
        reports: [{ ...q.cmd.reports[0], [key]: randomUUID() }],
      }),
    );
  await assert.rejects(
    saveFinance(q.p, null, {
      ...q.cmd,
      ...base(),
      id: randomUUID(),
      lines: q.cmd.lines.map((l) =>
        l.disposition === "Billable"
          ? { ...l, target_group: "MIXED-MIN-EA" }
          : l,
      ),
    }),
    code("TargetGrainMismatch"),
  );
  for (const mode of ["Manual", "VerifiedApi", "MYOB"])
    await assert.rejects(
      saveFinance(q.p, null, { ...q.cmd, ...base(), id: randomUUID(), mode }),
    );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_handoffs"))[0].n,
    1,
  );
});
test("P10 unresolved warranty/goodwill remains unknown billable quantity and cannot approve", async () => {
  const q = await financeDraft(),
    { id: _id, ...edit } = q.cmd;
  void _id;
  await saveFinance(q.p, q.id, {
    ...edit,
    ...base(),
    expected_version: (await h(q.id)).version,
    lines: q.cmd.lines.map((l, i) =>
      i === 0 ? { ...l, disposition: "WarrantyReview", target_group: null } : l,
    ),
  });
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  const d = await readFinance(q.reviewer, q.id),
    v = (d.revisions as { id: string; source_hash: string }[])[0];
  assert.equal(
    d.lines.find((l) => l.disposition === "WarrantyReview")!.billable_quantity,
    null,
  );
  await assert.rejects(
    reviewFinance(q.reviewer, q.id, {
      ...base(),
      expected_version: d.handoff.version,
      revision_id: v.id,
      source_hash: v.source_hash,
      decision: "Approved",
    }),
    code("FinancialTreatmentIncomplete"),
  );
  assert.equal((await h(q.id)).status, "ReadyForReview");
});
test("P10 Approved return preserves its exact approval and correction event before any effect", async () => {
  const q = await approvedFinance(),
    original = (await rows("SELECT * FROM ppo.finance_reviews"))[0],
    d = await h(q.id);
  await reviewFinance(q.reviewer, q.id, {
    ...base(),
    expected_version: d.version,
    revision_id: d.current_revision_id,
    source_hash: original.source_hash,
    decision: "Returned",
  });
  assert.deepEqual(
    (await rows("SELECT * FROM ppo.finance_reviews"))[0],
    original,
  );
  assert.equal((await h(q.id)).status, "Returned");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_events WHERE kind='ApprovalReturned'",
      )
    )[0].n,
    1,
  );
});
test("P10 current exact account mapping changes block mutation and mark account balance unavailable", async () => {
  const q = await financeDraft(),
    a = (
      await rows("SELECT * FROM ppo.finance_accounts WHERE id=$1", [
        q.cmd.account_id,
      ])
    )[0];
  await observeAccount(q.p, a.id, {
    ...base(),
    expected_version: a.version,
    fixture: "F-02",
  });
  await database().query(
    "UPDATE ppo.erp_account_mappings SET version=version+1 WHERE id=$1",
    [a.mapping_id],
  );
  await assert.rejects(
    submitFinance(q.p, q.id, {
      ...base(),
      expected_version: (await h(q.id)).version,
    }),
    code("AccountContextChanged"),
  );
  const account = await readAccount(q.p, a.organisation_id, {
    account_id: a.id,
  });
  assert.equal(account.account_balance, null);
  assert.ok(account.context_error);
  assert.equal(account.history[0].source_balance, "600.00");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_allocation_holds"))[0]
      .n,
    0,
  );
});
test("P10 no-posting review consumes complete source dispositions without inventing a target", async () => {
  const q = await financeDraft(),
    { id: _id, ...edit } = q.cmd;
  void _id;
  await saveFinance(q.p, q.id, {
    ...edit,
    ...base(),
    expected_version: (await h(q.id)).version,
    lines: q.cmd.lines.map((l) => ({
      ...l,
      disposition: "NonBillable",
      target_group: null,
      reason:
        "SYN explicit no-posting fixture disposition; no operational warranty determination.",
    })),
  });
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  let d = await readFinance(q.reviewer, q.id);
  const v = (d.revisions as { id: string; source_hash: string }[])[0];
  await reviewFinance(q.reviewer, q.id, {
    ...base(),
    expected_version: d.handoff.version,
    revision_id: v.id,
    source_hash: v.source_hash,
    decision: "Approved",
  });
  await beginFinanceProcessing(q.processor, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
    scenario: "Accepted",
  });
  let f = await h(q.id);
  await recordFinanceOutcome(q.processor, q.id, {
    ...base(),
    expected_version: f.version,
    attempt_id: f.active_attempt_id,
    action: "Dispatch",
  });
  d = await readFinance(q.reconciler, q.id);
  f = d.handoff;
  await reconcileFinance(q.reconciler, q.id, {
    ...base(),
    expected_version: f.version,
    outcome_id: (d.outcomes as { id: string }[])[0].id,
    basis:
      "SYN all source quantities explicitly reviewed non-billable; independent NotProcessed evidence confirms no target.",
  });
  assert.equal((await h(q.id)).status, "Reconciled");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    0,
  );
  assert.equal(
    (await rows("SELECT result FROM ppo.finance_reconciliations"))[0].result,
    "NoPostingRequired",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_allocation_holds WHERE state='Consumed'",
      )
    )[0].n,
    3,
  );
});
test("P10 revoked processing capability denies dispatch and original claim receipt without effects", async () => {
  const q = await claimedFinance(),
    d = await h(q.id),
    a = (await rows("SELECT * FROM ppo.finance_processing_attempts"))[0];
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.process'",
    [q.processor.actor_id],
  );
  await seed();
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, {
      ...base(),
      expected_version: d.version,
      attempt_id: d.active_attempt_id,
      action: "Dispatch",
    }),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(q.processor, a.operation_id),
    code("Forbidden", "RecordUnavailable"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    0,
  );
});
test("P10 source successor after unknown acceptance permits original lookup but refuses stale reconciliation", async () => {
  const q = await processedFinance("AcceptedThenTimeout");
  await amendReport(q.q.p, q.q.report.id, {
    ...base(),
    expected_version: q.q.report.version,
    revision_id: q.q.report.revisions[0].id,
  });
  let f = await h(q.id);
  assert.equal(f.status, "OutcomeUnknown");
  await recordFinanceOutcome(q.processor, q.id, {
    ...base(),
    expected_version: f.version,
    attempt_id: f.active_attempt_id,
    action: "LookupOriginal",
  });
  f = await h(q.id);
  const o = (
    await rows("SELECT * FROM ppo.finance_outcomes WHERE outcome='Processed'")
  )[0];
  await assert.rejects(
    reconcileFinance(q.reconciler, q.id, {
      ...base(),
      expected_version: f.version,
      outcome_id: o.id,
      basis:
        "Exact stale source must remain blocked after original outcome recovery.",
    }),
    code("SourceChanged"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
});
for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
  test(`P10 late ${table} failure rolls back allocation, state, event and original receipt together`, async () => {
    const q = await financeDraft(),
      before = await h(q.id),
      cmd = { ...base(), expected_version: before.version };
    await database().query(
      `CREATE FUNCTION ppo.fail_p10() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN P10 late failure'; END $$; CREATE TRIGGER p10_fail BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_p10()`,
    );
    try {
      await assert.rejects(submitFinance(q.p, q.id, cmd));
    } finally {
      await database().query(
        `DROP TRIGGER p10_fail ON ppo.${table}; DROP FUNCTION ppo.fail_p10()`,
      );
    }
    assert.deepEqual(await h(q.id), before);
    assert.equal(
      (
        await rows("SELECT count(*)::int n FROM ppo.finance_allocation_holds")
      )[0].n,
      0,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1",
          [cmd.operation_id],
        )
      )[0].n,
      0,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.finance_events WHERE kind='Submitted'",
        )
      )[0].n,
      0,
    );
    const accepted = await submitFinance(q.p, q.id, cmd);
    assert.deepEqual(
      (await submitFinance(q.p, q.id, cmd)).receipt,
      accepted.receipt,
    );
  });
test("P10 database failure after possible effect retains one target and fences a changed original ID", async () => {
  const q = await claimedFinance(),
    d = await h(q.id),
    cmd = {
      ...base(),
      expected_version: d.version,
      attempt_id: d.active_attempt_id,
      action: "Dispatch",
    };
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, cmd, {
      beforeRecord: async () => {
        throw Error("SYN late transaction failure");
      },
    }),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_outcomes"))[0].n,
    0,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, { ...cmd, ...base() }),
    code("OriginalLookupRequired"),
  );
  await recordFinanceOutcome(q.processor, q.id, {
    ...cmd,
    ...base(),
    action: "LookupOriginal",
  });
  assert.equal((await h(q.id)).status, "ReconciliationRequired");
});
test("P10 missing-result lookup durably fences late dispatch and retains NotProcessed evidence", async () => {
  const q = await claimedFinance(),
    d = await h(q.id),
    a = (await rows("SELECT * FROM ppo.finance_processing_attempts"))[0];
  await recordFinanceOutcome(q.processor, q.id, {
    ...base(),
    expected_version: d.version,
    attempt_id: a.id,
    action: "LookupOriginal",
  });
  assert.equal((await h(q.id)).status, "Approved");
  assert.equal(
    (await rows("SELECT outcome FROM ppo.finance_simulator_results"))[0]
      .outcome,
    "NotProcessed",
  );
  await database().query(
    "UPDATE ppo.finance_processing_attempts SET dispatch_started_at=clock_timestamp() WHERE id=$1",
    [a.id],
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.finance_simulator_targets(id,workspace_id,handoff_id,account_id,company_id,customer_id,currency,correlation_id,input_hash,attempt_id,kind,status,lines) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'SyntheticServiceCharge','Accepted',$11)",
      [
        randomUUID(),
        d.workspace_id,
        d.id,
        d.account_id,
        d.company_id,
        d.customer_id,
        d.currency,
        a.correlation_id,
        a.input_hash,
        a.id,
        JSON.stringify(a.source_snapshot.lines),
      ],
    ),
    code("23514"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    0,
  );
});
for (const fault of ["missing", "wrong-hash"] as const)
  test(`P10 original ${fault} Finance bytes fail closed without regeneration`, async () => {
    const q = await reconciledFinance(),
      e = await evidence(q);
    await processFinanceJob(e.job.id);
    const issue = (await rows("SELECT * FROM ppo.finance_issues"))[0],
      path = join(
        process.env.PPO_DOCUMENT_DIRECTORY ??
          join(homedir(), ".ppo-synthetic-documents"),
        q.p.workspace_id,
        e.job.id,
      ),
      original = await readFile(path);
    if (fault === "missing") await rename(path, path + ".retained");
    else await writeFile(path, Buffer.from("SYN wrong private bytes"));
    try {
      await assert.rejects(
        financeIssueBytes(q.reconciler, issue.id, { format: "pdf" }),
        code("ExactDocumentUnavailable"),
      );
    } finally {
      if (fault === "missing") await rename(path + ".retained", path);
      else await writeFile(path, original);
    }
    assert.equal(
      (await financeIssueBytes(q.reconciler, issue.id, { format: "pdf" }))
        .sha256,
      issue.output_hash,
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
      1,
    );
  });
test("P10 revoked output owner after durable storage cannot release, retry or recover its receipt", async () => {
  const q = await reconciledFinance(),
    e = await evidence(q);
  const result = await processFinanceJob(e.job.id, {
    afterStore: async () => {
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.issue'",
        [q.reconciler.actor_id],
      );
    },
  });
  assert.equal("state" in result && result.state, "Failed");
  await assert.rejects(
    retryFinanceJob(q.reconciler, e.job.id, {}),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(q.reconciler, e.cmd.operation_id),
    code("Forbidden", "RecordUnavailable"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
    0,
  );
});
test("P10 source changes after rendering preserve reserved bytes and refuse release", async () => {
  const q = await reconciledFinance(),
    e = await evidence(q);
  const result = await processFinanceJob(e.job.id, {
    afterRender: async () => {
      await amendReport(q.q.p, q.q.report.id, {
        ...base(),
        expected_version: q.q.report.version,
        revision_id: q.q.report.revisions[0].id,
      });
    },
  });
  assert.equal("state" in result && result.state, "StaleSource");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
    0,
  );
  assert.ok(
    (await rows("SELECT output_manifest FROM ppo.finance_render_jobs"))[0]
      .output_manifest,
  );
});

test("P10 revoked Finance read scope denies released bytes and original issue receipt", async () => {
  const q = await reconciledFinance(),
    e = await evidence(q);
  await processFinanceJob(e.job.id);
  const issue = (await rows("SELECT * FROM ppo.finance_issues"))[0];
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.read'",
    [q.reconciler.actor_id],
  );
  for (const format of ["html", "pdf"])
    await assert.rejects(
      financeIssueBytes(q.reconciler, issue.id, { format }),
      code("Forbidden", "RecordUnavailable"),
    );
  await assert.rejects(
    readOperation(q.reconciler, e.cmd.operation_id),
    code("Forbidden", "RecordUnavailable"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
    1,
  );
});

for (const change of ["policy", "renderer"] as const)
  test(`P10 changed exact ${change} after rendering cannot issue stale bytes`, async () => {
    const q = await reconciledFinance(),
      e = await evidence(q),
      path = "src/finance/render.ts",
      original = await readFile(path);
    let result;
    try {
      result = await processFinanceJob(e.job.id, {
        afterRender: async () => {
          if (change === "policy")
            await database().query(
              "UPDATE ppo.finance_template_policy SET version=version+1",
            );
          else
            await writeFile(
              path,
              Buffer.concat([
                original,
                Buffer.from(
                  "\n// SYN changed Finance template source during rendering\n",
                ),
              ]),
            );
        },
      });
    } finally {
      if (change === "renderer") await writeFile(path, original);
    }
    assert.ok(
      "state" in result &&
        typeof result.state === "string" &&
        ["StaleSource", "Failed"].includes(result.state),
    );
    assert.equal(
      (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
      0,
    );
    assert.ok(
      (await rows("SELECT output_manifest FROM ppo.finance_render_jobs"))[0]
        .output_manifest,
    );
  });
