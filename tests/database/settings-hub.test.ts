import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { closeDatabase, transaction } from "../../src/platform/database";
import { readSettings } from "../../src/admin/settings";
import {
  readBusinessPolicies,
  readBusinessPolicy,
} from "../../src/admin/policies";
import {
  proposeSchedulingPolicy,
  reviewSchedulingPolicy,
  publishSchedulingPolicy,
  readPolicyEvidence,
} from "../../src/scheduling/policy-commands";
import { loadPolicyChain } from "../../src/scheduling/policy-persistence";
import { readOperation } from "../../src/shared/receipts";
import {
  base,
  code,
  principal,
  rows,
  setupPolicy,
  snapshot,
  workspace,
} from "../helpers/policy-commands";
const ref = (p: { id: string; version: number; content_hash: string }) => ({
  id: p.id,
  version: p.version,
  content_hash: p.content_hash,
});
before(setupPolicy);
after(closeDatabase);
test("AD-02 lists all seeded families, gates direct records and composes only permitted areas", async () => {
  const reviewer = await principal("scheduling-policy-reviewer"),
    observer = await principal("observer");
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='admin.access.read'",
    [workspace, reviewer.actor_id],
  );
  const register = await readBusinessPolicies(reviewer);
  assert.equal(register.items.filter((r) => r.area === "Scheduling").length, 1);
  assert.equal(
    register.items.filter((r) => r.area === "Field readiness").length,
    1,
  );
  assert.equal(
    register.items.filter((r) => r.area === "Working hours").length,
    2,
  );
  assert.equal(
    register.items.filter((r) => r.id === "record-references").length,
    1,
  );
  for (const item of register.items.filter(
    (r) => r.area === "Working hours" || r.area === "Field readiness",
  )) {
    const detail = await readBusinessPolicy(reviewer, item.id);
    assert.equal(detail.item.changes, "Seed only, no editor");
    assert(!detail.item.chain);
    assert.equal(detail.evidence, null);
  }
  await assert.rejects(
    readBusinessPolicies(observer),
    code("PolicyAuthorityRequired"),
  );
  await assert.rejects(
    readBusinessPolicy(observer, register.items[0].id),
    code("PolicyAuthorityRequired"),
  );
  const visible = await readSettings(reviewer);
  assert(visible.areas.some((a) => a.id === "policies"));
  assert(!visible.areas.some((a) => a.id === "access"));
  const hidden = await readSettings(observer);
  assert(!hidden.areas.some((a) => a.id === "policies"));
  assert(!hidden.attention.some((a) => a.href.startsWith("/admin/policies")));
  const systems = await readSettings(await principal("systems"));
  assert(systems.areas.some((a) => a.id === "access"));
  assert(!systems.areas.some((a) => a.id === "policies"));
});
test("AD-02 proposer refusal is atomic; publisher proposes without receiving a reviewer grant", async () => {
  const proposer = await principal("scheduling-policy-reviewer");
  const chain = await transaction((c) => loadPolicyChain(c, workspace));
  const input = {
    ...base(),
    id: randomUUID(),
    source: chain.head.policy,
    expected_head_version: chain.head.version,
    predecessor_proposal: null,
    max_visit_minutes: 420,
    effective_from: "2031-11-02T00:00:00.000Z",
  };
  const saved = await proposeSchedulingPolicy(proposer, input);
  const { proposal } = await readPolicyEvidence(
    proposer,
    "proposal",
    saved.receipt.record_id,
  );
  const before = await snapshot();
  await assert.rejects(
    reviewSchedulingPolicy(proposer, {
      ...base(),
      id: randomUUID(),
      proposal: ref(proposal),
    }),
    code("IndependentReviewerRequired"),
  );
  assert.deepEqual(await snapshot(), before);
  const publisher = await principal("scheduling-policy-publisher");
  const command = { ...input, ...base(), id: randomUUID() };
  const accepted = await proposeSchedulingPolicy(publisher, command);
  assert.equal(
    (await readOperation(publisher, command.operation_id)).record_id,
    accepted.receipt.record_id,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='schedule.policy.review'",
        [workspace, publisher.actor_id],
      )
    )[0].n,
    0,
  );
});
test("AD-02 stale review publication refuses atomically; current publication recovers its exact receipt", async () => {
  const proposer = await principal("scheduling-policy-publisher"),
    reviewer = await principal("scheduling-policy-reviewer");
  const chain = await transaction((c) => loadPolicyChain(c, workspace));
  const input = {
    ...base(),
    id: randomUUID(),
    source: chain.head.policy,
    expected_head_version: chain.head.version,
    predecessor_proposal: null,
    max_visit_minutes: 420,
    effective_from: "2031-10-22T00:00:00.000Z",
  };
  const saved = await proposeSchedulingPolicy(proposer, input);
  const { proposal } = await readPolicyEvidence(
    proposer,
    "proposal",
    saved.receipt.record_id,
  );
  const reviewed = await reviewSchedulingPolicy(reviewer, {
    ...base(),
    id: randomUUID(),
    proposal: ref(proposal),
  });
  const evidence = await readPolicyEvidence(
    proposer,
    "review",
    reviewed.receipt.record_id,
  );
  const publish = {
    ...base(),
    proposal: ref(proposal),
    review: ref(evidence.review!),
    source: proposal.source,
    expected_head_version: proposal.expected_head.version,
    selected_policy: evidence.selected_policy,
  };
  const successor = await proposeSchedulingPolicy(proposer, {
    ...input,
    ...base(),
    id: randomUUID(),
    predecessor_proposal: ref(proposal),
    effective_from: "2031-11-03T00:00:00.000Z",
  });
  const before = await snapshot();
  await assert.rejects(publishSchedulingPolicy(proposer, publish));
  assert.deepEqual(await snapshot(), before);
  const next = await readPolicyEvidence(
    proposer,
    "proposal",
    successor.receipt.record_id,
  );
  const nextReview = await reviewSchedulingPolicy(reviewer, {
    ...base(),
    id: randomUUID(),
    proposal: ref(next.proposal),
  });
  const exact = await readPolicyEvidence(
    proposer,
    "review",
    nextReview.receipt.record_id,
  );
  const command = {
    ...base(),
    proposal: ref(next.proposal),
    review: ref(exact.review!),
    source: next.proposal.source,
    expected_head_version: next.proposal.expected_head.version,
    selected_policy: exact.selected_policy,
  };
  const result = await publishSchedulingPolicy(proposer, command);
  assert.deepEqual(
    (await publishSchedulingPolicy(proposer, command)).receipt,
    result.receipt,
  );
  assert.deepEqual(
    await readOperation(proposer, command.operation_id),
    result.receipt,
  );
  const final = await readBusinessPolicies(proposer);
  assert.equal(
    final.items[0].version,
    1,
    "future publication must not be called in force",
  );
  assert.equal(final.items[0].chain!.head.version, 2);
});
