import { createHash } from "node:crypto";
import { canonical } from "../platform/operations";
import {
  choice,
  dateOnly,
  invalid,
  narrative,
  object,
  optionalId,
  optionalNarrative,
  uuid,
  version,
} from "../shared/validation";
import type { DiscoveryScope } from "./discovery";
import {
  configurationDefinition,
  configurationFields,
  equipmentFamilies,
  requiredSystemFields,
  type Configuration,
  type DiscoveryFinding,
  type OwnedUnknown,
  type ScopeState,
  type Lineage,
} from "./configuration-definition";
const digest = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
const states = ["Answered", "Confirmed", "Unknown", "Assumed"] as const;
const list = (value: unknown, field: string, max: number): unknown[] => {
  if (!Array.isArray(value) || value.length > max)
    invalid(field, `Use at most ${max} entries; nothing is truncated.`);
  return value;
};
function ids(value: unknown, field: string, max: number, allowed?: string[]) {
  const result = list(value, field, max)
    .map((v) => uuid(v, field))
    .sort();
  if (
    new Set(result).size !== result.length ||
    (allowed && result.some((id) => !allowed.includes(id)))
  )
    invalid(field, "Use distinct IDs belonging to this saved scope.");
  return result;
}
function owner(value: unknown, field: string): OwnedUnknown | null {
  if (value == null) return null;
  const r = object(value, ["owner_id", "reason"]);
  return {
    owner_id: uuid(r.owner_id, `${field}.owner_id`),
    reason: narrative(r.reason, `${field}.reason`, 1000),
  };
}
function stateOwner(
  state: ScopeState,
  follow: OwnedUnknown | null,
  field: string,
) {
  if (state === "Confirmed" ? follow !== null : !follow)
    invalid(
      field,
      "Confirmed facts have no unresolved owner; other states require an eligible owner and reason.",
    );
}
function entity(r: Record<string, unknown>) {
  let lineage: Lineage = null;
  if (r.lineage != null) {
    const l = object(r.lineage, ["revision_id", "entity_id"]);
    lineage = {
      revision_id: uuid(l.revision_id, "lineage.revision_id"),
      entity_id: uuid(l.entity_id, "lineage.entity_id"),
    };
  }
  return { id: uuid(r.id, "configuration.id"), lineage };
}
export function parseConfiguration(
  value: unknown,
  scope: DiscoveryScope,
): Configuration {
  const r = object(value, [
    "schema_version",
    "definition_id",
    "areas",
    "systems",
    "facts",
    "evidence",
    "responsibilities",
    "follow_ups",
  ]);
  if (r.schema_version !== 1 || r.definition_id !== configurationDefinition)
    invalid(
      "configuration.schema_version",
      "This configuration definition is unsupported; preserve the recorded source.",
    );
  const evidence = list(r.evidence, "configuration.evidence", 120).map((v) => {
    const e = object(v, [
      "id",
      "lineage",
      "source_type",
      "source_id",
      "source_version",
      "observation",
      "observed_on",
      "note",
    ]);
    const source_type = choice(e.source_type, "evidence.source_type", [
      "Manual",
      "Asset",
      "Facility",
      "Site",
    ] as const);
    const source_id = optionalId(e.source_id, "evidence.source_id"),
      source_version =
        e.source_version == null ? null : version(e.source_version);
    const permitted =
      source_type === "Asset"
        ? scope.equipment_ids
        : source_type === "Facility"
          ? scope.facility_ids
          : [scope.site_id];
    if (
      source_type === "Manual"
        ? source_id !== null || source_version !== null
        : !source_id || !source_version || !permitted.includes(source_id)
    )
      invalid(
        "evidence.source_id",
        "Use an explicit native reference in scope, or attributed manual evidence without invented IDs or versions.",
      );
    return {
      ...entity(e),
      source_type,
      source_id,
      source_version,
      observation: narrative(e.observation, "evidence.observation", 1000),
      observed_on: dateOnly(e.observed_on, "evidence.observed_on"),
      note: optionalNarrative(e.note, "evidence.note", 500),
    };
  });
  const evidenceIds = evidence.map((e) => e.id);
  const areas = list(r.areas, "configuration.areas", 20).map((v) => {
    const a = object(v, [
      "id",
      "lineage",
      "label",
      "facility_id",
      "purpose",
      "use",
      "stage",
      "source",
      "evidence_ids",
      "state",
      "follow_up",
    ]);
    const facility_id = optionalId(a.facility_id, "area.facility_id"),
      state = choice(a.state, "area.state", states),
      follow_up = owner(a.follow_up, "area.follow_up");
    if (facility_id && !scope.facility_ids.includes(facility_id))
      invalid(
        "area.facility_id",
        "Select a Facility explicitly belonging to this scope.",
      );
    stateOwner(state, follow_up, "area.follow_up");
    const purpose = choice(a.purpose, "area.purpose", [
      "Growing",
      "Ancillary",
      "Unknown",
    ] as const);
    if (purpose === "Unknown" && state === "Confirmed")
      invalid("area.purpose", "An unknown purpose cannot be confirmed.");
    return {
      ...entity(a),
      label: narrative(a.label, "area.label", 100),
      facility_id,
      purpose,
      use: optionalNarrative(a.use, "area.use", 500),
      stage: optionalNarrative(a.stage, "area.stage", 100),
      source: narrative(a.source, "area.source", 500),
      evidence_ids: ids(a.evidence_ids, "area.evidence_ids", 120, evidenceIds),
      state,
      follow_up,
    };
  });
  const areaIds = areas.map((a) => a.id);
  const systems = list(r.systems, "configuration.systems", 40).map((v) => {
    const s = object(v, [
        "id",
        "lineage",
        "name",
        "family",
        "type",
        "intent",
        "proposed_work",
        "coverage",
        "equipment_ids",
        "evidence_ids",
      ]),
      c = object(s.coverage, [
        "mode",
        "area_ids",
        "source",
        "reason",
        "follow_up",
      ]);
    const mode = choice(c.mode, "coverage.mode", [
        "Defined",
        "NotAreaSpecific",
        "Unknown",
      ] as const),
      area_ids = ids(c.area_ids, "coverage.area_ids", 20, areaIds),
      source = optionalNarrative(c.source, "coverage.source", 500),
      reason = optionalNarrative(c.reason, "coverage.reason", 500),
      follow_up = owner(c.follow_up, "coverage.follow_up");
    if (
      mode === "Defined"
        ? !area_ids.length || reason !== null || follow_up !== null
        : area_ids.length ||
          !reason ||
          (mode === "Unknown" ? !follow_up : !source || follow_up !== null)
    )
      invalid(
        "coverage",
        "Define explicit area membership, attributed non-area scope, or an owned unknown without area IDs.",
      );
    return {
      ...entity(s),
      name: narrative(s.name, "system.name", 100),
      family: choice(
        s.family,
        "system.family",
        equipmentFamilies.map((f) => f.id),
      ),
      type: narrative(s.type, "system.type", 100),
      intent: choice(s.intent, "system.intent", [
        "New",
        "Retain",
        "RetainExpand",
      ] as const),
      proposed_work: narrative(s.proposed_work, "system.proposed_work", 1000),
      coverage: { mode, area_ids, source, reason, follow_up },
      equipment_ids: ids(
        s.equipment_ids,
        "system.equipment_ids",
        100,
        scope.equipment_ids,
      ),
      evidence_ids: ids(
        s.evidence_ids,
        "system.evidence_ids",
        120,
        evidenceIds,
      ),
    };
  });
  const systemIds = systems.map((s) => s.id);
  const facts = list(r.facts, "configuration.facts", 160).map((v) => {
    const f = object(v, [
      "id",
      "lineage",
      "system_id",
      "field",
      "role",
      "value",
      "unit",
      "state",
      "source",
      "evidence_ids",
      "follow_up",
    ]);
    const system_id = uuid(f.system_id, "fact.system_id"),
      field = choice(
        f.field,
        "fact.field",
        configurationFields.map((f) => f.id),
      ),
      definition = configurationFields.find((d) => d.id === field)!,
      state = choice(f.state, "fact.state", states),
      follow_up = owner(f.follow_up, "fact.follow_up");
    if (!systemIds.includes(system_id))
      invalid(
        "fact.system_id",
        "A fact belongs to one system in this proposal.",
      );
    const unit = choice(f.unit, "fact.unit", [definition.unit]),
      role = choice(f.role, "fact.role", [
        "Requirement",
        "Observation",
        "Capability",
        "Assumption",
      ] as const);
    stateOwner(state, follow_up, "fact.follow_up");
    let factValue: string | number | null = null;
    if (state === "Unknown") {
      if (f.value !== null)
        invalid("fact.value", "An unknown has no invented value.");
    } else if (definition.type === "Integer") {
      if (
        !Number.isSafeInteger(f.value) ||
        Number(f.value) < 1 ||
        Number(f.value) > definition.max
      )
        invalid(
          "fact.value",
          `Enter 1–${definition.max} ${unit}; blank is not zero.`,
        );
      factValue = Number(f.value);
    } else factValue = narrative(f.value, "fact.value", definition.max);
    if (role === "Assumption" && state === "Confirmed")
      invalid(
        "fact.state",
        "An assumption cannot be a confirmed requirement or capability.",
      );
    return {
      ...entity(f),
      system_id,
      field,
      role,
      value: factValue,
      unit,
      state,
      source: narrative(f.source, "fact.source", 500),
      evidence_ids: ids(f.evidence_ids, "fact.evidence_ids", 120, evidenceIds),
      follow_up,
    };
  });
  if (
    new Set(facts.map((f) => `${f.system_id}:${f.field}`)).size !== facts.length
  )
    invalid("configuration.facts", "Each field belongs to its system once.");
  const responsibilities = list(
    r.responsibilities,
    "configuration.responsibilities",
    80,
  ).map((v) => {
    const i = object(v, [
      "id",
      "lineage",
      "area_ids",
      "system_ids",
      "work",
      "participation",
      "party",
      "requested_on",
      "source",
      "state",
      "follow_up",
    ]);
    const state = choice(i.state, "responsibility.state", states),
      follow_up = owner(i.follow_up, "responsibility.follow_up"),
      party = choice(i.party, "responsibility.party", [
        "PPO",
        "Customer",
        "Supplier",
        "Unknown",
      ] as const);
    stateOwner(state, follow_up, "responsibility.follow_up");
    if (party === "Unknown" && state === "Confirmed")
      invalid("responsibility.party", "An unknown party cannot be confirmed.");
    return {
      ...entity(i),
      area_ids: ids(i.area_ids, "responsibility.area_ids", 20, areaIds),
      system_ids: ids(i.system_ids, "responsibility.system_ids", 40, systemIds),
      work: narrative(i.work, "responsibility.work", 1000),
      participation: choice(i.participation, "responsibility.participation", [
        "Included",
        "Excluded",
        "Optional",
      ] as const),
      party,
      requested_on:
        i.requested_on == null
          ? null
          : dateOnly(i.requested_on, "responsibility.requested_on"),
      source: narrative(i.source, "responsibility.source", 500),
      state,
      follow_up,
    };
  });
  const follow_ups = list(r.follow_ups, "configuration.follow_ups", 160).map(
    (v) => {
      const f = object(v, [
          "id",
          "lineage",
          "owner_id",
          "reason",
          "due_on",
          "fact_id",
          "activity_id",
        ]),
        fact_id = optionalId(f.fact_id, "follow_up.fact_id");
      if (fact_id && !facts.some((f) => f.id === fact_id))
        invalid("follow_up.fact_id", "Link a fact in this proposal.");
      return {
        ...entity(f),
        owner_id: uuid(f.owner_id, "follow_up.owner_id"),
        reason: narrative(f.reason, "follow_up.reason", 1000),
        due_on:
          f.due_on == null ? null : dateOnly(f.due_on, "follow_up.due_on"),
        fact_id,
        activity_id: optionalId(f.activity_id, "follow_up.activity_id"),
      };
    },
  );
  const arrays = [
    areas,
    systems,
    facts,
    evidence,
    responsibilities,
    follow_ups,
  ];
  const allIds = arrays.flatMap((a) => a.map((e) => e.id));
  if (new Set(allIds).size !== allIds.length)
    invalid(
      "configuration.id",
      "Every entity in this configuration needs an independent ID.",
    );
  for (const a of arrays) a.sort((a, b) => a.id.localeCompare(b.id));
  return {
    schema_version: 1,
    definition_id: configurationDefinition,
    areas,
    systems,
    facts,
    evidence,
    responsibilities,
    follow_ups,
  };
}
export function configurationFindings(
  config: Configuration,
): DiscoveryFinding[] {
  const findings: DiscoveryFinding[] = [];
  const add = (
    entity_id: string,
    field: string,
    step: DiscoveryFinding["step"],
    message: string,
  ) =>
    findings.push({
      key: `${entity_id}:${field}`,
      category: "Readiness",
      step,
      entity_id,
      field,
      message,
      action: "ReviewField",
    });
  for (const a of config.areas)
    if (a.state !== "Confirmed")
      add(a.id, "state", "Requirements", `Confirm area — ${a.label}`);
  for (const s of config.systems) {
    if (s.coverage.mode === "Unknown")
      add(s.id, "coverage", "Configuration", `Confirm coverage — ${s.name}`);
    for (const field of requiredSystemFields(s)) {
      const f = config.facts.find(
          (f) => f.system_id === s.id && f.field === field,
        ),
        d = configurationFields.find((f) => f.id === field)!;
      if (!f || f.state !== "Confirmed" || f.role !== d.role)
        add(
          s.id,
          field,
          "Configuration",
          `${field === "VerifiedCapacity" ? "Confirm controller capacity" : field === "EquipmentModel" ? "Confirm existing sensor model" : "Confirm supply description"} — ${s.name}`,
        );
    }
  }
  for (const r of config.responsibilities)
    if (r.state !== "Confirmed")
      add(
        r.id,
        "party",
        "Scope & delivery",
        `Confirm responsibility — ${r.work}`,
      );
  return findings.sort((a, b) => a.key.localeCompare(b.key));
}
export function configurationOwners(config: Configuration) {
  return [
    ...config.areas.map((a) => a.follow_up),
    ...config.systems.map((s) => s.coverage.follow_up),
    ...config.facts.map((f) => f.follow_up),
    ...config.responsibilities.map((r) => r.follow_up),
    ...config.follow_ups,
  ].filter((x): x is OwnedUnknown => x !== null);
}
export function configurationConfirmations(
  config: Configuration | undefined,
  previous: Configuration | undefined,
  contextHash: string,
) {
  if (!config) return [];
  const entities = [
      ...config.areas,
      ...config.facts,
      ...config.responsibilities,
    ],
    old = previous
      ? [...previous.areas, ...previous.facts, ...previous.responsibilities]
      : [];
  const basis = (
    e: (typeof entities)[number] | undefined,
    c: Configuration | undefined,
  ) =>
    !e || !c
      ? null
      : {
          entity: e,
          evidence:
            "evidence_ids" in e
              ? c.evidence.filter((v) => e.evidence_ids.includes(v.id))
              : [],
          system:
            "system_id" in e
              ? c.systems.find((s) => s.id === e.system_id)
              : null,
        };
  return entities
    .filter(
      (e) =>
        e.state === "Confirmed" &&
        canonical(basis(e, config)) !==
          canonical(
            basis(
              old.find((o) => o.id === e.id),
              previous,
            ),
          ),
    )
    .map((e) => ({
      fact_id: e.id,
      fingerprint: digest({
        definition: config.definition_id,
        basis: basis(e, config),
        context_hash: contextHash,
      }),
    }))
    .sort((a, b) => a.fact_id.localeCompare(b.fact_id));
}
export function copyConfiguration(
  config: Configuration,
  sourceRevision: string,
  allocation: string,
  follow: OwnedUnknown,
): Configuration {
  uuid(allocation, "copy_allocation_id");
  const mapping = new Map<string, string>();
  for (const e of [
    ...config.areas,
    ...config.systems,
    ...config.facts,
    ...config.evidence,
    ...config.responsibilities,
    ...config.follow_ups,
  ]) {
    const h = digest({
      definition: configurationDefinition,
      sourceRevision,
      allocation,
      entity: e.id,
    });
    mapping.set(
      e.id,
      `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`,
    );
  }
  const remap = (ids: string[]) => ids.map((id) => mapping.get(id)!);
  const base = <T extends { id: string; lineage: Lineage }>(e: T) => ({
    ...e,
    id: mapping.get(e.id)!,
    lineage: { revision_id: sourceRevision, entity_id: e.id },
  });
  const unconfirm = <
    T extends { state: ScopeState; follow_up: OwnedUnknown | null },
  >(
    e: T,
  ) =>
    e.state === "Confirmed"
      ? { ...e, state: "Answered" as const, follow_up: follow }
      : e;
  return {
    ...config,
    areas: config.areas.map((e) =>
      unconfirm({ ...base(e), evidence_ids: remap(e.evidence_ids) }),
    ),
    systems: config.systems.map((e) => ({
      ...base(e),
      coverage: { ...e.coverage, area_ids: remap(e.coverage.area_ids) },
      evidence_ids: remap(e.evidence_ids),
    })),
    facts: config.facts.map((e) =>
      unconfirm({
        ...base(e),
        system_id: mapping.get(e.system_id)!,
        evidence_ids: remap(e.evidence_ids),
      }),
    ),
    evidence: config.evidence.map(base),
    responsibilities: config.responsibilities.map((e) =>
      unconfirm({
        ...base(e),
        area_ids: remap(e.area_ids),
        system_ids: remap(e.system_ids),
      }),
    ),
    follow_ups: config.follow_ups.map((e) => ({
      ...base(e),
      fact_id: e.fact_id ? mapping.get(e.fact_id)! : null,
    })),
  };
}
