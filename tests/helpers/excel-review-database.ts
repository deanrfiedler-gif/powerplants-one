import { database } from "../../src/platform/database";
// Full rows, including lineage, grants, receipts and audit; counts alone can hide rewrites.
export async function excelSnapshot() {
  const snapshot: Record<string, unknown> = {};
  for (const table of [
    "estimating_workspaces",
    "estimating_options",
    "estimation_revisions",
    "estimates",
    "estimate_versions",
    "estimate_discovery_roots",
    "estimate_discovery_bases",
    "permission_grants",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ]) {
    snapshot[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
  }
  return snapshot;
}
