import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assistantInput} from '../helpers/assistant';
const origin='http://127.0.0.1:3000';
async function session(profile='coordinator') {
  const r=await fetch(origin+'/api/v1/local-session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile})});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];
}
async function call(cookie:string,path:string,body?:unknown,requestOrigin=origin) {
  const r=await fetch(origin+'/api/v1/'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...body===undefined?{}:{Origin:requestOrigin,'Content-Type':'application/json'}},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,headers:r.headers,text:await r.text()};
}
test('AI1 HTTP enforces origin, authentication, no-store, exact confirmation and actor-owned recovery',async()=>{
  assert.equal((await call('','assistant/status')).status,401);
  const cookie=await session(),mode=await call(cookie,'assistant/status');assert.equal(mode.status,200);assert.equal(JSON.parse(mode.text).mode,'simulated');assert.match(mode.headers.get('cache-control')!,/private.*no-store/);
  assert.equal((await call(cookie,'assistant/turn',{message:'Find customer SYN'},'https://untrusted.invalid')).status,403);
  const search=await call(cookie,'assistant/turn',{message:'Find customer SYN'});assert.equal(search.status,200);assert.match(search.text,/Simulated assistant/);
  const prepared=await call(cookie,'assistant/proposals',assistantInput('SYN HTTP assistant review'));assert.equal(prepared.status,200);const v=JSON.parse(prepared.text);
  assert.equal((await call(cookie,`assistant/proposals/${v.id}/confirm`,{expected_version:v.version,command_hash:v.command_hash,title:'Unreviewed edit'})).status,422);
  const body={expected_version:v.version,command_hash:v.command_hash};
  const saved=await call(cookie,`assistant/proposals/${v.id}/confirm`,body);assert.equal(saved.status,200);
  const recovered=await call(cookie,`assistant/proposals/${v.id}`);assert.equal(recovered.status,200);assert.deepEqual(JSON.parse(recovered.text).receipt,JSON.parse(saved.text).receipt);
  assert.deepEqual(JSON.parse((await call(cookie,`assistant/proposals/${v.id}/confirm`,body)).text).receipt,JSON.parse(saved.text).receipt);
  const other=await session('second-company');assert.equal((await call(other,`assistant/proposals/${v.id}`)).status,404);
  assert.equal((await call(cookie,'local-session/sign-out',{})).status,200);assert.equal((await call(cookie,`assistant/proposals/${v.id}`)).status,401);
});
