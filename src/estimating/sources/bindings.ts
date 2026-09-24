import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import type { CostLine } from "../math";
import { sourceContext, sourcesAvailable } from "./context";

export type SourceBinding = {
  line_id: string;
  source_id: string;
  source_revision_id: string;
  review_event_id: string;
  pricing_date: string;
  tier_minimum_quantity: string;
  unit_cost: string;
};
export async function sourceBindings(
  c: QueryClient,
  p: Principal,
  versionId: string,
) {
  if (!(await sourcesAvailable(c))) return [] as SourceBinding[];
  const rows = (
    await c.query<SourceBinding>(
      `SELECT b.line_id,r.source_id,b.source_revision_id,b.review_event_id,
    to_char(b.pricing_date,'YYYY-MM-DD') AS pricing_date,b.tier_minimum_quantity::text,b.unit_cost::text
    FROM ppo.estimate_cost_source_bindings b JOIN ppo.cost_source_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.source_revision_id)
    WHERE b.workspace_id=$1 AND b.estimate_version_id=$2 ORDER BY b.line_id`,
      [p.workspace_id, versionId],
    )
  ).rows;
  for (const id of new Set(rows.map((row) => row.source_id)))
    await sourceContext(c, p, id);
  return rows;
}
export async function insertSourceBinding(
  c: QueryClient,
  p: Principal,
  companyId: string,
  versionId: string,
  b: SourceBinding,
) {
  await c.query(
    `INSERT INTO ppo.estimate_cost_source_bindings(workspace_id,company_id,estimate_version_id,line_id,source_revision_id,review_event_id,pricing_date,tier_minimum_quantity,unit_cost,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      p.workspace_id,
      companyId,
      versionId,
      b.line_id,
      b.source_revision_id,
      b.review_event_id,
      b.pricing_date,
      b.tier_minimum_quantity,
      b.unit_cost,
      p.actor_id,
    ],
  );
}
// Every successor path uses this same conservative rule. Free text never grants
// typed provenance; a changed quantity/unit/cost/source/date drops the binding.
export async function inheritSourceBindings(
  c: QueryClient,
  p: Principal,
  companyId: string,
  versionId: string,
  predecessor: string | null,
  lines: CostLine[],
  replace: string[] = [],
) {
  if (!predecessor) return;
  const bindings = await sourceBindings(c, p, predecessor);
  if (!bindings.length) return;
  const old = (
    await c.query<{ lines: CostLine[] }>(
      "SELECT lines FROM ppo.estimate_versions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, predecessor],
    )
  ).rows[0].lines;
  for (const b of bindings) {
    const a = old.find((l) => l.id === b.line_id),
      next = lines.find((l) => l.id === b.line_id);
    if (
      !replace.includes(b.line_id) &&
      a &&
      next &&
      (
        ["quantity", "unit", "unit_cost", "source", "effective_date"] as const
      ).every((k) => a[k] === next[k])
    )
      await insertSourceBinding(c, p, companyId, versionId, b);
  }
}
