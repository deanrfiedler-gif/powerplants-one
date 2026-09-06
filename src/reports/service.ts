import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { sharedOperation, canonical } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  type QueryClient,
} from "../platform/permissions";
import { insert } from "../documents/packs";
import { digest, documentStore } from "../documents/store";
import { sameVersion } from "../scheduling/validation";
import { attendanceContext } from "../field/context";
import { verifiedAttachmentBytes } from "../field/attachments";
import { inspectPng } from "../field/media";
import { visible, envelope } from "../shared/reads";
import { object, uuid } from "../shared/validation";
import { activityVisibility } from "../activities/activities";
import {
  reportContext,
  ownReport,
  bump,
  fail,
  followUp,
  recipient,
  sourceGuard,
} from "./context";
import {
  submitCommand,
  reviewCommand,
  revisionCommand,
  responseCommand,
} from "./validation";
import { customerSnapshot, reportHtml } from "./render";

export async function verifyEvidence(
  c: QueryClient,
  p: Principal,
  revisionId: string,
) {
  const refs = (
    await c.query(
      "SELECT e.* FROM ppo.report_entry_refs r JOIN ppo.field_entries e ON (e.workspace_id,e.id,e.version)=(r.workspace_id,r.entry_id,r.entry_version) WHERE r.workspace_id=$1 AND r.report_revision_id=$2 ORDER BY e.id",
      [p.workspace_id, revisionId],
    )
  ).rows;
  const revision = (
    await c.query(
      "SELECT snapshot FROM ppo.report_revisions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, revisionId],
    )
  ).rows[0];
  if (!revision) throw unavailable();
  const current = (
    await c.query(
      "SELECT id,version FROM ppo.field_entries e WHERE workspace_id=$1 AND attendance_id=$2 AND NOT EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id) ORDER BY id",
      [p.workspace_id, revision.snapshot.attendance.id],
    )
  ).rows;
  if (
    canonical(current) !==
    canonical(refs.map((e) => ({ id: e.id, version: e.version })))
  )
    fail(
      "EvidenceSetChanged",
      "Submitted evidence changed. Preserve this revision and submit an explicit successor.",
    );
  for (const a of revision.snapshot.attachments) {
    const file = (
      await c.query(
        "SELECT * FROM ppo.field_attachments WHERE workspace_id=$1 AND appointment_id=$2 AND id=$3",
        [p.workspace_id, revision.snapshot.appointment.id, a.id],
      )
    ).rows[0];
    if (
      !file ||
      file.status !== "Available" ||
      file.version !== a.version ||
      file.content_hash !== a.sha256
    )
      fail(
        "RequiredEvidenceUnavailable",
        "A required exact original is not available.",
      );
    await verifiedAttachmentBytes(p, file);
  }
  return refs;
}
export async function submitCompletion(
  p: Principal,
  id: string,
  input: unknown,
) {
  const cmd = submitCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "SubmitCompletion",
    (c) =>
      attendanceContext(c, p, id, cmd.attendance_id, "field.completion.own"),
    async (c, ctx) => {
      sameVersion(
        ctx.a.version,
        cmd.expected_appointment_version,
        "appointment",
      );
      if (
        !["InProgress", "CompletedPendingReview", "Completed"].includes(
          ctx.a.status,
        )
      )
        fail(
          "AttendanceNotStarted",
          "Submit only your already-started attendance.",
        );
      let report = (
        await c.query(
          "SELECT * FROM ppo.service_reports WHERE workspace_id=$1 AND attendance_id=$2",
          [p.workspace_id, cmd.attendance_id],
        )
      ).rows[0];
      if (report && report.id !== cmd.id)
        fail(
          "ReportAlreadyExists",
          "Use your existing report and exact current version.",
        );
      sameVersion(report?.version ?? 0, cmd.expected_report_version, "report");
      if (report && !["Draft", "Returned"].includes(report.status))
        fail(
          "SubmissionFrozen",
          "This exact set is already submitted. Return it or explicitly open a correction cycle.",
        );
      const d = (
        await c.query(
          "SELECT r.*,d.version AS current_version FROM ppo.completion_draft_revisions r JOIN ppo.completion_drafts d ON d.id=r.draft_id WHERE r.workspace_id=$1 AND r.appointment_id=$2 AND r.actor_id=$3 AND r.attendance_id=$4 AND r.id=$5",
          [
            p.workspace_id,
            id,
            p.actor_id,
            cmd.attendance_id,
            cmd.draft_revision_id,
          ],
        )
      ).rows[0];
      if (!d) throw unavailable();
      sameVersion(d.version, cmd.expected_draft_version, "draft revision");
      sameVersion(d.current_version, d.version, "latest completion draft");
      if (
        d.scope_outcome === "Complete" &&
        (d.time_declaration === "Incomplete" ||
          d.material_declaration === "Incomplete")
      )
        fail(
          "DeclarationsIncomplete",
          "A Complete claim requires finished time and material declarations. Preserve incomplete declarations with explicit partial work and an owned next action.",
        );
      const entries = (
        await c.query(
          "SELECT e.* FROM ppo.completion_entry_refs r JOIN ppo.field_entries e ON (e.workspace_id,e.id,e.version)=(r.workspace_id,r.entry_id,r.entry_version) WHERE r.workspace_id=$1 AND r.revision_id=$2 ORDER BY e.id",
          [p.workspace_id, d.id],
        )
      ).rows;
      if (
        entries.some(
          (e) =>
            e.actor_id !== p.actor_id || e.attendance_id !== cmd.attendance_id,
        )
      )
        fail(
          "PersonalSubmissionRequired",
          "Each technician submits their own evidence and declarations.",
        );
      const latest = (
        await c.query(
          "SELECT id,version FROM ppo.field_entries e WHERE workspace_id=$1 AND attendance_id=$2 AND NOT EXISTS(SELECT 1 FROM ppo.field_entries n WHERE n.workspace_id=e.workspace_id AND n.supersedes_entry_id=e.id) ORDER BY id",
          [p.workspace_id, cmd.attendance_id],
        )
      ).rows;
      if (
        canonical(latest) !==
        canonical(entries.map((e) => ({ id: e.id, version: e.version })))
      )
        fail(
          "EvidenceSetChanged",
          "Save a new draft containing all current evidence before submitting.",
        );
      const attachments = [];
      for (const ref of d.required_attachments) {
        const a = (
          await c.query(
            "SELECT * FROM ppo.field_attachments WHERE workspace_id=$1 AND appointment_id=$2 AND id=$3",
            [p.workspace_id, id, ref.id],
          )
        ).rows[0];
        if (
          !a ||
          a.status !== "Available" ||
          !ref.verified_available ||
          a.version !== ref.version ||
          a.content_hash !== ref.sha256
        )
          fail(
            "RequiredEvidenceUnavailable",
            "A required photo has not been accepted with its exact original bytes. Refresh and save the draft after recovery.",
          );
        await verifiedAttachmentBytes(p, a);
        attachments.push({
          id: a.id,
          version: a.version,
          sha256: a.content_hash,
          byte_count: a.byte_count,
        });
      }
      if (d.scope_outcome !== "Complete" && !d.follow_up_activity_id)
        fail(
          "RemainingWorkUnowned",
          "Record owned remaining work before submission.",
        );
      const accepted = (
        await c.query(
          "SELECT * FROM ppo.attendance_acceptances WHERE workspace_id=$1 AND attendance_id=$2",
          [p.workspace_id, cmd.attendance_id],
        )
      ).rows[0];
      if (
        accepted &&
        new Date(cmd.attendance_end_at).getTime() !==
          accepted.accepted_end_at.getTime()
      )
        fail(
          "AttendanceAlreadyAccepted",
          "A report correction retains the exact accepted attendance end.",
        );
      if (
        Date.parse(cmd.attendance_end_at) <
          ctx.attendance.received_at.getTime() ||
        Date.parse(cmd.attendance_end_at) > Date.now() + 300000
      )
        fail(
          "AttendanceEndInvalid",
          "Declare an end after your actual start and no later than five minutes ahead of receipt.",
        );
      if (!report)
        report = await insert(c, "service_reports", {
          id: cmd.id,
          workspace_id: p.workspace_id,
          company_id: ctx.a.company_id,
          site_id: ctx.a.site_id,
          appointment_id: id,
          attendance_id: cmd.attendance_id,
          actor_id: p.actor_id,
          status: "Draft",
          created_by: p.actor_id,
          updated_by: p.actor_id,
        });
      const site = await visible(c, p, "Site", ctx.a.site_id),
        customer = await visible(c, p, "Organisation", ctx.w.customer_id),
        scope = (
          await c.query(
            "SELECT id,version,content_hash,summary,exclusions FROM ppo.scope_revisions WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, ctx.attendance.scope_revision_id],
          )
        ).rows[0];
      const tasks = (
        await c.query(
          "SELECT id,task_description,expected_outcome,completion_requirements FROM ppo.scope_items WHERE workspace_id=$1 AND scope_revision_id=$2 ORDER BY id",
          [p.workspace_id, scope.id],
        )
      ).rows;
      const assets = (
        await c.query(
          "SELECT DISTINCT a.id,a.description AS display_name,a.identity_status FROM ppo.assets a JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.asset_id)=(a.workspace_id,a.id) JOIN ppo.scope_items si ON si.id=sa.scope_item_id WHERE si.workspace_id=$1 AND si.scope_revision_id=$2 ORDER BY a.id",
          [p.workspace_id, scope.id],
        )
      ).rows;
      const submissionGuard = await sourceGuard(c, p, { ...ctx, report });
      const snapshot = JSON.parse(
        JSON.stringify({
          schema_version: 1,
          source_guard: submissionGuard,
          synthetic: true,
          appointment: {
            id,
            reference: ctx.a.display_number,
            timezone: ctx.a.site_timezone,
          },
          work: { id: ctx.w.id, reference: ctx.w.display_number },
          customer: { id: customer.id, name: customer.display_name },
          site: { id: site.id, name: site.display_name },
          attendance: {
            id: ctx.attendance.id,
            actor_id: p.actor_id,
            name: p.display_name,
            start_at: ctx.attendance.received_at.toISOString(),
            end_at: cmd.attendance_end_at,
            scope_revision_id: ctx.attendance.scope_revision_id,
            scope_hash: ctx.attendance.scope_hash,
            issue_id: ctx.attendance.issue_id,
            issue_hash: ctx.attendance.issue_hash,
          },
          scope,
          tasks,
          assets,
          completion: {
            scope_outcome: d.scope_outcome,
            work_performed: d.work_performed,
            exclusions: d.exclusions,
            remaining_work: d.remaining_work,
            time_declaration: d.time_declaration,
            material_declaration: d.material_declaration,
            declaration_reason: d.declaration_reason,
            task_outcomes: d.task_outcomes,
            blockers: d.blockers,
            follow_up_activity_id: d.follow_up_activity_id,
          },
          entries,
          attachments,
        }),
      );
      const revision = await insert(c, "report_revisions", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        report_id: report.id,
        appointment_id: id,
        revision: report.revision + 1,
        predecessor_id: report.current_revision_id,
        draft_revision_id: d.id,
        actor_id: p.actor_id,
        attendance_end_at: cmd.attendance_end_at,
        snapshot,
        source_hash: digest(canonical(snapshot)),
        change_reason: cmd.reason,
        operation_id: cmd.operation_id,
      });
      for (const e of entries)
        await insert(c, "report_entry_refs", {
          workspace_id: p.workspace_id,
          report_revision_id: revision.id,
          appointment_id: id,
          entry_id: e.id,
          entry_version: e.version,
        });
      const result = await bump(c, p, report.id, {
        status: "Submitted",
        revision: revision.revision,
        current_revision_id: revision.id,
      });
      if (ctx.a.status === "InProgress")
        await c.query(
          "UPDATE ppo.appointments SET status='CompletedPendingReview',dispatch_hold=true,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, id, p.actor_id],
        );
      await followUp(
        c,
        p,
        { ...ctx, report: result },
        "Review",
        "Review exact completion submission and owned remaining work.",
      );
      return {
        ...result,
        audit_details: {
          revision_id: revision.id,
          source_hash: revision.source_hash,
          attendance_id: cmd.attendance_id,
        },
      };
    },
    "ServiceReport",
    "CompletionSubmitted",
  );
}
export async function reviewReport(p: Principal, id: string, input: unknown) {
  const cmd = reviewCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "ReviewReport",
    (c) => reportContext(c, p, id, "report.review"),
    async (c, ctx) => {
      const r = ctx.report;
      sameVersion(r.version, cmd.expected_version, "report");
      if (r.status !== "Submitted" || r.current_revision_id !== cmd.revision_id)
        fail(
          "SubmissionChanged",
          "Review only the exact current submitted revision.",
        );
      const revision = (
        await c.query(
          "SELECT * FROM ppo.report_revisions WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
          [p.workspace_id, id, cmd.revision_id],
        )
      ).rows[0];
      if (!revision || revision.source_hash !== cmd.source_hash)
        fail("EvidenceSetChanged", "The exact submitted source hash differs.");
      const refs = await verifyEvidence(c, p, revision.id);
      if (
        canonical(refs.map((e) => ({ id: e.id, version: e.version }))) !==
        canonical(
          cmd.entry_decisions.map((e) => ({ id: e.id, version: e.version })),
        )
      )
        fail(
          "EntryDecisionsIncomplete",
          "Decide every exact submitted entry once.",
        );
      if (
        cmd.decision === "Approved" &&
        cmd.entry_decisions.some((e) => e.decision !== "Approved")
      )
        fail(
          "ReturnedEntries",
          "Returned entries cannot belong to an approved report.",
        );
      if (
        cmd.decision === "Returned" &&
        !cmd.entry_decisions.some((e) => e.decision === "Returned") &&
        refs.length
      )
        fail(
          "ReturnReasonRequired",
          "Identify at least one returned entry and its correction reason.",
        );
      const guard = await sourceGuard(c, p, ctx),
        s = revision.snapshot;
      const changed =
        canonical(guard) !== canonical(s.source_guard) ||
        guard.scope_revision_id !== s.attendance.scope_revision_id ||
        guard.authorised_scope_revision_id !== s.attendance.scope_revision_id ||
        guard.pack?.current_issue_id !== s.attendance.issue_id ||
        guard.pack?.needs_review ||
        guard.pack?.status !== "Issued";
      if (changed && cmd.authority_disposition !== "OriginalAttendanceOnly")
        fail(
          "AuthorityReviewRequired",
          "Record original-attendance-only review of the changed scope or pack; it grants no further work authority.",
        );
      if (
        changed &&
        s.completion.scope_outcome === "Complete" &&
        cmd.decision === "Approved"
      )
        fail(
          "CompletionBlocked",
          "Changed authority needs an explicit partial or unable-to-proceed successor; mandatory controls cannot be waived.",
        );
      const audience =
        cmd.decision === "Approved"
          ? cmd.recipient_id
            ? await recipient(c, p, ctx, cmd.recipient_id)
            : fail(
                "RecipientRequired",
                "Select the permitted named site contact before approval.",
              )
          : null;
      const customer = audience
        ? customerSnapshot(
            s,
            r.display_number,
            revision.revision,
            audience,
            cmd.authority_disposition,
          )
        : null;
      const review = await insert(c, "report_reviews", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        report_id: id,
        revision_id: revision.id,
        actor_id: p.actor_id,
        decision: cmd.decision,
        source_hash: cmd.source_hash,
        entry_decisions: JSON.stringify(cmd.entry_decisions),
        authority_disposition: cmd.authority_disposition,
        remarks: cmd.remarks,
        recipient_id: audience?.id ?? null,
        customer_snapshot: customer,
        customer_hash: customer ? digest(canonical(customer)) : null,
        source_guard: audience ? { ...guard, recipient: audience } : null,
        operation_id: cmd.operation_id,
      });
      if (cmd.decision === "Approved") {
        await c.query(
          "INSERT INTO ppo.attendance_acceptances(workspace_id,attendance_id,report_id,review_id,accepted_end_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
          [
            p.workspace_id,
            r.attendance_id,
            id,
            review.id,
            revision.attendance_end_at,
          ],
        );
        const outstanding = (
          await c.query(
            "SELECT 1 FROM ppo.field_attendances a WHERE workspace_id=$1 AND appointment_id=$2 AND NOT EXISTS(SELECT 1 FROM ppo.attendance_acceptances x WHERE x.workspace_id=a.workspace_id AND x.attendance_id=a.id)",
            [p.workspace_id, ctx.a.id],
          )
        ).rowCount;
        if (!outstanding && ctx.a.status === "CompletedPendingReview")
          await c.query(
            "UPDATE ppo.appointments SET status='Completed',actual_end_at=(SELECT max(x.accepted_end_at) FROM ppo.attendance_acceptances x JOIN ppo.field_attendances a ON a.id=x.attendance_id WHERE a.workspace_id=$1 AND a.appointment_id=$2),dispatch_hold=true,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, ctx.a.id, p.actor_id],
          );
        const html = reportHtml(customer!, { kind: "DraftEvidence" });
        await insert(c, "report_presentations", {
          id: randomUUID(),
          workspace_id: p.workspace_id,
          report_id: id,
          revision_id: revision.id,
          kind: "DraftEvidence",
          content_hash: digest(html),
          html_hash: digest(html),
          html,
        });
        if (s.completion.scope_outcome !== "Complete")
          await followUp(
            c,
            p,
            ctx,
            "RemainingWork",
            s.completion.remaining_work,
          );
      }
      const result = await bump(c, p, id, {
        status: cmd.decision === "Approved" ? "Reviewed" : "Returned",
      });
      return {
        ...result,
        audit_details: {
          review_id: review.id,
          revision_id: revision.id,
          decision: cmd.decision,
          attendance_acceptance: cmd.decision === "Approved",
        },
      };
    },
    "ServiceReport",
    "ServiceReportReviewed",
  );
}
export async function amendReport(p: Principal, id: string, input: unknown) {
  const cmd = revisionCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "AmendReport",
    (c) => ownReport(c, p, id),
    async (c, ctx) => {
      sameVersion(ctx.report.version, cmd.expected_version, "report");
      if (
        !["Reviewed", "Issued"].includes(ctx.report.status) ||
        ctx.report.current_revision_id !== cmd.revision_id
      )
        fail(
          "CorrectionCycleUnavailable",
          "Open a correction cycle from the exact reviewed or issued report.",
        );
      await insert(c, "report_cycles", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        report_id: id,
        predecessor_id: cmd.revision_id,
        actor_id: p.actor_id,
        reason: cmd.reason,
        operation_id: cmd.operation_id,
      });
      await followUp(
        c,
        p,
        ctx,
        "Review",
        "Report correction requires a successor review and new customer response. " +
          cmd.reason,
      );
      return bump(c, p, id, { status: "Draft" });
    },
    "ServiceReport",
    "ReportCorrectionOpened",
  );
}
export async function recordResponse(p: Principal, id: string, input: unknown) {
  const cmd = responseCommand(id, input);
  return sharedOperation(
    p,
    cmd,
    "RecordCustomerResponse",
    (c) => reportContext(c, p, id, "report.respond"),
    async (c, ctx) => {
      sameVersion(ctx.report.version, cmd.expected_report_version, "report");
      const v = (
        await c.query(
          "SELECT * FROM ppo.report_presentations WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
          [p.workspace_id, id, cmd.presentation_id],
        )
      ).rows[0];
      if (
        !v ||
        v.revision_id !== cmd.revision_id ||
        v.kind !== cmd.presentation_kind ||
        v.content_hash !== cmd.presented_hash
      )
        fail(
          "PresentedContentChanged",
          "VAL-20: response and signature must stay with the exact content presented; reassociation is refused.",
        );
      if (
        v.revision_id !== ctx.report.current_revision_id ||
        !["Reviewed", "Issued"].includes(ctx.report.status)
      )
        fail(
          "PresentedContentStale",
          "This presentation is no longer the current reviewed content. Preserve the local intent; obtain a new presentation and response.",
        );
      if (
        v.kind === "IssuedReport" &&
        ctx.report.current_issue_id !== v.issue_id
      )
        fail(
          "PresentedContentStale",
          "This issued presentation was superseded.",
        );
      if (
        Date.parse(cmd.presented_at) < v.created_at.getTime() ||
        Date.parse(cmd.captured_at) > Date.now() + 300000
      )
        fail(
          "ResponseTimeInvalid",
          "Presentation must follow availability and capture must not be in the future.",
        );
      // Verify exact retained presentation bytes on acceptance; metadata is not evidence.
      await presentationBytes(p, id, v.id);
      let signatureKey = null;
      if (cmd.signature) {
        const bytes = Buffer.from(cmd.signature.content_base64, "base64");
        if (
          bytes.toString("base64") !== cmd.signature.content_base64 ||
          bytes.length !== cmd.signature.byte_count ||
          digest(bytes) !== cmd.signature.sha256
        )
          fail(
            "SignatureBytesMismatch",
            "Retain the exact original synthetic signature PNG.",
          );
        inspectPng(bytes);
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.customer_responses WHERE workspace_id=$1 AND report_id=$2 AND signature_hash=$3 AND presented_hash<>$4",
              [p.workspace_id, id, cmd.signature.sha256, v.content_hash],
            )
          ).rowCount
        )
          fail(
            "SignatureReassociationRefused",
            "The prior response mark belongs to different presented content. Obtain a new synthetic mark for this revision; no signature transfer is permitted.",
          );
        const bundle = Buffer.from(
          canonical({
            schema_version: 1,
            response_operation_hash: digest(canonical(cmd)),
            presentation_id: v.id,
            presented_hash: v.content_hash,
            png_base64: cmd.signature.content_base64,
          }),
        );
        signatureKey = await documentStore().store(
          { ...p, operation_id: cmd.operation_id },
          bundle,
          digest(bundle),
        );
        await documentStore().read(
          { ...p, operation_id: cmd.operation_id },
          signatureKey,
        );
      }
      const follow =
        cmd.response !== "Accepted"
          ? await followUp(
              c,
              p,
              ctx,
              "CustomerResponse",
              `${cmd.response}: ${cmd.remarks}. Next: ${cmd.next_action}`,
            )
          : null;
      const response = await insert(c, "customer_responses", {
        id: cmd.id,
        workspace_id: p.workspace_id,
        report_id: id,
        presentation_id: v.id,
        presented_hash: v.content_hash,
        response: cmd.response,
        respondent_name: cmd.respondent_name,
        respondent_role: cmd.respondent_role,
        remarks: cmd.remarks,
        next_action: cmd.next_action,
        presented_at: cmd.presented_at,
        captured_at: cmd.captured_at,
        actor_id: p.actor_id,
        operation_id: cmd.operation_id,
        signature_key: signatureKey,
        signature_hash: cmd.signature?.sha256 ?? null,
        signature_bytes: cmd.signature?.byte_count ?? null,
        follow_up_activity_id: follow,
      });
      return {
        id: response.id,
        version: 1,
        state: cmd.response,
        updated_at: response.received_at,
        audit_details: {
          report_id: id,
          presentation_id: v.id,
          revision_id: v.revision_id,
          presentation_kind: v.kind,
          presented_hash: v.content_hash,
          follow_up_activity_id: follow,
        },
      };
    },
    "CustomerResponse",
    "CustomerResponseRecorded",
  );
}
export async function listReports(p: Principal, input: unknown = {}) {
  object(input, []);
  return transaction(async (c) => {
    await requireCapability(c, p, "report.read");
    const candidates = (
        await c.query(
          "SELECT id FROM ppo.service_reports WHERE workspace_id=$1 ORDER BY updated_at DESC LIMIT 200",
          [p.workspace_id],
        )
      ).rows,
      items = [];
    for (const v of candidates)
      try {
        const { report, a } = await reportContext(c, p, v.id);
        items.push({
          id: report.id,
          reference: report.display_number,
          revision: report.revision,
          status: report.status,
          appointment_reference: a.display_number,
          updated_at: report.updated_at,
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    return envelope(items);
  });
}
export async function readReport(
  p: Principal,
  id: string,
  input: unknown = {},
) {
  object(input, []);
  return transaction(async (c) => {
    const ctx = await reportContext(c, p, id),
      r = ctx.report;
    const revisions = (
      await c.query(
        "SELECT * FROM ppo.report_revisions WHERE workspace_id=$1 AND report_id=$2 ORDER BY revision DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const reviews = (
      await c.query(
        "SELECT id,revision_id,decision,source_hash,entry_decisions,authority_disposition,remarks,recipient_id,customer_hash,reviewed_at FROM ppo.report_reviews WHERE workspace_id=$1 AND report_id=$2 ORDER BY reviewed_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const presentations = (
      await c.query(
        "SELECT id,revision_id,issue_id,kind,content_hash,html_hash,created_at FROM ppo.report_presentations WHERE workspace_id=$1 AND report_id=$2 ORDER BY created_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const responses = (
      await c.query(
        "SELECT id,presentation_id,presented_hash,response,respondent_name,respondent_role,remarks,next_action,presented_at,captured_at,received_at,signature_hash,signature_bytes,follow_up_activity_id FROM ppo.customer_responses WHERE workspace_id=$1 AND report_id=$2 ORDER BY received_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const issues = (
      await c.query(
        "SELECT id,revision_id,issued_at,output_hash,manifest->>'filename' AS filename FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2 ORDER BY issued_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const jobs = (
      await c.query(
        "SELECT id,revision_id,state,attempts,error_code,issue_id,requested_at FROM ppo.report_render_jobs WHERE workspace_id=$1 AND report_id=$2 ORDER BY requested_at DESC",
        [p.workspace_id, id],
      )
    ).rows;
    const follow_ups = (
      await c.query(
        `SELECT a.id,a.summary,a.status,a.owner_id,a.due_needed,u.display_name AS owner_name,f.kind FROM ppo.report_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id JOIN ppo.users u ON u.id=a.owner_id WHERE f.workspace_id=$1 AND f.report_id=$3 AND ${activityVisibility("a")} ORDER BY f.created_at`,
        [p.workspace_id, p.actor_id, id],
      )
    ).rows;
    const site = await visible(c, p, "Site", ctx.a.site_id),
      template = (
        await c.query(
          "SELECT t.id,t.version,t.content_hash,p.version AS policy_version FROM ppo.report_templates t JOIN ppo.report_template_policy p ON (p.workspace_id,p.template_id)=(t.workspace_id,t.id) WHERE t.workspace_id=$1",
          [p.workspace_id],
        )
      ).rows[0];
    const can_review =
        ctx.w.service_owner_id === p.actor_id &&
        (await hasPermission(c, p, "report.review", r.company_id, r.site_id)),
      can_issue =
        ctx.w.service_owner_id === p.actor_id &&
        (await hasPermission(c, p, "report.issue", r.company_id, r.site_id));
    return envelope([
      {
        id: r.id,
        reference: r.display_number,
        version: r.version,
        revision: r.revision,
        status: r.status,
        actor_id: r.actor_id,
        appointment: {
          id: ctx.a.id,
          reference: ctx.a.display_number,
          status: ctx.a.status,
          version: ctx.a.version,
          actual_end_at: ctx.a.actual_end_at,
        },
        work_order: { id: ctx.w.id, status: ctx.w.status },
        revisions: revisions.map((v) => ({
          id: v.id,
          revision: v.revision,
          predecessor_id: v.predecessor_id,
          source_hash: v.source_hash,
          submitted_at: v.submitted_at,
          snapshot: v.snapshot,
        })),
        reviews,
        presentations,
        responses,
        issues,
        jobs,
        follow_ups,
        template,
        recipient_id: site.primary_contact_id,
        can_review,
        can_issue,
        can_amend: r.actor_id === p.actor_id,
        can_respond: await hasPermission(
          c,
          p,
          "report.respond",
          r.company_id,
          r.site_id,
        ),
        finance_state: "Not implemented — P10",
      },
    ]);
  });
}
export async function presentationBytes(
  p: Principal,
  id: string,
  presentationId: string,
) {
  await reportContext(database(), p, id);
  const v = (
    await database().query(
      "SELECT * FROM ppo.report_presentations WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
      [p.workspace_id, id, uuid(presentationId, "presentation_id")],
    )
  ).rows[0];
  if (!v) throw unavailable();
  if (v.kind === "DraftEvidence") {
    if (digest(v.html) !== v.content_hash)
      fail(
        "ExactDocumentUnavailable",
        "The exact retained draft is unavailable.",
      );
    return {
      html: v.html as string,
      pdf: null,
      issued_at: null,
      manifest: {
        presentation_id: v.id,
        kind: v.kind,
        content_hash: v.content_hash,
        revision_id: v.revision_id,
      },
    };
  }
  const { readReportBundle } = await import("./worker");
  const i = (
    await database().query(
      "SELECT * FROM ppo.report_issues WHERE workspace_id=$1 AND report_id=$2 AND id=$3",
      [p.workspace_id, id, v.issue_id],
    )
  ).rows[0];
  if (!i) throw unavailable();
  const b = await readReportBundle(p, i.manifest);
  return { ...b, manifest: i.manifest, issued_at: i.issued_at as Date };
}
