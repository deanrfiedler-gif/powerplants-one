import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
const origin = "http://127.0.0.1:3000",
  company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001",
  owner = "30000000-0000-4000-8000-000000000001";
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
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN HTTP P03 verification",
});
test("actual P03 HTTP create/edit/clarification/triage routes enforce envelopes, immutable replay and activity atomicity", async () => {
  const cookie = await session("coordinator"),
    id = randomUUID();
  const created = await call(cookie, "service/tickets", {
    ...base(),
    id,
    company_id: company,
    summary: "SYN HTTP complete intake",
    symptom: "First line\nSecond line",
    received_at: "2026-09-04T00:00:00Z",
    channel: "Manual",
    requester_id: "60000000-0000-4000-8000-000000000001",
    requester_description: null,
    site_id: site,
    site_identification_needed: false,
    asset_id: null,
    impact: "Monitoring",
    priority: "Urgent",
    priority_reason: "No work authority",
    triage_owner_id: owner,
    next_action: "Clarify remaining question",
  });
  assert.equal(created.status, 201);
  const op = {
    ...base(),
    expected_version: 1,
    open_questions: "Confirm reported context",
    next_action: "Review clarification outcome",
    follow_up: {
      id: randomUUID(),
      owner_id: owner,
      due_at: null,
      due_needed: true,
    },
  };
  const requested = await call(
    cookie,
    `service/tickets/${id}/request-information`,
    op,
  );
  assert.equal(requested.status, 200);
  assert.equal(requested.body.state, "NeedsInformation");
  assert.deepEqual(
    (await call(cookie, `service/tickets/${id}/request-information`, op)).body,
    requested.body,
  );
  const activity = await call(cookie, `activities/${op.follow_up.id}`);
  assert.equal(activity.status, 200);
  assert.equal(activity.body.items[0].links[0].object_id, id);
  assert.equal(
    (
      await call(cookie, `activities/${op.follow_up.id}/complete`, {
        ...base(),
        expected_version: 1,
        outcome: "Question answered; simulated manual contact only",
      })
    ).status,
    200,
  );
  const triage = await call(cookie, `service/tickets/${id}/triage`, {
    ...base(),
    expected_version: 2,
    clarification_outcome: "Context clarified",
  });
  assert.equal(triage.status, 200);
  assert.equal(triage.body.state, "Triaged");
  const detail = await call(cookie, `service/tickets/${id}`);
  assert.equal(detail.body.completeness, "Complete");
  assert.equal(detail.body.items[0].status, "Triaged");
  assert.match(detail.headers.get("cache-control")!, /private, no-store/);
  assert.equal(
    (await call(cookie, `operations/${triage.body.operation_id}`)).status,
    200,
  );
});
test("P03 HTTP read/filter/owner/link paths refuse unauthorised scope and do not project restricted content", async () => {
  const cookie = await session("site-observer"),
    systems = await session("systems");
  assert.equal((await call(cookie, "work")).status, 200);
  assert.equal((await call(systems, "work")).status, 403);
  assert.equal(
    (await call(cookie, "service/tickets/40000000-0000-4000-8000-000000000001"))
      .status,
    404,
  );
  const customer = await call(
    cookie,
    "customers/50000000-0000-4000-8000-000000000001",
  );
  assert.equal(customer.status, 200);
  assert.ok(!JSON.stringify(customer.body).includes("000Ab-C.01"));
  assert.equal(
    (
      await call(
        cookie,
        "selectors/owners?company_id=20000000-0000-4000-8000-000000000002&purpose=Activity",
      )
    ).status,
    404,
  );
  assert.equal(
    (await call(cookie, "activities/85000000-0000-4000-8000-000000000006"))
      .status,
    404,
  );
  assert.equal(
    (
      await call(cookie, "activities", {
        ...base(),
        id: randomUUID(),
        company_id: company,
        site_id: site,
        owner_id: owner,
        kind: "TechnicalFollowUp",
        summary: "Forbidden write",
        due_at: null,
        due_needed: true,
        access_class: "RestrictedService",
        links: [{ object_type: "Site", object_id: site }],
      })
    ).status,
    403,
  );
  assert.equal((await call(cookie, "work?role=Coordinator")).status, 422);
});
