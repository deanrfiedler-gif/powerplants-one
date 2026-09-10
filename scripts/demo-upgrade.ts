import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { transaction } from "../src/platform/database";
import { migrationFiles, seedFiles, latestMigrationVersion } from "./migration-registry";
import { demoWorkspace, demoCompany, grantRuntimePrivileges } from "./demo-database";

const additions = ["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert",
  "project.read", "project.create", "project.edit"];
const read = (file: string) => readFile(new URL(`../db/${file}`, import.meta.url), "utf8");
const hash = (sql: string) => createHash("sha256").update(sql).digest("hex");

// A deliberately bounded existing-demo upgrade, not a second bootstrap path.
// Every database change shares one transaction, including grants and receipts.
export async function upgradeExistingDemo(databaseName: string, tenant: string, apply: boolean) {
  if (latestMigrationVersion !== 19) throw Error("Review the existing-demo upgrade for this release.");
  const migrations = await Promise.all(migrationFiles.map(async file => ({
    version: Number(file.slice(0, 4)), sql: await read(`migrations/${file}`),
  })));
  const identityHash = hash(await read("demo/0001-identity.sql"));
  await transaction(async db => {
    await db.query("SELECT pg_advisory_xact_lock(10001)");
    const role = `${databaseName}_app`;
    if ((await db.query("SELECT current_database() AS name")).rows[0].name !== databaseName ||
        !(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
      throw Error("The existing database and runtime role must match.");
    const installed = await db.query("SELECT version,sha256 FROM public.ppo_migrations ORDER BY version");
    if (installed.rows.some(row => !migrations.some(m => m.version === row.version)))
      throw Error("Unknown migration history; preserve and review this database.");
    for (const m of migrations) {
      const prior = installed.rows.find(row => row.version === m.version);
      if (prior ? prior.sha256 !== hash(m.sql) : m.version <= 17 || !apply)
        throw Error("Missing baseline or incompatible migration; preserve and review this database.");
    }
    const identities = await db.query("SELECT version,sha256 FROM public.ppo_demo_migrations");
    if (identities.rowCount !== 1 || identities.rows[0].version !== 1 || identities.rows[0].sha256 !== identityHash)
      throw Error("Existing hosted identity migration must match.");
    const receipts = await db.query("SELECT version FROM ppo.seed_receipts");
    if (receipts.rows.some(row => !seedFiles.some(([version]) => version === row.version)) ||
        receipts.rows.some(row => !installed.rows.some(m => m.version === row.version)) ||
        seedFiles.some(([version]) => (version <= 17 || !apply) && !receipts.rows.some(row => row.version === version)))
      throw Error("Missing baseline or unknown seed receipts; preserve this database.");
    if (apply) {
      for (const m of migrations.filter(m => !installed.rows.some(row => row.version === m.version))) {
        await db.query(m.sql);
        await db.query("INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)", [m.version, hash(m.sql)]);
      }
      // Only the two additive fixture-grant seeds; never replay old fixture data.
      for (const [version, file] of seedFiles.filter(([v]) => v > 17)) {
        if (receipts.rows.some(row => row.version === version)) continue;
        await db.query(await read(file));
        await db.query("INSERT INTO ppo.seed_receipts(version) VALUES($1)", [version]);
      }
      await grantRuntimePrivileges(db, databaseName, role);
    }
    const missing = await db.query(`
      SELECT t.user_id,cap,least(t.expires_at,g.valid_to,r.valid_to) AS expires_at
      FROM ppo.demo_testers t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
      JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(t.workspace_id,t.user_id)
        AND g.capability='crm.opportunity.edit' AND g.company_id=$2 AND g.scope_type='Company' AND g.scope_id=$2
      JOIN ppo.permission_grants r ON (r.workspace_id,r.user_id)=(t.workspace_id,t.user_id)
        AND r.capability='shared.internal.read' AND r.company_id=$2 AND r.scope_type='Company' AND r.scope_id=$2
      CROSS JOIN unnest($4::text[]) AS cap
      WHERE t.workspace_id=$1 AND t.tenant_id=$3 AND t.enabled AND u.active
        AND u.issuer='PPO-EntraDemo' AND u.subject_id=t.tenant_id::text||'/'||t.object_id::text
        AND t.expires_at>clock_timestamp() AND g.valid_from<=clock_timestamp() AND r.valid_from<=clock_timestamp()
        AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp())
        AND NOT EXISTS(SELECT 1 FROM ppo.permission_grants old WHERE old.workspace_id=t.workspace_id
          AND old.user_id=t.user_id AND old.capability=cap AND old.scope_type='Company' AND old.scope_id=$2)`,
    [demoWorkspace, demoCompany, tenant, additions]);
    if (!apply && missing.rowCount) throw Error("Existing testers need the explicit upgrade-and-deploy operation.");
    for (const row of missing.rows) await db.query(`
      INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_id,valid_from,valid_to)
      VALUES($1,$2,$3,$4,$3,clock_timestamp(),$5) ON CONFLICT DO NOTHING`,
    [demoWorkspace, row.user_id, demoCompany, row.cap, row.expires_at]);
    for (const table of ["ppo.leads", "ppo.projects"]) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const access = await db.query("SELECT has_table_privilege($1,$2,$3) AS allowed", [role, table, privilege]);
        if (!access.rows[0].allowed) throw Error("Runtime role needs the explicit database upgrade.");
      }
    }
    // Exercise the restricted role: the upgrade must not make identity writable.
    const identityAccess = await db.query("SELECT has_table_privilege($1,'ppo.demo_testers','UPDATE') AS allowed", [role]);
    if (identityAccess.rows[0].allowed) throw Error("Runtime role has unexpected identity privileges.");
    await db.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
    await db.query("SELECT id FROM ppo.leads LIMIT 0");
    await db.query("SELECT id FROM ppo.projects LIMIT 0");
  });
}
