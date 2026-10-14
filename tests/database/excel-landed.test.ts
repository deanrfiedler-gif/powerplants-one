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
import { readExcelSource } from "../../src/estimating/import/retained";
import { saveEstimate } from "../../src/estimating/service";
import { crmBase } from "../helpers/crm";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import { previewSourceRefresh } from "../../src/estimating/sources/refresh";
import { prepareExcelQuotation } from "../../src/estimating/import/quotation";
import { readQuoteJob } from "../../src/estimating/worker";
import { reimportExcelWorkbook } from "../../src/estimating/import/reimport";
import { excelQuoteProposal } from "../helpers/excel-quotation";
import { pricingSetup, pricingProposal } from "../helpers/excel-source-pricing";
import { fxSetup } from "../helpers/excel-fx";
import { capacityWorkbook } from "../helpers/excel-capacity";
import { revisionCommand } from "../helpers/excel-reimport";
import { excelSnapshot } from "../helpers/excel-review-database";
import { landedPricing } from "../helpers/excel-landed";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
async function snapshot() {
  return {
    native: await excelSnapshot(),
    evidence: await Promise.all(
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
    `CREATE FUNCTION ppo.test_landed_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${body}; RETURN NEW; END $$; CREATE TRIGGER a_landed_fault BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.test_landed_fault()`,
  );
  try {
    await work();
  } finally {
    await database().query(
      `DROP TRIGGER a_landed_fault ON ppo.${table}; DROP FUNCTION ppo.test_landed_fault()`,
    );
  }
}
test("landed FX comparison is read-only; concurrent save retains exact sources, charges, originals and safe quotation", async () => {
  const s = await fxSetup(),
    before = await snapshot(),
    r = await landedPricing(s);
  assert.deepEqual(await snapshot(), before);
  assert.equal(r.review.comparison.after.cost, "3.33");
  assert.equal(r.review.comparison.after.sell, "7.50");
  assert.equal(r.review.comparison.landed_costs!.total, "0.30");
  assert.ok(
    r.review.comparison.bindings.every(
      (b) => b.unit_cost === "1.11" && b.landed?.base_unit_cost === "1.01",
    ),
  );
  const results = await Promise.all([
    applyExcelSourcePricing(s.p, s.e.id, r.command),
    applyExcelSourcePricing(s.p, s.e.id, r.command),
  ]);
  assert.equal(results.filter((r) => r.replayed).length, 1);
  assert.deepEqual(results[0].receipt, results[1].receipt);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings!.filter((b) => b.landed).length, 3);
  assert.deepEqual(
    (await readExcelSourcePricing(s.p, e.id, e.saved.id)).review,
    r.review,
  );
  assert.deepEqual(
    (await readExcelSource(s.p, e.id, s.e.saved.id)).bytes,
    Buffer.from(s.command.file.base64, "base64"),
  );
  assert.deepEqual(
    await readOperation(s.p, r.command.operation_id),
    results[0].receipt,
  );
  await assert.rejects(
    applyExcelSourcePricing(s.p, e.id, {
      ...r.command,
      reason: "Changed intent",
    }),
    code("OperationConflict"),
  );
  const q = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, e.id, q.command);
  const job = await readQuoteJob(s.p, q.command.id);
  assert.equal(job.q.safe_snapshot.total, "7.50");
  assert.doesNotMatch(
    job.q.input_html,
    /SYN-LANDED|allocated_cost|base_unit_cost|SYN-FX|fx_review_hash/,
  );
});
test("landed replacement uses fresh base costs, requires all current allocations and can deliberately remove charges", async () => {
  const s = await pricingSetup(),
    r = await landedPricing(s);
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const e = await readEstimate(s.p, s.e.id);
  const plain = { ...r.proposal, estimate_version_id: e.saved.id };
  delete (plain as { landed_costs?: unknown }).landed_costs;
  await assert.rejects(
    previewSourceRefresh(s.p, e.id, plain),
    code("LandedComparisonRequired"),
  );
  await assert.rejects(
    previewExcelSourcePricing(s.p, e.id, {
      ...plain,
      selections: plain.selections.slice(0, 1),
    }),
    code("LandedComparisonRequired"),
  );
  const next = await landedPricing(s, { amount: "0.60" });
  assert.equal(next.review.comparison.after.cost, "2.85");
  await applyExcelSourcePricing(s.p, e.id, next.command);
  assert.equal(
    (await readEstimate(s.p, e.id)).saved.source_bindings![0].landed!
      .allocated_cost,
    "0.20",
  );
  const removed = await pricingProposal(s);
  assert.equal(removed.review.comparison.after.cost, "2.25");
  await applyExcelSourcePricing(s.p, e.id, removed.command);
  assert.ok(
    (await readEstimate(s.p, e.id)).saved.source_bindings!.every(
      (b) => !b.landed,
    ),
  );
  assert.deepEqual(
    (await applyExcelSourcePricing(s.p, e.id, r.command)).receipt,
    await readOperation(s.p, r.command.operation_id),
  );
});
test("landed charge tampering and deferred binding faults roll the complete graph back", async () => {
  const s = await fxSetup(),
    r = await landedPricing(s),
    before = await snapshot();
  const changed = structuredClone(r.command);
  changed.proposal.landed_costs.charges[0].amount = "0.60";
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, changed),
    code("ExcelPricingReviewChanged"),
  );
  await fault(
    "estimate_cost_source_bindings",
    `IF NEW.landed IS NOT NULL THEN NEW.landed:=jsonb_set(NEW.landed,'{allocated_cost}','"0.11"'); END IF`,
    async () => {
      await assert.rejects(
        applyExcelSourcePricing(s.p, s.e.id, r.command),
        code("InvalidRelationship"),
      );
    },
  );
  await fault(
    "excel_source_pricings",
    `NEW.review:=jsonb_set(NEW.review,'{comparison,landed_costs,total}','"0.31"')`,
    async () => {
      await assert.rejects(
        applyExcelSourcePricing(s.p, s.e.id, r.command),
        code("InvalidRelationship"),
      );
    },
  );
  assert.deepEqual(await snapshot(), before);
  const allocation = (
    await database().query(
      "SELECT ppo.landed_expected_allocations($1,$2,$3) value",
      [
        r.review.proposal.landed_costs!.charges[0],
        JSON.stringify(r.review.comparison.bindings),
        JSON.stringify(r.review.comparison.lines),
      ],
    )
  ).rows[0].value;
  assert.deepEqual(
    allocation,
    r.review.comparison.landed_costs!.charges[0].allocations,
  );
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
});
test("re-import exposes landed binding removal, retains a kept original allocation and requires fresh reallocation", async () => {
  const s = await fxSetup(),
    r = await landedPricing(s);
  const accepted = await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const revised = await revisionCommand(s, (p) => capacityWorkbook(p, 2, true));
  assert.equal(
    revised.comparison.source_binding_changes!.filter(
      (b) => b.action === "Removed",
    ).length,
    2,
  );
  assert.equal(
    revised.comparison.source_binding_changes!.filter(
      (b) => b.action === "KeepOrRemoveRequired",
    ).length,
    1,
  );
  await reimportExcelWorkbook(s.p, s.input.id, revised.command);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings!.length, 1);
  assert.equal(e.saved.source_bindings![0].landed!.allocated_cost, "0.10");
  const fresh = await landedPricing(s, { amount: "0.60" });
  assert.equal(fresh.review.comparison.after.cost, "3.63");
  await applyExcelSourcePricing(s.p, s.e.id, fresh.command);
  assert.deepEqual(
    (await applyExcelSourcePricing(s.p, s.e.id, r.command)).receipt,
    accepted.receipt,
  );
  const q = await excelQuoteProposal(
    s,
    (await readEstimate(s.p, s.e.id)).saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  );
  await prepareExcelQuotation(s.p, s.e.id, q.command);
});
test("landed exact review rejects stale versions, incompatible authority and revoked original recovery", async () => {
  const s = await fxSetup(),
    foreign = (await createSession("second-company")).principal,
    r = await landedPricing(s);
  await assert.rejects(previewExcelSourcePricing(foreign, s.e.id, r.proposal));
  const before = await snapshot();
  await assert.rejects(applyExcelSourcePricing(foreign, s.e.id, r.command));
  assert.deepEqual(await snapshot(), before);
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  await assert.rejects(
    applyExcelSourcePricing(s.p, s.e.id, {
      ...r.command,
      operation_id: randomUUID(),
    }),
    code("EstimateVersionChanged"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='estimating.edit'",
    [s.p.workspace_id, s.p.actor_id],
  );
  await assert.rejects(applyExcelSourcePricing(s.p, s.e.id, r.command));
});
test("500 landed FX lines retain one shipment allocation and unchanged quotation sell total", async () => {
  const s = await fxSetup(500),
    r = await landedPricing(s, { amount: "75.00" });
  assert.equal(r.review.comparison.landed_costs!.total, "75.00");
  assert.equal(r.review.comparison.after.cost, "580.00");
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const e = await readEstimate(s.p, s.e.id);
  assert.equal(e.saved.source_bindings!.filter((b) => b.landed).length, 500);
  const q = await excelQuoteProposal(s);
  await prepareExcelQuotation(s.p, s.e.id, q.command);
  assert.equal(
    (await readQuoteJob(s.p, q.command.id)).q.safe_snapshot.total,
    "1250.00",
  );
});

test("landed Unit, Line duty and weighted Shipment allocations agree with independent database arithmetic", async () => {
  const s = await fxSetup(),
    r = await landedPricing(s),
    ids = s.e.saved.lines.map((l) => l.id).sort();
  const freight = {
    ...r.proposal.landed_costs.charges[0],
    basis: "Unit",
    allocation: null,
    amount: "0.01",
  };
  const duty = {
    ...freight,
    id: randomUUID(),
    kind: "Duty",
    basis: "Line",
    amount: "0.02",
    line_ids: [ids[0]],
    evidence_reference: "SYN-DUTY-LINE",
  };
  const shipment = {
    ...freight,
    id: randomUUID(),
    basis: "Shipment",
    allocation: "BaseCost",
    amount: "0.03",
    evidence_reference: "SYN-WEIGHTED-SHIPMENT",
  };
  const proposal = {
    ...r.proposal,
    landed_costs: {
      ...r.proposal.landed_costs,
      charges: [freight, duty, shipment],
    },
  };
  const review = await previewExcelSourcePricing(s.p, s.e.id, proposal);
  assert.equal(review.comparison.after.cost, "3.11");
  assert.equal(review.comparison.landed_costs!.total, "0.08");
  for (const charge of review.proposal.landed_costs!.charges) {
    const expected = (
      await database().query(
        "SELECT ppo.landed_expected_allocations($1,$2,$3) value",
        [
          charge,
          JSON.stringify(review.comparison.bindings),
          JSON.stringify(review.comparison.lines),
        ],
      )
    ).rows[0].value;
    assert.deepEqual(
      expected,
      review.comparison.landed_costs!.charges.find(
        (c) => c.charge_id === charge.id,
      )!.allocations,
    );
  }
  await applyExcelSourcePricing(s.p, s.e.id, {
    ...r.command,
    proposal,
    comparison_hash: review.review_hash,
  });
  const e = await readEstimate(s.p, s.e.id);
  assert.deepEqual(
    e.saved.source_bindings!.map((b) => b.unit_cost),
    ["1.05", "1.03", "1.03"],
  );
});

test("a changed landed Product category drops typed allocation while preserving other original bindings", async () => {
  const s = await fxSetup(),
    r = await landedPricing(s);
  await applyExcelSourcePricing(s.p, s.e.id, r.command);
  const e = await readEstimate(s.p, s.e.id);
  await saveEstimate(s.p, e.id, {
    ...crmBase(),
    schema_version: e.saved.cost_schema_version ?? 1,
    expected_version: e.version,
    title: e.saved.title,
    scope: e.saved.scope,
    policy: e.saved.policy,
    lines: e.saved.lines.map((l, i) => (i ? l : { ...l, category: "Labour" })),
  });
  const next = await readEstimate(s.p, e.id);
  assert.equal(next.saved.source_bindings!.length, 2);
  assert.ok(
    next.saved.source_bindings!.every(
      (b) => b.line_id !== e.saved.lines[0].id && b.landed,
    ),
  );
  assert.deepEqual(
    (await readExcelSourcePricing(s.p, e.id, e.saved.id)).review,
    r.review,
  );
});
