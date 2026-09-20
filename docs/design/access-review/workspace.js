(function(){
  'use strict';
  const M=globalThis.ACCESS_MODEL,CAPS=globalThis.ACCESS_CAPABILITIES,KEY='ppo-access-review-r01',$=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TITLES={people:'People',person:'Person access',catalogue:'Roles, teams & capabilities',changes:'Access changes',reviews:'Access reviews',history:'History & explanation'};
  const ICONS={help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',spark:'<path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 4 4L19 6"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>'};
  const icon=k=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]||''}</svg>`;
  const defaults=()=>({role:'admin',view:'people',selected:M.roles.admin&&'30000000-0000-4000-8000-000000000001',filters:{q:'',issuer:'',status:'',company:'',family:'',queue:'',sort:'attention'},
    catalogueTab:'capabilities',bundle:'bundle-service-coordinator',request:null,requestFilter:'open',review:'review-company-a-restricted',history:{person:'',type:''},
    explain:{person:'30000000-0000-4000-8000-000000000005',capability:'shared.read',record:'rec-site2'},allFamilies:false});
  let state=M.seed(),ui=defaults(),mode='complete',saveMode='none',pending=null,damaged=null,storageOK=true,external=false,busy=false,handler=null,origin=null,dirty=false,opCount=0,notice='',timer;
  const role=()=>M.roles[ui.role],me=()=>M.person(state,role().person);
  const name=id=>{const p=M.person(state,id);return p?p.name:'—';};
  const when=v=>v?new Date(v).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Australia/Brisbane'})+' AEST':'—';
  const day=v=>v?new Date(v).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'Australia/Brisbane'}):'No end date';
  const inputDay=v=>v?new Date(Date.parse(v)).toLocaleDateString('en-CA',{timeZone:'Australia/Brisbane'}):'';
  const tagClass=s=>/Current|Effective|Approved|Keep|Active|Complete|Allowed/.test(s)?'success':/Expired|Inactive|Revoke|Withdrawn|Not allowed|Returned|Denied/.test(s)?'danger':/Future|Submitted|Draft|Unable|Change|InProgress|Expiring|warning/i.test(s)?'warning':'neutral';
  const LABEL={InProgress:'In progress'};
  const tag=(s,t)=>`<span class="tag ${t||tagClass(s)}">${esc(LABEL[s]||s)}</span>`;
  const ends=v=>v?when(v):'No end date';
  const proposed=(s='Proposed')=>`<span class="tag proposed" title="Design proposal; not in the application contract">${esc(s)}</span>`;
  const note=(title,body,t='')=>`<div class="note ${t}"><strong>${esc(title)}</strong><div>${body}</div></div>`;
  const card=(title,body,sub='',actions='')=>`<section class="card"><div class="card-head"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="row">${actions}</div>`:''}</div>${body}</section>`;
  const facts=rows=>`<dl class="facts">${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const btn=(label,action,data='',cls='',disabled=false,extra='')=>`<button type="button" data-action="${action}" ${data} class="${cls}" ${disabled?'disabled':''} ${extra}>${label}</button>`;
  const field=(n,label,value='',type='text',attrs='',hint='')=>`<label class="field" for="f-${n}"><span>${label}</span><input id="f-${n}" name="${n}" type="${type}" value="${esc(value)}" ${attrs}>${hint?`<small>${hint}</small>`:''}</label>`;
  const select=(n,label,options,value,attrs='')=>`<label class="field" for="f-${n}"><span>${label}</span><select id="f-${n}" name="${n}" ${attrs}>${options.map(o=>{const [v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(v)===String(value??'')?'selected':''}>${esc(t)}</option>`;}).join('')}</select></label>`;
  const area=(n,label,value='',hint='')=>`<label class="field" for="f-${n}"><span>${label}</span><textarea id="f-${n}" name="${n}" maxlength="500">${esc(value)}</textarea>${hint?`<small>${hint}</small>`:''}</label>`;
  const check=(n,label,checked=false)=>`<label class="check-label"><input type="checkbox" name="${n}" ${checked?'checked':''}><span>${label}</span></label>`;
  const capName=k=>`${esc(M.LABELS[k]||k)} <span class="key">${esc(k)}</span>`;
  const issuerTag=p=>p.issuer==='PPO-EntraDemo'?tag('Hosted demo (Entra)','info'):tag('Local synthetic','neutral');
  const statusTag=p=>{const t=state.testers.find(x=>x.userId===p.id);if(t&&t.expiresAt<=state.now)return tag('Tester expired','danger');return p.active?tag('Active'):tag('Inactive');};
  const writable=()=>['admin','approver','lead'].includes(ui.role);

  /* ---------- persistence ---------- */
  function persist(){if(damaged)return;try{localStorage.setItem(KEY,JSON.stringify({schema:'ppo-access-review-session/v1',state,ui}));storageOK=true;}catch{storageOK=false;}}
  function load(){
    let raw=null;try{raw=localStorage.getItem(KEY);}catch{storageOK=false;return;}
    if(!raw)return;
    try{const saved=JSON.parse(raw);M.validate(saved.state);if(!saved.ui||!M.roles[saved.ui.role])throw Error('Invalid preview settings.');state=saved.state;ui={...defaults(),...saved.ui};}
    catch(e){damaged={raw,message:e.message};}
  }
  function status(text){$('save-status').textContent=text;}
  function savedStatus(){status(storageOK?'Saved in this browser':'Session only — browser storage unavailable; changes clear on reload');}
  const toast=msg=>{const t=$('toast');t.textContent=msg;t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{t.hidden=true;},2600);};
  const download=(filename,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=filename;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0);};

  /* ---------- commands ---------- */
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  async function run(type,payload,message){
    if(busy)throw Error('A save is already in progress.');
    if(external)throw Error('Another tab or session changed this workspace. Your entries are kept; reload the latest version before saving.');
    busy=true;status('Saving…');
    try{
      if(saveMode==='slow'){saveMode='none';await delay(700);}
      if(saveMode==='fail'){saveMode='none';throw Error('Simulated save failure. Nothing was saved and your entries are kept.');}
      if(saveMode==='conflict'){saveMode='none';external=true;throw Error('Another tab or session changed this workspace. Your entries are kept; reload the latest version before saving.');}
      const c={op:`ar-${Date.now().toString(36)}-${++opCount}`,expectedVersion:state.version,type,payload};
      const r=M.command(state,c,ui.role);
      state=r.state;persist();
      if(saveMode==='unknown'){saveMode='none';pending={c,role:ui.role,message};status('Outcome unknown — response lost');render();return r.result;}
      savedStatus();if(message)toast(message);render();return r.result;
    }catch(e){if(!/response lost/.test(e.message))status(external?'Conflict — reload required':'Not saved');throw e;}
    finally{busy=false;}
  }
  function recover(){
    const r=M.command(state,pending.c,pending.role);
    pending=null;savedStatus();toast(r.recovered?'Original operation found — no duplicate change was made.':'Saved.');render();
  }

  /* ---------- modal ---------- */
  function openModal({kicker='Access',title,body,submit='Save',onSubmit,danger=false,wide=false}){
    const d=$('modal');origin=document.activeElement;handler=onSubmit||null;dirty=false;
    $('modal-kicker').textContent=kicker;$('modal-title').textContent=title;$('modal-body').innerHTML=body;
    $('modal-error').hidden=true;$('modal-submit').hidden=!onSubmit;$('modal-submit').textContent=submit;$('modal-submit').className=danger?'primary danger-button':'primary';
    $('cancel-button').textContent=onSubmit?'Cancel':'Close';d.style.width=wide?'min(900px,calc(100vw - 24px))':'';
    hydrate($('modal'));if(!d.open)d.showModal();
    const first=d.querySelector('.modal-body input:not([type=hidden]),.modal-body select,.modal-body textarea');(first||$('modal-submit')).focus();
  }
  function closeModal(force=false){
    const d=$('modal');if(!d.open)return;
    if(!force&&dirty&&handler&&!confirm('Discard the entries in this form?'))return false;
    d.close();handler=null;dirty=false;if(origin&&origin.isConnected)origin.focus();return true;
  }
  function formData(){const f=$('modal-form'),o={};f.querySelectorAll('[name]').forEach(el=>{o[el.name]=el.type==='checkbox'?el.checked:el.value;});return o;}
  function showError(msg){const e=$('modal-error');e.textContent=msg;e.hidden=false;e.focus();}

  /* ---------- inspection panel ---------- */
  function openPanel(kicker,title,body){$('panel-kicker').textContent=kicker;$('panel-title').textContent=title;$('panel-body').innerHTML=body;$('panel').hidden=false;hydrate($('panel'));origin=document.activeElement;$('panel').querySelector('[data-action=closePanel]').focus();}
  function closePanel(){$('panel').hidden=true;if(origin&&origin.isConnected)origin.focus();}
  function traceHtml(res,label){
    return `${note(res.allowed?'Allowed':'Not allowed',esc(label),res.allowed?'success':'danger')}
      <ol class="trace">${res.steps.map(s=>`<li><span>${s.pass===null?tag('Not reproduced','neutral'):s.pass?tag('Pass','success'):tag('Fail','danger')}</span><div><strong>${esc(s.label)}</strong><div class="meta">${esc(s.detail)}</div></div></li>`).join('')}</ol>
      ${res.grant?facts([['Matching grant',`<code>${esc(res.grant.id)}</code>`],['Scope',esc(M.scopeLabel(state,res.grant))],['Provenance',esc(res.grant.provenance)]]):''}
      ${note('This is a reproduction','The page mirrors the server rule in <code>src/platform/permissions.ts</code>. The server remains the authority; an explanation is not permission.','info')}`;
  }
  function explainPanel(personId,cap,companyId,siteId,targetLabel){
    const res=M.evaluate(state,personId,cap,companyId||null,siteId||null);
    openPanel('Explain access',`${name(personId)} · ${cap}`,traceHtml(res,`${M.LABELS[cap]||cap} — ${targetLabel}`)+
      (writable()&&!res.allowed&&M.canSeePerson(state,ui.role,personId)&&ui.role!=='approver'?`<div class="row">${btn('Request this access','newRequest',`data-person="${personId}" data-cap="${cap}" data-company="${companyId||''}" data-site="${siteId||''}"`,'primary')}</div>`:''));
  }
  function grantPanel(id){
    const g=state.grants.find(x=>x.id===id);if(!g)return;
    const c=M.capability(g.capability);
    openPanel('Grant detail',M.LABELS[g.capability],facts([['Grant ID',`<code>${esc(g.id)}</code>`],['Person',esc(name(g.userId))],['Capability',`<code>${esc(g.capability)}</code>`],['Family',esc(c.familyName)],['Type',c.reads?'Read':'Change'],
      ['Scope type',esc(g.scopeType)],['Scope',esc(M.scopeLabel(state,g))],['Valid from',esc(when(g.validFrom))],['Valid to',esc(ends(g.validTo))],['State',tag(M.grantState(g,state.now))],['Provenance',esc(g.provenance)]])+
      (c.restricted?note('Restricted capability','Gives access to restricted Finance or internal information.','warning'):'')+(c.own?note('Own records only','Limited to the holder’s own records — field assignments or owned opportunities — by the owning module.','info'):'')+
      note('Contract fields','Shape and rules from <code>ppo.permission_grants</code> (migrations 0001–0002): unique per person, capability and scope; end after start; a site belongs to its company.','')+
      (g.provenance==='Fixture'||g.provenance==='Hosted setup script'?note('No application audit','Grant creation is not an application audit event today. This row stands in for seed or setup-script provisioning.','warning'):''));
  }

  /* ---------- render ---------- */
  function renderTabs(){
    $('tabs').innerHTML=M.VIEWS.map(v=>`<button type="button" role="tab" id="tab-${v}" data-view="${v}" aria-selected="${ui.view===v}" aria-controls="content" tabindex="${ui.view===v?0:-1}">${esc(TITLES[v])}</button>`).join('');
    $('role-label').innerHTML=`Preview role: <strong>${esc(role().title)}</strong> · ${esc(me().name)}`;
  }
  function renderRecovery(){
    let h='';
    if(damaged)h=note('Saved session needs attention',`The stored session could not be opened (${esc(damaged.message)}). It has been kept unchanged. <div class="row" style="margin-top:8px">${btn('Download stored text','raw','','small')}${btn('Start a fresh session','resetDamaged','','small danger-button')}</div>`,'danger');
    else if(pending)h=note('Outcome unknown',`The last save may have reached the workspace, but the response was lost. Recover the original operation instead of repeating it. <div class="row" style="margin-top:8px">${btn('Recover original operation','recover','','small primary')}</div>`,'warning');
    else if(external)h=note('Conflict','Another tab or session changed this workspace. Nothing was overwritten. <div class="row" style="margin-top:8px">'+btn('Reload latest version','reloadLatest','','small primary')+'</div>','danger');
    if(!storageOK)h+=note('Session only','Browser storage is unavailable. Changes stay in this tab and clear on reload.','warning');
    if(notice){h+=note('Selection cleared',esc(notice),'info');notice='';}
    $('recovery').innerHTML=h;
  }
  function renderToolbar(){
    const f=ui.filters;let h='';
    if(ui.view==='people'){
      h=`<label class="field search" for="f-q"><span>Search people and grants</span><input id="f-q" name="filter-q" type="search" value="${esc(f.q)}" placeholder="Name, capability, company or site"></label>`+
        select('issuer','Issuer',[['','All issuers'],['PPO-LocalSynthetic','Local synthetic'],['PPO-EntraDemo','Hosted demo (Entra)']],f.issuer,'data-filter="issuer"')+
        select('status','Status',[['','All'],['active','Active'],['inactive','Inactive']],f.status,'data-filter="status"')+
        select('company','Company',[['','All companies'],...state.companies.map(c=>[c.id,`${c.name} (${c.erpCompanyId})`])],f.company,'data-filter="company"')+
        select('family','Capability family',[['','All families'],...M.families().map(x=>[x,M.FAMILY_NAMES[x]])],f.family,'data-filter="family"')+
        select('sort','Sort',[['attention','Attention first'],['name','Name']],f.sort,'data-filter="sort"')+
        btn('Clear filters','clear','','small');
    }
    if(ui.view==='changes'&&writable())h=btn(`${icon('plus')}New access request`,'newRequest','','primary',ui.role==='approver')+(ui.role==='approver'?'<span class="meta">Approvers decide requests; they do not raise them.</span>':'');
    $('toolbar').innerHTML=h;
  }
  const layout=(main,support='')=>`<div class="layout ${support?'':'full'}"><div class="stack">${main}</div>${support?`<aside class="support" aria-label="Supporting information">${support}</aside>`:''}</div>`;
  function stateBlock(){
    if(mode==='loading')return `<div class="card" aria-busy="true"><h2>Loading access records…</h2><div class="loading"></div><div class="loading"></div><div class="loading"></div></div>`;
    if(mode==='failed')return `<div class="empty"><h2>Access records could not be loaded</h2><p>No counts are shown because nothing was read. This is not an all-clear.</p><div class="row" style="justify-content:center;margin-top:10px">${btn('Retry','retry','','primary')}</div></div>`;
    if(mode==='empty')return `<div class="empty"><h2>No identities in this scope</h2><p>The workspace returned no people for your preview role. Check your scope before assuming nobody has access.</p></div>`;
    return '';
  }
  function render(){
    renderTabs();
    const c=$('content');let html;
    if(!M.viewAllowed(ui.role,ui.view))html=`<div class="empty"><h2>Not available to your role</h2><p>${esc(role().title)} cannot open ${esc(TITLES[ui.view])}. Access reviews and change requests are shown only to administrators, approvers, team leads and auditors.</p></div>`;
    else if(stateBlock()&&['people','person'].includes(ui.view))html=stateBlock();
    else html=({people:viewPeople,person:viewPerson,catalogue:viewCatalogue,changes:viewChanges,reviews:viewReviews,history:viewHistory})[ui.view]();
    renderToolbar();renderRecovery();
    c.innerHTML=html;hydrate(c);persist();
  }
  function hydrate(el){el.querySelectorAll('[data-icon]').forEach(x=>{x.outerHTML=icon(x.dataset.icon);});}

  /* ---------- People ---------- */
  function viewPeople(){
    const counts=M.queueCounts(state,ui.role),rows=M.people(state,ui.role,ui.filters);
    if(ui.selected&&!rows.some(p=>p.id===ui.selected)&&ui.view==='people'&&rows.length){notice='The selected person is outside the current results, so the selection was cleared.';ui.selected=null;}
    const partial=mode==='partial';
    const queues=`<div class="queues">${M.QUEUES.map(q=>`<button type="button" class="queue" data-action="queue" data-queue="${q.id}" aria-pressed="${ui.filters.queue===q.id}"><strong>${partial&&q.id==='tester'?'—':counts[q.id]}</strong><span>${esc(q.label)}</span></button>`).join('')}</div>`;
    const table=rows.length?`<div class="table-wrap"><table class="cards"><caption class="sr-only">People and access</caption><thead><tr><th>Person</th><th>Issuer</th><th>Status</th><th>Current scope</th><th>Current grants</th><th>Attention</th><th>Sessions</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${rows.map(p=>{
      const gs=M.heldNow(state,p.id),fam=[...new Set(gs.map(g=>g.capability.split('.')[0]))],scopes=[...new Set(gs.map(g=>M.scopeLabel(state,g)))],att=M.attention(state,p);
      const tester=state.testers.find(t=>t.userId===p.id),unavailable=partial&&tester;
      return `<tr class="${ui.selected===p.id?'selected':''}"><td data-label="Person"><strong>${esc(p.name)}</strong><div class="key">${esc(M.mask(p))}</div>${p.designOnly?proposed('Design-only identity'):''}</td>
        <td data-label="Issuer">${issuerTag(p)}</td><td data-label="Status">${unavailable?tag('Identity source unavailable','warning'):statusTag(p)}</td>
        <td data-label="Current scope">${scopes.length?scopes.map(esc).join('<br>'):'<span class="meta">No current grants</span>'}</td>
        <td data-label="Current grants">${gs.length} <span class="meta">across ${fam.length} famil${fam.length===1?'y':'ies'}</span></td>
        <td data-label="Attention"><div class="tags">${att.length?att.map(a=>tag(M.QUEUES.find(q=>q.id===a).label,a==='pending'?'info':'warning')).join(''):'<span class="meta">None</span>'}</div></td>
        <td data-label="Sessions">${unavailable?'<span class="meta">Unknown</span>':p.sessions.count?`${p.sessions.count} · latest expiry ${esc(when(p.sessions.latest))}`:'<span class="meta">None active</span>'}</td>
        <td data-label="Action">${btn('Open access','openPerson',`data-id="${p.id}" aria-label="Open access for ${esc(p.name)}"`,'small')}</td></tr>`;}).join('')}</tbody></table></div>`
      :`<div class="empty"><h2>No people match</h2><p>Change the search or filters. Queue tiles are filters, not states.</p>${btn('Clear filters','clear','','small')}</div>`;
    const main=card('Attention queues',queues,'Select a tile to filter the register. Counts use the fixed clock and your preview scope.')+
      (partial?note('Partial source results','The hosted identity source did not respond. Hosted tester status, sessions and the tester queue are shown as unknown, not zero. Local identities are complete.','warning'):'')+
      card(`People <span class="meta">(${rows.length})</span>`,table,'A register, not a person × capability grid: scope and validity stay visible and nothing can be bulk-ticked.');
    const support=card('How to read this',`<p>Each grant gives one person one capability at one scope — the whole workspace, one company, or one site — for a validity window.</p><p>Companies can share a display name. The ERP company key (for example <code>SYN-A</code>) tells them apart.</p>`)+
      card('Evidence status',`${facts([['Grants and scopes','Contract'],['Hosted testers','Contract (demo track)'],['Teams, bundles, requests, reviews',proposed()],['Review cadence','Not agreed (D-020)'],['Evidence retention','Not agreed (D-012 / D-021)']])}`);
    return layout(main,support);
  }

  /* ---------- Person ---------- */
  function viewPerson(){
    if(ui.role==='self')ui.selected=role().person;
    const p=ui.selected&&M.person(state,ui.selected);
    if(!p)return `<div class="empty"><h2>Choose a person</h2><p>Open someone from the People register to see their grants, effective access and history.</p>${btn('Go to People','view','data-view="people"','primary')}</div>`;
    if(!M.canSeePerson(state,ui.role,p.id))return `<div class="empty"><h2>Not available to your role</h2><p>You can see only people within your scope.</p></div>`;
    const tester=state.testers.find(t=>t.userId===p.id),partial=mode==='partial'&&tester;
    const grants=state.grants.filter(g=>g.userId===p.id);
    const byFamily=M.families().map(f=>[f,grants.filter(g=>g.capability.startsWith(f+'.'))]).filter(([,gs])=>gs.length);
    const canRequest=['admin','lead'].includes(ui.role)&&p.issuer==='PPO-LocalSynthetic'&&p.active&&p.id!==role().person;
    const identity=card(`${esc(p.name)} ${issuerTag(p)} ${partial?tag('Identity source unavailable','warning'):statusTag(p)} ${p.designOnly?proposed('Design-only identity'):''}`,
      facts([['User ID',`<code>${esc(p.id)}</code>`],['Issuer',`<code>${esc(p.issuer)}</code>`],['Subject',`<code>${esc(M.mask(p))}</code>`],['Synthetic','Yes'],['Active',p.active?'Yes':'No'],
        ...(p.deactivatedAt?[['Inactive since',esc(when(p.deactivatedAt))]]:[]),
        ...(tester?[['Tester expiry',partial?`Unknown — last known ${esc(when(tester.lastKnown||tester.expiresAt))}`:esc(when(tester.expiresAt))],['Tester enabled',tester.enabled?'Yes':'No']]:[])]),
      p.issuer==='PPO-EntraDemo'?'Hosted testers are provisioned by the owner-run setup script (at most five, expiry within 14 days). This page never extends or adds them.':'',
      canRequest?btn(`${icon('plus')}Request change`,'newRequest',`data-person="${p.id}"`,'primary'):'');
    const revocation=!p.active?note('Server access: refused',`The server refuses every session for this identity${p.deactivatedAt?' from '+esc(when(p.deactivatedAt)):''}, whatever grants remain. Current grants: ${M.heldNow(state,p.id).length}.`,'danger')+
      note('Offline device content: may persist','Content already cached on an offline device is not recalled until the device reconnects or is recovered. This is not instant revocation.','warning'):'';
    const grantTable=byFamily.length?byFamily.map(([f,gs])=>`<details ${gs.length<=6||ui.allFamilies?'open':''}><summary>${esc(M.FAMILY_NAMES[f])} <span class="meta">${gs.length} grant(s)</span></summary><div><table class="cards"><thead><tr><th>Capability</th><th>Scope</th><th>Valid from</th><th>Valid to</th><th>State</th><th>Provenance</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${gs.map(g=>`<tr>
      <td data-label="Capability">${capName(g.capability)}</td><td data-label="Scope">${esc(g.scopeType)} · ${esc(M.scopeLabel(state,g))}</td><td data-label="Valid from">${esc(when(g.validFrom))}</td><td data-label="Valid to">${esc(ends(g.validTo))}</td>
      <td data-label="State">${tag(M.grantState(g,state.now))}</td><td data-label="Provenance">${esc(g.provenance)}</td>
      <td data-label="Actions"><div class="row">${btn('Details','grant',`data-id="${g.id}" aria-label="Details for ${esc(g.capability)} at ${esc(M.scopeLabel(state,g))}"`,'small')}${btn('Explain','explainGrant',`data-id="${g.id}" aria-label="Explain ${esc(g.capability)} at ${esc(M.scopeLabel(state,g))}"`,'small')}</div></td></tr>`).join('')}</tbody></table></div></details>`).join('')
      :`<div class="empty"><h2>No grants</h2><p>This identity can sign in but cannot read any business record.</p></div>`;
    const mx=M.matrix(state,p.id),shown=ui.allFamilies?mx:mx.filter(r=>r.cells.some(c=>c.allowed)||grants.some(g=>g.capability.startsWith(r.family+'.')));
    const targets=M.matrixTargets(state);
    const matrix=`<div class="table-wrap"><table class="matrix"><caption class="sr-only">Effective access by capability family and target</caption><thead><tr><th scope="col">Family</th>${targets.map(t=>`<th scope="col">${esc(t.label)}</th>`).join('')}</tr></thead><tbody>${shown.length?shown.map(r=>`<tr><th scope="row">${esc(r.name)}</th>${r.cells.map(c=>{
      const cls=!c.allowed?'none':c.viaWorkspace?'wide':'some',text=!c.allowed?'Not allowed':c.allowed===c.total?'All allowed':'Some allowed';
      return `<td><button type="button" class="cell ${cls}" data-action="cell" data-family="${r.family}" data-target="${c.target.id}" aria-label="${esc(r.name)} at ${esc(c.target.label)}: ${c.allowed} of ${c.total} allowed${c.viaWorkspace?', via a workspace grant':''}"><b>${c.allowed}/${c.total}</b><span>${text}${c.viaWorkspace?' · via workspace':''}</span></button></td>`;}).join('')}</tr>`).join(''):`<tr><td colspan="${targets.length+1}">No capability family is allowed anywhere.</td></tr>`}</tbody></table></div>
      <div class="row" style="margin-top:8px">${btn(ui.allFamilies?'Show families with grants only':'Show all 13 families','toggleFamilies','','small')}</div>`;
    const teams=M.teamsOf(state,p.id),bundles=M.bundleMatches(state,p.id),sod=M.sodWarnings(state,p.id);
    const openReq=M.visibleRequests(state,ui.role).filter(r=>r.subjectId===p.id&&!['Effective','Withdrawn'].includes(r.state));
    const support=card(`Teams ${proposed()}`,teams.length?`<ul>${teams.map(t=>`<li>${esc(t.name)}${t.lead===p.id?' (lead)':''}</li>`).join('')}</ul>`:'<p class="meta">No team.</p>','Teams grant no access in this design.')+
      card(`Matching role bundles ${proposed()}`,bundles.length?`<ul>${bundles.map(b=>`<li>${esc(b.bundle.name)} ${esc(b.revision)}: ${b.missing.length?`matches except ${b.missing.length} — <span class="key">${b.missing.map(esc).join(', ')}</span>`:'full match'}</li>`).join('')}</ul>`:'<p class="meta">No bundle matches half or more of the current grants.</p>','Derived from current grants. Bundles are not adopted and assign no one.')+
      card('Separation of duties',sod.length?sod.map(s=>note(`${s.a} + ${s.b}`,esc(s.rationale)+' Warning only; the runtime still blocks the same person acting twice on one record.','warning')).join(''):'<p class="meta">No warnings for current grants.</p>')+
      card('Sessions',partial?'<p>Unknown — identity source unavailable.</p>':p.sessions.count?`<p>${p.sessions.count} active · latest expiry ${esc(when(p.sessions.latest))}</p><p class="meta">Tokens are never shown.</p>`:'<p class="meta">No active sessions.</p>')+
      card('Open requests',openReq.length?openReq.map(r=>`<p>${btn(esc(r.reference),'openRequest',`data-id="${r.id}"`,'link-button')} ${tag(r.state)}</p>`).join(''):'<p class="meta">None.</p>');
    return layout(identity+revocation+card('Grants',grantTable,'Current, future and expired grants. Expired grants are kept, not hidden.')+card('Effective access',matrix,'Computed with the server rule. Select a cell to see which capabilities are allowed and why.'),support);
  }

  /* ---------- Catalogue ---------- */
  function viewCatalogue(){
    const tabs=[['capabilities','Capabilities (74)'],['bundles','Role bundles'],['teams','Teams']];
    let body='';
    if(ui.catalogueTab==='capabilities'){
      const cat=M.catalogue();
      body=card('Capability contract',`<div class="table-wrap"><table class="cards"><caption class="sr-only">Capabilities</caption><thead><tr><th>Capability</th><th>Family</th><th>Type</th><th>Flags</th><th>Current holders</th></tr></thead><tbody>${cat.map(c=>{
        const holders=M.visiblePeople(state,ui.role).filter(p=>M.heldNow(state,p.id).some(g=>g.capability===c.key)).length;
        return `<tr><td data-label="Capability">${capName(c.key)}</td><td data-label="Family">${esc(c.familyName)}</td><td data-label="Type">${c.reads?'Read':'Change'}</td>
        <td data-label="Flags"><div class="tags">${c.own?tag('Own records only','info'):''}${c.restricted?tag('Restricted','warning'):''}${c.hostedOnly?tag('Hosted demo only','neutral'):''}${CAPS.hosted_demo.includes(c.key)?tag('In tester set','neutral'):''}</div></td>
        <td data-label="Current holders">${btn(String(holders),'holders',`data-cap="${c.key}" aria-label="${holders} current holders of ${c.key}"`,'small')}</td></tr>`;}).join('')}</tbody></table></div>`,
        `Generated from <code>${esc(CAPS.source)}</code> (SHA-256 <code>${esc(CAPS.source_sha256.slice(0,12))}…</code>). Keys are authoritative; plain-English labels are proposed design copy.`);
    }
    if(ui.catalogueTab==='bundles'){
      const b=state.bundles.find(x=>x.id===ui.bundle)||state.bundles[0];
      const list=`<div class="list">${state.bundles.map(x=>`<button type="button" class="list-button" data-action="bundle" data-id="${x.id}" aria-current="${x.id===b.id}"><strong>${esc(x.name)}</strong><span class="meta">${esc(x.family)} · ${x.revisions.map(r=>r.revision).join(', ')}</span></button>`).join('')}</div>`;
      const holders=M.people(state,ui.role,{}).map(p=>({p,m:M.bundleMatches(state,p.id).find(m=>m.bundle.id===b.id)})).filter(x=>x.m);
      const detail=card(`${esc(b.name)} ${tag('Proposed — not adopted (D-020)','proposed')}`,
        `${facts([['Family',esc(b.family)],['Revisions',b.revisions.map(r=>`${esc(r.revision)} ${tag(r.state,r.state==='Draft'?'warning':'proposed')}`).join(' ')],['Allowed scopes',esc(b.revisions.at(-1).scopes.join(', '))]])}
        ${b.revisions.map(r=>`<details ${r===b.revisions[0]?'open':''}><summary>${esc(r.revision)} capabilities <span class="meta">${r.caps.length}</span></summary><div><ul>${r.caps.map(k=>`<li>${capName(k)}</li>`).join('')}</ul></div></details>`).join('')}
        ${b.revisions.length>1?`<div class="row" style="margin-top:10px">${btn(`Compare ${b.revisions[0].revision} → ${b.revisions[1].revision}`,'compare',`data-id="${b.id}"`,'primary')}</div>`:''}
        <h3 style="margin-top:14px">People whose grants match</h3>${holders.length?`<ul>${holders.map(x=>`<li>${esc(x.p.name)} — ${x.m.missing.length?`missing ${x.m.missing.map(esc).join(', ')}`:'full match'}</li>`).join('')}</ul>`:'<p class="meta">No one in your scope.</p>'}
        ${note('A bundle is not an authority','A bundle would expand into individual grants at a chosen scope. The server keeps checking grants only. A new revision never changes existing holders silently; it lists them for review.','info')}`,
        'No Adopt action exists in this design.');
      body=`<div class="split">${list}${detail}</div>`;
    }
    if(ui.catalogueTab==='teams'){
      body=note('Teams grant no access','In r01 a team routes reviews and powers team views only. Team-inherited access is a separate D-020 decision.','info')+state.teams.map(t=>card(`${esc(t.name)} ${proposed()}`,
        facts([['Lead',esc(name(t.lead))],['Purpose',esc(t.purpose)]])+`<div class="table-wrap" style="margin-top:10px"><table class="cards"><thead><tr><th>Member</th><th>From</th><th>To</th><th>Status</th></tr></thead><tbody>${t.members.filter(m=>M.canSeePerson(state,ui.role,m.userId)).map(m=>`<tr><td data-label="Member">${esc(name(m.userId))}</td><td data-label="From">${esc(day(m.from+'T00:00:00+10:00'))}</td><td data-label="To">${m.to?esc(day(m.to+'T00:00:00+10:00')):'Current'}</td><td data-label="Status">${M.isTeamMember(state,t.id,m.userId)?tag('Current'):tag('Ended','neutral')}</td></tr>`).join('')}</tbody></table></div>`)).join('');
    }
    const support=card('Separation-of-duties pairs',M.SOD.map(s=>note(`${s.a} + ${s.b}`,`${esc(s.rationale)}<div class="meta">Source: ${esc(s.source)}</div>`)).join('')+note('Warnings only','Only separations the runtime already enforces are listed. Job pack check and issue are not separated by the runtime, so no pair is shown for them.','info'),'Proposed warnings; no policy adopted.')+
      card(`Administrative capabilities ${proposed()}`,`<ul>${M.ADMIN_CAPS.map(k=>`<li><code>${esc(k)}</code></li>`).join('')}</ul><p class="meta">Not part of the 74-value application contract. Used only by the preview roles.</p>`);
    return layout(`<div class="subtabs" role="group" aria-label="Catalogue sections">${tabs.map(([k,l])=>btn(l,'catTab',`data-tab="${k}" aria-pressed="${ui.catalogueTab===k}"`)).join('')}</div>`+body,support);
  }

  /* ---------- Changes ---------- */
  const opText=(r,o)=>{
    if(o.kind==='add')return `Add ${o.capability} · ${M.scopeLabel(state,o)} · ${o.validTo?`ends ${when(o.validTo)}`:'no end date'}`;
    const g=state.grants.find(x=>x.id===o.grantId),gl=g?`${g.capability} (${M.scopeLabel(state,g)})`:'unknown grant';
    if(o.kind==='validity')return `Change the end of ${gl} to ${o.validTo?when(o.validTo):'no end date'}`;
    if(o.kind==='scope')return `Move ${gl} to ${M.scopeLabel(state,o)}`;
    return `Revoke ${gl} from ${when(r.effectiveFrom)}`;
  };
  function viewChanges(){
    if(mode!=='complete'&&mode!=='partial')return stateBlock();
    const all=M.visibleRequests(state,ui.role),f=ui.requestFilter;
    const list=all.filter(r=>f==='all'||(f==='open'?!['Effective','Withdrawn'].includes(r.state):r.state===f)).sort((a,b)=>b.reference.localeCompare(a.reference));
    if(!ui.request||!all.some(r=>r.id===ui.request))ui.request=(list[0]||all[0]||{}).id||null;
    const r=all.find(x=>x.id===ui.request);
    const listHtml=`${select('reqfilter','Show',[['open','Open requests'],['all','All requests'],...M.REQUEST_STATES.map(s=>[s,s])],f,'data-filter="requestFilter"')}<div class="list" style="margin-top:8px">${list.length?list.map(x=>`<button type="button" class="list-button" data-action="openRequest" data-id="${x.id}" aria-current="${x.id===ui.request}"><strong>${esc(x.reference)}</strong><span>${esc(name(x.subjectId))}</span><span>${tag(x.state)}</span></button>`).join(''):'<p class="meta">No requests match.</p>'}</div>`;
    if(!r)return layout(`<div class="split"><div>${listHtml}</div><div class="empty"><h2>No access requests</h2><p>Requests you can see will appear here.</p></div></div>`);
    const me_=role().person,warnings=M.requestWarnings(state,r),pv=M.preview(state,r);
    const isRequester=r.requesterId===me_||ui.role==='admin';
    const actions=[
      ['Draft','Returned'].includes(r.state)&&isRequester&&['admin','lead'].includes(ui.role)?btn('Edit','editRequest',`data-id="${r.id}"`):'',
      r.state==='Draft'&&isRequester&&['admin','lead'].includes(ui.role)?btn('Submit for review','submitRequest',`data-id="${r.id}"`,'primary'):'',
      r.state==='Submitted'&&ui.role==='approver'&&r.reviewerId===me_?btn('Decide','decideRequest',`data-id="${r.id}"`,'primary'):'',
      r.state==='Submitted'&&ui.role==='approver'&&r.reviewerId!==me_?`<span class="meta">Awaiting ${esc(name(r.reviewerId))}</span>`:'',
      r.state==='Approved'&&ui.role==='admin'?btn('Simulated apply','applyRequest',`data-id="${r.id}"`,'primary'):'',
      ['Draft','Submitted','Returned'].includes(r.state)&&isRequester&&['admin','lead'].includes(ui.role)?btn('Withdraw','withdrawRequest',`data-id="${r.id}"`,'danger-button'):''].join('');
    const changeTable=pv.changes.length?`<div class="table-wrap"><table class="cards"><caption class="sr-only">Before and after</caption><thead><tr><th>Change</th><th>Capability</th><th>Before</th><th>After</th></tr></thead><tbody>${pv.changes.map(c=>`<tr class="${c.change==='Added'?'added':c.change==='Revoked'?'revoked':'changed'}">
      <td data-label="Change">${c.change==='Added'?icon('plus'):c.change==='Revoked'?icon('x'):icon('check')} ${esc(c.change)}</td><td data-label="Capability">${capName(c.grant.capability)}</td>
      <td data-label="Before">${c.before?`${esc(M.scopeLabel(state,c.before))}<br><span class="meta">${esc(when(c.before.validFrom))} to ${esc(c.before.validTo?when(c.before.validTo):'no end date')}</span>`:'—'}</td>
      <td data-label="After">${esc(M.scopeLabel(state,c.grant))}<br><span class="meta">${esc(when(c.grant.validFrom))} to ${esc(c.grant.validTo?when(c.grant.validTo):'no end date')}</span></td></tr>`).join('')}</tbody></table></div>`:'<p class="meta">No grant would change.</p>';
    const detail=card(`${esc(r.reference)} ${tag(r.state)} ${proposed('Proposed workflow')}`,
      facts([['Person affected',esc(name(r.subjectId))],['Requested by',esc(name(r.requesterId))],['Reviewer',r.reviewerId?esc(name(r.reviewerId)):'<em>Not chosen</em>'],['Effective from',esc(when(r.effectiveFrom))],['Version',String(r.version)],['Reason',esc(r.reason)],
        ...(r.origin?[['Origin',`Access review item · ${esc((state.reviews.find(v=>v.id===r.origin.reviewId)||{}).name||'')}${r.origin.attestedBy?` · recommended by ${esc(name(r.origin.attestedBy))}, who cannot decide it`:''}`]]:[]),
        ...(r.decision?[['Decision',`${tag(r.decision.decision)} by ${esc(name(r.decision.by))}, ${esc(when(r.decision.at))} — ${esc(r.decision.reason)}`]]:[]),
        ...(r.appliedAt?[['Applied',`${esc(when(r.appliedAt))} by ${esc(name(r.appliedBy))} · simulated`]]:[])])+
      `<h3 style="margin-top:14px">Operations</h3><ol>${r.operations.map(o=>`<li>${esc(opText(r,o))}</li>`).join('')}</ol>`+
      (warnings.length?`<h3 style="margin-top:14px">Warnings</h3>${warnings.map(w=>note(w.kind==='sod'?'Separation of duties':w.kind==='widening'?'Workspace-wide scope':w.kind==='restricted'?'Restricted access':'Open-ended access',esc(w.text),'warning')).join('')}`:'')+
      `<h3 style="margin-top:14px">Before and after</h3>${changeTable}`+
      (r.state==='Approved'?note('Simulated apply','No server command for changing access exists yet. Applying here updates this local design only and records a proposed access event.','info'):'')+
      `<h3 style="margin-top:14px">History</h3><ul class="timeline">${[...(r.history[0]&&r.history[0].state==='Draft'?[]:[{state:'Draft',by:r.requesterId,at:r.createdAt}]),...r.history].map(h=>`<li class="proposed-event"><strong>${esc(h.state)}</strong> · ${esc(name(h.by))} · <span class="meta">${esc(when(h.at))}</span>${h.note?`<div class="meta">${esc(h.note)}</div>`:''}</li>`).join('')}</ul>`,
      'Requester, reviewer and affected person must be three different people.',actions);
    return layout(`<div class="split"><div>${listHtml}</div><div>${detail}</div></div>`,card('Reference code',`<p><code>SYN-PPO-ACR-</code> is a ${proposed('proposed type code')}. It is not in the PPO-STD-001 §10.2 catalogue; registration is deferred to one r05 amendment when a runtime increment allocates these references.</p>`)+card('Rules shown here',`<ul><li>A reason is required to draft, return, approve or withdraw.</li><li>You cannot change, approve or apply your own access.</li><li>Hosted testers are changed only by the owner-run setup script.</li><li>An existing grant (even expired) blocks a duplicate; change its validity instead.</li><li>Retrying the same operation returns the original result.</li></ul>`));
  }

  /* ---------- Reviews ---------- */
  function viewReviews(){
    if(mode!=='complete'&&mode!=='partial')return stateBlock();
    const all=M.visibleReviews(state,ui.role);
    if(!all.length)return layout(`<div class="empty"><h2>No access reviews assigned</h2><p>Reviews assigned to you will appear here.</p></div>`);
    if(!all.some(v=>v.id===ui.review))ui.review=all[0].id;
    const v=all.find(x=>x.id===ui.review),mine=v.reviewerId===role().person&&v.state==='InProgress'&&M.roles[ui.role].admin.includes('admin.access.review');
    const decided=v.items.filter(i=>i.decision).length;
    const list=`<div class="list">${all.map(x=>`<button type="button" class="list-button" data-action="openReview" data-id="${x.id}" aria-current="${x.id===v.id}"><strong>${esc(x.name)}</strong><span class="meta">${esc(x.scopeLabel)}</span><span>${tag(x.state==='Complete'?'Complete':'InProgress')} <span class="meta">${x.items.filter(i=>i.decision).length}/${x.items.length} decided</span></span></button>`).join('')}</div>`;
    const people=[...new Set(v.items.map(i=>i.snapshot.userId))];
    const items=people.map(pid=>`<details open><summary>${esc(name(pid))} <span class="meta">${v.items.filter(i=>i.snapshot.userId===pid).length} grant(s)</span></summary><div><table class="cards"><thead><tr><th>Capability</th><th>Scope</th><th>Ends</th><th>Decision</th></tr></thead><tbody>${v.items.filter(i=>i.snapshot.userId===pid).map(i=>`<tr>
      <td data-label="Capability">${capName(i.snapshot.capability)}</td><td data-label="Scope">${esc(M.scopeLabel(state,i.snapshot))}</td><td data-label="Ends">${esc(ends(i.snapshot.validTo))}</td>
      <td data-label="Decision">${i.decision?`${tag(i.decision.decision)}<div class="meta">${esc(i.decision.reason)} — ${esc(name(i.decision.by))}${i.decision.owner?`; owner ${esc(name(i.decision.owner))}`:''}${i.decision.request?`; ${btn(esc((state.requests.find(r=>r.id===i.decision.request)||{}).reference||'request'),'openRequest',`data-id="${i.decision.request}"`,'link-button')}`:''}</div>`
        :mine?`<div class="row">${['Keep','Change','Revoke','Unable to confirm'].map(d=>btn(d,'attest',`data-item="${i.id}" data-decision="${d}" aria-label="${d}: ${esc(name(pid))} ${esc(i.snapshot.capability)}"`,'small'+(d==='Keep'?' primary':''))).join('')}</div>`:tag('Awaiting reviewer','warning')}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
    const detail=card(`${esc(v.name)} ${tag(v.state==='Complete'?'Complete':'InProgress')} ${proposed('Proposed workflow')}`,
      facts([['Scope',esc(v.scopeLabel)],['Reviewer',esc(name(v.reviewerId))],['Due',esc(day(v.due+'T00:00:00+10:00'))],['Progress',`${decided} of ${v.items.length} decided`],...(v.completedAt?[['Completed',esc(when(v.completedAt))]]:[]),['Review cadence','Not agreed (D-020)'],['Evidence retention','Not agreed (D-012 / D-021)']])+
      `<div style="margin-top:12px">${items}</div>`+
      (v.state==='InProgress'&&decided<v.items.length?note('Completion blocked',`${v.items.length-decided} item(s) still need a decision.`,'warning'):''),
      'Each grant needs Keep, Change, Revoke or Unable to confirm. Change and Revoke create a draft request for the access administrator.',
      (mine?btn('Complete review','completeReview',`data-id="${v.id}"`,'primary',decided<v.items.length):'')+btn('Export evidence (JSON)','exportReview',`data-id="${v.id}"`)+btn('Export evidence (CSV)','exportReviewCsv',`data-id="${v.id}"`));
    return layout(`<div class="split">${list}<div>${detail}</div></div>`,card('Interrupted reviews',`<p>Decisions are saved as they are recorded. A review left part-way resumes where it stopped after a reload.</p>`)+card('What an attestation is not',`<p>Keep confirms current need at the time of review. It does not approve new access, and it never changes a grant by itself.</p>`));
  }

  /* ---------- History ---------- */
  function viewHistory(){
    if(mode!=='complete'&&mode!=='partial')return stateBlock();
    const ex=ui.explain,ppl=M.visiblePeople(state,ui.role);
    if(!ppl.some(p=>p.id===ex.person))ex.person=ppl[0].id;
    const rec=state.records.find(r=>r.id===ex.record);
    const res=rec?M.evaluate(state,ex.person,ex.capability,rec.companyId,rec.siteId):M.evaluate(state,ex.person,ex.capability);
    const recLabel=rec?rec.label:'No specific record (capability held anywhere)';
    const explain=card('Explain access',`<div class="grid-2">${select('ex-person','Person',ppl.map(p=>[p.id,p.name]),ex.person,'data-explain="person"')}${select('ex-cap','Capability',CAPS.keys.map(k=>[k,k]),ex.capability,'data-explain="capability"')}${select('ex-record','Target record',[['','No specific record'],...state.records.map(r=>[r.id,r.label])],ex.record,'data-explain="record"')}</div>
      ${rec&&rec.note?`<p class="meta" style="margin-top:6px">${esc(rec.note)}</p>`:''}<div style="margin-top:12px" id="explain-result">${traceHtml(res,`${M.LABELS[ex.capability]} — ${recLabel}`)}</div>
      <div class="row" style="margin-top:8px">${btn('Open in panel','explainPanel','','small')}</div>`,'A deterministic step trace of the server rule for one person, capability and record.');
    const types=[...new Set(state.events.map(e=>e.type))];
    const h=ui.history,events=M.visibleEvents(state,ui.role).filter(e=>(!h.person||e.objectId===h.person||e.actorId===h.person||state.requests.some(r=>r.id===e.objectId&&r.subjectId===h.person))&&(!h.type||e.type===h.type)).sort((a,b)=>b.at.localeCompare(a.at));
    const timeline=`<div class="grid-2">${select('h-person','Person',[['','Everyone in scope'],...ppl.map(p=>[p.id,p.name])],h.person,'data-history="person"')}${select('h-type','Event type',[['','All types'],...types.map(t=>[t,t])],h.type,'data-history="type"')}</div>
      <ul class="timeline" style="margin-top:12px">${events.length?events.map(e=>{const req=state.requests.find(r=>r.id===e.objectId);return `<li class="${e.contract?'contract-event':'proposed-event'}"><strong>${esc(e.type)}</strong> ${e.contract?tag('Application audit','success'):e.provenanceOnly?tag('Not recorded','warning'):proposed('Proposed event')}
      <div class="meta">${esc(when(e.at))} · actor ${e.actorId?esc(name(e.actorId)):'not recorded'} · ${esc(e.objectType)} ${req?esc(req.reference):esc(e.objectType==='User'||e.objectType==='Session'?name(e.objectId):e.objectId)}</div>
      <div>${esc(e.reason)}</div>${e.operationId?`<div class="key">operation ${esc(e.operationId)}</div>`:''}${e.before?`<div class="meta">Grants before ${e.before.length} · after ${e.after.length}</div>`:''}</li>`;}).join(''):'<li>No events match.</li>'}</ul>`;
    return layout(explain+card('Access history',timeline,'Session selection is a real application audit event. Grant and user changes are not audited today; proposed events are labelled.'),
      card('Why some rows say “Not recorded”',`<p>Seeded grants and user deactivation happen in seed or setup scripts, which write no application audit. This page never invents past audit rows for them.</p>`)+card('Receiving contract',`<p>A future runtime increment would add <code>User</code>, <code>PermissionGrant</code> and <code>AccessReview</code> audit types. See the decision record.</p>`));
  }

  /* ---------- forms ---------- */
  function requestForm(d){
    const subject=M.person(state,d.subjectId),subjects=M.visiblePeople(state,ui.role).filter(p=>p.issuer==='PPO-LocalSynthetic'&&p.active&&p.id!==role().person);
    const reviewers=M.approvers(state).filter(p=>p.id!==role().person&&p.id!==d.subjectId&&p.id!==(d.origin&&d.origin.attestedBy));
    const grants=subject?state.grants.filter(g=>g.userId===subject.id):[];
    const ops=d.operations.map((o,i)=>{
      const n=i+1,k=o.kind||'add';
      let inner=select(`op${i}-kind`,`Operation ${n} type`,[['add','Add a capability'],['validity','Change an end date'],['scope','Change a scope'],['revoke','Revoke a grant']],k,'data-rerender');
      if(k==='add')inner+=select(`op${i}-cap`,`Operation ${n} capability`,CAPS.keys.map(x=>[x,`${x}`]),o.capability||'shared.read');
      else inner+=select(`op${i}-grant`,`Operation ${n} grant`,[['','Choose a grant'],...grants.map(g=>[g.id,`${g.capability} · ${M.scopeLabel(state,g)} · ${M.grantState(g,state.now)}`])],o.grantId||'');
      if(k==='add'||k==='scope'){
        inner+=select(`op${i}-scope`,`Operation ${n} scope type`,[['Company','Company'],['Site','Site'],['Workspace','Whole workspace']],o.scopeType||'Company','data-rerender');
        if((o.scopeType||'Company')!=='Workspace')inner+=select(`op${i}-company`,`Operation ${n} company`,state.companies.map(c=>[c.id,`${c.name} (${c.erpCompanyId})`]),o.companyId||state.companies[0].id,'data-rerender');
        if(o.scopeType==='Site')inner+=select(`op${i}-site`,`Operation ${n} site`,state.sites.filter(s=>s.companyId===(o.companyId||state.companies[0].id)).map(s=>[s.id,s.name]),o.siteId||'');
      }
      if(k==='add'||k==='validity')inner+=field(`op${i}-to`,`Operation ${n} access ends`,o.validTo||'', 'date','', 'Ends at the start of this day (AEST). Leave empty for no end date.');
      return `<fieldset class="op-row"><legend class="sr-only">Operation ${n}</legend>${inner}${d.operations.length>1?`<div>${btn('Remove operation','removeOp',`data-index="${i}" aria-label="Remove operation ${n}"`,'small')}</div>`:''}</fieldset>`;
    }).join('');
    return `${note('Proposed workflow','Saving creates or updates a draft. Nothing changes until an independent reviewer approves and an administrator applies it (simulated).','info')}
      <div class="grid-2">${select('subject','Person affected',[['','Choose a person'],...subjects.map(p=>[p.id,p.name])],d.subjectId||'','data-rerender '+(d.id?'disabled':''))}${select('reviewer','Reviewer',[['','Choose later'],...reviewers.map(p=>[p.id,p.name])],d.reviewerId||'')}${field('effective','Effective from',d.effectiveFrom||M.TODAY,'date',`min="${M.TODAY}"`)}</div>
      ${ops}<div>${btn(`${icon('plus')}Add another operation`,'addOp','','small',d.operations.length>=10)}</div>
      ${area('reason','Reason for the change',d.reason||'','10–500 characters. Recorded with the request and every decision.')}`;
  }
  function readRequest(d){
    const f=formData();
    d.subjectId=f.subject??d.subjectId;d.reviewerId=f.reviewer||null;d.effectiveFrom=f.effective;d.reason=f.reason;
    d.operations=d.operations.map((o,i)=>{const k=f[`op${i}-kind`]||o.kind;const n={kind:k};
      if(k==='add')n.capability=f[`op${i}-cap`];else n.grantId=f[`op${i}-grant`];
      if(k==='add'||k==='scope'){n.scopeType=f[`op${i}-scope`]||'Company';n.companyId=n.scopeType==='Workspace'?null:(f[`op${i}-company`]||state.companies[0].id);n.siteId=n.scopeType==='Site'?(f[`op${i}-site`]||null):null;}
      if(k==='add'||k==='validity')n.validTo=f[`op${i}-to`]||'';
      return n;});
    return d;
  }
  function payloadFrom(d){return {id:d.id,requestVersion:d.version,subjectId:d.subjectId,reviewerId:d.reviewerId||null,effectiveFrom:d.effectiveFrom,reason:d.reason,
    operations:d.operations.map(o=>({...o,validTo:o.validTo?M.startOfDay(o.validTo):null}))};}
  let draft=null;
  function openRequestForm(d){
    draft=d;
    openModal({kicker:'Access change',title:d.id?`Edit ${d.reference}`:'New access request',body:requestForm(d),submit:'Save draft',wide:true,onSubmit:async()=>{
      readRequest(draft);const r=await run('saveRequest',payloadFrom(draft),'Draft saved.');ui.request=r.id;ui.view='changes';ui.requestFilter='open';render();return true;}});
  }
  function rerenderRequest(){readRequest(draft);const scroll=$('modal-body').scrollTop;$('modal-body').innerHTML=requestForm(draft);hydrate($('modal-body'));$('modal-body').scrollTop=scroll;dirty=true;}

  /* ---------- guide, options, assistant ---------- */
  function guide(){openModal({kicker:'Page guide',title:'Using the access workspace',body:`
    <p><strong>People</strong> lists identities with attention queues. <strong>Person access</strong> shows every grant, the effective-access matrix and why a cell is allowed.</p>
    <p><strong>Roles, teams & capabilities</strong> lists the 74 application capabilities and the proposed bundles and teams. <strong>Access changes</strong> is the proposed request, review and simulated-apply workflow. <strong>Access reviews</strong> records keep, change, revoke or unable-to-confirm decisions. <strong>History & explanation</strong> shows audit events and a step-by-step explanation of any decision.</p>
    ${note('What is real and what is proposed','Grants, scopes, validity, hosted testers and the evaluation rule are the application contract. Bundles, teams, requests, reviews, administrative capabilities and access events are proposals, labelled as such.','info')}
    <p>Keyboard: use arrow keys on the view tabs, Enter or Space on buttons, and Escape to close dialogs and panels.</p>`});}
  function options(){
    openModal({kicker:'Preview options',title:'Preview options',submit:'Apply',body:`
      ${select('role','Preview role',Object.entries(M.roles).map(([k,r])=>[k,`${r.title} — ${M.person(state,r.person).name}`]),ui.role)}
      ${select('mode','Source result scenario',[['complete','Complete'],['loading','Loading'],['partial','Partial — hosted identity source unavailable'],['failed','Read failed'],['empty','Empty result']],mode)}
      ${select('save','Next save',[['none','Normal'],['slow','Slow (shows Saving)'],['fail','Fails'],['unknown','Response lost (outcome unknown)'],['conflict','Another session saves first']],saveMode)}
      <div class="row">${btn('Export session backup','export')}${btn('Restore from backup','restore')}${btn('Reset to fixture','reset','','danger-button')}</div>
      ${note('Not security','Preview roles demonstrate intended behaviour only. The server decides access.','info')}`,
      onSubmit:async()=>{const f=formData();ui.role=f.role;mode=f.mode;saveMode=f.save;if(ui.role==='self'){ui.selected=M.roles.self.person;}if(!M.viewAllowed(ui.role,ui.view))ui.view='people';persist();render();return true;}});
  }
  function restore(){
    openModal({kicker:'Restore',title:'Restore from a session backup',submit:'Restore',danger:true,body:`
      <label class="field" for="f-file"><span>Session backup file</span><input id="f-file" name="file" type="file" accept="application/json,.json"></label>
      ${check('confirm','I understand this replaces the current local session.')}
      ${note('Validated before use','A backup with an unknown capability, an invalid scope, a grant ending before it starts, a duplicate grant or a self-approved request is refused without changing anything.','info')}`,
      onSubmit:async()=>{const input=$('modal-form').querySelector('input[name=file]');if(!input.files.length)throw Error('Choose a backup file.');
        const text=await input.files[0].text();let data;try{data=JSON.parse(text);}catch{throw Error('The file is not valid JSON.');}
        if(!data||data.schema!=='ppo-access-review-session/v1')throw Error('This is not an access review session backup.');
        M.validate(JSON.parse(JSON.stringify(data.state)));if(!data.ui||!M.roles[data.ui.role])throw Error('The backup has invalid preview settings.');
        if(!formData().confirm)throw Error('Confirm that the current session will be replaced.');
        state=data.state;ui={...defaults(),...data.ui};external=false;pending=null;persist();savedStatus();render();toast('Session restored.');return true;}});
  }
  function assistant(){
    const ppl=M.visiblePeople(state,ui.role);
    const scripts=[['summary','Summarise a person’s access'],['expiring','List grants ending within 14 days'],['explain','Explain the current Explain-access result'],['reason','Draft a reason for the selected request']];
    const body=s=>`${note('Scripted and source-scoped','Answers come only from records visible to your preview role. The assistant cannot submit, approve or apply anything.','info')}
      <div class="grid-2">${select('script','What would you like?',scripts,s.script)}${select('aperson','Person',ppl.map(p=>[p.id,p.name]),s.person)}</div>
      <div class="row">${btn('Generate','assistantRun','','primary')}</div><div class="assistant-output" id="assistant-output" aria-live="polite">${esc(s.output||'Choose a script and select Generate.')}</div>
      <div class="row">${btn('Copy text','assistantCopy','','small',!s.output)}</div>`;
    const s={script:'summary',person:ui.selected&&M.canSeePerson(state,ui.role,ui.selected)?ui.selected:ppl[0].id,output:''};
    openModal({kicker:'Assistant',title:'Access assistant',body:body(s)});
    assistant.state=s;assistant.body=body;
  }
  function assistantRun(){
    const f=formData(),s=assistant.state;s.script=f.script;s.person=f.aperson;
    const p=M.person(state,s.person);let out='';
    if(s.script==='summary'){const gs=M.heldNow(state,p.id),fams=[...new Set(gs.map(g=>M.FAMILY_NAMES[g.capability.split('.')[0]]))];
      out=`${p.name} (${p.active?'active':'inactive'}, ${p.issuer==='PPO-EntraDemo'?'hosted demo tester':'local synthetic'}) holds ${gs.length} current grant(s) in ${fams.length} famil${fams.length===1?'y':'ies'}: ${fams.join(', ')||'none'}.\nScopes: ${[...new Set(gs.map(g=>M.scopeLabel(state,g)))].join('; ')||'none'}.\n${M.sodWarnings(state,p.id).length?'Separation-of-duties warning present.':'No separation-of-duties warning.'}${!p.active?'\nThe server refuses this identity; offline device content may persist.':''}\nSource: grants visible to ${role().title}.`;}
    if(s.script==='expiring'){const rows=M.visiblePeople(state,ui.role).flatMap(x=>M.heldNow(state,x.id).filter(g=>g.validTo&&Date.parse(g.validTo)-Date.parse(state.now)<=14*86400000).map(g=>`${x.name}: ${g.capability} · ${M.scopeLabel(state,g)} · ends ${when(g.validTo)}`));
      out=rows.length?`Grants ending within the 14-day display window (not a policy):\n${rows.join('\n')}`:'No visible grant ends within 14 days.';}
    if(s.script==='explain'){const ex=ui.explain,rec=state.records.find(r=>r.id===ex.record),res=rec?M.evaluate(state,ex.person,ex.capability,rec.companyId,rec.siteId):M.evaluate(state,ex.person,ex.capability);
      out=`${name(ex.person)} · ${ex.capability} · ${rec?rec.label:'no specific record'}: ${res.allowed?'allowed':'not allowed'}.\n${res.steps.map(x=>`- ${x.label}: ${x.pass===null?'not reproduced':x.pass?'pass':'fail'} — ${x.detail}`).join('\n')}\nThe server remains the authority.`;}
    if(s.script==='reason'){const r=state.requests.find(x=>x.id===ui.request);
      out=r&&M.visibleRequests(state,ui.role).includes(r)?`Draft reason for ${r.reference} (${name(r.subjectId)}): ${r.operations.map(o=>opText(r,o)).join('; ')}. Needed because <state the business purpose>. Scope limited to what the duty requires; ${r.operations.some(o=>o.validTo)?'ends on the stated date':'set an end date if the need is temporary'}.`:'Open a request in Access changes first.';}
    s.output=out;$('modal-body').innerHTML=assistant.body(s);hydrate($('modal-body'));
  }

  /* ---------- evidence export ---------- */
  function reviewEvidence(id){const v=state.reviews.find(x=>x.id===id);return {schema:'ppo-access-review-evidence/v1',synthetic:'Synthetic prototype — no real people or access',review:{id:v.id,name:v.name,scope:v.scopeLabel,reviewer:name(v.reviewerId),state:v.state,due:v.due,completedAt:v.completedAt||null},
    items:v.items.map(i=>({item:i.id,grant:i.grantId,person:name(i.snapshot.userId),capability:i.snapshot.capability,scope:M.scopeLabel(state,i.snapshot),validTo:i.snapshot.validTo,decision:i.decision?i.decision.decision:null,reason:i.decision?i.decision.reason:null,by:i.decision?name(i.decision.by):null,at:i.decision?i.decision.at:null})),
    capabilitySource:{path:CAPS.source,sha256:CAPS.source_sha256},exportedAt:state.now};}
  const csvCell=v=>{const s=String(v??'');return /^[=+\-@]/.test(s)?`"'${s.replace(/"/g,'""')}"`:/[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};

  /* ---------- events ---------- */
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action],[data-view],[data-close]');if(!b||b.disabled)return;
    if(b.hasAttribute('data-close')){closeModal();return;}
    if(b.dataset.view&&!b.dataset.action){ui.view=b.dataset.view;closePanel();persist();render();$('tab-'+ui.view).focus();return;}
    const a=b.dataset.action,d=b.dataset;
    try{switch(a){
      case 'view':ui.view=d.view;render();break;
      case 'guide':guide();break;case 'options':options();break;case 'assistant':assistant();break;
      case 'assistantRun':assistantRun();break;
      case 'assistantCopy':try{await navigator.clipboard.writeText(assistant.state.output);toast('Copied.');}catch{toast('Copy is unavailable here; select the text instead.');}break;
      case 'closePanel':closePanel();break;
      case 'queue':ui.filters.queue=ui.filters.queue===d.queue?'':d.queue;persist();render();break;
      case 'clear':ui.filters={q:'',issuer:'',status:'',company:'',family:'',queue:'',sort:'attention'};persist();render();break;
      case 'openPerson':ui.selected=d.id;ui.view='person';persist();render();break;
      case 'toggleFamilies':ui.allFamilies=!ui.allFamilies;render();break;
      case 'grant':grantPanel(d.id);break;
      case 'explainGrant':{const g=state.grants.find(x=>x.id===d.id);explainPanel(g.userId,g.capability,g.companyId,g.siteId,g.scopeType==='Workspace'?'any company':M.scopeLabel(state,g));break;}
      case 'cell':{const t=M.matrixTargets(state).find(x=>x.id===d.target),row=M.matrix(state,ui.selected).find(r=>r.family===d.family),caps=CAPS.keys.filter(k=>k.startsWith(d.family+'.'));
        openPanel('Effective access',`${M.FAMILY_NAMES[d.family]} · ${t.label}`,`<p>${row.cells.find(c=>c.target.id===t.id).allowed} of ${caps.length} allowed for ${esc(name(ui.selected))}.</p><ul class="trace">${caps.map(k=>{const r=M.evaluate(state,ui.selected,k,t.companyId,t.siteId);
          return `<li><span>${r.allowed?tag('Allowed'):tag('Not allowed')}</span><div>${capName(k)}<div>${btn('Why?','panelExplain',`data-cap="${k}" data-company="${t.companyId}" data-site="${t.siteId||''}" data-label="${esc(t.label)}" aria-label="Why ${esc(k)} at ${esc(t.label)}"`,'link-button')}</div></div></li>`;}).join('')}</ul>`);break;}
      case 'panelExplain':explainPanel(ui.selected,d.cap,d.company,d.site,d.label);break;
      case 'explainPanel':{const ex=ui.explain,rec=state.records.find(r=>r.id===ex.record);explainPanel(ex.person,ex.capability,rec&&rec.companyId,rec&&rec.siteId,rec?rec.label:'no specific record');break;}
      case 'catTab':ui.catalogueTab=d.tab;render();break;
      case 'bundle':ui.bundle=d.id;render();break;
      case 'holders':ui.filters={...ui.filters,q:d.cap,queue:''};ui.view='people';render();break;
      case 'compare':{const bd=state.bundles.find(x=>x.id===d.id),[r1,r2]=bd.revisions,cmp=M.compareBundle(state,bd.id,r1.revision,r2.revision);
        openPanel('Compare revisions',`${bd.name} ${r1.revision} → ${r2.revision}`,`${facts([['Added',cmp.added.length?cmp.added.map(k=>`<code>${esc(k)}</code>`).join(', '):'None'],['Removed',cmp.removed.length?cmp.removed.map(k=>`<code>${esc(k)}</code>`).join(', '):'None']])}
          <h3>Holders to review before any adoption</h3>${cmp.holders.length?`<ul>${cmp.holders.filter(id=>M.canSeePerson(state,ui.role,id)).map(id=>`<li>${esc(name(id))}</li>`).join('')}</ul>`:'<p class="meta">None.</p>'}
          ${note('No silent change','A new bundle revision never changes anyone’s grants. Each affected holder would need a reviewed access request.','info')}`);break;}
      case 'newRequest':{const pid=d.person||'';const op={kind:'add',capability:d.cap||'shared.read',scopeType:d.site?'Site':'Company',companyId:d.company||state.companies[0].id,siteId:d.site||null,validTo:''};
        closePanel();openRequestForm({subjectId:pid,reviewerId:M.approvers(state).find(p=>p.id!==role().person&&p.id!==pid)?.id||'',effectiveFrom:M.TODAY,reason:'',operations:[op]});break;}
      case 'editRequest':{const r=state.requests.find(x=>x.id===d.id);openRequestForm({id:r.id,reference:r.reference,version:r.version,origin:r.origin,subjectId:r.subjectId,reviewerId:r.reviewerId||'',effectiveFrom:inputDay(r.effectiveFrom)<M.TODAY?M.TODAY:inputDay(r.effectiveFrom),reason:r.reason,
        operations:r.operations.map(o=>({...o,validTo:o.validTo?inputDay(o.validTo):''}))});break;}
      case 'addOp':readRequest(draft);draft.operations.push({kind:'add',capability:'shared.read',scopeType:'Company',companyId:state.companies[0].id,validTo:''});rerenderRequest();break;
      case 'removeOp':readRequest(draft);draft.operations.splice(Number(d.index),1);rerenderRequest();break;
      case 'openRequest':ui.request=d.id;ui.view='changes';ui.requestFilter='all';closePanel();render();break;
      case 'submitRequest':{const r=state.requests.find(x=>x.id===d.id),w=M.requestWarnings(state,r);
        openModal({kicker:r.reference,title:'Submit for review',submit:'Submit',body:`<p>${esc(name(r.reviewerId))} will be asked to decide this request.</p>${w.map(x=>note('Warning',esc(x.text),'warning')).join('')||'<p class="meta">No warnings.</p>'}`,
          onSubmit:async()=>{await run('submitRequest',{id:r.id,requestVersion:r.version},'Submitted for review.');return true;}});break;}
      case 'decideRequest':{const r=state.requests.find(x=>x.id===d.id);
        openModal({kicker:r.reference,title:'Decide access request',submit:'Record decision',body:`${M.requestWarnings(state,r).map(x=>note('Warning',esc(x.text),'warning')).join('')}
          ${select('decision','Decision',[['Approved','Approve'],['Returned','Return for changes']],'Approved')}${area('reason','Decision reason','','Required for approval and return.')}`,
          onSubmit:async()=>{const f=formData();await run('decideRequest',{id:r.id,requestVersion:r.version,decision:f.decision,reason:f.reason},f.decision==='Approved'?'Approved. An administrator must apply it.':'Returned to the requester.');return true;}});break;}
      case 'applyRequest':{const r=state.requests.find(x=>x.id===d.id);
        openModal({kicker:r.reference,title:'Simulated apply',submit:'Apply (simulated)',body:`${note('No server command exists','This updates the local design only and records a proposed access event. It does not change any real or hosted access.','warning')}${check('confirm','I understand this is a simulation.')}`,
          onSubmit:async()=>{if(!formData().confirm)throw Error('Confirm that this is a simulation.');await run('applyRequest',{id:r.id,requestVersion:r.version},'Applied in this design (simulated).');return true;}});break;}
      case 'withdrawRequest':{const r=state.requests.find(x=>x.id===d.id);
        openModal({kicker:r.reference,title:'Withdraw request',submit:'Withdraw',danger:true,body:area('reason','Withdrawal reason'),onSubmit:async()=>{await run('withdrawRequest',{id:r.id,requestVersion:r.version,reason:formData().reason},'Request withdrawn.');return true;}});break;}
      case 'openReview':ui.review=d.id;render();break;
      case 'attest':{const v=state.reviews.find(x=>x.id===ui.review),it=v.items.find(i=>i.id===d.item);
        openModal({kicker:v.name,title:`${d.decision}: ${name(it.snapshot.userId)} · ${it.snapshot.capability}`,submit:'Record decision',body:`${d.decision==='Change'||d.decision==='Revoke'?note('Creates a draft request','A draft access request will be created for the access administrator. Nothing changes until it is reviewed and applied.','info'):''}
          ${area('reason','Review reason',d.decision==='Keep'?'Current duties confirmed with the person’s lead.':'','10–500 characters.')}${d.decision==='Unable to confirm'?select('owner','Who will resolve this',M.visiblePeople(state,ui.role).filter(p=>p.active).map(p=>[p.id,p.name]),M.roles.admin.person):''}`,
          onSubmit:async()=>{const f=formData();const r=await run('attest',{reviewId:v.id,reviewVersion:v.version,itemId:it.id,decision:d.decision,reason:f.reason,ownerId:f.owner},'Decision recorded.');if(r.request)toast('Decision recorded. Draft request created for the access administrator.');return true;}});break;}
      case 'completeReview':{const v=state.reviews.find(x=>x.id===d.id);openModal({kicker:v.name,title:'Complete review',submit:'Complete',body:`<p>All ${v.items.length} items have a decision. Completion makes the review read-only.</p>`,onSubmit:async()=>{await run('completeReview',{reviewId:v.id,reviewVersion:v.version},'Review completed.');return true;}});break;}
      case 'exportReview':download(`${M.TODAY}-SYN-PPO-access-review-${d.id}.json`,JSON.stringify(reviewEvidence(d.id),null,2),'application/json');break;
      case 'exportReviewCsv':{const ev=reviewEvidence(d.id),cols=['item','person','capability','scope','validTo','decision','reason','by','at'];
        download(`${M.TODAY}-SYN-PPO-access-review-${d.id}.csv`,['# Synthetic prototype — no real people or access',cols.join(','),...ev.items.map(i=>cols.map(c=>csvCell(i[c])).join(','))].join('\n')+'\n','text/csv');break;}
      case 'export':download(`${M.TODAY}-SYN-PPO-access-review-session.json`,JSON.stringify({schema:'ppo-access-review-session/v1',synthetic:true,state,ui},null,2),'application/json');break;
      case 'restore':closeModal(true);restore();break;
      case 'reset':if(confirm('Reset to the original synthetic fixture? Local changes will be lost.')){state=M.seed();ui=defaults();mode='complete';saveMode='none';pending=null;external=false;closeModal(true);persist();savedStatus();render();}break;
      case 'retry':mode='complete';render();break;
      case 'recover':recover();break;
      case 'reloadLatest':load();external=false;savedStatus();render();break;
      case 'raw':download('access-review-stored-session.txt',damaged.raw,'text/plain');break;
      case 'resetDamaged':if(confirm('Replace the stored session with the original fixture?')){damaged=null;state=M.seed();ui=defaults();persist();savedStatus();render();}break;
    }}catch(err){if($('modal').open)showError(err.message);else toast(err.message);}
  });
  $('modal-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!handler||busy)return;
    $('modal-error').hidden=true;$('modal-submit').disabled=true;
    try{if(await handler()!==false)closeModal(true);}catch(err){showError(err.message);render();}
    finally{$('modal-submit').disabled=false;}
  });
  $('modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
  $('modal-form').addEventListener('input',()=>{dirty=true;});
  $('modal-form').addEventListener('change',e=>{dirty=true;if(e.target.matches('[data-rerender]')&&draft)rerenderRequest();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!$('panel').hidden&&!$('modal').open){closePanel();return;}
    const t=e.target.closest('#tabs [role=tab]');if(!t)return;
    const tabs=[...document.querySelectorAll('#tabs [role=tab]')],i=tabs.indexOf(t);
    const j=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i-1+tabs.length)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:-1;
    if(j<0)return;e.preventDefault();ui.view=tabs[j].dataset.view;closePanel();render();$('tab-'+ui.view).focus();
  });
  document.addEventListener('input',e=>{if(e.target.name==='filter-q'){ui.filters.q=e.target.value;const pos=e.target.selectionStart;render();const q=$('f-q');q.focus();q.setSelectionRange(pos,pos);}});
  document.addEventListener('change',e=>{
    const el=e.target;if(el.closest('#modal'))return;
    if(el.dataset.filter==='requestFilter'){ui.requestFilter=el.value;render();return;}
    if(el.dataset.filter){ui.filters[el.dataset.filter]=el.value;persist();render();document.querySelector(`[data-filter="${el.dataset.filter}"]`).focus();return;}
    if(el.dataset.explain){ui.explain[el.dataset.explain]=el.value;if(el.dataset.explain==='capability'){}render();document.querySelector(`[data-explain="${el.dataset.explain}"]`).focus();return;}
    if(el.dataset.history){ui.history[el.dataset.history]=el.value;render();document.querySelector(`[data-history="${el.dataset.history}"]`).focus();}
  });
  window.addEventListener('storage',e=>{if(e.key===KEY){external=true;status('Conflict — another tab changed this workspace');renderRecovery();}});

  hydrate($('ppo-access-review'));load();savedStatus();render();
  globalThis.AR_DEMO={state:()=>JSON.parse(JSON.stringify(state)),ui:()=>JSON.parse(JSON.stringify(ui)),mode:()=>mode};
})();
