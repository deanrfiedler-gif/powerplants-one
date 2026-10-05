import assert from "node:assert/strict";
import { test } from "node:test";
import {
  shortfallHttpFixture,
  shortfallProposal,
  shortfallReceiving,
  shortfallReview,
  supplyApply,
  json,
  request,
  session,
  conversionDetail,
} from "../helpers/quotation-allocation-shortfall-http";
test("ES07 shortfall HTTP separates Receipt and allocation consent, applies once and returns exact native effects under current authority", async () => {
  const f = await shortfallHttpFixture();
  const denied = await session("second-company"),
    cmd = shortfallProposal(await f.current());
  assert.equal(
    (await request(denied, f.path + "/shortfall-propose", cmd)).status,
    404,
  );
  const proposed = await json(f.owner, f.path + "/shortfall-propose", cmd);
  assert.deepEqual(
    await json(f.owner, f.path + "/shortfall-propose", cmd),
    proposed,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/shortfall-propose", {
        ...cmd,
        evidence: "SYN changed",
      })
    ).status,
    409,
  );
  let t = await f.current();
  assert.equal(
    (await request(f.owner, f.path + "/supply-review", shortfallReview(t)))
      .status,
    409,
  );
  for (const r of t.allocation_shortfall.required)
    await json(
      f.owner,
      f.path + "/shortfall-receive",
      shortfallReceiving(await f.current(), r.demand.id),
    );
  await json(
    f.owner,
    f.path + "/supply-review",
    shortfallReview(await f.current()),
  );
  t = await f.current();
  const apply = supplyApply(t);
  const results = await Promise.all([
    json(f.owner, f.path + "/supply-apply", apply),
    json(f.owner, f.path + "/supply-apply", apply),
  ]);
  assert.deepEqual(results[0], results[1]);
  t = await f.current();
  assert.equal(t.basis.position[0].usable_allocated, "4.375001");
  assert.equal(t.basis.conversion.target.quantity, "2");
  assert.equal(t.outcome!.decision, "ReduceAllocations");
  assert.equal(t.outcome!.effect_receiving_ids.length, 2);
  assert.deepEqual(
    await json(
      f.owner,
      `operations/${t.outcome!.native_receipt!.operation_id}`,
    ),
    t.outcome!.native_receipt,
  );
  assert.equal(
    (
      await request(
        denied,
        `operations/${t.outcome!.native_receipt!.operation_id}`,
      )
    ).status,
    404,
  );
  assert.equal(
    (await conversionDetail(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
});
