'use strict';
/* Synthetic CR-01 review data. Stable IDs, exact revisions and a fixed clock. */
globalThis.PPODealFixtures = (() => {
  const now = '2026-09-17T00:00:00Z';
  const at = days => new Date(Date.parse(now) + days * 86400000).toISOString();
  const date = days => at(days).slice(0, 10);
  const users = [
    {id:'kate', name:'Kate Morgan', initials:'KM', role:'Sales owner'},
    {id:'jordan', name:'Jordan Price', initials:'JP', role:'Sales owner'},
    {id:'alex', name:'Alex Chen', initials:'AC', role:'Estimator'},
    {id:'riley', name:'Riley Brooks', initials:'RB', role:'Read only'}
  ];
  const stages = [
    {id:'discovery',name:'Discovery',probability:10,rotting:true,days:14,criteria:'Record the customer need and a named contact or contact-identification activity.'},
    {id:'scoping',name:'Scoping',probability:25,rotting:true,days:20,criteria:'Confirm scope locations, inclusions, exclusions and the questions the estimator must resolve.'},
    {id:'quoting',name:'Quoting',probability:50,rotting:true,days:16,criteria:'Review the exact estimate and prepare a controlled customer quotation.'},
    {id:'negotiation',name:'Negotiation',probability:70,rotting:true,days:14,criteria:'Resolve customer questions against the exact quotation revision and selected options.'},
    {id:'closing',name:'Closing',probability:90,rotting:true,days:10,criteria:'Record acceptance or order evidence and identify the next receiving responsibility.'}
  ];
  const seeds = [
    ['berry','Berry fertigation expansion','Northbank Berry Co.','Bundaberg production site','scoping',18500000,'kate',21,-24],
    ['climate','Greenhouse climate upgrade','Willowbank Horticulture','Glasshouse precinct','negotiation',12750050,'kate',14,-6],
    ['dispatch','Automated dispatch line','Greenhaven Nursery','Dispatch and packing site','closing',8950000,'kate',7,-3],
    ['irrigation','Irrigation system renewal','Coastal Plant Nursery','Site to be confirmed','discovery',null,'jordan',null,-18],
    ['monitoring','Propagation monitoring package','Willowbank Horticulture','Propagation site','quoting',4280000,'kate',35,-5],
    ['heating','Heating plant replacement','Ridgeview Growers','Production glasshouse','closing',21400000,'kate',-4,-7]
  ];
  const scope = {
    need:'Expand fertigation capacity for the next blueberry planting, with dependable dosing and clear irrigation records.',
    inclusions:'Fertigation unit, control integration, two irrigation blocks, commissioning and operator training.',
    exclusions:'Civil works, incoming electrical supply and customer pipework outside the agreed connection points.',
    assumptions:'Existing supply pressure and power capacity need verification before final selection.',
    questions:'Confirm water analysis, peak irrigation demand and the proposed pump connection.',
    crop:'Blueberries · substrate production',window:'Commission before the next planting window.',requestedDate:date(70)
  };
  const deals = seeds.map((r,i) => ({
    id:r[0],ref:'SYN-PPO-OP-'+String(i+1).padStart(6,'0'),title:r[1],organisation:r[2],site:r[3],
    organisationId:['northbank','willowbank','greenhaven','coastal','willowbank','ridgeview'][i],
    siteId:'SYN-SITE-'+(i+1),company:'Powerplants Australia · synthetic',owner:r[6],originalOwner:r[6],
    stage:r[4],pipeline:'sales',outcome:'Open',version:1,value:r[5],close:r[7]===null?'':date(r[7]),
    created:at(-54-i*3),stageEntered:at(-12-i),touched:at(r[8]),forecast:i===2?'Commit':'Pipeline',
    source:'Manual qualification',sourceRef:'SYN-LEAD-'+(101+i),contactUnknown:i===3?'Decision-maker being identified.':'',
    scope:{...scope,...(i===0?{}:{need:['','Replace ageing climate controls while retaining reliable day-to-day operation.','Improve dispatch throughput and reduce manual handling.','Understand the nursery’s irrigation renewal requirements.','Add reliable monitoring across the propagation areas.','Replace the heating plant before the winter production period.'][i],crop:i===4?'Young plants · propagation':'Nursery and protected cropping',questions:i===4?'Confirm sensor positions and radio coverage.':'Confirm the final technical and commercial requirements.'})},
    locations:i===3?[]:[{id:'area-'+i+'-1',name:i===0?'Block A · substrate berries':'Growing area 1',type:i===0?'Irrigation block':'Greenhouse',selected:true},{id:'area-'+i+'-2',name:i===0?'Block B · covered berries':'Growing area 2',type:i===0?'Tunnel':'Propagation house',selected:i===0}],
    contacts:i===3?[]:[{id:'person-'+i+'-1',name:'Jamie Ellis',role:'Grower / project lead',email:'jamie.'+i+'@example.invalid',phone:'+61 7 0000 0000',primary:true,engaged:true},{id:'person-'+i+'-2',name:'Sam Harper',role:'Technical / site contact',email:'sam.'+i+'@example.invalid',phone:'Not recorded',primary:false,engaged:true}],
    activities:i===3?[]:[{id:'act-'+i+'-1',title:i===0?'Confirm water analysis and peak demand':i===2?'Confirm purchase order and receiving route':'Review customer requirements',type:'Call',owner:'kate',due:date(i===0?-2:2),time:'',status:'Open',outcome:'',designated:true},{id:'act-'+i+'-2',title:'Initial requirements discussion',type:'Meeting',owner:r[6],due:date(-18),time:'09:00',status:'Complete',outcome:'Customer objective and preliminary scope recorded.',completedAt:at(-18),designated:false}],
    tasks:[{id:'task-'+i+'-1',title:i===0?'Obtain pump curve and water analysis':'Review technical scope',description:'Link the source evidence and identify any unresolved requirements.',owner:'kate',due:date(3),priority:'Normal',status:'In progress',blocked:'',milestone:'Scope review',completedAt:null},{id:'task-'+i+'-2',title:'Confirm installation access',description:'Review the relevant site access record.',owner:'jordan',due:date(7),priority:'Normal',status:'Open',blocked:'',milestone:'Handover',completedAt:null}],
    waiting:i===0?{party:'Customer',note:'Water analysis is required to confirm treatment and dosing requirements.'}:null,
    intake:{id:'SYN-INT-'+(301+i),revision:1,status:i===4?'Returned':i===0?'Draft':i===3?'Not prepared':'Accepted for estimating',owner:'alex',note:i===4?'Confirm the sensor layout before resubmission.':'Scope and supporting evidence need a receiving review.',due:date(5),basis:null,history:[]},
    estimates:i===3?[]:[{id:'estimate-'+i,ref:'SYN-EST-'+(2401+i),option:'A',revision:3,title:'Preferred solution',value:r[5],status:i===0?'Draft · scope review':'Reviewed basis',owner:'alex'},{id:'estimate-'+i+'-b',ref:'SYN-EST-'+(2401+i)+'-B',option:'B',revision:1,title:'Alternative configuration',value:r[5]===null?null:r[5]+1250000,status:'Draft alternative',owner:'alex'}],
    quotes:i===0||i===3?[]:[{id:'quote-'+i+'-r2',ref:'SYN-QUO-'+(2401+i),revision:2,status:'Issued',value:r[5],option:'A',approved:true,issued:date(-12),distribution:'Sent · synthetic evidence',response:i===2||i===5?'Accepted':'Awaiting response',validUntil:date(14),accepted:i===2||i===5?{at:at(-2),by:'Jamie Ellis',option:'A',evidence:'SYN-PO-'+(8001+i)}:null},{id:'quote-'+i+'-r3',ref:'SYN-QUO-'+(2401+i),revision:3,status:'Draft',value:r[5]===null?null:r[5]+240000,option:'A',approved:false,issued:null,distribution:'Not sent',response:'No response basis',validUntil:'',accepted:null}],
    messages:[{id:'msg-'+i,kind:'Filed email',subject:'Requirements for '+r[1].toLowerCase(),from:'Jamie Ellis',to:'Kate Morgan',body:'Please confirm the proposed scope, timing and the information you need from us before preparing the quotation.',at:at(-3),filed:true,source:'Synthetic email evidence',documentIds:[]}],
    documents:[{id:'doc-'+i+'-brief',title:'Customer brief',name:'SYN-Brief-'+(i+1)+'.txt',category:'Brief',revision:1,status:'Working',source:'Sales',audience:'Internal',at:at(-8),body:'SYNTHETIC CUSTOMER BRIEF\n\n'+r[1]+'\n'+r[2]+'\n\nCustomer objective and preliminary scope. Review current scope and unresolved questions before submission.'},{id:'doc-'+i+'-survey',title:'Site survey observations',name:'SYN-Survey-'+(i+1)+'.txt',category:'Survey',revision:2,status:'Reviewed',source:'Site Survey & As-Found',audience:'Internal',at:at(-6),body:'SYNTHETIC SURVEY EVIDENCE\n\nSupply pressure and electrical capacity require confirmation. Observations apply only to the selected site and growing areas.'},{id:'doc-'+i+'-survey-old',title:'Site survey observations',name:'SYN-Survey-'+(i+1)+'-r01.txt',category:'Survey',revision:1,status:'Superseded',source:'Site Survey & As-Found',audience:'Internal',at:at(-16),body:'SYNTHETIC HISTORICAL OBSERVATIONS\n\nInitial visit. Retained predecessor; not the current survey basis.'}],
    delivery:{required:date(70),plannedOrder:date(20),lead:28,transit:4,installation:5,evidence:'SYN-SUP-'+(901+i),confirmed:date(-4)},
    handover:null,history:[{id:'event-'+i,kind:'Created',at:at(-54-i*3),by:r[6],text:'Opportunity created from a qualified customer enquiry.',version:1}]
  }));
  for(const d of deals){
    for(const q of d.quotes)d.documents.push({id:q.id,title:q.ref+' · quotation',name:q.ref+'-r0'+q.revision+'.txt',category:'Quotation',revision:q.revision,status:q.status,source:'Estimating',audience:q.status==='Issued'?'Customer issue':'Internal draft',at:at(q.status==='Issued'?-12:-1),body:'SYNTHETIC QUOTATION\n\n'+q.ref+' / revision '+q.revision+' / option '+q.option+'\nStatus: '+q.status+'\n\nThis text is review evidence, not a customer quotation output. The exact accepted basis remains with the owning quotation module.'});
    if(d.intake.status==='Accepted for estimating')d.intake.basis={dealVersion:1,need:d.scope.need,scope:structuredClone(d.scope),locations:d.locations.filter(x=>x.selected).map(x=>x.id),documents:d.documents.filter(x=>x.category!=='Quotation').map(x=>({id:x.id,revision:x.revision})),submittedAt:at(-10)};
    if(d.intake.status==='Returned')d.intake.history.push({status:'Submitted',revision:1,at:at(-6),by:'kate',note:'Initial brief submitted.'},{status:'Returned',revision:1,at:at(-5),by:'alex',note:d.intake.note});
  }
  const won=deals.find(d=>d.id==='heating');won.outcome='Won';won.version=2;won.handover={status:'Handover due',closingOwner:'kate',outcomeVersion:2,at:at(-1),evidence:'SYN-PO-8006',route:'',receiver:'',note:'',basis:{quoteId:'quote-5-r2',revision:2,option:'A',value:21400000},prepared:[]};won.history.unshift({id:'event-won',kind:'Outcome',at:at(-1),by:'kate',text:'Recorded Won. Receiving route and owner remain to be confirmed.',version:2});
  return {now,users,stages,deals};
})();
