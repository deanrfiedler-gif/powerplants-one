import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
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
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
  cancelFinance,
  requestFinanceCorrection,
} from "../../src/finance/service";
import { financeOptions, listFinance } from "../../src/finance/reads";
import { observeAccount, readAccount } from "../../src/finance/accounts";
import { readOperation } from "../../src/shared/receipts";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
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
test("P10 F-06 preserves Draft field originals and separately conserves 90 MIN and 2 EA", async () => {
  const q = await reconciledFinance(),
    r = await readFinance(q.reconciler, q.id);
  assert.equal(r.handoff.status, "Reconciled");
  assert.deepEqual(
    (
      await rows(
        "SELECT kind,review_status FROM ppo.field_entries ORDER BY kind",
      )
    ).map((e) => e.review_status),
    ["Draft", "Draft", "Draft", "Draft"],
  );
  assert.deepEqual(
    await rows(
      "SELECT quantity,state FROM ppo.finance_allocation_holds ORDER BY quantity",
    ),
    [
      { quantity: "2.000000", state: "Consumed" },
      { quantity: "30.000000", state: "Consumed" },
      { quantity: "60.000000", state: "Consumed" },
    ],
  );
  const targets = await rows("SELECT * FROM ppo.finance_simulator_targets");
  assert.equal(targets.length, 1);
  assert.deepEqual(
    targets[0].lines.map((l: { quantity: string; uom: string }) => [
      l.quantity,
      l.uom,
    ]),
    [
      ["60", "MIN"],
      ["2", "EA"],
    ],
  );
});
test("P10 source creation and every direct read/receipt obey current Finance grants", async () => {
  const q = await financeDraft();
  for (const profile of [
    "coordinator",
    "systems",
    "assigned-technician",
    "other-workspace",
    "second-company",
  ]) {
    const p = await principal(profile);
    await assert.rejects(
      readFinance(p, q.id),
      code("Forbidden", "RecordUnavailable"),
    );
    await assert.rejects(financeOptions(p), code("Forbidden"));
    await assert.rejects(
      saveFinance(p, null, {
        ...q.cmd,
        id: randomUUID(),
        operation_id: randomUUID(),
      }),
      code("Forbidden", "RecordUnavailable"),
    );
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.prepare'",
    [q.p.actor_id],
  );
  await seed();
  await assert.rejects(
    readOperation(q.p, q.cmd.operation_id),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    saveFinance(q.p, null, q.cmd),
    code("Forbidden", "RecordUnavailable"),
  );
});
test("P10 exact duplicate original recovers receipt; changed reuse and malformed fields fail", async () => {
  const q = await financeDraft();
  assert.deepEqual(
    (await saveFinance(q.p, null, q.cmd)).receipt,
    q.result.receipt,
  );
  await assert.rejects(
    saveFinance(q.p, null, {
      ...q.cmd,
      treatment_basis:
        "Different synthetic treatment under the same operation.",
    }),
    code("OperationConflict"),
  );
  for (const extra of [
    { role: "finance" },
    { posted_quantity: "60" },
    { tax: "10" },
    { account_id: randomUUID() },
    { work_order_id: randomUUID() },
  ])
    await assert.rejects(
      saveFinance(q.p, null, {
        ...q.cmd,
        ...extra,
        id: randomUUID(),
        operation_id: randomUUID(),
      }),
    );
});
test("P10 return retains original holds, explicit revision releases and transfers them", async () => {
  const q = await financeDraft();
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  const r = await h(q.id),
    v = (
      await rows("SELECT * FROM ppo.finance_revisions WHERE id=$1", [
        r.current_revision_id,
      ])
    )[0];
  await reviewFinance(q.reviewer, q.id, {
    ...base(),
    expected_version: r.version,
    revision_id: v.id,
    source_hash: v.source_hash,
    decision: "Returned",
  });
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_allocation_holds WHERE state='Held'",
      )
    )[0].n,
    3,
  );
  const { id: _id, ...edit } = q.cmd;
  void _id;
  await saveFinance(q.p, q.id, {
    ...edit,
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_revisions"))[0].n,
    2,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_allocation_holds WHERE state='Released'",
      )
    )[0].n,
    3,
  );
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_allocation_holds WHERE state='Held'",
      )
    )[0].n,
    3,
  );
});
test("P10 over, under and duplicate allocations cannot release source quantities", async () => {
  const q = await financeDraft();
  const { id: _id, ...edit } = q.cmd;
  void _id;
  for (const quantity of ["59", "61"]) {
    await saveFinance(q.p, q.id, {
      ...edit,
      ...base(),
      expected_version: (await h(q.id)).version,
      lines: q.cmd.lines.map((l, i) => (i === 0 ? { ...l, quantity } : l)),
    });
    await assert.rejects(
      submitFinance(q.p, q.id, {
        ...base(),
        expected_version: (await h(q.id)).version,
      }),
      code("AllocationIncomplete"),
    );
  }
  await saveFinance(q.p, q.id, {
    ...edit,
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  await submitFinance(q.p, q.id, {
    ...base(),
    expected_version: (await h(q.id)).version,
  });
  const other = { ...q.cmd, ...base(), id: randomUUID() };
  await saveFinance(q.p, null, other);
  await assert.rejects(
    submitFinance(q.p, other.id, {
      ...base(),
      expected_version: (await h(other.id)).version,
    }),
    code("InvalidRelationship"),
  );
});
test("P10 F-07 records Unknown then reconciles the same one target by original lookup", async () => {
  const q = await processedFinance("AcceptedThenTimeout");
  let r = await h(q.id);
  assert.equal(r.status, "OutcomeUnknown");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
  assert.equal((await readFinance(q.p, q.id)).targets.length, 0);
  await assert.rejects(
    beginFinanceProcessing(q.processor, q.id, {
      ...base(),
      expected_version: r.version,
      scenario: "Accepted",
    }),
    code("FinanceStateChanged"),
  );
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, {
      ...base(),
      expected_version: r.version,
      attempt_id: r.active_attempt_id,
      action: "Dispatch",
    }),
    code("OriginalLookupRequired"),
  );
  const cmd = {
      ...base(),
      expected_version: r.version,
      attempt_id: r.active_attempt_id,
      action: "LookupOriginal",
    },
    receipt = await recordFinanceOutcome(q.processor, q.id, cmd);
  assert.deepEqual(
    (await recordFinanceOutcome(q.processor, q.id, cmd)).receipt,
    receipt.receipt,
  );
  r = await h(q.id);
  assert.equal(r.status, "ReconciliationRequired");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
});
test("P10 simultaneous claims and original outcome requests have only one effect", async () => {
  const q = await approvedFinance(),
    r = await h(q.id),
    attempts = await Promise.allSettled(
      [1, 2].map(() =>
        beginFinanceProcessing(q.processor, q.id, {
          ...base(),
          expected_version: r.version,
          scenario: "Accepted",
        }),
      ),
    );
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
  const a = await h(q.id),
    cmd = {
      ...base(),
      expected_version: a.version,
      attempt_id: a.active_attempt_id,
      action: "Dispatch",
    },
    results = await Promise.allSettled([
      recordFinanceOutcome(q.processor, q.id, cmd),
      recordFinanceOutcome(q.processor, q.id, cmd),
    ]);
  assert.ok(results.some((x) => x.status === "fulfilled"));
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_outcomes"))[0].n,
    1,
  );
});
test("P10 accepted target survives local failure and cannot be blindly replayed", async () => {
  const q = await claimedFinance(),
    r = await h(q.id),
    cmd = {
      ...base(),
      expected_version: r.version,
      attempt_id: r.active_attempt_id,
      action: "Dispatch",
    };
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, cmd, {
      afterTarget: async () => {
        throw Error("SYN database connection lost after target");
      },
    }),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_outcomes"))[0].n,
    0,
  );
  await assert.rejects(
    recordFinanceOutcome(q.processor, q.id, cmd),
    code("OriginalLookupRequired"),
  );
  await recordFinanceOutcome(q.processor, q.id, {
    ...cmd,
    ...base(),
    action: "LookupOriginal",
  });
  assert.equal((await h(q.id)).status, "ReconciliationRequired");
});
test("P10 verified NotProcessed releases processor and preserves original target identity on new attempt", async () => {
  const q = await processedFinance("NotProcessed");
  let r = await h(q.id);
  assert.equal(r.status, "Approved");
  const original = (
    await rows("SELECT * FROM ppo.finance_processing_attempts")
  )[0];
  await beginFinanceProcessing(q.processor, q.id, {
    ...base(),
    expected_version: r.version,
    scenario: "Accepted",
  });
  r = await h(q.id);
  await recordFinanceOutcome(q.processor, q.id, {
    ...base(),
    expected_version: r.version,
    attempt_id: r.active_attempt_id,
    action: "Dispatch",
  });
  const second = (
    await rows(
      "SELECT * FROM ppo.finance_processing_attempts ORDER BY attempt DESC",
    )
  )[0];
  assert.equal(second.input_hash, original.input_hash);
  assert.equal(second.correlation_id, original.correlation_id);
});
test("P10 pre-effect report successor invalidates readiness and retains submitted allocations", async () => {
  const q = await approvedFinance();
  await amendReport(q.q.p, q.q.report.id, {
    ...base(),
    expected_version: q.q.report.version,
  });
  assert.equal((await h(q.id)).status, "Returned");
  assert.equal((await h(q.id)).needs_review, true);
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.finance_allocation_holds WHERE state='Held'",
      )
    )[0].n,
    3,
  );
  await assert.rejects(
    beginFinanceProcessing(q.processor, q.id, {
      ...base(),
      expected_version: (await h(q.id)).version,
      scenario: "Accepted",
    }),
    code("FinanceStateChanged"),
  );
});
test("P10 source correction after possible processing preserves original target and requires a linked correction", async () => {
  const q = await processedFinance();
  await amendReport(q.q.p, q.q.report.id, {
    ...base(),
    expected_version: q.q.report.version,
  });
  let r = await h(q.id);
  assert.equal(r.status, "ReconciliationRequired");
  assert.equal(r.needs_review, true);
  await requestFinanceCorrection(q.reconciler, q.id, {
    ...base(),
    expected_version: r.version,
    disposition: "CorrectionRequested",
  });
  r = await h(q.id);
  await assert.rejects(
    cancelFinance(q.p, q.id, { ...base(), expected_version: r.version }),
    code("FinanceStateChanged"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_simulator_targets"))[0]
      .n,
    1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_corrections"))[0].n,
    1,
  );
});
test("P10 partial target cannot reconcile; target/history remain immutable", async () => {
  const q = await processedFinance("Partial"),
    r = await h(q.id),
    o = (await rows("SELECT id FROM ppo.finance_outcomes"))[0];
  await assert.rejects(
    reconcileFinance(q.reconciler, q.id, {
      ...base(),
      expected_version: r.version,
      outcome_id: o.id,
      basis: "Check independently specified F-06 target quantities exactly.",
    }),
    code("TargetDifference"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.finance_simulator_targets SET status='Accepted'",
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.finance_lines"),
    code("55000"),
  );
});
test("P10 stale definition and changed exact account mapping block submit", async () => {
  const q = await financeDraft();
  await database().query("UPDATE ppo.finance_policy SET version=version+1");
  await assert.rejects(
    submitFinance(q.p, q.id, {
      ...base(),
      expected_version: (await h(q.id)).version,
    }),
    code("FinancePolicyChanged"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_allocation_holds"))[0]
      .n,
    0,
  );
});
test("P10 F-01–F-05 prove source balances, reversals, partial extraction and failure labels", async () => {
  const p = await principal("finance"),
    a = (await financeOptions(p)).accounts[0];
  let version = a.version;
  for (const [fixture, balance, cash] of [
    ["F-01", "600.00", "0.00"],
    ["F-02", "600.00", "200.00"],
    ["F-03", "1000.00", "0.00"],
    ["F-04", null, null],
    ["F-05", "600.00", "0.00"],
    ["Failed", null, null],
  ] as const) {
    await observeAccount(p, a.id, {
      ...base(),
      expected_version: version++,
      fixture,
    });
    const r = await readAccount(p, a.customer_id, { account_id: a.id });
    assert.equal(r.account_balance, balance);
    assert.equal(r.current.unapplied_cash, cash);
    assert.equal(r.commitments.value, null);
    assert.equal(r.commitments.status, "Not defined");
    if (fixture === "F-03")
      assert.equal(
        r.current.observations.find(
          (v: { type: string }) => v.type === "SyntheticPaymentReversal",
        ).reverses,
        "SYN-F01-PAYMENT",
      );
    if (fixture === "Failed")
      assert.equal(r.last_good.source_balance, "600.00");
  }
  await assert.rejects(
    readAccount(await principal("assigned-technician"), a.customer_id, {
      account_id: a.id,
    }),
    code("Forbidden"),
  );
  await assert.rejects(
    readAccount(p, randomUUID(), { account_id: a.id }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readAccount(p, a.customer_id, { account_id: a.id, currency: "USD" }),
    code("InvalidData"),
  );
});
test("P10 OUT-14 storage-success/database-failure recovers original exact bytes and release identity", async () => {
  const q = await reconciledFinance(),
    r = await h(q.id),
    v = (await rows("SELECT * FROM ppo.finance_reviews"))[0],
    recon = (await rows("SELECT * FROM ppo.finance_reconciliations"))[0];
  await requestFinanceEvidence(q.reconciler, q.id, {
    ...base(),
    expected_version: r.version,
    revision_id: r.current_revision_id,
    review_id: v.id,
    reconciliation_id: recon.id,
  });
  const j = (await rows("SELECT * FROM ppo.finance_render_jobs"))[0];
  const failed = await processFinanceJob(j.id, {
    afterStore: async () => {
      throw Error("SYN database failure after private storage acceptance");
    },
  });
  assert.equal("state" in failed && failed.state, "Failed");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.finance_issues"))[0].n,
    0,
  );
  const recovered = await processFinanceJob(j.id, {
    afterRender: async () => {
      throw Error("Must never render original twice");
    },
  });
  assert.ok("issue_id" in recovered);
  const issue = (await rows("SELECT * FROM ppo.finance_issues"))[0],
    bytes = await financeIssueBytes(q.reconciler, issue.id, { format: "pdf" });
  assert.equal(bytes.sha256, issue.output_hash);
  assert.ok(bytes.bytes.length > 1000);
  await assert.rejects(
    financeIssueBytes(await principal("coordinator"), issue.id, {
      format: "pdf",
    }),
    code("Forbidden", "RecordUnavailable"),
  );
});
test("P10 empty scoped queue is explicit and never grants Finance to Systems", async () => {
  const p = await principal("finance");
  assert.deepEqual((await listFinance(p)).items, []);
  await assert.rejects(
    listFinance(await principal("systems")),
    code("Forbidden"),
  );
});
