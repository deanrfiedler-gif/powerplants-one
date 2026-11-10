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
import { saveFinance, cancelFinance } from "../../src/finance/service";
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
