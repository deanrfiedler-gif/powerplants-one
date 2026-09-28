import { invalid } from "../shared/validation";
import { SCHEDULING_POLICY_ID } from "./validation";
import {
  digest,
  duration,
  equal,
  freeze,
  hashValue,
  id,
  literal,
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

export const POLICY_FAMILY = "synthetic-service-scheduling";
export const familyFields = {
  workspace_id: id,
  family: literal(POLICY_FAMILY),
  root_policy_id: literal(SCHEDULING_POLICY_ID),
};
// Same exact policy projection/canonical SHA-256 convention as the read-only preview.
// Workspace/family and lineage are bound separately; the preview scenario hash is never a review.
const sourceText = (value: unknown) => {
  textValue(value); // Validate without trimming immutable issued source bytes.
  return value as string;
};
export const fixedTermFields = {
  name: sourceText,
  effective_to: utc,
  source_as_at: utc,
  evidence: sourceText,
  initial_contact_required: literal(true),
  changed_contact_allowed: literal(true),
  all_crew_skilled: literal(true),
};
const content = record({
  id,
  version: positive,
  ...fixedTermFields,
  effective_from: utc,
  max_visit_minutes: duration,
});
export type PolicyContent = Frozen<ReturnType<typeof content>>;
export function policyContent(input: unknown): PolicyContent {
  const p = content(input);
  span(p.effective_from, p.effective_to);
  if (p.source_as_at > p.effective_from)
    invalid("source_as_at", "Source evidence must precede policy effectivity.");
  return freeze(p);
}
export const policyReference = (p: PolicyContent) =>
  freeze({ id: p.id, version: p.version, content_hash: digest(p) });
export function fixedTerms(p: PolicyContent) {
  return record(fixedTermFields)(
    Object.fromEntries(
      Object.keys(fixedTermFields).map((k) => [k, p[k as keyof PolicyContent]]),
    ),
  );
}
const headReader = record({ policy: reference, version: positive });
const publicationReview = record({
  review: reference,
  proposal: reference,
  source: reference,
  expected_head_version: positive,
  selected_policy: reference,
});
const publishedFields = {
  ...familyFields,
  status: literal("Published"),
  synthetic: literal(true),
  policy: policyContent,
  content_hash: hashValue,
};
const memberReader = record({
  ...publishedFields,
  predecessor: nullable(reference),
  review_binding: nullable(publicationReview),
});
const chainReader = record({
  ...familyFields,
  // The pre-existing seed is the sole explicit bootstrap exception to publication review.
  seed_root: reference,
  head: headReader,
  members: ordered(memberReader, (m) => m.policy.effective_from),
});
export type PolicyChain = Frozen<ReturnType<typeof chainReader>>;

/** Adapters must supply the complete family and resolve review bindings from saved records.
 * This checks structural/content consistency, not persistence, signatures or permissions. */
export function validatePolicyChain(input: unknown): PolicyChain {
  const chain = chainReader(input),
    members = chain.members;
  if (
    !members.length ||
    new Set(members.map((m) => m.policy.id)).size !== members.length
  )
    invalid("lineage", "A unique complete chain is required.");
  const root = members[0];
  if (
    root.policy.id !== SCHEDULING_POLICY_ID ||
    root.predecessor !== null ||
    root.review_binding !== null
  )
    invalid(
      "lineage",
      "The seeded root must be first and have no predecessor or publication review.",
    );
  equal(chain.seed_root, policyReference(root.policy), "seed_root");
  members.forEach((m, index) => {
    for (const key of ["workspace_id", "family", "root_policy_id"] as const)
      equal(m[key], chain[key]);
    equal(m.content_hash, digest(m.policy), "policy_hash");
    equal(fixedTerms(m.policy), fixedTerms(root.policy), "fixed_terms");
    if (index) {
      const prev = members[index - 1];
      equal(m.predecessor, policyReference(prev.policy), "predecessor");
      if (
        !m.review_binding ||
        m.policy.effective_from <= prev.policy.effective_from
      )
        invalid(
          "lineage",
          "Every successor requires an exact review and a strictly later effective instant.",
        );
      equal(m.review_binding.source, m.predecessor, "review_source");
      equal(m.review_binding.expected_head_version, index, "review_head");
      equal(
        m.review_binding.selected_policy,
        policyReference(m.policy),
        "review_policy",
      );
    }
  });
  const reviews = members.slice(1).map((m) => m.review_binding!.review.id);
  const proposals = members.slice(1).map((m) => m.review_binding!.proposal.id);
  if (
    new Set(reviews).size !== reviews.length ||
    new Set(proposals).size !== proposals.length
  )
    invalid("lineage", "A review/proposal cannot publish two successors.");
  equal(chain.head.policy, policyReference(members.at(-1)!.policy), "head");
  equal(chain.head.version, members.length, "head_version");
  return freeze(chain);
}

/** New booking selection only. No wall clock: published future rules cover future visits. */
export function selectPolicyForVisit(
  input: unknown,
  start: unknown,
  end: unknown,
) {
  const chain = validatePolicyChain(input),
    start_at = utc(start),
    end_at = utc(end);
  span(start_at, end_at);
  const index = chain.members.findLastIndex(
    (m) => m.policy.effective_from <= start_at,
  );
  if (index < 0) invalid("interval", "No published policy covers this visit.");
  const p = chain.members[index].policy;
  const next = chain.members[index + 1]?.policy.effective_from;
  const until = next && next < p.effective_to ? next : p.effective_to;
  if (start_at >= until || end_at > until)
    invalid("interval", "The visit crosses a selection window, gap or expiry.");
  return freeze({
    ...policyReference(p),
    family_head_version: chain.head.version,
  });
}

/** Historic lookup reads the exact published snapshot directly. It needs neither the
 * current chain nor a current window and cannot repin a booking. */
export function resolvePinnedPolicy(
  input: unknown,
  pin: unknown,
): PolicyContent {
  const member = record(publishedFields)(input),
    exact = reference(pin);
  equal(member.content_hash, digest(member.policy), "policy_hash");
  equal(policyReference(member.policy), exact, "pin");
  return member.policy;
}
