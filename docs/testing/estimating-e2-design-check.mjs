// Synthetic design verification only; no application/domain imports or database.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelPath = 'docs/blueprints/estimating-e2-model.js';
const fixturePath = 'docs/testing/estimating-e2-fixtures.json';
const htmlPath = 'docs/blueprints/estimating-e2-walkthrough.html';
const fixtures = JSON.parse(fs.readFileSync(path.join(root, fixturePath), 'utf8'));
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, modelPath), 'utf8'), context);
for (const fixture of fixtures.cases) {
  assert.deepEqual(JSON.parse(JSON.stringify(context.E2Model.route(fixture.input))), fixture.expected, fixture.id);
}
assert.equal(new Set(fixtures.cases.map(x => x.id)).size, fixtures.cases.length);
for (let n = 1; n <= 13; n++) assert.ok(fixtures.cases.some(x => x.expected.rule === `R${String(n).padStart(2, '0')}`));
const evidence = path.join(root, 'verification-evidence/estimating-e2-design');
fs.mkdirSync(evidence, { recursive: true });
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report = {
  status: 'passed', scope: 'Proposed synthetic model and standalone UI only; E2 runtime acceptance Not run',
  checkout_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  source_head: process.env.PPO_SOURCE_HEAD || null,
  source_files: Object.fromEntries([modelPath, fixturePath, htmlPath].map(p => [p, hash(path.join(root, p))])),
  route_fixtures_passed: fixtures.cases.length, browser_checks: [], screenshots: [],
};
if (!process.argv.includes('--model-only')) {
  const require = createRequire(import.meta.url);
  const { chromium } = process.env.PPO_DESIGN_PLAYWRIGHT_ROOT
    ? require(path.join(process.env.PPO_DESIGN_PLAYWRIGHT_ROOT, 'playwright'))
    : await import('playwright');
  const browser = await chromium.launch({ headless: true });
  report.browser_version = browser.version();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
    await page.goto(pathToFileURL(path.join(root, htmlPath)).href);
    const contains = async (selector, text) => assert.ok((await page.locator(selector).innerText()).includes(text), text);
    const capture = async name => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(evidence, `${name}.png`), fullPage: true });
      report.screenshots.push({ file: `${name}.png`, sha256: hash(path.join(evidence, `${name}.png`)) });
    };
    const fits = async label => {
      const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
      assert.ok(dimensions.content <= dimensions.width, `${label}: horizontal page overflow`);
    };
    await contains('#route-result', 'Express');
    await page.locator('#incomplete').click(); await contains('#route-result', 'Needs clarification'); await contains('#route-result', 'R13');
    await page.locator('#full').click(); await contains('#route-result', 'R01');
    await page.locator('#engineering_required').selectOption('Unknown'); await contains('#route-result', 'R02');
    await page.locator('#complete').click(); await capture('desktop-route');
    report.browser_checks.push('Complete, incomplete, overlap and earlier-unknown routes');
    await page.locator('[data-step="options"]').click();
    await page.locator('[data-propose="B"]').click();
    await contains('.option.selected', 'Option A');
    await page.locator('#cancel-selection').click(); await contains('.option.selected', 'Option A');
    await page.locator('[data-propose="B"]').click(); await page.locator('#apply-selection').click();
    await contains('.option.selected', 'Option B'); await contains('#screen', 'r01 from A · 670.00');
    await capture('desktop-options'); report.browser_checks.push('Propose/cancel/apply selection; original A quote remains');
    await page.locator('[data-step="scope"]').click();
    assert.equal(await page.locator('#Q08').count(), 0);
    await page.locator('#Q07').selectOption('Yes'); assert.equal(await page.locator('#Q08').count(), 1);
    await page.locator('#Q08').fill('Synthetic on-site scope');
    await page.locator('#Q07').selectOption('No'); await page.locator('#Q07').selectOption('Yes');
    assert.equal(await page.locator('#Q08').inputValue(), '');
    await page.locator('#Q09').selectOption('Customer'); assert.equal(await page.locator('#Q10').count(), 0);
    await page.locator('[data-system="ProductSupply"]').uncheck(); assert.equal(await page.locator('#Q06').count(), 0);
    await page.locator('[data-system="ProductSupply"]').check(); assert.equal(await page.locator('#Q06').inputValue(), '');
    await page.locator('#Q06').fill('100001'); assert.equal(await page.locator('#Q06').evaluate(el => el.checkValidity()), false);
    await page.locator('#Q06').fill('100000'); assert.equal(await page.locator('#Q06').evaluate(el => el.checkValidity()), true);
    await page.locator('#Q06').fill('0'); assert.equal(await page.locator('#Q06').evaluate(el => el.checkValidity()), false);
    await page.locator('#scope-reset').click();
    report.browser_checks.push('Conditional questions, removal/restoration and native count bounds');
    await page.locator('[data-step="compare"]').click(); await page.locator('#keep-comparison').click();
    await contains('#screen', 'Incomplete proposal retained'); await page.locator('#cancel-comparison').click();
    await contains('#screen', 'Original complete example');
    report.browser_checks.push('Incompatible definition acknowledged as incomplete; cancel retains original');
    for (const state of ['Loading', 'Empty', 'Dirty', 'Saving', 'Saved', 'Conflict', 'Outcome unknown', 'Unavailable', 'Denied']) {
      await page.locator('#state').selectOption(state); await contains('.screen-state', 'illustration');
      assert.equal(await page.locator('#context').isVisible(), false);
    }
    report.browser_checks.push('Nine explicitly labelled state illustrations');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const s of ['route', 'options', 'scope', 'compare', 'review']) {
        await page.locator(`[data-step="${s}"]`).click(); await fits(`${width}-${s}`);
        if (s === 'options' || s === 'compare') await capture(`phone-${width}-${s}`);
      }
      await page.locator('#state').selectOption('Outcome unknown'); await fits(`${width}-unknown`);
      if (width === 320) await capture('phone-320-unknown');
    }
    await page.locator('[data-step="scope"]').click();
    await page.locator('#Q01').fill('SYN long scope description '.repeat(60));
    await contains('#scope-status', 'Proposed scope');
    await contains('#Q01 + small', 'Proposal needs confirmation');
    await fits('320-long-scope'); await capture('phone-320-scope');
    await page.locator('[data-step="route"]').focus(); await page.keyboard.press('Enter');
    await contains('#route-result', 'Express'); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), '2. Options');
    report.browser_checks.push('Five screens at 390/320px, long content and keyboard step activation');
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    await page.reload(); await page.locator('[data-step="options"]').click(); await contains('.option.selected', 'Option A');
    report.browser_checks.push('No page errors/external requests; reload resets selection');
  } finally { await browser.close(); }
}
fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
