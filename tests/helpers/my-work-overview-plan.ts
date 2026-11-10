import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import pg from "pg";
import type { Principal } from "../../src/platform/identity";
import type { readWorkOverview } from "../../src/activities/work-overview";
import { planNodes, type PlanNode } from "./estimate-review-candidate-plan";
type Measurement = {
  rows: unknown[];
  sql: string;
  values: unknown[];
  sql_sha256: string;
  jit_setting: string;
  plan: PlanNode;
  execution_ms: number;
  planning_ms: number;
  max_loops: number;
  max_nodes: unknown[];
  shared_hit_blocks: number;
  has_jit: boolean;
  statement_rows: number;
  visible_rows: number;
};
export async function measureOverview(reader: typeof readWorkOverview, p: Principal, input: Record<string, unknown>, valuesOverride?: unknown[], now = String(valuesOverride?.[5] ?? new Date().toISOString())) {
  const original = pg.Client.prototype.query;
  let captured: Measurement | undefined;
  // The pool uses callbacks; transactions use promises. Preserve both calling forms.
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    const sql = args[0];
    // Freeze only the overview observation clock, never permission/grant clocks.
    if (sql === "SELECT clock_timestamp() AS now") {
      const result = { rows: [{ now: new Date(now) }], rowCount: 1 };
      const callback = args.at(-1);
      if (typeof callback === "function") { queueMicrotask(() => callback(null, result)); return; }
      return Promise.resolve(result);
    }
    if (typeof sql !== "string" || !(sql.includes("FROM ppo.activities a") && sql.includes("LIMIT $9")))
      return Reflect.apply(original, this, args);
    assert.equal(captured, undefined, "Exactly one main statement must match");
    const values =
      valuesOverride ?? ((Array.isArray(args[1]) ? args[1] : []) as unknown[]);
    const callback = args.at(-1);
    const call = (text: string, binds: unknown[] = []) =>
      new Promise<pg.QueryResult>((resolve, reject) => {
        Reflect.apply(original, this, [
          text,
          binds,
          (error: Error | null, result: pg.QueryResult) =>
            error ? reject(error) : resolve(result),
        ]);
      });
    const work = (async () => {
      const jit = (await call("SHOW jit")).rows[0].jit as string;
      const result = await call(sql, values);
      const explained = (
        await call(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, values)
      ).rows[0]["QUERY PLAN"][0];
      const nodes = planNodes(explained.Plan);
      const max = Math.max(...nodes.map((n) => n["Actual Loops"]));
      const first = result.rows[0];
      const visible =
        typeof first?.total === "number"
          ? first.total
          : typeof first?.counts?.total === "number"
            ? first.counts.total
            : Array.isArray(first?.items)
              ? first.items.length
              : result.rows.length;
      captured = {
        rows: result.rows,
        sql,
        values,
        sql_sha256: createHash("sha256").update(sql).digest("hex"),
        jit_setting: jit,
        plan: explained.Plan,
        execution_ms: explained["Execution Time"],
        planning_ms: explained["Planning Time"],
        max_loops: max,
        max_nodes: nodes
          .filter((n) => n["Actual Loops"] === max)
          .map((n) => ({ ...n, Plans: undefined })),
        shared_hit_blocks: explained.Plan["Shared Hit Blocks"],
        has_jit: "JIT" in explained,
        statement_rows: result.rows.length,
        visible_rows: visible,
      };
      return result;
    })();
    if (typeof callback === "function") {
      void work.then(
        (r) => callback(null, r),
        (e) => callback(e),
      );
      return;
    }
    return work;
  } as typeof original;
  try {
    const result = await reader(p, input);
    assert.ok(captured, "Main My Work statement captured");
    return { ...captured, reader_result: result };
  } finally {
    pg.Client.prototype.query = original;
  }
}

