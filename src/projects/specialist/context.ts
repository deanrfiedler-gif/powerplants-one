import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { canonical } from "../../platform/operations";
import { digest } from "../../documents/store";
import { companyContext } from "../../shared/authority";
import { projectRow } from "../service";
import { engineeringRow } from "../../engineering/service";
import { supplyRecord } from "../../supply/context";
import {
  authority as commercialAuthority,
  entryRow,
  history as commercialHistory,
  sourceAuthority,
  actions,
} from "../commercial/context";
import type { Command, Content, State } from "./validation";
export { actions };
export type Package = {
  id: string;
  workspace_id: string;
  company_id: string;
  project_id: string;
  basis_id: string;
  basis_version: number;
  predecessor_id: string | null;
  created_by: string;
};
export type Snapshot = {
  commercial: { id: string; version: number; source_hash: string };
  engineering: {
    id: string;
    version: number;
    title: string;
    brief: string;
    discipline: string;
  } | null;
  demand: {
    id: string;
    version: number;
    reference: string;
    item: string;
    unit: string;
    quantity: string;
  } | null;
};
export type Event = {
  package_id: string;
  version: number;
  command: Command;
  state: State;
  content: Content;
  source: Snapshot;
  source_hash: string;
  note: string;
  reason: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
};
export const changed = () =>
  new AppError(
    409,
    "SpecialistSourceChanged",
    "Compare current source revisions before submitting or accepting this package.",
  );
export async function authority(
  c: QueryClient,
  p: Principal,
  project: string,
  duty: "read" | "prepare" | "receive" = "read",
) {
  const pr = await projectRow(c, p, project);
  await companyContext(
    c,
    p,
    pr.company_id,
    pr.site_id,
    "project.specialist.read",
  );
  if (duty !== "read")
    await companyContext(
      c,
      p,
      pr.company_id,
      pr.site_id,
      `project.specialist.${duty}`,
    );
  return pr;
}
export async function packageRow(c: QueryClient, p: Principal, id: string) {
  return (
    (
      await c.query<Package>(
        "SELECT * FROM ppo.project_specialist_packages WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0] ?? null
  );
}
export async function history(
  c: QueryClient,
  p: Principal,
  id: string,
  before?: number,
  limit = 51,
) {
  return (
    await c.query<Event>(
      "SELECT * FROM ppo.project_specialist_events WHERE workspace_id=$1 AND package_id=$2 AND ($3::int IS NULL OR version<$3) ORDER BY version DESC LIMIT $4",
      [p.workspace_id, id, before ?? null, limit],
    )
  ).rows;
}
export async function inspect(
  c: QueryClient,
  p: Principal,
  pkg: Pick<Package, "project_id" | "basis_id" | "basis_version">,
  content: Content,
  current: boolean,
  frozen?: Snapshot,
): Promise<Snapshot> {
  const pr = await commercialAuthority(c, p, pkg.project_id),
    basis = await entryRow(c, p, pkg.basis_id);
  if (!basis || basis.project_id !== pr.id || basis.kind !== "Basis")
    throw unavailable();
  const approved = (await commercialHistory(c, p, basis.id, undefined, 1))[0];
  if (
    !approved ||
    approved.state !== "Approved" ||
    approved.version !== pkg.basis_version
  )
    throw changed();
  let commercial;
  try {
    commercial = await sourceAuthority(c, p, basis, current);
  } catch (e) {
    if (e instanceof AppError && e.code === "CommercialSourceChanged")
      throw changed();
    throw e;
  }
  let engineering: Snapshot["engineering"] = null,
    demand: Snapshot["demand"] = null;
  if (content.engineering) {
    const r = await engineeringRow(c, p, content.engineering.id);
    if (
      r.project_id !== pr.id ||
      r.company_id !== pr.company_id ||
      r.site_id !== pr.site_id
    )
      throw unavailable();
    if (current && r.version !== content.engineering.version) throw changed();
    engineering = {
      id: r.id,
      version: r.version,
      title: r.title,
      brief: r.brief,
      discipline: r.discipline,
    };
  }
  if (content.demand) {
    const r = await supplyRecord(c, p, content.demand.id);
    if (
      r.kind !== "Demand" ||
      r.company_id !== pr.company_id ||
      r.site_id !== pr.site_id ||
      r.data.origin_kind !== "Project" ||
      r.data.origin_id !== pr.id
    )
      throw unavailable();
    if (current && r.version !== content.demand.version) throw changed();
    demand = {
      id: r.id,
      version: r.version,
      reference: r.reference,
      item: r.item,
      unit: r.unit,
      quantity: r.quantity,
    };
  }
  await actions(c, p, pr.id, content.action_ids);
  const result = {
    commercial: {
      id: basis.id,
      version: approved.version,
      source_hash: commercial.hash,
    },
    engineering,
    demand,
  };
  if (
    frozen &&
    (canonical(frozen.commercial) !== canonical(result.commercial) ||
      frozen.engineering?.id !== content.engineering?.id ||
      frozen.demand?.id !== content.demand?.id)
  )
    throw unavailable();
  if (frozen && current && canonical(result) !== canonical(frozen))
    throw changed();
  return frozen ?? result;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const pkg = await packageRow(c, p, id);
  if (!pkg) throw unavailable();
  const e = (
    await c.query<Event>(
      "SELECT * FROM ppo.project_specialist_events WHERE workspace_id=$1 AND package_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await authority(
    c,
    p,
    pkg.project_id,
    ["Accept", "Return"].includes(e.command) ? "receive" : "prepare",
  );
  await inspect(c, p, pkg, e.content, false, e.source);
}
export const hashSource = (source: Snapshot) => digest(canonical(source));
