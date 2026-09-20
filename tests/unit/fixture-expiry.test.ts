import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

// The P01-P12 fixtures carry absolute dates, so they expire. When the P05 appointments
// fall into the past the planner refuses to book them, and suites across packs, field,
// offline, reports and Finance start failing on the clock rather than on the change
// under test. That is what happened on 2026-09-20; ADR-0030 has the evidence.
//
// This test is the warning. It fails while there is still time to act, and it names the
// one command that fixes it. Keep the runway wide enough that a failure here is a
// scheduled job rather than an outage.
const RUNWAY_DAYS = 90;

const instants = (line: string) =>
  (line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z/g) ?? []).map(Date.parse);

test("the seeded P05 appointments keep at least 90 days of runway", async () => {
  const sql = await readFile(new URL("../../db/seed-p05.sql", import.meta.url), "utf8");
  // Every timestamp on an appointment row is part of that visit's window, so the
  // earliest of them is the first fixture the planner's "must be in the future" gate
  // will reject.
  const starts = sql
    .split("\n")
    .filter((line) => line.startsWith("INSERT INTO ppo.appointments"))
    .flatMap(instants);

  assert.ok(starts.length > 0, "No appointment rows found in db/seed-p05.sql.");

  const earliest = Math.min(...starts);
  const days = (earliest - Date.now()) / 86400000;

  assert.ok(
    days >= RUNWAY_DAYS,
    `The earliest seeded appointment is ${new Date(earliest).toISOString()}, ` +
      `${days.toFixed(0)} days away. Below ${RUNWAY_DAYS} days the database, HTTP and ` +
      `browser suites start failing on wall-clock time regardless of the change under ` +
      `test. Move the fixtures forward: python3 scripts/shift_fixture_dates.py --apply ` +
      `(report first without --apply). See docs/decisions/ADR-0030-test-fixture-time-dependence.md.`,
  );
});
