import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  projectFinanceFixture,
  crmBase,
} from "../helpers/project-claim-finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("B3 compiled HTTP uses existing Finance create, submit, review, processing and recovery routes", async () => {
  const f = await projectFinanceFixture(),
    input = f.draft([4]);
  const created = await h.call("finance", "finance/handoffs", input);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const path = `finance/handoffs/${input.id}`;
  const read = () => h.call("finance", path);
  let r = await read();
  assert.equal(r.body.handoff.source_kind, "ProjectClaim");
  assert.equal(
    (
      await h.call("finance", `${path}/submit`, {
        ...crmBase(),
        expected_version: r.body.handoff.version,
      })
    ).status,
    201,
  );
  r = await read();
  const review = {
    ...crmBase(),
    expected_version: r.body.handoff.version,
    revision_id: r.body.handoff.current_revision_id,
    source_hash: r.body.revisions[0].source_hash,
    decision: "Approved",
  };
  assert.equal(
    (await h.call("finance-reviewer", `${path}/review`, review)).status,
    201,
  );
  r = await read();
  assert.equal(
    (
      await h.call("finance-processor", `${path}/begin-processing`, {
        ...crmBase(),
        expected_version: r.body.handoff.version,
        scenario: "AcceptedThenTimeout",
      })
    ).status,
    201,
  );
  r = await read();
  const dispatch = {
    ...crmBase(),
    expected_version: r.body.handoff.version,
    attempt_id: r.body.handoff.active_attempt_id,
    action: "Dispatch",
  };
  assert.equal(
    (await h.call("finance-processor", `${path}/record-outcome`, dispatch))
      .status,
    201,
  );
  r = await read();
  assert.equal(r.body.handoff.status, "OutcomeUnknown");
  assert.equal(r.body.targets.length, 0);
  assert.equal(
    (
      await h.call("finance-processor", `${path}/record-outcome`, {
        ...dispatch,
        ...crmBase(),
        expected_version: r.body.handoff.version,
        action: "LookupOriginal",
      })
    ).status,
    201,
  );
  const replay = await h.call("finance", "finance/handoffs", input);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  assert.equal((await h.call("second-company", path)).status, 403);
  assert.equal(
    (
      await h.call("finance", "finance/handoffs", {
        ...f.draft(),
        amount: "0.01",
      })
    ).status,
    422,
  );
});
