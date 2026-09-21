import { randomUUID } from "node:crypto";
import {
  configurationDefinition,
  type Configuration,
  type ConfigurationFact,
} from "../../src/estimating/configuration-definition";
import { CRM } from "./crm";
import {
  discoveryInput,
  discoveryEquipment,
  discoveryFacility,
} from "./estimating-discovery";

// Maximum area/system cardinalities together, with realistic bounded notes.
// Independent fact/evidence ceilings still share the 64 KiB command envelope.
export function maximumStructuredDiscovery() {
  const input = structuredDiscovery(true),
    c = input.configuration;
  c.areas = Array.from({ length: 20 }, (_, i) => ({
    ...c.areas[0],
    id: randomUUID(),
    label: `SYN area ${String(i + 1).padStart(2, "0")}`,
    facility_id: null,
    evidence_ids: [],
  }));
  c.systems = Array.from({ length: 40 }, (_, i) => ({
    ...c.systems[1],
    id: randomUUID(),
    name: `SYN system ${String(i + 1).padStart(2, "0")}`,
    family: "Other" as const,
    type: "Synthetic supplied item",
    intent: "New" as const,
    proposed_work: "Synthetic maximum-cardinality supplied scope",
    equipment_ids: [],
    evidence_ids: [],
    coverage: {
      mode: "Defined" as const,
      area_ids: [c.areas[i % 20].id],
      source: null,
      reason: null,
      follow_up: null,
    },
  }));
  c.facts = c.systems.map((s) => ({
    ...c.facts[0],
    id: randomUUID(),
    system_id: s.id,
    field: "SupplyDescription" as const,
    value:
      "SYN supply within the stated area; technical suitability reviewed separately.",
    evidence_ids: [],
  }));
  c.evidence = [];
  c.responsibilities = [];
  c.follow_ups = [];
  return input;
}
export function northbankConfiguration(complete = false): Configuration {
  const areas = ["Greenhouse 1", "Greenhouse 2", "Irrigation shed"].map(
    (label, i) => ({
      id: randomUUID(),
      lineage: null,
      label,
      facility_id: i === 0 ? discoveryFacility : null,
      purpose: i === 2 ? ("Ancillary" as const) : ("Growing" as const),
      use: i === 2 ? "Services" : "Nursery production",
      stage: "Upgrade",
      source: "SYN Scope brief r03",
      evidence_ids: [] as string[],
      state: "Confirmed" as const,
      follow_up: null,
    }),
  );
  const evidence = ["Site notes r02", "Estimator input", "Scope brief r03"].map(
    (observation) => ({
      id: randomUUID(),
      lineage: null,
      source_type: "Manual" as const,
      source_id: null,
      source_version: null,
      observation,
      observed_on: "2026-09-21",
      note: "Synthetic attributed observation; no external document version is asserted.",
    }),
  );
  const systems = [
    {
      name: "Climate control",
      family: "ControlsClimate" as const,
      intent: "RetainExpand" as const,
      coverage: areas.slice(0, 2),
      equipment_ids: [discoveryEquipment],
      work: "Retain controller and expand zones",
      source: 0,
    },
    {
      name: "Fertigation",
      family: "Fertigation" as const,
      intent: "New" as const,
      coverage: areas.slice(2),
      equipment_ids: [],
      work: "New fertigation supply",
      source: 1,
    },
    {
      name: "Crop monitoring",
      family: "MonitoringWeather" as const,
      intent: "Retain" as const,
      coverage: areas.slice(0, 2),
      equipment_ids: [discoveryEquipment],
      work: "Retain monitoring equipment",
      source: 0,
    },
    {
      name: "Shared network",
      family: "Infrastructure" as const,
      intent: "New" as const,
      coverage: areas,
      equipment_ids: [],
      work: "Shared network across scoped areas",
      source: 2,
    },
  ].map((s) => ({
    id: randomUUID(),
    lineage: null,
    name: s.name,
    family: s.family,
    type: s.name,
    intent: s.intent,
    proposed_work: s.work,
    equipment_ids: s.equipment_ids,
    evidence_ids: [evidence[s.source].id],
    coverage: {
      mode: "Defined" as const,
      area_ids: s.coverage.map((a) => a.id),
      source: null,
      reason: null,
      follow_up: null,
    },
  }));
  const facts: ConfigurationFact[] = systems.map((s) => ({
    id: randomUUID(),
    lineage: null,
    system_id: s.id,
    field: "SupplyDescription",
    role: "Requirement",
    value: s.proposed_work,
    unit: "Text",
    state: "Confirmed",
    source: "SYN Estimator brief",
    evidence_ids: s.evidence_ids,
    follow_up: null,
  }));
  facts.push({
    id: randomUUID(),
    lineage: null,
    system_id: systems[0].id,
    field: "RequiredZones",
    role: "Requirement",
    value: 8,
    unit: "Zones",
    state: "Confirmed",
    source: "Estimator brief",
    evidence_ids: [evidence[0].id],
    follow_up: null,
  });
  const capacity: ConfigurationFact = {
    id: randomUUID(),
    lineage: null,
    system_id: systems[0].id,
    field: "VerifiedCapacity",
    role: "Capability",
    value: complete ? 8 : null,
    unit: "Zones",
    state: complete ? "Confirmed" : "Unknown",
    source: "SYN Capacity check",
    evidence_ids: [evidence[0].id],
    follow_up: complete
      ? null
      : { owner_id: CRM.owner, reason: "Confirm controller capacity" },
  };
  const model: ConfigurationFact = {
    id: randomUUID(),
    lineage: null,
    system_id: systems[2].id,
    field: "EquipmentModel",
    role: "Observation",
    value: complete ? "SYN recorded sensor model" : null,
    unit: "Text",
    state: complete ? "Confirmed" : "Unknown",
    source: "SYN Equipment observation",
    evidence_ids: [evidence[0].id],
    follow_up: complete
      ? null
      : { owner_id: CRM.owner, reason: "Confirm existing sensor model" },
  };
  facts.push(capacity, model);
  return {
    schema_version: 1,
    definition_id: configurationDefinition,
    areas,
    systems,
    facts,
    evidence,
    responsibilities: [],
    follow_ups: complete
      ? []
      : [capacity, model].map((f) => ({
          id: randomUUID(),
          lineage: null,
          owner_id: CRM.owner,
          reason: f.follow_up!.reason,
          due_on: "2026-09-23",
          fact_id: f.id,
          activity_id: null,
        })),
  };
}
export function structuredDiscovery(complete = false) {
  return {
    ...discoveryInput(),
    configuration: northbankConfiguration(complete),
  };
}
