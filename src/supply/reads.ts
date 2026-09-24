import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { choice, uuid } from "../shared/validation";
import { visible } from "../shared/reads";
import { projectRow } from "../projects/service";
import { visibleWorkOrder } from "../service/work-orders";
import { visibleAppointment } from "../scheduling/planner";
import { engineeringRow } from "../engineering/service";
import {
  supplyRecord,
  financeAllowed,
  createCapability,
  factCapability,
} from "./context";
import {
  kinds,
  currentFacts,
  factSpecs,
  decimal,
  quantity,
  fulfilment,
  readiness,
  reservationPolicy,
  type Allocation,
  type Fact,
  type SupplyRecord,
  type FactKind,
} from "./model";
export async function factsFor(
  c: QueryClient,
  p: Principal,
  r: SupplyRecord,
): Promise<Fact[]> {
  // Restricted facts never enter an unprivileged projection, search, count or history.
  const finance = await financeAllowed(c, p, r);
  return (
    await c.query(
      "SELECT id,record_id,kind,version,predecessor_id,data,evidence,observed_at,completeness,attachment_id,activity_id FROM ppo.supply_facts WHERE workspace_id=$1 AND record_id=$2 AND ($3 OR kind<>'Credit') ORDER BY version,created_at,id",
      [p.workspace_id, r.id, finance],
    )
  ).rows;
}
export async function materialBasis(
  c: QueryClient,
  p: Principal,
  r: SupplyRecord,
  facts: Fact[],
) {
  const allocations = (
    await c.query<Allocation>(
      "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=$2 ORDER BY id",
      [p.workspace_id, r.id],
    )
  ).rows;
  let usable = 0n,
    complete = allocations.length > 0;
  const permittedAllocations: Allocation[] = [];
  const sources: {
    id: string;
    version: number;
    observed_at: string;
    completeness: string;
    usable: string | null;
    valid: boolean;
  }[] = [];
  for (const a of allocations) {
    try {
      const s = await supplyRecord(c, p, a.supply_id);
      permittedAllocations.push(a);
      const incompleteReceipt = (
        await c.query(
          "SELECT 1 FROM ppo.supply_current_facts WHERE workspace_id=$1 AND record_id=$2 AND kind='Receipt' AND completeness<>'Complete'",
          [p.workspace_id, s.id],
        )
      ).rowCount;
      const available = (
        await c.query(
          "SELECT ppo.supply_usable($1,$2)::text AS usable,(SELECT COALESCE(sum(quantity),0)::text FROM ppo.supply_allocations WHERE workspace_id=$1 AND supply_id=$2 AND basis='Usable') AS allocated",
          [p.workspace_id, s.id],
        )
      ).rows[0];
      const valid =
        available.usable !== null &&
        decimal(available.usable) >= decimal(available.allocated) &&
        s.completeness === "Complete" &&
        !incompleteReceipt;
      sources.push({
        id: s.id,
        version: s.version,
        observed_at: s.observed_at,
        completeness: s.completeness,
        usable: available.usable,
        valid,
      });
      if (!valid) complete = false;
      else if (a.basis === "Usable") usable += decimal(a.quantity);
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      complete = false;
    }
  }
  return {
    readiness: readiness(r, quantity(usable), complete, facts),
    usable: quantity(usable),
    sources,
    allocations: permittedAllocations,
    demand_version: r.version,
    scope: r.id,
    source_time: r.observed_at,
  };
}
export async function register(
  p: Principal,
  query: Record<string, string> = {},
) {
  const c = database();
  await requireCapability(c, p, "supply.read");
  const kind = query.kind ? choice(query.kind, "kind", kinds) : null;
  const rows = (
    await c.query<SupplyRecord>(
      `SELECT * FROM ppo.supply_records r WHERE workspace_id=$1 AND ${scopeSql("r.company_id", "r.site_id", "supply.read")} AND ${scopeSql("r.company_id", "r.site_id")} AND ($3::text IS NULL OR kind=$3) ORDER BY updated_at DESC,id LIMIT 2001`,
      [p.workspace_id, p.actor_id, kind],
    )
  ).rows;
  const allowed: SupplyRecord[] = [];
  for (const r of rows.slice(0, 2000)) {
    try {
      allowed.push(await supplyRecord(c, p, r.id));
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  const search = (query.q ?? "").trim().toLowerCase();
  const items = allowed.filter(
    (r) =>
      (!query.completeness || r.completeness === query.completeness) &&
      (!search ||
        [r.reference, r.title, r.item, r.next_action].some((v) =>
          v.toLowerCase().includes(search),
        )),
  );
  return {
    items,
    total: allowed.length,
    completeness: rows.length > 2000 ? "Partial" : "Complete",
    observed_at: new Date().toISOString(),
    reservation: reservationPolicy,
  };
}
export async function workspace(p: Principal, id: string) {
  return transaction(async (c) => {
    // A consistent basis, rather than independently timed detail/count reads.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const record = await supplyRecord(c, p, id),
      facts = await factsFor(c, p, record),
      capabilities: Record<string, boolean> = {};
    capabilities.edit = await hasPermission(
      c,
      p,
      createCapability[record.kind],
      record.company_id,
      record.site_id ?? undefined,
    );
    for (const kind of Object.keys(factSpecs) as FactKind[])
      capabilities[kind] =
        factSpecs[kind].kinds.includes(record.kind) &&
        (await hasPermission(
          c,
          p,
          factCapability(kind),
          record.company_id,
          record.site_id ?? undefined,
        )) &&
        (kind !== "Credit" || (await financeAllowed(c, p, record)));
    const history = (
      await c.query(
        "SELECT version,snapshot,recorded_at FROM ppo.supply_revisions WHERE workspace_id=$1 AND record_id=$2 ORDER BY version DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const links = await linksFor(c, p, record);
    const field_captures: { id: string; label: string }[] =
      record.kind === "Custody" && capabilities.Custody
        ? (
            await c.query(
              "SELECT e.id,(e.payload->>'quantity') || ' ' || (e.payload->>'uom') || ' used · ' || e.captured_at::text AS label FROM ppo.field_entries e WHERE e.workspace_id=$1 AND e.appointment_id=$2 AND e.actor_id=$3 AND e.kind='Material' AND e.payload->>'item_reference'=$4 AND e.payload->>'uom'=$5 AND e.payload->>'movement_kind'='Consumed' AND NOT EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id) ORDER BY e.captured_at DESC LIMIT 200",
              [
                p.workspace_id,
                record.data.appointment_id,
                record.data.technician_id,
                record.item,
                record.unit,
              ],
            )
          ).rows
        : [];
    const allocations: Allocation[] = [];
    for (const a of (
      await c.query<Allocation>(
        "SELECT * FROM ppo.supply_allocations WHERE workspace_id=$1 AND (demand_id=$2 OR supply_id=$2) ORDER BY id",
        [p.workspace_id, id],
      )
    ).rows) {
      try {
        await supplyRecord(c, p, a.demand_id);
        await supplyRecord(c, p, a.supply_id);
        allocations.push(a);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return {
      record,
      facts,
      history,
      links,
      allocations,
      capabilities,
      field_captures,
      current_facts: currentFacts(facts),
      basis:
        record.kind === "Demand"
          ? await materialBasis(c, p, record, facts)
          : null,
      fulfilment:
        record.kind === "Demand" ? fulfilment(facts, record.quantity) : null,
      reservation: reservationPolicy,
    };
  });
}
export async function linksFor(c: QueryClient, p: Principal, r: SupplyRecord) {
  const links: { label: string; href: string }[] = [];
  if (r.site_id) links.push({ label: "Site", href: `/sites/${r.site_id}` });
  for (const [key, label, path] of [
    ["customer_id", "Customer", "customers"],
    ["facility_id", "Facility / growing area", "facilities"],
    ["asset_id", "Equipment", "equipment"],
    ["engineering_id", "Engineering materials", "engineering"],
    ["appointment_id", "Appointment / visit", "service/appointments"],
  ])
    if (r.data[key])
      links.push({
        label,
        href: `/${path}/${r.data[key]}${key === "engineering_id" ? "/materials" : ""}`,
      });
  if (r.data.origin_id)
    links.push({
      label:
        r.data.origin_kind === "Project"
          ? "Project readiness and change review"
          : "Work Order",
      href:
        r.data.origin_kind === "Project"
          ? `/projects/${r.data.origin_id}`
          : `/service/work-orders/${r.data.origin_id}`,
    });
  if (r.data.demand_id) {
    await supplyRecord(c, p, r.data.demand_id);
    links.push({
      label: "Parent demand",
      href: `/supply/material-readiness?record=${r.data.demand_id}`,
    });
  }
  links.push({ label: "Owned Activities / My Work", href: "/work" });
  return links;
}
export async function options(p: Principal) {
  const c = database();
  await requireCapability(c, p, "supply.read");
  const companies = (
    await c.query(
      `SELECT id,display_name AS label FROM ppo.companies r WHERE workspace_id=$1 AND (${scopeSql("r.id", "NULL::uuid", "supply.read")} OR EXISTS(SELECT 1 FROM ppo.sites s WHERE s.workspace_id=r.workspace_id AND s.company_id=r.id AND ${scopeSql("s.company_id", "s.id", "supply.read")} AND ${scopeSql("s.company_id", "s.id")}))`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const sites = (
    await c.query(
      `SELECT id,company_id,display_name AS label FROM ppo.sites r WHERE workspace_id=$1 AND ${scopeSql("r.company_id", "r.id", "supply.read")} AND ${scopeSql("r.company_id", "r.id")}`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const owners = (
    await c.query(
      "SELECT id,display_name AS label FROM ppo.users WHERE workspace_id=$1 AND active AND issuer='PPO-LocalSynthetic' ORDER BY display_name",
      [p.workspace_id],
    )
  ).rows;
  const records = (await register(p)).items;
  const custodians: { id: string; label: string; company_id: string }[] = (
    await c.query(
      "SELECT DISTINCT u.id,u.display_name AS label,r.company_id FROM ppo.resources r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id) WHERE r.workspace_id=$1 AND r.company_id=ANY($2::uuid[]) AND u.active ORDER BY u.display_name",
      [p.workspace_id, companies.map((co) => co.id)],
    )
  ).rows;
  const contexts: Record<
    string,
    {
      id: string;
      label: string;
      company_id: string;
      site_id: string | null;
      work_order_id?: string;
    }[]
  > = {};
  for (const [key, table, label, reader] of [
    [
      "Project",
      "projects",
      "display_number || ' · ' || title",
      (id: string) => projectRow(c, p, id),
    ],
    [
      "WorkOrder",
      "work_orders",
      "display_number",
      (id: string) => visibleWorkOrder(c, p, id),
    ],
    [
      "customer_id",
      "organisations",
      "display_name",
      (id: string) => visible(c, p, "Organisation", id),
    ],
    [
      "facility_id",
      "facilities",
      "name",
      (id: string) => visible(c, p, "Facility", id),
    ],
    [
      "asset_id",
      "assets",
      "display_number || ' · ' || description",
      (id: string) => visible(c, p, "Asset", id),
    ],
    [
      "engineering_id",
      "engineering_packages",
      "display_number || ' · ' || title",
      (id: string) => engineeringRow(c, p, id),
    ],
    [
      "appointment_id",
      "appointments",
      "display_number",
      (id: string) => visibleAppointment(c, p, id),
    ],
  ] as const) {
    contexts[key] = [];
    const site = table === "organisations" ? "NULL::uuid" : "r.site_id";
    const rows = (
      await c.query(
        `SELECT r.id,r.company_id,${site} AS site_id,${label} AS label${table === "appointments" ? ",work_order_id" : ""} FROM ppo.${table} r WHERE r.workspace_id=$1 AND ${scopeSql("r.company_id", site, "supply.read")} ORDER BY r.id LIMIT 200`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    for (const row of rows) {
      try {
        await reader(row.id);
        contexts[key].push(row);
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
  }
  const can_create: Record<string, boolean> = {};
  for (const kind of kinds)
    can_create[kind] = await hasPermission(c, p, createCapability[kind]);
  return {
    companies,
    sites,
    owners,
    custodians,
    records,
    contexts,
    actor_id: p.actor_id,
    can_create,
  };
}
export async function recover(p: Principal, id: string) {
  const c = database();
  await requireCapability(c, p, "supply.read");
  const r = (
    await c.query(
      "SELECT o.result,o.record_id,a.details->>'command' command FROM ppo.operation_receipts o JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(o.workspace_id,o.actor_id,o.operation_id) WHERE o.workspace_id=$1 AND o.actor_id=$2 AND o.operation_id=$3",
      [p.workspace_id, p.actor_id, uuid(id, "operation_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  const { receiptAuthority } = await import("./context");
  await receiptAuthority(c, p, r.record_id, r.command);
  return r.result;
}
export type SupplyWorkspace = Awaited<ReturnType<typeof workspace>>;
