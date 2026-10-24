import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { addAffiliation, createPerson } from "../../src/shared/commands";
import { createOpportunity } from "../../src/crm/opportunities";
import { setPartyNumbers } from "../../src/calls/party-numbers";
import { lookupNumber } from "../../src/calls/lookup";
import { CRM, crmBase, crmCreate } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;
const rows = async (sql: string, values: unknown[] = []) => (await database().query(sql, values)).rows;
const version = async (table: string, id: string) => (await rows(`SELECT version FROM ppo.${table} WHERE id=$1`, [id]))[0].version as number;
const shared = "0412 000 111";
let alex: string, blair: string, deal: ReturnType<typeof crmCreate>;

before(async () => {
  await reset();
  const p = await principal();
  [alex, blair] = [randomUUID(), randomUUID()];
  for (const [id, name] of [[alex, "SYN Alex Caller"], [blair, "SYN Blair Caller"]]) {
    await createPerson(p, { ...crmBase(), id, company_ids: [CRM.company], display_name: name });
    await setPartyNumbers(p, "Person", id, {
      ...crmBase(),
      expected_version: await version("people", id),
      numbers: [{ label: "Mobile", entered: shared, is_primary: true }],
    });
  }
  await addAffiliation(p, CRM.org, {
    ...crmBase(),
    id: randomUUID(),
    expected_version: await version("organisations", CRM.org),
    person_id: blair,
    role_label: "SYN Grower contact",
    valid_from: "2026-01-01",
    valid_to: null,
  });
  deal = crmCreate();
  await createOpportunity(p, deal);
});

test("one number held by two people returns both, by name, with Blair's organisation, open deal and next activity", async () => {
  const result = await lookupNumber(await principal(), { number: "+61 412 000 111" });
  assert.equal(result.number_e164, "+61412000111");
  assert.deepEqual(result.matches.map((m) => [m.party_type, m.party.id, m.party.display_name]), [
    ["Person", alex, "SYN Alex Caller"],
    ["Person", blair, "SYN Blair Caller"],
  ]);
  const [a, b] = result.matches;
  assert.deepEqual([a.organisations, a.open_opportunities, a.next_activity], [[], [], null]);
  assert.deepEqual(b.organisations.map((o) => o.id), [CRM.org]);
  assert.ok(b.open_opportunities.some((o) => o.id === deal.id && o.title === deal.title));
  assert.equal(b.next_activity?.id, deal.initial_action.id);
  assert.equal(b.number.label, "Mobile");
});

test("an identity that cannot read these people gets no matches rather than a hidden count", async () => {
  for (const profile of ["second-company", "other-workspace"])
    assert.deepEqual((await lookupNumber(await principal(profile), { number: "+61412000111" })).matches, []);
});

test("a local number needs the company whose region it is written in; unreadable text has no matches", async () => {
  const p = await principal();
  await assert.rejects(lookupNumber(p, { number: shared }), (e: { code?: string }) => e.code === "InvalidData");
  assert.equal((await lookupNumber(p, { number: shared, company_id: CRM.company })).matches.length, 2);
  await assert.rejects(lookupNumber(await principal("other-workspace"), { number: shared, company_id: CRM.company }));
  assert.deepEqual(await lookupNumber(p, { number: "+SYN phone" }), { number_e164: null, matches: [] });
});

test("lookup writes nothing", async () => {
  const counts = async () =>
    rows("SELECT (SELECT count(*) FROM ppo.audit_events)::int AS a,(SELECT count(*) FROM ppo.operation_receipts)::int AS r,(SELECT count(*) FROM ppo.call_events)::int AS e,(SELECT count(*) FROM ppo.outbox_jobs)::int AS o");
  const p = await principal(),
    before = await counts();
  await lookupNumber(p, { number: "+61412000111" });
  assert.deepEqual(await counts(), before);
});

test("organisation-only and mixed person/organisation matches return without an unused SQL parameter", async () => {
  const p = await principal();
  await setPartyNumbers(p, "Organisation", CRM.org, {
    ...crmBase(), expected_version: await version("organisations", CRM.org),
    numbers: [{ label: "Work", entered: "0412 000 112", is_primary: true }],
  });
  const only = await lookupNumber(p, { number: "+61412000112" });
  assert.deepEqual(only.matches.map((m) => [m.party_type, m.party.id]), [["Organisation", CRM.org]]);
  assert.deepEqual(only.matches[0].organisations.map((o) => o.id), [CRM.org]);
  assert.ok(only.matches[0].open_opportunities.some((o) => o.id === deal.id));
  await setPartyNumbers(p, "Organisation", CRM.org, {
    ...crmBase(), expected_version: await version("organisations", CRM.org),
    numbers: [{ label: "Work", entered: shared, is_primary: true }],
  });
  const mixed = await lookupNumber(p, { number: "+61412000111" });
  assert.deepEqual(mixed.matches.map((m) => m.party.id).sort(), [alex, blair, CRM.org].sort());
  assert.deepEqual((await lookupNumber(await principal("other-workspace"), { number: "+61412000111" })).matches, []);
});
