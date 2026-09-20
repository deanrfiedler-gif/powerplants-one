"use client";
// Shared form pieces for My Work dialogs: how an activity's timing is chosen and what is sent.
import { useId } from "react";
import { addDays, localDateTime, utcFromLocal } from "../../../scheduling/time";
import {
  activityTypeLabels,
  activityTypes,
  endOfLocalDay,
  localDay,
  WORK_TIMEZONE,
  type ActivityType,
} from "../../work-view";

export type TimingMode = "deadline" | "date" | "appointment" | "needed";
export type TimingState = {
  mode: TimingMode;
  // Civil values in the work time zone, exactly as typed, so an invalid entry is kept and explained.
  at: string; // YYYY-MM-DDTHH:mm — deadline, or appointment start
  day: string; // YYYY-MM-DD — date-only task
  minutes: string; // appointment length
};
export const timingModes: { id: TimingMode; label: string; hint: string }[] = [
  { id: "deadline", label: "Due by a time", hint: "A task with a deadline" },
  { id: "date", label: "Due on a day", hint: "A task with no set time" },
  { id: "appointment", label: "Booked appointment", hint: "A call, meeting or visit with a start and a length" },
  { id: "needed", label: "Date still needed", hint: "Stays in Date needed until it has one" },
];
type Stored = { due_at: string | null; due_needed: boolean; due_date_only: boolean; starts_at: string | null };
export function timingFrom(a: Stored | null, now: string): TimingState {
  const today = localDay(now);
  const blank: TimingState = { mode: "deadline", at: "", day: today, minutes: "30" };
  if (!a) return blank;
  if (a.due_needed || !a.due_at) return { ...blank, mode: "needed" };
  if (a.starts_at)
    return {
      mode: "appointment",
      at: localDateTime(a.starts_at, WORK_TIMEZONE),
      day: localDay(a.starts_at),
      minutes: String(Math.round((Date.parse(a.due_at) - Date.parse(a.starts_at)) / 60000)),
    };
  if (a.due_date_only) return { ...blank, mode: "date", day: localDay(a.due_at) };
  return { ...blank, mode: "deadline", at: localDateTime(a.due_at, WORK_TIMEZONE), day: localDay(a.due_at) };
}
// The fields a command carries. due_at is always the instant after which the work is overdue.
export type TimingPayload = Stored;
export function timingPayload(t: TimingState): { ok: true; value: TimingPayload } | { ok: false; message: string } {
  try {
    if (t.mode === "needed")
      return { ok: true, value: { due_at: null, due_needed: true, due_date_only: false, starts_at: null } };
    if (t.mode === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.day)) return { ok: false, message: "Choose the day this task is due." };
      return { ok: true, value: { due_at: endOfLocalDay(t.day), due_needed: false, due_date_only: true, starts_at: null } };
    }
    if (!t.at) return { ok: false, message: t.mode === "appointment" ? "Choose when the appointment starts." : "Choose the date and time this task is due." };
    const instant = utcFromLocal(t.at, WORK_TIMEZONE);
    if (t.mode === "deadline")
      return { ok: true, value: { due_at: instant, due_needed: false, due_date_only: false, starts_at: null } };
    const minutes = Number(t.minutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440)
      return { ok: false, message: "Give the appointment a length from 5 minutes to 24 hours." };
    return {
      ok: true,
      value: {
        starts_at: instant,
        due_at: new Date(Date.parse(instant) + minutes * 60000).toISOString(),
        due_needed: false,
        due_date_only: false,
      },
    };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
export const sameTiming = (a: TimingPayload, b: Stored) =>
  a.due_at === b.due_at && a.due_needed === b.due_needed && a.due_date_only === b.due_date_only && a.starts_at === b.starts_at;

export function TimingFields({
  value,
  onChange,
  now,
  allowNeeded = true,
}: {
  value: TimingState;
  onChange: (next: TimingState) => void;
  now: string;
  allowNeeded?: boolean;
}) {
  const id = useId();
  const today = localDay(now);
  return (
    <fieldset className="mw-fieldset">
      <legend>When</legend>
      <div className="mw-choice-row" role="radiogroup" aria-label="Timing">
        {timingModes
          .filter((m) => allowNeeded || m.id !== "needed")
          .map((m) => (
            <label key={m.id} className="mw-choice" title={m.hint}>
              <input type="radio" name={`${id}-mode`} checked={value.mode === m.id} onChange={() => onChange({ ...value, mode: m.id })} />
              <span>{m.label}</span>
            </label>
          ))}
      </div>
      {value.mode === "date" && (
        <div className="mw-field">
          <label htmlFor={`${id}-day`}>Due on</label>
          <input id={`${id}-day`} type="date" value={value.day} min={addDays(today, -366)} onChange={(e) => onChange({ ...value, day: e.target.value })} required />
        </div>
      )}
      {(value.mode === "deadline" || value.mode === "appointment") && (
        <div className="mw-field-row">
          <div className="mw-field">
            <label htmlFor={`${id}-at`}>{value.mode === "appointment" ? "Starts at" : "Due by"}</label>
            <input id={`${id}-at`} type="datetime-local" value={value.at} onChange={(e) => onChange({ ...value, at: e.target.value })} required />
          </div>
          {value.mode === "appointment" && (
            <div className="mw-field mw-field-short">
              <label htmlFor={`${id}-minutes`}>Length (minutes)</label>
              <input id={`${id}-minutes`} type="number" inputMode="numeric" min={5} max={1440} step={5} value={value.minutes} onChange={(e) => onChange({ ...value, minutes: e.target.value })} required />
            </div>
          )}
        </div>
      )}
      <p className="mw-hint">
        {value.mode === "needed"
          ? "The activity is listed under Date needed until it has a date, so it cannot be forgotten."
          : `Times are ${WORK_TIMEZONE.replace("_", " ")} time.`}
      </p>
    </fieldset>
  );
}

export function TypeField({ value, onChange }: { value: ActivityType; onChange: (v: ActivityType) => void }) {
  const id = useId();
  return (
    <div className="mw-field">
      <label htmlFor={id}>Activity type</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as ActivityType)}>
        {activityTypes.map((t) => (
          <option key={t} value={t}>
            {activityTypeLabels[t]}
          </option>
        ))}
      </select>
    </div>
  );
}
// A call or a meeting is normally booked; a task normally has a deadline. Only a starting point.
export const defaultModeFor = (type: ActivityType): TimingMode =>
  type === "Meeting" || type === "SiteVisit" ? "appointment" : "deadline";
