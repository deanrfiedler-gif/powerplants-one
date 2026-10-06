import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { reset } from "../../scripts/database";
import { database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { loadPolicyChain } from "../../src/scheduling/policy-persistence";
import {
  proposeSchedulingPolicy,
  readPolicyEvidence,
  reviewSchedulingPolicy,
} from "../../src/scheduling/policy-commands";
import { reference } from "../../src/scheduling/policy-values";
export const workspace = "10000000-0000-4000-8000-000000000001";
export const reviewerId = "a0540000-0000-4000-8000-000000000001",
  publisherId = "a0540000-0000-4000-8000-000000000002";
export const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN API-C26 actual-handler proof",
});
export const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
export const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
export async function setupPolicy() {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Isolated ppo_synthetic_test only");
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
}
export const code = (name: string) => (e: unknown) =>
  (e as { code?: string }).code === name;
export async function proposed(
  duration = 60,
  effective = "2031-09-22T00:00:00.000Z",
) {
  const reviewer = await principal("scheduling-policy-reviewer"),
    publisher = await principal("scheduling-policy-publisher");
  const chain = await transaction((c) => loadPolicyChain(c, workspace));
  const command = {
    ...base(),
    id: randomUUID(),
    source: chain.head.policy,
    expected_head_version: chain.head.version,
    predecessor_proposal: null,
    max_visit_minutes: duration,
    effective_from: effective,
  };
  const result = await proposeSchedulingPolicy(reviewer, command);
  const proposal = (
    await readPolicyEvidence(reviewer, "proposal", result.receipt.record_id)
  ).proposal!;
  return { reviewer, publisher, command, result, proposal, chain };
}
export async function reviewed(
  duration = 60,
  effective = "2031-09-22T00:00:00.000Z",
) {
  const f = await proposed(duration, effective);
  const reviewCommand = {
    ...base(),
    id: randomUUID(),
    proposal: reference({
      id: f.proposal.id,
      version: f.proposal.version,
      content_hash: f.proposal.content_hash,
    }),
  };
  const result = await reviewSchedulingPolicy(f.reviewer, reviewCommand);
  const loaded = await readPolicyEvidence(
    f.publisher,
    "review",
    result.receipt.record_id,
  );
  const review = loaded.review!;
  return {
    ...f,
    review,
    reviewCommand,
    context: loaded.context!,
    publish: {
      ...base(),
      proposal: reviewCommand.proposal,
      review: {
        id: review.id,
        version: review.version,
        content_hash: review.content_hash,
      },
      source: f.proposal.source,
      expected_head_version: f.proposal.expected_head.version,
      selected_policy: loaded.selected_policy!,
    },
  };
}
export const durableTables = [
  "business_identities",
  "reference_counters",
  "scheduling_policies",
  "scheduling_policy_families",
  "scheduling_policy_members",
  "scheduling_policy_heads",
  "scheduling_policy_proposals",
  "scheduling_policy_reviews",
  "scheduling_policy_review_contexts",
  "scheduling_policy_candidates",
  "scheduling_policy_publications",
  "scheduling_policy_impacts",
  "scheduling_policy_impact_activities",
  "scheduling_policy_resolutions",
  "activities",
  "activity_links",
  "audit_events",
  "operation_receipts",
  "outbox_jobs",
  "appointments",
  "assignments",
  "resource_reservations",
  "pack_revisions",
  "pack_issues",
  "field_attendances",
  "field_entries",
  "offline_recovery_cases",
];
export async function snapshot(tables = durableTables) {
  const result = await rows(
    tables
      .map(
        (t) =>
          `SELECT '${t}' AS name,coalesce(jsonb_agg(to_jsonb(x) ORDER BY to_jsonb(x)::text),'[]'::jsonb) AS rows FROM ppo.${t} x`,
      )
      .join(" UNION ALL "),
  );
  return Object.fromEntries(result.map((r) => [r.name, r.rows]));
}
export async function replayPolicySeed() {
  await database().query(
    await readFile(
      new URL("../../db/seed-scheduling-policy-commands.sql", import.meta.url),
      "utf8",
    ),
  );
}
export async function populationBooking(offset: number, policyId?: string) {
  return transaction(async (c) => {
    const source = (
      await c.query(
        "SELECT to_jsonb(a) row FROM ppo.appointments a WHERE id='a8000000-0000-4000-8000-000000000001'",
      )
    ).rows[0].row;
    const appointmentId = randomUUID(),
      delta = offset * 3 * 3600000;
    const shift = (at: string) =>
      new Date(Date.parse(at) + delta).toISOString();
    await c.query(
      "INSERT INTO ppo.appointments SELECT (jsonb_populate_record(NULL::ppo.appointments,$1::jsonb)).*",
      [
        {
          ...source,
          id: appointmentId,
          display_number: null,
          scheduling_policy_id: policyId ?? source.scheduling_policy_id,
          start_at: shift(source.start_at),
          end_at: shift(source.end_at),
        },
      ],
    );
    const assignments = (
      await c.query(
        "SELECT to_jsonb(x) row FROM ppo.assignments x WHERE appointment_id=$1 AND active",
        [source.id],
      )
    ).rows;
    for (const { row } of assignments) {
      const assignmentId = randomUUID();
      await c.query(
        "INSERT INTO ppo.assignments SELECT (jsonb_populate_record(NULL::ppo.assignments,$1::jsonb)).*",
        [{ ...row, id: assignmentId, appointment_id: appointmentId }],
      );
      for (const { row: reservation } of (
        await c.query(
          "SELECT to_jsonb(r) row FROM ppo.resource_reservations r WHERE assignment_id=$1 AND active",
          [row.id],
        )
      ).rows)
        await c.query(
          "INSERT INTO ppo.resource_reservations SELECT (jsonb_populate_record(NULL::ppo.resource_reservations,$1::jsonb)).*",
          [
            {
              ...reservation,
              id: randomUUID(),
              assignment_id: assignmentId,
              start_at: shift(reservation.start_at),
              end_at: shift(reservation.end_at),
            },
          ],
        );
    }
    return appointmentId;
  });
}
