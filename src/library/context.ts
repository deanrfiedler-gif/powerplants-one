import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { companyContext } from "../shared/authority";
import { visible } from "../shared/reads";
import { projectRow } from "../projects/service";
import { engineeringRow } from "../engineering/service";
import { visibleWorkOrder } from "../service/work-orders";
import { uuid } from "../shared/validation";
import { sourceAuthority } from "./sources";
import type { DocumentRow, Duty, Revision, TargetKind } from "./types";
export async function documentContext(
  c: QueryClient,
  p: Principal,
  id: string,
  duty: Duty = "document.read",
) {
  const d = (
    await c.query<DocumentRow>(
      "SELECT * FROM ppo.library_documents WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "document_id")],
    )
  ).rows[0];
  if (!d) throw unavailable();
  await companyContext(c, p, d.company_id, d.site_id, "document.read");
  if (duty !== "document.read")
    await companyContext(c, p, d.company_id, d.site_id, duty);
  await visible(c, p, "Organisation", d.organisation_id);
  const r = await revisionContext(c, p, d, d.current_revision_id);
  return { d, r };
}
export async function revisionContext(
  c: QueryClient,
  p: Principal,
  d: DocumentRow,
  id: string,
) {
  const r = (
    await c.query<Revision>(
      "SELECT * FROM ppo.library_revisions WHERE workspace_id=$1 AND document_id=$2 AND id=$3",
      [p.workspace_id, d.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!r) throw unavailable();
  await sourceAuthority(c, p, r.source);
  return r;
}
export function current(
  d: DocumentRow,
  revision_id: string,
  expected_version: number,
) {
  if (d.version !== expected_version)
    throw new AppError(
      409,
      "StaleVersion",
      "The document changed. Reload its exact current version.",
    );
  if (d.state !== "Current")
    throw new AppError(
      409,
      "DocumentWithdrawn",
      "The document is withdrawn; its history is retained.",
    );
  if (d.current_revision_id !== revision_id)
    throw new AppError(
      409,
      "HistoricalRevision",
      "Use the current exact revision for this action.",
    );
}
export async function targetRow(
  c: QueryClient,
  p: Principal,
  kind: TargetKind,
  id: string,
) {
  let row;
  try {
    row =
      kind === "Project"
        ? await projectRow(c, p, id)
        : kind === "EngineeringPackage"
          ? await engineeringRow(c, p, id)
          : kind === "WorkOrder"
            ? await visibleWorkOrder(c, p, id)
            : await visible(c, p, kind, id);
  } catch (e) {
    if (e instanceof AppError && (e.status === 403 || e.status === 404))
      throw unavailable();
    throw e;
  }
  return row;
}
export async function targetContext(
  c: QueryClient,
  p: Principal,
  kind: TargetKind,
  id: string,
  d: DocumentRow,
) {
  const row = await targetRow(c, p, kind, id);
  const organisation =
    kind === "Organisation"
      ? row.id
      : "organisation_id" in row
        ? row.organisation_id
        : "customer_id" in row
          ? row.customer_id
          : null;
  const site = kind === "Site" ? row.id : "site_id" in row ? row.site_id : null;
  if (
    row.company_id !== d.company_id ||
    (organisation && organisation !== d.organisation_id) ||
    (d.site_id && site && site !== d.site_id)
  )
    throw unavailable();
  return row;
}
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation_id: string,
) {
  const event = (
    await c.query(
      "SELECT command,revision_id,payload FROM ppo.library_events WHERE workspace_id=$1 AND document_id=$2 AND actor_id=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation_id],
    )
  ).rows[0];
  if (!event) throw unavailable();
  const duty =
    event.command === "Review" || event.command === "Finding:Accept"
      ? "document.review"
      : "document.register";
  const { d } = await documentContext(c, p, id, duty);
  await revisionContext(c, p, d, event.revision_id);
  if (event.command.startsWith("Link:"))
    await targetContext(
      c,
      p,
      event.payload.target_kind,
      event.payload.target_id,
      d,
    );
}
