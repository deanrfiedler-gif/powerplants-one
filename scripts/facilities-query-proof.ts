import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import { registerFacilities } from "../src/shared/facilities/reads";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Synthetic test database only");
const p = (await createSession("coordinator")).principal,
  pool = database(),
  original = pool.query;
let queries = 0;
pool.query = ((...args: unknown[]) => {
  queries++;
  return Reflect.apply(original, pool, args);
}) as typeof original;
try {
  const query = {
    site_id: "70000000-0000-4000-8000-000000000001",
    q: "SYN large",
    limit: 50,
  };
  const page = await registerFacilities(p, query);
  assert.ok(
    page.total >= 5000,
    "Run the 5,000-row Facility query test first; do not infer a load result from sparse data",
  );
  const queryCount = queries;
  assert.ok(queryCount <= 8, "Bounded page must not query per row");
  const origin = localConfig().origin;
  const login = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  const results = [];
  for (const path of [
    `facilities/register?${new URLSearchParams({ ...query, limit: "50" })}`,
    `facilities/${page.items[0].id}/workspace`,
  ]) {
    const times = [];
    for (let i = 0; i < 21; i++) {
      const start = performance.now(),
        r = await fetch(`${origin}/api/v1/${path}`, { headers: { cookie } });
      assert.equal(r.status, 200);
      await r.json();
      if (i) times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    results.push({
      path,
      samples: times.length,
      p50_ms: times[9],
      p95_ms: times[18],
      max_ms: times.at(-1),
    });
  }
  const evidence = {
    at: new Date().toISOString(),
    dataset: page.total,
    loaded: page.items.length,
    register_query_count: queryCount,
    environment:
      "Loopback compiled app, PostgreSQL 16.15, Node 24.21.0, Windows; concurrent regression load",
    results,
    target_ms: 500,
    target_status: results.every((r) => r.p95_ms <= 500)
      ? "Met in this local sample"
      : "Review required; target missed",
  };
  await writeFile(
    process.env.PPO_FACILITIES_QUERY_EVIDENCE ??
      "verification-evidence/facilities-query.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(JSON.stringify(evidence));
} finally {
  pool.query = original;
  await closeDatabase();
}
