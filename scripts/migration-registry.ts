import { createHash } from "node:crypto";

// One ordered registry for local and hosted setup. Gaps may be reserved by other workstreams.
export const migrationFiles = [
  "0001-foundation.sql",
  "0002-shared-foundation.sql",
  "0003-customer-intake.sql",
  "0004-work-scope.sql",
  "0005-planner.sql",
  "0006-job-packs.sql",
  "0007-online-field.sql",
  "0008-offline-recovery.sql",
  "0009-service-reports.sql",
  "0010-crm-opportunities.sql",
  "0011-finance-handoff.sql",
  "0012-estimating-e1.sql",
  "0013-p11-travel.sql",
  "0014-p11-travel-guard-repair.sql",
  "0015-email-calendar.sql",
  // 0016 remains reserved by the separate Assistant branch.
  "0017-crm-ui-refinements.sql",
  "0018-crm-leads.sql",
  "0019-projects-gantt.sql",
  "0020-engineering-intake.sql",
  "0021-crm-five-stages.sql",
  "0022-crm-discovery-conversion.sql",
  "0023-crm-owned-outcomes.sql",
  "0024-crm-owner-transfer.sql",
  "0025-estimating-line-taxonomy.sql",
  "0026-estimating-discovery.sql",
  "0027-estimating-discovery-cost-basis.sql",
  "0028-my-work-scheduling-and-views.sql",
  "0029-engineering-materials.sql",
  "0030-engineering-changes.sql",
  "0031-commissioning-as-built.sql",
  "0032-staged-acceptance.sql",
  "0033-acceptance-lifecycle-evidence.sql",
  "0034-acceptance-recipient-context.sql",
  "0035-acceptance-response-integrity.sql",
  "0036-acceptance-command-recovery.sql",
  "0037-acceptance-scope-disposition.sql",
  "0038-acceptance-source-followup.sql",
] as const;
export const seedFiles = [
  [2, "seed.sql"],
  [3, "seed-p03.sql"],
  [4, "seed-p04.sql"],
  [5, "seed-p05.sql"],
  [6, "seed-p06.sql"],
  [7, "seed-p07.sql"],
  [9, "seed-p09.sql"],
  [10, "seed-crm-i1.sql"],
  [11, "seed-p10.sql"],
  [12, "seed-estimating-e1.sql"],
  [13, "seed-p11.sql"],
  [14, "seed-p11-templates.sql"],
  [15, "seed-email-calendar.sql"],
  [18, "seed-crm-leads.sql"],
  [19, "seed-projects-gantt.sql"],
  [20, "seed-engineering-intake.sql"],
  [21, "seed-crm-five-stages.sql"],
  [24, "seed-crm-owner-transfer.sql"],
  [29, "seed-engineering-materials.sql"],
  [30, "seed-engineering-changes.sql"],
  [31, "seed-commissioning-as-built.sql"],
  [32, "seed-staged-acceptance.sql"],
] as const;
export const latestMigrationVersion = 38;

// Separate hosted-only track (ADR-0021): schema that only exists where real identity does.
// Version 1 is the issued identity baseline and is never re-applied or rewritten.
export const demoMigrationFiles = [
  "0001-identity.sql",
  "0002-gmail-connection.sql",
  "0003-hosted-pack-reviewer.sql",
] as const;
export const latestDemoMigrationVersion = 3;

// The original Windows-built demo recorded CRLF bytes. Recognize only that
// exact alternate encoding for the reviewed baseline; never rewrite its ledger.
export function existingDemoChecksumMatches(
  sql: string,
  checksum: unknown,
  legacyWindows = false,
) {
  const digest = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  if (checksum === digest(sql)) return true;
  if (!legacyWindows) return false;
  const lf = sql.replace(/\r\n/g, "\n");
  return (
    checksum === digest(lf) || checksum === digest(lf.replace(/\n/g, "\r\n"))
  );
}

// Local Windows checkouts may use either exact LF or CRLF encoding. Migration
// 0036 also has one recovered initial encoding: LF with a final CRLF. Limit
// that exception to both verified content hashes and its exact version.
export function existingLocalChecksumMatches(
  version: number,
  sql: string,
  checksum: unknown,
) {
  if (existingDemoChecksumMatches(sql, checksum, true)) return true;
  return (
    version === 36 &&
    createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex") ===
      "8e59bb81caef9f6e5d3f27d32a808e554009b33aaa7a902e6951f722a0de72de" &&
    checksum ===
      "46018e6ce64637a81ba16e66bf9b48bfed60f29d6b06f5192e18d3d6fa173693"
  );
}

export function validateMigrationRegistry(
  files: readonly string[],
  seeds: readonly (readonly [number, string])[],
) {
  let previous = 0;
  const versions = new Set<number>();
  for (const file of files) {
    if (!/^\d{4}-[a-z0-9-]+\.sql$/.test(file))
      throw Error(`Invalid migration filename: ${file}`);
    const version = Number(file.slice(0, 4));
    if (version <= previous)
      throw Error(`Migration versions must be unique and increasing: ${file}`);
    versions.add(version);
    previous = version;
  }
  previous = 0;
  for (const [version, file] of seeds) {
    if (!versions.has(version) || version <= previous)
      throw Error(
        `Seed versions must be unique, increasing and registered: ${file}`,
      );
    previous = version;
  }
}
