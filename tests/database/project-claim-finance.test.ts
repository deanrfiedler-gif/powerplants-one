import { commandCommercial } from "../../src/projects/commercial/commands";
import { commercialAction, variation } from "../helpers/project-commercial";
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  projectFinanceFixture,
  saveClaim,
  approveClaim,
  crmBase,
  readFinance,
} from "../helpers/project-claim-finance";
import {
  saveFinance,
  submitFinance,
  reviewFinance,
  cancelFinance,
  beginFinanceProcessing,
  recordFinanceOutcome,
  reconcileFinance,
} from "../../src/finance/service";
import { readCommercialFinance } from "../../src/projects/commercial/reads";
import { commandClaims } from "../../src/projects/commercial/claims";
import { readOperation } from "../../src/shared/receipts";
import { listFinance } from "../../src/finance/reads";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const holds = async (id: string) =>
  (
    await database().query(
      "SELECT state,claim_target_id,line_id FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY created_at,line_id",
      [id],
    )
  ).rows;
async function begin(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
  id: string,
  scenario = "Accepted",
) {
  const r = await readFinance(f.processor, id);
  await beginFinanceProcessing(f.processor, id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    scenario,
  });
  return readFinance(f.processor, id);
}
async function outcome(
  f: Awaited<ReturnType<typeof projectFinanceFixture>>,
  id: string,
  action = "Dispatch",
) {
  const r = await readFinance(f.processor, id);
  return recordFinanceOutcome(f.processor, id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action,
  });
}

test("B3 native claim lifecycle, exact amounts, independent review/reconciliation and replay", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f);
  assert.equal((await holds(a.id)).length, 0);
  await approveClaim(f, a.id);
  assert.equal((await holds(a.id)).filter((x) => x.state === "Held").length, 2);
  await begin(f, a.id);
  await outcome(f, a.id);
  let r = await readFinance(f.reconciler, a.id);
  assert.equal(r.handoff.status, "ReconciliationRequired");
  assert.equal(r.targets[0].kind, "SyntheticProjectClaim");
  assert.deepEqual(
    (r.targets[0].lines as { amount: string }[]).map((l) => l.amount).sort(),
    ["105.00", "245.00"],
  );
  const rc = {
    ...crmBase(),
    expected_version: r.handoff.version,
    outcome_id: r.outcomes[0].id,
    basis: "SYN independently matched whole entitlements and exact amounts",
  };
  await reconcileFinance(f.reconciler, a.id, rc);
  r = await readFinance(f.reconciler, a.id);
  assert.equal(r.handoff.status, "Reconciled");
  const measures = (await readCommercialFinance(f.preparer, f.project.id))
    .claim_measures!;
  assert.deepEqual(
    measures.by_state.map((x) => [x.status, x.amount]),
    [["Reconciled", "350.00"]],
  );
  assert.equal(measures.billed_value, null);
  assert.equal(measures.allocations[0].state, "Consumed");
  const b = await saveClaim(f, [4]);
  await assert.rejects(
    submitFinance(f.preparer, b.id, {
      ...crmBase(),
      expected_version: b.result.receipt.record_version,
    }),
    code("ClaimEntitlementUnavailable"),
  );
  await migrate();
  await seed();
  await closeDatabase();
  assert.deepEqual(
    (await saveFinance(f.preparer, null, a.cmd)).receipt,
    a.result.receipt,
  );
  assert.deepEqual(
    await readOperation(f.preparer, a.cmd.operation_id),
    a.result.receipt,
  );
  await assert.rejects(
    saveFinance(f.preparer, null, {
      ...a.cmd,
      treatment_basis: "SYN changed replay treatment",
    }),
    code("OperationConflict"),
  );
  assert.equal(
    (await listFinance(f.preparer, { source_kind: "ProjectClaim" })).items
      .length,
    2,
  );
  assert.equal((await listFinance(f.preparer)).items.length, 0);
  await assert.rejects(
    readFinance((await createSession("second-company")).principal, a.id),
  );
});
test("B3 competing submits, Returned hold transfer, omitted release and pre-effect cancellation", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f),
    b = await saveClaim(f, [5]);
  await submitFinance(f.preparer, a.id, {
    ...crmBase(),
    expected_version: a.result.receipt.record_version,
  });
  let r = await readFinance(f.preparer, a.id);
  await reviewFinance(f.reviewer, a.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    source_hash: r.revisions[0].source_hash,
    decision: "Returned",
  });
  await assert.rejects(
    submitFinance(f.preparer, b.id, {
      ...crmBase(),
      expected_version: b.result.receipt.record_version,
    }),
    code("ClaimEntitlementUnavailable"),
  );
  r = await readFinance(f.preparer, a.id);
  const { id: ignored, ...revision } = a.cmd;
  void ignored;
  await saveFinance(f.preparer, a.id, {
    ...revision,
    ...crmBase(),
    expected_version: r.handoff.version,
    completion_versions: [4],
  });
  assert.equal((await holds(a.id)).filter((x) => x.state === "Held").length, 1);
  await submitFinance(f.preparer, b.id, {
    ...crmBase(),
    expected_version: b.result.receipt.record_version,
  });
  r = await readFinance(f.preparer, a.id);
  await cancelFinance(f.preparer, a.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
  });
  const c = await saveClaim(f, [4]),
    d = await saveClaim(f, [4]);
  const results = await Promise.allSettled(
    [c, d].map((x) =>
      submitFinance(f.preparer, x.id, {
        ...crmBase(),
        expected_version: x.result.receipt.record_version,
      }),
    ),
  );
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal((await holds(a.id)).filter((x) => x.state === "Held").length, 0);
});
test("B3 uncertain outcome retains holds and lookup recovers the one target after local failure", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  await approveClaim(f, a.id);
  let r = await begin(f, a.id, "AcceptedThenTimeout");
  const cmd = {
    ...crmBase(),
    expected_version: r.handoff.version,
    attempt_id: r.handoff.active_attempt_id,
    action: "Dispatch",
  };
  await assert.rejects(
    recordFinanceOutcome(f.processor, a.id, cmd, {
      beforeRecord: async () => {
        throw Error("SYN late local failure");
      },
    }),
  );
  assert.equal((await holds(a.id))[0].state, "Held");
  await assert.rejects(
    recordFinanceOutcome(f.processor, a.id, cmd),
    code("OriginalLookupRequired"),
  );
  await assert.rejects(
    cancelFinance(f.preparer, a.id, {
      ...crmBase(),
      expected_version: r.handoff.version,
    }),
    code("FinanceStateChanged"),
  );
  await outcome(f, a.id, "LookupOriginal");
  r = await readFinance(f.processor, a.id);
  assert.equal(r.targets.length, 1);
  assert.equal((await holds(a.id))[0].state, "Consumed");
  assert.equal(
    (
      await database().query(
        "SELECT count(*) FROM ppo.finance_simulator_targets WHERE handoff_id=$1",
        [a.id],
      )
    ).rows[0].count,
    "1",
  );
});
test("B3 source correction holds new authority but preserves recovery; access revocation fails closed", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  await approveClaim(f, a.id);
  await commandClaims(f.owner, f.project.id, {
    ...f.action(5, "RecordEvidence"),
    completion: {
      ...f.completion(0),
      explanation: "SYN corrected recorded completion evidence",
    },
  });
  await assert.rejects(begin(f, a.id), code("ClaimEvidenceChanged"));
  assert.deepEqual(
    (await saveFinance(f.preparer, null, a.cmd)).receipt,
    a.result.receipt,
  );
  assert.equal((await readFinance(f.preparer, a.id)).readiness.ready, false);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='document.read'",
    [f.preparer.actor_id],
  );
  await assert.rejects(readFinance(f.preparer, a.id));
  await assert.rejects(saveFinance(f.preparer, null, a.cmd));
  await assert.rejects(readOperation(f.preparer, a.cmd.operation_id));
  assert.equal(
    (await listFinance(f.preparer, { source_kind: "ProjectClaim" })).items
      .length,
    0,
  );
});
test("B3 SQL refuses forged amount and missing holds; rejected transaction leaves original intact", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  const r = await readFinance(f.preparer, a.id);
  await assert.rejects(
    transaction((c) =>
      c.query(
        `INSERT INTO ppo.finance_lines SELECT (jsonb_populate_record(NULL::ppo.finance_lines,to_jsonb(l)||jsonb_build_object('id',$2::uuid,'claim_amount','0.01'))).* FROM ppo.finance_lines l WHERE revision_id=$1`,
        [r.handoff.current_revision_id, randomUUID()],
      ),
    ),
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.finance_handoffs SET status='ReadyForReview',version=version+1 WHERE id=$1",
        [a.id],
      );
      await c.query(
        "INSERT INTO ppo.finance_events(id,workspace_id,handoff_id,version,status,revision_id,actor_id,kind,reason) VALUES($1,$2,$3,$4,'ReadyForReview',$5,$6,'Submitted','SYN forged missing holds')",
        [
          randomUUID(),
          f.preparer.workspace_id,
          a.id,
          r.handoff.version + 1,
          r.handoff.current_revision_id,
          f.preparer.actor_id,
        ],
      );
    }),
    code("23514"),
  );
  assert.equal((await readFinance(f.preparer, a.id)).handoff.status, "Draft");
});

test("B3 Unknown keeps holds, NotProcessed allows safe cancellation, partial targets cannot reconcile, approved variation is separate", async () => {
  const f = await projectFinanceFixture(),
    a = await saveClaim(f, [4]);
  await approveClaim(f, a.id);
  await begin(f, a.id, "AcceptedThenTimeout");
  await outcome(f, a.id);
  let r = await readFinance(f.processor, a.id);
  assert.equal(r.handoff.status, "OutcomeUnknown");
  assert.equal(r.targets.length, 0);
  assert.equal((await holds(a.id))[0].state, "Held");
  await assert.rejects(outcome(f, a.id), code("OriginalLookupRequired"));
  await outcome(f, a.id, "LookupOriginal");
  const b = await saveClaim(f, [5]);
  await approveClaim(f, b.id);
  await begin(f, b.id, "NotProcessed");
  await outcome(f, b.id);
  r = await readFinance(f.preparer, b.id);
  assert.equal(r.handoff.status, "Approved");
  await cancelFinance(f.preparer, b.id, {
    ...crmBase(),
    expected_version: r.handoff.version,
  });
  const c = await saveClaim(f, [5]);
  await approveClaim(f, c.id);
  await begin(f, c.id, "Partial");
  await outcome(f, c.id);
  r = await readFinance(f.reconciler, c.id);
  await assert.rejects(
    reconcileFinance(f.reconciler, c.id, {
      ...crmBase(),
      expected_version: r.handoff.version,
      outcome_id: r.outcomes[0].id,
      basis: "SYN comparison finds a partial target",
    }),
    code("TargetDifference"),
  );
  assert.equal((await holds(c.id))[0].state, "Consumed");
  const v = variation(f.commercial, "12.34", "12.34");
  await commandCommercial(f.owner, f.project.id, v);
  await commandCommercial(
    f.owner,
    f.project.id,
    commercialAction(v.id, 1, "Submit"),
  );
  await commandCommercial(
    (await createSession("estimating-source-reviewer")).principal,
    f.project.id,
    { ...commercialAction(v.id, 2, "Decide"), outcome: "Approved" },
  );
  await commandClaims(f.owner, f.project.id, {
    ...f.action(5, "RecordEvidence"),
    completion: {
      ...f.completion(0),
      kind: "Variation",
      target_id: v.id,
      target_version: 3,
    },
  });
  const d = await saveClaim(f, [6]);
  await approveClaim(f, d.id);
  await begin(f, d.id);
  await outcome(f, d.id);
  r = await readFinance(f.reconciler, d.id);
  assert.equal(r.lines[0].claim_kind, "Variation");
  assert.equal(r.lines[0].claim_amount, "12.34");
  await assert.rejects(
    database().query(
      "UPDATE ppo.finance_allocation_holds SET state='Released' WHERE handoff_id=$1",
      [d.id],
    ),
  );
});
