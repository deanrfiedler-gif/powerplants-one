/* Native browser interaction checks for the Order Fulfilment & Customer Delivery design.
   Prefers the repository's pinned Chrome channel and falls back to the bundled Chromium,
   recording which browser actually ran. Design evidence only. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html');
const out=path.join(root,'verification-evidence/order-fulfilment');
await fs.mkdir(out,{recursive:true});

let browser,channel='chrome';
try{browser=await chromium.launch({channel:'chrome',headless:true});}
catch{channel='bundled-chromium';browser=await chromium.launch({headless:true});}
/* The Playwright API does not report which binary a channel resolved to. Record the
   bundled executable path alongside it so the reader can check whether the environment
   simply aliases the channel to the bundled browser. */
const bundledExecutable=chromium.executablePath();
const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
const page=await context.newPage();
const results=[],images=[],errors=[],responsive=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});

const st=()=>page.evaluate(()=>window.OF_DEMO.state());
const uiState=()=>page.evaluate(()=>window.OF_DEMO.ui());
const action=name=>page.locator(`[data-action="${name}"]:visible`);
const nav=id=>page.locator(`#tabs [data-view="${id}"]`);
const modal=()=>page.locator('#modal');
const field=label=>modal().getByLabel(label,{exact:true});
const submit=async()=>{
  await page.locator('#modal-submit').click();
  try{await modal().waitFor({state:'hidden',timeout:8000});}
  catch(e){
    const detail=await page.locator('#modal-error').innerText().catch(()=>'');
    const title=await page.locator('#modal-title').innerText().catch(()=>'');
    throw Error(`Form "${title}" did not save. Reported: ${detail||'no message'}`);
  }
};
const check=async(name,fn)=>{await fn();results.push({name,result:'Passed'});};
const snap=async name=>{await page.locator('#toast').waitFor({state:'hidden',timeout:6000}).catch(()=>{});await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});images.push(name+'.png');};
const setContext=async(role,company)=>{
  if(company)await page.locator('#f-ctx-company').selectOption(company);
  if(role)await page.locator('#f-ctx-role').selectOption(role);
  await page.waitForTimeout(80);
};
const openOrder=async id=>{await page.locator(`.queue-table [data-action="order"][data-id="${id}"]`).click();await modal().waitFor({state:'visible'});};

try{
  await page.goto(pathToFileURL(file).href);
  await page.locator('.queue-table tbody tr').first().waitFor();

  await check('Five connected views render with their scope identifiers and the central question',async()=>{
    assert.equal(await page.locator('#tabs [data-view]').count(),5);
    const heading=await page.locator('.module-header').innerText();
    assert.match(heading,/SC-05 · SC-06 · SC-07/);
    assert.match(heading,/What can we supply, what is ready to dispatch, what has reached the customer, and what remains outstanding\?/);
    assert.equal((await uiState()).role,'coordinator');
    await snap('1440-01-register');
  });

  await check('The register shows source order, account, purchase order, handover and three separate dates',async()=>{
    const text=await page.locator('#content').innerText();
    for(const token of ['SYN-PPO-FUL-000001','SYN-ERP-SO-004411','SYN-ERP-CUST-NBN01','PO-NBN-8842','SYN-PPO-HOV-000041','Requested','Confirmed','Expected'])
      assert.match(text,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  });

  await check('Search, filters and the empty state explain themselves and clear cleanly',async()=>{
    await page.getByLabel('Search orders',{exact:true}).fill('Willowbank');
    assert.equal(await page.locator('.queue-table tbody tr').count(),1);
    await page.getByLabel('Search orders',{exact:true}).fill('no such customer');
    assert.match(await page.locator('#content').innerText(),/No matching orders/);
    await page.locator('#toolbar [data-action=clear]').first().click();
    assert(await page.locator('.queue-table tbody tr').count()>1);
  });

  await check('A snapshot card opens the exact contributing records and preserves filter context',async()=>{
    await page.locator('.snapshot [data-action="snapshot"][data-id="Awaiting stock"]').click();
    assert.equal((await uiState()).filters.worklist,'Awaiting stock');
    const rows=await page.locator('.queue-table tbody tr').count();
    assert(rows>0);
    assert.match(await page.locator('#content').innerText(),/Filter context retained/);
    await action('restoreFilters').click();
    assert.equal((await uiState()).filters.worklist,'all');
  });

  await check('Coordination views are labelled as PPO views, not source statuses',async()=>{
    assert.match(await page.locator('#content').innerText(),/These are PPO coordination views/);
    assert.match(await page.locator('#content').innerText(),/No equivalence to a MYOB Acumatica order status has been verified/);
  });

  await check('The order drawer separates acceptance, Won, ERP order creation and receiving responsibility',async()=>{
    await openOrder('ful-000001');
    const body=await page.locator('#modal-body').innerText();
    assert.match(body,/Quotation accepted 10 September 2026; opportunity marked Won 10 September 2026; ERP order created 11 September 2026/);
    assert.match(body,/Pack Room 01/);
    assert.match(body,/Glasshouse 02 and the Irrigation room/);
    assert.match(body,/Outstanding.*=.*ordered 10 EA/s);
    await snap('1440-02-order-drawer');
    await page.locator('#cancel-button').click();
  });

  await check('Stock shows unknown, quarantined, unresolved-unit and anomalous observations as themselves',async()=>{
    await nav('stock').click();
    const text=await page.locator('#content').innerText();
    assert.match(text,/Unknown/);
    assert.match(text,/Unit basis Unresolved/);
    assert.match(text,/Investigate/);
    assert.match(text,/Physical stock, usable stock, incoming supply and available-to-promise are different things/);
    await page.locator('[data-action="stockSelect"][data-id="avl-000002"]').click();
    const detail=await page.locator('#content').innerText();
    assert.match(detail,/Held/);
    assert.match(detail,/quarantined pending supplier disposition/i);
    await snap('1440-03-stock');
  });

  await check('An incomplete observation cannot be reserved from the interface',async()=>{
    await setContext(null,'PPA-AU');
    await page.locator('[data-action="stockSelect"][data-id="avl-000006"]').click();
    const reserve=page.locator('#content [data-action="reserve"]').first();
    assert.equal(await reserve.isDisabled(),true);
  });

  await check('Reserving binds evidenced usable stock and refuses a second allocation of the same quantity',async()=>{
    await page.locator('[data-action="stockSelect"][data-id="avl-000001"]').click();
    await page.locator('#content [data-action="reserve"]').first().click();
    await field('Order line').selectOption({index:0});
    await field('Reservation quantity').fill('6');
    await field('Reservation basis').fill('Reserve the evidenced usable quantity for the first Northbank shipment.');
    await submit();
    let s=await st();
    assert.equal(s.reservations.filter(r=>r.line==='lin-000001'&&r.state==='Confirmed').length,1);
    await page.locator('[data-action="stockSelect"][data-id="avl-000001"]').click();
    assert.equal(await page.locator('#content [data-action="reserve"]').first().isDisabled(),true);
    assert.match(await page.locator('#content').innerText(),/No evidenced usable and unreserved quantity remains on this observation/);
    await nav('register').click();
    await openOrder('ful-000001');
    await modal().locator('[data-action="reserve"]').first().click();
    await field('Reservation quantity').fill('4');
    await field('Reservation basis').fill('Attempt a second allocation against the same evidenced quantity.');
    await page.locator('#modal-submit').click();
    assert.match(await page.locator('#modal-error').innerText(),/Only 0 EA is evidenced usable and unreserved/);
    page.once('dialog',d=>d.accept());
    await page.locator('#cancel-button').click();
    await modal().waitFor({state:'hidden'});
    s=await st();
    assert.equal(s.reservations.filter(r=>r.line==='lin-000001').length,1);
    await nav('stock').click();
  });

  await check('A competing order can take only the remaining evidenced quantity',async()=>{
    await page.locator('[data-action="stockSelect"][data-id="avl-000003"]').click();
    await page.locator('#content [data-action="reserve"]').first().click();
    await field('Order line').selectOption({index:0});
    await field('Reservation quantity').fill('4');
    await field('Reservation basis').fill('Reserve the Greenhaven requirement from the shared observation.');
    await submit();
    await page.locator('#content [data-action="reserve"]').first().click();
    await field('Order line').selectOption({index:0});
    await field('Reservation quantity').fill('3');
    await field('Reservation basis').fill('Attempt the competing Willowbank requirement from the same observation.');
    await page.locator('#modal-submit').click();
    assert.match(await page.locator('#modal-error').innerText(),/Only 1 EA is evidenced usable and unreserved/);
    page.once('dialog',d=>d.accept());
    await page.locator('#cancel-button').click();
    await modal().waitFor({state:'hidden'});
    await snap('1440-04-competing');
  });

  await check('Picking and staging are separate physical observations recorded by the warehouse role',async()=>{
    await setContext('warehouse',null);
    await nav('picking').click();
    assert.match(await page.locator('#content').innerText(),/Issuing a document is not a dispatch/);
    await page.locator('.pick-card [data-action="pick"]').first().click();
    await field('Picked quantity').fill('6');
    await field('Serial or batch references').fill('SYN-BATCH-L1000-2609');
    await submit();
    let s=await st();
    assert.equal(s.picks.filter(p=>p.line==='lin-000001').length,1);
    await action('stage').first().click();
    await field('Staged quantity').fill('6');
    await submit();
    s=await st();
    const p=s.picks.find(p=>p.line==='lin-000001');
    assert.equal(p.picked,6000);assert.equal(p.staged,6000);
    await snap('1440-05-picking');
  });

  await check('Dispatch preparation records the receiving point and moves nothing',async()=>{
    await setContext('coordinator',null);
    await nav('register').click();
    await openOrder('ful-000001');
    await modal().locator('[data-action="prepare"]').first().click();
    await field('Quantity').fill('6');
    await field('Carrier or collection arrangement').fill('Collected by Powerplants vehicle PPA-02');
    await field('Package references').fill('SYN-PPO-PKG-000010');
    await field('Planned dispatch date').fill('2026-09-17');
    await submit();
    const s=await st();
    const d=s.dispatches.find(x=>x.order==='ful-000001');
    assert.equal(d.movementAt,null);
    assert.equal(d.erp.state,'Not submitted');
    assert.equal(d.receivingPoint,'Pack Room 01 — hardstand loading bay');
  });

  await check('Issuing a pick list does not dispatch the goods',async()=>{
    await nav('picking').click();
    await page.locator('.line-block [data-action="issueDoc"]').first().click();
    await field('Document').selectOption('Pick list');
    await submit();
    const s=await st();
    const d=s.dispatches.find(x=>x.order==='ful-000001');
    assert.equal(d.documents.length,1);
    assert.equal(d.movementAt,null);
    assert.match(await page.locator('#content').innerText(),/Pick list · SYN-PPO-DOC/);
  });

  await check('Physical dispatch and the source shipment outcome are recorded separately',async()=>{
    await setContext('warehouse',null);
    await nav('picking').click();
    await page.locator('.line-block [data-action="movement"]').first().click();
    await modal().locator('input[name=confirm]').check();
    await submit();
    let s=await st();
    let d=s.dispatches.find(x=>x.order==='ful-000001');
    assert(d.movementAt);
    assert.equal(d.erp.state,'Not submitted');
    await setContext('coordinator',null);
    await nav('picking').click();
    await page.locator('.line-block [data-action="shipOutcome"]').first().click();
    await field('Observed source outcome').selectOption('Confirmed');
    await field('Source shipment reference').fill('SYN-ERP-SHP-006201');
    await field('Observation basis').fill('The simulated source returned a confirmed shipment reference for this consignment.');
    await submit();
    s=await st();
    d=s.dispatches.find(x=>x.order==='ful-000001');
    assert.equal(d.erp.state,'Confirmed');
    assert.equal(d.erp.ref,'SYN-ERP-SHP-006201');
  });

  await check('Delivery capture records the actual receiving point and keeps the use area separate',async()=>{
    await setContext('delivery',null);
    await nav('delivery').click();
    assert.match(await page.locator('#content').innerText(),/Delivery to Pack Room 01 does not establish installation in Glasshouse 02/);
    await page.locator('#content [data-action="capture"]').first().click();
    await field('Delivery outcome').selectOption('Delivered');
    await field('Received').fill('6');
    await field('Receiving person').fill('Priya Raman');
    await field('Receiving person role').fill('Nursery manager');
    await field('Delivery notes').fill('Six toplights handed over at the Pack Room hardstand and checked against the packing document.');
    await field('Evidence references').fill('SYN-PPO-EVI-000010');
    await submit();
    const s=await st();
    const d=s.deliveries.find(x=>x.order==='ful-000001');
    assert.equal(d.receivingPoint,'Pack Room 01 — hardstand loading bay');
    assert.equal(d.lines[0].received,6000);
    assert.equal(d.acknowledgement,null);
    assert.match(await page.locator('#content').innerText(),/No acknowledgement captured/);
    await snap('1440-06-delivery');
  });

  await check('An acknowledgement names its exact delivery and excludes wider acceptance',async()=>{
    await page.locator('#content [data-action="acknowledge"]').first().click();
    await modal().locator('input[name=confirm]').check();
    await submit();
    const text=await page.locator('#content').innerText();
    assert.match(text,/Customer acknowledgement/);
    assert.match(text,/not acceptance of installation quality, completion of a project, resolution of a service case, or approval to invoice or pay/);
    const s=await st();
    assert.match(s.deliveries.find(x=>x.order==='ful-000001').acknowledgement.scope,/SYN-PPO-DEL-/);
  });

  await check('The remaining four units stay outstanding and become an owned exception',async()=>{
    await setContext('coordinator',null);
    await nav('register').click();
    assert.match(await page.locator('#content').innerText(),/Partially delivered/);
    await nav('exceptions').click();
    await page.locator('#content [data-action="raise"]').first().click();
    await field('Exception category').selectOption('Insufficient or unavailable stock');
    await field('Affected scope').fill('Four toplights remain outstanding on SYN-ERP-SO-004411-10 after the first shipment.');
    await field('Next action').fill('Confirm the supplier promise, then reserve the remaining quantity once a usable receipt is evidenced.');
    await field('Source record reference').fill('SYN-PPO-AVL-000001');
    await submit();
    const s=await st();
    assert(s.exceptions.some(e=>e.kind==='Insufficient or unavailable stock'&&e.order==='ful-000001'));
    await snap('1440-07-exceptions');
  });

  await check('The same impact identity cannot create a second follow-up obligation',async()=>{
    await page.locator('.exception-card [data-action="follow"]').first().click();
    await field('What needs to happen').fill('Confirm the revised supply date with the customer and record the response.');
    await submit();
    const before=(await st()).followUps.length;
    await page.locator('.exception-card [data-action="follow"]').first().click();
    await field('What needs to happen').fill('The same shortage seen again from another view.');
    await submit();
    assert.equal((await st()).followUps.length,before);
  });

  await check('A later confirmed receipt is a refreshed observation, then the second shipment completes the line',async()=>{
    await nav('stock').click();
    await page.locator('[data-action="stockSelect"][data-id="avl-000001"]').click();
    await page.locator('#content [data-action="refresh"]').first().click();
    await field('Scenario').selectOption('newSupply');
    await submit();
    await page.locator('[data-action="stockSelect"][data-id="avl-000001"]').click();
    await page.locator('#content [data-action="reserve"]').first().click();
    await field('Order line').selectOption({index:0});
    await field('Reservation quantity').fill('4');
    await field('Reservation basis').fill('Reserve the newly evidenced usable quantity for the second Northbank shipment.');
    await submit();
    await setContext('warehouse',null);
    await nav('picking').click();
    await page.locator('.pick-card [data-action="pick"]').first().click();
    await field('Picked quantity').fill('4');
    await submit();
    await page.locator('.line-block [data-action="stage"]').first().click();
    await field('Staged quantity').fill('4');
    await submit();
    await setContext('coordinator',null);
    await nav('register').click();
    await openOrder('ful-000001');
    await modal().locator('[data-action="prepare"]').first().click();
    await field('Quantity').fill('4');
    await field('Carrier or collection arrangement').fill('Collected by Powerplants vehicle PPA-02');
    await field('Package references').fill('SYN-PPO-PKG-000011');
    await field('Planned dispatch date').fill('2026-09-24');
    await submit();
    await setContext('warehouse',null);
    await nav('picking').click();
    await page.locator('.line-block [data-action="movement"]').first().click();
    await modal().locator('input[name=confirm]').check();
    await submit();
    await setContext('delivery',null);
    await nav('delivery').click();
    await page.locator('#content [data-action="capture"]').first().click();
    await field('Delivery outcome').selectOption('Delivered');
    await field('Received').fill('4');
    await field('Receiving person').fill('Priya Raman');
    await field('Receiving person role').fill('Nursery manager');
    await field('Delivery notes').fill('The remaining four toplights were handed over and checked against the packing document.');
    await field('Evidence references').fill('SYN-PPO-EVI-000011');
    await submit();
    const s=await st();
    const del=s.deliveries.filter(d=>!d.superseded&&d.lines.some(l=>l.line==='lin-000001'));
    assert.equal(del.length,2);
    const received=del.reduce((n,d)=>n+d.lines.filter(l=>l.line==='lin-000001').reduce((m,l)=>m+l.received,0),0);
    assert.equal(received,10000);
    await snap('1440-08-two-shipments');
  });

  await check('The original shortage and both shipments remain visible after completion',async()=>{
    await setContext('coordinator',null);
    await nav('exceptions').click();
    const text=await page.locator('#content').innerText();
    assert.match(text,/Four toplights remain outstanding on SYN-ERP-SO-004411-10 after the first shipment/);
    await nav('delivery').click();
    assert.equal(await page.locator('.pod').count()>=3,true);
  });

  await check('A correction supersedes its predecessor and retains the original capture',async()=>{
    await nav('delivery').click();
    const original=page.locator('.pod').filter({hasText:'SYN-PPO-DEL-000001'}).first();
    await original.locator('[data-action="correct"]').click();
    await field('Correction reason').fill('The customer recount confirmed six sets were presented and one was damaged in transit.');
    await submit();
    const s=await st();
    const old=s.deliveries.find(d=>d.id==='del-000001');
    assert.equal(old.superseded,true);
    assert.equal(old.author,'Sam Patel');
    const successor=s.deliveries.find(d=>d.predecessor==='del-000001');
    assert(successor);
    assert.match(await page.locator('#content').innerText(),/superseded/);
    await snap('1440-09-correction');
  });

  await check('A lost response blocks further effect and the original operation recovers without duplication',async()=>{
    await action('options').click();
    await field('Next save behaviour').selectOption('unknown');
    await submit();
    await nav('exceptions').click();
    await page.locator('#content [data-action="expected"]').first().click();
    await field('Order line').selectOption({index:0});
    await field('New expected date').fill('2026-09-26');
    await field('Reason for the change').fill('A commitment change whose save response is lost on the way back.');
    await submit();
    assert.equal(await page.evaluate(()=>window.OF_DEMO.pending()),true);
    assert.match(await page.locator('#recovery').innerText(),/Save response lost/);
    const before=await st();
    await action('recover').click();
    assert.match(await page.locator('#modal-body').innerText(),/no second effect was created/);
    await page.locator('#cancel-button').click();
    const after=await st();
    assert.equal(after.version,before.version);
    assert.equal(after.receiptsLedger.length,before.receiptsLedger.length);
    assert.equal(await page.evaluate(()=>window.OF_DEMO.pending()),false);
  });

  await check('A simulated save failure records nothing and retains the entries',async()=>{
    await action('options').click();
    await field('Next save behaviour').selectOption('fail');
    await submit();
    const before=(await st()).version;
    await nav('exceptions').click();
    await page.locator('#content [data-action="expected"]').first().click();
    await field('New expected date').fill('2026-09-27');
    await field('Reason for the change').fill('A change that the simulated save refuses while keeping the entries.');
    await page.locator('#modal-submit').click();
    assert.match(await page.locator('#modal-error').innerText(),/Simulated save failure/);
    assert.equal(await field('New expected date').inputValue(),'2026-09-27');
    page.once('dialog',d=>d.accept());
    await page.locator('#cancel-button').click();
    await modal().waitFor({state:'hidden'});
    assert.equal((await st()).version,before);
  });

  await check('Partial, failed and empty source scenarios explain themselves without showing zero',async()=>{
    await action('options').click();await field('Source scenario').selectOption('partial');await submit();
    assert.match(await page.locator('#content').innerText(),/Partial source results/);
    await nav('stock').click();
    assert.equal(await page.locator('.stock-table').innerText().then(t=>t.includes('Sydney')),false);
    await snap('1440-10-partial');
    await action('options').click();await field('Source scenario').selectOption('failed');await submit();
    await nav('register').click();
    const failed=await page.locator('#content').innerText();
    assert.match(failed,/Order source unavailable/);
    assert.match(failed,/This does not mean there is nothing outstanding/);
    assert.match(failed,/—/);
    await action('options').click();await field('Source scenario').selectOption('empty');await submit();
    assert.match(await page.locator('#content').innerText(),/Empty result scenario/);
    await action('retry').first().click();
    assert(await page.locator('.queue-table tbody tr').count()>0);
  });

  await check('Company and identity switching isolates records without mixing them',async()=>{
    await setContext('coordinator','PPA-NZ');
    const blocked=await page.locator('#content').innerText();
    assert.match(blocked,/No permitted records in this company/);
    assert.doesNotMatch(blocked,/Kauri Ridge/);
    assert.doesNotMatch(blocked,/Northbank/);
    await setContext('groupCoordinator',null);
    const nz=await page.locator('#content').innerText();
    assert.match(nz,/Kauri Ridge Glasshouses/);
    assert.doesNotMatch(nz,/Northbank Nursery/);
    await snap('1440-11-company-isolation');
    await setContext(null,'PPA-AU');
    const au=await page.locator('#content').innerText();
    assert.match(au,/Northbank Nursery/);
    assert.doesNotMatch(au,/Kauri Ridge/);
  });

  await check('Restricted commercial values never reach a non-commercial role anywhere on the page',async()=>{
    await setContext('warehouse','PPA-AU');
    await nav('register').click();
    await page.getByLabel('Search orders',{exact:true}).fill('4950');
    assert.match(await page.locator('#content').innerText(),/No matching orders/);
    await page.locator('#toolbar [data-action=clear]').first().click();
    await openOrder('ful-000001');
    const body=await page.locator('#modal-body').innerText();
    assert.doesNotMatch(body,/4950/);
    assert.match(body,/Commercial values are outside the Warehouse & dispatch grant/);
    await page.locator('#cancel-button').click();
  });

  await check('A read-only identity can inspect everything and record nothing',async()=>{
    await setContext('observer','PPA-AU');
    await nav('register').click();
    await openOrder('ful-000001');
    for(const name of ['reserve','prepare','raise']){
      const b=modal().locator(`[data-action="${name}"]`).first();
      if(await b.count())assert.equal(await b.isDisabled(),true);
    }
    await page.locator('#cancel-button').click();
    await nav('exceptions').click();
    assert.equal(await page.locator('#content [data-action="expected"]').first().isDisabled(),true);
  });

  await check('Reload restores the exact saved records, context and filters',async()=>{
    await setContext('coordinator','PPA-AU');
    const s=await st(),u=await uiState();
    await page.reload();
    await page.locator('#content h2').first().waitFor();
    assert.deepEqual(await st(),s);
    assert.deepEqual(await uiState(),u);
  });

  await check('A damaged saved session preserves the original content and offers an export',async()=>{
    await page.evaluate(()=>localStorage.setItem(window.OF_DEMO.key,'{"schema":"ppo-order-fulfilment-session/v1","state":{"schema":"wrong"},"ui":{}}'));
    await page.reload();
    await page.locator('#content').waitFor();
    assert.match(await page.locator('#content').innerText(),/Saved session could not be read/);
    assert.equal(await page.locator('#tabs [data-view]').count(),0);
    assert(await page.locator('[data-action="raw"]').count());
    page.once('dialog',d=>d.accept());
    await page.locator('[data-action="reset"]').click();
    await page.locator('.queue-table tbody tr').first().waitFor();
    assert.equal((await st()).version,0);
  });

  await check('Keyboard navigation reaches the views and opens a record without a pointer',async()=>{
    await page.locator('.skip').focus();
    await page.keyboard.press('Enter');
    await nav('stock').focus();
    await page.keyboard.press('Enter');
    assert.equal((await uiState()).view,'stock');
    await nav('register').focus();
    await page.keyboard.press('Enter');
    const title=page.locator('.queue-table .record-title').first();
    await title.focus();
    await page.keyboard.press('Enter');
    assert((await uiState()).selected);
    await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineStyle}));
    assert.notEqual(focus.tag,'BODY');
    assert.equal(focus.visible,true,'keyboard focus should match :focus-visible');
    assert.notEqual(focus.outline,'none','a keyboard-focused control should show a visible outline');
  });

  for(const [w,h] of [[1440,960],[1024,880],[820,1180],[390,844],[320,720]]){
    await page.setViewportSize({width:w,height:h});
    for(const view of ['register','stock','picking','delivery','exceptions']){
      const tab=nav(view);
      if(await tab.isDisabled())continue;
      await tab.click();
      await page.waitForTimeout(60);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      responsive.push({width:w,view,horizontalOverflowPx:overflow});
      assert.ok(overflow<=1,`horizontal overflow of ${overflow}px at ${w}px in ${view}`);
    }
    await nav('register').click();
    await snap(`${w}-responsive-register`);
  }
  results.push({name:'Every view renders at 1440, 1024, 820, 390 and 320 px with no horizontal page overflow',result:'Passed'});

  await page.setViewportSize({width:390,height:844});
  await check('The phone picking and delivery forms present full-width controls with large targets',async()=>{
    await page.evaluate(()=>localStorage.clear());
    await page.reload();
    await page.locator('.queue-table tbody tr').first().waitFor();
    await nav('picking').click();
    const box=await page.locator('#tabs button').first().boundingBox();
    assert.ok(box.height>=44,`navigation target height ${box.height}px`);
    await snap('390-picking');
    await nav('delivery').click();
    await snap('390-delivery');
  });

  assert.deepEqual(errors,[],'browser errors: '+errors.join(' | '));
}finally{
  const payload={
    design:'PPO Order Fulfilment & Customer Delivery r01',
    browser_channel:channel,
    browser_version:browser.version(),
    bundled_executable_path:bundledExecutable,
    browser_binary_note:'Playwright does not report the binary a channel resolved to. Where the environment aliases the chrome channel to the bundled Chromium, browser_version equals the bundled version and this run is a Chromium run, not a Google Chrome run.',
    html_sha256:createHash('sha256').update(await fs.readFile(file)).digest('hex'),
    groups:results.length,
    results,responsive,errors,screenshots:images
  };
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify(payload,null,2));
  console.log(JSON.stringify(payload,null,2));
  await browser.close();
}
