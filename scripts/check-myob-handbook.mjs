#!/usr/bin/env node
/** DOM-only document assurance. Native browser layout/focus/print remain separate. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const [htmlPath,jsdomPath,evidencePath]=process.argv.slice(2);
if(!htmlPath||!jsdomPath||!evidencePath)throw Error('Usage: node scripts/check-myob-handbook.mjs HTML JSDOM_ENTRY EVIDENCE_JSON');
const {JSDOM,VirtualConsole}=await import(pathToFileURL(path.resolve(jsdomPath)));
const html=await fs.readFile(htmlPath,'utf8');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'docs/design/myob-integration/content.json'),'utf8'));
const checks=[];let failures=[];
function ok(name,fn){try{fn();checks.push({name,result:'passed'});}catch(e){checks.push({name,result:'failed',message:e.message});failures.push(name);}}
const flush=()=>new Promise(resolve=>setTimeout(resolve,15));
function launch(saved=null,denyStorage=false){const errors=[],exports=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(html,{url:'https://handbook.example/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.Blob=Blob;const blobs=new Map();w.URL.createObjectURL=b=>{const u='blob:qa-'+blobs.size;blobs.set(u,b);return u;};w.URL.revokeObjectURL=()=>{};
 const originalClick=w.HTMLAnchorElement.prototype.click;
 w.HTMLAnchorElement.prototype.click=function(){if(this.download){exports.push({name:this.download,blob:blobs.get(this.href)});}else originalClick.call(this);};
 if(denyStorage)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Storage denied','SecurityError');}});
 else if(saved!==null)w.localStorage.setItem('ppo-myob-handbook-r01-review-v1',saved);
}});return {dom,w:dom.window,d:dom.window.document,errors,exports};}
const env=launch(),{w,d}=env;
const click=s=>{const el=d.querySelector(s);assert(el,s);el.click();return el;};
const change=(s,v)=>{const el=d.querySelector(s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
async function go(hash){w.location.hash=hash;await flush();}
function select(id,option){click('#'+id);const o=[...d.querySelectorAll('#picker [data-option]')].find(e=>e.dataset.option===option);assert(o,option);o.click();}
function mark(id,on=true){const c=d.getElementById('review-'+id);c.checked=on;c.dispatchEvent(new w.Event('change',{bubbles:true}));}
async function importReview(raw){const f=d.getElementById('import-file');Object.defineProperty(f,'files',{configurable:true,value:[{size:raw.length,text:async()=>raw}]});f.dispatchEvent(new w.Event('change'));await flush();}

ok('All ten sections plus overview render without script errors',()=>{assert.equal(d.querySelectorAll('.view').length,11);assert.deepEqual(env.errors,[]);});
ok('All IDs unique and internal static anchors resolve',()=>{const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size);for(const a of d.querySelectorAll('a[href^="#"]')){const h=a.hash.slice(1);assert(d.getElementById(h)||d.getElementById('view-'+h)||h.startsWith('mapping-'));}});
ok('All tenant mappings remain proposed with no invented evidence',()=>{assert.equal(data.mappings.length,60);for(const m of data.mappings){assert.equal(m.evidence_status,'Proposed');assert.equal(m.api_entity_path,null);assert.equal(m.myob_observed_screen,null);assert.equal(m.evidence_ref,null);assert.equal(m.approved_by,null);}});
ok('Every source and workflow mapping reference resolves',()=>{const maps=new Set(data.mappings.map(m=>m.id)),src=new Set(data.sources.map(s=>s.id));for(const m of data.mappings)for(const id of m.source_ids)assert(src.has(id));for(const f of data.workflows)for(const id of f.mapping_ids)assert(maps.has(id));for(const r of data.relationships)assert(maps.has(r[3]));});
ok('Actual MYOB acceptance states are all Not run',()=>{assert.equal(data.tests.length,24);assert(data.tests.every(t=>t.status==='Not run'&&t.evidence_ref===null));});
ok('Artifact has no external embedded assets or callable connections',()=>{assert(!d.querySelector('script[src],link[rel=stylesheet],iframe,form'));for(const el of d.querySelectorAll('img[src]'))assert(el.src.startsWith('data:'));assert(d.querySelector('[http-equiv="Content-Security-Policy"]').content.includes("connect-src 'none'"));});
await go('mappings');
ok('Route opens mapping register and marks active navigation',()=>{assert(!d.getElementById('view-mappings').hidden);assert.equal(d.querySelector('#navigation [aria-current=page]').dataset.nav,'mappings');});
ok('Desktop rows and mobile cards show identical 60 IDs',()=>{assert.deepEqual([...d.querySelectorAll('[data-map-row]')].map(e=>e.dataset.mapRow),[...d.querySelectorAll('[data-map-card]')].map(e=>e.dataset.mapCard));assert.equal(d.querySelectorAll('[data-map-row]').length,60);});
change('#mapping-search','MYOB-031');
ok('Reference search selects the exact equipment mapping',()=>{assert.equal(d.querySelectorAll('[data-map-row]').length,1);assert.equal(d.querySelector('[data-map-row]').dataset.mapRow,'MYOB-031');});
click('[data-map="MYOB-031"]');
ok('Mapping detail retains the selected identity and unverified API status',()=>{assert(d.getElementById('detail').open);assert(d.getElementById('detail-title').textContent.includes('Installed asset identity'));assert(d.getElementById('detail-body').textContent.includes('Not verified'));});
click('#detail-export');await flush();
const single=await env.exports.at(-1).blob.text();
ok('Single mapping export includes all columns and exactly the selected row',()=>{assert(single.includes('"api_entity_path"'));assert(single.includes('"MYOB-031"'));assert(!single.includes('"MYOB-030"'));assert.equal(single.trim().split('\r\n').length,2);});
click('#close-detail');
ok('Close detail returns DOM focus to its invoking control',()=>{assert(!d.getElementById('detail').open);assert.equal(d.activeElement.dataset.map,'MYOB-031');});
click('#reset-filters');select('module-filter','Finance');
ok('Module filter combines with the shared dataset',()=>{const expected=data.mappings.filter(m=>m.module==='Finance');assert.equal(d.querySelectorAll('[data-map-row]').length,expected.length);assert.equal(d.getElementById('module-filter').getAttribute('aria-expanded'),'false');});
change('#mapping-search','unapplied');
ok('Search combines with module filter',()=>{assert.equal(d.querySelectorAll('[data-map-row]').length,1);assert.equal(d.querySelector('[data-map-row]').dataset.mapRow,'MYOB-053');});
click('#export-filtered');await flush();const matched=await env.exports.at(-1).blob.text();
ok('Matching CSV contains the filtered subset only',()=>{assert.equal(matched.trim().split('\r\n').length,2);assert(matched.includes('MYOB-053'));});
click('#export-all');await flush();const all=await env.exports.at(-1).blob.text();
ok('All CSV ignores active filters and preserves blank verified API fields',()=>{assert.equal(all.trim().split('\r\n').length,61);assert(all.includes('"MYOB-001"')&&all.includes('"MYOB-060"'));});
select('status-filter','Approved');
ok('Unverified edition has a useful zero-match state for Approved',()=>{assert.equal(d.querySelectorAll('[data-map-row]').length,0);assert(d.getElementById('mapping-results').textContent.includes('None has been observed'));});
click('[data-clear-filters]');
ok('Clear filters restores all mappings and defaults',()=>{assert.equal(d.querySelectorAll('[data-map-row]').length,60);assert.equal(d.getElementById('mapping-search').value,'');assert.equal(d.getElementById('status-filter-value').textContent,'All statuses');});
select('authority-filter','Unresolved');
ok('Authority filter is independent and precise',()=>assert.equal(d.querySelectorAll('[data-map-row]').length,data.mappings.filter(m=>m.authority==='Unresolved').length));
select('sort-filter','Field name');
ok('Sort changes order without changing membership',()=>{const expected=data.mappings.filter(m=>m.authority==='Unresolved').sort((a,b)=>a.field_family.localeCompare(b.field_family,'en-AU')).map(m=>m.id);assert.deepEqual([...d.querySelectorAll('[data-map-row]')].map(e=>e.dataset.mapRow),expected);});
click('#module-filter');d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
ok('Picker keyboard End reaches the last option',()=>{assert.equal(d.activeElement,d.querySelector('#picker [role=option]:last-child'));});
d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
ok('Picker Escape closes and restores DOM focus',()=>{assert(d.getElementById('picker').hidden);assert.equal(d.activeElement.id,'module-filter');});
await go('workflows');click('[data-workflow="J-05"]');
ok('Warranty journey shows its own context and linked mappings',()=>{assert(!d.getElementById('workflow-J-05').hidden);assert(d.getElementById('workflow-J-01').hidden);assert(d.getElementById('workflow-J-05').textContent.includes('supplier recovery'));});
click('#workflow-J-05 a[href="#mapping-MYOB-033"]');await flush();
ok('Workflow mapping link opens correct mapping even with prior filters',()=>{assert(d.getElementById('detail').open);assert(d.getElementById('detail-reference').textContent.includes('MYOB-033'));assert(d.getElementById('detail-title').textContent.includes('Warranty'));});
click('#close-detail');await go('PROC-06');
ok('Procedure deep link opens recovery procedure',()=>{assert(!d.getElementById('view-procedures').hidden);assert(d.getElementById('PROC-06').open);});
mark('PROC-06-1');
ok('Review marks update count and save only local review data',()=>{assert.equal(d.getElementById('review-count').textContent,'1 / 32 reviewed');const p=JSON.parse(w.localStorage.getItem('ppo-myob-handbook-r01-review-v1'));assert.deepEqual(p.reviewed_step_ids,['PROC-06-1']);assert(!Object.hasOwn(p,'mappings'));});
const restored=launch(w.localStorage.getItem('ppo-myob-handbook-r01-review-v1'));
ok('Review marks survive a document restart',()=>{assert(restored.d.getElementById('review-PROC-06-1').checked);assert(restored.d.getElementById('save-status').textContent.includes('restored'));});restored.dom.window.close();
click('#export-review-procedures');await flush();const review=JSON.parse(await env.exports.at(-1).blob.text());
ok('Review export is bounded to edition and reviewed steps',()=>{assert.equal(review.document_id,'PPO-002-MYOB-HB');assert.deepEqual(review.reviewed_step_ids,['PROC-06-1']);assert.deepEqual(Object.keys(review).sort(),['document_id','exported_at','revision','reviewed_step_ids','schema_version'].sort());});
await importReview(JSON.stringify({...review,reviewed_step_ids:['PROC-01-1','PROC-02-1']}));
ok('Valid review import replaces marks without changing evidence',()=>{assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed');assert(!d.getElementById('review-PROC-06-1').checked);assert(JSON.parse(d.getElementById('handbook-data').textContent).mappings.every(m=>m.evidence_status==='Proposed'));});
await importReview(JSON.stringify({...review,revision:'r02'}));
ok('Wrong revision import preserves current marks',()=>assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed'));
await importReview(JSON.stringify({...review,reviewed_step_ids:['PROC-99-1']}));
ok('Unknown step import preserves current marks',()=>assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed'));
await importReview(JSON.stringify({...review,reviewed_step_ids:['PROC-01-1','PROC-01-1']}));
ok('Duplicate step import preserves current marks',()=>assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed'));
await importReview(JSON.stringify({...review,approved:true}));
ok('Extra approval property is rejected',()=>{assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed');assert(d.getElementById('toast').textContent.includes('incompatible'));});
await importReview('{invalid');
ok('Malformed JSON preserves marks and explains failure',()=>{assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed');assert(d.getElementById('toast').textContent.includes('not valid JSON'));});
click('#reset-review');click('#cancel-reset');
ok('Cancelling reset retains review marks',()=>assert.equal(d.getElementById('review-count').textContent,'2 / 32 reviewed'));
click('#reset-review');click('#confirm-reset');
ok('Confirmed reset clears only this handbook key',()=>assert.equal(d.getElementById('review-count').textContent,'0 / 32 reviewed'));
const denied=launch(null,true);const dc=denied.d.getElementById('review-PROC-01-1');dc.checked=true;dc.dispatchEvent(new denied.w.Event('change',{bubbles:true}));
ok('Blocked storage retains session marks with a truthful status',()=>{assert.equal(denied.d.getElementById('review-count').textContent,'1 / 32 reviewed');assert(denied.d.getElementById('save-status').textContent.includes('session-only'));});denied.dom.window.close();
const broken=launch('incompatible bytes');const bc=broken.d.getElementById('review-PROC-01-1');bc.checked=true;bc.dispatchEvent(new broken.w.Event('change',{bubbles:true}));
ok('Incompatible saved bytes are not overwritten',()=>{assert.equal(broken.w.localStorage.getItem('ppo-myob-handbook-r01-review-v1'),'incompatible bytes');assert(broken.d.getElementById('save-status').textContent.includes('preserved'));});broken.dom.window.close();
await go('mappings');change('#mapping-search','MYOB-031');click('#reset-filters');change('#mapping-search','MYOB-031');w.dispatchEvent(new w.Event('beforeprint'));
ok('Print preparation includes all mappings and procedures',()=>{assert.equal(d.querySelectorAll('[data-map-row]').length,60);assert([...d.querySelectorAll('.procedure')].every(x=>x.open));});
w.dispatchEvent(new w.Event('afterprint'));
ok('After print restores filtered view',()=>assert.equal(d.querySelectorAll('[data-map-row]').length,1));
ok('All external reference links use an explicit safe new tab',()=>{for(const a of d.querySelectorAll('a[href^="https:"]')){assert.equal(a.target,'_blank');assert(a.rel.includes('noopener'));}});
ok('No script errors after all interaction scenarios',()=>assert.deepEqual(env.errors,[]));
env.dom.window.close();
const evidence={document_id:'PPO-002-MYOB-HB',revision:'r01',generated_at:new Date().toISOString(),source_commit:data.meta.source_commit,html_sha256:crypto.createHash('sha256').update(html).digest('hex'),theme_sha256:data.meta.theme_sha256,environment:{node:process.version,dom_engine:'jsdom',native_browser:false,dialog_and_scroll:'Inert DOM adapters; not native browser behaviour'},checks,passed:checks.filter(c=>c.result==='passed').length,failed:failures.length,limitations:['Native browser navigation to synchronised local HTML was rejected by the Browser URL security policy.','No visual geometry, native focus trap, real download or printed-pagination acceptance is claimed.','All 24 MYOB acceptance cases remain Not run; no live tenant or endpoint was accessed.']};
await fs.mkdir(path.dirname(evidencePath),{recursive:true});await fs.writeFile(evidencePath,JSON.stringify(evidence,null,2)+'\n');console.log(`${evidence.passed}/${checks.length} DOM/document checks passed; ${failures.length} failed.`);if(failures.length){console.log(checks.filter(c=>c.result==='failed'));process.exitCode=1;}
