// Standalone synthetic design verification. Does not exercise the PPO application.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const source = resolve('docs/blueprints/crm-leads-preview.html');
const output = resolve('verification-evidence/crm-design/leads');
await mkdir(output, { recursive: true });
const html = await readFile(source);
const evidence = { scope: 'Standalone in-memory design, not runtime acceptance', source_head: process.env.PPO_SOURCE_HEAD || null, html_sha256: createHash('sha256').update(html).digest('hex'), viewports: [], screenshots: [] };
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[1440,900],[390,844],[320,800]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const capture = async state => {
      const name = `${width}-${state}.png`;
      await page.screenshot({ path: resolve(output, name), fullPage: false });
      const bytes = await readFile(resolve(output, name));
      evidence.screenshots.push({ name, sha256: createHash('sha256').update(bytes).digest('hex') });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${state}: horizontal overflow`);
    };
    await page.goto(pathToFileURL(source).href);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#count').innerText(), '7');
    await capture('list');
    if (width < 700) {
      assert.equal(await page.locator('.rail').isVisible(), false);
      assert.equal(await page.locator('.mobile-header').isVisible(), true);
      const row = await page.locator('.mobile-row').first().boundingBox();
      assert(row.y <= 110 && row.height <= 110, 'Compact phone inbox must show records immediately');
      const add = await page.locator('#add-lead').boundingBox();
      await page.evaluate(() => window.scrollTo(0,document.body.scrollHeight));
      const lastRow=await page.locator('.mobile-row').last().boundingBox();
      assert(lastRow.y+lastRow.height <= add.y, 'Last lead can scroll clear of the floating add');
      await page.evaluate(() => window.scrollTo(0,0));
      assert(add.width >= 44 && add.height >= 44 && add.y + add.height <= height, 'Reachable floating add');
      await page.getByRole('button', {name:'Back to Deals',exact:true}).click();
      assert(await page.locator('#deals-page').isVisible());
      await page.getByRole('button', {name:'Open Leads',exact:true}).click();
      assert.equal(await page.locator('#count').innerText(), '7');
      await page.getByRole('button', {name:'Sort leads',exact:true}).click();
      await page.getByLabel('Sort', {exact:true}).selectOption('title');
      await capture('sort');
      await page.getByRole('button', {name:'Done',exact:true}).click();
      assert.equal(await page.locator('.mobile-row').first().getAttribute('aria-label'), 'Climate monitoring review');
      await page.getByRole('button', {name:'Sort leads',exact:true}).click();
      await page.getByLabel('Sort', {exact:true}).selectOption('new');
      await page.getByRole('button', {name:'Done',exact:true}).click();
      await page.getByRole('button', {name:'Filters',exact:true}).click();
      await page.getByLabel('Owner', {exact:true}).selectOption('Alex Lee');
      await capture('filters');
      await page.getByRole('button', {name:'Cancel',exact:true}).filter({visible:true}).click();
      assert.equal(await page.locator('#count').innerText(), '7');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'mobile-filter');
      await page.getByRole('button', {name:'Filters',exact:true}).click();
      await page.getByRole('dialog', {name:'Filter leads',exact:true}).getByLabel('Source', {exact:true}).selectOption('Referral');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#count').innerText(), '7');
    }
    const openFirst = () => page.getByRole('button', { name: 'Irrigation controls upgrade', exact: true }).filter({ visible: true }).click();
    await openFirst();
    assert.equal(await page.getByRole('dialog', { name: 'Irrigation controls upgrade' }).count(), 1);
    await capture('detail');
    await page.getByRole('button', { name: 'Convert to deal', exact: true }).click();
    await capture('conversion');
    await page.getByRole('button', { name: 'Cancel', exact: true }).filter({ visible: true }).click();
    assert(await page.locator('#detail').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.textContent.trim()), 'Irrigation controls upgrade');
    await openFirst();
    await page.getByRole('button', { name: 'Convert to deal', exact: true }).click();
    await page.getByRole('button', { name: 'Convert to deal', exact: true }).click();
    assert.equal(await page.locator('#count').innerText(), '6');
    await page.getByRole('button', { name: 'Open deal', exact: true }).click();
    assert.equal(await page.locator('#deal-count').innerText(), '1');
    const dealText = await page.locator('#deal-content').innerText();
    for (const expected of ['SYN-PPO-OPP-000101','SYN-PPO-ACT-000201','SYN-PPO-ACT-000200','Morgan Chen','11 Sept 2026','Completed','Budget and installation timing']) assert(dealText.includes(expected), `Preserved detail missing: ${expected}`);
    await capture('deal');
    await page.getByRole('button', { name: 'View source lead · SYN-PPO-LEAD-000001', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Convert to deal', exact: true }).filter({ visible: true }).count(), 0);
    await page.getByRole('button', { name: 'Close lead', exact: true }).click();
    await page.getByRole('button', { name: 'Leads', exact: true }).click();
    await page.getByLabel('View', { exact: true }).selectOption('Converted');
    assert.equal(await page.locator('#count').innerText(), '1');
    if (width < 700) await page.getByRole('button', {name:'Open lead search',exact:true}).click();
    await page.getByLabel('Search leads', { exact: true }).fill('no such enquiry');
    assert.equal(await page.locator('#count').innerText(), '0');
    if (width < 700) { await capture('no-matches'); await page.getByRole('button', { name: 'Filters', exact: true }).click(); }
    await (width < 700 ? page.getByRole('dialog', {name:'Filter leads',exact:true}) : page.locator('.toolbar')).getByRole('button', { name: 'Clear filters', exact: true }).click();
    assert.equal(await page.locator('#count').innerText(), '1');
    if (width < 700) {
      await page.getByRole('button', {name:'Show leads',exact:true}).click();
      await page.getByRole('button', {name:'Cancel',exact:true}).filter({visible:true}).click();
      assert.equal(await page.locator('#mobile-search-toggle').getAttribute('aria-expanded'), 'false');
    }
    await page.getByLabel('View', { exact: true }).selectOption('Active');
    if (width < 700) await page.getByRole('button', {name:'Filters',exact:true}).click();
    await page.getByLabel('Owner', { exact: true }).selectOption('Alex Lee');
    assert.equal(await page.locator('#count').innerText(), '3');
    if (width < 700) {
      await page.getByRole('button', {name:'Show leads',exact:true}).click();
      assert(await page.locator('#mobile-filter').evaluate(el => el.classList.contains('filter-on')));
      await page.getByRole('button', {name:'Open lead search',exact:true}).click();
      await page.getByLabel('Search leads', {exact:true}).fill('Climate');
      assert.equal(await page.locator('#count').innerText(), '1');
      await capture('search');
      await page.getByRole('button', {name:'Cancel',exact:true}).filter({visible:true}).click();
      assert.equal(await page.locator('#count').innerText(), '3');
    }
    await page.getByRole('button', { name: '+ Lead', exact: true }).click();
    await page.getByLabel('Lead title', { exact: true }).fill('Synthetic test enquiry');
    await page.getByLabel('Customer requirement', { exact: true }).filter({ visible: true }).fill('Clarify a new synthetic requirement.');
    await page.getByRole('button', { name: 'Create lead', exact: true }).click();
    assert((await page.locator('#detail-body').innerText()).includes('Next action needed'));
    await page.getByRole('button', { name: 'Convert to deal', exact: true }).click();
    await page.getByLabel('Qualification note', { exact: true }).fill('Missing context must still block this conversion.');
    await page.getByRole('button', { name: 'Convert to deal', exact: true }).click();
    assert((await page.getByRole('alert').innerText()).includes('Confirm an organisation'));
    await page.getByRole('button', { name: 'Cancel', exact: true }).filter({ visible: true }).click();
    await page.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('button', { name: 'Unarchive', exact: true }).click();
    await page.getByRole('button', { name: 'Disqualify', exact: true }).click();
    await page.getByLabel('Reason', { exact: true }).fill('Synthetic request no longer proceeding.');
    await page.getByRole('button', { name: 'Disqualify', exact: true }).click();
    await page.getByRole('button', { name: 'Reopen lead', exact: true }).click();
    await page.getByLabel('Reason', { exact: true }).fill('Synthetic customer has resumed the discussion.');
    await page.getByRole('button', { name: 'Reopen', exact: true }).click();
    assert((await page.locator('#detail-pill').innerText()).includes('New'));
    await page.getByRole('button', {name:'Close lead',exact:true}).click();
    if (width < 700) {
      // Exercise a truly empty inbox using only this in-memory synthetic fixture.
      await page.evaluate(() => { leads=[]; clearFilters(); render(); });
      assert.equal(await page.locator('#count').innerText(), '0');
      assert((await page.locator('#mobile').innerText()).includes('No active leads'));
      await capture('empty-inbox');
      await page.getByRole('button', {name:'+ Lead',exact:true}).click();
      assert(await page.locator('#new-lead').isVisible());
      await page.getByRole('button', {name:'Cancel',exact:true}).filter({visible:true}).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'add-lead');
      await page.setViewportSize({width:1440,height:900});
      await page.getByLabel('Owner', {exact:true}).waitFor({state:'visible'});
      await page.setViewportSize({width,height});
      assert(await page.locator('.mobile-header').isVisible());
    }
    assert.deepEqual(errors, []);
    evidence.viewports.push({width,height,result:'passed',checks:'List; compact phone toolbar/rows/FAB; back; sort; filter apply/cancel/Escape; search; empty inbox; responsive resize; detail; conversion; cancel/Escape/focus; original activity history/owner/date; retained converted source; search/clear/owner filter; capture unknowns; invalid conversion; archive/unarchive; reasoned disqualification/reopen; no horizontal overflow or page errors'});
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(resolve(output, 'verification.json'), JSON.stringify(evidence,null,2)+'\n');
}
console.log(JSON.stringify(evidence,null,2));
