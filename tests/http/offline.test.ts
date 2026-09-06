import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {prepareFieldAppointment} from "../helpers/field-http";
import {base,startInput,entry} from "../helpers/field";
import {operation,rehash} from "../helpers/offline";
const origin="http://127.0.0.1:3000";
async function session(profile:string){const r=await fetch(`${origin}/api/v1/local-session`,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({profile})});assert.equal(r.status,200);return r.headers.get("set-cookie")!.split(";")[0];}
async function call(cookie:string,path:string,body?:unknown){const r=await fetch(`${origin}/api/v1/${path}`,{method:body===undefined?"GET":"POST",headers:{Cookie:cookie,...(body===undefined?{}:{Origin:origin,"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cache:r.headers.get("cache-control")};}
test("P08 real HTTP bounded sync, original receipts, malformed siblings and actor/file isolation",async()=>{
 const co=await session("coordinator"),p=await session("assigned-technician"),m=await session("second-technician");const setup=await prepareFieldAppointment(async(path,body)=>{const r=await call(co,path,body);assert.ok(r.status<300,JSON.stringify(r));return r.body;},"2026-12-04");
 for(const cookie of [p,m]){const actor=(await call(cookie,"local-session")).body,recipient=setup.pack.readiness.recipients.find((x:{user_id:string})=>x.user_id===actor.actor_id);assert.equal((await call(cookie,`pack-issues/${setup.pack.current_issue_id}/acknowledge`,{...base(),assignment_id:recipient.assignment_id,assignment_version:recipient.assignment_version,presented_hash:setup.pack.issues[0].output_hash,captured_at:new Date().toISOString()})).status,201);}
 const actor=(await call(p,"local-session")).body,context=await call(p,`sync/context/${setup.appointment_id}`,{});assert.equal(context.status,200);assert.equal(context.cache,"private, no-store");assert.equal("finance" in context.body.job,false);assert.equal(context.body.owner.actor_id,actor.actor_id);
 let job=(await call(p,`my-jobs/${setup.appointment_id}`)).body.items[0];const start=operation(actor,job,"Start",startInput(job));const accepted=await call(p,"sync/operations",{operations:[start]});assert.equal(accepted.status,200);assert.equal(accepted.body.outcomes[0].state,"ServerSaved");job=(await call(p,`my-jobs/${job.id}`)).body.items[0];
 const op=operation(actor,job,"Capture",entry(job)),bad=rehash({...op,payload:{...op.payload,operation_id:randomUUID(),unknown_field:true}});const result=await call(p,"sync/operations",{operations:[bad,op]});assert.equal(result.body.outcomes[1].state,"ServerSaved");assert.notEqual(result.body.outcomes[0].state,"ServerSaved");assert.deepEqual((await call(p,"sync/operations",{operations:[op]})).body.outcomes[0].receipt,result.body.outcomes[1].receipt);assert.equal((await call(m,"sync/operations",{operations:[op]})).body.outcomes[0].code,"RecordUnavailable");
 const missing=await call(p,`sync/recovery/${randomUUID()}`);assert.equal(missing.status,404);assert.equal(missing.body.code,"RecordUnavailable");assert.equal((await call(p,"sync/operations",{operations:Array(21).fill(op)})).status,422);assert.equal((await call(p,"appointments/"+job.id+"/submit-completion",{})).status,404);
 const signed=await call(p,"local-session/sign-out",{});assert.equal(signed.status,200);assert.equal((await call(p,"sync/operations",{operations:[op]})).status,401);
});
