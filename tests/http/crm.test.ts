import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after,test } from "node:test";
import { database,closeDatabase } from "../../src/platform/database";
import { CRM,crmBase,crmCreate,crmQualify,crmAction } from "../helpers/crm";
const origin="http://127.0.0.1:3000";
after(closeDatabase);
async function session(profile:string){const r=await fetch(origin+"/api/v1/local-session",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({profile})});assert.equal(r.status,200);return r.headers.get("set-cookie")!.split(";")[0];}
async function call(cookie:string,path:string,body?:unknown){const r=await fetch(origin+"/api/v1/"+path,{method:body===undefined?"GET":"POST",headers:{Cookie:cookie,...(body===undefined?{}:{Origin:origin,"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)});return{status:r.status,headers:r.headers,body:await r.json()};}
test("CA-01/03/04 real HTTP lost response, receipt lookup, strict commands and complete/qualify/next journey",async()=>{
 const cookie=await session("coordinator"),input={...crmCreate(),title:"SYN HTTP I1 qualification"};
 // Deliberately discard the accepted response, then reconcile by original operation.
 const lost=await call(cookie,"crm/opportunities",input);assert.equal(lost.status,201);
 const recovered=await call(cookie,`operations/${input.operation_id}`);assert.equal(recovered.status,200);
 const replay=await call(cookie,"crm/opportunities",input);assert.equal(replay.status,200);assert.deepEqual(replay.body,recovered.body);
 assert.equal((await call(cookie,"crm/opportunities",{...input,title:"Changed content"})).status,409);
 const detail=await call(cookie,`crm/opportunities/${input.id}`);assert.equal(detail.status,200);assert.match(detail.headers.get("cache-control")!,/no-store/);assert.equal(detail.body.items[0].actions.length,1);
 const complete={...crmBase(),expected_version:1,outcome:"SYN HTTP contact outcome retained"};assert.equal((await call(cookie,`activities/${input.initial_action.id}/complete`,complete)).status,200);
 assert.equal((await call(cookie,`crm/opportunities/${input.id}`)).body.items[0].next_action_state,"Needed");
 const q=crmQualify();assert.equal((await call(cookie,`crm/opportunities/${input.id}/qualify`,q)).status,200);assert.equal((await call(cookie,`crm/opportunities/${input.id}/qualify`,{...crmQualify(),expected_version:1})).status,409);
 assert.equal((await call(cookie,`crm/opportunities/${input.id}/next-action`,{...crmBase(),expected_version:2,new_action:crmAction()})).status,200);
 const final=await call(cookie,`crm/opportunities/${input.id}`);assert.equal(final.body.items[0].version,3);assert.equal(final.body.items[0].stage_id,"Qualified");assert.equal(final.body.items[0].close_outcome,"Open");assert.equal(final.body.items[0].actions[0].outcome,complete.outcome);
 assert.equal((await call(cookie,`crm/opportunities/${input.id}/qualify`,{...crmQualify(3),owner_id:CRM.owner})).status,422);
 assert.equal((await call(cookie,"crm/opportunities",{...crmCreate(),title:"x".repeat(66000)})).status,413);
});
test("CA-06/10 HTTP direct/search/filter/selector/work/receipt routes suppress another company's CRM content",async()=>{
 const cookie=await session("coordinator"),other=await session("second-company"),systems=await session("systems"),i={...crmCreate(),title:`SYN hidden CRM ${randomUUID()}`};assert.equal((await call(cookie,"crm/opportunities",i)).status,201);
 const hidden=await call(other,`crm/opportunities/${i.id}`),missing=await call(other,`crm/opportunities/${randomUUID()}`);assert.equal(hidden.status,404);assert.equal(missing.status,404);assert.equal(hidden.body.code,missing.body.code);assert.equal(hidden.body.message,missing.body.message);
 for(const target of [other,systems])for(const path of [`crm/opportunities/${i.id}`,`activities/${i.initial_action.id}`,`operations/${i.operation_id}`,`work?object_type=Opportunity&object_id=${i.id}`,`crm/options?kind=Owner&company_id=${CRM.company}&organisation_id=${CRM.org}&opportunity_id=${i.id}`]){const r=await call(target,path);assert.ok([403,404].includes(r.status));assert.ok(!JSON.stringify(r.body).includes(i.title));}
 const search=await call(other,`crm/opportunities?q=${encodeURIComponent(i.title)}`);assert.ok(search.status===403 || search.body.items.length===0);
 assert.equal((await call(other,`crm/opportunities/${i.id}/qualify`,crmQualify())).status,404);
});
test("CA-06/10 HTTP session revocation and current-permission receipt deny previously accepted content",async()=>{
 const user=randomUUID(),subject=`crm-http-${randomUUID()}`;
 await database().query("INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name) VALUES($1,$2,'PPO-LocalSynthetic',$3,'SYN HTTP revocation fixture')",[user,CRM.workspace,subject]);
 await database().query("INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",[user,CRM.owner]);
 // Use a real server session; its token resolves the user, not a client actor header.
 const {createHash,randomBytes}=await import("node:crypto");const token=randomBytes(32).toString("hex"),cookie=`ppo_local_session=${token}`;
 await database().query("INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",[createHash("sha256").update(token).digest("hex"),CRM.workspace,user]);
 const i={...crmCreate(),owner_id:user,initial_action:crmAction(user)};assert.equal((await call(cookie,"crm/opportunities",i)).status,201);
 await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",[user]);
 for(const path of [`crm/opportunities/${i.id}`,`activities/${i.initial_action.id}`,`operations/${i.operation_id}`])assert.equal((await call(cookie,path)).status,404);
 assert.equal((await call(cookie,"crm/opportunities",i)).status,404);
 await database().query("UPDATE ppo.users SET active=false WHERE id=$1",[user]);assert.equal((await call(cookie,`crm/opportunities/${i.id}`)).status,401);
});
