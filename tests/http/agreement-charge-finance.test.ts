import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import {
  agreementChargeFixture,
  base,
} from "../helpers/agreement-charge-finance";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable database required");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);
test("C1 compiled HTTP uses existing Finance routes, exact source receipt replay and protected queue", async () => {
  const f = await agreementChargeFixture(),
    cmd = f.draft();
  const created = await h.call("finance", "finance/handoffs", cmd);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const path = `finance/handoffs/${cmd.id}`,
    read = () => h.call("finance", path);
  let r = await read();
  assert.equal(r.body.handoff.source_kind, "AgreementCharge");
  assert.equal(r.body.lines[0].claim_amount, "4800.00");
  assert.equal(
    (
      await h.call("finance", path + "/submit", {
        ...base(),
        expected_version: r.body.handoff.version,
      })
    ).status,
    201,
  );
  r = await read();
  assert.equal(
    (
      await h.call("finance-reviewer", path + "/review", {
        ...base(),
        expected_version: r.body.handoff.version,
        revision_id: r.body.handoff.current_revision_id,
        source_hash: r.body.revisions[0].source_hash,
        decision: "Approved",
      })
    ).status,
    201,
  );
  r = await read();
  assert.equal(
    (
      await h.call("finance-processor", path + "/begin-processing", {
        ...base(),
        expected_version: r.body.handoff.version,
        scenario: "AcceptedThenTimeout",
      })
    ).status,
    201,
  );
  r = await read();
  assert.equal(
    (
      await h.call("finance-processor", path + "/record-outcome", {
        ...base(),
        expected_version: r.body.handoff.version,
        attempt_id: r.body.handoff.active_attempt_id,
        action: "Dispatch",
      })
    ).status,
    201,
  );
  r = await read();
  assert.equal(r.body.handoff.status, "OutcomeUnknown");
  const agreementPath = `maintenance/agreements/${f.id}`;
  const version = async () =>
    (
      await database().query(
        "SELECT version,current_revision_id FROM ppo.service_agreements WHERE id=$1",
        [f.id],
      )
    ).rows[0];
  const changed = await h.call("coordinator", agreementPath, {
    ...base(),
    expected_version: (await version()).version,
    action: "Revise",
    content: { ...f.content, title: "SYN HTTP title-only successor" },
  });
  assert.equal(changed.status, 200, JSON.stringify(changed.body));
  const approved = await h.call("finance-reviewer", agreementPath, {
    ...base(),
    expected_version: (await version()).version,
    action: "Approve",
    authority_reference: "SYN HTTP exact successor approval",
  });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  const duplicate = {
    ...f.draft(),
    agreement_revision_id: (await version()).current_revision_id,
  };
  const duplicateSaved = await h.call("finance", "finance/handoffs", duplicate);
  assert.equal(duplicateSaved.status, 201, JSON.stringify(duplicateSaved.body));
  const duplicateRead = await h.call(
    "finance",
    `finance/handoffs/${duplicate.id}`,
  );
  const refused = await h.call(
    "finance",
    `finance/handoffs/${duplicate.id}/submit`,
    { ...base(), expected_version: duplicateRead.body.handoff.version },
  );
  assert.equal(refused.status, 409, JSON.stringify(refused.body));
  assert.equal(refused.body.code, "ClaimEntitlementUnavailable");
  assert.equal(
    (
      await h.call("finance-processor", path + "/record-outcome", {
        ...base(),
        expected_version: r.body.handoff.version,
        attempt_id: r.body.handoff.active_attempt_id,
        action: "LookupOriginal",
      })
    ).status,
    201,
  );
  const replay = await h.call("finance", "finance/handoffs", cmd);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, created.body);
  assert.ok([403, 404].includes((await h.call("second-company", path)).status));
  const queue = await h.call(
    "finance",
    "finance/handoffs?source_kind=AgreementCharge",
  );
  assert.equal(queue.status, 200);
  assert.ok(queue.body.items.some((x: { id: string }) => x.id === cmd.id));
  assert.equal(
    (
      await h.call("finance", "finance/handoffs", {
        ...f.draft(),
        charge_ids: [f.first],
        amount: "0.01",
      })
    ).status,
    422,
  );
});
