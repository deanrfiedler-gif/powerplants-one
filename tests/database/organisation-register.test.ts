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
import { createActivity } from "../../src/activities/activities";
import { CRM, crmBase, crmDiscovery } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async () => (await createSession("coordinator")).principal;
const invalid = (e: unknown) => (e as { code: string }).code === "InvalidData";

test("CS01 aggregate follow-ups retain shared links, due ordering and revoked access", async () => {
  const p = await principal();
  const organisations = ["e6040000-0000-4000-8000-000000000001", "e6040000-0000-4000-8000-000000000002"];
  for (const id of organisations) await database().query(
    "INSERT INTO ppo.organisations(id,workspace_id,company_id,created_by,updated_by,owner_id,display_name,relationship_status) VALUES($1,$2,$3,$4,$4,$4,$5,'Active')",
    [id, CRM.workspace, CRM.company, p.actor_id, `SYN register aggregate ${id}`],
  );
  const activities = ["e6041000-0000-4000-8000-000000000001", "e6041000-0000-4000-8000-000000000002", "e6041000-0000-4000-8000-000000000003"];
  for (const [index, id] of activities.entries()) await createActivity(p, {
    ...crmBase(), id, company_id: CRM.company, site_id: null, kind: "CustomerContact",
    owner_id: p.actor_id, summary: `SYN aggregate follow-up ${index}`,
    due_at: index === 2 ? null : "2031-10-01T00:00:00Z", due_needed: index === 2,
    access_class: "Internal",
    links: organisations.map(object_id => ({ object_type: "Organisation", object_id })),
  });
  for (const expected of activities) {
    const result = await organisationRegister(p, { q: "SYN register aggregate" });
    assert.equal(result.total, 2);
    assert.ok(result.items.every(row => row.next_follow_up?.id === expected));
    assert.ok(result.items.every(row => row.sites === 0 && row.areas === 0 && row.deals === 0));
    if (expected !== activities.at(-1)) await database().query("UPDATE ppo.activities SET status='Completed',outcome='SYN selection fixture completed',version=version+1 WHERE id=$1", [expected]);
  }
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'", [p.actor_id]);
  const revoked = await organisationRegister(p, { q: "SYN register aggregate" });
  assert.ok(revoked.items.every(row => row.follow_up_state === "Restricted" && row.next_follow_up === null));
});

test("CS01 thousand-organisation register keeps exact counts and bounded signed pages", async () => {
  const p = await principal();
  await database().query(`INSERT INTO ppo.organisations(id,workspace_id,company_id,created_by,updated_by,owner_id,display_name,relationship_status)
    SELECT ('e6042000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,$1,$2,$3,$3,$3,'SYN register load '||n,'Active'
    FROM generate_series(1,1000-(SELECT count(*)::int FROM ppo.organisations WHERE workspace_id=$1)) n`,
    [CRM.workspace, CRM.company, p.actor_id]);
  // The application's unchanged PostgreSQL statement timeout bounds both reads.
  const first = await organisationRegister(p, {});
  assert.equal(first.total, 1000);
  assert.equal(first.counts.All, 1000);
  assert.equal(first.items.length, 25);
  assert.ok(first.next_cursor);
  const second = await organisationRegister(p, { cursor: first.next_cursor });
  assert.equal(second.total, 1000);
  assert.deepEqual(second.counts, first.counts);
  assert.equal(second.items.length, 25);
  assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 50);
});

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
