import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createProject, saveTask } from "../../src/projects/service";
import { createEngineeringRequest } from "../../src/engineering/service";
import { projectInput, taskInput } from "../helpers/projects";
import { engineeringInput } from "../helpers/engineering";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  readCapacity,
  readChanges,
  readResourceWorkspace,
} from "../../src/scheduling/workspace-reads";
import {
  readAppointment,
  createChangeRequest,
  decideChangeRequest,
} from "../../src/scheduling/planner";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use ppo_synthetic_test only.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const p = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const period = {
  from: "2031-09-21T14:00:00Z",
  to: "2031-09-28T14:00:00Z",
  timezone: "Australia/Brisbane",
};
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN-PPO scheduling review proof",
});
test("PL-02 returns scoped eligibility, calendar, competence validity and anonymous busy evidence", async () => {
  const result = await readResourceWorkspace(await p(), id("a4"), period);
  assert.ok(result.sites.length);
  assert.ok(result.resource.calendar.intervals.length);
  assert.ok(
    result.resource.skills.every(
      (s: { valid_from: Date; valid_to: Date }) => s.valid_from && s.valid_to,
    ),
  );
  assert.ok(result.resource.busy.length);
  await assert.rejects(
    readResourceWorkspace(await p(), id("a4"), {
      ...period,
      site_id: id("70"),
    }),
    { code: "InvalidData" },
  );
  assert.ok(
    result.resource.busy.every(
      (b: Record<string, unknown>) =>
        Object.keys(b).sort().join(",") === "end_at,start_at",
    ),
  );
  assert.ok(
    result.appointments.every((a) =>
      a.assignments.some((x) => x.resource_id === id("a4") && x.active),
    ),
  );
});
test("resource and cross-domain reads refuse absent capability and hidden resource identities", async () => {
  await assert.rejects(readCapacity(await p("systems"), period), {
    code: "Forbidden",
  });
  await assert.rejects(
    readResourceWorkspace(await p("second-company"), id("a4"), period),
  );
  const observer = await readCapacity(await p("site-observer"), period);
  assert.ok(observer.items.every((i) => i.site_id === id("70")));
  assert.ok(
    observer.sources.some(
      (s) => s.domain === "Engineering" && s.state === "Unavailable",
    ),
  );
  assert.ok(!observer.items.some((i) => i.domain === "Engineering"));
});
test("capacity keeps source provenance, unknown effort and reservations separate, with no duplicate work order", async () => {
  const result = await readCapacity(await p(), period);
  assert.ok(result.items.some((i) => i.commitment === "Operational booking"));
  assert.equal(
    new Set(result.items.map((i) => i.key)).size,
    result.items.length,
  );
  assert.ok(
    result.items.every(
      (i) =>
        i.effort_minutes === null &&
        i.source_id &&
        i.source_version &&
        i.source_as_at &&
        i.href,
    ),
  );
  const a = (await readAppointment(await p(), id("a8"))).items[0];
  assert.ok(
    result.items
      .find((i) => i.key === "Appointment:" + a.id)
      ?.skills.includes("SYN-VISUAL"),
  );
  assert.ok(
    !result.items.some((i) => i.key === "WorkOrder:" + a.work_order_id),
  );
  const actor = await p(),
    project = projectInput();
  await createProject(actor, project);
  await saveTask(actor, project.id, {
    ...taskInput(),
    start_date: "2031-09-22",
    finish_date: "2031-09-26",
  });
  await createEngineeringRequest(actor, {
    ...engineeringInput(project.id),
    required_date: "2031-09-24",
    action_due: "2031-09-23",
  });
  const cross = await readCapacity(actor, period);
  assert.ok(cross.items.some((i) => i.domain === "Engineering"));
  assert.ok(cross.items.some((i) => i.domain === "Projects"));
  assert.ok(
    cross.items
      .filter((i) => i.domain !== "Service")
      .every(
        (i) =>
          i.effort_minutes === null &&
          i.reserved_minutes === null &&
          i.resource_ids.length === 0,
      ),
  );
});
test("read workspaces and scenarios cannot write source versions or operation receipts", async () => {
  const snapshot = async () =>
    (
      await database().query(
        "SELECT (SELECT sum(version) FROM ppo.appointments)::text AS appointments,(SELECT sum(version) FROM ppo.projects)::text AS projects,(SELECT sum(version) FROM ppo.engineering_packages)::text AS engineering,(SELECT count(*) FROM ppo.operation_receipts)::text AS receipts",
      )
    ).rows[0];
  const actor = await p(),
    original = await snapshot();
  await readCapacity(actor, period);
  await readChanges(actor, period);
  await readResourceWorkspace(actor, id("a4"), period);
  assert.deepEqual(await snapshot(), original);
  await assert.rejects(readCapacity(actor, { ...period, scenario: "apply" }), {
    code: "InvalidData",
  });
  await assert.rejects(
    readChanges(actor, { ...period, to: "2032-09-22T00:00:00Z" }),
    { code: "InvalidData" },
  );
});
test("change queue includes pending proposed-window requests and exact handover; acceptance retains history and fresh contact consequences", async () => {
  const actor = await p(),
    a = (await readAppointment(actor, id("a8"))).items[0],
    requestId = randomUUID();
  const input = {
    ...base(),
    id: requestId,
    expected_version: a.version,
    source_type: "ProjectReference",
    source_reference: "SYN-PPO-PROJECT-REVIEW",
    source_version: "1",
    start_at: "2031-09-24T00:00:00Z",
    end_at: "2031-09-24T02:00:00Z",
    crew: [1, 2].map((n, i) => ({
      resource_id: id("a4", n),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason: "SYN-PPO explicit same-site zero allowance",
    })),
  };
  await createChangeRequest(actor, a.id, input);
  const queued = await readChanges(actor, {
    ...period,
    from: "2031-09-24T00:00:00Z",
    to: "2031-09-24T04:00:00Z",
  });
  assert.ok(
    queued.items.some(
      (x) =>
        x.id === a.id &&
        x.requests.some((r) => r.id === requestId && r.status === "Pending"),
    ),
  );
  const focused = await readChanges(actor, { ...period, appointment_id: a.id });
  assert.equal(focused.items.length, 1);
  await assert.rejects(
    readChanges(actor, {
      ...period,
      appointment_id: a.id,
      resource_id: id("a4", 3),
    }),
  );
  const current = focused.items[0],
    decision = {
      ...base(),
      expected_version: current.version,
      expected_assignment_version: current.assignment_version,
      expected_work_order_version: current.work_order_version,
      scope_revision_id: current.scope_revision_id,
      scope_version: current.scope_version,
      policy_version_id: current.policy_version_id,
      scheduling_policy_id: current.policy.id,
      scheduling_policy_version: current.policy.version,
      expected_request_version: 1,
    };
  const receipt = await decideChangeRequest(
    actor,
    requestId,
    decision,
    "accept",
  );
  assert.deepEqual(
    (await decideChangeRequest(actor, requestId, decision, "accept")).receipt,
    receipt.receipt,
  );
  const changed = (
    await readChanges(actor, { ...period, appointment_id: a.id })
  ).items[0];
  assert.equal(changed.customer_commitment, "Changed");
  assert.equal(changed.dispatch_hold, true);
  assert.ok(changed.history.length > current.history.length);
  assert.equal(
    changed.requests.find((r) => r.id === requestId)?.status,
    "Accepted",
  );
  assert.ok(changed.followups.length > 0);
  await assert.rejects(
    decideChangeRequest(actor, requestId, { ...decision, ...base() }, "accept"),
  );
});
