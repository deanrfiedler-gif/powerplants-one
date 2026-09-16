// CS-01 Customer 360 — model and DOM-emulation assurance.
// This is not a rendered browser, a device test or a business acceptance run.
// Usage:
//   PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node scripts/check-customer-360-design.mjs [--write-evidence]
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const {JSDOM, VirtualConsole} = await import(
  process.env.PPO_DESIGN_JSDOM_MODULE ? pathToFileURL(process.env.PPO_DESIGN_JSDOM_MODULE).href : 'jsdom');

const path = new URL('../docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html', import.meta.url);
const html = fs.readFileSync(path, 'utf8');
const results = [];
const pageErrors = [];
let dom, w, d, M;

function create(raw, storageFails = false) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => pageErrors.push(e.message));
  dom = new JSDOM(html, {
    url: 'https://customer-360-design.invalid/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      win.scrollTo = () => {};
      win.HTMLElement.prototype.scrollIntoView = () => {};
      win.HTMLDialogElement.prototype.show = function () { this.open = true; };
      win.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
      win.HTMLDialogElement.prototype.close = function () { this.open = false; };
      if (raw !== undefined && raw !== null) win.localStorage.setItem('ppo-customer-360-r01', raw);
      if (storageFails) win.Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
    }
  });
  w = dom.window;
  d = w.document;
  M = w.Customer360Model;
}

const q = s => d.querySelector(s);
const all = s => [...d.querySelectorAll(s)];
const text = s => (q(s) || {textContent: ''}).textContent;
const state = () => w.PPOCustomer360.getState();
const check = (name, fn) => { fn(); results.push({name, status: 'passed'}); console.log('PASS ' + name); };
const click = (action, extra = '') => {
  const el = q(`[data-action="${action}"]${extra}`);
  assert.ok(el, 'Control exists: ' + action + extra);
  assert.ok(!el.disabled, 'Control enabled: ' + action + extra);
  el.click();
};
const setField = (id, value, event = 'change') => {
  const el = d.getElementById(id);
  assert.ok(el, 'Field exists: ' + id);
  el.value = value;
  el.dispatchEvent(new w.Event(event, {bubbles: true}));
};
const go = view => click('navigate', `[data-view="${view}"]`);
// jsdom arrays come from another realm, so compare structurally rather than by reference.
const same = (actual, expected, message) => assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
const closeDialog = id => q('#' + id + ' [data-action="close-dialog"]').click();

create();

/* ------------------------------------------------ 1. model and starter data */

check('Two synthetic customers exist and only one is in context at a time', () => {
  assert.equal(M.organisations.length, 2);
  assert.equal(state().org, M.ORG.willowbank);
  assert.equal(all('#customer-selector option').length, 2);
});

check('One organisation relates to several company-specific ERP accounts', () => {
  const mapped = M.accountsForOrg(M.ORG.willowbank);
  assert.equal(mapped.length, 2);
  same(mapped.map(a => a.company).sort(), ['SYN-CO-AU-01', 'SYN-CO-NZ-01']);
  assert.ok(mapped.every(a => a.effectiveFrom && a.mappingRef && a.mappedBy));
});

check('One source account is returned with a similar name and no confirmed mapping', () => {
  const unresolved = M.unresolvedAccounts();
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].org, null);
  assert.equal(unresolved[0].effectiveFrom, null);
  assert.equal(unresolved[0].mappingRef, null);
});

check('Every synthetic identity is a reserved SYN reference', () => {
  const refs = [...M.orders.map(o => o.id), ...M.quotations.map(x => x.displayRef || x.id),
    ...M.cases.map(c => c.id), ...M.projects.map(p => p.id), ...M.financeRecords.map(f => f.id)];
  assert.ok(refs.every(ref => ref.startsWith('SYN-')), 'All references are synthetic');
});

/* ------------------------------------------------------------- 2. overview */

check('Overview opens on the central question and names the relationship owner', () => {
  assert.match(text('#main-heading'), /What is happening with Willowbank Horticulture/);
  assert.match(text('#content'), /Relationship owner/);
  assert.match(text('#content'), /Priya Raman/);
  assert.match(text('#content'), /Service coordinator/);
});

check('Overview separates operator, property owner and bill payer', () => {
  assert.match(text('#content'), /Operator/);
  assert.match(text('#content'), /Property owner/);
  assert.match(text('#content'), /Bill payer/);
  assert.match(text('#content'), /A shared address or a similar name establishes none of them/);
});

check('Every summary tile states the scope of what it counted', () => {
  const tiles = all('.summary-tile');
  assert.ok(tiles.length >= 8);
  assert.ok(tiles.every(tile => tile.querySelector('.tile-scope').textContent.trim().length > 10));
});

check('Each attention item names record, reason, owner, due meaning and next action', () => {
  const items = all('.attention-item');
  assert.ok(items.length >= 10);
  for (const item of items) {
    assert.ok(item.querySelector('.origin .pill'), 'Originating record');
    assert.ok(item.querySelector('.reason').textContent.trim().length > 10, 'Reason');
    assert.match(item.querySelector('.next-action').textContent, /Next action:/);
    const meta = item.querySelector('.attention-meta').textContent;
    assert.match(meta, /(Date needed|Follow-up due|Renewal due):/);
    assert.ok(/[A-Z][a-z]+ [A-Z]/.test(meta), 'Named owner');
  }
});

check('The workspace does not add a second application shell or navigation rail', () => {
  assert.equal(q('.sidebar'), null);
  assert.equal(q('.brand'), null);
  assert.equal(q('nav[aria-label="Global navigation"]'), null);
  assert.equal(all('h1').length, 1);
});

/* -------------------------------------------------------- 3. sales orders */

go('orders');

check('The sales-order register lists only this customer’s mapped-account orders', () => {
  const rows = all('.register tbody tr[data-row-id]');
  const ids = rows.map(r => r.dataset.rowId);
  assert.ok(ids.includes('SYN-MYOB-SO-004412'));
  assert.ok(ids.includes('SYN-MYOB-SO-006001'), 'The NZ company order belongs to the same customer');
  assert.ok(!ids.includes('SYN-MYOB-SO-005120'), 'No other customer order appears');
  assert.ok(!ids.includes('SYN-MYOB-SO-004489'), 'No unmapped order is listed as this customer’s');
});

check('Unresolved source records are separated, labelled and explicitly not counted', () => {
  const body = text('#content');
  assert.match(body, /Unresolved source records/);
  assert.match(body, /SYN-MYOB-SO-004489/);
  assert.match(body, /Not counted/);
  assert.match(body, /A similar name is not a mapping/);
});

check('Order amounts are stated per currency and never consolidated', () => {
  const body = text('#content');
  assert.match(body, /AUD/);
  assert.match(body, /NZD/);
  assert.match(body, /never added together/);
  assert.match(body, /no approved conversion definition exists/);
  const totals = M.totalByCurrency(M.ordersForOrg(M.ORG.willowbank), 'orderAmountExTax');
  assert.equal(totals.byCurrency.length, 2);
});

check('Outstanding supply is only computed where both measures are known', () => {
  const partial = M.byId(M.orders, 'SYN-MYOB-SO-004380');
  assert.equal(M.lineOutstanding(partial.lines[1]), 20);
  const stale = M.byId(M.orders, 'SYN-MYOB-SO-004470');
  assert.equal(M.lineOutstanding(stale.lines[0]), null);
  assert.equal(M.orderFulfilment(stale).determinable, false);
});

click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004412"]');

check('The order snapshot carries source, company, account and identity fields', () => {
  const body = text('#detail');
  assert.match(body, /MYOB Acumatica/);
  assert.match(body, /Simulated adapter/);
  assert.match(body, /Powerplants Australia Pty Ltd/);
  assert.match(body, /WILLOW001/);
  assert.match(body, /PO-WB-3391/);
  assert.match(body, /SO — Sales order/);
});

check('Requested, confirmed and expected delivery are three distinct values', () => {
  const body = text('#detail');
  assert.match(body, /Requested delivery/);
  assert.match(body, /Confirmed delivery/);
  assert.match(body, /Expected delivery/);
  assert.match(body, /three distinct values/);
});

check('Ordered, allocated, shipped, delivered, cancelled, returned and invoiced stay separate', () => {
  const labels = all('#detail .quantity-cell dt').map(x => x.textContent);
  same(labels, ['Ordered', 'Allocated', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Invoiced']);
  assert.match(text('#detail'), /separate measures/);
});

check('The accepted quotation and its exact revision are retained on the order', () => {
  assert.match(text('#detail'), /SYN-PPO-QUO-000318 revision r02/);
  assert.match(text('#detail'), /No mapped difference is reported/);
});

check('A one-off line without a catalogue product is shown as a description', () => {
  assert.match(text('#detail'), /One-off description — no catalogue product/);
});

closeDialog('detail');
click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004380"]');

check('Partial fulfilment shows outstanding lines, a source hold and a missing expected date', () => {
  const body = text('#detail');
  assert.match(body, /Source-reported hold/);
  assert.match(body, /CRHLD/);
  assert.match(body, /line\(s\) have an outstanding balance of supply/);
  assert.match(body, /Expected delivery/);
  assert.match(body, /Not supplied/);
});

check('A mapped difference from the accepted quotation is shown, not silently absorbed', () => {
  const body = text('#detail');
  assert.match(body, /The order differs from the accepted quotation/);
  assert.match(body, /accepted 40 M, ordered 60 M/);
  assert.match(body, /Reason not supplied by the source/);
});

check('Shipment and invoice references are shown per line', () => {
  assert.match(text('#detail'), /SYN-MYOB-SHP-002210/);
  assert.match(text('#detail'), /SYN-MYOB-INV-010044/);
});

closeDialog('detail');
click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004470"]');

check('A failed observation retains last-good values and labels them stale', () => {
  const body = text('#detail');
  assert.match(body, /This order detail is stale/);
  assert.match(body, /HTTP 503/);
  assert.match(body, /Last-good values are retained/);
  assert.match(body, /unknown, not zero/);
});

check('Unknown quantities on a stale order are rendered unknown rather than zero', () => {
  const cells = all('#detail .quantity-cell dd');
  assert.equal(cells[0].textContent, '4', 'Ordered is known across the two lines');
  assert.ok(cells.slice(1).every(cell => cell.textContent === 'Not supplied'));
  assert.ok(cells.slice(1).every(cell => cell.classList.contains('unknown')));
});

check('Requesting a source refresh changes no record and says what happened', () => {
  const before = JSON.stringify(M.byId(M.orders, 'SYN-MYOB-SO-004470'));
  click('refresh-source', '[data-id="SYN-MYOB-SO-004470"]');
  assert.match(text('#toast'), /returned the same failure/);
  assert.match(text('#toast'), /Nothing was written to the source/);
  assert.equal(JSON.stringify(M.byId(M.orders, 'SYN-MYOB-SO-004470')), before);
});

closeDialog('detail');
click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004455"]');

check('A cancelled order shows its cancellation and carries no invoice', () => {
  const body = text('#detail');
  assert.match(body, /Cancelled/);
  assert.match(body, /CUSTREQ/);
  assert.match(body, /No invoice recorded/);
});

closeDialog('detail');
click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004301"]');

check('A completed historical order retains its shipment and invoice references', () => {
  assert.match(text('#detail'), /SYN-MYOB-INV-009912/);
  assert.match(text('#detail'), /Completed/);
});

closeDialog('detail');
click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004489"]');

check('An unmapped order states that it is attributed to nobody and counted nowhere', () => {
  const body = text('#detail');
  assert.match(body, /No confirmed customer mapping/);
  assert.match(body, /excluded from every count and total/);
});

closeDialog('detail');

check('No ERP edit, release, cancellation, payment or fulfilment control exists', () => {
  const labels = all('button').map(b => b.textContent.trim().toLowerCase());
  const forbidden = /^(release|cancel order|post payment|apply payment|ship|allocate|invoice|approve order|reopen order)\b/;
  assert.ok(!labels.some(label => forbidden.test(label)), 'No operational ERP action label');
});

/* ------------------------------------------ 4. accepted quotation vs order */

check('An accepted quotation with an unknown conversion is never presented as an order', () => {
  const body = text('#content');
  assert.match(body, /Accepted quotations that are not orders/);
  assert.match(body, /SYN-PPO-QUO-000322/);
  assert.match(body, /conversion outcome unknown/);
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  assert.ok(!ids.includes('SYN-PPO-QUO-000322'));
});

click('boundary', '[data-target="es07"]');

check('Conversion and recovery link to ES-07 instead of being recreated here', () => {
  assert.ok(q('#decision').open);
  assert.match(text('#decision'), /ES-07 — One-off item resolution and conversion/);
  assert.match(text('#decision'), /Receiving boundary/);
});

closeDialog('decision');

/* ------------------------------------------------- 5. deals and quotations */

go('deals');

check('Quotation states are distinguished as the source defines them', () => {
  const body = text('#content');
  for (const value of ['Accepted', 'Sent', 'Declined', 'Superseded']) assert.match(body, new RegExp(value));
});

check('Alternative estimate options are marked mutually exclusive and never totalled', () => {
  const body = text('#content');
  assert.match(body, /Option A/);
  assert.match(body, /Option B/);
  assert.match(body, /Alternative options are mutually exclusive/);
  assert.match(body, /never totalled/);
});

check('Successive revisions of one quotation are not counted as separate commitments', () => {
  const body = text('#content');
  assert.match(body, /revisions of one quotation are listed separately but counted once as a commitment/);
  const superseded = M.quotations.find(x => x.id === 'SYN-PPO-QUO-000318-r01');
  assert.equal(superseded.displayRef, 'SYN-PPO-QUO-000318');
  assert.equal(superseded.state, 'Superseded');
});

check('Opportunity forecast value is never added to orders, invoices or payments', () => {
  assert.match(text('#content'), /It is not an order, an invoice or a payment, and it is never added to them/);
});

/* ------------------------------------------------------ 6. cases & service */

go('cases');

check('A completed visit does not resolve the case or its remaining work', () => {
  const body = text('#content');
  assert.match(body, /SYN-PPO-TKT-000731/);
  assert.match(body, /In progress/);
  assert.match(body, /Attendance complete\. Findings recorded\. The case remains open/);
  assert.match(body, /Unresolved finding/);
});

check('Symptom, suspected cause, verified finding and agreed resolution stay distinguishable', () => {
  const body = text('#content');
  assert.match(body, /Customer-reported symptom/);
  assert.match(body, /Suspected cause/);
  assert.match(body, /Verified finding/);
  assert.match(body, /Agreed resolution/);
  assert.match(body, /four different statements/);
});

check('Report acknowledgement is bound to the exact issued revision', () => {
  const body = text('#content');
  assert.match(body, /SYN-PPO-RPT-000254 r01/);
  assert.match(body, /acknowledged 13 September 2026/);
  assert.match(body, /would not inherit this acknowledgement/);
});

check('Billing state is stated separately from attendance', () => {
  assert.match(text('#content'), /Billing state: Not yet handed to Finance/);
});

check('Customer warranty outcome and supplier recovery are separate facts', () => {
  const body = text('#content');
  assert.match(body, /Replacement unit supplied/);
  assert.match(body, /No supplier decision has been received/);
  assert.match(body, /Neither implies the other/);
});

check('A new case with no work order shows its next action and date needed', () => {
  const body = text('#content');
  assert.match(body, /SYN-PPO-TKT-000744/);
  assert.match(body, /No work order has been authorised for this case/);
  assert.match(body, /Triage and confirm the scope/);
});

check('No service level or priority threshold is invented', () => {
  assert.match(text('#content'), /No service level is defined for this prototype/);
    assert.ok(!/\bpriority[:\s]+(critical|high|medium|low|P[1-4])\b/i.test(text('#content')), 'No invented priority value');
  assert.ok(!/\bSLA\b|\bhealth score[:\s]*\d|\bscore[:\s]*\d+\s*\/\s*\d/i.test(text('#content')), 'No invented service level or score');
});

/* ------------------------------------------------------------ 7. projects */

go('projects');

check('Technical completion, customer acceptance and commercial closeout are separate', () => {
  const body = text('#content');
  assert.match(body, /Technical completion/);
  assert.match(body, /Customer acceptance/);
  assert.match(body, /Commercial closeout/);
  assert.match(body, /three separate facts/);
});

check('A delivered and accepted project can still be commercially open', () => {
  const project = M.byId(M.projects, 'SYN-PPO-PRJ-000188');
  assert.equal(project.technicalCompletion, '2026-06-30');
  assert.equal(project.customerAcceptance, '2026-07-14');
  assert.equal(project.commercialCloseout, null);
  assert.match(text('#content'), /Outstanding/);
});

check('Variation values are not added to order or invoice measures', () => {
  assert.match(text('#content'), /Variation values are separate commercial items/);
  assert.match(text('#content'), /not added to the project value, the order amounts or any invoice total/);
});

/* -------------------------------------------------- 8. sites and equipment */

go('sites');

check('Equipment physical location and served growing areas stay distinct', () => {
  const body = text('#content');
  assert.match(body, /Physical location/);
  assert.match(body, /Areas served/);
  assert.match(body, /containment is not a service grouping/);
  const pump = M.byId(M.assets, 'SYN-PPO-AST-000501');
  assert.equal(pump.installed, 'SYN-PPO-FAC-000406');
  assert.equal(pump.served.length, 3);
});

check('The full hierarchy is linked rather than duplicated', () => {
  assert.ok(q('[data-action="boundary"][data-target="areas"]'));
  assert.match(text('#content'), /Open the full hierarchy \(CS-05\)/);
});

check('Each asset appears once for its site', () => {
  const refs = all('#content .card .row.between strong').map(x => x.textContent).filter(t => t.startsWith('SYN-PPO-AST'));
  assert.equal(refs.length, new Set(refs).size);
});

/* ---------------------------------------------------------- 9. permissions */

check('Finance visibility is withheld from the coordinator role without leaking a summary', () => {
  go('accounts');
  const body = text('#content');
  assert.match(body, /Finance visibility is not granted/);
  assert.ok(!/1,100|600\.00|4,180/.test(body), 'No amount leaks into the restricted view');
  go('overview');
  assert.match(text('#content'), /Restricted for this role/);
  assert.ok(!/1,100|600\.00/.test(text('#content')));
  assert.equal(M.financeRecords.length > 0, true);
});

check('Search cannot surface a restricted private communication', () => {
  go('activity');
  setField('record-search', 'Restricted internal commercial note', 'input');
  assert.equal(all('.timeline-item').length, 0, 'The restricted note is not returned by search');
  assert.ok(!all('.timeline-item').some(item => /Restricted internal/.test(item.textContent)));
  click('clear-search');
  assert.match(text('#content'), /private entry is withheld from this role/);
  assert.ok(!/Restricted internal commercial note/.test(text('.timeline')||''));
});

click('about');
setField('demo-role', 'technician');

check('An operational-only role loses the commercial sections entirely', () => {
  const tabs = all('[role=tab]').map(t => t.textContent.trim());
  assert.ok(!tabs.some(t => /Sales orders|Deals|Projects|Accounts/.test(t)));
  assert.ok(tabs.some(t => /Cases & service/.test(t)));
  go('overview');
  assert.ok(!/Open sales orders|Quotations awaiting/.test(text('#content')));
});

closeDialog('detail');
click('about');
setField('demo-role', 'account-manager');
closeDialog('detail');
go('accounts');

check('A permitted role sees account observations with their own source context', () => {
  const body = text('#content');
  assert.match(body, /WILLOW001/);
  assert.match(body, /1,100\.00 AUD/);
  assert.match(body, /600\.00 AUD/);
  assert.match(body, /Source as at/);
});

check('No account balance is derived from the rows that happened to arrive', () => {
  const body = text('#content');
  assert.match(body, /Account balance/);
  assert.match(body, /Not available/);
  assert.match(body, /Page 2 of 2 was not returned/);
  assert.match(body, /Why no total is shown/);
  const balance = M.accountBalance('ACC-AU-WILLOW001');
  assert.equal(balance.amount, null);
  assert.equal(balance.state, 'Unavailable');
});

check('Fixture F-01 keeps the original and the source remaining amount separate', () => {
  const invoice = M.byId(M.financeRecords, 'SYN-MYOB-INV-010044');
  assert.equal(invoice.original, 1100);
  assert.equal(invoice.remaining, 600);
  assert.equal(invoice.applied.reduce((sum, a) => sum + a.amount, 0), 500);
});

check('Fixture F-02 unapplied cash is shown separately and nets nothing', () => {
  const body = text('#content');
  assert.match(body, /SYN-MYOB-PMT-004411/);
  assert.match(body, /Unapplied/);
  const invoice = M.byId(M.financeRecords, 'SYN-MYOB-INV-010044');
  assert.equal(invoice.remaining, 600, 'Unapplied cash does not reduce the invoice');
});

check('A deposit held against an order does not make the order paid', () => {
  click('open', '[data-kind="finance"][data-id="SYN-MYOB-DEP-000212"]');
  const body = text('#detail');
  assert.match(body, /Held/);
  assert.match(body, /does not make the order paid/);
  assert.match(body, /An order’s status never establishes that it is paid/);
  closeDialog('detail');
});

check('A disputed invoice with no source remaining amount stays unknown', () => {
  const invoice = M.byId(M.financeRecords, 'SYN-MYOB-INV-010061');
  assert.equal(invoice.remaining, null);
  assert.match(text('#content'), /Not supplied/);
  assert.ok(!/940\.00 AUD.*0\.00 AUD/.test(text('#content')));
});

check('A different legal company and currency is never consolidated', () => {
  const body = text('#content');
  assert.match(body, /Powerplants NZ Limited/);
  assert.match(body, /2,300\.00 NZD/);
  assert.match(body, /never consolidated/);
});

check('Ageing bands, credit rules and undefined measures are not invented', () => {
  assert.match(text('#content'), /not defined/);
  assert.ok(!/\b\d+\s*[–-]\s*\d+ days\b|\bcredit limit:|\bdays overdue\b|\bhealth score\b/i.test(text('#content')));
});

/* ------------------------------------------ 10. filters, drill and return */

go('overview');

check('A summary tile drills into the register behind it and offers a return', () => {
  const tile = all('.summary-tile').find(t => /Open sales orders/.test(t.textContent));
  tile.click();
  assert.equal(state().view, 'orders');
  assert.equal(state().filters.status, 'Open');
  assert.ok(q('[data-action="return"]'), 'Return control is offered');
  assert.match(text('.chip-bar'), /Status: Open/);
});

check('Return navigation restores the previous view and its filters', () => {
  click('return');
  assert.equal(state().view, 'overview');
  assert.equal(state().filters.status, '');
  assert.equal(q('[data-action="return"]'), null);
});

go('orders');

check('A site filter scopes orders to explicit site relationships only', () => {
  setField('filter-site', 'SYN-PPO-SITE-000202');
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  same(ids, ['SYN-MYOB-SO-004380']);
  assert.ok(!ids.includes('SYN-MYOB-SO-006001'), 'An order with no site relationship is not assumed into a site');
});

check('A record with no site relationship is reported, not silently dropped', () => {
  assert.match(text('.results-bar'), /1 record\(s\) hold no site relationship and are excluded by the site filter rather than assumed into it/);
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  assert.ok(!ids.includes('SYN-MYOB-SO-006001'), 'The unrelated order is excluded from the filtered result');
});

check('An active filter is shown as a removable chip and can be cleared', () => {
  assert.match(text('.chip-bar'), /Site: Willowbank Field Production/);
  click('remove-filter', '[data-key="site"]');
  assert.equal(state().filters.site, '');
  assert.ok(all('.register tbody tr[data-row-id]').length > 1);
});

check('Search runs within this customer’s records only', () => {
  setField('record-search', 'PO-WB-3391', 'input');
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  same(ids, ['SYN-MYOB-SO-004412']);
  setField('record-search', 'PO-RG-7712', 'input');
  assert.equal(all('.register tbody tr[data-row-id]').length, 0);
  assert.match(text('#content'), /No orders match this scope/);
});

check('An empty result explains itself and offers a recovery control', () => {
  assert.match(text('#content'), /empty result rather than an unavailable source/);
  click('clear-filters');
  assert.ok(all('.register tbody tr[data-row-id]').length > 1);
});

check('An ERP company filter separates the two legal companies', () => {
  setField('filter-company', 'SYN-CO-NZ-01');
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  same(ids, ['SYN-MYOB-SO-006001']);
  click('clear-filters');
});

check('Equipment context drills from an asset into its service history', () => {
  go('sites');
  const link = all('[data-action="drill"][data-view="cases"]').find(b => /Service history/.test(b.textContent));
  link.click();
  assert.equal(state().view, 'cases');
  assert.equal(state().filters.equipment, 'SYN-PPO-AST-000501');
  assert.match(text('#content'), /SYN-PPO-TKT-000731/);
  assert.ok(!/SYN-PPO-TKT-000744/.test(text('#content')), 'Another asset’s case is excluded');
  click('clear-filters');
});

/* ------------------------------------------------- 11. context isolation */

check('Switching customer retains no record, filter, search or snapshot from the other', () => {
  go('orders');
  setField('filter-site', 'SYN-PPO-SITE-000201');
  click('open', '[data-kind="order"][data-id="SYN-MYOB-SO-004412"]');
  assert.ok(q('#detail').open);
  setField('customer-selector', M.ORG.rothwell);
  assert.equal(state().org, M.ORG.rothwell);
  assert.equal(state().filters.site, '');
  assert.equal(state().search, '');
  assert.equal(state().selected, null);
  assert.equal(all('dialog[open]').length, 0);
  assert.equal(state().returnStack.length, 0);
});

check('The second customer shows only its own records', () => {
  go('orders');
  const ids = all('.register tbody tr[data-row-id]').map(r => r.dataset.rowId);
  same(ids, ['SYN-MYOB-SO-005120']);
  go('cases');
  assert.match(text('#content'), /SYN-PPO-TKT-000811/);
  assert.ok(!/SYN-PPO-TKT-000731|Willowbank/.test(text('#content')));
});

check('Site options are scoped to the customer in context', () => {
  go('orders');
  const options = all('#filter-site option').map(o => o.textContent);
  assert.ok(options.some(o => /Rothwell Glasshouse — Northbank/.test(o)));
  assert.ok(!options.some(o => /Willowbank/.test(o)));
});

setField('customer-selector', M.ORG.willowbank);

/* ------------------------------------------------ 12. activity and documents */

go('activity');

check('The activity history retains source, author, date and exact document revision', () => {
  const body = text('#content');
  assert.match(body, /Service report SYN-PPO-RPT-000254 r01 issued/);
  assert.match(body, /Revision r01/);
  assert.match(body, /MYOB Acumatica \(simulated adapter\)/);
  assert.match(body, /Originating record:/);
});

check('Reading a timeline entry completes no underlying business action', () => {
  click('open', '[data-kind="activity"][data-id="ACT-0006"]');
  assert.match(text('#detail'), /Reading this entry completes nothing/);
  assert.equal(q('#detail [data-action="acknowledge"]'), null);
  assert.equal(q('#detail [data-action="complete"]'), null);
  closeDialog('detail');
});

check('Controlled documents are linked, not mastered again here', () => {
  click('boundary', '[data-target="documents"]');
  assert.match(text('#decision'), /Document register and viewer/);
  closeDialog('decision');
});

/* --------------------------------------------------- 13. local persistence */

go('overview');

check('An internal note is saved, attributed and shown against its record', () => {
  click('add-note', '[data-id="SYN-MYOB-SO-004380"]');
  assert.ok(q('#editor').open);
  click('save-note', '[data-id="SYN-MYOB-SO-004380"]');
  assert.ok(!q('#form-errors').hidden, 'An empty note is refused');
  setField('note-text', 'Chase the revised delivery date with the ERP account owner.', 'input');
  click('save-note', '[data-id="SYN-MYOB-SO-004380"]');
  assert.ok(!q('#editor').open);
  assert.match(text('#toast'), /Note saved in this browser/);
  assert.equal(state().notes['SYN-MYOB-SO-004380'].length, 1);
});

check('Saved notes survive a reload of the same browser storage', () => {
  const saved = w.localStorage.getItem('ppo-customer-360-r01');
  assert.ok(saved);
  dom.window.close();
  create(saved);
  assert.equal(state().notes['SYN-MYOB-SO-004380'].length, 1);
  assert.equal(q('#storage-notice').hidden, true);
});

check('Malformed retained bytes are preserved and never silently overwritten', () => {
  dom.window.close();
  create('{malformed');
  assert.equal(q('#storage-notice').hidden, false);
  assert.match(text('#storage-notice'), /could not be validated/);
  click('add-note', '[data-id="SYN-PPO-TKT-000731"]');
  setField('note-text', 'Recorded while the retained bytes are unreadable.', 'input');
  click('save-note', '[data-id="SYN-PPO-TKT-000731"]');
  assert.equal(w.localStorage.getItem('ppo-customer-360-r01'), '{malformed');
  assert.match(text('#toast'), /left untouched/);
  assert.equal(state().notes['SYN-PPO-TKT-000731'].length, 1, 'The note is kept in this tab');
});

check('A refused storage write is reported truthfully as session-only', () => {
  dom.window.close();
  create(null, true);
  click('add-note', '[data-id="SYN-PPO-TKT-000731"]');
  setField('note-text', 'Session-only note.', 'input');
  click('save-note', '[data-id="SYN-PPO-TKT-000731"]');
  assert.match(text('#storage-notice'), /Browser storage is unavailable/);
  assert.match(text('#toast'), /may not survive a reload/);
  assert.equal(state().notes['SYN-PPO-TKT-000731'].length, 1);
});

check('Note text is escaped rather than rendered as markup', () => {
  dom.window.close();
  create();
  click('add-note', '[data-id="SYN-PPO-TKT-000731"]');
  setField('note-text', '<img src=x onerror=alert(1)>', 'input');
  click('save-note', '[data-id="SYN-PPO-TKT-000731"]');
  click('open', '[data-kind="case"][data-id="SYN-PPO-TKT-000731"]');
  assert.equal(q('#detail img'), null);
  assert.match(text('#detail'), /<img src=x onerror=alert\(1\)>/);
  closeDialog('detail');
});

/* ------------------------------------------- 14. presentation and structure */

check('R20 metadata, embedded fonts and every CSS token resolve', () => {
  const metadata = JSON.parse(q('#design-metadata').textContent);
  assert.equal(metadata.revision, 'r01');
  assert.equal(metadata.theme_revision, 'r20');
  assert.equal(metadata.theme_sha256, 'c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617');
  assert.ok(Object.keys(metadata.tokens).length >= 45);
  assert.equal((html.match(/@font-face/g) || []).length, 3);
  const css = q('style').textContent;
  const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(x => x[1]));
  for (const m of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(defined.has(m[1]), 'CSS token ' + m[1]);
});

check('The file is self-contained: no external script, stylesheet or image request', () => {
  assert.equal(all('script[src],link[rel=stylesheet],link[href]').length, 0);
  assert.equal(all('img,iframe,object,embed').length, 0);
  assert.ok(!/https?:\/\/(?!\{approved-instance\})[^"'\s)]+/.test(
    html.replace(/https:\/\/customer-360-design\.invalid/g, '')
       .replace(/https:\/\/github\.com[^"'\s)]*/g, '')), 'No fetched external origin');
});

check('Every element identity in the current document is unique', () => {
  const ids = all('[id]').map(e => e.id);
  assert.equal(ids.length, new Set(ids).size);
});

check('Tabs use roving tabindex and respond to arrow, Home and End keys', () => {
  const tabs = all('[role=tab]');
  assert.equal(tabs.filter(t => t.tabIndex === 0).length, 1);
  const first = tabs[0];
  first.focus();
  first.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
  assert.equal(state().view, 'deals');
  q('[role=tab]').dispatchEvent(new w.KeyboardEvent('keydown', {key: 'End', bubbles: true}));
  assert.equal(state().view, 'activity');
  go('overview');
});

check('The content region is a labelled tab panel and dialogs are labelled', () => {
  assert.equal(q('#content').getAttribute('role'), 'tabpanel');
  assert.equal(q('#content').getAttribute('aria-labelledby'), 'tab-overview');
  for (const id of ['detail', 'editor', 'decision']) {
    assert.ok(q('#' + id).getAttribute('aria-labelledby'));
    assert.ok(q('#' + id).getAttribute('aria-describedby'));
  }
  assert.ok(q('a.skip'));
});

check('Desktop rows and phone cards represent the same matching records', () => {
  go('orders');
  const rows = all('.register tbody tr[data-row-id]').length;
  const cards = all('.register-cards .register-card').length;
  assert.equal(rows, cards);
  assert.ok(rows > 0);
});

check('The workspace states that it is synthetic and that MYOB remains the authority', () => {
  const body = text('#content');
  assert.match(body, /Synthetic demonstration data/);
  assert.match(body, /MYOB Acumatica remains the intended ERP authority/);
  assert.match(body, /live integration is outstanding/);
});

check('A demonstration role switch is never described as real security', () => {
  click('about');
  assert.match(text('#detail'), /It is not security/);
  assert.match(text('#detail'), /Server-enforced permissions/);
  closeDialog('detail');
});

check('No page error was raised while running every interaction above', () => {
  same(pageErrors, []);
});

/* ------------------------------------------------------------- reporting */

const evidence = {
  design: 'docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html',
  sha256: crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),
  checked_at: new Date().toISOString(),
  groups: results.length,
  status: 'passed',
  scope: 'Model and DOM emulation only. No rendered browser, screen reader, device, print or visual acceptance is asserted.',
  results
};
if (process.argv.includes('--write-evidence')) {
  const out = new URL('../docs/testing/evidence/customer-360-r01/model-results.json', import.meta.url);
  fs.mkdirSync(new URL('.', out), {recursive: true});
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
  console.log('Evidence written to docs/testing/evidence/customer-360-r01/model-results.json');
}
console.log(`\n${results.length} groups passed. SHA-256 ${evidence.sha256}`);
