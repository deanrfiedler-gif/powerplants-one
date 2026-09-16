(function(root){
'use strict';
const TODAY='2026-09-16', clone=x=>structuredClone(x);
const REPLACEMENT_SCOPE='Replace the identified irrigation pump, retain the removed unit for investigation, commission the successor and record both serials. Excludes pipework changes and automatic maintenance transfer.';
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const text=(s,name,min=8)=>{assert(typeof s==='string'&&s.trim().length>=min&&s.length<=3000,`${name} needs ${min}–3,000 characters.`);return s.trim();};
const date=s=>{assert(/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Enter a valid calendar date.');return s;};
const choose=(s,values,name)=>{assert(values.includes(s),`Choose a valid ${name}.`);return s;};
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
const cents=s=>{assert(/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/.test(String(s)),'Use an AUD amount with no more than two decimal places.');const [a,b='']=String(s).split('.');return Number(a)*100+Number(b.padEnd(2,'0'));};
const owners=['Alex Morgan','Robin Ellis','Jordan Lee','Sam Patel','Taylor Reed'];
const roles={
 service:{name:'Alex Morgan',description:'Service owner',actions:['loadEvidence','addEvidence','reviewEvidence','assess','plan','authorise','request','execution','maintenance','communication','response','customerClose','followup','completeFollowup','assign']},
 coordinator:{name:'Robin Ellis',description:'Service coordinator',actions:['addEvidence','request','communication','response','followup','completeFollowup','assign']},
 commercial:{name:'Jordan Lee',description:'Commercial owner',actions:['goodwill','communication','response','followup','completeFollowup']},
 supplier:{name:'Sam Patel',description:'Supplier recovery owner',actions:['claim','submitClaim','supplierResponse','returnEvent','followup','completeFollowup']},
 finance:{name:'Taylor Reed',description:'Finance reviewer',actions:['credit','disposition','followup','completeFollowup']},
 observer:{name:'Read-only staff',description:'Permitted record preview',actions:[]},denied:{name:'No record access',description:'Access denied preview',actions:[]}
};
const can=(role,action)=>!!roles[role]?.actions.includes(action);
const source=c=>c.sources.at(-1),review=c=>c.reviews.filter(r=>r.evidenceRevision===c.evidenceRevision&&r.sourceRevision===source(c).revision).at(-1);
const assessment=c=>c.assessments.filter(a=>a.evidenceRevision===c.evidenceRevision&&a.sourceRevision===source(c).revision).at(-1);
const plan=c=>c.plans.at(-1),claim=c=>c.claims.at(-1),response=k=>k?.responses.at(-1);
const credited=k=>k?.credits.reduce((a,x)=>a+x.cents,0)||0;
const outstanding=k=>k?k.requestedCents-credited(k)-k.dispositions.reduce((a,x)=>a+x.cents,0):0;
const goodwill=(c,p=plan(c))=>c.goodwill.filter(g=>g.planId===p?.id).at(-1);
const basis=c=>({caseId:c.id,assetId:c.asset.id,serial:c.asset.serial,sourceRevision:source(c).revision,evidenceRevision:c.evidenceRevision,assessmentId:assessment(c)?.id||null});
const currentPlan=c=>{const p=plan(c);return p&&JSON.stringify(p.basis)===JSON.stringify(basis(c))?p:null;};
const authorisation=c=>{const p=currentPlan(c);return p?c.authorisations.find(a=>a.planId===p.id):null;};
const customerResponse=c=>c.responses.filter(r=>r.updateId===c.updates.at(-1)?.id).at(-1);
function customerState(c){const latest=c.updates.at(-1),r=customerResponse(c);return r?.status==='Accepted'&&!c.followups.some(f=>f.kind==='Customer'&&f.state==='Open')&&c.customerClosures.some(x=>x.updateId===latest?.id&&x.responseId===r.id)?'Resolved':c.execution?'Remedy completed':'Open';}
function phase(c){if(customerState(c)==='Resolved')return outstanding(claim(c))>0?'Customer resolved · recovery open':'Customer resolved';if(c.execution)return 'Customer review';if(authorisation(c))return 'Authorised remedy';if(plan(c))return 'Resolution planning';if(assessment(c))return 'Coverage reviewed';return 'Evidence review';}
function makeCase(n,title,customer,equipment){
 const id='wa-'+n;
 return {id,ref:`SYN-PPO-WAR-09010${n}`,title,customer,site:n===1?'Nursery & propagation':'Propagation site · fictional',siteId:n===1?'33000000-0000-4000-8000-000000000301':`SYN-WAR-SITE-${n}`,contact:n===1?'Casey Taylor':'Avery Brooks',owner:n===2?'Robin Ellis':'Alex Morgan',due:'2026-09-18',reported:TODAY,
 asset:{id:n===1?'33000000-0000-4000-8000-000000000501':`SYN-WAR-ASSET-${n}`,name:equipment,serial:n===2?null:`SYN-PUMP-24-00${n}`,identity:n===2?'Unverified':'Verified',location:n===1?'Irrigation Shed 01':'Plant room',serves:n===1?['Greenhouse 01','Tunnel 01','Propagation House 01']:['Propagation zone'],installation:'2024-03-08',commissioning:'2024-03-12',purchase:'2024-03-01'},
 symptom:n===1?'Moisture at the housing seal and unstable pressure were reported during routine maintenance. The cause has not been established.':n===2?'Intermittent controller restart. The photographed serial label is incomplete.':'Bearing noise reported after a restart; supplier responsibility remains disputed.',
 sources:[{revision:1,ref:`SYN-WAR-TERMS-${n} r01`,available:n!==2,warrantyStart:null,warrantyEnd:null,startBasis:'Signed customer handover date requires its own retained evidence.',terms:'Fictional demonstration only: defects in materials or manufacture for 24 months from the evidenced customer handover date. Wear, dry running, installation damage and unauthorised alterations are excluded. An in-period date does not prove covered causation. No response-time promise.',agreement:'SYN-PPO-AGR-080101 r02',agreementStart:'2026-07-01',agreementEnd:'2027-06-30',maintenanceTerms:'Routine inspection and cleaning only; repair and replacement are excluded.'}],
 evidenceRevision:1,evidence:[
 {id:`${id}-ev-1`,kind:'Finding',title:'Maintenance finding',ref:`SYN-WAR-FINDING-${n} r01`,date:TODAY,available:true,visibility:'Internal',content:n===1?'Seal moisture and pressure instability observed. No dismantling or root-cause conclusion. Preserve isolation and crop-access controls.':n===2?'Controller restarts intermittently. Serial identity and exact terms require clarification before intervention.':'Bearing noise observed after restart. Supplier alleges dry running; retain the disputed technical finding for review.'},
 {id:`${id}-ev-2`,kind:'Image reference',title:n===2?'Controller identity reference':'Housing and serial evidence',ref:`SYN-WAR-IMAGE-${n} r01`,date:TODAY,available:true,visibility:'Internal',content:'Illustrated location reference for the fictional scenario. No actual field photograph or measurement is supplied.',illustration:n===1},
 {id:`${id}-ev-3`,kind:'Purchase record',title:'Purchase and equipment identity',ref:`SYN-WAR-PURCHASE-${n} r01`,date:'2024-03-01',available:n!==2,visibility:'Internal',content:'Fictional purchase evidence identifies the supplied pump; purchase does not establish commissioning or warranty commencement.'},
 {id:`${id}-ev-4`,kind:'Handover record',title:'Warranty commencement evidence',ref:`SYN-WAR-HANDOVER-${n} r01`,date:null,available:false,visibility:'Internal',content:'Original handover evidence not yet available; warranty start/end stay unknown.'}
 ],reviews:[],assessments:[],plans:[],goodwill:[],authorisations:[],requests:[],execution:null,maintenanceReviews:[],updates:[],responses:[],customerClosures:[],claims:[],followups:[],history:[{id:`${id}-opening`,at:TODAY,actor:'Alex Morgan',text:'Fictional failure opened from a maintenance finding. Coverage and financial treatment remain unconfirmed.'}]};
}
function seed(){
 const cases=[makeCase(1,'Pump seal failure · Willowbank','Willowbank Horticulture','Irrigation pump 01'),makeCase(2,'Controller identity clarification','Willowbank Horticulture','Irrigation controller 02'),makeCase(3,'Supplier rejection · bearing noise','Riverbend Propagation · fictional','Transfer pump 03')];
 const c=cases[2];c.reported='2026-09-12';c.evidence[0].date='2026-09-12';c.evidence[1].date='2026-09-12';c.history[0].at='2026-09-12';c.claims.push({id:'SYN-WAR-CLAIM-090103',basis:basis(c),bytes:'Historical fictional claim reference; original package unavailable in this preview.',hash:null,owner:'Sam Patel',due:'2026-09-17',requestedCents:85000,currency:'AUD',tax:'Excluding tax',scope:'One pump bearing assembly',supplier:'Demonstration Pump Supplier',submission:{ref:'SYN-SUPPLIER-ACK-003',date:'2026-09-14'},responses:[{id:'seed-response-3',status:'Rejected',approvedCents:0,ref:'SYN-SUPPLIER-DECISION-003',reason:'Supplier alleges dry running; customer disputes the cause. Technical review remains owned.',date:'2026-09-15',owner:'Sam Patel',due:'2026-09-17'}],returns:[],credits:[],dispositions:[]});
 return {schema:1,version:1,asAt:TODAY,cases,receipts:{}};
}
function gates(c){const p=currentPlan(c),a=assessment(c),g=goodwill(c,p),b=[];if(!p)b.push('Prepare a resolution plan against the current evidence and assessment.');if(!review(c))b.push('Review the current evidence set.');if(c.asset.identity!=='Verified'||!c.asset.serial)b.push('Verified equipment identity is required.');if(!source(c).available)b.push('The exact terms are unavailable.');if(!a)b.push('Record a current coverage assessment.');if(p&&p.kind!=='Investigate'&&a?.status!=='Covered'&&g?.decision!=='Approved')b.push('A non-covered or disputed remedy needs a separate Commercial goodwill decision for this exact plan.');return b;}
function validState(s){
 try{
  const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x),str=x=>typeof x==='string',stamp=x=>str(x)&&!Number.isNaN(Date.parse(x)),cash=x=>Number.isSafeInteger(x)&&x>=0;
  const lists=['reviews','assessments','plans','goodwill','authorisations','requests','maintenanceReviews','updates','responses','customerClosures','claims','followups','history'];
  return obj(s)&&s.schema===1&&Number.isInteger(s.version)&&s.version>0&&obj(s.receipts)&&Array.isArray(s.cases)&&s.cases.length>0&&s.cases.length<=30&&new Set(s.cases.map(c=>c.id)).size===s.cases.length&&s.cases.every(c=>
   obj(c)&&['id','ref','title','customer','owner','site','siteId','contact','symptom'].every(k=>str(c[k]))&&stamp(c.due)&&stamp(c.reported)&&obj(c.asset)&&['id','name','identity','location'].every(k=>str(c.asset[k]))&&Array.isArray(c.asset.serves)&&c.asset.serves.every(str)&&['purchase','installation','commissioning'].every(k=>stamp(c.asset[k]))&&
   Array.isArray(c.sources)&&c.sources.length>0&&c.sources.every(v=>obj(v)&&Number.isInteger(v.revision)&&str(v.terms)&&[v.warrantyStart,v.warrantyEnd,v.agreementStart,v.agreementEnd].every(d=>d===null||stamp(d)))&&
   Number.isInteger(c.evidenceRevision)&&Array.isArray(c.evidence)&&c.evidence.every(e=>obj(e)&&str(e.id)&&str(e.ref)&&str(e.content)&&(e.date===null||stamp(e.date)))&&
   lists.every(k=>Array.isArray(c[k])&&c[k].every(obj))&&c.history.every(h=>stamp(h.at)&&str(h.text))&&c.followups.every(f=>str(f.title)&&stamp(f.due))&&c.plans.every(p=>obj(p.basis)&&stamp(p.target))&&
   c.claims.every(k=>cash(k.requestedCents)&&stamp(k.due)&&['responses','returns','credits','dispositions'].every(x=>Array.isArray(k[x])&&k[x].every(obj))&&k.responses.every(r=>cash(r.approvedCents)&&stamp(r.date))&&k.credits.every(r=>cash(r.cents)&&str(r.ref)&&stamp(r.date))&&k.returns.every(r=>stamp(r.date))&&k.dispositions.every(r=>cash(r.cents)))&&
   c.assessments.every(a=>stamp(a.due)&&stamp(a.at))&&c.responses.every(r=>stamp(r.date))&&c.updates.every(u=>str(u.bytes)&&str(u.hash))&&
   (!c.execution||(obj(c.execution.replacement)&&str(c.execution.replacement.id)&&obj(c.execution.originalAsset)&&obj(c.execution.maintenance)&&stamp(c.execution.date)&&stamp(c.execution.maintenance.originalDue)&&stamp(c.execution.maintenance.due)))
  );
 }catch{return false;}
}
async function command(original,cmd,role){
 assert(validState(original),'Saved state is unsupported; retain the original backup.');assert(can(role,cmd.type),'This preview role cannot perform this action.');assert(typeof cmd.op==='string'&&cmd.op.length>5,'An operation identity is required.');
 const fingerprint=JSON.stringify(cmd),receipt=original.receipts[cmd.op];if(receipt){assert(receipt.fingerprint===fingerprint&&receipt.role===role,'This operation identity belongs to different content or another role.');return {state:clone(original),replayed:true,message:'Recovered the original result without a duplicate effect.'};}
 assert(cmd.expectedVersion===original.version,'The record changed. Your form is retained; reopen it against the current version.');
 const s=clone(original),c=s.cases.find(x=>x.id===cmd.caseId);assert(c,'The selected case is unavailable.');const p=cmd.payload||{},actor=roles[role].name,at=new Date().toISOString(),id=`${c.id}-${cmd.type}-${s.version+1}`,v=source(c),a=assessment(c),pl=plan(c),k=claim(c);
 let message='Saved the reviewed change.';const requiredConfirm=()=>assert(p.confirm===true,'Confirm the exact evidence and separate decisions.');const owner=x=>choose(x,owners,'owner');const due=x=>{date(x);assert(x>=TODAY,'Choose today or a later follow-up date.');return x;};
 switch(cmd.type){
 case 'loadEvidence':{
  assert(c.id==='wa-1'&&c.sources.length===1,'The missing-evidence fixture is only available once for Willowbank.');requiredConfirm();
  c.sources.push({...clone(v),revision:2,warrantyStart:'2024-09-26',warrantyEnd:'2026-09-25',startBasis:'SYN-WAR-HANDOVER-1 r02 explicitly records the fictional commencement and end dates.'});
  c.evidence.push({id:'wa-1-ev-5',kind:'Handover record',title:'Recovered signed handover · successor',ref:'SYN-WAR-HANDOVER-1 r02',date:'2024-09-26',available:true,visibility:'Internal',content:'Fictional recovered record: warranty starts 26 September 2024 and ends 25 September 2026 for the verified serial. Original missing-reference record is retained.',supersedes:'wa-1-ev-4'});c.evidenceRevision++;message='Retained the recovered source; evidence and coverage require fresh review.';break;
 }
 case 'addEvidence':{
  requiredConfirm();const ref=text(p.ref,'Evidence reference',3);assert(!c.evidence.some(e=>e.ref.toLowerCase()===ref.toLowerCase()),'That exact evidence reference is already retained.');c.evidence.push({id,kind:choose(p.kind,['Finding','Image reference','Technical report','Purchase record','Correspondence'],'evidence kind'),title:text(p.title,'Evidence title',3),ref,date:date(p.date),available:true,visibility:'Internal',content:text(p.content,'Evidence notes')});c.evidenceRevision++;message='Added an internal evidence reference. Earlier evidence and decisions are retained.';break;
 }
 case 'reviewEvidence':{
  requiredConfirm();c.reviews.push({id,evidenceRevision:c.evidenceRevision,sourceRevision:v.revision,evidenceIds:c.evidence.filter(e=>e.available).map(e=>e.id),reason:text(p.reason,'Review basis'),actor,at});message='Reviewed the exact evidence set; missing facts remain unknown.';break;
 }
 case 'assess':{
  requiredConfirm();assert(review(c),'Review the current evidence set first.');const status=choose(p.status,['Unknown','Disputed','Covered','NotCovered','NotApplicable'],'coverage status'),cause=choose(p.cause,['Unconfirmed','Manufacturing defect','Installation damage','Wear','No fault found'],'cause assessment');
  if(status==='Covered'){assert(v.available&&c.asset.identity==='Verified'&&v.warrantyStart&&v.warrantyEnd,'Covered requires exact available terms, verified identity and sourced warranty dates.');assert(c.reported>=v.warrantyStart&&c.reported<=v.warrantyEnd,'The recorded failure is outside the sourced demonstration period.');assert(cause==='Manufacturing defect','This fictional source covers manufacturing defects only; date eligibility does not settle causation.');}
  c.assessments.push({id,status,cause,sourceRevision:v.revision,evidenceRevision:c.evidenceRevision,reviewId:review(c).id,reason:text(p.reason,'Assessment basis'),owner:owner(p.owner),due:due(p.due),finance:'Finance review required',actor,at});message='Recorded coverage and causation; billing and supplier responsibility remain separate.';break;
 }
 case 'plan':{
  requiredConfirm();assert(a&&review(c),'Review evidence and record a current coverage assessment first.');assert(!c.execution,'The completed remedy is retained; use an owned follow-up for further work.');const kind=choose(p.kind,['Investigate','Repair','Return','Replace','Loan'],'resolution type');
  c.plans.push({id,revision:c.plans.length+1,kind,basis:basis(c),scope:text(p.scope,'Exact work scope'),owner:owner(p.owner),target:due(p.target),access:text(p.access,'Access and shutdown review'),reason:text(p.reason,'Resolution rationale'),actor,at});message='Prepared a new resolution plan; work authority and any earlier plan remain separate.';break;
 }
 case 'goodwill':{
  requiredConfirm();assert(currentPlan(c)&&!authorisation(c),'Goodwill must refer to a current plan before its authorisation.');c.goodwill.push({id,planId:pl.id,decision:choose(p.decision,['Approved','Declined'],'goodwill decision'),reason:text(p.reason,'Commercial decision basis'),authority:text(p.authority,'Commercial authority reference',3),actor,at});message='Recorded the Commercial decision for this exact plan; warranty entitlement and Finance remain unchanged.';break;
 }
 case 'authorise':{
  requiredConfirm();assert(!gates(c).length,gates(c).join(' '));assert(!authorisation(c),'This exact plan already has an authorisation.');c.authorisations.push({id,planId:pl.id,basis:clone(pl.basis),scope:pl.scope,authority:text(p.authority,'Work authority reference',3),reason:text(p.reason,'Authorisation basis'),goodwillId:goodwill(c)?.id||null,actor,at});message='Recorded local work authorisation; crew booking and billing are still separate.';break;
 }
 case 'request':{
  requiredConfirm();assert(authorisation(c),'The current exact resolution plan needs work authorisation.');assert(!c.requests.some(r=>r.planId===pl.id),'This plan already has a retained work request.');const b={...clone(pl.basis),planId:pl.id,authorisationId:authorisation(c).id,kind:pl.kind,scope:pl.scope,target:pl.target,access:pl.access,siteId:c.siteId};const bytes=JSON.stringify(b);c.requests.push({id,planId:pl.id,owner:owner(p.owner),note:text(p.note,'Receiving context'),basis:b,bytes,hash:await hash(bytes),state:'Prepared locally',actor,at});message='Retained one exact work request; no booking or dispatch was created.';break;
 }
 case 'execution':{
  requiredConfirm();assert(c.id==='wa-1'&&currentPlan(c)?.kind==='Replace','The embedded later-step result is for the Willowbank replacement only.');assert(pl.scope===REPLACEMENT_SCOPE&&pl.target==='2026-09-19','The embedded result matches only the default fictional replacement scope and 19 September target. Changed work needs its own receiving evidence.');const r=c.requests.find(r=>r.planId===pl.id);assert(r&&authorisation(c),'Prepare the authorised replacement request first.');assert(!c.execution,'This reviewed result has already been retained.');assert(JSON.stringify(r.basis)===r.bytes&&await hash(r.bytes)===r.hash,'The retained request integrity check failed.');
  c.execution={id,requestId:r.id,requestHash:r.hash,planId:pl.id,ref:'SYN-WAR-SERVICE-RESULT-01 r01',date:'2026-09-19',outcome:'Replacement completed',originalAsset:clone(c.asset),removedDisposition:'Removed and quarantined at site; supplier return receipt not established',replacement:{id:'SYN-WAR-ASSET-REPLACEMENT-001',name:'Irrigation pump 01 · replacement',serial:'SYN-PUMP-26-REPL-001',installation:'2026-09-19',commissioning:'2026-09-19',warrantyStart:null,warrantyEnd:null,predecessor:c.asset.id},maintenance:{occurrence:'plan-1@2026-09-15',originalDue:'2026-09-15',state:'Review required',owner:owner(p.owner),due:due(p.due),note:'Retain the original obligation; review future task scope, source, warranty and scheduled work separately.'},actor,at};message='Retained the fictional service result and both asset identities; warranty and maintenance were not transferred.';break;
 }
 case 'maintenance':{
  requiredConfirm();assert(c.execution,'Review the replacement result first.');c.maintenanceReviews.push({id,executionId:c.execution.id,disposition:choose(p.disposition,['Hold future generation','Prepare successor plan review','No transfer — further evidence required'],'maintenance disposition'),owner:owner(p.owner),due:due(p.due),reason:text(p.reason,'Maintenance impact review'),actor,at});message='Recorded an owned maintenance review; no external plan, occurrence or booking changed.';break;
 }
 case 'communication':{
  requiredConfirm();assert(c.execution,'A reviewed remedy result is required for this customer outcome update.');const b={caseRef:c.ref,revision:c.updates.length+1,recipient:c.contact,customer:c.customer,asset:c.asset.name,remedy:c.execution.outcome,body:text(p.body,'Customer-safe update'),resultRef:c.execution.ref};const bytes=JSON.stringify(b);c.updates.push({id,...b,bytes,hash:await hash(bytes),state:'Prepared locally — not sent',actor,at});message='Retained an exact customer update revision. Nothing was sent.';break;
 }
 case 'response':{
  requiredConfirm();const u=c.updates.at(-1);assert(u&&p.updateId===u.id,'Select the exact current customer update revision.');assert(date(p.date)>=c.execution.date,'Customer response cannot predate the reviewed remedy.');const status=choose(p.status,['Accepted','Reservations','Disagreed','Unavailable'],'customer response');const r={id,updateId:u.id,updateHash:u.hash,status,respondent:c.contact,presentationRef:text(p.presentationRef,'Presentation evidence',3),date:date(p.date),reason:text(p.reason,'Response evidence'),actor,at};if(status!=='Accepted'){r.owner=owner(p.owner);r.due=due(p.due);c.followups.push({id:id+'-followup',kind:'Customer',owner:r.owner,due:r.due,title:r.reason,state:'Open',source:id,actor,at});}c.responses.push(r);message='Retained the response against the exact content presented; supplier recovery remains independent.';break;
 }
 case 'customerClose':{
  requiredConfirm();const u=c.updates.at(-1),r=customerResponse(c);assert(c.execution&&u&&r&&r.status==='Accepted','The reviewed remedy and exact current update need an Accepted customer response.');assert(!c.followups.some(f=>f.kind==='Customer'&&f.state==='Open'),'Complete or explicitly resolve the customer follow-up before recording customer resolution.');assert(!c.customerClosures.some(x=>x.updateId===u.id&&x.responseId===r.id),'Customer resolution is already recorded for this update.');c.customerClosures.push({id,updateId:u.id,responseId:r.id,reason:text(p.reason,'Customer resolution basis'),actor,at});message='Customer resolution recorded; supplier recovery and maintenance actions retain their own status.';break;
 }
 case 'claim':{
  requiredConfirm();assert(review(c)&&a&&v.available&&c.asset.identity==='Verified','Review exact evidence, terms, identity and coverage before preparing a claim.');assert(!k,'This bounded design supports one retained supplier claim per case.');const amount=cents(p.amount);assert(amount>0,'The claimed amount must be greater than zero.');const b={...basis(c),source:clone(v),reviewId:review(c).id,evidenceIds:review(c).evidenceIds,evidence:clone(c.evidence.filter(e=>review(c).evidenceIds.includes(e.id))),supplier:text(p.supplier,'Supplier',3),scope:text(p.scope,'Claim scope'),requestedCents:amount,currency:'AUD',tax:'Excluding tax'};const bytes=JSON.stringify(b);c.claims.push({id,basis:b,bytes,hash:await hash(bytes),supplier:b.supplier,scope:b.scope,requestedCents:amount,currency:'AUD',tax:'Excluding tax',owner:owner(p.owner),due:due(p.due),submission:null,responses:[],returns:[],credits:[],dispositions:[],actor,at});message='Prepared the exact supplier claim package; no claim was sent or receivable recognised.';break;
 }
 case 'submitClaim':{
  requiredConfirm();assert(k&&!k.submission,'Select an unsubmitted retained claim.');assert(date(p.date)>=c.reported,'Claim submission cannot predate the reported failure.');k.submission={ref:text(p.ref,'External submission evidence',3),date:date(p.date),actor,at};message='Recorded fictional submission evidence; this HTML sent nothing.';break;
 }
 case 'supplierResponse':{
  requiredConfirm();assert(k?.submission&&outstanding(k)>0,'An externally submitted, unresolved claim is required.');assert(date(p.date)>=(response(k)?.date||k.submission.date),'Supplier response cannot predate retained submission or response evidence.');const status=choose(p.status,['Reviewing','More information','Approved','Partially approved','Rejected'],'supplier response'),amount=cents(p.amount||'0');assert(amount>=credited(k)&&amount<=k.requestedCents,'Approved amount must cover retained credits and cannot exceed the claim.');if(['Approved','Partially approved'].includes(status)){assert(amount>0,'Record a positive approved amount.');if(status==='Approved')assert(amount===k.requestedCents,'Full approval must equal the exact claimed amount.');else assert(amount<k.requestedCents,'Partial approval must be less than the claim.');}else assert(amount===0,'A pending or rejected response cannot declare approved recovery.');k.responses.push({id,status,approvedCents:amount,ref:text(p.ref,'Supplier evidence reference',3),reason:text(p.reason,'Supplier response basis'),date:date(p.date),owner:owner(p.owner),due:due(p.due),actor,at});k.owner=p.owner;k.due=p.due;message='Retained supplier evidence; customer remedy and ERP credit remain unchanged.';break;
 }
 case 'returnEvent':{
  requiredConfirm();assert(k,'Prepare a supplier claim before linking the return.');const kind=choose(p.kind,['Authorised','Received','Disposed','Not required'],'return event');assert(!k.returns.some(x=>x.kind===kind),'That return event is already retained.');if(kind==='Received')assert(k.returns.some(x=>x.kind==='Authorised'),'Retain the return-authorisation evidence first.');if(kind==='Disposed')assert(k.returns.some(x=>x.kind==='Received'),'Retain physical receipt before disposition.');assert(!k.returns.some(x=>x.kind==='Not required'),'A retained no-return decision requires a future controlled successor, not an automatic reversal.');if(kind==='Not required')assert(!k.returns.length,'A physical return history cannot be replaced by Not required.');assert(date(p.date)>=(k.returns.at(-1)?.date||c.reported),'Return evidence cannot predate the failure or prior return event.');k.returns.push({id,kind,ref:text(p.ref,'Return evidence reference',3),date:date(p.date),quantity:1,unit:'each',serial:c.asset.serial,reason:text(p.reason,'Return condition and disposition'),actor,at});message='Retained the separate return evidence; no stock or supplier credit was posted.';break;
 }
 case 'credit':{
  requiredConfirm();assert(k&&['Approved','Partially approved'].includes(response(k)?.status),'Current supplier approval evidence is required before linking a credit.');assert(outstanding(k)>0,'Recovery is already disposed.');const amount=cents(p.amount),ref=text(p.ref,'ERP credit reference',3);assert(amount>0&&credited(k)+amount<=response(k).approvedCents,'Credit exceeds the remaining approved amount.');assert(!s.cases.some(x=>x.claims.some(y=>y.credits.some(z=>z.ref.toLowerCase()===ref.toLowerCase()))),'That ERP credit reference is already linked.');assert(date(p.date)>=response(k).date,'Credit evidence cannot predate its supplier approval.');k.credits.push({id,ref,company:text(p.company,'ERP company',3),date:date(p.date),cents:amount,currency:'AUD',tax:'Excluding tax',claimId:k.id,approvalId:response(k).id,reason:text(p.reason,'Finance matching evidence'),actor,at});message='Linked fictional ERP credit evidence; no financial transaction was created.';break;
 }
 case 'disposition':{
  requiredConfirm();assert(k&&k.submission&&['Rejected','Approved','Partially approved'].includes(response(k)?.status)&&outstanding(k)>0,'A final supplier response and unresolved amount are required.');k.dispositions.push({id,cents:outstanding(k),decision:'Unrecovered — reviewed closure',ref:text(p.ref,'Finance disposition evidence',3),reason:text(p.reason,'Unrecovered closure basis'),actor,at});message='Closed the outstanding recovery as unrecovered; it is not credited or recovered cash.';break;
 }
 case 'followup':{
  c.followups.push({id,kind:choose(p.kind,['Customer','Technical','Supplier','Finance'],'follow-up type'),title:text(p.title,'Next action'),owner:owner(p.owner),due:due(p.due),state:'Open',actor,at});message='Assigned a separate follow-up with its own owner and due date.';break;
 }
 case 'completeFollowup':{
  const f=c.followups.find(x=>x.id===p.followupId);assert(f&&f.state==='Open','Select an open follow-up.');assert(role==='service'||f.owner===actor,'The assigned owner or Service owner must complete this follow-up.');f.state='Completed';f.outcome=text(p.reason,'Completion outcome');f.completedBy=actor;f.completedAt=at;message='Recorded the follow-up outcome without closing other obligations.';break;
 }
 case 'assign':c.owner=owner(p.owner);c.due=due(p.due);text(p.reason,'Ownership reason');message='Updated the next case review owner and date.';break;
 default:throw new Error('Unsupported warranty action.');
 }
 c.history.push({id,at,actor,text:message,reason:p.reason||p.note||null});s.version++;s.receipts[cmd.op]={fingerprint,role,resultId:id};return {state:s,message,replayed:false};
}
root.WA_MODEL={TODAY,REPLACEMENT_SCOPE,clone,escape,assert,text,date,cents,hash,owners,roles,can,seed,validState,source,review,assessment,plan,claim,response,credited,outstanding,goodwill,basis,currentPlan,authorisation,customerResponse,customerState,phase,gates,command};
})(typeof window==='undefined'?globalThis:window);
