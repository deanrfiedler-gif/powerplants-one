import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test, after } from "node:test";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";
import { decision } from "../helpers/reports";
import { base, startInput, draft, entry } from "../helpers/field";
import { prepareIsolatedFieldAppointment } from "../helpers/isolated-field-http";
import { closeDatabase } from "../../src/platform/database";
const origin = "http://127.0.0.1:3000";
after(closeDatabase);
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json(), headers: r.headers };
}
async function ok(cookie: string, path: string, body?: unknown) {
  const response = await call(cookie, path, body);
  assert.ok(response.status < 300, JSON.stringify(response));
  return response.body;
}
async function issuedSalesSource(co: string) {
  // HTTP files execute concurrently: own the work order, visit and issued report.
  // Shared visit 9 may already have been completed by another domain's journey.
  const setup = await prepareIsolatedFieldAppointment(
    (path, body) => ok(co, path, body),
    "2031-12-18",
  );
  const technician = await session("assigned-technician");
  for (const cookie of [technician, await session("second-technician")]) {
    const actor = await ok(cookie, "local-session");
    const recipient = setup.pack.readiness.recipients.find(
      (r: { user_id: string }) => r.user_id === actor.actor_id,
    );
    await ok(cookie, `pack-issues/${setup.pack.current_issue_id}/acknowledge`, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: setup.pack.issues[0].output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  let job = (await ok(technician, `my-jobs/${setup.appointment_id}`)).items[0];
  await ok(technician, `appointments/${job.id}/start`, startInput(job));
  job = (await ok(technician, `my-jobs/${job.id}`)).items[0];
  await ok(technician, "field-entries", entry(job));
  job = (await ok(technician, `my-jobs/${job.id}`)).items[0];
  await ok(technician, `appointments/${job.id}/completion-draft`, draft(job));
  job = (await ok(technician, `my-jobs/${job.id}`)).items[0];
  const reportId = randomUUID();
  await ok(technician, `appointments/${job.id}/submit-completion`, {
    ...base(),
    id: reportId,
    attendance_id: job.attendance.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  let report = (await ok(co, `reports/${reportId}`)).items[0];
  await ok(co, `reports/${reportId}/review`, decision(report));
  report = (await ok(co, `reports/${reportId}`)).items[0];
  await ok(co, `reports/${reportId}/issue`, {
    ...base(),
    expected_version: report.version,
    revision_id: report.revisions[0].id,
    review_id: report.reviews[0].id,
    template_id: report.template.id,
    template_version: report.template.version,
  });
  report = (await ok(co, `reports/${reportId}`)).items[0];
  const rendered = await ok(
    co,
    `report-render-jobs/${report.jobs[0].id}/retry`,
    {},
  );
  assert.equal(rendered.output_available, true);
  return reportId;
}
test("native Sales HTTP commands preserve exact receipts and scoped detail/list/options boundaries", async () => {
  const cookie = await session("coordinator"),
    other = await session("second-company"),
    o = crmDiscovery();
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  assert.equal((await call(cookie, "crm/opportunities", o)).status, 201);
  const id = randomUUID(),
    path = `sales/handovers/${id}`,
    input = { ...crmBase(), id, kind: "Estimating", opportunity_id: o.id };
  const accepted = await call(cookie, "sales/handovers", input);
  assert.equal(accepted.status, 201);
  // Discard the successful response in the client and reconcile its original identity.
  assert.deepEqual(
    (await call(cookie, `operations/${input.operation_id}`)).body,
    accepted.body,
  );
  assert.deepEqual(
    (await call(cookie, "sales/handovers", input)).body,
    accepted.body,
  );
  assert.equal(
    (await call(cookie, "sales/handovers", { ...input, kind: "Won" })).status,
    409,
  );
  const read = await call(cookie, path);
  assert.equal(read.status, 200);
  assert.match(read.headers.get("cache-control")!, /no-store/);
  const hidden = await call(other, path),
    missing = await call(other, `sales/handovers/${randomUUID()}`);
  assert.equal(hidden.status, 404);
  assert.equal(hidden.body.code, missing.body.code);
  assert.equal(
    (await call(other, `operations/${input.operation_id}`)).status,
    404,
  );
  assert.equal(
    (await call(other, "sales/handovers?kind=Estimating")).body.items.some(
      (x: { record: { id: string } }) => x.record.id === id,
    ),
    false,
  );
  const content = {
    ...emptyHandover(),
    problem: "SYN HTTP problem",
    outcome: "Confirmed outcome",
    included_scope: "Controls",
    exclusions: "None",
    assumptions: "None",
    unknowns: "None",
    date_reason: "Date needed",
    next_activity_id: o.initial_action.id,
  };
  const save = {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    content,
    receiving_owner_id: o.owner_id,
    note: "SYN exact brief",
  };
  assert.equal((await call(other, path, save)).status, 404);
  assert.equal((await call(cookie, path, save)).status, 200);
  assert.equal(
    (await call(cookie, path, { ...save, ...crmBase() })).status,
    409,
  );
  assert.equal(
    (
      await call(cookie, path, {
        ...crmBase(),
        action: "Submit",
        expected_version: 2,
        note: "SYN submit",
      })
    ).status,
    200,
  );
  const sourceId = await issuedSalesSource(cookie),
    aid = randomUUID(),
    create = { ...crmBase(), id: aid, source_report_id: sourceId };
  assert.equal((await call(cookie, "sales/aftercare", create)).status, 201);
  for (const suffix of ["", "/options"]) {
    assert.equal(
      (await call(cookie, `sales/aftercare/${aid}${suffix}`)).status,
      200,
    );
    assert.equal(
      (await call(other, `sales/aftercare/${aid}${suffix}`)).status,
      404,
    );
  }
  assert.equal(
    (await call(other, "sales/aftercare")).body.items.some(
      (x: { record: { id: string } }) => x.record.id === aid,
    ),
    false,
  );
  assert.equal(
    (
      await call(cookie, `sales/aftercare/${aid}`, {
        ...crmBase(),
        action: "Close",
        expected_version: 1,
        data: {},
      })
    ).status,
    409,
  );
  assert.deepEqual(
    (await call(cookie, `operations/${create.operation_id}`)).body,
    (await call(cookie, "sales/aftercare", create)).body,
  );
});
