"use client";
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "../../../components/ui/button";
import { ProductIcon } from "../../../components/product-icons";
import { Stamp } from "../../../components/business-ui";
import {
  competenceState,
  type ResourceEvidence,
  type ResourceWorkspace,
} from "../../workspace-model";
import {
  dayMinute,
  hoursText,
  subtractSpans,
  type Span,
} from "../../day-timeline";
import {
  personDay,
  personVisits,
  shortDay,
  timeText,
} from "../../field-team-model";
import { currentCrew, preparationReasons } from "../../field-technicians-view";
import { addDays, localDateTime } from "../../time";
import { extendedHours } from "../../working-hours";

export function TeamDate({
  value,
  timezone,
}: {
  value: string;
  timezone: string;
}) {
  if (!Number.isFinite(Date.parse(value))) return <>Unknown</>;
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: timezone,
      }).format(new Date(value))}
    </time>
  );
}
export function TeamAvatar({
  name,
  away = false,
}: {
  name: string;
  away?: boolean;
}) {
  return (
    <span
      className="pl02-avatar"
      data-away={away || undefined}
      aria-hidden="true"
    >
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </span>
  );
}
export function TeamDialog({
  title,
  subtitle,
  children,
  footer,
  onClose,
  snapshot = false,
  navigation,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  snapshot?: boolean;
  navigation?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current,
      opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`pl02-dialog${snapshot ? " pl02-snapshot" : ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Button variant="quiet" aria-label={`Close ${title}`} onClick={onClose}>
          <ProductIcon name="close" />
        </Button>
        {navigation}
      </header>
      <div className="pl02-dialog-body">{children}</div>
      <footer>{footer ?? <Button onClick={onClose}>Close</Button>}</footer>
    </dialog>
  );
}
export function TeamFields({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="pl02-fields">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function SkillState({
  skill,
  from,
  to,
}: {
  skill: ResourceEvidence["skills"][number];
  from: string;
  to: string;
}) {
  const state = competenceState(skill, from, to);
  return (
    <span
      className="pl02-skill-state"
      data-tone={
        state === "Expired"
          ? "danger"
          : state === "Verified for selected period"
            ? "success"
            : "warning"
      }
    >
      <ProductIcon
        name={state === "Verified for selected period" ? "check" : "info"}
      />
      {state}
    </span>
  );
}
export function SkillEvidence({
  skill,
  data,
  zone,
  close,
}: {
  skill: ResourceEvidence["skills"][number];
  data: ResourceWorkspace;
  zone: string;
  close: () => void;
}) {
  return (
    <TeamDialog
      title={`${skill.skill_code} · competence evidence`}
      subtitle={`${data.resource.name} · resource v${data.resource.version}`}
      onClose={close}
    >
      <div className="pl02-notice">
        <SkillState skill={skill} from={data.from} to={data.to} />
        <p>
          Valid to <Stamp value={skill.valid_to} timezone={zone} />. Review the
          evidence for the selected period; this page does not authorise a
          booking.
        </p>
      </div>
      <h3 className="pl02-section-label">Source record</h3>
      <TeamFields
        items={[
          ["Skill", skill.skill_code],
          ["Source status", `${skill.status} · v${skill.version}`],
          ["Active", skill.active ? "Yes" : "No"],
          [
            "Valid from",
            <Stamp key="from" value={skill.valid_from} timezone={zone} />,
          ],
          [
            "Valid to",
            <Stamp key="to" value={skill.valid_to} timezone={zone} />,
          ],
          [
            "Source as at",
            <Stamp key="source" value={skill.source_as_at} timezone={zone} />,
          ],
        ]}
      />
      <h3 className="pl02-section-label">Review evidence</h3>
      <TeamFields
        items={[
          [
            "Reviewed",
            <Stamp key="reviewed" value={skill.reviewed_at} timezone={zone} />,
          ],
        ]}
      />
      {[
        ["Source record ID", skill.id],
        ["Evidence reference", skill.evidence_ref],
        ["Reviewer ID", skill.reviewer_id],
        ["Content hash", skill.content_hash],
      ].map(([label, value]) => (
        <p className="pl02-code" key={label}>
          <span>{label}</span>
          <code>{value || "Unknown"}</code>
        </p>
      ))}
      <p className="pl02-notice neutral">
        Certificate and renewal evidence: Unknown. Synthetic skill evidence is
        not statutory certification. Read-only: this panel never edits the skill
        record.
      </p>
    </TeamDialog>
  );
}
export function Competence({
  data,
  zone,
  review,
}: {
  data: ResourceWorkspace;
  zone: string;
  review: (id: string) => void;
}) {
  const skills = data.resource.skills;
  return (
    <section
      className="pl02-card pl02-competence"
      aria-label="Competence and evidence"
    >
      <header>
        <h2>Competence and evidence</h2>
      </header>
      <p className="pl02-card-note">
        Validity is evaluated for the selected seven-day period. Synthetic skill
        evidence is not statutory certification. Certificate and renewal
        evidence: Unknown.
      </p>
      <div className="pl02-skill-labels">
        <span>Skill</span>
        <span>For this period</span>
        <span>Validity and evidence</span>
      </div>
      {skills.map((s) => (
        <div className="pl02-skill" key={s.id}>
          <div className="pl02-skill-code">
            <strong>{s.skill_code}</strong>
            <small>
              Source: {s.status} · v{s.version}
            </small>
          </div>
          <div className="pl02-skill-period">
            <SkillState skill={s} from={data.from} to={data.to} />
            <small>
              {competenceState(s, data.from, data.to) ===
              "Verified for selected period" ? (
                "Valid for all seven days"
              ) : (
                <>
                  Valid to <TeamDate value={s.valid_to} timezone={zone} />
                </>
              )}
            </small>
          </div>
          <div className="pl02-skill-valid">
            <span>
              <TeamDate value={s.valid_from} timezone={zone} /> –{" "}
              <TeamDate value={s.valid_to} timezone={zone} />
            </span>
            <small>
              {s.reviewed_at ? (
                <>
                  Reviewed <Stamp value={s.reviewed_at} timezone={zone} />
                </>
              ) : (
                "Evidence: Unknown"
              )}
            </small>
          </div>
          <Button
            variant="quiet"
            aria-label={`Review evidence for ${s.skill_code}`}
            onClick={() => review(s.id)}
          >
            Review<span className="pl02-desktop"> evidence</span>
          </Button>
        </div>
      ))}
      {!skills.length && (
        <p className="pl02-card-note">
          No competence evidence returned. Eligibility is unknown.
        </p>
      )}
    </section>
  );
}
export function TeamSites({ data }: { data: ResourceWorkspace }) {
  return (
    <section className="pl02-sites">
      <h2>Permitted sites · {data.sites.length}</h2>
      <p>
        Site eligibility alone does not establish availability or competence for
        a particular work scope.
      </p>
      {data.sites.map((s) => (
        <Link key={s.id} href={`/sites/${s.id}`}>
          <ProductIcon name="sites" />
          <span>{s.display_name}</span>
          <small>{s.timezone}</small>
        </Link>
      ))}
      {!data.sites.length && <p>No permitted sites returned.</p>}
    </section>
  );
}
export function UpcomingVisits({
  data,
  zone,
}: {
  data: ResourceWorkspace;
  zone: string;
}) {
  return (
    <section className="pl02-card pl02-upcoming" aria-label="Upcoming visits">
      <header>
        <h2>Upcoming visits</h2>
        <span>{data.appointments.length} in this window</span>
      </header>
      <p className="pl02-card-note">
        Permitted appointments in this window. Open one for its commitments and
        immutable booking history.
      </p>
      {data.appointments.map((a) => (
        <Link
          className="pl02-visit"
          key={a.id}
          href={`/service/appointments/${a.id}`}
        >
          <span className="pl02-visit-time">
            <strong>
              {shortDay(localDateTime(a.start_at, zone).slice(0, 10))}
            </strong>
            <small>
              {timeText(a.start_at, zone)}–{timeText(a.end_at, zone)}
            </small>
          </span>
          <span className="pl02-visit-title">
            {a.scope_summary}
            <small>
              {a.display_number} · {a.work_order_display_number} · {a.site_name}{" "}
              · {a.site_timezone}
            </small>
          </span>
          <span className="pl02-tag">{a.status}</span>
          <ProductIcon name="expand" />
        </Link>
      ))}
      {!data.appointments.length && (
        <p className="pl02-card-note">
          No permitted current assignments in this period.
        </p>
      )}
      <p className="pl02-card-note">
        Busy reservations include explicit travel. Busy times can include
        bookings whose details are outside your access. Resource publication
        history beyond the returned bundle is not supplied.
      </p>
    </section>
  );
}

// SVG positions represent time data, not an exported Figma asset or fixed page layout.
// Colours use the page-scoped accepted planner palette. Anonymous intervals never receive a visit label or link.
function DayTrack({
  data,
  day,
  zone,
}: {
  data: ResourceWorkspace;
  day: string;
  zone: string;
}) {
  const r = data.resource,
    lane = personDay(r, day, zone),
    clip = useId().replaceAll(":", "");
  const visits = personVisits(data.appointments, r.id)
    .filter((a) => a.status !== "Cancelled")
    .flatMap((a) => {
      const member = currentCrew(a).find((x) => x.resource_id === r.id)!;
      const start = dayMinute(a.start_at, zone, day),
        end = dayMinute(a.end_at, zone, day);
      const span: Span = [
        start - member.travel_before_minutes,
        end + member.travel_after_minutes,
      ];
      return span[1] > 420 && span[0] < 1080
        ? [{ a, start, end, span, member }]
        : [];
    });
  const known = visits
    .filter((v) => v.a.status !== "Proposed")
    .map((v) => v.span);
  const anon = subtractSpans(lane.reserved, known);
  const x = (m: number) => Math.max(0, Math.min(660, m - 420));
  const rect = (
    span: Span,
    className: string,
    key: string,
    y = 0,
    height = 32,
  ) => (
    <rect
      key={key}
      className={className}
      x={x(span[0])}
      y={y}
      width={Math.max(0, x(span[1]) - x(span[0]))}
      height={height}
    />
  );
  const today = localDateTime(data.observed_at, zone).slice(0, 10) === day;
  const now = dayMinute(data.observed_at, zone, day);
  return (
    <svg
      className="pl02-track"
      viewBox="0 0 660 32"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${shortDay(day)} availability; ${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} hours booked. Visit details follow below.`}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="660" height="32" rx="3" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect className="pl02-track-base" width="660" height="32" />
        {lane.bands.map((b, i) =>
          rect(
            b.span,
            b.kind === "Extended" ? "pl02-band-extended" : "pl02-band-closed",
            `band${i}`,
          ),
        )}
        {Array.from({ length: 10 }, (_, i) => (
          <line
            className="pl02-hour-line"
            key={i}
            x1={(i + 1) * 60}
            x2={(i + 1) * 60}
            y1="0"
            y2="32"
          />
        ))}
        {lane.unavailable.map((b, i) =>
          rect(b.span, "pl02-band-away", `away${i}`),
        )}
        {lane.closed.map((b, i) => rect(b, "pl02-band-closed", `closed${i}`))}
        {anon.map((b, i) => rect(b, "pl02-band-busy", `busy${i}`, 4, 24))}
        {visits.map((v) => (
          <g
            key={v.a.id}
            className={`pl02-segment ${v.a.status === "Proposed" ? "proposed" : preparationReasons(v.a).length ? "attention" : "confirmed"}`}
          >
            <title>{`${timeText(v.a.start_at, zone)}–${timeText(v.a.end_at, zone)} · ${v.a.scope_summary} · ${v.a.status}; travel ${v.member.travel_before_minutes} minutes before and ${v.member.travel_after_minutes} minutes after`}</title>
            {rect(v.span, "pl02-visit-fill", "reservation", 4, 24)}
            {rect([v.span[0], v.start], "pl02-travel-fill", "before", 4, 24)}
            {rect([v.end, v.span[1]], "pl02-travel-fill", "after", 4, 24)}
            <rect
              className="pl02-visit-border"
              x={x(v.span[0])}
              y="4"
              width={Math.max(0, x(v.span[1]) - x(v.span[0]))}
              height="24"
              rx="3"
            />
            <svg
              x={x(v.start) + 7}
              y="7"
              width={Math.max(0, x(v.end) - x(v.start) - 14)}
              height="19"
            >
              <text x="0" y="13">
                {timeText(v.a.start_at, zone)}–{timeText(v.a.end_at, zone)} ·{" "}
                {v.a.scope_summary}
              </text>
            </svg>
          </g>
        ))}
        {(!lane.working.length || lane.away) && (
          <text className="pl02-track-label" x="8" y="20">
            {lane.away
              ? `${lane.unavailable[0]?.label ?? "Unavailable"} · all day · not bookable`
              : "No published hours"}
          </text>
        )}
        {today && now >= 420 && now <= 1080 && (
          <line className="pl02-now" x1={x(now)} x2={x(now)} y1="0" y2="32">
            <title>Read time: {timeText(data.observed_at, zone)}</title>
          </line>
        )}
      </g>
    </svg>
  );
}
export function Availability({
  data,
  day,
  zone,
}: {
  data: ResourceWorkspace;
  day: string;
  zone: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(day, i)),
    r = data.resource;
  const lanes = days.map((d) => personDay(r, d, zone));
  const booked = lanes.reduce((a, b) => a + b.bookedMinutes, 0),
    capacity = lanes.reduce((a, b) => a + b.capacityMinutes, 0);
  return (
    <section
      className="pl02-card pl02-availability"
      aria-label="Seven-day availability"
    >
      <header>
        <h2>Seven-day availability</h2>
        <span>
          {hoursText(booked)} of {hoursText(capacity)} h booked
        </span>
      </header>
      <p className="pl02-phone pl02-card-note">
        Shaded: extended hours, outside 08:00–17:00
      </p>
      <div className="pl02-legend">
        {[
          "Standard hours",
          "Extended hours",
          "Visit",
          "Travel",
          "Proposed",
          "Away",
          "No published hours",
          "Busy",
        ].map((s, i) => (
          <span key={s}>
            <i className={`pl02-swatch swatch-${i}`} />
            {s}
          </span>
        ))}
      </div>
      <div className="pl02-axis">
        <span />
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i}>{String(i + 7).padStart(2, "0")}:00</span>
        ))}
      </div>
      {days.map((d, i) => {
        const lane = lanes[i],
          extended = personVisits(data.appointments, r.id, d, zone).filter(
            (a) => {
              const m = currentCrew(a).find((x) => x.resource_id === r.id)!;
              return extendedHours(a.start_at, a.end_at, {
                ...m,
                timezone: r.calendar.timezone,
              });
            },
          );
        return (
          <div className="pl02-day" key={d}>
            <div className="pl02-day-label">
              <strong>
                {shortDay(d)}{" "}
                {localDateTime(data.observed_at, zone).slice(0, 10) === d && (
                  <span className="pl02-tag">Today</span>
                )}
              </strong>
              <small>
                {lane.away
                  ? `${lane.unavailable[0]?.label ?? "Unavailable"} · all day`
                  : !lane.working.length
                    ? "No published hours"
                    : `${hoursText(lane.bookedMinutes)} of ${hoursText(lane.capacityMinutes)} h booked`}
              </small>
              {extended.length > 0 && (
                <small className="pl02-warning">
                  Outside standard hours · {extended.length} visit
                  {extended.length === 1 ? "" : "s"}
                </small>
              )}
            </div>
            <div className="pl02-track-wrap">
              <DayTrack data={data} day={d} zone={zone} />
              {i === 0 && (
                <div className="pl02-phone pl02-strip-axis">
                  <span>07:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="pl02-card-note">
        <h3 className="pl02-section-label">
          Exceptions and unavailable / other work
        </h3>
        {[...(r.exceptions ?? []), ...(r.blocks ?? [])].map((b) => (
          <p key={b.id}>
            {b.kind} · <Stamp value={b.start_at} timezone={r.base_timezone} />{" "}
            to <Stamp value={b.end_at} timezone={r.base_timezone} /> ·{" "}
            {r.base_timezone}
          </p>
        ))}
        {!r.exceptions?.length && !r.blocks?.length && (
          <p>No blocks or exceptions returned in this period.</p>
        )}
        <p>
          Blocks use {r.base_timezone}; weekly hours use the calendar’s time
          zone, {r.calendar.timezone}. Busy times include explicit travel and
          can belong to visits outside your access.
        </p>
      </div>
    </section>
  );
}
