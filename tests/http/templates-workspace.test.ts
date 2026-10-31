import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { assignmentFixture } from "../helpers/template-use";
import { assignUse } from "../../src/documents/use/service";
import { id } from "../helpers/template-drafts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("DK06 UI native scope, publication and use reads retain exact labels and revoke evidence with authority", async () => {
  await reset();
  const f = await assignmentFixture(),
    h = httpAcceptance(localConfig().origin);
  const query = new URLSearchParams({
    company_id: f.input.company_id,
    site_id: f.input.site_id,
  }).toString();
  const scopes = await h.call(
    "cs-reviewer",
    "document-template-drafts/scopes?family=OUT-09",
  );
  assert.equal(scopes.status, 200, JSON.stringify(scopes.body));
  const scope = scopes.body.items.find(
    (s: { site_id: string }) => s.site_id === f.input.site_id,
  );
  assert.ok(scope.company_name && scope.site_name && scope.timezone);
  assert.equal(scope.can_assign, true);
  const listed = await h.call(
    "cs-reviewer",
    "document-template-publications?" + query,
  );
  assert.equal(listed.status, 200, JSON.stringify(listed.body));
  assert.deepEqual(
    listed.body.items.map((p: { id: string }) => p.id),
    [f.command.id],
  );
  assert.equal(listed.body.items[0].title, f.input.body.title);
  assert.equal(listed.body.items[0].template_id, f.command.template_id);
  const proposal = await h.call(
    "cs-reviewer",
    "document-template-drafts/" + f.input.id,
  );
  assert.equal(proposal.status, 200);
  assert.equal(proposal.body.publication_id, f.command.id);
  assert.ok(proposal.body.latest_review.actor_name);
  const publication = await h.call(
    "cs-reviewer",
    "document-template-publications/" + f.command.id,
  );
  assert.equal(publication.status, 200);
  assert.equal(
    publication.body.publication.publisher_name,
    proposal.body.latest_review.actor_name,
  );
  await assignUse(f.publisher, f.use);
  const policy = await h.call(
    "cs-reviewer",
    "document-template-use-policies?" + query,
  );
  assert.equal(policy.status, 200, JSON.stringify(policy.body));
  assert.equal(policy.body.company_name, scope.company_name);
  assert.equal(policy.body.site_name, scope.site_name);
  assert.equal(policy.body.selection.assignment_id, f.use.id);
  assert.equal(
    policy.body.items[0].template_version,
    f.command.runtime_version,
  );
  assert.equal(
    policy.body.items[0].actor_name,
    publication.body.publication.publisher_name,
  );
  const foreign = await h.call(
    "cs-reviewer",
    "document-template-publications?" +
      new URLSearchParams({
        company_id: id("20", 2),
        site_id: f.input.site_id,
      }),
  );
  assert.equal(foreign.status, 404);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.read'",
    [f.publisher.actor_id],
  );
  assert.equal(
    (
      await h.call(
        "cs-reviewer",
        "document-template-drafts/scopes?family=OUT-09",
      )
    ).status,
    403,
  );
  const hidden = await h.call(
    "cs-reviewer",
    "document-template-drafts?family=OUT-09",
  );
  assert.equal(hidden.status, 200);
  assert.deepEqual(hidden.body.items, []);
  for (const route of [
    "document-template-publications?" + query,
    "document-template-publications/" + f.command.id,
    "document-template-use-policies?" + query,
  ]) {
    const denied = await h.call("cs-reviewer", route);
    assert.equal(denied.status, 404, route + JSON.stringify(denied.body));
  }
});
