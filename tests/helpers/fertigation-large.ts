import { randomUUID } from "node:crypto";
import {
  blankScope,
  blankArea,
  blankValve,
  blankMaster,
  blankSource,
  blankGroup,
  blankScenario,
} from "../../src/estimating/fertigation/definition";

/** Authored synthetic capacity fixture; no supplier or crop-performance claim. */
export function largeFertigationScope() {
  const p = blankScope();
  p.name = "SYN 100-area 1000-valve capacity proof";
  p.production_context = {
    ...p.production_context,
    tags: ["commercial_berries"],
    application_method: "drip",
    hydraulic_arrangement: "single_pass",
    source_note: "Synthetic capacity fixture only",
  };
  const source = {
    ...blankSource(randomUUID()),
    label: "SYN capacity source",
    phase: "proposed" as const,
    usable_storage_m3: 1000,
    nominal_storage_m3: 1000,
    reliable_flow_m3h: 100,
  };
  const master = {
    ...blankMaster(randomUUID()),
    label: "SYN shared master",
    phase: "proposed" as const,
    source_id: source.id,
    circuit: "SYN one shared circuit",
  };
  p.sources = [source];
  p.masters = [master];
  p.areas = Array.from({ length: 100 }, (_, i) => ({
    ...blankArea(randomUUID()),
    label: `SYN area ${i + 1}`,
    phase: "proposed",
    area_m2: 20000,
    area_basis: "planted",
    context: { ...p.production_context },
  }));
  p.valves = Array.from({ length: 1000 }, (_, i) => ({
    ...blankValve(randomUUID()),
    label: `SYN capacity valve ${String(i + 1).padStart(4, "0")}`,
    phase: "proposed",
    source_id: source.id,
    master_id: master.id,
    flow_basis: "design_allowance",
    design_flow_m3h: 1,
    allocations: [
      {
        id: randomUUID(),
        area_id: p.areas[i % 100].id,
        crop_group_id: null,
        container_count: null,
        served_area_m2: 20,
        flow_share_fraction: 1,
      },
    ],
  }));
  p.groups = Array.from({ length: 100 }, (_, i) => ({
    ...blankGroup(randomUUID()),
    label: `SYN group ${i + 1}`,
    phase: "proposed",
    valve_ids: p.valves.slice(i * 10, i * 10 + 10).map((v) => v.id),
    prepare_seconds: 0,
    delivery_seconds: 180,
    flush_seconds: 0,
    flush_to_crop: "no",
    other_path: "none",
  }));
  const scenario = {
    ...blankScenario(randomUUID()),
    label: "SYN bounded scenario",
    phase: "proposed" as const,
    group_ids: p.groups.map((g) => g.id),
    cycles: 3,
    start_minute: 0,
    end_minute: 1440,
    spacing_min: 300,
    spacing_basis: "start_to_start" as const,
    source_id: source.id,
    initial_storage_m3: 1000,
    refill_m3h: 0,
    reserve_m3: 0,
  };
  p.scenarios = [scenario];
  p.selected_scenario_id = scenario.id;
  return p;
}
