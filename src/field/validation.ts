import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  instant,
  narrative,
  optionalNarrative,
  optionalId,
  invalid,
  exact,
} from "../shared/validation";
export const fieldKinds = [
  "Time",
  "Material",
  "Observation",
  "Reading",
  "Checklist",
  "Photo",
] as const;
export const timeKinds = [
  "Travel",
  "Labour",
  "Break",
  "Waiting",
  "Other",
] as const;
export const materialKinds = [
  "Consumed",
  "Returned",
  "Required",
  "Removed",
] as const;
export const units = [
  "EA",
  "M",
  "M2",
  "M3",
  "L",
  "ML",
  "KG",
  "G",
  "SET",
  "PACK",
] as const;
export const readingUnits = [
  "°C",
  "°F",
  "kPa",
  "bar",
  "Pa",
  "pH",
  "mS/cm",
  "µS/cm",
  "V",
  "A",
  "mm",
  "m",
  "L/min",
  "m3/h",
  "%",
  "rpm",
  "ppm",
  "lux",
  "text",
  "unitless",
] as const;
export const checkPolicy = {
  "SYN-SITE-CONTROLS": {
    label: "Synthetic site controls observed",
    allow_na: false,
    photo_required: true,
    mandatory: true,
  },
  "SYN-TASK-RESULT": {
    label: "Synthetic task result checked",
    allow_na: false,
    photo_required: false,
    mandatory: true,
  },
  "SYN-OPTIONAL-PHOTO": {
    label: "Optional supporting photo",
    allow_na: true,
    photo_required: true,
    mandatory: false,
  },
} as const;
export const checkIds = Object.keys(
  checkPolicy,
) as (keyof typeof checkPolicy)[];
export const authorityKeys = [
  "expected_version",
  "schedule_version",
  "assignment_id",
  "assignment_version",
  "issue_id",
  "issue_hash",
  "scope_revision_id",
  "scope_version",
];
export function hash(v: unknown, name = "sha256") {
  if (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v))
    invalid(name, "Use the exact SHA-256 hash.");
  return v;
}
export function authorityFields(r: Record<string, unknown>) {
  return {
    expected_version: version(r.expected_version),
    schedule_version: version(r.schedule_version),
    assignment_id: uuid(r.assignment_id, "assignment_id"),
    assignment_version: version(r.assignment_version),
    issue_id: uuid(r.issue_id, "issue_id"),
    issue_hash: hash(r.issue_hash, "issue_hash"),
    scope_revision_id: uuid(r.scope_revision_id, "scope_revision_id"),
    scope_version: version(r.scope_version),
  };
}
export function startCommand(id: string, input: unknown) {
  const r = object(input, [...commonKeys, ...authorityKeys, "captured_at"]);
  return {
    ...common(r),
    appointment_id: uuid(id, "appointment_id"),
    ...authorityFields(r),
    captured_at: instant(r.captured_at, "captured_at"),
  };
}
export function bool(v: unknown, name: string) {
  if (typeof v !== "boolean") invalid(name, "Choose Yes or No.");
  return v;
}
export function decimal(v: unknown, name: string, positive = false) {
  if (
    typeof v !== "string" ||
    !/^-?(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,6})?$/.test(v)
  )
    invalid(
      name,
      "Enter an exact decimal with up to 9 whole and 6 fractional digits.",
    );
  const n = Number(v);
  if (positive && n <= 0)
    invalid(
      name,
      "Quantity must be positive; select its direction separately.",
    );
  return n === 0
    ? "0"
    : v.includes(".")
      ? v.replace(/0+$/, "").replace(/\.$/, "")
      : v;
}
export function ids(v: unknown, name: string, max = 30) {
  if (!Array.isArray(v) || v.length > max)
    invalid(name, `Choose no more than ${max} references.`);
  const list = v.map((x) => uuid(x, name)).sort();
  if (new Set(list).size !== list.length)
    invalid(name, "Do not repeat references.");
  return list;
}
export function payload(kind: (typeof fieldKinds)[number], value: unknown) {
  switch (kind) {
    case "Time": {
      const r = object(value, ["time_kind", "start_at", "end_at", "note"]);
      const time_kind = choice(r.time_kind, "time_kind", timeKinds),
        start_at = instant(r.start_at, "start_at"),
        end_at = instant(r.end_at, "end_at"),
        elapsed_seconds = (Date.parse(end_at) - Date.parse(start_at)) / 1000;
      if (
        !Number.isInteger(elapsed_seconds) ||
        elapsed_seconds <= 0 ||
        elapsed_seconds > 172800
      )
        invalid(
          "end_at",
          "Finish must follow start by whole seconds, within 48 hours.",
        );
      const note = ["Waiting", "Other"].includes(time_kind)
        ? narrative(r.note, "note", 2000)
        : optionalNarrative(r.note, "note", 2000);
      return {
        time_kind,
        start_at,
        end_at,
        elapsed_seconds,
        elapsed_minutes: String(elapsed_seconds / 60),
        note,
      };
    }
    case "Material": {
      const r = object(value, [
        "movement_kind",
        "item_reference",
        "description",
        "quantity",
        "uom",
        "lot",
        "serial",
        "source_reference",
        "stock_status",
      ]);
      const item_reference = optionalNarrative(
          r.item_reference,
          "item_reference",
          200,
        ),
        lot = optionalNarrative(r.lot, "lot", 200),
        serial = optionalNarrative(r.serial, "serial", 200);
      if (item_reference === "SYN-PART-LOT" && !lot)
        invalid("lot", "This fictional item requires its lot reference.");
      if (item_reference === "SYN-PART-SERIAL" && !serial)
        invalid("serial", "This fictional item requires its serial reference.");
      const quantity = decimal(r.quantity, "quantity", true);
      if (serial && quantity !== "1")
        invalid(
          "quantity",
          "A serialised item is captured one unit per entry.",
        );
      return {
        movement_kind: choice(r.movement_kind, "movement_kind", materialKinds),
        item_reference,
        description: narrative(r.description, "description", 2000),
        quantity,
        uom: choice(r.uom, "uom", units),
        lot,
        serial,
        source_reference: optionalNarrative(
          r.source_reference,
          "source_reference",
          200,
        ),
        stock_status: choice(r.stock_status, "stock_status", [
          "Unknown",
          "ReviewRequired",
        ] as const),
      };
    }
    case "Observation": {
      const r = object(value, [
        "finding",
        "confidence",
        "attempted_fix",
        "result",
        "follow_up_required",
      ]);
      const attempted_fix = optionalNarrative(
          r.attempted_fix,
          "attempted_fix",
          2000,
        ),
        result = optionalNarrative(r.result, "result", 2000);
      if (attempted_fix && !result)
        invalid(
          "result",
          "Record the result, including an unsuccessful or uncertain result.",
        );
      return {
        finding: narrative(r.finding, "finding", 4000),
        confidence: choice(r.confidence, "confidence", [
          "Reported",
          "Suspected",
          "Verified",
        ] as const),
        attempted_fix,
        result,
        follow_up_required: bool(r.follow_up_required, "follow_up_required"),
      };
    }
    case "Reading": {
      const r = object(value, [
        "name",
        "numeric_value",
        "text_value",
        "unit",
        "context",
      ]);
      if ((r.numeric_value != null) === (r.text_value != null))
        invalid("value", "Provide exactly one numeric or text reading.");
      return {
        name: narrative(r.name, "name", 200),
        numeric_value:
          r.numeric_value == null
            ? null
            : decimal(r.numeric_value, "numeric_value"),
        text_value:
          r.text_value == null
            ? null
            : narrative(r.text_value, "text_value", 1000),
        unit: choice(r.unit, "unit", readingUnits),
        context: narrative(r.context, "context", 2000),
      };
    }
    case "Checklist": {
      const r = object(value, ["check_id", "result", "reason", "evidence_ids"]);
      const check_id = choice(r.check_id, "check_id", checkIds),
        result = choice(r.result, "result", [
          "Pass",
          "Fail",
          "NotPerformed",
          "NotApplicable",
        ] as const);
      if (result === "NotApplicable" && !checkPolicy[check_id].allow_na)
        invalid(
          "result",
          "This synthetic mandatory check cannot be marked Not applicable.",
        );
      const evidence_ids = ids(r.evidence_ids, "evidence_ids");
      if (
        result === "Pass" &&
        checkPolicy[check_id].photo_required &&
        !evidence_ids.length
      )
        invalid(
          "evidence_ids",
          "This check requires a durable photo reference.",
        );
      return {
        check_id,
        result,
        reason:
          result === "Pass"
            ? optionalNarrative(r.reason, "reason", 2000)
            : narrative(r.reason, "reason", 2000),
        evidence_ids,
      };
    }
    case "Photo": {
      const r = object(value, ["attachment_id", "caption"]);
      return {
        attachment_id: uuid(r.attachment_id, "attachment_id"),
        caption: narrative(r.caption, "caption", 2000),
      };
    }
  }
}
export type FieldPayload = ReturnType<typeof payload>;
export const entryKeys = [
  "id",
  "appointment_id",
  "attendance_id",
  "kind",
  "scope_item_id",
  "asset_id",
  "captured_at",
  "payload",
];
export function entryCommand(input: unknown, sourceId?: string) {
  const r = object(input, [
    ...commonKeys,
    ...entryKeys,
    ...(sourceId ? ["expected_version"] : []),
  ]);
  const kind = choice(r.kind, "kind", fieldKinds);
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    appointment_id: uuid(r.appointment_id, "appointment_id"),
    attendance_id: uuid(r.attendance_id, "attendance_id"),
    kind,
    scope_item_id: optionalId(r.scope_item_id, "scope_item_id"),
    asset_id: optionalId(r.asset_id, "asset_id"),
    captured_at: instant(r.captured_at, "captured_at"),
    payload: payload(kind, r.payload),
    source_id: sourceId ? uuid(sourceId, "source_id") : null,
    expected_version: sourceId ? version(r.expected_version) : null,
  };
}
export function attachmentCommand(input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "appointment_id",
    "attendance_id",
    "filename",
    "media_type",
    "byte_count",
    "sha256",
  ]);
  const filename = exact(r.filename, "filename");
  if (
    !/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,95}\.png$/.test(filename) ||
    filename.includes("..")
  )
    invalid(
      "filename",
      "Use a short PNG filename with letters, numbers, spaces, dots, underscores or hyphens.",
    );
  if (
    !Number.isSafeInteger(r.byte_count) ||
    Number(r.byte_count) < 1 ||
    Number(r.byte_count) > 4194304
  )
    invalid("byte_count", "Choose a PNG no larger than 4 MiB.");
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    appointment_id: uuid(r.appointment_id, "appointment_id"),
    attendance_id: uuid(r.attendance_id, "attendance_id"),
    filename,
    media_type: choice(r.media_type, "media_type", ["image/png"] as const),
    byte_count: Number(r.byte_count),
    content_hash: hash(r.sha256),
  };
}
export function completionCommand(id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "attendance_id",
    "expected_version",
    "scope_outcome",
    "work_performed",
    "exclusions",
    "remaining_work",
    "time_declaration",
    "material_declaration",
    "declaration_reason",
    "task_outcomes",
    "entries",
    "required_attachment_ids",
  ]);
  if (!Array.isArray(r.entries) || r.entries.length > 200)
    invalid("entries", "Choose up to 200 exact evidence versions.");
  const entries = r.entries
    .map((v) => {
      const e = object(v, ["id", "version"]);
      return { id: uuid(e.id, "entry_id"), version: version(e.version) };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(entries.map((x) => x.id)).size !== entries.length)
    invalid("entries", "Choose each entry once.");
  if (
    !Array.isArray(r.task_outcomes) ||
    !r.task_outcomes.length ||
    r.task_outcomes.length > 50
  )
    invalid("task_outcomes", "Declare each authorised task outcome.");
  const task_outcomes = r.task_outcomes
    .map((v) => {
      const x = object(v, ["scope_item_id", "outcome", "reason"]);
      return {
        scope_item_id: uuid(x.scope_item_id, "scope_item_id"),
        outcome: choice(x.outcome, "outcome", [
          "Complete",
          "Partial",
          "UnableToProceed",
        ] as const),
        reason: narrative(x.reason, "task_reason", 2000),
      };
    })
    .sort((a, b) => a.scope_item_id.localeCompare(b.scope_item_id));
  if (
    new Set(task_outcomes.map((x) => x.scope_item_id)).size !==
    task_outcomes.length
  )
    invalid("task_outcomes", "Declare each task once.");
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    appointment_id: uuid(id, "appointment_id"),
    attendance_id: uuid(r.attendance_id, "attendance_id"),
    expected_version:
      r.expected_version === 0 ? 0 : version(r.expected_version),
    scope_outcome: choice(r.scope_outcome, "scope_outcome", [
      "Complete",
      "Partial",
      "UnableToProceed",
    ] as const),
    work_performed: narrative(r.work_performed, "work_performed", 4000),
    exclusions: narrative(r.exclusions, "exclusions", 4000),
    remaining_work: narrative(r.remaining_work, "remaining_work", 4000),
    time_declaration: choice(r.time_declaration, "time_declaration", [
      "AllRecorded",
      "None",
      "Incomplete",
    ] as const),
    material_declaration: choice(
      r.material_declaration,
      "material_declaration",
      ["AllRecorded", "None", "Incomplete"] as const,
    ),
    declaration_reason: narrative(
      r.declaration_reason,
      "declaration_reason",
      2000,
    ),
    task_outcomes,
    entries,
    required_attachment_ids: ids(
      r.required_attachment_ids,
      "required_attachment_ids",
    ),
  };
}
