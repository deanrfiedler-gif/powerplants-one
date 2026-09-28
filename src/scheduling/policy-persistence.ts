// Internal persistence adapters only. No routes, authority decisions, graph locks or
// command receipts. Callers own a transaction and supply independently loaded server
// records; Step 3 must establish complete visibility/population and current authority.
import type { PoolClient } from "pg";
import { canonical } from "../platform/operations";
import { invalid } from "../shared/validation";
import {
  POLICY_FAMILY,
  policyContent,
  policyReference,
  validatePolicyChain,
  type PolicyChain,
} from "./policy-chain";
import type { PolicyCandidate } from "./policy-dependencies";
import {
  bindPublishedPolicyReview,
  validatePolicyProposal,
  validatePolicyReview,
  type PolicyProposal,
  type PolicyReview,
} from "./policy-publication-contracts";
import { digest, equal, id } from "./policy-values";

// Store canonical unsigned text alongside jsonb and its digest. JSONB is for exact
// relational comparisons, never the input to a replacement hashing algorithm.
export function evidenceStorage(value: { readonly content_hash: string }) {
  const { content_hash, ...content } = value;
  equal(content_hash, digest(content), "content_hash");
  return { content, canonical_content: canonical(content), content_hash };
}
function restored(row: {
  content: Record<string, unknown>;
  canonical_content: string;
  content_hash: string;
}) {
  equal(row.canonical_content, canonical(row.content), "canonical_bytes");
  equal(row.content_hash, digest(row.content), "stored_hash");
  return { ...row.content, content_hash: row.content_hash };
}

/** Read the complete saved chain, checking each publication against its original
 * proposal, review and source prefix. Old review bindings never use today's head. */
export async function loadPolicyChain(
  db: PoolClient,
  workspace: string,
): Promise<PolicyChain> {
  const workspace_id = id(workspace);
  const family = (
    await db.query(
      `SELECT f.*,h.policy_id,h.version FROM ppo.scheduling_policy_families f
       JOIN ppo.scheduling_policy_heads h USING(workspace_id,family)
       WHERE f.workspace_id=$1 AND f.family=$2`,
      [workspace_id, POLICY_FAMILY],
    )
  ).rows[0];
  if (!family) invalid("family", "Saved scheduling family required.");
  const rows = (
    await db.query(
      `SELECT m.*,p.proposal_id,p.review_id FROM ppo.scheduling_policy_members m
       LEFT JOIN ppo.scheduling_policy_publications p
       ON (p.workspace_id,p.id)=(m.workspace_id,m.publication_id)
       WHERE m.workspace_id=$1 AND m.family=$2 ORDER BY m.chain_version`,
      [workspace_id, POLICY_FAMILY],
    )
  ).rows;
  const binding = {
    workspace_id,
    family: POLICY_FAMILY,
    root_policy_id: family.root_policy_id,
  } as const;
  const members: PolicyChain["members"][number][] = [];
  let chain: PolicyChain | undefined;
  for (const row of rows) {
    equal(row.canonical_content, canonical(row.content), "policy_bytes");
    const policy = policyContent(row.content);
    equal(row.content_hash, digest(policy), "policy_hash");
    let review_binding = null;
    if (chain) {
      const p = await loadProposal(db, workspace_id, row.proposal_id, chain);
      const r = await loadReview(db, workspace_id, row.review_id, chain, p);
      review_binding = bindPublishedPolicyReview(policy, r, {
        chain,
        proposal: p,
        proposer_id: p.proposer_id,
        reviewer_id: r.reviewer_id,
        population: r.candidates.map(
          ({ dependency_fingerprint: hash, ...c }) => {
            equal(hash, digest(c.dependencies), "dependency_fingerprint");
            return c;
          },
        ),
      });
    }
    members.push({
      ...binding,
      status: "Published",
      synthetic: true,
      policy,
      content_hash: row.content_hash,
      predecessor: chain?.head.policy ?? null,
      review_binding,
    });
    chain = validatePolicyChain({
      ...binding,
      seed_root: policyReference(members[0].policy),
      head: { policy: policyReference(policy), version: row.chain_version },
      members: [...members],
    });
  }
  if (!chain) invalid("family", "Complete saved chain required.");
  equal(chain.head.policy.id, family.policy_id, "head_policy");
  equal(chain.head.version, family.version, "head_version");
  return chain;
}

export async function loadProposal(
  db: PoolClient,
  workspace: string,
  proposalId: string,
  chain: PolicyChain,
): Promise<PolicyProposal> {
  equal(id(workspace), chain.workspace_id, "workspace");
  const row = (
    await db.query(
      "SELECT * FROM ppo.scheduling_policy_proposals WHERE workspace_id=$1 AND id=$2",
      [workspace, id(proposalId)],
    )
  ).rows[0];
  if (!row) invalid("proposal", "Saved proposal required.");
  return validatePolicyProposal(restored(row), {
    chain,
    proposer_id: row.proposer_id,
  });
}

export async function loadReview(
  db: PoolClient,
  workspace: string,
  reviewId: string,
  chain: PolicyChain,
  proposal: PolicyProposal,
): Promise<PolicyReview> {
  equal(id(workspace), chain.workspace_id, "workspace");
  const row = (
    await db.query(
      "SELECT * FROM ppo.scheduling_policy_reviews WHERE workspace_id=$1 AND id=$2",
      [workspace, id(reviewId)],
    )
  ).rows[0];
  if (!row) invalid("review", "Saved review required.");
  const candidates = (
    await db.query(
      "SELECT content FROM ppo.scheduling_policy_candidates WHERE workspace_id=$1 AND review_id=$2 ORDER BY ordinal",
      [workspace, reviewId],
    )
  ).rows.map(({ content }) => {
    const { dependency_fingerprint, ...candidate } = content;
    equal(dependency_fingerprint, digest(candidate.dependencies));
    return candidate;
  });
  return validatePolicyReview(restored(row), {
    chain,
    proposal,
    proposer_id: proposal.proposer_id,
    reviewer_id: row.reviewer_id,
    population: candidates,
  });
}

export async function savePolicyProposal(
  db: PoolClient,
  input: unknown,
  server: { workspace_id: string; proposer_id: string },
) {
  const chain = await loadPolicyChain(db, server.workspace_id);
  const p = validatePolicyProposal(input, {
    chain,
    proposer_id: server.proposer_id,
  });
  const e = evidenceStorage(p);
  await db.query(
    `INSERT INTO ppo.scheduling_policy_proposals
     (workspace_id,family,id,version,root_policy_id,source_id,source_version,source_hash,expected_head_version,
      predecessor_id,predecessor_version,predecessor_hash,proposer_id,proposed_at,schema_version,evaluator_version,
      content,canonical_content,content_hash)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [
      p.workspace_id,
      p.family,
      p.id,
      p.version,
      p.root_policy_id,
      p.source.id,
      p.source.version,
      p.source.content_hash,
      p.expected_head.version,
      p.predecessor_proposal?.id ?? null,
      p.predecessor_proposal?.version ?? null,
      p.predecessor_proposal?.content_hash ?? null,
      p.proposer_id,
      p.proposed_at,
      p.schema_version,
      p.evaluator_version,
      e.content,
      e.canonical_content,
      e.content_hash,
    ],
  );
  return loadProposal(db, p.workspace_id, p.id, chain);
}

export async function savePolicyReview(
  db: PoolClient,
  input: unknown,
  server: {
    workspace_id: string;
    proposal_id: string;
    reviewer_id: string;
    population: readonly PolicyCandidate[];
  },
) {
  const chain = await loadPolicyChain(db, server.workspace_id);
  const p = await loadProposal(
    db,
    server.workspace_id,
    server.proposal_id,
    chain,
  );
  const r = validatePolicyReview(input, {
    chain,
    proposal: p,
    proposer_id: p.proposer_id,
    reviewer_id: server.reviewer_id,
    population: server.population,
  });
  const e = evidenceStorage(r);
  await db.query(
    `INSERT INTO ppo.scheduling_policy_reviews
     (workspace_id,family,id,version,proposal_id,proposal_version,proposal_hash,reviewer_id,review_event_id,
      evaluated_at,population_hash,schema_version,evaluator_version,content,canonical_content,content_hash)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      r.workspace_id,
      r.family,
      r.id,
      r.version,
      p.id,
      p.version,
      p.content_hash,
      r.reviewer_id,
      r.review_event_id,
      r.evaluated_at,
      r.population_hash,
      r.schema_version,
      r.evaluator_version,
      e.content,
      e.canonical_content,
      e.content_hash,
    ],
  );
  for (const [ordinal, c] of r.candidates.entries()) {
    const b = c.dependencies.booking;
    await db.query(
      `INSERT INTO ppo.scheduling_policy_candidates
       (workspace_id,review_id,ordinal,appointment_id,company_id,site_id,work_order_id,appointment_version,
        appointment_hash,dependency_fingerprint,impact_owner_id,outcome,content)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        r.workspace_id,
        r.id,
        ordinal,
        b.appointment.id,
        b.company_id,
        b.site_id,
        b.work_order_id,
        b.appointment.version,
        b.appointment.content_hash,
        c.dependency_fingerprint,
        c.impact_owner_id,
        c.evaluation.outcome,
        c,
      ],
    );
  }
  return loadReview(db, r.workspace_id, r.id, chain, p);
}
