import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { invalid, object, uuid } from "../platform/validation";

export type CompanyChoice = { id: string; name: string };

// NR-18: the companies a person can work in are the ones their current grants reach. A
// workspace-scoped grant reaches every company in the workspace. Names lead with the ERP company
// code, because two companies may share a display name.
export async function workingCompanies(p: Principal) {
  const c = database();
  const companies = (
    await c.query<CompanyChoice>(
      `SELECT DISTINCT c.id,c.erp_company_id||' · '||c.display_name AS name FROM ppo.companies c
       JOIN ppo.permission_grants g ON g.workspace_id=c.workspace_id AND (g.scope_type='Workspace' OR g.company_id=c.id)
       JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
       WHERE c.workspace_id=$1 AND g.user_id=$2 AND u.active
       AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
       ORDER BY name,c.id`,
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  const chosen = (
    await c.query<{ company_id: string }>(
      "SELECT company_id FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2",
      [p.workspace_id, p.actor_id],
    )
  ).rows[0]?.company_id;
  // A choice the grants no longer reach would narrow to nothing, so it lapses and every reachable
  // company shows again. Removing it can only widen back to what the grants already allow.
  if (chosen && !companies.some((x) => x.id === chosen)) {
    await c.query("DELETE FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2 AND company_id=$3", [p.workspace_id, p.actor_id, chosen]);
    return { companies, working_company_id: null };
  }
  return { companies, working_company_id: chosen ?? null };
}

export async function chooseWorkingCompany(p: Principal, input: unknown) {
  const body = object(input, ["company_id"]);
  const c = database();
  if (body.company_id === null) {
    await c.query("DELETE FROM ppo.working_companies WHERE workspace_id=$1 AND user_id=$2", [p.workspace_id, p.actor_id]);
    return workingCompanies(p);
  }
  const company = uuid(body.company_id, "company_id");
  const { companies } = await workingCompanies(p);
  if (!companies.some((x) => x.id === company)) invalid("company_id", "Choose a company you can work in.");
  await c.query(
    `INSERT INTO ppo.working_companies(workspace_id,user_id,company_id) VALUES($1,$2,$3)
     ON CONFLICT (workspace_id,user_id) DO UPDATE SET company_id=EXCLUDED.company_id,chosen_at=clock_timestamp()`,
    [p.workspace_id, p.actor_id, company],
  );
  return workingCompanies(p);
}
