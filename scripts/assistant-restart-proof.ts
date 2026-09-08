import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {database,closeDatabase} from '../src/platform/database';
import {localConfig} from '../src/platform/config';
import {assistantInput} from '../tests/helpers/assistant';
import type {ProposalView} from '../src/assistant/service';
if(localConfig().database_name!=='ppo_synthetic_test')throw Error('Disposable ppo_synthetic_test only');
const phase=process.argv[2];if(!['write','accept','verify'].includes(phase))throw Error('Use write, accept or verify');
const folder=join(process.env.RUNNER_TEMP??'/tmp','ppo-ai1-restart'),evidence='verification-evidence/ai1/restart';
await mkdir(folder,{recursive:true});await mkdir(evidence,{recursive:true});
const server=spawn(process.execPath,['--env-file=.env.local','--import','tsx','scripts/local-server.ts'],{stdio:['ignore','inherit','inherit'],env:{...process.env,PPO_ASSISTANT_MODE:phase==='verify'?'off':'simulated'}});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
type Original={id:string;version:number;command_hash:string;operation_id:string;record_id:string;activity_id:string};
try {
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch('http://127.0.0.1:3000')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  assert.ok(ready);assert.equal(server.exitCode,null);
  browser=await chromium.launch({channel:'chromium'});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  const call=async(path:string,body?:unknown)=>{const r=await context.request.fetch('http://127.0.0.1:3000/api/v1/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{Origin:'http://127.0.0.1:3000','Content-Type':'application/json'},data:body});assert.ok(r.ok(),await r.text());return r.json();};
  await call('local-session',{profile:'coordinator'});
  let original:Original;
  if(phase==='write') {
    const v=await call('assistant/proposals',assistantInput('SYN Durable assistant opportunity')) as ProposalView;
    original={id:v.id,version:v.version,command_hash:v.command_hash,operation_id:v.command!.operation_id,record_id:v.command!.id,activity_id:v.command!.initial_action.id};
    // Fault fixture: process stops after committing submission intent, before domain dispatch.
    await database().query("UPDATE ppo.assistant_proposals SET state='Submitting' WHERE id=$1",[v.id]);
    await writeFile(join(folder,'original.json'),JSON.stringify(original));
    await page.goto('http://127.0.0.1:3000/assistant?proposal='+v.id);
    await expect(page.getByRole('button',{name:'Retry original submission',exact:true})).toBeVisible();
  }else {
    original=JSON.parse(await readFile(join(folder,'original.json'),'utf8'));
    await page.goto('http://127.0.0.1:3000/assistant?proposal='+original.id);
    if(phase==='accept') {
      await expect(page.getByRole('button',{name:'Retry original submission',exact:true})).toBeVisible();
      let accepted=false;
      await page.route(`**/assistant/proposals/${original.id}/confirm`,async route=>{const response=await route.fetch();assert.ok(response.ok(),await response.text());accepted=true;await route.abort('failed');});
      await page.getByRole('button',{name:'Retry original submission',exact:true}).click();
      await expect.poll(()=>accepted).toBe(true);
      await expect(page.getByRole('alert')).toBeVisible();
    } else {
      await expect(page.getByRole('heading',{name:'Assistant is switched off',exact:true})).toBeVisible();
      await expect(page.getByRole('heading',{name:'Opportunity saved',exact:true})).toBeVisible();
      const v=await call('assistant/proposals/'+original.id) as ProposalView;
      assert.equal(v.receipt!.operation_id,original.operation_id);assert.equal(v.receipt!.record_id,original.record_id);
      const replay=await call(`assistant/proposals/${original.id}/confirm`,{expected_version:original.version,command_hash:original.command_hash});assert.deepEqual(replay.receipt,v.receipt);
      for(const [table,key,id] of [['opportunities','id',original.record_id],['activities','id',original.activity_id],['opportunity_events','opportunity_id',original.record_id],['operation_receipts','operation_id',original.operation_id],['audit_events','operation_id',original.operation_id],['outbox_jobs','operation_id',original.operation_id]])assert.equal((await database().query(`SELECT count(*)::int n FROM ppo.${table} WHERE ${key}=$1`,[id])).rows[0].n,1);
    }
  }
  await page.screenshot({path:join(evidence,phase+'.png'),fullPage:true});
  await writeFile(join(evidence,phase+'.json'),JSON.stringify({phase,source_head:process.env.PPO_SOURCE_HEAD,run_id:process.env.GITHUB_RUN_ID,original,verified:true},null,2));
}finally {
  await browser?.close();await closeDatabase();
  server.kill('SIGTERM');await Promise.race([new Promise<void>(resolve=>server.once('exit',()=>resolve())),new Promise<void>(resolve=>setTimeout(()=>{if(server.exitCode===null)server.kill('SIGKILL');resolve();},5000))]);
}
