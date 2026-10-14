import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { pricingSetup, pricingProposal } from "../helpers/excel-source-pricing";
import { readEstimate } from "../../src/estimating/reads";
import { excelSnapshot } from "../helpers/excel-review-database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("XI compiled managed pricing preview, atomic save, original recovery, exact evidence and transport refusal", async () => {
  const h = httpAcceptance(localConfig().origin),
    s = await pricingSetup(),
    r = await pricingProposal(s);
  const path = `estimating/estimates/${s.e.id}/excel-source-pricing`;
  await h.cookie("coordinator");
  await h.cookie("second-company");
  const before = await excelSnapshot();
  const preview = await h.call("coordinator", `${path}/preview`, r.proposal);
  assert.equal(preview.status, 200);
  assert.deepEqual(preview.body, r.review);
  assert.deepEqual(await excelSnapshot(), before);
  const oversized = await h.call("coordinator", path, {
    padding: "x".repeat(256 * 1024),
  });
  assert.equal(oversized.status, 422);
  assert.equal(oversized.body.code, "PayloadTooLarge");
  const denied = await h.call("second-company", `${path}/preview`, r.proposal);
  assert.ok([403, 404].includes(denied.status));
  const saved = await h.call("coordinator", path, r.command);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.receipt.record_version, 2);
  const replay = await h.call("coordinator", path, r.command);
  assert.equal(replay.body.replayed, true);
  assert.deepEqual(replay.body.receipt, saved.body.receipt);
  const e = await readEstimate(s.p, s.e.id);
  const evidencePath = `estimating/estimates/${s.e.id}/versions/${e.saved.id}/excel-source-pricing`;
  const evidence = await h.call("coordinator", evidencePath);
  assert.equal(evidence.status, 200);
  assert.deepEqual(evidence.body.review, r.review);
  assert.ok(
    [403, 404].includes((await h.call("second-company", evidencePath)).status),
  );
  const quote = await h.call(
    "coordinator",
    `estimating/estimates/${s.e.id}/excel-quote/review`,
    { estimate_version_id: e.saved.id },
  );
  assert.equal(quote.status, 200);
  assert.equal(quote.body.reconciliation.quote_total, "7.50");
});
