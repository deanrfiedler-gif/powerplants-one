import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? '3101'}`;
const retained = JSON.parse(await readFile(`${process.env.PPO_RESTART_PROOF_DIRECTORY ?? 'tmp/maintenance-restart'}/original.json`, 'utf8'));
const browser = await chromium.launch({channel:'chrome', headless:true});
const context = await browser.newContext({baseURL:origin});
const login = await context.request.post('/api/v1/local-session',{headers:{origin},data:{profile:'coordinator'}});
assert.equal(login.status(),200);
const page = await context.newPage();
await mkdir('tmp/ma-current-layout',{recursive:true});
const measures=[];
try {
  for (const [width,height] of [[1440,960],[1024,768],[390,844],[320,844],[720,480]]) {
    await page.setViewportSize({width,height});
    await page.goto('/'+retained.path);
    const panel=page.locator('details.ma-action').filter({has:page.locator('summary',{hasText:'Assign next case review'})});
    const summary=panel.locator('summary');
    await summary.focus(); await page.keyboard.press('Enter');
    await panel.getByLabel('Next action',{exact:false}).fill('SYN preserved layout and keyboard draft');
    const reason=panel.getByLabel('Reason for this action',{exact:true});
    await reason.focus(); await page.keyboard.press('Tab');
    const focused=await page.locator(':focus').evaluate(e=>({tag:e.tagName,text:e.textContent.trim(),outline:getComputedStyle(e).outlineStyle,outlineWidth:getComputedStyle(e).outlineWidth}));
    assert.equal(focused.text,'Assign next case review');
    await page.keyboard.press('Shift+Tab'); assert.equal(await reason.evaluate(e=>e===document.activeElement),true);
    await summary.focus(); await page.keyboard.press('Space'); assert.equal(await panel.getAttribute('open'),null);
    await page.keyboard.press('Space'); assert.notEqual(await panel.getAttribute('open'),null);
    const sizes=await panel.locator('input,select,textarea,button').evaluateAll(es=>es.map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')||e.name||e.textContent.trim(),height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)})));
    if(width<=720) for(const s of sizes){assert.ok(s.height>=44,JSON.stringify(s));if(s.tag!=='BUTTON')assert.ok(s.font>=16,JSON.stringify(s));}
    const scroll=await page.evaluate(()=>[document.documentElement,document.querySelector('#main'),document.querySelector('.ma-workspace')].filter(Boolean).map(e=>({node:e.id||e.className||e.tagName,client:e.clientWidth,scroll:e.scrollWidth})));
    assert.ok(scroll.every(s=>s.scroll<=s.client+1),JSON.stringify(scroll));
    await reason.scrollIntoViewIfNeeded(); await reason.focus();
    await page.screenshot({path:`tmp/ma-current-layout/warranty-form-${width}.png`});
    measures.push({width,height,focused,sizes,scroll,keyboard:'Enter opens disclosure; Space toggles; Tab and Shift+Tab reach submit/reason; no submission performed'});
  }
  await page.setViewportSize({width:390,height:844});
  for(const path of ['maintenance/agreements','maintenance/coverage','maintenance/plans','maintenance/due','maintenance/renewals','warranty/cases','warranty/supplier-recovery']){
    await page.goto('/'+path);
    const first=page.locator('.ma-register article').first(); await first.waitFor();
    await first.evaluate(e=>e.scrollIntoView({block:'start'}));
    await page.screenshot({path:`tmp/ma-current-layout/${path.replaceAll('/','-')}-cards-390.png`});
  }
  await page.setViewportSize({width:1440,height:960});
  await page.goto('/'+retained.replays[0].path.replace('/prepare-work',''));
  await page.getByText('Completed',{exact:true}).first().waitFor();
  await page.screenshot({path:'tmp/ma-current-layout/completed-due-1440.png',fullPage:true});
  await writeFile('tmp/ma-current-layout/measurements.json',JSON.stringify({implementation:process.env.PPO_PROOF_SOURCE,browser:browser.version(),note:'720 by 480 is the CSS viewport equivalent of 200% reflow at 1440 by 960, not a physical zoom or device claim.',measures},null,2)+'\n');
  console.log('Five viewports passed: keyboard disclosure/focus, no horizontal overflow, phone form font >=16px and controls >=44px.');
} finally {await browser.close();}
