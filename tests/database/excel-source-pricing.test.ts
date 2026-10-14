import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  applyExcelSourcePricing,
  previewExcelSourcePricing,
  readExcelSourcePricing,
} from "../../src/estimating/import/pricing";
import {
  readExcelImport,
  readExcelSource,
} from "../../src/estimating/import/retained";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import { reviseCostSource } from "../../src/estimating/sources/commands";
import { previewSourceRefresh } from "../../src/estimating/sources/refresh";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readQuoteJob } from "../../src/estimating/worker";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import {
  pricingSetup,
  pricingProposal,
  pricingSource,
} from "../helpers/excel-source-pricing";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { revisionCommand } from "../helpers/excel-reimport";
import { excelSnapshot } from "../helpers/excel-review-database";
import { crmBase } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
async function snapshot() {
  return {
    native: await excelSnapshot(),
    evidence: (
      await database().query(
        "SELECT to_jsonb(p) value FROM ppo.excel_source_pricings p ORDER BY estimate_version_id",
      )
    ).rows,
    bindings: (
      await database().query(
        "SELECT to_jsonb(b) value FROM ppo.estimate_cost_source_bindings b ORDER BY estimate_version_id,line_id",
      )
    ).rows,
  };
}
test("XI pricing retains originals, independent comparison and exact duplicate receipt; quote excludes private evidence", async () => {
  const s = await pricingSetup(),
    before = await snapshot();
  const original = await readExcelImport(s.p, s.e.id, s.e.saved.id);
  const { review, command } = await pricingProposal(s);
  assert.deepEqual(await snapshot(), before);
  assert.equal(review.comparison.before.cost, "3.75");
  assert.equal(review.comparison.after.cost, "2.25");
  assert.equal(review.comparison.after.sell, "7.50");
  assert.equal(review.comparison.cost_change, "-1.50");
  assert.ok(
    review.workbook_values.every((l) => l.original?.unit_cost === "1.25"),
  );
  assert.ok(
    review.comparison.changes.every((l) => l.warning?.includes("Unknown")),
  );
  const saved = await Promise.all([
    applyExcelSourcePricing(s.p, s.e.id, command),
    applyExcelSourcePricing(s.p, s.e.id, command),
  ]);
  assert.equal(saved.filter((r) => r.replayed).length, 1);
  assert.deepEqual(saved[0].receipt, saved[1].receipt);
  const next = await readEstimate(s.p, s.e.id);
  assert.equal(next.saved.source_bindings?.length, 3);
  assert.deepEqual(
    next.saved.lines.map((l) => l.id),
    s.e.saved.lines.map((l) => l.id),
  );
  assert.deepEqual(await readExcelImport(s.p, s.e.id, s.e.saved.id), original);
  assert.deepEqual(
    (await readExcelSource(s.p, s.e.id, s.e.saved.id)).bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    (await readExcelSourcePricing(s.p, s.e.id, next.saved.id)).review,
    review,
  );
  assert.deepEqual(
    await readOperation(s.p, command.operation_id),
    saved[0].receipt,
  );
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...command,
      reason: "Changed intent",
    }),
    code("OperationConflict"),
  );
  const q = await excelQuoteProposal(s);
  assert.equal(q.review.reconciliation.quote_total, "7.50");
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  const job = await readQuoteJob(s.p, q.command.id);
  assert.equal(job.q.safe_snapshot.items.length, 3);
  assert.doesNotMatch(
    job.q.input_html,
    /SYN-SOURCE|SYN-NOTE|source_revision_id|unit_cost|review_event_id/,
  );
  await assert.rejects(
    database().query("UPDATE ppo.excel_source_pricings SET reason='changed'"),
    code("55000"),
  );
});
test("XI pricing refuses unreviewed, wrong-unit, invalid-date, wrong-company and duplicate mappings without mutations", async () => {
  const s = await pricingSetup();
  const raw = await pricingSource(s.p, s.e.saved.lines[0].unit, false);
  const wrongUnit = await pricingSource(s.p, "other-unit");
  const expired = await pricingSource(s.p, s.e.saved.lines[0].unit, true, {
    valid_until: "2026-10-13",
  });
  const minimum = await pricingSource(s.p, s.e.saved.lines[0].unit, true, {
    tiers: [{ minimum_quantity: "2", unit_cost: "0.60" }],
  });
  const aboveSell = await pricingSource(s.p, s.e.saved.lines[0].unit, true, {
    tiers: [{ minimum_quantity: "1", unit_cost: "3.00" }],
  });
  const { proposal, command } = await pricingProposal(s);
  const other = (await createSession("second-company")).principal;
  const before = await snapshot();
  const selected = (source: typeof raw.source) => ({
    ...proposal,
    selections: [
      {
        ...proposal.selections[0],
        source_id: source.id,
        revision_id: source.revision.id,
        expected_source_version: source.version,
      },
    ],
  });
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, selected(expired.source)),
    code("SourceOutsideValidity"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, selected(minimum.source)),
    code("SourceQuantityBelowMinimum"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, selected(aboveSell.source)),
    code("InvalidData"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, selected(raw.source)),
    code("ReviewedSourceRequired"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, selected(wrongUnit.source)),
    code("SourceUnitMismatch"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, {
      ...proposal,
      pricing_date: "2026-08-31",
    }),
    code("SourceOutsideValidity"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, {
      ...proposal,
      selections: [proposal.selections[0], proposal.selections[0]],
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, {
      ...proposal,
      selections: [{ ...proposal.selections[0], line_id: randomUUID() }],
    }),
    code("EstimateLineUnavailable"),
  );
  await assert.rejects(previewExcelSourcePricing(other, s.e.id, proposal));
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, { ...command, reviewed: false }),
    code("InvalidData"),
  );
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...command,
      comparison_hash: "a".repeat(64),
    }),
    code("ExcelPricingReviewChanged"),
  );
  assert.deepEqual(await snapshot(), before);
});
test("XI pricing rejects changed source and estimate; accepted historical replay survives later versions", async () => {
  const s = await pricingSetup(),
    first = await pricingProposal(s, [s.e.saved.lines[0].id]);
  const accepted = await applyExcelSourcePricing(s.p, s.e.id, first.command);
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...first.command,
      operation_id: randomUUID(),
    }),
    code("EstimateVersionChanged"),
  );
  const second = await pricingProposal(s, [s.e.saved.lines[1].id]);
  await reviseCostSource(s.p, s.source.id, {
    ...crmBase(),
    expected_version: s.source.version,
    content: {
      ...s.source.revision.content,
      title: "SYN changed current source header",
    },
  });
  const before = await snapshot();
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, second.command),
    code("VersionConflict"),
  );
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (await applyExcelSourcePricing(s.p, s.e.id, first.command)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(s.p, first.command.operation_id),
    accepted.receipt,
  );
});
test("XI repriced lines expose binding removal on re-import; explicit kept omissions retain exact bindings", async () => {
  const s = await pricingSetup(),
    priced = await pricingProposal(s);
  await applyExcelSourcePricing(s.p, s.e.id, priced.command);
  const r = await revisionCommand(s, (p) => capacityWorkbook(p, 2, true));
  assert.equal(
    r.comparison.source_binding_changes?.filter((b) => b.action === "Removed")
      .length,
    2,
  );
  assert.equal(
    r.comparison.source_binding_changes?.filter(
      (b) => b.action === "KeepOrRemoveRequired",
    ).length,
    1,
  );
  await reimportExcelWorkbook(s.p, s.input.id, r.command);
  const next = await readEstimate(s.p, s.e.id);
  assert.equal(next.saved.source_bindings?.length, 1);
  assert.equal(next.saved.source_bindings![0].line_id, s.e.saved.lines[2].id);
  assert.equal(next.saved.cost_total, "3.25");
  const quote = await excelQuoteProposal(
    s,
    next.saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  );
  await prepareExcelQuotation(s.p, s.e.id, quote.command);
  assert.equal(quote.review.reconciliation.quote_total, "7.50");
  assert.equal(
    (await applyExcelSourcePricing(s.p, s.e.id, priced.command)).replayed,
    true,
  );
});
test("XI pricing failure rolls back the full successor graph and receipt; revoked recovery is denied", async () => {
  const s = await pricingSetup(),
    r = await pricingProposal(s),
    before = await snapshot();
  await database().query(
    "CREATE FUNCTION ppo.test_pricing_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic pricing fault'; END $$; CREATE TRIGGER test_fault BEFORE INSERT ON ppo.excel_source_pricings FOR EACH ROW EXECUTE FUNCTION ppo.test_pricing_fault()",
  );
  try {
    await assert.rejects(
      applyExcelSourcePricing(s.p, s.e.id, r.command),
      /synthetic pricing fault/,
    );
  } finally {
    await database().query(
      "DROP TRIGGER test_fault ON ppo.excel_source_pricings; DROP FUNCTION ppo.test_pricing_fault()",
    );
  }
  assert.deepEqual(await snapshot(), before);
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.read'",
    [s.p.workspace_id, s.p.actor_id],
  );
  await assert.rejects(readOperation(s.p, r.command.operation_id));
  await assert.rejects(applyExcelSourcePricing(s.p, s.e.id, r.command));
});
test("XI 500-line managed pricing and exact quotation retain the native generic refresh bound", async () => {
  const s = await pricingSetup(500),
    r = await pricingProposal(s);
  assert.equal(r.review.comparison.after.cost, "375.00");
  assert.equal(r.review.comparison.after.sell, "1250.00");
  await assert.rejects(
    previewSourceRefresh(s.p, s.e.id, r.proposal),
    code("InvalidData"),
  );
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings?.length, 500);
  const q = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  assert.equal(
    (await readQuoteJob(s.p, q.command.id)).q.safe_snapshot.items.length,
    500,
  );
  assert.equal(q.review.reconciliation.quote_total, "1250.00");
});
