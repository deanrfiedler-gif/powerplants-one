// SQL fixture construction for storage proofs only. This is not a publication command
// or a complete booking evaluator and must never be imported by application routes.
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { canonical } from "../../src/platform/operations";
import {
  policyContent,
  policyReference,
} from "../../src/scheduling/policy-chain";
import { reviewedPopulation } from "../../src/scheduling/policy-dependencies";
import {
  createPolicyProposal,
  createPolicyReview,
  proposalReference,
} from "../../src/scheduling/policy-publication-contracts";
import {
  loadPolicyChain,
  savePolicyProposal,
  savePolicyReview,
} from "../../src/scheduling/policy-persistence";
import { digest } from "../../src/scheduling/policy-values";
import { candidateFixture } from "./policy-publication";

export const workspace = "10000000-0000-4000-8000-000000000001";
export const proposer = "30000000-0000-4000-8000-000000000001";
export const reviewer = "30000000-0000-4000-8000-000000000010";
export const publishedAt = "2030-03-01T00:00:00.123Z";

export async function persistenceFixture(db: PoolClient, count = 2) {
  // As in the existing policy-impact volume proof, add a separate non-overlapping
  // synthetic booking with real identity/crew/reservation constraints. This is a
  // storage fixture, not booking-command or calendar acceptance.
  if (count > 1) {
    const extra = randomUUID();
    await db.query(
      `INSERT INTO ppo.appointments
      SELECT (jsonb_populate_record(NULL::ppo.appointments,to_jsonb(a)||jsonb_build_object(
        'id',$1::uuid,'display_number',NULL,'start_at','2031-11-01T00:00:00Z'::timestamptz,
        'end_at','2031-11-01T02:00:00Z'::timestamptz))).*
      FROM ppo.appointments a WHERE a.id='a8000000-0000-4000-8000-000000000001'`,
      [extra],
    );
    await db.query(
      `INSERT INTO ppo.assignments
      SELECT (jsonb_populate_record(NULL::ppo.assignments,to_jsonb(x)||jsonb_build_object(
        'id',gen_random_uuid(),'appointment_id',$1::uuid))).*
      FROM ppo.assignments x WHERE x.appointment_id='a8000000-0000-4000-8000-000000000001' AND x.active`,
      [extra],
    );
    await db.query(
      `INSERT INTO ppo.resource_reservations(id,workspace_id,assignment_id,resource_id,start_at,end_at,active)
      SELECT gen_random_uuid(),x.workspace_id,x.id,x.resource_id,a.start_at-make_interval(mins=>x.travel_before_minutes),
        a.end_at+make_interval(mins=>x.travel_after_minutes),true FROM ppo.appointments a JOIN ppo.assignments x ON x.appointment_id=a.id AND x.active
      WHERE a.id=$1`,
      [extra],
    );
  }
  const chain = await loadPolicyChain(db, workspace);
  const proposal = createPolicyProposal(
    { max_visit_minutes: 480, effective_from: "2031-01-01T00:00:00.123Z" },
    {
      chain,
      proposer_id: proposer,
      id: randomUUID(),
      version: 1,
      predecessor_proposal: null,
      proposed_at: "2030-01-01T00:00:00.123Z",
    },
  );
  const bookings = (
    await db.query(
      `SELECT row_to_json(a) AS value FROM ppo.appointments a WHERE workspace_id=$1 AND status='Confirmed' ORDER BY id LIMIT $2`,
      [workspace, Math.max(1, count)],
    )
  ).rows;
  if (bookings.length < count)
    throw Error("Fixture needs complete typed booking roots");
  const candidates = bookings.slice(0, count).map(({ value: a }, n) => {
    const c = candidateFixture(n + 100),
      d = c.dependencies;
    d.workspace_id = workspace;
    d.booking = {
      ...d.booking,
      start_at: new Date(a.start_at).toISOString(),
      end_at: new Date(a.end_at).toISOString(),
      schedule_version: a.schedule_version,
      assignment_version: a.assignment_version,
      appointment: { id: a.id, version: a.version, content_hash: digest(a) },
      company_id: a.company_id,
      site_id: a.site_id,
      work_order_id: a.work_order_id,
      scheduling_policy: chain.seed_root,
    };
    d.scope_readiness.site = { ...d.scope_readiness.site, id: a.site_id };
    d.ownership.work_order = { ...d.ownership.work_order, id: a.work_order_id };
    d.ownership.service_owner.user.id = proposer;
    // Preserve nulls, ordered source evidence and exact source text through JSONB.
    d.contact_preparation.customer_commitment =
      "  Fictional source text\nwith café and Ω  ";
    if (n === 1)
      return {
        ...c,
        dependencies: {
          ...d,
          ownership: {
            ...d.ownership,
            proposed_impact_owner: d.ownership.service_owner,
          },
        },
        evaluation: {
          outcome: "ImpactRequired",
          checks: c.evaluation.checks.map((check) =>
            check.dimension === "ResourceCalendarSkills"
              ? {
                  ...check,
                  outcome: "Blocked",
                  reasons: ["SyntheticSkillReview"],
                }
              : check,
          ),
        },
        impact_owner_id: proposer,
        impact_reason: "Retain exact fictional skill review",
      };
    return c;
  });
  const population = reviewedPopulation(candidates, "2030-02-01T00:00:00.123Z");
  const review = createPolicyReview(
    {
      id: randomUUID(),
      version: 1,
      reviewer_id: reviewer,
      review_event_id: randomUUID(),
      evaluated_at: "2030-02-01T00:00:00.123Z",
    },
    {
      chain,
      proposal,
      proposer_id: proposer,
      reviewer_id: reviewer,
      population,
    },
  );
  await savePolicyProposal(db, proposal, {
    workspace_id: workspace,
    proposer_id: proposer,
  });
  await savePolicyReview(db, review, {
    workspace_id: workspace,
    proposal_id: proposal.id,
    reviewer_id: reviewer,
    population,
  });
  return { chain, proposal, review, population };
}
export type PersistenceFixture = Awaited<ReturnType<typeof persistenceFixture>>;

export async function publicationFixture(
  db: PoolClient,
  f: PersistenceFixture,
  stopAfter?: string,
) {
  const { proposal: p, review: r, chain } = f;
  const policy = policyContent({
    ...chain.members.at(-1)!.policy,
    id: randomUUID(),
    version: 7,
    effective_from: p.effective_from,
    max_visit_minutes: p.max_visit_minutes,
  });
  const ref = policyReference(policy),
    publicationId = randomUUID(),
    operationId = randomUUID(),
    receiptId = randomUUID();
  const command = {
    command: "PublishSchedulingPolicy",
    schema_version: 1,
    operation_id: operationId,
    proposal: proposalReference(p),
    review: { id: r.id, version: r.version, content_hash: r.content_hash },
    source: p.source,
    expected_head_version: p.expected_head.version,
    selected_policy: ref,
    reason: "Synthetic persistence fixture only",
  };
  const stage = (name: string) => {
    if (stopAfter === name) throw Error(`Injected after ${name}`);
  };
  await db.query(
    `INSERT INTO ppo.scheduling_policies(id,workspace_id,version,name,status,effective_from,effective_to,source_as_at,evidence,
    initial_contact_required,changed_contact_allowed,all_crew_skilled,max_visit_minutes)
    VALUES($1,$2,$3,$4,'Published',$5,$6,$7,$8,true,true,true,$9)`,
    [
      policy.id,
      workspace,
      policy.version,
      policy.name,
      policy.effective_from,
      policy.effective_to,
      policy.source_as_at,
      policy.evidence,
      policy.max_visit_minutes,
    ],
  );
  stage("policy");
  await db.query(
    `INSERT INTO ppo.scheduling_policy_members(workspace_id,family,policy_id,policy_version,content_hash,chain_version,predecessor_id,publication_id,content,canonical_content)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      workspace,
      p.family,
      policy.id,
      policy.version,
      ref.content_hash,
      p.expected_head.version + 1,
      p.source.id,
      publicationId,
      policy,
      canonical(policy),
    ],
  );
  stage("member");
  await db.query(
    `INSERT INTO ppo.scheduling_policy_publications(id,workspace_id,family,created_at,created_by,proposal_id,proposal_version,proposal_hash,
    review_id,review_version,review_hash,predecessor_id,policy_id,policy_version,policy_hash,head_version,operation_id,command_hash,command,canonical_command,receipt_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      publicationId,
      workspace,
      p.family,
      publishedAt,
      proposer,
      p.id,
      p.version,
      p.content_hash,
      r.id,
      r.version,
      r.content_hash,
      p.source.id,
      policy.id,
      policy.version,
      ref.content_hash,
      p.expected_head.version + 1,
      operationId,
      digest(command),
      command,
      canonical(command),
      receiptId,
    ],
  );
  stage("publication");
  await db.query(
    "UPDATE ppo.scheduling_policy_heads SET policy_id=$3,version=version+1 WHERE workspace_id=$1 AND family=$2",
    [workspace, p.family, policy.id],
  );
  stage("head");
  const impacts = [];
  for (const c of r.candidates.filter(
    (c) => c.evaluation.outcome === "ImpactRequired",
  )) {
    const impactId = randomUUID(),
      activityId = randomUUID(),
      b = c.dependencies.booking;
    await db.query(
      `INSERT INTO ppo.scheduling_policy_impacts(workspace_id,id,publication_id,review_id,appointment_id,dependency_fingerprint,content,canonical_content,content_hash)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        workspace,
        impactId,
        publicationId,
        r.id,
        b.appointment.id,
        c.dependency_fingerprint,
        c,
        canonical(c),
        digest(c),
      ],
    );
    stage("impact");
    await db.query(
      `INSERT INTO ppo.activities(id,workspace_id,company_id,site_id,created_by,updated_by,kind,owner_id,summary,due_needed,access_class)
      VALUES($1,$2,$3,$4,$5,$5,'TechnicalFollowUp',$5,'SYN policy persistence task',true,'RestrictedService')`,
      [activityId, workspace, b.company_id, b.site_id, proposer],
    );
    await db.query(
      "INSERT INTO ppo.activity_links(workspace_id,company_id,activity_id,object_type,object_id) VALUES($1,$2,$3,'Site',$4)",
      [workspace, b.company_id, activityId, b.site_id],
    );
    await db.query(
      "INSERT INTO ppo.scheduling_policy_impact_activities VALUES($1,$2,$3)",
      [workspace, impactId, activityId],
    );
    impacts.push({ id: impactId, activity_id: activityId, candidate: c });
  }
  stage("task");
  const receipt = {
    operation_id: operationId,
    record_id: publicationId,
    record_version: 1,
    state: "Published",
    accepted_at: publishedAt,
    receipt_id: receiptId,
    warnings: [],
    // No outbox job in this storage fixture. Generic task_ids retains that meaning;
    // impact Activity IDs are read through scheduling_policy_impact_activities.
    task_ids: [],
  };
  await db.query(
    "INSERT INTO ppo.operation_receipts(id,workspace_id,actor_id,operation_id,record_id,payload_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      receiptId,
      workspace,
      proposer,
      operationId,
      publicationId,
      digest(command),
      receipt,
    ],
  );
  stage("receipt");
  return {
    policy,
    publicationId,
    operationId,
    receiptId,
    command,
    receipt,
    impacts,
  };
}
export type PublicationFixture = Awaited<ReturnType<typeof publicationFixture>>;
export async function resolutionFixture(
  db: PoolClient,
  p: PublicationFixture,
  predecessor?: { id: string; sequence: number },
) {
  const i = p.impacts[0],
    b = i.candidate.dependencies.booking;
  const content = {
    id: randomUUID(),
    workspace_id: workspace,
    impact_id: i.id,
    impact_hash: digest(i.candidate),
    sequence: (predecessor?.sequence ?? 0) + 1,
    predecessor_id: predecessor?.id ?? null,
    actor_id: proposer,
    operation_id: randomUUID(),
    observed_at: "2030-04-01T00:00:00.123Z",
    appointment_id: b.appointment.id,
    appointment_version: b.appointment.version,
    replacement_id: null,
    outcome: "VerifiedNoConflict",
    schema_version: 1,
    evaluator_version: 1,
    reason: "Synthetic resolution evidence; no authority implied",
    dependencies: i.candidate.dependencies,
  };
  await db.query(
    `INSERT INTO ppo.scheduling_policy_resolutions(workspace_id,id,impact_id,sequence,predecessor_id,actor_id,operation_id,observed_at,
    appointment_id,appointment_version,replacement_id,outcome,schema_version,evaluator_version,content,canonical_content,content_hash)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,1,1,$13,$14,$15)`,
    [
      workspace,
      content.id,
      i.id,
      content.sequence,
      content.predecessor_id,
      proposer,
      content.operation_id,
      content.observed_at,
      b.appointment.id,
      b.appointment.version,
      null,
      content.outcome,
      content,
      canonical(content),
      digest(content),
    ],
  );
  return content;
}
