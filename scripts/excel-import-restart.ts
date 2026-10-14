import { pricingSource } from "../tests/helpers/excel-source-pricing";
import { crmBase } from "../tests/helpers/crm";
import { launchDocumentBrowser } from "../src/platform/browser";
import { capacityWorkbook } from "../tests/helpers/excel-capacity";
// Write before, verify after actual compiled application and PostgreSQL restarts.
import { excelQuoteProposal } from "../tests/helpers/excel-quotation";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { digest } from "../src/documents/store";
import { httpAcceptance } from "../tests/helpers/acceptance-http";
import { excelImportSetup } from "../tests/helpers/excel-import";
import {
  revisionCommand,
  changedWorkbook,
} from "../tests/helpers/excel-reimport";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
const origin = localConfig().origin,
  h = httpAcceptance(origin);
const directory =
  process.env.PPO_EXCEL_PROOF_DIRECTORY ??
  "verification-evidence/excel-import-restart";
const file = join(directory, "checkpoint.json");
async function json(path: string, body?: unknown) {
  const result = await h.call("coordinator", path, body);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.body;
}
async function bytes(path: string) {
  const r = await fetch(origin + "/api/v1/" + path + "/source", {
    headers: { cookie: await h.cookie("coordinator") },
  });
  assert.equal(r.status, 200);
  return Buffer.from(await r.arrayBuffer());
}
const started = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text AS value"))
    .rows[0].value;
async function snapshot(id: string) {
  return (
    await database().query(
      `SELECT * FROM (
  SELECT 'estimate' AS kind,to_jsonb(e) AS value FROM ppo.estimates e WHERE id=$1
  UNION ALL SELECT 'version',to_jsonb(v) FROM ppo.estimate_versions v WHERE estimate_id=$1
  UNION ALL SELECT 'import',to_jsonb(i) FROM ppo.excel_imports i WHERE estimate_id=$1
  UNION ALL SELECT 'reimport',to_jsonb(i) FROM ppo.excel_reimports i WHERE estimate_id=$1
  UNION ALL SELECT 'pricing',to_jsonb(i) FROM ppo.excel_source_pricings i WHERE estimate_id=$1
  UNION ALL SELECT 'source_binding',to_jsonb(b) FROM ppo.estimate_cost_source_bindings b WHERE estimate_version_id IN (SELECT id FROM ppo.estimate_versions WHERE estimate_id=$1)
  UNION ALL SELECT 'source_header',to_jsonb(s) FROM ppo.cost_sources s WHERE id IN (SELECT source_id FROM ppo.cost_source_revisions WHERE id IN (SELECT source_revision_id FROM ppo.estimate_cost_source_bindings WHERE estimate_version_id IN (SELECT id FROM ppo.estimate_versions WHERE estimate_id=$1)))
  UNION ALL SELECT 'source_event',to_jsonb(e) FROM ppo.cost_source_events e WHERE revision_id IN (SELECT source_revision_id FROM ppo.estimate_cost_source_bindings WHERE estimate_version_id IN (SELECT id FROM ppo.estimate_versions WHERE estimate_id=$1))
  UNION ALL SELECT 'source_revision',to_jsonb(r) FROM ppo.cost_source_revisions r WHERE id IN (SELECT source_revision_id FROM ppo.estimate_cost_source_bindings WHERE estimate_version_id IN (SELECT id FROM ppo.estimate_versions WHERE estimate_id=$1))
  UNION ALL SELECT 'line',to_jsonb(l) FROM ppo.excel_import_lines l WHERE estimate_version_id IN (SELECT estimate_version_id FROM ppo.excel_imports WHERE estimate_id=$1)
  UNION ALL SELECT 'quote',to_jsonb(q) FROM ppo.draft_quote_revisions q WHERE estimate_id=$1
  UNION ALL SELECT 'quote_header',to_jsonb(q) FROM ppo.draft_quotes q WHERE estimate_id=$1
  UNION ALL SELECT 'quote_job',to_jsonb(j) FROM ppo.estimate_quote_jobs j WHERE revision_id IN (SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
  UNION ALL SELECT 'quote_receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id IN (SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
  UNION ALL SELECT 'quote_audit',to_jsonb(a) FROM ppo.audit_events a WHERE object_id IN (SELECT id FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
  UNION ALL SELECT 'quote_outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE payload->>'record_id' IN (SELECT id::text FROM ppo.draft_quote_revisions WHERE estimate_id=$1)
  UNION ALL SELECT 'receipt',to_jsonb(r) FROM ppo.operation_receipts r WHERE record_id=$1
  UNION ALL SELECT 'audit',to_jsonb(a) FROM ppo.audit_events a WHERE object_id=$1
  UNION ALL SELECT 'outbox',to_jsonb(j) FROM ppo.outbox_jobs j WHERE payload->>'record_id'=$1::text
 ) evidence ORDER BY kind,value::text`,
      [id],
    )
  ).rows;
}
try {
  if (process.argv[2] === "write") {
    const pricing = process.argv[3] === "pricing";
    const capacity = pricing || process.argv[3] === "capacity";
    const s = await excelImportSetup(
        undefined,
        capacity ? (p) => capacityWorkbook(p, 500) : undefined,
      ),
      commitPath = `estimating/workspaces/${s.input.id}/excel-import/commit`;
    const accepted = await json(commitPath, s.command),
      id = accepted.receipt.record_id;
    const estimate = await json(`estimating/estimates/${id}`);
    if (capacity) assert.equal(estimate.saved.lines.length, 500);
    const path = `estimating/estimates/${id}/excel-import/${estimate.saved.id}`;
    const evidence = await json(path),
      original = await bytes(path);
    assert.deepEqual(original, Buffer.from(s.upload.file.base64, "base64"));
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, "original.xlsx"), original);
    const revision = await revisionCommand(
      s,
      capacity ? (p) => capacityWorkbook(p, 500, true) : changedWorkbook,
    );
    revision.command.decisions.forEach((d) => (d.action = "Remove"));
    const revisionPath = commitPath.replace(/commit$/, "reimport");
    const revised = await json(revisionPath, revision.command);
    const successor = await json(`estimating/estimates/${id}`);
    const successorPath = `estimating/estimates/${id}/excel-import/${successor.saved.id}`;
    const successorEvidence = await json(successorPath),
      revisedBytes = await bytes(successorPath);
    assert.deepEqual(
      revisedBytes,
      Buffer.from(revision.command.file.base64, "base64"),
    );
    assert.deepEqual(await json(path), evidence);
    assert.deepEqual(await bytes(path), original);
    await writeFile(join(directory, "revised.xlsx"), revisedBytes);
    let pricingCheckpoint = null;
    if (pricing) {
      const source = await pricingSource(s.p, successor.saved.lines[0].unit);
      const pricingPath = `estimating/estimates/${id}/excel-source-pricing`;
      const proposal = {
        estimate_version_id: successor.saved.id,
        pricing_date: "2026-10-14",
        selections: successor.saved.lines.map((line: { id: string }) => ({
          line_id: line.id,
          source_id: source.source.id,
          revision_id: source.source.revision.id,
          expected_source_version: source.source.version,
        })),
      };
      const pricingStarted = performance.now();
      const review = await json(pricingPath + "/preview", proposal);
      const previewMs = performance.now() - pricingStarted;
      assert.equal(review.comparison.after.cost, "375.00");
      const command = {
        ...crmBase(),
        expected_version: successor.version,
        proposal,
        comparison_hash: review.review_hash,
        reviewed: true,
      };
      const saveStarted = performance.now();
      const priced = await json(pricingPath, command);
      const saveMs = performance.now() - saveStarted;
      const current = await json(`estimating/estimates/${id}`);
      assert.equal(current.saved.source_bindings.length, 500);
      const evidencePath = `estimating/estimates/${id}/versions/${current.saved.id}/excel-source-pricing`;
      const evidence = await json(evidencePath);
      pricingCheckpoint = {
        path: pricingPath,
        command,
        receipt: priced.receipt,
        evidencePath,
        evidence,
        timings_ms: {
          preview: Math.round(previewMs),
          save: Math.round(saveMs),
        },
      };
    }
    const quoteProposal = await excelQuoteProposal({ ...s, e: successor });
    const quoteCommitPath = `estimating/estimates/${id}/excel-quote`;
    const quoteAccepted = await json(quoteCommitPath, quoteProposal.command);
    const quotePath = `estimating/quotes/${quoteProposal.command.id}`;
    await json(quotePath + "/render", {});
    const quoteEvidence = await json(quotePath + "/excel-import");
    const quoteDetail = await json(quotePath);
    if (capacity) {
      assert.equal(successor.saved.lines.length, 500);
      assert.equal(quoteDetail.snapshot.items.length, 500);
      assert.equal(quoteDetail.snapshot.total, "1250.00");
    }
    for (const kind of ["html", "pdf"]) {
      const r = await fetch(
        origin + "/api/v1/" + quotePath + "/file?kind=" + kind,
        { headers: { cookie: await h.cookie("coordinator") } },
      );
      assert.equal(r.status, 200);
      await writeFile(
        join(directory, "exact." + kind),
        Buffer.from(await r.arrayBuffer()),
      );
    }
    if (capacity) {
      const browser = await launchDocumentBrowser();
      try {
        const page = await browser.newPage();
        for (const width of [1440, 390, 320]) {
          await page.setViewportSize({ width, height: 960 });
          await page.setContent(
            await readFile(join(directory, "exact.html"), "utf8"),
          );
          const text = await page.locator("body").innerText();
          assert.equal(
            new Set(
              [...text.matchAll(/SYN capacity line (\d+)/g)].map((m) =>
                Number(m[1]),
              ),
            ).size,
            500,
          );
          assert.equal(
            await page.locator(".total").innerText(),
            "Draft total AUD 1250.00",
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.screenshot({
            path: join(directory, `capacity-${width}.png`),
          });
        }
        await writeFile(
          join(directory, "capacity-browser.json"),
          JSON.stringify(
            {
              status: "passed",
              lines: 500,
              total: "1250.00",
              viewports: [1440, 390, 320],
              browser: browser.version(),
            },
            null,
            2,
          ),
        );
      } finally {
        await browser.close();
      }
    }
    await writeFile(
      file,
      JSON.stringify(
        {
          id,
          path,
          commitPath,
          command: s.command,
          receipt: accepted.receipt,
          evidence,
          rows: await snapshot(id),
          pricing: pricingCheckpoint,
          quotation: {
            path: quotePath,
            commitPath: quoteCommitPath,
            command: quoteProposal.command,
            receipt: quoteAccepted.receipt,
            evidence: quoteEvidence,
            detail: quoteDetail,
          },
          sha256: digest(original),
          revision: {
            path: successorPath,
            commitPath: revisionPath,
            command: revision.command,
            receipt: revised.receipt,
            evidence: successorEvidence,
            sha256: digest(revisedBytes),
          },
          postmaster: await started(),
        },
        null,
        2,
      ),
    );
    console.log(
      "XI08 saved original and revised workbooks, successor, quotation, HTML/PDF and operations before restart.",
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(file, "utf8"));
    assert.notEqual(
      await started(),
      data.postmaster,
      "Restart the actual PostgreSQL instance before verification.",
    );
    assert.deepEqual(await snapshot(data.id), data.rows);
    if (data.pricing) {
      assert.deepEqual(
        await json(data.pricing.evidencePath),
        data.pricing.evidence,
      );
      assert.deepEqual(
        await json("operations/" + data.pricing.command.operation_id),
        data.pricing.receipt,
      );
      const recovered = await json(data.pricing.path, data.pricing.command);
      assert.equal(recovered.replayed, true);
      assert.deepEqual(recovered.receipt, data.pricing.receipt);
    }
    assert.deepEqual(
      await json(data.quotation.path + "/excel-import"),
      data.quotation.evidence,
    );
    assert.deepEqual(await json(data.quotation.path), data.quotation.detail);
    assert.deepEqual(
      await json("operations/" + data.quotation.command.operation_id),
      data.quotation.receipt,
    );
    const quoteReplay = await json(
      data.quotation.commitPath,
      data.quotation.command,
    );
    assert.equal(quoteReplay.replayed, true);
    assert.deepEqual(quoteReplay.receipt, data.quotation.receipt);
    for (const kind of ["html", "pdf"]) {
      const r = await fetch(
        origin + "/api/v1/" + data.quotation.path + "/file?kind=" + kind,
        { headers: { cookie: await h.cookie("coordinator") } },
      );
      assert.equal(r.status, 200);
      assert.deepEqual(
        Buffer.from(await r.arrayBuffer()),
        await readFile(join(directory, "exact." + kind)),
      );
    }
    assert.deepEqual(await snapshot(data.id), data.rows);
    assert.deepEqual(await json(data.revision.path), data.revision.evidence);
    assert.deepEqual(
      await bytes(data.revision.path),
      await readFile(join(directory, "revised.xlsx")),
    );
    assert.equal(digest(await bytes(data.revision.path)), data.revision.sha256);
    assert.deepEqual(
      await json("operations/" + data.revision.command.operation_id),
      data.revision.receipt,
    );
    const revisedReplay = await json(
      data.revision.commitPath,
      data.revision.command,
    );
    assert.equal(revisedReplay.replayed, true);
    assert.deepEqual(revisedReplay.receipt, data.revision.receipt);
    assert.deepEqual(await json(data.path), data.evidence);
    assert.deepEqual(
      await bytes(data.path),
      await readFile(join(directory, "original.xlsx")),
    );
    assert.equal(digest(await bytes(data.path)), data.sha256);
    assert.deepEqual(
      await json("operations/" + data.command.operation_id),
      data.receipt,
    );
    const replay = await json(data.commitPath, data.command);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, data.receipt);
    assert.deepEqual(await snapshot(data.id), data.rows);
    await writeFile(
      join(directory, "result.json"),
      JSON.stringify(
        {
          status: "passed",
          source_sha256: data.sha256,
          revised_source_sha256: data.revision.sha256,
          postmaster_changed: true,
          exact_rows: true,
          exact_workbook: true,
          ...(data.pricing
            ? {
                exact_managed_pricing: true,
                source_bindings: 500,
                timings_ms: data.pricing.timings_ms,
              }
            : {}),
          exact_quotation_and_outputs: true,
          original_receipt: true,
          replay_without_new_rows: true,
        },
        null,
        2,
      ),
    );
    console.log(
      "XI08 both exact workbooks, versions, comparison, decisions, quotation, HTML/PDF and original receipts survived PostgreSQL and app restarts.",
    );
  } else throw Error("Choose write or verify.");
} finally {
  await closeDatabase();
}
