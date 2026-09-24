import assert from "node:assert/strict";
import { supplySeedIdentities } from "./supply-seed-identities";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { database, transaction } from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { editDealInformation } from "../../src/crm/refinements";
import { createEstimate, saveEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate, listEstimates, readQuote, opportunityCommercial } from "../../src/estimating/reads";
import { adoptDiscoveryCosting, previewDiscoveryCosting } from "../../src/estimating/cost-basis-service";
import { createDiscoveryWorkspace, readDiscoveryWorkspace, readDiscoveryRevision, listDiscoveryWorkspaces } from "../../src/estimating/discovery-workspaces";
import { readQuoteJob, runQuoteJob, draftBytes } from "../../src/estimating/worker";
import { readOperation } from "../../src/shared/receipts";
import { readShared } from "../../src/shared/reads";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
import { discoveryInput } from "../helpers/estimating-discovery";
import { discoveryCostSetup, manualCostCommand, costed, reviseCostDiscovery, selectCostOption } from "../helpers/estimating-cost-basis";
// Registered once by the existing estimating DB entrypoint; it owns the
// disposable guard, beforeEach(reset) and after(closeDatabase) lifecycle.
export function registerDiscoveryCostBasisTests() {
const rows=async(q:string,v:unknown[]=[])=> (await database().query(q,v)).rows;
const code=(name:string)=>(e:unknown)=>(e as {code:string}).code===name;
const tables=["estimates","estimate_versions","estimate_discovery_roots","estimate_discovery_bases","estimating_workspaces","estimating_options","estimation_revisions","draft_quotes","draft_quote_revisions","business_identities","audit_events","operation_receipts","outbox_jobs","opportunities"];
const snapshot=()=>Promise.all(tables.map(t=>rows(`SELECT to_jsonb(t) AS v FROM ppo.${t} t ORDER BY to_jsonb(t)::text`)));
test("E2 cost basis creates one exact option estimate across identical races and retains one atomic original",async()=>{
  const s=await discoveryCostSetup(),input=await manualCostCommand(s),results=await Promise.all([adoptDiscoveryCosting(s.p,s.input.id,input),adoptDiscoveryCosting(s.p,s.input.id,input)]);
  assert.deepEqual(results[0].receipt,results[1].receipt);assert.equal(results.filter(r=>r.replayed).length,1);
  const e=await readEstimate(s.p,input.estimate_id),g=await readDiscoveryWorkspace(s.p,s.input.id);
  assert.equal(e.option_id,s.input.option_id);assert.equal(e.discovery_basis!.revision_id,s.input.revision_id);assert.equal(e.saved.discovery_basis!.scope_snapshot_id,g.options[0].revision.scope_snapshot_id);
  assert.equal(e.saved.discovery_basis!.answer_snapshot_id,g.options[0].revision.answer_snapshot_id);assert.equal(e.saved.discovery_basis!.content_hash,g.options[0].revision.content_hash);
  assert.equal(e.totals.sell,"720.00");assert.equal(g.workspace.legacy_estimate_id,null);assert.equal(e.saved.cost_schema_version,2);
  assert.deepEqual(await readOperation(s.p,input.operation_id),results[0].receipt);
  for(const table of ["audit_events","outbox_jobs","operation_receipts"])assert.equal((await rows(`SELECT count(*)::int n FROM ppo.${table} WHERE operation_id=$1`,[input.operation_id]))[0].n,1);
  await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,{...input,title:"Changed original"}),code("OperationConflict"));
  await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,{...input,...crmBase(),estimate_id:randomUUID()}),code("VersionConflict"));
  const a=(await rows("SELECT details FROM ppo.audit_events WHERE operation_id=$1",[input.operation_id]))[0].details;
  assert.equal(a.saved_version_id,e.saved.id);assert.equal(a.scope_snapshot_id,g.options[0].revision.scope_snapshot_id);
  assert.equal((await rows("SELECT version FROM ppo.opportunities WHERE id=$1",[s.o.id]))[0].version,1);
});
test("E2 alternatives cost separately; selection never switches the stable CRM primary or mutates old quotes",async()=>{
  const s=await costed(await discoveryCostSetup()),original=await opportunityCommercial(s.p,s.o.id);
  const q=quoteCommand(s.estimate.saved);await prepareQuote(s.p,s.estimate.id,q);const originalQuote=(await readQuoteJob(s.p,q.id)).q;
  const branch=await reviseCostDiscovery(s,discoveryInput(),true);
  await assert.rejects(previewDiscoveryCosting(s.p,s.input.id,{option_id:branch.new_option_id,revision_id:branch.revision_id}),code("DiscoveryRevisionChanged"));
  await selectCostOption(s,branch.new_option_id!);
  const next=await manualCostCommand(s);next.lines=next.lines.map(l=>({...l,quantity:"1"}));await adoptDiscoveryCosting(s.p,s.input.id,next);
  assert.notEqual(next.estimate_id,s.estimate.id);const commercial=await opportunityCommercial(s.p,s.o.id);
  assert.deepEqual(commercial.estimate,original.estimate);assert.equal(commercial.estimates!.length,2);
  assert.deepEqual(commercial.estimates!.map(e=>e.discovery_basis!.option_label),["A","B"]);
  assert.equal((await listEstimates(s.p,{})).items.filter(e=>[s.estimate.id,next.estimate_id].includes(e.id)).length,2);
  assert.deepEqual((await readQuoteJob(s.p,q.id)).q,originalQuote);
  await selectCostOption(s,s.input.option_id,"Archive");
  assert.deepEqual(await readOperation(s.p,s.command.operation_id),s.accepted.receipt);
  await assert.rejects(saveEstimate(s.p,s.estimate.id,{...crmBase(),schema_version:2,expected_version:1,title:s.command.title,scope:s.command.scope,lines:s.command.lines,policy:s.command.policy}),code("OptionArchived"));
});
test("E2 incomplete successors hold adoption while ordinary manual saves inherit the exact accepted scope",async()=>{
  const s=await costed(await discoveryCostSetup()),incomplete=discoveryInput();
  incomplete.answers[0]={...incomplete.answers[0],state:"Answered",follow_up:{owner_id:s.p.actor_id,reason:"SYN confirm changed scope"}};
  const r=await reviseCostDiscovery(s,incomplete);
  await assert.rejects(previewDiscoveryCosting(s.p,s.input.id,{option_id:s.input.option_id,revision_id:r.revision_id}),code("DiscoveryScopeIncomplete"));
  const before=await snapshot();
  await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,{...s.command,...crmBase(),revision_id:r.revision_id,expected_workspace_version:2,expected_estimate_version:1}),code("DiscoveryScopeIncomplete"));
  assert.deepEqual(await snapshot(),before);
  const manual={...crmBase(),schema_version:2,expected_version:1,title:"SYN reviewed manual price",scope:s.command.scope,lines:s.command.lines,policy:s.command.policy};
  await saveEstimate(s.p,s.estimate.id,manual);const e=await readEstimate(s.p,s.estimate.id);
  assert.equal(e.version,2);assert.deepEqual(e.saved.discovery_basis,s.estimate.saved.discovery_basis);assert.equal(e.latest_discovery!.scope_readiness,"Incomplete");
  await reviseCostDiscovery(s);const adopt=await manualCostCommand(s);
  const contenders=[adopt,{...adopt,...crmBase()}],results=await Promise.allSettled(contenders.map(input=>adoptDiscoveryCosting(s.p,s.input.id,input)));
  assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(results.filter(r=>r.status==="rejected"&&code("VersionConflict")(r.reason)).length,1);
  const final=await readEstimate(s.p,s.estimate.id);assert.equal(final.version,3);assert.equal(final.saved.discovery_basis!.revision,3);
  assert.deepEqual((await readEstimate(s.p,s.estimate.id,{version_id:s.estimate.saved.id})).saved,s.estimate.saved);
});
test("E2 version Site controls saved context, exact quote output and historical receipt authority after current scope changes",async()=>{
  const site2="70000000-0000-4000-8000-000000000002";
  await rows("INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'BillingParty','2026-01-01')",[randomUUID(),CRM.workspace,CRM.owner,CRM.company,site2,CRM.org]);
  const discovery=discoveryInput();discovery.scope={...discovery.scope,site_id:site2,facility_ids:[],equipment_ids:[],systems:[{tag:"ProductSupply",facility_ids:[]}]};
  const s=await costed(await discoveryCostSetup(discovery)),q1=quoteCommand(s.estimate.saved);await prepareQuote(s.p,s.estimate.id,q1);
  await runQuoteJob((await readQuoteJob(s.p,q1.id)).j.id);const bytes=await draftBytes(s.p,q1.id),original=(await readQuoteJob(s.p,q1.id)).q;
  assert.equal(original.safe_snapshot.site,s.estimate.context.site);
  await reviseCostDiscovery(s);const command=await manualCostCommand(s);await adoptDiscoveryCosting(s.p,s.input.id,command);
  const current=await readEstimate(s.p,s.estimate.id),q2=quoteCommand(current.saved,2,1);await prepareQuote(s.p,current.id,q2);
  assert.equal(current.site_id,CRM.site);assert.equal(current.saved.discovery_basis!.site_id,CRM.site);
  assert.equal((await rows("SELECT site_id FROM ppo.estimates WHERE id=$1",[current.id]))[0].site_id,site2);
  assert.equal((await readQuote(s.p,q2.id)).snapshot.site,current.context.site);assert.notEqual(current.context.site,s.estimate.context.site);
  assert.deepEqual(await draftBytes(s.p,q1.id),bytes);assert.deepEqual((await readQuoteJob(s.p,q1.id)).q,original);
  for(const cap of ["estimating.read","estimating.edit","estimating.quote.read","estimating.quote.prepare"]){
    await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability=$2",[s.p.actor_id,cap]);
    await rows("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) VALUES($1,$2,$3,$4,'Site',$5,$5,'2026-01-01')",[CRM.workspace,s.p.actor_id,CRM.company,cap,CRM.site]);
  }
  const permitted=await readEstimate(s.p,current.id);assert.equal(permitted.versions.length,1);assert.equal(permitted.quotes.length,1);
  assert.equal((await readQuote(s.p,q2.id)).snapshot.site,current.context.site);
  await assert.rejects(readEstimate(s.p,current.id,{version_id:s.estimate.saved.id}),code("RecordUnavailable"));
  await assert.rejects(readOperation(s.p,s.command.operation_id),code("RecordUnavailable"));
  await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,s.command),code("RecordUnavailable"));
  await assert.rejects(readQuote(s.p,q1.id),code("RecordUnavailable"));await assert.rejects(draftBytes(s.p,q1.id),code("RecordUnavailable"));
});
test("E2 safe draft readers do not acquire internal cost access and source revocation refuses exact recovery",async()=>{
  const s=await costed(await discoveryCostSetup()),q=quoteCommand(s.estimate.saved);await prepareQuote(s.p,s.estimate.id,q);
  const observer=(await createSession("observer")).principal;
  for(const capability of ["crm.opportunity.read","shared.internal.read","estimating.quote.read"])await rows("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,valid_from) VALUES($1,$2,$3,$4,'Company',$3,'2026-01-01') ON CONFLICT DO NOTHING",[CRM.workspace,observer.actor_id,CRM.company,capability]);
  const safe=await readQuote(observer,q.id);assert.equal(safe.snapshot.total,"720.00");assert.equal(safe.estimate_id,undefined);
  assert.doesNotMatch(JSON.stringify(safe),/unit_cost|cost_total|private supplier|scope_snapshot_id|answer_snapshot_id/);
  await assert.rejects(readEstimate(observer,s.estimate.id),code("RecordUnavailable"));
  await rows("UPDATE ppo.site_parties SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3",[CRM.workspace,CRM.site,CRM.org]);
  await assert.rejects(readQuote(observer,q.id),code("RecordUnavailable"));
});
test("E2 retained contact visibility protects history and exact recovery after the current CRM contact changes",async()=>{
  const s=await costed(await discoveryCostSetup()),q=quoteCommand(s.estimate.saved);
  await prepareQuote(s.p,s.estimate.id,q);await runQuoteJob((await readQuoteJob(s.p,q.id)).j.id);
  const originalRevision=await readDiscoveryRevision(s.p,s.input.id,s.input.revision_id),
    originalCreation=await readOperation(s.p,s.input.operation_id),
    originalQuote=(await readQuoteJob(s.p,q.id)).q,bytes=await draftBytes(s.p,q.id);
  assert.equal(originalRevision.observed_context!.contact!.id,CRM.person);
  // Disposable fixture: add a legitimate new contact, then use the real CRM
  // command to change the deal. The original revision still captures Avery.
  const nextContact=randomUUID();
  await rows("INSERT INTO ppo.people(id,workspace_id,created_by,updated_by,display_name) VALUES($1,$2,$3,$3,'SYN Replacement contact')",[nextContact,CRM.workspace,s.p.actor_id]);
  await rows("INSERT INTO ppo.person_company_contexts(workspace_id,company_id,person_id) VALUES($1,$2,$3)",[CRM.workspace,CRM.company,nextContact]);
  await rows("INSERT INTO ppo.relationships(id,workspace_id,created_by,updated_by,company_id,organisation_id,person_id,role_label,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'SYN replacement contact','2026-01-01')",[randomUUID(),CRM.workspace,s.p.actor_id,CRM.company,CRM.org,nextContact]);
  await editDealInformation(s.p,s.o.id,{...crmBase(),expected_version:1,title:s.o.title,primary_person_id:nextContact,contact_unknown_reason:null,value_amount:null,expected_close_date:null});
  await rows("UPDATE ppo.sites SET primary_contact_id=$2,version=version+1 WHERE id=$1",[CRM.site,nextContact]);
  // A live label/version change is not evidence corruption. Authorised history
  // and original command recovery retain the exact accepted content.
  const assertOriginals=async()=>{
    assert.deepEqual(await readDiscoveryRevision(s.p,s.input.id,s.input.revision_id),originalRevision);
    assert.deepEqual((await readDiscoveryWorkspace(s.p,s.input.id)).options[0].revision,originalRevision);
    assert.deepEqual(await readOperation(s.p,s.input.operation_id),originalCreation);
    assert.deepEqual((await createDiscoveryWorkspace(s.p,s.input)).receipt,originalCreation);
    assert.deepEqual(await readOperation(s.p,s.command.operation_id),s.accepted.receipt);
    assert.deepEqual((await adoptDiscoveryCosting(s.p,s.input.id,s.command)).receipt,s.accepted.receipt);
    assert.deepEqual((await readEstimate(s.p,s.estimate.id)).saved,s.estimate.saved);
    assert.deepEqual((await readQuoteJob(s.p,q.id)).q,originalQuote);
    assert.deepEqual(await draftBytes(s.p,q.id),bytes);
  };
  await assertOriginals();
  // The same actor retains this Site, CRM and estimating capabilities. Only
  // shared visibility narrows; the current contact is visible and Avery is not.
  await rows("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read'",[s.p.actor_id]);
  await rows("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) VALUES($1,$2,$3,'shared.read','Site',$4,$4,'2026-01-01')",[CRM.workspace,s.p.actor_id,CRM.company,CRM.site]);
  assert.equal((await readShared(s.p,"Person",nextContact)).id,nextContact);
  assert.equal((await readShared(s.p,"Site",CRM.site)).id,CRM.site);
  await assert.rejects(readShared(s.p,"Person",CRM.person),code("RecordUnavailable"));
  const before=await snapshot();
  for(const attempt of [
    ()=>readDiscoveryRevision(s.p,s.input.id,s.input.revision_id),
    ()=>readDiscoveryWorkspace(s.p,s.input.id),
    ()=>readOperation(s.p,s.input.operation_id),
    ()=>createDiscoveryWorkspace(s.p,s.input),
    ()=>readOperation(s.p,s.command.operation_id),
    ()=>adoptDiscoveryCosting(s.p,s.input.id,s.command),
    ()=>readEstimate(s.p,s.estimate.id,{version_id:s.estimate.saved.id}),
    ()=>readQuote(s.p,q.id),
    ()=>prepareQuote(s.p,s.estimate.id,q),
    ()=>draftBytes(s.p,q.id),
  ])await assert.rejects(attempt,code("RecordUnavailable"));
  assert.equal((await listDiscoveryWorkspaces(s.p,{opportunity_id:s.o.id})).items.length,0);
  assert.equal((await listEstimates(s.p,{})).items.some(e=>e.id===s.estimate.id),false);
  assert.deepEqual(await snapshot(),before);
  // Explicit fixture restoration proves denied recovery never rewrites or
  // refreshes stored labels, version bindings, receipts or Draft bytes.
  assert.equal((await rows("UPDATE ppo.permission_grants SET valid_to=NULL WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.read' AND scope_type='Company' AND scope_id=$3 RETURNING id",[CRM.workspace,s.p.actor_id,CRM.company])).length,1);
  await assertOriginals();assert.deepEqual(await snapshot(),before);
});
test("E2 graph guards refuse missing, cross-option and mutable bases without accepting partial cost versions",async()=>{
  const s=await costed(await discoveryCostSetup()),base=(await rows("SELECT to_jsonb(v) value FROM ppo.estimate_versions v WHERE id=$1",[s.estimate.saved.id]))[0].value;
  const branch=await reviseCostDiscovery(s,discoveryInput(),true);
  for(const revision of [null,branch.revision_id]){
    const before=await snapshot();
    await assert.rejects(transaction(async c=>{
      const id=randomUUID();await c.query("UPDATE ppo.estimates SET version=2,current_version_id=$2 WHERE id=$1",[s.estimate.id,id]);
      const v={...base,id,version:2,predecessor_id:base.id,scope_revision_id:randomUUID()};
      await c.query("INSERT INTO ppo.estimate_versions SELECT (jsonb_populate_record(NULL::ppo.estimate_versions,$1::jsonb)).*",[JSON.stringify(v)]);
      if(revision)await c.query("INSERT INTO ppo.estimate_discovery_bases VALUES($1,$2,$3,$4,$5)",[CRM.workspace,CRM.company,s.estimate.id,id,revision]);
    }),code("23514"));assert.deepEqual(await snapshot(),before);
  }
  for(const table of ["estimate_discovery_roots","estimate_discovery_bases"]){
    await assert.rejects(rows(`DELETE FROM ppo.${table} WHERE estimate_id=$1`,[s.estimate.id]),code("55000"));
    await assert.rejects(rows(`UPDATE ppo.${table} SET estimate_id=estimate_id WHERE estimate_id=$1`,[s.estimate.id]),code("55000"));
  }
});
test("E2 adoption rolls back every root, cost, receipt and outbox row when recording the original fails",async()=>{
  const s=await discoveryCostSetup(),input=await manualCostCommand(s);
  for(const table of ["audit_events","operation_receipts","outbox_jobs"]){
    const before=await snapshot();
    await rows(`CREATE FUNCTION ppo.test_reject_cost_basis() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.operation_id='${input.operation_id}'::uuid THEN RAISE EXCEPTION 'SYN injected transaction failure'; END IF; RETURN NEW; END $$`);
    await rows(`CREATE TRIGGER test_reject_cost_basis BEFORE INSERT ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.test_reject_cost_basis()`);
    try{await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,input),code("P0001"));}
    finally{await rows(`DROP TRIGGER test_reject_cost_basis ON ppo.${table}`);await rows("DROP FUNCTION ppo.test_reject_cost_basis()");}
    assert.deepEqual(await snapshot(),before);
  }
  await rows("UPDATE ppo.facilities SET name='SYN changed context',version=version+1 WHERE id=$1",[s.input.discovery.scope.facility_ids[0]]);
  await assert.rejects(adoptDiscoveryCosting(s.p,s.input.id,input),code("DiscoveryContextChanged"));
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.estimates WHERE id=$1",[input.estimate_id]))[0].n,0);
  await adoptDiscoveryCosting(s.p,s.input.id,await manualCostCommand(s));
});
test("E2 migration 27 and repeated seed retain legacy DTOs, ledgers, receipts and exact stored quotations",async()=>{
  await rows(await readFile(new URL("../../db/migrations/0001-recover.sql",import.meta.url),"utf8"));await rows("DROP TABLE public.ppo_migrations");await migrate(26);await seed(26);
  const p=(await createSession("coordinator")).principal,o=crmCreate();await createOpportunity(p,o);const input=estimateInput(o.id),accepted=await createEstimate(p,input),e=await readEstimate(p,input.id),commercial=await opportunityCommercial(p,o.id);
  const command=quoteCommand(e.saved);await prepareQuote(p,e.id,command);await runQuoteJob((await readQuoteJob(p,command.id)).j.id);const bytes=await draftBytes(p,command.id),saved=await readEstimate(p,e.id);
  const retained=tables.filter(t=>!t.startsWith("estimate_discovery_"));
  const capture=()=>Promise.all(retained.map(t=>rows(`SELECT to_jsonb(t) AS v FROM ppo.${t} t ORDER BY to_jsonb(t)::text`)));
  const before=await capture(),ledger=await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();await seed();await seed();
  const after=await capture(),identityAt=retained.indexOf("business_identities");
  assert.deepEqual(after.filter((_,i)=>i!==identityAt),before.filter((_,i)=>i!==identityAt));
  const originalIds=new Set(before[identityAt].map(r=>r.v.id));
  assert.deepEqual(after[identityAt].filter(r=>originalIds.has(r.v.id)),before[identityAt]);
  // Seeds 41 and 49 create exactly these normal synthetic records. No existing identity changes,
  // no identity backfill and no Facility display number are accepted by this proof.
  const additions=after[identityAt].filter(r=>!originalIds.has(r.v.id)).map(r=>r.v);
  const expectedIds=["c5050000-0000-4000-8000-000000000001","c5050001-0000-4000-8000-000000000001","c5050001-0000-4000-8000-000000000002",...Array.from({length:9},(_,i)=>`c5050002-0000-4000-8000-${String(i+1).padStart(12,"0")}`),"c5050003-0000-4000-8000-000000000001","c5050004-0000-4000-8000-000000000001","c5050004-0000-4000-8000-000000000002","c5050005-0000-4000-8000-000000000001"];
  assert.deepEqual(additions.map(r=>r.id).sort(),[...expectedIds,...supplySeedIdentities.map(r=>r.id)].sort());
  assert.deepEqual(additions.filter(r=>r.object_type==="SupplyRecord").sort((a,b)=>a.id.localeCompare(b.id)),supplySeedIdentities);
  for(const r of additions){assert.equal(r.workspace_id,p.workspace_id);assert.equal(r.synthetic,true);if(r.object_type==="Facility")assert.equal(r.display_number,null);}
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations WHERE version<=26 ORDER BY version"),ledger);
  assert.deepEqual(await readEstimate(p,e.id),saved);assert.deepEqual(await draftBytes(p,command.id),bytes);assert.deepEqual(await readOperation(p,input.operation_id),accepted.receipt);
  assert.deepEqual((await opportunityCommercial(p,o.id)).estimate,commercial.estimate);
  assert.equal((await rows("SELECT count(*)::int n FROM ppo.estimate_discovery_roots"))[0].n,0);
  await assert.rejects(createEstimate(p,{...estimateInput(o.id)}),code("RelationshipConflict"));
});

}
