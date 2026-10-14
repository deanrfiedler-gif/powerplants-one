import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { reviewedDraft } from "../helpers/template-publication";
import { draftInput, id, grantDraft } from "../helpers/template-drafts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("R3 copied published bases retain current source-site authority through reads, history and original recovery", async () => {
  await reset();
  const f = await reviewedDraft(),
    h = httpAcceptance(localConfig().origin);
  const pub = await h.call(
    "cs-reviewer",
    "document-template-drafts/" + f.input.id + "/publication",
    f.command,
  );
  assert.equal(pub.status, 201, JSON.stringify(pub.body));
  const copy = {
    ...(await draftInput(f.p)),
    site_id: id("70", 2),
    base_template_id: f.command.template_id,
    base_content_hash: f.command.definition_hash,
  };
  const saved = await h.call("coordinator", "document-template-drafts", copy);
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal(
    (await h.call("coordinator", "document-template-drafts/" + copy.id)).status,
    200,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.read'",
    [f.p.actor_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,site_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'template.read','Site',$4)",
    [f.p.workspace_id, f.p.actor_id, id("20"), id("70", 2)],
  );
  try {
    for (const path of [
      "document-template-drafts/" + copy.id,
      "document-template-drafts/" + copy.id + "/history?kind=Revision",
      "operations/" + copy.operation_id,
    ])
      assert.equal((await h.call("coordinator", path)).status, 404, path);
    assert.equal(
      (await h.call("coordinator", "document-template-drafts", copy)).status,
      404,
    );
    const list = await h.call(
      "coordinator",
      "document-template-drafts?family=OUT-09",
    );
    assert.equal(list.status, 200);
    assert.ok(!list.body.items.some((r: { id: string }) => r.id === copy.id));
  } finally {
    await grantDraft(f.p, ["template.read"]);
  }
  assert.deepEqual(
    (await h.call("coordinator", "document-template-drafts", copy)).body,
    saved.body,
  );
});
