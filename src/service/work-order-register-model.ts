import { choice, invalid, object, optionalId } from "../shared/validation";

export const workOrderViews = [
  "all",
  "mine",
  "drafts",
  "authorised",
  "scope_needed",
  "blocked",
  "ready_to_authorise",
  "successor_draft",
  "no_visit",
  "visit_review",
  "coverage_unresolved",
] as const;
export type WorkOrderView = (typeof workOrderViews)[number];
export type AuthorisationState =
  | "ScopeNeeded"
  | "Blocked"
  | "ReadyToAuthorise"
  | "SuccessorDraft"
  | "Authorised";

export function authorisationState(
  status: "Draft" | "Authorised",
  current: string | null,
  authorised: string | null,
  blockerCount: number,
): AuthorisationState {
  if (status === "Authorised")
    return current !== authorised ? "SuccessorDraft" : "Authorised";
  if (!current) return "ScopeNeeded";
  return blockerCount ? "Blocked" : "ReadyToAuthorise";
}

// Shared by the original detail reader and the additive register projection.
export function visitScopeReviewRequired(
  current: string | null,
  authorised: string | null,
  revisionVersion: number | undefined,
  visit: { scope_revision_id: string; scope_version: number },
) {
  return (
    visit.scope_revision_id !== authorised ||
    visit.scope_revision_id !== current ||
    revisionVersion !== visit.scope_version
  );
}

export function windowNumber(
  value: unknown,
  field: string,
  fallback: number,
  max: number,
) {
  if (value === undefined) return fallback;
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^\d+$/.test(value))
  )
    invalid(field, "Use a whole number.");
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < (field === "limit" ? 1 : 0) || n > max)
    invalid(field, `Use a bounded whole number up to ${max}.`);
  return n;
}

export function workOrderRegisterQuery(input: unknown) {
  const r = object(input, [
    "q",
    "owner_id",
    "site_id",
    "company_id",
    "status",
    "view",
    "sort",
    "offset",
    "limit",
  ]);
  if (
    r.q !== undefined &&
    (typeof r.q !== "string" || r.q.length > 200 || /[\u0000-\u001f]/.test(r.q))
  )
    invalid("q", "Use at most 200 characters.");
  return {
    q: (r.q as string | undefined) ?? "",
    owner_id: optionalId(r.owner_id, "owner_id"),
    site_id: optionalId(r.site_id, "site_id"),
    company_id: optionalId(r.company_id, "company_id"),
    status:
      r.status === undefined
        ? null
        : choice(r.status, "status", ["Draft", "Authorised"]),
    view:
      r.view === undefined
        ? ("all" as const)
        : choice(r.view, "view", workOrderViews),
    sort:
      r.sort === undefined
        ? ("reference_desc" as const)
        : choice(r.sort, "sort", [
            "reference_desc",
            "updated_desc",
            "updated_asc",
            "reference_asc",
          ] as const),
    offset: windowNumber(r.offset, "offset", 0, 1000000),
    limit: windowNumber(r.limit, "limit", 25, 25),
  };
}

export function workOrderRecordQuery(input: unknown) {
  const r = object(input, ["history_offset", "evidence_offset", "limit"]);
  return {
    history_offset: windowNumber(
      r.history_offset,
      "history_offset",
      0,
      1000000,
    ),
    evidence_offset: windowNumber(
      r.evidence_offset,
      "evidence_offset",
      0,
      1000000,
    ),
    limit: windowNumber(r.limit, "limit", 25, 25),
  };
}

type ViewRow = {
  status: "Draft" | "Authorised";
  service_owner_id: string;
  authorisation: AuthorisationState;
  coverage_status: string | null;
  next_visit: { scope_review_required: boolean } | null;
};
export function inWorkOrderView(
  row: ViewRow,
  view: WorkOrderView,
  actor: string,
) {
  switch (view) {
    case "all":
      return true;
    case "mine":
      return row.service_owner_id === actor;
    case "drafts":
      return row.status === "Draft";
    case "authorised":
      return row.status === "Authorised";
    case "scope_needed":
      return row.authorisation === "ScopeNeeded";
    case "blocked":
      return row.authorisation === "Blocked";
    case "ready_to_authorise":
      return row.authorisation === "ReadyToAuthorise";
    case "successor_draft":
      return row.authorisation === "SuccessorDraft";
    case "no_visit":
      return row.next_visit === null;
    case "visit_review":
      return row.next_visit?.scope_review_required === true;
    case "coverage_unresolved":
      return ["Unknown", "Disputed"].includes(row.coverage_status ?? "");
  }
}
