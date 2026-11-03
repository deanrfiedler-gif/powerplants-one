import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readDealFollowThrough } from "../../src/crm/worklist-followthrough";
import { createHandover } from "../../src/sales/handover-service";
import { crmDiscovery, crmBase, CRM } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import { releaseFixture, prepared, issued } from "../helpers/quotation-release";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable synthetic test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (expected: string) => (e: unknown) =>
  (e as { code: string }).code === expected;

test("CR-04 snapshot reads exact native sources, isolates revoked source permission and never exposes a hidden deal", async () => {
  const p = (await createSession("coordinator")).principal,
    o = crmDiscovery();
  await createOpportunity(p, o);
  const input = estimateInput(o.id);
  await createEstimate(p, input);
  const handover = randomUUID();
  await createHandover(p, {
    ...crmBase(),
    id: handover,
    opportunity_id: o.id,
    kind: "Estimating",
  });
  let d = await readDealFollowThrough(p, o.id);
  assert.equal(d.opportunity_version, 1);
  assert.equal(d.estimates.items[0].id, input.id);
  assert.ok(d.estimates.items[0].version_id);
  assert.ok(d.estimates.items[0].content_hash);
  assert.equal(d.handovers.items[0].id, handover);
  assert.equal(d.handovers.items[0].state, "Draft");
  assert.equal(d.quotations.availability, "Complete");
  assert.deepEqual(d.quotations.items, []);
  assert.equal(d.advisory.authority, "AdvisoryOnly");
  assert.equal(d.advisory.assessment, "ReviewRequired");
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.read'",
    [p.actor_id],
  );
  d = await readDealFollowThrough(p, o.id);
  assert.equal(d.estimates.availability, "Unavailable");
  assert.deepEqual(d.estimates.items, []);
  assert.equal(d.quotations.availability, "Unavailable");
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",
    [p.actor_id],
  );
  await assert.rejects(
    readDealFollowThrough(p, o.id),
    code("RecordUnavailable"),
  );
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    readDealFollowThrough(other, o.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readDealFollowThrough(other, randomUUID()),
    code("RecordUnavailable"),
  );
});

test("CR-04 issued quotation read retains exact revision and issue identity without publishing internal estimating content", async () => {
  const f = await releaseFixture(),
    prep = await prepared(f);
  await issued(f, prep.id);
  const d = await readDealFollowThrough(f.owner, f.o.id);
  assert.equal(d.quotations.items.length, 1);
  const q = d.quotations.items[0];
  assert.equal(q.revision_id, prep.id);
  assert.ok(q.issue_id);
  assert.equal(q.estimate_id, f.input.id);
  assert.equal(q.estimate_version_id, f.estimate.saved.id);
  assert.equal(q.response_outcome, null);
  const encoded = JSON.stringify(d);
  assert.ok(!encoded.includes("unit_cost"));
  assert.ok(!encoded.includes("private supplier cost"));
  assert.ok(!encoded.includes("safe_snapshot"));
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read'",
    [CRM.owner],
  );
  const hidden = await readDealFollowThrough(f.owner, f.o.id);
  assert.equal(hidden.quotations.availability, "Unavailable");
  assert.deepEqual(hidden.quotations.items, []);
});
