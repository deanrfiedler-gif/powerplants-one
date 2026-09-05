import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { localConfig } from "../../src/platform/config";
const origin = localConfig().origin,
  ticket = "40000000-0000-4000-8000-000000000001";
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  return cookie.split(";")[0];
}
test("HTTP guard, server identity, strict schema and read-only permissions", async () => {
  const root = await fetch(origin);
  assert.equal(root.status, 200);
  assert.match(root.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(
    (await fetch(`${origin}/api/v1/service/tickets/${ticket}`)).status,
    401,
  );
  const rejected_headers: Record<string, string>[] = [
    { "X-Forwarded-For": "127.0.0.1" },
    { Origin: "https://remote.example" },
    { Host: "remote.example" },
    { "X-PPO-Local-Gateway": "forged" },
  ];
  for (const headers of rejected_headers)
    assert.equal((await fetch(origin, { headers })).status, 403);
  assert.equal(
    (
      await fetch(`${origin}/api/v1/local-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"profile":"coordinator"}',
      })
    ).status,
    403,
  );
  const cookie = await session("coordinator"),
    get = await fetch(`${origin}/api/v1/service/tickets/${ticket}`, {
      headers: { Cookie: cookie, "X-Role": "Systems" },
    });
  assert.equal(get.status, 200);
  const view = (await get.json()).items[0];
  assert.equal(view.synthetic, true);
  assert.equal(view.can_edit, true);
  const c = {
    operation_id: randomUUID(),
    expected_version: view.version,
    schema_version: 1,
    summary: "SYN HTTP verification",
    reason: "Verify the actual route and database",
  };
  const post = (body: unknown, auth = cookie) =>
    fetch(`${origin}/api/v1/service/tickets/${ticket}/save-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Cookie: auth,
      },
      body: JSON.stringify(body),
    });
  const first = await post(c);
  assert.equal(first.status, 200);
  const receipt = await first.json();
  assert.equal(receipt.record_version, view.version + 1);
  assert.deepEqual(await (await post(c)).json(), receipt);
  assert.equal(
    (await post({ ...c, summary: "Conflicting retry" })).status,
    409,
  );
  assert.equal((await post({ ...c, operation_id: randomUUID() })).status, 409);
  const observer = await session("observer");
  assert.equal(
    (
      await post(
        {
          ...c,
          operation_id: randomUUID(),
          expected_version: receipt.record_version,
        },
        observer,
      )
    ).status,
    403,
  );
  assert.equal(
    (await post({ ...c, role: "Coordinator" }, observer)).status,
    422,
  );
  for (const id of [
    "40000000-0000-4000-8000-000000000002",
    "40000000-0000-4000-8000-000000000003",
  ]) {
    const r = await fetch(`${origin}/api/v1/service/tickets/${id}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(r.status, 404);
    assert.doesNotMatch(await r.text(), /Restricted synthetic request/);
  }
  const invalid = await fetch(
    `${origin}/api/v1/service/tickets/${ticket}/save-draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Cookie: cookie,
      },
      body: "{",
    },
  );
  assert.equal(invalid.status, 422);
});
