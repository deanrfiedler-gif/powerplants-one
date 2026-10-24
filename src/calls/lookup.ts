import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { unavailable } from "../platform/errors";
import { hasPermission, requireCapability, type QueryClient } from "../platform/permissions";
import { activityVisibility } from "../activities/activities";
import { crmAvailable, opportunityVisibility } from "../crm/context";
import { leadsAvailable, leadVisibility } from "../crm/leads/context";
import { projectsAvailable, projectVisibility } from "../projects/visibility";
import { visibility } from "../shared/reads";
import { object, optionalId, invalid } from "../shared/validation";
import { companyRegion } from "./legacy-phone";
import { readPhoneNumber, type PartyType } from "./numbers";

export type NumberMatch = {
  party_type: PartyType;
  party: { id: string; display_name: string; active: boolean };
  number: { id: string; label: string; needs_checking: boolean };
  organisations: { id: string; display_name: string }[];
  open_opportunities: { id: string; title: string; stage_id: string }[];
  open_leads: { id: string; title: string; status: string }[];
  open_projects: { id: string; title: string; lifecycle: string }[];
  last_activity: { id: string; summary: string; updated_at: string } | null;
  next_activity: { id: string; summary: string; due_at: string | null } | null;
};

// R4/R5: every number row whose party this user may read, and nothing else. A hidden party is
// indistinguishable from no match.
export async function matchingParties(c: QueryClient, p: Principal, e164: string) {
  return (
    await c.query<{ number_id: string; label: string; needs_checking: boolean; party_type: PartyType; party_id: string; display_name: string; active: boolean }>(
      `SELECT n.id AS number_id,n.label,n.needs_checking,
         CASE WHEN n.person_id IS NOT NULL THEN 'Person' ELSE 'Organisation' END AS party_type,
         coalesce(n.person_id,n.organisation_id) AS party_id,coalesce(pe.display_name,o.display_name) AS display_name,
         coalesce(pe.active,o.relationship_status<>'Inactive') AS active
       FROM ppo.contact_numbers n
       LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(n.workspace_id,n.person_id)
       LEFT JOIN ppo.organisations o ON (o.workspace_id,o.id)=(n.workspace_id,n.organisation_id)
       WHERE n.workspace_id=$1 AND n.e164=$3
         AND ((pe.id IS NOT NULL AND ${visibility("Person", "pe")}) OR (o.id IS NOT NULL AND ${visibility("Organisation", "o")}))
       ORDER BY 6,1`,
      [p.workspace_id, p.actor_id, e164],
    )
  ).rows;
}

async function context(c: QueryClient, p: Principal, party: PartyType, id: string) {
  const args = [p.workspace_id, p.actor_id, id];
  const organisations =
    party === "Organisation"
      ? (await c.query(`SELECT o.id,o.display_name FROM ppo.organisations o WHERE o.workspace_id=$1 AND o.id=$3`, args)).rows
      : (
          await c.query(
            `SELECT DISTINCT o.id,o.display_name FROM ppo.relationships r JOIN ppo.organisations o ON (o.workspace_id,o.id)=(r.workspace_id,r.organisation_id)
             WHERE r.workspace_id=$1 AND r.person_id=$3 AND r.valid_from<=current_date AND (r.valid_to IS NULL OR r.valid_to>current_date)
               AND ${visibility("Organisation", "o")} ORDER BY o.display_name,o.id`,
            args,
          )
        ).rows;
  const orgs = organisations.map((o) => o.id),
    person = party === "Person" ? id : null;
  const scoped = [p.workspace_id, p.actor_id, orgs, person];
  const crm = await crmAvailable(c),
    leads = await leadsAvailable(c),
    projects = await projectsAvailable(c);
  const open_opportunities = crm
    ? (
        await c.query(
          `SELECT op.id,op.title,op.stage_id FROM ppo.opportunities op WHERE op.workspace_id=$1 AND op.close_outcome='Open'
             AND (op.organisation_id=ANY($3::uuid[]) OR op.primary_person_id=$4) AND ${opportunityVisibility("op")}
           ORDER BY op.updated_at DESC,op.id LIMIT 10`,
          scoped,
        )
      ).rows
    : [];
  const open_leads = leads
    ? (
        await c.query(
          `SELECT l.id,l.title,l.status FROM ppo.lead_candidates l WHERE l.workspace_id=$1 AND l.status IN ('New','Contacting','Nurturing')
             AND (l.organisation_id=ANY($3::uuid[]) OR l.primary_person_id=$4) AND ${leadVisibility("l")}
           ORDER BY l.updated_at DESC,l.id LIMIT 10`,
          scoped,
        )
      ).rows
    : [];
  const open_projects = projects
    ? (
        await c.query(
          `SELECT pj.id,pj.title,pj.lifecycle FROM ppo.projects pj WHERE pj.workspace_id=$1 AND pj.lifecycle='Active'
             AND pj.organisation_id=ANY($3::uuid[]) AND ${projectVisibility("pj")}
           ORDER BY pj.updated_at DESC,pj.id LIMIT 10`,
          [p.workspace_id, p.actor_id, orgs],
        )
      ).rows
    : [];
  // Activities linked to any of the related records, or logged as calls with this person.
  const related = `EXISTS(SELECT 1 FROM ppo.activity_links al WHERE al.workspace_id=a.workspace_id AND al.activity_id=a.id AND (
      (al.object_type='Organisation' AND al.object_id=ANY($3::uuid[])) OR
      (al.object_type='Opportunity' AND al.object_id=ANY($4::uuid[])) OR
      (al.object_type='Lead' AND al.object_id=ANY($5::uuid[])) OR
      (al.object_type='Project' AND al.object_id=ANY($6::uuid[]))))
    OR EXISTS(SELECT 1 FROM ppo.call_details cd WHERE cd.workspace_id=a.workspace_id AND cd.activity_id=a.id AND cd.person_id=$7)`;
  const activityArgs = [
    p.workspace_id,
    p.actor_id,
    orgs,
    open_opportunities.map((o) => o.id),
    open_leads.map((l) => l.id),
    open_projects.map((x) => x.id),
    person,
  ];
  const seen = activityVisibility("a", crm, leads, projects);
  const last_activity =
    (
      await c.query(
        `SELECT a.id,a.summary,a.updated_at FROM ppo.activities a WHERE a.workspace_id=$1 AND a.status='Completed' AND (${related}) AND ${seen}
         ORDER BY a.updated_at DESC,a.id LIMIT 1`,
        activityArgs,
      )
    ).rows[0] ?? null;
  const next_activity =
    (
      await c.query(
        `SELECT a.id,a.summary,a.due_at FROM ppo.activities a WHERE a.workspace_id=$1 AND a.status IN ('Open','InProgress') AND (${related}) AND ${seen}
         ORDER BY a.due_at NULLS LAST,a.id LIMIT 1`,
        activityArgs,
      )
    ).rows[0] ?? null;
  return { organisations, open_opportunities, open_leads, open_projects, last_activity, next_activity };
}

// Reads only. A number with "+" is international; a local number needs the company whose region
// it is written in (Q9). An unreadable number has no matches rather than a guessed one.
export async function lookupNumber(p: Principal, input: unknown) {
  const r = object(input, ["number", "company_id"]);
  if (typeof r.number !== "string") invalid("number", "Enter a phone number.");
  const company = optionalId(r.company_id, "company_id");
  const c = database();
  await requireCapability(c, p, "shared.read");
  let region = "AU";
  if (!(r.number as string).trim().startsWith("+")) {
    if (!company) invalid("company_id", "Choose the company whose region this local number is written in.");
    if (!(await hasPermission(c, p, "shared.read", company))) throw unavailable();
    region = await companyRegion(c, p.workspace_id, company);
  }
  const { e164 } = readPhoneNumber(r.number, region);
  if (!e164) return { number_e164: null, matches: [] as NumberMatch[] };
  const matches: NumberMatch[] = [];
  for (const m of await matchingParties(c, p, e164))
    matches.push({
      party_type: m.party_type,
      party: { id: m.party_id, display_name: m.display_name, active: m.active },
      number: { id: m.number_id, label: m.label, needs_checking: m.needs_checking },
      ...(await context(c, p, m.party_type, m.party_id)),
    });
  return { number_e164: e164, matches };
}
