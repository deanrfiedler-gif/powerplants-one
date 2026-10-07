import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeEach, after, test } from "node:test";
import { reset, migrate, seed } from "../../scripts/database";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  createLead,
  changeLead,
  planLeadAction,
  convertLead,
} from "../../src/crm/leads/service";
import {
  resolveLeadContext,
  transferLeadOwner,
  leadTransferOptions,
} from "../../src/crm/leads/amendments";
import { readLead } from "../../src/crm/leads/reads";
import { readActivity, activityCommand } from "../../src/activities/activities";
import { readOperation } from "../../src/shared/receipts";
import { leadCreate, leadConvert } from "../helpers/leads";
import { CRM, crmBase, crmAction } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (e: unknown) =>
  (e as { code: string }).code === value;
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const resolveInput = (version: number) => ({
  ...crmBase(),
  expected_version: version,
  organisation_id: CRM.org,
  site_id: CRM.site,
  primary_person_id: CRM.person,
});
async function fixture() {
  const p = (await createSession("coordinator")).principal;
  const input = {
    ...leadCreate(),
    organisation_id: null,
    site_id: null,
    primary_person_id: null,
  };
  await createLead(p, input);
  const action = crmAction();
  await planLeadAction(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: action,
  });
  return { p, input, action };
}
async function snapshot() {
  return Promise.all(
    [
      "lead_candidates",
      "lead_events",
      "lead_context_resolutions",
      "lead_owner_transfers",
      "activity_links",
      "activities",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ].map((t) =>
      rows(
        `SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
      ),
    ),
  );
}
async function receiver() {
  const p = (await createSession("crm-receiver")).principal;
  // Explicit synthetic proof fixture; this migration adds no runtime grants.
  await database().query(
    "INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,company_id,site_id,scope_type,scope_id,valid_from) SELECT gen_random_uuid(),workspace_id,$2,capability,company_id,site_id,scope_type,scope_id,valid_from FROM ppo.permission_grants g WHERE user_id=$1 AND capability IN ('crm.lead.read','crm.lead.edit') AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants x WHERE x.user_id=$2 AND x.capability=g.capability AND x.scope_type=g.scope_type AND x.scope_id IS NOT DISTINCT FROM g.scope_id)",
    [CRM.owner, p.actor_id],
  );
  return p;
}
test("LC-12 resolution retains capture and actions, fences current context, and recovers exact originals", async () => {
  const f = await fixture(),
    command = resolveInput(2),
    before = await readActivity(f.p, f.action.id);
  const [one, two] = await Promise.all([
    resolveLeadContext(f.p, f.input.id, command),
    resolveLeadContext(f.p, f.input.id, command),
  ]);
  assert.deepEqual(one.receipt, two.receipt);
  assert.deepEqual(await readOperation(f.p, command.operation_id), one.receipt);
  const lead = await readLead(f.p, f.input.id);
  assert.equal(lead.organisation_id, null);
  assert.equal(lead.site_id, null);
  assert.equal(lead.primary_person_id, null);
  assert.equal(lead.resolution?.state, "Available");
  if (lead.resolution?.state === "Available")
    assert.equal(lead.resolution.site_id, CRM.site);
  assert.deepEqual(await readActivity(f.p, f.action.id), before);
  await assert.rejects(
    resolveLeadContext(f.p, f.input.id, {
      ...command,
      reason: "SYN changed intent",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    resolveLeadContext(f.p, f.input.id, {
      ...command,
      operation_id: randomUUID(),
    }),
    code("VersionConflict"),
  );
  const correction = { ...resolveInput(3), site_id: null };
  await resolveLeadContext(f.p, f.input.id, correction);
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.lead_context_resolutions WHERE lead_id=$1",
        [f.input.id],
      )
    ).length,
    2,
  );
  await assert.rejects(
    convertLead(f.p, f.input.id, {
      ...leadConvert(4),
      site_id: null,
      site_unknown_reason: "SYN site not confirmed",
      primary_person_id: null,
      contact_unknown_reason: "SYN not selected",
    }),
    code("LEAD_SOURCE_CONTEXT"),
  );
  await convertLead(f.p, f.input.id, {
    ...leadConvert(4, f.action.id),
    site_id: null,
    site_unknown_reason: "SYN site not confirmed",
  });
  assert.deepEqual(await readOperation(f.p, command.operation_id), one.receipt);
});
test("LC-12 transfers preserve independent obligations; former owner may recover originals but cannot mutate", async () => {
  const f = await fixture(),
    recipient = await receiver(),
    resolution = resolveInput(2);
  const original = await resolveLeadContext(f.p, f.input.id, resolution);
  const options = await leadTransferOptions(f.p, f.input.id);
  assert.ok(options.items.some((u) => u.id === recipient.actor_id));
  const command = {
    ...crmBase(),
    expected_version: 3,
    new_owner_id: recipient.actor_id,
    expected_activity_versions: [{ id: f.action.id, version: 1 }],
  };
  const before = await readActivity(f.p, f.action.id);
  const [first, retry] = await Promise.all([
    transferLeadOwner(f.p, f.input.id, command),
    transferLeadOwner(f.p, f.input.id, command),
  ]);
  assert.deepEqual(first.receipt, retry.receipt);
  assert.equal(
    (await readLead(recipient, f.input.id)).owner_id,
    recipient.actor_id,
  );
  const history=(await readLead(recipient,f.input.id)).ownership_history;
  assert.equal(history.length,1);
  assert.equal(history[0].from_owner_name,f.p.display_name);
  assert.equal(history[0].to_owner_name,recipient.display_name);
  assert.deepEqual(await readActivity(f.p, f.action.id), before);
  assert.deepEqual(
    await readOperation(f.p, command.operation_id),
    first.receipt,
  );
  assert.deepEqual(
    (await resolveLeadContext(f.p, f.input.id, resolution)).receipt,
    original.receipt,
  );
  await assert.rejects(
    changeLead(f.p, f.input.id, {
      ...crmBase(),
      expected_version: 4,
      action: "note",
      note: "SYN former owner new intent",
    }),
    code("LEAD_OWNER_REQUIRED"),
  );
  await assert.rejects(
    transferLeadOwner(f.p, f.input.id, {
      ...command,
      operation_id: randomUUID(),
      expected_version: 4,
    }),
    code("LEAD_OWNER_REQUIRED"),
  );
  await changeLead(recipient, f.input.id, {
    ...crmBase(),
    expected_version: 4,
    action: "note",
    note: "SYN new accountable owner",
  });
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='crm.lead.edit'",
    [f.p.actor_id],
  );
  await assert.rejects(readOperation(f.p, command.operation_id));
});
test("LC-12 stale activities, hidden recipients and invalid customer context leave no partial effects", async () => {
  const f = await fixture(),
    recipient = await receiver(),
    before = await snapshot();
  const command = {
    ...crmBase(),
    expected_version: 2,
    new_owner_id: recipient.actor_id,
    expected_activity_versions: [{ id: f.action.id, version: 1 }],
  };
  for (const expected_activity_versions of [
    [],
    [{ id: randomUUID(), version: 1 }],
    [{ id: f.action.id, version: 2 }],
  ]) {
    await assert.rejects(
      transferLeadOwner(f.p, f.input.id, {
        ...command,
        expected_activity_versions,
      }),
      code("LeadActivityComparisonConflict"),
    );
    assert.deepEqual(await snapshot(), before);
  }
  await assert.rejects(
    resolveLeadContext(f.p, f.input.id, {
      ...resolveInput(2),
      organisation_id: CRM.orgB,
    }),
  );
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [recipient.actor_id],
  );
  assert.ok(
    !(await leadTransferOptions(f.p, f.input.id)).items.some(
      (u) => u.id === recipient.actor_id,
    ),
  );
  await assert.rejects(transferLeadOwner(f.p, f.input.id, command));
  assert.deepEqual(await snapshot(), before);
  await activityCommand(
    f.p,
    f.action.id,
    { ...crmBase(), expected_version: 1, outcome: "SYN customer called" },
    "complete",
  );
  await assert.rejects(
    transferLeadOwner(f.p, f.input.id, command),
    code("LeadActivityComparisonConflict"),
  );
});
test("LC-12 immutable companions and late failures preserve exact state", async () => {
  const f = await fixture(),
    before = await snapshot(),
    command = resolveInput(2);
  await database().query(
    "CREATE FUNCTION ppo.fail_amendment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='LeadChanged' THEN RAISE EXCEPTION 'SYN late failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_amendment BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.fail_amendment()",
  );
  await assert.rejects(resolveLeadContext(f.p, f.input.id, command));
  assert.deepEqual(await snapshot(), before);
  await database().query(
    "DROP TRIGGER fail_amendment ON ppo.outbox_jobs; DROP FUNCTION ppo.fail_amendment()",
  );
  await resolveLeadContext(f.p, f.input.id, command);
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.lead_context_resolutions WHERE lead_id=$1",
      [f.input.id],
    ),
  );
  const recipient = await receiver();
  await assert.rejects(
    transaction(async (c) => {
      await c.query(
        "UPDATE ppo.lead_candidates SET owner_id=$2,version=version+1,updated_by=$3 WHERE id=$1",
        [f.input.id, recipient.actor_id, f.p.actor_id],
      );
      await c.query("SET CONSTRAINTS ALL IMMEDIATE");
    }),
    code("23514"),
  );
});
test("LC-12 creation recovery preserves the separate creator and eligible Lead owner duties", async () => {
  const p = (await createSession("coordinator")).principal,
    recipient = await receiver();
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='crm.lead.edit'",
    [p.actor_id],
  );
  const input = { ...leadCreate(), owner_id: recipient.actor_id };
  const first = await createLead(p, input);
  assert.deepEqual((await createLead(p, input)).receipt, first.receipt);
  assert.deepEqual(await readOperation(p, input.operation_id), first.receipt);
  assert.equal(
    (await readLead(recipient, input.id)).owner_id,
    recipient.actor_id,
  );
});

test("LC-12 populated previous-version upgrade preserves all Lead originals and permission grants", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(72);
  await seed(72);
  const f = await fixture();
  const tables = [
    "lead_candidates",
    "lead_events",
    "activities",
    "activity_links",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
  ];
  const retained = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          `SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
        ),
      ),
    );
  const before = await retained(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(await retained(), before);
  const afterLedger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(afterLedger.slice(0, -1), ledger);
  assert.equal(afterLedger.at(-1)?.version, 73);
  await resolveLeadContext(f.p, f.input.id, resolveInput(2));
  assert.deepEqual(
    (await createLead(f.p, f.input)).receipt,
    await readOperation(f.p, f.input.operation_id),
  );
});
