import assert from "node:assert/strict";
import { monthDate } from "../../src/maintenance/model";

export function maintenanceTestDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const year = Number(part("year"));
  // Keep historical 2026 plan/charge evidence inside the shared fixture's term.
  const agreement = {
    effective_from: `${Math.min(2026, year)}-01-01`,
    effective_to: `${year + 2}-12-31`,
  };
  // Month-start anchors avoid leap-day/month-end ambiguity. The fee is due now,
  // and the bounded generation window excludes both annual boundary dates.
  const anchor = `${today.slice(0, 7)}-01`;
  const end = new Date(`${monthDate(anchor, 12)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  const connected = {
    effective_from: anchor,
    effective_to: end.toISOString().slice(0, 10),
    due_date: anchor,
    generation_from: `${today.slice(0, 7)}-02`,
    occurrence: monthDate(anchor, 6),
  };
  for (const term of [agreement, connected])
    assert.ok(
      term.effective_from <= today && today <= term.effective_to,
      `Synthetic agreement term must cover Brisbane execution date ${today}`,
    );
  return { today, agreement, connected };
}
