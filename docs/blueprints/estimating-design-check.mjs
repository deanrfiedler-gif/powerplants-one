// Standalone design check, not PPO application acceptance or CREMS parity.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright'):require('playwright');
const input=resolve('docs/blueprints/estimating-workspace-mockup.html');
const output=resolve(process.env.ESTIMATING_DESIGN_OUTPUT||'verification-evidence/estimating-design');
await mkdir(output,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={scope:'Standalone synthetic design preview only; not runtime, source parity or owner acceptance',input:'docs/blueprints/estimating-workspace-mockup.html',input_sha256:hash(await readFile(input)),checked_at:new Date().toISOString(),source_head:process.env.PPO_SOURCE_HEAD||null,viewports:[],captures:[],assertions:[],result:'in progress'};
const browser=await chromium.launch({headless:true});report.browser=await browser.version();
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();let errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto(pathToFileURL(input).href);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('#cost-total').textContent(),'$440.00');assert.equal(await page.locator('#sell-total').textContent(),'$670.00');
  assert.equal(await page.locator('#margin').textContent(),'34.33%');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,JSON.stringify(viewport));
  const logo=await page.locator('.rail .logo').boundingBox();assert.equal(Math.round(logo.width),88);assert.equal(Math.round(logo.height),88);
  const capture=async name=>{const path=resolve(output,name);await page.screenshot({path,fullPage:true});report.captures.push({file:name,viewport,sha256:hash(await readFile(path)),input_sha256:report.input_sha256});};
  await capture(viewport.width===1440?'desktop-costing-r01.png':`phone-${viewport.width}-costing-r01.png`);
  await page.locator('#line-search').fill('no matching fictional part');assert.equal(await page.locator('#empty-lines').isVisible(),true);await page.getByRole('button',{name:'Clear search',exact:true}).click();
  const edit=page.getByRole('button',{name:'Edit Demonstration control module'});const visibleEdit=viewport.width>780?edit.first():edit.last();
  await visibleEdit.click();await page.locator('#quantity').fill('0');await page.getByRole('button',{name:'Apply to preview'}).click();assert.equal(await page.locator('#quantity-error').isVisible(),true);assert.equal(await page.locator('#quantity').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#edit-dialog').isVisible(),true);
  await page.locator('#quantity').fill('3');await page.getByRole('button',{name:'Apply to preview'}).click();assert.equal(await page.locator('#cost-total').textContent(),'$540.00');assert.equal(await page.locator('#sell-total').textContent(),'$820.00');assert.match(await page.locator('#preview-state').textContent(),/not saved/);
  await (viewport.width>780?edit.first():edit.last()).click();await page.keyboard.press('Escape');assert.equal(await page.locator('#edit-dialog').isVisible(),false);
  await page.reload();await page.evaluate(()=>document.fonts.ready);assert.equal(await page.locator('#sell-total').textContent(),'$670.00');
  await page.getByRole('tab',{name:'Quotation',exact:true}).click();
  if(viewport.width<=780)await page.locator('#choices summary').click();
  await page.locator('[data-id="labour"][data-choice="print"]').uncheck();assert.equal(await page.locator('#quote-total').textContent(),'$670.00');assert.match(await page.locator('#quote-rows').textContent(),/Included scope allowance/);assert.doesNotMatch(await page.locator('#quote-rows').textContent(),/Setup assistance/);
  await page.locator('[data-id="labour"][data-choice="included"]').uncheck();assert.equal(await page.locator('#quote-total').textContent(),'$350.00');assert.doesNotMatch(await page.locator('#quote-rows').textContent(),/Included scope allowance/);
  await page.getByRole('button',{name:'Reset line choices'}).click();
  const safe=await page.locator('#customer-preview').textContent();assert.doesNotMatch(safe,/unit cost|margin|markup|supplier|\$440\.00|\$230\.00/i);assert.match(safe,/DRAFT — NOT ISSUED/);
  if(viewport.width<=780)await page.locator('#choices summary').click();
  await capture(viewport.width===1440?'desktop-quotation-r01.png':`phone-${viewport.width}-quotation-r01.png`);
  await page.getByRole('tab',{name:'Costing',exact:true}).click();
  for(const state of ['conflict','unknown','stale']){await page.locator('#design-state').selectOption(state);assert.equal(await page.locator('#state-message').isVisible(),true);assert.equal(await (viewport.width>780?edit.first():edit.last()).isDisabled(),true);}
  if(viewport.width===1440)await capture('desktop-stale-totals-r01.png');
  await page.locator('#design-state').selectOption('denied');assert.equal(await page.locator('#sensitive-content').isVisible(),false);assert.doesNotMatch(await page.locator('#record-title').textContent(),/Control module/);
  await page.locator('#design-state').selectOption('loading');assert.equal(await page.locator('#no-data-title').textContent(),'Loading…');
  await page.locator('#design-state').selectOption('ready');
  await page.locator('#tab-costing').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-scope').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#panel-scope').isVisible(),true);
  await page.getByRole('tab',{name:'History',exact:true}).click();assert.match(await page.locator('#panel-history').textContent(),/Illustration only/);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  report.viewports.push(viewport);await context.close();
 }
 report.assertions=['base totals and margin','contained page at three widths','unchanged full logo geometry','no-results recovery','invalid quantity retains form','preview quantity update and reload reset','dialog Escape','include/print financial distinction','customer preview excludes internal fields','recovery state visibility and disabled editing','denied/loading state separation','keyboard tabs','no console errors or external requests'];
 report.result='passed';
}catch(e){report.result='failed';report.error=e.stack;throw e;}finally{await browser.close();await writeFile(resolve(output,'design-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,viewports:report.viewports.length,captures:report.captures.length,output,scope:report.scope}));}
