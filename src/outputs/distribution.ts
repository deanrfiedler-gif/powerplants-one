import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { hasPermission, type QueryClient } from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  narrative,
  choice,
} from "../shared/validation";
import { sameVersion } from "../scheduling/validation";
import {
  issueContext,
  packAppointmentApplicable,
  packContext,
} from "../documents/context";
import { reportContext, recipient } from "../reports/context";
import { readBundle } from "../documents/worker";
import { readReportBundle } from "../reports/worker";
import { insert } from "../documents/packs";
import type { OutputKind } from "./model";

const conflict = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
export async function outputIssuer(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
) {
  if (kind === "JobPack") {
    const ctx = await packContext(c, p, id, "pack.issue");
    return { record: ctx.pack, a: ctx.a, w: ctx.w };
  }
  const ctx = await reportContext(c, p, id, "report.issue");
  return { record: ctx.report, a: ctx.a, w: ctx.w };
}
async function exact(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
  issueId: string,
  recipientId: string,
) {
  const ctx = await outputIssuer(c, p, kind, id);
  if (kind === "JobPack") {
    const { issue } = await issueContext(c, p, issueId, "pack.issue");
    if (issue.pack_id !== id) throw unavailable();
    const target = (
      await c.query(
        "SELECT * FROM ppo.pack_recipients WHERE workspace_id=$1 AND issue_id=$2 AND id=$3",
        [p.workspace_id, issueId, recipientId],
      )
    ).rows[0];
    if (!target) throw unavailable();
    return { ...ctx, issue, target };
  }
  const issue = (
    await c.query(
      "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2 AND id=$3 AND recipient_id=$4",
      [p.workspace_id, id, issueId, recipientId],
    )
  ).rows[0];
  if (!issue) throw unavailable();
  return { ...ctx, issue, target: { id: recipientId } };
}
async function audience(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  ctx: Awaited<ReturnType<typeof exact>>,
) {
  const { record, issue, a, target } = ctx;
  if (
    record.current_issue_id !== issue.id ||
    record.current_revision_id !== issue.revision_id ||
    record.status !== "Issued"
  )
    conflict(
      "IssueNotCurrent",
      "Prepare distribution only for the current issued revision.",
    );
  if (kind === "JobPack") {
    if (
      record.needs_review ||
      issue.assignment_version !== a.assignment_version ||
      issue.schedule_version !== a.schedule_version ||
      !packAppointmentApplicable(a.status)
    )
      conflict(
        "IssueNotApplicable",
        "The pack requires a current applicable issue and crew.",
      );
    const assigned = (
      await c.query(
        "SELECT 1 FROM ppo.assignments x JOIN ppo.resources r ON (r.workspace_id,r.id)=(x.workspace_id,x.resource_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id) WHERE x.workspace_id=$1 AND x.id=$2 AND x.active AND r.active AND u.active AND x.assignment_version=$3 AND r.user_id=$4",
        [
          p.workspace_id,
          target.assignment_id,
          a.assignment_version,
          target.user_id,
        ],
      )
    ).rowCount;
    if (!assigned) throw unavailable();
    const receiver = { ...p, actor_id: target.user_id };
    await issueContext(c, receiver, issue.id);
    for (const cap of [
      "pack.read",
      "pack.acknowledge",
      "schedule.read",
      "service.work_order.read",
      "service.ticket.read",
      "shared.read",
    ] as const)
      if (!(await hasPermission(c, receiver, cap, a.company_id, a.site_id)))
        throw unavailable();
  } else {
    await recipient(c, p, { report: record, a, w: ctx.w }, issue.recipient_id);
  }
}
async function distributable(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  ctx: Awaited<ReturnType<typeof exact>>,
) {
  await audience(c, p, kind, ctx);
  const { record, issue, target } = ctx;
  try {
    if (kind === "JobPack") await readBundle(p, issue.manifest);
    else await readReportBundle(p, issue.manifest);
  } catch {
    conflict(
      "ExactOutputUnavailable",
      "Restore the retained exact output before distribution. No replacement was generated.",
    );
  }
  // Storage is outside PostgreSQL; retain current source permission at the disclosure/effect boundary.
  await audience(
    c,
    p,
    kind,
    await exact(c, p, kind, record.id, issue.id, target.id),
  );
}
const objectType = (kind: OutputKind) =>
  kind === "JobPack" ? "Pack" : "ServiceReport";
export async function prepareDistribution(
  p: Principal,
  kind: OutputKind,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "attempt_id",
    "issue_id",
    "recipient_id",
    "expected_version",
  ]);
  const cmd = {
    ...common(r),
    kind,
    output_id: uuid(id, "output_id"),
    attempt_id: uuid(r.attempt_id, "attempt_id"),
    issue_id: uuid(r.issue_id, "issue_id"),
    recipient_id: uuid(r.recipient_id, "recipient_id"),
    expected_version: version(r.expected_version),
  };
  return sharedOperation(
    p,
    cmd,
    "PrepareOutputDistribution",
    (c) => exact(c, p, kind, cmd.output_id, cmd.issue_id, cmd.recipient_id),
    async (c, ctx) => {
      sameVersion(ctx.record.version, cmd.expected_version, "output");
      await distributable(c, p, kind, ctx);
      const existing = (
        await c.query(
          "SELECT a.id FROM ppo.output_distribution_attempts a JOIN LATERAL (SELECT state FROM ppo.output_distribution_events WHERE workspace_id=a.workspace_id AND attempt_id=a.id ORDER BY version DESC LIMIT 1) e ON true WHERE a.workspace_id=$1 AND a.kind=$2 AND a.issue_id=$3 AND a.recipient_id=$4 AND e.state<>'SimulatedNotSent'",
          [p.workspace_id, kind, cmd.issue_id, cmd.recipient_id],
        )
      ).rows[0];
      if (
        kind === "JobPack" &&
        (
          await c.query(
            "SELECT 1 FROM ppo.pack_distribution_events WHERE workspace_id=$1 AND recipient_id=$2 AND kind='SimulatedSent'",
            [p.workspace_id, cmd.recipient_id],
          )
        ).rowCount
      )
        conflict(
          "DistributionRecoveryRequired",
          "A native simulated send already exists for this exact recipient and issue.",
        );
      if (existing)
        conflict(
          "DistributionRecoveryRequired",
          "Recover the original recipient attempt before preparing another.",
        );
      await insert(c, "output_distribution_attempts", {
        id: cmd.attempt_id,
        workspace_id: p.workspace_id,
        kind,
        output_id: id,
        issue_id: cmd.issue_id,
        recipient_id: cmd.recipient_id,
        output_hash: ctx.issue.output_hash,
        actor_id: p.actor_id,
        recovery_owner_id: ctx.w.service_owner_id,
        operation_id: cmd.operation_id,
      });
      const event = await insert(c, "output_distribution_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        attempt_id: cmd.attempt_id,
        version: 1,
        state: "Prepared",
        action: "Prepare",
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
        evidence:
          "Exact retained output checked; prepared locally for synthetic distribution only.",
      });
      return {
        id,
        version: ctx.record.version,
        state: "Prepared",
        updated_at: event.occurred_at,
        audit_details: {
          attempt_id: cmd.attempt_id,
          issue_id: cmd.issue_id,
          recipient_id: cmd.recipient_id,
          output_hash: ctx.issue.output_hash,
          channel: "Synthetic",
        },
      };
    },
    objectType(kind),
    "OutputDistributionPrepared",
  );
}
export async function recordDistributionOutcome(
  p: Principal,
  kind: OutputKind,
  id: string,
  input: unknown,
  reconcile = false,
) {
  const r = object(input, [
    ...commonKeys,
    "attempt_id",
    "expected_attempt_version",
    "outcome",
    "evidence",
  ]);
  const cmd = {
    ...common(r),
    kind,
    output_id: uuid(id, "output_id"),
    attempt_id: uuid(r.attempt_id, "attempt_id"),
    expected_attempt_version: version(r.expected_attempt_version),
    outcome: choice(
      r.outcome,
      "outcome",
      reconcile
        ? (["SimulatedSent", "SimulatedNotSent"] as const)
        : (["SimulatedSent", "SimulatedNotSent", "OutcomeUnknown"] as const),
    ),
    evidence: narrative(r.evidence, "evidence", 2000),
  };
  return sharedOperation(
    p,
    cmd,
    reconcile ? "ReconcileOutputDistribution" : "RecordOutputDistribution",
    async (c) => {
      const a = (
        await c.query(
          "SELECT * FROM ppo.output_distribution_attempts WHERE workspace_id=$1 AND kind=$2 AND output_id=$3 AND id=$4",
          [p.workspace_id, kind, id, cmd.attempt_id],
        )
      ).rows[0];
      if (!a) throw unavailable();
      const ctx = await exact(c, p, kind, id, a.issue_id, a.recipient_id);
      return { ...ctx, attempt: a };
    },
    async (c, ctx) => {
      const previous = (
        await c.query(
          "SELECT version,state FROM ppo.output_distribution_events WHERE workspace_id=$1 AND attempt_id=$2 ORDER BY version DESC LIMIT 1",
          [p.workspace_id, cmd.attempt_id],
        )
      ).rows[0];
      sameVersion(
        previous.version,
        cmd.expected_attempt_version,
        "distribution attempt",
      );
      if (previous.state !== (reconcile ? "OutcomeUnknown" : "Prepared"))
        conflict(
          "DistributionTransitionRefused",
          "Use reconciliation for an unknown outcome; terminal attempts cannot be changed.",
        );
      if (!reconcile && cmd.outcome === "SimulatedSent")
        await distributable(c, p, kind, ctx);
      const event = await insert(c, "output_distribution_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        attempt_id: cmd.attempt_id,
        version: previous.version + 1,
        state: cmd.outcome,
        action: reconcile ? "Reconcile" : "Record",
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
        evidence: cmd.evidence,
      });
      return {
        id,
        version: ctx.record.version,
        state: cmd.outcome,
        updated_at: event.occurred_at,
        audit_details: {
          attempt_id: cmd.attempt_id,
          attempt_version: event.version,
          issue_id: ctx.attempt.issue_id,
          recipient_id: ctx.attempt.recipient_id,
          output_hash: ctx.attempt.output_hash,
          channel: "Synthetic",
        },
      };
    },
    objectType(kind),
    reconcile ? "OutputDistributionReconciled" : "OutputDistributionRecorded",
  );
}
export async function distributionHistory(
  c: QueryClient,
  p: Principal,
  kind: OutputKind,
  id: string,
) {
  await outputIssuer(c, p, kind, id);
  const attempts = (
    await c.query(
      "SELECT a.id,a.issue_id,a.recipient_id,a.output_hash,a.channel,a.actor_id,a.recovery_owner_id,a.operation_id,a.created_at,u.display_name AS recovery_owner_name FROM ppo.output_distribution_attempts a LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(a.workspace_id,a.recovery_owner_id) WHERE a.workspace_id=$1 AND a.kind=$2 AND a.output_id=$3 ORDER BY a.created_at,a.id",
      [p.workspace_id, kind, id],
    )
  ).rows;
  const events = (
    await c.query(
      "SELECT e.attempt_id,e.id,e.version,e.state,e.action,e.actor_id,e.operation_id,e.reason,e.evidence,e.occurred_at,u.display_name AS actor_name FROM ppo.output_distribution_events e LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id) WHERE e.workspace_id=$1 AND e.attempt_id=ANY($2::uuid[]) ORDER BY e.attempt_id,e.version",
      [p.workspace_id, attempts.map((a) => a.id)],
    )
  ).rows;
  return attempts.map((a) => {
    const history = events
      .filter((e) => e.attempt_id === a.id)
      .map(({ attempt_id: _, ...e }) => e);
    return {
      ...a,
      version: history.at(-1)!.version,
      state: history.at(-1)!.state,
      sent_at: null,
      delivered_at: null,
      events: history,
    };
  });
}
export async function readDistribution(
  p: Principal,
  kind: OutputKind,
  id: string,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    return distributionHistory(c, p, kind, uuid(id, "output_id"));
  });
}
