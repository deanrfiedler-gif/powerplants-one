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
import {
  createCostSource,
  reviseCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import { previewFxSource } from "../../src/estimating/sources/fx-preview";
import { fxReviewHash } from "../../src/estimating/sources/fx";
import { previewSourceRefresh } from "../../src/estimating/sources/refresh";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readQuoteJob } from "../../src/estimating/worker";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import { pricingProposal } from "../helpers/excel-source-pricing";
import { fxSetup } from "../helpers/excel-fx";
import { fxEvidence } from "../helpers/source-fx";
import { sourceInput } from "../helpers/estimating-sources";
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
    sources: await Promise.all(
      [
        "cost_sources",
        "cost_source_revisions",
        "cost_source_events",
        "estimate_cost_source_bindings",
        "excel_source_pricings",
      ].map(
        async (t) =>
          (
            await database().query(
              `SELECT to_jsonb(r) value FROM ppo.${t} r ORDER BY to_jsonb(r)::text`,
            )
          ).rows,
      ),
    ),
  };
}
async function fault(table: string, body: string, work: () => Promise<void>) {
  await database().query(
    `CREATE FUNCTION ppo.test_fx_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${body}; RETURN NEW; END $$; CREATE TRIGGER a_fx_fault BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.test_fx_fault()`,
  );
  try {
    await work();
  } finally {
    await database().query(
      `DROP TRIGGER a_fx_fault ON ppo.${table}; DROP FUNCTION ppo.test_fx_fault()`,
    );
  }
}
test("FX exact source preview, independent review, original foreign evidence and concurrent Excel save preserve receipts and quote safety", async () => {
  const s = await fxSetup(),
    before = await snapshot();
  const detail = await readCostSource(s.p, s.source.id);
  const preview = await previewFxSource(s.p, {
    company_id: s.source.company_id,
    content: detail.revision.content,
  });
  assert.equal(preview.fx_review_hash, detail.fx_review_hash);
  assert.equal(preview.content.fx!.currency, "USD");
  assert.equal(preview.content.fx!.tiers[0].unit_cost, "0.670000");
  assert.equal(preview.content.tiers[0].unit_cost, "1.01");
  const r = await pricingProposal(s);
  assert.equal(r.review.comparison.fx_sources?.length, 1);
  assert.deepEqual(
    r.review.comparison.fx_sources![0].conversion,
    detail.revision.content.fx,
  );
  assert.ok(
    r.review.comparison.changes.every(
      (c) => c.foreign_price?.unit_cost === "0.670000",
    ),
  );
  assert.equal(r.review.comparison.after.cost, "3.03");
  assert.equal(r.review.comparison.after.sell, "7.50");
  assert.deepEqual(await snapshot(), before);
  const accepted = await Promise.all([
    applyExcelSourcePricing(s.p, s.e.id, r.command),
    applyExcelSourcePricing(s.p, s.e.id, r.command),
  ]);
  assert.equal(accepted.filter((r) => r.replayed).length, 1);
  assert.deepEqual(accepted[0].receipt, accepted[1].receipt);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings?.length, 3);
  assert.deepEqual(
    (await readExcelSourcePricing(s.p, s.e.id, e.saved.id)).review,
    r.review,
  );
  assert.equal(
    (await readExcelImport(s.p, s.e.id, s.e.saved.id)).review.hash,
    s.review.review_hash,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, s.e.id, s.e.saved.id)).bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    await readOperation(s.p, r.command.operation_id),
    accepted[0].receipt,
  );
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...r.command,
      reason: "Altered FX intent",
    }),
    code("OperationConflict"),
  );
  const q = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  const job = await readQuoteJob(s.p, q.command.id);
  assert.equal(job.q.safe_snapshot.total, "7.50");
  assert.doesNotMatch(
    job.q.input_html,
    /SYN-FX|foreign_price|fx_review_hash|0\.670000|1\.500000/,
  );
});
test("FX review refuses missing or changed acknowledgement and verifies its deferred audit evidence", async () => {
  const s = await fxSetup(3, false),
    reviewer = (await createSession("estimating-source-reviewer")).principal;
  await decideCostSource(s.p, s.source.id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: s.source.revision.id,
    action: "Submit",
  });
  const input = {
    ...crmBase(),
    expected_version: 2,
    revision_id: s.source.revision.id,
    action: "Reviewed",
  };
  const before = await snapshot();
  await assert.rejects(
    decideCostSource(reviewer, s.source.id, input),
    code("FxReviewRequired"),
  );
  await assert.rejects(
    decideCostSource(reviewer, s.source.id, {
      ...input,
      fx_review_hash: "a".repeat(64),
    }),
    code("FxReviewRequired"),
  );
  await assert.rejects(
    decideCostSource(s.p, s.source.id, {
      ...input,
      fx_review_hash: fxReviewHash(s.source.revision.content.fx!),
    }),
  );
  assert.deepEqual(await snapshot(), before);
  const command = {
    ...input,
    fx_review_hash: fxReviewHash(s.source.revision.content.fx!),
  };
  await fault(
    "audit_events",
    "IF NEW.object_type='CostSource' AND NEW.details->>'command'='ReviewCostSource' THEN NEW.details:=NEW.details-'fx_review'; END IF",
    async () => {
      await assert.rejects(
        decideCostSource(reviewer, s.source.id, command),
        code("InvalidRelationship"),
      );
    },
  );
  assert.deepEqual(await snapshot(), before);
  const accepted = await decideCostSource(reviewer, s.source.id, command);
  assert.deepEqual(
    (await decideCostSource(reviewer, s.source.id, command)).receipt,
    accepted.receipt,
  );
  const a = (
    await database().query(
      "SELECT details->'fx_review' value FROM ppo.audit_events WHERE operation_id=$1",
      [command.operation_id],
    )
  ).rows[0].value;
  assert.equal(a.hash, command.fx_review_hash);
  assert.deepEqual(a.conversion, s.source.revision.content.fx);
});
test("FX dates, foreign scope, legacy refresh and native conversion tampering refuse without accepted mutations", async () => {
  const s = await fxSetup(),
    foreign = (await createSession("second-company")).principal,
    r = await pricingProposal(s),
    before = await snapshot();
  await assert.rejects(
    previewFxSource(foreign, {
      company_id: s.source.company_id,
      content: s.source.revision.content,
    }),
  );
  await assert.rejects(previewExcelSourcePricing(foreign, s.e.id, r.proposal));
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, {
      ...r.proposal,
      pricing_date: "2026-11-01",
    }),
    code("FxOutsideValidity"),
  );
  await assert.rejects(
    previewSourceRefresh(s.p, s.e.id, r.proposal),
    code("ExcelFxReviewRequired"),
  );
  const input = sourceInput();
  await fault(
    "cost_source_revisions",
    "NEW.content:=jsonb_set(NEW.content,'{tiers,0,unit_cost}','\"9.99\"'::jsonb)",
    async () => {
      await assert.rejects(
        createCostSource(s.p, {
          ...input,
          content: { ...input.content, tiers: undefined, fx: fxEvidence() },
        }),
        code("InvalidRelationship"),
      );
    },
  );
  await fault(
    "estimate_cost_source_bindings",
    "NEW.pricing_date:='2026-11-01'::date",
    async () => {
      await assert.rejects(
        applyExcelSourcePricing(s.p, s.e.id, r.command),
        code("InvalidRelationship"),
      );
    },
  );
  await fault(
    "excel_source_pricings",
    "NEW.review:=jsonb_set(NEW.review,'{comparison,fx_sources,0,conversion,rate}','\"9.000000\"'::jsonb); NEW.canonical_review:=(NEW.review-'review_hash')::text; NEW.review_hash:=encode(sha256(convert_to(NEW.canonical_review,'UTF8')),'hex'); NEW.review:=jsonb_set(NEW.review,'{review_hash}',to_jsonb(NEW.review_hash))",
    async () => {
      await assert.rejects(
        applyExcelSourcePricing(s.p, s.e.id, r.command),
        code("InvalidRelationship"),
      );
    },
  );
  assert.deepEqual(await snapshot(), before);
});
test("FX rate correction requires a fresh independent review and estimate comparison while accepted historical operations recover", async () => {
  const s = await fxSetup(),
    r = await pricingProposal(s),
    accepted = await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const source = await readCostSource(s.p, s.source.id),
    fx = { ...source.revision.content.fx!, rate: "2.000000" };
  await assert.rejects(
    reviseCostSource(s.p, s.source.id, {
      ...crmBase(),
      expected_version: source.source.version,
      content: { ...source.revision.content, fx: undefined },
    }),
    code("SourceCurrencyChanged"),
  );
  await reviseCostSource(s.p, s.source.id, {
    ...crmBase(),
    expected_version: source.source.version,
    content: { ...source.revision.content, tiers: undefined, fx },
  });
  const next = await readCostSource(s.p, s.source.id),
    e = await readEstimate(s.p, s.e.id);
  const proposal = {
    ...r.proposal,
    estimate_version_id: e.saved.id,
    selections: r.proposal.selections.map((x) => ({
      ...x,
      expected_source_version: next.source.version,
      revision_id: next.revision.id,
    })),
  };
  await assert.rejects(
    previewExcelSourcePricing(s.p, s.e.id, proposal),
    code("ReviewedSourceRequired"),
  );
  await decideCostSource(s.p, s.source.id, {
    ...crmBase(),
    expected_version: next.source.version,
    revision_id: next.revision.id,
    action: "Submit",
  });
  const reviewer = (await createSession("estimating-source-reviewer"))
    .principal;
  await decideCostSource(reviewer, s.source.id, {
    ...crmBase(),
    expected_version: next.source.version + 1,
    revision_id: next.revision.id,
    action: "Reviewed",
    fx_review_hash: next.fx_review_hash,
  });
  const refreshed = await previewExcelSourcePricing(s.p, s.e.id, {
    ...proposal,
    selections: proposal.selections.map((x) => ({
      ...x,
      expected_source_version: next.source.version + 2,
    })),
  });
  assert.equal(refreshed.comparison.after.cost, "4.02");
  assert.equal((await readEstimate(s.p, s.e.id)).saved.cost_total, "3.03");
  await applyExcelSourcePricing(s.p, s.e.id, {
    ...crmBase(),
    expected_version: e.version,
    proposal: refreshed.proposal,
    comparison_hash: refreshed.review_hash,
    reviewed: true,
  });
  assert.deepEqual(
    (await applyExcelSourcePricing(s.p, s.e.id, r.command)).receipt,
    accepted.receipt,
  );
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...r.command,
      operation_id: randomUUID(),
    }),
    code("EstimateVersionChanged"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.read'",
    [s.p.workspace_id, s.p.actor_id],
  );
  await assert.rejects(readOperation(s.p, r.command.operation_id));
  await assert.rejects(applyExcelSourcePricing(s.p, s.e.id, r.command));
});
test("FX binding removal and retained omissions remain explicit across re-import and fresh repricing", async () => {
  const s = await fxSetup(),
    r = await pricingProposal(s);
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const revised = await revisionCommand(s, (p) => capacityWorkbook(p, 2, true));
  assert.equal(
    revised.comparison.source_binding_changes!.filter(
      (b) => b.action === "Removed",
    ).length,
    2,
  );
  await reimportExcelWorkbook(s.p, s.input.id, revised.command);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings?.length, 1);
  assert.equal(e.saved.cost_total, "3.51");
  const fresh = await pricingProposal(s);
  assert.equal(
    fresh.review.workbook_values.filter((w) => w.original === null).length,
    1,
  );
  assert.equal(fresh.review.comparison.after.cost, "3.03");
  await applyExcelSourcePricing(s.p, s.e.id, fresh.command);
  const q = await excelQuoteProposal(
    s,
    (await readEstimate(s.p, s.e.id)).saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  );
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  assert.equal(q.review.reconciliation.quote_total, "7.50");
});
test("FX 500-line conversion deduplicates full evidence and preserves the exact AUD Draft", async () => {
  const s = await fxSetup(500),
    r = await pricingProposal(s);
  assert.equal(r.review.comparison.fx_sources?.length, 1);
  assert.equal(
    r.review.comparison.changes.filter((c) => c.foreign_price).length,
    500,
  );
  assert.equal(r.review.comparison.after.cost, "505.00");
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings?.length, 500);
  const q = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  assert.equal(q.review.reconciliation.quote_total, "1250.00");
  assert.equal(
    (await readQuoteJob(s.p, q.command.id)).q.safe_snapshot.items.length,
    500,
  );
});
