import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { responseAuthority } from "../response/context";
// Only explicitly bounded, workspace-locked reads get this temporary client.
// Never attach state to a pooled connection or pass this wrapper to mutation.
const sourceReads = new WeakMap<
  QueryClient,
  {
    workspace: string;
    actor: string;
    revisions: Set<string>;
  }
>();
export function conversionReadClient(
  c: QueryClient,
  p: Principal,
): QueryClient {
  const read = { query: c.query.bind(c) };
  sourceReads.set(read, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    revisions: new Set(),
  });
  return read;
}
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
  if (link) {
    const scope = sourceReads.get(c);
    const sameActor =
      scope?.workspace === p.workspace_id && scope.actor === p.actor_id;
    if (!sameActor || !scope.revisions.has(link.revision_id)) {
      await responseAuthority(c, p, link.revision_id);
      if (sameActor) scope.revisions.add(link.revision_id);
    }
  }
}
