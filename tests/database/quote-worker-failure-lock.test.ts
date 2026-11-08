import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { setTimeout as pause } from "node:timers/promises";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  readQuoteJob,
  runQuoteJob,
  QuoteWorkerInterrupted,
} from "../../src/estimating/worker";
import { crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const unavailable = (error: unknown) =>
  (error as { code?: string }).code === "ExactDraftUnavailable";
// Only the storage/lease protocol is under test. This deliberately synthetic
// renderer is not evidence of valid PDF output or real browser rendering.
const render = async () => ({
  pdf: Buffer.from("%PDF-1.4\nSYN quote-worker protocol fixture\n%%EOF"),
  browser_version: "synthetic-worker-test",
});
async function fixture() {
  const p = (await createSession("coordinator")).principal;
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const input = estimateInput(opportunity.id);
  await createEstimate(p, input);
  const estimate = await readEstimate(p, input.id);
  const quote = quoteCommand(estimate.saved);
  await prepareQuote(p, input.id, quote);
  const { j } = await readQuoteJob(p, quote.id);
  assert.equal(j.state, "Pending");
  assert.equal(j.attempts, 0);
  return { p, j };
}
async function job(id: string) {
  const result = await database().query(
    "SELECT * FROM ppo.estimate_quote_jobs WHERE id=$1",
    [id],
  );
  assert.equal(result.rowCount, 1);
  return result.rows[0];
}
async function attempts(id: string) {
  return (
    await database().query(
      "SELECT attempt,outcome,code FROM ppo.estimate_quote_attempts WHERE job_id=$1 ORDER BY attempt,outcome",
      [id],
    )
  ).rows;
}
async function assertFailed(id: string) {
  const result = await job(id);
  assert.equal(result.state, "Failed");
  assert.equal(result.attempts, 1);
  assert.equal(result.error_code, "DraftRenderFailed");
  assert.equal(result.lease_token, null);
  assert.equal(result.lease_until, null);
  assert.equal(result.manifest, null);
  assert.deepEqual(await attempts(id), [
    { attempt: 1, outcome: "Claimed", code: null },
    { attempt: 1, outcome: "Failed", code: "DraftRenderFailed" },
  ]);
}

test("quote failure waits for the workspace SHARE reader before changing the job or inserting its attempt", async (t) => {
  const { p, j } = await fixture();
  const reader = await database().connect();
  let worker: Promise<unknown> | undefined;
  try {
    const readerPid = (await reader.query("SELECT pg_backend_pid() AS pid"))
      .rows[0].pid;
    const locked = Promise.withResolvers<void>();
    // Claim must commit first, or SHARE would block the claim instead of failure.
    worker = runQuoteJob(j.id, {
      render: async () => {
        await reader.query("BEGIN");
        await reader.query(
          "SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE",
          [p.workspace_id],
        );
        locked.resolve();
        throw Error("SYN renderer failure after claim");
      },
    }).then(
      () => assert.fail("The failing worker must reject"),
      (error: unknown) => error,
    );
    await Promise.race([
      locked.promise,
      worker.then(() => assert.fail("Worker ended before the reader locked")),
    ]);

    const started = performance.now();
    let waiting: {
      pid: number;
      wait_event_type: string;
      wait_event: string;
    }[] = [];
    while (performance.now() - started < 5000) {
      waiting = (
        await database().query(
          `SELECT pid,wait_event_type,wait_event FROM pg_stat_activity
           WHERE datname=current_database() AND state='active'
             AND wait_event_type='Lock' AND $1=ANY(pg_blocking_pids(pid))
             AND query='SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE'`,
          [readerPid],
        )
      ).rows;
      if (waiting.length) break;
      await pause(10);
    }
    assert.equal(
      waiting.length,
      1,
      "exactly one worker waits on this reader's workspace lock",
    );
    assert.notEqual(waiting[0].pid, readerPid);
    assert.equal(waiting[0].wait_event_type, "Lock");
    assert.ok(waiting[0].wait_event);
    const running = await job(j.id);
    assert.equal(running.state, "Running");
    assert.equal(running.attempts, 1);
    assert.ok(running.lease_token);
    assert.equal(running.error_code, null);
    assert.deepEqual(await attempts(j.id), [
      { attempt: 1, outcome: "Claimed", code: null },
    ]);
    t.diagnostic(
      `Observed failure wait ${waiting[0].wait_event_type}/${waiting[0].wait_event} after ${(performance.now() - started).toFixed(1)} ms`,
    );
    await reader.query("COMMIT");
    assert.ok(unavailable(await worker));
    await assertFailed(j.id);
  } finally {
    await reader.query("ROLLBACK");
    reader.release();
    await worker;
  }
});

test("quote failure remains recordable after preparation authority is revoked after durable storage", async () => {
  const { p, j } = await fixture();
  let revoked = 0;
  await assert.rejects(
    runQuoteJob(j.id, {
      render,
      afterStore: async () => {
        assert.equal((await job(j.id)).state, "Running");
        await transaction(async (c) => {
          await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
            p.workspace_id,
          ]);
          const result = await c.query(
            `UPDATE ppo.permission_grants SET valid_to=clock_timestamp()
             WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.quote.prepare'
               AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp())`,
            [p.workspace_id, p.actor_id],
          );
          revoked = result.rowCount!;
        });
        assert.ok(
          revoked > 0,
          "at least one live preparation grant was revoked",
        );
      },
    }),
    unavailable,
  );
  assert.ok(revoked > 0, "the afterStore hook ran before the success recheck");
  await assertFailed(j.id);
});

test("a stale failure after native lease reclaim leaves the new lease and attempt ledger unchanged", async () => {
  const { j } = await fixture();
  let reclaimed: Awaited<ReturnType<typeof job>> | undefined;
  let ledger: Awaited<ReturnType<typeof attempts>> | undefined;
  let reclaimVerified = false;
  await assert.rejects(
    runQuoteJob(j.id, {
      render: async () => {
        const original = await job(j.id);
        assert.equal(original.state, "Running");
        assert.equal(original.attempts, 1);
        // Expire only the clock fixture; native runQuoteJob performs the reclaim.
        await database().query(
          "UPDATE ppo.estimate_quote_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",
          [j.id],
        );
        await assert.rejects(
          runQuoteJob(j.id, {
            render,
            afterStore: async () => {
              throw new QuoteWorkerInterrupted("SYN reclaimed worker exit");
            },
          }),
          QuoteWorkerInterrupted,
        );
        reclaimed = await job(j.id);
        assert.equal(reclaimed.state, "Running");
        assert.equal(reclaimed.attempts, 2);
        assert.ok(reclaimed.lease_token);
        assert.notEqual(reclaimed.lease_token, original.lease_token);
        ledger = await attempts(j.id);
        assert.deepEqual(ledger, [
          { attempt: 1, outcome: "Claimed", code: null },
          { attempt: 2, outcome: "Claimed", code: null },
        ]);
        reclaimVerified = true;
        throw Error(
          "SYN old worker fails after another worker reclaimed its lease",
        );
      },
    }),
    unavailable,
  );
  // Worker catches hook errors too: do not let a failed assertion in the hook
  // masquerade as the deliberate old-worker failure above.
  assert.equal(reclaimVerified, true);
  assert.ok(reclaimed, "native reclaim completed before the old failure");
  assert.deepEqual(await job(j.id), reclaimed);
  assert.deepEqual(await attempts(j.id), ledger);
});
