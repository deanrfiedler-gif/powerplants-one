import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { crmAction, crmBase } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";

const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
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

test("LR HTTP counts and filtered pages follow native next-action completion with exact detail DTOs", async () => {
  const cookie = await session(),
    marker = `SYN LR HTTP ${randomUUID()}`;
  const missing = {
    ...leadCreate(),
    title: marker + " A",
    source_channel: "Email",
  };
  const overdue = {
    ...leadCreate(),
    title: marker + " B",
    source_channel: "Email",
  };
  for (const lead of [missing, overdue])
    assert.equal((await call(cookie, "crm/leads", lead)).status, 201);
  const action = {
    ...crmAction(),
    due_at: "2000-01-01T00:00:00.000Z",
    due_needed: false,
  };
  assert.equal(
    (
      await call(cookie, `crm/leads/${overdue.id}/next-action`, {
        ...crmBase(),
        expected_version: 1,
        activity_id: null,
        new_action: action,
      })
    ).status,
    200,
  );
  const query = new URLSearchParams({
    q: marker,
    source: "Email",
    owner_id: missing.owner_id,
  });
  const count = await call(cookie, `crm/leads/counts?${query}`);
  assert.equal(count.status, 200);
  assert.match(count.headers.get("cache-control")!, /no-store/);
  assert.equal(count.body.count_scope, "AllAuthorisedMatches");
  assert.equal(count.body.counts.Active, 2);
  assert.equal(count.body.counts.MyLeads, 2);
  assert.equal(count.body.counts.Overdue, 1);
  assert.equal(count.body.counts.NextActionNeeded, 1);
  assert.equal(count.body.follow_up_completeness, "Complete");
  const page = await call(cookie, `crm/leads?${query}&limit=1&sort=Name`);
  assert.equal(page.status, 200);
  assert.equal(page.body.items.length, 1);
  assert(page.body.next_cursor);
  const second = await call(
    cookie,
    `crm/leads?${query}&limit=1&sort=Name&cursor=${encodeURIComponent(page.body.next_cursor)}`,
  );
  assert.deepEqual(
    [page.body.items[0].id, second.body.items[0].id],
    [missing.id, overdue.id],
  );
  const filtered = await call(
    cookie,
    `crm/leads?${query}&follow_up=Overdue&view=MyLeads`,
  );
  assert.deepEqual(
    filtered.body.items.map((l: { id: string }) => l.id),
    [overdue.id],
  );
  const detail = await call(cookie, `crm/leads/${overdue.id}`);
  assert.deepEqual(
    filtered.body.items[0].next_activity,
    detail.body.next_activity,
  );
  assert.equal(
    (
      await call(cookie, `activities/${action.id}/complete`, {
        ...crmBase(),
        expected_version: 1,
        outcome: "SYN Follow-up complete through HTTP",
      })
    ).status,
    200,
  );
  const refreshed = await call(cookie, `crm/leads/counts?${query}`);
  assert.equal(refreshed.body.counts.Overdue, 0);
  assert.equal(refreshed.body.counts.NextActionNeeded, 2);
  assert.equal(
    (await call(cookie, `crm/leads?${query}&follow_up=NextActionNeeded`)).body
      .items.length,
    2,
  );
  for (const profile of ["second-company"]) {
    const outsider = await session(profile);
    assert.equal(
      (await call(outsider, `crm/leads/counts?${query}`)).body.counts.Active,
      0,
    );
    assert.equal(
      (await call(outsider, `crm/leads?${query}&follow_up=NextActionNeeded`))
        .body.items.length,
      0,
    );
  }
  assert.equal(
    (await call(await session("other-workspace"), `crm/leads/counts?${query}`))
      .status,
    403,
  );
});

test("LR HTTP counts require identity/capability, reject ambiguous scope and unsupported writes", async () => {
  assert.equal((await fetch(`${origin}/api/v1/crm/leads/counts`)).status, 401);
  assert.equal(
    (await call(await session("systems"), "crm/leads/counts")).status,
    403,
  );
  const cookie = await session();
  for (const path of [
    "crm/leads/counts?limit=1",
    "crm/leads/counts?follow_up=Overdue",
    "crm/leads/counts?view=Active",
    "crm/leads/counts?owner_id=bad",
    "crm/leads/counts?status=Converted",
    "crm/leads?follow_up=Upcoming",
    "crm/leads?follow_up=Overdue&view=Archived",
    "crm/leads?follow_up=NextActionNeeded&view=Disqualified",
  ])
    assert.equal((await call(cookie, path)).status, 422, path);
  const post = await fetch(`${origin}/api/v1/crm/leads/counts`, {
    method: "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(post.status, 405);
});
