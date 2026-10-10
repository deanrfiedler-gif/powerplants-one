import { localDateTime, utcFromLocal } from "./time";
import { STANDARD_END_MINUTE, STANDARD_START_MINUTE } from "./working-hours";

// The Day timeline (Dean, 10 October 2026: "proceed with your recommendations"). Pure
// calculations only: the planner component draws what these return. Every minute value is
// minutes from midnight of the displayed day in the display timezone.
export const AXIS_START_MINUTE = 7 * 60;
export const AXIS_END_MINUTE = 18 * 60;
const AXIS_SPAN = AXIS_END_MINUTE - AXIS_START_MINUTE;
const FREE_GAP_MINUTES = 30;

export type Span = [number, number];

export function dayMinute(iso: string, zone: string, day: string) {
  const local = localDateTime(iso, zone);
  const days =
    (Date.parse(local.slice(0, 10) + "T00:00:00Z") -
      Date.parse(day + "T00:00:00Z")) /
    86400000;
  return days * 1440 + Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));
}

// Percentage across the 07:00 to 18:00 axis, clamped to the axis.
export function axisPercent(minute: number) {
  return (
    (100 * (Math.min(Math.max(minute, AXIS_START_MINUTE), AXIS_END_MINUTE) - AXIS_START_MINUTE)) /
    AXIS_SPAN
  );
}

// The minute under a pointer, snapped to 15 minutes.
export function minuteAtFraction(fraction: number) {
  const m = AXIS_START_MINUTE + Math.min(Math.max(fraction, 0), 1) * AXIS_SPAN;
  return Math.round(m / 15) * 15;
}

export const clockText = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export const hoursText = (minutes: number) => {
  const h = Math.round((minutes / 60) * 10) / 10;
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
};

function merge(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const s of [...spans].filter((s) => s[1] > s[0]).sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else out.push([s[0], s[1]]);
  }
  return out;
}
function intersect(a: Span[], b: Span[]): Span[] {
  const out: Span[] = [];
  for (const x of a)
    for (const y of b) {
      const s: Span = [Math.max(x[0], y[0]), Math.min(x[1], y[1])];
      if (s[1] > s[0]) out.push(s);
    }
  return merge(out);
}
export function subtractSpans(a: Span[], b: Span[]): Span[] {
  let out = merge(a);
  for (const y of merge(b))
    out = out.flatMap((x): Span[] =>
      y[1] <= x[0] || y[0] >= x[1]
        ? [x]
        : ([
            [x[0], y[0]],
            [y[1], x[1]],
          ] as Span[]).filter((s) => s[1] > s[0]),
    );
  return out;
}
const total = (spans: Span[]) => merge(spans).reduce((a, s) => a + s[1] - s[0], 0);

export type TimelineCalendar = {
  timezone: string;
  intervals: { weekday: number; start_minute: number; end_minute: number }[];
};
type Period = { start_at: string; end_at: string };

// A calendar's local minutes on the day, moved into the display timezone. Local times that
// do not exist because of a clock change are left out rather than guessed.
function calendarSpans(
  calendar: TimelineCalendar,
  day: string,
  zone: string,
  pick: (i: { start_minute: number; end_minute: number }) => Span | null,
) {
  const weekday = new Date(day + "T12:00:00Z").getUTCDay();
  const spans: Span[] = [];
  for (const i of calendar.intervals.filter((i) => i.weekday === weekday)) {
    const s = pick(i);
    if (!s) continue;
    try {
      const at = (m: number) =>
        m >= 1440
          ? utcFromLocal(
              new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().slice(0, 10) + "T00:00",
              calendar.timezone,
            )
          : utcFromLocal(`${day}T${clockText(m)}`, calendar.timezone);
      spans.push([dayMinute(at(s[0]), zone, day), dayMinute(at(s[1]), zone, day)]);
    } catch {
      /* Skipped: a clock-change gap or repeat. */
    }
  }
  return merge(spans);
}

// Stored kinds such as "OtherWork" read as "Other work".
export const kindText = (kind: string) => {
  const words = kind.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export type LaneBand = { kind: "NotWorking" | "Extended"; span: Span };

export type LaneDay = {
  working: Span[];
  standard: Span[];
  bands: LaneBand[];
  unavailable: { span: Span; label: string; time: string }[];
  closed: Span[];
  reserved: Span[];
  bookedMinutes: number;
  capacityMinutes: number;
  away: boolean;
  free: string;
};

// What one person's lane shows for one day. Hours booked and free time count standard
// hours only (Dean's decision), using every reservation the server returns for the
// person, so a site or status filter never makes someone look free.
export function laneDay(input: {
  calendar: TimelineCalendar;
  blocks: (Period & { kind: string })[];
  exceptions: Period[];
  busy: Period[];
  day: string;
  zone: string;
  now?: string;
}): LaneDay {
  const { calendar, day, zone } = input;
  const span = (p: Period): Span => [dayMinute(p.start_at, zone, day), dayMinute(p.end_at, zone, day)];
  const working = calendarSpans(calendar, day, zone, (i) => [i.start_minute, i.end_minute]);
  const standard = calendarSpans(calendar, day, zone, (i) => {
    const s: Span = [Math.max(i.start_minute, STANDARD_START_MINUTE), Math.min(i.end_minute, STANDARD_END_MINUTE)];
    return s[1] > s[0] ? s : null;
  });
  const axis: Span[] = [[AXIS_START_MINUTE, AXIS_END_MINUTE]];
  const bands: LaneBand[] = [
    ...subtractSpans(axis, working).map((s) => ({ kind: "NotWorking" as const, span: s })),
    ...subtractSpans(intersect(axis, working), standard).map((s) => ({ kind: "Extended" as const, span: s })),
  ].sort((a, b) => a.span[0] - b.span[0]);
  const blocks = input.blocks.map((b) => ({ ...b, s: span(b) })).filter((b) => b.s[1] > 0 && b.s[0] < 1440);
  const closed = merge(input.exceptions.map(span).filter((s) => s[1] > 0 && s[0] < 1440));
  const reserved = merge(input.busy.map(span).filter((s) => s[1] > 0 && s[0] < 1440));
  const unavailableSpans = merge([...blocks.map((b) => b.s), ...closed]);
  const open = subtractSpans(standard, unavailableSpans);
  const capacityMinutes = total(open);
  const bookedMinutes = total(intersect(open, reserved));
  let from = Math.min(...open.map((s) => s[0]), Infinity);
  const today = input.now ? localDateTime(input.now, zone).slice(0, 10) === day : false;
  if (today) from = Math.max(from, Math.ceil(dayMinute(input.now!, zone, day) / 15) * 15);
  const gaps = subtractSpans(open, reserved).filter((s) => s[1] > from).map((s): Span => [Math.max(s[0], from), s[1]]).filter((s) => s[1] - s[0] >= FREE_GAP_MINUTES);
  const end = Math.max(...open.map((s) => s[1]), -Infinity);
  let free = "";
  if (capacityMinutes > 0) {
    if (!gaps.length) free = today ? "No free time left today" : "No free time";
    else if (gaps.length === 1 && gaps[0][0] <= Math.max(from, open[0][0]) && gaps[0][1] === end)
      free = today ? "Free for the rest of the day" : "Free all day";
    else
      free =
        "Free " +
        gaps
          .slice(0, 2)
          .map((g) => (g[1] === end ? "from " + clockText(g[0]) : `${clockText(g[0])}–${clockText(g[1])}`))
          .join(" · ") +
        (gaps.length > 2 ? ` +${gaps.length - 2} more` : "");
  }
  return {
    working,
    standard,
    bands,
    unavailable: blocks.map((b) => ({
      span: b.s,
      label: kindText(b.kind),
      time:
        b.s[0] <= AXIS_START_MINUTE && b.s[1] >= AXIS_END_MINUTE
          ? "All day"
          : `${clockText(Math.max(b.s[0], 0))}–${clockText(Math.min(b.s[1], 1439))}`,
    })),
    closed,
    reserved,
    bookedMinutes,
    capacityMinutes,
    away: standard.length > 0 && capacityMinutes === 0,
    free,
  };
}

// Dean's decision on what needs attention: pack preparation or review required, or customer
// contact not confirmed. The live app also holds work for scope review and published
// scheduling policy; those need attention too, and come first.
export type VisitState = { kind: "attention" | "ok" | "proposed" | "cancelled"; short: string; long: string };
export function visitState(a: {
  status: string;
  customer_commitment: string;
  pack_requirement: string;
  scope_review_required: boolean;
  policy_impacts?: { held: boolean }[];
}): VisitState {
  if (a.status === "Cancelled") return { kind: "cancelled", short: "Cancelled", long: "Cancelled · no reservation" };
  if (a.status !== "Confirmed") return { kind: "proposed", short: "Proposed", long: "Proposed · no crew reserved" };
  if (a.policy_impacts?.some((x) => x.held))
    return { kind: "attention", short: "Policy hold", long: "Scheduling policy hold" };
  if (a.scope_review_required) return { kind: "attention", short: "Scope review", long: "Scope review required" };
  if (a.pack_requirement === "PreparationRequired")
    return { kind: "attention", short: "Pack needed", long: "Pack preparation required" };
  if (a.pack_requirement === "ReviewRequired" || a.pack_requirement === "CancellationReviewRequired")
    return { kind: "attention", short: "Pack review", long: "Pack review required" };
  if (a.customer_commitment !== "Confirmed")
    return { kind: "attention", short: "Contact due", long: "Customer contact not confirmed" };
  return { kind: "ok", short: "Confirmed", long: "Confirmed · crew reserved" };
}

// Two initials for a person from their own name: the synthetic-data marker and any note after
// a dash are left out, so "SYN Alex Lead" is AL and "SYN Casey — expired skill" is CA.
export function initials(name: string) {
  const words = name
    .split(/\s+[—–-]\s+/)[0]!
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && w !== "SYN");
  if (!words.length) return "?";
  return (words.length === 1 ? words[0]!.slice(0, 2) : words[0]![0]! + words[1]![0]!).toUpperCase();
}

// ISO 8601 week number of a civil day (YYYY-MM-DD), for the Week view's corner label.
export function isoWeek(day: string) {
  const d = new Date(day + "T00:00:00Z"),
    weekday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - weekday + 3);
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}
