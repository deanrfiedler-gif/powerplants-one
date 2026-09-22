import { calculationEdition } from "./definition";
import type {
  Scope,
  Calculation,
  Result,
  ResultState,
  RecordBase,
  CurvePoint,
  CropGroup,
  Valve,
  Group,
  Finding,
} from "./types";

const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const positive = (v: number | null | undefined): v is number =>
  known(v) && v > 0;
const result = (
  value: number | null,
  unit: string,
  reason = "",
  dependencies: string[] = [],
  state?: ResultState,
): Result => ({
  value,
  unit,
  state: state ?? (value === null ? "unknown" : "known"),
  reason: value === null ? reason || "Required inputs remain unknown." : reason,
  dependencies,
});
const sum = (values: (number | null)[]): number | null =>
  values.every(known) ? values.reduce<number>((n, v) => n + (v ?? 0), 0) : null;
const maximum = (values: (number | null)[]): number | null =>
  values.length && values.every(known)
    ? Math.max(...(values as number[]))
    : null;

export function parseCurve(
  text: string,
  flowFactor = 1,
  headFactor = 1,
): CurvePoint[] {
  if (!positive(flowFactor) || !positive(headFactor))
    throw new Error("Curve conversion factors must be positive and finite.");
  if (text.length > 200000)
    throw new Error("Curve text exceeds the bounded contract.");
  const lines = text.trim() ? text.trim().split(/\r?\n/) : [];
  if (lines.length > 2000) throw new Error("Use at most 2,000 curve points.");
  const rows = lines.map((line, i) => {
    const cells = line.split(/[,;\t]/).map((c) => c.trim());
    if (cells.length < 2 || cells.length > 4 || !cells[0] || !cells[1])
      throw new Error(
        `Curve row ${i + 1}: enter flow, head and up to two optional columns.`,
      );
    const read = (s: string | undefined): number | null => {
      if (!s) return null;
      if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s))
        throw new Error(`Curve row ${i + 1}: use finite non-negative numbers.`);
      const n = Number(s);
      if (!known(n) || n < 0)
        throw new Error(`Curve row ${i + 1}: use finite non-negative numbers.`);
      return n;
    };
    const flow_m3h = read(cells[0])! * flowFactor,
      head_m = read(cells[1])! * headFactor;
    const efficiency_percent = read(cells[2]),
      power_kw = read(cells[3]);
    if (
      !known(flow_m3h) ||
      !known(head_m) ||
      (known(efficiency_percent) && efficiency_percent > 100)
    )
      throw new Error(`Curve row ${i + 1}: values exceed the permitted range.`);
    return { flow_m3h, head_m, efficiency_percent, power_kw };
  });
  if (rows.some((r, i) => i > 0 && r.flow_m3h <= rows[i - 1].flow_m3h))
    throw new Error("Curve flows must strictly increase without duplicates.");
  return rows;
}
export function interpolateCurve(
  points: CurvePoint[],
  flow: number | null,
): number | null {
  if (
    !known(flow) ||
    !points.length ||
    points.some(
      (p, i) =>
        !known(p.flow_m3h) ||
        !known(p.head_m) ||
        (i > 0 && p.flow_m3h <= points[i - 1].flow_m3h),
    ) ||
    flow < points[0].flow_m3h ||
    flow > points[points.length - 1].flow_m3h
  )
    return null;
  const exact = points.find((p) => p.flow_m3h === flow);
  if (exact) return exact.head_m;
  for (let i = 1; i < points.length; i++)
    if (flow <= points[i].flow_m3h) {
      const a = points[i - 1],
        b = points[i];
      return (
        a.head_m +
        ((b.head_m - a.head_m) * (flow - a.flow_m3h)) /
          (b.flow_m3h - a.flow_m3h)
      );
    }
  return null;
}
export function pipeVolumeLitres(
  length_m: number | null,
  internal_diameter_mm: number | null,
): number | null {
  return known(length_m) && positive(internal_diameter_mm)
    ? Math.PI * (internal_diameter_mm / 2000) ** 2 * length_m * 1000
    : null;
}
export function depthVolumeM3(
  depth_mm: number | null,
  area_m2: number | null,
): number | null {
  return known(depth_mm) && known(area_m2) ? (depth_mm * area_m2) / 1000 : null;
}
export function grossFromNet(
  net: number | null,
  drainFraction: number | null,
  confirmed: boolean,
): number | null {
  return known(net) &&
    known(drainFraction) &&
    drainFraction >= 0 &&
    drainFraction < 1 &&
    confirmed
    ? net / (1 - drainFraction)
    : null;
}

/** No DOM, storage, network, random identity or clock. Server recomputes after validation. */
export function calculate(p: Scope): Calculation {
  const findings: Finding[] = [];
  const find = (
    code: string,
    record_id: string | null,
    field: string,
    message: string,
    severity: Finding["severity"] = "incomplete",
  ) =>
    findings.push({
      id: `${code}:${record_id ?? "scope"}:${field}`,
      record_id,
      field,
      message,
      severity,
    });
  const scenario = p.scenarios.find((s) => s.id === p.selected_scenario_id);
  const active = (r: RecordBase): boolean =>
    r.phase !== "excluded" &&
    (r.phase !== "future" || scenario?.include_future === true);
  const usable = (r: RecordBase | undefined): boolean =>
    !!r && active(r) && r.phase !== "unknown";
  const areas = new Map(p.areas.map((r) => [r.id, r])),
    crops = new Map(p.crop_groups.map((r) => [r.id, r])),
    masters = new Map(p.masters.map((r) => [r.id, r])),
    sources = new Map(p.sources.map((r) => [r.id, r]));
  const groups = p.groups.filter(
    (g) => active(g) && scenario?.group_ids.includes(g.id),
  );
  for (const collection of [
    p.areas,
    p.crop_groups,
    p.valves,
    p.masters,
    p.sources,
    groups,
  ])
    for (const r of collection)
      if (r.phase === "unknown")
        find(
          "phase_unknown",
          r.id,
          "phase",
          "Confirm the record's phase before using its dependent duty.",
        );
  if (!scenario)
    find(
      "scenario_missing",
      null,
      "selected_scenario_id",
      "Select a saved operating scenario to assess operating duty and delivery.",
    );
  if (p.production_context.hydraulic_arrangement === "unknown")
    find(
      "process_unknown",
      null,
      "production_context",
      "Record the actual hydraulic arrangement; a commercial context does not establish it.",
    );

  const cropCounts = new Map<
    string,
    { containers: number | null; plants: number | null; daily: number | null }
  >();
  const areaCropCounts = new Map<string, number>();
  for (const c of p.crop_groups)
    if (active(c) && c.area_id)
      areaCropCounts.set(c.area_id, (areaCropCounts.get(c.area_id) ?? 0) + 1);
  for (const c of p.crop_groups.filter(active)) {
    const area = c.area_id ? areas.get(c.area_id) : undefined;
    const usableCrop = usable(c) && (!c.area_id || usable(area));
    const represented =
      c.represented_area_m2 ??
      (area &&
      areaCropCounts.get(area.id) === 1 &&
      ["planted", "effective"].includes(area.area_basis)
        ? area.area_m2
        : null);
    const containers = !usableCrop
      ? null
      : (c.container_count ??
        (known(c.containers_per_ha) && known(represented)
          ? (c.containers_per_ha * represented) / 10000
          : null));
    const plants = !usableCrop
      ? null
      : (c.plant_count ??
        (known(containers) &&
        known(c.plants_per_container) &&
        known(c.missing_plants)
          ? containers * c.plants_per_container - c.missing_plants
          : null));
    const litres =
      c.demand_basis === "gross"
        ? c.daily_l_per_container
        : c.demand_basis === "net"
          ? grossFromNet(
              c.daily_l_per_container,
              c.drain_fraction,
              c.drain_definition_confirmed,
            )
          : null;
    const daily =
      known(containers) && known(litres) ? (containers * litres) / 1000 : null;
    cropCounts.set(c.id, { containers, plants, daily });
    if (known(plants) && plants < 0)
      find(
        "negative_population",
        c.id,
        "missing_plants",
        "Missing plants exceed the represented population.",
        "conflict",
      );
    if (!known(containers) && c.containers_per_ha !== null)
      find(
        "density_area_unknown",
        c.id,
        "represented_area_m2",
        "Density needs the area represented by this crop group; mixed groups cannot each use the whole physical area.",
      );
    if (known(containers) && !known(daily))
      find(
        "demand_unknown",
        c.id,
        "demand_basis",
        "The attributed gross daily demand is incomplete.",
      );
  }
  for (const area of p.areas) {
    const represented = p.crop_groups.filter(
      (c) => c.area_id === area.id && active(c),
    );
    const totalArea = sum(represented.map((c) => c.represented_area_m2));
    if (known(area.area_m2) && known(totalArea) && totalArea > area.area_m2)
      find(
        "area_overlap",
        area.id,
        "represented_area_m2",
        "Crop-group represented areas exceed the declared area; resolve possible overlapping coverage.",
        "conflict",
      );
  }
  const emitterPerContainer = (v: Valve): number | null =>
    v.emitter.method === "verified_per_container"
      ? v.emitter.verified_container_lph
      : v.emitter.method === "independent" &&
          known(v.emitter.count) &&
          known(v.emitter.flow_lph) &&
          positive(v.emitter.containers_per_emitter)
        ? (v.emitter.count * v.emitter.flow_lph) /
          v.emitter.containers_per_emitter
        : null;
  const valveFlow = (v: Valve): number | null => {
    if (!usable(v)) return null;
    const master = v.master_id ? masters.get(v.master_id) : undefined;
    const sourceId = v.source_id ?? master?.source_id;
    if (
      (v.master_id && !usable(master)) ||
      (sourceId && !usable(sources.get(sourceId)))
    )
      return null;
    if (v.source_id && master?.source_id && v.source_id !== master.source_id) {
      find(
        "source_conflict",
        v.id,
        "source_id",
        "The valve source differs from its master-valve source.",
        "conflict",
      );
      return null;
    }
    for (const a of v.allocations)
      if (
        (a.area_id && !usable(areas.get(a.area_id))) ||
        (a.crop_group_id &&
          (!usable(crops.get(a.crop_group_id)) ||
            (crops.get(a.crop_group_id)?.area_id &&
              !usable(areas.get(crops.get(a.crop_group_id)!.area_id!)))))
      )
        return null;
    if (v.flow_basis === "measured") return v.measured_flow_m3h;
    if (v.flow_basis === "design_allowance") return v.design_flow_m3h;
    const rate = emitterPerContainer(v);
    if (
      v.flow_basis !== "emitter_inventory" ||
      !known(rate) ||
      !v.allocations.length
    )
      return null;
    const count = sum(v.allocations.map((a) => a.container_count));
    return known(count) ? (rate * count) / 1000 : null;
  };
  const liveValves = p.valves.filter(active);
  const valveFlows = liveValves.map((v) => {
    const flow = valveFlow(v);
    if (!known(flow))
      find(
        "flow_unknown",
        v.id,
        "flow_basis",
        "Valve flow is incomplete or a referenced phase/source is inapplicable.",
      );
    if (!v.allocations.length)
      find(
        "allocation_missing",
        v.id,
        "allocations",
        "Service allocations remain partially captured; known valve flow does not establish crop delivery.",
      );
    if (v.flow_basis === "measured" && !v.flow_evidence_id)
      find(
        "measurement_source",
        v.id,
        "flow_evidence_id",
        "Attach or reference the measurement conditions and source.",
        "review",
      );
    return {
      id: v.id,
      flow: result(
        flow,
        "m³/h",
        "Valve flow or an applicable dependency remains unknown.",
        [v.id],
      ),
    };
  });
  const flowMap = new Map(valveFlows.map((v) => [v.id, v.flow.value]));
  const allocationTotals = new Map<string, number>();
  for (const v of liveValves)
    for (const a of v.allocations)
      if (a.crop_group_id && known(a.container_count))
        allocationTotals.set(
          a.crop_group_id,
          (allocationTotals.get(a.crop_group_id) ?? 0) + a.container_count,
        );
  for (const [id, count] of cropCounts)
    if (known(count.containers)) {
      const allocated = allocationTotals.get(id) ?? 0;
      if (allocated > count.containers)
        find(
          "over_allocated",
          id,
          "allocations",
          "Allocated containers exceed the crop group's represented population.",
          "conflict",
        );
      if (allocated < count.containers)
        find(
          "unallocated",
          id,
          "allocations",
          `${count.containers - allocated} represented containers have no captured valve allocation.`,
        );
    }
  const groupFlows = groups.map((g) => {
    const duplicate = new Set(g.valve_ids).size !== g.valve_ids.length;
    if (duplicate)
      find(
        "duplicate_valve",
        g.id,
        "valve_ids",
        "A physical valve is listed twice; its flow is counted once.",
        "conflict",
      );
    const valves = g.valve_ids.map((id) => liveValves.find((v) => v.id === id));
    const circuits = new Set(
      valves
        .map((v) => (v?.master_id ? masters.get(v.master_id)?.circuit : null))
        .filter(Boolean),
    );
    const sourceIds = new Set(
      valves
        .map(
          (v) =>
            v?.source_id ??
            (v?.master_id ? masters.get(v.master_id)?.source_id : null),
        )
        .filter(Boolean),
    );
    const topologySupported = circuits.size <= 1 && sourceIds.size <= 1;
    if (!topologySupported)
      find(
        "parallel_circuits",
        g.id,
        "valve_ids",
        "Independent sources or circuits require separate hydraulic assessment; their duties are not pooled.",
        "conflict",
      );
    const crop =
      usable(g) && g.valve_ids.length && topologySupported
        ? sum([...new Set(g.valve_ids)].map((id) => flowMap.get(id) ?? null))
        : null;
    let pump: number | null = null,
      unit: number | null = null;
    if (g.other_path === "none") {
      pump = crop;
      unit = crop;
      if (
        (g.other_pump_flow_m3h ?? 0) > 0 ||
        (g.other_unit_flow_m3h ?? 0) > 0
      ) {
        find(
          "consumer_path_conflict",
          g.id,
          "other_path",
          "The declared no-other-consumer path conflicts with entered auxiliary flow.",
          "conflict",
        );
        pump = unit = null;
      }
    } else if (
      known(crop) &&
      known(g.other_pump_flow_m3h) &&
      (g.other_path === "pump_only" ||
        (g.other_path === "through_unit" && known(g.other_unit_flow_m3h)))
    ) {
      pump = crop + g.other_pump_flow_m3h;
      unit = crop + (g.other_path === "pump_only" ? 0 : g.other_unit_flow_m3h!);
    }
    if (known(pump) && known(unit) && unit > pump) {
      find(
        "unit_above_pump",
        g.id,
        "other_unit_flow_m3h",
        "Additional unit flow exceeds the declared pump-path demand.",
        "conflict",
      );
      pump = unit = null;
    }
    if (g.other_path === "pump_only" && (g.other_unit_flow_m3h ?? 0) > 0) {
      find(
        "pump_only_conflict",
        g.id,
        "other_unit_flow_m3h",
        "Pump-only demand cannot also be entered as dosing-unit demand.",
        "conflict",
      );
      pump = unit = null;
    }
    return {
      id: g.id,
      crop: result(crop, "m³/h", "Group valve demand is incomplete.", [g.id]),
      unit: result(
        unit,
        "m³/h",
        "Confirm other consumers and their hydraulic path.",
        [g.id],
      ),
      pump: result(
        pump,
        "m³/h",
        "Confirm other consumers and their hydraulic path.",
        [g.id],
      ),
    };
  });
  const groupMap = new Map(groups.map((g) => [g.id, g])),
    groupFlowMap = new Map(groupFlows.map((g) => [g.id, g]));
  const unitPeak = maximum(groupFlows.map((g) => g.unit.value)),
    pumpPeak = maximum(groupFlows.map((g) => g.pump.value));
  const supportedProcess =
    p.production_context.hydraulic_arrangement === "single_pass" &&
    p.production_context.application_method === "drip" &&
    p.areas
      .filter(active)
      .every(
        (a) =>
          a.context.hydraulic_arrangement === "single_pass" &&
          a.context.application_method === "drip",
      );
  if (!supportedProcess)
    find(
      "process_balance_held",
      null,
      "hydraulic_arrangement",
      "Consumption and storage modelling requires explicit single-pass drip context for the scope and represented areas; unknown methods, other methods and return/reuse require separate assessment.",
      "review",
    );

  const events: Calculation["schedule"]["events"] = [];
  const intervals: Calculation["schedule"]["intervals"] = [];
  const duration = (g: Group) =>
    sum([g.prepare_seconds, g.delivery_seconds, g.flush_seconds]);
  const cycle = groups.length ? sum(groups.map(duration)) : null;
  const selectedCircuits = new Set(
    liveValves
      .filter((v) => groups.some((g) => g.valve_ids.includes(v.id)))
      .map((v) => (v.master_id ? masters.get(v.master_id)?.circuit : null))
      .filter(Boolean),
  );
  let timingComplete =
    !!scenario &&
    usable(scenario) &&
    groups.every(usable) &&
    groupFlows.every((g) => known(g.pump.value)) &&
    selectedCircuits.size <= 1 &&
    known(cycle) &&
    known(scenario.cycles) &&
    scenario.cycles > 0 &&
    known(scenario.spacing_min) &&
    scenario.spacing_basis !== "unknown" &&
    known(scenario.start_minute) &&
    known(scenario.end_minute) &&
    scenario.end_minute > scenario.start_minute;
  if (selectedCircuits.size > 1)
    find(
      "scenario_circuits",
      scenario?.id ?? null,
      "group_ids",
      "Independent circuits cannot use a shared sequential timing/storage conclusion.",
      "conflict",
    );
  if (scenario && (scenario.cycles ?? 0) * groups.length > 10000) {
    timingComplete = false;
    find(
      "schedule_limit",
      scenario.id,
      "cycles",
      "The preview exceeds 10,000 events; reduce the bounded scenario.",
      "conflict",
    );
  }
  if (timingComplete && scenario && known(cycle)) {
    const spacing =
      scenario.spacing_basis === "end_to_start"
        ? cycle + scenario.spacing_min! * 60
        : Math.max(cycle, scenario.spacing_min! * 60);
    if (
      scenario.spacing_basis === "start_to_start" &&
      scenario.spacing_min! * 60 < cycle
    )
      find(
        "cycle_overlap",
        scenario.id,
        "spacing_min",
        "Start-to-start spacing is shorter than the sequential circuit; the provisional sequence uses its earliest feasible spacing.",
        "conflict",
      );
    for (let i = 0; i < scenario.cycles!; i++) {
      let time = scenario.start_minute! * 60 + spacing * i;
      for (const g of groups) {
        const start = time + g.prepare_seconds!,
          end = start + g.delivery_seconds!,
          finish = end + g.flush_seconds!;
        events.push({ group_id: g.id, start, end, finish });
        time = finish;
      }
    }
    if (events.at(-1)!.finish > scenario.end_minute! * 60)
      find(
        "window_overflow",
        scenario.id,
        "end_minute",
        "The operating sequence extends beyond its declared same-day window.",
        "conflict",
      );
    if (scenario.cycles === 1)
      find(
        "single_cycle",
        scenario.id,
        "cycles",
        "One cycle cannot establish a repeated dry interval or overnight performance.",
        "review",
      );
    const byValve = new Map<
      string,
      { start: number; end: number; unknown: boolean }[]
    >();
    for (const e of events) {
      const g = groupMap.get(e.group_id)!;
      for (const id of new Set(g.valve_ids)) {
        const list = byValve.get(id) ?? [];
        list.push({
          start: e.start,
          end: g.flush_to_crop === "yes" ? e.finish : e.end,
          unknown: g.flush_seconds! > 0 && g.flush_to_crop === "unknown",
        });
        byValve.set(id, list);
      }
    }
    for (const [id, runs] of byValve) {
      const gaps = runs.slice(1).map((r, i) => (r.start - runs[i].end) / 60),
        starts = runs.slice(1).map((r, i) => (r.start - runs[i].start) / 60),
        unknown = runs.some((r) => r.unknown);
      const row = {
        valve_id: id,
        maximum_dry_min: gaps.length && !unknown ? Math.max(...gaps) : null,
        maximum_start_min: starts.length ? Math.max(...starts) : null,
        minimum_rest_min: gaps.length && !unknown ? Math.min(...gaps) : null,
      };
      intervals.push(row);
      for (const g of groups.filter((g) => g.valve_ids.includes(id))) {
        if (
          known(row.maximum_dry_min) &&
          known(g.maximum_dry_min) &&
          row.maximum_dry_min > g.maximum_dry_min
        )
          find(
            "dry_interval",
            id,
            "maximum_dry_min",
            "The physical valve's dry interval exceeds its entered limit.",
            "conflict",
          );
        if (
          known(row.maximum_start_min) &&
          known(g.maximum_start_interval_min) &&
          row.maximum_start_min > g.maximum_start_interval_min
        )
          find(
            "start_interval",
            id,
            "maximum_start_interval_min",
            "The physical valve's start interval exceeds its entered limit.",
            "conflict",
          );
        if (
          known(row.minimum_rest_min) &&
          known(g.minimum_rest_min) &&
          row.minimum_rest_min < g.minimum_rest_min
        )
          find(
            "minimum_rest",
            id,
            "minimum_rest_min",
            "The physical valve's minimum rest is not met.",
            "conflict",
          );
      }
    }
  } else
    find(
      "timing_incomplete",
      scenario?.id ?? null,
      "scenarios",
      "Enter a same-day window, cycle count, spacing basis and complete group durations; overnight and parallel circuits are outside this model.",
    );

  const secondsByValve = new Map<string, number | null>();
  const scheduledValves = new Set(groups.flatMap((g) => g.valve_ids));
  for (const e of events) {
    const g = groupMap.get(e.group_id)!;
    for (const id of new Set(g.valve_ids)) {
      const seconds =
        g.flush_seconds! > 0 && g.flush_to_crop === "unknown"
          ? null
          : e.end -
            e.start +
            (g.flush_to_crop === "yes" ? e.finish - e.end : 0);
      const prior = secondsByValve.has(id) ? secondsByValve.get(id)! : 0;
      secondsByValve.set(id, sum([prior, seconds]));
    }
  }
  const perContainerDemand = (c: CropGroup | undefined): number | null =>
    c && usable(c) && (!c.area_id || usable(areas.get(c.area_id)))
      ? c.demand_basis === "gross"
        ? c.daily_l_per_container
        : c.demand_basis === "net"
          ? grossFromNet(
              c.daily_l_per_container,
              c.drain_fraction,
              c.drain_definition_confirmed,
            )
          : null
      : null;
  const coverage = liveValves.flatMap((v) =>
    v.allocations.map((a) => {
      const litres = perContainerDemand(
        a.crop_group_id ? crops.get(a.crop_group_id) : undefined,
      );
      const required =
        supportedProcess &&
        (!a.area_id || usable(areas.get(a.area_id))) &&
        known(litres) &&
        known(a.container_count)
          ? (litres * a.container_count) / 1000
          : null;
      const seconds = timingComplete
        ? (secondsByValve.get(v.id) ?? (scheduledValves.has(v.id) ? null : 0))
        : null;
      const rate =
        v.flow_basis === "emitter_inventory"
          ? known(a.container_count) && known(emitterPerContainer(v))
            ? (a.container_count * emitterPerContainer(v)!) / 1000
            : null
          : known(a.flow_share_fraction) && known(flowMap.get(v.id))
            ? a.flow_share_fraction * flowMap.get(v.id)!
            : null;
      const delivered =
        known(flowMap.get(v.id)) && known(seconds) && known(rate)
          ? (seconds * rate) / 3600
          : null;
      if (!scheduledValves.has(v.id))
        find(
          "not_scheduled",
          a.id,
          "allocation",
          "This physical service allocation is not scheduled; surplus delivered elsewhere cannot satisfy it.",
          "conflict",
        );
      else if (known(required) && known(delivered) && delivered < required)
        find(
          "below_demand",
          a.id,
          "allocation",
          "This allocation receives less than its entered demand.",
          "conflict",
        );
      return {
        allocation_id: a.id,
        valve_id: v.id,
        crop_group_id: a.crop_group_id,
        required_m3: result(
          supportedProcess ? required : null,
          "m³",
          "An applicable attributed crop-demand basis is required.",
          [a.id],
          supportedProcess ? undefined : "unsupported",
        ),
        delivered_m3: result(
          delivered,
          "m³",
          "Measured/design total flow does not establish allocation distribution without an explicit flow share.",
          [a.id, v.id],
        ),
      };
    }),
  );

  let finalStorage: number | null = null,
    minimumStorage: number | null = null,
    overflow: number | null = null;
  const storageSource = scenario?.source_id
    ? sources.get(scenario.source_id)
    : undefined;
  const boundSources = new Set(
    liveValves
      .filter((v) => scheduledValves.has(v.id))
      .map(
        (v) =>
          v.source_id ??
          (v.master_id ? masters.get(v.master_id)?.source_id : null) ??
          null,
      ),
  );
  const sourceBound =
    !!storageSource &&
    usable(storageSource) &&
    boundSources.size === 1 &&
    boundSources.has(storageSource.id);
  if (scenario && (!sourceBound || !boundSources.size))
    find(
      "storage_source",
      scenario.id,
      "source_id",
      "Bind the scenario to the actual supplying source; unrelated sources cannot supply its storage balance.",
    );
  let storageInputsConsistent = true;
  if (
    storageSource &&
    known(storageSource.nominal_storage_m3) &&
    known(storageSource.usable_storage_m3) &&
    storageSource.usable_storage_m3 > storageSource.nominal_storage_m3
  ) {
    storageInputsConsistent = false;
    find(
      "storage_capacity",
      storageSource.id,
      "usable_storage_m3",
      "Usable storage exceeds nominal capacity; resolve the contradiction before using the balance.",
      "conflict",
    );
  }
  if (scenario && storageSource) {
    if (
      known(scenario.initial_storage_m3) &&
      known(storageSource.usable_storage_m3) &&
      scenario.initial_storage_m3 > storageSource.usable_storage_m3
    ) {
      storageInputsConsistent = false;
      find(
        "initial_capacity",
        scenario.id,
        "initial_storage_m3",
        "Initial storage exceeds the declared usable capacity.",
        "conflict",
      );
    }
    if (
      known(scenario.reserve_m3) &&
      known(storageSource.usable_storage_m3) &&
      scenario.reserve_m3 > storageSource.usable_storage_m3
    ) {
      storageInputsConsistent = false;
      find(
        "reserve_capacity",
        scenario.id,
        "reserve_m3",
        "The required reserve exceeds the declared usable capacity.",
        "conflict",
      );
    }
    if (
      known(scenario.refill_m3h) &&
      known(storageSource.reliable_flow_m3h) &&
      scenario.refill_m3h > storageSource.reliable_flow_m3h
    ) {
      storageInputsConsistent = false;
      find(
        "refill_supply",
        scenario.id,
        "refill_m3h",
        "Refill exceeds the source's entered reliable supply.",
        "conflict",
      );
    }
  }
  if (
    supportedProcess &&
    sourceBound &&
    storageInputsConsistent &&
    timingComplete &&
    scenario &&
    known(scenario.initial_storage_m3) &&
    known(scenario.refill_m3h) &&
    known(storageSource?.usable_storage_m3) &&
    groupFlows.every((g) => known(g.pump.value))
  ) {
    let tank = scenario.initial_storage_m3,
      minimum = tank,
      spill = 0,
      time = scenario.start_minute! * 60;
    const move = (seconds: number, withdrawal: number) => {
      tank += ((scenario.refill_m3h! - withdrawal) * seconds) / 3600;
      minimum = Math.min(minimum, tank);
      if (tank > storageSource.usable_storage_m3!) {
        spill += tank - storageSource.usable_storage_m3!;
        tank = storageSource.usable_storage_m3!;
      }
    };
    for (const e of events) {
      const g = groupMap.get(e.group_id)!;
      const begin = e.start - g.prepare_seconds!;
      move(begin - time, 0);
      move(e.finish - begin, groupFlowMap.get(e.group_id)!.pump.value!);
      time = e.finish;
    }
    finalStorage = tank;
    minimumStorage = minimum;
    overflow = spill;
    if (minimum < 0)
      find(
        "storage_shortage",
        scenario.id,
        "initial_storage_m3",
        "The simplified storage balance becomes negative.",
        "conflict",
      );
    if (known(scenario.reserve_m3) && minimum < scenario.reserve_m3)
      find(
        "storage_reserve",
        scenario.id,
        "reserve_m3",
        "Storage falls below the entered reserve.",
        "conflict",
      );
    if (spill > 0)
      find(
        "storage_overflow",
        scenario.id,
        "refill_m3h",
        "The balance spills above usable capacity; confirm refill control and overflow management.",
        "review",
      );
  }

  const h = p.hydraulics;
  const losses = sum([
    h.static_head_m,
    h.pipe_loss_m,
    h.filter_loss_m,
    h.unit_loss_m,
    h.other_loss_m,
  ]);
  const head =
    known(losses) && known(h.outlet_pressure_bar)
      ? losses + (h.outlet_pressure_bar * 100000) / (998.2 * 9.80665)
      : null;
  const curveHead = interpolateCurve(h.curve_points, pumpPeak);
  const matchingHeadBasis =
    known(pumpPeak) && h.head_basis_flow_m3h === pumpPeak;
  if (known(head) && !matchingHeadBasis)
    find(
      "head_flow_basis",
      null,
      "head_basis_flow_m3h",
      "Entered head losses must be reviewed at the actual pump-flow duty.",
      "review",
    );
  const injection = groups.flatMap((g) =>
    p.stocks
      .filter(
        (s) =>
          s.recipe_id === g.recipe_id && active(s) && s.function !== "spare",
      )
      .map((stock) => ({
        group_id: g.id,
        stock_id: stock.id,
        required_lph: result(
          known(groupFlowMap.get(g.id)?.unit.value) && known(stock.dose_l_m3)
            ? groupFlowMap.get(g.id)!.unit.value! * stock.dose_l_m3
            : null,
          "L/h",
          "Record the attributed stock dose and complete dosing-unit flow.",
          [g.id, stock.id],
        ),
      })),
  );

  const devices = [...p.valves, ...p.masters, ...p.sensors].filter(active);
  const bankMap = new Map(p.banks.map((b) => [b.id, b]));
  const controllerMap = new Map(p.controllers.map((c) => [c.id, c]));
  const physicalBanks = new Map<string, string>(),
    channelAddresses = new Set<string>();
  const invalidBanks = new Set<string>();
  for (const b of p.banks.filter(active)) {
    const physical = b.physical_bank.trim().toLowerCase(),
      key = `${b.controller_id}/${physical}`,
      previous = physicalBanks.get(key);
    if (physical && previous) {
      invalidBanks.add(previous);
      invalidBanks.add(b.id);
      find(
        "bank_double_count",
        b.id,
        "physical_bank",
        "This physical bank is listed more than once; universal capacity must not be pooled twice.",
        "conflict",
      );
    }
    if (physical) physicalBanks.set(key, b.id);
    if (
      !usable(b) ||
      !physical ||
      b.signal === "unknown" ||
      !b.voltage.trim() ||
      !b.controller_id ||
      !usable(controllerMap.get(b.controller_id))
    ) {
      invalidBanks.add(b.id);
      find(
        "bank_dependency",
        b.id,
        "controller_id",
        "An applicable controller, physical bank, signal and voltage are required before concluding available I/O capacity.",
      );
    }
  }
  for (const d of devices) {
    const c = d.control;
    if (c.owner === "unknown") {
      find(
        "control_unknown",
        d.id,
        "control.owner",
        "Record manual, external or PPO-controller ownership before assessing output demand.",
      );
      if (c.bank_id) invalidBanks.add(c.bank_id);
    }
    if (c.owner !== "ppo_controller") continue;
    const b = c.bank_id ? bankMap.get(c.bank_id) : undefined;
    if (!b || !c.controller_id || !known(c.additional_channels)) {
      find(
        "io_assignment",
        d.id,
        "control",
        "Controller-owned equipment needs a typed physical bank and explicit additional-channel demand.",
      );
      if (b) invalidBanks.add(b.id);
      else
        for (const candidate of p.banks)
          if (candidate.controller_id === c.controller_id)
            invalidBanks.add(candidate.id);
      continue;
    }
    if (
      !usable(d) ||
      !usable(b) ||
      !usable(controllerMap.get(c.controller_id))
    ) {
      invalidBanks.add(b.id);
      find(
        "io_phase",
        d.id,
        "control",
        "Device, bank and parent controller must have applicable confirmed phases.",
      );
    }
    if (
      b.controller_id !== c.controller_id ||
      b.signal !== c.signal ||
      b.voltage !== c.voltage ||
      c.signal === "unknown" ||
      !c.voltage.trim()
    ) {
      invalidBanks.add(b.id);
      find(
        "io_mismatch",
        d.id,
        "control",
        "Controller, signal or voltage differs from the assigned physical bank.",
        "conflict",
      );
    }
    if (c.additional_channels > 0 && !c.channel.trim()) {
      invalidBanks.add(b.id);
      find(
        "io_address",
        d.id,
        "control.channel",
        "Additional outputs need their physical channel addresses before spare capacity can be confirmed.",
      );
    }
    if (c.channel.trim() && c.additional_channels > 0) {
      const key = `${c.controller_id}/${b.physical_bank.trim().toLowerCase()}/${c.channel.trim().toLowerCase()}`;
      if (channelAddresses.has(key)) {
        invalidBanks.add(b.id);
        find(
          "duplicate_channel",
          d.id,
          "control.channel",
          "This physical channel is assigned more than once.",
          "conflict",
        );
      }
      channelAddresses.add(key);
    }
  }
  const io = p.banks.filter(active).map((b) => {
    const assigned = devices.filter(
      (d) => d.control.owner === "ppo_controller" && d.control.bank_id === b.id,
    );
    const derived = assigned.length
      ? sum(assigned.map((d) => d.control.additional_channels))
      : null;
    const required = invalidBanks.has(b.id) ? null : derived;
    const available = [b.installed, b.used, b.reserved, b.faulty].every(known)
      ? b.installed! - b.used! - b.reserved! - b.faulty!
      : null;
    if (known(available) && available < 0)
      find(
        "io_counts",
        b.id,
        "installed",
        "Used, reserved and faulty channels exceed installed physical capacity.",
        "conflict",
      );
    if (
      known(derived) &&
      known(b.manual_required) &&
      derived !== b.manual_required
    )
      find(
        "io_reconcile",
        b.id,
        "manual_required",
        "Manual demand differs from physical-device-derived demand.",
        "conflict",
      );
    const spare =
      known(required) &&
      known(available) &&
      !(known(b.manual_required) && derived !== b.manual_required)
        ? available - required
        : null;
    if (known(spare) && spare < 0)
      find(
        "io_deficit",
        b.id,
        "installed",
        "The physical bank has insufficient additional capacity.",
        "conflict",
      );
    return {
      bank_id: b.id,
      required: result(
        required,
        "channels",
        "Complete and reconcile physical device allocations.",
        [b.id],
      ),
      available: result(
        available,
        "channels",
        "Installed/used/reserved/faulty counts are incomplete.",
        [b.id],
      ),
      spare: result(
        spare,
        "channels",
        "Mismatch or incomplete assignment prevents a spare-capacity conclusion.",
        [b.id],
      ),
    };
  });
  for (const s of p.strategies.filter(active)) {
    const sensor = p.sensors.find((r) => r.id === s.sensor_id),
      controller = sensor?.control.controller_id
        ? controllerMap.get(sensor.control.controller_id)
        : undefined;
    const evidence = p.evidence.find((e) => e.id === s.capability_evidence_id);
    const targets = s.group_ids.map((id) => p.groups.find((g) => g.id === id));
    if (
      !usable(s) ||
      !usable(sensor) ||
      !s.trigger.trim() ||
      !s.reset_basis.trim() ||
      !s.fallback.trim() ||
      !targets.length ||
      targets.some((g) => !usable(g))
    )
      find(
        "strategy_dependency",
        s.id,
        "strategy",
        "Retain an applicable sensor, target groups, trigger, reset and fallback; excluded or unknown dependencies cannot establish a supported strategy.",
        "review",
      );
    if (
      !usable(controller) ||
      !controller?.model.trim() ||
      !controller.software.trim() ||
      !controller.licences.trim() ||
      !controller.evidence_ids.length ||
      sensor?.control.owner !== "ppo_controller" ||
      !sensor.control.bank_id ||
      invalidBanks.has(sensor.control.bank_id)
    )
      find(
        "strategy_controller",
        s.id,
        "sensor_id",
        "Confirm the sensor's controller, typed physical connection, exact model, software/licences and evidence before assessing controller strategy support.",
        "review",
      );
    if (
      !evidence ||
      evidence.kind !== "document_reference" ||
      !evidence.reference.trim() ||
      !evidence.source_revision.trim() ||
      !evidence.sha256 ||
      !evidence.attribution.trim() ||
      !evidence.applicability.trim()
    )
      find(
        "strategy_capability",
        s.id,
        "capability_evidence_id",
        "A named evidence row alone does not prove capability; retain the attributed exact document, revision/hash and applicable controller conditions.",
        "review",
      );
    const targetValves = targets
      .flatMap((g) =>
        (g?.valve_ids ?? []).map((id) => p.valves.find((v) => v.id === id)),
      )
      .filter((v): v is Valve => !!v);
    if (
      sensor?.crop_group_id &&
      targetValves.some(
        (v) =>
          !v.allocations.some((a) => a.crop_group_id === sensor.crop_group_id),
      )
    )
      find(
        "strategy_representation",
        s.id,
        "sensor_id",
        "The sensor's represented crop group does not cover every targeted physical valve; review its applicability.",
        "conflict",
      );
    if (
      targetValves.some(
        (v) =>
          v.control.owner !== "ppo_controller" ||
          v.control.controller_id !== sensor?.control.controller_id,
      )
    )
      find(
        "strategy_target_control",
        s.id,
        "group_ids",
        "Target valves do not share the sensor's declared PPO controller; cross-controller or manual actuation support remains unverified.",
        "review",
      );
    find(
      "strategy_units_held",
      s.id,
      "trigger",
      "Trigger quantities, units and reset semantics remain descriptive in this version; this record does not establish an executable or manufacturer-supported controller function.",
      "review",
    );
  }
  if (p.groscales.required === "yes") {
    const controller = p.controllers.find(
      (c) => c.id === p.groscales.controller_id,
    );
    if (controller?.family === "Compass")
      find(
        "groscales_compass",
        controller.id,
        "family",
        "GroScales conflicts with Dean's working Compact CC/Connext scoping requirement; exact manufacturer confirmation remains pending.",
        "conflict",
      );
    if (
      !controller ||
      !["Compact CC", "Connext"].includes(controller.family) ||
      !controller.model ||
      !controller.software ||
      !controller.licences ||
      !p.groscales.evidence_id ||
      p.groscales.mode === "unknown" ||
      (p.groscales.mode === "wireless" && !p.groscales.ancillary_hardware)
    )
      find(
        "groscales_evidence",
        null,
        "groscales",
        "Confirm exact controller, software/licences, wired/wireless mode and applicable ancillary hardware.",
        "review",
      );
  }
  const candidates: Calculation["candidates"] = p.candidates.map((c) => {
    const failures: string[] = [],
      unknowns: string[] = [];
    if (
      !c.variant ||
      !c.source_revision ||
      !c.arrangement ||
      !c.capability_evidence_id
    )
      unknowns.push(
        "Exact variant, arrangement and applicable capability source are incomplete.",
      );
    const controller = p.controllers.find((r) => r.id === c.controller_id);
    if (
      !controller ||
      !controller.model ||
      !controller.serial ||
      !controller.software ||
      !controller.licences ||
      !controller.evidence_ids.length
    )
      unknowns.push(
        "Exact controller identity, software/licences and applicable evidence are incomplete.",
      );
    if (!supportedProcess)
      unknowns.push(
        "The recorded process needs a separate applicability assessment.",
      );
    unknowns.push(
      "Manufacturer confirmation and authenticated project review remain separate from entered checks.",
    );
    if (
      known(c.minimum_m3h) &&
      known(c.maximum_m3h) &&
      c.minimum_m3h > c.maximum_m3h
    )
      failures.push("Entered flow envelope is reversed.");
    if (
      known(c.minimum_pressure_bar) &&
      known(c.maximum_pressure_bar) &&
      c.minimum_pressure_bar > c.maximum_pressure_bar
    )
      failures.push("Entered pressure envelope is reversed.");
    for (const g of groupFlows) {
      const flow = g.unit.value;
      if (!known(flow) || !known(c.minimum_m3h) || !known(c.maximum_m3h))
        unknowns.push(
          "Complete each operating duty and the configuration's entered flow envelope.",
        );
      if (
        known(flow) &&
        ((known(c.minimum_m3h) && flow < c.minimum_m3h) ||
          (known(c.maximum_m3h) && flow > c.maximum_m3h))
      )
        failures.push(`Group ${g.id} is outside entered flow limits.`);
    }
    if (!groupFlows.length)
      unknowns.push("No assessable operating group is selected.");
    const pressure =
      c.pressure_boundary === "unknown" ? null : c.proposed_pressure_bar;
    if (
      !known(pressure) ||
      !known(c.minimum_pressure_bar) ||
      !known(c.maximum_pressure_bar)
    )
      unknowns.push(
        "Record the proposed pressure and entered envelope at the same declared unit inlet/outlet boundary; required crop-outlet pressure is not substituted.",
      );
    if (
      known(pressure) &&
      ((known(c.minimum_pressure_bar) && pressure < c.minimum_pressure_bar) ||
        (known(c.maximum_pressure_bar) && pressure > c.maximum_pressure_bar))
    )
      failures.push(
        `Proposed ${c.pressure_boundary} pressure is outside entered limits; manufacturer evidence remains separate.`,
      );
    for (const i of injection) {
      const channels = p.channels.filter(
        (ch) =>
          ch.candidate_id === c.id && ch.stock_id === i.stock_id && active(ch),
      );
      if (channels.length !== 1) {
        unknowns.push(
          `An exact configured channel is required for stock ${i.stock_id}.`,
        );
        continue;
      }
      const ch = channels[0],
        need = i.required_lph.value;
      if (
        !known(need) ||
        !known(ch.minimum_lph) ||
        !known(ch.maximum_lph) ||
        !ch.conditions ||
        !ch.evidence_ids.length
      )
        unknowns.push(
          `Channel ${ch.id} injection conditions/evidence are incomplete.`,
        );
      if (
        (known(ch.minimum_lph) &&
          known(ch.maximum_lph) &&
          ch.minimum_lph > ch.maximum_lph) ||
        (known(need) &&
          ((known(ch.minimum_lph) && need < ch.minimum_lph) ||
            (known(ch.maximum_lph) && need > ch.maximum_lph)))
      )
        failures.push(
          `Channel ${ch.id} is outside entered injection limits; unconfirmed evidence does not cancel the failure.`,
        );
    }
    const technicalUnknowns = unknowns.length > 1;
    return {
      id: c.id,
      status: failures.length
        ? "outside_entered_limits"
        : technicalUnknowns
          ? "not_assessable"
          : "within_entered_checks_confirmation_pending",
      failures: [...new Set(failures)],
      unknowns: [...new Set(unknowns)],
    };
  });
  for (const f of p.filters.filter(active)) {
    const flow =
      f.path === "pump"
        ? pumpPeak
        : f.path === "unit"
          ? unitPeak
          : f.path === "crop"
            ? maximum(groupFlows.map((g) => g.crop.value))
            : null;
    if (!known(flow))
      find(
        "filter_path",
        f.id,
        "path",
        "Confirm the treatment component's actual hydraulic path and applicable duty.",
      );
    if (known(flow) && known(f.capacity_m3h) && flow > f.capacity_m3h)
      find(
        "filter_capacity",
        f.id,
        "capacity_m3h",
        "Duty exceeds the entered process capacity.",
        "conflict",
      );
  }
  const liveAreas = p.areas.filter(active),
    population = [...cropCounts.values()];
  const nonContainerCapture =
    !p.crop_groups.length &&
    liveValves.length > 0 &&
    liveValves.every(
      (v) =>
        ["measured", "design_allowance"].includes(v.flow_basis) &&
        v.allocations.every((a) => a.container_count === null),
    );
  return {
    edition: calculationEdition,
    scenario_id: scenario?.id ?? null,
    findings,
    area_m2: result(
      liveAreas.length
        ? sum(
            liveAreas.map((a) =>
              usable(a) && ["planted", "effective"].includes(a.area_basis)
                ? a.area_m2
                : null,
            ),
          )
        : null,
      "m²",
      "Declared effective/planted areas are incomplete; footprint is not silently substituted.",
    ),
    containers: result(
      population.length ? sum(population.map((c) => c.containers)) : null,
      "containers",
      nonContainerCapture
        ? "The captured measured/design-flow service basis has no container denominator."
        : "Population capture is unknown.",
      [],
      nonContainerCapture ? "not_applicable" : undefined,
    ),
    plants: result(
      population.length ? sum(population.map((c) => c.plants)) : null,
      "plants",
      nonContainerCapture
        ? "The captured measured/design-flow service basis has no plant-population denominator."
        : "Population capture is unknown.",
      [],
      nonContainerCapture ? "not_applicable" : undefined,
    ),
    daily_demand_m3: result(
      supportedProcess && population.length
        ? sum(population.map((c) => c.daily))
        : null,
      "m³/day",
      "Complete attributed demand and supported single-pass process are required.",
      [],
      supportedProcess ? undefined : "unsupported",
    ),
    connected_flow_m3h: result(
      valveFlows.length ? sum(valveFlows.map((v) => v.flow.value)) : null,
      "m³/h",
    ),
    operating_peak_m3h: result(unitPeak, "m³/h"),
    pump_peak_m3h: result(pumpPeak, "m³/h"),
    valve_flows: valveFlows,
    group_flows: groupFlows,
    coverage,
    schedule: { cycle_seconds: result(cycle, "s"), events, intervals },
    storage: {
      final_m3: result(
        finalStorage,
        "m³",
        "Bound source, storage and supported process required.",
        [],
        supportedProcess ? undefined : "unsupported",
      ),
      minimum_m3: result(
        minimumStorage,
        "m³",
        "Bound source and supported process required.",
        [],
        supportedProcess ? undefined : "unsupported",
      ),
      overflow_m3: result(
        overflow,
        "m³",
        "Bound source and supported process required.",
        [],
        supportedProcess ? undefined : "unsupported",
      ),
    },
    hydraulic: {
      required_head_m: result(
        head,
        "m",
        "Pressure, static lift and all entered losses are required; this is required duty, not an operating point.",
      ),
      curve_head_m: result(
        curveHead,
        "m",
        "No extrapolation beyond supplied curve points.",
      ),
      margin_m: result(
        matchingHeadBasis && known(head) && known(curveHead)
          ? curveHead - head
          : null,
        "m",
        "Loss-flow basis must exactly match pump duty before comparison.",
      ),
    },
    pipes: p.pipes.filter(active).map((pipe) => {
      const volume = pipeVolumeLitres(pipe.length_m, pipe.internal_diameter_mm);
      return {
        id: pipe.id,
        volume_l: result(volume, "L"),
        transit_seconds: result(
          known(volume) && positive(pipe.design_flow_m3h)
            ? (volume / 1000 / pipe.design_flow_m3h) * 3600
            : null,
          "s",
          "Ideal full-pipe displacement only; not proof of nutrient arrival or stability.",
        ),
      };
    }),
    injection,
    io,
    candidates,
  };
}
