import type { Calculation, Finding, RecordBase, Result, Scope } from "./types";

/**
 * Deterministic guidance registers for the native fertigation workbench.
 *
 * Nothing here calculates a new engineering value. Every figure is taken from
 * the scope or from a PPO-FERT-NATIVE-CALC-r01 result; the registers only say
 * where a finding is resolved, who normally resolves it, and how to describe it
 * to a customer. Registry entries are keyed by the stable finding code (the
 * first segment of Finding.id).
 */

export type GuidanceView =
  | "overview"
  | "growing"
  | "water"
  | "recipes"
  | "controls"
  | "operating"
  | "configurator"
  | "evidence"
  | "review";

export type ResponsibleRole =
  | "scope_author"
  | "irrigation_designer"
  | "agronomist"
  | "grower"
  | "priva_specialist";

export const roleLabels: Record<ResponsibleRole, string> = {
  scope_author: "Scope author",
  irrigation_designer: "Irrigation designer",
  agronomist: "Agronomist",
  grower: "Grower",
  priva_specialist: "Priva specialist",
};

export const severityOrder = ["conflict", "incomplete", "review"] as const;
export const severityLabels: Record<Finding["severity"], string> = {
  conflict: "Conflict",
  incomplete: "Incomplete",
  review: "Review",
};

export interface FindingGuidance {
  /** View that resolves a scope-level finding; record-level findings use the record's register. */
  view: GuidanceView;
  role: ResponsibleRole;
  /** Plain customer wording. No internal identifiers, labels or engine terms. */
  customer: string;
}

const g = (
  view: GuidanceView,
  role: ResponsibleRole,
  customer: string,
): FindingGuidance => ({ view, role, customer });

export const findingGuidance: Record<string, FindingGuidance> = {
  phase_unknown: g(
    "growing",
    "scope_author",
    "Whether each area, valve and group is existing, proposed or future",
  ),
  scenario_missing: g(
    "operating",
    "scope_author",
    "Choice of operating scenario to assess",
  ),
  process_unknown: g(
    "overview",
    "irrigation_designer",
    "How water is applied and whether any is reused",
  ),
  negative_population: g(
    "growing",
    "scope_author",
    "Plant numbers that need correcting",
  ),
  density_area_unknown: g(
    "growing",
    "scope_author",
    "Area served by each crop group",
  ),
  demand_unknown: g(
    "growing",
    "agronomist",
    "Daily water demand for each crop group",
  ),
  area_overlap: g("growing", "scope_author", "Crop areas that overlap"),
  source_conflict: g(
    "growing",
    "irrigation_designer",
    "Inconsistent water source for some valves",
  ),
  flow_unknown: g(
    "growing",
    "irrigation_designer",
    "Valve flows to be confirmed",
  ),
  allocation_missing: g(
    "growing",
    "irrigation_designer",
    "Which crops each valve serves",
  ),
  measurement_source: g(
    "growing",
    "irrigation_designer",
    "Source of measured valve flows",
  ),
  over_allocated: g(
    "growing",
    "scope_author",
    "More containers assigned than exist",
  ),
  unallocated: g(
    "growing",
    "irrigation_designer",
    "Containers not yet assigned to a valve",
  ),
  duplicate_valve: g(
    "operating",
    "irrigation_designer",
    "A valve listed twice in one group",
  ),
  parallel_circuits: g(
    "operating",
    "irrigation_designer",
    "Separate circuits that need separate assessment",
  ),
  consumer_path_conflict: g(
    "operating",
    "irrigation_designer",
    "Other water users on the circuit",
  ),
  unit_above_pump: g(
    "operating",
    "irrigation_designer",
    "Fertigation unit flow above the pump flow",
  ),
  pump_only_conflict: g(
    "operating",
    "irrigation_designer",
    "Flow entered in two places",
  ),
  process_balance_held: g(
    "overview",
    "irrigation_designer",
    "Water balance awaiting the application method",
  ),
  scenario_circuits: g(
    "operating",
    "irrigation_designer",
    "Operating plan mixing independent circuits",
  ),
  schedule_limit: g(
    "operating",
    "grower",
    "Operating plan too large to assess",
  ),
  cycle_overlap: g(
    "operating",
    "grower",
    "Irrigation starts too close together",
  ),
  window_overflow: g(
    "operating",
    "grower",
    "Irrigation running past the daily window",
  ),
  single_cycle: g(
    "operating",
    "grower",
    "Daily performance from a single cycle",
  ),
  dry_interval: g(
    "operating",
    "grower",
    "Time between irrigations above its limit",
  ),
  start_interval: g(
    "operating",
    "grower",
    "Interval between starts above its limit",
  ),
  minimum_rest: g(
    "operating",
    "grower",
    "Rest between irrigations below its limit",
  ),
  timing_incomplete: g(
    "operating",
    "grower",
    "Irrigation timing to be completed",
  ),
  not_scheduled: g(
    "operating",
    "grower",
    "Areas not included in the operating plan",
  ),
  below_demand: g(
    "operating",
    "irrigation_designer",
    "Areas receiving less water than they need",
  ),
  storage_source: g(
    "operating",
    "irrigation_designer",
    "Water supply for the operating plan",
  ),
  storage_capacity: g(
    "water",
    "irrigation_designer",
    "Inconsistent tank capacities",
  ),
  initial_capacity: g(
    "operating",
    "irrigation_designer",
    "Starting tank level above capacity",
  ),
  reserve_capacity: g(
    "operating",
    "irrigation_designer",
    "Reserve above tank capacity",
  ),
  refill_supply: g(
    "water",
    "irrigation_designer",
    "Refill rate above the source supply",
  ),
  storage_shortage: g(
    "operating",
    "irrigation_designer",
    "Stored water running out during the day",
  ),
  storage_reserve: g(
    "operating",
    "irrigation_designer",
    "Stored water falling below the reserve",
  ),
  storage_overflow: g(
    "operating",
    "irrigation_designer",
    "Possible tank overflow",
  ),
  head_flow_basis: g(
    "water",
    "irrigation_designer",
    "Pump pressure losses at the operating flow",
  ),
  bank_double_count: g(
    "controls",
    "priva_specialist",
    "A controller module counted twice",
  ),
  bank_dependency: g(
    "controls",
    "priva_specialist",
    "Controller module details",
  ),
  control_unknown: g("controls", "priva_specialist", "Who controls each valve"),
  io_assignment: g(
    "controls",
    "priva_specialist",
    "Control connections to be assigned",
  ),
  io_phase: g("controls", "priva_specialist", "Status of control equipment"),
  io_mismatch: g(
    "controls",
    "priva_specialist",
    "Control connection not matching its module",
  ),
  io_address: g("controls", "priva_specialist", "Control channel addresses"),
  duplicate_channel: g(
    "controls",
    "priva_specialist",
    "A control channel used twice",
  ),
  io_counts: g(
    "controls",
    "priva_specialist",
    "Inconsistent controller module counts",
  ),
  io_reconcile: g(
    "controls",
    "priva_specialist",
    "Control connection counts that disagree",
  ),
  io_deficit: g(
    "controls",
    "priva_specialist",
    "More control connections needed than are free",
  ),
  strategy_dependency: g(
    "controls",
    "priva_specialist",
    "Inputs for the irrigation start strategy",
  ),
  strategy_controller: g(
    "controls",
    "priva_specialist",
    "Sensor link for the start strategy",
  ),
  strategy_capability: g(
    "controls",
    "priva_specialist",
    "Controller support for the start strategy",
  ),
  strategy_representation: g(
    "controls",
    "grower",
    "Sensor coverage of the targeted areas",
  ),
  strategy_target_control: g(
    "controls",
    "priva_specialist",
    "Start strategy spanning more than one controller",
  ),
  strategy_units_held: g(
    "controls",
    "grower",
    "Start strategy trigger and reset rule",
  ),
  groscales_compass: g(
    "configurator",
    "priva_specialist",
    "Weighing option not matching the controller choice",
  ),
  groscales_evidence: g(
    "configurator",
    "priva_specialist",
    "Weighing option details",
  ),
  filter_path: g(
    "water",
    "irrigation_designer",
    "Position of the filter in the system",
  ),
  filter_capacity: g(
    "water",
    "irrigation_designer",
    "Filter capacity below the flow",
  ),
};

export const findingCode = (f: Pick<Finding, "id">) => f.id.split(":")[0];

const humanCode = (code: string) =>
  code.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

/** A code added by a later edition still gets a safe, visible default. */
export function guidanceFor(f: Pick<Finding, "id">): FindingGuidance & {
  code: string;
  registered: boolean;
} {
  const code = findingCode(f),
    entry = findingGuidance[code];
  return entry
    ? { ...entry, code, registered: true }
    : {
        view: "review",
        role: "scope_author",
        customer: humanCode(code),
        code,
        registered: false,
      };
}

/** Registers shown by each native view, matching the workbench menu. */
export const viewRegisters: Partial<
  Record<GuidanceView, readonly (keyof Scope)[]>
> = {
  growing: ["valves", "masters", "areas", "crop_groups"],
  water: ["sources", "pipes", "filters", "water_samples"],
  recipes: ["recipes", "stocks", "channels"],
  controls: ["controllers", "banks", "sensors", "strategies"],
  operating: ["groups", "scenarios"],
  configurator: ["candidates"],
  evidence: ["evidence", "actions"],
};

export function recordLocation(
  scope: Scope,
  recordId: string | null,
): { view: GuidanceView; register: keyof Scope; label: string } | null {
  if (!recordId) return null;
  for (const [view, registers] of Object.entries(viewRegisters) as [
    GuidanceView,
    readonly (keyof Scope)[],
  ][])
    for (const register of registers) {
      const rows = scope[register] as unknown as {
        id: string;
        label: string;
      }[];
      const row = rows.find((r) => r.id === recordId);
      if (row) return { view, register, label: row.label };
    }
  return null;
}

export const viewForFinding = (scope: Scope, f: Finding): GuidanceView =>
  recordLocation(scope, f.record_id)?.view ?? guidanceFor(f).view;

export type SeverityCounts = Record<Finding["severity"], number> & {
  total: number;
};

export function severityCounts(findings: readonly Finding[]): SeverityCounts {
  const counts = { conflict: 0, incomplete: 0, review: 0, total: 0 };
  for (const f of findings) {
    counts[f.severity]++;
    counts.total++;
  }
  return counts;
}

export function countsByView(scope: Scope, findings: readonly Finding[]) {
  const out = {} as Record<GuidanceView, SeverityCounts>;
  for (const f of findings) {
    const view = viewForFinding(scope, f);
    const c = (out[view] ??= {
      conflict: 0,
      incomplete: 0,
      review: 0,
      total: 0,
    });
    c[f.severity]++;
    c.total++;
  }
  return out;
}

export function countsByRole(findings: readonly Finding[]) {
  const out = {} as Record<ResponsibleRole, number>;
  for (const f of findings) {
    const role = guidanceFor(f).role;
    out[role] = (out[role] ?? 0) + 1;
  }
  return out;
}

export interface NextAction {
  code: string;
  severity: Finding["severity"];
  count: number;
  role: ResponsibleRole;
  view: GuidanceView;
  summary: string;
  message: string;
  record_ids: string[];
}

/**
 * Findings grouped by code and severity, ranked conflicts first, then
 * incomplete, then review; within a severity the group touching the most
 * records comes first, then the engine's own emission order.
 */
export function nextActions(
  scope: Scope,
  findings: readonly Finding[],
): NextAction[] {
  const groups = new Map<string, NextAction & { first: number }>();
  findings.forEach((f, index) => {
    const guide = guidanceFor(f),
      key = `${f.severity}|${guide.code}`,
      existing = groups.get(key);
    if (existing) {
      existing.count++;
      if (f.record_id) existing.record_ids.push(f.record_id);
      return;
    }
    groups.set(key, {
      code: guide.code,
      severity: f.severity,
      count: 1,
      role: guide.role,
      view: viewForFinding(scope, f),
      summary: guide.customer,
      message: f.message,
      record_ids: f.record_id ? [f.record_id] : [],
      first: index,
    });
  });
  return [...groups.values()]
    .sort(
      (a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity) ||
        b.count - a.count ||
        a.first - b.first,
    )
    .map(({ first: _first, ...action }) => action);
}

export type CapacityState = "within" | "storage" | "over" | "unknown";

export interface CapacityRow {
  key: string;
  label: string;
  detail: string;
  view: GuidanceView;
  unit: string;
  demand: number | null;
  capacity: number | null;
  /** demand ÷ capacity, or null when either side is not known. */
  ratio: number | null;
  state: CapacityState;
  note: string;
}

const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const value = (r: Result | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;
/** Whole numbers print whole; others to one decimal unless digits is given. */
const fmt = (v: number, digits?: number) =>
  v.toLocaleString("en-AU", {
    minimumFractionDigits: digits ?? (Number.isInteger(v) ? 0 : 1),
    maximumFractionDigits: digits ?? 1,
  });

function row(
  key: string,
  label: string,
  detail: string,
  view: GuidanceView,
  unit: string,
  demand: number | null,
  capacity: number | null,
  note: string,
  over?: boolean,
): CapacityRow {
  const ratio =
    known(demand) && known(capacity) && capacity > 0 ? demand / capacity : null;
  const state: CapacityState =
    !known(demand) || !known(capacity)
      ? "unknown"
      : (over ?? demand > capacity)
        ? "over"
        : "within";
  return {
    key,
    label,
    detail,
    view,
    unit,
    demand,
    capacity,
    ratio,
    state,
    note,
  };
}

const active = (scope: Scope, r: RecordBase) => {
  const scenario = scope.scenarios.find(
    (s) => s.id === scope.selected_scenario_id,
  );
  return (
    r.phase !== "excluded" &&
    (r.phase !== "future" || scenario?.include_future === true)
  );
};

/**
 * Every capacity limit the scope records, compared with the native result
 * that loads it. The comparison is the same inequality the engine already
 * applies; the ratio only places both on one scale.
 */
export function capacityRows(scope: Scope, calc: Calculation): CapacityRow[] {
  const rows: CapacityRow[] = [];
  const codes = new Set(calc.findings.map((f) => findingCode(f)));

  for (const io of calc.io) {
    const bank = scope.banks.find((b) => b.id === io.bank_id);
    const need = value(io.required),
      free = value(io.available),
      spare = value(io.spare);
    const r = row(
      `io:${io.bank_id}`,
      bank?.label ?? "I/O bank",
      known(need) && known(free)
        ? `${need} required · ${free} available`
        : io.required.reason || io.available.reason,
      "controls",
      "channels",
      need,
      free,
      "",
      known(spare) ? spare < 0 : undefined,
    );
    // The engine withholds spare capacity while declared and device-derived
    // demand disagree; the row must not read as within capacity meanwhile.
    if (r.state !== "unknown" && !known(spare)) {
      r.state = "unknown";
      r.ratio = null;
      r.note = "Declared demand differs from the recorded devices";
    } else
      r.note =
        r.state === "unknown"
          ? "Not assessable"
          : spare! >= 0
            ? `${spare} spare after expansion`
            : `Short by ${-spare!}`;
    rows.push(r);
  }

  const scenario = scope.scenarios.find(
    (s) => s.id === scope.selected_scenario_id,
  );
  const source = scope.sources.find((s) => s.id === scenario?.source_id);
  const pumpPeak = value(calc.pump_peak_m3h);
  if (scenario) {
    const reliable = source?.reliable_flow_m3h ?? null;
    const base = row(
      "supply",
      "Reliable supply at peak",
      source
        ? `${source.label} · ${known(reliable) ? `${fmt(reliable)} m³/h reliable` : "reliable flow not recorded"}`
        : "No supply bound to the scenario",
      "operating",
      "m³/h",
      pumpPeak,
      reliable,
      "",
    );
    if (base.state === "over") {
      const minimum = value(calc.storage.minimum_m3);
      const failing =
        codes.has("storage_shortage") || codes.has("storage_reserve");
      if (known(minimum) && !failing) {
        base.state = "storage";
        base.note = `Storage covers it · lowest ${fmt(minimum)} m³`;
      } else
        base.note = failing
          ? "Storage does not cover the shortfall"
          : "Storage balance not assessable";
    } else if (base.state === "within")
      base.note = "Delivery does not draw on storage";
    else
      base.note = source
        ? "Pump peak or reliable flow not known"
        : "Bind the scenario to its supply";
    rows.push(base);
  }

  const unitPeak = value(calc.operating_peak_m3h);
  const cropPeak = calc.group_flows.map((g) => value(g.crop)).filter(known);
  for (const f of scope.filters.filter((r) => active(scope, r))) {
    const duty =
      f.path === "pump"
        ? pumpPeak
        : f.path === "unit"
          ? unitPeak
          : f.path === "crop"
            ? cropPeak.length
              ? Math.max(...cropPeak)
              : null
            : null;
    const r = row(
      `filter:${f.id}`,
      f.label,
      f.path === "unknown"
        ? "Flow path not recorded"
        : `${{ pump: "Pump", unit: "Dosing-unit", crop: "Crop" }[f.path]} path · ${known(f.capacity_m3h) ? `${fmt(f.capacity_m3h)} m³/h capacity` : "capacity not recorded"}`,
      "water",
      "m³/h",
      duty,
      f.capacity_m3h,
      "",
    );
    if (
      known(duty) &&
      known(f.capacity_m3h) &&
      known(f.backwash_m3h) &&
      f.capacity_m3h > 0
    )
      r.note = `${Math.round(((duty + f.backwash_m3h) / f.capacity_m3h) * 100)}% if the ${fmt(f.backwash_m3h)} m³/h backwash overlaps irrigation`;
    else if (r.state === "unknown") r.note = "Duty or capacity not known";
    rows.push(r);
  }

  const required = value(calc.hydraulic.required_head_m),
    curve = value(calc.hydraulic.curve_head_m),
    margin = value(calc.hydraulic.margin_m);
  rows.push({
    ...row(
      "pump_head",
      "Pump head at peak duty",
      known(required) && known(curve)
        ? `${fmt(required)} m required · ${fmt(curve)} m on the curve`
        : known(required)
          ? `${fmt(required)} m required`
          : "Required head not known",
      "water",
      "m",
      required,
      curve,
      known(margin)
        ? `Margin ${margin >= 0 ? "+" : ""}${fmt(margin, 1)} m`
        : calc.hydraulic.margin_m.reason,
      known(margin) ? margin < 0 : undefined,
    ),
    ...(known(required) && known(curve) && !known(margin)
      ? { state: "unknown" as const, ratio: null }
      : {}),
  });

  if (
    scenario &&
    known(scenario.start_minute) &&
    known(scenario.end_minute) &&
    calc.schedule.events.length
  ) {
    const span =
      (calc.schedule.events.at(-1)!.finish - scenario.start_minute * 60) / 60;
    const window = scenario.end_minute - scenario.start_minute;
    rows.push(
      row(
        "window",
        "Irrigation window",
        `${fmt(Math.round(span))} min sequence · ${fmt(window)} min window`,
        "operating",
        "min",
        span,
        window,
        known(window) && window >= span
          ? `${fmt(Math.round(window - span))} min unused`
          : "Sequence runs past the window",
      ),
    );
  }

  const unitFlows = calc.group_flows.map((g) => value(g.unit)).filter(known);
  const peak = unitFlows.length ? Math.max(...unitFlows) : null;
  const shortlisted = scope.candidates.filter(
    (r) => r.shortlisted && active(scope, r),
  );
  for (const c of shortlisted)
    rows.push(
      row(
        `candidate:${c.id}`,
        c.label,
        known(c.minimum_m3h) && known(c.maximum_m3h)
          ? `Entered envelope ${fmt(c.minimum_m3h)}–${fmt(c.maximum_m3h)} m³/h`
          : "Entered envelope not complete",
        "configurator",
        "m³/h",
        peak,
        c.maximum_m3h,
        "Entered limits only · manufacturer confirmation pending",
      ),
    );
  if (!shortlisted.length && scope.candidates.length)
    rows.push(
      row(
        "candidate:none",
        "Fertigation unit envelope",
        "No configured candidate is shortlisted",
        "configurator",
        "m³/h",
        peak,
        null,
        "Shortlist a candidate and enter its envelope",
      ),
    );

  for (const need of calc.injection) {
    const lph = value(need.required_lph);
    for (const ch of scope.channels.filter(
      (r) => r.stock_id === need.stock_id && active(scope, r),
    )) {
      const group = scope.groups.find((x) => x.id === need.group_id);
      rows.push(
        row(
          `injection:${need.group_id}:${ch.id}`,
          `${ch.label} at ${group?.label ?? "group"}`,
          known(lph)
            ? `${fmt(lph)} L/h required · ${known(ch.maximum_lph) ? `${fmt(ch.maximum_lph)} L/h entered maximum` : "maximum not entered"}`
            : need.required_lph.reason,
          "recipes",
          "L/h",
          lph,
          ch.maximum_lph,
          "Entered range, not a manufacturer rating",
        ),
      );
    }
  }
  return rows;
}

export type EvidenceStrength =
  "none" | "assumption" | "observation" | "document_reference";
export const evidenceStrengthLabels: Record<EvidenceStrength, string> = {
  none: "No evidence",
  assumption: "Assumption",
  observation: "Observation",
  document_reference: "Document",
};
const strengthRank: EvidenceStrength[] = [
  "none",
  "assumption",
  "observation",
  "document_reference",
];

const evidenceRegisters = [
  "areas",
  "crop_groups",
  "valves",
  "masters",
  "sources",
  "pipes",
  "filters",
  "water_samples",
  "recipes",
  "stocks",
  "channels",
  "controllers",
  "banks",
  "sensors",
  "strategies",
  "candidates",
  "groups",
  "scenarios",
] as const satisfies readonly (keyof Scope)[];

/** Strongest linked evidence per active record; a record is only as strong as its best link. */
export function evidenceCoverage(scope: Scope) {
  const kinds = new Map(scope.evidence.map((e) => [e.id, e.kind]));
  const counts: Record<EvidenceStrength, number> = {
    none: 0,
    assumption: 0,
    observation: 0,
    document_reference: 0,
  };
  const weakest: {
    register: keyof Scope;
    id: string;
    label: string;
    strength: EvidenceStrength;
  }[] = [];
  for (const register of evidenceRegisters)
    for (const r of scope[register] as RecordBase[]) {
      if (!active(scope, r)) continue;
      let best: EvidenceStrength = "none";
      for (const id of r.evidence_ids) {
        const kind = kinds.get(id);
        if (kind && strengthRank.indexOf(kind) > strengthRank.indexOf(best))
          best = kind;
      }
      counts[best]++;
      if (best === "none" || best === "assumption")
        weakest.push({ register, id: r.id, label: r.label, strength: best });
    }
  return {
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    weakest,
  };
}

export type OutputState = "available" | "blocked" | "needs";

export interface OutputReadiness {
  key: "export" | "report" | "review" | "handover";
  label: string;
  state: OutputState;
  reason: string;
}

/**
 * The native preconditions for each output, as enforced by the server.
 * Open findings never block an output; they travel with it.
 */
export function outputReadiness(input: {
  dirty: boolean;
  historical: boolean;
  sourceChanged: boolean;
  canEdit: boolean;
  revision: number;
  openFindings: number;
}): OutputReadiness[] {
  const carried = input.openFindings
    ? ` Carries ${input.openFindings} open ${input.openFindings === 1 ? "finding" : "findings"}.`
    : "";
  const draft = input.dirty
    ? " Draft changes are not included until saved."
    : "";
  const current = !input.historical && !input.sourceChanged;
  return [
    {
      key: "export",
      label: "Exact export · JSON and valve CSV",
      state: "available",
      reason: `Saved revision ${input.revision}.${draft}`,
    },
    {
      key: "report",
      label: "Scope report · customer and internal",
      state: "available",
      reason: `Saved revision ${input.revision}; implies no readiness or approval.${carried}${draft}`,
    },
    {
      key: "review",
      label: "Technical review record",
      state: !current || !input.canEdit ? "blocked" : "available",
      reason: input.historical
        ? "Only the current saved revision can be reviewed."
        : input.sourceChanged
          ? "Refresh the changed Discovery source first."
          : !input.canEdit
            ? "Your access does not include recording reviews."
            : `Records "Reviewed; unresolved" against revision ${input.revision}.${carried}`,
    },
    {
      key: "handover",
      label: "Scoping handover to Discovery",
      state: !current || !input.canEdit ? "blocked" : "needs",
      reason: !current
        ? "Needs the current revision and an unchanged Discovery source."
        : `Needs a recorded review of revision ${input.revision}.${carried}`,
    },
  ];
}

/** Replace record identities in engine text with their labels. */
export function withLabels(scope: Scope, text: string): string {
  return text.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    (id) => recordLocation(scope, id)?.label || "record",
  );
}

export interface CandidateFailure {
  candidate_id: string;
  label: string;
  failures: string[];
}

/**
 * Configured-candidate failures are not scope findings (the engine keeps them
 * on each candidate), but they are the same kind of contradiction. They are
 * listed alongside conflicts and never added to finding counts.
 */
export function candidateFailures(
  scope: Scope,
  calc: Calculation,
): CandidateFailure[] {
  return calc.candidates
    .filter((c) => c.failures.length)
    .map((c) => ({
      candidate_id: c.id,
      label: scope.candidates.find((x) => x.id === c.id)?.label ?? "Candidate",
      failures: c.failures.map((f) => withLabels(scope, f)),
    }));
}
