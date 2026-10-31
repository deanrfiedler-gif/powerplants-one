import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import { scopeSql } from "../platform/permissions";
import { policyReadAuthority } from "../scheduling/policy-authority";
import { loadPolicyChain } from "../scheduling/policy-persistence";
import { readPolicyEvidence } from "../scheduling/policy-commands";
import type { PolicyChain } from "../scheduling/policy-chain";
export type PolicyTerm = {
  name: string;
  value: string;
  meaning: string;
};
export type BusinessPolicy = {
  id: string;
  name: string;
  area: string;
  scope: string;
  version: number | null;
  since: string | null;
  until: string | null;
  source_at: string | null;
  state: string;
  next_version: number | null;
  proposal_id: string | null;
  changes: string;
  terms: PolicyTerm[];
  reference_types?: PolicyTerm[];
  chain?: PolicyChain;
  proposal_count?: number;
};
export const schedulingTerms = (
  p: PolicyChain["members"][number]["policy"],
): PolicyTerm[] => [
  {
    name: "Maximum visit length",
    value: `${p.max_visit_minutes} minutes`,
    meaning: "A longer visit is refused when booked or moved.",
  },
  {
    name: "Initial date agreement",
    value: "Required",
    meaning: "The customer contact agrees the first date before confirmation.",
  },
  {
    name: "Changed date contact",
    value: "Allowed, dispatch held",
    meaning: "Recorded contact is required; dispatch waits until resolved.",
  },
  {
    name: "Crew competence",
    value: "All crew",
    meaning: "Every assigned person holds the scope competencies.",
  },
  {
    name: "Effective from",
    value: p.effective_from,
    meaning: "Bookings starting on or after this instant use this version.",
  },
  {
    name: "Effective to",
    value: p.effective_to,
    meaning: "This version cannot apply after this instant.",
  },
];
const instant = (value: Date | string) => new Date(value).toISOString();
const minutes = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
/** AD-02's bounded family catalogue: validated scheduling lineage, seeded readiness,
 * company-scoped working calendars and the adopted naming decision. No editable projection. */
export async function readBusinessPolicies(p: Principal) {
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
      p.workspace_id,
    ]);
    const permissions = await policyReadAuthority(c, p);
    const chain = await loadPolicyChain(c, p.workspace_id);
    const now: string = (
      await c.query("SELECT clock_timestamp() AS now")
    ).rows[0].now.toISOString();
    const active = chain.members.findLast(
      (m) => m.policy.effective_from <= now && m.policy.effective_to > now,
    );
    const activeVersion = active ? chain.members.indexOf(active) + 1 : null;
    const head = chain.members.at(-1)!.policy;
    const proposals = (
      await c.query<{
        id: string;
        expected_head_version: number;
        effective_from: Date;
        reviewed: boolean;
      }>(
        `
      SELECT p.id,p.expected_head_version,(p.content->>'effective_from')::timestamptz AS effective_from,
      EXISTS(SELECT 1 FROM ppo.scheduling_policy_reviews r WHERE r.workspace_id=p.workspace_id AND r.proposal_id=p.id AND r.reviewer_id<>p.proposer_id) AS reviewed
      FROM ppo.scheduling_policy_proposals p WHERE p.workspace_id=$1
      AND NOT EXISTS(SELECT 1 FROM ppo.scheduling_policy_proposals s WHERE s.workspace_id=p.workspace_id AND s.predecessor_id=p.id)
      AND NOT EXISTS(SELECT 1 FROM ppo.scheduling_policy_publications u WHERE u.workspace_id=p.workspace_id AND u.proposal_id=p.id)
      ORDER BY p.proposed_at DESC,p.id DESC`,
        [p.workspace_id],
      )
    ).rows;
    const proposal = proposals[0];
    const proposalState = proposal
      ? proposal.expected_head_version !== chain.head.version ||
        instant(proposal.effective_from) <= now
        ? "Review out of date"
        : proposal.reviewed
          ? "Waiting to publish"
          : "Waiting for review"
      : "No proposal";
    const items: BusinessPolicy[] = [
      {
        id: chain.root_policy_id,
        name: head.name,
        area: "Scheduling",
        scope: "Workspace-wide",
        version: activeVersion,
        since: active?.policy.effective_from ?? null,
        until: active?.policy.effective_to ?? null,
        source_at: head.source_as_at,
        state: proposalState,
        next_version: proposal ? proposal.expected_head_version + 1 : null,
        proposal_id: proposal?.id ?? null,
        changes: "Saved proposal, independent review and separate publisher",
        terms: active ? schedulingTerms(active.policy) : [],
        chain,
        proposal_count: proposals.length,
      },
    ];
    const readiness = (
      await c.query(
        `SELECT DISTINCT ON (policy_type,key) * FROM ppo.policy_versions
      WHERE workspace_id=$1 AND status='Published' AND effective_at<=$2
      ORDER BY policy_type,key,effective_at DESC,version DESC`,
        [p.workspace_id, now],
      )
    ).rows;
    for (const row of readiness) {
      const criteria = (
        await c.query(
          `SELECT label,blocking_stage,exception_allowed,not_applicable_allowed FROM ppo.policy_criteria
        WHERE workspace_id=$1 AND policy_version_id=$2 ORDER BY criterion_code`,
          [p.workspace_id, row.id],
        )
      ).rows;
      items.push({
        id: row.id,
        name: `${row.key} service readiness`,
        area: "Field readiness",
        scope: "Workspace-wide",
        version: row.version,
        since: instant(row.effective_at),
        until: null,
        source_at: null,
        state: "Seed only, no editor",
        next_version: null,
        proposal_id: null,
        changes: "Seed only, no editor",
        terms: criteria.map((r) => ({
          name: String(r.label),
          value: `Checked at ${r.blocking_stage}`,
          meaning: `${r.exception_allowed ? "Named exception permitted" : "No exception"}; ${r.not_applicable_allowed ? "not applicable permitted" : "required when applicable"}.`,
        })),
      });
    }
    const calendars = (
      await c.query(
        `SELECT cal.*,co.erp_company_id FROM ppo.working_calendars cal
      JOIN ppo.companies co ON (co.workspace_id,co.id)=(cal.workspace_id,cal.company_id)
      WHERE cal.workspace_id=$1 AND cal.status='Published' AND ${scopeSql("cal.company_id", "NULL::uuid", "schedule.read")}
      ORDER BY co.erp_company_id,cal.name,cal.version`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    for (const row of calendars) {
      const intervals = (
        await c.query(
          `SELECT weekday,start_minute,end_minute FROM ppo.calendar_intervals WHERE workspace_id=$1 AND calendar_id=$2 ORDER BY weekday,start_minute`,
          [p.workspace_id, row.id],
        )
      ).rows;
      const exceptions = (
        await c.query(
          `SELECT start_at,end_at,kind,reason FROM ppo.calendar_exceptions WHERE workspace_id=$1 AND calendar_id=$2 ORDER BY start_at,id`,
          [p.workspace_id, row.id],
        )
      ).rows;
      const effective =
        instant(row.effective_from) <= now && instant(row.effective_to) > now;
      items.push({
        id: row.id,
        name: row.name,
        area: "Working hours",
        scope: row.erp_company_id,
        version: effective ? row.version : null,
        since: instant(row.effective_from),
        until: instant(row.effective_to),
        source_at: instant(row.source_as_at),
        state: "Seed only, no editor",
        next_version: null,
        proposal_id: null,
        changes: "Seed only, no editor",
        terms: [
          {
            name: "Time zone",
            value: row.timezone,
            meaning: "Calendar intervals use local civil time.",
          },
          ...intervals.map((r) => ({
            name: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][r.weekday],
            value: `${minutes(r.start_minute)}–${minutes(r.end_minute)}`,
            meaning:
              "Seeded available working interval; exceptions and resource availability still apply.",
          })),
          ...exceptions.map((r) => ({
            name: `Exception · ${r.kind}`,
            value: `${instant(r.start_at)} to ${instant(r.end_at)}`,
            meaning: String(r.reason),
          })),
        ],
      });
    }
    items.push({
      id: "record-references",
      name: "Readable record references",
      area: "Record references",
      scope: "Workspace-wide",
      version: null,
      since: null,
      until: null,
      source_at: null,
      state: "Owner decision",
      next_version: null,
      proposal_id: null,
      changes: "Adopted naming decision; no editor",
      // The eight types in the accepted AD-02 reference record. These are format
      // examples, never allocated records or a new reference family.
      reference_types: [
        ["SRV", "Site survey"],
        ["TKT", "Service request"],
        ["WO", "Work order"],
        ["APT", "Appointment"],
        ["OPP", "Opportunity"],
        ["SITE", "Site"],
        ["ACR", "Access request"],
        ["RPT", "Service report"],
      ].map(([type, label]) => ({
        name: type,
        value: `SYN-${type}-000nnn`,
        meaning: `${label}. nnn stands for the allocated number; this is a format example.`,
      })),
      terms: [
        {
          name: "Pattern",
          value: "{namespace}-{type}-{number}",
          meaning:
            "Readable record references are separate from internal UUIDs.",
        },
        {
          name: "Namespaces",
          value: "SYN / PPO",
          meaning:
            "SYN marks synthetic fixtures; PPO is reserved for independently authorised operational records.",
        },
        {
          name: "Number",
          value: "At least six digits",
          meaning:
            "Numbers expand without truncation; six digits is not a maximum.",
        },
        {
          name: "Sequence",
          value: "Continuing per workspace, type and namespace",
          meaning:
            "Gaps are permitted; numbers are never reused and counters never reset annually.",
        },
        {
          name: "Adopted",
          value: "20 October 2026",
          meaning: "Owner decision, not a database publication timestamp.",
        },
        {
          name: "Existing references",
          value: "Kept as issued",
          meaning: "Existing SYN-PPO references are not renamed.",
        },
        {
          name: "Policies and proposals",
          value: "No readable reference",
          meaning: "Quote the policy name, version and proposal revision.",
        },
      ],
    });
    await policyReadAuthority(c, p);
    return {
      items,
      ...permissions,
      read_at: now,
      viewer: p.display_name,
      proposal_count: proposals.length,
    };
  });
}
export async function readBusinessPolicy(p: Principal, id: string) {
  const register = await readBusinessPolicies(p);
  const item = register.items.find((r) => r.id === id);
  if (!item) throw unavailable();
  let evidence = item.proposal_id
    ? await readPolicyEvidence(p, "proposal", item.proposal_id)
    : null;
  if (evidence?.latest_review_id)
    evidence = await readPolicyEvidence(p, "review", evidence.latest_review_id);
  let previous = null;
  if (!evidence?.review && evidence?.proposal.predecessor_proposal) {
    const predecessor = await readPolicyEvidence(
      p,
      "proposal",
      evidence.proposal.predecessor_proposal.id,
    );
    if (predecessor.latest_review_id)
      previous = await readPolicyEvidence(
        p,
        "review",
        predecessor.latest_review_id,
      );
  }
  const current = await readBusinessPolicies(p);
  const fresh = current.items.find((r) => r.id === id);
  if (
    !fresh ||
    fresh.proposal_id !== item.proposal_id ||
    fresh.chain?.head.version !== item.chain?.head.version ||
    fresh.version !== item.version
  )
    throw new AppError(
      409,
      "PolicyChanged",
      "The policy changed during this read. Refresh before continuing.",
    );
  const actors = await transaction(async (c) => {
    await policyReadAuthority(c, p);
    const ids = [
      evidence?.proposal.proposer_id,
      evidence?.review?.reviewer_id,
      previous?.review?.reviewer_id,
    ].filter(Boolean);
    const names = (
      await c.query<{
        id: string;
        display_name: string;
      }>(
        "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
        [p.workspace_id, ids],
      )
    ).rows;
    await policyReadAuthority(c, p);
    return names;
  });
  return {
    item: fresh,
    evidence,
    previous,
    actors,
    can_review: current.can_review,
    can_publish: current.can_publish,
    read_at: current.read_at,
    viewer: current.viewer,
  };
}
