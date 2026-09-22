import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createActivity } from "../../src/activities/activities";
import { readCalendar } from "../../src/email/service";
import { accountLanding, quotationLanding } from "../../src/shell/landing-reads";
import { crmCreate, crmBase, CRM } from "../helpers/crm";
import { createLead } from "../../src/crm/leads/service";
import { leadCreate } from "../helpers/leads";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable test database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset); after(async () => { await reset(); await closeDatabase(); });
test("Sales calendar scopes existing activity identities; general calendar and current guards remain intact", async () => {
  const p = (await createSession("coordinator")).principal, o = crmCreate();
  await createOpportunity(p, o);
  const ids = new Map<string, string>();
  for (const kind of ["Call", "Email", "Meeting", "SiteVisit", "Task"]) {
    const id = randomUUID(); ids.set(kind, id);
    await createActivity(p, { ...crmBase(), id, company_id: CRM.company, site_id: CRM.site,
      kind: "CustomerContact", activity_type: kind, owner_id: CRM.owner,
      summary: "SYN navigation calendar " + kind, due_needed: false, due_at: "2026-09-08T23:00:00Z",
      access_class: "Internal", links: [{ object_type: "Opportunity", object_id: o.id }] });
  }
  const general = await readCalendar(p, { day: "2026-09-09" });
  const sales = await readCalendar(p, { day: "2026-09-09", scope: "sales" });
  for (const [kind, id] of ids) {
    assert.ok(general.activities.some(a => a.id === id), kind);
    assert.equal(sales.activities.some(a => a.id === id), kind !== "Task", kind);
  }
  assert.equal(sales.meetings.length, 0);
  const lead = leadCreate(), leadActivity = randomUUID();
  await createLead(p, lead);
  await createActivity(p, { ...crmBase(), id: leadActivity, company_id: CRM.company, site_id: CRM.site,
    kind: "CustomerContact", activity_type: "Call", owner_id: CRM.owner, summary: "SYN Lead call",
    due_needed: false, due_at: "2026-09-08T23:00:00Z", access_class: "Internal",
    links: [{ object_type: "Lead", object_id: lead.id }] });
  assert.ok((await readCalendar(p, { day: "2026-09-09", scope: "sales" })).activities.some(a => a.id === leadActivity));
  assert.equal((await readCalendar(p, { day: "2026-09-08", scope: "sales" })).activities.some(a => [...ids.values()].includes(a.id)), false);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'", [p.actor_id]);
  assert.equal((await readCalendar(p, { day: "2026-09-09", scope: "sales" })).activities.some(a => [...ids.values()].includes(a.id)), false);
});
test("landing adapters return only existing scoped records and reject absent capabilities", async () => {
  const observer = (await createSession("observer")).principal;
  await assert.rejects(accountLanding(observer, {}));
  await assert.rejects(quotationLanding(observer, {}));
  const finance = (await createSession("finance")).principal;
  const accounts = await accountLanding(finance, {});
  assert.ok(accounts.items.length > 0);
  assert.ok(accounts.items.every(a => a.id && a.customer_id && a.label));
  const coordinator = (await createSession("coordinator")).principal;
  assert.ok(Array.isArray((await quotationLanding(coordinator, {})).items));
});
