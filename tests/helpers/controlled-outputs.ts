import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { database } from "../../src/platform/database";
import { readOperation } from "../../src/shared/receipts";
import { documentStore, digest } from "../../src/documents/store";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { requestIssue } from "../../src/documents/packs";
import {
  processReportJob,
  requestReportIssue,
  readReportBundle,
} from "../../src/reports/worker";
import { amendReport, readReport } from "../../src/reports/service";
import {
  processFinanceJob,
  requestFinanceEvidence,
  readFinanceBundle,
} from "../../src/finance/worker";
import { queued, base, rows, id } from "./packs";
import { reviewed } from "./reports";
import { reconciledFinance, readFinance } from "./finance";

export const families = ["pack", "report", "finance"] as const;
export type Family = (typeof families)[number];
export const outputId = { pack: "OUT-09", report: "OUT-10", finance: "OUT-14" };
export const policyTable = (family: Family) =>
  family === "pack" ? "pack_policy" : `${family}_template_policy`;

// Select already installed, supported immutable definitions in the disposable
// fixture. This is not a template publication API or a production policy change.
export async function selectTemplate(family: Family, version: 1 | 2) {
  await database().query(
    `UPDATE ppo.${policyTable(family)} p SET template_id=t.id,version=p.version+1 FROM ppo.${family}_templates t WHERE t.workspace_id=p.workspace_id AND t.version=$1`,
    [version],
  );
}

export async function controlledOutput(family: Family) {
  if (family === "pack") {
    const q = await queued();
    return {
      family,
      p: q.p,
      id: q.pack.id,
      job: q.pack.jobs[0],
      process: (hooks: Parameters<typeof processRenderJob>[1] = {}) =>
        processRenderJob(q.pack.jobs[0].id, hooks),
      replay: () => requestIssue(q.p, q.pack.id, q.cmd),
      receipt: q.receipt.receipt,
      changeSource: () =>
        database().query(
          "UPDATE ppo.sites SET display_name=display_name || ' SYN changed',version=version+1 WHERE id=$1",
          [id("70")],
        ),
    };
  }
  if (family === "report") {
    const q = await reviewed(),
      r = q.report;
    const cmd = {
      ...base(),
      expected_version: r.version,
      revision_id: r.revisions[0].id,
      review_id: r.reviews[0].id,
      template_id: r.template.id,
      template_version: r.template.version,
    };
    const receipt = await requestReportIssue(q.reviewer, r.id, cmd);
    const job = (await readReport(q.reviewer, r.id)).items[0].jobs[0];
    return {
      family,
      p: q.reviewer,
      id: r.id,
      job,
      process: (hooks: Parameters<typeof processReportJob>[1] = {}) =>
        processReportJob(job.id, hooks),
      replay: () => requestReportIssue(q.reviewer, r.id, cmd),
      receipt: receipt.receipt,
      changeSource: () =>
        database().query(
          "UPDATE ppo.sites SET display_name=display_name || ' SYN changed',version=version+1 WHERE id=$1",
          [id("70")],
        ),
    };
  }
  const q = await reconciledFinance(),
    r = await readFinance(q.reconciler, q.id);
  const cmd = {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    review_id: r.reviews[0].id,
    reconciliation_id: r.reconciliations[0].id,
  };
  const receipt = await requestFinanceEvidence(q.reconciler, q.id, cmd);
  const job = (
    await rows("SELECT * FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      q.id,
    ])
  )[0];
  return {
    family,
    p: q.reconciler,
    id: q.id,
    job,
    process: (hooks: Parameters<typeof processFinanceJob>[1] = {}) =>
      processFinanceJob(job.id, hooks),
    replay: () => requestFinanceEvidence(q.reconciler, q.id, cmd),
    receipt: receipt.receipt,
    changeSource: () =>
      amendReport(q.q.p, q.q.report.id, {
        ...base(),
        expected_version: q.q.report.version,
        revision_id: q.q.report.revisions[0].id,
      }),
  };
}
export type ControlledOutput = Awaited<ReturnType<typeof controlledOutput>>;
export async function businessRow(q: ControlledOutput) {
  const table =
    q.family === "pack"
      ? "packs"
      : q.family === "report"
        ? "service_reports"
        : "finance_handoffs";
  return (await rows(`SELECT * FROM ppo.${table} WHERE id=$1`, [q.id]))[0];
}
export async function jobRow(q: ControlledOutput) {
  return (
    await rows(`SELECT * FROM ppo.${q.family}_render_jobs WHERE id=$1`, [
      q.job.id,
    ])
  )[0];
}
export async function issuedRows(q: ControlledOutput) {
  return rows(`SELECT * FROM ppo.${q.family}_issues WHERE render_job_id=$1`, [
    q.job.id,
  ]);
}
export async function storedOutput(q: ControlledOutput) {
  return documentStore().locate({ ...q.p, operation_id: q.job.id });
}
export async function exactOutput(q: ControlledOutput) {
  const [issue] = await issuedRows(q);
  assert.ok(issue, "Release must have an actual issued row");
  const bytes =
    q.family === "pack"
      ? await readBundle(q.p, issue.manifest)
      : q.family === "report"
        ? await readReportBundle(q.p, issue.manifest)
        : await readFinanceBundle(q.p, issue.manifest);
  assert.equal(digest(bytes.html), issue.manifest.html_hash);
  assert.equal(digest(bytes.pdf), issue.manifest.pdf_hash);
  return { issue, ...bytes };
}
export async function finalisationEffects(q: ControlledOutput) {
  const job = await jobRow(q);
  const operations = await rows(
    "SELECT to_jsonb(r) AS row FROM ppo.operation_receipts r WHERE operation_id=$1",
    [job.finalisation_operation_id],
  );
  const audit = await rows(
    "SELECT to_jsonb(r) AS row FROM ppo.audit_events r WHERE operation_id=$1",
    [job.finalisation_operation_id],
  );
  const outbox = await rows(
    "SELECT to_jsonb(r) AS row FROM ppo.outbox_jobs r WHERE operation_id=$1",
    [job.finalisation_operation_id],
  );
  const issue = await issuedRows(q);
  const extra =
    q.family === "pack"
      ? await rows(
          "SELECT to_jsonb(r) AS row FROM ppo.pack_recipients r WHERE issue_id=$1 ORDER BY id",
          [job.render_snapshot.issue_id],
        )
      : q.family === "report"
        ? await rows(
            "SELECT to_jsonb(r) AS row FROM ppo.report_presentations r WHERE issue_id=$1 ORDER BY id",
            [job.render_snapshot.output.issue_id],
          )
        : [];
  const distribution =
    q.family === "pack"
      ? await rows(
          "SELECT to_jsonb(e) AS row FROM ppo.pack_distribution_events e JOIN ppo.pack_recipients r ON r.id=e.recipient_id WHERE r.issue_id=$1 ORDER BY e.id",
          [job.render_snapshot.issue_id],
        )
      : q.family === "report"
        ? await rows(
            "SELECT to_jsonb(f) AS follow_up,to_jsonb(a) AS activity,(SELECT jsonb_agg(to_jsonb(l) ORDER BY object_type,object_id) FROM ppo.activity_links l WHERE l.activity_id=a.id) AS links FROM ppo.report_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id WHERE f.report_id=$1 AND f.kind='Distribution' ORDER BY f.activity_id",
            [q.id],
          )
        : [];
  return { operations, audit, outbox, issue, extra, distribution };
}
export async function assertNotIssued(q: ControlledOutput) {
  assert.notEqual((await jobRow(q)).state, "Issued");
  const effects = await finalisationEffects(q);
  for (const [name, values] of Object.entries(effects))
    assert.equal(values.length, 0, `No partial ${name} may escape rollback`);
}
export async function assertOneIssue(q: ControlledOutput) {
  const effects = await finalisationEffects(q);
  assert.equal(effects.issue.length, 1);
  assert.equal(effects.operations.length, 1);
  assert.equal(effects.audit.length, 1);
  assert.equal(effects.outbox.length, 1);
  if (q.family === "pack") {
    assert.equal(effects.extra.length, 2);
    assert.equal(effects.distribution.length, 2);
  }
  if (q.family === "report") {
    assert.equal(effects.extra.length, 1);
    assert.equal(effects.distribution.length, 1);
  }
  const job = await jobRow(q);
  assert.equal(job.state, "Issued");
  assert.equal(
    effects.issue[0].id,
    job.render_snapshot.issue_id ?? job.render_snapshot.output.issue_id,
  );
  assert.deepEqual(
    (await q.replay()).receipt,
    q.receipt,
    "Unchanged request recovers its original queued receipt",
  );
  assert.equal(
    (await readOperation(q.p, job.finalisation_operation_id)).record_id,
    q.id,
  );
  return effects;
}
export async function evidence(
  name: string,
  q: ControlledOutput,
  detail: unknown = {},
) {
  const root = process.env.PPO_PT23_EVIDENCE_DIRECTORY;
  if (!root) return;
  await mkdir(root, { recursive: true });
  const job = await jobRow(q),
    stored = await storedOutput(q);
  await writeFile(
    join(root, `${q.family}-${name}.json`),
    JSON.stringify(
      {
        family: outputId[q.family],
        detail,
        job,
        attempts: await rows(
          `SELECT * FROM ppo.${q.family}_render_attempts WHERE job_id=$1 ORDER BY occurred_at`,
          [q.job.id],
        ),
        effects: await finalisationEffects(q),
        stored_sha256: stored ? digest(stored.bytes) : null,
      },
      null,
      2,
    ) + "\n",
  );
}
