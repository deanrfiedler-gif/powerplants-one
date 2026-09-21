import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";

// The caller owns the actual app/PostgreSQL stop and start between these phases.
// This script uses the ordinary HTTP boundary and never resets a database.
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test database only");
const phase = process.argv[2];
if (!["write", "verify"].includes(phase)) throw Error("Use write or verify");
const root =
  process.env.PPO_FACILITIES_EVIDENCE ??
  "verification-evidence/facilities-restart";
await mkdir(root, { recursive: true });
const origin = localConfig().origin;
const login = await fetch(`${origin}/api/v1/local-session`, {
  method: "POST",
  headers: { origin, "content-type": "application/json" },
  body: JSON.stringify({ profile: "coordinator" }),
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie")!.split(";")[0];
async function request(path: string, body?: unknown) {
  return fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { cookie, origin, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function call(path: string, body?: unknown) {
  const r = await request(path, body);
  const data = await r.json();
  assert.ok(r.ok, JSON.stringify(data));
  return data;
}
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN CS-05 restart proof",
});
const capture = async (id: string) => ({
  workspace: await call(`facilities/${id}/workspace`),
  history: (await call(`facilities/${id}/history`)).items,
  sources: (await call(`facilities/${id}/sources`)).items,
});
const digest = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
const file = `${root}/retained.json`;
if (phase === "write") {
  const records = [];
  for (const [name, structure_type, use, crop] of [
    ["Greenhouse tomatoes", "greenhouse", "production", "Tomatoes"],
    ["Field berries", "open_growing_area", "production", "Berries"],
    ["Mixed nursery", "shade_net_house", "mixed", "Mixed nursery stock"],
  ]) {
    const id = randomUUID(),
      details = {
        name: `SYN restart ${name}`,
        structure_type,
        use,
        crop,
        context_observed_on: "2026-09-01",
        footprint_m2: "1200.50",
        measurement_source: {
          kind: "reported_note",
          title: "SYN measured fixture",
          note: "First line\nRetained second line",
          source_date: "2026-09-01",
        },
      };
    const receipt = await call("facilities/create-details", {
      ...base(),
      id,
      company_id: "20000000-0000-4000-8000-000000000001",
      site_id: "c5050001-0000-4000-8000-000000000001",
      details,
    });
    await call(`facilities/${id}/revise`, {
      ...base(),
      expected_version: 1,
      changes: {
        structure_type,
        detail_notes: "SYN saved before both processes stop",
      },
    });
    records.push({ id, receipt, data: await capture(id) });
  }
  const register = await call("facilities/register?limit=1&sort=name");
  assert.ok(register.next_cursor);
  await writeFile(
    file,
    JSON.stringify(
      {
        recorded_at: new Date().toISOString(),
        records,
        cursor: register.next_cursor,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      phase,
      records: records.length,
      digest: digest(records),
      result: "saved via HTTP; restart must now occur",
    }),
  );
} else {
  const retained = JSON.parse(await readFile(file, "utf8"));
  for (const r of retained.records) {
    assert.deepEqual(await capture(r.id), r.data);
    assert.deepEqual(
      await call(`operations/${r.receipt.operation_id}`),
      r.receipt,
    );
  }
  const cursor = await request(
    `facilities/register?limit=1&sort=name&cursor=${encodeURIComponent(retained.cursor)}`,
  );
  assert.equal(cursor.status, 422);
  assert.ok(
    (await cursor.json()).field_errors.some(
      (e: { field: string }) => e.field === "cursor",
    ),
  );
  assert.ok((await call("facilities/register?limit=1&sort=name")).items.length);
  const result = {
    phase,
    verified_at: new Date().toISOString(),
    records: retained.records.length,
    digest: digest(retained.records),
    result:
      "exact records, audit, sources and receipts retained; old process cursor refused and fresh page available",
  };
  await writeFile(`${root}/result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}
