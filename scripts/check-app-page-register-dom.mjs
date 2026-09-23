// Generated-document behavioural tests; no browser rendering or application writes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const {JSDOM,VirtualConsole}=await import(process.env.PPO_DESIGN_JSDOM_MODULE||'jsdom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'docs/reference/ui/app-page-register/PPO-App-Page-Register-r05.html'),'utf8');
const original=fs.readFileSync(path.join(root,'docs/reference/ui/app-page-register/PPO-App-Page-Register-r04.html'));
const results=[],errors=[],downloads=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|HTMLAnchorElement/.test(e.message))errors.push(e.message);});
const dom=new JSDOM(html,{url:'https://register.example/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;w.setTimeout(()=>this.dispatchEvent(new w.Event('close')),0);};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.URL.createObjectURL=()=> 'blob:register-test';w.URL.revokeObjectURL=()=>{};
  w.print=()=>{};
}});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const data=JSON.parse($('registerData').textContent),all=[...data.scopes,...data.routes];
const previous=JSON.parse(original.toString().match(/id="registerData">(.*?)<\/script>/s)[1]);
const tick=async()=>{await new Promise(r=>setTimeout(r,30));await new Promise(r=>w.requestAnimationFrame(()=>w.requestAnimationFrame(r)));};
const input=(el,value)=>{assert(el);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const select=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
const close=async id=>{$(id).close();await tick();};
const check=async(name,fn)=>{await fn();results.push({name,status:'passed'});console.log('PASS '+name);};
w.download=(name,text,type)=>downloads.push({name,text,type});
try{
await check('Initialisation and source preservation',()=>{
  assert.equal(errors.length,0);assert.equal(w.PPORegisterR05.counts.entries,260);assert.equal(data.guides.length,260);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),data.meta.source_r04_sha256);
  for(const s of previous.scopes){const n=data.scopes.find(r=>r.key===s.key);assert(n);assert.equal(n.status,s.status);assert.deepEqual(n.build,s.build);}
  for(const r of previous.routes)assert(data.routes.some(n=>n.key===r.key));
});
await check('Complete article, route, source and image references',()=>{
  assert.equal(new Set(data.guides.map(g=>g.guide_key)).size,260);
  for(const g of data.guides){assert.equal(g.sections.length,13);assert.equal(new Set(g.sections.map(s=>s.section_id)).size,13);assert(g.sections.find(s=>s.section_id==='tasks').steps.length>=3);assert(g.source_paths.length);for(const p of g.source_paths)assert(fs.existsSync(path.join(root,p)),p);for(const k of g.related_entry_keys)assert(all.some(r=>r.key===k));}
  for(const r of all){assert(r.links.path.startsWith('/'));assert(data.guides.some(g=>g.entry_key===r.key));for(const id of r.image_ids)assert(data.mockup_assets.some(a=>a.asset_id===id));assert.equal((r.links.path.match(/\{[^}]+\}/g)||[]).length,r.links.params.length);}
  for(const a of data.mockup_assets)assert.equal(crypto.createHash('sha256').update(Buffer.from(a.data_url.split(',')[1],'base64')).digest('hex'),a.sha256);
});
await check('All 260 guide windows render their complete content',async()=>{
  for(const r of process.env.PPO_REGISTER_QUICK_TEST?all.slice(0,2):all){w.openGuide(r.key,{fromHash:true});assert($('guideDialog').open);assert.equal($('guideArticle').querySelectorAll('.guide-section').length,13);assert.equal($('guideTitle').textContent,data.guides.find(g=>g.entry_key===r.key).title);}
  await close('guideDialog');
});
await check('All local/live destinations are usable or require correct record context',async()=>{
  for(const r of process.env.PPO_REGISTER_QUICK_TEST?all.slice(0,2):all){w.openLinks(r.key);for(const env of ['local','live']){const a=$('linksBody').querySelector(`[data-resolved-open="${env}"]`);assert.equal(a.hasAttribute('href'),r.links.params.length===0);assert($('linksBody').textContent.includes(r.links.path));}}
  await close('linksDialog');
});
await check('Local and live record IDs are independent and unsafe/invalid inputs are rejected',async()=>{
  w.openLinks('route:/customers/[id]');
  const local=$('linksBody').querySelector('input[data-env="local"]');
  input(local,'SYN-PPO-123');assert($('linksBody').querySelector('[data-copy-env="local"]').disabled);
  input(local,'00000000-0000-4000-8000-000000000001');
  assert($('linksBody').querySelector('[data-resolved-open="local"]').href.endsWith('/customers/00000000-0000-4000-8000-000000000001'));
  assert(!$('linksBody').querySelector('[data-resolved-open="live"]').hasAttribute('href'));
  input(local,'"><img src=x onerror=alert(1)>');assert(!$('linksBody').querySelector('img'));assert(!$('linksBody').querySelector('[data-resolved-open="local"]').hasAttribute('href'));
  await close('linksDialog');
});
await check('Specialist views validate against the source enumeration',async()=>{
  w.openLinks('route:/estimating/configurations/[id]/[view]');
  input($('linksBody').querySelector('input[data-env="local"][data-link-param="id"]'),'00000000-0000-4000-8000-000000000001');
  const view=$('linksBody').querySelector('input[data-env="local"][data-link-param="view"]');input(view,'unknown');assert(!$('linksBody').querySelector('[data-resolved-open="local"]').hasAttribute('href'));
  input(view,'pricing');assert($('linksBody').querySelector('[data-resolved-open="local"]').href.endsWith('/pricing'));await close('linksDialog');
});
await check('Guide close preserves record input, review note, shortlist and opener',async()=>{
  w.detailOpen('route:/customers/[id]');input($('detailBody').querySelector('[data-param="id"]'),'00000000-0000-4000-8000-000000000001');
  input($('reviewNote'),'Review the facilities context.');$('detailStar').click();
  const field=$('reviewNote'),opener=$('detailBody').querySelector('[data-open-guide]');opener.focus();opener.click();await tick();await close('guideDialog');
  assert.equal($('reviewNote'),field);assert.equal(field.value,'Review the facilities context.');assert.equal($('detailBody').querySelector('[data-param="id"]').value,'00000000-0000-4000-8000-000000000001');assert.equal(d.activeElement,opener);
  const stored=JSON.parse(w.localStorage.getItem('ppo.page-register.r01.reviews')).reviews;assert.equal(stored['route:/customers/[id]'].note,field.value);assert(stored['route:/customers/[id]'].shortlist);await close('detailDialog');
});
await check('Related guide back navigation and section search retain reading state',async()=>{
  w.openGuide('scope:CS-01');input($('guideSearch'),'troubleshooting');assert.equal($('guideArticle').querySelectorAll('.guide-section').length,1);
  w.openGuide('route:/customers');$('guideBack').click();assert.equal($('guideSearch').value,'troubleshooting');
  input($('guideSearch'),'no-such-phrase-432432');assert($('guideArticle').textContent.includes('No sections match'));$('guideClear').click();assert.equal($('guideArticle').querySelectorAll('.guide-section').length,13);
  w.jumpGuide('tasks');assert.equal(d.activeElement.id,'guide-section-tasks');await close('guideDialog');
});
await check('Deep links and browser history close and restore the correct guide',async()=>{
  w.history.replaceState(null,'','/');w.openGuide('scope:CS-01');assert(w.location.hash.includes('guide=scope%3ACS-01'));
  w.history.back();await tick();assert(!$('guideDialog').open);w.history.forward();await tick();assert($('guideDialog').open);assert.equal($('guideTitle').textContent,data.guides.find(g=>g.entry_key==='scope:CS-01').title);await close('guideDialog');assert.equal(w.location.hash,'');
});
await check('Nested image/guide dialogs restore focus in opening order',async()=>{
  w.openMockup('scope:AD-01');assert($('mockupBody').textContent.includes('No UI image linked yet'));const opener=$('mockupBody').querySelector('[data-open-guide]');opener.focus();opener.click();await tick();await close('guideDialog');assert($('mockupDialog').open);assert.equal(d.activeElement,opener);await close('mockupDialog');
  w.openMockup('scope:PJ-02');assert($('mockupBody').querySelector('img').src.startsWith('data:image/png;base64,'));$('mockupActual').click();assert($('imageStage').classList.contains('actual'));$('mockupFit').click();assert(!$('imageStage').classList.contains('actual'));await close('mockupDialog');
});
await check('Guide printing includes all sections despite an active search',async()=>{
  w.openGuide('scope:SV-01');input($('guideSearch'),'troubleshooting');$('printGuide').click();assert.equal($('guidePrint').querySelectorAll('.guide-section').length,13);assert.equal(d.body.dataset.print,'guide');w.dispatchEvent(new w.Event('afterprint'));assert(!d.body.dataset.print);await close('guideDialog');
});
await check('Combined image, guide and route filters plus cards work',()=>{
  w.setView('route');select('guideFilter','added');assert.equal(w.filterRows().length,45);select('imageFilter','yes');assert(w.filterRows().every(r=>r.added_in&&r.image_ids.length));
  w.resetFilters();w.setView('scope');select('destinationFilter','planned');assert(w.filterRows().length>0);assert(w.filterRows().every(r=>r.links.state.startsWith('Planned')));
  w.resetFilters();d.querySelector('[data-display="cards"]').click();assert(d.querySelector('.cards [data-open-guide]'));d.querySelector('[data-display="table"]').click();
  input($('search'),'Northbank Nursery');$('searchGuideContent').checked=true;$('searchGuideContent').dispatchEvent(new w.Event('change'));assert(w.filterRows().length>0);w.resetFilters();
});
await check('Preferences validate server origins and update open link builders',async()=>{
  w.openLinks('route:/customers');w.modalOpen('settingsDialog');input($('liveBaseInput'),'javascript:alert(1)');$('settingsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));assert($('settingsDialog').open);assert($('baseError').textContent);
  input($('baseInput'),'http://127.0.0.1:3001');input($('liveBaseInput'),'https://demo.example');$('settingsForm').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert(!$('settingsDialog').open);assert.equal($('linksBody').querySelector('[data-resolved-open="live"]').href,'https://demo.example/customers');
  const pref=JSON.parse(w.localStorage.getItem('ppo.page-register.r01.preferences'));assert.equal(pref.live_base,'https://demo.example');await close('linksDialog');
});
await check('CSV, review backup and portable guide library exports retain information',()=>{
  w.exportCsv();assert(downloads.at(-1).text.includes('Local URL/template'));assert(downloads.at(-1).text.includes('https://demo.example/'));
  w.exportReviews();assert(JSON.parse(downloads.at(-1).text).reviews['route:/customers/[id]'].shortlist);
  w.exportGuideLibrary();const lib=JSON.parse(downloads.at(-1).text);assert.equal(lib.guides.length,260);assert.equal(lib.guide_bindings.length,260);assert(lib.mockup_assets.every(a=>!a.data_url));
});
await check('Stable help resolution handles exact/new/dynamic/query/unknown pages',()=>{
  const resolve=w.PPORegisterR05.resolveGuideContext;
  assert.equal(resolve('/customers/new').entry_key,'route:/customers/new');assert.equal(resolve('/customers/00000000-0000-4000-8000-000000000001').entry_key,'route:/customers/[id]');
  assert.equal(resolve('/customers/new','kind=person').section_id,'page-tour');assert.equal(resolve('/engineering/commissioning').entry_key,'route:/engineering/commissioning');assert.equal(resolve('/sales/opportunities','view=Grid').section_id,'page-tour');assert.equal(resolve('/unknown'),null);
});
await check('Plain content escapes markup and all dialogs have accessible names',()=>{
  const markup=w.PPORegisterR05.sectionMarkup({section_id:'test',title:'<img src=x>',paragraphs:['<script>alert(1)</script>'],steps:[],rows:[],headers:[]});const holder=d.createElement('div');holder.innerHTML=markup;assert(!holder.querySelector('img,script'));
  for(const dialog of d.querySelectorAll('dialog'))assert($(dialog.getAttribute('aria-labelledby')));
  assert.equal(d.querySelectorAll('script[src],link[rel="stylesheet"],img[src^="http"]').length,0);assert(!/\bfetch\s*\(|XMLHttpRequest/.test(html));assert.deepEqual(errors,[]);
});
const evidence={status:'passed',count:results.length,engine:'jsdom 30.1.1',html_sha256:crypto.createHash('sha256').update(html).digest('hex'),visual_browser_checks:'Not performed: browser tool URL policy blocked file preview. DOM tests do not establish layout or native keyboard/print behaviour.',results};
if(!process.env.PPO_REGISTER_QUICK_TEST){const out=path.join(root,'docs/testing/evidence/app-page-register-r05');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'dom-results.json'),JSON.stringify(evidence,null,2)+'\n');}console.log(`${results.length} generated-document test groups passed${process.env.PPO_REGISTER_QUICK_TEST?' (quick diagnostic; no evidence recorded)':''}.`);
}catch(e){console.error('Failed after '+results.length+' groups:',e);process.exitCode=1;}finally{dom.window.close();}
