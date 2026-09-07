import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import type { DocumentKey } from "../adapters/contracts";
import { database, transaction } from "../platform/database";
import { sharedOperation, recordOperation } from "../platform/operations";
import { insert } from "../documents/packs";
import { documentStore, digest } from "../documents/store";
import { sameVersion } from "../scheduling/validation";
import { uuid, object } from "../shared/validation";
import { unavailable, AppError } from "../platform/errors";
import { financeContext, hash, blocked } from "./context";
import { currentRevision, financeLines, bump } from "./service";
import { command } from "./validation";
import { type FinanceOutput, type ReservedOutput } from "./render";
import { supportedTemplateDefinition } from "../documents/p11-template";
import {
  supportedFinanceHtml,
  supportedRenderFinance,
} from "../documents/p11-render";
async function template(c: PoolClient, p: Principal) {
  const t = (
    await c.query(
      "SELECT t.*,p.version AS policy_version FROM ppo.finance_templates t JOIN ppo.finance_template_policy p ON (p.workspace_id,p.template_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1",
      [p.workspace_id],
    )
  ).rows[0];
  if (
    !t ||
    t.definition !== (await supportedTemplateDefinition("OUT-14", t.version)) ||
    t.content_hash !== digest(t.definition)
  )
    blocked(
      "TemplateUnavailable",
      "The exact Finance template is unavailable.",
    );
  return {
    id: t.id,
    version: t.version,
    content_hash: t.content_hash,
    policy_version: t.policy_version,
  };
}
type RenderInput = {
  source: FinanceOutput;
  output: ReservedOutput;
  template: Awaited<ReturnType<typeof template>>;
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
export type FinanceManifest = {
  schema_version: 1;
  job_id: string;
  issue_id: string;
  revision_id: string;
  review_id: string;
  reconciliation_id: string;
  source_hash: string;
  template: RenderInput["template"];
  store_key: DocumentKey;
  bundle_bytes: number;
  html_hash: string;
  html_bytes: number;
  pdf_hash: string;
  pdf_bytes: number;
  filename: string;
  prepared_at: string;
  browser_version: string;
  renderer_version: string;
  audience: "CurrentScopedFinance";
};
export async function requestFinanceEvidence(
  p: Principal,
  id: string,
  input: unknown,
) {
  const { v, cmd: base } = command(id, input, [
      "revision_id",
      "review_id",
      "reconciliation_id",
    ]),
    cmd = {
      ...base,
      revision_id: uuid(v.revision_id, "revision_id"),
      review_id: uuid(v.review_id, "review_id"),
      reconciliation_id: uuid(v.reconciliation_id, "reconciliation_id"),
    };
  return sharedOperation(
    p,
    cmd,
    "RequestFinanceEvidence",
    (c) => financeContext(c, p, id, "finance.issue"),
    async (c, ctx) => {
      sameVersion(ctx.h.version, cmd.expected_version);
      if (ctx.h.status !== "Reconciled")
        blocked(
          "FinanceStateChanged",
          "OUT-14 release requires the exact reconciled Finance revision.",
        );
      const r = await currentRevision(c, p, ctx),
        review = (
          await c.query(
            "SELECT * FROM ppo.finance_reviews WHERE workspace_id=$1 AND revision_id=$2",
            [p.workspace_id, r.id],
          )
        ).rows[0],
        recon = (
          await c.query(
            "SELECT * FROM ppo.finance_reconciliations WHERE workspace_id=$1 AND revision_id=$2",
            [p.workspace_id, r.id],
          )
        ).rows[0];
      if (
        cmd.revision_id !== r.id ||
        review.id !== cmd.review_id ||
        recon.id !== cmd.reconciliation_id
      )
        blocked(
          "SourceChanged",
          "The exact Finance review/reconciliation changed.",
        );
      const t = await template(c, p),
        outcome = (
          await c.query(
            "SELECT evidence FROM ppo.finance_outcomes WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, recon.outcome_id],
          )
        ).rows[0],
        source: FinanceOutput = {
          reference: ctx.h.display_number,
          work_reference: ctx.w.display_number,
          status: ctx.h.status,
          revision: r.revision,
          company_id: ctx.h.company_id,
          customer: ctx.w.customer_name,
          site: ctx.w.site_name,
          account: ctx.a.fixture_key,
          currency: ctx.h.currency,
          mode: ctx.h.mode,
          source_hash: r.source_hash,
          review_id: review.id,
          reconciliation_id: recon.id,
          treatment_basis: r.treatment_basis,
          remaining_work_basis: r.remaining_work_basis,
          reconciliation_basis: recon.basis,
          definition: {
            id: r.definition_id,
            version: r.definition_version,
            policy_version: r.policy_version,
          },
          corrections: (
            await c.query(
              "SELECT id,source_revision_id,outcome_id,disposition,reason,created_at FROM ppo.finance_corrections WHERE workspace_id=$1 AND handoff_id=$2 ORDER BY created_at",
              [p.workspace_id, id],
            )
          ).rows,
          lines: await financeLines(c, p, r.id),
          source_manifest: r.source_snapshot.reports.map(
            (s: {
              report_id: string;
              revision_id: string;
              review_id: string;
              issue_id: string;
              source_hash: string;
              issue_hash: string;
              scope_guard: unknown;
              completion: unknown;
            }) => ({
              report_id: s.report_id,
              revision_id: s.revision_id,
              review_id: s.review_id,
              issue_id: s.issue_id,
              source_hash: s.source_hash,
              issue_hash: s.issue_hash,
              scope_and_authority: s.scope_guard,
              personal_completion: s.completion,
            }),
          ),
          target_evidence: outcome.evidence,
          no_posting: recon.no_posting,
        },
        snapshot: RenderInput = {
          source,
          output: {
            issue_id: randomUUID(),
            prepared_at: new Date().toISOString(),
            template_hash: t.content_hash,
          },
          template: t,
        };
      const job = await insert(c, "finance_render_jobs", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: id,
        revision_id: r.id,
        review_id: review.id,
        reconciliation_id: recon.id,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        finalisation_operation_id: randomUUID(),
        render_snapshot: snapshot,
        input_hash: hash(snapshot),
      });
      return bump(
        c,
        p,
        ctx.h,
        cmd,
        "EvidenceRequested",
        {},
        { job_id: job.id, reserved_issue_id: snapshot.output.issue_id },
      );
    },
    "FinancialHandoff",
    "FinanceEvidenceRequested",
  );
}
export async function readFinanceBundle(p: Principal, m: FinanceManifest) {
  const raw = await documentStore().read(
    { ...p, operation_id: m.job_id },
    m.store_key,
  );
  if (raw.length !== m.bundle_bytes)
    blocked(
      "ExactDocumentUnavailable",
      "Original Finance bundle size differs.",
    );
  const b = JSON.parse(Buffer.from(raw).toString("utf8")) as Bundle,
    pdf = Buffer.from(b.pdf_base64, "base64");
  if (
    b.job_id !== m.job_id ||
    digest(b.html) !== m.html_hash ||
    digest(pdf) !== m.pdf_hash ||
    pdf.length !== m.pdf_bytes ||
    Buffer.byteLength(b.html) !== m.html_bytes
  )
    blocked(
      "ExactDocumentUnavailable",
      "Original Finance bytes differ from the immutable manifest.",
    );
  return { html: b.html, pdf };
}
export async function processFinanceJob(
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
          "SELECT * FROM ppo.finance_render_jobs WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!j) throw unavailable();
      const p = {
        workspace_id: j.workspace_id,
        actor_id: j.actor_id,
        display_name: "Original Finance issue owner",
      };
      await financeContext(c, p, j.handoff_id, "finance.issue");
      if (
        ["Issued", "StaleSource"].includes(j.state) ||
        j.attempts >= 5 ||
        (j.lease_until && j.lease_until > new Date())
      )
        return null;
      const row = (
        await c.query(
          "UPDATE ppo.finance_render_jobs SET state='Running',attempts=attempts+1,lease_token=$2,lease_until=clock_timestamp()+interval '2 minutes',error_code=null WHERE id=$1 RETURNING *",
          [id, token],
        )
      ).rows[0];
      await insert(c, "finance_render_attempts", {
        id: randomUUID(),
        workspace_id: j.workspace_id,
        job_id: id,
        attempt: row.attempts,
        outcome: "Claimed",
      });
      return row;
    });
  if (!job) return { processed: false };
  const p = {
      workspace_id: job.workspace_id,
      actor_id: job.actor_id,
      display_name: "Original Finance issue owner",
    },
    ctx = { ...p, operation_id: id },
    s = job.render_snapshot as RenderInput;
  try {
    if (hash(s) !== job.input_hash)
      blocked(
        "ExactDocumentUnavailable",
        "The reserved Finance input differs.",
      );
    await financeContext(database(), p, job.handoff_id, "finance.issue");
    let stored = await documentStore().locate(ctx);
    if (!stored) {
      const rendered = await supportedRenderFinance(
        s.source,
        s.output,
        s.template.version,
      );
      await hooks.afterRender?.();
      const bundle: Bundle = {
          schema_version: 1,
          job_id: id,
          input_hash: job.input_hash,
          html: rendered.html,
          pdf_base64: rendered.pdf.toString("base64"),
          browser_version: rendered.browser_version,
          renderer_version: rendered.renderer_version,
        },
        bytes = Buffer.from(JSON.stringify(bundle));
      const key = await documentStore().store(ctx, bytes, digest(bytes));
      stored = { key, bytes };
    }
    // Recovery uses the original bundle first and never regenerates or inserts a signature.
    const b = JSON.parse(stored.bytes.toString("utf8")) as Bundle,
      pdf = Buffer.from(b.pdf_base64, "base64");
    if (
      b.job_id !== id ||
      b.input_hash !== job.input_hash ||
      b.html !==
        (await supportedFinanceHtml(s.source, s.output, s.template.version)) ||
      !pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )
      blocked(
        "ExactDocumentUnavailable",
        "Stored Finance output does not match its original operation.",
      );
    const manifest: FinanceManifest = {
      schema_version: 1,
      job_id: id,
      issue_id: s.output.issue_id,
      revision_id: job.revision_id,
      review_id: job.review_id,
      reconciliation_id: job.reconciliation_id,
      source_hash: s.source.source_hash,
      template: s.template,
      store_key: stored.key,
      bundle_bytes: stored.bytes.length,
      html_hash: digest(b.html),
      html_bytes: Buffer.byteLength(b.html),
      pdf_hash: digest(pdf),
      pdf_bytes: pdf.length,
      filename: `${s.source.reference}-finance-evidence-r${String(s.source.revision).padStart(2, "0")}.pdf`,
      prepared_at: s.output.prepared_at,
      browser_version: b.browser_version,
      renderer_version: b.renderer_version,
      audience: "CurrentScopedFinance",
    };
    await hooks.afterStore?.();
    await transaction(async (c) => {
      await financeContext(c, p, job.handoff_id, "finance.issue");
      const updated = await c.query(
        "UPDATE ppo.finance_render_jobs SET state='Durable',output_manifest=$3 WHERE id=$1 AND lease_token=$2",
        [id, token, manifest],
      );
      if (!updated.rowCount)
        blocked("WorkerLeaseChanged", "Another worker owns this operation.");
    });
    await hooks.beforeFinalise?.();
    return await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
        p.workspace_id,
      ]);
      const j = (
        await c.query(
          "SELECT * FROM ppo.finance_render_jobs WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (j.lease_token !== token)
        blocked(
          "WorkerLeaseChanged",
          "Another worker owns the original issue.",
        );
      const current = await financeContext(
          c,
          p,
          job.handoff_id,
          "finance.issue",
        ),
        r = await currentRevision(c, p, current);
      if (
        current.h.status !== "Reconciled" ||
        r.id !== job.revision_id ||
        r.source_hash !== s.source.source_hash ||
        hash(await template(c, p)) !== hash(s.template)
      )
        blocked(
          "StaleSource",
          "Source, review, reconciliation or template changed after rendering; original bytes remain retained.",
        );
      await readFinanceBundle(p, manifest);
      await insert(c, "finance_issues", {
        id: s.output.issue_id,
        workspace_id: p.workspace_id,
        handoff_id: job.handoff_id,
        revision_id: job.revision_id,
        review_id: job.review_id,
        render_job_id: id,
        issued_by: p.actor_id,
        manifest,
        output_hash: manifest.pdf_hash,
        audience: "CurrentScopedFinance",
      });
      const cmd = {
          operation_id: job.finalisation_operation_id,
          reason:
            "Exact original Finance output and current source verified before release.",
        },
        result = await bump(
          c,
          p,
          current.h,
          cmd,
          "EvidenceIssued",
          {},
          { job_id: id, issue_id: s.output.issue_id },
        );
      await recordOperation(
        c,
        p,
        cmd,
        result,
        "FinancialHandoff",
        "FinanceEvidenceIssued",
        hash({
          job_id: id,
          input_hash: job.input_hash,
          output_hash: manifest.pdf_hash,
        }),
        {
          command: "FinaliseFinanceEvidence",
          job_id: id,
          issue_id: s.output.issue_id,
        },
      );
      await c.query(
        "UPDATE ppo.finance_render_jobs SET state='Issued',lease_until=null WHERE id=$1 AND lease_token=$2",
        [id, token],
      );
      await c.query(
        "UPDATE ppo.outbox_jobs SET status='Done',attempts=$4,error_code=null WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND kind='FinanceEvidenceRequested'",
        [p.workspace_id, p.actor_id, job.operation_id, job.attempts],
      );
      await insert(c, "finance_render_attempts", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        job_id: id,
        attempt: job.attempts,
        outcome: "Issued",
      });
      return { processed: true, issue_id: s.output.issue_id };
    });
  } catch (error) {
    const code =
        error instanceof AppError ? error.code : "FinanceOutputUnavailable",
      state = [
        "StaleSource",
        "SourceChanged",
        "SourceDependencyChanged",
        "FinancePolicyChanged",
      ].includes(code)
        ? "StaleSource"
        : "Failed";
    await transaction(async (c) => {
      const r = await c.query(
        "UPDATE ppo.finance_render_jobs SET state=$3,error_code=$4,lease_until=null WHERE id=$1 AND lease_token=$2 AND state<>'Issued'",
        [id, token, state, code],
      );
      if (r.rowCount)
        await insert(c, "finance_render_attempts", {
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
export async function financeIssueBytes(
  p: Principal,
  id: string,
  input: unknown,
) {
  const q = object(input, ["format"]);
  if (!["html", "pdf"].includes(String(q.format)))
    throw new AppError(422, "InvalidFormat", "Choose html or pdf.");
  const issue = (
    await database().query(
      "SELECT * FROM ppo.finance_issues WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "issue_id")],
    )
  ).rows[0];
  if (!issue) throw unavailable();
  await financeContext(database(), p, issue.handoff_id, "finance.read");
  const b = await readFinanceBundle(p, issue.manifest);
  return {
    bytes: q.format === "pdf" ? b.pdf : Buffer.from(b.html),
    content_type:
      q.format === "pdf" ? "application/pdf" : "text/html; charset=utf-8",
    filename:
      q.format === "pdf"
        ? issue.manifest.filename
        : issue.manifest.filename.replace(/\.pdf$/, ".html"),
    sha256:
      q.format === "pdf" ? issue.manifest.pdf_hash : issue.manifest.html_hash,
  };
}
export async function retryFinanceJob(
  p: Principal,
  id: string,
  input: unknown,
) {
  object(input, []);
  const j = (
    await database().query(
      "SELECT * FROM ppo.finance_render_jobs WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "job_id")],
    )
  ).rows[0];
  if (!j || j.actor_id !== p.actor_id) throw unavailable();
  await financeContext(database(), p, j.handoff_id, "finance.issue");
  return processFinanceJob(id);
}
export async function runFinanceJobs() {
  const rows = (
    await database().query(
      "SELECT id FROM ppo.finance_render_jobs WHERE state IN ('Queued','Running','Durable','Failed') AND attempts<5 AND (lease_until IS NULL OR lease_until<clock_timestamp()) ORDER BY requested_at LIMIT 5",
    )
  ).rows;
  for (const r of rows) await processFinanceJob(r.id);
  return rows.length;
}
