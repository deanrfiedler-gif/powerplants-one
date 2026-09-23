'use strict';
// Portable authoring/review surface. This does not mutate the PPO application.
const guideMap = new Map(DATA.guides.map(g => [g.guide_key, g]));
const assetMap = new Map(DATA.mockup_assets.map(a => [a.asset_id, a]));
const guideReadState = new Map();
const dialogOpeners = new WeakMap();
const dialogStack = [];
const guideTrail = [];
let currentGuideEntry = null, currentLinkEntry = null, currentImageEntry = null;
let liveBase = DATA.meta.live_base;
let guideFilter = 'all', imageFilter = 'all', destinationFilter = 'all', searchGuides = false;
let guideReturnHash = '', changingHash = false;
const validKey = key => typeof key === 'string' && byKey.has(key);
const isPlanned = r => r.links.state.startsWith('Planned');
const topDialog = () => dialogStack.filter(dialog => dialog.open).at(-1);
try { const saved = safeRead(PREF); if (saved?.live_base) liveBase = validateBase(saved.live_base); } catch { /* retain reviewed default */ }

const oldPersistPrefs = persistPrefs;
persistPrefs = function () { oldPersistPrefs(); saveStore(PREF, {schema:1,base,live_base:liveBase,designRoot,display:state.display}); };

function showDialog(id) {
  const dialog = $(id);
  if (!dialog.open) {
    const opener = document.activeElement;
    dialogOpeners.set(dialog, {node:opener, key:opener?.dataset?.openGuide || opener?.dataset?.openLinks || opener?.dataset?.openMockup || opener?.dataset?.detail});
    dialog.showModal();
    dialogStack.push(dialog);
  }
}
const oldModalOpen = modalOpen;
modalOpen = function (id) {
  if (id === 'settingsDialog') $('liveBaseInput').value = liveBase;
  dialogOpeners.set($(id), {node:document.activeElement});
  oldModalOpen(id);
  if (!dialogStack.includes($(id))) dialogStack.push($(id));
};

// Every dialog keeps its own opener. Reading a guide over details leaves the form mounted.
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    const stackIndex = dialogStack.indexOf(dialog);
    if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
    if (dialog.id === 'guideDialog') {
      saveGuidePosition();
      if (!changingHash && location.hash.startsWith('#guide=')) history.replaceState(null, '', location.pathname + location.search + guideReturnHash);
    }
    if (dialog.id === 'detailDialog') render();
    const opener = dialogOpeners.get(dialog);
    requestAnimationFrame(() => {
      if (opener?.node?.isConnected && (!topDialog() || topDialog().contains(opener.node))) opener.node.focus({preventScroll:true});
      else if (opener?.key) {
        const replacement = [...document.querySelectorAll('[data-open-guide],[data-detail]')].find(el => el.dataset.openGuide === opener.key || el.dataset.detail === opener.key);
        if (replacement && !topDialog()) replacement.focus({preventScroll:true});
        else (topDialog()?.querySelector('button') || $('main')).focus({preventScroll:true});
      } else (topDialog()?.querySelector('button') || $('main')).focus({preventScroll:true});
    });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
});

function appAction(r, environment) {
  const label = environment === 'local' ? 'Local app' : 'Live app';
  const cls = isPlanned(r) ? ' planned-link' : '';
  const name = `${label}: ${entryTitle(r)}${isPlanned(r) ? ' — planned destination' : ''}`;
  if (r.links.params.length) return `<button class="btn${cls}" data-open-links="${esc(r.key)}" data-environment="${environment}" aria-label="${esc(name)}">${icon('arrow')}${label}</button>`;
  return `<a class="btn${cls}" href="${esc((environment === 'local' ? base : liveBase) + r.links.path)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name + ' (opens in a new tab)')}">${icon('arrow')}${label}</a>`;
}
function entryActions(r, includeGuide = true) {
  return `<div class="entry-actions">${appAction(r,'local')}${appAction(r,'live')}<button class="btn ${r.image_ids.length?'':'missing-image'}" data-open-mockup="${esc(r.key)}" aria-label="View UI mockup for ${esc(entryTitle(r))}${r.image_ids.length?'':' — no image linked yet'}">${icon('file')}${r.image_ids.length?'UI mockup':'No image yet'}</button>${includeGuide?`<button class="btn guide-button" data-open-guide="${esc(r.key)}" aria-label="User guide: ${esc(entryTitle(r))}">${icon('info')}User guide</button>`:''}</div>`;
}
function routeCaption(r) {
  return `<span class="route-caption">${esc(r.links.path)}</span><span class="entry-link-caption">${esc(r.links.state)} · ${r.links.params.length?'Choose a record in each environment':'Live deployment unverified'}</span>`;
}

rowMarkup = function (r) {
  return `<tr><td><div class="row-heading">${orderBadge(r)}<button class="row-title" data-detail="${esc(r.key)}">${esc(entryTitle(r))}</button></div><div class="row-meta"><span class="code">${esc(r.kind==='route'?'APP':r.code)}</span><span>${esc(moduleName(r.module))}</span>${r.added_in?'<span class="added-badge">New in r05</span>':''}${review(r).note?'<span class="review-dot" title="Local review note saved"></span>':''}</div>${entryActions(r)}${routeCaption(r)}</td><td>${badge(r)}<div style="margin-top:8px"><span class="guide-badge">Guide · Draft r01</span></div><small class="entry-link-caption">${r.added_in?'Source route added 23 Sep':'Scope assessment retained from r04'}</small></td><td>${connection(r)}${orderSubline(r)}</td><td>${designLabel(r)}</td><td>${star(r)}</td></tr>`;
};
cardMarkup = function (r) {
  return `<article class="item-card"><div class="card-top"><div class="card-tags">${orderBadge(r)}${badge(r)}${r.added_in?'<span class="added-badge">New in r05</span>':''}</div>${star(r)}</div><button class="row-title" data-detail="${esc(r.key)}">${esc(entryTitle(r))}</button><div class="row-meta"><span class="code">${esc(r.kind==='route'?'APP':r.code)}</span>${esc(moduleName(r.module))}<span class="guide-badge">Guide · Draft</span></div><p class="card-summary">${esc(r.summary)}</p>${routeCaption(r)}${entryActions(r)}<div class="card-bottom">${designLabel(r)}<button data-detail="${esc(r.key)}">View details ${icon('chevron')}</button></div></article>`;
};

const guideSearchIndex = new Map(DATA.guides.map(g => [g.entry_key, JSON.stringify(g.sections).toLocaleLowerCase('en-AU')]));
const originalFilterRows = filterRows;
filterRows = function (ignoreModule = false) {
  let rows;
  if (searchGuides && state.q.trim()) {
    const query = state.q; state.q = '';
    try { rows = originalFilterRows(ignoreModule); } finally { state.q = query; }
    const terms = query.toLowerCase().trim().split(/\s+/);
    rows = rows.filter(r => terms.every(t => [entryTitle(r),r.code,r.path||'',r.links.path,r.summary,review(r).note,guideSearchIndex.get(r.key)].join(' ').toLowerCase().includes(t)));
  } else rows = originalFilterRows(ignoreModule);
  return rows.filter(r => (guideFilter==='all'||guideFilter==='draft'&&r.guide_status==='Draft'||guideFilter==='planned'&&['Planned workflow','Conditional proposal'].includes(r.guide_mode)||guideFilter==='added'&&r.added_in==='r05') && (imageFilter==='all'||imageFilter==='yes'&&r.image_ids.length||imageFilter==='no'&&!r.image_ids.length) && (destinationFilter==='all'||destinationFilter==='source'&&!isPlanned(r)||destinationFilter==='planned'&&isPlanned(r)));
};
const originalResetFilters = resetFilters;
resetFilters = function () { guideFilter='all';imageFilter='all';destinationFilter='all';searchGuides=false;originalResetFilters(); };
const originalRender = render;
const originalWizardFeature = renderWizardFeature;
renderWizardFeature = function () {
  originalWizardFeature();
  $('wizardFeature').insertAdjacentHTML('afterbegin','<p class="r04-baseline-note"><strong>Retained r04 planning brief · 20 September.</strong> The native ES-02 discovery workflow is now present in source. The scope and integration checklist below remain historical planning evidence; read the r05 page guide for current source links and verification limits.</p>');
};
const originalWizardDetail = wizardDetail;
wizardDetail = function (r) {
  const content=originalWizardDetail(r);
  return content ? '<p class="r04-baseline-note"><strong>Historical r04 feature assessment.</strong> Native discovery source and the ES-02 handover are now linked in the r05 guide. Remaining broader scope still needs review.</p>'+content : '';
};
render = function () {
  originalRender();
  $('guideFilter').value=guideFilter; $('imageFilter').value=imageFilter; $('destinationFilter').value=destinationFilter; $('searchGuideContent').checked=searchGuides;
  if(guideFilter!=='all'||imageFilter!=='all'||destinationFilter!=='all'||searchGuides) $('clearFilters').hidden=false;
  $('librarySummary').textContent = `${DATA.guides.length} draft guides · ${all.filter(r=>r.image_ids.length).length} entries with images · ${DATA.planned_routes.length} proposed destinations`;
  $('viewFootnote').textContent = state.view==='route' ? `${DATA.routes.length} registered source addresses, including ${DATA.route_changes.added.length} additions in r05. Source presence, live deployment and acceptance are separate.` : 'Scope statuses and build ranks retain the r04 assessment. Every entry now has a guide and an application destination; source links may cover only part of a scope.';
  $('resultHint').textContent = 'Open a page, read its guide or inspect its design';
};

const originalDetailOpen = detailOpen;
detailOpen = function (key) {
  if (!validKey(key)) return;
  originalDetailOpen(key);
  const r=byKey.get(key);
  $('detailBody').insertAdjacentHTML('afterbegin', `<section class="details-launch"><h3>Explore this page</h3>${entryActions(r)}${routeCaption(r)}<button class="btn quiet" data-open-links="${esc(key)}" style="margin-top:8px">View all addresses & copy links</button><p style="margin-top:10px">${esc(r.guide_mode)} · Guide review pending. ${r.added_in?'Source route added in r05.':'Implementation assessment retained from 20 September; current source links were refreshed on 23 September.'}</p></section>`);
};

// This also supports the newly inventoried specialist view parameter without treating it as a UUID.
function validParameter(param, value) {
  if (param.values) return param.values.includes(value);
  return param.format==='slug'||param.key==='view' ? /^[a-z][a-z0-9-]{0,60}$/i.test(value) : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
updateResolved = function () {
  const r=byKey.get(activeKey); if(!r||r.kind!=='route')return null;
  let url=base+r.template,valid=true;
  for(const p of r.params){const input=$('detailBody').querySelector(`[data-param="${p.key}"]`);const value=input?.value.trim()||'';if(!validParameter(p,value))valid=false;url=url.replace('{'+p.key+'}',value?encodeURIComponent(value):'{'+p.key+'}');}
  $('resolvedUrl').textContent=url;const a=$('openResolved');
  if(valid){a.href=url;a.removeAttribute('aria-disabled');a.tabIndex=0;}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.tabIndex=-1;}
  a.style.opacity=valid?'1':'.45';$('copyResolved').disabled=!valid;$('urlError').textContent=valid?'':'Complete each record UUID or view name to create this record link.';return valid?url:null;
};

copyText = async function (value) {
  if(!value)return;
  let field;
  try {
    if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {field=document.createElement('textarea');field.value=value;field.style.cssText='position:fixed;opacity:0';(topDialog()||document.body).append(field);field.select();if(!document.execCommand('copy'))throw new Error('Unavailable');}
    notify('Link copied');
  }catch{notify('Clipboard unavailable. Select and copy the displayed address.');}
  finally{field?.remove();}
};

function openLinks(key, environment='local') {
  if(!validKey(key))return;
  currentLinkEntry=key;const r=byKey.get(key);$('linksTitle').textContent=entryTitle(r);
  $('linksBody').innerHTML=`${isPlanned(r)?'<p class="link-warning">Planned destination. The address is provided for future implementation and may currently be unavailable.</p>':''}<p class="link-explanation">Local and live applications may run different releases and contain different records. Enter the record ID from each destination environment. No credentials or record IDs are saved in this register.</p>${['local','live'].map(env=>`<section class="environment-link" data-env="${env}"><h3>${env==='local'?'Local application':'Live web application'}</h3><p class="link-state">${env==='local'?'Development server · page availability not individually checked':'Verified PPO sign-in host · authenticated page deployment not checked'}</p>${r.links.params.map(p=>`<label class="field">${esc(p.label)} · ${env}<input data-link-param="${esc(p.key)}" data-env="${env}" autocomplete="off" spellcheck="false" maxlength="64" placeholder="${esc(p.placeholder)}"></label>`).join('')}<div class="url-value" data-url="${env}" tabindex="0"></div><p class="field-error" data-link-error="${env}" role="status"></p><div class="url-actions"><a class="btn primary" data-resolved-open="${env}" target="_blank" rel="noopener noreferrer">Open ${env==='local'?'local':'live'} page ${icon('arrow')}</a><button class="btn" data-copy-env="${env}">Copy link</button>${r.links.params.length?`<a class="btn" href="${esc((env==='local'?base:liveBase)+r.links.parent_path)}" target="_blank" rel="noopener noreferrer">Choose record first ${icon('arrow')}</a>`:''}</div></section>`).join('')}<button class="btn" data-modal="settingsDialog">Change server addresses</button>`;
  updateLinkUrls();showDialog('linksDialog');
  const input=$('linksBody').querySelector(`input[data-env="${environment}"]`);(input||$('linksTitle')).focus({preventScroll:true});
}
function updateLinkUrls() {
  const r=byKey.get(currentLinkEntry);if(!r)return;
  for(const env of ['local','live']){
    let url=(env==='local'?base:liveBase)+r.links.path,valid=true;
    for(const p of r.links.params){const value=$('linksBody').querySelector(`input[data-env="${env}"][data-link-param="${p.key}"]`).value.trim();if(!validParameter(p,value))valid=false;url=url.replace('{'+p.key+'}',value?encodeURIComponent(value):'{'+p.key+'}');}
    const a=$('linksBody').querySelector(`[data-resolved-open="${env}"]`);const button=$('linksBody').querySelector(`[data-copy-env="${env}"]`);
    $('linksBody').querySelector(`[data-url="${env}"]`).textContent=url;
    if(valid){a.href=url;a.removeAttribute('aria-disabled');a.tabIndex=0;button.disabled=false;}else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.tabIndex=-1;button.disabled=true;}
    $('linksBody').querySelector(`[data-link-error="${env}"]`).textContent=valid?'':`Enter valid ${env} record IDs${r.links.params.some(p=>p.key==='view')?' and view name':''} to open the exact page.`;
  }
}
$('linksBody').addEventListener('input',updateLinkUrls);

function sectionMarkup(section, prefix='guide-section-') {
  return `<section class="guide-section" data-section="${esc(section.section_id)}"><h3 id="${prefix}${esc(section.section_id)}" tabindex="-1">${esc(section.title)}</h3>${section.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${section.steps.length?`<ol>${section.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${section.rows.length?`<table><thead><tr>${section.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${section.rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</section>`;
}
function saveGuidePosition(){if(currentGuideEntry)guideReadState.set(currentGuideEntry,{query:$('guideSearch').value,scroll:$('guideScroll').scrollTop});}
function guideHref(key, section='quick-start') {const url=new URL(location.href);url.hash=new URLSearchParams({guide:key,section}).toString();return url.href;}
function openGuide(key, options={}) {
  if(!validKey(key)){notify('This guide entry is unavailable.');return;}
  const r=byKey.get(key),g=guideMap.get(r.guide_key);if(!g){notify('This guide is being prepared.');return;}
  const wasOpen=$('guideDialog').open;
  if(wasOpen){saveGuidePosition();if(currentGuideEntry!==key&&!options.back)guideTrail.push(currentGuideEntry);}else{guideTrail.length=0;guideReturnHash=location.hash.startsWith('#guide=')?'':location.hash;}
  currentGuideEntry=key;
  $('guideTitle').textContent=g.title;$('guideEyebrow').textContent=moduleName(r.module)+' · '+(r.kind==='scope'?r.code:'App page')+' · User guide';
  $('guideMeta').textContent=`${g.content_mode} · ${g.status} ${g.revision} · Prepared 23 September 2026`;
  const saved=guideReadState.get(key);$('guideSearch').value=options.section?'':saved?.query||'';
  $('guideContext').innerHTML=`<div class="guide-context ${isPlanned(r)||g.content_mode.includes('proposal')?'planned':''}"><strong>${esc(r.links.state)} · ${esc(r.page_type)}</strong><span>${esc(isPlanned(r)?'This address is a future reference. The guide describes intended tasks and does not establish working controls.':'Application source is linked; deployed behaviour and full workflow acceptance remain separately verified.')}</span>${entryActions(r,false)}</div>`;
  renderGuideContent();
  $('guideRelated').innerHTML=`<h3>Related pages & workflows</h3>${g.related_entry_keys.length?`<div class="related-links">${g.related_entry_keys.map(k=>`<button data-open-guide="${esc(k)}">${esc(entryTitle(byKey.get(k)))}</button>`).join('')}</div>`:'<p>No related guide is registered for this entry. Use the workspace filter to explore related work.</p>'}`;
  $('guideEvidenceBody').innerHTML=`<p>Guide key: <code>${esc(g.guide_key)}</code><br>Content status: Draft · Reviewer not nominated<br>Article workflow walkthrough: ${esc(g.runtime_evidence)}<br>Current source: <code>${esc(g.source_commit)}</code><br>Scope assessment: 20 September 2026 · <code>${esc(g.scope_baseline_commit.slice(0,8))}</code></p><p>Original register scope: ${esc(r.summary)}</p>${g.source_paths.map(p=>`<p><a href="${esc(sourceUrl(p))}" target="_blank" rel="noopener noreferrer">${esc(p)} ↗</a></p>`).join('')}<p>Application handover: bind this stable guide key to the existing global information icon. Use exact routes before record patterns, retain relevant query context, and deliver a guide matched to the application's release. This HTML does not install that adapter.</p>`;
  $('guideEvidence').open=false;$('guideBack').disabled=!guideTrail.length;
  showDialog('guideDialog');$('guideTitle').focus({preventScroll:true});
  if(!options.fromHash)history.pushState(null,'',guideHref(key,options.section||'purpose'));
  requestAnimationFrame(()=>{if(options.section)jumpGuide(options.section);else $('guideScroll').scrollTop=saved?.scroll||0;});
}
function renderGuideContent(){
  if(!currentGuideEntry)return;
  const g=guideMap.get(byKey.get(currentGuideEntry).guide_key),q=$('guideSearch').value.trim().toLowerCase(),terms=q.split(/\s+/).filter(Boolean);
  const found=g.sections.filter(s=>terms.every(t=>JSON.stringify(s).toLowerCase().includes(t)));
  $('guideArticle').innerHTML=found.length?found.map(s=>sectionMarkup(s)).join(''):'<div class="guide-empty"><p>No sections match this search.</p><button class="btn" data-guide-clear="true">Clear search</button></div>';
  $('guideContents').innerHTML=found.map(s=>`<button data-guide-section="${esc(s.section_id)}">${esc(s.title)}</button>`).join('');
  $('guideSearchStatus').textContent=q?`${found.length} of ${g.sections.length} sections match. Clear search to read the complete guide.`:`${g.sections.length} sections · Use contents to jump to a task`;
}
function jumpGuide(id){
  let target=$('guide-section-'+id);
  if(!target){$('guideSearch').value='';renderGuideContent();target=$('guide-section-'+id);}
  if(!target){$('guideSearchStatus').textContent='This section is unavailable. The guide contents are shown.';return;}
  target.focus({preventScroll:true});$('guideScroll').scrollTop+=target.getBoundingClientRect().top-$('guideScroll').getBoundingClientRect().top-18;
  [...$('guideContents').querySelectorAll('button')].forEach(b=>b.setAttribute('aria-current',String(b.dataset.guideSection===id)));
}
$('guideSearch').addEventListener('input',()=>{renderGuideContent();$('guideScroll').scrollTop=0;});
$('guideClear').addEventListener('click',()=>{$('guideSearch').value='';renderGuideContent();$('guideSearch').focus();});
$('guideBack').addEventListener('click',()=>{const previous=guideTrail.pop();if(previous)openGuide(previous,{back:true});});
$('copyGuideLink').addEventListener('click',()=>copyText(guideHref(currentGuideEntry)));
$('guideDetails').addEventListener('click',()=>{const key=currentGuideEntry;$('guideDialog').close();if(!($('detailDialog').open&&activeKey===key))detailOpen(key);else $('detailTitle').focus();});
$('printGuide').addEventListener('click',()=>{
  const g=guideMap.get(byKey.get(currentGuideEntry).guide_key);
  $('guidePrint').innerHTML=`<h1>${esc(g.title)}</h1><p class="print-meta">Powerplants One · User guide · ${esc(g.status)} ${esc(g.revision)}<br>${esc(g.content_mode)} · Prepared 23 September 2026<br>Workflow review pending · Source ${esc(g.source_commit.slice(0,8))}</p>${g.sections.map(s=>sectionMarkup(s,'print-section-')).join('')}`;
  document.body.dataset.print='guide';window.print();
});
window.addEventListener('afterprint',()=>{delete document.body.dataset.print;});

function openMockup(key){
  if(!validKey(key))return;currentImageEntry=key;const r=byKey.get(key);$('mockupTitle').textContent=entryTitle(r);
  if(!r.image_ids.length){$('mockupBody').innerHTML=`<div class="mockup-empty">${icon('file')}<h3>No UI image linked yet</h3><p>A page-specific image has not been linked for this entry. Its guide and application destinations remain available.</p>${r.design?`<a class="btn primary" href="${esc(designUrl(r.design))}" target="_blank" rel="noopener noreferrer">Open interactive HTML design ${icon('arrow')}</a>`:'<p>No exact HTML design is linked in this snapshot either.</p>'}<button class="btn" data-open-guide="${esc(key)}">Read user guide</button><p class="small muted">Record a missing-image request in View details → Your review. It stays in your local review backup.</p></div>`;}
  else renderImage(r.image_ids[0]);
  showDialog('mockupDialog');$('mockupTitle').focus({preventScroll:true});
}
function renderImage(id){
  const asset=assetMap.get(id);if(!asset)return;const r=byKey.get(currentImageEntry);
  $('mockupBody').innerHTML=`<div class="mockup-tools"><div><strong>${esc(asset.title)}</strong><p>${esc(asset.kind)} · ${esc(asset.revision)} · Retained synthetic reference</p></div><div class="url-actions"><button class="btn" id="mockupFit">Fit width</button><button class="btn" id="mockupActual">Actual size</button><a class="btn" href="${esc(asset.data_url)}" download="PPO-${esc(asset.asset_id)}.png">Download image</a></div></div><div class="image-stage" id="imageStage"><img src="${esc(asset.data_url)}" alt="${esc(asset.alt)}"></div><p class="mockup-caption">${esc(asset.kind==='Implementation capture'?'This is a retained application screenshot, not a proposed UI mockup. It does not establish what is deployed today.':'This is a retained design mockup. Design appearance does not establish implemented behaviour.')}<br><a href="${esc(sourceUrl(asset.source_path))}" target="_blank" rel="noopener noreferrer">View exact source reference ↗</a>${r.design?` · <a href="${esc(designUrl(r.design))}" target="_blank" rel="noopener noreferrer">Open HTML design ↗</a>`:''}<br>Image SHA-256: <span class="mono">${esc(asset.sha256)}</span></p>`;
}

function exportGuideLibrary(){
  download('PPO-Page-Guide-Library-r05.json',JSON.stringify({schema_version:1,register_revision:'r05',source_commit:DATA.meta.sha,guides:DATA.guides,guide_bindings:DATA.guide_bindings,guide_contract:DATA.guide_contract,planned_routes:DATA.planned_routes,mockup_assets:DATA.mockup_assets.map(({data_url,...metadata})=>metadata)},null,2),'application/json');notify('Guide library exported');
}
exportCsv = function () {
  const headers=['Build order','Phase','Entry key','Title','Workspace','Scope/source status','Page type','Destination state','Local URL/template','Live URL/template','Guide key','Guide status','Guide revision','Guide mode','Image state','Image sources','HTML design','Remaining scope / baseline note','Prerequisites','Review note','Shortlisted','Current source commit','Scope baseline commit'];
  const rows=filterRows().map(r=>[rankLabel(r.build.rank),r.build.phase,r.key,entryTitle(r),moduleName(r.module),labels[r.status],r.page_type,r.links.state,base+r.links.path,liveBase+r.links.path,r.guide_key,r.guide_status,'r01',r.guide_mode,r.image_ids.length?'Linked':'No image linked',r.image_ids.map(id=>assetMap.get(id).source_path).join(' | '),r.design?designUrl(r.design):'',r.summary,r.build.after.join(' | '),review(r).note,review(r).shortlist?'Yes':'No',DATA.meta.sha,DATA.meta.scope_sha]);
  download('PPO-Page-Register-r05-Filtered.csv','\ufeff'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');notify(`${rows.length} entries exported with local/live links and guide metadata`);
};

document.addEventListener('click',event=>{
  const button=event.target.closest('button,a');if(!button)return;
  if(button.dataset.openGuide){event.preventDefault();openGuide(button.dataset.openGuide);return;}
  if(button.dataset.openLinks){event.preventDefault();openLinks(button.dataset.openLinks,button.dataset.environment);return;}
  if(button.dataset.openMockup){event.preventDefault();openMockup(button.dataset.openMockup);return;}
  if(button.dataset.guideSection){jumpGuide(button.dataset.guideSection);return;}
  if(button.dataset.guideClear){$('guideClear').click();return;}
  if(button.dataset.copyEnv){copyText($('linksBody').querySelector(`[data-url="${button.dataset.copyEnv}"]`).textContent);return;}
  switch(button.id){
    case 'mockupFit':$('imageStage').classList.remove('actual');break;
    case 'mockupActual':$('imageStage').classList.add('actual');break;
    case 'exportGuides':case 'exportGuideChoice':exportGuideLibrary();break;
    case 'showChanges':showDialog('changesDialog');break;
    case 'resetBase':$('liveBaseInput').value=DATA.meta.live_base;break;
  }
});

// Install controls before the final r05 render. Existing r01 preference/review keys remain compatible.
document.querySelector('.heading').insertAdjacentHTML('afterend',`<section class="library-bar" aria-label="Guide library"><div class="library-intro"><span class="library-mark">${icon('info')}</span><div><strong>Your page library · r05</strong><p id="librarySummary"></p></div></div><div class="library-actions"><button class="btn" id="showChanges">What changed</button><button class="btn" id="exportGuides">Export guide library</button><button class="btn" data-modal="settingsDialog">App links & preferences</button></div></section>`);
$('filterPanel').insertAdjacentHTML('afterend',`<div class="advanced-filters"><label>Guides <select id="guideFilter"><option value="all">All guides</option><option value="draft">Draft for review</option><option value="planned">Planned / conditional guidance</option><option value="added">Source routes added in r05</option></select></label><label>Images <select id="imageFilter"><option value="all">All entries</option><option value="yes">Image linked</option><option value="no">No image yet</option></select></label><label>Destination <select id="destinationFilter"><option value="all">All destinations</option><option value="source">Source entry point</option><option value="planned">Planned route / view</option></select></label><label class="guide-search-all"><input id="searchGuideContent" type="checkbox">Search guide content too</label></div>`);
for(const id of ['guideFilter','imageFilter','destinationFilter','searchGuideContent'])$(id).addEventListener('change',()=>{guideFilter=$('guideFilter').value;imageFilter=$('imageFilter').value;destinationFilter=$('destinationFilter').value;searchGuides=$('searchGuideContent').checked;state.page=1;render();});
$('baseInput').closest('label').insertAdjacentHTML('afterend',`<label class="field" style="margin-top:20px">Live web application address<input id="liveBaseInput" type="url" required spellcheck="false" placeholder="https://your-ppo-host.example"><small>Verified default: PPO Azure sign-in host. Use the server origin only; page availability and deployed release are checked separately.</small></label><p class="small muted settings-live-note">Both environments use the registered page paths. Planned destinations remain proposals. Record IDs are entered separately for local and live pages.</p>`);
document.querySelector('#settingsTitle').textContent='Local, live & design links';
$('settingsForm').addEventListener('submit',()=>{if($('linksDialog').open)updateLinkUrls();if($('guideDialog').open){const r=byKey.get(currentGuideEntry);$('guideContext').querySelector('.entry-actions').outerHTML=entryActions(r,false);}});
document.querySelector('.export-choices').insertAdjacentHTML('beforeend',`<button class="export-choice" id="exportGuideChoice">${icon('info')}<span><strong>Guide library · JSON</strong><small>Detailed articles, stable keys, route bindings, proposed destinations and source metadata for later application integration.</small></span></button>`);
$('changesBody').innerHTML=`<p><strong>${DATA.guides.length} entries now have a detailed draft guide.</strong> Local/live links, missing-image handling, eight embedded visual references, guide search/printing and a portable application mapping are included.</p><p style="margin-top:12px">The original 150 scopes and 65 addresses are retained. ${DATA.route_changes.added.length} additional source routes are mapped below. All scope assessments and build ranks remain the dated r04 baseline; source additions do not establish full-scope completion.</p><p style="margin-top:12px">The live origin was checked on 23 September: HTTP 401, “Sign in · Powerplants One”. No authenticated per-page deployment audit is claimed.</p><h3 style="margin-top:22px">New source addresses</h3><div class="changes-list">${DATA.route_changes.added.map(r=>`<button data-open-guide="${esc(r.key)}">${esc(r.title)}<small>${esc(r.path)}</small></button>`).join('')}</div><h3 style="margin-top:22px">Guide maintenance</h3><p>All guides are Draft. Update the authored profile, exact page bindings and affected evidence when a workflow changes. Exported guide data is ready for an adapter; the application information icon is not changed by this HTML.</p>`;
document.querySelector('.snapshot-line').innerHTML='<span>r05 · Source routes checked 23 September 2026</span><span>Scope assessments retained from 20 September · Guidance is Draft</span>';
document.querySelector('[data-metric="built"] .metric-label').textContent='Source app addresses';
document.querySelector('[data-metric="built"] .metric-note').textContent='Existing routes · deployment checked separately';
$('tab-route').querySelector('.tab-count').textContent=DATA.routes.length;
$('aboutDialog').querySelector('.dialog-body').insertAdjacentHTML('afterbegin',`<p class="dialog-callout"><strong>r05 successor:</strong> source routes were reconciled at ${DATA.meta.sha.slice(0,8)} on 23 September 2026. The historical scope definitions and assessment below remain the r04 baseline. Guides are Draft; images distinguish mockups from implementation captures.</p>`);

function readGuideHash(){
  const hash=new URLSearchParams(location.hash.slice(1));const key=hash.get('guide');
  changingHash=true;
  try {if(key){if(validKey(key))openGuide(key,{section:hash.get('section')||'purpose',fromHash:true});else notify('Unknown guide link. Choose a registered entry.');}else if($('guideDialog').open)$('guideDialog').close();}
  finally{changingHash=false;}
}
window.addEventListener('popstate',readGuideHash);
window.addEventListener('hashchange',readGuideHash);
// Pure resolver exported for an application adapter and contract verification.
function resolveGuideContext(pathname, query=''){
  const bindings=DATA.guide_bindings.filter(b=>b.route_pattern);
  let selected=bindings.find(b=>b.route_pattern===pathname);
  if(!selected)selected=bindings.filter(b=>b.route_pattern.includes('[')).sort((a,b)=>b.route_pattern.length-a.route_pattern.length).find(b=>{
    const parts=b.route_pattern.split('/');const actual=pathname.split('/');return parts.length===actual.length&&parts.every((p,i)=>p.startsWith('[')?actual[i].length>0:p===actual[i]);
  });
  if(!selected)return null;
  const params=new URLSearchParams(query);const variant=selected.variants.find(v=>{const url=new URL(v.path,'https://ppo.invalid');return url.search&&[...url.searchParams].every(([k,v])=>params.get(k)===v);});
  return {guide_key:selected.guide_key,entry_key:selected.entry_key,section_id:variant?.section_id||selected.entry_section,variant_label:variant?.label||null};
}
window.PPORegisterR05 = Object.freeze({resolveGuideContext,validParameter,sectionMarkup,get counts(){return {entries:all.length,guides:DATA.guides.length,routes:DATA.routes.length,scopes:DATA.scopes.length};}});
render();readGuideHash();
