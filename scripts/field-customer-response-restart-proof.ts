// Task-owned compiled HTTP/PG restart proof. Run write then verify around actual restarts.
// Private originals and configuration remain outside Git; no service is managed here.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { request } from "playwright";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const [mode, directory, journeyPath] = process.argv.slice(2);
assert(["write", "verify"].includes(mode) && directory);
const root = resolve(directory);
const applicationPid = Number(process.env.PPO_FI07_APP_PID);
assert(Number.isSafeInteger(applicationPid) && applicationPid > 0, "Pass the verified task-owned application PID");
const source = {
  executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], { encoding: "utf8" }).trim(),
  compiled_build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
};
await mkdir(root, { recursive: true });
const prior =
  mode === "verify"
    ? JSON.parse(await readFile(join(root, "original.json"), "utf8"))
    : null;
const journey =
  prior?.journey ?? JSON.parse(await readFile(journeyPath, "utf8"));
const hash = (v: Buffer | string) =>
  createHash("sha256").update(v).digest("hex");
const client = await request.newContext({
  baseURL: config.origin,
  extraHTTPHeaders: { origin: config.origin },
});
try {
  assert.equal(
    (
      await client.post("/api/v1/local-session", {
        data: { profile: "coordinator" },
      })
    ).status(),
    200,
  );
  const get = async (path: string) => {
    const r = await client.get("/api/v1/" + path);
    assert.equal(r.status(), 200, path);
    assert.equal(r.headers()["cache-control"], "private, no-store");
    return r;
  };
  const tables: Record<string, { count: number; hash: string }> = {};
  for (const table of [
    "field_attendances",
    "field_entries",
    "attendance_acceptances",
    "report_revisions",
    "report_reviews",
    "report_presentations",
    "report_issues",
    "customer_responses",
    "customer_response_contexts",
    "report_follow_ups",
    "activities",
    "operation_receipts",
    "report_templates",
  ]) {
    const rows = (
      await database().query(
        "SELECT to_jsonb(t) AS row FROM ppo." +
          table +
          " t ORDER BY to_jsonb(t)::text",
      )
    ).rows;
    tables[table] = { count: rows.length, hash: hash(JSON.stringify(rows)) };
  }
  const report = (await (await get("reports/" + journey.report)).json())
    .items[0];
  const files: Record<string, string> = {};
  for (const v of report.presentations) {
    for (const kind of v.kind === "IssuedReport"
      ? ["html", "pdf", "manifest"]
      : ["html"]) {
      const bytes = await (
        await get(
          "reports/" + journey.report + "/" + kind + "?presentation_id=" + v.id,
        )
      ).body();
      files[v.id + "-" + kind] = hash(bytes);
      if (kind === "html") assert.equal(hash(bytes), v.content_hash);
    }
  }
  for (const r of report.responses)
    if (r.signature_hash) {
      const bytes = await (
        await get("customer-responses/" + r.id + "/signature")
      ).body();
      assert.equal(hash(bytes), r.signature_hash);
      files[r.id + "-mark"] = hash(bytes);
    }
  // Receipt recovery is actor-bound: the native fixture captured as coordinator.
  const receipt = await (await get("operations/" + journey.operation)).json();
  assert.equal(receipt.record_id, journey.response);
  const boot = (
    await database().query("SELECT pg_postmaster_start_time() AS boot")
  ).rows[0].boot.toISOString();
  const facts = {
    journey,
    tables,
    files,
    receipt,
    responses: hash(JSON.stringify(report.responses)),
    attendance_acceptance: report.attendance_acceptance,
  };
  if (prior) {
    assert.notEqual(boot, prior.boot, "PostgreSQL must really restart");
    assert.notEqual(applicationPid, prior.application_pid, "Application must really restart");
    assert.deepEqual(source, prior.source);
    assert.deepEqual(facts, prior.facts);
    await writeFile(
      join(root, "restart.json"),
      JSON.stringify(
        {
          verified_at: new Date().toISOString(),
          source,
          before_application_pid: prior.application_pid,
          after_application_pid: applicationPid,
          before_boot: prior.boot,
          after_boot: boot,
          journey,
          tables,
          files,
          receipt_id: receipt.receipt_id,
          result:
            "Exact facts, original receipts, HTML/PDF and marks preserved across application and PostgreSQL restart",
        },
        null,
        2,
      ),
    );
  } else
    await writeFile(
      join(root, "original.json"),
      JSON.stringify({ journey, boot, facts, source, application_pid: applicationPid }, null, 2),
    );
} finally {
  await client.dispose();
  await closeDatabase();
}
