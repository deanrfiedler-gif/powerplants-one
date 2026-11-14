import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { warrantyReturnFixture } from "../helpers/warranty-supply-return";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
after(closeDatabase);
async function login(profile = "coordinator") {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(
  cookie: string,
  path: string,
  body?: unknown,
  from = origin,
) {
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { cookie, origin: from, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    cache: response.headers.get("cache-control"),
    body: response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : await response.text(),
  };
}
test("MA07-SC08 HTTP prepares once, scopes reads, rejects foreign origin and recovers both original operations", async () => {
  const f = await warrantyReturnFixture(),
    cookie = await login(),
    observer = await login("observer"),
    other = await login("other-workspace");
  const route = `warranty/supplier-recovery/${f.claimId}/prepare-return`;
  assert.equal(
    (await call(cookie, route, f.cmd, "https://invalid.example")).status,
    403,
  );
  assert.equal((await call(observer, route, f.cmd)).status, 404);
  assert.equal((await call(other, route, f.cmd)).status, 404);
  const first = await call(cookie, route, f.cmd);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.match(first.cache ?? "", /no-store/);
  assert.deepEqual((await call(cookie, route, f.cmd)).body, first.body);
  assert.deepEqual(
    (await call(cookie, `operations/${f.cmd.operation_id}`)).body,
    first.body,
  );
  assert.equal(
    (await call(cookie, `supply/operations/${f.cmd.supply_operation_id}`)).body
      .record_id,
    f.cmd.return_id,
  );
  assert.equal(
    (await call(cookie, route, { ...f.cmd, quantity: "1" })).status,
    409,
  );
  assert.equal(
    (
      await call(cookie, route, {
        ...f.cmd,
        operation_id: randomUUID(),
        expected_version: 3,
        return_id: randomUUID(),
        supply_operation_id: randomUUID(),
      })
    ).status,
    409,
  );
  const detail = await call(cookie, `warranty/supplier-recovery/${f.claimId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.sources.sc08.stage, "Prepared");
  assert.equal(detail.body.sources.sc08.supply_return_id, f.cmd.return_id);
  const page = await fetch(origin + detail.body.sources.sc08.href, {
    headers: { cookie },
    redirect: "manual",
  });
  assert.equal(
    page.status,
    200,
    "Receiving handover opens an existing native Supply page",
  );
  assert.equal(
    (await call(other, `warranty/supplier-recovery/${f.claimId}`)).status,
    404,
  );
  assert.equal(
    (await call(other, `supply/records/${f.cmd.return_id}`)).status,
    403,
  );
  const receiving = await call(cookie, `supply/records/${f.cmd.return_id}`);
  assert.equal(receiving.status, 200);
  assert.equal(receiving.body.record.kind, "Return");
  assert.equal(receiving.body.current_facts.length, 0);
});
