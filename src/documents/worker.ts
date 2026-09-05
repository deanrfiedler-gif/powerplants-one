import { randomUUID } from "node:crypto";
import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import type { DocumentKey } from "../adapters/contracts";
import { recordOperation, canonical } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { uuid } from "../shared/validation";
import { packContext, snapshot, fail } from "./context";
import { insert, bumpPack, issueEvent } from "./packs";
import { documentStore, digest } from "./store";
import { renderPack, type PackSnapshot } from "./render";
type Bundle = {
  schema_version: 1;
  job_id: string;
  input_hash: string;
  issue_id: string;
  prepared_at: string;
  html: string;
  pdf_base64: string;
  browser_version: string;
  renderer_version: string;
};
export type OutputManifest = {
  schema_version: 1;
  job_id: string;
  issue_id: string;
  snapshot_hash: string;
  template: PackSnapshot["template"];
  sources: {
    id: string;
    title: string;
    version_id: string;
    hash: string;
    byte_count: number;
  }[];
  store_key: DocumentKey;
  bundle_bytes: number;
  html_hash: string;
  html_bytes: number;
  pdf_hash: string;
  pdf_bytes: number;
  filename: string;
  prepared_at: string;
  renderer_version: string;
  browser_version: string;
};
function verifyBundle(
  bytes: Uint8Array,
  job: {
    id: string;
    input_hash: string;
    render_snapshot: {
      source: PackSnapshot;
      issue_id: string;
      prepared_at: string;
    };
  },
) {
  const b = JSON.parse(Buffer.from(bytes).toString("utf8")) as Bundle;
  if (
    b.schema_version !== 1 ||
    b.job_id !== job.id ||
    b.input_hash !== job.input_hash ||
    b.issue_id !== job.render_snapshot.issue_id ||
    b.prepared_at !== job.render_snapshot.prepared_at
  )
    fail(
      "Stored output does not match the original render intent.",
      "StoredOutputConflict",
    );
  const pdf = Buffer.from(b.pdf_base64, "base64");
  if (
    !pdf.subarray(0, 5).equals(Buffer.from("%PDF-")) ||
    !b.html.startsWith("<!doctype html>")
  )
    fail("Stored output is invalid.", "StoredOutputConflict");
  return { b, pdf };
}
async function attempt(
  c: Parameters<typeof insert>[0],
  job: Record<string, unknown>,
  outcome: string,
  code?: string,
) {
  await insert(c, "pack_render_attempts", {
    id: randomUUID(),
    workspace_id: job.workspace_id,
    job_id: job.id,
    attempt: job.attempts,
    outcome,
    code: code ?? null,
    actor_id: job.actor_id,
  });
}
export async function processRenderJob(
  id: string,
  hooks: {
    afterRender?: () => Promise<void>;
    afterStore?: () => Promise<void>;
    beforeFinalise?: () => Promise<void>;
    render?: typeof renderPack;
  } = {},
) {
  uuid(id, "job_id");
  const token = randomUUID();
  const job = await transaction(async (c) => {
    const row = (
      await c.query(
        "SELECT * FROM ppo.pack_render_jobs WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!row) throw unavailable();
    if (
      row.state === "Issued" ||
      row.state === "StaleSource" ||
      (row.lease_until && row.lease_until > new Date())
    )
      return null;
    const j = (
      await c.query(
        "UPDATE ppo.pack_render_jobs SET state='Running',attempts=attempts+1,lease_token=$2,lease_until=clock_timestamp()+interval '2 minutes',error_code=null WHERE id=$1 RETURNING *",
        [id, token],
      )
    ).rows[0];
    await attempt(c, j, "Claimed");
    return j;
  });
  if (!job) return { processed: false };
  const p: Principal = {
      workspace_id: job.workspace_id,
      actor_id: job.actor_id,
      display_name: "Server-derived issue owner",
    },
    ctx = { ...p, operation_id: job.id };
  try {
    // Recheck authority before file access; repeat after storage in the final transaction.
    await packContext(database(), p, job.pack_id, "pack.issue");
    let stored = await documentStore().locate(ctx);
    if (!stored) {
      const generated = await (hooks.render ?? renderPack)(
        job.render_snapshot.source,
        job.render_snapshot,
      );
      await hooks.afterRender?.();
      const bundle: Bundle = {
        schema_version: 1,
        job_id: job.id,
        input_hash: job.input_hash,
        issue_id: job.render_snapshot.issue_id,
        prepared_at: job.render_snapshot.prepared_at,
        html: generated.html,
        pdf_base64: generated.pdf.toString("base64"),
        browser_version: generated.browser_version,
        renderer_version: generated.renderer_version,
      };
      const bytes = Buffer.from(canonical(bundle));
      try {
        await documentStore().store(ctx, bytes, digest(bytes));
      } catch (e) {
        if (!(e instanceof AppError) || e.code !== "StoredOperationConflict")
          throw e;
      }
      stored = await documentStore().locate(ctx);
    }
    if (!stored) throw Error("No durable bundle");
    const { b, pdf } = verifyBundle(stored.bytes, job),
      s = job.render_snapshot.source as PackSnapshot;
    const manifest: OutputManifest = {
      schema_version: 1,
      job_id: id,
      issue_id: b.issue_id,
      snapshot_hash: b.input_hash,
      template: s.template,
      sources: s.sources.map(({ id, title, version_id, hash, byte_count }) => ({
        id,
        title,
        version_id,
        hash,
        byte_count,
      })),
      store_key: stored.key,
      bundle_bytes: stored.bytes.length,
      html_hash: digest(b.html),
      html_bytes: Buffer.byteLength(b.html),
      pdf_hash: digest(pdf),
      pdf_bytes: pdf.length,
      filename: `${s.pack_reference}-job-pack-r${String(s.revision).padStart(2, "0")}.pdf`,
      prepared_at: b.prepared_at,
      renderer_version: b.renderer_version,
      browser_version: b.browser_version,
    };
    await documentStore().read(ctx, manifest.store_key);
    await hooks.afterStore?.();
    await transaction(async (c) => {
      const updated = await c.query(
        "UPDATE ppo.pack_render_jobs SET state='Durable',output_manifest=$3 WHERE id=$1 AND lease_token=$2 AND state<>'Issued'",
        [id, token, manifest],
      );
      if (updated.rowCount) await attempt(c, job, "Durable");
    });
    await hooks.beforeFinalise?.();
    return await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      const currentJob = (
        await c.query(
          "SELECT * FROM ppo.pack_render_jobs WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (currentJob.state === "Issued")
        return { processed: true, issue_id: currentJob.issue_id };
      if (currentJob.lease_token !== token)
        throw new AppError(
          409,
          "WorkerLeaseChanged",
          "The original render job is being recovered by another worker.",
        );
      const { pack, a } = await packContext(c, p, job.pack_id, "pack.issue");
      if (
        pack.current_revision_id !== job.revision_id ||
        pack.status !== "Checked"
      )
        fail(
          "The checked pack changed during rendering. Original output retained.",
          "StaleSource",
        );
      const r = (
        await c.query("SELECT * FROM ppo.pack_revisions WHERE id=$1", [
          job.revision_id,
        ])
      ).rows[0];
      const now = await snapshot(
        c,
        p,
        a.id,
        pack.display_number,
        r.revision,
        r.input,
      );
      if (digest(canonical(now)) !== job.input_hash)
        fail(
          "Source, template, appointment or recipients changed during rendering. Original output retained for review.",
          "StaleSource",
        );
      const issue = await insert(c, "pack_issues", {
        id: b.issue_id,
        workspace_id: p.workspace_id,
        pack_id: pack.id,
        revision_id: r.id,
        render_job_id: id,
        issued_by: p.actor_id,
        manifest,
        output_hash: manifest.pdf_hash,
        snapshot_hash: job.input_hash,
        assignment_version: a.assignment_version,
        schedule_version: a.schedule_version,
      });
      if (pack.current_issue_id)
        await issueEvent(
          c,
          p,
          pack.current_issue_id,
          "Superseded",
          r.change_reason,
        );
      await issueEvent(
        c,
        p,
        issue.id,
        "Issued",
        "Durable bytes verified and current issue guards passed.",
      );
      for (const member of s.recipients) {
        const recipient = await insert(c, "pack_recipients", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          issue_id: issue.id,
          assignment_id: member.assignment_id,
          assignment_version: member.assignment_version,
          user_id: member.user_id,
        });
        await insert(c, "pack_distribution_events", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          recipient_id: recipient.id,
          actor_id: p.actor_id,
          kind: "TaskCreated",
          evidence:
            "Durable in-app task only; no message sent, delivery or acknowledgement inferred.",
        });
      }
      const result = await bumpPack(c, p, pack.id, {
        status: "Issued",
        needs_review: false,
        current_issue_id: issue.id,
      });
      await c.query(
        "UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),dispatch_hold=true,pack_requirement='AwaitingAcknowledgement' WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, a.id, p.actor_id],
      );
      const receipt = await recordOperation(
        c,
        p,
        {
          operation_id: job.finalisation_operation_id,
          reason: "P06 durable output verified; exact checked revision issued.",
        },
        result,
        "Pack",
        "PackIssued",
        digest(
          canonical({
            job_id: id,
            input_hash: job.input_hash,
            output_hash: manifest.pdf_hash,
          }),
        ),
        {
          command: "FinalisePackIssue",
          job_id: id,
          issue_id: issue.id,
          output_hash: manifest.pdf_hash,
        },
      );
      await c.query(
        "UPDATE ppo.pack_render_jobs SET state='Issued',issue_id=$3,lease_until=null WHERE id=$1 AND lease_token=$2",
        [id, token, issue.id],
      );
      await attempt(c, job, "Issued");
      await c.query(
        "UPDATE ppo.outbox_jobs SET status='Done',attempts=$4,error_code=null WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND kind='PackIssueRequested'",
        [p.workspace_id, p.actor_id, job.operation_id, job.attempts],
      );
      return { processed: true, issue_id: issue.id, receipt };
    });
  } catch (e) {
    const code = e instanceof AppError ? e.code : "RenderOrStorageFailure",
      state = [
        "StaleSource",
        "ScopeReviewRequired",
        "RecipientUnavailable",
        "TemplateUnavailable",
        "PolicyUnavailable",
        "PackNotReady",
      ].includes(code)
        ? "StaleSource"
        : "Failed";
    await transaction(async (c) => {
      const updated = await c.query(
        "UPDATE ppo.pack_render_jobs SET state=$3,error_code=$4,lease_until=null WHERE id=$1 AND lease_token=$2 AND state<>'Issued'",
        [id, token, state, code],
      );
      if (updated.rowCount) await attempt(c, job, state, code);
    });
    return { processed: true, state, error_code: code };
  }
}
export async function runPendingRenderJobs() {
  const jobs = (
    await database().query(
      "SELECT id FROM ppo.pack_render_jobs WHERE state IN ('Queued','Running','Durable') AND (lease_until IS NULL OR lease_until<clock_timestamp()) ORDER BY requested_at LIMIT 5",
    )
  ).rows;
  for (const job of jobs) await processRenderJob(job.id);
  return jobs.length;
}
export async function readRenderJob(p: Principal, id: string) {
  const j = (
    await database().query(
      "SELECT * FROM ppo.pack_render_jobs WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "job_id")],
    )
  ).rows[0];
  if (!j) throw unavailable();
  await packContext(database(), p, j.pack_id, "pack.issue");
  return {
    id: j.id,
    pack_id: j.pack_id,
    revision_id: j.revision_id,
    state: j.state,
    attempts: j.attempts,
    error_code: j.error_code,
    requested_at: j.requested_at,
    recovery_owner_id: j.recovery_owner_id,
    issue_id: j.issue_id,
    output_manifest: j.output_manifest,
    attempt_history: (
      await database().query(
        "SELECT attempt,outcome,code,occurred_at FROM ppo.pack_render_attempts WHERE workspace_id=$1 AND job_id=$2 ORDER BY occurred_at",
        [p.workspace_id, id],
      )
    ).rows,
  };
}
export async function retryRenderJob(p: Principal, id: string) {
  await readRenderJob(p, id);
  await processRenderJob(id);
  return readRenderJob(p, id);
}
export async function readBundle(p: Principal, manifest: OutputManifest) {
  const bytes = await documentStore().read(
    { ...p, operation_id: manifest.job_id },
    manifest.store_key,
  );
  if (bytes.byteLength !== manifest.bundle_bytes)
    throw Error("Stored size mismatch");
  const b = JSON.parse(Buffer.from(bytes).toString("utf8")) as Bundle;
  const pdf = Buffer.from(b.pdf_base64, "base64");
  if (
    digest(b.html) !== manifest.html_hash ||
    digest(pdf) !== manifest.pdf_hash ||
    pdf.length !== manifest.pdf_bytes ||
    Buffer.byteLength(b.html) !== manifest.html_bytes
  )
    throw Error("Stored bytes mismatch");
  return { html: b.html, pdf };
}
