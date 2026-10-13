"use client";
import Link from "next/link";
import { candidateFailures } from "../../estimating/fertigation/guidance";
import type { Result } from "../../estimating/fertigation/types";
import {
  CapacityPanel,
  DeclarationsPanel,
  EvidencePanel,
  NextActionsPanel,
  OutputReadinessPanel,
} from "../fertigation-cockpit";
import { human } from "../fertigation-fields";
import { viewEyebrow } from "../fertigation-frame";
import {
  BasisTag,
  Button,
  Chip,
  Facts,
  Hint,
  Notice,
  PageHead,
  Panel,
  PhaseChip,
  ResultValue,
  Tile,
  Tiles,
  Token,
  fmt,
  known,
  when,
} from "../fertigation-ui";
import { strongest } from "./registers";
import type { ViewContext } from "./context";

/*
 * 01 · Overview: the cockpit. What the scope can produce now, the next
 * actions by role, the declarations the draft needs, the scope at a glance,
 * every capacity limit on one scale, the system concept, evidence maturity and
 * the project brief. Every figure is the engine's or an entered value.
 */

const value = (r: Result | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;

export function OverviewView({ ctx }: { ctx: ViewContext }) {
  const { data, proposal, calculation, guidanceScope, guidanceCalculation, guidanceBasis, canEdit } = ctx;
  const scenario = proposal.scenarios.find((s) => s.id === proposal.selected_scenario_id);
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("overview")}
        title="Project overview"
        lede="A shared scope basis for the grower, irrigation designer and Priva specialist."
        actions={
          <Button
            variant="secondary"
            icon="calculate"
            disabled={ctx.previewBusy || ctx.pending}
            onClick={ctx.calculate}
          >
            {ctx.previewBusy ? "Calculating…" : "Validate & calculate draft"}
          </Button>
        }
      />
        <NextActionsPanel
          scope={guidanceScope}
          findings={guidanceCalculation.findings}
          basis={guidanceBasis}
          onView={ctx.changeView}
          candidates={candidateFailures(guidanceScope, guidanceCalculation)}
          canResolve={(code) => canEdit && ctx.resolveList.some((r) => r.key.startsWith(`${code}:`))}
          onResolve={(code) => ctx.resolveFor((key) => key.startsWith(`${code}:`))}
          canDeclare={(code) => canEdit && !!ctx.declarable(code)}
          onDeclare={(code) => ctx.declare(ctx.declarable(code)?.key ?? null)}
        />

      <div className="fn-cockpit">
        <OutputReadinessPanel
          onView={ctx.changeView}
          input={{
            dirty: ctx.dirty,
            historical: ctx.historical,
            sourceChanged: !!data.source.changed,
            canEdit: data.can_edit,
            revision: data.revision.version,
            openFindings: data.calculation.findings.length,
          }}
          links={{
            export: `/api/v1/estimating/fertigation/${ctx.scopeId}/export?revision_id=${data.revision.id}&format=json`,
            report: ctx.reportHref,
          }}
        />
      <DeclarationsPanel
        items={ctx.declarationList}
        findings={guidanceCalculation.findings.length}
        basis={guidanceBasis}
        onView={ctx.changeView}
        canOpen={!!calculation}
        onDeclare={ctx.declare}
      />
      </div>
      {!calculation ? (
        <Notice tone="warning" role="status">
          Draft changed. Recalculate to inspect the current proposal; saved results remain attached to the earlier revision.
        </Notice>
      ) : (
        <Tiles>
          <Tile
            label="Connected flow"
            value={<ResultValue result={calculation.connected_flow_m3h} />}
            tag={<BasisTag basis="calculated" />}
            foot="All included valves, before sequencing"
            action={
              <button type="button" className="fn-link" onClick={() => ctx.trace("connected_flow")}>
                How this is calculated
              </button>
            }
          />
          <Tile
            label="Peak operating flow"
            value={<ResultValue result={calculation.operating_peak_m3h} />}
            tag={<BasisTag basis="calculated" />}
            foot={scenario ? `${scenario.label} · largest dosing-unit group` : "No scenario selected"}
            action={
              <button type="button" className="fn-link" onClick={() => ctx.trace("operating_peak")}>
                How this is calculated
              </button>
            }
          />
          <Tile
            label="Gross daily crop demand"
            value={<ResultValue result={calculation.daily_demand_m3} />}
            tag={<BasisTag basis="calculated" />}
            foot="From the entered crop water basis"
          />
          <Tile
            label="Active planted area"
            value={
              known(value(calculation.area_m2)) ? (
                <>
                  {fmt(value(calculation.area_m2)! / 10000, 2)}
                  <small> ha</small>
                </>
              ) : (
                <ResultValue result={calculation.area_m2} />
              )
            }
            tag={<BasisTag basis="calculated" />}
            foot={`${proposal.areas.length} ${proposal.areas.length === 1 ? "block" : "blocks"} · represented crop area in the scenario`}
          />
          <Tile
            label="Active plant population"
            value={<ResultValue result={calculation.plants} digits={0} />}
            tag={<BasisTag basis="calculated" />}
            foot={
              known(value(calculation.containers))
                ? `${fmt(value(calculation.containers)!, 0)} containers · declared counts`
                : calculation.containers.reason || "Container counts not declared"
            }
          />
          <Tile
            label="Pump peak"
            value={<ResultValue result={calculation.pump_peak_m3h} />}
            tag={<BasisTag basis="calculated" />}
            foot="Largest pump-path group flow"
          />
        </Tiles>
      )}
      {calculation && (
        <CapacityPanel
          scope={proposal}
          calculation={calculation}
          onView={ctx.changeView}
          onTrace={() => ctx.trace("required_head")}
        />
      )}
      <SystemConcept ctx={ctx} />
      <div className="fn-columns fn-overview-foot">
        <EvidencePanel scope={proposal} onView={ctx.changeView} />
        <ProjectBrief ctx={ctx} />
      </div>
      <Notice tone="info">
        Synthetic demonstration: crop targets and supplier approvals are deliberately unconfirmed. Every
        figure on this page is recalculated on save under {guidanceCalculation.edition}; unknown inputs
        stay visible through every calculation and are never replaced by defaults.
      </Notice>
    </>
  );
}

/** One shared fertigation circuit, drawn from the records the scope holds (board 01). */
function SystemConcept({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc } = ctx;
  const scenario = s.scenarios.find((x) => x.id === s.selected_scenario_id);
  const source = s.sources.find((x) => x.id === scenario?.source_id) ?? s.sources[0];
  const filters = s.filters.filter((f) => f.phase !== "excluded");
  const shortlisted = s.candidates.find((c) => c.shortlisted);
  const masters = s.masters.filter((m) => m.phase !== "excluded");
  const required = value(calc?.hydraulic.required_head_m),
    peak = value(calc?.pump_peak_m3h),
    unitPeak = value(calc?.operating_peak_m3h);
  const unitFlows = (calc?.group_flows ?? []).map((g) => value(g.unit)).filter(known);
  const unitMin = unitFlows.length ? Math.min(...unitFlows) : null;
  const open = (view: Parameters<typeof ctx.changeView>[0]) => () => ctx.changeView(view);
  return (
    <Panel
      title="System concept"
      subtitle="One shared fertigation circuit · select a component to open its register"
      className="fn-concept-panel"
    >
      <ol className="fn-concept">
        <li>
          <button type="button" className="fn-concept-card" onClick={open("water")}>
            <strong>Water source</strong>
            <span>{source ? `${source.label}${source.type ? ` · ${source.type}` : ""}` : "No water source recorded"}</span>
            <span>
              {source && known(source.reliable_flow_m3h) ? `${fmt(source.reliable_flow_m3h)} m³/h` : "Reliable flow not recorded"}
              {source && known(source.usable_storage_m3) ? ` · ${fmt(source.usable_storage_m3)} m³ usable` : ""}
            </span>
            {scenario && source && scenario.source_id !== source.id ? (
              <Chip tone="incomplete">Not bound to scenario</Chip>
            ) : source ? (
              <PhaseChip phase={source.phase} />
            ) : (
              <Chip tone="unknown">Not recorded</Chip>
            )}
          </button>
        </li>
        <li>
          <button type="button" className="fn-concept-card" onClick={open("water")}>
            <strong>Supply pump</strong>
            <span>{s.hydraulics.pump_model || "Pump not recorded"}</span>
            <span>
              {known(peak) && known(required)
                ? `Needs ${fmt(peak)} m³/h at ${fmt(required)} m`
                : known(peak)
                  ? `Needs ${fmt(peak)} m³/h`
                  : "Duty not assessed"}
            </span>
            {s.hydraulics.curve_evidence_id ? (
              <Chip tone="documented">Curve referenced</Chip>
            ) : (
              <Chip tone="assumed">Curve unverified</Chip>
            )}
          </button>
        </li>
        <li>
          <button type="button" className="fn-concept-card" onClick={open("water")}>
            <strong>Filtration</strong>
            <span>
              {filters.length
                ? filters.map((f) => `${f.label}${f.process ? ` · ${f.process}` : ""}`).join(", ")
                : "No filtration recorded"}
            </span>
            <span>
              {filters.length
                ? filters
                    .map((f) => `${known(f.capacity_m3h) ? `${fmt(f.capacity_m3h)} m³/h` : "capacity not recorded"}${known(f.dirty_loss_m) ? ` · ${fmt(f.dirty_loss_m)} m dirty loss` : ""}`)
                    .join(", ")
                : "Add a process to assess the path"}
            </span>
            {filters.some((f) => f.path === "unknown") ? (
              <Chip tone="incomplete">Flow path to confirm</Chip>
            ) : filters.length ? (
              <PhaseChip phase={filters[0].phase} />
            ) : (
              <Chip tone="unknown">Not recorded</Chip>
            )}
          </button>
        </li>
        <li className="fn-concept-unit">
          <button type="button" className="fn-concept-card" onClick={open("configurator")}>
            <strong>Priva fertigation</strong>
            <span>
              {known(unitMin) && known(unitPeak)
                ? `Requires ${fmt(unitMin)}–${fmt(unitPeak)} m³/h`
                : "Required range not assessed"}
            </span>
            <span>
              {s.stocks.filter((x) => x.function !== "spare" && x.phase !== "excluded").length} dosing{" "}
              {s.stocks.filter((x) => x.function !== "spare" && x.phase !== "excluded").length === 1 ? "channel" : "channels"} required
            </span>
            {shortlisted ? (
              <Chip tone="proposed">{shortlisted.family} shortlisted</Chip>
            ) : (
              <Chip tone="unknown">Not shortlisted</Chip>
            )}
          </button>
        </li>
        <li>
          <button type="button" className="fn-concept-card" onClick={open("growing")}>
            <strong>{masters.length === 1 ? `Mainline ${masters[0].label}` : "Mainlines"}</strong>
            <span>
              {masters.length
                ? masters.length === 1
                  ? masters[0].circuit || "Production mainline"
                  : `${masters.length} mainline / master valves`
                : "No mainline recorded"}
            </span>
            <span>
              {masters.length === 1 && known(masters[0].pressure_bar)
                ? `${fmt(masters[0].pressure_bar)} bar · basis to verify`
                : masters.length === 1
                  ? "Pressure not recorded"
                  : `${s.valves.length} irrigation valves`}
            </span>
            {masters.length ? <PhaseChip phase={masters[0].phase} /> : <Chip tone="unknown">Not recorded</Chip>}
          </button>
        </li>
      </ol>
      <p className="fn-concept-note">
        {s.valves.length} irrigation {s.valves.length === 1 ? "valve" : "valves"} ·{" "}
        {scenario
          ? `${s.valves.filter((v) => v.phase !== "excluded" && (v.phase !== "future" || scenario.include_future)).length} in this scenario`
          : "no scenario selected"}
      </p>
      <div className="fn-concept-blocks">
        {s.areas.map((area) => {
          const cohorts = s.crop_groups.filter((c) => c.area_id === area.id);
          const cohortIds = new Set(cohorts.map((c) => c.id));
          const valves = s.valves.filter((v) =>
            v.allocations.some((a) => a.area_id === area.id || (a.crop_group_id && cohortIds.has(a.crop_group_id))),
          );
          const containers = cohorts.map((c) => c.container_count).filter(known);
          return (
            <button
              key={area.id}
              type="button"
              className={`fn-concept-block fn-concept-block-${area.phase}`}
              onClick={() => ctx.edit("areas", area)}
            >
              <span className="fn-concept-block-head">
                <strong>{area.label}</strong>
                <PhaseChip phase={area.phase} />
              </span>
              <small>
                {known(area.area_m2)
                  ? area.entered_area_unit === "ha"
                    ? `${fmt(area.area_m2 / 10000, 2)} ha`
                    : `${fmt(area.area_m2, 0)} m²`
                  : "Area not recorded"}
                {containers.length ? ` · ${fmt(containers.reduce((a, b) => a + b, 0), 0)} containers` : ""}
              </small>
              <span className="fn-concept-valves">
                {valves.slice(0, 4).map((v) => (
                  <span key={v.id}>
                    <span>{v.label}</span>
                    <ResultValue result={calc?.valve_flows.find((x) => x.id === v.id)?.flow} />
                  </span>
                ))}
                {valves.length > 4 && <small>and {valves.length - 4} more valves</small>}
                {!valves.length && <small>No valve allocated</small>}
              </span>
              <span className="fn-concept-block-foot">
                <small>Strongest evidence</small>
                <Chip tone={strongest(s, area) === "none" ? "unknown" : strongest(s, area) === "document_reference" ? "documented" : strongest(s, area) === "observation" ? "observed" : "assumed"}>
                  {{ none: "No evidence", assumption: "Assumed", observation: "Observed", document_reference: "Documented" }[strongest(s, area)]}
                </Chip>
              </span>
            </button>
          );
        })}
        {!s.areas.length && (
          <p className="fn-hint">No growing areas recorded. Add blocks in Growing areas &amp; irrigation.</p>
        )}
      </div>
      <Hint>
        Concept schematic · not a survey, pipe-sizing or hydraulic-topology approval · synthetic data. Flows shown are the engine&rsquo;s valve demands before sequencing.
      </Hint>
    </Panel>
  );
}

function ProjectBrief({ ctx }: { ctx: ViewContext }) {
  const { data, proposal, canEdit } = ctx;
  const context = proposal.production_context;
  const captured = data.revision.binding.captured_discovery;
  return (
    <Panel
      title="Project brief"
      subtitle={`Revision ${data.revision.version} · ${data.scope.state === "Archived" ? "archived" : "Discovery stage"}`}
      actions={
        <Button
          variant="secondary"
          size="sm"
          icon="edit"
          disabled={!canEdit}
          onClick={() => ctx.edit("production_context", proposal.production_context)}
        >
          Edit production context
        </Button>
      }
      foot={
        <span>
          Exact Discovery source <code>{data.revision.binding.revision_id}</code> · saved {when(data.revision.created_at)} ·{" "}
          <Link href={`/estimating/fertigation/${ctx.scopeId}?revision_id=${data.revision.id}`}>Open this exact saved revision</Link>
        </span>
      }
    >
      <p className="fn-brief-lede">
        {context.crop_description || <Token>Crop or plant description not recorded</Token>}
      </p>
      <p className="fn-brief-tags">
        {context.tags.map((t) => (
          <Chip key={t} tone={t === "unknown" ? "unknown" : "neutral"}>
            {human(t)}
          </Chip>
        ))}
      </p>
      <Facts
        rows={[
          ["Customer", captured?.organisation?.display_name ?? <Token>Not recorded</Token>],
          ["Site", captured?.site?.display_name ?? <Token>Not recorded</Token>],
          ["Growing system", context.growing_system === "unknown" ? <Token>Unknown</Token> : human(context.growing_system)],
          ["Irrigation method", context.application_method === "unknown" ? <Token>Unknown</Token> : human(context.application_method)],
          ["Hydraulic arrangement", context.hydraulic_arrangement === "unknown" ? <Token>Unknown</Token> : human(context.hydraulic_arrangement)],
          ["Source note", context.source_note || <Token>Not recorded</Token>],
          ["Discovery binding", `Alternative ${data.source.option_label} · revision ${data.source.revision} · ${data.source.scope_readiness}`],
        ]}
      />
      <Hint>
        Canonical Facility facts remain source observations. Context labels do not certify a process, controller,
        licence or equipment selection. Existing manual estimates and issued documents remain separate.
      </Hint>
    </Panel>
  );
}
