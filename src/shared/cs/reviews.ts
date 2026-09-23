import type { Principal } from "../../platform/identity";
import type { ReviewTask } from "../../reviews/model";
import { listCs, readCs } from "./service";

// Read-only SH adapter: the exact survey snapshot and CS command retain the decision.
export async function surveyReviewTasks(p: Principal, company: string | null) {
  const page = await listCs(p, "Survey", { limit: "100" }),
    items: ReviewTask[] = [];
  for (const row of page.items) {
    if (company && row.company_id !== company) continue;
    const source = await readCs(p, "Survey", row.id),
      record = source.record;
    if (record.state === "Draft") continue;
    const submitted = source.snapshots.find(
      (s) => s.kind === "Submission" && s.revision === record.revision,
    );
    if (!submitted) continue;
    const returned = record.state === "Returned",
      current = record.state === "Submitted" || returned;
    items.push({
      id: `SiteSurvey:${record.id}`,
      source: "SiteSurvey",
      module: "Customers & sites",
      record_id: record.id,
      company_id: record.company_id,
      reference: record.name,
      revision: `Revision ${record.revision}`,
      version: record.version,
      kind: "Review",
      title: "Survey as-found review",
      context: record.name,
      submitted_at: new Date(submitted.recorded_at).toISOString(),
      due: null,
      owner_id: returned ? record.owner_id : null,
      owner_name: returned ? row.owner_name : null,
      author_id: submitted.recorded_by,
      status: record.state,
      returned,
      return_reason: returned
        ? String(
            source.events.find((e) => e.kind === "Returned")?.details.reason ??
              "Read the retained CS review",
          )
        : null,
      current,
      actionable:
        source.can_edit &&
        (returned
          ? record.owner_id === p.actor_id
          : record.state === "Submitted" &&
            submitted.recorded_by !== p.actor_id),
      href: `/surveys/${record.id}?view=review`,
    });
  }
  return { items, bounded: !!page.next_cursor };
}
