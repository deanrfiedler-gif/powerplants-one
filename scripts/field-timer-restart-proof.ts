// The caller owns and restarts its dedicated app/database between these phases.
// No reset, process termination or access to a working database is performed here.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { started, base } from "../tests/helpers/field";
import { wholeSecond, timerInstant } from "../src/field/timer-model";
import type { WireOperation } from "../src/offline/protocol";

const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const phase = process.argv[2];
assert.ok(phase === "write" || phase === "verify", "Use write or verify");
const serverPid = Number(process.env.PPO_RESTART_SERVER_PID);
assert.ok(
  Number.isSafeInteger(serverPid) && serverPid > 0,
  "Supply the verified app PID",
);
const root = "tmp/field-timer-restart",
  origin = config.origin;
await mkdir(root, { recursive: true });
const context = await chromium.launchPersistentContext(`${root}/profile`, {
  channel: "chrome",
  headless: true,
  viewport: { width: 1440, height: 960 },
});
const page = context.pages()[0];
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function call(path: string, body?: unknown) {
  const r = await context.request.fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin },
    data: body,
  });
  assert.ok(r.ok(), await r.text());
  return r.json();
}
async function queue() {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      store = await import(path);
    return (await store.queue((await store.ownership()).owner)).map(
      (row: { original: WireOperation; status: { state: string } }) => ({
        original: row.original,
        state: row.status.state,
      }),
    );
  });
}
async function snapshot(attendance: string) {
  const result: Record<string, unknown> = {};
  for (const [table, filter] of [
    ["field_attendances", "id=$1"],
    ["field_timers", "attendance_id=$1"],
    ["field_timer_events", "attendance_id=$1"],
    ["field_entries", "attendance_id=$1"],
    [
      "operation_receipts",
      "operation_id IN (SELECT operation_id FROM ppo.field_timer_events WHERE attendance_id=$1)",
    ],
  ] as const)
    result[table] = (
      await database().query(
        `SELECT to_jsonb(t) row FROM ppo.${table} t WHERE ${filter} ORDER BY to_jsonb(t)::text`,
        [attendance],
      )
    ).rows;
  return result;
}
try {
  const databaseStarted = (
    await database().query("SELECT pg_postmaster_start_time()::text at")
  ).rows[0].at;
  await call("local-session", { profile: "assigned-technician" });
  if (phase === "write") {
    const f = await started();
    const command = {
      ...base(),
      attendance_id: f.job.attendance!.id,
      expected_version: 0,
      action: "Start",
      occurred_at: timerInstant(
        new Date(f.job.attendance!.captured_at).toISOString(),
      ),
      scope_item_id: f.job.scope.items[0].id,
      asset_id: f.job.scope.items[0].assets[0]?.id ?? null,
    };
    const receipt = await call(`my-jobs/${f.job.id}/timer`, command);
    await page.goto(origin + "/offline/index.html");
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
    );
    await page.getByLabel("Assigned job to download").selectOption(f.job.id);
    await page
      .getByRole("button", { name: "Download selected job", exact: true })
      .click();
    await expect(page.locator("#notice")).toContainText(
      "Job context and exact pack saved",
    );
    await context.setOffline(true);
    await page
      .getByRole("button", { name: "Save pause timer locally", exact: true })
      .click();
    await expect(page.locator("#queue .queue-row")).toHaveCount(1);
    const originals = await queue(),
      retained = await snapshot(command.attendance_id);
    assert.equal(originals[0].original.payload.action, "Pause");
    await writeFile(
      `${root}/original.json`,
      JSON.stringify(
        {
          serverPid,
          databaseStarted,
          command,
          receipt,
          appointment: f.job.id,
          originals,
          retained,
        },
        null,
        2,
      ),
    );
    await page.screenshot({ path: `${root}/before.png`, fullPage: true });
    console.log(
      "Running timer and unsent offline Pause retained; restart app and PostgreSQL before verify.",
    );
  } else {
    const proof = JSON.parse(await readFile(`${root}/original.json`, "utf8"));
    assert.notEqual(serverPid, proof.serverPid, "Application restart required");
    assert.notEqual(
      databaseStarted,
      proof.databaseStarted,
      "PostgreSQL restart required",
    );
    assert.deepEqual(
      await snapshot(proof.command.attendance_id),
      proof.retained,
    );
    assert.deepEqual(
      await call(`my-jobs/${proof.appointment}/timer`, proof.command),
      proof.receipt,
    );
    await page.goto(origin + "/offline/index.html");
    assert.deepEqual(await queue(), proof.originals);
    await page
      .getByRole("button", { name: "Send next batch / retry originals" })
      .click();
    await expect
      .poll(
        async () =>
          (await call(`my-jobs/${proof.appointment}/timer`)).timer.state,
      )
      .toBe("Paused");
    await expect.poll(async () => (await queue())[0].state).toBe("ServerSaved");
    const original = proof.originals[0].original;
    const response = await call("sync/operations", {
      operations: [original],
    });
    assert.equal(response.outcomes[0].state, "ServerSaved");
    const saved = await call(`my-jobs/${proof.appointment}/timer`);
    assert.equal(saved.events.length, 2);
    assert.equal(saved.events[1].operation_id, original.operation_id);
    await call(`my-jobs/${proof.appointment}/timer`, {
      ...base(),
      attendance_id: proof.command.attendance_id,
      expected_version: 2,
      action: "Stop",
      occurred_at: wholeSecond(),
    });
    await page.screenshot({ path: `${root}/after.png`, fullPage: true });
    const evidence = {
      result: "Passed",
      server_before: proof.serverPid,
      server_after: serverPid,
      database_before: proof.databaseStarted,
      database_after: databaseStarted,
      retained_sha256: digest(proof.retained),
      offline_originals_sha256: digest(proof.originals),
      checks: [
        "Running timer and exact Time/event/arrival/receipt rows retained",
        "Fresh browser process retained owner-bound IndexedDB original",
        "Start replay returned original receipt after restart",
        "Unsent Pause accepted once and exact replay did not duplicate it",
        "Stop closed the remaining stretch",
      ],
      limits:
        "Dedicated local compiled app and PostgreSQL; not hosted deployment, backup restore or owner acceptance",
    };
    await writeFile(
      `${root}/verified.json`,
      JSON.stringify(evidence, null, 2) + "\n",
    );
    console.log(JSON.stringify(evidence));
  }
} finally {
  await context.close();
  await closeDatabase();
}
