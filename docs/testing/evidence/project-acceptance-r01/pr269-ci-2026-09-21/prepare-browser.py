from pathlib import Path
import hashlib
import json

root = Path('.')
suite = root/'tmp/pr269-tests'
suite.mkdir(parents=True, exist_ok=True)
source = (root/'tests/browser/quality-states.spec.ts').read_text(encoding='utf-8')
adapted = source.replace('"../helpers/', '"../../tests/helpers/').replace('"../../tests/helpers/quality-browser"', '"./quality-browser"')
(suite/'quality-states.spec.ts').write_bytes(adapted.encode('utf-8'))
start = adapted.index('      const recoveredRead =')
end = adapted.index('      await expect(page.locator', start)
negative = adapted[:start] + '      await page.reload({ waitUntil: "domcontentloaded" });\n' + adapted[end:]
(suite/'quality-before.spec.ts').write_bytes(negative.encode('utf-8'))
mobile_isolated = adapted.replace('"2031-11-06"', '"2031-11-13"').replace('mobile ? 42 : 41', 'mobile ? 44 : 41')
(suite/'quality-mobile-isolated.spec.ts').write_bytes(mobile_isolated.encode('utf-8'))
helper = (root/'tests/helpers/quality-browser.ts').read_text(encoding='utf-8').replace('127.0.0.1:3000', '127.0.0.1:3014')
(suite/'quality-browser.ts').write_bytes(helper.encode('utf-8'))
config = '''import { defineConfig } from '@playwright/test';
export default defineConfig({
  globalSetup: '../scripts/check-browser.ts', testDir: './pr269-tests', workers: 1, timeout: 45000,
  use: { channel: 'chrome', baseURL: 'http://127.0.0.1:3014', locale: 'en-AU', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ], reporter: [['list']], outputDir: './pr269-browser-results'
});
'''
(root/'tmp/pr269.config.ts').write_bytes(config.encode('utf-8'))
hashes = {p: hashlib.sha256((root/p).read_bytes()).hexdigest() for p in [
    'tests/browser/quality-states.spec.ts', 'tests/database/crm.test.ts',
    'tests/helpers/engineering-changes-direct.ts', 'tests/helpers/quality-browser.ts',
    'tmp/pr269-tests/quality-states.spec.ts', 'tmp/pr269-tests/quality-before.spec.ts', 'tmp/pr269-tests/quality-mobile-isolated.spec.ts', 'tmp/pr269-tests/quality-browser.ts', 'tmp/pr269.config.ts']}
(root/'tmp/pr269-repair/test-source-hashes.json').write_text(json.dumps(hashes, indent=2)+'\n', encoding='utf-8')
print('Browser harness: imports/origin adapted to port 3014. Negative removes only recovered-read wait. Separate mobile replay changes only fixture day/slot to avoid the retained negative booking.')
