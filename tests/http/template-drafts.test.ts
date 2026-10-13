import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { base, id, setupDraft, draftInput } from "../helpers/template-drafts";
import { randomUUID } from "node:crypto";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("R2 compiled proposal create/review/revise/history/recovery respects exactness and current authority", async () => {
  await reset();
  const { p } = await setupDraft(),
    input = await draftInput(p),
    h = httpAcceptance(localConfig().origin),
    path = "document-template-drafts";
  const bindings = await h.call(
    "coordinator",
    path +
      "/bindings?family=OUT-09&company_id=" +
      id("20") +
      "&site_id=" +
      id("70"),
  );
  assert.equal(bindings.status, 200);
  assert.ok(
    bindings.body.items.some(
      (b: { binding: string }) => b.binding === "site.name",
    ),
  );
  const created = await h.call("coordinator", path, input);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const detail = await h.call("coordinator", path + "/" + input.id);
  assert.equal(detail.status, 200);
  const review = {
    ...base(),
    review_id: randomUUID(),
    revision_id: input.revision_id,
    content_hash: detail.body.revision.content_hash,
    expected_version: 1,
    outcome: "Reviewed",
    checks: Object.fromEntries(
      ["schema", "source_bindings", "audience"].map((k) => [
        k,
        { result: "Pass", note: "SYN exact compiled HTTP review of " + k },
      ]),
    ),
  };
  assert.equal(
    (await h.call("coordinator", path + "/" + input.id + "/reviews", review))
      .status,
    409,
  );
  const reviewed = await h.call(
    "cs-reviewer",
    path + "/" + input.id + "/reviews",
    review,
  );
  assert.equal(reviewed.status, 201, JSON.stringify(reviewed.body));
  const changed = {
    ...base(),
    expected_version: 2,
    observed_revision_id: input.revision_id,
    revision_id: randomUUID(),
    body: { ...input.body, title: "SYN HTTP next revision" },
  };
  const saved = await h.call(
    "coordinator",
    path + "/" + input.id + "/revisions",
    changed,
  );
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal(
    (
      await h.call("coordinator", path + "/" + input.id + "/revisions", {
        ...changed,
        ...base(),
        revision_id: randomUUID(),
      })
    ).status,
    409,
  );
  const latest = await h.call("coordinator", path + "/" + input.id);
  assert.equal(latest.body.proposal.state, "Draft");
  assert.equal(latest.body.latest_review, null);
  assert.equal(latest.body.publication_eligible, false);
  const historical = await h.call(
    "coordinator",
    path + "/" + input.id + "?revision_id=" + input.revision_id,
  );
  assert.equal(historical.body.latest_review.id, review.review_id);
  const history = await h.call(
    "coordinator",
    path + "/" + input.id + "/history?kind=Revision&limit=1",
  );
  assert.equal(history.body.completeness, "Partial");
  assert.equal(
    (
      await h.call(
        "coordinator",
        path +
          "/" +
          input.id +
          "/history?kind=Revision&limit=1&cursor=" +
          encodeURIComponent(history.body.next_cursor),
      )
    ).body.items.length,
    1,
  );
  assert.equal(
    (await h.call("other-workspace", path + "/" + input.id)).status,
    404,
  );
  assert.equal((await h.call("observer", path, input)).status, 404);
  assert.deepEqual(
    (await h.call("coordinator", "operations/" + input.operation_id)).body,
    created.body,
  );
  assert.equal(
    (await h.call("cs-reviewer", "operations/" + input.operation_id)).status,
    404,
  );
  const replay = await h.call("coordinator", path, input);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  const list = await h.call("coordinator", path + "?family=OUT-09");
  assert.equal(list.body.items[0].id, input.id);
  assert.equal(
    (await h.call("coordinator", path, { ...input, ...base(), publish: true }))
      .status,
    422,
  );
});
