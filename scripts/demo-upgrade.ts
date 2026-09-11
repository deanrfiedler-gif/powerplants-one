import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { transaction } from "../src/platform/database";
import { migrationFiles, seedFiles, latestMigrationVersion, demoMigrationFiles, latestDemoMigrationVersion, existingDemoChecksumMatches } from "./migration-registry";
import { demoWorkspace, demoCompany, grantRuntimePrivileges } from "./demo-runtime";

const additions = ["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert",
  "project.read", "project.create", "project.edit", "email.connect"];
const gmailTables = ["ppo.mail_connections", "ppo.provider_messages", "ppo.mail_message_links", "ppo.mail_sync_checkpoints"];
const read = (file: string) => readFile(new URL(`../db/${file}`, import.meta.url), "utf8");
const hash = (sql: string) => createHash("sha256").update(sql).digest("hex");

// Retained for existing callers; the shared implementation lives with the registry.
export { existingDemoChecksumMatches } from "./migration-registry";

// A deliberately bounded existing-demo upgrade, not a second bootstrap path.
// Every database change shares one transaction, including grants and receipts.
export async function upgradeExistingDemo(databaseName: string, tenant: string, apply: boolean) {
  console.log("Demo upgrade stage: load-release");
  if (latestMigrationVersion !== 19 || latestDemoMigrationVersion !== 2) throw Error("Review the existing-demo upgrade for this release.");
  const migrations = await Promise.all(migrationFiles.map(async file => ({
    version: Number(file.slice(0, 4)), sql: await read(`migrations/${file}`),
  })));
  const demoMigrations = await Promise.all(demoMigrationFiles.map(async file => ({
    version: Number(file.slice(0, 4)), sql: await read(`demo/${file}`),
  })));
  console.log("Demo upgrade stage: connect");
  await transaction(async db => {
    console.log("Demo upgrade stage: validate-target");
    if (!apply) await db.query("SET TRANSACTION READ ONLY");
    await db.query("SELECT pg_advisory_xact_lock(10001)");
    const role = `${databaseName}_app`;
    if ((await db.query("SELECT current_database() AS name")).rows[0].name !== databaseName ||
        !(await db.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
      throw Error("The existing database and runtime role must match.");
    console.log("Demo upgrade stage: migration-history");
    const installed = await db.query("SELECT version,sha256 FROM public.ppo_migrations ORDER BY version");
    if (installed.rows.some(row => !migrations.some(m => m.version === row.version)))
      throw Error("Unknown migration history; preserve and review this database.");
    for (const m of migrations) {
      const prior = installed.rows.find(row => row.version === m.version);
      if (prior ? !existingDemoChecksumMatches(m.sql, prior.sha256, m.version <= 17) : m.version <= 17 || !apply) {
        const stored = prior ? (/^[a-f0-9]{64}$/.test(prior.sha256) ? prior.sha256 : "invalid") : "missing";
        console.error(`Demo migration mismatch: version=${m.version} expected=${hash(m.sql)} stored=${stored}`);
        throw Error("Missing baseline or incompatible migration; preserve and review this database.");
      }
    }
    console.log("Demo upgrade stage: identity-history");
    const identities = await db.query("SELECT version,sha256 FROM public.ppo_demo_migrations ORDER BY version");
    if (identities.rows.some(row => !demoMigrations.some(m => m.version === row.version)))
      throw Error("Unknown hosted migration history; preserve and review this database.");
    for (const m of demoMigrations) {
      const prior = identities.rows.find(row => row.version === m.version);
      // Version 1 is the issued baseline and must already be recorded; later hosted
      // migrations may legitimately be pending, but only an explicit apply installs them.
      if (prior) {
        if (!existingDemoChecksumMatches(m.sql, prior.sha256, m.version === 1))
          throw Error("Existing hosted identity migration must match.");
        continue;
      }
      if (m.version === 1) throw Error("Existing hosted identity migration must match.");
      if (!apply) throw Error("Pending hosted migration; use the explicit upgrade-and-deploy operation.");
    }
    console.log("Demo upgrade stage: seed-history");
    const receipts = await db.query("SELECT version FROM ppo.seed_receipts");
    if (receipts.rows.some(row => !seedFiles.some(([version]) => version === row.version)) ||
        receipts.rows.some(row => !installed.rows.some(m => m.version === row.version)) ||
        seedFiles.some(([version]) => (version <= 17 || !apply) && !receipts.rows.some(row => row.version === version)))
      throw Error("Missing baseline or unknown seed receipts; preserve this database.");
    if (apply) {
      for (const m of migrations.filter(m => !installed.rows.some(row => row.version === m.version))) {
        console.log(`Demo upgrade stage: apply-migration-${m.version}`);
        await db.query(m.sql);
        await db.query("INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)", [m.version, hash(m.sql)]);
      }
      // Only the two additive fixture-grant seeds; never replay old fixture data.
      for (const [version, file] of seedFiles.filter(([v]) => v > 17)) {
        if (receipts.rows.some(row => row.version === version)) continue;
        console.log(`Demo upgrade stage: apply-seed-${version}`);
        await db.query(await read(file));
        await db.query("INSERT INTO ppo.seed_receipts(version) VALUES($1)", [version]);
      }
      // Hosted-only schema before the grants below, so new tables are covered by them.
      for (const m of demoMigrations.filter(m => !identities.rows.some(row => row.version === m.version))) {
        console.log(`Demo upgrade stage: apply-hosted-migration-${m.version}`);
        await db.query(m.sql);
        await db.query("INSERT INTO public.ppo_demo_migrations(version,sha256) VALUES($1,$2)", [m.version, hash(m.sql)]);
      }
      console.log("Demo upgrade stage: runtime-grants");
      await grantRuntimePrivileges(db, databaseName, role);
    }
    console.log("Demo upgrade stage: tester-capabilities");
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
    console.log("Demo upgrade stage: verify-privileges");
    for (const table of ["ppo.lead_candidates", "ppo.projects", ...gmailTables]) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const access = await db.query("SELECT has_table_privilege($1,$2,$3) AS allowed", [role, table, privilege]);
        if (!access.rows[0].allowed) throw Error("Runtime role needs the explicit database upgrade.");
      }
    }
    // Exercise the restricted role: the upgrade must not make identity writable.
    const identityAccess = await db.query("SELECT has_table_privilege($1,'ppo.demo_testers','UPDATE') AS allowed", [role]);
    if (identityAccess.rows[0].allowed) throw Error("Runtime role has unexpected identity privileges.");
    console.log("Demo upgrade stage: exercise-runtime-role");
    await db.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
    await db.query("SELECT id FROM ppo.lead_candidates LIMIT 0");
    await db.query("SELECT id FROM ppo.projects LIMIT 0");
    await db.query("SELECT id FROM ppo.mail_connections LIMIT 0");
    await db.query("SELECT id FROM ppo.provider_messages LIMIT 0");
    console.log("Demo upgrade stage: commit");
  });
}
