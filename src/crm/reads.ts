import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import { activityVisibility, readActivity } from "../activities/activities";
import { envelope, page, visible, visibility } from "../shared/reads";
import { companyContext } from "../shared/authority";
import { choice, object, optionalId, uuid } from "../shared/validation";
import {
  eligibleOpportunityOwner,
  eligibleActionOwner,
  opportunityVisibility,
  relationshipContext,
  visibleOpportunity,
  PIPELINE_ID,
} from "./context";

function nextState(alias = "a") {
  return `CASE WHEN ${alias}.id IS NULL THEN 'Unavailable' WHEN ${alias}.status NOT IN ('Open','InProgress') THEN 'Needed' WHEN ${alias}.due_needed THEN 'DueNeeded' WHEN ${alias}.due_at<clock_timestamp() THEN 'Overdue' ELSE 'Upcoming' END`;
}
export async function readOpportunity(p: Principal, id: string) {
  const c = database(),
    o = await visibleOpportunity(c, p, id);
  const context = (
    await c.query<{
      organisation_name: string;
      site_name: string | null;
      timezone: string | null;
      contact_name: string | null;
      owner_name: string;
      pipeline_label: string;
    }>(
      "SELECT r.display_name AS organisation_name,s.display_name AS site_name,s.timezone,pe.display_name AS contact_name,u.display_name AS owner_name,d.label AS pipeline_label FROM ppo.opportunities o JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id) JOIN ppo.crm_pipeline_definitions d ON (d.workspace_id,d.id)=(o.workspace_id,o.pipeline_definition_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(o.workspace_id,o.site_id) LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(o.workspace_id,o.primary_person_id) WHERE o.workspace_id=$1 AND o.id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  const visibleActions = (
    await c.query(
      `SELECT a.id FROM ppo.activities a WHERE a.workspace_id=$1 AND ${activityVisibility("a", true)} AND EXISTS(SELECT 1 FROM ppo.activity_links l WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id AND l.opportunity_id=$3) ORDER BY a.created_at,a.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const actions = await Promise.all(
    visibleActions.map((a) => readActivity(p, a.id)),
  );
  const designated = actions.find((a) => a.id === o.next_activity_id) ?? null;
  const next_action_state = !designated
    ? "Unavailable"
    : !["Open", "InProgress"].includes(designated.status)
      ? "Needed"
      : designated.due_needed
        ? "DueNeeded"
        : Date.parse(designated.due_at!) < Date.now()
          ? "Overdue"
          : "Upcoming";
  const events = (
    await c.query(
      "SELECT id,event_type,opportunity_version,from_stage,to_stage,reason,need_summary,qualification_note,next_activity_id,identification_activity_id,created_at,created_by FROM ppo.opportunity_events WHERE workspace_id=$1 AND opportunity_id=$2 ORDER BY opportunity_version",
      [p.workspace_id, id],
    )
  ).rows.map((e) => ({
    ...e,
    next_activity_id: actions.some((a) => a.id === e.next_activity_id)
      ? e.next_activity_id
      : null,
    identification_activity_id: actions.some(
      (a) => a.id === e.identification_activity_id,
    )
      ? e.identification_activity_id
      : null,
  }));
  let can_edit = false;
  if (o.owner_id === p.actor_id)
    try {
      await relationshipContext(c, p, o, "crm.opportunity.edit");
      await eligibleOpportunityOwner(c, p, o);
      can_edit = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  return {
    id: o.id,
    display_number: o.display_number,
    version: o.version,
    synthetic: true,
    company_id: o.company_id,
    organisation_id: o.organisation_id,
    site_id: o.site_id,
    primary_person_id: o.primary_person_id,
    site_unknown_reason: o.site_unknown_reason,
    contact_unknown_reason: o.contact_unknown_reason,
    title: o.title,
    need_summary: o.need_summary,
    source_channel: o.source_channel,
    source_basis: o.source_basis,
    owner_id: o.owner_id,
    pipeline_definition_id: o.pipeline_definition_id,
    stage_id: o.stage_id,
    close_outcome: o.close_outcome,
    stage_entered_at: o.stage_entered_at.toISOString(),
    updated_at: o.updated_at.toISOString(),
    qualification_note: o.qualification_note,
    ...context,
    next_action_state,
    next_activity: designated,
    actions,
    events,
    can_edit,
    can_qualify: can_edit && o.stage_id === "Enquiry",
    observed_at: new Date().toISOString(),
  };
}
export async function listOpportunities(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "crm.opportunity.read");
  const r = object(input, [
    "limit",
    "cursor",
    "q",
    "company_id",
    "site_id",
    "owner_id",
    "stage_id",
    "next_action",
  ]);
  const filters = {
    owner_id: optionalId(r.owner_id, "owner_id"),
    stage_id:
      r.stage_id === undefined
        ? null
        : choice(r.stage_id, "stage_id", ["Enquiry", "Qualified"]),
    next_action:
      r.next_action === undefined
        ? null
        : choice(r.next_action, "next_action", [
            "Needed",
            "DueNeeded",
            "Overdue",
            "Upcoming",
            "Unavailable",
          ]),
  };
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) =>
        ["limit", "cursor", "q", "company_id", "site_id"].includes(k),
      ),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "Opportunity",
      ...filters,
    },
  );
  const rows = (
    await c.query(
      `SELECT o.id,o.display_number,o.title,o.stage_id,o.close_outcome,o.stage_entered_at,o.version,o.owner_id,u.display_name AS owner_name,r.display_name AS organisation_name,o.updated_at,${nextState()} AS next_action_state,a.summary AS next_action_summary,a.due_at,a.due_needed
   FROM ppo.opportunities o JOIN ppo.users u ON (u.workspace_id,u.id)=(o.workspace_id,o.owner_id) JOIN ppo.organisations r ON (r.workspace_id,r.id)=(o.workspace_id,o.organisation_id)
   LEFT JOIN ppo.activities a ON a.workspace_id=o.workspace_id AND a.id=o.next_activity_id AND ${activityVisibility("a", true)}
   WHERE o.workspace_id=$1 AND ${opportunityVisibility()}
   AND ($3::uuid IS NULL OR o.company_id=$3) AND ($4::uuid IS NULL OR o.site_id=$4) AND ($5::uuid IS NULL OR o.id>$5)
   AND (position(lower($6) in lower(o.title||' '||o.display_number||' '||r.display_name))>0)
   AND ($7::uuid IS NULL OR o.owner_id=$7) AND ($8::text IS NULL OR o.stage_id=$8) AND ($9::text IS NULL OR ${nextState()}=$9)
   ORDER BY o.id LIMIT $10`,
      [
        p.workspace_id,
        p.actor_id,
        pg.company_id,
        pg.site_id,
        pg.after,
        pg.q,
        filters.owner_id,
        filters.stage_id,
        filters.next_action,
        pg.limit + 1,
      ],
    )
  ).rows;
  return {
    ...envelope(
      rows.slice(0, pg.limit),
      rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
    ),
    can_create: await hasPermission(c, p, "crm.opportunity.create"),
  };
}
// Only short identity labels are selected here. No account notes, source keys or unscoped directory.
export async function opportunityOptions(p: Principal, input: unknown = {}) {
  const c = database(),
    r = object(input, [
      "kind",
      "company_id",
      "organisation_id",
      "site_id",
      "primary_person_id",
      "opportunity_id",
      "limit",
      "cursor",
      "q",
    ]);
  const kind = choice(r.kind, "kind", [
    "Company",
    "Organisation",
    "Site",
    "Person",
    "Owner",
    "ActionOwner",
  ]);
  const company = optionalId(r.company_id, "company_id"),
    org = optionalId(r.organisation_id, "organisation_id"),
    site = optionalId(r.site_id, "site_id"),
    person = optionalId(r.primary_person_id, "primary_person_id");
  await requireCapability(c, p, "crm.opportunity.read");
  if (r.opportunity_id)
    await visibleOpportunity(c, p, uuid(r.opportunity_id, "opportunity_id"));
  if (kind !== "Company") {
    if (!company) uuid(company, "company_id");
    await companyContext(c, p, company!, site, "crm.opportunity.read");
    if (
      !(await hasPermission(
        c,
        p,
        "shared.internal.read",
        company!,
        site ?? undefined,
      ))
    )
      throw new AppError(
        404,
        "RecordUnavailable",
        "This record is unavailable.",
      );
  }
  if (org) {
    const o = await visible(c, p, "Organisation", org);
    if (o.company_id !== company)
      throw new AppError(
        404,
        "RecordUnavailable",
        "This record is unavailable.",
      );
  }
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => ["limit", "cursor", "q"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "CrmSelector",
      kind,
      company,
      org,
      site,
      person,
      opportunity: r.opportunity_id,
    },
  );
  let rows: { id: string; display_name: string; display_number?: string }[] =
    [];
  if (kind === "Company")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name FROM ppo.companies x WHERE x.workspace_id=$1 AND ${scopeSql("x.id", "NULL::uuid", "crm.opportunity.create")} AND ${scopeSql("x.id")} AND ${scopeSql("x.id", "NULL::uuid", "shared.internal.read")} ORDER BY x.id`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
  if (kind === "Organisation")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name,x.display_number FROM ppo.organisations x WHERE x.workspace_id=$1 AND x.company_id=$3 AND ${visibility("Organisation", "x")} ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company],
      )
    ).rows;
  if (kind === "Site")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name,x.display_number FROM ppo.sites x WHERE x.workspace_id=$1 AND x.company_id=$3 AND ${visibility("Site", "x")} AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=x.workspace_id AND sp.site_id=x.id AND sp.organisation_id=$4 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE)) ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company, org],
      )
    ).rows;
  if (kind === "Person")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name FROM ppo.people x WHERE x.workspace_id=$1 AND x.active AND ${visibility("Person", "x")} AND EXISTS(SELECT 1 FROM ppo.relationships rel WHERE rel.workspace_id=x.workspace_id AND rel.person_id=x.id AND rel.company_id=$3 AND rel.organisation_id=$4 AND rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)) ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company, org],
      )
    ).rows;
  if (kind === "Owner" || kind === "ActionOwner") {
    const context = {
      company_id: company!,
      organisation_id: uuid(org, "organisation_id"),
      site_id: site,
      primary_person_id: person,
      owner_id: p.actor_id,
      pipeline_definition_id: PIPELINE_ID,
    };
    await relationshipContext(c, p, context, "crm.opportunity.read");
    for (const u of (
      await c.query(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY id",
        [p.workspace_id],
      )
    ).rows)
      try {
        if (kind === "Owner")
          await eligibleOpportunityOwner(c, p, context, u.id);
        else await eligibleActionOwner(c, p, context, u.id);
        rows.push(u);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
  }
  rows = rows.filter(
    (x) =>
      (!pg.after || x.id > pg.after) &&
      x.display_name.toLowerCase().includes(pg.q.toLowerCase()),
  );
  return {
    ...envelope(
      rows.slice(0, pg.limit),
      rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
    ),
    pipeline_definition_id: PIPELINE_ID,
    pipeline_label: "Fictional sales enquiry — I1",
  };
}
