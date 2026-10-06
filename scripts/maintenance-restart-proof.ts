// The caller restarts its dedicated application and PostgreSQL between phases.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
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
import { serviceResult } from "../tests/helpers/maintenance-service";
import { snapshot as snapshotTables } from "../tests/helpers/policy-commands";
import { requestReportIssue, processReportJob } from "../src/reports/worker";
import { readReport } from "../src/reports/service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const phase = process.argv[2],
  serverPid = Number(process.env.PPO_RESTART_SERVER_PID);
assert.ok(["write", "verify"].includes(phase));
assert.ok(Number.isSafeInteger(serverPid) && serverPid > 0);
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`,
  root = process.env.PPO_RESTART_PROOF_DIRECTORY ?? "tmp/maintenance-restart";
const documentRoot = process.env.PPO_DOCUMENT_DIRECTORY;
assert.ok(documentRoot, "Use a dedicated private document directory");
async function files() {
  return (await readdir(documentRoot!, { recursive: true, withFileTypes: true }))
    .filter((f) => f.isFile()).map((f) => join(f.parentPath, f.name)).sort();
}
async function outputHashes(paths: string[]) {
  return Promise.all(paths.map(async (path) => ({
    path, sha256: createHash("sha256").update(await readFile(path)).digest("hex"),
  })));
}
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
async function snapshot() {
  return snapshotTables([
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
    "maintenance_events", "maintenance_work_requests", "maintenance_service_results",
    "warranty_resolution_plans", "tickets",
    "work_orders", "work_order_tickets", "scope_revisions", "scope_items", "scope_assets",
    "coverage_assessments", "appointments", "assignments", "pack_revisions", "pack_issues",
    "field_attendances", "field_entries", "field_attachments", "service_reports", "report_revisions",
    "report_reviews", "report_issues", "report_presentations",
    "operation_receipts", "audit_events", "outbox_jobs",
  ]);
}
try {
  const databaseStarted = (
    await database().query("SELECT pg_postmaster_start_time()::text AS at")
  ).rows[0].at;
  if (phase === "write") {
    const priorFiles = new Set(await files());
    const a = await plan(),
      w = await warranty();
    await planCommand(a.p, a.id, {
      ...base(),
      expected_version: 2,
      action: "Generate",
      from: "2026-01-01",
      until: "2026-03-31",
    });
    const entitlement = await assessment(a.p, a.revision);
    const due = (await database().query(
      "SELECT id FROM ppo.maintenance_occurrences WHERE plan_id=$1 ORDER BY original_due LIMIT 1", [a.id],
    )).rows[0];
    const prepare = { ...base(), expected_version: 1, assessment_id: entitlement, owner_id: CRM.owner };
    const preparePath = `maintenance/due/${due.id}/prepare-work`;
    const prepared = await call(preparePath, prepare);
    const request = (await database().query("SELECT id FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [due.id])).rows[0];
    const service = await serviceResult(a.p, request.id, 79);
    const report = service.report;
    await requestReportIssue(a.p, report.id, {
      ...base(), expected_version: report.version, revision_id: report.revisions[0].id,
      review_id: report.reviews[0].id, template_id: report.template.id,
      template_version: report.template.version,
    });
    const queuedReport = (await readReport(a.p, report.id)).items[0];
    const issued = await processReportJob(queuedReport.jobs[0].id);
    assert.ok("issue_id" in issued, JSON.stringify(issued));
    const receive = {
      ...base(), expected_version: prepared.record_version, request_id: request.id,
      report_revision_id: service.report.revisions[0].id, task_mapping: service.mapping,
    };
    const receivePath = `maintenance/due/${due.id}/receive-result`;
    const received = await call(receivePath, receive);
    assert.equal((await database().query("SELECT state FROM ppo.maintenance_occurrences WHERE id=$1", [due.id])).rows[0].state, "Completed");
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
    const receipt = await call(path, command), original = await snapshot();
    const outputs = await outputHashes((await files()).filter((path) => !priorFiles.has(path)));
    assert.ok(outputs.length >= 4, "Retain the pack, reviewed report outputs and PNG evidence");
    const replays = [
      { path: preparePath, command: prepare, receipt: prepared },
      { path: receivePath, command: receive, receipt: received },
      { path, command, receipt },
    ];
    await writeFile(
      `${root}/original.json`,
      JSON.stringify({
        serverPid,
        databaseStarted,
        command,
        path,
        receipt,
        original,
        replays, outputs, filePaths: await files(),
      }),
    );
    console.log(
      JSON.stringify({
        phase,
        serverPid,
        databaseStarted,
        sha256: digest(original),
        replays: replays.length, outputFiles: outputs.length,
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
    for (const original of proof.replays) {
      assert.deepEqual(await call(`operations/${original.command.operation_id}`), original.receipt);
      assert.deepEqual(await call(original.path, original.command), original.receipt);
    }
    assert.deepEqual(await outputHashes(proof.outputs.map((o: { path: string }) => o.path)), proof.outputs);
    assert.deepEqual(await files(), proof.filePaths);
    const current = await snapshot();
    assert.deepEqual(current, proof.original);
    console.log(
      JSON.stringify({
        phase,
        serverPid,
        databaseStarted,
        sha256: digest(current),
        replays: proof.replays.length, outputFiles: proof.outputs.length,
        result:
          "Exact typed originals, audit/outbox and receipt survive both restarts; retry adds no effects",
      }),
    );
  }
} finally {
  await closeDatabase();
}
