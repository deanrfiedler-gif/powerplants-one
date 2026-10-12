import { leadConversionReadiness, leadRecordSummary } from "./record";
import { projectsAvailable } from "../../projects/visibility";
import type { Principal } from "../../platform/identity";
import { database, transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../../platform/permissions";
import { companyContext, scopedOwner } from "../../shared/authority";
import { envelope, page, visible, visibility } from "../../shared/reads";
import {
  choice,
  invalid,
  object,
  optionalId,
  uuid,
} from "../../shared/validation";
import {
  activityVisibility,
  visibleActivity,
  readActivityWithClient,
} from "../../activities/activities";
import { visibleOpportunity } from "../context";
import { leadAuthority, leadContext, visibleLead } from "./context";
import {
  leadFilterKeys,
  leadFilters,
  leadFollowUps,
  leadFollowUpPredicate,
  leadRegisterSource,
  leadViews,
  leadViewPredicate,
} from "./register";
import {
  currentResolution,
  visibleCustomerContext,
  type LeadResolution,
} from "./resolution-context";
// A transaction owns one pg client; do not enqueue overlapping reads on it.
async function readSequentially<T, U>(rows: T[], read: (row: T) => Promise<U>) {
  const results: U[] = [];
  for (const row of rows) results.push(await read(row));
  return results;
}
export async function readLead(p: Principal, id: string) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const observedAt = Date.now();
    const detail = await readLeadWithClient(c, p, id, observedAt);
    const lead = await visibleLead(c, p, id);
    const conversion_readiness = await leadConversionReadiness(c, p, lead);
    // Expiring grants are not held by the workspace lock. Fail closed rather
    // than returning activity data selected before access expired.
    for (const action of detail.actions) await visibleActivity(c, p, action.id);
    await visibleLead(c, p, id);
    return {
      ...detail,
      conversion_readiness,
      record_summary: leadRecordSummary(detail, observedAt),
    };
  });
}
async function readLeadWithClient(
  c: QueryClient,
  p: Principal,
  id: string,
  observedAt = Date.now(),
) {
  const l = await visibleLead(c, p, id);
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
  const actions = await readSequentially(actionIds, (a) =>
    readActivityWithClient(c, p, a.id),
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
    ? await conversionReview(c, p, id, !!deal)
    : null;
  const resolution = await readResolution(c, p, id);
  const resolution_history = resolution
    ? await readSequentially(
        (
          await c.query<LeadResolution>(
            "SELECT company_id,organisation_id,site_id,primary_person_id,event_id,lead_version FROM ppo.lead_context_resolutions WHERE workspace_id=$1 AND lead_id=$2 ORDER BY lead_version",
            [p.workspace_id, id],
          )
        ).rows,
        (r) => readResolution(c, p, id, r),
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
            : Date.parse(next.due_at!) < observedAt
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
  c: QueryClient,
  p: Principal,
  id: string,
  original?: LeadResolution,
) {
  const r = original ?? (await currentResolution(c, p, id));
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
  c: QueryClient,
  p: Principal,
  id: string,
  dealVisible: boolean,
) {
  const evidence = (
    await c.query<{
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
    const retained = await readSequentially(
      evidence.retained,
      async (original) => {
        const current = await readActivityWithClient(c, p, original.id);
        return {
          ...original,
          current_status: current.status,
          current_owner: current.owner_name,
          current_version: current.version,
        };
      },
    );
    const review_activity = await readActivityWithClient(
      c,
      p,
      evidence.review_activity_id,
    );
    return { state: "Available" as const, retained, review_activity };
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    return restricted;
  }
}
export async function listLeads(p: Principal, input: unknown = {}) {
  const r = object(input, [
    ...leadFilterKeys,
    "limit",
    "cursor",
    "view",
    "sort",
    "follow_up",
  ]);
  const view = choice(r.view ?? "Active", "view", leadViews),
    sort = choice(r.sort ?? "Newest", "sort", [
      "Newest",
      "Oldest",
      "Name",
    ] as const),
    followUp =
      r.follow_up === undefined
        ? null
        : choice(r.follow_up, "follow_up", leadFollowUps),
    filters = leadFilters(r);
  if (followUp && view !== "Active" && view !== "MyLeads")
    invalid("follow_up", "Follow-up views apply to active leads only.");
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
      status: filters.status,
      source: filters.source,
      owner: filters.owner,
      follow_up: followUp,
    },
  );
  return transaction(async (c) => {
    // Use the same workspace lock as native commands. Hydration uses this client
    // throughout, so concurrent list reads cannot exhaust the pool awaiting themselves.
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    await requireCapability(c, p, "crm.lead.read");
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
    const observed_at = new Date().toISOString();
    const expression = sort === "Name" ? "lower(r.title)" : "r.created_at",
      compare = sort === "Newest" ? "<" : ">",
      order = sort === "Newest" ? "DESC" : "ASC",
      cast = sort === "Name" ? "text" : "timestamptz";
    const sql = `${leadRegisterSource(await projectsAvailable(c))}
      SELECT r.id,r.next_action_state FROM leads r
      WHERE ${leadViewPredicate(view)} AND ${leadFollowUpPredicate(followUp)}
        AND ($8::uuid IS NULL OR (${expression},r.id) ${compare} ($9::${cast},$8::uuid))
      ORDER BY ${expression} ${order},r.id ${order} LIMIT $10`;
    const values = [
      p.workspace_id,
      p.actor_id,
      filters.status,
      filters.source,
      filters.owner,
      pg.q,
      observed_at,
      pg.after,
      anchor,
      pg.limit + 1,
    ];
    const rows = (
      await c.query<{ id: string; next_action_state: string }>(sql, values)
    ).rows;
    const selected = rows.slice(0, pg.limit);
    const changed = () =>
      new AppError(
        409,
        "LeadReadChanged",
        "Lead access or follow-up changed during this read. Refresh the list.",
      );
    const items = await readSequentially(
      selected,
      async ({ id, next_action_state }) => {
        const l = await readLeadWithClient(c, p, id, Date.parse(observed_at));
        if (l.next_action_state !== next_action_state) throw changed();
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
      },
    );
    // Time-limited grants may expire even under a workspace lock. Recheck every
    // candidate, including the lookahead, before exposing rows or a next cursor.
    const current = (await c.query(sql, values)).rows;
    if (JSON.stringify(current) !== JSON.stringify(rows)) throw changed();
    await requireCapability(c, p, "crm.lead.read");
    return {
      ...envelope(
        items,
        rows.length > pg.limit ? pg.cursor(selected.at(-1)!.id) : null,
      ),
      observed_at,
      can_create: await hasPermission(c, p, "crm.lead.create"),
    };
  });
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
