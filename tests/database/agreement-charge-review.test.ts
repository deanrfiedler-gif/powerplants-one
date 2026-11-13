import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { agreementCommand } from "../../src/maintenance/agreements";
import { hash } from "../../src/maintenance/context";
import { agreementFields as formFields } from "../../src/components/maintenance-forms";
import {
  agreementChargeFixture,
  saveAgreementClaim,
  submitAgreementClaim,
  reviewAgreementClaim,
  beginAgreementClaim,
  outcomeAgreementClaim,
  reconcileAgreementClaim,
  base,
} from "../helpers/agreement-charge-finance";
assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function snapshot() {
  const result: Record<string, unknown> = {};
  for (const t of [
    "service_agreements",
    "agreement_revisions",
    "agreement_charge_lines",
    "maintenance_events",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ])
    result[t] = (
      await database().query(
        `SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`,
      )
    ).rows;
  return result;
}

test("C1-2 UI-shaped omissions cannot remove unreserved or Held schedules and leave no effects", async () => {
  const f = await agreementChargeFixture();
  const content = Object.fromEntries(
    formFields.map(({ key }) => [
      key,
      f.content[key as keyof typeof f.content],
    ]),
  );
  assert.equal(Object.hasOwn(content, "charge_schedule"), false);
  const command = {
    ...base(),
    expected_version: 2,
    action: "Revise",
    content: { ...content, title: "SYN ordinary form amendment" },
  };
  let before = await snapshot();
  await assert.rejects(
    agreementCommand(f.owner, f.id, command),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
  const claim = await saveAgreementClaim(f);
  await submitAgreementClaim(f, claim.id);
  before = await snapshot();
  await assert.rejects(
    agreementCommand(f.owner, f.id, { ...command, ...base() }),
    code("AgreementChargeReserved"),
  );
  assert.deepEqual(await snapshot(), before);
  const explicit = {
    ...command,
    ...base(),
    content: { ...f.content, title: "SYN explicit retained schedule" },
  };
  const revised = await agreementCommand(f.owner, f.id, explicit);
  assert.deepEqual(
    (await agreementCommand(f.owner, f.id, explicit)).receipt,
    revised.receipt,
  );
});

test("C1-2 legacy omission chains retain independent Finance approval and original charged-site duties", async () => {
  const f = await agreementChargeFixture();
  const { charge_schedule: omitted, ...content } = f.content;
  void omitted;
  let predecessor = f.revision;
  // Reconstruct two successors persisted by the old omission behavior. No hold
  // exists. This is explicit historical SQL setup, not a new command bypass.
  for (const revision of [2, 3]) {
    const id = randomUUID();
    await database().query(
      `INSERT INTO ppo.agreement_revisions(id,workspace_id,company_id,agreement_id,revision,predecessor_id,content,content_hash,created_by,reason)
      SELECT $1,workspace_id,company_id,agreement_id,$2,id,$3,$4,created_by,'SYN legacy omitted schedule' FROM ppo.agreement_revisions WHERE id=$5`,
      [id, revision, content, hash(content), predecessor],
    );
    await database().query(
      `INSERT INTO ppo.agreement_scope(workspace_id,company_id,revision_id,site_id,mode)
      SELECT workspace_id,company_id,$1,site_id,mode FROM ppo.agreement_scope WHERE revision_id=$2`,
      [id, predecessor],
    );
    predecessor = id;
  }
  await database().query(
    "UPDATE ppo.service_agreements SET current_revision_id=$2,revision=3,version=4,state='Proposed' WHERE id=$1",
    [f.id, predecessor],
  );
  await database().query(
    `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id)
    SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability IN ('maintenance.agreement.approve','finance.review') ON CONFLICT DO NOTHING`,
    [f.owner.actor_id, f.reviewer.actor_id],
  );
  const cmd = {
    ...base(),
    expected_version: 4,
    action: "Approve",
    authority_reference: "SYN legacy successor review",
  };
  let before = await snapshot();
  await assert.rejects(
    agreementCommand(f.owner, f.id, cmd),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='finance.review'",
    [f.reviewer.actor_id],
  );
  before = await snapshot();
  await assert.rejects(
    agreementCommand(f.reviewer, f.id, { ...cmd, ...base() }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=NULL WHERE user_id=$1 AND capability='finance.review'",
    [f.reviewer.actor_id],
  );
  const accepted = await agreementCommand(f.reviewer, f.id, cmd);
  assert.deepEqual(
    (await agreementCommand(f.reviewer, f.id, cmd)).receipt,
    accepted.receipt,
  );
});

test("C1-3 consumed-charge renewal keeps its original start, exact charge and a new UUID for the new fee", async () => {
  const f = await agreementChargeFixture(),
    a = await saveAgreementClaim(f);
  await submitAgreementClaim(f, a.id);
  await reviewAgreementClaim(f, a.id);
  await beginAgreementClaim(f, a.id);
  await outcomeAgreementClaim(f, a.id);
  await reconcileAgreementClaim(f, a.id);
  const renewalYear = Number(f.content.effective_to.slice(0, 4)) + 1;
  const newCharge = {
    id: randomUUID(),
    due_date: `${renewalYear}-01-01`,
    amount: "4900.00",
  };
  const content = {
    ...f.content,
    effective_from: `${renewalYear}-01-01`,
    effective_to: `${renewalYear}-12-31`,
    charge_schedule: {
      ...f.content.charge_schedule,
      lines: [...f.content.charge_schedule.lines, newCharge],
    },
  };
  const cmd = { ...base(), expected_version: 2, action: "Revise", content };
  const before = await snapshot();
  await assert.rejects(
    agreementCommand(f.owner, f.id, cmd),
    code("InvalidData"),
  );
  await assert.rejects(
    agreementCommand(f.owner, f.id, {
      ...cmd,
      ...base(),
      content: {
        ...content,
        charge_schedule: { ...content.charge_schedule, lines: [newCharge] },
      },
    }),
    code("AgreementChargeReserved"),
  );
  assert.deepEqual(await snapshot(), before);
  const accepted = await agreementCommand(f.owner, f.id, {
    ...cmd,
    ...base(),
    content: { ...content, effective_from: f.content.effective_from },
  });
  await agreementCommand(f.reviewer, f.id, {
    ...base(),
    expected_version: accepted.receipt.record_version,
    action: "Approve",
    authority_reference: "SYN exact retained-start extension",
  });
  const holds = (
    await database().query(
      "SELECT state,agreement_charge_id FROM ppo.finance_allocation_holds WHERE handoff_id=$1",
      [a.id],
    )
  ).rows;
  assert.deepEqual(holds, [
    { state: "Consumed", agreement_charge_id: f.first },
  ]);
  assert.equal(
    (
      await database().query(
        "SELECT count(*) n FROM ppo.finance_simulator_targets WHERE kind='SyntheticAgreementCharge'",
      )
    ).rows[0].n,
    "1",
  );
});
