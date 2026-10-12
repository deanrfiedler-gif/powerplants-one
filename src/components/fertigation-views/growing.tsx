"use client";
import type { Result, Scope } from "../../estimating/fertigation/types";
import { viewEyebrow } from "../fertigation-frame";
import {
  BasisTag,
  ButtonLink,
  Hint,
  PageHead,
  Panel,
  ResultValue,
  Tile,
  Tiles,
  Token,
  fmt,
  known,
} from "../fertigation-ui";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 02 · Growing areas & irrigation: blocks, crop cohorts and the valves that serve them. */

const value = (r: Result | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;

export function GrowingView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, data } = ctx;
  const scenario = s.scenarios.find((x) => x.id === s.selected_scenario_id);
  const inScenario = (phase: string) =>
    phase !== "excluded" && (phase !== "future" || scenario?.include_future === true);
  const valves = s.valves.filter((v) => inScenario(v.phase));
  const future = s.valves.filter((v) => v.phase === "future").length;
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("growing")}
        title="Growing areas & irrigation"
        lede="Keep physical blocks, crops and controlled irrigation areas connected."
        actions={
          <ButtonLink
            variant="secondary"
            icon="download"
            href={`/api/v1/estimating/fertigation/${ctx.scopeId}/export?revision_id=${data.revision.id}&format=valves`}
            download
          >
            Export valve CSV
          </ButtonLink>
        }
      />
      <Tiles>
        <Tile
          label="Scenario area"
          value={
            calc && known(value(calc.area_m2)) ? (
              <>
                {fmt(value(calc.area_m2)! / 10000, 2)}
                <small> ha</small>
              </>
            ) : (
              <ResultValue result={calc?.area_m2} />
            )
          }
          tag={<BasisTag basis="calculated" />}
          foot={
            s.areas.some((a) => a.phase === "future")
              ? `${s.areas.filter((a) => a.phase === "future").length} future ${s.areas.filter((a) => a.phase === "future").length === 1 ? "block" : "blocks"} recorded${scenario?.include_future ? ", included" : ", excluded"}`
              : `${s.areas.length} ${s.areas.length === 1 ? "block" : "blocks"} recorded`
          }
        />
        <Tile
          label="Containers"
          value={<ResultValue result={calc?.containers} digits={0} />}
          tag={<BasisTag basis="calculated" />}
          foot="Actual counts take precedence"
        />
        <Tile
          label="Irrigation valves"
          value={valves.length}
          unit={scenario ? "in scenario" : "recorded"}
          tag={<BasisTag basis="entered" />}
          foot={`${future ? `${future} future ${future === 1 ? "valve" : "valves"} · ` : ""}${s.masters.length} mainline / master ${s.masters.length === 1 ? "valve" : "valves"}`}
        />
        <Tile
          label="Connected flow"
          value={<ResultValue result={calc?.connected_flow_m3h} />}
          tag={<BasisTag basis="calculated" />}
          foot="All included valves, before sequencing"
          action={
            calc && (
              <button type="button" className="fn-link" onClick={() => ctx.trace("connected_flow")}>
                How this is calculated
              </button>
            )
          }
        />
      </Tiles>
      <RegisterTabs ctx={ctx} view="growing" />
      <Topology scope={s} calculation={calc} onValve={(valve) => ctx.edit("valves", valve)} />
    </>
  );
}

/** Block → mainline → irrigation valve, concept only (board 02's allocation schematic). */
function Topology({
  scope,
  calculation,
  onValve,
}: {
  scope: Scope;
  calculation: ViewContext["calculation"];
  onValve: (record: Scope["valves"][number]) => void;
}) {
  if (!scope.valves.length) return null;
  const shown = scope.valves.slice(0, 8);
  return (
    <Panel
      title="Allocation schematic"
      subtitle="Water source → mainline → irrigation valve → crop cohort · emitter arrangement"
      className="fn-schematic-panel"
    >
      <ul className="fn-schematic">
        {shown.map((v) => {
          const master = scope.masters.find((m) => m.id === v.master_id);
          const source = scope.sources.find(
            (x) => x.id === (v.source_id ?? master?.source_id),
          );
          const emitter = v.emitter;
          const derivation =
            emitter.method === "verified_per_container" && known(emitter.verified_container_lph)
              ? `${fmt(emitter.verified_container_lph)} L/h per container · verified`
              : known(emitter.count) && known(emitter.flow_lph)
                ? `${fmt(emitter.count, 0)} × ${fmt(emitter.flow_lph)} L/h${known(emitter.containers_per_emitter) ? ` · ${fmt(emitter.containers_per_emitter)} containers per emitter` : ""}`
                : v.flow_basis === "measured" && known(v.measured_flow_m3h)
                  ? `Measured ${fmt(v.measured_flow_m3h)} m³/h`
                  : v.flow_basis === "design_allowance" && known(v.design_flow_m3h)
                    ? `Design allowance ${fmt(v.design_flow_m3h)} m³/h`
                    : null;
          return (
            <li key={v.id}>
              <span className="fn-schematic-node fn-schematic-source">
                <strong>{source?.label ?? <Token>Source unassigned</Token>}</strong>
                <small>{source?.type || "Water source"}</small>
              </span>
              <span className="fn-schematic-link" aria-hidden="true" />
              <span className="fn-schematic-node fn-schematic-master">
                <strong>{master?.label ?? <Token>Master unassigned</Token>}</strong>
                <small>
                  {master?.circuit || "Mainline"}
                  {master && known(master.pressure_bar) ? ` · ${fmt(master.pressure_bar)} bar` : ""}
                </small>
              </span>
              <span className="fn-schematic-link" aria-hidden="true" />
              <button type="button" className="fn-schematic-node fn-schematic-valve" onClick={() => onValve(v)}>
                <strong>
                  {v.label}
                  <span className="fn-sr"> · open valve</span>
                </strong>
                <span className="fn-schematic-flow">
                  <ResultValue result={calculation?.valve_flows.find((x) => x.id === v.id)?.flow} />
                </span>
                <small>{v.flow_basis === "unknown" ? "Basis not recorded" : v.flow_basis.replaceAll("_", " ")}</small>
              </button>
              <span className="fn-schematic-link" aria-hidden="true" />
              <span className="fn-schematic-node fn-schematic-cohort">
                <strong>
                  {v.allocations.length
                    ? v.allocations
                        .map(
                          (a) =>
                            scope.crop_groups.find((c) => c.id === a.crop_group_id)?.label ??
                            scope.areas.find((x) => x.id === a.area_id)?.label ??
                            "Unassigned",
                        )
                        .join(", ")
                    : "No allocation"}
                </strong>
                <small>
                  {v.allocations.length
                    ? v.allocations
                        .map((a) => (known(a.container_count) ? `${fmt(a.container_count, 0)} containers` : "containers not recorded"))
                        .join(" · ")
                    : "Add a service allocation on the valve"}
                </small>
                {derivation && <small className="fn-schematic-derivation">{derivation}</small>}
              </span>
            </li>
          );
        })}
      </ul>
      <Hint>
        Concept only · not to scale · not for construction. Each physical valve is shown with its recorded
        source and master; splitter outlets do not multiply shared hub flow.
        {scope.valves.length > 8 && ` First eight physical paths shown; the valve register exposes all ${scope.valves.length}.`}
      </Hint>
    </Panel>
  );
}
