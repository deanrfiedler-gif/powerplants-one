"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { definition } from "../estimating/specialist/definition";
import type { Position } from "../estimating/specialist/types";
import { clothWorking, formulaCells, manualReview } from "../estimating/specialist/workbench";
import { FontAwesomeGlyph } from "./font-awesome";
import { ResolvedAdjustment } from "./specialist-records";
import type { Bench } from "./specialist-types";
import { Dialog, Icon, Notice, Pill, fmt, runLabel, type Tone } from "./specialist-ui";

// Parts & working (design board artboard 03): a work queue of every source
// position with its PPO part outcome, rule, calculation unit and review basis,
// with a modal working panel. Part identity comes from the reviewed rule
// table, never a runtime description lookup.
type Filter = "active" | "manual" | "zero" | "all";
const stateTone: Record<Position["part_state"], Tone> = {
  Mapped: "neutral",
  "No part selected": "neutral",
  "Not in catalogue": "neutral",
  Unresolved: "warn",
  Conflict: "danger",
};
const statusTone: Record<Position["status"], Tone> = { Calculated: "neutral", Manual: "warn", Unresolved: "danger", Excluded: "neutral", Zero: "neutral" };
const isActive = (l: Position) => !l.excluded && (l.effective_quantity === null || l.effective_quantity.numerator !== "0");
export function PartsView({ bench }: { bench: Bench }) {
  const { calculation: c, frozen, fresh, working, openWorking } = bench,
    [search, setSearch] = useState(""),
    filter = bench.partsFilter,
    setFilter = bench.setPartsFilter,
    [section, setSection] = useState("All"),
    positions = c?.positions ?? [],
    manual = manualReview(c),
    counts = {
      active: positions.filter(isActive).length,
      manual: positions.filter((l) => l.manual).length,
      zero: positions.filter((l) => !isActive(l)).length,
      all: positions.length,
    },
    filters: { value: Filter; label: string }[] = [
      { value: "active", label: `Active & unresolved · ${counts.active}` },
      { value: "manual", label: `Manual · ${counts.manual}` },
      { value: "zero", label: `Zero & excluded · ${counts.zero}` },
      { value: "all", label: `All · ${counts.all}` },
    ],
    shown = positions.filter(
      (l) =>
        (filter === "all" || (filter === "active" && isActive(l)) || (filter === "manual" && l.manual) || (filter === "zero" && !isActive(l))) &&
        (section === "All" || l.section === section) &&
        `${l.key} ${l.description} ${l.source} ${l.part_id ?? ""} ${l.label} ${l.rule}`.toLowerCase().includes(search.trim().toLowerCase()),
    ),
    selected = positions.find((l) => l.key === working) ?? null,
    openerKey = useRef<string | null>(null);
  const diagnostics = (key: string) => (c?.diagnostics ?? []).filter((d) => d.key === key && d.severity !== "Error" && d.code !== "SpecialistManualReviewRequired");
  const close = () => {
    const key = openerKey.current;
    openWorking(null);
    requestAnimationFrame(() => document.getElementById(`es08-working-${key}`)?.focus());
  };
  return (
    <div className="es08-view es08-parts-view">
      <div className="es08-view-head">
        <div>
          <h2>Parts &amp; working</h2>
          <p>Every source position with its PPO part outcome, rule, calculation unit and review basis. Part identity comes from a reviewed rule table, never a runtime description lookup.</p>
        </div>
        <div className="es08-view-actions">
          <GateDecisions bench={bench} />
          <button type="button" className="ppo-button ppo-button--primary" disabled={frozen || !fresh || !c} onClick={bench.openManual}>
            Review {manual.total} manual quantities
          </button>
        </div>
      </div>
      <div className="es08-toolbar">
        <div className="es08-toolbar-left">
          <label className="es08-sr" htmlFor="es08-part-search">
            Search PPO part, description, rule ID or source cell
          </label>
          <div className="es08-search">
            <Icon name="search" />
            <input id="es08-part-search" type="search" placeholder="Search PPO part, description, rule ID or cell" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div role="group" aria-label="Position state" className="es08-mobile-filter"><select aria-label="Position state" value={filter} onChange={e => setFilter(e.target.value as Filter)}>{filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
          <label className="es08-select">
            <span className="es08-sr">Section</span>
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              {["All", ...new Set(positions.map((l) => l.section))].map((x) => (
                <option key={x} value={x}>
                  {x === "All" ? "All sections" : x}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="es08-sub">{shown.length} of {positions.length} positions</span>
      </div>
      {manual.outstanding > 0 && c && (
        <Notice tone="warn" title={bench.data.current_run ? `Basis changed since run ${runLabel(bench.data.current_run.sequence)}.` : "Manual quantities need a review basis."} action={<Link href={`/estimating/configurations/${bench.id}/compare`}>See what changed</Link>}>
          The {manual.outstanding} manual quantit{manual.outstanding === 1 ? "y keeps its value but needs" : "ies keep their values but need"} a fresh review basis before the next run can be saved.
        </Notice>
      )}
      {!fresh && c && <p className="es08-sub es08-stale-note" role="status">Showing the last calculation while the inputs are re-checked.</p>}
      <div className="es08-partsgrid">
        <section className="es08-card es08-table-card" aria-labelledby="es08-parts-h">
          <h3 id="es08-parts-h" className="es08-sr">Source positions</h3>
          {!c && <p className="es08-empty">Waiting for the first calculation.</p>}
          {c && shown.length === 0 && (
            <div className="es08-empty">
              <strong>No positions match {search.trim() ? `“${search.trim()}”` : "this filter"}</strong>
              <p className="es08-sub">
                Search covers PPO part, description, rule ID and source cell within {filters.find((f) => f.value === filter)?.label.split(" · ")[0]}.
              </p>
              <button
                type="button"
                className="ppo-button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                  setSection("All");
                }}
              >
                Clear search and filter
              </button>
            </div>
          )}
          {c && shown.length > 0 && (
            <div className="es08-table-scroll" tabIndex={0} aria-label="Source positions">
              <table className="es08-table es08-table--parts">
                <thead>
                  <tr>
                    <th scope="col">PPO part</th>
                    <th scope="col">Description</th>
                    <th scope="col">Source position</th>
                    <th scope="col" className="es08-num">Review qty</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Basis</th>
                    <th scope="col">
                      <span className="es08-sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((l) => {
                    const notes = diagnostics(l.key);
                    return (
                      <tr key={l.key} data-selected={l.key === working || undefined}>
                        <td>
                          {l.part_id ? <div className="es08-mono es08-strong">{l.part_id}</div> : <Pill tone={stateTone[l.part_state]}>{l.part_state}</Pill>}
                        </td>
                        <td title={l.description || l.label}>{l.part_id ? l.description : l.label}</td>
                        <td title={notes.map(d => `${d.message} · ${d.code}`).join("; ")}><span className="es08-sub">{l.key} · {l.section}</span></td>
                        <td className="es08-num">
                          <span className="es08-qty">{l.effective_quantity ? fmt(Number(l.effective_quantity.display), l.effective_quantity.display.includes(".") ? 2 : 0) : "—"}</span>
                        </td>
                        <td>{l.effective_quantity ? l.unit : "unresolved"}</td>
                        <td>
                          <Pill tone={statusTone[l.status]}>{l.status === "Manual" && c.manual_review_required.includes(l.key) ? "Manual · needs review" : l.status}</Pill>
                          <div className="es08-sub">{l.excluded ? "Estimator exclusion" : l.manual ? "No surviving formula · REV-01" : l.row === 223 ? (bench.gates[3].status === "ok" ? "Roll fit confirmed" : "Procurement unit unconfirmed") : "Calculation unit"}</div>
                        </td>
                        <td className="es08-actions-cell">
                          <button
                            type="button"
                            id={`es08-working-${l.key}`}
                            className="es08-icon-button"
                            aria-label={`Working for ${l.key}`}
                            title={`Working for ${l.key}`}
                            aria-expanded={l.key === working}
                            aria-controls={selected ? "es08-working-panel" : undefined}
                            onClick={() => {
                              openerKey.current = l.key;
                              openWorking(l.key === working ? null : l.key);
                            }}
                          >
                            <FontAwesomeGlyph icon="calculator" className="es08-icon" fallback={<Icon name="drawing" />} />
                          </button>
                          {l.manual && (
                            <button type="button" className="ppo-button es08-button--sm es08-button--warn" disabled={frozen || !fresh} onClick={bench.openManual}>
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {c && shown.length > 0 && (
            <div className="es08-card-foot">
              <span className="es08-sub">
                Showing {shown.length} of {positions.length} source positions · part outcomes: part number, no part selected, not in catalogue, unresolved dependency, source conflict
              </span>
            </div>
          )}
        </section>
      </div>
      {selected && (
        <Dialog id="es08-working-panel" title={selected.label || selected.description} description={<span className="es08-mono">{selected.key} · {selected.part_id ?? selected.part_state}</span>} close={close} wide className="es08-dialog--side es08-working-overlay">
          <WorkingPanel bench={bench} position={selected} close={close} inDialog />
        </Dialog>
      )}
    </div>
  );
}
function WorkingPanel({ bench, position: l, close, inDialog = false }: { bench: Bench; position: Position; close: () => void; inDialog?: boolean }) {
  const { proposal: p, change, frozen, geometry: g, calculation: c, data } = bench,
    [showFormula, setShowFormula] = useState(false),
    cloth = l.row === 223 && g ? clothWorking(g) : null,
    cells = formulaCells(l.formula),
    gate = definition.gates.includes(l.row),
    facts = (c?.facts ?? []).filter((f) => cells.some((cell) => f.source === cell) || (cloth === null && ["width", "length", "count", "cut", "clothWidth"].includes(f.key))),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!inDialog) heading.current?.focus();
  }, [l.key, inDialog]);
  return (
    <>
      {!inDialog && (
        <div className="es08-working-head">
          <div>
            <span className="es08-mono es08-sub">
              {l.key} · {l.part_state.toLowerCase()}
            </span>
            <h3 id="es08-work-title" ref={heading} tabIndex={-1}>
              {l.label}
            </h3>
          </div>
          <button type="button" className="es08-icon-button" aria-label="Close working" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
      )}
      <div className="es08-working-qty">
        <div>
          <span className="es08-sub">Review quantity</span>
          <span className="es08-big">
            {l.effective_quantity ? fmt(Number(l.effective_quantity.display), l.effective_quantity.display.includes(".") ? 2 : 0) : "Unresolved"} <span>{l.effective_quantity ? l.unit : ""}</span>
          </span>
          {l.quantity && l.excluded && <span className="es08-sub">Generated {l.quantity.display} {l.unit}, excluded by the estimator</span>}
        </div>
        {l.row === 223 && (
          <Link href={`/estimating/configurations/${bench.id}/drawings#es08-sheet-05`} className="es08-link-icon">
            <Icon name="drawing" />
            Show on drawing
          </Link>
        )}
      </div>
      {cloth ? (
        <ol className="es08-steps">
          {cloth.map((s, i) => (
            <li key={s.label}>
              <span className="es08-step-n" data-last={i === cloth.length - 1 || undefined} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <span className="es08-strong">{s.label}</span>
                <code>{s.code}</code>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="es08-working-rule">
          <span className="es08-eyebrow">Recovered rule</span>
          <p>{l.rule}</p>
          {l.manual && <p className="es08-field-warn">Manual quantity: the overwritten formula cannot be recovered from the source file (REV-01). Review it against the current basis.</p>}
        </div>
      )}
      {cells.length > 0 && (
        <div className="es08-working-inputs">
          <span className="es08-eyebrow">Inputs read</span>
          <div className="es08-chips">
            {cells.map((cell) => (
              <span key={cell} className="es08-chip es08-mono">
                {cell}
              </span>
            ))}
          </div>
        </div>
      )}
      {facts.length > 0 && (
        <dl className="es08-rows es08-rows--tight">
          {facts.slice(0, 6).map((f) => (
            <div key={f.key}>
              <dt>
                {f.label} <span className="es08-mono es08-sub">{f.source}</span>
              </dt>
              <dd>
                {f.value.display} {f.unit}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <dl className="es08-rows es08-rows--tight">
        <div>
          <dt>Calculation unit</dt>
          <dd>{l.unit}</dd>
        </div>
        <div>
          <dt>Procurement unit</dt>
          <dd className={l.row === 223 && bench.gates[3].status !== "ok" ? "es08-tone-warn" : undefined}>
            {l.row === 223 ? (bench.gates[3].status === "ok" ? "Roll fit confirmed" : bench.gates[3].status === "block" ? `Unconfirmed · ${bench.gates[3].value.toLowerCase()}` : "Unconfirmed · roll width not entered") : "Not inferred · receiving maps units"}
          </dd>
        </div>
        <div>
          <dt>Rounding</dt>
          <dd>{l.row === 223 ? "Cut length up to 0.1 m" : "As recovered"}</dd>
        </div>
        <div>
          <dt>Part identity</dt>
          <dd>
            {l.part_id ?? l.part_state} <span className="es08-sub">· {l.part_basis}</span>
          </dd>
        </div>
        {l.part_note && (
          <div>
            <dt>Part note</dt>
            <dd>{l.part_note}</dd>
          </div>
        )}
        {l.part_candidates.length > 0 && (
          <div>
            <dt>Candidates</dt>
            <dd className="es08-mono">{l.part_candidates.join(", ")}</dd>
          </div>
        )}
        <div>
          <dt>Definition</dt>
          <dd className="es08-mono">{definition.quantity_version}</dd>
        </div>
      </dl>
      <div className="es08-working-decisions">
        <label className="es08-check">
          <input
            type="checkbox"
            disabled={frozen}
            checked={l.excluded}
            onChange={(e) =>
              change((next) => {
                next.exclusions = [...next.exclusions.filter((x) => x.key !== l.key), { key: l.key, excluded: e.target.checked, reason: bench.reason }];
              })
            }
          />
          <span>Estimator exclusion (underlying quantity retained)</span>
        </label>
        {gate && (
          <label className="es08-check">
            <input
              type="checkbox"
              disabled={frozen}
              checked={p.gates[`B${l.row}`].include}
              onChange={(e) =>
                change((next) => {
                  next.gates[`B${l.row}`] = { include: e.target.checked, reason: bench.reason };
                })
              }
            />
            <span>Source inclusion gate B{l.row} · include this line</span>
          </label>
        )}
      </div>
      {data.current_resolved && <ResolvedAdjustment bench={bench} position={l} close={close} />}
      <div className="es08-working-foot">
        <span className="es08-sub">{l.formula ? "Original formula text is retained in Rules column H." : "No source formula survives for this position."}</span>
        {l.formula && (
          <button type="button" className="ppo-button es08-button--sm" aria-expanded={showFormula} onClick={() => setShowFormula(!showFormula)}>
            {showFormula ? "Hide source formula" : "Show source formula"}
          </button>
        )}
      </div>
      {showFormula && l.formula && <pre className="es08-formula">{l.formula}</pre>}
    </>
  );
}
// The six manual inclusion gates (REV-02) decided in one place.
function GateDecisions({ bench }: { bench: Bench }) {
  const [open, setOpen] = useState(false),
    { proposal: p, change, frozen } = bench;
  return (
    <>
      <button type="button" className="ppo-button" onClick={() => setOpen(true)}>
        Six line inclusion decisions
      </button>
      {open && (
        <Dialog title="Six line inclusion decisions" close={() => setOpen(false)}>
          <p className="es08-sub">Six source rows carry a manual inclusion gate (REV-02). Each is a replacement-job exclusion or intended family behaviour; confirm the intent for this option.</p>
          <ul className="es08-gatelist">
            {definition.gates.map((row) => {
              const line = definition.lines.find((l) => l.row === row);
              return (
                <li key={row}>
                  <label className="es08-check">
                    <input
                      type="checkbox"
                      disabled={frozen}
                      checked={p.gates[`B${row}`].include}
                      onChange={(e) =>
                        change((next) => {
                          next.gates[`B${row}`] = { include: e.target.checked, reason: bench.reason };
                        })
                      }
                    />
                    <span>
                      <span className="es08-strong">{line?.label ?? `Row ${row}`}</span>
                      <span className="es08-mono es08-sub">
                        {" "}
                        CE-LINE-{row} · gate B{row}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="es08-sub">{p.gates && Object.values(p.gates).some((gate) => gate.include) ? "Included gates generate their recovered quantities." : "All gates excluded: these rows stay at zero."}</p>
        </Dialog>
      )}
    </>
  );
}
