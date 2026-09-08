import assert from 'node:assert/strict';
import { after,beforeEach,test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { reset } from '../../scripts/database';
import { database,closeDatabase } from '../../src/platform/database';
import { localConfig } from '../../src/platform/config';
import { createSession } from '../../src/platform/identity';
import { createOpportunity } from '../../src/crm/opportunities';
import { readOpportunity } from '../../src/crm/reads';
import { readOperation } from '../../src/shared/receipts';
import { createEmailFollowup,linkEmail,readEmail,listEmail,readCalendar } from '../../src/email/service';
import { crmCreate,crmBase,CRM } from '../helpers/crm';
if(localConfig().database_name!=='ppo_synthetic_test')throw Error('Disposable test database only');
process.env.PPO_ALLOW_RESET='dispose-synthetic';process.env.PPO_RESET_DATABASE='ppo_synthetic_test';
beforeEach(reset);after(closeDatabase);
const message='ec000000-0000-4000-8000-000000000001';
const principal=async(profile='coordinator')=>(await createSession(profile)).principal;
const code=(name:string)=>(e:unknown)=>(e as {code:string}).code===name;
async function linked(){const p=await principal(),o=crmCreate();await createOpportunity(p,o);const input={...crmBase(),expected_version:1,opportunity_id:o.id};await linkEmail(p,message,input);return {p,o,input};}
const follow=()=>({...crmBase(),expected_version:2,activity_id:randomUUID(),summary:'SYN Confirm site visit',due_at:'2026-09-08T23:00:00Z'});
test('EC persisted private email, explicit link, atomic follow-up, opportunity history and Brisbane calendar',async()=>{
 const p=await principal(),o=crmCreate();await createOpportunity(p,o);
 assert.equal((await readEmail(p,message)).opportunity_id,null);
 const input={...crmBase(),expected_version:1,opportunity_id:o.id};
 const linked=await Promise.all([linkEmail(p,message,input),linkEmail(p,message,input)]);
 assert.equal(linked.filter(x=>x.replayed).length,1);
 await assert.rejects(linkEmail(p,message,{...input,opportunity_id:randomUUID()}),code('RecordUnavailable'));
 const f=follow(),results=await Promise.all([createEmailFollowup(p,message,f),createEmailFollowup(p,message,f)]);
 assert.equal(results.filter(x=>x.replayed).length,1);
 await closeDatabase();
 const m=await readEmail(p,message),opportunity=await readOpportunity(p,o.id),calendar=await readCalendar(p,{day:'2026-09-09'});
 assert.equal(m.followup_id,f.activity_id);assert.equal(m.opportunity_id,o.id);
 assert.ok(opportunity.actions.some(a=>a.id===f.activity_id));assert.equal(opportunity.next_activity?.id,o.initial_action.id);
 assert.ok(calendar.activities.some(a=>a.id===f.activity_id));assert.equal((await readCalendar(p,{day:'2026-09-08'})).activities.some(a=>a.id===f.activity_id),false);
 assert.equal((await database().query('SELECT count(*)::int n FROM ppo.activities WHERE id=$1',[f.activity_id])).rows[0].n,1);
 assert.equal(JSON.stringify(opportunity.actions).includes(m.body_text),false);
 assert.deepEqual(await readOperation(p,f.operation_id),results[0].receipt);
 await assert.rejects(createEmailFollowup(p,message,{...f,summary:'Changed'}),code('OperationConflict'));
 await assert.rejects(createEmailFollowup(p,message,{...follow(),expected_version:3}),code('FollowUpExists'));
});
test('EC owner privacy, workspace boundaries and invalid link never reveal email',async()=>{
 for(const profile of ['observer','second-company','other-workspace','systems']) {
  const p=await principal(profile);await assert.rejects(readEmail(p,message),code('RecordUnavailable'));
  await assert.rejects(linkEmail(p,message,{...crmBase(),expected_version:1,opportunity_id:randomUUID()}),code('RecordUnavailable'));
 }
 const {p,o}=await linked();const other=crmCreate();await createOpportunity(p,other);
 await assert.rejects(linkEmail(p,message,{...crmBase(),expected_version:1,opportunity_id:other.id}),code('VersionConflict'));
 assert.equal((await readEmail(p,message)).opportunity_id,o.id);
 await assert.rejects(readCalendar(p,{day:'2026-02-31'}));
});
test('EC current email, activity and opportunity revocation precedes receipt and retry',async()=>{
 const {p}=await linked(),f=follow();await createEmailFollowup(p,message,f);
 await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='activity.edit'",[p.actor_id]);
 await assert.rejects(createEmailFollowup(p,message,f));await assert.rejects(readOperation(p,f.operation_id),code('RecordUnavailable'));
 await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='crm.opportunity.read'",[p.actor_id]);
 await assert.rejects(readEmail(p,message),code('RecordUnavailable'));
 assert.equal((await readCalendar(p,{day:'2026-09-09'})).activities.some(a=>a.id===f.activity_id),false);
 assert.equal((await listEmail(p,{})).items.some(m=>m.id===message),false);
 await database().query("DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='email.read'",[p.actor_id]);
 await assert.rejects(listEmail(p,{}));assert.equal((await readCalendar(p,{day:'2026-09-08'})).meetings.length,0);
});
test('EC outbox failure rolls back Activity, source association and receipt together',async()=>{
 const {p}=await linked(),f=follow();
 await database().query("CREATE FUNCTION ppo.ec_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='EmailFollowUpCreated' THEN RAISE EXCEPTION 'Synthetic injected failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER ec_fail BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.ec_fail()");
 await assert.rejects(createEmailFollowup(p,message,f));
 assert.equal((await readEmail(p,message)).followup_id,null);
 for(const [table,column,id] of [['activities','id',f.activity_id],['operation_receipts','operation_id',f.operation_id],['business_identities','id',f.activity_id]])assert.equal((await database().query(`SELECT count(*)::int n FROM ppo.${table} WHERE ${column}=$1`,[id])).rows[0].n,0);
 assert.equal((await database().query('SELECT company_id FROM ppo.email_messages WHERE id=$1',[message])).rows[0].company_id,CRM.company);
});
