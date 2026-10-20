import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { createPerson, addAffiliation } from "../../src/shared/commands";
import {
  revisePerson,
  setSitePrimaryContact,
} from "../../src/shared/contacts/commands";
import { recordNoticePreference } from "../../src/communications/preferences";
import { peopleRegister } from "../../src/shared/people-register";
import { CRM, crmBase } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const invalid = (e: unknown) => (e as { code: string }).code === "InvalidData";

test("CS02 permitted rows, counts, options and signed pagination share one population", async () => {
  const p = (await createSession("coordinator")).principal;
  const name = "SYN CS02 register proof",
    ids = [randomUUID(), randomUUID(), randomUUID()];
  for (const id of ids)
    await createPerson(p, {
      ...crmBase(),
      id,
      company_ids: [CRM.company],
      display_name: name,
      email: "person@register.example",
      phone: "0491 570 006",
    });
  const all = await peopleRegister(p, { q: name });
  assert.equal(all.total, 3);
  assert.equal(all.counts.Active, 3);
  assert.equal(all.counts.Channels, 0);
  for (const sort of ["name", "phone", "email", "status"]) {
    const first = await peopleRegister(p, { q: name, sort, limit: 2 });
    assert.equal(first.items.length, 2);
    assert.ok(first.next_cursor);
    const next = await peopleRegister(p, {
      q: name,
      sort,
      limit: 2,
      cursor: first.next_cursor,
    });
    assert.equal(next.items.length, 1);
    assert.equal(
      new Set([...first.items, ...next.items].map((x) => x.id)).size,
      3,
    );
    assert.deepEqual(next.counts, first.counts);
    for (const changed of [
      { view: "Inactive" },
      { q: "changed" },
      { direction: "desc" },
      { limit: 3 },
    ])
      await assert.rejects(
        peopleRegister(p, {
          q: name,
          sort,
          limit: 2,
          cursor: first.next_cursor,
          ...changed,
        }),
        invalid,
      );
    await assert.rejects(
      withWorkingCompany(p.actor_id, CRM.company, () =>
        peopleRegister(p, {
          q: name,
          sort,
          limit: 2,
          cursor: first.next_cursor,
        }),
      ),
      invalid,
    );
    const other = (await createSession("other-workspace")).principal;
    await assert.rejects(
      peopleRegister(other, {
        q: name,
        sort,
        limit: 2,
        cursor: first.next_cursor,
      }),
      invalid,
    );
  }
  const hidden = (await createSession("site-observer")).principal;
  const scoped = await peopleRegister(hidden, { q: name });
  assert.equal(scoped.total, 0);
  assert.equal(scoped.counts.Active, 0);
  await assert.rejects(peopleRegister(p, { limit: 201 }), invalid);
  await assert.rejects(
    peopleRegister(p, { organisation: "not-an-id" }),
    invalid,
  );
});

test("CS02 current affiliations, permitted primary sites, latest notices and correction visibility match existing duties", async () => {
  const p = (await createSession("coordinator")).principal,
    id = randomUUID();
  await createPerson(p, {
    ...crmBase(),
    id,
    company_ids: [CRM.company],
    display_name: "SYN CS02 summary proof",
  });
  const orgVersion = (
    await database().query(
      "SELECT version FROM ppo.organisations WHERE id=$1",
      [CRM.org],
    )
  ).rows[0].version;
  await addAffiliation(p, CRM.org, {
    ...crmBase(),
    id: randomUUID(),
    person_id: id,
    expected_version: orgVersion,
    role_label: "Recorded grower",
    valid_from: "2020-01-01",
    valid_to: null,
  });
  const siteVersion = (
    await database().query("SELECT version FROM ppo.sites WHERE id=$1", [
      CRM.site,
    ])
  ).rows[0].version;
  await setSitePrimaryContact(p, CRM.site, {
    ...crmBase(),
    expected_version: siteVersion,
    primary_contact_id: id,
  });
  const notice = {
    company_id: CRM.company,
    message_class: "VisitConfirmation",
    preference: "DoNotNotify",
    expected_version: 0,
  };
  await recordNoticePreference(p, id, { ...crmBase(), ...notice });
  await revisePerson(p, id, {
    ...crmBase(),
    expected_version: 1,
    display_name: "SYN CS02 summary proof",
    email: "proof@register.example",
    phone: null,
    contact_preference: "Email",
    active: true,
  });
  const read = () => peopleRegister(p, { q: "SYN CS02 summary proof" });
  const r = await read(),
    row = r.items[0];
  assert.equal(r.total, 1);
  assert.equal(r.counts.SiteContacts, 1);
  assert.equal(r.counts.Channels, 1);
  assert.equal(row.organisations[0].role, "Recorded grower");
  assert.equal(row.sites[0].id, CRM.site);
  assert.equal(row.notice_exceptions, 1);
  assert.equal(row.history_restricted, false);
  assert.ok(row.last_correction);
  const orgFiltered = await peopleRegister(p, {
    organisation: CRM.org,
    q: "SYN CS02 summary proof",
  });
  assert.equal(orgFiltered.total, 1);
  assert.ok(orgFiltered.organisations.some((o) => o.id === CRM.org));
  const observer = (await createSession("site-observer")).principal;
  const restricted = (
    await peopleRegister(observer, { q: "SYN CS02 summary proof" })
  ).items[0];
  assert.ok(restricted);
  assert.equal(restricted.history_restricted, true);
  assert.equal(restricted.last_correction, null);
  assert.equal(restricted.notices_restricted, true);
  assert.equal(restricted.notice_exceptions, 0);
  assert.deepEqual(restricted.organisations, []);
  assert.equal(restricted.sites[0].id, CRM.site);
  await recordNoticePreference(p, id, {
    ...crmBase(),
    ...notice,
    expected_version: 1,
    preference: "Allowed",
  });
  assert.equal((await read()).items[0].notice_exceptions, 0);
  assert.equal(
    (
      await peopleRegister(p, {
        q: "SYN CS02 summary proof",
        notices: "DoNotNotify",
      })
    ).total,
    0,
  );
  await database().query("UPDATE ppo.people SET active=false WHERE id=$1", [
    id,
  ]);
  assert.equal((await read()).total, 0);
  const inactive = await peopleRegister(p, {
    q: "SYN CS02 summary proof",
    view: "Inactive",
  });
  assert.equal(inactive.total, 1);
  assert.equal(inactive.items[0].sites[0].id, CRM.site);
});
