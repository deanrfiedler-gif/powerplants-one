// Presentation rules for My Work. Pure: no I/O and no authority. The server read
// decides what is visible; these functions only classify and label what it returned.
import { addDays, localDateTime, utcFromLocal } from "../scheduling/time";

export const WORK_TIMEZONE = "Australia/Brisbane";
export const activityTypes = [
  "Task",
  "Call",
  "Email",
  "Meeting",
  "SiteVisit",
] as const;
export type ActivityType = (typeof activityTypes)[number];
export const activityTypeLabels: Record<ActivityType, string> = {
  Task: "Task",
  Call: "Call",
  Email: "Email",
  Meeting: "Meeting",
  SiteVisit: "Site visit",
};

// `due_at` is the instant after which the activity is overdue: a task's deadline, the end of
// the local due day for a date-only task, or an appointment's planned end. An appointment is
// an activity with `starts_at`; nothing else may be presented as a booked time.
export type Timed = {
  id: string;
  status: string;
  due_at: string | null;
  due_needed: boolean;
  due_date_only: boolean;
  starts_at: string | null;
};
export type AttentionGroup =
  "Closed" | "DateNeeded" | "Overdue" | "Today" | "Upcoming";

export const isActive = (a: Pick<Timed, "status">) =>
  a.status === "Open" || a.status === "InProgress";
export const isAppointment = (a: Pick<Timed, "starts_at">) => !!a.starts_at;
export const localDay = (iso: string, zone = WORK_TIMEZONE) =>
  localDateTime(iso, zone).slice(0, 10);
const anchor = (a: Timed) => a.starts_at ?? a.due_at;

export function attentionGroup(
  a: Timed,
  now: string,
  zone = WORK_TIMEZONE,
): AttentionGroup {
  if (!isActive(a)) return "Closed";
  if (a.due_needed || !a.due_at) return "DateNeeded";
  if (Date.parse(a.due_at) < Date.parse(now)) return "Overdue";
  // Not overdue, so a deadline is today or later. An appointment that began on an earlier
  // local day and has not reached its planned end is still today's work.
  return localDay(anchor(a)!, zone) <= localDay(now, zone)
    ? "Today"
    : "Upcoming";
}

export function dayDifference(from: string, to: string) {
  return Math.round(
    (Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) /
      86400000,
  );
}
// Built from the civil time rather than a locale pattern, so Node and every browser agree.
const clock = (iso: string, zone = WORK_TIMEZONE) => {
  const [hour, minute] = localDateTime(iso, zone).slice(11).split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h < 12 ? "am" : "pm"}`;
};
// Fixed month names: ICU versions disagree on "Sep" and "Sept" for en-AU.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDay = (iso: string, zone = WORK_TIMEZONE) => {
  const [, month, day] = localDateTime(iso, zone).slice(0, 10).split("-");
  return `${Number(day)} ${months[Number(month) - 1]}`;
};
export const clockTime = clock;
export const shortDate = shortDay;

export type Timing = {
  tone: "overdue" | "attention" | "normal";
  caption: string | null;
  value: string;
};
// "Due by" is a task deadline and "Starts at" an appointment start. A date-only task shows its
// day and never an invented time.
export function timing(a: Timed, now: string, zone = WORK_TIMEZONE): Timing {
  const group = attentionGroup(a, now, zone);
  if (group === "Closed")
    return { tone: "normal", caption: null, value: "Closed" };
  if (group === "DateNeeded")
    return { tone: "attention", caption: null, value: "Date needed" };
  const due = a.due_at!,
    today = localDay(now, zone);
  if (group === "Overdue") {
    const days = dayDifference(localDay(due, zone), today);
    if (days >= 1)
      return {
        tone: "overdue",
        caption: null,
        value: `${days} day${days === 1 ? "" : "s"} overdue`,
      };
    return a.starts_at
      ? { tone: "overdue", caption: "Overdue · ended", value: clock(due, zone) }
      : { tone: "overdue", caption: "Overdue · due by", value: clock(due, zone) };
  }
  if (a.starts_at) {
    const started = Date.parse(a.starts_at) <= Date.parse(now);
    const sameDay = localDay(a.starts_at, zone) === today;
    return {
      tone: "normal",
      caption: started ? "Started" : "Starts at",
      value: sameDay
        ? clock(a.starts_at, zone)
        : `${shortDay(a.starts_at, zone)}, ${clock(a.starts_at, zone)}`,
    };
  }
  if (a.due_date_only)
    return {
      tone: "normal",
      caption: "Due",
      value: group === "Today" ? "Today" : shortDay(due, zone),
    };
  return {
    tone: "normal",
    caption: "Due by",
    value:
      group === "Today"
        ? clock(due, zone)
        : `${shortDay(due, zone)}, ${clock(due, zone)}`,
  };
}

// One sentence for when an activity happens, for details and editors.
export function whenText(
  a: Pick<Timed, "due_at" | "due_needed" | "due_date_only" | "starts_at">,
  zone = WORK_TIMEZONE,
) {
  if (a.due_needed || !a.due_at) return "Date needed";
  const stamp = (iso: string) => `${shortDay(iso, zone)}, ${clock(iso, zone)}`;
  if (a.starts_at)
    return `${stamp(a.starts_at)} to ${clock(a.due_at, zone)} (${durationLabel(durationMinutes(a))})`;
  return a.due_date_only
    ? `Due ${shortDay(a.due_at, zone)} (no set time)`
    : `Due by ${stamp(a.due_at)}`;
}
export function durationMinutes(a: Pick<Timed, "starts_at" | "due_at">) {
  return a.starts_at && a.due_at
    ? Math.round((Date.parse(a.due_at) - Date.parse(a.starts_at)) / 60000)
    : null;
}
export function durationLabel(minutes: number | null) {
  if (minutes === null) return "";
  // Appointments are planned in minutes; hours only help once a visit runs to two or more.
  if (minutes < 120) return `${minutes} min`;
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Due-time order with the identifier as a stable tie breaker, so equal times never reshuffle.
export function compareDue(a: Timed, b: Timed) {
  const x = anchor(a),
    y = anchor(b);
  if (x === null || y === null)
    return x === y ? a.id.localeCompare(b.id) : x === null ? 1 : -1;
  return Date.parse(x) - Date.parse(y) || a.id.localeCompare(b.id);
}

// The next schedule entry is the first appointment that has not reached its planned end.
export function nextScheduleId(entries: Timed[], now: string) {
  return (
    entries
      .filter(
        (e) => isActive(e) && e.starts_at && Date.parse(e.due_at!) > Date.parse(now),
      )
      .toSorted(compareDue)[0]?.id ?? null
  );
}

export function greeting(now: string, zone = WORK_TIMEZONE) {
  const hour = Number(localDateTime(now, zone).slice(11, 13));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
// Assembled from parts: ICU versions differ on whether en-AU puts a comma after the weekday.
export function longDate(now: string, zone = WORK_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: zone,
  }).formatToParts(new Date(now));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`;
}
export const firstName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/);
  // Synthetic identities are named "SYN Coordinator"; greet by the distinguishing word.
  return (parts[0] === "SYN" && parts[1] ? parts[1] : parts[0]) || "there";
};

// Civil-time conversions used by the forms and by the server when it stores a date-only task.
export function endOfLocalDay(day: string, zone = WORK_TIMEZONE) {
  return new Date(
    Date.parse(utcFromLocal(`${addDays(day, 1)}T00:00`, zone)) - 1,
  ).toISOString();
}
export function localDayBounds(day: string, zone = WORK_TIMEZONE) {
  return {
    start: utcFromLocal(`${day}T00:00`, zone),
    end: utcFromLocal(`${addDays(day, 1)}T00:00`, zone),
  };
}
