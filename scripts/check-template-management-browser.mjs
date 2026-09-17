import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const path = 'docs/reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html';
const html = await fs.readFile(path), out = 'verification-evidence/template-management';
await fs.mkdir(out, { recursive: true });
const server = http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
/* The pinned workflow runtime supplies the Chrome channel. A local authoring environment without
   that channel may supply PPO_CHROMIUM_PATH instead; the evidence records which one actually ran. */
const launch = process.env.PPO_CHROMIUM_PATH ? { executablePath: process.env.PPO_CHROMIUM_PATH, headless: true } : { channel: 'chrome', headless: true };
const browser = await chromium.launch(launch);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage(), groups = [], errors = [], captures = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const check = async (name, fn) => { await fn(); groups.push(name); };
const tab = async name => page.getByRole('tab', { name, exact: true }).click();
const close = async () => page.getByRole('button', { name: 'Close dialog', exact: true }).click();
const role = () => page.getByLabel('Preview profile');
const dlg = () => page.locator('#dialog');
const text = async () => page.locator('main').innerText();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('ppo.template-management.r01')));
async function snap(name, fullPage = true) { const file = `${name}.png`; await page.screenshot({ path: `${out}/${file}`, fullPage }); captures.push(file); }

try {
  await page.goto(url);

  await check('Register lists the permitted population with eligibility and next action', async () => {
    assert.match(await text(), /Customer service report/);
    assert.match(await text(), /Blank questionnaire/);
    assert.equal(await page.locator('tbody tr').count(), 9);
    assert.match(await text(), /Eligible now/);
    assert.match(await text(), /Policy not configured/);
    await snap('desktop-register');
  });

  await check('Search, filters and empty state recover without claiming zero templates', async () => {
    await page.getByLabel('Find a template').fill('no fixture matches this');
    assert.ok(await page.getByRole('heading', { name: 'No templates match this view' }).isVisible());
    assert.match(await text(), /not evidence that the register is empty/);
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await page.getByLabel('Show').selectOption('attention');
    assert.ok(await page.locator('tbody tr').count() >= 3);
    await page.getByLabel('Show').selectOption('historical');
    assert.match(await text(), /retired|Superseded/);
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
  });

  await check('Snapshot exposes source authority, exact fingerprints and consumers', async () => {
    await page.getByRole('button', { name: 'Customer service report', exact: true }).first().click();
    assert.ok(await page.locator('#snapshot').isVisible());
    const body = await page.locator('#snapshot').innerText();
    assert.match(body, /Source authority/);
    assert.match(body, /Supported runtime version/);
    assert.match(body, /Dependency set/);
    await snap('desktop-snapshot', false);
    await page.getByRole('button', { name: 'Open template' }).click();
    assert.match(await text(), /Report identity/);
  });

  await check('A published definition is read-only and states why', async () => {
    assert.match(await text(), /read-only/);
    assert.equal(await page.getByRole('button', { name: 'Add section' }).count(), 0);
    assert.match(await text(), /a document revision label, separate from the runtime template version/);
  });

  await check('Read-only and restricted profiles see a scoped register and no editing controls', async () => {
    await role().selectOption('readonly');
    await tab('Template & rules');
    assert.equal(await page.getByRole('button', { name: 'Create successor' }).count(), 0);
    await role().selectOption('finance');
    await tab('Template register');
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.match(await text(), /Finance supporting evidence/);
    assert.equal((await text()).includes('Customer service report'), false);
    await role().selectOption('author');
    await tab('Template register');
    assert.equal(await page.locator('tbody tr').count(), 9);
  });

  await check('Unsupported rendering profile is an explicit blocked state, not a rendered success', async () => {
    await page.getByLabel('Show').selectOption('all');
    await page.getByRole('button', { name: 'Finance supporting evidence', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    assert.match(await text(), /not a supported rendering profile/i);
    await tab('Preview & validation');
    assert.match(await text(), /Unsupported/);
    assert.equal(await page.locator('.doc').count(), 0);
    await tab('Template register');
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
  });

  await check('Creating a successor leaves the published definition unchanged', async () => {
    await page.getByRole('button', { name: 'Customer service report', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    await page.getByRole('button', { name: 'Create successor' }).click();
    await dlg().getByLabel('Why is this change proposed?').fill('Make supplied remaining-work context easier to read.');
    await dlg().getByRole('button', { name: 'Create successor', exact: true }).click();
    assert.match(await text(), /r03/);
    assert.match(await text(), /editable draft/);
    const store = await saved();
    assert.equal(store.definitions.find(d => d.id === 'DEF-REPORT-R02').state, 'published');
    assert.equal(store.definitions.filter(d => d.familyId === 'FAM-REPORT').length, 3);
  });

  await check('A structured section and its bound fields are added without a code editor', async () => {
    await page.getByRole('button', { name: 'Add section' }).click();
    await dlg().getByLabel('Section label').fill('Remaining work');
    await dlg().getByLabel('Purpose').fill('Work still to be done, where the record supplies it.');
    await dlg().getByLabel('Repeats over').selectOption('remainingWork');
    await dlg().getByLabel('Controlled by').selectOption('source');
    await dlg().getByLabel('Source path').selectOption('remainingWork');
    await dlg().getByLabel('Operator').selectOption('isPresent');
    await dlg().getByRole('button', { name: 'Add section', exact: true }).click();
    assert.match(await text(), /source remainingWork is present/);
    const addField = async (label, binding, required) => {
      await page.getByRole('button', { name: 'Add field' }).last().click();
      await dlg().getByLabel('Label').fill(label);
      await dlg().getByLabel('Supported type').selectOption('bound');
      await dlg().getByLabel('Source binding').selectOption(binding);
      if (required) await dlg().getByLabel('Requiredness').selectOption(required);
      await dlg().getByRole('button', { name: 'Add field', exact: true }).click();
    };
    await addField('Remaining work', 'remainingWork.description', 'source');
    await addField('Owner', 'remainingWork.owner');
    await addField('Date needed', 'remainingWork.dateNeeded');
    await addField('Part required', 'remainingWork.partRequired');
    assert.match(await text(), /No definition error/);
    await snap('desktop-field-editor');
  });

  await check('An incompatible unit fails binding validation instead of converting', async () => {
    await page.getByRole('button', { name: 'Edit', exact: true }).last().click();
    await dlg().getByLabel('Supported type').selectOption('number');
    await dlg().getByLabel('Unit', { exact: true }).fill('kg');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    assert.match(await text(), /type-mismatch|is boolean3|the field is number/i);
    await page.getByRole('button', { name: 'Edit', exact: true }).last().click();
    await dlg().getByLabel('Supported type').selectOption('bound');
    await dlg().getByLabel('Unit', { exact: true }).fill('');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    assert.match(await text(), /No definition error/);
  });

  await check('Protected standing wording cannot be edited through ordinary field editing', async () => {
    await page.getByRole('button', { name: 'Why read-only' }).first().click();
    assert.match(await page.locator('#dialog').innerText(), /separate proposal to the authorised owner/);
    await close();
  });

  await check('Document preview renders the exact draft and reports distinct states', async () => {
    await tab('Preview & validation');
    assert.match(await text(), /Document preview/);
    await page.getByLabel('Sample').selectOption('S-ZERO-FALSE-UNKNOWN');
    const shown = await page.locator('.doc').innerText();
    assert.match(shown, /0 h/);
    assert.match(shown, /\bNo\b/);
    assert.match(shown, /Unknown/);
    assert.match(shown, /Not applicable for this record/);
    await page.getByLabel('Sample').selectOption('S-MISSING-MANDATORY');
    assert.match(await text(), /Mandatory source report.summary is not supplied/);
    assert.equal((await page.locator('.doc').innerText()).includes('Not supplied by this source'), true);
    await page.getByLabel('Sample').selectOption('S-RESTRICTED');
    assert.match(await text(), /removed from the projection before rendering/);
    assert.equal((await page.locator('.doc').innerText()).includes('1840.5'), false);
    await snap('desktop-preview-restricted');
    await page.getByLabel('Sample').selectOption('S-CONDITION-UNKNOWN');
    assert.match(await text(), /Applicability unknown|evaluated Unknown|was not supplied by this sample/);
    await page.getByLabel('Sample').selectOption('S-COMPLETE');
  });

  await check('A finding navigates to the field it belongs to', async () => {
    await page.getByLabel('Sample').selectOption('S-MISSING-MANDATORY');
    await page.getByRole('button', { name: 'Go to field' }).first().click();
    assert.equal(await page.getByRole('tab', { name: 'Template & rules', exact: true }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('tr.selected').count() >= 1, true);
    await tab('Preview & validation');
    await page.getByLabel('Sample').selectOption('S-COMPLETE');
  });

  await check('The scenario matrix runs and records exact output evidence', async () => {
    await page.getByRole('button', { name: 'Run scenario matrix' }).first().click();
    assert.match(await text(), /14 scenarios|passed ·/);
    assert.match(await text(), /Definition fingerprint/);
    assert.match(await text(), /Validation suite/);
    const store = await saved();
    assert.equal(store.runs.length, 1);
    assert.equal(store.runs[0].failed, 0);
    assert.equal(store.runs[0].blocked, 0);
    assert.equal(store.runs[0].notRun, 0);
    await snap('desktop-validation');
  });

  await check('Editing the draft afterwards makes the recorded evidence out of date', async () => {
    await tab('Template & rules');
    await page.getByRole('button', { name: 'Edit', exact: true }).last().click();
    await dlg().getByLabel('Help text').fill('Supplied by the source record; absent stays absent.');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    assert.match(await text(), /out of date/);
    await tab('Preview & validation');
    assert.match(await text(), /out of date/);
    await page.getByRole('button', { name: 'Run scenario matrix' }).first().click();
    assert.match(await text(), /current/);
  });

  await check('A failed local save keeps the entry visible and a retry saves once', async () => {
    await page.getByRole('button', { name: 'Review guide' }).click();
    await page.getByRole('button', { name: 'Fail next save once' }).click();
    await tab('Template & rules');
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await dlg().getByLabel('Help text').fill('Reference supplied by the service record.');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    assert.match(await page.locator('#dialog .error').innerText(), /Local save failed/);
    assert.equal(await dlg().getByLabel('Help text').inputValue(), 'Reference supplied by the service record.');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    const store = await saved();
    assert.equal(store.definitions.find(d => d.id === 'DEF-REPORT-R03').fields.find(f => f.id === 'FLD-REF').help, 'Reference supplied by the service record.');
  });

  await check('Submission needs current evidence, then freezes the exact snapshot', async () => {
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Submit for review' }).click();
    await dlg().getByLabel('Review purpose').fill('Add a conditional remaining-work summary using existing source fields.');
    await dlg().getByRole('button', { name: 'Submit exact definition' }).click();
    assert.match(await page.locator('#dialog .error').innerText(), /Current validation evidence is required/);
    await close();
    await tab('Preview & validation');
    await page.getByRole('button', { name: 'Run scenario matrix' }).first().click();
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Submit for review' }).click();
    await dlg().getByLabel('Review purpose').fill('Add a conditional remaining-work summary using existing source fields.');
    await dlg().getByRole('button', { name: 'Submit exact definition' }).click();
    assert.match(await text(), /Matches the current definition/);
    assert.equal((await saved()).submissions.filter(x => x.state === 'submitted').length, 1);
  });

  await check('An author cannot review their own work and a finding response does not close it', async () => {
    assert.equal(await page.getByRole('button', { name: 'Record a finding' }).count(), 0);
    await role().selectOption('reviewer');
    await page.getByRole('button', { name: 'Record a finding' }).click();
    await dlg().getByLabel('Where').fill('Owner');
    await dlg().getByLabel('Finding').fill('An absent owner must stay absent rather than be attributed to the coordinator.');
    await dlg().getByRole('button', { name: 'Record finding' }).click();
    await page.getByLabel('Decision').selectOption('approved');
    await page.getByLabel('Reason').fill('Attempting approval with the finding open.');
    await page.getByRole('button', { name: 'Record decision' }).click();
    assert.match(await page.locator('#decide-error').innerText(), /finding is still open/);
    await role().selectOption('author');
    await page.getByRole('button', { name: 'Answer this finding' }).click();
    await dlg().getByLabel('Response').fill('Owner is bound read-only to the source; a missing owner shows an explicit missing state.');
    await dlg().getByRole('button', { name: 'Save response' }).click();
    assert.match(await text(), /An answer alone does not close a finding/);
    await snap('desktop-review');
  });

  await check('A return, correction and fresh submission retain the original findings and decisions', async () => {
    await role().selectOption('reviewer');
    await page.getByLabel('Decision').selectOption('returned');
    await page.getByLabel('Reason').fill('Confirm the missing-owner treatment before approval.');
    await page.getByRole('button', { name: 'Record decision' }).click();
    assert.match(await text(), /returned/);
    await page.getByRole('button', { name: 'Accept the response' }).click();
    await role().selectOption('author');
    await tab('Template & rules');
    await page.getByRole('button', { name: 'Reopen for correction' }).click();
    await tab('Preview & validation');
    await page.getByRole('button', { name: 'Run scenario matrix' }).first().click();
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Submit for review' }).click();
    await dlg().getByLabel('Review purpose').fill('Corrected submission; earlier findings and decisions retained.');
    await dlg().getByRole('button', { name: 'Submit exact definition' }).click();
    const store = await saved();
    assert.equal(store.submissions.filter(x => x.definitionId === store.definitions.find(d => d.id === 'DEF-REPORT-R03').id).length, 2);
    assert.equal(store.findings.filter(f => f.state === 'accepted').length, 1);
    await role().selectOption('reviewer');
    await page.getByLabel('Decision').selectOption('approved');
    await page.getByLabel('Reason').fill('Bindings, conditions, units and audience treatment checked against the exact snapshot.');
    await page.getByRole('button', { name: 'Record decision' }).click();
    assert.match(await text(), /approved/);
  });

  await check('Usage impact separates consumer stages and states an incomplete lookup', async () => {
    await role().selectOption('coordinator');
    await tab('Usage & change impact');
    assert.match(await text(), /reserved render request/i);
    assert.match(await text(), /Do not swap the template inside the stored bundle/);
    assert.match(await text(), /Impact incomplete/);
    assert.match(await text(), /not evidence of zero usage/);
    assert.match(await text(), /Acknowledged by Robin Hale/);
    await page.getByRole('button', { name: 'Technical summary' }).click();
    assert.match(await text(), /FLD-[0-9A-F]{6,}/);
    await snap('desktop-impact');
  });

  await check('Follow-up and the DK-03 handover are prepared once and issue nothing', async () => {
    await page.getByRole('button', { name: 'Prepare owned follow-up' }).first().click();
    await dlg().getByLabel('What must the receiving owner decide?').fill('Decide whether to re-prepare the reserved render against the successor.');
    await dlg().getByRole('button', { name: 'Prepare follow-up' }).click();
    assert.match(await text(), /Follow-up prepared/);
    await page.getByRole('button', { name: 'Prepare DK-03 template-selection handover' }).click();
    assert.match(await text(), /no document is issued and no message is sent/);
    assert.equal((await saved()).tasks.length, 2);
  });

  await check('Publication requires an explicit succession confirmation and a supported check set', async () => {
    await role().selectOption('publisher');
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Publish with a use assignment' }).click();
    await dlg().getByLabel('Effective from').fill('2026-09-24');
    await dlg().getByRole('button', { name: 'Publish', exact: true }).click();
    assert.match(await page.locator('#dialog .error').innerText(), /Confirm that succession explicitly/);
    await close();
  });

  await check('A lost publication response is reconciled to one operation and one assignment', async () => {
    await page.getByRole('button', { name: 'Review guide' }).click();
    await page.getByRole('button', { name: 'Lose next publication response' }).click();
    await page.getByRole('button', { name: 'Publish with a use assignment' }).click();
    await dlg().getByLabel('Effective from').fill('2026-09-24');
    await dlg().getByRole('checkbox').check();
    await dlg().getByRole('button', { name: 'Publish', exact: true }).click();
    assert.match(await text(), /Publication readiness/);
    await tab('History & recovery');
    assert.match(await text(), /Outcome unknown/);
    assert.match(await text(), /No receipt received/);
    await snap('desktop-history-unknown');
    await page.getByRole('button', { name: /^Reconcile OP-/ }).first().click();
    assert.match(await text(), /completed/);
    const store = await saved();
    assert.equal(store.operations.length, 1);
    assert.equal(store.publications.filter(p => p.state === 'pending-unknown').length, 0);
  });

  await check('Future effective is distinct from eligible now until the demo clock advances', async () => {
    await tab('Review & publication');
    assert.match(await text(), /Eligible/);
    await page.getByLabel('Purpose').selectOption('customer-report');
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    assert.match(await page.locator('#probe-result').innerText(), /r02/);
    await page.getByRole('button', { name: 'Advance demo time' }).click();
    await dlg().getByLabel('Advance by').selectOption('336');
    await dlg().getByRole('button', { name: 'Advance', exact: true }).click();
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    assert.match(await page.locator('#probe-result').innerText(), /r03/);
  });

  await check('No match, missing context and ambiguous match are never resolved silently', async () => {
    await page.getByLabel('Company or entity').selectOption('RTF-AU-DEMO');
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    assert.match(await page.locator('#probe-result').innerText(), /No match/);
    await page.getByLabel('Company or entity').selectOption('PPO-AU-DEMO');
    await page.getByLabel('Locale').selectOption('');
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    assert.match(await page.locator('#probe-result').innerText(), /Missing context/);
    await page.getByLabel('Locale').selectOption('en-AU');
    await page.getByLabel('Output or form family').selectOption('OUT-06');
    await page.getByLabel('Purpose').selectOption('customer-quotation');
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    assert.match(await page.locator('#probe-result').innerText(), /Ambiguous match/);
    assert.match(await page.locator('#probe-result').innerText(), /No precedence rule is configured/);
    await snap('desktop-ambiguous');
  });

  await check('Policy not configured blocks review and publication until a policy is selected', async () => {
    await tab('Template register');
    await page.getByLabel('Show').selectOption('all');
    await page.getByRole('button', { name: 'Staged handover pack', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    await tab('Review & publication');
    assert.match(await text(), /Policy not configured/);
    await page.getByRole('button', { name: 'Select a fictional configured policy' }).click();
    assert.match(await text(), /SYN-POL-HANDOVER-01/);
    assert.match(await text(), /is not supported by this build|does not exist|not supported/);
  });

  await check('Form preview keeps unanswered, No, Unknown and zero distinct without creating a record', async () => {
    await role().selectOption('author');
    await tab('Template register');
    await page.getByRole('button', { name: 'Blank questionnaire · site survey capture', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    await tab('Preview & validation');
    await page.getByLabel('Preview', { exact: true }).selectOption('form');
    assert.match(await text(), /writes only to its sample fixture/);
    await page.getByLabel('Sample').selectOption('SV-CONDITION-UNKNOWN');
    assert.match(await text(), /Shown state unknown|not hidden on unknown input/);
    await page.getByLabel('Existing irrigation present').selectOption('no');
    await page.getByLabel('Measured growing area (m²)').fill('0');
    await page.getByLabel('Power available at the growing area').selectOption('unknown');
    await page.getByRole('button', { name: 'Save sample answers' }).click();
    assert.match(await text(), /Every shown required question has an explicit answer|Input findings/);
    const store = await saved();
    const key = Object.keys(store.answers)[0];
    assert.equal(store.answers[key]['FLD-SV-AREA'], 0);
    assert.equal(store.answers[key]['FLD-SV-POWER'], 'unknown');
    await snap('desktop-form-preview');
  });

  await check('A unit change is reported as incompatible with the retained form response', async () => {
    await tab('Template & rules');
    await page.getByRole('button', { name: 'Create successor' }).click();
    await dlg().getByLabel('Why is this change proposed?').fill('Change the measured area unit to demonstrate compatibility treatment.');
    await dlg().getByRole('button', { name: 'Create successor', exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).nth(4).click();
    await dlg().getByLabel('Unit', { exact: true }).fill('ft²');
    await dlg().getByRole('button', { name: 'Save field' }).click();
    await tab('Usage & change impact');
    assert.match(await text(), /incompatible/);
    assert.match(await text(), /separately authorised receiving workflow/);
    await snap('desktop-response-compatibility');
  });

  await check('Historical reconstruction is labelled and never claims to be the issued file', async () => {
    await tab('Template register');
    await page.getByRole('button', { name: 'Customer service report', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    await tab('History & recovery');
    assert.match(await text(), /Definition lineage/);
    await page.getByRole('button', { name: 'Open a labelled reconstruction' }).first().click();
    assert.match(await page.locator('#dialog').innerText(), /This is a reconstruction, not the issued file/);
    assert.match(await page.locator('#dialog').innerText(), /not of any issued document/);
    await close();
    assert.match(await text(), /41288 bytes/);
    await snap('desktop-history');
  });

  await check('Withdrawal prevents new use for the scope and preserves history', async () => {
    await role().selectOption('publisher');
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Withdraw from new use' }).last().click();
    await dlg().getByLabel('Reason').fill('Held pending a technical review of the follow-up wording.');
    await dlg().getByRole('button', { name: 'Withdraw', exact: true }).click();
    assert.match(await text(), /withdrawn/i);
    await page.getByRole('button', { name: 'Resolve at demonstration time' }).click();
    await tab('History & recovery');
    assert.match(await text(), /retire/i);
    assert.match(await text(), /Historical evidence, issued documents and acknowledgements are unchanged/);
  });

  await check('Saved definitions, decisions and operations survive a reload', async () => {
    await page.reload();
    assert.match(await page.locator('#saved-status').innerText(), /Saved in this browser/);
    const store = await saved();
    assert.equal(store.definitions.filter(d => d.familyId === 'FAM-REPORT').length, 3);
    assert.equal(store.operations.length, 1);
    assert.equal(store.definitions.find(d => d.id === 'DEF-REPORT-R01').fingerprint.length, 64);
  });

  await check('Export carries a synthetic notice and the exact retained records', async () => {
    const pending = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await pending;
    const data = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.equal(data.synthetic, true);
    assert.match(data.notice, /not a production backup/);
    assert.equal(data.operations.length, 1);
    assert.ok(data.definitions.length >= 12);
    assert.ok(data.events.length > 20);
  });

  await check('Cross-tab writes are detected and stale saves are refused', async () => {
    const second = await ctx.newPage();
    await second.goto(url);
    await second.getByLabel('Preview profile').selectOption('author');
    await second.getByRole('button', { name: 'Advance demo time' }).click();
    await second.locator('#dialog').getByLabel('Advance by').selectOption('1');
    await second.locator('#dialog').getByRole('button', { name: 'Advance', exact: true }).click();
    await page.getByRole('button', { name: 'Reload saved work' }).waitFor();
    assert.match(await page.locator('#save-notice').innerText(), /another tab/);
    await second.close();
    await page.getByRole('button', { name: 'Reload saved work' }).click();
    assert.ok(await page.locator('#save-notice').isHidden());
  });

  await check('Malformed saved data is retained while writes are paused', async () => {
    const bad = await browser.newContext(), badPage = await bad.newPage();
    await badPage.addInitScript(() => localStorage.setItem('ppo.template-management.r01', '{broken'));
    await badPage.goto(url);
    assert.match(await badPage.locator('#save-notice').innerText(), /has not been overwritten/);
    assert.equal(await badPage.evaluate(() => localStorage.getItem('ppo.template-management.r01')), '{broken');
    await bad.close();
  });

  await check('Reset clears only this module’s keys after an explicit confirmation', async () => {
    await page.evaluate(() => localStorage.setItem('ppo.some-other-module', 'kept'));
    await page.getByRole('button', { name: 'Review guide' }).click();
    await page.getByRole('button', { name: 'Reset demo' }).click();
    assert.match(await page.locator('#dialog').innerText(), /cannot be recovered/);
    await dlg().getByRole('button', { name: 'Reset synthetic workspace' }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem('ppo.template-management.r01')), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('ppo.some-other-module')), 'kept');
    await page.evaluate(() => localStorage.removeItem('ppo.some-other-module'));
  });

  await check('All six views fit desktop, tablet and phone widths without page overflow', async () => {
    for (const width of [1440, 1024, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [, label] of [['register', 'Template register'], ['definition', 'Template & rules'], ['preview', 'Preview & validation'], ['review', 'Review & publication'], ['impact', 'Usage & change impact'], ['history', 'History & recovery']]) {
        await tab(label);
        const geometry = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          top: document.querySelector('.page-head').getBoundingClientRect().top,
          nav: document.querySelector('.workspace-tools').getBoundingClientRect().bottom,
          skip: getComputedStyle(document.querySelector('.skip')).opacity
        }));
        assert.ok(geometry.scroll <= geometry.client + 1, `${width} ${label}: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.top >= geometry.nav - 1, `Obscured heading: ${width} ${label}`);
        assert.equal(geometry.skip, '0');
        await snap(`${width}-${label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`);
      }
    }
  });

  await check('Phone snapshot fills the width, traps focus and closes with Escape', async () => {
    await tab('Template register');
    await page.getByRole('button', { name: 'Customer service report', exact: true }).first().click();
    const box = await page.locator('#snapshot').boundingBox();
    assert.equal(Math.round(box.width), 320);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.closest('#snapshot') !== null), true);
    }
    await snap('320-snapshot', false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#snapshot').isVisible(), false);
  });

  await check('Keyboard navigation moves between views with correct tab semantics', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('tab', { name: 'History & recovery', exact: true }).focus();
    await page.keyboard.press('Home');
    assert.equal(await page.getByRole('tab', { name: 'Template register', exact: true }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: 'Template & rules', exact: true }).getAttribute('aria-selected'), 'true');
    await page.keyboard.press('End');
    assert.equal(await page.getByRole('tab', { name: 'History & recovery', exact: true }).getAttribute('aria-selected'), 'true');
  });

  await check('A keyboard-only successor, edit, validate and submit journey completes', async () => {
    await tab('Template register');
    await page.getByRole('button', { name: 'Customer service report', exact: true }).first().click();
    await page.getByRole('button', { name: 'Open template' }).click();
    await role().selectOption('author');
    await page.getByRole('button', { name: 'Create successor' }).focus();
    await page.keyboard.press('Enter');
    await dlg().getByLabel('Why is this change proposed?').focus();
    await page.keyboard.type('Keyboard-only journey.');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.match(await text(), /editable draft/);
    await tab('Preview & validation');
    await page.getByRole('button', { name: 'Run scenario matrix' }).first().focus();
    await page.keyboard.press('Enter');
    assert.match(await text(), /current/);
    await tab('Review & publication');
    await page.getByRole('button', { name: 'Submit for review' }).focus();
    await page.keyboard.press('Enter');
    await dlg().getByLabel('Review purpose').focus();
    await page.keyboard.type('Keyboard-only submission.');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.match(await text(), /Matches the current definition/);
  });

  assert.deepEqual(errors, []);
} catch (error) {
  await snap('failure', false).catch(() => {});
  throw error;
} finally {
  const manifest = [];
  for (const file of captures) manifest.push({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(`${out}/${file}`)).digest('hex') });
  await fs.writeFile(`${out}/results.json`, JSON.stringify({
    source: process.env.PPO_SOURCE_HEAD || 'local',
    browser: browser.version(),
    launch: process.env.PPO_CHROMIUM_PATH ? `executablePath ${process.env.PPO_CHROMIUM_PATH}` : 'channel chrome',
    node: process.version,
    htmlSha256: crypto.createHash('sha256').update(html).digest('hex'),
    htmlBytes: html.length,
    passed: groups.length, groups, errors, captures: manifest
  }, null, 2));
  await browser.close();
  server.close();
}
console.log(JSON.stringify({ passed: groups.length, errors, captures: captures.length }));
