import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  chromium,
  expect,
  type Page,
  type APIResponse,
} from "@playwright/test";
import {
  financeHttpSource,
  httpFinanceDraft,
} from "../tests/helpers/finance-http";
import { base } from "../tests/helpers/field";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { processFinanceJob } from "../src/finance/worker";
import { documentStore } from "../src/documents/store";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Requires disposable synthetic database");
const phase = process.argv[2],
  root = join(process.env.RUNNER_TEMP ?? "/tmp", "ppo-p10-restart"),
  file = join(root, "proof.json"),
  evidence = "verification-evidence/p10-restart",
  origin = "http://127.0.0.1:3000";
if (!["write", "accept", "reconcile", "verify"].includes(phase))
  throw Error("Use write, accept, reconcile or verify");
await mkdir(root, { recursive: true });
await mkdir(evidence, { recursive: true });
const digest = (b: string | Buffer) =>
  createHash("sha256").update(b).digest("hex");
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
async function sourceBytes(page: Page, reportId: string) {
  await call(page, "local-session", { profile: "coordinator" });
  const report = (await call(page, `reports/${reportId}`)).items[0],
    issue = report.issues[0];
  const presentation = report.presentations.find(
    (p: { kind: string; revision_id: string }) =>
      p.kind === "IssuedReport" && p.revision_id === report.revisions[0].id,
  );
  const r = await page.request.get(
    `${origin}/api/v1/reports/${reportId}/pdf?presentation_id=${presentation.id}`,
  );
  assert.ok(r.ok(), await r.text());
  return {
    issue_id: issue.id,
    hash: digest(await r.body()),
    bytes: (await r.body()).length,
  };
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
  let proof;
  if (phase === "write") {
    const source = await financeHttpSource(
        (p, b) => call(page, p, b),
        "2026-12-22",
        3,
      ),
      original = await sourceBytes(page, source.report_id),
      input = await httpFinanceDraft((p, b) => call(page, p, b), source);
    await call(page, "finance/handoffs", input);
    let d = await call(page, `finance/handoffs/${input.id}`);
    await call(page, `finance/handoffs/${input.id}/submit`, {
      ...base(),
      expected_version: d.handoff.version,
    });
    await call(page, "local-session", { profile: "finance-reviewer" });
    d = await call(page, `finance/handoffs/${input.id}`);
    await call(page, `finance/handoffs/${input.id}/review`, {
      ...base(),
      expected_version: d.handoff.version,
      revision_id: d.revisions[0].id,
      source_hash: d.revisions[0].source_hash,
      decision: "Approved",
    });
    await call(page, "local-session", { profile: "finance-processor" });
    d = await call(page, `finance/handoffs/${input.id}`);
    const claim = {
        ...base(),
        expected_version: d.handoff.version,
        scenario: "AcceptedThenTimeout",
      },
      receipt = await call(
        page,
        `finance/handoffs/${input.id}/begin-processing`,
        claim,
      );
    d = await call(page, `finance/handoffs/${input.id}`);
    assert.equal(d.handoff.status, "AwaitingERP");
    assert.equal(d.targets.length, 0);
    proof = {
      id: input.id,
      source,
      original,
      claim,
      claim_receipt: receipt,
      attempt_id: d.handoff.active_attempt_id,
      correlation_id: d.attempts[0].correlation_id,
      input_hash: d.attempts[0].input_hash,
    };
  } else {
    proof = JSON.parse(await readFile(file, "utf8"));
    await call(page, "local-session", { profile: "finance-processor" });
    // Original operation receipt is recovered after a real database and application restart.
    const claimAgain = await call(
      page,
      `finance/handoffs/${proof.id}/begin-processing`,
      proof.claim,
    );
    assert.deepEqual(claimAgain, proof.claim_receipt);
    let d = await call(page, `finance/handoffs/${proof.id}`);
    assert.equal(d.attempts.length, 1);
    assert.equal(d.attempts[0].id, proof.attempt_id);
    assert.equal(d.attempts[0].correlation_id, proof.correlation_id);
    assert.equal(d.attempts[0].input_hash, proof.input_hash);
    if (phase === "accept") {
      assert.equal(d.handoff.status, "AwaitingERP");
      proof.dispatch = {
        ...base(),
        expected_version: d.handoff.version,
        attempt_id: proof.attempt_id,
        action: "Dispatch",
      };
      proof.dispatch_receipt = await call(
        page,
        `finance/handoffs/${proof.id}/record-outcome`,
        proof.dispatch,
      );
      d = await call(page, `finance/handoffs/${proof.id}`);
      assert.equal(d.handoff.status, "OutcomeUnknown");
      assert.equal(d.targets.length, 0);
      assert.equal(d.outcomes[0].outcome, "Unknown");
      assert.equal(
        (
          await database().query(
            "SELECT count(*)::int n FROM ppo.finance_simulator_targets WHERE correlation_id=$1",
            [proof.correlation_id],
          )
        ).rows[0].n,
        1,
      );
    } else if (phase === "reconcile") {
      assert.equal(d.handoff.status, "OutcomeUnknown");
      const replay = await call(
        page,
        `finance/handoffs/${proof.id}/record-outcome`,
        proof.dispatch,
      );
      assert.deepEqual(replay, proof.dispatch_receipt);
      proof.lookup = {
        ...base(),
        expected_version: d.handoff.version,
        attempt_id: proof.attempt_id,
        action: "LookupOriginal",
      };
      proof.lookup_receipt = await call(
        page,
        `finance/handoffs/${proof.id}/record-outcome`,
        proof.lookup,
      );
      await call(page, "local-session", { profile: "finance-reconciler" });
      d = await call(page, `finance/handoffs/${proof.id}`);
      assert.deepEqual(
        d.targets[0].lines.map((l: { quantity: string; uom: string }) => [
          l.quantity,
          l.uom,
        ]),
        [
          ["60", "MIN"],
          ["2", "EA"],
        ],
      );
      proof.target_id = d.targets[0].id;
      await call(page, `finance/handoffs/${proof.id}/reconcile`, {
        ...base(),
        expected_version: d.handoff.version,
        outcome_id: d.outcomes[0].id,
        basis:
          "F-06 independently checked: exact 60 MIN and 2 EA target, 30 MIN reviewed non-billable. Original operation recovered across actual restarts.",
      });
      d = await call(page, `finance/handoffs/${proof.id}`);
      await call(page, `finance/handoffs/${proof.id}/request-evidence`, {
        ...base(),
        expected_version: d.handoff.version,
        revision_id: d.revisions[0].id,
        review_id: d.reviews[0].id,
        reconciliation_id: d.reconciliations[0].id,
      });
      d = await call(page, `finance/handoffs/${proof.id}`);
      proof.job_id = d.jobs[0].id;
      const failed = await processFinanceJob(proof.job_id, {
        afterStore: async () => {
          throw Error(
            "SYN restart with original bytes durable and issue finalisation not committed",
          );
        },
      });
      assert.equal("state" in failed && failed.state, "Failed");
      const j = d.jobs[0],
        originalBundle = await documentStore().locate({
          workspace_id: j.workspace_id,
          actor_id: j.actor_id,
          operation_id: j.id,
        });
      assert.ok(originalBundle);
      proof.bundle_hash = digest(originalBundle.bytes);
      proof.bundle_size = originalBundle.bytes.length;
      proof.reserved_issue_id = j.render_snapshot.output.issue_id;
      proof.prepared_at = j.render_snapshot.output.prepared_at;
      assert.equal(
        (await call(page, `finance/handoffs/${proof.id}`)).issues.length,
        0,
      );
    } else {
      const again = await call(
        page,
        `finance/handoffs/${proof.id}/record-outcome`,
        proof.lookup,
      );
      assert.deepEqual(again, proof.lookup_receipt);
      await call(page, "local-session", { profile: "finance-reconciler" });
      await call(page, `finance/jobs/${proof.job_id}/retry`, {});
      d = await call(page, `finance/handoffs/${proof.id}`);
      assert.equal(d.handoff.status, "Reconciled");
      assert.equal(d.issues.length, 1);
      assert.equal(d.issues[0].id, proof.reserved_issue_id);
      assert.equal(d.issues[0].manifest.prepared_at, proof.prepared_at);
      assert.equal(d.targets.length, 1);
      assert.equal(d.targets[0].id, proof.target_id);
      const j = d.jobs[0],
        originalBundle = await documentStore().locate({
          workspace_id: j.workspace_id,
          actor_id: j.actor_id,
          operation_id: j.id,
        });
      assert.ok(originalBundle);
      assert.equal(digest(originalBundle.bytes), proof.bundle_hash);
      assert.equal(originalBundle.bytes.length, proof.bundle_size);
      for (const format of ["html", "pdf"]) {
        const r: APIResponse = await page.request.get(
          `${origin}/api/v1/finance/issues/${proof.reserved_issue_id}/bytes?format=${format}`,
        );
        const b: Buffer = await r.body();
        assert.ok(r.ok());
        assert.equal(digest(b), d.issues[0].manifest[`${format}_hash`]);
        await writeFile(`${evidence}/original-output.${format}`, b);
      }
      proof.manifest = d.issues[0].manifest;
      assert.deepEqual(
        await sourceBytes(page, proof.source.report_id),
        proof.original,
      );
      await call(page, "local-session", { profile: "finance-reconciler" });
      await writeFile(`${evidence}/proof.json`, JSON.stringify(proof, null, 2));
    }
  }
  await writeFile(file, JSON.stringify(proof, null, 2));
  await page.goto(`${origin}/finance/handoffs/${proof.id}`);
  await expect(page.locator("h1")).toContainText("FH");
  await expect(
    page
      .getByText(
        phase === "write"
          ? "Awaiting ERP"
          : phase === "accept"
            ? "Outcome Unknown"
            : "Reconciled",
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  const shot = await page.screenshot({
    path: `${evidence}/${phase}.png`,
    fullPage: false,
  });
  await writeFile(
    `${evidence}/${phase}.json`,
    JSON.stringify(
      {
        scenario: `P10 original claim, possible acceptance and durable output through actual restart: ${phase}`,
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
        sha256: digest(shot),
      },
      null,
      2,
    ),
  );
  console.log(
    `P10 ${phase}: actual application/browser phase passed; original operation and bytes preserved.`,
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
