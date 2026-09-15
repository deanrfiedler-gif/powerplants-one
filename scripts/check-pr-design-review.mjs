// Native browser evidence for the four standalone designs in the September PR
// reconciliation. This is component review, not owner/device or ERP acceptance.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const output = resolve('verification-evidence/pr-design-review');
await mkdir(output, { recursive: true });
const handbook = resolve(output, 'myob-handbook.html');
execFileSync('python3', ['scripts/build-myob-handbook.py', '--output', handbook]);
const designs = [
  ['excel', 'docs/blueprints/excel-estimate-import.html'],
  ['equipment', 'docs/reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html'],
  ['customers', 'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'],
  ['myob', handbook],
];
const evidence = {
  source_head: process.env.PPO_SOURCE_HEAD,
  checkout: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  run_id: process.env.GITHUB_RUN_ID,
  scope: 'Native Chromium render, navigation and modal component review; no application, real device, screen reader, Excel desktop or MYOB acceptance',
  cases: [], failures: [],
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
evidence.browser = browser.version();
async function capture(page, entry, name) {
  const file = `${entry.design}-${entry.width}-${name}.png`;
  await page.screenshot({ path: resolve(output, file), fullPage: true });
  entry.captures.push(file);
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  entry.geometry.push({ view: name, ...size });
  assert.ok(size.scroll <= size.width + 2, `${name}: page overflows ${size.scroll}/${size.width}`);
}
async function modal(page, trigger, entry) {
  const button = page.locator(trigger).filter({ visible: true }).first();
  await button.click();
  const dialog = page.locator('dialog:modal');
  await dialog.waitFor({ state: 'visible' });
  // A native modal makes the background inert. HTML sequential focus navigation
  // may still visit browser chrome; that is distinct from focusing page controls.
  // https://html.spec.whatwg.org/multipage/interaction.html#sequential-focus-navigation
  entry.focus = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const focus = await dialog.evaluate(el => ({
      inModal: el.contains(document.activeElement),
      documentFocused: document.hasFocus(),
      activeTag: document.activeElement?.tagName,
      activeId: document.activeElement?.id,
    }));
    entry.focus.push(focus);
    assert.ok(focus.inModal || (!focus.documentFocused && ['BODY', 'HTML'].includes(focus.activeTag)),
      `Tab reaches background page control: ${JSON.stringify(focus)}`);
  }
  await dialog.evaluate(el => el.querySelector('button, input, a[href], select, [tabindex="0"]').focus());
  await button.evaluate(el => el.focus());
  assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'Background trigger remains inert');
  await capture(page, entry, 'dialog');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog:modal').count(), 0, 'Escape closes modal');
  assert.ok(await button.evaluate(el => document.activeElement === el), 'Focus returns to trigger');
  entry.checks.push('native modal, twelve Tab presses, Escape and focus return');
}
try {
  for (const [design, file] of designs) for (const width of [1440, 1024, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const entry = { design, width, sha256: createHash('sha256').update(await readFile(file)).digest('hex'), captures: [], checks: [], geometry: [], page_errors: [] };
    evidence.cases.push(entry);
    page.on('pageerror', error => entry.page_errors.push(error.message));
    try {
      await page.goto(pathToFileURL(resolve(file)).href);
      await page.evaluate(() => document.fonts.ready);
      assert.ok((await page.locator('body').innerText()).length > 300, 'Design rendered meaningful content');
      await capture(page, entry, 'initial');
      if (design === 'excel') {
        await page.locator('[data-scenario="ready"]').click();
        assert.match(await page.locator('body').innerText(), /62,952\.38/);
        await capture(page, entry, 'review');
        await modal(page, '[data-line="0"]', entry);
        assert.ok(await page.locator('[data-action="commit"]').isDisabled());
        await page.locator('#review-confirm').check();
        await page.locator('[data-action="commit"]').click();
        assert.match(await page.locator('body').innerText(), /[Dd]raft/);
        await capture(page, entry, 'saved');
        entry.checks.push('synthetic rows, reconciled totals, review confirmation and demo draft');
      } else if (design === 'equipment') {
        await page.locator('[data-action="asset"]').filter({ visible: true }).first().click();
        const tabs = await page.locator('[data-action="tab"]').evaluateAll(els => els.map(el => el.dataset.tab));
        assert.ok(tabs.length >= 4);
        for (const tab of tabs) {
          await page.locator(`[data-action="tab"][data-tab="${tab}"]`).click();
          await capture(page, entry, tab);
        }
        await modal(page, '[data-action="about"]', entry);
        entry.checks.push('equipment record and all record tabs');
      } else if (design === 'customers') {
        for (const view of ['overview', 'sites', 'areas', 'equipment', 'readiness']) {
          await page.locator(`[role="tab"][data-view="${view}"]`).click();
          assert.equal(await page.locator(`[role="tab"][data-view="${view}"]`).getAttribute('aria-selected'), 'true');
          await capture(page, entry, view);
        }
        await modal(page, '[data-action="about"]', entry);
        entry.checks.push('all five workspace tabs with selected state');
        await page.locator('[role="tab"][data-view="areas"]').click();
        const mapLinks = await page.locator('a[href*="www.google.com/maps/"]').evaluateAll(els => els.map(el => ({ href: el.href, target: el.target, rel: el.rel })));
        assert.ok(mapLinks.length >= 2, 'Site map and directions links are rendered');
        for (const link of mapLinks) {
          const url = new URL(link.href);
          assert.equal(url.protocol, 'https:');
          assert.equal(url.hostname, 'www.google.com');
          assert.equal(url.searchParams.get('api'), '1');
          assert.ok(link.href.length <= 2048);
          assert.equal(link.target, '_blank');
          assert.match(link.rel, /noopener/);
        }
        await capture(page, entry, 'map-directions');
        entry.checks.push('native map/directions controls and encoded HTTPS destinations; external Maps not opened');
      } else {
        await page.goto(pathToFileURL(resolve(file)).href + '#mappings');
        await page.locator('#mapping-search').waitFor({ state: 'visible' });
        assert.match(await page.locator('#mapping-count').innerText(), /60 of 60/);
        await page.locator('#mapping-search').fill('NO-SYNTHETIC-MATCH-987');
        assert.match(await page.locator('#mapping-results').innerText(), /No mappings match/);
        await page.locator('#mapping-search').fill('');
        await capture(page, entry, 'mappings');
        await modal(page, '[data-map]', entry);
        const download = page.waitForEvent('download');
        await page.locator('#export-all').click();
        assert.match((await download).suggestedFilename(), /\.csv$/);
        if (width === 1440) await page.pdf({ path: resolve(output, 'myob-print.pdf'), format: 'A4', printBackground: true });
        entry.checks.push('60 mappings, empty filter recovery, details, CSV download');
      }
      assert.deepEqual(entry.page_errors, []);
      entry.result = 'passed';
    } catch (error) {
      entry.result = 'failed';
      entry.error = error.stack;
      evidence.failures.push({ design, width, error: error.message });
      await page.screenshot({ path: resolve(output, `${design}-${width}-failure.png`), fullPage: true }).catch(() => {});
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(resolve(output, 'results.json'), JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({ cases: evidence.cases.length, failures: evidence.failures }, null, 2));
if (evidence.failures.length) process.exitCode = 1;
