import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root=process.cwd();
const source=resolve(root,'docs/blueprints/customer-portal-mockup.html');
const output=resolve(root,process.env.PPO_PORTAL_EVIDENCE||'verification-evidence/customer-portal-design');
await mkdir(output,{recursive:true});
const hash=data=>createHash('sha256').update(data).digest('hex');
const report={scope:'Standalone synthetic design only; no runtime authorisation, persistence or CPA acceptance',source_head:process.env.PPO_SOURCE_HEAD||'local-working-tree',source_sha256:hash(await readFile(source)),node:process.version,viewports:[],captures:[],checks:[]};
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:800}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await context.newPage();const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
  page.on('dialog',d=>d.accept());
  await page.goto(pathToFileURL(source).href);await page.evaluate(()=>document.fonts.ready);
  const capture=async name=>{const path=resolve(output,`${viewport.width}-${name}-r01.png`);await page.screenshot({path,fullPage:true});report.captures.push({file:path.split('/').at(-1),sha256:hash(await readFile(path)),viewport});};
  const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Outer page overflow');
  const nav=async next=>{if(viewport.width<=760)await page.locator('#mobile-view').selectOption(next);else await page.locator(`.nav-item[data-view="${next}"]`).click();await fit()};
  await fit();const logo=await page.locator('.logo').boundingBox();assert.equal(logo.width,88);assert.equal(logo.height,88);assert.equal(await page.locator('.logo').evaluate(e=>e.naturalWidth),1254);
  await capture('overview');
  await nav('support');await page.locator('#support-search').fill('no matching synthetic record');assert.equal(await page.getByRole('heading',{name:'No matching requests'}).count(),1);await page.locator('#empty-clear').click();assert.equal(await page.locator('[data-ticket]').count(),2);
  await page.locator('#support-search').fill('SYN-PPO-TKT-000014');assert.equal(await page.locator('[data-ticket]').count(),1);await page.locator('#clear-search').click();
  await page.locator('[data-new]').first().click();await page.locator('#request-description').fill('Retained fictional description.');await page.getByRole('button',{name:'Submit example request'}).click();assert.equal(await page.locator('#request-summary').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#request-description').inputValue(),'Retained fictional description.');assert.equal(await page.locator('#request-dialog').isVisible(),true);await page.locator('#request-summary').fill('Synthetic equipment inquiry');await page.locator('#request-equipment').selectOption('Equipment not identified');await page.getByRole('button',{name:'Submit example request'}).click();assert.equal(await page.locator('#unknown-context').getAttribute('aria-invalid'),'true');await page.locator('#unknown-context').fill('The fictional unit is beside the north entrance.');await capture('request-form');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#request-dialog').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-new')),true);await page.locator('[data-new]').first().click();assert.equal(await page.locator('#request-summary').inputValue(),'Synthetic equipment inquiry');await page.getByRole('button',{name:'Submit example request'}).click();assert.equal(await page.locator('h1').textContent(),'Synthetic equipment inquiry');assert.match(await page.locator('#announcement').textContent(),/Nothing was sent or saved/);await page.getByRole('button',{name:'Add example reply'}).click();assert.equal(await page.locator('#reply-error').isVisible(),true);await page.locator('#reply').fill('<script>fictional text</script>');await page.getByRole('button',{name:'Add example reply'}).click();assert.match(await page.locator('.message').last().textContent(),/<script>fictional text<\/script>/);assert.equal(await page.locator('.message script').count(),0);await fit();await capture('conversation');
  await page.reload();await page.evaluate(()=>document.fonts.ready);await nav('support');assert.equal(await page.locator('[data-ticket]').count(),2);
  await nav('projects');assert.match(await page.locator('#content').textContent(),/Forecast finish 18 Sep/);assert.match(await page.locator('#content').textContent(),/Date to be confirmed/);await capture('project');
  await nav('equipment');await page.locator('#open-report').click();assert.equal(await page.locator('#report-dialog').isVisible(),true);assert.match(await page.locator('#report-dialog').textContent(),/r01/);await page.keyboard.press('Escape');assert.equal(await page.locator('#open-report').evaluate(e=>e===document.activeElement),true);
  await nav('knowledge');await page.locator('#knowledge-search').fill('unknown product');assert.equal(await page.getByRole('heading',{name:'No matching guides'}).count(),1);await page.locator('#clear-knowledge').click();await page.locator('[data-article="request"]').click();assert.match(await page.locator('#content').textContent(),/Original PPO design content/);await capture('article');
  await page.locator('#scenario').selectOption('empty');assert.equal(await page.getByRole('heading',{name:'No support requests'}).count(),1);await page.locator('#scenario').selectOption('unavailable');assert.equal(await page.getByRole('heading',{name:'Your request status could not be checked'}).count(),1);assert.equal(await page.locator('[data-ticket]').count(),0);await page.locator('#retry').click();assert.equal(await page.locator('[data-ticket]').count(),2);
  await page.locator('#scenario').selectOption('denied');assert.doesNotMatch(await page.locator('body').innerText(),/Greenhaven|Sam Taylor|North propagation|SYN-PPO-TKT/);await capture('access-changed');await page.locator('#scenario').selectOption('ready');
  await page.locator('[data-new]').first().click();await page.locator('#request-summary').fill('Long'.repeat(50));await page.locator('#request-description').fill('Long synthetic detail '.repeat(60));await page.getByRole('button',{name:'Submit example request'}).click();await fit();
  assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report.viewports.push(viewport);await context.close();
 }
 report.checks=['Five-view navigation','Three-width page reflow and full logo','Scoped-design search and no-results recovery','Required and unknown-context validation','Retained form and Escape focus return','Temporary request/reply and explicit unsaved status','Plain-text rendering of markup','Reload resets mutations','Forecast and unknown-date distinction','Report illustration and focus return','Knowledge search/source/applicability','Empty versus unavailable versus access changed','Long title/description reflow','No browser storage, external requests or page errors'];report.result='passed';
}catch(e){report.result='failed';report.error=e.stack;throw e;}finally{await browser.close();await writeFile(resolve(output,'design-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,viewports:report.viewports.length,captures:report.captures.length,output}));}
