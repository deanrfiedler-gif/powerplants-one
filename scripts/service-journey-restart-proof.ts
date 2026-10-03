// Continue the existing selected browser journey without creating another job.
// The caller owns the disposable app/database and their actual restart.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { chromium, expect } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";

const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const phase = process.argv[2];
assert.ok(phase === "write" || phase === "verify", "Use write or verify");
const appPid = Number(process.env.PPO_RESTART_SERVER_PID);
assert.ok(
  Number.isSafeInteger(appPid) && appPid > 0,
  "Supply the verified app PID",
);
const input = process.argv[3] ?? "tmp/service-journey-results";
const output = process.argv[4] ?? "tmp/service-journey-restart";
await mkdir(output, { recursive: true });
const hash = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
type Journey = {
  appointment_id: string;
  work_order_id: string;
  old_issue_id: string;
  current_issue_id: string;
  report_id: string;
  presentation: { id: string };
  return_proposal: { record_id: string };
  finance: { handoff_id: string; issue: { id: string } };
  page_errors: string[];
};
async function sources(path: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await sources(child)));
    else if (entry.name === "P11-selected-journey.json") files.push(child);
  }
  return files.sort();
}
async function records() {
  // Inspect current live tables, including later amendments, not old DDL.
  const tables = (
    await database().query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='ppo'
      AND table_type='BASE TABLE' AND (table_name IN
      ('work_orders','appointments','operation_receipts','service_reports','customer_responses',
       'customer_response_contexts','activities','activity_links','attendance_acceptances')
      OR table_name ~ '^(field_|report_|finance_|pack_)') ORDER BY table_name`,
    )
  ).rows;
  const snapshot: Record<string, { rows: number; sha256: string }> = {};
  for (const { table_name: name } of tables) {
    assert.match(name, /^[a-z_]+$/);
    const rows = (
      await database().query(
        `SELECT to_jsonb(t) row FROM ppo."${name}" t ORDER BY to_jsonb(t)::text`,
      )
    ).rows;
    snapshot[name] = { rows: rows.length, sha256: hash(JSON.stringify(rows)) };
  }
  for (const name of [
    "field_entries",
    "service_reports",
    "customer_responses",
    "finance_reconciliations",
    "operation_receipts",
  ])
    assert.ok(snapshot[name].rows > 0, `${name} must contain journey evidence`);
  return snapshot;
}
const browser = await chromium.launch({ channel: "chrome" });
try {
  const paths = await sources(input);
  assert.equal(
    paths.length,
    2,
    "Require both successful desktop and phone journey artifacts",
  );
  const databaseStarted = (
    await database().query("SELECT pg_postmaster_start_time()::text at")
  ).rows[0].at;
  const outputs: Record<string, { bytes: number; sha256: string }> = {};
  const retained: unknown[] = [];
  for (let index = 0; index < paths.length; index++) {
    const sourceBytes = await readFile(paths[index]);
    const source: Journey = JSON.parse(sourceBytes.toString("utf8"));
    const returnPath = join(dirname(paths[index]), "P11-return-visit.json");
    const completedReturn = (await readdir(dirname(paths[index]))).includes(
      "P11-return-visit.json",
    )
      ? JSON.parse(await readFile(returnPath, "utf8"))
      : null;
    assert.deepEqual(source.page_errors, []);
    const phone = paths[index].includes("mobile");
    const context = await browser.newContext({
      viewport: phone
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
      isMobile: phone,
      hasTouch: phone,
      locale: "en-AU",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function request(path: string, body?: unknown) {
      const response = await context.request.fetch(
        `${config.origin}/api/v1/${path}`,
        {
          method: body === undefined ? "GET" : "POST",
          headers: { origin: config.origin },
          data: body,
        },
      );
      assert.ok(response.ok(), `${path}: ${await response.text()}`);
      assert.match(response.headers()["cache-control"], /no-store/);
      return response;
    }
    async function call(path: string, body?: unknown) {
      return (await request(path, body)).json();
    }
    async function original(path: string) {
      const bytes = await (await request(path)).body();
      outputs[`${index}:${path}`] = {
        bytes: bytes.length,
        sha256: hash(bytes),
      };
    }
    await call("local-session", { profile: "coordinator" });
    const proposal = (
      await call(`appointments/${source.return_proposal.record_id}`)
    ).items[0];
    assert.equal(proposal.status, completedReturn ? "Cancelled" : "Proposed");
    assert.deepEqual(proposal.assignments, []);
    assert.equal(proposal.customer_commitment, completedReturn ? "Changed" : "Unknown");
    if (completedReturn) {
      assert.equal(completedReturn.cancelled_proposal_id, proposal.id);
      const visit = (
        await call(`appointments/${completedReturn.appointment_id}`)
      ).items[0];
      assert.equal(visit.status, "Completed");
      assert.equal(visit.work_order_id, source.work_order_id);
      const returnedReport = (
        await call(`reports/${completedReturn.report_id}`)
      ).items[0];
      assert.equal(returnedReport.status, "Issued");
      assert.equal(
        returnedReport.revisions[0].snapshot.completion.scope_outcome,
        "Complete",
      );
      assert.deepEqual(returnedReport.responses, []);
      for (const [path, expected] of Object.entries(
        completedReturn.return_outputs,
      )) {
        await original(path);
        assert.equal(outputs[`${index}:${path}`].sha256, expected);
      }
    }
    const report = (await call(`reports/${source.report_id}`)).items[0];
    assert.equal(report.status, "Issued");
    assert.equal(report.responses.length, 1);
    assert.equal(report.responses[0].response, "AcceptedWithReservations");
    for (const id of [source.old_issue_id, source.current_issue_id])
      for (const format of ["html", "pdf", "manifest"])
        await original(`pack-issues/${id}/${format}`);
    for (const format of ["html", "pdf", "manifest"])
      await original(
        `reports/${source.report_id}/${format}?presentation_id=${source.presentation.id}`,
      );
    await call("local-session", { profile: "finance-reconciler" });
    const finance = await call(`finance/handoffs/${source.finance.handoff_id}`);
    assert.equal(finance.handoff.status, "Reconciled");
    assert.equal(finance.targets.length, 1);
    for (const format of ["html", "pdf"])
      await original(
        `finance/issues/${source.finance.issue.id}/bytes?format=${format}`,
      );
    await call("local-session", { profile: "second-technician" });
    const job = (await call(`my-jobs/${source.appointment_id}`)).items[0];
    assert.equal(job.attendance, null);
    await page.goto(`${config.origin}/my-jobs/${source.appointment_id}`);
    await expect(
      page.getByRole("heading", {
        name: "Saved evidence and corrections",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/original offline finding/).first(),
    ).toBeVisible();
    await expect(page.getByText(/SYN corrected finding/).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Correct this .* entry$/ }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/FINANCE_PRIVATE_CANARY|P11_PRIVATE_REVIEW_CANARY/),
    ).toHaveCount(0);
    if (phase === "verify")
      await page.screenshot({
        path: `${output}/${phone ? "phone" : "desktop"}-history.png`,
        fullPage: true,
      });
    await page.goto(`${config.origin}/service/reports/${source.report_id}`);
    await expect(
      page.getByRole("heading", { name: /Revision 2 · Issued/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Commit exact review", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/FINANCE_PRIVATE_CANARY|P11_PRIVATE_REVIEW_CANARY/),
    ).toHaveCount(0);
    const denied = await context.request.get(
      `${config.origin}/api/v1/finance/handoffs/${source.finance.handoff_id}`,
    );
    assert.ok([403, 404].includes(denied.status()));
    assert.match(denied.headers()["cache-control"], /no-store/);
    if (completedReturn) {
      await call("local-session", { profile: "assigned-technician" });
      for (const [path, expected] of Object.entries(
        completedReturn.return_photo,
      )) {
        await original(path);
        assert.equal(outputs[`${index}:${path}`].sha256, expected);
      }
      const next = (await call(`my-jobs/${completedReturn.appointment_id}`))
        .items[0];
      assert.equal(next.attendance, null);
      assert.equal(
        next.entries.filter((e: { kind: string }) => e.kind === "Time").length,
        1,
      );
      await page.goto(
        `${config.origin}/my-jobs/${completedReturn.appointment_id}`,
      );
      const history = page.getByRole("heading", {
        name: "Saved evidence and corrections",
        exact: true,
      });
      await expect(history).toBeVisible();
      await history.scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: /^Correct this .* entry$/ }),
      ).toHaveCount(0);
      if (phase === "verify")
        await page.screenshot({
          path: `${output}/${phone ? "phone" : "desktop"}-return-history.png`,
          fullPage: true,
        });
    }
    assert.deepEqual(errors, []);
    retained.push({
      viewport: phone ? "phone" : "desktop",
      source_sha256: hash(sourceBytes),
      appointment_id: source.appointment_id,
      work_order_id: source.work_order_id,
      report_id: source.report_id,
      return_proposal_id: source.return_proposal.record_id,
      finance_handoff_id: source.finance.handoff_id,
      return_status: proposal.status,
      completed_return: completedReturn
        ? {
            source_sha256: hash(await readFile(returnPath)),
            appointment_id: completedReturn.appointment_id,
            report_id: completedReturn.report_id,
            status: "Completed",
          }
        : null,
      customer_commitment: proposal.customer_commitment,
      customer_response: report.responses[0].response,
      finance_status: finance.handoff.status,
      page_errors: errors,
    });
    await context.close();
  }
  const snapshot = { records: await records(), outputs, journeys: retained };
  const sourceHead = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const workingTree = execFileSync("git", ["status", "--short"], {
    encoding: "utf8",
  }).trim();
  const sourceFiles: Record<string, string> = {};
  for (const path of [
    "src/components/work-timer.tsx",
    "tests/browser/quality-journey.spec.ts",
    "tests/helpers/quality-report.ts",
    "scripts/service-journey-restart-proof.ts",
    "tests/helpers/quality-return.ts",
  ])
    sourceFiles[path] = hash(
      (await readFile(path, "utf8")).replace(/\r\n/g, "\n"),
    );
  const build = (await readFile(".next/BUILD_ID", "utf8")).trim();
  if (phase === "write") {
    await writeFile(
      `${output}/before.json`,
      JSON.stringify(
        {
          appPid,
          databaseStarted,
          sourceHead,
          workingTree,
          sourceFiles,
          build,
          snapshot,
        },
        null,
        2,
      ),
    );
  } else {
    const before = JSON.parse(await readFile(`${output}/before.json`, "utf8"));
    assert.notEqual(
      appPid,
      before.appPid,
      "Application process must actually restart",
    );
    assert.notEqual(
      databaseStarted,
      before.databaseStarted,
      "PostgreSQL must actually restart",
    );
    assert.equal(
      sourceHead,
      before.sourceHead,
      "This proof is restart, not a software upgrade",
    );
    assert.deepEqual(
      snapshot,
      before.snapshot,
      "Original records, receipts and bytes must be unchanged",
    );
    assert.equal(build, before.build);
    assert.deepEqual(sourceFiles, before.sourceFiles);
    await writeFile(
      `${output}/verified.json`,
      JSON.stringify(
        {
          source_head: sourceHead,
          compiled_build: build,
          source_files_sha256_lf: sourceFiles,
          environment: {
            node: process.version,
            chrome: browser.version(),
            platform: process.platform,
          },
          working_tree_at_write: before.workingTree,
          working_tree_at_verify: workingTree,
          verified_at: new Date().toISOString(),
          before: {
            app_pid: before.appPid,
            database_started: before.databaseStarted,
          },
          after: { app_pid: appPid, database_started: databaseStarted },
          ...snapshot,
          boundary:
            "Existing desktop and phone selected journeys retained through actual application and PostgreSQL restart; same next-technician history and exact outputs.",
          limits:
            "Completed return visits are proved only where completed_return is present; otherwise proposals remain unassigned. No backup restore, compatible software update, policy publication, owner/device acceptance or full PT-28/PT-30 closure.",
        },
        null,
        2,
      ),
    );
  }
  console.log(
    `${phase}: two selected journeys, ${Object.keys(outputs).length} original outputs and retained record hashes passed`,
  );
} finally {
  await browser.close();
  await closeDatabase();
}
