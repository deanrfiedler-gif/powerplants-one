// "Waiting on others" projects dependencies that a source module already records. My Work owns
// none of them: following up changes the follow-up, never the dependency, and only the source
// workflow clears it. A source the reader cannot open is left out; a source that has no such
// concept (Sales has none today) contributes nothing rather than an invented request.
import { crmAvailable } from "../crm/context";
import { leadsAvailable } from "../crm/leads/context";
import { listEngineering } from "../engineering/service";
import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { hasPermission, scopeSql } from "../platform/permissions";
import { ticketVisibility } from "../service/tickets";
import { activityVisibility } from "./activities";

export type WaitingItem = {
  id: string;
  source: "ServiceRequest" | "Engineering";
  record_id: string;
  reference: string;
  // What is awaited, in the source's own words.
  awaited: string;
  context: string | null;
  // The party asked, where the source records one. Never inferred.
  respondent_name: string | null;
  respondent_role: string | null;
  waiting_since: string | null;
  follow_up_at: string | null;
  follow_up_date_only: boolean;
  owner_id: string;
  owner_name: string;
  // The owned follow-up activity, where the source created one. Rescheduling it records the
  // next chase without touching the original waiting date.
  activity: { id: string; version: number; can_edit: boolean } | null;
  href: string;
};

export async function listWorkWaiting(
  p: Principal,
  filters: { owner_id: string | null; company_id: string | null; limit: number },
) {
  const c = database();
  const [tickets, engineering] = await Promise.all([
    hasPermission(c, p, "service.ticket.read"),
    hasPermission(c, p, "engineering.read"),
  ]);
  if (!tickets && !engineering) return null;
  const items: WaitingItem[] = [];
  if (tickets) {
    const rows = (
      await c.query<{
        id: string; display_number: string; summary: string; open_questions: string | null;
        site_name: string | null; respondent: string | null; named: boolean;
        activity_id: string; activity_version: number; owner_id: string; owner_name: string;
        due_at: Date | null; due_date_only: boolean; waiting_since: Date; may_edit: boolean;
      }>(
        `SELECT t.id,t.display_number,t.summary,t.open_questions,s.display_name AS site_name,
          coalesce(rp.display_name,nullif(btrim(t.requester_description),'')) AS respondent,(rp.id IS NOT NULL) AS named,
          a.id AS activity_id,a.version AS activity_version,a.owner_id,u.display_name AS owner_name,a.due_at,a.due_date_only,a.created_at AS waiting_since,
          ${scopeSql("a.company_id", "a.site_id", "activity.edit")} AS may_edit
         FROM ppo.tickets t
         JOIN ppo.activities a ON (a.workspace_id,a.id)=(t.workspace_id,t.clarification_activity_id)
         JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.owner_id)
         LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(t.workspace_id,t.site_id)
         LEFT JOIN ppo.people rp ON (rp.workspace_id,rp.id)=(t.workspace_id,t.requester_id)
         WHERE t.workspace_id=$1 AND t.status='NeedsInformation' AND ${ticketVisibility("t")}
          AND ${activityVisibility("a", await crmAvailable(c), await leadsAvailable(c))} AND a.status IN ('Open','InProgress')
          AND ($3::uuid IS NULL OR a.owner_id=$3) AND ($4::uuid IS NULL OR t.company_id=$4)
         ORDER BY a.due_at NULLS LAST,t.id LIMIT 200`,
        [p.workspace_id, p.actor_id, filters.owner_id, filters.company_id],
      )
    ).rows;
    for (const r of rows)
      items.push({
        id: `ticket:${r.id}`,
        source: "ServiceRequest",
        record_id: r.id,
        reference: r.display_number,
        awaited: r.open_questions?.trim() || r.summary,
        context: r.summary,
        respondent_name: r.respondent,
        respondent_role: r.respondent ? (r.named ? "Requester" : "Requester as described") : null,
        waiting_since: r.waiting_since.toISOString(),
        follow_up_at: r.due_at?.toISOString() ?? null,
        follow_up_date_only: r.due_date_only,
        owner_id: r.owner_id,
        owner_name: r.owner_name,
        activity: { id: r.activity_id, version: r.activity_version, can_edit: r.may_edit },
        href: `/service/tickets/${r.id}`,
      });
  }
  if (engineering) {
    // Engineering records a blocker and a next-action date on the package itself.
    const result = await listEngineering(p, {
      ...(filters.owner_id ? { owner_id: filters.owner_id } : {}),
      attention: "true",
      limit: 100,
    });
    for (const e of result.items)
      if (e.blocker && (!filters.company_id || e.company_id === filters.company_id))
        items.push({
          id: `engineering:${e.id}`,
          source: "Engineering",
          record_id: e.id,
          reference: e.display_number,
          awaited: e.blocker,
          context: [e.title, e.customer_name].filter(Boolean).join(" · ") || null,
          respondent_name: null,
          respondent_role: null,
          waiting_since: null,
          follow_up_at: e.action_due ? new Date(`${e.action_due}T23:59:59.999+10:00`).toISOString() : null,
          follow_up_date_only: true,
          owner_id: e.owner_id,
          owner_name: e.owner_name,
          activity: null,
          href: `/engineering/${e.id}`,
        });
  }
  // Next chase first; requests with no follow-up date last; identifiers keep ties stable.
  items.sort(
    (a, b) =>
      (a.follow_up_at ?? "9999").localeCompare(b.follow_up_at ?? "9999") ||
      a.id.localeCompare(b.id),
  );
  return { total: items.length, items: items.slice(0, filters.limit) };
}
