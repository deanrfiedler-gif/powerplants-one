import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  optionalId,
  version,
  choice,
  invalid,
} from "../shared/validation";
import { projectRow } from "../projects/service";
import { visibleWorkOrder } from "../service/work-orders";
import {
  handoverRecord,
  handoverBasis,
  hashBasis,
  conflict,
  type Handover,
} from "./handover-service";

export type DeliveryKind = "Projects" | "Service";
type Binding = {
  handover_id: string;
  acceptance_event_id: string;
  destination_kind: DeliveryKind;
  project_id: string | null;
  work_order_id: string | null;
  destination_site_id: string;
  destination_version: number;
  operation_id: string;
  recorded_by: string;
  reason: string;
  recorded_at: Date;
};
const targetId = (b: Binding) => b.project_id ?? b.work_order_id!;
const denied = (e: unknown) =>
  e instanceof AppError && [403, 404].includes(e.status);
const capability = (kind: DeliveryKind) =>
  kind === "Projects"
    ? ("project.edit" as const)
    : ("service.work_order.edit" as const);
async function available(c: QueryClient) {
  return !!(
    await c.query("SELECT to_regclass('ppo.sales_delivery_bindings') relation")
  ).rows[0].relation;
}
async function destination(
  c: QueryClient,
  p: Principal,
  kind: DeliveryKind,
  id: string,
  edit = false,
) {
  if (kind === "Projects") {
    const d = await projectRow(c, p, id, edit);
    return {
      kind,
      id: d.id,
      company_id: d.company_id,
      customer_id: d.organisation_id,
      site_id: d.site_id,
      owner_id: d.coordinator_id,
      owner_name: d.coordinator_name,
      version: d.version,
      display_number: d.display_number,
      title: d.title,
      site_name: d.site_name,
      customer_name: d.customer_name,
      state: d.lifecycle,
    };
  }
  const d = await visibleWorkOrder(
    c,
    p,
    id,
    edit ? "service.work_order.edit" : "service.work_order.read",
  );
  const customer = await visible(c, p, "Organisation", d.customer_id),
    site = await visible(c, p, "Site", d.site_id),
    owner = (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, d.service_owner_id],
      )
    ).rows[0];
  return {
    kind,
    id: d.id,
    company_id: d.company_id,
    customer_id: d.customer_id,
    site_id: d.site_id,
    owner_id: d.service_owner_id,
    owner_name: owner?.display_name ?? "Owner unavailable",
    version: d.version,
    display_number: d.display_number,
    title: "Service work order",
    site_name: site.display_name,
    customer_name: customer.display_name,
    state: d.status,
  };
}
type Destination = Awaited<ReturnType<typeof destination>>;
function contextMatches(h: Handover, d: Destination) {
  return (
    h.company_id === d.company_id &&
    h.organisation_id === d.customer_id &&
    (!h.site_id || h.site_id === d.site_id)
  );
}
async function currentRelationship(
  c: QueryClient,
  p: Principal,
  d: Destination,
) {
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND organisation_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [p.workspace_id, d.company_id, d.site_id, d.customer_id],
      )
    ).rowCount
  )
    throw unavailable();
}
export async function deliveryBindingReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const b = (
    await c.query<Binding>(
      `SELECT b.* FROM ppo.sales_delivery_bindings b JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(b.workspace_id,b.recorded_by,b.operation_id)
    WHERE b.workspace_id=$1 AND b.handover_id=$2 AND b.recorded_by=$3 AND b.operation_id=$4 AND a.object_type='SalesHandover' AND a.object_id=b.handover_id AND a.outcome='Accepted' AND a.details->>'command'='SalesHandover:BindDelivery' AND a.details->>'acceptance_event_id'=b.acceptance_event_id::text AND a.details->>'destination_id'=COALESCE(b.project_id,b.work_order_id)::text`,
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!b) throw unavailable();
  const { row, history } = await handoverRecord(c, p, id);
  const accepted = history.find(
    (e) =>
      e.id === b.acceptance_event_id &&
      e.action === "Accept" &&
      e.recorded_by === p.actor_id &&
      e.content.destination === b.destination_kind,
  );
  if (!accepted || row.kind !== "Won") throw unavailable();
  await companyContext(
    c,
    p,
    row.company_id,
    row.site_id,
    capability(b.destination_kind),
  );
  const d = await destination(c, p, b.destination_kind, targetId(b), true);
  if (!contextMatches(row, d) || d.site_id !== b.destination_site_id)
    throw unavailable();
  return b;
}
export async function bindDelivery(p: Principal, id: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "expected_version",
    "acceptance_event_id",
    "source_hash",
    "destination_kind",
    "destination_id",
    "expected_destination_version",
    "destination_site_id",
  ]);
  if (
    typeof r.source_hash !== "string" ||
    !/^[a-f0-9]{64}$/.test(r.source_hash)
  )
    invalid("source_hash", "Compare the exact accepted Sales source.");
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    acceptance_event_id: uuid(r.acceptance_event_id, "acceptance_event_id"),
    source_hash: String(r.source_hash),
    destination_kind: choice(r.destination_kind, "destination_kind", [
      "Projects",
      "Service",
    ]),
    destination_id: uuid(r.destination_id, "destination_id"),
    expected_destination_version: version(r.expected_destination_version),
    destination_site_id: uuid(r.destination_site_id, "destination_site_id"),
  };
  return sharedOperation(
    p,
    input,
    "SalesHandover:BindDelivery",
    async (c) => {
      await c.query("SELECT ppo.lock_crm_transfer_authority($1)", [
        p.workspace_id,
      ]);
      if (!(await available(c)))
        throw new AppError(
          503,
          "DeliveryLinkUnavailable",
          "The delivery receiving upgrade is unavailable.",
        );
      const prior = !!(
        await c.query(
          "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
          [p.workspace_id, p.actor_id, input.operation_id],
        )
      ).rowCount;
      if (prior)
        await deliveryBindingReceiptAuthority(c, p, id, input.operation_id);
      return handoverRecord(c, p, id, prior ? "read" : "receive");
    },
    async (c, { row, history }) => {
      if (
        row.kind !== "Won" ||
        row.content.destination !== input.destination_kind
      )
        throw unavailable();
      const accepted = history.find(
        (e) =>
          e.id === input.acceptance_event_id &&
          e.action === "Accept" &&
          e.version === row.version &&
          e.revision === row.revision &&
          e.recorded_by === p.actor_id,
      );
      if (
        row.state !== "Accepted" ||
        row.version !== input.expected_version ||
        !accepted ||
        row.source_hash !== input.source_hash ||
        hashBasis(await handoverBasis(c, p, row, row.content, true)) !==
          input.source_hash
      )
        conflict(
          "The accepted Won handover or its sources changed. Review a current accepted successor before linking delivery.",
        );
      const d = await destination(
        c,
        p,
        input.destination_kind,
        input.destination_id,
        true,
      );
      if (!contextMatches(row, d) || d.owner_id !== p.actor_id)
        throw unavailable();
      await currentRelationship(c, p, d);
      if (
        d.state === "Closed" ||
        d.version !== input.expected_destination_version ||
        d.site_id !== input.destination_site_id
      )
        conflict(
          "The native destination changed or closed. Review its current owner, site and version before linking.",
        );
      const b = (
        await c.query<Binding>(
          `INSERT INTO ppo.sales_delivery_bindings(workspace_id,company_id,handover_id,acceptance_event_id,destination_kind,project_id,work_order_id,destination_site_id,destination_version,operation_id,recorded_by,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [
            p.workspace_id,
            row.company_id,
            id,
            accepted.id,
            d.kind,
            d.kind === "Projects" ? d.id : null,
            d.kind === "Service" ? d.id : null,
            d.site_id,
            d.version,
            input.operation_id,
            p.actor_id,
            input.reason,
          ],
        )
      ).rows[0];
      return {
        id: row.id,
        version: row.version,
        state: "DestinationLinked",
        updated_at: b.recorded_at,
        audit_details: {
          acceptance_event_id: accepted.id,
          source_hash: row.source_hash,
          destination_kind: d.kind,
          destination_id: d.id,
          destination_site_id: d.site_id,
          destination_version: d.version,
        },
      };
    },
    "SalesHandover",
    "SharedRecordUpdated",
  );
}

export async function readDeliveryBinding(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const q = object(query, ["destination_id", "q"]),
    selected = optionalId(q.destination_id, "destination_id");
  if (q.q !== undefined && (typeof q.q !== "string" || q.q.length > 200))
    invalid("q", "Search up to 200 characters.");
  const search = String(q.q ?? "")
    .trim()
    .toLowerCase();
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const { row, o, history } = await handoverRecord(c, p, id);
    if (row.kind !== "Won") throw unavailable();
    const supported =
      row.content.destination === "Projects" ||
      row.content.destination === "Service";
    const kind = supported ? (row.content.destination as DeliveryKind) : null;
    const accepted =
      history.find(
        (e) =>
          e.action === "Accept" &&
          e.version === row.version &&
          e.revision === row.revision,
      ) ?? null;
    const changed =
      !!row.source_hash &&
      row.source_hash !== hashBasis(await handoverBasis(c, p, row));
    const installed = await available(c);
    const bindings = installed
      ? (
          await c.query<Binding>(
            "SELECT * FROM ppo.sales_delivery_bindings WHERE workspace_id=$1 AND handover_id=$2 ORDER BY recorded_at",
            [p.workspace_id, id],
          )
        ).rows
      : [];
    const links = [];
    for (const b of bindings)
      try {
        const d = await destination(c, p, b.destination_kind, targetId(b));
        const event = history.find(
          (e) => e.id === b.acceptance_event_id && e.action === "Accept",
        );
        if (!event || !contextMatches(row, d)) throw unavailable();
        links.push({
          access: "Available" as const,
          acceptance_event_id: b.acceptance_event_id,
          handover_revision: event.revision,
          destination: d,
          compared_version: b.destination_version,
          compared_site_id: b.destination_site_id,
          current: accepted?.id === event.id,
          reason: b.reason,
          recorded_at: b.recorded_at.toISOString(),
        });
      } catch (e) {
        if (!denied(e)) throw e;
        links.push({ access: "Restricted" as const });
      }
    const current =
      installed &&
      !!accepted &&
      row.state === "Accepted" &&
      !changed &&
      !bindings.some((b) => b.acceptance_event_id === accepted.id);
    let canReceive = false,
      canCreate = false,
      restricted = false;
    if (current && kind)
      try {
        await handoverRecord(c, p, id, "receive");
        canReceive = true;
        await companyContext(
          c,
          p,
          row.company_id,
          row.site_id,
          kind === "Projects" ? "project.create" : "service.work_order.edit",
        );
        await companyContext(
          c,
          p,
          row.company_id,
          row.site_id,
          kind === "Projects" ? "project.read" : "service.work_order.read",
        );
        canCreate = true;
      } catch (e) {
        if (!denied(e)) throw e;
      }
    const options: Destination[] = [];
    let candidate: Destination | null = null;
    if (kind && canReceive) {
      const table = kind === "Projects" ? "projects" : "work_orders",
        customer = kind === "Projects" ? "organisation_id" : "customer_id",
        owner = kind === "Projects" ? "coordinator_id" : "service_owner_id";
      const ids = (
        await c.query<{ id: string }>(
          `SELECT id FROM ppo.${table} WHERE workspace_id=$1 AND company_id=$2 AND ${customer}=$3 AND ($4::uuid IS NULL OR site_id=$4) AND ${owner}=$5 AND ($6='' OR position($6 in lower(display_number||' '||id::text${kind === "Projects" ? "||' '||title" : ""}))>0) ORDER BY id LIMIT 51`,
          [
            p.workspace_id,
            row.company_id,
            row.organisation_id,
            row.site_id,
            p.actor_id,
            search,
          ],
        )
      ).rows;
      for (const item of ids)
        try {
          const d = await destination(c, p, kind, item.id, true);
          await currentRelationship(c, p, d);
          if (d.state !== "Closed") options.push(d);
        } catch (e) {
          if (!denied(e)) throw e;
        }
    }
    if (kind && selected)
      try {
        const d = await destination(c, p, kind, selected, true);
        if (!contextMatches(row, d)) throw unavailable();
        await currentRelationship(c, p, d);
        candidate = d;
      } catch (e) {
        if (!denied(e)) throw e;
        restricted = true;
      }
    const customer = await visible(c, p, "Organisation", row.organisation_id),
      site = row.site_id ? await visible(c, p, "Site", row.site_id) : null;
    return {
      handover_id: id,
      opportunity_id: row.opportunity_id,
      title: o.title,
      company_id: row.company_id,
      customer_id: row.organisation_id,
      customer_name: customer.display_name,
      site_id: row.site_id,
      site_name: site?.display_name ?? null,
      receiving_owner_id: row.receiving_owner_id,
      version: row.version,
      state: row.state,
      source_hash: row.source_hash,
      source_changed: changed,
      acceptance_event_id: accepted?.id ?? null,
      destination_kind: kind,
      content: row.content,
      links,
      options: options.slice(0, 20),
      more: options.length > 20,
      candidate,
      restricted,
      can_link:
        canReceive &&
        !!candidate &&
        candidate.owner_id === p.actor_id &&
        candidate.state !== "Closed",
      can_create: canCreate,
    };
  });
}

export async function readDeliverySalesSources(
  p: Principal,
  kind: DeliveryKind,
  id: string,
) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const d = await destination(c, p, kind, id);
    const bindings = (await available(c))
      ? (
          await c.query<Binding>(
            `SELECT * FROM ppo.sales_delivery_bindings WHERE workspace_id=$1 AND ${kind === "Projects" ? "project_id" : "work_order_id"}=$2 ORDER BY recorded_at`,
            [p.workspace_id, id],
          )
        ).rows
      : [];
    const items = [];
    for (const b of bindings)
      try {
        const { row, o, history } = await handoverRecord(c, p, b.handover_id);
        const event = history.find(
          (e) => e.id === b.acceptance_event_id && e.action === "Accept",
        );
        if (!event || !contextMatches(row, d)) throw unavailable();
        items.push({
          access: "Available" as const,
          handover_id: row.id,
          opportunity_id: row.opportunity_id,
          opportunity_title: o.title,
          acceptance_event_id: event.id,
          revision: event.revision,
          current: row.version === event.version && row.state === "Accepted",
          source_changed:
            !!row.source_hash &&
            row.source_hash !== hashBasis(await handoverBasis(c, p, row)),
          content: event.content,
          compared_version: b.destination_version,
          compared_site_id: b.destination_site_id,
          reason: b.reason,
          recorded_at: b.recorded_at.toISOString(),
        });
      } catch (e) {
        if (!denied(e)) throw e;
        items.push({ access: "Restricted" as const });
      }
    return { items };
  });
}
