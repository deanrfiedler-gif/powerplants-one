import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  optionalId,
  narrative,
  instant,
  invalid,
} from "../shared/validation";
import {
  visibleActivity,
  activityLinks,
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
  type ActivityLink,
} from "../activities/activities";
import { visibleLead, leadAuthority } from "../crm/leads/context";
import {
  currentResolution,
  visibleCustomerContext,
} from "../crm/leads/resolution-context";
import { visibleOpportunity, opportunityAuthority } from "../crm/context";
import { projectRow } from "../projects/service";
import { visibleTicket } from "../service/tickets";
import { conflict, hashBasis } from "./handover-service";

export type SalesTargetKind = "Lead" | "Opportunity";
const refused = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
const salesKind = (v: string): v is SalesTargetKind =>
  v === "Lead" || v === "Opportunity";
async function originalSourceVisible(
  c: QueryClient,
  p: Principal,
  id: string,
  seen = new Set<string>(),
): Promise<void> {
  if (seen.has(id) || seen.size >= 32) throw unavailable();
  seen.add(id);
  await visibleActivity(c, p, id);
  const prior = (
    await c.query<{ id: string }>(
      "SELECT details->>'source_activity_id' id FROM ppo.audit_events WHERE workspace_id=$1 AND object_type='Activity' AND object_id=$2 AND outcome='Accepted' AND details->>'command'='SalesFollowup:CreateReview' ORDER BY occurred_at LIMIT 1",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (prior) await originalSourceVisible(c, p, prior.id, seen);
}
async function target(
  c: QueryClient,
  p: Principal,
  kind: SalesTargetKind,
  id: string,
  edit = false,
) {
  if (kind === "Lead") {
    const l = edit
      ? await leadAuthority(c, p, id)
      : await visibleLead(c, p, id);
    const resolution = await currentResolution(c, p, id);
    if (resolution) await visibleCustomerContext(c, p, resolution);
    const customer = resolution?.organisation_id ?? l.organisation_id;
    const organisation = customer
      ? await visible(c, p, "Organisation", customer)
      : null;
    return {
      kind,
      id: l.id,
      version: l.version,
      company_id: l.company_id,
      site_id: l.site_id,
      customer_id: customer,
      customer_name: organisation?.display_name ?? null,
      title: l.title,
      display_number: l.display_number,
      owner_id: l.owner_id,
      state: l.status,
      eligible:
        !l.is_archived &&
        ["New", "Contacting", "Nurturing"].includes(l.status) &&
        (!resolution || resolution.site_id === l.site_id),
    };
  }
  const o = edit
    ? await opportunityAuthority(c, p, id, "crm.opportunity.edit")
    : await visibleOpportunity(c, p, id);
  const organisation = await visible(c, p, "Organisation", o.organisation_id);
  return {
    kind,
    id: o.id,
    version: o.version,
    company_id: o.company_id,
    site_id: o.site_id,
    customer_id: o.organisation_id,
    customer_name: organisation.display_name,
    title: o.title,
    display_number: o.display_number,
    owner_id: o.owner_id,
    state: o.close_outcome,
    eligible: o.close_outcome === "Open",
  };
}
type Target = Awaited<ReturnType<typeof target>>;
async function source(c: QueryClient, p: Principal, id: string) {
  const a = await visibleActivity(c, p, id),
    links = await activityLinks(c, p, id),
    customers = new Set<string>();
  const sources: { kind: string; id: string; label: string }[] = [];
  for (const l of links) {
    if (l.object_type === "Project") {
      const r = await projectRow(c, p, l.object_id);
      customers.add(r.organisation_id);
      sources.push({
        kind: l.object_type,
        id: r.id,
        label: `${r.display_number} · ${r.title}`,
      });
    } else if (l.object_type === "Organisation") {
      const r = await visible(c, p, "Organisation", l.object_id);
      customers.add(r.id);
      sources.push({ kind: l.object_type, id: r.id, label: r.display_name });
    } else if (salesKind(l.object_type)) {
      const r = await target(c, p, l.object_type, l.object_id);
      if (r.customer_id) customers.add(r.customer_id);
      sources.push({
        kind: l.object_type,
        id: r.id,
        label: `${r.display_number} · ${r.title}`,
      });
    } else {
      const r =
        l.object_type === "Ticket"
          ? await visibleTicket(c, p, l.object_id)
          : await visible(c, p, l.object_type, l.object_id);
      sources.push({
        kind: l.object_type,
        id: l.object_id,
        label: r.display_name ?? r.summary ?? r.display_number,
      });
    }
  }
  const site = a.site_id ? await visible(c, p, "Site", a.site_id) : null;
  const customerId = customers.size === 1 ? [...customers][0] : null;
  const customer = customerId
    ? await visible(c, p, "Organisation", customerId)
    : null;
  const snapshot = {
    id: a.id as string,
    version: a.version as number,
    company_id: a.company_id as string,
    site_id: a.site_id as string | null,
    owner_id: a.owner_id as string,
    kind: a.kind as ActivityInput["kind"],
    summary: a.summary as string,
    status: a.status as string,
    access_class: a.access_class as ActivityInput["access_class"],
    due_at: (a.due_at?.toISOString() as string | null) ?? null,
    due_needed: a.due_needed as boolean,
    activity_type: a.activity_type as ActivityInput["activity_type"],
    starts_at: (a.starts_at?.toISOString() as string | null) ?? null,
    due_date_only: a.due_date_only as boolean,
    links,
  };
  const original = (
    await c.query<{
      details: { source_activity_id: string; source_snapshot: typeof snapshot };
    }>(
      "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND object_type='Activity' AND object_id=$2 AND outcome='Accepted' AND details->>'command'='SalesFollowup:CreateReview' ORDER BY occurred_at LIMIT 1",
      [p.workspace_id, id],
    )
  ).rows[0];
  // A separately worded Internal review remains readable; restricted provenance
  // cannot be used as authority for another continuation or disclosed in history.
  let origin:
    | { access: "Available"; snapshot: typeof snapshot }
    | { access: "Restricted" }
    | null = null;
  if (original)
    try {
      await originalSourceVisible(c, p, original.details.source_activity_id);
      origin = {
        access: "Available",
        snapshot: original.details.source_snapshot,
      };
    } catch (e) {
      if (!refused(e)) throw e;
      origin = { access: "Restricted" };
    }
  return {
    a,
    snapshot,
    links,
    sources,
    customers: [...customers],
    customer_id: customerId,
    customer_name: customer?.display_name ?? null,
    site_name: site?.display_name ?? null,
    source_hash: hashBasis({ snapshot, customers: [...customers].sort() }),
    origin,
  };
}
type Source = Awaited<ReturnType<typeof source>>;
const eligible = (s: Source) =>
  s.snapshot.access_class === "Internal" &&
  ["CustomerContact", "RelationshipReview"].includes(s.snapshot.kind) &&
  ["Open", "InProgress"].includes(s.snapshot.status) &&
  !!s.snapshot.due_at &&
  !s.snapshot.due_needed &&
  s.origin?.access !== "Restricted";
const alreadySales = (s: Source) =>
  s.links.some((l) => salesKind(l.object_type));
async function compatible(c: QueryClient, p: Principal, s: Source, t: Target) {
  if (
    t.company_id !== s.snapshot.company_id ||
    t.site_id !== s.snapshot.site_id ||
    !t.customer_id ||
    s.customers.some((id) => id !== t.customer_id)
  )
    throw unavailable();
  if (
    t.site_id &&
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND organisation_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [p.workspace_id, t.company_id, t.site_id, t.customer_id],
      )
    ).rowCount
  )
    throw unavailable();
}
async function canEdit(c: QueryClient, p: Principal, s: Source) {
  return (
    s.snapshot.owner_id === p.actor_id &&
    (await hasPermission(
      c,
      p,
      "activity.edit",
      s.snapshot.company_id,
      s.snapshot.site_id ?? undefined,
    )) &&
    (await hasPermission(
      c,
      p,
      "shared.internal.read",
      s.snapshot.company_id,
      s.snapshot.site_id ?? undefined,
    ))
  );
}
export async function followupReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<{
      details: {
        command: string;
        destination_kind?: SalesTargetKind;
        destination_id?: string;
        source_activity_id?: string;
      };
    }>(
      "SELECT details FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_type='Activity' AND object_id=$4 AND outcome='Accepted'",
      [p.workspace_id, p.actor_id, operation, id],
    )
  ).rows[0];
  if (!e) throw unavailable();
  const s = await source(c, p, id);
  await companyContext(
    c,
    p,
    s.snapshot.company_id,
    s.snapshot.site_id,
    "activity.edit",
  );
  if (s.origin?.access === "Restricted") throw unavailable();
  if (e.details.command === "SalesFollowup:CreateReview") {
    if (!e.details.source_activity_id) throw unavailable();
    await visibleActivity(c, p, e.details.source_activity_id);
  } else if (e.details.command === "SalesFollowup:Link") {
    const kind = e.details.destination_kind,
      targetId = e.details.destination_id;
    if (
      !kind ||
      !targetId ||
      !s.links.some((l) => l.object_type === kind && l.object_id === targetId)
    )
      throw unavailable();
    const t = await target(c, p, kind, targetId);
    await companyContext(
      c,
      p,
      t.company_id,
      t.site_id,
      kind === "Lead" ? "crm.lead.edit" : "crm.opportunity.edit",
    );
  } else throw unavailable();
  return s;
}
function sourceInput(value: unknown, extra: string[]) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "source_hash",
    ...extra,
  ]);
  if (
    typeof r.source_hash !== "string" ||
    !/^[a-f0-9]{64}$/.test(r.source_hash)
  )
    invalid("source_hash", "Review the exact Activity context.");
  return {
    r,
    base: {
      ...common(r),
      expected_version: version(r.expected_version),
      source_hash: String(r.source_hash),
    },
  };
}
export async function linkSalesFollowup(
  p: Principal,
  id: string,
  value: unknown,
) {
  const { r, base } = sourceInput(value, [
    "destination_kind",
    "destination_id",
    "expected_destination_version",
    "existing_checked",
  ]);
  if (r.existing_checked !== true)
    invalid(
      "existing_checked",
      "Review the existing Sales records before linking this need.",
    );
  const cmd = {
    ...base,
    id: uuid(id, "id"),
    destination_kind: choice(r.destination_kind, "destination_kind", [
      "Lead",
      "Opportunity",
    ]),
    destination_id: uuid(r.destination_id, "destination_id"),
    expected_destination_version: version(r.expected_destination_version),
    existing_checked: true,
  };
  return sharedOperation(
    p,
    cmd,
    "SalesFollowup:Link",
    async (c) => {
      await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
        p.workspace_id,
      ]);
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, cmd.operation_id],
          )
        ).rowCount
      )
        return followupReceiptAuthority(c, p, id, cmd.operation_id);
      return source(c, p, id);
    },
    async (c, s) => {
      if (!eligible(s) || !(await canEdit(c, p, s))) throw unavailable();
      if (alreadySales(s))
        conflict(
          "This Activity already has a Sales destination. Open that record, or prepare a separate owned review for a different need.",
        );
      if (
        s.snapshot.version !== cmd.expected_version ||
        s.source_hash !== cmd.source_hash
      )
        conflict(
          "The reviewed Activity changed. Discard and compare its current owner, date and source links.",
        );
      const t = await target(
        c,
        p,
        cmd.destination_kind,
        cmd.destination_id,
        true,
      );
      await compatible(c, p, s, t);
      if (
        !t.eligible ||
        t.owner_id !== p.actor_id ||
        t.version !== cmd.expected_destination_version
      )
        conflict(
          "The Sales destination changed or is no longer open under your ownership. Review its current context.",
        );
      const links: ActivityLink[] = [
        ...s.links,
        { object_type: t.kind, object_id: t.id },
      ];
      if (links.length > 10)
        invalid(
          "links",
          "This Activity has reached its native link limit; prepare a separate owned review.",
        );
      await authoriseActivityInput(c, p, { ...s.snapshot, links });
      await c.query(
        "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,$4,$5)",
        [p.workspace_id, s.snapshot.company_id, id, t.kind, t.id],
      );
      const updated = (
        await c.query(
          "UPDATE ppo.activities SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING version,updated_at",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return {
        id,
        version: updated.version,
        updated_at: updated.updated_at,
        state: "SalesFollowupLinked",
        audit_details: {
          source_snapshot: s.snapshot,
          source_hash: s.source_hash,
          destination_kind: t.kind,
          destination_id: t.id,
          destination_version: t.version,
          destination_customer_id: t.customer_id,
          destination_site_id: t.site_id,
          existing_checked: true,
        },
      };
    },
    "Activity",
    "ActivityUpdated",
  );
}
export async function createSalesReview(
  p: Principal,
  sourceId: string,
  value: unknown,
) {
  const { r, base } = sourceInput(value, [
    "id",
    "summary",
    "due_at",
    "wording_reviewed",
  ]);
  if (r.wording_reviewed !== true)
    invalid(
      "wording_reviewed",
      "Review the wording for a separate Internal Sales follow-up.",
    );
  const cmd = {
    ...base,
    id: uuid(r.id, "id"),
    source_activity_id: uuid(sourceId, "source_activity_id"),
    summary: narrative(r.summary, "summary", 2000),
    due_at: instant(r.due_at, "due_at"),
    wording_reviewed: true,
  };
  return sharedOperation(
    p,
    cmd,
    "SalesFollowup:CreateReview",
    async (c) => {
      await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
        p.workspace_id,
      ]);
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, cmd.operation_id],
          )
        ).rowCount
      )
        await followupReceiptAuthority(c, p, cmd.id, cmd.operation_id);
      return source(c, p, sourceId);
    },
    async (c, s) => {
      if (
        s.snapshot.access_class === "RestrictedFinance" ||
        s.origin?.access === "Restricted"
      )
        throw unavailable();
      if (
        s.snapshot.version !== cmd.expected_version ||
        s.source_hash !== cmd.source_hash
      )
        conflict(
          "The original Activity changed. Compare it before preparing a separate review.",
        );
      const links = s.links.filter((l) => !salesKind(l.object_type));
      if (!links.length) {
        if (s.customer_id)
          links.push({ object_type: "Organisation", object_id: s.customer_id });
        if (s.snapshot.site_id)
          links.push({ object_type: "Site", object_id: s.snapshot.site_id });
      }
      if (!links.length)
        invalid(
          "source",
          "Resolve a native customer or site source before preparing this review.",
        );
      const input: ActivityInput = {
        id: cmd.id,
        company_id: s.snapshot.company_id,
        site_id: s.snapshot.site_id,
        kind: "RelationshipReview",
        owner_id: p.actor_id,
        summary: cmd.summary,
        due_at: cmd.due_at,
        due_needed: false,
        access_class: "Internal",
        links,
      };
      await authoriseActivityInput(c, p, input);
      const a = await insertActivity(c, p, input);
      return {
        ...a,
        audit_details: {
          source_activity_id: sourceId,
          source_snapshot: s.snapshot,
          source_hash: s.source_hash,
          wording_reviewed: true,
        },
      };
    },
    "Activity",
    "ActivityCreated",
  );
}
export async function readSalesFollowup(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const r = object(query, ["kind", "destination_id", "q"]),
    kind =
      r.kind === undefined
        ? "Lead"
        : choice(r.kind, "kind", ["Lead", "Opportunity"]),
    selected = optionalId(r.destination_id, "destination_id");
  if (r.q !== undefined && (typeof r.q !== "string" || r.q.length > 200))
    invalid("q", "Search up to 200 characters.");
  const search = String(r.q ?? "")
    .trim()
    .toLowerCase();
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const s = await source(c, p, id),
      ready = eligible(s) && !alreadySales(s) && (await canEdit(c, p, s));
    const existing = [];
    for (const l of s.links.filter((l) => salesKind(l.object_type)))
      existing.push(
        await target(c, p, l.object_type as SalesTargetKind, l.object_id),
      );
    const options: Target[] = [];
    const candidates = ready
      ? (
          await c.query<{ id: string }>(
            `SELECT id FROM ppo.${kind === "Lead" ? "lead_candidates" : "opportunities"} WHERE workspace_id=$1 AND company_id=$2 AND site_id IS NOT DISTINCT FROM $3 AND owner_id=$4 AND ($5='' OR position($5 in lower(display_number||' '||title||' '||id::text))>0) ORDER BY id LIMIT 51`,
            [
              p.workspace_id,
              s.snapshot.company_id,
              s.snapshot.site_id,
              p.actor_id,
              search,
            ],
          )
        ).rows
      : [];
    for (const item of candidates)
      try {
        const t = await target(c, p, kind, item.id);
        await compatible(c, p, s, t);
        if (t.eligible) options.push(t);
      } catch (e) {
        if (!refused(e)) throw e;
      }
    let candidate: Target | null = null,
      restricted = false;
    if (selected)
      try {
        candidate = await target(c, p, kind, selected);
        await compatible(c, p, s, candidate);
      } catch (e) {
        if (!refused(e)) throw e;
        candidate = null;
        restricted = true;
      }
    const createCap =
      kind === "Lead" ? "crm.lead.edit" : "crm.opportunity.create";
    const can_create =
      ready &&
      (await hasPermission(
        c,
        p,
        createCap,
        s.snapshot.company_id,
        s.snapshot.site_id ?? undefined,
      )) &&
      (await hasPermission(
        c,
        p,
        kind === "Lead" ? "crm.lead.read" : "crm.opportunity.read",
        s.snapshot.company_id,
        s.snapshot.site_id ?? undefined,
      ));
    const can_review =
      s.snapshot.access_class !== "RestrictedFinance" &&
      s.origin?.access !== "Restricted" &&
      (await hasPermission(
        c,
        p,
        "activity.edit",
        s.snapshot.company_id,
        s.snapshot.site_id ?? undefined,
      )) &&
      (await hasPermission(
        c,
        p,
        "shared.internal.read",
        s.snapshot.company_id,
        s.snapshot.site_id ?? undefined,
      ));
    const history = (
      await c.query<{
        operation_id: string;
        reason: string;
        occurred_at: Date;
        details: {
          source_snapshot: Source["snapshot"];
          destination_kind: SalesTargetKind;
          destination_id: string;
          destination_version: number;
        };
      }>(
        "SELECT operation_id,reason,occurred_at,details FROM ppo.audit_events WHERE workspace_id=$1 AND object_type='Activity' AND object_id=$2 AND outcome='Accepted' AND details->>'command'='SalesFollowup:Link' ORDER BY occurred_at",
        [p.workspace_id, id],
      )
    ).rows;
    const owner = (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, s.snapshot.owner_id],
      )
    ).rows[0];
    return {
      owner_name: owner.display_name,
      activity: s.snapshot,
      source_hash: s.source_hash,
      sources: s.sources,
      customer_id: s.customer_id,
      customer_name: s.customer_name,
      site_name: s.site_name,
      origin: s.origin,
      existing,
      options: options.slice(0, 20),
      more: options.length > 20 || candidates.length === 51,
      candidate,
      restricted,
      ready,
      can_create,
      can_review,
      can_link:
        ready &&
        !!candidate &&
        candidate.eligible &&
        candidate.owner_id === p.actor_id &&
        (await hasPermission(
          c,
          p,
          kind === "Lead" ? "crm.lead.edit" : "crm.opportunity.edit",
          candidate.company_id,
          candidate.site_id ?? undefined,
        )),
      kind,
      history: history.map((e) => ({
        operation_id: e.operation_id,
        reason: e.reason,
        recorded_at: e.occurred_at.toISOString(),
        compared_activity_version: e.details.source_snapshot.version,
        destination_kind: e.details.destination_kind,
        destination_id: e.details.destination_id,
        compared_destination_version: e.details.destination_version,
      })),
    };
  });
}
