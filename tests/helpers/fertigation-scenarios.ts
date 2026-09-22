import { randomUUID } from "node:crypto";
import {
  blankArea,
  blankCandidate,
  blankCropGroup,
  blankGroup,
  blankMaster,
  blankScenario,
  blankScope,
  blankSource,
  blankValve,
} from "../../src/estimating/fertigation/definition";

export function scenarioComparisonScope() {
  const p = blankScope();
  p.name = "SYN scenario comparison and receiving notes";
  p.production_context.hydraulic_arrangement = "single_pass";
  p.production_context.application_method = "drip";
  p.sources = [
    {
      ...blankSource(randomUUID()),
      label: "SYN shared source",
      phase: "proposed",
      usable_storage_m3: 2,
      reliable_flow_m3h: 5,
    },
  ];
  p.masters = [
    {
      ...blankMaster(randomUUID()),
      label: "SYN one circuit",
      phase: "proposed",
      source_id: p.sources[0].id,
      circuit: "One circuit",
    },
  ];
  p.areas = ["North", "South"].map((label) => ({
    ...blankArea(randomUUID()),
    label: `SYN ${label}`,
    phase: "proposed",
    area_m2: 100,
    area_basis: "planted",
    context: { ...p.production_context },
  }));
  p.crop_groups = [
    {
      ...blankCropGroup(randomUUID()),
      label: "SYN South crop",
      phase: "proposed",
      area_id: p.areas[1].id,
    },
  ];
  p.valves = [2, 3].map((flow, i) => ({
    ...blankValve(randomUUID()),
    label: `SYN ${i ? "South" : "North"} valve`,
    phase: "proposed",
    source_id: p.sources[0].id,
    master_id: p.masters[0].id,
    flow_basis: "design_allowance",
    design_flow_m3h: flow,
    allocations: [
      {
        id: randomUUID(),
        area_id: i ? null : p.areas[0].id,
        crop_group_id: i ? p.crop_groups[0].id : null,
        container_count: null,
        served_area_m2: 100,
        flow_share_fraction: 1,
      },
    ],
  }));
  p.groups = p.valves.map((v) => ({
    ...blankGroup(randomUUID()),
    label: v.label.replace("valve", "group"),
    phase: "proposed",
    valve_ids: [v.id],
    prepare_seconds: 0,
    delivery_seconds: 600,
    flush_seconds: 0,
    flush_to_crop: "no",
    other_path: "none",
  }));
  const a = {
    ...blankScenario(randomUUID()),
    label: "SYN Baseline plan",
    phase: "proposed" as const,
    group_ids: [p.groups[0].id],
    cycles: 1,
    start_minute: 0,
    end_minute: 120,
    spacing_min: 10,
    spacing_basis: "start_to_start" as const,
    source_id: p.sources[0].id,
    initial_storage_m3: 2,
    refill_m3h: 0,
    reserve_m3: 1.8,
    notes: "Authored baseline assumption; one sequential circuit.",
  };
  const b = {
    ...a,
    id: randomUUID(),
    label: "SYN Higher demand plan",
    group_ids: p.groups.map((g) => g.id),
    cycles: 2,
    refill_m3h: null,
    notes:
      "Refill remains unknown. Entered spacing creates an explicit conflict.",
  };
  p.scenarios = [a, b];
  p.selected_scenario_id = a.id;
  p.candidates = [
    {
      ...blankCandidate(randomUUID(), "NutriFit"),
      label: "SYN hypothetical candidate",
      phase: "proposed",
      variant: "Synthetic entered envelope",
      minimum_m3h: 0,
      maximum_m3h: 100,
    },
  ];
  return p;
}
