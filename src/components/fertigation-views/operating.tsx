"use client";
import type { Result } from "../../estimating/fertigation/types";
import {
  CycleDetail,
  IrrigationTimeline,
  StorageBalance,
  timelineLegend,
} from "../fertigation-charts";
import { viewEyebrow } from "../fertigation-frame";
import { FertigationScenarios } from "../fertigation-scenarios";
import {
  BasisTag,
  Button,
  Chip,
  Hint,
  Notice,
  PageHead,
  Panel,
  ResultValue,
  Tile,
  Tiles,
  Token,
  clock,
  fmt,
  known,
} from "../fertigation-ui";
import { RegisterTable } from "../ui/register-table";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 06 · Operating groups & scenario planning. */

const value = (r: Result | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;

export function OperatingView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, canEdit, dirty, data, pending } = ctx;
  const scenario = s.scenarios.find((x) => x.id === s.selected_scenario_id);
  const unitFlows = (calc?.group_flows ?? []).map((g) => value(g.unit)).filter(known);
  const unitMin = unitFlows.length ? Math.min(...unitFlows) : null;
  const events = calc?.schedule.events ?? [];
  const last = events.length ? Math.max(...events.map((e) => e.finish)) : null;
  const span =
    scenario && known(scenario.start_minute) && known(last)
      ? Math.round((last - scenario.start_minute * 60) / 60)
      : null;
  const window =
    scenario && known(scenario.start_minute) && known(scenario.end_minute)
      ? scenario.end_minute - scenario.start_minute
      : null;
  const timingFinding = calc?.findings.find((f) =>
    ["window_overflow", "cycle_overlap", "dry_interval", "start_interval", "rest_interval"].some((c) =>
      f.id.startsWith(`${c}:`) || f.id === c,
    ),
  );
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("operating")}
        title="Operating groups & scenario planning"
        lede="Define simultaneous valves inside each group, then test the sequential shared-circuit plan."
        actions={
          scenario && (
            <Button
              variant="secondary"
              size="sm"
              icon="edit"
              disabled={!canEdit}
              onClick={() => ctx.edit("scenarios", scenario)}
            >
              Edit scenario
            </Button>
          )
        }
      />
      <Tiles>
        <Tile
          label="Minimum unit flow"
          value={known(unitMin) ? fmt(unitMin) : <Token>Not assessed</Token>}
          unit={known(unitMin) ? "m³/h" : undefined}
          tag={<BasisTag basis="calculated" />}
          foot="Smallest group through the dosing unit"
        />
        <Tile
          label="Peak unit / pump flow"
          value={
            calc ? (
              <>
                <ResultValue result={calc.operating_peak_m3h} /> / <ResultValue result={calc.pump_peak_m3h} />
              </>
            ) : (
              <Token>Not assessed</Token>
            )
          }
          tag={<BasisTag basis="calculated" />}
          foot="Consumer paths assessed separately"
        />
        <Tile
          label="Daily crop demand"
          value={<ResultValue result={calc?.daily_demand_m3} />}
          tag={<BasisTag basis="calculated" />}
          foot="Entered crop water basis, all included cohorts"
        />
        <Tile
          label="Sequence duration"
          value={known(span) ? fmt(span, 0) : <Token>Not assessed</Token>}
          unit={known(span) && known(window) ? `of ${fmt(window, 0)} min` : known(span) ? "min" : undefined}
          tag={<BasisTag basis="calculated" />}
          tone={known(span) && known(window) && span > window ? "conflict" : undefined}
          foot={
            known(span) && known(window)
              ? span <= window
                ? `${fmt(window - span, 0)} min of the window unused`
                : "Runs past the declared window"
              : "Needs a window, cycle count, spacing and group durations"
          }
        />
      </Tiles>
      <Panel
        title="Scenario for review & output"
        subtitle="One shared sequential circuit. Group order is explicit; scenarios share the physical registers."
        actions={
          <Button variant="secondary" size="sm" icon="calculate" disabled={ctx.previewBusy || pending} onClick={ctx.calculate}>
            {ctx.previewBusy ? "Calculating…" : "Validate & calculate draft"}
          </Button>
        }
      >
        <div className="fn-scenario-pick">
          <label className="fn-filter">
            <span>Selected saved scenario</span>
            <select
              disabled={!canEdit}
              value={s.selected_scenario_id ?? ""}
              onChange={(e) => ctx.update({ ...s, selected_scenario_id: e.target.value || null })}
            >
              <option value="">Not selected</option>
              {s.scenarios.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          {scenario && (
            <p className="fn-scenario-facts">
              {known(scenario.start_minute) && known(scenario.end_minute)
                ? `Irrigation window ${clock(scenario.start_minute)}–${clock(scenario.end_minute)}`
                : "Window not recorded"}
              {known(scenario.cycles) ? ` · ${fmt(scenario.cycles, 0)} cycles` : ""}
              {known(scenario.spacing_min) ? ` at ${fmt(scenario.spacing_min)} min spacing` : ""}
              {scenario.include_future ? " · future records included" : " · future records excluded"}
            </p>
          )}
        </div>
        <Hint>
          Recirculating consumption and independent parallel circuits remain outside this model. Automatic
          optimisation and multiple parallel circuits are not modelled.
        </Hint>
      </Panel>
      {calc && scenario && events.length > 0 && (
        <Panel
          title="Irrigation timeline"
          subtitle={`Deterministic sequence · one shared pump and fertigation circuit · ${scenario.label}`}
          actions={
            timingFinding ? (
              <Chip tone="conflict" icon="conflict">{timingFinding.message}</Chip>
            ) : (
              <Chip tone="success" icon="check">Fits entered timing checks</Chip>
            )
          }
          foot="Verify crop-by-crop delivery, minimum pulse duration and overnight requirements. A one-day plan does not establish repeat dry intervals or overnight coverage."
        >
          <IrrigationTimeline scope={s} calculation={calc} scenario={scenario} />
          <p className="fn-subhead">
            Cycle detail · first cycle{" "}
            <small>· {s.groups.length === 1 ? "one group" : `${s.groups.filter((g) => scenario.group_ids.includes(g.id)).length} groups in order`} · same durations in every cycle</small>
          </p>
          <CycleDetail scope={s} calculation={calc} />
          {timelineLegend}
        </Panel>
      )}
      {calc && scenario && events.length === 0 && (
        <Notice tone="warning">
          {calc.schedule.cycle_seconds.reason || "The timeline needs a same-day window, a cycle count, a spacing basis and complete group durations."}
        </Notice>
      )}
      {calc && scenario && (
        <Panel
          title="Storage & refill balance"
          subtitle="Conservative allowance: full entered group pump flow during all three phases; refill at the entered rate"
          foot="The balance ends at the last irrigation event. Crop credit applies only to delivery and declared crop-directed flush."
        >
          <StorageBalance scope={s} calculation={calc} scenario={scenario} />
        </Panel>
      )}
      <RegisterTabs ctx={ctx} view="operating" />
      {calc && calc.coverage.length > 0 && (
        <Panel
          title="Crop delivery coverage"
          count={calc.coverage.length}
          subtitle="Each valve-served population is checked independently; aggregate surplus cannot compensate for an omitted service area"
          flush
          foot="Volume checks use declared emitter inventory; measured or design totals do not establish uniform distribution. Passing this table is not agronomic approval."
        >
          <RegisterTable variant="panel" caption="Required and modelled delivery for each service allocation in the selected scenario.">
            <thead>
              <tr>
                <th scope="col"><span className="ppo-register-label">Crop / service area</span></th>
                <th scope="col"><span className="ppo-register-label">Valve</span></th>
                <th scope="col" className="fn-col-num"><span className="ppo-register-label">Entered demand</span></th>
                <th scope="col" className="fn-col-num"><span className="ppo-register-label">Modelled delivery</span></th>
                <th scope="col"><span className="ppo-register-label">Assessment</span></th>
              </tr>
            </thead>
            <tbody>
              {calc.coverage.slice(0, 100).map((row) => {
                const required = value(row.required_m3),
                  delivered = value(row.delivered_m3);
                const valve = s.valves.find((v) => v.id === row.valve_id);
                return (
                  <tr key={row.allocation_id}>
                    <td className="ppo-register-wrap">
                      {s.crop_groups.find((c) => c.id === row.crop_group_id)?.label ?? <Token>Unassigned cohort</Token>}
                    </td>
                    <td>{valve?.label ?? "Valve"}</td>
                    <td className="fn-col-num"><ResultValue result={row.required_m3} /></td>
                    <td className="fn-col-num"><ResultValue result={row.delivered_m3} /></td>
                    <td>
                      {known(required) && known(delivered) ? (
                        delivered >= required ? (
                          <Chip tone="review">Meets entered volume only</Chip>
                        ) : (
                          <Chip tone="conflict" icon="conflict">Short of the entered volume</Chip>
                        )
                      ) : (
                        <Chip tone="unknown">Not assessable</Chip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </RegisterTable>
          {calc.coverage.length > 100 && <Hint>First 100 allocations shown. The exact saved output retains the complete schedule.</Hint>}
        </Panel>
      )}
      <FertigationScenarios proposal={s} dirty={dirty} revision={data.revision.version} blocked={pending} />
    </>
  );
}
