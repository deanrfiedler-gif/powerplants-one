// Verify the exported design document; no PPO server, database or source account.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const input = 'docs/blueprints/crm-board-grid-mockup.html';
const output = resolve(process.env.CRM_UI_OUTPUT || 'verification-evidence/crm-design/branded-ui');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = arg => { try { return execFileSync('git', ['rev-parse', arg], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const source = await readFile(input);
const manifest = JSON.parse(await readFile('docs/blueprints/crm-ui-mockups/manifest.json', 'utf8'));
const evidence = { scope: 'Synthetic exported design only; not application or acceptance proof',
  source_head: process.env.PPO_SOURCE_HEAD || git('HEAD'), executed_checkout: git('HEAD'), executed_tree: git('HEAD^{tree}'),
  input, input_sha256: sha256(source), run_id: process.env.GITHUB_RUN_ID || null,
  attempt: process.env.GITHUB_RUN_ATTEMPT || null, captures: [], result: 'in progress', failures: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CRM_UI_BROWSER ? { executablePath: process.env.CRM_UI_BROWSER } : {}) });
evidence.browser = browser.version();
try {
  assert.equal(sha256(source), manifest.interactive_export.sha256, 'Export differs from its manifest');
  for (const asset of manifest.assets) assert.equal(sha256(await readFile(asset.path)), asset.sha256, `${asset.path} integrity`);
  const embedded = source.toString().match(/src="data:image\/png;base64,([^"]+)"/)[1];
  assert.equal(sha256(Buffer.from(embedded, 'base64')), manifest.assets.find(x => x.path.endsWith('powerplants-logo-green-white.png')).sha256, 'Embedded logo changed');
  const context = await browser.newContext({ viewport: { width: 1800, height: 1100 } });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.goto(pathToFileURL(resolve(input)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.ppo-rail svg').first().waitFor();
  assert.equal(await page.locator('#ppo-count').innerText(), '15 opportunities');
  assert.equal(await page.locator('#ppo-value-total').innerText(), 'A$1,036,000 known value · 2 not estimated');
  const ids = selector => page.locator(selector + ' [data-record]').evaluateAll(nodes => nodes.map(n => n.dataset.record).sort());
  const boardIds = await ids('#ppo-board');
  const capture = async filename => {
    const bytes = await page.screenshot({ path: resolve(output, filename), fullPage: true });
    evidence.captures.push({ filename, viewport: page.viewportSize(), sha256: sha256(bytes), bytes: bytes.length });
  };
  await capture('desktop-board.png');
  await page.click('#ppo-grid-button');
  assert.deepEqual(await ids('#ppo-grid'), boardIds);
  await capture('desktop-grid.png');
  await page.selectOption('#ppo-owner', 'Alex Lee');
  await page.selectOption('#ppo-action-filter', 'overdue');
  const filteredIds = await ids('#ppo-grid');
  assert.equal(filteredIds.length, 2);
  await page.click('#ppo-board-button');
  assert.deepEqual(await ids('#ppo-board'), filteredIds);
  await page.fill('#ppo-search', 'no-matching-synthetic-opportunity');
  assert.equal(await page.locator('#ppo-empty').isVisible(), true);
  assert.equal(await page.locator('#ppo-count').innerText(), '0 opportunities');
  await page.fill('#ppo-search', '');
  await page.selectOption('#ppo-owner', 'all');
  await page.selectOption('#ppo-action-filter', 'all');
  await page.selectOption('#ppo-pipeline', 'products');
  assert.equal((await ids('#ppo-board')).length, 3);
  await page.selectOption('#ppo-pipeline', 'all');
  assert.equal((await ids('#ppo-board')).length, 18);
  await page.selectOption('#ppo-sort', 'value');
  await page.click('#ppo-grid-button');
  assert.equal(await page.locator('#ppo-grid [data-record]').first().getAttribute('data-record'), '11');
  await page.click('#ppo-grid [data-open="11"]');
  assert.match(await page.locator('#ppo-detail-body').innerText(), /Negotiation \/ Open/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#ppo-detail').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-open')), '11');
  await page.click('#ppo-add');
  await page.fill('input[name=title]', 'Synthetic export verification');
  await page.selectOption('select[name=organisation]', { label: 'Example Nursery' });
  await page.fill('input[name=action]', 'Confirm requirements');
  await page.click('#ppo-create-submit');
  assert.equal(await page.locator('#ppo-count').innerText(), '16 opportunities');
  await page.click('#ppo-grid [data-open="19"]');
  assert.match(await page.locator('#ppo-detail-body').innerText(), /Due date needed/);
  await page.keyboard.press('Escape');
  await page.reload();
  assert.equal(await page.locator('#ppo-count').innerText(), '15 opportunities');
  for (const width of [1800, 1024, 736, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const view of ['board', 'grid']) {
      await page.click(`#ppo-${view}-button`);
      const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, logo: document.querySelector('.ppo-logo').getBoundingClientRect().height }));
      assert.ok(size.scroll <= size.client + 1, `${view}/${width} page overflow`);
      assert.equal(size.logo, 88);
      if (width <= 390) {
        const controls = await page.locator('.ppo-toolbar select').evaluateAll(nodes => nodes.map(n => ({ left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right })));
        assert.ok(controls.every(r => r.left >= 0 && r.right <= width), `${view}/${width} clipped filter`);
      }
      if (width === 390 && view === 'board') await capture('phone-board.png');
    }
  }
  await page.locator('#ppo-board-button').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'ppo-grid-button');
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  await context.close();
  evidence.result = 'passed';
} catch (error) {
  evidence.result = 'failed'; evidence.failures.push(String(error));
} finally {
  await browser.close();
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(evidence, null, 2) + '\n');
}
console.log(JSON.stringify({ result: evidence.result, captures: evidence.captures.length, failures: evidence.failures }, null, 2));
if (evidence.failures.length) process.exitCode = 1;
