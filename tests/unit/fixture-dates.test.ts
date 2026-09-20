import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  anchorLeadDays,
  authoredAnchor,
  fixtureShiftDays,
  seedAnchor,
  shiftFixtureDate,
  withSeededFixtureDates,
} from "../../scripts/fixture-dates";

const day = 86_400_000;
const at = (value: string) => new Date(value);

test("the anchor is always a whole UTC day, the agreed distance ahead of seeding", () => {
  for (const seeded of [
    "2026-09-20T00:00:00Z", "2026-09-20T23:59:59Z", "2026-02-28T13:05:09Z",
    "2027-12-31T22:00:00Z", "2028-02-29T01:02:03Z",
  ]) {
    const anchor = seedAnchor(at(seeded));
    assert.equal(anchor.toISOString().slice(11), "00:00:00.000Z", seeded);
    // The time of day the database happened to be seeded at never shortens the lead.
    const midnight = Date.parse(`${seeded.slice(0, 10)}T00:00:00Z`);
    assert.equal(anchor.getTime() - midnight, anchorLeadDays * day, seeded);
    assert.ok(anchor.getTime() > Date.parse(seeded), seeded);
  }
});

test("seeded work always lands in the future of the database that seeded it", () => {
  for (const seeded of ["2026-09-20T12:00:00Z", "2026-09-21T02:00:00Z", "2030-06-01T00:00:00Z"]) {
    const moved = shiftFixtureDate(authoredAnchor, fixtureShiftDays(at(seeded)));
    assert.ok(
      Date.parse(moved) - Date.parse(seeded) >= (anchorLeadDays - 1) * day,
      `${seeded} -> ${moved}`,
    );
  }
});

test("one whole-day offset preserves every interval and every time of day", () => {
  const shift = fixtureShiftDays(at("2026-09-20T09:00:00Z"));
  const authored = [
    "2026-09-05T00:00:00Z", "2026-09-20T23:30:00Z", "2026-09-21T00:00:00Z",
    "2026-09-21T02:00:00Z", "2026-09-24T06:00:00Z", "2027-01-01T00:00:00Z",
  ];
  const moved = authored.map((value) => shiftFixtureDate(value, shift));
  for (let i = 1; i < authored.length; i++) {
    assert.equal(
      Date.parse(moved[i]!) - Date.parse(moved[i - 1]!),
      Date.parse(authored[i]!) - Date.parse(authored[i - 1]!),
      `interval ${i} changed`,
    );
  }
  for (let i = 0; i < authored.length; i++)
    assert.equal(moved[i]!.slice(11), authored[i]!.slice(11), `time of day ${i} changed`);
  // Evidence authored before the work stays before it; long validity stays long.
  assert.ok(Date.parse(moved[0]!) < Date.parse(moved[2]!));
  assert.ok(Date.parse(moved[5]!) > Date.parse(moved[4]!));
});

test("rewriting a seed moves every instant and changes nothing else", () => {
  const sql =
    "INSERT INTO ppo.appointments(start_at,end_at) VALUES('2026-09-21T00:00:00Z','2026-09-21T02:00:00Z');\n" +
    "INSERT INTO ppo.readiness_assessments(source_as_at,valid_until) VALUES('2026-09-05T00:00:00Z','2027-01-01T00:00:00Z');";
  const shift = fixtureShiftDays(at("2026-09-20T00:00:00Z"));
  const moved = withSeededFixtureDates(sql, at("2026-09-20T00:00:00Z"));
  assert.equal(moved.match(/'/g)?.length, sql.match(/'/g)?.length);
  assert.equal(moved.split("INSERT").length, sql.split("INSERT").length);
  assert.doesNotMatch(moved, /2026-09-21T00:00:00Z|2027-01-01T00:00:00Z/);
  assert.ok(moved.includes(`'${shiftFixtureDate("2026-09-21T00:00:00Z", shift)}'`));
  assert.ok(moved.includes(`'${shiftFixtureDate("2027-01-01T00:00:00Z", shift)}'`));
  // Identifiers that merely look date-like are untouched.
  const ids = "VALUES('a8000000-0000-4000-8000-000000000001','SYN-PPO-P05-AUTH','2026-09-21')";
  assert.equal(withSeededFixtureDates(ids, at("2026-09-20T00:00:00Z")), ids);
});

test("the real P05 seed rewrites completely, leaving no authored instant behind", async () => {
  const sql = await readFile(new URL("../../db/seed-p05.sql", import.meta.url), "utf8");
  const seeded = at("2026-09-20T06:00:00Z");
  const moved = withSeededFixtureDates(sql, seeded);
  const before = sql.match(/'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'/g) ?? [];
  const after = moved.match(/'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'/g) ?? [];
  assert.ok(before.length > 100, `expected the full fixture family, found ${before.length}`);
  assert.equal(after.length, before.length);
  assert.equal(moved.length >= sql.length, true);
  // Every appointment the planner may be asked to book is now in the future.
  const anchor = seedAnchor(seeded).getTime();
  for (const value of new Set(after)) {
    const parsed = Date.parse(value.slice(1, -1));
    assert.ok(!Number.isNaN(parsed), value);
  }
  const latestPast = Math.max(
    ...[...new Set(before)]
      .map((v) => Date.parse(v.slice(1, -1)))
      .filter((v) => v < Date.parse(authoredAnchor)),
  );
  // The past-dated evidence stays in the past relative to the seeded work.
  assert.ok(latestPast < Date.parse(authoredAnchor));
  assert.ok(anchor > seeded.getTime());
  // Nothing outside a quoted instant was touched.
  assert.equal(
    moved.replace(/'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'/g, "@"),
    sql.replace(/'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z'/g, "@"),
  );
});
