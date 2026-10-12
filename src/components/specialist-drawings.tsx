"use client";
import Link from "next/link";
import { useState } from "react";
import { profileDescription } from "../estimating/specialist/drawing";
import { bayCode, coverageReconciliation, cutSchedule, groupLetter, untestedName } from "../estimating/specialist/workbench";
import { SectionDrawing, Withheld, allLayers, type SectionLayers } from "./specialist-section";
import { BaySheet, CutSheet, LongSheet, PlanSheet, SheetFrame, bayPositions, downloadSvg, downloadText, type Selection, type SheetContext } from "./specialist-sheets";
import type { Bench } from "./specialist-types";
import { Dialog, Icon, Notice, Pill, Segmented, fmt, usePhone } from "./specialist-ui";

// Drawings (design board artboard 02): the toolbar with the roof profile,
// layer switches and sheet navigation; five A3 landscape sheets each with a
// title block marked "Estimating study · not for fabrication"; the linked field
// inspector and legend; the priced cut schedule and the unpriced coverage
// cross-check (D3). Everything draws from the same geometry as Configure.
const layerDefs: [keyof SectionLayers, string][] = [
  ["structure", "Structure & posts"],
  ["screen", "Screen cuts"],
  ["drive", "Drive & motors"],
  ["dims", "Dimensions"],
];
export function DrawingsView({ bench }: { bench: Bench }) {
  const { geometry: g, drawing, data, signature, untested } = bench,
    [selection, setSelection] = useState<Selection>({ bay: 2, group: 0 }),
    [open, setOpen] = useState(false),
    [inspectorOpen, setInspectorOpen] = useState(false),
    phone = usePhone(),
    [layers, setLayers] = useState<SectionLayers>(allLayers),
    drawingError = Object.values(bench.drawingErrors)[0],
    site = data.source.source?.site?.display_name ?? "Saved scope",
    context: SheetContext = {
      project: site,
      estimate: `${data.estimate ? `Estimate v${data.estimate.version}` : "No estimate"} · option ${data.source.option_label}`,
      configuration: data.configuration.display_number,
      signature,
      date: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
      revision: `Draft v${data.configuration.version}`,
    };
  const schedule = cutSchedule(bench.calculation, bench.proposal),
    cover = g ? coverageReconciliation(g) : null,
    exportCsv = () => {
      if (!schedule || !g) return;
      const lines = [
        ["Cut", "Detail", "Length m", "Width m", "Qty", "Cloth m2"].join(","),
        ...schedule.rows.map((r) => [r.label, r.detail, r.length === null ? "" : r.length.toFixed(1), r.width === null ? "" : r.width.toFixed(2), r.qty, r.cloth.toFixed(1)].map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")),
        "",
        `"Configuration","${data.configuration.display_number} ${data.configuration.name}"`,
        `"Signature","CFG ${signature}"`,
        `"Definition","SS-RECOVERED-QTY-r02"`,
        `"Status","Estimating study · not for fabrication · synthetic"`,
      ];
      downloadText(lines.join("\n"), `PPO-ES08-cut-schedule-${signature}.csv`);
    };
  if (!g)
    return (
      <div className="es08-view">
        <ViewHead bench={bench} exportCsv={exportCsv} disabled />
        <Notice tone="danger" title="Drawing set withheld" action={<Link href={`/estimating/configurations/${bench.id}/configure`}>Resolve the inputs in Configure</Link>}>
          The sheets draw only from a current calculation. Resolve the highlighted quantity inputs first; saved runs stay untouched.
        </Notice>
      </div>
    );
  // The remembered selection is clamped to the current grid, so a smaller
  // house never points at a field that no longer exists.
  const pos = bayPositions(g),
    sel: Selection = { bay: Math.min(selection.bay, g.bays - 1), group: Math.min(selection.group, g.screenGroups - 1) },
    bayFrom = pos[sel.bay],
    bayTo = pos[sel.bay + 1],
    groupW = g.calcWidth / g.screenGroups,
    rows = [
      ["Bay", `${String(sel.bay + 1).padStart(2, "0")} of ${g.bays} · ${fmt(bayFrom, 1)}–${fmt(bayTo, 1)} m along`],
      ["Motor group", `${groupLetter(sel.group)} · ${fmt(sel.group * groupW, 1)}–${fmt((sel.group + 1) * groupW, 1)} m across`],
      ["Cut", `${fmt(g.cut, 1)} m × ${g.clothWidth} m · ${fmt(g.cut * g.clothWidth, 1)} m²`],
      ["Overhang and fixing", `${fmt(g.overhang, 2)} m each end · ${g.edge.toLowerCase()}`],
      ["Leading edge", g.leading],
      ["Drive lines", `${g.perGroupDrives} at ${fmt(g.spacing, 2)} m · ${g.drive}`],
      ["Motor", `M${Math.min(sel.group, g.groupsAcross - 1) + 1} · ${g.torque ? `${g.torque} Nm comparison band` : "torque band unavailable"}`],
      ["Validation", untested.length ? `${untested.map(untestedName).join(", ")} untested · no historical quote` : "No untested options selected"],
    ],
    id = `${bayCode(sel.bay)}·${groupLetter(sel.group)}`,
    sheetHead = (n: string, title: string) => `${site} · ${n} ${title}`,
    right = `${context.revision} · Estimating study · not for fabrication`;
  const inspector = <>
          <section className="es08-card" aria-labelledby="es08-insp-h">
            <div className="es08-insp-head">
              <span id="es08-insp-h" className="es08-eyebrow">Selected screen field</span>
              <div>
                <span role="status" className="es08-insp-id es08-mono">{id}</span>
                <Pill tone="ok">Priced · CE-LINE-223</Pill>
              </div>
            </div>
            <dl className="es08-rows">
              {rows.map(([k, val]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
            <div className="es08-insp-nav">
              <div>
                <span id="es08-nav-bay">Bay</span>
                <div role="group" aria-labelledby="es08-nav-bay" className="es08-pager">
                  <button type="button" aria-label="Previous bay" onClick={() => setSelection({ ...sel, bay: (sel.bay + g.bays - 1) % g.bays })}>
                    <Icon name="chevron-left" />
                  </button>
                  <span className="es08-mono">{bayCode(sel.bay)}</span>
                  <button type="button" aria-label="Next bay" onClick={() => setSelection({ ...sel, bay: (sel.bay + 1) % g.bays })}>
                    <Icon name="chevron-right" />
                  </button>
                </div>
              </div>
              <div>
                <span id="es08-nav-group">Motor group</span>
                <Segmented
                  labelledBy="es08-nav-group"
                  size="sm"
                  options={Array.from({ length: Math.min(g.screenGroups, 8) }, (_, i) => ({ value: String(i), label: `Group ${groupLetter(i)}` }))}
                  value={String(sel.group)}
                  onChange={(x) => setSelection({ ...sel, group: Number(x) })}
                />
              </div>
              <p className="es08-sub">Click a field on the plan or step through bays. The group highlights on the cross section; the bay on the longitudinal and bay sections.</p>
            </div>
          </section>
          <section className="es08-card es08-legend-card" aria-labelledby="es08-legend-h">
            <h3 id="es08-legend-h">Legend</h3>
            <ul className="es08-legend es08-legend--grid">
              <li><span className="es08-key es08-key--column" />Column line</li>
              <li><span className="es08-key es08-key--gutter" />Intermediate gutter</li>
              <li><span className="es08-key es08-key--ridge" />Ridge or crown</li>
              <li><span className="es08-key es08-key--vent" />Sawtooth vent</li>
              <li><span className="es08-key es08-key--post" />Post</li>
              <li><span className="es08-key es08-key--field" />Screen cut</li>
              <li><span className="es08-key es08-key--selected" />Selected field</li>
              <li><span className="es08-key es08-key--driveline" />Drive line</li>
              <li><span className="es08-key es08-key--shaft" />Drive shaft</li>
              <li><span className="es08-key es08-key--motor" />Motor</li>
              <li><span className="es08-key es08-key--lead" />Leading edge</li>
              <li><span className="es08-key es08-key--overhang" />Overhang</li>
            </ul>
          </section>
          <Notice tone="info" title="What these sheets are not" role="none">
            Estimating study only. Trusses, drive layout and screen parking are schematic; hems, seams, attachments, loads and connections are not drawn. Confirm before fabrication.
          </Notice>
        </>;
  return (
    <div className="es08-view">
      <ViewHead bench={bench} exportCsv={exportCsv} />
      <div className="es08-drawbar">
        <div className="es08-drawbar-left">
          <div className="es08-drawbar-profile">
            <span className="es08-eyebrow">Roof profile</span>
            <span>
              {drawing.profile}
              <Link href={`/estimating/configurations/${bench.id}/configure`}>Change in Configure</Link>
            </span>
          </div>
          <fieldset className="es08-layers">
            <legend className="es08-eyebrow">Layers</legend>
            {layerDefs.map(([key, label]) => (
              <label key={key} data-on={layers[key] || undefined}>
                <input type="checkbox" checked={layers[key]} onChange={() => setLayers({ ...layers, [key]: !layers[key] })} />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
        <nav aria-label="Sheets" className="es08-sheet-nav">
          <span className="es08-sub">Sheets</span>
          <a href="#es08-sheet-01">01 Plan</a>
          <a href="#es08-sheet-02">02 Cross section</a>
          <a href="#es08-sheet-03">03 Longitudinal</a>
          <a href="#es08-sheet-04">04 Bay section</a>
          <a href="#es08-sheet-05">05 Screen cut</a>
          <a href="#es08-schedule">Cut schedule</a>
        </nav>
      </div>
      <button type="button" className="ppo-button es08-inspector-trigger" onClick={() => setInspectorOpen(true)}>Selected field {id} · Inspect</button>
      <div className="es08-drawgrid">
        <section id="es08-sheet-01" className="es08-card es08-sheet-card" aria-labelledby="es08-s1-h">
          <SheetHead n="01" title="Plan" sub="Length runs left to right · select a screen field to inspect it on every sheet" svgId="plan" file={`PPO-ES08-01-plan-${signature}.svg`} heading="es08-s1-h" />
          <SheetFrame left={sheetHead("01", `Plan · ${drawing.profile}`)} right={right} sheet="01" drawing={`Plan · ${drawing.profile}`} context={context} narrow>
            <PlanSheet g={g} drawing={drawing} selection={sel} onSelect={selected => { setSelection(selected); if (phone) setInspectorOpen(true); }} layers={layers} />
          </SheetFrame>
        </section>
        {!phone && <aside className="es08-inspector" aria-label="Field inspector and legend">{inspector}</aside>}
        {phone && inspectorOpen && <Dialog title={`Selected screen field ${id}`} close={() => setInspectorOpen(false)} className="es08-dialog--inspector">{inspector}</Dialog>}

      </div>
      <section id="es08-sheet-02" className="es08-card es08-sheet-card" aria-labelledby="es08-s2-h">
        <SheetHead n="02" title="Cross section" sub={`Looking along the house · ${profileDescription(drawing, g.spanWidth)} · true proportion · one screen strip per motor group with overhangs and hooks`} svgId="section" file={`PPO-ES08-02-cross-section-${signature}.svg`} heading="es08-s2-h" />
        <SheetFrame left={sheetHead("02", `Cross section · ${drawing.profile}`)} right={right} sheet="02" drawing={`Cross section · ${drawing.profile}`} context={context}>
          <SectionDrawing geometry={g} drawing={drawing} variant="sheet" selectedGroup={sel.group} layers={layers} id="section" />
        </SheetFrame>
      </section>
      <section id="es08-sheet-03" className="es08-card es08-sheet-card" aria-labelledby="es08-s3-h">
        <SheetHead n="03" title="Longitudinal section" sub={`Looking across the house · ${g.bays} bays of ${fmt(g.bayLength, 1)} m${g.oddBay ? ` (last ${fmt(g.oddBayLength, 1)} m)` : ""} · each cloth laps ${fmt((g.clothWidth - g.bayLength) / 2, 2)} m over the truss at both ends`} svgId="long" file={`PPO-ES08-03-longitudinal-${signature}.svg`} heading="es08-s3-h" />
        <SheetFrame left={sheetHead("03", "Longitudinal section")} right={right} sheet="03" drawing="Longitudinal section" context={context}>
          {drawingError ? (
            <svg viewBox="0 0 1280 280" role="img" aria-label={`Longitudinal section withheld: ${drawingError}`} className="es08-sheet-svg">
              <rect width={1280} height={280} fill="#ffffff" />
              <Withheld VW={1280} VH={280} title="Section withheld" detail={drawingError} />
            </svg>
          ) : (
            <LongSheet g={g} drawing={drawing} selection={sel} layers={layers} />
          )}
        </SheetFrame>
      </section>
      <section id="es08-sheet-04" className="es08-card es08-sheet-card" aria-labelledby="es08-s4-h">
        <SheetHead
          n="04"
          title="Bay section"
          sub="Two bays at mid-span around the selected field · vertical scale exaggerated · height below the screen broken, dimension exact"
          svgId="bay"
          file={`PPO-ES08-04-bay-section-${signature}.svg`}
          heading="es08-s4-h"
        />
        <div className="es08-screen-position"><span>Screen position</span><Segmented
              label="Screen position"
              size="sm"
              options={[
                { value: "closed", label: "Closed" },
                { value: "open", label: "Open" },
              ]}
              value={open ? "open" : "closed"}
              onChange={(x) => setOpen(x === "open")}
            /></div>
        <SheetFrame left={sheetHead("04", "Bay section")} right={right} sheet="04" drawing={`Bay section · ${bayCode(Math.max(0, Math.min(sel.bay, g.bays - 2)))}–${bayCode(Math.max(0, Math.min(sel.bay, g.bays - 2)) + 1)}`} context={context}>
          <BaySheet g={g} selection={sel} open={open} layers={layers} />
        </SheetFrame>
      </section>
      <section id="es08-sheet-05" className="es08-card es08-sheet-card" aria-labelledby="es08-s5-h">
        <SheetHead n="05" title="Screen cut" sub={`One standard cut, to scale along its length: every term of the ${fmt(g.cut, 1)} m cut length, and the ${fmt(g.bayLength, 1)} m bay inside the ${g.clothWidth} m cloth`} svgId="cut" file={`PPO-ES08-05-screen-cut-${signature}.svg`} heading="es08-s5-h" />
        <SheetFrame left={sheetHead("05", "Screen cut")} right={right} sheet="05" drawing="Screen cut · CE-LINE-223" context={context}>
          <CutSheet g={g} />
        </SheetFrame>
      </section>
      <div id="es08-schedule" className="es08-schedule-grid">
        <section className="es08-card" aria-labelledby="es08-cut-h">
          <div className="es08-card-head es08-card-head--stack">
            <span className="es08-eyebrow es08-tone-ok">Priced quantity</span>
            <h3 id="es08-cut-h">Cut schedule</h3>
            <p className="es08-sub">From the recovered rules. This is the quantity carried to Parts &amp; working and Pricing.</p>
          </div>
          <table className="es08-table">
            <thead>
              <tr>
                <th scope="col">Cut</th>
                <th scope="col" className="es08-num">Length</th>
                <th scope="col" className="es08-num">Width</th>
                <th scope="col" className="es08-num">Qty</th>
                <th scope="col" className="es08-num">Cloth</th>
              </tr>
            </thead>
            <tbody>
              {schedule?.rows.map((r) => (
                <tr key={r.id} data-muted={r.muted || undefined}>
                  <td>
                    <div className="es08-strong">{r.label}</div>
                    <div className="es08-mono es08-sub">{r.detail}</div>
                  </td>
                  <td className="es08-num">{r.length === null ? "—" : `${fmt(r.length, 1)} m`}</td>
                  <td className="es08-num">{r.width === null ? "—" : `${fmt(r.width, 2)} m`}</td>
                  <td className="es08-num">{r.qty}</td>
                  <td className="es08-num es08-strong">{fmt(r.cloth, 1)} m²</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={4}>Standard cloth, calculation unit</th>
                <td className="es08-num es08-total">{fmt(schedule?.standard ?? 0, 1)} m²</td>
              </tr>
            </tfoot>
          </table>
          <div className="es08-card-note">
            <Pill tone={bench.gates[3].status === "ok" ? "ok" : bench.gates[3].status === "block" ? "danger" : "neutral"}>Roll fit {bench.gates[3].value.toLowerCase()}</Pill>
            <p className="es08-sub">
              Each cut needs at least {fmt(g.clothWidth * 1000, 0)} mm across the roll.{" "}
              {bench.gates[3].status === "neutral" ? "Enter the usable roll width under Configure → Cloth & edges; the procurement unit stays unconfirmed until then." : bench.gates[3].detail + "."}
            </p>
          </div>
        </section>
        <section className="es08-card" aria-labelledby="es08-xc-h">
          <div className="es08-card-head es08-card-head--stack">
            <span className="es08-eyebrow es08-tone-info">Cross-check · not priced</span>
            <h3 id="es08-xc-h">Coverage reconciliation</h3>
            <p className="es08-sub">Explains why cloth exceeds the covered plan area. Replaces the blueprint&apos;s per-module panel schedule.</p>
          </div>
          {cover && (
            <dl className="es08-rows es08-rows--money">
              <div>
                <dt>
                  <span>Covered plan area</span>
                  <span className="es08-mono es08-sub">{fmt(g.width, 1)} m × {fmt(g.length, 1)} m</span>
                </dt>
                <dd>{fmt(cover.area, 1)} m²</dd>
              </div>
              <div>
                <dt>
                  <span>Length factor · sheet 05</span>
                  <span className="es08-mono es08-sub">{fmt(g.cut, 1)} m cut ÷ {fmt(g.groupWidth, 1)} m coverage</span>
                </dt>
                <dd>× {fmt(cover.lengthFactor, 3)}</dd>
              </div>
              <div>
                <dt>
                  <span>Width factor · sheet 03</span>
                  <span className="es08-mono es08-sub">{g.clothWidth} m cloth ÷ {fmt(g.bayLength, 1)} m bay</span>
                </dt>
                <dd>× {fmt(cover.widthFactor, 3)}</dd>
              </div>
              <div className="es08-rows-total">
                <dt>
                  <span>Explained cloth</span>
                  <span className="es08-mono es08-sub">{fmt(cover.area, 1)} × {fmt(cover.lengthFactor, 3)} × {fmt(cover.widthFactor, 3)} = {fmt(cover.ratio, 3)} × plan area</span>
                </dt>
                <dd>{fmt(cover.explained, 1)} m²</dd>
              </div>
            </dl>
          )}
          {cover && (
            <div className={`es08-card-note es08-card-note--${cover.exact ? "ok" : "warn"}`}>
              <Icon name={cover.exact ? "check" : "warning"} />
              <p className="es08-sub">
                {cover.exact
                  ? `Fully explained: difference ${fmt(Math.abs(cover.difference), 1)} m². No accepted tolerance is defined, so this check explains the quantity; it does not approve it.`
                  : `Difference ${fmt(cover.difference, 1)} m² against the priced ${fmt(cover.cloth, 1)} m²${g.oddBay ? " (the extra-long bay changes the width factor per bay)" : g.individual ? " (individual screens per span change the coverage)" : ""}. No accepted tolerance is defined; review before relying on the cross-check.`}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function ViewHead({ bench, exportCsv, disabled = false }: { bench: Bench; exportCsv: () => void; disabled?: boolean }) {
  const g = bench.geometry;
  return (
    <div className="es08-view-head">
      <div>
        <h2>Drawing set</h2>
        <p>
          Five coordinated sheets generated from the configured structure. They show the priced screen layout from the recovered rules
          {g ? `: one cut per bay per motor group, ${g.count} cuts of ${fmt(g.cut, 1)} × ${g.clothWidth} m.` : "."}
        </p>
      </div>
      <div className="es08-view-actions">
        <button type="button" className="ppo-button" disabled={disabled} onClick={exportCsv}>
          Export cut schedule (CSV)
        </button>
        <button type="button" className="ppo-button ppo-button--primary" disabled={disabled} onClick={() => window.print()}>
          <Icon name="print" />
          Print A3 sheet set
        </button>
      </div>
    </div>
  );
}
function SheetHead({ n, title, sub, svgId, file, heading, extra }: { n: string; title: string; sub: string; svgId: string; file: string; heading: string; extra?: React.ReactNode }) {
  return (
    <div className="es08-sheet-card-head">
      <div className="es08-sheet-id">
        <span aria-hidden="true" className="es08-sheet-n es08-mono">{n}</span>
        <div>
          <h3 id={heading}>{title}</h3>
          <p className="es08-sub">{sub}</p>
        </div>
      </div>
      <div className="es08-view-actions">
        {extra}
        <button type="button" className="ppo-button es08-button--sm" aria-label={`Download ${title.toLowerCase()} as SVG`} onClick={() => downloadSvg(svgId, file)}>
          <Icon name="download" />
          SVG
        </button>
      </div>
    </div>
  );
}
