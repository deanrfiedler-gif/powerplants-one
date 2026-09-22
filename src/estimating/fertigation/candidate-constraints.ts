import type { Scope, Calculation, Result, ResultState } from "./types";
export const constraintEdition = "PPO-FERT-CONSTRAINT-TRACE-r01";
export type CandidateConstraint = {
  id: string;
  constraint: string;
  required: {
    value: number | string | null;
    unit: string;
    state: ResultState;
    basis: string;
  };
  capability: {
    minimum: number | null;
    maximum: number | null;
    value: string | null;
    unit: string;
    claim: "User-entered; unverified";
    conditions: string;
  };
  status:
    | "not_assessable"
    | "outside_entered_limits"
    | "within_entered_check_confirmation_pending";
  applicability: string;
  sources: {
    id: string;
    label: string;
    reference: string;
    source_revision: string;
    sha256: string | null;
    attribution: string;
    applicability: string;
    captured_date: string | null;
  }[];
  next_action: string;
};
/** A bounded trace over an exact scope/result pair. It never upgrades the saved
 * engine summary or turns entered/document-labelled limits into confirmation. */
export function candidateConstraints(
  scope: Scope,
  calculation: Calculation,
  candidateId: string,
  offset = 0,
  limit = 50,
) {
  const candidate = scope.candidates.find((c) => c.id === candidateId),
    summary = calculation.candidates.find((c) => c.id === candidateId);
  if (!candidate || !summary) return null;
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    throw Error("Use a bounded constraint page.");
  const evidence = new Map(scope.evidence.map((e) => [e.id, e])),
    scenario = scope.scenarios.find((s) => s.id === calculation.scenario_id);
  const applicable = `${candidate.family}; ${candidate.variant || "variant unknown"}; ${candidate.arrangement || "arrangement unknown"}; ${scope.production_context.application_method}; ${scope.production_context.hydraulic_arrangement}`;
  const sourceRows = (ids: (string | null)[]) =>
    [...new Set(ids.filter((v): v is string => !!v))].flatMap((id) => {
      const e = evidence.get(id);
      return e
        ? [
            {
              id: e.id,
              label: e.label,
              reference: e.reference,
              source_revision: e.source_revision,
              sha256: e.sha256,
              attribution: e.attribution,
              applicability: e.applicability,
              captured_date: e.captured_date,
            },
          ]
        : [];
    });
  const numeric = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);
  const rows: CandidateConstraint[] = [];
  let total = 0;
  const add = (factory: () => CandidateConstraint) => {
    const index = total++;
    if (index >= offset && index < offset + limit) rows.push(factory());
  };
  const range = (
    id: string,
    name: string,
    need: Result,
    min: number | null,
    max: number | null,
    conditions: string,
    ids: (string | null)[],
    next: string,
    conditionsComplete = true,
  ) => {
    add(() => ({
      id,
      constraint: name,
      required: {
        value: need.value,
        unit: need.unit,
        state: need.state,
        basis:
          need.reason ||
          `Saved ${calculation.edition}; ${need.dependencies.join(", ")}`,
      },
      capability: {
        minimum: min,
        maximum: max,
        value: null,
        unit: need.unit,
        claim: "User-entered; unverified",
        conditions,
      },
      status:
        (numeric(min) && numeric(max) && min > max) ||
        (need.state === "known" &&
          numeric(need.value) &&
          ((numeric(min) && need.value < min) ||
            (numeric(max) && need.value > max)))
          ? "outside_entered_limits"
          : need.state === "known" &&
              numeric(need.value) &&
              numeric(min) &&
              numeric(max) &&
              conditionsComplete
            ? "within_entered_check_confirmation_pending"
            : "not_assessable",
      applicability: applicable,
      sources: sourceRows(ids),
      next_action: next,
    }));
  };
  const note = (
    id: string,
    name: string,
    required: string,
    value: string | null,
    conditions: string,
    ids: (string | null)[],
    next: string,
  ) =>
    add(() => ({
      id,
      constraint: name,
      required: {
        value: required,
        unit: "configuration",
        state: "known",
        basis: `Scope requirements; ${calculation.edition}`,
      },
      capability: {
        minimum: null,
        maximum: null,
        value,
        unit: "configuration",
        claim: "User-entered; unverified",
        conditions,
      },
      status: "not_assessable",
      applicability: applicable,
      sources: sourceRows(ids),
      next_action: next,
    }));
  note(
    "configuration",
    "Exact configuration and process applicability",
    `${scope.production_context.tags.join(", ")} / ${scope.production_context.application_method} / ${scope.production_context.hydraulic_arrangement}`,
    `${candidate.variant || "Unknown variant"} / ${candidate.arrangement || "Unknown arrangement"}`,
    candidate.source_revision,
    [candidate.capability_evidence_id],
    "Q01-Q06: obtain exact configured variant, water path and process applicability; retain original supplier attribution and conditions.",
  );
  if (!calculation.group_flows.length)
    range(
      "flow:none",
      "Operating unit flow",
      {
        value: null,
        unit: "m³/h",
        state: "unknown",
        reason: "No assessable operating group selected.",
        dependencies: [],
      },
      candidate.minimum_m3h,
      candidate.maximum_m3h,
      candidate.arrangement,
      [candidate.capability_evidence_id],
      "Select and complete an operating scenario before checking each duty.",
    );
  for (const group of calculation.group_flows)
    range(
      `flow:${group.id}`,
      `Operating unit flow: ${scope.groups.find((g) => g.id === group.id)?.label ?? group.id}`,
      group.unit,
      candidate.minimum_m3h,
      candidate.maximum_m3h,
      candidate.arrangement,
      [candidate.capability_evidence_id],
      "Q01-Q06: confirm stable minimum/maximum flow for this exact configuration and water path.",
    );
  range(
    "pressure",
    `Unit pressure at ${candidate.pressure_boundary.replaceAll("_", " ")}`,
    {
      value:
        candidate.pressure_boundary === "unknown"
          ? null
          : candidate.proposed_pressure_bar,
      unit: "bar",
      state:
        candidate.pressure_boundary === "unknown" ||
        candidate.proposed_pressure_bar === null
          ? "unknown"
          : "known",
      reason:
        "Entered unit-boundary pressure; crop outlet pressure is never substituted.",
      dependencies: [candidate.id],
    },
    candidate.minimum_pressure_bar,
    candidate.maximum_pressure_bar,
    candidate.pressure_boundary,
    [candidate.capability_evidence_id],
    "Q01-Q06: confirm pressure limits and duty at the same named inlet/outlet boundary.",
  );
  for (const need of calculation.injection) {
    const channels = scope.channels.filter(
        (ch) =>
          ch.candidate_id === candidate.id &&
          ch.stock_id === need.stock_id &&
          (ch.phase === "existing" ||
            ch.phase === "proposed" ||
            (ch.phase === "future" && scenario?.include_future)),
      ),
      channel = channels.length === 1 ? channels[0] : null;
    range(
      `injection:${need.group_id}:${need.stock_id}`,
      `Injection: ${scope.stocks.find((s) => s.id === need.stock_id)?.label ?? need.stock_id} / ${scope.groups.find((g) => g.id === need.group_id)?.label ?? need.group_id}`,
      need.required_lph,
      channel?.minimum_lph ?? null,
      channel?.maximum_lph ?? null,
      channel?.conditions ??
        `Exactly one configured channel required; ${channels.length} applicable matches.`,
      [candidate.capability_evidence_id, ...(channel?.evidence_ids ?? [])],
      "Q07-Q10: confirm this channel, stock concentration/suction conditions and stable injection limits for the event.",
      !!channel?.conditions && !!channel.evidence_ids.length,
    );
  }
  const controller = scope.controllers.find(
    (c) => c.id === candidate.controller_id,
  );
  note(
    "controller",
    "Controller, software and licences",
    "Exact supported controller and configured licences",
    controller
      ? `${controller.family}; ${controller.model || "model unknown"}; serial ${controller.serial || "unknown"}; software ${controller.software || "unknown"}; licences ${controller.licences || "unknown"}`
      : null,
    "Entered identity is not a manufacturer compatibility certificate.",
    controller?.evidence_ids ?? [],
    "Q11-Q18: retain exact controller compatibility, software/licences, physical I/O, interlocks and any GroScales requirements.",
  );
  note(
    "pump",
    "Pump and curve pairing",
    scope.hydraulics.pump_model || "Pump model unknown",
    null,
    "A project pump curve is not proof that the candidate includes or supports that exact pump.",
    [scope.hydraulics.curve_evidence_id, candidate.capability_evidence_id],
    "Q01-Q06: identify the configured pump/curve and operating conditions before asserting a pump duty or operating point.",
  );
  note(
    "services",
    "Installation, footprint and services",
    "Confirmed unit dimensions and power/access/services",
    null,
    `Project provisions: ${scope.services.power || "power unknown"}; ${scope.services.access || "access unknown"}`,
    [candidate.capability_evidence_id],
    "Q19-Q22: obtain the exact configured footprint, installation/services, resilience and commissioning requirements.",
  );
  return {
    edition: constraintEdition,
    calculation_edition: calculation.edition,
    candidate_id: candidate.id,
    label: candidate.label,
    summary: summary.status,
    shortlisted: candidate.shortlisted,
    manufacturer_confirmation: "pending" as const,
    technical_review: "not_configured" as const,
    offset,
    limit,
    total,
    rows,
  };
}
