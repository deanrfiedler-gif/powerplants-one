import { randomUUID } from "node:crypto";
import { database } from "../../src/platform/database";
import { createSession, type Principal } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { createTicket } from "../../src/service/intake";
import { createWorkOrder } from "../../src/service/work-orders";
import { createProject } from "../../src/projects/service";
import { createActivity } from "../../src/activities/activities";
import { CRM, crmCreate, crmBase } from "./crm";
import { estimateInput, quoteCommand } from "./estimating";
import { projectInput } from "./projects";
import { insert } from "../../src/documents/packs";
import { observeAccount } from "../../src/finance/accounts";

export async function customer360Fixture(count = 8) {
  const c = database(),
    broad = (await createSession("coordinator")).principal;
  const otherSite = "70000000-0000-4000-8000-000000000002";
  // Explicit synthetic relationship, shared customer with two distinct sites.
  await c.query(
    `INSERT INTO ppo.site_parties(id,workspace_id,company_id,site_id,organisation_id,role,valid_from,created_by,updated_by)
    SELECT gen_random_uuid(),$1,$2,$3,$4,'Owner','2026-01-01',$5,$5 WHERE NOT EXISTS(SELECT 1 FROM ppo.site_parties WHERE workspace_id=$1 AND site_id=$3 AND organisation_id=$4 AND role='Owner')`,
    [CRM.workspace, CRM.company, otherSite, CRM.org, broad.actor_id],
  );
  const deals: string[] = [],
    estimates: string[] = [],
    quotes: string[] = [],
    projects: string[] = [],
    activities: string[] = [];
  async function createRecords(i: number) {
    const site = i % 2 ? otherSite : CRM.site;
    const deal = {
      ...crmCreate(),
      site_id: site,
      primary_person_id: null,
      contact_unknown_reason: "SYN contact not established",
      title: `SYN Customer 360 batch ${i}`,
    };
    await createOpportunity(broad, deal);
    const estimate = estimateInput(deal.id);
    await createEstimate(broad, estimate);
    const saved = await readEstimate(broad, estimate.id);
    const quote = quoteCommand(saved.saved);
    await prepareQuote(broad, estimate.id, quote);
    const project = { ...projectInput(), site_id: site };
    await createProject(broad, project);
    const activity = {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      site_id: site,
      kind: "CustomerContact",
      owner_id: broad.actor_id,
      summary: `SYN Customer 360 activity ${i}`,
      due_at: null,
      due_needed: true,
      access_class: "RestrictedService",
      links: [
        { object_type: "Organisation", object_id: CRM.org },
        { object_type: "Site", object_id: site },
      ],
    };
    await createActivity(broad, activity);
    deals[i] = deal.id;
    estimates[i] = estimate.id;
    quotes[i] = quote.id;
    projects[i] = project.id;
    activities[i] = activity.id;
  }
  // Independent native command chains, bounded below the pool limit. Keep
  // every record and assertion while avoiding serial setup of the 101-row proof.
  for (let offset = 0; offset < count; offset += 4) {
    const results = await Promise.allSettled(
      Array.from({ length: Math.min(4, count - offset) }, (_, i) =>
        createRecords(offset + i),
      ),
    );
    for (const result of results)
      if (result.status === "rejected") throw result.reason;
  }
  for (const site of [CRM.site, otherSite]) {
    const ticket_id = randomUUID();
    await createTicket(broad, {
      ...crmBase(),
      id: ticket_id,
      company_id: CRM.company,
      summary: "SYN Customer 360 site request",
      symptom: "SYN inspect controller",
      received_at: "2026-09-04T00:00:00Z",
      channel: "Manual",
      requester_id: null,
      requester_description: "SYN caller identity unconfirmed",
      site_id: site,
      site_identification_needed: false,
      asset_id: null,
      impact: "Monitoring",
      priority: "Normal",
      priority_reason: null,
      triage_owner_id: broad.actor_id,
      next_action: "SYN inspect before intervening",
    });
    await createWorkOrder(broad, {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      site_id: site,
      customer_id: CRM.org,
      service_owner_id: broad.actor_id,
      tickets: [{ ticket_id, issue_disposition: "SYN customer read proof" }],
    });
  }
  async function reader(
    label: string,
    restricted: boolean,
  ): Promise<Principal> {
    const actor_id = randomUUID();
    await c.query(
      "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,$3)",
      [actor_id, CRM.workspace, `SYN ${label}`],
    );
    await c.query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from)
      SELECT workspace_id,$2,company_id,capability,
      CASE WHEN $4 AND capability IN ('shared.read','shared.edit') THEN 'Site' ELSE scope_type END,
      CASE WHEN $4 AND capability IN ('shared.read','shared.edit') THEN $5::uuid ELSE scope_id END,
      CASE WHEN $4 AND capability IN ('shared.read','shared.edit') THEN $5::uuid ELSE site_id END,valid_from
      FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$3 AND valid_to IS NULL`,
      [CRM.workspace, actor_id, broad.actor_id, restricted, CRM.site],
    );
    return { ...broad, actor_id };
  }
  const siteOnly = await reader("one-site customer reader", true),
    expired = await reader("expired quotation reader", false);
  await c.query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 day' WHERE user_id=$1 AND capability IN ('estimating.quote.read','project.read')",
    [expired.actor_id],
  );
  // Other-company data is created through its own native owner and authority.
  const other = (await createSession("second-company")).principal;
  const otherDeal = {
    ...crmCreate(),
    company_id: CRM.companyB,
    organisation_id: CRM.orgB,
    site_id: null,
    site_unknown_reason: "SYN site unknown",
    primary_person_id: null,
    contact_unknown_reason: "SYN contact unknown",
    owner_id: other.actor_id,
    initial_action: { ...crmCreate().initial_action, owner_id: other.actor_id },
  };
  await createOpportunity(other, otherDeal);
  return {
    broad,
    siteOnly,
    expired,
    other,
    otherDeal: otherDeal.id,
    deals,
    estimates,
    quotes,
    projects,
    activities,
  };
}

// Kept separate so the existing authority and performance fixtures are unchanged.
export async function customer360FinanceFixture() {
  const c = database(),
    actor_id = randomUUID(),
    principal = { workspace_id: CRM.workspace, actor_id } as Principal;
  await c.query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN Customer 360 Finance reader')",
    [actor_id, CRM.workspace],
  );
  for (const capability of ["shared.read", "finance.account.read", "shared.finance.read"])
    await c.query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from)
       VALUES($1,$2,$3,$4,'Company',$3,'2026-01-01')`,
      [CRM.workspace, actor_id, CRM.company, capability],
    );
  const company = (await c.query(
    "SELECT erp_connection_id,erp_company_id FROM ppo.companies WHERE workspace_id=$1 AND id=$2",
    [CRM.workspace, CRM.company],
  )).rows[0];
  const accounts: string[] = [], mappings: string[] = [];
  for (const label of ["current", "stale"]) {
    const mapping = await insert(c, "erp_account_mappings", {
      id: randomUUID(), workspace_id: CRM.workspace, company_id: CRM.company,
      organisation_id: CRM.org, ...company, entity_type: "Customer",
      customer_id: `SYN-C360-${label}-${randomUUID()}`, mapping_status: "Proposed",
      valid_from: "2026-01-01", created_by: actor_id, updated_by: actor_id,
    });
    const account = await insert(c, "finance_accounts", {
      id: randomUUID(), workspace_id: CRM.workspace, company_id: CRM.company,
      organisation_id: CRM.org, mapping_id: mapping.id, mapping_version: mapping.version,
      mapping_snapshot: mapping, verification_basis: "SYN Customer 360 equality proof only",
      currency: "AUD", fixture_key: `SYN-C360-${label}-${randomUUID()}`,
      created_by: actor_id, updated_by: actor_id,
    });
    // Distinct retained observations exercise current, last-good and history reads.
    await observeAccount(principal, account.id, { ...crmBase(), expected_version: 1, fixture: "F-01" });
    await observeAccount(principal, account.id, { ...crmBase(), expected_version: 2, fixture: "F-03" });
    accounts.push(account.id);
    mappings.push(mapping.id);
  }
  // Keep the version equal: the stale case must fail the exact snapshot hash.
  await c.query(
    "UPDATE ppo.erp_account_mappings SET customer_id=customer_id||'-STALE' WHERE workspace_id=$1 AND id=$2",
    [CRM.workspace, mappings[1]],
  );
  return { principal, currentAccount: accounts[0], staleAccount: accounts[1] };
}
