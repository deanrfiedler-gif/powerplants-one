import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { hasPermission, scopeSql } from "../platform/permissions";
import { activityVisibility } from "../activities/activities";
import { leadsAvailable, leadVisibility } from "./leads/context";
import { opportunityVisibility } from "./context";
import type { OpportunityStage } from "./stages";

// Open opportunities with no active next action, for My Work. The rule is the one the Deals
// worklist already applies as next_action_state = 'Needed' (its "No next activity" view): the
// designated next action is finished. A designated action that is overdue or has no date is a
// different attention state there and stays one here; nothing in this read changes the pointer.
// An action hidden from the reader ('Unavailable') is unknown, so it is never reported as a gap.
export type PlanningGap = {
  id: string;
  display_number: string;
  title: string;
  version: number;
  stage_id: OpportunityStage;
  company_id: string;
  site_id: string | null;
  organisation_id: string;
  organisation_name: string;
  primary_person_id: string | null;
  contact_name: string | null;
  owner_id: string;
  owner_name: string;
  gap_since: string;
  can_plan: boolean;
};
// Returns null when the reader holds no Sales read capability: the panel is then absent, which
// is different from an empty result.
export async function listPlanningGaps(
  p: Principal,
  filters: { owner_id: string | null; company_id: string | null; limit: number },
) {
  const c = database();
  if (!(await hasPermission(c, p, "crm.opportunity.read"))) return null;
  const from = `FROM ppo.opportunities o
    JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id)
    JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
    LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
    JOIN ppo.activities a ON (a.workspace_id,a.id)=(o.workspace_id,o.next_activity_id) AND ${activityVisibility("a", true, await leadsAvailable(c))}
    WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND o.close_outcome='Open'
      AND a.status NOT IN ('Open','InProgress')
      AND ($3::uuid IS NULL OR o.owner_id=$3) AND ($4::uuid IS NULL OR o.company_id=$4)`;
  const scope = [p.workspace_id, p.actor_id, filters.owner_id, filters.company_id];
  const total = (
    await c.query<{ total: number }>(`SELECT count(*)::int AS total ${from}`, scope)
  ).rows[0].total;
  // Longest without a next action first; the identifier keeps equal times in a stable order.
  const rows = (
    await c.query<Omit<PlanningGap, "gap_since"> & { gap_since: Date }>(
      `SELECT o.id,o.display_number,o.title,o.version,o.stage_id,o.company_id,o.site_id,o.organisation_id,r.display_name AS organisation_name,
        o.primary_person_id,pe.display_name AS contact_name,o.owner_id,u.display_name AS owner_name,a.updated_at AS gap_since,
        (o.owner_id=$2 AND ${scopeSql("o.company_id", "o.site_id", "crm.opportunity.edit")}) AS can_plan
       ${from} ORDER BY a.updated_at,o.id LIMIT $5`,
      [...scope, filters.limit],
    )
  ).rows;
  return {
    total,
    items: rows.map(
      (row): PlanningGap => ({ ...row, gap_since: row.gap_since.toISOString() }),
    ),
  };
}

// Open opportunities whose designated next action is overdue, for My Work. The rule is again the
// Deals worklist's own, next_action_state = 'Overdue': the action is active, has a date, and its
// overdue instant has passed. It is asked at the caller's observation instant, so this count and
// the activity counts beside it describe the same moment. The action may belong to a colleague,
// which is why an owner's overdue opportunity is not always among their own overdue activities.
export type OverdueOpportunity = Omit<PlanningGap, "gap_since" | "can_plan"> & {
  action_id: string;
  action_summary: string;
  action_due_at: string;
  action_due_date_only: boolean;
  action_starts_at: string | null;
  action_owner_id: string;
  action_owner_name: string;
};
export async function listOverdueOpportunities(
  p: Principal,
  filters: { owner_id: string | null; company_id: string | null; now: string; limit: number },
) {
  const c = database();
  if (!(await hasPermission(c, p, "crm.opportunity.read"))) return null;
  const from = `FROM ppo.opportunities o
    JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id)
    JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
    LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
    JOIN ppo.activities a ON (a.workspace_id,a.id)=(o.workspace_id,o.next_activity_id) AND ${activityVisibility("a", true, await leadsAvailable(c))}
    JOIN ppo.users au ON (au.workspace_id,au.id)=(a.workspace_id,a.owner_id)
    WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND o.close_outcome='Open'
      AND a.status IN ('Open','InProgress') AND NOT a.due_needed AND a.due_at<$5::timestamptz
      AND ($3::uuid IS NULL OR o.owner_id=$3) AND ($4::uuid IS NULL OR o.company_id=$4)`;
  const scope = [p.workspace_id, p.actor_id, filters.owner_id, filters.company_id, filters.now];
  const total = (
    await c.query<{ total: number }>(`SELECT count(*)::int AS total ${from}`, scope)
  ).rows[0].total;
  // Longest overdue first; the identifier keeps equal instants in a stable order.
  const rows = (
    await c.query<Omit<OverdueOpportunity, "action_due_at" | "action_starts_at"> & { action_due_at: Date; action_starts_at: Date | null }>(
      `SELECT o.id,o.display_number,o.title,o.version,o.stage_id,o.company_id,o.site_id,o.organisation_id,r.display_name AS organisation_name,
        o.primary_person_id,pe.display_name AS contact_name,o.owner_id,u.display_name AS owner_name,
        a.id AS action_id,a.summary AS action_summary,a.due_at AS action_due_at,a.due_date_only AS action_due_date_only,a.starts_at AS action_starts_at,
        a.owner_id AS action_owner_id,au.display_name AS action_owner_name
       ${from} ORDER BY a.due_at,o.id LIMIT $6`,
      [...scope, filters.limit],
    )
  ).rows;
  return {
    total,
    items: rows.map(
      (row): OverdueOpportunity => ({
        ...row,
        action_due_at: row.action_due_at.toISOString(),
        action_starts_at: row.action_starts_at?.toISOString() ?? null,
      }),
    ),
  };
}

// The leads and open opportunities the reader may plan a next action for: their own, within
// their edit scope. It feeds the My Work activity form's "linked record" choice, so the form
// offers only records whose plan command the server would accept.
export type PlannableParent = {
  type: "Lead" | "Opportunity";
  id: string;
  version: number;
  display_number: string;
  title: string;
  organisation_name: string | null;
  contact_name: string | null;
  company_id: string;
  site_id: string | null;
};
export async function listPlannableParents(p: Principal) {
  const c = database();
  const [opportunities, leads] = await Promise.all([
    hasPermission(c, p, "crm.opportunity.edit"),
    (await leadsAvailable(c)) ? hasPermission(c, p, "crm.lead.edit") : Promise.resolve(false),
  ]);
  const items: PlannableParent[] = [];
  if (opportunities)
    items.push(
      ...(
        await c.query<PlannableParent>(
          `SELECT 'Opportunity' AS type,o.id,o.version,o.display_number,o.title,r.display_name AS organisation_name,pe.display_name AS contact_name,o.company_id,o.site_id
           FROM ppo.opportunities o JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
           LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id)
           WHERE o.workspace_id=$1 AND ${opportunityVisibility()} AND o.close_outcome='Open' AND o.owner_id=$2
            AND ${scopeSql("o.company_id", "o.site_id", "crm.opportunity.edit")} ORDER BY lower(o.title),o.id LIMIT 200`,
          [p.workspace_id, p.actor_id],
        )
      ).rows,
    );
  if (leads)
    items.push(
      ...(
        await c.query<PlannableParent>(
          `SELECT 'Lead' AS type,lead.id,lead.version,lead.display_number,lead.title,coalesce(o.display_name,lead.organisation_text) AS organisation_name,
            coalesce(pe.display_name,lead.contact_text) AS contact_name,lead.company_id,lead.site_id
           FROM ppo.lead_candidates lead LEFT JOIN ppo.organisations o ON (o.workspace_id,o.id)=(lead.workspace_id,lead.organisation_id)
           LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(lead.workspace_id,lead.primary_person_id)
           WHERE lead.workspace_id=$1 AND ${leadVisibility()} AND lead.owner_id=$2 AND lead.status IN ('New','Contacting','Nurturing') AND NOT lead.is_archived
            AND ${scopeSql("lead.company_id", "lead.site_id", "crm.lead.edit")} ORDER BY lower(lead.title),lead.id LIMIT 200`,
          [p.workspace_id, p.actor_id],
        )
      ).rows,
    );
  return { items, observed_at: new Date().toISOString() };
}
