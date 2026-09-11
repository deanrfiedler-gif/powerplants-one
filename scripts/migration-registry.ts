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
] as const;
export const latestMigrationVersion = 19;

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
