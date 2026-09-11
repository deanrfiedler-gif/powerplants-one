import {
  common,
  commonKeys,
  object,
  uuid,
  label,
  narrative,
  optionalNarrative,
  dateOnly,
  version,
  invalid,
  choice,
} from "../shared/validation";
import { disciplines, coordinationStates } from "./model";
function optionalDate(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  const date = dateOnly(value, field);
  if (date < "0001-01-01" || date > "9998-12-31")
    invalid(field, "Enter a date between years 0001 and 9998.");
  return date;
}
export function parseEngineeringRequest(value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "id",
    "title",
    "brief",
    "context_kind",
    "context_id",
    "owner_id",
    "discipline",
    "required_date",
    "next_action",
    "action_due",
  ]);
  return {
    ...common(p),
    id: uuid(p.id, "id"),
    title: label(p.title, "title", 200),
    brief: narrative(p.brief, "brief", 4000),
    context_kind: choice(p.context_kind, "context_kind", [
      "Project",
      "Opportunity",
    ] as const),
    context_id: uuid(p.context_id, "context_id"),
    owner_id: uuid(p.owner_id, "owner_id"),
    discipline: choice(p.discipline, "discipline", disciplines),
    required_date: optionalDate(p.required_date, "required_date"),
    next_action: label(p.next_action, "next_action", 300),
    action_due: optionalDate(p.action_due, "action_due"),
  };
}
export function parseEngineeringCoordination(id: string, value: unknown) {
  const p = object(value, [
    ...commonKeys,
    "expected_version",
    "owner_id",
    "state",
    "required_date",
    "next_action",
    "action_due",
    "blocker",
  ]);
  const state = choice(p.state, "state", coordinationStates),
    blocker = optionalNarrative(p.blocker, "blocker", 2000);
  if ((state === "Awaiting information") !== !!blocker)
    invalid(
      "blocker",
      "Record the missing input for Awaiting information; clear it when work can proceed.",
    );
  return {
    ...common(p),
    id: uuid(id, "id"),
    expected_version: version(p.expected_version),
    owner_id: uuid(p.owner_id, "owner_id"),
    state,
    required_date: optionalDate(p.required_date, "required_date"),
    next_action: label(p.next_action, "next_action", 300),
    action_due: optionalDate(p.action_due, "action_due"),
    blocker,
  };
}
export function parseEngineeringNote(id: string, value: unknown) {
  const p = object(value, [...commonKeys, "expected_version", "note"]);
  return {
    ...common(p),
    id: uuid(id, "id"),
    expected_version: version(p.expected_version),
    note: narrative(p.note, "note", 1500),
  };
}
