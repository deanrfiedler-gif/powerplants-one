import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { crmBase, crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
const origin = process.env.PPO_TEST_ORIGIN ?? "http://127.0.0.1:3000";
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function request(cookie: string, path: string, data?: unknown) {
  return fetch(`${origin}/api/v1/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: origin,
      "Content-Type": "application/json",
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
test("ES04 HTTP exact authority, strict content, stale sequence, original replay and safe-cache boundary", async () => {
  const owner = await session("coordinator"),
    reviewer = await session("estimating-source-reviewer"),
    other = await session("second-company"),
    o = crmCreate();
  assert.equal((await request(owner, "crm/opportunities", o)).status, 201);
  const input = estimateInput(o.id);
  assert.equal(
    (await request(owner, "estimating/estimates", input)).status,
    201,
  );
  const path = `estimating/estimates/${input.id}/review`;
  const first = await request(owner, path);
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control")!, /no-store/);
  const d = await first.json();
  assert.equal((await request(other, path)).status, 404);
  assert.equal((await request(owner, path + "?unexpected=1")).status, 422);
  const command = {
    ...crmBase(),
    estimate_version_id: d.saved.id,
    basis_hash: d.basis_hash,
    expected_version: 1,
    expected_review_version: 0,
    responses: [],
  };
  assert.equal((await request(other, path, command)).status, 404);
  assert.equal(
    (await request(owner, path, { ...command, approval: true })).status,
    422,
  );
  const accepted = await request(owner, path, command);
  assert.equal(accepted.status, 200);
  const receipt = await accepted.json();
  assert.deepEqual(
    await (await request(owner, `operations/${command.operation_id}`)).json(),
    receipt,
  );
  assert.deepEqual(await (await request(owner, path, command)).json(), receipt);
  assert.equal(
    (await request(owner, path, { ...command, reason: "Different original" }))
      .status,
    409,
  );
  assert.equal(
    (await request(owner, path, { ...command, operation_id: randomUUID() }))
      .status,
    409,
  );
  const submitted = await (await request(reviewer, path)).json();
  const decision = {
    ...crmBase(),
    submission_id: submitted.submissions[0].id,
    kind: "Completeness",
    outcome: "Reviewed",
    expected_version: 1,
    expected_review_version: 1,
    findings: [],
  };
  assert.equal(
    (await request(owner, path + "/decision", decision)).status,
    404,
  );
  assert.equal(
    (
      await request(reviewer, path + "/decision", {
        ...decision,
        outcome: "Approved",
      })
    ).status,
    422,
  );
  assert.equal(
    (await request(reviewer, path + "/decision", decision)).status,
    200,
  );
  assert.equal(
    (await request(reviewer, path + "/decision", decision)).status,
    200,
  );
  assert.equal(
    (await request(other, `operations/${decision.operation_id}`)).status,
    404,
  );
  const final = await (await request(owner, path)).json();
  assert.equal(final.commercial_approval, "Not configured");
  assert.equal(final.decisions.length, 1);
});
