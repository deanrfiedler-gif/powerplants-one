/* Focused behavioural checks for the Order Fulfilment & Customer Delivery coordination
   model. These are design-source checks, not application acceptance evidence. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'docs/design/order-fulfilment/model.js'),'utf8'),context);
const M=context.OF_MODEL, copy=x=>JSON.parse(JSON.stringify(x));
let state=M.seed(), op=0;
const results=[], test=(name,fn)=>{fn();results.push({name,result:'Passed'});};
const act=(type,payload,role='coordinator',company='PPA-AU',s=null)=>{
  const target=s||state;
  const r=M.command(target,{op:'of-test-'+(++op),expectedVersion:target.version,type,payload},role,company);
  if(!s)state=r.state;
  return r;
};
const refusal=(fn,pattern)=>{const before=JSON.stringify(state);assert.throws(fn,pattern);assert.equal(JSON.stringify(state),before);};
const line=id=>M.lineOf(state,id);
const t=id=>M.totals(state,id);
const lv=id=>line(id).version;
const q=(n,u)=>M.amount(n,u);

test('The seed fixture validates and every declared collection invariant holds',()=>{
  M.validate(state);
  assert.equal(state.version,0);
  assert.equal(state.orders.length,7);
  assert.equal(state.lines.length,9);
  for(const l of state.lines)assert.equal(l.unit,M.items[l.item].unit);
});

test('Company grants isolate records from search, counts, snapshots and projections',()=>{
  assert.equal(M.visibleOrders(state,'coordinator','PPA-NZ').length,0);
  assert.equal(M.query(state,'coordinator','PPA-NZ',{...M.filters(),q:'Kauri'}).length,0);
  assert.equal(M.summary(state,'coordinator','PPA-NZ',M.filters()).reduce((n,c)=>n+c.value,0),0);
  assert.equal(M.visibleAvailability(state,'coordinator','PPA-NZ').length,0);
  const group=M.visibleOrders(state,'groupCoordinator','PPA-NZ');
  assert.equal(group.length,1);
  assert.equal(group[0].organisation.name,'Kauri Ridge Glasshouses');
  assert(!M.visibleOrders(state,'groupCoordinator','PPA-AU').some(o=>o.company==='PPA-NZ'));
});

test('Commercial values never enter a projection for a role without the commercial grant',()=>{
  for(const role of ['warehouse','delivery','observer']){
    const rows=M.visibleOrders(state,role,'PPA-AU');
    assert(rows.length>0);
    for(const o of rows)for(const l of o.lines){assert.equal(l.value,undefined);assert.equal(l.valueRestricted,true);}
    assert(!JSON.stringify(rows).includes('4950.00'));
    assert.equal(M.query(state,role,'PPA-AU',{...M.filters(),q:'4950'}).length,0);
  }
  assert.equal(M.visibleOrders(state,'coordinator','PPA-AU').find(o=>o.id==='ful-000001').lines[0].value,'4950.00');
});

test('Warehouse scope limits the availability view without inventing a quantity',()=>{
  const wh=M.visibleAvailability(state,'warehouse','PPA-AU');
  assert(wh.every(a=>a.warehouse==='SYN-WH-MEL'));
  assert(M.visibleAvailability(state,'coordinator','PPA-AU').some(a=>a.warehouse==='SYN-WH-SYD'));
  assert.equal(M.visibleAvailability(state,'delivery','PPA-AU').length,0);
});

test('A partial observation is unknown, not zero, and cannot support a reservation',()=>{
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000006');
  assert.equal(a.completeness,'Partial');
  assert.equal(a.onHand,null);
  assert.equal(a.sourceAvailable,null);
  assert.equal(a.usableEvidence,null);
  assert.equal(a.remainingUsable,null);
  refusal(()=>act('reserve',{line:'lin-000006',lineVersion:lv('lin-000006'),avLine:'avl-000006',qty:'1',reason:'Attempt a reservation on an incomplete observation.'}),/Stock information is incomplete/);
  const blockers=M.blockers(state,'ful-000004');
  assert(blockers.some(b=>b.kind==='Stock information incomplete'));
});

test('Quarantined stock is physically present but never usable',()=>{
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000002');
  assert.equal(M.show(a.onHand),'4');
  assert.equal(M.show(a.held),'4');
  assert.equal(M.show(a.usableEvidence),'0');
  refusal(()=>act('reserve',{line:'lin-000001',lineVersion:lv('lin-000001'),avLine:'avl-000002',qty:'1',reason:'Attempt to reserve quarantined stock.'}),/refused rather than over-allocated/);
});

test('An internally inconsistent source value is preserved and excluded, not corrected',()=>{
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000011');
  assert.equal(M.show(a.onHand),'2');
  assert.equal(M.show(a.sourceAvailable),'3');
  assert(a.anomaly);
  assert.equal(a.usableEvidence,null);
  refusal(()=>act('reserve',{line:'lin-000001',lineVersion:lv('lin-000001'),avLine:'avl-000011',qty:'1',reason:'Attempt to reserve against an observation under investigation.'}),/under investigation/);
});

test('An unresolved unit basis is never summed and never satisfies a differing unit',()=>{
  const pack=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000004');
  const ea=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000005');
  assert.equal(pack.unit,'PACK');assert.equal(ea.unit,'EA');
  assert.equal(ea.usableEvidence,null);
  refusal(()=>act('reserve',{line:'lin-000005',lineVersion:lv('lin-000005'),avLine:'avl-000005',qty:'1',reason:'Attempt a cross-unit reservation.'}),/No conversion basis exists/);
  assert(M.blockers(state,'ful-000003').some(b=>b.kind==='Unresolved unit basis'));
});

test('Incoming supply is promised, not usable',()=>{
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000001');
  assert.equal(a.incoming.length,1);
  assert.equal(a.incoming[0].state,'Promised, not received');
  assert.equal(M.show(a.usableEvidence),'6');
  assert.equal(M.show(a.remainingUsable),'6');
});

test('The register condition and blockers describe the Northbank shortage exactly',()=>{
  const o=M.visibleOrders(state,'coordinator','PPA-AU').find(x=>x.id==='ful-000001');
  assert.equal(o.condition,'Awaiting stock');
  const b=o.blockers.find(x=>x.kind==='Insufficient evidenced usable stock');
  assert(b);
  assert.match(b.detail,/10 EA still required; 6 EA evidenced usable/);
  assert.equal(M.show(o.lines[0].totals.outstanding),'10');
});

test('Requested, confirmed and expected dates are separate values with their own versions',()=>{
  const c=M.commitmentsOf(state,'lin-000001');
  assert.equal(c.requested.date,'2026-09-17');
  assert.equal(c.confirmed.date,'2026-09-17');
  assert.equal(c.expected.date,'2026-09-17');
  assert.notEqual(c.requested.id,c.confirmed.id);
  assert.equal(c.history.length,3);
});

test('Reservation binds evidenced usable stock and records a confirmed source reference',()=>{
  const r=act('reserve',{line:'lin-000001',lineVersion:lv('lin-000001'),avLine:'avl-000001',qty:'6',reason:'Reserve the evidenced usable quantity for the first shipment.'});
  const res=state.reservations.find(x=>x.id===r.receipt.resultId);
  assert.equal(res.state,'Confirmed');
  assert.match(res.sourceRef,/^SYN-ERP-ALLOC-/);
  assert.equal(M.show(t('lin-000001').reserved),'6');
  assert.equal(M.show(t('lin-000001').unreserved),'4');
});

test('Double allocation against the same evidenced quantity is refused, not netted to a negative',()=>{
  refusal(()=>act('reserve',{line:'lin-000001',lineVersion:lv('lin-000001'),avLine:'avl-000001',qty:'4',reason:'Attempt to reserve beyond the evidenced usable quantity.'}),/Only 0 EA is evidenced usable and unreserved/);
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000001');
  assert.equal(M.show(a.remainingUsable),'0');
  assert(a.remainingUsable>=0);
});

test('Competing demand against one observation lets exactly one request succeed',()=>{
  act('reserve',{line:'lin-000003',lineVersion:lv('lin-000003'),avLine:'avl-000003',qty:'4',reason:'Reserve the Greenhaven requirement from the shared observation.'});
  assert.equal(M.show(t('lin-000003').reserved),'4');
  refusal(()=>act('reserve',{line:'lin-000004',lineVersion:lv('lin-000004'),avLine:'avl-000003',qty:'3',reason:'Attempt to reserve the competing Willowbank requirement.'}),/Only 1 EA is evidenced usable and unreserved/);
  act('reserve',{line:'lin-000004',lineVersion:lv('lin-000004'),avLine:'avl-000003',qty:'1',reason:'Reserve the remaining evidenced quantity and retain the shortage.'});
  assert.equal(M.show(t('lin-000004').outstanding),'3');
  assert.equal(M.show(t('lin-000004').unreserved),'2');
});

test('Only permitted roles may reserve, pick, capture delivery or decide a substitution',()=>{
  refusal(()=>act('reserve',{line:'lin-000002',lineVersion:lv('lin-000002'),avLine:'avl-000007',qty:'1',reason:'Attempt a reservation without the grant.'},'warehouse'),/cannot perform this operation/);
  refusal(()=>act('pick',{line:'lin-000001',lineVersion:lv('lin-000001'),reservation:state.reservations[1].id,picked:'1'},'coordinator'),/cannot perform this operation/);
  refusal(()=>act('reserve',{line:'lin-000002',lineVersion:lv('lin-000002'),avLine:'avl-000007',qty:'1',reason:'Attempt a reservation as a read-only observer.'},'observer'),/read-only/);
  refusal(()=>act('reserve',{line:'lin-000002',lineVersion:lv('lin-000002'),avLine:'avl-000007',qty:'1',reason:'Attempt a reservation outside the company grant.'},'coordinator','PPA-NZ'),/outside the current preview grants/);
});

test('Picking is a physical observation bounded by its confirmed reservation',()=>{
  const res=state.reservations.find(r=>r.line==='lin-000001'&&r.state==='Confirmed');
  refusal(()=>act('pick',{line:'lin-000001',lineVersion:lv('lin-000001'),reservation:res.id,picked:'7'},'warehouse'),/exceeds the confirmed reservation/);
  act('pick',{line:'lin-000001',lineVersion:lv('lin-000001'),reservation:res.id,picked:'6'},'warehouse');
  assert.equal(M.show(t('lin-000001').picked),'6');
  assert.equal(M.show(t('lin-000001').staged),'0');
});

test('Staging is its own observation and cannot exceed the picked quantity',()=>{
  const p=state.picks.at(-1);
  refusal(()=>act('stage',{id:p.id,pickVersion:p.version,staged:'7'},'warehouse'),/exceeds the picked quantity/);
  act('stage',{id:p.id,pickVersion:p.version,staged:'6'},'warehouse');
  assert.equal(M.show(t('lin-000001').staged),'6');
});

test('A short pick needs a recorded finding and blocks dispatch readiness until reviewed',()=>{
  act('reserve',{line:'lin-000002',lineVersion:lv('lin-000002'),avLine:'avl-000007',qty:'3',reason:'Reserve the seal kits for the linked service work order.'});
  const res=state.reservations.at(-1);
  refusal(()=>act('pick',{line:'lin-000002',lineVersion:lv('lin-000002'),reservation:res.id,picked:'2'},'warehouse'),/needs a recorded finding/);
  act('pick',{line:'lin-000002',lineVersion:lv('lin-000002'),reservation:res.id,picked:'2',findingKind:'Short pick',findingNote:'One set was crushed in the bin and has been withdrawn from the pick face.'},'warehouse');
  const p=state.picks.at(-1);
  assert.equal(p.findings.length,1);
  assert.equal(M.show(p.findings[0].qty),'1');
  assert.equal(p.findings[0].reviewed,false);
  assert(M.blockers(state,'ful-000001').some(b=>b.kind==='Picking finding awaiting review'));
});

test('Reviewing a finding records an outcome without altering the physical observation',()=>{
  const p=state.picks.at(-1),before=M.show(p.picked);
  act('reviewFinding',{id:p.id,pickVersion:p.version,index:0,outcome:'Quarantined pending disposition',note:'The damaged set is quarantined; the recorded pick stands as observed.'});
  const after=state.picks.find(x=>x.id===p.id);
  assert.equal(M.show(after.picked),before);
  assert.equal(after.findings[0].reviewed,true);
  assert.equal(after.findings[0].outcome,'Quarantined pending disposition');
  assert(!M.blockers(state,'ful-000001').some(b=>b.kind==='Picking finding awaiting review'));
});

test('A substitution is a proposal only, requires two independent positions and never changes the order',()=>{
  const before=JSON.stringify(state.lines.find(l=>l.id==='lin-000007'));
  refusal(()=>act('proposeSubstitution',{line:'lin-000007',lineVersion:lv('lin-000007'),proposed:'SYN-PPO-PRD-0009',reason:'Attempt a cross-unit substitution.'},'warehouse'),/different unit/);
  act('proposeSubstitution',{line:'lin-000007',lineVersion:lv('lin-000007'),proposed:'SYN-PPO-PRD-0001',reason:'The accepted F200 is discontinued and no supply is evidenced; the F300 is physically present.'},'warehouse');
  const sub=state.substitutions.at(-1);
  assert.equal(sub.state,'Proposed');
  assert.equal(JSON.stringify(state.lines.find(l=>l.id==='lin-000007')),before);
  assert(M.blockers(state,'ful-000005').some(b=>b.kind==='Substitution awaiting review'));
  refusal(()=>act('decideSubstitution',{id:sub.id,substitutionVersion:sub.version,decision:'Approved',engineering:false,commercial:true,reason:'Attempt an approval without the engineering position.'},'reviewer'),/engineering compatibility position/);
  refusal(()=>act('decideSubstitution',{id:sub.id,substitutionVersion:sub.version,decision:'Approved',engineering:true,commercial:true,reason:'Attempt an approval from the warehouse role.'},'warehouse'),/cannot perform this operation/);
  const r=act('decideSubstitution',{id:sub.id,substitutionVersion:sub.version,decision:'Rejected',engineering:true,commercial:true,reason:'Engineering has not confirmed compatibility for this installation; the accepted item stands.'},'reviewer');
  assert.match(r.receipt.description,/accepted item remains the only dispatchable scope/);
  assert.equal(JSON.stringify(state.lines.find(l=>l.id==='lin-000007')),before);
});

test('A prepared dispatch moves nothing and cannot exceed the uncommitted staged quantity',()=>{
  refusal(()=>act('prepareDispatch',{order:'ful-000001',lines:[{line:'lin-000001',qty:'7'}],address:'27 Demonstration Nursery Road, Sampletown VIC 3999, Australia',receivingPoint:'Pack Room 01',contact:'Priya Raman',contactRole:'Nursery manager',carrier:'Powerplants vehicle PPA-02',packages:'SYN-PPO-PKG-000010',plannedDate:'2026-09-17'}),/staged and not already committed/);
  act('prepareDispatch',{order:'ful-000001',lines:[{line:'lin-000001',qty:'6'}],address:'27 Demonstration Nursery Road, Sampletown VIC 3999, Australia',receivingPoint:'Pack Room 01 — hardstand loading bay',contact:'Priya Raman',contactRole:'Nursery manager',instructions:'Telephone thirty minutes before arrival.',carrier:'Collected by Powerplants vehicle PPA-02',packages:'SYN-PPO-PKG-000010',plannedDate:'2026-09-17'});
  const d=state.dispatches.at(-1);
  assert.equal(d.movementAt,null);
  assert.equal(d.erp.state,'Not submitted');
  assert.equal(M.show(t('lin-000001').dispatched),'0');
  assert.equal(M.show(t('lin-000001').planned),'6');
});

test('Issuing a pick list or packing document never dispatches goods',()=>{
  const d=state.dispatches.at(-1);
  act('issueDocuments',{id:d.id,kind:'Pick list'});
  act('issueDocuments',{id:d.id,kind:'Packing document'});
  const after=state.dispatches.find(x=>x.id===d.id);
  assert.equal(after.documents.length,2);
  assert.equal(after.movementAt,null);
  assert.equal(M.show(t('lin-000001').dispatched),'0');
  assert.equal(after.erp.state,'Not submitted');
});

test('Physical dispatch, source shipment and delivery are three separate records',()=>{
  const d=state.dispatches.at(-1);
  refusal(()=>act('recordShipmentOutcome',{id:d.id,outcome:'Confirmed',sourceRef:'SYN-ERP-SHP-006201',reason:'Attempt a source outcome before any movement.'}),/before recording a source shipment outcome/);
  refusal(()=>act('recordMovement',{id:d.id,dispatchVersion:state.dispatches.find(x=>x.id===d.id).version,confirm:false},'warehouse'),/Confirm that the listed lines/);
  act('recordMovement',{id:d.id,dispatchVersion:state.dispatches.find(x=>x.id===d.id).version,confirm:true},'warehouse');
  assert.equal(M.show(t('lin-000001').dispatched),'6');
  assert.equal(state.dispatches.find(x=>x.id===d.id).erp.state,'Not submitted');
  act('recordShipmentOutcome',{id:d.id,outcome:'Confirmed',sourceRef:'SYN-ERP-SHP-006201',reason:'The simulated source returned a confirmed shipment reference.'});
  assert.equal(state.dispatches.find(x=>x.id===d.id).erp.state,'Confirmed');
});

test('Delivery capture records received quantities against exact source lines and cannot exceed the consignment',()=>{
  const d=state.dispatches.at(-1);
  refusal(()=>act('captureDelivery',{dispatch:d.id,outcome:'Delivered',lines:[{line:'lin-000001',received:'7',damaged:'0',missing:'0'}],receiverName:'Priya Raman',receiverRole:'Nursery manager',notes:'An attempt to record more than was dispatched.'},'delivery'),/exceed the quantity dispatched/);
  act('captureDelivery',{dispatch:d.id,outcome:'Delivered',lines:[{line:'lin-000001',received:'6',damaged:'0',missing:'0'}],receivingPoint:'Pack Room 01 — hardstand loading bay',receiverName:'Priya Raman',receiverRole:'Nursery manager',notes:'Six toplights handed over at the Pack Room hardstand and checked against the packing document.',evidence:'SYN-PPO-EVI-000010'},'delivery');
  const del=state.deliveries.at(-1);
  assert.equal(del.receivingPoint,'Pack Room 01 — hardstand loading bay');
  assert.equal(del.timezone,'Australia/Melbourne');
  assert.equal(M.show(t('lin-000001').received),'6');
  assert.equal(M.show(t('lin-000001').outstanding),'4');
  assert.equal(del.acknowledgement,null);
});

test('An acknowledgement names its exact delivery and quantities and excludes wider acceptance',()=>{
  const del=state.deliveries.at(-1);
  refusal(()=>act('acknowledgeDelivery',{id:del.id,by:'Priya Raman',role:'Nursery manager',confirm:false},'delivery'),/covers only this delivery/);
  act('acknowledgeDelivery',{id:del.id,by:'Priya Raman',role:'Nursery manager',confirm:true},'delivery');
  const a=state.deliveries.find(x=>x.id===del.id).acknowledgement;
  assert.match(a.scope,new RegExp(del.ref));
  assert.equal(M.show(a.quantities[0].received),'6');
  assert.match(a.excludes,/not acceptance of installation quality/);
  assert.match(a.excludes,/approval to invoice or pay/);
});

test('The retained shortage is owned, and the same impact identity cannot create a second obligation',()=>{
  act('raiseException',{order:'ful-000001',line:'lin-000001',kind:'Insufficient or unavailable stock',
    scope:'4 EA of SYN-PPO-PRD-0004 remain outstanding after the first shipment.',owner:'Robin Ellis',
    nextAction:'Confirm the supplier promise and reserve the remaining quantity once a usable receipt is evidenced.',
    due:'2026-09-24',source:'SYN-PPO-AVL-000001',impactCommitments:'The confirmed commitment of 17 September is met for 6 EA only.'});
  const e=state.exceptions.at(-1);
  assert.equal(e.state,'Open');
  refusal(()=>act('raiseException',{order:'ful-000001',line:'lin-000001',kind:'Insufficient or unavailable stock',
    scope:'A duplicate exception for the same scope.',owner:'Robin Ellis',nextAction:'Duplicate.',due:'2026-09-24',source:'SYN-PPO-AVL-000001'}),/already exists for this scope/);
  act('followUp',{order:'ful-000001',line:'lin-000001',key:'exception:Insufficient or unavailable stock:ful-000001:lin-000001',
    title:'Tell Northbank Nursery about the remaining four toplights',detail:'Confirm the revised supply date and record the customer response.',owner:'Robin Ellis',due:'2026-09-17'});
  const count=state.followUps.length;
  const again=act('followUp',{order:'ful-000001',line:'lin-000001',key:'exception:Insufficient or unavailable stock:ful-000001:lin-000001',
    title:'A duplicate follow-up from another view',detail:'The same shortage seen from the stock view.',owner:'Robin Ellis',due:'2026-09-17'});
  assert.equal(state.followUps.length,count);
  assert.match(again.receipt.description,/no duplicate obligation was created/);
});

test('Later confirmed supply is a refreshed observation with its own receipt evidence',()=>{
  const before=M.usableEvidenceOf(state,'avl-000001');
  act('refreshObservation',{scenario:'newSupply'});
  const a=M.visibleAvailability(state,'coordinator','PPA-AU').find(x=>x.id==='avl-000001');
  assert.equal(M.show(a.usableEvidence),'10');
  assert(a.usableEvidence>before);
  assert.equal(M.show(a.remainingUsable),'4');
  assert.equal(a.incoming.length,0);
  assert(state.receipts.some(r=>r.ref==='SYN-PPO-RCT-000318-10'&&r.inspection==='Usable'));
  refusal(()=>act('refreshObservation',{scenario:'newSupply'}),/already reflected/);
});

test('The second shipment completes the line and quantity conservation holds in the declared unit',()=>{
  act('reserve',{line:'lin-000001',lineVersion:lv('lin-000001'),avLine:'avl-000001',qty:'4',reason:'Reserve the newly evidenced usable quantity for the second shipment.'});
  const res=state.reservations.at(-1);
  act('pick',{line:'lin-000001',lineVersion:lv('lin-000001'),reservation:res.id,picked:'4'},'warehouse');
  const p=state.picks.at(-1);
  act('stage',{id:p.id,pickVersion:p.version,staged:'4'},'warehouse');
  act('prepareDispatch',{order:'ful-000001',lines:[{line:'lin-000001',qty:'4'}],address:'27 Demonstration Nursery Road, Sampletown VIC 3999, Australia',receivingPoint:'Pack Room 01 — hardstand loading bay',contact:'Priya Raman',contactRole:'Nursery manager',carrier:'Collected by Powerplants vehicle PPA-02',packages:'SYN-PPO-PKG-000011',plannedDate:'2026-09-24'});
  const d=state.dispatches.at(-1);
  act('recordMovement',{id:d.id,dispatchVersion:state.dispatches.find(x=>x.id===d.id).version,confirm:true},'warehouse');
  act('captureDelivery',{dispatch:d.id,outcome:'Delivered',lines:[{line:'lin-000001',received:'4',damaged:'0',missing:'0'}],receivingPoint:'Pack Room 01 — hardstand loading bay',receiverName:'Priya Raman',receiverRole:'Nursery manager',notes:'The remaining four toplights were handed over and checked against the packing document.',evidence:'SYN-PPO-EVI-000011'},'delivery');
  const x=t('lin-000001');
  assert.equal(M.show(x.ordered),'10');
  assert.equal(M.show(x.received),'10');
  assert.equal(M.show(x.outstanding),'0');
  assert.equal(M.show(x.inTransit),'0');
  assert.equal(x.ordered,x.received+x.outstanding+x.cancelled);
  assert.equal(state.deliveries.filter(d=>!d.superseded&&d.lines.some(l=>l.line==='lin-000001')).length,2);
  assert.equal(q(x.ordered,x.unit),'10 EA');
});

test('The original shortage history and both shipments remain visible after completion',()=>{
  const o=M.visibleOrders(state,'coordinator','PPA-AU').find(x=>x.id==='ful-000001');
  assert.equal(o.exceptions.length,1);
  assert.match(o.exceptions[0].scope,/4 EA of SYN-PPO-PRD-0004 remain outstanding/);
  assert.equal(o.deliveries.filter(d=>!d.superseded).length,2);
  assert.equal(o.dispatches.length,2);
  assert(o.followUps.length>=1);
});

test('A correction supersedes its predecessor instead of overwriting or double counting it',()=>{
  const del=state.deliveries.find(d=>d.id==='del-000001');
  assert.equal(M.show(M.totals(state,'lin-000008').received),'5');
  act('correctDelivery',{id:del.id,deliveryVersion:del.version,reason:'The customer recount confirmed six sets were presented and one was damaged in transit.',
    lines:[{line:'lin-000008',received:'5',damaged:'1',missing:'0'}]});
  const successor=state.deliveries.at(-1);
  const original=state.deliveries.find(d=>d.id===del.id);
  assert.equal(original.superseded,true);
  assert.equal(original.author,'Sam Patel');
  assert.equal(original.at,'2026-09-15T11:05:00+10:00');
  assert.equal(successor.predecessor,del.id);
  assert.match(successor.correctionReason,/customer recount/);
  assert.equal(M.show(M.totals(state,'lin-000008').received),'5');
  assert.equal(M.show(M.totals(state,'lin-000008').damaged),'1');
  assert.equal(M.show(M.totals(state,'lin-000008').outstanding),'1');
});

test('A failed delivery attempt records no received quantity and is retained',()=>{
  const d=state.dispatches.find(x=>x.id==='dsp-000001');
  const before=M.show(M.totals(state,'lin-000008').received);
  refusal(()=>act('captureDelivery',{dispatch:d.id,outcome:'Delivered',lines:[{line:'lin-000008',received:'0',damaged:'0',missing:'0'}],receiverName:'Jordan Lee',receiverRole:'Field production manager',notes:'An attempt with no quantity and a delivered outcome.'},'delivery'),/Record at least one quantity/);
  act('captureDelivery',{dispatch:d.id,outcome:'Failed attempt',lines:[],receiverName:'',receiverRole:'',notes:'The eastern gate was locked and no receiving contact was available.',findingNote:'The eastern gate was locked; the consignment returned to the store.'},'delivery');
  const attempt=state.deliveries.at(-1);
  assert.equal(attempt.outcome,'Failed attempt');
  assert.equal(attempt.receivingPoint,'Not reached');
  assert.equal(attempt.acknowledgement,null);
  assert.equal(M.show(M.totals(state,'lin-000008').received),before);
  refusal(()=>act('acknowledgeDelivery',{id:attempt.id,by:'Jordan Lee',role:'Field production manager',confirm:true},'delivery'),/cannot carry a delivery acknowledgement/);
});

test('An unknown source outcome blocks further effect until the original operation is reconciled',()=>{
  act('reserve',{line:'lin-000005',lineVersion:lv('lin-000005'),avLine:'avl-000004',qty:'1',reason:'Submit a reservation whose response is lost.',simulate:'unknown'});
  const res=state.reservations.at(-1);
  assert.equal(res.state,'Unknown');
  assert.equal(res.sourceRef,null);
  assert(M.blockers(state,'ful-000003').some(b=>b.kind==='Unknown source outcome'));
  refusal(()=>act('reserve',{line:'lin-000005',lineVersion:lv('lin-000005'),avLine:'avl-000004',qty:'1',reason:'Attempt another reservation while the original outcome is unknown.'}),/Reconcile the original operation/);
  act('reconcileUnknown',{id:res.id,outcome:'Still unknown',reason:'The source was queried and still returns no determinate result.',sourceRef:'n/a'});
  assert.equal(state.reservations.find(r=>r.id===res.id).state,'Unknown');
  act('reconcileUnknown',{id:res.id,outcome:'Not found after evidenced search',sourceRef:'SYN-PPO-SRCH-000021 evidenced search of the allocation register',reason:'An evidenced search of the allocation register found no matching reservation.'});
  const done=state.reservations.find(r=>r.id===res.id);
  assert.equal(done.state,'Failed');
  assert.match(done.failure,/Evidenced absence/);
});

test('An identical operation identity replays once; different content under the same identity is refused',()=>{
  const cmd={op:'of-recovery-test',expectedVersion:state.version,type:'issueDocuments',payload:{id:'dsp-000001',kind:'Delivery document'}};
  const first=M.command(state,cmd,'coordinator','PPA-AU');
  state=first.state;
  const again=M.command(state,cmd,'coordinator','PPA-AU');
  assert.equal(again.recovered,true);
  assert.equal(JSON.stringify(again.state),JSON.stringify(state));
  assert.equal(again.receipt.version,first.receipt.version);
  assert.throws(()=>M.command(state,{...cmd,payload:{id:'dsp-000001',kind:'Pick list'}},'coordinator','PPA-AU'),/different content/);
});

test('A stale session version or a stale source snapshot retains the original state',()=>{
  refusal(()=>M.command(state,{op:'of-stale-session',expectedVersion:state.version-1,type:'issueDocuments',payload:{id:'dsp-000001',kind:'Pick list'}},'coordinator','PPA-AU'),/session changed/);
  refusal(()=>act('reserve',{line:'lin-000006',lineVersion:lv('lin-000006')-1,avLine:'avl-000006',qty:'1',reason:'An attempt using a stale line snapshot.'}),/order line changed/);
});

test('Changing an expected date does not replace the confirmed commitment',()=>{
  const before=M.commitmentsOf(state,'lin-000006');
  act('expectedCommitment',{line:'lin-000006',lineVersion:lv('lin-000006'),date:'2026-09-25',reason:'The Sydney observation is still partial, so the expected date moves while the commitment stands.'});
  const after=M.commitmentsOf(state,'lin-000006');
  assert.equal(after.expected.date,'2026-09-25');
  assert.equal(after.expected.version,2);
  assert.equal(after.confirmed.date,before.confirmed.date);
  assert.equal(after.confirmed.version,1);
  assert.equal(after.requested.date,before.requested.date);
});

test('Changing a confirmed commitment retains the earlier version, needs a review role and reschedules nothing',()=>{
  refusal(()=>act('confirmedCommitment',{line:'lin-000007',lineVersion:lv('lin-000007'),date:'2026-10-08',reason:'Attempt a confirmed change without the review grant.',customerFollowUp:true,acknowledgeImpact:true}),/cannot perform this operation/);
  refusal(()=>act('confirmedCommitment',{line:'lin-000007',lineVersion:lv('lin-000007'),date:'2026-10-08',reason:'Attempt a confirmed change without an accountable follow-up.',customerFollowUp:false,acknowledgeImpact:true},'reviewer'),/accountable customer follow-up/);
  const projectsBefore=JSON.stringify(state.lines.find(l=>l.id==='lin-000007').demandLink);
  act('confirmedCommitment',{line:'lin-000007',lineVersion:lv('lin-000007'),date:'2026-10-08',reason:'No compatible supply is evidenced before the original date; the customer commitment moves.',customerFollowUp:true,acknowledgeImpact:true},'reviewer');
  const c=M.commitmentsOf(state,'lin-000007');
  assert.equal(c.confirmed.date,'2026-10-08');
  assert.equal(c.confirmed.version,2);
  assert(c.history.some(x=>x.kind==='Confirmed'&&x.date==='2026-09-24'&&x.version===1));
  const e=state.exceptions.find(x=>x.kind==='Changed customer commitment');
  assert(e);
  assert.match(e.impact.projects[0],/project plan is not amended/);
  assert.equal(JSON.stringify(state.lines.find(l=>l.id==='lin-000007').demandLink),projectsBefore);
});

test('Recovery matters are routed, not rebuilt, and retain their resolution evidence here',()=>{
  const e=state.exceptions.find(x=>x.id==='exc-000001');
  act('linkRecovery',{id:e.id,target:'returns',ref:'SYN-PPO-RMA-000012'},'reviewer');
  const routed=state.exceptions.find(x=>x.id===e.id);
  assert.equal(routed.linked.target,'returns');
  assert.match(routed.linked.note,/decision and outcome remain in that workflow/);
  act('resolveException',{id:e.id,exceptionVersion:routed.version,state:'In review',note:'The supplier claim is lodged and the customer is awaiting a replacement decision.',evidence:'SYN-PPO-RMA-000012'},'reviewer');
  assert.equal(state.exceptions.find(x=>x.id===e.id).state,'In review');
  assert.equal(state.exceptions.find(x=>x.id===e.id).resolution.length,1);
});

test('Quantity parsing rejects invalid precision, negatives and non-numeric entries',()=>{
  for(const bad of ['-1','1.2345','abc','','1,5']){
    assert.throws(()=>M.qty(bad),/at most three decimal places/);
  }
  assert.equal(M.show(M.qty('2.500')),'2.5');
  assert.equal(M.show(M.qty('3')),'3');
  assert.equal(M.amount(M.qty('1.25'),'SET'),'1.25 SET');
});

test('A malformed saved session is refused and a valid one round-trips without loss',()=>{
  const bad=copy(state);bad.lines[0].confirmed='not-a-date';
  assert.throws(()=>M.validate(bad),/real calendar date/);
  const dup=copy(state);dup.orders.push(copy(dup.orders[0]));
  assert.throws(()=>M.validate(dup),/Duplicate orders identity/);
  const over=copy(state);over.reservations.push({...copy(over.reservations[0]),id:'res-bogus',qty:M.qty('99')});
  assert.throws(()=>M.validate(over),/exceed/);
  assert.equal(JSON.stringify(M.validate(copy(state))),JSON.stringify(state));
});

test('Every recorded command produced exactly one receipt and one history entry',()=>{
  assert.equal(state.receiptsLedger.length,state.history.length);
  assert.equal(new Set(state.receiptsLedger.map(r=>r.op)).size,state.receiptsLedger.length);
  assert.equal(state.receiptsLedger.at(-1).version,state.version);
});

const html=path.join(root,'docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace.html');
console.log(JSON.stringify({
  design:'PPO Order Fulfilment & Customer Delivery r01',
  html_sha256:createHash('sha256').update(fs.readFileSync(html)).digest('hex'),
  model_sha256:createHash('sha256').update(fs.readFileSync(path.join(root,'docs/design/order-fulfilment/model.js'))).digest('hex'),
  groups:results.length,final_session_version:state.version,results
},null,2));
