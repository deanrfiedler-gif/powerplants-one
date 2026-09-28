import {
  POLICY_FAMILY,
  policyContent,
  policyReference,
} from "../../src/scheduling/policy-chain";
import { evaluationDimensions } from "../../src/scheduling/policy-dependencies";
import { createPolicyProposal } from "../../src/scheduling/policy-publication-contracts";
import { digest } from "../../src/scheduling/policy-values";
import { SCHEDULING_POLICY_ID } from "../../src/scheduling/validation";

export const uid = (n: number) =>
  `b0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const ref = (n: number) => ({
  id: uid(n),
  version: 1,
  content_hash: digest({ synthetic: n }),
});
export const sourceRef = (n: number) => ({
  key: uid(n),
  version: null,
  content_hash: digest({ synthetic: n }),
});
export const family = {
  workspace_id: uid(1),
  family: POLICY_FAMILY,
  root_policy_id: SCHEDULING_POLICY_ID,
};
export const now = "2030-01-01T00:00:00.000Z";
export const future = "2031-01-01T00:00:00.000Z";
export const expiry = "2032-01-02T00:00:00.000Z";
export function chainFixture(count = 3) {
  const policies = Array.from({ length: count }, (_, i) =>
    policyContent({
      id: i ? uid(i + 2) : SCHEDULING_POLICY_ID,
      version: 1,
      name: "SYN policy contract fixture",
      effective_from: `${2029 + i}-01-01T00:00:00.000Z`,
      effective_to: expiry,
      source_as_at: "2029-01-01T00:00:00.000Z",
      evidence: "Fictional evidence only",
      initial_contact_required: true,
      changed_contact_allowed: true,
      all_crew_skilled: true,
      max_visit_minutes: 480 - i * 60,
    }),
  );
  return {
    ...family,
    seed_root: policyReference(policies[0]),
    head: { policy: policyReference(policies.at(-1)!), version: count },
    members: policies.map((policy, i) => ({
      ...family,
      status: "Published",
      synthetic: true,
      policy,
      content_hash: digest(policy),
      predecessor: i ? policyReference(policies[i - 1]) : null,
      review_binding: i
        ? {
            review: ref(20 + i),
            proposal: ref(30 + i),
            source: policyReference(policies[i - 1]),
            expected_head_version: i,
            selected_policy: policyReference(policy),
          }
        : null,
    })),
  };
}
export function proposalFixture() {
  const context = {
    chain: chainFixture(1),
    proposer_id: uid(50),
    id: uid(51),
    version: 1,
    predecessor_proposal: null,
    proposed_at: now,
  };
  return {
    context,
    proposal: createPolicyProposal(
      { max_visit_minutes: 60, effective_from: future },
      context,
    ),
  };
}
export function candidateFixture(n = 100) {
  const policy = chainFixture(1).head.policy;
  const identity = {
    user: { ...ref(60), version: null },
    active: true,
    eligible: true,
    grants: [sourceRef(61)],
  };
  return {
    dependencies: {
      schema_version: 1,
      ...family,
      booking: {
        appointment: ref(n),
        company_id: uid(70),
        site_id: uid(71),
        work_order_id: uid(72),
        schedule_version: 1,
        assignment_version: 1,
        status: "Confirmed",
        start_at: "2031-02-01T01:00:00.000Z",
        end_at: "2031-02-01T02:00:00.000Z",
        site_timezone: "Australia/Sydney",
        requested_window_start: null,
        requested_window_end: null,
        scheduling_policy: policy,
        scope_revision: ref(73),
        readiness_policy: ref(74),
        actual_start_at: null,
        actual_end_at: null,
        attendance: [],
        captures: [],
      },
      ownership: {
        work_order: ref(72),
        service_owner: identity,
        proposed_impact_owner: null,
      },
      scope_readiness: {
        current_scope: ref(73),
        authorised_scope: ref(73),
        approved_snapshot_hash: digest("approved"),
        site: ref(71),
        assets: [sourceRef(75), sourceRef(76)],
        configurations: [sourceRef(77)],
        scope_items: [sourceRef(78)],
        scope_assets: [sourceRef(79)],
        required_skill_codes: ["Mechanical", "Electrical"],
        readiness_policy: ref(74),
        authorisation_controls: [sourceRef(80)],
        booking_controls: [sourceRef(81)],
      },
      crew: [
        {
          assignment: ref(82),
          resource_id: uid(83),
          active: true,
          crew_role: "Lead",
          travel_before_minutes: 30,
          travel_after_minutes: 30,
          travel_reason: "Synthetic travel",
        },
      ],
      reservations: { own: [sourceRef(84)], competing: [] },
      resources: [
        {
          resource: ref(83),
          linked_identity: identity,
          site_memberships: [sourceRef(85)],
          calendar: ref(86),
          calendar_intervals: [sourceRef(87)],
          calendar_exceptions: [],
          availability_blocks: [],
          skill_evidence: [sourceRef(88)],
          resource_evidence: [sourceRef(89)],
        },
      ],
      contact_preparation: {
        primary_contact: ref(90),
        contact_outcomes: [ref(91)],
        latest_contact_id: uid(91),
        customer_commitment: "Confirmed",
        preparation_status: "Preparing",
        dispatch_hold: false,
        pack_requirement: "Required",
        preparation_evidence: [sourceRef(92)],
        follow_ups: [sourceRef(93)],
      },
    },
    evaluation: {
      outcome: "Compliant",
      checks: evaluationDimensions.map((dimension) => ({
        dimension,
        outcome: "Pass",
        reasons: [],
      })),
    },
    impact_owner_id: null,
    impact_reason: null,
  };
}
export function reviewFixture() {
  const { context, proposal } = proposalFixture();
  return {
    metadata: {
      id: uid(200),
      version: 1,
      reviewer_id: uid(201),
      review_event_id: uid(202),
      evaluated_at: "2030-02-01T00:00:00.000Z",
    },
    context: {
      ...context,
      proposal,
      reviewer_id: uid(201),
      population: [candidateFixture()],
    },
  };
}
export function tamper(input: unknown, path: string, value: unknown): unknown {
  const copy = structuredClone(input) as Record<string, unknown>;
  const keys = path.split(".");
  let target = copy;
  for (const key of keys.slice(0, -1))
    target = target[key] as Record<string, unknown>;
  target[keys.at(-1)!] = value;
  return copy;
}
