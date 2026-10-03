import assert from "node:assert/strict";
import { test } from "node:test";
import {
  responseHttpFixture,
  responseDetail,
  responsePath,
  response,
  responseCommand,
  session,
  request,
  json,
} from "../helpers/quotation-response-http";
test("ES06 compiled HTTP exact report/correction/preparation and current-scope receipt recovery", async () => {
  const f = await responseHttpFixture(),
    path = responsePath(f.id),
    other = await session("second-company"),
    command = response(f.d);
  const read = await request(f.owner, path);
  assert.equal(read.status, 200);
  assert.match(read.headers.get("cache-control")!, /no-store/);
  assert.equal((await request(other, path)).status, 404);
  assert.equal((await request(f.owner, path + "?latest=true")).status, 422);
  assert.equal(
    (
      await request(f.owner, path + "/record", {
        ...command,
        signature: "invented",
      })
    ).status,
    422,
  );
  assert.equal(
    (await request(f.approver, path + "/record", command)).status,
    404,
  );
  assert.equal((await request(other, path + "/record", command)).status, 404);
  const r = await json(f.owner, path + "/record", command);
  assert.deepEqual(await json(f.owner, path + "/record", command), r);
  assert.deepEqual(
    await json(f.owner, `operations/${command.operation_id}`),
    r,
  );
  assert.equal(
    (await request(other, `operations/${command.operation_id}`)).status,
    404,
  );
  assert.equal(
    (
      await request(f.owner, path + "/record", {
        ...command,
        reason: "changed",
      })
    ).status,
    409,
  );
  let d = await responseDetail(f.owner, f.id);
  const prep = {
    ...responseCommand(d),
    owner_id: d.owner_id,
    due_date: "2026-10-10",
    note: "SYN receiver must verify authority",
  };
  const p = await json(f.owner, path + "/prepare", prep);
  d = await responseDetail(f.owner, f.id);
  assert.equal(d.state.preparedApplicable, true);
  await json(f.owner, path + "/record", {
    ...response(d, "Declined"),
    action: "Correct",
  });
  d = await responseDetail(f.owner, f.id);
  assert.equal(d.events.length, 3);
  assert.equal(d.events[0].report!.outcome, "Accepted");
  assert.equal(d.state.preparedApplicable, false);
  assert.deepEqual(await json(f.owner, `operations/${prep.operation_id}`), p);
  assert.deepEqual(await json(f.owner, path + "/record", command), r);
  assert.equal(
    (await request(f.owner, `estimating/quotes/${f.id}/file?kind=pdf`)).status,
    200,
  );
});
