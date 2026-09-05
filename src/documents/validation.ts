import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  narrative,
  choice,
  invalid,
} from "../shared/validation";
export const sectionKeys = [
  "identification",
  "customer_arrangements",
  "scope",
  "equipment",
  "history",
  "technical_information",
  "readiness",
  "site_controls",
  "completion",
] as const;
export const sectionLabels = [
  "Identification and visit",
  "Customer arrangements",
  "Authorised scope and limits",
  "Equipment and configuration",
  "History and unresolved issues",
  "Technical information",
  "Parts, tools and readiness",
  "Site controls",
  "Completion evidence and escalation",
] as const;
export type SectionKey = (typeof sectionKeys)[number];
export type PackInput = {
  sections: Record<SectionKey, string>;
  source_ids: string[];
  history_ids: string[];
};
export function packInput(value: unknown): PackInput {
  const raw = object(value, ["sections", "source_ids", "history_ids"]),
    sections = object(raw.sections, [...sectionKeys]);
  const ids = (v: unknown, key: string, max: number) => {
    if (!Array.isArray(v) || v.length > max)
      invalid(key, `Select at most ${max} exact records.`);
    return [...new Set((v as unknown[]).map((x) => uuid(x, key)))].sort();
  };
  return {
    sections: Object.fromEntries(
      sectionKeys.map((k) => [k, narrative(sections[k], k, 6000)]),
    ) as PackInput["sections"],
    source_ids: ids(raw.source_ids, "source_ids", 20),
    history_ids: ids(raw.history_ids, "history_ids", 30),
  };
}
export function prepareCommand(
  id: string | undefined,
  input: unknown,
): {
  operation_id: string;
  schema_version: 1;
  reason: string;
  id: string;
  expected_version?: number;
  appointment_id?: string;
  expected_appointment_version?: number;
  content: PackInput;
} {
  const r = object(input, [
    ...commonKeys,
    ...(id
      ? ["expected_version"]
      : ["id", "appointment_id", "expected_appointment_version"]),
    "content",
  ]);
  return {
    ...common(r),
    id: uuid(id ?? r.id, "id"),
    ...(id
      ? { expected_version: version(r.expected_version) }
      : {
          appointment_id: uuid(r.appointment_id, "appointment_id"),
          expected_appointment_version: version(r.expected_appointment_version),
        }),
    content: packInput(r.content),
  };
}
export function decisionCommand(id: string, input: unknown, check = false) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    ...(check ? ["decision"] : []),
  ]);
  return {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    ...(check
      ? { decision: choice(r.decision, "decision", ["Checked", "Returned"]) }
      : {}),
  };
}
