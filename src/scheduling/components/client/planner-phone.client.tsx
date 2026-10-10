"use client";
// The planner on a phone (below 781 px), built to the phase 00 refinement board (Dean,
// 10 October 2026). Day: day chips, then one card per person with a 07:00 to 18:00 strip and
// their visits. Week: one section per day. A visit opens the shared details panel, which a
// phone shows as a bottom sheet. Booking rules stay on the server.
import Link from "next/link";
import { FontAwesomeGlyph } from "../../../components/font-awesome";
import { formatCivilDay } from "../../../shell/date-format";
import {
  AXIS_END_MINUTE,
  AXIS_START_MINUTE,
  axisPercent,
  clockText,
  dayMinute,
  hoursText,
  initials,
  laneDay,
  visitState,
} from "../../day-timeline";
import { extendedHours } from "../../working-hours";
import type { Resource, Schedule, ScheduleAppointment } from "./planner-screens.client";

const identity = ["#e3ecf6", "#ece4f7", "#dff1ec", "#f6e8dc", "#e9eef3", "#f3e3ea"];
const pct = (n: number) => `${n.toFixed(3)}%`;
const between = (a: number, b: number) => ({ left: pct(axisPercent(a)), width: pct(axisPercent(b) - axisPercent(a)) });
const isWeekend = (day: string) => [0, 6].includes(new Date(day + "T12:00:00Z").getUTCDay());
const shortDay = (day: string) => formatCivilDay(day, { weekday: true }).replace(/ \w+ \d{4}$/, "");
const clockGlyph = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2";

function onDay(a: ScheduleAppointment, zone: string, day: string) {
  const s = dayMinute(a.start_at, zone, day);
  return s >= 0 && s < 1440;
}

function PhoneCard({
  a,
  zone,
  day,
  person,
  everyone,
  selected,
  onSelect,
}: {
  a: ScheduleAppointment;
  zone: string;
  day: string;
  person?: Resource;
  everyone: boolean;
  selected: boolean;
  onSelect: (a: ScheduleAppointment) => void;
}) {
  const state = visitState(a),
    crew = a.assignments.filter((x) => x.active),
    s = dayMinute(a.start_at, zone, day),
    f = dayMinute(a.end_at, zone, day),
    time = `${clockText(s)}–${clockText(((f % 1440) + 1440) % 1440)}`;
  // Extended hours for this person's day, or for any of the crew in the week list.
  const ext =
    a.status === "Confirmed" &&
    crew.some((x) => {
      if (person && x.resource_id !== person.id) return false;
      return !!extendedHours(a.start_at, a.end_at, {
        timezone: person?.calendar.timezone ?? a.site_timezone,
        travel_before_minutes: x.travel_before_minutes,
        travel_after_minutes: x.travel_after_minutes,
      });
    });
  return (
    <div
      className={`pq-card${state.kind === "attention" ? " held" : state.kind === "proposed" ? " prop" : ""}${selected ? " sel" : ""}`}
      role="button"
      tabIndex={0}
      data-appointment={a.id}
      data-status={a.status}
      aria-pressed={selected}
      aria-label={`${a.display_number}, ${a.scope_summary}, ${time}, ${state.long}${ext ? ", extended hours" : ""}`}
      onClick={() => onSelect(a)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(a);
        }
      }}
    >
      <span className="r1">
        <b>{time}</b>
        {ext && (
          <span className="wk-ext" title="Runs into extended hours (outside 08:00–17:00)">
            <FontAwesomeGlyph
              icon="clock"
              className="tl-glyph"
              fallback={
                <svg className="tl-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d={clockGlyph} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              }
            />
          </span>
        )}
        {(everyone || crew.length > 1) && crew.length > 0 && (
          <span className="tl-crew" aria-hidden="true">
            {crew.map((x) => (
              <span key={x.resource_id} title={x.name}>
                {initials(x.name)}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="t">{a.scope_summary}</span>
      <span className="m">{a.site_name}</span>
    </div>
  );
}

export function PlannerPhone({
  data,
  mode,
  day,
  days,
  zone,
  selected,
  now,
  onSelect,
  onOpenDay,
}: {
  data: Schedule;
  mode: "day" | "week";
  day: string;
  days: string[];
  zone: string;
  selected: string | null;
  now: string;
  onSelect: (a: ScheduleAppointment) => void;
  onOpenDay: (day: string) => void;
}) {
  const live = data.items.filter((a) => a.status !== "Cancelled");
  const proposed = live.filter((a) => a.status === "Proposed").length,
    attention = live.filter((a) => visitState(a).kind === "attention").length;
  const todayIs = (d: string) => {
    const m = dayMinute(now, zone, d);
    return m >= 0 && m < 1440;
  };
  const people = (d: string) =>
    data.resources
      .map((r, index) => {
        const lane = laneDay({ calendar: r.calendar, blocks: r.blocks ?? [], exceptions: r.exceptions ?? [], busy: r.busy ?? [], day: d, zone, now });
        const visits = live
          .filter((a) => a.assignments.some((x) => x.resource_id === r.id && x.active) && onDay(a, zone, d))
          .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));
        return { r, lane, visits, colour: identity[index % identity.length], off: !r.active || (lane.away && !visits.length) };
      })
      .sort((a, b) => Number(a.off) - Number(b.off));
  const total = (d: string) =>
    people(d)
      .filter((x) => x.r.active)
      .reduce((a, x) => [a[0] + x.lane.bookedMinutes, a[1] + x.lane.capacityMinutes], [0, 0]);
  return (
    <section className="planner-phone" aria-label={mode === "week" ? "Week resource planner" : "Day resource planner"}>
      {mode === "day" && (
        <div className="pq-chips" role="group" aria-label="Days this week">
          {days
            .filter((d) => !isWeekend(d) || live.some((a) => onDay(a, zone, d)))
            .map((d) => {
              const n = live.filter((a) => onDay(a, zone, d)).length;
              return (
                <button key={d} type="button" className="pq-chip" aria-pressed={d === day} onClick={() => onOpenDay(d)}>
                  {shortDay(d)} ({n})
                </button>
              );
            })}
        </div>
      )}
      {(proposed > 0 || attention > 0) && (
        <a className="pq-attn" href="#planner-proposals">
          <span>
            {proposed > 0 && <b>{proposed} proposed</b>}
            {proposed > 0 && attention > 0 && " · "}
            {attention > 0 && `${attention} need${attention === 1 ? "s" : ""} attention`}
          </span>
          <span aria-hidden="true">›</span>
        </a>
      )}
      {mode === "day"
        ? people(day).map(({ r, lane, visits, colour, off }) => {
            const tip = lane.capacityMinutes ? `${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} h booked · ${lane.free}` : "Not working";
            const nowMinute = todayIs(day) ? dayMinute(now, zone, day) : null;
            return (
              <section key={r.id} className={`pq-person${off ? " off" : ""}`} aria-label={`${r.name} on ${formatCivilDay(day, { weekday: true })}`}>
                <header>
                  <span className="tl-av" style={{ background: colour }} aria-hidden="true">
                    {initials(r.name)}
                  </span>
                  <Link href={`/service/technicians/${r.id}`}>{r.name}</Link>
                  <small>
                    {!r.active
                      ? "Inactive · cannot book"
                      : off
                        ? lane.unavailable[0]?.label ?? "Calendar closed"
                        : lane.capacityMinutes
                          ? `${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} h booked`
                          : "Not working"}
                  </small>
                </header>
                {!off && (
                  <>
                    <div className="pq-strip" title={tip} role="img" aria-label={`${r.name}: ${tip}`}>
                      {lane.bands.map((b) => (
                        <i key={`${b.kind}${b.span[0]}`} className={`b ${b.kind === "Extended" ? "ext" : "off"}`} style={between(b.span[0], b.span[1])} />
                      ))}
                      {lane.unavailable.map((b) => (
                        <i key={`u${b.span[0]}`} className="b blk" style={between(b.span[0], b.span[1])} />
                      ))}
                      {visits.map((a) => {
                        const me = a.assignments.find((x) => x.resource_id === r.id && x.active)!,
                          confirmed = a.status === "Confirmed",
                          s = dayMinute(a.start_at, zone, day),
                          f = dayMinute(a.end_at, zone, day),
                          k = visitState(a).kind;
                        return (
                          <span key={a.id}>
                            {confirmed && me.travel_before_minutes > 0 && <i className="v trv" style={between(s - me.travel_before_minutes, s)} />}
                            <i className={`v ${k === "attention" ? "held" : k === "proposed" ? "prop" : "ok"}`} style={between(s, f)} />
                            {confirmed && me.travel_after_minutes > 0 && <i className="v trv" style={between(f, f + me.travel_after_minutes)} />}
                          </span>
                        );
                      })}
                      {nowMinute !== null && nowMinute > AXIS_START_MINUTE && nowMinute < AXIS_END_MINUTE && (
                        <i className="now" style={{ left: pct(axisPercent(nowMinute)) }} />
                      )}
                    </div>
                    <div className="pq-axis" aria-hidden="true">
                      <span>07:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                    </div>
                    {visits.map((a) => (
                      <PhoneCard key={a.id} a={a} zone={zone} day={day} person={r} everyone={false} selected={selected === a.id} onSelect={onSelect} />
                    ))}
                    {!visits.length && <p className="pq-none">No visits on this day</p>}
                  </>
                )}
              </section>
            );
          })
        : days.map((d) => {
            const visits = live.filter((a) => onDay(a, zone, d)).sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at)),
              [b, c] = total(d);
            return (
              <section key={d} className={`pq-day${!visits.length && isWeekend(d) ? " quiet" : ""}`} data-day={d} aria-label={formatCivilDay(d, { weekday: true })}>
                <button type="button" className="pq-day-head" onClick={() => onOpenDay(d)} aria-label={`Open ${formatCivilDay(d, { weekday: true })} in Day view`}>
                  <b>
                    {formatCivilDay(d, { weekday: true }).replace(/ \d{4}$/, "")}
                    {todayIs(d) && <span className="wk-today">Today</span>}
                  </b>
                  <small>{c ? `${hoursText(b)} of ${hoursText(c)} h booked` : "No work booked"}</small>
                </button>
                {visits.map((a) => (
                  <PhoneCard key={a.id} a={a} zone={zone} day={d} everyone selected={selected === a.id} onSelect={onSelect} />
                ))}
                {!visits.length && !isWeekend(d) && <p className="pq-none">No visits</p>}
              </section>
            );
          })}
    </section>
  );
}
