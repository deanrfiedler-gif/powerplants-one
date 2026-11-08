import { createHash } from "node:crypto";
import pg from "pg";
import { localConfig } from "../../src/platform/config";
import { database, transaction } from "../../src/platform/database";
import type { Principal } from "../../src/platform/identity";
import { readEstimatingReviewQueue } from "../../src/estimating/review/queue";

type Sample = {
  sql: string;
  values: unknown[];
  duration_ms: number;
  row_count: number | null;
  error_code?: string;
};
type PlanNode = {
  "Node Type": string;
  "Actual Total Time"?: number;
  "Actual Loops"?: number;
  "Actual Rows"?: number;
  "Shared Hit Blocks"?: number;
  Plans?: PlanNode[];
};
const milliseconds = (value: number) => Math.round(value * 1000) / 1000;
const fingerprint = (sql: string) =>
  createHash("sha256").update(sql.replace(/\s+/g, " ").trim()).digest("hex");
// Error messages and raw plans can contain bind values. Emit only safe codes.
function failure(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)
    ? code
    : "diagnostic_failed";
}

/** After-test observation only: never changes the browser's assertions or requests. */
export async function logReviewQueueDiagnostic(
  context: { principal: Principal; q: string } | undefined,
  test: { project: string; status: string | undefined },
) {
  const output: Record<string, unknown> = {
    ...test,
    view: "awaiting_me",
    offset: 25,
  };
  const samples: Sample[] = [];
  try {
    if (!context) {
      output.skipped = "test did not establish its coordinator and search";
      return;
    }
    if (localConfig().database_name !== "ppo_synthetic_test") {
      output.skipped = "disposable synthetic test database only";
      return;
    }
    // The browser server is a separate process. Instrument only this worker's
    // awaited queue read and restore the original method even when it fails.
    const original = pg.Client.prototype.query;
    pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
      const began = performance.now();
      const result = Reflect.apply(original, this, args);
      const query = args[0] as string | { text?: string; values?: unknown[] };
      const sql = typeof query === "string" ? query : query?.text;
      if (typeof sql !== "string" || !result?.then) return result;
      const values =
        typeof query === "string"
          ? Array.isArray(args[1])
            ? args[1]
            : []
          : (query.values ?? []);
      return result.then(
        (value: pg.QueryResult) => {
          samples.push({
            sql,
            values,
            duration_ms: milliseconds(performance.now() - began),
            row_count: value.rowCount,
          });
          return value;
        },
        (error: unknown) => {
          samples.push({
            sql,
            values,
            duration_ms: milliseconds(performance.now() - began),
            row_count: null,
            error_code: failure(error),
          });
          throw error;
        },
      );
    } as typeof original;
    const began = performance.now();
    try {
      await readEstimatingReviewQueue(context.principal, {
        q: context.q,
        view: "awaiting_me",
        offset: "25",
      });
    } catch (error) {
      output.read_error = failure(error);
    } finally {
      pg.Client.prototype.query = original;
      output.read_duration_ms = milliseconds(performance.now() - began);
    }
    output.statement_count = samples.length;
    const slowest = samples.sort((a, b) => b.duration_ms - a.duration_ms);
    output.slowest_statements = slowest
      .slice(0, 5)
      .map(({ sql, duration_ms, row_count, error_code }) => ({
        fingerprint: fingerprint(sql),
        duration_ms,
        row_count,
        ...(error_code ? { error_code } : {}),
      }));
    output.jit_after_read = (await database().query("SHOW jit")).rows[0].jit;
    // Sample statistics before EXPLAIN adds another execution to the workload.
    output.table_statistics = (
      await database().query(
        `
      SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
      FROM pg_stat_user_tables WHERE schemaname='ppo' AND relname=ANY($1::text[])
      ORDER BY relname`,
        [
          [
            "estimates",
            "estimate_review_events",
            "estimate_versions",
            "opportunities",
            "organisations",
            "users",
            "permission_grants",
            "draft_quotes",
            "draft_quote_revisions",
            "quote_release_bases",
          ],
        ],
      )
    ).rows;
    const statement = slowest[0];
    if (!statement || !/^\s*(SELECT|WITH)\b/i.test(statement.sql)) {
      output.explain_skipped = "slowest statement is not an explainable read";
      return;
    }
    // Replay the measured statement's own parameters with the queue's local
    // JIT setting, without exposing SQL, binds, filter text or returned titles.
    output.explain = await transaction(async (client) => {
      await client.query("SET LOCAL jit = off");
      const jit = (await client.query("SHOW jit")).rows[0].jit;
      const result = await client.query(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${statement.sql}`,
        statement.values,
      );
      const explained = result.rows[0]["QUERY PLAN"][0];
      const nodes: {
        path: string;
        node_type: string;
        actual_total_ms: number | undefined;
        actual_loops: number | undefined;
        actual_rows: number | undefined;
        shared_hit_blocks: number | undefined;
      }[] = [];
      function visit(node: PlanNode, path: string) {
        nodes.push({
          path,
          node_type: node["Node Type"],
          actual_total_ms: node["Actual Total Time"],
          actual_loops: node["Actual Loops"],
          actual_rows: node["Actual Rows"],
          shared_hit_blocks: node["Shared Hit Blocks"],
        });
        node.Plans?.forEach((child, index) => visit(child, `${path}.${index}`));
      }
      visit(explained.Plan, "0");
      return {
        fingerprint: fingerprint(statement.sql),
        jit_setting: jit,
        execution_ms: explained["Execution Time"],
        planning_ms: explained["Planning Time"],
        has_jit: "JIT" in explained,
        shared_hit_blocks: explained.Plan["Shared Hit Blocks"],
        // Total time is per-loop: rank by accumulated work to expose a cheap
        // inner node executed millions of times, retaining its tree path.
        top_plan_nodes: nodes
          .sort(
            (a, b) =>
              (b.actual_total_ms ?? 0) * (b.actual_loops ?? 0) -
              (a.actual_total_ms ?? 0) * (a.actual_loops ?? 0),
          )
          .slice(0, 15),
      };
    });
  } catch (error) {
    output.diagnostic_error = failure(error);
  } finally {
    console.log("PPO_REVIEW_QUEUE_DIAGNOSTIC", JSON.stringify(output));
  }
}
