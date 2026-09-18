/* CS-02 / CS-03 Contacts, Stakeholders & Relationships r01 — native browser check.
   Runs the assembled single file in a real browser at the four declared viewports and
   exercises the flows the model cannot: focus, dialogs, keyboard completion, overflow.
   node scripts/check-contacts-browser.mjs
   PPO_BROWSER_PATH=/path/to/chrome node scripts/check-contacts-browser.mjs   (recorded substitute) */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html');
const out = path.join(root, 'verification-evidence/contacts');
await fs.mkdir(out, {recursive: true});

/* The repository pins the Chrome channel. PPO_BROWSER_PATH is an explicit, recorded
   substitute for environments without it; a substitute run is not evidence for the
   pinned runtime and the result file says so. */
const substitute = process.env.PPO_BROWSER_PATH || null;
let browser, channel;
try {
  browser = await chromium.launch(substitute
    ? {executablePath: substitute, headless: true}
    : {channel: 'chrome', headless: true});
  channel = substitute ? 'substitute' : 'chrome';
} catch {
  browser = await chromium.launch({headless: true});
  channel = 'bundled-chromium';
}

const VIEWPORTS = [
  {name: '1440x960', width: 1440, height: 960},
  {name: '1024x768', width: 1024, height: 768},
  {name: '820x800', width: 820, height: 800},
  {name: '390x844', width: 390, height: 844}
];

const context = await browser.newContext({viewport: {width: 1440, height: 960}});
const page = await context.newPage();
const results = [];
const images = [];
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
/* Discard confirmations are accepted by default so cleanup between groups is reliable.
   The group that tests the confirmation replaces this handler for its own duration. */
const acceptDialogs = d => d.accept();
page.on('dialog', acceptDialogs);

const S = () => page.evaluate(() => window.CS_DEMO.state());
const U = () => page.evaluate(() => window.CS_DEMO.ui());
const content = () => page.locator('#content');
const modal = () => page.locator('#modal');
const panel = () => page.locator('#panel');
const text = async () => await content().innerText();
const tab = v => page.locator(`#tabs [data-view="${v}"]`);
const act = name => page.locator(`[data-action="${name}"]:visible`);

const check = async (name, fn) => {
  try { await fn(); results.push({name, result: 'Passed'}); }
  catch (e) {
    const detail = String(e.message).split(/\r?\n/).map(s => s.trim())
      .filter(Boolean).slice(0, 4).join(' | ');
    results.push({name, result: 'Failed', detail});
  }
};
const snap = async (name, fullPage = false) => {
  await page.locator('#toast').waitFor({state: 'hidden', timeout: 6000}).catch(() => {});
  await page.screenshot({path: path.join(out, name + '.png'), fullPage});
  images.push(name + '.png');
};
const submit = async () => {
  await page.locator('#modal-submit').click();
  await modal().waitFor({state: 'hidden', timeout: 6000});
};
const submitError = async pattern => {
  await page.locator('#modal-submit').click();
  await page.locator('#modal-error').waitFor({state: 'visible', timeout: 6000});
  assert.match(await page.locator('#modal-error').innerText(), pattern);
};
const options = async values => {
  await page.getByRole('button', {name: 'Preview options', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  for (const [id, v] of Object.entries(values)) await modal().locator('#f-' + id).selectOption(v);
  await submit();
};
const horizontalOverflow = () => page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);

await page.goto(pathToFileURL(file).href);
await content().locator('table').first().waitFor();

/* ------------------------------------------------------------------ structure */

await check('Six views, the synthetic banner and the authority boundary render without errors', async () => {
  assert.equal(await page.locator('#tabs [role=tab]').count(), 6);
  assert.match(await page.locator('.demo-strip').innerText(), /Synthetic prototype/);
  assert.match(await page.locator('.authority').innerText(), /server decides who you can see/i);
  assert.match(await page.locator('.authority').innerText(), /issues nothing, sends nothing/i);
  await snap('1440-directory');
});

await check('Exactly one scope container and no duplicated application shell', async () => {
  assert.equal(await page.locator('#ppo-contacts').count(), 1);
  assert.equal(await page.locator('img').count(), 0);
  assert.equal(await page.locator('nav.rail, .masthead').count(), 0);
});

await check('Every icon-only control renders a visible icon, not just an aria-label', async () => {
  assert.equal(await page.locator('.header-actions svg.icon').count(), 3);
  /* An unpainted placeholder is a blank button: the label reaches a screen reader and
     nothing reaches anyone else. */
  assert.equal(await page.locator('[data-icon]:not(:has(svg))').count(), 0);
  const guide = page.getByRole('button', {name: 'Page guide'});
  assert.equal(await guide.locator('svg').count(), 1);
  const guideBox = await guide.boundingBox();
  assert(guideBox.width >= 36 && guideBox.height >= 36, 'the icon-only control keeps its target');
});

await check('The dialog and panel close controls carry their icon', async () => {
  await page.getByRole('button', {name: 'Preview options', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  assert.equal(await modal().locator('[data-close] svg.icon').count(), 1);
  await page.keyboard.press('Escape');
  await modal().waitFor({state: 'hidden'});
  assert.equal(await panel().locator('[data-action=closePanel] svg.icon').count(), 1);
});

await check('The register renders the board List: grey header, 52 px rows, pinned identity',
  async () => {
    const head = await page.locator('#content thead th').first().evaluate(e => {
      const s = getComputedStyle(e);
      return {bg: s.backgroundColor, h: Math.round(e.getBoundingClientRect().height), pos: s.position};
    });
    assert.equal(head.bg, 'rgb(238, 240, 243)', 'the board grey header band');
    assert.equal(head.h, 43);
    assert.equal(head.pos, 'sticky');

    const body = await page.locator('#content tbody td').nth(1).evaluate(e => {
      const s = getComputedStyle(e);
      return {h: Math.round(e.getBoundingClientRect().height), right: s.borderRightWidth,
        bottom: s.borderBottomWidth, bg: s.backgroundColor};
    });
    assert.equal(body.h, 52);
    assert.equal(body.right, '0px', 'ordinary cells carry no vertical rule');
    assert.equal(body.bottom, '1px', 'a fine horizontal divider');
    assert.equal(body.bg, 'rgb(255, 255, 255)');

    /* The identity column is pinned and carries the only vertical rule. */
    const identity = await page.locator('#content tbody td.identity').first().evaluate(e => {
      const s = getComputedStyle(e);
      return {pos: s.position, right: s.borderRightWidth};
    });
    assert.equal(identity.pos, 'sticky');
    assert.equal(identity.right, '1px');

    /* Full-row selection is the board's pale green, and still carries a green marker. */
    const selected = page.locator('#content tbody tr[aria-selected="true"]');
    assert.equal(await selected.count(), 1);
    const tints = await selected.locator('td').evaluateAll(list =>
      [...new Set(list.map(e => getComputedStyle(e).backgroundColor))]);
    assert.deepEqual(tints, ['rgb(237, 246, 233)'], 'every cell of the row takes the tint');
    assert.match(await selected.locator('td.identity')
      .evaluate(e => getComputedStyle(e).boxShadow), /rgb\(98, 187, 70\)/);
  });

await check('The register scrolls inside its own region and pins identity while it does',
  async () => {
    await page.setViewportSize({width: 1024, height: 768});
    const scroll = page.locator('#content .scroll');
    assert(await scroll.evaluate(e => e.scrollWidth > e.clientWidth),
      'the register scrolls horizontally at 1024');
    const before = await page.locator('#content tbody td.identity').first().boundingBox();
    await scroll.evaluate(e => { e.scrollLeft = 300; });
    const after = await page.locator('#content tbody td.identity').first().boundingBox();
    assert.equal(Math.round(before.x), Math.round(after.x), 'the identity column stays put');
    assert.equal(await horizontalOverflow(), 0, 'the page itself still does not scroll sideways');
    await scroll.evaluate(e => { e.scrollLeft = 0; });
    await page.setViewportSize({width: 1440, height: 960});
  });

await check('The view tabs render as the board underline row, not folder tabs', async () => {
  const selected = page.locator('#tabs [aria-selected="true"]');
  assert.equal(await selected.count(), 1);
  const s = await selected.evaluate(e => {
    const c = getComputedStyle(e);
    return {bottom: c.borderBottomColor, weight: c.fontWeight, bg: c.backgroundColor,
      radius: c.borderTopLeftRadius, h: Math.round(e.getBoundingClientRect().height)};
  });
  assert.equal(s.bottom, 'rgb(98, 187, 70)', 'the brand green rule marks the tab');
  assert.equal(s.weight, '700');
  assert.equal(s.radius, '0px', 'no folder chrome');
  assert.equal(s.bg, 'rgba(0, 0, 0, 0)', 'no filled tab');
  assert(s.h >= 44, 'the tab still meets the phone target height');
  /* The stacked CS-02 / CS-03 kicker is gone from the tab, and not lost: it heads the
     card inside each view. */
  assert.equal(await page.locator('#tabs .tab-kicker').count(), 0);
  /* The eyebrow is upper-cased by the stylesheet, so innerText comes back shouting. */
  assert.match(await text(), /CS-02 · Contact directory/i);
});

await check('The fixed clock is stated and never drifts to the real time', async () => {
  const strip = await page.locator('.demo-strip').innerText();
  assert.match(strip, /18 September 2026, 10:00 AEST/);
  assert.equal(await page.evaluate(() => window.CS_DEMO.clock), '2026-09-18T10:00:00+10:00');
});

/* ------------------------------------------------------------------ directory */

await check('The six attention queues render with counts and toggle the register', async () => {
  assert.equal(await page.locator('.queue').count(), 6);
  const before = await content().locator('tbody tr').count();
  await page.locator('.queue[data-queue=duplicate]').click();
  assert.equal(await page.locator('.queue[data-queue=duplicate]').getAttribute('aria-pressed'), 'true');
  assert.equal(await content().locator('tbody tr').count(), 2);
  await page.locator('.queue[data-queue=duplicate]').click();
  assert.equal(await content().locator('tbody tr').count(), before);
});

await check('Non-sortable columns carry no sort control, as parseDirectory refuses them', async () => {
  const fixed = page.locator('#content th.fixed');
  const labels = (await fixed.allInnerTexts()).join(' | ').toLowerCase();
  assert.equal(await fixed.count(), 2, 'fixed headers: ' + labels);
  assert(labels.includes('organisations'), labels);
  assert(labels.includes('preference'), labels);
  assert(labels.includes('not sortable'), labels);
  assert.equal(await fixed.locator('button').count(), 0);
  assert.equal(await page.locator('#content th.sortable button').count(), 5);
});

await check('Sorting by a permitted column reorders the register and announces aria-sort', async () => {
  await page.locator('#content th.sortable button', {hasText: 'Email'}).click();
  const th = page.locator('#content th.sortable').filter({hasText: 'Email'});
  assert.equal(await th.getAttribute('aria-sort'), 'ascending');
  await page.locator('#content th.sortable button', {hasText: 'Email'}).click();
  assert.equal(await th.getAttribute('aria-sort'), 'descending');
  await page.locator('#content th.sortable button', {hasText: 'Name'}).click();
});

await check('Search matches an organisation name and a role label through the affiliation JSON', async () => {
  await page.locator('#f-q').fill('agronomist');
  assert.match(await text(), /Ilse Brandt/);
  assert.equal(await page.locator('#f-q').evaluate(e => e === document.activeElement), true,
    'focus is retained while typing');
  await page.locator('#f-q').fill('rothwell');
  assert.match(await text(), /Marion Espie/);
  await page.locator('#f-q').fill('');
});

await check('An empty result offers recovery and never reads as a permission problem', async () => {
  await page.locator('#f-q').fill('zzz-no-such-contact');
  const t = await text();
  assert.match(t, /No contacts match these filters/);
  assert.match(t, /not a permission result/);
  await act('clearFilters').click();
  assert.equal(await page.locator('#f-q').inputValue(), '');
});

await check('The status filter offers exactly the contract statuses', async () => {
  const values = await page.locator('#f-status option').evaluateAll(o => o.map(x => x.value));
  assert.deepEqual(values, ['', 'Active', 'Inactive']);
  await page.locator('#f-status').selectOption('Inactive');
  assert.match(await text(), /Curtis Lane/);
  assert.equal(await content().locator('tbody tr').count(), 1);
  await page.locator('#f-status').selectOption('');
});

await check('The page size offers exactly 25, 50 and 100', async () => {
  await page.getByRole('button', {name: 'Preview options', exact: true}).click();
  const values = await modal().locator('#f-limit option').evaluateAll(o => o.map(x => x.value));
  assert.deepEqual(values, ['25', '50', '100']);
  await page.locator('#cancel-button').click();
  await modal().waitFor({state: 'hidden'});
});

await check('An inactive contact is marked and states that no command can change it', async () => {
  await page.locator('#f-status').selectOption('Inactive');
  /* Read, then reset, then assert. A failed assertion here used to leave the filter set
     and every group after it looked at an empty register. */
  const shown = await text();
  await page.locator('#f-status').selectOption('');
  assert.match(shown, /Inactive/);
  assert.match(shown, /No command can write this column/);
});

/* ------------------------------------------------------------------ the visibility rule */

await check('The site technician sees exactly one contact and nine withheld', async () => {
  await options({role: 'technician'});
  assert.equal(await content().locator('tbody tr').count(), 1);
  assert.match(await text(), /Dale Whitmore/);
  assert.match(await text(), /9 withheld from you/);
  assert.equal((await U()).role, 'technician');
  await snap('1440-technician-directory');
});

await check('Restricted renders as restricted, never as empty', async () => {
  await page.locator('.queue[data-queue=restricted]').click();
  const t = await text();
  assert.match(t, /Restricted from you/);
  assert.match(t, /9 contact records exist/);
  assert.doesNotMatch(t, /No contacts found/);
  assert.doesNotMatch(t, /0 contacts/);
  await snap('1440-restricted-queue');
});

await check('The restricted explanation names the failing clause without naming the person', async () => {
  await page.getByRole('button', {name: 'Why can I not see them?', exact: true}).click();
  await panel().waitFor({state: 'visible'});
  const p = await panel().innerText();
  assert.match(p, /Name withheld/);
  assert.match(p, /Clause 1/);
  assert.match(p, /site-scoped grant can never satisfy this clause/);
  assert.doesNotMatch(p, /Ilse Brandt|Curtis Lane|Ruth Okafor/);
  await snap('1440-restricted-panel');
  await page.keyboard.press('Escape');
  await panel().waitFor({state: 'hidden'});
  await page.locator('.queue[data-queue=restricted]').click();
});

await check('A stakeholder list shows restricted rows beside a permitted one', async () => {
  await tab('stakeholders').click();
  await page.getByRole('button', {name: 'Willowbank Horticulture'}).click();
  const rows = page.locator('#content table').first().locator('tbody tr');
  assert.equal(await rows.count(), 4);
  assert.equal(await page.locator('#content tr.restricted-row').count(), 3);
  const t = await text();
  assert.match(t, /Restricted contact/);
  assert.match(t, /A person holds this role\. Your grants do not reach them\./);
  assert.match(t, /Irrigation lead/, 'the recorded role is still shown');
  await snap('1440-stakeholders-restricted');
});

await check('The visibility explanation traces both clauses for the site technician', async () => {
  await tab('history').click();
  const t = await text();
  assert.match(t, /Clause 1 · A company context this reader may read/);
  assert.match(t, /Clause 2 · A site where this person is the primary contact/);
  assert.equal(await page.locator('#content .step.pass').count(), 1);
  assert.equal(await page.locator('#content .step.fail').count(), 1);
  assert.match(t, /They see no other contact of that organisation/);
  assert.match(t, /An explanation is not permission/);
  await snap('1440-visibility-explanation');
});

await check('A company reader satisfies both clauses, and the basis names the first', async () => {
  await options({role: 'sales'});
  await tab('history').click();
  /* A company grant satisfies clause 1 for the context row and clause 2 for the site,
     because scopeSql passes for any site of a company the reader holds. */
  assert.equal(await page.locator('#content .step.pass').count(), 2);
  assert.equal(await page.locator('#content .step.fail').count(), 0);
  const t = await text();
  assert.match(t, /this reader holds shared\.read there/);
  await tab('contact').click();
  assert.match(await text(), /A company context you may read/);
});

/* ------------------------------------------------------------------ contact record */

await check('The contact record states the absent reference and the absent command', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Dale Whitmore'}).click();
  const t = await text();
  assert.match(t, /None allocated/);
  assert.match(t, /No contact reference is allocated|None allocated/);
  assert.match(t, /createPerson and addAffiliation for this record type and nothing else/);
  assert.match(t, /no can_edit flag/);
  assert.equal(await page.getByRole('button', {name: /^Save contact|^Update contact/}).count(), 0);
  await snap('1440-contact-record');
});

await check('Affiliation concurrency is stated as belonging to the organisation', async () => {
  const t = await text();
  assert.match(t, /owned by the Willowbank Horticulture record at version 14/);
  assert.match(t, /bumps the organisation on success/);
  assert.match(t, /two coordinators adding affiliations to one organisation will collide/);
});

await check('A stale organisation version produces a conflict, not a silent write', async () => {
  await page.getByRole('button', {name: 'Add an affiliation', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-role').fill('Biosecurity officer');
  await modal().locator('#f-version').fill('9');
  await submitError(/Its version is now 14/);
  await modal().locator('#f-version').fill('14');
  await modal().locator('#f-role').fill('Site contact — nursery');
  await submitError(/overlapping period/);
  await modal().locator('#f-role').fill('Biosecurity officer');
  await page.locator('#modal-submit').click();
  await modal().waitFor({state: 'hidden', timeout: 6000});
  assert.match(await page.locator('#toast').innerText(), /Nothing was issued/);
});

await check('An ended affiliation shows its period and whether a successor is recorded', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ruth Okafor'}).click();
  const t = await text();
  assert.match(t, /Ended/);
  assert.match(t, /Successor:/);
  assert.match(t, /Ilse Brandt/);
  assert.match(t, /contract has no successor column/);
});

/* ------------------------------------------------------------------ reliance */

await check('The reliance view lists every binding with its owning module', async () => {
  await tab('reliance').click();
  const t = await text();
  assert.match(t, /Open case requester/);
  assert.match(t, /tickets\.requester_id/);
  assert.match(t, /SV-01 \/ SV-02/);
  assert.match(t, /Relied upon, no longer affiliated/);
  await snap('1440-reliance');
});

await check('An inactive primary contact shows a blocked approval owned by SV-06', async () => {
  await tab('directory').click();
  await page.locator('#f-status').selectOption('Inactive');
  await page.getByRole('button', {name: 'Open contact record for Curtis Lane'}).click();
  await tab('reliance').click();
  const t = await text();
  assert.match(t, /An inactive site primary contact blocks a report approval/);
  assert.match(t, /approval is blocked and return remains available/);
  assert.match(t, /SV-06/);
  assert.match(t, /not resolvable here/);
  assert.equal(await page.getByRole('button', {name: /Approve|Unblock|Resolve/}).count(), 0);
  await snap('1440-reliance-blocked');
  await tab('directory').click();
  await page.locator('#f-status').selectOption('');
});

await check('A finance-held binding is restricted for a non-finance reader and shown for finance', async () => {
  await page.getByRole('button', {name: 'Open contact record for Dale Whitmore'}).click();
  await tab('reliance').click();
  assert.match(await text(), /Restricted reliance/);
  assert.match(await text(), /Your grants do not reach it/);
  await options({role: 'finance'});
  await tab('reliance').click();
  assert.doesNotMatch(await text(), /Restricted reliance/);
  assert.match(await text(), /Finance handoff audience/);
  await options({role: 'sales'});
});

/* ------------------------------------------------------------------ stakeholders */

await check('Authority basis renders one of three values and explains itself', async () => {
  await tab('stakeholders').click();
  await page.getByRole('button', {name: 'Rothwell Glasshouse Group'}).click();
  const t = await text();
  assert.match(t, /Recorded, Asserted by us/);
  assert.match(t, /distinguish a recorded role from assumed purchasing authority/);
  assert.equal(await page.getByRole('button', {name: /decision maker/i}).count(), 0);
  await page.getByRole('button', {name: 'Why this basis?', exact: true}).first().click();
  await panel().waitFor({state: 'visible'});
  assert.match(await panel().innerText(), /recorded role is not purchasing authority/);
  await page.keyboard.press('Escape');
  await snap('1440-stakeholders');
});

await check('Coverage gaps name a site without a primary contact and its consequence', async () => {
  await page.getByRole('button', {name: 'Willowbank Horticulture'}).click();
  const t = await text();
  assert.match(t, /No primary contact recorded/);
  assert.match(t, /ADR-0014 blocks service report approval/);
  assert.match(t, /Site Without Primary Contact/);
});

await check('An organisation with history but no current affiliation is a stated gap', async () => {
  await page.getByRole('button', {name: 'Hadley Pastoral Trust'}).click();
  const t = await text();
  assert.match(t, /No Current Affiliation/);
  assert.match(t, /no successor is recorded/);
});

/* ------------------------------------------------------------------ proposals */

await check('A proposal refuses a short reason and keeps what was entered', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ruth Okafor'}).click();
  await page.getByRole('button', {name: 'Propose a correction', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-after').fill('Ruth Okafor-Bayeh');
  await modal().locator('#f-reason').fill('typo');
  await submitError(/ten characters/);
  assert.equal(await modal().locator('#f-after').inputValue(), 'Ruth Okafor-Bayeh');
  await modal().locator('#f-reason').fill('Surname corrected at the pack room handover meeting.');
  await submit();
  assert.match(await text(), /SYN-PPO-CCP-000001/);
  await snap('1440-proposals');
});

await check('A proposal cannot be reviewed by its proposer', async () => {
  await page.getByRole('button', {name: 'Record an independent review', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-reviewer').selectOption('u-priya');
  await modal().locator('#f-reason').fill('Approving my own correction request.');
  await submitError(/named independent reviewer/);
  await modal().locator('#f-reviewer').selectOption('u-alex');
  await modal().locator('#f-reason').fill('Checked against the signed handover note.');
  await submit();
  assert.match(await text(), /Approved/);
});

await check('Every apply is confirmed, labelled Simulated, and changes no record', async () => {
  const before = await S();
  await page.getByRole('button', {name: 'Simulated apply', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  assert.match(await modal().innerText(), /Simulated/);
  await submitError(/Confirm that this is a simulation/);
  await modal().locator('#f-confirm').check();
  await submit();
  const after = await S();
  assert.deepEqual(after.people, before.people, 'no person record changed');
  assert.match(await text(), /SimulatedApplied/);
  assert.match(await page.locator('#toast').innerText(), /0 records changed/);
});

await check('A returned proposal produces a successor that inherits no review', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ilse Brandt'}).click();
  await page.getByRole('button', {name: 'Propose a correction', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-kind').selectOption('phone');
  await modal().locator('#f-after').fill('+61 3 5550 0199');
  await modal().locator('#f-reason').fill('Number supplied verbally during the site visit.');
  await submit();
  await tab('proposals').click();
  const review = page.getByRole('button', {name: 'Record an independent review'}).last();
  await review.click();
  await modal().locator('#f-decision').selectOption('Returned');
  await modal().locator('#f-reason').fill('Confirm the number in writing before applying it.');
  await submit();
  await page.getByRole('button', {name: 'Raise a successor', exact: true}).click();
  await modal().locator('#f-reason').fill('Number confirmed in writing by the grower.');
  await submit();
  const t = await text();
  assert.match(t, /Superseded/);
  assert.match(t, /a changed proposal is a successor and inherits no review/);
});

await check('Duplicate resolution proposes a pointer and merges nothing', async () => {
  const before = await S();
  await page.getByRole('button', {name: 'Propose a superseded-by pointer', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  assert.match(await modal().innerText(), /merges nothing and deletes nothing/);
  await modal().locator('#f-reason').fill('One record was created again during the 2025 handover.');
  await submit();
  const after = await S();
  assert.equal(after.people.length, before.people.length);
  assert.equal(after.affiliations.length, before.affiliations.length);
  assert.match(await text(), /superseded-by pointer is proposed/);
  assert.equal(await page.getByRole('button', {name: /^Merge/}).count(), 0);
});

await check('A duplicate candidate set the reader cannot reach is withheld, not hidden', async () => {
  const t = await text();
  assert.match(t, /A duplicate candidate set exists that your grants do not reach/);
  assert.match(t, /This is not an absence of duplicates/);
  await snap('1440-duplicates');
});

await check('Two people who share a name are listed separately and never auto-merged', async () => {
  await tab('directory').click();
  await page.locator('#f-q').fill('Jonas Reddick');
  const rows = page.locator('#content tbody tr');
  assert.equal(await rows.count(), 2, 'both same-named records are listed');
  const cells = await rows.locator('td[data-label="Email"]').allInnerTexts();
  assert.notDeepEqual(cells[0], cells[1], 'the two records are distinguishable');
  assert.equal(await page.getByRole('button', {name: /^Merge/}).count(), 0);
  await page.locator('#f-q').fill('');
});

await check('A role without shared.edit cannot raise a proposal, and says why', async () => {
  await options({role: 'service'});
  await tab('proposals').click();
  const t = await text();
  assert.match(t, /holds no shared\.edit at company level/);
  assert.match(t, /unavailable rather than hidden/);
  assert.equal(await page.getByRole('button', {name: 'Propose a correction'}).first().isDisabled(), true);
  await options({role: 'sales'});
});

/* ------------------------------------------------------------------ states and storage */

await check('Loading, failed, partial and denied states are distinct and never read as zero', async () => {
  for (const [mode, pattern] of [['loading', /Reading contacts/], ['failed', /not an all-clear/],
    ['partial', /Partial results/], ['denied', /permission result, not an empty directory/]]) {
    await options({mode});
    await tab('directory').click();
    assert.match(await text(), pattern, mode);
  }
  await options({mode: 'failed'});
  await tab('directory').click();
  await snap('1440-failed');
  await act('retry').click();
  await options({mode: 'complete'});
});

await check('A failed save keeps entries and changes nothing', async () => {
  await options({save: 'fail'});
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ilse Brandt'}).click();
  await page.getByRole('button', {name: 'Propose a correction', exact: true}).click();
  await modal().locator('#f-reason').fill('A reason long enough to be accepted by the guard.');
  const before = await S();
  await submitError(/Simulated save failure/);
  assert.match(await modal().locator('#f-reason').inputValue(), /long enough/,
    'the entered reason survives a failed save');
  assert.deepEqual((await S()).proposals, before.proposals, 'nothing was recorded');
  await page.locator('#cancel-button').click();
  await modal().waitFor({state: 'hidden', timeout: 6000});
  await options({save: 'ok'});
});

await check('A competing tab raises a conflict that overwrites nothing', async () => {
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage',
    {key: 'ppo-contacts-r01', newValue: 'x'})));
  assert.match(await page.locator('#recovery').innerText(), /Conflict/);
  assert.match(await page.locator('#recovery').innerText(), /Nothing here was overwritten/);
  await snap('1440-conflict');
});

await check('The assistant refuses to answer from a stale copy', async () => {
  await page.getByRole('button', {name: 'Assistant', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  assert.match(await modal().innerText(), /stale copy/);
  await modal().locator('summary').first().click();
  assert.match(await modal().innerText(), /Refused\./);
  await page.locator('#cancel-button').click();
  await modal().waitFor({state: 'hidden'});
  await act('reloadLatest').click();
});

await check('The assistant answers only from the rendered record', async () => {
  await page.getByRole('button', {name: 'Assistant', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('summary').first().click();
  const t = await modal().innerText();
  assert.match(t, /contact records are withheld/);
  assert.doesNotMatch(t, /Refused\./);
  await page.locator('#cancel-button').click();
  await modal().waitFor({state: 'hidden'});
});

await check('A refused restore changes nothing and says why', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Backup, restore, reset', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await page.getByRole('button', {name: 'Restore', exact: true}).click();
  await modal().locator('#f-backup').fill('{"schema":"something-else"}');
  const before = await S();
  await submitError(/Unsupported saved workspace/);
  assert.deepEqual(await S(), before);
  await page.locator('#f-backup').fill(JSON.stringify(Object.assign({}, before,
    {people: before.people.map((p, i) => i === 0 ? Object.assign({}, p, {email: 'bad'}) : p)})));
  await submitError(/valid email address/);
  assert.deepEqual(await S(), before);
  await page.keyboard.press('Escape');
  if (await modal().isVisible()) await page.locator('#cancel-button').click();
});

await check('Reset returns to the built-in fixture and discards local proposals', async () => {
  await page.getByRole('button', {name: 'Backup, restore, reset', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await page.getByRole('button', {name: 'Reset to the fixture', exact: true}).click();
  await modal().waitFor({state: 'hidden'});
  assert.equal((await S()).proposals.length, 0);
  assert.match(await page.locator('#toast').innerText(), /Reset to the built-in fixture/);
});

/* ------------------------------------------------------------------ keyboard and focus */

await check('A dialog returns focus to the control that opened it', async () => {
  const opener = page.getByRole('button', {name: 'Preview options', exact: true});
  await opener.click();
  await modal().waitFor({state: 'visible'});
  await page.keyboard.press('Escape');
  await modal().waitFor({state: 'hidden'});
  assert.equal(await opener.evaluate(e => e === document.activeElement), true);
});

await check('A panel returns focus and closes on Escape', async () => {
  await tab('stakeholders').click();
  const opener = page.getByRole('button', {name: 'Why this basis?', exact: true}).first();
  await opener.click();
  await panel().waitFor({state: 'visible'});
  await page.keyboard.press('Escape');
  await panel().waitFor({state: 'hidden'});
  assert.equal(await opener.evaluate(e => e === document.activeElement), true);
});

await check('A proposal can be completed with the keyboard alone', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ruth Okafor'}).click();
  const count = (await S()).proposals.length;
  const opener = page.getByRole('button', {name: 'Propose a correction', exact: true});
  await opener.focus();
  await page.keyboard.press('Enter');
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-reason').focus();
  await page.keyboard.type('Corrected from the signed pack room handover note.');
  await modal().locator('#modal-submit').focus();
  await page.keyboard.press('Enter');
  await modal().waitFor({state: 'hidden', timeout: 6000});
  const raised = (await S()).proposals;
  assert.equal(raised.length, count + 1, 'exactly one proposal was raised');
  assert.match(raised.at(-1).reason, /signed pack room handover note/);
});

await check('A duplicate review can be completed with the keyboard alone', async () => {
  await tab('proposals').click();
  const opener = page.getByRole('button', {name: 'Propose a superseded-by pointer', exact: true});
  await opener.focus();
  await page.keyboard.press('Enter');
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-reason').focus();
  await page.keyboard.type('One record was entered twice during the maintenance handover.');
  await modal().locator('#modal-submit').focus();
  await page.keyboard.press('Enter');
  await modal().waitFor({state: 'hidden', timeout: 6000});
  assert.match(await text(), /superseded-by pointer is proposed/);
});

await check('Cancelling a changed form asks before discarding', async () => {
  await tab('directory').click();
  await page.getByRole('button', {name: 'Open contact record for Ilse Brandt'}).click();
  await page.getByRole('button', {name: 'Propose a correction', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  await modal().locator('#f-reason').fill('Something entered that should not vanish silently.');
  page.off('dialog', acceptDialogs);
  page.once('dialog', d => d.dismiss());
  await page.locator('#cancel-button').click();
  assert(await modal().isVisible(), 'dismissing the confirm keeps the dialog open');
  assert.match(await modal().locator('#f-reason').inputValue(), /vanish silently/);
  page.on('dialog', acceptDialogs);
  await page.locator('#cancel-button').click();
  await modal().waitFor({state: 'hidden', timeout: 6000});
});

await check('The skip link reaches the workspace content', async () => {
  /* Clear any fragment first. If the hash is already #content, activating the link is
     not a navigation and focus would legitimately stay put, which made this check
     depend on what ran before it. */
  await page.evaluate(() => {
    history.replaceState(null, '', location.pathname);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });
  /* A skip link is a page-entry affordance, so it is exercised on a fresh load. That is
     also the only way to be free of the preceding dialog, which restores focus to whatever
     opened it asynchronously as it closes and can steal focus back mid-group. */
  await page.reload();
  await content().locator('table').first().waitFor();
  await page.locator('.skip').focus();
  await page.waitForFunction(
    () => document.activeElement && document.activeElement.classList.contains('skip'),
    null, {timeout: 6000});
  await page.keyboard.press('Enter');
  /* Wait for the outcome rather than sampling it. CI caught the hash moving while focus
     had not: the page now moves focus itself, just after the default navigation. */
  await page.waitForFunction(
    () => document.location.hash === '#content'
      && document.activeElement && document.activeElement.id === 'content',
    null, {timeout: 6000});
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'MAIN');
});

/* ------------------------------------------------------------------ viewports */

for (const vp of VIEWPORTS) {
  await check(`No horizontal overflow at ${vp.name}`, async () => {
    await page.setViewportSize({width: vp.width, height: vp.height});
    await tab('directory').click();
    assert.equal(await horizontalOverflow(), 0, 'directory');
    await tab('contact').click();
    assert.equal(await horizontalOverflow(), 0, 'contact record');
    await tab('stakeholders').click();
    assert.equal(await horizontalOverflow(), 0, 'stakeholders');
    await tab('reliance').click();
    assert.equal(await horizontalOverflow(), 0, 'reliance');
    await tab('proposals').click();
    assert.equal(await horizontalOverflow(), 0, 'proposals');
    await tab('history').click();
    assert.equal(await horizontalOverflow(), 0, 'history');
    await tab('directory').click();
    await snap(vp.name + '-directory');
  });
}

await check('Phone targets meet the 44 px minimum', async () => {
  await page.setViewportSize({width: 390, height: 844});
  await tab('directory').click();
  const small = await page.locator('#tabs button, .queue, #toolbar button, #content button')
    .evaluateAll(list => list.filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.height < 44;
    }).map(e => (e.textContent || '').trim().slice(0, 40) + ' @' + Math.round(e.getBoundingClientRect().height)));
  assert.deepEqual(small, [], 'controls under 44 px: ' + small.join(' | '));
});

await check('The register becomes cards on the phone viewport with labelled fields', async () => {
  const labelled = await page.locator('#content tbody td[data-label]').count();
  assert(labelled > 0);
  const display = await page.locator('#content tbody tr').first().evaluate(e =>
    getComputedStyle(e).display);
  assert.equal(display, 'block', 'rows stack as cards at 390 px');
  await snap('390-cards');
});

await check('The inspection panel is full width on the phone viewport', async () => {
  await tab('stakeholders').click();
  await page.getByRole('button', {name: 'Why this basis?', exact: true}).first().click();
  await panel().waitFor({state: 'visible'});
  const box = await panel().boundingBox();
  assert.equal(Math.round(box.width), 390);
  assert.equal(await horizontalOverflow(), 0);
  await snap('390-panel');
  await page.keyboard.press('Escape');
});

await check('A dialog fits the phone viewport without overflow', async () => {
  await page.getByRole('button', {name: 'Preview options', exact: true}).click();
  await modal().waitFor({state: 'visible'});
  assert.equal(await horizontalOverflow(), 0);
  const box = await modal().boundingBox();
  assert(box.width <= 390, 'dialog width ' + box.width);
  await snap('390-dialog');
  await page.keyboard.press('Escape');
  await page.setViewportSize({width: 1440, height: 960});
});

await check('No page error, console error or failed request occurred during the run', () => {
  assert.deepEqual(errors, []);
});

/* ------------------------------------------------------------------ evidence */

const html = await fs.readFile(file);
const failed = results.filter(r => r.result === 'Failed');
const evidence = {
  scope: 'CS-02 / CS-03',
  revision: 'r01',
  html_sha256: createHash('sha256').update(html).digest('hex'),
  browser_channel: channel,
  browser_path: substitute,
  browser_version: browser.version(),
  pinned_runtime_evidence: channel === 'chrome',
  viewports: VIEWPORTS.map(v => v.name),
  groups: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  page_errors: errors,
  images,
  results
};
await fs.writeFile(path.join(out, 'browser-results.json'), JSON.stringify(evidence, null, 2) + '\n');
await fs.mkdir(path.join(root, 'docs/testing/evidence/contacts-r01'), {recursive: true});
await fs.writeFile(path.join(root, 'docs/testing/evidence/contacts-r01/browser-results.json'),
  JSON.stringify(evidence, null, 2) + '\n');
await browser.close();

const LF = String.fromCharCode(10);
console.log(JSON.stringify({groups: evidence.groups, passed: evidence.passed,
  failed: evidence.failed, browser_channel: channel,
  pinned_runtime_evidence: evidence.pinned_runtime_evidence, page_errors: errors.length}, null, 2));
console.log(results.map(r => '  ' + r.result.padEnd(7) + r.name
  + (r.detail ? LF + '            ' + r.detail : '')).join(LF));
if (channel !== 'chrome')
  console.log(LF + 'NOTE: this run used ' + channel
    + '. It is not evidence for the repository’s pinned Chrome channel.');
if (failed.length) process.exit(1);
