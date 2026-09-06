import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { chromium, expect, type Page } from "@playwright/test";
import { prepareFieldAppointment } from "../tests/helpers/field-http";
import { base, startInput, draft, png } from "../tests/helpers/field";
import { decision } from "../tests/helpers/reports";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import type { WireOperation } from "../src/offline/protocol";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Requires disposable synthetic database");
const phase = process.argv[2],
  root = join(process.env.RUNNER_TEMP ?? "/tmp", "ppo-p09-restart"),
  file = join(root, "proof.json"),
  evidence = "verification-evidence/p09-restart",
  origin = "http://127.0.0.1:3000";
if (!["write", "submit", "respond", "verify"].includes(phase))
  throw Error("Use write, submit, respond or verify");
await mkdir(root, { recursive: true });
await mkdir(evidence, { recursive: true });
const server = spawn(
  process.execPath,
  ["--env-file=.env.local", "--import", "tsx", "scripts/local-server.ts"],
  { stdio: ["ignore", "inherit", "inherit"] },
);
let context:
  Awaited<ReturnType<typeof chromium.launchPersistentContext>> | undefined;
async function call(page: Page, path: string, body?: unknown) {
  const r = await page.request.fetch(`${origin}/api/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" },
    data: body,
  });
  const d = await r.json();
  assert.ok(r.ok(), JSON.stringify(d));
  return d;
}
async function originals(page: Page) {
  return page.evaluate(async () => {
    const path = "/offline/modules/offline/store.js",
      m = await import(path);
    return m.queue((await m.ownership()).owner);
  });
}
async function download(page: Page, id: string) {
  await page.goto(origin + "/offline/index.html");
  await page.locator("#available").selectOption(id);
  await page.locator("#download").click();
  await expect(page.locator("#notice")).toContainText("saved on this device");
}
try {
  let ready = false;
  for (let n = 0; n < 120; n++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready);
  context = await chromium.launchPersistentContext(join(root, "profile"), {
    headless: true,
    viewport: { width: 1440, height: 1000 },
    baseURL: origin,
  });
  const page = context.pages()[0];
  if (phase === "write") {
    await call(page, "local-session", { profile: "coordinator" });
    const setup = await prepareFieldAppointment(
      (path, b) => call(page, path, b),
      "2026-12-30",
    );
    for (const profile of ["assigned-technician", "second-technician"]) {
      await call(page, "local-session", { profile });
      const actor = await call(page, "local-session"),
        r = setup.pack.readiness.recipients.find(
          (x: { user_id: string }) => x.user_id === actor.actor_id,
        );
      await call(
        page,
        `pack-issues/${setup.pack.current_issue_id}/acknowledge`,
        {
          ...base(),
          assignment_id: r.assignment_id,
          assignment_version: r.assignment_version,
          presented_hash: setup.pack.issues[0].output_hash,
          captured_at: new Date().toISOString(),
        },
      );
    }
    await call(page, "local-session", { profile: "assigned-technician" });
    let job = (await call(page, `my-jobs/${setup.appointment_id}`)).items[0];
    await call(page, `appointments/${job.id}/start`, startInput(job));
    job = (await call(page, `my-jobs/${job.id}`)).items[0];
    await call(page, `appointments/${job.id}/completion-draft`, draft(job));
    await download(page, job.id);
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Open saved field job" }).click();
    await page
      .getByLabel("Submission reason", { exact: true })
      .fill("SYN exact submission retained through real process restarts");
    await page
      .getByRole("button", {
        name: "Save completion submission on this device",
        exact: true,
      })
      .click();
    await expect(page.locator("#notice")).toContainText(
      "Submission intent saved",
    );
    const rows = await originals(page),
      submission = rows.find(
        (x: { original: WireOperation }) =>
          x.original.command === "SubmitCompletion",
      ).original;
    await writeFile(
      file,
      JSON.stringify(
        {
          appointment_id: job.id,
          report_id: submission.payload.id,
          submission,
        },
        null,
        2,
      ),
    );
  } else {
    const proof = JSON.parse(await readFile(file, "utf8"));
    await page.goto(origin + "/offline/index.html");
    if (phase === "submit") {
      await expect(page.locator("#queue")).toContainText("LocalSaved");
      const result = await call(page, "sync/operations", {
        operations: [proof.submission],
      });
      assert.equal(result.outcomes[0].state, "ServerSaved");
      proof.submission_receipt = result.outcomes[0].receipt;
      // The browser has no accepted result yet. It retries the immutable original.
      await page.locator("#sync").click();
      await expect(page.locator("#queue")).toContainText("ServerSaved");
      await call(page, "local-session", { profile: "coordinator" });
      let r = (await call(page, `reports/${proof.report_id}`)).items[0];
      await call(page, `reports/${r.id}/review`, decision(r));
      r = (await call(page, `reports/${r.id}`)).items[0];
      await call(page, `reports/${r.id}/issue`, {
        ...base(),
        expected_version: r.version,
        revision_id: r.revisions[0].id,
        review_id: r.reviews[0].id,
        template_id: r.template.id,
        template_version: r.template.version,
      });
      r = (await call(page, `reports/${r.id}`)).items[0];
      await call(page, `report-render-jobs/${r.jobs[0].id}/retry`, {});
      await call(page, "local-session", { profile: "assigned-technician" });
      await download(page, proof.appointment_id);
      await context.setOffline(true);
      await page.reload();
      await page.getByRole("button", { name: "Open saved field job" }).click();
      await page
        .getByRole("button", { name: "Present exact cached report" })
        .first()
        .click();
      await page
        .getByLabel("Customer response", { exact: true })
        .selectOption("AcceptedWithReservations");
      await page
        .getByLabel("Stated respondent name (synthetic)")
        .fill("SYN Jordan Fictional");
      await page
        .getByLabel("Stated respondent role", { exact: true })
        .fill("Fictional site contact");
      await page
        .getByLabel("Response remarks / unavailable reason")
        .fill(
          "SYN reservations remain; owner must arrange an authorised return.",
        );
      await page
        .getByLabel("Owned next contact action")
        .fill("SYN service owner will arrange the next fictional contact.");
      await page
        .getByLabel("Optional synthetic signature PNG")
        .setInputFiles({
          name: "SYN-restart-mark.png",
          mimeType: "image/png",
          buffer: png(),
        });
      await page
        .getByRole("button", {
          name: "Save customer response on this device",
          exact: true,
        })
        .click();
      await expect(page.locator("#notice")).toContainText(
        "Response and exact presentation hash saved",
      );
      await expect(page.getByRole("button", { name: "Save customer response on this device", exact: true })).toBeDisabled();
      proof.response = (await originals(page)).find(
        (x: { original: WireOperation }) =>
          x.original.command === "CustomerResponse",
      ).original;
    } else if (phase === "respond") {
      const rows = await originals(page);
      assert.ok(
        rows.some(
          (x: { original: WireOperation; status: { state: string } }) =>
            x.original.command === "CustomerResponse" &&
            x.status.state === "LocalSaved",
        ),
      );
      const result = await call(page, "sync/operations", {
        operations: [proof.response],
      });
      assert.equal(result.outcomes[0].state, "ServerSaved");
      proof.response_receipt = result.outcomes[0].receipt;
      // Accepted server response deliberately not recorded in IndexedDB; next process recovers it.
    } else {
      await page.locator("#sync").click();
      await expect
        .poll(
          async () =>
            (await originals(page)).filter(
              (x: { status: { state: string } }) =>
                x.status.state === "ServerSaved",
            ).length,
        )
        .toBe(2);
      const again = await call(page, "sync/operations", {
        operations: [proof.submission, proof.response],
      });
      assert.deepEqual(
        again.outcomes.map((x: { receipt: unknown }) => x.receipt),
        [proof.submission_receipt, proof.response_receipt],
      );
      const report = (await call(page, `reports/${proof.report_id}`)).items[0];
      assert.equal(report.responses.length, 1);
      assert.equal(report.revisions.length, 1);
      assert.equal(report.issues.length, 1);
      assert.equal(report.appointment.status, "Completed");
      const sig = await page.request.get(
        `${origin}/api/v1/customer-responses/${report.responses[0].id}/signature`,
      );
      assert.deepEqual(await sig.body(), png());
      proof.database_facts = (
        await database().query(
          "SELECT (SELECT count(*) FROM ppo.report_revisions WHERE report_id=$1) submissions,(SELECT count(*) FROM ppo.report_reviews WHERE report_id=$1) reviews,(SELECT count(*) FROM ppo.report_issues WHERE report_id=$1) issues,(SELECT count(*) FROM ppo.customer_responses WHERE report_id=$1) responses,(SELECT count(*) FROM ppo.report_follow_ups WHERE report_id=$1) follow_ups",
          [report.id],
        )
      ).rows[0];
      assert.deepEqual(proof.database_facts, {
        submissions: "1", reviews: "1", issues: "1", responses: "1", follow_ups: "5",
      });
      await writeFile(`${evidence}/proof.json`, JSON.stringify(proof, null, 2));
      await writeFile(`${evidence}/original-mark.png`, png());
    }
    await writeFile(file, JSON.stringify(proof, null, 2));
  }
  await page.evaluate(() => scrollTo(0, 0));
  const shot = await page.screenshot({
    path: `${evidence}/${phase}.png`,
    fullPage: false,
  });
  await writeFile(
    `${evidence}/${phase}.json`,
    JSON.stringify(
      {
        scenario: `P09 actual application/PostgreSQL/browser process restart ${phase}`,
        source_head: process.env.PPO_SOURCE_HEAD,
        executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
          encoding: "utf8",
        }).trim(),
        run_id: process.env.GITHUB_RUN_ID,
        run_attempt: process.env.GITHUB_RUN_ATTEMPT,
        viewport: page.viewportSize(),
        byte_count: shot.length,
        sha256: createHash("sha256").update(shot).digest("hex"),
      },
      null,
      2,
    ),
  );
  console.log(
    `P09 ${phase}: actual process phase passed; original identities retained.`,
  );
} finally {
  await context?.close();
  server.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once("exit", () => resolve());
  });
  await closeDatabase();
}
