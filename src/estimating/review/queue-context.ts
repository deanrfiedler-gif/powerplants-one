import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";

// Call only after the native exact-source read has authorised the whole record.
export async function queuePerson(c: QueryClient, p: Principal, id: string) {
  return (
    (
      await c.query<{ display_name: string }>(
        "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, id],
      )
    ).rows[0]?.display_name ?? "Recorded user"
  );
}
export async function queueSite(
  c: QueryClient,
  p: Principal,
  id: string | null | undefined,
) {
  if (!id) return null;
  const site = (
    await c.query<{ id: string; name: string }>(
      "SELECT id,display_name AS name FROM ppo.sites WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  return site ?? null;
}
