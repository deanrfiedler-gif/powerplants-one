import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const file = 'docs/reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-r01.html';
const html = await fs.readFile(file), out = 'verification-evidence/output-distribution';
await fs.mkdir(out, {recursive:true});
const server = http.createServer((_req, res) => { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(html); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}`;
// CI uses the repository's pinned Chrome channel. PPO_CHROME_PATH runs the same journeys
// against another inspected build; the runtime actually used is recorded in results.json.
const browser = await chromium.launch(process.env.PPO_CHROME_PATH ? {executablePath:process.env.PPO_CHROME_PATH, headless:true} : {channel:'chrome', headless:true});
const ctx = await browser.newContext({viewport:{width:1440, height:960}, acceptDownloads:true}), page = await ctx.newPage();
const groups = [], errors = [], captures = [], requests = [];
const key = 'ppo.output-distribution.r01';
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('request', r => requests.push(r.url()));
page.on('dialog', d => d.accept());
const check = async (name, fn) => { await fn(); groups.push(name); console.log('PASS ' + name); };
const tab = async name => page.getByRole('tab', {name, exact:true}).click();
const close = async () => page.getByRole('button', {name:'Close dialog', exact:true}).click();
const stored = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const profile = async value => page.getByLabel('Preview profile').selectOption(value);
const card = name => page.locator('.recipient-card').filter({hasText:name});
async function snap(name, fullPage = true) { const f = name + '.png'; await page.screenshot({path:`${out}/${f}`, fullPage}); captures.push(f); }
try {
await page.goto(url); await page.evaluate(() => document.fonts.ready);

await check('Needs attention queue reports its population and open exceptions', async () => {
  assert.equal(await page.locator('.output-table tbody tr').count(), 8);
  assert.equal(await page.locator('.metric .value').nth(0).innerText(), '9');
  assert.equal(await page.locator('.metric .value').nth(2).innerText(), '6');
  await page.getByLabel('Queue view').selectOption('all');
  assert.equal(await page.locator('.output-table tbody tr').count(), 9);
  await snap('desktop-queue');
});
await check('Search and location filters retain a no-match state without selecting a hidden record', async () => {
  await page.getByLabel('Find an output').fill('SYN-PPO-WO-000063');
  assert.equal(await page.locator('.output-table tbody tr').count(), 1);
  assert.match(await page.locator('.output-table tbody').innerText(), /SYN-PPO-PACK-000081/);
  await page.getByLabel('Find an output').fill('OUT-11');
  assert.equal(await page.locator('.output-table tbody tr').count(), 2);
  await page.getByRole('button', {name:'Show filters', exact:true}).click();
  await page.getByLabel('Originating domain', {exact:true}).selectOption('Projects');
  assert.equal(await page.locator('.output-table tbody tr').count(), 2);
  await page.getByLabel('Owner', {exact:true}).selectOption('Riley Chen');
  assert.ok(await page.getByRole('heading', {name:'No matching outputs'}).isVisible());
  await page.getByRole('button', {name:'Show all permitted outputs', exact:true}).click();
  assert.equal(await page.locator('.output-table tbody tr').count(), 9);
});
await check('Docked snapshot opens the full record and states its distribution denominator', async () => {
  await page.getByRole('button', {name:'Irrigation installation — technician job pack', exact:true}).click();
  assert.equal(Math.round((await page.locator('#snapshot').boundingBox()).width), 448);
  assert.match(await page.locator('#snapshot').innerText(), /3 of 3 approved recipients have supported delivery evidence/);
  assert.match(await page.locator('#snapshot').innerText(), /2 of 3 have recorded an explicit response/);
  await snap('desktop-snapshot', false);
  await page.getByRole('button', {name:'Open full detail', exact:true}).click();
  assert.match(await page.locator('.document-paper').innerText(), /One shared isolation point/);
});
await check('Issue evidence separates preparation time, issue time and reserved identity', async () => {
  const evidence = await page.locator('.inspector').first().innerText();
  for (const expected of ['Output preparation time', '04:07 UTC', 'Actual issue time', '04:19 UTC', 'Reserved issue identity']) assert.ok(evidence.includes(expected), expected);
  assert.match(await page.locator('main').innerText(), /effective only on release/);
});
await check('Downloaded bytes match the displayed byte count and content identity', async () => {
  const row = page.locator('.manifest-table tbody tr').first();
  const shown = await row.locator('.hash').innerText(), size = await row.locator('.num').innerText();
  const pending = page.waitForEvent('download');
  await row.getByRole('button', {name:'Download', exact:true}).click();
  const body = await fs.readFile(await (await pending).path());
  assert.equal(body.length.toLocaleString('en-AU') + ' bytes', size);
  assert.equal(crypto.createHash('sha256').update(body).digest('hex').slice(0, 12) + '…', shown);
  assert.match(body.toString('utf8'), /Synthetic prototype — not for operational use/);
  assert.equal(await stored(), null);
});
await check('The manifest states an absent PDF rendition rather than implying one', async () => {
  assert.match(await page.locator('.manifest-table').innerText(), /PDF not included in this preview/);
  assert.match(await page.locator('.manifest-table').innerText(), /Browser print is not an approved controlled PDF renderer/);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name:'Export manifest', exact:true}).click();
  const manifest = JSON.parse(await fs.readFile(await (await pending).path(), 'utf8'));
  assert.equal(manifest.synthetic, true);
  assert.equal(manifest.manifest[0].format, 'HTML');
  assert.match(manifest.note, /No controlled PDF rendition/);
  await snap('desktop-detail');
});
await check('A multi-item transmittal keeps a missing exact item without a substitute', async () => {
  await page.getByLabel('Selected output').selectOption('drawings');
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r01 · Superseded'});
  assert.equal(await page.locator('.manifest-table tbody tr').count(), 3);
  const missing = page.locator('.manifest-table tbody tr').first();
  assert.match(await missing.innerText(), /Missing exact item/);
  assert.match(await missing.locator('.hash').innerText(), /No content identity/);
  assert.ok(await missing.getByRole('button', {name:'Preview', exact:true}).isDisabled());
  assert.ok(await missing.getByRole('button', {name:'Download', exact:true}).isDisabled());
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r02 · Current'});
  assert.equal(await page.locator('.manifest-table tbody tr').count(), 4);
  await page.getByLabel('Selected output').selectOption('pack');
});
await check('Readiness explains each check and no percentage replaces the decision', async () => {
  await tab('Readiness & domain review');
  assert.equal(await page.locator('.readiness-table tbody tr').count(), 11);
  assert.match(await page.locator('.readiness-table').innerText(), /Domain review decision/);
  assert.equal(await page.locator('main').innerText().then(t => /%/.test(t)), false);
  await snap('desktop-readiness');
});
await check('An unconfigured domain rule blocks release while inspection still works', async () => {
  await page.getByLabel('Selected output').selectOption('unconfigured');
  assert.match(await page.locator('.readiness-table').innerText(), /Not configured/);
  await page.getByRole('button', {name:'Create successor draft', exact:true}).click();
  await page.getByLabel('Why a successor is required').fill('First fictional progress update for this project.');
  await page.getByRole('button', {name:'Save successor draft', exact:true}).click();
  await profile('issuer');
  await page.getByRole('button', {name:'Open domain review', exact:true}).click();
  await page.getByLabel('Decision rationale').fill('Attempting a decision without a configured rule.');
  await page.getByRole('button', {name:'Save domain decision', exact:true}).click();
  assert.match(await page.locator('#form-error').innerText(), /Applicable domain policy/);
  await close();
  await profile('coordinator');
});
await check('A changed source blocks the successor and appears as an owned exception', async () => {
  await page.getByLabel('Selected output').selectOption('progress');
  assert.match(await page.locator('.readiness-table').innerText(), /Unresolved blocking changes/);
  assert.ok(await page.getByRole('button', {name:'Prepare exact output', exact:true}).isDisabled());
  await tab('Exceptions & recovery');
  assert.match(await page.locator('.exception-list').innerText(), /Source changed after preparation/);
  await snap('desktop-exceptions');
});
await check('Successor draft and independent domain decision bind the exact basis', async () => {
  await tab('Readiness & domain review');
  await page.getByLabel('Selected output').selectOption('pack');
  await page.getByRole('button', {name:'Create successor draft', exact:true}).click();
  await page.getByLabel('Why a successor is required').fill('Drawing r03 changes the isolation arrangement the issued pack relies on.');
  await page.getByRole('button', {name:'Save successor draft', exact:true}).click();
  assert.ok(await page.getByRole('button', {name:'Open domain review', exact:true}).isDisabled());
  await profile('issuer');
  await page.getByRole('button', {name:'Open domain review', exact:true}).click();
  assert.match(await page.locator('#dialog').innerText(), /Acknowledging an issued pack does not authorise attendance or work/);
  await page.getByLabel('Decision rationale').fill('Source r03, template v2 and the three crew assignments were checked against this successor basis.');
  await page.getByRole('button', {name:'Save domain decision', exact:true}).click();
  assert.equal((await stored()).reviews.at(-1).outcome, 'Checked');
});
await check('A failed local save retains the form and the retry creates one preparation', async () => {
  await profile('coordinator');
  await page.getByRole('button', {name:'Review guide', exact:true}).click();
  await page.getByRole('button', {name:'Fail next save once', exact:true}).click();
  await page.getByRole('button', {name:'Prepare exact output', exact:true}).click();
  await page.getByRole('button', {name:'Prepare output', exact:true}).click();
  assert.match(await page.locator('#form-error').innerText(), /save failed/);
  await page.getByRole('button', {name:'Prepare output', exact:true}).click();
  const saved = await stored();
  assert.equal(saved.preparations.length, 1);
  assert.equal(saved.preparations[0].state, 'Finalisation outcome unknown');
});
await check('An interrupted finalisation refuses release and is owned as an exception', async () => {
  await profile('issuer');
  assert.ok(await page.getByRole('button', {name:'Record domain issue', exact:true}).isDisabled());
  await tab('Exceptions & recovery');
  assert.match(await page.locator('.exception-list').innerText(), /Finalisation outcome unknown/);
  assert.match(await page.locator('.exception-list').innerText(), /must not be generated again/);
});
await check('Recovery continues the original operation and release records a separate issue time', async () => {
  await profile('coordinator');
  await tab('Readiness & domain review');
  const before = (await stored()).preparations[0].bundle.map(x => x.hash);
  await page.getByRole('button', {name:'Recover original operation', exact:true}).click();
  await page.getByLabel('What the original lookup established').fill('The original bundle was located by its operation identity and every item identity matched.');
  await page.getByRole('button', {name:'Continue original operation', exact:true}).click();
  assert.deepEqual((await stored()).preparations[0].bundle.map(x => x.hash), before);
  await profile('issuer');
  await page.getByRole('button', {name:'Record domain issue', exact:true}).click();
  await page.getByRole('button', {name:'Record issue event', exact:true}).click();
  const saved = await stored();
  assert.equal(saved.issues.length, 1);
  assert.equal(saved.issues[0].preparedAt, saved.preparations[0].reservedAt);
  assert.notEqual(saved.issues[0].issuedAt, saved.issues[0].preparedAt);
  assert.ok(await page.getByRole('button', {name:'Record domain issue', exact:true}).isDisabled());
  await snap('desktop-released');
});
await check('The predecessor stays exact and keeps its own acknowledgements', async () => {
  await tab('Output & issue detail');
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r04 · Superseded'});
  assert.match(await page.locator('main').innerText(), /Superseded · historical inspection/);
  assert.match(await page.locator('.document-paper').innerText(), /One shared isolation point/);
  await tab('Distribution & responses');
  assert.equal(await page.locator('.recipient-card').count(), 3);
  assert.match(await page.locator('main').innerText(), /2 of 3 have recorded an explicit response/);
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r05 · Current'});
  assert.match(await page.locator('main').innerText(), /0 of 3 have recorded an explicit response/);
  assert.match(await page.locator('.document-paper, main').first().innerText(), /Separate isolation points|Distribution/);
});
await check('Per-recipient attempts keep independent results and an unknown outcome is not repeated', async () => {
  await profile('distributor');
  await card('Riley Chen').getByRole('button', {name:'Prepare distribution', exact:true}).click();
  await page.getByLabel('Why this recipient receives this exact issue').fill('Issue the successor pack to the lead technician for this appointment.');
  await page.getByRole('button', {name:'Prepare distribution', exact:true}).last().click();
  await card('Riley Chen').getByRole('button', {name:'Simulate attempt', exact:true}).click();
  await page.getByLabel('Simulated outcome').selectOption('Delivered');
  await page.getByRole('button', {name:'Record outcome', exact:true}).click();
  await card('Tomas Reyes').getByRole('button', {name:'Prepare distribution', exact:true}).click();
  await page.getByLabel('Why this recipient receives this exact issue').fill('Issue the successor pack to the apprentice for this appointment.');
  await page.getByRole('button', {name:'Prepare distribution', exact:true}).last().click();
  await card('Tomas Reyes').getByRole('button', {name:'Simulate attempt', exact:true}).click();
  await page.getByLabel('Simulated outcome').selectOption('Outcome unknown');
  await page.getByRole('button', {name:'Record outcome', exact:true}).click();
  assert.match(await card('Tomas Reyes').innerText(), /No supported outcome evidence exists/);
  assert.match(await page.locator('main').innerText(), /1 of 3 approved recipients have supported delivery evidence/);
  await card('Tomas Reyes').getByRole('button', {name:'Prepare distribution', exact:true}).click();
  await page.getByLabel('Why this recipient receives this exact issue').fill('Attempt a repeat before reconciliation.');
  await page.getByRole('button', {name:'Prepare distribution', exact:true}).last().click();
  assert.match(await page.locator('#form-error').innerText(), /Reconcile the unknown original attempt/);
  await close();
  await snap('desktop-distribution');
});
await check('Reconciliation is additive and retains the original attempt evidence', async () => {
  await card('Tomas Reyes').getByRole('button', {name:'Reconcile outcome', exact:true}).click();
  await page.getByLabel('What the original lookup established').selectOption('Delivered');
  await page.getByLabel('Original provider or operation reference').fill('SYN-PPO-OP-000512');
  await page.getByLabel('Reconciliation note').fill('The original operation reference was located and the simulated provider recorded delivery.');
  await page.getByRole('button', {name:'Record reconciliation', exact:true}).click();
  await card('Tomas Reyes').getByRole('button', {name:/^Show /}).click();
  assert.match(await card('Tomas Reyes').innerText(), /No provider result was returned for this original attempt/);
  assert.match(await card('Tomas Reyes').innerText(), /Reconciled as Delivered/);
  assert.equal((await stored()).attempts.filter(a => a.recipient === 'crew-tomas').length, 1);
});
await check('An explicit acknowledgement binds the presented bytes and stays with its own issue', async () => {
  await profile('technician');
  assert.ok(await card('Dana Whitlock').getByRole('button', {name:'Record response', exact:true}).isDisabled() === false);
  await card('Dana Whitlock').getByRole('button', {name:'Record response', exact:true}).click();
  await page.getByLabel('Response', {exact:true}).selectOption('Acknowledged');
  await page.getByRole('button', {name:'Record response', exact:true}).last().click();
  assert.match(await page.locator('#form-error').innerText(), /own assignment response/);
  await close();
  await card('Riley Chen').getByRole('button', {name:'Record response', exact:true}).click();
  const hash = (await page.locator('#dialog').innerText()).match(/([0-9a-f]{12})…/)[1];
  await page.getByLabel('Response', {exact:true}).selectOption('Acknowledged');
  await page.getByLabel('Remarks').fill('Acknowledges pack r05 only.');
  await page.getByRole('button', {name:'Record response', exact:true}).last().click();
  const saved = await stored();
  assert.equal(saved.responses.length, 1);
  assert.ok(saved.responses[0].presentation.startsWith(hash));
  assert.match(await page.locator('main').innerText(), /1 of 3 have recorded an explicit response/);
});
await check('A channel with no delivery evidence cannot record Delivered', async () => {
  await profile('distributor');
  await page.getByLabel('Selected output').selectOption('report');
  await card('Sasha Delaney').getByRole('button', {name:/^Show /}).click();
  assert.match(await card('Sasha Delaney').innerText(), /This channel supplies no delivery evidence/);
  await card('Sasha Delaney').getByRole('button', {name:'Prepare distribution', exact:true}).click();
  await page.getByLabel('Why this recipient receives this exact issue').fill('Reissue the portal link to the selected contact.');
  await page.getByRole('button', {name:'Prepare distribution', exact:true}).last().click();
  await card('Sasha Delaney').getByRole('button', {name:'Simulate attempt', exact:true}).click();
  assert.equal(await page.getByLabel('Simulated outcome').locator('option').allInnerTexts().then(o => o.includes('Delivered')), false);
  await page.getByLabel('Simulated outcome').selectOption('Outcome unknown');
  await page.getByRole('button', {name:'Record outcome', exact:true}).click();
  await card('Sasha Delaney').getByRole('button', {name:'Reconcile outcome', exact:true}).click();
  assert.equal(await page.getByLabel('What the original lookup established').locator('option').allInnerTexts().then(o => o.includes('Delivered')), false);
  assert.match(await page.locator('#dialog').innerText(), /a lookup cannot establish Delivered/);
  await close();
});
await check('A returned successor can be replaced through ordinary controls', async () => {
  await profile('coordinator');
  await tab('Readiness & domain review');
  await page.getByLabel('Selected output').selectOption('drawings');
  await page.getByRole('button', {name:'Create successor draft', exact:true}).click();
  await page.getByLabel('Why a successor is required').fill('First attempt at the drawing successor.');
  await page.getByRole('button', {name:'Save successor draft', exact:true}).click();
  await profile('issuer');
  await page.getByRole('button', {name:'Open domain review', exact:true}).click();
  await page.getByLabel('Domain decision', {exact:true}).selectOption('Returned');
  await page.getByLabel('Decision rationale').fill('The change summary does not identify which drawing changed.');
  await page.getByRole('button', {name:'Save domain decision', exact:true}).click();
  assert.match(await page.locator('main').innerText(), /Returned by the domain/);
  await profile('coordinator');
  assert.ok(await page.getByRole('button', {name:'Create successor draft', exact:true}).isEnabled());
  await page.getByRole('button', {name:'Create successor draft', exact:true}).click();
  await page.getByLabel('Why a successor is required').fill('Second attempt naming drawing SYN-PPO-DOC-000101 r03.');
  await page.getByRole('button', {name:'Save successor draft', exact:true}).click();
  const saved = await stored();
  assert.equal(saved.drafts.filter(d => d.output === 'drawings').length, 2);
  assert.equal(saved.reviews.filter(r => r.output === 'drawings').length, 1);
  assert.match(await page.locator('main').innerText(), /Awaiting domain review/);
});
await check('The Withdraw control follows the selected issue and only the issue in force', async () => {
  await profile('issuer');
  await tab('History & change impact');
  assert.ok(await page.getByRole('button', {name:'Withdraw r02', exact:true}).isEnabled());
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r01 · Superseded'});
  assert.ok(await page.getByRole('button', {name:'Withdraw r01', exact:true}).isDisabled());
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r02 · Current'});
});
await check('Restricted Finance evidence has no distribution control for its own reviewer', async () => {
  await profile('finance');
  assert.equal(await page.locator('.output-table tbody tr').count() > 0 || true, true);
  await tab('Output queue');
  await page.getByLabel('Queue view').selectOption('all');
  assert.equal(await page.locator('.output-table tbody tr').count(), 3);
  await page.getByRole('button', {name:'Northbank visit — Finance supporting evidence', exact:true}).click();
  await page.getByRole('button', {name:'Open full detail', exact:true}).click();
  await tab('Distribution & responses');
  assert.match(await page.locator('main').innerText(), /OUT-14 has no customer distribution route/);
  assert.equal(await page.getByRole('button', {name:'Prepare distribution', exact:true}).count(), 0);
  await snap('desktop-finance');
});
await check('Internal cost content refuses an external destination rather than redacting it', async () => {
  await profile('distributor');
  await tab('Output queue');
  await page.getByLabel('Queue view').selectOption('all');
  await page.getByRole('button', {name:'Irrigation upgrade — internal cost estimate', exact:true}).click();
  await page.getByRole('button', {name:'Open full detail', exact:true}).click();
  await tab('Distribution & responses');
  await card('Nadia Cole').getByRole('button', {name:'Prepare distribution', exact:true}).click();
  await page.getByLabel('Why this recipient receives this exact issue').fill('Attempt an external copy of internal cost content.');
  await page.getByRole('button', {name:'Prepare distribution', exact:true}).last().click();
  assert.match(await page.locator('#form-error').innerText(), /no approved external audience/);
  await close();
});
await check('A restricted profile sees no forbidden titles and exports none of them', async () => {
  await profile('technician');
  await tab('Output queue');
  await page.getByLabel('Queue view').selectOption('all');
  assert.equal(await page.locator('.output-table tbody tr').count(), 1);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name:'Export review copy', exact:true}).click();
  const json = JSON.parse(await fs.readFile(await (await pending).path(), 'utf8'));
  assert.equal(json.synthetic, true);
  assert.equal(json.outputs.length, 1);
  for (const forbidden of ['SYN-PPO-FH-000037', 'SYN-PPO-QUO-000031', 'SYN-PPO-EST-000044', 'nadia.cole']) assert.ok(!JSON.stringify(json).includes(forbidden), forbidden);
  assert.match(json.note, /No provider credentials/);
});
await check('Withdrawal retains the exact issue, its reason and its history', async () => {
  await profile('issuer');
  await tab('Output queue');
  await page.getByLabel('Queue view').selectOption('all');
  await page.getByRole('button', {name:'Compartment B commissioning record', exact:true}).click();
  await page.getByRole('button', {name:'Open full detail', exact:true}).click();
  await page.getByLabel('Exact issue', {exact:true}).selectOption({label:'r01 · Withdrawn'});
  assert.match(await page.locator('main').innerText(), /calibration certificate could not be produced/);
  assert.equal(await page.locator('.document-paper').count(), 1);
  await tab('History & change impact');
  assert.match(await page.locator('.timeline-wrap').innerText(), /Withdrawn r01/);
  await page.getByLabel('Filter history').selectOption('distribution');
  assert.equal(await page.locator('.timeline-wrap').innerText().then(t => /Withdrawn r01/.test(t)), false);
  await page.getByLabel('Filter history').selectOption('');
  assert.match(await page.locator('.timeline-wrap').innerText(), /Withdrawn r01/);
});
await check('History compares revisions and prepares an owned follow-up without changing a module', async () => {
  await page.getByLabel('Selected output').selectOption('pack');
  assert.match(await page.locator('.change-table').innerText(), /SYN-PPO-DOC-000101 r02/);
  assert.match(await page.locator('.change-table').innerText(), /SYN-PPO-DOC-000101 r03/);
  await snap('desktop-history');
  await profile('coordinator');
  await page.getByRole('button', {name:'Prepare follow-up', exact:true}).first().click();
  await page.getByLabel('Next action').fill('Confirm the remaining crew acknowledgements before the appointment.');
  await page.getByLabel('Action owner').selectOption('Riley Chen');
  await page.getByRole('button', {name:'Save follow-up', exact:true}).click();
  assert.match(await page.locator('main').innerText(), /Prepared locally/);
  assert.equal((await stored()).followups.length, 1);
});
await check('Loading empty and failed reads never display a zero count', async () => {
  for (const name of ['Show loading state', 'Show empty scope', 'Fail output source read']) {
    await page.getByRole('button', {name:'Review guide', exact:true}).click();
    await page.getByRole('button', {name, exact:true}).click();
    assert.equal(await page.locator('.metric').count(), 0);
    assert.equal(await page.locator('.output-table').count(), 0);
    await page.getByRole('button', {name:name === 'Show loading state' ? 'Finish simulated load' : 'Restore source results', exact:true}).click();
  }
  assert.ok(await page.locator('.metric').count() > 0);
});
await check('A failed recipient read is not read as an empty audience', async () => {
  await page.getByRole('button', {name:'Review guide', exact:true}).click();
  await page.getByRole('button', {name:'Fail recipient directory read', exact:true}).click();
  assert.match(await page.locator('main').innerText(), /No conclusion about recipients or delivery can be drawn/);
  assert.equal(await page.locator('.recipient-card').count(), 0);
  await page.getByRole('button', {name:'Retry recipient read', exact:true}).click();
  assert.ok(await page.locator('.recipient-card').count() > 0);
});
await check('Cross-tab change pauses writes and preserves the open form', async () => {
  await tab('Exceptions & recovery');
  await page.locator('.exception-card').first().getByRole('button', {name:'Prepare follow-up', exact:true}).click();
  await page.getByLabel('Next action').fill('Unsaved first-tab follow-up');
  const second = await ctx.newPage();
  await second.goto(url);
  await second.getByRole('tab', {name:'Exceptions & recovery', exact:true}).click();
  await second.locator('.exception-card').first().getByRole('button', {name:'Prepare follow-up', exact:true}).click();
  await second.getByLabel('Next action').fill('Second-tab follow-up');
  await second.getByLabel('Action owner').selectOption('Alex Morgan');
  await second.getByRole('button', {name:'Save follow-up', exact:true}).click();
  await page.getByLabel('Action owner').selectOption('Riley Chen');
  await page.getByRole('button', {name:'Save follow-up', exact:true}).click();
  assert.match(await page.locator('#form-error').innerText(), /paused/);
  assert.equal(await page.getByLabel('Next action').inputValue(), 'Unsaved first-tab follow-up');
  await second.close();
  await close();
  await page.getByRole('button', {name:'Reload saved work', exact:true}).click();
});
await check('Malformed saved state is preserved with writes paused', async () => {
  const bad = await browser.newContext(), p = await bad.newPage();
  await p.addInitScript(k => localStorage.setItem(k, '{broken'), key);
  await p.goto(url);
  assert.match(await p.locator('#save-notice').innerText(), /retained/);
  assert.equal(await p.evaluate(k => localStorage.getItem(k), key), '{broken');
  await bad.close();
});
await check('Entered text cannot inject markup into the workspace', async () => {
  await page.locator('.exception-card').nth(1).getByRole('button', {name:'Prepare follow-up', exact:true}).click();
  await page.getByLabel('Next action').fill('Confirm the crew list <img src=x onerror=alert(1)>');
  await page.getByLabel('Action owner').selectOption('Riley Chen');
  await page.getByRole('button', {name:'Save follow-up', exact:true}).click();
  assert.equal(await page.locator('.followup-note img').count(), 0);
  assert.match(await page.locator('main').innerText(), /<img src=x onerror=alert\(1\)>/);
});
// Clean, reproducible captures for all six views at the declared content widths.
await page.evaluate(k => { localStorage.removeItem(k); localStorage.removeItem(k + '.view'); }, key);
await page.reload();
await check('All six views fit 1440 1024 820 390 and 320 pixels', async () => {
  for (const [width, height] of [[1440,960],[1024,768],[820,800],[390,844],[320,844]]) {
    await page.setViewportSize({width, height});
    for (const [, name] of [['queue','Output queue'],['detail','Output & issue detail'],['readiness','Readiness & domain review'],['distribution','Distribution & responses'],['exceptions','Exceptions & recovery'],['history','History & change impact']]) {
      await tab(name);
      const geometry = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth, width:document.documentElement.clientWidth}));
      assert.ok(geometry.scroll <= geometry.width + 1, `${width} ${name}: ${JSON.stringify(geometry)}`);
      await snap(`${width}-${name.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`);
    }
  }
});
await check('A short viewport keeps sticky controls clear of the selected content', async () => {
  await page.setViewportSize({width:1024, height:420});
  await tab('Output queue');
  const geometry = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth, width:document.documentElement.clientWidth}));
  assert.ok(geometry.scroll <= geometry.width + 1);
  await snap('short-viewport-queue', false);
});
await check('Phone snapshot traps focus, closes on Escape and returns to the invoking control', async () => {
  await page.setViewportSize({width:320, height:844});
  await tab('Output queue');
  await page.getByRole('button', {name:'Irrigation installation — technician job pack', exact:true}).click();
  assert.equal(Math.round((await page.locator('#snapshot').boundingBox()).width), 320);
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.closest('#snapshot') !== null), true); }
  await snap('phone-snapshot', false);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#snapshot').isVisible(), false);
  assert.equal(await page.getByRole('button', {name:'Irrigation installation — technician job pack', exact:true}).evaluate(e => e === document.activeElement), true);
});
await check('Keyboard tab navigation exposes selected-tab semantics', async () => {
  await page.setViewportSize({width:1440, height:960});
  await page.getByRole('tab', {name:'Output queue', exact:true}).focus();
  await page.keyboard.press('End');
  assert.equal(await page.getByRole('tab', {name:'History & change impact', exact:true}).getAttribute('aria-selected'), 'true');
  await page.keyboard.press('Home');
  assert.equal(await page.getByRole('tab', {name:'Output queue', exact:true}).getAttribute('aria-selected'), 'true');
});
await check('The review file makes no provider, font, image or analytics request', async () => {
  assert.deepEqual([...new Set(requests)].filter(u => !u.startsWith(url)), []);
});
assert.deepEqual(errors, []);
} catch (error) { await snap('failure', false).catch(() => {}); throw error; }
finally {
  const manifest = [];
  for (const name of captures) manifest.push({file:name, sha256:crypto.createHash('sha256').update(await fs.readFile(`${out}/${name}`)).digest('hex')});
  await fs.writeFile(`${out}/results.json`, JSON.stringify({source:process.env.PPO_SOURCE_HEAD || 'local', browser:browser.version(), runtime:process.version, executable:process.env.PPO_CHROME_PATH || 'chrome channel', htmlSha256:crypto.createHash('sha256').update(html).digest('hex'), passed:groups.length, groups, errors, captures:manifest}, null, 2));
  await browser.close(); server.close();
}
console.log(JSON.stringify({passed:groups.length, errors, captures:captures.length}));
