import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { pricingSetup, pricingProposal } from "../helpers/excel-source-pricing";
import { sourceInput } from "../helpers/estimating-sources";
import { fxEvidence } from "../helpers/source-fx";
import { crmBase } from "../helpers/crm";
import { readEstimate } from "../../src/estimating/reads";
import { readCostSource } from "../../src/estimating/sources/reads";
import { excelSnapshot } from "../helpers/excel-review-database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("FX compiled preview, source authoring, explicit independent review and exact Excel pricing round trip", async () => {
  const h = httpAcceptance(localConfig().origin),
    s = await pricingSetup(),
    input = sourceInput();
  const content = {
    ...input.content,
    unit: s.e.saved.lines[0].unit,
    tiers: undefined,
    fx: fxEvidence(),
  };
  await h.cookie("coordinator");
  await h.cookie("estimating-source-reviewer");
  await h.cookie("second-company");
  const before = await excelSnapshot();
  const preview = await h.call(
    "coordinator",
    "estimating/cost-sources/fx-preview",
    { company_id: input.company_id, content },
  );
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.equal(preview.body.content.tiers[0].unit_cost, "1.01");
  assert.equal(preview.body.content.fx.tiers[0].unit_cost, "0.670000");
  assert.equal(preview.body.saved, false);
  assert.ok(
    [403, 404].includes(
      (
        await h.call("second-company", "estimating/cost-sources/fx-preview", {
          company_id: input.company_id,
          content,
        })
      ).status,
    ),
  );
  const oversized = await h.call(
    "coordinator",
    "estimating/cost-sources/fx-preview",
    { padding: "x".repeat(65536) },
  );
  assert.equal(oversized.status, 422);
  assert.equal(oversized.body.code, "PayloadTooLarge");
  assert.deepEqual(await excelSnapshot(), before);
  const created = await h.call("coordinator", "estimating/cost-sources", {
    ...input,
    content,
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const path = `estimating/cost-sources/${input.id}`,
    draft = await h.call("coordinator", path);
  assert.equal(draft.body.fx_review_hash, preview.body.fx_review_hash);
  const submitted = await h.call("coordinator", path + "/review", {
    ...crmBase(),
    expected_version: 1,
    revision_id: draft.body.revision.id,
    action: "Submit",
  });
  assert.equal(submitted.status, 200);
  const decision = {
    ...crmBase(),
    expected_version: 2,
    revision_id: draft.body.revision.id,
    action: "Reviewed",
  };
  const refused = await h.call(
    "estimating-source-reviewer",
    path + "/review",
    decision,
  );
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "FxReviewRequired");
  const reviewed = await h.call(
    "estimating-source-reviewer",
    path + "/review",
    { ...decision, fx_review_hash: preview.body.fx_review_hash },
  );
  assert.equal(reviewed.status, 200, JSON.stringify(reviewed.body));
  const d = await readCostSource(s.p, input.id),
    r = await pricingProposal({
      ...s,
      source: { ...d.source, revision: d.revision },
    });
  const pricingPath = `estimating/estimates/${s.e.id}/excel-source-pricing`;
  const compared = await h.call(
    "coordinator",
    pricingPath + "/preview",
    r.proposal,
  );
  assert.equal(compared.status, 200);
  assert.deepEqual(compared.body, r.review);
  const saved = await h.call("coordinator", pricingPath, r.command);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const retried = await h.call("coordinator", pricingPath, r.command);
  assert.equal(retried.body.replayed, true);
  assert.deepEqual(retried.body.receipt, saved.body.receipt);
  const e = await readEstimate(s.p, s.e.id);
  const retained = await h.call(
    "coordinator",
    `estimating/estimates/${s.e.id}/versions/${e.saved.id}/excel-source-pricing`,
  );
  assert.deepEqual(retained.body.review, r.review);
  const q = await h.call(
    "coordinator",
    `estimating/estimates/${s.e.id}/excel-quote/review`,
    { estimate_version_id: e.saved.id },
  );
  assert.equal(q.status, 200);
  assert.equal(q.body.reconciliation.quote_total, "7.50");
});
