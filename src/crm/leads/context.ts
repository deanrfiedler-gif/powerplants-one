import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import {
  hasPermission,
  scopeSql,
  type Capability,
  type QueryClient,
} from "../../platform/permissions";
import { companyContext, scopedOwner } from "../../shared/authority";
import { visibility } from "../../shared/reads";
import { uuid } from "../../shared/validation";
export type Lead = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string | null;
  organisation_id: string | null;
  primary_person_id: string | null;
  owner_id: string;
  display_number: string;
  version: number;
  title: string;
  need_summary: string | null;
  organisation_text: string | null;
  contact_text: string | null;
  source_channel: string;
  source_basis: string;
  status: "New" | "Contacting" | "Nurturing" | "Disqualified" | "Converted";
  is_archived: boolean;
  next_activity_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
};
export async function leadsAvailable(c: QueryClient) {
  return !!(
    await c.query("SELECT to_regclass('ppo.lead_candidates') AS relation")
  ).rows[0].relation;
}
export function leadVisibility(a = "lead") {
  return `${scopeSql(`${a}.company_id`, `${a}.site_id`, "crm.lead.read")} AND ${scopeSql(`${a}.company_id`, `${a}.site_id`)} AND ${scopeSql(`${a}.company_id`, `${a}.site_id`, "shared.internal.read")}
 AND (${a}.organisation_id IS NULL OR EXISTS(SELECT 1 FROM ppo.organisations lorg WHERE lorg.workspace_id=${a}.workspace_id AND lorg.id=${a}.organisation_id AND ${visibility("Organisation", "lorg")}))
 AND (${a}.site_id IS NULL OR EXISTS(SELECT 1 FROM ppo.sites lsite WHERE lsite.workspace_id=${a}.workspace_id AND lsite.id=${a}.site_id AND ${visibility("Site", "lsite")}))
 AND (${a}.primary_person_id IS NULL OR EXISTS(SELECT 1 FROM ppo.people lperson WHERE lperson.workspace_id=${a}.workspace_id AND lperson.id=${a}.primary_person_id AND ${visibility("Person", "lperson")}))`;
}
export async function visibleLead(c: QueryClient, p: Principal, id: string) {
  const lead = (
    await c.query<Lead>(
      `SELECT lead.* FROM ppo.lead_candidates lead WHERE lead.workspace_id=$1 AND lead.id=$3 AND ${leadVisibility()}`,
      [p.workspace_id, p.actor_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!lead) throw unavailable();
  return lead;
}
export async function leadContext(
  c: QueryClient,
  p: Principal,
  l: Pick<Lead, "company_id" | "site_id" | "owner_id">,
  cap: Capability,
) {
  await companyContext(c, p, l.company_id, l.site_id, cap);
  for (const read of ["crm.lead.read", "shared.internal.read"] as const)
    if (
      !(await hasPermission(c, p, read, l.company_id, l.site_id ?? undefined))
    )
      throw unavailable();
  const owner = await scopedOwner(
    c,
    p,
    l.owner_id,
    l.company_id,
    l.site_id ?? undefined,
    "crm.lead.edit",
  );
  for (const read of ["crm.lead.read", "shared.internal.read"] as const)
    if (
      !(await hasPermission(
        c,
        owner,
        read,
        l.company_id,
        l.site_id ?? undefined,
      ))
    )
      throw unavailable();
  return owner;
}
export async function leadAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  cap: Capability = "crm.lead.edit",
  owned = true,
) {
  const l = await visibleLead(c, p, id);
  await leadContext(c, p, l, cap);
  if (owned && l.owner_id !== p.actor_id)
    throw new AppError(
      403,
      "LEAD_OWNER_REQUIRED",
      "Only the current lead owner can change or convert this lead.",
    );
  return l;
}
