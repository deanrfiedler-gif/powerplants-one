/* Order Fulfilment & Customer Delivery - interactive review shell.
   Local demonstration only. Role and company selection here is a presentation of the
   model's permission projections; it is not authenticated access control. A future
   application must enforce every rule on the server. */
(function(){
  'use strict';
  const M=globalThis.OF_MODEL, KEY='ppo-order-fulfilment-r01', $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titles={register:'Fulfilment register',stock:'Stock & reservations',picking:'Picking & dispatch',delivery:'Delivery & evidence',exceptions:'Exceptions & follow-through'};
  const scopes={register:'SC-05 · SC-06 · SC-07',stock:'SC-05',picking:'SC-06',delivery:'SC-07',exceptions:'SC-05 · SC-06 · SC-07'};
  const icons={help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',box:'<path d="M3 8 12 4l9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/>',truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',check:'<path d="m5 12 4 4L19 6"/>',alert:'<path d="M12 4 2 20h20z"/><path d="M12 10v5m0 3h.01"/>',plus:'<path d="M12 5v14M5 12h14"/>',doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'};
  const icon=k=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[k]||icons.arrow}</svg>`;

  let state=M.seed();
  let ui={role:'coordinator',company:'PPA-AU',view:'register',filters:M.filters(),selected:'ful-000001',stockSelected:null,restore:null};
  let mode='complete',saveBehaviour='none',pending=null,damaged=null,storageOK=true,external=false,handler=null,origin=null,formDirty=false,timer;
  const me=()=>M.roles[ui.role];
  const writable=()=>me().write&&me().companies.includes(ui.company);
  const granted=()=>me().companies.includes(ui.company);

  const fdate=d=>d?new Date(d+'T00:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'Date needed';
  const ftime=(d,tz)=>d?new Date(d).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:tz||'Australia/Melbourne'})+' · '+(tz||'Australia/Melbourne'):'Not recorded';
  const qty=(n,unit)=>n===null||n===undefined?'<span class="tag warning">Unknown</span>':esc(M.amount(n,unit));
  const button=(label,action,data='',classes='',disabled=false)=>`<button type="button" data-action="${action}" ${data} class="${classes}" ${disabled?'disabled':''}>${label}</button>`;
  const tag=(s,t)=>`<span class="tag ${t||(/Confirmed|Delivered|Resolved|Complete|Approved|Ready|Synced|Usable/.test(s)?'success':/Failed|Refused|Unavailable|Rejected|Damaged|Disputed|Overdue|Conflict/.test(s)?'danger':/Unknown|Partial|Proposed|Pending|Open|Held|Investigate|Awaiting|needed|Queued|Unresolved/.test(s)?'warning':'info')}">${esc(s)}</span>`;
  const note=(title,body,t='neutral')=>`<div class="note ${t}"><strong>${esc(title)}</strong><div>${body}</div></div>`;
  const card=(title,body,head='')=>`<section class="card"><div class="card-head"><h2>${title}</h2>${head}</div>${body}</section>`;
  const facts=rows=>`<dl class="facts">${rows.filter(Boolean).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const field=(name,label,value='',type='text',attrs='',hint='')=>`<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" aria-labelledby="label-${name}" ${attrs}>${hint?`<span class="unit-suffix">${hint}</span>`:''}</label>`;
  const select=(name,label,options,value)=>`<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><select id="f-${name}" name="${name}" aria-labelledby="label-${name}">${options.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(t)}</option>`;}).join('')}</select></label>`;
  const area=(name,label,value='',required=true)=>`<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><textarea id="f-${name}" name="${name}" aria-labelledby="label-${name}" ${required?'required':''} maxlength="2000">${esc(value)}</textarea></label>`;
  const check=(name,label,checked=false)=>`<label class="check-label"><input type="checkbox" name="${name}" ${checked?'checked':''}><span>${label}</span></label>`;
  const avatar=name=>`<div class="owner"><span class="avatar" aria-hidden="true">${name?esc(name.split(' ').map(x=>x[0]).join('')):'?'}</span><span>${esc(name||'Owner needed')}</span></div>`;
  const base='https://github.com/deanrfiedler-gif/powerplants-one/blob/main/docs/reference/ui/';
  const links={
    customer:base+'customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html',
    readiness:base+'supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html',
    deals:base+'crm/ppo-deal-pipeline_r35.html',
    products:base+'products/PPO-Products-Preview-r04.html',
    projects:base+'projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html',
    service:base+'service/PPO-Work-Orders-Workspace-r01.html',
    warranty:base+'warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html',
    mywork:base+'my-work/PPO-My-Work-and-Action-Centre-r01.html',
    finance:base+'finance/PPO-Finance-and-Commercial-Controls-r01.html'
  };
  const out=(label,href)=>`<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;

  /* ---------- Source scenarios ------------------------------------------------------- */
  const sourceNotice=()=>{
    if(!granted())return note('No permitted records in this company',`${esc(me().name)} holds no fulfilment grant for ${esc(M.companies[ui.company].name)}. Counts, search, snapshots and exports show nothing here; this is a boundary, not an empty result.`,'warning');
    if(mode==='failed')return note('Order source unavailable',`Counts and quantities cannot be shown. This does not mean there is nothing outstanding. ${button('Retry the source','retry','','small-button')}`,'warning');
    if(mode==='partial')return note('Partial source results',`The Sydney warehouse source did not respond. Displayed counts and availability cover the loaded sources only, and unloaded stock is unknown rather than zero. ${button('Refresh all sources','retry','','small-button')}`,'warning');
    if(mode==='empty')return note('Empty result scenario',`The simulated query returned no records. Your saved coordination records are unchanged. ${button('Restore source results','retry','','small-button')}`);
    if(mode==='stale')return note('Observation age warning',`Every availability observation is being presented as older than the review threshold. Quantities are shown with their observation time and must be refreshed before a reservation is relied upon. ${button('Refresh all sources','retry','','small-button')}`,'warning');
    return `<p class="source-line">Complete fictional source set · observed 16 September 2026 06:30 AEST · ${esc(M.companies[ui.company].name)} · current preview permissions applied</p>`;
  };
  const orders=()=>{
    if(!granted()||mode==='failed'||mode==='empty')return [];
    return M.query(state,ui.role,ui.company,ui.filters);
  };
  const allOrders=()=>!granted()||mode==='failed'||mode==='empty'?[]:M.visibleOrders(state,ui.role,ui.company);
  const stockRows=()=>{
    if(!granted()||mode==='failed'||mode==='empty')return [];
    const rows=M.visibleAvailability(state,ui.role,ui.company);
    return mode==='partial'?rows.filter(a=>a.warehouse!=='SYN-WH-SYD'):rows;
  };
  const currentOrder=()=>allOrders().find(o=>o.id===ui.selected)||allOrders()[0]||null;

  /* ---------- Persistence, recovery and dialogs -------------------------------------- */
  function save(){
    if(damaged||external)return;
    try{localStorage.setItem(KEY,JSON.stringify({schema:'ppo-order-fulfilment-session/v1',state,ui}));storageOK=true;}catch{storageOK=false;}
    if($('save-status'))$('save-status').textContent=storageOK?'Saved in this browser':'Session only · export before closing';
  }
  function load(){
    let raw=null;try{raw=localStorage.getItem(KEY);}catch{storageOK=false;return;}
    if(!raw)return;
    try{const p=JSON.parse(raw);M.validate(p.state);state=p.state;ui={...ui,...p.ui,filters:{...M.filters(),...(p.ui?.filters||{})}};}
    catch(e){damaged={raw,message:e.message};}
  }
  function toast(s){clearTimeout(timer);$('toast').textContent=s;$('toast').hidden=false;timer=setTimeout(()=>{$('toast').hidden=true;},3600);}
  function download(name,content,type='application/json'){const u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  function close(force=false){
    if(formDirty&&!force&&!window.confirm('Discard the unsaved entries in this form?'))return false;
    $('modal').close();handler=null;formDirty=false;
    if(origin?.isConnected)origin.focus();else $('content').focus();return true;
  }
  function dialog(title,body,fn=null,opts={}){
    if(!$('modal').open)origin=document.activeElement;
    formDirty=false;
    $('modal').className=opts.drawer?'drawer':'';
    $('modal-title').textContent=title;
    $('modal-kicker').textContent=opts.kicker||'Order fulfilment';
    $('modal-body').innerHTML=body;$('modal-error').hidden=true;
    $('modal-submit').hidden=!fn;$('modal-submit').textContent=opts.submit||'Save';
    $('cancel-button').textContent=fn?'Cancel':'Close';
    handler=fn;decorate();
    if(!$('modal').open)$('modal').showModal();
    const first=$('modal-body').querySelector('input,select,textarea');if(first&&fn)first.focus();
  }
  function transact(type,payload,expected=state.version){
    if(external)throw Error('Another tab changed this session. Copy unsaved entries, export the saved records and reload before recording anything further.');
    if(pending)throw Error('Recover the original save response before recording another change.');
    if(!granted())throw Error('This company is outside the current preview grants.');
    if(mode==='failed'||mode==='empty')throw Error('Refresh the source results before recording changes.');
    const cmd={op:'of-'+crypto.randomUUID(),type,expectedVersion:expected,payload};
    if(saveBehaviour==='fail'){saveBehaviour='none';throw Error('Simulated save failure. Nothing was recorded and your entries are retained; retry the same form.');}
    const r=M.command(state,cmd,ui.role,ui.company);
    state=r.state;save();
    if(saveBehaviour==='unknown'){saveBehaviour='none';pending={cmd,role:ui.role,company:ui.company};}
    return r;
  }
  function mutation(title,body,type,payload,opts={}){
    const expected=state.version;
    dialog(title,body,fd=>{
      const r=transact(type,typeof payload==='function'?payload(fd):payload,expected);
      close(true);render();
      toast(pending?'Submitted. The response was lost — recover the original operation before acting again.':r.receipt.description);
    },opts);
  }
  function recover(){
    if(!pending)return;
    const r=M.command(state,pending.cmd,pending.role,pending.company);
    state=r.state;
    const message=r.recovered
      ?'Original operation recovered. The same result and receipt were returned; no second effect was created.'
      :'Original operation replayed and recorded once.';
    pending=null;save();render();
    dialog('Original operation reconciled',note('Recovered without a duplicate effect',esc(message)+'<br><br>Receipt <code>'+esc(r.receipt.op)+'</code> · version '+r.receipt.version+'.<br>'+esc(r.receipt.description),'success'));
  }
  function decorate(){document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));}

  /* ---------- Shared fragments ------------------------------------------------------- */
  function progress(t,compact=false){
    const total=t.ordered||1,pc=n=>Math.max(0,Math.min(100,Math.round(n/total*100)));
    return `<div class="progress" role="img" aria-label="Of ${esc(M.amount(t.ordered,t.unit))} ordered: ${esc(M.amount(t.received,t.unit))} recorded as received, ${esc(M.amount(t.inTransit,t.unit))} in transit, ${esc(M.amount(Math.max(0,t.reserved-t.dispatched),t.unit))} reserved and not dispatched, ${esc(M.amount(t.outstanding,t.unit))} outstanding">`+
      `<i class="delivered" style="width:${pc(t.received)}%"></i><i class="transit" style="width:${pc(t.inTransit)}%"></i><i class="reserved" style="width:${pc(Math.max(0,t.reserved-t.dispatched))}%"></i></div>`+
      `<div class="legend${compact?' compact':''}" aria-hidden="${compact}"><span><i style="background:var(--green)"></i>Received ${qty(t.received,t.unit)}</span><span><i style="background:#8fb7d2"></i>In transit ${qty(t.inTransit,t.unit)}</span><span><i style="background:#c7d3df"></i>Reserved ${qty(Math.max(0,t.reserved-t.dispatched),t.unit)}</span><span><i style="background:#e6e9ee"></i>Outstanding ${qty(t.outstanding,t.unit)}</span></div>`;
  }
  function quantityGrid(t){
    const cell=(label,value,caption,cls='')=>`<div class="qty-cell ${cls}"><span>${esc(label)}</span><strong>${qty(value,t.unit)}</strong><small>${esc(caption)}</small></div>`;
    return `<div class="qty-grid">${cell('Ordered',t.ordered,'Accepted source order line')}${cell('Reserved',t.reserved,'Confirmed reservations only')}${cell('Picked',t.picked,'Physical observation')}${cell('Staged',t.staged,'Physical observation')}${cell('Dispatched',t.dispatched,'Movement recorded')}${cell('Received',t.received,'Recorded at delivery')}${cell('Outstanding',t.outstanding,'Ordered less received',t.outstanding>0?'emphasis':'')}</div>`;
  }
  function calc(t){
    return `<div class="calc"><b>Outstanding</b> = ordered ${M.amount(t.ordered,t.unit)} − recorded received ${M.amount(t.received,t.unit)} − cancelled ${M.amount(t.cancelled,t.unit)} = <b>${M.amount(t.outstanding,t.unit)}</b><br>`+
      `<b>In transit</b> = dispatched ${M.amount(t.dispatched,t.unit)} − received ${M.amount(t.received,t.unit)} − damaged ${M.amount(t.damaged,t.unit)} − missing ${M.amount(t.missing,t.unit)} = <b>${M.amount(t.inTransit,t.unit)}</b><br>`+
      `<b>Still to pick</b> = confirmed reservations ${M.amount(t.reserved,t.unit)} − picked ${M.amount(t.picked,t.unit)} = <b>${M.amount(t.toPick,t.unit)}</b><br>`+
      `All values use the line unit ${esc(t.unit)}. No conversion between units is applied anywhere in this workspace.</div>`;
  }
  function commitmentBlock(l){
    const c=l.commitments;
    return facts([
      ['Requested',c.requested?esc(fdate(c.requested.date)):'Not recorded'],
      ['Confirmed commitment',c.confirmed?`${esc(fdate(c.confirmed.date))} <span class="tiny">· version ${c.confirmed.version}</span>`:'Not recorded'],
      ['Current expected',c.expected?`${esc(fdate(c.expected.date))} <span class="tiny">· version ${c.expected.version}</span>`:'Not recorded'],
      ['Date state',tag(M.dueState(c.expected?.date||null))]
    ]);
  }
  function outLinks(o){
    return `<div class="source-actions">${out('Customer 360 · '+o.organisation.name,links.customer)} · ${out('Accepted handover '+o.handover.ref,links.deals)} · ${out('Material readiness (SC-01–SC-04)',links.readiness)} · ${out('Products catalogue',links.products)}</div>`;
  }

  /* ---------- View: fulfilment register ---------------------------------------------- */
  function registerView(){
    const rows=orders(),cards=granted()&&mode!=='failed'&&mode!=='empty'?M.summary(state,ui.role,ui.company,ui.filters):[];
    const chips=M.worklists.map(w=>button(w==='all'?'All orders':esc(w),'worklist',`data-worklist="${esc(w)}" aria-pressed="${ui.filters.worklist===w}"`)).join('');
    return `<div class="page-heading"><div><h2>Fulfilment register</h2><p>Orders requiring supply or delivery follow-through, with the outstanding quantity and the accountable next action.</p></div><span class="tiny">${rows.length} matching order(s)</span></div>`+
      sourceNotice()+
      (ui.restore?note('Filter context retained',`You arrived here from a snapshot or a detail view. ${button('Return to the previous filters','restoreFilters','','small-button')}`):'')+
      `<div class="snapshot">${cards.map(c=>button(`<span>${esc(c.label)}</span><strong>${mode==='failed'?'—':c.value}</strong><span class="tiny">${esc(c.caption)}${mode==='partial'?' · partial sources':''}</span>`,'snapshot',`data-id="${esc(c.id)}"`,'',mode==='failed'||!granted())).join('')||'<div class="qty-cell"><span>Snapshot</span><strong>—</strong><small>No permitted records</small></div>'}</div>`+
      `<div class="worklist" role="group" aria-label="Coordination worklists">${chips}</div>`+
      note('These are PPO coordination views','Awaiting stock, Ready for picking, In preparation, Dispatched, Partially delivered and Needs follow-up are computed from the evidence held here. No equivalence to a MYOB Acumatica order status has been verified, and the source order state is not read by this design.')+
      `<div class="columns"><div class="stack">${card('Orders requiring follow-through',`<div class="count-line">${rows.length} matching order(s) · ${esc(M.companies[ui.company].name)} · ${mode==='partial'?'partial':'fictional'} sources</div>${registerTable(rows)}`)}</div><aside class="stack">${selectedOrderCard()}${journeyCard()}</aside></div>`;
  }
  function registerTable(rows){
    if(!rows.length)return `<div class="empty"><h2>${!granted()?'No permitted records':mode==='failed'?'Results unavailable':'No matching orders'}</h2><p>${!granted()?'This company is outside the current preview grants.':mode==='failed'?'Retry the source before drawing a conclusion about outstanding work.':'Try a different worklist, customer, site, owner, warehouse or date filter.'}</p>${button('Clear filters','clear','','small-button')}</div>`;
    return `<div class="table-wrap"><table class="queue-table"><caption class="sr-only">Fulfilment register · ${rows.length} orders</caption><thead><tr><th>Order &amp; customer</th><th>Handover &amp; delivery</th><th>Dates</th><th>Progress &amp; outstanding</th><th>Next step</th></tr></thead><tbody>`+
      rows.map(o=>{
        const first=o.lines[0],t=first.totals;
        const outstanding=o.outstanding.filter(x=>x.qty>0);
        return `<tr class="${ui.selected===o.id?'selected-row':''}">`+
          `<td data-label="Order &amp; customer"><button type="button" class="record-title" data-action="select" data-id="${esc(o.id)}">${esc(o.ref)}</button>`+
          `<p>${esc(o.organisation.name)} · ${esc(o.site.name)}</p>`+
          `<p class="tiny">${esc(o.erpOrder)} · account ${esc(o.erpAccount)} · PO ${esc(o.customerPo)}</p>`+
          `<div class="pill-row">${tag(o.condition)}${o.completeness!=='Complete'?tag('Source '+o.completeness):''}</div></td>`+
          `<td data-label="Handover &amp; delivery"><p>${esc(o.handover.ref)}</p><p class="tiny">Receiving owner ${esc(o.handover.receivingOwner)}</p><p class="tiny">${esc(o.receivingPoint)}</p></td>`+
          `<td data-label="Dates"><p class="tiny">Requested ${esc(fdate(first.commitments.requested?.date))}</p><p class="tiny">Confirmed ${esc(fdate(first.commitments.confirmed?.date))}</p><p class="tiny">Expected ${esc(fdate(first.commitments.expected?.date))}</p>${tag(M.dueState(first.commitments.expected?.date||null))}</td>`+
          `<td data-label="Progress &amp; outstanding">${progress(t,true)}<p class="tiny">${outstanding.length?outstanding.map(x=>esc(M.amount(x.qty,x.unit))+' outstanding').join(' · '):'Nothing outstanding'}</p>${o.blockers.length?`<p class="tiny">${esc(o.blockers[0].kind)}${o.blockers.length>1?` and ${o.blockers.length-1} more`:''}</p>`:''}</td>`+
          `<td data-label="Next step">${button('Open '+icon('arrow'),'order',`data-id="${esc(o.id)}" aria-label="Open ${esc(o.ref)}"`,'small-button')}</td></tr>`;
      }).join('')+'</tbody></table></div>';
  }
  function selectedOrderCard(){
    const o=currentOrder();
    if(!o)return card('Selected order','<div class="pad"><p class="small">Select a visible order to inspect its source records and next action.</p></div>');
    const rows=orders();
    return card('Selected order · next step',
      `<div class="pad"><h3>${esc(o.ref)}</h3>${!rows.some(x=>x.id===o.id)?note('Outside current results','This selected order is outside the current filters. Its identity stays explicit rather than disappearing.','warning'):''}`+
      `<p class="small mt">${esc(o.organisation.name)} · ${esc(o.site.name)}</p><div class="mt">${avatar(o.owner)}</div>`+
      `<div class="mt">${tag(o.condition)}</div>`+
      `<p class="small mt">${o.blockers.length?esc(o.blockers[0].detail):'No stock, picking, dispatch or delivery blocker is recorded for this order.'}</p>`+
      `<div class="mt">${button('Open the order '+icon('arrow'),'order',`data-id="${esc(o.id)}"`,'primary')}</div>`+
      `<p class="tiny mt">${esc(o.erpOrder)} · observed ${esc(ftime(o.observedAt,o.site.timezone))} · source ${esc(o.completeness)}</p></div>`);
  }
  function journeyCard(){
    const o=M.visibleOrders(state,ui.role,ui.company).find(x=>x.id==='ful-000001');
    if(!o)return card('Demonstration journey','<div class="pad"><p class="small">The two-shipment demonstration belongs to the Australian company scope.</p></div>');
    const t=o.lines[0].totals,dsp=o.dispatches.length,del=o.deliveries.filter(d=>!d.superseded).length;
    const step=(label,done)=>`<li class="${done?'done':''}">${esc(label)}</li>`;
    return card('Northbank · two-shipment demonstration',
      `<div class="pad"><p class="small">10 EA ordered · 6 EA of confirmed usable supply · 4 EA owned shortage</p><ol class="journey">`+
      step('Reservation confirmed against evidenced usable stock',t.reserved>0)+
      step('Picked and staged',t.staged>0)+
      step('First shipment dispatched',dsp>0&&t.dispatched>0)+
      step('First delivery recorded and acknowledged',del>0&&t.received>0)+
      step('Shortage owned and later supply confirmed',state.sourceState.newSupply)+
      step('Second shipment delivered; nothing outstanding',t.outstanding===0)+
      `</ol><p class="tiny">Outstanding ${esc(M.amount(t.outstanding,t.unit))} of ${esc(M.amount(t.ordered,t.unit))}.</p>${button('Walk through this journey','guide','','link-button')}</div>`);
  }

  /* ---------- View: stock & reservations (SC-05) ------------------------------------- */
  function stockView(){
    const rows=stockRows();
    const selected=rows.find(a=>a.id===ui.stockSelected)||rows[0]||null;
    return `<div class="page-heading"><div><h2>Stock availability &amp; reservations</h2><p>Company, warehouse, bin, item and unit, with the observation time, completeness and the evidence a reservation may rely upon.</p></div><span class="tiny">${rows.length} observation(s) in scope</span></div>`+
      sourceNotice()+
      note('Physical stock, usable stock, incoming supply and available-to-promise are different things','On hand is what the source says is physically present. Usable is what receipt and inspection evidence supports. Incoming supply is promised, not received. The source’s own available figure is reported here with its declared basis and is never subtracted a second time by this workspace.')+
      `<div class="columns"><div class="stack">${card('Availability observations',stockTable(rows))}</div><aside class="stack">${stockDetailCard(selected)}${competingCard()}</aside></div>`;
  }
  function stockTable(rows){
    if(!rows.length)return `<div class="empty"><h2>${!granted()?'No permitted records':'No availability in scope'}</h2><p>${!granted()?'This company is outside the current preview grants.':'The current role’s warehouse scope returns no observations.'}</p></div>`;
    return `<div class="table-wrap"><table class="queue-table stock-table"><caption class="sr-only">Availability observations · ${rows.length}</caption><thead><tr><th>Item &amp; unit</th><th>Location</th><th>Source-reported quantities</th><th>Evidenced usable</th><th>Observation</th></tr></thead><tbody>`+
      rows.map(a=>{
        const stale=mode==='stale'||a.completeness!=='Complete';
        return `<tr class="${ui.stockSelected===a.id?'selected-row':''}">`+
          `<td data-label="Item &amp; unit"><button type="button" class="record-title" data-action="stockSelect" data-id="${esc(a.id)}">${esc(a.itemRecord.code)}</button><p>${esc(a.itemRecord.name)}</p><p class="tiny">${esc(a.item)} · unit ${esc(a.unit)}</p>${a.unitBasis!=='Declared'?tag('Unit basis '+a.unitBasis):''}${a.anomaly?tag('Investigate'):''}</td>`+
          `<td data-label="Location"><p>${esc(a.warehouseRecord.name)}</p><p class="tiny">${esc(a.warehouse)} · bin ${esc(a.bin)}</p><p class="tiny">${esc(M.companies[a.company].name)}</p></td>`+
          `<td data-label="Source-reported quantities"><p class="tiny">On hand ${qty(a.onHand,a.unit)}</p><p class="tiny">Source available ${qty(a.sourceAvailable,a.unit)}</p><p class="tiny">Source reserved ${qty(a.sourceReserved,a.unit)}</p><p class="tiny">Held or quarantined ${qty(a.held,a.unit)}</p></td>`+
          `<td data-label="Evidenced usable"><p>${a.usableEvidence===null?'<span class="tag warning">Not established</span>':esc(M.amount(a.usableEvidence,a.unit))}</p><p class="tiny">Confirmed reservations ${esc(M.amount(a.confirmedReserved,a.unit))}</p><p class="tiny">Unreserved usable ${a.remainingUsable===null?'Unknown':esc(M.amount(a.remainingUsable,a.unit))}</p></td>`+
          `<td data-label="Observation">${tag(a.completeness)}<p class="tiny">${esc(ftime(a.observedAt,'Australia/Melbourne'))}</p>${stale?tag('Refresh before relying'):''}</td></tr>`;
      }).join('')+'</tbody></table></div>';
  }
  function stockDetailCard(a){
    if(!a)return card('Selected observation','<div class="pad"><p class="small">Select an observation to inspect its evidence, incoming supply and competing demand.</p></div>');
    const lines=state.lines.filter(l=>l.item===a.item&&M.order(state,l.order).company===a.company&&M.totals(state,l.id).unreserved>0&&l.unit===a.unit);
    return card('Observation '+esc(a.ref),
      `<div class="pad">${facts([
        ['Item',esc(a.itemRecord.code)+' · '+esc(a.itemRecord.name)],
        ['Internal reference',esc(a.item)],
        ['Location',esc(a.warehouseRecord.name)+' · '+esc(a.bin)],
        ['Unit',esc(a.unit)+(a.unitBasis!=='Declared'?' · '+tag('Unit basis '+a.unitBasis):'')],
        ['Available basis',esc(a.availableBasis)],
        ['Observed',esc(ftime(a.observedAt,'Australia/Melbourne'))],
        ['Completeness',tag(a.completeness)]
      ])}`+
      (a.note?note('Source note',esc(a.note),'warning'):'')+
      (a.anomaly?note('Held for investigation: '+esc(a.anomaly.kind),esc(a.anomaly.note),'warning'):'')+
      `<div class="section-label">How the usable quantity is derived</div>`+
      `<div class="calc"><b>Source-reported available</b> ${a.sourceAvailable===null?'Unknown':esc(M.amount(a.sourceAvailable,a.unit))} · basis: ${esc(a.availableBasis)}<br>`+
      `<b>PPO evidence ledger</b> = receipt lines inspected Usable ${a.usableEvidence===null?'not established':esc(M.amount(a.usableEvidence,a.unit))}<br>`+
      `<b>Unreserved usable</b> = evidenced usable ${a.usableEvidence===null?'—':esc(M.amount(a.usableEvidence,a.unit))} − confirmed reservations ${esc(M.amount(a.confirmedReserved,a.unit))} − requests awaiting an outcome ${esc(M.amount(a.blocking,a.unit))} = <b>${a.remainingUsable===null?'Unknown':esc(M.amount(a.remainingUsable,a.unit))}</b><br>`+
      `The source figure is displayed as reported. PPO subtracts its own confirmed reservations only from its own evidence ledger, so a reservation is never subtracted twice.</div>`+
      (a.usableEvidence!==null&&a.sourceAvailable!==null&&a.remainingUsable!==a.sourceAvailable
        ?note('The two figures differ, and both are shown',`The source reports ${esc(M.amount(a.sourceAvailable,a.unit))} available while the evidence ledger leaves ${esc(M.amount(a.remainingUsable,a.unit))} unreserved. Dispatched stock has left the store but its receipt and reservation records are retained, so the ledger totals stay higher than the current physical figure. Neither value is adjusted to match the other.`):'')+
      `<div class="section-label">Receipt and inspection evidence</div>`+
      (a.evidence.length?a.evidence.map(e=>`<div class="evidence-line">${tag(e.inspection)} ${esc(M.amount(e.qty,e.unit))} · ${esc(e.ref)} · ${esc(ftime(e.at,'Australia/Melbourne'))}<br>${esc(e.source)}</div>`).join(''):'<p class="small">No receipt or inspection evidence supports this observation, so no quantity here is treated as usable.</p>')+
      `<div class="section-label">Incoming supply</div>`+
      (a.incoming.length?a.incoming.map(i=>`<div class="evidence-line">${tag(i.state)} ${esc(M.amount(i.qty,i.unit))} · ${esc(i.ref)} · expected ${esc(fdate(i.expected))}<br>${esc(i.evidence)}</div>`).join(''):'<p class="small">No incoming supply is evidenced for this observation.</p>')+
      `<div class="section-label">Reservations against this observation</div>`+
      (a.reservations.length?a.reservations.map(r=>{
        const l=M.lineOf(state,r.line);
        return `<div class="evidence-line">${tag(r.state)} ${esc(M.amount(r.qty,r.unit))} · ${esc(r.ref)} · ${esc(l.sourceLine)}<br>${esc(r.basis)}${r.sourceRef?'<br>Source reference '+esc(r.sourceRef):''}${r.failure?'<br>'+esc(r.failure):''}`+
          (r.state==='Unknown'?`<div class="mt">${button('Reconcile the original operation','reconcile',`data-id="${esc(r.id)}"`,'small-button',!M.can(ui.role,'reconcileUnknown'))}</div>`:'')+'</div>';
      }).join(''):'<p class="small">No reservation is recorded against this observation.</p>')+
      `<div class="mt">${button('Reserve against this observation','reserve',`data-av="${esc(a.id)}"`,'primary',!M.can(ui.role,'reserve')||!lines.length||a.completeness!=='Complete'||!!a.anomaly||!a.remainingUsable)}${button('Refresh the source','refresh','','small-button',!M.can(ui.role,'refreshObservation'))}</div>`+
      (lines.length?(a.remainingUsable?'':'<p class="tiny mt">No evidenced usable and unreserved quantity remains on this observation, so nothing can be reserved from it.</p>'):'<p class="tiny mt">No order line in this company needs this item in this unit, so no reservation target exists.</p>')+
      `</div>`);
  }
  function competingCard(){
    const a=stockRows().find(x=>x.competing.length);
    if(!a)return note('Concurrency is a server obligation','Preventing two accepted reservations from consuming the same evidenced quantity cannot be established by browser controls. A future application must apply a server-side check under a single transaction, with an optimistic version or a row-level lock on the evidenced quantity.');
    return card('Competing demand · '+esc(a.itemRecord.code),
      `<div class="pad"><p class="small">${esc(M.amount(a.remainingUsable??0,a.unit))} evidenced usable and unreserved at ${esc(a.warehouseRecord.name)}.</p>`+
      a.competing.map(c=>`<div class="commitment"><strong>${esc(c.ref)}</strong><p>${esc(c.label)} · ${esc(M.amount(c.qty,c.unit))} required by ${esc(fdate(c.requiredBy))}</p></div>`).join('')+
      note('Only one of these can be satisfied from this observation','Reserving the larger quantity leaves less than the second order needs. The second attempt is refused with the remaining evidenced quantity stated, rather than producing a negative remainder or a silent last-write overwrite.','warning')+'</div>');
  }

  /* ---------- View: picking & dispatch (SC-06) --------------------------------------- */
  function pickingView(){
    const os=allOrders();
    const pickable=[];
    for(const o of os)for(const l of o.lines){
      const open=M.openReservations(state,l.id);
      if(open.length)pickable.push({o,l,res:open[0],remaining:open[0].qty-M.pickedForReservation(state,open[0].id)});
    }
    const picks=state.picks.filter(p=>os.some(o=>o.lines.some(l=>l.id===p.line)));
    const dispatches=os.flatMap(o=>o.dispatches.map(d=>({o,d})));
    const subs=state.substitutions.filter(x=>os.some(o=>o.lines.some(l=>l.id===x.line)));
    return `<div class="page-heading"><div><h2>Picking &amp; dispatch preparation</h2><p>Order-linked pick preparation, physical observations, findings and the separation between a prepared dispatch, a recorded movement and a source shipment transaction.</p></div><span class="tiny">${pickable.length} line(s) ready to pick</span></div>`+
      sourceNotice()+
      `<div class="step-flow">`+
      `<div class="${picks.length?'done':''}"><span class="eyebrow">Step 1</span><b>Pick</b>Physical observation against a confirmed reservation.</div>`+
      `<div class="${picks.some(p=>p.staged>0)?'done':''}"><span class="eyebrow">Step 2</span><b>Stage</b>A separate observation; staging is not a repeat of the pick.</div>`+
      `<div class="${dispatches.length?'done':''}"><span class="eyebrow">Step 3</span><b>Prepare dispatch</b>Lines, address, receiving point, contact, carrier and packages.</div>`+
      `<div class="${dispatches.some(x=>x.d.movementAt)?'done':''}"><span class="eyebrow">Step 4</span><b>Record movement</b>Goods physically left the store.</div>`+
      `<div class="${dispatches.some(x=>x.d.erp.state==='Confirmed')?'done':''}"><span class="eyebrow">Step 5</span><b>Source shipment</b>A separate observed source outcome.</div></div>`+
      note('Issuing a document is not a dispatch','A pick list, packing document or delivery document records evidence of preparation. It never moves goods, never marks an order dispatched and never creates a source shipment transaction.')+
      (subs.length?card('Substitutions awaiting or under review',subs.map(substitutionBlock).join(''),''):'')+
      `<div class="split">`+
      card('Pick preparation',pickable.length?`<div class="pad">${pickable.map(x=>pickCard(x)).join('')}</div>`:`<div class="empty"><h2>No line is ready to pick</h2><p>A confirmed reservation is required before picking. Reserve in Stock &amp; reservations first.</p></div>`)+
      card('Dispatch preparation',dispatches.length?`<div class="pad">${dispatches.map(x=>dispatchCard(x.o,x.d)).join('')}</div>`:`<div class="empty"><h2>No dispatch prepared</h2><p>Stage a picked quantity, then prepare a dispatch from the order drawer.</p></div>`)+
      `</div>`+
      (picks.length?card('Recorded picks and findings',`<div class="pad">${picks.map(pickRecord).join('')}</div>`):'');
  }
  function pickCard({o,l,res,remaining}){
    const a=M.avOf(state,res.avLine);
    return `<article class="pick-card"><div class="line-head"><div><h3>${esc(l.itemRecord.code)} · ${esc(M.amount(remaining,l.unit))}</h3><p class="small">${esc(l.itemRecord.name)}</p></div><span class="bin">${esc(a.warehouse)} / ${esc(a.bin)}</span></div>`+
      `<p class="tiny mt">${esc(o.ref)} · ${esc(l.sourceLine)} · ${esc(o.organisation.name)}</p>`+
      `<p class="tiny">Reservation ${esc(res.ref)} · ${esc(M.amount(res.qty,res.unit))} confirmed · ${esc(M.amount(remaining,res.unit))} still to pick${res.sourceRef?' · source '+esc(res.sourceRef):''}</p>`+
      `<div class="pick-actions">${button('Record pick','pick',`data-line="${esc(l.id)}" data-res="${esc(res.id)}"`,'primary',!M.can(ui.role,'pick'))}${button('Propose substitution','proposeSub',`data-line="${esc(l.id)}"`,'',!M.can(ui.role,'proposeSubstitution'))}</div>`+
      (M.can(ui.role,'pick')?'':`<p class="tiny mt">The ${esc(me().title)} role cannot record a pick in this demonstration.</p>`)+
      `</article>`;
  }
  function pickRecord(p){
    const l=M.lineOf(state,p.line),o=M.order(state,l.order);
    return `<article class="line-block"><div class="line-head"><div><h3>${esc(p.ref)} · ${esc(M.items[l.item].code)}</h3><p class="tiny">${esc(o.ref)} · ${esc(l.sourceLine)} · ${esc(p.warehouse)} / ${esc(p.bin)}</p></div>${tag(p.staged>=p.picked&&p.picked>0?'Staged':'Picked')}</div>`+
      facts([
        ['Required',esc(M.amount(p.required,l.unit))],
        ['Picked',esc(M.amount(p.picked,l.unit))+' · '+esc(p.picker)+' · '+esc(ftime(p.at,o.site.timezone))],
        ['Staged',p.staged>0?esc(M.amount(p.staged,l.unit))+' · '+esc(p.stagedBy||p.picker)+' · '+esc(ftime(p.stagedAt||p.at,o.site.timezone)):'Not staged'],
        p.serials.length?['Serial or batch',p.serials.map(esc).join('<br>')]:null
      ])+
      (p.findings.length?p.findings.map((f,i)=>`<div class="decision"><div class="row between"><strong>${esc(f.kind)} · ${esc(M.amount(f.qty,f.unit))}</strong>${tag(f.reviewed?'Reviewed':'Awaiting review')}</div><p>${esc(f.note)}</p>${f.reviewed?`<p class="tiny">${esc(f.outcome)} · ${esc(f.reviewedBy)} · ${esc(f.reviewNote)}</p>`:`<div class="mt">${button('Review finding','reviewFinding',`data-id="${esc(p.id)}" data-index="${i}"`,'small-button',!M.can(ui.role,'reviewFinding'))}</div>`}</div>`).join(''):'')+
      (p.staged<p.picked?`<div class="mt">${button('Record staged quantity','stage',`data-id="${esc(p.id)}"`,'small-button',!M.can(ui.role,'stage'))}</div>`:'')+
      `</article>`;
  }
  function substitutionBlock(x){
    const l=M.lineOf(state,x.line),o=M.order(state,l.order);
    return `<div class="line-block"><div class="line-head"><div><h3>${esc(x.ref)}</h3><p class="tiny">${esc(o.ref)} · ${esc(l.sourceLine)}</p></div>${tag(x.state)}</div>`+
      facts([
        ['Accepted item',esc(M.items[x.accepted].code)+' · '+esc(M.items[x.accepted].name)+' · '+esc(M.items[x.accepted].status)],
        ['Proposed item',esc(M.items[x.proposed].code)+' · '+esc(M.items[x.proposed].name)],
        ['Proposed by',esc(x.proposedBy)+' · '+esc(ftime(x.at,o.site.timezone))],
        ['Basis',esc(x.reason)],
        x.note?['Review basis',esc(x.decidedBy)+' · '+esc(x.note)]:null
      ])+
      note('A picker cannot replace an accepted item','Price, quantity and technical scope are unchanged by a proposal. An approval here records a commercial and engineering review only; a revised accepted scope must still be issued through Estimating and the order amended in the source before any dispatch.','warning')+
      (x.state==='Proposed'?`<div class="mt">${button('Review the substitution','decideSub',`data-id="${esc(x.id)}"`,'primary',!M.can(ui.role,'decideSubstitution'))}</div>`:'')+
      `</div>`;
  }
  function dispatchCard(o,d){
    const r=d.readiness;
    return `<article class="line-block"><div class="line-head"><div><h3>${esc(d.ref)}</h3><p class="tiny">${esc(o.ref)} · ${esc(o.organisation.name)}</p></div>${tag(d.movementAt?'Dispatched':r.ready?'Ready':'Blocked')}</div>`+
      facts([
        ['Lines',d.lines.map(x=>esc(M.lineOf(state,x.line).sourceLine)+' · '+esc(M.amount(x.qty,x.unit))).join('<br>')],
        ['Delivery address',esc(d.address)],
        ['Receiving point',esc(d.receivingPoint)],
        ['Receiving contact',esc(d.contact)+' · '+esc(d.contactRole)],
        ['Delivery instructions',esc(d.instructions)],
        ['Carrier or collection',esc(d.carrier)],
        ['Packages',d.packages.length?d.packages.map(p=>esc(p.ref)).join('<br>'):'Not recorded'],
        ['Planned dispatch',esc(fdate(d.plannedDate))],
        ['Physical movement',d.movementAt?esc(ftime(d.movementAt,o.site.timezone))+' · '+esc(d.movementBy):'Not recorded'],
        ['Source shipment',tag(d.erp.state)+(d.erp.ref?' '+esc(d.erp.ref):'')]
      ])+
      `<div class="section-label">Dispatch readiness</div><ul class="readiness-list">`+
      r.checks.map(c=>`<li><span class="mark ${c.ok?'ok':'no'}" aria-hidden="true">${c.ok?'✓':'!'}</span><div><span class="sr-only">${c.ok?'Met':'Not met'}: </span>${esc(c.label)}<small>${esc(c.detail)}</small></div></li>`).join('')+
      `</ul>`+
      (d.documents.length?`<div class="section-label">Issued documents</div>${d.documents.map(x=>`<span class="evidence-chip">${icon('doc')} ${esc(x.kind)} · ${esc(x.ref)} · ${esc(ftime(x.at,o.site.timezone))}</span>`).join('')}`:'')+
      `<div class="pick-actions">`+
      button('Issue a document','issueDoc',`data-id="${esc(d.id)}"`,'',!M.can(ui.role,'issueDocuments'))+
      (d.movementAt?button('Record source shipment outcome','shipOutcome',`data-id="${esc(d.id)}"`,'',!M.can(ui.role,'recordShipmentOutcome')||d.erp.state==='Confirmed')
        :button('Record physical dispatch','movement',`data-id="${esc(d.id)}"`,'primary',!M.can(ui.role,'recordMovement')||!r.ready))+
      (d.movementAt?button('Capture delivery','capture',`data-id="${esc(d.id)}"`,'primary',!M.can(ui.role,'captureDelivery')):'')+
      `</div></article>`;
  }

  /* ---------- View: delivery & evidence (SC-07) -------------------------------------- */
  function deliveryView(){
    const os=allOrders();
    const dels=os.flatMap(o=>o.deliveries.map(d=>({o,d}))).sort((a,b)=>b.d.at.localeCompare(a.d.at));
    const awaiting=os.flatMap(o=>o.dispatches.filter(d=>d.movementAt).map(d=>({o,d}))).filter(({o,d})=>{
      const prior=state.deliveries.filter(x=>!x.superseded&&x.dispatch===d.id);
      return d.lines.some(dl=>M.sum(prior.flatMap(p=>p.lines.filter(z=>z.line===dl.line).map(z=>z.received+z.damaged+z.missing)))<dl.qty);
    });
    return `<div class="page-heading"><div><h2>Delivery &amp; proof of delivery</h2><p>What physically reached the customer, who received it, what evidence was captured, and what remains outstanding.</p></div><span class="tiny">${dels.filter(x=>!x.d.superseded).length} current delivery record(s)</span></div>`+
      sourceNotice()+
      note('Delivery to a receiving point is not installation or acceptance','Carrier arrival, physical receipt, delivery acknowledgement, inspection and acceptance of the wider contractual scope are separate. Delivery to Pack Room 01 does not establish installation in Glasshouse 02, completion of a project, resolution of a service case, or approval to invoice or pay.')+
      (awaiting.length?card('Awaiting delivery capture',`<div class="pad">${awaiting.map(({o,d})=>`<div class="line-block"><div class="line-head"><div><h3>${esc(d.ref)}</h3><p class="tiny">${esc(o.ref)} · ${esc(o.organisation.name)} · ${esc(d.receivingPoint)}</p></div>${tag('In transit')}</div><p class="tiny">Dispatched ${esc(ftime(d.movementAt,o.site.timezone))} · ${d.lines.map(x=>esc(M.amount(x.qty,x.unit))).join(', ')}</p><div class="mt">${button('Capture delivery evidence','capture',`data-id="${esc(d.id)}"`,'primary',!M.can(ui.role,'captureDelivery'))}</div></div>`).join('')}</div>`):'')+
      (dels.length?`<div class="stack">${dels.map(({o,d})=>deliveryBlock(o,d)).join('')}</div>`:`<div class="empty"><h2>No delivery has been recorded</h2><p>Dispatch a prepared consignment, then capture its delivery evidence.</p></div>`);
  }
  function deliveryBlock(o,d){
    const failed=['Failed attempt','Refused','Access denied'].includes(d.outcome);
    return `<article class="pod ${d.superseded?'superseded':failed?'failed':''}"><div class="line-head"><div><h3>${esc(d.ref)}${d.superseded?' · superseded':''}</h3><p class="tiny">${esc(o.ref)} · ${esc(o.organisation.name)} · consignment ${esc(M.clone(state.dispatches.find(x=>x.id===d.dispatch)).ref)}</p></div><div class="pill-row">${tag(d.outcome)}${tag(d.syncState)}${d.superseded?tag('Retained original'):''}</div></div>`+
      facts([
        ['Recorded at',esc(ftime(d.at,d.timezone))],
        ['Delivery address',esc(d.address)],
        ['Actual receiving point',esc(d.receivingPoint)],
        ['Intended use area',esc(o.useArea)+' <span class="tiny">(separate from the receiving point)</span>'],
        ['Receiving person',esc(d.receiver.name)+' · '+esc(d.receiver.role)],
        ['Evidence captured by',esc(d.capturedBy)],
        d.predecessor?['Correction recorded by',esc(d.author)]:null,
        d.predecessor?['Corrects',esc(state.deliveries.find(x=>x.id===d.predecessor)?.ref||d.predecessor)+' · '+esc(d.correctionReason||'')]:null
      ])+
      `<div class="section-label">Quantities on this delivery</div>`+
      d.lines.map(l=>{
        const line=M.lineOf(state,l.line);
        return `<div class="calc"><b>${esc(line.sourceLine)}</b> · ${esc(M.items[line.item].code)}<br>Dispatched ${esc(M.amount(l.dispatched,l.unit))} · recorded received ${esc(M.amount(l.received,l.unit))} · damaged ${esc(M.amount(l.damaged,l.unit))} · missing ${esc(M.amount(l.missing,l.unit))}<br>Remaining on the order after this delivery: <b>${esc(M.amount(M.totals(state,l.line).outstanding,l.unit))}</b></div>`;
      }).join('')+
      `<p class="small mt">${esc(d.notes)}</p>`+
      (d.findings.length?`<div class="section-label">Findings</div>${d.findings.map(f=>`<div class="decision"><strong>${esc(f.kind)}${f.qty>0?' · '+esc(M.amount(f.qty,f.unit)):''}</strong><p>${esc(f.note)}</p></div>`).join('')}`:'')+
      (d.evidence.length?`<div class="section-label">Captured evidence</div>${d.evidence.map(e=>`<span class="evidence-chip">${icon('doc')} ${esc(e.ref)} · ${esc(e.caption)}</span>`).join('')}`:'')+
      (d.acknowledgement?`<div class="ack"><strong>Customer acknowledgement</strong>${esc(d.acknowledgement.by)} · ${esc(d.acknowledgement.role)} · ${esc(ftime(d.acknowledgement.at,d.timezone))}<br>${esc(d.acknowledgement.scope)}<br><em>${esc(d.acknowledgement.excludes)}</em></div>`
        :d.superseded||failed?'':note('No acknowledgement captured','The recorded quantities stand on the capture evidence alone until a customer acknowledgement scoped to this exact delivery is recorded.','warning'))+
      (d.superseded?'':`<div class="pick-actions">`+
        (d.acknowledgement||failed?'':button('Record customer acknowledgement','acknowledge',`data-id="${esc(d.id)}"`,'',!M.can(ui.role,'acknowledgeDelivery')))+
        button('Correct this evidence','correct',`data-id="${esc(d.id)}"`,'',!M.can(ui.role,'correctDelivery'))+
        `</div>`)+
      `</article>`;
  }

  /* ---------- View: exceptions & follow-through -------------------------------------- */
  function exceptionsView(){
    const os=allOrders();
    const list=os.flatMap(o=>o.exceptions.map(e=>({o,e}))).sort((a,b)=>(a.e.state==='Resolved')-(b.e.state==='Resolved')||(a.e.due||'9999').localeCompare(b.e.due||'9999'));
    const follow=os.flatMap(o=>o.followUps.map(f=>({o,f})));
    const derived=os.flatMap(o=>o.blockers.map(b=>({o,b})));
    return `<div class="page-heading"><div><h2>Exceptions, commitments &amp; follow-through</h2><p>Every exception carries a source record, an affected scope, an owner, a next action, a date or Date needed, and retained resolution evidence.</p></div><span class="tiny">${list.filter(x=>x.e.state!=='Resolved').length} open</span></div>`+
      sourceNotice()+
      `<div class="columns"><div class="stack">`+
      card('Recorded exceptions',list.length?`<div class="pad">${list.map(({o,e})=>exceptionCard(o,e)).join('')}</div>`:`<div class="empty"><h2>No exception recorded</h2><p>Conditions observed from source evidence appear under detected conditions until someone owns them.</p></div>`)+
      card('Detected conditions not yet owned',derived.length?`<div class="pad">${derived.map(({o,b})=>`<div class="line-block"><div class="line-head"><div><h3>${esc(b.kind)}</h3><p class="tiny">${esc(o.ref)} · ${esc(o.organisation.name)}${b.line?' · '+esc(M.lineOf(state,b.line).sourceLine):''}</p></div>${tag('Detected')}</div><p class="small mt">${esc(b.detail)}</p><div class="mt">${button('Raise an owned exception','raise',`data-order="${esc(o.id)}" data-line="${esc(b.line||'')}" data-kind="${esc(mapKind(b.kind))}"`,'small-button',!M.can(ui.role,'raiseException'))}</div></div>`).join('')}</div>`:`<div class="pad"><p class="small">No blocking condition is detected in the loaded sources.</p></div>`)+
      `</div><aside class="stack">`+
      card('Commitments',`<div class="pad"><p class="small">Changing an expected date does not replace the confirmed commitment. Changing a confirmed commitment requires a review role, a reason and an accountable customer follow-up, and reschedules nothing by itself.</p><div class="mt">${button('Change an expected date','expected','','small-button',!M.can(ui.role,'expectedCommitment'))}${button('Change a confirmed commitment','confirmed','','small-button',!M.can(ui.role,'confirmedCommitment'))}</div></div>`)+
      card('Follow-up obligations',follow.length?`<div class="pad">${follow.map(({o,f})=>`<div class="commitment"><strong>${esc(f.ref)} · ${esc(f.dateNeeded?'Date needed':fdate(f.due))}</strong><p>${esc(f.title)}</p><p class="tiny">${esc(o.ref)} · owner ${esc(f.owner)} · surfaced in ${esc(f.surface)}</p></div>`).join('')}<p class="tiny mt">These use the existing Activities and My Work pattern. ${out('Open My Work',links.mywork)}</p></div>`:`<div class="pad"><p class="small">No follow-up has been created. A follow-up is keyed on its impact identity, so the same shortage appearing in several views cannot create a second obligation.</p><p class="tiny mt">${out('My Work & Action Centre',links.mywork)}</p></div>`)+
      note('Recovery matters stay in their own workflow','Return authorisation, warranty, supplier claim and credit each keep their own decision and outcome. This workspace records the routing and the reference only; SC-08 is not rebuilt here.')+
      `</aside></div>`;
  }
  function mapKind(kind){
    const map={'Insufficient evidenced usable stock':'Insufficient or unavailable stock','Stock information incomplete':'Insufficient or unavailable stock',
      'Quarantine or inspection hold':'Quarantine or inspection hold','Unresolved unit basis':'Unresolved source mapping',
      'Source value under investigation':'Unresolved source mapping','Substitution awaiting review':'Short pick or substitution review',
      'Picking finding awaiting review':'Short pick or substitution review','Unknown source outcome':'Unknown source outcome'};
    return map[kind]||'Insufficient or unavailable stock';
  }
  function exceptionCard(o,e){
    return `<article class="exception-card ${e.state==='Resolved'?'resolved':''}"><div class="line-head"><div><h3>${esc(e.ref)} · ${esc(e.kind)}</h3><p class="tiny">${esc(o.ref)} · ${esc(o.organisation.name)}${e.line?' · '+esc(M.lineOf(state,e.line).sourceLine):''}</p></div>${tag(e.state)}</div>`+
      facts([
        ['Affected scope',esc(e.scope)],
        ['Owner',esc(e.owner)],
        ['Next action',esc(e.nextAction)],
        ['Due',e.dateNeeded?'<span class="tag warning">Date needed</span>':esc(fdate(e.due))],
        ['Source record',esc(e.source)],
        ['Raised',esc(e.raisedBy)+' · '+esc(ftime(e.raisedAt,o.site.timezone))]
      ])+
      (e.impact.commitments.length||e.impact.projects.length||e.impact.service.length
        ?`<div class="impact"><b>Effect on other work</b><br>${[...e.impact.commitments,...e.impact.projects,...e.impact.service].map(esc).join('<br>')}<br>${e.impact.projects.length?out('Open Projects delivery readiness',links.projects)+' · ':''}${e.impact.service.length?out('Open Work Orders',links.service)+' · ':''}${out('Customer 360',links.customer)}</div>`:'')+
      (e.linked?`<div class="impact"><b>Routed to ${esc(e.linked.name)}</b><br>${esc(e.linked.ref)} · ${esc(e.linked.note)}<br>${out('Open Warranty & Customer Resolution',links.warranty)} · ${out('Finance & Commercial Controls',links.finance)}</div>`:'')+
      (e.resolution.length?`<div class="section-label">Retained resolution evidence</div>${e.resolution.map(r=>`<div class="history-line">${esc(ftime(r.at,o.site.timezone))} · ${esc(r.actor)} · ${esc(r.state)}<br>${esc(r.note)}<br>Evidence ${esc(r.evidence)}</div>`).join('')}`:'')+
      `<div class="pick-actions">`+
      (e.state==='Resolved'?'':button('Record an outcome','resolve',`data-id="${esc(e.id)}"`,'primary',!M.can(ui.role,'resolveException')))+
      (e.linked?'':button('Route to returns, warranty or credit','route',`data-id="${esc(e.id)}"`,'',!M.can(ui.role,'linkRecovery')))+
      button('Create a follow-up','follow',`data-order="${esc(o.id)}" data-line="${esc(e.line||'')}" data-exc="${esc(e.id)}"`,'',!M.can(ui.role,'followUp'))+
      `</div></article>`;
  }

  /* ---------- Order drawer ----------------------------------------------------------- */
  function openOrder(id){
    const o=allOrders().find(x=>x.id===id);
    if(!o){dialog('Order unavailable',note('Refresh the current source','This order is outside the current role, company or loaded source results. Refreshing the register shows what is actually available. No hidden detail is displayed here.','warning'));return;}
    ui.selected=id;save();
    let body=facts([
      ['Fulfilment record',esc(o.ref)],
      ['Company / entity',esc(o.companyRecord.name)+' · '+esc(o.companyRecord.erpCompany)],
      ['Source order',esc(o.erpOrder)],
      ['ERP account',esc(o.erpAccount)],
      ['Customer purchase order',esc(o.customerPo)],
      ['Customer',esc(o.organisation.name)+' · '+esc(o.organisation.ref)],
      ['Delivery site',esc(o.site.name)+' · '+esc(o.site.ref)],
      ['Delivery address',esc(o.site.address)],
      ['Receiving point',esc(o.receivingPoint)],
      ['Intended use area',esc(o.useArea)],
      ['Receiving contact',esc(o.contact.name)+' · '+esc(o.contact.role)],
      ['Delivery instructions',esc(o.instructions)],
      ['Responsible owner',esc(o.owner)],
      ['Coordination condition',tag(o.condition)],
      ['Source observed',esc(ftime(o.observedAt,o.site.timezone))+' · '+esc(o.completeness)]
    ]);
    body+=`<div class="section-label">Accepted handover</div>`+facts([
      ['Handover',esc(o.handover.ref)],
      ['Opportunity',esc(o.handover.opportunity)],
      ['Receiving owner',esc(o.handover.receivingOwner)],
      ['Accepted',esc(ftime(o.handover.acceptedAt,o.site.timezone))],
      ['Commercial basis',esc(o.handover.basis)]
    ])+note('Each step is a separate fact','Customer acceptance of a quotation, an opportunity marked Won, creation of an ERP order and internal receiving responsibility are four distinct records. None of them is stock availability, a reservation, a dispatch, a delivery or an invoice.');
    body+=outLinks(o);
    for(const l of o.lines){
      const t=l.totals;
      body+=`<div class="line-block"><div class="line-head"><div><h3>${esc(l.sourceLine)} · ${esc(l.itemRecord.code)}</h3><p class="small">${esc(l.itemRecord.name)} · ${esc(l.item)} · unit ${esc(l.unit)}</p></div>${tag(l.itemRecord.status)}</div>`+
        quantityGrid(t)+progress(t)+calc(t)+
        `<div class="section-label">Dates and commitments</div>`+commitmentBlock(l)+
        (l.value?facts([['Line value',`AUD ${esc(l.value)} <span class="restricted">excluding GST</span>`]]):`<p class="tiny">Commercial values are outside the ${esc(me().title)} grant and are not loaded for this role.</p>`)+
        (l.demandLink?note('Linked demand outside this workspace',`${esc(l.demandLink.kind)} ${esc(l.demandLink.ref)}. ${esc(l.demandLink.note)}`):'')+
        `<div class="pick-actions">${button('Reserve stock','reserve',`data-line="${esc(l.id)}"`,'',!M.can(ui.role,'reserve')||t.unreserved===0)}${button('Prepare a dispatch','prepare',`data-order="${esc(o.id)}"`,'',!M.can(ui.role,'prepareDispatch')||t.staged-t.planned<=0)}${button('Raise an exception','raise',`data-order="${esc(o.id)}" data-line="${esc(l.id)}" data-kind="Insufficient or unavailable stock"`,'',!M.can(ui.role,'raiseException'))}</div></div>`;
    }
    if(o.blockers.length)body+=`<div class="section-label">Blockers</div>`+o.blockers.map(b=>note(b.kind,esc(b.detail),'warning')).join('');
    if(o.dispatches.length)body+=`<div class="section-label">Consignments</div>`+o.dispatches.map(d=>`<div class="history-line">${esc(d.ref)} · ${d.movementAt?'dispatched '+esc(ftime(d.movementAt,o.site.timezone)):'prepared '+esc(ftime(d.preparedAt,o.site.timezone))} · source shipment ${esc(d.erp.state)}${d.erp.ref?' '+esc(d.erp.ref):''}</div>`).join('');
    if(o.deliveries.length)body+=`<div class="section-label">Deliveries</div>`+o.deliveries.map(d=>`<div class="history-line">${esc(d.ref)}${d.superseded?' (superseded, retained)':''} · ${esc(d.outcome)} · ${esc(ftime(d.at,d.timezone))} · received ${d.lines.map(x=>esc(M.amount(x.received,x.unit))).join(', ')}</div>`).join('');
    dialog(o.ref,body,null,{drawer:true,kicker:'Order · '+o.organisation.name});
  }

  /* ---------- Forms ------------------------------------------------------------------ */
  function reserveForm(lineId,avId){
    const os=allOrders();
    let line=lineId?state.lines.find(l=>l.id===lineId):null;
    const candidates=state.availability.filter(a=>a.company===ui.company&&me().warehouses.includes(a.warehouse)&&(!line||(a.item===line.item&&a.unit===line.unit)));
    const av=avId?M.avOf(state,avId):(candidates[0]||null);
    if(!line&&av)line=state.lines.find(l=>l.item===av.item&&l.unit===av.unit&&M.order(state,l.order).company===ui.company&&M.totals(state,l.id).unreserved>0);
    if(!line||!av){dialog('Reservation unavailable',note('No reservation target','No order line in this company needs this item in this unit, or no observation in your warehouse scope supplies it.','warning'));return;}
    const t=M.totals(state,line.id),remaining=M.remainingUsable(state,av.id);
    const lineOptions=state.lines.filter(l=>l.item===av.item&&l.unit===av.unit&&M.order(state,l.order).company===ui.company&&M.totals(state,l.id).unreserved>0)
      .map(l=>[l.id,`${M.order(state,l.order).ref} · ${l.sourceLine} · ${M.amount(M.totals(state,l.id).unreserved,l.unit)} unreserved`]);
    const body=note('This creates a reservation request, not a source transaction','A proposed allocation, a submitted request and a confirmed source reservation are separate. Pending, confirmed, failed and unknown outcomes are all shown as they are.')+
      facts([
        ['Observation',esc(av.ref)+' · '+esc(av.warehouse)+' / '+esc(av.bin)],
        ['Item',esc(M.items[av.item].code)+' · unit '+esc(av.unit)],
        ['Evidenced usable',av.completeness==='Complete'&&!av.anomaly?esc(M.amount(M.usableEvidenceOf(state,av.id)??0,av.unit)):'<span class="tag warning">Not established</span>'],
        ['Confirmed reservations',esc(M.amount(M.confirmedAgainst(state,av.id),av.unit))],
        ['Unreserved usable',remaining===null?'<span class="tag warning">Unknown</span>':esc(M.amount(remaining,av.unit))],
        ['Observed',esc(ftime(av.observedAt,'Australia/Melbourne'))+' · '+esc(av.completeness)]
      ])+
      select('line','Order line',lineOptions,line.id)+
      field('qty','Reservation quantity','','text','required inputmode="decimal"','Enter the quantity in '+esc(av.unit)+'. No conversion from another unit is available.')+
      area('reason','Reservation basis','')+
      select('simulate','Simulated source outcome',[['','Confirmed'],['unknown','Response lost — outcome unknown'],['fail','Refused by the source']],'');
    mutation('Reserve against '+av.ref,body,'reserve',fd=>({line:fd.line,lineVersion:state.lines.find(l=>l.id===fd.line).version,avLine:av.id,qty:fd.qty,reason:fd.reason,simulate:fd.simulate||undefined}),{submit:'Submit reservation',kicker:'SC-05 · Reservations'});
  }
  function reconcileForm(id){
    const r=state.reservations.find(x=>x.id===id);
    if(!r)return;
    const l=M.lineOf(state,r.line);
    const body=note('A missing lookup result is not proof that the original operation failed','Record what was actually observed. Only an evidenced search establishes absence, and until the original outcome is reconciled no further business effect is permitted on this line.','warning')+
      facts([['Reservation',esc(r.ref)],['Order line',esc(l.sourceLine)],['Quantity',esc(M.amount(r.qty,r.unit))],['Requested',esc(ftime(r.requestedAt,'Australia/Melbourne'))],['Current state',tag(r.state)]])+
      select('outcome','How was the original operation reconciled?',['Confirmed in source','Not found after evidenced search','Still unknown'],'Confirmed in source')+
      field('sourceRef','Source or search evidence reference','','text','required')+
      area('reason','Reconciliation basis','');
    mutation('Reconcile '+r.ref,body,'reconcileUnknown',fd=>({id:r.id,outcome:fd.outcome,sourceRef:fd.sourceRef,reason:fd.reason}),{submit:'Record reconciliation',kicker:'Recovery'});
  }
  function refreshForm(){
    const body=note('Simulated source refresh','These scenarios replace an observation with a newer one and record its evidence. The earlier observation time is not presented as still current.')+
      select('scenario','Scenario',[['newSupply','A later confirmed receipt makes 4 EA of SYN-L1000-L usable'],['retry','The partial Sydney observation returns a complete result']],'newSupply');
    mutation('Refresh a source observation',body,'refreshObservation',fd=>({scenario:fd.scenario}),{submit:'Refresh',kicker:'SC-05 · Observations'});
  }
  function pickForm(lineId,resId){
    const l=state.lines.find(x=>x.id===lineId),r=state.reservations.find(x=>x.id===resId),o=M.order(state,l.order),a=M.avOf(state,r.avLine);
    const remaining=r.qty-M.pickedForReservation(state,r.id);
    const body=facts([
      ['Order',esc(o.ref)+' · '+esc(o.organisation.name)],
      ['Source line',esc(l.sourceLine)],
      ['Item',esc(M.items[l.item].code)+' · '+esc(M.items[l.item].name)],
      ['Location',esc(a.warehouse)+' / bin '+esc(a.bin)],
      ['Confirmed reservation',esc(M.amount(r.qty,r.unit))+' · '+esc(r.ref)],
      ['Still to pick on this reservation',esc(M.amount(remaining,l.unit))]
    ])+
      field('picked','Picked quantity','','text','required inputmode="decimal"','Unit '+esc(l.unit)+'. Enter what was physically picked, not what was expected.')+
      field('serials','Serial or batch references','','text','','Optional. Separate multiple references with a comma or a new line. Manual entry only; scanning is not demonstrated here.')+
      select('findingKind','Finding, if the picked quantity is below the reservation',[['','No finding'],'Short pick','Damaged stock','Missing item'],'')+
      area('findingNote','Finding note','',false);
    mutation('Record pick · '+M.items[l.item].code,body,'pick',fd=>({line:l.id,lineVersion:state.lines.find(x=>x.id===l.id).version,reservation:r.id,picked:fd.picked,serials:fd.serials,findingKind:fd.findingKind||undefined,findingNote:fd.findingNote}),{submit:'Record pick',kicker:'SC-06 · Picking'});
  }
  function stageForm(id){
    const p=state.picks.find(x=>x.id===id),l=M.lineOf(state,p.line);
    const body=note('Staging is its own observation','Record what was physically moved to the staging area. It is not a repeat of the picked quantity and it cannot exceed it.')+
      facts([['Pick',esc(p.ref)],['Picked',esc(M.amount(p.picked,l.unit))],['Currently staged',esc(M.amount(p.staged,l.unit))]])+
      field('staged','Staged quantity',M.show(p.picked),'text','required inputmode="decimal"','Unit '+esc(l.unit));
    mutation('Record staged quantity',body,'stage',fd=>({id:p.id,pickVersion:state.picks.find(x=>x.id===p.id).version,staged:fd.staged}),{submit:'Record staging',kicker:'SC-06 · Picking'});
  }
  function reviewFindingForm(id,index){
    const p=state.picks.find(x=>x.id===id),f=p.findings[index],l=M.lineOf(state,p.line);
    const body=facts([['Pick',esc(p.ref)],['Finding',esc(f.kind)+' · '+esc(M.amount(f.qty,f.unit))],['Recorded by',esc(f.actor)],['Note',esc(f.note)],['Picked quantity',esc(M.amount(p.picked,l.unit))]])+
      note('A review does not change a physical observation','The picked quantity stays exactly as recorded. A recount needs a fresh pick against the reservation, not an edit of this one.')+
      select('outcome','Review outcome',['Accepted as short supply','Returned to the warehouse for a recount','Quarantined pending disposition'],'Accepted as short supply')+
      area('note','Review note','');
    mutation('Review picking finding',body,'reviewFinding',fd=>({id:p.id,pickVersion:state.picks.find(x=>x.id===p.id).version,index,outcome:fd.outcome,note:fd.note}),{submit:'Record review',kicker:'SC-06 · Findings'});
  }
  function proposeSubForm(lineId){
    const l=state.lines.find(x=>x.id===lineId),o=M.order(state,l.order);
    const options=Object.values(M.items).filter(i=>i.ref!==l.item&&i.unit===l.unit).map(i=>[i.ref,`${i.code} · ${i.name} · ${i.status}`]);
    const body=note('A proposal changes nothing on the order','Price, quantity, technical scope and the accepted item are unchanged. A proposal records what the warehouse observed and suggests; the decision belongs to commercial and engineering review.','warning')+
      facts([['Order',esc(o.ref)],['Source line',esc(l.sourceLine)],['Accepted item',esc(M.items[l.item].code)+' · '+esc(M.items[l.item].status)],['Unit',esc(l.unit)]])+
      select('proposed','Proposed item',options,options[0]?.[0])+
      area('reason','Why is a substitution proposed?','');
    mutation('Propose a substitution',body,'proposeSubstitution',fd=>({line:l.id,lineVersion:state.lines.find(x=>x.id===l.id).version,proposed:fd.proposed,reason:fd.reason}),{submit:'Submit proposal',kicker:'SC-06 · Substitution'});
  }
  function decideSubForm(id){
    const x=state.substitutions.find(y=>y.id===id),l=M.lineOf(state,x.line),o=M.order(state,l.order);
    const body=facts([
      ['Proposal',esc(x.ref)],['Order',esc(o.ref)+' · '+esc(l.sourceLine)],
      ['Accepted item',esc(M.items[x.accepted].code)+' · '+esc(M.items[x.accepted].name)],
      ['Proposed item',esc(M.items[x.proposed].code)+' · '+esc(M.items[x.proposed].name)],
      ['Proposed by',esc(x.proposedBy)],['Basis',esc(x.reason)]
    ])+
      select('decision','Decision',['Approved','Rejected'],'Rejected')+
      check('engineering','The engineering compatibility position has been obtained from Engineering & Design Control.')+
      check('commercial','The commercial position on price and accepted scope has been obtained from Estimating & Quotation.')+
      area('reason','Review basis','')+
      note('Approval here is not a changed order','An approved substitution still needs a revised accepted scope issued through Estimating and an amendment in the source order before anything is dispatched.','warning');
    mutation('Review substitution '+x.ref,body,'decideSubstitution',fd=>({id:x.id,substitutionVersion:state.substitutions.find(y=>y.id===x.id).version,decision:fd.decision,engineering:fd.engineering==='on',commercial:fd.commercial==='on',reason:fd.reason}),{submit:'Record decision',kicker:'SC-06 · Substitution review'});
  }
  function prepareForm(orderId){
    const o=allOrders().find(x=>x.id===orderId);
    const rows=o.lines.map(l=>({l,available:Math.max(0,l.totals.staged-l.totals.planned)})).filter(x=>x.available>0);
    if(!rows.length){dialog('Nothing staged for dispatch',note('Stage a picked quantity first','A dispatch can only be prepared from a staged quantity that is not already committed to another prepared consignment.','warning'));return;}
    const body=note('Preparing a dispatch moves nothing','This records the intended lines, quantities, address, receiving point, contact, carrier and packages. The physical movement and the source shipment transaction are recorded separately afterwards.')+
      rows.map(({l,available})=>`<div class="qty-input-row"><div class="line-label">${esc(l.sourceLine)} · ${esc(l.itemRecord.code)}<small>${esc(M.amount(available,l.unit))} staged and uncommitted</small></div>${field('qty-'+l.id,'Quantity','' ,'text','inputmode="decimal"',esc(l.unit))}</div>`).join('')+
      field('address','Delivery address',o.site.address,'text','required')+
      field('receivingPoint','Receiving point',o.receivingPoint,'text','required','The receiving point is where goods are handed over. It is not the installation or use area.')+
      field('contact','Receiving contact',o.contact.name,'text','required')+
      field('contactRole','Contact role',o.contact.role,'text','required')+
      area('instructions','Recorded delivery instructions',o.instructions,false)+
      field('carrier','Carrier or collection arrangement','','text','required')+
      field('packages','Package references','','text','required','Separate multiple package references with a comma or a new line.')+
      field('plannedDate','Planned dispatch date',M.TODAY,'date','required');
    mutation('Prepare a dispatch · '+o.ref,body,'prepareDispatch',fd=>({order:o.id,
      lines:rows.filter(({l})=>fd['qty-'+l.id]&&Number(fd['qty-'+l.id])>0).map(({l})=>({line:l.id,qty:fd['qty-'+l.id]})),
      address:fd.address,receivingPoint:fd.receivingPoint,contact:fd.contact,contactRole:fd.contactRole,instructions:fd.instructions,
      carrier:fd.carrier,packages:fd.packages,plannedDate:fd.plannedDate}),{submit:'Prepare dispatch',kicker:'SC-06 · Dispatch preparation',drawer:true});
  }
  function issueDocForm(id){
    const d=state.dispatches.find(x=>x.id===id);
    const body=note('Issuing a document is evidence of preparation only','It does not move goods, mark the order dispatched or create a source shipment transaction.','warning')+
      select('kind','Document',['Pick list','Packing document','Delivery document'],'Pick list');
    mutation('Issue a document · '+d.ref,body,'issueDocuments',fd=>({id:d.id,kind:fd.kind}),{submit:'Issue document',kicker:'SC-06 · Documents'});
  }
  function movementForm(id){
    const d=state.dispatches.find(x=>x.id===id),o=M.order(state,d.order);
    const body=note('This records a physical movement','It states that the listed lines and quantities left the store. The source shipment transaction is a separate observation that follows.')+
      facts([['Consignment',esc(d.ref)],['Order',esc(o.ref)],['Lines',d.lines.map(x=>esc(M.lineOf(state,x.line).sourceLine)+' · '+esc(M.amount(x.qty,x.unit))).join('<br>')],['Receiving point',esc(d.receivingPoint)],['Carrier',esc(d.carrier)],['Packages',d.packages.map(p=>esc(p.ref)).join('<br>')]])+
      check('confirm','I confirm the listed lines and quantities physically left the store.');
    mutation('Record physical dispatch · '+d.ref,body,'recordMovement',fd=>({id:d.id,dispatchVersion:state.dispatches.find(x=>x.id===d.id).version,confirm:fd.confirm==='on'}),{submit:'Record dispatch',kicker:'SC-06 · Dispatch'});
  }
  function shipOutcomeForm(id){
    const d=state.dispatches.find(x=>x.id===id);
    const body=note('This records what the source actually returned','A confirmed source shipment, a refusal and an unknown response are different. Physical evidence already captured is unchanged by any of them.')+
      select('outcome','Observed source outcome',['Confirmed','Failed','Unknown'],'Confirmed')+
      field('sourceRef','Source shipment reference','SYN-ERP-SHP-','text','','Required only when the outcome is Confirmed.')+
      area('reason','Observation basis','');
    mutation('Record source shipment outcome',body,'recordShipmentOutcome',fd=>({id:d.id,outcome:fd.outcome,sourceRef:fd.sourceRef,reason:fd.reason}),{submit:'Record outcome',kicker:'SC-06 · Source outcome'});
  }
  function captureForm(id){
    const d=state.dispatches.find(x=>x.id===id),o=M.order(state,d.order);
    const prior=state.deliveries.filter(x=>!x.superseded&&x.dispatch===d.id);
    const body=note('Capture what actually happened at the receiving point','Carrier arrival, physical receipt, acknowledgement, inspection and acceptance of the wider scope are separate. Record quantities against the exact source lines on this consignment.')+
      facts([['Consignment',esc(d.ref)],['Order',esc(o.ref)+' · '+esc(o.organisation.name)],['Delivery address',esc(d.address)],['Planned receiving point',esc(d.receivingPoint)],['Intended use area',esc(o.useArea)],['Site timezone',esc(o.site.timezone)]])+
      select('outcome','Delivery outcome',['Delivered','Partial','Failed attempt','Refused','Access denied'],'Delivered')+
      d.lines.map(dl=>{
        const l=M.lineOf(state,dl.line);
        const already=M.sum(prior.flatMap(p=>p.lines.filter(z=>z.line===dl.line).map(z=>z.received+z.damaged+z.missing)));
        return `<div class="qty-input-row"><div class="line-label">${esc(l.sourceLine)} · ${esc(M.items[l.item].code)}<small>${esc(M.amount(dl.qty,dl.unit))} dispatched${already>0?' · '+esc(M.amount(already,dl.unit))+' already recorded':''} · unit ${esc(dl.unit)}</small></div>`+
          field('rec-'+dl.line,'Received','','text','inputmode="decimal"')+field('dam-'+dl.line,'Damaged','0','text','inputmode="decimal"')+field('mis-'+dl.line,'Missing','0','text','inputmode="decimal"')+`</div>`;
      }).join('')+
      field('receivingPoint','Actual receiving point',d.receivingPoint,'text','')+
      field('receiverName','Receiving person','','text','')+
      field('receiverRole','Receiving person role','','text','','For example Nursery manager or Field production manager. A role is recorded, not inferred.')+
      area('notes','Delivery notes','')+
      area('findingNote','Finding note for damaged, missing, failed, refused or access-denied outcomes','',false)+
      field('evidence','Evidence references','','text','','Labelled synthetic references only. Separate multiple references with a comma or a new line.')+
      select('syncState','Local save state',[['local','Captured locally on this device'],['queued','Captured and queued for synchronisation']],'local')+
      note('Captured evidence and its synchronisation state are separate','A source outage cannot turn unsynchronised evidence into a confirmed record. This preview stores evidence in this browser only; no bounded offline queue and replay design is included or claimed.','warning');
    mutation('Capture delivery · '+d.ref,body,'captureDelivery',fd=>({dispatch:d.id,outcome:fd.outcome,
      lines:d.lines.map(dl=>({line:dl.line,received:fd['rec-'+dl.line]||'0',damaged:fd['dam-'+dl.line]||'0',missing:fd['mis-'+dl.line]||'0'})),
      receivingPoint:fd.receivingPoint,receiverName:fd.receiverName,receiverRole:fd.receiverRole,notes:fd.notes,findingNote:fd.findingNote,
      evidence:fd.evidence,syncState:fd.syncState}),{submit:'Record delivery',kicker:'SC-07 · Proof of delivery',drawer:true});
  }
  function acknowledgeForm(id){
    const d=state.deliveries.find(x=>x.id===id),o=M.order(state,d.order);
    const body=note('An acknowledgement covers this delivery and these quantities only','It is not acceptance of installation quality, completion of a project, resolution of a service case, or approval to invoice or pay.','warning')+
      facts([['Delivery',esc(d.ref)],['Receiving point',esc(d.receivingPoint)],['Quantities',d.lines.map(l=>esc(M.lineOf(state,l.line).sourceLine)+' · received '+esc(M.amount(l.received,l.unit))).join('<br>')],['Intended use area',esc(o.useArea)]])+
      field('by','Acknowledging person',d.receiver.name,'text','required')+
      field('role','Acknowledging person role',d.receiver.role,'text','required')+
      check('confirm','I confirm this acknowledgement covers only the delivery and quantities listed above.');
    mutation('Record acknowledgement · '+d.ref,body,'acknowledgeDelivery',fd=>({id:d.id,by:fd.by,role:fd.role,confirm:fd.confirm==='on'}),{submit:'Record acknowledgement',kicker:'SC-07 · Acknowledgement'});
  }
  function correctForm(id){
    const d=state.deliveries.find(x=>x.id===id);
    const body=note('A correction creates a successor','The original capture, its author, its time and its evidence are retained and excluded from totals. Nothing is overwritten and no quantity is counted twice.')+
      facts([['Delivery',esc(d.ref)],['Captured by',esc(d.author)],['Recorded at',esc(ftime(d.at,d.timezone))]])+
      d.lines.map(l=>{
        const line=M.lineOf(state,l.line);
        return `<div class="qty-input-row"><div class="line-label">${esc(line.sourceLine)} · ${esc(M.items[line.item].code)}<small>dispatched ${esc(M.amount(l.dispatched,l.unit))} · unit ${esc(l.unit)}</small></div>`+
          field('rec-'+l.line,'Received',M.show(l.received),'text','inputmode="decimal"')+field('dam-'+l.line,'Damaged',M.show(l.damaged),'text','inputmode="decimal"')+field('mis-'+l.line,'Missing',M.show(l.missing),'text','inputmode="decimal"')+`</div>`;
      }).join('')+
      area('reason','Correction reason','');
    mutation('Correct delivery evidence',body,'correctDelivery',fd=>({id:d.id,deliveryVersion:state.deliveries.find(x=>x.id===d.id).version,reason:fd.reason,
      lines:d.lines.map(l=>({line:l.line,received:fd['rec-'+l.line],damaged:fd['dam-'+l.line],missing:fd['mis-'+l.line]}))}),{submit:'Record correction',kicker:'SC-07 · Correction',drawer:true});
  }
  function raiseForm(orderId,lineId,kind){
    const o=allOrders().find(x=>x.id===orderId);
    const lineOptions=[['','Whole order'],...o.lines.map(l=>[l.id,l.sourceLine+' · '+l.itemRecord.code])];
    const kinds=['Insufficient or unavailable stock','Competing reservations','Quarantine or inspection hold','Short pick or substitution review',
      'Supplier or dispatch delay','Failed or partial delivery','Damage, shortage or disputed receipt','Unresolved source mapping','Unknown source outcome','Changed customer commitment'];
    const body=select('kind','Exception category',kinds,kind||kinds[0])+
      select('line','Affected line',lineOptions,lineId||'')+
      area('scope','Affected scope','')+
      select('owner','Owner',Object.values(M.people),me().name)+
      area('nextAction','Next action','')+
      field('due','Due date',M.TODAY,'date')+
      check('dateNeeded','No date can be established yet — record Date needed instead.')+
      field('source','Source record reference','','text','required','The record this exception is evidenced by, for example a delivery, pick, reservation or observation reference.')+
      area('impactCommitments','Effect on customer commitments, Project demand or Service work','',false);
    mutation('Raise an exception · '+o.ref,body,'raiseException',fd=>({order:o.id,line:fd.line||undefined,kind:fd.kind,scope:fd.scope,
      owner:fd.owner,nextAction:fd.nextAction,due:fd.due,dateNeeded:fd.dateNeeded==='on',source:fd.source,impactCommitments:fd.impactCommitments}),
      {submit:'Raise exception',kicker:'Exceptions',drawer:true});
  }
  function resolveForm(id){
    const e=state.exceptions.find(x=>x.id===id);
    const body=facts([['Exception',esc(e.ref)+' · '+esc(e.kind)],['Affected scope',esc(e.scope)],['Owner',esc(e.owner)]])+
      select('state','Outcome',[['In review','Move to review'],['Resolved','Resolve']],'In review')+
      area('note','Resolution evidence','')+
      field('evidence','Evidence reference','','text','required');
    mutation('Record an exception outcome',body,'resolveException',fd=>({id:e.id,exceptionVersion:state.exceptions.find(x=>x.id===e.id).version,state:fd.state,note:fd.note,evidence:fd.evidence}),{submit:'Record outcome',kicker:'Exceptions'});
  }
  function routeForm(id){
    const e=state.exceptions.find(x=>x.id===id);
    const body=note('The decision stays in the receiving workflow','This records the routing and the external reference only. Return authorisation, supplier claim, warranty and credit each keep their own decision and outcome, and SC-08 is not rebuilt here.')+
      select('target','Receiving workflow',[['returns','Returns and return authorisation (SC-08)'],['warranty','Warranty & Customer Resolution'],['supplier','Supplier claim and recovery'],['credit','Finance credit and reconciliation']],'returns')+
      field('ref','External record reference','SYN-PPO-RMA-','text','required');
    mutation('Route '+e.ref,body,'linkRecovery',fd=>({id:e.id,target:fd.target,ref:fd.ref}),{submit:'Record routing',kicker:'Exceptions'});
  }
  function commitmentForm(kind){
    const os=allOrders(),options=os.flatMap(o=>o.lines.map(l=>[l.id,`${o.ref} · ${l.sourceLine} · ${l.itemRecord.code}`]));
    if(!options.length){dialog('No line available',note('No permitted order line','There is no order line in the current company and role scope.','warning'));return;}
    const first=state.lines.find(l=>l.id===options[0][0]);
    const c=M.commitmentsOf(state,first.id);
    const body=note(kind==='Expected'?'An expected date is the current best estimate':'A confirmed commitment is what the customer was told',
      kind==='Expected'
        ?'Changing it creates a new expected version. The confirmed commitment and the customer’s requested date are retained unchanged.'
        :'Changing it retains the earlier confirmed version, raises an accountable customer follow-up and reschedules nothing on its own. No visit is moved and no project plan is amended by this change.','warning')+
      select('line','Order line',options,first.id)+
      facts([['Requested',esc(fdate(c.requested?.date))],['Confirmed',esc(fdate(c.confirmed?.date))],['Current expected',esc(fdate(c.expected?.date))]])+
      field('date','New '+kind.toLowerCase()+' date','2026-09-24','date','required')+
      area('reason','Reason for the change','')+
      (kind==='Confirmed'?check('customerFollowUp','An accountable customer follow-up will be created and owned.')+check('acknowledgeImpact','I understand this does not reschedule a visit or amend a project plan.'):'');
    mutation('Change the '+kind.toLowerCase()+' commitment',body,kind==='Expected'?'expectedCommitment':'confirmedCommitment',
      fd=>({line:fd.line,lineVersion:state.lines.find(l=>l.id===fd.line).version,date:fd.date,reason:fd.reason,
        customerFollowUp:fd.customerFollowUp==='on',acknowledgeImpact:fd.acknowledgeImpact==='on'}),
      {submit:'Record commitment',kicker:'Commitments'});
  }
  function followForm(orderId,lineId,excId){
    const o=allOrders().find(x=>x.id===orderId),e=state.exceptions.find(x=>x.id===excId);
    const key=e?`exception:${e.kind}:${o.id}:${lineId||'order'}`:`order:${o.id}:${lineId||'order'}`;
    const body=note('One impact identity, one obligation',`This follow-up is keyed on <code>${esc(key)}</code>. The same shortage appearing in the register, the stock view and the exception list cannot create a second obligation.`)+
      field('title','Follow-up title',e?`Contact ${o.organisation.name} about ${e.kind.toLowerCase()}`:'','text','required')+
      area('detail','What needs to happen','')+
      select('owner','Owner',Object.values(M.people),me().name)+
      field('due','Due date',M.TODAY,'date')+
      check('dateNeeded','No date can be established yet — record Date needed instead.');
    mutation('Create a follow-up',body,'followUp',fd=>({order:o.id,line:lineId||undefined,key,title:fd.title,detail:fd.detail,owner:fd.owner,due:fd.due,dateNeeded:fd.dateNeeded==='on'}),{submit:'Create follow-up',kicker:'Follow-through'});
  }

  /* ---------- Preview options, guide and recovery ------------------------------------ */
  function optionsForm(){
    const body=note('Preview controls only','Role and company selection here demonstrates the model’s permission projections. It is not authenticated access control, and a future application must enforce every rule on the server.')+
      select('role','Preview identity',Object.values(M.roles).map(r=>[r.key,`${r.name} · ${r.title}`]),ui.role)+
      select('company','Company / entity',Object.values(M.companies).map(c=>[c.id,c.name]),ui.company)+
      select('mode','Source scenario',[['complete','Complete sources'],['partial','Partial — the Sydney warehouse source is unavailable'],['stale','Stale — every observation is past the review threshold'],['failed','Failed — the order source query failed'],['empty','Empty — the query returned no records']],mode)+
      select('saveBehaviour','Next save behaviour',[['none','Save normally'],['fail','Fail with the entries retained'],['unknown','Submit, then lose the response']],saveBehaviour)+
      `<div class="section-label">Session</div><div class="row">${button('Export saved records','export','','small-button')}${button('Reset the demonstration','reset','','small-button')}</div>`+
      `<p class="tiny mt">Saved locally under <code>${esc(KEY)}</code> in this browser only. Nothing is transmitted.</p>`;
    dialog('Preview options',body,fd=>{
      ui.role=fd.role;ui.company=fd.company;mode=fd.mode;saveBehaviour=fd.saveBehaviour;
      if(!M.roles[ui.role].warehouses.length&&ui.view==='stock')ui.view='register';
      ui.stockSelected=null;close(true);render();save();
      toast(`Viewing as ${M.roles[ui.role].name} · ${M.companies[ui.company].name}.`);
    },{submit:'Apply'});
  }
  function guide(){
    dialog('Page guide',
      `<ol class="guide-list">`+
      `<li><strong>Fulfilment register.</strong> Search and filter orders needing supply or delivery follow-through. Each row shows the source order and account, the accepted handover, the requested, confirmed and expected dates as separate values, the outstanding quantity in its own unit and the blocking condition. Snapshot cards open the exact contributing records and keep your filter context.</li>`+
      `<li><strong>Stock &amp; reservations (SC-05).</strong> Company, warehouse, bin, item and unit, with the source-reported quantities and their declared basis alongside the receipt and inspection evidence a reservation may actually rely on. Incomplete, unresolved-unit and internally inconsistent observations are shown as such, never as zero.</li>`+
      `<li><strong>Picking &amp; dispatch (SC-06).</strong> Pick against a confirmed reservation, stage as a separate observation, record findings, propose a substitution for review, then prepare a dispatch. Issuing a document, recording the physical movement and observing the source shipment outcome are three different things.</li>`+
      `<li><strong>Delivery &amp; evidence (SC-07).</strong> Capture what reached the receiving point, who received it, and what was damaged, missing, refused or disputed. An acknowledgement names the exact delivery and quantities. Corrections create successors and never overwrite an original capture.</li>`+
      `<li><strong>Exceptions &amp; follow-through.</strong> Detected conditions become owned exceptions with a next action, a date or Date needed and retained evidence. Commitment changes, returns, warranty, supplier claims and credits keep their own workflows.</li>`+
      `<li><strong>Try the two-shipment journey.</strong> Reserve 6 EA of the Northbank order, pick, stage, prepare, dispatch, deliver and acknowledge. Then refresh the source for the later confirmed receipt, reserve the remaining 4 EA and deliver the second shipment. The shortage and its resolution history are retained throughout.</li>`+
      `</ol>`);
  }
  function damagedView(){
    $('tabs').innerHTML='';$('toolbar').innerHTML='';$('context-controls').innerHTML='';
    $('context-name').textContent='Saved session needs attention';
    $('context-detail').textContent='The original saved content is preserved and can be exported before anything is reset.';
    $('content').innerHTML=note('Saved session could not be read',esc(damaged.message)+' The original content is preserved exactly as stored.','warning')+
      `<div class="row mt">${button('Export the original saved content','raw')}${button('Reset the demonstration','reset')}</div>`;
    $('save-status').textContent='Saved session could not be read';
    decorate();
  }

  /* ---------- Render ----------------------------------------------------------------- */
  function render(){
    if(damaged)return damagedView();
    $('role-label').textContent=me().name+' · '+me().title;
    $('context-name').textContent=M.companies[ui.company].name;
    $('context-detail').innerHTML=`${esc(M.companies[ui.company].erpCompany)} · ${esc(M.companies[ui.company].currency)} · warehouse scope ${me().warehouses.length?esc(me().warehouses.join(', ')):'none'} · commercial values ${me().commercial?'permitted':'not loaded for this role'}`;
    $('context-controls').innerHTML=select('ctx-company','Company / entity',Object.values(M.companies).map(c=>[c.id,c.name]),ui.company)+select('ctx-role','Identity',Object.values(M.roles).map(r=>[r.key,`${r.name} · ${r.title}`]),ui.role);
    $('tabs').innerHTML=Object.entries(titles).map(([id,t])=>`<button type="button" data-view="${id}" aria-current="${ui.view===id?'page':'false'}" ${id==='stock'&&!me().warehouses.length?'disabled title="Stock and reservations needs a warehouse grant"':''}>${esc(t)} <span class="tiny">${esc(scopes[id])}</span></button>`).join('');
    $('recovery').innerHTML=external
      ?note('Another tab changed this session','Copy any unsaved entries and export the saved records before reloading. This tab cannot overwrite the newer session.','warning')
      :pending?note('Save response lost',`The original operation may already be recorded. No further business effect is permitted until it is reconciled. ${button('Recover the original operation','recover','','small-button')}`,'warning')
      :!storageOK?note('Session-only storage','Local storage is unavailable, so records exist for this session only. Export before closing this browser.','warning'):'';
    $('toolbar').innerHTML=ui.view==='register'?toolbar():'';
    const body={register:registerView,stock:stockView,picking:pickingView,delivery:deliveryView,exceptions:exceptionsView}[ui.view];
    $('content').innerHTML=body();
    decorate();
    $('save-status').textContent=storageOK?'Saved in this browser':'Session only · export before closing';
  }
  function toolbar(){
    const os=granted()?M.visibleOrders(state,ui.role,ui.company):[];
    const customers=[...new Map(os.map(o=>[o.organisation.ref,o.organisation.name])).entries()];
    const sites=[...new Map(os.map(o=>[o.site.ref,o.site.name])).entries()];
    const owners=[...new Set(os.map(o=>o.owner))];
    const whs=me().warehouses;
    return `<section class="filter-panel" aria-label="Register controls"><div class="filter-top"><label class="search-field"><span class="sr-only">Search orders</span>${icon('search')}<input id="search" aria-label="Search orders" placeholder="Search order, account, purchase order, customer, site or item…" value="${esc(ui.filters.q)}" maxlength="200"></label>${button('Clear filters','clear','','small-button')}</div>`+
      `<div class="filter-bottom">`+
      select('filter-customer','Customer',[['','All customers'],...customers],ui.filters.customer)+
      select('filter-site','Delivery site',[['','All sites'],...sites],ui.filters.site)+
      select('filter-owner','Owner',[['','All owners'],...owners],ui.filters.owner)+
      select('filter-warehouse','Warehouse',[['','All warehouses'],...whs.map(w=>[w,M.warehouses[w].name])],ui.filters.warehouse)+
      select('filter-due','Expected date',[['','All dates'],'Overdue','Today','Upcoming','Date needed'],ui.filters.due)+
      button('Reset','clear','','link-button')+
      `</div></section>`;
  }

  /* ---------- Events ----------------------------------------------------------------- */
  const actions={
    options:optionsForm,guide,recover,
    retry(){mode='complete';render();toast('Source results restored for this preview.');},
    clear(){ui.filters=M.filters();ui.restore=null;render();save();},
    restoreFilters(){if(ui.restore){ui.filters=ui.restore;ui.restore=null;render();save();}},
    snapshot(b){ui.restore=ui.restore||{...ui.filters};ui.filters={...ui.filters,worklist:b.dataset.id};render();save();$('content').focus();},
    worklist(b){ui.filters={...ui.filters,worklist:b.dataset.worklist};render();save();},
    select(b){ui.selected=b.dataset.id;render();save();},
    stockSelect(b){ui.stockSelected=b.dataset.id;render();save();},
    order(b){openOrder(b.dataset.id);},
    reserve(b){reserveForm(b.dataset.line||null,b.dataset.av||null);},
    reconcile(b){reconcileForm(b.dataset.id);},
    refresh:refreshForm,
    pick(b){pickForm(b.dataset.line,b.dataset.res);},
    stage(b){stageForm(b.dataset.id);},
    reviewFinding(b){reviewFindingForm(b.dataset.id,Number(b.dataset.index));},
    proposeSub(b){proposeSubForm(b.dataset.line);},
    decideSub(b){decideSubForm(b.dataset.id);},
    prepare(b){prepareForm(b.dataset.order);},
    issueDoc(b){issueDocForm(b.dataset.id);},
    movement(b){movementForm(b.dataset.id);},
    shipOutcome(b){shipOutcomeForm(b.dataset.id);},
    capture(b){captureForm(b.dataset.id);},
    acknowledge(b){acknowledgeForm(b.dataset.id);},
    correct(b){correctForm(b.dataset.id);},
    raise(b){raiseForm(b.dataset.order,b.dataset.line||null,b.dataset.kind);},
    resolve(b){resolveForm(b.dataset.id);},
    route(b){routeForm(b.dataset.id);},
    expected(){commitmentForm('Expected');},
    confirmed(){commitmentForm('Confirmed');},
    follow(b){followForm(b.dataset.order,b.dataset.line||null,b.dataset.exc||null);},
    export(){download('ppo-order-fulfilment-r01-session.json',JSON.stringify({exportedAt:new Date().toISOString(),role:ui.role,company:ui.company,state},null,2));toast('Exported the saved synthetic records for this company and role.');},
    raw(){download('ppo-order-fulfilment-r01-original.txt',damaged.raw,'text/plain');toast('Exported the original saved content exactly as stored.');},
    reset(){
      if(!window.confirm('Reset the demonstration? Saved local records for this preview are discarded.'))return;
      try{localStorage.removeItem(KEY);}catch{}
      state=M.seed();ui={role:'coordinator',company:'PPA-AU',view:'register',filters:M.filters(),selected:'ful-000001',stockSelected:null,restore:null};
      mode='complete';saveBehaviour='none';pending=null;damaged=null;external=false;
      if($('modal').open)close(true);
      render();save();toast('Demonstration reset to the original synthetic fixture.');
    }
  };
  document.addEventListener('click',e=>{
    const view=e.target.closest('#tabs [data-view]');
    if(view){
      if(view.disabled)return;
      ui.view=view.dataset.view;render();save();$('content').focus();return;
    }
    const closer=e.target.closest('[data-close]');
    if(closer){close();return;}
    const b=e.target.closest('[data-action]');
    if(!b)return;
    const fn=actions[b.dataset.action];
    if(!fn)return;
    try{fn(b);}catch(err){dialog('Action unavailable',note('This action could not be started',esc(err.message),'warning'));}
  });
  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='f-ctx-company'){ui.company=t.value;ui.stockSelected=null;render();save();toast(`Company context: ${M.companies[ui.company].name}.`);return;}
    if(t.id==='f-ctx-role'){ui.role=t.value;ui.stockSelected=null;if(!M.roles[ui.role].warehouses.length&&ui.view==='stock')ui.view='register';render();save();toast(`Viewing as ${me().name} · ${me().title}.`);return;}
    if(t.id?.startsWith('f-filter-')){ui.filters={...ui.filters,[t.id.replace('f-filter-','')]:t.value};render();save();return;}
    if($('modal').open)formDirty=true;
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='search'){ui.filters={...ui.filters,q:e.target.value};render();save();const s=$('search');if(s){s.focus();s.setSelectionRange(s.value.length,s.value.length);}return;}
    if($('modal').open&&$('modal').contains(e.target))formDirty=true;
  });
  $('modal-form').addEventListener('submit',e=>{
    e.preventDefault();
    if(!handler)return;
    const fd=Object.fromEntries(new FormData(e.target).entries());
    try{handler(fd);$('modal-error').hidden=true;}
    catch(err){$('modal-error').hidden=false;$('modal-error').textContent=err.message;$('modal-error').focus();}
  });
  $('modal').addEventListener('cancel',e=>{e.preventDefault();close();});
  window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){external=true;render();}});
  window.addEventListener('beforeunload',e=>{if(formDirty){e.preventDefault();e.returnValue='';}});

  load();
  if(!damaged)M.validate(state);
  render();
  if(!damaged)save();
  globalThis.OF_DEMO={state:()=>state,ui:()=>ui,mode:()=>mode,pending:()=>!!pending,model:M,key:KEY};
})();
