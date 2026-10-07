import { projectsAvailable } from "../../projects/visibility";
import type { Principal } from "../../platform/identity";
import { database } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../../platform/permissions";
import { companyContext, scopedOwner } from "../../shared/authority";
import { envelope, page, visible, visibility } from "../../shared/reads";
import { choice, object, optionalId, uuid } from "../../shared/validation";
import { activityVisibility, readActivity } from "../../activities/activities";
import { visibleOpportunity } from "../context";
import {
  leadAuthority,
  leadContext,
  leadVisibility,
  visibleLead,
} from "./context";
import { sources } from "./validation";
import {
  currentResolution,
  visibleCustomerContext,
  type LeadResolution,
} from "./resolution-context";
export async function readLead(p: Principal, id: string) {
  const c = database(),
    l = await visibleLead(c, p, id);
  const labels = (
    await c.query(
      "SELECT u.display_name AS owner_name,o.display_name AS organisation_name,pe.display_name AS contact_name,s.display_name AS site_name FROM ppo.lead_candidates l JOIN ppo.users u ON (u.workspace_id,u.id)=(l.workspace_id,l.owner_id) LEFT JOIN ppo.organisations o ON (o.workspace_id,o.id)=(l.workspace_id,l.organisation_id) LEFT JOIN ppo.people pe ON (pe.workspace_id,pe.id)=(l.workspace_id,l.primary_person_id) LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(l.workspace_id,l.site_id) WHERE l.workspace_id=$1 AND l.id=$2",
      [p.workspace_id, id],
    )
  ).rows[0] as {
    owner_name: string;
    organisation_name: string | null;
    contact_name: string | null;
    site_name: string | null;
  };
  const actionIds = (
    await c.query<{ id: string }>(
      `SELECT a.id FROM ppo.activities a WHERE a.workspace_id=$1 AND ${activityVisibility("a", true, true, await projectsAvailable(c))} AND EXISTS(SELECT 1 FROM ppo.activity_links x WHERE x.workspace_id=a.workspace_id AND x.activity_id=a.id AND x.lead_id=$3) ORDER BY a.created_at,a.id`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows;
  const actions = await Promise.all(
    actionIds.map((a) => readActivity(p, a.id)),
  );
  const events = (
    await c.query<{
      id: string;
      event_type: string;
      lead_version: number;
      reason: string;
      note: string | null;
      created_at: Date;
      created_by: string;
      actor_name: string;
    }>(
      "SELECT e.id,e.event_type,e.lead_version,e.reason,e.note,e.created_at,e.created_by,u.display_name AS actor_name FROM ppo.lead_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.created_by) WHERE e.workspace_id=$1 AND e.lead_id=$2 ORDER BY e.lead_version",
      [p.workspace_id, id],
    )
  ).rows.map((e) => ({ ...e, created_at: e.created_at.toISOString() }));
  const conversion = (
    await c.query(
      "SELECT opportunity_id,created_at FROM ppo.lead_conversions WHERE workspace_id=$1 AND lead_id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  let deal: { id: string; display_number: string; title: string } | null = null;
  if (conversion)
    try {
      const o = await visibleOpportunity(c, p, conversion.opportunity_id);
      deal = { id: o.id, display_number: o.display_number, title: o.title };
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  let can_edit = false,
    can_convert = false;
  try {
    await leadAuthority(c, p, id);
    can_edit = l.status !== "Converted";
    can_convert =
      can_edit &&
      !l.is_archived &&
      l.status !== "Disqualified" &&
      (await hasPermission(
        c,
        p,
        "crm.lead.convert",
        l.company_id,
        l.site_id ?? undefined,
      )) &&
      (await hasPermission(
        c,
        p,
        "crm.opportunity.create",
        l.company_id,
        l.site_id ?? undefined,
      ));
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
  }
  const next = actions.find((a) => a.id === l.next_activity_id) ?? null;
  const conversion_review = conversion
    ? await conversionReview(p, id, !!deal)
    : null;
  const resolution = await readResolution(p, id);
  const resolution_history = resolution
    ? await Promise.all(
        (
          await c.query<LeadResolution>(
            "SELECT company_id,organisation_id,site_id,primary_person_id,event_id,lead_version FROM ppo.lead_context_resolutions WHERE workspace_id=$1 AND lead_id=$2 ORDER BY lead_version",
            [p.workspace_id, id],
          )
        ).rows.map((r) => readResolution(p, id, r)),
      )
    : [];
  const ownership_history = (
    await c.query("SELECT to_regclass('ppo.lead_owner_transfers') AS relation")
  ).rows[0].relation
    ? (
        await c.query<{
          event_id: string;
          lead_version: number;
          from_owner_name: string;
          to_owner_name: string;
        }>(
          "SELECT t.event_id,t.lead_version,f.display_name AS from_owner_name,u.display_name AS to_owner_name FROM ppo.lead_owner_transfers t JOIN ppo.users f ON (f.workspace_id,f.id)=(t.workspace_id,t.from_owner_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.to_owner_id) WHERE t.workspace_id=$1 AND t.lead_id=$2 ORDER BY t.lead_version",
          [p.workspace_id, id],
        )
      ).rows
    : [];
  return {
    ...l,
    ...labels,
    created_at: l.created_at.toISOString(),
    updated_at: l.updated_at.toISOString(),
    actions,
    events,
    next_activity: next,
    next_action_state:
      l.next_activity_id && !next
        ? "Unavailable"
        : !next || !["Open", "InProgress"].includes(next.status)
          ? "Needed"
          : next.due_needed
            ? "DueNeeded"
            : Date.parse(next.due_at!) < Date.now()
              ? "Overdue"
              : "Upcoming",
    deal,
    conversion_review,
    resolution,
    resolution_history,
    ownership_history,
    can_edit,
    can_convert,
    synthetic: true as const,
  };
}

async function readResolution(
  p: Principal,
  id: string,
  original?: LeadResolution,
) {
  const c = database(),
    r = original ?? (await currentResolution(c, p, id));
  if (!r) return null;
  try {
    await visibleCustomerContext(c, p, r);
    const organisation = r.organisation_id
      ? await visible(c, p, "Organisation", r.organisation_id)
      : null;
    const site = r.site_id ? await visible(c, p, "Site", r.site_id) : null;
    const person = r.primary_person_id
      ? await visible(c, p, "Person", r.primary_person_id)
      : null;
    return {
      state: "Available" as const,
      ...r,
      organisation_name: organisation?.display_name ?? null,
      site_name: site?.display_name ?? null,
      contact_name: person?.display_name ?? null,
    };
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    return { state: "Restricted" as const };
  }
}

async function conversionReview(
  p: Principal,
  id: string,
  dealVisible: boolean,
) {
  const evidence = (
    await database().query<{
      retained: {
        id: string;
        version: number;
        reason: string;
        summary: string;
        owner_id: string;
        site_id: string | null;
        status: string;
        due_at: string | null;
      }[];
      review_activity_id: string;
    }>(
      `SELECT a.details->'retained_source_activities' AS retained,a.details->>'review_activity_id' AS review_activity_id
     FROM ppo.lead_conversions x JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(x.workspace_id,x.created_by,x.operation_id)
     WHERE x.workspace_id=$1 AND x.lead_id=$2 AND a.object_type='Lead' AND a.object_id=x.lead_id
       AND a.outcome='Accepted' AND a.details->>'command'='ConvertLeadToOpportunity'`,
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!evidence?.retained?.length) return null;
  const restricted = {
    state: "Restricted" as const,
    retained: [],
    review_activity: null,
  };
  if (!dealVisible) return restricted;
  try {
    const retained = await Promise.all(
      evidence.retained.map(async (original) => {
        const current = await readActivity(p, original.id);
        return {
          ...original,
          current_status: current.status,
          current_owner: current.owner_name,
          current_version: current.version,
        };
      }),
    );
    const review_activity = await readActivity(p, evidence.review_activity_id);
    return { state: "Available" as const, retained, review_activity };
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    return restricted;
  }
}
export async function listLeads(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "crm.lead.read");
  const r = object(input, [
    "limit",
    "cursor",
    "q",
    "view",
    "status",
    "source",
    "owner_id",
    "sort",
  ]);
  const view = choice(r.view ?? "Active", "view", [
      "Active",
      "Archived",
      "Disqualified",
      "Converted",
    ] as const),
    sort = choice(r.sort ?? "Newest", "sort", [
      "Newest",
      "Oldest",
      "Name",
    ] as const),
    status = r.status
      ? choice(r.status, "status", ["New", "Contacting", "Nurturing"] as const)
      : null,
    source = r.source ? choice(r.source, "source", sources) : null,
    owner = optionalId(r.owner_id, "owner_id");
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => ["limit", "cursor", "q"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "Leads",
      view,
      sort,
      status,
      source,
      owner,
    },
  );
  let anchor: string | null = null;
  if (pg.after) {
    await visibleLead(c, p, pg.after);
    anchor = (
      await c.query(
        "SELECT CASE WHEN $3='Name' THEN lower(title) ELSE created_at::text END AS anchor FROM ppo.lead_candidates WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, pg.after, sort],
      )
    ).rows[0].anchor;
  }
  const expression = sort === "Name" ? "lower(lead.title)" : "lead.created_at",
    compare = sort === "Newest" ? "<" : ">",
    order = sort === "Newest" ? "DESC" : "ASC",
    cast = sort === "Name" ? "text" : "timestamptz";
  const rows = (
    await c.query<{ id: string }>(
      `SELECT lead.id FROM ppo.lead_candidates lead WHERE lead.workspace_id=$1 AND ${leadVisibility()}
 AND (($3='Active' AND lead.status IN ('New','Contacting','Nurturing') AND NOT lead.is_archived) OR ($3='Archived' AND lead.is_archived) OR ($3='Disqualified' AND lead.status='Disqualified' AND NOT lead.is_archived) OR ($3='Converted' AND lead.status='Converted'))
 AND ($4::text IS NULL OR lead.status=$4) AND ($5::text IS NULL OR lead.source_channel=$5) AND ($6::uuid IS NULL OR lead.owner_id=$6)
 AND position(lower($7) IN lower(concat_ws(' ',lead.title,lead.organisation_text,lead.contact_text,lead.need_summary,(SELECT o.display_name FROM ppo.organisations o WHERE o.workspace_id=lead.workspace_id AND o.id=lead.organisation_id),(SELECT pe.display_name FROM ppo.people pe WHERE pe.workspace_id=lead.workspace_id AND pe.id=lead.primary_person_id))))>0
 AND ($8::uuid IS NULL OR (${expression},lead.id) ${compare} ($9::${cast},$8::uuid)) ORDER BY ${expression} ${order},lead.id ${order} LIMIT $10`,
      [
        p.workspace_id,
        p.actor_id,
        view,
        status,
        source,
        owner,
        pg.q,
        pg.after,
        anchor,
        pg.limit + 1,
      ],
    )
  ).rows;
  const selected = rows.slice(0, pg.limit);
  const items = await Promise.all(
    selected.map(async ({ id }) => {
      const l = await readLead(p, id);
      return {
        id: l.id,
        display_number: l.display_number,
        version: l.version,
        title: l.title,
        organisation_name: l.organisation_name ?? l.organisation_text,
        contact_name: l.contact_name ?? l.contact_text,
        owner_name: l.owner_name,
        owner_id: l.owner_id,
        status: l.status,
        is_archived: l.is_archived,
        source_channel: l.source_channel,
        created_at: l.created_at,
        next_action_state: l.next_action_state,
        next_activity: l.next_activity,
      };
    }),
  );
  return {
    ...envelope(
      items,
      rows.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
    ),
    can_create: await hasPermission(c, p, "crm.lead.create"),
  };
}
export async function leadOptions(p: Principal, input: unknown = {}) {
  const c = database(),
    r = object(input, [
      "kind",
      "company_id",
      "site_id",
      "organisation_id",
      "primary_person_id",
      "q",
      "limit",
      "cursor",
    ]),
    kind = choice(r.kind, "kind", [
      "Company",
      "Owner",
      "ActionOwner",
      "Organisation",
      "Site",
      "Person",
    ] as const),
    company = optionalId(r.company_id, "company_id"),
    site = optionalId(r.site_id, "site_id"),
    org = optionalId(r.organisation_id, "organisation_id");
  await requireCapability(c, p, "crm.lead.read");
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) => ["q", "limit", "cursor"].includes(k)),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "LeadOptions",
      kind,
      company,
      site,
      org,
    },
  );
  if (kind !== "Company") {
    await companyContext(
      c,
      p,
      uuid(company, "company_id"),
      site,
      "crm.lead.read",
    );
    if (
      !(await hasPermission(
        c,
        p,
        "shared.internal.read",
        company!,
        site ?? undefined,
      ))
    )
      throw unavailable();
  }
  if (org) {
    const o = await visible(c, p, "Organisation", org);
    if (o.company_id !== company) throw unavailable();
  }
  let rows: { id: string; display_name: string; display_number?: string }[] =
    [];
  if (kind === "Company")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name FROM ppo.companies x WHERE x.workspace_id=$1 AND ${scopeSql("x.id", "NULL::uuid", "crm.lead.create")} AND ${scopeSql("x.id")} AND ${scopeSql("x.id", "NULL::uuid", "shared.internal.read")} ORDER BY x.id`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
  else if (kind === "Owner" || kind === "ActionOwner") {
    for (const u of (
      await c.query(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY id",
        [p.workspace_id],
      )
    ).rows)
      try {
        if (kind === "Owner")
          await leadContext(
            c,
            p,
            { company_id: company!, site_id: site, owner_id: u.id },
            "crm.lead.read",
          );
        else {
          const owner = await scopedOwner(
            c,
            p,
            u.id,
            company!,
            site ?? undefined,
            "activity.edit",
          );
          for (const cap of [
            "crm.lead.read",
            "activity.read",
            "shared.internal.read",
          ] as const)
            if (
              !(await hasPermission(c, owner, cap, company!, site ?? undefined))
            )
              throw unavailable();
        }
        rows.push(u);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
  } else if (kind === "Organisation")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name,x.display_number FROM ppo.organisations x WHERE x.workspace_id=$1 AND x.company_id=$3 AND ${visibility("Organisation", "x")} ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company],
      )
    ).rows;
  else if (kind === "Site")
    rows = (
      await c.query(
        `SELECT x.id,x.display_name,x.display_number FROM ppo.sites x WHERE x.workspace_id=$1 AND x.company_id=$3 AND ${visibility("Site", "x")} AND EXISTS(SELECT 1 FROM ppo.site_parties sp WHERE sp.workspace_id=x.workspace_id AND sp.site_id=x.id AND sp.organisation_id=$4 AND sp.valid_from<=CURRENT_DATE AND (sp.valid_to IS NULL OR sp.valid_to>CURRENT_DATE)) ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company, org],
      )
    ).rows;
  else
    rows = (
      await c.query(
        `SELECT x.id,x.display_name FROM ppo.people x WHERE x.workspace_id=$1 AND x.active AND ${visibility("Person", "x")} AND EXISTS(SELECT 1 FROM ppo.relationships rel WHERE rel.workspace_id=x.workspace_id AND rel.person_id=x.id AND rel.company_id=$3 AND rel.organisation_id=$4 AND rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)) ORDER BY x.id`,
        [p.workspace_id, p.actor_id, company, org],
      )
    ).rows;
  rows = rows.filter(
    (x) =>
      (!pg.after || x.id > pg.after) &&
      `${x.display_name} ${x.display_number ?? ""}`
        .toLowerCase()
        .includes(pg.q.toLowerCase()),
  );
  return envelope(
    rows.slice(0, pg.limit),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
