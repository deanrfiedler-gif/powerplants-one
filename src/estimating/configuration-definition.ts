// Captured independently from the immutable ten-question r01 questionnaire.
export const configurationDefinition = "PPO-ES02-CONFIG-r01" as const;
export const equipmentFamilies = [
  { id: "ControlsClimate", label: "Controls & climate" },
  { id: "Fertigation", label: "Fertigation" },
  { id: "MonitoringWeather", label: "Monitoring & weather" },
  { id: "NurseryMachinery", label: "Nursery machinery" },
  { id: "Infrastructure", label: "Shared infrastructure" },
  { id: "Other", label: "Unknown / Other" },
] as const;
export const configurationFields = [
  {
    id: "SupplyDescription",
    label: "Supply description",
    type: "Text",
    unit: "Text",
    role: "Requirement",
    max: 500,
  },
  {
    id: "RequiredZones",
    label: "Customer-required climate zones",
    type: "Integer",
    unit: "Zones",
    role: "Requirement",
    max: 100000,
  },
  {
    id: "VerifiedCapacity",
    label: "Verified controller capacity",
    type: "Integer",
    unit: "Zones",
    role: "Capability",
    max: 100000,
  },
  {
    id: "EquipmentModel",
    label: "Existing equipment model",
    type: "Text",
    unit: "Text",
    role: "Observation",
    max: 200,
  },
  {
    id: "NetworkScope",
    label: "Network scope",
    type: "Text",
    unit: "Text",
    role: "Requirement",
    max: 500,
  },
] as const;
export type Family = (typeof equipmentFamilies)[number]["id"];
export type FactField = (typeof configurationFields)[number]["id"];
export type OwnedUnknown = { owner_id: string; reason: string };
export type ScopeState = "Answered" | "Confirmed" | "Unknown" | "Assumed";
export type Lineage = { revision_id: string; entity_id: string } | null;
type Entity = { id: string; lineage: Lineage };
export type Area = Entity & {
  label: string;
  facility_id: string | null;
  purpose: "Growing" | "Ancillary" | "Unknown";
  use: string | null;
  stage: string | null;
  source: string;
  evidence_ids: string[];
  state: ScopeState;
  follow_up: OwnedUnknown | null;
};
export type Coverage = {
  mode: "Defined" | "NotAreaSpecific" | "Unknown";
  area_ids: string[];
  source: string | null;
  reason: string | null;
  follow_up: OwnedUnknown | null;
};
export type ProposedSystem = Entity & {
  name: string;
  family: Family;
  type: string;
  intent: "New" | "Retain" | "RetainExpand";
  proposed_work: string;
  coverage: Coverage;
  equipment_ids: string[];
  evidence_ids: string[];
};
export type ConfigurationFact = Entity & {
  system_id: string;
  field: FactField;
  role: "Requirement" | "Observation" | "Capability" | "Assumption";
  value: string | number | null;
  unit: "Text" | "Zones";
  state: ScopeState;
  source: string;
  evidence_ids: string[];
  follow_up: OwnedUnknown | null;
};
export type ConfigurationEvidence = Entity & {
  source_type: "Manual" | "Asset" | "Facility" | "Site";
  source_id: string | null;
  source_version: number | null;
  observation: string;
  observed_on: string;
  note: string | null;
};
export type Responsibility = Entity & {
  area_ids: string[];
  system_ids: string[];
  work: string;
  participation: "Included" | "Excluded" | "Optional";
  party: "PPO" | "Customer" | "Supplier" | "Unknown";
  requested_on: string | null;
  source: string;
  state: ScopeState;
  follow_up: OwnedUnknown | null;
};
export type DiscoveryFollowUp = Entity &
  OwnedUnknown & {
    due_on: string | null;
    fact_id: string | null;
    activity_id: string | null;
  };
export type Configuration = {
  schema_version: 1;
  definition_id: typeof configurationDefinition;
  areas: Area[];
  systems: ProposedSystem[];
  facts: ConfigurationFact[];
  evidence: ConfigurationEvidence[];
  responsibilities: Responsibility[];
  follow_ups: DiscoveryFollowUp[];
};
export type DiscoveryFinding = {
  key: string;
  category: "Readiness" | "Information";
  step: "Requirements" | "Configuration" | "Scope & delivery" | "Review";
  entity_id: string | null;
  field: string;
  message: string;
  action: "ReviewField";
};
export const emptyConfiguration = (): Configuration => ({
  schema_version: 1,
  definition_id: configurationDefinition,
  areas: [],
  systems: [],
  facts: [],
  evidence: [],
  responsibilities: [],
  follow_ups: [],
});
export function requiredSystemFields(system: ProposedSystem): FactField[] {
  return [
    "SupplyDescription",
    ...(system.intent !== "New" && system.family === "ControlsClimate"
      ? ["VerifiedCapacity" as const]
      : []),
    ...(system.intent !== "New" && system.family === "MonitoringWeather"
      ? ["EquipmentModel" as const]
      : []),
  ];
}
export function configurationCounts(
  config: Configuration,
  findings: readonly DiscoveryFinding[] = [],
) {
  return {
    areas: config.areas.length,
    growing_areas: config.areas.filter((a) => a.purpose === "Growing").length,
    systems: new Set(config.systems.map((s) => s.id)).size,
    families: Object.fromEntries(
      equipmentFamilies.map((f) => [
        f.id,
        new Set(
          config.systems.filter((s) => s.family === f.id).map((s) => s.id),
        ).size,
      ]),
    ),
    to_confirm: new Set(
      findings
        .filter((f) => f.step === "Configuration" && f.category === "Readiness")
        .map((f) => f.entity_id)
        .filter((id) => config.systems.some((s) => s.id === id)),
    ).size,
  };
}
export function coverageLabel(system: ProposedSystem, areas: readonly Area[]) {
  if (system.coverage.mode !== "Defined")
    return system.coverage.mode === "Unknown"
      ? "Unknown coverage"
      : "Not area-specific";
  return areas.length > 0 &&
    areas.every((a) => system.coverage.area_ids.includes(a.id)) &&
    system.coverage.area_ids.length === areas.length
    ? "All areas"
    : system.coverage.area_ids
        .map((id) => areas.find((a) => a.id === id)?.label ?? "Unresolved area")
        .sort((a, b) => a.localeCompare(b))
        .join(" + ");
}
export function filterSystems(
  config: Configuration,
  filters: { family: string; area: string; search: string },
) {
  return config.systems.filter(
    (s) =>
      (!filters.family || s.family === filters.family) &&
      (!filters.area || s.coverage.area_ids.includes(filters.area)) &&
      (!filters.search ||
        `${s.name} ${s.type} ${s.proposed_work}`
          .toLocaleLowerCase()
          .includes(filters.search.toLocaleLowerCase())),
  );
}
