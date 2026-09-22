import assert from "node:assert/strict";
import { test } from "node:test";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
test("SH HTTP routes require identity, retain private cache policy and validate personal mutations", async () => {
  for (const path of ["search?q=SYN", "notifications", "reviews", "views"])
    assert.equal((await fetch(`${origin}/api/v1/${path}`)).status, 401);
  const session = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile: "coordinator" }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  for (const path of [
    "search?q=SYN",
    "notifications",
    "reviews?view=all",
    "views",
    "notifications/preferences",
  ]) {
    const response = await fetch(`${origin}/api/v1/${path}`, {
      headers: { cookie },
    });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  const denied = await fetch(`${origin}/api/v1/notifications/state`, {
    method: "POST",
    headers: {
      cookie,
      origin: "https://example.invalid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "read", items: [] }),
  });
  assert.equal(denied.status, 403);
  const malformed = await fetch(`${origin}/api/v1/notifications/state`, {
    method: "POST",
    headers: { cookie, origin, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve", items: [] }),
  });
  assert.equal(malformed.status, 422);
  for (const path of [
    "notifications/00000000-0000-4000-8000-000000000001",
    "search/preview?kind=Activity&id=00000000-0000-4000-8000-000000000001",
  ])
    assert.equal(
      (await fetch(`${origin}/api/v1/${path}`, { headers: { cookie } })).status,
      404,
    );
});
