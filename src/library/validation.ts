import {
  choice,
  common,
  commonKeys,
  dateOnly,
  label,
  narrative,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { targetKinds, type SourceInput } from "./types";
export function sourceInput(value: unknown): SourceInput {
  const kind = choice(
    object(value, ["kind", "text", "issue_id"]).kind,
    "source.kind",
    ["SyntheticText", "JobPackIssue", "ReportIssue"] as const,
  );
  const s = object(
    value,
    kind === "SyntheticText" ? ["kind", "text"] : ["kind", "issue_id"],
  );
  return kind === "SyntheticText"
    ? { kind, text: narrative(s.text, "source.text", 20000) }
    : { kind, issue_id: uuid(s.issue_id, "source.issue_id") };
}
export function revisionInput(value: unknown, create = false) {
  const x = object(value, [
    ...commonKeys,
    "revision_id",
    "title",
    "document_type",
    "applicability",
    "audience",
    "owner_id",
    "source",
    ...(create
      ? ["id", "company_id", "organisation_id", "site_id"]
      : ["expected_version", "observed_revision_id"]),
  ]);
  return {
    ...common(x),
    revision_id: uuid(x.revision_id, "revision_id"),
    title: label(x.title, "title", 200),
    document_type: label(x.document_type, "document_type", 80),
    applicability: narrative(x.applicability, "applicability", 2000),
    audience: label(x.audience, "audience", 200),
    owner_id: uuid(x.owner_id, "owner_id"),
    source: sourceInput(x.source),
    ...(create
      ? {
          id: uuid(x.id, "id"),
          company_id: uuid(x.company_id, "company_id"),
          organisation_id: uuid(x.organisation_id, "organisation_id"),
          site_id: optionalId(x.site_id, "site_id"),
        }
      : {
          expected_version: version(x.expected_version),
          observed_revision_id: uuid(
            x.observed_revision_id,
            "observed_revision_id",
          ),
        }),
  };
}
export function commandInput(value: unknown, keys: string[]) {
  const x = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    ...keys,
  ]);
  return {
    x,
    base: {
      ...common(x),
      expected_version: version(x.expected_version),
      revision_id: uuid(x.revision_id, "revision_id"),
    },
  };
}
export function findingInput(value: unknown) {
  const raw = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "action",
    "finding_id",
    "text",
    "owner_id",
    "due_date",
  ]);
  const action = choice(raw.action, "action", [
    "Open",
    "Respond",
    "Accept",
  ] as const);
  const { x, base } = commandInput(raw, [
    "action",
    "finding_id",
    ...(action === "Open" ? ["text", "owner_id", "due_date"] : ["text"]),
  ]);
  return {
    ...base,
    action,
    finding_id: uuid(x.finding_id, "finding_id"),
    text: narrative(x.text, "text", 2000),
    ...(action === "Open"
      ? {
          owner_id: uuid(x.owner_id, "owner_id"),
          due_date: dateOnly(x.due_date, "due_date"),
        }
      : {}),
  };
}
export function reviewInput(value: unknown) {
  const { x, base } = commandInput(value, ["outcome", "purpose", "rationale"]);
  return {
    ...base,
    outcome: choice(x.outcome, "outcome", ["Reviewed", "Returned"] as const),
    purpose: label(x.purpose, "purpose", 200),
    rationale: narrative(x.rationale, "rationale", 2000),
  };
}
export function linkInput(value: unknown) {
  const raw = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "action",
    "link_id",
    "target_kind",
    "target_id",
    "purpose",
  ]);
  const action = choice(raw.action, "action", ["Add", "Retire"] as const);
  const { x, base } = commandInput(raw, [
    "action",
    "link_id",
    ...(action === "Add" ? ["target_kind", "target_id", "purpose"] : []),
  ]);
  return {
    ...base,
    action,
    link_id: uuid(x.link_id, "link_id"),
    ...(action === "Add"
      ? {
          target_kind: choice(x.target_kind, "target_kind", targetKinds),
          target_id: uuid(x.target_id, "target_id"),
          purpose: label(x.purpose, "purpose", 500),
        }
      : {}),
  };
}
