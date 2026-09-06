// Design-document verification only. Does not start PPO or connect to any source.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const input = resolve('docs/blueprints/crm-wireframes.html');
const output = resolve(process.env.CRM_DESIGN_OUTPUT || 'verification-evidence/crm-design');
await mkdir(output, { recursive: true });
const source = await readFile(input);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = arg => execFileSync('git', ['rev-parse', arg], { encoding: 'utf8' }).trim();
const evidence = {
  scope: 'Standalone synthetic wireframe only; not CRM runtime or business acceptance',
  source_head: process.env.PPO_SOURCE_HEAD || git('HEAD'),
  executed_checkout: git('HEAD'), executed_tree: git('HEAD^{tree}'),
  input: 'docs/blueprints/crm-wireframes.html', input_sha256: sha256(source),
  run_id: process.env.GITHUB_RUN_ID || null, attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  screens: ['work', 'pipeline', 'detail', 'relationships', 'activity', 'history', 'create'],
  states: ['ready', 'loading', 'empty', 'validation', 'denied', 'conflict', 'unavailable'],
  captures: [], checked_views: 0, result: 'in progress'
};
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    await page.goto(pathToFileURL(input).href);
    assert.match(await page.title(), /CRM design walkthrough/);
    for (const screen of evidence.screens) {
      await page.selectOption('#screen', screen);
      for (const state of evidence.states) {
        await page.selectOption('#state', state);
        await page.locator('#screen-title').waitFor();
        const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        assert.ok(width.scroll <= width.client + 1, `${screen}/${state}/${viewport.width} horizontal overflow`);
        assert.match(await page.locator('header').textContent(), /SYNTHETIC.*DESIGN ONLY/);
        if (state === 'denied') {
          const body = await page.locator('main').textContent();
          assert.ok(!/Example Nursery|SYN-PPO-OPP|Casey|Alex/.test(body), 'Denied illustration contains prior record content');
          assert.equal(await page.locator('main input,main textarea').count(), 0);
        }
        if (viewport.width !== 320 && (state === 'ready' || (screen === 'detail' && ['conflict', 'denied'].includes(state)))) {
          const filename = `${viewport.width === 1440 ? 'desktop' : 'phone'}-${screen}-${state}.png`;
          const bytes = await page.screenshot({ path: resolve(output, filename), fullPage: true });
          evidence.captures.push({ filename, screen, state, viewport, bytes: bytes.length, sha256: sha256(bytes) });
        }
        evidence.checked_views++;
      }
    }
    await page.selectOption('#state', 'ready');
    await page.selectOption('#screen', 'pipeline');
    const boardRefs = await page.locator('#board .ref').allTextContents();
    await page.click('#list-button');
    assert.deepEqual(await page.locator('#pipeline-list .ref').allTextContents(), boardRefs);
    assert.equal(await page.locator('#board').isVisible(), false);
    await page.selectOption('#screen', 'create');
    await page.fill('#new-title', 'Synthetic long opportunity title '.repeat(5));
    await page.click('#create-form button[type=submit]');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'notice');
    assert.match(await page.locator('#notice').textContent(), /Customer need/);
    assert.ok((await page.inputValue('#new-title')).startsWith('Synthetic long'));
    await page.fill('#new-need', 'Synthetic need with long content. '.repeat(30));
    await page.click('#create-form button[type=submit]');
    assert.match(await page.locator('#create-result').textContent(), /No data was saved/);
    await page.selectOption('#screen', 'detail');
    await page.fill('#qualification-note', 'Synthetic need and contact confirmed; plan site review.');
    await page.click('#qualification button[type=submit]');
    assert.match(await page.locator('#qualification-result').textContent(), /No data was saved/);
    await page.selectOption('#screen', 'activity');
    await page.fill('#outcome', 'Synthetic requirements clarified; arrange a site review.');
    await page.click('#activity-form button[type=submit]');
    assert.match(await page.locator('#activity-result').textContent(), /Nothing was saved or sent/);
    await page.selectOption('#screen', 'work');
    await page.fill('#filter', 'no matching example');
    assert.match(await page.locator('#work-rows').textContent(), /No example items/);
    await page.fill('#filter', '');
    await page.selectOption('#owner-filter', 'Jordan');
    assert.equal(await page.locator('#work-rows .record').count(), 1);
    await page.locator('#owner-filter').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BUTTON');
    const focusStyle = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    assert.notEqual(focusStyle, 'none');
    assert.deepEqual(errors, [], 'JavaScript errors');
    assert.deepEqual(requests, [], 'Wireframe made network requests');
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0, 'Unexpected browser storage');
    await context.close();
  }
  evidence.result = 'passed';
} catch (error) {
  evidence.result = 'failed'; failures.push(String(error));
} finally {
  evidence.failures = failures;
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(evidence, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ result: evidence.result, checked_views: evidence.checked_views, captures: evidence.captures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
