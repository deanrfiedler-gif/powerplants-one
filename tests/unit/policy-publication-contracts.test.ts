import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { canonical } from "../../src/platform/operations";
import {
  dependencyFingerprint,
  policyDependencies,
} from "../../src/scheduling/policy-dependencies";
import {
  assertReviewDependenciesCurrent,
  bindPublishedPolicyReview,
  createPolicyProposal,
  createPolicyReview,
  proposalReference,
  validatePolicyProposal,
  validatePolicyReview,
} from "../../src/scheduling/policy-publication-contracts";
import { digest } from "../../src/scheduling/policy-values";
import {
  candidateFixture,
  chainFixture,
  expiry,
  future,
  now,
  proposalFixture,
  ref,
  sourceRef,
  reviewFixture,
  tamper,
  uid,
} from "../helpers/policy-publication";

test("canonical SHA-256 retains its known sorted-object vector", () => {
  assert.equal(
    digest({ b: 2, a: 1 }),
    "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
  );
});

test("publication review binding checks exact successor content against loaded immutable review", () => {
  const f = reviewFixture(),
    review = createPolicyReview(f.metadata, f.context);
  const policy = {
    ...f.context.chain.members[0].policy,
    id: uid(950),
    effective_from: future,
    max_visit_minutes: 60,
  };
  const binding = bindPublishedPolicyReview(policy, review, f.context);
  assert.equal(binding.review.content_hash, review.content_hash);
  assert.equal(binding.selected_policy.content_hash, digest(policy));
  assert.throws(() =>
    bindPublishedPolicyReview(
      { ...policy, max_visit_minutes: 61 },
      review,
      f.context,
    ),
  );
  assert.throws(() =>
    bindPublishedPolicyReview(
      { ...policy, evidence: "Other source" },
      review,
      f.context,
    ),
  );
});

test("unversioned/composite source identities remain exact, hash-bound and without invented versions", () => {
  const d = candidateFixture().dependencies;
  const membership = {
    key: canonical({
      resource_id: d.crew[0].resource_id,
      site_id: d.booking.site_id,
    }),
    version: null,
    content_hash: digest("membership"),
  };
  const next = tamper(d, "resources.0.site_memberships", [membership]);
  assert.equal(
    policyDependencies(next).resources[0].site_memberships[0].version,
    null,
  );
  assert.notEqual(dependencyFingerprint(next), dependencyFingerprint(d));
  assert.throws(() =>
    policyDependencies(tamper(d, "ownership.service_owner.user.version", 1)),
  );
});

test("saved proposal cannot reuse its hash after noncanonical JSON mutation", () => {
  const f = proposalFixture();
  assert.throws(() =>
    validatePolicyProposal(
      tamper(f.proposal, "effective_from", "2031-01-01T00:00:00Z"),
      f.context,
    ),
  );
});

test("proposal binds full fixed terms, source/head, provenance and actor with existing canonical SHA-256", () => {
  const { proposal, context } = proposalFixture(),
    { content_hash, ...body } = proposal;
  assert.equal(
    content_hash,
    createHash("sha256").update(canonical(body)).digest("hex"),
  );
  assert.equal(proposal.fixed_terms.effective_to, expiry);
  assert.equal(
    proposal.source.content_hash,
    context.chain.head.policy.content_hash,
  );
  assert.deepEqual(validatePolicyProposal(proposal, context), proposal);
  assert.ok(Object.isFrozen(proposal.fixed_terms));
  assert.throws(() =>
    Object.assign(proposal.fixed_terms, { evidence: "forged" }),
  );
  assert.deepEqual(
    createPolicyProposal(
      { effective_from: "2031-01-01T00:00:00Z", max_visit_minutes: 60 },
      context,
    ),
    proposal,
  );
});
test("editing creates a separate immutable revision and preserves the earlier payload", () => {
  const { proposal, context } = proposalFixture(),
    original = canonical(proposal);
  const successor = createPolicyProposal(
    { effective_from: future, max_visit_minutes: 90 },
    {
      ...context,
      id: uid(52),
      version: 2,
      predecessor_proposal: proposalReference(proposal),
    },
  );
  assert.equal(
    successor.predecessor_proposal?.content_hash,
    proposal.content_hash,
  );
  assert.notEqual(successor.content_hash, proposal.content_hash);
  assert.equal(canonical(proposal), original);
  assert.throws(() =>
    createPolicyProposal(
      { effective_from: future, max_visit_minutes: 90 },
      {
        ...context,
        version: 2,
        predecessor_proposal: proposalReference(proposal),
      },
    ),
  );
});
for (const edit of [
  { max_visit_minutes: 0, effective_from: future },
  { max_visit_minutes: 1441, effective_from: future },
  { max_visit_minutes: 1.5, effective_from: future },
  { max_visit_minutes: "60", effective_from: future },
  { max_visit_minutes: 60, effective_from: now },
  { max_visit_minutes: 60, effective_from: expiry },
  { max_visit_minutes: 60, effective_from: "2031-02-30T00:00:00Z" },
  { max_visit_minutes: 60, effective_from: future, effective_to: expiry },
  {
    max_visit_minutes: 60,
    effective_from: future,
    initial_contact_required: false,
  },
])
  test(`invalid/extra editable proposal fields refuse ${JSON.stringify(edit)}`, () =>
    assert.throws(() => createPolicyProposal(edit, proposalFixture().context)));

for (const [path, value] of [
  ["workspace_id", uid(900)],
  ["family", "other"],
  ["root_policy_id", uid(901)],
  ["source", ref(902)],
  ["expected_head.version", 2],
  ["expected_head.policy", ref(902)],
  ["fixed_terms.evidence", "Replaced source evidence"],
  ["fixed_terms.source_as_at", now],
  ["fixed_terms.effective_to", "2033-01-01T00:00:00.000Z"],
  ["fixed_terms.all_crew_skilled", false],
  ["proposer_id", uid(903)],
  ["schema_version", 2],
  ["evaluator_version", 2],
  ["max_visit_minutes", 61],
  ["unknown", true],
  ["content_hash", "f".repeat(64)],
] as const)
  test(`proposal tamper refuses ${path}`, () => {
    const { proposal, context } = proposalFixture();
    assert.throws(() =>
      validatePolicyProposal(tamper(proposal, path, value), context),
    );
  });
test("recomputed hashes do not bypass source/fixed term/actor bindings or scheduled head", () => {
  const { proposal, context } = proposalFixture();
  for (const path of [
    "source.content_hash",
    "fixed_terms.evidence",
    "proposer_id",
  ]) {
    const forged = tamper(
      proposal,
      path,
      path === "proposer_id" ? uid(900) : "f".repeat(64),
    ) as Record<string, unknown>;
    const { content_hash: ignored, ...body } = forged;
    assert.ok(ignored);
    assert.throws(() =>
      validatePolicyProposal({ ...body, content_hash: digest(body) }, context),
    );
  }
  assert.throws(() =>
    validatePolicyProposal(proposal, { ...context, chain: chainFixture(2) }),
  );
  assert.throws(() =>
    createPolicyProposal(
      { effective_from: future, max_visit_minutes: 60 },
      { ...context, chain: chainFixture(3) },
    ),
  );
});
test("review binds every candidate including compliant, exact proposal, dependencies, outcomes and reviewer", () => {
  const f = reviewFixture(),
    review = createPolicyReview(f.metadata, f.context);
  assert.equal(review.candidates.length, 1);
  assert.equal(review.candidates[0].evaluation.outcome, "Compliant");
  assert.equal(
    review.candidates[0].dependency_fingerprint,
    dependencyFingerprint(f.context.population[0].dependencies),
  );
  assert.deepEqual(validatePolicyReview(review, f.context), review);
  assert.ok(Object.isFrozen(review.candidates[0].dependencies.crew[0]));
  const { content_hash, ...body } = review;
  assert.equal(content_hash, digest(body));
  assert.throws(() =>
    validatePolicyReview(review, { ...f.context, population: [] }),
  );
});
test("input permutations normalize deterministic candidate/evidence ordering and hashes", () => {
  const f = reviewFixture(),
    one = candidateFixture(101),
    two = candidateFixture(102);
  const a = createPolicyReview(f.metadata, {
    ...f.context,
    population: [two, one],
  });
  one.dependencies.scope_readiness.assets.reverse();
  one.dependencies.scope_readiness.required_skill_codes.reverse();
  one.evaluation.checks.reverse();
  const b = createPolicyReview(f.metadata, {
    ...f.context,
    population: [one, two],
  });
  assert.deepEqual(a, b);
  assert.equal(a.candidates[0].dependencies.booking.appointment.id, uid(101));
});
test("observation time changes review evidence hash but not dependency/population comparison", () => {
  const f = reviewFixture(),
    a = createPolicyReview(f.metadata, f.context);
  const b = createPolicyReview(
    { ...f.metadata, evaluated_at: "2030-03-01T00:00:00Z" },
    f.context,
  );
  assert.notEqual(a.content_hash, b.content_hash);
  assert.equal(a.population_hash, b.population_hash);
  assert.equal(
    a.candidates[0].dependency_fingerprint,
    b.candidates[0].dependency_fingerprint,
  );
  assert.deepEqual(
    assertReviewDependenciesCurrent(a, {
      ...f.context,
      observed_at: "2030-03-01T00:00:00Z",
    }),
    a,
  );
  assert.throws(() =>
    assertReviewDependenciesCurrent(a, { ...f.context, observed_at: future }),
  );
});
// Complete contract categories: even more permissive changes to a compliant booking invalidate review.
for (const [path, value] of [
  ["booking.appointment.version", 2],
  ["booking.schedule_version", 2],
  ["booking.assignment_version", 2],
  ["booking.start_at", "2031-02-01T01:01:00.000Z"],
  ["booking.status", "Cancelled"],
  ["booking.actual_start_at", "2031-02-01T01:00:00.000Z"],
  ["booking.attendance", [sourceRef(400)]],
  ["booking.captures", [sourceRef(401)]],
  ["ownership.work_order.version", 2],
  ["ownership.service_owner.user", { ...ref(402), version: null }],
  ["ownership.service_owner.active", false],
  ["ownership.service_owner.grants", []],
  ["ownership.service_owner.eligible", false],
  ["scope_readiness.current_scope.version", 2],
  ["scope_readiness.authorisation_controls", [sourceRef(403)]],
  ["scope_readiness.booking_controls", []],
  ["scope_readiness.assets.0.content_hash", "f".repeat(64)],
  ["scope_readiness.configurations", []],
  ["scope_readiness.site.version", 2],
  ["scope_readiness.required_skill_codes", []],
  ["crew.0.assignment.version", 2],
  ["crew.0.travel_before_minutes", 0],
  ["reservations.own", []],
  ["reservations.competing", [sourceRef(404)]],
  ["resources.0.resource.version", 2],
  ["resources.0.linked_identity.active", false],
  ["resources.0.site_memberships", []],
  ["resources.0.calendar.content_hash", "f".repeat(64)],
  ["resources.0.calendar_intervals", []],
  ["resources.0.calendar_exceptions", [sourceRef(405)]],
  ["resources.0.availability_blocks", [sourceRef(406)]],
  ["resources.0.skill_evidence", []],
  ["resources.0.resource_evidence", []],
  ["contact_preparation.primary_contact", ref(407)],
  ["contact_preparation.contact_outcomes.0.content_hash", "f".repeat(64)],
  ["contact_preparation.preparation_status", "Ready"],
  ["contact_preparation.dispatch_hold", true],
  ["contact_preparation.preparation_evidence", []],
  ["contact_preparation.follow_ups", []],
] as const)
  test(`previously compliant dependency change invalidates review: ${path}`, () => {
    const f = reviewFixture(),
      review = createPolicyReview(f.metadata, f.context),
      original = f.context.population[0];
    const dependencies = tamper(original.dependencies, path, value);
    assert.notEqual(
      dependencyFingerprint(dependencies),
      dependencyFingerprint(original.dependencies),
    );
    assert.throws(() =>
      assertReviewDependenciesCurrent(review, {
        ...f.context,
        observed_at: "2030-03-01T00:00:00Z",
        population: [{ ...original, dependencies }],
      }),
    );
  });
test("review refuses unknown/malformed dependencies and mismatched linked records", () => {
  const original = candidateFixture().dependencies;
  for (const [path, value] of [
    ["observed_at", now],
    ["booking.work_order_id", uid(999)],
    ["crew.0.resource_id", uid(999)],
    ["resources.0.calendar.extra", true],
    ["scope_readiness.assets", [sourceRef(75), sourceRef(75)]],
    ["contact_preparation.latest_contact_id", uid(999)],
    ["booking.requested_window_end", future],
  ] as const)
    assert.throws(() => policyDependencies(tamper(original, path, value)));
});
for (const [path, value] of [
  ["proposal", ref(900)],
  ["source", ref(901)],
  ["expected_head.version", 2],
  ["reviewer_id", uid(999)],
  ["workspace_id", uid(999)],
  ["evaluator_version", 2],
  ["coverage", "FilteredPreview"],
  ["population_hash", "f".repeat(64)],
  ["candidates.0.dependency_fingerprint", "f".repeat(64)],
  ["candidates.0.evaluation.outcome", "ImpactRequired"],
  ["candidates.0.impact_owner_id", uid(999)],
  ["candidates.0.impact_reason", "Forged reason"],
  ["candidates.0.extra", true],
  ["extra", true],
] as const)
  test(`review tamper refuses ${path}`, () => {
    const f = reviewFixture(),
      review = createPolicyReview(f.metadata, f.context);
    assert.throws(() =>
      validatePolicyReview(tamper(review, path, value), f.context),
    );
  });
test("a transient preview scenario digest cannot substitute for a saved proposal/review", () => {
  const f = reviewFixture(),
    scenario = {
      effective_from: future,
      effective_to: expiry,
      max_visit_minutes: 60,
      content_hash: digest("scenario"),
    };
  assert.throws(() => validatePolicyProposal(scenario, f.context));
  assert.throws(() => validatePolicyReview(scenario, f.context));
});
test("complete zero and 200 candidates are explicit; 201, duplicates and added population refuse", () => {
  const f = reviewFixture();
  const empty = createPolicyReview(f.metadata, {
    ...f.context,
    population: [],
  });
  assert.equal(empty.coverage, "CompleteWorkspaceFamily");
  assert.equal(empty.candidates.length, 0);
  assert.throws(() => validatePolicyReview(empty, f.context));
  const rows = Array.from({ length: 200 }, (_, n) =>
    candidateFixture(1000 + n),
  );
  assert.equal(
    createPolicyReview(f.metadata, { ...f.context, population: rows })
      .candidates.length,
    200,
  );
  assert.throws(() =>
    createPolicyReview(f.metadata, {
      ...f.context,
      population: [...rows, candidateFixture(5000)],
    }),
  );
  assert.throws(() =>
    createPolicyReview(f.metadata, {
      ...f.context,
      population: [rows[0], rows[0]],
    }),
  );
});
test("incomplete evaluations, forged compliant duration, missing owners and bad pins refuse", () => {
  const f = reviewFixture(),
    candidate = candidateFixture();
  for (const [path, value] of [
    ["evaluation.checks", []],
    ["evaluation.outcome", "ImpactRequired"],
    ["dependencies.booking.end_at", "2031-02-01T03:00:00Z"],
    ["dependencies.booking.scheduling_policy", ref(999)],
    ["dependencies.workspace_id", uid(999)],
  ] as const)
    assert.throws(() =>
      createPolicyReview(f.metadata, {
        ...f.context,
        population: [tamper(candidate, path, value)],
      }),
    );
  const affected = {
    ...candidate,
    dependencies: {
      ...candidate.dependencies,
      ownership: {
        ...candidate.dependencies.ownership,
        proposed_impact_owner: candidate.dependencies.ownership.service_owner,
      },
    },
    evaluation: {
      outcome: "ImpactRequired",
      checks: candidate.evaluation.checks.map((c) =>
        c.dimension === "ResourceCalendarSkills"
          ? { ...c, outcome: "Blocked", reasons: ["SkillExpired"] }
          : c,
      ),
    },
    impact_owner_id: candidate.dependencies.ownership.service_owner.user.id,
    impact_reason: "Review expiring skill evidence",
  };
  assert.equal(
    createPolicyReview(f.metadata, { ...f.context, population: [affected] })
      .candidates[0].evaluation.outcome,
    "ImpactRequired",
  );
  for (const [path, value] of [
    ["impact_owner_id", uid(999)],
    ["impact_reason", null],
    ["dependencies.ownership.proposed_impact_owner.active", false],
    ["dependencies.ownership.proposed_impact_owner.grants", []],
  ] as const)
    assert.throws(() =>
      createPolicyReview(f.metadata, {
        ...f.context,
        population: [tamper(affected, path, value)],
      }),
    );
});
