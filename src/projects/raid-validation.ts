import { common, commonKeys, choice, invalid, label, narrative, object, optionalNarrative, uuid } from "../shared/validation";
import { dueFields } from "../activities/activities";

export const raidKinds = ["Risk", "Assumption", "Issue", "Dependency", "Decision"] as const;
export const raidStates = ["Open", "Monitoring", "Closed"] as const;

export function parseRaid(project: string, input: unknown) {
  const r = object(input, [...commonKeys, "id", "expected_version", "kind", "title", "detail", "owner_id", "priority", "due_at", "due_needed", "response", "interface_notes", "state", "outcome", "action_ids"]);
  if (!Number.isSafeInteger(r.expected_version) || Number(r.expected_version) < 0 || Number(r.expected_version) >= 2147483647)
    invalid("expected_version", "Use zero for a new record or its current version for an update.");
  if (!Array.isArray(r.action_ids) || r.action_ids.length > 20) invalid("action_ids", "Select up to 20 saved project Activities.");
  const action_ids = r.action_ids.map(id => uuid(id, "action_ids")).sort();
  if (new Set(action_ids).size !== action_ids.length) invalid("action_ids", "Select each Activity once.");
  const state = choice(r.state, "state", raidStates);
  const outcome = optionalNarrative(r.outcome, "outcome", 4000);
  if ((state === "Closed") !== (outcome !== null)) invalid("outcome", "A closed record needs an outcome; open records retain earlier outcomes in history.");
  if (r.expected_version === 0 && state !== "Open") invalid("state", "Start a new record Open.");
  return {
    ...common(r), project_id: uuid(project, "project_id"), id: uuid(r.id, "id"), expected_version: Number(r.expected_version),
    kind: choice(r.kind, "kind", raidKinds), title: label(r.title, "title", 200), detail: narrative(r.detail, "detail", 4000),
    owner_id: uuid(r.owner_id, "owner_id"), priority: choice(r.priority, "priority", ["Normal", "High"] as const),
    ...dueFields(r), response: optionalNarrative(r.response, "response", 4000), interface_notes: optionalNarrative(r.interface_notes, "interface_notes", 2000),
    state, outcome, action_ids,
  };
}
