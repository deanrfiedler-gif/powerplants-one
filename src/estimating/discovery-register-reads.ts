import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import type { DiscoveryWorkspace } from "./discovery-workspace-context";
import type { Opportunity } from "../crm/context";
import { savedOptionCost } from "./discovery-reads";
import { costBasisAvailable } from "./cost-basis-context";
import type { RegisterCost } from "./discovery-register-model";

// Called only after workspaceAuthority/currentGroup have authorised the opportunity,
// its customer relationships and every current revision. Never return estimate lines.
export async function discoveryRegisterFields(
  c: QueryClient,
  p: Principal,
  w: DiscoveryWorkspace,
  o: Opportunity,
  revisionId: string,
) {
  const customer = (
    await c.query<{ id: string; name: string }>(
      "SELECT id,display_name AS name FROM ppo.organisations WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, o.organisation_id],
    )
  ).rows[0];
  const owner = (
    await c.query<{ id: string; name: string }>(
      "SELECT id,display_name AS name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, w.owner_id],
    )
  ).rows[0];
  const saved = await savedOptionCost(c, p, w.selected_option_id);
  let cost: RegisterCost = {
    status: saved.status === "Available" ? "Unavailable" : saved.status,
  };
  if (saved.status === "Available") {
    // A revision may have been costed by an earlier saved estimate version. Count
    // only its existence, after the current revision and estimate are authorised.
    const latestCosted =
      saved.basis?.revision_id === revisionId ||
      ((await costBasisAvailable(c)) &&
        Boolean(
          (
            await c.query(
              "SELECT 1 FROM ppo.estimate_discovery_bases WHERE workspace_id=$1 AND estimate_id=$2 AND revision_id=$3 LIMIT 1",
              [p.workspace_id, saved.estimate_id, revisionId],
            )
          ).rowCount,
        ));
    cost = {
      status: "Available",
      estimate_id: saved.estimate_id,
      version_id: saved.estimate_version_id,
      version: saved.version,
      revision_id: saved.basis?.revision_id ?? null,
      revision: saved.basis?.revision ?? null,
      latest_costed: latestCosted,
      amount: saved.sell_total,
    };
  }
  return {
    company_id: w.company_id,
    customer: customer ?? { id: o.organisation_id, name: "Not recorded" },
    owner: owner ?? { id: w.owner_id, name: "Not recorded" },
    updated_at: w.updated_at.toISOString(),
    cost,
  };
}
