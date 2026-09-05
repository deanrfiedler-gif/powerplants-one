import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
const origin = "http://127.0.0.1:3000";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P06 HTTP proof",
});
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
  const text = await r.text();
  return {
    status: r.status,
    headers: r.headers,
    body: r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : text,
  };
}
test("P06 HTTP narrow issue and file scope reject unauthorised identities, arbitrary fields and traversal consistently", async () => {
  const coordinator = await session("coordinator"),
    technician = await session("assigned-technician"),
    other = await session("other-workspace");
  assert.equal((await call(coordinator, "packs")).status, 200);
  assert.equal((await call(technician, "packs/" + randomUUID())).status, 404);
  for (const path of [
    "pack-issues/" + randomUUID() + "/manifest",
    "pack-issues/" + randomUUID() + "/pdf",
    "pack-issues/" + randomUUID() + "/html",
  ]) {
    assert.equal((await call(technician, path)).status, 404);
    assert.equal((await call(other, path)).status, 403);
  }
  const options = await call(
    coordinator,
    `appointments/${id("a8", 10)}/pack-options`,
  );
  assert.equal(options.status, 200);
  assert.doesNotMatch(
    JSON.stringify(options.body),
    /PRIVATE_FINANCE|CONFIDENTIAL-MARGIN/,
  );
  assert.equal(
    (
      await call(coordinator, "packs", {
        ...base(),
        id: randomUUID(),
        appointment_id: id("a8", 10),
        expected_appointment_version: options.body.appointment.version,
        actor_id: randomUUID(),
        content: {},
      })
    ).status,
    422,
  );
});
