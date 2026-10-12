import { referenceRepository } from './reference-environment.mjs';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const req=createRequire(referenceRepository() + '/package.json'),{Client}=req('pg');
const target='cce_native_populated_upgrade';
const connect=async database=>{const c=new Client({host:'127.0.0.1',port:55478,user:'cceproof',database});await c.connect();return c;};
const admin=await connect('postgres');
const owned=client=>client.query('SHOW data_directory').then(r=>assert(r.rows[0].data_directory.replaceAll('\\','/').endsWith('/ppo-cce-validation-20261012/cluster')));
await owned(admin);await admin.query(`CREATE DATABASE ${target} TEMPLATE ppo_synthetic_test`);await admin.end();
const db=await connect(target);await owned(db);assert.equal((await db.query('SELECT current_database() name')).rows[0].name,target);
const tables=['cce_rules','cce_rule_versions','cce_ruleset_releases','cce_ruleset_members','cce_release_heads','cce_evaluation_runs','estimate_bom_snapshots'];
const functions=['cce_reject_change','cce_hash_evidence','cce_guard_rule_root','cce_guard_release','cce_guard_member_insert','cce_guard_head','cce_check_adoption','cce_check_run_context'];
async function hashes(){await db.query("SET timezone='UTC';SET datestyle='ISO, YMD'");const names=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename")).rows.map(x=>x.tablename).filter(n=>!tables.includes(n));const result={};for(const name of names){assert.match(name,/^[a-z0-9_]+$/);result[name]=(await db.query(`SELECT count(*)::int AS rows,encode(sha256(convert_to(coalesce(string_agg(j,E'\\n' ORDER BY j),''),'UTF8')),'hex') AS hash FROM (SELECT to_jsonb(t)::text j FROM ppo.${name} t) r`)).rows[0];}result.migrationLedger=(await db.query("SELECT count(*)::int AS rows,encode(sha256(convert_to(string_agg(to_jsonb(m)::text,E'\\n' ORDER BY version),'UTF8')),'hex') AS hash FROM public.ppo_migrations m")).rows[0];return result;}
try{
 // Remove only this report's candidate objects in this freshly cloned disposable DB.
 // Native tables, migrations, histories and sequences remain intact.
 await db.query('BEGIN');await db.query('DROP TABLE '+tables.map(t=>'ppo.'+t).join(',')+' CASCADE');for(const name of functions)await db.query(`DROP FUNCTION IF EXISTS ppo.${name}()`);await db.query('DROP DOMAIN ppo.cce_amount,ppo.cce_sha256');await db.query('COMMIT');
 const before=await hashes();assert(before.estimate_versions.rows>0);
 await db.query(readFileSync(new URL('./reference-schema.sql',import.meta.url),'utf8'));
 const after=await hashes();assert.deepEqual(after,before);
 const result={passed:true,method:'Clone current native seeded proof; remove only candidate CCE objects; apply candidate DDL; compare every retained native table and migration ledger',nativeTables:Object.keys(before).length-1,nativeRows:Object.entries(before).filter(([k])=>k!=='migrationLedger').reduce((s,[,v])=>s+v.rows,0),estimateVersions:before.estimate_versions.rows,migrationLedger:before.migrationLedger,hashes:after,limits:['Current populated baseline only; no separate historical migration-0026 upgrade or issued document bytes','No proof of CCE service-level adoption atomicity']};writeFileSync(new URL('./populated-upgrade-result.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,hashes:undefined}));
}finally{await db.end();}
