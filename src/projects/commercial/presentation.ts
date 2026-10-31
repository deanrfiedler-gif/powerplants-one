import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import type { Content } from "./model";

// Call only after source and Activity authority succeeds. These are internal users
// already attributed on a permitted commercial record, not a directory read.
export async function commercialNames(
  c: QueryClient,
  p: Principal,
  rows: { content: Content; created_by: string }[],
) {
  const ids = [
    ...new Set(rows.flatMap((x) => [x.content.owner_id, x.created_by])),
  ];
  const users = (
    await c.query<{ id: string; display_name: string }>(
      "SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])",
      [p.workspace_id, ids],
    )
  ).rows;
  return new Map(users.map((u) => [u.id, u.display_name]));
}
export function commercialPresentation<
  T extends { content: Content; recorded_by: string },
>(row: T, names: Map<string, string>) {
  return {
    ...row,
    owner_name: names.get(row.content.owner_id) ?? "Name unavailable",
    recorded_by_name: names.get(row.recorded_by) ?? "Name unavailable",
  };
}
