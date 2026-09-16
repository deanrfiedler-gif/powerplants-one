/* Optional local DOM harness. Does not render or replace native browser review.
   Set PPO_JSDOM_PATH to an existing jsdom module; no application dependency is added. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {JSDOM,VirtualConsole}=require(process.env.PPO_JSDOM_PATH||'jsdom');
const html=fs.readFileSync(new URL('../docs/reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html',import.meta.url),'utf8');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet|navigation/.test(e.message))errors.push(e.message);});
function open(hash='',raw=null){return new JSDOM(html,{url:'https://synthetic.invalid/knowledge'+hash,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};if(raw!==null)w.localStorage.setItem('ppo-knowledge-r01',raw);}});}
let dom=open(),w=dom.window,d=w.document;const results=[];
function check(name,fn){fn();results.push({name,result:'Passed'});}
const click=s=>{const n=d.querySelector(s);assert(n,'Missing '+s);n.click();};
const change=(s,v)=>{const n=d.querySelector(s);n.value=v;n.dispatchEvent(new w.Event('change',{bubbles:true}));};
const input=(s,v)=>{const n=d.querySelector(s);n.value=v;n.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=()=>d.querySelector('#modal-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const record=()=>w.KNOWLEDGE_DEMO.state();
check('Initial search shows seven articles and preserves superseded visibility control',()=>{assert.equal(d.querySelectorAll('[data-record]').length,7);assert(!d.querySelector('[data-record="SYN-PPO-KA-000005"]'));});
check('Search and no-result recovery work',()=>{input('#query','no-such-symptom');assert(d.querySelector('#content').textContent.includes('No matching articles'));click('[data-action="clear"]');assert.equal(d.querySelectorAll('[data-record]').length,7);});
check('Contextual metric filters to one current applicable procedure',()=>{click('[data-metric="eligible"]');assert.equal(d.querySelectorAll('[data-record]').length,1);click('[data-action="clear"]');});
check('Snapshot opens exact full article and all sections',()=>{click('[data-snapshot="SYN-PPO-KA-000001"]');assert(d.querySelector('#drawer').open);click('#drawer [data-open]');assert.equal(record().state.article,'SYN-PPO-KA-000001');assert.equal(record().state.revision,'r03');for(const s of ['applicability','sources','history','guidance'])click(`[data-section="${s}"]`);});
check('Bookmarks survive reload without changing article status',()=>{click('[data-save="SYN-PPO-KA-000001"]');const raw=w.localStorage.getItem('ppo-knowledge-r01');const next=open('',raw);assert.equal(next.window.KNOWLEDGE_DEMO.state().saved.length,1);assert.equal(next.window.KNOWLEDGE_DEMO.model.articles[0].state,'Validated procedure');next.window.close();});
check('Changed firmware recalculates warning and source applicability',()=>{click('[data-action="context"]');change('[name="context"]','upgrade');submit();assert(d.querySelector('#content').textContent.includes('Outside scope'));click('[data-section="sources"]');assert(d.querySelector('#content').textContent.includes('2.5.0'));});
check('Review requests retain exact revision context ownership and due date without approval',()=>{click('[data-action="feedback"]');input('[name="note"]','Synthetic observation needs source confirmation.');submit();assert.equal(record().requests.length,1);assert.equal(record().requests[0].context,'upgrade');assert.equal(record().requests[0].revision,'r03');assert.equal(w.KNOWLEDGE_DEMO.model.articles[0].state,'Validated procedure');});
check('Missing-guidance request does not fabricate an article relationship',()=>{click('[data-view="watch"]');click('[data-action="request-general"]');input('[name="note"]','Need a procedure for a different fictional installation.');submit();assert.equal(record().requests[0].article,null);});
check('Save failure retains request and recovers without duplication',()=>{click('[data-action="options"]');change('[name="fault"]','save');submit();click('[data-action="request-general"]');input('[name="note"]','Retain this synthetic request during a save failure.');submit();const count=record().requests.length;assert.equal(record().storage,'failed');click('[data-action="retry-save"]');assert.equal(record().storage,'ok');assert.equal(record().requests.length,count);});
check('Denied scenario hides article identity and context',()=>{click('[data-action="options"]');change('[name="role"]','denied');submit();assert(d.querySelector('#context').hidden);assert(!d.querySelector('#content').textContent.includes('SYN-PPO-KA-'));assert(d.querySelector('#content').textContent.includes('Access unavailable'));});
check('Unsupported exact revision does not silently fall forward',()=>{const other=open('#view=article&article=SYN-PPO-KA-000001&revision=r99');assert(other.window.document.querySelector('#content').textContent.includes('Article unavailable'));other.window.close();});
check('Malformed stored data remains untouched',()=>{const other=open('', '{bad json');assert.equal(other.window.KNOWLEDGE_DEMO.state().storage,'unavailable');other.window.document.querySelector('[data-save]').click();other.window.document.querySelector('[data-action="retry-save"]').click();assert.equal(other.window.localStorage.getItem('ppo-knowledge-r01'),'{bad json');other.window.close();});
check('No script exceptions in exercised local interactions',()=>assert.deepEqual(errors,[]));
w.close();console.log(JSON.stringify({suite:'Knowledge local non-rendered DOM',groups:results.length,results},null,2));
