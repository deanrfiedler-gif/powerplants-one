import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { projectInput } from "../helpers/projects";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";

const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
async function session(profile = "coordinator") {
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
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, headers: r.headers, body: await r.json() };
}

test("EN01 HTTP native coordination feeds sorted scoped counts and invalidates stale continuation", async () => {
  const cookie = await session(),
    project = projectInput();
  assert.equal((await call(cookie, "projects", project)).status, 201);
  const marker = "SYN EN01 HTTP " + randomUUID();
  const a = {
    ...engineeringInput(project.id),
    title: marker + " A",
    required_date: "2099-01-01",
  };
  const b = {
    ...engineeringInput(project.id),
    title: marker + " B",
    required_date: "2000-01-01",
  };
  for (const input of [a, b])
    assert.equal((await call(cookie, "engineering", input)).status, 201);
  const query = new URLSearchParams({ q: marker, limit: "1" });
  const path = "engineering/register?" + query;
  const first = await call(cookie, path);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.match(first.headers.get("cache-control")!, /no-store/);
  assert.equal(first.body.counts.all, 2);
  assert.equal(first.body.counts.attention, 1);
  assert.equal(first.body.items[0].id, b.id);
  assert(first.body.next_cursor);
  const second = await call(
    cookie,
    path + "&cursor=" + encodeURIComponent(first.body.next_cursor),
  );
  assert.equal(second.body.items[0].id, a.id);
  assert.equal(second.body.next_cursor, null);
  const command = {
    ...engineeringUpdate(),
    state: "Awaiting information",
    blocker: "SYN exact input is missing",
  };
  assert.equal(
    (await call(cookie, `engineering/${a.id}/coordination`, command)).status,
    201,
  );
  assert.equal(
    (await call(cookie, `engineering/${a.id}/coordination`, command)).status,
    200,
  );
  assert.equal(
    (
      await call(
        cookie,
        path + "&cursor=" + encodeURIComponent(first.body.next_cursor),
      )
    ).status,
    422,
  );
  const refreshed = await call(cookie, path);
  assert.equal(refreshed.body.counts.states["Awaiting information"], 1);
  assert.equal(refreshed.body.counts.attention, 2);
  const detail = await call(cookie, `engineering/${a.id}`);
  assert.equal(detail.body.package.version, 2);
  assert.equal(detail.body.events.length, 2);
  const old = await call(cookie, "engineering?" + query);
  assert.equal(old.status, 200);
  assert(!("counts" in old.body));
  const outsider = await call(await session("second-company"), path);
  assert.equal(outsider.body.counts.all, 0);
  assert.deepEqual(outsider.body.engineers.items, []);
  assert.deepEqual(outsider.body.items, []);
});

test("EN01 HTTP register refuses missing identity, denied scope, malformed queries and writes", async () => {
  assert.equal(
    (await fetch(origin + "/api/v1/engineering/register")).status,
    401,
  );
  assert.equal(
    (await call(await session("systems"), "engineering/register")).status,
    403,
  );
  assert.equal(
    (await call(await session("other-workspace"), "engineering/register"))
      .status,
    403,
  );
  const cookie = await session();
  for (const query of [
    "sort=Anything",
    "limit=101",
    "cursor=forged",
    "state=Released",
    "company_id=wrong",
    "owner_id=bad",
  ])
    assert.equal(
      (await call(cookie, "engineering/register?" + query)).status,
      422,
      query,
    );
  assert.equal(
    (
      await fetch(origin + "/api/v1/engineering/register", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: "{}",
      })
    ).status,
    405,
  );
});
