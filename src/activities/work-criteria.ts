// Criteria for My Work lists: what a saved view stores and what the address bar carries.
// Pure. Criteria describe a question, never an answer: they hold no records and no authority.
import type { WorkViewCriteria } from "./work-views";

export const defaultCriteria: WorkViewCriteria = {
  owner: "mine",
  company_id: null,
  kind: null,
  activity_type: null,
  sort: "Due",
  status: "Active",
  due: null,
  linked: null,
  q: "",
};
// The built-in overview view. It is a name for the defaults, not a stored record.
export const TODAYS_FOCUS = "Today's focus";

const choices: { [K in keyof WorkViewCriteria]?: readonly string[] } = {
  owner: ["mine", "all"],
  kind: ["TechnicalFollowUp", "CustomerContact", "MaterialAction", "FinanceQuery", "RelationshipReview"],
  activity_type: ["Task", "Call", "Email", "Meeting", "SiteVisit"],
  sort: ["Due", "Title", "Updated"],
  status: ["Active", "Completed", "Cancelled", "All"],
  due: ["Overdue", "Today", "Upcoming", "Needed"],
  linked: ["Lead", "Opportunity", "Ticket", "Other"],
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Unknown or malformed values are dropped, never trusted: a link can suggest criteria, not grant.
export function readCriteria(params: URLSearchParams): WorkViewCriteria {
  const out: Record<string, unknown> = { ...defaultCriteria };
  for (const [key, allowed] of Object.entries(choices)) {
    const value = params.get(key);
    if (value && allowed!.includes(value)) out[key] = value;
  }
  const company = params.get("company_id");
  if (company && uuidPattern.test(company)) out.company_id = company;
  out.q = (params.get("q") ?? "").slice(0, 200);
  return out as WorkViewCriteria;
}
export function criteriaSearch(criteria: WorkViewCriteria, view: string | null = null) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(criteria))
    if (value !== null && value !== "" && value !== defaultCriteria[key as keyof WorkViewCriteria])
      params.set(key, String(value));
  if (view) params.set("view", view);
  const text = params.toString();
  return text ? `?${text}` : "";
}
export const sameCriteria = (a: WorkViewCriteria, b: WorkViewCriteria) =>
  (Object.keys(defaultCriteria) as (keyof WorkViewCriteria)[]).every((k) => a[k] === b[k]);

// Query strings for the reads. Each read accepts only the criteria it applies.
export function overviewQuery(c: WorkViewCriteria) {
  const p = new URLSearchParams({ owner: c.owner, sort: c.sort === "Updated" ? "Due" : c.sort });
  if (c.company_id) p.set("company_id", c.company_id);
  if (c.kind) p.set("kind", c.kind);
  if (c.activity_type) p.set("activity_type", c.activity_type);
  return p.toString();
}
export function actionsQuery(c: WorkViewCriteria, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ owner: c.owner, sort: c.sort, status: c.status, ...extra });
  for (const key of ["company_id", "kind", "activity_type", "due", "linked"] as const)
    if (c[key]) p.set(key, c[key]!);
  if (c.q.trim()) p.set("q", c.q.trim());
  return p.toString();
}
export function activeFilterCount(c: WorkViewCriteria, keys: (keyof WorkViewCriteria)[]) {
  return keys.filter((k) => c[k] !== defaultCriteria[k]).length;
}
