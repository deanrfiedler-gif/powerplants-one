import { leadsAvailable, leadVisibility, visibleLead } from "../crm/leads/context";
import { crmAvailable, opportunityVisibility, visibleOpportunity } from "../crm/context";
import type { PoolClient } from "pg";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { ticketVisibility, visibleTicket } from "../service/tickets";
import { companyContext, scopedOwner } from "../shared/authority";
import {
  envelope,
  page,
  visible,
  visibility,
  type SharedKind,
} from "../shared/reads";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  narrative,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
export const activityKinds = [
  "TechnicalFollowUp",
  "CustomerContact",
  "MaterialAction",
  "FinanceQuery",
  "RelationshipReview",
] as const;
export const activityStates = [
  "Open",
  "InProgress",
  "Completed",
  "Cancelled",
] as const;
export const linkKinds = ["Organisation", "Site", "Asset", "Ticket", "Opportunity", "Lead"] as const;
export type ActivityLink = {
  object_type: (typeof linkKinds)[number];
  object_id: string;
};
export type ActivityInput = {
  id: string;
  company_id: string;
  site_id: string | null;
  kind: (typeof activityKinds)[number];
  owner_id: string;
  summary: string;
  due_at: string | null;
  due_needed: boolean;
  access_class: "Internal" | "RestrictedService" | "RestrictedFinance";
  links: ActivityLink[];
};
export function dueFields(r: Record<string, unknown>) {
  if (typeof r.due_needed !== "boolean")
    invalid(
      "due_needed",
      "Choose a due instant or explicitly mark the due date as needed.",
    );
  const due_at =
    r.due_at === null || r.due_at === undefined
      ? null
      : instant(r.due_at, "due_at");
  if ((due_at === null) !== r.due_needed)
    invalid("due_at", "Use either a known due instant or due date needed.");
  return { due_at, due_needed: r.due_needed };
}
export function parseLinks(value: unknown): ActivityLink[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10)
    invalid("links", "Provide 1–10 supported record links.");
  const links = value
    .map((v) => {
      const r = object(v, ["object_type", "object_id"]);
      return {
        object_type: choice(r.object_type, "object_type", linkKinds),
        object_id: uuid(r.object_id, "object_id"),
      };
    })
    .sort((a, b) =>
      `${a.object_type}:${a.object_id}`.localeCompare(
        `${b.object_type}:${b.object_id}`,
      ),
    );
  if (
    new Set(links.map((l) => `${l.object_type}:${l.object_id}`)).size !==
    links.length
  )
    invalid("links", "Do not repeat the same record link.");
  return links;
}
export function classVisibility(alias = "a") {
  return `(${alias}.access_class='RestrictedService' OR (${alias}.access_class='Internal' AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "shared.internal.read")}) OR (${alias}.access_class='RestrictedFinance' AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "shared.finance.read")}))`;
}
export function activityVisibility(alias = "a", withOpportunity = false, withLead = false) {
  return `${scopeSql(`${alias}.company_id`, `${alias}.site_id`, "activity.read")} AND ${scopeSql(`${alias}.company_id`, `${alias}.site_id`)} AND ${classVisibility(alias)}
  AND NOT EXISTS(SELECT 1 FROM ppo.activity_links al WHERE al.workspace_id=${alias}.workspace_id AND al.activity_id=${alias}.id AND NOT (
    (al.object_type='Organisation' AND EXISTS(SELECT 1 FROM ppo.organisations lo WHERE lo.workspace_id=al.workspace_id AND lo.id=al.object_id AND ${visibility("Organisation", "lo")})) OR
    (al.object_type='Site' AND EXISTS(SELECT 1 FROM ppo.sites ls WHERE ls.workspace_id=al.workspace_id AND ls.id=al.object_id AND ${visibility("Site", "ls")})) OR
    (al.object_type='Asset' AND EXISTS(SELECT 1 FROM ppo.assets la WHERE la.workspace_id=al.workspace_id AND la.id=al.object_id AND ${visibility("Asset", "la")})) OR
    ${withLead ? `(al.object_type='Lead' AND EXISTS(SELECT 1 FROM ppo.lead_candidates cl WHERE cl.workspace_id=al.workspace_id AND cl.id=al.object_id AND ${leadVisibility("cl")})) OR` : ""}
    ${withOpportunity ? `(al.object_type='Opportunity' AND EXISTS(SELECT 1 FROM ppo.opportunities co WHERE co.workspace_id=al.workspace_id AND co.id=al.object_id AND ${opportunityVisibility("co")})) OR` : ""}
    (al.object_type='Ticket' AND EXISTS(SELECT 1 FROM ppo.tickets lt WHERE lt.workspace_id=al.workspace_id AND lt.id=al.object_id AND ${ticketVisibility("lt")}))
  ))`;
}
export async function visibleActivity(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  await requireCapability(c, p, "activity.read");
  const row = (
    await c.query(
      `SELECT a.* FROM ppo.activities a WHERE a.workspace_id=$1 AND a.id=$3 AND ${activityVisibility("a", await crmAvailable(c), await leadsAvailable(c))}`,
      [p.workspace_id, p.actor_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return row;
}
export async function validateLinks(
  c: QueryClient,
  p: Principal,
  input: Pick<ActivityInput, "links" | "company_id" | "site_id">,
) {
  for (const l of input.links) {
    const row =
      l.object_type === "Lead" ? await visibleLead(c,p,l.object_id) : l.object_type === "Opportunity"
        ? await visibleOpportunity(c, p, l.object_id)
        : l.object_type === "Ticket"
        ? await visibleTicket(c, p, l.object_id)
        : await visible(c, p, l.object_type as SharedKind, l.object_id);
    if (row.company_id !== input.company_id) throw unavailable();
    if (["Opportunity","Lead"].includes(l.object_type) && row.site_id !== input.site_id) throw unavailable();
    const site = l.object_type === "Site" ? row.id : row.site_id;
    if (
      input.site_id &&
      l.object_type !== "Organisation" &&
      site !== input.site_id
    )
      throw unavailable();
    if (
      input.site_id &&
      l.object_type === "Organisation" &&
      !(
        await c.query(
          "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3",
          [p.workspace_id, input.site_id, l.object_id],
        )
      ).rowCount
    )
      throw unavailable();
  }
}
export async function authoriseActivityInput(
  c: QueryClient,
  p: Principal,
  input: ActivityInput,
) {
  await requireCapability(c, p, "activity.edit");
  await companyContext(c, p, input.company_id, input.site_id, "activity.edit");
  if (
    !(await hasPermission(
      c,
      p,
      "activity.read",
      input.company_id,
      input.site_id ?? undefined,
    ))
  )
    throw unavailable();
  const cap =
    input.access_class === "RestrictedFinance"
      ? "shared.finance.read"
      : input.access_class === "Internal"
        ? "shared.internal.read"
        : null;
  if (
    cap &&
    !(await hasPermission(
      c,
      p,
      cap,
      input.company_id,
      input.site_id ?? undefined,
    ))
  )
    throw unavailable();
  await validateLinks(c, p, input);
  const owner = await scopedOwner(
    c,
    p,
    input.owner_id,
    input.company_id,
    input.site_id ?? undefined,
    "activity.edit",
  );
  if (
    !(await hasPermission(
      c,
      owner,
      "activity.read",
      input.company_id,
      input.site_id ?? undefined,
    )) ||
    (cap &&
      !(await hasPermission(
        c,
        owner,
        cap,
        input.company_id,
        input.site_id ?? undefined,
      )))
  )
    throw unavailable();
  await validateLinks(c, owner, input);
}
export async function insertActivity(
  c: PoolClient,
  p: Principal,
  input: ActivityInput,
) {
  const { links, ...fields } = input;
  const entries = Object.entries({
    ...fields,
    workspace_id: p.workspace_id,
    created_by: p.actor_id,
    updated_by: p.actor_id,
  });
  const row = (
    await c.query(
      `INSERT INTO ppo.activities(${entries.map(([k]) => k).join(",")}) VALUES(${entries.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *,status AS state`,
      entries.map(([, v]) => v),
    )
  ).rows[0];
  for (const l of links)
    await c.query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,$4,$5)",
      [p.workspace_id, input.company_id, input.id, l.object_type, l.object_id],
    );
  return row;
}
export async function createActivity(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "kind",
    "owner_id",
    "summary",
    "due_at",
    "due_needed",
    "access_class",
    "links",
  ]);
  const command = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: optionalId(r.site_id, "site_id"),
    kind: choice(r.kind, "kind", activityKinds),
    owner_id: uuid(r.owner_id, "owner_id"),
    summary: narrative(r.summary, "summary", 2000),
    ...dueFields(r),
    access_class: choice(r.access_class, "access_class", [
      "Internal",
      "RestrictedService",
      "RestrictedFinance",
    ] as const),
    links: parseLinks(r.links),
  };
  if (
    command.kind === "FinanceQuery" &&
    command.access_class !== "RestrictedFinance"
  )
    invalid(
      "access_class",
      "Finance queries require restricted Finance access.",
    );
  return sharedOperation(
    p,
    command,
    "CreateActivity",
    (c) => authoriseActivityInput(c, p, command),
    async (c) => {
      const {
        operation_id: _o,
        schema_version: _s,
        reason: _r,
        ...fields
      } = command;
      void _o;
      void _s;
      void _r;
      return insertActivity(c, p, fields);
    },
    "Activity",
    "ActivityCreated",
  );
}
export async function activityLinks(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<ActivityLink[]> {
  return (
    await c.query(
      "SELECT object_type,object_id FROM ppo.activity_links WHERE workspace_id=$1 AND activity_id=$2 ORDER BY object_type,object_id",
      [p.workspace_id, id],
    )
  ).rows;
}
export async function activityCommand(
  p: Principal,
  id: string,
  input: unknown,
  action: "update" | "start" | "complete" | "cancel",
) {
  const keys =
    action === "update"
      ? ["owner_id", "summary", "due_at", "due_needed"]
      : action === "complete"
        ? ["outcome"]
        : action === "cancel"
          ? ["cancellation_reason"]
          : [];
  const r = object(input, [...commonKeys, "expected_version", ...keys]);
  const changes =
    action === "update"
      ? {
          owner_id: uuid(r.owner_id, "owner_id"),
          summary: narrative(r.summary, "summary", 2000),
          ...dueFields(r),
        }
      : action === "complete"
        ? { outcome: narrative(r.outcome, "outcome") }
        : action === "cancel"
          ? {
              cancellation_reason: narrative(
                r.cancellation_reason,
                "cancellation_reason",
                2000,
              ),
            }
          : {};
  const command = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    ...changes,
  };
  const names = {
    update: ["UpdateActivity", "ActivityUpdated"],
    start: ["StartActivity", "ActivityStarted"],
    complete: ["CompleteActivity", "ActivityCompleted"],
    cancel: ["CancelActivity", "ActivityCancelled"],
  } as const;
  return sharedOperation(
    p,
    command,
    names[action][0],
    async (c) => {
      const a = await visibleActivity(c, p, id);
      if (
        !(await hasPermission(
          c,
          p,
          "activity.edit",
          a.company_id,
          a.site_id ?? undefined,
        ))
      )
        throw new AppError(
          403,
          "Forbidden",
          "This identity cannot change this activity.",
        );
      if (action !== "update" && a.owner_id !== p.actor_id)
        throw new AppError(
          403,
          "ACTIVITY_OWNER_REQUIRED",
          "Only the current owner can start, complete or cancel this activity.",
        );
      if (action === "update")
        await authoriseActivityInput(c, p, {
          ...a,
          ...changes,
          links: await activityLinks(c, p, id),
        });
      return a;
    },
    async (c, a) => {
      if (a.version !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This activity changed. Keep your entries and compare the current version.",
        );
      if (
        !["Open", "InProgress"].includes(a.status) ||
        (action === "start" && a.status !== "Open")
      )
        throw new AppError(
          422,
          "ACTIVITY_STATE_INVALID",
          "This action is unavailable for the current activity state.",
        );
      const state = {
        update: a.status,
        start: "InProgress",
        complete: "Completed",
        cancel: "Cancelled",
      }[action];
      const entries = Object.entries({ ...changes, status: state });
      const row = (
        await c.query(
          `UPDATE ppo.activities SET ${entries.map(([k], i) => `${k}=$${i + 1}`).join(",")},version=version+1,updated_at=clock_timestamp(),updated_by=$${entries.length + 1} WHERE workspace_id=$${entries.length + 2} AND id=$${entries.length + 3} RETURNING *,status AS state`,
          [...entries.map(([, v]) => v), p.actor_id, p.workspace_id, id],
        )
      ).rows[0];
      return {
        ...row,
        audit_details: {
          previous_version: a.version,
          before: {
            status: a.status,
            owner_id: a.owner_id,
            summary: a.summary,
            due_at: a.due_at,
            due_needed: a.due_needed,
          },
          after: { ...changes, status: state },
        },
      };
    },
    "Activity",
    names[action][1],
  );
}
export async function readActivity(p: Principal, id: string) {
  const c = database(),
    a = await visibleActivity(c, p, id);
  const links = [];
  for (const l of await activityLinks(c, p, id)) {
    const row =
      l.object_type === "Lead" ? await visibleLead(c,p,l.object_id) : l.object_type === "Opportunity"
        ? await visibleOpportunity(c, p, l.object_id)
        : l.object_type === "Ticket"
        ? await visibleTicket(c, p, l.object_id)
        : await visible(c, p, l.object_type as SharedKind, l.object_id);
    links.push({
      ...l,
      label: row.display_name ?? row.description ?? row.summary ?? row.title,
      display_number: row.display_number,
    });
  }
  const owner = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, a.owner_id],
    )
  ).rows[0];
  return {
    id: a.id,
    company_id: a.company_id,
    site_id: a.site_id,
    version: a.version,
    kind: a.kind,
    owner_id: a.owner_id,
    owner_name: owner.display_name,
    summary: a.summary,
    status: a.status,
    due_at: a.due_at?.toISOString() ?? null,
    due_needed: a.due_needed,
    outcome: a.outcome,
    cancellation_reason: a.cancellation_reason,
    access_class: a.access_class,
    updated_at: a.updated_at.toISOString(),
    synthetic: true,
    links,
    can_edit:
      ["Open", "InProgress"].includes(a.status) &&
      (await hasPermission(
        c,
        p,
        "activity.edit",
        a.company_id,
        a.site_id ?? undefined,
      )),
    can_complete:
      ["Open", "InProgress"].includes(a.status) &&
      a.owner_id === p.actor_id &&
      (await hasPermission(
        c,
        p,
        "activity.edit",
        a.company_id,
        a.site_id ?? undefined,
      )),
  };
}
export async function listActivities(p: Principal, input: unknown = {}) {
  const c = database();
  await requireCapability(c, p, "activity.read");
  const r = object(input, [
    "limit",
    "cursor",
    "q",
    "company_id",
    "site_id",
    "owner_id",
    "status",
    "kind",
    "due",
    "object_type",
    "object_id",
  ]);
  const filters = {
    owner_id: optionalId(r.owner_id, "owner_id"),
    status:
      r.status === undefined
        ? null
        : choice(r.status, "status", [...activityStates, "Active"]),
    kind: r.kind === undefined ? null : choice(r.kind, "kind", activityKinds),
    due:
      r.due === undefined
        ? null
        : choice(r.due, "due", ["Overdue", "Upcoming", "Needed"]),
    object_type:
      r.object_type === undefined
        ? null
        : choice(r.object_type, "object_type", linkKinds),
    object_id: optionalId(r.object_id, "object_id"),
  };
  if ((filters.object_type === null) !== (filters.object_id === null))
    invalid("object_id", "Choose both a linked type and record.");
  if (filters.object_id) {
    if (filters.object_type === "Lead") await visibleLead(c,p,filters.object_id);
    else if (filters.object_type === "Opportunity")
      await visibleOpportunity(c, p, filters.object_id);
    else if (filters.object_type === "Ticket")
      await visibleTicket(c, p, filters.object_id);
    else
      await visible(c, p, filters.object_type as SharedKind, filters.object_id);
  }
  const pg = page(
    Object.fromEntries(
      Object.entries(r).filter(([k]) =>
        ["limit", "cursor", "q", "company_id", "site_id"].includes(k),
      ),
    ),
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      resource: "Activity",
      ...filters,
    },
  );
  const rows = (
    await c.query(
      `SELECT a.id FROM ppo.activities a WHERE a.workspace_id=$1 AND ${activityVisibility("a", await crmAvailable(c), await leadsAvailable(c))}
    AND ($3::uuid IS NULL OR a.company_id=$3) AND ($4::uuid IS NULL OR a.site_id=$4) AND ($5::uuid IS NULL OR a.id>$5)
    AND position(lower($6) in lower(a.summary))>0 AND ($7::uuid IS NULL OR a.owner_id=$7)
    AND ($8::text IS NULL OR a.status=$8 OR ($8='Active' AND a.status IN ('Open','InProgress')))
    AND ($9::text IS NULL OR a.kind=$9)
    AND ($10::text IS NULL OR ($10='Needed' AND a.due_needed) OR ($10='Overdue' AND a.due_at<clock_timestamp()) OR ($10='Upcoming' AND a.due_at>=clock_timestamp()))
    AND ($11::text IS NULL OR EXISTS(SELECT 1 FROM ppo.activity_links f WHERE f.workspace_id=a.workspace_id AND f.activity_id=a.id AND f.object_type=$11 AND f.object_id=$12)) ORDER BY a.id LIMIT $13`,
      [
        p.workspace_id,
        p.actor_id,
        pg.company_id,
        pg.site_id,
        pg.after,
        pg.q,
        filters.owner_id,
        filters.status,
        filters.kind,
        filters.due,
        filters.object_type,
        filters.object_id,
        pg.limit + 1,
      ],
    )
  ).rows;
  return envelope(
    await Promise.all(
      rows.slice(0, pg.limit).map((a) => readActivity(p, a.id)),
    ),
    rows.length > pg.limit ? pg.cursor(rows[pg.limit - 1].id) : null,
  );
}
