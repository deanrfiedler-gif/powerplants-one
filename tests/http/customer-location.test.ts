import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`,
  company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN native CS HTTP proof",
});
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
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
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      cookie,
      origin: requestOrigin,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const type = r.headers.get("content-type") ?? "";
  return {
    status: r.status,
    private: r.headers.get("cache-control") ?? "",
    body: type.includes("application/json") ? await r.json() : await r.text(),
  };
}
test("CS02 HTTP direct correction uses server scope and exact original receipt; restricted contact projection is not empty", async () => {
  const p = await session("coordinator"),
    limited = await session("site-observer"),
    other = await session("other-workspace"),
    id = randomUUID();
  assert.equal(
    (
      await call(p, "people", {
        ...base(),
        id,
        company_ids: [company],
        display_name: "SYN HTTP contact",
      })
    ).status,
    201,
  );
  const command = {
    ...base(),
    expected_version: 1,
    display_name: "SYN HTTP corrected",
    email: null,
    phone: null,
    contact_preference: null,
    active: true,
  };
  assert.equal(
    (await call(limited, `people/${id}/revise`, command)).status,
    404,
  );
  assert.equal((await call(other, `people/${id}/workspace`)).status, 404);
  const first = await call(p, `people/${id}/revise`, command);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.match(first.private, /no-store/);
  assert.deepEqual(
    (await call(p, `people/${id}/revise`, command)).body,
    first.body,
  );
  assert.equal(
    (
      await call(p, `people/${id}/revise`, {
        ...command,
        display_name: "Forged reuse",
      })
    ).status,
    409,
  );
  assert.equal(
    (await call(p, `people/${id}/revise`, { ...command, ...base() })).status,
    409,
  );
  assert.deepEqual(
    (await call(p, `operations/${command.operation_id}`)).body,
    first.body,
  );
  assert.equal(
    (await call(p, `people/${id}/revise`, command, "https://unrelated.invalid"))
      .status,
    403,
  );
  const map = await call(
    limited,
    "customers/50000000-0000-4000-8000-000000000001/stakeholders",
  );
  assert.equal(map.status, 200);
  assert.equal(map.body.affiliations.state, "Restricted");
  assert.deepEqual(map.body.affiliations.items, []);
});
test("CS08 HTTP rejects forged Site/workspace/read-only writes and provides immutable submitted review handover", async () => {
  const p = await session("coordinator"),
    limited = await session("site-observer"),
    other = await session("other-workspace"),
    reviewer = await session("cs-reviewer"),
    id = randomUUID(),
    owner = "30000000-0000-4000-8000-000000000001";
  const create = {
    ...base(),
    id,
    context_id: site,
    name: "SYN HTTP survey",
    owner_id: owner,
  };
  assert.equal((await call(limited, "cs/Survey", create)).status, 404);
  assert.equal((await call(p, "cs/Survey", create)).status, 201);
  const unscoped = await call(p, `cs/Survey/${id}/actions`, {
    ...base(),
    expected_version: 1,
    action: "submit",
  });
  assert.equal(unscoped.status, 422);
  assert.ok(unscoped.body.field_errors.some((e: { field: string }) => e.field === "purpose"));
  assert.equal((await call(other, `cs/Survey/${id}`)).status, 404);
  const content = {
    schema_version: 1,
    purpose: "SYN exact Site brief",
    facility_ids: [],
    asset_ids: [],
    observations: [
      {
        id: randomUUID(),
        title: "SYN water line",
        kind: "Observed",
        facility_id: null,
        asset_id: null,
        value: null,
        unit: null,
        detail: "SYN photographed location",
        observer: "SYN observer",
        captured_on: "2026-09-20",
        method_source: "SYN visual check",
        significant: true,
        insignificant_reason: null,
        activity_id: null,
      },
    ],
  };
  const save = {
    ...base(),
    expected_version: 1,
    name: create.name,
    owner_id: owner,
    content,
  };
  assert.equal((await call(limited, `cs/Survey/${id}/save`, save)).status, 404);
  assert.equal(
    (await call(p, `cs/Survey/${id}/save`, { ...save, site_id: randomUUID() }))
      .status,
    422,
  );
  assert.equal((await call(p, `cs/Survey/${id}/save`, save)).status, 200);
  const submit = { ...base(), expected_version: 2, action: "submit" };
  assert.equal((await call(p, `cs/Survey/${id}/actions`, submit)).status, 200);
  const current = await call(p, `cs/Survey/${id}`);
  assert.equal(current.body.record.state, "Submitted");
  const snapshot = current.body.snapshots[0],
    review = {
      ...base(),
      expected_version: 3,
      action: "review",
      snapshot_id: snapshot.id,
    };
  assert.equal((await call(p, `cs/Survey/${id}/actions`, review)).status, 409);
  assert.equal(
    (await call(reviewer, `cs/Survey/${id}/actions`, review)).status,
    200,
  );
  const handover = {
    ...base(),
    expected_version: 4,
    action: "handover",
    snapshot_id: snapshot.id,
    destination: "Engineering",
    receiving_owner_id: owner,
  };
  assert.equal(
    (await call(p, `cs/Survey/${id}/actions`, handover)).status,
    200,
  );
  assert.equal(
    (await call(p, `cs/Survey/${id}/actions`, handover)).status,
    200,
  );
  const done = await call(p, `cs/Survey/${id}`);
  assert.equal(
    done.body.events.filter((e: { kind: string }) => e.kind === "Handover")
      .length,
    1,
  );
  assert.equal(done.body.snapshots[0].content_hash, snapshot.content_hash);
});
