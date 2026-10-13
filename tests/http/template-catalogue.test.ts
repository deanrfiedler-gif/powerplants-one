import assert from "node:assert/strict";
import { after, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { prepared, id } from "../helpers/packs";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
test("DK06 compiled GET catalogue, exact definition and native usage preserve permissions and reject mutation", async () => {
  await reset();
  const pack = await prepared(),
    origin = localConfig().origin,
    h = httpAcceptance(origin);
  const path = "document-templates",
    tid = id("c1", 2),
    family = "family=OUT-09";
  const first = await h.call("coordinator", `${path}?${family}&limit=1`);
  assert.equal(first.status, 200);
  assert.equal(first.body.items[0].version, 1);
  assert.equal(first.body.completeness, "Partial");
  const next = await h.call(
    "coordinator",
    `${path}?${family}&limit=1&cursor=${encodeURIComponent(first.body.next_cursor)}`,
  );
  assert.equal(next.body.items[0].id, tid);
  const detail = await h.call("coordinator", `${path}/${tid}?${family}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.runtime_support, "Supported");
  assert.equal(detail.body.dependencies.items.length, 9);
  const usage = await h.call(
    "coordinator",
    `${path}/${tid}/usage?${family}&kind=PackRevision`,
  );
  assert.equal(usage.status, 200);
  assert.equal(usage.body.items[0].record_id, pack.id);
  assert.equal(usage.body.items[0].exact_definition_match, true);
  const crew = await h.call(
    "assigned-technician",
    `${path}/${tid}/usage?${family}&kind=PackRevision`,
  );
  assert.equal(crew.status, 200);
  assert.deepEqual(crew.body.items, []);
  assert.equal(
    (await h.call("coordinator", `${path}?family=OUT-14`)).status,
    403,
  );
  assert.equal((await h.call("finance", `${path}?family=OUT-14`)).status, 200);
  assert.equal(
    (await h.call("coordinator", `${path}/${id("e1", 2)}?${family}`)).status,
    404,
  );
  assert.equal(
    (await h.call("coordinator", `${path}?${family}&limit=51`)).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", `${path}/${tid}?${family}&publish=true`))
      .status,
    422,
  );
  const session = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  for (const target of [path, `${path}/${tid}`, `${path}/${tid}/usage`]) {
    const response = await fetch(`${origin}/api/v1/${target}?${family}`, {
      method: "POST",
      headers: { cookie, origin, "Content-Type": "application/json" },
      body: JSON.stringify({ publish: true }),
    });
    assert.equal(response.status, 405);
  }
});
