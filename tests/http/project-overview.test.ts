import assert from "node:assert/strict";
import { after, test } from "node:test";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import { httpAcceptance } from "../helpers/acceptance-http";
import { projectInput, taskInput } from "../helpers/projects";
import { raidInput, raidAction } from "../helpers/project-raid";
import { projectReceivingFixture } from "../helpers/project-receiving";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("PJ02-HTTP01 compiled native saves feed scoped overview, all-match portfolio counts and strict read validation", async () => {
  const project = {...projectInput(), target_date:"2020-01-01"},
    item = raidInput(),
    action = raidAction(project.id);
  assert.equal((await h.call("coordinator", "projects", project)).status, 201);
  assert.equal(
    (await h.call("coordinator", `projects/${project.id}/tasks`, taskInput()))
      .status,
    201,
  );
  assert.equal((await h.call("coordinator", "activities", action)).status, 201);
  assert.equal(
    (
      await h.call("coordinator", `projects/${project.id}/raid`, {
        ...item,
        action_ids: [action.id],
      })
    ).status,
    201,
  );
  const route = `projects/${project.id}/overview`,
    read = await h.call("coordinator", route);
  assert.equal(read.status, 200);
  assert.equal(read.body.project.version, 2);
  assert.ok(read.body.project.attention.reasons.some((r:{code:string})=>r.code==="ForecastAfterTarget"));
  assert.equal(read.body.actions.items[0].id, action.id);
  assert.equal(read.body.raid.items[0].id, item.id);
  assert.equal(read.body.project.attention.state, "NeedsAttention");
  const list = await h.call(
    "coordinator",
    `projects/portfolio?q=${project.id}&attention=NeedsAttention`,
  );
  assert.equal(list.status, 200);
  assert.equal(list.body.counts.total, 1);
  assert.equal(list.body.items[0].id, project.id);
  assert.equal((await h.call("second-company", route)).status, 404);
  const denied = await h.call(
    "second-company",
    `projects/portfolio?q=${project.id}`,
  );
  assert.equal(denied.status, 200);
  assert.equal(denied.body.counts.total, 0);
  for (const query of ["?unknown=1", "?baseline_revision=0"])
    assert.equal((await h.call("coordinator", route + query)).status, 422);
  for (const query of ["?attention=Healthy", "?cursor=forged", "?limit=0"])
    assert.equal(
      (await h.call("coordinator", "projects/portfolio" + query)).status,
      422,
    );
});
test("PJ01-HTTP01 compiled receiving link, exact replay and overview retain the same accepted Sales context", async () => {
  const f = await projectReceivingFixture(),
    route = `sales/handovers/${f.handover}/delivery`;
  const saved = await h.call("coordinator", route, f.binding);
  assert.equal(saved.status, 201);
  const replay = await h.call("coordinator", route, f.binding);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, saved.body);
  const read = await h.call("coordinator", `projects/${f.project.id}/overview`);
  assert.equal(read.status, 200);
  const source = read.body.receiving.items[0];
  assert.equal(source.acceptance_event_id, f.binding.acceptance_event_id);
  assert.equal(source.accepted_source_hash, f.binding.source_hash);
  assert.deepEqual(source.content, f.content);
  assert.equal(source.receiving_owner_id, f.p.actor_id);
  assert.equal(read.body.receiving.completeness, "Complete");
});
