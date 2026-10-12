import { referenceRepository } from './reference-environment.mjs';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const repo = referenceRepository();
const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(repo,'package.json'));
const { Client } = require('pg');
const connect = async database => { const c = new Client({host:'127.0.0.1',port:55478,user:'cceproof',database}); await c.connect(); return c; };
const admin = await connect('postgres');
assert.equal(path.resolve((await admin.query('SHOW data_directory')).rows[0].data_directory).toLowerCase(),path.resolve(dir,'cluster').toLowerCase());
for(const name of ['ppo_synthetic_test','cce_contract_test']) await admin.query(`CREATE DATABASE ${name}`);
await admin.end();
const db = await connect('ppo_synthetic_test');
try {
 const { migrationFiles, latestMigrationVersion } = await import(pathToFileURL(path.join(repo,'scripts/migration-registry.ts')).href);
 const applied = [];
 await db.query('BEGIN');
 await db.query('CREATE TABLE public.ppo_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT clock_timestamp())');
 for(const file of migrationFiles) {
   const sql = await readFile(path.join(repo,'db/migrations',file),'utf8');
   await db.query(sql);
   const sha256 = createHash('sha256').update(sql).digest('hex');
   await db.query('INSERT INTO public.ppo_migrations(version,sha256) VALUES($1,$2)',[Number(file.slice(0,4)),sha256]);
   applied.push({file,sha256});
 }
 await db.query('COMMIT');
 const parents = ['companies','users','estimating_options','estimates','estimate_versions'];
 const columns = (await db.query(`SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='ppo' AND table_name=ANY($1) ORDER BY table_name,ordinal_position`,[parents])).rows;
 const constraints = (await db.query(`SELECT c.relname AS table_name,t.conname,t.contype,pg_get_constraintdef(t.oid) AS definition FROM pg_constraint t JOIN pg_class c ON c.oid=t.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ppo' AND c.relname=ANY($1) ORDER BY c.relname,t.conname`,[parents])).rows;
 await writeFile(path.join(dir,'native-parent-catalog.json'),JSON.stringify({columns,constraints},null,2));
 await db.query(await readFile(path.join(dir,'reference-schema.sql'),'utf8'));
 const result = {postgres:(await db.query('SELECT version()')).rows[0].version,latestMigrationVersion,migrationCount:applied.length,applied,cceDdlApplied:true,scope:'Unseeded fresh native schema; service writer and populated upgrade not established'};
 await writeFile(path.join(dir,'native-schema-result.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({...result,applied:undefined}));
} catch(e) { await db.query('ROLLBACK'); console.error(e); process.exitCode=1; }
finally { await db.end(); }
