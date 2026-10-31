import type { Principal } from "../platform/identity";
import { transaction, database } from "../platform/database";
import { unavailable } from "../platform/errors";
import { choice, object, uuid } from "../shared/validation";
import { readOperation } from "../shared/receipts";
import { requestIssue, withdrawPack } from "../documents/packs";
import { retryRenderJob, readRenderJob, readBundle } from "../documents/worker";
import {
  requestReportIssue,
  retryReportJob,
  readReportJob,
  readReportBundle,
} from "../reports/worker";
import { outputKinds, type OutputKind } from "./model";
import {
  outputIssuer,
  distributionHistory,
  prepareDistribution,
  recordDistributionOutcome,
} from "./distribution";

export const outputActions = [
  "RequestIssue",
  "RecoverIssue",
  "WithdrawPack",
  "PrepareDistribution",
  "RecordDistribution",
  "ReconcileDistribution",
] as const;
export function actionEnvelope(input: unknown) {
  const r = object(input, ["kind", "action", "command"]);
  return {
    kind: choice(r.kind, "kind", outputKinds),
    action: choice(r.action, "action", outputActions),
    command: r.command,
  };
}
const sources = {
  JobPack: { table: "pack_render_jobs", parent: "pack_id" },
  ServiceReport: { table: "report_render_jobs", parent: "report_id" },
} as const;
const publicJob = (
  job:
    | Awaited<ReturnType<typeof readRenderJob>>
    | Awaited<ReturnType<typeof readReportJob>>,
) => ({
  id: job.id,
  state: job.state,
  attempts: job.attempts,
  error_code: job.error_code,
  issue_id: job.issue_id,
  output_recorded: Boolean(job.output_manifest),
  attempt_history: job.attempt_history,
});
export async function runOutputAction(
  p: Principal,
  id: string,
  input: unknown,
) {
  id = uuid(id, "output_id");
  const { kind, action, command } = actionEnvelope(input);
  // Native validators and command hashes remain unchanged across the two API entry points.
  switch (action) {
    case "RequestIssue":
      return {
        type: "receipt" as const,
        ...(await (kind === "JobPack"
          ? requestIssue(p, id, command)
          : requestReportIssue(p, id, command))),
      };
    case "WithdrawPack":
      if (kind !== "JobPack") throw unavailable();
      return {
        type: "receipt" as const,
        ...(await withdrawPack(p, id, command)),
      };
    case "PrepareDistribution":
      return {
        type: "receipt" as const,
        ...(await prepareDistribution(p, kind, id, command)),
      };
    case "RecordDistribution":
      return {
        type: "receipt" as const,
        ...(await recordDistributionOutcome(p, kind, id, command)),
      };
    case "ReconcileDistribution":
      return {
        type: "receipt" as const,
        ...(await recordDistributionOutcome(p, kind, id, command, true)),
      };
    case "RecoverIssue": {
      const r = object(command, ["job_id"]),
        jobId = uuid(r.job_id, "job_id");
      await outputIssuer(database(), p, kind, id);
      const s = sources[kind];
      if (
        !(
          await database().query(
            `SELECT 1 FROM ppo.${s.table} WHERE workspace_id=$1 AND ${s.parent}=$2 AND id=$3`,
            [p.workspace_id, id, jobId],
          )
        ).rowCount
      )
        throw unavailable();
      const job =
        kind === "JobPack"
          ? await retryRenderJob(p, jobId)
          : await retryReportJob(p, jobId);
      let availability = "NotIssued";
      if (job.issue_id) {
        availability = "ExactUnavailable";
        if (job.output_manifest) {
          try {
            if (kind === "JobPack") await readBundle(p, job.output_manifest);
            else await readReportBundle(p, job.output_manifest);
            availability = "Available";
          } catch {
            /* Retain the original identity; never regenerate an issued file. */
          }
        }
      }
      await outputIssuer(database(), p, kind, id);
      return { type: "job" as const, job: { ...publicJob(job), availability } };
    }
  }
}
export async function readOutputActions(
  p: Principal,
  id: string,
  input: unknown,
) {
  const q = object(input, ["kind"]),
    kind = choice(q.kind, "kind", outputKinds);
  id = uuid(id, "output_id");
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const { record } = await outputIssuer(c, p, kind, id),
      s = sources[kind];
    const jobs = (
      await c.query(
        `SELECT j.id,j.revision_id,j.operation_id,j.state,j.attempts,j.error_code,j.issue_id,j.recovery_owner_id,j.requested_at,
          u.display_name AS recovery_owner_name,
          j.state IN ('Queued','Running','Durable','Failed') AND (j.lease_until IS NULL OR j.lease_until<clock_timestamp()) AS recoverable
          FROM ppo.${s.table} j LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(j.workspace_id,j.recovery_owner_id)
          WHERE j.workspace_id=$1 AND j.${s.parent}=$2 ORDER BY j.requested_at,j.id`,
        [p.workspace_id, id],
      )
    ).rows;
    // These are the native command's exact inputs, not a new generic review decision.
    const reportBasis =
      kind === "ServiceReport"
        ? ((
            await c.query(
              `SELECT r.revision_id,r.id AS review_id,t.id AS template_id,t.version AS template_version
       FROM ppo.report_reviews r JOIN ppo.report_template_policy p ON p.workspace_id=r.workspace_id
       JOIN ppo.report_templates t ON (t.workspace_id,t.id)=(p.workspace_id,p.template_id)
       WHERE r.workspace_id=$1 AND r.report_id=$2 AND r.revision_id=$3 AND r.decision='Approved'
       ORDER BY r.reviewed_at DESC,r.id DESC LIMIT 1`,
              [p.workspace_id, id, record.current_revision_id],
            )
          ).rows[0] ?? null)
        : null;
    const requestStage =
      record.status === (kind === "JobPack" ? "Checked" : "Reviewed");
    const existingJob = jobs.some(
      (j) => j.revision_id === record.current_revision_id,
    );
    const distribution = await distributionHistory(c, p, kind, id);
    await outputIssuer(c, p, kind, id);
    return {
      as_at: new Date().toISOString(),
      actor_id: p.actor_id,
      workspace_id: p.workspace_id,
      kind,
      id,
      version: record.version,
      source_state: record.status,
      current_revision_id: record.current_revision_id,
      current_issue_id: record.current_issue_id,
      command_authority: "NativeService",
      readiness: "RevalidatedOnCommand",
      request_issue: {
        available:
          requestStage && !existingJob && (kind === "JobPack" || !!reportBasis),
        reason: existingJob
          ? "Recover the original preparation job."
          : !requestStage
            ? "Prepare and review the current revision on its native page."
            : kind === "ServiceReport" && !reportBasis
              ? "The exact approved review or template is unavailable."
              : "Source, template and authority are revalidated on confirmation.",
        basis: { expected_version: record.version, ...(reportBasis ?? {}) },
      },
      withdraw_pack:
        kind === "JobPack" &&
        !!record.current_issue_id &&
        record.status !== "Withdrawn",
      actions: outputActions.filter(
        (a) => a !== "WithdrawPack" || kind === "JobPack",
      ),
      review_href:
        kind === "JobPack" ? `/service/packs/${id}` : `/service/reports/${id}`,
      distribution_support: "SyntheticOnly",
      jobs,
      distribution_attempts: distribution,
    };
  });
}
export async function recoverOutputOperation(
  p: Principal,
  id: string,
  input: unknown,
) {
  const q = object(input, ["kind", "operation_id"]),
    kind: OutputKind = choice(q.kind, "kind", outputKinds);
  id = uuid(id, "output_id");
  await outputIssuer(database(), p, kind, id);
  const receipt = await readOperation(p, uuid(q.operation_id, "operation_id"));
  if (receipt.record_id !== id) throw unavailable();
  await outputIssuer(database(), p, kind, id);
  return receipt;
}
