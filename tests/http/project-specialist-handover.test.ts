import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  specialistHandoverFixture,
  handoverAction,
} from "../helpers/project-specialist-handover";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("PJ06-R2 compiled native receiving API, uncertain response recovery, concurrent acceptance and source privacy", async () => {
  const f = await specialistHandoverFixture(),
    h = httpAcceptance(localConfig().origin),
    route = `engineering/${f.engineering.id}/materials/handover`,
    id = f.prepare.id;
  const cookie = await h.cookie("coordinator");
  const lost = await fetch(localConfig().origin + "/api/v1/" + route, {
    method: "POST",
    headers: {
      cookie,
      origin: localConfig().origin,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(f.prepare),
  });
  assert.equal(lost.status, 201);
  assert.equal(lost.headers.get("cache-control"), "private, no-store");
  await lost.body?.cancel();
  const receipt = await h.call(
    "coordinator",
    `operations/${f.prepare.operation_id}`,
  );
  assert.equal(receipt.status, 200);
  assert.deepEqual(
    (await h.call("coordinator", route, f.prepare)).body,
    receipt.body,
  );
  assert.equal(
    (
      await h.call(
        "coordinator",
        route,
        handoverAction({
          action: "send",
          handover_id: id,
          expected_version: 1,
        }),
      )
    ).status,
    201,
  );
  const decide = handoverAction({
    action: "decide",
    handover_id: id,
    expected_version: 2,
    result: "Accepted",
  });
  const results = await Promise.all(
    [1, 2].map(() => h.call("materials-supply", route, decide)),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.deepEqual(results[0].body, results[1].body);
  const detail = await h.call(
    "materials-supply",
    `${route}?set=${f.set}&handover_id=${id}`,
  );
  assert.equal(detail.status, 200);
  assert.equal(detail.body.selected.state, "Accepted");
  assert.equal(detail.body.selected.payload.specialist.id, f.package.id);
  assert.equal(detail.body.selected.payload.lines[0].procurement.quantity, "4");
  assert.equal(
    (await h.call("second-company", `${route}?set=${f.set}&handover_id=${id}`))
      .status,
    404,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.specialist.read'",
    [f.receiver.actor_id],
  );
  assert.equal(
    (
      await h.call(
        "materials-supply",
        `${route}?set=${f.set}&handover_id=${id}`,
      )
    ).status,
    404,
  );
  assert.deepEqual(
    (await h.call("materials-supply", `${route}?set=${f.set}`)).body.items,
    [],
  );
  assert.equal(
    (await h.call("materials-supply", `operations/${decide.operation_id}`))
      .status,
    404,
  );
});
