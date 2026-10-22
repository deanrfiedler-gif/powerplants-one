import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createPerson } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { readActivity } from "../../src/activities/activities";
import { readPartyNumbers, setPartyNumbers } from "../../src/calls/party-numbers";
import { listCallsToLog, recordClickToCall } from "../../src/calls/events";
import { logCall } from "../../src/calls/log-call";
import { readOperation } from "../../src/shared/receipts";
import { CRM, crmBase, crmCreate } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const rows = async (sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows;
const code = (wanted: string) => (e: unknown) => (e as { code?: string }).code === wanted;
let alex: string, alexNumber: string, deal: ReturnType<typeof crmCreate>;

before(async () => {
  await reset();
  const p = await principal();
  alex = randomUUID();
  await createPerson(p, { ...crmBase(), id: alex, company_ids: [CRM.company], display_name: "SYN Alex Logger" });
  await setPartyNumbers(p, "Person", alex, {
    ...crmBase(),
    expected_version: (await rows("SELECT version FROM ppo.people WHERE id=$1", [alex]))[0].version,
    numbers: [{ label: "Mobile", entered: "0412 555 000", is_primary: true }],
  });
  alexNumber = (await readPartyNumbers(p, "Person", alex)).numbers[0].id;
  deal = crmCreate();
  await createOpportunity(p, deal);
});

async function clickedEvent() {
  const p = await principal(),
    id = randomUUID();
  await recordClickToCall(p, { ...crmBase(), id, number_id: alexNumber });
  const [event] = await rows("SELECT id,started_at FROM ppo.call_events WHERE id=$1", [id]);
  return { id, started_at: (event.started_at as Date).toISOString() };
}
const logInput = (over: Record<string, unknown> = {}) => ({
  ...crmBase(),
  activity_id: randomUUID(),
  company_id: CRM.company,
  site_id: null,
  person_id: alex,
  direction: "Outgoing",
  result: "Connected",
  started_at: "2026-10-23T01:00:00.000Z",
  duration_seconds: 240,
  summary: "SYN Call with Alex about the irrigation quote",
  outcome: "SYN Alex wants the revised quote by Friday.",
  links: [{ object_type: "Organisation", object_id: CRM.org }],
  access_class: "Internal",
  ...over,
});
const counts = async () =>
  (await rows("SELECT (SELECT count(*) FROM ppo.activities)::int AS a,(SELECT count(*) FROM ppo.call_details)::int AS d")).at(0);

test("logging a clicked call completes one Call activity with its details and marks the event Logged", async () => {
  const p = await principal(),
    event = await clickedEvent(),
    command = logInput({ call_event_id: event.id, started_at: event.started_at });
  const result = await logCall(p, command);
  assert.equal(result.receipt.record_id, command.activity_id);
  const activity = await readActivity(p, command.activity_id);
  assert.deepEqual(
    [activity.status, activity.activity_type, activity.kind, activity.owner_id, activity.outcome, activity.due_at],
    ["Completed", "Call", "CustomerContact", p.actor_id, command.outcome, event.started_at],
  );
  const [details] = await rows("SELECT * FROM ppo.call_details WHERE activity_id=$1", [command.activity_id]);
  assert.deepEqual(
    [details.direction, details.result, details.number_e164, details.person_id, details.duration_seconds, details.call_event_id],
    ["Outgoing", "Connected", "+61412555000", alex, 240, event.id],
  );
  const [row] = await rows("SELECT state,activity_id FROM ppo.call_events WHERE id=$1", [event.id]);
  assert.deepEqual([row.state, row.activity_id], ["Logged", command.activity_id]);
  assert.ok(!(await listCallsToLog(p)).items.some((e) => e.id === event.id));
  assert.deepEqual(await readOperation(p, command.operation_id), result.receipt);
  const [audit] = await rows("SELECT object_type,details FROM ppo.audit_events WHERE operation_id=$1", [command.operation_id]);
  assert.deepEqual([audit.object_type, audit.details.command, audit.details.call_event_id], ["Activity", "LogCall", event.id]);
});

test("an exact replay returns the receipt; logging the same call again is refused and writes nothing", async () => {
  const p = await principal(),
    event = await clickedEvent(),
    command = logInput({ call_event_id: event.id });
  const first = await logCall(p, command);
  assert.deepEqual((await logCall(p, command)).receipt, first.receipt);
  const before = await counts();
  await assert.rejects(logCall(p, logInput({ call_event_id: event.id })), code("CallAlreadyResolved"));
  await assert.rejects(logCall(p, logInput({ call_event_id: (await clickedEvent()).id, direction: "Incoming" })), code("InvalidData"));
  assert.deepEqual(await counts(), before);
});

test("a manual log keeps the entered number, reads it in the company's region and needs no event", async () => {
  const p = await principal();
  for (const [entered, e164] of [["0499 888 777", "+61499888777"], ["SYN switchboard", null]] as const) {
    const command = logInput({ person_id: null, number_entered: entered, direction: "Incoming", result: "LeftVoicemail", duration_seconds: null });
    await logCall(p, command);
    const [details] = await rows("SELECT number_entered,number_e164,person_id,call_event_id FROM ppo.call_details WHERE activity_id=$1", [command.activity_id]);
    assert.deepEqual(details, { number_entered: entered, number_e164: e164, person_id: null, call_event_id: null });
  }
});

test("a call linked to a deal at its site is recorded against the deal", async () => {
  const p = await principal(),
    command = logInput({ site_id: CRM.site, links: [{ object_type: "Opportunity", object_id: deal.id }], result: "NoAnswer", duration_seconds: 0 });
  await logCall(p, command);
  assert.deepEqual((await readActivity(p, command.activity_id)).links.map((l) => [l.object_type, l.object_id]), [["Opportunity", deal.id]]);
});

test("another user's event, a hidden link or a person outside the company is refused and writes nothing", async () => {
  const p = await principal(),
    event = await clickedEvent(),
    observer = await principal("site-observer");
  await database().query("UPDATE ppo.call_events SET user_id=$2 WHERE id=$1", [event.id, observer.actor_id]);
  const before = await counts();
  await assert.rejects(logCall(p, logInput({ call_event_id: event.id })), code("RecordUnavailable"));
  await assert.rejects(logCall(p, logInput({ links: [{ object_type: "Organisation", object_id: CRM.orgB }] })));
  await assert.rejects(logCall(p, logInput({ person_id: "60000000-0000-4000-8000-000000000002" })), code("RecordUnavailable"));
  await assert.rejects(logCall(await principal("other-workspace"), logInput()));
  await assert.rejects(logCall(p, logInput({ result: "Missed" })), code("InvalidData"));
  await assert.rejects(logCall(p, logInput({ duration_seconds: -1 })), code("InvalidData"));
  assert.deepEqual(await counts(), before);
  assert.equal((await rows("SELECT state FROM ppo.call_events WHERE id=$1", [event.id]))[0].state, "ToLog");
});
