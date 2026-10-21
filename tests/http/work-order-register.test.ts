import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const root = "/api/v1/service/work-orders";
const wo = "90000000-0000-4000-8000-000000000003";
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
  const r = await fetch(origin + root + path, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const content = await r.text();
  return {
    status: r.status,
    headers: r.headers,
    body: r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(content)
      : content,
  };
}
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN Work order HTTP proof",
});

test("Work orders additive HTTP register and record preserve native detail and enforce scoped no-store reads", async () => {
  const cookie = await session("coordinator");
  const original = await call(cookie, `/${wo}`);
  const r = await call(cookie, "/register?limit=1&sort=reference_asc");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control")!, /private, no-store/);
  assert.equal(r.body.count_scope, "AuthorisedCandidateWindow");
  assert.equal(r.body.items.length, 1);
  assert.equal(r.body.next_offset, 1);
  const next = await call(
    cookie,
    "/register?limit=1&sort=reference_asc&offset=1",
  );
  assert.notEqual(next.body.items[0].id, r.body.items[0].id);
  const record = await call(cookie, `/${wo}/record?limit=1`);
  assert.equal(record.status, 200);
  assert.match(record.headers.get("cache-control")!, /private, no-store/);
  assert.equal(
    record.body.work_order.blocker_count,
    original.body.items[0].blockers.length,
  );
  assert.equal(record.body.work_order.version, original.body.items[0].version);
  assert.deepEqual(
    (await call(cookie, `/${wo}`)).body.items,
    original.body.items,
  );
  assert.ok(!JSON.stringify(record.body).includes('"local_object_key"'));
  for (const q of [
    "limit=26",
    "view=secret",
    "q=%00",
    "owner_id=no",
    "unexpected=1",
  ])
    assert.equal((await call(cookie, "/register?" + q)).status, 422);
  assert.equal(
    (await call(cookie, `/${wo}/record?history_offset=-1`)).status,
    422,
  );
  assert.equal((await call(cookie, "/register", {})).status, 405);
});

test("Work order HTTP views receive native create, scope save and visit proposal with exact original replay", async () => {
  const cookie = await session("coordinator");
  const source = (await call(cookie, `/${wo}`)).body.items[0];
  const id = randomUUID();
  const command = {
    ...base(),
    id,
    company_id: source.company_id,
    site_id: source.site_id,
    customer_id: source.customer_id,
    service_owner_id: source.service_owner_id,
    tickets: [
      {
        ticket_id: source.tickets[0].id,
        issue_disposition: "SYN separate HTTP register work",
      },
    ],
  };
  const created = await call(cookie, "", command);
  assert.equal(created.status, 201);
  const replay = await call(cookie, "", command);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  let d = (await call(cookie, `/${id}/record`)).body;
  assert.equal(d.work_order.authorisation, "ScopeNeeded");
  const saved = await call(cookie, `/${id}/save-scope`, {
    ...base(),
    expected_version: d.work_order.version,
    scope: {
      summary: "SYN HTTP register scope",
      exclusions: "No intervention",
      items: [],
    },
  });
  assert.equal(saved.status, 200);
  d = (await call(cookie, `/${id}/record`)).body;
  assert.equal(d.work_order.authorisation, "Blocked");
  assert.ok(d.work_order.blocker_count > 0);
  const visitId = randomUUID();
  const proposal = await call(cookie, `/${id}/visits`, {
    ...base(),
    id: visitId,
    expected_version: d.work_order.version,
    scope_revision_id: d.work_order.scope_revision_id,
    scope_version: d.work_order.scope_version,
    start_at: "2026-11-22T00:00:00Z",
    end_at: "2026-11-22T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  assert.equal(proposal.status, 201);
  d = (await call(cookie, `/${id}/record`)).body;
  assert.equal(d.work_order.next_visit.id, visitId);
  assert.equal(d.work_order.next_visit.scope_review_required, true);
  assert.deepEqual(
    new Set(d.history.items.map((e: { command: string }) => e.command)),
    new Set(["CreateWorkOrder", "SaveScopeDraft", "ProposeVisit"]),
  );
  const register = (
    await call(
      cookie,
      "/register?q=" + d.work_order.display_number + "&view=visit_review",
    )
  ).body;
  assert.equal(register.items[0].id, id);
  assert.equal(register.counts.visit_review, 1);
});

test("Work order HTTP projections do not reveal direct records or counts across identities", async () => {
  assert.equal((await call("", "/register")).status, 401);
  const systems = await session("systems"),
    other = await session("second-company");
  assert.equal((await call(systems, "/register")).status, 403);
  assert.equal((await call(other, `/${wo}/record`)).status, 404);
  assert.equal((await call(other, `/${randomUUID()}/record`)).status, 404);
  const r = await call(other, "/register?q=SYN-WO-000003");
  assert.equal(r.status, 200);
  assert.equal(r.body.items.length, 0);
  assert.equal(r.body.counts.all, 0);
});
