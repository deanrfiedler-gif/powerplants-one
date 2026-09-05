import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import { visible } from "./reads";
export async function scopedOwner(
  c: QueryClient,
  p: Principal,
  id: string,
  company: string,
  site: string | undefined,
  capability: Capability,
) {
  const u = (
    await c.query(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
      [p.workspace_id, id],
    )
  ).rows[0];
  if (!u) throw unavailable();
  const owner = { ...p, actor_id: id, display_name: u.display_name };
  if (
    !(await hasPermission(c, owner, capability, company, site)) ||
    !(await hasPermission(c, owner, "shared.read", company, site))
  )
    throw unavailable();
  return owner;
}
export async function companyContext(
  c: QueryClient,
  p: Principal,
  company: string,
  site: string | null,
  capability: Capability,
) {
  if (
    !(await hasPermission(c, p, capability, company, site ?? undefined)) ||
    !(await hasPermission(c, p, "shared.read", company, site ?? undefined))
  )
    throw unavailable();
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, company],
      )
    ).rowCount
  )
    throw unavailable();
  if (site) {
    const s = await visible(c, p, "Site", site);
    if (s.company_id !== company) throw unavailable();
  }
}
