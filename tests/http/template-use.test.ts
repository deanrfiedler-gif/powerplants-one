import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { assignmentFixture } from "../helpers/template-use";
import { base } from "../helpers/packs";
import { randomUUID } from "node:crypto";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("R4 compiled policy/assignment commands retain exact original recovery, scoped reads, explicit succession and current authority", async () => {
  await reset();
  const f = await assignmentFixture(),
    h = httpAcceptance(localConfig().origin),
    path = "document-template-use-assignments";
  const saved = await h.call("cs-reviewer", path, f.use);
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  const read = await h.call("cs-reviewer", path + "/" + f.use.id);
  assert.equal(read.status, 200);
  assert.equal(read.body.assignment.publication_id, f.command.id);
  const scope =
    "document-template-use-policies?company_id=" +
    f.input.company_id +
    "&site_id=" +
    f.input.site_id;
  const policy = await h.call("cs-reviewer", scope);
  assert.equal(policy.status, 200);
  assert.equal(policy.body.selection.assignment_id, f.use.id);
  assert.equal(
    (await h.call("cs-reviewer", scope + "&at=2000-01-01T00:00:00Z")).status,
    422,
  );
  assert.equal((await h.call("cs-reviewer", scope + "&after=")).status, 422);
  assert.equal((await h.call("observer", path + "/" + f.use.id)).status, 404);
  assert.equal(
    (await h.call("other-workspace", path + "/" + f.use.id)).status,
    404,
  );
  const next = {
    ...f.use,
    ...base(),
    id: randomUUID(),
    expected_policy_version: 1,
  };
  const overlap = await h.call("cs-reviewer", path, next);
  assert.equal(overlap.status, 409);
  assert.equal(overlap.body.code, "AmbiguousTemplateUse");
  const successor = await h.call("cs-reviewer", path, {
    ...next,
    predecessor_id: f.use.id,
  });
  assert.equal(successor.status, 201, JSON.stringify(successor.body));
  const page = await h.call("cs-reviewer", scope + "&limit=1");
  assert.equal(page.body.items.length, 1);
  assert.ok(page.body.next_after);
  const page2 = await h.call(
    "cs-reviewer",
    scope + "&limit=1&after=" + page.body.next_after,
  );
  assert.equal(page2.body.items.length, 1);
  assert.notEqual(page2.body.items[0].id, page.body.items[0].id);
  assert.deepEqual((await h.call("cs-reviewer", path, f.use)).body, saved.body);
  assert.deepEqual(
    (await h.call("cs-reviewer", "operations/" + f.use.operation_id)).body,
    saved.body,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.assign'",
    [f.publisher.actor_id],
  );
  assert.equal((await h.call("cs-reviewer", path, f.use)).status, 404);
  assert.equal(
    (await h.call("cs-reviewer", "operations/" + f.use.operation_id)).status,
    404,
  );
  assert.equal(
    (await h.call("cs-reviewer", path + "/" + f.use.id)).status,
    200,
  );
});
