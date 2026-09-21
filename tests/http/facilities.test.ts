import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN CS-05 HTTP boundary",
});
async function session(profile: string) {
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
  requestOrigin = origin,
) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie,
      origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  return {
    status: r.status,
    body: r.headers.get("content-type")?.includes("application/json")
      ? await r.json()
      : await r.text(),
  };
}
test("CS05 HTTP preserves legacy envelopes, bounds preview, rejects forged context, replays exact originals and resolves nested IDs", async () => {
  const p = await session("coordinator"),
    other = await session("other-workspace"),
    id = randomUUID(),
    site = "70000000-0000-4000-8000-000000000001",
    company = "20000000-0000-4000-8000-000000000001";
  const legacy = {
    ...base(),
    id,
    site_id: site,
    company_id: company,
    name: "SYN HTTP legacy",
  };
  assert.equal((await call(p, "facilities", legacy)).status, 201);
  const old = await call(p, `facilities/${id}`);
  assert.equal(old.body.items[0].name, legacy.name);
  assert.equal(old.body.source, "Synthetic");
  assert.equal(
    (await call(p, "facilities", { ...legacy, details: {} })).status,
    422,
  );
  const input = {
    ...base(),
    id: randomUUID(),
    site_id: site,
    company_id: company,
    details: {
      name: "SYN HTTP rich",
      structure_type: "unknown",
      type_unknown_reason: "Not established",
    },
  };
  const create = await call(p, "facilities/create-details", input);
  assert.equal(create.status, 201);
  assert.deepEqual(
    (await call(p, "facilities/create-details", input)).body,
    create.body,
  );
  const previewBody = {
    expected_version: 1,
    changes: { structure_type: "unknown", detail_notes: "SYN review" },
  };
  const preview = await call(
    p,
    `facilities/${input.id}/preview-change`,
    previewBody,
  );
  assert.equal(preview.status, 200);
  assert.equal(
    (await call(p, `facilities/${input.id}/workspace`)).body.version,
    1,
  );
  assert.equal(
    (
      await call(
        p,
        `facilities/${input.id}/preview-change`,
        previewBody,
        "https://example.invalid",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(p, `facilities/${input.id}/preview-change`, {
        ...previewBody,
        changes: { structure_type: "unknown", detail_notes: "x".repeat(66000) },
      })
    ).body.code,
    "PayloadTooLarge",
  );
  assert.equal(
    (
      await call(p, `facilities/${input.id}/preview-change`, {
        ...previewBody,
        operation_id: randomUUID(),
      })
    ).status,
    422,
  );
  const command = { ...base(), ...previewBody };
  const accepted = await call(p, `facilities/${input.id}/revise`, command);
  assert.equal(accepted.status, 200);
  assert.deepEqual(
    (await call(p, `operations/${command.operation_id}`)).body,
    accepted.body,
  );
  assert.equal(
    (
      await call(p, `facilities/${input.id}/revise`, {
        ...command,
        reason: "changed",
      })
    ).body.code,
    "OperationConflict",
  );
  const fail = await call(other, `facilities/${input.id}/workspace`);
  assert.equal(fail.status, 404);
  for (const field of [
    "code",
    "message",
    "field_errors",
    "correlation_id",
    "retryable",
  ])
    assert.ok(Object.hasOwn(fail.body, field));
  assert.equal(
    (
      await call(
        p,
        `assets/80000000-0000-4000-8000-000000000001/served-facilities/not-a-uuid/end`,
        { ...base(), expected_version: 1 },
      )
    ).status,
    422,
  );
});
