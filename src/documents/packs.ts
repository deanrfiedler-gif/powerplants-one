import { randomUUID } from "node:crypto";
import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { sharedOperation, canonical } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { sameVersion } from "../scheduling/validation";
import { envelope } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  instant,
  choice,
  narrative,
} from "../shared/validation";
import { prepareCommand, decisionCommand, type PackInput } from "./validation";
import {
  snapshot,
  packContext,
  issueContext,
  authority,
  availableSources,
  fail,
} from "./context";
import { digest } from "./store";
export async function insert(
  c: QueryClient,
  table: string,
  fields: Record<string, unknown>,
) {
  const e = Object.entries(fields);
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${e.map((x) => x[0]).join(",")}) VALUES(${e.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      e.map((x) => x[1]),
    )
  ).rows[0];
}
export async function bumpPack(
  c: QueryClient,
  p: Principal,
  id: string,
  fields: Record<string, unknown>,
) {
  const e = Object.entries(fields);
  return (
    await c.query(
      `UPDATE ppo.packs SET version=version+1,updated_by=$3,updated_at=clock_timestamp()${e.map((x, i) => `,${x[0]}=$${i + 4}`).join("")} WHERE workspace_id=$1 AND id=$2 RETURNING *,status AS state`,
      [p.workspace_id, id, p.actor_id, ...e.map((x) => x[1])],
    )
  ).rows[0];
}
export async function issueEvent(
  c: QueryClient,
  p: Principal,
  issue_id: string,
  kind: string,
  reason: string,
) {
  await insert(c, "pack_issue_events", {
    id: randomUUID(),
    workspace_id: p.workspace_id,
    issue_id,
    kind,
    reason,
    actor_id: p.actor_id,
  });
}
async function hold(c: QueryClient, p: Principal, appointment: string) {
  await c.query(
    "UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),dispatch_hold=true,pack_requirement='ReviewRequired' WHERE workspace_id=$1 AND id=$2 AND status<>'Cancelled'",
    [p.workspace_id, appointment, p.actor_id],
  );
}
async function addRevision(
  c: QueryClient,
  p: Principal,
  pack: Record<string, unknown>,
  input: PackInput,
  reason: string,
) {
  const prior = pack.current_revision_id
    ? (
        await c.query(
          "SELECT revision FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, pack.current_revision_id],
        )
      ).rows[0]
    : null;
  const rev = (prior?.revision ?? 0) + 1;
  const s = await snapshot(
    c,
    p,
    String(pack.appointment_id),
    String(pack.display_number),
    rev,
    input,
  );
  return insert(c, "pack_revisions", {
    id: randomUUID(),
    workspace_id: p.workspace_id,
    pack_id: pack.id,
    revision: rev,
    predecessor_id: pack.current_revision_id ?? null,
    input,
    snapshot: s,
    content_hash: digest(canonical(s)),
    change_reason: reason,
    created_by: p.actor_id,
  });
}
export async function createPack(p: Principal, input: unknown) {
  const cmd = prepareCommand(undefined, input);
  return sharedOperation(
    p,
    cmd,
    "CreatePack",
    (c) => visibleAppointment(c, p, cmd.appointment_id!, "pack.prepare"),
    async (c, { a }) => {
      sameVersion(a.version, cmd.expected_appointment_version!, "appointment");
      const pack = await insert(c, "packs", {
        id: cmd.id,
        workspace_id: p.workspace_id,
        company_id: a.company_id,
        site_id: a.site_id,
        appointment_id: a.id,
        created_by: p.actor_id,
        updated_by: p.actor_id,
      });
      const r = await addRevision(c, p, pack, cmd.content, cmd.reason);
      return bumpPack(c, p, pack.id, { current_revision_id: r.id });
    },
    "Pack",
    "PackPrepared",
  );
}
export async function revisePack(p: Principal, id: string, input: unknown) {
  const cmd = prepareCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "RevisePack",
    (c) => packContext(c, p, cmd.id, "pack.prepare"),
    async (c, { pack, a }) => {
      sameVersion(pack.version, cmd.expected_version!, "pack");
      if (a.status === "Cancelled")
        fail("A cancelled appointment cannot receive a successor pack.");
      if (pack.current_issue_id)
        await issueEvent(
          c,
          p,
          pack.current_issue_id,
          "ReviewRequired",
          cmd.reason,
        );
      await hold(c, p, a.id);
      const r = await addRevision(c, p, pack, cmd.content, cmd.reason);
      return bumpPack(c, p, id, {
        current_revision_id: r.id,
        status: "Draft",
        needs_review: true,
      });
    },
    "Pack",
    "PackAmendmentRaised",
  );
}
export async function checkPack(p: Principal, id: string, input: unknown) {
  const cmd = decisionCommand(id, input, true);
  return sharedOperation(
    p,
    cmd,
    "CheckPack",
    (c) => packContext(c, p, cmd.id, "pack.check"),
    async (c, { pack, a }) => {
      sameVersion(pack.version, cmd.expected_version, "pack");
      if (!["Draft", "Returned"].includes(pack.status))
        fail("Prepare a new revision before checking again.");
      const r = (
        await c.query(
          "SELECT * FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, pack.current_revision_id],
        )
      ).rows[0];
      if (cmd.decision === "Checked") {
        const current = await snapshot(
          c,
          p,
          a.id,
          pack.display_number,
          r.revision,
          r.input,
        );
        if (digest(canonical(current)) !== r.content_hash)
          fail(
            "Source, crew or appointment changed. Save a new preparation revision before checking.",
            "StaleSource",
          );
      }
      await insert(c, "pack_checks", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        pack_id: id,
        revision_id: r.id,
        decision: cmd.decision,
        reason: cmd.reason,
        actor_id: p.actor_id,
        content_hash: r.content_hash,
      });
      return bumpPack(c, p, id, { status: cmd.decision });
    },
    "Pack",
    cmd.decision === "Checked" ? "PackChecked" : "PackReturned",
  );
}
export async function requestIssue(p: Principal, id: string, input: unknown) {
  const cmd = decisionCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "RequestPackIssue",
    (c) => packContext(c, p, cmd.id, "pack.issue"),
    async (c, { pack, a, w }) => {
      sameVersion(pack.version, cmd.expected_version, "pack");
      if (pack.status !== "Checked")
        fail("Check the exact preparation revision before requesting issue.");
      const r = (
        await c.query(
          "SELECT * FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, pack.current_revision_id],
        )
      ).rows[0];
      const check = (
        await c.query(
          "SELECT * FROM ppo.pack_checks WHERE workspace_id=$1 AND revision_id=$2 ORDER BY checked_at DESC,id DESC LIMIT 1",
          [p.workspace_id, r.id],
        )
      ).rows[0];
      if (check?.decision !== "Checked")
        fail("A current check decision is required.");
      const current = await snapshot(
        c,
        p,
        a.id,
        pack.display_number,
        r.revision,
        r.input,
      );
      if (digest(canonical(current)) !== r.content_hash)
        fail(
          "The checked source changed. Prepare and check a new revision.",
          "StaleSource",
        );
      const job = await insert(c, "pack_render_jobs", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        pack_id: id,
        revision_id: r.id,
        check_id: check.id,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        finalisation_operation_id: randomUUID(),
        input_hash: r.content_hash,
        render_snapshot: {
          source: current,
          issue_id: randomUUID(),
          prepared_at: new Date().toISOString(),
        },
        recovery_owner_id: w.service_owner_id,
      });
      return {
        id: pack.id,
        version: pack.version,
        state: "Queued",
        updated_at: job.requested_at,
        audit_details: {
          render_job_id: job.id,
          revision_id: r.id,
          input_hash: r.content_hash,
        },
      };
    },
    "Pack",
    "PackIssueRequested",
  );
}
export async function withdrawPack(p: Principal, id: string, input: unknown) {
  const cmd = decisionCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "WithdrawPack",
    (c) => packContext(c, p, id, "pack.issue"),
    async (c, { pack, a }) => {
      sameVersion(pack.version, cmd.expected_version, "pack");
      if (!pack.current_issue_id || pack.status === "Withdrawn")
        fail("An existing issue is required for withdrawal.");
      await issueEvent(c, p, pack.current_issue_id, "Withdrawn", cmd.reason);
      await hold(c, p, a.id);
      return bumpPack(c, p, id, { status: "Withdrawn", needs_review: true });
    },
    "Pack",
    "PackWithdrawn",
  );
}
export async function dispatchReadiness(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const { a } = await visibleAppointment(c, p, id);
  const reasons: string[] = [];
  try {
    await authority(c, p, id);
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    reasons.push(e.message);
  }
  const pack = (
    await c.query(
      "SELECT * FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (a.customer_commitment !== "Confirmed")
    reasons.push(
      "Record current customer date agreement; this does not acknowledge the pack.",
    );
  if (!pack?.current_issue_id || pack.needs_review || pack.status !== "Issued")
    reasons.push("A current applicable issued pack is required.");
  let recipients: {
    id: string;
    user_id: string;
    assignment_id: string;
    assignment_version: number;
    display_name: string;
    acknowledged_at: Date | null;
    presented_hash: string | null;
    active: boolean;
  }[] = [];
  if (pack?.current_issue_id) {
    const issue = (
      await c.query(
        "SELECT * FROM ppo.pack_issues WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, pack.current_issue_id],
      )
    ).rows[0];
    if (
      issue.schedule_version !== a.schedule_version ||
      issue.assignment_version !== a.assignment_version
    )
      reasons.push("The issued crew or schedule is no longer current.");
    recipients = (
      await c.query(
        "SELECT pr.id,pr.user_id,pr.assignment_id,pr.assignment_version,u.display_name,ak.acknowledged_at,ak.presented_hash,x.active FROM ppo.pack_recipients pr JOIN ppo.users u ON u.id=pr.user_id JOIN ppo.assignments x ON x.id=pr.assignment_id LEFT JOIN ppo.pack_acknowledgements ak ON ak.recipient_id=pr.id WHERE pr.workspace_id=$1 AND pr.issue_id=$2 ORDER BY pr.user_id",
        [p.workspace_id, issue.id],
      )
    ).rows;
    const active = (
      await c.query(
        "SELECT id FROM ppo.assignments WHERE workspace_id=$1 AND appointment_id=$2 AND active",
        [p.workspace_id, id],
      )
    ).rows;
    if (
      !active.length ||
      active.length !== recipients.length ||
      active.some(
        (x) => !recipients.some((y) => y.assignment_id === x.id && y.active),
      )
    )
      reasons.push(
        "The complete current crew must be recipients of this issue.",
      );
    for (const r of recipients)
      if (!r.acknowledged_at || r.presented_hash !== issue.output_hash)
        reasons.push(
          `${r.display_name}: explicit acknowledgement of this issue is required.`,
        );
  }
  return {
    dispatch_hold: reasons.length > 0,
    component_ready: reasons.length === 0,
    actual_start_implemented: false,
    reasons,
    recipients,
  };
}
export async function acknowledgePack(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "assignment_id",
    "assignment_version",
    "presented_hash",
    "captured_at",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "issue_id"),
    assignment_id: uuid(r.assignment_id, "assignment_id"),
    assignment_version: version(r.assignment_version),
    presented_hash: narrative(r.presented_hash, "presented_hash", 64),
    captured_at: instant(r.captured_at, "captured_at"),
  };
  return sharedOperation(
    p,
    cmd,
    "AcknowledgePack",
    (c) => issueContext(c, p, id, "pack.acknowledge"),
    async (c, { pack, a, issue }) => {
      if (
        pack.needs_review ||
        pack.current_issue_id !== id ||
        pack.status !== "Issued" ||
        a.status !== "Confirmed" ||
        issue.assignment_version !== a.assignment_version ||
        issue.schedule_version !== a.schedule_version
      )
        fail(
          "This issue no longer applies. Open and acknowledge the current issue.",
          "IssueNotApplicable",
        );
      if (cmd.presented_hash !== issue.output_hash)
        fail("The presented output hash does not match this exact issue.");
      const recipient = (
        await c.query(
          "SELECT pr.* FROM ppo.pack_recipients pr JOIN ppo.assignments x ON x.id=pr.assignment_id WHERE pr.workspace_id=$1 AND pr.issue_id=$2 AND pr.assignment_id=$3 AND pr.user_id=$4 AND pr.assignment_version=$5 AND x.active AND x.assignment_version=$5",
          [
            p.workspace_id,
            id,
            cmd.assignment_id,
            p.actor_id,
            cmd.assignment_version,
          ],
        )
      ).rows[0];
      if (!recipient) throw unavailable();
      await insert(c, "pack_acknowledgements", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        recipient_id: recipient.id,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        presented_hash: cmd.presented_hash,
        captured_at: cmd.captured_at,
      });
      const ready = await dispatchReadiness(c, p, a.id);
      await c.query(
        "UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),dispatch_hold=$4,pack_requirement=$5 WHERE workspace_id=$1 AND id=$2",
        [
          p.workspace_id,
          a.id,
          p.actor_id,
          ready.dispatch_hold,
          ready.component_ready ? "Acknowledged" : "AwaitingAcknowledgement",
        ],
      );
      return {
        id: pack.id,
        version: pack.version,
        state: "Acknowledged",
        updated_at: new Date(),
        audit_details: {
          issue_id: id,
          recipient_id: recipient.id,
          assignment_id: cmd.assignment_id,
          presented_hash: cmd.presented_hash,
          dispatch_hold: ready.dispatch_hold,
        },
      };
    },
    "Pack",
    "PackAcknowledged",
  );
}
export async function recordDistribution(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [...commonKeys, "recipient_id", "kind", "evidence"]);
  const cmd = {
    ...common(r),
    id: uuid(id, "issue_id"),
    recipient_id: uuid(r.recipient_id, "recipient_id"),
    kind: choice(r.kind, "kind", ["SimulatedSent"]),
    evidence: narrative(r.evidence, "evidence", 2000),
  };
  return sharedOperation(
    p,
    cmd,
    "RecordPackDistribution",
    (c) => issueContext(c, p, id, "pack.issue"),
    async (c, { pack }) => {
      if (
        !(
          await c.query(
            "SELECT 1 FROM ppo.pack_recipients WHERE workspace_id=$1 AND issue_id=$2 AND id=$3",
            [p.workspace_id, id, cmd.recipient_id],
          )
        ).rowCount
      )
        throw unavailable();
      const event = await insert(c, "pack_distribution_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        recipient_id: cmd.recipient_id,
        actor_id: p.actor_id,
        kind: cmd.kind,
        evidence: cmd.evidence,
      });
      return {
        id: pack.id,
        version: pack.version,
        state: "SimulatedSent",
        updated_at: event.occurred_at,
      };
    },
    "Pack",
    "PackDistributionRecorded",
  );
}
export async function readPack(p: Principal, id: string) {
  return transaction(async (c) => {
    const { pack, a } = await packContext(c, p, uuid(id, "pack_id"));
    const revisions = (
      await c.query(
        "SELECT * FROM ppo.pack_revisions WHERE workspace_id=$1 AND pack_id=$2 ORDER BY revision DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const checks = (
      await c.query(
        "SELECT * FROM ppo.pack_checks WHERE workspace_id=$1 AND pack_id=$2 ORDER BY checked_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const issues = (
      await c.query(
        "SELECT i.*,r.revision FROM ppo.pack_issues i JOIN ppo.pack_revisions r ON r.id=i.revision_id WHERE i.workspace_id=$1 AND i.pack_id=$2 ORDER BY i.issued_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const events = (
      await c.query(
        "SELECT e.* FROM ppo.pack_issue_events e JOIN ppo.pack_issues i ON i.id=e.issue_id WHERE e.workspace_id=$1 AND i.pack_id=$2 ORDER BY e.occurred_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const jobs = (
      await c.query(
        "SELECT id,revision_id,state,attempts,error_code,requested_at,recovery_owner_id,issue_id FROM ppo.pack_render_jobs WHERE workspace_id=$1 AND pack_id=$2 ORDER BY requested_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const can_prepare = await hasPermission(
        c,
        p,
        "pack.prepare",
        a.company_id,
        a.site_id,
      ),
      can_issue = await hasPermission(
        c,
        p,
        "pack.issue",
        a.company_id,
        a.site_id,
      ),
      can_check = await hasPermission(
        c,
        p,
        "pack.check",
        a.company_id,
        a.site_id,
      );
    const staff = can_prepare || can_issue || can_check;
    const currentIssues = staff
      ? issues
      : issues.filter(
          (i) =>
            i.id === pack.current_issue_id &&
            i.assignment_version === a.assignment_version,
        );
    const permittedRevisions = staff
      ? revisions
      : revisions.filter((r) =>
          currentIssues.some((i) => i.revision_id === r.id),
        );
    return envelope([
      {
        ...pack,
        current_issue_id:
          staff || currentIssues.length ? pack.current_issue_id : null,
        current_revision_id:
          staff || permittedRevisions.length ? pack.current_revision_id : null,
        revisions: permittedRevisions,
        checks: staff ? checks : [],
        issues: currentIssues,
        events: events
          .filter((e) => currentIssues.some((i) => i.id === e.issue_id))
          .map((e) =>
            staff
              ? e
              : {
                  id: e.id,
                  issue_id: e.issue_id,
                  kind: e.kind,
                  occurred_at: e.occurred_at,
                  reason: "Refer to current pack applicability.",
                },
          ),
        history: staff
          ? (
              await c.query(
                "SELECT id,kind,summary FROM ppo.history_records WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND access_class IN ('RestrictedService','CustomerApproved') ORDER BY occurred_at DESC",
                [p.workspace_id, a.company_id, a.site_id],
              )
            ).rows
          : [],
        distribution: (
          await c.query(
            "SELECT e.id,e.recipient_id,e.kind,e.occurred_at,u.display_name FROM ppo.pack_distribution_events e JOIN ppo.pack_recipients pr ON pr.id=e.recipient_id JOIN ppo.users u ON u.id=pr.user_id WHERE e.workspace_id=$1 AND pr.issue_id=$2 ORDER BY e.occurred_at DESC",
            [
              p.workspace_id,
              currentIssues.find((i) => i.id === pack.current_issue_id)?.id ??
                null,
            ],
          )
        ).rows,
        jobs: staff ? jobs : [],
        sources: staff
          ? await availableSources(c, p, a.company_id, a.site_id)
          : [],
        readiness: await dispatchReadiness(c, p, a.id),
        actions: {
          can_prepare,
          can_check,
          can_issue,
          can_acknowledge: await hasPermission(
            c,
            p,
            "pack.acknowledge",
            a.company_id,
            a.site_id,
          ),
        },
      },
    ]);
  });
}
export async function listPacks(p: Principal) {
  const c = database();
  const rows = (
    await c.query(
      "SELECT id FROM ppo.packs WHERE workspace_id=$1 ORDER BY updated_at DESC",
      [p.workspace_id],
    )
  ).rows;
  const result = [];
  for (const r of rows) {
    try {
      const { pack, a } = await packContext(c, p, r.id);
      result.push({ ...pack, appointment_reference: a.display_number });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  }
  return envelope(result);
}
export async function preparationOptions(p: Principal, id: string) {
  return transaction(async (c) => {
    const { a, w } = await visibleAppointment(
      c,
      p,
      uuid(id, "appointment_id"),
      "pack.prepare",
    );
    return {
      appointment: a,
      work_order_reference: w.display_number,
      sources: await availableSources(c, p, a.company_id, a.site_id),
      history: (
        await c.query(
          "SELECT id,kind,summary FROM ppo.history_records WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND access_class IN ('RestrictedService','CustomerApproved') ORDER BY occurred_at DESC",
          [p.workspace_id, a.company_id, a.site_id],
        )
      ).rows,
    };
  });
}
