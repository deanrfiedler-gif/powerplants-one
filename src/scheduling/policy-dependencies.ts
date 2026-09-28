import { invalid } from "../shared/validation";
import { familyFields } from "./policy-chain";
import { timezone } from "./validation";
import {
  booleanValue,
  digest,
  enumeration,
  equal,
  freeze,
  hashValue,
  id,
  literal,
  minutes,
  nullable,
  ordered,
  positive,
  record,
  reference,
  span,
  textValue,
  utc,
  type Frozen,
} from "./policy-values";

// Each reference hashes the complete relevant source projection, including effective periods,
// status/active flags and evidence, not just its ID/version. Missing evidence is an explicit
// empty set/null and evaluation failure. The guarded server loader must enumerate complete sets.
// Some live child tables have composite keys and no version column. Keep the actual
// canonical primary-key object as key and null version; never invent a UUID/version.
const sourceEvidence = record({
  key: textValue,
  version: nullable(positive),
  content_hash: hashValue,
});
const evidence = ordered(sourceEvidence, (r) => r.key);
const unversionedReference = record({
  id,
  version: literal(null),
  content_hash: hashValue,
});
const codes = ordered(textValue, (r) => r);
const identity = record({
  user: unversionedReference,
  active: booleanValue,
  grants: evidence,
  eligible: booleanValue,
});
const booking = record({
  appointment: reference,
  company_id: id,
  site_id: id,
  work_order_id: id,
  schedule_version: positive,
  assignment_version: positive,
  status: enumeration([
    "Proposed",
    "Confirmed",
    "InProgress",
    "CompletedPendingReview",
    "Completed",
    "Cancelled",
  ]),
  start_at: utc,
  end_at: utc,
  site_timezone: timezone,
  requested_window_start: nullable(utc),
  requested_window_end: nullable(utc),
  scheduling_policy: reference,
  scope_revision: reference,
  readiness_policy: reference,
  actual_start_at: nullable(utc),
  actual_end_at: nullable(utc),
  attendance: evidence,
  captures: evidence,
});
const crewMember = record({
  assignment: record({
    id,
    version: nullable(positive),
    content_hash: hashValue,
  }),
  resource_id: id,
  active: booleanValue,
  crew_role: enumeration(["Lead", "Technician", "Specialist"]),
  travel_before_minutes: minutes,
  travel_after_minutes: minutes,
  travel_reason: textValue,
});
const resource = record({
  resource: reference,
  linked_identity: nullable(identity),
  site_memberships: evidence,
  calendar: reference,
  calendar_intervals: evidence,
  calendar_exceptions: evidence,
  availability_blocks: evidence,
  skill_evidence: evidence,
  resource_evidence: evidence,
});
const dependencyReader = record({
  schema_version: literal(1),
  ...familyFields,
  booking,
  ownership: record({
    work_order: reference,
    service_owner: identity,
    proposed_impact_owner: nullable(identity),
  }),
  scope_readiness: record({
    current_scope: reference,
    authorised_scope: nullable(reference),
    approved_snapshot_hash: hashValue,
    site: reference,
    assets: evidence,
    configurations: evidence,
    scope_items: evidence,
    scope_assets: evidence,
    required_skill_codes: codes,
    readiness_policy: reference,
    authorisation_controls: evidence,
    booking_controls: evidence,
  }),
  crew: ordered(crewMember, (m) => m.resource_id, 6),
  reservations: record({ own: evidence, competing: evidence }),
  resources: ordered(resource, (r) => r.resource.id, 6),
  contact_preparation: record({
    primary_contact: nullable(reference),
    contact_outcomes: ordered(reference, (r) => r.id),
    latest_contact_id: nullable(id),
    customer_commitment: textValue,
    preparation_status: textValue,
    dispatch_hold: booleanValue,
    pack_requirement: textValue,
    preparation_evidence: evidence,
    follow_ups: evidence,
  }),
});
export type PolicyDependencies = Frozen<ReturnType<typeof dependencyReader>>;
export function policyDependencies(input: unknown): PolicyDependencies {
  const d = dependencyReader(input),
    b = d.booking;
  span(b.start_at, b.end_at);
  if ((b.requested_window_start === null) !== (b.requested_window_end === null))
    invalid("requested_window", "Both customer-window endpoints are required.");
  if (b.requested_window_start && b.requested_window_end)
    span(b.requested_window_start, b.requested_window_end);
  equal(b.work_order_id, d.ownership.work_order.id, "work_order");
  equal(b.site_id, d.scope_readiness.site.id, "site");
  equal(
    b.readiness_policy,
    d.scope_readiness.readiness_policy,
    "readiness_policy",
  );
  equal(
    d.crew.map((m) => m.resource_id),
    d.resources.map((r) => r.resource.id),
    "crew_resources",
  );
  const contact = d.contact_preparation;
  if (
    contact.latest_contact_id &&
    !contact.contact_outcomes.some((c) => c.id === contact.latest_contact_id)
  )
    invalid(
      "contact",
      "The latest contact must be in the complete contact evidence.",
    );
  return freeze(d);
}
export function dependencyFingerprint(input: unknown) {
  return digest(policyDependencies(input));
}

// Exhaustive evaluation dimensions; no duration-only preview can supply this contract.
export const evaluationDimensions = [
  "DurationWindow",
  "ScopeReadiness",
  "Crew",
  "ReservationsTravel",
  "ResourceCalendarSkills",
  "ContactPreparation",
  "Ownership",
] as const;
const check = record({
  dimension: enumeration(evaluationDimensions),
  outcome: enumeration(["Pass", "Blocked"]),
  reasons: codes,
});
const evaluation = record({
  outcome: enumeration(["Compliant", "ImpactRequired"]),
  checks: ordered(check, (c) => c.dimension, 7),
});
const candidate = record({
  dependencies: policyDependencies,
  evaluation,
  impact_owner_id: nullable(id),
  impact_reason: nullable(textValue),
});
export type PolicyCandidate = Frozen<ReturnType<typeof candidate>>;
const population = ordered(
  candidate,
  (c) =>
    `${c.dependencies.booking.start_at}:${c.dependencies.booking.appointment.id}`,
  200,
);

/** Only a server-enumerated complete workspace/family population may be supplied here.
 * Pure validation cannot prove query coverage or authority; those belong to Steps 2/3. */
export function reviewedPopulation(
  input: unknown,
  observedAt: unknown,
): readonly PolicyCandidate[] {
  const observed = utc(observedAt),
    rows = population(input);
  if (
    new Set(rows.map((r) => r.dependencies.booking.appointment.id)).size !==
    rows.length
  )
    invalid("population", "Each candidate must appear exactly once.");
  for (const row of rows) {
    const d = row.dependencies,
      b = d.booking;
    if (
      b.status !== "Confirmed" ||
      b.actual_start_at ||
      b.actual_end_at ||
      b.attendance.length ||
      b.captures.length ||
      b.start_at <= observed
    )
      invalid(
        "population",
        "Candidates must remain future, unstarted Confirmed bookings; re-enumerate exclusions.",
      );
    equal(
      row.evaluation.checks.map((c) => c.dimension),
      [...evaluationDimensions].sort(),
      "evaluation",
    );
    for (const check of row.evaluation.checks) {
      if ((check.outcome === "Pass") !== (check.reasons.length === 0))
        invalid(
          "evaluation",
          "Blocked checks require reasons; passed checks have none.",
        );
    }
    const affected = row.evaluation.checks.some((c) => c.outcome === "Blocked");
    equal(
      row.evaluation.outcome,
      affected ? "ImpactRequired" : "Compliant",
      "outcome",
    );
    if (affected) {
      const owner = d.ownership.proposed_impact_owner;
      if (
        !row.impact_reason ||
        !owner ||
        !owner.active ||
        !owner.eligible ||
        !owner.grants.length
      )
        invalid(
          "owner",
          "Every impact requires a reason and an eligible proposed owner with authority evidence.",
        );
      equal(row.impact_owner_id, owner.user.id, "impact_owner");
    } else if (
      row.impact_owner_id !== null ||
      row.impact_reason !== null ||
      d.ownership.proposed_impact_owner !== null
    ) {
      invalid("owner", "Compliant candidates have no proposed impact task.");
    }
  }
  return freeze(rows);
}
