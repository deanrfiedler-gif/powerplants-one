import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  specialistFixture,
  packageAction,
} from "../helpers/project-specialist";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("PJ06-HTTP native exact receiving, lost response recovery, private source access and repeat commands", async () => {
  const f = await specialistFixture(),
    h = httpAcceptance(localConfig().origin),
    route = `projects/${f.project.id}/specialist-packages`;
  const cookie = await h.cookie("coordinator");
  // Deliberately discard the accepted response body; recover through the original operation.
  const transport = await fetch(localConfig().origin + "/api/v1/" + route, {
    method: "POST",
    headers: {
      cookie,
      origin: localConfig().origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(f.package),
  });
  assert.equal(transport.status, 201);
  await transport.body?.cancel();
  const recovered = await h.call(
    "coordinator",
    `operations/${f.package.operation_id}`,
  );
  assert.equal(recovered.status, 200);
  assert.deepEqual(
    (await h.call("coordinator", route, f.package)).body,
    recovered.body,
  );
  const submit = await h.call(
    "coordinator",
    route,
    packageAction(f.package.id, 1, "Submit"),
  );
  assert.equal(submit.status, 201, JSON.stringify(submit.body));
  assert.equal(
    (
      await h.call(
        "coordinator",
        route,
        packageAction(f.package.id, 2, "Accept"),
      )
    ).status,
    404,
  );
  const accept = packageAction(f.package.id, 2, "Accept");
  const outcomes = await Promise.all(
    [1, 2].map(() => h.call("estimating-source-reviewer", route, accept)),
  );
  assert.deepEqual(outcomes.map((x) => x.status).sort(), [200, 201]);
  assert.deepEqual(outcomes[0].body, outcomes[1].body);
  const detail = await h.call("coordinator", route + "?id=" + f.package.id);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.current.state, "Accepted");
  assert.equal(detail.body.current.source_status, "Current");
  assert.equal(
    (await h.call("second-company", route + "?id=" + f.package.id)).status,
    404,
  );
  const count = await database().query(
    "SELECT count(*)::int n FROM ppo.project_specialist_events WHERE package_id=$1",
    [f.package.id],
  );
  assert.equal(count.rows[0].n, 3);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.specialist.prepare'",
    [f.owner.actor_id],
  );
  assert.equal(
    (await h.call("coordinator", `operations/${f.package.operation_id}`))
      .status,
    404,
  );
  assert.equal((await h.call("coordinator", route, f.package)).status, 404);
});
