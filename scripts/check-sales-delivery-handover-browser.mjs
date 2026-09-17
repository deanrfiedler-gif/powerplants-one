/* Native browser checks for the CR-03 Sales-to-Delivery Handover design r01.
   Uses the repository's pinned Playwright. PPO_CHROME_PATH selects an explicit
   Chromium binary where the `chrome` channel is not installed; the manifest
   always records the browser version actually used. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html');
const out = path.join(root, 'verification-evidence/sales-delivery-handover');
await fs.mkdir(out, {recursive: true});

const launch = process.env.PPO_CHROME_PATH
  ? {executablePath: process.env.PPO_CHROME_PATH, headless: true}
  : {channel: 'chrome', headless: true};
const browser = await chromium.launch(launch);
const context = await browser.newContext({viewport: {width: 1440, height: 960}, acceptDownloads: true});
const page = await context.newPage();
const errors = [], results = [], images = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const action = (name) => page.locator(`[data-action="${name}"]`);
const nav = (name) => page.locator(`#tabs [data-view="${name}"]`);
const modal = () => page.locator('#modal');
const state = () => page.evaluate(() => window.CR3_DEMO.state());
const handover = async (id) => (await state()).handovers.find((h) => h.id === id);
const submit = async () => { await page.locator('#modal-submit').click(); await modal().waitFor({state: 'hidden', timeout: 8000}); };
const role = async (v) => { await action('options').click(); await page.locator('#modal-form [name=role]').selectOption(v); await submit(); };
const option = async (name, v) => { await action('options').click(); await page.locator(`#modal-form [name=${name}]`).selectOption(v); await submit(); };
const snap = async (name) => {
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.hidden = true; });
  await page.screenshot({path: path.join(out, name + '.png'), fullPage: true});
  images.push(name + '.png');
};
const check = async (name, fn) => { await fn(); results.push({name, result: 'Passed'}); };
const selectHandover = async (id) => { await page.locator('[name=handover-select]').selectOption(id); };

try {
  await page.goto(pathToFileURL(file).href);
  await page.locator('.queue-table tbody tr').first().waitFor();

  await check('Register renders five permitted handovers and six views', async () => {
    assert.equal(await page.locator('#tabs [data-view]').count(), 6);
    assert.equal(await page.locator('.queue-table tbody tr').count(), 5);
    assert.match(await page.locator('.count-line').innerText(), /Showing 5 of 5/);
    await snap('1440-register');
  });

  await check('Summary counts open exactly their contributing records', async () => {
    const cells = page.locator('.snapshot button');
    const counts = await cells.allInnerTexts();
    await cells.nth(0).click();
    assert.equal(await page.locator('.queue-table tbody tr').count(), Number(counts[0].split('\n')[0]));
    assert.match(await page.locator('.queue-table tbody tr').first().innerText(), /Cedar Vale/);
    await cells.nth(3).click();
    assert.equal(await page.locator('.queue-table tbody tr').count(), Number(counts[3].split('\n')[0]));
    assert.match(await page.locator('.queue-table tbody tr').first().innerText(), /Greenhaven/);
    await action('clear').first().click();
    assert.equal(await page.locator('.queue-table tbody tr').count(), 5);
  });

  await check('Search, filters and the empty result are distinct from an unavailable source', async () => {
    await page.getByLabel('Search handovers').fill('Willowbank');
    assert.equal(await page.locator('.queue-table tbody tr').count(), 1);
    await page.getByLabel('Search handovers').fill('no matching handover');
    assert.match(await page.locator('#content').innerText(), /No handover matches this view/);
    assert.match(await page.locator('#content').innerText(), /not an unavailable source or a restricted record/);
    await action('clear').first().click();
    await page.locator('[name=filter-destination]').selectOption('Service');
    assert.equal(await page.locator('.queue-table tbody tr').count(), 1);
    await action('clear').first().click();
    await option('source', 'loading');
    assert.match(await page.locator('#content').innerText(), /has not finished loading/);
    await option('source', 'partial');
    assert.match(await page.locator('#content').innerText(), /could not be read for this register/);
    await option('source', 'complete');
  });

  await check('Restricted identity sees fewer records, no amounts and a stated exclusion', async () => {
    await role('viewer');
    assert.equal(await page.locator('.queue-table tbody tr').count(), 4);
    const line = await page.locator('.count-line').innerText();
    assert.match(line, /Showing 4 of 4/);
    assert.match(line, /1 record\(s\) are not available to this identity/);
    assert.doesNotMatch(await page.locator('#content').innerText(), /Cedar Vale/);
    await page.getByLabel('Search handovers').fill('Cedar');
    assert.equal(await page.locator('.queue-table tbody tr').count(), 0);
    await action('clear').first().click();
    await nav('basis').click();
    assert.match(await page.locator('#content').innerText(), /Restricted/);
    assert.doesNotMatch(await page.locator('#content').innerText(), /\$154,566\.67/);
    await snap('1440-restricted-basis');
    await role('sales');
  });

  await check('Accepted commercial basis shows the exact accepted amounts and evidence', async () => {
    await selectHandover('ho-1');
    await nav('basis').click();
    const text = await page.locator('#content').innerText();
    for (const expected of ['$154,566.67', '$15,456.67', '$170,023.34', 'SYN-PPO-QUO-000142 R02', 'SYN-PO-RB-4471', 'Immutable within this workspace']) {
      assert.ok(text.includes(expected), `Accepted basis is missing ${expected}`);
    }
    assert.match(text, /Customer-requested date/);
    assert.match(text, /Quoted assumption/);
    assert.match(text, /Confirmed commitment/);
    assert.match(text, /SYN-PPO-DWG-000142 r01[\s\S]{0,40}Missing/);
    await snap('1440-basis');
  });

  await check('Customer 360 and opportunity snapshots keep transfer and handover-due facts separate', async () => {
    await action('snapshot').filter({hasText: 'Customer 360'}).first().click();
    let body = await page.locator('#modal-body').innerText();
    assert.match(body, /SYN Riverbend Produce Pty Ltd/);
    assert.match(body, /Operator, owner and bill payer are separate meanings/);
    await page.locator('#cancel-button').click();
    await nav('destination').click();
    await action('snapshot').filter({hasText: 'Opportunity'}).first().click();
    body = await page.locator('#modal-body').innerText();
    assert.match(body, /Due · created/);
    assert.match(body, /opportunity_handovers_due/);
    assert.match(body, /Alex Morgan → Priya Raman/);
    assert.match(body, /neither confirms a receiving owner nor completes the handover obligation|It changes who pursues the sale/);
    await page.locator('#cancel-button').click();
  });

  await check('Destination shows the ES-07 outcome and offers no retry', async () => {
    const text = await page.locator('#content').innerText();
    assert.match(text, /Confirmed/);
    assert.match(text, /SYN-SO-00001/);
    assert.match(text, /creates no second conversion, no retry/);
    assert.match(text, /Allocated to this destination/);
    assert.ok(text.includes('$154,566.67'), 'Allocated subtotal should equal the accepted total when fully allocated');
    await snap('1440-destination');
  });

  await check('Readiness separates acceptance evidence from work-release prerequisites', async () => {
    await nav('readiness').click();
    const text = await page.locator('#content').innerText();
    assert.match(text, /Required before receiving responsibility can be accepted/);
    assert.match(text, /must be satisfied before work release/);
    assert.match(text, /A checklist acknowledgement is not permission/);
    assert.match(text, /CR3-RULE-01 — hypothetical demonstration rule set/);
    assert.match(text, /Received — insufficient/);
    await snap('1440-readiness');
  });

  await check('A receiving decision requires the matching receiving team', async () => {
    await nav('decision').click();
    await role('service');
    assert.equal(await action('decide').isDisabled(), true);
    assert.match(await page.locator('#content').innerText(), /This handover is routed to Project/);
    await role('project');
    assert.equal(await action('decide').isDisabled(), false);
  });

  await check('Return for clarification preserves the submission and names owners and dates', async () => {
    await action('decide').click();
    await page.locator('#modal-form [name=decision]').selectOption('Return for clarification');
    await page.locator('#modal-form [name=reason]').fill('The technical brief and the field wiring schedule are not attached at their issued revisions, and the customer pump compatibility responsibility carries no evidence.');
    await page.locator('#modal-form [name=confirm]').check();
    await submit();
    const h = await handover('ho-1');
    assert.equal(h.revisions[0].state, 'Returned');
    assert.equal(h.reviews[0].decision, 'Return for clarification');
    assert.equal(h.reviews[0].findings.length, 2);
    assert.ok(h.reviews[0].findings.every((f) => f.owner && f.due));
    assert.match(await page.locator('#context').innerText(), /Returned for clarification/);
    await snap('1440-returned');
  });

  await check('A return without a finding is refused and the entered text is preserved', async () => {
    await role('sales');
    await action('prepare').click();
    await page.locator('#modal-form [name=note]').fill('Attaching the wiring schedule and answering both returned findings.');
    await submit();
    await action('submit').click();
    assert.match(await page.locator('#modal-body').innerText(), /Owned information gaps remain/);
    await page.locator('#modal-form [name=confirm]').check();
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /information gaps/);
    assert.deepEqual(await state(), before);
    await page.locator('#cancel-button').click();
  });

  await check('A missing document needs a revision and a source, not a checklist tick', async () => {
    await nav('basis').click();
    await page.locator('[data-action=attach]').click();
    assert.match(await page.locator('#modal-body').innerText(), /not a checklist acknowledgement/);
    await page.locator('#modal-form [name=revision]').fill('draft');
    await page.locator('#modal-form [name=source]').fill('Engineering');
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /exact issued revision/);
    assert.deepEqual(await state(), before);
    await page.locator('#modal-form [name=revision]').fill('r01');
    await page.locator('#modal-form [name=source]').fill('Engineering & Design Control, issued drawing register.');
    await submit();
    const d = (await handover('ho-1')).commercial.documents.find((x) => x.ref === 'SYN-PPO-DWG-000142');
    assert.equal(d.state, 'Available');
    assert.equal(d.revision, 'r01');
    assert.match(d.suppliedFrom, /Engineering & Design Control/);
  });

  await check('Correcting both returned findings clears the acceptance blockers', async () => {
    await role('project');
    await nav('readiness').click();
    await page.locator('[data-action=requirement][data-id=req-brief]').click();
    await page.locator('#modal-form [name=status]').selectOption('Received — reviewed');
    await page.locator('#modal-form [name=finding]').fill('Technical brief r02 was inspected against its issued revision; the wiring schedule is still outstanding and is recorded as an obligation.');
    await page.locator('#modal-form [name=sourceRef]').fill('SYN-PPO-BRF-000142 r02');
    await submit();
    await page.locator('[data-action=requirement][data-id=req-customer]').click();
    await page.locator('#modal-form [name=status]').selectOption('Received — reviewed');
    await page.locator('#modal-form [name=finding]').fill('Pump compatibility is recorded as an outstanding customer responsibility with a named owner and date.');
    await submit();
    const h = await handover('ho-1');
    assert.equal(h.requirements.find((r) => r.id === 'req-brief').status, 'Received — reviewed');
    assert.equal(h.requirements.find((r) => r.id === 'req-brief').history.length, 1);
  });

  await check('Resubmission creates a successor revision and a readable comparison', async () => {
    await role('sales');
    await nav('decision').click();
    await action('submit').click();
    await page.locator('#modal-form [name=confirm]').check();
    await submit();
    const h = await handover('ho-1');
    assert.equal(h.revisions.length, 2);
    assert.equal(h.revisions[0].state, 'Returned');
    assert.equal(h.revisions[1].state, 'Submitted');
    const comparison = await page.locator('.compare').innerText();
    assert.match(comparison, /requirements/);
    assert.match(comparison, /Received — reviewed/);
    assert.ok(await page.locator('.compare .changed').count() >= 2);
    await snap('1440-comparison');
  });

  await check('Acceptance binds the reviewed revision and keeps release prerequisites open', async () => {
    await role('project');
    await action('decide').click();
    await page.locator('#modal-form [name=decision]').selectOption('Accept with outstanding obligations');
    await page.locator('#modal-form [name=reason]').fill('The corrected revision carries the reviewed technical brief and the named customer responsibility. Responsibility for delivering the reviewed Project scope is accepted.');
    await page.locator('#modal-form [name=o-title]').first().fill('Obtain the customer pump compatibility confirmation');
    await page.locator('#modal-form [name=confirm]').check();
    await submit();
    const h = await handover('ho-1');
    const accepted = h.reviews.at(-1);
    assert.equal(accepted.decision, 'Accept with outstanding obligations');
    assert.equal(accepted.rev, 'r02');
    assert.equal(accepted.revisionFingerprint, h.revisions[1].fingerprint);
    assert.equal(accepted.boundSources.quotation, 'SYN-PPO-QUO-000142 R02');
    assert.ok(accepted.releaseAtAcceptance.length >= 3, 'Release prerequisites must survive acceptance');
    assert.equal(h.obligations.length, 1);
    assert.match(await page.locator('#context').innerText(), /Accepted — follow-through outstanding/);
    await snap('1440-accepted');
  });

  await check('A source change after acceptance requires renewed acceptance and keeps the original', async () => {
    const before = (await handover('ho-1')).reviews.length;
    await action('options').click();
    await action('sourceChange').filter({hasText: 'Supersede the accepted quotation'}).click();
    const h = await handover('ho-1');
    assert.equal(h.reviews.length, before);
    assert.equal(h.reviews.at(-1).boundSources.quotation, 'SYN-PPO-QUO-000142 R02');
    assert.equal(h.commercial.quotation.revision, 3);
    assert.equal(h.commercial.acceptance.state, 'Superseded');
    assert.match(await page.locator('#recovery').innerText(), /Acceptance is never inherited silently/);
    assert.match(await page.locator('#context').innerText(), /Renewed acceptance required/);
    await snap('1440-renewed');
  });

  await check('A stale review is refused while the submitted revision is under review', async () => {
    await selectHandover('ho-2');
    await role('fulfilment');
    await action('options').click();
    await action('sourceChange').filter({hasText: 'Advance a technical document revision'}).click();
    await nav('decision').click();
    await action('decide').click();
    await page.locator('#modal-form [name=decision]').selectOption('Accept responsibility');
    await page.locator('#modal-form [name=reason]').fill('Attempting to accept responsibility after a bound source advanced during the review.');
    await page.locator('#modal-form [name=confirm]').check();
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /bound source changed while this revision was under review/);
    assert.deepEqual(await state(), before);
    await page.locator('#cancel-button').click();
  });

  await check('A lost response recovers the original operation without a second record', async () => {
    await selectHandover('ho-5');
    await nav('history').click();
    await option('nextSave', 'unknown');
    await action('action').last().click();
    await page.locator('#modal-form [name=title]').fill('Reconcile the unknown transducer target in ES-07');
    await page.locator('#modal-form [name=owner]').fill('Jordan · Conversion coordinator');
    await submit();
    assert.match(await page.locator('#recovery').innerText(), /response was lost/);
    const before = await state();
    await action('recover').click();
    assert.deepEqual(await state(), before);
    assert.match(await page.locator('#recovery').innerText(), /no second record was created/);
    assert.equal((await handover('ho-5')).actions.length, 1);
  });

  await check('A failed save changes nothing and preserves the entered text', async () => {
    await option('nextSave', 'fail');
    await action('action').last().click();
    await page.locator('#modal-form [name=title]').fill('Confirm the receiving store contact for the pump parts');
    await page.locator('#modal-form [name=owner]').fill('Sam Whitcombe');
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /could not be saved/);
    assert.deepEqual(await state(), before);
    assert.equal(await page.locator('#modal-form [name=title]').inputValue(), 'Confirm the receiving store contact for the pump parts');
    await page.locator('#cancel-button').click();
  });

  await check('An unresolved conversion blocks fulfilment acceptance and points at ES-07', async () => {
    await nav('decision').click();
    await action('decide').click();
    const body = await page.locator('#modal-body').innerText();
    assert.match(body, /Partially confirmed/);
    assert.match(body, /CR3-RULE-01, hypothetical/);
    await page.locator('#modal-form [name=decision]').selectOption('Accept responsibility');
    await page.locator('#modal-form [name=reason]').fill('Attempting to accept fulfilment responsibility while one target outcome is unknown and one is a confirmed no-effect.');
    await page.locator('#modal-form [name=confirm]').check();
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /Responsibility cannot be accepted/);
    assert.deepEqual(await state(), before);
    await page.locator('#cancel-button').click();
    await nav('destination').click();
    assert.match(await page.locator('#content').innerText(), /OutcomeUnknown/);
    assert.match(await page.locator('#content').innerText(), /FailedNoEffect/);
    await snap('1440-partial-conversion');
  });

  await check('A Won opportunity with missing acceptance evidence cannot be submitted', async () => {
    await role('sales');
    await selectHandover('ho-4');
    await nav('basis').click();
    assert.match(await page.locator('#content').innerText(), /Customer acceptance: Missing/);
    assert.match(await page.locator('#content').innerText(), /A narrative note is not a customer response bound to a quotation issue/);
    await nav('destination').click();
    assert.match(await page.locator('#content').innerText(), /Routing decision required/);
    assert.match(await page.locator('#content').innerText(), /No routing threshold is invented here/);
    assert.equal(await action('route').isDisabled(), true);
    await nav('decision').click();
    await action('prepare').click();
    await page.locator('#modal-form [name=note]').fill('Attempting to prepare a handover for an unaccepted quotation.');
    await submit();
    await action('submit').click();
    await page.locator('#modal-form [name=confirm]').check();
    const before = await state();
    await page.locator('#modal-submit').click();
    await page.locator('#modal-error').waitFor({state: 'visible'});
    assert.match(await page.locator('#modal-error').innerText(), /acceptance evidence is missing/);
    assert.deepEqual(await state(), before);
    await page.locator('#cancel-button').click();
    await snap('1440-missing-acceptance');
  });

  await check('An accepted Service handover keeps an outstanding prerequisite that prevents work release', async () => {
    await selectHandover('ho-3');
    await nav('history').click();
    const text = await page.locator('#content').innerText();
    assert.match(text, /Responsibility accepted with 4 release prerequisite\(s\) still open/);
    assert.match(text, /Work is not authorised or released by this acceptance/);
    const h = await handover('ho-3');
    assert.equal(h.obligations.filter((o) => o.status !== 'Closed').length, 2);
    const chain = await page.locator('.chain').innerText();
    assert.match(chain, /Work authorised or released/);
    assert.match(chain, /Attendance scheduled/);
    assert.match(chain, /Financial processing and reconciliation/);
    assert.equal(await page.locator('.chain [role=listitem]').count(), 9);
    await snap('1440-history-chain');
  });

  await check('Completing one obligation leaves the other prerequisites open', async () => {
    await role('service');
    await nav('decision').click();
    await page.locator('[data-action=obligation]').first().click();
    await page.locator('#modal-form [name=evidence]').fill('The site owner confirmed the segregated visitor route for the exact work area on 16 September 2026.');
    await submit();
    const h = await handover('ho-3');
    assert.equal(h.obligations[0].status, 'Closed');
    assert.equal(h.obligations[1].status, 'Open');
    assert.match(await page.locator('#context').innerText(), /Accepted — follow-through outstanding/);
  });

  await check('Switching customers and identities retains no other context', async () => {
    await selectHandover('ho-1');
    await nav('decision').click();
    const one = await page.locator('#content').innerText();
    assert.match(one, /SYN-PPO-QUO-000142/);
    await selectHandover('ho-3');
    const two = await page.locator('#content').innerText();
    assert.doesNotMatch(two, /SYN-PPO-QUO-000142/);
    assert.doesNotMatch(two, /Riverbend/);
    assert.match(two, /SYN-PPO-QUO-000151/);
    await role('viewer');
    assert.equal(await page.locator('[name=handover-select] option').count(), 4);
    assert.doesNotMatch(await page.locator('#context').innerText(), /Cedar Vale/);
    await role('sales');
  });

  await check('Every view fits desktop, tablet and phone viewports without horizontal scroll', async () => {
    await selectHandover('ho-1');
    for (const [width, height] of [[1440, 960], [1024, 800], [820, 1000], [390, 844], [320, 740]]) {
      await page.setViewportSize({width, height});
      for (const id of ['register', 'basis', 'destination', 'readiness', 'decision', 'history']) {
        await nav(id).click();
        await page.evaluate(() => document.fonts.ready);
        assert.ok(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${id} overflows at ${width}px`);
        if ([1440, 390, 320].includes(width)) await snap(`${width}-${id}-responsive`);
      }
    }
    await page.setViewportSize({width: 1440, height: 960});
  });

  await check('Keyboard navigation, dialog focus return and the skip link behave correctly', async () => {
    await nav('register').click();
    await nav('register').focus();
    await nav('register').press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.view), 'basis');
    await page.getByRole('button', {name: 'Page guide', exact: true}).click();
    await modal().press('Escape');
    await modal().waitFor({state: 'hidden'});
    await page.locator('.skip').focus();
    await page.locator('.skip').press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'content');
    await nav('register').click();
    await page.locator('.queue-table tbody tr').nth(1).focus();
    await page.locator('.queue-table tbody tr').nth(1).press('Enter');
    assert.match(await page.locator('#context').innerText(), /DEMO-HDV-/);
  });

  await check('Reload retains the exact saved records', async () => {
    const before = await state();
    await page.reload();
    await page.locator('#context').waitFor();
    assert.deepEqual(await state(), before);
  });

  await check('Export contains the exact current session', async () => {
    await action('options').click();
    const pending = page.waitForEvent('download');
    await action('export').click();
    const download = await pending;
    const location = path.join(out, 'exported-session.json');
    await download.saveAs(location);
    const envelope = JSON.parse(await fs.readFile(location, 'utf8'));
    await page.locator('#cancel-button').click();
    assert.deepEqual(envelope.state, await state());
    assert.equal(envelope.synthetic, true);
  });

  await check('A damaged saved session is preserved rather than overwritten', async () => {
    const raw = '{not-valid-handover-json';
    await page.evaluate((raw) => localStorage.setItem('ppo-cr03-handover-r01', raw), raw);
    await page.reload();
    await action('raw').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('ppo-cr03-handover-r01')), raw);
    assert.match(await page.locator('#recovery').innerText(), /Saved session needs attention/);
    await snap('1440-damaged-session');
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
    launch: process.env.PPO_CHROME_PATH ? 'explicit executablePath' : 'chrome channel',
    groups: results.length, results, errors,
    images: await Promise.all(images.map(async (name) => ({name, sha256: createHash('sha256').update(await fs.readFile(path.join(out, name))).digest('hex')}))),
  };
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({...manifest, images: manifest.images.length}, null, 2));
  await browser.close();
}
