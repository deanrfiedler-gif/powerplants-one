"use client";
import type { ReactNode } from "react";
import {
  type DrawingModel,
  drawingErrors,
  num,
  profileGeometry,
  profileRules,
  roofHeight,
  roofNote,
  venloTrussDepth,
} from "../estimating/specialist/drawing";
import { groupLetter, type SheetGeometry } from "../estimating/specialist/workbench";

// The one shared cross-section component (design board departure D15): the
// Configure live card, drawing sheet 02 and any later families reference draw
// from this file, so they cannot drift apart. Every section is at true
// proportion: width and height share one scale. A rule breach withholds the
// section rather than drawing an impossible shape (decision section 6).
export type SectionLayers = { structure: boolean; screen: boolean; drive: boolean; dims: boolean };
export const allLayers: SectionLayers = { structure: true, screen: true, drive: true, dims: true };
export type SectionVariant = "sheet" | "card" | "mini";
const VARIANTS = {
  sheet: { VW: 1280, VH: 310, left: 110, right: 40, ground: 228, top: 58, fs: 11, full: true },
  card: { VW: 660, VH: 330, left: 84, right: 56, ground: 262, top: 58, fs: 11, full: false },
  mini: { VW: 400, VH: 236, left: 50, right: 34, ground: 184, top: 44, fs: 10, full: false },
} as const;
export const MONO = "'Roboto Mono', Consolas, monospace",
  SANS = "Roboto, Verdana, sans-serif";
const f = (x: number, dp: number) =>
  x.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const r2 = (n: number) => Math.round(n * 100) / 100;
export type Label = {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  rot?: number;
  fs?: number;
  fw?: number | string;
  fill?: string;
  bg?: boolean;
  sans?: boolean;
  ls?: string;
};
// Drawing text with an optional white halo (the sheet's dimension chips).
export function Labels({ labels }: { labels: Label[] }) {
  return (
    <>
      {labels.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={t.y}
          textAnchor={t.anchor ?? "middle"}
          dominantBaseline="central"
          fontSize={t.fs ?? 11}
          fontWeight={t.fw ?? 400}
          fill={t.fill ?? "#242a37"}
          fontFamily={t.sans ? SANS : MONO}
          letterSpacing={t.ls}
          transform={t.rot ? `rotate(${t.rot} ${t.x} ${t.y})` : undefined}
          stroke={t.bg ? "#ffffff" : undefined}
          strokeWidth={t.bg ? 4 : undefined}
          strokeLinejoin="round"
          paintOrder={t.bg ? "stroke" : undefined}
        >
          {t.text}
        </text>
      ))}
    </>
  );
}
export type Dim = { x1: number; y1: number; x2: number; y2: number; a1: number; b1: number; a2: number; b2: number; c1: number; e1: number; c2: number; e2: number };
export const hDim = (x1: number, x2: number, y: number): Dim => ({ x1, y1: y, x2, y2: y, a1: x1, b1: y - 5, a2: x1, b2: y + 5, c1: x2, e1: y - 5, c2: x2, e2: y + 5 });
export const vDim = (x: number, y1: number, y2: number): Dim => ({ x1: x, y1, x2: x, y2, a1: x - 5, b1: y1, a2: x + 5, b2: y1, c1: x - 5, e1: y2, c2: x + 5, e2: y2 });
export function Dims({ dims }: { dims: Dim[] }) {
  return (
    <>
      {dims.map((d, i) => (
        <g key={i} stroke="#526078" strokeWidth={0.9}>
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
          <line x1={d.a1} y1={d.b1} x2={d.a2} y2={d.b2} />
          <line x1={d.c1} y1={d.e1} x2={d.c2} y2={d.e2} />
        </g>
      ))}
    </>
  );
}
// A bar scale: alternating metre blocks with their labels.
export function scaleBar(x: number, y: number, pxPerM: number, metres: number, step: number) {
  const rects: { x: number; y: number; w: number; h: number; fill: string }[] = [],
    labels: Label[] = [],
    n = metres / step;
  for (let i = 0; i < n; i++)
    rects.push({ x: x + i * step * pxPerM, y, w: step * pxPerM, h: 5, fill: i % 2 ? "#ffffff" : "#242a37" });
  for (let j = 0; j <= n; j++)
    labels.push({ x: x + j * step * pxPerM, y: y - 8, text: `${j * step}${j === n ? " m" : ""}`, fs: 10, fill: "#414b5a" });
  return { rects, labels };
}
export function ScaleBar({ bar }: { bar: ReturnType<typeof scaleBar> }) {
  return (
    <>
      {bar.rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} stroke="#242a37" strokeWidth={0.8} />
      ))}
      <Labels labels={bar.labels} />
    </>
  );
}
export function Withheld({ VW, VH, title, detail, children }: { VW: number; VH: number; title: string; detail: string; children?: ReactNode }) {
  return (
    <>
      <rect x={VW * 0.1} y={VH / 2 - 36} width={VW * 0.8} height={72} rx={6} fill="#fff1ed" stroke="#edc6bd" />
      <text x={VW / 2} y={VH / 2 - 10} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={500} fill="#993b2a" fontFamily={SANS}>
        {title}
      </text>
      <text x={VW / 2} y={VH / 2 + 12} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#993b2a" fontFamily={SANS}>
        {detail}
      </text>
      {children}
    </>
  );
}
export function SectionDrawing({
  geometry: g,
  drawing: m,
  variant = "sheet",
  selectedGroup = -1,
  layers = allLayers,
  spansShown,
  id = "sec",
}: {
  geometry: SheetGeometry;
  drawing: DrawingModel;
  variant?: SectionVariant;
  selectedGroup?: number;
  layers?: SectionLayers;
  spansShown?: number;
  id?: string;
}) {
  const V = VARIANTS[variant],
    { VW, VH, ground } = V,
    sw = g.spanWidth,
    gutter = num(m.gutter),
    errors = drawingErrors(m, sw, g.screenHeight),
    error = Object.values(errors)[0],
    rule = profileRules[m.profile];
  if (error)
    return (
      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={`Cross section withheld: ${error}`} className="es08-sheet-svg">
        <rect width={VW} height={VH} fill="#ffffff" />
        <Withheld VW={VW} VH={VH} title="Section withheld" detail={error} />
      </svg>
    );
  const geo = profileGeometry(m, sw);
  let shown = V.full ? g.spans : Math.min(g.spans, spansShown || 2);
  if (V.full && spansShown) shown = Math.min(g.spans, spansShown);
  const partial = shown < g.spans,
    Wsh = shown * sw,
    Wfull = g.spans * sw,
    avail = VW - V.left - V.right - (partial ? 18 : 0),
    s = Math.min(avail / Wsh, (ground - V.top) / Math.max(geo.top, gutter)),
    x0 = V.left + Math.max(0, (avail - Wsh * s) / 2),
    x1 = x0 + Wsh * s,
    X = (metres: number) => r2(x0 + metres * s),
    Y = (metres: number) => r2(ground - metres * s),
    sw_ = { roof: V.full ? 1.3 : 1.6, web: V.full ? 0.8 : 1, chord: V.full ? 1.1 : 1.4, col: V.full ? 3.2 : 3.6, vent: V.full ? 3.5 : 4.5 };
  const roofs: string[] = [],
    webs: { x1: number; y1: number; x2: number; y2: number }[] = [],
    chords: { x1: number; y1: number; x2: number; y2: number }[] = [],
    columns: { x1: number; y1: number; x2: number; y2: number }[] = [],
    gutters: { x: number; y: number; w: number; h: number }[] = [],
    vents: { x1: number; y1: number; x2: number; y2: number }[] = [],
    labels: Label[] = [];
  const gutY = Y(gutter),
    gW = V.full ? 10 : 12,
    gH = V.full ? 6 : 7,
    roofW = num(m.roof_width);
  for (let k = 0; k < shown; k++) {
    const X0 = k * sw,
      pts: string[] = [];
    let samples: number[] = [];
    if (m.profile === "Venlo") {
      const n = Math.round(sw / roofW);
      for (let j = 0; j <= 2 * n; j++) samples.push((j * roofW) / 2);
    } else if (m.profile === "Gable") samples = [0, sw / 2, sw];
    else if (m.profile === "Sawtooth") samples = [0, sw];
    else for (let q = 0; q <= 40; q++) samples.push((sw * q) / 40);
    for (const lx of samples) pts.push(`${X(X0 + lx)},${Y(gutter + roofHeight(m, sw, geo, lx))}`);
    pts.push(`${X(X0 + sw)},${gutY}`, `${X(X0)},${gutY}`);
    roofs.push(pts.join(" "));
    const at = (lx: number) => Y(gutter + roofHeight(m, sw, geo, lx));
    if (m.profile === "Venlo") {
      const bY = Y(gutter - venloTrussDepth);
      chords.push({ x1: X(X0), y1: bY, x2: X(X0 + sw), y2: bY });
      for (let w = 0; w < 8; w++)
        webs.push({ x1: X(X0 + (sw * w) / 8), y1: w % 2 ? gutY : bY, x2: X(X0 + (sw * (w + 1)) / 8), y2: w % 2 ? bY : gutY });
      for (let gi = 0; gi <= Math.round(sw / roofW); gi++)
        if (k === 0 || gi > 0) gutters.push({ x: X(X0 + gi * roofW) - gW / 2, y: gutY - gH / 2, w: gW, h: gH });
    } else {
      chords.push({ x1: X(X0), y1: gutY, x2: X(X0 + sw), y2: gutY });
      if (m.profile === "Gable") {
        const q1 = sw / 4, q3 = (3 * sw) / 4, t1 = sw / 3, t2 = (2 * sw) / 3;
        webs.push({ x1: X(X0 + t1), y1: gutY, x2: X(X0 + q1), y2: at(q1) });
        webs.push({ x1: X(X0 + t1), y1: gutY, x2: X(X0 + sw / 2), y2: at(sw / 2) });
        webs.push({ x1: X(X0 + t2), y1: gutY, x2: X(X0 + sw / 2), y2: at(sw / 2) });
        webs.push({ x1: X(X0 + t2), y1: gutY, x2: X(X0 + q3), y2: at(q3) });
      } else if (m.profile === "Sawtooth") {
        for (const i of [1, 2]) {
          const lx = (sw * i) / 3;
          webs.push({ x1: X(X0 + lx), y1: gutY, x2: X(X0 + lx), y2: at(lx) });
        }
        webs.push({ x1: X(X0 + sw / 3), y1: gutY, x2: X(X0 + (2 * sw) / 3), y2: at((2 * sw) / 3) });
        webs.push({ x1: X(X0 + (2 * sw) / 3), y1: gutY, x2: X(X0 + sw), y2: at(sw) });
        vents.push({ x1: X(X0 + sw), y1: Y(geo.top), x2: X(X0 + sw), y2: Y(geo.top - num(m.vent)) });
      } else {
        for (const fr of [0.25, 0.5, 0.75]) {
          const lx = sw * fr;
          webs.push({ x1: X(X0 + lx), y1: gutY, x2: X(X0 + lx), y2: at(lx) });
        }
        webs.push({ x1: X(X0 + sw / 2), y1: gutY, x2: X(X0 + sw / 4), y2: at(sw / 4) });
        webs.push({ x1: X(X0 + sw / 2), y1: gutY, x2: X(X0 + (3 * sw) / 4), y2: at((3 * sw) / 4) });
      }
      gutters.push({ x: X(X0) - gW / 2, y: gutY - gH / 2, w: gW, h: gH });
      if (m.profile !== "Sawtooth" && k === shown - 1 && !partial) gutters.push({ x: X(X0 + sw) - gW / 2, y: gutY - gH / 2, w: gW, h: gH });
    }
  }
  for (let ci = 0; ci <= shown; ci++) {
    if (ci === shown && partial) continue;
    const topC = m.profile === "Sawtooth" && ci === shown && !partial ? Y(geo.top) : gutY;
    columns.push({ x1: X(ci * sw), y1: ground, x2: X(ci * sw), y2: topC });
  }
  const screenY = Y(g.screenHeight),
    screens: { x1: number; x2: number; stroke: string; w: number; hooks: string }[] = [],
    drives: { x: number; y: number; r: number }[] = [],
    groupW = Wfull / g.screenGroups,
    oh = g.overhang;
  for (let gg = 0; gg < g.screenGroups; gg++) {
    const a = gg * groupW,
      b = (gg + 1) * groupW;
    if (a >= Wsh - 1e-9) continue;
    const on = gg === selectedGroup,
      stroke = on ? "#355b80" : "#62bb46",
      aa = a - oh,
      bb = Math.min(b + oh, partial ? Wsh : b + oh);
    let hooks = `M ${X(aa)} ${screenY} l 0 ${V.full ? 9 : 8} a 3 3 0 0 0 6 0`;
    if (!(partial && b > Wsh)) hooks += ` M ${X(bb)} ${screenY} l 0 ${V.full ? 9 : 8} a 3 3 0 0 1 -6 0`;
    screens.push({ x1: X(aa) + (gg > 0 ? 3 : 0), x2: X(bb) - (gg < g.screenGroups - 1 && !(partial && b > Wsh) ? 3 : 0), stroke, w: on ? 4 : 3, hooks });
    for (let dk = 0; dk < g.perGroupDrives; dk++) {
      const dx = a + g.drive0 + dk * g.spacing;
      if (dx <= Wsh) drives.push({ x: X(dx), y: screenY + 6, r: V.full ? 3.6 : 3.2 });
    }
    if (V.full && layers.screen)
      labels.push({
        x: X((a + b) / 2),
        y: screenY + 24,
        text: `GROUP ${groupLetter(gg)} · ${f(g.cut, 1)} m cut · ${g.perGroupDrives} drive lines`,
        fs: 11,
        fw: on ? 700 : 500,
        fill: on ? "#243f5a" : "#416d33",
        sans: true,
      });
  }
  const dims: Dim[] = [],
    breaks: string[] = [];
  if (partial) {
    const bx = x1 + 10,
      midY = (ground + Y(geo.top)) / 2;
    breaks.push(`M ${bx} ${ground + 8} L ${bx} ${midY + 9} l 7 -4 l -14 -10 l 7 -4 L ${bx} ${Y(geo.top) - 8}`);
    labels.push({ x: x1, y: ground + 38, text: `${shown} of ${g.spans} spans shown`, anchor: "end", fs: V.fs, fill: "#596779", sans: true });
  }
  if (V.full) for (let sl = 0; sl < shown; sl++) labels.push({ x: X(sl * sw + sw / 2), y: ground + 18, text: `S${sl + 1}`, fs: 11, fill: "#526078" });
  if (layers.dims) {
    if (V.full && !partial) {
      dims.push(hDim(x0, x1, ground + 44));
      labels.push({ x: (x0 + x1) / 2, y: ground + 44, text: `${f(Wfull, 1)} m overall`, bg: true, fs: 12, fw: 500 });
    }
    const spanY = Y(geo.top) - 22;
    dims.push(hDim(X(0), X(sw), spanY));
    labels.push({ x: X(sw / 2), y: spanY, text: `${f(sw, 1)} m span`, bg: true, fs: V.fs });
    const dxG = x0 - (V.full ? 52 : 42),
      dxS = x0 - (V.full ? 22 : 18);
    dims.push(vDim(dxG, ground, gutY));
    labels.push({ x: dxG, y: (ground + gutY) / 2, text: `${m.profile === "Sawtooth" ? "Eave" : "Gutter"} ${f(gutter, 1)}`, rot: -90, bg: true, fs: V.fs });
    dims.push(vDim(dxS, ground, screenY));
    labels.push({ x: dxS, y: (ground + screenY) / 2 + 10, text: `Screen ${f(g.screenHeight, 1)}`, rot: -90, bg: true, fs: V.fs });
    const lastTopX = m.profile === "Sawtooth" ? X(Wsh) : m.profile === "Venlo" ? X(Wsh - roofW / 2) : X(Wsh - sw / 2),
      dxT = partial ? x1 + 36 : Math.min(x1 + 24, VW - 12);
    if (!V.full) {
      dims.push(vDim(dxT, ground, Y(geo.top)));
      labels.push({ x: dxT, y: (ground + Y(geo.top)) / 2, text: `${rule.topShort} ${f(geo.top, 2)}`, rot: -90, bg: true, fs: V.fs, fw: 500 });
    } else labels.push({ x: lastTopX, y: Y(geo.top) - 12, text: `${rule.topShort} ${f(geo.top, 2)} m`, anchor: m.profile === "Sawtooth" ? "end" : "middle", fs: 11, fw: 500 });
    labels.push({ x: x0, y: spanY - 17, text: roofNote(m, sw, geo), anchor: "start", fs: V.fs, fill: "#414b5a", sans: true });
    if (m.profile === "Sawtooth") labels.push({ x: X(sw) + 8, y: Y(geo.top - num(m.vent) / 2), text: "vent", anchor: "start", fs: V.fs, fw: 700, fill: "#346580", sans: true });
    if (V.full) labels.push({ x: x0 + 4, y: screenY + 44, text: `← overhang ${f(oh, 2)} m · hook`, anchor: "start", fs: 10, fill: "#416d33", sans: true });
  }
  const bar = V.full ? scaleBar(VW - V.right - 5 * s, VH - 12, s, 5, 1) : null;
  const aria = `${m.profile} cross section: ${g.spans} spans of ${f(sw, 1)} m, gutter ${f(gutter, 1)} m, ${rule.topShort.toLowerCase()} ${f(geo.top, 2)} m, screen ${f(g.screenHeight, 1)} m${partial ? `, ${shown} spans shown.` : "."}`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={aria} className="es08-sheet-svg" data-sheet-svg={id}>
      <defs>
        <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd2dc" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill="#ffffff" />
      <rect x={x0 - 10} y={ground} width={x1 - x0 + (partial ? 14 : 22)} height={12} fill={`url(#${id}-hatch)`} />
      <line x1={x0 - 10} y1={ground} x2={x1 + (partial ? 4 : 12)} y2={ground} stroke="#242a37" strokeWidth={1.6} />
      {layers.structure && (
        <g>
          {roofs.map((pts, i) => (
            <polygon key={i} points={pts} fill="#eef2f6" stroke="#242a37" strokeWidth={sw_.roof} strokeLinejoin="round" />
          ))}
          {webs.map((l, i) => (
            <line key={i} {...l} stroke="#526078" strokeWidth={sw_.web} />
          ))}
          {chords.map((l, i) => (
            <line key={i} {...l} stroke="#242a37" strokeWidth={sw_.chord} />
          ))}
          {columns.map((l, i) => (
            <line key={i} {...l} stroke="#242a37" strokeWidth={sw_.col} />
          ))}
          {gutters.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#242a37" />
          ))}
          {vents.map((l, i) => (
            <line key={i} {...l} stroke="#346580" strokeWidth={sw_.vent} />
          ))}
        </g>
      )}
      {layers.screen && (
        <g>
          {screens.map((sc, i) => (
            <g key={i}>
              <line x1={sc.x1} y1={screenY} x2={sc.x2} y2={screenY} stroke={sc.stroke} strokeWidth={sc.w} />
              <path d={sc.hooks} fill="none" stroke={sc.stroke} strokeWidth={1.5} />
            </g>
          ))}
        </g>
      )}
      {layers.drive && (
        <g>
          {drives.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ffffff" stroke="#416d33" strokeWidth={1.4} />
          ))}
        </g>
      )}
      {layers.dims && <Dims dims={dims} />}
      {breaks.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#526078" strokeWidth={1.2} strokeLinejoin="round" />
      ))}
      {bar && <ScaleBar bar={bar} />}
      <Labels labels={labels} />
    </svg>
  );
}
