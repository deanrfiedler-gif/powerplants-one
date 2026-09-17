'use strict';
/* Pure in-memory domain model. No network, storage, ERP or communications. */
globalThis.PPODealModel = (() => {
  const F=globalThis.PPODealFixtures, clone=x=>structuredClone(x);
  const fail=message=>{throw new Error(message);};
  const required=(x,label,max=2000)=>{const v=String(x??'').trim();if(!v||v.length>max)fail(label+' is required (maximum '+max+' characters).');return v;};
  const day=x=>{if(!x)return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(x)||new Date(x+'T00:00:00Z').toISOString().slice(0,10)!==x)fail('Enter a valid date.');return x;};
  const cents=x=>{if(x===''||x===null)return null;if(!/^\d+(\.\d{1,2})?$/.test(String(x)))fail('Enter a non-negative amount with up to two decimal places.');const n=Math.round(Number(x)*100);if(!Number.isSafeInteger(n)||n>999999999999)fail('Amount exceeds the supported range.');return n;};
  const user=id=>F.users.find(u=>u.id===id)||fail('Choose an available employee.');
  const stage=(s,d)=>s.pipeline.stages.find(x=>x.id===d.stage);
  const editable=(d,actor)=>user(actor).role==='Sales owner'&&d.owner===actor;
  const age=(when,asAt=F.now)=>Math.max(0,Math.floor((Date.parse(asAt)-Date.parse(when))/86400000));
  const initial=()=>({schema:1,pipeline:{id:'sales',name:'Sales pipeline',probability:true,rotting:true,version:1,stages:clone(F.stages)},deals:clone(F.deals),receipts:{}});
  const weighted=(s,d)=>!s.pipeline.probability||d.value===null?null:d.forecast==='Omitted'||d.outcome!=='Open'?0:Math.round(d.value*stage(s,d).probability/100);
  const health=(s,d)=>{
    if(d.outcome!=='Open')return [];
    const today=F.now.slice(0,10),a=d.activities.find(x=>x.designated&&x.status!=='Complete'),items=[];
    if(!a)items.push({id:'activity',label:'No next activity',detail:'Plan a customer follow-up and name its owner.',tone:'danger'});
    else if(!a.due)items.push({id:'activity',label:'Activity date needed',detail:a.title+' needs a due date.',tone:'warning'});
    else if(a.due<today)items.push({id:'activity',label:'Activity overdue',detail:a.title+' · '+a.due,tone:'danger'});
    const st=stage(s,d);
    if(s.pipeline.rotting&&st.rotting&&age(d.touched)>=st.days)items.push({id:'rotting',label:'Rotting · '+age(d.touched)+' days',detail:'No deal update or recorded activity for '+age(d.touched)+' days; '+st.name+' threshold is '+st.days+' days.',tone:'warning'});
    if(d.close&&d.close<today)items.push({id:'close',label:'Expected close passed',detail:'Review the expected close date and customer next step.',tone:'warning'});
    if(d.value===null)items.push({id:'value',label:'Value not estimated',detail:'The unknown amount is excluded from weighted value.',tone:'neutral'});
    for(const t of d.tasks.filter(t=>t.status!=='Complete'&&(t.status==='Blocked'||t.due&&t.due<today)))items.push({id:'task',label:t.status==='Blocked'?'Internal task blocked':'Internal task overdue',detail:t.title,tone:'warning'});
    return items;
  };
  const command=(state,actor,e)=>{
    const u=user(actor);if(u.role==='Read only')fail('This preview identity has read-only access.');
    if(!e||!e.id||!e.action)fail('A named operation is required.');
    const d0=state.deals.find(d=>d.id===e.dealId);if(!d0)fail('Opportunity unavailable.');
    const intakeReview=['intakeAccept','intakeReturn'].includes(e.action),activityFinish=e.action==='activityComplete',taskFinish=e.action==='taskComplete';
    const ownedWork=activityFinish?d0.activities.find(a=>a.id===e.payload.id):taskFinish?d0.tasks.find(t=>t.id===e.payload.id):null;
    if(intakeReview?u.role!=='Estimator':ownedWork?ownedWork.owner!==actor:!editable(d0,actor))fail('This action is not available to the current preview identity.');
    const fingerprint=JSON.stringify({actor,dealId:e.dealId,action:e.action,payload:e.payload,version:e.version});
    const previous=state.receipts[e.id];if(previous){if(previous.fingerprint!==fingerprint)fail('The original operation was used with different content.');return {state,result:clone(previous.result),replayed:true};}
    if(e.version!==d0.version)fail('This deal changed. Review the current version before retrying.');
    const s=clone(state),d=s.deals.find(x=>x.id===e.dealId),p=e.payload||{},timestamp=F.now;
    const ensureOpen=()=>{if(d.outcome!=='Open')fail('The sales outcome is closed. This action is unavailable.');};
    let label='',touch=false,kind='Updated';
    if(e.action==='info'){
      d.title=required(p.title,'Deal title',200);d.value=cents(p.value);d.close=day(p.close);d.forecast=['Pipeline','Best case','Commit','Omitted'].includes(p.forecast)?p.forecast:fail('Choose a forecast category.');
      if(p.contactId&&!d.contacts.some(c=>c.id===p.contactId))fail('Choose a linked contact.');
      d.contacts.forEach(c=>c.primary=c.id===p.contactId);d.contactUnknown=p.contactId?'':required(p.contactUnknown,'Reason the contact is unknown',1000);label='Updated deal information.';touch=true;
    }else if(e.action==='scope'){
      d.scope={...d.scope,...Object.fromEntries(['need','inclusions','exclusions','assumptions','questions','crop','window'].map(k=>[k,k==='need'?required(p[k],'Customer need',2000):String(p[k]||'').trim().slice(0,5000)])),requestedDate:day(p.requestedDate)};
      const ids=p.locations||[];if(ids.some(id=>!d.locations.some(x=>x.id===id)))fail('Choose an available scope location.');d.locations.forEach(l=>l.selected=ids.includes(l.id));label='Updated working scope; submitted briefs retain their captured basis.';touch=true;
    }else if(e.action==='stage'){
      ensureOpen();const from=s.pipeline.stages.findIndex(x=>x.id===d.stage),to=s.pipeline.stages.findIndex(x=>x.id===p.stage);if(to<0||to===from||to>from+1)fail('Move forward one stage or return to an earlier stage.');
      const reason=required(p.reason,'Stage change reason',1000);if(to===1&&!d.contacts.some(c=>c.primary)&&!d.activities.some(a=>a.status!=='Complete'&&a.owner===d.owner&&a.designated))fail('Identify a contact or an owned contact-identification activity.');
      label='Moved from '+s.pipeline.stages[from].name+' to '+s.pipeline.stages[to].name+'. '+reason;d.stage=p.stage;d.stageEntered=timestamp;kind='Stage';touch=true;
    }else if(e.action==='transfer'){
      const target=user(p.owner);if(target.role!=='Sales owner'||target.id===d.owner)fail('Choose another eligible sales owner.');label='Transferred deal ownership from '+user(d.owner).name+' to '+target.name+'. '+required(p.reason,'Transfer reason',1000)+'. Activity and task owners are unchanged.';d.owner=target.id;kind='Ownership';
    }else if(e.action==='activitySave'){
      const prior=p.id&&d.activities.find(a=>a.id===p.id);if(p.id&&!prior)fail('Activity unavailable.');if(prior?.status==='Complete')fail('Completed activity evidence is retained.');
      const owner=user(p.owner);if(owner.role==='Read only')fail('Choose an active work owner.');if(p.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time))fail('Enter a valid time.');if(p.time&&!p.due)fail('A timed activity needs a date.');
      const a={id:prior?.id||'act-'+e.id,title:required(p.title,'Activity purpose',200),type:['Call','Meeting','Visit','Technical follow-up','Supplier follow-up','Email'].includes(p.type)?p.type:fail('Choose an activity type.'),owner:owner.id,due:day(p.due),time:p.time||'',status:'Open',outcome:'',designated:!!p.designated};
      if(a.designated)d.activities.forEach(x=>x.designated=false);if(prior)Object.assign(prior,a);else d.activities.unshift(a);label=(prior?'Updated':'Planned')+' activity: '+a.title;kind='Activity';
    }else if(e.action==='activityComplete'){
      const a=d.activities.find(x=>x.id===p.id);if(!a||a.status==='Complete')fail('This activity is already complete or unavailable.');a.outcome=required(p.outcome,'Activity outcome',2000);a.status='Complete';a.completedAt=timestamp;a.designated=false;label='Completed '+a.title+'. '+a.outcome;kind='Activity';touch=true;
    }else if(e.action==='taskSave'){
      const prior=p.id&&d.tasks.find(t=>t.id===p.id);if(p.id&&!prior)fail('Task unavailable.');if(prior?.status==='Complete')fail('Completed task evidence is retained.');const owner=user(p.owner);if(owner.role==='Read only')fail('Choose an active task owner.');
      const status=['Open','In progress','Blocked'].includes(p.status)?p.status:fail('Choose a task status.');
      const t={id:prior?.id||'task-'+e.id,title:required(p.title,'Task title',200),description:String(p.description||'').slice(0,2000),owner:owner.id,due:day(p.due),priority:['Normal','High'].includes(p.priority)?p.priority:'Normal',status,blocked:status==='Blocked'?required(p.blocked,'Blocking reason',1000):'',milestone:String(p.milestone||''),completedAt:null};
      if(prior)Object.assign(prior,t);else d.tasks.unshift(t);label=(prior?'Updated':'Created')+' internal task: '+t.title;kind='Task';
    }else if(e.action==='taskComplete'){
      const t=d.tasks.find(x=>x.id===p.id);if(!t||t.status==='Complete')fail('This task is already complete or unavailable.');if(t.status==='Blocked')fail('Resolve the blocked state before completing the task.');t.status='Complete';t.completedAt=timestamp;t.completion=required(p.outcome,'Completion note',1000);label='Completed task: '+t.title+'. '+t.completion;kind='Task';
    }else if(e.action==='waiting'){
      ensureOpen();d.waiting=p.party?{party:required(p.party,'Waiting on',100),note:required(p.note,'Dependency note',1000)}:null;label=d.waiting?'Waiting on '+d.waiting.party+'. '+d.waiting.note:'Cleared waiting-on dependency.';
    }else if(e.action==='contact'){
      const c=d.contacts.find(x=>x.id===p.id);if(!c)fail('Choose a linked person.');c.role=required(p.role,'Deal role',160);c.engaged=!!p.engaged;if(p.primary){d.contacts.forEach(x=>x.primary=false);c.primary=true;d.contactUnknown='';}label='Updated deal participation for '+c.name+'. Shared person identity is unchanged.';kind='Contact';
    }else if(['intakeDraft','intakeSubmit','intakeRevise','intakeAccept','intakeReturn'].includes(e.action)){
      ensureOpen();const intake=d.intake;
      if(e.action==='intakeRevise'){if(!['Returned','Accepted for estimating'].includes(intake.status))fail('Only a returned or accepted brief can be revised.');intake.revision++;intake.status='Draft';intake.basis=null;label='Prepared a new brief revision; earlier submissions remain in history.';}
      else if(intakeReview){if(intake.status!=='Submitted')fail('Only the exact submitted brief can be reviewed.');if(intake.owner!==actor)fail('Only the named receiving estimator may review this brief.');intake.note=required(p.note,'Receiving review note',1500);intake.status=e.action==='intakeAccept'?'Accepted for estimating':'Returned';label=intake.status+' · brief r'+intake.revision+'. '+intake.note;}
      else {if(!['Draft','Not prepared'].includes(intake.status))fail('Revise this brief before changing its submitted basis.');if(user(p.owner).role!=='Estimator')fail('Choose a receiving estimator.');intake.owner=p.owner;intake.due=day(p.due);intake.note=String(p.note||'').slice(0,1500);intake.status='Draft';
        if(e.action==='intakeSubmit'){if(!d.scope.need||!d.locations.some(x=>x.selected)||!intake.due)fail('A customer need, selected scope location and requested review date are required.');if(!p.ack)fail('Confirm the exact scope and evidence before submitting.');intake.status='Submitted';intake.basis={dealVersion:d.version,need:d.scope.need,scope:clone(d.scope),locations:d.locations.filter(x=>x.selected).map(x=>x.id),documents:d.documents.filter(x=>x.status!=='Superseded'&&x.category!=='Quotation').map(x=>({id:x.id,revision:x.revision})),submittedAt:timestamp};}
        label=intake.status==='Submitted'?'Submitted exact brief r'+intake.revision+' to '+user(intake.owner).name+'.':'Saved estimating brief draft.';
      }
      intake.history.push({status:intake.status,revision:intake.revision,at:timestamp,by:actor,note:intake.note,basis:clone(intake.basis)});kind='Handover';
    }else if(e.action==='adoptValue'){
      const q=d.quotes.find(x=>x.id===p.sourceId),est=d.estimates.find(x=>x.id===p.sourceId),source=q||est;if(!source||source.revision!==p.revision||source.value===null)fail('The selected exact source is unavailable or unpriced.');required(p.reason,'Value change reason',1000);const before=d.value;d.value=source.value;d.valueSource={id:source.id,revision:source.revision,at:timestamp};label='Adopted value from '+source.ref+' r'+source.revision+'; previous cents '+String(before)+'. '+p.reason;kind='Commercial';touch=true;
    }else if(e.action==='message'){
      if(!['Draft','Communication note'].includes(p.kind))fail('Choose a supported correspondence type.');const subject=required(p.subject,'Subject',200),body=required(p.body,'Message or note',5000);if(p.kind==='Draft'&&!d.contacts.some(c=>c.id===p.contactId&&c.email))fail('Choose a contact with a recorded email.');
      d.messages.unshift({id:'msg-'+e.id,kind:p.kind,subject,body,from:u.name,to:p.kind==='Draft'?d.contacts.find(c=>c.id===p.contactId).email:'Internal note',at:timestamp,filed:p.kind==='Communication note',private:p.kind==='Draft',owner:actor,source:'Local preview · not sent',documentIds:[]});label=p.kind==='Draft'?'Prepared a private email draft. No message sent.':'Filed a communication note: '+subject;kind='Correspondence';
    }else if(e.action==='fileMessage'){
      const m=d.messages.find(x=>x.id===p.id);if(!m||m.owner!==actor||m.filed)fail('Only your unfiled draft can be filed.');m.filed=true;m.private=false;label='Filed correspondence draft against the deal; it remains unsent.';kind='Correspondence';
    }else if(e.action==='document'){
      if(p.document){const doc=clone(p.document);if(!doc.id||!doc.name||!doc.bytes||!['application/pdf','image/png','image/jpeg','image/webp','text/plain'].includes(doc.mime))fail('Unsupported document.');if(d.documents.some(x=>x.bytes===doc.bytes))fail('This exact file is already linked.');if(doc.size>10485760||doc.size<1)fail('Use a non-empty file no larger than 10 MB.');const total=s.deals.flatMap(x=>x.documents).reduce((n,x)=>n+(x.source==='Local attachment'?x.size:0),0);if(total+doc.size>52428800)fail('The 50 MB session attachment limit has been reached.');Object.assign(doc,{id:'doc-'+e.id,revision:1,status:'Attachment',source:'Local attachment',audience:'Internal',at:timestamp});d.documents.push(doc);label='Attached '+doc.name+' for this browser session.';}
      else fail('Choose a supporting file.');kind='Document';
    }else if(e.action==='delivery'){
      const numbers=['lead','transit','installation'];if(numbers.some(k=>!/^\d+$/.test(String(p[k]))||Number(p[k])>3650))fail('Enter whole calendar-day durations between 0 and 3,650.');d.delivery={required:day(p.required),plannedOrder:day(p.plannedOrder),confirmed:day(p.confirmed),evidence:required(p.evidence,'Supplier evidence reference',200),...Object.fromEntries(numbers.map(k=>[k,Number(p[k])]))};if(!d.delivery.required||!d.delivery.plannedOrder||!d.delivery.confirmed)fail('Complete all planning and evidence dates.');if(d.delivery.confirmed>F.now.slice(0,10))fail('Evidence confirmation cannot be in the future.');label='Updated a sourced delivery planning comparison; no booking or delivery promise created.';
    }else if(e.action==='outcome'){
      ensureOpen();if(!['Won','Lost'].includes(p.outcome))fail('Choose Won or Lost.');if(p.outcome==='Won'&&d.stage!=='closing')fail('Won is available only from Closing in this preview pipeline.');
      if(p.outcome==='Lost'&&!['Price','Competitor','Timing','No decision'].includes(p.reason))fail('Choose a supported Lost reason.');if(p.outcome==='Won')required(p.evidence,'Acceptance or order evidence',2000);d.outcome=p.outcome;d.lostReason=p.outcome==='Lost'?p.reason:null;d.outcomeEvidence=p.outcome==='Won'?p.evidence:null;
      if(p.outcome==='Won'){const q=d.quotes.find(x=>x.accepted);d.handover={status:'Handover due',closingOwner:actor,outcomeVersion:d.version+1,at:timestamp,evidence:p.evidence,route:'',receiver:'',note:'',basis:q?{quoteId:q.id,revision:q.revision,option:q.accepted.option,value:q.value}:null,prepared:[]};}
      label='Recorded '+p.outcome+'. '+(p.outcome==='Won'?'Handover due; no order, project or service work created. Evidence: '+p.evidence:'Reason: '+p.reason)+ (p.note?' '+p.note:'');kind='Outcome';
    }else if(e.action==='handoverPrepare'){
      if(d.outcome!=='Won'||!d.handover)fail('A Won handover obligation is required.');if(!['Projects','Service','Supply / sales order'].includes(p.route))fail('Choose a receiving route.');const receiver=required(p.receiver,'Proposed receiving queue or owner',200),note=required(p.note,'Handover preparation note',2000);
      if(d.handover.prepared.length)fail('An exact preparation already exists; inspect it before preparing another.');d.handover.prepared.push({id:'prepared-'+e.id,at:timestamp,by:actor,route:p.route,receiver,note,outcomeVersion:d.handover.outcomeVersion,acceptance:clone(d.handover.basis)});label='Prepared a receiving handover for '+p.route+'. It has not been sent or accepted.';kind='Handover';
    }else if(e.action==='pipeline'){
      if(p.version!==s.pipeline.version)fail('Pipeline settings changed. Review the current configuration.');s.pipeline.name=required(p.name,'Pipeline name',120);s.pipeline.probability=!!p.probability;s.pipeline.rotting=!!p.rotting;
      if(!Array.isArray(p.stages)||p.stages.length!==s.pipeline.stages.length)fail('Use the full Deals pipeline editor to add, delete or reorder stages.');const names=new Set();
      for(const old of s.pipeline.stages){const proposed=p.stages.find(x=>x.id===old.id);if(!proposed)fail('Stage identity must be retained.');const name=required(proposed.name,'Stage name',80);if(names.has(name.toLowerCase()))fail('Use a different name for each stage.');names.add(name.toLowerCase());if(!Number.isInteger(Number(proposed.probability))||Number(proposed.probability)<0||Number(proposed.probability)>100)fail('Probability must be a whole percentage from 0 to 100.');if(!Number.isInteger(Number(proposed.days))||Number(proposed.days)<1||Number(proposed.days)>3650)fail('Rotting days must be a whole number from 1 to 3,650.');Object.assign(old,{name,probability:Number(proposed.probability),rotting:!!proposed.rotting,days:Number(proposed.days)});}s.pipeline.version++;label='Updated shared preview pipeline settings. Deal activity dates are unchanged.';kind='Configuration';
    }else fail('Unsupported action.');
    d.version++;if(touch)d.touched=timestamp;d.history.unshift({id:'event-'+e.id,kind,at:timestamp,by:actor,text:label,version:d.version});
    const result={dealId:d.id,version:d.version,label,operation:e.id};s.receipts[e.id]={fingerprint,result};return {state:s,result:clone(result),replayed:false};
  };
  return {initial,command,clone,required,day,cents,user,editable,weighted,health,age,stage};
})();
