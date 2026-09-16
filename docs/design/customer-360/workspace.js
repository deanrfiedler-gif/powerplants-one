/* CS-01 Customer 360 — standalone interactive design.
   Coordinated view over related records. Every originating module keeps its own
   workflow and decisions. No ERP edit, release, cancellation, payment or
   fulfilment action exists here, and no server permission is enforced. */
(() => {
'use strict';

const M=window.Customer360Model;
const ICONS=JSON.parse(document.getElementById('workspace-icons').textContent);
const STORAGE_KEY='ppo-customer-360-r01';
const STORAGE_VERSION=1;

/* ------------------------------------------------------------- utilities */

const esc=value=>String(value===null||value===undefined?'':value)
 .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]||ICONS.info}</svg>`;
const q=selector=>document.querySelector(selector);
const unknown=label=>`<span class="unknown">${esc(label||'Not supplied')}</span>`;
const date=iso=>M.formatDate(iso)||'Not supplied';
const dateTime=iso=>M.formatDateTime(iso)||'Not supplied';
const money=(amount,currency)=>M.money(amount,currency)||'Not supplied';

/* ------------------------------------------------------------- app state */

const VIEWS=[
 {id:'overview',label:'Overview',icon:'overview'},
 {id:'deals',label:'Deals & quotations',icon:'estimate',commercial:true},
 {id:'orders',label:'Sales orders',icon:'sales',commercial:true},
 {id:'cases',label:'Cases & service',icon:'service'},
 {id:'projects',label:'Projects',icon:'projects',commercial:true},
 {id:'sites',label:'Sites & equipment',icon:'sites'},
 {id:'accounts',label:'Accounts',icon:'finance',commercial:true,finance:true},
 {id:'activity',label:'Activity & documents',icon:'documents'}
];

const EMPTY_FILTERS={site:'',area:'',equipment:'',status:'',from:'',to:'',owner:'',company:'',account:''};

const state={
 org:M.ORG.willowbank,
 role:'coordinator',
 view:'overview',
 filters:{...EMPTY_FILTERS},
 search:'',
 selected:null,
 returnStack:[],
 notes:{},
 storage:'unknown',
 refreshAttempts:0
};

const role=()=>M.byId(M.roles,state.role);
const org=()=>M.byId(M.organisations,state.org);
const canFinance=()=>role().finance===true;
const canPrivate=()=>role().privateNotes===true;
const operationalOnly=()=>role().operationalOnly===true;
const availableViews=()=>VIEWS.filter(v=>{
 if(operationalOnly()&&v.commercial) return false;
 if(v.finance&&!canFinance()) return v.id==='accounts'&&!operationalOnly();
 return true;
});

/* ------------------------------------------------------- local persistence */

/* Only two things are ever saved: an internal follow-up note and nothing else.
   Browser storage belongs to one browser on one device. It is not a server record,
   it is not shared, and it can be absent or refused entirely. */
function readStorage(){
 let raw=null;
 try{raw=window.localStorage.getItem(STORAGE_KEY);}
 catch(error){state.storage='session-only';return;}
 if(raw===null){state.storage='ok';return;}
 let parsed=null;
 try{parsed=JSON.parse(raw);}catch(error){state.storage='invalid';return;}
 if(!parsed||typeof parsed!=='object'||parsed.version!==STORAGE_VERSION||typeof parsed.notes!=='object'||parsed.notes===null){
  state.storage='invalid';return;
 }
 const notes={};
 for(const [key,list] of Object.entries(parsed.notes)){
  if(!Array.isArray(list)) {state.storage='invalid';return;}
  notes[key]=list.filter(n=>n&&typeof n.text==='string'&&typeof n.at==='string').map(n=>({id:String(n.id||''),text:String(n.text),author:String(n.author||''),at:String(n.at)}));
 }
 state.notes=notes;
 state.storage='ok';
}
function writeStorage(){
 if(state.storage==='invalid') return {saved:false,reason:'retained'};
 try{
  window.localStorage.setItem(STORAGE_KEY,JSON.stringify({version:STORAGE_VERSION,notes:state.notes}));
  state.storage='ok';
  return {saved:true};
 }catch(error){
  state.storage='session-only';
  return {saved:false,reason:'storage'};
 }
}

function storageNotice(){
 const element=q('#storage-notice');
 if(state.storage==='invalid'){
  element.hidden=false;
  element.innerHTML=`<strong>Retained notes could not be validated.</strong> The existing stored bytes have been left untouched and are not being overwritten. Notes added now stay in this tab only.`;
  return;
 }
 if(state.storage==='session-only'){
  element.hidden=false;
  element.innerHTML=`<strong>Browser storage is unavailable in this session.</strong> Notes you add are kept in this tab and may not survive a reload. Nothing is sent anywhere.`;
  return;
 }
 element.hidden=true;
 element.innerHTML='';
}

/* --------------------------------------------------------- record scoping */

function siteOf(kind,id){
 switch(kind){
  case 'order':{const o=M.byId(M.orders,id);return o?o.deliverySite:null;}
  case 'quotation':{const quote=M.byId(M.quotations,id);const opp=quote&&quote.opportunity?M.byId(M.opportunities,quote.opportunity):null;return opp?opp.site:null;}
  case 'opportunity':{const opp=M.byId(M.opportunities,id);return opp?opp.site:null;}
  case 'case':{const c=M.byId(M.cases,id);return c?c.site:null;}
  case 'project':{const p=M.byId(M.projects,id);return p?p.site:null;}
  case 'agreement':{const a=M.byId(M.agreements,id);return a?a.site:null;}
  case 'warranty':{const w=M.byId(M.warrantyCases,id);return w?w.site:null;}
  case 'finance':return null;
  case 'mapping':return null;
  default:return null;
 }
}
function areasOf(kind,id){
 switch(kind){
  case 'order':{const o=M.byId(M.orders,id);return o?o.deliveryAreas:[];}
  case 'quotation':{const quote=M.byId(M.quotations,id);const opp=quote&&quote.opportunity?M.byId(M.opportunities,quote.opportunity):null;return opp?opp.areas:[];}
  case 'opportunity':{const opp=M.byId(M.opportunities,id);return opp?opp.areas:[];}
  case 'case':{const c=M.byId(M.cases,id);return c?c.areas:[];}
  case 'project':{const p=M.byId(M.projects,id);return p?p.areas:[];}
  default:return [];
 }
}
function equipmentOf(kind,id){
 if(kind==='case'){const c=M.byId(M.cases,id);return c&&c.asset?[c.asset]:[];}
 if(kind==='warranty'){const w=M.byId(M.warrantyCases,id);return w&&w.asset?[w.asset]:[];}
 return [];
}

const orgSites=()=>M.sites.filter(s=>s.org===state.org);
const orgAreas=()=>M.areas.filter(a=>orgSites().some(s=>s.id===a.site));
const orgAssets=()=>M.assets.filter(a=>a.org===state.org);
const orgAccounts=()=>M.accountsForOrg(state.org);
const orgCompanies=()=>M.erpCompanies.filter(c=>orgAccounts().some(a=>a.company===c.id));

/* A filter only applies where an explicit relationship exists. A record with no
   relationship of that kind is reported as unassigned rather than silently dropped. */
function matchesLocation(kind,id){
 const {site,area,equipment}=state.filters;
 if(site){
  const recordSite=siteOf(kind,id);
  if(recordSite!==site) return false;
 }
 if(area){
  const list=areasOf(kind,id);
  if(!list||!list.includes(area)) return false;
 }
 if(equipment){
  const list=equipmentOf(kind,id);
  if(!list||!list.includes(equipment)) return false;
 }
 return true;
}
function unassignedFor(kind,id){
 if(!state.filters.site) return false;
 return siteOf(kind,id)===null;
}
function matchesDate(iso){
 const {from,to}=state.filters;
 if(!iso) return !from&&!to;
 const day=iso.slice(0,10);
 if(from&&day<from) return false;
 if(to&&day>to) return false;
 return true;
}
function matchesSearch(haystack){
 if(!state.search.trim()) return true;
 return haystack.toLowerCase().includes(state.search.trim().toLowerCase());
}

/* -------------------------------------------------------- record selectors */

function visibleFollowUps(){
 return M.followUps.filter(f=>f.org===state.org)
  .filter(f=>!(f.finance&&!canFinance()))
  .filter(f=>!(operationalOnly()&&['quotation','order','finance','mapping','project'].includes(f.recordKind)))
  .filter(f=>matchesLocation(f.recordKind,f.record))
  .sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0);
}
function visibleQuotations(){
 return M.quotations.filter(quote=>quote.org===state.org)
  .filter(quote=>matchesLocation('quotation',quote.id))
  .filter(quote=>!state.filters.status||quote.state===state.filters.status)
  .filter(quote=>!state.filters.owner||quote.owner===state.filters.owner)
  .filter(quote=>matchesDate(quote.issued))
  .filter(quote=>matchesSearch([quote.displayRef||quote.id,quote.revision,quote.state,quote.owner,quote.customerResponse].join(' ')));
}
function visibleOpportunities(){
 return M.opportunities.filter(opp=>opp.org===state.org)
  .filter(opp=>matchesLocation('opportunity',opp.id))
  .filter(opp=>!state.filters.owner||opp.owner===state.filters.owner)
  .filter(opp=>matchesDate(opp.opened))
  .filter(opp=>matchesSearch([opp.id,opp.title,opp.stage,opp.owner].join(' ')));
}
function visibleOrders(){
 const accounts=orgAccounts().map(a=>a.id);
 return M.orders.filter(order=>order.org===state.org&&accounts.includes(order.account))
  .filter(order=>matchesLocation('order',order.id))
  .filter(order=>!state.filters.status||order.sourceStatus===state.filters.status)
  .filter(order=>!state.filters.company||order.company===state.filters.company)
  .filter(order=>!state.filters.account||order.account===state.filters.account)
  .filter(order=>matchesDate(order.orderDate))
  .filter(order=>matchesSearch([order.id,order.customerPo,order.sourceStatus,order.orderType,
   ...order.lines.map(line=>`${line.description} ${line.product||''}`)].join(' ')));
}
function visibleUnresolvedOrders(){
 return M.unresolvedOrders()
  .filter(order=>!state.filters.company||order.company===state.filters.company)
  .filter(order=>matchesDate(order.orderDate))
  .filter(order=>matchesSearch([order.id,order.customerPo,order.sourceStatus].join(' ')));
}
function visibleCases(){
 return M.cases.filter(item=>item.org===state.org)
  .filter(item=>matchesLocation('case',item.id))
  .filter(item=>!state.filters.status||item.state===state.filters.status)
  .filter(item=>!state.filters.owner||item.owner===state.filters.owner)
  .filter(item=>matchesDate(item.raised))
  .filter(item=>matchesSearch([item.id,item.title,item.state,item.owner,item.reportedSymptom,item.verifiedFinding||''].join(' ')));
}
function visibleProjects(){
 return M.projects.filter(project=>project.org===state.org)
  .filter(project=>matchesLocation('project',project.id))
  .filter(project=>!state.filters.status||project.state===state.filters.status)
  .filter(project=>!state.filters.owner||project.owner===state.filters.owner)
  .filter(project=>matchesDate(project.started))
  .filter(project=>matchesSearch([project.id,project.title,project.state,project.owner,project.nextMilestone].join(' ')));
}
function visibleFinance(){
 if(!canFinance()) return [];
 const accounts=orgAccounts().map(a=>a.id);
 return M.financeRecords.filter(record=>record.org===state.org&&accounts.includes(record.account))
  .filter(record=>!state.filters.company||record.company===state.filters.company)
  .filter(record=>!state.filters.account||record.account===state.filters.account)
  .filter(record=>!state.filters.status||record.sourceStatus===state.filters.status)
  .filter(record=>matchesDate(record.date))
  .filter(record=>matchesSearch([record.id,record.type,record.sourceStatus,record.order||''].join(' ')));
}
function visibleActivities(){
 return M.activities.filter(entry=>entry.org===state.org)
  .filter(entry=>canPrivate()||!entry.private)
  .filter(entry=>!(operationalOnly()&&['Quotation','Opportunity'].some(word=>(entry.recordLabel||'').includes(word))))
  .filter(entry=>!state.filters.site||entry.site===state.filters.site)
  .filter(entry=>!state.filters.status||entry.kind===state.filters.status)
  .filter(entry=>!state.filters.owner||entry.author===state.filters.owner)
  .filter(entry=>matchesDate(entry.when))
  .filter(entry=>matchesSearch([entry.subject,entry.kind,entry.author,entry.summary,entry.recordLabel||''].join(' ')))
  .sort((a,b)=>a.when<b.when?1:-1);
}

/* -------------------------------------------------------------- rendering */

function pill(tone,label,iconName){
 return `<span class="pill ${tone}">${iconName?icon(iconName):''}${esc(label)}</span>`;
}
function statePill(value){
 const map={
  'Open':'info','Completed':'success','Cancelled':'neutral','Accepted':'success','Sent':'info','Issued':'info',
  'Declined':'neutral','Superseded':'neutral','Draft':'neutral','Reviewed':'info','Won':'success','Quoted':'info',
  'Qualified':'neutral','New':'warning','In progress':'info','Resolved':'success','Active':'success',
  'In delivery':'info','Scheduled':'info','Unapplied':'warning','Held':'warning','Disputed':'danger','Closed':'neutral'
 };
 return pill(map[value]||'neutral',value);
}

function sourceStrip(observation){
 if(!observation) return '';
 const tone=M.observationState(observation);
 const completeness=observation.outcome==='Complete'
  ? `Complete — ${observation.pagesReturned} of ${observation.pagesDeclared} declared page(s), ${observation.rows} row(s)`
  : observation.outcome==='Incomplete'
   ? `Incomplete — ${observation.pagesReturned} of ${observation.pagesDeclared} declared page(s) returned`
   : observation.outcome==='NoRecords'
    ? 'Complete — the source returned no records for this scope'
    : 'Failed — no rows were returned by the last attempt';
 return `<dl class="source-strip">
  <div><dt>Source authority</dt><dd>${esc(M.erpConnection.provider)} · ${esc(M.erpConnection.mode)}</dd></div>
  <div><dt>Company / entity</dt><dd>${esc((M.byId(M.erpCompanies,observation.company)||{}).name||'Not supplied')}</dd></div>
  <div><dt>Scope</dt><dd>${esc(observation.scope)}</dd></div>
  <div><dt>Source as at</dt><dd>${esc(dateTime(observation.sourceAsAt))}</dd></div>
  <div><dt>Last successful observation</dt><dd>${esc(dateTime(observation.observedAt))}</dd></div>
  <div><dt>Completeness</dt><dd>${esc(completeness)} ${pill(tone.tone,tone.label)}</dd></div>
 </dl>`;
}

function summaryTile(options){
 const restricted=options.restricted===true;
 const value=restricted
  ? `<span class="tile-value unknown">Restricted for this role</span>`
  : options.unknown
   ? `<span class="tile-value unknown">${esc(options.unknown)}</span>`
   : `<span class="tile-value">${esc(options.value)}</span>`;
 const attrs=restricted
  ? `type="button" disabled data-restricted="true"`
  : `type="button" data-action="drill" data-view="${esc(options.view)}" data-filter="${esc(JSON.stringify(options.filter||{}))}" data-label="${esc(options.label)}"`;
 return `<button class="summary-tile" ${attrs}>
  ${restricted?'':`<span class="tile-arrow">${icon('chevron')}</span>`}
  <span class="tile-label">${icon(options.icon)}${esc(options.label)}</span>
  ${value}
  <span class="tile-scope">${esc(options.scope)}</span>
 </button>`;
}

function attentionList(items){
 if(!items.length){
  return `<div class="empty">${icon('check')}<h3>No outstanding items in this scope</h3>
   <p>Nothing matched the current customer, filters and role. This is an empty result, not a claim that the customer has no commitments elsewhere.</p>
   ${Object.values(state.filters).some(Boolean)?'<button type="button" data-action="clear-filters">Clear all filters</button>':''}</div>`;
 }
 return `<ul class="attention-list">${items.map(item=>`<li class="attention-item">
  <div>
   <div class="origin">${pill('neutral',item.recordLabel)}<span class="ref">${esc(item.section==='orders'?'Sales orders':item.section==='deals'?'Deals & quotations':item.section==='cases'?'Cases & service':item.section==='projects'?'Projects':'Accounts')}</span></div>
   <h3>${esc(item.title)}</h3>
   <p class="reason">${esc(item.reason)}</p>
   <p class="next-action">${icon('flag')}<span><strong>Next action:</strong> ${esc(item.action)}</span></p>
   <div class="actions">
    <button type="button" class="link-button" data-action="open" data-kind="${esc(item.recordKind)}" data-id="${esc(item.record)}">Open record snapshot</button>
    <button type="button" class="link-button" data-action="drill" data-view="${esc(item.section)}" data-filter="{}" data-label="${esc(item.recordLabel)}">Go to ${esc(item.section==='orders'?'sales orders':item.section)}</button>
   </div>
  </div>
  <div class="attention-meta">
   <span>${icon('user')} ${esc(item.owner)}</span>
   <span class="due">${icon('calendar')} ${esc(item.dueKind)}: ${esc(date(item.due))}</span>
   ${noteCount(item.record)?pill('info',`${noteCount(item.record)} internal note(s)`):''}
   <button type="button" class="link-button" data-action="add-note" data-id="${esc(item.record)}" data-label="${esc(item.recordLabel)}">Add internal note</button>
  </div>
 </li>`).join('')}</ul>`;
}
const noteCount=id=>(state.notes[id]||[]).length;

/* --------------------------------------------------------------- overview */

function renderOverview(){
 const current=org();
 const follow=visibleFollowUps();
 const orders=visibleOrders();
 const openOrders=orders.filter(o=>o.sourceStatus==='Open');
 const outstanding=openOrders.filter(o=>{const f=M.orderFulfilment(o);return !f.determinable||f.outstandingLines>0;});
 const quotes=visibleQuotations().filter(quote=>['Sent','Issued'].includes(quote.state));
 const acceptedAwaiting=visibleQuotations().filter(quote=>quote.state==='Accepted'&&quote.conversion==='Unknown');
 const openCases=visibleCases().filter(item=>item.state!=='Resolved');
 const upcoming=M.appointments.filter(a=>a.org===state.org&&a.state==='Scheduled')
  .filter(a=>!state.filters.site||a.site===state.filters.site);
 const activeProjects=visibleProjects().filter(project=>project.commercialCloseout===null);
 const contacts=M.people.filter(person=>person.org===state.org)
  .filter(person=>!state.filters.site||person.sites.includes(state.filters.site)||person.sites.length===0);

 const accountTiles=canFinance()
  ? summaryTile({label:'Customer account observations',icon:'finance',value:visibleFinance().length,
     scope:M.describeScope(['Transactions returned for mapped accounts',scopeSuffix(),'No account balance is derived from these rows']),
     view:'accounts',filter:{}})
  : summaryTile({label:'Customer account observations',icon:'lock',restricted:true,
     scope:'Finance visibility is not granted to this demonstration role. Amounts, counts and balances are withheld rather than summarised.'});

 return `
 <div class="page-heading">
  <div>
   <h2 id="main-heading" tabindex="-1">What is happening with ${esc(current.name)}</h2>
   <p>Outstanding commitments and next actions first, with recent history underneath. Every summary states what it counted and opens the register behind it.</p>
  </div>
  <div class="actions">
   <button type="button" data-action="navigate" data-view="orders">${icon('sales')} Sales orders</button>
   <button type="button" class="primary" data-action="navigate" data-view="cases">${icon('service')} Cases &amp; service</button>
  </div>
 </div>

 ${renderIdentityCard(current,contacts)}

 <h3 class="eyebrow" style="margin:26px 0 12px">What we have committed to</h3>
 <div class="summary-grid">
  ${operationalOnly()?'':summaryTile({label:'Open sales orders',icon:'sales',value:openOrders.length,
   scope:M.describeScope([`${outstanding.length} with outstanding or undetermined supply`,scopeSuffix(),'Mapped ERP accounts only']),
   view:'orders',filter:{status:'Open'}})}
  ${operationalOnly()?'':summaryTile({label:'Quotations awaiting a response',icon:'estimate',value:quotes.length,
   scope:M.describeScope(['Issued or sent with no recorded customer response',scopeSuffix(),'Revisions of one quotation count once'])
   ,view:'deals',filter:{status:'Sent'}})}
  ${operationalOnly()?'':summaryTile({label:'Accepted, conversion unresolved',icon:'alert',value:acceptedAwaiting.length,
   scope:'An accepted quotation whose conversion outcome is unknown. This is not an existing ERP order and is never counted as one.',
   view:'deals',filter:{status:'Accepted'}})}
  ${summaryTile({label:'Active cases',icon:'service',value:openCases.length,
   scope:M.describeScope(['Cases not in a Resolved state',scopeSuffix(),'A completed visit does not resolve a case']),
   view:'cases',filter:{}})}
 </div>
 <div class="summary-grid">
  ${summaryTile({label:'Upcoming service visits',icon:'calendar',value:upcoming.length,
   scope:M.describeScope(['Scheduled appointments not yet attended',scopeSuffix()]),view:'cases',filter:{}})}
  ${operationalOnly()?'':summaryTile({label:'Projects in delivery',icon:'projects',value:activeProjects.length,
   scope:M.describeScope(['Projects without a recorded commercial closeout',scopeSuffix()]),view:'projects',filter:{}})}
  ${summaryTile({label:'Maintenance, warranty and renewals',icon:'refresh',
   value:M.agreements.filter(a=>a.org===state.org).length+M.warrantyCases.filter(w=>w.org===state.org).length,
   scope:'Active agreements and open warranty cases. Customer outcome and supplier recovery remain separate facts.',
   view:'cases',filter:{}})}
  ${accountTiles}
 </div>

 <div class="card space-bottom">
  <div class="card-head">
   <div><h2>Outstanding commitments and next actions</h2>
    <p class="small muted" style="margin:4px 0 0">${follow.length} item(s) in the current customer, filter and role scope. Each names its originating record, why it needs attention, the responsible owner, a due date or date needed, and one next action.</p></div>
   ${follow.length?pill('warning',`${follow.filter(f=>f.due<=M.TODAY).length} at or past the stated date`):''}
  </div>
  ${attentionList(follow)}
 </div>

 <div class="two-col">
  <div class="card">
   <div class="card-head"><h2>Recent history</h2>
    <button type="button" class="link-button" data-action="navigate" data-view="activity">Open activity &amp; documents</button></div>
   <div class="pad">
    <ul class="timeline">${visibleActivities().slice(0,6).map(entry=>`<li class="timeline-item">
     <h3>${esc(entry.subject)}</h3>
     <div class="when">${esc(dateTime(entry.when))} · ${esc(entry.kind)} · ${esc(entry.author)}</div>
     <p>${esc(entry.summary)}</p>
     ${entry.record?`<div class="actions"><button type="button" class="link-button" data-action="open" data-kind="activity" data-id="${esc(entry.id)}">Open snapshot</button></div>`:''}
    </li>`).join('')||'<li class="timeline-item"><p>No activity in this scope.</p></li>'}</ul>
   </div>
  </div>
  <div class="side-stack">
   ${renderSourceHealthCard()}
   ${renderRelatedWorkspacesCard()}
  </div>
 </div>`;
}

function scopeSuffix(){
 const site=state.filters.site?M.byId(M.sites,state.filters.site):null;
 return site?`Site filter: ${site.name}`:'All sites for this customer';
}

function renderIdentityCard(current,contacts){
 const accounts=orgAccounts();
 const unresolved=M.unresolvedAccounts();
 return `<div class="card">
  <div class="card-head">
   <div><h2>${esc(current.name)}</h2>
    <p class="small muted" style="margin:4px 0 0">${esc(current.trading)} · ${esc(current.abn)} · Customer since ${esc(date(current.since))}</p></div>
   ${pill('neutral','Synthetic customer record')}
  </div>
  <div class="pad grid-two">
   <div>
    <h3>Relationship and ownership</h3>
    <dl class="detail-list">
     <dt>Relationship owner</dt><dd>${esc(current.owner)} · ${esc(current.ownerRole)}</dd>
     <dt>Service coordinator</dt><dd>${esc(current.serviceOwner)} · ${esc(current.serviceOwnerRole)}</dd>
     <dt>Segment</dt><dd>${esc(current.segment)}</dd>
     <dt>Sites</dt><dd>${orgSites().map(s=>esc(s.name)).join('<br>')}</dd>
    </dl>
    <h3 style="margin-top:20px">Contacts in scope</h3>
    ${contacts.map(person=>`<div class="row" style="gap:10px;padding:8px 0">
      <span class="avatar">${esc(person.name.split(' ').map(w=>w[0]).join(''))}</span>
      <div class="stack" style="min-width:0">
       <strong style="font-weight:500">${esc(person.name)}</strong>
       <span class="small muted">${esc(person.role)} · ${esc(person.responsibility)}</span>
      </div></div>`).join('')||'<p class="small muted">No contact matches the current filters.</p>'}
   </div>
   <div>
    <h3>Legal and billing account relationships</h3>
    <p class="small muted">One organisation relates to several company-specific ERP accounts. Internal identity, provider, company, account code and effective dates stay separate, and a matching name never creates a relationship.</p>
    ${accounts.map(account=>`<div class="card" style="margin-bottom:12px">
      <div class="pad">
       <div class="row between"><strong style="font-weight:500">${esc(account.code)}</strong>${pill('success','Mapping confirmed')}</div>
       <dl class="detail-list compact" style="margin-top:10px">
        <dt>Company</dt><dd>${esc((M.byId(M.erpCompanies,account.company)||{}).name)}</dd>
        <dt>Source name</dt><dd>${esc(account.name)}</dd>
        <dt>Currency</dt><dd>${esc(account.currency)}</dd>
        <dt>Effective from</dt><dd>${esc(date(account.effectiveFrom))}</dd>
        <dt>Mapping record</dt><dd>${esc(account.mappingRef)} · confirmed by ${esc(account.mappedBy)}</dd>
       </dl>
      </div></div>`).join('')}
    ${unresolved.length?`<div class="callout warning">
      <p><strong>${unresolved.length} source account has no confirmed mapping.</strong></p>
      <p>${esc(unresolved[0].note)}</p>
      <div class="actions"><button type="button" data-action="open" data-kind="mapping" data-id="${esc(unresolved[0].id)}">Inspect unresolved mapping</button></div>
     </div>`:''}
    <h3 style="margin-top:20px">Site party roles</h3>
    <p class="small muted">Operator, property owner, bill payer and delivery destination are distinct. A shared address or a similar name establishes none of them.</p>
    <dl class="detail-list compact">
     ${orgSites().map(site=>`<dt>${esc(site.name)}</dt><dd>Operator ${esc(site.operator)}<br>Property owner ${esc(site.propertyOwner)}<br>Bill payer ${esc(site.billingParty)}</dd>`).join('')}
    </dl>
   </div>
  </div>
 </div>`;
}

function renderSourceHealthCard(){
 const relevant=M.observations.filter(obs=>orgAccounts().some(a=>a.id===obs.account)||obs.account==='ACC-AU-UNRESOLVED');
 return `<div class="card">
  <div class="card-head"><h3>Source freshness and completeness</h3></div>
  <div class="pad">
   ${relevant.map(obs=>{const tone=M.observationState(obs);return `<div style="padding:10px 0;border-bottom:1px solid var(--line-soft)">
    <div class="row between"><strong style="font-weight:500;font-size:13px">${esc(obs.feed)} · ${esc(obs.account)}</strong>${pill(tone.tone,tone.label)}</div>
    <p class="small muted" style="margin:6px 0 0">Observed ${esc(dateTime(obs.observedAt))}. ${esc(obs.error||'')}</p>
   </div>`;}).join('')}
   <p class="small muted" style="margin-top:12px">No records returned, data unavailable and not permitted are three different results and are shown as three different states.</p>
  </div>
 </div>`;
}

function renderRelatedWorkspacesCard(){
 return `<div class="card">
  <div class="card-head"><h3>Detailed location and asset views</h3></div>
  <div class="pad">
   <p class="small muted">The full hierarchy, forms and history stay in their owning designs. Customer 360 links to them rather than repeating them.</p>
   <div class="link-list">
    <button type="button" class="link-chip" data-action="boundary" data-target="sites">${icon('sites')} Sites (CS-04)</button>
    <button type="button" class="link-chip" data-action="boundary" data-target="areas">${icon('layers')} Facilities &amp; growing areas (CS-05)</button>
    <button type="button" class="link-chip" data-action="boundary" data-target="equipment">${icon('equipment')} Equipment links (EQ-03)</button>
    <button type="button" class="link-chip" data-action="boundary" data-target="readiness">${icon('flag')} Visit requirements (CS-06)</button>
   </div>
  </div>
 </div>`;
}

/* -------------------------------------------------------------- registers */

function filterBar(view){
 const applicable=filtersFor(view);
 const field=(key,label,options,hint)=>{
  if(!applicable.includes(key)) return '';
  return `<div class="field">
   <label for="filter-${key}">${esc(label)}</label>
   <select id="filter-${key}" data-filter-key="${key}">${options.map(option=>
    `<option value="${esc(option.value)}"${state.filters[key]===option.value?' selected':''}>${esc(option.label)}</option>`).join('')}</select>
   ${hint?`<span class="hint">${esc(hint)}</span>`:''}
  </div>`;
 };
 const dates=applicable.includes('dates')?`<div class="field">
   <label for="filter-from">Date range</label>
   <div class="date-range">
    <input type="date" id="filter-from" data-filter-key="from" value="${esc(state.filters.from)}" aria-label="Date range from">
    <span class="small muted">to</span>
    <input type="date" id="filter-to" data-filter-key="to" value="${esc(state.filters.to)}" aria-label="Date range to">
   </div>
   <span class="hint">${esc(dateFieldFor(view))}</span>
  </div>`:'';

 return `<div class="filter-grid">
  ${field('site','Site',[{value:'',label:'All sites'},...orgSites().map(s=>({value:s.id,label:s.name}))],'Applies only where an explicit site relationship exists.')}
  ${field('area','Facility / growing area',[{value:'',label:'All facilities and areas'},...orgAreas().map(a=>({value:a.id,label:`${a.name} · ${(M.byId(M.sites,a.site)||{}).name}`}))])}
  ${field('equipment','Equipment',[{value:'',label:'All equipment'},...orgAssets().map(a=>({value:a.id,label:`${a.ref} · ${a.name}`}))])}
  ${field('status',statusLabelFor(view),[{value:'',label:'All'},...statusOptionsFor(view).map(s=>({value:s,label:s}))],'Source-reported values are shown as the source reports them.')}
  ${field('owner','Owner',[{value:'',label:'All owners'},...ownerOptionsFor(view).map(o=>({value:o,label:o}))])}
  ${field('company','ERP company / entity',[{value:'',label:'All companies'},...orgCompanies().map(c=>({value:c.id,label:c.name}))])}
  ${field('account','ERP account',[{value:'',label:'All mapped accounts'},...orgAccounts().map(a=>({value:a.id,label:`${a.code} · ${(M.byId(M.erpCompanies,a.company)||{}).currency}`}))])}
  ${dates}
 </div>`;
}
function filtersFor(view){
 switch(view){
  case 'deals':return ['site','area','status','owner','dates'];
  case 'orders':return ['site','area','status','company','account','dates'];
  case 'cases':return ['site','area','equipment','status','owner','dates'];
  case 'projects':return ['site','area','status','owner','dates'];
  case 'sites':return ['site','area','equipment'];
  case 'accounts':return ['status','company','account','dates'];
  case 'activity':return ['site','status','owner','dates'];
  default:return ['site'];
 }
}
function dateFieldFor(view){
 return {deals:'Filters on the quotation issue date.',orders:'Filters on the source order date.',
  cases:'Filters on the date the case was raised.',projects:'Filters on the project start date.',
  accounts:'Filters on the source transaction date.',activity:'Filters on the event date.'}[view]||'';
}
function statusLabelFor(view){
 return {orders:'Source-reported order status',deals:'Quotation state',cases:'Case state',
  projects:'Project state',accounts:'Source transaction status',activity:'Entry type'}[view]||'Status';
}
function statusOptionsFor(view){
 const unique=list=>[...new Set(list)].sort();
 switch(view){
  case 'deals':return unique(M.quotations.filter(x=>x.org===state.org).map(x=>x.state));
  case 'orders':return unique(M.orders.filter(x=>x.org===state.org).map(x=>x.sourceStatus));
  case 'cases':return unique(M.cases.filter(x=>x.org===state.org).map(x=>x.state));
  case 'projects':return unique(M.projects.filter(x=>x.org===state.org).map(x=>x.state));
  case 'accounts':return unique(M.financeRecords.filter(x=>x.org===state.org).map(x=>x.sourceStatus));
  case 'activity':return unique(M.activities.filter(x=>x.org===state.org).map(x=>x.kind));
  default:return [];
 }
}
function ownerOptionsFor(view){
 const unique=list=>[...new Set(list)].sort();
 switch(view){
  case 'deals':return unique(M.quotations.filter(x=>x.org===state.org).map(x=>x.owner));
  case 'cases':return unique(M.cases.filter(x=>x.org===state.org).map(x=>x.owner));
  case 'projects':return unique(M.projects.filter(x=>x.org===state.org).map(x=>x.owner));
  case 'activity':return unique(M.activities.filter(x=>x.org===state.org).map(x=>x.author));
  default:return [];
 }
}

function chipBar(){
 const chips=[];
 const labels={site:'Site',area:'Facility / area',equipment:'Equipment',status:'Status',owner:'Owner',
  company:'ERP company',account:'ERP account',from:'From',to:'To'};
 const display={
  site:value=>(M.byId(M.sites,value)||{}).name,
  area:value=>(M.byId(M.areas,value)||{}).name,
  equipment:value=>(M.byId(M.assets,value)||{}).ref,
  company:value=>(M.byId(M.erpCompanies,value)||{}).name,
  account:value=>(M.byId(M.erpAccounts,value)||{}).code,
  from:value=>date(value),to:value=>date(value)
 };
 for(const [key,value] of Object.entries(state.filters)){
  if(!value) continue;
  chips.push(`<span class="chip">${esc(labels[key])}: ${esc(display[key]?display[key](value)||value:value)}
   <button type="button" class="chip-remove" data-action="remove-filter" data-key="${esc(key)}" aria-label="Remove ${esc(labels[key])} filter">${icon('close')}</button></span>`);
 }
 if(state.search.trim()) chips.push(`<span class="chip">Search: ${esc(state.search.trim())}
  <button type="button" class="chip-remove" data-action="clear-search" aria-label="Clear search">${icon('close')}</button></span>`);
 if(!chips.length) return '';
 return `<div class="chip-bar"><span class="small muted">Active filters</span>${chips.join('')}
  <button type="button" class="link-button" data-action="clear-filters">Clear all</button></div>`;
}

function toolbar(placeholder){
 return `<div class="toolbar">
  <div class="search">${icon('search')}
   <input type="search" id="record-search" value="${esc(state.search)}" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">
  </div>
  ${state.returnStack.length?`<button type="button" data-action="return">${icon('arrow')} Return to ${esc(state.returnStack[state.returnStack.length-1].label)}</button>`:''}
 </div>`;
}

function resultsBar(shown,total,note){
 return `<div class="results-bar">
  <span><strong>${shown}</strong> of ${total} record(s) match the current customer, filters and role.</span>
  ${note?`<span class="small muted">${esc(note)}</span>`:''}
 </div>`;
}

function emptyState(title,body){
 return `<div class="empty">${icon('search')}<h3>${esc(title)}</h3><p>${esc(body)}</p>
  <div class="actions" style="justify-content:center">
   ${Object.values(state.filters).some(Boolean)||state.search?'<button type="button" data-action="clear-filters">Clear all filters</button>':''}
   <button type="button" data-action="navigate" data-view="overview">Back to overview</button>
  </div></div>`;
}

/* ---------------------------------------------------------- sales orders */

function renderOrders(){
 const all=M.orders.filter(order=>order.org===state.org&&orgAccounts().some(a=>a.id===order.account));
 const shown=visibleOrders();
 const unresolvedShown=visibleUnresolvedOrders();
 const totals=M.totalByCurrency(shown,'orderAmountExTax');

 const rows=shown.map(order=>{
  const fulfilment=M.orderFulfilment(order);
  const observation=M.observationFor(order.observation);
  const tone=M.observationState(observation);
  const progress=fulfilment.determinable
   ? `${fulfilment.lines-fulfilment.outstandingLines} of ${fulfilment.lines} line(s) fully supplied`
   : `Not determinable — ${fulfilment.unknown} line(s) have no source-supplied shipped quantity`;
  return `<tr data-row-id="${esc(order.id)}" class="${state.selected&&state.selected.id===order.id?'is-selected':''}">
   <td><button type="button" class="record-link" data-action="open" data-kind="order" data-id="${esc(order.id)}">${esc(order.id)}</button>
    <span class="sub">${esc(order.orderType)}</span></td>
   <td>${esc(order.customerPo||'Not supplied')}<span class="sub">${esc(date(order.orderDate))}</span></td>
   <td>${statePill(order.sourceStatus)}${order.hold?`<span class="sub">${esc(order.hold)}</span>`:''}
    ${order.stale?pill('danger','Stale — last refresh failed'):''}</td>
   <td>${order.quotation?`${esc(order.quotation)} ${esc(order.quotationRevision)}`:unknown('No linked quotation')}
    ${order.project?`<span class="sub">Project ${esc(order.project)}</span>`:''}
    ${order.serviceRecord?`<span class="sub">Service ${esc(order.serviceRecord)}</span>`:''}</td>
   <td>${order.deliverySite?esc((M.byId(M.sites,order.deliverySite)||{}).name):unknown('No linked site')}
    ${order.deliveryAreas.length?`<span class="sub">${order.deliveryAreas.map(id=>esc((M.byId(M.areas,id)||{}).name)).join(', ')}</span>`:''}</td>
   <td class="numeric">${esc(money(order.orderAmountExTax,order.currency))}<span class="sub">${esc(order.taxBasis)}</span></td>
   <td>${esc(progress)}<span class="sub">Requested ${esc(date(order.requestedDelivery))} · Expected ${order.expectedDelivery?esc(date(order.expectedDelivery)):'not supplied'}</span></td>
   <td>${pill(tone.tone,tone.label)}<span class="sub">${esc(dateTime(observation.observedAt))}</span></td>
  </tr>`;
 }).join('');

 const cards=shown.map(order=>{
  const fulfilment=M.orderFulfilment(order);
  return `<li class="register-card ${state.selected&&state.selected.id===order.id?'is-selected':''}">
   <h3><button type="button" class="record-link" data-action="open" data-kind="order" data-id="${esc(order.id)}">${esc(order.id)}</button></h3>
   <div class="row" style="gap:6px">${statePill(order.sourceStatus)}${order.stale?pill('danger','Stale'):''}${order.hold?pill('warning','Hold reported'):''}</div>
   <dl class="detail-list">
    <dt>Customer PO</dt><dd>${esc(order.customerPo||'Not supplied')}</dd>
    <dt>Order date</dt><dd>${esc(date(order.orderDate))}</dd>
    <dt>Amount</dt><dd>${esc(money(order.orderAmountExTax,order.currency))} ex tax</dd>
    <dt>Supply</dt><dd>${fulfilment.determinable?`${fulfilment.outstandingLines} line(s) outstanding`:'Not determinable from the source'}</dd>
    <dt>Expected</dt><dd>${order.expectedDelivery?esc(date(order.expectedDelivery)):'Not supplied'}</dd>
   </dl>
  </li>`;
 }).join('');

 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Sales orders</h2>
   <p>Orders observed in ${esc(M.erpConnection.provider)} for this customer’s mapped ERP accounts. MYOB remains the authority for order and account information; this view reads observations and offers no ERP edit, release, cancellation, payment or fulfilment action.</p></div>
 </div>

 <div class="card space-bottom">
  ${toolbar('Search orders, customer PO references and line descriptions')}
  ${filterBar('orders')}
  ${chipBar()}
  ${resultsBar(shown.length,all.length,'Counts cover mapped accounts only.')}
  ${shown.length?`
   <div class="register-wrap">
    <table class="register">
     <caption>Sales orders for ${esc(org().name)}. Amounts are shown per order in the order’s own currency and are never added across currencies or companies.</caption>
     <thead><tr>
      <th scope="col">ERP order</th><th scope="col">Customer PO / order date</th><th scope="col">Source status</th>
      <th scope="col">Related records</th><th scope="col">Delivery destination</th>
      <th scope="col" class="numeric">Order amount (ex tax)</th><th scope="col">Supply and dates</th><th scope="col">Observation</th>
     </tr></thead>
     <tbody>${rows}</tbody>
    </table>
   </div>
   <ul class="register-cards">${cards}</ul>
   ${renderOrderTotals(totals)}
  `:emptyState('No orders match this scope',
    'No sales order matched the current customer, filters and role. The source observation for these accounts completed, so this is an empty result rather than an unavailable source.')}
  ${sourceStrip(M.observationFor('OBS-ORD-AU'))}
 </div>

 ${unresolvedShown.length?`<div class="card space-bottom">
  <div class="card-head"><div><h2>Unresolved source records</h2>
   <p class="small muted" style="margin:4px 0 0">Returned by the source under an account with no confirmed customer mapping. Nothing here is attributed to a customer, and nothing here is included in any count or total above.</p></div>
   ${pill('warning','Not counted')}</div>
  <div class="register-wrap">
   <table class="register">
    <caption>Source account WILLOWBANK HORT. A similar name is not a mapping.</caption>
    <thead><tr><th scope="col">ERP order</th><th scope="col">Source account</th><th scope="col">Order date</th>
     <th scope="col" class="numeric">Order amount</th><th scope="col">Mapping state</th></tr></thead>
    <tbody>${unresolvedShown.map(order=>`<tr>
     <td><button type="button" class="record-link" data-action="open" data-kind="order" data-id="${esc(order.id)}">${esc(order.id)}</button></td>
     <td>${esc((M.byId(M.erpAccounts,order.account)||{}).code)}<span class="sub">${esc((M.byId(M.erpCompanies,order.company)||{}).name)}</span></td>
     <td>${esc(date(order.orderDate))}</td>
     <td class="numeric">${esc(money(order.orderAmountExTax,order.currency))}</td>
     <td>${pill('danger','No confirmed mapping')}</td>
    </tr>`).join('')}</tbody>
   </table>
  </div>
  <div class="related-row"><span class="label">Next action</span>
   <button type="button" data-action="open" data-kind="mapping" data-id="ACC-AU-UNRESOLVED">Inspect and resolve the mapping (AD-05)</button></div>
 </div>`:''}

 ${renderConversionCard()}`;
}

function renderOrderTotals(totals){
 return `<div class="related-row" style="flex-direction:column;align-items:flex-start;gap:6px">
  <span class="label">Order amounts in the current scope, stated per currency</span>
  <div class="row">${totals.byCurrency.map(entry=>pill('neutral',`${M.money(entry.amount,entry.currency)} ex tax`)).join('')||pill('neutral','No comparable amounts')}</div>
  <span class="small muted">Order amounts, quotation values, invoice amounts and payments are different measures and are never added together. Amounts in different currencies or legal companies are not consolidated, because no approved conversion definition exists.${totals.unknown?` ${totals.unknown} record(s) have no source-supplied amount and are excluded.`:''}</span>
 </div>`;
}

function renderConversionCard(){
 const awaiting=M.quotations.filter(quote=>quote.org===state.org&&quote.state==='Accepted'&&quote.conversion!=='Converted');
 if(!awaiting.length) return '';
 return `<div class="card">
  <div class="card-head"><div><h2>Accepted quotations that are not orders</h2>
   <p class="small muted" style="margin:4px 0 0">An accepted quotation awaiting conversion is not an existing ERP order. An unknown conversion outcome stays unresolved until it is reconciled.</p></div></div>
  <div class="pad">
   ${awaiting.map(quote=>`<div class="source-banner ${quote.conversion==='Unknown'?'danger':'neutral'}">
    ${icon('alert')}
    <div>
     <p><strong>${esc(quote.displayRef||quote.id)} ${esc(quote.revision)} — accepted ${esc(date(quote.responded))}; conversion outcome ${esc(quote.conversion.toLowerCase())}.</strong></p>
     <p>${esc(quote.conversionNote||'')}</p>
     <div class="actions">
      <button type="button" data-action="open" data-kind="quotation" data-id="${esc(quote.id)}">Open quotation snapshot</button>
      <button type="button" data-action="boundary" data-target="es07">Open conversion and recovery (ES-07)</button>
     </div>
    </div></div>`).join('')}
  </div>
 </div>`;
}

/* ----------------------------------------------------- deals & quotations */

function renderDeals(){
 const allQuotes=M.quotations.filter(quote=>quote.org===state.org);
 const quotes=visibleQuotations();
 const opps=visibleOpportunities();
 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Deals &amp; quotations</h2>
   <p>Opportunities, estimates, quotation revisions, customer responses and the next action on each. Alternative estimate options and successive revisions of one quotation are not separate sales commitments.</p></div>
 </div>

 <div class="card space-bottom">
  ${toolbar('Search opportunities, quotations and responses')}
  ${filterBar('deals')}
  ${chipBar()}
  ${resultsBar(quotes.length,allQuotes.length,'Quotation revisions of one quotation are listed separately but counted once as a commitment.')}
  ${quotes.length?`
  <div class="register-wrap">
   <table class="register">
    <caption>Quotations for ${esc(org().name)}.</caption>
    <thead><tr><th scope="col">Quotation</th><th scope="col">Revision</th><th scope="col">State</th>
     <th scope="col">Issued / sent / responded</th><th scope="col" class="numeric">Value</th>
     <th scope="col">Conversion</th><th scope="col">Next action</th></tr></thead>
    <tbody>${quotes.map(quote=>`<tr data-row-id="${esc(quote.id)}" class="${state.selected&&state.selected.id===quote.id?'is-selected':''}">
     <td><button type="button" class="record-link" data-action="open" data-kind="quotation" data-id="${esc(quote.id)}">${esc(quote.displayRef||quote.id)}</button>
      <span class="sub">${quote.opportunity?esc(quote.opportunity):'No linked opportunity'}</span></td>
     <td>${esc(quote.revision)}</td>
     <td>${statePill(quote.state)}</td>
     <td>${esc(date(quote.issued))}<span class="sub">Sent ${esc(date(quote.sent))} · Responded ${quote.responded?esc(date(quote.responded)):'not recorded'}</span></td>
     <td class="numeric">${esc(money(quote.value,quote.currency))}</td>
     <td>${quote.conversion==='Converted'?pill('success','Converted'):quote.conversion==='Unknown'?pill('danger','Outcome unknown'):unknown('Not applicable')}
      ${quote.order?`<span class="sub">${esc(quote.order)}</span>`:''}</td>
     <td>${quote.nextAction?esc(quote.nextAction):unknown('None recorded')}
      ${quote.nextActionDue?`<span class="sub">By ${esc(date(quote.nextActionDue))}</span>`:''}</td>
    </tr>`).join('')}</tbody>
   </table>
  </div>
  <ul class="register-cards">${quotes.map(quote=>`<li class="register-card">
   <h3><button type="button" class="record-link" data-action="open" data-kind="quotation" data-id="${esc(quote.id)}">${esc(quote.displayRef||quote.id)} ${esc(quote.revision)}</button></h3>
   ${statePill(quote.state)}
   <dl class="detail-list"><dt>Issued</dt><dd>${esc(date(quote.issued))}</dd>
    <dt>Value</dt><dd>${esc(money(quote.value,quote.currency))}</dd>
    <dt>Conversion</dt><dd>${esc(quote.conversion)}</dd></dl>
  </li>`).join('')}</ul>`
  :emptyState('No quotations match this scope','Adjust or clear the filters to widen the result.')}
 </div>

 <div class="card space-bottom">
  <div class="card-head"><h2>Opportunities</h2>${pill('neutral',`${opps.length} in scope`)}</div>
  <div class="register-wrap">
   <table class="register">
    <caption>Opportunity value is an internal forecast. It is not an order, an invoice or a payment, and it is never added to them.</caption>
    <thead><tr><th scope="col">Opportunity</th><th scope="col">Stage</th><th scope="col">Owner</th>
     <th scope="col">Scope</th><th scope="col" class="numeric">Forecast value</th><th scope="col">Next action</th></tr></thead>
    <tbody>${opps.map(opp=>`<tr>
     <td><button type="button" class="record-link" data-action="open" data-kind="opportunity" data-id="${esc(opp.id)}">${esc(opp.id)}</button>
      <span class="sub">${esc(opp.title)}</span></td>
     <td>${statePill(opp.stage)}</td>
     <td>${esc(opp.owner)}</td>
     <td>${esc((M.byId(M.sites,opp.site)||{}).name||'Not linked')}<span class="sub">${opp.areas.map(id=>esc((M.byId(M.areas,id)||{}).name)).join(', ')||'No area linked'}</span></td>
     <td class="numeric">${opp.value===null?unknown('Not estimated'):esc(money(opp.value,opp.currency))}</td>
     <td>${esc(opp.nextAction)}${opp.nextActionDue?`<span class="sub">By ${esc(date(opp.nextActionDue))}</span>`:''}</td>
    </tr>`).join('')||'<tr><td colspan="6">No opportunity matches this scope.</td></tr>'}</tbody>
   </table>
  </div>
 </div>

 <div class="card">
  <div class="card-head"><h2>Estimates and alternative options</h2></div>
  <div class="pad">
   ${M.estimates.filter(estimate=>estimate.org===state.org).map(estimate=>`<div class="card" style="margin-bottom:14px"><div class="pad">
    <div class="row between"><strong style="font-weight:500">${esc(estimate.id)} — ${esc(estimate.title)}</strong>${statePill(estimate.state)}</div>
    <p class="small muted" style="margin:8px 0">${esc(estimate.note||'One option only.')}</p>
    <table class="lines-table"><thead><tr><th scope="col">Option</th><th scope="col">Description</th>
     <th scope="col" class="numeric">Value</th><th scope="col">Selected</th></tr></thead>
     <tbody>${estimate.options.map(option=>`<tr><td>${esc(option.ref)}</td><td>${esc(option.description)}</td>
      <td class="numeric">${esc(money(option.value,estimate.currency))}</td>
      <td>${option.selected?pill('success','Selected'):pill('neutral','Alternative')}</td></tr>`).join('')}</tbody></table>
    <p class="no-total-note">Alternative options are mutually exclusive. Their values are never totalled, and only a selected option can reach a quotation.</p>
   </div></div>`).join('')}
  </div>
 </div>`;
}

/* -------------------------------------------------------- cases & service */

function renderCases(){
 const allCases=M.cases.filter(item=>item.org===state.org);
 const shown=visibleCases();
 const appointments=M.appointments.filter(a=>a.org===state.org).filter(a=>!state.filters.site||a.site===state.filters.site);
 const agreements=M.agreements.filter(a=>a.org===state.org).filter(a=>!state.filters.site||a.site===state.filters.site);
 const warranty=M.warrantyCases.filter(w=>w.org===state.org).filter(w=>!state.filters.site||w.site===state.filters.site);

 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Cases &amp; service</h2>
   <p>Cases, authorised work orders, appointments, issued reports, unresolved findings, maintenance obligations and warranty matters. Their identities and states stay separate: a completed visit does not resolve a case, complete the remaining work or settle anything commercially. No service level is defined for this prototype, so no priority threshold, breach state or health score is shown.</p></div>
 </div>

 <div class="card space-bottom">
  ${toolbar('Search cases, symptoms, findings and owners')}
  ${filterBar('cases')}
  ${chipBar()}
  ${resultsBar(shown.length,allCases.length)}
  ${shown.length?shown.map(item=>renderCaseCard(item)).join(''):emptyState('No cases match this scope','Adjust or clear the filters to widen the result.')}
 </div>

 <div class="grid-two space-bottom">
  <div class="card">
   <div class="card-head"><h2>Appointments</h2></div>
   <div class="register-wrap"><table class="register" style="min-width:0">
    <thead><tr><th scope="col">Appointment</th><th scope="col">State</th><th scope="col">Scheduled</th><th scope="col">Technician</th></tr></thead>
    <tbody>${appointments.map(a=>`<tr><td>${esc(a.id)}<span class="sub">${a.workOrder?`Work order ${esc(a.workOrder)}`:`Agreement ${esc(a.agreement||'—')}`}</span></td>
     <td>${statePill(a.state)}</td><td>${esc(dateTime(a.scheduled))}</td><td>${esc(a.technician)}</td></tr>`).join('')
     ||'<tr><td colspan="4">No appointment matches this scope.</td></tr>'}</tbody></table></div>
  </div>
  <div class="card">
   <div class="card-head"><h2>Maintenance and warranty</h2></div>
   <div class="pad">
    ${agreements.map(a=>`<div style="padding-bottom:14px;border-bottom:1px solid var(--line-soft);margin-bottom:14px">
     <div class="row between"><strong style="font-weight:500">${esc(a.id)}</strong>${statePill(a.state)}</div>
     <p class="small muted" style="margin:6px 0">${esc(a.title)} · ${esc(a.coverage)}</p>
     <dl class="detail-list compact"><dt>Next occurrence</dt><dd>${esc(date(a.nextOccurrence))}</dd>
      <dt>Renewal due</dt><dd>${esc(date(a.renewalDue))}</dd></dl>
     <p class="small muted" style="margin-top:8px">${esc(a.note)}</p></div>`).join('')||'<p class="small muted">No agreement in this scope.</p>'}
    ${warranty.map(w=>`<div>
     <div class="row between"><strong style="font-weight:500">${esc(w.id)}</strong>${pill('warning','Supplier recovery outstanding')}</div>
     <p class="small muted" style="margin:6px 0">${esc(w.title)}</p>
     <dl class="detail-list compact"><dt>Customer outcome</dt><dd>${esc(w.customerOutcome)}</dd>
      <dt>Supplier recovery</dt><dd>${esc(w.supplierRecovery)}</dd></dl>
     <p class="small muted" style="margin-top:8px">${esc(w.note)}</p>
     <div class="actions" style="margin-top:8px"><button type="button" class="link-button" data-action="open" data-kind="warranty" data-id="${esc(w.id)}">Open snapshot</button></div></div>`).join('')||''}
   </div>
  </div>
 </div>`;
}

function renderCaseCard(item){
 const orders=item.workOrders.map(id=>M.byId(M.workOrders,id)).filter(Boolean);
 const caseFindings=M.findings.filter(finding=>finding.case===item.id);
 return `<div style="padding:20px;border-bottom:1px solid var(--line-soft)">
  <div class="row between">
   <div>
    <div class="row" style="gap:8px">${statePill(item.state)}${pill('neutral',item.id)}
     ${caseFindings.some(f=>f.state.startsWith('Unresolved'))?pill('danger','Unresolved finding'):''}</div>
    <h3 style="margin:10px 0 4px;font-size:16px">${esc(item.title)}</h3>
    <p class="small muted" style="margin:0">Raised ${esc(date(item.raised))} · Owner ${esc(item.owner)} · Date needed ${esc(date(item.dateNeeded))}</p>
   </div>
   <div class="actions">
    <button type="button" data-action="open" data-kind="case" data-id="${esc(item.id)}">Open case snapshot</button>
   </div>
  </div>
  <div class="grid-two" style="margin-top:16px">
   <div>
   <dl class="detail-list">
    <dt>Customer-reported symptom</dt><dd>${esc(item.reportedSymptom)}</dd>
    <dt>Suspected cause</dt><dd>${esc(item.suspectedCause)}</dd>
    <dt>Verified finding</dt><dd>${item.verifiedFinding?esc(item.verifiedFinding):unknown('Not yet verified')}</dd>
    <dt>Agreed resolution</dt><dd>${item.agreedResolution?esc(item.agreedResolution):unknown('Not yet agreed')}</dd>
   </dl>
   <p class="small muted">These are four different statements. What the customer reported, what was suspected, what was verified on site and what has been agreed are never merged into one.</p>
   </div>
   <div>
    <h4>Work orders, visits and reports</h4>
    ${orders.length?orders.map(order=>{
     const apps=order.appointments.map(id=>M.byId(M.appointments,id)).filter(Boolean);
     const report=M.serviceReports.find(r=>r.workOrder===order.id);
     return `<div class="card" style="margin-bottom:10px"><div class="pad">
      <div class="row between"><strong style="font-weight:500">${esc(order.id)}</strong>${pill('info',order.state)}</div>
      <p class="small muted" style="margin:6px 0">${esc(order.title)} · authorised by ${esc(order.authorisedBy)} on ${esc(date(order.authorisedOn))}</p>
      ${apps.map(a=>`<p class="small">${icon('calendar')} ${esc(a.state)} — ${esc(dateTime(a.scheduled))} · ${esc(a.outcome)}</p>`).join('')}
      ${report?`<p class="small">${icon('file')} Report ${esc(report.id)} ${esc(report.revision)} — issued ${esc(date(report.issued))}, acknowledged ${esc(date(report.acknowledged))} by ${esc(report.acknowledgedBy)}</p>
       <p class="small muted">${esc(report.note)}</p>`:''}
      <p class="small muted">Billing state: ${esc(order.billingState)}</p>
     </div></div>`;}).join(''):'<p class="small muted">No work order has been authorised for this case.</p>'}
    ${caseFindings.length?`<h4 style="margin-top:14px">Findings</h4>
     <ul style="padding-left:18px;margin:0">${caseFindings.map(finding=>`<li class="small" style="margin-bottom:6px">
      <strong>${esc(finding.id)}</strong> — ${esc(finding.description)}<br>
      <span class="muted">${esc(finding.state)}${finding.dateNeeded?` · date needed ${esc(date(finding.dateNeeded))}`:''} · owner ${esc(finding.owner)}</span></li>`).join('')}</ul>`:''}
    ${item.nextAction?`<p class="next-action" style="margin-top:12px">${icon('flag')}<span><strong>Next action:</strong> ${esc(item.nextAction)}</span></p>`:''}
   </div>
  </div>
 </div>`;
}

/* ---------------------------------------------------------------- projects */

function renderProjects(){
 const all=M.projects.filter(project=>project.org===state.org);
 const shown=visibleProjects();
 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Projects</h2>
   <p>Delivery owner, exact site and area scope, milestones, variations, outstanding deliverables and customer commitments. Technical completion, customer acceptance and commercial closeout are three separate facts.</p></div>
 </div>
 <div class="card">
  ${toolbar('Search projects, milestones and owners')}
  ${filterBar('projects')}
  ${chipBar()}
  ${resultsBar(shown.length,all.length)}
  ${shown.length?shown.map(project=>`<div style="padding:20px;border-bottom:1px solid var(--line-soft)">
   <div class="row between">
    <div>
     <div class="row" style="gap:8px">${statePill(project.state)}${pill('neutral',project.id)}</div>
     <h3 style="margin:10px 0 4px;font-size:16px">${esc(project.title)}</h3>
     <p class="small muted" style="margin:0">Delivery owner ${esc(project.owner)} · ${esc((M.byId(M.sites,project.site)||{}).name)} · ${project.areas.map(id=>esc((M.byId(M.areas,id)||{}).name)).join(', ')}</p>
    </div>
    <div class="actions"><button type="button" data-action="open" data-kind="project" data-id="${esc(project.id)}">Open project snapshot</button></div>
   </div>
   <div class="grid-two" style="margin-top:16px">
    <div>
     <h4>Completion facts</h4>
     <dl class="detail-list">
      <dt>Technical completion</dt><dd>${project.technicalCompletion?esc(date(project.technicalCompletion)):unknown('Not reached')}</dd>
      <dt>Customer acceptance</dt><dd>${project.customerAcceptance?esc(date(project.customerAcceptance)):unknown('Not recorded')}</dd>
      <dt>Commercial closeout</dt><dd>${project.commercialCloseout?esc(date(project.commercialCloseout)):unknown('Outstanding')}</dd>
      <dt>Next milestone</dt><dd>${esc(project.nextMilestone)} — ${esc(date(project.nextMilestoneDue))}</dd>
      <dt>Customer commitments</dt><dd>${esc(project.commitments)}</dd>
     </dl>
    </div>
    <div>
     <h4>Deliverables</h4>
     <table class="lines-table"><thead><tr><th scope="col">Ref</th><th scope="col">Deliverable</th><th scope="col">State</th><th scope="col">Due</th></tr></thead>
      <tbody>${project.deliverables.map(d=>`<tr><td>${esc(d.ref)}</td><td>${esc(d.description)}</td><td>${esc(d.state)}</td><td>${esc(date(d.due))}</td></tr>`).join('')}</tbody></table>
     ${project.variations.length?`<h4 style="margin-top:14px">Variations</h4>
      <table class="lines-table"><thead><tr><th scope="col">Ref</th><th scope="col">Variation</th><th scope="col" class="numeric">Value</th><th scope="col">State</th></tr></thead>
       <tbody>${project.variations.map(v=>`<tr><td>${esc(v.ref)}</td><td>${esc(v.description)}</td>
        <td class="numeric">${esc(money(v.value,v.currency))}</td><td>${esc(v.state)}</td></tr>`).join('')}</tbody></table>
      <p class="no-total-note">Variation values are separate commercial items. They are not added to the project value, the order amounts or any invoice total here.</p>`:''}
    </div>
   </div>
  </div>`).join(''):emptyState('No projects match this scope','Adjust or clear the filters to widen the result.')}
 </div>`;
}

/* -------------------------------------------------------- sites & equipment */

function renderSites(){
 const sites=orgSites().filter(site=>!state.filters.site||site.id===state.filters.site);
 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Sites &amp; equipment</h2>
   <p>The organisation → site → facility/growing-area structure is reused from its owning design. An equipment item’s physical location and the growing areas it serves stay distinct, and no asset is duplicated here.</p></div>
 </div>
 ${sites.map(site=>{
  const areas=M.areas.filter(area=>area.site===site.id).filter(area=>!state.filters.area||area.id===state.filters.area);
  const assets=M.assets.filter(asset=>asset.site===site.id).filter(asset=>!state.filters.equipment||asset.id===state.filters.equipment);
  const siteOrders=visibleOrders().filter(order=>order.deliverySite===site.id);
  const siteCases=visibleCases().filter(item=>item.site===site.id);
  const siteProjects=visibleProjects().filter(project=>project.site===site.id);
  return `<div class="card space-bottom">
   <div class="card-head"><div><h2>${esc(site.name)}</h2>
    <p class="small muted" style="margin:4px 0 0">${esc(site.address)} · ${esc(site.timezone)}</p></div>
    ${pill('neutral','Synthetic address')}</div>
   <div class="pad grid-two">
    <div>
     <h3>Facilities and growing areas</h3>
     <table class="lines-table"><thead><tr><th scope="col">Reference</th><th scope="col">Name</th><th scope="col">Structure</th><th scope="col">Use</th><th scope="col">Within</th></tr></thead>
      <tbody>${areas.map(area=>`<tr><td>${esc(area.id)}</td><td>${esc(area.name)}</td><td>${esc(area.type)}</td><td>${esc(area.use)}</td>
       <td>${area.parent?esc((M.byId(M.areas,area.parent)||{}).name):'Directly on the site'}</td></tr>`).join('')
       ||'<tr><td colspan="5">No facility matches this scope.</td></tr>'}</tbody></table>
     <div class="link-list"><button type="button" class="link-chip" data-action="boundary" data-target="areas">${icon('layers')} Open the full hierarchy (CS-05)</button></div>
    </div>
    <div>
     <h3>Equipment</h3>
     ${assets.map(asset=>`<div class="card" style="margin-bottom:12px"><div class="pad">
      <div class="row between"><strong style="font-weight:500">${esc(asset.ref)}</strong>
       ${asset.warrantyState==='In warranty'?pill('success','In warranty'):pill('neutral','Warranty expired')}</div>
      <p class="small muted" style="margin:6px 0">${esc(asset.name)} · serial ${esc(asset.serial)}</p>
      <dl class="detail-list compact">
       <dt>Physical location</dt><dd>${esc((M.byId(M.areas,asset.installed)||{}).name)}</dd>
       <dt>Areas served</dt><dd>${asset.served.map(id=>esc((M.byId(M.areas,id)||{}).name)).join(', ')}</dd>
       <dt>Commissioned</dt><dd>${esc(date(asset.commissioned))}</dd>
       <dt>Warranty until</dt><dd>${esc(date(asset.warrantyUntil))}</dd>
      </dl>
      <p class="small muted" style="margin-top:8px">One asset identity. Where it sits and what it serves are different relationships; containment is not a service grouping.</p>
      <div class="link-list">
       <button type="button" class="link-chip" data-action="drill" data-view="cases" data-filter="${esc(JSON.stringify({equipment:asset.id}))}" data-label="${esc(asset.ref)}">${icon('service')} Service history</button>
       <button type="button" class="link-chip" data-action="boundary" data-target="equipment">${icon('equipment')} Equipment record (EQ-01)</button>
      </div>
     </div></div>`).join('')||'<p class="small muted">No equipment matches this scope.</p>'}
    </div>
   </div>
   <div class="related-row">
    <span class="label">Linked at this site</span>
    <button type="button" class="link-chip" data-action="drill" data-view="orders" data-filter="${esc(JSON.stringify({site:site.id}))}" data-label="${esc(site.name)}">${icon('sales')} ${siteOrders.length} order(s)</button>
    <button type="button" class="link-chip" data-action="drill" data-view="cases" data-filter="${esc(JSON.stringify({site:site.id}))}" data-label="${esc(site.name)}">${icon('service')} ${siteCases.length} case(s)</button>
    <button type="button" class="link-chip" data-action="drill" data-view="projects" data-filter="${esc(JSON.stringify({site:site.id}))}" data-label="${esc(site.name)}">${icon('projects')} ${siteProjects.length} project(s)</button>
    <button type="button" class="link-chip" data-action="boundary" data-target="readiness">${icon('flag')} Visit requirements (CS-06)</button>
   </div>
  </div>`;
 }).join('')||emptyState('No site matches this scope','Clear the site filter to see every site for this customer.')}`;
}

/* ---------------------------------------------------------------- accounts */

function renderAccounts(){
 if(!canFinance()){
  return `
  <div class="page-heading"><div><h2 id="main-heading" tabindex="-1">Accounts</h2>
   <p>Customer account observations from ${esc(M.erpConnection.provider)}.</p></div></div>
  <div class="card"><div class="pad">
   <div class="restricted">${icon('lock')}
    <div><strong>Finance visibility is not granted to the ${esc(role().name)} role in this demonstration.</strong>
    <p style="margin:8px 0 0">No amount, count, balance, badge or search result for this section is shown, because a withheld value must not be reconstructable from a summary elsewhere in the workspace. In the receiving application this is a server-enforced permission, not a hidden panel.</p></div>
   </div>
  </div></div>`;
 }
 const all=M.financeRecords.filter(record=>record.org===state.org);
 const shown=visibleFinance();
 const accounts=orgAccounts();
 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Accounts</h2>
   <p>Permitted ${esc(M.erpConnection.provider)} observations. Invoiced, paid, credited, disputed, unapplied and outstanding amounts stay separate; an order’s status never establishes that it is paid.</p></div>
 </div>

 <div class="grid-two space-bottom">
  ${accounts.map(account=>{
   const balance=M.accountBalance(account.id);
   const observation=M.observations.find(obs=>obs.feed==='Customer account'&&obs.account===account.id);
   return `<div class="card">
    <div class="card-head"><div><h3>${esc(account.code)}</h3>
     <p class="small muted" style="margin:4px 0 0">${esc((M.byId(M.erpCompanies,account.company)||{}).name)} · ${esc(account.currency)}</p></div>
     ${pill(M.observationState(observation).tone,M.observationState(observation).label)}</div>
    <div class="pad">
     <div class="money-block">
      <div class="money-cell"><dt>Account balance</dt>
       <dd class="${balance.amount===null?'unknown':''}">${balance.amount===null?'Not available':esc(money(balance.amount,balance.currency))}</dd></div>
     </div>
     <p class="small muted">${esc(balance.reason)}</p>
     <p class="small muted">Definitions for ageing, credit limits and open committed cost are <strong>not defined</strong> in this prototype and are shown as not comparable rather than calculated.</p>
    </div>
    ${sourceStrip(observation)}
   </div>`;}).join('')}
 </div>

 <div class="card space-bottom">
  ${toolbar('Search transactions, source statuses and linked orders')}
  ${filterBar('accounts')}
  ${chipBar()}
  ${resultsBar(shown.length,all.length,'Rows are source observations, not a derived ledger.')}
  ${shown.length?`
  <div class="register-wrap">
   <table class="register">
    <caption>Customer account transactions. Amounts are grouped by company and currency and are never consolidated.</caption>
    <thead><tr><th scope="col">Transaction</th><th scope="col">Type</th><th scope="col">Company / account</th>
     <th scope="col">Date / due</th><th scope="col" class="numeric">Original</th><th scope="col" class="numeric">Applied</th>
     <th scope="col" class="numeric">Remaining (source)</th><th scope="col">Source status</th></tr></thead>
    <tbody>${shown.map(record=>`<tr data-row-id="${esc(record.id)}" class="${state.selected&&state.selected.id===record.id?'is-selected':''}">
     <td><button type="button" class="record-link" data-action="open" data-kind="finance" data-id="${esc(record.id)}">${esc(record.id)}</button>
      ${record.order?`<span class="sub">Order ${esc(record.order)}</span>`:''}</td>
     <td>${esc(record.type)}</td>
     <td>${esc((M.byId(M.erpAccounts,record.account)||{}).code)}<span class="sub">${esc((M.byId(M.erpCompanies,record.company)||{}).name)}</span></td>
     <td>${esc(date(record.date))}<span class="sub">Due ${record.due?esc(date(record.due)):'not applicable'}</span></td>
     <td class="numeric">${esc(money(record.original,record.currency))}</td>
     <td class="numeric">${record.applied.length?record.applied.map(a=>`${esc(a.kind)} ${esc(M.money(a.amount,record.currency))}`).join('<br>'):unknown('None')}</td>
     <td class="numeric">${record.remaining===null?unknown('Not supplied'):esc(money(record.remaining,record.currency))}</td>
     <td>${statePill(record.sourceStatus)}</td>
    </tr>`).join('')}</tbody>
   </table>
  </div>
  <ul class="register-cards">${shown.map(record=>`<li class="register-card">
   <h3><button type="button" class="record-link" data-action="open" data-kind="finance" data-id="${esc(record.id)}">${esc(record.id)}</button></h3>
   ${statePill(record.sourceStatus)}
   <dl class="detail-list"><dt>Type</dt><dd>${esc(record.type)}</dd>
    <dt>Original</dt><dd>${esc(money(record.original,record.currency))}</dd>
    <dt>Remaining</dt><dd>${record.remaining===null?'Not supplied':esc(money(record.remaining,record.currency))}</dd></dl>
  </li>`).join('')}</ul>
  <div class="related-row" style="flex-direction:column;align-items:flex-start;gap:6px">
   <span class="label">Why no total is shown</span>
   <span class="small muted">Adding the visible rows would produce a number with no source authority: the AUD extraction is incomplete, one disputed invoice has no source-supplied remaining amount, unapplied cash and deposits are not invoice reductions, and the NZD account belongs to a different legal company.</span>
  </div>`
  :emptyState('No transactions match this scope','Adjust or clear the filters to widen the result.')}
 </div>`;
}

/* ------------------------------------------------------ activity & documents */

function renderActivity(){
 const all=M.activities.filter(entry=>entry.org===state.org);
 const shown=visibleActivities();
 const hiddenPrivate=all.filter(entry=>entry.private&&!canPrivate()).length;
 return `
 <div class="page-heading">
  <div><h2 id="main-heading" tabindex="-1">Activity &amp; documents</h2>
   <p>Linked emails, calls, meetings, activities, controlled documents and material business events. Reading an entry records nothing and completes no underlying business action.</p></div>
 </div>
 <div class="card">
  ${toolbar('Search subjects, authors, summaries and linked records')}
  ${filterBar('activity')}
  ${chipBar()}
  ${resultsBar(shown.length,all.length,hiddenPrivate?`${hiddenPrivate} private entry is withheld from this role and is not summarised or searchable.`:'')}
  ${shown.length?`<div class="pad"><ul class="timeline">${shown.map(entry=>`<li class="timeline-item">
   <div class="row" style="gap:8px">${pill('neutral',entry.kind)}${entry.private?pill('warning','Private'):''}
    ${entry.documentRevision?pill('info','Revision '+entry.documentRevision):''}</div>
   <h3 style="margin-top:8px">${esc(entry.subject)}</h3>
   <div class="when">${esc(dateTime(entry.when))} · ${esc(entry.author)} · ${esc(entry.direction)}</div>
   <p>${esc(entry.summary)}</p>
   <p class="small muted">Originating record: ${esc(entry.recordLabel||'Not linked')}</p>
   <div class="actions">
    <button type="button" class="link-button" data-action="open" data-kind="activity" data-id="${esc(entry.id)}">Open snapshot</button>
    ${entry.documentRevision?`<button type="button" class="link-button" data-action="boundary" data-target="documents">Open the controlled document register</button>`:''}
   </div>
  </li>`).join('')}</ul></div>`
  :emptyState('No activity matches this scope','Adjust or clear the filters to widen the result.')}
 </div>`;
}

/* ------------------------------------------------------------- snapshots */

function openSnapshot(kind,id){
 const dialog=q('#detail');
 const built=buildSnapshot(kind,id);
 if(!built) return;
 state.selected={kind,id};
 q('#detail-title').textContent=built.title;
 q('#detail-subtitle').textContent=built.subtitle;
 dialog.querySelector('.dialog-body').innerHTML=built.body;
 dialog.querySelector('.dialog-footer').innerHTML=`
  <span class="small muted">Snapshot of one record. Its owning module keeps the workflow and decisions.</span>
  <div class="actions">
   <button type="button" data-action="open-full" data-kind="${esc(kind)}" data-id="${esc(id)}">Open full record</button>
   <button type="button" class="primary" data-action="close-dialog">Close</button>
  </div>`;
 if(!dialog.open) dialog.show();
 dialog.setAttribute('aria-modal','false');
 window.PPOChoices&&window.PPOChoices.sync();
 q('#detail-title').focus({preventScroll:true});
 render(false);
}

function buildSnapshot(kind,id){
 switch(kind){
  case 'order':return orderSnapshot(id);
  case 'quotation':return quotationSnapshot(id);
  case 'opportunity':return opportunitySnapshot(id);
  case 'case':return caseSnapshot(id);
  case 'project':return projectSnapshot(id);
  case 'finance':return financeSnapshot(id);
  case 'activity':return activitySnapshot(id);
  case 'mapping':return mappingSnapshot(id);
  case 'warranty':return warrantySnapshot(id);
  case 'agreement':return agreementSnapshot(id);
  default:return null;
 }
}

function orderSnapshot(id){
 const order=M.byId(M.orders,id);
 if(!order) return null;
 const observation=M.observationFor(order.observation);
 const tone=M.observationState(observation);
 const account=M.byId(M.erpAccounts,order.account);
 const fulfilment=M.orderFulfilment(order);
 const totals=order.lines.reduce((acc,line)=>{
  for(const key of ['ordered','allocated','shipped','delivered','cancelled','returned','invoiced']){
   if(line[key]===null) acc.unknown[key]=true; else acc.sum[key]=(acc.sum[key]||0)+line[key];
  }
  return acc;
 },{sum:{},unknown:{}});
 const quantityCell=(label,key)=>`<div class="quantity-cell"><dt>${esc(label)}</dt>
  <dd class="${totals.unknown[key]?'unknown':''}">${totals.unknown[key]?'Not supplied':esc(String(totals.sum[key]||0))}</dd></div>`;

 return {
  title:order.id,
  subtitle:`${order.orderType} · ${account?account.code:'Unmapped account'} · ${(M.byId(M.erpCompanies,order.company)||{}).name||''}`,
  body:`
  ${order.stale?`<div class="source-banner danger">${icon('alert')}<div>
    <p><strong>This order detail is stale.</strong> The last successful observation was ${esc(dateTime(observation.observedAt))}. The refresh on ${esc(dateTime(observation.requestedAt))} failed.</p>
    <p>${esc(observation.error)}</p>
    <p>Last-good values are retained and labelled. Fulfilment beyond the ordered quantity is unknown, not zero.</p>
    <div class="actions"><button type="button" data-action="refresh-source" data-id="${esc(order.id)}">Request a source refresh</button></div>
   </div></div>`:''}
  ${order.unresolved?`<div class="source-banner danger">${icon('alert')}<div>
    <p><strong>No confirmed customer mapping.</strong> This order was returned under source account ${esc(account.code)}, which resembles a customer name but has no mapping record.</p>
    <p>It is not attributed to a customer and is excluded from every count and total.</p></div></div>`:''}
  ${order.hold?`<div class="source-banner">${icon('alert')}<div><p><strong>Source-reported hold.</strong> ${esc(order.hold)}</p>
    <p>The hold is reported by the source. No release, cancellation or override action exists in this design.</p></div></div>`:''}

  <h3>Identity and source</h3>
  <dl class="detail-list">
   <dt>Source system</dt><dd>${esc(M.erpConnection.provider)} — ${esc(M.erpConnection.mode)}</dd>
   <dt>Company / entity</dt><dd>${esc((M.byId(M.erpCompanies,order.company)||{}).name)}</dd>
   <dt>Customer account</dt><dd>${account?`${esc(account.code)} — ${esc(account.name)} ${account.mapping==='Confirmed'?'(mapping confirmed '+esc(date(account.effectiveFrom))+')':'(no confirmed mapping)'}`:'Not supplied'}</dd>
   <dt>ERP order reference</dt><dd>${esc(order.id)}</dd>
   <dt>Order type</dt><dd>${esc(order.orderType)}</dd>
   <dt>Customer purchase order</dt><dd>${esc(order.customerPo||'Not supplied')}</dd>
   <dt>Order date</dt><dd>${esc(date(order.orderDate))}</dd>
   <dt>Source-reported status</dt><dd>${esc(order.sourceStatusRaw)} ${order.cancelledOn?`· cancelled ${esc(date(order.cancelledOn))} · ${esc(order.cancelReason)}`:''}</dd>
  </dl>

  <h3>Related records</h3>
  <dl class="detail-list">
   <dt>Accepted quotation</dt><dd>${order.quotation?`${esc(order.quotation)} revision ${esc(order.quotationRevision)}`:'No linked quotation in the source record'}</dd>
   <dt>Opportunity</dt><dd>${order.opportunity?esc(order.opportunity):'Not linked'}</dd>
   <dt>Project</dt><dd>${order.project?esc(order.project):'Not linked'}</dd>
   <dt>Service record</dt><dd>${order.serviceRecord?esc(order.serviceRecord):'Not linked'}</dd>
  </dl>
  <div class="link-list">
   ${order.quotation?`<button type="button" class="link-chip" data-action="open" data-kind="quotation" data-id="${esc(order.quotation==='SYN-PPO-QUO-000318'?'SYN-PPO-QUO-000318':order.quotation)}">${icon('estimate')} Open quotation</button>`:''}
   ${order.project?`<button type="button" class="link-chip" data-action="open" data-kind="project" data-id="${esc(order.project)}">${icon('projects')} Open project</button>`:''}
   ${order.serviceRecord?`<button type="button" class="link-chip" data-action="open" data-kind="case" data-id="${esc(order.serviceRecord)}">${icon('service')} Open case</button>`:''}
  </div>

  <h3>Delivery destination</h3>
  <dl class="detail-list">
   <dt>Address</dt><dd>${esc(order.deliveryAddress)}</dd>
   <dt>Linked site</dt><dd>${order.deliverySite?esc((M.byId(M.sites,order.deliverySite)||{}).name):'No site relationship exists for this order'}</dd>
   <dt>Linked growing areas</dt><dd>${order.deliveryAreas.length?order.deliveryAreas.map(a=>esc((M.byId(M.areas,a)||{}).name)).join(', '):'None recorded'}</dd>
  </dl>

  <h3>Commercial values</h3>
  <div class="money-block">
   <div class="money-cell"><dt>Order amount (ex tax)</dt><dd>${esc(money(order.orderAmountExTax,order.currency))}</dd></div>
   <div class="money-cell"><dt>Tax (source-reported)</dt><dd>${esc(money(order.taxAmount,order.currency))}</dd></div>
   <div class="money-cell"><dt>Order amount (inc tax)</dt><dd>${esc(money(order.orderAmountIncTax,order.currency))}</dd></div>
   <div class="money-cell"><dt>Freight</dt><dd class="${order.freight===null?'unknown':''}">${order.freight===null?'Not supplied':esc(money(order.freight,order.currency))}</dd></div>
   <div class="money-cell"><dt>Discount</dt><dd class="${order.discount===null?'unknown':''}">${order.discount===null?'Not supplied':esc(money(order.discount,order.currency))}</dd></div>
  </div>
  <p class="small muted">Currency ${esc(order.currency)} · tax basis ${esc(order.taxBasis)}. The tax basis is the value the source reports; its definition is awaiting validation and no tax is calculated here.</p>

  <h3>Dates</h3>
  <dl class="detail-list">
   <dt>Requested delivery</dt><dd>${esc(date(order.requestedDelivery))}</dd>
   <dt>Confirmed delivery</dt><dd>${order.confirmedDelivery?esc(date(order.confirmedDelivery)):'Not supplied'}</dd>
   <dt>Expected delivery</dt><dd>${order.expectedDelivery?esc(date(order.expectedDelivery)):'Not supplied'}</dd>
  </dl>
  <p class="small muted">Requested, confirmed and expected are three distinct values. A missing expected date stays missing; the requested date is not substituted for it.</p>

  <h3>Fulfilment</h3>
  <p class="small">${fulfilment.determinable
   ?`${fulfilment.outstandingLines} of ${fulfilment.lines} line(s) have an outstanding balance of supply.`
   :`Not determinable — ${fulfilment.unknown} of ${fulfilment.lines} line(s) have no source-supplied shipped quantity.`}</p>
  <dl class="quantity-key">
   ${quantityCell('Ordered','ordered')}${quantityCell('Allocated','allocated')}${quantityCell('Shipped','shipped')}
   ${quantityCell('Delivered','delivered')}${quantityCell('Cancelled','cancelled')}${quantityCell('Returned','returned')}${quantityCell('Invoiced','invoiced')}
  </dl>
  <p class="small muted">Ordered, allocated, shipped, delivered, cancelled, returned and invoiced are separate measures. They are summed only within one measure and only across lines that share a unit; a line with an unknown value makes that measure unknown rather than zero.</p>

  <h3>Lines</h3>
  <table class="lines-table">
   <thead><tr><th scope="col">Line</th><th scope="col">Item</th><th scope="col">Unit</th>
    <th scope="col" class="numeric">Ordered</th><th scope="col" class="numeric">Shipped</th>
    <th scope="col" class="numeric">Invoiced</th><th scope="col" class="numeric">Outstanding</th>
    <th scope="col">References</th></tr></thead>
   <tbody>${order.lines.map(line=>{
    const outstanding=M.lineOutstanding(line);
    return `<tr>
     <td>${esc(line.line)}</td>
     <td>${esc(line.description)}<span class="sub">${line.product?esc(line.product):'One-off description — no catalogue product'}${line.area?` · ${esc((M.byId(M.areas,line.area)||{}).name)}`:''}</span></td>
     <td>${esc(line.unit)}</td>
     <td class="numeric">${line.ordered===null?unknown('—'):esc(M.quantity(line.ordered,line.unit))}</td>
     <td class="numeric">${line.shipped===null?unknown('Not supplied'):esc(M.quantity(line.shipped,line.unit))}</td>
     <td class="numeric">${line.invoiced===null?unknown('Not supplied'):esc(M.quantity(line.invoiced,line.unit))}</td>
     <td class="numeric">${outstanding===null?unknown('Unknown'):esc(M.quantity(outstanding,line.unit))}</td>
     <td class="small">${line.shipment?`Shipment ${esc(line.shipment)}<br>`:''}${line.invoice?`Invoice ${esc(line.invoice)}`:'No invoice recorded'}</td>
    </tr>`;}).join('')}</tbody>
  </table>
  <p class="small muted">Unit prices are the source-reported values for each line: ${order.lines.map(line=>`${esc(line.line)} ${line.price===null?'not supplied':esc(M.money(line.price,order.currency))}`).join(' · ')}.</p>

  <h3>Accepted quotation basis</h3>
  <p class="small">${esc(order.comparison.basis)}</p>
  ${order.comparison.differences.length?`<div class="source-banner">${icon('alert')}<div>
    <p><strong>The order differs from the accepted quotation.</strong></p>
    <ul style="margin:6px 0 0;padding-left:18px">${order.comparison.differences.map(diff=>`<li class="small">Line ${esc(diff.line)} — ${esc(diff.field)}: accepted ${esc(diff.quoted)}, ordered ${esc(diff.ordered)}. ${esc(diff.note)}</li>`).join('')}</ul>
   </div></div>`
  :`<p class="small muted">No mapped difference is reported between the accepted quotation and this order. The accepted basis is retained separately from any later change made in the source.</p>`}

  ${sourceStrip(observation)}
  <p class="small muted" style="margin-top:12px">Observation state: ${esc(tone.label)}. This design offers no ERP edit, release, cancellation, payment or fulfilment action.</p>
  ${notesBlock(order.id,'Sales order '+order.id)}`
 };
}

function quotationSnapshot(id){
 const quote=M.byId(M.quotations,id);
 if(!quote) return null;
 return {title:(quote.displayRef||quote.id)+' '+quote.revision,
  subtitle:`Quotation · ${quote.state} · owner ${quote.owner}`,
  body:`
  ${quote.conversion==='Unknown'?`<div class="source-banner danger">${icon('alert')}<div>
    <p><strong>Accepted, but the conversion outcome is unknown.</strong></p>
    <p>${esc(quote.conversionNote)}</p>
    <p>This record is not an ERP order and is never counted as one. Conversion and recovery belong to ES-07; this workspace links to it rather than repeating it.</p>
    <div class="actions"><button type="button" data-action="boundary" data-target="es07">Open item resolution and conversion (ES-07)</button></div>
   </div></div>`:''}
  <h3>State and response</h3>
  <dl class="detail-list">
   <dt>State</dt><dd>${esc(quote.state)}</dd>
   <dt>Issued</dt><dd>${esc(date(quote.issued))}</dd>
   <dt>Sent</dt><dd>${esc(date(quote.sent))}</dd>
   <dt>Delivered</dt><dd>${esc(date(quote.delivered))}</dd>
   <dt>Customer response</dt><dd>${quote.responded?`${esc(date(quote.responded))} — ${esc(quote.customerResponse)}`:'No response recorded'}</dd>
   <dt>Value</dt><dd>${esc(money(quote.value,quote.currency))}</dd>
   <dt>Conversion</dt><dd>${esc(quote.conversion)}${quote.order?` — ${esc(quote.order)}`:''}</dd>
   <dt>Next action</dt><dd>${quote.nextAction?esc(quote.nextAction):'None recorded'}${quote.nextActionDue?` (by ${esc(date(quote.nextActionDue))})`:''}</dd>
  </dl>
  <p class="small muted">Approval, issue, sent, delivered and acknowledged are distinct facts. Changed content requires a new revision and does not inherit an earlier response.</p>
  ${quote.order?`<div class="link-list"><button type="button" class="link-chip" data-action="open" data-kind="order" data-id="${esc(quote.order)}">${icon('sales')} Open the linked ERP order</button></div>`:''}
  ${quote.estimate?`<h3>Estimate basis</h3><p class="small">${esc(quote.estimate)} — alternative options on one estimate are mutually exclusive and are never totalled.</p>`:''}
  ${notesBlock(quote.id,'Quotation '+(quote.displayRef||quote.id))}`};
}

function opportunitySnapshot(id){
 const opp=M.byId(M.opportunities,id);
 if(!opp) return null;
 return {title:opp.id,subtitle:`${opp.title} · ${opp.stage}`,
  body:`<dl class="detail-list">
   <dt>Stage</dt><dd>${esc(opp.stage)}</dd><dt>Owner</dt><dd>${esc(opp.owner)}</dd>
   <dt>Opened</dt><dd>${esc(date(opp.opened))}</dd>
   <dt>Site</dt><dd>${esc((M.byId(M.sites,opp.site)||{}).name||'Not linked')}</dd>
   <dt>Areas</dt><dd>${opp.areas.map(a=>esc((M.byId(M.areas,a)||{}).name)).join(', ')||'None recorded'}</dd>
   <dt>Forecast value</dt><dd>${opp.value===null?'Not estimated':esc(money(opp.value,opp.currency))}</dd>
   <dt>Next action</dt><dd>${esc(opp.nextAction)}${opp.nextActionDue?` (by ${esc(date(opp.nextActionDue))})`:''}</dd>
  </dl>
  <p class="small muted">A forecast value is not an order, an invoice or a payment. It is never added to them.</p>
  ${notesBlock(opp.id,'Opportunity '+opp.id)}`};
}

function caseSnapshot(id){
 const item=M.byId(M.cases,id);
 if(!item) return null;
 const caseFindings=M.findings.filter(finding=>finding.case===item.id);
 return {title:item.id,subtitle:`${item.title} · ${item.state}`,
  body:`<dl class="detail-list">
   <dt>State</dt><dd>${esc(item.state)}</dd>
   <dt>Raised</dt><dd>${esc(date(item.raised))}</dd>
   <dt>Owner</dt><dd>${esc(item.owner)}</dd>
   <dt>Date needed</dt><dd>${esc(date(item.dateNeeded))}</dd>
   <dt>Site</dt><dd>${esc((M.byId(M.sites,item.site)||{}).name||'Not linked')}</dd>
   <dt>Equipment</dt><dd>${item.asset?esc(`${item.asset} — ${(M.byId(M.assets,item.asset)||{}).name}`):'None linked'}</dd>
   <dt>Customer-reported symptom</dt><dd>${esc(item.reportedSymptom)}</dd>
   <dt>Suspected cause</dt><dd>${esc(item.suspectedCause)}</dd>
   <dt>Verified finding</dt><dd>${item.verifiedFinding?esc(item.verifiedFinding):'Not yet verified'}</dd>
   <dt>Agreed resolution</dt><dd>${item.agreedResolution?esc(item.agreedResolution):'Not yet agreed'}</dd>
  </dl>
  <p class="small muted">${esc(item.priorityNote)} Reported symptom, suspected cause, verified finding and agreed resolution are four different statements and stay distinguishable.</p>
  ${caseFindings.length?`<h3>Findings</h3><ul style="padding-left:18px">${caseFindings.map(finding=>`<li class="small" style="margin-bottom:8px">
   <strong>${esc(finding.id)}</strong> — ${esc(finding.description)}<br><span class="muted">${esc(finding.state)} · owner ${esc(finding.owner)}${finding.dateNeeded?` · date needed ${esc(date(finding.dateNeeded))}`:''}</span></li>`).join('')}</ul>`:''}
  ${item.nextAction?`<p class="next-action">${icon('flag')}<span><strong>Next action:</strong> ${esc(item.nextAction)}</span></p>`:''}
  ${notesBlock(item.id,'Case '+item.id)}`};
}

function projectSnapshot(id){
 const project=M.byId(M.projects,id);
 if(!project) return null;
 return {title:project.id,subtitle:`${project.title} · ${project.state}`,
  body:`<dl class="detail-list">
   <dt>Delivery owner</dt><dd>${esc(project.owner)}</dd>
   <dt>Site</dt><dd>${esc((M.byId(M.sites,project.site)||{}).name)}</dd>
   <dt>Area scope</dt><dd>${project.areas.map(a=>esc((M.byId(M.areas,a)||{}).name)).join(', ')}</dd>
   <dt>Technical completion</dt><dd>${project.technicalCompletion?esc(date(project.technicalCompletion)):'Not reached'}</dd>
   <dt>Customer acceptance</dt><dd>${project.customerAcceptance?esc(date(project.customerAcceptance)):'Not recorded'}</dd>
   <dt>Commercial closeout</dt><dd>${project.commercialCloseout?esc(date(project.commercialCloseout)):'Outstanding'}</dd>
   <dt>Next milestone</dt><dd>${esc(project.nextMilestone)} — ${esc(date(project.nextMilestoneDue))}</dd>
   <dt>Customer commitments</dt><dd>${esc(project.commitments)}</dd>
  </dl>
  <p class="small muted">Technical completion, customer acceptance and commercial closeout are three separate facts. None of them implies another.</p>
  ${notesBlock(project.id,'Project '+project.id)}`};
}

function financeSnapshot(id){
 const record=M.byId(M.financeRecords,id);
 if(!record||!canFinance()) return null;
 return {title:record.id,subtitle:`${record.type} · ${record.sourceStatus}`,
  body:`<dl class="detail-list">
   <dt>Company</dt><dd>${esc((M.byId(M.erpCompanies,record.company)||{}).name)}</dd>
   <dt>Account</dt><dd>${esc((M.byId(M.erpAccounts,record.account)||{}).code)}</dd>
   <dt>Currency</dt><dd>${esc(record.currency)}</dd>
   <dt>Date</dt><dd>${esc(date(record.date))}</dd>
   <dt>Due date</dt><dd>${record.due?esc(date(record.due)):'Not applicable'}</dd>
   <dt>Original amount</dt><dd>${esc(money(record.original,record.currency))}</dd>
   <dt>Applied</dt><dd>${record.applied.length?record.applied.map(a=>`${esc(a.kind)} ${esc(a.ref)} — ${esc(M.money(a.amount,record.currency))}`).join('<br>'):'None'}</dd>
   <dt>Remaining (source)</dt><dd>${record.remaining===null?'Not supplied by the source':esc(money(record.remaining,record.currency))}</dd>
   <dt>Linked order</dt><dd>${record.order?esc(record.order):'Not linked'}</dd>
   <dt>Source as at</dt><dd>${esc(dateTime((M.observationFor(record.observation)||{}).sourceAsAt))}</dd>
  </dl>
  <p class="small muted">${esc(record.note)}</p>
  <p class="small muted">An order’s status never establishes that it is paid. Invoiced, paid, credited, disputed, unapplied and outstanding amounts stay separate.</p>
  ${record.order?`<div class="link-list"><button type="button" class="link-chip" data-action="open" data-kind="order" data-id="${esc(record.order)}">${icon('sales')} Open the linked order</button></div>`:''}`};
}

function activitySnapshot(id){
 const entry=M.activities.find(a=>a.id===id);
 if(!entry) return null;
 if(entry.private&&!canPrivate()) return null;
 return {title:entry.subject,subtitle:`${entry.kind} · ${dateTime(entry.when)}`,
  body:`<dl class="detail-list">
   <dt>Type</dt><dd>${esc(entry.kind)}</dd>
   <dt>Author / source</dt><dd>${esc(entry.author)}</dd>
   <dt>Direction</dt><dd>${esc(entry.direction)}</dd>
   <dt>Event date</dt><dd>${esc(dateTime(entry.when))}</dd>
   <dt>Originating record</dt><dd>${esc(entry.recordLabel||'Not linked')}</dd>
   ${entry.documentRevision?`<dt>Document revision</dt><dd>${esc(entry.documentRevision)}</dd>`:''}
  </dl>
  <p class="small">${esc(entry.summary)}</p>
  <div class="boundary-note">Reading this entry completes nothing. The underlying business action stays with its owning module, and the controlled document register remains the single document master.</div>`};
}

function mappingSnapshot(id){
 const account=M.byId(M.erpAccounts,id);
 if(!account) return null;
 const affected=M.orders.filter(order=>order.account===id);
 return {title:account.code,subtitle:'Source account with no confirmed customer mapping',
  body:`<div class="source-banner danger">${icon('alert')}<div>
   <p><strong>No confirmed mapping exists.</strong> ${esc(account.note||'')}</p></div></div>
  <dl class="detail-list">
   <dt>Source account code</dt><dd>${esc(account.code)}</dd>
   <dt>Source account name</dt><dd>${esc(account.name)}</dd>
   <dt>Company / entity</dt><dd>${esc((M.byId(M.erpCompanies,account.company)||{}).name)}</dd>
   <dt>Currency</dt><dd>${esc(account.currency)}</dd>
   <dt>Mapping state</dt><dd>Unresolved — no effective date, no mapping record and no confirming owner</dd>
   <dt>Affected source records</dt><dd>${affected.map(o=>esc(o.id)).join(', ')||'None'}</dd>
  </dl>
  <p class="small muted">A similar name and a similar displayed order number are not evidence of identity. Matching requires the confirmed internal identity, provider, company and account key together.</p>
  <div class="boundary-note">Resolving or rejecting this mapping belongs to <strong>AD-05 external mapping and reconciliation detail</strong>. No mapping decision is made from Customer 360.</div>`};
}

function warrantySnapshot(id){
 const warranty=M.byId(M.warrantyCases,id);
 if(!warranty) return null;
 return {title:warranty.id,subtitle:warranty.title,
  body:`<dl class="detail-list">
   <dt>State</dt><dd>${esc(warranty.state)}</dd>
   <dt>Equipment</dt><dd>${esc(`${warranty.asset} — ${(M.byId(M.assets,warranty.asset)||{}).name}`)}</dd>
   <dt>Raised</dt><dd>${esc(date(warranty.raised))}</dd>
   <dt>Owner</dt><dd>${esc(warranty.owner)}</dd>
   <dt>Customer outcome</dt><dd>${esc(warranty.customerOutcome)}</dd>
   <dt>Supplier recovery</dt><dd>${esc(warranty.supplierRecovery)}</dd>
   <dt>Date needed</dt><dd>${esc(date(warranty.dateNeeded))}</dd>
  </dl>
  <p class="small muted">${esc(warranty.note)}</p>
  ${notesBlock(warranty.id,'Warranty case '+warranty.id)}`};
}

function agreementSnapshot(id){
 const agreement=M.byId(M.agreements,id);
 if(!agreement) return null;
 return {title:agreement.id,subtitle:agreement.title,
  body:`<dl class="detail-list">
   <dt>State</dt><dd>${esc(agreement.state)}</dd>
   <dt>Site</dt><dd>${esc((M.byId(M.sites,agreement.site)||{}).name)}</dd>
   <dt>Coverage</dt><dd>${esc(agreement.coverage)}</dd>
   <dt>Next occurrence</dt><dd>${esc(date(agreement.nextOccurrence))}</dd>
   <dt>Renewal due</dt><dd>${esc(date(agreement.renewalDue))}</dd>
   <dt>Owner</dt><dd>${esc(agreement.owner)}</dd>
  </dl><p class="small muted">${esc(agreement.note)}</p>
  ${notesBlock(agreement.id,'Agreement '+agreement.id)}`};
}

function notesBlock(recordId,label){
 const notes=state.notes[recordId]||[];
 return `<h3>Internal follow-up notes</h3>
 <p class="small muted">A Powerplants-owned note about this record. It is not sent anywhere, it changes no source record, and it is kept in this browser only.</p>
 ${notes.length?`<ul style="padding-left:18px;margin:10px 0">${notes.map(note=>`<li class="small" style="margin-bottom:6px">${esc(note.text)}
  <br><span class="muted">${esc(note.author)} · ${esc(dateTime(note.at))}</span></li>`).join('')}</ul>`
  :'<p class="small muted">No note recorded.</p>'}
 <div class="actions"><button type="button" data-action="add-note" data-id="${esc(recordId)}" data-label="${esc(label)}">Add internal note</button></div>`;
}

/* --------------------------------------------------- boundaries and editors */

const BOUNDARIES={
 sites:{title:'Sites',route:'/customers/{organisationId}/sites',owner:'CS-04 — Site register and site workspace',
  file:'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'},
 areas:{title:'Facilities & growing areas',route:'/customers/{organisationId}/sites/{siteId}/areas',owner:'CS-05 — Facilities and growing areas',
  file:'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'},
 equipment:{title:'Equipment links',route:'/equipment/{assetId}',owner:'EQ-01 / EQ-03 — Installed base and configuration history',
  file:'docs/reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html'},
 readiness:{title:'Visit requirements',route:'/customers/{organisationId}/sites/{siteId}/readiness',owner:'CS-06 — Site access and horticultural readiness',
  file:'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'},
 es07:{title:'Item resolution and conversion',route:'/estimating/quotations/{quotationId}/conversion',owner:'ES-07 — One-off item resolution and conversion',
  file:'Open contribution — not on the default branch at the time this design was prepared'},
 documents:{title:'Controlled document register',route:'/documents',owner:'DK-01 / DK-02 — Document register and viewer',
  file:'No repository HTML design exists for this family yet'},
 order:{title:'Sales order',route:'MYOB Acumatica order record',owner:'MYOB Acumatica — ERP authority',
  file:'Not a Powerplants One route. The ERP owns the order record and its operations.'},
 finance:{title:'Customer account transaction',route:'MYOB Acumatica transaction record',owner:'MYOB Acumatica — ERP authority',
  file:'Not a Powerplants One route. The ERP owns the financial record.'},
 mapping:{title:'External mapping and reconciliation',route:'/administration/integration/mappings',owner:'AD-05 — External mapping and reconciliation detail',
  file:'No repository HTML design exists for this family yet'},
 quotation:{title:'Quotation',route:'/estimating/quotations/{quotationId}',owner:'ES-05 / ES-06 — Quotation approval, issue, response and negotiation',
  file:'Open contribution — not on the default branch at the time this design was prepared'},
 opportunity:{title:'Opportunity',route:'/crm/opportunities/{opportunityId}',owner:'CR-01 — Opportunity detail and internal work',
  file:'Implemented route in the application; not reachable from this standalone file'},
 case:{title:'Service case',route:'/service/tickets/{ticketId}',owner:'SV-01 / SV-02 — Service desk, triage and request detail',
  file:'docs/reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html'},
 project:{title:'Project',route:'/projects/{projectId}',owner:'PJ-01 / PJ-03 — Project initiation and schedule',
  file:'docs/reference/ui/projects/ppo-projects-gantt-content-r10.html'},
 activity:{title:'Activity entry',route:'/work/activities/{activityId}',owner:'EC-01 / SH-02 — Connected inbox and My Work',
  file:'docs/reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html'},
 warranty:{title:'Warranty case',route:'/service/warranty/{caseId}',owner:'MA-06 / MA-07 — Warranty and supplier recovery',
  file:'docs/reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html'},
 agreement:{title:'Service agreement',route:'/service/agreements/{agreementId}',owner:'MA-01 — Agreement register and detail',
  file:'docs/reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html'}
};

function openBoundary(target){
 const boundary=BOUNDARIES[target];
 if(!boundary) return;
 const dialog=q('#decision');
 q('#decision-title').textContent=boundary.title;
 q('#decision-subtitle').textContent='Receiving boundary — this standalone design does not navigate there';
 dialog.querySelector('.dialog-body').innerHTML=`
  <p>Customer 360 is a coordinated view. This record’s workflow and decisions stay with its owning module, and nothing here creates a second master for it.</p>
  <dl class="detail-list">
   <dt>Owning design</dt><dd>${esc(boundary.owner)}</dd>
   <dt>Intended route</dt><dd><code>${esc(boundary.route)}</code></dd>
   <dt>Where it lives</dt><dd>${esc(boundary.file)}</dd>
  </dl>
  <div class="boundary-note">This button is a labelled boundary rather than a dead control or an invented destination. In the receiving application it becomes the ordinary full-record route; in this standalone file there is nowhere to navigate to.</div>`;
 dialog.querySelector('.dialog-footer').innerHTML=`
  <span class="small muted">No action is taken.</span>
  <div class="actions"><button type="button" class="primary" data-action="close-dialog">Close</button></div>`;
 if(!dialog.open) dialog.showModal();
 q('#decision-title').focus({preventScroll:true});
}

function openNoteEditor(recordId,label){
 const dialog=q('#editor');
 q('#editor-title').textContent='Add internal note';
 q('#editor-subtitle').textContent=label;
 dialog.querySelector('.dialog-body').innerHTML=`
  <div id="form-errors" class="callout danger form-error" role="alert" hidden></div>
  <div class="field">
   <label for="note-text">Note</label>
   <textarea id="note-text" aria-describedby="note-hint"></textarea>
   <span class="hint" id="note-hint">Internal only. This is a Powerplants record about the customer’s record; it is not sent to the customer and it changes nothing in MYOB.</span>
  </div>
  <div class="field">
   <label for="note-author">Recorded by</label>
   <input id="note-author" value="${esc(org().owner)}">
  </div>`;
 dialog.querySelector('.dialog-footer').innerHTML=`
  <span class="small muted">${state.storage==='session-only'?'Browser storage is unavailable; this stays in this tab.':'Saved in this browser only.'}</span>
  <div class="actions">
   <button type="button" data-action="close-dialog">Cancel</button>
   <button type="button" class="primary" data-action="save-note" data-id="${esc(recordId)}">Save note</button>
  </div>`;
 if(!dialog.open) dialog.showModal();
 q('#editor-title').focus({preventScroll:true});
}

function saveNote(recordId){
 const textField=q('#note-text'),authorField=q('#note-author'),errors=q('#form-errors');
 const text=(textField.value||'').trim();
 if(!text){
  errors.hidden=false;
  errors.textContent='Enter the note text before saving. Nothing has been changed.';
  textField.setAttribute('aria-invalid','true');
  textField.focus();
  return;
 }
 textField.setAttribute('aria-invalid','false');
 const list=state.notes[recordId]||[];
 list.unshift({id:'N'+Date.now(),text,author:(authorField.value||'').trim()||'Not recorded',at:M.TODAY+'T00:00'});
 state.notes[recordId]=list;
 const result=writeStorage();
 q('#editor').close();
 storageNotice();
 toast(result.saved
  ?'Note saved in this browser.'
  :result.reason==='retained'
   ?'Saved in this tab only. The existing stored bytes could not be validated and have been left untouched.'
   :'Saved in this tab only. Browser storage refused the write, so this note may not survive a reload.');
 if(state.selected) openSnapshot(state.selected.kind,state.selected.id); else render();
}

function toast(message){
 const element=q('#toast');
 element.textContent=message;
 element.hidden=false;
 window.clearTimeout(toast.timer);
 toast.timer=window.setTimeout(()=>{element.hidden=true;},6000);
}

function openAbout(){
 const dialog=q('#detail');
 state.selected=null;
 q('#detail-title').textContent='About this design';
 q('#detail-subtitle').textContent='CS-01 Customer 360 · r01 · synthetic demonstration';
 dialog.querySelector('.dialog-body').innerHTML=`
  <p>This is a standalone Powerplants One design for <strong>CS-01 — Customer register and customer 360</strong>, extending the Customers, Sites &amp; Growing Areas workspace. It is not application functionality.</p>
  <h3>What is real here</h3>
  <p class="small">The interaction is real: filters, search, drill-through, return navigation, record snapshots, role scoping and internal notes all work in this file. The data is entirely fictional and every ERP interface is simulated.</p>
  <h3>Demonstration role</h3>
  <div class="field">
   <label for="demo-role">Role (demonstration only)</label>
   <select id="demo-role">${M.roles.map(r=>`<option value="${esc(r.id)}"${state.role===r.id?' selected':''}>${esc(r.name)}</option>`).join('')}</select>
   <span class="hint">${esc(role().note)}</span>
  </div>
  <div class="boundary-note">Switching role here changes presentation only. It is <strong>not</strong> security: the embedded data remains inspectable in the page source. Server-enforced permissions, Finance visibility and private-communication rules are receiving-application obligations.</div>
  <h3>Customer context</h3>
  <div class="field">
   <label for="demo-customer">Customer</label>
   <select id="demo-customer">${M.organisations.map(o=>`<option value="${esc(o.id)}"${state.org===o.id?' selected':''}>${esc(o.name)}</option>`).join('')}</select>
   <span class="hint">Switching customer clears filters, search, the return stack and any open snapshot, so no record from the previous customer can remain on screen.</span>
  </div>
  <h3>Boundaries</h3>
  <ul style="padding-left:18px" class="small">
   <li>MYOB Acumatica remains the authority for ERP order and account information. Live integration is outstanding.</li>
   <li>No ERP edit, release, cancellation, payment or fulfilment action exists in this design.</li>
   <li>Conversion and recovery belong to ES-07; this workspace links to that design rather than recreating it.</li>
   <li>Browser storage holds internal notes for this browser only. It is not a server record and can be refused entirely.</li>
  </ul>`;
 dialog.querySelector('.dialog-footer').innerHTML=`
  <span class="small muted">${M.erpConnection.mode}</span>
  <div class="actions"><button type="button" class="primary" data-action="close-dialog">Close</button></div>`;
 if(!dialog.open) dialog.show();
 dialog.setAttribute('aria-modal','false');
 window.PPOChoices&&window.PPOChoices.sync();
 q('#detail-title').focus({preventScroll:true});
}

/* ---------------------------------------------------------------- render */

function render(focusHeading){
 const views=availableViews();
 if(!views.some(view=>view.id===state.view)) state.view='overview';

 const tabs=q('#workspace-tabs');
 tabs.innerHTML=views.map(view=>{
  const selected=view.id===state.view;
  return `<button type="button" role="tab" id="tab-${view.id}" aria-controls="content" aria-selected="${selected}" tabindex="${selected?0:-1}" data-action="navigate" data-view="${view.id}">
   ${icon(view.icon)}<span>${esc(view.label)}</span></button>`;
 }).join('');
 q('#content').setAttribute('aria-labelledby','tab-'+state.view);

 const selector=q('#customer-selector');
 selector.innerHTML=M.organisations.map(o=>`<option value="${esc(o.id)}"${state.org===o.id?' selected':''}>${esc(o.name)}</option>`).join('');
 q('#organisation-name').textContent=org().name;
 q('#role-indicator').textContent=role().name+' · '+(canFinance()?'Finance visible':'Finance withheld');

 const body={overview:renderOverview,deals:renderDeals,orders:renderOrders,cases:renderCases,
  projects:renderProjects,sites:renderSites,accounts:renderAccounts,activity:renderActivity}[state.view];
 q('#content').innerHTML=body()+footerNote();

 window.PPOChoices&&window.PPOChoices.sync();
 storageNotice();
 if(focusHeading!==false&&render.shouldFocus){
  const heading=q('#main-heading');
  if(heading) heading.focus({preventScroll:true});
  render.shouldFocus=false;
 }
}
render.shouldFocus=false;

function footerNote(){
 return `<div class="footer-note">
  <span><span class="demo-dot"></span>Synthetic demonstration data. Every organisation, person, address, order, amount and document is fictional.</span>
  <span>CS-01 Customer 360 · r01 · ${esc(M.erpConnection.provider)} remains the intended ERP authority; live integration is outstanding.</span>
 </div>`;
}

/* ---------------------------------------------------------------- events */

function resetContext(){
 state.filters={...EMPTY_FILTERS};
 state.search='';
 state.selected=null;
 state.returnStack=[];
 for(const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
}

document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-action]');
 if(!trigger) return;
 const action=trigger.dataset.action;

 if(action==='navigate'){
  state.view=trigger.dataset.view;
  state.returnStack=[];
  render.shouldFocus=true;
  render();
  return;
 }
 if(action==='drill'){
  state.returnStack.push({view:state.view,filters:{...state.filters},search:state.search,
   label:(VIEWS.find(v=>v.id===state.view)||{}).label||'overview'});
  let filter={};
  try{filter=JSON.parse(trigger.dataset.filter||'{}');}catch(error){filter={};}
  state.filters={...EMPTY_FILTERS,...filter};
  state.search='';
  state.view=trigger.dataset.view;
  render.shouldFocus=true;
  render();
  return;
 }
 if(action==='return'){
  const previous=state.returnStack.pop();
  if(previous){
   state.view=previous.view;
   state.filters={...previous.filters};
   state.search=previous.search;
  }
  render.shouldFocus=true;
  render();
  return;
 }
 if(action==='open'){openSnapshot(trigger.dataset.kind,trigger.dataset.id);return;}
 if(action==='open-full'){openBoundary(trigger.dataset.kind);return;}
 if(action==='boundary'){openBoundary(trigger.dataset.target);return;}
 if(action==='about'){openAbout();return;}
 if(action==='add-note'){openNoteEditor(trigger.dataset.id,trigger.dataset.label||'');return;}
 if(action==='save-note'){saveNote(trigger.dataset.id);return;}
 if(action==='close-dialog'){const dialog=trigger.closest('dialog');if(dialog)dialog.close();return;}
 if(action==='clear-filters'){state.filters={...EMPTY_FILTERS};state.search='';render();return;}
 if(action==='clear-search'){state.search='';render();return;}
 if(action==='remove-filter'){
  const key=trigger.dataset.key;
  state.filters={...state.filters,[key]:''};
  render();
  return;
 }
 if(action==='refresh-source'){
  state.refreshAttempts+=1;
  toast('Refresh requested. The simulated adapter returned the same failure, so the last successful observation is still what is shown. Nothing was written to the source.');
  return;
 }
});

document.addEventListener('change',event=>{
 const target=event.target;
 if(target.id==='customer-selector'){
  state.org=target.value;
  resetContext();
  render.shouldFocus=true;
  render();
  return;
 }
 if(target.id==='demo-role'){
  state.role=target.value;
  resetContext();
  render();
  openAbout();
  return;
 }
 if(target.id==='demo-customer'){
  state.org=target.value;
  resetContext();
  render();
  openAbout();
  return;
 }
 if(target.dataset&&target.dataset.filterKey){
  state.filters={...state.filters,[target.dataset.filterKey]:target.value};
  render();
 }
});

document.addEventListener('input',event=>{
 if(event.target.id==='record-search'){
  state.search=event.target.value;
  const position=event.target.selectionStart;
  render();
  const field=q('#record-search');
  if(field){field.focus({preventScroll:true});try{field.setSelectionRange(position,position);}catch(error){/* type does not support selection */}}
 }
});

/* Tabs use roving tabindex with arrow, Home and End keys. */
document.addEventListener('keydown',event=>{
 const tab=event.target.closest('[role=tab]');
 if(!tab) return;
 const tabs=[...document.querySelectorAll('[role=tab]')];
 const index=tabs.indexOf(tab);
 let next=null;
 if(event.key==='ArrowRight') next=(index+1)%tabs.length;
 if(event.key==='ArrowLeft') next=(index-1+tabs.length)%tabs.length;
 if(event.key==='Home') next=0;
 if(event.key==='End') next=tabs.length-1;
 if(next===null) return;
 event.preventDefault();
 // Activating a tab re-renders the strip, so focus is restored to the new element
 // rather than being dropped onto the document body.
 const view=tabs[next].dataset.view;
 state.view=view;
 state.returnStack=[];
 render(false);
 const restored=document.getElementById('tab-'+view);
 if(restored) restored.focus();
});

/* --------------------------------------------------------------- start-up */

readStorage();
render();

window.PPOCustomer360=Object.freeze({
 storageKey:STORAGE_KEY,
 getState:()=>state,
 setState:patch=>{Object.assign(state,patch);render();},
 resetContext,
 render
});
})();
