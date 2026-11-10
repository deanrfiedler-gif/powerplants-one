import assert from "node:assert/strict";
import pg from "pg";
import type { Principal } from "../../src/platform/identity";
import type { peopleRegister } from "../../src/shared/people-register";
import { planNodes, type PlanNode } from "./estimate-review-candidate-plan";
export {
  auditDealFixture as nativeFixture,
  assertNeverAnalysed,
} from "./deals-worklist-plan";
export { assertBoundedLoops } from "./estimate-review-candidate-plan";
export const peopleTables = [
  "people",
  "person_company_contexts",
  "relationships",
  "organisations",
  "sites",
  "site_parties",
  "contact_notice_preferences",
  "audit_events",
  "permission_grants",
  "users",
];
type Capture = {
  sql: string;
  values: unknown[];
  raw: unknown[];
  observation_window: { before: string; after: string };
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

// Observe the complete real statement, preserving callback/promise forms. No SQL,
// binds, result values, permission clocks or PostgreSQL settings are substituted.
export async function capturePeople(
  reader: typeof peopleRegister,
  p: Principal,
  input: unknown = {},
  explain = false,
) {
  const original = pg.Client.prototype.query;
  let captured: Capture | undefined;
  pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
    const sql = args[0];
    if (
      typeof sql !== "string" ||
      !sql.includes("AS cursor_found") ||
      !sql.includes("latest_notices AS MATERIALIZED")
    )
      return Reflect.apply(original, this, args);
    assert.equal(captured, undefined, "Exactly one complete People statement");
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
      const before = (await call("SELECT clock_timestamp()::text AS at"))
        .rows[0].at as string;
      const result = await call(sql, values);
      const after = (await call("SELECT clock_timestamp()::text AS at")).rows[0]
        .at as string;
      captured = {
        sql,
        values,
        raw: result.rows,
        observation_window: { before, after },
      };
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

export function assertPeopleEqual(
  a: Awaited<ReturnType<typeof capturePeople>>,
  b: Awaited<ReturnType<typeof capturePeople>>,
) {
  // Independent SQL statements necessarily have different observed_at values.
  // Validate each real timestamp and its public projection, then compare every
  // other raw/public value exactly (including signed cursors). No clock mocking.
  const withoutObservation = (value: object) =>
    Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "observed_at"),
    );
  for (const r of [a, b]) {
    assert.equal(r.raw.length, 1);
    assert.equal(
      r.data.observed_at,
      (r.raw[0] as { observed_at: string }).observed_at,
    );
    const at = Date.parse(r.data.observed_at);
    assert.ok(Number.isFinite(at));
    assert.ok(
      at >= Date.parse(r.observation_window.before) &&
        at <= Date.parse(r.observation_window.after),
    );
  }
  assert.deepEqual(b.values, a.values);
  assert.deepEqual(
    b.raw.map((x) => withoutObservation(x as object)),
    a.raw.map((x) => withoutObservation(x as object)),
  );
  assert.deepEqual(withoutObservation(b.data), withoutObservation(a.data));
}
