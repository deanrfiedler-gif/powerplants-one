// Run after the connected Finance fixture, in separate write/verify processes
// with an actual PostgreSQL restart between them. No HTTP/browser restart claim.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readOperation } from "../../src/shared/receipts";
import { financeIssueBytes, processFinanceJob } from "../../src/finance/worker";
import { digest } from "../../src/documents/store";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
const phase = process.argv[2];
assert.ok(phase === "write" || phase === "verify");
const directory = process.argv[3];
assert.ok(directory, "Supply a local synthetic evidence directory");
const postmaster = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text value"))
    .rows[0].value as string;
async function snapshot() {
  const result: Record<string, unknown> = {};
  for (const table of [
    "finance_handoffs",
    "finance_revisions",
    "finance_lines",
    "finance_allocation_holds",
    "finance_reviews",
    "finance_processing_attempts",
    "finance_outcomes",
    "finance_reconciliations",
    "finance_render_jobs",
    "finance_render_attempts",
    "finance_issues",
    "finance_templates",
    "finance_template_policy",
    "finance_events",
    "operation_receipts",
    "outbox_jobs",
  ])
    result[table] = (
      await database().query(
        `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
  return result;
}
async function originals() {
  const jobs = (
    await database().query(
      `SELECT j.*, h.source_kind, i.id issue_id, i.manifest
       FROM ppo.finance_render_jobs j
       JOIN ppo.finance_handoffs h ON h.id=j.handoff_id AND h.workspace_id=j.workspace_id
       JOIN ppo.finance_issues i ON i.render_job_id=j.id AND i.workspace_id=j.workspace_id
       WHERE h.source_kind IN ('ProjectClaim','AgreementCharge') ORDER BY h.source_kind`,
    )
  ).rows;
  assert.deepEqual(
    jobs.map((j) => j.source_kind),
    ["AgreementCharge", "ProjectClaim"],
  );
  const retained = [];
  for (const j of jobs) {
    const p = {
      actor_id: j.actor_id,
      workspace_id: j.workspace_id,
      display_name: "Synthetic original Finance owner",
    };
    const html = await financeIssueBytes(p, j.issue_id, { format: "html" });
    const pdf = await financeIssueBytes(p, j.issue_id, { format: "pdf" });
    const receipt = await readOperation(p, j.operation_id);
    assert.equal(digest(html.bytes), j.manifest.html_hash);
    assert.equal(digest(pdf.bytes), j.manifest.pdf_hash);
    assert.deepEqual(await processFinanceJob(j.id), { processed: false });
    retained.push({
      kind: j.source_kind,
      job_id: j.id,
      issue_id: j.issue_id,
      receipt,
      html_hash: html.sha256,
      pdf_hash: pdf.sha256,
      html_bytes: html.bytes.length,
      pdf_bytes: pdf.bytes.length,
      browser_version: j.manifest.browser_version,
      renderer_version: j.manifest.renderer_version,
    });
  }
  return retained;
}
try {
  if (phase === "write") {
    const before = await snapshot();
    const bytes = await originals();
    assert.deepEqual(await snapshot(), before);
    await mkdir(directory, { recursive: true });
    await writeFile(
      `${directory}/checkpoint.json`,
      JSON.stringify({
        process: process.pid,
        postmaster: await postmaster(),
        snapshot: before,
        originals: bytes,
      }),
      { mode: 0o600 },
    );
    console.log(
      "Saved two exact claim originals and request receipts. Restart PostgreSQL before verify.",
    );
  } else {
    const saved = JSON.parse(
      await readFile(`${directory}/checkpoint.json`, "utf8"),
    );
    assert.notEqual(process.pid, saved.process, "Use a new command process");
    await assert.rejects(
      readFile(`/proc/${saved.process}/stat`, "utf8"),
      (e: unknown) => (e as NodeJS.ErrnoException).code === "ENOENT",
      "Original command process must have exited",
    );
    const current = await postmaster();
    assert.notEqual(
      current,
      saved.postmaster,
      "Restart the actual PostgreSQL instance",
    );
    assert.deepEqual(await snapshot(), saved.snapshot);
    assert.deepEqual(await originals(), saved.originals);
    assert.deepEqual(await snapshot(), saved.snapshot);
    const result = {
      passed: true,
      scope:
        "PostgreSQL restart and separate command processes; no HTTP/browser restart",
      process_before: saved.process,
      process_after: process.pid,
      postmaster_before: saved.postmaster,
      postmaster_after: current,
      originals: saved.originals,
    };
    await writeFile(
      `${directory}/result.json`,
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  await closeDatabase();
}
