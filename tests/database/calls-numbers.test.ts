import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createPerson } from "../../src/shared/commands";
import { revisePerson, setSitePrimaryContact } from "../../src/shared/contacts/commands";
import { readPartyNumbers, setPartyNumbers } from "../../src/calls/party-numbers";
import { readOperation } from "../../src/shared/receipts";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const id = (type: number, n = 1) => `${type}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = id(20),
  org = id(50),
  site = id(70);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const base = () => ({ operation_id: randomUUID(), schema_version: 1, reason: "SYN calling numbers proof" });
const code = (wanted: string) => (e: unknown) => (e as { code?: string }).code === wanted;
const rows = async (sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows;
async function newPerson(phone?: string) {
  const p = await principal(),
    person = randomUUID();
  await createPerson(p, { ...base(), id: person, company_ids: [company], display_name: "SYN calling contact", ...(phone ? { phone } : {}) });
  return person;
}
const version = async (table: string, row: string) => (await rows(`SELECT version FROM ppo.${table} WHERE id=$1`, [row]))[0].version as number;
const twoNumbers = [
  { label: "Work", entered: "(07) 3123 4567", is_primary: false },
  { label: "Mobile", entered: " 0412 345 678 ", is_primary: true },
];

test("set numbers reads them, keeps their order and mirrors the primary into people.phone", async () => {
  const p = await principal(),
    person = await newPerson();
  const command = { ...base(), expected_version: await version("people", person), numbers: twoNumbers };
  const result = await setPartyNumbers(p, "Person", person, command);
  assert.equal(result.receipt.record_version, command.expected_version + 1);
  const read = await readPartyNumbers(p, "Person", person);
  assert.equal(read.party_version, command.expected_version + 1);
  assert.deepEqual(
    read.numbers.map(({ label, entered, e164, needs_checking, is_primary, position }) => ({ label, entered, e164, needs_checking, is_primary, position })),
    [
      { label: "Work", entered: "(07) 3123 4567", e164: "+61731234567", needs_checking: false, is_primary: false, position: 1 },
      { label: "Mobile", entered: "0412 345 678", e164: "+61412345678", needs_checking: false, is_primary: true, position: 2 },
    ],
  );
  assert.equal((await rows("SELECT phone FROM ppo.people WHERE id=$1", [person]))[0].phone, "0412 345 678");
  const [audit] = await rows("SELECT object_type,details FROM ppo.audit_events WHERE operation_id=$1", [command.operation_id]);
  assert.equal(audit.object_type, "Person");
  assert.deepEqual(audit.details.before.numbers, []);
  assert.equal(audit.details.after.numbers.length, 2);
});

test("an exact replay returns the receipt; changed content and stale versions conflict; an empty list clears people.phone", async () => {
  const p = await principal(),
    person = await newPerson();
  const command = { ...base(), expected_version: await version("people", person), numbers: twoNumbers };
  const first = await setPartyNumbers(p, "Person", person, command);
  const replay = await setPartyNumbers(p, "Person", person, command);
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.receipt, first.receipt);
  assert.deepEqual(await readOperation(p, command.operation_id), first.receipt);
  await assert.rejects(setPartyNumbers(p, "Person", person, { ...command, numbers: [] }), code("OperationConflict"));
  await assert.rejects(setPartyNumbers(p, "Person", person, { ...command, operation_id: randomUUID() }), code("VersionConflict"));
  await setPartyNumbers(p, "Person", person, { ...base(), expected_version: await version("people", person), numbers: [] });
  assert.deepEqual((await readPartyNumbers(p, "Person", person)).numbers, []);
  assert.equal((await rows("SELECT phone FROM ppo.people WHERE id=$1", [person]))[0].phone, null);
});

test("refuses no primary, two primaries, a repeated number, unknown labels and more than ten numbers", async () => {
  const p = await principal(),
    person = await newPerson(),
    expected_version = await version("people", person);
  const attempt = (numbers: unknown[]) => setPartyNumbers(p, "Person", person, { ...base(), expected_version, numbers });
  await assert.rejects(attempt([{ label: "Work", entered: "0412 345 678", is_primary: false }]), code("InvalidData"));
  await assert.rejects(attempt(twoNumbers.map((n) => ({ ...n, is_primary: true }))), code("InvalidData"));
  await assert.rejects(
    attempt([
      { label: "Work", entered: "0412 345 678", is_primary: true },
      { label: "Mobile", entered: "+61 412 345 678", is_primary: false },
    ]),
    code("InvalidData"),
  );
  await assert.rejects(attempt([{ label: "Fax", entered: "0412 345 678", is_primary: true }]), code("InvalidData"));
  await assert.rejects(
    attempt(Array.from({ length: 11 }, (_, i) => ({ label: "Other", entered: `0412 345 6${String(i).padStart(2, "0")}`, is_primary: i === 0 }))),
    code("InvalidData"),
  );
  assert.equal(await version("people", person), expected_version);
});

test("unreadable text is kept exactly and flagged; a readable number can be flagged deliberately", async () => {
  const p = await principal(),
    person = await newPerson();
  await setPartyNumbers(p, "Person", person, {
    ...base(),
    expected_version: await version("people", person),
    numbers: [
      { label: "Other", entered: "ext 23 via reception", is_primary: true },
      { label: "Mobile", entered: "0412 345 678", is_primary: false, needs_checking: true },
    ],
  });
  const numbers = (await readPartyNumbers(p, "Person", person)).numbers;
  assert.deepEqual(
    numbers.map(({ entered, e164, needs_checking }) => ({ entered, e164, needs_checking })),
    [
      { entered: "ext 23 via reception", e164: null, needs_checking: true },
      { entered: "0412 345 678", e164: "+61412345678", needs_checking: true },
    ],
  );
});

test("a site-only, other-company or other-workspace identity cannot set numbers; site-only can read its site contact", async () => {
  const p = await principal(),
    person = await newPerson("0412 345 678");
  await setSitePrimaryContact(p, site, { ...base(), expected_version: await version("sites", site), primary_contact_id: person });
  const command = { ...base(), expected_version: await version("people", person), numbers: twoNumbers };
  const observer = await principal("site-observer");
  assert.equal((await readPartyNumbers(observer, "Person", person)).numbers.length, 1);
  await assert.rejects(setPartyNumbers(observer, "Person", person, command), code("RecordUnavailable"));
  for (const profile of ["second-company", "other-workspace"]) {
    await assert.rejects(readPartyNumbers(await principal(profile), "Person", person));
    await assert.rejects(setPartyNumbers(await principal(profile), "Person", person, command));
  }
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.audit_events WHERE operation_id=$1", [command.operation_id]))[0].n, 0);
});

test("organisation main numbers need shared edit in the organisation's company and version the organisation", async () => {
  const p = await principal(),
    expected_version = await version("organisations", org);
  await setPartyNumbers(p, "Organisation", org, {
    ...base(),
    expected_version,
    numbers: [{ label: "Work", entered: "07 3000 0000", is_primary: true }],
  });
  const read = await readPartyNumbers(p, "Organisation", org);
  assert.equal(read.party_version, expected_version + 1);
  assert.equal(read.numbers[0].e164, "+61730000000");
  await assert.rejects(
    setPartyNumbers(await principal("site-observer"), "Organisation", org, { ...base(), expected_version: read.party_version, numbers: [] }),
  );
});

test("createPerson stores a legacy phone as one primary number; revisePerson edits it and refuses with several numbers", async () => {
  const p = await principal(),
    person = await newPerson("SYN phone");
  assert.deepEqual(
    (await readPartyNumbers(p, "Person", person)).numbers.map(({ label, entered, e164, needs_checking, is_primary }) => ({ label, entered, e164, needs_checking, is_primary })),
    [{ label: "Other", entered: "SYN phone", e164: null, needs_checking: true, is_primary: true }],
  );
  const revise = async (phone: string | null) =>
    revisePerson(p, person, {
      ...base(),
      expected_version: await version("people", person),
      display_name: "SYN calling contact",
      email: null,
      phone,
      contact_preference: null,
      active: true,
    });
  await revise("0412 345 678");
  const [single] = (await readPartyNumbers(p, "Person", person)).numbers;
  assert.deepEqual([single.label, single.entered, single.e164, single.needs_checking], ["Other", "0412 345 678", "+61412345678", false]);
  await revise("0412 345 678");
  await setPartyNumbers(p, "Person", person, { ...base(), expected_version: await version("people", person), numbers: twoNumbers });
  await revise("0412 345 678");
  await assert.rejects(revise("0499 999 999"), code("UseNumbersEditor"));
  assert.equal((await readPartyNumbers(p, "Person", person)).numbers.length, 2);
  await setPartyNumbers(p, "Person", person, {
    ...base(),
    expected_version: await version("people", person),
    numbers: [twoNumbers[1]],
  });
  await revise(null);
  assert.deepEqual((await readPartyNumbers(p, "Person", person)).numbers, []);
});
