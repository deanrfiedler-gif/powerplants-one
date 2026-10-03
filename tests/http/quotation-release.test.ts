import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  session,
  request,
  json,
  httpFixture,
  releasePath,
  detail,
  envelope,
  prepare,
  approve,
  issue,
} from "../helpers/quotation-release-http";

test("ES05 compiled HTTP exact approval, issue, distribution, original recovery and permission boundaries", async () => {
  const f = await httpFixture(),
    other = await session("second-company"),
    path = releasePath(f.draft.id);
  const read = await request(f.owner, path);
  assert.equal(read.status, 200);
  assert.match(read.headers.get("cache-control")!, /no-store/);
  assert.equal((await request(other, path)).status, 404);
  assert.equal((await request(f.owner, path + "?unexpected=1")).status, 422);
  const p = prepare(await detail(f.owner, f.draft.id));
  assert.equal(
    (await request(f.owner, path + "/prepare", { ...p, synthetic_only: false }))
      .status,
    422,
  );
  assert.equal(
    (
      await request(f.owner, path + "/prepare", {
        ...p,
        operative_terms: "invented",
      })
    ).status,
    422,
  );
  const accepted = await json(f.owner, path + "/prepare", p);
  assert.deepEqual(await json(f.owner, path + "/prepare", p), accepted);
  assert.deepEqual(
    await json(f.owner, `operations/${p.operation_id}`),
    accepted,
  );
  const next = releasePath(p.id);
  await json(f.owner, `estimating/quotes/${p.id}/render`, {});
  const a = approve(await detail(f.approver, p.id));
  assert.equal((await request(f.owner, next + "/approval", a)).status, 404);
  const approval = await json(f.approver, next + "/approval", a);
  assert.deepEqual(await json(f.approver, next + "/approval", a), approval);
  assert.equal(
    (
      await request(f.approver, next + "/approval", {
        ...a,
        operation_id: randomUUID(),
      })
    ).status,
    409,
  );
  const i = issue(await detail(f.issuer, p.id));
  assert.equal((await request(f.approver, next + "/issue", i)).status, 404);
  const issued = await json(f.issuer, next + "/issue", i);
  assert.deepEqual(
    await json(f.issuer, `operations/${i.operation_id}`),
    issued,
  );
  assert.equal(
    (await request(other, `operations/${i.operation_id}`)).status,
    404,
  );
  const d = await detail(f.issuer, p.id);
  await json(f.issuer, next + "/distribution", {
    ...envelope(d),
    issue_id: d.issue!.id,
    attempt_id: randomUUID(),
    resolves_event_id: null,
    outcome: "SimulatedDelivered",
  });
  const final = await detail(f.owner, p.id);
  assert.equal(final.events.length, 4);
  assert.equal(final.issue!.output_hash, final.approval!.output_hash);
  assert.equal(final.events.at(-1)!.outcome, "SimulatedDelivered");
  assert.match(
    await (
      await request(f.owner, `estimating/quotes/${p.id}/file?kind=html`)
    ).text(),
    /NO COMMERCIAL VALIDITY/,
  );
  assert.equal(
    (await request(other, `estimating/quotes/${p.id}/file?kind=pdf`)).status,
    404,
  );
});
