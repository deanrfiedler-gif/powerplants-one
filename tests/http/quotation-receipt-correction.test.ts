import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocatedHttpFixture,
  conversionDetail,
  json,
  request,
  session,
  referral,
  acknowledgement,
  supplyApply,
} from "../helpers/quotation-supply-followup-http";
import {
  receiptProposal,
  receiptReceiving,
  receiptReview,
} from "../helpers/quotation-receipt-correction";
test("ES07 Receipt HTTP receives every affected Demand, preserves native evidence and recovers original operations", async () => {
  const f = await allocatedHttpFixture("Shipment");
  const current = async () =>
    (await conversionDetail(f.owner, f.id)).followups[0];
  await json(f.owner, f.path + "/supply-refer", referral(await current()));
  await json(
    f.owner,
    f.path + "/supply-receive",
    acknowledgement(await current()),
  );
  const cmd = receiptProposal(await current()),
    denied = await session("second-company");
  assert.equal(
    (await request(denied, f.path + "/receipt-propose", cmd)).status,
    404,
  );
  const proposed = await json(f.owner, f.path + "/receipt-propose", cmd);
  assert.deepEqual(
    await json(f.owner, f.path + "/receipt-propose", cmd),
    proposed,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/receipt-propose", {
        ...cmd,
        fact_evidence: "Changed",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        f.owner,
        f.path + "/supply-review",
        receiptReview(await current()),
      )
    ).status,
    409,
  );
  for (const x of (await current()).receipt_correction.required) {
    const r = receiptReceiving(await current(), x.demand.id);
    const saved = await json(f.owner, f.path + "/receipt-receive", r);
    assert.deepEqual(
      await json(f.owner, `operations/${r.operation_id}`),
      saved,
    );
  }
  await json(
    f.owner,
    f.path + "/supply-review",
    receiptReview(await current()),
  );
  const t = await current(),
    apply = supplyApply(t),
    native = t.receipt_correction.proposal!.command;
  const saved = await json(f.owner, f.path + "/supply-apply", apply);
  assert.deepEqual(await json(f.owner, f.path + "/supply-apply", apply), saved);
  const outcome = (await current()).outcome!;
  assert.deepEqual(
    await json(f.owner, `operations/${native.operation_id}`),
    outcome.native_receipt,
  );
  assert.equal(
    (await request(denied, `operations/${cmd.operation_id}`)).status,
    404,
  );
  assert.equal(
    (await request(denied, `operations/${native.operation_id}`)).status,
    404,
  );
  const supply = await json(f.owner, `supply/records/${native.record_id}`);
  assert.equal(
    supply.facts.find((x: { id: string }) => x.id === native.id).predecessor_id,
    cmd.dependency_id,
  );
  assert.equal(
    (await conversionDetail(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
  assert.equal(
    (await current()).receipt_correction.effects!.shortfall,
    "5.624999",
  );
});
