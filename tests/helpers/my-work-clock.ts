// The approved morning scenario needs a whole day ahead of it. Only the
// dedicated My Work browser server uses this instant. PostgreSQL write/audit
// timestamps, other servers and the manual scenario keep their real clocks.
export function browserScenarioNow(wallClock = new Date()) {
  // Keep the read snapshot after real database creation timestamps, including
  // a journey crossing midnight. The worker passes this exact instant to its
  // server; the two processes never independently choose their scenario day.
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" })
    .format(new Date(wallClock.getTime() + 2 * 86400000));
  return new Date(`${day}T08:40:00+10:00`).toISOString();
}
export const MY_WORK_NOW = process.env.PPO_MY_WORK_BROWSER_NOW
  ? new Date(process.env.PPO_MY_WORK_BROWSER_NOW).toISOString()
  : browserScenarioNow();
export const MY_WORK_CLOCK_QUERY = "SELECT clock_timestamp() AS now";

export function myWorkClockQuery(query: unknown) {
  return query === MY_WORK_CLOCK_QUERY
    ? `SELECT '${MY_WORK_NOW}'::timestamptz AS now`
    : query;
}
