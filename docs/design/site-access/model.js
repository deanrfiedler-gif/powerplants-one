/* CS-06 synthetic design model. No server permissions or operational work authority. */
(function (root) {
  const clone = x => JSON.parse(JSON.stringify(x));
  const TODAY = '2026-09-16';
  const sites = [
    {id:'nursery',ref:'SYN-PPO-SIT-000601',name:'Nursery & propagation',org:'Willowbank Horticulture',address:'Synthetic nursery site · Bundaberg, QLD',zone:'Australia/Brisbane',offset:'+10:00',contact:'Casey Hart',arrival:'Visitor gate → reception → escorted internal route'},
    {id:'field',ref:'SYN-PPO-SIT-000602',name:'Field production',org:'Willowbank Horticulture',address:'Synthetic field site · Gin Gin, QLD',zone:'Australia/Brisbane',offset:'+10:00',contact:'Taylor Reed',arrival:'Field gate → sign-in shelter → nominated work area'}
  ];
  const facilities = [
    {id:'gh',site:'nursery',ref:'SYN-PPO-FAC-000601',name:'Greenhouse 01',type:'Greenhouse',use:'Crop production',crop:'Young tomato crop',parent:null},
    {id:'bay',site:'nursery',ref:'SYN-PPO-FAC-000602',name:'Propagation Bay A',type:'Growing area',use:'Propagation',crop:'Young plants',parent:'gh'},
    {id:'tunnel',site:'nursery',ref:'SYN-PPO-FAC-000603',name:'Tunnel 01',type:'Tunnel',use:'Crop production',crop:'Berry harvest',parent:null},
    {id:'prop',site:'nursery',ref:'SYN-PPO-FAC-000604',name:'Propagation House 01',type:'Greenhouse',use:'Propagation',crop:'Seedlings',parent:null},
    {id:'room',site:'nursery',ref:'SYN-PPO-FAC-000605',name:'Pack Room 01',type:'Room',use:'Packing',crop:'Non-growing facility',parent:null},
    {id:'shed',site:'nursery',ref:'SYN-PPO-FAC-000606',name:'Irrigation Shed 01',type:'Shed',use:'Irrigation equipment',crop:'Non-growing facility',parent:null},
    {id:'block',site:'field',ref:'SYN-PPO-FAC-000607',name:'Irrigation Block 01',type:'Block',use:'Irrigated crop production',crop:'Blueberries',parent:null},
    {id:'open',site:'field',ref:'SYN-PPO-FAC-000608',name:'Open Field 02',type:'Field',use:'Field production',crop:'Crop context not recorded',parent:null}
  ];
  const req = (id,title,category,site,areas,instruction,extra={}) => ({id,ref:`SYN-PPO-ACC-${id}`,revision:1,title,category,site,areas,instruction,owner:site==='nursery'?'Casey Hart':'Taylor Reed',source_ref:`SYN-PPO-SRC-${id} · r01`,source_date:'2026-09-14',review_date:'2026-09-30',approved_by:site==='nursery'?'Casey Hart':'Taylor Reed',approval:'Site-approved',activity:'all',...extra});
  const requirements = [
    req('001','Visitor arrival & nominated contact','Visitor access','nursery',[],'Use the visitor gate and report to reception. Casey Hart is the nominated site contact; confirm an escort before entering production areas.',{evidence:'Contact approval'}),
    req('002','Movement between growing areas','Biosecurity','nursery',[],'Follow the site movement plan. Do not move between crop areas until the nominated site contact confirms the route.',{evidence:'Movement plan'}),
    req('003','Individual site induction','Induction','nursery',[],'Each attending crew member needs current, reviewed induction evidence for this site.',{evidence:'Induction'}),
    req('004','Clean-down at greenhouse entry','Biosecurity','nursery',['gh','prop'],'Record tool and footwear clean-down at the designated bay for this visit, in accordance with the site instruction. The record must identify the actual destination.',{evidence:'Clean-down',review_date:'2026-09-25'}),
    req('005','Greenhouse crop-access window','Crop access','nursery',['gh'],'September crop work is limited to the recorded afternoon access window. Reconfirm if the crop stage or work scope changes.',{window:{from:'2026-09-01',to:'2026-09-30',start:'14:00',end:'16:30'}}),
    req('006','Irrigation shutdown restriction','Shutdown','nursery',['gh','shed'],'No irrigation interruption during crop-sensitive watering. Afternoon shutdown also requires the site contact’s approval for the exact visit and duration.',{activity:'irrigation',window:{from:'2026-09-01',to:'2026-09-30',start:'14:30',end:'15:30'},evidence:'Shutdown approval'}),
    req('007','Pressure instrument & required tools','Tools','nursery',['gh','shed'],'Bring the nominated pressure gauge, clean service kit and isolation equipment listed in the authorised work scope. Confirm instrument validity for the visit.',{evidence:'Tool check'}),
    req('008','Harvest movement restriction','Crop access','nursery',['tunnel'],'Use the side aisle after harvest crew departure; machinery access requires separate site confirmation.',{window:{from:'2026-09-01',to:'2026-10-15',start:'13:00',end:'16:00'}}),
    req('009','Propagation hygiene instruction','Biosecurity','nursery',['prop'],'Use the propagation-only equipment identified by the site. The recorded instruction is due for review and must be reconfirmed.',{review_date:'2026-09-12'}),
    req('010','Packing-room visitor route','Visitor access','nursery',['room'],'Use the marked perimeter route and meet the room supervisor. Do not cross active packing lines.'),
    req('011','Bay-specific restrictions unknown','Crop access','nursery',['bay'],'A bay is recorded inside Greenhouse 01. Its own crop-access and hygiene restrictions have not yet been supplied. Ask the site contact.',{approval:'Needs clarification',approved_by:'',review_date:'2026-09-18'}),
    req('012','Field visitor contact & movement','Visitor access','field',[],'Report at the sign-in shelter. Taylor Reed must confirm the work area and movement route before entry.',{evidence:'Contact approval'}),
    req('013','Block seasonal access','Crop access','field',['block'],'The nominated September access window is after the irrigation round. Confirm vehicle condition at arrival.',{window:{from:'2026-09-01',to:'2026-09-30',start:'10:00',end:'14:00'}}),
    req('014','Block clean-down record','Biosecurity','field',['block'],'Retain clean-down evidence for this visit and block; evidence from the nursery does not apply.',{evidence:'Clean-down'}),
    req('015','Open-field operating constraints','Crop access','field',['open'],'Crop stage, seasonal work windows and wet-weather restrictions are not recorded. Obtain site instructions before planning entry.',{approval:'Needs clarification',approved_by:''})
  ];
  const ev = (id,kind,areas,extra={}) => ({id,kind,site:'nursery',areas,person:'All listed visitors',recorded_by:'Alex Morgan',site_approved_by:'Casey Hart',source_ref:`SYN-PPO-EVD-${id}`,recorded_date:'2026-09-15',review_date:'2026-09-30',status:'Reviewed',notes:'Synthetic site-approved evidence retained for design review.',...extra});
  function seed(){return {schema:1,generation:0,requirements:clone(requirements),drafts:[],evidence:[
    ev('001','Contact approval',[],{notes:'Casey Hart approved as nominated contact and reception escort coordinator.'}),
    ev('002','Movement plan',['gh','shed'],{notes:'Reception → clean-down bay → greenhouse east aisle. Shed access via service path. Excludes Propagation Bay A.'}),
    ev('003','Induction',[],{person:'Riley Chen',notes:'Riley’s nursery induction confirmed against the current site instruction.'}),
    ev('004','Induction',[],{person:'Morgan Lee',review_date:'2026-09-15',notes:'Morgan’s induction has expired for the proposed visit.'}),
    ev('005','Tool check',['gh','shed'],{tool:'SYN-PPO-TOOL-000601 · PG-06 pressure gauge',review_date:'2026-09-20',notes:'Gauge calibration evidence and cleaned service kit reviewed. This is a service tool, not customer equipment or saleable stock.'})
  ],acknowledgements:[],snapshots:[],actions:[],history:[]};}
  function scopeMatches(record,facility){return record.site===facility.site && (record.areas.length===0 || record.areas.includes(facility.id));}
  function relevant(s,visit){const f=facilities.find(x=>x.id===visit.facility);return s.requirements.filter(r=>scopeMatches(r,f)&&(r.activity==='all'||r.activity===visit.activity));}
  function visitKey(v){return JSON.stringify([v.facility,v.date,v.start,v.end,v.activity,[...v.crew].sort()]);}
  function validVisit(v){return facilities.some(f=>f.id===v.facility)&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&v.date>=TODAY&&v.date<='2027-12-31'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.start)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v.end)&&v.start<v.end&&v.start>='00:00'&&v.end<='23:59'&&['inspection','irrigation'].includes(v.activity)&&v.crew.length>0;}
  function evidenceStatus(s,r,v){
    if(!r.evidence)return [];
    const f=facilities.find(x=>x.id===v.facility);
    const kinds=s.evidence.filter(e=>e.kind===r.evidence&&scopeMatches(e,f)&&e.status==='Reviewed'&&e.site_approved_by&&e.recorded_date<=v.date&&e.review_date>=v.date);
    const people=r.evidence==='Induction'?v.crew:['All listed visitors'];
    return people.flatMap(person=>{
      const ok=kinds.some(e=>(r.evidence!=='Induction'||e.person===person)&&(!['Clean-down','Shutdown approval'].includes(r.evidence)||e.visit_key===visitKey(v)));
      return ok?[]:[r.evidence==='Induction'?`${person}: current induction missing`:`${r.evidence}: current evidence missing for this scope`];
    });
  }
  function assess(s,v){
    if(!validVisit(v))return {valid:false,rows:[],blockers:1,current:0,status:'Check visit details'};
    const rows=relevant(s,v).map(r=>{
      const reasons=[];
      if(r.approval!=='Site-approved'||!r.approved_by)reasons.push('Site instruction needs clarification');
      if(r.source_date>v.date)reasons.push('Source is not yet effective');
      if(r.review_date<v.date)reasons.push('Source review overdue for this visit');
      if(r.window){const w=r.window;if(v.date<w.from||v.date>w.to)reasons.push('Outside the recorded season');else if(v.start<w.start||v.end>w.end)reasons.push(`Outside ${w.start}–${w.end} permitted window`);}
      reasons.push(...evidenceStatus(s,r,v));
      return {id:r.id,reasons,state:reasons.length?'Needs attention':'Current evidence'};
    });
    const blockers=rows.filter(r=>r.reasons.length).length;
    return {valid:true,rows,blockers,current:rows.length-blockers,status:blockers?'Preparation blocked':'Prerequisites recorded'};
  }
  function signature(s,v){return JSON.stringify({visit:visitKey(v),requirements:relevant(s,v),evidence:s.evidence.filter(e=>scopeMatches(e,facilities.find(f=>f.id===v.facility)))});}
  function apply(s,actor,action,payload,v){
    const next=clone(s);const at=new Date().toISOString();let detail='';
    if(actor==='viewer')throw Error('This preview role is read-only.');
    if(action==='draft'){
      if(actor!=='coordinator')throw Error('Only the coordinator prepares an instruction revision.');
      const p=clone(payload),base=next.requirements.find(r=>r.id===p.id);
      if(!base&&!p.is_new)throw Error('Source requirement no longer exists.');
      const origin=base||{id:p.id,ref:`SYN-PPO-ACC-${p.id}`,revision:0,site:facilities.find(f=>f.id===v.facility).site,activity:'all',category:'Visitor access'};
      for(const k of ['title','instruction','owner','source_ref','source_date','review_date'])if(!String(p[k]||'').trim())throw Error('Complete the title, instruction, owner, source and dates.');
      if(p.source_date>TODAY||p.review_date<p.source_date)throw Error('Source date cannot be in the future; review date must follow the source date.');
      if(!p.reason?.trim())throw Error('Record why the instruction is changing.');
      if(!Array.isArray(p.areas)||p.areas.some(id=>!facilities.some(f=>f.id===id&&f.site===origin.site)))throw Error('Applicability must remain within the same site.');
      if(next.drafts.some(d=>d.id===p.id))throw Error('Review or return the existing draft first.');
      next.drafts.push({...origin,...p,base_revision:origin.revision,approval:'Draft',prepared_by:'Alex Morgan',prepared_at:at});detail=`Draft prepared: ${p.title}; ${base?'active r'+base.revision+' retained':'new instruction awaits review'}.`;
    }else if(action==='review'){
      if(actor!=='reviewer')throw Error('Select the site reviewer to record a reviewed source.');
      const d=next.drafts.find(d=>d.id===payload.id),index=next.requirements.findIndex(r=>r.id===payload.id);
      if(!d||(index<0?d.base_revision!==0:next.requirements[index].revision!==d.base_revision))throw Error('Source revision changed. Prepare a fresh draft.');
      if(!payload.reason?.trim()||!payload.approved_by?.trim())throw Error('Record the site approver and review reason.');
      if(payload.decision==='publish'){
        const before=index<0?null:clone(next.requirements[index]);const after={...d,revision:(before?.revision||0)+1,approval:'Site-approved',approved_by:payload.approved_by};
        if(index<0)next.requirements.push(after);else next.requirements[index]=after;next.history.push({at,actor,action:'source-revision',detail:`${after.title}: ${before?'r'+before.revision:'new'} → r${after.revision}`,before,after:clone(after)});
        detail=`Published reviewed source r${after.revision}: ${payload.reason}. Existing preparation snapshots retained; recheck required.`;
      }else detail=`Draft returned: ${payload.reason}. Active source unchanged.`;
      next.drafts=next.drafts.filter(d=>d.id!==payload.id);
    }else if(action==='evidence'){
      const p=clone(payload),f=facilities.find(f=>f.id===v.facility);
      for(const k of ['kind','source_ref','recorded_date','review_date','site_approved_by','notes'])if(!String(p[k]||'').trim())throw Error('Record the evidence, source, site approver and dates.');
      if(p.recorded_date>TODAY||p.review_date<p.recorded_date)throw Error('Evidence dates are invalid; future performance cannot be recorded.');
      if(p.kind==='Clean-down'&&v.date!==TODAY)throw Error('Clean-down performance can only be captured for the demonstration date, 16 September 2026. Future clean-down remains unconfirmed.');
      if(p.kind==='Tool check'&&!p.tool?.trim())throw Error('Identify the tool and its calibration/check evidence.');
      const evidence={...p,id:`LOCAL-${next.generation+1}`,site:f.site,areas:[f.id],status:actor==='reviewer'?'Reviewed':'Captured',recorded_by:actor==='reviewer'?'Site reviewer':'Alex Morgan',visit_key:visitKey(v)};
      next.evidence.push(evidence);detail=`${p.kind} ${evidence.status.toLowerCase()} for ${f.name}; original evidence retained.`;
    }else if(action==='reviewEvidence'){
      if(actor!=='reviewer')throw Error('Only the site reviewer can review evidence.');
      const e=next.evidence.find(e=>e.id===payload.id);
      if(!e||e.status!=='Captured')throw Error('This evidence is no longer awaiting review.');
      e.status='Reviewed';detail=`Reviewed ${e.kind} ${e.source_ref}; recorded site approval remains visible.`;
    }else if(action==='action'){
      if(!payload.owner?.trim()||!payload.next?.trim()||!payload.due)throw Error('Record an owner, due date and next action.');
      if(next.actions.some(a=>a.requirement===payload.requirement&&a.facility===v.facility&&a.state==='Open'))throw Error('An open clarification already exists for this requirement and facility.');
      next.actions.push({...payload,id:`SYN-PPO-ACT-LOCAL-${next.generation+1}`,facility:v.facility,state:'Open',created_at:at});detail=`Owned clarification recorded for ${payload.owner}. No message sent.`;
    }else if(action==='ack'){
      if(!validVisit(v))throw Error('Correct the visit details first.');
      const person=payload.person;if(!v.crew.includes(person))throw Error('Select an attending crew member.');
      const sig=signature(next,v);
      if(!next.acknowledgements.some(a=>a.person===person&&a.signature===sig))next.acknowledgements.push({person,signature:sig,at,visit:clone(v)});
      else throw Error('This person has already acknowledged these exact instructions.');
      detail=`${person} acknowledged the exact instructions. Readiness and permission to start are unchanged.`;
    }else if(action==='snapshot'){
      const a=assess(next,v);if(!a.valid)throw Error('Correct the visit details first.');
      const sig=signature(next,v);if(next.snapshots.some(p=>p.signature===sig))throw Error('This exact preparation snapshot is already retained.');
      next.snapshots.push({id:`SYN-PPO-PREP-${String(next.snapshots.length+1).padStart(3,'0')}`,at,visit:clone(v),signature:sig,requirements:clone(relevant(next,v)),evidence:clone(next.evidence.filter(e=>scopeMatches(e,facilities.find(f=>f.id===v.facility)))),assessment:clone(a),authorisation:'Not granted',acknowledgements:clone(next.acknowledgements.filter(k=>k.signature===sig))});
      detail='Preparation snapshot retained. Booking, controlled pack issue, dispatch and work authorisation remain separate.';
    }else throw Error('Unknown action.');
    next.generation++;next.history.push({at,actor,action,detail});return next;
  }
  root.SiteAccessModel={TODAY,sites,facilities,seed,scopeMatches,relevant,visitKey,validVisit,assess,signature,apply,clone};
})(typeof window==='undefined'?globalThis:window);
