// API-C26 internal handlers. Deliberately NOT registered by src/app or offline sync.
// Step 4 must activate these together with selection/readiness/start/offline holds.
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { canonical, sharedOperation } from "../platform/operations";
import { syncContext } from "../platform/sync-context";
import {
  insertActivity,
  validateLinks,
  type ActivityInput,
} from "../activities/activities";
import { common, commonKeys, object, invalid } from "../shared/validation";
import {
  ownerEvidence,
  policyAuthority,
  type PolicyDuty,
} from "./policy-authority";
import type { PolicyCandidate } from "./policy-dependencies";
import {
  policyContent,
  policyReference,
  validatePolicyChain,
  type PolicyChain,
} from "./policy-chain";
import {
  loadPolicyChain,
  loadProposal,
  loadReview,
  savePolicyProposal,
  savePolicyReview,
} from "./policy-persistence";
import {
  assertReviewDependenciesCurrent,
  bindPublishedPolicyReview,
  createPolicyProposal,
  createPolicyReview,
  proposalReference,
} from "./policy-publication-contracts";
import { loadPolicyPopulation, observationTime } from "./policy-population";
import {
  digest,
  duration,
  equal,
  id,
  nullable,
  positive,
  reference,
  utc,
} from "./policy-values";

export async function originalPolicyActor(
  c: PoolClient,
  p: Principal,
  operation: string,
) {
  if (syncContext.getStore())
    throw new AppError(
      422,
      "OnlineOnly",
      "Policy commands require a current online authority check.",
    );
  if (
    (
      await c.query(
        `SELECT 1 FROM ppo.operation_receipts r JOIN ppo.business_identities i ON (i.workspace_id,i.id)=(r.workspace_id,r.record_id)
     WHERE r.operation_id=$3 AND i.object_type LIKE 'SchedulingPolicy%' AND (r.workspace_id<>$1 OR r.actor_id<>$2)`,
        [p.workspace_id, p.actor_id, operation],
      )
    ).rowCount
  )
    throw new AppError(
      409,
      "OperationConflict",
      "The original operation identity must be retained.",
    );
}
async function authority(
  c: PoolClient,
  p: Principal,
  duty: PolicyDuty,
  operation: string,
) {
  const current = await policyAuthority(c, p, duty);
  await originalPolicyActor(c, p, operation);
  return current;
}
export function chainPrefix(chain: PolicyChain, version: number): PolicyChain {
  const members = chain.members.slice(0, version);
  if (members.length !== version)
    invalid("source", "Saved source prefix unavailable.");
  return validatePolicyChain({
    ...chain,
    members,
    head: { version, policy: policyReference(members.at(-1)!.policy) },
  });
}
async function currentProposal(
  c: PoolClient,
  p: Principal,
  ref: ReturnType<typeof reference>,
  chain: PolicyChain,
) {
  const proposal = await loadProposal(c, p.workspace_id, ref.id, chain);
  equal(proposalReference(proposal), ref, "proposal");
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.scheduling_policy_proposals WHERE workspace_id=$1 AND predecessor_id=$2",
        [p.workspace_id, ref.id],
      )
    ).rowCount
  )
    invalid("proposal", "A newer immutable revision requires a new review.");
  return proposal;
}
export async function proposeSchedulingPolicy(p: Principal, input: unknown) {
  const raw = object(input, [
    ...commonKeys,
    "id",
    "source",
    "expected_head_version",
    "predecessor_proposal",
    "max_visit_minutes",
    "effective_from",
  ]);
  const cmd = {
    ...common(raw),
    id: id(raw.id),
    source: reference(raw.source),
    expected_head_version: positive(raw.expected_head_version),
    predecessor_proposal: nullable(reference)(raw.predecessor_proposal),
    max_visit_minutes: duration(raw.max_visit_minutes),
    effective_from: utc(raw.effective_from),
  };
  return sharedOperation(
    p,
    cmd,
    "ProposeSchedulingPolicy",
    (c) => authority(c, p, "schedule.policy.review", cmd.operation_id),
    async (c) => {
      const chain = await loadPolicyChain(c, p.workspace_id);
      equal(
        chain.head,
        { policy: cmd.source, version: cmd.expected_head_version },
        "head",
      );
      const predecessor = cmd.predecessor_proposal
        ? await currentProposal(c, p, cmd.predecessor_proposal, chain)
        : null;
      if (predecessor && predecessor.proposer_id !== p.actor_id)
        throw unavailable();
      const now = await observationTime(c);
      const proposal = createPolicyProposal(
        {
          max_visit_minutes: cmd.max_visit_minutes,
          effective_from: cmd.effective_from,
        },
        {
          chain,
          proposer_id: p.actor_id,
          id: cmd.id,
          version: predecessor ? predecessor.version + 1 : 1,
          predecessor_proposal: cmd.predecessor_proposal,
          proposed_at: now,
        },
      );
      await savePolicyProposal(c, proposal, {
        workspace_id: p.workspace_id,
        proposer_id: p.actor_id,
      });
      return {
        id: proposal.id,
        version: proposal.version,
        state: "Proposed",
        updated_at: new Date(now),
        audit_details: {
          proposal: proposalReference(proposal),
          source: proposal.source,
          expected_head_version: chain.head.version,
        },
      };
    },
    "SchedulingPolicyProposal",
    "SchedulingPolicyProposalSaved",
  );
}
export async function reviewSchedulingPolicy(p: Principal, input: unknown) {
  const raw = object(input, [...commonKeys, "id", "proposal"]);
  const cmd = {
    ...common(raw),
    id: id(raw.id),
    proposal: reference(raw.proposal),
  };
  return sharedOperation(
    p,
    cmd,
    "ReviewSchedulingPolicy",
    (c) => authority(c, p, "schedule.policy.review", cmd.operation_id),
    async (c, reviewerAuthority) => {
      const chain = await loadPolicyChain(c, p.workspace_id),
        proposal = await currentProposal(c, p, cmd.proposal, chain);
      const loaded = await loadPolicyPopulation(c, p, chain, proposal);
      const review = createPolicyReview(
        {
          id: cmd.id,
          version: 1,
          reviewer_id: p.actor_id,
          review_event_id: randomUUID(),
          evaluated_at: loaded.observed_at,
        },
        {
          chain,
          proposal,
          proposer_id: proposal.proposer_id,
          reviewer_id: p.actor_id,
          population: loaded.population,
        },
      );
      await savePolicyReview(c, review, {
        workspace_id: p.workspace_id,
        proposal_id: proposal.id,
        reviewer_id: p.actor_id,
        population: loaded.population,
      });
      const selected = policyContent({
        ...proposal.fixed_terms,
        id: randomUUID(),
        version: 1,
        max_visit_minutes: proposal.max_visit_minutes,
        effective_from: proposal.effective_from,
      });
      const context = {
        schema_version: 1,
        workspace_id: p.workspace_id,
        review: reference({
          id: review.id,
          version: review.version,
          content_hash: review.content_hash,
        }),
        reviewer_authority: reviewerAuthority,
        exclusions: loaded.exclusions,
        exclusions_hash: loaded.exclusions_hash,
        selected_policy: selected,
      };
      await c.query(
        "INSERT INTO ppo.scheduling_policy_review_contexts VALUES($1,$2,$3,$4,$5)",
        [
          p.workspace_id,
          review.id,
          context,
          canonical(context),
          digest(context),
        ],
      );
      // Clock-derived eligibility is checked again at the end, not frozen by a long
      // evaluation. No additional sources are fabricated for a complete empty set.
      equal(
        await policyAuthority(c, p, "schedule.policy.review"),
        reviewerAuthority,
        "reviewer_authority",
      );
      await assertOwnersCurrent(c, p, loaded.population);
      await assertStillFuture(
        c,
        loaded.recheck_before,
        review.candidates.map((x) => x.dependencies.booking.start_at),
      );
      return {
        id: review.id,
        version: 1,
        state: "Reviewed",
        updated_at: new Date(review.evaluated_at),
        audit_event_id: review.review_event_id,
        audit_details: {
          review: reference({
            id: review.id,
            version: review.version,
            content_hash: review.content_hash,
          }),
          proposal: cmd.proposal,
          population_hash: review.population_hash,
          coverage: review.coverage,
          context_hash: digest(context),
        },
      };
    },
    "SchedulingPolicyReview",
    "SchedulingPolicyReviewed",
  );
}
async function reviewContext(
  c: PoolClient,
  workspace: string,
  reviewId: string,
) {
  const row = (
    await c.query(
      "SELECT * FROM ppo.scheduling_policy_review_contexts WHERE workspace_id=$1 AND review_id=$2",
      [workspace, reviewId],
    )
  ).rows[0];
  if (!row)
    invalid("review", "A command-created complete server review is required.");
  equal(row.canonical_content, canonical(row.content), "context_bytes");
  equal(row.content_hash, digest(row.content), "context_hash");
  return row;
}
async function assertStillFuture(
  c: PoolClient,
  effective: string,
  starts: string[],
) {
  const at = await observationTime(c);
  if (at >= effective || starts.some((start) => at >= start))
    invalid(
      "review",
      "Time eligibility changed; obtain a fresh complete review.",
    );
}
async function assertOwnersCurrent(
  c: PoolClient,
  p: Principal,
  population: readonly PolicyCandidate[],
) {
  const current = new Map<string, Awaited<ReturnType<typeof ownerEvidence>>>();
  for (const candidate of population) {
    const d = candidate.dependencies,
      b = d.booking;
    const key = `${d.ownership.service_owner.user.id}:${b.company_id}:${b.site_id}:${b.work_order_id}`;
    if (!current.has(key))
      current.set(
        key,
        await ownerEvidence(
          c,
          p,
          d.ownership.service_owner.user.id,
          b.company_id,
          b.site_id,
          b.work_order_id,
        ),
      );
    equal(current.get(key), d.ownership.service_owner, "owner_authority");
  }
}
export async function publishSchedulingPolicy(p: Principal, input: unknown) {
  const raw = object(input, [
    ...commonKeys,
    "proposal",
    "review",
    "source",
    "expected_head_version",
    "selected_policy",
  ]);
  const cmd = {
    ...common(raw),
    proposal: reference(raw.proposal),
    review: reference(raw.review),
    source: reference(raw.source),
    expected_head_version: positive(raw.expected_head_version),
    selected_policy: reference(raw.selected_policy),
  };
  return sharedOperation(
    p,
    cmd,
    "PublishSchedulingPolicy",
    (c) => authority(c, p, "schedule.policy.publish", cmd.operation_id),
    async (c) => {
      // sharedOperation has already recovered an authorised identical original.
      // All consumed/stale/historic-reviewer checks apply only to a NEW operation.
      const chain = await loadPolicyChain(c, p.workspace_id);
      equal(
        chain.head,
        { policy: cmd.source, version: cmd.expected_head_version },
        "head",
      );
      const proposal = await currentProposal(c, p, cmd.proposal, chain),
        review = await loadReview(
          c,
          p.workspace_id,
          cmd.review.id,
          chain,
          proposal,
        );
      equal(
        reference({
          id: review.id,
          version: review.version,
          content_hash: review.content_hash,
        }),
        cmd.review,
        "review",
      );
      if (review.reviewer_id === p.actor_id)
        throw new AppError(
          403,
          "IndependentPublisherRequired",
          "Publication requires a distinct current publisher.",
        );
      if (
        (
          await c.query(
            "SELECT 1 FROM ppo.scheduling_policy_publications WHERE workspace_id=$1 AND review_id=$2",
            [p.workspace_id, review.id],
          )
        ).rowCount
      )
        invalid("review", "This frozen review has already been consumed.");
      const ctx = await reviewContext(c, p.workspace_id, review.id);
      equal(ctx.content.review, cmd.review, "context_review");
      equal(
        await policyAuthority(
          c,
          { ...p, actor_id: review.reviewer_id },
          "schedule.policy.review",
        ),
        ctx.content.reviewer_authority,
        "reviewer_authority",
      );
      const loaded = await loadPolicyPopulation(c, p, chain, proposal);
      equal(loaded.exclusions_hash, ctx.content.exclusions_hash, "exclusions");
      assertReviewDependenciesCurrent(review, {
        chain,
        proposal,
        proposer_id: proposal.proposer_id,
        reviewer_id: review.reviewer_id,
        population: loaded.population,
        observed_at: loaded.observed_at,
      });
      const policy = policyContent(ctx.content.selected_policy),
        binding = bindPublishedPolicyReview(policy, review, {
          chain,
          proposal,
          proposer_id: proposal.proposer_id,
          reviewer_id: review.reviewer_id,
          population: loaded.population,
        });
      equal(binding.selected_policy, cmd.selected_policy, "selected_policy");
      const publicationId = randomUUID(),
        receiptId = randomUUID(),
        publishedAt = await observationTime(c),
        envelope = { command: "PublishSchedulingPolicy", ...cmd };
      await c.query(
        `INSERT INTO ppo.scheduling_policies(id,workspace_id,version,name,status,effective_from,effective_to,source_as_at,evidence,
      initial_contact_required,changed_contact_allowed,all_crew_skilled,max_visit_minutes) VALUES($1,$2,$3,$4,'Published',$5,$6,$7,$8,true,true,true,$9)`,
        [
          policy.id,
          p.workspace_id,
          policy.version,
          policy.name,
          policy.effective_from,
          policy.effective_to,
          policy.source_as_at,
          policy.evidence,
          policy.max_visit_minutes,
        ],
      );
      await c.query(
        `INSERT INTO ppo.scheduling_policy_members(workspace_id,family,policy_id,policy_version,content_hash,chain_version,predecessor_id,publication_id,content,canonical_content)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          p.workspace_id,
          chain.family,
          policy.id,
          policy.version,
          cmd.selected_policy.content_hash,
          chain.head.version + 1,
          cmd.source.id,
          publicationId,
          policy,
          canonical(policy),
        ],
      );
      await c.query(
        `INSERT INTO ppo.scheduling_policy_publications(id,workspace_id,family,created_at,created_by,proposal_id,proposal_version,proposal_hash,
      review_id,review_version,review_hash,predecessor_id,policy_id,policy_version,policy_hash,head_version,operation_id,command_hash,command,canonical_command,receipt_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        [
          publicationId,
          p.workspace_id,
          chain.family,
          publishedAt,
          p.actor_id,
          proposal.id,
          proposal.version,
          proposal.content_hash,
          review.id,
          review.version,
          review.content_hash,
          cmd.source.id,
          policy.id,
          policy.version,
          cmd.selected_policy.content_hash,
          chain.head.version + 1,
          cmd.operation_id,
          digest(envelope),
          envelope,
          canonical(envelope),
          receiptId,
        ],
      );
      await c.query(
        "UPDATE ppo.scheduling_policy_heads SET policy_id=$3,version=version+1 WHERE workspace_id=$1 AND family=$2 AND version=$4",
        [p.workspace_id, chain.family, policy.id, chain.head.version],
      );
      const impactIds: string[] = [];
      for (const candidate of review.candidates.filter(
        (x) => x.evaluation.outcome === "ImpactRequired",
      )) {
        const impactId = randomUUID(),
          b = candidate.dependencies.booking;
        await c.query(
          `INSERT INTO ppo.scheduling_policy_impacts(workspace_id,id,publication_id,review_id,appointment_id,dependency_fingerprint,content,canonical_content,content_hash)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            p.workspace_id,
            impactId,
            publicationId,
            review.id,
            b.appointment.id,
            candidate.dependency_fingerprint,
            candidate,
            canonical(candidate),
            digest(candidate),
          ],
        );
        const activity: ActivityInput = {
          id: randomUUID(),
          company_id: b.company_id,
          site_id: b.site_id,
          kind: "TechnicalFollowUp",
          activity_type: "Task",
          owner_id: candidate.impact_owner_id!,
          summary:
            "SYN scheduling policy impact: review and resolve the linked booking",
          due_at: null,
          due_needed: true,
          access_class: "RestrictedService",
          links: [{ object_type: "Site", object_id: b.site_id }],
        };
        // Narrow typed consequence, not a general Activity-edit grant to the publisher.
        await validateLinks(c, p, activity);
        await validateLinks(c, { ...p, actor_id: activity.owner_id }, activity);
        await insertActivity(c, p, activity);
        await c.query(
          "INSERT INTO ppo.scheduling_policy_impact_activities VALUES($1,$2,$3)",
          [p.workspace_id, impactId, activity.id],
        );
        impactIds.push(impactId);
      }
      // Recheck expiring duties/owners at the final boundary. Ordinary graph commands
      // cannot interleave; direct grant expiry still follows wall time.
      await policyAuthority(c, p, "schedule.policy.publish");
      await assertOwnersCurrent(c, p, loaded.population);
      equal(
        await policyAuthority(
          c,
          { ...p, actor_id: review.reviewer_id },
          "schedule.policy.review",
        ),
        ctx.content.reviewer_authority,
        "reviewer_authority",
      );
      await assertStillFuture(
        c,
        loaded.recheck_before,
        review.candidates.map((x) => x.dependencies.booking.start_at),
      );
      return {
        id: publicationId,
        version: 1,
        state: "Published",
        updated_at: new Date(publishedAt),
        receipt_id: receiptId,
        audit_details: {
          ...binding,
          population_hash: review.population_hash,
          context_hash: ctx.content_hash,
          impact_ids: impactIds,
        },
        publication_event: {
          family: chain.family,
          policy_id: policy.id,
          policy_version: policy.version,
          policy_hash: cmd.selected_policy.content_hash,
          review_id: review.id,
          review_hash: review.content_hash,
          population_hash: review.population_hash,
          impact_count: impactIds.length,
        },
      };
    },
    "SchedulingPolicyPublication",
    "PolicyOrTemplatePublished",
  );
}

export async function readPolicyEvidence(
  p: Principal,
  kind: "proposal" | "review" | "publication",
  recordId: string,
) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    // Either dedicated duty can read the evidence, but each requires complete reads.
    try {
      await policyAuthority(c, p, "schedule.policy.review");
    } catch (e) {
      if (!(e instanceof AppError) || e.code !== "PolicyAuthorityRequired")
        throw e;
      await policyAuthority(c, p, "schedule.policy.publish");
    }
    const table = {
      proposal: "scheduling_policy_proposals",
      review: "scheduling_policy_reviews",
      publication: "scheduling_policy_publications",
    }[kind];
    const row = (
      await c.query(
        `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`,
        [p.workspace_id, id(recordId)],
      )
    ).rows[0];
    if (!row) throw unavailable();
    const chain = await loadPolicyChain(c, p.workspace_id);
    if (kind === "publication")
      return {
        publication: row,
        impacts: (
          await c.query(
            "SELECT i.*,a.activity_id FROM ppo.scheduling_policy_impacts i JOIN ppo.scheduling_policy_impact_activities a ON (a.workspace_id,a.impact_id)=(i.workspace_id,i.id) WHERE i.workspace_id=$1 AND i.publication_id=$2 ORDER BY i.id",
            [p.workspace_id, row.id],
          )
        ).rows,
      };
    const proposalRow =
      kind === "proposal"
        ? row
        : (
            await c.query(
              "SELECT * FROM ppo.scheduling_policy_proposals WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, row.proposal_id],
            )
          ).rows[0];
    const prefix = chainPrefix(chain, proposalRow.expected_head_version),
      proposal = await loadProposal(c, p.workspace_id, proposalRow.id, prefix);
    if (kind === "proposal") return { proposal };
    const review = await loadReview(
        c,
        p.workspace_id,
        row.id,
        prefix,
        proposal,
      ),
      context = await reviewContext(c, p.workspace_id, row.id);
    return {
      proposal,
      review,
      context: { ...context.content, content_hash: context.content_hash },
      selected_policy: policyReference(
        policyContent(context.content.selected_policy),
      ),
    };
  });
}

// Online preparation for a dedicated reviewer/publisher. Full family validation
// and complete workspace source visibility precede disclosure.
export async function readPolicyFamily(p: Principal) {
  return transaction(async c => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [p.workspace_id]);
    try { await policyAuthority(c, p, "schedule.policy.review"); }
    catch (e) {
      if (!(e instanceof AppError) || e.code !== "PolicyAuthorityRequired") throw e;
      await policyAuthority(c, p, "schedule.policy.publish");
    }
    return loadPolicyChain(c, p.workspace_id);
  });
}
