import { database } from "../../src/platform/database";

// Full business rows, not merely counts: shared reads cannot rewrite source facts.
export async function outputSnapshot() {
  const result: Record<string, unknown> = {};
  for (const table of [
    "packs",
    "pack_revisions",
    "pack_issues",
    "pack_render_jobs",
    "pack_recipients",
    "pack_issue_events",
    "pack_distribution_events",
    "pack_acknowledgements",
    "service_reports",
    "report_revisions",
    "report_reviews",
    "report_issues",
    "report_presentations",
    "report_render_jobs",
    "customer_responses",
    "customer_response_contexts",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
  ]) {
    result[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
  }
  return result;
}
