import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { editDealScope } from "../../src/crm/refinements";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset } from "../../scripts/database";
import {
  createProject,
  readSchedule,
  saveTask,
} from "../../src/projects/service";
import { recordBaseline, readBaselines } from "../../src/projects/baselines";
import { readProjectOverview } from "../../src/projects/overview";
import { readPortfolio } from "../../src/projects/portfolio";
import { bindDelivery } from "../../src/sales/delivery-binding";
import { commandHandover } from "../../src/sales/handover-service";
import {
  createActivity,
  activityCommand,
} from "../../src/activities/activities";
import { saveRaid } from "../../src/projects/raid";
import { readOperation } from "../../src/shared/receipts";
import { projectInput, taskInput } from "../helpers/projects";
import { projectReceivingFixture } from "../helpers/project-receiving";
import { raidInput, raidAction } from "../helpers/project-raid";
import { CRM, crmBase, crmDiscovery } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function setup() {
  const p = (await createSession("coordinator")).principal,
    project = projectInput();
  await createProject(p, project);
  return { p, project };
}
async function snapshot() {
  const tables = [
    "projects",
    "project_tasks",
    "project_dependencies",
    "project_schedule_baselines",
    "project_schedule_events",
    "activities",
    "activity_links",
    "project_raid_entries",
    "project_raid_revisions",
    "sales_handovers",
    "sales_workflow_events",
    "sales_delivery_bindings",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  const c = await database().connect();
  try {
    const result = [];
    for (const table of tables)
      result.push(
        (
          await c.query(
            `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
          )
        ).rows,
      );
    return result;
  } finally {
    c.release();
  }
}
test("PJ02-01 overview explains saved schedule, selected baseline, transitive successors, RAID and action facts without writes", async () => {
  const { p, project } = await setup();
  const a = {
    ...taskInput(),
    title: "SYN overdue milestone",
    milestone: true,
    status: "AtRisk",
    progress: 0,
    start_date: "2020-01-06",
    finish_date: "2020-01-06",
  };
  const b = {
    ...taskInput(2),
    title: "SYN successor",
    start_date: "2030-01-07",
    finish_date: "2030-01-08",
    dependencies: [{ task_id: a.id, kind: "FS" }],
  };
  await saveTask(p, project.id, a);
  await saveTask(p, project.id, b);
  await recordBaseline(p, project.id, {
    ...crmBase(),
    expected_version: 3,
    expected_baseline_revision: 0,
    label: "SYN original",
    reviewed: true,
  });
  await saveTask(p, project.id, {
    ...b,
    ...crmBase(),
    expected_version: 3,
    finish_date: "2030-01-10",
  });
  const moved = (await readPortfolio(p, { q: project.id })).items[0];
  assert.equal(moved.dates.forecast_minus_baseline_days, 2);
  assert.ok(
    moved.attention.reasons.some((r) => r.code === "ForecastAfterBaseline"),
  );
  assert.ok(
    moved.attention.reasons.some((r) => r.code === "ForecastAfterTarget"),
  );
  await recordBaseline(p, project.id, {
    ...crmBase(),
    expected_version: 4,
    expected_baseline_revision: 1,
    label: "SYN later",
    reviewed: true,
  });
  const action = {
    ...raidAction(project.id),
    due_at: "2020-01-01T00:00:00.000Z",
    due_needed: false,
  };
  await createActivity(p, action);
  const raid = { ...raidInput(), action_ids: [action.id] };
  await saveRaid(p, project.id, raid);
  const before = await snapshot(),
    read = await readProjectOverview(p, project.id, { baseline_revision: "1" });
  assert.equal(read.project.version, 4);
  assert.equal(read.schedule.dates.forecast_minus_baseline_days, 2);
  assert.equal(read.schedule.baseline?.revision, 1);
  assert.equal(read.schedule.latest_baseline_revision, 2);
  assert.equal(
    read.schedule.attention.find((x) => x.task.id === a.id)?.latest_save
      ?.reason,
    a.reason,
  );
  assert.deepEqual(
    read.schedule.attention.find((x) => x.task.id === a.id)?.reasons,
    ["OverdueMilestone", "AtRiskTask"],
  );
  assert.deepEqual(
    read.schedule.attention.find((x) => x.task.id === b.id)?.reasons,
    ["SuccessorReview"],
  );
  assert.equal(read.project.attention.state, "NeedsAttention");
  assert.equal(read.project.actions.overdue, 1);
  assert.equal(read.raid.items[0].id, raid.id);
  assert.equal(read.actions.items[0].id, action.id);
  assert.equal(read.team.items.length, 1);
  assert.equal(read.team.items[0].coordinator, true);
  assert.deepEqual(new Set(read.team.items[0].task_ids), new Set([a.id, b.id]));
  assert.equal(read.receiving.basis, "NoLinkedSalesHandover");
  assert.equal(
    read.recent_history.items.filter((e) => e.kind === "BaselineRecorded")
      .length,
    2,
  );
  assert.equal(
    (await readProjectOverview(p, project.id)).schedule.dates
      .forecast_minus_baseline_days,
    0,
  );
  assert.equal(
    (await readPortfolio(p, { q: project.id })).items[0].dates
      .baseline_revision,
    2,
  );
  await assert.rejects(
    readProjectOverview(p, project.id, { baseline_revision: 99 }),
    code("RecordUnavailable"),
  );
  assert.deepEqual(await snapshot(), before);
});
test("PJ01-01 native receiving retains exact attribution, refuses stale linking, recovers duplicates and distinguishes a later Sales successor", async () => {
  const f = await projectReceivingFixture();
  assert.equal(
    (await readProjectOverview(f.p, f.project.id)).receiving.basis,
    "NoLinkedSalesHandover",
  );
  await saveTask(f.p, f.project.id, taskInput());
  await assert.rejects(
    bindDelivery(f.p, f.handover, f.binding),
    code("VersionConflict"),
  );
  const binding = {
    ...f.binding,
    ...crmBase(),
    expected_destination_version: 2,
  };
  const saved = await bindDelivery(f.p, f.handover, binding);
  assert.deepEqual(
    (await bindDelivery(f.p, f.handover, binding)).receipt,
    saved.receipt,
  );
  const before = await snapshot(),
    read = await readProjectOverview(f.p, f.project.id),
    source = read.receiving.items[0];
  assert.equal(source.access, "Available");
  if (source.access !== "Available") throw Error("Expected permitted source");
  assert.equal(source.acceptance_event_id, binding.acceptance_event_id);
  assert.equal(source.accepted_source_hash, binding.source_hash);
  assert.equal(source.accepted_by, f.p.actor_id);
  assert.equal(source.receiving_owner_id, f.p.actor_id);
  assert.deepEqual(source.content, f.content);
  assert.equal(source.current, true);
  assert.equal(source.source_changed, false);
  assert.deepEqual(await snapshot(), before);
  await activityCommand(
    f.p,
    f.deal.initial_action.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN original Sales follow-up completed",
    },
    "complete",
  );
  // Activity progress is live context, not part of the accepted commercial hash.
  const completed = (await readProjectOverview(f.p, f.project.id)).receiving
    .items[0];
  assert.equal(completed.access, "Available");
  if (completed.access !== "Available")
    throw Error("Expected permitted source");
  assert.equal(completed.source_changed, false);
  await editDealScope(f.p, f.deal.id, {
    ...crmBase(),
    expected_version: 6,
    need_summary: "SYN revised commercial source need",
    scope_details: "SYN changed controls scope after acceptance",
  });
  const changed = (await readProjectOverview(f.p, f.project.id)).receiving
    .items[0];
  assert.equal(changed.access, "Available");
  if (changed.access !== "Available")
    throw Error("Expected available changed source");
  assert.equal(changed.source_changed, true);
  assert.equal(changed.accepted_source_hash, source.accepted_source_hash);
  await commandHandover(f.p, f.handover, {
    ...crmBase(),
    action: "Successor",
    expected_version: 4,
    note: "SYN changed Sales proposal",
  });
  const later = (await readProjectOverview(f.p, f.project.id)).receiving
    .items[0];
  assert.equal(later.access, "Available");
  if (later.access !== "Available") throw Error("Expected retained source");
  assert.equal(later.current, false);
  assert.deepEqual(later.content, source.content);
  assert.equal(later.accepted_source_hash, source.accepted_source_hash);
  assert.deepEqual(
    await readOperation(f.p, binding.operation_id),
    saved.receipt,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='crm.opportunity.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  const hidden = await readProjectOverview(f.p, f.project.id);
  assert.equal(hidden.receiving.completeness, "Partial");
  assert.equal(hidden.receiving.basis, "PartlyUnavailable");
  assert.deepEqual(hidden.receiving.items, [{ access: "Restricted" }]);
  assert.ok(!JSON.stringify(hidden).includes(f.handover));
  assert.ok(!JSON.stringify(hidden).includes(f.content.problem));
  await assert.rejects(
    readOperation(f.p, binding.operation_id),
    code("RecordUnavailable"),
  );
});
test("PJ02-02 current Project, company, workspace and all-target Activity permissions govern projections and counts", async () => {
  const { p, project } = await setup(),
    action = { ...raidAction(project.id), summary: "SYN hidden next action" };
  const deal = crmDiscovery();
  await createOpportunity(p, deal);
  action.links.push({ object_type: "Opportunity", object_id: deal.id });
  await saveTask(p, project.id, taskInput());
  await createActivity(p, action);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability=ANY($3::text[])",
    [p.workspace_id, p.actor_id, ["crm.opportunity.read", "project.edit"]],
  );
  const read = await readProjectOverview(p, project.id),
    list = await readPortfolio(p, { q: project.id });
  assert.equal(read.can.edit_schedule, false);
  assert.equal(read.can.record_baseline, false);
  assert.deepEqual(read.actions.items, []);
  assert.equal(read.actions.completeness, "Partial");
  assert.equal(list.items[0].actions.open, 0);
  assert.equal(list.items[0].attention.state, "InformationNeeded");
  assert.equal(list.counts.partial_actions, 1);
  assert.ok(!JSON.stringify(read).includes(action.id));
  assert.ok(!JSON.stringify(read).includes(action.summary));
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    readProjectOverview(other, project.id),
    code("RecordUnavailable"),
  );
  assert.equal((await readPortfolio(other, { q: project.id })).counts.total, 0);
  await assert.rejects(
    readProjectOverview({ ...p, workspace_id: randomUUID() }, project.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    withWorkingCompany(p.actor_id, CRM.companyB, () =>
      readProjectOverview(p, project.id),
    ),
    code("RecordUnavailable"),
  );
  assert.equal(
    (
      await withWorkingCompany(p.actor_id, CRM.companyB, () =>
        readPortfolio(p, { q: project.id }),
      )
    ).counts.total,
    0,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    readProjectOverview(p, project.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(readPortfolio(p), code("Forbidden"));
});
test("PJ02-03 full-match filters and bound paging agree, while missing dates never produce a complete forecast", async () => {
  const p = (await createSession("coordinator")).principal,
    prefix = `SYN portfolio ${randomUUID()}`,
    ids: string[] = [];
  for (let n = 0; n < 4; n++) {
    const project = {
      ...projectInput(),
      title: `${prefix} ${n}`,
      target_date: "2031-01-01",
    };
    ids.push(project.id);
    await createProject(p, project);
    if (n !== 0)
      await saveTask(p, project.id, {
        ...taskInput(),
        status: n === 1 ? "AtRisk" : "Planned",
        progress: 0,
        start_date: n === 2 ? null : "2030-01-07",
        finish_date: n === 2 ? null : "2030-01-08",
      });
  }
  const first = await readPortfolio(p, { q: prefix, limit: 2 });
  assert.equal(first.counts.total, 4);
  assert.equal(first.counts.needs_attention, 1);
  assert.equal(first.counts.information_needed, 2);
  assert.equal(first.counts.no_current_flags, 1);
  assert.ok(first.next_cursor);
  const second = await readPortfolio(p, {
    q: prefix,
    limit: 2,
    cursor: first.next_cursor,
  });
  assert.deepEqual(second.counts, first.counts);
  assert.equal(second.next_cursor, null);
  assert.deepEqual(
    new Set([...first.items, ...second.items].map((r) => r.id)),
    new Set(ids),
  );
  const attention = await readPortfolio(p, {
    q: prefix,
    attention: "NeedsAttention",
    coordinator_id: p.actor_id,
    site_id: CRM.site,
    lifecycle: "Active",
  });
  assert.equal(attention.counts.total, 1);
  assert.equal(attention.items[0].id, ids[1]);
  const empty = await readProjectOverview(p, ids[0]),
    undated = await readProjectOverview(p, ids[2]);
  assert.equal(empty.schedule.dates.forecast_finish, null);
  assert.equal(undated.schedule.dates.forecast_finish, null);
  assert.equal(undated.project.tasks.undated, 1);
  for (const change of [
    { q: "changed" },
    { limit: 1 },
    { attention: "NeedsAttention" },
    { coordinator_id: randomUUID() },
  ])
    await assert.rejects(
      readPortfolio(p, {
        q: prefix,
        limit: 2,
        cursor: first.next_cursor,
        ...change,
      }),
      code("InvalidData"),
    );
  await assert.rejects(
    withWorkingCompany(p.actor_id, CRM.company, () =>
      readPortfolio(p, { q: prefix, limit: 2, cursor: first.next_cursor }),
    ),
    code("InvalidData"),
  );
  for (const q of [
    { cursor: "forged" },
    { limit: 0 },
    { attention: "Healthy" },
    { stage: "Delivery" },
  ])
    await assert.rejects(readPortfolio(p, q), code("InvalidData"));
  await assert.rejects(
    readProjectOverview(p, ids[0], { baseline_revision: 0 }),
    code("InvalidData"),
  );
});
test("PJ02-04 native action completion and schedule withdrawal refresh the overview without rewriting saved baselines", async () => {
  const { p, project } = await setup(),
    task = taskInput(),
    action = {
      ...raidAction(project.id),
      due_at: "2020-01-01T00:00:00.000Z",
      due_needed: false,
    };
  await saveTask(p, project.id, task);
  await recordBaseline(p, project.id, {
    ...crmBase(),
    expected_version: 2,
    expected_baseline_revision: 0,
    label: "SYN retained",
    reviewed: true,
  });
  const original = (await readBaselines(p, project.id)).selected;
  await createActivity(p, action);
  assert.equal(
    (await readProjectOverview(p, project.id)).project.actions.overdue,
    1,
  );
  await activityCommand(
    p,
    action.id,
    { ...crmBase(), expected_version: 1, outcome: "SYN reviewed" },
    "complete",
  );
  await saveTask(p, project.id, {
    ...task,
    ...crmBase(),
    expected_version: 2,
    start_date: null,
    finish_date: null,
    reason: "SYN forecast withdrawn for review",
  });
  await closeDatabase();
  const read = await readProjectOverview(p, project.id);
  assert.equal(read.project.actions.overdue, 0);
  assert.equal(read.actions.items.length, 0);
  assert.equal(read.schedule.dates.forecast_finish, null);
  assert.equal(read.schedule.dates.baseline_finish, task.finish_date);
  assert.deepEqual((await readBaselines(p, project.id)).selected, original);
  assert.equal((await readSchedule(p, project.id)).project.version, 3);
});
