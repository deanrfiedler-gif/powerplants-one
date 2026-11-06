import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasPermission,
  pagePermissionReads,
  type QueryClient,
} from "../../src/platform/permissions";
import type { Principal } from "../../src/platform/identity";
import { activityPageReads } from "../../src/activities/page-reads";

test("page permission reuse is exact in actor, capability, company and site and ends with the page", async () => {
  let calls = 0;
  const raw = {
    query: async () => {
      calls++;
      return { rows: [{ allowed: 1 }], rowCount: 1 };
    },
  } as unknown as QueryClient;
  const page = pagePermissionReads(raw),
    p = { workspace_id: "w", actor_id: "a" } as Principal;
  await hasPermission(page, p, "shared.read", "company", "site");
  await hasPermission(page, p, "shared.read", "company", "site");
  assert.equal(calls, 1);
  for (const [actor, cap, company, site] of [
    ["b", "shared.read", "company", "site"],
    ["a", "shared.edit", "company", "site"],
    ["a", "shared.read", "other", "site"],
    ["a", "shared.read", "company", "other"],
    ["a", "shared.read", "company", undefined],
    ["a", "shared.read", undefined, undefined],
  ] as const)
    await hasPermission(page, { ...p, actor_id: actor }, cap, company, site);
  assert.equal(calls, 7);
  await page.query("SELECT id FROM records");
  await page.query("SELECT id FROM records");
  assert.equal(calls, 9, "Record checks are never memoized");
  await hasPermission(
    pagePermissionReads(raw),
    p,
    "shared.read",
    "company",
    "site",
  );
  assert.equal(calls, 10, "Another request rechecks the grant");
});

test("batched duplicate native rows can carry different estimate bases without sharing mutations", async () => {
  const page = activityPageReads({
    query: async () => ({ rows: [{ id: "e" }], rowCount: 1, fields: [] }),
  } as unknown as QueryClient);
  const [a, b] = await Promise.all([
    page.query("SELECT * FROM estimates"),
    page.query("SELECT * FROM estimates"),
  ]);
  a.rows[0].discovery_basis = { site: "first" };
  b.rows[0].discovery_basis = { site: "second" };
  assert.equal(a.rows[0].discovery_basis.site, "first");
  assert.equal(b.rows[0].discovery_basis.site, "second");
});

test("Customer 360 limits a failed statement to its 50 lookup slots and drains later chunks", async () => {
  const sizes: number[] = [], failure = new Error("synthetic statement timeout");
  const page = activityPageReads({
    query: async (_sql: string, values: unknown[]) => {
      sizes.push(values.length);
      if (sizes.length === 1) throw failure;
      return { fields: [], rowCount: values.length, rows: values.map((id, slot) => ({ __activity_page_slot: slot, id })) };
    },
  } as unknown as QueryClient, 50);
  const results = await Promise.allSettled(Array.from({ length: 100 }, (_, id) => page.query("SELECT $1 AS id", [id])));
  assert.deepEqual(sizes, [50, 50]);
  for (const result of results.slice(0, 50))
    assert.deepEqual(result, { status: "rejected", reason: failure });
  for (const [index, result] of results.slice(50).entries()) {
    assert.equal(result.status, "fulfilled");
    if (result.status === "fulfilled") assert.deepEqual(result.value.rows, [{ id: index + 50 }]);
  }
});
