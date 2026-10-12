import { coordinationStates, disciplines } from "./model";
import { choice, invalid, object, optionalId } from "../shared/validation";

export const workloadViews = [
  "all",
  "mine",
  "author",
  "review",
  "released",
] as const;
export const workloadSorts = [
  "RequiredDate",
  "ActionDate",
  "Name",
  "Updated",
] as const;
export function workloadQuery(input: unknown) {
  const q = object(input, [
    "q",
    "owner_id",
    "discipline",
    "attention",
    "state",
    "view",
    "sort",
    "direction",
    "limit",
    "cursor",
  ]);
  if (
    q.q !== undefined &&
    (typeof q.q !== "string" || q.q.length > 200 || /[\u0000-\u001f]/.test(q.q))
  )
    invalid("q", "Use at most 200 search characters.");
  const limit = q.limit === undefined ? 50 : Number(q.limit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    invalid("limit", "Choose a page size from 1 to 100.");
  return {
    q: ((q.q ?? "") as string).trim().toLowerCase(),
    owner_id: optionalId(q.owner_id, "owner_id"),
    state: q.state ? choice(q.state, "state", coordinationStates) : null,
    discipline: q.discipline
      ? choice(q.discipline, "discipline", disciplines)
      : null,
    attention:
      choice(q.attention ?? "false", "attention", [
        "true",
        "false",
      ] as const) === "true",
    view: choice(q.view ?? "all", "view", workloadViews),
    sort: choice(q.sort ?? "RequiredDate", "sort", workloadSorts),
    direction: choice(q.direction ?? "asc", "direction", [
      "asc",
      "desc",
    ] as const),
    limit,
    cursor: q.cursor,
  };
}
export type WorkloadQuery = ReturnType<typeof workloadQuery>;
export function workloadOrder(q: WorkloadQuery) {
  const field = {
    RequiredDate: "r.required_date",
    ActionDate: "r.action_due",
    Name: 'lower(r.title) COLLATE "C"',
    Updated: "r.updated_at",
  }[q.sort];
  return `${field} ${q.direction === "asc" ? "ASC" : "DESC"} NULLS LAST,r.id ASC`;
}
