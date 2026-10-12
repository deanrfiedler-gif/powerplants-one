"use client";
import type { ReactNode } from "react";
import { type DrawingModel, num, profileGeometry, profileRules, venloTrussDepth } from "../estimating/specialist/drawing";
import { bayCode, groupLetter, type SheetGeometry } from "../estimating/specialist/workbench";
import { Dims, Labels, SANS, ScaleBar, Withheld, hDim, scaleBar, vDim, type Dim, type Label, type SectionLayers, allLayers } from "./specialist-section";

// The five A3 landscape sheets of the drawing set (design board departures D1,
// D3, D7) and the Configure live plan. Each sheet reads the shared geometry the
// engine's facts give; nothing here is a second quantity calculation. Sheets 01
// to 03 are at true proportion with a bar scale; the bay section exaggerates its
// vertical scale and says so.
const f = (x: number, dp: number) =>
  x.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const r2 = (n: number) => Math.round(n * 100) / 100;
export type Selection = { bay: number; group: number };
export type SheetContext = {
  project: string;
  estimate: string;
  configuration?: string;
  signature: string;
  date: string;
  revision: string;
};
// Bay start positions along the house, the odd bay (parameter length) last.
export const bayPositions = (g: SheetGeometry) => {
  const pos = [0];
  for (let i = 1; i <= g.bays; i++) pos.push(pos[i - 1] + (g.oddBay && i === g.bays ? g.oddBayLength : g.bayLength));
  return pos;
};
export function TitleBlock({ sheet, drawing, context, narrow = false }: { sheet: string; drawing: string; context: SheetContext; narrow?: boolean }) {
  const cells = [
    ["Project", context.project, false],
    ["Drawing", drawing, false],
    ["Estimate", context.estimate, true],
    ["Configuration", `${context.configuration ? `${context.configuration} · ` : ""}CFG ${context.signature}`, true],
    ["Date", context.date, false],
    ["Sheet", `${sheet} / 05`, true],
    ["Rev", context.revision, true],
    ["Scale", "Bar", false],
    ["Status", "Estimating study · not for fabrication", false],
  ] as const;
  return (
    <dl className={`es08-titleblock ${narrow ? "es08-titleblock--narrow" : ""}`}>
      {cells.map(([label, value, mono]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={mono ? "es08-mono" : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function SheetFrame({ left, right, children, sheet, drawing, context, narrow }: { left: string; right: string; children: ReactNode; sheet: string; drawing: string; context: SheetContext; narrow?: boolean }) {
  return (
    <div className="es08-sheet">
      <div className="es08-sheet-head">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      {children}
      <TitleBlock sheet={sheet} drawing={drawing} context={context} narrow={narrow} />
    </div>
  );
}
// Sheet 01 · Plan. Length runs left to right (D7); each field is a selectable
// screen cut, one per bay per group (D3).
export function PlanSheet({ g, drawing: m, selection, onSelect, layers = allLayers, id = "plan" }: { g: SheetGeometry; drawing: DrawingModel; selection: Selection; onSelect: (s: Selection) => void; layers?: SectionLayers; id?: string }) {
  const VW = 940, VH = 660,
    s = Math.min((VW - 280) / g.length, (VH - 160) / g.width),
    x0 = 170, y0 = 64,
    pw = g.length * s, ph = g.width * s, x1 = x0 + pw, y1 = y0 + ph,
    pos = bayPositions(g),
    gh = ph / g.screenGroups,
    cs = g.spanWidth * s,
    labels: Label[] = [],
    hits: { l: string; t: string; w: string; h: string; aria: string; pressed: boolean; bay: number; group: number }[] = [],
    fields: { x: number; y: number; w: number; h: number }[] = [],
    dense = g.bays * g.screenGroups > 400;
  for (let gg = 0; gg < g.screenGroups; gg++)
    for (let b = 0; b < g.bays; b++) {
      const on = b === selection.bay && gg === selection.group,
        fx = x0 + pos[b] * s, fy = y0 + gg * gh, bw = (pos[b + 1] - pos[b]) * s;
      fields.push({ x: fx, y: fy, w: bw, h: gh });
      if (!dense) {
        labels.push({ x: fx + bw / 2, y: fy + gh / 2, text: `${bayCode(b)}·${groupLetter(gg)}`, fs: 10, fw: on ? 700 : 400, fill: on ? "#243f5a" : "#526078" });
        hits.push({ l: `${((fx / VW) * 100).toFixed(3)}%`, t: `${((fy / VH) * 100).toFixed(3)}%`, w: `${((bw / VW) * 100).toFixed(3)}%`, h: `${((gh / VH) * 100).toFixed(3)}%`, aria: `Select field ${bayCode(b)} group ${groupLetter(gg)}`, pressed: on, bay: b, group: gg });
      }
    }
  const bays = pos.map((p) => ({ x1: x0 + p * s, y1: y0, x2: x0 + p * s, y2: y1 })),
    major = Array.from({ length: g.spans + 1 }, (_, j) => ({ x1: x0, y1: y0 + j * cs, x2: x1, y2: y0 + j * cs })),
    minor: { x1: number; y1: number; x2: number; y2: number }[] = [],
    ridges: { x1: number; y1: number; x2: number; y2: number; c: string; w: number; dash: string }[] = [],
    roofW = num(m.roof_width);
  for (let k = 0; k < g.spans; k++) {
    if (m.profile === "Venlo" && roofW > 0) {
      const nr = Math.round(g.spanWidth / roofW);
      for (let ri = 0; ri < nr; ri++) {
        if (ri > 0) minor.push({ x1: x0, y1: y0 + k * cs + ri * roofW * s, x2: x1, y2: y0 + k * cs + ri * roofW * s });
        ridges.push({ x1: x0, y1: y0 + k * cs + (ri + 0.5) * roofW * s, x2: x1, y2: y0 + k * cs + (ri + 0.5) * roofW * s, c: "#242a37", w: 0.8, dash: "2 3" });
      }
    } else if (m.profile === "Sawtooth") ridges.push({ x1: x0, y1: y0 + (k + 1) * cs - 2, x2: x1, y2: y0 + (k + 1) * cs - 2, c: "#346580", w: 2.6, dash: "0" });
    else ridges.push({ x1: x0, y1: y0 + k * cs + cs / 2, x2: x1, y2: y0 + k * cs + cs / 2, c: "#242a37", w: 0.8, dash: "2 3" });
  }
  const posts: { x: number; y: number }[] = [];
  if (g.bays * g.spans <= 2500) for (let pj = 0; pj <= g.spans; pj++) for (let pi = 0; pi <= g.bays; pi++) posts.push({ x: x0 + pos[pi] * s - 2.5, y: y0 + pj * cs - 2.5 });
  const drive: { x1: number; y1: number; x2: number; y2: number }[] = [],
    shafts: { x1: number; y1: number; x2: number; y2: number }[] = [],
    motors: { lx1: number; lx2: number; cy: number; x: number; y: number }[] = [],
    brackets: { x: number; xt: number; y1: number; y2: number }[] = [],
    groupLines: { x1: number; y1: number; x2: number; y2: number }[] = [],
    kW = ph / g.calcWidth,
    motorGroupH = (g.calcWidth / g.groupsAcross) * kW;
  for (let dg = 0; dg < g.groupsAcross; dg++) {
    let first: number | null = null, last = 0;
    for (let dk = 0; dk < g.perGroupDrives; dk++) {
      const yy = r2(y0 + ((dg * g.calcWidth) / g.groupsAcross + g.drive0 + dk * g.spacing) * kW);
      if (yy > y1 + 0.5) continue;
      if (first === null) first = yy;
      last = yy;
      drive.push({ x1: x0, y1: yy, x2: x1, y2: yy });
    }
    if (first !== null) shafts.push({ x1: x0 - 8, y1: first, x2: x0 - 8, y2: last });
    const cy = Math.min(y1 - 9, y0 + dg * motorGroupH + motorGroupH / 2);
    motors.push({ lx1: x0 - 16, lx2: x0 - 8, cy, x: x0 - 34, y: cy - 9 });
    labels.push({ x: x0 - 25, y: cy, text: "M", fs: 10, fw: 700, fill: "#ffffff", sans: true });
    labels.push({ x: x0 - 42, y: cy, text: `M${dg + 1}`, anchor: "end", fs: 11, fw: 500 });
    if (dg > 0) groupLines.push({ x1: x0, y1: y0 + dg * motorGroupH, x2: x1, y2: y0 + dg * motorGroupH });
  }
  for (let gg = 0; gg < g.screenGroups; gg++) {
    brackets.push({ x: x1 + 44, xt: x1 + 38, y1: y0 + gg * gh + 6, y2: y0 + (gg + 1) * gh - 6 });
    labels.push({ x: x1 + 60, y: y0 + gg * gh + gh / 2, text: `GROUP ${groupLetter(gg)}`, rot: 90, fs: 11, fw: 700, fill: "#416d33", sans: true, ls: "1px" });
  }
  for (let al = 1; al < g.groupsAlong; al++) groupLines.push({ x1: x0 + (pw * al) / g.groupsAlong, y1: y0, x2: x0 + (pw * al) / g.groupsAlong, y2: y1 });
  for (let sl = 0; sl < g.spans; sl++) labels.push({ x: x1 + 12, y: y0 + sl * cs + cs / 2, text: `S${sl + 1}`, anchor: "start", fs: 11, fill: "#526078" });
  if (!dense) for (let bl = 0; bl < g.bays; bl++) labels.push({ x: x0 + ((pos[bl] + pos[bl + 1]) / 2) * s, y: y1 + 18, text: bayCode(bl), fs: 11, fw: bl === selection.bay ? 700 : 400, fill: bl === selection.bay ? "#243f5a" : "#526078" });
  const dims: Dim[] = [];
  if (layers.dims) {
    dims.push(hDim(x0, x1, y1 + 42));
    labels.push({ x: (x0 + x1) / 2, y: y1 + 42, text: `${f(g.length, 1)} m overall`, bg: true, fs: 12, fw: 500 });
    dims.push(hDim(x0, x0 + g.bayLength * s, y0 - 16));
    labels.push({ x: x0 + g.bayLength * s + 6, y: y0 - 16, text: `${f(g.bayLength, 1)} m bay`, anchor: "start", fs: 11 });
    dims.push(vDim(x0 - 84, y0, y1));
    labels.push({ x: x0 - 84, y: (y0 + y1) / 2, text: `${f(g.width, 1)} m overall`, rot: -90, bg: true, fs: 12, fw: 500 });
  }
  const barMetres = s * 10 <= 220 ? 10 : 5, barStep = barMetres === 10 ? 5 : 1,
    bar = scaleBar(VW - 276, VH - 20, s, barMetres, barStep);
  labels.push({ x: VW - 128, y: VH - 18, text: "Length →", anchor: "start", fs: 10, fill: "#596779", sans: true });
  const sel = { x: x0 + pos[selection.bay] * s, y: y0 + selection.group * gh, w: (pos[selection.bay + 1] - pos[selection.bay]) * s, h: gh },
    aria = `Plan, ${f(g.length, 1)} m long by ${f(g.width, 1)} m wide: ${g.bays} bays, ${g.spans} spans of ${f(g.spanWidth, 1)} m, ${g.count} screen cuts in ${g.screenGroups} motor group${g.screenGroups === 1 ? "" : "s"}. Selected field ${bayCode(selection.bay)}·${groupLetter(selection.group)}.`;
  return (
    <div className="es08-sheet-canvas">
      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={aria} className="es08-sheet-svg" data-sheet-svg={id}>
        <rect width={VW} height={VH} fill="#ffffff" />
        {layers.screen && fields.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#e8f3e2" stroke="#9cc98a" strokeWidth={0.8} />)}
        {layers.structure && (
          <g>
            {minor.map((l, i) => <line key={i} {...l} stroke="#8795a8" strokeWidth={0.8} strokeDasharray="6 4" />)}
            {ridges.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth={l.w} strokeDasharray={l.dash} />)}
            {bays.map((l, i) => <line key={i} {...l} stroke="#526078" strokeWidth={0.9} />)}
            {major.map((l, i) => <line key={i} {...l} stroke="#242a37" strokeWidth={1.4} />)}
            {posts.map((q, i) => <rect key={i} x={q.x} y={q.y} width={5} height={5} fill="#242a37" />)}
          </g>
        )}
        {layers.drive && (
          <g>
            {drive.map((l, i) => <line key={i} {...l} stroke="#416d33" strokeWidth={1.2} strokeDasharray="7 4" />)}
            {groupLines.map((l, i) => <line key={i} {...l} stroke="#416d33" strokeWidth={2.4} strokeDasharray="16 4 3 4" />)}
            {shafts.map((l, i) => <line key={i} {...l} stroke="#416d33" strokeWidth={2.6} />)}
            {motors.map((mo, i) => (
              <g key={i}>
                <line x1={mo.lx1} y1={mo.cy} x2={mo.lx2} y2={mo.cy} stroke="#416d33" strokeWidth={2.6} />
                <rect x={mo.x} y={mo.y} width={18} height={18} rx={2} fill="#242a37" />
              </g>
            ))}
          </g>
        )}
        <rect x={x0} y={y0} width={pw} height={ph} fill="none" stroke="#242a37" strokeWidth={2} />
        {layers.screen && <rect x={sel.x} y={sel.y} width={sel.w} height={sel.h} fill="#355b80" fillOpacity={0.16} stroke="#355b80" strokeWidth={2.4} />}
        {brackets.map((b, i) => (
          <g key={i} stroke="#416d33" strokeWidth={1.2}>
            <line x1={b.x} y1={b.y1} x2={b.x} y2={b.y2} />
            <line x1={b.xt} y1={b.y1} x2={b.x} y2={b.y1} />
            <line x1={b.xt} y1={b.y2} x2={b.x} y2={b.y2} />
          </g>
        ))}
        {layers.dims && <Dims dims={dims} />}
        <ScaleBar bar={bar} />
        <Labels labels={labels.filter((t) => (layers.screen || !/^B\d\d·/.test(t.text)) && (layers.drive || !/^M\d?$|^GROUP/.test(t.text)))} />
      </svg>
      <div className="es08-hits">
        {hits.map((h) => (
          <button key={`${h.bay}-${h.group}`} type="button" aria-label={h.aria} aria-pressed={h.pressed} style={{ left: h.l, top: h.t, width: h.w, height: h.h }} onClick={() => onSelect({ bay: h.bay, group: h.group })} />
        ))}
      </div>
    </div>
  );
}
// Sheet 03 · Longitudinal section: looking across the house, every bay's cloth
// lapping the truss at both ends.
export function LongSheet({ g, drawing: m, selection, layers = allLayers, id = "long" }: { g: SheetGeometry; drawing: DrawingModel; selection: Selection; layers?: SectionLayers; id?: string }) {
  const VW = 1280, VH = 280,
    geo = profileGeometry(m, g.spanWidth),
    gutterM = num(m.gutter),
    s = Math.min(24, (VW - 130) / g.length, 180 / Math.max(geo.top, gutterM)),
    x0 = 110, ground = 200, len = g.length * s, x1 = x0 + len,
    Y = (h: number) => r2(ground - h * s),
    venlo = m.profile === "Venlo",
    gutter = Y(gutterM), ridge = Y(geo.top), screen = Y(g.screenHeight), trussB = Y(gutterM - venloTrussDepth),
    pos = bayPositions(g),
    over = ((g.clothWidth - g.bayLength) / 2) * s,
    labels: Label[] = [],
    columns = pos.map((p) => ({ x: x0 + p * s })),
    trussEnds = venlo ? pos.map((p) => ({ x: x0 + p * s - 3 })) : [],
    frames = venlo ? [] : pos.map((p) => ({ x1: x0 + p * s, y1: gutter, x2: x0 + p * s, y2: ridge })),
    cloth = Array.from({ length: g.bays }, (_, b) => {
      const on = b === selection.bay;
      if (!(g.bays > 40))
        labels.push({ x: x0 + ((pos[b] + pos[b + 1]) / 2) * s, y: ground + 18, text: bayCode(b), fs: 11, fw: on ? 700 : 400, fill: on ? "#243f5a" : "#526078" });
      return { x1: x0 + pos[b] * s - over, x2: x0 + pos[b + 1] * s + over, y: screen + (b % 2) * 3, stroke: on ? "#355b80" : "#62bb46", sw: on ? 4 : 3 };
    }),
    dims: Dim[] = [];
  if (layers.dims) {
    dims.push(hDim(x0, x1, ground + 42));
    labels.push({ x: (x0 + x1) / 2, y: ground + 42, text: `${f(g.length, 1)} m overall`, bg: true, fs: 12, fw: 500 });
    const bx0 = x0 + pos[selection.bay] * s, bx1 = x0 + pos[selection.bay + 1] * s;
    dims.push(hDim(bx0, bx1, ridge - 18));
    labels.push({ x: (bx0 + bx1) / 2, y: ridge - 18, text: `${bayCode(selection.bay)} · ${f(pos[selection.bay + 1] - pos[selection.bay], 1)} m`, bg: true, fs: 11, fw: 500 });
    dims.push(vDim(58, ground, gutter));
    labels.push({ x: 58, y: (ground + gutter) / 2, text: `${m.profile === "Sawtooth" ? "Eave" : "Gutter"} ${f(gutterM, 1)}`, rot: -90, bg: true, fs: 11 });
    dims.push(vDim(88, ground, screen));
    labels.push({ x: 88, y: (ground + screen) / 2 + 12, text: `Screen ${f(g.screenHeight, 1)}`, rot: -90, bg: true, fs: 11 });
    labels.push({ x: (bx0 + bx1) / 2, y: screen + 20, text: `cloth ${g.clothWidth} m`, fs: 11, fw: 700, fill: "#243f5a" });
    labels.push({ x: x1, y: ridge - 10, text: `${profileRules[m.profile].topShort} ${f(geo.top, 2)} m`, anchor: "end", fs: 11, fw: 500 });
  }
  const bar = scaleBar(VW - 178, 268, s, 5, 1),
    aria = `Longitudinal section, ${f(g.length, 1)} m long: ${g.bays} bays of ${f(g.bayLength, 1)} m, gutter ${f(gutterM, 1)} m, screen line ${f(g.screenHeight, 1)} m, ${g.clothWidth} m cloth per bay lapping each truss.`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={aria} className="es08-sheet-svg" data-sheet-svg={id}>
      <defs>
        <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd2dc" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill="#ffffff" />
      <rect x={x0 - 10} y={ground} width={x1 + 22 - x0} height={12} fill={`url(#${id}-hatch)`} />
      <line x1={x0 - 10} y1={ground} x2={x1 + 12} y2={ground} stroke="#242a37" strokeWidth={1.6} />
      {layers.structure && (
        <g>
          <rect x={x0} y={ridge} width={len} height={r2(gutter - ridge)} fill="#f1f5f9" stroke="#242a37" strokeWidth={1.2} />
          {columns.map((c, i) => <line key={i} x1={c.x} y1={ground} x2={c.x} y2={gutter} stroke="#242a37" strokeWidth={3.2} />)}
          {trussEnds.map((t, i) => <rect key={i} x={t.x} y={gutter} width={6} height={r2(trussB - gutter)} fill="#cbd2dc" stroke="#242a37" strokeWidth={0.6} />)}
          {frames.map((l, i) => <line key={i} {...l} stroke="#526078" strokeWidth={1.2} />)}
        </g>
      )}
      {layers.screen && cloth.map((c, i) => <line key={i} x1={c.x1} y1={c.y} x2={c.x2} y2={c.y} stroke={c.stroke} strokeWidth={c.sw} />)}
      {layers.dims && <Dims dims={dims} />}
      <ScaleBar bar={bar} />
      <Labels labels={labels} />
    </svg>
  );
}
// Sheet 04 · Bay section: two bays at mid-span around the selected field.
// Vertical scale exaggerated; the height below the screen is broken and its
// dimension exact.
export function BaySheet({ g, selection, open, layers = allLayers, id = "bay" }: { g: SheetGeometry; selection: Selection; open: boolean; layers?: SectionLayers; id?: string }) {
  const VW = 1280, VH = 330,
    pos = bayPositions(g),
    first = Math.max(0, Math.min(selection.bay, g.bays - 2)),
    widths = [first, first + 1].map((b) => (b < g.bays ? pos[b + 1] - pos[b] : g.bayLength)),
    s = Math.min(120, 900 / (widths[0] + widths[1])),
    x0 = 190, chordY = 80, wireY = 104, clothY = 112, driveY = 152,
    T = [x0, x0 + widths[0] * s, x0 + (widths[0] + widths[1]) * s],
    lap = ((g.clothWidth - g.bayLength) / 2) * s,
    labels: Label[] = [],
    supports: string[] = [],
    cloth: { x1: number; x2: number; y: number; lx: number; pack: string; stroke: string }[] = [];
  T.forEach((x, i) => labels.push({ x, y: 26, text: `Truss ${first + i} · ${f(pos[Math.min(first + i, g.bays)], 1)} m`, fs: 11, fill: "#526078" }));
  for (let b = 0; b < 2; b++) {
    const bi = first + b, on = bi === selection.bay, stroke = on ? "#355b80" : "#62bb46",
      ta = T[b], tb = T[b + 1], yy = clothY + b * 4;
    if (g.bed === "Crosswire")
      for (let k = 1; k <= g.supportsPerBay; k++) {
        const sx = ta + ((tb - ta) * k) / (g.supportsPerBay + 1);
        supports.push(`M ${sx - 8} ${wireY} L ${sx + 8} ${wireY} M ${sx} ${wireY - 10} L ${sx} ${wireY}`);
      }
    if (!open) cloth.push({ x1: ta - lap, x2: tb + lap, y: yy, lx: tb + lap - 8, pack: "", stroke });
    else {
      const p: string[] = [], px = ta - lap;
      for (let z = 0; z <= 8; z++) p.push(`${px + z * 7},${yy + (z % 2 ? -7 : 7)}`);
      cloth.push({ x1: ta - lap, x2: ta - lap, y: yy, lx: px + 64, pack: p.join(" "), stroke });
    }
    labels.push({ x: (ta + tb) / 2, y: 192, text: `${bayCode(bi)}${on ? " · selected" : ""}`, fs: 12, fw: on ? 700 : 500, fill: on ? "#243f5a" : "#526078" });
  }
  const lead = cloth[1].lx,
    marks = [
      { n: "1", x: T[2] + 22, y: chordY + 8 },
      { n: "2", x: T[1] + ((T[2] - T[1]) * 2) / 3 + 18, y: wireY - 14 },
      { n: "3", x: lead + 20, y: clothY + 22 },
      { n: "4", x: T[2] - 40, y: driveY + 18 },
    ];
  for (const mk of marks) labels.push({ x: mk.x, y: mk.y, text: mk.n, fs: 10, fw: 700, fill: "#ffffff", sans: true });
  const key = [
    ["1", `Truss chord · ${g.truss.toLowerCase()} ${g.chordHeight} mm · C30 / G30`],
    ["2", g.bed === "Crosswire" ? `Crosswire bed · ${g.supportsPerBay} support${g.supportsPerBay === 1 ? "" : "s"} per bay · C43 / C44` : "Truss clip bed · C43"],
    ["3", `Leading edge · ${g.leading} · C63`],
    ["4", g.drive === "Pinion" ? `Push-pull drive · Pinion ${g.diameter} mm tube · ${g.pipeDiameter} NB pipe · C95 / C99 / C102` : `Cable drive · ${g.pipeDiameter} NB pipe · C95 / C102`],
  ];
  key.forEach((k, i) => labels.push({ x: 190 + (i % 2) * 470, y: 256 + Math.floor(i / 2) * 22, text: `${k[0]}  ${k[1]}`, anchor: "start", fs: 11, sans: true }));
  const dims: Dim[] = [];
  if (layers.dims) {
    dims.push(hDim(T[0], T[1], 50));
    labels.push({ x: (T[0] + T[1]) / 2, y: 50, text: `bay ${f(widths[0], 1)} m`, bg: true, fs: 11, fw: 500 });
    dims.push(hDim(T[1], T[2], 50));
    labels.push({ x: (T[1] + T[2]) / 2, y: 50, text: `bay ${f(widths[1], 1)} m`, bg: true, fs: 11, fw: 500 });
    if (!open) {
      dims.push(hDim(T[0] - lap, T[1] + lap, 222));
      labels.push({ x: (T[0] + T[1]) / 2, y: 222, text: `cloth ${g.clothWidth} m = ${f(widths[0], 1)} + 2 × ${f((g.clothWidth - g.bayLength) / 2, 2)} lap`, bg: true, fs: 11, fw: 500 });
    }
    dims.push(vDim(56, 300, clothY));
    labels.push({ x: 56, y: 236, text: `${f(g.screenHeight, 1)} m to screen`, rot: -90, bg: true, fs: 11, fw: 500 });
  }
  if (first !== 0) labels.push({ x: 84, y: driveY - 14, text: "← motor at B01 gable", anchor: "start", fs: 10, fill: "#416d33", sans: true });
  else labels.push({ x: 106, y: driveY + 28, text: "M1", fs: 11, fw: 500 });
  labels.push({ x: 1236, y: 290, text: open ? "Open · cloth gathered at the fixed truss" : "Closed · leading edge at the next truss", anchor: "end", fs: 11, fw: 500, fill: "#414b5a", sans: true });
  const aria = `Bay section of bays ${bayCode(first)} and ${bayCode(first + 1)}, screen ${open ? "open" : "closed"}: ${g.truss.toLowerCase()} truss chords, ${g.bed.toLowerCase()} bed, cloth lapping ${f((g.clothWidth - g.bayLength) / 2, 2)} m over each truss, ${g.leading} leading edge, ${g.drive} drive.`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={aria} className="es08-sheet-svg" data-sheet-svg={id}>
      <defs>
        <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd2dc" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill="#ffffff" />
      <rect x={80} y={300} width={1170} height={12} fill={`url(#${id}-hatch)`} />
      <line x1={80} y1={300} x2={1250} y2={300} stroke="#242a37" strokeWidth={1.6} />
      {layers.structure && (
        <g>
          <line x1={80} y1={wireY} x2={1250} y2={wireY} stroke="#8795a8" strokeWidth={1} />
          {supports.map((d, i) => <path key={i} d={d} fill="none" stroke="#526078" strokeWidth={1.2} />)}
          {T.map((x, i) => (
            <g key={i}>
              <line x1={x} y1={36} x2={x} y2={chordY} stroke="#242a37" strokeWidth={1} strokeDasharray="3 3" />
              {g.truss === "ROUND" ? <circle cx={x} cy={chordY + 8} r={8} fill="#cbd2dc" stroke="#242a37" strokeWidth={1.4} /> : <rect x={x - 8} y={chordY} width={16} height={16} fill="#cbd2dc" stroke="#242a37" strokeWidth={1.4} />}
            </g>
          ))}
        </g>
      )}
      {layers.screen && cloth.map((c, i) => (
        <g key={i}>
          <line x1={c.x1} y1={c.y} x2={c.x2} y2={c.y} stroke={c.stroke} strokeWidth={4} />
          {c.pack && <polyline points={c.pack} fill="none" stroke={c.stroke} strokeWidth={2} />}
          <circle cx={c.lx} cy={c.y} r={7} fill="#ffffff" stroke="#242a37" strokeWidth={2} />
        </g>
      ))}
      {layers.drive && (
        <g>
          <line x1={first === 0 ? 118 : 80} y1={driveY} x2={1250} y2={driveY} stroke="#416d33" strokeWidth={3.2} />
          {cloth.map((c, i) => <line key={i} x1={c.lx} y1={c.y} x2={c.lx} y2={driveY} stroke="#416d33" strokeWidth={1.6} />)}
          {T.map((x, i) => <rect key={i} x={x - 6} y={driveY - 5} width={12} height={10} fill="#416d33" />)}
          {first === 0 && <rect x={96} y={driveY - 11} width={22} height={22} rx={2} fill="#242a37" />}
        </g>
      )}
      {layers.dims && (
        <g>
          <Dims dims={dims} />
          <path d="M 50 196 l 12 -6 l -12 -6 l 12 -6" fill="#ffffff" stroke="#526078" strokeWidth={1.2} />
        </g>
      )}
      {marks.map((mk, i) => <circle key={i} cx={mk.x} cy={mk.y} r={8} fill="#242a37" />)}
      <Labels labels={labels} />
    </svg>
  );
}
// Sheet 05 · Screen cut: one standard cut to scale along its length, every
// term of the cut-length rule drawn, and the bay inside the cloth width.
export function CutSheet({ g, id = "cut" }: { g: SheetGeometry; id?: string }) {
  const VW = 1280, VH = 420,
    s = Math.min(55, 1060 / g.cut, 150 / g.clothWidth),
    x0 = 110, y0 = 120, h = g.clothWidth * s, w = g.cut * s, x1 = x0 + w,
    cov = g.groupWidth,
    shr = g.groupWidth / (1 - g.shrink) - g.groupWidth,
    rawEnd = g.overhang + cov + shr,
    rem = Math.max(0, g.cut - (rawEnd + g.overhang)),
    b = [0, g.overhang, g.overhang + cov, g.overhang + cov + shr, g.overhang + cov + shr + rem, g.cut].map((mm) => x0 + mm * s),
    segs = [
      { x: b[0], w: b[1] - b[0], fill: `url(#${id}-hatch-c)` },
      { x: b[1], w: b[2] - b[1], fill: "#e8f3e2" },
      { x: b[2], w: b[3] - b[2], fill: `url(#${id}-hatch-s)` },
      { x: b[3], w: Math.max(b[4] - b[3], 1), fill: "#242a37" },
      { x: b[4], w: b[5] - b[4], fill: `url(#${id}-hatch-c)` },
    ],
    lap = ((g.clothWidth - g.bayLength) / 2) * s,
    ticks = b.map((x) => ({ x, y1: y0 - 30, y2: y0 })),
    labels: Label[] = [],
    dims: Dim[] = [],
    leaders: string[] = [],
    tx = x1 - 190;
  labels.push({ x: (b[1] + b[2]) / 2, y: y0 - 22, text: `${f(cov, 2)} coverage · ${f(g.calcWidth, 1)} ÷ ${g.screenGroups} group${g.screenGroups === 1 ? "" : "s"}`, bg: true, fs: 12, fw: 500 });
  leaders.push(`${(b[0] + b[1]) / 2},${y0 - 30} ${(b[0] + b[1]) / 2},${y0 - 62} ${x0 + 40},${y0 - 62}`);
  labels.push({ x: x0 + 44, y: y0 - 62, text: `${f(g.overhang, 2)} overhang`, anchor: "start", fs: 11 });
  leaders.push(`${(b[4] + b[5]) / 2},${y0 - 30} ${(b[4] + b[5]) / 2},${y0 - 102} ${tx},${y0 - 102}`);
  labels.push({ x: tx - 4, y: y0 - 102, text: `${f(g.overhang, 2)} overhang`, anchor: "end", fs: 11 });
  leaders.push(`${(b[2] + b[3]) / 2},${y0 - 30} ${(b[2] + b[3]) / 2},${y0 - 82} ${tx},${y0 - 82}`);
  labels.push({ x: tx - 4, y: y0 - 82, text: `${f(shr, 2)} shrinkage allowance · ${f(cov, 1)} ÷ ${f(1 - g.shrink, 2)} − ${f(cov, 1)}`, anchor: "end", fs: 11, fill: "#80530e" });
  leaders.push(`${b[3]},${y0 - 30} ${b[3]},${y0 - 62} ${tx},${y0 - 62}`);
  labels.push({ x: tx - 4, y: y0 - 62, text: `${f(rem, 2)} rounding remainder · up to 0.1 m`, anchor: "end", fs: 11 });
  dims.push(hDim(x0, x1, y0 + h + 34));
  labels.push({ x: (x0 + x1) / 2, y: y0 + h + 34, text: `Cut length ${f(g.cut, 1)} m = ceil 0.1 ( ${f(cov, 1)} ÷ (1 − ${f(g.shrink, 2)}) + 2 × ${f(g.overhang, 2)} )`, bg: true, fs: 12, fw: 700 });
  dims.push(vDim(x1 + 30, y0, y0 + h));
  labels.push({ x: x1 + 30, y: y0 + h / 2, text: `cloth ${g.clothWidth} m`, rot: -90, bg: true, fs: 11, fw: 500 });
  dims.push(vDim(x1 + 62, y0 + lap, y0 + h - lap));
  labels.push({ x: x1 + 62, y: y0 + h / 2, text: `bay ${f(g.bayLength, 1)} m`, rot: -90, bg: true, fs: 11, fw: 500, fill: "#243f5a" });
  labels.push({ x: x0 - 8, y: y0 + lap / 2, text: `lap ${f((g.clothWidth - g.bayLength) / 2, 2)}`, anchor: "end", fs: 10, fill: "#243f5a" });
  labels.push({ x: x0 - 8, y: y0 + h - lap / 2, text: `lap ${f((g.clothWidth - g.bayLength) / 2, 2)}`, anchor: "end", fs: 10, fill: "#243f5a" });
  labels.push({ x: (b[1] + b[2]) / 2, y: y0 + h / 2, text: `Covers one ${f(g.bayLength, 1)} m bay across one motor group · CE-LINE-223`, fs: 12, fill: "#2f5224", sans: true });
  labels.push({ x: x0, y: 412, text: "Additional screens round the shrinkage-adjusted base up to 0.1 m first, then add overhang (report r02 §4.1).", anchor: "start", fs: 11, fill: "#596779", sans: true });
  const aria = `Standard screen cut ${f(g.cut, 1)} m by ${g.clothWidth} m: ${f(g.overhang, 2)} m overhang, ${f(cov, 2)} m coverage, ${f(shr, 2)} m shrinkage allowance, ${f(rem, 2)} m rounding remainder and ${f(g.overhang, 2)} m overhang; the ${f(g.bayLength, 1)} m bay sits inside the cloth with a ${f((g.clothWidth - g.bayLength) / 2, 2)} m lap each side.`;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={aria} className="es08-sheet-svg" data-sheet-svg={id}>
      <defs>
        <pattern id={`${id}-hatch-c`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#8795a8" strokeWidth="1.2" />
        </pattern>
        <pattern id={`${id}-hatch-s`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#b77a1b" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width={VW} height={VH} fill="#ffffff" />
      {segs.map((sg, i) => <rect key={i} x={sg.x} y={y0} width={sg.w} height={h} fill={sg.fill} />)}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#242a37" strokeWidth={1.6} />
      <line x1={x0} y1={y0 + lap} x2={x1} y2={y0 + lap} stroke="#355b80" strokeWidth={1.2} strokeDasharray="8 5" />
      <line x1={x0} y1={y0 + h - lap} x2={x1} y2={y0 + h - lap} stroke="#355b80" strokeWidth={1.2} strokeDasharray="8 5" />
      {ticks.map((k, i) => <line key={i} x1={k.x} y1={k.y1} x2={k.x} y2={k.y2} stroke="#526078" strokeWidth={1} />)}
      <Dims dims={dims} />
      {leaders.map((pts, i) => <polyline key={i} points={pts} fill="none" stroke="#526078" strokeWidth={0.9} />)}
      <Labels labels={labels} />
    </svg>
  );
}
// The Configure live plan: a schematic of the grid, cut fields, motor groups
// and drive lines at the current inputs.
export function LivePlan({ g, drawing: m }: { g: SheetGeometry | null; drawing: DrawingModel }) {
  const PW = 400, PH = 250;
  if (!g)
    return (
      <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="Plan withheld until the geometry inputs are valid." className="es08-sheet-svg">
        <rect width={PW} height={PH} fill="#ffffff" />
        <Withheld VW={PW} VH={PH} title="Plan withheld" detail="Resolve the highlighted inputs" />
      </svg>
    );
  const ml = 44, mr = 12, mt = 12, mb = 38,
    dw = PW - ml - mr, dh = PH - mt - mb,
    s = Math.min(dw / g.length, dh / g.width),
    pw = g.length * s, ph = g.width * s,
    x0 = ml + (dw - pw) / 2, y0 = mt + (dh - ph) / 2,
    pos = bayPositions(g),
    gh = ph / g.screenGroups,
    fields: { x: number; y: number; w: number; h: number }[] = [],
    bayLines: { x1: number; y1: number; x2: number; y2: number }[] = [],
    spanLines: { x1: number; y1: number; x2: number; y2: number }[] = [],
    groupLines: { x1: number; y1: number; x2: number; y2: number }[] = [],
    driveLines: { x1: number; y1: number; x2: number; y2: number }[] = [],
    ridgeLines: { x1: number; y1: number; x2: number; y2: number; c: string; w: number; dash: string }[] = [],
    motors: { x: number; y: number }[] = [];
  if (g.bays * g.screenGroups <= 600)
    for (let gg = 0; gg < g.screenGroups; gg++) for (let b = 0; b < g.bays; b++) fields.push({ x: x0 + pos[b] * s, y: y0 + gg * gh, w: (pos[b + 1] - pos[b]) * s, h: gh });
  else fields.push({ x: x0, y: y0, w: pw, h: ph });
  if (g.bays <= 200) for (let bl = 1; bl < g.bays; bl++) bayLines.push({ x1: x0 + pos[bl] * s, y1: y0, x2: x0 + pos[bl] * s, y2: y0 + ph });
  if (g.spans <= 100) for (let sp = 1; sp < g.spans; sp++) spanLines.push({ x1: x0, y1: y0 + sp * g.spanWidth * s, x2: x0 + pw, y2: y0 + sp * g.spanWidth * s });
  for (let gg = 1; gg < g.screenGroups; gg++) groupLines.push({ x1: x0, y1: y0 + gg * gh, x2: x0 + pw, y2: y0 + gg * gh });
  for (let al = 1; al < g.groupsAlong; al++) groupLines.push({ x1: x0 + (pw * al) / g.groupsAlong, y1: y0, x2: x0 + (pw * al) / g.groupsAlong, y2: y0 + ph });
  if (g.perGroupDrives * g.groupsAcross <= 240) {
    const k2 = ph / g.calcWidth;
    for (let g2 = 0; g2 < g.groupsAcross; g2++)
      for (let k = 0; k < g.perGroupDrives; k++) {
        const yy = y0 + ((g2 * g.calcWidth) / g.groupsAcross + g.drive0 + k * g.spacing) * k2;
        if (yy <= y0 + ph + 0.5) driveLines.push({ x1: x0, y1: yy, x2: x0 + pw, y2: yy });
      }
  }
  const sS = ph / g.width, roofW = num(m.roof_width);
  if (g.spans <= 60)
    for (let rs = 0; rs < g.spans; rs++) {
      const Y0 = y0 + rs * g.spanWidth * sS;
      if (m.profile === "Venlo" && roofW > 0) {
        const nr = Math.round(g.spanWidth / roofW);
        for (let ri = 0; ri < nr; ri++) {
          const yr = Y0 + (ri + 0.5) * roofW * sS;
          ridgeLines.push({ x1: x0, y1: yr, x2: x0 + pw, y2: yr, c: "#242a37", w: 0.6, dash: "1 2" });
          if (ri > 0) {
            const yg = Y0 + ri * roofW * sS;
            ridgeLines.push({ x1: x0, y1: yg, x2: x0 + pw, y2: yg, c: "#8795a8", w: 0.7, dash: "4 3" });
          }
        }
      } else if (m.profile === "Sawtooth") {
        const yv = Y0 + g.spanWidth * sS - 1.5;
        ridgeLines.push({ x1: x0, y1: yv, x2: x0 + pw, y2: yv, c: "#346580", w: 1.8, dash: "0" });
      } else {
        const yc = Y0 + (g.spanWidth / 2) * sS;
        ridgeLines.push({ x1: x0, y1: yc, x2: x0 + pw, y2: yc, c: "#242a37", w: 0.6, dash: "1 2" });
      }
    }
  if (g.groupsAcross <= 40) for (let mo = 0; mo < g.groupsAcross; mo++) motors.push({ x: x0 - 16, y: y0 + (mo + 0.5) * (ph / g.groupsAcross) - 5 });
  const wx = x0 - 28, wy = y0 + ph / 2,
    labels: Label[] = [
      { x: wx, y: wy, text: `${f(g.width, 1)} m`, rot: -90, bg: true, fs: 11, fw: 500 },
      { x: x0 + pw / 2, y: y0 + ph + 16, text: `${f(g.length, 1)} m`, bg: true, fs: 11, fw: 500 },
    ],
    aria = `Schematic plan, ${f(g.length, 1)} m long by ${f(g.width, 1)} m wide, ${g.bays} bays and ${g.screenGroups} motor group${g.screenGroups === 1 ? "" : "s"}.`;
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={aria} className="es08-sheet-svg">
      <rect width={PW} height={PH} fill="#ffffff" />
      {fields.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#e8f3e2" stroke="#b5d8a6" strokeWidth={0.6} />)}
      {bayLines.map((l, i) => <line key={i} {...l} stroke="#8795a8" strokeWidth={0.7} />)}
      {spanLines.map((l, i) => <line key={i} {...l} stroke="#242a37" strokeWidth={1} />)}
      {ridgeLines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth={l.w} strokeDasharray={l.dash} />)}
      {driveLines.map((l, i) => <line key={i} {...l} stroke="#416d33" strokeWidth={1} strokeDasharray="4 3" />)}
      {groupLines.map((l, i) => <line key={i} {...l} stroke="#416d33" strokeWidth={1.8} strokeDasharray="10 3 2 3" />)}
      <rect x={x0} y={y0} width={pw} height={ph} fill="none" stroke="#242a37" strokeWidth={1.4} />
      {motors.map((mo, i) => <rect key={i} x={mo.x} y={mo.y} width={10} height={10} fill="#242a37" />)}
      <g stroke="#596779" strokeWidth={0.8}>
        <line x1={wx} y1={y0} x2={wx} y2={y0 + ph} />
        <line x1={wx - 4} y1={y0} x2={wx + 4} y2={y0} />
        <line x1={wx - 4} y1={y0 + ph} x2={wx + 4} y2={y0 + ph} />
        <line x1={x0} y1={y0 + ph + 16} x2={x0 + pw} y2={y0 + ph + 16} />
        <line x1={x0} y1={y0 + ph + 12} x2={x0} y2={y0 + ph + 20} />
        <line x1={x0 + pw} y1={y0 + ph + 12} x2={x0 + pw} y2={y0 + ph + 20} />
      </g>
      <Labels labels={labels} />
    </svg>
  );
}
export const ridgeName = (profile: DrawingModel["profile"]) =>
  profile === "Sawtooth" ? "High-side vent" : profile === "Arch" || profile === "Gothic" ? "Crown" : "Ridge";
// Save one rendered sheet as a standalone SVG file; the browser's own
// serialisation, with the fonts the sheet names.
export function downloadSvg(id: string, filename: string) {
  const node = document.querySelector<SVGSVGElement>(`[data-sheet-svg="${id}"]`);
  if (!node) return;
  const clone = node.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("font-family", SANS);
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`,
    url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" })),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
export function downloadText(text: string, filename: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
