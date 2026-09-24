import {
  findingCode,
  type GuidanceView,
  type ResponsibleRole,
} from "./guidance";
import type { ResolutionOption, Resolvable } from "./resolutions";
import type {
  Calculation,
  Finding,
  Group,
  Phase,
  RecordBase,
  Scope,
  Valve,
} from "./types";

/**
 * Declaration register (feature F1, second part; board declarations
 * D-01–D-12).
 *
 * An imported or partly captured draft opens with incomplete findings the
 * engine cannot clear on its own. Each declaration restates the engine's own
 * precondition, lists what the draft already records and, where it can, offers
 * a draft edit that the server previews and the reviewer applies to the
 * working draft. Nothing is saved without a revision and reason.
 *
 * Option basis:
 * - recorded: the edit restates values the draft already records;
 * - declared: the reviewer states a fact the draft does not record, choosing a
 *   native value; the option says what is being asserted;
 * - no transform: the answer needs information the draft does not hold.
 *
 * Nothing is applied silently. The importer still infers no phase, method or
 * arrangement (ADR-0038); these offers are explicit, one reviewed edit at a
 * time.
 */

export interface Declaration extends Resolvable {
  /** Stable register identity, as on the refinement board. */
  id: string;
  role: ResponsibleRole;
  view: GuidanceView;
  /** Finding codes this declaration addresses now. */
  codes: string[];
  /** Exact findings addressed, including ones that wait on it. */
  findingIds: string[];
  /** What the draft records that bears on the declaration. */
  facts: string[];
}

export const declarationTitles: Record<string, string> = {
  "D-01": "Hydraulic arrangement and application method",
  "D-02": "Record phases",
  "D-03": "Area represented by crop groups",
  "D-04": "Valve flow basis",
  "D-05": "Scenario timing",
  "D-06": "Supply source for the scenario",
  "D-07": "Flow at which head losses were entered",
  "D-08": "Controller, signal and voltage for I/O banks",
  "D-09": "Who controls each valve and master",
  "D-10": "Bank and channel demand for controlled devices",
  "D-11": "Start strategy",
  "D-12": "Hydraulic path of treatment components",
};

const phaseOrder: Phase[] = ["existing", "proposed", "future"];
export const phaseLabels: Record<Phase, string> = {
  existing: "Existing",
  proposed: "Proposed",
  future: "Future",
  excluded: "Excluded",
  unknown: "Unknown",
};
const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);
const fmt = (v: number) =>
  v.toLocaleString("en-AU", { maximumFractionDigits: 2 });
const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The engine's applicability rules, restated for diagnosis only. */
function context(scope: Scope) {
  const scenario = scope.scenarios.find(
    (s) => s.id === scope.selected_scenario_id,
  );
  const active = (r: RecordBase) =>
    r.phase !== "excluded" &&
    (r.phase !== "future" || scenario?.include_future === true);
  const areas = new Map(scope.areas.map((r) => [r.id, r])),
    crops = new Map(scope.crop_groups.map((r) => [r.id, r])),
    masters = new Map(scope.masters.map((r) => [r.id, r])),
    sources = new Map(scope.sources.map((r) => [r.id, r])),
    valves = new Map(scope.valves.map((r) => [r.id, r]));
  const groups = scope.groups.filter(
    (g) => active(g) && !!scenario?.group_ids.includes(g.id),
  );
  return { scenario, active, areas, crops, masters, sources, valves, groups };
}
type Context = ReturnType<typeof context>;

const unknownPhase = (r: RecordBase | undefined): r is RecordBase =>
  !!r && r.phase === "unknown";

/** Records with an undeclared phase that a valve's flow waits on, in the
 * engine's order: valve, master, source, then each allocation. */
function valveWaitsOn(c: Context, v: Valve): RecordBase[] {
  const out: RecordBase[] = [];
  const add = (r: RecordBase | undefined) => {
    if (unknownPhase(r) && !out.includes(r)) out.push(r);
  };
  add(v);
  const master = v.master_id ? c.masters.get(v.master_id) : undefined;
  add(master);
  const sourceId = v.source_id ?? master?.source_id;
  add(sourceId ? c.sources.get(sourceId) : undefined);
  for (const a of v.allocations) {
    add(a.area_id ? c.areas.get(a.area_id) : undefined);
    const crop = a.crop_group_id ? c.crops.get(a.crop_group_id) : undefined;
    add(crop);
    add(crop?.area_id ? c.areas.get(crop.area_id) : undefined);
  }
  return out;
}

function cropWaitsOn(c: Context, cropId: string): RecordBase[] {
  const crop = c.crops.get(cropId);
  const area = crop?.area_id ? c.areas.get(crop.area_id) : undefined;
  const records: (RecordBase | undefined)[] = [crop, area];
  return records.filter(unknownPhase);
}

/** The engine's timing preconditions that are not met, each marked when an
 * undeclared phase is what holds it. */
function timingGaps(
  scope: Scope,
  calc: Calculation,
  c: Context,
): { text: string; phase: boolean }[] {
  const s = c.scenario;
  if (!s) return [{ text: "No operating scenario is selected.", phase: false }];
  const gaps: { text: string; phase: boolean }[] = [];
  if (s.phase === "unknown")
    gaps.push({ text: `${s.label}: phase not declared.`, phase: true });
  else if (!c.active(s))
    gaps.push({ text: `${s.label} is not active.`, phase: false });
  if (!c.groups.length)
    gaps.push({
      text: "No active operating group is scheduled.",
      phase: false,
    });
  for (const g of c.groups) {
    // An undeclared group phase alone withholds its flow.
    if (g.phase === "unknown") {
      gaps.push({ text: `${g.label}: phase not declared.`, phase: true });
      continue;
    }
    const flow = calc.group_flows.find((x) => x.id === g.id)?.pump.value;
    if (!known(flow)) {
      const waits = [...new Set(g.valve_ids)].flatMap((id) => {
        const v = c.valves.get(id);
        return v ? valveWaitsOn(c, v) : [];
      });
      gaps.push({
        text: waits.length
          ? `${g.label}: flow waits on the phase of ${list([...new Set(waits.map((r) => r.label))])}.`
          : `${g.label}: flow is not known.`,
        phase: waits.length > 0,
      });
    }
  }
  const circuits = new Set(
    scope.valves
      .filter(
        (v) => c.active(v) && c.groups.some((g) => g.valve_ids.includes(v.id)),
      )
      .map((v) => (v.master_id ? c.masters.get(v.master_id)?.circuit : null))
      .filter(Boolean),
  );
  if (circuits.size > 1)
    gaps.push({
      text: "Scheduled valves are on more than one circuit.",
      phase: false,
    });
  const incompleteDuration = (g: Group) =>
    [g.prepare_seconds, g.delivery_seconds, g.flush_seconds].some(
      (x) => !known(x),
    );
  for (const g of c.groups.filter(incompleteDuration))
    gaps.push({
      text: `${g.label}: prepare, deliver and flush durations are incomplete.`,
      phase: false,
    });
  if (!known(s.cycles) || s.cycles <= 0)
    gaps.push({ text: "Cycle count is not recorded.", phase: false });
  if (!known(s.spacing_min) || s.spacing_basis === "unknown")
    gaps.push({
      text: "Cycle spacing or its basis is not recorded.",
      phase: false,
    });
  if (
    !known(s.start_minute) ||
    !known(s.end_minute) ||
    s.end_minute <= s.start_minute
  )
    gaps.push({ text: "A same-day window is not recorded.", phase: false });
  return gaps;
}

const newInput = (
  role: ResponsibleRole,
  title: string,
  condition: string,
  detail: string,
): ResolutionOption => ({ id: "record", title, role, condition, detail });

/** D-02: phases, and every finding that waits only on them. */
function phaseDeclaration(
  scope: Scope,
  calc: Calculation,
  c: Context,
  findings: Finding[],
): Declaration | null {
  const ids = new Set<string>();
  for (const f of findings) {
    const code = findingCode(f);
    if (code === "phase_unknown") ids.add(f.id);
    if (code === "flow_unknown") {
      const v = f.record_id ? c.valves.get(f.record_id) : undefined;
      if (v && valveWaitsOn(c, v).length) ids.add(f.id);
    }
    if (code === "density_area_unknown" && f.record_id)
      if (cropWaitsOn(c, f.record_id).length) ids.add(f.id);
    if (code === "timing_incomplete") {
      const gaps = timingGaps(scope, calc, c);
      if (gaps.length && gaps.every((g) => g.phase)) ids.add(f.id);
    }
  }
  const scenariosUnknown = scope.scenarios.filter((s) => s.phase === "unknown");
  if (!ids.size && !scenariosUnknown.length) return null;

  const fromArea = scope.crop_groups.flatMap((crop) => {
    const area = crop.area_id ? c.areas.get(crop.area_id) : undefined;
    return crop.phase === "unknown" && area && area.phase !== "unknown"
      ? [{ crop, area, phase: area.phase }]
      : [];
  });
  const valvePhases = (g: Group) => [
    ...new Set(
      [...new Set(g.valve_ids)]
        .map((id) => c.valves.get(id)?.phase)
        .filter((p): p is Phase => !!p && phaseOrder.includes(p)),
    ),
  ];
  const groupsUnknown = scope.groups.filter(
    (g) =>
      g.phase === "unknown" &&
      g.valve_ids.length > 0 &&
      g.valve_ids.every((id) => {
        const p = c.valves.get(id)?.phase;
        return !!p && phaseOrder.includes(p);
      }),
  );
  const shared = groupsUnknown.filter((g) => valvePhases(g).length === 1);
  const mixed = groupsUnknown.filter((g) => valvePhases(g).length > 1);
  const latest = (g: Group) =>
    phaseOrder[Math.max(...valvePhases(g).map((p) => phaseOrder.indexOf(p)))];
  const valveText = (g: Group) =>
    list(
      [...new Set(g.valve_ids)].map((id) => {
        const v = c.valves.get(id)!;
        return `${v.label} (${phaseLabels[v.phase]})`;
      }),
    );

  const options: ResolutionOption[] = [];
  const recorded = fromArea.length + shared.length;
  if (recorded)
    options.push({
      id: "recorded",
      basis: "recorded",
      title: `Use recorded phases for ${plural(recorded, "record")}`,
      role: "scope_author",
      condition:
        "A record's duty is used only once its phase is declared. A crop group takes the phase of its area; an operating group takes the phase all its valves share.",
      detail: [
        ...fromArea.map(
          (x) =>
            `${x.crop.label} → ${phaseLabels[x.phase]}, from its area ${x.area.label}`,
        ),
        ...shared.map(
          (g) =>
            `${g.label} → ${phaseLabels[valvePhases(g)[0]]}, from ${valveText(g)}`,
        ),
      ].join("; "),
      transform: (s) => {
        const next = structuredClone(s);
        for (const x of fromArea) {
          const crop = next.crop_groups.find((r) => r.id === x.crop.id);
          if (crop) crop.phase = x.phase;
        }
        for (const g of shared) {
          const group = next.groups.find((r) => r.id === g.id);
          if (group) group.phase = valvePhases(g)[0];
        }
        return next;
      },
    });
  for (const g of mixed)
    options.push({
      id: `group:${g.id}`,
      basis: "declared",
      title: `Declare ${g.label} ${phaseLabels[latest(g)]}`,
      role: "scope_author",
      condition:
        "A group runs only once every valve in it is installed, so it takes the latest phase among its valves.",
      detail: `Its valves are ${valveText(g)}. The draft records no phase for the group itself; this declares it.`,
      transform: (s) => {
        const next = structuredClone(s);
        const group = next.groups.find((r) => r.id === g.id);
        if (group) group.phase = latest(g);
        return next;
      },
    });
  if (scenariosUnknown.length)
    options.push({
      id: "scenarios",
      basis: "declared",
      title: `Declare ${list(scenariosUnknown.map((s) => s.label))} Proposed`,
      role: "scope_author",
      condition:
        "Timing and storage are assessed only for a scenario with a declared phase.",
      detail:
        "An operating scenario in a scope describes planned operation. The draft records no phase for it; this declares it Proposed.",
      transform: (s) => {
        const next = structuredClone(s);
        for (const x of next.scenarios)
          if (x.phase === "unknown") x.phase = "proposed";
        return next;
      },
    });
  const unresolved = [
    ...scope.areas,
    ...scope.valves,
    ...scope.masters,
    ...scope.sources,
  ]
    .filter((r) => r.phase === "unknown")
    .map((r) => r.label)
    .concat(
      scope.groups
        .filter(
          (g) =>
            g.phase === "unknown" && !groupsUnknown.some((x) => x.id === g.id),
        )
        .map((g) => g.label),
    );
  if (unresolved.length || !options.length)
    options.push(
      newInput(
        "scope_author",
        `Record the phase of ${list(unresolved) || "each remaining record"}`,
        "The draft records nothing to take these phases from.",
        "Open each record and choose Existing, Proposed, Future or Excluded.",
      ),
    );
  const facts = [
    ...fromArea.map((x) => `${x.area.label} is ${phaseLabels[x.phase]}.`),
    ...groupsUnknown.map((g) => `${g.label}: ${valveText(g)}.`),
    ...[...ids]
      .map((id) => findings.find((f) => f.id === id)!)
      .filter((f) => findingCode(f) !== "phase_unknown")
      .map((f) => {
        const code = findingCode(f);
        const label =
          (f.record_id &&
            (c.valves.get(f.record_id)?.label ??
              c.crops.get(f.record_id)?.label)) ||
          c.scenario?.label ||
          "Scope";
        return code === "flow_unknown"
          ? `${label}: flow waits on the phase of ${list(valveWaitsOn(c, c.valves.get(f.record_id!)!).map((r) => r.label))}.`
          : code === "density_area_unknown"
            ? `${label}: containers are counted once ${list(cropWaitsOn(c, f.record_id!).map((r) => (r.id === f.record_id ? "its phase" : `the phase of ${r.label}`)))} is declared.`
            : `${label}: timing waits on undeclared phases.`;
      }),
  ];
  return {
    id: "D-02",
    key: "declaration:D-02",
    title: declarationTitles["D-02"],
    message: ids.size
      ? `${plural(ids.size, "finding")} wait on undeclared phases.`
      : "Operating scenarios have no declared phase, so timing and storage are not assessed.",
    role: "scope_author",
    view: "growing",
    codes: [...new Set([...ids].map((id) => id.split(":")[0]))],
    findingIds: [...ids],
    facts,
    options,
  };
}

/** D-06: bind the selected scenario to the one source its valves draw from. */
function sourceDeclaration(
  scope: Scope,
  c: Context,
  f: Finding,
): Declaration | null {
  const s = c.scenario;
  if (!s) return null;
  const scheduled = new Set(c.groups.flatMap((g) => g.valve_ids));
  const drawn = scope.valves
    .filter((v) => c.active(v) && scheduled.has(v.id))
    .map((v) => ({
      v,
      source:
        v.source_id ??
        (v.master_id ? c.masters.get(v.master_id)?.source_id : null) ??
        null,
    }));
  const ids = [...new Set(drawn.map((d) => d.source))];
  const only = ids.length === 1 && ids[0] ? c.sources.get(ids[0]) : undefined;
  const via = [
    ...new Set(
      drawn
        .map((d) => (d.v.master_id ? c.masters.get(d.v.master_id)?.label : ""))
        .filter(Boolean) as string[],
    ),
  ];
  const facts = drawn.map(
    (d) =>
      `${d.v.label} draws from ${d.source ? (c.sources.get(d.source)?.label ?? "an unknown source") : "no recorded source"}.`,
  );
  const condition =
    "The storage balance is assessed when the scenario is bound to the one source its scheduled valves draw from.";
  const options: ResolutionOption[] =
    only && s.source_id !== only.id
      ? [
          {
            id: "bind",
            basis: "recorded",
            title: `Bind ${s.label} to ${only.label}`,
            role: "irrigation_designer",
            condition,
            detail: `Every scheduled valve draws from it${via.length ? ` through ${list(via)}` : ""}.${only.phase === "unknown" ? " The source's phase is still undeclared (D-02)." : ""}`,
            transform: (next0) => {
              const next = structuredClone(next0);
              const x = next.scenarios.find((r) => r.id === s.id);
              if (x) x.source_id = only.id;
              return next;
            },
          },
        ]
      : [
          newInput(
            "irrigation_designer",
            "Record each scheduled valve's source",
            condition,
            ids.length > 1
              ? "Scheduled valves draw from more than one source, or some have none; a shared storage conclusion needs one."
              : "Bind the scenario to its supplying source in Operating basis.",
          ),
        ];
  return {
    id: "D-06",
    key: "declaration:D-06",
    title: declarationTitles["D-06"],
    message: f.message,
    role: "irrigation_designer",
    view: "operating",
    codes: ["storage_source"],
    findingIds: [f.id],
    facts,
    options,
  };
}

/** D-01: the arrangement the storage and consumption model depends on. */
function processDeclaration(scope: Scope, c: Context, fs: Finding[]) {
  const areas = scope.areas.filter(c.active);
  const pc = scope.production_context;
  const compatible = [pc, ...areas.map((a) => a.context)].every(
    (x) =>
      ["unknown", "single_pass"].includes(x.hydraulic_arrangement) &&
      ["unknown", "drip"].includes(x.application_method),
  );
  const emitters = scope.valves.filter(
    (v) => c.active(v) && v.emitter.method === "independent",
  );
  const facts = [
    `Scope: ${pc.hydraulic_arrangement.replaceAll("_", " ")} arrangement, ${pc.application_method.replaceAll("_", " ")} application.`,
    ...areas.map(
      (a) =>
        `${a.label}: ${a.context.hydraulic_arrangement.replaceAll("_", " ")} arrangement, ${a.context.application_method.replaceAll("_", " ")} application.`,
    ),
    emitters.length
      ? `${plural(emitters.length, "valve")} record independent emitters (${list(emitters.map((v) => v.label))}). Nothing records whether drainage is collected or reused.`
      : "No valve records its emitters.",
  ];
  const condition =
    "Consumption and storage are modelled only for single-pass drip, declared for the scope and every active area.";
  const options: ResolutionOption[] = [];
  if (compatible)
    options.push({
      id: "single-pass-drip",
      basis: "declared",
      title: `Declare single-pass drip for the scope and ${plural(areas.length, "active area")}`,
      role: "irrigation_designer",
      condition,
      detail:
        "Declare this only if drainage runs to waste and water is applied by drippers. It fills fields that are unknown and changes none that are recorded.",
      transform: (s) => {
        const next = structuredClone(s);
        const fill = (x: Scope["production_context"]) => {
          if (x.hydraulic_arrangement === "unknown")
            x.hydraulic_arrangement = "single_pass";
          if (x.application_method === "unknown") x.application_method = "drip";
        };
        fill(next.production_context);
        for (const a of next.areas)
          if (areas.some((x) => x.id === a.id)) fill(a.context);
        return next;
      },
    });
  options.push(
    newInput(
      "irrigation_designer",
      "Record another arrangement",
      "Collected return, recirculating and mixed arrangements are recorded in Production context.",
      "They need separate assessment; the storage balance stays held for them.",
    ),
  );
  return {
    id: "D-01",
    key: "declaration:D-01",
    title: declarationTitles["D-01"],
    message: fs[0].message,
    role: "irrigation_designer" as const,
    view: "overview" as const,
    codes: [...new Set(fs.map(findingCode))],
    findingIds: fs.map((f) => f.id),
    facts,
    options,
  };
}

/** D-12: one declaration per treatment component without a path. */
function filterDeclarations(
  scope: Scope,
  calc: Calculation,
  fs: Finding[],
): Declaration[] {
  const peaks = {
    pump: calc.pump_peak_m3h.value,
    unit: maxOf(calc.group_flows.map((g) => g.unit.value)),
    crop: maxOf(calc.group_flows.map((g) => g.crop.value)),
  };
  const words = {
    pump: "On the pump path",
    unit: "Through the dosing unit",
    crop: "On the crop delivery path",
  } as const;
  return fs.flatMap((f) => {
    const filter = scope.filters.find((x) => x.id === f.record_id);
    if (!filter) return [];
    return [
      {
        id: "D-12",
        key: `declaration:D-12:${filter.id}`,
        title: `${declarationTitles["D-12"]}: ${filter.label}`,
        message: f.message,
        role: "irrigation_designer" as const,
        view: "water" as const,
        codes: ["filter_path"],
        findingIds: [f.id],
        facts: [
          `${filter.label}: ${filter.process || "process not recorded"}; capacity ${known(filter.capacity_m3h) ? `${fmt(filter.capacity_m3h)} m³/h` : "not recorded"}.`,
        ],
        options: (["pump", "unit", "crop"] as const).map((path) => ({
          id: path,
          basis: "declared" as const,
          title: `${words[path]}: duty ${known(peaks[path]) ? `${fmt(peaks[path])} m³/h` : "not yet known"}`,
          role: "irrigation_designer" as const,
          condition:
            "The duty is taken from the declared path: pump peak, dosing-unit peak or the largest crop flow.",
          detail: `Declares where ${filter.label} sits. Its capacity is then checked against that duty.`,
          transform: (s: Scope) => {
            const next = structuredClone(s);
            const x = next.filters.find((r) => r.id === filter.id);
            if (x) x.path = path;
            return next;
          },
        })),
      },
    ];
  });
}

function maxOf(values: (number | null)[]) {
  return values.length && values.every(known)
    ? Math.max(...(values as number[]))
    : null;
}

/** Declarations that need new information; they explain, and offer no edit. */
function informational(
  scope: Scope,
  calc: Calculation,
  c: Context,
  byCode: Map<string, Finding[]>,
  claimed: Set<string>,
): Declaration[] {
  const out: Declaration[] = [];
  const open = (code: string) =>
    (byCode.get(code) ?? []).filter((f) => !claimed.has(f.id));
  const label = (id: string | null) =>
    (id &&
      [
        ...scope.valves,
        ...scope.masters,
        ...scope.sensors,
        ...scope.banks,
        ...scope.crop_groups,
        ...scope.strategies,
      ].find((r) => r.id === id)?.label) ||
    "Record";
  const push = (
    id: string,
    role: ResponsibleRole,
    view: GuidanceView,
    fs: Finding[],
    facts: string[],
    title: string,
    condition: string,
    detail: string,
  ) => {
    if (!fs.length) return;
    out.push({
      id,
      key: `declaration:${id}`,
      title: declarationTitles[id],
      message: fs[0].message,
      role,
      view,
      codes: [...new Set(fs.map(findingCode))],
      findingIds: fs.map((f) => f.id),
      facts,
      options: [newInput(role, title, condition, detail)],
    });
  };

  const density = open("density_area_unknown");
  push(
    "D-03",
    "scope_author",
    "growing",
    density,
    density.map((f) => {
      const crop = c.crops.get(f.record_id ?? "");
      const area = crop?.area_id ? c.areas.get(crop.area_id) : undefined;
      const siblings = scope.crop_groups.filter(
        (x) => x.area_id === crop?.area_id && c.active(x),
      ).length;
      return `${label(f.record_id)}: ${crop?.containers_per_ha ?? "?"} containers per ha in ${area?.label ?? "no area"}${siblings > 1 ? `, shared by ${siblings} crop groups` : ""}.`;
    }),
    "Record the area each crop group represents",
    "Containers are derived from density only with the represented area; an area shared by several crop groups cannot give each its whole area.",
    "Enter the represented area, or the container count, on each crop group.",
  );
  const flow = open("flow_unknown");
  push(
    "D-04",
    "irrigation_designer",
    "growing",
    flow,
    flow.map((f) => {
      const v = c.valves.get(f.record_id ?? "");
      return `${label(f.record_id)}: basis ${v?.flow_basis.replaceAll("_", " ") ?? "unknown"}${v?.allocations.length ? "" : "; no allocations"}.`;
    }),
    "Record each valve's flow basis",
    "Valve flow is measured, a design allowance, or emitter inventory × allocated containers.",
    "Enter the basis and the values it needs in Growing & valves.",
  );
  const timing = open("timing_incomplete");
  push(
    "D-05",
    "grower",
    "operating",
    timing,
    timingGaps(scope, calc, c).map((g) => g.text),
    "Complete the scenario's timing",
    "Timing needs a same-day window, cycle count, spacing and its basis, complete durations and known flows for every scheduled group.",
    "Each line above is one of the engine's timing conditions that is not met.",
  );
  const head = open("head_flow_basis");
  push(
    "D-07",
    "irrigation_designer",
    "water",
    head,
    [
      `Losses entered at ${known(scope.hydraulics.head_basis_flow_m3h) ? `${fmt(scope.hydraulics.head_basis_flow_m3h)} m³/h` : "an unrecorded flow"}.`,
      `Operating pump peak: ${known(calc.pump_peak_m3h.value) ? `${fmt(calc.pump_peak_m3h.value)} m³/h` : "not yet known"}.`,
    ],
    "Confirm the head losses at the operating peak",
    "The review clears when the losses were entered at the pump peak flow.",
    "Re-enter pipe, filter, unit and other losses for the operating peak; entering the peak as the basis without new losses would misstate them.",
  );
  const controllers = new Map(scope.controllers.map((r) => [r.id, r]));
  const banks = open("bank_dependency");
  push(
    "D-08",
    "priva_specialist",
    "controls",
    banks,
    banks.map((f) => {
      const b = scope.banks.find((x) => x.id === f.record_id);
      if (!b) return label(f.record_id);
      const ctl = b.controller_id
        ? controllers.get(b.controller_id)
        : undefined;
      const gaps = [
        b.phase === "unknown" ? "phase" : "",
        b.physical_bank.trim() ? "" : "physical bank",
        b.signal === "unknown" ? "signal" : "",
        b.voltage.trim() ? "" : "voltage",
        !ctl
          ? "controller"
          : ctl.phase === "unknown"
            ? `${ctl.label} phase`
            : "",
      ].filter(Boolean);
      return `${b.label}: ${gaps.length ? `missing ${list(gaps)}` : "complete"}.`;
    }),
    "Record each bank's controller, signal and voltage",
    "Available I/O is concluded only for a bank with a declared phase, physical identity, signal, voltage and an applicable controller.",
    "Take these from the controller audit; the draft does not invent them.",
  );
  const control = open("control_unknown");
  push(
    "D-09",
    "priva_specialist",
    "controls",
    control,
    [`Not recorded for ${list(control.map((f) => label(f.record_id)))}.`],
    "Record who controls each device",
    "Output demand is assessed once each device is manual, external or on a PPO controller.",
    "Choose the owner on each valve, master or sensor.",
  );
  const io = open("io_assignment");
  push(
    "D-10",
    "priva_specialist",
    "controls",
    io,
    io.map(
      (f) =>
        `${label(f.record_id)}: bank, controller or additional-channel demand not recorded.`,
    ),
    "Record the bank and channel demand",
    "A controller-owned device needs a typed physical bank and an explicit additional-channel demand.",
    "Assign the bank and enter the channels the device adds.",
  );
  const strategy = [...byCode.keys()]
    .filter((code) => code.startsWith("strategy_"))
    .flatMap(open);
  push(
    "D-11",
    "priva_specialist",
    "controls",
    strategy,
    [
      ...new Set(
        strategy.map((f) => {
          const s = scope.strategies.find((x) => x.id === f.record_id);
          return s
            ? `${s.label}: trigger ${s.trigger || "not recorded"}; reset ${s.reset_basis || "not recorded"}; fallback ${s.fallback || "not recorded"}.`
            : label(f.record_id);
        }),
      ),
    ],
    "Specify the strategy with its evidence",
    "A strategy is assessed with an applicable sensor, target groups, trigger, reset, fallback and capability evidence.",
    "The draft holds a requirement, not an executable strategy.",
  );
  return out;
}

/** Every declaration the current draft needs, in register order. */
export function declarations(scope: Scope, calc: Calculation): Declaration[] {
  const c = context(scope);
  const byCode = new Map<string, Finding[]>();
  for (const f of calc.findings)
    byCode.set(findingCode(f), [...(byCode.get(findingCode(f)) ?? []), f]);
  const out: Declaration[] = [];
  const process = [
    ...(byCode.get("process_unknown") ?? []),
    ...(byCode.get("process_balance_held") ?? []),
  ];
  if (process.length) out.push(processDeclaration(scope, c, process));
  const phase = phaseDeclaration(scope, calc, c, calc.findings);
  if (phase) out.push(phase);
  const claimed = new Set(phase?.findingIds ?? []);
  const storage = byCode.get("storage_source")?.[0];
  const source = storage ? sourceDeclaration(scope, c, storage) : null;
  out.push(...informational(scope, calc, c, byCode, claimed));
  if (source) out.push(source);
  out.push(...filterDeclarations(scope, calc, byCode.get("filter_path") ?? []));
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** Findings the register covers, for the Overview summary. */
export function declaredCoverage(items: Declaration[]) {
  return new Set(items.flatMap((d) => d.findingIds)).size;
}
