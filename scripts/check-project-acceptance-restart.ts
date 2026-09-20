// Windows local proof only: the explicitly task-owned PG cluster and port 3010.
// It stops/restarts only its own application child and this verified cluster.
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { open, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { launchDocumentBrowser } from "../src/platform/browser";
import { httpAcceptance } from "../tests/helpers/acceptance-http";
const config = localConfig(),
  root = resolve(
    process.env.LOCALAPPDATA!,
    "PowerplantsOne/pj09-restart-proof",
  ),
  cluster = join(root, "data"),
  bin = "C:/Program Files/PostgreSQL/16/bin/pg_ctl.exe";
assert.equal(config.database_name, "ppo_synthetic_test");
assert.equal(config.port, 3010);
assert.equal(new URL(config.database_url).port, "55439");
const actual = (await database().query("SHOW data_directory")).rows[0]
  .data_directory;
assert.equal(resolve(actual).toLowerCase(), cluster.toLowerCase());
await closeDatabase();
const out = resolve("tmp/pj09-evidence");
await mkdir(out, { recursive: true });
const h = httpAcceptance(config.origin);
let app: ChildProcess | undefined;
async function start() {
  const stdout = await open(join(root, "application.log"), "a"),
    stderr = await open(join(root, "application-error.log"), "a");
  app = spawn(
    process.execPath,
    [
      "--env-file=.env.pj09-restart.local",
      "--import",
      "tsx",
      "scripts/local-server.ts",
      "--compiled",
    ],
    {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ["ignore", stdout.fd, stderr.fd],
    },
  );
  await stdout.close();
  await stderr.close();
  for (let i = 0; i < 120; i++) {
    if (app.exitCode !== null)
      throw Error("Owned review application failed to start");
    try {
      if ((await fetch(config.origin + "/login")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw Error("Owned application readiness timeout");
}
async function stop() {
  if (app && app.exitCode === null) {
    const ended = once(app, "exit");
    app.kill();
    await ended;
  }
  app = undefined;
}
const browser = await launchDocumentBrowser();
try {
  await start();
  console.log("Started owned compiled application on 3010.");
  const j = await h.readyJourney(),
    firstPid = app!.pid,
    pgBefore = (await readFile(join(cluster, "postmaster.pid"), "utf8")).split(
      "\n",
    )[0];
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    page = await context.newPage();
  await page.request.post(config.origin + "/api/v1/local-session", {
    headers: { Origin: config.origin },
    data: { profile: "coordinator" },
  });
  const url =
    config.origin +
    `/projects/acceptance/closeout?project=${j.project}&stage=${j.stage}&panel=closed`;
  await page.goto(url);
  await page
    .getByRole("button", { name: "Review stage closeout", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Reason / decision record")
    .fill("SYN lost response after exact closeout commit");
  await dialog.getByRole("checkbox").last().check();
  let operation = "";
  await page.route("**/api/v1/projects/acceptance", async (route) => {
    const body = route.request().postDataJSON();
    if (body?.action !== "closeStage") {
      await route.continue();
      return;
    }
    operation = body.operation_id;
    const response = await route.fetch();
    assert.equal(response.status(), 201);
    await route.abort("failed");
  });
  await dialog
    .getByRole("button", { name: "Review stage closeout", exact: true })
    .click();
  await page
    .getByText("Outcome unknown — check the original operation.", {
      exact: true,
    })
    .waitFor();
  assert(operation);
  await page.screenshot({ path: out + "/lost-response.png" });
  const receipt = (await h.call("coordinator", "operations/" + operation)).body;
  const original = async () => {
    const r = await fetch(
      config.origin +
        `/api/v1/projects/acceptance/files/${j.customer.id}?format=pdf`,
      { headers: { cookie: await h.cookie("coordinator") } },
    );
    assert.equal(r.status, 200);
    return createHash("sha256")
      .update(Buffer.from(await r.arrayBuffer()))
      .digest("hex");
  };
  const bytesBefore = await original(),
    counts = async () =>
      (
        await database().query(
          "SELECT (SELECT count(*)::int FROM ppo.acceptance_decisions WHERE stage_id=$1 AND kind='Stage closeout') AS closes,(SELECT count(*)::int FROM ppo.acceptance_requests WHERE project_id=$2) AS requests,(SELECT count(*)::int FROM ppo.acceptance_responses WHERE project_id=$2) AS responses,(SELECT count(*)::int FROM ppo.acceptance_followups WHERE stage_id=$1) AS followups",
          [j.stage, j.project],
        )
      ).rows[0],
    before = await counts();
  assert.equal(before.closes, 1);
  await context.close();
  await stop();
  await closeDatabase();
  const restarted = spawnSync(
    bin,
    [
      "restart",
      "-D",
      cluster,
      "-m",
      "fast",
      "-l",
      join(root, "postgres.log"),
      "-t",
      "30",
    ],
    { windowsHide: true, encoding: "utf8" },
  );
  assert.equal(restarted.status, 0, restarted.stderr);
  console.log("Owned PostgreSQL stopped and restarted.");
  await start();
  assert.notEqual(app!.pid, firstPid);
  const pgAfter = (
    await readFile(join(cluster, "postmaster.pid"), "utf8")
  ).split("\n")[0];
  assert.notEqual(pgAfter, pgBefore);
  assert.equal(await original(), bytesBefore);
  assert.deepEqual(
    (await h.call("coordinator", "operations/" + operation)).body,
    receipt,
  );
  assert.deepEqual(await counts(), before);
  const second = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await second.request.post(config.origin + "/api/v1/local-session", {
    headers: { Origin: config.origin },
    data: { profile: "coordinator" },
  });
  await second.goto(url);
  await second
    .getByRole("button", {
      name: "Review closeStage · Original result available",
      exact: true,
    })
    .click();
  await second.getByText("Accepted once", { exact: true }).waitFor();
  await second.screenshot({ path: out + "/restart-recovery.png" });
  await second
    .getByRole("button", { name: "Confirm original result", exact: true })
    .click();
  await second.getByRole("dialog").waitFor({ state: "hidden" });
  assert.deepEqual(await counts(), before);
  await writeFile(
    out + "/restart-results.json",
    JSON.stringify(
      {
        build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
        project: j.project,
        stage: j.stage,
        operation,
        applicationPids: [firstPid, app!.pid],
        postgresPids: [pgBefore, pgAfter],
        pdfSha256: bytesBefore,
        counts: before,
        actualProcessRestarts: true,
        lostResponse:
          "Browser intercepted successful upstream commit and aborted the client response; recovery used the server-held original after both process restarts.",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: lost response, original receipt, decision/request counts and exact PDF survive actual application and database restarts.",
  );
} finally {
  await browser.close();
  await stop();
  await closeDatabase();
}
