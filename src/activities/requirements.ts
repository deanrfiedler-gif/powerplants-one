import type { QueryClient } from "../platform/permissions";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { companyContext, scopedOwner } from "../shared/authority";
import {
  authorise,
  nativeCandidateSql,
  type Candidate,
} from "../service/findings/sources";

async function available(c: QueryClient) {
  return !!(
    await c.query(
      "SELECT to_regclass('ppo.service_finding_activity_bindings') AS relation",
    )
  ).rows[0].relation;
}
// An R2-adopted next action uses its exact source-token editor. Existing native
// coordinator follow-ups remain in My Work under the same source/owner authority.
export async function isManagedFindingActivity(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<boolean> {
  if (!(await available(c))) return false;
  return (
    await c.query<{ governed: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM ppo.service_finding_activity_bindings WHERE workspace_id=$1 AND activity_id=$2) AS governed`,
      [p.workspace_id, id],
    )
  ).rows[0].governed;
}

type ActivityContext = {
  id: string;
  company_id: string;
  site_id: string | null;
};
export async function legacyFindingActivityAuthority(
  c: QueryClient,
  p: Principal,
  a: ActivityContext,
  ownerId?: string,
) {
  if (!(await available(c))) return;
  const sources = (
    await c.query<Candidate>(
      `SELECT * FROM (${nativeCandidateSql}) f WHERE activity_id=$2`,
      [p.workspace_id, a.id],
    )
  ).rows;
  if (!sources.length) return;
  await companyContext(
    c,
    p,
    a.company_id,
    a.site_id,
    "service.work_order.edit",
  );
  const owner = ownerId
    ? await scopedOwner(
        c,
        p,
        ownerId,
        a.company_id,
        a.site_id ?? undefined,
        "activity.edit",
      )
    : null;
  // A shared Activity does not let one source's rights override another's.
  for (const source of sources) {
    await authorise(c, p, source);
    if (owner) await authorise(c, owner, source);
  }
}
export async function canEditFindingActivity(
  c: QueryClient,
  p: Principal,
  a: ActivityContext,
) {
  if (await isManagedFindingActivity(c, p, a.id)) return false;
  try {
    await legacyFindingActivityAuthority(c, p, a);
    return true;
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status)) return false;
    throw e;
  }
}

// Activity detail also runs against historical schemas during populated upgrades.
export async function activityRequirements(
  c: QueryClient,
  p: Principal,
  id: string,
): Promise<string | null> {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.service_finding_action_details') AS relation",
      )
    ).rows[0].relation
  )
    return null;
  return (
    (
      await c.query<{ required_evidence: string | null }>(
        "SELECT required_evidence FROM ppo.service_finding_action_details WHERE workspace_id=$1 AND activity_id=$2",
        [p.workspace_id, id],
      )
    ).rows[0]?.required_evidence ?? null
  );
}
