import {
  common,
  commonKeys,
  choice,
  dateOnly,
  instant,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  uuid,
  version,
} from "../../shared/validation";
import { parseOutcomeSource } from "../../crm/outcome-sources";
import { kinds, money, type Content, type Kind } from "./model";

export function sourceInput(value: unknown) {
  const r = object(value, [
    "handover_id",
    "acceptance_event_id",
    "quotation",
    "document_id",
    "document_revision_id",
    "document_review_id",
    "document_version",
  ]);
  const quotation = parseOutcomeSource(r.quotation);
  if (quotation.kind !== "Quotation")
    invalid(
      "quotation",
      "Select an exact issued and reported-Accepted quotation.",
    );
  return {
    handover_id: uuid(r.handover_id, "handover_id"),
    acceptance_event_id: uuid(r.acceptance_event_id, "acceptance_event_id"),
    quotation,
    document_id: uuid(r.document_id, "document_id"),
    document_revision_id: uuid(r.document_revision_id, "document_revision_id"),
    document_review_id: uuid(r.document_review_id, "document_review_id"),
    document_version: version(r.document_version),
  };
}
export type Source = ReturnType<typeof sourceInput>;
export function contentInput(value: unknown, kind: Kind): Content {
  const keys = ["title", "detail", "clause", "owner_id", "action_ids"];
  const r = object(value, [
    ...keys,
    ...(kind === "Obligation"
      ? ["due_date", "date_needed", "evidence"]
      : kind === "Notice"
        ? ["evidence", "occurred_at"]
        : kind === "Variation"
          ? ["requested_amount", "priced_amount", "date_impact"]
          : []),
  ]);
  if (!Array.isArray(r.action_ids) || r.action_ids.length > 20)
    invalid("action_ids", "Select up to 20 native Project Activities.");
  const action_ids = r.action_ids.map((x) => uuid(x, "action_ids")).sort();
  if (new Set(action_ids).size !== action_ids.length)
    invalid("action_ids", "Select each Activity once.");
  const due_date =
    kind === "Obligation" && r.due_date !== null
      ? dateOnly(r.due_date, "due_date")
      : null;
  if (kind === "Obligation" && r.date_needed !== (due_date === null))
    invalid(
      "date_needed",
      "State whether an explicit obligation date is still needed.",
    );
  const occurred_at =
    kind === "Notice" ? instant(r.occurred_at, "occurred_at") : null;
  return {
    title: label(r.title, "title", 200),
    detail: narrative(r.detail, "detail", 4000),
    clause: label(r.clause, "clause", 500),
    owner_id: uuid(r.owner_id, "owner_id"),
    action_ids,
    due_date,
    date_needed: kind === "Obligation" && due_date === null,
    evidence:
      kind === "Notice"
        ? narrative(r.evidence, "evidence", 4000)
        : kind === "Obligation"
          ? optionalNarrative(r.evidence, "evidence", 4000)
          : null,
    occurred_at,
    requested_amount:
      kind === "Variation"
        ? money(r.requested_amount, "requested_amount")
        : null,
    priced_amount:
      kind === "Variation" ? money(r.priced_amount, "priced_amount") : null,
    date_impact:
      kind === "Variation"
        ? optionalNarrative(r.date_impact, "date_impact", 2000)
        : null,
  };
}
export function commandInput(project: string, value: unknown) {
  const keys = [...commonKeys, "id", "expected_version", "action", "note"];
  const all = object(value, [
    ...keys,
    "kind",
    "basis_id",
    "predecessor_id",
    "source",
    "content",
    "outcome",
  ]);
  const action = choice(all.action, "action", [
    "Create",
    "Revise",
    "Submit",
    "Decide",
    "Withdraw",
    "Satisfy",
    "Reopen",
  ] as const);
  const r = object(value, [
    ...keys,
    ...(action === "Create"
      ? ["kind", "basis_id", "predecessor_id", "source", "content"]
      : action === "Revise"
        ? ["kind", "content"]
        : action === "Decide"
          ? ["outcome"]
          : []),
  ]);
  if (
    !Number.isSafeInteger(r.expected_version) ||
    Number(r.expected_version) < 0 ||
    Number(r.expected_version) >= 2147483647 ||
    (action === "Create") !== (r.expected_version === 0)
  )
    invalid(
      "expected_version",
      "Use zero for creation or the exact current version.",
    );
  const kind =
    action === "Create" || action === "Revise"
      ? choice(r.kind, "kind", kinds)
      : null;
  const source =
    action === "Create" && kind === "Basis" ? sourceInput(r.source) : null;
  if (action === "Create" && kind !== "Basis" && r.source !== undefined)
    invalid(
      "source",
      "Dependent records retain their approved original basis.",
    );
  const basis_id =
    action === "Create" && kind !== "Basis"
      ? uuid(r.basis_id, "basis_id")
      : null;
  if (action === "Create" && kind === "Basis" && r.basis_id != null)
    invalid("basis_id", "An original basis has no parent basis.");
  const predecessor_id =
    action === "Create" ? optionalId(r.predecessor_id, "predecessor_id") : null;
  if (predecessor_id && !["Notice", "Variation"].includes(kind!))
    invalid(
      "predecessor_id",
      "Only notice corrections and signed variation adjustments reference predecessors.",
    );
  return {
    ...common(r),
    project_id: uuid(project, "project_id"),
    id: uuid(r.id, "id"),
    expected_version: Number(r.expected_version),
    action,
    note: narrative(r.note, "note", 2000),
    kind,
    source,
    basis_id,
    predecessor_id,
    content: kind ? contentInput(r.content, kind) : null,
    outcome:
      action === "Decide"
        ? choice(r.outcome, "outcome", [
            "Approved",
            "Returned",
            "Waived",
            "Rejected",
            "Disputed",
          ] as const)
        : null,
  };
}
