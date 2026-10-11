import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import {
  capabilityCatalogue,
  capabilityLabels,
  isCapability,
} from "./capabilities";
import { roleProposals } from "./roles";
import type { Principal } from "../platform/identity";
import {
  hasPermission,
  type Capability,
  type QueryClient,
} from "../platform/permissions";
import {
  loadWorkingCompany,
  withWorkingCompany,
} from "../platform/working-company";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function identifier(value: string) {
  if (!uuid.test(value))
    throw new AppError(422, "InvalidIdentifier", "Choose a valid record.");
  return value;
}

export async function requireAccessInspection(c: QueryClient, p: Principal) {
  const result = await c.query(
    `SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u
       ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
     WHERE g.workspace_id=$1 AND g.user_id=$2 AND u.active
       AND g.capability='admin.access.read' AND g.scope_type='Workspace'
       AND g.scope_id=$1 AND g.valid_from<=clock_timestamp()
       AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())`,
    [p.workspace_id, p.actor_id],
  );
  if (!result.rowCount)
    throw new AppError(
      403,
      "Forbidden",
      "Workspace access inspection is not permitted for this identity.",
    );
  if (await loadWorkingCompany(c, p))
    throw new AppError(
      409,
      "WorkingCompanySelected",
      "Clear your working company in the account panel to inspect workspace access.",
    );
}

const personColumns = `u.id, CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name
  ELSE 'Hosted identity (masked)' END AS display_name, u.active,
  u.issuer<>'PPO-LocalSynthetic' AS masked`;

// Inactive identity takes precedence over grant dates, as in person inspection.
// A current grant is not a claim of effective access to a business record.
const grantState = `CASE WHEN NOT u.active THEN 'Inactive identity'
  WHEN g.valid_from>statement_timestamp() THEN 'Scheduled'
  WHEN g.valid_to IS NOT NULL AND g.valid_to<=statement_timestamp() THEN 'Expired'
  ELSE 'Current' END`;

export async function accessRoles(p: Principal) {
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    return { items: roleProposals };
  });
}

export async function compareAccessRole(
  p: Principal,
  id: string,
  input: Record<string, string>,
) {
  identifier(id);
  const company = identifier(input.company_id ?? "");
  const site = input.site_id ? identifier(input.site_id) : undefined;
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    const bundle = roleProposals.find((item) => item.id === input.bundle_id);
    const revision = bundle?.revisions.find(
      (item) => item.revision === input.revision,
    );
    if (!bundle || !revision)
      throw new AppError(
        422,
        "InvalidRoleProposal",
        "Choose an available proposed bundle and its exact source revision.",
      );
    const user = (
      await c.query(
        `SELECT ${personColumns} FROM ppo.users u WHERE u.workspace_id=$1 AND u.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!user)
      throw new AppError(404, "NotFound", "This identity is unavailable.");
    const companyRow = (
      await c.query(
        "SELECT id,display_name,erp_company_id FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, company],
      )
    ).rows[0];
    const siteRow = site
      ? (
          await c.query(
            "SELECT id,display_number,display_name FROM ppo.sites WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
            [p.workspace_id, company, site],
          )
        ).rows[0]
      : null;
    if (!companyRow || (site && !siteRow))
      throw new AppError(
        404,
        "NotFound",
        "This company or site is unavailable.",
      );
    const subject: Principal = {
      workspace_id: p.workspace_id,
      actor_id: id,
      display_name: user.display_name,
    };
    const working = await loadWorkingCompany(c, subject);
    const items = await withWorkingCompany(id, working, async () => {
      const results = [];
      // Bounded by the retained proposal (at most 14 capabilities). Reuse the
      // server rule at the requested scope; never match grants held elsewhere.
      for (const capability of revision.caps) {
        const allowed = await hasPermission(
          c,
          subject,
          capability,
          company,
          site,
        );
        results.push({
          capability,
          label: capabilityLabels[capability],
          allowed,
        });
      }
      return results;
    });
    await requireAccessInspection(c, p);
    return {
      person: user,
      bundle_id: bundle.id,
      bundle_name: bundle.name,
      revision: revision.revision,
      state: revision.state,
      company: companyRow,
      site: siteRow,
      items,
      matched: items.filter((item) => item.allowed).length,
      reason: !user.active
        ? "The identity is inactive."
        : working && working !== company
          ? "The person's selected working company excludes this company."
          : "Each result checks current grant validity and the selected company/site.",
      checked_at: new Date().toISOString(),
      limitation:
        "Comparison only: no role is assigned and no grant is changed. Missing capabilities are not a recommendation to grant access. Authentication, assignment, record state, source visibility and independent approval rules still apply.",
      authentication: user.masked
        ? "Hosted invitation and session validity have not been evaluated."
        : "An active synthetic session is still required.",
    };
  });
}

export async function accessCapabilities(
  p: Principal,
  input: Record<string, string> = {},
) {
  const search = (input.q ?? "").trim().toLowerCase();
  const domain = input.domain ?? "";
  if (
    search.length > 100 ||
    (domain && !capabilityCatalogue.some((item) => item.domain === domain))
  )
    throw new AppError(
      422,
      "InvalidFilter",
      "Use a search of up to 100 characters and an available domain.",
    );
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    const result = await c.query(
      `SELECT g.capability,count(*)::int AS recorded,
      count(*) FILTER (WHERE ${grantState}='Current')::int AS current
      FROM ppo.permission_grants g JOIN ppo.users u
        ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
      WHERE g.workspace_id=$1 GROUP BY g.capability`,
      [p.workspace_id],
    );
    const counts = new Map(result.rows.map((row) => [row.capability, row]));
    await requireAccessInspection(c, p);
    return {
      items: capabilityCatalogue
        .filter(
          (item) =>
            (!domain || item.domain === domain) &&
            (!search ||
              `${item.key} ${item.label}`.toLowerCase().includes(search)),
        )
        .map((item) => ({
          ...item,
          recorded: counts.get(item.key)?.recorded ?? 0,
          current: counts.get(item.key)?.current ?? 0,
        })),
      domains: [...new Set(capabilityCatalogue.map((item) => item.domain))],
      checked_at: new Date().toISOString(),
    };
  });
}

export async function accessCapability(
  p: Principal,
  key: string,
  input: Record<string, string> = {},
) {
  const scope = input.scope ?? "",
    state = input.state ?? "";
  const offset = Number(input.offset ?? "0");
  if (
    !["", "Workspace", "Company", "Site"].includes(scope) ||
    !["", "Current", "Scheduled", "Expired", "Inactive identity"].includes(
      state,
    )
  )
    throw new AppError(
      422,
      "InvalidFilter",
      "Choose an available scope and grant state.",
    );
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    throw new AppError(422, "InvalidPage", "Choose an available result page.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    if (!isCapability(key))
      throw new AppError(404, "NotFound", "This capability is unavailable.");
    const result = await c.query(
      `SELECT g.id,g.user_id,g.scope_type,g.company_id,g.site_id,
        g.valid_from,g.valid_to,${grantState} AS state,
        CASE WHEN u.issuer='PPO-LocalSynthetic' THEN u.display_name ELSE 'Hosted identity (masked)' END AS display_name,
        u.issuer<>'PPO-LocalSynthetic' AS masked,
        co.display_name AS company_name,co.erp_company_id,
        s.display_number AS site_number,s.display_name AS site_name
      FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
      LEFT JOIN ppo.companies co ON (co.workspace_id,co.id)=(g.workspace_id,g.company_id)
      LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(g.workspace_id,g.site_id)
      WHERE g.workspace_id=$1 AND g.capability=$2
        AND ($3='' OR g.scope_type=$3) AND ($4='' OR ${grantState}=$4)
      ORDER BY display_name,g.user_id,g.scope_type,g.id LIMIT 51 OFFSET $5`,
      [p.workspace_id, key, scope, state, offset],
    );
    await requireAccessInspection(c, p);
    return {
      capability: capabilityCatalogue.find((item) => item.key === key)!,
      items: result.rows.slice(0, 50),
      has_more: result.rows.length > 50,
      offset,
      checked_at: new Date().toISOString(),
    };
  });
}

export async function accessPeople(
  p: Principal,
  input: Record<string, string> = {},
) {
  const search = (input.q ?? "").trim();
  if (
    search.length > 100 ||
    !["", "active", "inactive"].includes(input.state ?? "")
  )
    throw new AppError(
      422,
      "InvalidFilter",
      "Use a search of up to 100 characters and an available status.",
    );
  const offset = Number(input.offset ?? "0");
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    throw new AppError(422, "InvalidPage", "Choose an available result page.");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    const rows = await c.query(
      `SELECT ${personColumns},
        (SELECT count(*)::int FROM ppo.permission_grants g
          WHERE (g.workspace_id,g.user_id)=(u.workspace_id,u.id)) AS grant_count
       FROM ppo.users u WHERE u.workspace_id=$1
         AND ($2='' OR position(lower($2) in lower(CASE WHEN u.issuer='PPO-LocalSynthetic'
           THEN u.display_name ELSE 'Hosted identity (masked)' END))>0)
         AND ($3='' OR u.active=($3='active'))
       ORDER BY display_name,u.id LIMIT 51 OFFSET $4`,
      [p.workspace_id, search, input.state ?? "", offset],
    );
    await requireAccessInspection(c, p);
    return {
      items: rows.rows.slice(0, 50),
      has_more: rows.rows.length > 50,
      offset,
    };
  });
}

export async function accessPerson(p: Principal, id: string) {
  identifier(id);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    const person = (
      await c.query(
        `SELECT ${personColumns} FROM ppo.users u WHERE u.workspace_id=$1 AND u.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!person)
      throw new AppError(404, "NotFound", "This identity is unavailable.");
    const grants = await c.query(
      `SELECT g.id,g.capability,g.scope_type,g.company_id,g.site_id,g.valid_from,g.valid_to,
         co.display_name AS company_name,co.erp_company_id,
         s.display_number AS site_number,s.display_name AS site_name,
         CASE WHEN NOT u.active THEN 'Inactive identity'
           WHEN g.valid_from>clock_timestamp() THEN 'Scheduled'
           WHEN g.valid_to IS NOT NULL AND g.valid_to<=clock_timestamp() THEN 'Expired'
           ELSE 'Current' END AS state
       FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
       LEFT JOIN ppo.companies co ON (co.workspace_id,co.id)=(g.workspace_id,g.company_id)
       LEFT JOIN ppo.sites s ON (s.workspace_id,s.id)=(g.workspace_id,g.site_id)
       WHERE g.workspace_id=$1 AND g.user_id=$2 ORDER BY g.capability,g.scope_type,g.id`,
      [p.workspace_id, id],
    );
    const companies = (
      await c.query(
        "SELECT id,display_name,erp_company_id FROM ppo.companies WHERE workspace_id=$1 ORDER BY erp_company_id,id",
        [p.workspace_id],
      )
    ).rows;
    const sites = (
      await c.query(
        "SELECT id,company_id,display_number,display_name FROM ppo.sites WHERE workspace_id=$1 ORDER BY display_number,id",
        [p.workspace_id],
      )
    ).rows;
    await requireAccessInspection(c, p);
    return { person, grants: grants.rows, companies, sites };
  });
}

export async function explainAccess(
  p: Principal,
  id: string,
  input: Record<string, string>,
) {
  identifier(id);
  const company = identifier(input.company_id ?? "");
  const site = input.site_id ? identifier(input.site_id) : undefined;
  const capability = input.capability ?? "";
  if (!/^[a-z][a-z_.]{1,100}$/.test(capability))
    throw new AppError(
      422,
      "InvalidCapability",
      "Enter a capability key such as shared.read.",
    );
  return transaction(async (c) => {
    await c.query("SET TRANSACTION READ ONLY");
    await requireAccessInspection(c, p);
    const user = (
      await c.query(
        `SELECT ${personColumns} FROM ppo.users u WHERE u.workspace_id=$1 AND u.id=$2`,
        [p.workspace_id, id],
      )
    ).rows[0];
    if (!user)
      throw new AppError(404, "NotFound", "This identity is unavailable.");
    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, company],
        )
      ).rowCount ||
      (site &&
        !(
          await c.query(
            "SELECT 1 FROM ppo.sites WHERE workspace_id=$1 AND company_id=$2 AND id=$3",
            [p.workspace_id, company, site],
          )
        ).rowCount)
    )
      throw new AppError(
        404,
        "NotFound",
        "This company or site is unavailable.",
      );
    const subject: Principal = {
      workspace_id: p.workspace_id,
      actor_id: id,
      display_name: user.display_name,
    };
    const working = await loadWorkingCompany(c, subject);
    const allowed = await withWorkingCompany(id, working, () =>
      hasPermission(c, subject, capability as Capability, company, site),
    );
    const reason = !user.active
      ? "The identity is inactive."
      : working && working !== company
        ? "The person's selected working company excludes this company."
        : allowed
          ? "A current grant covers this capability and company/site."
          : "No current grant covers this capability and company/site. Check scope, start and expiry.";
    await requireAccessInspection(c, p);
    return {
      capability,
      company_id: company,
      site_id: site ?? null,
      allowed,
      reason,
      checked_at: new Date().toISOString(),
      limitation:
        "Grant eligibility only. Authentication, assignment, record state, source visibility and independent approval rules still apply.",
      authentication: user.masked
        ? "Hosted invitation and session validity have not been evaluated."
        : "An active synthetic session is still required.",
    };
  });
}
