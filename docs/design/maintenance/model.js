(function (root) {
  'use strict';
  const TODAY = '2026-09-15';
  const clone = x => structuredClone(x);
  const escape = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const text = (s, name, min = 8) => { assert(typeof s === 'string' && s.trim().length >= min && s.length <= 2000, `${name} needs ${min}–2,000 characters.`); return s.trim(); };
  function date(s) { assert(/^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s, 'Enter a valid calendar date.'); return s; }
  const choose = (x, values, name) => { assert(values.includes(x), `Choose a valid ${name}.`); return x; };
  const hash = async s => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), n => n.toString(16).padStart(2,'0')).join('');
  const roles = {
    service: {name:'Alex Morgan', description:'Service owner', actions:['coverage','reviewPlan','revisePlan','generate','exception','request','reconcile','assign','renewal','sourceScenario']},
    coordinator: {name:'Robin Ellis', description:'Service coordinator', actions:['request','assign','renewal']},
    commercial: {name:'Jordan Lee', description:'Commercial owner', actions:['renewal','renewalTerms']},
    observer: {name:'Casey Taylor', description:'Read-only staff preview', actions:[]},
    denied: {name:'No record access', description:'Access denied preview', actions:[]}
  };
  const owners = ['Alex Morgan','Robin Ellis','Jordan Lee'];
  const can = (role, action) => !!roles[role]?.actions.includes(action);
  const current = a => a.versions.at(-1);
  const plan = a => a.plans.at(-1);
  const assessment = a => a.assessments.filter(x => x.agreementRevision === current(a).revision && x.sourceFingerprint === current(a).sourceFingerprint).at(-1);
  function monthDate(anchor, offset) {
    date(anchor); const d = new Date(anchor + 'T00:00:00Z'), day = d.getUTCDate();
    const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth()+1, 0)).getUTCDate();
    first.setUTCDate(Math.min(day, last)); return first.toISOString().slice(0,10);
  }
  const taskSeed = () => [
    {id:'task-01', title:'Inspect and clean the suction filter', evidence:'Before/after condition and cleaning record', area:'Irrigation Shed 01', source:'SYN-MA-PROCEDURE-01 r01 §2'},
    {id:'task-02', title:'Record pressure during the restart observation', evidence:'Reading, unit and eligible instrument reference', area:'Shared irrigation supply', source:'SYN-MA-PROCEDURE-01 r01 §3'},
    {id:'task-03', title:'Observe the housing seal and record findings', evidence:'Observed condition; any unverified cause remains unverified', area:'Irrigation Shed 01', source:'SYN-MA-PROCEDURE-01 r01 §4'}
  ];
  const templates = () => ({
    routine:{key:'routine',title:'Routine irrigation pump care',interval:1,ruleSource:'SYN-MA-PROCEDURE-01 r01 §1',sourceRule:'Fictional calendar-month example: one month from the original anchor; clamp to the last valid day, preserve the anchor for subsequent months. Late visits and deferrals do not shift future due dates.',tasks:taskSeed()},
    seasonal:{key:'seasonal',title:'Seasonal filter and seal observation',interval:3,ruleSource:'SYN-MA-PROCEDURE-02 r01 §1',sourceRule:'Fictional alternative template: every three calendar months from the unchanged original anchor. Filter cleaning and seal observation only; no pressure verification task. Retain existing obligations; future ungenerated dates require review of this exact source.',tasks:taskSeed().filter(t=>t.id!=='task-02')}
  });
  function makeAgreement(n, title, status='Active', expiry='2027-06-30') {
    const id=`ma-${n}`, sourceFingerprint=`SYN-SOURCE-${n}-r02`;
    return {id, ref:`SYN-PPO-AGR-08010${n}`, title, customer:'Willowbank Horticulture', site:'Nursery & propagation', siteId:'33000000-0000-4000-8000-000000000301', equipment:'Irrigation pump 01', equipmentId:'33000000-0000-4000-8000-000000000501', owner:'Alex Morgan', commercialOwner:'Jordan Lee', contact:'Casey Taylor · nursery manager', versions:[{
      revision:2, status, start:'2026-07-01', expiry, installation:'2024-03-08', commissioning:'2024-03-12', warrantyStart:null, warrantyEnd:null,
      sourceRef:`SYN-AGREEMENT-${n} r02`, sourceFingerprint, available:true, sourceTitle:'Demonstration agreement — fictional terms',
      terms:'Routine inspection, filter cleaning, restart pressure observation and housing-seal condition recording for the listed pump. Repairs, replacement parts, controller changes and growing-area pipework are excluded. No response-time or repair-time guarantee is specified.',
      coveredAreas:['Greenhouse 01','Propagation House 01'], excludedAreas:['Tunnel 01 pipework'], servedAreas:['Greenhouse 01','Tunnel 01','Propagation House 01'],
      dateBasis:'Agreement dates are fictional source facts. Installation, commissioning and warranty dates have independent evidence; no warranty start is inferred.',
      response:'Contact arrangements by agreement. No SLA clock or 24/7 attendance commitment.', charging:'Separate Finance review of exact work and contract evidence.'
    }], assessments:[], plans:[{id:`plan-${n}`, revision:1, agreementRevision:2, sourceFingerprint, title:'Routine irrigation pump care', anchor:'2026-09-15', interval:1, timezone:'Australia/Brisbane', effective:'2026-09-01', until:expiry, owner:'Alex Morgan', review:{actor:'Alex Morgan', at:'2026-09-01T02:00:00Z'}, ruleSource:'SYN-MA-PROCEDURE-01 r01 §1', sourceRule:'Fictional calendar-month example: one month from the original anchor; clamp to the last valid day, preserve the anchor for subsequent months. Late visits and deferrals do not shift future due dates.', tasks:taskSeed(), reason:'Original demonstration plan.'}], occurrences:[], renewals:[], history:[{at:'2026-09-01T02:00:00Z', actor:'Jordan Lee', text:'Fictional agreement source r02 and reviewed plan r01 loaded for design review.'}]};
  }
  function occurrence(a, due, p=plan(a)) {
    return {id:`${p.id}@${due}`, agreementId:a.id, agreementRevision:p.agreementRevision, planId:p.id, planRevision:p.revision, sourceFingerprint:p.sourceFingerprint, originalDue:due, target:due, timezone:p.timezone, owner:p.owner, state:'Due', tasks:clone(p.tasks), exceptions:[], requests:[], results:[], history:[]};
  }
  function seed() {
    const agreements=[makeAgreement(1,'Irrigation care · Willowbank'),makeAgreement(2,'Seasonal pump inspection','Active','2026-10-31'),makeAgreement(3,'Propagation support renewal','Expired','2026-08-31'),makeAgreement(4,'Shared irrigation scope review','Draft','2027-03-31'),makeAgreement(5,'Legacy service agreement','Active','2026-12-31')];
    agreements[1].equipment='Seasonal pump · synthetic reference'; agreements[1].equipmentId='SYN-MA-EQUIPMENT-002'; agreements[1].plans[0].anchor='2026-10-15';
    agreements[2].plans[0].until='2026-08-31'; agreements[3].plans[0].review=null; agreements[4].versions[0].available=false;
    for (const a of agreements) { if(a.id!=='ma-3') a.occurrences.push(occurrence(a,plan(a).anchor)); }
    const a=agreements[1]; a.assessments.push({id:'seed-review-2',agreementRevision:2,sourceFingerprint:current(a).sourceFingerprint,status:'Covered',route:'FinanceReview',reason:'Routine task scope and listed synthetic asset match the fictional source.',actor:'Alex Morgan',at:'2026-09-02T00:00:00Z'});
    return {schema:1,version:1,asAt:TODAY,agreements,receipts:{}};
  }
  function gates(a,o) {
    const v=current(a), p=o?a.plans.find(x=>x.revision===o.planRevision):plan(a), c=assessment(a), b=[];
    if(v.status!=='Active') b.push(`Agreement is ${v.status.toLowerCase()}.`);
    if(!v.available) b.push('The exact agreement source is unavailable.');
    const day=o?.target||TODAY;
    if(day<v.start||day>v.expiry) b.push('Requested work falls outside the agreement dates.');
    if(!c||c.status!=='Covered') b.push('The exact task scope needs a current Covered assessment.');
    if(!p?.review) b.push('The applicable plan revision needs review.');
    if(p?.agreementRevision!==v.revision||p?.sourceFingerprint!==v.sourceFingerprint) b.push('Plan and agreement source no longer match; reconcile the plan revision.');
    if(o&&['Skipped','Cancelled','Completed'].includes(o.state)) b.push(`This occurrence is ${o.state.toLowerCase()}.`);
    return b;
  }
  function preview(a, through) {
    date(through); const p=plan(a); assert(through>=TODAY&&through<=monthDate(TODAY,12),'Choose a generation window within the next 12 months.');
    const rows=[]; for(let k=0;k<240;k++) {
      const d=monthDate(p.anchor,k*p.interval); if(d>through||d>p.until) break;
      if(d<TODAY||d<p.effective) continue;
      const existing=a.occurrences.find(o=>o.planId===p.id&&o.originalDue===d);
      rows.push({due:d,id:`${p.id}@${d}`,existing:!!existing,retainedRevision:existing?.planRevision,planRevision:p.revision});
    } return rows;
  }
  const remaining = o => { const last=o.results.at(-1); return o.tasks.filter(t=>!last||last.tasks.find(x=>x.id===t.id)?.outcome!=='Completed'); };
  function requestBasis(a,o) {
    const c=assessment(a);
    const followup=o.results.at(-1)?.remainingDue;
    return {occurrenceId:o.id,agreementRef:a.ref,agreementRevision:o.agreementRevision,planId:o.planId,planRevision:o.planRevision,sourceFingerprint:o.sourceFingerprint,coverageId:c?.id,target:followup&&followup>o.target?followup:o.target,siteId:a.siteId,equipmentId:a.equipmentId,tasks:remaining(o).map(x=>x.id),outcomeCount:o.results.length};
  }
  function validState(s) {
    const validDate=x=>{try{date(x);return true;}catch{return false;}};
    try { return !!s&&s.schema===1&&Number.isInteger(s.version)&&Array.isArray(s.agreements)&&s.agreements.length>0&&s.agreements.length<=30&&s.receipts&&typeof s.receipts==='object'&&s.agreements.every(a=>a.id&&a.ref&&Array.isArray(a.versions)&&a.versions.length&&a.versions.every(v=>Number.isInteger(v.revision)&&v.sourceFingerprint&&validDate(v.start)&&validDate(v.expiry)&&[v.installation,v.commissioning,v.warrantyStart,v.warrantyEnd].every(x=>x==null||validDate(x))&&Array.isArray(v.coveredAreas)&&Array.isArray(v.servedAreas)&&Array.isArray(v.excludedAreas))&&Array.isArray(a.plans)&&a.plans.length&&a.plans.every(p=>Number.isInteger(p.interval)&&p.interval>0&&p.interval<=12&&validDate(p.anchor)&&validDate(p.effective)&&validDate(p.until)&&Array.isArray(p.tasks)&&p.tasks.length&&p.tasks.every(t=>t.id&&t.title))&&Array.isArray(a.occurrences)&&a.occurrences.every(o=>o.id&&validDate(o.originalDue)&&validDate(o.target)&&Array.isArray(o.tasks)&&Array.isArray(o.requests)&&o.requests.every(r=>r.basis&&Array.isArray(r.basis.tasks)&&validDate(r.basis.target)&&typeof r.bytes==='string'&&typeof r.hash==='string')&&Array.isArray(o.results)&&o.results.every(r=>Array.isArray(r.tasks)&&validDate(r.remainingDue))&&Array.isArray(o.exceptions)&&Array.isArray(o.history))&&Array.isArray(a.assessments)&&Array.isArray(a.renewals)&&a.renewals.every(r=>validDate(r.due)&&Array.isArray(r.proposals)&&r.proposals.every(p=>validDate(p.start)&&validDate(p.end)))&&Array.isArray(a.history)); } catch { return false; }
  }
  async function command(original,cmd,role) {
    assert(can(role,cmd.type),'This preview role cannot perform this action.');
    assert(typeof cmd.op==='string'&&cmd.op.length>5,'An operation identity is required.');
    const fingerprint=JSON.stringify(cmd), receipt=original.receipts[cmd.op];
    if(receipt) { assert(receipt.fingerprint===fingerprint&&receipt.role===role,'This operation identity belongs to different content or a different role.'); return {state:clone(original),replayed:true,message:'Original save recovered without a duplicate effect.'}; }
    assert(cmd.expectedVersion===original.version,'The workspace changed. Your form is retained; reopen it against the current record.');
    const s=clone(original), a=s.agreements.find(x=>x.id===cmd.agreementId); assert(a,'The selected agreement is unavailable.');
    const p=cmd.payload||{}, v=current(a), actor=roles[role].name, at=new Date().toISOString();
    const o=p.occurrenceId?a.occurrences.find(x=>x.id===p.occurrenceId):null;
    if(p.occurrenceId) assert(o,'The exact maintenance occurrence is unavailable.');
    let message='';
    if(cmd.type==='coverage') {
      const status=choose(p.status,['Unknown','Covered','NotCovered','Disputed','NotApplicable'],'coverage decision');
      const route=choose(p.route,['FinanceReview','ContractReference'],'charging review route');
      assert(!['Unknown','Disputed'].includes(status)||route==='FinanceReview','Unknown or disputed coverage needs separate Finance review.');
      assert(!['Covered','NotCovered','NotApplicable'].includes(status)||v.available,'Retrieve the exact source before resolving coverage.');
      assert(route!=='ContractReference'||v.available,'The exact agreement source is required for a contract reference.');
      assert(p.confirm===true,'Confirm the listed task scope and exclusions.');
      a.assessments.push({id:cmd.op,agreementRevision:v.revision,sourceFingerprint:v.sourceFingerprint,status,route,reason:text(p.reason,'Coverage reason'),actor,at});
      message=`Recorded ${status} for exact agreement r${v.revision}; billing remains separate.`;
    } else if(cmd.type==='reviewPlan') {
      const q=plan(a); assert(!q.review,'This exact plan revision is already reviewed.'); assert(v.available&&v.status==='Active','An active agreement and available source are required.');
      assert(p.confirm===true,'Confirm the exact task and calendar basis.'); text(p.reason,'Plan review basis');
      assert(q.agreementRevision===v.revision&&q.sourceFingerprint===v.sourceFingerprint,'The plan source changed. Prepare a reconciled successor first.');
      q.review={actor,at,reason:p.reason}; message=`Reviewed plan r${q.revision}; no work or booking is authorised.`;
    } else if(cmd.type==='revisePlan') {
      const old=plan(a); assert(v.available&&v.status==='Active','Retrieve an active agreement source before revising the plan.');
      date(p.effective); assert(p.effective>=TODAY&&p.effective<=v.expiry,'The effective date must be within the remaining agreement period.');
      text(p.reason,'Revision and occurrence reconciliation reason'); choose(p.owner,owners,'plan owner');
      assert(p.retain===true,'Explicitly retain existing occurrences and bookings.');
      const templateKey=p.templateKey||old.templateKey||'routine';choose(templateKey,Object.keys(templates()),'source-defined template');
      const t=templates()[templateKey];
      a.plans.push({...clone(old),templateKey,title:t.title,interval:t.interval,ruleSource:t.ruleSource,sourceRule:t.sourceRule,tasks:clone(t.tasks),revision:old.revision+1,agreementRevision:v.revision,sourceFingerprint:v.sourceFingerprint,effective:p.effective,until:v.expiry,owner:p.owner,review:null,reason:p.reason});
      message=`Prepared plan r${plan(a).revision}; existing occurrences keep their original scope and version.`;
    } else if(cmd.type==='generate') {
      const b=gates(a); assert(!b.length,b.join(' ')); assert(p.confirm===true,'Review the occurrence preview before generating.');
      const rows=preview(a,p.through), fresh=rows.filter(x=>!x.existing); assert(a.occurrences.length+fresh.length<=100,'This demonstration is limited to 100 occurrences per agreement.');
      for(const row of fresh) a.occurrences.push(occurrence(a,row.due));
      message=`Prepared ${fresh.length} new due item${fresh.length===1?'':'s'}; retained ${rows.length-fresh.length} existing item${rows.length-fresh.length===1?'':'s'}. No booking created.`;
    } else if(cmd.type==='exception') {
      assert(o,'Select an exact occurrence.'); assert(!['Skipped','Cancelled','Completed'].includes(o.state),'A terminal occurrence cannot be silently reopened.');
      const kind=choose(p.kind,['Defer','Skip','Cancel'],'exception'), reason=text(p.reason,'Exception reason');
      assert(p.confirm===true,'Confirm the impact on customer, crop window and existing work.');
      if(kind!=='Defer') assert(!o.results.length&&!o.requests.length,'Work already has a request or reviewed result. Resolve the remaining tasks through Service; do not erase the occurrence.');
      const owner=choose(p.owner,owners,'exception owner'); let target=o.target;
      if(kind==='Defer') { date(p.target); assert(p.target>o.target&&p.target<=v.expiry,'Choose a later target within the agreement period.'); text(p.evidence,'Customer-window evidence'); target=p.target; }
      o.exceptions.push({id:cmd.op,kind,originalDue:o.originalDue,from:o.target,to:target,reason,owner,evidence:p.evidence||'',actor,at});
      o.target=target; o.owner=owner; o.state=kind==='Defer'?(o.results.length?'Partial':'Deferred'):kind==='Skip'?'Skipped':'Cancelled';
      message=`${kind==='Defer'?'Deferred':kind==='Skip'?'Skipped':'Cancelled'} the occurrence; original due date and any existing work remain unchanged.`;
    } else if(cmd.type==='request') {
      assert(o,'Select an exact occurrence.'); const b=gates(a,o); assert(!b.length,b.join(' '));
      const latest=a.plans.find(x=>x.revision===o.planRevision); assert(latest,'The original plan is unavailable.');
      assert(p.confirm===true,'Confirm the exact scope, crop window and receiving owner.');
      choose(p.owner,owners,'receiving owner'); text(p.note,'Work-request context');
      const basis=requestBasis(a,o), key=`${o.id}:cycle:${o.results.length}`;
      assert(!o.requests.some(x=>x.key===key),'This obligation already has a request for this result cycle. Use its existing identity.');
      const bytes=JSON.stringify(basis), digest=await hash(bytes);
      o.requests.push({id:`SYN-MA-REQ-${s.version}`,key,owner:p.owner,note:p.note,state:'Prepared locally',basis,bytes,hash:digest,actor,at});
      message='Prepared one owned request. Work authority, booking and billing remain separate.';
    } else if(cmd.type==='reconcile') {
      assert(o&&o.requests.length,'Prepare the owned work request first.'); assert(o.id==='plan-1@2026-09-15','This guided result is available only for the original Willowbank occurrence.');
      assert(!o.results.length,'The exact demonstration report is already reconciled. Its original result remains retained.');
      const req=o.requests.at(-1), b=gates(a,o); assert(!b.length,b.join(' '));
      assert(await hash(req.bytes)===req.hash&&JSON.stringify(requestBasis(a,o))===req.bytes,'The request context changed. Reconcile the retained request before accepting a receiving result.');
      assert(p.confirm===true,'Confirm this is the exact synthetic Service Review result.');
      choose(p.owner,owners,'remaining-work owner'); date(p.due); assert(p.due>=o.target&&p.due<=v.expiry,'Remaining work needs a due date on or after the requested visit, within the agreement.');
      const result={id:'SYN-MA-REPORT-001-r01',ref:'SYN-PPO-RPT-MA-080101',revision:1,requestId:req.id,occurrenceId:o.id,planRevision:o.planRevision,agreementRevision:o.agreementRevision,workOrder:'SYN-PPO-WO-MA-080101',workAuthority:'Authorised in fictional receiving evidence',appointment:'SYN-PPO-APT-MA-080101',attendance:'Accepted in fictional receiving evidence',outcome:'Partial',customerResponse:'Reservations',billing:'Not approved',at,actor,source:'SYN-MA-RECEIVING-EVIDENCE-01 r01 — synthetic later-step fixture',tasks:o.tasks.map((t,i)=>({id:t.id,outcome:i===1?'Remaining':'Completed',evidence:i===1?'Pressure verification not completed: eligible instrument evidence was unavailable.':'Exact fictional report r01 contains the reviewed task evidence.'})),remainingOwner:p.owner,remainingDue:p.due};
      o.results.push(result); o.state='Partial'; o.owner=p.owner; message='Retained the reviewed partial result. Pressure verification remains owned against the same original occurrence.';
    } else if(cmd.type==='assign') {
      assert(o,'Select an exact occurrence.'); assert(!['Skipped','Cancelled','Completed'].includes(o.state),'This occurrence has no open work to reassign.');
      choose(p.owner,owners,'owner'); text(p.reason,'Ownership reason'); o.owner=p.owner;
      message=`Assigned open follow-up to ${p.owner}; prior ownership remains in history.`;
    } else if(cmd.type==='renewal') {
      assert(!a.renewals.some(x=>x.agreementRevision===v.revision&&x.state==='Open'),'An open renewal review already exists for this agreement revision.');
      choose(p.owner,owners,'relationship owner'); date(p.due); assert(p.due>=TODAY,'Use a current or future review date.'); text(p.note,'Customer review purpose');
      a.renewals.push({id:`SYN-MA-RENEWAL-${s.version}`,agreementRevision:v.revision,sourceFingerprint:v.sourceFingerprint,owner:p.owner,due:p.due,note:p.note,state:'Open',crmState:'Activity preparation only',proposals:[],history:[{actor,at,text:'Owned customer review prepared locally.'}]});
      message='Prepared an owned renewal review. No CRM Activity or accepted renewal was created.';
    } else if(cmd.type==='renewalTerms') {
      const r=a.renewals.find(x=>x.id===p.renewalId); assert(r&&r.state==='Open','Select the open renewal review.');
      assert(v.available&&r.agreementRevision===v.revision&&r.sourceFingerprint===v.sourceFingerprint,'Retrieve and reconcile the current agreement source first.');
      text(p.note,'Proposed terms for review'); date(p.start); date(p.end); assert(p.start>v.expiry&&p.end>=p.start,'Proposed successor terms must follow the existing expiry date.');
      r.proposals.push({id:cmd.op,revision:r.proposals.length+1,start:p.start,end:p.end,note:p.note,status:'Proposed',actor,at});
      message='Retained proposed successor terms. The current agreement and expiry date are unchanged.';
    } else if(cmd.type==='sourceScenario') {
      choose(p.change,['availability','revision'],'source scenario');
      if(p.change==='availability') { v.available=!v.available; message='Changed source availability for the synthetic preview.'; }
      else { a.versions.push({...clone(v),revision:v.revision+1,sourceFingerprint:`${v.sourceFingerprint}-successor-${s.version}`,sourceRef:`SYN-AGREEMENT-${a.id} r${v.revision+1}`,terms:v.terms+' Successor requires a new applicability review.'}); message='Loaded a fictional successor source. Old assessments, plans and occurrences remain exact.'; }
    } else throw new Error('Unsupported action.');
    const event={actor,at,text:message,...(o?{occurrenceId:o.id}:{}),...(p.reason?{reason:p.reason}:{})};
    a.history.push(event); if(o)o.history.push(clone(event));
    s.version++; s.receipts[cmd.op]={role,fingerprint,at,agreementId:a.id};
    return {state:s,message,replayed:false};
  }
  root.MA_MODEL={TODAY,clone,escape,hash,roles,owners,can,current,plan,assessment,monthDate,seed,gates,preview,remaining,requestBasis,validState,command,templates};
})(typeof window==='undefined'?globalThis:window);
