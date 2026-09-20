// The design report r03 / mockup r06 scenario, built through the real API as one synthetic identity.
// Dates are relative to the database's present, because the reads use the database clock: two
// overdue plus four today make six dated activities, three of them booked appointments; one
// activity has no date; two open opportunities have no active next action; two requests wait.
// Everything is created by ordinary commands, and clearDesk closes it again by ordinary commands,
// so the scenario can be rebuilt on a persistent development database without a reset.
import { randomUUID } from "node:crypto";

export type Call = (path: string, body?: unknown) => Promise<{ status: number; body: Record<string, unknown> & { items?: unknown[] } }>;
export const MY_WORK = {
  profile: "second-company",
  workspace: "10000000-0000-4000-8000-000000000001",
  company: "20000000-0000-4000-8000-000000000002",
  owner: "30000000-0000-4000-8000-000000000008",
  site: "70000000-0000-4000-8000-000000000003",
  person: "60000000-0000-4000-8000-000000000001",
  pipeline: "c1000000-0000-4000-8000-000000000002",
};
const base = (reason: string) => ({ operation_id: randomUUID(), schema_version: 1, reason });
const must = (r: { status: number; body: unknown }, what: string) => {
  if (r.status >= 300) throw Error(`${what} failed: ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
  return r.body as Record<string, unknown>;
};
const brisbaneDay = (at: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(at);
const endOfDay = (day: string) => new Date(Date.parse(`${day}T00:00:00+10:00`) + 86400000 - 1).toISOString();
const iso = (at: number) => new Date(Math.round(at / 300000) * 300000).toISOString();

// Times for today's four activities, spread over what is left of the local day. The scenario
// needs about two hours of the day remaining; it refuses rather than building a misleading one.
export function todaySlots(now = new Date()) {
  const day = brisbaneDay(now);
  const left = Date.parse(`${day}T23:30:00+10:00`) - now.getTime();
  if (left < 2 * 3600000) throw Error("Too little of the Brisbane day is left to build today's scenario.");
  const at = (fraction: number) => now.getTime() + Math.max(10 * 60000, left * fraction);
  return {
    day,
    deadline: iso(at(0.04)),
    call: { starts_at: iso(at(0.1)), due_at: iso(at(0.1) + 20 * 60000) },
    meeting: { starts_at: iso(at(0.3)), due_at: iso(at(0.3) + 45 * 60000) },
    visit: { starts_at: iso(at(0.6)), due_at: iso(at(0.6) + 60 * 60000) },
    twoDaysAgo: new Date(now.getTime() - 2 * 86400000 - 3600000).toISOString().replace(/\.\d+Z$/, ".000Z"),
    yesterday: endOfDay(brisbaneDay(new Date(now.getTime() - 86400000))),
    tomorrow: endOfDay(brisbaneDay(new Date(now.getTime() + 86400000))),
    dayAfter: endOfDay(brisbaneDay(new Date(now.getTime() + 2 * 86400000))),
  };
}

type Row = { id: string; version: number; can_complete: boolean; linked: { type: string; id: string; version: number | null; can_plan: boolean } };
// Close what an earlier run left open, through the same commands a person would use.
export async function clearDesk(call: Call) {
  const parents = must(await call("work/parents"), "read parents").items as { type: string; id: string; version: number }[];
  for (const p of parents) {
    if (p.type === "Opportunity")
      must(await call(`crm/opportunities/${p.id}/outcome`, { ...base("Close an earlier My Work scenario"), expected_version: p.version, close_outcome: "Lost", lost_reason: "Timing" }), "close opportunity");
    else must(await call(`crm/leads/${p.id}`, { ...base("Close an earlier My Work scenario"), expected_version: p.version, action: "disqualify", note: "Earlier My Work scenario closed." }), "disqualify lead");
  }
  // A waiting request leaves My Work when its owned follow-up closes; the request itself stays
  // with Service, whose triage has its own requirements. The loop below closes those follow-ups too.
  for (let guard = 0; guard < 20; guard++) {
    const page = must(await call("work/actions?owner=mine&status=Active&limit=100"), "read actions").items as Row[];
    const mine = page.filter((a) => a.can_complete);
    if (!mine.length) break;
    for (const a of mine)
      must(await call(`activities/${a.id}/cancel`, { ...base("Close an earlier My Work scenario"), expected_version: a.version, cancellation_reason: "Earlier My Work scenario closed." }), "cancel activity");
  }
}

async function organisation(call: Call, name: string) {
  const found = must(await call(`customers?company_id=${MY_WORK.company}&q=${encodeURIComponent(name)}&limit=50`), "find organisation").items as { id: string; display_name: string }[];
  const match = found.find((o) => o.display_name === name);
  if (match) return match.id;
  const id = randomUUID();
  must(await call("customers", { ...base("Create a fictional r06 scenario customer"), id, company_id: MY_WORK.company, display_name: name, relationship_status: "Prospect", owner_id: MY_WORK.owner }), `create ${name}`);
  return id;
}
type Action = { summary: string; activity_type: string; due_at: string | null; due_needed: boolean; starts_at?: string | null; due_date_only?: boolean };
const action = (a: Action) => ({ id: randomUUID(), owner_id: MY_WORK.owner, kind: "CustomerContact", ...a });
async function opportunity(call: Call, organisationName: string, title: string, first: Action) {
  const id = randomUUID(),
    initial_action = action(first);
  must(
    await call("crm/opportunities", {
      ...base("Create a fictional r06 scenario opportunity"),
      id,
      company_id: MY_WORK.company,
      organisation_id: await organisation(call, organisationName),
      site_id: null,
      primary_person_id: null,
      site_unknown_reason: "Fictional scenario: site not yet identified.",
      contact_unknown_reason: "Fictional scenario: contact not yet identified.",
      title,
      need_summary: `Fictional need for the My Work scenario: ${title}.`,
      source_channel: "Phone",
      source_basis: "Fictional record for the My Work r06 scenario.",
      owner_id: MY_WORK.owner,
      pipeline_definition_id: MY_WORK.pipeline,
      qualification_note: "Fictional qualification for the My Work scenario; no order authority.",
      initial_action,
    }),
    `create opportunity ${title}`,
  );
  return { id, version: 1, action: initial_action.id };
}
const plan = async (call: Call, o: { id: string; version: number }, next: Action) => {
  const new_action = action(next);
  must(await call(`crm/opportunities/${o.id}/next-action`, { ...base("Plan a fictional r06 scenario action"), expected_version: o.version, activity_id: null, new_action }), "plan action");
  o.version++;
  return new_action.id;
};
async function stage(call: Call, o: { id: string; version: number }, stages: string[]) {
  for (const stage_id of stages) {
    must(await call(`crm/opportunities/${o.id}/stage`, { ...base("Move a fictional r06 scenario opportunity"), expected_version: o.version, stage_id }), `move to ${stage_id}`);
    o.version++;
  }
}
const complete = async (call: Call, id: string, outcome: string) =>
  must(await call(`activities/${id}/complete`, { ...base("Record a fictional r06 scenario outcome"), expected_version: 1, outcome }), "complete activity");

export async function seedScenario(call: Call, now = new Date()) {
  const t = todaySlots(now);
  await clearDesk(call);
  // Banksia Nurseries: an overdue follow-up, then today's site assessment as the designated next action.
  const banksia = await opportunity(call, "Banksia Nurseries", "Priva climate upgrade", { summary: "Follow up climate upgrade proposal", activity_type: "Email", due_at: t.twoDaysAgo, due_needed: false });
  const visit = await plan(call, banksia, { summary: "Attend site assessment", activity_type: "SiteVisit", due_needed: false, ...t.visit });
  const coastal = await opportunity(call, "Coastal Berry Farms", "Irrigation controls", { summary: "Send revised irrigation quotation", activity_type: "Email", due_at: t.yesterday, due_needed: false, due_date_only: true });
  const riverbend = await opportunity(call, "Riverbend Horticulture", "Greenhouse upgrade", { summary: "Call about site assessment", activity_type: "Call", due_needed: false, ...t.call });
  const orchard = await opportunity(call, "Orchard Creek Growers", "Screen extension", { summary: "Discuss screen system scope", activity_type: "Meeting", due_needed: false, ...t.meeting });
  // Two planning gaps: the designated next action is finished and nothing active replaces it.
  const cedar = await opportunity(call, "Cedar Grove Nursery", "Climate control upgrade", { summary: "Confirm climate control requirements", activity_type: "Call", due_at: t.tomorrow, due_needed: false, due_date_only: true });
  await stage(call, cedar, ["Scoping", "Quoting"]);
  await complete(call, cedar.action, "Spoke with the contact. Requirements confirmed for the fictional scenario.");
  const valley = await opportunity(call, "Valley Fresh Produce", "Irrigation controls", { summary: "Confirm irrigation zones", activity_type: "Call", due_at: t.tomorrow, due_needed: false, due_date_only: true });
  await stage(call, valley, ["Scoping"]);
  await complete(call, valley.action, "Spoke with the contact. Zones confirmed for the fictional scenario.");
  // A lead with a first-contact task due today, and a second lead whose follow-up has no date yet.
  const lead = async (title: string, organisation_text: string, contact_text: string, next: Action) => {
    const id = randomUUID();
    must(await call("crm/leads", { ...base("Create a fictional r06 scenario lead"), id, company_id: MY_WORK.company, owner_id: MY_WORK.owner, organisation_id: null, site_id: null, primary_person_id: null, title, need_summary: `Fictional enquiry for the My Work scenario: ${title}.`, organisation_text, contact_text, source_channel: "Phone", source_basis: "Fictional record for the My Work r06 scenario." }), `create lead ${title}`);
    const new_action = action(next);
    must(await call(`crm/leads/${id}/next-action`, { ...base("Plan a fictional r06 scenario lead action"), expected_version: 1, activity_id: null, new_action }), "plan lead action");
    return { id, action: new_action.id };
  };
  const greenleaf = await lead("Greenleaf Nursery enquiry", "Greenleaf Nursery", "Alex Morgan", { summary: "Make first contact with new lead", activity_type: "Call", due_at: t.deadline, due_needed: false });
  const greenview = await lead("Greenview Propagation enquiry", "Greenview Propagation", "Morgan Lee", { summary: "Prepare Greenview follow-up", activity_type: "Task", due_at: null, due_needed: true });
  // Two requests waiting on someone else. The application records these as Service information
  // requests, the one waiting-on record it has; Sales has no request entity of its own. Each
  // request's chase is an owned activity, so a chase due today would rightly join the due-today
  // list; the scenario chases on later days to keep the report's two-plus-four arithmetic.
  const ticket = async (summary: string, requester: string, question: string, due_at: string) => {
    const id = randomUUID();
    must(await call("service/tickets", { ...base("Create a fictional r06 scenario request"), id, company_id: MY_WORK.company, summary, symptom: `Fictional request for the My Work scenario: ${summary}.`, received_at: iso(now.getTime() - 3600000), channel: "Manual", requester_id: null, requester_description: requester, site_id: MY_WORK.site, site_identification_needed: false, asset_id: null, impact: "Monitoring", priority: "Normal", priority_reason: "Fictional scenario; no work authority.", triage_owner_id: MY_WORK.owner, next_action: "Await the requested information." }), `create ticket ${summary}`);
    must(await call(`service/tickets/${id}/request-information`, { ...base("Ask for information in the fictional r06 scenario"), expected_version: 1, open_questions: question, next_action: "Follow up the requested information.", follow_up: { id: randomUUID(), owner_id: MY_WORK.owner, due_at, due_needed: false } }), "request information");
    return id;
  };
  const waiting = [
    await ticket("Greenview Propagation potting line", "Morgan Lee, supplier", "Supplier lead time", t.tomorrow),
    await ticket("Wattle Creek Farms screen upgrade", "Taylor Chen, Engineering", "Screen layout confirmation", t.dayAfter),
  ];
  return { slots: t, banksia, coastal, riverbend, orchard, cedar, valley, greenleaf, greenview, visit, waiting };
}
