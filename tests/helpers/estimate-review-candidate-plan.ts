import assert from "node:assert/strict";
import pg from "pg";
import type { Principal } from "../../src/platform/identity";
import { transaction, database } from "../../src/platform/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readEstimateReview } from "../../src/estimating/review/reads";
import { submitEstimateReview } from "../../src/estimating/review/service";
import { crmBase, crmCreate } from "./crm";
import { estimateInput } from "./estimating";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";

export async function submittedCandidate(p: Principal, title: string) {
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const input = { ...estimateInput(opportunity.id), title };
  await createEstimate(p, input);
  const detail = await readEstimateReview(p, input.id);
  await submitEstimateReview(p, input.id, {
    ...crmBase(),
    estimate_version_id: detail.saved.id,
    basis_hash: detail.basis_hash,
    expected_version: detail.estimate.version,
    expected_review_version: detail.sequence,
    responses: [],
  });
}

// Capture the actual reader's query and binds, without copying or rewriting SQL.
// Returning no candidates avoids unrelated per-candidate work in this plan proof.
export async function candidateQuery(
  reader: typeof readEstimatingReviewQueue,
  p: Principal,
  input: Record<string, string>,
) {
  const original = pg.Client.prototype.query;
  let captured: { sql: string; values: unknown[] } | undefined;
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    if (typeof args[0] === "string" && args[0].includes("WITH candidates AS")) {
      assert.equal(captured, undefined);
      captured = { sql: args[0], values: args[1] as unknown[] };
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    return Reflect.apply(original, this, args);
  } as typeof original;
  try {
    await reader(p, input);
    assert.ok(captured);
    return captured;
  } finally {
    pg.Client.prototype.query = original;
  }
}

export type PlanNode = {
  "Node Type": string;
  "Subplan Name"?: string;
  "Actual Loops": number;
  "Actual Rows": number;
  "Shared Hit Blocks": number;
  Plans?: PlanNode[];
};
export function planNodes(node: PlanNode): PlanNode[] {
  return [node, ...(node.Plans ?? []).flatMap(planNodes)];
}
export function assertBoundedLoops(plan: PlanNode, candidateCount: number) {
  assert.ok(candidateCount > 0);
  for (const node of planNodes(plan))
    assert.ok(
      node["Actual Loops"] <= 10 * candidateCount,
      `${node["Node Type"]}: ${node["Actual Loops"]} loops exceeds ${10 * candidateCount} for ${candidateCount} candidates`,
    );
}
export async function explainCandidate(
  query: Awaited<ReturnType<typeof candidateQuery>>,
) {
  return transaction(async (c) => {
    // Both sides have JIT off, isolating the branch fences from the prior fix.
    await c.query("SET LOCAL jit = off");
    const start = performance.now();
    const rows = (await c.query(query.sql, query.values)).rows;
    const candidate_ms = performance.now() - start;
    const result = (
      await c.query(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.sql}`,
        query.values,
      )
    ).rows[0]["QUERY PLAN"][0];
    assert.equal("JIT" in result, false);
    return {
      rows,
      plan: result.Plan as PlanNode,
      candidate_ms,
      execution_ms: result["Execution Time"] as number,
      max_loops: Math.max(
        ...planNodes(result.Plan).map((n) => n["Actual Loops"]),
      ),
      shared_hit_blocks: result.Plan["Shared Hit Blocks"] as number,
      has_jit: "JIT" in result,
    };
  });
}

export const candidateTables = [
  "estimates",
  "estimate_versions",
  "estimate_review_events",
  "draft_quotes",
  "draft_quote_revisions",
  "quote_release_bases",
];
export async function candidateStatistics() {
  return (
    await database().query(
      `SELECT relname,n_live_tup,n_mod_since_analyze,last_analyze,last_autoanalyze,analyze_count,autoanalyze_count
     FROM pg_stat_user_tables WHERE schemaname='ppo' AND relname=ANY($1::text[])
     ORDER BY relname`,
      [candidateTables],
    )
  ).rows;
}
export async function assertNeverAnalysed() {
  const stats = await candidateStatistics();
  assert.equal(stats.length, candidateTables.length);
  for (const row of stats) {
    assert.equal(row.last_analyze, null, row.relname);
    assert.equal(row.last_autoanalyze, null, row.relname);
    assert.equal(Number(row.analyze_count), 0, row.relname);
    assert.equal(Number(row.autoanalyze_count), 0, row.relname);
  }
  return stats;
}
