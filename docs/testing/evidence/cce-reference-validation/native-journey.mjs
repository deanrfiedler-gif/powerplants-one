import { referenceRepository } from './reference-environment.mjs';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const repo=referenceRepository(),dir=path.dirname(fileURLToPath(import.meta.url));
const req=createRequire(path.join(repo,'package.json')),{Client}=req('pg');
const db=new Client({host:'127.0.0.1',port:55478,user:'cceproof',database:'ppo_synthetic_test'});await db.connect();
assert.equal(path.resolve((await db.query('SHOW data_directory')).rows[0].data_directory).toLowerCase(),path.resolve(dir,'cluster').toLowerCase());
Object.assign(process.env,{PPO_ENV:'local-synthetic',PPO_EXPOSURE:'loopback',PPO_IDENTITY:'synthetic',DATABASE_URL:`postgresql://cceproof:${randomUUID()}@127.0.0.1:55478/ppo_synthetic_test`});
const load=name=>import(pathToFileURL(path.join(repo,name)).href);
let platform;
const cases=[];
try {
 platform=await load('src/platform/database.ts');
 const {seedFiles}=await load('scripts/migration-registry.ts');
 if(Number((await db.query('SELECT count(*) n FROM ppo.companies')).rows[0].n)===0){
  await db.query('BEGIN');
  for(const [version,file] of seedFiles)if(version<=12)await db.query(await readFile(path.join(repo,'db',file),'utf8'));
  await db.query('COMMIT');
 }
 const {createSession}=await load('src/platform/identity.ts'),{createOpportunity}=await load('src/crm/opportunities.ts'),{createEstimate,saveEstimate}=await load('src/estimating/service.ts'),{readEstimate}=await load('src/estimating/reads.ts');
 const {CRM,crmCreate,crmBase}=await load('tests/helpers/crm.ts'),{estimateInput}=await load('tests/helpers/estimating.ts');
 const p=(await createSession('coordinator')).principal,o=crmCreate();await createOpportunity(p,o);const input=estimateInput(o.id);await createEstimate(p,input);const before=await readEstimate(p,input.id);
 assert.equal(before.totals.cost,'480.00');assert.equal(before.totals.sell,'720.00');cases.push({id:'NATIVE-01',status:'PASS',detail:'Existing native CRM and estimate commands created a synthetic estimate with 480.00 cost and 720.00 sell.'});
 const beforeNative=(await db.query('SELECT * FROM ppo.estimate_versions WHERE id=$1',[before.saved.id])).rows[0];assert(Number.isInteger(beforeNative.cost_schema_version));
 const q=async(sql,args)=>(await db.query(sql,args)).rows[0],H=Buffer.alloc(32,1),J=JSON.stringify;
 const rule=await q("INSERT INTO ppo.cce_rules(workspace_id,company_id,rule_code,scope_code,display_name,owner_id,created_by) VALUES($1,$2,'NATIVE_PROBE','native','Synthetic native probe',$3,$3) RETURNING *",[CRM.workspace,CRM.company,CRM.owner]);
 const definition=JSON.parse(await readFile(path.join(dir,'example-rule.json'),'utf8'));
 const version=await q("INSERT INTO ppo.cce_rule_versions(workspace_id,company_id,rule_id,version_number,definition_schema_version,engine_abi,priority,definition,change_reason,created_by) VALUES($1,$2,$3,1,1,'cce-arithmetic-v1',1,$4,'Synthetic native probe',$5) RETURNING *",[CRM.workspace,CRM.company,rule.id,J(definition),CRM.owner]);
 const rel=await q("INSERT INTO ppo.cce_ruleset_releases(workspace_id,company_id,scope_code,engine_abi,engine_build_sha256,execution_contract,validation_evidence,expected_member_count,created_by) VALUES($1,$2,'native','cce-arithmetic-v1',$3,'{}','{}',1,$4) RETURNING *",[CRM.workspace,CRM.company,H,CRM.owner]);
 await db.query('INSERT INTO ppo.cce_ruleset_members VALUES($1,$2,$3,$4,$5,1)',[CRM.workspace,CRM.company,rel.id,rule.id,version.id]);await db.query('UPDATE ppo.cce_ruleset_releases SET sealed=true,sealed_at=clock_timestamp(),sealed_by=$2 WHERE id=$1',[rel.id,CRM.owner]);
 const command={...crmBase(),expected_version:before.version,title:input.title,scope:input.scope,lines:input.lines,policy:input.policy};
 // Build a proposal from the existing writer's canonical saved shape.
 const proposal={nativeLines:beforeNative.lines,nativeScope:beforeNative.scope,nativeTitle:beforeNative.title,nativePolicy:beforeNative.policy,nativeCostSchemaVersion:beforeNative.cost_schema_version};
 const manifest={synthetic:true,lines:beforeNative.lines};
 const run=await q("INSERT INTO ppo.cce_evaluation_runs(workspace_id,company_id,option_id,estimate_id,base_estimate_version_id,release_id,run_schema_version,request_id,request_hash,calculation_signature,source_vector_hash,result_state,fact_snapshot,cost_basis_snapshot,base_manifest,override_snapshot,effective_manifest,receiving_proposal,execution_trace,diagnostics,currency,cost_total,sell_total,created_by) VALUES($1,$2,$3,$4,$5,$6,1,$7,$8,$8,$8,'READY','{}','{}',$9,'[]',$9,$10,'{}','[]','AUD','480','720',$11) RETURNING *",[CRM.workspace,CRM.company,before.option_id,before.id,before.saved.id,rel.id,randomUUID(),H,J(manifest),J(proposal),CRM.owner]);
 await saveEstimate(p,before.id,command);const after=await readEstimate(p,before.id),afterNative=(await db.query('SELECT * FROM ppo.estimate_versions WHERE id=$1',[after.saved.id])).rows[0];assert.equal(afterNative.predecessor_id,before.saved.id);assert.equal(after.version,2);
 await db.query("INSERT INTO ppo.estimate_bom_snapshots(workspace_id,company_id,estimate_id,option_id,estimate_version_id,run_id,release_id,snapshot_schema_version,request_id,request_hash,run_evidence_hash,native_content_hash,final_manifest,currency,cost_total,sell_total,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,1,$8,$9,$10,$11,$12,'AUD','480','720','Synthetic native compatibility probe',$13)",[CRM.workspace,CRM.company,before.id,before.option_id,after.saved.id,run.id,rel.id,randomUUID(),H,run.content_hash,afterNative.content_hash,J(manifest),CRM.owner]);
 cases.push({id:'NATIVE-02',status:'PASS',detail:'CCE guard accepted an exact successor made by native saveEstimate; snapshot insertion was a separate test transaction, not a production adoption command.'});
 const historical=await readEstimate(p,before.id,{version_id:before.saved.id});assert.deepEqual(historical.saved,before.saved);cases.push({id:'NATIVE-03',status:'PASS',detail:'Native original version reopened unchanged after successor and evidence attachment.'});
 await assert.rejects(saveEstimate(p,before.id,{...command,...crmBase()}),e=>e.code==='VersionConflict');cases.push({id:'NATIVE-04',status:'PASS',detail:'Existing native command rejected a stale expected version.'});
 const wrong=(await createSession('other-workspace')).principal;await assert.rejects(readEstimate(wrong,before.id),e=>e.code==='RecordUnavailable');cases.push({id:'NATIVE-05',status:'PASS',detail:'Existing native read command rejected an unrelated workspace.'});
 await writeFile(path.join(dir,'native-journey-result.json'),J({cases,limits:['No new CCE service route implemented','Native save and evidence attachment were separate transactions','No quotation rendering or complete historical upgrade suite'],sourceEstimateId:before.id}));console.log(J({passed:cases.length,cases}));
}catch(error){await db.query('ROLLBACK');await writeFile(path.join(dir,'native-journey-attempt.json'),JSON.stringify({cases,error:{message:error.message,code:error.code,stack:error.stack}},null,2));console.error(error);process.exitCode=1;}
finally{await db.end();if(platform)await platform.closeDatabase();}
