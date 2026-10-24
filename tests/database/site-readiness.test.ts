import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  recordContact,
  readAppointment,
  moveAppointment,
} from "../../src/scheduling/planner";
import { prepareBookingPolicy } from "../../src/scheduling/booking-policy";
import { appointmentPreparation } from "../../src/scheduling/site-readiness";
import { runPreparationDeadlines } from "../../src/scheduling/preparation-worker";
import { siteChecks } from "../../src/scheduling/site-readiness-model";
import { readOperation } from "../../src/shared/receipts";
import { assessWorkReadiness } from "../../src/service/work-orders";
import { readActivity } from "../../src/activities/activities";
import { gateEvidence } from "../helpers/readiness-gate";
import { preparedGateVisit } from "../helpers/readiness-gate";
import { principal, base, id, rows } from "../helpers/packs";
import {
  addDays,
  localDateTime,
  utcFromLocal,
} from "../../src/scheduling/time";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (value: string) => (error: unknown) =>
  (error as { code: string }).code === value;
const checks = () =>
  siteChecks(
    Object.fromEntries(
      ["access", "power_water", "equipment", "isolation"].map((key) => [
        key,
        { status: "Confirmed" },
      ]),
    ),
  );
function nextWorkingVisit() {
  let day = addDays(
    localDateTime(new Date().toISOString(), "Australia/Brisbane").slice(0, 10),
    1,
  );
  while ([0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay()))
    day = addDays(day, 1);
  return utcFromLocal(`${day}T10:00`, "Australia/Brisbane");
}
async function command(aid: string) {
  const a = (
    await rows("SELECT * FROM ppo.appointments WHERE id=$1", [aid])
  )[0];
  return {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: id("60"),
    purpose: "SiteReadiness",
    site_checks: checks(),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
  };
}

test("P4 persists typed current-schedule evidence, recovers one original, refuses readers and isolates companies", async () => {
  const f = await preparedGateVisit(nextWorkingVisit());
  const before = (await readAppointment(f.co, f.aid)).items[0];
  assert.equal(
    before.policy_version_id,
    "94000000-0000-4000-8000-000000000003",
  );
  assert.equal(before.preparation?.outcome, "Unknown");
  await assert.rejects(
    database().query(
      "UPDATE ppo.appointments SET dispatch_hold=false,version=version+1 WHERE id=$1",
      [f.aid],
    ),
    /Current customer site readiness/,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.appointments SET dispatch_hold=false,actual_start_at=clock_timestamp(),version=version+1 WHERE id=$1",
      [f.aid],
    ),
    /Current customer site readiness/,
  );
  const w = (
    await rows("SELECT version FROM ppo.work_orders WHERE id=$1", [f.wid])
  )[0];
  await assert.rejects(
    assessWorkReadiness(f.co, f.wid, {
      ...base(),
      expected_version: w.version,
      assessment: {
        scope_revision_id: f.scope.id,
        scope_version: f.scope.version,
        appointment_id: f.aid,
        criterion_code: "CustomerSiteReadiness",
        outcome: "Pass",
        reason: "SYN attempted manual override",
        evidence: gateEvidence,
        source_as_at: new Date().toISOString(),
      },
    }),
    code("InvalidData"),
  );
  const cmd = await command(f.aid);
  const results = await Promise.all([
    recordContact(f.co, f.aid, cmd),
    recordContact(f.co, f.aid, cmd),
  ]);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(
    await readOperation(f.co, cmd.operation_id),
    results[0].receipt,
  );
  assert.equal(
    (await rows("SELECT 1 FROM ppo.contact_outcomes WHERE id=$1", [cmd.id]))
      .length,
    1,
  );
  const after = (await readAppointment(f.co, f.aid)).items[0];
  assert.equal(after.preparation?.outcome, "Pass");
  assert.equal(after.customer_commitment, before.customer_commitment);
  assert.equal(after.schedule_version, before.schedule_version);
  assert.equal(after.version, before.version + 1);
  assert.equal(after.preparation?.issue_deadline_blocks_dispatch, false);
  assert.ok(after.preparation?.issue_due_at);
  await assert.rejects(
    recordContact(f.co, f.aid, { ...cmd, reason: "Changed payload" }),
    code("OperationConflict"),
  );
  const tech = await principal("assigned-technician");
  await assert.rejects(
    recordContact(tech, f.aid, await command(f.aid)),
    code("Forbidden"),
  );
  await assert.rejects(
    recordContact(
      await principal("second-company"),
      f.aid,
      await command(f.aid),
    ),
    code("RecordUnavailable"),
  );
  const bad = await command(f.aid);
  bad.site_checks.isolation.status = "NotReady";
  await recordContact(f.co, f.aid, bad);
  const blocked = (await readAppointment(f.co, f.aid)).items[0];
  assert.equal(blocked.preparation?.outcome, "Blocked");
  assert.equal(blocked.customer_commitment, before.customer_commitment);
  assert.ok(
    blocked.contacts.find((c: { id: string }) => c.id === bad.id)?.activity_id,
  );
  assert.equal(
    (
      await rows(
        "SELECT ppo.customer_site_outcome(a) AS outcome FROM ppo.appointments a WHERE id=$1",
        [f.aid],
      )
    )[0].outcome,
    "Blocked",
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.contact_outcomes SET site_checks=$2 WHERE id=$1",
      [cmd.id, checks()],
    ),
    code("55000"),
  );
  const a = (await readAppointment(f.co, f.aid)).items[0];
  const interval = {start_at:new Date(a.start_at.getTime()+3600000).toISOString(),end_at:new Date(a.end_at.getTime()+3600000).toISOString()};
  const selection=await prepareBookingPolicy(f.co,f.aid,interval);
  await moveAppointment(f.co, f.aid, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: selection.policy.id,
    scheduling_policy_version: selection.policy.version,
    scheduling_policy_hash: selection.policy.content_hash,
    publication_head_version: selection.family_head_version,
    selected_policy: selection.selected_policy,
    ...interval,
    crew: [9, 2].map((n, i) => ({
      resource_id: id("a4", n),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "SYN same-site visit move",
    })),
  });
  const moved = (await readAppointment(f.co, f.aid)).items[0];
  assert.equal(moved.schedule_version, a.schedule_version + 1);
  assert.equal(moved.preparation?.outcome, "Unknown");
  assert.deepEqual(
    (await recordContact(f.co, f.aid, cmd)).receipt,
    results[0].receipt,
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.contact'",
    [f.co.actor_id],
  );
  await assert.rejects(recordContact(f.co, f.aid, cmd), code("Forbidden"));
});

test("P4 early confirmations remain unknown and future deadlines produce no task", async () => {
  const f = await preparedGateVisit("2031-12-05T00:00:00Z");
  const cmd = await command(f.aid);
  await recordContact(f.co, f.aid, cmd);
  assert.equal(
    (await appointmentPreparation(database(), f.co.workspace_id, f.aid))
      ?.outcome,
    "Unknown",
  );
  assert.equal((await runPreparationDeadlines()).created, 0);
});

test("deadline worker retries create exactly one owned task per missed deadline", async (t) => {
  // A service-created visit near now exercises the published boundaries without
  // changing issued bytes, weakening the window, or rewriting repository fixture dates.
  const near = await preparedGateVisit(nextWorkingVisit());
  t.diagnostic("Fixture ready; running concurrent deadline workers");
  const view = await appointmentPreparation(
    database(),
    near.co.workspace_id,
    near.aid,
  );
  assert.ok(view?.issue_due_at);
  const issueDue = view.issue_due_at;
  const clock = async () =>
    new Date(
      Math.max(Date.parse(issueDue), Date.parse(view.confirmation_due_at)) + 1,
    );
  const [one, two] = await Promise.all([
    runPreparationDeadlines(clock),
    runPreparationDeadlines(clock),
  ]);
  const mappings = await rows(
    "SELECT f.*,a.owner_id AS actual_owner,a.due_at AS actual_due,a.due_needed FROM ppo.preparation_deadline_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id WHERE f.appointment_id=$1",
    [near.aid],
  );
  assert.equal(one.created + two.created, mappings.length);
  assert.equal((await runPreparationDeadlines(clock)).created, 0);
  assert.equal(mappings.length, 2); // Same preparer and service owner: one task per deadline kind.
  for (const m of mappings) {
    assert.equal(m.actual_owner, m.owner_id);
    assert.equal(m.actual_due.toISOString(), m.due_at.toISOString());
    assert.equal(m.due_needed, false);
    assert.equal(
      (await readActivity(near.co, m.activity_id)).id,
      m.activity_id,
    );
  }
  assert.ok(mappings.some((m) => m.kind === "PackIssueDue"));
  assert.ok(mappings.some((m) => m.kind === "SiteReadinessDue"));
  assert.equal(
    (
      await rows(
        "SELECT customer_commitment FROM ppo.appointments WHERE id=$1",
        [near.aid],
      )
    )[0].customer_commitment,
    "Confirmed",
  );
});
