import { invalid } from "../shared/validation";
import {
  familyFields,
  fixedTermFields,
  fixedTerms,
  policyContent,
  policyReference,
  validatePolicyChain,
  type PolicyChain,
} from "./policy-chain";
import { reviewedPopulation } from "./policy-dependencies";
import {
  digest,
  duration,
  equal,
  freeze,
  hashValue,
  id,
  literal,
  nullable,
  positive,
  record,
  reference,
  utc,
  type Frozen,
} from "./policy-values";

export const POLICY_EVALUATOR_VERSION = 1;
const versions = {
  schema_version: literal(1),
  evaluator_version: literal(POLICY_EVALUATOR_VERSION),
};
const head = record({ policy: reference, version: positive });
const proposalReader = record({
  kind: literal("SchedulingPolicyProposal"),
  ...versions,
  ...familyFields,
  id,
  version: positive,
  predecessor_proposal: nullable(reference),
  source: reference,
  expected_head: head,
  fixed_terms: record(fixedTermFields),
  max_visit_minutes: duration,
  effective_from: utc,
  proposer_id: id,
  proposed_at: utc,
});
export type PolicyProposal = Frozen<
  ReturnType<typeof proposalReader> & { content_hash: string }
>;
type ProposalContext = { chain: unknown; proposer_id: string };
function bindProposal(input: unknown, context: ProposalContext) {
  const p = proposalReader(input),
    chain = validatePolicyChain(context.chain);
  for (const key of ["workspace_id", "family", "root_policy_id"] as const)
    equal(p[key], chain[key]);
  equal(p.proposer_id, id(context.proposer_id), "proposer");
  equal(p.source, chain.head.policy, "source");
  equal(p.expected_head, chain.head, "head");
  const source = chain.members.at(-1)!.policy;
  equal(p.fixed_terms, fixedTerms(source), "fixed_terms");
  if (
    p.effective_from <= p.proposed_at ||
    p.effective_from <= source.effective_from ||
    p.effective_from >= source.effective_to
  )
    invalid(
      "effective_from",
      "Append a strictly later future instant before preserved expiry.",
    );
  if (p.predecessor_proposal) {
    if (
      p.id === p.predecessor_proposal.id ||
      p.version !== p.predecessor_proposal.version + 1
    )
      invalid(
        "proposal",
        "An edit is a new immutable proposal revision linked to its exact predecessor.",
      );
  } else if (p.version !== 1)
    invalid("proposal", "An initial proposal starts at version 1.");
  return freeze({ ...p, content_hash: digest(p) });
}
/** Only these two rule values are editable. Metadata is supplied by the future server boundary. */
export function createPolicyProposal(
  edit: unknown,
  context: ProposalContext & {
    id: string;
    version: number;
    predecessor_proposal: unknown;
    proposed_at: string;
  },
): PolicyProposal {
  const values = record({ max_visit_minutes: duration, effective_from: utc })(
    edit,
  );
  const chain = validatePolicyChain(context.chain);
  return bindProposal(
    {
      kind: "SchedulingPolicyProposal",
      schema_version: 1,
      evaluator_version: POLICY_EVALUATOR_VERSION,
      workspace_id: chain.workspace_id,
      family: chain.family,
      root_policy_id: chain.root_policy_id,
      id: context.id,
      version: context.version,
      predecessor_proposal: context.predecessor_proposal,
      source: chain.head.policy,
      expected_head: chain.head,
      fixed_terms: fixedTerms(chain.members.at(-1)!.policy),
      ...values,
      proposer_id: context.proposer_id,
      proposed_at: context.proposed_at,
    },
    context,
  );
}
// Strip exactly one digest field, then parse all content: no unknown-field dropping.
function unsigned(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    invalid("payload", "An immutable JSON payload is required.");
  const { content_hash, ...body } = input as Record<string, unknown>;
  return { body, hash: hashValue(content_hash) };
}
export function validatePolicyProposal(
  input: unknown,
  context: ProposalContext,
): PolicyProposal {
  const { body, hash } = unsigned(input),
    expected = bindProposal(body, context);
  equal(hash, expected.content_hash, "proposal_hash");
  equal(input, expected, "proposal");
  return expected;
}
export const proposalReference = (proposal: PolicyProposal) =>
  freeze({
    id: proposal.id,
    version: proposal.version,
    content_hash: proposal.content_hash,
  });

const reviewMetadata = record({
  id,
  version: literal(1),
  reviewer_id: id,
  review_event_id: id,
  evaluated_at: utc,
});
type ReviewContext = ProposalContext & {
  proposal: unknown;
  reviewer_id: string;
  population: unknown;
};
function bindPopulation(
  population: unknown,
  at: string,
  proposal: PolicyProposal,
  chain: PolicyChain,
) {
  const rows = reviewedPopulation(population, at);
  return rows.map((row) => {
    const d = row.dependencies,
      b = d.booking;
    for (const key of ["workspace_id", "family", "root_policy_id"] as const)
      equal(d[key], chain[key]);
    const pin = chain.members.find(
      (m) => m.policy.id === b.scheduling_policy.id,
    );
    if (!pin)
      invalid("population", "Unknown historic policy pins refuse review.");
    equal(b.scheduling_policy, policyReference(pin.policy), "candidate_pin");
    if (
      b.end_at <= proposal.effective_from ||
      b.start_at >= proposal.fixed_terms.effective_to
    )
      invalid(
        "population",
        "Candidates must overlap the proposed selection window.",
      );
    const temporalReasons = [
      ...(b.start_at < proposal.effective_from ? ["CrossesEffectiveDate"] : []),
      ...(b.end_at > proposal.fixed_terms.effective_to
        ? ["CrossesExpiry"]
        : []),
      ...(Date.parse(b.end_at) - Date.parse(b.start_at) >
      proposal.max_visit_minutes * 60000
        ? ["DurationLimitExceeded"]
        : []),
    ].sort();
    const temporal = row.evaluation.checks.find(
      (c) => c.dimension === "DurationWindow",
    )!;
    equal(temporal.reasons, temporalReasons, "duration_window_reasons");
    equal(
      temporal.outcome,
      temporalReasons.length ? "Blocked" : "Pass",
      "duration_window_outcome",
    );
    return { ...row, dependency_fingerprint: digest(d) };
  });
}
export function createPolicyReview(metadata: unknown, context: ReviewContext) {
  const m = reviewMetadata(metadata),
    chain = validatePolicyChain(context.chain);
  const p = validatePolicyProposal(context.proposal, context);
  equal(m.reviewer_id, id(context.reviewer_id), "reviewer");
  if (m.evaluated_at < p.proposed_at || m.evaluated_at >= p.effective_from)
    invalid(
      "evaluated_at",
      "Review must follow proposal creation and precede its future effective instant.",
    );
  const candidates = bindPopulation(
    context.population,
    m.evaluated_at,
    p,
    chain,
  );
  const body = {
    kind: "SchedulingPolicyReview" as const,
    schema_version: 1 as const,
    evaluator_version: POLICY_EVALUATOR_VERSION,
    workspace_id: p.workspace_id,
    family: p.family,
    root_policy_id: p.root_policy_id,
    ...m,
    proposal: proposalReference(p),
    source: p.source,
    expected_head: p.expected_head,
    coverage: "CompleteWorkspaceFamily" as const,
    candidates,
    population_hash: digest(candidates),
  };
  return freeze({ ...body, content_hash: digest(body) });
}
export type PolicyReview = ReturnType<typeof createPolicyReview>;
/** Build the selector's publication binding from the exact loaded proposal/review and
 * successor content. The adapter must load these records under workspace authority. */
export function bindPublishedPolicyReview(
  successor: unknown,
  review: unknown,
  context: ReviewContext,
) {
  const saved = validatePolicyReview(review, context);
  const proposal = validatePolicyProposal(context.proposal, context);
  const policy = policyContent(successor);
  equal(fixedTerms(policy), proposal.fixed_terms, "published_fixed_terms");
  equal(
    policy.effective_from,
    proposal.effective_from,
    "published_effective_from",
  );
  equal(
    policy.max_visit_minutes,
    proposal.max_visit_minutes,
    "published_duration",
  );
  if (
    validatePolicyChain(context.chain).members.some(
      (m) => m.policy.id === policy.id,
    )
  )
    invalid("successor", "Publication requires a new policy identity.");
  return freeze({
    review: {
      id: saved.id,
      version: saved.version,
      content_hash: saved.content_hash,
    },
    proposal: proposalReference(proposal),
    source: proposal.source,
    expected_head_version: proposal.expected_head.version,
    selected_policy: policyReference(policy),
  });
}
/** Reconstruct from independently loaded complete evidence, never from the submitted candidates.
 * Identical observations compare by population_hash; evaluated_at remains hashed review evidence.
 * This is integrity/freshness validation, not an authorisation check or a database write. */
export function validatePolicyReview(
  input: unknown,
  context: ReviewContext,
): PolicyReview {
  const { body, hash } = unsigned(input);
  const metadata = Object.fromEntries(
    ["id", "version", "reviewer_id", "review_event_id", "evaluated_at"].map(
      (k) => [k, body[k]],
    ),
  );
  const expected = createPolicyReview(metadata, context);
  equal(input, expected, "review"); // Includes unknown fields, candidate ordering, hashes and every nested binding.
  equal(hash, expected.content_hash, "review_hash");
  return expected;
}
export function assertReviewDependenciesCurrent(
  review: unknown,
  context: ReviewContext & { observed_at: string },
) {
  const saved = validatePolicyReview(review, context),
    p = validatePolicyProposal(context.proposal, context);
  const at = utc(context.observed_at);
  if (at < saved.evaluated_at || at >= p.effective_from)
    invalid("review", "The proposal must still be future effective.");
  const current = bindPopulation(
    context.population,
    at,
    p,
    validatePolicyChain(context.chain),
  );
  equal(digest(current), saved.population_hash, "population_hash");
  return saved;
}
