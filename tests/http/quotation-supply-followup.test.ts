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
  reservationHttpFixture,
  supplyReview,
  supplyApply,
} from "../helpers/quotation-supply-followup-http";
import { reservationReview } from "../helpers/quotation-supply-followup";
test("ES07 reservation HTTP executes only exact native evidence, preserves holds and current receipt authority",async()=>{
  const f=await reservationHttpFixture(); const cmd=reservationReview(f.d.followups[0]);
  const denied=await session("second-company");
  assert.equal((await request(denied,f.path+"/supply-review",cmd)).status,404);
  assert.equal((await request(f.owner,f.path+"/supply-review",{...cmd,quantity:"0"})).status,422);
  const review=await json(f.owner,f.path+"/supply-review",cmd);
  assert.deepEqual(await json(f.owner,f.path+"/supply-review",cmd),review);
  let t=(await conversionDetail(f.owner,f.id)).followups[0];
  const native=t.review!.command!; assert.ok("record_id" in native);
  const {record_id,...fact}=native;
  assert.equal((await request(f.owner,`supply/records/${record_id}/facts`,fact)).status,409);
  const apply=supplyApply(t); const receipt=await json(f.owner,f.path+"/supply-apply",apply);
  assert.deepEqual(await json(f.owner,`operations/${apply.operation_id}`),receipt);
  assert.deepEqual(await json(f.owner,f.path+"/supply-apply",apply),receipt);
  assert.equal((await request(f.owner,f.path+"/supply-apply",{...apply,reason:"changed"})).status,409);
  t=(await conversionDetail(f.owner,f.id)).followups[0];
  assert.equal(t.reservation_dependencies[0].fact.predecessor_id,f.unknown.id);
  assert.equal(t.reservation_dependencies[0].fact.data.state,"Confirmed");
  assert.equal(t.basis.position[0].usable_allocated,"10");
  assert.ok(t.adjustment_holds.length);
  assert.deepEqual(await json(f.owner,`supply/records/${record_id}/facts`,fact),t.outcome!.native_receipt);
  assert.equal((await request(denied,`operations/${native.operation_id}`)).status,404);
  assert.equal((await conversionDetail(f.owner,f.id)).dispositions[0].status,"Review required");
});
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
