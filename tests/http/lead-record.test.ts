import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { crmAction, crmBase } from "../helpers/crm";
import { leadCreate, leadConvert } from "../helpers/leads";

const origin = process.env.PPO_TEST_ORIGIN ?? `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile = "coordinator") {
  const response = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const response = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: await response.json(),
  };
}

test("LREC HTTP detail reads expose scoped summary and readiness through native plan, completion and conversion", async () => {
  const cookie = await session(),
    lead = { ...leadCreate(), title: `SYN Record HTTP ${randomUUID()}` };
  assert.equal((await call(cookie, "crm/leads", lead)).status, 201);
  const path = `crm/leads/${lead.id}`;
  let response = await call(cookie, path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  assert.equal(response.body.conversion_readiness.state, "NeedsAttention");
  assert.equal(response.body.record_summary.last_activity, null);
  assert.equal(response.body.record_summary.age_days, 0);
  const action = {
    ...crmAction(),
    due_at: "2000-01-01T00:00:00.000Z",
    due_needed: false,
  };
  assert.equal(
    (
      await call(cookie, `${path}/next-action`, {
        ...crmBase(),
        expected_version: 1,
        activity_id: null,
        new_action: action,
      })
    ).status,
    200,
  );
  response = await call(cookie, path);
  assert.equal(response.body.conversion_readiness.state, "ReadyForReview");
  assert.equal(response.body.record_summary.lead_version, 2);
  assert.equal(response.body.record_summary.next_action_state, "Overdue");
  assert.equal(response.body.record_summary.last_activity.id, action.id);
  assert.equal(
    (await call(cookie, `${path}/convert`, leadConvert(1, action.id))).status,
    409,
  );
  assert.equal(
    (
      await call(cookie, `activities/${action.id}/complete`, {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN HTTP discussion complete",
      })
    ).status,
    200,
  );
  response = await call(cookie, path);
  assert.equal(response.body.conversion_readiness.state, "NeedsAttention");
  assert.equal(response.body.record_summary.next_action_state, "Needed");
  assert.equal(response.body.record_summary.last_activity.status, "Completed");
  assert.equal(
    (await call(cookie, `${path}/convert`, leadConvert(2))).status,
    200,
  );
  response = await call(cookie, path);
  assert.equal(response.body.conversion_readiness.state, "NotApplicable");
  assert.equal(response.body.conversion_readiness.lifecycle, "Converted");
  assert(response.body.deal.id);
  assert.equal((await fetch(`${origin}/api/v1/${path}`)).status, 401);
  for (const profile of ["second-company", "other-workspace", "systems"]) {
    const denied = await call(await session(profile), path);
    assert([403, 404].includes(denied.status));
    assert.equal(denied.body.record_summary, undefined);
    assert.equal(denied.body.conversion_readiness, undefined);
  }
});
