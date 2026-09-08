import { createHash, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { database, transaction } from '../platform/database';
import type { Principal } from '../platform/identity';
import { AppError, unavailable } from '../platform/errors';
import { requireCapability } from '../platform/permissions';
import { canonical, type OperationReceipt } from '../platform/operations';
import { object, uuid, narrative, optionalId, version } from '../shared/validation';
import { visible, listShared, page } from '../shared/reads';
import { readOperation } from '../shared/receipts';
import { opportunityVisibility, PIPELINE_ID } from '../crm/context';
import { listOpportunities } from '../crm/reads';
import { activityVisibility } from '../activities/activities';
import { parseCreate } from '../crm/validation';
import { createOpportunity, validateOpportunityCreation } from '../crm/opportunities';
import { assistantMode, requireAssistant } from './config';
import { parseSimulatedRequest, ASSISTANT_LABEL } from './simulated';

type Command = ReturnType<typeof parseCreate>;
type Selections = { company: string; organisation: string; organisation_version: number; site: string | null; site_version: number | null; contact: string | null; contact_version: number | null; owner: string; activity_owner: string };
type Proposal = { id: string; actor_id: string; version: number; command: Command | null; command_hash: string; selections: Selections; selection_hash: string; state: 'Ready'|'Submitting'|'Accepted'|'Superseded'; operation_id: string; expires_at: Date; accepted_at: Date | null };
export type ProposalView = { id: string; version: number; command: Command | null; command_hash: string; selections: Selections | null; state: Proposal['state']|'Expired'; expires_at: string; receipt: OperationReceipt | null };
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
const failure = (code: string, message: string) => new AppError(409, code, message);
async function ready(recovery = false) {
  if (recovery) assistantMode(); else requireAssistant();
  if (!(await database().query("SELECT to_regclass('ppo.assistant_proposals') AS relation")).rows[0].relation)
    throw new AppError(503,'AssistantSetup','The simulated assistant needs its database setup. Ordinary PPO screens remain available.');
}
export async function cleanAssistantProposals() {
  await ready(true);
  // The hourly local worker leaves a one-hour margin within the retention limits.
  await database().query("DELETE FROM ppo.assistant_proposals WHERE state IN ('Ready','Superseded') AND expires_at < clock_timestamp()-interval '23 hours'");
  await database().query("UPDATE ppo.assistant_proposals SET command=NULL, selections='{}'::jsonb WHERE state='Accepted' AND accepted_at < clock_timestamp()-interval '6 days 23 hours' AND command IS NOT NULL");
}
async function selections(c: PoolClient, p: Principal, command: Command): Promise<Selections> {
  await validateOpportunityCreation(c,p,command);
  const org=await visible(c,p,'Organisation',command.organisation_id);
  const site=command.site_id ? await visible(c,p,'Site',command.site_id) : null;
  const person=command.primary_person_id ? await visible(c,p,'Person',command.primary_person_id) : null;
  const company=(await c.query('SELECT display_name FROM ppo.companies WHERE workspace_id=$1 AND id=$2',[p.workspace_id,command.company_id])).rows[0];
  const users=(await c.query('SELECT id,display_name FROM ppo.users WHERE workspace_id=$1 AND id=ANY($2::uuid[])',[p.workspace_id,[command.owner_id,command.initial_action.owner_id]])).rows;
  return {company:company.display_name,organisation:org.display_name,organisation_version:org.version,site:site?.display_name??null,site_version:site?.version??null,contact:person?.display_name??null,contact_version:person?.version??null,owner:users.find(u=>u.id===command.owner_id).display_name,activity_owner:users.find(u=>u.id===command.initial_action.owner_id).display_name};
}
async function findProposal(c: Pick<PoolClient,'query'>,p: Principal,id: string,lock=false): Promise<Proposal> {
  const row=(await c.query('SELECT * FROM ppo.assistant_proposals WHERE workspace_id=$1 AND actor_id=$2 AND id=$3'+(lock?' FOR UPDATE':''),[p.workspace_id,p.actor_id,uuid(id,'proposal_id')])).rows[0];
  if (!row) throw unavailable(); return row;
}
async function accepted(p: Principal,row: Proposal): Promise<OperationReceipt | null> {
  // Check existence internally, then use the authoritative dispatcher before any disclosure.
  const exists=(await database().query('SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3',[p.workspace_id,p.actor_id,row.operation_id])).rowCount;
  if (!exists) return null;
  const receipt=await readOperation(p,row.operation_id);
  await database().query("UPDATE ppo.assistant_proposals SET state='Accepted',accepted_at=COALESCE(accepted_at,clock_timestamp()) WHERE workspace_id=$1 AND actor_id=$2 AND id=$3",[p.workspace_id,p.actor_id,row.id]);
  return receipt;
}
function view(row: Proposal,receipt: OperationReceipt | null=null): ProposalView {
  return {id:row.id,version:row.version,command:receipt?null:row.command,command_hash:row.command_hash,selections:receipt?null:row.selections,state:receipt?'Accepted':row.state==='Ready'&&row.expires_at.getTime()<=Date.now()?'Expired':row.state,expires_at:row.expires_at.toISOString(),receipt};
}
export async function readProposal(p: Principal,id: string) {
  await ready(true); const row=await findProposal(database(),p,id);
  const receipt=await accepted(p,row);
  if (receipt) return view(row,receipt);
  if (!row.command) throw unavailable();
  await transaction(c=>selections(c,p,row.command!));
  return view(row);
}
export async function recentProposals(p: Principal) {
  await ready(true);
  const rows=(await database().query("SELECT id FROM ppo.assistant_proposals WHERE workspace_id=$1 AND actor_id=$2 AND state<>'Superseded' AND ($3::boolean OR state IN ('Submitting','Accepted')) ORDER BY created_at DESC,id DESC LIMIT 20",[p.workspace_id,p.actor_id,assistantMode()==='simulated'])).rows;
  const items=[];
  for (const row of rows) { try { const v=await readProposal(p,row.id); items.push({id:v.id,state:v.state,title:v.command?.title??'Saved opportunity',expires_at:v.expires_at}); } catch(e) { if (!(e instanceof AppError && [403,404].includes(e.status))) throw e; } }
  return {items,coverage:'Up to 20 recent proposals belonging to this identity; only currently permitted records are shown.'};
}
export async function prepareProposal(p: Principal,input: unknown) {
  await ready(); const r=object(input,['id','supersedes','values']);
  const id=uuid(r.id,'proposal_id'),supersedes=optionalId(r.supersedes,'supersedes');
  if (supersedes===id) throw failure('ProposalConflict','An edited proposal needs a new identity.');
  const values=object(r.values,['company_id','organisation_id','site_id','primary_person_id','site_unknown_reason','contact_unknown_reason','title','need_summary','source_channel','source_basis','owner_id','initial_action']);
  const action=object(values.initial_action,['owner_id','kind','summary','due_at','due_needed']);
  return transaction(async c=>{
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[p.workspace_id+':assistant:'+p.actor_id]);
    const prior=(await c.query('SELECT * FROM ppo.assistant_proposals WHERE workspace_id=$1 AND actor_id=$2 AND id=$3',[p.workspace_id,p.actor_id,id])).rows[0] as Proposal|undefined;
    const command=parseCreate({...values,id:prior?.command?.id??randomUUID(),pipeline_definition_id:PIPELINE_ID,initial_action:{...action,id:prior?.command?.initial_action.id??randomUUID()},operation_id:prior?.operation_id??randomUUID(),schema_version:1,reason:'Create synthetic opportunity from reviewed assistant proposal '+id});
    const labels=await selections(c,p,command), digest=hash(command);
    if (prior) { if(prior.command_hash!==digest)throw failure('ProposalConflict','This proposal already contains different details. Review a new proposal.'); return view(prior); }
    if (supersedes) { const old=await findProposal(c,p,supersedes,true);if(old.state!=='Ready')throw failure('ProposalPending','Check the original save status before preparing another proposal.');if(!old.command)throw unavailable();await selections(c,p,old.command);await c.query("UPDATE ppo.assistant_proposals SET state='Superseded' WHERE workspace_id=$1 AND id=$2",[p.workspace_id,supersedes]); }
    const row=(await c.query('INSERT INTO ppo.assistant_proposals(workspace_id,id,actor_id,operation_id,command,command_hash,selections,selection_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[p.workspace_id,id,p.actor_id,command.operation_id,command,digest,labels,hash(labels)])).rows[0];
    return view(row);
  });
}
export async function confirmProposal(p: Principal,id: string,input: unknown) {
  await ready(true); const r=object(input,['expected_version','command_hash']);version(r.expected_version);
  if(typeof r.command_hash!=='string'||!/^[a-f0-9]{64}$/.test(r.command_hash))throw failure('ProposalConflict','Review the current proposal before creating the opportunity.');
  const row=await findProposal(database(),p,id);
  if(row.command_hash!==r.command_hash||row.version!==r.expected_version)throw failure('ProposalConflict','The reviewed details changed. Load the current proposal.');
  const receipt=await accepted(p,row);if(receipt)return view(row,receipt);
  const command=await transaction(async c=>{
    const original=await findProposal(c,p,id,true);
    if(!original.command)throw unavailable();
    const current=await selections(c,p,original.command);
    if(original.state==='Superseded')throw failure('ProposalSuperseded','This proposal was replaced by an edited version.');
    if(original.state==='Ready') {
      requireAssistant();
      if(original.expires_at.getTime()<=Date.now())throw failure('ProposalExpired','This review expired. Refresh the details and review again.');
      if(hash(current)!==original.selection_hash)throw failure('ProposalChanged','The selected records changed. Refresh the details and review again.');
    }
    await c.query("UPDATE ppo.assistant_proposals SET state='Submitting' WHERE workspace_id=$1 AND id=$2 AND state='Ready'",[p.workspace_id,id]);
    return original.command;
  });
  // No provider request or outer transaction/row lock surrounds the canonical business command.
  await createOpportunity(p,command);
  return readProposal(p,id);
}
export async function searchCustomers(p: Principal,input: unknown) {
  requireAssistant();const r=object(input,['q','cursor']);
  const result=await listShared(p,'Organisation',{...r,limit:20});
  return {...result,items:result.items.map(x=>{ const o=x as typeof x & {company_id:string;display_name:string;display_number:string};return {id:o.id,company_id:o.company_id,display_name:o.display_name,display_number:o.display_number,href:'/customers/'+o.id}; })};
}
export async function customerSummary(p: Principal,id: string,input: unknown={}) {
  requireAssistant();const r=object(input,['opportunity_cursor','activity_cursor']);
  return transaction(async c=>{
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await requireCapability(c,p,'crm.opportunity.read');
    const org=await visible(c,p,'Organisation',uuid(id,'organisation_id'));
    const binding={workspace:p.workspace_id,actor:p.actor_id,organisation:id};
    const op=page({limit:10,...(r.opportunity_cursor?{cursor:r.opportunity_cursor}:{})},{...binding,resource:'AssistantOpportunities'});
    const ap=page({limit:20,...(r.activity_cursor?{cursor:r.activity_cursor}:{})},{...binding,resource:'AssistantActivities'});
    const opportunities=(await c.query('SELECT o.id,o.display_number,o.title,o.need_summary,o.stage_id,o.version,o.updated_at FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.organisation_id=$3 AND '+opportunityVisibility('o')+' AND ($4::uuid IS NULL OR o.id>$4) ORDER BY o.id LIMIT 11',[p.workspace_id,p.actor_id,id,op.after])).rows;
    const activities=(await c.query("SELECT a.id,a.summary,a.status,a.outcome,a.due_at,a.due_needed,a.version,a.updated_at FROM ppo.activities a WHERE a.workspace_id=$1 AND a.access_class='Internal' AND "+activityVisibility('a',true)+" AND EXISTS(SELECT 1 FROM ppo.activity_links al JOIN ppo.opportunities co ON co.workspace_id=al.workspace_id AND co.id=al.opportunity_id WHERE al.workspace_id=a.workspace_id AND al.activity_id=a.id AND co.organisation_id=$3) AND ($4::uuid IS NULL OR a.id>$4) ORDER BY a.id LIMIT 21",[p.workspace_id,p.actor_id,id,ap.after])).rows;
    const observed_at=new Date().toISOString();
    const facts=[{source_id:'Organisation:'+org.id+':'+org.version,kind:'Organisation',id:org.id,version:org.version,source_at:org.updated_at.toISOString(),href:'/customers/'+org.id,title:org.display_name,text:'Customer reference '+org.display_number},
      ...opportunities.slice(0,10).map(o=>({source_id:'Opportunity:'+o.id+':'+o.version,kind:'Opportunity',id:o.id,version:o.version,source_at:o.updated_at.toISOString(),href:'/crm/opportunities/'+o.id,title:o.title,text:o.stage_id+' · '+o.need_summary})),
      ...activities.slice(0,20).map(a=>({source_id:'Activity:'+a.id+':'+a.version,kind:'Activity',id:a.id,version:a.version,source_at:a.updated_at.toISOString(),href:'/work/'+a.id,title:a.summary,text:a.status+(a.outcome?' · Recorded outcome: '+a.outcome:'')+(a.due_needed?' · Due date needed':a.due_at?' · Due '+a.due_at.toISOString():'')}))];
    return {label:ASSISTANT_LABEL,organisation:{id:org.id,company_id:org.company_id,display_name:org.display_name,display_number:org.display_number},observed_at,facts,opportunity_cursor:opportunities.length>10?op.cursor(opportunities[9].id):null,activity_cursor:activities.length>20?ap.cursor(activities[19].id):null,coverage:'Customer identity, up to 10 permitted opportunities and 20 Internal CRM Activities per page, in stable reference-ID order. Service, equipment, projects, email and Finance are outside this summary. Empty or partial results do not establish that no other history exists.'};
  });
}
export async function assistantTurn(p: Principal,input: unknown) {
  requireAssistant();const r=object(input,['message','organisation_id']);
  const message=narrative(r.message,'message',4000),org=optionalId(r.organisation_id,'organisation_id');
  const parsed=parseSimulatedRequest(message);
  if(parsed.kind==='summary')return {...parsed,label:ASSISTANT_LABEL,summary:org?await customerSummary(p,org):null,explanation:org?'Recorded CRM context with links to original records.':'Select an existing customer before requesting its CRM summary.'};
  if(parsed.kind==='customers'||parsed.kind==='create')return {...parsed,label:ASSISTANT_LABEL,customers:await searchCustomers(p,{q:parsed.query})};
  if(parsed.kind==='opportunities')return {...parsed,label:ASSISTANT_LABEL,opportunities:await listOpportunities(p,{limit:20,...(parsed.mine?{owner_id:p.actor_id}:{}),...(parsed.next_action?{next_action:parsed.next_action}:{})})};
  return {...parsed,label:ASSISTANT_LABEL};
}
