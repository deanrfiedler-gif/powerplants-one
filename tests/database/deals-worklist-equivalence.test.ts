import assert from "node:assert/strict";
import crypto from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { before, after, test, mock } from "node:test";
import type { Principal } from "../../src/platform/identity";

// Load both independent readers with the same ephemeral test signing key.
// Restore real randomness before sessions/fixtures. Neither reader is edited
// for this: even complete signed next_cursor strings can be compared verbatim.
const realRandomBytes = crypto.randomBytes;
let readerKeys = 0;
const randomBytes = mock.method(crypto, "randomBytes", function (...args: unknown[]) {
  const stack = new Error().stack ?? "";
  if (/at .*\/(?:src\/crm\/worklist|tests\/helpers\/deals-worklist-main)\.ts:/.test(stack)) {
    readerKeys++;
    assert.equal(args[0], 32);
    return Buffer.alloc(32, 0xab);
  }
  return Reflect.apply(realRandomBytes, crypto, args);
} as typeof crypto.randomBytes);
syncBuiltinESMExports();
const { listOpportunities } = await import("../../src/crm/worklist");
const { listOpportunities: mainWorklist } = await import("../helpers/deals-worklist-main");
assert.equal(readerKeys, 2);
randomBytes.mock.restore();
syncBuiltinESMExports();
const { reset } = await import("../../scripts/database");
const { database, closeDatabase } = await import("../../src/platform/database");
const { localConfig } = await import("../../src/platform/config");
const { createSession } = await import("../../src/platform/identity");
const { createOpportunity, qualifyOpportunity } = await import("../../src/crm/opportunities");
const { editDealInformation, changeDealStage } = await import("../../src/crm/refinements");
const { recordOpportunityOutcome } = await import("../../src/crm/outcomes");
const { activityCommand } = await import("../../src/activities/activities");
const { CRM, crmBase, crmCreate, crmDiscovery, crmQualify } = await import("../helpers/crm");

assert.equal(localConfig().database_name, "ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
type FixtureDeal = { id: string; title: string; company: string; pipeline: string; outcome: string; stage: string; action: string; owner: string; history: number };
const deals: FixtureDeal[] = [];
let principals: Record<string, Principal>;
let readTime: number;
const pipelines = [CRM.definition, "c1000000-0000-4000-8000-000000000002"];

before(async () => {
  await reset();
  principals = {
    coordinator: (await createSession("coordinator")).principal,
    restricted: (await createSession("second-company")).principal,
    noAction: (await createSession("quotation-approver")).principal,
  };
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.read'", [principals.noAction.actor_id])).rows[0].n, 0);
  for (const [pipelineIndex, pipeline] of pipelines.entries()) {
    for (let i = 0; i < 16; i++) {
      const j = Math.floor(i / 2), companyB = i % 2 === 1;
      const p = companyB ? principals.restricted : principals.coordinator;
      const action = ["DueNeeded", "Overdue", "Upcoming", "Needed"][j % 4];
      const input = {
        ...(pipelineIndex ? crmDiscovery() : crmCreate()),
        id: `ab000000-0000-4000-8000-${String(100 * pipelineIndex + i).padStart(12, "0")}`,
        title: `SYN AB ${j % 2 ? "Other" : "Focus"} ${String(i).padStart(2, "0")}`,
        company_id: companyB ? CRM.companyB : CRM.company,
        organisation_id: companyB ? CRM.orgB : CRM.org,
        site_id: null, site_unknown_reason: "SYN isolated company fixture",
        primary_person_id: null, contact_unknown_reason: "SYN contact not yet identified",
        owner_id: p.actor_id,
      };
      input.initial_action = { ...input.initial_action, owner_id: p.actor_id,
        due_at: action === "Upcoming" ? "2099-01-01T00:00:00Z" : action === "Overdue" ? "2000-01-01T00:00:00Z" : null,
        due_needed: action !== "Upcoming" && action !== "Overdue" };
      await createOpportunity(p, input);
      let version = 1, stage = pipelineIndex ? "Discovery" : "Enquiry";
      if (!pipelineIndex && j % 2) {
        await qualifyOpportunity(p, input.id, { ...crmQualify(version++), identification_activity_id: input.initial_action.id });
        stage = "Qualified";
      }
      if (j === 0) {
        for (const value of ["1200.00", "1500.00"])
          await editDealInformation(p, input.id, { ...crmBase(), expected_version: version++, title: input.title, primary_person_id: null, contact_unknown_reason: input.contact_unknown_reason, value_amount: value, expected_close_date: "2030-12-01" });
      }
      if (pipelineIndex && (j === 1 || j >= 6)) {
        for (const next of j >= 6 ? ["Scoping", "Quoting", "Negotiation", "Closing"] : ["Scoping"]) {
          await changeDealStage(p, input.id, { ...crmBase(), expected_version: version++, stage_id: next, qualification_note: null, identification_activity_id: null });
          stage = next;
        }
      }
      const outcome = pipelineIndex && j >= 4 ? j >= 6 ? "Won" : "Lost" : "Open";
      if (outcome !== "Open") await recordOpportunityOutcome(p, input.id, { ...crmBase(), expected_version: version++, close_outcome: outcome, lost_reason: outcome === "Lost" ? "Timing" : null, acceptance_evidence: outcome === "Won" ? "SYN fictional outcome only" : null });
      if (action === "Needed") await activityCommand(p, input.initial_action.id, { ...crmBase(), expected_version: 1, outcome: "SYN action completed" }, "complete");
      deals.push({ id: input.id, title: input.title, company: input.company_id, pipeline, outcome, stage, action, owner: p.actor_id, history: version });
    }
  }
  assert.equal(deals.length, 32);
  assert.equal(deals.filter(d => d.outcome === "Won").length, 4);
  assert.equal(deals.filter(d => d.outcome === "Lost").length, 4);
  // Freeze only the JS read clock after all native writes, preserving SQL's
  // real clock for grant validity. No boundary is close to the fixture dates.
  readTime = Date.now() + 60_000;
});
after(closeDatabase);

async function read(reader: typeof listOpportunities, p: Principal, input: Record<string, unknown>, all = false) {
  const pool = database(), original = pool.query;
  let stamp: string | undefined;
  const spy = mock.method(pool, "query", function (this: typeof pool, ...args: unknown[]) {
    const result = Reflect.apply(original, this, args);
    if (typeof args[0] === "string" && args[0].includes("WITH permitted AS MATERIALIZED"))
      return result.then((r: { rows: { stamp: string }[] }) => { stamp = r.rows[0].stamp; return r; });
    return result;
  } as typeof original);
  try {
    const result = await reader(p, input, all ? "All" : "One");
    assert.match(stamp!, /^[a-f0-9]{32}$/);
    return { result, stamp };
  } finally { spy.mock.restore(); }
}

async function comparePages(profile: string, input: Record<string, unknown>, expected: FixtureDeal[], all = false) {
  const p = principals[profile], actualIds: string[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const filters = { ...input, limit: 1, ...(cursor ? { cursor } : {}) };
    const oracle = await read(mainWorklist, p, filters, all);
    const actual = await read(listOpportunities, p, filters, all);
    assert.deepEqual(actual, oracle);
    assert.equal(JSON.stringify(actual), JSON.stringify(oracle));
    assert.equal(actual.result.items.length, expected.length ? 1 : 0);
    assert.equal(actual.result.window.first_page, !cursor);
    assert.equal(actual.result.window.count_basis, "ReturnedPage");
    assert.equal(actual.result.completeness, expected.length > 1 ? "Partial" : "Complete");
    assert.equal(actual.result.stages.reduce((n, s) => n + s.count, 0), actual.result.items.length);
    for (const item of actual.result.items) {
      const named = expected.find(d => d.id === item.id);
      assert.ok(named, `Unexpected deal ${item.title}`);
      assert.equal(item.title, named.title);
      assert.equal(item.history?.length, named.history);
      assert.equal(item.can_edit, profile !== "noAction");
      assert.equal(item.next_action_state, profile === "noAction" ? "Unavailable" : named.action);
      if (profile === "noAction") {
        for (const field of ["next_action_id", "next_action_summary", "action_owner_id", "action_owner_name", "due_at", "due_needed"] as const) assert.equal(item[field], null, field);
      } else assert.ok(item.next_action_id);
    }
    if (actual.result.next_cursor) {
      const payload = JSON.parse(Buffer.from(actual.result.next_cursor.split(".")[0], "base64url").toString());
      assert.equal(payload.stamp, actual.stamp);
    }
    actualIds.push(...actual.result.items.map(i => i.id));
    cursor = actual.result.next_cursor ?? undefined;
    pages++;
    assert.ok(pages <= 17);
  } while (cursor);
  assert.equal(actualIds.length, expected.length);
  assert.equal(new Set(actualIds).size, expected.length);
  const order = [...expected].sort((a, b) => input.sort === "Newest" ? b.id.localeCompare(a.id) : input.sort === "Title" ? a.title.localeCompare(b.title) || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
  assert.deepEqual(actualIds, order.map(d => d.id));
  assert.equal(pages, Math.max(1, expected.length));
}

for (const profile of ["coordinator", "restricted", "noAction"]) {
  for (const [pipelineIndex, pipeline] of pipelines.entries()) {
    for (const outcome of ["Open", "Closed", "All"]) {
      for (const sort of ["Reference", "Title", "Newest"]) {
        for (const search of [false, true]) {
          test(`frozen Deals equivalence: ${profile}, pipeline ${pipelineIndex}, ${outcome}, ${sort}, search=${search}`, async t => {
            t.mock.timers.enable({ apis: ["Date"], now: readTime });
            const expected = deals.filter(d => d.pipeline === pipeline && d.company === (profile === "restricted" ? CRM.companyB : CRM.company) && (outcome === "All" || (outcome === "Closed" ? d.outcome !== "Open" : d.outcome === "Open")) && (!search || d.title.includes("Focus")));
            const count = pipelineIndex === 0 ? outcome === "Closed" ? 0 : 8 : outcome === "All" ? 8 : 4;
            assert.equal(expected.length, search ? count / 2 : count);
            await comparePages(profile, { pipeline_definition_id: pipeline, outcome, sort, q: search ? "Focus" : "" }, expected);
          });
        }
      }
    }
  }
  test(`frozen Deals equivalence: ${profile}, owner/stage/action filters and all pipelines`, async t => {
    t.mock.timers.enable({ apis: ["Date"], now: readTime });
    const visible = deals.filter(d => d.company === (profile === "restricted" ? CRM.companyB : CRM.company));
    assert.equal(visible.length, 16);
    await comparePages(profile, { outcome: "All", sort: "Reference" }, visible, true);
    for (const pipeline of pipelines) {
      const population = visible.filter(d => d.pipeline === pipeline);
      for (const filter of [
        { owner_id: population[0].owner },
        { owner_id: profile === "restricted" ? principals.coordinator.actor_id : principals.restricted.actor_id },
        ...["Enquiry", "Qualified", "Discovery", "Scoping", "Closing"].map(stage_id => ({ stage_id })),
        ...["DueNeeded", "Overdue", "Upcoming", "Needed", "Unavailable"].map(next_action => ({ next_action })),
      ] as Record<string, string>[]) {
        const expected = population.filter(d => (!filter.owner_id || d.owner === filter.owner_id) && (!filter.stage_id || d.stage === filter.stage_id) && (!filter.next_action || (profile === "noAction" ? "Unavailable" : d.action) === filter.next_action));
        await comparePages(profile, { pipeline_definition_id: pipeline, outcome: "All", sort: "Title", ...filter }, expected);
      }
    }
  });
}
