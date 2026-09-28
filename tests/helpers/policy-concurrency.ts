import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { database } from "../../src/platform/database";
import { rows } from "./policy-commands";
// Test-only PostgreSQL barrier, with observed pg_blocking_pids edges rather than
// timing assumptions. The first actual command holds the shared workspace lock.
export async function serialised<T, U>(
  first: () => Promise<T>,
  second: () => Promise<U>,
  operationRetry = false,
  barrier: "publication" | "appointment" = "publication",
) {
  const gate = await database().connect(),
    key = 540003;
  const pid = (await gate.query("SELECT pg_backend_pid() pid")).rows[0].pid;
  await gate.query("SELECT pg_advisory_lock($1)", [key]);
  await rows(
    `CREATE FUNCTION ppo.policy_publication_barrier() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(${key}); RETURN NEW; END $$`,
  );
  const table =
    barrier === "publication"
      ? "scheduling_policy_publications"
      : "appointments";
  await rows(
    `CREATE TRIGGER policy_publication_barrier AFTER ${barrier === "publication" ? "INSERT" : "UPDATE"} ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.policy_publication_barrier()`,
  );
  const waitFor = async (blocker: number, query?: RegExp) => {
    const until = Date.now() + 8000;
    while (Date.now() < until) {
      const waiting = await rows(
        "SELECT pid,query FROM pg_stat_activity WHERE datname=current_database() AND $1=ANY(pg_blocking_pids(pid))",
        [blocker],
      );
      const match = waiting.find((r) => !query || query.test(r.query));
      if (match) return match;
      await setTimeout(15);
    }
    throw Error(
      "Expected controlled PostgreSQL blocking edge was not observed",
    );
  };
  let firstRun: Promise<PromiseSettledResult<T>> | undefined,
    secondRun: Promise<PromiseSettledResult<U>> | undefined;
  const settle = <V>(promise: Promise<V>) =>
    Promise.allSettled([promise]).then(([result]) => result);
  try {
    firstRun = settle(first());
    const held = await waitFor(pid);
    secondRun = settle(second());
    const blocked = await waitFor(
      held.pid,
      operationRetry ? /pg_advisory_xact_lock/ : /ppo\.workspaces.*FOR UPDATE/s,
    );
    assert.notEqual(blocked.pid, held.pid);
    await gate.query("SELECT pg_advisory_unlock($1)", [key]);
    return [await firstRun, await secondRun] as const;
  } finally {
    await gate.query("SELECT pg_advisory_unlock($1)", [key]);
    await firstRun;
    if (secondRun) await secondRun;
    await rows(`DROP TRIGGER policy_publication_barrier ON ppo.${table}`);
    await rows("DROP FUNCTION ppo.policy_publication_barrier()");
    gate.release();
  }
}
