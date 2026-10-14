import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { fxSetup } from "../helpers/excel-fx";
import { landedPricing } from "../helpers/excel-landed";
import { readEstimate } from "../../src/estimating/reads";
import { excelSnapshot } from "../helpers/excel-review-database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic database only");
after(closeDatabase);
test("compiled landed comparison, exact confirmation, scoped recovery and unchanged quotation", async () => {
  const h = httpAcceptance(localConfig().origin),
    s = await fxSetup(),
    r = await landedPricing(s);
  await h.cookie("coordinator");
  await h.cookie("second-company");
  const before = await excelSnapshot(),
    path = `estimating/estimates/${s.e.id}/excel-source-pricing`;
  const preview = await h.call("coordinator", path + "/preview", r.proposal);
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assert.deepEqual(preview.body, r.review);
  assert.ok(
    [403, 404].includes(
      (await h.call("second-company", path + "/preview", r.proposal)).status,
    ),
  );
  const unconfirmed = await h.call("coordinator", path, {
    ...r.command,
    reviewed: false,
  });
  assert.equal(unconfirmed.status, 422);
  const duplicate = structuredClone(r.proposal);
  duplicate.landed_costs.charges.push(duplicate.landed_costs.charges[0]);
  assert.equal(
    (await h.call("coordinator", path + "/preview", duplicate)).status,
    422,
  );
  const large = await h.call("coordinator", path + "/preview", {
    padding: "x".repeat(256 * 1024),
  });
  assert.equal(large.body.code, "PayloadTooLarge");
  assert.deepEqual(await excelSnapshot(), before);
  const saved = await h.call("coordinator", path, r.command);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  const recovered = await h.call("coordinator", path, r.command);
  assert.equal(recovered.body.replayed, true);
  assert.deepEqual(recovered.body.receipt, saved.body.receipt);
  const e = await readEstimate(s.p, s.e.id),
    retainedPath = `estimating/estimates/${e.id}/versions/${e.saved.id}/excel-source-pricing`;
  assert.deepEqual(
    (await h.call("coordinator", retainedPath)).body.review,
    r.review,
  );
  assert.ok(
    [403, 404].includes((await h.call("second-company", retainedPath)).status),
  );
  const quote = await h.call(
    "coordinator",
    `estimating/estimates/${e.id}/excel-quote/review`,
    { estimate_version_id: e.saved.id },
  );
  assert.equal(quote.status, 200);
  assert.equal(quote.body.reconciliation.quote_total, "7.50");
});
