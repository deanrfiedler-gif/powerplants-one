import type { QueryResult } from "pg";
import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import {
  pagePermissionReads,
  type QueryClient,
} from "../../platform/permissions";
import { activityPageReads } from "../../activities/page-reads";
import {
  changesAccess,
  stamp,
  type ChangeRow,
  type RevisionRow,
  type ReviewRow,
  type HandoverRow,
  type SubmissionRow,
} from "./context";
import { changesHref, isOpen, label, policyAllows } from "./model";
import type { ReviewTask } from "../../reviews/model";

// This is exactly changesAccess's scoped duty check, including live-user and
// grant-time predicates. Cache only this check and hasPermission, never a
// package/relationship read. The factory lives for one reviewSources request.
const dutyQuery = `SELECT DISTINCT g.capability FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
         WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.capability=ANY($3::text[])
         AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
         AND (g.scope_type='Workspace' OR (g.company_id=$4 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$5::uuid))))`;
export function engineeringReviewPages(p: Principal) {
  const batched = activityPageReads(database(), 50);
  const permissions = pagePermissionReads(batched);
  const duties = new Map<string, Promise<QueryResult>>();
  const query = (sql: string, values: unknown[] = []) => {
    if (sql !== dutyQuery) return permissions.query(sql, values);
    const key = JSON.stringify(values);
    let result = duties.get(key);
    if (!result) {
      result = permissions.query(sql, values);
      duties.set(key, result);
    }
    return result;
  };
  const c: QueryClient = { query: query as QueryClient["query"] };
  return async (packageIds: string[]): Promise<ReviewTask[]> => {
    // Empty packages still undergo their native access check. Settle every
    // check, then rethrow the first refusal in page order into the domain catch.
    const checked = await Promise.allSettled(
      packageIds.map((id) => changesAccess(c, p, id)),
    );
    const access = checked.map((result) => {
      if (result.status === "rejected") throw result.reason;
      return result.value;
    });
    if (!packageIds.length) return [];
    const scope = [p.workspace_id, packageIds];
    const changes = (
      await database().query<ChangeRow>(
        `SELECT t.*,t.due::text,au.display_name AS author_name,nx.display_name AS next_owner_name
       FROM ppo.engineering_changes t JOIN ppo.users au ON (au.workspace_id,au.id)=(t.workspace_id,t.author_id)
       LEFT JOIN ppo.users nx ON (nx.workspace_id,nx.id)=(t.workspace_id,t.next_owner_id)
       WHERE t.workspace_id=$1 AND t.package_id=ANY($2::uuid[]) ORDER BY t.change_number`,
        scope,
      )
    ).rows;
    const revisions = (
      await database().query<RevisionRow>(
        `SELECT t.*,ro.display_name AS return_owner_name FROM ppo.change_revisions t
       LEFT JOIN ppo.users ro ON (ro.workspace_id,ro.id)=(t.workspace_id,t.return_owner_id)
       JOIN ppo.engineering_changes c ON (c.workspace_id,c.id,c.current_revision)=(t.workspace_id,t.change_id,t.revision_number)
       WHERE t.workspace_id=$1 AND c.package_id=ANY($2::uuid[]) ORDER BY t.revision_number`,
        scope,
      )
    ).rows;
    const reviews = (
      await database().query<ReviewRow>(
        `SELECT t.*,rv.display_name AS reviewer_name FROM ppo.change_reviews t
       JOIN ppo.users rv ON (rv.workspace_id,rv.id)=(t.workspace_id,t.reviewer_id)
       JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(t.workspace_id,t.change_id)
       WHERE t.workspace_id=$1 AND c.package_id=ANY($2::uuid[]) ORDER BY t.created_at,t.discipline`,
        scope,
      )
    ).rows;
    const handovers = (
      await database().query<HandoverRow>(
        `SELECT t.*,t.due::text,ow.display_name AS owner_name FROM ppo.change_handovers t
       JOIN ppo.users ow ON (ow.workspace_id,ow.id)=(t.workspace_id,t.owner_id)
       JOIN ppo.users cb ON (cb.workspace_id,cb.id)=(t.workspace_id,t.created_by)
       JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(t.workspace_id,t.change_id)
       WHERE t.workspace_id=$1 AND c.package_id=ANY($2::uuid[]) ORDER BY t.created_at,t.id`,
        scope,
      )
    ).rows;
    const submissions = (
      await database().query<SubmissionRow>(
        `SELECT t.*,t.return_due::text,ro.display_name AS return_owner_name FROM ppo.change_submissions t
       JOIN ppo.users sb ON (sb.workspace_id,sb.id)=(t.workspace_id,t.submitted_by)
       LEFT JOIN ppo.users ro ON (ro.workspace_id,ro.id)=(t.workspace_id,t.return_owner_id)
       JOIN ppo.change_handovers h ON (h.workspace_id,h.id)=(t.workspace_id,t.handover_id)
       JOIN ppo.engineering_changes c ON (c.workspace_id,c.id)=(h.workspace_id,h.change_id)
       WHERE t.workspace_id=$1 AND c.package_id=ANY($2::uuid[]) ORDER BY t.submission_number`,
        scope,
      )
    ).rows;
    const items: ReviewTask[] = [];
    for (const [index, packageId] of packageIds.entries()) {
      const f = { access: access[index] };
      for (const row of changes.filter(
        (change) => change.package_id === packageId,
      )) {
        const revision = revisions.find((r) => r.change_id === row.id)!;
        const l = {
          row,
          revision,
          reviews: reviews.filter((r) => r.revision_id === revision.id),
          requests: handovers
            .filter((h) => h.change_id === row.id)
            .map((handover) => ({
              handover,
              submissions: submissions.filter(
                (s) => s.handover_id === handover.id,
              ),
              stale: handover.revision_id !== revision.id,
            })),
        };

        const base = {
          source: "EngineeringChange" as const,
          module: "Engineering",
          record_id: l.row.id,
          company_id: f.access.pkg.company_id,
          package_id: packageId,
          reference: l.row.reference,
          revision: `r${l.revision.revision_number}`,
          version: l.row.version,
          title: l.row.title,
          context: [
            f.access.pkg.customer_name,
            f.access.site_name,
            l.row.location,
          ]
            .filter(Boolean)
            .join(" · "),
          submitted_at: stamp(l.revision.submitted_at),
          due: l.row.due,
          author_id: l.revision.submitted_by ?? l.row.author_id,
          status: l.row.stage,
          returned: l.row.stage === "Returned",
          return_reason: l.revision.return_reason,
          current: isOpen(l.row.stage),
          href: changesHref(packageId, "reviews", l.row.id),
        };
        for (const r of l.reviews)
          items.push({
            ...base,
            id: `EngineeringChange:${r.id}`,
            kind: "Review",
            owner_id: r.reviewer_id,
            owner_name: r.reviewer_name,
            status: r.result ?? l.row.stage,
            current: !r.result && l.row.stage === "InReview",
            actionable:
              !r.result &&
              l.row.stage === "InReview" &&
              r.reviewer_id === p.actor_id &&
              f.access.can.review &&
              !policyAllows(f.access.policy, p.actor_id, "DisciplineReviewer", {
                discipline: r.discipline,
              }),
          });
        if (l.row.stage === "Returned")
          items.push({
            ...base,
            id: `EngineeringChange:${l.revision.id}`,
            kind: "Review",
            owner_id: l.revision.return_owner_id ?? l.row.author_id,
            owner_name: l.revision.return_owner_name ?? l.row.author_name,
            actionable: f.access.can.edit,
          });
        for (const r of l.requests) {
          const last = r.submissions.at(-1)!,
            returned = r.handover.state === "Returned";
          items.push({
            ...base,
            id: `EngineeringChange:${r.handover.id}`,
            kind: "Handover",
            title: `${label(r.handover.purpose)} · ${l.row.title}`,
            revision: `r${l.revision.revision_number} · handover v${r.handover.version}`,
            submitted_at: stamp(last.submitted_at),
            due: returned ? last.return_due : r.handover.due,
            owner_id: returned ? last.return_owner_id : r.handover.owner_id,
            owner_name: returned
              ? last.return_owner_name
              : r.handover.owner_name,
            author_id: last.submitted_by,
            status: r.handover.state,
            returned,
            return_reason: returned ? last.outcome_reason : null,
            current: ["Pending", "Returned"].includes(r.handover.state),
            actionable: returned
              ? f.access.can.edit
              : r.handover.state === "Pending" &&
                f.access.can.receive &&
                !r.stale &&
                !policyAllows(f.access.policy, p.actor_id, "Receiver", {
                  destination: r.handover.destination,
                }),
            href: changesHref(packageId, "handovers", l.row.id),
          });
        }
      }
    }
    return items;
  };
}
