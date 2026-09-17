/* Recovery suite authored 17 September 2026 from the supplied CR-05 report.
   These are new executable checks, not the missing original 29-group suite. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import '../docs/design/sales-aftercare/model.js';
const M=globalThis.AC_MODEL, results=[];
let state, sequence=0;
const row=(id='ac-901')=>state.records.find(r=>r.id===id);
const test=(name,fn)=>{state=M.seed();fn();results.push({name,result:'Passed'});};
const command=(type,id,payload={},role='account',extra={})=>({op:`recovery-${++sequence}`,type,expectedVersion:state.version,payload:{id,recordVersion:row(id)?.version,...payload},at:'2026-09-17T12:00:00Z',...extra,role});
const apply=c=>{const r=M.command(state,c,c.role);state=r.state;return r;};
const act=(...args)=>apply(command(...args));
const refuses=(fn,pattern)=>{const before=JSON.stringify(state);assert.throws(fn,pattern);assert.equal(JSON.stringify(state),before,'refusal changed the session');};
const feedback={basis:'Quoted',speaker:'Casey Taylor',text:'The delivered equipment is easier for our team to use.'};
const review={date:'2026-09-16',method:'Telephone call',participants:[{name:'Casey Taylor',role:'Customer contact'}],benefits:'Customer reports easier daily operation.'};
const prepareReview=()=>{act('saveReview','ac-901',review);act('feedback','ac-901',feedback);};
const disposition=()=>{for(const c of row().commitments)act('commitment','ac-901',{commitmentId:c.id,disposition:'Carried as owned action',note:'Remaining work assigned for a separate follow-up.',owner:'Riley Chen',due:'2026-09-21'});};
const complete=()=>{prepareReview();disposition();act('completeReview','ac-901',{summary:'Customer review conducted with owned follow-up retained.'});};
const referral={symptom:'Intermittent pressure change reported by the customer.',siteScope:'Willowbank irrigation area and original equipment',occurs:'During the morning irrigation cycle',impact:'Customer reports uneven application',proposedOwner:'Alex Morgan',contactCommitment:'Call the customer on the next working day',reviewed:true};
const prepareReferral=()=>{act('prepareReferral','ac-901',referral);return row().concerns.at(-1).id;};
const commercial={kind:'Upgrade',observation:'Customer reported additional area planned for irrigation.',need:'Review whether the current equipment supports that area.',owner:'Drew Wilson',nextAction:'Arrange a bounded scoping discussion'};
const handover={reviewed:true,scope:'Willowbank site and recorded irrigation equipment',evidence:'Customer review records the proposed additional area.',owner:'Drew Wilson',nextAction:'Review the customer need',assumptions:'Capacity and qualification remain unverified.'};
const prepareHandover=()=>{act('prepareCommercial','ac-901',commercial);const id=row().commercial.at(-1).id;act('prepareHandover','ac-901',{commercialId:id,...handover});return id;};

test('Recovered seed validates, round-trips, and retains eleven separately sourced outcomes',()=>{
  assert.deepEqual(M.validate(JSON.parse(JSON.stringify(state))),state);
  assert.equal(state.records.length,6);
  for(const r of state.records){assert.equal(Object.keys(r.outcomes).length,11);for(const f of Object.values(r.outcomes))assert.ok(f.source);}
});
test('Dates require a basis; sourced rules require exact source and revision',()=>{
  const p={planned:'2026-09-22',detail:'Customer requested a review after the next growing cycle.'};
  refuses(()=>act('plan','ac-901',p),/basis/);
  refuses(()=>act('plan','ac-901',{...p,basis:'Sourced rule'}),/Source reference/);
  act('plan','ac-901',{...p,basis:'User choice'});assert.equal(row().planned,p.planned);
  act('plan','ac-901',{basis:'User choice',dateNeeded:true,detail:'Waiting for the customer to choose an available date.'});
  assert.equal(row().planned,null);assert.equal(M.dueState(row()),'Date needed');
});
test('Restricted customer scope excludes records, searches, and summary projections',()=>{
  assert.equal(M.permitted(state,'training').length,5);
  assert.equal(M.query(state,'training',{...M.filters(),q:'Fernbank'}).length,0);
  assert.deepEqual(M.counts(state,'training',M.filters()),M.counts({...state,records:state.records.filter(r=>r.customer==='org-willowbank')},'training',M.filters()));
  refuses(()=>act('addTraining','ac-906',{},'training'),/outside.*scope/);
});
test('Read-only and capability refusals leave the session unchanged',()=>{
  refuses(()=>act('prepare','ac-901',{},'observer'),/read-only/);
  refuses(()=>act('prepareCommercial','ac-901',commercial,'training'),/capability/);
});
test('Combined filters retain explicit missing-date and source states',()=>{
  const r=state.records.find(r=>r.planned===null);assert.ok(r);
  const matches=M.query(state,'account',{...M.filters(),customer:r.customer,source:r.source.kind,due:'Date needed',q:r.ref});
  assert.deepEqual(matches.map(x=>x.id),[r.id]);
});
test('Feedback needs attribution and never certifies unrelated outcomes',()=>{
  const before=M.clone(row().outcomes);refuses(()=>act('feedback','ac-901',{...feedback,basis:'Verified'}),/feedback basis/);
  act('feedback','ac-901',feedback);assert.deepEqual(row().outcomes,before);assert.equal(row().review.feedback[0].basis,'Quoted');
});
test('Review completion refuses unresolved commitments without partial writes',()=>{
  prepareReview();refuses(()=>act('completeReview','ac-901',{summary:'Review completed with a positive customer response.'}),/commitment/);
});
test('Completed review changes only aftercare and retains owned obligations',()=>{
  const before=M.clone(row().outcomes);complete();assert.equal(row().review.state,'Completed');assert.ok(M.openObligations(row()).length>=3);
  for(const key of Object.keys(before))if(key!=='aftercareReview')assert.deepEqual(row().outcomes[key],before[key]);
});
test('Completed review resists overwriting and keeps corrections and source history',()=>{
  complete();const before=M.clone(row().review);
  refuses(()=>act('saveReview','ac-901',review),/correction/);
  act('correctReview','ac-901',{reason:'Customer clarified a point after the original review.',text:'The additional area is proposed for the next season.'});
  assert.deepEqual(row().review.feedback,before.feedback);assert.equal(row().review.completedAt,before.completedAt);assert.equal(row().review.corrections.length,1);
  act('scenario','ac-901',{change:'sourceChanged'});assert.equal(row().review.state,'Completed');assert.equal(row().review.corrections.length,2);
});
test('Existing cases are linked deliberately once without creating a second case',()=>{
  const c=state.sources.cases.find(c=>c.customer===row().customer),count=state.sources.cases.length;
  const p={caseRef:c.ref,symptom:'Customer reports the same outstanding irrigation issue.'};
  act('linkCase','ac-901',p);refuses(()=>act('linkCase','ac-901',p),/already linked/);assert.equal(state.sources.cases.length,count);
});
test('A new referral requires duplicate review and complete receiving context',()=>{
  refuses(()=>act('prepareReferral','ac-901',{...referral,reviewed:false}),/checked.*existing/);
  refuses(()=>act('prepareReferral','ac-901',{...referral,siteScope:''}),/site/);
});
test('Referral preparation, submission, return, correction and acceptance remain separate',()=>{
  const id=prepareReferral(),get=()=>row().concerns.find(c=>c.id===id);
  assert.equal(get().referral.state,'Prepared');act('submitReferral','ac-901',{concernId:id});assert.equal(get().referral.state,'Submitted');
  act('receiveReferral','ac-901',{concernId:id,outcome:'Returned',reason:'Provide the configuration and operating conditions.'},'service');
  const symptom=get().symptom;act('reviseReferral','ac-901',{concernId:id,addition:'Original configuration and operating conditions attached.'});
  assert.equal(get().symptom,symptom);assert.equal(get().referral.revisions,2);assert.match(get().referral.returnedReason,/configuration/);
  act('submitReferral','ac-901',{concernId:id});act('receiveReferral','ac-901',{concernId:id,outcome:'Accepted',receivingRef:'SYN-PPO-TKT-009991'},'service');
  assert.equal(get().referral.state,'Accepted');assert.notEqual(row().state,'Closed');
});
test('Unknown referral outcome blocks resubmission until reconciled',()=>{
  const id=prepareReferral();act('submitReferral','ac-901',{concernId:id});act('receiveReferral','ac-901',{concernId:id,outcome:'Unknown'},'service');
  refuses(()=>act('submitReferral','ac-901',{concernId:id}),/Only a prepared/);
  act('receiveReferral','ac-901',{concernId:id,outcome:'Accepted',receivingRef:'SYN-PPO-TKT-009992'},'service');
});
test('Training retains exact material applicability and missing-revision warnings',()=>{
  assert.match(row('ac-905').training[0].material.flag,/Superseded|superseded/);
  act('addTraining','ac-905',{participants:'Customer operators',topic:'Daily operation refresher',outcome:'Identify safe operating steps',trainer:'Morgan Ellis',target:'2026-09-24',assetId:'ast-502'},'training');
  const t=row('ac-905').training.at(-1);assert.match(t.material.flag,/unresolved|No applicable/);assert.equal(t.delivered,false);assert.equal(t.assessment,'Not assessed');
});
test('Training confirmation, attendance, delivery and assessment cannot imply one another',()=>{
  const id='tr-905-1',get=()=>row('ac-905').training[0];
  refuses(()=>act('attendance','ac-905',{trainingId:id,names:['Casey Taylor']},'training'),/confirmed arrangement/);
  refuses(()=>act('assessTraining','ac-905',{trainingId:id},'training'),/cannot precede/);
  act('confirmTraining','ac-905',{trainingId:id,confirmed:'2026-09-24',note:'Customer confirmed the proposed arrangement.',acknowledge:true},'training');
  assert.equal(get().attendance.length,0);act('attendance','ac-905',{trainingId:id,names:['Casey Taylor']},'training');assert.equal(get().delivered,false);
  act('deliverTraining','ac-905',{trainingId:id,evidence:'Trainer recorded the covered operation steps.',followUpOwner:'Morgan Ellis',followUpDue:'2026-09-25'},'training');
  assert.equal(get().assessment,'Not assessed');act('assessTraining','ac-905',{trainingId:id,assessment:'Assessed · further support needed',basis:'Observed a demonstration; technical work authority remains separate.'},'training');
  assert.equal(get().assessment,'Assessed · further support needed');
});
test('Document requests retain their separate owner and reject duplicates',()=>{
  const p={trainingId:'tr-905-1',what:'Current model-specific operating manual',owner:'Morgan Ellis',due:'2026-09-24'};
  const originals=M.clone(state.sources.documents);act('documentRequest','ac-905',p,'training');refuses(()=>act('documentRequest','ac-905',p,'training'),/already exists/);assert.deepEqual(state.sources.documents,originals);
});
test('Commercial preparation carries source observation and unresolved issues',()=>{
  act('prepareCommercial','ac-901',commercial);const c=row().commercial.at(-1);
  assert.equal(c.observation,commercial.observation);assert.ok(c.openIssues.length);assert.equal(c.state,'Discussion prepared');assert.equal(c.opportunityRef,'');
});
test('Linking an MA-05 review leaves the source agreement byte-for-byte unchanged',()=>{
  const agreements=JSON.stringify(state.sources.agreements),r=row('ac-904');
  const agreement=state.sources.agreements.find(a=>a.customer===r.customer&&a.renewalReview);
  act('linkRenewal','ac-904',{commercialId:r.commercial[0].id,agreementRef:agreement.ref});
  assert.equal(JSON.stringify(state.sources.agreements),agreements);assert.equal(row('ac-904').commercial[0].renewalReviewId,agreement.renewalReview.id);
});
test('A linked opportunity prevents a duplicate new handover',()=>{
  act('prepareCommercial','ac-901',commercial);const id=row().commercial.at(-1).id,existing=state.sources.opportunities.find(o=>o.customer===row().customer);
  act('linkOpportunity','ac-901',{commercialId:id,opportunityRef:existing.ref,reviewed:true});
  refuses(()=>act('prepareHandover','ac-901',{commercialId:id,...handover}),/already linked/);
});
test('Unknown CRM handover reconciles once without duplicate opportunities or qualification',()=>{
  const id=prepareHandover(),count=state.sources.opportunities.length;
  act('submitHandover','ac-901',{commercialId:id});act('receiveHandover','ac-901',{commercialId:id,outcome:'Unknown'},'commercial');
  refuses(()=>act('submitHandover','ac-901',{commercialId:id}),/Only a prepared/);
  act('receiveHandover','ac-901',{commercialId:id,outcome:'Accepted',receivingRef:'SYN-PPO-OPP-009991'},'commercial');
  assert.equal(state.sources.opportunities.length,count+1);assert.match(state.sources.opportunities.at(-1).qualification,/Not qualified/);
  refuses(()=>act('receiveHandover','ac-901',{commercialId:id,outcome:'Accepted',receivingRef:'SYN-PPO-OPP-009991'},'commercial'),/submitted handover/);
});
test('Existing receiving references cannot be accepted a second time',()=>{
  const id=prepareHandover();act('submitHandover','ac-901',{commercialId:id});
  refuses(()=>act('receiveHandover','ac-901',{commercialId:id,outcome:'Accepted',receivingRef:state.sources.opportunities[0].ref},'commercial'),/already exists/);
});
test('Stale session and record versions refuse atomically',()=>{
  const stale=command('prepare','ac-901');act('feedback','ac-901',feedback);
  refuses(()=>apply(stale),/session changed/);refuses(()=>act('prepare','ac-901',{recordVersion:1}),/record changed/);
});
test('Original operations replay once and cannot be reused with different content',()=>{
  const c=command('feedback','ac-901',feedback);apply(c);const before=JSON.stringify(state),r=apply(c);
  assert.equal(r.recovered,true);assert.equal(JSON.stringify(state),before);
  refuses(()=>apply({...c,payload:{...c.payload,text:'Different customer statement supplied later.'}}),/different content/);
});
test('Ownership changes preserve individual action owners',()=>{
  const obligations=M.clone(row().obligations);act('owners','ac-901',{accountOwner:'Avery Cole',reviewOwner:'Drew Wilson',reason:'Review ownership reassigned for planned leave.'});
  assert.deepEqual(row().obligations,obligations);assert.equal(row().reviewOwner,'Drew Wilson');
});
test('Closure cannot silently complete a review or outstanding obligations',()=>{
  refuses(()=>act('closeRecord','ac-901',{reason:'Attempt to close the aftercare record.'}),/Complete.*review/);
  complete();refuses(()=>act('closeRecord','ac-901',{reason:'Attempt to close the aftercare record.'}),/every open obligation/);
});
test('Malformed imports with invalid feedback, duplicate IDs or missing outcomes refuse',()=>{
  for(const corrupt of [s=>s.records.push(M.clone(s.records[0])),s=>delete s.records[0].outcomes.aftercareReview,s=>s.records[0].review.feedback.push({...feedback,basis:'Verified'})]){
    const s=M.clone(state);corrupt(s);assert.throws(()=>M.validate(s));
  }
});
const hash=relative=>createHash('sha256').update(fs.readFileSync(fileURLToPath(new URL(relative,import.meta.url)))).digest('hex');
console.log(JSON.stringify({module:'CR-05',suite:'Recovery model verification authored 2026-09-17',node:process.version,html_sha256:hash('../docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html'),model_sha256:hash('../docs/design/sales-aftercare/model.js'),groups:results.length,results},null,2));
