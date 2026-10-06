import assert from "node:assert/strict";
import { test } from "node:test";
import type { QueryClient } from "../../src/platform/permissions";
import { conversionReadClient } from "../../src/estimating/conversion/source-authority";

test("prepared conversion reads execute every call and separate SQL/schema shapes without retaining actor results", async () => {
  let ledger = "50:original,67:current";
  const calls: unknown[][] = [];
  const client: QueryClient = {
    query: ((...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve({ rows: [{ ledger, call: calls.length }] });
    }) as QueryClient["query"],
  };
  const p = {
    workspace_id: "workspace",
    actor_id: "first",
    display_name: "SYN",
  };
  const read = await conversionReadClient(client, p);
  const first = await read.query("SELECT $1::text AS actor", ["first"]);
  const second = await read.query("SELECT $1::text AS actor", ["second"]);
  const again = await read.query("SELECT $1::text AS actor", ["first"]);
  assert.notDeepEqual(first.rows, again.rows);
  assert.notDeepEqual(first.rows, second.rows);
  const configs = calls
    .slice(1)
    .map(([c]) => c as { name: string; values: string[] });
  assert.equal(new Set(configs.map((c) => c.name)).size, 1);
  assert.deepEqual(
    configs.map((c) => c.values),
    [["first"], ["second"], ["first"]],
  );
  await read.query("SELECT $1::text AS different_shape", ["first"]);
  assert.notEqual((calls.at(-1)![0] as { name: string }).name, configs[0].name);
  // A reserved lower migration can land without changing max(version).
  ledger = "50:original,51:reserved-gap,67:current";
  const upgraded = await conversionReadClient(client, p);
  await upgraded.query("SELECT $1::text AS actor", ["first"]);
  assert.notEqual((calls.at(-1)![0] as { name: string }).name, configs[0].name);
});

test("conversion read facade preserves configured queries, callbacks and non-SELECT calls", async () => {
  const calls: unknown[][] = [];
  const client: QueryClient = {
    query: ((...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve({ rows: [{ ledger: "67:current" }] });
    }) as QueryClient["query"],
  };
  const read = await conversionReadClient(client, {
    workspace_id: "workspace",
    actor_id: "actor",
    display_name: "SYN",
  });
  const config = {
    text: "SELECT $1::text",
    values: ["configured"],
    rowMode: "array",
  };
  await read.query(config);
  const callback = () => {};
  read.query("SELECT $1::text", ["callback"], callback);
  await read.query("UPDATE synthetic SET value=$1", ["unchanged"]);
  assert.equal(calls[1][0], config);
  assert.deepEqual(calls[2], ["SELECT $1::text", ["callback"], callback]);
  assert.deepEqual(calls[3], ["UPDATE synthetic SET value=$1", ["unchanged"]]);
});
