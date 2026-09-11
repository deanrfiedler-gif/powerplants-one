/* PPO-010 design demonstration. No application API, AI provider or customer actions. */
(() => {
  'use strict';
  const KEY = 'ppo-quotation-builder-design-r01';
  const TEMPLATE = 'PPO-QB-EQUIPMENT-r01';
  const logo = new URL('../../public/brand/powerplants-logo-green-white.png', location.href).href;
  const font = new URL('../../public/brand/Roboto-variable.woff', location.href).href;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const money = cents => new Intl.NumberFormat('en-AU', {style:'currency',currency:'AUD'}).format(cents / 100);
  const date = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-AU', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const lines = [
    {id:'L01',description:'SYN-PPO TF-100 tray filler',category:'Product',qty:1,unit:'unit',sell:1895050,cost:1350000,group:'Equipment'},
    {id:'L02',description:'SYN-PPO 3 m roller conveyor',category:'Product',qty:1,unit:'unit',sell:245000,cost:165000,group:'Equipment'},
    {id:'L03',description:'Installation',category:'Labour',qty:12,unit:'hours',sell:14500,cost:8500,group:'Installation & commissioning'},
    {id:'L04',description:'Commissioning and operator training',category:'Labour',qty:8,unit:'hours',sell:14500,cost:8500,group:'Installation & commissioning'},
    {id:'L05',description:'International transport',category:'Freight',qty:1,unit:'allowance',sell:38000,cost:30000,group:'Freight'},
    {id:'L06',description:'Local delivery to site',category:'Freight',qty:1,unit:'allowance',sell:50000,cost:40000,group:'Freight',optional:true}
  ];
  const initial = {
    title:'Tray filling and handling package',
    context:'Example Nursery is preparing a dedicated tray-filling area to support its seasonal propagation work. This proposal brings together the equipment, installation and initial operator training for that area.',
    scope:'Supply and position the selected equipment in the prepared production area.\nConfigure the equipment for the agreed demonstration trays and growing medium.\nProvide an operating demonstration and basic cleaning guidance.',
    commissioning:'Level and align the tray filler and roller conveyor.\nConnect to the customer-provided services.\nRun the agreed sample trays and adjust the filling settings.\nDemonstrate operation and routine cleaning to the nominated operators.',
    responsibilities:'Provide a clear, level, dry work area with safe access.\nProvide the electrical supply specified in section 02 before attendance.\nArrange equipment unloading and safe storage on arrival.\nProvide the agreed trays, growing medium and an operator for commissioning.',
    assumptions:'The installation is at ground level with unobstructed access.\nWork is performed during normal weekday business hours.\nThe agreed trays and growing medium are available for commissioning.',
    exclusions:'Electrical installation and changes to building services.\nCivil works, unloading and storage on site.\nOngoing maintenance and consumables after commissioning.',
    leadTime:'2–3 weeks',leadTrigger:'receipt of the demonstration order payment',validUntil:'2026-10-09',payment:'50',presentation:'grouped',localFreight:false
  };
  const mapping = [
    ['Project summary','Customer context + entered scope + selected equipment/services'],
    ['System specification','Reviewed equipment specification fields and source revision'],
    ['Commissioning','Selected labour scope + estimator activities + scheduling dependency'],
    ['Customer responsibilities & pre-works','Estimator-selected responsibility statements'],
    ['Assumptions','Explicit estimator assumptions'],
    ['Exclusions','Estimator exclusions + unselected offered lines'],
    ['Freight & lead times','Freight inclusion + lead-time range, trigger and technician dependency'],
    ['Investment summary','Selected sell extensions + presentation groups + tax basis'],
    ['Payment terms','Selected demonstration schedule + exact draft total'],
    ['Validity & exchange rate','Prepared date + validity date + declared currency basis'],
    ['Warranty','Selected demonstration clause; future approved source/revision required'],
    ['Acceptance','Exact draft reference + fictional address context + inactive review panel']
  ];
  const bullet = text => '<ul>' + text.split('\n').filter(x => x.trim()).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  const selected = state => lines.filter(x => !x.optional || state.localFreight);
  const total = state => selected(state).reduce((sum,x) => sum + x.qty*x.sell,0);
  const defaultState = () => ({working:structuredClone(initial),saved:null,version:0,drafts:[],step:'estimate'});
  let state = defaultState();
  let persisted = false;
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    if(p?.schema===1 && Number.isInteger(p.version) && p.version>=0 && Array.isArray(p.drafts) && p.drafts.length<=20 && p.working && Object.keys(initial).every(k => typeof p.working[k]===typeof initial[k])) {
      p.drafts = p.drafts.map(d => ({...d,html:String(d.html).replaceAll('__PPO_QB_LOGO_ASSET__',logo).replaceAll('__PPO_QB_FONT_ASSET__',font)}));
      state = {...state,...p}; persisted=true;
    }
  } catch { /* An unavailable store leaves a usable unsaved example. */ }
  let viewing = null;
  function problems(s) {
    const out=[];
    for(const [key,label] of [['title','Quotation title'],['context','Project context'],['scope','Included scope'],['commissioning','Commissioning'],['responsibilities','Customer responsibilities'],['assumptions','Assumptions'],['exclusions','Exclusions'],['leadTime','Equipment lead time'],['leadTrigger','Lead-time trigger']]) if(!s[key]?.trim())out.push(label+' is required.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s.validUntil)||s.validUntil<'2026-09-09')out.push('Validity must be on or after the prepared date.');
    return out;
  }
  const dirty = () => !state.saved || JSON.stringify(state.working)!==JSON.stringify(state.saved);
  function persist() {
    try {
      const compactDrafts=state.drafts.map(d=>({...d,html:d.html.replaceAll(logo,'__PPO_QB_LOGO_ASSET__').replaceAll(font,'__PPO_QB_FONT_ASSET__')}));
      localStorage.setItem(KEY,JSON.stringify({...state,drafts:compactDrafts,schema:1})); persisted=true;return true;
    }catch {persisted=false;return false;}
  }
  const quoteCSS = `@font-face{font-family:Roboto;src:url('${font}') format('woff');font-weight:100 900}*{box-sizing:border-box}html{background:#e7ebf0}body{margin:0;color:#242a37;font-family:Roboto,Verdana,sans-serif;font-size:10.5pt;line-height:1.5}p{margin:9px 0}ul{padding-left:18px;margin:8px 0}li{margin:6px 0}h1{font-size:29pt;line-height:1.15;letter-spacing:-.7px;margin:21px 0 13px;font-weight:650}h2{font-size:14pt;line-height:1.3;border-bottom:2px solid #62bb46;padding-bottom:8px;margin:22px 0 12px;font-weight:600}h2 span{color:#677586;font-size:10pt;margin-right:12px}h3{font-size:11pt;margin:15px 0 6px}.quote-page{width:210mm;min-height:297mm;margin:18px auto;background:white;padding:14mm 17mm 12mm;display:flex;flex-direction:column;box-shadow:0 3px 12px #14213716}.q-content{flex:1}.q-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d8dfe5;padding-bottom:12px}.q-logo{background:#242a37;padding:7px 15px;width:116px;height:88px;object-fit:contain}.q-id{text-align:right;font-size:9pt;color:#526173}.q-id strong{color:#242a37;font-size:10pt}.q-badge{display:inline-block;background:#edf4e9;color:#305828;font-weight:650;padding:4px 8px;margin-bottom:6px;font-size:9pt}.q-kicker{font-size:9pt;color:#687588;margin-top:20px;letter-spacing:.4px}.q-sub{color:#627080}.q-meta{display:grid;grid-template-columns:1.1fr 1fr;gap:12px;border-top:1px solid #dfe4e9;border-bottom:1px solid #dfe4e9;padding:14px 0;margin:20px 0;font-size:10pt}.q-meta small{display:block;color:#647180;font-size:8.5pt;margin-bottom:3px}.q-note{background:#f3f7f0;border-left:3px solid #62bb46;padding:11px 14px;font-size:9.5pt;margin:17px 0}.q-muted{color:#637082;font-size:9pt}.q-price{display:flex;justify-content:space-between;align-items:center;background:#242a37;color:white;padding:14px 16px;margin:15px 0}.q-price strong{font-size:23pt;letter-spacing:-.5px;font-variant-numeric:tabular-nums}.q-price small{display:block;font-size:9pt;color:#dee6ee}.q-table{border-collapse:collapse;width:100%;font-size:10pt;table-layout:fixed}.q-table th,.q-table td{border-bottom:1px solid #dce2e8;padding:9px 8px;vertical-align:top;text-align:left;overflow-wrap:anywhere}.q-table th{background:#f2f5f7;font-size:9pt;font-weight:600}.q-table tr{break-inside:avoid}.q-table thead{display:table-header-group}.q-table .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.q-table .amount{width:25%}.q-table .quantity{width:21%}.q-table .label{width:34%}.q-footer{border-top:1px solid #dce2e8;padding-top:12px;margin-top:25px;display:flex;justify-content:space-between;gap:10px;font-size:8pt;color:#617080}.q-accept{border:1px solid #d5dde5;padding:18px;margin:16px 0}.q-accept strong{display:block;font-size:14pt}.q-page-note{font-size:8.5pt;color:#617080}a{color:#242a37}@page{size:A4;margin:0}@media print{html{background:white}.quote-page{margin:0;box-shadow:none;break-after:page}.quote-page:last-child{break-after:auto}}@media screen and (max-width:800px){.quote-page{width:100%;min-height:0;margin:0 0 16px;padding:26px 22px;box-shadow:none}body{font-size:10pt}h1{font-size:23pt}.q-header{gap:12px}.q-logo{width:90px;height:72px}.q-id{font-size:8pt}.q-id strong{font-size:9pt}.q-price strong{font-size:21pt}.q-meta{gap:14px;font-size:9pt}.q-table{font-size:9pt}.q-table th,.q-table td{padding:8px 5px}.q-footer{font-size:7.5pt}}@media screen and (max-width:360px){.quote-page{padding:20px 15px}h1{font-size:21pt}.q-meta{grid-template-columns:1fr}.q-price strong{font-size:18pt}.q-price{padding:11px}.q-price small{font-size:8pt}.q-id{max-width:170px}.q-table{font-size:8.5pt}}`;
  function documentFor(s,revision=0,version=0) {
    const amount = total(s),first=s.payment==='100'?amount:Math.floor(amount/2),second=amount-first;
    let items=selected(s).map(l=>({description:l.description,qty:l.qty+' '+l.unit,amount:l.qty*l.sell}));
    if(s.presentation==='grouped') {
      const groups=new Map();for(const l of selected(s))groups.set(l.group,(groups.get(l.group)||0)+l.qty*l.sell);
      items=Array.from(groups,([description,amount])=>({description,qty:'Included package',amount}));
    }
    const h=(n,title)=>`<h2><span>${String(n).padStart(2,'0')}</span>${title}</h2>`;
    const header=`<header class="q-header"><img class="q-logo" src="${logo}" alt="Powerplants Australia"><div class="q-id"><span class="q-badge">DRAFT · SYNTHETIC</span><br><strong>SYN-PPO-QUO-000901</strong><br>${revision?'Draft revision '+revision:'Working preview'} · 9 September 2026</div></header>`;
    const wrapper=(content,i)=>`<article class="quote-page">${header}<div class="q-content">${content}</div><footer class="q-footer"><span>Powerplants One · Synthetic review copy</span><span>SYN-PPO-QUO-000901 · ${i} / 4</span></footer></article>`;
    const page1=`<div class="q-kicker">EQUIPMENT SUPPLY · INSTALLATION · COMMISSIONING</div><h1>${esc(s.title)}</h1><p class="q-sub">Your vision, powered by our solutions.</p><div class="q-meta"><div><small>Prepared for</small><strong>Example Nursery (synthetic)</strong><br>Casey Green · fictional contact<br>Site: SYN-PPO Training Nursery</div><div><small>Prepared by</small><strong>Alex Taylor · synthetic estimator</strong><br>Prepared: 9 September 2026<br>Draft validity: ${esc(date(s.validUntil||'2026-10-09'))}</div></div>${h(1,'Project summary')}<p>${esc(s.context)}</p><p>Supply of one SYN-PPO TF-100 tray filler and one SYN-PPO 3 m roller conveyor, including installation, commissioning and initial operator training.</p>${bullet(s.scope)}<div class="q-price"><div><small>Draft investment · AUD</small><strong>${money(amount)}</strong></div><div><small>Excluding tax</small><small>Tax has not been calculated</small></div></div>${h(2,'System specification')}<table class="q-table"><thead><tr><th class="label">Parameter</th><th>Demonstration specification</th></tr></thead><tbody><tr><td>Equipment</td><td>SYN-PPO TF-100 tray filler + 3 m roller conveyor</td></tr><tr><td>Nominal throughput</td><td>Up to 400 trays/hour in the fictional reference setup</td></tr><tr><td>Maximum tray size</td><td>500 × 300 × 120 mm</td></tr><tr><td>Electrical supply</td><td>230 V, single phase, 50 Hz; rated load 2.0 kW</td></tr><tr><td>Compressed air</td><td>Not required by this fictional equipment specification</td></tr></tbody></table><p class="q-page-note">Specification source: SYN-PPO-TF100-SPEC, revision 1. Fictional example values; no real equipment performance is represented.</p>`;
    const page2=`${h(3,'Commissioning')}${bullet(s.commissioning)}<p>Installation and commissioning are arranged after equipment delivery and completion of the customer pre-works, subject to technician availability. The equipment lead time does not confirm an attendance date.</p>${h(4,'Customer responsibilities & pre-works')}${bullet(s.responsibilities)}${h(5,'Assumptions')}${bullet(s.assumptions)}${h(6,'Exclusions')}${bullet(s.exclusions+(s.localFreight?'':'\nLocal freight from Powerplants to the demonstration site.'))}<div class="q-note">Responsibilities identify what the customer provides. Exclusions identify work or supply outside the quoted price.</div>`;
    const priceRows=items.map(x=>`<tr><td>${esc(x.description)}</td><td>${esc(x.qty)}</td><td class="num">${money(x.amount)}</td></tr>`).join('');
    const paymentRows=s.payment==='100'?`<tr><td>On order</td><td>100%</td><td class="num">${money(amount)}</td></tr>`:`<tr><td>On order</td><td>50%</td><td class="num">${money(first)}</td></tr><tr><td>Before dispatch</td><td>50%</td><td class="num">${money(second)}</td></tr>`;
    const page3=`${h(7,'Freight & lead times')}<table class="q-table"><thead><tr><th class="label">Item</th><th>Basis</th></tr></thead><tbody><tr><td>Equipment delivery</td><td>${esc(s.leadTime)} from ${esc(s.leadTrigger)}. Demonstration estimate, subject to confirmation.</td></tr><tr><td>International transport</td><td>Included in the quoted freight allowance.</td></tr><tr><td>Import duty</td><td>No duty assumed for this fictional example. Operational treatment requires confirmation.</td></tr><tr><td>Local delivery to site</td><td>${s.localFreight?'Included as a separate selected delivery allowance.':'Excluded; customer to arrange or request a separate offer.'}</td></tr><tr><td>Technician attendance</td><td>Confirmed separately after delivery and site readiness.</td></tr></tbody></table>${h(8,'Investment summary')}<p class="q-muted">All prices in AUD, excluding tax. Tax has not been calculated.</p><table class="q-table"><thead><tr><th>Description</th><th class="quantity">Quantity / basis</th><th class="amount num">Amount</th></tr></thead><tbody>${priceRows}<tr><th colspan="2">Draft total, excluding tax</th><th class="num">${money(amount)}</th></tr></tbody></table><p class="q-muted">${s.presentation==='grouped'?'Package amounts include the selected equipment, labour and freight.':'Line amounts are the selected quantities multiplied by their unit sell prices.'} No discount is applied in this example.</p>${h(9,'Payment terms')}<table class="q-table"><thead><tr><th>Demonstration trigger</th><th class="quantity">Share</th><th class="amount num">Amount*</th></tr></thead><tbody>${paymentRows}</tbody></table><p class="q-muted">*Demonstration amounts are calculated from the draft total excluding tax. They are not invoice or payment requests. The last stage carries any rounding remainder.</p><p>Payment milestones use the selected fictional template. Before operational use, the payment basis, tax treatment and approved commercial wording must be confirmed.</p>`;
    const page4=`${h(10,'Validity & exchange rate')}<p>Prepared on 9 September 2026. The demonstration validity date is ${esc(date(s.validUntil||'2026-10-09'))}.</p><p>This example is priced in AUD. No foreign-exchange adjustment clause is applied. A later quotation using a foreign-currency source would require its own reviewed exchange-rate basis and terms.</p>${h(11,'Warranty')}<p><strong>Demonstration clause — review required.</strong> For this fictional example, assume a 12-month equipment warranty from delivery and a 30-day installation workmanship review period from commissioning. Actual coverage, exclusions and claim arrangements must come from the applicable approved supplier and Powerplants terms.</p><p>No operational warranty promise or legal terms are adopted by this design.</p>${h(12,'Acceptance')}<p>This document is a synthetic draft for design review. It has not been issued and is not an offer for acceptance.</p><div class="q-meta"><div><small>Billing context</small><strong>SYN-PPO Example Nursery</strong><br>Synthetic training address B-01<br>Fictional record; not a delivery location</div><div><small>Delivery context</small><strong>SYN-PPO Training Nursery</strong><br>Synthetic training address S-01<br>Fictional record; not a delivery location</div></div><div class="q-accept"><strong>Draft review only</strong><p>Customer acceptance and signature capture will be available only for a formally reviewed and issued quotation in a later increment.</p><p class="q-muted">Standard terms attachment: not attached to this design example. An approved, versioned attachment is required before future issue.</p></div><div class="q-note">Every generated draft retains its exact estimate snapshot and template revision. Updating the working estimate does not change this saved draft.</div><p class="q-muted">Source: SYN-PPO-EST-000901 · saved version ${version||'not yet saved'}<br>Template: ${TEMPLATE}<br>Status: Draft · Synthetic · Not issued · No customer response recorded</p>`;
    return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SYN-PPO-QUO-000901 · Draft ${revision||'preview'}</title><style>${quoteCSS}</style></head><body class="quotation-document">${[page1,page2,page3,page4].map((p,i)=>wrapper(p,i+1)).join('')}</body></html>`;
  }
  function preview() {
    const d=viewing===null?null:state.drafts[viewing];
    $('preview').srcdoc=d?d.html:documentFor(state.working);
    $('preview-label').textContent=d?'Generated draft '+d.revision:'Live preview';
    $('preview-state').textContent=d?'Saved estimate v'+d.version+' · '+d.presentation:'Working inputs · not a saved draft';
    $('download').disabled=!d;
  }
  function refresh() {
    const s=state.working;const errors=problems(s);
    $('sell-total').textContent=money(total(s));
    $('cost-total').textContent=money(selected(s).reduce((v,l)=>v+l.qty*l.cost,0));
    $('line-count').textContent=selected(s).length+' / 6';
    $('save-state').textContent=dirty()?(state.saved?'Unsaved changes · saved v'+state.version:'Example loaded · not saved'):('Saved snapshot v'+state.version+(persisted?' · this browser':' · this session only'));
    $('generate').disabled=dirty()||errors.length>0||state.drafts.length>=20;
    const checks=[['Selected prices reconcile',money(total(s))+' AUD excluding tax'],['Customer document fields',errors.length?errors.join(' '):'All required demonstration inputs are present.'],['Internal cost protection','Download contains customer wording and selected sell amounts only.'],['Commercial status','Fictional terms · draft only · no issue or signature.'],['Generation source',dirty()?'Save the current inputs before generating.':'Saved estimate version '+state.version]];
    $('review-checks').innerHTML=checks.map(([title,body],i)=>`<li class="${(i===1&&errors.length)||(i===4&&dirty())?'problem':''}"><strong>${esc(title)}</strong><br>${esc(body)}</li>`).join('');
    $('estimate-lines').innerHTML=lines.map(l=>`<tr class="${l.optional&&!s.localFreight?'excluded':''}"><td><input type="checkbox" aria-label="Include ${esc(l.description)}" ${!l.optional||s.localFreight?'checked':''} ${!l.optional?'disabled':''} data-line="${l.id}"></td><td>${esc(l.description)}<small>${l.category}${l.optional?' · optional':' · fixed scope in this example'}</small></td><td>${l.qty} ${l.unit}</td><td>${money(l.sell)}</td><td>${money(l.qty*l.sell)}</td></tr>`).join('');
    $('estimate-lines').querySelector('[data-line="L06"]').addEventListener('change',e=>{state.working.localFreight=e.target.checked;changed();});
    $('history').innerHTML=state.drafts.length?state.drafts.map((d,i)=>`<button data-history="${i}">Draft ${d.revision} · ${money(d.total)} AUD<small>Estimate v${d.version} · ${esc(d.reason)} · ${esc(d.presentation)}</small></button>`).join(''):'<p class="help">No generated drafts yet.</p>';
    $('history').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{viewing=Number(b.dataset.history);preview();}));
    preview();
  }
  function changed(){persist();refresh();$('generation-state').textContent=dirty()?'Save the current inputs to generate a new draft.':'Saved snapshot ready for generation.';}
  function showStep(step){state.step=step;document.querySelectorAll('.step-panel').forEach(x=>x.hidden=x.id!==step+'-panel');document.querySelectorAll('[data-step]').forEach(x=>{x.classList.toggle('active',x.dataset.step===step);if(x.dataset.step===step)x.setAttribute('aria-current','step');else x.removeAttribute('aria-current');});persist();}
  function populate(){for(const k of Object.keys(initial)){if($(k))$(k).value=state.working[k];}refresh();showStep(state.step);}
  for(const k of Object.keys(initial)){if($(k))$(k).addEventListener('input',e=>{state.working[k]=e.target.value;changed();});}
  document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.step)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{showStep(b.dataset.go);document.querySelector('.steps').scrollIntoView({block:'start',behavior:'smooth'});}));
  $('save').addEventListener('click',()=>{const errors=problems(state.working);if(errors.length){$('save-state').textContent=errors[0];showStep('review');return;}if(dirty()){state.saved=structuredClone(state.working);state.version++;}persist();refresh();$('generation-state').textContent='Saved snapshot ready for generation.';});
  $('generate').addEventListener('click',()=>{if(dirty()||problems(state.saved).length)return;const reason=$('reason').value.trim();if(!reason){$('generation-state').textContent='Enter a revision reason before generating.';$('reason').focus();return;}const revision=state.drafts.length+1;const d={revision,version:state.version,reason,presentation:state.saved.presentation,total:total(state.saved),html:documentFor(state.saved,revision,state.version)};state.drafts.push(d);viewing=state.drafts.length-1;persist();refresh();$('generation-state').textContent='Draft '+revision+' generated from saved estimate v'+state.version+'.';});
  $('working-preview').addEventListener('click',()=>{viewing=null;preview();});
  $('download').addEventListener('click',()=>{if(viewing===null)return;const d=state.drafts[viewing];const url=URL.createObjectURL(new Blob([d.html],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='SYN-PPO-QUO-000901-draft-r'+String(d.revision).padStart(2,'0')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('reset').addEventListener('click',()=>{if(state.version||state.drafts.length){if(!confirm('Reset this synthetic example and clear its locally saved drafts?'))return;}state=defaultState();viewing=null;persist();$('reason').value='';$('generation-state').textContent='Save the example to enable generation.';populate();});
  $('mapping').innerHTML=mapping.map(([title,source])=>`<li><strong>${esc(title)}</strong><span>${esc(source)}</span></li>`).join('');
  window.PPOQuoteDesign={documentFor,initial:structuredClone(initial),lines:structuredClone(lines),total,getState:()=>structuredClone(state),template:TEMPLATE};
  populate();
})();
