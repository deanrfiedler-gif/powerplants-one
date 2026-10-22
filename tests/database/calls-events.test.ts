import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createPerson } from "../../src/shared/commands";
import { readPartyNumbers, setPartyNumbers } from "../../src/calls/party-numbers";
import { ingestCallEvent, listCallsToLog, recordClickToCall, skipCallEvent } from "../../src/calls/events";
import { readOperation } from "../../src/shared/receipts";
import { CRM, crmBase } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const rows = async (sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows;
const code = (wanted: string) => (e: unknown) => (e as { code?: string }).code === wanted;
const events = async () => (await rows("SELECT count(*)::int AS n FROM ppo.call_events"))[0].n as number;
async function personWithNumber(entered: string, name = "SYN Event Caller") {
  const p = await principal(),
    id = randomUUID();
  await createPerson(p, { ...crmBase(), id, company_ids: [CRM.company], display_name: name });
  const version = (await rows("SELECT version FROM ppo.people WHERE id=$1", [id]))[0].version;
  await setPartyNumbers(p, "Person", id, { ...crmBase(), expected_version: version, numbers: [{ label: "Mobile", entered, is_primary: true }] });
  return { id, number: (await readPartyNumbers(p, "Person", id)).numbers[0] };
}
const click = (number_id: string, id = randomUUID()) => ({ ...crmBase(), id, number_id });

before(reset);

test("click to call stores one Outgoing To log event for the chosen person and replays exactly", async () => {
  const p = await principal(),
    alex = await personWithNumber("0412 100 200", "SYN Alex Clicker"),
    command = click(alex.number.id);
  const first = await recordClickToCall(p, command);
  assert.equal(first.receipt.record_id, command.id);
  assert.equal((await recordClickToCall(p, command)).replayed, true);
  assert.deepEqual(await readOperation(p, command.operation_id), first.receipt);
  await assert.rejects(recordClickToCall(p, { ...command, operation_id: randomUUID() }), code("RelationshipConflict"));
  const listed = (await listCallsToLog(p)).items.filter((e) => e.id === command.id);
  assert.equal(listed.length, 1);
  assert.deepEqual(
    [listed[0].source, listed[0].direction, listed[0].number_e164, listed[0].answered, listed[0].party, listed[0].match_count],
    ["ClickToCall", "Outgoing", "+61412100200", null, { type: "Person", id: alex.id, display_name: "SYN Alex Clicker" }, 1],
  );
  const [audit] = await rows("SELECT object_type,details FROM ppo.audit_events WHERE operation_id=$1", [command.operation_id]);
  assert.equal(audit.object_type, "CallEvent");
  assert.equal((await rows("SELECT status FROM ppo.activities WHERE created_at>now()-interval '1 minute' AND activity_type='Call'")).length, 0);
});

test("a number needing checking, a hidden person or an unknown number id is refused and stores nothing", async () => {
  const p = await principal(),
    flagged = await personWithNumber("ext 23 via reception"),
    alex = await personWithNumber("0412 100 201");
  const count = await events();
  await assert.rejects(recordClickToCall(p, click(flagged.number.id)), code("NumberNeedsChecking"));
  for (const profile of ["second-company", "other-workspace"])
    await assert.rejects(recordClickToCall(await principal(profile), click(alex.number.id)));
  await assert.rejects(recordClickToCall(p, click(randomUUID())), code("RecordUnavailable"));
  assert.equal(await events(), count);
});

test("an incoming call from a number nobody visible holds stores nothing; a shared number is recorded without picking a person", async () => {
  const p = await principal(),
    count = await events();
  const call = (number_e164: string) => ({
    id: randomUUID(),
    source: "Teams" as const,
    source_reference: randomUUID(),
    direction: "Incoming" as const,
    number_e164,
    answered: true,
    duration_seconds: 75,
  });
  assert.equal(await transaction((c) => ingestCallEvent(c, p, call("+61499999999"))), null);
  assert.equal(await events(), count);
  await personWithNumber("0412 300 300", "SYN Shared One");
  await personWithNumber("0412 300 300", "SYN Shared Two");
  const shared = call("+61412300300");
  const event = await transaction((c) => ingestCallEvent(c, p, shared));
  assert.deepEqual([event.person_id, event.organisation_id], [null, null]);
  const again = await transaction((c) => ingestCallEvent(c, p, { ...shared, id: randomUUID() }));
  assert.equal(again.id, event.id);
  const listed = (await listCallsToLog(p)).items.find((e) => e.id === event.id);
  assert.deepEqual([listed?.party, listed?.match_count], [null, 2]);
});

test("another user's event is not listed and cannot be skipped; skip records the reason once", async () => {
  const p = await principal(),
    alex = await personWithNumber("0412 100 202"),
    command = click(alex.number.id);
  await recordClickToCall(p, command);
  const observer = await principal("site-observer");
  assert.ok(!(await listCallsToLog(observer)).items.some((e) => e.id === command.id));
  await assert.rejects(skipCallEvent(observer, command.id, { ...crmBase(), expected_version: 1 }), code("RecordUnavailable"));
  await assert.rejects(skipCallEvent(p, command.id, { ...crmBase(), expected_version: 1, skip_reason: "Lunch" }), code("InvalidData"));
  const skip = { ...crmBase(), expected_version: 1, skip_reason: "Personal" };
  await skipCallEvent(p, command.id, skip);
  assert.equal((await skipCallEvent(p, command.id, skip)).replayed, true);
  await assert.rejects(skipCallEvent(p, command.id, { ...skip, operation_id: randomUUID() }), code("VersionConflict"));
  await assert.rejects(skipCallEvent(p, command.id, { ...skip, operation_id: randomUUID(), expected_version: 2 }), code("CallAlreadyResolved"));
  const [row] = await rows("SELECT state,skip_reason,resolved_by FROM ppo.call_events WHERE id=$1", [command.id]);
  assert.deepEqual([row.state, row.skip_reason, row.resolved_by], ["Skipped", "Personal", p.actor_id]);
  assert.ok(!(await listCallsToLog(p)).items.some((e) => e.id === command.id));
});

test("skipped events are deleted 30 days after skipping; recent skips and calls still to log are kept", async () => {
  const p = await principal(),
    alex = await personWithNumber("0412 100 203");
  const [old, recent, waiting] = [click(alex.number.id), click(alex.number.id), click(alex.number.id)];
  for (const c of [old, recent, waiting]) await recordClickToCall(p, c);
  for (const c of [old, recent]) await skipCallEvent(p, c.id, { ...crmBase(), expected_version: 1 });
  await database().query("UPDATE ppo.call_events SET resolved_at=clock_timestamp()-interval '31 days' WHERE id=$1", [old.id]);
  await database().query("UPDATE ppo.call_events SET resolved_at=clock_timestamp()-interval '29 days' WHERE id=$1", [recent.id]);
  await database().query("UPDATE ppo.call_events SET started_at=clock_timestamp()-interval '90 days' WHERE id=$1", [waiting.id]);
  await recordClickToCall(p, click(alex.number.id));
  const ids = (await rows("SELECT id FROM ppo.call_events WHERE id=ANY($1::uuid[])", [[old.id, recent.id, waiting.id]])).map((r) => r.id);
  assert.deepEqual(ids.sort(), [recent.id, waiting.id].sort());
  // The append-only identity keeps only the id and type; the purged receipt is not disclosed.
  assert.deepEqual(await rows("SELECT object_type,display_number FROM ppo.business_identities WHERE id=$1", [old.id]), [
    { object_type: "CallEvent", display_number: null },
  ]);
  await assert.rejects(readOperation(p, old.operation_id), code("RecordUnavailable"));
  assert.ok(await readOperation(p, recent.operation_id));
});

test("an event whose person became hidden still lists, without the person, and can still be skipped", async () => {
  const p = await principal(),
    alex = await personWithNumber("0412 100 204"),
    command = click(alex.number.id);
  await recordClickToCall(p, command);
  await database().query("DELETE FROM ppo.person_company_contexts WHERE person_id=$1", [alex.id]);
  const listed = (await listCallsToLog(p)).items.find((e) => e.id === command.id);
  assert.deepEqual([listed?.party, listed?.match_count, listed?.number_e164], [null, 0, "+61412100204"]);
  await skipCallEvent(p, command.id, { ...crmBase(), expected_version: 1, skip_reason: "NotBusiness" });
});
