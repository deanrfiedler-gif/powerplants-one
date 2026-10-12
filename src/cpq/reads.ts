import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { object, uuid } from "../shared/validation";
import { workspaceAuthority } from "../estimating/discovery-workspace-context";
import { active, duty, release, revision, run } from "./context";

export async function listReleases(
  p: Principal,
  query: Record<string, string>,
) {
  const q = object(query, ["company_id"]),
    company = uuid(q.company_id, "company_id");
  return transaction(async (c) => {
    await duty(c, p, company);
    return {
      items: (
        await c.query(
          "SELECT id,label,version,current_revision_id,state,updated_at FROM ppo.cpq_releases WHERE workspace_id=$1 AND company_id=$2 ORDER BY updated_at DESC,id LIMIT 100",
          [p.workspace_id, company],
        )
      ).rows,
      active: await active(c, p, company),
      capabilities: {
        author: await hasPermission(c, p, "cpq.author", company),
        review: await hasPermission(c, p, "cpq.review", company),
        publish: await hasPermission(c, p, "cpq.publish", company),
      },
      limit: 100,
      synthetic: true,
    };
  });
}
export async function readRelease(p: Principal, id: string) {
  return transaction(async (c) => {
    const root = await release(c, p, id);
    return {
      release: root,
      current: await revision(c, p, root.current_revision_id),
      revisions: (
        await c.query(
          "SELECT id,version,predecessor_id,content_hash,created_by,created_at,reason FROM ppo.cpq_revisions WHERE workspace_id=$1 AND release_id=$2 ORDER BY version DESC LIMIT 100",
          [p.workspace_id, id],
        )
      ).rows,
      reviews: (
        await c.query(
          "SELECT r.* FROM ppo.cpq_reviews r JOIN ppo.cpq_revisions v ON (v.workspace_id,v.id)=(r.workspace_id,r.revision_id) WHERE v.workspace_id=$1 AND v.release_id=$2 ORDER BY r.created_at DESC LIMIT 100",
          [p.workspace_id, id],
        )
      ).rows,
      active: await active(c, p, root.company_id),
      synthetic: true,
    };
  });
}
export const readRevision = (p: Principal, id: string) =>
  transaction((c) => revision(c, p, id));
export const readRun = (p: Principal, id: string) =>
  transaction((c) => run(c, p, id));
export async function runHistory(p: Principal, id: string) {
  return transaction(async (c) => {
    const g = await workspaceAuthority(c, p, id);
    await duty(c, p, g.company_id);
    const rows = (
      await c.query<{ id: string }>(
        "SELECT id FROM ppo.cpq_runs WHERE workspace_id=$1 AND estimating_workspace_id=$2 ORDER BY created_at DESC,id LIMIT 50",
        [p.workspace_id, g.id],
      )
    ).rows;
    const items = [];
    for (const row of rows) {
      const r = await run(c, p, row.id);
      items.push({
        id: r.id,
        state: r.state,
        parent_id: r.parent_id,
        option_id: r.option_id,
        release_revision_id: r.release_revision_id,
        discovery_revision_id: r.discovery_revision_id,
        result_hash: r.result.result_hash,
        totals: r.result.totals,
        diagnostic_count: r.result.diagnostics.length,
      });
    }
    return { items, limit: 50, synthetic: true };
  });
}
export async function compareRuns(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["with"]);
  return transaction(async (c) => {
    const a = await run(c, p, id),
      b = await run(c, p, uuid(q.with, "with"));
    if (a.estimating_workspace_id !== b.estimating_workspace_id)
      throw new AppError(
        422,
        "CpqComparisonScope",
        "Choose two runs from the same estimating workspace.",
      );
    const targets = [
      ...new Set([...a.result.lines, ...b.result.lines].map((l) => l.target)),
    ].sort();
    return {
      left: a.id,
      right: b.id,
      changes: targets.map((target) => ({
        target,
        before: a.result.lines.find((l) => l.target === target) ?? null,
        after: b.result.lines.find((l) => l.target === target) ?? null,
      })),
      totals: { before: a.result.totals, after: b.result.totals },
      diagnostics: {
        before: a.result.diagnostics,
        after: b.result.diagnostics,
      },
      synthetic: true,
    };
  });
}
