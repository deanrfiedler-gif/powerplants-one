import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  closeDatabase,
  database,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { readFieldJob, listMyJobs } from "../../src/field/reads";
import { startAttendance } from "../../src/field/start";
import { visitArrivalGuidance } from "../../src/field/visit-guidance";
import { visitNavigation } from "../../src/field/visit-navigation";
import { fieldContext } from "../../src/field/context";
import { saveCompletionDraft } from "../../src/field/completion";
import { captureEntry } from "../../src/field/entries";
import {
  submitCompletion,
  reviewReport,
  readReport,
} from "../../src/reports/service";
import { readWorkOrder, proposeVisit } from "../../src/service/work-orders";
import {
  readAppointment,
  cancelAppointment,
} from "../../src/scheduling/planner";
import { syncBatch } from "../../src/offline/server";
import { downloadContext } from "../../src/offline/recovery";
import { readOperation } from "../../src/shared/receipts";
import {
  acknowledged,
  startInput,
  draft,
  entry,
  principal,
  base,
  rows,
} from "../helpers/field";
import { decision } from "../helpers/reports";
import { operation } from "../helpers/offline";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(async () => {
  await closeDatabase();
  await reset();
});
after(closeDatabase);
const code =
  (...values: string[]) =>
  (e: unknown) =>
    values.includes((e as { code: string }).code);
async function closedFixture() {
  const q = await acknowledged(),
    p = await principal("assigned-technician"),
    other = await principal("second-technician");
  const before = (await readFieldJob(p, q.pack.appointment_id)).items[0];
  const otherBefore = (await readFieldJob(other, before.id)).items[0];
  const cmd = startInput(before),
    receipt = await startAttendance(p, before.id, cmd);
  let job = (await readFieldJob(p, before.id)).items[0];
  await captureEntry(p, entry(job));
  job = (await readFieldJob(p, before.id)).items[0];
  await saveCompletionDraft(p, job.id, draft(job));
  job = (await readFieldJob(p, job.id)).items[0];
  const reportId = randomUUID();
  await submitCompletion(p, job.id, {
    ...base(),
    id: reportId,
    attendance_id: job.attendance!.id,
    draft_revision_id: job.draft_revisions[0].id,
    expected_draft_version: job.draft!.version,
    expected_report_version: 0,
    expected_appointment_version: job.version,
    attendance_end_at: new Date().toISOString(),
  });
  const service = await principal("coordinator");
  return { p, other, service, before, otherBefore, cmd, receipt, reportId };
}
async function accept(q: Awaited<ReturnType<typeof closedFixture>>) {
  const report = (await readReport(q.service, q.reportId)).items[0];
  await reviewReport(q.service, report.id, decision(report));
}
async function proposal(
  q: Awaited<ReturnType<typeof closedFixture>>,
  preparation = "Unknown",
) {
  const w = (await readWorkOrder(q.service, q.before.work_order.id)).items[0];
  const r = w.scopes.find((x) => x.id === w.scope_revision_id)!;
  return {
    ...base(),
    id: randomUUID(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: "2026-12-21T00:00:00Z",
    end_at: "2026-12-21T02:00:00Z",
    requested_window_start: null,
    requested_window_end: null,
    customer_commitment: "Unknown",
    preparation_status: preparation,
  };
}

test("CV-01/02 actor-specific closed state retains facts and refuses a new crew start before and after acceptance", async () => {
  const q = await closedFixture();
  assert.equal(q.before.status, "Confirmed");
  assert.equal(q.before.arrival_actions.can_start, true);
  assert.equal(q.before.visit_navigation, null);
  for (const status of ["CompletedPendingReview", "Completed"]) {
    const mine = (await readFieldJob(q.p, q.before.id)).items[0],
      other = (await readFieldJob(q.other, q.before.id)).items[0];
    assert.equal(mine.status, status);
    assert.equal(other.attendance, null);
    assert.equal(mine.attendance!.actor_id, q.p.actor_id);
    assert.equal(visitArrivalGuidance(status, false).startable, false);
    assert.ok(mine.report);
    assert.equal(other.report, null);
    assert.equal(Boolean(mine.accepted_end_at), status === "Completed");
    await assert.rejects(
      startAttendance(q.other, other.id, startInput(other)),
      code("StartBlocked"),
    );
    const replay = await startAttendance(q.p, q.before.id, q.cmd);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, q.receipt.receipt);
    assert.deepEqual(
      await readOperation(q.p, q.cmd.operation_id),
      q.receipt.receipt,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int n FROM ppo.field_attendances WHERE appointment_id=$1",
          [q.before.id],
        )
      )[0].n,
      1,
    );
    const list = (await listMyJobs(q.other)).items.find(
      (x) => x.id === q.before.id,
    )!;
    assert.equal(list.status, status);
    assert.equal(list.my_started_at, null);
    if (status === "CompletedPendingReview") await accept(q);
  }
});

test("CV-04/05 existing proposal, concurrent original recovery and controlled replacement retain history without invented lineage", async () => {
  const q = await closedFixture();
  await accept(q);
  const input = await proposal(q);
  const concurrent = await Promise.all([
    proposeVisit(q.service, q.before.work_order.id, input),
    proposeVisit(q.service, q.before.work_order.id, input),
  ]);
  assert.deepEqual(concurrent[0].receipt, concurrent[1].receipt);
  await assert.rejects(
    proposeVisit(q.service, q.before.work_order.id, {
      ...input,
      preparation_status: "Preparing",
    }),
    code("OperationConflict"),
  );
  let nav = (await readFieldJob(q.other, q.before.id)).items[0]
    .visit_navigation!;
  const row = nav.visits.find((x) => x.id === input.id)!;
  assert.equal(row.preparation_status, "Unknown");
  assert.equal(row.field_href, null);
  assert.equal(nav.can_propose, false);
  assert.equal(JSON.stringify(row).includes("replacement"), false);
  const a = (await readAppointment(q.service, input.id)).items[0];
  await cancelAppointment(q.service, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  const replacement = await proposal(q, "Preparing");
  const race = await Promise.allSettled([
    proposeVisit(q.service, q.before.work_order.id, replacement),
    proposeVisit(q.service, q.before.work_order.id, {
      ...replacement,
      ...base(),
      id: randomUUID(),
    }),
  ]);
  assert.equal(race.filter((x) => x.status === "fulfilled").length, 1);
  const winner = race.find((x) => x.status === "fulfilled")!;
  assert.equal(winner.status, "fulfilled");
  const winnerId = winner.value.receipt.record_id;
  nav = (await readFieldJob(q.other, q.before.id)).items[0].visit_navigation!;
  assert.equal(nav.visits.find((x) => x.id === input.id)!.status, "Cancelled");
  assert.equal(
    nav.visits.find((x) => x.id === winnerId)!.preparation_status,
    "Preparing",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.appointments WHERE id=ANY($1::uuid[])",
        [[input.id, winnerId]],
      )
    )[0].n,
    2,
  );
  assert.equal(
    (await readFieldJob(q.other, q.before.id)).items[0].attendance,
    null,
  );
});

test("CV-06 scoped navigation and read-only arrival do not grant receiving commands or disclose unavailable visits", async () => {
  const q = await closedFixture();
  await accept(q);
  const input = await proposal(q);
  await proposeVisit(q.service, q.before.work_order.id, input);
  for (const profile of [
    "second-company",
    "other-workspace",
    "observer",
    "systems",
  ])
    await assert.rejects(
      readFieldJob(await principal(profile), q.before.id),
      code("Forbidden", "RecordUnavailable"),
    );
  await assert.rejects(
    proposeVisit(q.other, q.before.work_order.id, await proposal(q)),
    code("Forbidden", "RecordUnavailable"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('field.start.own','pack.acknowledge')",
    [q.other.actor_id],
  );
  const readOnly = (await readFieldJob(q.other, q.before.id)).items[0];
  assert.deepEqual(readOnly.arrival_actions, {
    can_start: false,
    can_acknowledge: false,
  });
  await assert.rejects(
    startAttendance(q.other, readOnly.id, startInput(readOnly)),
    code("Forbidden", "RecordUnavailable"),
  );
  // Candidate lookup is exact company/site/order; no fallback from similar IDs.
  await transaction(async (c) => {
    const { a, w } = await fieldContext(c, q.other, q.before.id);
    assert.deepEqual(
      (await visitNavigation(c, q.other, { ...a, site_id: randomUUID() }, w))
        .visits,
      [],
    );
    assert.deepEqual(
      (await visitNavigation(c, q.other, { ...a, company_id: randomUUID() }, w))
        .visits,
      [],
    );
    assert.deepEqual(
      (await visitNavigation(c, q.other, a, { ...w, id: randomUUID() })).visits,
      [],
    );
  });
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.read'",
    [q.other.actor_id],
  );
  await assert.rejects(
    readFieldJob(q.other, q.before.id),
    code("Forbidden", "RecordUnavailable"),
  );
});

test("CV-09 delayed cached arrival is retained on the old closed visit and accepted originals still recover exactly", async () => {
  const q = await closedFixture();
  await accept(q);
  const delayed = operation(
      q.other,
      q.otherBefore,
      "Start",
      startInput(q.otherBefore),
    ),
    original = structuredClone(delayed);
  const first = await syncBatch(q.other, { operations: [delayed] });
  assert.notEqual(first.outcomes[0].state, "ServerSaved");
  assert.ok(["ReviewRequired", "Conflict"].includes(first.outcomes[0].state));
  assert.deepEqual(delayed, original);
  assert.deepEqual(
    (await syncBatch(q.other, { operations: [delayed] })).outcomes[0],
    first.outcomes[0],
  );
  assert.equal(
    (await readFieldJob(q.other, q.before.id)).items[0].attendance,
    null,
  );
  const accepted = operation(q.p, q.before, "Start", q.cmd);
  assert.deepEqual(
    (await syncBatch(q.p, { operations: [accepted] })).outcomes[0].receipt,
    q.receipt.receipt,
  );
  const cached = await downloadContext(q.p, q.before.id, {});
  assert.equal(cached.job.status, "Completed");
  assert.equal(cached.job.visit_navigation, null);
  assert.deepEqual(cached.job.arrival_actions, {
    can_start: false,
    can_acknowledge: false,
  });
  assert.equal(
    cached.job.attendance!.id,
    (await readFieldJob(q.p, q.before.id)).items[0].attendance!.id,
  );
});
