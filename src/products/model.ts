import { createHash } from "node:crypto";
import { canonical } from "../platform/operations";
import {
  choice,
  dateOnly,
  invalid,
  label,
  object,
  optionalText,
  uuid,
} from "../shared/validation";

export const kinds = ["Family", "Model", "Variant"] as const;
export const states = [
  "Draft",
  "Submitted",
  "Reviewed",
  "Returned",
  "Published",
  "Withdrawn",
] as const;
export const productCapabilities = [
  "products.read",
  "products.edit",
  "products.review",
  "products.publish",
  "products.commercial.read",
  "products.sources.bind",
  "products.relationship.edit",
  "products.relationship.review",
  "products.import.stage",
  "products.import.review",
  "products.import.apply",
] as const;
export type ProductCapability = (typeof productCapabilities)[number];
export const hash = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export const attributes = {
  voltage: "V",
  power: "kW",
  flow: "L/min",
  pressure: "kPa",
  length: "mm",
  mass: "kg",
  interface: "text",
} as const;
export type Attribute = {
  key: keyof typeof attributes;
  value: string | null;
  unit: string;
  status: "SourceReported" | "Reviewed" | "Unresolved";
  evidence: string;
  clarification_owner: string | null;
};
export type DocumentReference = {
  provider: string;
  entity_key: string;
  revision: string;
  title: string;
  type: string;
  applicability: "Applicable" | "NotApplicable" | "Unresolved";
  basis: string;
  source_date: string;
};
export type Content = {
  title: string;
  manufacturer: string;
  model: string;
  variant: string;
  technical_revision: string;
  source_reference: string;
  source_revision: string;
  source_date: string;
  description: string;
  unit: "each" | "m" | "kg";
  attributes: Attribute[];
  documents: DocumentReference[];
  lifecycle: "Unknown" | "Supported" | "Discontinued" | "Retired";
  lifecycle_evidence: string;
  support_until: string | null;
  data_mode: "Synthetic";
};
export type Product = {
  id: string;
  workspace_id: string;
  company_id: string;
  reference: string;
  kind: (typeof kinds)[number];
  parent_id: string | null;
  provider: string;
  entity_key: string;
  owner_id: string;
  version: number;
  revision: number;
  current_revision_id: string;
  published_revision_id: string | null;
  state: (typeof states)[number];
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
};
export type Revision = {
  id: string;
  workspace_id: string;
  company_id: string;
  product_id: string;
  revision: number;
  predecessor_id: string | null;
  content: Content;
  content_hash: string;
  reason: string;
  created_by: string;
  created_at: Date;
};
export function boundedArray(
  value: unknown,
  field: string,
  max: number,
): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Provide an array of at most ${max} entries.`);
  return value;
}
export function productContent(value: unknown): Content {
  const b = object(value, [
    "title",
    "manufacturer",
    "model",
    "variant",
    "technical_revision",
    "source_reference",
    "source_revision",
    "source_date",
    "description",
    "unit",
    "attributes",
    "documents",
    "lifecycle",
    "lifecycle_evidence",
    "support_until",
    "data_mode",
  ]);
  const attrs = boundedArray(b.attributes, "attributes", 20).map(
    (value): Attribute => {
      const a = object(value, [
        "key",
        "value",
        "unit",
        "status",
        "evidence",
        "clarification_owner",
      ]);
      const key = choice(
        a.key,
        "attribute.key",
        Object.keys(attributes) as (keyof typeof attributes)[],
      );
      if (a.unit !== attributes[key])
        invalid(
          "attribute.unit",
          `Use ${attributes[key]} for ${key}; conversions are not configured.`,
        );
      const val = optionalText(a.value, "attribute.value", 200);
      if (
        val !== null &&
        key !== "interface" &&
        !/^\d{1,9}(\.\d{1,3})?$/.test(val)
      )
        invalid(
          "attribute.value",
          "Enter a non-negative decimal, or null for unknown.",
        );
      const status = choice(a.status, "attribute.status", [
        "SourceReported",
        "Reviewed",
        "Unresolved",
      ] as const);
      const owner = optionalText(
        a.clarification_owner,
        "clarification_owner",
        200,
      );
      if (
        (val === null || status === "Unresolved") &&
        (!owner || status !== "Unresolved")
      )
        invalid(
          "attribute.status",
          "Unknown attributes need an Unresolved state and named clarification owner.",
        );
      return {
        key,
        value: val,
        unit: attributes[key],
        status,
        evidence: label(a.evidence, "attribute.evidence", 1000),
        clarification_owner: owner,
      };
    },
  );
  if (new Set(attrs.map((a) => a.key)).size !== attrs.length)
    invalid("attributes", "Retain one exact value per attribute.");
  const documents = boundedArray(b.documents, "documents", 20).map(
    (value): DocumentReference => {
      const d = object(value, [
        "provider",
        "entity_key",
        "revision",
        "title",
        "type",
        "applicability",
        "basis",
        "source_date",
      ]);
      return {
        provider: label(d.provider, "document.provider", 200),
        entity_key: label(d.entity_key, "document.entity_key", 200),
        revision: label(d.revision, "document.revision", 200),
        title: label(d.title, "document.title", 200),
        type: label(d.type, "document.type", 40),
        applicability: choice(d.applicability, "document.applicability", [
          "Applicable",
          "NotApplicable",
          "Unresolved",
        ] as const),
        basis: label(d.basis, "document.basis", 1000),
        source_date: dateOnly(d.source_date, "document.source_date"),
      };
    },
  );
  return {
    title: label(b.title, "title", 200),
    manufacturer: label(b.manufacturer, "manufacturer", 200),
    model: label(b.model, "model", 200),
    variant: label(b.variant, "variant", 200),
    technical_revision: label(b.technical_revision, "technical_revision", 200),
    source_reference: label(b.source_reference, "source_reference", 200),
    source_revision: label(b.source_revision, "source_revision", 200),
    source_date: dateOnly(b.source_date, "source_date"),
    description: label(b.description, "description", 2000),
    unit: choice(b.unit, "unit", ["each", "m", "kg"] as const),
    attributes: attrs,
    documents,
    lifecycle: choice(b.lifecycle, "lifecycle", [
      "Unknown",
      "Supported",
      "Discontinued",
      "Retired",
    ] as const),
    lifecycle_evidence: label(b.lifecycle_evidence, "lifecycle_evidence", 1000),
    support_until:
      b.support_until == null
        ? null
        : dateOnly(b.support_until, "support_until"),
    data_mode: choice(b.data_mode, "data_mode", ["Synthetic"] as const),
  };
}
export function compareContent(before: Content | null, after: Content) {
  return (Object.keys(after) as (keyof Content)[])
    .filter((key) => canonical(before?.[key] ?? null) !== canonical(after[key]))
    .map((field) => ({
      field,
      before: before?.[field] ?? null,
      after: after[field],
    }));
}
export type RelationshipContent = {
  purpose: string;
  type: "CandidateReplacement" | "Compatibility";
  evidence: string;
  source_revision: string;
  source_date: string;
  conditions: string;
  limitations: string;
  criteria: {
    criterion: string;
    outcome: "Met" | "NotMet" | "Unknown";
    evidence: string;
    owner: string;
  }[];
  affected_use: string;
  handover: "Engineering" | "Equipment" | "Both";
};
export function relationshipContent(value: unknown): RelationshipContent {
  const b = object(value, [
    "purpose",
    "type",
    "evidence",
    "source_revision",
    "source_date",
    "conditions",
    "limitations",
    "criteria",
    "affected_use",
    "handover",
  ]);
  const criteria = boundedArray(b.criteria, "criteria", 20).map((v) => {
    const c = object(v, ["criterion", "outcome", "evidence", "owner"]);
    return {
      criterion: label(c.criterion, "criterion", 200),
      outcome: choice(c.outcome, "outcome", [
        "Met",
        "NotMet",
        "Unknown",
      ] as const),
      evidence: label(c.evidence, "evidence", 1000),
      owner: label(c.owner, "owner", 200),
    };
  });
  if (!criteria.length)
    invalid(
      "criteria",
      "Record at least one interface/application criterion, including an owned Unknown where evidence is missing.",
    );
  return {
    purpose: label(b.purpose, "purpose", 200),
    type: choice(b.type, "type", [
      "CandidateReplacement",
      "Compatibility",
    ] as const),
    evidence: label(b.evidence, "evidence", 1000),
    source_revision: label(b.source_revision, "source_revision", 200),
    source_date: dateOnly(b.source_date, "source_date"),
    conditions: label(b.conditions, "conditions", 1000),
    limitations: label(b.limitations, "limitations", 1000),
    criteria,
    affected_use: label(b.affected_use, "affected_use", 1000),
    handover: choice(b.handover, "handover", [
      "Engineering",
      "Equipment",
      "Both",
    ] as const),
  };
}
export function relationshipOutcome(
  content: RelationshipContent,
  outcome: string,
) {
  const result = choice(outcome, "outcome", [
    "Conditional",
    "Unresolved",
    "Rejected",
  ] as const);
  if (
    result === "Conditional" &&
    content.criteria.some((c) => c.outcome !== "Met")
  )
    invalid(
      "outcome",
      "Unresolved or failed criteria cannot support a conditional compatibility conclusion.",
    );
  return result;
}
export function syntheticReference(value: unknown) {
  const ref = label(value, "reference", 100);
  if (!/^SYN-[A-Za-z0-9-]{1,96}$/.test(ref))
    invalid(
      "reference",
      "Use a SYN- demonstration alias; no production numbering scheme is allocated.",
    );
  return ref;
}
export function exactRevisionIds(value: unknown) {
  const b = object(value, ["product_id", "revision_id"]);
  return {
    product_id: uuid(b.product_id, "product_id"),
    revision_id: uuid(b.revision_id, "revision_id"),
  };
}
