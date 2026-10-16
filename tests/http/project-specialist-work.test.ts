import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  specialistWorkFixture,
  workAction,
} from "../helpers/project-specialist-work";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("PJ06-R3 compiled API: exact independent review, lost response, repeat recovery, privacy and company isolation", async () => {
  const f = await specialistWorkFixture(),
    h = httpAcceptance(localConfig().origin),
    route = `projects/${f.project.id}/specialist-work-evidence`;
  const cookie = await h.cookie("coordinator");
  const missing = await fetch(localConfig().origin + "/api/v1/" + route, {
    method: "POST",
    headers: {
      cookie,
      origin: localConfig().origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(f.submit),
  });
  assert.equal(missing.status, 201);
  assert.equal(missing.headers.get("cache-control"), "private, no-store");
  await missing.body?.cancel();
  const receipt = await h.call(
    "coordinator",
    `operations/${f.submit.operation_id}`,
  );
  assert.equal(receipt.status, 200);
  assert.deepEqual(
    (await h.call("coordinator", route, f.submit)).body,
    receipt.body,
  );
  const decision = workAction(f.submit.id),
    results = await Promise.all(
      [1, 2].map(() => h.call("estimating-source-reviewer", route, decision)),
    );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.deepEqual(results[0].body, results[1].body);
  const detail = await h.call(
    "estimating-source-reviewer",
    `${route}?id=${f.submit.id}`,
  );
  assert.equal(detail.status, 200);
  assert.equal(detail.body.current.state, "Accepted");
  assert.equal(
    detail.body.current.source.document.revision_id,
    f.document.revision_id,
  );
  assert.equal(
    (await h.call("second-company", `${route}?id=${f.submit.id}`)).status,
    404,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='document.read'",
    [f.reviewer.actor_id],
  );
  assert.equal(
    (await h.call("estimating-source-reviewer", `${route}?id=${f.submit.id}`))
      .status,
    404,
  );
  assert.deepEqual(
    (await h.call("estimating-source-reviewer", route)).body.items,
    [],
  );
  assert.equal(
    (
      await h.call(
        "estimating-source-reviewer",
        `operations/${decision.operation_id}`,
      )
    ).status,
    404,
  );
  assert.equal(
    (await h.call("estimating-source-reviewer", route, decision)).status,
    404,
  );
});
