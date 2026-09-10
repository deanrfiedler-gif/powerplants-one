import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import pg from "pg";
import { migrate, seed } from "./database";
import { transaction, closeDatabase } from "../src/platform/database";
import { seedTesterMailbox } from "./demo-mailbox";
import { demoConfig } from "../src/platform/demo-config";

export const demoWorkspace = "10000000-0000-4000-8000-000000000001";
export const demoCompany = "20000000-0000-4000-8000-000000000001";
export const demoCapabilities = ["shared.read", "shared.internal.read", "activity.read", "activity.edit",
  "crm.opportunity.read", "crm.opportunity.create", "crm.opportunity.edit",
  "crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert", "estimating.read", "estimating.edit",
  "estimating.quote.read", "estimating.quote.prepare", "email.read", "email.edit",
  "project.read", "project.create", "project.edit"] as const;

export function testerInput(value: unknown, now = Date.now()) {
  if (!Array.isArray(value) || value.length > 5) throw Error("Provide zero to five invited tester entries.");
  const ids = new Set<string>();
  return value.map((v: { object_id?: unknown; expires_at?: unknown }, i) => {
    if (!v || typeof v !== "object" || Object.keys(v).some(k => !["object_id", "expires_at"].includes(k)) ||
        typeof v.object_id !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v.object_id) ||
        typeof v.expires_at !== "string" || !v.expires_at.endsWith("Z") ||
        !Number.isFinite(Date.parse(v.expires_at)) || Date.parse(v.expires_at) <= now || Date.parse(v.expires_at) > now + 14 * 86400000)
      throw Error(`Tester ${i + 1} needs an Entra object ID and a UTC expiry within fourteen days.`);
    const object_id = v.object_id.toLowerCase();
    if (ids.has(object_id)) throw Error("Tester identities must be distinct.");
    ids.add(object_id);
    return { object_id, expires_at: v.expires_at };
  });
}

export async function migrateDemo() {
  const sql = await readFile(new URL("../db/demo/0001-identity.sql", import.meta.url), "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");
  await transaction(async c => {
    await c.query("SELECT pg_advisory_xact_lock(10001)");
    await c.query("CREATE TABLE IF NOT EXISTS public.ppo_demo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL)");
    const prior = await c.query("SELECT sha256 FROM public.ppo_demo_migrations WHERE version=1");
    if (prior.rows[0]) {
      if (prior.rows[0].sha256 !== hash) throw Error("Demo migration checksum mismatch.");
      return;
    }
    await c.query(sql);
    await c.query("INSERT INTO public.ppo_demo_migrations VALUES(1,$1)", [hash]);
  });
}

export async function reconcileTesters(tenant: string, entries: ReturnType<typeof testerInput>) {
  await transaction(async c => {
    await c.query("SELECT pg_advisory_xact_lock(10001)");
    // Removed entries lose existing sessions immediately; retained actor IDs stay stable.
    await c.query("UPDATE ppo.demo_testers SET enabled=false WHERE tenant_id=$1", [tenant]);
    await c.query("UPDATE ppo.users u SET active=false FROM ppo.demo_testers t WHERE (u.workspace_id,u.id)=(t.workspace_id,t.user_id) AND t.tenant_id=$1", [tenant]);
    for (const e of entries) {
      const subject = `${tenant}/${e.object_id}`;
      const user = await c.query(
        `INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-EntraDemo',$3,'SYN Demo tester')
         ON CONFLICT(issuer,subject_id) DO UPDATE SET active=true RETURNING id`, [randomUUID(), demoWorkspace, subject]);
      const id = user.rows[0].id;
      await c.query("UPDATE ppo.users SET display_name=$2 WHERE id=$1", [id, `SYN Demo tester ${id.slice(0, 6)}`]);
      await c.query(`INSERT INTO ppo.demo_testers VALUES($1,$2,$3,$4,true,$5)
        ON CONFLICT(tenant_id,object_id) DO UPDATE SET enabled=true,expires_at=excluded.expires_at`,
        [tenant, e.object_id, demoWorkspace, id, e.expires_at]);
      // Exactly the bounded Company A grant set, never a copy of Coordinator's broad privileges.
      await c.query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2", [demoWorkspace, id]);
      for (const capability of demoCapabilities) await c.query(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_id,valid_to) VALUES($1,$2,$3,$4,$3,$5)",
        [demoWorkspace, id, demoCompany, capability, e.expires_at]);
      await seedTesterMailbox(c, demoWorkspace, demoCompany, id);
    }
    await c.query("DELETE FROM ppo.sessions s USING ppo.demo_testers t WHERE (s.workspace_id,s.actor_id)=(t.workspace_id,t.user_id) AND (NOT t.enabled OR t.expires_at<=clock_timestamp())");
  });
}

async function runtimeRole() {
  const c = demoConfig(), role = `${c.database_name}_app`, password = process.env.PPO_DEMO_APP_PASSWORD;
  if (!password || password.length < 32) throw Error("Set a strong, private runtime database password.");
  await transaction(async db => {
    if (!(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
      await db.query(`CREATE ROLE ${pg.escapeIdentifier(role)} LOGIN PASSWORD ${pg.escapeLiteral(password)}`);
    // Existing password is retained. Rotation is an explicit operator action.
    await grantRuntimePrivileges(db, c.database_name, role);
  });
}

export async function grantRuntimePrivileges(db: pg.PoolClient, databaseName: string, role: string) {
  const name = pg.escapeIdentifier(role);
  await db.query(`REVOKE ALL ON DATABASE ${pg.escapeIdentifier(databaseName)} FROM PUBLIC`);
  await db.query(`GRANT CONNECT ON DATABASE ${pg.escapeIdentifier(databaseName)} TO ${name}`);
  await db.query(`GRANT USAGE ON SCHEMA ppo TO ${name}`);
  await db.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ppo TO ${name}`);
  await db.query(`GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA ppo TO ${name}`);
  await db.query(`REVOKE INSERT,UPDATE,DELETE ON ppo.users,ppo.permission_grants,ppo.demo_testers,ppo.seed_receipts FROM ${name}`);
  await db.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const c = demoConfig(), command = process.argv[2];
    if (command === "setup") {
      const testers = testerInput(JSON.parse(process.env.PPO_DEMO_TESTERS ?? ""));
      await migrate(); await seed(); await migrateDemo(); await runtimeRole();
      await reconcileTesters(c.tenant_id, testers);
    }
    else if (command === "testers") await reconcileTesters(c.tenant_id, testerInput(JSON.parse(process.env.PPO_DEMO_TESTERS ?? "")));
    else throw Error("Use setup or testers. Reset requires a new database/storage epoch.");
    console.log("Demo database operation completed.");
  } catch { console.error("Demo database operation failed; no credentials or SQL printed. Check the operator configuration and retained database state."); process.exitCode = 1; }
  finally { await closeDatabase(); }
}
