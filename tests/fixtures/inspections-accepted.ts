import type { loadServiceInspections } from "../../src/inspections/service-context";
import type { CheckDefinition } from "../../src/inspections/model";

// Presentation-only synthetic story from the accepted design. Database and HTTP
// suites separately prove permissions, receipt recovery, evaluation and issue.
export const inspectionVisitId = "f1030000-0000-4000-8000-000000000052";
const id = (n: number) =>
  `f1030000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const instant = "2026-10-15T00:31:00.000Z";
const hash = "a".repeat(64);
export function acceptedInspectionFixture(
  actor: string,
  state:
    | "draft"
    | "failed"
    | "review"
    | "returned"
    | "accepted"
    | "not-attending" = "draft",
) {
  const checks: CheckDefinition[] = [
    {
      key: "isolation",
      name: "Isolation confirmed",
      check_type: "Qualitative",
      qualitative: { choices: ["Pass", "Fail"], accepted: ["Pass"] },
    },
    {
      key: "insulation",
      name: "Insulation resistance, phase to earth",
      check_type: "Numeric",
      numeric: {
        unit: "MΩ",
        precision: 1,
        lower: "1",
        lower_inclusive: true,
        upper: null,
        upper_inclusive: true,
        conversions: [],
      },
    },
    {
      key: "torque",
      name: "Holding torque at full travel",
      check_type: "Numeric",
      numeric: {
        unit: "N·m",
        precision: 1,
        lower: null,
        lower_inclusive: true,
        upper: "12",
        upper_inclusive: true,
        conversions: [],
      },
    },
    {
      key: "seal",
      name: "Gearbox seal condition",
      check_type: "Qualitative",
      qualitative: {
        choices: ["Clear", "Weeping", "Damaged"],
        accepted: ["Clear"],
      },
    },
  ].map((x) => ({
    required: true,
    numeric: null,
    qualitative: null,
    condition: null,
    evidence_min: 0,
    instrument_required: x.check_type === "Numeric",
    scope_key: null,
    witness: "None",
    criterion_source_id: null,
    ...x,
  })) as CheckDefinition[];
  const instruments = [
    {
      id: id(11),
      reference: "SYN-TW-011",
      measurement_type: "Torque",
      measurement_range: "0–50",
      measurement_unit: "N·m",
      valid_from: "2026-02-02",
      valid_to: "2027-02-02",
      certificate_reference: "SYN-CERT-TW011",
      certificate_revision: "1",
    },
    {
      id: id(2),
      reference: "SYN-MEG-002",
      measurement_type: "Insulation resistance",
      measurement_range: "0–200",
      measurement_unit: "MΩ",
      valid_from: "2026-01-01",
      valid_to: "2027-01-01",
      certificate_reference: "SYN-CERT-MEG002",
      certificate_revision: "1",
    },
  ];
  const draft = ["draft", "failed", "not-attending"].includes(state);
  const result = (
    key: string,
    value: string | null,
    choice: string | null,
    evaluation: string,
    unit: string | null,
  ) => ({
    id: id(100 + checks.findIndex((d) => d.key === key)),
    attempt_id: id(102),
    check_key: key,
    entry_state: "Recorded",
    raw_value: value,
    choice,
    unit,
    evaluation,
    evaluation_reason: null,
    reason: null,
    note: null,
    rule_version: "synthetic-visual-fixture",
  });
  const results = [
    result("isolation", null, "Pass", "Pass", null),
    result("insulation", "48", null, "Pass", "MΩ"),
  ];
  if (state !== "draft" && state !== "not-attending")
    results.push(
      result(
        "torque",
        state === "failed" || state === "returned" ? "13.4" : "11.2",
        null,
        state === "failed" || state === "returned" ? "Fail" : "Pass",
        "N·m",
      ),
      result("seal", null, "Clear", "Pass", null),
    );
  const review =
    state === "accepted"
      ? "Accepted"
      : state === "returned"
        ? "Returned"
        : "InReview";
  const attempt = {
    row: {
      id: id(102),
      host_type: "ServiceAppointment",
      host_id: inspectionVisitId,
      attempt_number: 2,
      predecessor_id: id(101),
      state: draft ? "Draft" : "Submitted",
      reading_instrument_version: 1,
      plan: checks,
      check_keys: checks.map((d) => d.key),
      plan_source: { reference: "SYN-SVC-INS-04 v1", hash },
      scope_keys: [],
      performer_id: draft ? actor : id(31),
      performer_name: "Riley Tran",
      occurred_at: instant,
      submitted_at: draft ? null : instant,
      updated_at: instant,
      version: 3,
      findings: "Gearbox seal replaced before this retest.",
      content_hash: hash,
      submitted_hash: draft ? null : hash,
      configuration_reference: "Shade screen motor M-4 · config v3",
      timezone: "Australia/Brisbane",
    },
    results,
    binding: {
      attempt_id: id(102),
      template_id: id(4),
      asset_id: id(40),
      scope_item_id: id(41),
      binding_hash: hash,
      snapshot: {
        asset: {
          display_number: "Shade screen motor M-4",
          description: "Config v3 · MCC-4 lock and tag",
        },
      },
    },
    reading_instruments: [
      { attempt_id: id(102), check_key: "insulation", instrument_id: id(2) },
      ...(!draft || state === "failed"
        ? [{ attempt_id: id(102), check_key: "torque", instrument_id: id(11) }]
        : []),
    ],
    instruments: instruments.map((i) => ({
      instrument_id: i.id,
      snapshot: {
        ...i,
        calibration_reference: i.certificate_reference,
        calibration_version: 1,
      },
      live: i,
      assessment: "ValidAtUse",
      reason: null,
      expired_today: false,
    })),
    evidence: [
      {
        id: id(81),
        label: "Insulation tester display.png",
        state: "Complete",
        access_class: "Internal",
        added_by_name: "Riley Tran",
        check_key: "insulation",
        content_hash: hash,
      },
    ],
    reviews:
      state === "accepted" || state === "returned"
        ? [
            {
              id: id(91),
              decision: review,
              reason: "Readings and retained evidence independently reviewed.",
              decided_by_name: "Sasha Cole",
              decided_at: "2026-10-15T01:24:00.000Z",
            },
          ]
        : [],
    review: draft ? "NotSubmitted" : review,
    defects: [],
    applicability: "Current",
    applicability_reasons: [],
  };
  const original = {
    ...structuredClone(attempt),
    row: {
      ...attempt.row,
      id: id(101),
      attempt_number: 1,
      predecessor_id: null,
      state: "Submitted",
      performer_id: id(30),
      performer_name: "Casey Ward",
      submitted_at: instant,
      submitted_hash: hash,
    },
    review: "Returned",
    results: [
      result("isolation", null, "Pass", "Pass", null),
      result("insulation", "48", null, "Pass", "MΩ"),
      result("torque", "13.4", null, "Fail", "N·m"),
      result("seal", null, "Clear", "Pass", null),
    ],
    reviews: [
      {
        id: id(90),
        decision: "Returned",
        reason: "Holding torque exceeds the 12 N·m limit. Correct and retest.",
        decided_by_name: "Sasha Cole",
        decided_at: instant,
      },
    ],
  };
  return {
    actor_id: actor,
    mode: draft ? "capture" : "review",
    appointment: {
      id: inspectionVisitId,
      display_number: "SYN-PPO-APT-000052",
      site_timezone: "Australia/Brisbane",
      start_at: "2026-10-14T22:00:00.000Z",
      status: "InProgress",
    },
    work_order: {
      id: id(40),
      display_number: "SYN-PPO-WO-000040",
      status: "Authorised",
    },
    catalogue: [
      {
        id: id(4),
        title: "Drive motor insulation and torque",
        revision: 1,
        checks,
      },
    ],
    targets: [],
    instruments,
    attempts:
      state === "returned"
        ? [original]
        : state === "not-attending"
          ? [
              {
                ...attempt,
                results: [],
                reading_instruments: [],
                instruments: [],
                evidence: [],
                row: {
                  ...attempt.row,
                  attempt_number: 1,
                  predecessor_id: null,
                  occurred_at: null,
                  findings: null,
                },
              },
            ]
          : [original, attempt],
    defects: [
      {
        id: id(19),
        reference: "SYN-DEF-000019",
        title: "Holding torque above limit",
        source_attempt_id: id(101),
        check_key: "torque",
        state: state === "accepted" ? "Closed" : "CorrectionRecorded",
        owner_id: id(31),
        owner_name: "Riley Tran",
        due: "2026-10-15",
        activity_id: id(71),
        activity: { status: "Completed" },
        correction_note:
          "Gearbox seal replaced at 10:20. Fresh retest required.",
        version: 2,
        closed_by_attempt_id: state === "accepted" ? id(102) : null,
      },
    ],
    links: [{ attempt_id: id(102), defect_id: id(19) }],
    events: [],
    outputs: [],
    incident_holds: [],
    capture_gate:
      state === "not-attending"
        ? "You are not recorded as attending this visit. Open My jobs and record your attendance before you test."
        : null,
    can_review: true,
    can_issue: true,
    preparations:
      state === "accepted"
        ? [
            {
              id: id(99),
              attempt_id: id(102),
              review_id: id(91),
              manifest_hash: hash,
              decision_reason:
                "Reviewed internal inspection outcome for this procedure and equipment only.",
              bundle: { html_sha256: hash, pdf_sha256: "b".repeat(64) },
            },
          ]
        : [],
  } as unknown as Awaited<ReturnType<typeof loadServiceInspections>>;
}
