"use client";
import Link from "next/link";
import { useState } from "react";
import { definition, type View } from "../estimating/specialist/definition";
import { fieldEnabled, sections, type SectionId } from "../estimating/specialist/workbench";
import type { Bench } from "./specialist-types";
import { FontAwesomeGlyph } from "./font-awesome";
import { Icon } from "./specialist-ui";

// View contents share the editor's state. These controls never create a second
// proposal or bypass the server's current-authority and receipt checks.
export function sectionReadiness(bench: Bench, section: (typeof sections)[number]) {
  const values = Object.fromEntries(definition.fields.map(f => [f.key, bench.proposal.inputs[f.key].raw]));
  const keys = definition.fields.filter(f => f.group === section.group).map(f => f.key);
  const invalid = keys.filter(k => bench.errors[k] && fieldEnabled(k, values)).length;
  const drawingKeys = section.id === "structure" ? ["pitch", "gutter", "roof_width", "vent", "height"] : section.id === "cloth" ? ["roll_width"] : [];
  const drawingErrors = drawingKeys.filter(k => bench.drawingErrors[k as keyof typeof bench.drawingErrors]).length;
  const untested = bench.untested.filter(u => keys.includes(u.key)).length;
  if (invalid) return { icon: "warning" as const, tone: "block", count: invalid, text: `${invalid} to resolve` };
  if (drawingErrors || untested) return { icon: "warning" as const, tone: "warn", count: drawingErrors || untested, text: drawingErrors ? `${drawingErrors} drawing input${drawingErrors === 1 ? "" : "s"} to resolve` : `${untested} untested option${untested === 1 ? "" : "s"}` };
  if (section.id === "bed" && values.replaceLS === "No") return { icon: "warning" as const, tone: "warn", count: 1, text: "1 source warning" };
  if (section.id === "cloth" && !bench.drawing.roll_width.trim()) return { icon: "info" as const, tone: "neutral", count: 0, text: "Roll width not entered" };
  if (section.id === "drive") return { icon: "info" as const, tone: "neutral", count: 0, text: "Torque band only" };
  if (section.id === "commercial") return values.installation === "Yes" ? { icon: "warning" as const, tone: "warn", count: 1, text: "Installation unavailable" } : { icon: "info" as const, tone: "neutral", count: 0, text: "Illustrative rates" };
  return { icon: "check" as const, tone: "ok", count: 0, text: "Complete" };
}

export function WorkbenchMenu({ bench, view, section, setSection }: { bench: Bench; view: View; section: SectionId; setSection: (id: SectionId) => void }) {
  const [anchor, setAnchor] = useState("");
  const positions = bench.calculation?.positions ?? [];
  const active = positions.filter(l => !l.excluded && (l.effective_quantity === null || l.effective_quantity.numerator !== "0")).length;
  const headings: Record<View, string> = { configure: "Sections", drawings: "Drawing set", parts: "Positions", pricing: "Commercial review", compare: "Compare & save", definition: "Findings", history: "Run history" };
  const links: Partial<Record<View, [string, string, string][]>> = {
    drawings: [["es08-sheet-01", "01  Plan", "file"], ["es08-sheet-02", "02  Cross section", "file"], ["es08-sheet-03", "03  Longitudinal section", "file"], ["es08-sheet-04", "04  Bay section", "file"], ["es08-sheet-05", "05  Screen cut", "file"], ["es08-schedule", "Cut schedule", "table-list"], ["es08-xc-h", "Coverage cross-check", "scale-balanced"]],
    pricing: [["es08-lines-h", "Active lines", "table-list"], ["es08-bridge-h", "Price bridge", "scale-balanced"], ["es08-policy-h", "Rounding", "calculator"], ["es08-native-h", "Receiving proposal", "file-invoice-dollar"]],
    compare: [["es08-metrics-h", "Headline comparison", "scale-balanced"], ["es08-changes-h", "Line changes", "arrow-right-arrow-left"], ["es08-save-h", "Record run", "floppy-disk"], ["es08-send-h", "Send to estimate", "paper-plane"]],
    definition: [["es08-catalogue-h", "Provisional catalogue", "tags"], ["es08-params-h", "Parameter proposal", "sliders"], ["es08-manifest-h", "Source manifest", "file"], ["es08-source-h", "Saved source", "file"]],
    history: [["es08-runs-h", "Saved runs", "clock-rotate-left"], ["es08-adopt-h", "Estimate adoptions", "file-invoice-dollar"]],
  };
  const glyph = (name: string) => <FontAwesomeGlyph icon={name} className="es08-icon" fallback={<Icon name="drawing" />} />;
  return <div className="es08-contents">
    <h2>{headings[view]}</h2>
    {view === "configure" && <nav aria-label="Configuration sections">{sections.map(s => {
      const state = sectionReadiness(bench, s);
      return <button type="button" key={s.id} aria-current={section === s.id ? "step" : undefined} title={state.text} onClick={() => setSection(s.id)}>
        <span className={`es08-tone-${state.tone}`}><Icon name={state.icon} /></span><span>{s.group + 1}  {s.title}</span>{state.count > 0 && <small>{state.count}</small>}
      </button>;
    })}</nav>}
    {view === "parts" && <nav aria-label="Position state">{([
      ["active", "Active & unresolved", active, "list-check"], ["manual", "Manual", positions.filter(l => l.manual).length, "pen"], ["zero", "Zero & excluded", positions.length - active, "ban"], ["all", "All", positions.length, "copy"],
    ] as const).map(([key, label, count, icon]) => <button type="button" key={key} aria-pressed={bench.partsFilter === key} aria-label={`${label} · ${count}`} onClick={() => bench.setPartsFilter(key)}>{glyph(icon)}<span>{label}</span><small>{count}</small></button>)}</nav>}
    {view === "definition" && <nav aria-label="Finding kinds">{["All", "REV", "AUD", "WAS"].map(kind => <button key={kind} type="button" aria-pressed={bench.findingFilter === kind} onClick={() => bench.setFindingFilter(kind)}>{glyph(kind === "All" ? "triangle-exclamation" : "file")}<span>{kind === "All" ? "All findings" : `${kind} · ${kind === "REV" ? "review" : kind === "AUD" ? "audit" : "discrepancies"}`}</span><small>{[...definition.issues, ...definition.catalogue.quality].filter(f => kind === "All" || f.id.startsWith(kind)).length}</small></button>)}</nav>}
    {links[view] && <nav aria-label={`${headings[view]} contents`}>{links[view]!.map(([id, label, icon], i) => <a key={id} href={`#${id}`} aria-current={(anchor || links[view]![0][0]) === id ? "location" : undefined} onClick={() => setAnchor(id)}>{glyph(icon)}<span>{label}</span>{view === "pricing" && i === 0 && <small>{active}</small>}</a>)}</nav>}
    <p className="es08-contents-note">{view === "configure" ? <>{definition.quantity_version}<br />Screen Systems only. Irrigation, climate and lighting need their own definitions.</> : view === "parts" ? "Part identity comes from a reviewed rule table, never a runtime description lookup." : view === "history" ? "A run is a design record; it is never rewritten." : view === "drawings" ? "Estimating study · not for fabrication. Sheets are A3 landscape." : view === "pricing" ? "Rates from SYN-PRICE-02 · illustrative. GST is not calculated in this review." : "Saved originals retain their exact evidence. Review is separate from engineering acceptance."}</p>
    <h2>Related</h2>
    <nav aria-label="Related estimating pages"><Link href="/estimating/configurations">{glyph("list")}<span>Specialist configurations</span></Link><Link href="/estimating/discovery">{glyph("wand-magic-sparkles")}<span>Discovery workspaces</span></Link></nav>
  </div>;
}
