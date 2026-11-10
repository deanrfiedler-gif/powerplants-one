import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import { activityCommand, createActivity, type ActivityLink } from "../../src/activities/activities";
import { readWorkOverview } from "../../src/activities/work-overview";
import { createLead } from "../../src/crm/leads/service";
import { createTicket } from "../../src/service/intake";
import { CRM, crmBase } from "../helpers/crm";
import { leadCreate } from "../helpers/leads";
import { auditDealFixture } from "../helpers/deals-worklist-plan";
import { readWorkOverview as mainOverview } from "../helpers/my-work-overview-main";
import { measureOverview } from "../helpers/my-work-overview-plan";

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const now = "2030-01-02T00:00:00.000Z"; // 10:00 Brisbane, independent of the host's timezone.
const overdue = "2030-01-01T12:00:00.000Z";
let p: Principal, other: Principal, observer: Principal;
let native: Awaited<ReturnType<typeof auditDealFixture>>;
let lead: string;
const named: Record<string, string> = {};
const expected: { id: string; type: string; linked: string; kind: string; summary: string; due: string; anchor: string; owner: string; company: string }[] = [];
const baseCounts = new Map<string, Awaited<ReturnType<typeof readWorkOverview>>>();

async function pair(reader: Principal, input: Record<string, unknown> = {}) {
  const before = await measureOverview(mainOverview, reader, input, undefined, now);
  const after = await measureOverview(readWorkOverview, reader, input, before.values, now);
  assert.deepEqual(after.rows, before.rows);
  assert.equal(JSON.stringify(after.rows), JSON.stringify(before.rows));
  for (const key of ["activities", "counts", "scope", "date_needed", "schedule", "capabilities", "day", "timezone"] as const)
    assert.deepEqual(after.reader_result[key], before.reader_result[key], key);
  return after.reader_result;
}

before(async () => {
  await reset();
  p = (await createSession("coordinator")).principal;
  other = (await createSession("second-company")).principal;
  observer = (await createSession("observer")).principal;
  native = await auditDealFixture(p, 2);
  const leadInput = { ...leadCreate(), site_id: native.created.sites[0], organisation_id: native.created.organisations[0], primary_person_id: native.created.people[0] };
  lead = leadInput.id;
  await createLead(p, leadInput);
  const ticket = randomUUID();
  await createTicket(p, { ...crmBase(), id: ticket, company_id: CRM.company,
    summary: "SYN overview ticket", symptom: "SYN inspect controller", received_at: "2026-09-04T00:00:00Z",
    channel: "Manual", requester_id: null, requester_description: "SYN caller", site_id: native.created.sites[0],
    site_identification_needed: false, asset_id: null, impact: "Monitoring", priority: "Normal", priority_reason: null,
    triage_owner_id: p.actor_id, next_action: "SYN inspect" });
  for (const owner of ["mine", "all"])
    baseCounts.set(owner, await pair(p, { owner, kind: "RelationshipReview", limit: 25 }));
  async function add(name: string, links: ActivityLink[], changes: Record<string, unknown> = {}, reader = p, included = true) {
    const index = Object.keys(named).length;
    const id = `ac000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
    const input = { ...crmBase(), id, company_id: CRM.company, site_id: native.created.sites[0],
      kind: "RelationshipReview", owner_id: reader.actor_id, summary: `SYN Overview ${String(index).padStart(2, "0")}`,
      due_at: overdue, due_needed: false, access_class: links.some(l => ["Lead", "Opportunity"].includes(l.object_type)) ? "Internal" : "RestrictedService", links, ...changes };
    await createActivity(reader, input).catch(error => { throw new Error(`Fixture ${name}: ${error.message}`, { cause: error }); });
    named[name] = id;
    if (included) expected.push({ id, type: links[0].object_type, linked: links[0].object_id,
      kind: String(input.kind), summary: String(input.summary), due: String(input.due_at), anchor: String(changes.starts_at ?? input.due_at), owner: reader.actor_id, company: String(input.company_id) });
    return id;
  }
  const org = (id = native.created.organisations[0]): ActivityLink[] => [{ object_type: "Organisation", object_id: id }];
  const targets: [ActivityLink["object_type"], string][] = [
    ["Project", native.created.projects[0]], ["Lead", lead], ["Opportunity", native.created.opportunities[0]],
    ["Ticket", ticket], ["Asset", native.created.assets[0]], ["Site", native.created.sites[0]], ["Organisation", native.created.organisations[0]],
  ];
  for (const [object_type, object_id] of targets) await add(object_type, [{ object_type, object_id }]);
  // Two links of one type: lowest UUID wins regardless of insertion order.
  const organisations = [...native.created.organisations].sort();
  await add("two-organisations", org(organisations[1]).concat(org(organisations[0])), { site_id: null });
  expected.at(-1)!.linked = organisations[0];
  // Project wins over Opportunity even though both are present.
  await add("priority", [{ object_type: "Project", object_id: native.created.projects[0] }, { object_type: "Opportunity", object_id: native.created.opportunities[0] }]);
  await add("same-title-a", org(), { summary: "SYN tied title" });
  await add("same-title-b", org(), { summary: "SYN tied title" });
  await add("at-now", org(), { due_at: now, activity_type: "Call" });
  await add("end-day", org(), { due_at: "2030-01-02T13:59:59.999Z", due_date_only: true });
  await add("cross-midnight", org(), { activity_type: "Meeting", starts_at: "2030-01-02T13:30:00.000Z", due_at: "2030-01-02T14:30:00.000Z" });
  await add("tomorrow", org(), { due_at: "2030-01-02T14:00:00.000Z" }, p, false);
  await add("undated", org(), { due_at: null, due_needed: true }, p, false);
  const completed = await add("completed", org(), {}, p, false);
  await activityCommand(p, completed, { ...crmBase(), expected_version: 1, outcome: "SYN done" }, "complete");
  const cancelled = await add("cancelled", org(), {}, p, false);
  await activityCommand(p, cancelled, { ...crmBase(), expected_version: 1, cancellation_reason: "SYN no longer needed" }, "cancel");
  await add("technical", org(), { kind: "TechnicalFollowUp", activity_type: "Call" });
  await add("material", org(), { kind: "MaterialAction", activity_type: "Task" });
  const colleague = (await createSession("crm-receiver")).principal;
  await add("colleague", org(), {}, colleague);
  await activityCommand(p, named.Site, { ...crmBase(), expected_version: 1 }, "start");
  const noContext = { ...leadCreate(), site_id: null, organisation_id: null, primary_person_id: null,
    organisation_text: "SYN prospective customer", contact_text: "SYN unknown contact" };
  await createLead(p, noContext);
  await add("lead-without-context", [{ object_type: "Lead", object_id: noContext.id }], { site_id: null });
  await add("company-b", [{ object_type: "Organisation", object_id: CRM.orgB }], { company_id: CRM.companyB, site_id: null }, other);
});

for (const owner of ["mine", "all"])
  for (const sort of ["Due", "Title"])
    for (const limit of [1, 8, 25])
      test(`frozen overview preserves ${owner}/${sort}/${limit} with explicit named rows and counts`, async () => {
        const result = await pair(p, { owner, sort, limit, kind: "RelationshipReview" });
        const visible = expected.filter(r => r.kind === "RelationshipReview" && r.company === CRM.company && (owner === "all" || r.owner === p.actor_id));
        const baseline = baseCounts.get(owner)!;
        assert.equal(baseline.activities.total, 0);
        assert.equal(result.activities.total, visible.length);
        assert.equal(result.counts.overdue, baseline.counts.overdue + visible.filter(r => r.due < now).length);
        assert.equal(result.counts.due_today, baseline.counts.due_today + 3);
        assert.equal(result.counts.date_needed, baseline.counts.date_needed + 1);
        const ordered = [...visible].sort((a,b) => Number(b.due < now) - Number(a.due < now) ||
          (sort === "Title" ? a.summary.toLowerCase().localeCompare(b.summary.toLowerCase(), "en") : a.anchor.localeCompare(b.anchor)) || a.id.localeCompare(b.id));
        assert.deepEqual(result.activities.items.map(r => r.id), ordered.slice(0,limit).map(r => r.id));
        assert.equal(result.activities.completeness, visible.length > limit ? "BoundedWindow" : "Complete");
        for (const item of result.activities.items) {
          const e = visible.find(r => r.id === item.id)!;
          // Organisation-only activities with a site retain the existing Site fallback priority.
          const type = e.type === "Organisation" && item.site_id ? "Site" : e.type;
          assert.equal(item.linked.type, type);
          assert.equal(item.linked.id, type === "Site" ? native.created.sites[0] : e.linked);
          assert.equal(item.can_complete, item.owner_id === p.actor_id);
        }
      });

for (const input of [
  {}, { owner: "all" }, { company_id: CRM.company }, { owner: "all", company_id: CRM.companyB },
  { kind: "TechnicalFollowUp" }, { kind: "MaterialAction" },
  { activity_type: "Call" }, { activity_type: "Meeting" }, { company_id: randomUUID() },
]) test(`filters preserve raw rows and public fields ${JSON.stringify(input)}`, async () => {
  const result = await pair(p, input);
  if (input.kind) assert.deepEqual(result.activities.items.map(r => r.id), input.kind === "TechnicalFollowUp"
    ? ["85000000-0000-4000-8000-000000000001", named.technical]
    : ["85000000-0000-4000-8000-000000000005", named.material]);
  if (input.activity_type === "Meeting") assert.deepEqual(result.activities.items.map(r => r.id), [named["cross-midnight"]]);
  if (input.company_id === CRM.companyB) assert.equal(result.activities.total, 0);
});

test("current reader authority excludes hidden linked parents before filling the window", async () => {
  const result = await pair(observer, { owner: "all", kind: "RelationshipReview", limit: 25 });
  for (const name of ["Project", "Lead", "Opportunity", "priority", "company-b"])
    assert.ok(!result.activities.items.some(r => r.id === named[name]), name);
  assert.ok(result.activities.items.some(r => r.id === named.Site));
  assert.equal((await pair(observer, { kind: "RelationshipReview" })).activities.total, 0);
  const companyB = await pair(other, { owner: "all", kind: "RelationshipReview" });
  assert.deepEqual(companyB.activities.items.map(r => r.id), [named["company-b"]]);
});

test("linked parent deletion is refused by the live schema and leaves membership unchanged", async () => {
  const before = await pair(p, { kind: "RelationshipReview", limit: 25 });
  // Do not disable FKs/triggers to invent an unreachable dangling-parent state.
  await assert.rejects(database().query("DELETE FROM ppo.organisations WHERE id=$1", [native.created.organisations[0]]));
  await assert.rejects(database().query("DELETE FROM ppo.lead_candidates WHERE id=$1", [lead]));
  const after = await pair(p, { kind: "RelationshipReview", limit: 25 });
  assert.deepEqual(after.activities, before.activities);
});

test("expiring the linked Lead read grant removes its activities and keeps the window full", async () => {
  const before = await pair(p, { kind: "RelationshipReview" });
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='crm.lead.read'", [p.actor_id]);
  const after = await pair(p, { kind: "RelationshipReview" });
  assert.equal(after.activities.total, before.activities.total - 2);
  assert.equal(after.activities.items.length, 8);
  assert.ok(!after.activities.items.some(r => r.linked.type === "Lead"));
});
