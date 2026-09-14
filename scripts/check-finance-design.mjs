#!/usr/bin/env node
// Isolated design-logic checks. No browser, application server or ERP is used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const file = fileURLToPath(new URL('../docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r01.html', import.meta.url));
const html = readFileSync(file, 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'Standalone interaction script exists');
new vm.Script(source); // Parse the entire script, including event bindings.
const boundary = source.indexOf("root.addEventListener('click'");
assert.ok(boundary > 0, 'Known bootstrap boundary exists');

const nodes = new Map();
const node = selector => {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: '', textContent: '', hidden: true, values: {}, open: false,
    setAttribute() {}, focus() {}, scrollIntoView() {},
    querySelector: node, querySelectorAll: () => [],
    showModal() { this.open = true; }, close() { this.open = false; },
  });
  return nodes.get(selector);
};
const root = { querySelector: node, querySelectorAll: () => [] };
const context = vm.createContext({
  document: { getElementById: () => root, activeElement: null },
  FormData: class extends Map { constructor(form) { super(Object.entries(form.values)); } },
  setTimeout: () => 1, clearTimeout() {},
});
vm.runInContext(source.slice(0, boundary), context);
const run = code => vm.runInContext(code, context);
const value = code => JSON.parse(run(`JSON.stringify(${code})`));
const submit = values => {
  const form = node('#dialog-form');
  form.values = values;
  assert.equal(typeof form.onsubmit, 'function');
  form.onsubmit({ preventDefault() {}, target: form });
};
const action = (command, id, values = { confirm: 'on' }) => {
  run(`command(${JSON.stringify(command)}, ${JSON.stringify(id)})`);
  submit(values);
};
let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`PASS ${label}`); };

check('Self-contained file and four named views', () => {
  assert.doesNotMatch(html, /__(?:FONTS|TOKENS|CSS|JS|SOURCE_HEAD|THEME_HASH)__/);
  assert.equal((html.match(/@font-face/g) || []).length, 3);
  assert.equal((html.split('<script>')[0].match(/role="tab"/g) || []).length, 4);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage)\b/);
  assert.match(html, /border-radius:0 0 10px 10px/);
  assert.match(html, /@media\(max-width:780px\)/);
});
check('Unique synthetic sources and complete allocation', () => {
  assert.equal(value('db.length'), 7);
  assert.equal(value('new Set(db.flatMap(h=>h.lines.map(l=>l.entry))).size'), 10);
  assert.equal(value('db.every(h=>h.lines.every(l=>l.allocated===l.reviewed && (l.billable===null || l.billable+l.nonbillable===l.allocated)))'), true);
  assert.deepEqual(value('db[0].lines.map(l=>[l.allocated,l.billable,l.nonbillable,l.unit])'), [[90,60,30,'MIN'],[2,2,0,'EA']]);
  assert.deepEqual(value('[db[3].lines[0].captured,db[3].lines[0].reviewed]'), [240,210]);
});
check('Summary worklists return exactly the advertised state groups', () => {
  for (const [list, expected] of [['review',['000241']],['preparation',['000243','000242']],['processing',['000244']],['exceptions',['000245','000246']]]) {
    run(`shortcut=${JSON.stringify(list)}`);
    assert.deepEqual(value('rows().map(h=>h.id)'), expected);
  }
  run("shortcut='all'");
});
check('Search, owner filter and empty worklist retain source records', () => {
  run("query='Northbank'"); assert.equal(value('rows().length'), 2);
  run("query='';filterOwner='Preparer'"); assert.equal(value('rows().length'), 2);
  run("query='no such customer'"); assert.equal(value('rows().length'), 0);
  assert.match(run('queueResults()'), /No matching handoffs/);
  assert.equal(value('db.length'), 7);
  run("query='';filterOwner='all'");
});
check('Demo role and state guard disallow unrelated actions', () => {
  assert.equal(value("Boolean(canCommand(db[3],'claim'))"), false);
  assert.equal(value("Boolean(canCommand(db[0],'approve'))"), true);
  run("role='Preparer'");
  assert.equal(value("Boolean(canCommand(db[0],'approve'))"), false);
  assert.equal(value("Boolean(canCommand(db[1],'submit'))"), false);
});
check('Invalid treatment cannot change captured or allocated quantities', () => {
  run("selected='000242';editLine('000603')");
  const before = value('handoff().lines[0]');
  submit({ billable: '121', reason: 'Outside the reviewed allocation' });
  assert.deepEqual(value('handoff().lines[0]'), before);
  submit({ billable: '60', reason: '   ' });
  assert.deepEqual(value('handoff().lines[0]'), before);
});
check('Explicit non-billable treatment retains the allocation', () => {
  submit({ billable: '0', reason: 'Synthetic warranty reference SYN-COV-242' });
  run("editLine('000604')");
  submit({ billable: '0', reason: 'Synthetic warranty replacement SYN-COV-242' });
  assert.deepEqual(value('handoff().lines.map(l=>[l.captured,l.allocated,l.billable,l.nonbillable])'), [[120,120,0,120],[1,1,0,1]]);
  action('submit','000242');
  assert.equal(value('handoff().state'), 'ReadyForReview');
});
check('Stale confirmation cannot approve a changed revision', () => {
  run("role='Reviewer';command('approve','000241');db[0].revision++");
  submit({ confirm: 'on' });
  assert.equal(value('db[0].state'), 'ReadyForReview');
  assert.match(node('#form-error').textContent, /context changed/);
  run('db[0].revision--');
});
check('Approval and processor claim are separate states', () => {
  action('approve','000241'); assert.equal(value('db[0].state'), 'Approved');
  assert.equal(value('Boolean(db[0].target)'), false);
  run("role='Processor'"); action('claim','000241');
  assert.equal(value('db[0].state'), 'AwaitingERP');
  assert.equal(value('Boolean(db[0].target)'), false);
});
check('A demonstrated no-effect result retains no processing target', () => {
  action('outcome','000241',{ confirm:'on',outcome:'NotProcessed' });
  assert.equal(value('db[0].state'), 'Approved');
  assert.equal(value('Boolean(db[0].target)'), false);
});
check('Unknown outcome preserves one original target and blocks fresh processing', () => {
  action('claim','000241');
  action('outcome','000241',{ confirm:'on',outcome:'Unknown' });
  assert.equal(value('db[0].state'), 'OutcomeUnknown');
  assert.equal(value("Boolean(canCommand(db[0],'claim'))"), false);
  assert.equal(value("Boolean(canCommand(db[0],'outcome'))"), false);
  const target = value('db[0].target');
  action('lookup','000241');
  assert.deepEqual(value('db[0].target'), target);
  assert.equal(value('db[0].state'), 'ReconciliationRequired');
  assert.equal(value("Boolean(canCommand(db[0],'lookup'))"), false);
});
check('Like-unit matched evidence enables only the Reconciler to close', () => {
  assert.equal(value("Boolean(canCommand(db[0],'reconcile'))"), false);
  run("role='Reconciler'"); action('reconcile','000241');
  assert.equal(value('db[0].state'), 'Reconciled');
  assert.equal(value('db[0].lines[0].nonbillable'), 30);
});
check('Mismatch correction remains open and preserves the original result', () => {
  const target = value('db[4].target');
  assert.equal(value("Boolean(canCommand(db[4],'reconcile'))"), false);
  action('correction','000245',{ confirm:'on',reason:'Confirm 120 MIN against the original 150 MIN result.', 'correction-owner':'Casey Reed · Processor' });
  assert.deepEqual(value('db[4].target'), target);
  assert.equal(value('db[4].state'), 'ReconciliationRequired');
  assert.equal(value('db[4].correction.owner'), 'Casey Reed · Processor');
  assert.equal(value("Boolean(canCommand(db[4],'correction'))"), false);
});
check('Missing, duplicate, extra and unlike-unit results never match', () => {
  for (const mutation of ['h.target=null', 'h.target.lines.push(clone(h.target.lines[0]))', "h.target.lines.push({id:'unexpected',qty:0,unit:'MIN'})", "h.target.lines[0].unit='HOUR'"]) {
    assert.equal(value(`(()=>{const h=clone(db[0]);h.state='ReconciliationRequired';${mutation};return Boolean(canCommand(h,'reconcile'));})()`), false);
  }
});
check('Returned revision and coverage note survive Draft correction and approval', () => {
  run("role='Preparer'");
  const original = value('db[2].lines');
  action('revise','000243',{ confirm:'on',reason:'Coverage reference SYN-COV-243, reviewed 11 September.' });
  run("editLine('000605')"); submit({ billable:'120',reason:'Revised synthetic coverage basis SYN-COV-243' });
  assert.equal(value('db[2].revision'), 2);
  assert.deepEqual(value('db[2].originals[0].lines'), original);
  action('submit','000243');run("role='Reviewer'");action('approve','000243');
  assert.match(value('db[2].reviewNote'), /SYN-COV-243/);
  assert.match(run('review()'), /SYN-COV-243/);
});
check('Account applications, unapplied cash and reversal stay distinct', () => {
  assert.deepEqual(value('[accountSeed[0].open,accountSeed[0].cash,accountSeed[0].rows[0].amount,accountSeed[0].rows[0].remaining]'), [60000,20000,110000,60000]);
  assert.deepEqual(value('[accountSeed[2].rows[1].status,accountSeed[2].rows[0].remaining]'), ['Reversed',100000]);
  run("accountId='A01';accountType='Invoice'");
  assert.doesNotMatch(run('accountResults()'), /SYN-PPO-DEP-000012/);
  assert.equal(value('account().open'), 60000);
});
check('Partial and failed observations do not claim current balances', () => {
  run("accountId='A02';accountType='all'");
  assert.deepEqual(value('[account().open,account().cash]'), [null,null]);
  assert.match(run('accounts()'), /Unavailable/);
  assert.match(run('accounts()'), /Only page 1 of 2/);
  run("accountId='A03'");
  assert.match(run('accounts()'), /LAST KNOWN OPEN RECEIVABLE/);
  assert.match(run('accounts()'), /Current balances remain unconfirmed/);
});
check('All view templates generate and user-entered text is escaped', () => {
  run("db[2].reviewNote='<img src=x onerror=alert(1)>';selected='000243'");
  assert.doesNotMatch(run('review()'), /<img src=x/);
  for (const view of ['queue','review','accounts','reconcile']) assert.ok(run(`${view}()`).length > 1000);
});
console.log(`${passed} Finance design checks passed. Browser rendering, native dialogs, keyboard focus and printing are not validated by these checks.`);
