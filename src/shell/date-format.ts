// S6: one way to write dates and times (ui-build-sequence decision, 9 October 2026).
// Pure presentation: the year is always shown, times are 24-hour, every scheduled time carries
// its zone and offset, and people never see an internal zone name such as Australia/Brisbane.
// Built from civil parts rather than a locale pattern, so Node and every browser agree.
import { localDateTime } from "../scheduling/time";

export const DEFAULT_ZONE = "Australia/Brisbane";
// Fixed month names: ICU versions disagree on "Sep" and "Sept" for en-AU.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const civilParts = (iso: string, zone: string) => {
  const local = localDateTime(iso, zone);
  return { day: local.slice(0, 10), time: local.slice(11) };
};

// "4 Sep 2026", or "Fri 4 Sep 2026" where people plan by day. Takes a civil day (YYYY-MM-DD).
export function formatCivilDay(day: string, options: { weekday?: boolean } = {}) {
  const [year, month, date] = day.split("-").map(Number);
  const text = `${date} ${months[month - 1]} ${year}`;
  if (!options.weekday) return text;
  return `${weekdays[new Date(Date.UTC(year, month - 1, date, 12)).getUTCDay()]} ${text}`;
}
// The local day of an instant in the zone.
export const formatDate = (iso: string, zone = DEFAULT_ZONE, options: { weekday?: boolean } = {}) =>
  formatCivilDay(civilParts(iso, zone).day, options);
// "09:30", "17:19": 24-hour with two-digit hours.
export const formatTime = (iso: string, zone = DEFAULT_ZONE) => civilParts(iso, zone).time;

// "UTC+10", "UTC+9:30", "UTC−3" (with a true minus sign), "UTC" at zero offset.
export function zoneOffset(iso: string, zone = DEFAULT_ZONE) {
  const instant = Math.floor(Date.parse(iso) / 60000) * 60000;
  const minutes = Math.round((Date.parse(localDateTime(iso, zone) + "Z") - instant) / 60000);
  if (!minutes) return "UTC";
  const sign = minutes > 0 ? "+" : "−",
    abs = Math.abs(minutes),
    h = Math.floor(abs / 60),
    m = abs % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}
// "AEST", "AEDT", "ACST": the zone's own abbreviation at that instant, or null where the locale
// only knows a numeric name ("GMT+10"), which the offset already says.
export function zoneAbbreviation(iso: string, zone = DEFAULT_ZONE) {
  const name = new Intl.DateTimeFormat("en-AU", { timeZone: zone, timeZoneName: "short" })
    .formatToParts(new Date(iso))
    .find((p) => p.type === "timeZoneName")?.value;
  return !name || /^(GMT|UTC)[+−-]/.test(name) ? null : name;
}
// "AEST (UTC+10)"; "UTC" alone for UTC.
export function zoneLabel(iso: string, zone = DEFAULT_ZONE) {
  const abbreviation = zoneAbbreviation(iso, zone),
    offset = zoneOffset(iso, zone);
  if (!abbreviation) return offset;
  return abbreviation === offset ? offset : `${abbreviation} (${offset})`;
}
// "Brisbane · AEST (UTC+10)": a zone named for people, for pickers and list headers.
export function zoneDisplayName(zone = DEFAULT_ZONE, at = new Date().toISOString()) {
  const city = zone.split("/").at(-1)!.replaceAll("_", " ");
  const label = zoneLabel(at, zone);
  return city === "UTC" ? label : `${city} · ${label}`;
}

// A scheduled time: "4 Sep 2026, 10:00 AEST (UTC+10)".
export const formatDateTime = (iso: string, zone = DEFAULT_ZONE) =>
  `${formatDate(iso, zone)}, ${formatTime(iso, zone)} ${zoneLabel(iso, zone)}`;
// A timestamp such as "Updated": "9 Oct 2026, 17:19 AEST". The offset is left to scheduled times.
export function formatTimestamp(iso: string, zone = DEFAULT_ZONE) {
  const abbreviation = zoneAbbreviation(iso, zone);
  return `${formatDate(iso, zone)}, ${formatTime(iso, zone)} ${abbreviation ?? zoneOffset(iso, zone)}`;
}
// A booked period. One day: "Mon 22 Sep 2031 · 10:00–12:00 AEST (UTC+10)".
// Across days: "22 Sep 2031, 10:00 – 23 Sep 2031, 12:00 AEST (UTC+10)".
export function formatRange(start: string, end: string, zone = DEFAULT_ZONE) {
  const a = civilParts(start, zone),
    b = civilParts(end, zone);
  if (a.day === b.day)
    return `${formatCivilDay(a.day, { weekday: true })} · ${a.time}–${b.time} ${zoneLabel(start, zone)}`;
  const startLabel = zoneLabel(start, zone),
    endLabel = zoneLabel(end, zone);
  // A range that crosses a daylight-saving change names both zones rather than mislabel one end.
  return startLabel === endLabel
    ? `${formatCivilDay(a.day)}, ${a.time} – ${formatCivilDay(b.day)}, ${b.time} ${endLabel}`
    : `${formatCivilDay(a.day)}, ${a.time} ${startLabel} – ${formatCivilDay(b.day)}, ${b.time} ${endLabel}`;
}
