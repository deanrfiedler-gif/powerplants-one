// The P05 fixtures were authored around a fixed near-future day. The application is
// right to refuse past-dated work — the planner only books attendance that has not
// started, and expired evidence cannot clear a readiness control — so once real time
// passes those literals the fixtures stop describing a legal situation and the suites
// fail for a reason that has nothing to do with the change under test.
//
// Rather than name new dates, shift the whole family by one offset when it is seeded.
// A single offset preserves every interval between the fixtures exactly, so ordering,
// adjacency, schedule windows and evidence validity keep the meaning they were authored
// with. The offset is a whole number of days, so each fixture also keeps its time of day.
//
// This runs at seed time only. Seeds are applied once per database and guarded by
// ppo.seed_receipts, so an existing database keeps the rows it already has.

/** The day the P05 fixtures were written around: appointment a8/1 starts here. */
export const authoredAnchor = "2026-09-21T00:00:00Z";

/** Keep the seeded work this far beyond the seeding day, so a fresh database has room. */
export const anchorLeadDays = 8;

const dayMs = 86_400_000;

/** UTC midnight `anchorLeadDays` ahead of `seededAt`. Always a whole day boundary. */
export function seedAnchor(seededAt: Date): Date {
  const midnight = Date.UTC(
    seededAt.getUTCFullYear(),
    seededAt.getUTCMonth(),
    seededAt.getUTCDate(),
  );
  return new Date(midnight + anchorLeadDays * dayMs);
}

/** Whole days between the authored anchor and the anchor this database should use. */
export function fixtureShiftDays(seededAt: Date): number {
  return Math.round(
    (seedAnchor(seededAt).getTime() - Date.parse(authoredAnchor)) / dayMs,
  );
}

/** Move one authored instant into the seeded frame. */
export function shiftFixtureDate(authored: string, shiftDays: number): string {
  const at = Date.parse(authored);
  if (Number.isNaN(at)) throw new Error(`Not a fixture timestamp: ${authored}`);
  return new Date(at + shiftDays * dayMs).toISOString().replace(/\.000Z$/, "Z");
}

// Only fully specified UTC instants are fixture dates. A bare date, a local time or a
// value with an offset is left alone rather than guessed at.
const instant = /'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)'/g;

/**
 * Rewrite every UTC instant literal in a seed file into the seeded frame. Every literal
 * moves by the same whole number of days, including the past-dated evidence and the
 * long-validity dates, so their distance from the seeded work is unchanged.
 */
export function withSeededFixtureDates(sql: string, seededAt: Date): string {
  const shiftDays = fixtureShiftDays(seededAt);
  if (shiftDays === 0) return sql;
  return sql.replace(instant, (_match, value: string) =>
    `'${shiftFixtureDate(value, shiftDays)}'`,
  );
}

/**
 * Seed versions whose fixtures are scheduling work the application will refuse once it
 * is in the past. P04's own appointment is authored in the past deliberately and is left
 * where it is; P06's long-validity dates are a separate, later cliff.
 */
export const seededFixtureVersions: readonly number[] = [5];

/**
 * Shift the calendar day at the front of a fixture value, keeping whatever follows it
 * exactly as written. Browser specs name days ("2026-10-01") and site-local datetimes
 * ("2026-10-10T10:00") that a UI control parses, so they cannot go through ISO instants
 * without changing what is typed into the field.
 */
export function shiftFixtureCalendarDay(value: string, shiftDays: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(value);
  if (!match) throw new Error(`Not a fixture date: ${value}`);
  const [, year, month, day, rest] = match;
  const moved = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) + shiftDays * dayMs,
  );
  return `${moved.toISOString().slice(0, 10)}${rest}`;
}
