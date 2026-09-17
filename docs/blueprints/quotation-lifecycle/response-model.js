/* ES-06 synthetic domain model. No network or operational authority. */
const ResponseModel=(()=>{
 const clone=v=>JSON.parse(JSON.stringify(v));
 const need=(condition,message)=>{if(!condition)throw Error(message)};
 const clean=v=>String(v??'').trim();
 const defaults=d=>d.offers.map(o=>[o.id,o.members.find(m=>m.isDefault)?.id??null]);
 function totals(d,selection){
  need(Array.isArray(selection)&&selection.length===d.offers.length,'Selections must cover the exact issued offers.');
  const map=new Map(selection);need(map.size===d.offers.length,'Duplicate selection identity.');
  let delta=0;
  for(const o of d.offers){need(map.has(o.id),'Unknown or missing offer.');const id=map.get(o.id),m=o.members.find(x=>x.id===id);
   need(id===null||!!m,'Selected member is not in this issue.');
   need(o.type!=='alternative_group'||!!m,'Choose one permitted alternative.');
   if(!o.customerSelectable)need(id===(o.members.find(x=>x.isDefault)?.id??null),'This offer is fixed by the issue.');
   if(m)delta+=m.deltaCents;
  }
  const exGstCents=d.baseLines.reduce((n,l)=>n+l.sellCents,0)+delta-d.discountCents;
  const gstCents=Math.round(exGstCents*d.gstRateBp/10000);
  need(Number.isSafeInteger(exGstCents)&&exGstCents>=0,'Invalid frozen amount.');
  return {exGstCents,gstCents,inclGstCents:exGstCents+gstCents};
 }
 function seed(hash){return {schema:1,hash,quotation:SOURCE_DOCUMENT.quotationNumber,revision:SOURCE_DOCUMENT.revision,issueId:'SYN-PPO-QIS-0142-02',lifecycle:'issued',clock:'2026-09-16T10:00:00+10:00',role:'Coordinator',tab:'Overview',outcome:'Recorded',serial:0,operations:[],questions:[],events:[],acceptance:null,decline:null,revisionRequired:false,handover:null,viewedAt:null}}
 const active=s=>['issued','viewed','expiring'].includes(s.lifecycle)&&Date.parse(s.clock)<=Date.parse(SOURCE_DOCUMENT.validUntil);
 const outstanding=s=>s.operations.find(o=>['Unknown','Failed','Pending'].includes(o.status));
 const allowed=s=>active(s)&&!s.acceptance&&!s.decline&&!s.revisionRequired&&!outstanding(s)&&s.role!=='Read only';
 const pendingQuestions=s=>s.questions.filter(q=>q.status!=='Resolved');
 function event(s,text){s.events.unshift({id:'EV-'+(++s.serial),at:new Date().toISOString(),text})}
 function submit(s,kind,payload,hash,revision){
  need(allowed(s),'Response is held. Review the current issue and any original operation.');
  need(hash===s.hash&&revision===s.revision,'Response does not match the exact issued revision.');
  need(['accept','decline'].includes(kind),'Unknown response type.');
  let p;
  if(kind==='accept'){
   need(!pendingQuestions(s).length,'Resolve open questions before accepting this example.');
   need(payload.quotation===s.quotation&&payload.revision===s.revision,'Quotation identity changed.');
   need(payload.actingFor===SOURCE_DOCUMENT.customer.name,'Customer entity changed.');
   need(clean(payload.name)&&clean(payload.position),'Name and position are required.');
   need(/^[^\s@]+@[^\s@]+\.example$/.test(clean(payload.email)),'Use a fictional email ending in .example.');
   need(payload.consent===true&&payload.consentText===SOURCE_DOCUMENT.consentText,'Exact consent is required.');
   need(clean(payload.signature).toLowerCase()===clean(payload.name).toLowerCase(),'Signature must match the responding name.');
   const amount=totals(SOURCE_DOCUMENT,payload.selection);
   for(const k of Object.keys(amount))need(amount[k]===payload[k],'Amount differs from the issued selections.');
   p={quotation:s.quotation,revision:s.revision,name:clean(payload.name),position:clean(payload.position),email:clean(payload.email),actingFor:payload.actingFor,signature:clean(payload.signature),consentText:payload.consentText,consent:true,selection:clone(payload.selection),...amount};
  }else{need(clean(payload.reason),'A decline reason is required in this example.');p={reason:clean(payload.reason)}}
  const op={id:'SYN-PPO-RSP-'+String(++s.serial).padStart(4,'0'),kind,payload:p,hash:s.hash,revision:s.revision,status:'Pending',attempts:1,submittedAt:new Date().toISOString(),fixtureClock:s.clock,evidence:[]};
  s.operations.push(op);event(s,'Original '+kind+' response prepared: '+op.id);return op;
 }
 function finish(s,opId,outcome,note='Simulated response store outcome'){
  const o=s.operations.find(x=>x.id===opId);need(o&&o.status==='Pending','Only the pending original operation can complete.');
  need(['Recorded','Failed','Unknown'].includes(outcome),'Invalid response outcome.');
  o.status=outcome;o.evidence.push({at:new Date().toISOString(),outcome,note:clean(note)});
  if(outcome==='Recorded'){
   o.recordedAt=new Date().toISOString();
   if(o.kind==='accept'){s.acceptance={...clone(o.payload),at:o.submittedAt,recordedAt:o.recordedAt,operation:o.id,issueId:s.issueId,hash:o.hash};if(active(s))s.lifecycle='accepted'}
   else{s.decline={...clone(o.payload),at:o.submittedAt,operation:o.id,hash:o.hash};if(active(s))s.lifecycle='declined'}
  }
  event(s,o.id+' · '+outcome+'. '+clean(note));return o;
 }
 function staff(s){need(s.role==='Coordinator','Coordinator role required.');}
 function reconcile(s,id,outcome,note){staff(s);const o=s.operations.find(x=>x.id===id);need(o?.status==='Unknown','Reconcile the original unknown operation.');need(['Recorded','Failed'].includes(outcome)&&clean(note),'Record the confirmed outcome and its evidence.');o.status='Pending';return finish(s,id,outcome,note)}
 function retry(s,id,outcome){staff(s);const o=s.operations.find(x=>x.id===id);need(o?.status==='Failed','Only a confirmed failure can be retried.');need(active(s)&&!s.revisionRequired,'The issue is no longer open.');o.status='Pending';o.attempts++;return finish(s,id,outcome,'Retry of confirmed failure; original payload and operation retained.')}
 function question(s,kind,text){need(allowed(s),'This issue is not open for new questions.');need(['Clarification','Change request'].includes(kind)&&clean(text),'Select a question type and enter the request.');const q={id:'SYN-PPO-QRY-'+String(++s.serial).padStart(4,'0'),kind,text:clean(text),revision:s.revision,hash:s.hash,status:'Open',owner:'Daniel Moss',due:'2026-09-18',answers:[],at:new Date().toISOString()};s.questions.push(q);if(kind==='Change request')s.revisionRequired=true;event(s,q.id+' opened against R02.');return q}
 function answer(s,id,text,disposition){staff(s);const q=s.questions.find(x=>x.id===id);need(q&&q.status!=='Resolved'&&q.status!=='Routed to ES-05','This question is no longer awaiting action.');need(clean(text),'Record an answer or routing reason.');need(['Information only','Revise offer'].includes(disposition),'Select the response disposition.');q.answers.push({at:new Date().toISOString(),text:clean(text),actor:'Daniel Moss',disposition});q.status=disposition==='Revise offer'?'Routed to ES-05':'Answered';if(disposition==='Revise offer')s.revisionRequired=true;event(s,q.id+' · '+q.status)}
 function resolve(s,id,note){staff(s);const q=s.questions.find(x=>x.id===id);need(q?.status==='Answered'&&clean(note),'Record customer confirmation of the information-only answer.');q.status='Resolved';q.confirmation={at:new Date().toISOString(),note:clean(note)};s.revisionRequired=s.questions.some(x=>x.status==='Routed to ES-05'||x.kind==='Change request'&&x.status!=='Resolved');event(s,q.id+' resolved without changing the issued scope.')}
 function closeIssue(s,lifecycle,reason){staff(s);need(['superseded','withdrawn','expired'].includes(lifecycle)&&clean(reason),'Choose a closure and give a reason.');need(!['superseded','withdrawn'].includes(s.lifecycle),'Issue is already closed.');if(lifecycle==='expired')need(Date.parse(s.clock)>Date.parse(SOURCE_DOCUMENT.validUntil),'Validity has not expired on the demonstration clock.');s.lifecycle=lifecycle;if(s.handover)s.handover.status='Held — issue '+lifecycle+'; previous preparation retained';event(s,'Issue '+lifecycle+': '+clean(reason))}
 function handover(s,owner,due,note){staff(s);need(s.lifecycle==='accepted'&&s.acceptance&&!outstanding(s)&&!s.revisionRequired&&!pendingQuestions(s).length,'A confirmed current acceptance and resolved negotiation are required.');need(clean(owner)&&/^\d{4}-\d{2}-\d{2}$/.test(due)&&clean(note),'Owner, due date and receiving checks are required.');need(!s.handover,'This acceptance already has a prepared handover.');s.handover={id:'SYN-PPO-HND-'+String(++s.serial).padStart(4,'0'),target:'ES-07',status:'Prepared — not received or converted',owner:clean(owner),due,note:clean(note),acceptance:clone(s.acceptance),at:new Date().toISOString()};event(s,'ES-07 handover prepared; no order or work authority created.');return s.handover}
 function restore(raw,hash){
  const s=JSON.parse(raw);need(s.schema===1&&s.hash===hash&&s.quotation===SOURCE_DOCUMENT.quotationNumber&&s.revision===2,'Saved demonstration belongs to a different issue.');
  need(['issued','viewed','expiring','accepted','declined','expired','superseded','withdrawn'].includes(s.lifecycle)&&['Coordinator','Read only'].includes(s.role),'Invalid saved state.');
  need(Number.isFinite(Date.parse(s.clock))&&Number.isSafeInteger(s.serial)&&s.serial>=0,'Invalid saved clock or identity counter.');
  need(Array.isArray(s.operations)&&Array.isArray(s.questions)&&Array.isArray(s.events),'Invalid saved evidence.');need(new Set(s.operations.map(o=>o.id)).size===s.operations.length,'Duplicate operation identity.');
  for(const o of s.operations){
   need(o.hash===hash&&o.revision===2&&['accept','decline'].includes(o.kind)&&['Recorded','Failed','Unknown','Pending'].includes(o.status)&&Array.isArray(o.evidence),'Saved response has mismatched issue evidence.');
   if(o.kind==='accept'){const t=totals(SOURCE_DOCUMENT,o.payload.selection);for(const k of Object.keys(t))need(t[k]===o.payload[k],'Saved amount differs from its selected scope.');need(o.payload.quotation===s.quotation&&o.payload.revision===2&&o.payload.consent===true&&o.payload.consentText===SOURCE_DOCUMENT.consentText&&o.payload.actingFor===SOURCE_DOCUMENT.customer.name&&clean(o.payload.signature).toLowerCase()===clean(o.payload.name).toLowerCase(),'Saved response content is incomplete.');}
   if(o.status==='Pending'){o.status='Unknown';o.evidence.push({at:new Date().toISOString(),outcome:'Unknown',note:'Interrupted operation recovered; reconcile its original identity.'})}
  }
  need(s.operations.filter(o=>o.status==='Recorded').length<=1,'More than one final response exists for this issue.');
  for(const q of s.questions)need(q.hash===hash&&q.revision===2&&Array.isArray(q.answers)&&['Open','Answered','Resolved','Routed to ES-05'].includes(q.status),'Saved question does not match this issue.');
  if(s.acceptance){const o=s.operations.find(o=>o.id===s.acceptance.operation);need(o?.status==='Recorded'&&o.kind==='accept'&&s.acceptance.hash===hash,'Acceptance is missing its recorded operation.');for(const k of Object.keys(o.payload))need(JSON.stringify(s.acceptance[k])===JSON.stringify(o.payload[k]),'Acceptance receipt differs from the original response.');}
  if(s.decline)need(s.operations.some(o=>o.id===s.decline.operation&&o.status==='Recorded'&&o.kind==='decline'&&o.payload.reason===s.decline.reason),'Decline is missing its recorded operation.');
  need(s.lifecycle!=='accepted'||!!s.acceptance,'Accepted state lacks its response.');need(s.lifecycle!=='declined'||!!s.decline,'Declined state lacks its response.');
  if(s.handover)need(s.acceptance&&JSON.stringify(s.handover.acceptance)===JSON.stringify(s.acceptance),'Handover differs from the acceptance.');
  if(s.draft){totals(SOURCE_DOCUMENT,s.draft.selection);s.draft.form={...s.draft.form,actingFor:SOURCE_DOCUMENT.customer.name,consent:false}}
  return s;
 }
 return {clone,seed,totals,defaults,active,outstanding,allowed,pendingQuestions,submit,finish,reconcile,retry,question,answer,resolve,closeIssue,handover,restore,event};
})();
