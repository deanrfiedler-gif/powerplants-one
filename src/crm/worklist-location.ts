import { ACTIVE_PIPELINE_ID, opportunityStages } from "./stages";

export const LEGACY_PIPELINE_ID = "c1000000-0000-4000-8000-000000000001";
export const initialWorklistFilters = {
  outcome: "Open", pipeline_definition_id: ACTIVE_PIPELINE_ID, q: "",
  company_id: "", site_id: "", owner_id: "", stage_id: "", next_action: "",
  sort: "Reference", limit: "50", cursor: "",
};
export type WorklistFilters = typeof initialWorklistFilters;
export type WorklistLocation = { filters: WorklistFilters; view: "Board" | "Grid"; selected: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// This is presentation input only. The existing server validates every read
// and resolves current permissions; a URL never supplies an actor or authority.
export function readWorklistLocation(params: URLSearchParams): WorklistLocation {
  const one = (key: string) => params.getAll(key).length === 1 ? params.get(key)! : "";
  const choice = (key: string, allowed: readonly string[], fallback = "") => {
    const value = one(key); return allowed.includes(value) ? value : fallback;
  };
  const filters = { ...initialWorklistFilters };
  for (const key of ["company_id", "site_id", "owner_id", "pipeline_definition_id"] as const) {
    const value = one(key); if (uuid.test(value)) filters[key] = value;
  }
  if (!one("pipeline_definition_id") && one("pipeline") === "I1") filters.pipeline_definition_id = LEGACY_PIPELINE_ID;
  filters.q = one("q").slice(0, 200);
  filters.outcome = choice("outcome", ["Open", "Won", "Lost", "All"], "Open");
  filters.sort = choice("sort", ["Reference", "Title", "Newest"], "Reference");
  filters.limit = choice("limit", ["10", "25", "50"], "50");
  filters.stage_id = choice("stage_id", opportunityStages);
  filters.next_action = choice("next_action", ["Needed", "DueNeeded", "Overdue", "Upcoming", "Unavailable"]);
  return { filters, view: choice("view", ["Board", "Grid"], "Board") as WorklistLocation["view"], selected: choice("selected", opportunityStages) };
}

export function worklistSearch(state: WorklistLocation) {
  const params = new URLSearchParams();
  if (state.filters.pipeline_definition_id === LEGACY_PIPELINE_ID) params.set("pipeline", "I1");
  for (const key of Object.keys(initialWorklistFilters) as Array<keyof WorklistFilters>) {
    if (key === "cursor" || (key === "pipeline_definition_id" && state.filters[key] === LEGACY_PIPELINE_ID)) continue;
    const value = state.filters[key];
    if (value && value !== initialWorklistFilters[key]) params.set(key, value);
  }
  if (state.view !== "Board") params.set("view", state.view);
  if (state.selected) params.set("selected", state.selected);
  return params.toString();
}
