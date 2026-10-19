import assert from "node:assert/strict";
import { test } from "node:test";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function read(cookie: string, path: string) {
  return fetch(origin + "/api/v1/" + path, { headers: { cookie, origin } });
}
test("CS01 HTTP bounded register validates signed scope and keeps source restriction explicit", async () => {
  const cookie = await session("coordinator");
  const first = await read(cookie, "customers/register?limit=1");
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control") ?? "", /no-store/);
  const value = await first.json();
  assert.equal(value.items.length, 1);
  assert.ok(value.next_cursor);
  const next = await read(
    cookie,
    `customers/register?${new URLSearchParams({ limit: "1", cursor: value.next_cursor })}`,
  );
  assert.equal(next.status, 200);
  assert.notEqual((await next.json()).items[0].id, value.items[0].id);
  const changed = await read(
    cookie,
    `customers/register?${new URLSearchParams({ limit: "1", view: "Inactive", cursor: value.next_cursor })}`,
  );
  assert.equal(changed.status, 422);
  const invalid = await read(cookie, "customers/register?limit=100000");
  assert.equal(invalid.status, 422);
  const other = await session("other-workspace");
  const otherPage = await read(
    other,
    `customers/register?${new URLSearchParams({ limit: "1", cursor: value.next_cursor })}`,
  );
  assert.equal(otherPage.status, 422);
  const observer = await session("site-observer"),
    limited = await read(observer, "customers/register");
  assert.equal(limited.status, 200);
  const scoped = await limited.json();
  assert.ok(scoped.items.every((i: { deals: unknown }) => i.deals === null));
  const workspace = await read(
    cookie,
    `customers/${value.items[0].id}/workspace`,
  );
  assert.equal(workspace.status, 200);
  const body = await workspace.json();
  assert.equal(body.sections.accounts.state, "Restricted");
  assert.deepEqual(body.sections.accounts.items, []);
});
