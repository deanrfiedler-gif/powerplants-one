import { listEngineering } from "../engineering/service";
import { listLeads } from "../crm/leads/reads";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { object } from "../shared/validation";
import { listShared } from "../shared/reads";
import { listOpportunities } from "../crm/worklist";
import { listActivities } from "../activities/activities";
import { listTickets } from "../service/intake";
import { actionsForCapabilities, type ShellContext } from "./model";
import { collectSearch, searchQuery } from "./search";
import { listProjects } from "../projects/service";
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
  return collectSearch(searchQuery(input), [
    { kind: "Engineering package", path: "/engineering", label: "title", read: q => listEngineering(p, q) },
    { kind: "Lead", path: "/sales/leads", label: "title", read: q => listLeads(p, q) },
    { kind: "Project", path: "/projects", label: "title", read: q => listProjects(p, q) },
    { kind: "Deal", path: "/sales/opportunities", label: "title", read: q => listOpportunities(p, q) },
    { kind: "Customer", path: "/customers", label: "display_name", read: q => listShared(p, "Organisation", q) },
    { kind: "Contact", path: "/people", label: "display_name", read: q => listShared(p, "Person", q) },
    { kind: "Site", path: "/sites", label: "display_name", read: q => listShared(p, "Site", q) },
    { kind: "Equipment", path: "/equipment", label: "description", read: q => listShared(p, "Asset", q) },
    { kind: "Activity", path: "/work", label: "summary", read: q => listActivities(p, q) },
    { kind: "Service request", path: "/service/tickets", label: "summary", read: q => listTickets(p, q) },
  ]);
}
