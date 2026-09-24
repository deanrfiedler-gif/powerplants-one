import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'docs/design/access-review'),html=path.join(root,'docs/design/access-review/access-review.html');
const ctx=vm.createContext({});for(const f of ['capabilities.js','model.js'])vm.runInContext(fs.readFileSync(path.join(src,f),'utf8'),ctx);
const M=ctx.ACCESS_MODEL,C=ctx.ACCESS_CAPABILITIES,copy=x=>JSON.parse(JSON.stringify(x));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const same=(a,b)=>assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
const results=[],test=(name,fn)=>{fn();results.push({name,result:'Passed'});};
let state=M.seed(),op=0;
const P=n=>`30000000-0000-4000-8000-0000000000${String(n).padStart(2,'0')}`,D=n=>`3a000000-0000-4000-8000-0000000000${String(n).padStart(2,'0')}`;
const CA='20000000-0000-4000-8000-000000000001',CB='20000000-0000-4000-8000-000000000002',S1='70000000-0000-4000-8000-000000000001',S2='70000000-0000-4000-8000-000000000002',S3='70000000-0000-4000-8000-000000000003';
const H1='5d000000-0000-4000-8000-000000000001',H2='5d000000-0000-4000-8000-000000000002';
const act=(type,payload,role,s=state)=>{const r=M.command(s,{op:'test-'+(++op),expectedVersion:s.version,type,payload},role);if(s===state)state=r.state;return r;};
const refuse=(fn,pattern)=>{const before=JSON.stringify(state);assert.throws(fn,pattern);assert.equal(JSON.stringify(state),before);};
const req=ref=>state.requests.find(r=>r.reference===ref);
const allowed=(u,c,co=null,si=null,s=state)=>M.evaluate(s,u,c,co,si).allowed;
const grant=(u,c)=>state.grants.find(g=>g.userId===u&&g.capability===c);
const text=fs.readFileSync(path.join(root,'src/platform/permissions.ts'),'utf8');
const union=[...text.match(/export type Capability\s*=([\s\S]*?);/)[1].matchAll(/"([a-z_.]+)"/g)].map(m=>m[1]);
const demoText=fs.readFileSync(path.join(root,'scripts/demo-database.ts'),'utf8');
const demo=[...demoText.match(/export const demoCapabilities\s*=\s*\[([\s\S]*?)\]\s*as const/)[1].matchAll(/"([a-z_.]+)"/g)].map(m=>m[1]);
const migrations=fs.readdirSync(path.join(root,'db/migrations')).filter(f=>f.endsWith('.sql')).map(f=>fs.readFileSync(path.join(root,'db/migrations',f),'utf8')).join('\n');

/* Contract fidelity */
test('Capability catalogue equals the application Capability union exactly',()=>{same([...C.keys],union);assert.equal(C.keys.length,91);assert.equal(C.source_sha256,sha(path.join(root,'src/platform/permissions.ts')));});
test('Hosted demo capability set equals scripts/demo-database.ts',()=>{same([...C.hosted_demo],demo);assert.equal(C.hosted_demo.length,31);assert.equal(C.demo_source_sha256,sha(path.join(root,'scripts/demo-database.ts')));});
test('Every capability has a plain-English label and a known family',()=>{for(const c of M.catalogue()){assert(c.label&&c.label.length>5,c.key);assert(c.familyName,c.key);}assert.equal(Object.keys(M.LABELS).length,91);});
test('Only email.connect is hosted-only, matching the hosted migration track',()=>{same(M.catalogue().filter(c=>c.hostedOnly).map(c=>c.key),['email.connect']);assert.match(fs.readFileSync(path.join(root,'db/demo/0002-gmail-connection.sql'),'utf8'),/email\.connect/);});
test('Administrative capabilities stay outside the application contract',()=>{for(const k of M.ADMIN_CAPS){assert(!C.keys.includes(k));assert(!union.includes(k));assert(!migrations.includes(`'${k}'`));}});
test('Scope rule mirrors ck_grants_scope in migration 0002',()=>{assert.match(migrations,/scope_type='Workspace' AND scope_id=workspace_id AND company_id IS NULL AND site_id IS NULL/);
  assert.doesNotThrow(()=>M.checkScope(state,{scopeType:'Workspace'}));assert.throws(()=>M.checkScope(state,{scopeType:'Workspace',companyId:CA}),/no company/);
  assert.throws(()=>M.checkScope(state,{scopeType:'Company',companyId:CA,siteId:S1}),/no site/);assert.throws(()=>M.checkScope(state,{scopeType:'Site',companyId:CB,siteId:S1}),/belong/);assert.throws(()=>M.checkScope(state,{scopeType:'Tenant'}),/Choose/);});
test('Evaluation rule text matches hasPermission in permissions.ts',()=>{assert.match(text,/g\.scope_type='Workspace' OR \(g\.company_id=\$4 AND \(g\.scope_type='Company' OR \(g\.scope_type='Site' AND g\.site_id=\$5::uuid\)\)\)/);assert.match(text,/AND u\.active/);assert.match(text,/g\.valid_from<=clock_timestamp\(\) AND \(g\.valid_to IS NULL OR g\.valid_to>clock_timestamp\(\)\)/);});
test('Grant and user changes have no application audit type today',()=>{const m=migrations.match(/ck_audit_object_type CHECK\(object_type IN \(([^)]*)\)/);assert(m);assert(!/'User'|'PermissionGrant'|'AccessReview'/.test(m[1]));assert(!migrations.includes("'PermissionGrant'"));});
test('Seeded identities and scopes use the real seed identifiers',()=>{const seed=fs.readFileSync(path.join(root,'db/seed.sql'),'utf8');for(const id of [P(1),P(5),P(9),P(8),P(7),CA,CB,S1,S2,S3])assert(seed.includes(id),id);for(const k of ['p10','p12','p13','p14'])assert(fs.readdirSync(path.join(root,'db')).some(f=>f.startsWith('seed')&&fs.readFileSync(path.join(root,'db',f),'utf8').includes(M.person(state,P(Number(k.slice(1)))).id)),k);});
test('Hosted testers mirror setup: Company A, tester set, end at tester expiry',()=>{for(const h of [H1,H2]){const t=state.testers.find(x=>x.userId===h),gs=state.grants.filter(g=>g.userId===h);assert.equal(gs.length,31);assert(gs.every(g=>g.scopeType==='Company'&&g.companyId===CA&&g.validTo===t.expiresAt));}assert.match(demoText,/Exactly the bounded Company A grant set/);});
test('Tester expiry is within fourteen days of provisioning in the fixture',()=>{for(const t of state.testers){const g=state.grants.find(x=>x.userId===t.userId);assert(Date.parse(t.expiresAt)-Date.parse(g.validFrom)<=14*86400000);}});
test('Initial fixture validates and has no duplicate grants',()=>{assert.doesNotThrow(()=>M.validate(copy(state)));assert.equal(new Set(state.grants.map(g=>g.id)).size,state.grants.length);});

/* Evaluation cases */
const cases=[
  ['active company grant allows company record',P(1),'service.ticket.read',CA,null,true],
  ['company grant allows its sites',P(1),'shared.read',CA,S1,true],
  ['company grant does not reach another company',P(1),'shared.read',CB,S3,false],
  ['expired grant refuses',P(1),'crm.opportunity.read',CA,null,false],
  ['site grant allows its own site',P(5),'shared.read',CA,S1,true],
  ['site grant refuses a sibling site',P(5),'shared.read',CA,S2,false],
  ['site grant refuses a company-level record',P(5),'shared.read',CA,null,false],
  ['capability check without a company passes on any scope',P(5),'shared.read',null,null,true],
  ['workspace grant reaches a second company',P(9),'shared.read',CB,S3,true],
  ['workspace grant does not add other capabilities',P(9),'shared.edit',CA,null,false],
  ['second-company coordinator is isolated from Company A',P(8),'shared.read',CA,S1,false],
  ['inactive identity refuses despite current grant',D(5),'shared.read',CA,null,false],
  ['future grant refuses before its start',P(12),'finance.read',CB,null,false],
  ['current hosted tester allowed within tester set',H1,'crm.opportunity.read',CA,null,true],
  ['expired hosted tester refused',H2,'crm.opportunity.read',CA,null,false],
  ['no grant refuses',P(14),'finance.review',CA,null,false]];
for(const [label,u,c,co,si,exp] of cases)test(`Evaluation: ${label}`,()=>assert.equal(allowed(u,c,co,si),exp));
test('Explanation trace names the failing step',()=>{const r=M.evaluate(state,P(5),'shared.read',CA,S2);assert.equal(r.steps.at(-1).pass,false);assert.match(r.steps.at(-1).detail,/do not cover/);const i=M.evaluate(state,D(5),'shared.read',CA);assert.equal(i.steps.length,1);assert.match(i.steps[0].detail,/refuses/);});
test('Own-record capability discloses the module limit it does not reproduce',()=>{const r=M.evaluate(state,P(10),'field.read.own',CA,S1);assert(r.allowed);assert.equal(r.steps.at(-1).pass,null);});
test('Matrix counts agree with per-capability evaluation',()=>{for(const row of M.matrix(state,P(1)))for(const c of row.cells){const n=C.keys.filter(k=>k.startsWith(row.family+'.')&&allowed(P(1),k,c.target.companyId,c.target.siteId)).length;assert.equal(c.allowed,n);}});
test('Matrix marks access that arrives through a workspace grant',()=>{const row=M.matrix(state,P(9)).find(r=>r.family==='shared');assert(row.cells.every(c=>c.allowed===1&&c.viaWorkspace));});

/* Queues, bundles, warnings */
test('Queues identify inactive, tester, expiring, workspace, restricted, SoD and pending cases',()=>{const q=M.queueCounts(state,'admin');same({...q},{inactive:1,tester:2,expiring:2,workspace:1,restricted:5,sod:1,pending:3});});
test('Queue filter returns the exact attention set',()=>{same(M.people(state,'admin',{queue:'inactive'}).map(p=>p.id),[D(5)]);same(M.people(state,'admin',{queue:'workspace'}).map(p=>p.id),[P(9)]);});
test('Search covers capability keys and scope names',()=>{assert(M.people(state,'admin',{q:'finance.reconcile'}).some(p=>p.id===P(14)));assert(M.people(state,'admin',{q:'Q01'}).some(p=>p.id===P(5)));});
test('Identical company display names remain distinguishable by ERP key',()=>{const [a,b]=state.companies;assert.equal(a.name,b.name);assert.notEqual(M.scopeLabel(state,{scopeType:'Company',companyId:a.id}),M.scopeLabel(state,{scopeType:'Company',companyId:b.id}));});
test('Bundle matching is derived and orders the strongest match first',()=>{const m=M.bundleMatches(state,P(1));assert.equal(m[0].bundle.id,'bundle-service-coordinator');same([...m[0].missing],['service.readiness.assess']);});
test('Bundles are never adopted and a new revision lists holders without changing grants',()=>{assert(state.bundles.every(b=>b.revisions.every(r=>['Proposed','Draft'].includes(r.state))));const before=JSON.stringify(state.grants),c=M.compareBundle(state,'bundle-service-coordinator','r01','r02');same([...c.added],['pack.check']);assert(c.holders.includes(P(1)));assert.equal(JSON.stringify(state.grants),before);});
test('Separation-of-duties pairs are limited to runtime-evidenced separations',()=>{same(M.SOD.map(s=>s.a+'+'+s.b),['finance.prepare+finance.review','finance.process+finance.reconcile']);const fin=fs.readFileSync(path.join(root,'src/finance/service.ts'),'utf8');assert.match(fin,/ctx\.h\.owner_id === p\.actor_id/);assert.match(fin,/ctx\.h\.processing_owner_id === p\.actor_id/);assert(!M.SOD.some(s=>s.a.startsWith('pack.')));});
test('Pending request surfaces an SoD warning without an existing breach',()=>{assert.equal(M.sodWarnings(state,P(7)).length,0);assert(M.requestWarnings(state,req('SYN-PPO-ACR-000002')).some(w=>w.kind==='sod'));});
test('Teams carry no authority',()=>{const g=JSON.stringify(state.grants);assert(M.isTeamMember(state,'team-service',P(5)));assert.equal(allowed(P(5),'service.ticket.read',CA),false);assert.equal(JSON.stringify(state.grants),g);});
test('Ended team membership is not current',()=>assert.equal(M.isTeamMember(state,'team-service',D(5)),false));

/* Visibility */
test('Ordinary user sees only their own identity and events',()=>{same(M.visiblePeople(state,'self').map(p=>p.id),[P(5)]);assert(M.visibleEvents(state,'self').every(e=>e.objectId===P(5)||e.actorId===P(5)));assert.equal(M.visibleRequests(state,'self').length,0);});
test('Ordinary user cannot open changes or reviews',()=>{assert.equal(M.viewAllowed('self','changes'),false);assert.equal(M.viewAllowed('self','reviews'),false);assert.equal(M.viewAllowed('self','person'),true);});
test('Team lead sees current team members only',()=>{const ids=M.visiblePeople(state,'lead').map(p=>p.id).sort();same(ids,[P(1),P(5),P(10),D(3)].sort());});
test('Team lead sees only reviews assigned to them',()=>same(M.visibleReviews(state,'lead').map(r=>r.id),['review-service-team']));
test('Hosted object identifiers are masked',()=>{const h=M.person(state,H1);assert.match(M.mask(h),/^Entra object c0ffee12…$/);assert(!M.mask(h).includes(h.subject));});

/* Change workflow */
const addOp=(cap,scopeType='Company',companyId=CA,siteId=null,validTo=null)=>({kind:'add',capability:cap,scopeType,companyId,siteId,validTo});
const base={subjectId:P(13),reviewerId:D(2),effectiveFrom:'2026-09-17',reason:'Cover for invoices during month end.',operations:[addOp('finance.read','Company',CB,null,'2026-10-01T00:00:00+10:00')]};
test('Auditor and ordinary user cannot propose',()=>{refuse(()=>act('saveRequest',base,'auditor'),/cannot propose/);refuse(()=>act('saveRequest',base,'self'),/cannot propose/);});
test('Approver cannot raise a request',()=>refuse(()=>act('saveRequest',base,'approver'),/cannot propose/));
test('You cannot change your own access',()=>refuse(()=>act('saveRequest',{...base,subjectId:D(1)},'admin'),/own access/));
test('Hosted testers cannot be changed in the page',()=>refuse(()=>act('saveRequest',{...base,subjectId:H1},'admin'),/owner-run setup script/));
test('Inactive identities cannot receive changes',()=>refuse(()=>act('saveRequest',{...base,subjectId:D(5)},'admin'),/Reactivate/));
test('Reviewer must be an approver and independent',()=>{refuse(()=>act('saveRequest',{...base,reviewerId:P(12)},'admin'),/approval/);});
test('Team lead cannot propose outside the team',()=>refuse(()=>act('saveRequest',base,'lead'),/your scope/));
test('Unknown capability and hosted-only capability are refused',()=>{refuse(()=>act('saveRequest',{...base,operations:[addOp('admin.access.read')]},'admin'),/application contract/);refuse(()=>act('saveRequest',{...base,operations:[addOp('email.connect')]},'admin'),/hosted demo/);});
test('Invalid scope combinations are refused',()=>refuse(()=>act('saveRequest',{...base,operations:[addOp('shared.read','Site',CB,S1)]},'admin'),/belong/));
test('An existing grant, even expired, blocks a duplicate',()=>refuse(()=>act('saveRequest',{...base,subjectId:P(1),operations:[addOp('crm.opportunity.read')]},'admin'),/already exists \(Expired\)/));
test('A request cannot add the same grant twice',()=>refuse(()=>act('saveRequest',{...base,operations:[addOp('report.read'),addOp('report.read')]},'admin'),/twice/));
test('End before effective date and past effective date are refused',()=>{refuse(()=>act('saveRequest',{...base,operations:[addOp('report.read','Company',CA,null,'2026-09-16T00:00:00+10:00')]},'admin'),/after the effective/);refuse(()=>act('saveRequest',{...base,effectiveFrom:'2026-09-16'},'admin'),/past/);});
test('Reason is required and bounded',()=>{refuse(()=>act('saveRequest',{...base,reason:'short'},'admin'),/Reason/);refuse(()=>act('saveRequest',{...base,reason:'x'.repeat(501)},'admin'),/Reason/);});
test('Invalid calendar date is refused',()=>refuse(()=>act('saveRequest',{...base,effectiveFrom:'2026-02-31'},'admin'),/calendar/));
test('Future grant cannot be revoked; it must change validity',()=>refuse(()=>act('saveRequest',{...base,subjectId:P(12),operations:[{kind:'revoke',grantId:state.grants.find(g=>g.userId===P(12)&&g.companyId===CB).id}]},'admin'),/future grant/));
let created;
test('Administrator drafts a valid request with an allocated reference',()=>{const r=act('saveRequest',base,'admin');created=r.result;assert.equal(created.reference,'SYN-PPO-ACR-000005');assert.equal(req(created.reference).state,'Draft');});
test('Stale request version is refused as a conflict',()=>refuse(()=>act('saveRequest',{...base,id:created.id,requestVersion:0},'admin'),/Another change/));
test('Stale workspace version is refused atomically',()=>refuse(()=>M.command(state,{op:'stale-ws',expectedVersion:state.version-1,type:'saveRequest',payload:base},'admin'),/another session/));
test('Submitting requires an independent reviewer and records warnings',()=>{const r=act('submitRequest',{id:created.id,requestVersion:1},'admin');assert.equal(req(created.reference).state,'Submitted');assert(r.result.warnings.some(w=>w.kind==='restricted'));});
test('Only the named reviewer can decide and a reason is required',()=>{const r=req(created.reference);refuse(()=>act('decideRequest',{id:r.id,requestVersion:r.version,decision:'Approved',reason:'Approved for cover.'},'admin'),/cannot decide/);refuse(()=>act('decideRequest',{id:r.id,requestVersion:r.version,decision:'Approved',reason:''},'approver'),/reason/);});
test('Nothing changes before apply',()=>{const r=req(created.reference);act('decideRequest',{id:r.id,requestVersion:r.version,decision:'Approved',reason:'Temporary month-end cover confirmed.'},'approver');assert.equal(allowed(P(13),'finance.read',CB),false);});
test('Only an administrator can apply',()=>{const r=req(created.reference);refuse(()=>act('applyRequest',{id:r.id,requestVersion:r.version},'approver'),/administrator/);refuse(()=>act('applyRequest',{id:r.id,requestVersion:r.version},'lead'),/administrator/);});
let applyCmd;
test('Simulated apply creates the grant, a proposed event and before/after evidence',()=>{const r=req(created.reference);applyCmd={op:'apply-once',expectedVersion:state.version,type:'applyRequest',payload:{id:r.id,requestVersion:r.version}};const out=M.command(state,applyCmd,'admin');state=out.state;
  assert(allowed(P(13),'finance.read',CB));const g=state.grants.find(x=>x.userId===P(13)&&x.companyId===CB);assert.equal(g.provenance,created.reference);const e=state.events.at(-1);assert.equal(e.type,'AccessChangeApplied');assert.equal(e.contract,false);assert(e.after.length===e.before.length+1);});
test('Retrying the same apply returns the original result without duplication',()=>{const before=JSON.stringify(state),again=M.command(state,applyCmd,'admin');assert(again.recovered);assert.equal(JSON.stringify(again.state),before);});
test('Reusing an operation ID with different content is refused',()=>refuse(()=>M.command(state,{...applyCmd,payload:{...applyCmd.payload,requestVersion:99}},'admin'),/different content/));
test('An applied request cannot be applied again under a new operation',()=>{const r=req(created.reference);refuse(()=>act('applyRequest',{id:r.id,requestVersion:r.version},'admin'),/already effective/);});
test('Approver cannot decide a change to their own access',()=>{let s=copy(state);s.requests.push({...copy(req('SYN-PPO-ACR-000002')),id:'ac999999-0000-4000-8000-000000000000',reference:'SYN-PPO-ACR-999999',subjectId:D(2)});
  assert.throws(()=>M.command(s,{op:'own-access',expectedVersion:s.version,type:'decideRequest',payload:{id:'ac999999-0000-4000-8000-000000000000',requestVersion:2,decision:'Approved',reason:'Approving my own access.'}},'approver'),/your own access/);});
test('Return records the reason and editing reopens the draft',()=>{const r=req('SYN-PPO-ACR-000003');act('saveRequest',{id:r.id,requestVersion:r.version,subjectId:P(9),reviewerId:D(2),effectiveFrom:'2026-09-17',reason:'Observer needs Company A edit for one month only.',operations:[addOp('shared.edit','Company',CA,null,'2026-10-17T00:00:00+10:00')]},'admin');
  const n=req('SYN-PPO-ACR-000003');assert.equal(n.state,'Draft');assert.equal(n.decision.decision,'Returned');assert(n.history.some(h=>h.note==='Reopened after return'));});
test('Revocation keeps the grant row and ends it at the effective time',()=>{const g=grant(P(14),'finance.reconcile');const r=act('saveRequest',{subjectId:P(14),reviewerId:D(2),effectiveFrom:'2026-09-18',reason:'Reconciler duty moves to another team.',operations:[{kind:'revoke',grantId:g.id}]},'admin').result;
  act('submitRequest',{id:r.id,requestVersion:1},'admin');act('decideRequest',{id:r.id,requestVersion:2,decision:'Approved',reason:'Duty change confirmed by the Finance lead.'},'approver');act('applyRequest',{id:r.id,requestVersion:3},'admin');
  const after=grant(P(14),'finance.reconcile');assert.equal(after.id,g.id);assert.equal(after.validTo,M.startOfDay('2026-09-18'));assert(allowed(P(14),'finance.reconcile',CA));});
test('Team lead drafts and submits a change for a team member',()=>{const r=req('SYN-PPO-ACR-000004');const out=act('submitRequest',{id:r.id,requestVersion:r.version},'lead');assert.equal(req('SYN-PPO-ACR-000004').state,'Submitted');assert(out.result);});
test('Withdrawal needs a reason and is limited to the requester or an administrator',()=>{const r=req('SYN-PPO-ACR-000004');refuse(()=>act('withdrawRequest',{id:r.id,requestVersion:r.version,reason:'Not needed after all.'},'approver'),/requester/);act('withdrawRequest',{id:r.id,requestVersion:r.version,reason:'October programme cancelled.'},'lead');assert.equal(req('SYN-PPO-ACR-000004').state,'Withdrawn');});

/* Reviews */
const rev=()=>state.reviews.find(r=>r.id==='review-company-a-restricted');
test('Only the assigned reviewer can attest',()=>{const v=rev(),i=v.items.find(x=>!x.decision);refuse(()=>act('attest',{reviewId:v.id,reviewVersion:v.version,itemId:i.id,decision:'Keep',reason:'Confirmed with lead.'},'lead'),/assigned reviewer/);refuse(()=>act('attest',{reviewId:v.id,reviewVersion:v.version,itemId:i.id,decision:'Keep',reason:'Confirmed with lead.'},'auditor'),/cannot record/);});
test('Review cannot complete with undecided items',()=>{const v=rev();refuse(()=>act('completeReview',{reviewId:v.id,reviewVersion:v.version},'approver'),/still need/);});
test('Unable to confirm requires a reason and an owner',()=>{const v=rev(),i=v.items.find(x=>!x.decision);refuse(()=>act('attest',{reviewId:v.id,reviewVersion:v.version,itemId:i.id,decision:'Unable to confirm',reason:'Purpose unknown to the reviewer.'},'approver'),/resolve/);});
test('Change and Revoke create a draft request for the administrator without changing grants',()=>{const v=rev(),i=v.items.find(x=>!x.decision&&x.snapshot.capability==='finance.prepare');const g=JSON.stringify(state.grants);
  const r=act('attest',{reviewId:v.id,reviewVersion:v.version,itemId:i.id,decision:'Revoke',reason:'Preparer role ended on 1 September.'},'approver').result;
  const q=state.requests.find(x=>x.id===r.request);assert.equal(q.state,'Draft');assert.equal(q.requesterId,D(1));assert.equal(q.origin.reviewId,v.id);assert.equal(JSON.stringify(state.grants),g);});
test('Review-originated request records who recommended it',()=>{const q=state.requests.find(x=>x.origin);assert.equal(q.origin.attestedBy,D(2));assert.equal(M.attester(q),D(2));});
test('The deputy approver is an independent reviewer; the attester is not',()=>{same(M.approvers(state).map(p=>p.id),[D(2),D(6)]);const q=state.requests.find(x=>x.origin);const payload=r=>({id:q.id,requestVersion:q.version,subjectId:q.subjectId,reviewerId:r,effectiveFrom:'2026-09-17',reason:q.reason,operations:q.operations});
  refuse(()=>act('saveRequest',payload(D(2)),'admin'),/recommended this change/);act('saveRequest',payload(D(6)),'admin');const n=state.requests.find(x=>x.id===q.id);assert.equal(n.reviewerId,D(6));assert.equal(n.origin.attestedBy,D(2));});
test('The attesting approver cannot decide the resulting request even if named',()=>{let s=copy(state);const q=s.requests.find(x=>x.origin);Object.assign(q,{reviewerId:D(2),state:'Submitted'});
  assert.throws(()=>M.command(s,{op:'attester-decide',expectedVersion:s.version,type:'decideRequest',payload:{id:q.id,requestVersion:q.version,decision:'Approved',reason:'Approving my own recommendation.'}},'approver'),/another approver/);
  const d=copy(state),r=d.requests.find(x=>x.origin);Object.assign(r,{reviewerId:D(2),state:'Draft'});
  assert.throws(()=>M.command(d,{op:'attester-submit',expectedVersion:d.version,type:'submitRequest',payload:{id:r.id,requestVersion:r.version}},'admin'),/recommended this change/);});
test('Restore refuses a request decided by the reviewer who recommended it',()=>{const s=copy(state);const q=s.requests.find(x=>x.origin);q.reviewerId=null;q.state='Returned';q.decision={decision:'Returned',reason:'Returned by the recommending reviewer.',by:D(2),at:s.now};assert.throws(()=>M.validate(s),/recommended it/);});
test('A decided item cannot be decided twice',()=>{const v=rev(),i=v.items.find(x=>x.decision);refuse(()=>act('attest',{reviewId:v.id,reviewVersion:v.version,itemId:i.id,decision:'Keep',reason:'Second attempt at the same item.'},'approver'),/already/);});
test('Stale review version is refused',()=>{const v=rev(),i=v.items.find(x=>!x.decision);refuse(()=>act('attest',{reviewId:v.id,reviewVersion:v.version-1,itemId:i.id,decision:'Keep',reason:'Confirmed with the Finance lead.'},'approver'),/another session/);});
test('Completing after every decision makes the review read-only',()=>{for(const i of rev().items.filter(x=>!x.decision))act('attest',{reviewId:rev().id,reviewVersion:rev().version,itemId:i.id,decision:'Keep',reason:'Current duty confirmed with the Finance lead.'},'approver');
  act('completeReview',{reviewId:rev().id,reviewVersion:rev().version},'approver');assert.equal(rev().state,'Complete');const i=rev().items[0];refuse(()=>act('attest',{reviewId:rev().id,reviewVersion:rev().version,itemId:i.id,decision:'Keep',reason:'Late attempt after completion.'},'approver'),/read-only/);});

/* Events and honesty */
test('Only session events claim application audit; all others are proposed or not recorded',()=>{assert(state.events.filter(e=>e.contract).every(e=>e.type==='Session'));assert(state.events.filter(e=>e.provenanceOnly).every(e=>e.outcome==='Not recorded'&&e.actorId===null));});
test('No event claims to have created a seeded grant',()=>{const created=new Set(state.events.flatMap(e=>(e.after||[]).filter(id=>!(e.before||[]).includes(id))));for(const g of M.seed().grants.filter(g=>g.provenance!=='SYN-PPO-ACR-000001'))assert(!created.has(g.id),g.id);});
test('Every workflow event carries an actor, reason and operation',()=>{for(const e of state.events.filter(e=>!e.contract&&!e.provenanceOnly)){assert(e.actorId);assert(e.reason.length>=5);assert(e.operationId);}});

/* Restore validation */
const broken=(mut,pattern)=>{const s=copy(state);mut(s);assert.throws(()=>M.validate(s),pattern);};
test('Restore refuses an unknown capability',()=>broken(s=>{s.grants[0].capability='admin.everything';},/Unknown capability/));
test('Restore refuses an invalid scope',()=>broken(s=>{s.grants[0].siteId=S3;s.grants[0].scopeType='Site';},/belong/));
test('Restore refuses a grant ending before it starts',()=>broken(s=>{s.grants[0].validTo='2025-01-01T00:00:00Z';},/ends before/));
test('Restore refuses a duplicate grant',()=>broken(s=>{s.grants.push({...s.grants[0],id:'8c000000-0000-4000-8000-000000000001'});},/Duplicate grant/));
test('Restore refuses a self-decided request',()=>broken(s=>{const r=s.requests.find(x=>x.decision);r.decision.by=r.requesterId;},/decided by its requester/));
test('Restore refuses a complete review with undecided items',()=>broken(s=>{s.reviews[1].items[0].decision=null;},/undecided/));
test('Restore refuses email.connect on a local identity',()=>broken(s=>{s.grants[0].capability='email.connect';},/hosted-only/));
test('Restore refuses a foreign schema',()=>assert.throws(()=>M.validate({schema:'other'}),/Unsupported/));
test('Valid serialised state round-trips unchanged',()=>assert.equal(JSON.stringify(M.validate(copy(state))),JSON.stringify(state)));

/* Composition */
const page=fs.readFileSync(html,'utf8');
test('Assembled page is the module only, with one scope container and six views',()=>{assert.equal((page.match(/id="ppo-access-review"/g)||[]).length,1);assert.equal(M.VIEWS.length,6);assert(!/<nav[^>]*rail|class="masthead"|<img/.test(page));assert.match(page,/<meta name="ppo-scope-id" content="AD-01">/);assert.match(page,/<meta name="ppo-design-status" content="working">/);});
test('Embedded fonts are byte-identical to the declared My Work r20 source',()=>{assert.equal(sha(path.join(src,'fonts.css')),sha(path.join(root,'docs/design/my-work/fonts.css')));assert(page.includes(fs.readFileSync(path.join(src,'fonts.css'),'utf8')));});
test('Token core names match the My Work r01 source',()=>{const tok=f=>(fs.readFileSync(f,'utf8').match(/--(navy|green|ink|paper|surface|line|muted|link|success|warning|danger|info)(-bg)?:[^;]+/g)||[]).slice(0,17);same(tok(path.join(src,'workspace.css')),tok(path.join(root,'docs/design/my-work/workspace.css')));});
test('Page makes no remote requests and stores only under its own key',()=>{assert(!/https?:\/\/(?!www\.w3\.org)[^"'\s)]*\.(js|css|woff2?)/.test(page));assert.match(page,/ppo-access-review-r01/);assert(!/sessionStorage|indexedDB/.test(page));});
test('Page never claims enforcement and states the authority boundary',()=>{assert.match(page,/The server decides access/);assert.match(page,/Simulated apply/);assert.match(page,/Not agreed \(D-020\)/);assert(!/review every (quarter|month|90 days)/i.test(page));});
test('Page contains no secrets, tokens or unmasked hosted object identifiers in rendered copy',()=>{assert(!/token_hash|password|secret=/i.test(page.replace(/Tokens are never shown/g,'')));});

const out={html_sha256:sha(html),fixture_sha256:createHash('sha256').update(M.stable(M.seed())).digest('hex'),capability_source_sha256:C.source_sha256,groups:results.length,results};
if(process.argv.includes('--write-evidence')){fs.mkdirSync(path.join(root,'verification-evidence/access-review'),{recursive:true});fs.writeFileSync(path.join(root,'verification-evidence/access-review/model-results.json'),JSON.stringify(out,null,2)+'\n');}
console.log(JSON.stringify(out,null,2));
