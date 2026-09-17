/* New recovery browser suite, 17 September 2026. Exercises the supplied HTML
   through visible controls; historical evidence remains separately retained. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'docs/reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist.html');
const out=path.join(root,'verification-evidence/sales-aftercare-recovery');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
const page=await context.newPage(),results=[],errors=[],images=[];
page.setDefaultTimeout(10000);
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('dialog',d=>d.accept());
const action=(name,suffix='')=>page.locator(`[data-action="${name}"]${suffix}:visible`).first();
const nav=async name=>{await page.locator(`#tabs [data-view="${name}"]`).click();await page.waitForFunction(v=>globalThis.AC_DEMO.ui().view===v,name);};
const state=()=>page.evaluate(()=>globalThis.AC_DEMO.state());
const record=async(id='ac-901')=>(await state()).records.find(r=>r.id===id);
const submit=async()=>{await page.locator('#modal-submit').click();await page.locator('#modal').waitFor({state:'hidden'});};
const close=async()=>{await page.locator('#cancel-button').click();await page.locator('#modal').waitFor({state:'hidden'});};
const fresh=async()=>{await page.evaluate(()=>localStorage.removeItem('ppo-sales-aftercare-r01'));await page.reload();await page.waitForFunction(()=>!!globalThis.AC_DEMO);};
const check=async(name,fn)=>{await fn();results.push({name,result:'Passed'});};
const snap=async name=>{const p=path.join(out,name);await page.screenshot({path:p,fullPage:true});images.push({name,sha256:createHash('sha256').update(await fs.readFile(p)).digest('hex')});};
const options=async values=>{await action('options').click();for(const [key,value]of Object.entries(values))await page.locator('#f-'+key).selectOption(value);await submit();};
const plan=async()=>{await nav('worklist');await action('openRecord','[data-id="ac-901"]').click();await action('plan').click();};
const training=async name=>{await nav('training');await action('openTraining','[data-item="tr-905-1"]').click();await action(name).click();};
let passed=false;
try{
  await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>!!globalThis.AC_DEMO);
  await check('Five views, six synthetic records and explicit source/date context render',async()=>{
    assert.equal(await page.locator('#tabs button').count(),5);assert.equal((await state()).records.length,6);
    assert.match(await page.locator('#content').innerText(),/Date needed/);await snap('desktop-worklist.png');
  });
  await check('Search and clear controls update the actual visible rows',async()=>{
    await page.getByLabel('Search aftercare records',{exact:true}).fill('Fernbank');
    await page.waitForFunction(()=>document.querySelectorAll('.queue-table tbody tr').length===1);
    assert.match(await page.locator('.queue-table tbody').innerText(),/Fernbank/);
    await page.getByLabel('Search aftercare records',{exact:true}).fill('no matching customer');
    await page.getByText('No matching aftercare records',{exact:true}).waitFor();
    await action('clear').click();await page.waitForFunction(()=>document.querySelectorAll('.queue-table tbody tr').length===6);
  });
  await check('A sourced review date refuses missing provenance and preserves the form',async()=>{
    const before=await state();await plan();await page.locator('#f-basis').selectOption('Sourced rule');
    await page.locator('#f-sourceRef').fill('');await page.locator('#f-ruleRevision').fill('');
    await page.locator('#f-planned').fill('2026-09-24');await page.locator('#f-detail').fill('A sourced review interval needs its exact source and revision.');
    await page.locator('#modal-submit').click();await page.locator('#modal-error').waitFor({state:'visible'});
    assert.match(await page.locator('#modal-error').innerText(),/Source reference/);assert.deepEqual(await state(),before);
    assert.equal(await page.locator('#f-planned').inputValue(),'2026-09-24');await close();
  });
  await check('Review completion refuses outstanding commitments after draft and feedback entry',async()=>{
    await nav('review');await action('saveReview').click();await page.locator('#f-benefits').fill('Customer reports that daily operation is easier.');await submit();
    await action('feedback').click();await page.locator('#f-speaker').fill('Casey Taylor');await page.locator('#f-text').fill('The equipment is easier for our team to use.');await submit();
    await action('completeReview').click();await page.locator('#f-summary').fill('Review conducted with customer feedback and follow-up.');
    const before=await state();await page.locator('#modal-submit').click();await page.locator('#modal-error').waitFor({state:'visible'});
    assert.match(await page.locator('#modal-error').innerText(),/commitment/);assert.deepEqual(await state(),before);await close();
  });
  await check('Disposition and completion retain open obligations and independent outcomes through reload',async()=>{
    const outcomes=(await record()).outcomes;
    for(const c of (await record()).commitments){
      await action('commitment',`[data-item="${c.id}"]`).click();await page.locator('#f-note').fill('Assigned to a separate owned follow-up action.');await page.locator('#f-due').fill('2026-09-24');await submit();
    }
    await action('completeReview').click();await page.locator('#f-summary').fill('Customer review completed with remaining actions assigned.');await submit();
    const r=await record();assert.equal(r.review.state,'Completed');assert.ok(r.obligations.some(x=>x.state==='Open'));
    for(const key of Object.keys(outcomes))if(key!=='aftercareReview')assert.deepEqual(r.outcomes[key],outcomes[key]);
    await page.reload();await page.waitForFunction(()=>globalThis.AC_DEMO?.state().records.find(r=>r.id==='ac-901').review.state==='Completed');await snap('desktop-review-completed.png');
  });
  await check('A correction appends detail without replacing original customer feedback',async()=>{
    const before=(await record()).review;await action('correctReview').click();await page.locator('#f-reason').fill('Customer clarified the seasonal timing after the review.');await page.locator('#f-text').fill('The proposed area is planned for next season.');await submit();
    const after=(await record()).review;assert.deepEqual(after.feedback,before.feedback);assert.equal(after.corrections.length,before.corrections.length+1);
  });
  await check('Training has distinct confirmed, attended, delivered and assessed states',async()=>{
    await fresh();await training('confirmTraining');await page.locator('#f-note').fill('Customer confirmed the proposed training arrangement.');await page.locator('input[name="acknowledge"]').check();await submit();
    let t=(await record('ac-905')).training[0];assert.equal(t.arrangement,'Confirmed');assert.equal(t.attendance.length,0);
    await training('attendance');await page.locator('#f-other').fill('Casey Taylor');await submit();assert.equal((await record('ac-905')).training[0].delivered,false);
    await training('deliverTraining');await page.locator('#f-evidence').fill('Trainer recorded the operating steps demonstrated.');await submit();
    t=(await record('ac-905')).training[0];assert.equal(t.delivered,true);assert.equal(t.assessment,'Not assessed');
    await training('assessTraining');await page.locator('#f-basis').fill('Observed a practical demonstration; technical authority is separate.');await submit();
    assert.equal((await record('ac-905')).training[0].assessment,'Assessed · met the stated outcome');
  });
  await check('Restricted training role cannot list, filter or search the other customer',async()=>{
    await fresh();await options({role:'training'});await nav('worklist');
    assert.doesNotMatch(await page.locator('#f-filter-customer').innerText(),/Fernbank/);
    await page.getByLabel('Search aftercare records',{exact:true}).fill('Fernbank');await page.getByText('No matching aftercare records',{exact:true}).waitFor();
    assert.equal(await page.locator('.queue-table tbody tr').count(),0);
  });
  await check('Failed save retains the entered date and creates no partial state',async()=>{
    await fresh();await options({failure:'fail'});await plan();await page.locator('#f-basis').selectOption('User choice');await page.locator('#f-planned').fill('2026-09-25');await page.locator('#f-detail').fill('Customer explicitly requested this review date.');
    const before=await state();await page.locator('#modal-submit').click();await page.locator('#modal-error').waitFor({state:'visible'});assert.match(await page.locator('#modal-error').innerText(),/Simulated save failure/);assert.deepEqual(await state(),before);
    assert.equal(await page.locator('#f-planned').inputValue(),'2026-09-25');await submit();assert.equal((await record()).planned,'2026-09-25');
  });
  await check('Lost save response recovers the original operation without another change',async()=>{
    await fresh();await options({failure:'unknown'});await plan();await page.locator('#f-basis').selectOption('User choice');await page.locator('#f-planned').fill('2026-09-26');await page.locator('#f-detail').fill('Customer requested the later review date explicitly.');await submit();
    await action('recover').waitFor();const before=await state();await action('recover').click();await page.locator('[data-action="recover"]').waitFor({state:'hidden'});assert.deepEqual(await state(),before);
  });
  await check('Partial, failed and empty reads disclose uncertainty and preserve records',async()=>{
    await fresh();const before=await state();
    for(const mode of ['partial','failed','empty']){await options({mode});assert.deepEqual(await state(),before);assert.match(await page.locator('#content').innerText(),mode==='partial'?/Partial|partial/:mode==='failed'?/unavailable|could not be loaded/:/No matching/);}
    await options({mode:'complete'});assert.equal(await page.locator('.queue-table tbody tr').count(),6);
  });
  await check('Export and restore validate records and restart in a read-only role',async()=>{
    await action('options').click();const downloading=page.waitForEvent('download');await action('export').click();const download=await downloading;
    const data=await fs.readFile(await download.path()),saved=JSON.parse(data.toString());assert.deepEqual(saved.state,await state());
    await action('restore').click();await page.locator('#f-file').setInputFiles({name:'aftercare-session.json',mimeType:'application/json',buffer:data});await page.locator('input[name="confirm"]').check();await submit();
    assert.equal(await page.evaluate(()=>globalThis.AC_DEMO.ui().role),'observer');assert.deepEqual(await state(),saved.state);
    assert.equal(await page.locator('[data-action="plan"]:enabled').count(),0);
  });
  await check('Keyboard view navigation and dialog focus return remain usable',async()=>{
    await fresh();const first=page.locator('#tabs button').first();await first.focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tabs button').nth(1).evaluate(e=>e===document.activeElement),true);
    const guide=action('guide');await guide.click();await close();assert.equal(await guide.evaluate(e=>e===document.activeElement),true);
  });
  await check('All five views fit desktop and phone widths with reachable navigation',async()=>{
    for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:960});
      for(const view of ['worklist','review','training','commercial','history']){await nav(view);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth<=1),`${view} overflows at ${width}`);const box=await page.locator('#tabs button').first().boundingBox();assert.ok(box.height>=44);await snap(`${width}-${view}.png`);}
    }
  });
  await check('Malformed saved content is preserved for export instead of overwritten',async()=>{
    const damaged='{"schema":"invalid","original":"retain me"}';await page.evaluate(value=>localStorage.setItem('ppo-sales-aftercare-r01',value),damaged);await page.reload();await page.getByText('Saved session needs attention',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('ppo-sales-aftercare-r01')),damaged);await action('raw').waitFor();
  });
  assert.deepEqual(errors,[]);passed=true;
}finally{
  const evidence={module:'CR-05',suite:'Recovery browser verification authored 2026-09-17',passed,source:process.env.PPO_SOURCE_HEAD||'local',node:process.version,browser:browser.version(),browser_channel:'chrome',html_sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex'),groups:results.length,results,errors,images};
  await fs.writeFile(path.join(out,'native-results.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));await browser.close();
}
