// CS-01 Customer 360 — native browser checks.
// Runs the issued HTML in a real Chromium engine and records measured layout,
// console output and interaction results. It is not a screen-reader, assistive-
// technology, physical-device or owner acceptance run.
//
// Usage (PPO_DESIGN_PLAYWRIGHT_MODULE points at the module entry file, not the folder):
//   PPO_DESIGN_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js \
//   PPO_DESIGN_CHROMIUM=/absolute/path/to/chrome \
//   node scripts/check-customer-360-browser.mjs [--write-evidence]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const playwright = await import(
  process.env.PPO_DESIGN_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PPO_DESIGN_PLAYWRIGHT_MODULE).href : 'playwright');
// Playwright is published as CommonJS, so a dynamic import may arrive under `default`.
const chromium = playwright.chromium || (playwright.default && playwright.default.chromium);
if (!chromium) throw new Error('Playwright chromium export not found; check PPO_DESIGN_PLAYWRIGHT_MODULE');

const file = new URL('../docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html', import.meta.url);
const results = [];
const messages = [];
const check = (name, fn) => { fn(); results.push({name, status: 'passed'}); console.log('PASS ' + name); };

const VIEWPORTS = [
  {name: 'desktop', width: 1440, height: 1000},
  {name: 'laptop', width: 1280, height: 800},
  {name: 'tablet', width: 834, height: 1112},
  {name: 'phone', width: 390, height: 844},
  {name: 'narrow', width: 320, height: 760}
];

const browser = await chromium.launch({
  executablePath: process.env.PPO_DESIGN_CHROMIUM || undefined,
  args: ['--no-sandbox', '--disable-background-networking', '--disable-component-update',
    '--disable-sync', '--proxy-server=direct://', '--proxy-bypass-list=*']
});

const measurements = [];
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: {width: viewport.width, height: viewport.height},
    locale: 'en-AU',
    timezoneId: 'Australia/Melbourne'
  });
  const page = await context.newPage();
  page.on('pageerror', error => messages.push(`${viewport.name} pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') messages.push(`${viewport.name} console: ${message.text()}`); });
  page.on('request', request => { if (!request.url().startsWith('file:')) messages.push(`${viewport.name} network: ${request.url()}`); });

  await page.goto(file.href, {waitUntil: 'load'});
  await page.waitForSelector('#main-heading');

  const overflowOf = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const record = {viewport: viewport.name, width: viewport.width, overflow: {}};

  record.overflow.overview = await overflowOf();
  await page.locator('#tab-orders').click();
  await page.waitForTimeout(120);
  record.overflow.orders = await overflowOf();
  // Measured on the sales-order register, where both presentations exist.
  record.registerPresentation = await page.evaluate(() => ({
    table: getComputedStyle(document.querySelector('.register-wrap')).display,
    cards: getComputedStyle(document.querySelector('.register-cards')).display,
    rows: document.querySelectorAll('.register tbody tr[data-row-id]').length,
    cardCount: document.querySelectorAll('.register-cards .register-card').length
  }));
  await page.locator('[data-action="open"][data-kind="order"][data-id="SYN-MYOB-SO-004380"]:visible').first().click();
  await page.waitForTimeout(200);
  record.overflow.orderSnapshot = await overflowOf();
  record.snapshotOpen = await page.locator('#detail[open]').count() === 1;
  await page.locator('#detail [data-action="close-dialog"]').first().click();
  await page.locator('#tab-accounts').click();
  await page.waitForTimeout(120);
  record.overflow.accounts = await overflowOf();
  await page.locator('#tab-cases').click();
  await page.waitForTimeout(120);
  record.overflow.cases = await overflowOf();

  record.appliedFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  record.smallestInteractiveTarget = await page.evaluate(() => {
    let smallest = Infinity;
    for (const el of document.querySelectorAll('button:not([hidden]), a[href], input, select, textarea')) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      smallest = Math.min(smallest, Math.round(rect.height));
    }
    return smallest === Infinity ? null : smallest;
  });
  measurements.push(record);
  await context.close();
}

/* ------------------------------------------------ measured presentation */

check('No horizontal page scroll at 1440, 1280, 834, 390 or 320 CSS pixels', () => {
  for (const record of measurements) {
    for (const [view, value] of Object.entries(record.overflow)) {
      assert.equal(value, 0, `${record.viewport} ${view} overflow was ${value}px`);
    }
  }
});

check('The embedded Roboto face is the applied body font', () => {
  for (const record of measurements) assert.match(record.appliedFont, /PPOBoardRoboto/);
});

check('Desktop shows the register table and the phone layout shows the same records as cards', () => {
  const desktop = measurements.find(m => m.viewport === 'desktop');
  const phone = measurements.find(m => m.viewport === 'phone');
  assert.notEqual(desktop.registerPresentation.table, 'none');
  assert.equal(desktop.registerPresentation.cards, 'none');
  assert.equal(phone.registerPresentation.table, 'none');
  assert.notEqual(phone.registerPresentation.cards, 'none');
  for (const record of measurements) {
    assert.equal(record.registerPresentation.rows, record.registerPresentation.cardCount,
      `${record.viewport} table rows and phone cards represent different record counts`);
  }
});

check('Interactive controls keep a usable height at every measured viewport', () => {
  for (const record of measurements) {
    assert.ok(record.smallestInteractiveTarget >= 22,
      `${record.viewport} smallest interactive height was ${record.smallestInteractiveTarget}px`);
  }
});

check('A docked record snapshot opens at every measured viewport', () => {
  for (const record of measurements) assert.equal(record.snapshotOpen, true, record.viewport);
});

/* ---------------------------------------------- measured interaction */

const context = await browser.newContext({viewport: {width: 1440, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Melbourne'});
const page = await context.newPage();
page.on('pageerror', error => messages.push(`interaction pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error') messages.push(`interaction console: ${message.text()}`); });
await page.goto(file.href, {waitUntil: 'load'});
await page.waitForSelector('#main-heading');

let focusVisible = null;
const keyboard = await (async () => {
  await page.locator('#tab-overview').focus();
  await page.keyboard.press('ArrowRight');
  const afterRight = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id);
  focusVisible = await page.evaluate(() => {
    const active = document.activeElement;
    const style = getComputedStyle(active);
    return {id: active.id, matchesFocusVisible: active.matches(':focus-visible'),
      outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth};
  });
  await page.keyboard.press('End');
  const afterEnd = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id);
  await page.locator('#tab-overview').click();
  return {afterRight, afterEnd};
})();

check('Arrow and End keys move between local tabs in a real engine', () => {
  assert.equal(keyboard.afterRight, 'tab-deals');
  assert.equal(keyboard.afterEnd, 'tab-activity');
});

check('Keyboard focus stays on the activated tab and renders a visible focus outline', () => {
  assert.equal(focusVisible.id, 'tab-deals', 'Focus is restored to the newly activated tab');
  assert.equal(focusVisible.matchesFocusVisible, true);
  assert.notEqual(focusVisible.outlineStyle, 'none');
  assert.ok(parseFloat(focusVisible.outlineWidth) >= 1);
});

const pickerBehaviour = await (async () => {
  await page.locator('#tab-orders').click();
  await page.waitForTimeout(150);
  await page.locator('#filter-site-trigger').click();
  await page.waitForTimeout(120);
  const open = await page.locator('.rounded-picker').count();
  const box = await page.locator('.rounded-picker').boundingBox();
  const viewportWidth = page.viewportSize().width;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  const closed = await page.locator('.rounded-picker').count();
  return {open, closed, withinViewport: box ? box.x >= 0 && box.x + box.width <= viewportWidth : false};
})();

check('The shared choice card opens within the viewport and closes on Escape', () => {
  assert.equal(pickerBehaviour.open, 1);
  assert.equal(pickerBehaviour.closed, 0);
  assert.equal(pickerBehaviour.withinViewport, true);
});

const drill = await (async () => {
  await page.locator('#tab-overview').click();
  await page.waitForTimeout(120);
  await page.locator('.summary-tile', {hasText: 'Open sales orders'}).click();
  await page.waitForTimeout(150);
  const chip = await page.locator('.chip-bar').innerText();
  const returnLabel = await page.locator('[data-action="return"]').innerText();
  await page.locator('[data-action="return"]').click();
  await page.waitForTimeout(150);
  const heading = await page.locator('#main-heading').innerText();
  return {chip, returnLabel, heading};
})();

check('Drill-through applies the filter and return navigation restores the overview', () => {
  assert.match(drill.chip, /Status: Open/);
  assert.match(drill.returnLabel, /Return to Overview/);
  assert.match(drill.heading, /What is happening with/);
});

const isolation = await (async () => {
  await page.locator('#tab-orders').click();
  await page.waitForTimeout(120);
  await page.locator('[data-action="open"][data-kind="order"][data-id="SYN-MYOB-SO-004412"]:visible').first().click();
  await page.waitForTimeout(150);
  // The modeless dock overlays the right of the workspace, including the customer
  // selector, so a user closes it first. Switching with a snapshot still open is
  // covered in the DOM-emulation check.
  const selectorCovered = await page.evaluate(() => {
    const trigger = document.querySelector('#customer-selector-trigger').getBoundingClientRect();
    const dock = document.querySelector('#detail[open]').getBoundingClientRect();
    return trigger.right > dock.left && trigger.top < dock.bottom;
  });
  await page.locator('#detail [data-action="close-dialog"]').first().click();
  await page.waitForTimeout(120);
  await page.locator('#customer-selector-trigger').click();
  await page.waitForTimeout(150);
  await page.locator('.picker-option', {hasText: 'Rothwell Glasshouse Group'}).click();
  await page.waitForTimeout(250);
  const dialogs = await page.locator('dialog[open]').count();
  const body = await page.locator('#content').innerText();
  const label = await page.locator('#customer-selector-trigger').innerText();
  return {selectorCovered, dialogs, label, mentionsOther: /Willowbank|SYN-MYOB-SO-004412/.test(body)};
})();

check('Switching customer through the choice card shows no other customer record', () => {
  assert.equal(isolation.dialogs, 0);
  assert.match(isolation.label, /Rothwell Glasshouse Group/);
  assert.equal(isolation.mentionsOther, false);
});

check('The docked snapshot overlays the context row, which is recorded rather than claimed otherwise', () => {
  assert.equal(isolation.selectorCovered, true,
    'The dock is expected to overlay the right of the workspace, as in the r03 dock pattern');
});

check('No console error, page error or external network request occurred', () => {
  assert.equal(messages.filter(m => !/network: file:/.test(m)).length, 0, messages.join(' | '));
});

await context.close();
await browser.close();

const evidence = {
  design: 'docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html',
  sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  engine: 'Chromium via Playwright, headless, locale en-AU, timezone Australia/Melbourne',
  checked_at: new Date().toISOString(),
  viewports: measurements,
  keyboard_focus: focusVisible,
  messages,
  groups: results.length,
  status: 'passed',
  scope: 'Rendered layout, console output and interaction in one Chromium engine. No screen reader, assistive technology, physical device, print or owner acceptance is asserted.',
  results
};
if (process.argv.includes('--write-evidence')) {
  const out = new URL('../docs/testing/evidence/customer-360-r01/native-results.json', import.meta.url);
  fs.mkdirSync(new URL('.', out), {recursive: true});
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
  console.log('Evidence written to docs/testing/evidence/customer-360-r01/native-results.json');
}
console.log(`\n${results.length} native groups passed.`);
