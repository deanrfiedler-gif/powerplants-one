import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, type Capability } from "../platform/permissions";
import { visibleWorkOrder } from "../service/work-orders";
import { visibleAppointment } from "./planner";
import { digest } from "./policy-values";

export const policyReads = [
  "shared.read",
  "schedule.read",
  "service.work_order.read",
  "service.ticket.read",
  "activity.read",
] as const satisfies readonly Capability[];
export type PolicyDuty = "schedule.policy.review" | "schedule.policy.publish";
export const sourceJSON = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const sourceHash = (value: unknown) => digest(sourceJSON(value));
export function policyForbidden(): never {
  // Same response before any count, source identity or original receipt is disclosed.
  throw new AppError(
    403,
    "PolicyAuthorityRequired",
    "Current workspace policy authority and complete source visibility are required.",
  );
}
async function policyDutySnapshot(
  c: PoolClient,
  p: Principal,
  duty: PolicyDuty,
) {
  const user = (
    await c.query(
      "SELECT * FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
      [p.workspace_id, p.actor_id],
    )
  ).rows[0];
  if (!user) policyForbidden();
  const grants = (
    await c.query(
      `SELECT *,valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp()) AS currently_valid
     FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=ANY($3::text[]) ORDER BY id`,
      [p.workspace_id, p.actor_id, [...policyReads, duty]],
    )
  ).rows;
  for (const capability of [...policyReads, duty])
    if (
      !grants.some(
        (g) =>
          g.capability === capability &&
          g.currently_valid &&
          g.scope_type === "Workspace" &&
          g.scope_id === p.workspace_id &&
          !g.company_id &&
          !g.site_id,
      )
    )
      policyForbidden();
  return sourceJSON({ user, grants });
}
export async function policyAuthority(
  c: PoolClient,
  p: Principal,
  duty: PolicyDuty,
) {
  await policyDutySnapshot(c, p, duty);
  // Current complete source closure, including linked tickets and ALL historical
  // scope assets, precedes receipt recovery. A filtered preview never supplies it.
  const orders = (
    await c.query(
      "SELECT DISTINCT work_order_id FROM ppo.appointments WHERE workspace_id=$1 ORDER BY work_order_id",
      [p.workspace_id],
    )
  ).rows;
  try {
    for (const row of orders) await visibleWorkOrder(c, p, row.work_order_id);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    policyForbidden();
  }
  // A duty/read grant can expire while the complete traversal waits on a source.
  // Recheck current identity and every explicit Workspace grant at disclosure,
  // including identical original recovery, without reapplying historical review gates.
  return policyDutySnapshot(c, p, duty);
}
export async function ownerEvidence(
  c: PoolClient,
  p: Principal,
  actor: string,
  company: string,
  site: string,
  workOrder: string,
) {
  const user = (
    await c.query("SELECT * FROM ppo.users WHERE workspace_id=$1 AND id=$2", [
      p.workspace_id,
      actor,
    ])
  ).rows[0];
  if (!user) throw unavailable();
  const capabilities: Capability[] = [
    ...policyReads,
    "activity.edit",
    "service.work_order.edit",
    "schedule.manage",
  ];
  const grants = (
    await c.query(
      `SELECT *,valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp()) AS currently_valid
     FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=ANY($3::text[]) ORDER BY id`,
      [p.workspace_id, actor, capabilities],
    )
  ).rows;
  const principal = { ...p, actor_id: actor, display_name: user.display_name };
  let eligible = !!user.active;
  for (const cap of [
    ...policyReads,
    "activity.edit",
    "service.work_order.edit",
  ] as Capability[])
    eligible &&= await hasPermission(c, principal, cap, company, site);
  try {
    await visibleWorkOrder(c, principal, workOrder);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    eligible = false;
  }
  return {
    user: { id: actor, version: null, content_hash: sourceHash(user) },
    active: !!user.active,
    grants: grants.map((g) => ({
      key: g.id,
      version: null,
      content_hash: sourceHash(g),
    })),
    eligible,
  };
}
export async function policyResolutionAuthority(
  c: PoolClient,
  p: Principal,
  impactId: string,
) {
  const impact = (
    await c.query(
      "SELECT * FROM ppo.scheduling_policy_impacts WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, impactId],
    )
  ).rows[0];
  if (!impact) throw unavailable();
  const { a, w } = await visibleAppointment(c, p, impact.appointment_id);
  for (const cap of policyReads)
    if (!(await hasPermission(c, p, cap, a.company_id, a.site_id)))
      throw unavailable();
  if (
    !(await hasPermission(c, p, "schedule.manage", a.company_id, a.site_id)) &&
    !(
      w.service_owner_id === p.actor_id &&
      (await hasPermission(
        c,
        p,
        "service.work_order.edit",
        a.company_id,
        a.site_id,
      ))
    )
  )
    throw unavailable();
  return { impact, a, w };
}
export async function policyReceiptAuthority(
  c: PoolClient,
  p: Principal,
  type: string,
  recordId: string,
) {
  if (type === "SchedulingPolicyResolution") {
    const row = (
      await c.query(
        "SELECT impact_id FROM ppo.scheduling_policy_resolutions WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, recordId],
      )
    ).rows[0];
    if (!row) throw unavailable();
    await policyResolutionAuthority(c, p, row.impact_id);
  } else
    await policyAuthority(
      c,
      p,
      type === "SchedulingPolicyPublication"
        ? "schedule.policy.publish"
        : "schedule.policy.review",
    );
}
