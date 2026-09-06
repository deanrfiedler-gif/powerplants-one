import { randomUUID } from "node:crypto";
import {
  started,
  entry,
  draft,
  principal,
  base,
  rows,
  photo,
  timePayload,
  materialPayload,
} from "./field";
import { captureEntry } from "../../src/field/entries";
import { readFieldJob } from "../../src/field/reads";
import { saveCompletionDraft } from "../../src/field/completion";
import {
  submitCompletion,
  readReport,
  reviewReport,
} from "../../src/reports/service";
import { requestReportIssue, processReportJob } from "../../src/reports/worker";
export { principal, base, rows };
export async function submitted() {
  const q = await started();
  await captureEntry(q.p, entry(q.job, "Time", timePayload()));
  await captureEntry(q.p, entry(q.job, "Material", materialPayload()));
  await captureEntry(q.p, entry(q.job));
  const a = await photo(q.job, q.p);
  await captureEntry(
    q.p,
    entry(q.job, "Photo", {
      attachment_id: a.id,
      caption: "SYN inspection photograph",
    }),
  );
  let job = (await readFieldJob(q.p, q.job.id)).items[0];
  await saveCompletionDraft(q.p, job.id, draft(job));
  job = (await readFieldJob(q.p, job.id)).items[0];
  const cmd = {
    ...base(),
    id: randomUUID(),
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  };
  const result = await submitCompletion(q.p, job.id, cmd),
    reviewer = await principal("coordinator");
  return {
    ...q,
    job,
    cmd,
    result,
    reviewer,
    report: (await readReport(reviewer, cmd.id)).items[0],
    photo: a,
  };
}
export function decision(
  report: Awaited<ReturnType<typeof readReport>>["items"][number],
  value = "Approved",
) {
  const r = report.revisions[0];
  return {
    ...base(),
    expected_version: report.version,
    revision_id: r.id,
    source_hash: r.source_hash,
    decision: value,
    entry_decisions: (
      r.snapshot.entries as { id: string; version: number }[]
    ).map((e) => ({
      ...e,
      decision: value,
      remarks: "SYN exact factual evidence checked; no financial treatment.",
    })),
    authority_disposition: "Current",
    remarks: "SYN factual attendance review only; partial work stays owned.",
    recipient_id: report.recipient_id,
  };
}
export async function reviewed() {
  const q = await submitted();
  await reviewReport(q.reviewer, q.report.id, decision(q.report));
  return { ...q, report: (await readReport(q.reviewer, q.report.id)).items[0] };
}
export async function reportIssued() {
  const q = await reviewed(),
    r = q.report;
  await requestReportIssue(q.reviewer, r.id, {
    ...base(),
    expected_version: r.version,
    revision_id: r.revisions[0].id,
    review_id: r.reviews[0].id,
    template_id: r.template.id,
    template_version: r.template.version,
  });
  const report = (await readReport(q.reviewer, r.id)).items[0];
  const processed = await processReportJob(report.jobs[0].id);
  if (!("issue_id" in processed)) throw Error(JSON.stringify(processed));
  return { ...q, report: (await readReport(q.reviewer, r.id)).items[0] };
}
export function response(
  report: Awaited<ReturnType<typeof readReport>>["items"][number],
  value = "Accepted",
  kind = "IssuedReport",
) {
  const v = report.presentations.find(
    (x: { kind: string }) => x.kind === kind,
  )!;
  return {
    ...base(),
    id: randomUUID(),
    presentation_id: v.id,
    revision_id: v.revision_id,
    presentation_kind: v.kind,
    presented_hash: v.content_hash,
    expected_report_version: report.version,
    response: value,
    respondent_name: value === "Unavailable" ? null : "SYN Casey Customer",
    respondent_role: value === "Unavailable" ? null : "Fictional site contact",
    remarks:
      value === "Accepted"
        ? null
        : "SYN remaining second task requires a return visit.",
    next_action:
      value === "Accepted"
        ? null
        : "SYN coordinator to arrange the next contact and proposal.",
    presented_at: new Date().toISOString(),
    captured_at: new Date().toISOString(),
    signature: null,
  };
}
