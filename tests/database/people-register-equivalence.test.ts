import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, type Principal } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  createPerson,
  createOrganisation,
  createSite,
  addAffiliation,
} from "../../src/shared/commands";
import {
  revisePerson,
  setSitePrimaryContact,
} from "../../src/shared/contacts/commands";
import { recordNoticePreference } from "../../src/communications/preferences";
import { peopleRegister } from "../../src/shared/people-register";
import { peopleRegister as original } from "../helpers/people-register-main";
import {
  peopleViews,
  peopleSorts,
} from "../../src/shared/people-register-model";
import {
  assertPeopleEqual,
  capturePeople,
} from "../helpers/people-register-plan";
import { CRM, crmBase } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const ids = [1, 2, 3, 4].map((n) => `9f890001-0000-4000-8000-00000000000${n}`);
const orgs = [1, 2].map((n) => `9f890002-0000-4000-8000-00000000000${n}`);
const site = "9f890003-0000-4000-8000-000000000001";
const names = [
  "SYN People Alpha",
  "SYN People alpha",
  "SYN People Beta",
  "SYN People Zeta",
];
const hiddenPerson = "9f890001-0000-4000-8000-000000000005";
let p: Principal;
let correction: string;
const invalid = (e: unknown) => (e as { code: string }).code === "InvalidData";
async function version(table: "organisations" | "sites", id: string) {
  return (
    await database().query(`SELECT version FROM ppo.${table} WHERE id=$1`, [id])
  ).rows[0].version;
}
async function compare(
  input: Record<string, unknown> = {},
  actor = p,
  company = CRM.company,
) {
  return withWorkingCompany(actor.actor_id, company, async () => {
    const old = await capturePeople(original, actor, input);
    const fixed = await capturePeople(peopleRegister, actor, input);
    assertPeopleEqual(old, fixed);
    return fixed.data;
  });
}
before(async () => {
  await reset();
  p = (await createSession("coordinator")).principal;
  const second = (await createSession("second-company")).principal;
  await createPerson(second, {
    ...crmBase(),
    id: hiddenPerson,
    company_ids: [CRM.companyB],
    display_name: "SYN People Hidden",
  });
  for (let i = 0; i < ids.length; i++)
    await createPerson(p, {
      ...crmBase(),
      id: ids[i],
      company_ids: [CRM.company],
      display_name: names[i],
      email: i < 2 ? "same@example.invalid" : null,
      phone: i < 2 ? "0491 570 006" : null,
    });
  for (let i = 0; i < orgs.length; i++)
    await createOrganisation(p, {
      ...crmBase(),
      id: orgs[i],
      company_id: CRM.company,
      display_name: `SYN Affiliation ${i ? "Beta" : "Alpha"}`,
      relationship_status: "Active",
      owner_id: CRM.owner,
    });
  for (const [person, org, role, from, to] of [
    [ids[0], orgs[0], "Alpha role", "2000-01-01", null],
    [ids[0], orgs[0], "Beta role", "2000-01-01", null],
    [ids[0], orgs[1], "Current role", "2000-01-01", null],
    [ids[0], orgs[1], "Expired role", "2000-01-01", "2001-01-01"],
    [ids[0], orgs[1], "Future role", "2099-01-01", null],
    [ids[2], orgs[1], "Current role", "2000-01-01", null],
    [ids[3], orgs[0], "Inactive role", "2000-01-01", null],
  ])
    await addAffiliation(p, org!, {
      ...crmBase(),
      id: randomUUID(),
      expected_version: await version("organisations", org!),
      person_id: person,
      role_label: role,
      valid_from: from,
      valid_to: to,
    });
  await createSite(p, {
    ...crmBase(),
    id: site,
    company_id: CRM.company,
    display_name: "SYN People site",
    location_description: "Synthetic",
    timezone: "Australia/Brisbane",
    owner_id: CRM.owner,
    primary_contact_id: ids[0],
  });
  await setSitePrimaryContact(p, CRM.site, {
    ...crmBase(),
    expected_version: await version("sites", CRM.site),
    primary_contact_id: ids[1],
  });
  const operation = crmBase();
  await revisePerson(p, ids[0], {
    ...operation,
    expected_version: 1,
    display_name: names[0],
    email: "same@example.invalid",
    phone: "0491 570 006",
    contact_preference: "Email",
    active: true,
  });
  correction = (
    await database().query(
      "SELECT occurred_at FROM ppo.audit_events WHERE operation_id=$1 AND object_id=$2",
      [operation.operation_id, ids[0]],
    )
  ).rows[0].occurred_at.toISOString();
  await revisePerson(p, ids[3], {
    ...crmBase(),
    expected_version: 1,
    display_name: names[3],
    email: null,
    phone: null,
    contact_preference: null,
    active: false,
  });
  for (const [cls, pref, v] of [
    ["VisitConfirmation", "DoNotNotify", 0],
    ["VisitConfirmation", "Allowed", 1],
    ["ProjectUpdate", "DoNotNotify", 0],
  ] as const)
    await recordNoticePreference(p, ids[0], {
      ...crmBase(),
      company_id: CRM.company,
      message_class: cls,
      preference: pref,
      expected_version: v,
    });
});

test("complete raw/public oracle: all views, sorts, directions and every cursor boundary", async () => {
  const counts = { Active: 3, SiteContacts: 2, Channels: 1, Inactive: 1 };
  for (const view of peopleViews)
    for (const sort of peopleSorts)
      for (const direction of ["asc", "desc"] as const) {
        // Explicit independent ID ledger: name/email/phone ties use ascending IDs;
        // NULL channels sort last in both directions. Status is tied within each view.
        let expected =
          view === "Inactive"
            ? [ids[3]]
            : view === "Channels"
              ? [ids[2]]
              : view === "SiteContacts"
                ? ids.slice(0, 2)
                : ids.slice(0, 3);
        if (sort === "name" && direction === "desc" && view === "Active")
          expected = [ids[2], ids[0], ids[1]];
        const query = { q: "SYN People", view, sort, direction, limit: 1 };
        let cursor: string | null = null;
        const seen: string[] = [];
        do {
          const data = await compare({
            ...query,
            ...(cursor ? { cursor } : {}),
          });
          assert.equal(data.total, expected.length);
          assert.deepEqual(data.counts, counts);
          assert.deepEqual(
            data.items.map((r) => r.id),
            expected.slice(seen.length, seen.length + 1),
          );
          seen.push(...data.items.map((r) => r.id));
          assert.equal(
            data.next_cursor !== null,
            seen.length < expected.length,
          );
          cursor = data.next_cursor;
        } while (cursor);
        assert.deepEqual(seen, expected);
      }
});

test("expected affiliations, dates, notices, corrections, filters and empty results", async () => {
  const all = await compare({ q: "SYN People" });
  assert.deepEqual(
    all.items.map((r) => r.id),
    ids.slice(0, 3),
  );
  const row = all.items[0];
  assert.deepEqual(row.organisations, [
    { id: orgs[0], name: "SYN Affiliation Alpha", role: "Alpha role" },
    { id: orgs[0], name: "SYN Affiliation Alpha", role: "Beta role" },
    { id: orgs[1], name: "SYN Affiliation Beta", role: "Current role" },
  ]);
  assert.deepEqual(row.sites, [{ id: site, name: "SYN People site" }]);
  assert.equal(row.notice_exceptions, 1);
  assert.equal(row.notices_restricted, false);
  assert.equal(row.history_restricted, false);
  assert.equal(new Date(row.last_correction!).toISOString(), correction);
  assert.equal(row.contact_preference, "Email");
  assert.deepEqual(all.items[1].organisations, []);
  assert.equal(all.items[1].last_correction, null);
  assert.deepEqual(all.items[2].sites, []);
  assert.deepEqual(
    all.organisations.map((o) => o.id).sort(),
    [CRM.org, ...orgs].sort(),
  );
  for (const [filter, expected] of [
    [{ organisation: orgs[0] }, [ids[0]]],
    [{ organisation: orgs[1] }, [ids[0], ids[2]]],
    [{ notices: "DoNotNotify" }, [ids[0]]],
    [{ q: "SYN AFFILIATION BETA" }, [ids[0], ids[2]]],
    [{ q: "same@example.invalid" }, ids.slice(0, 2)],
    [{ q: "0491 570 006" }, ids.slice(0, 2)],
    [{ q: "Future role" }, []],
    [{ q: "Expired role" }, []],
    [{ organisation: CRM.orgB }, []],
    [{ q: "does not exist" }, []],
  ] as const) {
    const found = await compare({ q: "SYN People", ...filter });
    assert.deepEqual(
      found.items.map((r) => r.id),
      expected,
    );
    assert.equal(found.total, expected.length);
    assert.deepEqual(
      found.organisations,
      all.organisations,
      "Options do not inherit row filters",
    );
  }
  const inactive = await compare({
    q: "SYN People",
    view: "Inactive",
    organisation: orgs[0],
  });
  assert.deepEqual(
    inactive.items.map((r) => r.id),
    [ids[3]],
  );
  assert.deepEqual(inactive.counts, {
    Active: 1,
    SiteContacts: 1,
    Channels: 0,
    Inactive: 1,
  });
});

test("permission-sensitive affiliation and primary-site projections exclude hidden company data", async () => {
  const all = await compare();
  assert.equal(all.total, 4);
  assert.deepEqual(all.counts, {
    Active: 4,
    SiteContacts: 3,
    Channels: 2,
    Inactive: 1,
  });
  const avery = all.items.find((r) => r.id === CRM.person)!;
  assert.ok(avery);
  assert.deepEqual(
    avery.organisations.map((o) => o.id),
    [CRM.org],
  );
  assert.equal(avery.notices_restricted, true);
  assert.equal(avery.history_restricted, true);
  assert.equal(avery.last_correction, null);
  assert.deepEqual(
    avery.sites.map((s) => s.id),
    ["70000000-0000-4000-8000-000000000002"],
  );
  assert.ok(!JSON.stringify(all).includes(CRM.orgB));
  assert.ok(!JSON.stringify(all).includes(hiddenPerson));
  assert.equal((await compare({ q: "SYN People Hidden" })).total, 0);
  const second = (await createSession("second-company")).principal;
  const b = await compare({}, second, CRM.companyB);
  assert.deepEqual(
    b.items.map((r) => r.id),
    [CRM.person, hiddenPerson],
  );
  assert.deepEqual(
    b.items[0].organisations.map((o) => o.id),
    [CRM.orgB],
  );
  assert.deepEqual(
    b.items[0].sites.map((s) => s.id),
    ["70000000-0000-4000-8000-000000000003"],
  );
  const siteObserver = (await createSession("site-observer")).principal;
  const restricted = await compare({}, siteObserver);
  assert.deepEqual(
    restricted.items.map((r) => r.id),
    [ids[1]],
  );
  assert.deepEqual(restricted.counts, {
    Active: 1,
    SiteContacts: 1,
    Channels: 0,
    Inactive: 0,
  });
  assert.deepEqual(restricted.organisations, []);
  assert.deepEqual(restricted.items[0].organisations, []);
  assert.deepEqual(
    restricted.items[0].sites.map((s) => s.id),
    [CRM.site],
  );
  assert.equal(restricted.items[0].history_restricted, true);
  assert.equal(restricted.items[0].last_correction, null);
  assert.equal(restricted.items[0].notices_restricted, true);
  assert.equal(restricted.items[0].notice_exceptions, 0);
  const observer = (await createSession("observer")).principal;
  const readOnly = await compare({ q: names[0] }, observer);
  assert.deepEqual(
    readOnly.items.map((r) => r.id),
    ids.slice(0, 2),
  );
  assert.ok(
    readOnly.items.every(
      (r) => r.history_restricted && r.last_correction === null,
    ),
  );
  const outsider = (await createSession("other-workspace")).principal;
  const outside = await compare({}, outsider);
  assert.deepEqual(outside.items, []);
  assert.deepEqual(outside.organisations, []);
  const ownWorkspace = await compare(
    {},
    outsider,
    "20000000-0000-4000-8000-000000000003",
  );
  assert.deepEqual(
    ownWorkspace.items.map((r) => r.id),
    ["60000000-0000-4000-8000-000000000002"],
  );
});

test("signed cursors reject changed context and removed anchors; parent constraints stay enabled", async () => {
  const query = { q: "SYN People", limit: 1 };
  const first = await compare(query);
  assert.ok(first.next_cursor);
  for (const reader of [original, peopleRegister]) {
    for (const changed of [
      { q: "changed" },
      { view: "Inactive" },
      { organisation: orgs[0] },
      { notices: "DoNotNotify" },
      { sort: "phone" },
      { direction: "desc" },
      { limit: 2 },
      { cursor: first.next_cursor + "x" },
    ])
      await assert.rejects(
        withWorkingCompany(p.actor_id, CRM.company, () =>
          reader(p, { ...query, cursor: first.next_cursor, ...changed }),
        ),
        invalid,
      );
    await assert.rejects(
      withWorkingCompany(p.actor_id, CRM.companyB, () =>
        reader(p, { ...query, cursor: first.next_cursor }),
      ),
      invalid,
    );
    const other = (await createSession("observer")).principal;
    await assert.rejects(
      withWorkingCompany(other.actor_id, CRM.company, () =>
        reader(other, { ...query, cursor: first.next_cursor }),
      ),
      invalid,
    );
  }
  // Deletion is not a legal missing-parent fixture. The real schema must refuse it.
  for (const [table, id] of [
    ["organisations", orgs[0]],
    ["sites", site],
  ] as const)
    await assert.rejects(
      database().query(`DELETE FROM ppo.${table} WHERE id=$1`, [id]),
      (e: unknown) => (e as { code: string }).code === "55000",
    );
  assert.equal((await compare(query)).total, 3);
  await revisePerson(p, ids[0], {
    ...crmBase(),
    expected_version: 2,
    display_name: names[0],
    email: "same@example.invalid",
    phone: "0491 570 006",
    contact_preference: "Email",
    active: false,
  });
  for (const reader of [original, peopleRegister])
    await assert.rejects(
      withWorkingCompany(p.actor_id, CRM.company, () =>
        reader(p, { ...query, cursor: first.next_cursor }),
      ),
      invalid,
    );
});
