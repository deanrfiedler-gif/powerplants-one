import {
  common,
  commonKeys,
  object,
  uuid,
  label,
  narrative,
  choice,
  dateOnly,
  instant,
  version,
  invalid,
} from "../../shared/validation";
import type { SourceDetails } from "./model";
const shapes = {
  create: ["id", "title", "owner_id", "due", "due_basis"],
  edit: ["title", "owner_id", "due", "due_basis"],
  unit: [
    "id",
    "reference",
    "title",
    "system_name",
    "function_name",
    "installed_at",
    "served_areas",
    "configuration_version",
    "facility_id",
    "asset_id",
    "required",
    "removal_reference",
    "removal_reason",
  ],
  scope: ["units"],
  disposition: ["unit_id", "required", "removal_reference"],
  submit: [],
  return: ["owner_id"],
  successor: [],
  check: [],
  technical: [],
  source: [
    "id",
    "title",
    "kind",
    "outcome",
    "availability",
    "details",
    "public_reference",
    "source_version",
    "commissioning_id",
    "scope_key",
    "source_expected_version",
  ],
  requirement: [
    "id",
    "unit_id",
    "source_id",
    "title",
    "gate",
    "mandatory",
    "owner_id",
    "due",
    "due_basis",
    "applicability_reference",
  ],
  obligation: [
    "id",
    "unit_id",
    "source_id",
    "title",
    "owner_id",
    "recipient_id",
    "due",
    "due_basis",
    "required_evidence",
    "control_reference",
    "eligible",
    "conditions",
    "review_rule",
  ],
  transfer: ["id"],
  completeObligation: ["id", "evidence"],
  prepare: ["id", "audience", "recipient_id", "purpose"],
  issue: ["id"],
  request: ["id", "issue_id", "due"],
  response: [
    "id",
    "request_id",
    "respondent_id",
    "authority_basis",
    "method",
    "evidence",
    "outcome",
    "response_time",
    "time_precision",
    "conditions",
    "unit_ids",
    "correction_of",
  ],
  validate: ["id", "authority_basis"],
  receive: ["id", "request_id", "outcome", "evidence", "owner_id"],
  commercial: ["outcome", "evidence", "source_id"],
  closeStage: [],
  closeProject: [],
  reopen: ["unit_ids"],
  amendment: ["unit_ids"],
} as const;
export type Action = keyof typeof shapes;
export type Fields = {
  id?: string;
  title?: string;
  reference?: string;
  owner_id?: string;
  due?: string | null;
  due_basis?: string;
  system_name?: string;
  function_name?: string;
  installed_at?: string;
  served_areas?: string[];
  configuration_version?: string;
  facility_id?: string | null;
  asset_id?: string | null;
  required?: boolean;
  removal_reference?: string;
  removal_reason?: string;
  units?: {
    unit_id: string;
    disposition: "Included" | "Excluded";
    reason: string;
    relationship: string | null;
  }[];
  unit_id?: string;
  unit_ids?: string[];
  source_id?: string | null;
  kind?: string;
  outcome?: string;
  availability?: string;
  details?: SourceDetails;
  public_reference?: string;
  source_version?: string;
  commissioning_id?: string | null;
  scope_key?: string;
  source_expected_version?: number;
  gate?: string;
  mandatory?: boolean;
  applicability_reference?: string;
  recipient_id?: string;
  required_evidence?: string;
  control_reference?: string;
  eligible?: boolean;
  conditions?: string;
  review_rule?: string;
  audience?: "Customer" | "Service";
  purpose?: string;
  issue_id?: string;
  request_id?: string;
  respondent_id?: string;
  authority_basis?: string;
  method?: string;
  evidence?: string;
  response_time?: string | null;
  time_precision?: string;
  correction_of?: string | null;
};
export const need = <T>(v: T | undefined, field: string): T => {
  if (v === undefined) invalid(field, `Provide ${field.replaceAll("_", " ")}.`);
  return v;
};
export function parseCommand(value: unknown) {
  const top = object(value, [
    ...commonKeys,
    "action",
    "project_id",
    "stage_id",
    "expected_version",
    "facts_hash",
    "fields",
  ]);
  const action = choice(top.action, "action", Object.keys(shapes) as Action[]);
  const raw = object(top.fields ?? {}, [...shapes[action]]),
    fields: Fields = {};
  for (const [key, value] of Object.entries(raw)) {
    let v: unknown;
    if (key === "units") {
      if (!Array.isArray(value) || value.length > 200)
        invalid(key, "Choose up to 200 exact scope units.");
      v = value.map((x) => {
        const r = object(x, [
          "unit_id",
          "disposition",
          "reason",
          "relationship",
        ]);
        return {
          unit_id: uuid(r.unit_id, "unit_id"),
          disposition: choice(r.disposition, "disposition", [
            "Included",
            "Excluded",
          ] as const),
          reason: narrative(r.reason, "reason", 2000),
          relationship: r.relationship
            ? narrative(r.relationship, "relationship", 1000)
            : null,
        };
      });
      if (
        new Set((v as Fields["units"])!.map((x) => x.unit_id)).size !==
        (v as Fields["units"])!.length
      )
        invalid(key, "Do not duplicate scope units.");
    } else if (key === "unit_ids" || key === "served_areas") {
      if (!Array.isArray(value) || value.length > 200)
        invalid(key, "Provide a bounded list.");
      v = value.map((x) =>
        key === "unit_ids" ? uuid(x, key) : label(x, key, 200),
      );
      if (new Set(v as string[]).size !== (v as string[]).length)
        invalid(key, "Do not duplicate values.");
    } else if (key === "details") {
      const d = object(value, [
        "evidence",
        "tests_accepted",
        "tests_required",
        "release",
        "planned_on",
        "delivered_on",
        "attendance",
        "competence",
        "backup_available",
        "identity_verified",
        "restore_verified",
        "completion_required",
        "as_at",
        "currency",
        "completeness",
        "private_note",
        "source_reference",
        "authority_reference",
        "availability_evidence",
      ]);
      for (const [k, x] of Object.entries(d)) {
        if (["tests_accepted", "tests_required"].includes(k)) {
          if (!Number.isInteger(x) || Number(x) < 0 || Number(x) > 10000)
            invalid(k, "Enter a bounded whole count.");
        } else if (
          [
            "backup_available",
            "identity_verified",
            "restore_verified",
          ].includes(k)
        ) {
          if (typeof x !== "boolean") invalid(k, "Choose yes or no.");
        } else if (["planned_on", "delivered_on"].includes(k)) {
          if (x !== null) dateOnly(x, k);
        } else narrative(x, k, 4000);
      }
      v = d;
    } else if (key.endsWith("_id") || key === "id" || key === "correction_of")
      v =
        value === null &&
        [
          "source_id",
          "commissioning_id",
          "facility_id",
          "asset_id",
          "correction_of",
        ].includes(key)
          ? null
          : uuid(value, key);
    else if (["required", "mandatory", "eligible"].includes(key)) {
      if (typeof value !== "boolean") invalid(key, "Choose yes or no.");
      v = value;
    } else if (key === "source_expected_version") v = version(value);
    else if (key === "due") v = value === null ? null : dateOnly(value, key);
    else if (key === "response_time")
      v =
        value === null
          ? null
          : raw.time_precision === "Date"
            ? dateOnly(value, key)
            : instant(value, key);
    else if (key === "kind")
      v = choice(value, key, [
        "Technical",
        "Training",
        "Manual",
        "Backup",
        "Warranty",
        "Commercial",
        "Hold",
      ] as const);
    else if (key === "gate")
      v = choice(value, key, [
        "Technical",
        "Handover",
        "Closeout",
        "Commercial",
      ] as const);
    else if (key === "availability")
      v = choice(value, key, [
        "Current",
        "Changed",
        "Unavailable",
        "Restricted",
        "Not checked",
      ] as const);
    else if (key === "audience")
      v = choice(value, key, ["Customer", "Service"] as const);
    else if (key === "time_precision")
      v = choice(value, key, ["Instant", "Date", "Unknown"] as const);
    else if (key === "outcome")
      v = choice(
        value,
        key,
        action === "source"
          ? [
              "Satisfied",
              "Outstanding",
              "Blocked",
              "Cannot assess",
              "Not required",
            ]
          : action === "commercial"
            ? ["Complete", "Outstanding", "Disputed", "Not required"]
            : [
                "Accepted",
                "With conditions",
                "Reservations",
                "Declined",
                "Disputed",
                "Returned",
                "Received",
              ],
      );
    else
      v = [
        "title",
        "reference",
        "public_reference",
        "system_name",
        "function_name",
        "installed_at",
        "configuration_version",
        "source_version",
      ].includes(key)
        ? label(value, key, 200)
        : narrative(value, key, 4000);
    Object.assign(fields, { [key]: v });
  }
  if (
    action === "response" &&
    (fields.time_precision === "Unknown") !== (fields.response_time === null)
  )
    invalid(
      "response_time",
      "Unknown precision has no response time; known precision requires its actual time.",
    );
  if (
    fields.due &&
    !fields.due_basis &&
    !["request", "create", "edit"].includes(action)
  )
    invalid("due_basis", "Record the meaning of the due date.");
  return {
    ...common(top),
    action,
    project_id: uuid(top.project_id, "project_id"),
    stage_id: top.stage_id ? uuid(top.stage_id, "stage_id") : null,
    expected_version: version(top.expected_version),
    facts_hash: top.facts_hash ? label(top.facts_hash, "facts_hash", 64) : null,
    fields,
  };
}
export type Command = ReturnType<typeof parseCommand>;
