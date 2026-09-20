import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import {
  activityCommand,
  activityHistory,
  createActivity,
  readActivity,
} from "../../src/activities/activities";
import { listWork, readWorkOverview, readWorkNavigation } from "../../src/activities/work-overview";
import { readWorkViews, saveWorkViews } from "../../src/activities/work-views";
import { defaultCriteria } from "../../src/activities/work-criteria";
import { endOfLocalDay, localDay } from "../../src/activities/work-view";
import { createOpportunity, planOpportunityAction } from "../../src/crm/opportunities";
import { readOpportunity } from "../../src/crm/reads";
import { listOverdueOpportunities, listPlanningGaps } from "../../src/crm/planning-gaps";
import { CRM, crmAction, crmBase, crmDiscovery } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const code = (value: string) => (e: unknown) => (e as { code: string }).code === value;
const field = (name: string) => (e: unknown) =>
  !!(e as { field_errors?: { field: string }[] }).field_errors?.some((f) => f.field === name);
const rows = async (q: string, v: unknown[] = []) => (await database().query(q, v)).rows;
const at = (minutes: number) => new Date(Math.round((Date.now() + minutes * 60000) / 1000) * 1000).toISOString();
const activity = <T extends Record<string, unknown>>(fields: T = {} as T) => ({
  ...crmBase(),
  id: randomUUID() as string,
  company_id: CRM.company,
  site_id: CRM.site,
  kind: "CustomerContact",
  owner_id: CRM.owner,
  summary: "SYN My Work contract activity",
  due_at: null as string | null,
  due_needed: true,
  access_class: "RestrictedService",
  links: [{ object_type: "Site", object_id: CRM.site }],
  ...fields,
});
// The seed's own activities belong to the coordinator; My Work counts start from them.
const baseline = async () => (await readWorkOverview(await principal())).counts;

test("MW-DB01 an activity keeps one overdue instant: a deadline, the end of a local day, or an appointment's planned end", async () => {
  const p = await principal();
  const day = localDay(at(0));
  const appointment = activity({ activity_type: "Meeting", due_needed: false, starts_at: at(60), due_at: at(105) }),
    dateOnly = activity({ activity_type: "Task", due_needed: false, due_at: endOfLocalDay(day), due_date_only: true }),
    legacy = activity({ due_needed: false, due_at: at(30) });
  for (const a of [appointment, dateOnly, legacy]) await createActivity(p, a);
  assert.deepEqual(
    await Promise.all([appointment, dateOnly, legacy].map(async (a) => {
      const r = await readActivity(p, a.id);
      return [r.activity_type, r.starts_at, r.due_at, r.due_date_only];
    })),
    [
      ["Meeting", appointment.starts_at, appointment.due_at, false],
      ["Task", null, dateOnly.due_at, true],
      // A payload written before 0028 stores exactly what it always stored.
      ["Task", null, legacy.due_at, false],
    ],
  );
  await assert.rejects(createActivity(p, activity({ due_needed: false, starts_at: at(60), due_at: at(60) })), field("starts_at"));
  await assert.rejects(createActivity(p, activity({ due_needed: false, starts_at: at(0), due_at: at(25 * 60) })), field("starts_at"));
  await assert.rejects(createActivity(p, activity({ due_needed: true, due_at: null, starts_at: at(60) })), field("starts_at"));
  await assert.rejects(createActivity(p, activity({ due_needed: false, due_at: at(45), due_date_only: true })), field("due_at"));
  await assert.rejects(createActivity(p, activity({ due_needed: false, starts_at: at(60), due_at: endOfLocalDay(day), due_date_only: true })), field("due_date_only"));
  await assert.rejects(createActivity(p, activity({ activity_type: "Lunch" })), field("activity_type"));
  // The database refuses what the service refuses, so no other writer can store an incoherent schedule.
  await assert.rejects(rows("UPDATE ppo.activities SET starts_at=due_at WHERE id=$1", [appointment.id]), code("23514"));
  await assert.rejects(rows("UPDATE ppo.activities SET due_date_only=true WHERE id=$1", [appointment.id]), code("23514"));
});

test("MW-DB02 an update written before 0028 leaves a coherent record and never guesses an appointment's end", async () => {
  const p = await principal();
  const a = activity({ activity_type: "Call", due_needed: false, starts_at: at(120), due_at: at(150) });
  await createActivity(p, a);
  const legacy = (fields: Record<string, unknown>, expected_version: number) =>
    activityCommand(p, a.id, { ...crmBase(), expected_version, owner_id: CRM.owner, summary: a.summary, ...fields }, "update");
  // A new planned end before the stored start is refused, with the entries kept by the caller.
  await assert.rejects(legacy({ due_at: at(90), due_needed: false }, 1), field("due_at"));
  const later = at(165);
  await legacy({ due_at: later, due_needed: false }, 1);
  const moved = await readActivity(p, a.id);
  assert.deepEqual([moved.starts_at, moved.due_at, moved.activity_type], [a.starts_at, later, "Call"]);
  // Removing the date removes the appointment with it; the type stays.
  await legacy({ due_at: null, due_needed: true }, 2);
  const undated = await readActivity(p, a.id);
  assert.deepEqual([undated.starts_at, undated.due_at, undated.due_needed, undated.activity_type], [null, null, true, "Call"]);
  const history = await activityHistory(p, a.id);
  assert.deepEqual(history.items.map((e) => e.command), ["UpdateActivity", "UpdateActivity", "CreateActivity"]);
  assert.equal(history.items[0].before?.starts_at !== undefined, true);
  assert.equal(history.items[0].reason, crmBase().reason);
  // History follows the activity's own visibility.
  await assert.rejects(activityHistory(await principal("other-workspace"), a.id), (e: unknown) => [403, 404].includes((e as { status: number }).status));
});

test("MW-DB03 the four counts cover the whole scope; an appointment is due today until its planned end, not its start", async () => {
  const p = await principal(),
    before = await baseline();
  const day = localDay(at(0));
  const started = activity({ summary: "SYN started meeting", activity_type: "Meeting", due_needed: false, starts_at: at(-10), due_at: at(10) }),
    ended = activity({ summary: "SYN ended meeting", activity_type: "Meeting", due_needed: false, starts_at: at(-90), due_at: at(-45) }),
    yesterday = activity({ summary: "SYN date-only yesterday", due_needed: false, due_at: new Date(Date.parse(endOfLocalDay(day)) - 86400000).toISOString(), due_date_only: true }),
    today = activity({ summary: "SYN date-only today", due_needed: false, due_at: endOfLocalDay(day), due_date_only: true }),
    tomorrow = activity({ summary: "SYN tomorrow", due_needed: false, due_at: new Date(Date.parse(endOfLocalDay(day)) + 3600000).toISOString() }),
    undated = activity({ summary: "SYN undated" });
  for (const a of [started, ended, yesterday, today, tomorrow, undated]) await createActivity(p, a);
  const o = await readWorkOverview(p, { limit: "1" });
  assert.deepEqual(o.counts, { overdue: before.overdue + 2, due_today: before.due_today + 2, date_needed: before.date_needed + 1 });
  // The preview is bounded; the total is not the preview's length.
  assert.equal(o.activities.items.length, 1);
  assert.equal(o.activities.total, o.counts.overdue + o.counts.due_today);
  assert.equal(o.activities.completeness, "BoundedWindow");
  const all = await readWorkOverview(p, { limit: "25" });
  const group = (id: string) => all.activities.items.find((r) => r.id === id)?.group;
  assert.deepEqual([started, ended, yesterday, today].map((a) => group(a.id)), ["Today", "Overdue", "Overdue", "Today"]);
  assert.equal(group(tomorrow.id), undefined);
  // Overdue first, then due-time order; a schedule entry repeats an activity and adds no count.
  assert.deepEqual(all.activities.items.map((r) => r.group === "Overdue"), all.activities.items.map((r) => r.group === "Overdue").toSorted((x, y) => Number(y) - Number(x)));
  // Today's schedule holds appointments that touch the local day, so one that ended before
  // midnight is rightly absent when this runs in the first hour and a half of a day.
  assert.deepEqual(
    all.schedule.items.map((r) => r.id).filter((id) => [started.id, ended.id].includes(id)),
    [ended, started].filter((a) => localDay(a.due_at) >= day && localDay(a.starts_at) <= day).map((a) => a.id),
  );
  const typed = await readWorkOverview(p, { activity_type: "Meeting", limit: "25" });
  assert.deepEqual(typed.counts, all.counts, "the list's type filter never changes the attention counts");
  assert.deepEqual(typed.activities.items.map((r) => r.id).toSorted(), [started.id, ended.id].toSorted());
  const list = await listWork(p, { due: "Today", limit: "1" });
  assert.equal(list.total, all.counts.due_today);
  const next = await listWork(p, { due: "Today", limit: "1", cursor: list.next_cursor! });
  assert.notEqual(next.items[0].id, list.items[0].id);
  await assert.rejects(listWork(p, { cursor: "not-a-token" }), field("cursor"));
});

test("MW-DB04 a planning gap is the Deals rule: the designated next action is finished; planning closes only that gap", async () => {
  const p = await principal();
  const make = async (title: string) => {
    const input = { ...crmDiscovery(), title };
    await createOpportunity(p, input);
    return input;
  };
  const a = await make("SYN gap A"),
    b = await make("SYN gap B");
  const gaps = async () => (await listPlanningGaps(p, { owner_id: p.actor_id, company_id: null, limit: 10 }))!;
  assert.equal((await gaps()).total, 0, "an undated but active next action is not a gap under the source rule");
  for (const o of [a, b])
    await activityCommand(p, o.initial_action.id, { ...crmBase(), expected_version: 1, outcome: "SYN outcome recorded" }, "complete");
  assert.deepEqual((await gaps()).items.map((g) => g.title).toSorted(), ["SYN gap A", "SYN gap B"]);
  assert.equal((await gaps()).items.every((g) => g.can_plan), true);
  const before = await readOpportunity(p, a.id);
  // Completing the action moved nothing else: same stage, same version, same pointer.
  assert.deepEqual([before.stage_id, before.version, before.next_activity?.id, before.next_action_state, before.close_outcome], ["Discovery", 1, a.initial_action.id, "Needed", "Open"]);
  await planOpportunityAction(p, a.id, {
    ...crmBase(),
    expected_version: 1,
    activity_id: null,
    new_action: { ...crmAction(), activity_type: "Call", due_needed: false, starts_at: at(24 * 60), due_at: at(24 * 60 + 20) },
  });
  assert.deepEqual((await gaps()).items.map((g) => g.title), ["SYN gap B"]);
  const planned = await readOpportunity(p, a.id);
  assert.equal(planned.next_activity?.activity_type, "Call");
  const overview = await readWorkOverview(p);
  assert.equal(overview.gaps.status, "ok");
  assert.equal(overview.gaps.status === "ok" && overview.gaps.total, 1);
  // Another identity's scope, and an identity without Sales access, learn nothing from the count.
  assert.equal((await listPlanningGaps(p, { owner_id: randomUUID(), company_id: null, limit: 10 }))!.total, 0);
  assert.equal(await listPlanningGaps(await principal("observer"), { owner_id: null, company_id: null, limit: 10 }), null);
  assert.equal((await readWorkOverview(await principal("observer"))).gaps.status, "not_permitted");
});

test("MW-DB07 an opportunity becomes overdue when its designated next action does: the Deals rule, asked at one instant", async () => {
  const p = await principal();
  const asked = async (now: string, owner_id: string | null = p.actor_id, reader = p) => await listOverdueOpportunities(reader, { owner_id, company_id: null, now, limit: 50 });
  // The seed may hold overdue opportunities of its own; this test counts from them.
  const seeded = (await asked(at(61)))!.total;
  const input = { ...crmDiscovery(), title: "SYN overdue opportunity" };
  await createOpportunity(p, input);
  assert.equal((await asked(at(61)))!.total, seeded, "an undated next action is 'Due date needed', never overdue");
  const due = at(60),
    action = { ...crmAction(), activity_type: "Call", due_needed: false, due_at: due };
  await planOpportunityAction(p, input.id, { ...crmBase(), expected_version: 1, activity_id: null, new_action: action });
  // The same records, asked one minute before the deadline and one minute after it.
  assert.equal((await asked(at(59)))!.total, seeded);
  const late = (await asked(at(61)))!;
  assert.equal(late.total, seeded + 1);
  assert.deepEqual(
    late.items.filter((o) => o.id === input.id).map((o) => [o.title, o.action_id, o.action_due_at, o.action_owner_id]),
    [["SYN overdue opportunity", action.id, due, action.owner_id]],
  );
  // Another owner's scope, and an identity without Sales access, learn nothing.
  assert.equal((await asked(at(61), randomUUID()))!.total, 0);
  assert.equal(await asked(at(61), null, await principal("observer")), null);
  assert.equal((await readWorkOverview(await principal("observer"))).overdue_opportunities.status, "not_permitted");
  assert.equal((await readWorkOverview(p)).overdue_opportunities.status, "ok");
  // Finishing the action ends the overdue state: the opportunity is then a planning gap, a different question.
  await activityCommand(p, action.id, { ...crmBase(), expected_version: 1, outcome: "SYN outcome recorded" }, "complete");
  assert.equal((await asked(at(61)))!.total, seeded);
  assert.equal((await listPlanningGaps(p, { owner_id: p.actor_id, company_id: null, limit: 50 }))!.items.some((g) => g.id === input.id), true);
});

test("MW-DB05 reads follow current grants: team coordination needs activity.edit and another workspace sees nothing", async () => {
  const p = await principal(),
    observer = await principal("observer");
  const mine = activity({ summary: "SYN coordinator only", due_needed: false, due_at: at(-60) });
  await createActivity(p, mine);
  assert.equal((await readWorkNavigation(p)).can_coordinate, true);
  assert.equal((await readWorkNavigation(observer)).can_coordinate, false);
  await assert.rejects(listWork(observer, {}, true), (e: unknown) => (e as { status: number }).status === 403);
  const team = await listWork(p, {}, true);
  assert.ok(team.owners!.some((o) => o.owner_id === p.actor_id && o.overdue >= 1));
  assert.equal((await listWork(observer, { owner: "mine" })).total, 0);
  const foreign = await principal("other-workspace");
  const seen = await listWork(foreign, { owner: "all", status: "All" }).catch((e: { status: number }) => e.status);
  assert.ok(seen === 403 || (typeof seen === "object" && seen.items.every((r) => r.id !== mine.id)));
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'", [p.actor_id]);
  await assert.rejects(readWorkOverview(p), (e: unknown) => (e as { status: number }).status === 403);
});

test("MW-DB06 saved views are personal criteria under a version check and hold no records or authority", async () => {
  const p = await principal(),
    other = await principal("observer");
  const view = (name: string, extra: Record<string, unknown> = {}) => ({ id: randomUUID(), name, target: "overview", pinned: false, criteria: { ...defaultCriteria }, ...extra });
  assert.deepEqual(await readWorkViews(p), { version: 0, views: [] });
  const first = await saveWorkViews(p, { expected_version: 0, views: [view("My sales follow-ups", { pinned: true })] });
  assert.equal(first.version, 1);
  const renamed = await saveWorkViews(p, { expected_version: 1, views: [{ ...first.views[0], name: "Sales follow-ups" }, view("Date needed", { target: "actions", criteria: { ...defaultCriteria, due: "Needed" } })] });
  assert.deepEqual(renamed.views.map((v) => [v.name, v.pinned, v.target]), [["Sales follow-ups", true, "overview"], ["Date needed", false, "actions"]]);
  await assert.rejects(saveWorkViews(p, { expected_version: 1, views: [] }), code("VersionConflict"));
  assert.equal((await readWorkViews(p)).views.length, 2, "a refused save changes nothing");
  await assert.rejects(saveWorkViews(p, { expected_version: 2, views: [view("Twin"), view("twin")] }), field("name"));
  await assert.rejects(saveWorkViews(p, { expected_version: 2, views: Array.from({ length: 13 }, (_, i) => view(`View ${i}`)) }), field("views"));
  await assert.rejects(saveWorkViews(p, { expected_version: 2, views: [view("Bad", { criteria: { ...defaultCriteria, owner: "someone-else" } })] }), field("owner"));
  await assert.rejects(saveWorkViews(p, { expected_version: 2, views: [view("Extra", { criteria: { ...defaultCriteria, actor_id: p.actor_id } })] }), (e: unknown) => (e as { status: number }).status === 422);
  assert.deepEqual(await readWorkViews(other), { version: 0, views: [] }, "views are never shared between people");
  const retired = await saveWorkViews(p, { expected_version: 2, views: [] });
  assert.deepEqual([retired.version, retired.views], [3, []]);
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.activities"))[0].n > 0, true, "retiring a view touches no business record");
});
