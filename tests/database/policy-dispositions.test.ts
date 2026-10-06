import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { publishSchedulingPolicy } from "../../src/scheduling/policy-commands";
import {
  readPolicyImpact,
  resolveSchedulingPolicyImpact,
} from "../../src/scheduling/policy-resolution";
import {
  cancelAppointment,
  confirmAppointment,
  moveAppointment,
  readAppointment,
  recordContact,
} from "../../src/scheduling/planner";
import {
  proposeVisit,
  assessWorkReadiness,
  readWorkOrder,
} from "../../src/service/work-orders";
import { confirmed, id, issued } from "../helpers/packs";
import { readBundle } from "../../src/documents/worker";
import {
  base,
  principal,
  reviewed,
  rows,
  setupPolicy,
  populationBooking,
} from "../helpers/policy-commands";
import { serialised } from "../helpers/policy-concurrency";

beforeEach(setupPolicy);
after(closeDatabase);
const crew = () =>
  [id("a4", 9), id("a4", 2)].map((resource_id, index) => ({
    resource_id,
    resource_version: 1,
    calendar_version: 1,
    crew_role: index ? "Technician" : "Lead",
    travel_before_minutes: 0,
    travel_after_minutes: 0,
    travel_reason: "SYN explicit zero travel",
  }));
const period = {
  start_at: "2031-09-21T23:00:00.000Z",
  end_at: "2031-09-21T23:30:00.000Z",
};
const command = (
  a: Awaited<ReturnType<typeof readAppointment>>["items"][number],
) => ({
  ...base(),
  expected_version: a.version,
  expected_work_order_version: a.work_order_version,
  expected_assignment_version: a.assignment_version,
  scope_revision_id: a.scope_revision_id,
  scope_version: a.scope_version,
  policy_version_id: a.policy_version_id,
  scheduling_policy_id: id("a0"),
  scheduling_policy_version: 1,
  scheduling_policy_hash:
    "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
  publication_head_version: 2,
  selected_policy: {
    id: "a0000000-0000-4000-8000-000000000001",
    version: 1,
    content_hash:
      "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
  },
  crew: crew(),
});
const resolution = (
  read: Awaited<ReturnType<typeof readPolicyImpact>>,
  outcome: string,
) => ({
  ...base(),
  impact_hash: read.impact.content_hash,
  expected_appointment_version: read.appointment.version,
  expected_resolution: read.expected_resolution,
  dependency_fingerprint: read.dependency_fingerprint,
  outcome,
  replacement: read.replacement,
});
async function impactFor(appointment: string) {
  return (
    await rows(
      "SELECT id FROM ppo.scheduling_policy_impacts WHERE appointment_id=$1 ORDER BY id",
      [appointment],
    )
  )[0].id as string;
}

test("C26 complete 200 population actually publishes 200 immutable impacts and owned typed Activities", async () => {
  for (let i = 1; i < 200; i++) await populationBooking(i);
  const f = await reviewed();
  assert.equal(f.review.candidates.length, 200);
  const result = await publishSchedulingPolicy(f.publisher, f.publish);
  assert.equal(result.receipt.state, "Published");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.scheduling_policy_impacts"))[0]
      .n,
    200,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_impact_activities",
      )
    )[0].n,
    200,
  );
  assert.equal(
    (await rows("SELECT version FROM ppo.scheduling_policy_heads"))[0].version,
    2,
  );
});

test("C26 controlled pin-retaining move resolves only after complete applicable evaluation; changed-contact owned plan remains held", async () => {
  const pack = await issued(),
    owner = await principal();
  const a = (await readAppointment(owner, pack.pack.appointment_id)).items[0];
  const manifest = pack.pack.issues[0].manifest,
    bytes = await readBundle(owner, manifest);
  const f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const impact = await impactFor(a.id);
  await moveAppointment(owner, a.id, { ...command(a), ...period });
  const moved = (await readAppointment(owner, a.id)).items[0];
  assert.equal(moved.scheduling_policy_id, id("a0"));
  assert.equal(moved.dispatch_hold, true);
  const read = await readPolicyImpact(owner, impact);
  assert.equal(
    read.evaluation.current.candidate.evaluation.outcome,
    "Compliant",
    JSON.stringify(read.evaluation.current.candidate.evaluation),
  );
  assert.equal(read.evaluation.current.selected_policy?.id, id("a0"));
  const input = resolution(read, "VerifiedNoConflict");
  const result = await resolveSchedulingPolicyImpact(owner, impact, input);
  assert.equal(result.receipt.state, "VerifiedNoConflict");
  assert.deepEqual(await readBundle(owner, manifest), bytes);
  assert.equal((await readPolicyImpact(owner, impact)).disposition, "Current");
  assert.deepEqual(
    (await resolveSchedulingPolicyImpact(owner, impact, input)).receipt,
    result.receipt,
  );
});

test("C26 replacement requires controlled cancelled original and exact confirmed compliant same-order applicable pin", async () => {
  const a = await confirmed(),
    owner = await principal(),
    f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const impact = await impactFor(a.id);
  await cancelAppointment(owner, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  const w = (await readWorkOrder(owner, a.work_order_id)).items[0],
    replacement = randomUUID();
  await proposeVisit(owner, w.id, {
    ...base(),
    id: replacement,
    expected_version: w.version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    ...period,
    requested_window_start: null,
    requested_window_end: null,
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let next = (await readAppointment(owner, replacement)).items[0];
  await assessWorkReadiness(owner, w.id, {
    ...base(),
    expected_version: next.work_order_version,
    assessment: {
      scope_revision_id: a.scope_revision_id,
      scope_version: a.scope_version,
      appointment_id: replacement,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN replacement preparation",
      evidence: {
        title: "SYN checked preparation",
        content_text: "SYN bounded replacement inspection",
        source_reference: "SYN-C26",
        source_version: "1",
      },
      source_as_at: "2026-09-05T00:00:00Z",
      valid_until: "2032-01-02T00:00:00Z",
    },
  });
  next = (await readAppointment(owner, replacement)).items[0];
  await recordContact(owner, replacement, {
    ...base(),
    id: randomUUID(),
    expected_version: next.version,
    recipient_id: id("60"),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN agreed replacement time; no message",
  });
  next = (await readAppointment(owner, replacement)).items[0];
  await confirmAppointment(owner, replacement, command(next));
  const read = await readPolicyImpact(owner, impact, replacement);
  assert.equal(
    read.evaluation.replacement?.candidate.evaluation.outcome,
    "Compliant",
  );
  const input = resolution(read, "Replaced");
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact, {
      ...input,
      replacement: { ...input.replacement, content_hash: "0".repeat(64) },
    }),
  );
  assert.equal(
    (await resolveSchedulingPolicyImpact(owner, impact, input)).receipt.state,
    "Replaced",
  );
  assert.equal((await readPolicyImpact(owner, impact)).disposition, "Current");
});

test("C26 publication versus resolution shares graph lock and refuses a disposition bound to the earlier head", async () => {
  const a = await confirmed(),
    owner = await principal(),
    f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const impact = await impactFor(a.id);
  await cancelAppointment(owner, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  const read = await readPolicyImpact(owner, impact),
    next = await reviewed(90, "2031-09-22T00:30:00.000Z");
  const [publication, disposition] = await serialised(
    () => publishSchedulingPolicy(next.publisher, next.publish),
    () =>
      resolveSchedulingPolicyImpact(
        owner,
        impact,
        resolution(read, "Cancelled"),
      ),
  );
  assert.equal(publication.status, "fulfilled");
  assert.equal(disposition.status, "rejected");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_resolutions",
      )
    )[0].n,
    0,
  );
  const current = await readPolicyImpact(owner, impact);
  assert.equal(
    (
      await resolveSchedulingPolicyImpact(
        owner,
        impact,
        resolution(current, "Cancelled"),
      )
    ).receipt.state,
    "Cancelled",
  );
});

test("C26 resolution winning graph lock commits exact evidence before later publication makes it stale", async () => {
  const a = await confirmed(),
    owner = await principal(),
    f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const impact = await impactFor(a.id);
  await cancelAppointment(owner, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  const read = await readPolicyImpact(owner, impact),
    next = await reviewed(90, "2031-09-22T00:30:00.000Z");
  const original = resolution(read, "Cancelled");
  const [disposition, publication] = await serialised(
    () => resolveSchedulingPolicyImpact(owner, impact, original),
    () => publishSchedulingPolicy(next.publisher, next.publish),
    false,
    "resolution",
  );
  assert.equal(publication.status, "fulfilled");
  assert.equal(disposition.status, "fulfilled");
  assert.equal((await readPolicyImpact(owner, impact)).disposition, "Stale");
  if (disposition.status === "fulfilled")
    assert.deepEqual(
      (await resolveSchedulingPolicyImpact(owner, impact, original)).receipt,
      disposition.value.receipt,
    );
});
