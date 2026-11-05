import assert from "node:assert/strict";
import { test } from "node:test";
import type { QueryClient } from "../../src/platform/permissions";
import { activityPageReads } from "../../src/activities/page-reads";
import { proofPath } from "../../src/platform/proof-diagnostics";

test("activity page batches preserve parameter slots, empty rows and dates without caching later reads", async () => {
  const calls: { sql: string; values: unknown[] }[] = [];
  const date = new Date("2026-11-05T00:00:00Z");
  const client = {
    query: async (sql: string, values: unknown[]) => {
      calls.push({ sql, values });
      return {
        command: "SELECT",
        rowCount: 1,
        fields: [],
        rows: sql.includes("UNION ALL")
          ? [{ __activity_page_slot: 0, id: "a", at: date }]
          : [{ id: "a", at: date }],
      };
    },
  } as unknown as QueryClient;
  const batch = activityPageReads(client);
  const sql =
    "SELECT id,at FROM example WHERE workspace_id=$1 AND id=$2 ORDER BY id LIMIT 1";
  const [first, duplicate, empty] = await Promise.all([
    batch.query(sql, ["workspace", "a"]),
    batch.query(sql, ["workspace", "a"]),
    batch.query(sql, ["workspace", "b"]),
  ]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].values, ["workspace", "a", "workspace", "b"]);
  assert.match(calls[0].sql, /workspace_id=\$3 AND id=\$4/);
  assert.deepEqual(first.rows, [{ id: "a", at: date }]);
  assert.equal(first.rows[0].at, date);
  assert.deepEqual(duplicate, first);
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.rowCount, 0);
  await batch.query(sql, ["workspace", "a"]);
  assert.equal(calls.length, 2);
  await assert.rejects(batch.query("DELETE FROM example"), /SELECT reads/);
});

test("activity page lookup failures reach every batched consumer", async () => {
  const failure = new Error("database read failed");
  const batch = activityPageReads({
    query: async () => {
      throw failure;
    },
  } as unknown as QueryClient);
  const results = await Promise.allSettled([
    batch.query("SELECT $1", [1]),
    batch.query("SELECT $1", [2]),
  ]);
  assert.deepEqual(results, [
    { status: "rejected", reason: failure },
    { status: "rejected", reason: failure },
  ]);
});

test("customer workspace diagnostics retain the route without identity or query values", () => {
  assert.equal(
    proofPath(
      "/api/v1/customers/50000000-0000-4000-8000-000000000001/workspace?private=value",
    ),
    "/api/v1/customers/:id/workspace",
  );
});

test("activity page drains dependent lookup waves serially on its single client", async () => {
  let active = 0,
    maximum = 0;
  const batch = activityPageReads({
    query: async () => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise<void>((resolve) => setImmediate(resolve));
      active--;
      return { command: "SELECT", rowCount: 0, fields: [], rows: [] };
    },
  } as unknown as QueryClient);
  await Promise.all([
    (async () => {
      await batch.query("SELECT 1");
      await batch.query("SELECT 3");
    })(),
    (async () => {
      await batch.query("SELECT 2");
      await batch.query("SELECT 4");
    })(),
  ]);
  assert.equal(maximum, 1);
  assert.equal(active, 0);
});
