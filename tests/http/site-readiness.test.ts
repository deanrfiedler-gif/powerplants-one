import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { preparedGateVisit } from "../helpers/readiness-gate";
import { nextWorkingVisit, siteContactInput } from "../helpers/site-readiness";
import { rows } from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database only");
after(closeDatabase);
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}
test("P4 HTTP records typed evidence, recovers the original and enforces current authority", async () => {
  const f = await preparedGateVisit(nextWorkingVisit()),
    co = await session("coordinator"),
    reader = await session("assigned-technician"),
    other = await session("second-company");
  const path = `appointments/${f.aid}`,
    before = await call(co, path);
  assert.equal(before.status, 200);
  assert.match(before.headers.get("cache-control")!, /private, no-store/);
  assert.equal(before.body.items[0].preparation.outcome, "Unknown");
  const cmd = siteContactInput(before.body.items[0].version);
  assert.equal((await call(reader, path + "/contacts", cmd)).status, 403);
  assert.equal((await call(other, path + "/contacts", cmd)).status, 404);
  assert.equal(
    (
      await call(co, path + "/contacts", {
        ...cmd,
        site_checks: { access: { status: "Confirmed" } },
      })
    ).status,
    422,
  );
  assert.equal(
    (await call(co, path + "/contacts", { ...cmd, purpose: "DateAgreement" }))
      .status,
    422,
  );
  const [one, two] = await Promise.all([
    call(co, path + "/contacts", cmd),
    call(co, path + "/contacts", cmd),
  ]);
  assert.deepEqual([one.status, two.status].sort((a,b) => a-b), [200,201], JSON.stringify([one.body,two.body]));
  assert.deepEqual(one.body, two.body);
  assert.deepEqual(
    (await call(co, `operations/${cmd.operation_id}`)).body,
    one.body,
  );
  const current = (await call(co, path)).body.items[0];
  assert.equal(current.preparation.outcome, "Pass");
  assert.equal(
    current.customer_commitment,
    before.body.items[0].customer_commitment,
  );
  assert.equal(
    (await call(co, path + "/contacts", { ...cmd, reason: "Changed request" }))
      .status,
    409,
  );
  const absent = await call(other, `appointments/${randomUUID()}`),
    hidden = await call(other, path);
  assert.equal(hidden.status, 404);
  assert.equal(absent.status, 404);
  for (const response of [hidden, absent])
    assert.match(response.body.correlation_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(hidden.body.correlation_id, absent.body.correlation_id);
  // Each request has its own correlation identity; the public refusal is identical.
  assert.deepEqual({ ...hidden.body, correlation_id: null }, { ...absent.body, correlation_id: null });
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.contact'",
    [f.co.actor_id],
  );
  assert.equal((await call(co, path + "/contacts", cmd)).status, 403);
  assert.equal(
    (await rows("SELECT 1 FROM ppo.contact_outcomes WHERE id=$1", [cmd.id]))
      .length,
    1,
  );
});
