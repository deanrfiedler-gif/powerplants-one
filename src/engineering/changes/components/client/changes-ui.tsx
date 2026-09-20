"use client";
import type { Presentation, ToneIcon } from "../../model";
// The controls, dialogs, reads and the one-command-at-a-time recovery are the shared ones EN-06 built on My Work's
// rules. EN-07 adds only its own glyphs and the single semantic tone treatment.
export { CommandNotice, Dialog, Field, Icon, Menu, ReadNotice, Reason, dateText, fieldError, stampText, useRead, useMaterialsCommand as useChangeCommand, type MenuItem, type IconName } from "../../../materials/components/client/materials-ui";
export { label as text } from "../../model";
export { api } from "../../../../components/business-ui";

// Outline glyphs in the shell's family (24px grid, 1.7 stroke) for the two menu destinations EN-06 had no icon for.
const outlines = {
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.2 19.5c.5-3.4 2.8-5.4 5.8-5.4s5.3 2 5.8 5.4M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.2 14.4c2 .7 3.2 2.5 3.6 5.1" />
    </>
  ),
  retest: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.2v2.4m0 12.8v2.4M3.2 12h2.4m12.8 0h2.4M5.8 5.8l1.7 1.7m9 9 1.7 1.7m0-12.4-1.7 1.7m-9 9-1.7 1.7" />
    </>
  ),
  flask: <path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.2 1.2 0 0 0 1 1.8h12A1.2 1.2 0 0 0 19 19l-5.5-9.5v-6M7.6 15h8.8" />,
} as const;
export type OutlineName = keyof typeof outlines;
export function Outline({ name }: { name: OutlineName }) {
  return <svg className="mw-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{outlines[name]}</svg>;
}

// One shape per tone, so a tone is never colour alone: a dot, an i, a triangle, an exclamation, a tick.
const marks: Record<ToneIcon, React.ReactNode> = {
  dot: <circle cx="12" cy="12" r="6.5" fill="currentColor" />,
  info: (<><circle cx="12" cy="12" r="9" fill="currentColor" /><path d="M12 11v5.5M12 7.6h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" /></>),
  warning: (<><path d="M12 3.2 2.2 20.2h19.6Z" fill="currentColor" strokeLinejoin="round" /><path d="M12 9.6v5M12 17.4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" /></>),
  error: (<><circle cx="12" cy="12" r="9" fill="currentColor" /><path d="M12 7v6.2M12 16.6h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" /></>),
  check: (<><circle cx="12" cy="12" r="9" fill="currentColor" /><path d="m7.8 12.3 2.8 2.8 5.6-5.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></>),
};
export function ToneMark({ icon }: { icon: ToneIcon }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{marks[icon]}</svg>;
}
// The single way a domain condition is shown: its mapped icon and its words, in its mapped tone.
export function Tone({ view, wrap = false }: { view: Presentation; wrap?: boolean }) {
  return <span className={`ec-tone ec-tone-${view.tone}${wrap ? " ec-tone-wrap" : ""}`} data-tone={view.tone}><ToneMark icon={view.icon} /><span>{view.label}</span></span>;
}
// A local calendar date, shown as written: "21 Sep". It is never passed through a time zone.
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDate = (value: string | null) => (value ? `${Number(value.slice(8, 10))} ${months[Number(value.slice(5, 7)) - 1]}` : "Date needed");
export const newId = () => crypto.randomUUID();
