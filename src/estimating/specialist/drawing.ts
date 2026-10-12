// ES-08 drawing-only inputs and the shared cross-section geometry.
//
// The design board decision (docs/decisions/es08-design-board.md, section 6)
// fixes five roof profiles, their rise formulas, defaults and ranges. None of
// these values reaches a quantity: the recovered definition SS-RECOVERED-QTY-r02
// has no consumer for a roof profile, pitch, gutter height, roof width, vent or
// roll width (departures D5, D13, D14 and ruling DEC-R2). They are remembered in
// the browser beside the draft, so a drawing-input error withholds the drawings
// and never the 143 quantities. Server-side persistence of this model would be a
// schema change that the decision leaves to a separate authority.
export const profiles = ["Venlo", "Gable", "Arch", "Gothic", "Sawtooth"] as const;
export type Profile = (typeof profiles)[number];
export const roofWidths = ["3.2", "4.0", "4.8"] as const;
export type RoofWidth = (typeof roofWidths)[number];
export const fabricDirections = ["Not set", "Warp along", "Weft along"] as const;
export type FabricDirection = (typeof fabricDirections)[number];
export type DrawingModel = {
  schema_version: 1;
  profile: Profile;
  pitch: Record<Profile, string>;
  gutter: string;
  roof_width: RoofWidth;
  vent: string;
  roll_width: string;
  direction: FabricDirection;
  fabric_reference: string;
};
export type ProfileRule = {
  code: string;
  min: number;
  max: number;
  pitch: string;
  angle: string;
  top: string;
  topShort: string;
  note: string;
  basis: string;
};
// Defaults and ranges from the decision's drawing standard. Gable and Arch
// ranges are proposed conventions; the others equal r10.
export const profileRules: Record<Profile, ProfileRule> = {
  Venlo: {
    code: "VEN",
    min: 18,
    max: 30,
    pitch: "22",
    angle: "Roof pitch",
    top: "Ridge height",
    topShort: "Ridge",
    note: "Venlo rise = roof width ÷ 2 × tan(pitch).",
    basis: "r10 formula, default and range",
  },
  Gable: {
    code: "GAB",
    min: 15,
    max: 35,
    pitch: "22",
    angle: "Roof pitch",
    top: "Ridge height",
    topShort: "Ridge",
    note: "Gable rise = span ÷ 2 × tan(pitch).",
    basis: "r03 profile; range and default proposed",
  },
  Arch: {
    code: "ARC",
    min: 15,
    max: 45,
    pitch: "27",
    angle: "Equivalent rise angle",
    top: "Crown height",
    topShort: "Crown",
    note: "Circular arc through both gutters; rise = span ÷ 2 × tan(angle). Minor segment only.",
    basis: "r10 circular segment; angle input proposed",
  },
  Gothic: {
    code: "GOT",
    min: 20,
    max: 35,
    pitch: "27",
    angle: "Equivalent rise angle",
    top: "Crown height",
    topShort: "Crown",
    note: "Pointed curve, crown factor 0.35; rise = span ÷ 2 × tan(angle).",
    basis: "r10 formula, default and range",
  },
  Sawtooth: {
    code: "SAW",
    min: 5,
    max: 30,
    pitch: "14",
    angle: "Single-slope pitch",
    top: "High side",
    topShort: "High side",
    note: "Sawtooth rise = bay width × tan(pitch).",
    basis: "r10 formula, pitch range and defaults; vent rule proposed",
  },
};
export const venloTrussDepth = 0.45;
export const gothicCrownFactor = 0.35;
export const defaultGutter = "4.0";
export const defaultVent = "0.75";
export const isProfile = (value: unknown): value is Profile =>
  profiles.includes(value as Profile);
export function defaultDrawing(roof?: string): DrawingModel {
  return {
    schema_version: 1,
    profile: isProfile(roof) ? roof : "Venlo",
    pitch: Object.fromEntries(
      profiles.map((p) => [p, profileRules[p].pitch]),
    ) as Record<Profile, string>,
    gutter: defaultGutter,
    roof_width: "3.2",
    vent: defaultVent,
    roll_width: "",
    direction: "Not set",
    fabric_reference: "",
  };
}
const text = (value: unknown, max: number, fallback: string) =>
  typeof value === "string" && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value)
    ? value
    : fallback;
// Browser storage is untrusted: every remembered value is read back through the
// model's own shape and falls back to the default, never to an exception.
export function readDrawing(raw: unknown, roof?: string): DrawingModel {
  const base = defaultDrawing(roof);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const pitch = r.pitch && typeof r.pitch === "object" ? (r.pitch as Record<string, unknown>) : {};
  return {
    schema_version: 1,
    profile: isProfile(r.profile) ? r.profile : base.profile,
    pitch: Object.fromEntries(
      profiles.map((p) => [p, text(pitch[p], 12, base.pitch[p])]),
    ) as Record<Profile, string>,
    gutter: text(r.gutter, 12, base.gutter),
    roof_width: roofWidths.includes(r.roof_width as RoofWidth)
      ? (r.roof_width as RoofWidth)
      : base.roof_width,
    vent: text(r.vent, 12, base.vent),
    roll_width: text(r.roll_width, 12, base.roll_width),
    direction: fabricDirections.includes(r.direction as FabricDirection)
      ? (r.direction as FabricDirection)
      : base.direction,
    fabric_reference: text(r.fabric_reference, 120, base.fabric_reference),
  };
}
export const num = (value: string | null | undefined) => {
  if (value === null || value === undefined) return NaN;
  const t = String(value).trim();
  return t === "" ? NaN : Number(t);
};
export type ProfileGeometry = {
  rise: number;
  top: number;
  underside: number;
  radius: number | null;
};
// Heights above the gutter for the entered profile. Venlo, Gable, Gothic and
// Sawtooth equal r10's formulas; the Arch circle is r10's circular segment.
export function profileGeometry(m: DrawingModel, spanWidth: number): ProfileGeometry {
  const theta = (num(m.pitch[m.profile]) * Math.PI) / 180,
    gutter = num(m.gutter),
    sw = spanWidth;
  let rise = 0,
    radius: number | null = null;
  if (m.profile === "Venlo") rise = (num(m.roof_width) / 2) * Math.tan(theta);
  else if (m.profile === "Sawtooth") rise = sw * Math.tan(theta);
  else {
    rise = (sw / 2) * Math.tan(theta);
    if (m.profile === "Arch") radius = ((sw * sw) / 4 + rise * rise) / (2 * rise);
  }
  return {
    rise,
    top: gutter + rise,
    underside: m.profile === "Venlo" ? gutter - venloTrussDepth : gutter,
    radius,
  };
}
// Roof height above the gutter at a distance lx along one span, 0 ≤ lx ≤ span.
export function roofHeight(
  m: DrawingModel,
  spanWidth: number,
  g: ProfileGeometry,
  lx: number,
) {
  const sw = spanWidth;
  if (m.profile === "Venlo") {
    const rw = num(m.roof_width);
    let x = lx % rw;
    if (x < 0) x += rw;
    if (Math.abs(x - rw) < 1e-9) x = 0;
    return g.rise * (1 - Math.abs(x - rw / 2) / (rw / 2));
  }
  if (m.profile === "Gable") return g.rise * (1 - Math.abs(lx - sw / 2) / (sw / 2));
  if (m.profile === "Arch") {
    const d = lx - sw / 2,
      R = g.radius ?? 0;
    return g.rise - R + Math.sqrt(Math.max(0, R * R - d * d));
  }
  if (m.profile === "Gothic") {
    const t = Math.max(0, Math.min(1, Math.min(lx, sw - lx) / (sw / 2))),
      k = gothicCrownFactor;
    return g.rise * ((2 - k) * t - (1 - k) * t * t);
  }
  return (g.rise * lx) / sw;
}
const f = (x: number, dp: number) =>
  x.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export type DrawingErrors = Partial<
  Record<"pitch" | "gutter" | "roof_width" | "vent" | "height" | "roll_width", string>
>;
// Every rule the decision names withholds the section rather than drawing an
// impossible shape. Span width and screen height come from the quantity
// inputs; a missing or invalid one leaves the drawing rules silent, because the
// quantity engine already reports it.
export function drawingErrors(
  m: DrawingModel,
  spanWidth: number | null,
  screenHeight: number | null,
): DrawingErrors {
  const e: DrawingErrors = {},
    rule = profileRules[m.profile],
    pitch = num(m.pitch[m.profile]),
    gutter = num(m.gutter);
  if (!(Number.isFinite(pitch) && pitch >= rule.min && pitch <= rule.max))
    e.pitch = `${m.profile} accepts ${rule.min}° to ${rule.max}°.`;
  if (!(Number.isFinite(gutter) && gutter > 0)) e.gutter = "Enter a height greater than 0.";
  const roll = String(m.roll_width).trim();
  if (roll !== "" && !(Number.isInteger(Number(roll)) && Number(roll) >= 1))
    e.roll_width = "Enter whole millimetres, or leave blank.";
  if (spanWidth === null || !(spanWidth > 0)) return e;
  if (m.profile === "Venlo") {
    const n = spanWidth / num(m.roof_width);
    if (Math.abs(n - Math.round(n)) > 1e-6)
      e.roof_width = `A ${f(spanWidth, 2)} m span is not a whole number of ${m.roof_width} m roofs.`;
  }
  if (e.pitch || e.gutter) return e;
  const g = profileGeometry(m, spanWidth);
  if (m.profile === "Sawtooth") {
    const vent = num(m.vent);
    if (!(Number.isFinite(vent) && vent > 0 && vent < g.rise))
      e.vent = `The vent must be greater than 0 and less than the ${f(g.rise, 2)} m sawtooth rise.`;
  }
  if (m.profile === "Arch" && g.rise > spanWidth / 2 + 1e-9)
    e.pitch = "The arch rise exceeds half the span. Only a minor circular segment is drawn.";
  if (screenHeight !== null && Number.isFinite(screenHeight) && !(screenHeight < g.underside))
    e.height = `The screen must sit below the structure underside (${f(g.underside, 2)} m${m.profile === "Venlo" ? ", gutter less 0.45 m truss" : ""}).`;
  return e;
}
export type RollFit = {
  status: "not-checked" | "invalid" | "fits" | "too-narrow";
  roll: number | null;
  cloth: number | null;
};
// DEC-R2: neither Not checked nor Too narrow blocks saving a run. Too narrow
// keeps the procurement unit unconfirmed and blocks sending to the estimate.
export function rollFit(m: DrawingModel, clothWidthM: number | null): RollFit {
  const raw = String(m.roll_width).trim(),
    cloth = clothWidthM === null ? null : Math.round(clothWidthM * 1000);
  if (raw === "") return { status: "not-checked", roll: null, cloth };
  const roll = Number(raw);
  if (!(Number.isInteger(roll) && roll >= 1)) return { status: "invalid", roll: null, cloth };
  if (cloth === null) return { status: "not-checked", roll, cloth };
  return { status: roll >= cloth ? "fits" : "too-narrow", roll, cloth };
}
export function roofNote(m: DrawingModel, spanWidth: number, g: ProfileGeometry) {
  const pitch = num(m.pitch[m.profile]);
  if (m.profile === "Venlo")
    return `${f(pitch, 0)}° · ${Math.round(spanWidth / num(m.roof_width))} roofs of ${m.roof_width} m · rise ${f(g.rise, 2)} m`;
  if (m.profile === "Gable") return `${f(pitch, 0)}° · one roof per span · rise ${f(g.rise, 2)} m`;
  if (m.profile === "Arch")
    return `Circular arc R ${f(g.radius ?? 0, 2)} m · rise ${f(g.rise, 2)} m (${f(pitch, 0)}° chord)`;
  if (m.profile === "Gothic")
    return `Pointed curve · crown factor ${gothicCrownFactor} · rise ${f(g.rise, 2)} m (${f(pitch, 0)}°)`;
  return `${f(pitch, 0)}° single slope · rise ${f(g.rise, 2)} m · vent ${f(num(m.vent), 2)} m`;
}
export function profileDescription(m: DrawingModel, spanWidth: number) {
  const pitch = num(m.pitch[m.profile]);
  if (m.profile === "Venlo")
    return `Venlo, ${Math.round(spanWidth / num(m.roof_width))} roofs of ${m.roof_width} m per ${f(spanWidth, 1)} m span at ${f(pitch, 0)}°`;
  if (m.profile === "Gable") return `Gable, one ${f(pitch, 0)}° roof per span, Fink truss`;
  if (m.profile === "Arch") return `Arch, circular arc per span at ${f(pitch, 0)}° equivalent`;
  if (m.profile === "Gothic")
    return `Gothic, pointed curve per span at ${f(pitch, 0)}° equivalent, crown factor ${gothicCrownFactor}`;
  return `Sawtooth, ${f(pitch, 0)}° single slope per bay with ${f(num(m.vent), 2)} m high-side vent`;
}
