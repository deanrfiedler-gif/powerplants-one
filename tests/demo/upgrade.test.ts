import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrateDemo, demoWorkspace, demoCompany, grantRuntimePrivileges } from "../../scripts/demo-database";
import { upgradeExistingDemo } from "../../scripts/demo-upgrade";
import { seedTesterMailbox } from "../../scripts/demo-mailbox";
import { createInvitedSession } from "../../src/platform/demo-auth";
import { readInvitedSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { readOpportunity } from "../../src/crm/reads";
import { crmCreate } from "../helpers/crm";

const name = localConfig().database_name;
if (name !== "ppo_synthetic_test") throw Error("Disposable local test database required.");
const role = `${name}_app`, tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const objects = Array.from({ length: 4 }, () => randomUUID());
let users: string[];

beforeEach(async () => {
  const db = database();
  await db.query("DROP SCHEMA IF EXISTS ppo CASCADE");
  await db.query("DROP TABLE IF EXISTS public.ppo_migrations,public.ppo_demo_migrations");
  await migrate(17); await seed(17); await migrateDemo();
  if (!(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
    await db.query(`CREATE ROLE ${role}`);
  await transaction(c => grantRuntimePrivileges(c, name, role));
  users = [];
  for (let i = 0; i < objects.length; i++) {
    const user = randomUUID(); users.push(user);
    await db.query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active) VALUES($1,$2,'PPO-EntraDemo',$3,'SYN Upgrade tester',$4)",
      [user, demoWorkspace, `${tenant}/${objects[i]}`, i !== 3]);
    await db.query("INSERT INTO ppo.demo_testers VALUES($1,$2,$3,$4,$5,clock_timestamp()+$6::interval)",
      [tenant, objects[i], demoWorkspace, user, i !== 1, i === 2 ? "-1 day" : "2 days"]);
    for (const cap of ["shared.read", "shared.internal.read", "activity.read", "activity.edit", "crm.opportunity.read", "crm.opportunity.create", "crm.opportunity.edit"])
      await db.query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,scope_id,capability,valid_to) VALUES($1,$2,$3,$3,$4,clock_timestamp()+interval '1 day')",
        [demoWorkspace, user, demoCompany, cap]);
    await transaction(c => seedTesterMailbox(c, demoWorkspace, demoCompany, user));
  }
});
after(async () => {
  await database().query(`DROP OWNED BY ${role}`);
  await database().query(`DROP ROLE ${role}`);
  // The following demo-browser job uses this disposable database too.
  // Restore the current schema after the deliberately rolled-back upgrade case.
  await migrate(); await seed();
  await closeDatabase();
});

const rows = async (table: string) => (await database().query(`SELECT row_to_json(t) AS row FROM ${table} t ORDER BY row_to_json(t)::text`)).rows;
const ledger = () => rows("public.ppo_migrations");

test("upgrade preserves saved CRM, mailbox, sessions, old grants and invitation limits; retry is idempotent", async () => {
  const token = await transaction(c => createInvitedSession(c, tenant, objects[0]));
  const actor = await readInvitedSession(database(), token, tenant);
  const proposal = crmCreate(); proposal.owner_id = actor.actor_id; proposal.initial_action.owner_id = actor.actor_id;
  await createOpportunity(actor, proposal);
  const saved = await readOpportunity(actor, proposal.id);
  const tables = ["ppo.opportunities", "ppo.users", "ppo.demo_testers", "ppo.sessions", "ppo.email_messages"];
  const before = await Promise.all(tables.map(rows)), oldGrants = await rows("ppo.permission_grants"), oldLedger = await ledger();
  await assert.rejects(upgradeExistingDemo(name, tenant, false), /Missing baseline/);
  assert.deepEqual(await ledger(), oldLedger);
  await upgradeExistingDemo(name, tenant, true);
  assert.deepEqual(await Promise.all(tables.map(rows)), before);
  const reloaded = await readOpportunity(actor, proposal.id);
  assert.deepEqual({ ...reloaded, observed_at: null }, { ...saved, observed_at: null });
  assert.equal((await readInvitedSession(database(), token, tenant)).actor_id, actor.actor_id);
  const grants = await rows("ppo.permission_grants");
  for (const old of oldGrants) assert.ok(grants.some(g => JSON.stringify(g) === JSON.stringify(old)));
  const additions = (await database().query("SELECT * FROM ppo.permission_grants WHERE user_id=ANY($1::uuid[]) AND (capability LIKE 'crm.lead.%' OR capability LIKE 'project.%')", [users])).rows;
  assert.equal(additions.length, 7);
  assert.ok(additions.every(g => g.user_id === users[0] && g.company_id === demoCompany && g.scope_type === "Company" && g.scope_id === demoCompany));
  const limit = (await database().query("SELECT valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.edit'", [users[0]])).rows[0].valid_to;
  assert.ok(additions.every(g => g.valid_to.getTime() <= limit.getTime()));
  // An explicit later revocation must survive both verify and upgrade retries.
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.edit'", [users[0]]);
  const retained = await rows("ppo.permission_grants"), migrated = await ledger(), receipts = await rows("ppo.seed_receipts");
  await upgradeExistingDemo(name, tenant, false);
  await upgradeExistingDemo(name, tenant, true);
  assert.deepEqual(await rows("ppo.permission_grants"), retained);
  assert.deepEqual(await ledger(), migrated);
  assert.deepEqual(await rows("ppo.seed_receipts"), receipts);
});

test("an old conflicting Gantt-18 ledger is refused before any migrations, seeds or grants change", async () => {
  await database().query("INSERT INTO public.ppo_migrations(version,sha256) VALUES(18,$1)", ["b".repeat(64)]);
  const before = await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]);
  await assert.rejects(upgradeExistingDemo(name, tenant, true), /incompatible migration/);
  assert.deepEqual(await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]), before);
  assert.equal((await database().query("SELECT to_regclass('ppo.leads') AS relation")).rows[0].relation, null);
});

test("a late privilege failure rolls back schema, seed receipts and grant additions together", async () => {
  // Superuser is deliberately invalid for the hosted runtime role.
  await database().query(`ALTER ROLE ${role} SUPERUSER`);
  const before = await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]);
  try {
    await assert.rejects(upgradeExistingDemo(name, tenant, true), /unexpected identity privileges/);
    assert.deepEqual(await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]), before);
    assert.equal((await database().query("SELECT to_regclass('ppo.projects') AS relation")).rows[0].relation, null);
  } finally { await database().query(`ALTER ROLE ${role} NOSUPERUSER`); }
});
