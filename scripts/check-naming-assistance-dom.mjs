// Optional event-wiring check. DOM emulation, not browser/layout or native dialog proof.
// Usage: node scripts/check-naming-assistance-dom.mjs /path/to/node_modules/jsdom/lib/api.js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {JSDOM,VirtualConsole}=await import(pathToFileURL(path.resolve(process.argv[2])));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'docs/blueprints/naming-filing-prototype/index.html'),'utf8');
const errors=[],tests=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css parsing')errors.push(e.message);});
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  // jsdom has no native top layer or layout. Stubs exercise our event handlers only.
  const matches=w.Element.prototype.matches;w.Element.prototype.matches=function(s){return s===':popover-open'?!!this._open:matches.call(this,s);};
  w.HTMLElement.prototype.showPopover=function(){this._open=true;};w.HTMLElement.prototype.hidePopover=function(){this._open=false;};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;this.querySelector('button')?.focus();};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
}});
const w=dom.window,d=w.document,$=s=>{const e=d.querySelector(s);assert(e,`Missing ${s}`);return e;};
const click=s=>{const e=$(s);assert(!e.disabled,`Disabled ${s}`);e.click();};
const action=s=>click(`[data-action="${s}"]`);
const input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));};
const select=s=>{const e=$(s);e.checked=true;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const text=s=>$(s).textContent;
const check=(name,fn)=>{fn();assert.deepEqual(errors,[]);tests.push(name);};
const menu=(id,label)=>{click('#'+id);const b=[...d.querySelectorAll('[data-option]')].find(x=>x.querySelector('span').firstChild.textContent===label);assert(b,`Missing option ${label}`);assert(!b.disabled);b.click();};
check('Filing view renders with synthetic notice and work reference',()=>{assert.match(text('h1'),/Naming & filing/);assert.match(text('#main'),/SYN-PPO-WO-000001/);assert.match(text('.notice'),/simulated/);});
check('Editing description updates the proposed filename',()=>{input('#description','controller terminal photo 01');assert.match($('#filename').value,/controller-terminal-photo-01.png$/);});
check('Invalid name is refused in place without false success',()=>{input('#filename','../unsafe.png');action('file-save');assert(text('#page-error'));assert.equal(d.activeElement.id,'page-error');assert(!text('#toast').includes('saved'));});
check('Destination selection and simulated filing preserve context',()=>{input('#description','controller terminal photo 01');action('destination');assert($('#drawer').open);action('destination-use');assert.match(text('#toast'),/No SharePoint folder/);action('file-save');assert.match(text('#toast'),/saved in simulation/);assert.equal(d.activeElement.id,'page-title');});
check('Repeated filing creates no duplicate',()=>{action('file-save');assert.match(text('#toast'),/no duplicate/);});
check('Report preview records simulated issue and prepares report-linked email',()=>{action('report');assert.match(text('#drawer'),/does not generate a real PDF/);action('report-issue');action('report');action('report-email');assert.match($('#email-subject').value,/SYN-PPO-RPT-000001/);action('draft-save');assert.match(text('#toast'),/No Outlook draft/);});
check('Reply preserves subject; Outlook-native save is unavailable',()=>{action('email-mode:reply');const original=$('#email-subject').value;input('#email-description','ignored change');assert.equal($('#email-subject').value,original);assert($('#email-subject').readOnly);action('draft-save');action('email-mode:outlook');assert($('[data-action="draft-save"]').disabled);});
check('Task is created once and notification does not send',()=>{action('task-save');assert.match(text('#toast'),/nothing sent/);action('task-save');assert.match(text('#toast'),/No duplicate/);});
check('Review selection retains DOM focus and updates batch count',()=>{action('nav:review');select('.review-table [data-select="notes"]');assert.equal(d.activeElement.dataset.select,'notes');assert.match(text('#batch-button'),/\(1\)/);});
check('Stale preview is refused and selection retained',()=>{action('review:notes');action('source-change');action('apply:notes');assert.match(text('#dialog-error'),/changed after preview/);assert($('#drawer').open);action('close-dialog');assert.match(text('#batch-button'),/\(1\)/);});
check('Refreshed individual approval clears stale batch selection',()=>{action('review:notes');action('apply:notes');assert.match(text('#toast'),/applied in simulation/);assert.match(text('#batch-button'),/\(0\)/);assert($('#batch-button').disabled);});
check('Original-name search still finds renamed record',()=>{input('#review-search','access notes FINAL');assert.match(text('#review-list'),/site-access-notes/);input('#review-search','');});
check('Protected CAD offers retain with mandatory reason, no rename',()=>{action('review:cad');assert(!d.querySelector('[data-action="apply:cad"]'));action('retain:cad');assert.match(text('#dialog-error'),/Explain/);input('#retain-reason','Preserve assembly references');action('retain:cad');assert.match(text('#toast'),/retained with a recorded reason/);});
check('Lost provider response requires same-operation investigation',()=>{action('review:photo');menu('rename-outcome','Response lost');action('apply:photo');assert.match(text('#toast'),/unconfirmed/);action('review:photo');assert(!d.querySelector('[data-action="apply:photo"]'));action('reconcile:photo');assert.match(text('#toast'),/No repeat operation/);});
check('History contains original names and simulation outcomes',()=>{action('nav:history');assert.match(text('#main'),/access notes FINAL/);assert.match(text('#main'),/Preserve assembly references/);});
check('Reset confirmation restores original fictional state',()=>{action('reset');action('reset-confirm');assert.match(text('h1'),/Naming & filing/);action('nav:review');assert.match(text('#review-list'),/access notes FINAL/);});
check('Batch partial failure reports independent outcomes',()=>{select('.review-table [data-select="notes"]');select('.review-table [data-select="photo"]');action('batch');menu('batch-outcome','Last item unavailable');action('batch-apply');assert.match(text('#toast'),/1 applied, 1 not applied/);assert($('#batch-button').disabled);});
check('Read-only identity disables business action controls',()=>{menu('actor-control','Read-only');action('nav:filing');assert($('[data-action="file-save"]').disabled);assert($('[data-action="report"]').disabled);action('nav:communications');assert($('[data-action="task-save"]').disabled);assert($('[data-action="draft-save"]').disabled);});
check('All six proposed library panels open',()=>{action('nav:libraries');for(let i=0;i<6;i++){action('library:'+i);assert.match(text('#drawer'),/no live library created/);action('close-dialog');}});
check('Menu keyboard traversal and escape restore trigger focus in DOM model',()=>{click('#actor-control');d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.match(d.activeElement.textContent,/Reviewer/);d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.match(d.activeElement.textContent,/Read-only/);d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.activeElement.id,'actor-control');assert.equal($('#actor-control').getAttribute('aria-expanded'),'false');});
check('User-entered markup remains text',()=>{menu('actor-control','Reviewer');action('nav:communications');action('email-mode:new');input('#email-subject','<img src=x onerror=alert(1)>');assert.equal(text('#mail-preview'),'<img src=x onerror=alert(1)>');assert(!$('#mail-preview').querySelector('img'));});
dom.window.close();console.log(JSON.stringify({status:'passed',checks:tests.length,tests,scope:'jsdom 26.1.0 event/DOM emulation with stubbed dialog/popover APIs. No rendered layout, native focus trapping, touch, accessibility tree, browser or provider proof.'},null,2));
