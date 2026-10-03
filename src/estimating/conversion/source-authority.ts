import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { responseAuthority } from "../response/context";
// Native target routes and their original receipts cannot bypass the source's current authority.
export async function conversionSourceAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.quote_conversion_targets') present",
      )
    ).rows[0].present
  )
    return;
  const link = (
    await c.query(
      "SELECT revision_id FROM ppo.quote_conversion_targets WHERE workspace_id=$1 AND target_id=$2",
      [p.workspace_id, target],
    )
  ).rows[0];
  if (link) await responseAuthority(c, p, link.revision_id);
}
