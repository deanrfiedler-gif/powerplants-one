import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { noPartsNeeded, preparedGateVisit } from "../helpers/readiness-gate";
import { nextWorkingVisit, siteContactInput } from "../helpers/site-readiness";
import { base, rows } from "../helpers/packs";
import { startInput } from "../helpers/field";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database only");
after(closeDatabase);
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
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
// Runs first: the next proof revokes the coordinator's contact duty at its end.
test("P4 HTTP confirmation after the whole crew acknowledged releases dispatch; negative then positive repeats it", async () => {
  // Three hours after the next proof's visit, so the same synthetic crew is free.
  const start = new Date(
    Date.parse(nextWorkingVisit()) + 3 * 3600000,
  ).toISOString();
  const f = await preparedGateVisit(start),
    co = await session("coordinator"),
    crew = [
      await session("assigned-technician"),
      await session("second-technician"),
    ];
  const pack = async () => (await call(co, `packs/${f.pid}`)).body.items[0];
  const check = await call(co, `packs/${f.pid}/check`, {
    ...base(),
    expected_version: (await pack()).version,
    decision: "Checked",
  });
  assert.equal(check.status, 201, JSON.stringify(check.body));
  const issue = await call(co, `packs/${f.pid}/issue`, {
    ...base(),
    expected_version: (await pack()).version,
  });
  assert.equal(issue.status, 202, JSON.stringify(issue.body)); // render queued
  await call(co, `render-jobs/${(await pack()).jobs[0].id}/retry`, {});
  const issued = await pack();
  assert.ok(issued.current_issue_id, JSON.stringify(issued.jobs));
  // As in the database proof: Parts is stated after issue, so P4 stays the last check.
  await noPartsNeeded(f.co, f.wid, f.aid);
  for (const cookie of crew) {
    const actor = (await call(cookie, "local-session")).body;
    const recipient = issued.readiness.recipients.find(
      (r: { user_id: string }) => r.user_id === actor.actor_id,
    );
    const ack = await call(
      cookie,
      `pack-issues/${issued.current_issue_id}/acknowledge`,
      {
        ...base(),
        assignment_id: recipient.assignment_id,
        assignment_version: recipient.assignment_version,
        presented_hash: issued.issues[0].output_hash,
        captured_at: new Date().toISOString(),
      },
    );
    assert.equal(ack.status, 201, JSON.stringify(ack.body));
  }
  const path = `appointments/${f.aid}`;
  const appointment = async () => (await call(co, path)).body.items[0];
  let a = await appointment();
  assert.equal(a.preparation.outcome, "Unknown");
  assert.deepEqual(
    [a.dispatch_hold, a.pack_requirement],
    [true, "AwaitingAcknowledgement"],
  );
  assert.match(
    (await pack()).readiness.reasons.join(" "),
    /^Customer site readiness: Unknown/,
  );
  const record = async (notReady: boolean) => {
    const cmd = siteContactInput((await appointment()).version);
    if (notReady) cmd.site_checks.isolation.status = "NotReady";
    const saved = await call(co, path + "/contacts", cmd);
    assert.equal(saved.status, 201, JSON.stringify(saved.body));
    return appointment();
  };
  // P4 is the last prerequisite: the recorded confirmation releases the hold.
  a = await record(false);
  assert.equal(a.preparation.outcome, "Pass");
  assert.deepEqual(
    [a.dispatch_hold, a.pack_requirement],
    [false, "Acknowledged"],
  );
  let readiness = (await pack()).readiness;
  assert.deepEqual(
    [readiness.dispatch_hold, readiness.component_ready, readiness.reasons],
    [false, true, []],
  );
  a = await record(true);
  assert.equal(a.preparation.outcome, "Blocked");
  assert.equal(a.dispatch_hold, true);
  a = await record(false);
  assert.equal(a.dispatch_hold, false);
  readiness = (await pack()).readiness;
  assert.equal(readiness.component_ready, true);
  const job = (await call(crew[0], `my-jobs/${f.aid}`)).body.items[0];
  const started = await call(crew[0], `${path}/start`, startInput(job));
  assert.equal(started.status, 201, JSON.stringify(started.body));
});

test("P4 HTTP records typed evidence, recovers the original and enforces current authority", async () => {
  const f = await preparedGateVisit(nextWorkingVisit()),
    co = await session("coordinator"),
    reader = await session("assigned-technician"),
    other = await session("second-company");
  const path = `appointments/${f.aid}`,
    before = await call(co, path);
  assert.equal(before.status, 200);
  assert.match(before.headers.get("cache-control")!, /private, no-store/);
  assert.equal(before.body.items[0].preparation.outcome, "Unknown");
  const cmd = siteContactInput(before.body.items[0].version);
  assert.equal((await call(reader, path + "/contacts", cmd)).status, 403);
  assert.equal((await call(other, path + "/contacts", cmd)).status, 404);
  assert.equal(
    (
      await call(co, path + "/contacts", {
        ...cmd,
        site_checks: { access: { status: "Confirmed" } },
      })
    ).status,
    422,
  );
  assert.equal(
    (await call(co, path + "/contacts", { ...cmd, purpose: "DateAgreement" }))
      .status,
    422,
  );
  const [one, two] = await Promise.all([
    call(co, path + "/contacts", cmd),
    call(co, path + "/contacts", cmd),
  ]);
  assert.deepEqual([one.status, two.status].sort((a,b) => a-b), [200,201], JSON.stringify([one.body,two.body]));
  assert.deepEqual(one.body, two.body);
  assert.deepEqual(
    (await call(co, `operations/${cmd.operation_id}`)).body,
    one.body,
  );
  const current = (await call(co, path)).body.items[0];
  assert.equal(current.preparation.outcome, "Pass");
  assert.equal(
    current.customer_commitment,
    before.body.items[0].customer_commitment,
  );
  assert.equal(
    (await call(co, path + "/contacts", { ...cmd, reason: "Changed request" }))
      .status,
    409,
  );
  const absent = await call(other, `appointments/${randomUUID()}`),
    hidden = await call(other, path);
  assert.equal(hidden.status, 404);
  assert.equal(absent.status, 404);
  for (const response of [hidden, absent])
    assert.match(response.body.correlation_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(hidden.body.correlation_id, absent.body.correlation_id);
  // Each request has its own correlation identity; the public refusal is identical.
  assert.deepEqual({ ...hidden.body, correlation_id: null }, { ...absent.body, correlation_id: null });
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.contact'",
    [f.co.actor_id],
  );
  assert.equal((await call(co, path + "/contacts", cmd)).status, 403);
  assert.equal(
    (await rows("SELECT 1 FROM ppo.contact_outcomes WHERE id=$1", [cmd.id]))
      .length,
    1,
  );
});
