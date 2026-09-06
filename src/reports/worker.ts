import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import type { DocumentKey } from "../adapters/contracts";
import { database, transaction } from "../platform/database";
import {
  sharedOperation,
  recordOperation,
  canonical,
} from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { insert } from "../documents/packs";
import { documentStore, digest } from "../documents/store";
import { uuid } from "../shared/validation";
import { sameVersion } from "../scheduling/validation";
import {
  reportContext,
  bump,
  fail,
  sourceGuard,
  recipient,
  followUp,
} from "./context";
import { verifyEvidence } from "./service";
import { issueCommand } from "./validation";
import {
  renderReport,
  reportHtml,
  type CustomerSnapshot,
} from "./render";
import { currentReportTemplate } from "./template";
type Output = {
  kind: "IssuedReport";
  prepared_at: string;
  issue_id: string;
  template_hash: string;
};
type RenderInput = {
  source: CustomerSnapshot;
  output: Output;
  review_id: string;
  revision_id: string;
  source_hash: string;
  customer_hash: string;
  template: {
    id: string;
    version: number;
    content_hash: string;
    policy_version: number;
  };
  guard: unknown;
};
type Bundle = {
  schema_version: 1;
  job_id: string;
  input_hash: string;
  html: string;
  pdf_base64: string;
  browser_version: string;
  renderer_version: string;
};
export type ReportManifest = {
  schema_version: 1;
  job_id: string;
  issue_id: string;
  revision_id: string;
  review_id: string;
  source_hash: string;
  customer_hash: string;
  template: RenderInput["template"];
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
async function template(c: Parameters<typeof insert>[0], p: Principal) {
  const t = (
    await c.query(
      "SELECT t.*,p.version AS policy_version FROM ppo.report_templates t JOIN ppo.report_template_policy p ON (p.workspace_id,p.template_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1",
      [p.workspace_id],
    )
  ).rows[0];
  if (
    !t ||
    t.definition !== await currentReportTemplate() ||
    t.content_hash !== digest(t.definition)
  )
    fail(
      "TemplateUnavailable",
      "The exact supported report template is unavailable.",
    );
  return {
    id: t.id,
    version: t.version,
    content_hash: t.content_hash,
    policy_version: t.policy_version,
  };
}
export async function requestReportIssue(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = issueCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "RequestReportIssue",
    (c) => reportContext(c, p, id, "report.issue"),
    async (c, ctx) => {
      sameVersion(ctx.report.version, cmd.expected_version, "report");
      if (
        ctx.report.status !== "Reviewed" ||
        ctx.report.current_revision_id !== cmd.revision_id
      )
        fail(
          "ReportNotReviewed",
          "Issue only the exact current reviewed report.",
        );
      const review = (
        await c.query(
          "SELECT * FROM ppo.report_reviews WHERE workspace_id=$1 AND report_id=$2 AND revision_id=$3 AND id=$4 AND decision='Approved'",
          [p.workspace_id, id, cmd.revision_id, cmd.review_id],
        )
      ).rows[0];
      if (!review) throw unavailable();
      await verifyEvidence(c, p, cmd.revision_id);
      const t = await template(c, p);
      if (t.id !== cmd.template_id || t.version !== cmd.template_version)
        fail(
          "TemplateChanged",
          "Refresh the exact current template before requesting output.",
        );
      const current = {
        ...(await sourceGuard(c, p, ctx)),
        recipient: await recipient(c, p, ctx, review.recipient_id),
      };
      if (canonical(current) !== canonical(review.source_guard))
        fail(
          "StaleSource",
          "Source or audience changed after review. Open a successor review cycle.",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.report_render_jobs WHERE workspace_id=$1 AND revision_id=$2",
            [p.workspace_id, cmd.revision_id],
          )
        ).rowCount
      )
        fail(
          "RenderAlreadyRequested",
          "Recover the original owned render attempt.",
        );
      const jobId = randomUUID(),
        render_snapshot: RenderInput = {
          source: review.customer_snapshot,
          review_id: review.id,
          revision_id: cmd.revision_id,
          source_hash: review.source_hash,
          customer_hash: review.customer_hash,
          template: t,
          guard: current,
          output: {
            kind: "IssuedReport",
            prepared_at: new Date().toISOString(),
            issue_id: randomUUID(),
            template_hash: t.content_hash,
          },
        };
      await insert(c, "report_render_jobs", {
        id: jobId,
        workspace_id: p.workspace_id,
        report_id: id,
        revision_id: cmd.revision_id,
        review_id: review.id,
        actor_id: p.actor_id,
        recovery_owner_id: ctx.w.service_owner_id,
        operation_id: cmd.operation_id,
        finalisation_operation_id: randomUUID(),
        render_snapshot,
        input_hash: digest(canonical(render_snapshot)),
      });
      await followUp(
        c,
        p,
        ctx,
        "OutputRecovery",
        "Verify and issue the exact customer report; recover this original attempt if output is interrupted.",
      );
      const result = await bump(c, p, id, {});
      return {
        ...result,
        state: "Queued",
        audit_details: {
          job_id: jobId,
          revision_id: cmd.revision_id,
          review_id: review.id,
        },
      };
    },
    "ServiceReport",
    "ReportIssueRequested",
  );
}
export async function processReportJob(
  id: string,
  hooks: {
    afterRender?: () => Promise<void>;
    afterStore?: () => Promise<void>;
    beforeFinalise?: () => Promise<void>;
  } = {},
) {
  uuid(id, "job_id");
  const token = randomUUID(),
    job = await transaction(async (c) => {
      const j = (
        await c.query(
          "SELECT * FROM ppo.report_render_jobs WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!j) throw unavailable();
      if (
        ["Issued", "StaleSource"].includes(j.state) ||
        (j.lease_until && j.lease_until > new Date())
      )
        return null;
      const row = (
        await c.query(
          "UPDATE ppo.report_render_jobs SET state='Running',attempts=attempts+1,lease_token=$2,lease_until=clock_timestamp()+interval '2 minutes',error_code=null WHERE id=$1 RETURNING *",
          [id, token],
        )
      ).rows[0];
      await insert(c, "report_render_attempts", {
        id: randomUUID(),
        workspace_id: row.workspace_id,
        job_id: id,
        attempt: row.attempts,
        outcome: "Claimed",
      });
      return row;
    });
  if (!job) return { processed: false };
  const p: Principal = {
      workspace_id: job.workspace_id,
      actor_id: job.actor_id,
      display_name: "Server-derived report issue owner",
    },
    ctx = { ...p, operation_id: id },
    s = job.render_snapshot as RenderInput;
  try {
    await reportContext(database(), p, job.report_id, "report.issue");
    let stored = await documentStore().locate(ctx);
    if (!stored) {
      const generated = await renderReport(s.source, s.output);
      await hooks.afterRender?.();
      const bundle: Bundle = {
        schema_version: 1,
        job_id: id,
        input_hash: job.input_hash,
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
    if (!stored) throw Error("Missing bundle");
    const b = JSON.parse(stored.bytes.toString("utf8")) as Bundle,
      pdf = Buffer.from(b.pdf_base64, "base64");
    if (
      b.schema_version !== 1 ||
      b.job_id !== id ||
      b.input_hash !== job.input_hash ||
      b.html !== reportHtml(s.source, s.output) ||
      !pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )
      fail(
        "StoredOutputConflict",
        "The retained bytes differ from this original render intent.",
      );
    const manifest: ReportManifest = {
      schema_version: 1,
      job_id: id,
      issue_id: s.output.issue_id,
      revision_id: s.revision_id,
      review_id: s.review_id,
      source_hash: s.source_hash,
      customer_hash: s.customer_hash,
      template: s.template,
      store_key: stored.key,
      bundle_bytes: stored.bytes.length,
      html_hash: digest(b.html),
      html_bytes: Buffer.byteLength(b.html),
      pdf_hash: digest(pdf),
      pdf_bytes: pdf.length,
      filename: `${s.source.reference}-service-report-r${String(s.source.revision).padStart(2, "0")}.pdf`,
      prepared_at: s.output.prepared_at,
      renderer_version: b.renderer_version,
      browser_version: b.browser_version,
    };
    await documentStore().read(ctx, stored.key);
    await hooks.afterStore?.();
    await transaction(async (c) => {
      const done = await c.query(
        "UPDATE ppo.report_render_jobs SET state='Durable',output_manifest=$3 WHERE id=$1 AND lease_token=$2 AND state<>'Issued'",
        [id, token, manifest],
      );
      if (done.rowCount)
        await insert(c, "report_render_attempts", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          job_id: id,
          attempt: job.attempts,
          outcome: "Durable",
        });
    });
    await hooks.beforeFinalise?.();
    return await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      const now = (
        await c.query(
          "SELECT * FROM ppo.report_render_jobs WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (now.state === "Issued")
        return { processed: true, issue_id: now.issue_id };
      if (now.lease_token !== token)
        fail("WorkerLeaseChanged", "Another worker owns the original attempt.");
      const current = await reportContext(c, p, job.report_id, "report.issue");
      if (
        current.report.status !== "Reviewed" ||
        current.report.current_revision_id !== job.revision_id
      )
        fail(
          "StaleSource",
          "The reviewed report changed during rendering. Original output is retained.",
        );
      await verifyEvidence(c, p, job.revision_id);
      const guard = {
        ...(await sourceGuard(c, p, current)),
        recipient: await recipient(c, p, current, s.source.audience.id),
      };
      if (
        canonical(guard) !== canonical(s.guard) ||
        canonical(await template(c, p)) !== canonical(s.template)
      )
        fail(
          "StaleSource",
          "Source, template or named audience changed during rendering. Create a successor review cycle.",
        );
      // Verify bytes again after all hooks and immediately before the issue transaction commits.
      await readReportBundle(p, manifest);
      const issue = await insert(c, "report_issues", {
        id: s.output.issue_id,
        workspace_id: p.workspace_id,
        report_id: job.report_id,
        revision_id: job.revision_id,
        review_id: job.review_id,
        render_job_id: id,
        issued_by: p.actor_id,
        manifest,
        output_hash: manifest.pdf_hash,
        recipient_id: s.source.audience.id,
      });
      await insert(c, "report_presentations", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        report_id: job.report_id,
        revision_id: job.revision_id,
        issue_id: issue.id,
        kind: "IssuedReport",
        content_hash: manifest.html_hash,
        html_hash: manifest.html_hash,
      });
      await followUp(
        c,
        p,
        current,
        "Distribution",
        "Arrange a synthetic in-app presentation and explicit response for the named customer contact. No message has been sent.",
      );
      const result = await bump(c, p, job.report_id, {
        status: "Issued",
        current_issue_id: issue.id,
      });
      const receipt = await recordOperation(
        c,
        p,
        {
          operation_id: job.finalisation_operation_id,
          reason:
            "P09 exact durable report bytes and reviewed source verified.",
        },
        result,
        "ServiceReport",
        "ReportIssued",
        digest(
          canonical({
            job_id: id,
            input_hash: job.input_hash,
            output_hash: manifest.pdf_hash,
          }),
        ),
        {
          command: "FinaliseReportIssue",
          job_id: id,
          issue_id: issue.id,
          output_hash: manifest.pdf_hash,
        },
      );
      await c.query(
        "UPDATE ppo.report_render_jobs SET state='Issued',issue_id=$3,lease_until=null WHERE id=$1 AND lease_token=$2",
        [id, token, issue.id],
      );
      await insert(c, "report_render_attempts", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        job_id: id,
        attempt: job.attempts,
        outcome: "Issued",
      });
      await c.query(
        "UPDATE ppo.outbox_jobs SET status='Done',attempts=$4,error_code=null WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND kind='ReportIssueRequested'",
        [p.workspace_id, p.actor_id, job.operation_id, job.attempts],
      );
      return { processed: true, issue_id: issue.id, receipt };
    });
  } catch (e) {
    const code = e instanceof AppError ? e.code : "RenderOrStorageFailure",
      state = [
        "StaleSource",
        "EvidenceSetChanged",
        "TemplateUnavailable",
      ].includes(code)
        ? "StaleSource"
        : "Failed";
    await transaction(async (c) => {
      const changed = await c.query(
        "UPDATE ppo.report_render_jobs SET state=$3,error_code=$4,lease_until=null WHERE id=$1 AND lease_token=$2 AND state<>'Issued'",
        [id, token, state, code],
      );
      if (changed.rowCount)
        await insert(c, "report_render_attempts", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          job_id: id,
          attempt: job.attempts,
          outcome: state,
          code,
        });
    });
    return { processed: true, state, error_code: code };
  }
}
export async function readReportBundle(p: Principal, m: ReportManifest) {
  const bytes = await documentStore().read(
    { ...p, operation_id: m.job_id },
    m.store_key,
  );
  if (bytes.byteLength !== m.bundle_bytes)
    fail("ExactDocumentUnavailable", "Stored size differs.");
  const b = JSON.parse(Buffer.from(bytes).toString("utf8")) as Bundle,
    pdf = Buffer.from(b.pdf_base64, "base64");
  if (
    b.job_id !== m.job_id ||
    digest(b.html) !== m.html_hash ||
    digest(pdf) !== m.pdf_hash ||
    pdf.length !== m.pdf_bytes ||
    Buffer.byteLength(b.html) !== m.html_bytes
  )
    fail(
      "ExactDocumentUnavailable",
      "Original report bytes do not match their immutable manifest.",
    );
  return { html: b.html, pdf };
}
export async function readReportJob(p: Principal, id: string) {
  const j = (
    await database().query(
      "SELECT * FROM ppo.report_render_jobs WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "job_id")],
    )
  ).rows[0];
  if (!j) throw unavailable();
  await reportContext(database(), p, j.report_id, "report.issue");
  return {
    id: j.id,
    report_id: j.report_id,
    state: j.state,
    attempts: j.attempts,
    error_code: j.error_code,
    issue_id: j.issue_id,
    output_manifest: j.output_manifest,
    attempt_history: (
      await database().query(
        "SELECT attempt,outcome,code,occurred_at FROM ppo.report_render_attempts WHERE workspace_id=$1 AND job_id=$2 ORDER BY occurred_at",
        [p.workspace_id, id],
      )
    ).rows,
  };
}
export async function retryReportJob(p: Principal, id: string) {
  await readReportJob(p, id);
  await processReportJob(id);
  return readReportJob(p, id);
}
export async function runReportJobs() {
  const jobs = (
    await database().query(
      "SELECT id FROM ppo.report_render_jobs WHERE state IN ('Queued','Running','Durable') AND (lease_until IS NULL OR lease_until<clock_timestamp()) ORDER BY requested_at LIMIT 5",
    )
  ).rows;
  for (const j of jobs) await processReportJob(j.id);
  return jobs.length;
}
