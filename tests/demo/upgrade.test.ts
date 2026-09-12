import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrateDemo, demoWorkspace, demoCompany, grantRuntimePrivileges } from "../../scripts/demo-database";
import { upgradeExistingDemo } from "../../scripts/demo-upgrade";
import { migrationFiles } from "../../scripts/migration-registry";
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
  await db.query(await readFile(new URL("../../db/migrations/0001-recover.sql", import.meta.url), "utf8"));
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
  if ((await database().query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
    await database().query(`DROP OWNED BY ${role}`);
    await database().query(`DROP ROLE ${role}`);
  }
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
  const additions = (await database().query("SELECT * FROM ppo.permission_grants WHERE user_id=ANY($1::uuid[]) AND (capability LIKE 'crm.lead.%' OR capability LIKE 'project.%' OR capability LIKE 'engineering.%' OR capability='email.connect')", [users])).rows;
  assert.equal(additions.length, 11);
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

test("a baseline executed from Windows CRLF SQL upgrades without rewriting historical checksums", async () => {
  const db = database();
  const readWindows = async (file: string) => (await readFile(new URL(`../../db/${file}`, import.meta.url), "utf8"))
    .replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
  const digest = (sql: string) => createHash("sha256").update(sql).digest("hex");
  await db.query(await readFile(new URL("../../db/migrations/0001-recover.sql", import.meta.url), "utf8"));
  await db.query("DROP TABLE public.ppo_migrations,public.ppo_demo_migrations");
  await db.query("CREATE TABLE public.ppo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT clock_timestamp())");
  for (const file of migrationFiles.filter(file => Number(file.slice(0, 4)) <= 17)) {
    const sql = await readWindows(`migrations/${file}`);
    await db.query(sql);
    await db.query("INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)", [Number(file.slice(0, 4)), digest(sql)]);
  }
  await seed(17);
  const identity = await readWindows("demo/0001-identity.sql");
  await db.query(identity);
  await db.query("CREATE TABLE public.ppo_demo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL)");
  await db.query("INSERT INTO public.ppo_demo_migrations VALUES(1,$1)", [digest(identity)]);
  await transaction(c => grantRuntimePrivileges(c, name, role));
  const baseline = await ledger(), identities = await rows("public.ppo_demo_migrations");
  await upgradeExistingDemo(name, tenant, true);
  await upgradeExistingDemo(name, tenant, false);
  await upgradeExistingDemo(name, tenant, true);
  const final = await ledger();
  assert.deepEqual(final.filter(r => r.row.version <= 17), baseline);
  // The hosted track now carries 0002 (Gmail connection): the CRLF identity
  // baseline row must survive with its original checksum, and version 2 must be
  // recorded once with the LF digest of its source.
  const demoLedger = await rows("public.ppo_demo_migrations");
  assert.deepEqual(demoLedger.filter(r => r.row.version === 1), identities);
  assert.deepEqual(demoLedger.map(r => r.row.version).sort(), [1, 2]);
  assert.equal(
    demoLedger.find(r => r.row.version === 2)?.row.sha256,
    digest(await readFile(new URL("../../db/demo/0002-gmail-connection.sql", import.meta.url), "utf8")),
  );
  assert.equal(final.length, baseline.length + 3);
  assert.ok((await db.query("SELECT to_regclass('ppo.projects') AS relation")).rows[0].relation);
});

test("an old conflicting Gantt-18 ledger is refused before any migrations, seeds or grants change", async () => {
  await database().query("INSERT INTO public.ppo_migrations(version,sha256) VALUES(18,$1)", ["b".repeat(64)]);
  const before = await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]);
  await assert.rejects(upgradeExistingDemo(name, tenant, true), /incompatible migration/);
  assert.deepEqual(await Promise.all([ledger(), rows("ppo.seed_receipts"), rows("ppo.permission_grants")]), before);
  assert.equal((await database().query("SELECT to_regclass('ppo.lead_candidates') AS relation")).rows[0].relation, null);
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
