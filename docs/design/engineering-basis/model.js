/* EN-02 r01. Pure synthetic domain model; no provider or application calls. */
const EngineeringBasis = (() => {
  'use strict';
  const SCHEMA='ppo-engineering-basis/1', TODAY='2026-09-17';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=()=>crypto.randomUUID();
  const id=n=>'e0020000-0000-4000-8000-'+String(n).padStart(12,'0');
  const area=n=>'33000000-0000-4000-8000-'+String(n).padStart(12,'0');
  const ROLES={
    author:{name:'Sam Jordan',label:'Basis author',edit:true},
    reviewer:{name:'Casey Quinn',label:'Independent reviewer',review:true},
    hydraulics:{name:'Alex Morgan',label:'Hydraulics owner'},
    controls:{name:'Riley Chen',label:'Controls owner'},
    electrical:{name:'Taylor Reed',label:'Electrical owner'},
    observer:{name:'Read-only observer',label:'Observer'}
  };
  const canonical=x=> x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
  async function hash(x) {
    const bytes=new TextEncoder().encode(typeof x==='string'?x:canonical(x));
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  const fail=m=>{throw Error(m);};
  const text=(v,label,min=1)=>{if(typeof v!=='string'||v.trim().length<min||v.length>6000)fail(label+' is required (up to 6,000 characters).');return v.trim();};
  const date=v=>{if(v && (!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v))fail('Enter a valid calendar date.');return v||'';};
  const revision=n=>'r'+String(n).padStart(2,'0');
  const editable=p=>p.basis.status==='Draft';
  function body(p){const b=clone(p.basis);delete b.status;return b;}
  const sourceRefs=p=>p.basis.sources.map(x=>({...x}));
  function changedSources(p){return p.basis.sources.filter(x=>p.sources.find(s=>s.id===x.id)?.version!==x.version);}
  function getRecord(p,kind,rid){const r=p.basis[kind]?.find(x=>x.id===rid);if(!r)fail('This record is unavailable in the selected package.');return r;}
  function retainSource(s){const old=clone(s);delete old.history;s.history=[...(s.history||[]),old];}
  function calculationState(p,c){const affected=changedSources(p).some(s=>impact(p,s.id).records.some(r=>r.id===c.id));return affected||c.inputEdition!==p.basis.edition?'Needs reassessment':c.status;}
  function needs(p){
    const issues=[], add=(id,label,view,reason)=>issues.push({id,label,view,reason});
    if(p.readState!=='Complete')add('read','Supporting context is '+p.readState.toLowerCase(),'sources','Complete the source assessment before positive review.');
    if(!p.policy.configured)add('policy','Review authority is not configured','review','An adopted authority rule is required for operational use.');
    if(!p.basis.scope.length)add('scope','Design scope needs an area','basis','Select the exact applicable areas.');
    p.basis.sources.forEach(pin=>{
      const s=p.sources.find(x=>x.id===pin.id);
      if(!s||s.status!=='Available')add(pin.id,s?.title||'Missing source','sources',s?.status==='Restricted'?'Source access is restricted.':'Exact source evidence is unavailable.');
      else if(s.version!==pin.version)add(s.id,s.title+' has changed','sources','Compare and adopt the successor deliberately.');
    });
    p.basis.requirements.forEach(r=>{
      if(!r.owner||!r.criterion||!r.sources.length)add(r.id,r.title,'requirements','Owner, acceptance criterion and source are required.');
      if(!p.basis.scope.includes(r.target))add(r.id,r.title,'requirements','Applicability falls outside the selected basis scope.');
    });
    p.basis.assumptions.forEach(a=>{
      if(!a.owner||!a.plan||!a.sources.length)add(a.id,a.title,'assumptions','Assign an owner, validation plan and source.');
      if(a.blocking && a.status!=='Supported')add(a.id,a.title,'assumptions','Blocking input needs a response accepted by the reviewer.');
      if(!a.blocking && a.status!=='Supported' && (!a.consequence||!a.due))add(a.id,a.title,'assumptions','Retained assumption needs consequence and due date.');
    });
    p.basis.interfaces.forEach(i=>{
      if(!i.provider||!i.receiver||!i.criterion||!i.input||!i.output||!i.sources.length)add(i.id,i.title,'interfaces','Both responsibilities, inputs, outputs, criterion and evidence are required.');
      if(i.provider===i.receiver)add(i.id,i.title,'interfaces','The demonstration policy requires distinct responsible parties.');
      if(i.valueState==='Known'&&(i.value===''||!Number.isFinite(Number(i.value))||!i.unit))add(i.id,i.title,'interfaces','Known numeric properties need a number and unit.');
      if(!i.confirmations.provider||!i.confirmations.receiver||Object.values(i.confirmations).some(c=>c.version!==i.version))add(i.id,i.title,'interfaces','Both parties must confirm this exact interface revision.');
      if(i.disputed)add(i.id,i.title,'interfaces','The boundary is disputed.');
    });
    p.basis.calculations.forEach(c=>{if(calculationState(p,c)!=='Checked')add(c.id,c.title,'sources','A current-input check is required.');});
    p.findings.filter(f=>f.status!=='Accepted').forEach(f=>add(f.id,f.title,'review','Finding response requires reviewer acceptance.'));
    return issues;
  }
  function eligibility(p){
    if(p.basis.status==='Withdrawn')return 'Held';
    if(p.basis.status!=='Reviewed')return 'Not assessed';
    return needs(p).length?'Needs reassessment':'Eligible for stated purpose';
  }
  function records(p){return [...p.basis.requirements,...p.basis.assumptions,...p.basis.interfaces,...p.basis.calculations];}
  function impact(p,start){
    const all=records(p),seen=new Set([start]),todo=[start],found=[];
    while(todo.length){const current=todo.shift();for(const r of all){if((r.sources||[]).includes(current)||r.responseSource===current||(r.depends||[]).includes(current)){if(!seen.has(r.id)){seen.add(r.id);todo.push(r.id);found.push({id:r.id,title:r.title,depth:current===start?'Direct':'Indirect'});}}}}
    return {records:found,deliverables:[...new Set(found.flatMap(x=>all.find(y=>y.id===x.id)?.deliverables||[]))],complete:p.readState==='Complete'};
  }
  function compare(a,b){
    const out=[];
    function walk(x,y,path){if(canonical(x)===canonical(y))return;
      if(x&&y&&!Array.isArray(x)&&!Array.isArray(y)&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],path?path+'.'+k:k);}
      else out.push({field:path,before:x??null,after:y??null});}
    walk(a,b,'');return out;
  }
  function initial(locations) {
    const site=area(301),scope=[area(401),area(402),area(403),area(406)];
    const src=(n,title,kind,content,status='Available')=>({id:id(n),ref:'SYN-PPO · evidence '+n,title,kind,version:1,status,observed:TODAY,content,review:'Synthetic reference',restricted:false});
    const sources=[
      src(101,'Site survey · irrigation installation','Reviewed survey snapshot','EN-02 authored demonstration successor of the CS-08 example. One pump is installed in Irrigation Shed 01 and serves Greenhouse 01, Tunnel 01 and Propagation House 01. Existing simultaneous circuit demand is a customer statement, not measured capacity. No real survey review is implied.'),
      src(102,'Available supply · confirmation needed','Unknown','No witnessed flow evidence or dated electrical capacity statement is retained. Obtain exact evidence for the design purpose.','Unavailable'),
      src(103,'Customer brief · operating sequence','Customer statement','The customer requests independently controlled growing areas. Simultaneous operation is subject to the reviewed supply basis. External customer acceptance is not simulated.'),
      src(104,'Controls interface note','Engineering proposal','The provider supplies a permitted-run state and fault indication. The receiver describes how each is interpreted. No wiring, protocol address or operating permission is asserted.'),
      src(105,'Layout concept · published extract','Drawing reference','Illustrative layout r01: physical pump position in the shed, with separate served-area relationships. This extract is not a construction drawing.'),
      src(106,'Restricted supplier commercial note','Restricted reference','Internal synthetic placeholder. No technical decision may rely on unavailable evidence.','Restricted')
    ];
    sources[5].restricted=true;
    const req=(n,title,target,category,source,criterion,depends=[])=>({id:id(n),label:'REQ-'+String(n-200).padStart(2,'0'),title,statement:title+'. Retain exact scope and source evidence.',category,origin:source===103?'Customer statement':'Engineering-derived proposal',target,owner:'Sam Jordan',criterion,method:'Document review',sources:[id(source)],depends,deliverables:['Layout drawing','Design review brief']});
    const assumptions=[
      {id:id(301),label:'ASM-01',type:'Assumption',title:'Supply capacity supports the proposed sequence',target:area(406),owner:'Alex Morgan',due:'2026-09-21',status:'Open',blocking:true,plan:'Obtain dated supply evidence and confirm its relevance to the proposed operating sequence.',consequence:'An unsuitable supply basis could change the selected operating sequence and affected interfaces.',response:'',responseSource:'',acceptedBy:'',sources:[id(102)],depends:[],deliverables:['Hydraulic design reference']},
      {id:id(302),label:'ASM-02',type:'Assumption',title:'Existing mainline route can be retained',target:area(401),owner:'Sam Jordan',due:'2026-09-23',status:'Open',blocking:false,plan:'Inspect the route and obtain condition evidence before material release.',consequence:'A changed route requires a scope and material review. This basis is limited to design preparation.',response:'',responseSource:'',acceptedBy:'',sources:[id(101)],depends:[],deliverables:['Layout drawing']},
      {id:id(303),label:'TQ-01',type:'Technical question',title:'Confirm customer shutdown window',target:area(403),owner:'Riley Chen',due:'2026-09-22',status:'Open',blocking:false,plan:'Prepare the question for the responsible site contact through EN-04.',consequence:'No shutdown or site visit is authorised by this basis.',response:'',responseSource:'',acceptedBy:'',sources:[id(103)],depends:[],deliverables:['Commissioning basis']}
    ];
    const intf=(n,title,provider,receiver,source,depends,confirmed=false)=>({id:id(n),label:'IF-'+String(n-400).padStart(2,'0'),title,category:n===401?'Hydraulic / controls':'Electrical / controls',target:area(406),provider,receiver,providerDuty:'Provide exact source evidence and describe the boundary output.',receiverDuty:'Confirm interpretation and limits of the received input.',input:n===401?'Reviewed operating sequence and available supply basis':'Reviewed permitted-run and fault indication',output:n===401?'Required demand / permitted-run contract':'Recorded interpretation of status and fault states',criterion:'Both responsibilities and the exact supporting evidence are reviewed for design preparation.',valueState:'Unknown',value:'',unit:'',property:'Interface capacity',version:1,disputed:false,sources:[id(source)],depends,deliverables:['Interface drawing','Controls description'],confirmations:confirmed?{provider:{actor:ROLES[provider].name,role:provider,version:1,date:TODAY},receiver:{actor:ROLES[receiver].name,role:receiver,version:1,date:TODAY}}:{}});
    const p={id:id(1),ref:'SYN-PPO-ENG-000701',company:'SYN-PPO',organisation:locations.organisation.name,site,siteName:locations.sites[0].name,contextKind:'Project',context:'Nursery irrigation upgrade',contextRef:'SYN-PPO-PRJ-000701',coordination:'In design',version:1,readState:'Complete',policy:{configured:true,version:1,label:'Illustrative basis review policy'},sources,basis:{id:id(11),edition:1,status:'Draft',author:'Sam Jordan',purpose:'Detailed-design preparation',summary:'Establish a clear design basis for the irrigation upgrade, including supply evidence, operating sequence and the responsibilities between Hydraulics and Controls.',scope,exclusions:'Equipment sizing, procurement release, installation authority and live controller changes are excluded.',required:'2026-09-24',sources:sources.slice(0,5).map(s=>({id:s.id,version:1})),requirements:[
      req(201,'Keep installed location separate from served areas',area(406),'Site constraint',101,'One pump identity is linked to its installed shed and three served areas.'),
      req(202,'Confirm the available supply basis',area(406),'Performance',102,'Dated source evidence is accepted for the stated design purpose.',[id(301)]),
      req(203,'Support independently controlled growing areas',area(401),'Functional',103,'The required operating sequence is recorded against each selected area.',[id(301)]),
      req(204,'Define permitted-run and fault responsibilities',area(406),'Interface',104,'Provider and receiver confirm the exact contract.',[id(401)]),
      req(205,'Preserve the existing route as an assessed option',area(401),'Site constraint',101,'Condition and route remain an owned assumption until verified.',[id(302)]),
      req(206,'Retain a future commissioning evidence link',area(403),'Verification',105,'Test evidence is requested through the commissioning owner.',[id(303)])
    ],assumptions,interfaces:[intf(401,'Water supply ↔ operating sequence','hydraulics','controls',102,[id(202),id(301)]),intf(402,'Permitted-run & fault indication','electrical','controls',104,[],true)],calculations:[
      {id:id(501),label:'CALC-01',title:'Supply and demand basis review',tool:'Native calculation reference',toolVersion:'Not supplied',sourceRevision:'r01',inputEdition:1,status:'Needs check',owner:'Alex Morgan',checker:'',method:'Method reference pending supplied evidence',conclusion:'No capacity or sizing result is asserted in this demonstration.',sources:[id(102)],depends:[id(202),id(301)],deliverables:['Hydraulic design reference']},
      {id:id(502),label:'MODEL-01',title:'Layout and served-area model',tool:'SOLIDWORKS reference',toolVersion:'Not verified',sourceRevision:'r01',inputEdition:1,status:'Checked',owner:'Sam Jordan',checker:'Casey Quinn',method:'Static published extract reviewed for context only',conclusion:'One physical asset has separate served-area relationships. Native model dependencies are not inspected.',sources:[id(105)],depends:[id(201)],deliverables:['Layout drawing']}
    ]},submissions:[],reviews:[],findings:[],handovers:[],history:[{id:id(901),at:TODAY+'T09:00:00+10:00',actor:'Sam Jordan',action:'Basis prepared',detail:'Authored synthetic EN-02 fixture. Source lineage and remaining unknowns retained.'}]};
    const nursery=clone(p);nursery.id=id(2);nursery.ref='SYN-PPO-ENG-000702';nursery.contextKind='Opportunity';nursery.context='Screen & lighting coordination';nursery.contextRef='SYN-PPO-OPP-000702';nursery.basis.id=id(12);nursery.basis.purpose='Presales assessment';nursery.basis.summary='Coordinate screen mounting, power and controls responsibilities. No supplier compatibility or sizing is assumed.';nursery.policy.configured=false;nursery.basis.requirements=nursery.basis.requirements.slice(0,3);nursery.basis.requirements[1].title='Obtain supplier mounting and power requirements';
    nursery.basis.scope=[area(401),area(403)];nursery.basis.exclusions='Supplier compatibility, structural capacity, final lighting design, commercial acceptance and installation release remain excluded.';
    nursery.sources.slice(0,5).forEach((s,i)=>Object.assign(s,[
      {title:'Nursery screen location · context only',kind:'Survey context',content:'Authored presales example. Greenhouse 01 and Propagation House 01 are the proposed locations. Existing mounting and lighting suitability have not been established.'},
      {title:'Supplier mounting & power evidence',content:'Exact supplier mounting loads, power requirements and product compatibility are unavailable.'},
      {title:'Screen & lighting · customer brief',content:'The fictional customer requests coordinated screen and lighting operation. Operating priorities need confirmation; this Opportunity is not awarded work.'},
      {title:'Screen controls · proposed contract',content:'Proposed permitted-run and status responsibilities need a source-backed provider and receiver agreement. No operating protocol is asserted.'},
      {title:'Screen layout · proposed reference',content:'A future native layout reference must establish mounting and service access. No checked model is supplied.'}
    ][i]));
    ['Define proposed screen and lighting locations','Obtain supplier mounting and power requirements','Record requested operating priorities'].forEach((title,i)=>Object.assign(nursery.basis.requirements[i],{title,statement:title+'. Retain exact supplier and customer sources.',target:area(401),criterion:['Exact applicable growing areas are retained.','Supplier evidence is available and reviewed for the presales purpose.','Customer priorities and unresolved questions are recorded.'][i]}));
    ['Supplier mounting and power requirements are applicable','Proposed lighting arrangement can share mounting context','Confirm presales operating priorities'].forEach((title,i)=>Object.assign(nursery.basis.assumptions[i],{title,target:area(401),owner:i===0?'Taylor Reed':'Sam Jordan',plan:['Obtain exact supplier evidence and assess applicability.','Confirm mounting context before detailed design.','Record the question for the responsible commercial owner.'][i],consequence:['Unsupported evidence changes the proposed scope.','A separate mounting arrangement may be required.','No operating sequence or awarded project is inferred.'][i]}));
    nursery.basis.interfaces.forEach((r,i)=>Object.assign(r,{title:i===0?'Screen operation ↔ controls':'Lighting permitted-run & status',category:'Electrical / controls',provider:'electrical',target:area(401),input:'Exact screen / lighting operating and supplier evidence',output:'Proposed permitted-run and status responsibilities',confirmations:{}}));
    nursery.basis.calculations.forEach((r,i)=>Object.assign(r,{title:i===0?'Mounting & power evidence review':'Screen and lighting layout reference',owner:i===0?'Taylor Reed':'Sam Jordan',status:'Needs check',checker:'',conclusion:'No supplier compatibility, mounting capacity or lighting result is asserted.'}));
    const berry=clone(p);berry.id=id(3);berry.ref='SYN-PPO-ENG-000703';berry.context='Field controls upgrade';berry.site=area(302);berry.siteName=locations.sites[1].name;berry.contextRef='SYN-PPO-PRJ-000703';berry.basis.id=id(13);berry.basis.scope=[area(408),area(409)];berry.basis.summary='Record the existing and proposed control configuration, with exact firmware and protocol evidence. All upgrades remain proposals.';
    [...berry.basis.requirements,...berry.basis.assumptions,...berry.basis.interfaces].forEach(r=>r.target=area(409));berry.basis.requirements[1].title='Verify firmware and protocol applicability';berry.readState='Partial';berry.sources[1].title='Firmware compatibility evidence';berry.sources[1].content='Supported firmware and protocol have not been established for this proposed upgrade.';
    berry.sources.slice(0,5).forEach((s,i)=>Object.assign(s,[
      {title:'Field controls · partial as-found context',kind:'Partial survey context',content:'Authored field-site example. The control configuration, wiring and exact firmware remain incompletely recorded. Nursery pump context is not evidence for this site.'},
      {title:'Firmware compatibility evidence',content:'Supported firmware and protocol have not been established for this proposed upgrade.'},
      {title:'Field controls · requested operation',content:'The fictional customer requests a controls upgrade for Irrigation Block 02 and Tunnel 02. Compatibility and live changes are not authorised.'},
      {title:'Field signal contract · proposed reference',content:'Provider and receiver need exact signal meaning, fault states and compatibility evidence. No address, live command or validated mapping is asserted.'},
      {title:'As-found configuration · incomplete reference',content:'A published as-found configuration reference remains to be verified. Native tool and software versions are unknown.'}
    ][i]));
    ['Keep field equipment and applicability explicit','Verify firmware and protocol applicability','Record the requested field operating sequence','Define field signal and fault responsibilities','Assess retained field wiring','Retain commissioning evidence requirements'].forEach((title,i)=>Object.assign(berry.basis.requirements[i],{title,statement:title+'. Preserve the exact field-site source.',criterion:'The named field-control requirement is evidenced for the stated design purpose.'}));
    ['Firmware and protocol are compatible','Existing field wiring can be retained','Confirm the field change window'].forEach((title,i)=>Object.assign(berry.basis.assumptions[i],{title,owner:i===0?'Riley Chen':'Sam Jordan',plan:['Obtain exact vendor compatibility evidence.','Inspect and document field wiring before release.','Prepare the change-window question for the field coordinator.'][i],consequence:'Unresolved field evidence can change the design scope. No live controls change is authorised.'}));
    berry.basis.interfaces.forEach((r,i)=>Object.assign(r,{title:i===0?'Field signal ↔ operating sequence':'Field fault state & permitted-run',category:'Electrical / controls',provider:'electrical',input:'Exact field configuration and compatibility evidence',output:'Recorded field-signal interpretation and limits',confirmations:{}}));
    berry.basis.calculations.forEach((r,i)=>Object.assign(r,{title:i===0?'Firmware & protocol applicability review':'As-found field configuration reference',tool:'Native controls reference',toolVersion:'Not verified',owner:'Riley Chen',status:'Needs check',checker:'',method:'Exact configuration evidence remains incomplete',conclusion:'No compatibility result or live controls change is asserted.'}));
    function rekey(pkg,offset){return JSON.parse(JSON.stringify(pkg).replace(/e0020000-0000-4000-8000-(\d{12})/g,(_all,n)=>id(Number(n)+offset)));}
    return {schema:SCHEMA,version:1,packages:[p,rekey(nursery,1000),rekey(berry,2000)],ledger:{}};
  }
  function validate(state,locations){
    if(!state||state.schema!==SCHEMA||!Number.isInteger(state.version)||!Array.isArray(state.packages)||state.packages.length!==3||!state.ledger)fail('Saved data is not a supported EN-02 state. Writes are paused.');
    const ids=new Set();
    for(const p of state.packages){
      if(ids.has(p.id)||!p.basis||!p.sources||!p.history||!p.submissions||!p.reviews||!p.handovers||!p.findings)fail('Saved package structure is invalid.');
      ids.add(p.id);
      if(!locations.sites.some(s=>s.id===p.site))fail('Saved site context is invalid.');
      if(!['Draft','Submitted','Returned','Reviewed','Withdrawn'].includes(p.basis.status))fail('Saved basis state is invalid.');
      if(!Array.isArray(p.basis.scope)||p.basis.scope.some(a=>!locations.areas.some(x=>x.id===a&&x.site===p.site)))fail('Saved area scope is invalid.');
      for(const list of ['requirements','assumptions','interfaces','calculations'])if(!Array.isArray(p.basis[list]))fail('Saved record collection is invalid.');
      const local=records(p).map(r=>r.id);if(new Set(local).size!==local.length)fail('Duplicate record identity.');
      if(records(p).some(r=>typeof r.title!=='string'||!Array.isArray(r.sources)||r.sources.some(s=>!p.sources.some(x=>x.id===s))))fail('Invalid source relationship.');
      if(p.submissions.some(s=>!s.content||!s.fingerprint||!s.sources))fail('Invalid retained submission.');
    }return true;
  }
  async function command(state,pid,role,action,data={},expected,operation=uid(),locations) {
    const actor=ROLES[role];if(!actor||role==='observer')fail('This preview role cannot change the basis.');
    const original=state.packages.find(p=>p.id===pid);if(!original)fail('Package is unavailable.');
    const signature=await hash({pid,role,action,data});
    const prior=state.ledger[operation];
    if(prior){if(prior.signature!==signature||prior.actor!==actor.name)fail('This original operation has different content or actor.');return {state:clone(state),replayed:true,result:prior.result};}
    if(original.version!==expected)fail('A newer package version exists. Your draft has been retained for comparison.');
    const state2=clone(state),p=state2.packages.find(x=>x.id===pid),b=p.basis;
    if(p.handovers.some(h=>h.state==='Outcome unknown')&&!['reconcile','sourceChange'].includes(action))fail('Reconcile the original handover outcome before another material action.');
    const editActions=['editBasis','saveRequirement','saveAssumption','saveInterface','respond','adoptSource','createSource'];
    if(editActions.includes(action)&&(!actor.edit||!editable(p)))fail('Only the basis author can edit a Draft basis. Start a successor when required.');
    const requireReviewer=()=>{if(!actor.review)fail('Use the independent reviewer for this decision.');if(!p.policy.configured)fail('Review authority is not configured for this package.');};
    let result={action},detail='',priorRecord=null,invalidatedRecords=[],at=new Date().toISOString();
    if(action==='editBasis'){
      const nextScope=data.scope||[];
      if(!nextScope.length||nextScope.some(a=>!locations.areas.some(x=>x.id===a&&x.site===p.site)))fail('Choose applicable areas at this site.');
      const orphan=records(p).filter(r=>r.target&&!nextScope.includes(r.target));if(orphan.length)fail('Scope change would orphan '+orphan.length+' records. Reassign their applicability first.');
      b.summary=text(data.summary,'Design summary');b.exclusions=text(data.exclusions,'Exclusions');b.purpose=text(data.purpose,'Review purpose');b.required=date(data.required);b.scope=nextScope;detail='Scope and purpose updated.';
    } else if(action==='saveRequirement'){
      const r=data.id?getRecord(p,'requirements',data.id):{id:uid(),label:'REQ-'+(b.requirements.length+1),depends:[],deliverables:['Design review brief']};
      if(!b.scope.includes(data.target))fail('Requirement target is outside this basis scope.');
      const pins=data.sources||[];if(pins.some(x=>!b.sources.some(y=>y.id===x)))fail('Use a source included in this basis.');
      priorRecord=data.id?clone(r):null;
      Object.assign(r,{title:text(data.title,'Requirement title'),statement:text(data.statement,'Requirement statement'),category:text(data.category,'Category'),origin:text(data.origin,'Origin'),target:data.target,owner:data.owner||'',criterion:data.criterion||'',method:data.method||'',sources:pins});
      if(!data.id)b.requirements.push(r);detail=r.label+' saved as a draft requirement.';
    } else if(action==='saveAssumption'){
      const r=data.id?getRecord(p,'assumptions',data.id):{id:uid(),label:'ASM-'+(b.assumptions.length+1),status:'Open',response:'',responseSource:'',acceptedBy:'',depends:[],deliverables:['Design review brief']};
      if(!b.scope.includes(data.target))fail('Assumption target is outside this basis scope.');
      if((data.sources||[]).some(s=>!b.sources.some(pin=>pin.id===s)))fail('Use a source included in this basis.');
      priorRecord=data.id?clone(r):null;
      Object.assign(r,{title:text(data.title,'Title'),type:data.type||'Assumption',target:data.target,owner:data.owner||'',due:date(data.due),plan:data.plan||'',consequence:data.consequence||'',blocking:!!data.blocking,sources:data.sources||[]});
      r.status='Open';r.acceptedBy='';if(!data.id)b.assumptions.push(r);detail=r.label+' saved; previous acceptance does not apply to changed content.';
    } else if(action==='respond'){
      const r=getRecord(p,'assumptions',data.id),s=p.sources.find(x=>x.id===data.source);if(!s||s.status!=='Available'||!b.sources.some(pin=>pin.id===s.id&&pin.version===s.version))fail('Choose available exact evidence adopted into this basis.');
      r.response=text(data.response,'Response');r.responseSource=s.id;r.responseVersion=s.version;r.status='Response received';r.acceptedBy='';detail=r.label+' response recorded; review remains outstanding.';
    } else if(action==='acceptResponse'){
      requireReviewer();if(!editable(p))fail('Responses are accepted into an editable successor.');
      const r=getRecord(p,'assumptions',data.id),s=p.sources.find(x=>x.id===r.responseSource);
      if(r.status!=='Response received'||!r.response||!s||s.status!=='Available'||s.version!==r.responseVersion)fail('The exact response evidence is unavailable or changed.');
      r.status=data.reject?'Rejected':'Supported';r.acceptedBy=actor.name;detail=r.label+' response '+(data.reject?'rejected':'accepted')+' by the independent reviewer.';
    } else if(action==='saveInterface'){
      const r=data.id?getRecord(p,'interfaces',data.id):{id:uid(),label:'IF-'+(b.interfaces.length+1),version:0,depends:[],deliverables:['Interface drawing']};
      if(!b.scope.includes(data.target))fail('Interface is outside basis scope.');
      if(!['hydraulics','controls','electrical'].includes(data.provider)||!['hydraulics','controls','electrical'].includes(data.receiver))fail('Choose both responsible discipline owners.');
      if(data.provider===data.receiver)fail('Distinct responsible parties are required by the demonstration policy.');
      if((data.sources||[]).some(s=>!b.sources.some(pin=>pin.id===s)))fail('Use a source included in this basis.');
      if(!['Known','Unknown','Not applicable'].includes(data.valueState))fail('Choose a property value state.');
      if(data.valueState==='Known'&&(data.value===''||!Number.isFinite(Number(data.value))||!data.unit))fail('Known properties need a number and unit. Zero is a valid number.');
      priorRecord=data.id?clone(r):null;
      Object.assign(r,{title:text(data.title,'Boundary title'),category:data.category,target:data.target,provider:data.provider,receiver:data.receiver,providerDuty:text(data.providerDuty,'Provider responsibility'),receiverDuty:text(data.receiverDuty,'Receiver responsibility'),input:text(data.input,'Input'),output:text(data.output,'Output'),criterion:text(data.criterion,'Acceptance criterion'),property:data.property||'Property',valueState:data.valueState,value:data.valueState==='Known'?String(Number(data.value)):'',unit:data.valueState==='Known'?data.unit:'',sources:data.sources||[],confirmations:{},version:r.version+1,disputed:false});
      if(!data.id)b.interfaces.push(r);detail=r.label+' updated; both confirmations are required for the successor.';
    } else if(action==='confirmInterface'){
      if(!editable(p))fail('Interface confirmations need an editable basis.');
      const r=getRecord(p,'interfaces',data.id);if(!['provider','receiver'].includes(data.side)||r[data.side]!==role)fail('Only the named side owner can confirm this responsibility.');
      if(r.disputed||r.sources.some(s=>{const x=p.sources.find(v=>v.id===s);return !x||x.status!=='Available'||b.sources.find(v=>v.id===s)?.version!==x.version;}))fail('Resolve the disputed or changed/missing interface evidence first.');
      if(r.confirmations[data.side]?.version===r.version)fail('This side already confirmed the exact interface.');
      r.confirmations[data.side]={actor:actor.name,role,version:r.version,date:at};detail=actor.name+' confirmed '+data.side+' responsibility for '+r.label+'.';
    } else if(action==='checkCalculation'){
      requireReviewer();if(!editable(p))fail('Check the calculation in an editable basis.');
      const c=getRecord(p,'calculations',data.id);
      if(c.sources.some(s=>{const x=p.sources.find(v=>v.id===s);return !x||x.status!=='Available'||b.sources.find(v=>v.id===s)?.version!==x.version;}))fail('Current exact input evidence is required.');
      if(b.assumptions.some(a=>c.depends.includes(a.id)&&a.blocking&&a.status!=='Supported'))fail('Resolve blocking calculation assumptions first.');
      c.status='Checked';c.inputEdition=b.edition;c.checker=actor.name;c.checkNote=text(data.note,'Check evidence');detail=c.label+' input-basis check recorded; no calculation executed.';
    } else if(action==='createSource'){
      const s=p.sources.find(x=>x.id===data.id);if(!s||s.restricted)fail('Source is unavailable for this demonstration action.');
      retainSource(s);s.version++;s.status='Available';s.content=text(data.content,'Evidence statement');s.kind='Authored synthetic evidence';s.observed=TODAY;detail=s.title+' successor evidence captured. Adoption remains separate.';
    } else if(action==='adoptSource'){
      const s=p.sources.find(x=>x.id===data.id);if(!s||s.status!=='Available')fail('Exact source content is unavailable.');
      const pin=b.sources.find(x=>x.id===s.id);if(!pin)fail('Source is not included in this basis.');pin.version=s.version;
      const affected=new Set(impact(p,s.id).records.map(r=>r.id));
      priorRecord={source:s.id,records:clone(records(p).filter(r=>affected.has(r.id)))};
      b.interfaces.filter(i=>affected.has(i.id)).forEach(i=>{i.confirmations={};i.version++;});
      b.calculations.filter(c=>affected.has(c.id)).forEach(c=>c.status='Needs check');
      b.assumptions.filter(a=>affected.has(a.id)&&a.status==='Supported').forEach(a=>{a.status='Open';a.acceptedBy='';});
      detail='Adopted '+s.title+' v'+s.version+'; dependent checks and agreements require review.';
    } else if(action==='submit'){
      if(!actor.edit||!editable(p))fail('Only the author can submit an editable basis.');
      if(!b.scope.length||b.assumptions.some(a=>!a.owner||!a.plan))fail('Identify scope and own every information gap before submission.');
      if(changedSources(p).length)fail('Compare and adopt available source successors before freezing the exact basis.');
      const content=body(p),sources=clone(p.sources.filter(s=>b.sources.some(x=>x.id===s.id))),fingerprint=await hash({content,sources,policy:p.policy});
      const sub={id:uid(),edition:b.edition,content,sources,fingerprint,policy:clone(p.policy),author:actor.name,at};
      p.submissions.push(sub);b.status='Submitted';result.submission=sub.id;detail='Exact '+revision(b.edition)+' submitted with '+needs(p).length+' readiness findings.';
    } else if(action==='review'){
      requireReviewer();if(b.status!=='Submitted')fail('Select a submitted basis.');
      const sub=p.submissions.at(-1);if(sub.author===actor.name)fail('The author cannot review their own submission.');
      if(await hash({content:body(p),sources:p.sources.filter(s=>b.sources.some(x=>x.id===s.id)),policy:p.policy})!==sub.fingerprint)fail('Source or policy changed after submission. Return and prepare a successor.');
      const note=text(data.note,'Review rationale');
      if(data.outcome==='Reviewed'&&needs(p).length)fail('Resolve '+needs(p).length+' readiness findings before positive review.');
      if(!['Reviewed','Returned'].includes(data.outcome))fail('Choose a review outcome.');
      p.reviews.push({id:uid(),submission:sub.id,fingerprint:sub.fingerprint,purpose:b.purpose,outcome:data.outcome,note,actor:actor.name,at});
      b.status=data.outcome;
      if(data.outcome==='Returned'){p.findings.push({id:uid(),title:note,target:data.target||'',status:'Open',response:'',author:actor.name,at,submission:sub.id});}
      detail='Basis '+data.outcome.toLowerCase()+' for '+b.purpose.toLowerCase()+'.';
    } else if(action==='returnChanged'){
      requireReviewer();if(b.status!=='Submitted')fail('Select a submitted basis.');
      const sub=p.submissions.at(-1);p.reviews.push({id:uid(),submission:sub.id,fingerprint:sub.fingerprint,purpose:sub.content.purpose,outcome:'Returned',note:text(data.note,'Return reason'),actor:actor.name,at});b.status='Returned';detail='Changed-source submission returned; original snapshot retained.';
    } else if(action==='successor'){
      if(!actor.edit||!['Returned','Reviewed','Withdrawn'].includes(b.status))fail('The author can start a successor after return, review or withdrawal.');
      text(data.reason,'Change reason');b.edition++;b.status='Draft';b.interfaces.forEach(i=>{i.confirmations={};i.version++;});b.calculations.forEach(c=>c.status='Needs check');detail='Started '+revision(b.edition)+': '+data.reason+'. Previous reviews remain exact.';
    } else if(action==='respondFinding'){
      if(!actor.edit||!editable(p))fail('Respond in an editable successor.');
      const f=p.findings.find(x=>x.id===data.id);if(!f)fail('Finding not found.');f.response=text(data.response,'Correction response');f.status='Response received';detail='Correction response recorded.';
    } else if(action==='acceptFinding'){
      requireReviewer();if(!editable(p))fail('Accept a finding response before submission.');
      const f=p.findings.find(x=>x.id===data.id);if(!f||f.status!=='Response received')fail('A correction response is required.');f.status='Accepted';f.acceptedBy=actor.name;detail='Reviewer accepted the correction response.';
    } else if(action==='prepare'){
      if(!actor.edit||eligibility(p)!=='Eligible for stated purpose')fail('Use an eligible reviewed basis to prepare a handover.');
      const sub=p.submissions.at(-1),review=p.reviews.findLast(x=>x.submission===sub.id&&x.outcome==='Reviewed');
      if(!review)fail('Exact review evidence is required.');
      if(p.handovers.some(x=>x.submission===sub.id))fail('A handover already exists for this exact submission.');
      const payload={basis:clone(sub),review:clone(review),context:{package:p.ref,kind:p.contextKind,reference:p.contextRef,site:p.site},receiver:text(data.receiver,'Receiving owner'),domain:'EN-03 / EN-05',limitations:b.assumptions.filter(x=>x.status!=='Supported').map(x=>({title:x.title,owner:x.owner,plan:x.plan,due:x.due,consequence:x.consequence}))};
      p.handovers.push({id:uid(),operation,submission:sub.id,fingerprint:await hash(payload),payload,state:'Prepared',at,receipt:null});detail='Exact receiving pack prepared locally. No external transmission.';
    } else if(action==='simulateReceive'){
      if(!actor.edit)fail('Use the basis author for the receiving preview.');
      const h=p.handovers.find(x=>x.id===data.id);if(!h||h.state!=='Prepared')fail('Select a prepared handover.');
      if(eligibility(p)!=='Eligible for stated purpose')fail('Current basis eligibility changed; reassess before receiving simulation.');
      h.receipt={id:uid(),operation:h.operation,outcome:data.returned?'Preview returned':'Preview accepted',at,receiver:h.payload.receiver};
      h.state=data.interrupt?'Outcome unknown':h.receipt.outcome;detail=data.interrupt?'Receiving preview interrupted. Reconcile the original operation.':'Receiving preview result recorded.';
    } else if(action==='reconcile'){
      if(!actor.edit)fail('Use the basis author for recovery.');
      const h=p.handovers.find(x=>x.id===data.id);if(!h||h.state!=='Outcome unknown'||!h.receipt)fail('No original receiving outcome is waiting for reconciliation.');
      h.state=h.receipt.outcome;detail='Original receiving receipt recovered. No second handover created.';
    } else if(action==='sourceChange'){
      if(!actor.edit)fail('Source-change demonstration is available to the author.');
      const s=p.sources.find(x=>x.id===data.id);if(!s||s.restricted)fail('Source not available.');
      retainSource(s);s.version++;s.content+=' Successor observation: operating sequence must be reassessed against the changed source.';detail='A later source revision is available. Retained reviews and handovers remain unchanged.';
    } else if(action==='withdraw'){
      requireReviewer();if(b.status!=='Reviewed')fail('Only a reviewed current basis can be withdrawn.');
      text(data.reason,'Withdrawal reason');b.status='Withdrawn';detail='Current use withdrawn: '+data.reason;
    } else fail('Unsupported operation.');
    if(['saveRequirement','saveAssumption','saveInterface','respond','acceptResponse'].includes(action)&&data.id){
      const affected=new Set(impact(p,data.id).records.map(r=>r.id));
      invalidatedRecords=clone([...b.calculations,...b.interfaces].filter(r=>affected.has(r.id)));
      b.calculations.filter(c=>affected.has(c.id)).forEach(c=>c.status='Needs check');
      b.interfaces.filter(i=>affected.has(i.id)&&i.id!==data.id).forEach(i=>{i.confirmations={};i.version++;});
    }
    p.version++;state2.version++;p.history.unshift({id:uid(),at,actor:actor.name,action,detail,edition:b.edition,operation,...(priorRecord?{priorRecord}:{}),...(invalidatedRecords.length?{invalidatedRecords}:{})});
    state2.ledger[operation]={signature,actor:actor.name,result};validate(state2,locations);return {state:state2,result,replayed:false};
  }
  function publicPackage(p,role){const x=clone(p);x.sources=x.sources.map(s=>s.restricted?{id:s.id,title:'Restricted source',version:s.version,status:'Restricted',restricted:true}:s);if(role==='observer'){x.history=x.history.map(h=>({...h,operation:undefined}));}return x;}
  return {SCHEMA,TODAY,ROLES,id,area,clone,uid,hash,canonical,revision,initial,validate,command,editable,needs,eligibility,impact,compare,body,sourceRefs,changedSources,getRecord,publicPackage,calculationState};
})();
if(typeof module!=='undefined')module.exports=EngineeringBasis;
