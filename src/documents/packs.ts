import { appointmentPreparation } from "../scheduling/site-readiness";
import { policyImpactHolds } from "../scheduling/policy-holds";
import { selectedTemplate } from "./use/policy";
import { incidentHolds } from "../incidents/holds";
import { sectionView } from "./section-view";
import { readSection } from "./section-readers";
import { readinessSummary } from "./pack-view";
import type { PackRegisterRow, PackVisit } from "./pack-register";
import { visibleActivity } from "../activities/activities";
import { randomUUID } from "node:crypto";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { sharedOperation, canonical } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import { visibleAppointment } from "../scheduling/planner";
import { sameVersion } from "../scheduling/validation";
import { scopeDetail, readiness as criteriaFor } from "../service/work-orders";
import { envelope, visible } from "../shared/reads";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  instant,
  choice,
  narrative,
  invalid,
} from "../shared/validation";
import {
  partsCriterion,
  partsReason,
  type PartsReadiness,
} from "../service/parts-readiness";
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
import type { PackSnapshot } from "./render";
import {
  basisOf,
  basisDrift,
  returnReasonCodes,
  returnReasonsText,
  revisionLabel,
  satisfied,
  type PackBasis,
  type PackCriterion,
} from "./pack-view";
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
// Upgrade proofs run current commands against schemas before 0107; the return records exist from it.
export async function returnsInstalled(c: QueryClient) {
  return !!(
    await c.query("SELECT to_regclass('ppo.pack_returns') AS relation")
  ).rows[0].relation;
}
// Who works a returned revision: its author while they can still read the pack, otherwise the work
// order's service owner (field readiness gate P3).
async function preparerOf(
  c: QueryClient,
  p: Principal,
  revision_id: string,
  a: { company_id: string; site_id: string },
  service_owner_id: string,
) {
  const author = (
    await c.query(
      "SELECT created_by FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, revision_id],
    )
  ).rows[0];
  const reads = (
    await c.query(
      `SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
      WHERE g.workspace_id=$1 AND g.user_id=$2 AND g.capability='pack.read' AND u.active
      AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
      AND (g.scope_type='Workspace' OR (g.company_id=$3 AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=$4))))`,
      [p.workspace_id, author?.created_by ?? null, a.company_id, a.site_id],
    )
  ).rowCount;
  return reads ? (author.created_by as string) : service_owner_id;
}
// An owned TechnicalFollowUp for the preparer. A return task is due by 09:00 site time on the visit
// day, or two hours before the start if earlier (synthetic Q4); a check task has no deadline until
// the issue lead time (P5) exists, so it is flagged "due date needed".
async function preparerTask(
  c: QueryClient,
  p: Principal,
  appointment_id: string,
  owner_id: string,
  summary: string,
  returnDue: boolean,
) {
  const id = randomUUID();
  const issueDue = returnDue ? null : (await appointmentPreparation(c, p.workspace_id, appointment_id))?.issue_due_at ?? null;
  await c.query(
    `INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_at,due_needed,access_class)
    SELECT $1,a.workspace_id,a.company_id,a.site_id,$3,$3,'TechnicalFollowUp',$4,$5,
    CASE WHEN $6::boolean THEN least(((a.start_at AT TIME ZONE a.site_timezone)::date+time '09:00') AT TIME ZONE a.site_timezone,a.start_at-interval '2 hours') ELSE $8::timestamptz END,
    NOT $6::boolean AND $8::timestamptz IS NULL,'RestrictedService' FROM ppo.appointments a WHERE a.workspace_id=$2 AND a.id=$7`,
    [
      id,
      p.workspace_id,
      p.actor_id,
      owner_id,
      summary.slice(0, 2000),
      returnDue,
      appointment_id,
      issueDue,
    ],
  );
  await c.query(
    "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) SELECT a.workspace_id,a.company_id,$3,'Site',a.site_id FROM ppo.appointments a WHERE a.workspace_id=$1 AND a.id=$2",
    [p.workspace_id, appointment_id, id],
  );
  return id;
}
// Return and check tasks complete when a successor revision is saved, with that revision as the
// outcome (R6). The owner can also complete them in My Work.
async function completePackTasks(
  c: QueryClient,
  p: Principal,
  pack_id: string,
  outcome: string,
) {
  if (!(await returnsInstalled(c))) return;
  await c.query(
    `UPDATE ppo.activities SET status='Completed',outcome=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp()
    WHERE workspace_id=$1 AND status IN ('Open','InProgress') AND id IN (
     SELECT f.activity_id FROM ppo.pack_return_follow_ups f JOIN ppo.pack_returns t ON t.id=f.return_id JOIN ppo.pack_recipients r ON r.id=t.recipient_id JOIN ppo.pack_issues i ON i.id=r.issue_id WHERE f.workspace_id=$1 AND i.pack_id=$2
     UNION SELECT f.activity_id FROM ppo.pack_check_follow_ups f JOIN ppo.pack_checks k ON k.id=f.check_id WHERE f.workspace_id=$1 AND k.pack_id=$2
     UNION SELECT f.activity_id FROM ppo.pack_follow_ups f JOIN ppo.pack_issue_events e ON e.id=f.issue_event_id JOIN ppo.pack_issues i ON i.id=e.issue_id WHERE f.workspace_id=$1 AND i.pack_id=$2 AND e.kind='Returned')`,
    [p.workspace_id, pack_id, outcome.slice(0, 10000), p.actor_id],
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
      await completePackTasks(
        c,
        p,
        pack.id,
        `Successor revision ${revisionLabel(r.revision)} saved: ${cmd.reason}`,
      );
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
    async (c, { pack, a, w }) => {
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
      const check = await insert(c, "pack_checks", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        pack_id: id,
        revision_id: r.id,
        decision: cmd.decision,
        reason: cmd.reason,
        actor_id: p.actor_id,
        content_hash: r.content_hash,
      });
      // A checker's return tasks the preparer (P3); Q5, checking one's own revision, stays open.
      if (cmd.decision === "Returned" && (await returnsInstalled(c))) {
        const owner = await preparerOf(c, p, r.id, a, w.service_owner_id);
        const task = await preparerTask(
          c,
          p,
          a.id,
          owner,
          `Revise job pack ${pack.display_number} · ${revisionLabel(r.revision)} returned at the check: ${cmd.reason}`,
          false,
        );
        await insert(c, "pack_check_follow_ups", {
          workspace_id: p.workspace_id,
          check_id: check.id,
          activity_id: task,
        });
      }
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
  allowStarted = false,
  inspectionCapture = false,
) {
  const { a } = await visibleAppointment(c, p, id);
  const reasons: string[] = [];
  const policy_impacts = await policyImpactHolds(c, p, id);
  const incident_holds = await incidentHolds(c, p, id);
  if (!inspectionCapture) for (const hold of incident_holds) reasons.push(hold.message);
  // Preparation may use a future pin, but publication does not bring its actual
  // attendance authority forward. Retain the existing current-effective guard.
  if ((await c.query("SELECT 1 FROM ppo.scheduling_policies WHERE workspace_id=$1 AND id=$2 AND effective_from>clock_timestamp()", [p.workspace_id, a.scheduling_policy_id])).rowCount)
    reasons.push("The booked scheduling policy is not yet effective for actual attendance.");
  for (const impact of policy_impacts.filter(x => x.held))
    reasons.push(`Scheduling policy hold (${impact.disposition}): ${impact.reason}. Owner: ${impact.owner_name}. Publication: ${impact.publication_id}. ${impact.next_action}`);
  try {
    await authority(c, p, id, allowStarted);
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
    // The recipient's latest return of this issue and the preparer's answer, if any (P2, Q2).
    return_id: string | null;
    returned_at: Date | null;
    return_reasons: string[] | null;
    return_note: string | null;
    return_answered_at: Date | null;
    return_answer: string | null;
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
    const returns = await returnsInstalled(c);
    recipients = (
      await c.query(
        `SELECT pr.id,pr.user_id,pr.assignment_id,pr.assignment_version,u.display_name,ak.acknowledged_at,ak.presented_hash,x.active,${
          returns
            ? "rt.id AS return_id,rt.returned_at,rt.reason_codes AS return_reasons,rt.note AS return_note,an.answered_at AS return_answered_at,an.note AS return_answer"
            : "NULL::uuid AS return_id,NULL::timestamptz AS returned_at,NULL::text[] AS return_reasons,NULL::text AS return_note,NULL::timestamptz AS return_answered_at,NULL::text AS return_answer"
        } FROM ppo.pack_recipients pr JOIN ppo.users u ON u.id=pr.user_id JOIN ppo.assignments x ON x.id=pr.assignment_id LEFT JOIN ppo.pack_acknowledgements ak ON ak.recipient_id=pr.id${
          returns
            ? " LEFT JOIN LATERAL(SELECT * FROM ppo.pack_returns t WHERE t.workspace_id=pr.workspace_id AND t.recipient_id=pr.id ORDER BY t.returned_at DESC,t.id DESC LIMIT 1) rt ON true LEFT JOIN ppo.pack_return_answers an ON (an.workspace_id,an.return_id)=(rt.workspace_id,rt.id)"
            : ""
        } WHERE pr.workspace_id=$1 AND pr.issue_id=$2 ORDER BY pr.user_id`,
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
      if (r.return_id && !r.return_answered_at)
        reasons.push(
          `${r.display_name} returned this issue: ${returnReasonsText(r.return_reasons ?? [])}. Dispatch waits for a revised issue, or for the preparer's answer and ${r.display_name}'s acknowledgement.`,
        );
      else if (!r.acknowledged_at || r.presented_hash !== issue.output_hash)
        reasons.push(
          `${r.display_name}: explicit acknowledgement of this issue is required.`,
        );
  }
  // P1. Derived at every evaluation, before attendance begins. Once a visit has started, the parts
  // on site are a field fact and a later supply change never reopens its authority.
  const preparation = await appointmentPreparation(c, p.workspace_id, a.id);
  if (!a.actual_start_at && preparation && preparation.outcome !== "Pass")
    reasons.push(`Customer site readiness: ${preparation.outcome}. Record the four checks for this schedule version within the synthetic window.`);
  let parts: PartsReadiness | null = null;
  if (!a.actual_start_at) {
    parts = await partsCriterion(c, p.workspace_id, a);
    if (parts && !satisfied(parts.outcome)) reasons.push(partsReason(parts));
  }
  return {
    dispatch_hold: reasons.length > 0,
    component_ready: reasons.length === 0,
    actual_start_implemented: true,
    policy_impacts,
    incident_holds,
    reasons,
    recipients,
    parts,
    preparation,
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
      if (
        (await returnsInstalled(c)) &&
        (
          await c.query(
            "SELECT 1 FROM ppo.pack_returns t LEFT JOIN ppo.pack_return_answers n ON (n.workspace_id,n.return_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1 AND t.recipient_id=$2 AND n.id IS NULL",
            [p.workspace_id, recipient.id],
          )
        ).rowCount
      )
        fail(
          "You returned this issue. Acknowledge the revised issue, or this one after the preparer answers your return.",
          "IssueReturned",
        );
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
// P2. The exact recipient returns the exact issue with one or more reasons and a note. The return
// holds dispatch, tasks the preparer and, through the Returned event, the service owner (Q3).
// Online only in this increment (R10); an offline return follows under ADR-0013.
export async function returnPack(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "assignment_id",
    "assignment_version",
    "presented_hash",
    "captured_at",
    "reason_codes",
    "note",
  ]);
  const codes = r.reason_codes;
  if (
    !Array.isArray(codes) ||
    !codes.length ||
    codes.some(
      (x) =>
        typeof x !== "string" ||
        !(returnReasonCodes as readonly string[]).includes(x),
    ) ||
    new Set(codes).size !== codes.length
  )
    invalid("reason_codes", "Choose at least one reason, each once.");
  const cmd = {
    ...common(r),
    id: uuid(id, "issue_id"),
    assignment_id: uuid(r.assignment_id, "assignment_id"),
    assignment_version: version(r.assignment_version),
    presented_hash: narrative(r.presented_hash, "presented_hash", 64),
    captured_at: instant(r.captured_at, "captured_at"),
    reason_codes: codes as string[],
    note: narrative(r.note, "note", 1000).trim(),
  };
  return sharedOperation(
    p,
    cmd,
    "ReturnPack",
    (c) => issueContext(c, p, id, "pack.acknowledge"),
    async (c, { pack, a, w, issue }) => {
      if (
        pack.needs_review ||
        pack.current_issue_id !== id ||
        pack.status !== "Issued" ||
        a.status !== "Confirmed" ||
        issue.assignment_version !== a.assignment_version ||
        issue.schedule_version !== a.schedule_version
      )
        fail(
          "This issue no longer applies. Open the current issue.",
          "IssueNotApplicable",
        );
      if (cmd.presented_hash !== issue.output_hash)
        fail("The presented output hash does not match this exact issue.");
      const recipient = (
        await c.query(
          "SELECT pr.*,u.display_name FROM ppo.pack_recipients pr JOIN ppo.assignments x ON x.id=pr.assignment_id JOIN ppo.users u ON (u.workspace_id,u.id)=(pr.workspace_id,pr.user_id) WHERE pr.workspace_id=$1 AND pr.issue_id=$2 AND pr.assignment_id=$3 AND pr.user_id=$4 AND pr.assignment_version=$5 AND x.active AND x.assignment_version=$5",
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
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.pack_acknowledgements WHERE workspace_id=$1 AND recipient_id=$2",
            [p.workspace_id, recipient.id],
          )
        ).rowCount
      )
        fail(
          "You acknowledged this issue. Ask the preparer to amend the pack instead.",
          "IssueAcknowledged",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.pack_returns t LEFT JOIN ppo.pack_return_answers n ON (n.workspace_id,n.return_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1 AND t.recipient_id=$2 AND n.id IS NULL",
            [p.workspace_id, recipient.id],
          )
        ).rowCount
      )
        fail(
          "Your return of this issue is waiting for the preparer.",
          "IssueReturned",
        );
      const revision = (
        await c.query(
          "SELECT revision FROM ppo.pack_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, issue.revision_id],
        )
      ).rows[0].revision as number;
      const words = returnReasonsText(cmd.reason_codes),
        event = randomUUID();
      await insert(c, "pack_issue_events", {
        id: event,
        workspace_id: p.workspace_id,
        issue_id: id,
        kind: "Returned",
        reason: `Returned by ${recipient.display_name}: ${words}. ${cmd.note}`.slice(
          0,
          2000,
        ),
        actor_id: p.actor_id,
      });
      const returned = await insert(c, "pack_returns", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        recipient_id: recipient.id,
        issue_event_id: event,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        presented_hash: cmd.presented_hash,
        reason_codes: cmd.reason_codes,
        note: cmd.note,
        captured_at: cmd.captured_at,
      });
      await hold(c, p, a.id);
      const owner = await preparerOf(
        c,
        p,
        issue.revision_id,
        a,
        w.service_owner_id,
      );
      const task = await preparerTask(
        c,
        p,
        a.id,
        owner,
        `Revise job pack ${pack.display_number} · ${revisionLabel(revision)} returned by ${recipient.display_name}: ${words}. Note: ${cmd.note}`,
        true,
      );
      await insert(c, "pack_return_follow_ups", {
        workspace_id: p.workspace_id,
        return_id: returned.id,
        activity_id: task,
      });
      return {
        id: pack.id,
        version: pack.version,
        state: "Returned",
        updated_at: returned.returned_at,
        audit_details: {
          issue_id: id,
          recipient_id: recipient.id,
          return_id: returned.id,
          reason_codes: cmd.reason_codes,
          preparer_task_id: task,
        },
      };
    },
    "Pack",
    "PackIssueReturned",
  );
}
// Q2. The preparer answers a return without revising: "No change needed" with a reason the
// technician sees. The technician then acknowledges the same issue or returns it again.
export async function answerReturn(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "note"]);
  const cmd = {
    ...common(r),
    id: uuid(id, "return_id"),
    note: narrative(r.note, "note", 1000).trim(),
  };
  return sharedOperation(
    p,
    cmd,
    "AnswerPackReturn",
    async (c) => {
      const row = (
        await c.query(
          "SELECT t.*,i.pack_id,i.id AS issue_id FROM ppo.pack_returns t JOIN ppo.pack_recipients pr ON (pr.workspace_id,pr.id)=(t.workspace_id,t.recipient_id) JOIN ppo.pack_issues i ON (i.workspace_id,i.id)=(pr.workspace_id,pr.issue_id) WHERE t.workspace_id=$1 AND t.id=$2",
          [p.workspace_id, cmd.id],
        )
      ).rows[0];
      if (!row) throw unavailable();
      return { row, ...(await packContext(c, p, row.pack_id, "pack.prepare")) };
    },
    async (c, { row, pack, a }) => {
      if (
        pack.current_issue_id !== row.issue_id ||
        pack.status !== "Issued" ||
        pack.needs_review
      )
        fail(
          "A revision has been saved since this return. The revised issue answers it.",
          "IssueNotApplicable",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.pack_return_answers WHERE workspace_id=$1 AND return_id=$2",
            [p.workspace_id, cmd.id],
          )
        ).rowCount
      )
        fail("This return has already been answered.", "ReturnAnswered");
      const answer = await insert(c, "pack_return_answers", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        return_id: cmd.id,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        note: cmd.note,
      });
      // Dispatch stays held until the returning technician acknowledges.
      await c.query(
        "UPDATE ppo.appointments SET version=version+1,updated_by=$3,updated_at=clock_timestamp(),dispatch_hold=true,pack_requirement='AwaitingAcknowledgement' WHERE workspace_id=$1 AND id=$2 AND status<>'Cancelled'",
        [p.workspace_id, a.id, p.actor_id],
      );
      await c.query(
        "UPDATE ppo.activities SET status='Completed',outcome=$3,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND status IN ('Open','InProgress') AND id=(SELECT activity_id FROM ppo.pack_return_follow_ups WHERE workspace_id=$1 AND return_id=$2)",
        [
          p.workspace_id,
          cmd.id,
          `No change needed: ${cmd.note}`,
          p.actor_id,
        ],
      );
      return {
        id: pack.id,
        version: pack.version,
        state: "ReturnAnswered",
        updated_at: answer.answered_at,
        audit_details: { return_id: cmd.id, answer_id: answer.id },
      };
    },
    "Pack",
    "PackReturnAnswered",
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
type PackScope = Awaited<ReturnType<typeof packContext>>;
const unreadable = (e: unknown) =>
  e instanceof AppError && [403, 404, 422].includes(e.status);
// Readiness rows for the pack page come from the same registry the appointment read uses; the page never
// evaluates readiness itself. A dependency this identity cannot read yields null, which is not an empty list.
async function packCriteria(
  c: QueryClient,
  p: Principal,
  { a, w }: Pick<PackScope, "a" | "w">,
) {
  try {
    const r = await scopeDetail(c, p, w, a.scope_revision_id),
      rows = [
        ...(await criteriaFor(c, p, r)),
        ...(await criteriaFor(c, p, r, a.id)),
      ];
    const names = new Map<string, string>(
      (
        await c.query(
          "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
          [
            p.workspace_id,
            [...new Set(rows.map((x) => x.assessed_by).filter(Boolean))],
          ],
        )
      ).rows.map((u) => [u.id, u.display_name]),
    );
    const policy = (
      await c.query(
        "SELECT key,version FROM ppo.policy_versions WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, r.policy_version_id],
      )
    ).rows[0];
    return {
      policy: policy ?? null,
      // Allowlisted: evidence text and internal identifiers stay out of the pack read.
      criteria: rows.map((x): PackCriterion => ({
        criterion_code: x.criterion_code,
        label: x.label,
        blocking_stage: x.blocking_stage,
        exception_allowed: x.exception_allowed,
        not_applicable_allowed: x.not_applicable_allowed,
        outcome: x.outcome,
        recorded_outcome: x.recorded_outcome,
        stale: x.stale,
        expired: x.expired,
        reason: x.reason ?? null,
        assessed_by_name: names.get(x.assessed_by) ?? null,
        assessed_at: x.assessed_at ?? null,
        valid_until: x.valid_until ?? null,
        evidence_title: x.evidence_title ?? null,
        detail: x.parts?.summary ?? null,
      })),
    };
  } catch (e) {
    if (!unreadable(e)) throw e;
    return null;
  }
}
// The current value of every versioned field a snapshot records. Advisory: checkPack and requestIssue
// recompute the exact snapshot and remain the authority on whether a revision is stale.
async function currentBasis(
  c: QueryClient,
  p: Principal,
  { a, w }: Pick<PackScope, "a" | "w">,
): Promise<PackBasis> {
  const version = async (kind: "Site" | "Organisation", id: string) => {
    try {
      return (await visible(c, p, kind, id)).version as number;
    } catch (e) {
      if (!unreadable(e)) throw e;
      return null;
    }
  };
  const scope = w.scope_revision_id
    ? (
        await c.query(
          "SELECT id,version,content_hash FROM ppo.scope_revisions WHERE workspace_id=$1 AND work_order_id=$2 AND id=$3",
          [p.workspace_id, w.id, w.scope_revision_id],
        )
      ).rows[0]
    : null;
  let template = null;
  try { template = await selectedTemplate(c,p.workspace_id,a); }
  catch(e) { if (!(e instanceof AppError && ["TemplateUseUnavailable","TemplateBaselineChanged","AmbiguousTemplateUse"].includes(e.code))) throw e; }
  return {
    appointment_version: a.version,
    schedule_version: a.schedule_version,
    assignment_version: a.assignment_version,
    booking_hash:
      (a as typeof a & { booking_hash?: string }).booking_hash ?? null,
    work_version: w.version,
    scope_id: scope?.id ?? null,
    scope_version: scope?.version ?? null,
    scope_hash: scope?.content_hash ?? null,
    site_version: await version("Site", a.site_id),
    customer_version: await version("Organisation", w.customer_id),
    template_version: template?.version ?? null,
    policy_version: template?.policy_version ?? null,
  };
}
export async function readPack(p: Principal, id: string) {
  return transaction(async (c) => {
    const { pack, a, w } = await packContext(c, p, uuid(id, "pack_id"));
    const revisions = (
      await c.query(
        "SELECT r.*,u.display_name AS created_by_name FROM ppo.pack_revisions r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.created_by) WHERE r.workspace_id=$1 AND r.pack_id=$2 ORDER BY r.revision DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const checks = (
      await c.query(
        "SELECT k.*,u.display_name AS actor_name FROM ppo.pack_checks k JOIN ppo.users u ON (u.workspace_id,u.id)=(k.workspace_id,k.actor_id) WHERE k.workspace_id=$1 AND k.pack_id=$2 ORDER BY k.checked_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const issues = (
      await c.query(
        "SELECT i.*,r.revision,u.display_name AS issued_by_name FROM ppo.pack_issues i JOIN ppo.pack_revisions r ON r.id=i.revision_id JOIN ppo.users u ON (u.workspace_id,u.id)=(i.workspace_id,i.issued_by) WHERE i.workspace_id=$1 AND i.pack_id=$2 ORDER BY i.issued_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const events = (
      await c.query(
        "SELECT e.*,u.display_name AS actor_name FROM ppo.pack_issue_events e JOIN ppo.pack_issues i ON i.id=e.issue_id JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id) WHERE e.workspace_id=$1 AND i.pack_id=$2 ORDER BY e.occurred_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const jobs = (
      await c.query(
        "SELECT j.id,j.revision_id,j.state,j.attempts,j.error_code,j.requested_at,j.recovery_owner_id,j.issue_id,u.display_name AS actor_name,owner.display_name AS recovery_owner_name FROM ppo.pack_render_jobs j JOIN ppo.users u ON (u.workspace_id,u.id)=(j.workspace_id,j.actor_id) LEFT JOIN ppo.users owner ON (owner.workspace_id,owner.id)=(j.workspace_id,j.recovery_owner_id) WHERE j.workspace_id=$1 AND j.pack_id=$2 ORDER BY j.requested_at DESC",
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
    // Staff-only presentation context. Null means not provided to this identity, never "none".
    const prepared = revisions.find((r) => r.id === pack.current_revision_id),
      basis =
        staff && prepared ? basisOf(prepared.snapshot as PackSnapshot) : null,
      current_basis = basis ? await currentBasis(c, p, { a, w }) : null,
      assessed = staff ? await packCriteria(c, p, { a, w }) : null;
    const follow_ups = [],
      returnsReady = await returnsInstalled(c);
    if (staff)
      for (const f of (
        await c.query(
          `SELECT f.activity_id FROM ppo.pack_follow_ups f JOIN ppo.pack_issue_events e ON e.id=f.issue_event_id JOIN ppo.pack_issues i ON i.id=e.issue_id WHERE f.workspace_id=$1 AND i.pack_id=$2${
            returnsReady
              ? " UNION SELECT f.activity_id FROM ppo.pack_return_follow_ups f JOIN ppo.pack_returns t ON t.id=f.return_id JOIN ppo.pack_recipients r ON r.id=t.recipient_id JOIN ppo.pack_issues i ON i.id=r.issue_id WHERE f.workspace_id=$1 AND i.pack_id=$2 UNION SELECT f.activity_id FROM ppo.pack_check_follow_ups f JOIN ppo.pack_checks k ON k.id=f.check_id WHERE f.workspace_id=$1 AND k.pack_id=$2"
              : ""
          }`,
          [p.workspace_id, pack.id],
        )
      ).rows) {
        try {
          const task = await visibleActivity(c, p, f.activity_id);
          const owner = (
            await c.query(
              "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, task.owner_id],
            )
          ).rows[0];
          follow_ups.push({
            activity_id: task.id,
            owner_name: owner?.display_name ?? null,
            owner_id: task.owner_id,
            status: task.status,
            summary: task.summary,
          });
        } catch (e) {
          if (!(e instanceof AppError) || ![403, 404].includes(e.status))
            throw e;
        }
      }
    return envelope([
      {
        ...pack,
        current_issue_id:
          staff || currentIssues.length ? pack.current_issue_id : null,
        current_revision_id: staff
          ? pack.current_revision_id
          : (permittedRevisions[0]?.id ?? null),
        revisions: staff
          ? permittedRevisions
          : permittedRevisions.map((r) => ({ ...r, created_by_name: null })),
        checks: staff ? checks : [],
        issues: staff
          ? currentIssues
          : currentIssues.map((i) => ({ ...i, issued_by_name: null })),
        section_view: await sectionView(
          c,
          p,
          w,
          permittedRevisions.find(
            (r) =>
              r.id ===
              (staff
                ? pack.current_revision_id
                : currentIssues[0]?.revision_id),
          ),
          staff,
        ),
        criteria: assessed?.criteria ?? null,
        readiness_policy: assessed?.policy ?? null,
        basis,
        current_basis,
        basis_drift:
          basis && current_basis
            ? basisDrift(
                basis,
                current_basis,
                issues.some(
                  (i) =>
                    i.id === pack.current_issue_id &&
                    i.revision_id === pack.current_revision_id,
                ),
              )
            : null,
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
        follow_ups,
        // Technician returns and the preparer's answers (P2, Q2). A recipient sees the current issue's.
        returns: returnsReady
          ? (
              await c.query(
                "SELECT t.id,i.id AS issue_id,rv.revision,u.display_name,t.actor_id,t.reason_codes,t.note,t.returned_at,n.answered_at,n.note AS answer,au.display_name AS answered_by_name FROM ppo.pack_returns t JOIN ppo.pack_recipients pr ON (pr.workspace_id,pr.id)=(t.workspace_id,t.recipient_id) JOIN ppo.pack_issues i ON (i.workspace_id,i.id)=(pr.workspace_id,pr.issue_id) JOIN ppo.pack_revisions rv ON (rv.workspace_id,rv.id)=(i.workspace_id,i.revision_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.actor_id) LEFT JOIN ppo.pack_return_answers n ON (n.workspace_id,n.return_id)=(t.workspace_id,t.id) LEFT JOIN ppo.users au ON (au.workspace_id,au.id)=(n.workspace_id,n.actor_id) WHERE t.workspace_id=$1 AND i.pack_id=$2 AND ($3 OR i.id=$4) ORDER BY t.returned_at DESC,t.id",
                [
                  p.workspace_id,
                  pack.id,
                  staff,
                  currentIssues.find((i) => i.id === pack.current_issue_id)
                    ?.id ?? null,
                ],
              )
            ).rows
          : [],
        history: staff
          ? (
              await c.query(
                "SELECT id,kind,summary,occurred_at,confidence,author_label,source_system,source_id,verification_status FROM ppo.history_records WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND access_class IN ('RestrictedService','CustomerApproved') ORDER BY occurred_at DESC",
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
        acknowledgements: staff
          ? (
              await c.query(
                "SELECT ak.id,i.id AS issue_id,r.revision,u.display_name,ak.acknowledged_at FROM ppo.pack_acknowledgements ak JOIN ppo.pack_recipients pr ON (pr.workspace_id,pr.id)=(ak.workspace_id,ak.recipient_id) JOIN ppo.pack_issues i ON (i.workspace_id,i.id)=(pr.workspace_id,pr.issue_id) JOIN ppo.pack_revisions r ON (r.workspace_id,r.id)=(i.workspace_id,i.revision_id) JOIN ppo.users u ON (u.workspace_id,u.id)=(ak.workspace_id,ak.actor_id) WHERE i.workspace_id=$1 AND i.pack_id=$2 ORDER BY ak.acknowledged_at DESC,ak.id",
                [p.workspace_id, pack.id],
              )
            ).rows
          : null,
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
  return transaction(async (c) => {
    const rows = (
      await c.query(
        "SELECT id FROM ppo.packs WHERE workspace_id=$1 ORDER BY updated_at DESC",
        [p.workspace_id],
      )
    ).rows;
    const result: PackRegisterRow[] = [];
    for (const r of rows) {
      try {
        const { pack, a, w } = await packContext(c, p, r.id);
        const can_prepare = await hasPermission(
          c,
          p,
          "pack.prepare",
          a.company_id,
          a.site_id,
        );
        const staff =
          can_prepare ||
          (await hasPermission(c, p, "pack.check", a.company_id, a.site_id)) ||
          (await hasPermission(c, p, "pack.issue", a.company_id, a.site_id));
        // Match the detail read: recipients never see an unissued successor or its preparer.
        const issue = (
          await c.query(
            "SELECT id,revision_id,assignment_version,output_hash FROM ppo.pack_issues WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, pack.current_issue_id],
          )
        ).rows[0];
        const revisionId = staff
          ? pack.current_revision_id
          : issue?.assignment_version === a.assignment_version
            ? issue.revision_id
            : null;
        const rev = (
          await c.query(
            "SELECT r.id,r.revision,r.snapshot,r.created_by,u.display_name AS prepared_by_name FROM ppo.pack_revisions r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.created_by) WHERE r.workspace_id=$1 AND r.id=$2",
            [p.workspace_id, revisionId],
          )
        ).rows[0];
        const s = rev?.snapshot as PackSnapshot | undefined;
        const structured = rev ? await sectionView(c, p, w, rev, staff) : null;
        const scope = rev
          ? readSection("scope", rev.snapshot, rev.id, structured)
          : null;
        const assessed = staff ? await packCriteria(c, p, { a, w }) : null;
        const ready = await dispatchReadiness(c, p, a.id);
        const job = staff
          ? (
              await c.query(
                "SELECT state FROM ppo.pack_render_jobs WHERE workspace_id=$1 AND revision_id=$2 ORDER BY requested_at DESC LIMIT 1",
                [p.workspace_id, revisionId],
              )
            ).rows[0]
          : null;
        const currentIssue =
          staff || issue?.assignment_version === a.assignment_version
            ? pack.current_issue_id
            : null;
        result.push({
          id: pack.id,
          display_number: pack.display_number,
          status: pack.status,
          needs_review: pack.needs_review,
          appointment_id: a.id,
          appointment_reference: a.display_number,
          current_revision_id: revisionId ?? null,
          current_issue_id: currentIssue ?? null,
          revision: rev?.revision ?? null,
          title:
            scope?.kind === "scope"
              ? scope.value.summary
              : (s?.work.reference ?? w.display_number),
          visit_at: a.start_at.toISOString(),
          timezone: a.site_timezone,
          customer: s?.customer.name ?? "Not available",
          site: s?.site.name ?? "Not available",
          site_id: a.site_id,
          technicians:
            s?.recipients.map((t) => ({ id: t.user_id, name: t.name })) ?? [],
          prepared_by: staff ? (rev?.created_by ?? null) : null,
          prepared_by_name: staff ? (rev?.prepared_by_name ?? null) : null,
          updated_at: pack.updated_at.toISOString(),
          preparation: ready.preparation,
          job_state: job?.state ?? null,
          readiness: assessed
            ? {
                satisfied: readinessSummary(assessed.criteria).satisfied,
                total: assessed.criteria.length,
              }
            : null,
          acknowledged: currentIssue
            ? ready.recipients.filter(
                (t) =>
                  t.acknowledged_at && t.presented_hash === issue?.output_hash,
              ).length
            : null,
          recipients: currentIssue ? ready.recipients.length : null,
          returned: currentIssue
            ? ready.recipients.filter((t) => t.return_id && !t.return_answered_at)
                .length
            : null,
          dispatch_hold: ready.dispatch_hold,
          can_prepare,
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    }
    return envelope(result);
  });
}

// A genuine absence, scoped before counting. A hidden existing pack is never a new-pack opportunity.
export async function visitsWithoutPack(p: Principal) {
  return transaction(async (c) => {
    const rows = (
      await c.query(
        "SELECT a.id FROM ppo.appointments a WHERE a.workspace_id=$1 AND a.status='Confirmed' AND a.actual_start_at IS NULL AND a.end_at>clock_timestamp() AND NOT EXISTS (SELECT 1 FROM ppo.packs k WHERE k.workspace_id=a.workspace_id AND k.appointment_id=a.id) ORDER BY a.start_at,a.id",
        [p.workspace_id],
      )
    ).rows;
    const result: PackVisit[] = [];
    for (const row of rows)
      try {
        const { a, w } = await visibleAppointment(c, p, row.id, "pack.prepare");
        const site = await visible(c, p, "Site", a.site_id);
        result.push({
          id: a.id,
          display_number: a.display_number,
          work_order_reference: w.display_number,
          start_at: a.start_at.toISOString(),
          site_timezone: a.site_timezone,
          site_name: site.display_name,
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    return envelope(result);
  });
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
      // One pack per appointment: the preparation page opens the existing pack instead of creating a second.
      existing_pack_id:
        (
          await c.query(
            "SELECT id FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
            [p.workspace_id, a.id],
          )
        ).rows[0]?.id ?? null,
      sources: await availableSources(c, p, a.company_id, a.site_id),
      history: (
        await c.query(
          "SELECT id,kind,summary,occurred_at,confidence,author_label,source_system,source_id,verification_status FROM ppo.history_records WHERE workspace_id=$1 AND company_id=$2 AND site_id=$3 AND access_class IN ('RestrictedService','CustomerApproved') ORDER BY occurred_at DESC",
          [p.workspace_id, a.company_id, a.site_id],
        )
      ).rows,
    };
  });
}
// Canonical pack identity for an appointment this identity can already see, so a job's Job pack section opens
// the pack itself. A pack that does not exist and a pack outside this identity's scope both read as null.
export async function packForAppointment(p: Principal, id: string) {
  return transaction(async (c) => {
    const { a } = await visibleAppointment(
      c,
      p,
      uuid(id, "appointment_id"),
      "pack.read",
    );
    const row = (
      await c.query(
        "SELECT id FROM ppo.packs WHERE workspace_id=$1 AND appointment_id=$2",
        [p.workspace_id, a.id],
      )
    ).rows[0];
    let pack = null;
    if (row)
      try {
        const found = (await packContext(c, p, row.id)).pack;
        pack = {
          id: found.id,
          display_number: found.display_number,
          status: found.status,
          needs_review: found.needs_review,
        };
      } catch (e) {
        if (!(e instanceof AppError) || e.status !== 404) throw e;
      }
    return {
      pack,
      can_prepare: await hasPermission(
        c,
        p,
        "pack.prepare",
        a.company_id,
        a.site_id,
      ),
    };
  });
}
