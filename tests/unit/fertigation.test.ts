import assert from "node:assert/strict";
import { test } from "node:test";
import { performance } from "node:perf_hooks";
import {
  blankScope,
  blankArea,
  blankCropGroup,
  blankValve,
  blankMaster,
  blankSource,
  blankGroup,
  blankScenario,
  blankCandidate,
  blankControl,
  baseRecord,
  areaToM2,
  areaFromM2,
  families,
} from "../../src/estimating/fertigation/definition";
import {
  calculate,
  parseCurve,
  interpolateCurve,
  grossFromNet,
  depthVolumeM3,
  pipeVolumeLitres,
} from "../../src/estimating/fertigation/engine";
import { validateScope } from "../../src/estimating/fertigation/validation";
import type {
  Scope,
  ProductionContext,
} from "../../src/estimating/fertigation/types";
import { AppError } from "../../src/platform/errors";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const detail = (pattern: RegExp) => (error: unknown) =>
  error instanceof AppError &&
  error.status === 422 &&
  error.field_errors.some((f) => pattern.test(f.message));
function fixture(): Scope {
  const p = blankScope();
  p.name = "Synthetic commercial berry reference";
  p.production_context = {
    ...p.production_context,
    tags: ["commercial_berries"],
    crop_description: "Synthetic berries",
    growing_system: "hydroponic_soilless",
    application_method: "drip",
    hydraulic_arrangement: "single_pass",
  };
  p.areas = [20000, 10000].map((area, i) => ({
    ...blankArea(id(10 + i)),
    label: `Area ${i + 1}`,
    phase: "proposed",
    area_m2: area,
    area_basis: "planted",
    context: { ...p.production_context },
  }));
  p.crop_groups = [8000, 3000].map((count, i) => ({
    ...blankCropGroup(id(20 + i)),
    label: `Crop ${i + 1}`,
    phase: "proposed",
    area_id: p.areas[i].id,
    crop_description: "Synthetic crop",
    container_count: count,
    plant_count: count,
    plants_per_container: 1,
    missing_plants: 0,
    daily_l_per_container: 3,
    demand_basis: "gross",
    agronomic_author: "Synthetic fixture only",
  }));
  p.sources = [
    {
      ...blankSource(id(30)),
      label: "Synthetic tank",
      phase: "proposed",
      nominal_storage_m3: 1000,
      usable_storage_m3: 1000,
      reliable_flow_m3h: 100,
    },
  ];
  p.masters = [
    {
      ...blankMaster(id(40)),
      label: "Master",
      phase: "proposed",
      source_id: id(30),
      circuit: "one shared circuit",
    },
  ];
  p.valves = [4000, 4000, 3000].map((count, i) => ({
    ...blankValve(id(50 + i)),
    label: ["A1", "A2", "B1"][i],
    phase: "proposed",
    master_id: id(40),
    source_id: id(30),
    flow_basis: "emitter_inventory",
    emitter: {
      method: "independent",
      count: i < 2 ? 2 : 1,
      flow_lph: i < 2 ? 2 : 4,
      containers_per_emitter: 1,
      outlets_per_hub: i < 2 ? 1 : 4,
      verified_container_lph: null,
    },
    allocations: [
      {
        id: id(60 + i),
        area_id: id(i < 2 ? 10 : 11),
        crop_group_id: id(i < 2 ? 20 : 21),
        container_count: count,
        served_area_m2: null,
        flow_share_fraction: null,
      },
    ],
    control: {
      ...blankControl(),
      owner: "manual",
      additional_channels: 0,
      basis: "Manual valve; no PPO physical output",
    },
  }));
  p.groups = [[id(50), id(52)], [id(51)]].map((valve_ids, i) => ({
    ...blankGroup(id(70 + i)),
    label: `G${i + 1}`,
    phase: "proposed",
    valve_ids,
    prepare_seconds: 0,
    delivery_seconds: 180,
    flush_seconds: 0,
    flush_to_crop: "no",
    other_path: "none",
  }));
  p.scenarios = [
    {
      ...blankScenario(id(80)),
      label: "Synthetic basis",
      phase: "proposed",
      group_ids: p.groups.map((g) => g.id),
      cycles: 25,
      start_minute: 360,
      end_minute: 1080,
      spacing_min: 20,
      spacing_basis: "start_to_start",
      source_id: id(30),
      initial_storage_m3: 1000,
      refill_m3h: 0,
      reserve_m3: 0,
    },
  ];
  p.selected_scenario_id = id(80);
  return p;
}
const near = (actual: number | null, expected: number, tolerance = 1e-9) => {
  assert.notEqual(actual, null);
  assert.ok(
    Math.abs(actual! - expected) < tolerance,
    `${actual} differs from ${expected}`,
  );
};

test("FN-T06/T61 blank native scope is strict, neutral and incomplete-safe", () => {
  const p = blankScope();
  assert.deepEqual(validateScope(p), p);
  assert.deepEqual(p.production_context.tags, ["unknown"]);
  const c = calculate(p);
  assert.equal(c.connected_flow_m3h.value, null);
  assert.equal(c.containers.value, null);
  assert.equal(c.storage.final_m3.state, "unsupported");
});
test("FN-T19 CALC-01/02/03 independent berry arithmetic preserves 3ha/11000 and 44/28", () => {
  const p = validateScope(fixture()),
    c = calculate(p);
  assert.equal(c.area_m2.value, 30000);
  assert.equal(c.containers.value, 11000);
  assert.equal(c.plants.value, 11000);
  assert.equal(c.daily_demand_m3.value, 33);
  assert.equal(c.valve_flows[0].flow.value, 16);
  assert.equal(c.valve_flows[2].flow.value, 12);
  assert.equal(c.connected_flow_m3h.value, 44);
  assert.equal(c.operating_peak_m3h.value, 28);
});
test("FN-T19 emitter hub outlet count cannot multiply flow", () => {
  const p = fixture();
  p.valves[2].emitter.outlets_per_hub = 40;
  assert.equal(calculate(p).valve_flows[2].flow.value, 12);
});
test("FN-T20 density uses actual count first and only represented mixed crop area", () => {
  const p = fixture();
  p.crop_groups[0].containers_per_ha = 100;
  assert.equal(calculate(p).containers.value, 11000);
  p.crop_groups[0].container_count = null;
  p.crop_groups[0].containers_per_ha = 4000;
  assert.equal(calculate(p).containers.value, 11000);
  p.crop_groups.push({
    ...p.crop_groups[0],
    id: id(22),
    label: "Additional group",
    represented_area_m2: 10000,
  });
  assert.equal(calculate(p).containers.value, null);
  p.crop_groups[0].represented_area_m2 = 10000;
  assert.equal(calculate(p).containers.value, 11000);
});
test("FN-T20 missing plant count is unknown unless actual population was captured", () => {
  const p = fixture();
  p.crop_groups[0].plant_count = null;
  p.crop_groups[0].missing_plants = null;
  assert.equal(calculate(p).plants.value, null);
  p.crop_groups[0].missing_plants = 100;
  assert.equal(calculate(p).plants.value, 10900);
});
test("FN-T21 unknown/excluded master and allocated area withhold dependent flow", () => {
  for (const phase of ["unknown", "excluded", "future"] as const) {
    const p = fixture();
    p.masters[0].phase = phase;
    assert.equal(calculate(p).connected_flow_m3h.value, null);
  }
  const p = fixture();
  p.areas[0].phase = "excluded";
  assert.equal(calculate(p).operating_peak_m3h.value, null);
});
test("FN-T21 every physical phase dependency withholds measured/emitter duty and excluded crop demand", () => {
  for (const register of [
    "areas",
    "crop_groups",
    "masters",
    "sources",
  ] as const)
    for (const phase of ["unknown", "excluded", "future"] as const) {
      const p = fixture();
      p[register][0].phase = phase;
      p.valves[0].flow_basis = "measured";
      p.valves[0].measured_flow_m3h = 16;
      const c = calculate(validateScope(p));
      assert.equal(
        c.valve_flows.find((v) => v.id === p.valves[0].id)!.flow.value,
        null,
      );
      assert.equal(c.operating_peak_m3h.value, null);
      if (register === "areas" || register === "crop_groups")
        assert.equal(c.coverage[0].required_m3.value, null);
      if (phase === "future") {
        p.scenarios[0].include_future = true;
        assert.equal(calculate(p).connected_flow_m3h.value, 44);
      }
    }
});
test("FN-T22 per-allocation coverage catches 35m³/33m³ misleading aggregate", () => {
  const p = fixture();
  p.scenarios[0].group_ids = [id(70)];
  const c = calculate(p);
  near(
    c.coverage.reduce((n, r) => n + (r.delivered_m3.value ?? 0), 0),
    35,
  );
  assert.equal(c.daily_demand_m3.value, 33);
  assert.ok(
    c.findings.some(
      (f) => f.id.startsWith("not_scheduled") && f.record_id === id(61),
    ),
  );
  assert.equal(
    c.coverage.find((a) => a.valve_id === id(51))!.delivered_m3.value,
    0,
  );
});
test("FN-T19 event arithmetic gives 800 L and 0.2 L/container", () => {
  const p = fixture();
  p.scenarios[0].cycles = 1;
  const c = calculate(p);
  assert.equal(c.coverage[0].delivered_m3.value, 0.8);
  near((c.coverage[0].delivered_m3.value! * 1000) / 4000, 0.2);
});
test("FN-T80 over-allocation saves incomplete but has a blocking conflict finding", () => {
  const p = fixture();
  p.valves[0].allocations[0].container_count = 8001;
  validateScope(p);
  assert.ok(
    calculate(p).findings.some(
      (f) => f.id.startsWith("over_allocated") && f.severity === "conflict",
    ),
  );
});
test("FN-T80 malformed duplicate and foreign allocations fail structurally", () => {
  const p = fixture();
  p.valves[0].allocations.push({ ...p.valves[0].allocations[0], id: id(99) });
  assert.throws(() => validateScope(p), detail(/Duplicate service/));
  const q = fixture();
  q.valves[0].allocations[0].area_id = id(999);
  assert.throws(() => validateScope(q), detail(/referenced record/));
});
test("FN-T81 only active hydraulic basis counts and dormant observations remain unchanged", () => {
  const p = fixture();
  p.valves[0].measured_flow_m3h = 9;
  p.valves[0].design_flow_m3h = 10;
  assert.equal(calculate(p).valve_flows[0].flow.value, 16);
  p.valves[0].flow_basis = "measured";
  assert.equal(calculate(p).valve_flows[0].flow.value, 9);
  p.valves[0].flow_basis = "design_allowance";
  assert.equal(calculate(p).valve_flows[0].flow.value, 10);
  assert.equal(p.valves[0].emitter.flow_lph, 2);
});
test("FN-T69 measured non-container scope saves and does not invent crop distribution", () => {
  const p = fixture();
  p.valves[0].flow_basis = "measured";
  p.valves[0].measured_flow_m3h = 16;
  p.valves[0].allocations[0].container_count = null;
  validateScope(p);
  const c = calculate(p);
  assert.equal(c.valve_flows[0].flow.value, 16);
  assert.equal(c.coverage[0].delivered_m3.value, null);
  p.valves[0].allocations[0].flow_share_fraction = 1;
  near(calculate(p).coverage[0].delivered_m3.value, 20);
});
test("FN-T62/T68/T72 neutral context labels preserve description and identical hydraulics", () => {
  for (const tags of [
    ["commercial_berries"],
    ["commercial_nursery"],
    ["medicinal_cannabis"],
    ["other"],
  ] as ProductionContext["tags"][]) {
    const p = fixture();
    p.production_context.tags = tags;
    p.crop_groups[0].crop_description = "Non-berry plant group";
    const q = validateScope(JSON.parse(JSON.stringify(p)));
    assert.equal(q.crop_groups[0].crop_description, "Non-berry plant group");
    assert.equal(calculate(q).connected_flow_m3h.value, 44);
  }
});
test("FN-T70 return and recirculation retain facts but withhold consumption/storage", () => {
  for (const arrangement of [
    "recirculating",
    "collected_return",
    "mixed",
  ] as const) {
    const p = fixture();
    p.production_context.hydraulic_arrangement = arrangement;
    const c = calculate(validateScope(p));
    assert.equal(c.connected_flow_m3h.value, 44);
    assert.equal(c.daily_demand_m3.state, "unsupported");
    assert.equal(c.storage.final_m3.value, null);
  }
});
test("FN-T71 ebb-and-flow or unknown per-area process withholds berry consumption model", () => {
  const p = fixture();
  p.production_context.application_method = "ebb_and_flow";
  assert.equal(calculate(p).daily_demand_m3.state, "unsupported");
  p.production_context.application_method = "drip";
  p.areas[0].context.hydraulic_arrangement = "unknown";
  assert.equal(calculate(p).storage.final_m3.value, null);
});
test("FN-T20 unknown area role cannot substitute footprint in density derivation", () => {
  const p = fixture();
  p.crop_groups[0].container_count = null;
  p.crop_groups[0].containers_per_ha = 4000;
  p.areas[0].area_basis = "unknown";
  assert.equal(calculate(p).containers.value, null);
});
test("FN-T21 unknown group phase withholds timeline and delivered results", () => {
  const p = fixture();
  p.groups[0].phase = "unknown";
  const c = calculate(p);
  assert.equal(c.schedule.events.length, 0);
  assert.equal(c.coverage[0].delivered_m3.value, null);
});
test("FN-T24 distinct declared circuits are retained without pooled duty or timeline", () => {
  const p = fixture();
  p.masters.push({
    ...p.masters[0],
    id: id(41),
    label: "Other master",
    circuit: "independent circuit",
  });
  p.valves[2].master_id = id(41);
  const c = calculate(validateScope(p));
  assert.equal(c.operating_peak_m3h.value, null);
  assert.equal(c.schedule.events.length, 0);
  assert.ok(c.findings.some((f) => f.id.startsWith("parallel_circuits")));
});
test("FN-T69 no fabricated per-container denominator for measured non-container capture", () => {
  const p = fixture();
  p.crop_groups = [];
  p.valves = [
    {
      ...p.valves[0],
      flow_basis: "measured",
      measured_flow_m3h: 5,
      allocations: [],
    },
  ];
  p.groups = [{ ...p.groups[0], valve_ids: [p.valves[0].id] }];
  p.scenarios[0].group_ids = [p.groups[0].id];
  const c = calculate(validateScope(p));
  assert.equal(c.containers.state, "not_applicable");
  assert.equal(c.plants.state, "not_applicable");
  assert.equal(c.connected_flow_m3h.value, 5);
});
test("FN-T67 exact m²/ha conversion never multiplies by implicit growing levels", () => {
  assert.equal(areaToM2(2, "ha"), 20000);
  assert.equal(areaFromM2(20000, "ha"), 2);
  assert.equal(areaToM2(1200, "m2"), 1200);
  const p = fixture();
  p.areas[0].area_basis = "footprint";
  assert.equal(calculate(p).area_m2.value, null);
});
test("CALC-05/06 independent depth and confirmed net-to-gross dimensional checks", () => {
  assert.equal(depthVolumeM3(1, 20000), 20);
  assert.equal(grossFromNet(80, 0.2, true), 100);
  assert.equal(grossFromNet(80, 0.2, false), null);
  assert.equal(grossFromNet(80, 1, true), null);
});
test("FN-T27 optional curve columns preserve 10,20,,3 and forbid extrapolation", () => {
  const points = parseCurve("10,20,,3\n20,10,80,5");
  assert.equal(points[0].efficiency_percent, null);
  assert.equal(points[0].power_kw, 3);
  assert.equal(interpolateCurve(points, 15), 15);
  assert.equal(interpolateCurve(points, 9), null);
  assert.equal(interpolateCurve(points, 21), null);
});
test("FN-T27 curve parser rejects invalid finite/range/duplicate/units inputs", () => {
  for (const text of [
    "10,20,101,3",
    "10,20,-1,3",
    "10,20,x,3",
    "10,20\n10,30",
    "10,20\n5,30",
    "10m3,20",
    "Infinity,20",
    "10,20,,,3",
    "10,,3",
  ])
    assert.throws(() => parseCurve(text));
  assert.throws(() => parseCurve("10,20", 0));
});
test("CALC-08 full pipe volume and displacement remain bounded estimates", () => {
  near(pipeVolumeLitres(100, 50), 196.34954084936206);
  near((pipeVolumeLitres(100, 50)! / 1000 / 10) * 3600, 70.68583470577035);
  assert.equal(pipeVolumeLitres(100, 0), null);
});
test("FN-T26 pump-only backwash changes 36 pump versus 28 unit", () => {
  const p = fixture();
  p.groups[0].other_path = "pump_only";
  p.groups[0].other_pump_flow_m3h = 8;
  const c = calculate(p);
  assert.equal(c.pump_peak_m3h.value, 36);
  assert.equal(c.operating_peak_m3h.value, 28);
  p.groups[0].other_path = "unknown";
  assert.equal(calculate(p).pump_peak_m3h.value, null);
});
test("FN-T23/T24 six distinct physical valves yield 24-minute cycle and 21-minute dry limit failure", () => {
  const p = fixture();
  p.valves = Array.from({ length: 6 }, (_, i) => ({
    ...p.valves[0],
    id: id(100 + i),
    label: `V${i}`,
    flow_basis: "measured",
    measured_flow_m3h: 1,
    allocations: [],
  }));
  p.groups = p.valves.map((v, i) => ({
    ...p.groups[0],
    id: id(110 + i),
    label: `G${i}`,
    valve_ids: [v.id],
    prepare_seconds: 60,
    delivery_seconds: 180,
    maximum_dry_min: 20,
  }));
  p.scenarios[0].group_ids = p.groups.map((g) => g.id);
  p.scenarios[0].cycles = 2;
  p.scenarios[0].spacing_min = 24;
  const c = calculate(validateScope(p));
  assert.equal(c.schedule.cycle_seconds.value, 1440);
  assert.equal(c.schedule.intervals[0].maximum_dry_min, 21);
  assert.ok(c.findings.some((f) => f.id.startsWith("dry_interval")));
  p.groups.forEach((g) => {
    g.valve_ids = [p.valves[0].id];
  });
  assert.equal(calculate(p).schedule.intervals[0].maximum_dry_min, 1);
});
test("FN-T23 crop-directed flush changes physical dry interval", () => {
  const p = fixture();
  p.scenarios[0].group_ids = [id(70)];
  p.groups[0].flush_seconds = 60;
  p.groups[0].flush_to_crop = "yes";
  const c = calculate(p);
  assert.equal(c.schedule.intervals[0].maximum_dry_min, 16);
  p.groups[0].flush_to_crop = "no";
  assert.equal(calculate(p).schedule.intervals[0].maximum_dry_min, 17);
});
test("FN-T24 unknown spacing and oversized/overnight schedule cannot present complete delivery", () => {
  const p = fixture();
  p.scenarios[0].spacing_basis = "unknown";
  assert.equal(calculate(p).schedule.events.length, 0);
  p.scenarios[0].spacing_basis = "start_to_start";
  p.scenarios[0].end_minute = 100;
  assert.equal(calculate(p).schedule.events.length, 0);
});
test("FN-T25 independent storage example retains six m³", () => {
  const p = fixture();
  p.valves = [
    {
      ...p.valves[0],
      flow_basis: "measured",
      measured_flow_m3h: 5,
      allocations: [],
    },
  ];
  p.groups = [
    { ...p.groups[0], valve_ids: [p.valves[0].id], delivery_seconds: 7200 },
  ];
  p.scenarios[0] = {
    ...p.scenarios[0],
    group_ids: [p.groups[0].id],
    initial_storage_m3: 10,
    refill_m3h: 3,
    cycles: 1,
    spacing_min: 120,
  };
  const c = calculate(p);
  assert.equal(c.storage.final_m3.value, 6);
  p.scenarios[0].initial_storage_m3 = 1;
  assert.ok(
    calculate(p).findings.some((f) => f.id.startsWith("storage_shortage")),
  );
});
test("FN-T25 unrelated source cannot refill the selected circuit", () => {
  const p = fixture();
  p.sources.push({ ...p.sources[0], id: id(31), label: "Unrelated" });
  p.scenarios[0].source_id = id(31);
  const c = calculate(p);
  assert.equal(c.storage.final_m3.value, null);
  assert.ok(c.findings.some((f) => f.id.startsWith("storage_source")));
});
function storageFixture(): Scope {
  const p = fixture();
  p.sources[0] = {
    ...p.sources[0],
    nominal_storage_m3: 5,
    usable_storage_m3: 5,
    reliable_flow_m3h: 4,
  };
  p.valves = [
    {
      ...p.valves[0],
      flow_basis: "measured",
      measured_flow_m3h: 2,
      allocations: [],
    },
  ];
  p.groups = [
    { ...p.groups[0], valve_ids: [p.valves[0].id], delivery_seconds: 3600 },
  ];
  p.scenarios[0] = {
    ...p.scenarios[0],
    group_ids: [p.groups[0].id],
    cycles: 1,
    spacing_min: 60,
    initial_storage_m3: 4,
    reserve_m3: 4.5,
    refill_m3h: 4,
  };
  return p;
}
test("FN-T25 independent overflow and reserve calculation preserves capped balance and findings", () => {
  const c = calculate(validateScope(storageFixture()));
  assert.equal(c.storage.final_m3.value, 5);
  assert.equal(c.storage.minimum_m3.value, 4);
  assert.equal(c.storage.overflow_m3.value, 1);
  assert.ok(c.findings.some((f) => f.id.startsWith("storage_reserve")));
  assert.ok(c.findings.some((f) => f.id.startsWith("storage_overflow")));
});
test("FN-T25 contradictory tank, initial, reserve or reliable refill holds the storage conclusion", () => {
  for (const change of [
    (p: Scope) => {
      p.sources[0].usable_storage_m3 = 6;
    },
    (p: Scope) => {
      p.scenarios[0].initial_storage_m3 = 6;
    },
    (p: Scope) => {
      p.scenarios[0].reserve_m3 = 6;
    },
    (p: Scope) => {
      p.scenarios[0].refill_m3h = 5;
    },
  ]) {
    const p = storageFixture();
    change(p);
    const c = calculate(validateScope(p));
    assert.equal(c.storage.final_m3.value, null);
    assert.equal(c.storage.overflow_m3.value, null);
    assert.ok(
      c.findings.some((f) =>
        [
          "storage_capacity",
          "initial_capacity",
          "reserve_capacity",
          "refill_supply",
        ].some((code) => f.id.startsWith(code)),
      ),
    );
  }
  const p = storageFixture();
  p.sources[0].reliable_flow_m3h = -1;
  assert.throws(() => validateScope(p));
  p.sources[0].reliable_flow_m3h = 4;
  p.scenarios[0].refill_m3h = -1;
  assert.throws(() => validateScope(p));
});
test("FN-T30 injected 56 L/h fails hypothetical 50 even while unverified", () => {
  const p = fixture();
  p.recipes = [
    {
      ...baseRecord(id(90), "Synthetic recipe"),
      phase: "proposed",
      author: "Synthetic only",
      revision: "r01",
      ec_target_mscm: null,
      ph_target: null,
      ec_basis: "unknown",
      composition: "",
      changeover: "",
    },
  ];
  p.groups[0].recipe_id = id(90);
  p.stocks = [
    {
      ...baseRecord(id(91), "Synthetic stock"),
      phase: "proposed",
      recipe_id: id(90),
      function: "nutrient",
      dose_l_m3: 2,
      usable_l: null,
      concentration: "",
      conditions: "",
    },
  ];
  p.candidates = [
    {
      ...blankCandidate(id(92), "NutriJet Bypass"),
      minimum_m3h: 5,
      maximum_m3h: 50,
    },
  ];
  p.channels = [
    {
      ...baseRecord(id(93), "Hypothetical channel"),
      phase: "proposed",
      candidate_id: id(92),
      stock_id: id(91),
      minimum_lph: 0,
      maximum_lph: 50,
      conditions: "Hypothetical test only",
    },
  ];
  const c = calculate(validateScope(p));
  assert.equal(c.injection[0].required_lph.value, 56);
  assert.equal(c.candidates[0].status, "outside_entered_limits");
  assert.ok(c.candidates[0].unknowns.length);
  assert.ok(c.candidates[0].failures.some((f) => f.includes("injection")));
});
test("FN-T31 five family labels never establish capability by default", () => {
  const p = fixture();
  p.candidates = families.map((f, i) => blankCandidate(id(200 + i), f));
  assert.ok(
    calculate(p).candidates.every((c) => c.status === "not_assessable"),
  );
});
test("FN-T28 candidate inlet pressure never substitutes downstream outlet duty", () => {
  const p = fixture();
  p.hydraulics.outlet_pressure_bar = 100;
  p.candidates = [
    {
      ...blankCandidate(id(205), "NutriFit"),
      minimum_pressure_bar: 1,
      maximum_pressure_bar: 5,
    },
  ];
  assert.equal(calculate(p).candidates[0].failures.length, 0);
  p.candidates[0].proposed_pressure_bar = 6;
  assert.equal(calculate(p).candidates[0].failures.length, 0);
  p.candidates[0].pressure_boundary = "unit_inlet";
  assert.ok(
    calculate(validateScope(p)).candidates[0].failures.some((f) =>
      f.includes("unit_inlet"),
    ),
  );
});
test("FN-T33 GroScales Compass conflict is working policy with missing exact evidence", () => {
  const p = fixture();
  p.controllers = [
    {
      ...baseRecord(id(95), "Synthetic Compass"),
      family: "Compass",
      asset_id: null,
      model: "",
      serial: "",
      software: "",
      licences: "",
    },
  ];
  p.groscales = {
    required: "yes",
    mode: "wireless",
    controller_id: id(95),
    ancillary_hardware: "",
    evidence_id: null,
  };
  assert.ok(
    calculate(validateScope(p)).findings.some((f) =>
      f.id.startsWith("groscales_compass"),
    ),
  );
});
test("FN-T82 manual/external valves require an explicit zero-channel basis", () => {
  const p = fixture();
  p.valves[0].control.basis = "";
  assert.throws(() => validateScope(p), detail(/Zero additional/));
  p.valves[0].control.basis = "Manual";
  p.valves[0].control.additional_channels = 1;
  assert.throws(() => validateScope(p), detail(/Manual\/external/));
});
test("FN-T83 typed I/O mismatches and duplicate physical channels withhold spare capacity", () => {
  const p = fixture();
  p.controllers = [
    {
      ...baseRecord(id(210), "Controller"),
      phase: "proposed",
      family: "Connext",
      asset_id: null,
      model: "unknown",
      serial: "",
      software: "",
      licences: "",
    },
  ];
  p.banks = [
    {
      ...baseRecord(id(211), "Bank"),
      phase: "proposed",
      controller_id: id(210),
      physical_bank: "BUS-A/M1",
      signal: "digital_output",
      voltage: "24 V AC",
      installed: 8,
      used: 0,
      reserved: 0,
      faulty: 0,
      manual_required: 2,
    },
  ];
  p.valves[0].control = {
    owner: "ppo_controller",
    controller_id: id(210),
    bank_id: id(211),
    channel: "1",
    signal: "digital_output",
    voltage: "24 V AC",
    additional_channels: 1,
    basis: "One physical output",
  };
  p.valves[1].control = { ...p.valves[0].control, channel: "2" };
  assert.equal(calculate(validateScope(p)).io[0].spare.value, 6);
  p.valves[1].control.channel = "1";
  assert.equal(calculate(p).io[0].spare.value, null);
  p.valves[1].control.channel = "2";
  p.valves[1].control.signal = "analogue_output";
  assert.equal(calculate(p).io[0].spare.value, null);
});
function ioFixture(): Scope {
  const p = fixture();
  p.controllers = [
    {
      ...baseRecord(id(210), "Controller"),
      phase: "proposed",
      family: "Connext",
      asset_id: null,
      model: "Synthetic model",
      serial: "SYN-1",
      software: "synthetic",
      licences: "synthetic",
    },
  ];
  p.banks = [
    {
      ...baseRecord(id(211), "Bank"),
      phase: "proposed",
      controller_id: id(210),
      physical_bank: "BUS-A/M1",
      signal: "digital_output",
      voltage: "24 V AC",
      installed: 8,
      used: 0,
      reserved: 0,
      faulty: 0,
      manual_required: 1,
    },
  ];
  p.valves[0].control = {
    owner: "ppo_controller",
    controller_id: id(210),
    bank_id: id(211),
    channel: "1",
    signal: "digital_output",
    voltage: "24 V AC",
    additional_channels: 1,
    basis: "One physical output",
  };
  return p;
}
test("FN-T34 applicable controller/device/bank and explicit voltage/address are required for spare I/O", () => {
  assert.equal(calculate(validateScope(ioFixture())).io[0].spare.value, 7);
  for (const change of [
    (p: Scope) => {
      p.controllers[0].phase = "excluded";
    },
    (p: Scope) => {
      p.controllers[0].phase = "unknown";
    },
    (p: Scope) => {
      p.valves[0].phase = "unknown";
    },
    (p: Scope) => {
      p.banks[0].physical_bank = "";
    },
    (p: Scope) => {
      p.valves[0].control.voltage = "24 V DC";
    },
    (p: Scope) => {
      p.valves[0].control.channel = "";
    },
    (p: Scope) => {
      p.valves[0].control.bank_id = null;
    },
  ]) {
    const p = ioFixture();
    change(p);
    assert.equal(calculate(validateScope(p)).io[0].spare.value, null);
  }
  const p = ioFixture();
  p.banks[0].used = 9;
  assert.ok(calculate(p).findings.some((f) => f.id.startsWith("io_counts")));
});
test("FN-T34 universal physical bank cannot be doubled across signal types; excluded alternatives do not poison active bank", () => {
  const p = ioFixture();
  p.banks.push({
    ...p.banks[0],
    id: id(212),
    physical_bank: " bus-a/m1 ",
    signal: "analogue_input",
  });
  assert.equal(calculate(validateScope(p)).io[0].spare.value, null);
  assert.ok(
    calculate(p).findings.some((f) => f.id.startsWith("bank_double_count")),
  );
  p.banks[1].phase = "excluded";
  assert.equal(calculate(p).io[0].spare.value, 7);
  p.banks[1].phase = "future";
  assert.equal(calculate(p).io[0].spare.value, 7);
  p.scenarios[0].include_future = true;
  assert.equal(calculate(p).io[0].spare.value, null);
});
test("FN-T35 strategy phase, representation, controller licence, evidence and unit dependencies stay explicit", () => {
  const p = ioFixture();
  p.evidence = [
    {
      id: id(230),
      label: "Synthetic observation",
      kind: "observation",
      reference: "recorded description",
      source_revision: "",
      sha256: null,
      captured_date: null,
      attribution: "",
      applicability: "",
      notes: "",
    },
  ];
  p.sensors = [
    {
      ...baseRecord(id(231), "Synthetic sensor"),
      phase: "proposed",
      measurement: "Moisture",
      crop_group_id: p.crop_groups[0].id,
      control: { ...p.valves[0].control, channel: "2" },
      representative_basis: "Only crop A",
    },
  ];
  p.banks[0].manual_required = 2;
  p.strategies = [
    {
      ...baseRecord(id(232), "Descriptive strategy"),
      phase: "proposed",
      trigger: "Entered trigger",
      sensor_id: id(231),
      group_ids: [p.groups[0].id],
      reset_basis: "Entered reset",
      fallback: "Manual review",
      capability_evidence_id: id(230),
    },
  ];
  const c = calculate(validateScope(p));
  for (const code of [
    "strategy_capability",
    "strategy_representation",
    "strategy_controller",
    "strategy_target_control",
    "strategy_units_held",
  ])
    assert.ok(
      c.findings.some((f) => f.id.startsWith(code)),
      code,
    );
  p.sensors[0].phase = "excluded";
  assert.ok(
    calculate(p).findings.some((f) => f.id.startsWith("strategy_dependency")),
  );
  p.sensors[0].phase = "proposed";
  p.controllers[0].licences = "";
  assert.ok(
    calculate(p).findings.some((f) => f.id.startsWith("strategy_controller")),
  );
});
test("FN-T08/T36 strict native keys refuse approval/synthetic/result spoofing", () => {
  for (const field of [
    "reviewer",
    "approved",
    "synthetic",
    "results",
    "company_id",
  ])
    assert.throws(
      () => validateScope({ ...blankScope(), [field]: true }),
      detail(/declared fields/),
    );
});
test("FN-T41 strict number/date/identity checks reject malformed snapshots atomically", () => {
  for (const value of [NaN, Infinity, -1, "1", ""]) {
    const p = fixture();
    (p.valves[0] as unknown as Record<string, unknown>).measured_flow_m3h =
      value;
    assert.throws(() => validateScope(p));
  }
  const p = fixture();
  p.valves[1].id = p.valves[0].id;
  assert.throws(() => validateScope(p), detail(/unique/));
  const q = fixture();
  q.evidence = [
    {
      id: id(301),
      label: "Source",
      kind: "observation",
      reference: "",
      source_revision: "",
      sha256: null,
      captured_date: "2026-02-30",
      attribution: "",
      applicability: "",
      notes: "",
    },
  ];
  assert.throws(() => validateScope(q), detail(/valid YYYY/));
});
test("FN-T84 referenced master removal fails before any proposal is accepted", () => {
  const p = fixture(),
    original = JSON.stringify(p);
  p.masters = [];
  assert.throws(() => validateScope(p), detail(/referenced record/));
  assert.ok(original.includes("Master"));
});
test("FN-T71 engine is deterministic and does not mutate dormant inputs or scenarios", () => {
  const p = fixture(),
    bytes = JSON.stringify(p);
  const a = calculate(p),
    b = calculate(p);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(p), bytes);
});
test("FN-T56 100-area/1000-valve graph stays within bounded native snapshot and calculation", () => {
  const p = fixture();
  p.areas = Array.from({ length: 100 }, (_, i) => ({
    ...p.areas[0],
    id: id(1000 + i),
    label: `Area ${i}`,
  }));
  p.crop_groups = [];
  p.valves = Array.from({ length: 1000 }, (_, i) => ({
    ...p.valves[0],
    id: id(2000 + i),
    label: `Valve ${i}`,
    flow_basis: "design_allowance",
    design_flow_m3h: 1,
    allocations: [
      {
        id: id(4000 + i),
        area_id: p.areas[i % 100].id,
        crop_group_id: null,
        container_count: null,
        served_area_m2: 20,
        flow_share_fraction: 1,
      },
    ],
  }));
  p.groups = Array.from({ length: 100 }, (_, i) => ({
    ...p.groups[0],
    id: id(6000 + i),
    label: `Group ${i}`,
    valve_ids: p.valves.slice(i * 10, i * 10 + 10).map((v) => v.id),
  }));
  p.scenarios[0].group_ids = p.groups.map((g) => g.id);
  p.scenarios[0].cycles = 3;
  p.scenarios[0].spacing_min = 300;
  const start = performance.now(),
    q = validateScope(p),
    c = calculate(q),
    elapsed = performance.now() - start;
  assert.equal(c.connected_flow_m3h.value, 1000);
  assert.equal(c.schedule.events.length, 300);
  assert.ok(Buffer.byteLength(JSON.stringify(q)) < 2097152);
  assert.ok(
    elapsed < 10000,
    `Bounded unit calculation took ${elapsed} ms; API/UI are separate gates.`,
  );
});
