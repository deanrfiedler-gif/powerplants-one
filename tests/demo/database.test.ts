import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, readInvitedSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { migrateDemo, reconcileTesters, demoCapabilities } from "../../scripts/demo-database";
import { hasPermission } from "../../src/platform/permissions";
import { createOpportunity } from "../../src/crm/opportunities";
import { readOpportunity } from "../../src/crm/reads";
import { crmCreate, CRM } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable local test database required.");
const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", first = randomUUID(), second = randomUUID();
const expires_at = new Date(Date.now() + 86400000).toISOString();
before(async () => {
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset(); await migrateDemo(); await migrateDemo();
  await reconcileTesters(tenant, [{ object_id: first, expires_at }, { object_id: second, expires_at }]);
});
after(closeDatabase);

test("hosted identity mapping, persisted CRM and immediate removal stay scoped", async () => {
  const db = database();
  const users = await db.query("SELECT t.object_id,u.id,u.workspace_id,u.display_name FROM ppo.demo_testers t JOIN ppo.users u ON u.id=t.user_id ORDER BY t.object_id");
  assert.equal(users.rowCount, 2);
  assert.notEqual(users.rows[0].id, users.rows[1].id);
  assert.ok(users.rows.every(u => u.id !== CRM.owner));
  const u = users.rows.find(u => u.object_id === first)!;
  const token = randomBytes(32).toString("hex"), hash = createHash("sha256").update(token).digest("hex");
  await db.query("INSERT INTO ppo.sessions VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')", [hash, u.workspace_id, u.id]);
  const p = await readInvitedSession(db, token, tenant);
  assert.equal(p.actor_id, u.id);
  for (const cap of demoCapabilities) assert.equal(await hasPermission(db, p, cap, CRM.company), true);
  for (const cap of ["finance.read", "service.scope.authorise", "pack.issue"] as const)
    assert.equal(await hasPermission(db, p, cap, CRM.company), false);
  assert.equal(await hasPermission(db, p, "shared.read", CRM.companyB), false);
  const proposal = crmCreate();
  proposal.owner_id = p.actor_id;
  proposal.initial_action.owner_id = p.actor_id;
  await createOpportunity(p, proposal);
  assert.equal((await readOpportunity(p, proposal.id)).owner_id, p.actor_id);
  await closeDatabase();
  assert.equal((await readOpportunity(p, proposal.id)).title, proposal.title);
  const local = await createSession("coordinator");
  await assert.rejects(readInvitedSession(database(), local.token, tenant));
  await assert.rejects(readInvitedSession(database(), token, randomUUID()));
  await database().query("UPDATE ppo.demo_testers SET expires_at=clock_timestamp()-interval '1 second' WHERE object_id=$1", [first]);
  await assert.rejects(readInvitedSession(database(), token, tenant));
  await reconcileTesters(tenant, [{ object_id: first, expires_at }, { object_id: second, expires_at }]);
  assert.equal((await readInvitedSession(database(), token, tenant)).actor_id, p.actor_id);
  await reconcileTesters(tenant, [{ object_id: second, expires_at }]);
  await assert.rejects(readInvitedSession(database(), token, tenant));
  assert.equal((await database().query("SELECT 1 FROM ppo.sessions WHERE token_hash=$1", [hash])).rowCount, 0);
  assert.equal((await database().query("SELECT owner_id FROM ppo.opportunities WHERE id=$1", [proposal.id])).rows[0].owner_id, p.actor_id);
});
