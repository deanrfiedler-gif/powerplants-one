import { database } from "../../src/platform/database";
import { authoredAnchor, shiftFixtureDate } from "../../scripts/fixture-dates";

// Seeding moves the scheduling fixtures into the database's own future by one whole-day
// offset (scripts/fixture-dates.ts). Tests keep naming the authored instants, because
// those say what the fixture means, and read them through here so they land in the frame
// this database was actually seeded with. Never hard-code a date that the planner or the
// readiness rules will compare against the real clock: it will pass until it silently
// does not.

/** Appointment a8/1, whose start is the anchor the whole P05 family is arranged around. */
const anchorAppointment = "a8000000-0000-4000-8000-000000000001";

/**
 * Whole days this database's fixtures sit ahead of the authored ones. Deliberately not
 * cached: suites reset and reseed between tests, and a run that crosses UTC midnight
 * would otherwise carry a stale shift into the tests after it.
 */
export async function fixtureShift(): Promise<number> {
  const { rows } = await database().query(
    "SELECT start_at FROM ppo.appointments WHERE id=$1",
    [anchorAppointment],
  );
  if (!rows[0])
    throw new Error(
      "The P05 anchor appointment is missing; seed the database before reading fixture time.",
    );
  const seeded = new Date(rows[0].start_at as string | Date).getTime();
  const days = (seeded - Date.parse(authoredAnchor)) / 86_400_000;
  if (!Number.isInteger(days))
    throw new Error(`The seeded anchor is not a whole number of days away: ${days}`);
  return days;
}

/** Read an authored instant in this database's frame. */
export async function fixtureTime(authored: string): Promise<string> {
  return shiftFixtureDate(authored, await fixtureShift());
}

/** The same, as a Date. */
export async function fixtureDate(authored: string): Promise<Date> {
  return new Date(await fixtureTime(authored));
}
