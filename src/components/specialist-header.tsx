"use client";
import { useState } from "react";
import Link from "next/link";
import { definition, viewLabels, views } from "../estimating/specialist/definition";
import { activeLines } from "../estimating/specialist/workbench";
import { usePublishRecordIdentity } from "../shell/record-identity";
import type { Bench } from "./specialist-types";
import { Icon, Pill, fmt, readable, runLabel, type Tone } from "./specialist-ui";

// The shared module header of the design board (artboard F): breadcrumb,
// heading, draft status and Method & limitations; the five-cell context band;
// the seven views; and the six-gate readiness strip visible on every view
// (departure D8). The shell owns the information icon (D11), so there is no
// module Help button.
export function WorkbenchHeader({ bench, view, onMethod, onActions }: { bench: Bench; view: string; onMethod: () => void; onActions: () => void }) {
  const { data, calculation: c, geometry: g, drawing, signature, gates, dirty, canEdit, command } = bench,
    [readinessOpen, setReadinessOpen] = useState(false),
    cfg = data.configuration,
    run = data.current_run,
    parameters = definition.catalogue.parameters.filter((p) => bench.proposal.parameters[p.id]?.raw !== p.default).length,
    pending = bench.preview?.comparison.filter((r) => r.required && !r.decision).length ?? 0,
    active = activeLines(c).length,
    binding = data.draft.binding,
    site = data.source.source?.site?.display_name ?? "Saved scope";
  usePublishRecordIdentity(cfg.display_number, cfg.name);
  const status = !canEdit
    ? { tone: "info" as Tone, text: `Read-only · ${data.edit_blocker ?? "editing unavailable"}` }
    : command.pending
      ? { tone: "warn" as Tone, text: command.status }
      : command.busy
        ? { tone: "neutral" as Tone, text: command.status }
        : dirty
          ? { tone: "warn" as Tone, text: "Unsaved changes in this browser" }
          : { tone: "ok" as Tone, text: `Draft v${cfg.version} · saved ${readable(data.draft.created_at)}` };
  const badges: Record<string, string | null> = {
    drawings: "5",
    parts: c ? `${active}` : null,
    compare: pending ? `${pending}` : null,
    definition: `${definition.issues.length}`,
  };
  return (
    <header className="es08-header">
      <div className="es08-header-top">
        <Link className="es08-phone-back" href="/estimating/configurations" aria-label="Back to specialist configurations"><Icon name="chevron-left" /></Link>
        <div className="es08-header-title">
          <div className="es08-title-line"><h1>{cfg.name}</h1><Pill>Draft v{cfg.version}</Pill></div>
          <p className="es08-record-line"><span className="es08-record-reference">{cfg.display_number} · </span>Screen Configurator Workbench<span className="es08-desktop-status"> · <span role="status">{status.text}</span> · synthetic</span><span className="es08-phone-version"> · Draft v{cfg.version}</span></p>
        </div>
        <div className="es08-header-actions">
          <button type="button" className="ppo-button" onClick={onMethod}>Method &amp; limitations</button>
          <button type="button" className="ppo-button es08-more" aria-label="More workbench actions" onClick={onActions}>…</button>
        </div>
      </div>
      <dl className="es08-context" aria-label="Estimate context">
        <div>
          <dt>Estimate</dt>
          <dd className="es08-mono">{data.estimate ? `Estimate v${data.estimate.version}` : "No estimate yet"}</dd>
          <dd className="es08-sub">
            Option {data.source.option_label} · Discovery r{data.source.revision} ({data.source.scope_readiness})
          </dd>
        </div>
        <div>
          <dt>Facility</dt>
          <dd>{site}</dd>
          <dd className="es08-sub">
            {binding.kind === "StructuredSystem"
              ? `System scope · ${binding.area_ids.length} area${binding.area_ids.length === 1 ? "" : "s"}`
              : `Facility scope · ${binding.facility_ids.length} ${binding.facility_ids.length === 1 ? "facility" : "facilities"}`}
            {" · synthetic replacement study"}
          </dd>
        </div>
        <div>
          <dt>Structure</dt>
          <dd>{g ? `${drawing.profile} · ${g.spans} spans × ${g.bays} bays` : `${drawing.profile} · geometry incomplete`}</dd>
          <dd className="es08-sub es08-nums">
            {g ? `${fmt(g.width, 1)} × ${fmt(g.length, 1)} m · ` : ""}CFG {signature}
          </dd>
        </div>
        <div>
          <dt>Definition</dt>
          <dd className="es08-mono">{definition.quantity_version}</dd>
          <dd className="es08-sub">
            {parameters ? `${parameters} parameter${parameters === 1 ? "" : "s"} changed` : "Parameters at default"} · SYN-PRICE-02
          </dd>
        </div>
        <div>
          <dt>Review state</dt>
          <dd>
            <span className="es08-tone-warn">Engineering acceptance open</span>
          </dd>
          <dd className="es08-sub">
            {run ? `Run ${runLabel(run.sequence)} saved ${readable(run.created_at)}` : "No saved run · no approval recorded"}
          </dd>
        </div>
      </dl>
      <button className="es08-readiness-summary" type="button" aria-expanded={readinessOpen} onClick={() => setReadinessOpen(!readinessOpen)}>
        <Pill tone={dirty ? "warn" : "neutral"}>Draft v{cfg.version}</Pill><Icon name="warning" /><span>Readiness · {gates.filter(g => g.status === "ok").length} ok · {gates.filter(g => g.status === "neutral").length} not checked · {gates.filter(g => g.status === "warn" || g.status === "block").length} attention</span><Icon name="chevron-down" />
      </button>
      <dl className="es08-gates" aria-label="Readiness checks" data-expanded={readinessOpen || undefined}>
        <div className="es08-readiness-label">Readiness</div>
        {gates.map(gate => <div key={gate.id} tabIndex={0} title={gate.detail} className={`es08-gate es08-gate--${gate.status}`}>
          <dt><Icon name={gate.status === "ok" ? "check" : gate.status === "neutral" ? "info" : "warning"} />{gate.label}</dt>
          <dd className="es08-gate-value">{["grid", "cloth"].includes(gate.id) && gate.status === "ok" ? <span className="es08-sr"> · {gate.value}</span> : ` · ${gate.value}`}</dd>
          <dd className="es08-gate-detail">{gate.detail}</dd>
        </div>)}
      </dl>
      <nav aria-label="Workbench views" className="es08-views">
        {views.map((v, i) => (
          <Link key={v} href={`/estimating/configurations/${bench.id}/${v}`} aria-current={view === v ? "page" : undefined} aria-label={`${viewLabels[i]}${badges[v] ? ` ${badges[v]}${v === "drawings" ? " sheets" : v === "parts" ? " active" : v === "definition" ? " findings" : ""}` : ""}`}>
            {bench.phone ? ({ parts: "Parts", compare: "Compare", definition: "Definition", history: "History" } as Record<string, string>)[v] ?? viewLabels[i] : viewLabels[i]}
            {badges[v] && <span className={`es08-count ${v === "definition" || v === "compare" ? "es08-count--warn" : ""}`}>{badges[v]}</span>}
          </Link>
        ))}
      </nav>

    </header>
  );
}
