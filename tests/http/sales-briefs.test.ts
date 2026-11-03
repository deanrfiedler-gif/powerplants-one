import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { crmBase, crmDiscovery } from "../helpers/crm";
import { emptyHandover } from "../../src/sales/handover-model";
import type { ReceivingQueue } from "../../src/sales/receiving-queue-model";
const origin =
  process.env.PPO_TEST_ORIGIN ??
  `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json(), headers: r.headers };
}
async function ok(cookie: string, path: string, body?: unknown) {
  const r = await call(cookie, path, body);
  assert.ok(r.status < 300, JSON.stringify(r.body));
  return r.body;
}
test("CR-02 receiving HTTP: scoped population, pagination, exact snapshots/export, native decisions and successor handovers", async () => {
  const co = await session("coordinator"),
    other = await session("second-company"),
    prefix = `SYN Queue HTTP ${randomUUID()}`;
  const ids: string[] = [];
  for (let i = 0; i < 3; i++) {
    const o = crmDiscovery();
    o.title = `${prefix} ${i}`;
    o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
    o.initial_action.due_needed = false;
    await ok(co, "crm/opportunities", o);
    const id = randomUUID();
    ids.push(id);
    await ok(co, "sales/handovers", {
      ...crmBase(),
      id,
      kind: "Estimating",
      opportunity_id: o.id,
    });
    const content = {
      ...emptyHandover(),
      problem: "SYN frozen original",
      outcome: "SYN outcome",
      included_scope: "SYN scope",
      exclusions: "None",
      assumptions: "None",
      unknowns: "None",
      date_reason: "Customer to choose",
      next_activity_id: o.initial_action.id,
    };
    await ok(co, `sales/handovers/${id}`, {
      ...crmBase(),
      action: "Save",
      expected_version: 1,
      content,
      receiving_owner_id: o.owner_id,
      note: "SYN prepared",
    });
    await ok(co, `sales/handovers/${id}`, {
      ...crmBase(),
      action: "Submit",
      expected_version: 2,
      note: "SYN submitted",
    });
  }
  const path = `sales/handovers/receiving?q=${encodeURIComponent(prefix)}&limit=2`;
  const response = await call(co, path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  const first = response.body as ReceivingQueue;
  assert.equal(first.total, 3);
  assert.equal(first.items.length, 2);
  assert.equal(first.counts.All, 3);
  assert.equal(first.counts.Awaiting, 3);
  const second = (await ok(
    co,
    `${path}&offset=2&basis=${first.basis}`,
  )) as ReceivingQueue;
  assert.equal(second.items.length, 1);
  assert.equal(
    new Set([...first.items, ...second.items].map((r) => r.id)).size,
    3,
  );
  assert.equal((await call(co, `${path}&offset=2`)).status, 409);
  assert.equal((await call(co, `${path}&limit=101`)).status, 422);
  assert.equal((await ok(other, path)).total, 0);
  const row = first.items[0],
    snap = `sales/handovers/receiving/${row.id}?revision=${row.revision}&token=${row.token}`;
  assert.equal((await ok(co, snap)).content.problem, "SYN frozen original");
  const hidden = await call(other, snap),
    missing = await call(other, `sales/handovers/receiving/${randomUUID()}`);
  assert.equal(hidden.status, 404);
  assert.equal(missing.status, 404);
  assert.deepEqual(
    { ...hidden.body, correlation_id: undefined },
    { ...missing.body, correlation_id: undefined },
  );
  const selection = `sales/handovers/receiving?selection=${row.id}:${row.token}`;
  const exported = await ok(co, selection);
  assert.equal(exported.count, 1);
  assert.match(exported.csv, /revision=1/);
  assert.equal(exported.csv.includes(ids.find((id) => id !== row.id)!), false);
  assert.equal((await call(other, selection)).status, 404);
  const detail = `sales/handovers/${row.id}`;
  await ok(co, detail, {
    ...crmBase(),
    action: "Clarify",
    expected_version: 3,
    note: "SYN clarify exact revision",
  });
  assert.equal((await call(co, snap)).status, 409);
  assert.equal((await call(co, selection)).status, 409);
  assert.equal(
    (await call(co, `${path}&offset=2&basis=${first.basis}`)).status,
    409,
  );
  let d = await ok(co, detail);
  const question = d.history.at(-1).id;
  await ok(co, detail, {
    ...crmBase(),
    action: "Answer",
    expected_version: d.record.version,
    question_id: question,
    note: "SYN answer",
  });
  assert.equal((await ok(co, path)).counts.Awaiting, 3);
  d = await ok(co, detail);
  assert.equal(
    (
      await call(co, detail, {
        ...crmBase(),
        action: "Accept",
        expected_version: d.record.version,
        source_hash: d.record.source_hash,
        note: "SYN unresolved answer",
      })
    ).status,
    409,
  );
  await ok(co, detail, {
    ...crmBase(),
    action: "Resolve",
    expected_version: d.record.version,
    question_id: question,
    note: "SYN reviewed answer",
  });
  d = await ok(co, detail);
  await ok(co, detail, {
    ...crmBase(),
    action: "Accept",
    expected_version: d.record.version,
    source_hash: d.record.source_hash,
    note: "SYN accepted revision",
  });
  d = await ok(co, detail);
  const frozen = d.record.content;
  await ok(co, detail, {
    ...crmBase(),
    action: "Successor",
    expected_version: d.record.version,
    note: "SYN separate draft",
  });
  d = await ok(co, detail);
  await ok(co, detail, {
    ...crmBase(),
    action: "Save",
    expected_version: d.record.version,
    content: { ...frozen, problem: "SYN unsubmitted work" },
    receiving_owner_id: null,
    note: "SYN draft only",
  });
  const retained =
    ((await ok(co, path)) as ReceivingQueue).items.find(
      (r) => r.id === row.id,
    ) ?? (await ok(co, `sales/handovers/receiving/${row.id}`)).brief;
  assert.equal(retained.revision, 1);
  assert.equal(retained.state, "Accepted");
  assert.equal(retained.receiving_owner?.id, row.receiving_owner?.id);
  const snapshot = await ok(
    co,
    `sales/handovers/receiving/${row.id}?revision=1`,
  );
  assert.equal(snapshot.content.problem, "SYN frozen original");
});
