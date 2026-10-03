import assert from "node:assert/strict";
import { test } from "node:test";
import {
  conversionHttpFixture,
  conversionDetail,
  conversionPath,
  receiving,
  resolution,
  plan,
  conversion,
  session,
  request,
  json,
} from "../helpers/quotation-conversion-http";
test("ES07 compiled HTTP exact receiving resolution plan and real native target with current scope and recovery", async () => {
  const f = await conversionHttpFixture(),
    path = conversionPath(f.id),
    other = await session("second-company");
  const r = await request(f.owner, path);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control")!, /no-store/);
  assert.equal((await request(other, path)).status, 404);
  assert.equal((await request(f.owner, path + "?latest=true")).status, 422);
  let d = f.d;
  const rec = receiving(d, d.preparation!.detail.owner_id!);
  assert.equal(
    (
      await request(f.owner, path + "/receive", {
        ...rec,
        signature: "invented",
      })
    ).status,
    422,
  );
  assert.equal((await request(other, path + "/receive", rec)).status, 404);
  await json(f.owner, path + "/receive", rec);
  d = await conversionDetail(f.owner, f.id);
  assert.equal((await request(f.owner, path + "/plan", plan(d))).status, 409);
  await json(f.owner, path + "/resolve", resolution(d));
  d = await conversionDetail(f.owner, f.id);
  await json(f.owner, path + "/plan", plan(d));
  d = await conversionDetail(f.owner, f.id);
  const cmd = conversion(d),
    receipt = await json(f.owner, path + "/execute", cmd);
  assert.deepEqual(await json(f.owner, path + "/execute", cmd), receipt);
  assert.deepEqual(
    await json(f.owner, `operations/${cmd.operation_id}`),
    receipt,
  );
  assert.equal(
    (await request(f.owner, path + "/execute", { ...cmd, reason: "changed" }))
      .status,
    409,
  );
  d = await conversionDetail(f.owner, f.id);
  assert.equal(d.targets.length, 1);
  assert.equal(
    (await request(f.owner, `supply/records/${d.targets[0].target_id}`)).status,
    200,
  );
  assert.equal(
    (await request(other, `supply/records/${d.targets[0].target_id}`)).status,
    404,
  );
});
