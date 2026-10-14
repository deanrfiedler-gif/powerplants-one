import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import { hasPermission } from "../platform/permissions";
import { object, uuid } from "../shared/validation";
import { workspaceAuthority } from "../estimating/discovery-workspace-context";
import {
  active,
  duty,
  release,
  revision,
  run,
  calculationBinding,
} from "./context";
import { hash } from "./hash";
import { semanticChanges } from "./semantic-diff";
import { costLineEvidence } from "./costs";
import { productLineEvidence } from "./products";
import { productAuthority } from "../products/context";
import { estimateContext, versionContext } from "../estimating/context";
import { verifyAdoption, type Adoption } from "./adoption-evidence";

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
      current_author: (
        await c.query<{ id: string; display_name: string }>(
          "SELECT u.id,u.display_name FROM ppo.cpq_revisions v JOIN ppo.users u ON (u.workspace_id,u.id)=(v.workspace_id,v.created_by) WHERE v.workspace_id=$1 AND v.id=$2",
          [p.workspace_id, root.current_revision_id],
        )
      ).rows[0],
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
      seals: (
        await c.query(
          "SELECT s.* FROM ppo.cpq_seals s JOIN ppo.cpq_revisions v ON (v.workspace_id,v.id)=(s.workspace_id,s.revision_id) WHERE v.workspace_id=$1 AND v.release_id=$2 ORDER BY s.created_at DESC LIMIT 100",
          [p.workspace_id, id],
        )
      ).rows,
      activations: (
        await c.query(
          "SELECT a.* FROM ppo.cpq_activations a JOIN ppo.cpq_revisions v ON (v.workspace_id,v.id)=(a.workspace_id,a.revision_id) WHERE v.workspace_id=$1 AND v.release_id=$2 ORDER BY a.created_at DESC LIMIT 100",
          [p.workspace_id, id],
        )
      ).rows,
      rule_versions: (
        await c.query(
          "SELECT * FROM ppo.cpq_rule_versions WHERE workspace_id=$1 AND release_id=$2 ORDER BY rule_key,version DESC LIMIT 500",
          [p.workspace_id, id],
        )
      ).rows,
      members: (
        await c.query(
          "SELECT m.*,r.version FROM ppo.cpq_release_members m JOIN ppo.cpq_rule_versions r ON (r.workspace_id,r.id)=(m.workspace_id,m.rule_version_id) WHERE m.workspace_id=$1 AND m.revision_id=$2",
          [p.workspace_id, root.current_revision_id],
        )
      ).rows,
      capabilities: {
        author: await hasPermission(c, p, "cpq.author", root.company_id),
        review: await hasPermission(c, p, "cpq.review", root.company_id),
        publish: await hasPermission(c, p, "cpq.publish", root.company_id),
      },
      synthetic: true,
    };
  });
}
export const readRevision = (p: Principal, id: string) =>
  transaction((c) => revision(c, p, id));
export const readRun = (p: Principal, id: string) =>
  transaction(async (c) => {
    const r = await run(c, p, id);
    const n = (
      await c.query<{ n: number }>(
        "SELECT count(*)::integer AS n FROM ppo.cpq_runs WHERE workspace_id=$1 AND option_id=$2 AND (created_at,id)<=(SELECT created_at,id FROM ppo.cpq_runs WHERE workspace_id=$1 AND id=$3)",
        [p.workspace_id, r.option_id, r.id],
      )
    ).rows[0].n;
    return {
      ...r,
      evaluation_number: n,
      binding_hash: hash(calculationBinding(r.binding)),
      ...(r.binding.cost_sources
        ? { cost_provenance: costLineEvidence(r) }
        : {}),
      ...(r.binding.products
        ? { product_provenance: productLineEvidence(r) }
        : {}),
    };
  });
export async function readEstimateProducts(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["version_id"]),
    versionId = uuid(q.version_id, "version_id");
  return transaction(async (c) => {
    const e = await estimateContext(c, p, id, "estimating.read", versionId);
    const v = await versionContext(c, p, e, versionId);
    await duty(c, p, e.company_id);
    await productAuthority(c, p, e.company_id);
    const adoption = (
      await c.query<Adoption>(
        "SELECT * FROM ppo.cpq_adoptions WHERE workspace_id=$1 AND estimate_id=$2 AND estimate_version_id=$3",
        [p.workspace_id, e.id, v.id],
      )
    ).rows[0];
    if (!adoption)
      return {
        estimate_id: e.id,
        estimate_version_id: v.id,
        status: "NoCpqAdoption" as const,
        product_provenance: [],
        synthetic: true,
      };
    const { saved, resolution } = await verifyAdoption(c, p, adoption, v.lines);
    const retained = [];
    for (const line of resolution?.retained_cpq_lines ?? []) {
      const origin = await run(c, p, line.origin_run_id);
      retained.push({
        ...line,
        status: line.retained_line ? "ManualRetained" : "ExplicitlyRemoved",
        historical_product_provenance: productLineEvidence(origin).filter(
          (l) => l.line_id === line.line_id,
        ),
      });
    }
    return {
      estimate_id: e.id,
      estimate_version_id: v.id,
      status: resolution
        ? ("ResolvedAdoption" as const)
        : ("ExactAdoption" as const),
      run_id: saved.id,
      run_content_hash: saved.content_hash,
      result_hash: saved.result.result_hash,
      product_provenance: productLineEvidence(saved).filter((l) =>
        adoption.lines.some((a) => a.id === l.line_id),
      ),
      ...(resolution ? { resolution, retained_history: retained } : {}),
      synthetic: true,
    };
  });
}
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
        saved_at: r.updated_at,
        saved_by: r.created_by,
        input: r.input,
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
export async function compareRevisions(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const q = object(query, ["with"]);
  return transaction(async (c) => {
    const before = await revision(c, p, id),
      after = await revision(c, p, uuid(q.with, "with"));
    if (before.release_id !== after.release_id)
      throw new AppError(
        422,
        "CpqComparisonScope",
        "Choose versions of the same rule set.",
      );
    return {
      before: { id: before.id, content_hash: before.content_hash },
      after: { id: after.id, content_hash: after.content_hash },
      changes: semanticChanges(before.definition, after.definition),
      synthetic: true,
    };
  });
}
