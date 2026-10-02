import type { Principal } from "../platform/identity";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { fieldContext } from "../field/context";
import { visible } from "../shared/reads";
import { canonical } from "../platform/operations";
import { digest } from "../documents/store";
import type { Incident, Binding } from "./model";
export const hash = (v: unknown) =>
  digest(canonical(JSON.parse(JSON.stringify(v))));
export const refuse = (code: string, message: string): never => {
  throw new AppError(422, code, message);
};
export async function appointmentAccess(
  c: QueryClient,
  p: Principal,
  id: string,
  duty: Capability = "incident.read",
) {
  const ctx = await visibleAppointment(c, p, id, duty);
  if (
    !(await hasPermission(
      c,
      p,
      "incident.read",
      ctx.a.company_id,
      ctx.a.site_id,
    ))
  )
    throw unavailable();
  if (
    !(await hasPermission(
      c,
      p,
      "service.work_order.edit",
      ctx.a.company_id,
      ctx.a.site_id,
    ))
  )
    await fieldContext(c, p, id, "field.read.own");
  return ctx;
}
export const dutyFor = (action: string): Capability =>
  [
    "triage",
    "review",
    "action",
    "accept_action",
    "accept",
    "rebind",
    "link",
    "adopt_assignment",
  ].includes(action)
    ? "incident.review"
    : ["close", "reopen"].includes(action)
      ? "incident.close"
      : "incident.report";
export async function access(
  c: QueryClient,
  p: Principal,
  id: string,
  action?: string,
) {
  const row = (
    await c.query<Incident>(
      "SELECT * FROM ppo.incidents WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const ctx = await appointmentAccess(
    c,
    p,
    row.appointment_id,
    action ? dutyFor(action) : "incident.read",
  );
  if (
    row.company_id !== ctx.a.company_id ||
    row.site_id !== ctx.a.site_id ||
    row.work_order_id !== ctx.w.id
  )
    throw unavailable();
  const sensitive = await hasPermission(
    c,
    p,
    "incident.sensitive",
    row.company_id,
    row.site_id,
  );
  if (
    action &&
    ["save", "submit"].includes(action) &&
    row.reporter_id !== p.actor_id
  )
    throw unavailable();
  if (
    action &&
    [
      "triage",
      "review",
      "action",
      "adopt_assignment",
      "accept_action",
      "accept",
      "close",
      "reopen",
      "rebind",
      "link",
    ].includes(action) &&
    !sensitive
  )
    throw unavailable();
  if (row.state === "Draft" && row.reporter_id !== p.actor_id)
    throw unavailable();
  return {
    ...ctx,
    row,
    sensitive: sensitive || row.reporter_id === p.actor_id,
  };
}
// Factual reporting never calls readiness or Start. The snapshot captures source
// versions without asserting permission to perform the affected work.
export async function binding(
  c: QueryClient,
  p: Principal,
  appointment: string,
  scopeItem: string,
  assetId: string,
) {
  await appointmentAccess(c, p, appointment);
  return sourceBinding(c, p, appointment, scopeItem, assetId);
}
// Receiving commands inspect only their already-permitted appointment/equipment
// context. They do not inherit the right to read an incident's protected details.
export async function sourceBinding(
  c: QueryClient,
  p: Principal,
  appointment: string,
  scopeItem: string,
  assetId: string,
) {
  const { a, w } = await visibleAppointment(c, p, appointment),
    asset = await visible(c, p, "Asset", assetId);
  if (asset.company_id !== a.company_id || asset.site_id !== a.site_id)
    throw unavailable();
  const scope = (
    await c.query(
      "SELECT i.*,s.configuration_id FROM ppo.scope_items i JOIN ppo.scope_assets s ON (s.workspace_id,s.scope_item_id)=(i.workspace_id,i.id) WHERE i.workspace_id=$1 AND i.scope_revision_id=$2 AND i.id=$3 AND s.asset_id=$4",
      [p.workspace_id, a.scope_revision_id, scopeItem, assetId],
    )
  ).rows[0];
  if (!scope) throw unavailable();
  const configs = (
    await c.query(
      "SELECT c.* FROM ppo.asset_configurations c WHERE workspace_id=$1 AND asset_id=$2 AND ($3::uuid IS NOT NULL AND id=$3 OR $3::uuid IS NULL AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp()) AND NOT EXISTS(SELECT 1 FROM ppo.asset_configuration_successions s WHERE s.workspace_id=c.workspace_id AND s.predecessor_id=c.id AND s.effective_at<=clock_timestamp())) ORDER BY id",
      [p.workspace_id, assetId, scope.configuration_id],
    )
  ).rows;
  const preparations = (
    await c.query(
      "SELECT id,version,content FROM ppo.site_readiness WHERE workspace_id=$1 AND site_id=$2 ORDER BY id",
      [p.workspace_id, a.site_id],
    )
  ).rows;
  const readiness = (
    await c.query(
      "SELECT id,outcome,assessment_version,scope_version,valid_until FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND (appointment_id IS NULL OR appointment_id=$3) ORDER BY id",
      [p.workspace_id, a.scope_revision_id, a.id],
    )
  ).rows;
  const pack = (
    await c.query(
      "SELECT id,current_issue_id,needs_review,status FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, a.id],
    )
  ).rows;
  const snapshot = {
    appointment_id: a.id,
    work_order_id: w.id,
    company_id: a.company_id,
    site_id: a.site_id,
    scope_revision_id: a.scope_revision_id,
    authorised_scope_revision_id: w.authorised_scope_revision_id,
    schedule_version: a.schedule_version,
    assignment_version: a.assignment_version,
    scope_item: scope,
    asset: {
      id: asset.id,
      version: asset.version,
      site_id: asset.site_id,
      facility_id: asset.facility_id,
    },
    configurations: configs,
    preparations,
    readiness,
    pack,
  };
  return {
    snapshot,
    source_hash: hash(snapshot),
    scope_item_id: scopeItem,
    asset_id: assetId,
    known: configs.length === 1,
  };
}
export async function latestBinding(c: QueryClient, p: Principal, id: string) {
  const b = (
    await c.query<Binding>(
      "SELECT * FROM ppo.incident_bindings WHERE workspace_id=$1 AND incident_id=$2 ORDER BY sequence DESC LIMIT 1",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!b)
    refuse(
      "IncidentSourceUnavailable",
      "Required incident scope is unavailable; authority cannot be determined.",
    );
  return b;
}

// An Activity handover reveals only a stable permitted incident destination.
// Its own access is checked by readActivity before this lookup.
export async function activityIncidentSource(
  c: QueryClient,
  p: Principal,
  activityId: string,
) {
  if (
    !(await c.query("SELECT to_regclass('ppo.incident_actions') AS storage"))
      .rows[0].storage
  )
    return null;
  const link = (
    await c.query<{ incident_id: string }>(
      "SELECT incident_id FROM ppo.incident_actions WHERE workspace_id=$1 AND activity_id=$2",
      [p.workspace_id, activityId],
    )
  ).rows[0];
  if (!link) return null;
  try {
    await access(c, p, link.incident_id);
    return {
      id: link.incident_id,
      href: `/service/incidents/${link.incident_id}`,
    };
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    return null;
  }
}
