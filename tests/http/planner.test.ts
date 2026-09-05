import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
const origin = "http://127.0.0.1:3000",
  id = (t: string, n = 1) =>
    `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
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
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P05 HTTP component proof",
});
const period =
  "from=2026-09-20T14:00:00Z&to=2026-09-27T14:00:00Z&timezone=Australia/Brisbane";
test("P05 HTTP confirms exact crew, recovers original receipt and exposes distinct saved state/holds", async () => {
  const cookie = await session("coordinator"),
    schedule = await call(cookie, "schedule?" + period);
  assert.equal(schedule.status, 200);
  assert.match(schedule.headers.get("cache-control")!, /private, no-store/);
  assert.ok(schedule.body.resources.length > 0);
  const detail = await call(cookie, `appointments/${id("a8", 6)}`),
    a = detail.body.items[0];
  const input = {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: a.policy.id,
    scheduling_policy_version: a.policy.version,
    crew: [
      {
        resource_id: id("a4", 1),
        resource_version: 1,
        calendar_version: 1,
        crew_role: "Lead",
        travel_before_minutes: 0,
        travel_after_minutes: 0,
        travel_reason:
          "SYN explicitly reviewed zero travel; HTTP fixture only.",
      },
    ],
  };
  const first = await call(cookie, `appointments/${a.id}/confirm`, input);
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.state, "Confirmed");
  assert.deepEqual(
    (await call(cookie, `appointments/${a.id}/confirm`, input)).body,
    first.body,
  );
  assert.deepEqual(
    (await call(cookie, `operations/${input.operation_id}`)).body,
    first.body,
  );
  assert.equal(
    (
      await call(cookie, `appointments/${a.id}/confirm`, {
        ...input,
        reason: "Changed reuse",
      })
    ).status,
    409,
  );
  const saved = (await call(cookie, `appointments/${a.id}`)).body.items[0];
  assert.equal(saved.dispatch_hold, true);
  assert.equal(
    saved.assignments.filter((x: { active: boolean }) => x.active).length,
    1,
  );
  assert.equal(saved.proposal.snapshot.status, "Proposed");
  assert.equal(saved.pack_requirement, "PreparationRequired");
  const conflict = await call(cookie, `appointments/${id("a8", 7)}/confirm`, {
    ...input,
    ...base(),
    expected_version: 2,
  });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.code, "ResourceConflict");
});
test("P05 HTTP rejects spoofing and inaccessible IDs/filters/selectors; no resource mutation or future dispatch endpoint", async () => {
  const cookie = await session("coordinator"),
    systems = await session("systems"),
    other = await session("second-company"),
    tech = await session("assigned-technician");
  for (const path of [
    `appointments/${id("a8", 1)}`,
    `appointments/${randomUUID()}`,
    `schedule?${period}&site_id=${id("70")}`,
    `selectors/resources?resource_id=${id("a4")}`,
  ])
    assert.equal((await call(other, path)).status, 404, path);
  assert.equal((await call(systems, "schedule?" + period)).status, 403);
  assert.equal(
    (
      await call(tech, `appointments/${id("a8", 2)}/confirm`, {
        ...base(),
        expected_version: 2,
      })
    ).status,
    422,
  ); // Narrow body validation precedes capability; valid commands tested in DB.
  assert.equal(
    (await call(cookie, `appointments/${id("a8", 1)}?actor_id=spoof`)).status,
    422,
  );
  assert.equal(
    (
      await call(cookie, `appointments/${id("a8", 1)}/move`, {
        ...base(),
        actor_id: "spoof",
      })
    ).status,
    422,
  );
  for (const path of [
    `appointments/${id("a8", 1)}/dispatch`,
    `resources/${id("a4")}/update`,
    "policies/publish",
  ])
    assert.equal((await call(cookie, path, base())).status, 404);
  assert.ok(
    !JSON.stringify((await call(cookie, "schedule?" + period)).body).includes(
      "erp_company_id",
    ),
  );
});
