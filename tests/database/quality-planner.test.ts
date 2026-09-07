import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { listResources, readAppointment, readSchedule } from "../../src/scheduling/planner";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const period = {
  from: "2026-09-20T14:00:00Z",
  to: "2026-09-27T14:00:00Z",
  timezone: "Australia/Brisbane",
};
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const denied = (e: unknown) =>
  ["Forbidden", "RecordUnavailable"].includes((e as { code: string }).code);

test("P11 planner summaries retain exact permitted card and booking facts without detail narratives", async () => {
  for (const profile of [
    "coordinator",
    "site-observer",
    "assigned-technician",
  ]) {
    const p = await principal(profile),
      schedule = await readSchedule(p, period);
    assert.ok(schedule.items.length, profile);
    const candidates = (
      await database().query(
        "SELECT id FROM ppo.appointments WHERE workspace_id=$1 AND start_at<$3 AND end_at>$2 ORDER BY start_at,id",
        [p.workspace_id, period.from, period.to],
      )
    ).rows;
    const individuallyVisible: string[] = [];
    for (const row of candidates) {
      try {
        await readAppointment(p, row.id);
        individuallyVisible.push(row.id);
      } catch (error) {
        assert.ok(denied(error), `Unexpected detail failure: ${String(error)}`);
      }
    }
    assert.deepEqual(
      schedule.items.map((a) => a.id),
      individuallyVisible,
      `${profile}: no silently missing or extra cards`,
    );
    const individualResources = (await listResources(p)).items;
    assert.deepEqual(schedule.resources.map((r) => r.id), individualResources.map((r) => r.id));
    for (const lane of schedule.resources) {
      const { blocks, exceptions, busy, ...facts } = lane;
      assert.deepEqual(facts, individualResources.find((r) => r.id === lane.id));
      assert.deepEqual(blocks, (await database().query(
        "SELECT id,version,start_at,end_at,kind,source_as_at FROM ppo.availability_blocks WHERE workspace_id=$1 AND resource_id=$2 AND active AND start_at<$4 AND end_at>$3 ORDER BY start_at",
        [p.workspace_id, lane.id, period.from, period.to],
      )).rows);
      assert.deepEqual(exceptions, (await database().query(
        "SELECT id,start_at,end_at,kind,reason FROM ppo.calendar_exceptions WHERE workspace_id=$1 AND calendar_id=$2 AND start_at<$4 AND end_at>$3 ORDER BY start_at",
        [p.workspace_id, lane.calendar_id, period.from, period.to],
      )).rows);
      assert.deepEqual(busy, (await database().query(
        "SELECT start_at,end_at FROM ppo.resource_reservations WHERE workspace_id=$1 AND resource_id=$2 AND active AND start_at<$4 AND end_at>$3 ORDER BY start_at",
        [p.workspace_id, lane.id, period.from, period.to],
      )).rows);
    }
    for (const item of schedule.items) {
      const detail = (await readAppointment(p, item.id)).items[0];
      const { projection, requests, ...facts } = item;
      assert.equal(projection, "ScheduleSummary");
      for (const [key, value] of Object.entries(facts))
        assert.deepEqual(
          value,
          (detail as Record<string, unknown>)[key],
          `${profile}:${item.id}:${key}`,
        );
      assert.deepEqual(
        requests,
        detail.requests.map((r) => ({ id: r.id, status: r.status })),
      );
      for (const omitted of [
        "readiness",
        "authorisation_blockers",
        "contacts",
        "followups",
        "proposal",
        "history",
      ])
        assert.equal(Object.hasOwn(item, omitted), false, omitted);
    }
  }
});

test("P11 planner summaries re-evaluate current grants and retain wrong-workspace/company/filter denial", async () => {
  const p = await principal("site-observer"),
    before = await readSchedule(p, period);
  assert.ok(before.items.length);
  const other = await principal("second-company");
  assert.equal((await readSchedule(other, period)).items.length, 0);
  await assert.rejects(
    readSchedule(other, { ...period, site_id: before.items[0].site_id }),
    denied,
  );
  await assert.rejects(
    readSchedule(await principal("systems"), period),
    denied,
  );
  const wrongWorkspace = {
    ...p,
    workspace_id: "10000000-0000-4000-8000-000000000002",
  };
  await assert.rejects(readSchedule(wrongWorkspace, period), denied);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.read'",
    [p.workspace_id, p.actor_id],
  );
  const after = await readSchedule(p, period);
  assert.equal(after.items.length, 0);
  assert.equal(after.resources.length, 0);
  await assert.rejects(readAppointment(p, before.items[0].id), denied);
  assert.ok(!JSON.stringify(after).includes(before.items[0].scope_summary));
});
