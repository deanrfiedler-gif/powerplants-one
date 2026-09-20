(function(root){
  'use strict';
  /* AD-01 Users, Roles, Teams & Access Review r01 — synthetic design model.
     Contract: grant shape, scope rules and evaluation mirror db/migrations 0001/0002 and
     src/platform/permissions.ts. Proposed: bundles, teams, change requests, reviews, events.
     Nothing here is authentication or authorisation; the server remains the authority. */
  const CAPS=root.ACCESS_CAPABILITIES;
  const NOW='2026-09-17T00:00:00.000Z', TODAY='2026-09-17';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const must=(v,m)=>{if(!v)throw Error(m);};
  const iso=v=>new Date(v).toISOString();
  const WS='10000000-0000-4000-8000-000000000001';
  const CA='20000000-0000-4000-8000-000000000001', CB='20000000-0000-4000-8000-000000000002';
  const S1='70000000-0000-4000-8000-000000000001', S2='70000000-0000-4000-8000-000000000002', S3='70000000-0000-4000-8000-000000000003';
  const P=n=>`30000000-0000-4000-8000-0000000000${String(n).padStart(2,'0')}`;
  const D=n=>`3a000000-0000-4000-8000-0000000000${String(n).padStart(2,'0')}`;
  const H1='5d000000-0000-4000-8000-000000000001', H2='5d000000-0000-4000-8000-000000000002';

  /* Plain-English labels are Proposed design copy; the key is authoritative. */
  const LABELS={
    'shared.read':'Read shared customer, site and equipment records','shared.create':'Create shared records','shared.edit':'Edit shared records','shared.internal.read':'Read internal-only notes','shared.finance.read':'Read restricted Finance context','shared.history.record':'Record equipment and site history',
    'service.ticket.read':'Read service requests','service.ticket.edit':'Edit service requests','service.work_order.read':'Read work orders','service.work_order.edit':'Edit work orders','service.scope.authorise':'Authorise work scope','service.readiness.assess':'Assess job readiness',
    'activity.read':'Read activities','activity.edit':'Create and complete activities',
    'schedule.read':'Read the schedule','schedule.manage':'Book and change appointments','schedule.request':'Request a schedule change','schedule.contact':'Record customer contact about a visit',
    'pack.read':'Read job packs','pack.prepare':'Prepare job packs','pack.check':'Check job packs','pack.issue':'Issue job packs','pack.acknowledge':'Acknowledge an issued job pack',
    'field.read.own':'Read own assigned field work','field.start.own':'Start own assigned visits','field.capture.own':'Capture own labour, parts and findings','field.correct.own':'Correct own field entries','field.attachment.own':'Add photos to own field work','field.completion.own':'Submit own completion',
    'report.read':'Read service reports','report.review':'Review service reports','report.issue':'Issue service reports','report.respond':'Record customer responses',
    'crm.lead.read':'Read leads','crm.lead.create':'Create leads','crm.lead.edit':'Edit leads','crm.lead.convert':'Convert leads','crm.opportunity.read':'Read opportunities','crm.opportunity.create':'Create opportunities','crm.opportunity.edit':'Edit opportunities','crm.opportunity.transfer.own':'Transfer own opportunities',
    'finance.read':'Read Finance handoffs','finance.prepare':'Prepare Finance handoffs','finance.review':'Review Finance handoffs','finance.process':'Record Finance processing outcome','finance.reconcile':'Reconcile Finance outcomes','finance.issue':'Issue Finance supporting evidence','finance.account.read':'Read synthetic account context',
    'estimating.read':'Read estimates','estimating.edit':'Edit estimates','estimating.quote.read':'Read quotation drafts','estimating.quote.prepare':'Prepare quotation drafts',
    'email.read':'Read linked email and calendar items','email.edit':'Link and follow up email items','email.connect':'Connect a demo mailbox',
    'project.read':'Read projects','project.create':'Create projects','project.edit':'Edit projects',
    'engineering.read':'Read engineering requests','engineering.create':'Create engineering requests','engineering.edit':'Edit engineering requests',
    'engineering.material.review':'Review released materials and substitutions','engineering.material.release':'Authorise and issue material releases','engineering.material.receive':'Receive material handovers','engineering.material.source':'Operate the synthetic source adapter',
    'engineering.change.review':'Review engineering change proposals','engineering.change.decide':'Record technical decisions on engineering changes','engineering.change.receive':'Receive engineering change requests','engineering.change.verify':'Record retest results for engineering changes','engineering.change.close':'Close engineering changes',
    'engineering.commissioning.capture':'Capture commissioning test evidence','engineering.commissioning.review':'Review commissioning evidence and approve as-built records','engineering.commissioning.issue':'Issue and withdraw commissioning releases','engineering.commissioning.receive':'Receive commissioning and as-built releases'};
  const FAMILY_NAMES={shared:'Shared records',service:'Service',activity:'Activities',schedule:'Scheduling',pack:'Job packs',field:'Field work (own)',report:'Service reports',crm:'CRM',finance:'Finance',estimating:'Estimating',email:'Email & calendar',project:'Projects',engineering:'Engineering'};
  const capability=key=>({key,label:LABELS[key],family:key.split('.')[0],familyName:FAMILY_NAMES[key.split('.')[0]],
    reads:/\.read(\.own)?$/.test(key),own:key.endsWith('.own'),
    restricted:key.startsWith('finance.')||key==='shared.finance.read'||key==='shared.internal.read',
    hostedOnly:key==='email.connect'});
  const catalogue=()=>CAPS.keys.map(capability);
  const families=()=>[...new Set(CAPS.keys.map(k=>k.split('.')[0]))];
  const isCap=k=>CAPS.keys.includes(k);

  /* Proposed administrative capabilities: deliberately outside the 74-value contract. */
  const ADMIN_CAPS=['admin.access.read','admin.access.propose','admin.access.approve','admin.access.review'];
  const roles={
    admin:{person:D(1),title:'Access administrator',admin:['admin.access.read','admin.access.propose']},
    approver:{person:D(2),title:'Access approver (platform / data owner)',admin:['admin.access.read','admin.access.approve','admin.access.review']},
    lead:{person:D(3),title:'Team lead',team:'team-service',admin:['admin.access.read','admin.access.propose','admin.access.review']},
    auditor:{person:D(4),title:'Auditor (read-only)',admin:['admin.access.read']},
    self:{person:P(5),title:'Ordinary user (own access only)',admin:[]}};
  const SOD=[
    {id:'sod-finance-review',a:'finance.prepare',b:'finance.review',rationale:'The runtime refuses a review by the Finance handoff owner.',source:'src/finance/service.ts (review guard: owner cannot review)'},
    {id:'sod-finance-reconcile',a:'finance.process',b:'finance.reconcile',rationale:'The runtime refuses reconciliation by the recorded processing owner.',source:'src/finance/service.ts (reconcile guard: processing owner cannot reconcile)'}];
  const TEXT=(v,label,min=10,max=500)=>{must(typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max,`${label}: enter ${min}–${max} characters.`);return v.trim();};
  const dateOnly=v=>{must(/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v,'Enter a real calendar date.');return v;};
  const startOfDay=v=>iso(dateOnly(v)+'T00:00:00+10:00');

  function seed(){
    const people=[
      ['p01',P(1),'PPO-LocalSynthetic','coordinator','SYN Coordinator',true,{count:1,latest:'2026-09-17T06:10:00Z'}],
      ['p05',P(5),'PPO-LocalSynthetic','site-observer','SYN Site observer',true,{count:1,latest:'2026-09-17T04:00:00Z'}],
      ['p09',P(9),'PPO-LocalSynthetic','workspace-observer','SYN Workspace observer',true,{count:0,latest:null}],
      ['p08',P(8),'PPO-LocalSynthetic','second-company','SYN Company B coordinator',true,{count:0,latest:null}],
      ['p10',P(10),'PPO-LocalSynthetic','assigned-technician','SYN Riley Technician',true,{count:2,latest:'2026-09-17T07:30:00Z'}],
      ['p07',P(7),'PPO-LocalSynthetic','finance','SYN Finance context reviewer',true,{count:0,latest:null}],
      ['p12',P(12),'PPO-LocalSynthetic','finance-reviewer','SYN Finance reviewer',true,{count:0,latest:null}],
      ['p13',P(13),'PPO-LocalSynthetic','finance-processor','SYN Finance processor',true,{count:0,latest:null}],
      ['p14',P(14),'PPO-LocalSynthetic','finance-reconciler','SYN Finance reconciler',true,{count:0,latest:null}],
      ['d01',D(1),'PPO-LocalSynthetic','design-access-admin','SYN Access administrator',true,{count:1,latest:'2026-09-17T05:00:00Z'},true],
      ['d02',D(2),'PPO-LocalSynthetic','design-access-approver','SYN Platform data owner',true,{count:1,latest:'2026-09-17T05:00:00Z'},true],
      ['d03',D(3),'PPO-LocalSynthetic','design-team-lead','SYN Service team lead',true,{count:1,latest:'2026-09-17T05:00:00Z'},true],
      ['d04',D(4),'PPO-LocalSynthetic','design-auditor','SYN Access auditor',true,{count:0,latest:null},true],
      ['d06',D(6),'PPO-LocalSynthetic','design-deputy-approver','SYN Deputy platform data owner',true,{count:0,latest:null},true],
      ['d05',D(5),'PPO-LocalSynthetic','design-former-coordinator','SYN Former coordinator',false,{count:0,latest:null},true],
      ['h01',H1,'PPO-EntraDemo','00000000-0000-4000-8000-00000000aa01/c0ffee12-0000-4000-8000-000000000001','SYN Demo tester 5d0000',true,{count:1,latest:'2026-09-17T08:00:00Z'}],
      ['h02',H2,'PPO-EntraDemo','00000000-0000-4000-8000-00000000aa01/c0ffee12-0000-4000-8000-000000000002','SYN Demo tester 5d0001',false,{count:0,latest:null}]
    ].map(([key,id,issuer,subject,name,active,sessions,designOnly])=>({id,key,issuer,subject,name,active,synthetic:true,sessions,designOnly:!!designOnly,
      deactivatedAt:key==='d05'?'2026-09-12T00:00:00Z':key==='h02'?'2026-09-15T00:00:00Z':null}));
    let n=0;const grants=[];
    const g=(user,capabilityKey,scopeType,company,site,extra={})=>grants.push({id:`8a000000-0000-4000-8000-${String(++n).padStart(12,'0')}`,workspaceId:WS,userId:user,capability:capabilityKey,scopeType,
      companyId:scopeType==='Workspace'?null:company,siteId:scopeType==='Site'?site:null,scopeId:scopeType==='Workspace'?WS:scopeType==='Company'?company:site,
      validFrom:'2026-01-01T00:00:00Z',validTo:null,provenance:'Fixture',...extra});
    ['shared.read','shared.edit','service.ticket.read','service.ticket.edit','service.work_order.read','service.work_order.edit','schedule.read','schedule.manage','pack.read','pack.prepare','activity.read','activity.edit'].forEach(k=>g(P(1),k,'Company',CA));
    g(P(1),'crm.opportunity.read','Company',CA,null,{validTo:'2026-09-01T00:00:00Z'});
    g(P(5),'shared.read','Site',CA,S1,{validFrom:'2026-09-10T00:00:00Z',provenance:'SYN-PPO-ACR-000001'});
    g(P(9),'shared.read','Workspace');
    ['shared.read','shared.edit','service.ticket.read'].forEach(k=>g(P(8),k,'Company',CB));
    ['field.read.own','field.start.own','field.capture.own','field.completion.own'].forEach(k=>g(P(10),k,'Company',CA,null,{validTo:'2026-09-25T00:00:00Z'}));
    ['pack.read','pack.acknowledge'].forEach(k=>g(P(10),k,'Company',CA));
    ['finance.read','finance.prepare','shared.finance.read'].forEach(k=>g(P(7),k,'Company',CA));
    ['finance.read','finance.review'].forEach(k=>g(P(12),k,'Company',CA));
    g(P(12),'finance.read','Company',CB,null,{validFrom:'2026-10-01T00:00:00Z'});
    ['finance.read','finance.process'].forEach(k=>g(P(13),k,'Company',CA));
    ['finance.read','finance.reconcile'].forEach(k=>g(P(14),k,'Company',CA));
    ['shared.read','service.ticket.read'].forEach(k=>g(D(5),k,'Company',CA));
    CAPS.hosted_demo.forEach(k=>g(H1,k,'Company',CA,null,{validFrom:'2026-09-15T00:00:00Z',validTo:'2026-09-19T00:00:00Z',provenance:'Hosted setup script'}));
    CAPS.hosted_demo.forEach(k=>g(H2,k,'Company',CA,null,{validFrom:'2026-09-01T00:00:00Z',validTo:'2026-09-15T00:00:00Z',provenance:'Hosted setup script'}));
    const testers=[{userId:H1,tenantId:'00000000-0000-4000-8000-00000000aa01',objectId:'c0ffee12-0000-4000-8000-000000000001',enabled:true,expiresAt:'2026-09-19T00:00:00Z',sourceAvailable:true},
      {userId:H2,tenantId:'00000000-0000-4000-8000-00000000aa01',objectId:'c0ffee12-0000-4000-8000-000000000002',enabled:false,expiresAt:'2026-09-15T00:00:00Z',sourceAvailable:false,lastKnown:'2026-09-15T00:00:00Z'}];
    const bundles=[
      {id:'bundle-service-coordinator',name:'Service coordinator',family:'Business use',revisions:[
        {revision:'r01',state:'Proposed',caps:['shared.read','shared.edit','service.ticket.read','service.ticket.edit','service.work_order.read','service.work_order.edit','service.readiness.assess','schedule.read','schedule.manage','pack.read','pack.prepare','activity.read','activity.edit'],scopes:['Company','Site']},
        {revision:'r02',state:'Draft',caps:['shared.read','shared.edit','service.ticket.read','service.ticket.edit','service.work_order.read','service.work_order.edit','service.readiness.assess','schedule.read','schedule.manage','pack.read','pack.prepare','pack.check','activity.read','activity.edit'],scopes:['Company','Site']}]},
      {id:'bundle-technician',name:'Field technician',family:'Business use',revisions:[{revision:'r01',state:'Proposed',caps:['field.read.own','field.start.own','field.capture.own','field.correct.own','field.attachment.own','field.completion.own','pack.read','pack.acknowledge'],scopes:['Company']}]},
      {id:'bundle-finance-preparer',name:'Finance preparer',family:'Business use',revisions:[{revision:'r01',state:'Proposed',caps:['finance.read','finance.prepare','shared.finance.read'],scopes:['Company']}]},
      {id:'bundle-finance-reviewer',name:'Finance reviewer',family:'Approval',revisions:[{revision:'r01',state:'Proposed',caps:['finance.read','finance.review'],scopes:['Company']}]},
      {id:'bundle-finance-processor',name:'Finance processor',family:'Business use',revisions:[{revision:'r01',state:'Proposed',caps:['finance.read','finance.process'],scopes:['Company']}]},
      {id:'bundle-finance-reconciler',name:'Finance reconciler',family:'Approval',revisions:[{revision:'r01',state:'Proposed',caps:['finance.read','finance.reconcile'],scopes:['Company']}]},
      {id:'bundle-observer',name:'Read-only observer',family:'Business use',revisions:[{revision:'r01',state:'Proposed',caps:['shared.read'],scopes:['Company','Site']}]},
      {id:'bundle-hosted-demo',name:'Hosted demo tester set',family:'Integration',revisions:[{revision:'r01',state:'Proposed',caps:[...CAPS.hosted_demo],scopes:['Company']}]}];
    const teams=[{id:'team-service',name:'Service coordination',lead:D(3),purpose:'Planned service coordination and field delivery for Company A.',members:[{userId:P(1),from:'2026-01-01'},{userId:P(10),from:'2026-03-01'},{userId:P(5),from:'2026-09-10'},{userId:D(5),from:'2026-01-01',to:'2026-09-12'}]},
      {id:'team-finance',name:'Finance handoff',lead:P(12),purpose:'Synthetic Finance handoff preparation, review, processing and reconciliation.',members:[{userId:P(7),from:'2026-01-01'},{userId:P(12),from:'2026-01-01'},{userId:P(13),from:'2026-01-01'},{userId:P(14),from:'2026-01-01'}]}];
    const at='2026-09-10T00:00:00Z';
    const request=(ref,subject,requester,reviewer,ops,reason,state,extra={})=>({id:`ac${ref.slice(-6)}-0000-4000-8000-000000000000`,reference:ref,subjectId:subject,requesterId:requester,reviewerId:reviewer,operations:ops,reason,
      effectiveFrom:'2026-09-17T00:00:00.000Z',state,version:1,decision:null,history:[],origin:null,createdAt:at,...extra});
    const requests=[
      request('SYN-PPO-ACR-000001',P(5),D(1),D(2),[{kind:'add',capability:'shared.read',scopeType:'Site',companyId:CA,siteId:S1,validTo:null}],'Site observer needs read access to the Q01 demonstration site only.','Effective',
        {effectiveFrom:'2026-09-10T00:00:00.000Z',version:4,decision:{decision:'Approved',reason:'Site-limited read matches the stated purpose.',by:D(2),at:'2026-09-10T00:00:00Z'},appliedAt:'2026-09-10T00:00:00Z',appliedBy:D(1),
          history:[{state:'Submitted',by:D(1),at:'2026-09-09T23:00:00Z'},{state:'Approved',by:D(2),at:'2026-09-10T00:00:00Z'},{state:'Effective',by:D(1),at:'2026-09-10T00:00:00Z'}]}),
      request('SYN-PPO-ACR-000002',P(7),D(1),D(2),[{kind:'add',capability:'finance.review',scopeType:'Company',companyId:CA,siteId:null,validTo:'2026-12-31T14:00:00.000Z'}],'Temporary cover for Finance handoff review during planned leave.','Submitted',
        {createdAt:'2026-09-16T01:00:00Z',version:2,history:[{state:'Submitted',by:D(1),at:'2026-09-16T01:00:00Z'}]}),
      request('SYN-PPO-ACR-000003',P(9),D(1),D(2),[{kind:'add',capability:'shared.edit',scopeType:'Workspace',companyId:null,siteId:null,validTo:null}],'Observer asked to correct site names across all companies.','Returned',
        {createdAt:'2026-09-15T00:00:00Z',version:3,decision:{decision:'Returned',reason:'Workspace-wide edit exceeds the observer purpose; request Company scope with an end date.',by:D(2),at:'2026-09-15T03:00:00Z'},
          history:[{state:'Submitted',by:D(1),at:'2026-09-15T01:00:00Z'},{state:'Returned',by:D(2),at:'2026-09-15T03:00:00Z'}]}),
      request('SYN-PPO-ACR-000004',P(10),D(3),D(2),[{kind:'validity',grantId:grants.find(x=>x.userId===P(10)&&x.capability==='field.read.own').id,validTo:'2026-10-31T14:00:00.000Z'}],'Extend Riley’s field access to cover the October visit programme.','Draft',{createdAt:'2026-09-16T23:00:00Z'})];
    const reviewItems=(userIds,decisions={})=>grants.filter(x=>userIds.includes(x.userId)&&(x.capability.startsWith('finance.')||x.capability==='shared.finance.read')&&x.companyId===CA&&x.validFrom<=NOW)
      .map(x=>({id:'item-'+x.id.slice(-4),grantId:x.id,snapshot:{userId:x.userId,capability:x.capability,scopeType:x.scopeType,companyId:x.companyId,siteId:x.siteId,validTo:x.validTo},decision:null,...(decisions[x.capability+'|'+x.userId]||{})}));
    const done=(reason,by)=>({decision:'Keep',reason,by,at:'2026-09-16T02:00:00Z'});
    const reviews=[
      {id:'review-company-a-restricted',name:'Company A restricted access',scopeLabel:'Restricted Finance capabilities · Company A',reviewerId:D(2),due:'2026-09-24',state:'InProgress',version:3,createdAt:'2026-09-15T00:00:00Z',
        items:reviewItems([P(7),P(12),P(13),P(14)],{
          ['finance.read|'+P(12)]:{decision:done('Reviewer role confirmed with Finance lead.',D(2))},['finance.review|'+P(12)]:{decision:done('Reviewer role confirmed with Finance lead.',D(2))},
          ['finance.read|'+P(13)]:{decision:done('Processing role confirmed.',D(2))},
          ['shared.finance.read|'+P(7)]:{decision:{decision:'Unable to confirm',reason:'Purpose of restricted context access not recorded; confirm with the Finance lead.',owner:D(1),by:D(2),at:'2026-09-16T02:10:00Z'}}})},
      {id:'review-service-team',name:'Service team access',scopeLabel:'Team members · Service coordination',reviewerId:D(3),due:'2026-09-12',state:'Complete',version:2,createdAt:'2026-09-08T00:00:00Z',completedAt:'2026-09-12T01:00:00Z',
        items:grants.filter(x=>[P(1),P(10)].includes(x.userId)&&x.validFrom<=NOW&&x.capability.startsWith('pack.')).map(x=>({id:'item-'+x.id.slice(-4),grantId:x.id,
          snapshot:{userId:x.userId,capability:x.capability,scopeType:x.scopeType,companyId:x.companyId,siteId:x.siteId,validTo:x.validTo},decision:{decision:'Keep',reason:'Current duties confirmed at team review.',by:D(3),at:'2026-09-12T00:30:00Z'}}))}];
    const events=[
      {id:'ev-session-1',type:'Session',contract:true,objectType:'Session',objectId:P(1),actorId:P(1),at:'2026-09-16T22:10:00Z',reason:'Local synthetic identity selected',outcome:'Accepted',operationId:null},
      {id:'ev-session-2',type:'Session',contract:true,objectType:'Session',objectId:P(5),actorId:P(5),at:'2026-09-16T20:00:00Z',reason:'Local synthetic identity selected',outcome:'Accepted',operationId:null},
      {id:'ev-acr1-submit',type:'AccessChangeSubmitted',contract:false,objectType:'PermissionGrant',objectId:requests[0].id,actorId:D(1),at:'2026-09-09T23:00:00Z',reason:requests[0].reason,outcome:'Accepted',operationId:'op-fixture-1'},
      {id:'ev-acr1-approve',type:'AccessChangeApproved',contract:false,objectType:'PermissionGrant',objectId:requests[0].id,actorId:D(2),at:'2026-09-10T00:00:00Z',reason:requests[0].decision.reason,outcome:'Accepted',operationId:'op-fixture-2'},
      {id:'ev-acr1-apply',type:'AccessChangeApplied',contract:false,objectType:'PermissionGrant',objectId:requests[0].id,actorId:D(1),at:'2026-09-10T00:00:00Z',reason:'Simulated apply of the approved request.',outcome:'Accepted',operationId:'op-fixture-3',
        before:[],after:[grants.find(x=>x.provenance==='SYN-PPO-ACR-000001').id]},
      {id:'ev-user-d05',type:'UserDeactivated',contract:false,provenanceOnly:true,objectType:'User',objectId:D(5),actorId:null,at:'2026-09-12T00:00:00Z',reason:'No application audit exists for this change; source: seed or setup script.',outcome:'Not recorded',operationId:null},
      {id:'ev-review-service',type:'AccessReviewCompleted',contract:false,objectType:'AccessReview',objectId:'review-service-team',actorId:D(3),at:'2026-09-12T01:00:00Z',reason:'All team pack grants confirmed.',outcome:'Accepted',operationId:'op-fixture-4'}];
    const records=[
      {id:'rec-ticket',label:'Service request SYN-PPO-TKT-000001',capability:'service.ticket.read',companyId:CA,siteId:null,note:'Tickets have no site; only company or workspace grants can authorise them.'},
      {id:'rec-org',label:'Organisation SYN-PPO-ORG-000001 (company-level)',capability:'shared.read',companyId:CA,siteId:null,note:'Company-level shared record without a site.'},
      {id:'rec-site1',label:'Site SYN-PPO-SITE-000001 · SYN Q01 Demonstration Site',capability:'shared.read',companyId:CA,siteId:S1},
      {id:'rec-site2',label:'Site SYN-PPO-SITE-000002 · SYN V01 Previous Site',capability:'shared.read',companyId:CA,siteId:S2},
      {id:'rec-site3',label:'Site SYN-PPO-SITE-000003 · SYN Company B Site',capability:'shared.read',companyId:CB,siteId:S3},
      {id:'rec-wo',label:'Work order SYN-PPO-WO-000001 at SYN Q01',capability:'service.work_order.read',companyId:CA,siteId:S1},
      {id:'rec-fh',label:'Finance handoff SYN-PPO-FH-000001 at SYN Q01',capability:'finance.read',companyId:CA,siteId:S1}];
    return {schema:'ppo-access-review/v1',version:0,now:NOW,
      workspace:{id:WS,name:'SYN synthetic workspace',synthetic:true},
      companies:[{id:CA,name:'SYN Greenhouse Demonstration',erpCompanyId:'SYN-A',provider:'Synthetic'},{id:CB,name:'SYN Greenhouse Demonstration',erpCompanyId:'SYN-B',provider:'Synthetic'}],
      sites:[{id:S1,companyId:CA,reference:'SYN-PPO-SITE-000001',name:'SYN Q01 Demonstration Site'},{id:S2,companyId:CA,reference:'SYN-PPO-SITE-000002',name:'SYN V01 Previous Site'},{id:S3,companyId:CB,reference:'SYN-PPO-SITE-000003',name:'SYN Company B Site'}],
      people,grants,testers,bundles,teams,requests,reviews,events,records,receipts:{},counter:4};
  }

  /* ---------- Contract rules ---------- */
  const person=(s,id)=>s.people.find(p=>p.id===id);
  const company=(s,id)=>s.companies.find(c=>c.id===id);
  const site=(s,id)=>s.sites.find(x=>x.id===id);
  const grantState=(g,now=NOW)=>g.validFrom>now?'Future':g.validTo&&g.validTo<=now?'Expired':'Current';
  const scopeKey=g=>`${g.userId}|${g.capability}|${g.scopeType}|${g.scopeType==='Workspace'?WS:g.scopeType==='Company'?g.companyId:g.siteId}`;
  function checkScope(s,x){
    must(['Workspace','Company','Site'].includes(x.scopeType),'Choose Workspace, Company or Site scope.');
    if(x.scopeType==='Workspace')must(!x.companyId&&!x.siteId,'A Workspace grant has no company or site.');
    if(x.scopeType==='Company')must(company(s,x.companyId)&&!x.siteId,'A Company grant needs a company and no site.');
    if(x.scopeType==='Site'){must(company(s,x.companyId),'A Site grant needs its company.');const st=site(s,x.siteId);must(st,'Choose a site.');must(st.companyId===x.companyId,'The site must belong to the selected company.');}
  }
  function scopeLabel(s,g){
    if(g.scopeType==='Workspace')return 'Whole workspace (all companies)';
    const c=company(s,g.companyId);const cl=c?`${c.name} (${c.erpCompanyId})`:'Unknown company';
    return g.scopeType==='Company'?cl:`${(site(s,g.siteId)||{}).name||'Unknown site'} · ${cl}`;
  }
  /* Mirrors hasPermission/scopeSql exactly. companyId null = capability held anywhere. */
  function evaluate(s,userId,cap,companyId=null,siteId=null,now=s.now||NOW){
    const u=person(s,userId),steps=[];
    const step=(label,pass,detail)=>{steps.push({label,pass,detail});return pass;};
    if(!step('Identity is active',!!(u&&u.active),u?(u.active?'Active in this workspace.':'Inactive — the server refuses every session for this identity.'):'Unknown identity.'))return {allowed:false,steps,grant:null};
    const candidates=s.grants.filter(g=>g.userId===userId&&g.capability===cap);
    if(!step('Grant exists for this capability',candidates.length>0,candidates.length?`${candidates.length} grant(s) for ${cap}.`:`No grant for ${cap} at any scope.`))return {allowed:false,steps,grant:null};
    const current=candidates.filter(g=>grantState(g,now)==='Current');
    if(!step('Grant is within its validity window',current.length>0,current.length?`${current.length} current.`:candidates.map(g=>`${grantState(g,now)} (${g.validFrom.slice(0,10)} to ${g.validTo?g.validTo.slice(0,10):'open'})`).join('; ')))return {allowed:false,steps,grant:null};
    const match=current.find(g=>companyId===null||g.scopeType==='Workspace'||(g.companyId===companyId&&(g.scopeType==='Company'||(g.scopeType==='Site'&&g.siteId===siteId))));
    const target=companyId===null?'no specific record (capability held anywhere)':scopeLabel(s,{scopeType:siteId?'Site':'Company',companyId,siteId});
    step('Scope covers the target',!!match,match?`${match.scopeType} grant covers ${target}.`:`Current grants (${current.map(g=>scopeLabel(s,g)).join('; ')}) do not cover ${target}.`);
    if(match&&CAPS.keys.includes(cap)&&cap.endsWith('.own'))steps.push({label:'Own assignment',pass:null,detail:'The field module additionally limits this to the holder’s own assignments; not reproduced here.'});
    return {allowed:!!match,steps,grant:match||null};
  }
  function matrixTargets(s){return [
    ...s.companies.map(c=>({id:'c-'+c.id,label:`${c.erpCompanyId} company-level`,companyId:c.id,siteId:null})),
    ...s.sites.map(x=>({id:'s-'+x.id,label:`${x.name}`,companyId:x.companyId,siteId:x.id}))];}
  function matrix(s,userId){
    const targets=matrixTargets(s);
    return families().map(f=>({family:f,name:FAMILY_NAMES[f],cells:targets.map(t=>{
      const caps=CAPS.keys.filter(k=>k.startsWith(f+'.'));const allowed=caps.filter(k=>evaluate(s,userId,k,t.companyId,t.siteId).allowed);
      const viaWorkspace=allowed.some(k=>(evaluate(s,userId,k,t.companyId,t.siteId).grant||{}).scopeType==='Workspace');
      return {target:t,allowed:allowed.length,total:caps.length,caps:allowed,viaWorkspace};})}));
  }
  const heldNow=(s,userId)=>s.grants.filter(g=>g.userId===userId&&grantState(g,s.now)==='Current');
  function bundleMatches(s,userId){
    const held=new Set(heldNow(s,userId).map(g=>g.capability));
    return s.bundles.map(b=>{const r=b.revisions.find(x=>x.state==='Proposed')||b.revisions[0];const missing=r.caps.filter(c=>!held.has(c));return {bundle:b,revision:r.revision,missing,matched:r.caps.length-missing.length,total:r.caps.length};})
      .filter(m=>m.matched/m.total>=.5).sort((a,b)=>b.matched-a.matched||a.missing.length-b.missing.length);
  }
  function compareBundle(s,bundleId,from,to){
    const b=s.bundles.find(x=>x.id===bundleId),A=b.revisions.find(r=>r.revision===from),B=b.revisions.find(r=>r.revision===to);
    const added=B.caps.filter(c=>!A.caps.includes(c)),removed=A.caps.filter(c=>!B.caps.includes(c));
    const holders=s.people.filter(p=>bundleMatches(s,p.id).some(m=>m.bundle.id===bundleId)).map(p=>p.id);
    return {added,removed,holders};
  }
  function overlap(a,b){return a.scopeType==='Workspace'||b.scopeType==='Workspace'||a.companyId===b.companyId;}
  function sodWarnings(s,userId,extra=[]){
    const gs=[...heldNow(s,userId),...extra];const out=[];
    SOD.forEach(p=>{const A=gs.filter(g=>g.capability===p.a),B=gs.filter(g=>g.capability===p.b);if(A.some(a=>B.some(b=>overlap(a,b))))out.push(p);});
    return out;
  }
  function isTeamMember(s,teamId,userId,at=NOW){const t=s.teams.find(x=>x.id===teamId);return !!t&&t.members.some(m=>m.userId===userId&&m.from+'T00:00:00Z'<=at&&(!m.to||m.to+'T00:00:00Z'>at));}
  function teamsOf(s,userId){return s.teams.filter(t=>t.members.some(m=>m.userId===userId)||t.lead===userId);}

  /* ---------- Visibility (local preview only) ---------- */
  const canSeePerson=(s,role,userId)=>{const r=roles[role];if(!r)return false;if(role==='self')return userId===r.person;if(role==='lead')return userId===r.person||isTeamMember(s,r.team,userId);return true;};
  const visiblePeople=(s,role)=>s.people.filter(p=>canSeePerson(s,role,p.id));
  const VIEWS=['people','person','catalogue','changes','reviews','history'];
  function viewAllowed(role,view){if(role==='self')return ['people','person','catalogue','history'].includes(view);return VIEWS.includes(view);}
  const visibleRequests=(s,role)=>role==='self'?[]:role==='lead'?s.requests.filter(r=>canSeePerson(s,role,r.subjectId)||r.requesterId===roles.lead.person):s.requests;
  const visibleReviews=(s,role)=>role==='self'?[]:role==='lead'?s.reviews.filter(r=>r.reviewerId===roles.lead.person):s.reviews;
  const visibleEvents=(s,role)=>role==='self'?s.events.filter(e=>e.objectId===roles.self.person||e.actorId===roles.self.person):role==='lead'?s.events.filter(e=>canSeePerson(s,role,e.objectId)||e.actorId===roles.lead.person||s.requests.some(r=>r.id===e.objectId&&canSeePerson(s,role,r.subjectId))):s.events;
  /* Proposed administrative assignments held by design-only people who are not preview roles. */
  const DESIGN_ADMIN={[D(6)]:['admin.access.read','admin.access.approve']};
  const holdsAdmin=(personId,cap)=>Object.values(roles).some(r=>r.person===personId&&r.admin.includes(cap))||(DESIGN_ADMIN[personId]||[]).includes(cap);
  /* Decision 5 (17 September 2026): whoever attested Change or Revoke in a review may not decide the resulting request. */
  const attester=req=>req&&req.origin?req.origin.attestedBy||null:null;
  const approvers=s=>s.people.filter(p=>holdsAdmin(p.id,'admin.access.approve'));
  const mask=p=>p.issuer==='PPO-EntraDemo'?`Entra object ${p.subject.split('/').pop().slice(0,8)}…`:p.subject;

  /* ---------- Queues ---------- */
  const QUEUES=[
    {id:'inactive',label:'Inactive with current grants',test:(s,p)=>!p.active&&heldNow(s,p.id).length>0},
    {id:'tester',label:'Hosted tester expiring or expired',test:(s,p)=>{const t=s.testers.find(x=>x.userId===p.id);return !!t&&(t.expiresAt<=NOW||Date.parse(t.expiresAt)-Date.parse(NOW)<=3*86400000);}},
    {id:'expiring',label:'Grants ending within 14 days',test:(s,p)=>heldNow(s,p.id).some(g=>g.validTo&&Date.parse(g.validTo)-Date.parse(NOW)<=14*86400000)},
    {id:'workspace',label:'Workspace-wide grants',test:(s,p)=>heldNow(s,p.id).some(g=>g.scopeType==='Workspace')},
    {id:'restricted',label:'Restricted access holders',test:(s,p)=>heldNow(s,p.id).some(g=>capability(g.capability).restricted)},
    {id:'sod',label:'Separation-of-duties warnings',test:(s,p)=>sodWarnings(s,p.id).length>0||s.requests.some(r=>r.subjectId===p.id&&['Submitted','Approved'].includes(r.state)&&requestWarnings(s,r).some(w=>w.kind==='sod'))},
    {id:'pending',label:'Pending changes',test:(s,p)=>s.requests.some(r=>r.subjectId===p.id&&['Draft','Submitted','Returned','Approved'].includes(r.state))}];
  const attention=(s,p)=>QUEUES.filter(q=>q.test(s,p)).map(q=>q.id);
  function people(s,role,f={}){
    const q=(f.q||'').trim().toLowerCase();
    return visiblePeople(s,role).filter(p=>{
      const gs=heldNow(s,p.id);
      if(q&&![p.name,p.subject,p.id,...gs.map(g=>g.capability),...gs.map(g=>scopeLabel(s,g))].some(v=>String(v).toLowerCase().includes(q)))return false;
      if(f.issuer&&p.issuer!==f.issuer)return false;
      if(f.status==='active'&&!p.active)return false;
      if(f.status==='inactive'&&p.active)return false;
      if(f.company&&!gs.some(g=>g.scopeType==='Workspace'||g.companyId===f.company))return false;
      if(f.family&&!gs.some(g=>g.capability.startsWith(f.family+'.')))return false;
      if(f.queue&&!attention(s,p).includes(f.queue))return false;
      return true;
    }).sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name):(attention(s,b).length-attention(s,a).length)||a.name.localeCompare(b.name));
  }

  /* ---------- Proposed change requests ---------- */
  function validateOperation(s,subject,op,effectiveFrom,pendingKeys){
    must(op&&['add','validity','scope','revoke'].includes(op.kind),'Choose an operation.');
    const validTo=op.validTo?iso(op.validTo):null;
    if(op.kind==='add'){
      must(isCap(op.capability),'Choose a capability from the application contract.');
      must(!(op.capability==='email.connect'&&subject.issuer!=='PPO-EntraDemo'),'email.connect exists only on the hosted demo track.');
      checkScope(s,op);
      const key=scopeKey({userId:subject.id,...op});
      const existing=s.grants.find(g=>scopeKey(g)===key);
      must(!existing,existing?`A grant for ${op.capability} at this scope already exists (${grantState(existing,s.now)}); change its validity instead.`:'');
      must(!pendingKeys.has(key),'This request adds the same grant twice.');pendingKeys.add(key);
      must(!validTo||validTo>effectiveFrom,'The end date must be after the effective date.');
      return {...op,validTo};
    }
    const g=s.grants.find(x=>x.id===op.grantId&&x.userId===subject.id);
    must(g,'Choose one of this person’s grants.');
    if(op.kind==='validity'){must(!validTo||validTo>g.validFrom,'The end date must be after the grant’s start.');return {...op,validTo};}
    if(op.kind==='scope'){checkScope(s,op);const key=scopeKey({...g,...op});must(!s.grants.some(x=>x.id!==g.id&&scopeKey(x)===key)&&!pendingKeys.has(key),'A grant already exists at the new scope.');pendingKeys.add(key);must(grantState(g,s.now)!=='Expired','An expired grant cannot change scope; add a new grant instead.');return {kind:'scope',grantId:g.id,scopeType:op.scopeType,companyId:op.scopeType==='Workspace'?null:op.companyId,siteId:op.scopeType==='Site'?op.siteId:null};}
    must(grantState(g,s.now)==='Current','Only a current grant can be revoked; change a future grant’s validity instead.');
    must(g.validFrom<effectiveFrom,'Revocation must be effective after the grant started.');
    return {kind:'revoke',grantId:g.id};
  }
  function requestWarnings(s,r){
    const out=[],extra=[];
    r.operations.forEach(op=>{
      if(op.kind==='add'){extra.push({capability:op.capability,scopeType:op.scopeType,companyId:op.companyId,siteId:op.siteId});
        if(op.scopeType==='Workspace')out.push({kind:'widening',text:`${op.capability} would apply to every company in the workspace, including companies added later.`});
        if(capability(op.capability).restricted)out.push({kind:'restricted',text:`${op.capability} gives access to restricted Finance or internal information.`});}
      if(op.kind==='scope'&&op.scopeType==='Workspace')out.push({kind:'widening',text:'The new scope applies to every company in the workspace.'});
      if(op.kind==='validity'&&!op.validTo)out.push({kind:'openended',text:'The grant would have no end date.'});
    });
    sodWarnings(s,r.subjectId,extra).forEach(p=>out.push({kind:'sod',text:`Holds ${p.a} and ${p.b} at an overlapping scope. ${p.rationale} Warning only; no policy adopted.`}));
    return out;
  }
  function preview(s,r){
    const before=s.grants.filter(g=>g.userId===r.subjectId).map(clone),after=before.map(clone),at=r.effectiveFrom;
    r.operations.forEach((op,i)=>{
      if(op.kind==='add')after.push({id:`pending-${i}`,workspaceId:WS,userId:r.subjectId,capability:op.capability,scopeType:op.scopeType,companyId:op.companyId||null,siteId:op.siteId||null,
        scopeId:op.scopeType==='Workspace'?WS:op.scopeType==='Company'?op.companyId:op.siteId,validFrom:at,validTo:op.validTo||null,provenance:r.reference});
      else{const g=after.find(x=>x.id===op.grantId);if(!g)return;
        if(op.kind==='validity')g.validTo=op.validTo||null;
        if(op.kind==='scope'){g.scopeType=op.scopeType;g.companyId=op.companyId;g.siteId=op.siteId;g.scopeId=op.scopeType==='Workspace'?WS:op.scopeType==='Company'?op.companyId:op.siteId;}
        if(op.kind==='revoke')g.validTo=at;
        g.provenance=r.reference;}
    });
    const changes=after.map(a=>{const b=before.find(x=>x.id===a.id);return {grant:a,change:!b?'Added':JSON.stringify(b)!==JSON.stringify({...a,provenance:b.provenance})?(r.operations.some(o=>o.kind==='revoke'&&o.grantId===a.id)?'Revoked':'Changed'):'Unchanged',before:b||null};});
    return {before,after,changes:changes.filter(c=>c.change!=='Unchanged')};
  }
  const event=(s,type,objectType,objectId,actorId,reason,op,extra={})=>s.events.push({id:`ev-${s.events.length+1}-${op}`,type,contract:false,objectType,objectId,actorId,at:s.now,reason,outcome:'Accepted',operationId:op,...extra});
  const REQUEST_STATES=['Draft','Submitted','Returned','Approved','Effective','Withdrawn'];

  const handlers={
    saveRequest(s,p,role,op){
      const r=roles[role];must(r.admin.includes('admin.access.propose'),'This role cannot propose access changes.');
      const subject=person(s,p.subjectId);must(subject,'Choose a person.');
      must(canSeePerson(s,role,subject.id),'You can propose changes only for people in your scope.');
      must(subject.issuer==='PPO-LocalSynthetic','Hosted demo testers are provisioned by the owner-run setup script, not in this page.');
      must(subject.id!==r.person,'You cannot change your own access.');
      must(subject.active,'Reactivate the identity through its identity source before changing its grants.');
      const reviewer=p.reviewerId?person(s,p.reviewerId):null;
      if(reviewer){must(holdsAdmin(reviewer.id,'admin.access.approve'),'The reviewer must hold access approval.');must(reviewer.id!==r.person,'The reviewer cannot be the requester.');must(reviewer.id!==subject.id,'The reviewer cannot be the person whose access changes.');
        if(p.id){const prior=s.requests.find(x=>x.id===p.id);must(reviewer.id!==attester(prior),'The person who recommended this change in an access review cannot also decide it.');}}
      const effectiveFrom=startOfDay(p.effectiveFrom);must(effectiveFrom>=startOfDay(TODAY),'The effective date cannot be in the past.');
      must(Array.isArray(p.operations)&&p.operations.length>=1&&p.operations.length<=10,'Add one to ten operations.');
      const keys=new Set(),ops=p.operations.map(o=>validateOperation(s,subject,o,effectiveFrom,keys));
      const reason=TEXT(p.reason,'Reason');
      let req;
      if(p.id){
        req=s.requests.find(x=>x.id===p.id);must(req,'Request not found.');
        must(req.version===p.requestVersion,'Another change was saved to this request. Review the latest version.');
        must(['Draft','Returned'].includes(req.state),'Only a draft or returned request can be edited.');
        must(req.requesterId===r.person||role==='admin','Only the requester or an access administrator can edit this request.');
        must(req.subjectId===subject.id,'The person on a request cannot change.');
        if(req.state==='Returned')req.history.push({state:'Draft',by:r.person,at:s.now,note:'Reopened after return'});
        Object.assign(req,{operations:ops,reason,effectiveFrom,reviewerId:reviewer?reviewer.id:null,state:'Draft',version:req.version+1});
      }else{
        s.counter+=1;const ref=`SYN-PPO-ACR-${String(s.counter).padStart(6,'0')}`;
        req={id:`ac${String(s.counter).padStart(6,'0')}-0000-4000-8000-000000000000`,reference:ref,subjectId:subject.id,requesterId:r.person,reviewerId:reviewer?reviewer.id:null,
          operations:ops,reason,effectiveFrom,state:'Draft',version:1,decision:null,history:[],origin:p.origin||null,createdAt:s.now};
        s.requests.push(req);
      }
      event(s,'AccessChangeDrafted','PermissionGrant',req.id,r.person,reason,op);
      return {id:req.id,reference:req.reference,version:req.version};
    },
    submitRequest(s,p,role,op){
      const r=roles[role],req=s.requests.find(x=>x.id===p.id);must(req,'Request not found.');
      must(req.version===p.requestVersion,'Another change was saved to this request. Review the latest version.');
      must(req.state==='Draft','Only a draft can be submitted.');
      must(req.requesterId===r.person||role==='admin','Only the requester or an access administrator can submit.');
      must(req.reviewerId,'Choose a reviewer before submitting.');
      must(req.reviewerId!==r.person&&req.reviewerId!==req.subjectId,'The reviewer must be independent of the submitter and the person affected.');
      must(req.reviewerId!==attester(req),'The person who recommended this change in an access review cannot also decide it.');
      const keys=new Set();req.operations=req.operations.map(o=>validateOperation(s,person(s,req.subjectId),o,req.effectiveFrom,keys));
      req.state='Submitted';req.version+=1;req.history.push({state:'Submitted',by:r.person,at:s.now});
      event(s,'AccessChangeSubmitted','PermissionGrant',req.id,r.person,req.reason,op,{warnings:requestWarnings(s,req).map(w=>w.kind)});
      return {id:req.id,version:req.version,warnings:requestWarnings(s,req)};
    },
    decideRequest(s,p,role,op){
      const r=roles[role],req=s.requests.find(x=>x.id===p.id);must(req,'Request not found.');
      must(r.admin.includes('admin.access.approve'),'This role cannot decide access changes.');
      must(req.version===p.requestVersion,'Another change was saved to this request. Review the latest version.');
      must(req.state==='Submitted','Only a submitted request can be decided.');
      must(req.reviewerId===r.person,'Only the named reviewer can decide this request.');
      must(req.requesterId!==r.person,'You cannot decide a request you submitted.');
      must(req.subjectId!==r.person,'You cannot decide a change to your own access.');
      must(attester(req)!==r.person,'You recommended this change in an access review, so another approver must decide it.');
      must(['Approved','Returned'].includes(p.decision),'Choose Approve or Return.');
      const reason=TEXT(p.reason,'Decision reason');
      req.state=p.decision;req.version+=1;req.decision={decision:p.decision,reason,by:r.person,at:s.now};req.history.push({state:p.decision,by:r.person,at:s.now});
      event(s,p.decision==='Approved'?'AccessChangeApproved':'AccessChangeReturned','PermissionGrant',req.id,r.person,reason,op);
      return {id:req.id,state:req.state,version:req.version};
    },
    applyRequest(s,p,role,op){
      const r=roles[role],req=s.requests.find(x=>x.id===p.id);must(req,'Request not found.');
      must(role==='admin','Only an access administrator can apply an approved change.');
      must(req.version===p.requestVersion,'Another change was saved to this request. Review the latest version.');
      must(req.state==='Approved',req.state==='Effective'?'This request is already effective.':'Only an approved request can be applied.');
      must(req.subjectId!==r.person,'You cannot apply a change to your own access.');
      const subject=person(s,req.subjectId);must(subject.active,'The identity is now inactive; return the request for review.');
      const keys=new Set();req.operations.forEach(o=>validateOperation(s,subject,o,req.effectiveFrom,keys));
      const before=s.grants.filter(g=>g.userId===req.subjectId).map(g=>g.id),result=preview(s,req);
      result.after.forEach(a=>{if(a.id.startsWith('pending-')){s.grants.push({...a,id:`8b${req.reference.slice(-6)}-0000-4000-8000-${String(Number(a.id.slice(8))+1).padStart(12,'0')}`});}
        else{const g=s.grants.find(x=>x.id===a.id);if(g&&result.changes.some(c=>c.grant.id===a.id))Object.assign(g,a);}});
      req.state='Effective';req.version+=1;req.appliedAt=s.now;req.appliedBy=r.person;req.history.push({state:'Effective',by:r.person,at:s.now,note:'Simulated apply — no server command exists'});
      event(s,'AccessChangeApplied','PermissionGrant',req.id,r.person,'Simulated apply of the approved request.',op,{before,after:s.grants.filter(g=>g.userId===req.subjectId).map(g=>g.id)});
      return {id:req.id,state:'Effective',changes:result.changes.length};
    },
    withdrawRequest(s,p,role,op){
      const r=roles[role],req=s.requests.find(x=>x.id===p.id);must(req,'Request not found.');
      must(req.version===p.requestVersion,'Another change was saved to this request. Review the latest version.');
      must(['Draft','Submitted','Returned'].includes(req.state),'This request can no longer be withdrawn.');
      must(req.requesterId===r.person||role==='admin','Only the requester or an access administrator can withdraw.');
      const reason=TEXT(p.reason,'Withdrawal reason');
      req.state='Withdrawn';req.version+=1;req.history.push({state:'Withdrawn',by:r.person,at:s.now,note:reason});
      event(s,'AccessChangeWithdrawn','PermissionGrant',req.id,r.person,reason,op);
      return {id:req.id,state:'Withdrawn'};
    },
    attest(s,p,role,op){
      const r=roles[role],rev=s.reviews.find(x=>x.id===p.reviewId);must(rev,'Review not found.');
      must(r.admin.includes('admin.access.review'),'This role cannot record access reviews.');
      must(rev.reviewerId===r.person,'Only the assigned reviewer can record decisions.');
      must(rev.state==='InProgress','This review is complete and read-only.');
      must(rev.version===p.reviewVersion,'This review changed in another session. Review the latest version.');
      const item=rev.items.find(i=>i.id===p.itemId);must(item,'Review item not found.');
      must(!item.decision,'This item already has a recorded decision.');
      must(['Keep','Change','Revoke','Unable to confirm'].includes(p.decision),'Choose a review decision.');
      must(item.snapshot.userId!==r.person,'You cannot review your own access.');
      const reason=TEXT(p.reason,'Review reason');
      const d={decision:p.decision,reason,by:r.person,at:s.now};
      if(p.decision==='Unable to confirm'){must(person(s,p.ownerId),'Name who will resolve this item.');d.owner=p.ownerId;}
      if(['Change','Revoke'].includes(p.decision)){
        const g=s.grants.find(x=>x.id===item.grantId);must(g,'The reviewed grant no longer exists.');
        s.counter+=1;const ref=`SYN-PPO-ACR-${String(s.counter).padStart(6,'0')}`;
        const ops=p.decision==='Revoke'?[{kind:'revoke',grantId:g.id}]:[{kind:'validity',grantId:g.id,validTo:g.validTo}];
        const req={id:`ac${String(s.counter).padStart(6,'0')}-0000-4000-8000-000000000000`,reference:ref,subjectId:g.userId,requesterId:roles.admin.person,reviewerId:null,
          operations:ops,reason:`From ${rev.name}: ${reason}`,effectiveFrom:startOfDay(TODAY),state:'Draft',version:1,decision:null,history:[{state:'Draft',by:r.person,at:s.now,note:'Created from access review; routed to the access administrator'}],origin:{reviewId:rev.id,itemId:item.id,attestedBy:r.person},createdAt:s.now};
        s.requests.push(req);d.request=req.id;
      }
      item.decision=d;rev.version+=1;
      event(s,'AccessReviewAttested','AccessReview',rev.id,r.person,reason,op,{item:item.id,decision:p.decision});
      return {reviewId:rev.id,itemId:item.id,request:d.request||null};
    },
    completeReview(s,p,role,op){
      const r=roles[role],rev=s.reviews.find(x=>x.id===p.reviewId);must(rev,'Review not found.');
      must(rev.reviewerId===r.person,'Only the assigned reviewer can complete this review.');
      must(rev.version===p.reviewVersion,'This review changed in another session. Review the latest version.');
      must(rev.state==='InProgress','This review is already complete.');
      const open=rev.items.filter(i=>!i.decision).length;must(open===0,`${open} item(s) still need a decision.`);
      rev.state='Complete';rev.completedAt=s.now;rev.version+=1;
      event(s,'AccessReviewCompleted','AccessReview',rev.id,r.person,'All items decided.',op);
      return {reviewId:rev.id,state:'Complete'};
    }};

  const stable=v=>Array.isArray(v)?`[${v.map(stable).join(',')}]`:v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')}}`:JSON.stringify(v);
  function command(state,c,role){
    must(roles[role],'Unknown preview role.');
    must(c&&typeof c.op==='string'&&c.op.length>=4,'Missing operation ID.');
    const signature=stable({type:c.type,payload:c.payload,role});
    const prior=state.receipts[c.op];
    if(prior){must(prior.signature===signature,'This operation ID was already used with different content.');return {state,result:prior.result,recovered:true};}
    must(c.expectedVersion===state.version,'The workspace changed in another session. Reload before saving.');
    must(handlers[c.type],'Unknown command.');
    const next=clone(state);
    const result=handlers[c.type](next,c.payload||{},role,c.op);
    next.version+=1;next.receipts[c.op]={signature,result};
    return {state:next,result,recovered:false};
  }

  /* ---------- Restore validation ---------- */
  function validate(s){
    must(s&&s.schema==='ppo-access-review/v1','Unsupported or damaged session.');
    must(Number.isInteger(s.version)&&s.version>=0,'Invalid session version.');
    ['people','grants','testers','bundles','teams','requests','reviews','events','records','companies','sites'].forEach(k=>must(Array.isArray(s[k]),`Missing ${k}.`));
    const ids=new Set();[...s.people,...s.grants,...s.requests,...s.reviews].forEach(x=>{must(!ids.has(x.id),`Duplicate identity ${x.id}.`);ids.add(x.id);});
    const keys=new Set();
    s.grants.forEach(g=>{
      must(isCap(g.capability),`Unknown capability ${g.capability}.`);
      must(person(s,g.userId),'Grant for an unknown person.');
      checkScope(s,g);
      must(!g.validTo||g.validTo>g.validFrom,'A grant ends before it starts.');
      must(!(g.capability==='email.connect'&&person(s,g.userId).issuer!=='PPO-EntraDemo'),'email.connect is hosted-only.');
      const k=scopeKey(g);must(!keys.has(k),'Duplicate grant for the same person, capability and scope.');keys.add(k);
    });
    s.requests.forEach(r=>{
      if(attester(r)&&r.decision)must(r.decision.by!==attester(r),'A request was decided by the reviewer who recommended it.');
      if(attester(r)&&r.reviewerId)must(r.reviewerId!==attester(r),'A request names the reviewer who recommended it as its decider.');
      must(REQUEST_STATES.includes(r.state),'Unknown request state.');
      must(r.requesterId!==r.subjectId,'A request cannot be raised by the person it affects.');
      if(r.decision){must(r.decision.by!==r.requesterId&&r.decision.by!==r.subjectId,'A request was decided by its requester or subject.');must(typeof r.decision.reason==='string'&&r.decision.reason.length>=10,'A decision is missing its reason.');}
      if(['Approved','Returned'].includes(r.state))must(r.decision&&r.decision.decision===r.state,'Decision does not match request state.');
      if(r.state==='Effective')must(r.decision&&r.decision.decision==='Approved','An effective request has no approval.');
    });
    s.reviews.forEach(v=>{must(['InProgress','Complete'].includes(v.state),'Unknown review state.');if(v.state==='Complete')must(v.items.every(i=>i.decision),'A complete review has undecided items.');});
    return s;
  }
  const queueCounts=(s,role)=>Object.fromEntries(QUEUES.map(q=>[q.id,visiblePeople(s,role).filter(p=>q.test(s,p)).length]));

  root.ACCESS_MODEL={NOW,TODAY,WS,roles,ADMIN_CAPS,SOD,QUEUES,VIEWS,REQUEST_STATES,FAMILY_NAMES,LABELS,
    seed,catalogue,capability,families,isCap,person,company,site,grantState,scopeLabel,checkScope,evaluate,matrix,matrixTargets,heldNow,bundleMatches,compareBundle,sodWarnings,
    teamsOf,isTeamMember,canSeePerson,visiblePeople,viewAllowed,visibleRequests,visibleReviews,visibleEvents,holdsAdmin,approvers,attester,mask,attention,people,queueCounts,
    requestWarnings,preview,command,validate,stable,startOfDay};
})(globalThis);
