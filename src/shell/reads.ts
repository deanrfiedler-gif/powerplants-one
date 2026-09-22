import { applicationSearch } from "./search-service";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { object } from "../shared/validation";
import { actionsForCapabilities, type ShellContext } from "./model";
import { navigationForCapabilities } from "./navigation";

export async function shellContext(p: Principal, input: unknown): Promise<ShellContext> {
  object(input, []);
  const grants = await database().query<{ capability: string }>(
    `SELECT DISTINCT g.capability FROM ppo.permission_grants g
     JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
     WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active
     AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`,
    [p.workspace_id, p.actor_id],
  );
  const capabilities = new Set(grants.rows.map(g => g.capability));
  return { display_name: p.display_name, preference_scope: `${p.workspace_id}:${p.actor_id}`, actions: actionsForCapabilities(capabilities),
    navigation: navigationForCapabilities(capabilities, process.env.PPO_ENV === "azure-demo"),
    // This is a presentation preference for authenticated synthetic/demo users,
    // never an impersonation or permission switch. No production mode is enabled.
    can_preview: ["local-synthetic", "azure-demo"].includes(process.env.PPO_ENV ?? "") };
}
export async function shellSearch(p: Principal, input: unknown) {
  return applicationSearch(p, input, true);
}
