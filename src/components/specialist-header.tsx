"use client";
import Link from "next/link";
import { definition, viewLabels, views } from "../estimating/specialist/definition";
import { activeLines } from "../estimating/specialist/workbench";
import { usePublishRecordIdentity } from "../shell/record-identity";
import type { Bench } from "./specialist-types";
import { Dot, Pill, fmt, readable, runLabel, type Tone } from "./specialist-ui";

// The shared module header of the design board (artboard F): breadcrumb,
// heading, draft status and Method & limitations; the five-cell context band;
// the seven views; and the six-gate readiness strip visible on every view
// (departure D8). The shell owns the information icon (D11), so there is no
// module Help button.
const gateTone: Record<string, Tone> = { ok: "ok", warn: "warn", neutral: "neutral", block: "danger" };
export function WorkbenchHeader({ bench, view, onMethod }: { bench: Bench; view: string; onMethod: () => void }) {
  const { data, calculation: c, geometry: g, drawing, signature, gates, dirty, canEdit, command } = bench,
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
    drawings: "5 sheets",
    parts: c ? `${active} active` : null,
    compare: pending ? `${pending} decision${pending === 1 ? "" : "s"}` : null,
    definition: `${definition.issues.length} findings`,
  };
  return (
    <header className="es08-header">
      <div className="es08-header-top">
        <div className="es08-header-title">
          <nav aria-label="Breadcrumb" className="es08-crumbs">
            <Link href="/estimating">Estimating</Link>
            <span aria-hidden="true">/</span>
            <Link href="/estimating/configurations">Configurations</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">ES-08 · Screen Systems</span>
          </nav>
          <h1>Screen Configurator Workbench</h1>
          <p className="es08-record">
            <strong>{cfg.name}</strong>
            <span className="es08-mono">{cfg.display_number}</span>
            <span>Draft v{cfg.version}</span>
            <Pill tone="neutral">Synthetic</Pill>
          </p>
        </div>
        <div className="es08-header-actions">
          <span role="status" className={`es08-status es08-status--${status.tone}`}>
            <Dot tone={status.tone} />
            {status.text}
          </span>
          <button type="button" className="ppo-button" onClick={onMethod}>
            Method &amp; limitations
          </button>
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
            <Pill tone="warn">Engineering acceptance open</Pill>
          </dd>
          <dd className="es08-sub">
            {run ? `Run ${runLabel(run.sequence)} saved ${readable(run.created_at)}` : "No saved run · no approval recorded"}
          </dd>
        </div>
      </dl>
      <nav aria-label="Workbench views" className="es08-views">
        {views.map((v, i) => (
          <Link key={v} href={`/estimating/configurations/${bench.id}/${v}`} aria-current={view === v ? "page" : undefined}>
            {viewLabels[i]}
            {badges[v] && <span className={`es08-count ${v === "definition" || v === "compare" ? "es08-count--warn" : ""}`}>{badges[v]}</span>}
          </Link>
        ))}
      </nav>
      <dl className="es08-gates" aria-label="Readiness checks">
        {gates.map((gate) => (
          <div key={gate.id} className={`es08-gate es08-gate--${gate.status}`}>
            <dt>{gate.label}</dt>
            <dd className="es08-gate-value">
              <Dot tone={gateTone[gate.status]} />
              {gate.value}
            </dd>
            <dd className="es08-sub" title={gate.detail}>
              {gate.detail}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
