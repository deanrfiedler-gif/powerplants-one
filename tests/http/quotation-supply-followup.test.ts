import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  allocatedHttpFixture,
  conversionDetail,
  json,
  request,
  session,
  referral,
  acknowledgement,
  supplyReview,
  supplyApply,
} from "../helpers/quotation-supply-followup-http";
test("ES07 Supply HTTP exact receiving, real native allocation, scoped worklist and original recovery", async () => {
  const f = await allocatedHttpFixture(),
    other = await session("second-company"),
    cmd = referral(f.d.followups[0]);
  assert.equal(
    (await request(other, f.path + "/supply-refer", cmd)).status,
    404,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/supply-refer", {
        ...cmd,
        unexpected: true,
      })
    ).status,
    422,
  );
  const receipt = await json(f.owner, f.path + "/supply-refer", cmd);
  assert.deepEqual(await json(f.owner, f.path + "/supply-refer", cmd), receipt);
  assert.equal(
    (
      await request(f.owner, f.path + "/supply-refer", {
        ...cmd,
        reason: "changed",
      })
    ).status,
    409,
  );
  let d = await conversionDetail(f.owner, f.id),
    t = d.followups[0];
  const list = await request(f.owner, "supply/conversion-followups");
  assert.match(list.headers.get("cache-control")!, /no-store/);
  assert.ok(
    (await list.json()).rows.some(
      (r: { referral_id: string }) => r.referral_id === t.referral!.id,
    ),
  );
  await json(f.owner, f.path + "/supply-receive", acknowledgement(t));
  t = (await conversionDetail(f.owner, f.id)).followups[0];
  assert.equal(
    (
      await request(f.owner, f.path + "/supply-review", {
        ...supplyReview(t, "AdjustAllocation", "0"),
        decision: "CancelSupplier",
      })
    ).status,
    422,
  );
  await json(
    f.owner,
    f.path + "/supply-review",
    supplyReview(t, "AdjustAllocation", "0"),
  );
  t = (await conversionDetail(f.owner, f.id)).followups[0];
  assert.equal(
    (await request(f.owner, "supply/allocations", t.review!.command)).status,
    409,
  );
  const apply = supplyApply(t),
    outcome = await json(f.owner, f.path + "/supply-apply", apply);
  assert.deepEqual(
    await json(f.owner, `operations/${apply.operation_id}`),
    outcome,
  );
  assert.deepEqual(
    await json(f.owner, f.path + "/supply-apply", apply),
    outcome,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/supply-apply", {
        ...apply,
        operation_id: randomUUID(),
      })
    ).status,
    409,
  );
  d = await conversionDetail(f.owner, f.id);
  t = d.followups[0];
  assert.equal(t.basis.conversion.dependencies.allocations[0].quantity, "0");
  assert.equal(d.dispositions[0].status, "Review required");
  assert.deepEqual(
    await json(f.owner, `supply/operations/${t.review!.command!.operation_id}`),
    t.outcome!.native_receipt,
  );
  assert.equal((await request(other, f.path)).status, 404);
  assert.equal(
    (await request(other, "supply/conversion-followups")).status,
    403,
  );
});
