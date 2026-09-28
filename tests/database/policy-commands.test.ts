import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { after, beforeEach, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import {
  proposeSchedulingPolicy,
  reviewSchedulingPolicy,
  publishSchedulingPolicy,
  readPolicyEvidence,
} from "../../src/scheduling/policy-commands";
import {
  readPolicyImpact,
  resolveSchedulingPolicyImpact,
} from "../../src/scheduling/policy-resolution";
import { readOperation } from "../../src/shared/receipts";
import {
  readAppointment,
  cancelAppointment,
} from "../../src/scheduling/planner";
import { activityCommand } from "../../src/activities/activities";
import { confirmed, id as fixtureId } from "../helpers/packs";
import {
  base,
  code,
  principal,
  proposed,
  reviewed,
  reviewerId,
  publisherId,
  rows,
  setupPolicy,
  snapshot,
  workspace,
  replayPolicySeed,
  populationBooking,
} from "../helpers/policy-commands";

beforeEach(setupPolicy);
after(closeDatabase);

test("C26 dedicated Workspace authority, current identity, narrow scopes and hidden-source protection; reseed retains revocations", async () => {
  const f = await proposed();
  const cmd = {
    ...base(),
    id: randomUUID(),
    proposal: {
      id: f.proposal.id,
      version: 1,
      content_hash: f.proposal.content_hash,
    },
  };
  for (const profile of [
    "coordinator",
    "systems",
    "observer",
    "site-observer",
    "workspace-observer",
    "scheduling-policy-publisher",
  ])
    await assert.rejects(
      reviewSchedulingPolicy(await principal(profile), cmd),
      code("PolicyAuthorityRequired"),
    );
  const grants = await rows(
    "SELECT * FROM ppo.permission_grants WHERE user_id=$1 ORDER BY capability",
    [publisherId],
  );
  assert.deepEqual(
    grants.map((g) => g.capability),
    [
      "activity.read",
      "schedule.policy.publish",
      "schedule.read",
      "service.ticket.read",
      "service.work_order.read",
      "shared.read",
    ],
  );
  assert(
    grants.every(
      (g) =>
        g.scope_type === "Workspace" &&
        g.scope_id === workspace &&
        g.company_id === null &&
        g.site_id === null,
    ),
  );
  const original = await rows(
    "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.policy.review'",
    [reviewerId],
  );
  for (const scope of ["Company", "Site"]) {
    await rows(
      "UPDATE ppo.permission_grants SET scope_type=$2,scope_id=$3,company_id=$4,site_id=$5 WHERE id=$1",
      [
        original[0].id,
        scope,
        scope === "Company" ? fixtureId("20") : fixtureId("70"),
        fixtureId("20"),
        scope === "Site" ? fixtureId("70") : null,
      ],
    );
    await assert.rejects(
      reviewSchedulingPolicy(f.reviewer, cmd),
      code("PolicyAuthorityRequired"),
    );
  }
  await rows(
    "UPDATE ppo.permission_grants SET scope_type='Workspace',scope_id=$2,company_id=NULL,site_id=NULL WHERE id=$1",
    [original[0].id, workspace],
  );
  for (const patch of [
    "valid_to=clock_timestamp()-interval '1 second'",
    "valid_from=clock_timestamp()+interval '1 day',valid_to=NULL",
  ]) {
    await rows(`UPDATE ppo.permission_grants SET ${patch} WHERE id=$1`, [
      original[0].id,
    ]);
    await assert.rejects(
      reviewSchedulingPolicy(f.reviewer, cmd),
      code("PolicyAuthorityRequired"),
    );
  }
  await rows(
    "UPDATE ppo.permission_grants SET valid_from=$2,valid_to=NULL WHERE id=$1",
    [original[0].id, original[0].valid_from],
  );
  await rows("UPDATE ppo.users SET active=false WHERE id=$1", [reviewerId]);
  await assert.rejects(
    reviewSchedulingPolicy(f.reviewer, cmd),
    code("PolicyAuthorityRequired"),
  );
  await replayPolicySeed();
  assert.equal(
    (await rows("SELECT active FROM ppo.users WHERE id=$1", [reviewerId]))[0]
      .active,
    false,
  );
  await rows("UPDATE ppo.users SET active=true WHERE id=$1", [reviewerId]);
  // No count or record identity is returned when complete reads have become narrow.
  await rows(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,company_id=$3,site_id=$2 WHERE user_id=$1 AND capability='shared.read'",
    [reviewerId, fixtureId("70"), fixtureId("20")],
  );
  await assert.rejects(reviewSchedulingPolicy(f.reviewer, cmd), (e) => {
    assert.equal((e as { code: string }).code, "PolicyAuthorityRequired");
    assert.equal(
      (e as Error).message,
      "Current workspace policy authority and complete source visibility are required.",
    );
    return true;
  });
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=$1",
    [original[0].id],
  );
  const revoked = await rows(
    "SELECT * FROM ppo.permission_grants WHERE id=$1",
    [original[0].id],
  );
  await replayPolicySeed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants WHERE id=$1", [
      original[0].id,
    ]),
    revoked,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.scheduling_policy_reviews"))[0]
      .n,
    0,
  );
});

test("C26 immutable proposal edits and frozen review bindings; complete empty population publishes without invented candidates", async () => {
  const f = await proposed(90, "2032-01-01T00:00:00.000Z");
  const old = await snapshot(["scheduling_policy_proposals"]);
  const edit = {
    ...f.command,
    ...base(),
    id: randomUUID(),
    predecessor_proposal: {
      id: f.proposal.id,
      version: 1,
      content_hash: f.proposal.content_hash,
    },
    max_visit_minutes: 120,
  };
  const changed = await proposeSchedulingPolicy(f.reviewer, edit);
  assert.equal(changed.receipt.record_version, 2);
  assert.deepEqual(
    (
      await snapshot(["scheduling_policy_proposals"])
    ).scheduling_policy_proposals.filter(
      (p: { id: string }) => p.id === f.proposal.id,
    ),
    old.scheduling_policy_proposals,
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.scheduling_policy_proposals SET proposed_at=clock_timestamp() WHERE id=$1",
      [f.proposal.id],
    ),
  );
  await assert.rejects(
    reviewSchedulingPolicy(f.reviewer, {
      ...base(),
      id: randomUUID(),
      proposal: edit.predecessor_proposal,
    }),
    code("InvalidData"),
  );
  const g = await reviewed(60, "2032-01-01T00:00:00.000Z");
  assert.equal(g.review.candidates.length, 0);
  assert.equal(g.review.coverage, "CompleteWorkspaceFamily");
  const before = await snapshot();
  for (const bad of [
    {
      ...g.publish,
      review: { ...g.publish.review, content_hash: "0".repeat(64) },
    },
    { ...g.publish, source: { ...g.publish.source, version: 2 } },
    {
      ...g.publish,
      selected_policy: { ...g.publish.selected_policy, id: randomUUID() },
    },
    { ...g.publish, candidates: [] },
    { ...g.publish, preview_hash: "0".repeat(64) },
  ])
    await assert.rejects(
      publishSchedulingPolicy(g.publisher, bad),
      code("InvalidData"),
    );
  assert.deepEqual(await snapshot(), before);
  const published = await publishSchedulingPolicy(g.publisher, g.publish);
  assert.equal(published.receipt.state, "Published");
  assert.equal(
    (await rows("SELECT count(*)::int n FROM ppo.scheduling_policy_impacts"))[0]
      .n,
    0,
  );
  assert.equal(
    (
      await rows("SELECT payload FROM ppo.outbox_jobs WHERE id=$1", [
        published.receipt.task_ids[0],
      ])
    )[0].payload.impact_count,
    0,
  );
});

test("C26 whole population 200 accepted / 201 refused, including missing evidence and exact source identities", async () => {
  for (let n = 1; n < 200; n++) await populationBooking(n);
  const f = await reviewed(60);
  assert.equal(f.review.candidates.length, 200);
  assert.equal(
    new Set(
      f.review.candidates.map((x) => x.dependencies.booking.appointment.id),
    ).size,
    200,
  );
  const absent = f.review.candidates.find(
    (x) => !x.dependencies.contact_preparation.contact_outcomes.length,
  )!;
  assert(
    absent.evaluation.checks.some(
      (x) => x.dimension === "ContactPreparation" && x.outcome === "Blocked",
    ),
  );
  assert.deepEqual(
    absent.dependencies.contact_preparation.contact_outcomes,
    [],
  );
  assert(
    absent.dependencies.scope_readiness.scope_assets.every(
      (x) =>
        x.key.includes('"scope_item_id"') &&
        x.key.includes('"asset_id"') &&
        x.version === null,
    ),
  );
  await populationBooking(200);
  const before = await snapshot();
  await assert.rejects(
    reviewSchedulingPolicy(f.reviewer, {
      ...f.reviewCommand,
      ...base(),
      id: randomUUID(),
    }),
    code("InvalidData"),
  );
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, f.publish),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
});

test("C26 all seven dimensions, compliant bookings retained; booking, source, owner and permission changes stale the entire review", async () => {
  const booking = await confirmed();
  let f = await reviewed(480);
  const candidate = f.review.candidates.find(
    (x) => x.dependencies.booking.appointment.id === booking.id,
  )!;
  assert.equal(
    candidate.evaluation.outcome,
    "Compliant",
    candidate.impact_reason ?? undefined,
  );
  assert.equal(candidate.evaluation.checks.length, 7);
  assert.equal(candidate.impact_owner_id, null);
  const changes = [
    {
      table: "appointments",
      id: booking.id,
      column: "version",
      value: booking.version + 1,
    },
    {
      table: "people",
      id: candidate.dependencies.contact_preparation.primary_contact!.id,
      column: "version",
      value: 2,
    },
    {
      table: "work_orders",
      id: booking.work_order_id,
      column: "version",
      value: booking.work_order_version + 1,
    },
    {
      table: "users",
      id: candidate.dependencies.ownership.service_owner.user.id,
      column: "display_name",
      value: "SYN changed owner evidence",
    },
  ];
  for (const change of changes) {
    await rows(
      `UPDATE ppo.${change.table} SET ${change.column}=$2 WHERE id=$1`,
      [change.id, change.value],
    );
    const before = await snapshot();
    await assert.rejects(
      publishSchedulingPolicy(f.publisher, f.publish),
      code("InvalidData"),
    );
    assert.deepEqual(await snapshot(), before);
    f = await reviewed(480);
  }
  const grant = (
    await rows(
      "SELECT * FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit' LIMIT 1",
      [candidate.dependencies.ownership.service_owner.user.id],
    )
  )[0];
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE id=$1",
    [grant.id],
  );
  await assert.rejects(publishSchedulingPolicy(f.publisher, f.publish));
  await rows("UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1", [
    grant.id,
    grant.valid_to,
  ]);
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()+interval '1 day' WHERE user_id=$1 AND capability='schedule.policy.review'",
    [reviewerId],
  );
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, f.publish),
    code("InvalidData"),
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.scheduling_policy_publications",
      )
    )[0].n,
    0,
  );
});

test("C26 failure after EACH durable publication stage rolls the complete graph back through actual handler", async () => {
  const f = await reviewed();
  const before = await snapshot();
  const stages = [
    "scheduling_policies",
    "scheduling_policy_members",
    "scheduling_policy_publications",
    "scheduling_policy_heads",
    "scheduling_policy_impacts",
    "activities",
    "activity_links",
    "scheduling_policy_impact_activities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ];
  await rows(
    "CREATE FUNCTION ppo.policy_command_injected_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN injected publication failure'; END $$",
  );
  try {
    for (const table of stages) {
      await rows(
        `CREATE TRIGGER policy_command_injected_failure AFTER ${table === "scheduling_policy_heads" ? "UPDATE" : "INSERT"} ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.policy_command_injected_failure()`,
      );
      try {
        await assert.rejects(
          publishSchedulingPolicy(f.publisher, f.publish),
          /SYN injected publication failure/,
        );
      } finally {
        await rows(
          `DROP TRIGGER policy_command_injected_failure ON ppo.${table}`,
        );
      }
      assert.deepEqual(
        await snapshot(),
        before,
        `complete rollback after ${table}`,
      );
    }
  } finally {
    await rows("DROP FUNCTION ppo.policy_command_injected_failure()");
  }
  assert.equal(
    (await publishSchedulingPolicy(f.publisher, f.publish)).replayed,
    false,
  );
});

test("C26 lost response, exact replay after head/review advance, minimal EVT-12, typed Activity IDs and current-caller authority", async () => {
  const f = await reviewed(),
    preserved = await snapshot([
      "appointments",
      "assignments",
      "resource_reservations",
      "pack_revisions",
      "pack_issues",
      "field_entries",
      "offline_recovery_cases",
    ]);
  const oldPolicies = await snapshot(["scheduling_policies"]);
  await publishSchedulingPolicy(f.publisher, f.publish); // accepted response deliberately discarded
  const original = await readOperation(f.publisher, f.publish.operation_id),
    retry = await publishSchedulingPolicy(f.publisher, f.publish);
  assert.deepEqual(retry, { receipt: original, replayed: true });
  const outbox = (
    await rows("SELECT * FROM ppo.outbox_jobs WHERE id=$1", [
      original.task_ids[0],
    ])
  )[0];
  assert.equal(outbox.kind, "PolicyOrTemplatePublished");
  assert.deepEqual(
    Object.keys(outbox.payload).sort(),
    [
      "family",
      "impact_count",
      "object_type",
      "policy_id",
      "policy_version",
      "policy_hash",
      "record_id",
      "record_version",
      "review_id",
      "review_hash",
      "population_hash",
      "synthetic",
    ].sort(),
  );
  assert.equal(outbox.payload.impact_count, 1);
  const linked = await readPolicyEvidence(
    f.publisher,
    "publication",
    original.record_id,
  );
  assert.equal(linked.impacts!.length, 1);
  assert(!original.task_ids.includes(linked.impacts![0].activity_id));
  const second = await reviewed(75, "2031-09-22T00:30:00.000Z");
  assert.equal(second.chain.head.version, 2);
  assert(
    second.review.candidates.some(
      (x) =>
        x.dependencies.booking.scheduling_policy.id === f.chain.seed_root.id,
    ),
  );
  await publishSchedulingPolicy(second.publisher, second.publish);
  // Historical reviewer/impact-owner eligibility is not reapplied to an accepted original.
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE (user_id=$1 AND capability='schedule.policy.review') OR (user_id=$2 AND capability='service.work_order.edit')",
    [reviewerId, fixtureId("30")],
  );
  assert.deepEqual(
    (await publishSchedulingPolicy(f.publisher, f.publish)).receipt,
    original,
  );
  const before = await snapshot();
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, {
      ...f.publish,
      reason: "SYN altered retry",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, {
      ...f.publish,
      operation_id: randomUUID(),
    }),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.policy.publish'",
    [publisherId],
  );
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, f.publish),
    code("PolicyAuthorityRequired"),
  );
  await assert.rejects(
    readOperation(f.publisher, f.publish.operation_id),
    code("PolicyAuthorityRequired"),
  );
  assert.deepEqual(await snapshot(Object.keys(preserved)), preserved);
  assert.deepEqual(
    (await snapshot(["scheduling_policies"])).scheduling_policies.filter(
      (r: { id: string }) => r.id === f.chain.seed_root.id,
    ),
    oldPolicies.scheduling_policies,
  );
});

test("C26 resolution is authorised fresh append-only evidence; completing an Activity or acknowledging cannot resolve", async () => {
  const f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const impact = (await rows("SELECT * FROM ppo.scheduling_policy_impacts"))[0],
    owner = await principal();
  let read = await readPolicyImpact(owner, impact.id);
  const command = () => ({
    ...base(),
    impact_hash: impact.content_hash,
    expected_appointment_version: read.appointment.version,
    expected_resolution: read.expected_resolution,
    dependency_fingerprint: read.dependency_fingerprint,
    outcome: "VerifiedNoConflict",
    replacement: null,
  });
  await assert.rejects(
    readPolicyImpact(f.publisher, impact.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    resolveSchedulingPolicyImpact(f.publisher, impact.id, command()),
    code("RecordUnavailable"),
  );
  const activity = (
    await rows("SELECT * FROM ppo.activities WHERE id=$1", [
      read.activity_ids[0],
    ])
  )[0];
  await activityCommand(
    owner,
    activity.id,
    {
      ...base(),
      expected_version: activity.version,
      outcome: "SYN reviewed task only",
    },
    "complete",
  );
  assert.equal(
    (await readPolicyImpact(owner, impact.id)).disposition,
    "Unresolved",
  );
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact.id, command()),
    code("InvalidData"),
  );
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact.id, {
      ...command(),
      outcome: "Acknowledged",
    }),
    code("InvalidData"),
  );
  const a = (await readAppointment(owner, impact.appointment_id)).items[0];
  await cancelAppointment(owner, a.id, {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
  });
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact.id, {
      ...command(),
      outcome: "Cancelled",
    }),
    code("InvalidData"),
  );
  read = await readPolicyImpact(owner, impact.id);
  const cancel = { ...command(), outcome: "Cancelled" };
  const accepted = await resolveSchedulingPolicyImpact(
    owner,
    impact.id,
    cancel,
  );
  assert.equal(
    (await readPolicyImpact(owner, impact.id)).disposition,
    "Current",
  );
  assert.deepEqual(
    (await resolveSchedulingPolicyImpact(owner, impact.id, cancel)).receipt,
    accepted.receipt,
  );
  const first = await snapshot(["scheduling_policy_resolutions"]);
  await rows("UPDATE ppo.work_orders SET version=version+1 WHERE id=$1", [
    a.work_order_id,
  ]);
  assert.equal((await readPolicyImpact(owner, impact.id)).disposition, "Stale");
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact.id, {
      ...cancel,
      operation_id: randomUUID(),
    }),
    code("InvalidData"),
  );
  read = await readPolicyImpact(owner, impact.id);
  await resolveSchedulingPolicyImpact(owner, impact.id, {
    ...command(),
    outcome: "Cancelled",
  });
  const history = await snapshot(["scheduling_policy_resolutions"]);
  assert.equal(history.scheduling_policy_resolutions.length, 2);
  assert.deepEqual(
    history.scheduling_policy_resolutions.filter(
      (x: { id: string }) => x.id === accepted.receipt.record_id,
    ),
    first.scheduling_policy_resolutions,
  );
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability IN ('schedule.manage','service.work_order.edit')",
    [owner.actor_id],
  );
  await assert.rejects(
    resolveSchedulingPolicyImpact(owner, impact.id, cancel),
    code("RecordUnavailable"),
  );
});

test("C26 original actor/workspace substitution and offline envelopes never create or disclose a publication", async () => {
  const f = await reviewed();
  await publishSchedulingPolicy(f.publisher, f.publish);
  const other = await principal();
  // Explicit test-only duty grant proves actor binding independently of a missing duty.
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,capability,scope_type,scope_id,valid_from) SELECT workspace_id,$2,capability,scope_type,scope_id,valid_from FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$3 ON CONFLICT DO NOTHING",
    [workspace, other.actor_id, publisherId],
  );
  const before = await snapshot();
  await assert.rejects(
    publishSchedulingPolicy(other, f.publish),
    code("OperationConflict"),
  );
  await assert.rejects(
    publishSchedulingPolicy(
      { ...f.publisher, workspace_id: randomUUID() },
      f.publish,
    ),
    code("PolicyAuthorityRequired"),
  );
  const { syncContext } = await import("../../src/platform/sync-context");
  await assert.rejects(
    syncContext.run({ client_operation_id: randomUUID() } as never, () =>
      publishSchedulingPolicy(f.publisher, f.publish),
    ),
    code("OnlineOnly"),
  );
  assert.deepEqual(await snapshot(), before);
});

test("C26 time-only expiry of future effectivity invalidates a complete review without changed row versions", async () => {
  const effective = new Date(Date.now() + 12000).toISOString(),
    f = await reviewed(60, effective);
  const before = await snapshot();
  await setTimeout(Math.max(0, Date.parse(effective) - Date.now() + 20));
  await assert.rejects(
    publishSchedulingPolicy(f.publisher, f.publish),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
});

test("C26 unsupported published pin outside the trusted family refuses the whole server review", async () => {
  const unknown = randomUUID();
  await rows(
    "INSERT INTO ppo.scheduling_policies SELECT (jsonb_populate_record(NULL::ppo.scheduling_policies,to_jsonb(p)||jsonb_build_object('id',$1::uuid))).* FROM ppo.scheduling_policies p WHERE id=$2",
    [unknown, fixtureId("a0")],
  );
  await populationBooking(1, unknown);
  const f = await proposed(),
    before = await snapshot();
  await assert.rejects(
    reviewSchedulingPolicy(f.reviewer, {
      ...base(),
      id: randomUUID(),
      proposal: {
        id: f.proposal.id,
        version: 1,
        content_hash: f.proposal.content_hash,
      },
    }),
    code("InvalidData"),
  );
  assert.deepEqual(await snapshot(), before);
});
