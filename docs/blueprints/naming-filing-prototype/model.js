/* Synthetic, in-memory design model. No provider calls or application persistence. */
(() => {
  const work = Object.freeze({reference:'SYN-PPO-WO-000001',appointment:'SYN-PPO-APT-000001',equipment:'SYN-PPO-AST-000001',report:'SYN-PPO-RPT-000001',title:'Irrigation controller service',organisation:'Banksia Demonstration Nursery',site:'Example propagation site',facility:'Greenhouse 2',area:'Growing area A'});
  const folder = `Work Documents/${work.reference} - ${work.title}`;
  const rules = Object.freeze({version:'PPO-STD-001 r04',maxFilename:120,maxPath:200});
  const slug = s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const extension = s => (s.match(/\.[a-z0-9]+$/i)||[''])[0].toLowerCase();
  function candidate(type,description) {
    const d=slug(description); if(!d)return '';
    return `${type==='photo'?work.appointment:work.reference}-${d}${type==='photo'?'.png':'.docx'}`;
  }
  function initial() {
    const note=`${work.reference}-site-access-notes.docx`, check=`${work.reference}-inspection-checklist.docx`;
    const records=[
      {id:'notes',name:'access notes FINAL.docx',suggested:note,description:'Site access notes',state:'Ready',reason:'Confirmed work reference and document description.'},
      {id:'photo',name:'controller pic 2.PNG',suggested:`${work.appointment}-controller-terminal-photo-02.png`,description:'Controller terminal photo',state:'Ready',reason:'Confirmed appointment, equipment and photo sequence.'},
      {id:'unknown',name:'notes final.pdf',suggested:'',description:'Unmatched incoming document',state:'NeedsInformation',reason:'The owning work and content revision are unknown. Identify the source before suggesting a name.'},
      {id:'supplier',name:'Climate-controller-manual-v2.pdf',suggested:'',description:'Supplier manual',state:'Protected',reason:'Supplier-controlled original. Retain its name and add a reviewed search alias.'},
      {id:'cad',name:'Pump-Assembly.SLDASM',suggested:'',description:'Native assembly',state:'Protected',reason:'Native CAD dependencies have not been verified. Retain the source filename.'},
      {id:'collision',name:'checklist latest.docx',suggested:check,description:'Inspection checklist',state:'Conflict',reason:'That name is already used in this folder. Choose a distinct, meaningful description.'},
      {id:'canonical',name:check,suggested:check,description:'Existing inspection checklist',state:'Compliant',reason:'The original stored name already follows the rule.'}
    ].map(x=>({...x,original:x.name,recordRef:x.id==='unknown'?null:work.reference,folder,version:1,hash:`fixture-content-${x.id}`,providerName:x.name,providerVersion:1}));
    return {actor:'Reviewer',records,events:[],operations:[],drafts:[],tasks:[],report:null,sequence:0};
  }
  function event(s,type,detail,objectId,operationId='') {
    const e=Object.freeze({id:`event-${++s.sequence}`,type,detail,objectId,operationId,actor:s.actor,time:new Date().toISOString()});s.events.unshift(e);return e;
  }
  function writable(s){if(s.actor!=='Reviewer')throw Error('Read-only preview: change to Reviewer to simulate this action.');}
  function find(s,id){const r=s.records.find(x=>x.id===id);if(!r)throw Error('This sample record is unavailable.');return r;}
  function validate(s,name,original,destination=folder,id='') {
    if(!name||!name.trim())return 'Enter a useful filename.';
    if(name!==name.trim()||/[. ]$/.test(name))return 'Remove leading or trailing spaces and trailing dots.';
    if(!/^[A-Za-z0-9][A-Za-z0-9 ._-]*\.[A-Za-z0-9]+$/.test(name)||name.includes('..'))return 'Use portable letters, numbers, spaces, hyphens and a valid extension. Paths are not filenames.';
    if(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name))return 'This name is reserved by common file systems.';
    if(extension(name)!==extension(original))return 'Keep the original file extension. Renaming does not convert its format.';
    if(name.length>rules.maxFilename)return 'Shorten the description: this preview allows 120 characters including the extension.';
    if((destination+'/'+name).length>rules.maxPath)return 'Shorten the filename or folder: the preview path target is 200 characters.';
    if(s.records.some(x=>x.id!==id&&x.folder===destination&&x.providerName.toLowerCase()===name.toLowerCase()))return 'That name is already used in this folder. Choose a distinct description.';
    return '';
  }
  function convention(name,reference){const start=reference+'-';if(!name.startsWith(start))return 'Keep the confirmed reference '+reference+' and edit the description only.';const description=name.slice(start.length,-extension(name).length);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(description))return 'Use lowercase words separated by hyphens for the description.';return '';}
  function preview(s,id){const r=find(s,id);return Object.freeze({id,version:r.version,providerVersion:r.providerVersion,name:r.name,hash:r.hash,rule:rules.version});}
  function apply(s,p,name,outcome='normal') {
    writable(s);const r=find(s,p.id);
    if(['Applied','Compliant','Retained'].includes(r.state))return {state:r.state,id:r.id,replayed:true};
    if(r.state==='OutcomeUnknown')throw Error('The outcome is unconfirmed. Investigate this operation before trying again.');
    if(['Protected','NeedsInformation'].includes(r.state))throw Error(r.reason);
    if(r.version!==p.version||r.providerVersion!==p.providerVersion||r.name!==p.name||r.hash!==p.hash||p.rule!==rules.version)throw Error('This source changed after preview. Close and reopen the review before applying.');
    const error=validate(s,name,r.original,r.folder,r.id)||convention(name,r.id==='photo'?work.appointment:work.reference);if(error)throw Error(error);
    if(name===r.name)throw Error('The proposed name is unchanged. Retain the original or enter a new name.');
    const op={id:`operation-${++s.sequence}`,itemId:r.id,before:r.name,target:name,hash:r.hash,state:'Pending'};s.operations.push(op);
    event(s,'Naming reviewed',`${r.name} → ${name}; ${rules.version}`,r.id,op.id);
    if(outcome==='fail') {op.state='Failed';r.state='Failed';event(s,'Rename not applied','The simulated provider was unavailable. The original name is retained.',r.id,op.id);return op;}
    r.providerName=name;r.providerVersion++;
    if(outcome==='unknown'){op.state='OutcomeUnknown';r.state='OutcomeUnknown';event(s,'Outcome unconfirmed','The response was lost. Investigate this exact item before retrying.',r.id,op.id);return op;}
    r.name=name;r.version++;r.state='Applied';op.state='Applied';event(s,'Rename applied',`${op.before} → ${name}. Content identity retained.`,r.id,op.id);return op;
  }
  function reconcile(s,id){writable(s);const r=find(s,id),op=[...s.operations].reverse().find(x=>x.itemId===id&&x.state==='OutcomeUnknown');
    if(!op)return {state:r.state,replayed:true};
    if(r.providerName===op.target&&r.hash===op.hash){r.name=op.target;r.version++;r.state='Applied';op.state='Applied';event(s,'Rename confirmed',`${op.before} → ${r.name}. Investigation found one applied operation; no repeat rename.`,id,op.id);return op;}
    throw Error('Investigation could not verify the expected item and content. Keep this exception open.');
  }
  function retain(s,id,reason,expected){writable(s);const r=find(s,id);if(expected&&(r.version!==expected.version||r.providerVersion!==expected.providerVersion))throw Error('This source changed after preview. Close and reopen the review before retaining its name.');if(r.state==='OutcomeUnknown')throw Error('Investigate the unconfirmed operation before recording a new decision.');if(!reason.trim())throw Error('Explain why the original name should be retained.');if(['Applied','Compliant','Retained'].includes(r.state))return r;r.state='Retained';r.version++;r.exception=reason.trim();event(s,'Original retained',`${r.original}. Reason: ${r.exception}`,r.id);return r;}
  function batch(s,previews,outcome='normal') {writable(s);return previews.map((p,i)=>{try{return apply(s,p,find(s,p.id).suggested,outcome==='fail'&&i===previews.length-1?'fail':'normal');}catch(error){event(s,'Batch item refused',error.message,p.id);return {itemId:p.id,state:'Refused',reason:error.message};}});}
  function sourceChange(s,id){const r=find(s,id);r.providerVersion++;r.version++;event(s,'Source changed','A later provider version was simulated after this preview.',id);}
  function upload(s,{name,original,description,destination=folder}) {writable(s);const match=s.records.find(x=>x.uploadIntent===JSON.stringify([name,original,description,destination]));if(match)return {...match,replayed:true};
    if(!description.trim())throw Error('Add a description from confirmed context.');if(destination!==folder)throw Error('That destination is outside the approved sample folder.');const error=validate(s,name,original,destination)||convention(name,extension(original)==='.png'?work.appointment:work.reference);if(error)throw Error(error);
    const id=`upload-${++s.sequence}`,r={id,name,original,suggested:name,description,recordRef:work.reference,folder:destination,state:'Applied',version:1,providerVersion:1,providerName:name,hash:`fixture-content-${id}`,uploadIntent:JSON.stringify([name,original,description,destination])};s.records.push(r);event(s,'File saved',`${original} → ${name}; ${destination}. Synthetic storage verified.`,id);return r;
  }
  function issue(s){writable(s);if(s.report)return {...s.report,replayed:true};s.report=Object.freeze({reference:work.report,revision:1,name:`${work.report}-service-report-r01.pdf`,workReference:work.reference,template:'synthetic-service-report-r01',source:'pre-reviewed-fixture-r01',state:'IssuedSimulation'});event(s,'Report issued',`${s.report.name}. Pre-reviewed fixture; exact simulated revision retained.`,work.report);return s.report;}
  function subject({mode='new',reference=work.reference,purpose='Service visit',description='Confirm site access',original="Re: Access for next week's service visit"}={}){if(mode==='reply')return original;const prefix=`[${reference}]`;const clean=description.split(prefix).join('').trim().replace(/^[–—-]\s*/,'');return `${prefix} ${purpose.trim()} – ${clean}`;}
  function saveDraft(s,{subject:line,mode='new',reference=work.reference,original="Re: Access for next week's service visit"}){writable(s);if(mode==='outlook')throw Error('Native Outlook composition is a later integration. This preview cannot save an Outlook draft.');if(!line.trim()||line.length>200)throw Error('Use a clear subject of 1–200 characters in this preview.');if(mode==='reply'&&line!==original)throw Error('Preserve the original reply subject in this journey.');if(reference===work.report&&!s.report)throw Error('Simulate the report issue before preparing this report email.');const previous=s.drafts.find(x=>x.subject===line&&x.mode===mode&&x.reference===reference);if(previous)return {...previous,replayed:true};const d={id:`draft-${++s.sequence}`,subject:line,mode,reference,state:'LocalSimulation'};s.drafts.push(d);event(s,'Draft saved',`${line}. Local simulation only; no message sent.`,d.id);return d;}
  function task(s,{title,due}){writable(s);title=title.trim();due=due||null;if(!title.trim()||title.length>160)throw Error('Enter an action title of 1–160 characters.');if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw Error('Use a valid date or leave the due date unknown.');const existing=s.tasks.find(x=>x.title===title&&x.due===due);if(existing)return {...existing,replayed:true};const t={id:`task-${++s.sequence}`,title,due:due||null,owner:'Riley — sample coordinator',reference:work.reference,notification:subject({purpose:'Action required',description:title}),state:'Open'};s.tasks.push(t);event(s,'Task created',`${title}; ${due||'due date not yet known'}. Notification prepared; not sent.`,t.id);return t;}
  globalThis.NamingModel=Object.freeze({work,folder,rules,initial,candidate,validate,preview,apply,reconcile,retain,batch,sourceChange,upload,issue,subject,saveDraft,task});
})();
