import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { unavailable } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import { visible } from "../../shared/reads";

export type CustomerContext = {
  company_id: string;
  organisation_id: string | null;
  site_id: string | null;
  primary_person_id: string | null;
};
export type LeadResolution = CustomerContext & {
  event_id: string;
  lead_version: number;
};
export async function currentResolution(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  // Earlier-schema upgrade proofs still use the original Lead commands.
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.lead_context_resolutions') AS relation",
      )
    ).rows[0].relation
  )
    return null;
  return (
    (
      await c.query<LeadResolution>(
        "SELECT company_id,organisation_id,site_id,primary_person_id,event_id,lead_version FROM ppo.lead_context_resolutions WHERE workspace_id=$1 AND lead_id=$2 ORDER BY lead_version DESC LIMIT 1",
        [p.workspace_id, id],
      )
    ).rows[0] ?? null
  );
}
export async function visibleCustomerContext(
  c: QueryClient,
  p: Principal,
  l: CustomerContext,
) {
  await companyContext(c, p, l.company_id, l.site_id, "crm.lead.read");
  if (
    l.organisation_id &&
    (await visible(c, p, "Organisation", l.organisation_id)).company_id !==
      l.company_id
  )
    throw unavailable();
  if (l.primary_person_id) await visible(c, p, "Person", l.primary_person_id);
}
export async function sharedLeadContext(
  c: QueryClient,
  p: Principal,
  l: CustomerContext,
) {
  await visibleCustomerContext(c, p, l);
  if (l.primary_person_id) {
    const person = await visible(c, p, "Person", l.primary_person_id);
    if (
      !person.active ||
      !(
        await c.query(
          "SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND person_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
          [
            p.workspace_id,
            l.company_id,
            l.organisation_id,
            l.primary_person_id,
          ],
        )
      ).rowCount
    )
      throw unavailable();
  }
  if (
    l.site_id &&
    !(
      await c.query(
        "SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND site_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [p.workspace_id, l.company_id, l.organisation_id, l.site_id],
      )
    ).rowCount
  )
    throw unavailable();
}
