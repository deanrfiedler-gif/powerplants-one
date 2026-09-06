import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { crmCreate, crmBase } from "../helpers/crm";
import { estimateInput, quoteCommand } from "../helpers/estimating";
const origin="http://127.0.0.1:3000";
async function session(profile="coordinator") {const r=await fetch(`${origin}/api/v1/local-session`,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({profile})});assert.equal(r.status,200);return r.headers.get("set-cookie")!.split(";")[0];}
async function call(cookie:string,path:string,body?:unknown) {const r=await fetch(`${origin}/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:{Cookie:cookie,...(body===undefined?{}:{Origin:origin,"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,headers:r.headers,body:await r.json()};}
test("E1-HTTP01 complete saved journey, discarded response, successor conflict and exact draft bytes",async()=>{
  const cookie=await session(),o=crmCreate();assert.equal((await call(cookie,"crm/opportunities",o)).status,201);
  const input=estimateInput(o.id),path=`estimating/estimates/${input.id}`,created=await call(cookie,"estimating/estimates",input);assert.equal(created.status,201);
  const recovered=await call(cookie,`operations/${input.operation_id}`),retry=await call(cookie,"estimating/estimates",input);assert.deepEqual(retry.body,recovered.body);assert.equal(retry.status,200);
  const first=await call(cookie,path);assert.equal(first.body.totals.sell,"720.00");assert.match(first.headers.get("cache-control")!,/no-store/);
  const save={...crmBase(),expected_version:1,title:input.title,scope:{...input.scope,included:"SYN Revised supply scope"},lines:input.lines,policy:input.policy};assert.equal((await call(cookie,path,save)).status,200);
  assert.equal((await call(cookie,path,{...save,...crmBase()})).status,409);assert.equal((await call(cookie,path+`?version_id=${first.body.saved.id}`)).body.saved.scope.included,input.scope.included);
  const e=(await call(cookie,path)).body,q=quoteCommand(e.saved,2);assert.equal((await call(cookie,path+"/quotes",q)).status,201);
  const safe=await call(cookie,`estimating/quotes/${q.id}`);assert.equal(safe.body.snapshot.total,"720.00");assert.doesNotMatch(JSON.stringify(safe.body.snapshot),/unit_cost|margin|source|private supplier/);
  assert.equal((await call(cookie,`estimating/quotes/${q.id}/render`,{})).status,200);
  for(const kind of ["html","pdf"]){const url=`${origin}/api/v1/estimating/quotes/${q.id}/file?kind=${kind}`,r=await fetch(url,{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.match(r.headers.get("cache-control")!,/no-store/);assert.equal(r.headers.get("x-content-type-options"),"nosniff");const bytes=Buffer.from(await r.arrayBuffer()),again=await fetch(url,{headers:{Cookie:cookie}});assert.deepEqual(Buffer.from(await again.arrayBuffer()),bytes);if(kind==="html"){assert.match(bytes.toString(),/DRAFT · SYNTHETIC/);assert.doesNotMatch(bytes.toString(),/private supplier cost note/);}else assert.equal(bytes.subarray(0,5).toString(),"%PDF-");}
});
test("E1-HTTP02 real direct routes enforce identity, scope, original target, strict inputs and local origin",async()=>{
  const cookie=await session(),o=crmCreate();await call(cookie,"crm/opportunities",o);const input=estimateInput(o.id);assert.equal((await call(cookie,"estimating/estimates",input)).status,201);
  const e=(await call(cookie,`estimating/estimates/${input.id}`)).body,q=quoteCommand(e.saved);await call(cookie,`estimating/estimates/${input.id}/quotes`,q);
  for(const profile of ["systems","second-company","assigned-technician","other-workspace"]){const other=await session(profile);for(const path of [`estimating/estimates/${input.id}`,`estimating/quotes/${q.id}`,`estimating/quotes/${q.id}/file?kind=pdf`,`operations/${input.operation_id}`])assert.equal((await call(other,path)).status,404);assert.equal((await call(other,`estimating/quotes/${q.id}/render`,{})).status,404);}
  assert.equal((await call("",`estimating/estimates/${input.id}`)).status,401);
  assert.equal((await call(cookie,"estimating/estimates",{...input,id:randomUUID(),...crmBase(),state:"Issued"})).status,422);
  assert.equal((await call(cookie,`estimating/estimates/${input.id}/quotes`,{...q,...crmBase(),id:randomUUID(),choices:q.choices.slice(1)})).status,422);
  const forbidden=await fetch(`${origin}/api/v1/estimating/estimates`,{method:"POST",headers:{Cookie:cookie,Origin:"https://unrelated.invalid","Content-Type":"application/json"},body:JSON.stringify(input)});assert.equal(forbidden.status,403);
});
