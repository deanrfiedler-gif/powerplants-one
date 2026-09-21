"use client";
import type { Presentation, ToneIcon } from "../../model";
// The controls, dialogs, reads and the one-command-at-a-time recovery are the shared ones EN-06 built on My Work's
// rules. EN-07 adds only its own glyphs and the single semantic tone treatment.
export { CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Reason, fieldError, useRead, useMaterialsCommand as useChangeCommand, type MenuItem, type IconName } from "../../../materials/components/client/materials-ui";
export { label as text } from "../../model";
export { api } from "../../../../components/business-ui";

// Outline glyphs in the shell's family (24px grid, 1.7 stroke) for the menu destinations EN-06 had no icon for. Mockup
// r03 draws Impact assessment as linked nodes, Retest & verification as a flask and Changes & history as a plain clock.
const outlines = {
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.2 19.5c.5-3.4 2.8-5.4 5.8-5.4s5.3 2 5.8 5.4M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.2 14.4c2 .7 3.2 2.5 3.6 5.1" />
    </>
  ),
  nodes: (
    <>
      <circle cx="6.2" cy="17.4" r="2.4" /><circle cx="17.8" cy="17.4" r="2.4" /><circle cx="14.2" cy="6.2" r="2.4" />
      <path d="M8.6 17.4h6.8M7.5 15.4l5.4-7.3M15 8.5l2.1 6.6" />
    </>
  ),
  flask: <path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.2 1.2 0 0 0 1 1.8h12A1.2 1.2 0 0 0 19 19l-5.5-9.5v-6M7.6 15h8.8" />,
  clock: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 7.2V12l3.2 2" /></>),
} as const;
export type OutlineName = keyof typeof outlines;
export function Outline({ name }: { name: OutlineName }) {
  return <svg className="mw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{outlines[name]}</svg>;
}

// One outline glyph per mapped icon, as mockup r03 draws them, so a tone is never colour alone. The stroke takes the
// tone's text colour; nothing here is filled, and the words always stand beside it.
const marks: Record<ToneIcon, React.ReactNode> = {
  dot: <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />,
  info: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 11.2v5M12 7.8h.01" /></>),
  warning: (<><path d="M12 4.2 3.2 19.4h17.6Z" /><path d="M12 10v4.4M12 16.8h.01" /></>),
  error: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 7.6v5.4M12 16.2h.01" /></>),
  check: (<><circle cx="12" cy="12" r="8.6" /><path d="m8 12.3 2.7 2.7 5.3-5.6" /></>),
  tick: <path d="m5.6 12.6 4.2 4.2 8.6-9.2" />,
  document: <path d="M7.5 3.6h6.3l3.7 3.7v12.6a.5.5 0 0 1-.5.5h-9.5a.5.5 0 0 1-.5-.5V4.1a.5.5 0 0 1 .5-.5ZM13.6 3.8v3.8h3.8M9.6 12.4h4.8M9.6 15.8h4.8" />,
  progress: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 16.2V8.4M8.8 11.4 12 8.2l3.2 3.2" /></>),
  clock: (<><circle cx="12" cy="12" r="8.6" /><path d="M12 7.4V12l3 1.8" /></>),
};
export function ToneMark({ icon }: { icon: ToneIcon }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{marks[icon]}</svg>;
}
// The single way a domain condition is shown: its mapped icon and its words, in its mapped tone. A register cell, a
// queue cell and a header chip are the r03 pill, on the tone's own r22 surface. `plain` is the same condition set in
// running text, where a surface would shout: the inspector's source line; `bare` drops the icon too, for the quiet
// right-hand state of a follow-through row.
export function Tone({ view, wrap = false, plain = false, bare = false }: { view: Presentation; wrap?: boolean; plain?: boolean; bare?: boolean }) {
  return <span className={`ec-tone ec-tone-${view.tone}${plain || bare ? " ec-tone-plain" : ""}${wrap ? " ec-tone-wrap" : ""}`} data-tone={view.tone}>{!bare && <ToneMark icon={view.icon} />}<span>{view.label}</span></span>;
}
// Dates are written the way mockup r03 writes them: "21 Sep 2026", never "Sept". A calendar date is shown as recorded
// and is never passed through a time zone; a moment is shown in the application's own zone, and says which.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dateText = (value: string | null, missing = "Date needed") => (value ? `${Number(value.slice(8, 10))} ${months[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}` : missing);
const moment = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Australia/Brisbane", timeZoneName: "short" });
export function stampText(value: string | null, separator = ", ") {
  if (!value) return "";
  const part = Object.fromEntries(moment.formatToParts(new Date(value)).map((x) => [x.type, x.value]));
  return `${Number(part.day)} ${months[Number(part.month) - 1]} ${part.year}${separator}${part.hour}:${part.minute} ${String(part.dayPeriod).toLowerCase()} ${part.timeZoneName}`;
}
export const newId = () => crypto.randomUUID();
