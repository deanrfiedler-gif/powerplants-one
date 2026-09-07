import { randomUUID } from "node:crypto";
import { prepareFieldAppointment } from "./field-http";
import { base, startInput, entry, draft, materialPayload } from "./field";
import { decision } from "./reports";
export type Call = (
  path: string,
  body?: unknown,
) => Promise<Awaited<ReturnType<Response["json"]>>>;
// Only the pre-existing Service prerequisite is prepared through HTTP here.
// Finance review/return/allocation/processing/reconciliation is exercised through UI.
export async function financeHttpSource(call: Call, day: string, slot: number) {
  await call("local-session", { profile: "coordinator" });
  const setup = await prepareFieldAppointment(call, day);
  for (const profile of ["assigned-technician", "second-technician"]) {
    await call("local-session", { profile });
    const actor = await call("local-session"),
      r = setup.pack.readiness.recipients.find(
        (r: { user_id: string }) => r.user_id === actor.actor_id,
      );
    await call(`pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      ...base(),
      assignment_id: r.assignment_id,
      assignment_version: r.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  await call("local-session", { profile: "assigned-technician" });
  let j = (await call(`my-jobs/${setup.appointment_id}`)).items[0];
  await call(`appointments/${j.id}/start`, startInput(j));
  j = (await call(`my-jobs/${j.id}`)).items[0];
  const start = Date.parse("2026-08-15T00:00:00Z") + slot * 7200000;
  await call(
    "field-entries",
    entry(j, "Time", {
      time_kind: "Labour",
      start_at: new Date(start).toISOString(),
      end_at: new Date(start + 5400000).toISOString(),
      note: "F-06 fictional retrospective 90 MIN; distinct original per test slot.",
    }),
  );
  await call("field-entries", entry(j, "Material", materialPayload()));
  await call("field-entries", entry(j));
  j = (await call(`my-jobs/${j.id}`)).items[0];
  await call(`appointments/${j.id}/completion-draft`, draft(j));
  j = (await call(`my-jobs/${j.id}`)).items[0];
  const rid = randomUUID();
  await call(`appointments/${j.id}/submit-completion`, {
    ...base(),
    id: rid,
    attendance_id: j.attendance.id,
    draft_revision_id: j.draft_revisions[0].id,
    expected_draft_version: j.draft.version,
    expected_report_version: 0,
    expected_appointment_version: j.version,
    attendance_end_at: new Date().toISOString(),
  });
  await call("local-session", { profile: "coordinator" });
  let report = (await call(`reports/${rid}`)).items[0];
  await call(`reports/${rid}/review`, decision(report));
  report = (await call(`reports/${rid}`)).items[0];
  await call(`reports/${rid}/issue`, {
    ...base(),
    expected_version: report.version,
    revision_id: report.revisions[0].id,
    review_id: report.reviews[0].id,
    template_id: report.template.id,
    template_version: report.template.version,
  });
  report = (await call(`reports/${rid}`)).items[0];
  await call(`report-render-jobs/${report.jobs[0].id}/retry`, {});
  report = (await call(`reports/${rid}`)).items[0];
  return {
    report_id: rid,
    reference: report.reference,
    work_order_id: report.revisions[0].snapshot.work.id,
  };
}
export async function httpFinanceDraft(
  call: Call,
  source: Awaited<ReturnType<typeof financeHttpSource>>,
  mode = "SyntheticApi",
) {
  await call("local-session", { profile: "finance" });
  const o = await call("finance/options"),
    w = o.works.find((w: { id: string }) => w.id === source.work_order_id),
    data = await call(`finance/work-orders/${w.id}/sources`),
    r = data.items.find((r: { id: string }) => r.id === source.report_id),
    s = r.source;
  if (!r.ready) throw Error(JSON.stringify(r));
  const t = s.entries.find((e: { uom: string }) => e.uom === "MIN"),
    m = s.entries.find((e: { uom: string }) => e.uom === "EA");
  return {
    ...base(),
    id: randomUUID(),
    work_order_id: w.id,
    account_id: o.accounts.find(
      (a: { customer_id: string }) => a.customer_id === w.customer_id,
    ).id,
    mode,
    definition_id: o.definition.id,
    definition_version: o.definition.version,
    policy_version: o.definition.policy_version,
    reports: [
      {
        report_id: r.id,
        revision_id: r.revision_id,
        review_id: r.review_id,
        issue_id: r.issue_id,
      },
    ],
    lines: [
      {
        entry_id: t.id,
        quantity: "60",
        disposition: "Billable",
        reason:
          "F-06 explicitly reviewed synthetic sixty-minute target allocation.",
        target_group: "F06-LABOUR",
      },
      {
        entry_id: t.id,
        quantity: "30",
        disposition: "NonBillable",
        reason:
          "F-06 reviewed no-posting thirty-minute allocation, retained as consumed.",
        target_group: null,
      },
      {
        entry_id: m.id,
        quantity: "2",
        disposition: "Billable",
        reason:
          "F-06 explicitly fictional two-EA service charge, without stock movement.",
        target_group: "F06-MATERIAL",
      },
    ],
    treatment_basis:
      "F-06 synthetic only: 60 MIN and 2 EA to fictional target, 30 MIN reviewed non-billable. No live prices, tax or operational warranty policy.",
    remaining_work_basis:
      "Exact Partial attendance only; remaining physical work stays owned by Service and needs a separately authorised visit.",
  };
}
