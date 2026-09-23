// Two-phase proof. The caller restarts its dedicated application and PostgreSQL
// processes between phases; this script neither owns nor resets another server.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const phase = process.argv[2];
if (phase !== "write" && phase !== "verify") throw Error("Use write or verify");
const serverPid = Number(process.env.PPO_RESTART_SERVER_PID);
assert.ok(
  Number.isSafeInteger(serverPid) && serverPid > 0,
  "Supply the verified application process PID",
);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const root = "tmp/equipment-restart";
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN exact Equipment process-restart proof",
});
await mkdir(root, { recursive: true });
const login = await fetch(origin + "/api/v1/local-session", {
  method: "POST",
  headers: { origin, "content-type": "application/json" },
  body: JSON.stringify({ profile: "coordinator" }),
});
assert.equal(login.status, 200);
const cookie = login.headers.get("set-cookie")!.split(";")[0];
async function call(path: string, data?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: { origin, cookie, "content-type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  assert.ok(r.ok, await r.clone().text());
  return r.json();
}
async function snapshot(id: string, operations: string[]) {
  const result: Record<string, unknown> = {};
  for (const [table, filter, value] of [
    ["assets", "id=$1", id],
    ["asset_configurations", "asset_id=$1", id],
    ["asset_configuration_successions", "asset_id=$1", id],
    ["equipment_changes", "asset_id=$1", id],
    ["operation_receipts", "operation_id=ANY($1::uuid[])", operations],
  ] as const) {
    result[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE ${filter} ORDER BY to_jsonb(t)::text`,
        [value],
      )
    ).rows;
  }
  return result;
}
try {
  const databaseStarted = (
    await database().query("SELECT pg_postmaster_start_time()::text AS at")
  ).rows[0].at;
  if (phase === "write") {
    const id = randomUUID(),
      change = randomUUID();
    const create = {
      ...base(),
      id,
      company_id: "20000000-0000-4000-8000-000000000001",
      site_id: "70000000-0000-4000-8000-000000000001",
      description: "SYN durable Equipment original",
      identity_status: "Unresolved",
      effective_at: "2026-09-01T00:00:00Z",
      configuration: "SYN retained configuration before restart",
    };
    await call("assets", create);
    const impact = await call(`equipment/${id}/impact`);
    const proposal = {
      ...base(),
      id: change,
      expected_version: 1,
      kind: "Configuration",
      effective_at: "2026-09-20T00:00:00Z",
      source_reference: "SYN retained change source",
      source_revision: "r02",
      basis_hash: impact.basis_hash,
      configuration: "SYN retained successor after restart",
      consequences:
        "SYN prior Service, Inspection, location and warranty bases remain unchanged",
    };
    await call(`equipment/${id}/changes`, proposal);
    const apply = { ...base(), expected_version: 1, decision: "Apply" };
    const receipt = await call(`equipment/changes/${change}/review`, apply);
    const operations = [
      create.operation_id,
      proposal.operation_id,
      apply.operation_id,
    ];
    const proof = {
      id,
      change,
      apply,
      receipt,
      operations,
      serverPid,
      databaseStarted,
      detail: await call(`equipment/${id}`),
      original: await snapshot(id, operations),
    };
    await writeFile(`${root}/original.json`, JSON.stringify(proof));
    console.log(
      JSON.stringify({
        phase,
        serverPid,
        databaseStarted,
        original_sha256: digest(proof.original),
        result: "Original retained; process restart still required",
      }),
    );
  } else {
    const proof = JSON.parse(await readFile(`${root}/original.json`, "utf8"));
    assert.notEqual(
      serverPid,
      proof.serverPid,
      "The application process must have restarted",
    );
    assert.notEqual(
      databaseStarted,
      proof.databaseStarted,
      "PostgreSQL must have restarted",
    );
    assert.deepEqual(await call(`equipment/${proof.id}`), proof.detail);
    assert.deepEqual(
      await call(`operations/${proof.apply.operation_id}`),
      proof.receipt,
    );
    assert.deepEqual(
      await call(`equipment/changes/${proof.change}/review`, proof.apply),
      proof.receipt,
    );
    assert.deepEqual(
      await snapshot(proof.id, proof.operations),
      proof.original,
    );
    const evidence = {
      phase,
      server_before: proof.serverPid,
      server_after: serverPid,
      database_before: proof.databaseStarted,
      database_after: databaseStarted,
      original_sha256: digest(proof.original),
      result:
        "Passed: exact Asset, configuration lineage, change and original receipts after application and PostgreSQL restarts",
    };
    await writeFile(
      `${root}/verified.json`,
      JSON.stringify(evidence, null, 2) + "\n",
    );
    console.log(JSON.stringify(evidence));
  }
} finally {
  await closeDatabase();
}
