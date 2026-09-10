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

export async function shellContext(p: Principal, input: unknown): Promise<ShellContext> {
  object(input, []);
  const grants = await database().query<{ capability: string }>(
    `SELECT DISTINCT g.capability FROM ppo.permission_grants g
     JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
     WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active
     AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`,
    [p.workspace_id, p.actor_id],
  );
  return { display_name: p.display_name, actions: actionsForCapabilities(new Set(grants.rows.map(g => g.capability))) };
}
export async function shellSearch(p: Principal, input: unknown) {
  return collectSearch(searchQuery(input), [
    { kind: "Lead", path: "/crm/leads", label: "title", read: q => listLeads(p, q) },
    { kind: "Project", path: "/projects", label: "title", read: q => listProjects(p, q) },
    { kind: "Opportunity", path: "/crm/opportunities", label: "title", read: q => listOpportunities(p, q) },
    { kind: "Customer", path: "/customers", label: "display_name", read: q => listShared(p, "Organisation", q) },
    { kind: "Contact", path: "/people", label: "display_name", read: q => listShared(p, "Person", q) },
    { kind: "Site", path: "/sites", label: "display_name", read: q => listShared(p, "Site", q) },
    { kind: "Equipment", path: "/equipment", label: "description", read: q => listShared(p, "Asset", q) },
    { kind: "Activity", path: "/work", label: "summary", read: q => listActivities(p, q) },
    { kind: "Service request", path: "/service/tickets", label: "summary", read: q => listTickets(p, q) },
  ]);
}
