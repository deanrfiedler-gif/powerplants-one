import assert from "node:assert/strict";
import { test } from "node:test";
import {
  materialHttpFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  materialApply,
  json,
  request,
  session,
  conversionDetail,
} from "../helpers/quotation-material-resolution-http";
test("ES07 three-task chain HTTP requires independent downstream authority and returns exact native receipts and honest unmet Demand", async () => {
  const f = await materialHttpFixture(false, true, true),
    denied = await session("second-company");
  const proposal = {
    ...materialProposal(await f.current(), f.task.id),
    successor_task_id: f.successor!.id,
    chain_end_task_id: f.chainEnd!.id,
  };
  assert.equal(
    (await request(denied, f.path + "/material-propose", proposal)).status,
    404,
  );
  const receipt = await json(f.owner, f.path + "/material-propose", proposal);
  assert.deepEqual(
    await json(f.owner, f.path + "/material-propose", proposal),
    receipt,
  );
  assert.equal(
    (
      await request(f.owner, f.path + "/material-propose", {
        ...proposal,
        evidence: "SYN changed",
      })
    ).status,
    409,
  );
  let t = await f.current();
  assert.equal(
    (await request(f.owner, f.path + "/material-review", materialReview(t)))
      .status,
    409,
  );
  for (const role of [
    "Demand",
    "Project",
    "Task",
    "MaterialAction",
    "Successor",
    "ChainEnd",
  ] as const) {
    const cmd = materialReceiving(await f.current(), role);
    const results = await Promise.all([
      json(f.owner, f.path + "/material-receive", cmd),
      json(f.owner, f.path + "/material-receive", cmd),
    ]);
    assert.deepEqual(results[0], results[1]);
  }
  await json(
    f.owner,
    f.path + "/material-review",
    materialReview(await f.current()),
  );
  t = await f.current();
  assert.equal(
    (await request(denied, f.path + "/material-apply", materialApply(t)))
      .status,
    404,
  );
  const cmd = materialApply(t),
    applied = await json(f.owner, f.path + "/material-apply", cmd);
  assert.deepEqual(
    await json(f.owner, f.path + "/material-apply", cmd),
    applied,
  );
  t = await f.current();
  const outcome = t.material_resolution.applied!;
  assert.equal(outcome.after!.unmet, "3.624999");
  assert.equal(outcome.after!.project.task.start_date, null);
  assert.equal(outcome.effect_receiving_ids.length, 6);
  assert.equal(outcome.native_receipts.length, 4);
  assert.equal(outcome.after!.project.successor!.start_date, null);
  assert.equal(outcome.after!.project.chainEnd!.start_date, null);
  for (const receipt of outcome.native_receipts) {
    assert.deepEqual(
      await json(f.owner, `operations/${receipt.operation_id}`),
      receipt,
    );
    assert.equal(
      (await request(denied, `operations/${receipt.operation_id}`)).status,
      404,
    );
  }
  assert.equal(
    (await conversionDetail(f.owner, f.id)).dispositions[0].status,
    "Review required",
  );
});
