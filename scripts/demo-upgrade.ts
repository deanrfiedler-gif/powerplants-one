import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { transaction } from "../src/platform/database";
import { migrationFiles, seedFiles, latestMigrationVersion, demoMigrationFiles, latestDemoMigrationVersion, existingDemoChecksumMatches } from "./migration-registry";
import { demoWorkspace, demoCompany, grantRuntimePrivileges } from "./demo-runtime";
import { ensurePackReviewer } from "./demo-reviewer";

const additions = ["crm.lead.read", "crm.lead.create", "crm.lead.edit", "crm.lead.convert",
  "project.read", "project.create", "project.edit", "engineering.read", "engineering.create", "engineering.edit",
  "email.connect", "schedule.read", "service.work_order.read", "service.ticket.read", "service.work_order.edit",
  "service.readiness.assess", "schedule.contact", "schedule.manage"];
const gmailTables = ["ppo.mail_connections", "ppo.provider_messages", "ppo.mail_message_links", "ppo.mail_sync_checkpoints"];
const read = (file: string) => readFile(new URL(`../db/${file}`, import.meta.url), "utf8");
const hash = (sql: string) => createHash("sha256").update(sql).digest("hex");

// Retained for existing callers; the shared implementation lives with the registry.
export { existingDemoChecksumMatches } from "./migration-registry";

// A deliberately bounded existing-demo upgrade, not a second bootstrap path.
// Every database change shares one transaction, including grants and receipts.
export async function upgradeExistingDemo(databaseName: string, tenant: string, apply: boolean) {
  // Reviewed for 0031 (EN-08 commissioning basis and as-built release): twenty-four new ppo.inspection_* and
  // ppo.commissioning_* tables with their guard functions. Four shared CHECK constraints are widened by the 0020
  // OR-append idiom and identity_has_typed_record() is extended in place, inside the AGENTS.md SET CONSTRAINTS pair, so
  // no existing row is rewritten and no value accepted before is refused. The new tables take ordinary privileges from
  // the generic table grant below. Seed 31 runs here because it is above 17: it inserts one PPO-LocalSynthetic user
  // that the hosted sign-in can never select, copies Company A read grants to it from the synthetic coordinator where
  // that identity exists, grants one commissioning duty each and My Work activity.read/edit to existing fictional
  // profiles only, and adds one fictional policy row and four fictional calibration records whose actor list is plain
  // JSON, so a missing fixture identity cannot fail it. It rewrites nothing. No capability is added to `additions`:
  // invited testers keep engineering.read/create/edit, so the commissioning workspace opens for them as preparers with
  // no capture, review, issue or receiving authority. With no policy-named performer, reviewer or issuer among them a
  // hosted package cannot be tested, approved or released. That is a deliberate hosted limit, not a gap to close here;
  // tests/demo/upgrade.test.ts accounts for the one user and asserts that limit. Outputs use the existing document
  // store under their own reserved identities and change no OUT-09/10/14 template definition.
  // Reviewed for 0030 (EN-07 engineering change-impact review): sixteen new tables (ppo.engineering_changes
  // and fifteen ppo.change_*), nine guard functions and their triggers. Five CHECK constraints are widened by the
  // 0020 OR-append idiom, including 0029's material_sources kind, and identity_has_typed_record() is extended
  // in place, so no existing row is rewritten and no value accepted before is refused. The new tables take
  // ordinary privileges from the generic table grant below. Seed 30 runs here because it is above 17: it
  // inserts three PPO-LocalSynthetic users that the hosted sign-in can never select, copies Company A read
  // grants to them from the synthetic coordinator where that identity exists, grants one change duty each to
  // fictional profiles only, and adds one fictional policy row whose actor list is plain JSON, so a missing
  // fixture identity cannot fail it. It rewrites nothing. No capability is added to `additions`: invited
  // testers keep engineering.read/create/edit, so the change workspace opens for them as authors with no
  // review, decision, receiving, verification or closure authority. With no policy-named reviewer among them
  // a hosted change cannot leave "In review". That is a deliberate hosted limit, not a gap to close here;
  // tests/demo/upgrade.test.ts accounts for the three users and asserts that limit.
  // Reviewed for 0029 (EN-06 released materials): eleven new ppo.material_* tables, two guard
  // functions and one deferred allocation trigger. Four shared CHECK constraints are widened by
  // the 0020 OR-append idiom and identity_has_typed_record() is extended in place, so no existing
  // row is rewritten and no value accepted before is refused. The new tables take ordinary
  // privileges from the generic table grant below. Seed 29 runs here because it is above 17: it
  // inserts six PPO-LocalSynthetic users that the hosted sign-in can never select, copies Company A
  // read grants to them from the synthetic coordinator where that identity exists, grants the
  // synthetic source adapter to the two synthetic coordinators, and adds one fictional policy row.
  // It rewrites nothing. No capability is added to `additions`: invited testers keep
  // engineering.read/create/edit, so the materials workspace opens for them with no source adapter
  // and no review, release or receiving authority. That is a deliberate hosted limit, not a gap to
  // close here. tests/demo/upgrade.test.ts accounts for the six users and asserts that limit.
  // Reviewed for 0028: three activity columns arrive with catalogue defaults, so no
  // existing activity row is rewritten and the closed-activity guard is never fired;
  // both new checks hold for every existing row (no start, not date-only). The partial
  // index and the personal ppo.work_view_preferences table take ordinary privileges from
  // the generic table grant below; the table holds criteria only and no authority. No
  // seed, capability, tester grant or hosted identity change is introduced, and My Work
  // reads use capabilities invited testers already hold (activity.*, crm.*).
  // Reviewed for 0027: roots/bases use ordinary typed-table grants and deferred
  // graph checks, with no seed, capability or hosted identity change. Original
  // estimate/version/quote rows and checksums are not rewritten. One estimate
  // per option replaces Opportunity uniqueness only for exact typed E2 roots;
  // legacy creation still materialises its constrained A identity. Existing
  // upgrade tests must exercise both old originals and restricted-role writes.
  // Reviewed for 0026: new typed discovery groups preserve existing E1 A/r01
  // UUIDs and source rows. No seed, grant or quote/price mutation is introduced.
  // Existing generic table/sequence grants cover the new schema; authority tables
  // remain read-only to the runtime role. The new triggers use the same workspace
  // row lock and ordinary table privileges as existing E1 commands. Upgrade
  // compatibility and repeat application require the actual retained DB proof.
  // Reviewed for 0025: the additive format discriminator defaults old records to 1;
  // old line JSON, hashes and outputs are unchanged. The installed arithmetic guard
  // is extended only at its exact known predicate, with no new seed or grant.
  // Retained 0024 review: immutable original-owner capture and transfer companions; no old row,
  // seed, grant or receipt is changed. Seed 24 adds only a local synthetic receiver
  // and a local coordinator own-transfer grant; invited tester grants remain unchanged. The generic migration loop and role grants
  // cover the new functions and tables; the fixed definer function grants only
  // row locks on authority tables, without granting the runtime role write access. Existing-data compatibility stays under the retained
  // upgrade tests. The accepted five-stage demonstration uses a separately prepared
  // database/storage epoch; this function neither resets nor activates that epoch.
  if (latestMigrationVersion !== 31) throw Error("Review the existing-demo upgrade for this release.");
  console.log("Demo upgrade stage: load-release");
  if (latestDemoMigrationVersion !== 3) throw Error("Review the existing-demo upgrade for this release.");
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
      // Only the additive fixture-grant seeds; never replay old fixture data.
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
    console.log("Demo upgrade stage: tester-role-profiles");
    const missingReviewers = await db.query(`
      SELECT t.object_id,t.expires_at
      FROM ppo.demo_testers t
      JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
      JOIN ppo.permission_grants g ON (g.workspace_id,g.user_id)=(t.workspace_id,t.user_id)
        AND g.capability='crm.opportunity.edit' AND g.company_id=$2 AND g.scope_type='Company' AND g.scope_id=$2
      JOIN ppo.permission_grants r ON (r.workspace_id,r.user_id)=(t.workspace_id,t.user_id)
        AND r.capability='shared.internal.read' AND r.company_id=$2 AND r.scope_type='Company' AND r.scope_id=$2
      WHERE t.workspace_id=$1 AND t.tenant_id=$3 AND t.enabled AND u.active
        AND u.issuer='PPO-EntraDemo' AND u.subject_id=t.tenant_id::text||'/'||t.object_id::text
        AND t.expires_at>clock_timestamp() AND g.valid_from<=clock_timestamp() AND r.valid_from<=clock_timestamp()
        AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()) AND (r.valid_to IS NULL OR r.valid_to>clock_timestamp())
        AND NOT EXISTS(SELECT 1 FROM ppo.demo_tester_roles dr WHERE dr.tenant_id=t.tenant_id
          AND dr.object_id=t.object_id AND dr.role_key='pack-reviewer')`,
    [demoWorkspace, demoCompany, tenant]);
    if (!apply && missingReviewers.rowCount)
      throw Error("Existing testers need the explicit hosted-role upgrade-and-deploy operation.");
    for (const row of missingReviewers.rows)
      await ensurePackReviewer(db, tenant, row.object_id, row.expires_at);
    console.log("Demo upgrade stage: verify-privileges");
    for (const table of ["ppo.lead_candidates", "ppo.projects", "ppo.engineering_packages", ...gmailTables]) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        const access = await db.query("SELECT has_table_privilege($1,$2,$3) AS allowed", [role, table, privilege]);
        if (!access.rows[0].allowed) throw Error("Runtime role needs the explicit database upgrade.");
      }
    }
    // Exercise the restricted role: the upgrade must not make identity writable.
    for (const table of ["ppo.demo_testers", "ppo.demo_tester_roles", "ppo.users", "ppo.permission_grants"]) {
      const identityAccess = await db.query("SELECT has_table_privilege($1,$2,'UPDATE') AS allowed", [role, table]);
      if (identityAccess.rows[0].allowed) throw Error("Runtime role has unexpected identity privileges.");
    }
    console.log("Demo upgrade stage: exercise-runtime-role");
    await db.query(`SET LOCAL ROLE ${pg.escapeIdentifier(role)}`);
    await db.query("SELECT id FROM ppo.lead_candidates LIMIT 0");
    await db.query("SELECT id FROM ppo.projects LIMIT 0");
    await db.query("SELECT id FROM ppo.engineering_packages LIMIT 0");
    await db.query("SELECT id FROM ppo.mail_connections LIMIT 0");
    await db.query("SELECT id FROM ppo.provider_messages LIMIT 0");
    console.log("Demo upgrade stage: commit");
  });
}
