import assert from "node:assert/strict";
import { test } from "node:test";
import { initialWorklistFilters, LEGACY_PIPELINE_ID, readWorklistLocation, worklistSearch } from "../../src/crm/worklist-location";

test("CRM shared URL preserves criteria and presentation but never an actor-bound page token", () => {
  const filters = { ...initialWorklistFilters, pipeline_definition_id: LEGACY_PIPELINE_ID,
    q: "SYN Pumps & irrigation / café + 10%", company_id: "10000000-0000-4000-8000-000000000001",
    site_id: "40000000-0000-4000-8000-000000000001", owner_id: "30000000-0000-4000-8000-000000000001",
    stage_id: "Qualified", next_action: "Overdue", sort: "Title", limit: "10", outcome: "All", cursor: "private-actor-bound-page" };
  const state = { filters, view: "Grid" as const, selected: "Qualified" };
  const search = worklistSearch(state);
  assert.doesNotMatch(search, /private-actor|cursor|actor_id/);
  assert.deepEqual(readWorklistLocation(new URLSearchParams(search)), { ...state, filters: { ...filters, cursor: "" } });
  assert.equal(worklistSearch(readWorklistLocation(new URLSearchParams(search))), search);
  assert.equal(worklistSearch({ filters: initialWorklistFilters, view: "Board", selected: "" }), "");
});
test("CRM location input ignores duplicate/unsupported controls and retains legacy links without deriving authority", () => {
  const input = new URLSearchParams("view=Grid&view=Board&sort=delete&limit=200000&company_id=invalid&owner_id=invalid&stage_id=Won&selected=hidden&outcome=Invalid&cursor=foreign&actor_id=admin&pipeline=I1&q=" + "a".repeat(201));
  const state = readWorklistLocation(input);
  assert.deepEqual(state, { filters: { ...initialWorklistFilters, pipeline_definition_id: LEGACY_PIPELINE_ID, q: "a".repeat(200) }, view: "Board", selected: "" });
  assert.doesNotMatch(worklistSearch(state), /delete|foreign|admin|200000/);
});
