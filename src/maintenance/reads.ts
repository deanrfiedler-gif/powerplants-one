import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import {
  requireCapability,
  hasPermission,
  scopeSql,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { visible, visibility } from "../shared/reads";
import { object, invalid } from "../shared/validation";
import { agreementCurrentness } from "./model";
import { companyContext } from "../shared/authority";
import { visibleTicket } from "../service/tickets";
import { reportContext } from "../reports/context";
import { currentAssessment } from "./assessments";
import { planRevision } from "./plans";
import { latestPlan, warrantyCapability } from "./warranty";
import { recoveryCapability } from "./recovery";
import {
  agreementRevision,
  assetSnapshot,
  can,
  families,
  hash,
  history,
  record,
  type Family,
  type Base,
  type Agreement,
  type Plan,
  type Occurrence,
  type Assessment,
  type Renewal,
  type WarrantyCase,
  type Claim,
} from "./context";

export type WorklistRow = {
  id: string;
  reference: string;
  title: string;
  customer: string;
  site: string;
  state: string;
  owner: string;
  due: string | null;
  version: number;
  href: string;
  asset: string | null;
  next_action: string | null;
  customer_outcome: string | null;
  recovery: string | null;
  coverage: string | null;
};
export const routeFor = (family: Family, id?: string) =>
  `${family === "cases" ? "/warranty/cases" : family === "recovery" ? "/warranty/supplier-recovery" : `/maintenance/${family}`}${id ? `/${id}` : ""}`;
export async function summary(
  c: QueryClient,
  p: Principal,
  family: Family,
  id: string,
): Promise<WorklistRow> {
  const row = await record(c, p, family, id);
  const customer = await visible(c, p, "Organisation", row.customer_id),
    site = row.site_id ? await visible(c, p, "Site", row.site_id) : null;
  const user = (
    await c.query<{ display_name: string }>(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, row.owner_id],
    )
  ).rows[0];
  let state = row.state,
    title = row.reference,
    due: string | null = null,
    asset: string | null = null,
    next_action: string | null = null,
    customer_outcome: string | null = null,
    recovery: string | null = null,
    coverage: string | null = null;
  if (family === "agreements") {
    const a = await agreementRevision(
      c,
      p,
      (row as Agreement).current_revision_id,
    );
    title = a.revision.content.title;
    due = a.revision.content.effective_to;
    state = agreementCurrentness(
      a.row.state,
      a.revision.content,
      new Date().toISOString().slice(0, 10),
    );
  }
  if (family === "plans") {
    const v = await planRevision(c, p, (row as Plan).current_revision_id);
    title = v.content.title;
    due = (
      await c.query<{ due: string | null }>(
        "SELECT min(target_date)::text AS due FROM ppo.maintenance_occurrences WHERE workspace_id=$1 AND plan_id=$2 AND state IN ('Open','Deferred','WorkRequested','Partial')",
        [p.workspace_id, id],
      )
    ).rows[0].due;
    const a = await assetSnapshot(c, p, (row as Plan).asset_id);
    if (
      a.version !== (row as Plan).asset_version ||
      a.lifecycle_status !== "Active"
    )
      state = "ReviewRequired";
  }
  if (family === "due") {
    const o = row as Occurrence;
    due = o.target_date;
    title = `Maintenance due ${o.original_due}`;
    const a = await assetSnapshot(c, p, o.asset_id);
    if (
      hash(a) !== hash(o.asset_snapshot) &&
      !["Completed", "Skipped", "Cancelled"].includes(o.state)
    )
      next_action = "Equipment changed — review original obligation";
  }
  if (family === "coverage") {
    const a = row as Assessment;
    state = a.status;
    title = a.basis;
    due = a.review_due;
    next_action = a.next_action;
    try {
      await currentAssessment(c, p, a.id);
    } catch (e) {
      if (e instanceof AppError && e.status === 409) state = "Historical";
      else throw e;
    }
  }
  if (family === "renewals") {
    const r = row as Renewal;
    await agreementRevision(c, p, r.agreement_revision_id);
    due = r.next_date;
    next_action = r.next_action;
    title = r.proposal ?? "Relationship and Service review";
  }
  if (family === "cases") {
    const w = row as WarrantyCase;
    title = w.symptoms;
    due = w.next_review;
    next_action = w.next_action;
    customer_outcome = w.state;
    const decision = (
      await c.query<{ id: string; status: string }>(
        "SELECT id,status FROM ppo.entitlement_assessments WHERE workspace_id=$1 AND warranty_case_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1",
        [p.workspace_id, id],
      )
    ).rows[0];
    coverage = decision?.status ?? "Not assessed";
    if (decision)
      try {
        await currentAssessment(c, p, decision.id);
      } catch (e) {
        if (e instanceof AppError && e.status === 409)
          coverage = "Review required";
        else if (e instanceof AppError && [403, 404].includes(e.status))
          coverage = "Restricted";
        else throw e;
      }

    const claim = (
      await c.query<{ id: string; state: string }>(
        "SELECT id,state FROM ppo.supplier_claims WHERE workspace_id=$1 AND case_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0];
    recovery = claim?.state ?? "No claim";
    if (claim)
      try {
        await record(c, p, "recovery", claim.id);
      } catch (e) {
        if (e instanceof AppError && [403, 404].includes(e.status))
          recovery = "Restricted";
        else throw e;
      }
  }
  if (family === "recovery") {
    const r = row as Claim;
    title = r.scope;
    due = r.due_date;
    customer_outcome = (await record<WarrantyCase>(c, p, "cases", r.case_id))
      .state;
    recovery = `${r.currency} ${Number(r.claimed_minor) - Number(r.credited_minor) - Number(r.unrecovered_minor)} minor units unresolved`;
  }
  if ("asset_id" in row && typeof row.asset_id === "string") {
    const a = await assetSnapshot(c, p, row.asset_id);
    asset = `${a.description} / Serial ${a.serial ?? "not established"}`;
  }
  return {
    id,
    reference: row.reference,
    title,
    customer: customer.display_name,
    site: site?.display_name ?? "Multiple covered sites",
    state,
    owner: user?.display_name ?? "Unknown",
    due,
    version: row.version,
    href: routeFor(family, id),
    asset,
    next_action,
    customer_outcome,
    recovery,
    coverage,
  };
}
export async function register(
  p: Principal,
  family: Family,
  input: unknown = {},
) {
  const q = object(input, ["q", "state", "sort", "page", "customer_id"]),
    c = database();
  await requireCapability(c, p, families[family].read);
  const search = String(q.q ?? "");
  if (search.length > 200) invalid("q", "Use at most 200 characters.");
  const page = Number(q.page ?? 1);
  if (!Number.isInteger(page) || page < 1 || page > 100)
    invalid("page", "Choose a valid page.");
  const candidates = (
    await c.query<{ id: string }>(
      `SELECT id FROM ppo.${families[family].table} r WHERE workspace_id=$1 AND ($2::uuid IS NULL OR customer_id=$2) ORDER BY updated_at DESC,id LIMIT 201`,
      [p.workspace_id, q.customer_id ?? null],
    )
  ).rows;
  // Candidates are bounded; inaccessible rows never contribute a count or label.
  const permitted: WorklistRow[] = [];
  for (const row of candidates.slice(0, 200))
    try {
      permitted.push(await summary(c, p, family, row.id));
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  const items = permitted.filter(
    (x) =>
      (!q.state || x.state === q.state) &&
      (!search ||
        [
          x.reference,
          x.title,
          x.customer,
          x.site,
          x.asset,
          x.owner,
          x.next_action,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  items.sort((a, b) =>
    q.sort === "customer"
      ? a.customer.localeCompare(b.customer)
      : q.sort === "reference"
        ? a.reference.localeCompare(b.reference)
        : (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
          a.reference.localeCompare(b.reference),
  );
  return {
    items: items.slice((page - 1) * 30, page * 30),
    total: permitted.length,
    filtered: items.length,
    page,
    completeness:
      candidates.length > 200
        ? "Partial: first 200 source candidates"
        : "Complete",
    states: [...new Set(permitted.map((x) => x.state))].sort(),
    can_create: await hasPermission(c, p, families[family].edit),
    observed_at: new Date().toISOString(),
  };
}
export async function workspace(p: Principal, family: Family, id: string) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const row = await record(c, p, family, id),
      events = await history(c, p, id),
      heading = await summary(c, p, family, id);
    const sources: Record<string, unknown> = {};
    if (family === "agreements")
      sources.revisions = (
        await c.query(
          "SELECT * FROM ppo.agreement_revisions WHERE workspace_id=$1 AND agreement_id=$2 ORDER BY revision DESC",
          [p.workspace_id, id],
        )
      ).rows;
    if (family === "plans") {
      sources.revisions = (
        await c.query(
          "SELECT * FROM ppo.maintenance_plan_revisions WHERE workspace_id=$1 AND plan_id=$2 ORDER BY revision DESC",
          [p.workspace_id, id],
        )
      ).rows;
      sources.asset = await assetSnapshot(c, p, (row as Plan).asset_id);
    }
    if (family === "due") {
      sources.plan = await planRevision(
        c,
        p,
        (row as Occurrence).plan_revision_id,
      );
      sources.asset = await assetSnapshot(c, p, (row as Occurrence).asset_id);
    }
    if (family === "coverage") {
      const a = row as Assessment;
      sources.context = a.context;
      try {
        await currentAssessment(c, p, a.id);
        sources.current = true;
      } catch (e) {
        if (e instanceof AppError && e.status === 409) sources.current = false;
        else throw e;
      }
    }
    if (family === "renewals") {
      const r = row as Renewal;
      sources.agreement = await agreementRevision(
        c,
        p,
        r.agreement_revision_id,
      );
      sources.service_history = await serviceHistory(c, p, r);
    }
    if (family === "cases") {
      const w = row as WarrantyCase;
      sources.asset = await assetSnapshot(c, p, w.asset_id);
      sources.plan = await latestPlan(c, p, id);
      for (const [key, table, order] of [
        ["evidence", "warranty_evidence", "revision"],
        ["plans", "warranty_resolution_plans", "revision"],
        ["updates", "warranty_customer_updates", "revision"],
        ["responses", "warranty_customer_responses", "created_at"],
      ])
        sources[key] = (
          await c.query(
            `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND case_id=$2 ORDER BY ${order} DESC`,
            [p.workspace_id, id],
          )
        ).rows;
      const assessments = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.entitlement_assessments WHERE workspace_id=$1 AND warranty_case_id=$2 ORDER BY created_at DESC",
          [p.workspace_id, id],
        )
      ).rows;
      sources.assessments = [];
      for (const a of assessments)
        (sources.assessments as unknown[]).push(
          await record(c, p, "coverage", a.id),
        );
      const claims = (
        await c.query<{ id: string }>(
          "SELECT id FROM ppo.supplier_claims WHERE workspace_id=$1 AND case_id=$2",
          [p.workspace_id, id],
        )
      ).rows;
      sources.claims = [];
      for (const r of claims)
        (sources.claims as unknown[]).push(
          await record(c, p, "recovery", r.id),
        );
    }
    if (family === "recovery") {
      sources.case = await record(c, p, "cases", (row as Claim).case_id);
      sources.credits = (
        await c.query(
          "SELECT * FROM ppo.supplier_credit_evidence WHERE workspace_id=$1 AND claim_id=$2 ORDER BY created_at",
          [p.workspace_id, id],
        )
      ).rows;
      sources.sc08 = {
        state: "Unavailable",
        message:
          "Native Supply Chain returns receiving is not available. Retain external evidence; no stock or custody transaction is created.",
      };
    }
    if (family === "due" || family === "cases") {
      const requests = (
        await c.query(
          `SELECT q.* FROM ppo.maintenance_work_requests q LEFT JOIN ppo.warranty_resolution_plans r ON (r.workspace_id,r.id)=(q.workspace_id,q.resolution_plan_id) WHERE q.workspace_id=$1 AND ${family === "due" ? "q.occurrence_id=$2" : "r.case_id=$2"} ORDER BY q.created_at DESC`,
          [p.workspace_id, id],
        )
      ).rows;
      sources.requests = [];
      sources.results = [];
      sources.service_access = "Available";
      for (const request of requests)
        try {
          await visibleTicket(c, p, request.ticket_id);
          (sources.requests as unknown[]).push(request);
          const results = (
            await c.query(
              "SELECT r.*,v.report_id FROM ppo.maintenance_service_results r JOIN ppo.report_revisions v ON (v.workspace_id,v.id)=(r.workspace_id,r.report_revision_id) WHERE r.workspace_id=$1 AND r.request_id=$2 ORDER BY r.created_at DESC",
              [p.workspace_id, request.id],
            )
          ).rows;
          for (const result of results)
            try {
              await reportContext(c, p, result.report_id);
              (sources.results as unknown[]).push(result);
            } catch (e) {
              if (!(e instanceof AppError && [403, 404].includes(e.status)))
                throw e;
              sources.service_access = "Restricted";
            }
        } catch (e) {
          if (!(e instanceof AppError && [403, 404].includes(e.status)))
            throw e;
          sources.service_access = "Restricted";
        }
    }
    const actions: Record<string, boolean> = {};
    for (const cap of [
      ...new Set([
        families[family].edit,
        "maintenance.assess",
        "maintenance.agreement.approve",
        "warranty.assess",
        "warranty.goodwill",
        "warranty.recovery",
        "service.scope.authorise",
        "service.ticket.edit",
        "finance.reconcile",
      ] as Capability[]),
    ])
      actions[cap] = await can(c, p, row, cap);
    return {
      family,
      row,
      heading,
      history: events,
      sources,
      actions,
      observed_at: new Date().toISOString(),
    };
  });
}
async function serviceHistory(c: QueryClient, p: Principal, row: Base) {
  if (
    !(await hasPermission(
      c,
      p,
      "service.ticket.read",
      row.company_id,
      row.site_id ?? undefined,
    ))
  )
    return { state: "Restricted", items: [] };
  const items = (
    await c.query(
      `SELECT id,display_number,summary,status,next_action FROM ppo.tickets t WHERE workspace_id=$1 AND company_id=$3 AND site_id=$4 AND ${scopeSql("t.company_id", "t.site_id", "service.ticket.read")} ORDER BY updated_at DESC LIMIT 31`,
      [p.workspace_id, p.actor_id, row.company_id, row.site_id],
    )
  ).rows;
  const admitted: typeof items = [];
  for (const item of items.slice(0, 30))
    try {
      await visibleTicket(c, p, item.id);
      admitted.push(item);
    } catch (e) {
      if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
    }
  return {
    state: items.length > 30 ? "Partial" : "Available",
    items: admitted,
  };
}
export async function renewalSource(p: Principal, customer: string) {
  if (!(await hasPermission(database(), p, "maintenance.read")))
    return {
      state: "Restricted",
      basis: "Maintenance read permission is required",
      items: [],
      agreements: [],
      observed_at: new Date().toISOString(),
    };
  const [renewals, agreements] = await Promise.all([
    register(p, "renewals", { customer_id: customer }),
    register(p, "agreements", { customer_id: customer }),
  ]);
  return {
    state: "Available",
    basis:
      "Native MA-01 agreements and MA-05 owned reviews; proposals do not extend terms",
    items: renewals.items,
    agreements: agreements.items,
    observed_at: new Date().toISOString(),
  };
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  type: string,
  command: string,
  recordVersion: number,
) {
  const family = (Object.keys(families) as Family[]).find(
    (k) => families[k].type === type,
  );
  if (!family)
    throw new AppError(
      404,
      "Unavailable",
      "The original record is unavailable.",
    );
  let cap: Capability = families[family].edit;
  if (family === "cases")
    cap = command.startsWith("Warranty:")
      ? warrantyCapability(command.slice(9))
      : command.includes("ReceiveResult")
        ? "warranty.assess"
        : "warranty.manage";
  if (family === "recovery")
    cap = command.includes("Recovery:")
      ? recoveryCapability(command.split(":").at(-1)!)
      : "warranty.recovery";
  if (
    command.includes("Agreement:Approve") ||
    command.includes("Agreement:Withdraw")
  )
    cap = "maintenance.agreement.approve";
  if (command.includes("Plan:Review") || command.includes("ReceiveResult:due"))
    cap = "maintenance.assess";
  const original = await record(c, p, family, id);
  if (family === "coverage" && (original as Assessment).warranty_case_id)
    cap = "warranty.assess";
  if (command.includes("PrepareWork"))
    await companyContext(
      c,
      p,
      original.company_id,
      original.site_id,
      "service.ticket.edit",
    );
  if (command.includes("ReceiveResult")) {
    const event = (await history(c, p, id))
      .filter(
        (e) =>
          e.action === "ServiceResultReceived" && e.version === recordVersion,
      )
      .at(-1);
    if (event) {
      const report = (
        await c.query(
          "SELECT v.report_id,q.ticket_id FROM ppo.maintenance_service_results r JOIN ppo.report_revisions v ON (v.workspace_id,v.id)=(r.workspace_id,r.report_revision_id) JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) WHERE r.workspace_id=$1 AND r.id=$2",
          [p.workspace_id, event.content.result_id],
        )
      ).rows[0];
      if (report) {
        await visibleTicket(c, p, report.ticket_id);
        await reportContext(c, p, report.report_id);
      }
    }
  }
  return record(c, p, family, id, cap);
}
export async function options(p: Principal) {
  const c = database();
  await requireCapability(c, p, "shared.read");
  const load = async (
    kind: "Organisation" | "Site" | "Asset" | "Facility",
    table: string,
    label: string,
  ) =>
    (
      await c.query<{
        id: string;
        label: string;
        company_id: string;
        site_id?: string;
      }>(
        `SELECT r.id,r.${label} AS label,r.company_id${kind === "Asset" || kind === "Facility" ? ",r.site_id" : ""} FROM ppo.${table} r WHERE workspace_id=$1 AND ${visibility(kind, "r")} ORDER BY r.${label},r.id LIMIT 200`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
  const [customers, sites, assets, facilities] = await Promise.all([
    load("Organisation", "organisations", "display_name"),
    load("Site", "sites", "display_name"),
    load("Asset", "assets", "description"),
    load("Facility", "facilities", "name"),
  ]);
  const users = (
    await c.query<{ id: string; label: string }>(
      "SELECT id,display_name AS label FROM ppo.users WHERE workspace_id=$1 AND active ORDER BY display_name LIMIT 200",
      [p.workspace_id],
    )
  ).rows;
  const permittedOptions = async (family: Family, table: string) => {
    if (!(await hasPermission(c, p, families[family].read))) return [];
    const ids = (
      await c.query<{ id: string }>(
        `SELECT id FROM ppo.${table} WHERE workspace_id=$1 ORDER BY updated_at DESC LIMIT 200`,
        [p.workspace_id],
      )
    ).rows;
    const out: { id: string; label: string }[] = [];
    for (const x of ids)
      try {
        const row = await record(c, p, family, x.id);
        out.push({
          id:
            family === "agreements"
              ? (row as Agreement).current_revision_id
              : row.id,
          label: row.reference,
        });
      } catch (e) {
        if (!(e instanceof AppError && [403, 404].includes(e.status))) throw e;
      }
    return out;
  };
  const [agreements, assessments, cases] = await Promise.all([
    permittedOptions("agreements", "service_agreements"),
    permittedOptions("coverage", "entitlement_assessments"),
    permittedOptions("cases", "warranty_cases"),
  ]);
  return {
    customers,
    sites,
    assets,
    facilities,
    users,
    agreements,
    assessments,
    cases,
    actor_id: p.actor_id,
    completeness: "Bounded to 200 permitted options per record family",
  };
}
