import { transaction } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { orderVisibility } from "../service/work-orders";
import { envelope, visibility, visible } from "../shared/reads";
import { invalid, object, optionalId } from "../shared/validation";
// Unassigned demand is an authorised work order with no live appointment. A
// Cancelled appointment is not a visit: the row survives because appointments
// are immutable evidence, but the work is unscheduled and is demand again. A
// Draft order is not demand: it carries no authorised scope. The read exposes
// no scheduling action; it names work that has not been given a visit.
const DEMAND_CAPABILITY: Capability = "schedule.read";
const DEFAULT_LIMIT = 50,
  MAX_LIMIT = 200;
export type UnassignedDemand = {
  id: string;
  display_number: string;
  version: number;
  company_id: string;
  site_id: string;
  customer_name: string;
  site_name: string;
  site_timezone: string;
  authorised_scope_revision_id: string;
  authorised_scope_revision: number;
  authorised_scope_version: number;
  authorised_scope_summary: string;
};
// Query text arrives as strings from the route, so the bound is checked after
// conversion rather than on the raw value. Demand is not time-bounded; there is
// no date range to refuse.
export function demandQuery(input: unknown) {
  const q = object(input, ["site_id", "limit"]);
  const site_id = optionalId(q.site_id, "site_id");
  const limit = q.limit === undefined ? DEFAULT_LIMIT : Number(q.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT)
    invalid("limit", `Choose a demand page size from 1 to ${MAX_LIMIT}.`);
  return { site_id, limit };
}
export type DemandQuery = ReturnType<typeof demandQuery>;
export async function readUnassignedDemand(p: Principal, input: unknown = {}) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    return demandSnapshot(c, p, input);
  });
}
export async function demandSnapshot(c: QueryClient, p: Principal, input: unknown = {}) {
  const q = demandQuery(input);
    await requireCapability(c, p, DEMAND_CAPABILITY);
    // A named site outside this identity's scope refuses exactly as a site that
    // does not exist. Nothing distinguishes "not permitted" from "not found".
    if (q.site_id) {
      const site = await visible(c, p, "Site", q.site_id);
      if (
        !(await hasPermission(
          c,
          p,
          DEMAND_CAPABILITY,
          site.company_id,
          q.site_id,
        ))
      )
        throw unavailable();
    }
    // Row-level scope is applied in SQL by the same projections the schedule
    // read uses. An identity without scope over a site reads no rows from it
    // rather than an error; no work order crosses a scope boundary here.
    const rows = (
      await c.query<UnassignedDemand>(
        `SELECT w.id,w.display_number,w.version,w.company_id,w.site_id,
          o.display_name AS customer_name,
          site.display_name AS site_name,site.timezone AS site_timezone,
          sr.id AS authorised_scope_revision_id,sr.revision AS authorised_scope_revision,
          sr.version AS authorised_scope_version,sr.summary AS authorised_scope_summary
         FROM ppo.work_orders w
         JOIN ppo.sites site ON (site.workspace_id,site.id)=(w.workspace_id,w.site_id)
         JOIN ppo.organisations o ON (o.workspace_id,o.id)=(w.workspace_id,w.customer_id)
         JOIN ppo.scope_revisions sr ON (sr.workspace_id,sr.work_order_id,sr.id)=(w.workspace_id,w.id,w.authorised_scope_revision_id)
         WHERE w.workspace_id=$1 AND w.status='Authorised'
           AND NOT EXISTS(SELECT 1 FROM ppo.appointments a WHERE a.workspace_id=w.workspace_id AND a.work_order_id=w.id AND a.status<>'Cancelled')
           AND ${scopeSql("w.company_id", "w.site_id", DEMAND_CAPABILITY)}
           AND ${orderVisibility("w")} AND ${visibility("Site", "site")}
           AND ($3::uuid IS NULL OR w.site_id=$3)
         ORDER BY w.display_number,w.id LIMIT $4`,
        [p.workspace_id, p.actor_id, q.site_id, q.limit + 1],
      )
    ).rows;
    // One row beyond the bound is read only to report completeness honestly. A
    // truncated list is never described as complete.
    const more = rows.length > q.limit,
      items = rows.slice(0, q.limit);
    return {
      ...envelope(
        items.map((w) => ({ ...w, projection: "UnassignedDemand" as const })),
      ),
      completeness: more ? "Partial" : "Complete",
      limit: q.limit,
    };
}
