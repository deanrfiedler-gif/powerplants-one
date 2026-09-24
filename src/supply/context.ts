import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import { uuid } from "../shared/validation";
import { projectRow } from "../projects/service";
import { visibleWorkOrder } from "../service/work-orders";
import { visibleAppointment } from "../scheduling/planner";
import { engineeringRow } from "../engineering/service";
import type { SupplyRecord, RecordKind, FactKind } from "./model";
export const createCapability: Record<RecordKind, Capability> = {
  Demand: "supply.coordinate",
  Supply: "supply.coordinate",
  Return: "supply.return",
  Custody: "supply.custody",
};
export function factCapability(kind: FactKind): Capability {
  if (kind === "Credit") return "finance.reconcile";
  if (kind === "Receipt") return "supply.inspect";
  if (kind === "Custody") return "supply.custody";
  if (
    [
      "ReturnAuthorisation",
      "ReturnReceipt",
      "Disposition",
      "CustomerOutcome",
      "Claim",
      "SupplierMovement",
    ].includes(kind)
  )
    return "supply.return";
  if (
    [
      "Pick",
      "Stage",
      "Substitution",
      "Dispatch",
      "Delivery",
      "Acknowledgement",
    ].includes(kind)
  )
    return "supply.fulfil";
  return "supply.coordinate";
}
export const currentVersion = (actual: number, expected: number | null) => {
  if (actual !== expected)
    throw new AppError(
      409,
      "VersionConflict",
      "This record changed. Compare the latest revision before saving; the entered proposal is retained.",
    );
};
export async function linkedContext(
  c: QueryClient,
  p: Principal,
  r: Pick<
    SupplyRecord,
    "kind" | "company_id" | "site_id" | "data" | "unit" | "item"
  >,
) {
  const same = (v: { company_id: string; site_id?: string | null }) => {
    if (v.company_id !== r.company_id || (v.site_id && v.site_id !== r.site_id))
      throw unavailable();
  };
  if (r.kind === "Demand") {
    if (r.data.origin_kind === "Project")
      same(await projectRow(c, p, r.data.origin_id!));
    if (r.data.origin_kind === "WorkOrder")
      same(await visibleWorkOrder(c, p, r.data.origin_id!));
    for (const [key, kind] of [
      ["customer_id", "Organisation"],
      ["facility_id", "Facility"],
      ["asset_id", "Asset"],
    ] as const)
      if (r.data[key]) same(await visible(c, p, kind, r.data[key]!));
    if (r.data.engineering_id)
      same(await engineeringRow(c, p, r.data.engineering_id));
  }
  if (r.data.appointment_id) {
    const { a } = await visibleAppointment(c, p, r.data.appointment_id);
    same(a);
    if (
      r.kind === "Demand" &&
      r.data.origin_kind === "WorkOrder" &&
      a.work_order_id !== r.data.origin_id
    )
      throw unavailable();
  }
  if (r.kind === "Return" || r.kind === "Custody") {
    const parent = await supplyRecord(c, p, r.data.demand_id!);
    same(parent);
    if (
      parent.kind !== "Demand" ||
      parent.unit !== r.unit ||
      parent.item !== r.item
    )
      throw unavailable();
    if (r.kind === "Custody") {
      if (parent.data.origin_kind !== "WorkOrder")
        throw new AppError(
          422,
          "InvalidContext",
          "Service custody requires an existing Work Order demand.",
        );
      const { a } = await visibleAppointment(c, p, r.data.appointment_id!);
      if (a.work_order_id !== parent.data.origin_id) throw unavailable();
    }
  }
}
export async function supplyRecord(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "supply.read",
): Promise<SupplyRecord> {
  await requireCapability(c, p, "supply.read");
  const r = (
    await c.query(
      "SELECT * FROM ppo.supply_records WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0] as SupplyRecord | undefined;
  if (!r) throw unavailable();
  await companyContext(c, p, r.company_id, r.site_id, "supply.read");
  await companyContext(c, p, r.company_id, r.site_id, cap);
  await linkedContext(c, p, r);
  return r;
}
export async function newContext(
  c: QueryClient,
  p: Principal,
  r: Pick<
    SupplyRecord,
    "kind" | "company_id" | "site_id" | "data" | "unit" | "item" | "owner_id"
  >,
) {
  await requireCapability(c, p, "supply.read");
  await companyContext(c, p, r.company_id, r.site_id, "supply.read");
  await companyContext(c, p, r.company_id, r.site_id, createCapability[r.kind]);
  await linkedContext(c, p, r);
  if (r.kind === "Custody") {
    const custodian = await c.query("SELECT 1 FROM ppo.resources resource JOIN ppo.users u ON (u.workspace_id,u.id)=(resource.workspace_id,resource.user_id) WHERE resource.workspace_id=$1 AND resource.company_id=$2 AND resource.user_id=$3 AND u.active",[p.workspace_id,r.company_id,r.data.technician_id]);
    if (!custodian.rowCount) throw unavailable();
  }
  await scopedOwner(
    c,
    p,
    r.owner_id,
    r.company_id,
    r.site_id ?? undefined,
    "activity.edit",
  );
}
export async function financeAllowed(
  c: QueryClient,
  p: Principal,
  r: SupplyRecord,
) {
  return (
    (await hasPermission(
      c,
      p,
      "finance.read",
      r.company_id,
      r.site_id ?? undefined,
    )) &&
    (await hasPermission(
      c,
      p,
      "shared.finance.read",
      r.company_id,
      r.site_id ?? undefined,
    ))
  );
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  if (!command.startsWith("Supply:")) throw unavailable();
  const part = command.slice(7);
  const r = await supplyRecord(c, p, id);
  const cap = part.startsWith("Fact:")
    ? factCapability(part.slice(5) as FactKind)
    : part === "Allocate"
      ? "supply.coordinate"
      : part === "Attachment"
        ? captureCapability(r.kind)
        : createCapability[r.kind];
  if (
    !cap ||
    !(await hasPermission(c, p, cap, r.company_id, r.site_id ?? undefined))
  )
    throw unavailable();
  if (part === "Fact:Credit" && !(await financeAllowed(c, p, r)))
    throw unavailable();
}
export const captureCapability = (kind: RecordKind): Capability =>
  kind === "Supply"
    ? "supply.inspect"
    : kind === "Return"
      ? "supply.return"
      : kind === "Custody"
        ? "supply.custody"
        : "supply.fulfil";
