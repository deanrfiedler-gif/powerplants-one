import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const file = resolve('docs/blueprints/crm-ui-redesign-review.html');
const out = resolve('verification-evidence/crm-design/ui-redesign-review');
await mkdir(out, { recursive: true });
const bytes = await readFile(file);
const evidence = {
  sourceHead: process.env.PPO_SOURCE_HEAD || null,
  checkoutHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  htmlSha256: createHash('sha256').update(bytes).digest('hex'),
  checks: [], measurements: [], screenshots: [], errors: [], externalRequests: [],
  boundary: 'Standalone synthetic UI design checks, not application or business acceptance.'
};
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, timezoneId: 'Australia/Brisbane' });
const page = await context.newPage();
page.on('pageerror', e => evidence.errors.push(e.message));
page.on('request', request => { if (/^https?:/.test(request.url())) evidence.externalRequests.push(request.url()); });
const check = (name, condition) => { assert.ok(condition, name); evidence.checks.push(name); };
const capture = async name => {
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  evidence.screenshots.push(name + '.png');
};
const recordIds = async () => page.locator('[data-record]').evaluateAll(nodes => nodes.map(n => n.dataset.record).sort());
const noOverflow = async label => {
  const m = await page.evaluate(() => ({ width: innerWidth, body: document.body.scrollWidth, document: document.documentElement.scrollWidth }));
  evidence.measurements.push({ label, ...m });
  check(label + ': no outer horizontal overflow', m.body <= m.width + 1 && m.document <= m.width + 1);
};
try {
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  check('18 initial Board records', await page.locator('.deal-card').count() === 18);
  check('Roboto loaded', await page.evaluate(() => document.fonts.check('14px Roboto')));
  await noOverflow('1920 desktop Board');
  const cardTop = (await page.locator('.deal-card').first().boundingBox()).y;
  evidence.measurements.push({ label: 'Desktop first card top', y: cardTop });
  check('Desktop first card begins above 350px', cardTop < 350);
  await capture('board-desktop');
  const originalIds = await recordIds();
  await page.locator('#view-list').click();
  check('Board and List return identical records', JSON.stringify(await recordIds()) === JSON.stringify(originalIds));
  await capture('list-desktop');
  await page.locator('#filter-toggle').click();
  await page.locator('#owner-filter').selectOption('0');
  await page.locator('#action-filter').selectOption('overdue');
  const filteredIds = await recordIds();
  check('Combined owner and activity filter selects opportunity 5', JSON.stringify(filteredIds) === '["5"]');
  await page.locator('#view-board').click();
  check('Board retains combined filters', JSON.stringify(await recordIds()) === JSON.stringify(filteredIds));
  await page.locator('[data-open="5"]').click();
  check('Detail distinguishes action and opportunity owners', (await page.locator('#dialog').innerText()).includes('Activity owner: Sam Jordan'));
  check('Detail retains Open outcome', (await page.locator('#dialog').innerText()).includes('Open'));
  await capture('opportunity-detail');
  await page.keyboard.press('Escape');
  check('Escape returns focus to record', await page.locator('[data-open="5"]').evaluate(el => el === document.activeElement));
  await page.locator('#search').fill('no-such-opportunity');
  check('No-match recovery appears', await page.locator('#reset-search').isVisible());
  await page.locator('#reset-search').click();
  check('Clear search and filters restores 18 records', await page.locator('.deal-card').count() === 18);
  await page.locator('#new-opportunity').click();
  await page.locator('#new-title').fill('SYN UI review test');
  await page.getByRole('button', { name: 'Add to preview', exact: true }).click();
  check('Required action validation preserves title', await page.locator('#new-title').inputValue() === 'SYN UI review test' && await page.locator('#action-error').isVisible());
  await page.locator('#new-action').fill('Confirm the fictional scope');
  await page.getByRole('button', { name: 'Add to preview', exact: true }).click();
  check('Temporary creation adds one record', await page.locator('.deal-card').count() === 19);
  await page.reload();
  check('Reload restores original sample', await page.locator('.deal-card').count() === 18);
  for (const screen of ['board', 'list', 'planner']) {
    await page.locator('#screen-picker').selectOption(screen);
    await page.locator('#show-current').click();
    check(screen + ': repository edition clearly identifies omitted source screenshot', await page.locator('#current-unavailable').isVisible());
    await page.locator('#show-proposed').click();
    check(screen + ': proposed view is restored', await page.locator('#app').isVisible());
  }
  check('Planner contains 10 appointments', await page.locator('.appointment').count() === 10);
  await noOverflow('1920 desktop Planner');
  const calendarTop = (await page.locator('.cal-head').boundingBox()).y;
  evidence.measurements.push({ label: 'Desktop calendar top', y: calendarTop });
  check('Calendar begins above 300px', calendarTop < 300);
  await capture('planner-desktop');
  await page.locator('[data-appointment="6"]').click();
  check('Change request preserves confirmed booking meaning', (await page.locator('#dialog').innerText()).includes('does not move the confirmed booking'));
  await capture('appointment-detail');
  await page.keyboard.press('Escape');
  await page.locator('#resource-filter').selectOption('0');
  check('Resource filter returns four appointments', await page.locator('.appointment').count() === 4);
  await page.locator('#day-mode').click();
  check('Day view retains resource selection', await page.locator('.appointment').count() === 1 && await page.locator('#resource-filter').inputValue() === '0');
  await page.locator('#week-mode').click();
  await page.locator('#next-date').click();
  check('Next week has an explicit empty state', await page.locator('.calendar-empty').isVisible());
  await page.locator('#today').click();
  await page.locator('#resource-filter').selectOption('all');
  await page.locator('#search').fill('calibration');
  check('Planner search selects a matching appointment', await page.locator('.appointment').count() === 1);
  await page.locator('#search').fill('');
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.locator('#screen-picker').selectOption('board');
    await noOverflow(width + ' Board');
    if (width < 500) {
      check(width + ': mobile stage selector is visible', await page.locator('#mobile-stage').isVisible());
      await page.locator('#mobile-stage').selectOption('3');
      check(width + ': selected stage contains three visible cards', await page.locator('.stage.mobile-active .deal-card').count() === 3);
      await page.locator('#mobile-stage').selectOption('0');
      const box = await page.locator('.stage.mobile-active .deal-card').first().boundingBox();
      evidence.measurements.push({ label: width + ' first complete Board card', ...box });
      check(width + ': first card fits the initial viewport', box.y + box.height <= 844);
      await capture('board-' + width);
      await page.locator('#new-opportunity').click();
      check(width + ': creation dialog fits horizontally', await page.locator('#dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      await page.keyboard.press('Escape');
      await page.locator('.menu-button').click();
      check(width + ': mobile navigation opens', await page.locator('.sidebar').isVisible());
      await page.locator('#nav-service').click();
      await page.locator('#day-mode').click();
      await noOverflow(width + ' Planner Day');
      await capture('planner-day-' + width);
      await page.locator('#week-mode').click();
    } else {
      await capture('board-' + width);
    }
    await page.locator('#screen-picker').selectOption('list');
    await noOverflow(width + ' List');
  }
  check('No JavaScript runtime errors', evidence.errors.length === 0);
  check('No external network requests', evidence.externalRequests.length === 0);
  evidence.result = 'passed';
} catch (error) {
  evidence.result = 'failed';
  evidence.failure = error.stack;
  await capture('failure');
  throw error;
} finally {
  await writeFile(`${out}/review-evidence.json`, JSON.stringify(evidence, null, 2));
  await browser.close();
  console.log(JSON.stringify({ result: evidence.result, checks: evidence.checks.length, evidence: out }));
}
