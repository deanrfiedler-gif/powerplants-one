import type { PoolClient } from "pg";
import type { Principal } from "./identity";
import { AppError } from "./errors";

export type QueryClient = Pick<PoolClient, "query">;
export type Capability =
  | "project.read"
  | "project.create"
  | "project.edit"
  | "email.read"
  | "email.edit"
  | "email.connect"
  | "finance.read"
  | "finance.prepare"
  | "finance.review"
  | "finance.process"
  | "finance.reconcile"
  | "finance.issue"
  | "finance.account.read"
  | "estimating.read"
  | "estimating.edit"
  | "estimating.quote.read"
  | "estimating.quote.prepare"
  | "report.read"
  | "report.review"
  | "report.issue"
  | "report.respond"

  | "crm.lead.read"
  | "crm.lead.create"
  | "crm.lead.edit"
  | "crm.lead.convert"
  | "crm.opportunity.read"
  | "crm.opportunity.create"
  | "crm.opportunity.edit"
  | "field.read.own"
  | "field.start.own"
  | "field.capture.own"
  | "field.correct.own"
  | "field.attachment.own"
  | "field.completion.own"
  | "pack.read"
  | "pack.prepare"
  | "pack.check"
  | "pack.issue"
  | "pack.acknowledge"
  | "schedule.read"
  | "schedule.manage"
  | "schedule.request"
  | "schedule.contact"
  | "service.work_order.read"
  | "service.work_order.edit"
  | "service.scope.authorise"
  | "service.readiness.assess"
  | "service.ticket.read"
  | "service.ticket.edit"
  | "activity.read"
  | "activity.edit"
  | "shared.read"
  | "shared.create"
  | "shared.edit"
  | "shared.internal.read"
  | "shared.finance.read"
  | "shared.history.record";
export async function hasPermission(
  client: QueryClient,
  p: Principal,
  capability: Capability,
  company_id?: string,
  site_id?: string,
) {
  const result = await client.query(
    `SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    WHERE g.workspace_id=$1 AND g.user_id=$2 AND g.capability=$3 AND u.active
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
    AND ($4::uuid IS NULL OR g.scope_type='Workspace' OR (g.company_id=$4 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$5::uuid))))`,
    [
      p.workspace_id,
      p.actor_id,
      capability,
      company_id ?? null,
      site_id ?? null,
    ],
  );
  return result.rowCount !== 0;
}
export async function requireCapability(
  client: QueryClient,
  p: Principal,
  capability: Capability,
) {
  if (!(await hasPermission(client, p, capability)))
    throw new AppError(
      403,
      "Forbidden",
      "This identity does not have the required shared-data permission.",
    );
}
// Parameters $1 workspace, $2 actor; aliases are internal constants, never request text.
export function scopeSql(
  company: string,
  site = "NULL::uuid",
  capability: Capability = "shared.read",
) {
  return `EXISTS(SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
    WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active AND g.capability='${capability}'
    AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
    AND (g.scope_type='Workspace' OR (g.company_id=${company} AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=${site})))))`;
}
