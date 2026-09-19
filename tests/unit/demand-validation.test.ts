import assert from "node:assert/strict";
import { test } from "node:test";
import { demandQuery } from "../../src/scheduling/demand";
const site = "70000000-0000-4000-8000-000000000001";
const code = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
test("unassigned demand accepts only an optional site and a bounded limit", () => {
  assert.deepEqual(demandQuery({}), { site_id: null, limit: 50 });
  assert.deepEqual(demandQuery({ site_id: site }), { site_id: site, limit: 50 });
  // Query text arrives as strings from the route.
  assert.deepEqual(demandQuery({ limit: "200" }), { site_id: null, limit: 200 });
  assert.deepEqual(demandQuery({ site_id: site, limit: 1 }), {
    site_id: site,
    limit: 1,
  });
  // Demand is not time-bounded: the schedule read's period is not accepted.
  for (const unknownKey of [
    { from: "2026-09-21T00:00:00Z" },
    { to: "2026-09-28T00:00:00Z" },
    { timezone: "Australia/Brisbane" },
    { status: "Proposed" },
    { resource_id: site },
    { actor_id: site },
    { cursor: "x" },
  ])
    assert.throws(() => demandQuery(unknownKey), code("InvalidData"));
});
test("unassigned demand refuses a malformed site and an out-of-range limit", () => {
  for (const bad of ["", "not-a-uuid", site.slice(0, -1), 7, {}])
    assert.throws(() => demandQuery({ site_id: bad }), code("InvalidData"));
  for (const bad of [0, -1, 201, 1.5, "abc", "", null, Number.NaN])
    assert.throws(() => demandQuery({ limit: bad }), code("InvalidData"));
  assert.throws(() => demandQuery(null), code("InvalidData"));
  assert.throws(() => demandQuery([]), code("InvalidData"));
});
