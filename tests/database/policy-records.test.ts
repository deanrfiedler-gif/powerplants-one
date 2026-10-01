import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { closeDatabase } from "../../src/platform/database";
import {
  proposeSchedulingPolicy,
  publishSchedulingPolicy,
  readPolicyEvidence,
} from "../../src/scheduling/policy-commands";
import { readPolicyRecords } from "../../src/scheduling/policy-records";
import {
  setupPolicy,
  principal,
  proposed,
  reviewed,
  rows,
  code,
  base,
  snapshot,
} from "../helpers/policy-commands";
beforeEach(setupPolicy);
after(closeDatabase);

test("PL04 discovery is paged, actor-bound, private to dedicated duties and independent of booking authority", async () => {
  const first = await proposed(),
    second = await proposed(75);
  const list = await readPolicyRecords(first.reviewer, {
    kind: "proposal",
    limit: "1",
  });
  assert.equal(list.items.length, 1);
  assert(list.next_cursor);
  assert.equal(list.can_review, true);
  assert.equal(list.can_publish, false);
  const next = await readPolicyRecords(first.reviewer, {
    kind: "proposal",
    limit: "1",
    cursor: list.next_cursor,
  });
  assert.equal(next.items.length, 1);
  assert.notEqual(list.items[0].id, next.items[0].id);
  assert.equal(next.next_cursor, null);
  assert.deepEqual(
    [list.items[0].id, next.items[0].id].sort(),
    [first.proposal.id, second.proposal.id].sort(),
  );
  await assert.rejects(
    readPolicyRecords(first.publisher, {
      kind: "proposal",
      limit: "1",
      cursor: list.next_cursor,
    }),
    code("InvalidData"),
  );
  for (const profile of [
    "coordinator",
    "systems",
    "observer",
    "other-workspace",
  ])
    await assert.rejects(
      readPolicyRecords(await principal(profile), {}),
      code("PolicyAuthorityRequired"),
    );
  assert.deepEqual(
    await rows(
      "SELECT capability FROM ppo.permission_grants WHERE user_id=ANY($1::uuid[]) AND capability IN ('schedule.manage','service.work_order.edit','field.work')",
      [[first.reviewer.actor_id, first.publisher.actor_id]],
    ),
    [],
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.policy.review'",
    [first.reviewer.actor_id],
  );
  await assert.rejects(
    readPolicyRecords(first.reviewer, {}),
    code("PolicyAuthorityRequired"),
  );
  await assert.rejects(
    readPolicyEvidence(first.reviewer, "proposal", first.proposal.id),
    code("PolicyAuthorityRequired"),
  );
});

test("PL04 reopened evidence retains originals, related successors and a new successor may bind the newer publication head", async () => {
  const f = await reviewed();
  const original = await readPolicyEvidence(
    f.reviewer,
    "proposal",
    f.proposal.id,
  );
  assert.equal(original.latest_review_id, f.review.id);
  const published = await publishSchedulingPolicy(f.publisher, f.publish);
  const next = await proposed(90, "2031-09-23T00:00:00.000Z");
  const result = await proposeSchedulingPolicy(f.reviewer, {
    ...next.command,
    ...base(),
    id: randomUUID(),
    predecessor_proposal: f.publish.proposal,
  });
  const reopened = await readPolicyEvidence(
    f.reviewer,
    "proposal",
    f.proposal.id,
  );
  assert.deepEqual(reopened.proposal, original.proposal);
  assert.equal(reopened.successor_proposal_id, result.receipt.record_id);
  assert.equal(reopened.publication_id, published.receipt.record_id);
  const successor = await readPolicyEvidence(
    f.reviewer,
    "proposal",
    result.receipt.record_id,
  );
  assert.equal(successor.proposal.version, 2);
  assert.deepEqual(successor.proposal.predecessor_proposal, f.publish.proposal);
  assert.equal(successor.proposal.expected_head.version, 2);
  await assert.rejects(
    proposeSchedulingPolicy(f.reviewer, {
      ...next.command,
      ...base(),
      id: randomUUID(),
      predecessor_proposal: f.publish.proposal,
    }),
    code("InvalidData"),
  );
});

test("PL04 publication read returns exact actor receipt and typed current handovers without altering durable evidence", async () => {
  const f = await reviewed();
  const result = await publishSchedulingPolicy(f.publisher, f.publish);
  const before = await snapshot();
  const record = await readPolicyEvidence(
    f.publisher,
    "publication",
    result.receipt.record_id,
  );
  assert.deepEqual(record.receipt, result.receipt);
  assert.deepEqual(record.proposal, f.proposal);
  assert.deepEqual(record.review, f.review);
  assert.equal(record.impacts?.length, 1);
  const impact = record.impacts![0];
  assert(impact.held);
  assert.equal(impact.disposition, "Unresolved");
  assert.equal(impact.owner_name, "SYN Coordinator");
  assert(!result.receipt.task_ids.includes(impact.activity_id));
  assert.equal(
    (
      await rows(
        "SELECT impact_id FROM ppo.scheduling_policy_impact_activities WHERE activity_id=$1",
        [impact.activity_id],
      )
    )[0].impact_id,
    impact.id,
  );
  assert.equal(
    (
      await readPolicyEvidence(
        f.reviewer,
        "publication",
        result.receipt.record_id,
      )
    ).receipt,
    null,
  );
  assert.deepEqual(await snapshot(), before);
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.policy.publish'",
    [f.publisher.actor_id],
  );
  await assert.rejects(
    readPolicyEvidence(f.publisher, "publication", result.receipt.record_id),
    code("PolicyAuthorityRequired"),
  );
});
