import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { agreementCommand } from "../../src/maintenance/agreements";
import {
  saveFinance,
  cancelFinance,
  submitFinance,
  recordFinanceOutcome,
} from "../../src/finance/service";
import { listFinance } from "../../src/finance/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  agreementChargeFixture,
  saveAgreementClaim,
  submitAgreementClaim,
  reviewAgreementClaim,
  beginAgreementClaim,
  outcomeAgreementClaim,
  reconcileAgreementClaim,
  readFinance,
  base,
  principal,
} from "../helpers/agreement-charge-finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...names: string[]) =>
  (e: unknown) =>
    names.includes((e as { code: string }).code);
const holds = async (id: string) =>
  (
    await database().query(
      "SELECT state,agreement_revision_id,agreement_charge_id FROM ppo.finance_allocation_holds WHERE handoff_id=$1 ORDER BY created_at,line_id",
      [id],
    )
  ).rows;

for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
  test(`C1 late ${table} failure rolls back whole-charge reservation and permits exact retry`, async () => {
    const f = await agreementChargeFixture(),
      a = await saveAgreementClaim(f),
      before = await readFinance(f.preparer, a.id),
      cmd = { ...base(), expected_version: before.handoff.version };
    const snapshot = async () => {
      const result: Record<string, unknown> = {};
      for (const name of [
        "finance_handoffs",
        "finance_revisions",
        "finance_lines",
        "finance_allocation_holds",
        "finance_events",
        "audit_events",
        "operation_receipts",
        "outbox_jobs",
      ])
        result[name] = (
          await database().query(
            `SELECT to_jsonb(x) AS row FROM ppo.${name} x ORDER BY to_jsonb(x)::text`,
          )
        ).rows;
      return result;
    };
    const original = await snapshot();
    await database().query(
      `CREATE FUNCTION ppo.fail_c1() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN C1 late failure'; END $$;
       CREATE TRIGGER c1_fail BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.fail_c1()`,
    );
    try {
      await assert.rejects(
        submitFinance(f.preparer, a.id, cmd),
        /SYN C1 late failure/,
      );
    } finally {
      await database().query(
        `DROP TRIGGER c1_fail ON ppo.${table}; DROP FUNCTION ppo.fail_c1()`,
      );
    }
    assert.deepEqual(await snapshot(), original);
    const accepted = await submitFinance(f.preparer, a.id, cmd);
    assert.deepEqual(
      (await submitFinance(f.preparer, a.id, cmd)).receipt,
      accepted.receipt,
    );
    assert.equal(
      (await readFinance(f.preparer, a.id)).handoff.status,
      "ReadyForReview",
    );
    assert.deepEqual(
      (await holds(a.id)).map((h) => h.state),
      ["Held"],
    );
  });

test("C1 accepted target survives local outcome rollback and is recovered only by original lookup", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id);
  const before = await readFinance(f.processor, a.id),
    cmd = {
      ...base(),
      expected_version: before.handoff.version,
      attempt_id: before.handoff.active_attempt_id,
      action: "Dispatch",
    };
  await assert.rejects(
    recordFinanceOutcome(f.processor, a.id, cmd, {
      beforeRecord: async () => {
        throw Error("SYN C1 outcome persistence failure");
      },
    }),
    /SYN C1 outcome persistence failure/,
  );
  const failed = await readFinance(f.processor, a.id);
  assert.equal(failed.outcomes.length, 0);
  // The normal read exposes targets only through a recorded outcome. Inspect the
  // independently committed simulator here to prove the accepted effect survived.
  assert.equal(failed.targets.length, 0);
  const targets = (
    await database().query(
      "SELECT * FROM ppo.finance_simulator_targets WHERE handoff_id=$1",
      [a.id],
    )
  ).rows;
  assert.equal(targets.length, 1);
  assert.equal(targets[0].lines[0].amount, "4800.00");
  assert.deepEqual(
    (await holds(a.id)).map((h) => h.state),
    ["Held"],
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int n FROM ppo.operation_receipts WHERE operation_id=$1",
        [cmd.operation_id],
      )
    ).rows[0].n,
    0,
  );
  await assert.rejects(
    recordFinanceOutcome(f.processor, a.id, { ...cmd, ...base() }),
    code("OriginalLookupRequired"),
  );
  await outcomeAgreementClaim(f, a.id, "LookupOriginal");
  await reconcileAgreementClaim(f, a.id);
  const recovered = await readFinance(f.reconciler, a.id);
  assert.equal(recovered.reconciliations[0].result, "Matched");
  assert.equal(recovered.targets.length, 1);
  assert.equal(recovered.attempts.length, 1);
  assert.deepEqual(
    (await holds(a.id)).map((h) => h.state),
    ["Consumed"],
  );
});

test("C1 exact scheduled fee uses the existing review, unknown-result and historical reconciliation pipeline once", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    b = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  await assert.rejects(
    submitAgreementClaim(f, b.id),
    code("ClaimEntitlementUnavailable"),
  );
  await reviewAgreementClaim(f, a.id, "Returned");
  assert.equal((await holds(a.id))[0].state, "Held");
  await assert.rejects(
    submitAgreementClaim(f, b.id),
    code("ClaimEntitlementUnavailable"),
  );
  const returned = await readFinance(f.preparer, a.id);
  const { id: ignored, ...cmd } = a.cmd;
  void ignored;
  await saveFinance(f.preparer, a.id, {
    ...cmd,
    ...base(),
    expected_version: returned.handoff.version,
  });
  assert.deepEqual(
    (await holds(a.id)).map((h) => h.state),
    ["Released", "Held"],
  );
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id, "AcceptedThenTimeout");
  await outcomeAgreementClaim(f, a.id);
  let r = await readFinance(f.preparer, a.id);
  assert.equal(r.handoff.status, "OutcomeUnknown");
  await assert.rejects(
    cancelFinance(f.preparer, a.id, {
      ...base(),
      expected_version: r.handoff.version,
    }),
    code("ProcessingEvidenceLocked", "FinanceStateChanged"),
  );
  const row = (
    await database().query(
      "SELECT version FROM ppo.service_agreements WHERE id=$1",
      [f.id],
    )
  ).rows[0];
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: row.version,
    action: "Withdraw",
    authority_reference:
      "SYN subsequent withdrawal retains historical fee evidence",
  });
  await assert.rejects(
    saveFinance(f.preparer, null, f.draft([f.second])),
    code("AgreementSourceChanged"),
  );
  await outcomeAgreementClaim(f, a.id, "LookupOriginal");
  await reconcileAgreementClaim(f, a.id);
  r = await readFinance(f.reconciler, a.id);
  assert.equal(r.handoff.status, "Reconciled");
  assert.equal(r.reconciliations[0].result, "Matched");
  assert.equal(r.targets.length, 1);
  assert.equal(r.targets[0].kind, "SyntheticAgreementCharge");
  assert.equal(r.targets[0].lines[0].amount, "4800.00");
  assert.equal(r.targets[0].lines[0].currency, "AUD");
  assert.equal(
    r.targets[0].lines[0].tax_basis,
    f.content.charge_schedule.tax_basis,
  );
  assert.equal((await holds(a.id)).at(-1).state, "Consumed");
  const replay = await saveFinance(f.preparer, null, a.cmd);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, a.result.receipt);
  assert.deepEqual(
    await readOperation(f.preparer, a.cmd.operation_id),
    a.result.receipt,
  );
  assert.equal((await readFinance(f.preparer, a.id)).attempts.length, 1);
  assert.equal(
    (await listFinance(f.preparer, { source_kind: "AgreementCharge" })).items
      .length,
    2,
  );
});

test("C1 whole charges race once; reasoned cancellation releases and no ProjectClaim identity is allocated", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    b = await saveAgreementClaim(f);
  const outcomes = await Promise.allSettled([
    submitAgreementClaim(f, a.id),
    submitAgreementClaim(f, b.id),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  const winner = outcomes[0].status === "fulfilled" ? a : b,
    loser = winner === a ? b : a;
  const r = await readFinance(f.preparer, winner.id);
  await cancelFinance(f.preparer, winner.id, {
    ...base(),
    expected_version: r.handoff.version,
  });
  assert.equal((await holds(winner.id))[0].state, "Released");
  await submitAgreementClaim(f, loser.id);
  const rows = (
    await database().query(
      "SELECT claim_basis_id,claim_kind,claim_target_id,root_entry_id FROM ppo.finance_allocation_holds WHERE handoff_id=$1",
      [loser.id],
    )
  ).rows;
  assert.deepEqual(rows, [
    {
      claim_basis_id: null,
      claim_kind: null,
      claim_target_id: null,
      root_entry_id: null,
    },
  ]);
  await assert.rejects(
    saveFinance(f.preparer, null, { ...f.draft(), amount: "1.00" }),
    code("InvalidData"),
  );
});

test("C1 requires exact independently approved, current and due agreement charge authority", async () => {
  const f = await agreementChargeFixture("2027-01-01", false);
  await assert.rejects(
    saveFinance(f.preparer, null, f.draft()),
    code("AgreementApprovalRequired"),
  );
  // Even with both duties explicitly granted in this fixture, the author cannot approve the fee.
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
 SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability IN ('maintenance.agreement.approve','finance.review')`,
    [f.owner.actor_id, f.reviewer.actor_id],
  );
  await assert.rejects(
    agreementCommand(f.owner, f.id, {
      ...base(),
      expected_version: 1,
      action: "Approve",
      authority_reference: "SYN attempted author approval",
    }),
    code("InvalidData"),
  );
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: 1,
    action: "Approve",
    authority_reference: "SYN exact independent Finance approval",
  });
  await assert.rejects(
    saveFinance(f.preparer, null, f.draft()),
    code("AgreementChargeNotDue"),
  );
  const a = await saveAgreementClaim(f, [f.second]);
  await agreementCommand(f.owner, f.id, {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content: { ...f.content, title: "SYN explicitly revised agreement" },
  });
  await assert.rejects(
    submitAgreementClaim(f, a.id),
    code("AgreementSourceChanged"),
  );
  assert.deepEqual(await holds(a.id), []);
  assert.equal(
    (
      (await readFinance(f.preparer, a.id)).revisions[0].source_snapshot as {
        agreement_charge: { revision_id: string };
      }
    ).agreement_charge.revision_id,
    f.revision,
  );
  const g = await agreementChargeFixture();
  await assert.rejects(
    saveFinance(g.preparer, null, {
      ...g.draft(),
      agreement_revision_id: f.revision,
      charge_ids: [f.second],
    }),
    code("RecordUnavailable"),
  );
});

test("C1 SQL guards retain exact source amount, disjoint identities and immutable schedule evidence", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    r = await readFinance(f.preparer, a.id);
  await assert.rejects(
    database().query(
      "UPDATE ppo.agreement_charge_lines SET amount=1 WHERE revision_id=$1",
      [f.revision],
    ),
    code("55000"),
  );
  const line = r.lines[0];
  for (const mutation of [
    { claim_amount: "1.00" },
    { agreement_charge_id: f.second },
    { claim_kind: "Milestone", claim_target_id: randomUUID() },
  ]) {
    await assert.rejects(
      transaction(async (c) => {
        const clone = { ...line, ...mutation, id: randomUUID() };
        delete clone.reserved_quantity;
        const columns = Object.keys(clone);
        await c.query(
          `INSERT INTO ppo.finance_lines(${columns.join(",")}) VALUES(${columns.map((_, i) => `$${i + 1}`).join(",")})`,
          Object.values(clone),
        );
      }),
      code("23514", "23505"),
    );
  }
  await assert.rejects(
    saveFinance(f.preparer, null, {
      ...f.draft(),
      charge_ids: [f.first, f.first],
    }),
    code("InvalidData"),
  );
});

test("C1 source grants govern reads, queues and original-operation receipts after revocation", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  for (const name of [
    "second-company",
    "other-workspace",
    "assigned-technician",
  ]) {
    const p = await principal(name);
    await assert.rejects(
      readFinance(p, a.id),
      code("Forbidden", "RecordUnavailable"),
    );
  }
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='maintenance.read'",
    [f.preparer.actor_id],
  );
  await assert.rejects(
    readFinance(f.preparer, a.id),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    saveFinance(f.preparer, null, a.cmd),
    code("Forbidden", "RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(f.preparer, a.cmd.operation_id),
    code("Forbidden", "RecordUnavailable"),
  );
  assert.equal(
    (await listFinance(f.preparer, { source_kind: "AgreementCharge" })).items
      .length,
    0,
  );
});

async function successor(
  f: Awaited<ReturnType<typeof agreementChargeFixture>>,
  content = f.content,
) {
  const row = (
    await database().query("SELECT * FROM ppo.service_agreements WHERE id=$1", [
      f.id,
    ])
  ).rows[0];
  const revised = await agreementCommand(f.owner, f.id, {
    ...base(),
    expected_version: row.version,
    action: "Revise",
    content,
  });
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: revised.receipt.record_version,
    action: "Approve",
    authority_reference: "SYN independent successor approval",
  });
  return (
    await database().query(
      "SELECT current_revision_id FROM ppo.service_agreements WHERE id=$1",
      [f.id],
    )
  ).rows[0].current_revision_id as string;
}

for (const scenario of ["Accepted", "AcceptedThenTimeout"])
  test(`C1-1 ${scenario} charge stays reserved across title-only successors and original recovery`, async () => {
    const f = await agreementChargeFixture(),
      a = await saveAgreementClaim(f);
    await submitAgreementClaim(f, a.id);
    await reviewAgreementClaim(f, a.id);
    await beginAgreementClaim(f, a.id, scenario);
    await outcomeAgreementClaim(f, a.id);
    if (scenario === "Accepted") await reconcileAgreementClaim(f, a.id);
    const before = await readFinance(f.preparer, a.id);
    const revision = await successor(f, {
      ...f.content,
      title: "SYN title-only amendment",
    });
    const cmd = { ...f.draft(), agreement_revision_id: revision };
    await saveFinance(f.preparer, null, cmd);
    await assert.rejects(
      submitAgreementClaim(f, cmd.id),
      code("ClaimEntitlementUnavailable"),
    );
    const retained = await readFinance(f.preparer, a.id);
    for (const key of ["handoff", "revisions", "lines", "targets"] as const)
      assert.deepEqual(retained[key], before[key]);
    const duplicate = await readFinance(f.preparer, cmd.id);
    await assert.rejects(
      database().query(
        `INSERT INTO ppo.finance_allocation_holds(workspace_id,handoff_id,revision_id,line_id,agreement_revision_id,agreement_charge_id,quantity,state)
     VALUES($1,$2,$3,$4,$5,$6,1,'Held')`,
        [
          f.preparer.workspace_id,
          cmd.id,
          duplicate.handoff.current_revision_id,
          duplicate.lines[0].id,
          revision,
          f.first,
        ],
      ),
      /already held or consumed across revisions/,
    );
    if (scenario === "AcceptedThenTimeout") {
      await outcomeAgreementClaim(f, a.id, "LookupOriginal");
      await reconcileAgreementClaim(f, a.id);
    }
    assert.equal(
      (await readFinance(f.reconciler, a.id)).handoff.status,
      "Reconciled",
    );
    assert.equal(
      (
        await database().query(
          "SELECT count(*) n FROM ppo.finance_simulator_targets WHERE kind='SyntheticAgreementCharge'",
        )
      ).rows[0].n,
      "1",
    );
    assert.deepEqual(
      (await holds(a.id)).map((x) => x.state),
      ["Consumed"],
    );
    assert.deepEqual(
      (await saveFinance(f.preparer, null, a.cmd)).receipt,
      a.result.receipt,
    );
  });

test("C1-1 held and consumed charge terms cannot change or disappear; refused revisions leave no effects", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  const snapshot = async () =>
    Object.fromEntries(
      await Promise.all(
        [
          "service_agreements",
          "agreement_revisions",
          "agreement_charge_lines",
          "maintenance_events",
          "audit_events",
          "operation_receipts",
          "outbox_jobs",
        ].map(async (t) => [
          t,
          (
            await database().query(
              `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
            )
          ).rows,
        ]),
      ),
    );
  for (const consumed of [false, true]) {
    if (consumed) {
      await reviewAgreementClaim(f, a.id);
      await beginAgreementClaim(f, a.id);
      await outcomeAgreementClaim(f, a.id);
      await reconcileAgreementClaim(f, a.id);
    }
    const before = await snapshot(),
      row = (
        await database().query(
          "SELECT * FROM ppo.service_agreements WHERE id=$1",
          [f.id],
        )
      ).rows[0];
    for (const schedule of [
      {
        ...f.content.charge_schedule,
        lines: f.content.charge_schedule.lines.map((x) =>
          x.id === f.first ? { ...x, amount: "4800.01" } : x,
        ),
      },
      {
        ...f.content.charge_schedule,
        lines: f.content.charge_schedule.lines.map((x) =>
          x.id === f.first ? { ...x, due_date: "2026-02-01" } : x,
        ),
      },
      {
        ...f.content.charge_schedule,
        lines: f.content.charge_schedule.lines.filter((x) => x.id !== f.first),
      },
      { ...f.content.charge_schedule, tax_basis: "SYN changed tax basis" },
    ]) {
      const content = { ...f.content, charge_schedule: schedule };
      await assert.rejects(
        agreementCommand(f.owner, f.id, {
          ...base(),
          expected_version: row.version,
          action: "Revise",
          content,
        }),
        code("AgreementChargeReserved"),
      );
      await assert.rejects(
        database().query(
          `INSERT INTO ppo.agreement_revisions(id,workspace_id,company_id,agreement_id,revision,predecessor_id,content,content_hash,created_by,reason)
    SELECT $1,workspace_id,company_id,agreement_id,revision+1,id,$2,content_hash,created_by,'SYN direct SQL challenge' FROM ppo.agreement_revisions WHERE id=$3`,
          [randomUUID(), content, f.revision],
        ),
        /Held or consumed agreement charge terms must be retained/,
      );
      assert.deepEqual(await snapshot(), before);
    }
  }
});

test("C1-1 Returned claim transfers a stable hold to a successor without releasing it to a competitor", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f, [f.first, f.second]);
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id, "Returned");
  const revision = await successor(f, {
    ...f.content,
    title: "SYN successor preserves charges",
  });
  const before = await readFinance(f.preparer, a.id),
    competitor = { ...f.draft(), agreement_revision_id: revision };
  await saveFinance(f.preparer, null, competitor);
  const { id: omittedId, ...originalCommand } = a.cmd;
  void omittedId;
  const revise = {
    ...originalCommand,
    ...base(),
    expected_version: before.handoff.version,
    agreement_revision_id: revision,
    charge_ids: [f.first],
  };
  const results = await Promise.allSettled([
    saveFinance(f.preparer, a.id, revise),
    submitAgreementClaim(f, competitor.id),
  ]);
  if (results[0].status === "rejected") throw results[0].reason;
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  if (results[1].status === "rejected")
    assert.equal(results[1].reason.code, "ClaimEntitlementUnavailable");
  assert.deepEqual(
    (await holds(a.id)).filter((x) => x.state === "Held"),
    [
      {
        state: "Held",
        agreement_revision_id: revision,
        agreement_charge_id: f.first,
      },
    ],
  );
  assert.equal(
    (await holds(a.id)).filter((x) => x.state === "Released").length,
    2,
  );
  await submitAgreementClaim(f, a.id);
  const omitted = { ...f.draft([f.second]), agreement_revision_id: revision };
  await saveFinance(f.preparer, null, omitted);
  await submitAgreementClaim(f, omitted.id);
});

test("C1-1 SQL races across two source revisions conserve one agreement charge", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    revision = await successor(f);
  const cmd = { ...f.draft(), agreement_revision_id: revision };
  await saveFinance(f.preparer, null, cmd);
  const records = await Promise.all(
    [a.id, cmd.id].map((id) => readFinance(f.preparer, id)),
  );
  const results = await Promise.allSettled(
    records.map((r) =>
      database().query(
        `INSERT INTO ppo.finance_allocation_holds(workspace_id,handoff_id,revision_id,line_id,agreement_revision_id,agreement_charge_id,quantity,state)
   VALUES($1,$2,$3,$4,$5,$6,1,'Held')`,
        [
          f.preparer.workspace_id,
          r.handoff.id,
          r.handoff.current_revision_id,
          r.lines[0].id,
          r.lines[0].agreement_revision_id,
          f.first,
        ],
      ),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const failure = results.find((r) => r.status === "rejected");
  assert.ok(failure && failure.status === "rejected");
  assert.match(
    failure.reason.message,
    /already held or consumed across revisions/,
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.finance_allocation_holds WHERE agreement_charge_id=$1 AND state<>'Released'",
        [f.first],
      )
    ).rows[0].n,
    "1",
  );
});

test("C1-1 an older repeatable-read snapshot cannot reserve a charge across revisions", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f),
    revision = await successor(f);
  const cmd = { ...f.draft(), agreement_revision_id: revision };
  await saveFinance(f.preparer, null, cmd);
  const records = await Promise.all(
    [a.id, cmd.id].map((id) => readFinance(f.preparer, id)),
  );
  const workspace = (
    await database().query(
      "SELECT to_jsonb(w) row FROM ppo.workspaces w WHERE id=$1",
      [f.preparer.workspace_id],
    )
  ).rows;
  const first = await database().connect(),
    second = await database().connect();
  const sql = `INSERT INTO ppo.finance_allocation_holds(workspace_id,handoff_id,revision_id,line_id,agreement_revision_id,agreement_charge_id,quantity,state) VALUES($1,$2,$3,$4,$5,$6,1,'Held')`;
  const values = (r: (typeof records)[number]) => [
    f.preparer.workspace_id,
    r.handoff.id,
    r.handoff.current_revision_id,
    r.lines[0].id,
    r.lines[0].agreement_revision_id,
    f.first,
  ];
  try {
    await first.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    await second.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    // Both snapshots predate the first reservation; a row lock alone cannot refresh them.
    await first.query("SELECT count(*) FROM ppo.finance_allocation_holds");
    await second.query("SELECT count(*) FROM ppo.finance_allocation_holds");
    await first.query(sql, values(records[0]));
    await first.query("COMMIT");
    await assert.rejects(second.query(sql, values(records[1])), code("40001"));
  } finally {
    await first.query("ROLLBACK");
    await second.query("ROLLBACK");
    first.release();
    second.release();
  }
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.finance_allocation_holds WHERE agreement_charge_id=$1 AND state<>'Released'",
        [f.first],
      )
    ).rows[0].n,
    "1",
  );
  assert.deepEqual(
    (
      await database().query(
        "SELECT to_jsonb(w) row FROM ppo.workspaces w WHERE id=$1",
        [f.preparer.workspace_id],
      )
    ).rows,
    workspace,
  );
});
