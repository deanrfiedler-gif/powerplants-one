// PPO-MAINTENANCE-TS02-DEC increment M1: M-R1 six-monthly and yearly intervals, M-R2 Prepare
// creates the work order with the plan's tasks, and M-R4 follow-on work from a Partial occurrence.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createPlan, planCommand } from "../../src/maintenance/plans";
import {
  prepareWork,
  prepareFollowOn,
  receiveResult,
} from "../../src/maintenance/receiving";
import { workspace } from "../../src/maintenance/reads";
import { readWorkOrder } from "../../src/service/work-orders";
import { completionRequirementEntries } from "../../src/maintenance/model";
import {
  agreement,
  assessment,
  base,
  CRM,
  planContent,
  principal,
  rows,
  asset,
} from "../helpers/maintenance";
import { serviceResult } from "../helpers/maintenance-service";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code =
  (...codes: string[]) =>
  (e: unknown) =>
    codes.includes((e as { code: string }).code);
type Task = {
  id: ReturnType<typeof randomUUID>;
  description: string;
  expected_outcome: string;
  completion_requirements: string;
  kind: string;
};
const twoTasks = (): Task[] => [
  {
    id: randomUUID(),
    description: "SYN exact visual observation of the dosing enclosure",
    expected_outcome: "Retain observed enclosure condition",
    completion_requirements: "Reviewed task outcome with factual evidence",
    kind: "Inspection",
  },
  {
    id: randomUUID(),
    description: "SYN identify the irrigation controller firmware label",
    expected_outcome: "Retain the label as read, without intervention",
    completion_requirements: "Photographed label and reviewed reading",
    kind: "Identification",
  },
];
// A reviewed plan for the fixture asset under a fresh Active agreement (2026-01-01 to 2028-12-31).
async function reviewedPlan(
  overrides: Partial<ReturnType<typeof planContent>> = {},
) {
  const a = await agreement(),
    id = randomUUID(),
    content = { ...planContent(a.revision), window_months: 12, ...overrides };
  await createPlan(a.p, {
    ...base(),
    id,
    company_id: CRM.company,
    site_id: CRM.site,
    customer_id: CRM.org,
    owner_id: CRM.owner,
    asset_id: asset,
    content,
  });
  await planCommand(a.p, id, { ...base(), expected_version: 1, action: "Review" });
  return { ...a, agreement_id: a.id, id, content, version: 2 };
}
const dues = async (plan: string) =>
  (
    await rows(
      "SELECT original_due::text AS due FROM ppo.maintenance_occurrences WHERE plan_id=$1 ORDER BY original_due",
      [plan],
    )
  ).map((x) => x.due);
async function generate(
  a: Awaited<ReturnType<typeof reviewedPlan>>,
  from: string,
  until: string,
) {
  const r = await planCommand(a.p, a.id, {
    ...base(),
    expected_version: a.version,
    action: "Generate",
    from,
    until,
  });
  a.version = r.receipt.record_version;
  return r;
}

test("M-R1 six-monthly plans generate month-end-safe dates inside the 12-month window, with one obligation per date", async () => {
  const a = await reviewedPlan({ interval: "SixMonthly", anchor: "2026-08-31" });
  await generate(a, "2026-01-01", "2027-01-01");
  assert.deepEqual(await dues(a.id), ["2026-08-31"]);
  // Overlapping windows retain the existing obligation and add only the next date (end of February).
  // Concurrent and repeated runs of the same operation settle on one receipt.
  const overlap = {
    ...base(),
    expected_version: a.version,
    action: "Generate",
    from: "2026-08-01",
    until: "2027-08-01",
  };
  const runs = await Promise.all([
    planCommand(a.p, a.id, overlap),
    planCommand(a.p, a.id, overlap),
  ]);
  assert.deepEqual(runs[0].receipt, runs[1].receipt);
  assert.deepEqual((await planCommand(a.p, a.id, overlap)).receipt, runs[0].receipt);
  a.version = runs[0].receipt.record_version;
  assert.deepEqual(await dues(a.id), ["2026-08-31", "2027-02-28"]);
  const generated = (await workspace(a.p, "plans", a.id)).history.at(-1)!;
  assert.equal(generated.action, "Generated");
  assert.equal((generated.content.retained as string[]).length, 1);
  assert.equal((generated.content.created as string[]).length, 1);
  // A fresh operation over the same window retains both obligations and creates none.
  await generate(a, "2026-08-01", "2027-08-01");
  assert.deepEqual(await dues(a.id), ["2026-08-31", "2027-02-28"]);
  const again = (await workspace(a.p, "plans", a.id)).history.at(-1)!;
  assert.deepEqual(again.content.created, []);
  assert.equal((again.content.retained as string[]).length, 2);
  // More than the 12-month generation window is refused.
  await assert.rejects(generate(a, "2027-01-01", "2028-01-31"), code("InvalidData"));
});

test("M-R1 yearly plans yield at most two dates per run and stay inside the agreement term", async () => {
  const a = await reviewedPlan({ interval: "Yearly", anchor: "2026-01-31" });
  await generate(a, "2026-01-01", "2027-01-01");
  assert.deepEqual(await dues(a.id), ["2026-01-31"]);
  await generate(a, "2026-01-31", "2027-01-31");
  assert.deepEqual(await dues(a.id), ["2026-01-31", "2027-01-31"]);
  await generate(a, "2027-06-01", "2028-06-01");
  assert.deepEqual(await dues(a.id), ["2026-01-31", "2027-01-31", "2028-01-31"]);
  // 2029-01-31 falls after the agreement expires on 2028-12-31: the run is refused and creates nothing.
  await assert.rejects(generate(a, "2028-06-01", "2029-06-01"), code("SourceReviewRequired"));
  assert.deepEqual(await dues(a.id), ["2026-01-31", "2027-01-31", "2028-01-31"]);
  await assert.rejects(generate(a, "2026-01-01", "2027-02-01"), code("InvalidData"));
  // Existing plans keep their interval; a change needs a successor revision and review.
  await planCommand(a.p, a.id, {
    ...base(),
    expected_version: a.version,
    action: "Revise",
    content: { ...a.content, interval: "SixMonthly", effective_from: "2028-02-01" },
  });
  assert.equal((await workspace(a.p, "plans", a.id)).row.state, "Draft");
  await assert.rejects(
    planCommand(a.p, a.id, {
      ...base(),
      expected_version: a.version + 1,
      action: "Generate",
      from: "2028-02-01",
      until: "2028-12-31",
    }),
    code("SourceReviewRequired"),
  );
});

async function dueOccurrence(tasks = twoTasks()) {
  const a = await reviewedPlan({ tasks });
  await generate(a, "2026-01-01", "2026-01-31");
  const occurrence = (
    await rows("SELECT * FROM ppo.maintenance_occurrences WHERE plan_id=$1", [a.id])
  )[0];
  const entitlement = await assessment(a.p, a.revision);
  return { ...a, occurrence, entitlement, tasks };
}
const countRows = async () =>
  (
    await rows(
      "SELECT (SELECT count(*) FROM ppo.work_orders)::int AS orders,(SELECT count(*) FROM ppo.tickets)::int AS tickets,(SELECT count(*) FROM ppo.maintenance_work_requests)::int AS requests,(SELECT count(*) FROM ppo.scope_items)::int AS items",
    )
  )[0];

test("M-R2 Prepare creates the request and its Draft work order with exactly the plan's tasks, in one operation", async () => {
  const a = await dueOccurrence();
  const before = await countRows();
  const cmd = {
    ...base(),
    expected_version: 1,
    assessment_id: a.entitlement,
    owner_id: CRM.owner,
  };
  const prepared = await prepareWork(a.p, "due", a.occurrence.id, cmd);
  const request = (
    await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [a.occurrence.id])
  )[0];
  assert.ok(request.work_order_id);
  assert.equal(request.follow_on_result_id, null);
  // One operation: one receipt, one audit event and one outbox job for the whole preparation.
  for (const table of ["operation_receipts", "audit_events", "outbox_jobs"])
    assert.equal(
      (await rows(`SELECT count(*)::int AS n FROM ppo.${table} WHERE operation_id=$1`, [cmd.operation_id]))[0].n,
      1,
      table,
    );
  assert.deepEqual(await countRows(), {
    orders: before.orders + 1,
    tickets: before.tickets + 1,
    requests: before.requests + 1,
    items: before.items + 2,
  });
  const ticket = (await rows("SELECT * FROM ppo.tickets WHERE id=$1", [request.ticket_id]))[0];
  assert.equal(ticket.channel, "PlannedMaintenance");
  const w = (await readWorkOrder(a.p, request.work_order_id)).items[0];
  assert.equal(w.status, "Draft");
  assert.equal(w.service_owner_id, CRM.owner);
  assert.deepEqual(w.tickets.map((t: { id: string }) => t.id), [request.ticket_id]);
  const scope = w.scopes[0];
  assert.equal(w.scopes.length, 1);
  assert.deepEqual(
    scope.items.map((i: { task_description: string; task_kind: string; expected_outcome: string; completion_requirements: string[] }) => [
      i.task_description,
      i.task_kind,
      i.expected_outcome,
      i.completion_requirements,
    ]),
    a.tasks.map((t) => [t.description, t.kind, t.expected_outcome, [t.completion_requirements]]),
  );
  for (const item of scope.items)
    assert.deepEqual(item.assets.map((x: { asset_id: string }) => x.asset_id), [asset]);
  const agreementRow = (
    await rows(
      "SELECT a.reference,r.content FROM ppo.service_agreements a JOIN ppo.agreement_revisions r ON r.id=a.current_revision_id WHERE a.id=$1",
      [a.agreement_id],
    )
  )[0];
  assert.equal(scope.coverage.status, "Covered");
  assert.equal(scope.coverage.agreement_reference, agreementRow.reference);
  assert.match(agreementRow.reference, /^SYN-[A-Z]+-[0-9A-F]{12}$/);
  assert.equal(scope.coverage.source_version, agreementRow.content.source.revision);
  assert.equal(scope.coverage.effective_from, agreementRow.content.effective_from);
  assert.equal(scope.coverage.effective_to, agreementRow.content.effective_to);
  assert.equal(scope.coverage.entitlement_assessment_id, a.entitlement);
  assert.equal(scope.coverage.assessment, "SYN explicit source and event review");
  assert.equal(scope.coverage.charging_route, "ContractReference");
  assert.equal(scope.authority, null);
  assert.deepEqual(w.planned_tasks, a.tasks.map((t) => t.description).sort());
  // A person still completes the remaining authorisation fields and authorises.
  const blockers = w.blockers.map((b: { field: string }) => b.field);
  for (const field of ["authority_evidence", "exclusions", "pending_account_plan"])
    assert.ok(blockers.includes(field), field);
  assert.ok(!blockers.includes("coverage"));
  assert.ok(!blockers.includes("items"));
  // The occurrence records the prepared work order; the maintenance read links it.
  assert.equal(prepared.receipt.state, "WorkRequested");
  const d = await workspace(a.p, "due", a.occurrence.id);
  const event = d.history.find((e) => e.action === "WorkRequested")!;
  assert.equal(event.content.work_order_id, request.work_order_id);
  assert.deepEqual(
    (d.sources.requests as { work_order: { id: string; display_number: string } }[])[0].work_order,
    { id: w.id, display_number: w.display_number, status: "Draft" },
  );
});

test("M-R2 retrying Prepare never creates a second request or work order, and refusal precedes any write", async () => {
  const a = await dueOccurrence();
  const cmd = {
    ...base(),
    expected_version: 1,
    assessment_id: a.entitlement,
    owner_id: CRM.owner,
  };
  // Without Service work-order authority, Prepare is refused before anything is written.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service.work_order.edit'",
    [a.p.actor_id],
  );
  const empty = await countRows();
  await assert.rejects(prepareWork(a.p, "due", a.occurrence.id, cmd), code("Forbidden", "RecordUnavailable"));
  assert.deepEqual(await countRows(), empty);
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1", [cmd.operation_id]))[0].n,
    0,
  );
  await reset();
  const b = await dueOccurrence();
  const retry = { ...cmd, assessment_id: b.entitlement };
  const first = await prepareWork(b.p, "due", b.occurrence.id, retry);
  const after = await countRows();
  // The same operation replays its receipt; concurrent duplicates also settle on one receipt.
  const replays = await Promise.all([
    prepareWork(b.p, "due", b.occurrence.id, retry),
    prepareWork(b.p, "due", b.occurrence.id, retry),
  ]);
  for (const r of replays) assert.deepEqual(r.receipt, first.receipt);
  assert.deepEqual(await countRows(), after);
  // A fresh operation against the prepared occurrence is refused, as is reusing the operation for different content.
  await assert.rejects(
    prepareWork(b.p, "due", b.occurrence.id, { ...retry, operation_id: randomUUID(), expected_version: first.receipt.record_version }),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    prepareWork(b.p, "due", b.occurrence.id, { ...retry, owner_id: randomUUID() }),
    code("OperationConflict"),
  );
  assert.deepEqual(await countRows(), after);
  // Another workspace's actor cannot see or prepare the occurrence.
  await assert.rejects(
    prepareWork(await principal("other-workspace"), "due", b.occurrence.id, { ...retry, operation_id: randomUUID() }),
    code("RecordUnavailable", "Forbidden"),
  );
});

test("M-R4 a Partial occurrence offers one follow-on request carrying only the outstanding tasks", async () => {
  const a = await dueOccurrence();
  const p = a.p;
  // Follow-on is refused before any Partial result.
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...base(), expected_version: 1, assessment_id: a.entitlement, owner_id: CRM.owner }),
    code("SourceReviewRequired"),
  );
  const prepared = await prepareWork(p, "due", a.occurrence.id, {
    ...base(),
    expected_version: 1,
    assessment_id: a.entitlement,
    owner_id: CRM.owner,
  });
  const original = (await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [a.occurrence.id]))[0];
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...base(), expected_version: prepared.receipt.record_version, assessment_id: a.entitlement, owner_id: CRM.owner }),
    code("SourceReviewRequired"),
  );
  // The first task is completed, the second is not.
  const s = await serviceResult(p, original.id, 61, "Partial", ["Complete", "Partial"]);
  const received = await receiveResult(p, "due", a.occurrence.id, {
    ...base(),
    expected_version: prepared.receipt.record_version,
    request_id: original.id,
    report_revision_id: s.report.revisions[0].id,
    task_mapping: s.mapping,
  });
  assert.equal(received.receipt.state, "Partial");
  const result = (await rows("SELECT * FROM ppo.maintenance_service_results WHERE request_id=$1", [original.id]))[0];
  assert.equal(result.outcome, "Partial");
  const retained = {
    request: await rows("SELECT * FROM ppo.maintenance_work_requests WHERE id=$1", [original.id]),
    result: await rows("SELECT * FROM ppo.maintenance_service_results WHERE id=$1", [result.id]),
    report: await rows("SELECT * FROM ppo.report_revisions WHERE id=$1", [s.report.revisions[0].id]),
  };
  const version = received.receipt.record_version;
  // The assessment must be current, Covered and for the same original due date.
  const otherDate = await assessment(p, a.revision, "2026-02-28");
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...base(), expected_version: version, assessment_id: otherDate, owner_id: CRM.owner }),
    code("InvalidData"),
  );
  const unknown = await assessment(p, a.revision, "2026-01-31", null, undefined, "Unknown");
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...base(), expected_version: version, assessment_id: unknown, owner_id: CRM.owner }),
    code("SourceReviewRequired"),
  );
  // The earlier Covered assessment is now historical.
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...base(), expected_version: version, assessment_id: a.entitlement, owner_id: CRM.owner }),
    code("SourceReviewRequired"),
  );
  const covered = await assessment(p, a.revision);
  // An observer without maintenance or Service authority is refused before any write.
  await assert.rejects(
    prepareFollowOn(await principal("observer"), a.occurrence.id, { ...base(), expected_version: version, assessment_id: covered, owner_id: CRM.owner }),
    code("Forbidden", "RecordUnavailable"),
  );
  const cmd = { ...base(), expected_version: version, assessment_id: covered, owner_id: CRM.owner };
  const follow = await prepareFollowOn(p, a.occurrence.id, cmd);
  assert.equal(follow.receipt.state, "Partial");
  assert.deepEqual((await prepareFollowOn(p, a.occurrence.id, cmd)).receipt, follow.receipt);
  const requests = await rows(
    "SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1 ORDER BY created_at",
    [a.occurrence.id],
  );
  assert.equal(requests.length, 2);
  const followOn = requests[1];
  assert.equal(followOn.follow_on_result_id, result.id);
  assert.deepEqual(followOn.content.tasks.map((t: Task) => t.id), [a.tasks[1].id]);
  assert.deepEqual(followOn.content.tasks[0], a.tasks[1]);
  const w = (await readWorkOrder(p, followOn.work_order_id)).items[0];
  assert.equal(w.status, "Draft");
  assert.deepEqual(
    w.scopes[0].items.map((i: { task_description: string; task_kind: string }) => [i.task_description, i.task_kind]),
    [[a.tasks[1].description, a.tasks[1].kind]],
  );
  assert.equal(w.scopes[0].coverage.entitlement_assessment_id, covered);
  const d = await workspace(p, "due", a.occurrence.id);
  assert.equal(d.row.state, "Partial");
  const event = d.history.find((e) => e.action === "FollowOnRequested")!;
  assert.equal(event.content.follow_on_result_id, result.id);
  assert.deepEqual(event.content.outstanding_task_ids, [a.tasks[1].id]);
  // One open follow-on at a time: a fresh operation is refused, and so is a direct second insert.
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...cmd, operation_id: randomUUID(), expected_version: follow.receipt.record_version }),
    code("SourceReviewRequired"),
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.maintenance_work_requests(id,workspace_id,company_id,occurrence_id,ticket_id,assessment_id,content,content_hash,created_by,follow_on_result_id) SELECT $2,workspace_id,company_id,occurrence_id,ticket_id,assessment_id,content,content_hash,created_by,follow_on_result_id FROM ppo.maintenance_work_requests WHERE id=$1",
      [followOn.id, randomUUID()],
    ),
    /at most one open follow-on request/,
  );
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [a.occurrence.id]))[0].n, 2);
  // The original request, report and result stay unchanged, and results now arrive on the follow-on.
  assert.deepEqual(await rows("SELECT * FROM ppo.maintenance_work_requests WHERE id=$1", [original.id]), retained.request);
  assert.deepEqual(await rows("SELECT * FROM ppo.maintenance_service_results WHERE id=$1", [result.id]), retained.result);
  assert.deepEqual(await rows("SELECT * FROM ppo.report_revisions WHERE id=$1", [s.report.revisions[0].id]), retained.report);
  await assert.rejects(
    receiveResult(p, "due", a.occurrence.id, {
      ...base(),
      expected_version: follow.receipt.record_version,
      request_id: original.id,
      report_revision_id: s.report.revisions[0].id,
      task_mapping: s.mapping,
    }),
    code("SourceReviewRequired"),
  );
  // Completing every outstanding task on the follow-on completes the occurrence.
  const done = await serviceResult(p, followOn.id, 62, "Complete", undefined, 3);
  const completed = await receiveResult(p, "due", a.occurrence.id, {
    ...base(),
    expected_version: follow.receipt.record_version,
    request_id: followOn.id,
    report_revision_id: done.report.revisions[0].id,
    task_mapping: done.mapping,
  });
  assert.equal(completed.receipt.state, "Completed");
  assert.equal((await workspace(p, "due", a.occurrence.id)).row.state, "Completed");
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...cmd, operation_id: randomUUID(), expected_version: completed.receipt.record_version }),
    code("SourceReviewRequired"),
  );
  // Without Service work-order authority the follow-on is refused before its state is even read.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='service.work_order.edit'",
    [p.actor_id],
  );
  await assert.rejects(
    prepareFollowOn(p, a.occurrence.id, { ...cmd, operation_id: randomUUID(), expected_version: completed.receipt.record_version }),
    code("Forbidden", "RecordUnavailable"),
  );
});

// M1 review (PR #770): a retained plan requirement may hold 4,000 characters while a Service scope
// entry holds 1,000. Prepare and follow-on preparation copy it as ordered entries, losing no text.
test("M-R2/M-R4 retained completion requirements of 1,000, 1,001 and 4,000 characters reach the Draft scope whole", async () => {
  const words = (n: number) => "SYN reviewed outcome evidence ".repeat(Math.ceil(n / 30)).slice(0, n).trim();
  const tasks: Task[] = [
    { ...twoTasks()[0], completion_requirements: "x".repeat(1000) },
    { ...twoTasks()[1], completion_requirements: "y".repeat(1001) },
    { ...twoTasks()[0], id: randomUUID(), description: "SYN exact observation of the mixing tank", completion_requirements: words(4000) },
    // A supplementary character across the 1,000-code-unit boundary moves whole to the next entry.
    { ...twoTasks()[1], id: randomUUID(), description: "SYN identify the dosing pump label", completion_requirements: "a".repeat(999) + "\u{1F600}" + "b" },
  ];
  const a = await dueOccurrence(tasks);
  const p = a.p;
  const prepared = await prepareWork(p, "due", a.occurrence.id, {
    ...base(),
    expected_version: 1,
    assessment_id: a.entitlement,
    owner_id: CRM.owner,
  });
  const original = (await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1", [a.occurrence.id]))[0];
  // The request retains the plan's exact requirement text; the scope carries it as ordered entries.
  assert.deepEqual(original.content.tasks.map((t: Task) => t.completion_requirements), tasks.map((t) => t.completion_requirements));
  const scopeOf = async (workOrder: string) =>
    (await readWorkOrder(p, workOrder)).items[0].scopes[0].items.map((i: { completion_requirements: string[] }) => i.completion_requirements);
  const visible = (v: string) => v.replace(/\s/g, "");
  const entries = await scopeOf(original.work_order_id);
  assert.deepEqual(entries.map((e: string[]) => e.length), [1, 2, 5, 2]);
  entries.forEach((e: string[], i: number) => {
    assert.deepEqual(e, completionRequirementEntries(tasks[i].completion_requirements));
    assert.ok(e.every((x) => x.length <= 1000 && x.isWellFormed()));
    assert.equal(visible(e.join("")), visible(tasks[i].completion_requirements));
  });
  assert.deepEqual(entries[0], ["x".repeat(1000)]);
  assert.equal(entries[2].join(" "), tasks[2].completion_requirements);
  // Read back from the database, the character is intact in its own entry.
  assert.deepEqual(entries[3], ["a".repeat(999), "\u{1F600}b"]);
  // A Partial visit leaves the two long tasks outstanding; the follow-on scope carries them whole too.
  const s = await serviceResult(p, original.id, 63, "Partial", ["Complete", "Partial", "Partial", "Partial"]);
  const received = await receiveResult(p, "due", a.occurrence.id, {
    ...base(),
    expected_version: prepared.receipt.record_version,
    request_id: original.id,
    report_revision_id: s.report.revisions[0].id,
    task_mapping: s.mapping,
  });
  assert.equal(received.receipt.state, "Partial");
  await prepareFollowOn(p, a.occurrence.id, {
    ...base(),
    expected_version: received.receipt.record_version,
    assessment_id: await assessment(p, a.revision),
    owner_id: CRM.owner,
  });
  const followOn = (
    await rows("SELECT * FROM ppo.maintenance_work_requests WHERE occurrence_id=$1 AND follow_on_result_id IS NOT NULL", [a.occurrence.id])
  )[0];
  assert.deepEqual(followOn.content.tasks.map((t: Task) => t.completion_requirements), tasks.slice(1).map((t) => t.completion_requirements));
  assert.deepEqual(await scopeOf(followOn.work_order_id), tasks.slice(1).map((t) => completionRequirementEntries(t.completion_requirements)));
});
