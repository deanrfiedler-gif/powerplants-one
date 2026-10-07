import { randomUUID } from "node:crypto";
import type { Principal } from "../../src/platform/identity";
import { triageTicket, saveIntake } from "../../src/service/intake";
import {
  createWorkOrder,
  saveWorkScope,
  readWorkOrder,
  assessWorkReadiness,
  authoriseWorkOrder,
  proposeVisit,
} from "../../src/service/work-orders";
import { readAppointment, recordContact } from "../../src/scheduling/planner";
import { readPack, acknowledgePack } from "../../src/documents/packs";
import { processRenderJob } from "../../src/documents/worker";
import { readFieldJob } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { captureEntry } from "../../src/field/entries";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  submitCompletion,
  readReport,
  reviewReport,
} from "../../src/reports/service";
import { queued } from "./packs";
import { startInput, entry, draft, photo } from "./field";
import { decision } from "./reports";
import { base, CRM, principal, rows } from "./maintenance";
export async function serviceResult(
  p: Principal,
  request_id: string,
  n = 49,
  outcome = "Complete",
) {
  const request = (
    await rows("SELECT * FROM ppo.maintenance_work_requests WHERE id=$1", [
      request_id,
    ])
  )[0];
  const wid = randomUUID(),
    appointment = `a8000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const intake = (
    await rows("SELECT * FROM ppo.tickets WHERE id=$1", [request.ticket_id])
  )[0];
  await saveIntake(p, request.ticket_id, {
    ...base(),
    expected_version: 1,
    received_at: intake.received_at.toISOString(),
    channel: intake.channel,
    requester_id: CRM.person,
    requester_description: null,
    site_id: CRM.site,
    site_identification_needed: false,
    asset_id: request.content.asset.id,
    summary: intake.summary,
    symptom: intake.symptom,
    impact: "SYN source obligation requires the described observation",
    priority: intake.priority,
    priority_reason: intake.priority_reason,
    triage_owner_id: CRM.owner,
    next_action: "Prepare exact authorised Service scope",
  });
  await triageTicket(p, request.ticket_id, { ...base(), expected_version: 2 });
  await createWorkOrder(p, {
    ...base(),
    id: wid,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    service_owner_id: CRM.owner,
    tickets: [
      {
        ticket_id: request.ticket_id,
        issue_disposition: "Receive exact owned Maintenance/Warranty request",
      },
    ],
  });
  const evidence = {
    title: "SYN independent Service authority",
    content_text:
      "Exact synthetic visual work and site readiness reviewed; no customer or financial commitment.",
    source_reference: "SYN-MA-SERVICE",
    source_version: "1",
  };
  const agreement = (await rows(
    `SELECT a.reference, r.content FROM ppo.entitlement_assessments e
     JOIN ppo.agreement_revisions r ON r.id=e.agreement_revision_id
     JOIN ppo.service_agreements a ON a.id=r.agreement_id
     WHERE e.id=$1`, [request.assessment_id],
  ))[0];
  await saveWorkScope(p, wid, {
    ...base(),
    expected_version: 1,
    scope: {
      summary: "SYN receive exact source request",
      exclusions: "No invasive intervention",
      diagnostic_limit: "Visual identification only",
      pending_account_plan: "Finance decides separately",
      authority_evidence: evidence,
      coverage: {
        status: "Covered",
        agreement_reference: agreement?.reference ?? null,
        source_version: agreement?.content.source.revision ?? null,
        effective_from: agreement?.content.effective_from ?? null,
        effective_to: agreement?.content.effective_to ?? null,
        assessment: "Synthetic exact Maintenance/Warranty source reviewed",
        reason: "Independent Work Order coverage record",
        charging_route: "FinanceReview",
        entitlement_assessment_id: request.assessment_id,
      },
      items: request.content.tasks.map(
        (t: {
          description: string;
          expected_outcome: string;
          completion_requirements: string;
        }) => ({
          task_kind: "Inspection",
          task_description: t.description,
          expected_outcome: t.expected_outcome,
          completion_requirements: [t.completion_requirements],
          required_skill_codes: ["SYN-VISUAL"],
          shutdown_condition: null,
          access_condition: null,
          assets: [
            {
              asset_id: request.content.asset.id,
              configuration_id: null,
              identification_plan: null,
            },
          ],
        }),
      ),
    },
  });
  const order = async () => (await readWorkOrder(p, wid)).items[0];
  for (const criterion of [
    "SiteAccess",
    "SiteControls",
    "CompetencyPlan",
    "MandatoryIsolation",
    "ShutdownAuthority",
  ]) {
    const w = await order(),
      s = w.scopes[0];
    await assessWorkReadiness(p, wid, {
      ...base(),
      expected_version: w.version,
      assessment: {
        scope_revision_id: s.id,
        scope_version: s.version,
        criterion_code: criterion,
        outcome: ["MandatoryIsolation", "ShutdownAuthority"].includes(criterion)
          ? "NotApplicable"
          : "Pass",
        reason: "SYN exact non-intervention review",
        evidence,
        source_as_at: new Date().toISOString(),
      },
    });
  }
  let w = await order(),
    s = w.scopes[0];
  await authoriseWorkOrder(p, wid, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: s.id,
    scope_version: s.version,
    policy_version_id: s.policy_version_id,
  });
  w = await order();
  s = w.scopes[0];
  await proposeVisit(p, wid, {
    ...base(),
    expected_version: w.version,
    id: appointment,
    scope_revision_id: s.id,
    scope_version: s.version,
    start_at: "2031-09-25T00:00:00Z",
    end_at: "2031-09-25T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let a = (await readAppointment(p, appointment)).items[0];
  await assessWorkReadiness(p, wid, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: s.id,
      scope_version: s.version,
      appointment_id: appointment,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "Synthetic exact preparation source",
      evidence,
      source_as_at: new Date().toISOString(),
      valid_until: "2032-01-01T00:00:00Z",
    },
  });
  a = (await readAppointment(p, appointment)).items[0];
  await recordContact(p, appointment, {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: CRM.person,
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN retained fictional contact; no message sent",
  });
  const q = await queued(n);
  const issued = await processRenderJob(q.pack.jobs[0].id);
  if (!("issue_id" in issued)) throw Error(JSON.stringify(issued));
  for (const profile of ["assigned-technician", "second-technician"]) {
    const technician = await principal(profile),
      pack = (await readPack(p, q.pack.id)).items[0],
      recipient = pack.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === technician.actor_id,
      )!;
    await acknowledgePack(technician, issued.issue_id!, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  const technician = await principal("assigned-technician");
  let job = (await readFieldJob(technician, appointment)).items[0];
  await startAttendance(technician, appointment, startInput(job));
  job = (await readFieldJob(technician, appointment)).items[0];
  await captureEntry(
    technician,
    entry(job, "Observation", {
      finding: "SYN visual observation completed",
      confidence: "Verified",
      attempted_fix: "No intervention",
      result: "SYN observed condition recorded",
      follow_up_required: false,
    }),
  );
  if (outcome === "Complete") {
    const picture = await photo(job, technician);
    await captureEntry(
      technician,
      entry(job, "Photo", {
        attachment_id: picture.id,
        caption: "SYN completion evidence",
      }),
    );
    for (const check_id of ["SYN-SITE-CONTROLS", "SYN-TASK-RESULT"])
      await captureEntry(
        technician,
        entry(job, "Checklist", {
          check_id,
          result: "Pass",
          reason: null,
          evidence_ids: check_id === "SYN-SITE-CONTROLS" ? [picture.id] : [],
        }),
      );
  }
  job = (await readFieldJob(technician, appointment)).items[0];
  await saveCompletionDraft(technician, appointment, draft(job, outcome));
  job = (await readFieldJob(technician, appointment)).items[0];
  const report_id = randomUUID();
  await submitCompletion(technician, appointment, {
    ...base(),
    id: report_id,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  let report = (await readReport(p, report_id)).items[0];
  await reviewReport(p, report_id, decision(report));
  report = (await readReport(p, report_id)).items[0];
  return {
    report,
    request,
    technician,
    appointment,
    job,
    work_order_id: wid,
    mapping: request.content.tasks.map((t: { id: string }, i: number) => ({
      task_id: t.id,
      scope_item_id: report.revisions[0].snapshot.tasks[i].id,
      basis:
        "Exact immutable request/task and reviewed Service scope comparison",
    })),
  };
}
