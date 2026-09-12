// Verify accepted UI design baselines, and optionally compare them with the running
// application. Design-side mode needs no server, database, account or network.
//
//   node scripts/design-baseline-check.mjs
//   node scripts/design-baseline-check.mjs --baseline field-technicians-r05
//   node scripts/design-baseline-check.mjs --app http://127.0.0.1:3000
//
// --app additionally opens each baseline's app_route, reads the same token names from
// the application's scope container and reports drift. It proves visual token agreement,
// not business behaviour, permissions or acceptance.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const registryPath = 'docs/standards/ui-baselines.json';
const output = resolve(process.env.PPO_BASELINE_OUTPUT || 'verification-evidence/ui-baselines');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const git = arg => {
  try {
    return execFileSync('git', ['rev-parse', arg], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
};

const args = process.argv.slice(2);
const argValue = name => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1] ?? null; };
const only = argValue('--baseline');
const appBase = argValue('--app');
const storageState = process.env.PPO_STORAGE_STATE || argValue('--storage-state') || undefined;

const registry = JSON.parse(await readFile(registryPath, 'utf8'));
const selected = registry.baselines.filter(b => !only || b.id === only);
if (!selected.length) {
  console.error(`No baseline matches --baseline ${only}. Known: ${registry.baselines.map(b => b.id).join(', ')}`);
  process.exit(2);
}

const failures = [];
const fail = (baseline, check, detail) => {
  failures.push({ baseline, check, detail });
  console.error(`FAIL  ${baseline} · ${check}: ${detail}`);
};
const pass = (baseline, check, detail = '') =>
  console.log(`pass  ${baseline} · ${check}${detail ? ` · ${detail}` : ''}`);

// Read every custom property declared anywhere in the document, resolved against the
// scope container. Stylesheet enumeration is wrapped because a cross-origin sheet throws.
const readTokens = (page, selector) => page.evaluate(sel => {
  const element = document.querySelector(sel);
  if (!element) return null;
  const computed = getComputedStyle(element);
  const values = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!rule.style) continue;
        for (const name of rule.style) {
          if (name.startsWith('--')) values[name] = computed.getPropertyValue(name).trim();
        }
      }
    } catch { /* unreadable sheet; the scope container still resolves what it inherits */ }
  }
  return values;
}, selector);

const pageSize = page => page.evaluate(() => ({
  scroll: document.documentElement.scrollWidth,
  client: document.documentElement.clientWidth,
}));

const browser = await chromium.launch({ headless: true });
const evidence = {
  scope: 'Design baseline integrity and token comparison only; not application, accessibility or business acceptance',
  registry: registryPath,
  registry_sha256: sha256(await readFile(registryPath)),
  source_head: process.env.PPO_SOURCE_HEAD || git('HEAD'),
  executed_checkout: git('HEAD'),
  executed_tree: git('HEAD^{tree}'),
  browser: browser.version(),
  app_base: appBase,
  run_id: process.env.GITHUB_RUN_ID || null,
  attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  baselines: [],
  captures: [],
  result: 'in progress',
  failures,
};
await mkdir(output, { recursive: true });

try {
  const designTokens = {};

  for (const baseline of selected) {
    const record = { id: baseline.id, design: baseline.design, checks: [] };

    // 1. Document integrity. The accepted bytes are the baseline; nothing else is.
    const bytes = await readFile(baseline.design);
    const actual = sha256(bytes);
    if (actual !== baseline.sha256) {
      fail(baseline.id, 'integrity', `design file sha256 ${actual} does not match the register`);
      record.checks.push({ check: 'integrity', result: 'fail', actual });
      evidence.baselines.push(record);
      continue;
    }
    if (bytes.length !== baseline.bytes) fail(baseline.id, 'integrity', `byte length ${bytes.length} does not match the register`);
    pass(baseline.id, 'integrity', `${bytes.length} bytes`);
    record.checks.push({ check: 'integrity', result: 'pass', sha256: actual, bytes: bytes.length });

    const context = await browser.newContext({ viewport: registry.viewports[0] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(pathToFileURL(resolve(baseline.design)).href);
    await page.evaluate(() => document.fonts.ready);

    // 2. The scope container exists and is the single styling boundary.
    const present = await page.locator(baseline.scope_selector).count();
    if (present !== 1) fail(baseline.id, 'scope-container', `${baseline.scope_selector} matched ${present} elements, expected exactly 1`);
    else pass(baseline.id, 'scope-container', baseline.scope_selector);
    record.checks.push({ check: 'scope-container', result: present === 1 ? 'pass' : 'fail', selector: baseline.scope_selector, matched: present });

    // 3. Declared tokens, resolved on the scope container.
    const tokens = await readTokens(page, baseline.scope_selector) || {};
    designTokens[baseline.id] = tokens;
    const count = Object.keys(tokens).length;
    if (count !== baseline.declared_tokens) fail(baseline.id, 'token-count', `${count} tokens resolved, register declares ${baseline.declared_tokens}`);
    else pass(baseline.id, 'token-count', `${count} tokens`);
    record.checks.push({ check: 'token-count', result: count === baseline.declared_tokens ? 'pass' : 'fail', resolved: count, declared: baseline.declared_tokens });
    record.tokens = tokens;

    // 4. No horizontal overflow at any declared viewport, and a hashed capture of each.
    for (const viewport of registry.viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      const size = await pageSize(page);
      if (size.scroll > size.client + 1) fail(baseline.id, `overflow/${viewport.name}`, `scrollWidth ${size.scroll} exceeds clientWidth ${size.client}`);
      else pass(baseline.id, `overflow/${viewport.name}`, `${size.client}px`);
      const filename = `${baseline.id}-design-${viewport.name}.png`;
      const shot = await page.screenshot({ path: resolve(output, filename), fullPage: true });
      evidence.captures.push({ filename, baseline: baseline.id, side: 'design', viewport, bytes: shot.length, sha256: sha256(shot) });
      record.checks.push({ check: `overflow/${viewport.name}`, result: size.scroll > size.client + 1 ? 'fail' : 'pass', ...size });
    }

    // 5. A design baseline that logs errors is not a baseline.
    if (errors.length) fail(baseline.id, 'console', `${errors.length} error(s): ${errors[0]}`);
    else pass(baseline.id, 'console', '0 errors');
    record.checks.push({ check: 'console', result: errors.length ? 'fail' : 'pass', errors });

    await context.close();
    evidence.baselines.push(record);
  }

  // 6. Shared-core agreement across baselines, honouring recorded divergences only.
  const core = registry.shared_token_core.names;
  const allowed = new Map(registry.known_divergences.entries.map(entry => [entry.token, entry.values]));
  const declaring = Object.entries(designTokens).filter(([, tokens]) => core.some(name => name in tokens));
  let drift = 0;
  for (const name of core) {
    const seen = declaring.filter(([, tokens]) => name in tokens).map(([id, tokens]) => [id, tokens[name]]);
    const distinct = [...new Set(seen.map(([, value]) => value))];
    if (distinct.length <= 1) continue;
    const recorded = allowed.get(name);
    const asRecorded = recorded && seen.every(([id, value]) => !(id in recorded) || recorded[id] === value);
    if (asRecorded) { console.log(`note  shared-core · ${name} differs as recorded in known_divergences`); continue; }
    drift += 1;
    fail('shared-core', name, seen.map(([id, value]) => `${id}=${value}`).join(' '));
  }
  if (!drift) pass('shared-core', 'token-agreement', `${core.length} names across ${declaring.length} baselines, ${allowed.size} recorded divergence(s)`);

  // 7. Application comparison, when a running application is supplied.
  if (appBase) {
    const implemented = selected.filter(baseline => baseline.app_route && baseline.app_scope_selector);
    if (!implemented.length) console.log('note  --app supplied but no selected baseline declares an app_route');
    for (const baseline of implemented) {
      const context = await browser.newContext({ viewport: registry.viewports[0], ...(storageState ? { storageState } : {}) });
      const page = await context.newPage();
      const url = new URL(baseline.app_route, appBase).href;
      let reachable = true;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response || !response.ok()) { fail(baseline.id, 'app-route', `${url} returned ${response ? response.status() : 'no response'}`); reachable = false; }
      } catch (error) { fail(baseline.id, 'app-route', `${url} ${error.message}`); reachable = false; }

      if (reachable) {
        const found = await page.locator(baseline.app_scope_selector).count();
        if (found !== 1) {
          fail(baseline.id, 'app-scope-container', `${baseline.app_scope_selector} matched ${found} elements at ${url}. A signed-out or redirected page cannot be compared`);
        } else {
          pass(baseline.id, 'app-scope-container', url);
          const appTokens = await readTokens(page, baseline.app_scope_selector) || {};
          const design = designTokens[baseline.id] || {};
          const missing = Object.keys(design).filter(name => !(name in appTokens));
          const different = Object.keys(design).filter(name => name in appTokens && appTokens[name] !== design[name]);
          if (missing.length) fail(baseline.id, 'app-token-coverage', `${missing.length} design token(s) absent in the application: ${missing.slice(0, 6).join(', ')}`);
          else pass(baseline.id, 'app-token-coverage', `${Object.keys(design).length} tokens present`);
          if (different.length) {
            for (const name of different) fail(baseline.id, `app-token/${name}`, `design=${design[name]} app=${appTokens[name]}`);
          } else pass(baseline.id, 'app-token-values', 'no drift');

          for (const viewport of registry.viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
            const filename = `${baseline.id}-app-${viewport.name}.png`;
            const shot = await page.screenshot({ path: resolve(output, filename), fullPage: true });
            evidence.captures.push({ filename, baseline: baseline.id, side: 'app', viewport, bytes: shot.length, sha256: sha256(shot) });
          }
          const record = evidence.baselines.find(item => item.id === baseline.id);
          if (record) record.app = { url, tokens_compared: Object.keys(design).length, missing, different };
        }
      }
      await context.close();
    }
  }

  evidence.result = failures.length ? 'failed' : 'passed';
} catch (error) {
  evidence.result = 'error';
  failures.push({ baseline: 'harness', check: 'execution', detail: error.message });
  console.error(`FAIL  harness · execution: ${error.message}`);
} finally {
  await browser.close();
  await writeFile(resolve(output, 'ui-baseline-evidence.json'), JSON.stringify(evidence, null, 2));
}

console.log(`\n${evidence.result.toUpperCase()} · ${selected.length} baseline(s) · ${evidence.captures.length} capture(s) · evidence in ${output}`);
process.exit(failures.length ? 1 : 0);
