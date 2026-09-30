import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { loadPolicyChain, policyStorageAvailable } from "./policy-persistence";
import {
  POLICY_FAMILY,
  policyContent,
  policyReference,
  selectPolicyForVisit,
  validatePolicyChain,
} from "./policy-chain";
import { visibleAppointment } from "./planner";
import { transaction } from "../platform/database";
import { interval, SCHEDULING_POLICY_ID } from "./validation";
import { object } from "../shared/validation";

// Call inside a consistent read or the shared workspace command lock. Historic
// pins stay separate from the policy applicable to the proposed visit interval.
export async function bookingPolicy(
  c: QueryClient,
  p: Principal,
  a: {
    scheduling_policy_id: string | null;
    start_at: Date;
    end_at: Date;
  },
) {
  // Populated upgrade proofs run this code against pre-publication schemas.
  // With no publication storage there can be no successor or durable hold.
  // Never fall back if the storage exists but its lineage is incomplete/corrupt.
  const hasPublication = await policyStorageAvailable(c);
  const chain = hasPublication
    ? await loadPolicyChain(c, p.workspace_id)
    : await legacyRoot(c, p);
  const selected = selectPolicyForVisit(
    chain,
    a.start_at.toISOString(),
    a.end_at.toISOString(),
  );
  const applicable = chain.members.find((m) => m.policy.id === selected.id)!;
  const pinned = a.scheduling_policy_id
    ? chain.members.find((m) => m.policy.id === a.scheduling_policy_id)
    : applicable;
  if (!pinned)
    throw new AppError(
      422,
      "PolicyUnavailable",
      "The exact booking policy is not in the published family.",
    );
  return {
    policy: {
      ...pinned.policy,
      content_hash: pinned.content_hash,
      family_head_version: chain.head.version,
    },
    applicable: applicable.policy,
    selected_policy: policyReference(applicable.policy),
    family_head_version: chain.head.version,
  };
}

export async function prepareBookingPolicy(
  p: Principal,
  id: string,
  query: unknown = {},
) {
  const input = object(query, ["start_at", "end_at"]);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const { a } = await visibleAppointment(c, p, id);
    const period =
      input.start_at !== undefined || input.end_at !== undefined
        ? interval(input.start_at, input.end_at)
        : {
            start_at: a.start_at.toISOString(),
            end_at: a.end_at.toISOString(),
          };
    return {
      ...period,
      ...(await bookingPolicy(c, p, {
        ...a,
        start_at: new Date(period.start_at),
        end_at: new Date(period.end_at),
      })),
    };
  });
}

async function legacyRoot(c: QueryClient, p: Principal) {
  const row = (
    await c.query(
      `SELECT id,version,name,effective_from,effective_to,source_as_at,evidence,max_visit_minutes,
    initial_contact_required,changed_contact_allowed,all_crew_skilled FROM ppo.scheduling_policies
    WHERE workspace_id=$1 AND id=$2 AND status='Published' AND synthetic`,
      [p.workspace_id, SCHEDULING_POLICY_ID],
    )
  ).rows[0];
  if (!row)
    throw new AppError(
      422,
      "PolicyUnavailable",
      "Published scheduling policy required.",
    );
  const policy = policyContent(JSON.parse(JSON.stringify(row)));
  const pin = policyReference(policy);
  if (
    ![
      "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44",
      "19874ea4e67397f9d197c181f84a97246925f3c9634fde8e6de6c3c2109ba304",
    ].includes(pin.content_hash)
  )
    throw new AppError(
      422,
      "PolicyUnavailable",
      "Unknown legacy scheduling root.",
    );
  const binding = {
    workspace_id: p.workspace_id,
    family: POLICY_FAMILY,
    root_policy_id: SCHEDULING_POLICY_ID,
  };
  return validatePolicyChain({
    ...binding,
    seed_root: pin,
    head: { policy: pin, version: 1 },
    members: [
      {
        ...binding,
        status: "Published",
        synthetic: true,
        policy,
        content_hash: pin.content_hash,
        predecessor: null,
        review_binding: null,
      },
    ],
  });
}
