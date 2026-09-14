#!/usr/bin/env node
// Design semantics and generated template checks only. No browser, ERP or application server.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const file = new URL('../docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html', import.meta.url);
const html = readFileSync(file, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Self-contained script exists');
new vm.Script(script);
const model = script.split('/* PPO_FINANCE_MODEL_START */')[1].split('/* PPO_FINANCE_MODEL_END */')[0];
const sandbox = vm.createContext({});
vm.runInContext(model, sandbox);
const F = vm.runInContext('Finance', sandbox);
const plain = x => JSON.parse(JSON.stringify(x));
const find = (s,id) => s.handoffs.find(h=>h.id===id);
const act = (s,id,role,action,fields={}) => F.perform(s,id,role,action,{confirm:true,...fields});
const output = (s,id,value='Processed') => act(s,id,'Processor','outcome',{outcome:value,evidence:'SYN-PPO-EVD-OBSERVED-01'});
let count=0;
const check = (name,fn) => { fn();count++;console.log('PASS '+name); };

check('Issued r01 bytes are preserved',()=>{
  const r01=readFileSync(new URL('../docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html',import.meta.url));
  assert.equal(createHash('sha256').update(r01).digest('hex'),'837476446970f1c66c48a7d70c55681aa67b24877097e96886adc762537429e1');
});
check('Self-contained r18 asset and component structure',()=>{
  assert.doesNotMatch(html,/__(?:CSS|MODEL|UI|FONTS|TOKENS|SOURCE_HEAD|THEME_HASH)__/);
  assert.equal((html.match(/@font-face/g)||[]).length,3);
  assert.match(html,/e55ccbabef40a0b07a95ee5847f99147a8f29e8f7c84f90497df2b4d5e6696ab/);
  assert.equal((html.split('<script>')[0].match(/role="tab"/g)||[]).length,4);
  assert.doesNotMatch(script,/\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b/);
  assert.match(html,/\.context-panel\.assistant\{width:480px\}/);
  assert.match(html,/border-radius:14px/);
  assert.match(html,/outline:2px solid var\(--focus\);outline-offset:3px/);
  assert.match(html,/min-height:44px/);
});
check('Exact decimal quantities and whole-minute time',()=>{
  assert.equal(F.quantity('1.25')+F.quantity('0.5'),F.quantity('1.75'));
  assert.equal(F.qty(F.quantity('0.000001')),'0.000001');
  for(const invalid of ['-1','NaN','1e2','0.0000001',''])assert.throws(()=>F.quantity(invalid));
  assert.throws(()=>F.quantity('1.5','MIN'),/whole minutes/);
});
check('Every handoff has a matching company and customer account',()=>{
  const s=F.create();assert.equal(s.handoffs.length,11);assert.equal(s.accounts.length,6);
  for(const h of s.handoffs){const a=s.accounts.find(a=>a.id===h.account);assert.ok(a);assert.equal(a.company,h.company);assert.equal(a.customer,h.customerId);assert.equal(a.name,h.customer);}
});
check('Shared source allocations conserve quantities once per source',()=>{
  const s=F.create(),h=find(s,'000250');
  assert.deepEqual(plain(h.lines.map(l=>[F.qty(l.reviewed),F.qty(F.ledger(s,h,l).assigned),F.qty(F.ledger(s,h,l).remaining)])),[['180','180','0'],['2.5','2.5','0']]);
  assert.deepEqual(plain(h.lines.map(l=>F.qty(l.allocated))),['120','1.75']);
});
check('Unresolved treatment cannot be submitted or approved',()=>{
  const s=F.create();assert.match(F.availability(s,find(s,'000242'),'Preparer','submit'),/treatment/);
  assert.throws(()=>act(s,'000242','Preparer','submit'),/treatment/);
});
check('Invalid treatment leaves the exact source and Draft untouched',()=>{
  const s=F.create(),before=JSON.stringify(find(s,'000242'));
  assert.throws(()=>act(s,'000242','Preparer','treatment',{line:'000603',billable:'121',reason:'Over allocation'}),/exceed/);
  assert.equal(JSON.stringify(find(s,'000242')),before);
  assert.throws(()=>act(s,'000242','Preparer','treatment',{line:'000603',billable:'60',reason:'  '}),/reason/);
  assert.equal(JSON.stringify(find(s,'000242')),before);
});
check('Read-only and wrong-role actions are blocked',()=>{
  const s=F.create(),before=JSON.stringify(s);
  assert.throws(()=>act(s,'000241','Observer','approve'),/Read-only/);
  assert.throws(()=>act(s,'000241','Processor','approve'),/reviewer/);
  assert.equal(JSON.stringify(s),before);
});
check('Separate review and claim create no processing target',()=>{
  const s=F.create();act(s,'000241','Reviewer','approve');assert.equal(find(s,'000241').state,'Approved');
  act(s,'000241','Processor','claim');assert.equal(find(s,'000241').state,'AwaitingERP');assert.equal(find(s,'000241').originalTarget,null);
  assert.equal(find(s,'000241').attempts.length,1);
});
check('Travel retains its category, quantity and explicit non-billable reason',()=>{
  const s=F.create(),h=find(s,'000248');assert.equal(h.lines[0].kind,'Travel');assert.equal(h.lines[0].billable,0);assert.equal(h.lines[0].allocated,F.quantity(60));
  act(s,'000248','Reviewer','return',{reason:'Check travel basis'});act(s,'000248','Preparer','revise',{reason:'Synthetic P11 v2 confirmed'});
  assert.throws(()=>act(s,'000248','Preparer','treatment',{line:'000611',billable:'1',reason:'Bill travel'}),/Travel/);
});
check('No-posting journey reaches reconciliation without any target',()=>{
  const s=F.create();act(s,'000248','Reviewer','approve');act(s,'000248','Processor','claim');output(s,'000248','NotProcessed');
  assert.equal(find(s,'000248').state,'ReconciliationRequired');assert.equal(find(s,'000248').originalTarget,null);
  assert.equal(F.comparison(find(s,'000248')).issues.length,0);
  act(s,'000248','Reconciler','reconcile',{reason:'All 60 MIN Travel remain non-billable with verified no-effect evidence.'});
  const h=find(s,'000248');assert.equal(h.state,'Reconciled');assert.equal(h.reconciliation.result,'NoPostingRequired');assert.equal(h.reconciliation.target,null);assert.equal(h.hold,'Consumed');assert.equal(h.lines[0].allocated,F.quantity(60));
});
check('Fully non-billable work cannot create zero-quantity targets',()=>{
  const s=F.create();for(const line of ['000603','000604'])act(s,'000242','Preparer','treatment',{line,billable:'0',reason:'Reviewed synthetic warranty coverage'});
  act(s,'000242','Preparer','submit');act(s,'000242','Reviewer','approve');act(s,'000242','Processor','claim');
  assert.throws(()=>output(s,'000242','Processed'),/non-billable/);assert.throws(()=>output(s,'000242','Unknown'),/non-billable/);
  assert.equal(find(s,'000242').originalTarget,null);output(s,'000242','NotProcessed');
  act(s,'000242','Reconciler','reconcile',{reason:'Warranty treatment and no-effect evidence reviewed.'});
  assert.equal(find(s,'000242').reconciliation.result,'NoPostingRequired');
});
check('No-effect chargeable work returns to Approved with retained attempt lineage',()=>{
  const s=F.create();act(s,'000244','Processor','claim');output(s,'000244','NotProcessed');
  let h=find(s,'000244');assert.equal(h.state,'Approved');assert.equal(h.originalTarget,null);assert.equal(h.attempts.length,1);assert.equal(h.attempts[0].outcome,'NotProcessed');
  act(s,'000244','Processor','claim');h=find(s,'000244');assert.equal(h.attempts.length,2);assert.equal(h.attempts[0].correlation,h.attempts[1].correlation);
});
check('Unknown recovery returns the same target and prevents replay or cancellation',()=>{
  const s=F.create();act(s,'000244','Processor','claim');output(s,'000244','Unknown');const target=JSON.stringify(find(s,'000244').originalTarget);
  assert.throws(()=>act(s,'000244','Preparer','cancel',{reason:'Close browser'}));assert.throws(()=>act(s,'000244','Processor','claim'));assert.throws(()=>output(s,'000244'));
  act(s,'000244','Processor','lookup',{evidence:'SYN-PPO-EVD-ORIGINAL-LOOKUP'});assert.equal(JSON.stringify(find(s,'000244').originalTarget),target);assert.equal(find(s,'000244').state,'ReconciliationRequired');
});
check('No original result keeps the outcome unknown without a fabricated target',()=>{
  const s=F.create();find(s,'000246').originalTarget=null;const before=JSON.stringify(s);
  assert.throws(()=>act(s,'000246','Processor','lookup',{evidence:'SYN-PPO-EVD-LOOKUP'}),/No verified original/);assert.equal(JSON.stringify(s),before);
});
check('Initial 30 MIN mismatch is independently calculated',()=>{
  const h=find(F.create(),'000245'),c=F.comparison(h);assert.equal(c.rows[0].delta,F.quantity(30));assert.equal(c.rows[0].match,false);assert.equal(c.rows[1].match,true);assert.ok(c.issues.length);
});
check('Missing, extra and duplicate target lines block closure and remain visible',()=>{
  for(const [kind,change] of [['missing',h=>h.originalTarget.lines.shift()],['unexpected',h=>h.originalTarget.lines.push({...h.originalTarget.lines[0],id:'SYN-UNEXPECTED'})],['duplicate',h=>h.originalTarget.lines.push({...h.originalTarget.lines[0]})]]){
    const s=F.create(),h=find(s,'000247');h.state='ReconciliationRequired';change(h);assert.ok(F.comparison(h).rows.some(r=>r.kind===kind));assert.ok(F.availability(s,h,'Reconciler','reconcile'));
  }
});
check('Company, account, currency, status and source revisions are reconciliation conditions',()=>{
  for(const key of ['company','account','customer','currency','status','correlation','revision','reportRevision','type','evidence','observedAt']){
    const s=F.create(),h=find(s,'000247');h.state='ReconciliationRequired';h.originalTarget[key]=key==='evidence'||key==='observedAt'?'':'different';assert.ok(F.comparison(h).issues.length,key);assert.ok(F.availability(s,h,'Reconciler','reconcile'),key);
  }
});
check('Unit, direction and allocation mapping mismatches never compare numerically',()=>{
  for(const key of ['source','allocation','unit','direction']){const h=find(F.create(),'000247');h.state='ReconciliationRequired';h.originalTarget.lines[0][key]='different';const row=F.comparison(h).rows[0];assert.equal(row.kind,'mapping');assert.equal(row.delta,null);}
});
check('Correction request retains the original and cannot close the difference',()=>{
  const s=F.create(),target=JSON.stringify(find(s,'000245').originalTarget);
  act(s,'000245','Reconciler','requestCorrection',{owner:'Casey Reed',reason:'Resolve the 30 MIN difference.',requiredEvidence:'A linked exact source/result correction.'});
  assert.equal(find(s,'000245').correction.status,'Requested');assert.equal(JSON.stringify(find(s,'000245').originalTarget),target);assert.throws(()=>act(s,'000245','Reconciler','reconcile',{reason:'Request alone'}));
});
check('Correction evidence must be supplied, matched, separately verified and reconciled',()=>{
  const s=F.create(),target=JSON.stringify(find(s,'000245').originalTarget);
  act(s,'000245','Reconciler','requestCorrection',{owner:'Casey Reed',reason:'Resolve the difference.',requiredEvidence:'Linked correction evidence.'});
  act(s,'000245','Processor','supplyEvidence',{fixture:'Still different',evidence:'SYN-PPO-COR-OBS-01'});assert.throws(()=>act(s,'000245','Reconciler','verifyCorrection'),/still differs/);
  act(s,'000245','Processor','supplyEvidence',{fixture:'Match',evidence:'SYN-PPO-COR-OBS-02'});assert.equal(find(s,'000245').correction.observations.length,2);
  assert.throws(()=>act(s,'000245','Reconciler','reconcile',{reason:'Evidence not yet verified.'}));
  act(s,'000245','Reconciler','verifyCorrection');assert.equal(find(s,'000245').state,'ReconciliationRequired');
  act(s,'000245','Reconciler','reconcile',{reason:'Verified correction and original evidence reviewed.'});
  const h=find(s,'000245');assert.equal(h.correction.status,'Resolved');assert.equal(h.state,'Reconciled');assert.equal(JSON.stringify(h.originalTarget),target);assert.notEqual(h.reconciliation.target,h.originalTarget.ref);
});
check('Correction evidence must link to the correct retained original',()=>{
  const s=F.create();act(s,'000245','Reconciler','requestCorrection',{owner:'Casey Reed',reason:'Difference.',requiredEvidence:'Linked correction.'});act(s,'000245','Processor','supplyEvidence',{fixture:'Match',evidence:'SYN-PPO-COR-01'});
  find(s,'000245').correction.evidence.corrects='another-target';assert.throws(()=>act(s,'000245','Reconciler','verifyCorrection'),/still differs/);
});
check('Return of an approved handoff preserves the approval and its original revision',()=>{
  const s=F.create(),before=plain(find(s,'000244').lines),approval=find(s,'000244').reviewedAt;
  act(s,'000244','Reviewer','return',{reason:'Review the coverage reference.'});act(s,'000244','Preparer','revise',{reason:'Coverage confirmed by fictional SYN-COV-244.'});
  const h=find(s,'000244');assert.equal(h.state,'Draft');assert.equal(h.revision,2);assert.equal(h.originals[0].reviewedAt,approval);assert.deepEqual(plain(h.originals[0].lines),before);assert.equal(h.reviewedAt,null);
});
check('Pre-effect cancellation releases the hold and retains history',()=>{
  const s=F.create(),before=plain(find(s,'000244').lines);act(s,'000244','Preparer','cancel',{reason:'Fictional duplicate scope withdrawn before processing.'});const h=find(s,'000244');assert.equal(h.state,'Cancelled');assert.equal(h.hold,'Released');assert.deepEqual(plain(h.lines),before);assert.ok(h.history.at(-1).text.includes('released'));
});
check('Source successor before processing requires a revised review',()=>{
  const s=F.create();F.sourceSuccessor(s,'000244');let h=find(s,'000244');assert.equal(h.state,'Returned');assert.equal(h.sourceCurrent,false);assert.equal(h.reportRevision,2);assert.equal(h.latestReportRevision,3);
  act(s,'000244','Preparer','revise',{reason:'Review exact successor r03.'});h=find(s,'000244');assert.equal(h.reportRevision,3);assert.equal(h.originals[0].reportRevision,2);assert.equal(h.state,'Draft');assert.equal(h.sourceCurrent,true);
});
check('Source successor after possible processing preserves original uncertainty and consumed evidence',()=>{
  const s=F.create(),target=JSON.stringify(find(s,'000246').originalTarget);F.sourceSuccessor(s,'000246');assert.equal(find(s,'000246').state,'OutcomeUnknown');act(s,'000246','Processor','lookup',{evidence:'SYN-PPO-LOOKUP'});
  assert.equal(JSON.stringify(find(s,'000246').originalTarget),target);assert.throws(()=>act(s,'000246','Reconciler','reconcile',{reason:'Stale source'}),/Source changed/);
  F.sourceSuccessor(s,'000247');assert.equal(find(s,'000247').state,'ReconciliationRequired');assert.equal(find(s,'000247').hold,'Consumed');
});
check('Stale confirmation leaves the current record unchanged',()=>{
  const s=F.create(),h=find(s,'000241'),expected={revision:h.revision,version:h.version};act(s,'000241','Reviewer','return',{reason:'Review source.'});const before=JSON.stringify(s);
  assert.throws(()=>F.perform(s,'000241','Reviewer','approve',{confirm:true},expected),/changed/);assert.equal(JSON.stringify(s),before);
});
check('Material treatment accepts exact fractional quantities without changing captured source',()=>{
  const s=F.create();act(s,'000250','Reviewer','return',{reason:'Review hose treatment.'});act(s,'000250','Preparer','revise',{reason:'Fictional basis confirmed.'});
  act(s,'000250','Preparer','treatment',{line:'000614',billable:'1.375001',reason:'Exact fictional material treatment.'});const l=find(s,'000250').lines[1];assert.equal(F.qty(l.billable),'1.375001');assert.equal(F.qty(l.captured),'2.5');assert.equal(F.qty(l.allocated),'1.75');
});
check('Account applications and reversed payments retain their own identities',()=>{
  const s=F.create(),a=s.accounts[0],reversed=s.accounts[2];assert.equal(a.open,60000);assert.equal(a.cash,20000);assert.equal(a.rows[0].amount,110000);assert.equal(a.rows[0].remaining,60000);
  assert.equal(reversed.open,100000);assert.equal(reversed.rows.find(r=>r.type==='Payment').status,'Reversed');
  for(const account of s.accounts)for(const row of account.rows)for(const link of row.links)assert.ok(account.rows.some(r=>r.id===link),link);
});
check('Partial and failed reads retain source completeness and observation history',()=>{
  const s=F.create(),a=s.accounts[1];assert.equal(a.open,null);assert.equal(a.rows.length,1);F.refreshAccount(s,'A02','Complete');assert.equal(a.open,300000);assert.equal(a.rows.length,2);assert.equal(a.runs[0].health,'Partial');
  const at=a.at;F.refreshAccount(s,'A02','Failed');assert.equal(a.health,'Failed');assert.equal(a.at,at);assert.notEqual(a.readAt,at);assert.equal(a.open,300000);assert.equal(a.runs.length,2);
});
check('AI explains independently calculated differences without applying a business action',()=>{
  const s=F.create(),before=JSON.stringify(s),answer=F.assistantAnswer(s,'000245','difference');assert.match(answer.paragraphs.join(' '),/120 MIN.*150 MIN.*\+30 MIN/);assert.equal(answer.sources.length,3);assert.equal(JSON.stringify(s),before);
});
check('AI cannot expose an unknown target through an answer or source snapshot',()=>{
  const s=F.create(),answer=F.assistantAnswer(s,'000246','difference'),target=find(s,'000246').originalTarget.ref;
  assert.equal(answer.snapshot.originalTarget,null);assert.doesNotMatch(JSON.stringify(answer),new RegExp(target));assert.equal(answer.sources.length,2);assert.match(answer.paragraphs[0],/unknown/);
});
check('AI source snapshots retain the earlier exact revision',()=>{
  const s=F.create(),answer=F.assistantAnswer(s,'000241','draft');F.sourceSuccessor(s,'000241');assert.equal(answer.snapshot.reportRevision,2);assert.notEqual(answer.signature,F.sourceSignature(find(s,'000241')));assert.equal(answer.snapshot.latestReportRevision,2);
});
check('Reviewed AI notes enforce role, context and a deliberate confirmation',()=>{
  const s=F.create(),answer=F.assistantAnswer(s,'000245','draft');
  assert.throws(()=>act(s,'000245','Observer','requestCorrection',{aiSignature:answer.signature,owner:'Casey Reed',reason:answer.draft,requiredEvidence:'Evidence.'}),/Read-only/);
  assert.throws(()=>F.perform(s,'000245','Reconciler','requestCorrection',{aiSignature:answer.signature,owner:'Casey Reed',reason:answer.draft,requiredEvidence:'Evidence.'}),/Confirm/);
  act(s,'000245','Reconciler','requestCorrection',{aiSignature:answer.signature,owner:'Casey Reed',reason:'Reviewed wording: investigate the 30 MIN difference.',requiredEvidence:'Exact linked source evidence.'});assert.ok(find(s,'000245').history.at(-1).text.includes('Reviewed AI wording'));
  assert.throws(()=>act(s,'000245','Processor','supplyEvidence',{aiSignature:answer.signature,fixture:'Match',evidence:'SYN-EVD'}),/earlier/);
});
check('Seed and subsequent history preserve all events with actor, revision and outcome',()=>{
  const s=F.create();act(s,'000241','Reviewer','approve');act(s,'000241','Processor','claim');output(s,'000241');act(s,'000241','Reconciler','reconcile',{reason:'Exact evidence reviewed.'});const history=find(s,'000241').history;assert.ok(history.length>3);assert.equal(history[0].state,'Draft');assert.equal(history.at(-1).state,'Reconciled');assert.ok(history.every(e=>e.id&&e.actor&&e.at&&e.revision&&e.state));
});

// Inert placeholders let the shipped view templates and bootstrap execute without a renderer.
const elements=new Map();
const element=selector=>{
  if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',hidden:false,open:false,style:{setProperty(){}},setAttribute(){},removeAttribute(){},addEventListener(){},focus(){},close(){this.open=false;},querySelector:element,querySelectorAll:()=>[]});
  return elements.get(selector);
};
const root={querySelector:element,querySelectorAll:()=>[],addEventListener(){}};
const timers=[];
const dom=vm.createContext({document:{getElementById:()=>root,activeElement:null,addEventListener(){}},window:{addEventListener(){},matchMedia:()=>({matches:false})},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){}});
vm.runInContext(script,dom);
const evaluate=code=>vm.runInContext(code,dom);
check('All four shipped view templates generate with real fixture semantics',()=>{
  for(const code of ['queue()','review()','accounts()',"ui.selected='000245';reconciliation()"]){const output=evaluate(code);assert.ok(output.length>2000);assert.doesNotMatch(output,/undefined|NaN/);}
  assert.match(evaluate("ui.selected='000248';sourceView(current())"),/Travel/);
});
check('Summary worklists show the exact records in their state group',()=>{
  for(const [shortcut,total] of [['review',3],['prepare',3],['processing',2],['exceptions',2]])assert.equal(evaluate(`ui.shortcut='${shortcut}';listRows().length`),total);
});
check('All non-billable processing form has only the no-effect option',()=>{
  assert.match(script,/allNonBillable\(h\)\?'<option value="NotProcessed">No posting required/);
  assert.match(script,/Record no-posting evidence/);
});
check('Unavailable account observations never render as current balances',()=>{
  const partial=evaluate("ui.account='A02';accounts()");assert.match(partial,/Unavailable/);assert.match(partial,/page 1 of 2/);
  const failed=evaluate("ui.account='A03';accounts()");assert.match(failed,/Current balances are unavailable/);assert.match(failed,/Historical observation only/);assert.match(failed,/SYN-PPO-REV-000003/);
});
check('History filters operate on the full event set',()=>{
  assert.match(evaluate("ui.selected='000245';historyResults(current())"),/retained events/);
  assert.match(evaluate("ui.historyQuery='no such event';historyResults(current())"),/No matching events/);
  evaluate("ui.historyQuery=''");
});
check('Access-unavailable templates clear protected workspace and print content',()=>{
  evaluate("ui.read='Denied';ui.view='review';render()");assert.doesNotMatch(elements.get('#workspace').innerHTML,/SYN-PPO-FH-|Northbank|Fernhaven|\$1,000/);assert.doesNotMatch(elements.get('#print-document').innerHTML,/SYN-PPO-FH-/);assert.equal(elements.get('#queue-count').textContent,'—');
});
check('Partial reads do not establish overall counts or enable record actions',()=>{
  const partial=evaluate("ui.read='Partial';readSurface()");assert.match(partial,/overall counts and record actions remain unavailable/);assert.match(partial,/3 records from a partial read/);assert.match(partial,/data-open="000241" disabled/);
});
check('User-authored notes are escaped in review, history and print templates',()=>{
  evaluate("ui.read='Ready';ui.view='review';ui.selected='000241';current().reviewNote='<img src=x onerror=alert(1)>';current().history[0].text='<script>bad</script>'");assert.doesNotMatch(evaluate('review()'),/<img src=x/);assert.doesNotMatch(evaluate('historyResults(current())'),/<script>bad/);evaluate('updatePrint()');assert.doesNotMatch(elements.get('#print-document').innerHTML,/<img src=x|<script>bad/);
});
const flush=()=>{while(timers.length)timers.shift()();};
check('Stopped assistant requests cannot append a response or apply a note',()=>{
  evaluate("ui.state=F.create();ui.ai={};ui.read='Ready';ui.selected='000245';ui.panel='assistant';ui.aiFixture='Normal';sendAI('Explain this difference','difference');stopAI()");flush();
  assert.equal(evaluate("aiState().messages.filter(m=>m.kind==='reply').length"),0);assert.equal(evaluate('aiState().pending'),null);assert.equal(evaluate('current().correction'),null);assert.match(evaluate('aiState().composer'),/Explain/);
});
check('Assistant failure retains the question and allows a fresh original-record retry',()=>{
  evaluate("ui.ai={};ui.aiFixture='Request fails';sendAI('Explain this difference','difference')");flush();assert.match(evaluate('aiState().failure'),/failed/);assert.equal(evaluate('aiState().composer'),'Explain this difference');
  evaluate("ui.aiFixture='Normal';sendAI(aiState().lastPrompt,aiState().lastIntent)");flush();assert.equal(evaluate("aiState().messages.filter(m=>m.kind==='reply').length"),1);assert.equal(evaluate('current().correction'),null);
});
check('Delayed assistant answers stay with their original handoff',()=>{
  evaluate("ui.ai={};ui.selected='000245';sendAI('Draft a note','draft');ui.selected='000241';aiState().composer='A separate unsent question'");flush();
  assert.equal(evaluate("ui.ai['000245'].messages.filter(m=>m.kind==='reply').length"),1);assert.equal(evaluate("ui.ai['000241'].messages.length"),0);assert.equal(evaluate('aiState().composer'),'A separate unsent question');
});
check('Source changes during preparation retain the answer but mark its old basis',()=>{
  evaluate("ui.ai={};ui.selected='000241';sendAI('Draft a return note','draft');F.sourceSuccessor(ui.state,'000241')");flush();
  assert.notEqual(evaluate('aiState().messages.at(-1).response.signature'),evaluate('F.sourceSignature(current())'));assert.match(evaluate('conversation(current(),aiState())'),/Earlier source \/ record/);
});
check('Access changes during an assistant request prevent displaying its content',()=>{
  evaluate("ui.ai={};ui.selected='000245';ui.read='Ready';sendAI('Explain this difference','difference');ui.read='Denied'");flush();assert.equal(evaluate("aiState().messages.filter(m=>m.kind==='reply').length"),0);assert.match(evaluate('aiState().failure'),/not displayed/);
});
console.log(`${count} Finance r02 checks passed. Browser rendering, native dialogs, keyboard focus, enhanced select interaction and print pagination still require native browser validation.`);
