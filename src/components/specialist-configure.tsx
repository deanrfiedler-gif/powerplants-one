"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { definition } from "../estimating/specialist/definition";
import {
  type DrawingModel,
  type Profile,
  fabricDirections,
  num,
  profileGeometry,
  profileRules,
  profiles,
  roofWidths,
} from "../estimating/specialist/drawing";
import type { Fact } from "../estimating/specialist/types";
import {
  fieldEnabled,
  manualReview,
  optionLabel,
  presentation,
  sections,
  type SectionId,
} from "../estimating/specialist/workbench";
import { sectionReadiness } from "./specialist-menu";
import { SectionDrawing } from "./specialist-section";
import { LivePlan, ridgeName } from "./specialist-sheets";
import type { Bench } from "./specialist-types";
import { Icon, Pill, Segmented, fmt, runLabel, type Tone } from "./specialist-ui";

// Configure (design board artboard 01): six sections entered once, options as
// segmented buttons (D10), every field with its source cell, a live plan or
// section (D15), the calculation working and the untested-option notices.
// Drawing-only inputs carry a badge; their errors withhold drawings, never
// quantities (D14).
type Spec = {
  key: string;
  id: string;
  label: string;
  unit: string;
  src: string;
  note?: string;
  badge?: "Drawing only" | "Check only";
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
  warn?: string;
  flag?: string;
  wide?: boolean;
  placeholder?: string;
  text?: boolean;
};
const r03Profiles = ["Gable", "Arch", "Venlo"];
export function ConfigureView({ bench, section, setSection }: { bench: Bench; section: SectionId; setSection: (id: SectionId) => void }) {
  const { proposal: p, change, frozen, calculation: c, drawing, setDrawing, errors, drawingErrors: dErr, untested, geometry: g } = bench,
    v = Object.fromEntries(definition.fields.map((f) => [f.key, p.inputs[f.key].raw])),
    [live, setLive] = useState<"plan" | "section">("section"),
    [result, setResult] = useState<string>("cut"),
    sec = sections.find((s) => s.id === section) ?? sections[0],
    index = sections.indexOf(sec),
    warnings: Record<string, string> = {};
  for (const d of c?.diagnostics ?? [])
    if (d.severity === "Warning" && d.field && !["UNTESTED", "SpecialistManualReviewRequired"].includes(d.code) && !warnings[d.field]) warnings[d.field] = `${d.message} (${d.code})`;
  const setInput = (key: string, raw: string) =>
    change((next) => {
      next.inputs[key] = { raw, attribution: { kind: "entered", note: bench.reason, source_field: null } };
    });
  const rule = profileRules[drawing.profile],
    spanWidth = num(v.span),
    geo = Number.isFinite(spanWidth) && spanWidth > 0 && !dErr.pitch && !dErr.gutter ? profileGeometry(drawing, spanWidth) : null;
  const specs: Spec[] = [];
  for (const fd of definition.fields.filter((f) => f.group === sec.group)) {
    const pres = presentation[fd.key] ?? {},
      enabled = fieldEnabled(fd.key, v),
      flag = untested.find((u) => u.key === fd.key);
    if (fd.key === "roof") {
      specs.push({
        key: "roof",
        id: "es08-roof",
        label: "Roof profile",
        unit: "",
        src: "No source cell · drawing input",
        badge: "Drawing only",
        wide: true,
        note: "Gable, Arch and Venlo are r03 inputs; Gothic and Sawtooth come from blueprint r10 (D5). No quantity reads this value.",
        options: profiles.map((x) => ({ value: x, label: x })),
        value: drawing.profile,
        disabled: frozen,
        onChange: (value) => {
          setDrawing({ ...drawing, profile: value as Profile });
          if (r03Profiles.includes(value) && v.roof !== value) setInput("roof", value);
        },
      });
      specs.push({
        key: "pitch",
        id: "es08-pitch",
        label: rule.angle,
        unit: "°",
        src: "Drawing model · per roof profile",
        badge: "Drawing only",
        note: `${rule.note} Range ${rule.min}–${rule.max}°.`,
        value: drawing.pitch[drawing.profile],
        disabled: frozen,
        error: dErr.pitch,
        onChange: (value) => setDrawing({ ...drawing, pitch: { ...drawing.pitch, [drawing.profile]: value } }),
      });
      specs.push({
        key: "gutter",
        id: "es08-gutter",
        label: drawing.profile === "Sawtooth" ? "Eave / gutter height" : "Gutter height",
        unit: "m",
        src: "Drawing model · blueprint r10",
        badge: "Drawing only",
        note: "No Screen Systems quantity reads this value.",
        value: drawing.gutter,
        disabled: frozen,
        error: dErr.gutter,
        onChange: (value) => setDrawing({ ...drawing, gutter: value }),
      });
      specs.push({
        key: "roof_width",
        id: "es08-roof-width",
        label: "Venlo roof width",
        unit: "",
        src: "Drawing model · gutter spacing",
        badge: "Drawing only",
        note: drawing.profile === "Venlo" ? "The span must be a whole number of roofs (D12)." : "Venlo only.",
        options: roofWidths.map((w) => ({ value: w, label: `${w} m` })),
        value: drawing.roof_width,
        disabled: frozen || drawing.profile !== "Venlo",
        error: drawing.profile === "Venlo" ? dErr.roof_width : undefined,
        onChange: (value) => setDrawing({ ...drawing, roof_width: value as DrawingModel["roof_width"] }),
      });
      specs.push({
        key: "vent",
        id: "es08-vent",
        label: "High-side vent opening",
        unit: "m",
        src: "Drawing model · blueprint r10",
        badge: "Drawing only",
        note: drawing.profile === "Sawtooth" ? "Gross geometric opening at each step; less than the sawtooth rise." : "Sawtooth only.",
        value: drawing.vent,
        disabled: frozen || drawing.profile !== "Sawtooth",
        error: drawing.profile === "Sawtooth" ? dErr.vent : undefined,
        onChange: (value) => setDrawing({ ...drawing, vent: value }),
      });
      continue;
    }
    specs.push({
      key: fd.key,
      id: `es08-${fd.key}`,
      label: fd.label,
      unit: fd.unit,
      src: fd.source ? `CALC_ENGINE!${fd.source}${fd.unit === "mm" || fd.unit === "mm NB" ? ` · ${fd.unit}` : ""}` : "No source cell",
      note: enabled ? pres.note || fd.note || undefined : pres.off,
      options: fd.options?.map((o) => ({ value: o, label: optionLabel(fd.key, o) })),
      value: p.inputs[fd.key].raw,
      disabled: frozen || !enabled,
      error: enabled ? (fd.key === "height" ? errors.height ?? dErr.height : errors[fd.key]) : undefined,
      warn: enabled ? warnings[fd.key] : undefined,
      flag: flag ? `Untested · no historical quote exercises ${flag.value}` : undefined,
      wide: pres.wide,
      onChange: (value) => setInput(fd.key, value),
    });
  }
  if (sec.id === "cloth") {
    specs.push({
      key: "roll_width",
      id: "es08-roll-width",
      label: "Usable roll width",
      unit: "mm",
      src: "Roll-fit check · blueprint r10",
      badge: "Check only",
      placeholder: "Not entered",
      note: "Blank means not checked. One cut across the roll needs at least the cloth width (DEC-R2).",
      value: drawing.roll_width,
      disabled: frozen,
      error: dErr.roll_width || (bench.gates[3].status === "block" ? bench.gates[3].detail : undefined),
      onChange: (value) => setDrawing({ ...drawing, roll_width: value }),
    });
    specs.push({
      key: "direction",
      id: "es08-direction",
      label: "Fabric direction",
      unit: "",
      src: "Recorded on sheets · blueprint r10",
      badge: "Check only",
      options: fabricDirections.map((d) => ({ value: d, label: d })),
      value: drawing.direction,
      disabled: frozen,
      onChange: (value) => setDrawing({ ...drawing, direction: value as DrawingModel["direction"] }),
    });
    specs.push({
      key: "fabric_reference",
      id: "es08-fabric-reference",
      label: "Fabric product / reference",
      unit: "",
      src: "Recorded on sheets and exports",
      placeholder: "Optional",
      text: true,
      value: drawing.fabric_reference,
      disabled: frozen,
      onChange: (value) => setDrawing({ ...drawing, fabric_reference: value.slice(0, 120) }),
    });
  }
  const quantityErrors = Object.keys(errors).filter((k) => definition.fields.some((f) => f.key === k)).length,
    drawingErrorCount = Object.keys(dErr).length,
    manual = manualReview(c),
    calcStatus = bench.calculating
      ? { tone: "neutral", text: "Recalculating…" }
      : quantityErrors
        ? { tone: "block", text: `Results withheld until ${quantityErrors} input${quantityErrors === 1 ? " is" : "s are"} resolved.` }
        : !c
          ? { tone: "neutral", text: "Waiting for the first calculation." }
          : drawingErrorCount
            ? { tone: "warn", text: `Quantities current. Drawings withheld until the drawing input${drawingErrorCount === 1 ? " is" : "s are"} resolved.` }
            : { tone: "neutral", text: `Quantities current. ${manual.outstanding} manual quantit${manual.outstanding === 1 ? "y" : "ies"} flagged for review.` };
  const prev = () => index > 0 && setSection(sections[index - 1].id),
    next = () => index < sections.length - 1 && setSection(sections[index + 1].id);
  const results = resultRows(c, g, v);
  return (
    <div className="es08-view">
      <div className="es08-view-head">
        <div>
          <h2>Configure</h2>
          <p>Enter the structure and screen scope once. The drawing set, quantities and price all read these values; saved runs stay intact.</p>
        </div>
        <div className="es08-view-actions">
          {bench.data.current_run && (
            <button
              type="button"
              className="ppo-button"
              disabled={frozen}
              onClick={() =>
                bench.command.send(`${bench.path}/from-run`, "CreateSpecialistDraftFromRun", {
                  expected_version: bench.data.configuration.version,
                  run_id: bench.data.current_run!.id,
                  reason: `Load saved run ${runLabel(bench.data.current_run!.sequence)} as a new draft proposal; manual review required`,
                })
              }
            >
              Load saved run {runLabel(bench.data.current_run.sequence)}
            </button>
          )}
          <Link className="ppo-button ppo-button--primary" href={`/estimating/configurations/${bench.id}/drawings`}>
            Open drawing set
            <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
      <div className="es08-configure">
        <section className="es08-card es08-form" aria-labelledby="es08-sec-title">
          <div className="es08-stepper" aria-label="Section">
            <button type="button" aria-label="Previous section" disabled={index === 0} onClick={prev}>
              <Icon name="chevron-left" />
            </button>
            <span>
              <span className="es08-eyebrow">Section {index + 1} of {sections.length}</span>
              <span className="es08-section-title">{sec.title}</span>
            </span>
            <button type="button" aria-label="Next section" disabled={index === sections.length - 1} onClick={next}>
              <Icon name="chevron-right" />
            </button>
          </div>
          <div className="es08-progress" aria-hidden="true">
            {sections.map((s, i) => (
              <span key={s.id} data-on={i <= index || undefined} />
            ))}
          </div>
          <div className="es08-form-head">
            <div>
              <span className="es08-eyebrow">{index + 1} of {sections.length} · Configuration</span>
              <h3 id="es08-sec-title">{sec.title}</h3>
              <p>{sec.intro}</p>
              <span className={`es08-section-status es08-tone-${sectionReadiness(bench, sec).tone}`}><Icon name={sectionReadiness(bench, sec).tone === "ok" ? "check" : sectionReadiness(bench, sec).tone === "neutral" ? "info" : "warning"} />{sectionReadiness(bench, sec).text}</span>
            </div>
            <Pill tone="neutral">Source cells shown</Pill>
          </div>
          <div className="es08-form-body">
            <div className="es08-fields">
              {specs.map((spec) => (
                <FieldRow key={spec.key} spec={spec} />
              ))}
            </div>
            {sec.id === "cloth" && <ExtraScreens bench={bench} />}
            {sec.id === "structure" && (
              <dl aria-label="Derived geometry" className="es08-readout">
                <div>
                  <dt>Overall, width × length</dt>
                  <dd>
                    {g ? `${fmt(g.width, 1)} × ${fmt(g.length, 1)}` : "—"} <span>m</span>
                  </dd>
                </div>
                <div>
                  <dt>Floor area</dt>
                  <dd>
                    {g ? fmt(g.area, 0) : "—"} <span>m²</span>
                  </dd>
                </div>
                <div>
                  <dt>Calculation width</dt>
                  <dd>
                    {g ? fmt(g.calcWidth, 1) : "—"} <span>m</span>
                  </dd>
                </div>
                <div>
                  <dt>
                    {rule.top} · {drawing.profile}
                  </dt>
                  <dd>
                    {geo ? fmt(geo.top, 2) : "—"} <span>m</span>
                  </dd>
                </div>
              </dl>
            )}
          </div>
          <div className="es08-form-foot">
            <button type="button" className="ppo-button" disabled={index === 0} onClick={prev}>
              Previous
            </button>
            <span role="status" className={`es08-calc-status es08-tone-${calcStatus.tone}`}>
              {calcStatus.text}
            </span>
            <button type="button" className="ppo-button ppo-button--primary" disabled={index === sections.length - 1} onClick={next}>
              Next section
            </button>
          </div>
        </section>
        <aside className="es08-live" aria-label="Live results">
          <section className="es08-card" aria-labelledby="es08-live-h">
            <div className="es08-card-head">
              <h3 id="es08-live-h">{live === "plan" ? "Live plan" : `Live section · ${drawing.profile}`}</h3>
              <Segmented
                label="Live drawing"
                size="sm"
                options={[
                  { value: "plan", label: "Plan" },
                  { value: "section", label: "Section" },
                ]}
                value={live}
                onChange={(x) => setLive(x as "plan" | "section")}
              />
            </div>
            <div className="es08-live-body" data-stale={!bench.fresh || undefined}>
              <div className="es08-live-frame">
                {live === "section" ? (
                  g ? (
                    <SectionDrawing geometry={g} drawing={drawing} variant="mini" spansShown={2} id="live-section" />
                  ) : (
                    <LivePlan g={null} drawing={drawing} />
                  )
                ) : (
                  <LivePlan g={g} drawing={drawing} />
                )}
              </div>
              {live === "section" ? (
                <ul className="es08-legend" aria-label="Section legend">
                  <li>
                    <span className="es08-key es08-key--screen" />
                    Screen at height to screen
                  </li>
                  <li>
                    <span className="es08-key es08-key--drive" />
                    Drive line, end-on
                  </li>
                  <li>
                    <span className="es08-key es08-key--roof" />
                    Roof, true proportion
                  </li>
                </ul>
              ) : (
                <ul className="es08-legend" aria-label="Plan legend">
                  <li>
                    <span className="es08-key es08-key--field" />
                    Screen cut
                  </li>
                  <li>
                    <span className="es08-key es08-key--group" />
                    Motor group boundary
                  </li>
                  <li>
                    <span className="es08-key es08-key--driveline" />
                    Drive line
                  </li>
                  <li>
                    <span className="es08-key es08-key--motor" />
                    Motor
                  </li>
                  <li>
                    <span className="es08-key es08-key--ridge" />
                    {ridgeName(drawing.profile)}
                  </li>
                </ul>
              )}
            </div>
            <div className="es08-card-foot">
              <span className="es08-sub es08-nums">
                {live === "plan"
                  ? g
                    ? `${g.spans} spans · ${g.bays} bays · ${g.screenGroups} motor group${g.screenGroups === 1 ? "" : "s"} · ${g.drives} drive positions`
                    : "Plan withheld"
                  : g
                    ? `${Math.min(2, g.spans)} of ${g.spans} spans · true proportion · ${rule.top.toLowerCase()} ${geo ? `${fmt(geo.top, 2)} m` : "—"}`
                    : "Section withheld"}
              </span>
              <Link href={`/estimating/configurations/${bench.id}/drawings`}>Full drawing set</Link>
            </div>
          </section>
          <section className="es08-card" aria-labelledby="es08-work-h">
            <div className="es08-card-head">
              <h3 id="es08-work-h">Calculation working</h3>
              <span className="es08-sub">Select a result</span>
            </div>
            <ul className="es08-results">
              {results.map((r) => {
                const open = r.id === result;
                return (
                  <li key={r.id}>
                    <button type="button" aria-expanded={open} onClick={() => setResult(open ? "" : r.id)}>
                      <span>{r.label}</span>
                      <span className="es08-result-value">
                        {r.value} <span>{r.unit}</span>
                      </span>
                    </button>
                    {open && (
                      <div className="es08-result-detail">
                        {r.lines.map((line, i) => (
                          <code key={i}>{line}</code>
                        ))}
                        <span className="es08-sub">{r.basis}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
          {(untested.length > 0 || v.replaceLS === "No") && <section className="es08-card es08-attention-card" aria-label="Needs attention">
            <div className="es08-card-head"><Icon name="warning" /><h3>Needs attention</h3><Pill tone="warn">{untested.length + (v.replaceLS === "No" ? 1 : 0)} items</Pill></div>
            {untested.length > 0 && <div className="es08-attention-item"><h4>{untested.length} selected option{untested.length === 1 ? " has" : "s have"} no historical example</h4><p>No historical quote exercises {untested.map(u => u.value).join(" or ")}. Results are unvalidated; they are shown, not blocked.</p><Link href={`/estimating/configurations/${bench.id}/definition`}>Historical coverage in Definition review</Link></div>}
            {v.replaceLS === "No" && <div className="es08-attention-item"><h4>LS wire still generated</h4><p>Replace LS wire is No, but the recovered formula still produces LS rolls (REV-17). Exclude CE-LINE-240 explicitly if the retained wire covers this scope.</p><Link href={`/estimating/configurations/${bench.id}/parts`}>Review line in Parts &amp; working</Link></div>}
          </section>}
        </aside>
      </div>
    </div>
  );
}
function FieldRow({ spec }: { spec: Spec }) {
  const labelId = `${spec.id}-label`,
    metaId = `${spec.id}-meta`,
    badgeTone: Tone = spec.badge === "Drawing only" ? "info" : "neutral";
  return (
    <div className={`es08-field ${spec.wide ? "es08-field--wide" : ""}`} data-disabled={spec.disabled || undefined}>
      <div className="es08-field-label">
        {spec.options ? (
          <span id={labelId}>{spec.label}</span>
        ) : (
          <label htmlFor={spec.id}>{spec.label}</label>
        )}
        {spec.badge && <Pill tone={badgeTone}>{spec.badge}</Pill>}
      </div>
      {spec.options ? (
        <Segmented labelledBy={labelId} options={spec.options} value={spec.value} onChange={spec.onChange} disabled={spec.disabled} fill />
      ) : (
        <div className="es08-input">
          <input
            id={spec.id}
            type="text"
            inputMode={spec.text ? "text" : "decimal"}
            value={spec.value}
            disabled={spec.disabled}
            aria-invalid={spec.error ? true : undefined}
            aria-describedby={metaId}
            placeholder={spec.disabled ? "Not used" : spec.placeholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => spec.onChange(e.target.value)}
          />
          {spec.unit && <span aria-hidden="true">{spec.unit}</span>}
        </div>
      )}
      <div id={metaId} className="es08-field-meta">
        <span className="es08-mono es08-sub">{spec.src}</span>
        {spec.error && <span className="es08-field-error">{spec.error}</span>}
        {!spec.error && spec.warn && <span className="es08-field-warn">{spec.warn}</span>}
        {!spec.error && !spec.warn && spec.note && <span className="es08-sub">{spec.note}</span>}
        {spec.flag && <Pill tone="untested">{spec.flag}</Pill>}
      </div>
    </div>
  );
}
function ExtraScreens({ bench }: { bench: Bench }) {
  const { proposal: p, change, frozen } = bench,
    cells = [
      ["count", "screens"],
      ["length", "base length, m"],
      ["overhang", "overhang each end, m"],
      ["width", "cloth width, m"],
      ["material", "material"],
    ] as const;
  return (
    <fieldset className="es08-slots">
      <legend>Additional screens · slots 1–5</legend>
      <p className="es08-sub">
        A count of 0 leaves the slot unused. Active slots need a positive base length and cloth width. Sources C80:G84. These cuts round before adding overhang.
      </p>
      <div className="es08-slot-grid es08-slot-head" aria-hidden="true">
        <span>Slot</span>
        <span>Screens</span>
        <span>Base length · m</span>
        <span>Overhang · m</span>
        <span>Cloth width · m</span>
        <span>Material</span>
        <span>Status</span>
      </div>
      {p.extra_screens.map((slot, i) => {
        const active = Number(slot.count) > 0,
          incomplete = active && !(Number(slot.length) > 0 && Number(slot.width) > 0),
          status = !active ? "Unused · values retained" : incomplete ? "Needs length and width" : i >= 2 ? "Omitted from motor area (REV-09)" : "Active",
          st: Tone = !active ? "neutral" : incomplete ? "danger" : i >= 2 ? "warn" : "ok";
        return (
          <div key={slot.id} className="es08-slot-grid">
            <span className="es08-mono">Slot {i + 1}</span>
            {cells.map(([key, aria]) => (
              <input
                key={key}
                id={`es08-extra.${i}.${key}`}
                type="text"
                inputMode={key === "material" ? "text" : "decimal"}
                aria-label={`Additional screen slot ${i + 1} ${aria}`}
                value={slot[key]}
                disabled={frozen}
                autoComplete="off"
                onChange={(e) =>
                  change((next) => {
                    next.extra_screens[i][key] = e.target.value;
                  })
                }
              />
            ))}
            <span className={`es08-section-status es08-tone-${st === "danger" ? "block" : st}`}>{status}</span>
          </div>
        );
      })}
    </fieldset>
  );
}
type Row = { id: string; label: string; value: string; unit: string; lines: string[]; basis: string };
function resultRows(c: Bench["calculation"], g: Bench["geometry"], v: Record<string, string>): Row[] {
  const dash = (id: string, label: string): Row => ({ id, label, value: "—", unit: "", lines: ["Withheld until every input is valid."], basis: "" });
  if (!c || c.state !== "Current" || !g)
    return [
      dash("count", "Standard screens"),
      dash("cut", "Cut length"),
      dash("clothWidth", "Cloth width"),
      dash("cloth", "Standard cloth"),
      dash("spacing", "Actual drive spacing"),
      dash("drives", "Drive positions"),
      dash("motorArea", "Legacy area per motor"),
      dash("torque", "Torque band"),
    ];
  const fact = (key: string) => c.facts.find((x) => x.key === key) as Fact | undefined,
    row = (key: string, label: string, dp: number, lines: string[], basis: string): Row => {
      const x = fact(key);
      return { id: key, label, value: x ? fmt(Number(x.value.display), dp) : "—", unit: x?.unit ?? "", lines, basis };
    };
  return [
    row("count", "Standard screens", 0, [g.individual ? `${g.bays} bays × ${g.spans + g.wallSpans} calculation spans` : `${g.bays} bays × ${g.screenGroups} motor groups across`, `= ${g.count} cuts`], "Recovered rule · report r02 §4.1 · C77"),
    row(
      "cut",
      "Cut length",
      1,
      [
        `coverage = ${fmt(g.calcWidth, 1)} m ÷ ${g.screenGroups} = ${fmt(g.groupWidth, 2)} m`,
        `ceil 0.1 ( ${fmt(g.groupWidth, 2)} ÷ (1 − ${fmt(g.shrink, 3)}) + 2 × ${fmt(g.overhang, 2)} )`,
        `= ${fmt(g.cut, 1)} m`,
      ],
      "Drawn term by term on sheet 05 · Screen cut · G70",
    ),
    row("clothWidth", "Cloth width", 1, [`exact lookup: bay ${fmt(g.bayLength, 2)} m → ${g.clothWidth} m`, "no interpolation between rows"], "Cloth-width lookup · report r02 §4.1 · C70"),
    row("cloth", "Standard cloth", 0, [`${g.count} × ${fmt(g.cut, 1)} m × ${g.clothWidth} m`, `= ${fmt(g.cloth, 1)} m²`], "CALC_ENGINE!C223 → CE-LINE-223"),
    row(
      "spacing",
      "Actual drive spacing",
      2,
      [
        `driven width = ${fmt(g.groupWidth, 2)} − ${fmt(g.drive0 * 2, 2)} = ${fmt(g.available, 2)} m`,
        `spaces = round(${fmt(g.available, 2)} ÷ ${fmt(Number(v.spacing), 2)}) = ${g.spaces}`,
        `spacing = ${fmt(g.available, 2)} ÷ ${g.spaces} = ${fmt(g.spacing, 2)} m`,
      ],
      `${fmt(g.drive0 * 2, 2)} m is the drive_span_deduction_m parameter · C97/C98`,
    ),
    row("drives", "Drive positions", 0, [`(${g.spaces} + 1) × ${g.groupsAcross} across × ${g.groupsAlong} along = ${g.drives}`], "One additional position per group · G99"),
    row("motorArea", "Legacy area per motor", 0, [`${fmt(g.cloth, 0)} m² ÷ ${g.groupsAcross * g.groupsAlong} motors`, "legacy expression: main cloth + slots 1–2 only"], "Report r02 §4.3 · REV-09 · G89"),
    {
      id: "torque",
      label: "Torque band",
      value: g.torque ? `${g.torque} Nm` : "Unavailable",
      unit: "",
      lines: [`${v.drive}, ${fmt(g.motorArea ?? 0, 0)} m² per motor → ${g.torque ? `${g.torque} Nm` : "unavailable"}`],
      basis: "Recovered comparison band. Not an approved motor or safe load · G90",
    },
  ];
}
export function configureSectionTitle(id: SectionId): ReactNode {
  return sections.find((s) => s.id === id)?.title ?? id;
}
