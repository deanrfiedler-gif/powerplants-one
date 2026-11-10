import assert from "node:assert/strict";
import pg from "pg";
import type { Principal } from "../../src/platform/identity";
import type { projectRegister } from "../../src/projects/register";
import { planNodes, type PlanNode } from "./estimate-review-candidate-plan";
export {
  auditDealFixture as nativeFixture,
  assertNeverAnalysed,
} from "./deals-worklist-plan";
export { assertBoundedLoops } from "./estimate-review-candidate-plan";
export const projectTables = [
  "organisations",
  "sites",
  "people",
  "facilities",
  "assets",
  "projects",
  "project_tasks",
  "permission_grants",
  "users",
  "site_parties",
];
export type Captured = {
  sql: string;
  values: unknown[];
  raw: unknown[];
  plan?: PlanNode;
  execution_ms?: number;
  planning_ms?: number;
  shared_hit_blocks?: number;
  shared_read_blocks?: number;
  max_loops?: number;
  node_count?: number;
  has_jit?: boolean;
  jit_setting?: string;
};
// Observe the actual complete reader, preserving pg's callback and promise forms.
export async function captureRegister(
  reader: typeof projectRegister,
  p: Principal,
  input: unknown = {},
  explain = false,
) {
  const original = pg.Client.prototype.query;
  let captured: Captured | undefined;
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    const sql = args[0];
    if (
      typeof sql !== "string" ||
      !sql.includes("AS cursor_found") ||
      !sql.includes("milestone_overdue")
    )
      return Reflect.apply(original, this, args);
    assert.equal(
      captured,
      undefined,
      "Exactly one complete register statement",
    );
    const values = args[1] as unknown[],
      callback = args.at(-1);
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
      const result = await call(sql, values);
      captured = { sql, values, raw: result.rows };
      if (explain) {
        const jit_setting = (await call("SHOW jit")).rows[0].jit as string;
        const e = (
          await call(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, values)
        ).rows[0]["QUERY PLAN"][0];
        const nodes = planNodes(e.Plan);
        Object.assign(captured, {
          plan: e.Plan,
          execution_ms: e["Execution Time"],
          planning_ms: e["Planning Time"],
          shared_hit_blocks: e.Plan["Shared Hit Blocks"],
          shared_read_blocks: e.Plan["Shared Read Blocks"],
          max_loops: Math.max(...nodes.map((n) => n["Actual Loops"])),
          node_count: nodes.length,
          has_jit: "JIT" in e,
          jit_setting,
        });
      }
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
    const data = await reader(p, input);
    assert.ok(captured);
    return { ...captured, data };
  } finally {
    pg.Client.prototype.query = original;
  }
}
