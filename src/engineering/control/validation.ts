import {
  choice,
  common,
  commonKeys,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  optionalText,
  uuid,
  version,
} from "../../shared/validation";
import { disciplines } from "../model";
import {
  controlKinds,
  purposes,
  type BasisContent,
  type ContentByKind,
  type ControlKind,
} from "./model";

const ids = (value: unknown, field: string) =>
  list(value ?? [], field, (v) => uuid(v, field));
function list<T>(
  value: unknown,
  field: string,
  parse: (value: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > 100)
    return invalid(field, "Supply a list of at most 100 records.");
  return value.map(parse);
}
const date = (value: unknown, field: string) =>
  value == null ? null : dateOnly(value, field);
const flag = (value: unknown, field: string) =>
  typeof value === "boolean" ? value : invalid(field, "Choose yes or no.");
const base = (value: unknown, fields: string[]) => {
  const r = object(value, ["schema_version", "source_ids", ...fields]);
  if (r.schema_version !== 1)
    invalid("schema_version", "Only content schema 1 is supported.");
  return r;
};
export function parseContent<K extends ControlKind>(
  kind: K,
  value: unknown,
): ContentByKind[K] {
  let result: unknown;
  if (kind === "basis") {
    const r = base(value, [
      "purpose",
      "summary",
      "exclusions",
      "facility_ids",
      "requirements",
      "inputs",
      "interfaces",
      "calculations",
    ]);
    const record = (v: unknown, fields: string[]) =>
      object(v, ["id", "title", "source_ids", ...fields]);
    const head = (v: Record<string, unknown>) => ({
      id: uuid(v.id, "id"),
      title: label(v.title, "title", 300),
      source_ids: ids(v.source_ids, "source_ids"),
    });
    result = {
      schema_version: 1,
      source_ids: ids(r.source_ids, "source_ids"),
      purpose: choice(r.purpose, "purpose", purposes),
      summary: narrative(r.summary, "summary"),
      exclusions: narrative(r.exclusions, "exclusions"),
      facility_ids: ids(r.facility_ids, "facility_ids"),
      requirements: list(r.requirements, "requirements", (v) => {
        const x = record(v, ["owner_id", "criterion", "deliverable_ids"]);
        return {
          ...head(x),
          owner_id: uuid(x.owner_id, "owner_id"),
          criterion: narrative(x.criterion, "criterion"),
          deliverable_ids: ids(x.deliverable_ids, "deliverable_ids"),
        };
      }),
      inputs: list(r.inputs, "inputs", (v) => {
        const x = record(v, [
          "kind",
          "owner_id",
          "due_date",
          "blocking",
          "state",
          "response",
          "deliverable_ids",
        ]);
        return {
          ...head(x),
          kind: choice(x.kind, "kind", [
            "Assumption",
            "Constraint",
            "Question",
          ] as const),
          owner_id: uuid(x.owner_id, "owner_id"),
          due_date: date(x.due_date, "due_date"),
          blocking: flag(x.blocking, "blocking"),
          state: choice(x.state, "state", [
            "Unknown",
            "Unconfirmed",
            "Supported",
          ] as const),
          response: optionalNarrative(x.response, "response"),
          deliverable_ids: ids(x.deliverable_ids, "deliverable_ids"),
        };
      }),
      interfaces: list(r.interfaces, "interfaces", (v) => {
        const x = record(v, [
          "provider_id",
          "receiver_id",
          "required_input",
          "expected_output",
          "criterion",
        ]);
        return {
          ...head(x),
          provider_id: uuid(x.provider_id, "provider_id"),
          receiver_id: uuid(x.receiver_id, "receiver_id"),
          required_input: narrative(x.required_input, "required_input"),
          expected_output: narrative(x.expected_output, "expected_output"),
          criterion: narrative(x.criterion, "criterion"),
        };
      }),
      calculations: list(r.calculations, "calculations", (v) => {
        const x = record(v, [
          "model_reference",
          "model_version",
          "check_evidence",
        ]);
        return {
          ...head(x),
          model_reference: label(x.model_reference, "model_reference", 1000),
          model_version: label(x.model_version, "model_version", 100),
          check_evidence: optionalNarrative(x.check_evidence, "check_evidence"),
        };
      }),
    } satisfies BasisContent;
    const content = result as BasisContent,
      all = [
        ...content.requirements,
        ...content.inputs,
        ...content.interfaces,
        ...content.calculations,
      ];
    if (new Set(all.map((x) => x.id)).size !== all.length)
      invalid("id", "Each basis record needs a distinct identity.");
  } else if (kind === "document") {
    const r = base(value, ["discipline", "document_type"]);
    result = {
      schema_version: 1,
      source_ids: ids(r.source_ids, "source_ids"),
      discipline: choice(r.discipline, "discipline", disciplines),
      document_type: label(r.document_type, "document_type", 100),
    };
  } else if (kind === "query") {
    const r = base(value, [
      "question",
      "deliverable_ids",
      "change_id",
      "review_required",
    ]);
    result = {
      schema_version: 1,
      source_ids: ids(r.source_ids, "source_ids"),
      question: narrative(r.question, "question"),
      deliverable_ids: ids(r.deliverable_ids, "deliverable_ids"),
      change_id: optionalId(r.change_id, "change_id"),
      review_required: flag(r.review_required, "review_required"),
      response: null,
      response_by: null,
      response_at: null,
      actions: null,
    };
  } else if (kind === "submittal") {
    const r = base(value, [
      "supplier",
      "product_reference",
      "purchase_reference",
      "submitted_revision",
      "evidence",
      "reviewer_id",
      "downstream_actions",
    ]);
    result = {
      schema_version: 1,
      source_ids: ids(r.source_ids, "source_ids"),
      supplier: label(r.supplier, "supplier", 300),
      product_reference: label(r.product_reference, "product_reference", 300),
      purchase_reference: optionalText(
        r.purchase_reference,
        "purchase_reference",
        300,
      ),
      submitted_revision: label(
        r.submitted_revision,
        "submitted_revision",
        100,
      ),
      evidence: narrative(r.evidence, "evidence"),
      reviewer_id: uuid(r.reviewer_id, "reviewer_id"),
      downstream_actions: narrative(r.downstream_actions, "downstream_actions"),
    };
  } else if (kind === "deliverable") {
    const r = base(value, [
      "discipline",
      "document_id",
      "prerequisite",
      "prerequisite_evidence",
      "next_action",
      "planned_hours",
      "effort_source",
      "authorised_hours",
      "authorisation_reference",
    ]);
    const hours = (v: unknown, field: string) => {
      if (v == null) return null;
      if (typeof v !== "string" || !/^\d{1,6}(\.\d{1,2})?$/.test(v))
        return invalid(
          field,
          "Enter non-negative hours with at most two decimal places, or leave unknown.",
        );
      return v;
    };
    const planned_hours = hours(r.planned_hours, "planned_hours"),
      authorised_hours = hours(r.authorised_hours, "authorised_hours"),
      effort_source = optionalNarrative(r.effort_source, "effort_source"),
      authorisation_reference = optionalNarrative(
        r.authorisation_reference,
        "authorisation_reference",
      );
    if (
      (planned_hours !== null && !effort_source) ||
      (authorised_hours !== null && !authorisation_reference)
    )
      invalid(
        "effort_source",
        "Known effort requires its source and explicit authorisation evidence.",
      );
    result = {
      schema_version: 1,
      source_ids: ids(r.source_ids, "source_ids"),
      discipline: choice(r.discipline, "discipline", disciplines),
      document_id: optionalId(r.document_id, "document_id"),
      prerequisite: narrative(r.prerequisite, "prerequisite"),
      prerequisite_evidence: optionalNarrative(
        r.prerequisite_evidence,
        "prerequisite_evidence",
      ),
      next_action: label(r.next_action, "next_action", 300),
      planned_hours,
      authorised_hours,
      effort_source,
      authorisation_reference,
    };
  } else
    return invalid(
      "kind",
      "Review and issue content is constructed by the server.",
    );
  return result as ContentByKind[K];
}
export const actionFields = {
  save: [
    "id",
    "expected_version",
    "reference",
    "title",
    "owner_id",
    "due_date",
    "content",
    "predecessor_id",
  ],
  confirm_interface: ["id", "expected_version", "interface_id"],
  submit_basis: ["id", "expected_version", "reviewer_id"],
  revise_document: [
    "id",
    "expected_version",
    "revision_id",
    "engineering_revision",
    "native_system",
    "native_reference",
    "native_version",
    "configuration",
    "outputs",
    "basis_id",
  ],
  respond: ["id", "expected_version", "response", "actions", "change_id"],
  dispose: ["id", "expected_version", "outcome", "rationale"],
  submit_review: [
    "id",
    "reference",
    "title",
    "reviewer_id",
    "due_date",
    "purpose",
    "basis_id",
    "document_revision_ids",
    "submittal_ids",
    "source_ids",
    "predecessor_id",
  ],
  finding: [
    "id",
    "expected_version",
    "finding_id",
    "owner_id",
    "due_date",
    "finding",
  ],
  respond_finding: ["id", "expected_version", "finding_id", "response"],
  accept_finding: ["id", "expected_version", "finding_id"],
  decide_review: ["id", "expected_version", "outcome", "rationale"],
  issue: [
    "id",
    "reference",
    "title",
    "review_id",
    "expected_version",
    "recipient_ids",
  ],
  distribution: [
    "id",
    "expected_version",
    "transmittal_id",
    "evidence_kind",
    "evidence",
  ],
  withdraw: ["id", "expected_version"],
} as const;
export type Action = keyof typeof actionFields;
export function parseControlCommand(value: unknown) {
  const fields = Object.values(actionFields).flat();
  const r = object(value, [...commonKeys, "action", "kind", ...fields]);
  const action = choice(
      r.action,
      "action",
      Object.keys(actionFields) as Action[],
    ),
    kind = choice(r.kind, "kind", controlKinds);
  object(r, [...commonKeys, "action", "kind", ...actionFields[action]]);
  return {
    ...common(r),
    kind,
    action,
    id: uuid(r.id, "id"),
    expected_version:
      r.expected_version == null ? null : version(r.expected_version),
    fields: r,
  };
}
export { ids, date, list };
