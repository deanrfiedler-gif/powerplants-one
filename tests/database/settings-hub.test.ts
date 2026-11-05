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
  submitAccessRequest,
  requestableCapability,
} from "../../src/access/requests";
import { capabilityCatalogue } from "../../src/access/capabilities";
import { listRecovery, dispositionRecovery } from "../../src/offline/recovery";
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
  const newerBranch = await proposeSchedulingPolicy(proposer, {
    ...input,
    ...base(),
    id: randomUUID(),
    effective_from: "2031-11-04T00:00:00.000Z",
  });
  const waiting = await readBusinessPolicies(proposer);
  assert.equal(waiting.items[0].state, "Waiting to publish");
  assert.equal(
    waiting.items[0].proposal_id,
    proposal.id,
    "a newer unreviewed branch must not hide the publishable branch",
  );
  assert.notEqual(waiting.items[0].proposal_id, newerBranch.receipt.record_id);
  assert.equal(
    (await readBusinessPolicy(proposer, waiting.items[0].id)).evidence?.review
      ?.id,
    evidence.review!.id,
  );
  assert.equal(
    (await readSettings(proposer)).policy_summary?.waiting_to_publish,
    1,
  );
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
  assert.equal(
    final.items[0].next_version,
    null,
    "branches against the old head cannot be published and are no longer open",
  );
  assert.equal(final.items[0].proposal_count, 0);
  assert.equal(final.items[0].proposal_id, null);
  assert.equal(final.items[0].state, "No proposal");
  assert.equal(final.proposal_count, 0);
  assert(final.items[0].last_change);
  const settings = await readSettings(proposer);
  assert.equal(settings.policy_summary?.waiting_to_publish, 0);
  assert(!settings.attention.some((a) => a.href.startsWith("/admin/policies")));
});
test("AD-02 discloses truncated access attention counts", async () => {
  await setupPolicy();
  const systems = await principal("systems"),
    reviewer = await principal("scheduling-policy-reviewer"),
    subject = await principal("site-observer");
  const capabilities = capabilityCatalogue
    .filter((c) => requestableCapability(c.key))
    .slice(0, 51);
  assert.equal(capabilities.length, 51);
  for (const capability of capabilities) {
    await submitAccessRequest(systems, {
      ...base(),
      request_id: randomUUID(),
      subject_id: subject.actor_id,
      reviewer_id: reviewer.actor_id,
      capability: capability.key,
      scope_type: "Company",
      company_id: "20000000-0000-4000-8000-000000000001",
      site_id: null,
      valid_from: "2035-01-01T00:00:00Z",
      valid_to: "2035-02-01T00:00:00Z",
    });
  }
  const settings = await readSettings(systems);
  assert.equal(
    settings.attention.filter((a) =>
      a.href.startsWith("/admin/access/requests/"),
    ).length,
    50,
  );
  assert.equal(settings.attention_has_more, true);
});
test("AD-02 excludes both recovery dispositions before paging and discloses truncated recovery counts", async () => {
  await setupPolicy();
  const owner = await principal("coordinator"),
    actor = await principal("assigned-technician");
  // Synthetic list fixtures retain the database's original-envelope and ownership constraints.
  const appointment = (
    await rows(
      "SELECT id,company_id,site_id FROM ppo.appointments WHERE id='a8000000-0000-4000-8000-000000000001'",
    )
  )[0];
  const activity = (
    await rows(
      "SELECT id FROM ppo.activities WHERE workspace_id=$1 ORDER BY id LIMIT 1",
      [workspace],
    )
  )[0];
  assert(activity, "seeded activity for synthetic recovery list fixtures");
  const grant = randomUUID();
  await rows(
    `INSERT INTO ppo.offline_recovery_grants(id,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,token_hash,authority,expires_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,'{}',clock_timestamp()+interval '1 day')`,
    [
      grant,
      workspace,
      actor.actor_id,
      appointment.company_id,
      appointment.site_id,
      appointment.id,
      owner.actor_id,
      "1".repeat(64),
    ],
  );
  const ids: string[] = [];
  for (let i = 0; i < 103; i++) {
    const id = randomUUID(),
      operation = randomUUID();
    ids.push(id);
    await rows(
      `INSERT INTO ppo.offline_recovery_cases(id,workspace_id,actor_id,operation_id,grant_id,activity_id,receipt_id,envelope,payload_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        workspace,
        actor.actor_id,
        operation,
        grant,
        activity.id,
        randomUUID(),
        {
          operation_id: operation,
          actor_id: actor.actor_id,
          workspace_id: workspace,
          appointment_id: appointment.id,
          command: "Capture",
          authority: {},
        },
        "2".repeat(64),
      ],
    );
  }
  for (const [id, disposition] of [
    [ids[102], "RetainedForReview"],
    [ids[101], "ClarificationRequired"],
  ])
    await dispositionRecovery(owner, id, {
      ...base(),
      disposition,
      note: "SYN retained disposition; no further initial review required.",
    });
  const waiting = await listRecovery(owner, true);
  assert.equal(waiting.items.length, 100);
  assert.equal(waiting.has_more, true);
  assert(waiting.items.every((r) => !r.dispositions.length));
  const settings = await readSettings(owner);
  assert.equal(
    settings.attention.filter((r) => r.href.startsWith("/admin/recovery/"))
      .length,
    100,
  );
  assert.equal(settings.attention_has_more, true);
  assert(
    !settings.attention.some((r) => r.id === ids[101] || r.id === ids[102]),
  );
  await dispositionRecovery(owner, ids[100], {
    ...base(),
    disposition: "RetainedForReview",
    note: "SYN removes the final overflow row.",
  });
  const exact = await listRecovery(owner, true);
  assert.equal(exact.items.length, 100);
  assert.equal(exact.has_more, false);
  assert.equal((await readSettings(owner)).attention_has_more, false);
  assert(
    (await listRecovery(owner)).items.some((r) => r.dispositions.length),
    "the full recovery list retains disposed evidence",
  );
});
