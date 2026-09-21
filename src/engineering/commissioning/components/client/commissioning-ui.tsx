"use client";
import type { Presentation, TagIcon } from "../../model";
// The controls, dialogs, reads and the one-command-at-a-time recovery are the shared ones EN-06 built on My Work's
// rules. EN-08 adds only its own glyphs and the r22 status tag.
export { CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Reason, dateText, fieldError, stampText, useRead, useMaterialsCommand as useCommissioningCommand, type MenuItem, type IconName } from "../../../materials/components/client/materials-ui";
export { label as text } from "../../model";
export { api } from "../../../../components/business-ui";

// Outline glyphs in the shell's family (24px grid, 1.7 stroke) for the menu destinations EN-06 had no icon for.
const outlines = {
  basis: <><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="m8.5 12.2 2.4 2.4 4.6-4.9" /></>,
  results: <><circle cx="12" cy="12" r="8.5" /><path d="m8.4 12.3 2.5 2.5 4.8-5" /></>,
  redline: <path d="M4 20l1.2-4.6L16.4 4.2a1.8 1.8 0 0 1 2.6 0l.8.8a1.8 1.8 0 0 1 0 2.6L8.6 18.8Zm10.6-13.8 3.2 3.2" />,
  release: <><path d="M7 3.5h7.5L19 8v12.5H7Z" /><path d="M14.5 3.5V8H19M4.5 13h6m-2.4-2.6L10.5 13l-2.4 2.6" /></>,
  history: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.2V12l3.2 2" /></>,
} as const;
export type OutlineName = keyof typeof outlines;
export function Outline({ name }: { name: OutlineName }) {
  return <svg className="mw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{outlines[name]}</svg>;
}

// r22 status tag (theme style board .tag): a small rectangular tinted tag with a 13px outline icon. One shape per
// meaning, never a filled disc or triangle, and never colour alone. "unsent" is an empty dashed ring: it is not a tick.
const marks: Record<Exclude<TagIcon, "none">, React.ReactNode> = {
  tick: <path d="m5 12.6 4.4 4.4L19 7.4" />,
  "tick-circle": <><circle cx="12" cy="12" r="9" /><path d="m8 12.4 2.8 2.8L16.2 9.6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 1.9" /></>,
  alert: <><path d="M12 3.6 2.6 20h18.8Z" /><path d="M12 10v4.6M12 17.3h.01" /></>,
  error: <><circle cx="12" cy="12" r="9" /><path d="M12 7.4v5.6M12 16.4h.01" /></>,
  document: <><path d="M7 3.5h7.5L19 8v12.5H7Z" /><path d="M14.5 3.5V8H19" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.2" /></>,
  unsent: <circle cx="12" cy="12" r="8.5" strokeDasharray="3.2 3.2" />,
};
// The single way a condition is shown: its mapped words, tone and icon. Ordinary next steps are plain text, not tags.
export function Tag({ view, wrap = false }: { view: Presentation; wrap?: boolean }) {
  return (
    <span className={`cm-tag cm-tag-${view.tone}${wrap ? " cm-tag-wrap" : ""}`} data-tone={view.tone}>
      {view.icon !== "none" && <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{marks[view.icon]}</svg>}
      <span>{view.label}</span>
    </span>
  );
}
// A local calendar date, shown as written: "22 Sep 2026". It is never passed through a time zone.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const longDate = (value: string | null) => (value ? `${Number(value.slice(8, 10))} ${months[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}` : "Date needed");
// An instant at the site: "20 Sep 2026, 3:40 pm AEST". The zone is the site's, named; it is never the browser's by accident.
export function siteTime(value: string | null, timezone: string | null) {
  if (!value) return "";
  const zone = timezone ?? "UTC", d = new Date(value), part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-AU", { timeZone: zone, ...o });
  const zoneName = part({ timeZoneName: "short" }).formatToParts(d).find((x) => x.type === "timeZoneName")?.value ?? zone;
  // The date is assembled from its parts so that it reads "20 Sep 2026" exactly as a date-only value does beside it.
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split("-");
  return `${Number(day)} ${months[Number(month) - 1]} ${year}, ${part({ hour: "numeric", minute: "2-digit", hour12: true }).format(d).toLowerCase()} ${zoneName}`;
}
export const newId = () => crypto.randomUUID();
