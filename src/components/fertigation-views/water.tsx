"use client";
import { HeadBuildUp } from "../fertigation-charts";
import { viewEyebrow } from "../fertigation-frame";
import { PumpDutyChart } from "../fertigation-trace";
import {
  Button,
  Chip,
  Columns,
  Hint,
  Notice,
  PageHead,
  Panel,
  fmt,
  known,
} from "../fertigation-ui";
import { RegisterTabs } from "./registers";
import type { ViewContext } from "./context";

/* 03 · Water supply & hydraulics: the pump curve, the duty build-up and the water registers. */

export function WaterView({ ctx }: { ctx: ViewContext }) {
  const { proposal: s, calculation: calc, canEdit } = ctx;
  const h = s.hydraulics;
  const points = h.curve_points.filter((p) => known(p.flow_m3h) && known(p.head_m));
  const margin = calc?.hydraulic.margin_m;
  return (
    <>
      <PageHead
        eyebrow={viewEyebrow("water")}
        title="Water supply & hydraulics"
        lede="Develop the source, treatment path and pump duty from recorded evidence."
        actions={
          <Button
            variant="secondary"
            icon="edit"
            disabled={!canEdit}
            onClick={() => ctx.edit("hydraulics", s.hydraulics)}
          >
            Edit pump & duty
          </Button>
        }
      />
      <Columns template="minmax(0, 1.35fr) minmax(0, 1fr)" className="fn-water-columns">
        <Panel
          title="Pump curve & duty range"
          subtitle={
            <>
              {h.pump_model || "Pump not recorded"}
              {points.length ? ` · ${points.length}-point entered curve` : " · no curve entered"}
              {known(h.speed_rpm) ? ` · ${fmt(h.speed_rpm, 0)} rpm` : ""}
            </>
          }
          actions={
            h.curve_evidence_id ? (
              <Chip tone="documented">Curve referenced</Chip>
            ) : (
              <Chip tone="assumed">Curve unverified</Chip>
            )
          }
          foot="Linear interpolation between entered points only. The duty marker is a requirement, not a predicted operating point; that needs a system curve at the same speed and hydraulic boundary."
        >
          {calc ? (
            <PumpDutyChart scope={s} calculation={calc} />
          ) : (
            <Notice tone="warning">
              Draft changed. Recalculate to redraw the duty against the entered curve.
            </Notice>
          )}
          {calc && margin && margin.state === "known" && known(margin.value) && (
            <Notice tone={margin.value >= 0 ? "info" : "danger"}>
              {margin.value >= 0
                ? `The curve gives ${fmt(margin.value)} m more than the duty needs at the pump peak. Drive type and pressure regulation are not recorded, so how that margin is managed remains open.`
                : `The curve falls ${fmt(Math.abs(margin.value))} m short of the duty at the pump peak.`}
            </Notice>
          )}
        </Panel>
        <Panel
          title="Required duty build-up"
          subtitle={
            known(h.head_basis_flow_m3h)
              ? `Head components at the ${fmt(h.head_basis_flow_m3h)} m³/h head-loss basis`
              : "Head-loss basis flow not recorded"
          }
          actions={
            calc && (
              <button type="button" className="fn-link" onClick={() => ctx.trace("required_head")}>
                How this is calculated
              </button>
            )
          }
        >
          {calc ? (
            <HeadBuildUp scope={s} calculation={calc} />
          ) : (
            <Notice tone="warning">Recalculate the draft to rebuild the duty.</Notice>
          )}
          <div className="fn-formula">
            <p>Head = pressure ÷ (ρg) + static lift + losses</p>
            <p>
              {known(h.outlet_pressure_bar)
                ? `${fmt(h.outlet_pressure_bar)} bar at ρ = 998.2 kg/m³ → ${fmt((h.outlet_pressure_bar * 100000) / (998.2 * 9.80665))} m.`
                : "Outlet pressure not recorded."}{" "}
              Density and temperature require review where material.
            </p>
            <p>
              <Chip tone="assumed">Assumed</Chip>{" "}
              {known(h.head_basis_flow_m3h)
                ? `Losses entered at ${fmt(h.head_basis_flow_m3h)} m³/h; the engine reviews them at the actual pump duty.`
                : "Enter the flow at which the losses were taken."}
            </p>
          </div>
        </Panel>
      </Columns>
      <RegisterTabs ctx={ctx} view="water" />
      <Hint>
        A numerical tank balance alone does not verify a supply route. Choose the actual supply and storage source
        for each scenario in Operating plan.
      </Hint>
    </>
  );
}
