import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { reviewedDraft } from "../helpers/template-publication";
import { revisionInput } from "../helpers/template-drafts";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("R3 compiled publication, exact catalogue, later-edit recovery and revocation", async () => {
  await reset();
  const f = await reviewedDraft(),
    h = httpAcceptance(localConfig().origin),
    path = "document-template-drafts/" + f.input.id + "/publication";
  const ready = await h.call("cs-reviewer", path);
  assert.equal(ready.status, 200, JSON.stringify(ready.body));
  assert.equal(ready.body.use_assigned, false);
  assert.equal((await h.call("observer", path)).status, 404);
  assert.equal(
    (await h.call("cs-reviewer", path, { ...f.command, publish_policy: true }))
      .status,
    422,
  );
  const saved = await h.call("cs-reviewer", path, f.command);
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal(saved.body.record_id, f.command.id);
  const pub = await h.call(
    "cs-reviewer",
    "document-template-publications/" + f.command.id,
  );
  assert.equal(pub.status, 200);
  assert.equal(pub.body.runtime_support, "Supported");
  assert.equal(pub.body.publication.definition_hash, f.command.definition_hash);
  const cat = await h.call(
    "cs-reviewer",
    "document-templates/" + f.command.template_id + "?family=OUT-09",
  );
  assert.equal(cat.status, 200);
  assert.equal(cat.body.publication_id, f.command.id);
  assert.equal(cat.body.selected_by_policy, false);
  const edited = await h.call(
    "coordinator",
    "document-template-drafts/" + f.input.id + "/revisions",
    await revisionInput(f.p, f.input.id),
  );
  assert.equal(edited.status, 201);
  const replay = await h.call("cs-reviewer", path, f.command);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, saved.body);
  assert.equal(
    (
      await h.call("cs-reviewer", path, {
        ...f.command,
        operation_id: randomUUID(),
      })
    ).status,
    409,
  );
  assert.deepEqual(
    (await h.call("cs-reviewer", "operations/" + f.command.operation_id)).body,
    saved.body,
  );
  assert.equal(
    (await h.call("coordinator", "operations/" + f.command.operation_id))
      .status,
    404,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='pack.check'",
    [f.publisher.actor_id],
  );
  assert.equal((await h.call("cs-reviewer", path, f.command)).status, 404);
  assert.equal(
    (await h.call("cs-reviewer", "operations/" + f.command.operation_id))
      .status,
    404,
  );
  assert.equal(
    (
      await h.call(
        "other-workspace",
        "document-template-publications/" + f.command.id,
      )
    ).status,
    404,
  );
});
