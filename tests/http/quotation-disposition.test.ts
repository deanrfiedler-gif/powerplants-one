import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  completedHttpFixture,
  conversionDetail,
  dispositionReview,
  dispositionApply,
  request,
  json,
  session,
} from "../helpers/quotation-disposition-http";
test("ES07 compiled HTTP disposition enforces exact review, native mutation, current permissions, replay and unsupported-action refusal", async () => {
  const f = await completedHttpFixture(),
    other = await session("second-company"),
    t = f.d.dispositions[0],
    cmd = dispositionReview(t, "ReviseQuantity", "1.375");
  assert.equal(
    (await request(other, f.path + "/disposition-review", cmd)).status,
    404,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/disposition-review", {
        ...cmd,
        decision: "Cancel",
      })
    ).status,
    422,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/disposition-review", {
        ...cmd,
        target_id: randomUUID(),
      })
    ).status,
    404,
  );
  const reviewed = await json(f.owner, f.path + "/disposition-review", cmd);
  assert.deepEqual(
    await json(f.owner, f.path + "/disposition-review", cmd),
    reviewed,
  );
  let d = await conversionDetail(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Review required");
  assert.equal(d.targets[0].current.quantity, "2");
  const apply = dispositionApply(d.dispositions[0]),
    receipt = await json(f.owner, f.path + "/disposition-apply", apply);
  assert.deepEqual(
    await json(f.owner, f.path + "/disposition-apply", apply),
    receipt,
  );
  assert.deepEqual(
    await json(f.owner, `operations/${apply.operation_id}`),
    receipt,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/disposition-apply", {
        ...apply,
        reason: "Changed payload",
      })
    ).status,
    409,
  );
  d = await conversionDetail(f.owner, f.id);
  assert.equal(d.dispositions[0].status, "Resolved");
  assert.equal(d.targets[0].current.quantity, "1.375");
  assert.equal(d.targets[0].current.version, 2);
  const r = await request(f.owner, f.path);
  assert.match(r.headers.get("cache-control")!, /no-store/);
  const native = d.dispositions[0].review!.command!;
  const nativeReceipt = await json(
    f.owner,
    `supply/operations/${native.operation_id}`,
  );
  assert.equal(nativeReceipt.record_id, t.target_id);
  assert.equal(nativeReceipt.record_version, 2);
  assert.deepEqual(
    await json(f.owner, f.path + "/execute", f.original),
    f.receipt,
  );
});
