import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { crmCreate } from "../helpers/crm";
// Conversations T1c-1 routes (PPO-CONV-T1C-DESIGN 5.1) over the T1b service.
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
const base = (reason: string) => ({ schema_version: 1, operation_id: randomUUID(), reason });

async function login(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200, `sign in as ${profile}`);
  const principal = (await r.json()) as { actor_id: string };
  return { cookie: r.headers.get("set-cookie")!.split(";")[0], actor_id: principal.actor_id };
}
async function call(cookie: string | null, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(cookie ? { cookie } : {}), origin, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: r.headers.get("content-type")?.includes("application/json") ? await r.json() : await r.text() };
}

type Record = { record_type: "Opportunity" | "Project"; id: string; display_number: string };

// The seed holds no deals, so each test creates one through the CRM route first. The second reader is found, not
// assumed: the first candidate profile the `@` picker lists for a record.
async function fixture() {
  const coordinator = await login("coordinator");
  const candidates = [await login("crm-receiver"), await login("observer")];
  assert.equal((await call(coordinator.cookie, "crm/opportunities", crmCreate())).status, 201);
  const records = (await call(coordinator.cookie, "conversations/records")).body.items as Record[];
  assert.ok(records.length, "coordinator can link at least one deal or project");
  for (const record of records) {
    const people = (
      await call(coordinator.cookie, `conversations/people?anchor_type=${record.record_type}&anchor_id=${record.id}`)
    ).body.items as { id: string }[];
    const reader = candidates.find((c) => people.some((p) => p.id === c.actor_id));
    if (reader) return { coordinator, reader, record };
  }
  assert.fail(`neither crm-receiver nor observer can read any of ${records.map((r) => r.display_number).join(", ")}`);
}

const start = (record: Record, mentions: unknown[] = [], body = "SYN where is it?") => ({
  ...base("Start a conversation"),
  anchor_type: record.record_type,
  anchor_id: record.id,
  title: "SYN T1c-1 HTTP",
  body,
  mentions,
  asks: [],
});

test("T1c-1 routes require a session", async () => {
  assert.equal((await call(null, "conversations")).status, 401);
});

test("T1c-1 start, read, post and replay", async () => {
  const { coordinator, reader, record } = await fixture();
  const body = start(record, [{ ordinal: 1, kind: "Person", person_id: reader.actor_id }], "@{1} SYN where is it?");
  const first = await call(coordinator.cookie, "conversations", body);
  assert.equal(first.status, 201);
  const thread = first.body.record_id as string;
  const replay = await call(coordinator.cookie, "conversations", body);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.receipt_id, first.body.receipt_id);
  const read = await call(coordinator.cookie, `conversations/${thread}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.messages[0].mentions[0].kind, "Person");
  const posted = await call(coordinator.cookie, `conversations/${thread}/messages`, { ...base("Post a message"), body: "SYN reply" });
  assert.equal(posted.status, 201);
  const list = await call(coordinator.cookie, "conversations?filter=All&limit=100");
  assert.ok((list.body.items as { id: string }[]).some((t) => t.id === thread));
});

test("T1c-1 resolve, reopen and the version rule", async () => {
  const { coordinator, record } = await fixture();
  const thread = (await call(coordinator.cookie, "conversations", start(record))).body.record_id as string;
  const v1 = (await call(coordinator.cookie, `conversations/${thread}`)).body.version as number;
  assert.equal((await call(coordinator.cookie, `conversations/${thread}/resolve`, { ...base("Resolve conversation"), expected_version: v1 })).status, 200);
  const refused = await call(coordinator.cookie, `conversations/${thread}/messages`, { ...base("Post a message"), body: "SYN late" });
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "ThreadResolved");
  assert.equal(
    (await call(coordinator.cookie, `conversations/${thread}/reopen`, { ...base("Reopen conversation"), expected_version: v1 + 1 })).status,
    200,
  );
});

test("T1c-1 an unreadable thread looks like a missing one", async () => {
  const { coordinator, record } = await fixture();
  const outsider = await login("other-workspace");
  const thread = (await call(coordinator.cookie, "conversations", start(record))).body.record_id as string;
  // The same outsider asks for a real thread and for one that does not exist: the answers must be identical.
  const hidden = await call(outsider.cookie, `conversations/${thread}`);
  const missing = await call(outsider.cookie, `conversations/${randomUUID()}`);
  assert.equal(hidden.status, missing.status);
  assert.equal(hidden.body.code, missing.body.code);
  assert.equal(hidden.body.message, missing.body.message);
  // A permitted reader asking for a thread that does not exist gets the same unavailable answer the T1b service gives.
  const absent = await call(coordinator.cookie, `conversations/${randomUUID()}`);
  assert.equal(absent.status, 404);
  assert.equal(absent.body.code, "RecordUnavailable");
});

test("T1c-1 mark read refuses a non-participant", async () => {
  const { coordinator, reader, record } = await fixture();
  const thread = (await call(coordinator.cookie, "conversations", start(record))).body.record_id as string;
  const refused = await call(reader.cookie, `conversations/${thread}/read`, { ...base("Mark conversation read"), through_sequence: 1 });
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "NotAParticipant");
  const read = { ...base("Mark conversation read"), through_sequence: 1 };
  assert.equal((await call(coordinator.cookie, `conversations/${thread}/read`, read)).status, 200);
  assert.equal((await call(coordinator.cookie, `conversations/${thread}/read`, read)).status, 200);
});

test("T1c-1 no answer needed is the asked person's", async () => {
  const { coordinator, reader, record } = await fixture();
  const body = {
    ...start(record, [{ ordinal: 1, kind: "Person", person_id: reader.actor_id }], "@{1} SYN date?"),
    asks: [{ ordinal: 1, question: "SYN delivery date", reply_by: null }],
  };
  const thread = (await call(coordinator.cookie, "conversations", body)).body.record_id as string;
  const ask = (await call(coordinator.cookie, `conversations/${thread}`)).body.asks[0] as { id: string; version: number };
  const close = { ...base("No answer needed"), expected_version: ask.version };
  assert.equal((await call(coordinator.cookie, `conversations/asks/${ask.id}/no-answer-needed`, close)).status, 403);
  assert.equal((await call(reader.cookie, `conversations/asks/${ask.id}/no-answer-needed`, { ...close, operation_id: randomUUID() })).status, 200);
});

test("T1c-1 the records picker finds one record by its ID, within the sender's access", async () => {
  const coordinator = await login("coordinator");
  const outsider = await login("other-workspace");
  const deal = crmCreate();
  assert.equal((await call(coordinator.cookie, "crm/opportunities", deal)).status, 201);
  const exact = await call(coordinator.cookie, `conversations/records?record_type=Opportunity&record_id=${deal.id}`);
  assert.equal(exact.status, 200);
  assert.deepEqual((exact.body.items as { id: string }[]).map((r) => r.id), [deal.id]);
  const hidden = await call(outsider.cookie, `conversations/records?record_type=Opportunity&record_id=${deal.id}`);
  assert.ok(hidden.status === 403 || (hidden.body.items as unknown[]).length === 0);
});
