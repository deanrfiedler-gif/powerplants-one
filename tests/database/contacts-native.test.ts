import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { addAffiliation, createPerson } from "../../src/shared/commands";
import {
  revisePerson,
  endAffiliation,
  setSitePrimaryContact,
} from "../../src/shared/contacts/commands";
import {
  contactWorkspace,
  stakeholders,
} from "../../src/shared/contacts/reads";
import { readOperation } from "../../src/shared/receipts";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const id = (type: number, n = 1) =>
  `${type}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let person: string;
const org = id(50),
  site = id(70),
  company = id(20);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN contact completion proof",
});
// Each case owns a distinct Person. The issued fixture Person deliberately
// spans two companies, so it is not a valid editable single-company fixture.
beforeEach(async () => {
  const p = await principal();
  person = randomUUID();
  await createPerson(p, {
    ...base(),
    id: person,
    company_ids: [company],
    display_name: "SYN scoped contact",
  });
  const siteVersion = (
    await database().query("SELECT version FROM ppo.sites WHERE id=$1", [site])
  ).rows[0].version;
  await setSitePrimaryContact(p, site, {
    ...base(),
    expected_version: siteVersion,
    primary_contact_id: person,
  });
});
const code = (wanted: string) => (e: unknown) =>
  (e as { code?: string }).code === wanted;
const correction = () => ({
  ...base(),
  expected_version: 1,
  display_name: "SYN corrected contact",
  email: null,
  phone: "SYN phone",
  contact_preference: "Phone for site visits; consent not stated",
  active: true,
});

test("CS02 correction is versioned, audited and exactly replayable; changed originals and stale writes fail", async () => {
  const p = await principal(),
    command = correction();
  const before = await contactWorkspace(p, person);
  command.expected_version = before.version;
  const result = await revisePerson(p, person, command);
  assert.equal(result.receipt.record_version, before.version + 1);
  assert.equal((await revisePerson(p, person, command)).replayed, true);
  assert.deepEqual(
    await readOperation(p, command.operation_id),
    result.receipt,
  );
  await assert.rejects(
    revisePerson(p, person, { ...command, display_name: "Changed original" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    revisePerson(p, person, { ...command, operation_id: randomUUID() }),
    code("VersionConflict"),
  );
  const saved = await contactWorkspace(p, person);
  assert.equal(saved.display_name, command.display_name);
  assert.equal(saved.email, null);
  assert.equal(
    saved.history.items[0].details.before?.display_name,
    before.display_name,
  );
  assert.equal(
    saved.history.items[0].details.after?.contact_preference,
    command.contact_preference,
  );
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.audit_events WHERE operation_id=$1",
        [command.operation_id],
      )
    ).rows[0].n,
    1,
  );
});

test("CS02 current authority precedes receipt lookup, including all shared Person company contexts", async () => {
  const p = await principal(),
    command = correction();
  await revisePerson(p, person, command);
  await database().query(
    "INSERT INTO ppo.person_company_contexts(workspace_id,company_id,person_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
    [p.workspace_id, id(20, 2), person],
  );
  assert.equal((await contactWorkspace(p, person)).can_edit, false);
  await assert.rejects(
    revisePerson(p, person, command),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(p, command.operation_id),
    code("RecordUnavailable"),
  );
});

test("CS02/03 site-only contacts are restricted rather than empty; no hidden affiliation identities or counts", async () => {
  const p = await principal("site-observer");
  const view = await contactWorkspace(p, person),
    map = await stakeholders(p, org);
  assert.equal(view.can_edit, false);
  assert.equal(view.affiliations.state, "Restricted");
  assert.deepEqual(view.affiliations.items, []);
  assert.equal(map.affiliations.state, "Restricted");
  assert.deepEqual(map.affiliations.items, []);
  assert.ok(!("total" in map.affiliations));
  assert.equal(view.history.state, "Restricted");
  await assert.rejects(
    revisePerson(p, person, correction()),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    contactWorkspace(await principal("other-workspace"), person),
  );
  await assert.rejects(
    contactWorkspace(await principal("second-company"), person),
  );
});

test("CS03 affiliation end keeps history, versions the Organisation and refuses stale or unrelated relationships", async () => {
  const p = await principal(),
    rel = randomUUID(),
    newPerson = randomUUID();
  await createPerson(p, {
    ...base(),
    id: newPerson,
    company_ids: [company],
    display_name: "SYN historic affiliation",
  });
  const before = (await stakeholders(p, org)).organisation.version;
  await addAffiliation(p, org, {
    ...base(),
    id: rel,
    expected_version: before,
    person_id: newPerson,
    role_label: "SYN reported site liaison",
    valid_from: "2020-01-01",
  });
  const command = {
    ...base(),
    expected_version: before + 1,
    relationship_id: rel,
    valid_to: "2021-01-01",
  };
  const result = await endAffiliation(p, org, command);
  assert.equal(result.receipt.record_version, before + 2);
  assert.equal((await endAffiliation(p, org, command)).replayed, true);
  const ended = (await stakeholders(p, org)).affiliations.items.find(
    (x) => x.id === rel,
  )!;
  assert.equal(ended.period, "Historic");
  assert.equal(ended.valid_to, "2021-01-01");
  assert.equal(ended.authority_basis, "Recorded");
  assert.equal(ended.can_end, false);
  await assert.rejects(
    endAffiliation(p, org, { ...command, operation_id: randomUUID() }),
    code("VersionConflict"),
  );
  await assert.rejects(
    endAffiliation(p, org, {
      ...command,
      operation_id: randomUUID(),
      relationship_id: randomUUID(),
    }),
    code("RecordUnavailable"),
  );
});

test("CS04 primary-contact replacement checks exact company and active Person, retains original audit and rejects stale Site", async () => {
  const p = await principal(),
    newPerson = randomUUID();
  await createPerson(p, {
    ...base(),
    id: newPerson,
    company_ids: [company],
    display_name: "SYN replacement contact",
  });
  const before = (
    await database().query(
      "SELECT version,primary_contact_id FROM ppo.sites WHERE id=$1",
      [site],
    )
  ).rows[0];
  const command = {
    ...base(),
    expected_version: before.version,
    primary_contact_id: newPerson,
  };
  await setSitePrimaryContact(p, site, command);
  assert.equal((await setSitePrimaryContact(p, site, command)).replayed, true);
  assert.ok(
    (await contactWorkspace(p, newPerson)).sites.items.some(
      (x) => x.id === site,
    ),
  );
  await assert.rejects(
    setSitePrimaryContact(p, site, { ...command, operation_id: randomUUID() }),
    code("VersionConflict"),
  );
  await assert.rejects(
    setSitePrimaryContact(p, site, {
      ...command,
      operation_id: randomUUID(),
      expected_version: before.version + 1,
      primary_contact_id: id(60, 3),
    }),
  );
  await revisePerson(p, newPerson, { ...correction(), active: false });
  await assert.rejects(
    setSitePrimaryContact(p, site, {
      ...base(),
      expected_version: before.version + 1,
      primary_contact_id: newPerson,
    }),
    code("RecordUnavailable"),
  );
  const clear = {
    ...base(),
    expected_version: before.version + 1,
    primary_contact_id: null,
  };
  await setSitePrimaryContact(p, site, clear);
  assert.equal(
    (
      await database().query(
        "SELECT primary_contact_id FROM ppo.sites WHERE id=$1",
        [site],
      )
    ).rows[0].primary_contact_id,
    null,
  );
});
