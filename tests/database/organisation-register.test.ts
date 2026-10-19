import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset } from "../../scripts/database";
import { organisationRegister } from "../../src/shared/organisation-register";
import { customer360 } from "../../src/shared/customer-360";
import { createOpportunity } from "../../src/crm/opportunities";
import { recordOpportunityOutcome } from "../../src/crm/outcomes";
import { CRM, crmBase, crmDiscovery } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async () => (await createSession("coordinator")).principal;
const invalid = (e: unknown) => (e as { code: string }).code === "InvalidData";

test("CS01 one authorised population supplies rows, view counts, owner options and signed pages", async () => {
  const p = await principal();
  const all = await organisationRegister(p, {});
  assert.equal(all.total, all.items.length);
  for (const view of [
    "Prospects",
    "Duplicates",
    "NoSite",
    "Inactive",
  ] as const) {
    const r = await organisationRegister(p, { view });
    assert.equal(r.total, all.counts[view]);
  }
  for (const sort of [
    "name",
    "status",
    "owner",
    "sites",
    "deals",
    "follow_up",
    "sector",
    "areas",
    "reference",
  ]) {
    const expected = await organisationRegister(p, { sort, direction: "desc" });
    const first = await organisationRegister(p, {
      sort,
      direction: "desc",
      limit: 2,
    });
    assert.ok(first.next_cursor);
    const second = await organisationRegister(p, {
      sort,
      direction: "desc",
      limit: 2,
      cursor: first.next_cursor,
    });
    assert.deepEqual(
      [...first.items, ...second.items].map((i) => i.id),
      expected.items.map((i) => i.id),
    );
    await assert.rejects(
      organisationRegister(p, {
        sort,
        direction: "asc",
        limit: 2,
        cursor: first.next_cursor,
      }),
      invalid,
    );
    await assert.rejects(
      withWorkingCompany(p.actor_id, CRM.company, () =>
        organisationRegister(p, {
          sort,
          direction: "desc",
          limit: 2,
          cursor: first.next_cursor,
        }),
      ),
      invalid,
    );
  }
  const empty = await organisationRegister(p, {
    q: "SYN no such organisation",
  });
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.items, []);
  await assert.rejects(organisationRegister(p, { limit: 201 }), invalid);
  await assert.rejects(
    organisationRegister(p, { sort: "name;DROP TABLE" }),
    invalid,
  );
});

test("CS01 counts do not disclose hidden records or a revoked source", async () => {
  const p = await principal(),
    input = crmDiscovery();
  await createOpportunity(p, input);
  let r = await organisationRegister(p, {});
  assert.equal(r.items.find((i) => i.id === CRM.org)!.deals, 1);
  await recordOpportunityOutcome(p, input.id, {
    ...crmBase(),
    expected_version: 1,
    close_outcome: "Lost",
    lost_reason: "Timing",
    acceptance_evidence: null,
  });
  r = await organisationRegister(p, {});
  assert.equal(r.items.find((i) => i.id === CRM.org)!.deals, 0);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('crm.opportunity.read','activity.read')",
    [p.actor_id],
  );
  r = await organisationRegister(p, {});
  assert.ok(
    r.items.every(
      (i) =>
        i.deals === null &&
        i.follow_up_state === "Restricted" &&
        i.next_follow_up === null,
    ),
  );
  const scoped = await withWorkingCompany(p.actor_id, CRM.companyB, () =>
    organisationRegister(p, {}),
  );
  assert.ok(scoped.items.every((i) => i.company_id === CRM.companyB));
  assert.equal(scoped.total, scoped.counts.All);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
    [p.actor_id],
  );
  await assert.rejects(
    organisationRegister(p, {}),
    (e: unknown) => (e as { code: string }).code === "Forbidden",
  );
});

test("CS01 ten concurrent readers retain scoped counts and bounded pages at 1000 organisations", async () => {
  const p = await principal();
  const before = await organisationRegister(p);
  const added = (await database().query<{ id: string }>(
    `INSERT INTO ppo.organisations(id,workspace_id,company_id,created_by,updated_by,owner_id,display_name,relationship_status)
     SELECT gen_random_uuid(),$1,$2,$3,$3,$3,'SYN CS01 load '||n,'Active'
     FROM generate_series(1,1000-(SELECT count(*)::int FROM ppo.organisations WHERE workspace_id=$1)) n
     RETURNING id`,
    [p.workspace_id, CRM.company, p.actor_id],
  )).rows.length;
  assert.ok(added > 0);
  // Use the normal pool/statement deadlines and all ten original reads; no retry.
  const results = await Promise.all(Array.from({ length: 10 }, () => organisationRegister(p)));
  for (const result of results) {
    assert.equal(result.total, before.total + added);
    assert.equal(result.counts.All, before.counts.All + added);
    assert.equal(result.counts.NoSite, before.counts.NoSite + added);
    assert.equal(result.counts.Prospects, before.counts.Prospects);
    assert.equal(result.counts.Inactive, before.counts.Inactive);
    assert.equal(result.items.length, 25);
    assert.ok(result.next_cursor);
    assert.deepEqual(result.owners, before.owners);
  }
  const remaining = await organisationRegister(p, { cursor: results[0].next_cursor });
  assert.equal(remaining.total, results[0].total);
  assert.equal(remaining.items.length, 25);
  assert.ok(remaining.items.every(row => !results[0].items.some(first => first.id === row.id)));
});

test("CS01 retains current/historical site roles and never labels a restricted source empty", async () => {
  const p = await principal(),
    r = await customer360(p, CRM.org);
  assert.ok(r.context.company_name);
  assert.ok(
    r.context.sites.some((s) => s.relationships?.some((rel) => rel.is_current)),
  );
  assert.equal(r.sections.accounts.state, "Restricted");
  assert.deepEqual(r.sections.accounts.items, []);
  assert.equal(r.sections.orders.state, "Not configured");
  assert.ok(
    r.sections.cases.items.every(
      (i) => i.open_state === "Open" || i.open_state === "Closed",
    ),
  );
  assert.ok(
    r.sections.work_orders.items.every((i) => i.open_state === undefined),
  );
});
