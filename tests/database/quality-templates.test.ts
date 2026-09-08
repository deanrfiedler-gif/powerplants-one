import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { reset, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  reconciledFinance,
  readFinance,
  principal,
  base,
  rows,
} from "../helpers/finance";
import { readBundle } from "../../src/documents/worker";
import { readReportBundle } from "../../src/reports/worker";
import {
  requestFinanceEvidence,
  processFinanceJob,
  financeIssueBytes,
} from "../../src/finance/worker";
import { digest } from "../../src/documents/store";
import { supportedTemplateDefinition } from "../../src/documents/p11-template";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable test database required");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("P11 successor outputs embed exact complete brand assets and preserve original definitions, repeat seeds and restricted Finance", async () => {
  for (const [family, table] of [
    ["OUT-09", "pack_templates"],
    ["OUT-10", "report_templates"],
    ["OUT-14", "finance_templates"],
  ] as const) {
    const templates = await rows(`SELECT * FROM ppo.${table} ORDER BY version`);
    assert.deepEqual(
      templates.map((t) => t.version),
      [1, 2],
    );
    for (const t of templates) {
      assert.equal(
        t.definition,
        await supportedTemplateDefinition(family, t.version),
      );
      assert.equal(t.content_hash, digest(t.definition));
    }
  }
  const q = await reconciledFinance(),
    d = await readFinance(q.reconciler, q.id);
  await requestFinanceEvidence(q.reconciler, q.id, {
    ...base(),
    expected_version: d.handoff.version,
    revision_id: d.handoff.current_revision_id,
    review_id: d.reviews[0].id,
    reconciliation_id: d.reconciliations[0].id,
  });
  const job = (
    await rows("SELECT id FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      q.id,
    ])
  )[0];
  await processFinanceJob(job.id);
  const packIssue = (
    await rows("SELECT * FROM ppo.pack_issues ORDER BY issued_at DESC")
  )[0];
  const reportIssue = (
    await rows("SELECT * FROM ppo.report_issues ORDER BY issued_at DESC")
  )[0];
  const financeIssue = (
    await rows("SELECT * FROM ppo.finance_issues WHERE handoff_id=$1", [q.id])
  )[0];
  assert.ok(financeIssue, "Actual Finance renderer must issue successfully");
  const pack = await readBundle(
    await principal("coordinator"),
    packIssue.manifest,
  );
  const report = await readReportBundle(q.q.reviewer, reportIssue.manifest);
  const finance = {
    html: (
      await financeIssueBytes(q.reconciler, financeIssue.id, { format: "html" })
    ).bytes.toString("utf8"),
    pdf: (
      await financeIssueBytes(q.reconciler, financeIssue.id, { format: "pdf" })
    ).bytes,
  };
  const font = await readFile("public/brand/Roboto-variable.woff"),
    logo = await readFile("public/brand/powerplants-logo-green-white.png");
  const root = "verification-evidence/p11-template-db";
  await mkdir(root, { recursive: true });
  for (const [family, output, manifest] of [
    ["OUT-09", pack, packIssue.manifest],
    ["OUT-10", report, reportIssue.manifest],
    ["OUT-14", finance, financeIssue.manifest],
  ] as const) {
    assert.match(output.html, /ppo-output-template/);
    if (family !== "OUT-14")
      assert.ok(
        Buffer.byteLength(output.html) <= 1024 * 1024,
        "Complete branded output retains the existing offline presentation bound",
      );
    assert.deepEqual(
      Buffer.from(
        output.html.match(/data:font\/woff;base64,([A-Za-z0-9+/=]+)/)![1],
        "base64",
      ),
      font,
    );
    assert.deepEqual(
      Buffer.from(
        output.html.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)![1],
        "base64",
      ),
      logo,
    );
    assert.equal(digest(output.html), manifest.html_hash);
    assert.equal(digest(output.pdf), manifest.pdf_hash);
    for (const [extension, bytes] of [
      ["html", Buffer.from(output.html)],
      ["pdf", output.pdf],
    ] as const) {
      const filename = `${family}-P11-template-v2.${extension}`;
      await writeFile(`${root}/${filename}`, bytes);
      await writeFile(
        `${root}/${filename}.proof.json`,
        JSON.stringify(
          {
            scenario:
              "Real database/renderer template component; not UI or full PT execution",
            source_head: process.env.PPO_SOURCE_HEAD,
            executed_checkout: execFileSync("git", ["rev-parse", "HEAD"], {
              encoding: "utf8",
            }).trim(),
            executed_tree: execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
              encoding: "utf8",
            }).trim(),
            run_id: process.env.GITHUB_RUN_ID,
            run_attempt: process.env.GITHUB_RUN_ATTEMPT,
            byte_count: bytes.length,
            sha256: digest(bytes),
            viewport: null,
            page_count:
              extension === "pdf"
                ? [...bytes.toString("latin1").matchAll(/\/Type\s*\/Page\b/g)]
                    .length
                : null,
            manifest,
          },
          null,
          2,
        ),
      );
    }
  }
  assert.ok(
    !pack.html.includes(
      "offline, reviewed reports and Finance remain incomplete",
    ),
  );
  assert.match(pack.html, /Wait for each local save to complete/);
  const originals = await rows(
    "SELECT * FROM ppo.report_presentations ORDER BY id",
  );
  await seed();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.report_presentations ORDER BY id"),
    originals,
  );
  assert.deepEqual(
    await readBundle(await principal("coordinator"), packIssue.manifest),
    pack,
  );
  assert.deepEqual(
    await readReportBundle(q.q.reviewer, reportIssue.manifest),
    report,
  );
  await assert.rejects(
    financeIssueBytes(await principal("assigned-technician"), financeIssue.id, {
      format: "html",
    }),
    (e: unknown) =>
      ["Forbidden", "RecordUnavailable"].includes((e as { code: string }).code),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='finance.read'",
    [q.reconciler.workspace_id, q.reconciler.actor_id],
  );
  await assert.rejects(
    financeIssueBytes(q.reconciler, financeIssue.id, { format: "pdf" }),
    (e: unknown) =>
      ["Forbidden", "RecordUnavailable"].includes((e as { code: string }).code),
  );
});
