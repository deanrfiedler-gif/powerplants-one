import { invalid, uuid, dateOnly } from "../../shared/validation";
import type { Scope } from "./types";
import { families } from "./definition";

export const MAX_BYTES = 2 * 1024 * 1024;
type Rule = (value: unknown, field: string) => unknown;
const text: Rule = (v, f) => {
  if (
    typeof v !== "string" ||
    v.length > 4000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)
  )
    invalid(f, "Use at most 4,000 characters of plain text.");
  return v;
};
const name: Rule = (v, f) => {
  text(v, f);
  if (!(v as string).trim() || (v as string).length > 200)
    invalid(f, "Enter a label of 1–200 characters.");
  return v;
};
const num: Rule = (v, f) => {
  if (
    v !== null &&
    (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1e12)
  )
    invalid(f, "Enter a finite non-negative number, or leave unknown.");
  return v;
};
const signed: Rule = (v, f) => {
  if (
    v !== null &&
    (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e12)
  )
    invalid(f, "Enter a finite number, or leave unknown.");
  return v;
};
const integer: Rule = (v, f) => {
  num(v, f);
  if (v !== null && !Number.isSafeInteger(v))
    invalid(f, "Enter a whole number.");
  return v;
};
const fraction: Rule = (v, f) => {
  num(v, f);
  if (v !== null && Number(v) > 1)
    invalid(f, "Use a fraction between zero and one.");
  return v;
};
const bool: Rule = (v, f) => {
  if (typeof v !== "boolean") invalid(f, "An explicit boolean is required.");
  return v;
};
const id: Rule = (v, f) => uuid(v, f);
const ref: Rule = (v, f) => (v === null ? null : uuid(v, f));
const date: Rule = (v, f) => (v === null ? null : dateOnly(v, f));
const choice =
  (...values: readonly (string | number)[]): Rule =>
  (v, f) => {
    if (!values.includes(v as string)) invalid(f, "Choose a supported value.");
    return v;
  };
const array =
  (rule: Rule, max: number): Rule =>
  (v, f) => {
    if (!Array.isArray(v) || v.length > max)
      invalid(f, `Use at most ${max} items.`);
    return (v as unknown[]).map((x, i) => rule(x, `${f}[${i}]`));
  };
const uniqueRefs: Rule = (v, f) => {
  const result = array(id, 2000)(v, f) as string[];
  if (new Set(result).size !== result.length)
    invalid(f, "Duplicate relationships are not accepted.");
  return result;
};
const object =
  (rules: Record<string, Rule>): Rule =>
  (v, f) => {
    if (!v || typeof v !== "object" || Array.isArray(v))
      invalid(f, "An object is required.");
    const p = v as Record<string, unknown>,
      keys = Object.keys(rules);
    if (
      Object.keys(p).length !== keys.length ||
      Object.keys(p).some((k) => !Object.hasOwn(rules, k))
    )
      invalid(
        f,
        "Retain exactly the declared fields; unknown or missing fields are not accepted.",
      );
    return Object.fromEntries(
      keys.map((k) => [k, rules[k](p[k], `${f}.${k}`)]),
    );
  };
const phase = choice("existing", "proposed", "future", "excluded", "unknown");
const common = {
  id,
  label: name,
  phase,
  evidence_ids: uniqueRefs,
  notes: text,
};
const signal = choice(
  "unknown",
  "digital_output",
  "digital_input",
  "analogue_input",
  "analogue_output",
  "pulse",
  "bus",
);
const intent = choice("unknown", "retain", "replace", "new", "inspect");
const context = object({
  tags: array(
    choice(
      "commercial_berries",
      "commercial_nursery",
      "medicinal_cannabis",
      "other",
      "unknown",
    ),
    5,
  ),
  crop_description: text,
  growing_system: choice("unknown", "hydroponic_soilless", "soil", "other"),
  application_method: choice(
    "unknown",
    "drip",
    "overhead",
    "ebb_and_flow",
    "other",
  ),
  hydraulic_arrangement: choice(
    "unknown",
    "single_pass",
    "collected_return",
    "recirculating",
    "mixed",
  ),
  source_note: text,
});
const control = object({
  owner: choice("unknown", "ppo_controller", "manual", "external"),
  controller_id: ref,
  bank_id: ref,
  channel: text,
  signal,
  voltage: text,
  additional_channels: integer,
  basis: text,
});
const emitter = object({
  method: choice("unknown", "independent", "verified_per_container"),
  count: num,
  flow_lph: num,
  containers_per_emitter: num,
  outlets_per_hub: integer,
  verified_container_lph: num,
});
const allocation = object({
  id,
  area_id: ref,
  crop_group_id: ref,
  container_count: integer,
  served_area_m2: num,
  flow_share_fraction: fraction,
});
const curve = object({
  flow_m3h: (v, f) => {
    if (v === null) invalid(f, "Curve flow is required.");
    return num(v, f);
  },
  head_m: (v, f) => {
    if (v === null) invalid(f, "Curve head is required.");
    return num(v, f);
  },
  efficiency_percent: (v, f) => {
    num(v, f);
    if (Number(v) > 100) invalid(f, "Efficiency cannot exceed 100%. ");
    return v;
  },
  power_kw: num,
});
const schema = object({
  schema_version: choice(1),
  name,
  production_context: context,
  areas: array(
    object({
      ...common,
      facility_id: ref,
      facility_version: integer,
      area_m2: num,
      entered_area_unit: choice("m2", "ha"),
      area_basis: choice("unknown", "footprint", "planted", "effective"),
      context,
    }),
    100,
  ),
  crop_groups: array(
    object({
      ...common,
      area_id: ref,
      crop_description: text,
      represented_area_m2: num,
      container_count: integer,
      containers_per_ha: num,
      plants_per_container: num,
      plant_count: integer,
      missing_plants: integer,
      daily_l_per_container: num,
      demand_basis: choice("unknown", "gross", "net"),
      drain_fraction: fraction,
      drain_definition_confirmed: bool,
      agronomic_author: text,
    }),
    500,
  ),
  valves: array(
    object({
      ...common,
      master_id: ref,
      source_id: ref,
      asset_id: ref,
      intent,
      location: text,
      model: text,
      pressure_bar: num,
      flow_basis: choice(
        "unknown",
        "emitter_inventory",
        "measured",
        "design_allowance",
      ),
      measured_flow_m3h: num,
      design_flow_m3h: num,
      flow_evidence_id: ref,
      emitter,
      allocations: array(allocation, 100),
      control,
      inrush_va: num,
      holding_va: num,
      feedback: text,
    }),
    1000,
  ),
  masters: array(
    object({
      ...common,
      source_id: ref,
      circuit: text,
      location: text,
      model: text,
      pressure_bar: num,
      intent,
      control,
    }),
    200,
  ),
  sources: array(
    object({
      ...common,
      type: text,
      reliable_flow_m3h: num,
      pressure_bar: num,
      nominal_storage_m3: num,
      usable_storage_m3: num,
      conditions: text,
    }),
    100,
  ),
  groups: array(
    object({
      ...common,
      valve_ids: uniqueRefs,
      recipe_id: ref,
      delivery_seconds: num,
      prepare_seconds: num,
      flush_seconds: num,
      flush_to_crop: choice("unknown", "yes", "no"),
      other_pump_flow_m3h: num,
      other_unit_flow_m3h: num,
      other_path: choice("unknown", "none", "pump_only", "through_unit"),
      maximum_dry_min: num,
      minimum_rest_min: num,
      maximum_start_interval_min: num,
    }),
    500,
  ),
  scenarios: array(
    object({
      ...common,
      group_ids: uniqueRefs,
      include_future: bool,
      cycles: integer,
      start_minute: num,
      end_minute: num,
      spacing_min: num,
      spacing_basis: choice("start_to_start", "end_to_start", "unknown"),
      source_id: ref,
      initial_storage_m3: num,
      refill_m3h: num,
      reserve_m3: num,
    }),
    50,
  ),
  selected_scenario_id: ref,
  hydraulics: object({
    pump_model: text,
    curve_evidence_id: ref,
    speed_rpm: num,
    outlet_pressure_bar: num,
    static_head_m: signed,
    pipe_loss_m: num,
    filter_loss_m: num,
    unit_loss_m: num,
    other_loss_m: num,
    head_basis_flow_m3h: num,
    curve_points: array(curve, 2000),
    notes: text,
  }),
  pipes: array(
    object({
      ...common,
      from: text,
      to: text,
      length_m: num,
      internal_diameter_mm: num,
      design_flow_m3h: num,
      loss_basis: text,
    }),
    500,
  ),
  filters: array(
    object({
      ...common,
      process: text,
      path: choice("unknown", "pump", "unit", "crop"),
      capacity_m3h: num,
      dirty_loss_m: num,
      backwash_m3h: num,
      discharge: text,
    }),
    200,
  ),
  water_samples: array(
    object({
      ...common,
      source_id: ref,
      sample_date: date,
      laboratory: text,
      ph: (v, f) => {
        num(v, f);
        if (Number(v) > 14)
          invalid(f, "pH must be in the recorded 0–14 range.");
        return v;
      },
      ec_mscm: num,
      alkalinity: text,
      analytical_units: text,
    }),
    200,
  ),
  recipes: array(
    object({
      ...common,
      author: text,
      revision: text,
      ec_target_mscm: num,
      ph_target: (v, f) => {
        num(v, f);
        if (Number(v) > 14)
          invalid(f, "pH must be in the recorded 0–14 range.");
        return v;
      },
      ec_basis: choice("unknown", "final", "increment"),
      composition: text,
      changeover: text,
    }),
    200,
  ),
  stocks: array(
    object({
      ...common,
      recipe_id: ref,
      function: choice("nutrient", "acid", "alkali", "treatment", "spare"),
      dose_l_m3: num,
      usable_l: num,
      concentration: text,
      conditions: text,
    }),
    200,
  ),
  channels: array(
    object({
      ...common,
      candidate_id: ref,
      stock_id: ref,
      minimum_lph: num,
      maximum_lph: num,
      conditions: text,
    }),
    500,
  ),
  controllers: array(
    object({
      ...common,
      family: choice("unknown", "Compass", "Compact CC", "Connext", "other"),
      asset_id: ref,
      model: text,
      serial: text,
      software: text,
      licences: text,
    }),
    100,
  ),
  banks: array(
    object({
      ...common,
      controller_id: ref,
      physical_bank: text,
      signal,
      voltage: text,
      installed: integer,
      used: integer,
      reserved: integer,
      faulty: integer,
      manual_required: integer,
    }),
    300,
  ),
  sensors: array(
    object({
      ...common,
      measurement: text,
      crop_group_id: ref,
      control,
      representative_basis: text,
    }),
    1000,
  ),
  strategies: array(
    object({
      ...common,
      trigger: text,
      sensor_id: ref,
      group_ids: uniqueRefs,
      reset_basis: text,
      fallback: text,
      capability_evidence_id: ref,
    }),
    300,
  ),
  candidates: array(
    object({
      ...common,
      family: choice(...families),
      variant: text,
      controller_id: ref,
      minimum_m3h: num,
      maximum_m3h: num,
      minimum_pressure_bar: num,
      maximum_pressure_bar: num,
      proposed_pressure_bar: num,
      pressure_boundary: choice("unknown", "unit_inlet", "unit_outlet"),
      source_revision: text,
      arrangement: text,
      capability_evidence_id: ref,
      shortlisted: bool,
    }),
    100,
  ),
  evidence: array(
    object({
      id,
      label: name,
      kind: choice("observation", "assumption", "document_reference"),
      reference: text,
      source_revision: text,
      sha256: (v, f) => {
        if (v !== null && (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v)))
          invalid(f, "Use an exact lowercase SHA-256 or unknown.");
        return v;
      },
      captured_date: date,
      attribution: text,
      applicability: text,
      notes: text,
    }),
    500,
  ),
  actions: array(
    object({
      ...common,
      owner: text,
      due_date: date,
      purpose: choice(
        "question",
        "responsibility",
        "commissioning_criterion",
        "review",
      ),
      status: choice("open", "recorded"),
    }),
    500,
  ),
  services: object({
    shed: text,
    power: text,
    communications: text,
    access: text,
  }),
  resilience: object({ alarms: text, fallback: text, responsibilities: text }),
  groscales: object({
    required: choice("unknown", "yes", "no"),
    mode: choice("unknown", "wired", "wireless"),
    controller_id: ref,
    ancillary_hardware: text,
    evidence_id: ref,
  }),
});

export function validateScope(value: unknown): Scope {
  let nodes = 0;
  const visit = (v: unknown, depth: number) => {
    if (++nodes > 150000 || depth > 16)
      invalid(
        "scope",
        "Scope nesting or item count exceeds the bounded contract.",
      );
    if (v && typeof v === "object")
      for (const [k, child] of Object.entries(v)) {
        if (["__proto__", "prototype", "constructor"].includes(k))
          invalid("scope", "Unsupported key.");
        visit(child, depth + 1);
      }
  };
  visit(value, 0);
  if (Buffer.byteLength(JSON.stringify(value) ?? "", "utf8") > MAX_BYTES)
    invalid("scope", "The fertigation snapshot exceeds 2 MiB.");
  const p = schema(value, "scope") as Scope;
  const collections = [
    p.areas,
    p.crop_groups,
    p.valves,
    p.masters,
    p.sources,
    p.groups,
    p.scenarios,
    p.pipes,
    p.filters,
    p.water_samples,
    p.recipes,
    p.stocks,
    p.channels,
    p.controllers,
    p.banks,
    p.sensors,
    p.strategies,
    p.candidates,
    p.evidence,
    p.actions,
  ];
  const all = collections
    .flatMap((rows) => rows.map((row) => row.id))
    .concat(p.valves.flatMap((v) => v.allocations.map((a) => a.id)));
  if (new Set(all).size !== all.length)
    invalid("scope", "Every child identity must be unique within the scope.");
  const has = (
    rows: { id: string }[],
    target: string | null,
    field: string,
  ) => {
    if (target !== null && !rows.some((r) => r.id === target))
      invalid(field, "The referenced record must belong to this scope.");
  };
  const evidence = (value: string | null, field: string) =>
    has(p.evidence, value, field);
  for (const rows of collections)
    for (const row of rows)
      if ("evidence_ids" in row)
        for (const id of row.evidence_ids) evidence(id, "evidence_ids");
  for (const c of [p.production_context, ...p.areas.map((a) => a.context)])
    if (
      !c.tags.length ||
      new Set(c.tags).size !== c.tags.length ||
      (c.tags.includes("unknown") && c.tags.length > 1)
    )
      invalid("context.tags", "Choose distinct contexts, or Unknown alone.");
  for (const area of p.areas)
    if (
      (area.facility_id === null) !== (area.facility_version === null) ||
      area.facility_version === 0
    )
      invalid(
        "facility_version",
        "Facility identity and positive exact version must be captured together.",
      );
  for (const crop of p.crop_groups) has(p.areas, crop.area_id, "area_id");
  const checkControl = (c: Scope["valves"][number]["control"]) => {
    has(p.controllers, c.controller_id, "controller_id");
    has(p.banks, c.bank_id, "bank_id");
    if (
      ["manual", "external"].includes(c.owner) &&
      (c.bank_id !== null ||
        c.controller_id !== null ||
        (c.additional_channels !== null && c.additional_channels !== 0))
    )
      invalid(
        "control",
        "Manual/external control cannot claim a PPO controller channel.",
      );
    if (c.additional_channels === 0 && !c.basis.trim())
      invalid(
        "control.basis",
        "Zero additional channels requires an explicit applicable basis.",
      );
  };
  for (const v of p.valves) {
    has(p.masters, v.master_id, "master_id");
    has(p.sources, v.source_id, "source_id");
    evidence(v.flow_evidence_id, "flow_evidence_id");
    checkControl(v.control);
    const pairs = new Set<string>();
    for (const a of v.allocations) {
      has(p.areas, a.area_id, "allocation.area_id");
      has(p.crop_groups, a.crop_group_id, "allocation.crop_group_id");
      const key = `${a.area_id}/${a.crop_group_id}`;
      if (pairs.has(key))
        invalid(
          "allocations",
          "Duplicate service allocations are not accepted.",
        );
      pairs.add(key);
      const crop = p.crop_groups.find((c) => c.id === a.crop_group_id);
      if (crop?.area_id && a.area_id && crop.area_id !== a.area_id)
        invalid(
          "allocations",
          "The crop group belongs to a different represented area.",
        );
    }
    if (v.allocations.reduce((n, a) => n + (a.flow_share_fraction ?? 0), 0) > 1)
      invalid(
        "allocations",
        "Explicit flow shares cannot exceed the physical valve total.",
      );
  }
  for (const m of p.masters) {
    has(p.sources, m.source_id, "master.source_id");
    checkControl(m.control);
  }
  for (const g of p.groups) {
    g.valve_ids.forEach((id) => has(p.valves, id, "valve_ids"));
    has(p.recipes, g.recipe_id, "recipe_id");
  }
  for (const s of p.scenarios) {
    s.group_ids.forEach((id) => has(p.groups, id, "group_ids"));
    has(p.sources, s.source_id, "source_id");
    if (
      (s.cycles !== null && s.cycles > 1000) ||
      [s.start_minute, s.end_minute].some((v) => v !== null && v > 1440)
    )
      invalid(
        "scenario",
        "Use at most 1,000 cycles and same-day minute values from 0 to 1,440.",
      );
  }
  has(p.scenarios, p.selected_scenario_id, "selected_scenario_id");
  evidence(p.hydraulics.curve_evidence_id, "curve_evidence_id");
  p.hydraulics.curve_points.forEach((point, i, points) => {
    if (i > 0 && point.flow_m3h <= points[i - 1].flow_m3h)
      invalid(
        "curve_points",
        "Curve flows must strictly increase without duplicate points.",
      );
  });
  for (const row of p.water_samples)
    has(p.sources, row.source_id, "sample.source_id");
  for (const row of p.stocks) has(p.recipes, row.recipe_id, "stock.recipe_id");
  for (const row of p.channels) {
    has(p.stocks, row.stock_id, "channel.stock_id");
    has(p.candidates, row.candidate_id, "channel.candidate_id");
  }
  for (const row of p.banks)
    has(p.controllers, row.controller_id, "bank.controller_id");
  for (const row of p.sensors) {
    has(p.crop_groups, row.crop_group_id, "sensor.crop_group_id");
    checkControl(row.control);
  }
  for (const row of p.strategies) {
    has(p.sensors, row.sensor_id, "strategy.sensor_id");
    row.group_ids.forEach((id) => has(p.groups, id, "strategy.group_ids"));
    evidence(row.capability_evidence_id, "capability_evidence_id");
  }
  for (const row of p.candidates) {
    has(p.controllers, row.controller_id, "candidate.controller_id");
    evidence(row.capability_evidence_id, "capability_evidence_id");
  }
  has(p.controllers, p.groscales.controller_id, "groscales.controller_id");
  evidence(p.groscales.evidence_id, "groscales.evidence_id");
  return p;
}
