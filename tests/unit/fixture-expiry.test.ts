import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  RUNWAY_DAYS,
  assertRunway,
  fixtureLiterals,
  fixtureRules,
  runwayDays,
} from "../helpers/fixture-expiry";

// The P01-P12 fixtures carry absolute dates, so they expire. When the P05 appointments
// fall into the past the planner refuses to book them, and suites across packs, field,
// offline, reports and Finance start failing on the clock rather than on the change
// under test. That is what happened on 2026-09-20; ADR-0030 has the evidence.
//
// Fail while there is still time for reviewed maintenance. The additional source
// rules below cover independently dated live-clock fixtures beyond the P05 seed.

const instants = (line: string) =>
  (
    line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z/g) ?? []
  ).map(Date.parse);

test("the seeded P05 appointments keep at least 90 days of runway", async () => {
  const sql = await readFile(
    new URL("../../db/seed-p05.sql", import.meta.url),
    "utf8",
  );
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
      `test. Review python3 scripts/shift_fixture_dates.py in report mode before any ` +
      `targeted shift; preserve historical and negative cases. See ` +
      `docs/decisions/ADR-0030-test-fixture-time-dependence.md.`,
  );
});

for (const rule of fixtureRules)
  test(`${rule.path}: ${rule.purpose} keeps 90 days of runway`, async () => {
    const source = await readFile(
      new URL("../../" + rule.path, import.meta.url),
      "utf8",
    );
    const now = new Date();
    for (const { value, line } of fixtureLiterals(rule, source))
      assertRunway(
        value,
        rule.clock,
        now,
        `${rule.path}:${line} (${rule.purpose})`,
      );
  });

test("runway fails before expiry, including the exact instant boundary and invalid dates", () => {
  const expiry = "2031-12-01T00:00:00Z";
  const boundary = new Date(Date.parse(expiry) - 90 * 86_400_000);
  assert.doesNotThrow(() =>
    assertRunway(expiry, "instant", boundary, "positive fixture"),
  );
  assert.throws(
    () =>
      assertRunway(
        expiry,
        "instant",
        new Date(+boundary + 1),
        "positive fixture",
      ),
    /positive fixture.*needs at least 90/,
  );
  assert.throws(
    () => assertRunway(expiry, "instant", new Date(expiry), "positive fixture"),
    /0.00 days/,
  );
  for (const invalid of ["2031-02-30", "not-a-date"])
    assert.throws(
      () => runwayDays(invalid, "Australia/Brisbane", boundary),
      /Invalid fixture date/,
    );
});

test("civil-day runway rolls at Brisbane midnight, not UTC midnight", () => {
  // The actual #777 incident: Brisbane was already on 31 October at 14:00 UTC.
  assert.equal(
    runwayDays(
      "2026-10-30",
      "Australia/Brisbane",
      new Date("2026-10-30T13:59:59Z"),
    ),
    0,
  );
  assert.equal(
    runwayDays(
      "2026-10-30",
      "Australia/Brisbane",
      new Date("2026-10-30T14:00:00Z"),
    ),
    -1,
  );
  assert.equal(
    runwayDays(
      "2027-01-28",
      "Australia/Brisbane",
      new Date("2026-10-30T13:59:59Z"),
    ),
    90,
  );
  assert.throws(
    () =>
      assertRunway(
        "2027-01-28",
        "Australia/Brisbane",
        new Date("2026-10-30T14:00:00Z"),
        "reply-by",
      ),
    /89.00 days/,
  );
  // Sydney's daylight-saving day still counts as one civil day.
  assert.equal(
    runwayDays(
      "2026-10-05",
      "Australia/Sydney",
      new Date("2026-10-03T14:00:00Z"),
    ),
    1,
  );
  assert.equal(
    runwayDays(
      "2026-10-05",
      "Australia/Sydney",
      new Date("2026-10-04T13:00:00Z"),
    ),
    0,
  );
});

test("source guards catch the original reply-by cliff and both newly identified cancellation cliffs", async () => {
  for (const [path, restored] of [
    ["tests/database/conversations-context.test.ts", "2026-10-30"],
    ["tests/database/work-order-register.test.ts", "2026-11-19"],
    ["tests/database/field-closed-visit.test.ts", "2026-12-21"],
  ]) {
    const rule = fixtureRules.find((r) => r.path === path)!;
    const source = await readFile(
      new URL("../../" + path, import.meta.url),
      "utf8",
    );
    const fixture = fixtureLiterals(rule, source)[0];
    // Mutate the real fixture text in memory, not a duplicate list of expected dates.
    const changed = source.replace(
      fixture.value,
      restored + fixture.value.slice(10),
    );
    assert.throws(() => {
      for (const { value, line } of fixtureLiterals(rule, changed))
        assertRunway(
          value,
          rule.clock,
          new Date("2026-10-30T14:00:00Z"),
          `${path}:${line}`,
        );
    }, /needs at least 90/);
  }
});

test("browser form dates are guarded separately from API setup dates; missing selectors fail closed", async () => {
  const rule = fixtureRules.find(
    (r) => r.path === "tests/browser/conversations.spec.ts",
  )!;
  const source = await readFile(
    new URL("../../" + rule.path, import.meta.url),
    "utf8",
  );
  const changed = source.replace(
    /(getByLabel\(`Reply by[^\n]+\.fill\(")[^"]+/,
    "$12026-10-30",
  );
  assert.notEqual(changed, source);
  assert.ok(
    fixtureLiterals(rule, changed).some((r) => r.value === "2026-10-30"),
  );
  assert.throws(
    () => fixtureLiterals(rule, "// reply_by: '2031-12-01'"),
    /no .* literals found/,
  );
  assert.throws(
    () => fixtureLiterals(rule, source.replace(/reply_by:/, "unwatched:")),
    /literal count changed/,
  );
});

test("explicit negative/historical dates stay excluded without a moving before-today filter", async () => {
  const rule = fixtureRules.find(
    (r) => r.path === "tests/database/supply.test.ts",
  )!;
  const source = await readFile(
    new URL("../../" + rule.path, import.meta.url),
    "utf8",
  );
  const selected = fixtureLiterals(rule, source);
  assert.ok(!selected.some((r) => Object.hasOwn(rule.exclusions!, r.value)));
  assert.throws(
    () => fixtureLiterals(rule, source.replaceAll("2026-09-30", "2031-09-30")),
    /literal count changed/,
  );
  assert.throws(
    () =>
      fixtureLiterals(
        rule,
        source + '\nconst accidental = { promised_on: "2026-09-30" };',
      ),
    /must match exactly once/,
  );
  // A positive fixture that has already expired must still fail, never disappear.
  const old = source.replaceAll(selected[0].value, "2020-01-01");
  assert.ok(fixtureLiterals(rule, old).some((r) => r.value === "2020-01-01"));
});
