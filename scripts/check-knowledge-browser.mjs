/* Native review harness for an environment with the repository's pinned browser.
   This script is supplied for follow-through; see the evidence record for actual runs. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'docs/reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html');
const out=path.join(root,'verification-evidence/knowledge');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
const check=async(name,fn)=>{await fn();results.push({name,result:'Passed'});};
try{
 await page.goto(pathToFileURL(file).href);
 await check('Search, filter and no-result recovery',async()=>{assert.equal(await page.locator('[data-record]').count(),7);await page.getByRole('searchbox',{name:'Search knowledge'}).fill('unknown-symptom');assert(await page.getByText('No matching articles',{exact:true}).isVisible());await page.getByRole('button',{name:'Clear filters',exact:true}).click();await page.screenshot({path:path.join(out,'desktop-search.png'),fullPage:true});});
 await check('Snapshot, full article and exact revision route',async()=>{await page.locator('[data-snapshot="SYN-PPO-KA-000001"]').click();await page.screenshot({path:path.join(out,'desktop-snapshot.png')});await page.getByRole('button',{name:'Open full article'}).click();assert(page.url().includes('revision=r03'));await page.screenshot({path:path.join(out,'desktop-article.png'),fullPage:true});});
 await check('Firmware mismatch updates source and article warnings',async()=>{await page.getByRole('button',{name:'Change context'}).click();await page.locator('[name="context"]').selectOption('upgrade');await page.getByRole('button',{name:'Apply context'}).click();assert(await page.getByText('Outside scope',{exact:true}).first().isVisible());await page.getByRole('button',{name:'Sources & evidence',exact:true}).click();await page.getByText('Compare this source with the selected context').click();assert(await page.getByRole('cell',{name:'2.5.0',exact:true}).isVisible());await page.screenshot({path:path.join(out,'desktop-sources.png'),fullPage:true});});
 await check('Saved exact article survives reload without status promotion',async()=>{await page.getByRole('button',{name:'Save article',exact:true}).click();await page.reload();assert(await page.getByRole('button',{name:'Saved article',exact:true}).isVisible());assert(await page.getByText('Outside scope',{exact:true}).first().isVisible());});
 await check('Owned request retains revision and context without validation',async()=>{await page.getByRole('button',{name:'Raise review request',exact:true}).click();await page.locator('[name="note"]').fill('Synthetic browser review: confirm firmware source scope.');await page.getByRole('button',{name:'Save local request'}).click();await page.getByRole('button',{name:'History',exact:true}).click();assert(await page.getByText('Awaiting review',{exact:true}).isVisible());});
 await check('Desktop tablet and phone layouts do not overflow the page',async()=>{for(const width of [1440,1024,390,320]){await page.setViewportSize({width,height:900});for(const view of ['search','saved','watch']){await page.locator(`[data-view="${view}"]`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} overflow at ${width}`);}await page.locator('[data-view="search"]').click();await page.locator('[data-open="SYN-PPO-KA-000001"]').click();for(const section of ['guidance','applicability','sources','history']){await page.locator(`[data-section="${section}"]`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${section} overflow at ${width}`);}if(width===390){await page.screenshot({path:path.join(out,'phone-history.png'),fullPage:true});await page.locator('[data-section="guidance"]').click();await page.screenshot({path:path.join(out,'phone-article.png'),fullPage:true});await page.locator('[data-view="search"]').click();await page.screenshot({path:path.join(out,'phone-search.png'),fullPage:true});}}});
 await check('No script errors',async()=>assert.deepEqual(errors,[]));
}finally{await fs.writeFile(path.join(out,'results.json'),JSON.stringify({source:process.env.PPO_SOURCE_HEAD||'local-uncommitted',htmlSha256:createHash('sha256').update(await fs.readFile(file)).digest('hex'),browser:browser.version(),results,errors},null,2));await browser.close();}
console.log(JSON.stringify({groups:results.length,results},null,2));
