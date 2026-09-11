import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createOpportunity } from "../../src/crm/opportunities";
import { listOpportunities } from "../../src/crm/worklist";
import { opportunityOptions } from "../../src/crm/reads";
import { customerContext } from "../../src/shared/reads";
import { createOrganisation } from "../../src/shared/commands";
import { createEstimate, prepareQuote } from "../../src/estimating/service";
import { opportunityCommercial, readEstimate } from "../../src/estimating/reads";
import { CRM, crmCreate, crmBase } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset); after(closeDatabase);
const principal = async (profile = "coordinator") => (await createSession(profile)).principal;

test("mobile projections preserve contact identity, exact commercial links and separate estimating permission", async () => {
  const p=await principal(), input=crmCreate(); await createOpportunity(p,input);
  const card=(await listOpportunities(p)).items.find(i=>i.id===input.id)!;
  assert.equal(card.primary_person_id,CRM.person); assert.ok(card.contact_name);
  const estimate=estimateInput(input.id); await createEstimate(p,estimate);
  const d=await readEstimate(p,estimate.id), quote=quoteCommand(d.saved); await prepareQuote(p,estimate.id,quote);
  const commercial=await opportunityCommercial(p,input.id);
  assert.equal(commercial.estimate?.id,estimate.id);
  assert.equal(commercial.estimate?.sell_total,d.saved.sell_total);
  assert.equal(commercial.quotes[0].id,quote.id);
  assert.equal(commercial.can_create,false);
  await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.read'",[p.actor_id]);
  assert.ok((await listOpportunities(p)).items.some(i=>i.id===input.id));
  await assert.rejects(opportunityCommercial(p,input.id));
});

test("live organisation search covers records beyond its first page and binds cursors to the search", async () => {
  const p=await principal();
  for(let i=0;i<22;i++) await createOrganisation(p,{...crmBase(),id:randomUUID(),company_id:CRM.company,display_name:`SYN Lookup orchard ${i}`,relationship_status:"Prospect",owner_id:CRM.owner});
  const q={kind:"Organisation",company_id:CRM.company,q:"SYN Lookup orchard",limit:5};
  const first=await opportunityOptions(p,q); assert.equal(first.items.length,5); assert.ok(first.next_cursor);
  const second=await opportunityOptions(p,{...q,cursor:first.next_cursor});
  assert.equal(new Set([...first.items,...second.items].map(i=>i.id)).size,10);
  const last=await opportunityOptions(p,{...q,q:"SYN Lookup orchard 21"});assert.equal(last.items.length,1);
  const byReference=await opportunityOptions(p,{...q,q:last.items[0].display_number});assert.equal(byReference.items[0].id,last.items[0].id);
  await assert.rejects(opportunityOptions(p,{...q,q:"Changed",cursor:first.next_cursor}));
  const other=await principal("second-company"); await assert.rejects(opportunityOptions(other,q));
});

test("organisation counts equal distinct permitted sites and facilities nested under their actual site", async () => {
  for(const profile of ["coordinator","site-observer"]) {
    const p=await principal(profile),org=await customerContext(p,CRM.org);
    assert.equal(org.site_summary.sites,org.sites.length);
    const facilities=org.sites.flatMap(s=>s.facilities.items);
    assert.equal(org.site_summary.facilities,new Set(facilities.map(f=>f.id)).size);
    for(const site of org.sites) for(const facility of site.facilities.items) assert.equal(facility.site_id,site.id);
    if(profile==="site-observer") assert.ok(org.sites.every(s=>s.id===CRM.site));
  }
  await assert.rejects(customerContext(await principal("systems"),CRM.org));
});
