"use client";
import type { ReactNode } from "react";
import { PRESSURE_HEAD_M_PER_BAR } from "../estimating/fertigation/trace";
import { findingCode } from "../estimating/fertigation/guidance";
import type {
  Bank,
  Calculation,
  Scenario,
  Scope,
} from "../estimating/fertigation/types";
import {
  Chip,
  Hint,
  Legend,
  Token,
  clock,
  fmt,
  known,
  niceStep,
  useContainerWidth,
} from "./fertigation-ui";

/*
 * Charts for the fertigation workbench, drawn to the design board (boards 03,
 * 04, 05, 06 and 07). Every figure is an entered value from the scope or a
 * PPO-FERT-NATIVE-CALC-r01 result; the charts place them on one scale and
 * never compute a new engineering value. Text is fixed at 11–13 px and never
 * scales with the window.
 */

const value = (r: { state: string; value: number | null } | undefined) =>
  r && r.state === "known" && known(r.value) ? r.value : null;

/* ---------- 03 · Required duty build-up ---------- */

export function HeadBuildUp({
  scope,
  calculation,
}: {
  scope: Scope;
  calculation: Calculation;
}) {
  const h = scope.hydraulics;
  const pressureHead = known(h.outlet_pressure_bar)
    ? h.outlet_pressure_bar * PRESSURE_HEAD_M_PER_BAR
    : null;
  const parts: [string, string, number | null][] = [
    [
      "Outlet pressure",
      known(h.outlet_pressure_bar) ? `${fmt(h.outlet_pressure_bar)} bar` : "",
      pressureHead,
    ],
    ["Static lift", "", h.static_head_m],
    ["Pipe + fittings", "", h.pipe_loss_m],
    ["Dirty filter", "", h.filter_loss_m],
    ["Fertigation unit", "", h.unit_loss_m],
    ["Other losses", "", h.other_loss_m],
  ];
  const required = value(calculation.hydraulic.required_head_m),
    curve = value(calculation.hydraulic.curve_head_m),
    margin = value(calculation.hydraulic.margin_m);
  const scaleMax = Math.max(
    ...parts.map(([, , v]) => v ?? 0),
    required ?? 0,
    curve ?? 0,
    1,
  );
  const width = (v: number | null) =>
    known(v) ? `${Math.max(0, Math.min(100, (v / scaleMax) * 100))}%` : "0%";
  return (
    <div className="fn-buildup">
      <ul className="fn-buildup-rows">
        {parts.map(([label, note, v]) => (
          <li key={label} className={known(v) ? undefined : "fn-buildup-missing"}>
            <span className="fn-buildup-label">
              {label}
              {note && <small> · {note}</small>}
            </span>
            <span className="fn-buildup-track" aria-hidden="true">
              <span className="fn-buildup-bar fn-buildup-part" style={{ width: width(v) }} />
            </span>
            <span className="fn-buildup-value">
              {known(v) ? `${fmt(v)} m` : <Token>Not recorded</Token>}
            </span>
          </li>
        ))}
      </ul>
      <ul className="fn-buildup-rows fn-buildup-totals">
        <li>
          <span className="fn-buildup-label">Required head</span>
          <span className="fn-buildup-track" aria-hidden="true">
            <span className="fn-buildup-bar fn-buildup-required" style={{ width: width(required) }} />
          </span>
          <span className="fn-buildup-value">
            {known(required) ? `${fmt(required)} m` : <Token>{calculation.hydraulic.required_head_m.state === "unknown" ? "Unknown" : "Not applicable"}</Token>}
          </span>
        </li>
        <li>
          <span className="fn-buildup-label">
            Curve head
            {known(value(calculation.pump_peak_m3h)) && (
              <small> at {fmt(value(calculation.pump_peak_m3h)!)} m³/h</small>
            )}
          </span>
          <span className="fn-buildup-track" aria-hidden="true">
            <span className="fn-buildup-bar fn-buildup-curve" style={{ width: width(curve) }} />
          </span>
          <span className="fn-buildup-value">
            {known(curve) ? `${fmt(curve)} m` : <Token>Unknown</Token>}
          </span>
        </li>
        <li>
          <span className="fn-buildup-label">Head margin</span>
          <span className="fn-buildup-track" aria-hidden="true">
            {known(margin) && known(required) && (
              <span
                className={`fn-buildup-bar ${margin >= 0 ? "fn-buildup-margin" : "fn-buildup-shortfall"}`}
                style={{
                  marginLeft: margin >= 0 ? width(required) : width(required + margin),
                  width: width(Math.abs(margin)),
                }}
              />
            )}
          </span>
          <span className={`fn-buildup-value${known(margin) ? (margin >= 0 ? " fn-positive" : " fn-negative") : ""}`}>
            {known(margin) ? `${margin >= 0 ? "+" : "−"}${fmt(Math.abs(margin))} m` : <Token>Unknown</Token>}
          </span>
        </li>
      </ul>
    </div>
  );
}

/* ---------- 04 · Injection requirement by operating group ---------- */

export function InjectionRequirement({
  scope,
  calculation,
  candidateFailureFor,
}: {
  scope: Scope;
  calculation: Calculation;
  /** The engine's own failure text for a channel, where it recorded one. */
  candidateFailureFor: (channelId: string) => string | null;
}) {
  const scenario = scope.scenarios.find((s) => s.id === scope.selected_scenario_id);
  const active = (phase: string) =>
    phase !== "excluded" && (phase !== "future" || scenario?.include_future === true);
  const rows = calculation.injection.flatMap((need) => {
    const group = scope.groups.find((g) => g.id === need.group_id),
      stock = scope.stocks.find((s) => s.id === need.stock_id),
      channels = scope.channels.filter(
        (c) => c.stock_id === need.stock_id && active(c.phase),
      );
    const required = value(need.required_lph);
    const unit = value(calculation.group_flows.find((g) => g.id === need.group_id)?.unit);
    return (channels.length ? channels : [null]).map((channel) => ({
      key: `${need.group_id}:${need.stock_id}:${channel?.id ?? "none"}`,
      group: group?.label ?? "Group",
      stock: stock?.label ?? "Stock",
      dose: stock?.dose_l_m3 ?? null,
      unit,
      channel,
      required,
      reason: need.required_lph.reason,
    }));
  });
  if (!rows.length) return null;
  const axisMax = Math.max(
    ...rows.flatMap((r) => [r.required ?? 0, r.channel?.maximum_lph ?? 0]),
    1,
  );
  const step = niceStep(axisMax, 6),
    top = Math.ceil((axisMax * 1.08) / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  return (
    <div className="fn-injection">
      <Legend
        items={[
          { swatch: "fn-swatch-range", label: "Entered channel range (unverified)" },
          { swatch: "fn-swatch-demand", label: "Group demand" },
        ]}
      />
      <ul className="fn-injection-rows">
        {rows.map((r) => {
          const min = r.channel?.minimum_lph ?? null,
            max = r.channel?.maximum_lph ?? null;
          const over = known(r.required) && known(max) && r.required > max;
          const under = known(r.required) && known(min) && r.required < min;
          const failure = r.channel ? candidateFailureFor(r.channel.id) : null;
          return (
            <li key={r.key}>
              <div className="fn-injection-label">
                <strong>{r.group}</strong>
                <small>
                  {known(r.unit) && known(r.dose)
                    ? `${fmt(r.unit)} m³/h × ${fmt(r.dose)} L/m³ = ${known(r.required) ? `${fmt(r.required)} L/h` : "unknown"}`
                    : r.reason}
                </small>
                <small>
                  {r.channel ? r.channel.label : "No configured channel"} · {r.stock}
                </small>
              </div>
              <div className="fn-injection-track" aria-hidden="true">
                {known(min) && known(max) && max >= min && (
                  <span
                    className="fn-injection-range"
                    style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
                  />
                )}
                {known(r.required) && (
                  <span
                    className={`fn-injection-demand${over || under ? " fn-injection-over" : ""}`}
                    style={{ left: pct(r.required) }}
                  >
                    <span className="fn-injection-readout">{fmt(r.required)}</span>
                  </span>
                )}
              </div>
              <div className="fn-injection-state">
                {!known(r.required) ? (
                  <>
                    <Chip tone="incomplete">Incomplete</Chip>
                    <small>{r.reason}</small>
                  </>
                ) : !r.channel || !known(max) ? (
                  <>
                    <Chip tone="unknown">Not assessable</Chip>
                    <small>Enter the channel's injection range to compare</small>
                  </>
                ) : over || under ? (
                  <>
                    {/* The engine keeps this on the candidate: never a finding or a count. */}
                    <Chip tone="conflict" icon="conflict">Candidate failure</Chip>
                    <small>
                      {failure ??
                        (over
                          ? `Exceeds the entered ${fmt(max)} L/h maximum`
                          : `Below the entered ${fmt(min!)} L/h minimum`)}
                    </small>
                  </>
                ) : (
                  <>
                    <Chip tone="incomplete">Verification required</Chip>
                    <small>Within the entered range; channel capacity is unverified</small>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="fn-injection-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ left: pct(t) }}>
            {fmt(t)}
            {t === ticks.at(-1) ? " L/h" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 05 · I/O capacity, channel by channel ---------- */

export function IoBankRow({
  bank,
  io,
  controller,
}: {
  bank: Bank;
  io: Calculation["io"][number] | undefined;
  controller: string;
}) {
  const installed = bank.installed,
    used = bank.used ?? 0,
    reserved = bank.reserved ?? 0,
    faulty = bank.faulty ?? 0;
  const required = value(io?.required),
    available = value(io?.available),
    spare = value(io?.spare);
  const cells: { kind: string; title: string }[] = [];
  if (known(installed)) {
    const push = (n: number, kind: string, title: string) => {
      for (let i = 0; i < Math.max(0, Math.round(n)); i++) cells.push({ kind, title });
    };
    push(used, "used", "In use");
    push(reserved, "reserved", "Reserved");
    push(faulty, "faulty", "Faulty");
    const taken = used + reserved + faulty;
    const free = Math.max(0, installed - taken);
    const demand = known(required) ? Math.min(required, free) : 0;
    push(demand, "demand", "New expansion demand");
    push(free - demand, "spare", "Spare after expansion");
    if (known(required) && required > free)
      push(required - free, "short", "Shortfall");
  }
  const signal = bank.signal.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  return (
    <li className={`fn-iobank${known(spare) && spare < 0 ? " fn-iobank-short" : ""}`}>
      <div className="fn-iobank-label">
        <strong>{bank.label}</strong>
        <small>{signal}{bank.voltage ? ` · ${bank.voltage}` : ""}</small>
        <small>{controller}{bank.physical_bank ? ` · ${bank.physical_bank}` : ""}</small>
      </div>
      <div className="fn-iobank-body">
        {cells.length ? (
          <div className="fn-iobank-cells" aria-hidden="true">
            {cells.map((c, i) => (
              <span key={i} className={`fn-iocell fn-iocell-${c.kind}`} title={c.title} />
            ))}
          </div>
        ) : (
          <Token>Installed channel count not recorded</Token>
        )}
        <small className="fn-iobank-sum">
          {known(installed)
            ? `${fmt(installed)} installed − ${fmt(used)} used − ${fmt(reserved)} reserved − ${fmt(faulty)} faulty = ${known(available) ? `${fmt(available)} available` : "available not assessed"}`
            : io?.available.reason}
          {known(required) ? ` · ${fmt(required)} required for expansion` : io ? ` · ${io.required.reason}` : ""}
        </small>
      </div>
      <div className="fn-iobank-balance">
        <small>Balance</small>
        <strong className={known(spare) ? (spare < 0 ? "fn-negative" : "fn-positive") : undefined}>
          {known(spare) ? `${spare >= 0 ? "+" : "−"}${fmt(Math.abs(spare))}` : "—"}
        </strong>
        {known(spare) ? (
          spare < 0 ? (
            <Chip tone="conflict" icon="conflict">Conflict · add I/O</Chip>
          ) : (
            <Chip tone="success">{fmt(spare)} spare after expansion</Chip>
          )
        ) : (
          <Chip tone="unknown">Not assessable</Chip>
        )}
      </div>
    </li>
  );
}

export const ioLegend = (
  <Legend
    items={[
      { swatch: "fn-swatch-used", label: "Used" },
      { swatch: "fn-swatch-reserved", label: "Reserved" },
      { swatch: "fn-swatch-faulty", label: "Faulty" },
      { swatch: "fn-swatch-demand-cell", label: "New expansion demand" },
      { swatch: "fn-swatch-spare", label: "Spare after expansion" },
      { swatch: "fn-swatch-short", label: "Shortfall" },
    ]}
  />
);

/* ---------- 06 · Irrigation timeline ---------- */

type Segment = { group: string; prepare: number; start: number; end: number; finish: number };

function segments(scope: Scope, calculation: Calculation): Segment[] {
  return calculation.schedule.events.map((e) => {
    const g = scope.groups.find((x) => x.id === e.group_id);
    return {
      group: g?.label ?? "Group",
      prepare: e.start - (g?.prepare_seconds ?? 0),
      start: e.start,
      end: e.end,
      finish: e.finish,
    };
  });
}

export function IrrigationTimeline({
  scope,
  calculation,
  scenario,
}: {
  scope: Scope;
  calculation: Calculation;
  scenario: Scenario;
}) {
  const [ref, width] = useContainerWidth<HTMLDivElement>(900);
  const events = segments(scope, calculation);
  if (!events.length || !known(scenario.start_minute) || !known(scenario.end_minute))
    return null;
  const windowStart = scenario.start_minute * 60,
    windowEnd = scenario.end_minute * 60;
  const last = Math.max(...events.map((e) => e.finish));
  const spanEnd = Math.max(windowEnd, last);
  const groups = [...new Set(events.map((e) => e.group))];
  const left = 118,
    right = 16,
    rowH = 30,
    top = 26;
  const height = top + groups.length * rowH + 44;
  const plotW = Math.max(120, width - left - right);
  const x = (s: number) => left + ((s - windowStart) / (spanEnd - windowStart)) * plotW;
  const hourStep = (spanEnd - windowStart) / 3600 > 14 ? 7200 : 3600;
  const ticks: number[] = [];
  for (let t = Math.ceil(windowStart / hourStep) * hourStep; t <= spanEnd; t += hourStep)
    ticks.push(t);
  const unused = Math.max(0, windowEnd - last) / 60;
  const summary = `${events.length} events from ${clock(windowStart / 60)}; the sequence ends ${clock(last / 60)}${
    last <= windowEnd ? `, ${fmt(Math.round(unused))} minutes of the window unused` : ", past the end of the window"
  }.`;
  return (
    <figure className="fn-timeline" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={summary}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top - 4} y2={height - 40} className="fn-grid" />
            <text x={x(t)} y={top - 10} textAnchor="middle">{clock(t / 60)}</text>
          </g>
        ))}
        {groups.map((g, i) => {
          const y = top + i * rowH;
          return (
            <g key={g}>
              <rect x={left} y={y + 4} width={plotW} height={rowH - 8} className="fn-timeline-lane" />
              <text x={0} y={y + rowH / 2 + 4} className="fn-timeline-label">{g}</text>
              {events
                .filter((e) => e.group === g)
                .map((e, j) => (
                  <g key={j}>
                    <rect x={x(e.prepare)} y={y + 6} width={Math.max(1, x(e.start) - x(e.prepare))} height={rowH - 12} className="fn-seg-prepare" />
                    <rect x={x(e.start)} y={y + 6} width={Math.max(1.5, x(e.end) - x(e.start))} height={rowH - 12} className="fn-seg-deliver" />
                    <rect x={x(e.end)} y={y + 6} width={Math.max(1, x(e.finish) - x(e.end))} height={rowH - 12} className="fn-seg-flush" />
                  </g>
                ))}
            </g>
          );
        })}
        <line x1={x(last)} x2={x(last)} y1={top - 4} y2={height - 40} className="fn-timeline-end" />
        <text x={x(last) + (x(last) > width - 220 ? -6 : 6)} y={height - 24} textAnchor={x(last) > width - 220 ? "end" : "start"} className="fn-timeline-note">
          Sequence ends {clock(last / 60)} · {fmt(Math.round((last - windowStart) / 60))} min
        </text>
        {last < windowEnd && x(windowEnd) - x(last) > 240 && (
          <text x={x(windowEnd)} y={height - 8} textAnchor="end" className="fn-timeline-note">
            {fmt(Math.round(unused))} min of the window unused
          </text>
        )}
      </svg>
    </figure>
  );
}

/** The first cycle, zoomed, with the prepare, deliver and flush phases of each group. */
export function CycleDetail({
  scope,
  calculation,
}: {
  scope: Scope;
  calculation: Calculation;
}) {
  const [ref, width] = useContainerWidth<HTMLDivElement>(900);
  const all = segments(scope, calculation);
  const groups = [...new Set(all.map((e) => e.group))];
  const cycle = all.slice(0, groups.length);
  if (!cycle.length) return null;
  const begin = Math.min(...cycle.map((e) => e.prepare)),
    finish = Math.max(...cycle.map((e) => e.finish));
  const left = 150,
    right = 16,
    rowH = 40,
    top = 30;
  const height = top + groups.length * rowH + 30;
  const plotW = Math.max(120, width - left - right);
  const x = (s: number) => left + ((s - begin) / Math.max(1, finish - begin)) * plotW;
  const span = finish - begin;
  const tickStep = span > 3600 ? 600 : span > 1200 ? 300 : 60;
  const ticks: number[] = [];
  for (let t = Math.ceil(begin / tickStep) * tickStep; t <= finish; t += tickStep) ticks.push(t);
  const dry = (group: string) => {
    const g = scope.groups.find((x) => x.label === group);
    if (!g) return null;
    const rows = calculation.schedule.intervals.filter((i) => g.valve_ids.includes(i.valve_id));
    const values = rows.map((r) => r.maximum_dry_min).filter(known);
    return values.length ? Math.max(...values) : null;
  };
  return (
    <figure className="fn-timeline fn-cycle" ref={ref}>
      <svg width={width} height={height} role="img" aria-label={`First cycle from ${clock(begin / 60)} to ${clock(finish / 60)}, prepare, deliver and flush phases per group.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top - 4} y2={height - 26} className="fn-grid" />
            <text x={x(t)} y={height - 10} textAnchor="middle">{clock(t / 60)}</text>
          </g>
        ))}
        {groups.map((g, i) => {
          const y = top + i * rowH;
          const e = cycle.find((c) => c.group === g);
          const interval = dry(g);
          const phases = e
            ? `${fmt(e.start - e.prepare)} s · ${fmt(e.end - e.start)} s · ${fmt(e.finish - e.end)} s`
            : "";
          return (
            <g key={g}>
              <rect x={left} y={y + 6} width={plotW} height={rowH - 12} className="fn-timeline-lane" />
              <text x={0} y={y + rowH / 2 - 2} className="fn-timeline-label">{g}</text>
              <text x={0} y={y + rowH / 2 + 12} className="fn-timeline-note">
                {known(interval) ? `Dry interval ${fmt(interval)} min` : "Dry interval not assessed"}
              </text>
              {e && (
                <>
                  <rect x={x(e.prepare)} y={y + 8} width={Math.max(1, x(e.start) - x(e.prepare))} height={rowH - 16} className="fn-seg-prepare" />
                  <rect x={x(e.start)} y={y + 8} width={Math.max(1.5, x(e.end) - x(e.start))} height={rowH - 16} className="fn-seg-deliver" />
                  <rect x={x(e.end)} y={y + 8} width={Math.max(1, x(e.finish) - x(e.end))} height={rowH - 16} className="fn-seg-flush" />
                  {i === 0 && (
                    <text x={x(e.prepare)} y={top - 10} className="fn-timeline-phase">
                      prepare · deliver · flush: {phases}
                    </text>
                  )}
                  {i > 0 && (
                    <text
                      x={x(e.finish) + 6 > width - 150 ? x(e.prepare) - 6 : x(e.finish) + 6}
                      y={y + rowH / 2 + 4}
                      textAnchor={x(e.finish) + 6 > width - 150 ? "end" : "start"}
                      className="fn-timeline-phase"
                    >
                      {phases}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export const timelineLegend = (
  <Legend
    items={[
      { swatch: "fn-swatch-prepare", label: "Prepare / transition" },
      { swatch: "fn-swatch-deliver", label: "Crop delivery" },
      { swatch: "fn-swatch-flush", label: "Flush" },
    ]}
  />
);

/* ---------- 06 · Storage balance ---------- */

export function StorageBalance({
  scope,
  calculation,
  scenario,
}: {
  scope: Scope;
  calculation: Calculation;
  scenario: Scenario;
}) {
  const source = scope.sources.find((s) => s.id === scenario.source_id);
  const usable = source?.usable_storage_m3 ?? null,
    reserve = scenario.reserve_m3,
    initial = scenario.initial_storage_m3;
  const minimum = value(calculation.storage.minimum_m3),
    final = value(calculation.storage.final_m3),
    overflow = value(calculation.storage.overflow_m3);
  const codes = new Set(calculation.findings.map(findingCode));
  const breached = codes.has("storage_shortage") || codes.has("storage_reserve");
  const spilled = codes.has("storage_overflow");
  const message = (code: string) =>
    calculation.findings.find((f) => findingCode(f) === code)?.message;
  const top = Math.max(usable ?? 0, initial ?? 0, final ?? 0, minimum ?? 0, 1);
  const step = niceStep(top, 4),
    axisMax = Math.ceil(top / step) * step;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / axisMax) * 100))}%`;
  const ticks = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step);
  const state: ReactNode = !known(minimum) ? (
    <Chip tone="unknown">Balance not assessed</Chip>
  ) : breached ? (
    <Chip tone="conflict" icon="conflict">Falls below the protected reserve</Chip>
  ) : spilled ? (
    <Chip tone="review">Spills above usable capacity</Chip>
  ) : (
    <Chip tone="success" icon="check">Stays above protected reserve</Chip>
  );
  return (
    <div className="fn-storage">
      <div className="fn-storage-head">
        <small>
          Pumping during preparation, crop delivery and flush
          {known(scenario.refill_m3h) ? ` · refill ${fmt(scenario.refill_m3h)} m³/h` : ""}
          {known(initial) ? ` · start ${fmt(initial)} m³` : ""}
        </small>
        {state}
      </div>
      <div className="fn-storage-gauge" aria-hidden="true">
        {known(reserve) && (
          <span className="fn-storage-reserve" style={{ width: pct(reserve) }} />
        )}
        {known(usable) && (
          <span className="fn-storage-capacity" style={{ left: pct(usable) }} />
        )}
        {known(minimum) && (
          <span className={`fn-storage-mark fn-storage-min${breached ? " fn-storage-mark-bad" : ""}`} style={{ left: pct(Math.max(0, minimum)) }} />
        )}
        {known(final) && (
          <span className="fn-storage-mark fn-storage-final" style={{ left: pct(Math.max(0, final)) }} />
        )}
        {known(initial) && (
          <span className="fn-storage-mark fn-storage-initial" style={{ left: pct(initial) }} />
        )}
      </div>
      <div className="fn-storage-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ left: pct(t) }}>{fmt(t)}{t === ticks.at(-1) ? " m³" : ""}</span>
        ))}
      </div>
      <dl className="fn-storage-figures">
        <div>
          <dt>Minimum inventory</dt>
          <dd>{known(minimum) ? `${fmt(minimum)} m³` : <Token>{calculation.storage.minimum_m3.reason || "Unknown"}</Token>}</dd>
        </div>
        <div>
          <dt>At last irrigation</dt>
          <dd>{known(final) ? `${fmt(final)} m³` : <Token>Unknown</Token>}</dd>
        </div>
        <div>
          <dt>Usable capacity</dt>
          <dd>{known(usable) ? `${fmt(usable)} m³` : <Token>Not recorded</Token>}</dd>
        </div>
        <div>
          <dt>Protected reserve</dt>
          <dd>{known(reserve) ? `${fmt(reserve)} m³` : <Token>Not recorded</Token>}</dd>
        </div>
        <div>
          <dt>Calculated overflow</dt>
          <dd>{known(overflow) ? `${fmt(overflow)} m³` : <Token>Unknown</Token>}</dd>
        </div>
      </dl>
      {(breached || spilled) && (
        <Hint>
          {message("storage_shortage") ?? message("storage_reserve") ?? message("storage_overflow")}
        </Hint>
      )}
    </div>
  );
}

/* ---------- 07 · Entered envelope against the required range ---------- */

export function EnvelopeBar({
  min,
  max,
  requiredMin,
  requiredMax,
  axisMax,
}: {
  min: number | null;
  max: number | null;
  requiredMin: number | null;
  requiredMax: number | null;
  axisMax: number;
}) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / axisMax) * 100))}%`;
  return (
    <div className="fn-envelope" aria-hidden="true">
      {known(requiredMin) && known(requiredMax) && (
        <span
          className="fn-envelope-required"
          style={{ left: pct(requiredMin), width: `calc(${pct(requiredMax)} - ${pct(requiredMin)})` }}
        />
      )}
      {known(min) && known(max) && max >= min ? (
        <span
          className="fn-envelope-entered"
          style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
        />
      ) : known(min) ? (
        <span className="fn-envelope-open" style={{ left: pct(min), width: `calc(100% - ${pct(min)})` }} />
      ) : null}
    </div>
  );
}

export function EnvelopeAxis({ axisMax, unit }: { axisMax: number; unit: string }) {
  const step = niceStep(axisMax, 6);
  const ticks = Array.from({ length: Math.floor(axisMax / step) + 1 }, (_, i) => i * step);
  return (
    <div className="fn-envelope-axis" aria-hidden="true">
      {ticks.map((t) => (
        <span key={t} style={{ left: `${(t / axisMax) * 100}%` }}>
          {fmt(t)}
          {t === ticks.at(-1) ? ` ${unit}` : ""}
        </span>
      ))}
    </div>
  );
}
