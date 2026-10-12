import { referenceRepository } from './reference-environment.mjs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url)),cluster=path.join(dir,'cluster');
const req=createRequire(referenceRepository() + '/package.json'),{Client}=req('pg');
const counts={};
async function snapshot(){const result={};for(const database of ['ppo_synthetic_test','cce_contract_test_attempt_2','cce_native_populated_upgrade']){const c=new Client({host:'127.0.0.1',port:55478,user:'cceproof',database});await c.connect();try{assert.equal(path.resolve((await c.query('SHOW data_directory')).rows[0].data_directory).toLowerCase(),path.resolve(cluster).toLowerCase());await c.query("SET timezone='UTC';SET datestyle='ISO, YMD'");for(const table of ['estimate_versions','cce_rule_versions','cce_evaluation_runs','estimate_bom_snapshots']){const key=database+'.'+table;result[key]=(await c.query(`SELECT count(*)::int AS rows,encode(sha256(convert_to(coalesce(string_agg(j,E'\\n' ORDER BY j),''),'UTF8')),'hex') AS hash FROM (SELECT to_jsonb(t)::text j FROM ppo.${table} t) r`)).rows[0];}}finally{await c.end();}}return result;}
const pgControl=process.env.CCE_PG_CTL;
assert(pgControl && path.isAbsolute(pgControl), 'Set CCE_PG_CTL to the absolute PostgreSQL 16 pg_ctl executable path');
const control=(...args)=>{const r=spawnSync(pgControl,['-D',cluster,...args],{windowsHide:true,encoding:'utf8',timeout:55000});assert.equal(r.status,0,r.stderr||r.stdout);};
const before=await snapshot();assert(before['ppo_synthetic_test.estimate_versions'].rows>0);assert(before['cce_contract_test_attempt_2.estimate_bom_snapshots'].rows>0);
writeFileSync(path.join(dir,'restart-before.json'),JSON.stringify(before,null,2));
control('-m','fast','-w','-t','50','stop');
control('-l',path.join(dir,'postgres-restart.log'),'-o','-h 127.0.0.1 -p 55478','-w','-t','50','start');
let result;
try{const after=await snapshot();assert.deepEqual(after,before);result={passed:true,checkedTableSets:Object.keys(after).length,rowDigests:after,method:'Actual owned PostgreSQL stop/start; compare exact retained-row digests',limits:'No application restart, worker lease or external delivery recovery proof',clusterStoppedAtCompletion:true};}finally{control('-m','fast','-w','-t','50','stop');}
writeFileSync(path.join(dir,'restart-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rowDigests:undefined}));
