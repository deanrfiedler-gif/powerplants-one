import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { LocalSyntheticDocumentStore } from "../../src/documents/store";
import { excelImportSetup } from "../helpers/excel-import";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readEstimate } from "../../src/estimating/reads";
import { pricingSource } from "../helpers/excel-source-pricing";
import {
  previewExcelSourcePricing,
  applyExcelSourcePricing,
} from "../../src/estimating/import/pricing";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { landedCharges } from "../helpers/landed-costs";
import { fxEvidence } from "../helpers/source-fx";
import { pricingProposal } from "../helpers/excel-source-pricing";
import { crmBase } from "../helpers/crm";
import { readOperation } from "../../src/shared/receipts";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("XI99 populated FX-priced workbook and quotation upgrade to landed allocation with exact source, rows, grants and original ledger; reapply is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(99);
  await seed(99);
  const s = await excelImportSetup(undefined, (p) => capacityWorkbook(p, 3)),
    store = new LocalSyntheticDocumentStore(
      await realpath(await mkdtemp(join(tmpdir(), "ppo-reimport-upgrade-"))),
    );
  const accepted = await commitExcelWorkbook(s.p, s.input.id, s.command, store);
  const e = await readEstimate(s.p, accepted.receipt.record_id);
  const source = await pricingSource(s.p, e.saved.lines[0].unit, true, {
    tiers: undefined,
    fx: fxEvidence(),
  });
  const oldPricing = await pricingProposal(
    {
      ...s,
      e,
      imported: accepted,
      source: source.source,
      sourceInput: source.input,
    },
    [e.saved.lines[0].id],
  );
  const oldPriced = await applyExcelSourcePricing(
    s.p,
    e.id,
    oldPricing.command,
  );
  const quotation = await excelQuoteProposal({ ...s, e });
  const quoted = await prepareExcelQuotation(s.p, e.id, quotation.command);
  const tables = [
    "excel_source_pricings",
    "excel_imports",
    "excel_import_lines",
    "estimates",
    "estimate_versions",
    "estimate_discovery_bases",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
    "draft_quote_revisions",
    "draft_quotes",
    "estimate_quote_jobs",
    "cost_sources",
    "cost_source_revisions",
    "cost_source_events",
    "estimate_cost_source_bindings",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map(
        async (t) =>
          (
            await database().query(
              // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
              `SELECT ${t === "estimate_cost_source_bindings" ? "jsonb_build_object('landed',to_jsonb(r)->'landed') || " : ""}to_jsonb(r) value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
            )
          ).rows,
      ),
    );
  const original = await snapshot(),
    ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
  await migrate();
  assert.deepEqual(await snapshot(), original);
  const after = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(after.slice(0, ledger.length), ledger);
  assert.deepEqual(
    after.slice(ledger.length).map((r) => r.version),
    [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 114],
  );
  assert.equal(
    (await database().query("SELECT * FROM ppo.excel_reimports")).rowCount,
    0,
  );
  const version = e.saved.id;
  assert.equal(
    (await readExcelImport(s.p, accepted.receipt.record_id, version)).review
      .hash,
    s.review.review_hash,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, accepted.receipt.record_id, version, store))
      .bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    await readOperation(s.p, s.command.operation_id),
    accepted.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows,
    after,
  );
  const fxSource = await pricingSource(s.p, e.saved.lines[0].unit, true, {
    tiers: undefined,
    fx: fxEvidence(),
  });
  const current = await readEstimate(s.p, e.id);
  const proposal = {
    landed_costs: landedCharges([e.saved.lines[0].id], {
      basis: "Unit",
      allocation: undefined,
      amount: "0.10",
    }),
    estimate_version_id: current.saved.id,
    pricing_date: "2026-10-14",
    selections: [
      {
        line_id: e.saved.lines[0].id,
        source_id: fxSource.source.id,
        revision_id: fxSource.source.revision.id,
        expected_source_version: fxSource.source.version,
      },
    ],
  };
  const review = await previewExcelSourcePricing(s.p, e.id, proposal);
  const priced = await applyExcelSourcePricing(s.p, e.id, {
    ...crmBase(),
    expected_version: current.version,
    proposal,
    comparison_hash: review.review_hash,
    reviewed: true,
  });
  assert.equal(priced.receipt.record_version, 3);
  assert.equal(
    (await readEstimate(s.p, e.id)).saved.source_bindings![0].landed!
      .base_unit_cost,
    "1.01",
  );
  assert.deepEqual(
    (await applyExcelSourcePricing(s.p, e.id, oldPricing.command)).receipt,
    oldPriced.receipt,
  );
  assert.deepEqual(
    await readOperation(s.p, quotation.command.operation_id),
    quoted.receipt,
  );
  assert.deepEqual(
    (await commitExcelWorkbook(s.p, s.input.id, s.command, store)).receipt,
    accepted.receipt,
  );
});
