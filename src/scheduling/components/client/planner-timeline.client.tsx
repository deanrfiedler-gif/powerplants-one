"use client";
// The Day view as a 07:00 to 18:00 timeline, and the details panel a selected visit opens in.
// Built to the phase 00 refinement boards (Dean, 10 October 2026); see the planner design
// contract, docs/design/development/pages/route-schedule.md. Booking rules stay on the server:
// a drop only opens the existing Move or reassign form with a proposal.
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { FontAwesomeGlyph } from "../../../components/font-awesome";
import { formatCivilDay, formatRange, zoneDisplayName } from "../../../shell/date-format";
import { appointmentHref } from "../../navigation";
import {
  AXIS_END_MINUTE,
  AXIS_START_MINUTE,
  axisPercent,
  clockText,
  dayMinute,
  hoursText,
  initials,
  laneDay,
  minuteAtFraction,
  visitState,
} from "../../day-timeline";
import { extendedHours } from "../../working-hours";
import type { Resource, Schedule, ScheduleAppointment } from "./planner-screens.client";

// One identity colour per person, used for avatars only, never for status.
const identity = ["#e3ecf6", "#ece4f7", "#dff1ec", "#f6e8dc", "#e9eef3", "#f3e3ea"];
const hours = Array.from(
  { length: (AXIS_END_MINUTE - AXIS_START_MINUTE) / 60 + 1 },
  (_, i) => AXIS_START_MINUTE + i * 60,
);
const pct = (n: number) => `${n.toFixed(3)}%`;
const between = (a: number, b: number) => ({
  left: pct(axisPercent(a)),
  width: pct(axisPercent(b) - axisPercent(a)),
});
const packText: Record<string, string> = {
  PreparationRequired: "Preparation required",
  ReviewRequired: "Review required",
  CancellationReviewRequired: "Cancellation review required",
  AwaitingAcknowledgement: "Awaiting crew acknowledgement",
  Acknowledged: "Acknowledged",
};

function Glyph({ icon, path }: { icon: string; path: string }) {
  return (
    <FontAwesomeGlyph
      icon={icon}
      className="tl-glyph"
      fallback={
        <svg className="tl-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
    />
  );
}
const carPath = "M5 16h14M6 16l1.5-5h9L18 16M7 16v2M17 16v2M8 13h.01M16 13h.01";

export function PlannerTimeline({
  data,
  day,
  zone,
  usable,
  selected,
  now,
  onSelect,
  onDropAt,
  onDragNotice,
}: {
  data: Schedule;
  day: string;
  zone: string;
  usable: boolean;
  selected: string | null;
  now: string;
  onSelect: (a: ScheduleAppointment) => void;
  onDropAt: (a: ScheduleAppointment, startMinute: number, resource: Resource) => void;
  onDragNotice: (message: string) => void;
}) {
  // Where on the card the drag began, in minutes from the visit start.
  const grab = useRef(0);
  const nowAt = dayMinute(now, zone, day),
    nowMinute = nowAt >= 0 && nowAt < 1440 ? nowAt : null;
  const rows = data.resources
    .map((r, index) => {
      const lane = laneDay({
        calendar: r.calendar,
        blocks: r.blocks ?? [],
        exceptions: r.exceptions ?? [],
        busy: r.busy ?? [],
        day,
        zone,
        now,
      });
      const visits = data.items
        .filter((a) => a.assignments.some((x) => x.resource_id === r.id && x.active))
        .filter((a) => {
          const s = dayMinute(a.start_at, zone, day);
          return s >= 0 && s < 1440;
        })
        .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));
      return { r, lane, visits, colour: identity[index % identity.length], last: !r.active || lane.away };
    })
    // People who cannot be booked today (inactive, or away for the whole of standard hours) go last.
    .sort((a, b) => Number(a.last) - Number(b.last));
  return (
    <section className="planner-timeline" aria-label="Day resource planner">
      {!rows.length && (
        <p className="empty-state">No permitted resources in this filter. Availability is not assumed.</p>
      )}
      <div className="tl-scroll" role="region" aria-label="Day timeline, 07:00 to 18:00" tabIndex={0}>
        <div className="tl-grid">
          <div className="tl-corner">
            <span>
              {rows.length} {rows.length === 1 ? "person" : "people"}
            </span>
            <strong>{formatCivilDay(day, { weekday: true }).replace(/ \d{4}$/, "")}</strong>
          </div>
          <div className="tl-axis" aria-hidden="true">
            {hours.map((m) => (
              <span key={m} className={`tl-hour${m === AXIS_START_MINUTE ? " first" : m === AXIS_END_MINUTE ? " last" : ""}`} style={{ left: pct(axisPercent(m)) }}>
                {clockText(m)}
              </span>
            ))}
            {hours.slice(1, -2).map((m) => (
              <span key={`h${m}`} className="tl-half" style={{ left: pct(axisPercent(m + 30)) }}>
                {clockText(m + 30)}
              </span>
            ))}
            {nowMinute !== null && nowMinute >= AXIS_START_MINUTE && nowMinute <= AXIS_END_MINUTE && (
              <span className="tl-now-pill" style={{ left: pct(axisPercent(nowMinute)) }}>
                Now {clockText(nowMinute)}
              </span>
            )}
          </div>
          {rows.map(({ r, lane, visits, colour, last }) => {
            const total = `${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} h booked`;
            const off = !r.active ? "Inactive · cannot book" : lane.away ? lane.unavailable[0]?.label ?? "Calendar closed" : "";
            return (
              <Fragment key={r.id}>
                <div
                  className={`tl-person${last ? " off" : ""}`}
                  title={off || `${total} · ${lane.free}`}
                >
                  <span className="tl-av" style={{ background: colour }} aria-hidden="true">
                    {initials(r.name)}
                  </span>
                  <span className="tl-name">
                    <Link href={`/service/technicians/${r.id}`}>{r.name}</Link>
                  </span>
                  {!last && r.resource_type && <small className="tl-role">{r.resource_type}</small>}
                  <small className="tl-total">{off || (lane.capacityMinutes ? total : "Not working")}</small>
                  {!off && lane.free && <span className="sr-only">{lane.free}</span>}
                </div>
                <div
                  className={`tl-lane${last ? " off" : ""}`}
                  data-day={day}
                  aria-label={`${r.name} ${formatCivilDay(day, { weekday: true })}`}
                  onDragOver={(e) => {
                    if (usable && r.active) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain"),
                      a = data.items.find((x) => x.id === id);
                    if (!a || !usable) return;
                    const box = e.currentTarget.getBoundingClientRect();
                    onDropAt(a, minuteAtFraction((e.clientX - box.left) / box.width) - grab.current, r);
                  }}
                >
                  {lane.bands.map((b) => (
                    <div key={`${b.kind}${b.span[0]}`} className={`tl-band ${b.kind === "Extended" ? "ext" : "off"}`} style={between(b.span[0], b.span[1])}>
                      {b.span[1] - b.span[0] >= 45 && (
                        <span>{b.kind === "Extended" ? "Extended hours" : "Not working"}</span>
                      )}
                    </div>
                  ))}
                  {nowMinute !== null && nowMinute > AXIS_START_MINUTE && (
                    <div className="tl-past" style={between(AXIS_START_MINUTE, nowMinute)} />
                  )}
                  {lane.reserved.map((s) => (
                    <div key={`r${s[0]}`} className="tl-reserved" style={between(s[0], s[1])} title={`Reserved ${clockText(Math.max(s[0], 0))}–${clockText(Math.min(s[1], 1439))} · includes travel`} />
                  ))}
                  {lane.closed.map((s) => (
                    <div key={`c${s[0]}`} className="tl-block closed" style={between(s[0], s[1])}>
                      <b>Calendar closed</b>
                    </div>
                  ))}
                  {lane.unavailable.map((b) => (
                    <div key={`b${b.span[0]}${b.label}`} className="tl-block" style={between(b.span[0], b.span[1])}>
                      <b>{b.label}</b> · {b.time}
                    </div>
                  ))}
                  {visits.map((a) => (
                    <Visit
                      key={a.id}
                      a={a}
                      r={r}
                      day={day}
                      zone={zone}
                      selected={selected === a.id}
                      draggable={usable && a.actions.can_manage && a.status === "Confirmed"}
                      onSelect={onSelect}
                      onDragStart={(e) => {
                        const box = e.currentTarget.getBoundingClientRect(),
                          laneBox = (e.currentTarget.closest(".tl-lane") as HTMLElement).getBoundingClientRect();
                        grab.current =
                          minuteAtFraction((e.clientX - laneBox.left) / laneBox.width) -
                          minuteAtFraction((box.left - laneBox.left) / laneBox.width);
                        e.dataTransfer.setData("text/plain", a.id);
                        onDragNotice("Dragging proposes a move. The original booking remains saved.");
                      }}
                    />
                  ))}
                  {nowMinute !== null && nowMinute >= AXIS_START_MINUTE && nowMinute <= AXIS_END_MINUTE && (
                    <div className="tl-now" style={{ left: pct(axisPercent(nowMinute)) }} aria-hidden="true" />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
      <p className="tl-note">
        Times in {zoneDisplayName(zone, data.observed_at)}. Standard hours are 08:00 to 17:00; shaded hours at either end are extended hours or not working.
      </p>
    </section>
  );
}

function Visit({
  a,
  r,
  day,
  zone,
  selected,
  draggable,
  onSelect,
  onDragStart,
}: {
  a: ScheduleAppointment;
  r: Resource;
  day: string;
  zone: string;
  selected: boolean;
  draggable: boolean;
  onSelect: (a: ScheduleAppointment) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const me = a.assignments.find((x) => x.resource_id === r.id && x.active)!,
    state = visitState(a),
    confirmed = a.status === "Confirmed",
    tb = confirmed ? me.travel_before_minutes : 0,
    ta = confirmed ? me.travel_after_minutes : 0,
    s = dayMinute(a.start_at, zone, day),
    f = dayMinute(a.end_at, zone, day);
  // The group spans the visit and this person's travel, clamped to the axis. Inside it the
  // strips and the card join with no gap; the group keeps a gap to its neighbours.
  const clamp = (m: number) => Math.min(Math.max(m, AXIS_START_MINUTE), AXIS_END_MINUTE),
    g0 = clamp(s - tb),
    g1 = clamp(f + ta),
    span = Math.max(g1 - g0, 1),
    inner = (x: number, y: number) => ({ left: pct((100 * (clamp(x) - g0)) / span), width: pct((100 * (clamp(y) - clamp(x))) / span) });
  const crew = a.assignments.filter((x) => x.active);
  const extended = confirmed ? extendedHours(a.start_at, a.end_at, { timezone: r.calendar.timezone, travel_before_minutes: me.travel_before_minutes, travel_after_minutes: me.travel_after_minutes }) : null;
  const time = `${clockText(((s % 1440) + 1440) % 1440)}–${clockText(((f % 1440) + 1440) % 1440)}`;
  const tip = [
    a.scope_summary,
    a.site_name,
    state.long,
    tb || ta ? `travel ${tb} min before, ${ta} min after` : "",
    extended ? "runs into extended hours" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const cls = state.kind === "attention" ? " held" : state.kind === "proposed" ? " prop" : "";
  return (
    <div
      className="tl-group"
      style={{ "--l": `calc(${pct(axisPercent(g0))} + 2px)`, "--w": `calc(${pct(axisPercent(g1) - axisPercent(g0))} - 4px)` } as React.CSSProperties}
    >
      {tb > 0 && s - tb < AXIS_END_MINUTE && (
        <div className={`tl-travel l${cls}${selected ? " sel" : ""}`} style={inner(s - tb, s)} title={`Travel ${tb} min`}>
          <Glyph icon="car-side" path={carPath} />
          <span>{tb}m</span>
        </div>
      )}
      <div
        className={`tl-card${cls}${selected ? " sel" : ""}${tb ? " tl" : ""}${ta ? " tr" : ""}`}
        style={inner(s, f)}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${a.display_number}, ${a.scope_summary}, ${time}, ${state.long}${extended ? ", extended hours" : ""}`}
        title={tip}
        draggable={draggable}
        onDragStart={draggable ? onDragStart : undefined}
        onClick={() => onSelect(a)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(a);
          }
        }}
      >
        <span className="t">{a.scope_summary}</span>
        <span className="m when">{time}</span>
        <span className="m">{a.site_name}</span>
        {crew.length > 1 && (
          <span className="tl-crew" aria-hidden="true">
            {crew.map((x) => (
              <span key={x.resource_id} title={x.name}>
                {initials(x.name)}
              </span>
            ))}
          </span>
        )}
      </div>
      {ta > 0 && f + ta > AXIS_START_MINUTE && (
        <div className={`tl-travel r${cls}${selected ? " sel" : ""}`} style={inner(f, f + ta)} title={`Travel ${ta} min`}>
          <Glyph icon="car-side" path={carPath} />
          <span>{ta}m</span>
        </div>
      )}
    </div>
  );
}

// The details panel a selected visit opens in, in the live Deals snapshot's layout. The
// planner narrows beside it, so no booking is hidden behind it.
export function AppointmentSnapshot({
  a,
  zone,
  returnTo,
  onClose,
  onMove,
}: {
  a: ScheduleAppointment;
  zone: string;
  returnTo: string;
  onClose: () => void;
  onMove?: (a: ScheduleAppointment) => void;
}) {
  const state = visitState(a),
    crew = a.assignments.filter((x) => x.active),
    minutes = Math.round((Date.parse(a.end_at) - Date.parse(a.start_at)) / 60000);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    heading.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <aside
      className="tl-snapshot"
      aria-label={`Visit details: ${a.display_number}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <header>
        <h2 ref={heading} tabIndex={-1}>
          {a.scope_summary}
        </h2>
        <button type="button" className="tl-close" aria-label="Close visit details" onClick={onClose}>
          <Glyph icon="xmark" path="M6 6l12 12M18 6L6 18" />
        </button>
      </header>
      <div className="tl-snap-meta">
        <Link href={`/service/work-orders/${a.work_order_id}`}>{a.work_order_display_number}</Link>
        <span className={`tl-pill ${state.kind}`}>{state.long}</span>
      </div>
      <section aria-label="Visit">
        <h3>Visit</h3>
        <dl>
          <dt>When</dt>
          <dd>
            {formatRange(a.start_at, a.end_at, zone)} · {hoursText(minutes)} h
          </dd>
          <dt>Site</dt>
          <dd>{a.site_name}</dd>
          <dt>Appointment</dt>
          <dd>
            {a.display_number} · v{a.version}
          </dd>
        </dl>
      </section>
      <section aria-label="Crew">
        <h3>Crew</h3>
        {crew.length ? (
          <ul className="tl-snap-crew">
            {crew.map((x) => (
              <li key={x.resource_id}>
                <span className="tl-av" aria-hidden="true">
                  {initials(x.name)}
                </span>
                <span>
                  <b>{x.name}</b>
                  <small>
                    {x.crew_role} · travel {x.travel_before_minutes} / {x.travel_after_minutes} min
                  </small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No crew reserved.</p>
        )}
      </section>
      <section aria-label="Readiness">
        <h3>Readiness</h3>
        <dl>
          <dt>Customer contact</dt>
          <dd>{a.customer_commitment === "Confirmed" ? "Confirmed" : `Not confirmed (${a.customer_commitment})`}</dd>
          <dt>Job pack</dt>
          <dd>{packText[a.pack_requirement] ?? a.pack_requirement}</dd>
          {a.scope_review_required && (
            <>
              <dt>Scope</dt>
              <dd>Review required</dd>
            </>
          )}
          {a.policy_impacts?.some((x) => x.held) && (
            <>
              <dt>Policy</dt>
              <dd>Scheduling policy hold</dd>
            </>
          )}
          <dt>Dispatch</dt>
          <dd>{a.dispatch_hold ? "Held until the crew starts" : "Not held"}</dd>
        </dl>
      </section>
      <footer>
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
        {onMove && a.actions.can_manage && a.status === "Confirmed" && (
          <button type="button" className="secondary" onClick={() => onMove(a)}>
            Move or reassign
          </button>
        )}
        <Link className="button" href={appointmentHref(a.id, returnTo)}>
          Open appointment
        </Link>
      </footer>
    </aside>
  );
}
