import { activityVisibility } from "../../activities/activities";
import { database } from "../../platform/database";
import type { Principal } from "../../platform/identity";
import { requireCapability } from "../../platform/permissions";
import { projectsAvailable } from "../../projects/visibility";
import { page } from "../../shared/reads";
import { choice, object, optionalId } from "../../shared/validation";
import { leadVisibility } from "./context";
import { leadStates, sources } from "./validation";

export const leadViews = [
  "Active",
  "MyLeads",
  "Archived",
  "Disqualified",
  "Converted",
] as const;
export const leadFollowUps = ["Overdue", "NextActionNeeded"] as const;
export const leadFilterKeys = ["q", "status", "source", "owner_id"];

export function leadFilters(r: Record<string, unknown>) {
  return {
    q: page({ q: r.q }, "Lead filters").q,
    status: r.status ? choice(r.status, "status", leadStates) : null,
    source: r.source ? choice(r.source, "source", sources) : null,
    owner: optionalId(r.owner_id, "owner_id"),
  };
}

// Shared by list selection and full-match counts. $1/$2 are the workspace/actor;
// $3–$6 are status/source/owner/search and $7 is the response's observation time.
// Only an activity visible through EVERY linked source may classify follow-up.
export function leadRegisterSource(withProject: boolean) {
  return `WITH leads AS (
    SELECT lead.*,
      CASE WHEN lead.next_activity_id IS NOT NULL AND next_action.id IS NULL THEN 'Unavailable'
        WHEN next_action.id IS NULL OR next_action.status NOT IN ('Open','InProgress') THEN 'Needed'
        WHEN next_action.due_needed THEN 'DueNeeded'
        WHEN next_action.due_at<$7::timestamptz THEN 'Overdue'
        ELSE 'Upcoming' END AS next_action_state
    FROM ppo.lead_candidates lead
    LEFT JOIN LATERAL (
      SELECT a.id,a.status,a.due_needed,a.due_at FROM ppo.activities a
      WHERE a.workspace_id=lead.workspace_id AND a.id=lead.next_activity_id
        AND ${activityVisibility("a", true, true, withProject)}
        AND EXISTS(SELECT 1 FROM ppo.activity_links x WHERE x.workspace_id=a.workspace_id AND x.activity_id=a.id AND x.lead_id=lead.id)
    ) next_action ON true
    WHERE lead.workspace_id=$1 AND ${leadVisibility()}
      AND ($3::text IS NULL OR lead.status=$3)
      AND ($4::text IS NULL OR lead.source_channel=$4)
      AND ($5::uuid IS NULL OR lead.owner_id=$5)
      AND position(lower($6) IN lower(concat_ws(' ',lead.title,lead.organisation_text,lead.contact_text,lead.need_summary,
        (SELECT o.display_name FROM ppo.organisations o WHERE o.workspace_id=lead.workspace_id AND o.id=lead.organisation_id),
        (SELECT pe.display_name FROM ppo.people pe WHERE pe.workspace_id=lead.workspace_id AND pe.id=lead.primary_person_id))))>0
  )`;
}

export const activeLeads =
  "r.status IN ('New','Contacting','Nurturing') AND NOT r.is_archived";
export function leadViewPredicate(view: (typeof leadViews)[number]) {
  return {
    Active: activeLeads,
    MyLeads: `${activeLeads} AND r.owner_id=$2`,
    Archived: "r.is_archived",
    Disqualified: "r.status='Disqualified' AND NOT r.is_archived",
    Converted: "r.status='Converted'",
  }[view];
}
export function leadFollowUpPredicate(
  followUp: (typeof leadFollowUps)[number] | null,
) {
  return followUp === "Overdue"
    ? "r.next_action_state='Overdue'"
    : followUp === "NextActionNeeded"
      ? "r.next_action_state IN ('Needed','DueNeeded')"
      : "true";
}

export async function countLeads(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "crm.lead.read");
  const filters = leadFilters(object(input, leadFilterKeys));
  const withProject = await projectsAvailable(c);
  const observed_at = new Date().toISOString();
  const predicates = {
    Active: leadViewPredicate("Active"),
    MyLeads: leadViewPredicate("MyLeads"),
    New: `${activeLeads} AND r.status='New'`,
    Contacting: `${activeLeads} AND r.status='Contacting'`,
    Nurturing: `${activeLeads} AND r.status='Nurturing'`,
    Overdue: `${activeLeads} AND ${leadFollowUpPredicate("Overdue")}`,
    NextActionNeeded: `${activeLeads} AND ${leadFollowUpPredicate("NextActionNeeded")}`,
    Archived: leadViewPredicate("Archived"),
    Disqualified: leadViewPredicate("Disqualified"),
    Converted: leadViewPredicate("Converted"),
    FollowUpUnavailable: `${activeLeads} AND r.next_action_state='Unavailable'`,
  };
  const counts = (
    await c.query<Record<keyof typeof predicates, number>>(
      `${leadRegisterSource(withProject)} SELECT ${Object.entries(predicates)
        .map(
          ([key, predicate]) =>
            `count(*) FILTER (WHERE ${predicate})::int AS "${key}"`,
        )
        .join(",")} FROM leads r`,
      [
        p.workspace_id,
        p.actor_id,
        filters.status,
        filters.source,
        filters.owner,
        filters.q,
        observed_at,
      ],
    )
  ).rows[0];
  await requireCapability(c, p, "crm.lead.read");
  return {
    counts,
    observed_at,
    source: "Synthetic" as const,
    completeness: "Complete" as const,
    count_scope: "AllAuthorisedMatches" as const,
    follow_up_completeness: counts.FollowUpUnavailable
      ? ("Partial" as const)
      : ("Complete" as const),
    filters: {
      q: filters.q,
      status: filters.status,
      source: filters.source,
      owner_id: filters.owner,
    },
  };
}
