import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createCostingWorkspace, costingApiCommand, costingScopeSuccessor } from "../helpers/estimating-costing-api";
import { crmBase } from "../helpers/crm";
const origin="http://127.0.0.1:3000";
async function session(profile="coordinator") {
  const r=await fetch(origin+"/api/v1/local-session",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({profile})});assert.equal(r.status,200);return r.headers.get("set-cookie")!.split(";")[0];
}
async function request(cookie:string,path:string,body?:unknown,requestOrigin=origin) {
  const r=await fetch(origin+"/api/v1/"+path,{method:body===undefined?"GET":"POST",headers:{Cookie:cookie,...(body===undefined?{}:{Origin:requestOrigin,"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,headers:r.headers,body:await r.json()};
}
test("E2 costing HTTP binds exact revisions, preserves original responses and refuses wrong identity, source, origin and schema",async()=>{
  const cookie=await session(),call=async(path:string,body?:unknown)=>{const r=await request(cookie,path,body);assert.ok([200,201].includes(r.status),JSON.stringify(r.body));return r.body;};
  const s=await createCostingWorkspace(call),input=await costingApiCommand(call,s),path=s.path+"/costing";
  for(const profile of ["observer","second-company","other-workspace"]){const other=await session(profile);assert.equal((await request(other,path,input)).status,404);assert.equal((await request(other,path+"/preview",{option_id:input.option_id,revision_id:input.revision_id})).status,404);}
  assert.equal((await request("",path,input)).status,401);
  assert.equal((await request(cookie,path,input,"https://unrelated.invalid")).status,403);
  assert.equal((await request(cookie,path,{...input,issue:true})).status,422);
  assert.equal((await request(cookie,path,{...input,revision_id:randomUUID()})).status,404);
  const accepted=await request(cookie,path,input);assert.equal(accepted.status,200);assert.match(accepted.headers.get("cache-control")!,/no-store/);
  assert.deepEqual((await request(cookie,path,input)).body,accepted.body);assert.deepEqual((await request(cookie,`operations/${input.operation_id}`)).body,accepted.body);
  const old=await call(`estimating/estimates/${input.estimate_id}`),successor=await costingScopeSuccessor(call,s);
  const revised=await costingApiCommand(call,s,successor.body.revision_id);await call(path,revised);
  const current=await call(`estimating/estimates/${input.estimate_id}`);assert.equal(current.version,2);assert.equal(current.saved.discovery_basis.revision_id,successor.body.revision_id);
  assert.deepEqual((await call(`estimating/estimates/${input.estimate_id}?version_id=${old.saved.id}`)).saved,old.saved);
  assert.equal((await request(cookie,path,{...revised,...crmBase()})).status,409);
  assert.equal((await request(cookie,path,{...input,title:"Changed original"})).status,409);
  assert.equal((await call(`crm/opportunities/${s.o.id}`)).items[0].version,1);
});
