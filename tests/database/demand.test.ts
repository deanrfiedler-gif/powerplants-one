import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { readUnassignedDemand } from "../../src/scheduling/demand";
import {
  cancelAppointment,
  readAppointment,
} from "../../src/scheduling/planner";
import {
  authoriseWorkOrder,
  proposeVisit,
  readWorkOrder,
} from "../../src/service/work-orders";
const id = (t: number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const site = id(70),
  owner = id(30),
  order = id(90);
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN PL-01 unassigned demand verification",
});
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
async function current(n = 1) {
  const w = (await readWorkOrder(await principal(), id(90, n))).items[0];
  return { w, r: w.scopes.find((s) => s.id === w.scope_revision_id)! };
}
// Authorise a seeded draft without proposing a visit. That is exactly the
// definition: an authorised work order with no live appointment.
async function authorise(n = 1) {
  const { w, r } = await current(n);
  await authoriseWorkOrder(await principal(), w.id, {
    ...base(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    policy_version_id: r.policy_version_id,
  });
  return w.id;
}
test("unassigned demand is authorised work with no live appointment; Draft and booked work are excluded", async () => {
  const p = await principal();
  // Every authorised work order in the seed already has an appointment, so the
  // stock fixture legitimately has no demand at all.
  assert.deepEqual((await readUnassignedDemand(p)).items, []);
  await authorise(1);
  const result = await readUnassignedDemand(p);
  assert.equal(result.completeness, "Complete");
  assert.equal(result.items.length, 1);
  const [demand] = result.items;
  assert.equal(demand.id, order);
  assert.equal(demand.projection, "UnassignedDemand");
  assert.equal(demand.site_id, site);
  assert.equal(demand.site_timezone, "Australia/Brisbane");
  assert.ok(demand.display_number.length > 0);
  assert.ok(demand.customer_name.length > 0);
  assert.ok(demand.site_name.length > 0);
  // The authorised scope revision is named, so the planner can tell the work apart.
  assert.ok(demand.authorised_scope_summary.length > 0);
  assert.ok(demand.authorised_scope_revision > 0);
  assert.ok(demand.authorised_scope_version > 0);
  // A Draft work order is not demand: it carries no authorised scope.
  const drafts = await rows(
    "SELECT id FROM ppo.work_orders WHERE status='Draft' ORDER BY id",
  );
  assert.ok(drafts.length > 0);
  for (const d of drafts)
    assert.ok(!result.items.some((x) => x.id === d.id), `Draft ${d.id} leaked`);
  // An authorised work order with a live appointment is not demand. A
  // Cancelled appointment is not a live one and does not disqualify.
  const booked = await rows(
    "SELECT DISTINCT w.id FROM ppo.work_orders w JOIN ppo.appointments a ON (a.workspace_id,a.work_order_id)=(w.workspace_id,w.id) WHERE w.status='Authorised' AND a.status<>'Cancelled' ORDER BY 1",
  );
  assert.ok(booked.length > 0);
  for (const b of booked)
    assert.ok(
      !result.items.some((x) => x.id === b.id),
      `Booked ${b.id} leaked`,
    );
});
test("proposing a visit removes a work order from unassigned demand", async () => {
  const p = await principal();
  await authorise(1);
  assert.equal((await readUnassignedDemand(p)).items.length, 1);
  const { w, r } = await current(1);
  await proposeVisit(p, w.id, {
    ...base(),
    id: randomUUID(),
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: "2026-09-25T00:00:00Z",
    end_at: "2026-09-25T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  // A Proposed appointment is a live visit, so the work order is no longer
  // unscheduled. The row count below is what the cancellation test then acts on.
  assert.deepEqual((await readUnassignedDemand(p)).items, []);
  assert.equal(
    (
      await rows("SELECT count(*)::int n FROM ppo.appointments WHERE work_order_id=$1", [w.id])
    )[0].n,
    1,
  );
});
// A cancelled visit returns the work order to demand. ppo.appointments has no
// delete path: immutable_evidence() refuses DELETE, and cancellation sets
// status='Cancelled' rather than removing the row. The disqualifying test is
// therefore a live appointment. Row existence would hide this work forever,
// and it is the case a planner most needs to see.
test("a work order whose only appointment was cancelled is unassigned demand again", async () => {
  const p = await principal();
  await authorise(1);
  const appointment_id = randomUUID();
  const { w, r } = await current(1);
  await proposeVisit(p, w.id, {
    ...base(),
    id: appointment_id,
    expected_version: w.version,
    scope_revision_id: r.id,
    scope_version: r.version,
    start_at: "2026-09-25T00:00:00Z",
    end_at: "2026-09-25T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  assert.deepEqual((await readUnassignedDemand(p)).items, []);
  const a = (await readAppointment(p, appointment_id)).items[0];
  await cancelAppointment(p, appointment_id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  // The row survives and is Cancelled: the evidence is intact, not deleted.
  assert.deepEqual(
    await rows(
      "SELECT status FROM ppo.appointments WHERE work_order_id=$1 ORDER BY status",
      [w.id],
    ),
    [{ status: "Cancelled" }],
  );
  // The work order is unscheduled again, so it is demand again.
  const back = await readUnassignedDemand(p);
  assert.equal(back.completeness, "Complete");
  assert.equal(back.items.length, 1);
  assert.equal(back.items[0].id, order);
  assert.equal(back.items[0].projection, "UnassignedDemand");
  // A second live visit takes it back out, so cancellation is not a one-way door.
  const again = await current(1);
  await proposeVisit(p, again.w.id, {
    ...base(),
    id: randomUUID(),
    expected_version: again.w.version,
    scope_revision_id: again.r.id,
    scope_version: again.r.version,
    start_at: "2026-09-26T00:00:00Z",
    end_at: "2026-09-26T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  assert.deepEqual((await readUnassignedDemand(p)).items, []);
});
test("unassigned demand refuses without schedule.read and never crosses a scope boundary", async () => {
  const p = await principal();
  await authorise(1);
  assert.equal((await readUnassignedDemand(p)).items.length, 1);
  // No schedule.read at all: refused before any row is read.
  for (const profile of ["technician", "systems", "crm-receiver", "finance"])
    await assert.rejects(
      readUnassignedDemand(await principal(profile)),
      code("Forbidden"),
    );
  // schedule.read scoped to the site still reads the work it may see.
  assert.equal(
    (await readUnassignedDemand(await principal("site-observer"))).items.length,
    1,
  );
  // schedule.read over another company reads no rows from this one. A scope
  // boundary is silence, not an error.
  for (const profile of ["second-company", "other-workspace"]) {
    const other = await principal(profile);
    assert.deepEqual((await readUnassignedDemand(other)).items, []);
    // Naming a site outside scope refuses exactly as a site that does not exist.
    for (const named of [site, randomUUID()])
      await assert.rejects(
        readUnassignedDemand(other, { site_id: named }),
        code("RecordUnavailable"),
      );
  }
  // The same site filter inside scope returns the work order.
  assert.equal((await readUnassignedDemand(p, { site_id: site })).items.length, 1);
  // Withdrawing schedule.read refuses the next read; nothing is cached.
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.read'",
    [owner],
  );
  await assert.rejects(readUnassignedDemand(p), code("Forbidden"));
});
test("unassigned demand bounds its own result and refuses an unusable query", async () => {
  const p = await principal();
  await authorise(1);
  const limited = await readUnassignedDemand(p, { limit: "1" });
  assert.equal(limited.limit, 1);
  assert.equal(limited.items.length, 1);
  assert.equal(limited.completeness, "Complete");
  // A second authorised order makes the same bound truncate. A truncated list
  // reports Partial rather than claiming to be the complete permitted result.
  await authorise(9);
  assert.equal((await readUnassignedDemand(p)).items.length, 2);
  const truncated = await readUnassignedDemand(p, { limit: 1 });
  assert.equal(truncated.items.length, 1);
  assert.equal(truncated.completeness, "Partial");
  for (const bad of [{ limit: 0 }, { limit: 201 }, { site_id: "nope" }, { from: "x" }])
    await assert.rejects(readUnassignedDemand(p, bad), code("InvalidData"));
});
