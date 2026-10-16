import {
  common,
  commonKeys,
  object,
  choice,
  uuid,
  version,
  invalid,
  label,
  narrative,
  optionalNarrative,
  dateOnly,
  optionalId,
} from "../../shared/validation";

export const commands = [
  "Create",
  "Revise",
  "Submit",
  "Accept",
  "Return",
  "Withdraw",
] as const;
export type Command = (typeof commands)[number];
export type State =
  "Draft" | "Submitted" | "Accepted" | "Returned" | "Withdrawn";
function reference(value: unknown) {
  if (value === null) return null;
  const r = object(value, ["id", "version"]);
  return { id: uuid(r.id, "id"), version: version(r.version) };
}
export function contentInput(value: unknown) {
  const r = object(value, [
    "title",
    "scope",
    "exclusions",
    "deliverables",
    "specialist",
    "owner_id",
    "receiver_id",
    "due_date",
    "date_needed_reason",
    "engineering",
    "engineering_needed_reason",
    "demand",
    "demand_needed_reason",
    "action_ids",
  ]);
  const due_date =
      r.due_date === null ? null : dateOnly(r.due_date, "due_date"),
    date_needed_reason = optionalNarrative(
      r.date_needed_reason,
      "date_needed_reason",
      1000,
    ),
    engineering = reference(r.engineering),
    demand = reference(r.demand),
    engineering_needed_reason = optionalNarrative(
      r.engineering_needed_reason,
      "engineering_needed_reason",
      1000,
    ),
    demand_needed_reason = optionalNarrative(
      r.demand_needed_reason,
      "demand_needed_reason",
      1000,
    );
  for (const [field, selected, reason] of [
    ["due_date", due_date, date_needed_reason],
    ["engineering", engineering, engineering_needed_reason],
    ["demand", demand, demand_needed_reason],
  ])
    if (Boolean(selected) === Boolean(reason))
      invalid(
        String(field),
        "Select an exact value or explain why it is unresolved.",
      );
  if (!Array.isArray(r.action_ids) || r.action_ids.length > 20)
    invalid("action_ids", "Select up to 20 saved Project Activities.");
  const action_ids = r.action_ids.map((x) => uuid(x, "action_ids")).sort();
  if (new Set(action_ids).size !== action_ids.length)
    invalid("action_ids", "Select each Activity once.");
  return {
    title: label(r.title, "title", 200),
    scope: narrative(r.scope, "scope", 4000),
    exclusions: narrative(r.exclusions, "exclusions", 4000),
    deliverables: narrative(r.deliverables, "deliverables", 4000),
    specialist: label(r.specialist, "specialist", 500),
    owner_id: uuid(r.owner_id, "owner_id"),
    receiver_id: uuid(r.receiver_id, "receiver_id"),
    due_date,
    date_needed_reason,
    engineering,
    engineering_needed_reason,
    demand,
    demand_needed_reason,
    action_ids,
  };
}
export type Content = ReturnType<typeof contentInput>;
export function commandInput(project: string, value: unknown) {
  const r = object(value, [
    ...commonKeys,
    "id",
    "expected_version",
    "action",
    "note",
    "basis_id",
    "basis_version",
    "predecessor_id",
    "content",
  ]);
  const action = choice(r.action, "action", commands);
  if (
    action !== "Create" &&
    ["basis_id", "basis_version", "predecessor_id"].some((k) => k in r)
  )
    invalid("basis_id", "Package identity and basis are permanent.");
  if (!["Create", "Revise"].includes(action) && "content" in r)
    invalid("content", "Receiving retains the exact submitted content.");
  if (action === "Create" && r.expected_version !== 0)
    invalid("expected_version", "Create requires version zero.");
  const expected_version =
    action === "Create" ? 0 : version(r.expected_version);
  if (expected_version >= 2147483647)
    invalid("expected_version", "Version exceeds the supported range.");
  return {
    ...common(r),
    project_id: uuid(project, "project_id"),
    id: uuid(r.id, "id"),
    expected_version,
    action,
    note: narrative(r.note, "note", 2000),
    basis_id: action === "Create" ? uuid(r.basis_id, "basis_id") : null,
    basis_version: action === "Create" ? version(r.basis_version) : null,
    predecessor_id:
      action === "Create"
        ? optionalId(r.predecessor_id, "predecessor_id")
        : null,
    content: ["Create", "Revise"].includes(action)
      ? contentInput(r.content)
      : null,
  };
}
export function transition(prior: State | undefined, command: Command): State {
  if (!prior && command === "Create") return "Draft";
  if ((prior === "Draft" || prior === "Returned") && command === "Revise")
    return "Draft";
  if ((prior === "Draft" || prior === "Returned") && command === "Submit")
    return "Submitted";
  if (prior === "Submitted" && command === "Accept") return "Accepted";
  if (prior === "Submitted" && command === "Return") return "Returned";
  if (
    prior &&
    prior !== "Accepted" &&
    prior !== "Withdrawn" &&
    command === "Withdraw"
  )
    return "Withdrawn";
  invalid("action", "This package state does not permit that command.");
}
