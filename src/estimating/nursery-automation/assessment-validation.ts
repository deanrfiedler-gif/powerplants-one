import {
  choice,
  invalid,
  label,
  object,
  optionalText,
  uuid,
} from "../../shared/validation";
import { parseFact } from "./validation";
import { catalogue } from "./catalogue";
import {
  roles,
  dispositions,
  topologies,
  fitAspects,
  interfaceAspects,
  dimensions,
  type Assessment,
  type Review,
  type Check,
  type StageCase,
} from "./assessment-model";
export const assessmentByteLimit = 262144;
export function boundAssessment(v: unknown) {
  let text: string | undefined;
  try {
    text = JSON.stringify(v);
  } catch {
    invalid("assessment", "Use bounded JSON.");
  }
  if (!text || Buffer.byteLength(text) > assessmentByteLimit)
    invalid(
      "assessment",
      "Technical assessment is limited to 256 KiB; nothing was truncated.",
    );
}
function list(v: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max)
    invalid(field, "Use at most " + max + " entries.");
  return v;
}
function unique(values: string[], field: string) {
  if (new Set(values).size !== values.length)
    invalid(field, "Keep unique stable identities.");
}
function review(v: unknown): Review {
  const r = object(v, ["state", "reviewer"]);
  const state = choice(r.state, "review.state", [
    "Pending",
    "Reviewed",
    "Rejected",
  ] as const);
  const reviewer = optionalText(r.reviewer, "review.reviewer", 120);
  if (state !== "Pending" && !reviewer)
    invalid(
      "review",
      "Name the internal reviewer; this is not manufacturer approval.",
    );
  return { state, reviewer };
}
function checks(v: unknown, aspects: readonly string[]): Check[] {
  const result = list(v, "checks", aspects.length).map((v) => {
    const r = object(v, [
      "aspect",
      "state",
      "source",
      "review",
      "owner",
      "action",
    ]);
    const state = choice(r.state, "check.state", [
      "Unknown",
      "Compatible",
      "Incompatible",
      "NotApplicable",
    ] as const);
    const source = optionalText(r.source, "check.source", 500);
    if (state !== "Unknown" && !source)
      invalid("check.source", "Retain evidence or a reason for this check.");
    return {
      aspect: choice(r.aspect, "check.aspect", aspects),
      state,
      source,
      review: review(r.review),
      owner: optionalText(r.owner, "check.owner", 120),
      action: optionalText(r.action, "check.action", 500),
    };
  });
  unique(
    result.map((c) => c.aspect),
    "checks",
  );
  if (result.length !== aspects.length)
    invalid("checks", "Retain every required check, including unknowns.");
  return result;
}
function boolean(v: unknown, field: string) {
  if (typeof v !== "boolean")
    invalid(field, "Use an explicit boundary choice.");
  return v;
}
function stageCase(v: unknown): StageCase {
  const r = object(v, [
    "stage_id",
    "rate",
    "rate_unit",
    "rate_basis",
    "occupancy",
    "operators",
    "rate_review",
    "limits",
    "checks",
  ]);
  const limits = list(r.limits, "limits", 3).map((v) => {
    const l = object(v, [
      "dimension",
      "minimum",
      "maximum",
      "minimum_inclusive",
      "maximum_inclusive",
      "review",
    ]);
    const dimension = choice(l.dimension, "dimension", dimensions);
    return {
      dimension,
      minimum: parseFact(l.minimum, dimension + ".minimum", "number"),
      maximum: parseFact(l.maximum, dimension + ".maximum", "number"),
      minimum_inclusive: boolean(l.minimum_inclusive, "minimum_inclusive"),
      maximum_inclusive: boolean(l.maximum_inclusive, "maximum_inclusive"),
      review: review(l.review),
    };
  });
  unique(
    limits.map((l) => l.dimension),
    "limits",
  );
  if (limits.length !== 3)
    invalid("limits", "Retain all three dimension checks.");
  return {
    stage_id: uuid(r.stage_id, "stage_id"),
    rate: parseFact(r.rate, "rate", "number"),
    rate_unit: choice(r.rate_unit, "rate_unit", [
      "PotsPerHour",
      "TraysPerHour",
    ] as const),
    rate_basis: choice(r.rate_basis, "rate_basis", [
      "Gross",
      "NetGood",
    ] as const),
    operators: parseFact(r.operators, "operators", "count"),
    occupancy: parseFact(r.occupancy, "occupancy", "count"),
    rate_review: review(r.rate_review),
    limits,
    checks: checks(r.checks, fitAspects),
  };
}
export function parseAssessment(v: unknown): Assessment {
  boundAssessment(v);
  const r = object(v, [
    "schema_version",
    "name",
    "topology",
    "owner",
    "stages",
    "scenarios",
    "connections",
  ]);
  if (r.schema_version !== 1)
    invalid("schema_version", "Use technical assessment schema 1.");
  const stages = list(r.stages, "stages", 20).map((v) => {
    const s = object(v, [
      "id",
      "name",
      "role",
      "phase",
      "disposition",
      "selection",
      "candidate_id",
      "configuration",
      "configuration_evidence",
      "technical_count",
      "installation_count",
      "spare_count",
      "waste_count",
      "pack_size",
      "quantity_review",
    ]);
    return {
      id: uuid(s.id, "stage.id"),
      name: label(s.name, "stage.name", 120),
      role: choice(s.role, "stage.role", roles),
      phase: choice(s.phase, "stage.phase", [
        "Current",
        "Future",
        "Both",
      ] as const),
      disposition: choice(s.disposition, "stage.disposition", dispositions),
      selection: choice(s.selection, "stage.selection", [
        "Base",
        "Selected",
        "Offered",
        "Excluded",
        "Parked",
      ] as const),
      candidate_id:
        s.candidate_id === null
          ? null
          : choice(
              s.candidate_id,
              "candidate_id",
              catalogue.entries.map((e) => e.id),
            ),
      configuration: optionalText(s.configuration, "stage.configuration", 500),
      configuration_evidence: checks(
        [s.configuration_evidence],
        ["ExactConfiguration"],
      )[0],
      technical_count: parseFact(s.technical_count, "technical_count", "count"),
      installation_count: parseFact(
        s.installation_count,
        "installation_count",
        "count",
      ),
      spare_count: parseFact(s.spare_count, "spare_count", "count"),
      waste_count: parseFact(s.waste_count, "waste_count", "count"),
      pack_size: parseFact(s.pack_size, "pack_size", "count"),
      quantity_review: review(s.quantity_review),
    };
  });
  unique(
    stages.map((s) => s.id),
    "stages",
  );
  const stageIds = new Set(stages.map((s) => s.id));
  const scenarios = list(r.scenarios, "scenarios", 20).map((v) => {
    const s = object(v, ["scenario_id", "good_fraction", "stages"]);
    const cases = list(s.stages, "scenario.stages", 20).map(stageCase);
    unique(
      cases.map((c) => c.stage_id),
      "scenario.stages",
    );
    if (cases.some((c) => !stageIds.has(c.stage_id)))
      invalid("stage_id", "Bind an existing stage.");
    const fraction = parseFact(s.good_fraction, "good_fraction", "number");
    for (const value of [
      fraction.value,
      ...fraction.alternatives.map((a) => a.value),
    ])
      if (value !== null && Number(value) > 1)
        invalid("good_fraction", "Use a fraction from zero to one.");
    return {
      scenario_id: uuid(s.scenario_id, "scenario_id"),
      good_fraction: fraction,
      stages: cases,
    };
  });
  unique(
    scenarios.map((s) => s.scenario_id),
    "scenarios",
  );
  const scenarioIds = new Set(scenarios.map((s) => s.scenario_id));
  const connections = list(r.connections, "connections", 40).map((v) => {
    const c = object(v, [
      "id",
      "from_id",
      "to_id",
      "scenario_ids",
      "checks",
      "buffer_positions",
      "downstream_demand_per_minute",
    ]);
    const from_id = uuid(c.from_id, "from_id"),
      to_id = uuid(c.to_id, "to_id");
    if (!stageIds.has(from_id) || !stageIds.has(to_id) || from_id === to_id)
      invalid(
        "connection",
        "Choose two distinct existing stages in the stated direction.",
      );
    const scenario_ids = list(c.scenario_ids, "connection.scenarios", 20).map(
      (v) => uuid(v, "scenario_id"),
    );
    unique(scenario_ids, "connection.scenarios");
    if (scenario_ids.some((id) => !scenarioIds.has(id)))
      invalid("scenario_ids", "Bind existing scenarios.");
    return {
      id: uuid(c.id, "connection.id"),
      from_id,
      to_id,
      scenario_ids,
      checks: checks(c.checks, interfaceAspects),
      buffer_positions: parseFact(
        c.buffer_positions,
        "buffer_positions",
        "count",
      ),
      downstream_demand_per_minute: parseFact(
        c.downstream_demand_per_minute,
        "downstream_demand_per_minute",
        "number",
      ),
    };
  });
  unique(
    connections.map((c) => c.id),
    "connections",
  );
  return {
    schema_version: 1,
    name: label(r.name, "name", 200),
    topology: choice(r.topology, "topology", topologies),
    owner: optionalText(r.owner, "owner", 120),
    stages,
    scenarios,
    connections,
  };
}
