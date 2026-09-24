// The caller restarts its dedicated application and PostgreSQL between phases.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import {
  plan,
  warranty,
  base,
  CRM,
  assessment,
} from "../tests/helpers/maintenance";
import { planCommand } from "../src/maintenance/plans";
import { createRenewal } from "../src/maintenance/renewals";
import { createClaim } from "../src/maintenance/recovery";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const phase = process.argv[2],
  serverPid = Number(process.env.PPO_RESTART_SERVER_PID);
assert.ok(["write", "verify"].includes(phase));
assert.ok(Number.isSafeInteger(serverPid) && serverPid > 0);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`,
  root = "tmp/maintenance-restart";
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
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
async function snapshot(operation: string) {
  const state: Record<string, unknown> = {};
  for (const table of [
    "service_agreements",
    "agreement_revisions",
    "agreement_scope",
    "maintenance_plans",
    "maintenance_plan_revisions",
    "maintenance_plan_tasks",
    "maintenance_occurrences",
    "entitlement_assessments",
    "renewal_reviews",
    "warranty_cases",
    "supplier_claims",
    "maintenance_events",
  ])
    state[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
  for (const table of ["operation_receipts", "audit_events", "outbox_jobs"])
    state[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE operation_id=$1 ORDER BY to_jsonb(t)::text`,
        [operation],
      )
    ).rows;
  return state;
}
try {
  const databaseStarted = (
    await database().query("SELECT pg_postmaster_start_time()::text AS at")
  ).rows[0].at;
  if (phase === "write") {
    const a = await plan(),
      w = await warranty();
    await planCommand(a.p, a.id, {
      ...base(),
      expected_version: 2,
      action: "Generate",
      from: "2026-01-01",
      until: "2026-03-31",
    });
    await assessment(a.p, a.revision);
    await createRenewal(a.p, {
      ...base(),
      id: randomUUID(),
      agreement_revision_id: a.revision,
      site_id: CRM.site,
      owner_id: CRM.owner,
      review_from: "2028-09-01",
      next_date: "2028-09-15",
      next_action: "SYN durable renewal review",
    });
    await createClaim(w.p, {
      ...base(),
      id: randomUUID(),
      case_id: w.id,
      expected_case_version: 3,
      assessment_id: w.entitlement,
      supplier_id: CRM.org,
      scope: "SYN durable exact recovery package",
      claimed_minor: 10000,
      currency: "AUD",
      tax_basis: "ExcludingTax",
      owner_id: CRM.owner,
      due_date: "2026-10-15",
    });
    const command = {
        ...base(),
        expected_version: 3,
        action: "AssignReview",
        data: {
          owner_id: CRM.owner,
          due_date: "2026-10-01",
          next_action: "SYN durable owned review",
        },
      },
      path = `warranty/cases/${w.id}`;
    const receipt = await call(path, command),
      original = await snapshot(command.operation_id);
    await writeFile(
      `${root}/original.json`,
      JSON.stringify({
        serverPid,
        databaseStarted,
        command,
        path,
        receipt,
        original,
      }),
    );
    console.log(
      JSON.stringify({
        phase,
        serverPid,
        databaseStarted,
        sha256: digest(original),
        result: "Original retained; both process restarts still required",
      }),
    );
  } else {
    const proof = JSON.parse(await readFile(`${root}/original.json`, "utf8"));
    assert.notEqual(
      serverPid,
      proof.serverPid,
      "Application process must restart",
    );
    assert.notEqual(
      databaseStarted,
      proof.databaseStarted,
      "PostgreSQL must restart",
    );
    assert.deepEqual(
      await call(`operations/${proof.command.operation_id}`),
      proof.receipt,
    );
    assert.deepEqual(await call(proof.path, proof.command), proof.receipt);
    const current = await snapshot(proof.command.operation_id);
    assert.deepEqual(current, proof.original);
    console.log(
      JSON.stringify({
        phase,
        serverPid,
        databaseStarted,
        sha256: digest(current),
        result:
          "Exact typed originals, audit/outbox and receipt survive both restarts; retry adds no effects",
      }),
    );
  }
} finally {
  await closeDatabase();
}
