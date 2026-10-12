// Presentation model for the ES-08 Screen Configurator Workbench.
//
// Everything here reads the recovered engine's calculation (facts, positions,
// diagnostics, commercial bridge) and the draft proposal, and shapes them for
// the design board's views: the six configuration sections, the readiness
// strip, the sheet geometry the drawings share, the cut schedule and the
// headline comparison. No quantity is computed here that the engine does not
// already report; where a display figure is derived (an extension, a coverage
// factor) it is labelled as a cross-check, not a priced quantity.
import { definition } from "./definition";
import { R } from "./rational";
import type { Calculation, DraftProposal, Position } from "./types";
import { type DrawingModel, drawingErrors, num, rollFit, type RollFit } from "./drawing";
export const sections = [
  {
    id: "structure",
    group: 0,
    title: "Structure",
    sub: "Grid, heights and profile",
    intro:
      "Physical and calculation geometry. The drawing set and every screen quantity read from these values.",
  },
  {
    id: "cloth",
    group: 1,
    title: "Cloth & edges",
    sub: "Cuts, shrinkage, roll fit",
    intro:
      "Cut rules, edge finishing and the roll-fit check carried over from the blueprint study.",
  },
  {
    id: "bed",
    group: 2,
    title: "Bed & wire",
    sub: "Support system and wire runs",
    intro: "Screen bed fastening, wire runs and fixings.",
  },
  {
    id: "drive",
    group: 3,
    title: "Drive & motors",
    sub: "Spacing, grouping, drive family",
    intro:
      "Drive family, motor grouping and drive spacing. Motor grouping also sets the cut layout on the drawings.",
  },
  {
    id: "supports",
    group: 4,
    title: "Supports & tape",
    sub: "Conditional stock",
    intro: "Conditional support stock and allowances.",
  },
  {
    id: "commercial",
    group: 5,
    title: "Commercial",
    sub: "Currency and charges",
    intro:
      "Exchange rate, discount and the scope of charges. Rates themselves are reviewed under Pricing.",
  },
] as const;
export type SectionId = (typeof sections)[number]["id"];
export const sectionIds = sections.map((s) => s.id) as SectionId[];
export type Inputs = Record<string, string>;
export const inputValues = (p: DraftProposal): Inputs =>
  Object.fromEntries(definition.fields.map((f) => [f.key, p.inputs[f.key].raw]));
type Presentation = {
  when?: (v: Inputs) => boolean;
  off?: string;
  optionLabels?: Record<string, string>;
  wide?: boolean;
  note?: string;
};
const yes = (key: string) => (v: Inputs) => v[key] === "Yes";
const dropperOff = "Used only when droppers are included.";
const transportOff = "Used only when transport is included.";
// The board's presentation of the recovered fields: coded options shown with
// their units, conditional fields greyed with the reason, wide rows. The
// recovered field list, sources and validation are untouched.
export const presentation: Record<string, Presentation> = {
  chordHeight: {
    wide: true,
    optionLabels: Object.fromEntries(
      ["20", "25", "30", "35", "40", "50", "60"].map((v) => [v, `${v} mm`]),
    ),
  },
  roof: { wide: true },
  height: { note: "Sets the screen line on every section." },
  sheet: { when: yes("wider"), off: "Used only when Cut from wider sheet is Yes." },
  crossSpacing: { when: yes("crossClips"), off: "Used only when Crosswire clips is Yes." },
  diameter: {
    when: (v) => v.drive === "Pinion",
    off: "Pinion drives only.",
    optionLabels: { "27": "27 mm", "32": "32 mm" },
  },
  cableLocation: {
    when: (v) => v.drive === "Cable",
    off: "Cable drives only. A separate identity; never inherits a diameter.",
  },
  pipeDiameter: { optionLabels: { "25": "25 NB", "32": "32 NB", "50": "50 NB" } },
  dropPerSpan: { when: yes("droppers"), off: dropperOff },
  dropPerStock: { when: yes("droppers"), off: dropperOff },
  dropStrainers: { when: yes("droppers"), off: dropperOff },
  dropWire: { when: yes("droppers"), off: dropperOff },
  motors: { wide: true },
  braceLength: { when: yes("braces"), off: "Used only when end braces are included." },
  chainLength: { when: yes("chain"), off: "Used only when support chain is included." },
  tapeRolls: { when: yes("tape"), off: "Used only when tape is included." },
  seaCost: { when: yes("freight"), off: transportOff },
  seaMargin: { when: yes("freight"), off: transportOff },
  localCost: { when: yes("freight"), off: transportOff },
  localSell: { when: yes("freight"), off: transportOff },
};
export const fieldEnabled = (key: string, v: Inputs) => presentation[key]?.when?.(v) ?? true;
export const optionLabel = (key: string, value: string) =>
  presentation[key]?.optionLabels?.[value] ?? value;
export const fact = (c: Calculation | null, key: string) =>
  c?.facts.find((f) => f.key === key) ?? null;
export const factNumber = (c: Calculation | null, key: string) => {
  const f = fact(c, key);
  return f ? Number(f.value.display) : null;
};
// The eight-character configuration signature shown on the header, the
// drawing title blocks and the exports: the engine's calculation input hash.
export const configurationSignature = (c: Calculation | null) =>
  c
    ? `${c.calculation_input_hash.slice(0, 4)}-${c.calculation_input_hash.slice(4, 8)}`.toUpperCase()
    : "—";
export const fieldLabel = (key: string) =>
  definition.fields.find((f) => f.key === key)?.label ?? key;
export type Untested = { key: string; label: string; value: string; risk: string };
// Options no historical quote exercises, as the engine reports them.
export function untestedOptions(c: Calculation | null, p: DraftProposal): Untested[] {
  const seen = new Set<string>(),
    out: Untested[] = [];
  for (const d of c?.diagnostics ?? [])
    if (d.code === "UNTESTED" && d.field && !seen.has(d.field)) {
      seen.add(d.field);
      const value = p.inputs[d.field]?.raw ?? "";
      out.push({
        key: d.field,
        label: fieldLabel(d.field),
        value: optionLabel(d.field, value),
        risk: d.message.replace(/^[^:]+:\s*/, ""),
      });
    }
  return out;
}
export const untestedName = (u: Untested) =>
  u.key === "drive" ? `${u.value} drive` : `${u.label} · ${u.value}`;
// Quantity input errors keyed by field, as the engine reports them.
export function inputErrors(c: Calculation | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of c?.diagnostics ?? [])
    if (d.severity === "Error" && d.field && !out[d.field]) out[d.field] = d.message;
  return out;
}
export type SheetGeometry = {
  spans: number;
  wallSpans: number;
  spanWidth: number;
  bays: number;
  bayLength: number;
  oddBay: boolean;
  oddBayLength: number;
  width: number;
  length: number;
  calcWidth: number;
  area: number;
  groupsAcross: number;
  groupsAlong: number;
  screenGroups: number;
  individual: boolean;
  groupWidth: number;
  available: number;
  spaces: number;
  spacing: number;
  drive0: number;
  drives: number;
  perGroupDrives: number;
  count: number;
  cut: number;
  clothWidth: number;
  cloth: number;
  overhang: number;
  shrink: number;
  screenHeight: number;
  supportsPerBay: number;
  truss: string;
  chordHeight: string;
  leading: string;
  drive: string;
  diameter: string;
  pipeDiameter: string;
  bed: string;
  edge: string;
  motorArea: number | null;
  torque: string | null;
};
// Every number the drawings need, read from the engine's facts and the draft.
// Null until the quantity engine has a current calculation: the sheets are
// withheld rather than drawn from stale or invalid inputs.
export function sheetGeometry(c: Calculation | null, p: DraftProposal): SheetGeometry | null {
  if (!c || c.state !== "Current") return null;
  const n = (key: string) => factNumber(c, key),
    v = (key: string) => p.inputs[key].raw;
  const width = n("width"),
    length = n("length"),
    area = n("area"),
    groupWidth = n("groupWidth"),
    available = n("available"),
    spaces = n("spaces"),
    spacing = n("spacing"),
    drives = n("drives"),
    count = n("count"),
    cut = n("cut"),
    clothWidth = n("clothWidth"),
    cloth = n("cloth");
  const required = [width, length, area, groupWidth, available, spaces, spacing, drives, count, cut, clothWidth, cloth];
  if (required.some((x) => x === null || !Number.isFinite(x))) return null;
  const spans = Number(v("spans")),
    wallSpans = Number(v("wallSpans")),
    spanWidth = Number(v("span")),
    individual = v("individual") === "Yes",
    groupsAcross = Number(v("across"));
  return {
    spans,
    wallSpans,
    spanWidth,
    bays: Number(v("bays")),
    bayLength: Number(v("bay")),
    oddBay: v("odd") === "Yes",
    oddBayLength: Number(p.parameters.odd_bay_default_m?.raw ?? "4"),
    width: width!,
    length: length!,
    calcWidth: (spans + wallSpans) * spanWidth,
    area: area!,
    groupsAcross,
    groupsAlong: Number(v("down")),
    screenGroups: individual ? spans + wallSpans : groupsAcross,
    individual,
    groupWidth: groupWidth!,
    available: available!,
    spaces: spaces!,
    spacing: spacing!,
    drive0: Number(p.parameters.drive_span_deduction_m?.raw ?? "0.8") / 2,
    drives: drives!,
    perGroupDrives: spaces! + 1,
    count: count!,
    cut: cut!,
    clothWidth: clothWidth!,
    cloth: cloth!,
    overhang: Number(v("overhang")),
    shrink: Number(v("shrink")) / 100,
    screenHeight: Number(v("height")),
    supportsPerBay: Number(v("supports")),
    truss: v("truss"),
    chordHeight: v("chordHeight"),
    leading: v("leading"),
    drive: v("drive"),
    diameter: v("diameter"),
    pipeDiameter: v("pipeDiameter"),
    bed: v("bed"),
    edge: v("edge"),
    motorArea: n("motorArea"),
    torque: c.torque?.display ?? null,
  };
}
export const groupLetter = (i: number) => String.fromCharCode(65 + (i % 26));
export const bayCode = (i: number) => `B${String(i + 1).padStart(2, "0")}`;
export type GateStatus = "ok" | "warn" | "neutral" | "block";
export type Gate = { id: string; label: string; status: GateStatus; value: string; detail: string };
export type ManualReview = { total: number; outstanding: number; reviewed: number };
export const manualReview = (c: Calculation | null): ManualReview => {
  const total = definition.manual_rows.length,
    outstanding = c ? c.manual_review_required.length : total;
  return { total, outstanding, reviewed: total - outstanding };
};
const f = (x: number, dp: number) =>
  x.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// The six readiness gates of the module header (departure D8). Words first;
// the tone only reinforces them.
export function readinessGates(args: {
  calculation: Calculation | null;
  proposal: DraftProposal;
  drawing: DrawingModel;
  runSequence: number | null;
}): Gate[] {
  const { calculation: c, proposal: p, drawing, runSequence } = args,
    g = sheetGeometry(c, p),
    errors = inputErrors(c),
    inputErrorCount = Object.keys(errors).filter((k) =>
      definition.fields.some((fd) => fd.key === k),
    ).length,
    spanWidth = num(p.inputs.span.raw),
    dErrors = drawingErrors(
      drawing,
      Number.isFinite(spanWidth) ? spanWidth : null,
      Number.isFinite(num(p.inputs.height.raw)) ? num(p.inputs.height.raw) : null,
    ),
    dCount = Object.keys(dErrors).length,
    roll = rollFit(drawing, g?.clothWidth ?? null),
    manual = manualReview(c),
    untested = untestedOptions(c, p);
  const geometry: Gate = !c
    ? { id: "geometry", label: "Geometry", status: "neutral", value: "Not calculated", detail: "Waiting for the first calculation" }
    : c.state !== "Current"
      ? {
          id: "geometry",
          label: "Geometry",
          status: "block",
          value: "Withheld",
          detail: inputErrorCount
            ? `${plural(inputErrorCount, "input")} to resolve`
            : "Calculation rejected the current inputs",
        }
      : dCount
        ? {
            id: "geometry",
            label: "Geometry",
            status: "warn",
            value: "Drawing withheld",
            detail: `Quantities valid · ${plural(dCount, "drawing input")}`,
          }
        : {
            id: "geometry",
            label: "Geometry",
            status: "ok",
            value: "Valid",
            detail: `Model resolves · ${f(g?.area ?? 0, 0)} m² floor`,
          };
  const grid: Gate = !g
    ? { id: "grid", label: "Structural grid", status: "neutral", value: "Not assessed", detail: "Resolve geometry inputs" }
    : g.oddBay
      ? { id: "grid", label: "Structural grid", status: "warn", value: "Extra-long bay", detail: "Parameter bay · cloth set needs review" }
      : {
          id: "grid",
          label: "Structural grid",
          status: "ok",
          value: "Whole grid",
          detail: `${g.bays} bays × ${f(g.bayLength, 1)} m · no residual`,
        };
  const clothGate: Gate = g
    ? { id: "cloth", label: "Cloth width", status: "ok", value: "Exact lookup", detail: `${f(g.bayLength, 1)} m bay → ${g.clothWidth} m cloth` }
    : c && c.diagnostics.some((d) => d.code === "SpecialistClothLookupUnavailable")
      ? { id: "cloth", label: "Cloth width", status: "block", value: "No match", detail: "Bay length is not in the lookup" }
      : { id: "cloth", label: "Cloth width", status: "neutral", value: "Not assessed", detail: "Resolve geometry inputs" };
  const rollGate: Gate =
    roll.status === "not-checked"
      ? { id: "roll", label: "Roll fit", status: "neutral", value: "Not checked", detail: "Enter usable roll width" }
      : roll.status === "invalid"
        ? { id: "roll", label: "Roll fit", status: "block", value: "Invalid", detail: "Enter whole millimetres" }
        : roll.status === "fits"
          ? { id: "roll", label: "Roll fit", status: "ok", value: "Fits", detail: `${f(roll.roll!, 0)} mm ≥ ${f(roll.cloth!, 0)} mm cloth` }
          : { id: "roll", label: "Roll fit", status: "block", value: "Too narrow", detail: `${f(roll.roll!, 0)} mm < ${f(roll.cloth!, 0)} mm cloth` };
  const manualGate: Gate =
    manual.outstanding === 0
      ? { id: "manual", label: "Manual quantities", status: "ok", value: `${manual.total} of ${manual.total} reviewed`, detail: "Reviewed against the current basis" }
      : {
          id: "manual",
          label: "Manual quantities",
          status: "warn",
          value: `${manual.reviewed} of ${manual.total} reviewed`,
          detail: runSequence
            ? `Basis changed since run R${String(runSequence).padStart(2, "0")}`
            : "Review against the current basis",
        };
  const release: Gate = untested.length
    ? {
        id: "release",
        label: "Release",
        status: "warn",
        value: "Review open",
        detail: `${plural(untested.length, "untested option")} · ${untested.map(untestedName).join(", ")}`,
      }
    : { id: "release", label: "Release", status: "warn", value: "Review open", detail: "Engineering acceptance open" };
  return [geometry, grid, clothGate, rollGate, manualGate, release];
}
export type CutRow = {
  id: string;
  label: string;
  detail: string;
  length: number | null;
  width: number | null;
  qty: number;
  cloth: number;
  muted: boolean;
};
// The priced cut schedule carried to Parts & working (departure D3).
export function cutSchedule(c: Calculation | null, p: DraftProposal) {
  const g = sheetGeometry(c, p);
  if (!g) return null;
  const rows: CutRow[] = [
    {
      id: "standard",
      label: "Standard screen cut",
      detail: `CE-LINE-223 · ${bayCode(0)}–${bayCode(g.bays - 1)} × ${g.screenGroups === 1 ? "group A" : `groups ${Array.from({ length: g.screenGroups }, (_, i) => groupLetter(i)).join(", ")}`}`,
      length: g.cut,
      width: g.clothWidth,
      qty: g.count,
      cloth: g.cloth,
      muted: false,
    },
  ];
  const slots = p.extra_screens.map((slot, i) => ({
    slot,
    i,
    area: factNumber(c, `extra${i + 1}`) ?? 0,
    count: Number(slot.count) || 0,
  }));
  if (slots.every((s) => s.count === 0))
    rows.push({
      id: "slots",
      label: "Additional screens, slots 1–5",
      detail: "All slots unused in this option · these round before adding overhang",
      length: null,
      width: null,
      qty: 0,
      cloth: 0,
      muted: true,
    });
  else
    for (const s of slots)
      rows.push({
        id: `slot-${s.i + 1}`,
        label: `Additional screen slot ${s.i + 1}`,
        detail:
          s.count === 0
            ? `CE-LINE-${227 + s.i} · unused`
            : `CE-LINE-${227 + s.i} · ${s.slot.material} · rounds before adding overhang`,
        length:
          s.count === 0
            ? null
            : Math.ceil((Number(s.slot.length) / (1 - g.shrink)) * 10 - 1e-9) / 10 +
              2 * Number(s.slot.overhang),
        width: s.count === 0 ? null : Number(s.slot.width),
        qty: s.count,
        cloth: s.area,
        muted: s.count === 0,
      });
  const offcuts = c?.positions.find((l) => l.key === "CE-LINE-224"),
    offcutArea = offcuts?.effective_quantity ? Number(offcuts.effective_quantity.display) : 0;
  rows.push({
    id: "offcuts",
    label: "Wider-sheet offcuts",
    detail:
      p.inputs.wider.raw === "Yes"
        ? `CE-LINE-224 · ${p.inputs.sheet.raw} m sheet less ${g.clothWidth} m cloth`
        : "Cut from wider sheet is No",
    length: p.inputs.wider.raw === "Yes" ? g.cut : null,
    width: p.inputs.wider.raw === "Yes" ? Number(p.inputs.sheet.raw) - g.clothWidth : null,
    qty: p.inputs.wider.raw === "Yes" ? g.count : 0,
    cloth: offcutArea,
    muted: offcutArea === 0,
  });
  return { rows, standard: g.cloth };
}
// The r10 panel schedule, kept as an unpriced cross-check (departure D3): why
// cloth exceeds the covered plan area. It explains the quantity; it does not
// approve it, because no accepted tolerance is defined.
export function coverageReconciliation(g: SheetGeometry) {
  const area = g.width * g.length,
    lengthFactor = g.groupWidth > 0 ? g.cut / g.groupWidth : 0,
    widthFactor = g.bayLength > 0 ? g.clothWidth / g.bayLength : 0,
    explained = area * lengthFactor * widthFactor,
    difference = g.cloth - explained;
  return {
    area,
    lengthFactor,
    widthFactor,
    explained,
    cloth: g.cloth,
    difference,
    ratio: area > 0 ? explained / area : 0,
    exact: Math.abs(difference) < 0.05 && !g.oddBay && !g.individual,
  };
}
export type Headline = {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  dp: number;
  money?: boolean;
};
export const activeLines = (c: Calculation | null) =>
  (c?.positions ?? []).filter(
    (l) =>
      !l.excluded && (l.effective_quantity === null || l.effective_quantity.numerator !== "0"),
  );
// The estimating metrics compared against a saved run or a scratch baseline.
// They are not an engineering ranking.
export function headline(c: Calculation | null, p: DraftProposal): Headline[] {
  const g = sheetGeometry(c, p);
  return [
    { id: "bays", label: "Bays along length", value: g?.bays ?? null, unit: "", dp: 0 },
    { id: "length", label: "Overall length", value: g?.length ?? null, unit: "m", dp: 1 },
    { id: "area", label: "Floor area", value: g?.area ?? null, unit: "m²", dp: 0 },
    { id: "cuts", label: "Screen cuts", value: g?.count ?? null, unit: "", dp: 0 },
    { id: "cloth", label: "Standard cloth", value: g?.cloth ?? null, unit: "m²", dp: 0 },
    { id: "drives", label: "Drive positions", value: g?.drives ?? null, unit: "", dp: 0 },
    { id: "lines", label: "Active lines", value: c ? activeLines(c).length : null, unit: "", dp: 0 },
    {
      id: "total",
      label: "Review total (illustrative)",
      value: c?.commercial.total ? Number(c.commercial.total.display) : null,
      unit: "",
      dp: 2,
      money: true,
    },
  ];
}
export type PricedLine = {
  position: Position;
  quantity: string;
  costAud: string | null;
  extended: string | null;
  margin: string | null;
  rateMissing: boolean;
};
// Line extensions for the Pricing table: quantity × sell in AUD, with EUR
// costs converted at the quoted rate. Exact arithmetic, the engine's policy.
export function pricedLines(c: Calculation | null, p: DraftProposal): PricedLine[] {
  const fx = p.inputs.fx.raw;
  return activeLines(c)
    .filter((l) => l.row < 383)
    .map((l) => {
      const qty = l.effective_quantity ? R(l.effective_quantity.display) : null,
        numeric = (s: string) => /^\d+(\.\d{1,6})?$/.test(s),
        hasRate = numeric(l.price.cost) && numeric(l.price.sell) && !!l.price.effective_date;
      let costAud: string | null = null,
        extended: string | null = null,
        margin: string | null = null;
      if (hasRate) {
        const cost = l.price.currency === "EUR" && numeric(fx) && Number(fx) > 0 ? R(l.price.cost).div(fx) : R(l.price.cost),
          sell = R(l.price.sell);
        costAud = cost.round(2).display();
        if (qty) extended = qty.mul(sell).round(2).display();
        margin = sell.cmp(0) > 0 ? sell.sub(cost).div(sell).mul(100).round(1).display() : null;
      }
      return {
        position: l,
        quantity: l.effective_quantity?.display ?? "Unresolved",
        costAud,
        extended,
        margin,
        rateMissing: !hasRate,
      };
    });
}
// The five-step working for the standard screen cloth (sheet 05 draws the same
// terms). Other positions show the recovered rule, source formula and facts.
export function clothWorking(g: SheetGeometry) {
  return [
    {
      label: "Coverage per motor group",
      code: g.individual
        ? `one span = ${f(g.spanWidth, 2)} m`
        : `${f(g.calcWidth, 1)} m ÷ ${g.groupsAcross} group${g.groupsAcross === 1 ? "" : "s"} = ${f(g.groupWidth, 2)} m`,
    },
    {
      label: "Cut length",
      code: `ceil 0.1 (${f(g.groupWidth, 2)} ÷ ${f(1 - g.shrink, 3)} + 2 × ${f(g.overhang, 2)}) = ${f(g.cut, 1)} m`,
    },
    { label: "Cloth width", code: `exact lookup: bay ${f(g.bayLength, 2)} m → ${g.clothWidth} m` },
    {
      label: "Screens",
      code: `${g.bays} bays × ${g.screenGroups} group${g.screenGroups === 1 ? "" : "s"}${g.oddBay ? ` − ${g.groupsAcross} odd-bay` : ""} = ${g.count} cuts`,
    },
    { label: "Quantity", code: `${g.count} × ${f(g.cut, 1)} m × ${g.clothWidth} m = ${f(g.cloth, 1)} m²` },
  ];
}
// Source cells a recovered formula reads, for the working panel's input chips.
export function formulaCells(formula: string | null) {
  if (!formula) return [];
  const cells = new Set<string>();
  for (const m of formula.matchAll(/\b([A-Z]{1,2}\d{1,4})\b/g)) cells.add(m[1]);
  return [...cells].slice(0, 12);
}
export const RollFitStatus = (r: RollFit) =>
  r.status === "fits"
    ? "Fits"
    : r.status === "too-narrow"
      ? "Too narrow"
      : r.status === "invalid"
        ? "Invalid"
        : "Not checked";
