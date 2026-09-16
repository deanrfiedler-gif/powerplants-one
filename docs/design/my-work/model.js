(function(root){
  'use strict';
  const Q=root.QA_MODEL, TODAY='2026-09-16', clone=x=>JSON.parse(JSON.stringify(x));
  const must=(v,m)=>{if(!v)throw Error(m);};
  const text=(v,label,min=8)=>{must(typeof v==='string'&&v.trim().length>=min&&v.length<=2000,`${label}: enter ${min}–2,000 characters.`);return v.trim();};
  const date=v=>{must(/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Enter a real calendar date.');return v;};
  const people=['Robin Ellis','Casey Reed','Alex Morgan'];
  const roles={coordinator:{name:people[0],title:'Service coordinator',team:true,domains:['CRM','Projects','Supply Chain','Service','Engineering','Quality']},reviewer:{name:people[1],title:'Assurance reviewer',team:true,domains:['Quality','Engineering','Service','Projects']},technician:{name:people[2],title:'Assigned technician',team:false,domains:['Quality','Service']},observer:{name:'Jamie Walker',title:'Read-only observer',team:false,domains:['Quality','Service','Projects']}};
  const filters=()=>({q:'',owner:'mine',domain:'',due:'',status:'active'});
  const views=['today','actions','reviews','blocked','team','updates'];
  function seed(){
    let assurance=Q.seed(),n=0;
    const run=(type,payload,role)=>{assurance=Q.command(assurance,{op:'seed-mw-'+(++n),type,packageId:'qa-1',expectedVersion:assurance.version,payload,at:'2026-09-16T00:00:00Z'},role).state;};
    run('readiness',{id:'access',evidence:'Fictional site contact confirmed the Irrigation room and Glasshouse 02 visit.',validUntil:TODAY,confirm:true},'coordinator');run('acknowledge',{confirm:true},'technician');
    run('draft',{values:{pressure:{value:'5.60',unit:'bar',instrument:'SYN-PPO-INS-000009'},ec:{value:'2.00',unit:'mS/cm',instrument:'SYN-PPO-INS-000010'},visual:{value:'Satisfactory'}},notes:'Original fictional failed inspection submitted from the Quality workspace.',evidence:[{id:'mw-initial-fixture',origin:'fixture',name:'Original inspection illustration',caption:'Illustrative inspection evidence; not a photograph.',checks:['pressure','ec']}]},'technician');run('submit',{confirm:true},'technician');
    const row=(id,title,domain,type,owner,due,record,org,site,area,reason,extra={})=>({id,title,domain,type,owner,due,record,org,site,area,reason,status:'Open',version:1,outcome:'',history:[],...extra});
    return {schema:'ppo-my-work/v1',version:0,assurance,records:[
      row('11111111-2222-4222-8222-000000000001','Follow up the fertigation quotation','CRM','Activity',people[0],'2026-09-15','SYN-PPO-OPP-000041','Northbank Nursery','Propagation site','Glasshouse 02','Customer response remains outstanding after the fictional quotation.',{category:'CustomerContact'}),
      row('11111111-2222-4222-8222-000000000002','Confirm the next visitor access window','Service','Activity',people[0],TODAY,'SYN-PPO-WO-000245','Greenhaven Berries','Berry tunnels','Tunnel 06','The next visit needs a separately confirmed visitor route.',{category:'CustomerContact'}),
      row('task-scope-note','Prepare the irrigation scope comparison','Projects','Task',people[0],'2026-09-18','SYN-PPO-PRJ-000031','Northbank Nursery','Propagation site','Glasshouse 02','The project coordinator needs an internal comparison before the next scope review.'),
      row('review-engineering','Review the lighting criteria submission','Engineering','Review',people[1],TODAY,'SYN-ENG-SUB-000017','Cedar Vale Growers','Young plant facility','Bay 03','An Engineering review remains required; the actual technical criteria are outside this preview.',{available:false}),
      row('review-estimate','Review the revised estimate option','CRM','Review',people[0],'2026-09-17','SYN-EST-OPT-000041','Northbank Nursery','Propagation site','Glasshouse 02','Estimator handover includes an unresolved commercial question.',{available:false}),
      row('review-service','Review the Greenhaven service report','Service','Review',people[1],'2026-09-17','SYN-SVC-RPT-000245','Greenhaven Berries','Berry tunnels','Tunnel 06','Exact reviewed evidence is required before a customer report can be issued.',{available:false}),
      row('wait-material','Obtain a confirmed replacement-part promise','Supply Chain','Blocked',people[0],'2026-09-15','SYN-MAT-000031','Northbank Nursery','Propagation site','Irrigation room','A partial receipt and quarantine leave the required quantity unavailable.',{waitingOn:'Supplier confirmation',available:true}),
      row('wait-access','Resolve the visitor-route dependency','Service','Blocked',people[0],TODAY,'SYN-PPO-WO-000245','Greenhaven Berries','Berry tunnels','Tunnel 06','Site contact confirmation is needed before the affected visit can proceed.',{waitingOn:'Site contact',available:true}),
      row('task-unassigned','Assign an owner for the closeout photographs','Projects','Task',null,null,'SYN-PPO-PRJ-000031','Northbank Nursery','Propagation site','Glasshouse 02','Closeout evidence needs an accountable owner and an explicit due date.'),
      row('task-date-needed','Plan the service documentation follow-up','Service','Task',people[2],null,'SYN-PPO-WO-000245','Greenhaven Berries','Berry tunnels','Tunnel 06','The technician owns this follow-up; its due date has not been established.'),
      row('task-restricted','Restricted commercial reconciliation','Finance','Task',people[1],TODAY,'SYN-FIN-PRIVATE','Private fixture','Private fixture','Private fixture','This record is outside every displayed role grant.')
    ],notifications:[{id:'notice-qa-submission',key:'qa:'+Q.latest(assurance.packages[0]).id,target:'qa-review:'+Q.latest(assurance.packages[0]).id,domain:'Quality',title:'Northbank inspection evidence submitted',detail:'Review the original failed pressure check and its exact work scope.',at:'2026-09-16T00:00:00Z',required:true},{id:'notice-material',key:'material:wait-material',target:'wait-material',domain:'Supply Chain',title:'Replacement-part promise needs confirmation',detail:'One material obligation is linked from the project and work-order views.',at:'2026-09-15T23:30:00Z',required:false}],read:{},preferences:{},savedViews:[{id:'view-team-quality',name:'Quality reviews · team',owner:people[1],scope:'team',version:1,view:'reviews',filters:{...filters(),owner:'all',domain:'Quality'},preferred:false}],history:[],receipts:[]};
  }
  function allItems(s){
    const p=s.assurance.packages[0],sub=Q.latest(p),review=Q.latestReview(p,sub.id),release=Q.currentRelease(p);
    const base={domain:'Quality',record:p.work,org:p.organisation,site:p.site,area:p.area,asset:p.assetRef,assetUuid:p.assetUuid,servedArea:p.servedArea,version:s.assurance.version,available:true,history:p.history};
    const items=s.records.map(clone);
    for(const i of items){
      if(!active(i))i.reason='Recorded completion: '+(i.outcome||'Retained in source history.');
      else if(i.id==='task-unassigned'&&i.owner){i.title='Collect the closeout photographs';i.reason='Closeout evidence is assigned to '+i.owner+'; completion evidence remains due.';}
      else if(i.id==='task-date-needed'&&i.due)i.reason='The service documentation follow-up is owned and due on '+i.due+'.';
    }
    items.push({...base,id:'qa-review:'+sub.id,title:`Review inspection r${String(sub.revision).padStart(2,'0')} · Northbank`,type:'Review',owner:people[1],due:TODAY,status:review&&['Accept evidence','Return for correction'].includes(review.decision)?'Completed':'Open',reason:review?`${review.decision} recorded for this exact submission; ${review.decision==='Return for correction'?'the owned correction remains in My actions.':review.decision==='Accept evidence'?'the review is retained in source history.':'the review remains open for follow-up.'}`:`${sub.outcome} evidence from ${sub.actor}; the exact submission needs an Assurance decision.`,qa:'review',submissionId:sub.id});
    for(const d of p.defects)items.push({...base,id:'qa-defect:'+d.id,title:'Correct and retest the pressure finding',type:'Correction',owner:d.owner,due:d.due,status:d.status==='Closed'?'Completed':d.status==='Correction recorded'?'InProgress':'Open',reason:d.status==='Closed'?'The accepted passing retest closed this defect; original findings remain in history.':sub.predecessor?`Original ${d.checkId} finding is retained; retest r${sub.revision} ${sub.outcome==='Pass'?'awaits reviewer acceptance.':'needs further correction and review.'}`:`Original ${d.checkId} finding remains linked to ${d.submissions.length} failed submission(s).`,qa:'defect',defectId:d.id});
    if(review?.decision==='Accept evidence')items.push({...base,id:'qa-release:'+sub.id,title:'Decide the fertigation release boundary',type:'Release',owner:people[1],due:TODAY,status:release?'Completed':'Open',reason:release?'Selected scope released; the separate OEM firmware follow-up remains open.':'Evidence acceptance is recorded; a separate scope release decision is still required.',qa:'release',submissionId:sub.id});
    for(const a of p.actions)items.push({...base,id:'qa-action:'+a.id,title:a.title,type:'Follow-up',owner:a.owner,due:a.due,status:a.status==='Closed'?'Completed':'Open',reason:a.reason,qa:'followup'});
    if(Q.readinessBlockers(p).length)items.push({...base,id:'qa-readiness',title:'Reassess changed site instructions',type:'Blocked',owner:people[0],due:TODAY,status:'Open',reason:'The access source changed after the inspected revision; earlier evidence and release remain in history.',qa:'readiness',waitingOn:'Site source owner'});
    const seen=new Set();return items.filter(i=>{if(seen.has(i.id))return false;seen.add(i.id);return true;});
  }
  function permitted(s,role){must(roles[role],'Choose a valid preview role.');return allItems(s).filter(i=>roles[role].domains.includes(i.domain)&&(roles[role].team||role==='observer'||i.owner===roles[role].name));}
  const active=i=>!['Completed','Cancelled'].includes(i.status);
  const dueState=i=>!i.due?'Date needed':i.due<TODAY?'Overdue':i.due===TODAY?'Today':'Upcoming';
  function criteria(f){must(f&&typeof f.q==='string'&&f.q.length<=200,'Search is too long.');must(['mine','all','unassigned',...people].includes(f.owner),'Invalid owner filter.');must(['','CRM','Projects','Supply Chain','Service','Engineering','Quality'].includes(f.domain),'Invalid module filter.');must(['','Overdue','Today','Upcoming','Date needed'].includes(f.due),'Invalid due filter.');must(['active','all','Completed'].includes(f.status),'Invalid status filter.');return f;}
  function query(s,role,view,f){criteria(f);let rows=permitted(s,role);
    if(view==='actions')rows=rows.filter(i=>['Activity','Task','Correction','Follow-up'].includes(i.type));
    if(view==='reviews')rows=rows.filter(i=>['Review','Release'].includes(i.type));
    if(view==='blocked')rows=rows.filter(i=>['Blocked','Correction'].includes(i.type));
    if(view==='team'&&!roles[role].team)return [];
    return rows.filter(i=>(f.owner==='all'||(f.owner==='mine'?i.owner===roles[role].name:f.owner==='unassigned'?!i.owner:i.owner===f.owner))&&(!f.domain||i.domain===f.domain)&&(!f.due||dueState(i)===f.due)&&(f.status==='all'||(f.status==='active'?active(i):i.status===f.status))&&(!f.q||[i.title,i.record,i.org,i.site,i.area,i.asset,i.reason,i.owner].join(' ').toLowerCase().includes(f.q.trim().toLowerCase()))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||a.title.localeCompare(b.title));}
  function notices(s,role){const ids=new Set(permitted(s,role).map(i=>i.id));return s.notifications.filter(n=>roles[role].domains.includes(n.domain)&&(ids.has(n.target)||(n.domain==='Quality'&&(roles[role].team||role==='observer')&&s.assurance.packages[0].submissions.some(sub=>n.target==='qa-review:'+sub.id))));}
  function visibleViews(s,role){return s.savedViews.filter(v=>v.owner===roles[role].name||(v.scope==='team'&&roles[role].team));}
  const canManageView=(v,role)=>role!=='observer'&&(v.owner===roles[role].name||(v.scope==='team'&&role==='coordinator'));
  function validate(s){
    must(s?.schema==='ppo-my-work/v1'&&Number.isInteger(s.version)&&s.version>=0,'Unsupported My Work session.');Q.validate(s.assurance);
    for(const name of ['records','notifications','savedViews','history','receipts'])must(Array.isArray(s[name]),'Session collections are incomplete.');must(s.read&&s.preferences,'Session preferences are incomplete.');
    must(new Set(s.records.map(i=>i.id)).size===s.records.length,'Duplicate source records are not valid.');
    for(const i of s.records){text(i.id,'Identity',1);text(i.title,'Title',1);must(['Open','InProgress','Completed','Cancelled'].includes(i.status),'Invalid action state.');must(i.owner===null||people.includes(i.owner),'Invalid owner.');if(i.due!==null)date(i.due);must(Array.isArray(i.history)&&Number.isInteger(i.version),'Invalid source history.');}
    for(const v of s.savedViews){text(v.id,'View ID',1);text(v.name,'View name',1);must(people.includes(v.owner)&&['personal','team'].includes(v.scope)&&Number.isInteger(v.version)&&views.includes(v.view),'Invalid saved view.');criteria(v.filters);}
    must(new Set(s.savedViews.map(v=>v.id)).size===s.savedViews.length,'Duplicate saved-view identity.');
    for(const n of s.notifications){text(n.id,'Notification ID',1);text(n.key,'Notification source',1);text(n.target,'Notification target',1);must(typeof n.required==='boolean','Invalid notification priority.');}
    return s;
  }
  function command(s,c,role){
    validate(s);must(roles[role],'Choose a valid role.');must(role!=='observer','This preview role is read-only.');text(c.op,'Operation identity',6);
    const signature=JSON.stringify({type:c.type,payload:c.payload,role}),old=s.receipts.find(r=>r.op===c.op);if(old){must(old.signature===signature,'This operation identity belongs to different content.');return {state:s,recovered:true,receipt:old};}
    must(c.expectedVersion===s.version,'This session changed. Reopen the form; your current entries have been retained.');
    const next=clone(s),x=c.payload||{},actor=roles[role].name,at=c.at||new Date().toISOString();let description='',resultId=x.id||null;
    const source=()=>{const i=permitted(next,role).find(i=>i.id===x.id);must(i,'This source is no longer available to this role.');must(i.version===x.sourceVersion,'The source changed. Refresh its snapshot before acting.');return i;};
    const event=(i,verb)=>{i.version++;i.history.push({actor,at,verb,reason:x.reason||x.outcome||'',owner:i.owner,due:i.due});description=verb+': '+i.title;};
    const runQA=(type,payload)=>{next.assurance=Q.command(next.assurance,{op:c.op+'-'+type,type,packageId:'qa-1',expectedVersion:next.assurance.version,payload,at},role).state;};
    if(c.type==='activityComplete'){
      const i=source();must(i.type==='Activity'&&!i.qa&&active(i)&&i.owner===actor,'Only the current Activity owner can complete an active Activity.');const r=next.records.find(r=>r.id===i.id);r.outcome=text(x.outcome,'Recorded outcome');r.status='Completed';event(r,'Activity completed with outcome');
    }else if(c.type==='taskComplete'){
      const i=source();must(i.type==='Task'&&!i.qa&&active(i)&&i.owner===actor,'Only the assigned task owner can record completion.');const r=next.records.find(r=>r.id===i.id);r.outcome=text(x.outcome,'Completion evidence');r.status='Completed';event(r,'Internal task completed with evidence');
    }else if(c.type==='ownership'){
      const i=source();must(roles[role].team&&!i.qa&&active(i)&&['Activity','Task'].includes(i.type),'Ownership changes are available for permitted active Activities and tasks.');must(people.includes(x.owner),'Select an accountable owner.');must(roles[Object.keys(roles).find(k=>roles[k].name===x.owner)].domains.includes(i.domain),'The selected owner does not have this module in the demonstration.');text(x.reason,'Transfer reason');const r=next.records.find(r=>r.id===i.id);r.owner=x.owner;r.due=x.dateNeeded?null:date(x.due);event(r,'Ownership and due date recorded');
    }else if(c.type==='followup'){
      const i=source();must(i.type==='Blocked'&&!i.qa&&roles[role].team,'Open the owning source to change this obligation.');const r=next.records.find(r=>r.id===i.id);text(x.reason,'Follow-up finding');r.due=date(x.due);event(r,'Dependency follow-up recorded; blocker remains open');
    }else if(c.type.startsWith('qa')){
      const i=source(),p=next.assurance.packages[0];must(i.qa,'Select an Assurance source.');text(x.reason,'Decision or evidence basis');
      if(c.type==='qaReview'){must(i.qa==='review'&&role==='reviewer','Assurance review belongs to the assigned reviewer.');must(['Return for correction','Hold review','Request clarification','Accept evidence'].includes(x.decision),'Choose a review decision.');runQA('review',{submissionId:i.submissionId,decision:x.decision,reason:x.reason,owner:people[2],due:x.due?date(x.due):TODAY});description=x.decision+': exact inspection';}
      else if(c.type==='qaCorrection'){must(i.qa==='defect'&&role==='technician'&&i.owner===actor,'Correction belongs to the assigned technician.');runQA('correct',{id:i.defectId,note:x.reason,evidence:text(x.evidence,'Correction evidence'),owner:actor,due:date(x.due)});description='Corrective work recorded; fresh retest remains due';}
      else if(c.type==='qaRetest'){
        must(i.qa==='defect'&&role==='technician'&&i.owner===actor,'Retest belongs to the assigned technician.');must(Q.latest(p).outcome!=='Pass'||Q.latestReview(p,Q.latest(p).id)?.decision==='Return for correction','Await Assurance review of the passing retest.');must(x.confirm===true,'Confirm the exact equipment, scope and preparation.');must(x.fixture===true,'Confirm use of fresh labelled demonstration evidence.');
        const evidence=[{id:c.op+'-fixture',origin:'fixture',name:'Fresh retest illustration',caption:text(x.caption,'Fresh evidence caption'),checks:['pressure','ec']}];
        runQA('retest',{reason:x.reason});runQA('acknowledge',{confirm:true});runQA('draft',{values:{pressure:{value:String(x.pressure),unit:'bar',instrument:'SYN-PPO-INS-000009'},ec:{value:String(x.ec),unit:'mS/cm',instrument:'SYN-PPO-INS-000010'},visual:{value:x.condition}},notes:x.reason,evidence});runQA('submit',{confirm:true});description='Fresh successor inspection submitted for review';
      }else if(c.type==='qaRelease'){must(i.qa==='release'&&role==='reviewer','Scope release belongs to the reviewer.');runQA('release',{reason:x.reason,confirm:x.confirm===true});description='Exact fertigation scope released; OEM follow-up remains open';}
      else if(c.type==='qaSourceChange'){must(role==='reviewer'||role==='coordinator','Only a source-review role can demonstrate changed instructions.');runQA('sourceChange',{reason:x.reason});description='Changed source requires a new Assurance assessment';}
      else throw Error('Unsupported Assurance command.');
      const current=Q.latest(next.assurance.packages[0]);const target=c.type==='qaRetest'?'qa-review:'+current.id:c.type==='qaReview'&&x.decision==='Return for correction'?'qa-defect:'+p.defects[0].id:c.type==='qaReview'&&x.decision==='Accept evidence'?'qa-release:'+current.id:c.type==='qaRelease'?'qa-action:action-oem':i.id;
      next.notifications.push({id:'notice-'+c.op,key:c.op,target,domain:'Quality',title:description,detail:x.reason,at,required:true});
    }else if(c.type==='readNotice'){
      must(notices(next,role).some(n=>n.id===x.id),'This notification is unavailable.');next.read[actor]=[...new Set([...(next.read[actor]||[]),x.id])];description='Notification read; business obligation unchanged';
    }else if(c.type==='preferences'){
      must(['Immediate','Daily digest'].includes(x.routine),'Choose a routine update preference.');next.preferences[actor]={routine:x.routine,grouped:x.grouped===true,quiet:x.quiet===true};description='Personal update preferences saved';
    }else if(c.type==='viewSave'){
      const name=text(x.name,'Saved-view name',1);must(name.length<=80,'Use at most 80 characters for a view name.');criteria(x.filters);must(views.includes(x.view)&&x.view!=='updates','Save a worklist view.');must(['personal','team'].includes(x.scope),'Choose personal or team visibility.');must(x.scope!=='team'||roles[role].team,'This role cannot share team views.');
      const existing=x.id?next.savedViews.find(v=>v.id===x.id):null;if(x.id){must(existing&&canManageView(existing,role),'You cannot manage this view.');must(existing.version===x.viewVersion,'The saved view changed. Reopen it before updating.');}
      must(!next.savedViews.some(v=>v.id!==x.id&&v.name.toLowerCase()===name.toLowerCase()&&(v.owner===actor||v.scope==='team'&&x.scope==='team')),'A visible view already uses that name.');
      if(existing){Object.assign(existing,{name,scope:x.scope,filters:clone(x.filters),view:x.view,version:existing.version+1});resultId=existing.id;}else{resultId='view-'+c.op;next.savedViews.push({id:resultId,name,owner:actor,scope:x.scope,view:x.view,filters:clone(x.filters),version:1});}description='Saved view recorded: '+name;
    }else if(c.type==='viewDelete'){
      const v=next.savedViews.find(v=>v.id===x.id);must(v&&canManageView(v,role),'You cannot retire this saved view.');must(v.version===x.viewVersion,'The saved view changed. Reopen it before retiring.');must(x.confirm===true,'Confirm retirement of this view definition.');next.savedViews=next.savedViews.filter(v=>v.id!==x.id);description='Saved view retired; source records unchanged';
    }else throw Error('Unsupported My Work command.');
    next.version++;next.history.push({actor,at,type:c.type,description,source:resultId});const receipt={op:c.op,signature,version:next.version,at,resultId};next.receipts.push(receipt);validate(next);return {state:next,recovered:false,receipt};
  }
  root.MW_MODEL={TODAY,people,roles,views,filters,seed,clone,validate,command,allItems,permitted,query,dueState,active,notices,visibleViews,canManageView};
})(globalThis);
