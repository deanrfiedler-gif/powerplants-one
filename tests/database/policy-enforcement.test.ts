import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { closeDatabase, transaction } from "../../src/platform/database";
import { prepareBookingPolicy } from "../../src/scheduling/booking-policy";
import { publishSchedulingPolicy } from "../../src/scheduling/policy-commands";
import {
  readPolicyImpact,
  resolveSchedulingPolicyImpact,
} from "../../src/scheduling/policy-resolution";
import {
  confirmAppointment,
  moveAppointment,
  readAppointment,
  recordContact,
} from "../../src/scheduling/planner";
import { policyImpactHolds } from "../../src/scheduling/policy-holds";
import {
  dispatchReadiness,
  revisePack,
  checkPack,
  requestIssue,
  readPack,
  acknowledgePack,
} from "../../src/documents/packs";
import { startAttendance } from "../../src/field/start";
import {
  attendanceContext,
  currentCaptureState,
} from "../../src/field/context";
import { listMyJobs, readFieldJob } from "../../src/field/reads";
import { syncBatch } from "../../src/offline/server";
import { readBundle, processRenderJob } from "../../src/documents/worker";
import { operation, rehash } from "../helpers/offline";
import { acknowledged, startInput } from "../helpers/field";
import { confirmed, id, content } from "../helpers/packs";
import {
  base,
  code,
  principal,
  reviewed,
  rows,
  setupPolicy,
  snapshot,
} from "../helpers/policy-commands";
import { serialised } from "../helpers/policy-concurrency";

beforeEach(setupPolicy);
after(closeDatabase);
const crew = (resources = [id("a4", 9), id("a4", 2)]) =>
  resources.map((resource_id, i) => ({
    resource_id,
    resource_version: 1,
    calendar_version: 1,
    crew_role: i ? "Technician" : "Lead",
    travel_before_minutes: 0,
    travel_after_minutes: 0,
    travel_reason: "SYN reviewed zero travel",
  }));
async function booking(n = 9, period = {}) {
  const p = await principal(),
    a = (await readAppointment(p, id("a8", n))).items[0];
  const preparation = await prepareBookingPolicy(p, a.id, period);
  return {
    p,
    a,
    preparation,
    cmd: {
      ...base(),
      expected_version: a.version,
      expected_work_order_version: a.work_order_version,
      expected_assignment_version: a.assignment_version,
      scope_revision_id: a.scope_revision_id,
      scope_version: a.scope_version,
      policy_version_id: a.policy_version_id,
      scheduling_policy_id: preparation.policy.id,
      scheduling_policy_version: preparation.policy.version,
      scheduling_policy_hash: preparation.policy.content_hash,
      publication_head_version: preparation.family_head_version,
      selected_policy: preparation.selected_policy,
      crew: crew(n === 2 ? [id("a4", 5)] : undefined),
      ...period,
    },
  };
}
const holds = (p: Awaited<ReturnType<typeof principal>>, a: string) =>
  transaction((c) => policyImpactHolds(c, p, a));
const resolution = (r: Awaited<ReturnType<typeof readPolicyImpact>>) => ({
  ...base(),
  impact_hash: r.impact.content_hash,
  expected_appointment_version: r.appointment.version,
  expected_resolution: r.expected_resolution,
  dependency_fingerprint: r.dependency_fingerprint,
  outcome: "VerifiedNoConflict",
  replacement: null,
});

test("Step 4 selection uses visit boundaries and immutable head evidence; stale and missing preparation refuse without repinning", async () => {
  const b = await booking(2),
    old = await snapshot(["appointment_revisions", "appointments"]);
  const f = await reviewed(240);
  await publishSchedulingPolicy(f.publisher, f.publish);
  const select = (start_at: string, end_at: string) =>
    prepareBookingPolicy(b.p, b.a.id, { start_at, end_at });
  assert.equal(
    (await select("2031-09-21T23:00:00Z", "2031-09-22T00:00:00Z")).policy.id,
    id("a0"),
  );
  assert.equal(
    (await select("2031-09-22T00:00:00Z", "2031-09-22T01:00:00Z")).policy.id,
    f.publish.selected_policy.id,
  );
  assert.equal(
    (await select("2031-09-23T00:00:00Z", "2031-09-23T01:00:00Z")).policy.id,
    f.publish.selected_policy.id,
  );
  for (const period of [
    ["2031-09-21T23:00:00Z", "2031-09-22T01:00:00Z"],
    ["2032-01-02T00:00:00Z", "2032-01-02T01:00:00Z"],
    ["2020-01-01T00:00:00Z", "2020-01-01T01:00:00Z"],
  ])
    await assert.rejects(select(period[0], period[1]), code("InvalidData"));
  await assert.rejects(
    confirmAppointment(b.p, b.a.id, b.cmd),
    code("VersionConflict"),
  );
  const fresh = await booking(2);
  const {
    scheduling_policy_hash: _hash,
    publication_head_version: _head,
    ...missing
  } = fresh.cmd;
  void _hash;
  void _head;
  await assert.rejects(
    confirmAppointment(b.p, b.a.id, missing),
    code("VersionConflict"),
  );
  assert.deepEqual(await snapshot(Object.keys(old)), old);
  const saved = await confirmAppointment(b.p, b.a.id, fresh.cmd);
  assert.equal(
    (await readAppointment(b.p, b.a.id)).items[0].scheduling_policy_id,
    f.publish.selected_policy.id,
  );
  assert.deepEqual(
    (await confirmAppointment(b.p, b.a.id, fresh.cmd)).receipt,
    saved.receipt,
  );
  await assert.rejects(
    confirmAppointment(b.p, b.a.id, {
      ...fresh.cmd,
      publication_head_version: 1,
    }),
    code("OperationConflict"),
  );
  const futureReady = await transaction(c => dispatchReadiness(c, b.p, b.a.id));
  assert(futureReady.reasons.includes("The booked scheduling policy is not yet effective for actual attendance."));
  const historic = (await readAppointment(b.p, id("a8"))).items[0];
  assert.equal(historic.scheduling_policy_id, id("a0"));
  assert.equal(historic.policy.id, id("a0"));
});

test("Step 4 immediate owned holds survive Activity completion; exact controlled resolution clears only policy hold and later moves restore it", async () => {
  const a = await confirmed(),
    p = await principal(),
    f = await reviewed();
  const originals = await snapshot([
    "resource_reservations",
    "appointment_revisions",
    "appointments",
  ]);
  await publishSchedulingPolicy(f.publisher, f.publish);
  assert.deepEqual(await snapshot(Object.keys(originals)), originals);
  let h = (await holds(p, a.id))[0];
  assert.equal(h.held, true);
  assert.equal(h.owner_id, p.actor_id);
  assert.match(h.reason, /DurationLimitExceeded/);
  assert.equal(
    h.publication_id,
    (await rows("SELECT id FROM ppo.scheduling_policy_publications"))[0].id,
  );
  await rows(
    `UPDATE ppo.activities SET status='Completed',outcome='SYN completed task only',version=version+1
    WHERE id IN (SELECT activity_id FROM ppo.scheduling_policy_impact_activities WHERE impact_id=$1)`,
    [h.impact_id],
  );
  assert.equal((await holds(p, a.id))[0].held, true);
  await assert.rejects(
    resolveSchedulingPolicyImpact(
      f.publisher,
      h.impact_id,
      resolution(await readPolicyImpact(p, h.impact_id)),
    ),
  );
  await assert.rejects(
    resolveSchedulingPolicyImpact(
      p,
      h.impact_id,
      resolution(await readPolicyImpact(p, h.impact_id)),
    ),
    code("InvalidData"),
  );
  const period = {
    start_at: "2031-09-21T23:00:00.000Z",
    end_at: "2031-09-21T23:30:00.000Z",
  };
  const b = await booking(9, period);
  await moveAppointment(p, a.id, b.cmd);
  h = (await holds(p, a.id))[0];
  assert.equal(h.held, true);
  const input = resolution(await readPolicyImpact(p, h.impact_id));
  const accepted = await resolveSchedulingPolicyImpact(p, h.impact_id, input);
  assert.equal((await holds(p, a.id))[0].held, false);
  const ready = await transaction((c) => dispatchReadiness(c, p, a.id));
  assert.equal(ready.dispatch_hold, true); // Independent customer/pack requirements remain.
  assert(ready.reasons.length > 0);
  const changed = await booking(9, {
    ...period,
    end_at: "2031-09-21T23:15:00.000Z",
  });
  await moveAppointment(p, a.id, changed.cmd);
  assert.equal((await holds(p, a.id))[0].disposition, "Stale");
  assert.equal((await holds(p, a.id))[0].held, true);
  assert.deepEqual(
    (await resolveSchedulingPolicyImpact(p, h.impact_id, input)).receipt,
    accepted.receipt,
  );
  assert.equal(
    (await readAppointment(p, a.id)).items[0].scheduling_policy_id,
    id("a0"),
  );
});

test("Step 4 publication winning real graph lock refuses actual and delayed offline Start; originals and exact issue bytes survive retry/restart", async () => {
  const pack = await acknowledged(),
    p = await principal("assigned-technician");
  const job = (await readFieldJob(p, pack.pack.appointment_id)).items[0],
    cmd = startInput(job);
  const original = operation(p, job, "Start", cmd),
    originalBytes = JSON.stringify(original);
  const manifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
      pack.issue_id,
    ])
  )[0].manifest;
  const bytes = await readBundle(pack.p, manifest),
    retained = await snapshot([
      "pack_revisions",
      "pack_issues",
      "operation_receipts",
    ]);
  const f = await reviewed();
  const [published, started] = await serialised(
    () => publishSchedulingPolicy(f.publisher, f.publish),
    () => startAttendance(p, job.id, cmd),
  );
  assert.equal(published.status, "fulfilled");
  assert.equal(started.status, "rejected");
  if (started.status === "rejected")
    assert.equal(started.reason.code, "StartBlocked");
  assert.equal((await listMyJobs(p)).items.find(x => x.id === job.id)!.dispatch_hold, true);
  for (let i = 0; i < 2; i++) {
    const result = await syncBatch(p, { operations: [original] });
    assert.equal(result.outcomes[0].state, "ReviewRequired");
    assert.equal(result.outcomes[0].code, "StartBlocked");
    assert.equal(JSON.stringify(original), originalBytes);
    assert.deepEqual(await readBundle(pack.p, manifest), bytes);
    await closeDatabase();
  }
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_attendances WHERE appointment_id=$1",
        [job.id],
      )
    )[0].n,
    0,
  );
  const current = await snapshot(Object.keys(retained));
  assert.deepEqual(current.pack_issues, retained.pack_issues);
  assert.deepEqual(current.pack_revisions, retained.pack_revisions);
  assert.deepEqual(
    current.operation_receipts.filter((r: { id: string }) =>
      retained.operation_receipts.some((x: { id: string }) => x.id === r.id),
    ),
    retained.operation_receipts,
  );
  assert(
    (await readFieldJob(p, job.id)).items[0].readiness.reasons.some((x) =>
      x.includes("Scheduling policy hold"),
    ),
  );
});

test("Step 4 accepted offline Start recovers exactly after publication; altered retries refuse and started work remains historical", async () => {
  const pack = await acknowledged(),
    p = await principal("assigned-technician");
  const job = (await readFieldJob(p, pack.pack.appointment_id)).items[0];
  const original = operation(p, job, "Start", startInput(job)),
    originalBytes = JSON.stringify(original);
  const f = await reviewed();
  const [started, stalePublication] = await serialised(
    () => syncBatch(p, { operations: [original] }),
    () => publishSchedulingPolicy(f.publisher, f.publish),
    false,
    "appointment",
  );
  assert.equal(started.status, "fulfilled");
  assert.equal(stalePublication.status, "rejected");
  if (started.status !== "fulfilled") return;
  assert.equal(started.value.outcomes[0].state, "ServerSaved");
  const next = await reviewed();
  await publishSchedulingPolicy(next.publisher, next.publish);
  await closeDatabase();
  const recovered = await syncBatch(p, { operations: [original] });
  assert.deepEqual(
    recovered.outcomes[0].receipt,
    started.value.outcomes[0].receipt,
  );
  assert.equal(JSON.stringify(original), originalBytes);
  assert.equal((await holds(p, job.id)).length, 0);
  const altered = rehash({
    ...original,
    payload: { ...original.payload, reason: "Altered retry" },
  });
  assert.equal(
    (await syncBatch(p, { operations: [altered] })).outcomes[0].state,
    "Conflict",
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.field_attendances WHERE appointment_id=$1",
        [job.id],
      )
    )[0].n,
    1,
  );
});

test("Step 4 controlled amendment, independent crew acknowledgements and fresh resolution permit start and current capture", async () => {
  const pack = await acknowledged(),
    p = pack.p,
    technician = await principal("assigned-technician");
  const oldManifest = (
    await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
      pack.issue_id,
    ])
  )[0].manifest;
  const oldBytes = await readBundle(p, oldManifest);
  const f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const period = {
    start_at: "2031-09-21T23:00:00.000Z",
    end_at: "2031-09-21T23:30:00.000Z",
  };
  const b = await booking(9, period);
  await moveAppointment(p, b.a.id, b.cmd);
  let a = (await readAppointment(p, b.a.id)).items[0];
  await recordContact(p, a.id, {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN agreed changed time; no sending",
  });
  let current = (await readPack(p, pack.pack.id)).items[0];
  await revisePack(p, current.id, {
    ...base(),
    expected_version: current.version,
    content: content(),
  });
  current = (await readPack(p, current.id)).items[0];
  await checkPack(p, current.id, {
    ...base(),
    expected_version: current.version,
    decision: "Checked",
  });
  current = (await readPack(p, current.id)).items[0];
  await requestIssue(p, current.id, {
    ...base(),
    expected_version: current.version,
  });
  current = (await readPack(p, current.id)).items[0];
  const rendered = await processRenderJob(current.jobs[0].id);
  assert("issue_id" in rendered);
  current = (await readPack(p, current.id)).items[0];
  const issue = current.issues.find(
    (x: { id: string }) => x.id === rendered.issue_id,
  )!;
  for (const profile of ["assigned-technician", "second-technician"]) {
    const actor = await principal(profile),
      recipient = current.readiness.recipients.find(
        (x: { user_id: string }) => x.user_id === actor.actor_id,
      )!;
    await acknowledgePack(actor, issue.id, {
      ...base(),
      assignment_id: recipient.assignment_id,
      assignment_version: recipient.assignment_version,
      presented_hash: issue.output_hash,
      captured_at: new Date().toISOString(),
    });
  }
  const impact = (await holds(p, a.id))[0];
  assert.equal(impact.held, true);
  const before = (await readFieldJob(technician, a.id)).items[0];
  await assert.rejects(
    startAttendance(technician, a.id, startInput(before)),
    code("StartBlocked"),
  );
  await resolveSchedulingPolicyImpact(
    p,
    impact.impact_id,
    resolution(await readPolicyImpact(p, impact.impact_id)),
  );
  assert.equal((await holds(p, a.id))[0].held, false);
  const ready = (await readFieldJob(technician, a.id)).items[0];
  assert.equal(ready.readiness.component_ready, true);
  await startAttendance(technician, a.id, startInput(ready));
  a = (await readAppointment(p, a.id)).items[0];
  assert.equal(a.status, "InProgress");
  assert.equal(a.dispatch_hold, false);
  assert.equal(a.pack_requirement, "Acknowledged");
  const started = (await readFieldJob(technician, a.id)).items[0];
  assert.equal(
    await transaction(async (c) =>
      currentCaptureState(
        c,
        technician,
        await attendanceContext(c, technician, a.id, started.attendance.id),
      ),
    ),
    "Current",
  );
  assert.deepEqual(await readBundle(p, oldManifest), oldBytes);
});
