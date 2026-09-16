import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html');
const out = path.join(root, 'verification-evidence/estimate-actual-review');
await fs.mkdir(out, {recursive: true});
/* CI uses the repository's pinned Chrome channel. PPO_BROWSER_EXECUTABLE lets a
   local run use an already-installed Chromium; the manifest records which ran. */
const executablePath = process.env.PPO_BROWSER_EXECUTABLE || null;
const browser = await chromium.launch(executablePath ? {executablePath, headless: true} : {channel: 'chrome', headless: true});
const context = await browser.newContext({viewport: {width: 1440, height: 960}, acceptDownloads: true});
const page = await context.newPage();
const errors = [], results = [], images = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const action = name => page.locator(`[data-action="${name}"]`);
const nav = name => page.locator(`#tabs [data-view="${name}"]`);
const modal = () => page.locator('#modal');
const demo = () => page.evaluate(() => window.EAR_DEMO.state());
const totals = () => page.evaluate(() => window.EAR_DEMO.totals());
const identity = () => page.evaluate(() => window.EAR_DEMO.identity());
const submit = async () => { await page.locator('#modal-submit').click(); await modal().waitFor({state: 'hidden', timeout: 8000}); };
const role = async value => { await action('options').click(); await page.getByLabel('Preview role', {exact: true}).selectOption(value); await submit(); };
const snap = async name => { await page.screenshot({path: path.join(out, name + '.png'), fullPage: true}); images.push(name + '.png'); };
const check = async (name, fn) => { await fn(); results.push({name, result: 'Passed'}); };

try {
  await page.goto(pathToFileURL(file).href);
  await page.locator('.queue-table tbody tr').first().waitFor();

  await check('Five views and the five-row register render with named views', async () => {
    assert.equal(await page.locator('#tabs [data-view]').count(), 5);
    assert.equal(await page.locator('.queue-table tbody tr').count(), 5);
    assert.equal(await page.locator('.snapshot button').count(), 5);
    assert.match(await page.locator('.demo-strip').innerText(), /AUD, excluding GST/);
    await snap('1440-register');
  });

  await check('Named views, filters and search narrow the same register and recover', async () => {
    await action('named').filter({hasText: 'Ready for review'}).click();
    assert.equal(await page.locator('.queue-table tbody tr').count(), 1);
    await action('named').filter({hasText: 'Awaiting evidence'}).click();
    assert.equal(await page.locator('.queue-table tbody tr').count(), 3);
    await page.locator('#filter-family').selectOption('Screen Systems');
    assert.equal(await page.locator('.queue-table tbody tr').count(), 2);
    await page.getByLabel('Search outcome reviews').fill('no matching outcome review');
    assert.match(await page.locator('#content').innerText(), /No matching reviews/);
    await action('clear').first().click();
    await action('named').filter({hasText: 'Awaiting evidence'}).click();
    assert.match(await page.locator('.count-line').innerText(), /view: All reviews/);
    assert.equal(await page.locator('.queue-table tbody tr').count(), 5);
  });

  await check('Delivery completion and financial completeness are separate columns', async () => {
    const row = page.locator('.queue-table tbody tr').first();
    assert.match(await row.innerText(), /Partial/);
    assert.match(await row.innerText(), /source observation has no recorded treatment|Draft/);
  });

  await check('Selecting a review keeps the search context and opens its basis', async () => {
    await page.getByLabel('Search outcome reviews').fill('SYN-EAR-0001');
    await page.locator('[data-action="select"][data-review="ear-1"]').click();
    assert.equal(await page.locator('#tabs [aria-current="page"]').innerText(), 'Estimate & accepted basis');
    await nav('register').click();
    assert.equal(await page.getByLabel('Search outcome reviews').inputValue(), 'SYN-EAR-0001');
    await action('clear').first().click();
    await nav('basis').click();
  });

  await check('Issued and accepted bases are shown separately with their supplier sources', async () => {
    const text = await page.locator('#content').innerText();
    assert.match(text, /SYN-PPO-EST-000042 · cost version r03/);
    assert.match(text, /SYN-PPO-EST-000042 · cost version r04/);
    assert.match(text, /50,424\.00/);
    assert.match(text, /46,804\.80/);
    assert.match(text, /No cost basis recorded/);
    assert.match(text, /Margin and profitability are withheld/);
    await snap('1440-basis');
  });

  await check('A retained basis snapshot opens without altering the record', async () => {
    await page.locator('[data-action="snapshot"][data-basis="issued"]').click();
    assert.match(await page.locator('#modal-title').innerText(), /Issued estimate cost version/);
    assert.match(await page.locator('#modal-body').innerText(), /latest estimate is never substituted/);
    await page.locator('#cancel-button').click();
  });

  await check('Declaring the comparison basis records what it includes', async () => {
    await action('basis').click();
    await page.locator('#modal-body input[value="var-1"]').check();
    await page.locator('#modal-body input[value="var-2"]').check();
    await page.getByLabel('What this comparison basis includes').fill('Accepted cost version r04 plus approved variation SYN-PPO-VAR-024101. SYN-PPO-VAR-024102 has no recorded cost basis and is acknowledged.');
    await submit();
    const text = await page.locator('#content').innerText();
    assert.match(text, /Declared comparison basis/);
    assert.match(text, /SYN-PPO-VAR-024101/);
    const t = await totals();
    assert.equal(t.basis.comparison, 5133920);
  });

  await check('Finance validation of the declared basis is a separate act', async () => {
    await role('finance');
    await nav('basis').click();
    await action('financeValidate').click();
    await page.getByLabel('Validation basis').fill('Cost definition and quantity class confirmed for this review only; no Powerplants accounting definition is adopted.');
    await page.locator('#modal input[name=confirm]').check();
    await submit();
    assert.equal((await demo()).reviews[0].financeValidated, true);
  });

  await check('A shared cost cannot be split equally and its remainder is preserved', async () => {
    await role('preparer');
    await nav('actuals').click();
    await page.locator('[data-obs-row="o10"] [data-action="treat"]').click();
    await page.getByLabel('Treatment', {exact: true}).selectOption('Included');
    await page.getByLabel('Why this treatment applies').fill('Provisionally included so that the shared establishment cost can be reviewed for allocation.');
    await page.getByLabel('Reason for any unallocated remainder (optional)').fill('The remaining share belongs to SYN-PPO-PRJ-024102 and is outside this review.');
    await submit();
    await page.locator('[data-obs-row="o10"] [data-action="map"]').click();
    await page.getByLabel('Comparison line', {exact: true}).selectOption({label: 'FRT-INB — Inbound freight (lot)'});
    await page.getByLabel('Share of this source record (0 to 1)').fill('0.5');
    await page.getByLabel('Allocation basis').selectOption('equal');
    await page.getByLabel('Allocation evidence and reason').fill('Half each.');
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /never applied by default/);
    await page.getByLabel('Allocation basis').selectOption('measured');
    await page.getByLabel('Allocation evidence and reason').fill('Measured crane hours were recorded against each project for the shared establishment invoice.');
    await submit();
    assert.match(await page.locator('#content').innerText(), /Unallocated remainder/);
    assert.equal((await totals()).unmappedTotal, 280000);
  });

  await check('An unresolved shared cost and an unissued credit are held outside the comparison', async () => {
    await role('finance');
    await nav('actuals').click();
    for (const [id, reason] of [['o10', 'Held outside this review until an allocation basis is adopted; the full amount stays visible as an outstanding matter.'],
      ['o13', 'An approved supplier claim with no issued credit is not netted against actual cost; it remains an owned outstanding recovery.']]) {
      await page.locator(`[data-obs-row="${id}"] [data-action="treat"]`).click();
      await page.getByLabel('Treatment', {exact: true}).selectOption('Excluded');
      await page.getByLabel('Why this treatment applies').fill(reason);
      await submit();
    }
    const t = await totals();
    assert.equal(t.actual, 6093354);
    assert.equal(t.outstandingTotal, 819220);
    await snap('1440-actuals');
  });

  await check('A commitment and a customer invoice can never be treated as actual cost', async () => {
    await role('preparer');
    await nav('actuals').click();
    await page.locator('[data-obs-row="o11"] [data-action="treat"]').click();
    await page.getByLabel('Treatment', {exact: true}).selectOption('Included');
    await page.getByLabel('Why this treatment applies').fill('Attempting to treat an open purchase order as an incurred cost.');
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /commitment is not an incurred cost/);
    await page.locator('#cancel-button').click();
    assert.equal((await demo()).reviews[0].observations.find(o => o.id === 'o11').treatment, 'Commitment');
  });

  await check('Submission is blocked until the last source is dispositioned', async () => {
    assert.equal(await action('submit').isEnabled(), false);
    await page.locator('[data-obs-row="o9"] [data-action="treat"]').click();
    await page.getByLabel('Treatment', {exact: true}).selectOption('Excluded');
    await page.getByLabel('Why this treatment applies').fill('No comparison line exists for this item and its attribution to this scope is not established.');
    await submit();
    await action('completeness').click();
    await page.getByLabel('Completeness of the source set').selectOption('Partial');
    await page.getByLabel('What is missing or uncertain (required unless complete)').fill('One shared establishment invoice has no adopted allocation basis, one supplier credit is unconfirmed and one invoice line has no comparison line.');
    await submit();
    assert.equal(await action('submit').isEnabled(), true);
  });

  await check('A failed save changes nothing and preserves the entered form', async () => {
    await action('options').click();
    await page.getByLabel('Next record save').selectOption('fail');
    await submit();
    const before = await demo();
    await nav('actuals').click();
    await action('submit').click();
    await page.getByLabel('Submission note for the reviewer').fill('Sources dispositioned to the 31 August cut-off; two matters remain open and are recorded.');
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /Nothing was changed/);
    assert.deepEqual(await demo(), before);
    assert.match(await page.getByLabel('Submission note for the reviewer').inputValue(), /31 August cut-off/);
    await submit();
    assert.equal((await demo()).reviews[0].state, 'ReadyForReview');
  });

  await check('Variance uses actual minus estimated with stated denominators and a reconciling decomposition', async () => {
    await role('reviewer');
    await nav('variance').click();
    await action('claim').click();
    await page.getByLabel('Claim note').fill('Claimed for estimating and commercial review of the Screen Systems outcome.');
    await submit();
    const text = await page.locator('#content').innerText();
    assert.match(text, /\+9,594\.34/);
    assert.match(text, /\+18\.69%/);
    assert.match(text, /655\.20 q/);
    assert.match(text, /Actual only — no estimated cost basis/);
    assert.equal((await identity()).reconciles, true);
    assert.match(text, /Reconciles/);
    await snap('1440-variance');
  });

  await check('An unsuitable denominator shows n/a rather than a misleading percentage', async () => {
    const row = page.locator('.compare-table tbody tr', {hasText: 'ACCESS-V2'});
    assert.match(await row.innerText(), /n\/a/);
    assert.doesNotMatch(await row.innerText(), /%/);
  });

  await check('Conclusion needs a declared materiality and a reason on every material variance', async () => {
    assert.equal(await action('conclude').isEnabled(), false);
    await action('materiality').click();
    await page.getByLabel('Basis for this threshold').fill('Proposed review-level threshold; no Powerplants materiality policy is adopted.');
    await submit();
    assert.match(await page.locator('#content').innerText(), /material variance needs at least one reviewed reason/);
    const causes = [['SCR-CLOTH', 'RATE-PURCHASE', '0.65', 'The supplier price moved from 8.40 to 8.95 per square metre after the quotation validity expired.'],
      ['SCR-CLOTH', 'QTY-ASSUMPTION', '0.3', 'The take-off did not allow for the shrinkage the installer applied on site.'],
      ['SCR-DRIVE', 'RECOVERY', '1', 'A fifth drive unit replaced a transit-damaged unit. The approved supplier claim is not netted against this cost.'],
      ['SCR-INST', 'QTY-ASSUMPTION', '0.7', 'Installation hours were estimated on a four-span assumption without the additional gutter-height access time.'],
      ['SCR-INST', 'SITE-COND', '0.3', 'Crop re-planting under the work area reduced available working width for two weeks.'],
      ['FRT-INB', 'FREIGHT', '1', 'Inbound sea freight and customs handling exceeded the lump allowance carried in the estimate.'],
      ['SCR-CLOTH-V1', 'RATE-PURCHASE', '1', 'Blackout cloth was purchased at the current list rate rather than the rate held on the variation cost basis.'],
      ['SCR-INST-V1', 'QTY-ASSUMPTION', '1', 'Variation installation hours were estimated without the additional edge-fixing work the blackout screen required.']];
    for (const [code, reason, share, note] of causes) {
      await page.locator('.compare-table tbody tr', {hasText: code}).first().locator('[data-action="explain"]').click();
      await page.getByLabel('Contributing cause').selectOption(reason);
      await page.getByLabel('Share of the observed difference (0 to 1)').fill(share);
      await page.getByLabel('Reviewed explanation and its evidence').fill(note);
      await submit();
    }
    assert.match(await page.locator('#content').innerText(), /95% attributed, 5% unexplained/);
    assert.equal(await action('conclude').isEnabled(), true);
  });

  await check('A finding cites its evidence and becomes a proposal before any ES-10 handover', async () => {
    await nav('lessons').click();
    await action('finding').click();
    await page.getByLabel('Finding title').fill('Screen installation hours do not scale with gutter height');
    await page.locator('#modal-body input[value="l3"]').check();
    await page.getByLabel('Observed issue').fill('Installation hours were estimated at a flat rate per span with no allowance for gutter height or access method.');
    await page.getByLabel('Reviewed explanation').fill('Reviewed as an original quantity assumption with a contributing site condition.');
    await page.getByLabel('Applicability and limitations').fill('One delivered job at one site. This is a single case, not a validated rule or a benchmark, and it has no sample size.');
    await page.getByLabel('Proposed improvement').fill('Propose an ES-10 reference case and an estimating input question for gutter height and access method.');
    await page.getByLabel('Responsible owner').selectOption('Dana Okafor');
    await page.getByLabel('Required specialist or commercial review').fill('Estimating review and ES-08 specialist confirmation required before any input or range change.');
    await submit();
    assert.equal(await action('handover').count(), 0);
    await action('findingReview').click();
    await page.getByLabel('Review outcome and what the evidence supports').fill('Reviewed against the exact comparison evidence; the cause is accepted for this job only.');
    await submit();
    await action('handover').click();
    await page.getByLabel('Receiving note for ES-10, including the limits of this single case').fill('Single reference case with its comparison evidence, reviewed cause and stated limits for ES-10.');
    await submit();
    const text = await page.locator('#content').innerText();
    assert.match(text, /Handed to ES-10/);
    assert.match(text, /No formula, input range, parts mapping, labour rate, catalogue price/);
    assert.match(text, /Prepared locally/);
    await snap('1440-lessons');
  });

  await check('The ES-10 handover changed no estimating basis or historical result', async () => {
    const t = await totals();
    assert.equal(t.basis.issued, 5042400);
    const state = await demo();
    assert.equal(state.reviews[0].lines.find(l => l.id === 'l3').estRate, 6800);
    assert.equal(state.reviews[1].state, 'Reviewed');
  });

  await check('A lost response is recovered without creating a second record', async () => {
    await action('options').click();
    await page.getByLabel('Next record save').selectOption('unknown');
    await submit();
    await action('action').click();
    await page.getByLabel('Action title').fill('Agree the shared establishment allocation basis');
    await page.getByLabel('Why this follow-up is required').fill('The shared crane invoice cannot be allocated until a basis is adopted with Finance.');
    await page.getByLabel('Responsible owner').selectOption('Priya Raman');
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /response to this save was lost/);
    await page.locator('#cancel-button').click();
    assert.match(await page.locator('#recovery').innerText(), /A save response was lost/);
    const before = await demo();
    await action('recover').click();
    assert.deepEqual(await demo(), before);
    assert.equal((await demo()).reviews[0].actions.length, 1);
  });

  await check('A review with open financial matters can only be concluded as provisional', async () => {
    await nav('variance').click();
    await action('conclude').click();
    assert.match(await page.locator('#modal-body').innerText(), /can only be concluded as provisional/);
    assert.equal(await page.getByLabel('Review outcome').locator('option').count(), 1);
    await page.getByLabel('Conclusion basis').fill('Reviewed to the 31 August cut-off. The supplier recovery, the shared-cost allocation basis and one unmapped invoice line remain open and owned.');
    await submit();
    const state = await demo();
    assert.equal(state.reviews[0].state, 'ReviewedProvisional');
    assert.equal(state.reviews[0].concluded.totals.deliveryVariance, 959434);
    assert.match(await page.locator('#content').innerText(), /Reviewed — provisional/);
    await snap('1440-conclusion');
  });

  await check('Concluding the review closes no originating record', async () => {
    const state = await demo();
    assert.equal(state.reviews[0].outstanding.filter(o => o.status === 'Open').length, 3);
    assert.equal(state.reviews[0].observations.find(o => o.id === 'o13').sourceStatus, 'Approved — credit not issued');
    assert.equal(state.reviews[0].deliveryRef, 'SYN-PPO-PRJ-024101');
  });

  await check('Reload retains every recorded decision exactly', async () => {
    const before = await demo();
    await page.reload();
    await page.locator('#context').waitFor();
    assert.deepEqual(await demo(), before);
  });

  await check('A source change after conclusion preserves the concluded result and demands a refresh', async () => {
    await role('finance');
    await action('options').click();
    await action('sourceChange').click();
    await page.getByLabel('Source record that changed').selectOption('o6');
    await page.getByLabel('Revised amount in AUD (optional)').fill('4620.00');
    await page.getByLabel('What changed in the source').fill('A revised freight invoice was posted after the review cut-off.');
    await submit();
    await nav('variance').click();
    assert.match(await page.locator('#content').innerText(), /Sources changed after this comparison was captured/);
    const state = await demo();
    assert.equal(state.reviews[0].concluded.totals.deliveryVariance, 959434);
    assert.equal((await totals()).deliveryVariance, 1003434);
    await snap('1440-source-changed');
  });

  await check('A successor review carries the new evidence and preserves the predecessor', async () => {
    await role('reviewer');
    await nav('variance').click();
    await action('successor').click();
    await page.getByLabel('Why a successor review is needed').fill('A revised freight invoice was posted after the cut-off and needs its own reviewed comparison.');
    await submit();
    const state = await demo();
    assert.equal(state.reviews.length, 6);
    const successor = state.reviews[5];
    assert.equal(successor.ref, 'SYN-EAR-0001-S2');
    assert.equal(successor.supersedes, 'ear-1');
    assert.equal(state.reviews[0].state, 'ReviewedProvisional');
    assert.equal(state.reviews[0].concluded.totals.deliveryVariance, 959434);
  });

  await check('The read-only observer sees no restricted amount anywhere', async () => {
    await role('observer');
    for (const view of ['register', 'basis', 'actuals', 'variance', 'lessons']) {
      await nav(view).click();
      const text = await page.locator('#content').innerText();
      assert.doesNotMatch(text, /50,424\.00|46,804\.80|60,933\.54|9,594\.34|8\.95/, `${view} exposed a restricted amount`);
    }
    await nav('variance').click();
    assert.match(await page.locator('#content').innerText(), /Restricted narrative/);
    assert.equal(await action('explain').count(), 0);
    assert.equal(await action('conclude').count(), 0);
    await nav('actuals').click();
    assert.doesNotMatch(await page.locator('#content').innerText(), /8\.40|8\.95/);
    await snap('1440-observer');
  });

  await check('Search never matches a restricted amount and the export strips them', async () => {
    await nav('register').click();
    await page.getByLabel('Search outcome reviews').fill('60933.54');
    assert.match(await page.locator('#content').innerText(), /No matching reviews/);
    await action('clear').first().click();
    await action('options').click();
    const pendingDownload = page.waitForEvent('download');
    await action('export').click();
    const download = await pendingDownload;
    const location = path.join(out, 'exported-observer-session.json');
    await download.saveAs(location);
    const envelope = JSON.parse(await fs.readFile(location, 'utf8'));
    assert.equal(envelope.role, 'observer');
    assert.match(envelope.state.restrictedRemoved, /removed/);
    assert.equal(envelope.state.reviews[0].observations[0].amount, null);
    assert.equal(envelope.state.reviews[0].bases.issued.price, null);
    assert.equal(envelope.state.reviews[0].explanations[0].note, 'Restricted narrative');
    assert.equal(envelope.state.reviews[0].observations[0].treatmentReason, 'Restricted narrative');
    assert.doesNotMatch(JSON.stringify(envelope), /8\.95 per square metre/);
    await page.locator('#cancel-button').click();
  });

  await check('All five views fit desktop, tablet and phone viewports without horizontal overflow', async () => {
    await role('reviewer');
    for (const [width, height] of [[1440, 960], [1024, 768], [820, 800], [390, 844], [320, 740]]) {
      await page.setViewportSize({width, height});
      for (const view of ['register', 'basis', 'actuals', 'variance', 'lessons']) {
        await nav(view).click();
        await page.evaluate(() => document.fonts.ready);
        assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${view} overflows at ${width}px`);
        if ([1440, 390, 320].includes(width)) await snap(`${width}-${view}`);
      }
    }
  });

  await check('Keyboard navigation, dialog escape and the skip link behave correctly', async () => {
    await page.setViewportSize({width: 1440, height: 960});
    await nav('register').click();
    await nav('register').focus();
    await nav('register').press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.view), 'basis');
    await page.getByRole('button', {name: 'Page guide', exact: true}).click();
    await modal().press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'guide');
    await page.locator('.skip').focus();
    await page.locator('.skip').press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'content');
  });

  await check('A damaged saved session is preserved rather than overwritten', async () => {
    const raw = '{invalid-outcome-review-json';
    await page.evaluate(value => localStorage.setItem('ppo-estimate-actual-review-r01', value), raw);
    await page.reload();
    await action('raw').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('ppo-estimate-actual-review-r01')), raw);
    assert.match(await page.locator('#content').innerText(), /Saved session needs attention/);
    await action('raw').click();
    assert.match(await page.locator('#modal-body').innerText(), /saved bytes are preserved/);
    await page.locator('#cancel-button').click();
  });

  assert.deepEqual(errors, []);
} catch (error) {
  await snap('failure');
  results.push({name: 'Native browser failure', result: 'Failed', message: error.stack,
    dialog: await page.locator('#modal-body').innerText().catch(() => ''),
    toast: await page.locator('#toast').textContent().catch(() => '')});
  process.exitCode = 1;
} finally {
  const manifest = {
    source: process.env.PPO_SOURCE_HEAD || 'local',
    html_sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex'),
    browser: await browser.version(),
    browser_source: executablePath ? `explicit executable ${executablePath}` : 'pinned chrome channel',
    groups: results.length, results, errors,
    images: await Promise.all(images.map(async name => ({name, sha256: createHash('sha256').update(await fs.readFile(path.join(out, name))).digest('hex')})))
  };
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
  await browser.close();
}
