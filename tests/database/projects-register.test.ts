import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createProject, saveTask } from "../../src/projects/service";
import { projectRegister } from "../../src/projects/register";
import { projectInput, taskInput } from "../helpers/projects";
import { CRM } from "../helpers/crm";
import { AppError } from "../../src/platform/errors";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(async () => {
  await reset();
  await closeDatabase();
});

test("register reads all scoped matches, schedule facts and deterministic pages without changing records", async () => {
  const p = (await createSession("coordinator")).principal;
  const projects = ["2030-01-01", "2030-01-01", null].map((target_date, i) => ({
    ...projectInput(),
    title: `SYN Register ${i}`,
    target_date,
  }));
  for (const project of projects) await createProject(p, project);
  const task = {
    ...taskInput(),
    status: "AtRisk",
    title: "SYN Late procurement",
  };
  await saveTask(p, projects[0].id, task);
  await saveTask(p, projects[0].id, {
    ...taskInput(2),
    milestone: true,
    status: "Complete",
    progress: 100,
    start_date: "2000-01-03",
    finish_date: "2000-01-03",
    title: "SYN Earlier completed milestone",
  });
  await saveTask(p, projects[0].id, {
    ...taskInput(3),
    milestone: true,
    status: "Planned",
    progress: 0,
    start_date: "2001-01-01",
    finish_date: "2001-01-01",
    title: "SYN First incomplete milestone",
  });
  await saveTask(p, projects[0].id, {
    ...taskInput(4),
    milestone: true,
    status: "AtRisk",
    progress: 0,
    start_date: null,
    finish_date: null,
    title: "SYN Undated milestone",
  });
  const q = { q: "SYN Register" };
  const all = await projectRegister(p, q);
  assert.equal(all.total, 3);
  assert.deepEqual(all.counts, {
    Active: 3,
    Mine: 3,
    All: 3,
    Closed: 0,
    Overdue: 1,
    AtRisk: 1,
    NoTarget: 1,
  });
  assert.equal(all.items.at(-1)!.id, projects[2].id);
  const row = all.items.find((x) => x.id === projects[0].id)!;
  assert.equal(row.next_milestone?.title, "SYN First incomplete milestone");
  assert.equal(row.milestone_overdue, true);
  assert.equal(
    row.at_risk,
    1,
    "at-risk milestones are distinct from task risk",
  );
  assert.ok(row.created_at);
  for (const [view, id] of [
    ["Overdue", projects[0].id],
    ["AtRisk", projects[0].id],
    ["NoTarget", projects[2].id],
  ])
    assert.deepEqual(
      (await projectRegister(p, { ...q, view })).items.map((x) => x.id),
      [id],
    );
  let cursor: string | null = null;
  const seen: string[] = [];
  do {
    const page = await projectRegister(p, {
      ...q,
      limit: 1,
      ...(cursor ? { cursor } : {}),
    });
    assert.equal(page.counts.Active, 3);
    seen.push(...page.items.map((x) => x.id));
    cursor = page.next_cursor;
  } while (cursor);
  assert.deepEqual(
    seen,
    all.items.map((x) => x.id),
  );
  const first = await projectRegister(p, { ...q, limit: 1 });
  await assert.rejects(
    projectRegister(p, {
      ...q,
      limit: 1,
      view: "All",
      cursor: first.next_cursor,
    }),
  );
  await assert.rejects(
    projectRegister(p, { ...q, sort: "title; DROP TABLE ppo.projects" }),
  );
  assert.equal(
    (
      await projectRegister(p, {
        ...q,
        coordinator: CRM.owner,
        customer: CRM.org,
      })
    ).total,
    3,
  );
  const before = await database().query(
    "SELECT project_id,project_version,reason FROM ppo.project_schedule_events WHERE project_id=ANY($1::uuid[]) ORDER BY project_id,project_version",
    [projects.map((x) => x.id)],
  );
  for (const profile of ["second-company", "other-workspace", "systems"]) {
    const other = (await createSession(profile)).principal;
    try {
      const denied = await projectRegister(other, q);
      assert.equal(denied.total, 0);
      assert.equal(denied.counts.All, 0);
      assert.ok(!denied.options.customers.some((x) => x.id === CRM.org));
    } catch (e) {
      assert.ok(e instanceof AppError && e.status === 403);
    }
  }
  await closeDatabase();
  assert.equal((await projectRegister(p, q)).total, 3);
  assert.deepEqual(
    (
      await database().query(
        "SELECT project_id,project_version,reason FROM ppo.project_schedule_events WHERE project_id=ANY($1::uuid[]) ORDER BY project_id,project_version",
        [projects.map((x) => x.id)],
      )
    ).rows,
    before.rows,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(
    projectRegister(p, q),
    (e) => e instanceof AppError && e.status === 403,
  );
});
