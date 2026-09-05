import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { authority } from "../documents/context";
import { dispatchReadiness, insert } from "../documents/packs";
import { readBundle } from "../documents/worker";
import { sameVersion } from "../scheduling/validation";
import { fieldContext } from "./context";
import { startCommand } from "./validation";
export async function startAttendance(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = startCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "StartAttendance",
    (c) => fieldContext(c, p, id, "field.start.own"),
    async (c, ctx) => {
      const { a, w, assignment } = ctx;
      sameVersion(a.version, cmd.expected_version, "appointment");
      sameVersion(a.schedule_version, cmd.schedule_version, "schedule");
      sameVersion(a.assignment_version, cmd.assignment_version, "assignment");
      sameVersion(a.scope_version, cmd.scope_version, "scope");
      if (
        assignment.id !== cmd.assignment_id ||
        a.scope_revision_id !== cmd.scope_revision_id
      )
        throw unavailable();
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
            [p.workspace_id, id, p.actor_id],
          )
        ).rowCount
      )
        throw new AppError(
          409,
          "AttendanceAlreadyStarted",
          "Your start is already recorded. Refresh the job or recover the original operation.",
        );
      for (const row of (
        await c.query(
          "SELECT resource_id FROM ppo.assignments WHERE workspace_id=$1 AND appointment_id=$2 AND active ORDER BY resource_id",
          [p.workspace_id, id],
        )
      ).rows)
        await c.query(
          "SELECT id FROM ppo.resources WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
          [p.workspace_id, row.resource_id],
        );
      const ready = await dispatchReadiness(c, p, id, true);
      if (!ready.component_ready)
        throw new AppError(
          422,
          "StartBlocked",
          "Resolve the current start blockers.",
          ready.reasons.map((message) => ({ field: "start", message })),
        );
      const auth = await authority(c, p, id, true),
        issue = (
          await c.query(
            "SELECT i.*,r.snapshot FROM ppo.pack_issues i JOIN ppo.packs k ON k.current_issue_id=i.id JOIN ppo.pack_revisions r ON r.id=i.revision_id WHERE k.workspace_id=$1 AND k.appointment_id=$2 AND k.status='Issued' AND NOT k.needs_review",
            [p.workspace_id, id],
          )
        ).rows[0];
      if (
        !issue ||
        issue.id !== cmd.issue_id ||
        issue.output_hash !== cmd.issue_hash ||
        issue.snapshot.work.scope_id !== a.scope_revision_id ||
        issue.snapshot.work.scope_hash !== auth.r.content_hash ||
        issue.snapshot.work.scope_version !== a.scope_version
      )
        throw new AppError(
          409,
          "AuthorityChanged",
          "The exact issued scope has changed. Review the current job and pack.",
        );
      const now = (await c.query("SELECT clock_timestamp() now")).rows[0]
          .now as Date,
        through = new Date(Math.max(now.getTime(), a.end_at.getTime()));
      for (const control of auth.controls.filter(
        (x) =>
          x.blocking_stage === "Authorisation" ||
          x.criterion_code === "ToolPreparation",
      ))
        if (control.valid_until && control.valid_until < through)
          throw new AppError(
            422,
            "StartBlocked",
            "Current control evidence has expired; arrange review.",
          );
      const competencies: Record<string, unknown>[] = [];
      for (const member of auth.members) {
        if (member.effective_to < through)
          throw new AppError(
            422,
            "StartBlocked",
            "Current crew authority has expired.",
          );
        for (const skill of [
          ...new Set<string>(
            auth.r.items.flatMap(
              (i: { required_skill_codes: string[] }) => i.required_skill_codes,
            ),
          ),
        ]) {
          const evidence = (
            await c.query(
              "SELECT s.id,s.resource_id,s.version,s.skill_code,s.status,s.valid_from,s.valid_to,s.source_as_at,s.evidence_ref,e.content_hash AS evidence_hash,e.version AS evidence_version FROM ppo.skill_evidence s JOIN ppo.resource_evidence e ON (e.workspace_id,e.resource_id,e.id)=(s.workspace_id,s.resource_id,s.evidence_ref) WHERE s.workspace_id=$1 AND s.resource_id=$2 AND s.skill_code=$3 AND s.active AND s.status='Verified' AND s.valid_from<=$4 AND s.valid_to>=$5 ORDER BY s.id",
              [p.workspace_id, member.resource_id, skill, now, through],
            )
          ).rows;
          if (!evidence.length)
            throw new AppError(
              422,
              "StartBlocked",
              "Current crew competency evidence requires review.",
            );
          competencies.push(...evidence);
        }
      }
      if (Date.parse(cmd.captured_at) > now.getTime() + 300000)
        throw new AppError(
          422,
          "CaptureTimeInvalid",
          "Captured time is more than five minutes ahead of the server.",
        );
      await readBundle(p, issue.manifest); // Exact P06 bytes must still be retrievable, never regenerated.
      const acknowledgements = (
        await c.query(
          "SELECT k.id,k.recipient_id,k.actor_id,k.presented_hash,k.acknowledged_at FROM ppo.pack_acknowledgements k JOIN ppo.pack_recipients r ON r.id=k.recipient_id WHERE r.workspace_id=$1 AND r.issue_id=$2 ORDER BY k.actor_id",
          [p.workspace_id, issue.id],
        )
      ).rows;
      const snapshot = {
        schema_version: 1,
        appointment_id: id,
        appointment_version: a.version,
        schedule_version: a.schedule_version,
        assignment_version: a.assignment_version,
        assignment_id: assignment.id,
        actor_id: p.actor_id,
        work_order_id: w.id,
        work_order_version: w.version,
        scope_revision_id: a.scope_revision_id,
        scope_version: a.scope_version,
        scope_hash: auth.r.content_hash,
        issue_id: issue.id,
        issue_hash: issue.output_hash,
        issue_snapshot_hash: issue.snapshot_hash,
        site_version: auth.site.version,
        required_crew: issue.snapshot.recipients,
        competencies,
        scheduling_policy_id: a.scheduling_policy_id,
        readiness_policy_id: auth.r.policy_version_id,
        acknowledgements,
        controls: auth.controls.map((x) => ({
          assessment_id: x.assessment_id,
          policy_version_id: x.policy_version_id,
          scope_version: x.scope_version,
          assessed_at: x.assessed_at,
          assessed_by: x.assessed_by,
          source_as_at: x.source_as_at,
          criterion_code: x.criterion_code,
          outcome: x.outcome,
          evidence_ref: x.evidence_ref,
          evidence_hash: x.evidence_hash,
          valid_until: x.valid_until,
        })),
        received_at: now.toISOString(),
      };
      const hash = (
        await c.query(
          "SELECT encode(sha256(convert_to($1::jsonb::text,'UTF8')),'hex') hash",
          [snapshot],
        )
      ).rows[0].hash;
      const attendance = await insert(c, "field_attendances", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        company_id: a.company_id,
        site_id: a.site_id,
        appointment_id: id,
        actor_id: p.actor_id,
        assignment_id: assignment.id,
        assignment_version: a.assignment_version,
        schedule_version: a.schedule_version,
        scope_revision_id: a.scope_revision_id,
        scope_version: a.scope_version,
        scope_hash: auth.r.content_hash,
        issue_id: issue.id,
        issue_hash: issue.output_hash,
        captured_at: cmd.captured_at,
        received_at: now,
        authority_snapshot: snapshot,
        authority_hash: hash,
        operation_id: cmd.operation_id,
        reason: cmd.reason,
      });
      const saved = (
        await c.query(
          "UPDATE ppo.appointments SET status='InProgress',actual_start_at=coalesce(actual_start_at,$4),version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id, now],
        )
      ).rows[0];
      return {
        id,
        version: saved.version,
        state: "InProgress",
        updated_at: saved.updated_at,
        audit_details: {
          attendance_id: attendance.id,
          authority_hash: hash,
          issue_id: issue.id,
          issue_hash: issue.output_hash,
          assignment_id: assignment.id,
          scope_hash: auth.r.content_hash,
        },
      };
    },
    "Appointment",
    "AttendanceStarted",
  );
}
