/* CS-02 / CS-03 Contacts, Stakeholders & Relationships r01 — model and contract check.
   Assertions are made against the real repository sources, not against a copy of them, so
   the design cannot drift from the rules the running application applies.
   node scripts/check-contacts-model.mjs [--write-evidence] */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'docs/design/contacts');
const htmlPath = path.join(root, 'docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html');

/* Sources are compared after LF normalisation, matching the builder: .css and .js are not
   pinned to LF by .gitattributes, so a Windows checkout holds CRLF for them. */
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const sha = p => createHash('sha256').update(read(p), 'utf8').digest('hex');
const shaBytes = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const fixtures = JSON.parse(read(path.join(src, 'fixtures.json')));
const ctx = vm.createContext({CONTACTS_FIXTURES: fixtures});
vm.runInContext(read(path.join(src, 'model.js')), ctx);
const M = ctx.CONTACTS_MODEL;

const reads = read(path.join(root, 'src/shared/reads.ts'));
const commands = read(path.join(root, 'src/shared/commands.ts'));
const directory = read(path.join(root, 'src/crm/directory.ts'));
const permissions = read(path.join(root, 'src/platform/permissions.ts'));
const projects = read(path.join(root, 'src/projects/service.ts'));
const finance = read(path.join(root, 'src/finance/context.ts'));
const planner = read(path.join(root, 'src/scheduling/planner.ts'));
const reports = read(path.join(root, 'src/reports/service.ts'));
const adr14 = read(path.join(root, 'docs/decisions/ADR-0014-p09-service-reports.md'));
const seedSql = read(path.join(root, 'db/seed.sql'));
const migrations = fs.readdirSync(path.join(root, 'db/migrations'))
  .filter(f => f.endsWith('.sql'))
  .map(f => read(path.join(root, 'db/migrations', f))).join('\n');
const m0002 = read(path.join(root, 'db/migrations/0002-shared-foundation.sql'));
const page = read(htmlPath);
const css = read(path.join(src, 'workspace.css'));
const app = read(path.join(src, 'workspace.js'));

const results = [];
/* Every group runs, so one failure does not hide the rest. The run still exits
   non-zero if anything failed. */
const test = (name, fn) => {
  try { fn(); results.push({name, result: 'Passed'}); }
  catch (e) { results.push({name, result: 'Failed', detail: String(e.message).split(/\r?\n/)[0]}); }
};
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

let state = M.seed();
const R = ['sales', 'service', 'technician', 'finance'];

/* ------------------------------------------------------------------ contract fidelity */

test('Person projection equals exactly the fields src/shared/reads.ts returns', () => {
  const block = reads.match(/if \(kind === "Person"\)\s*return \{([\s\S]*?)\};/);
  assert(block, 'Person projection not found in reads.ts');
  const extra = [...block[1].matchAll(/^\s*([a-z_]+):/gm)].map(m => m[1]);
  const base = [...reads.match(/const base = \{([\s\S]*?)\};/)[1].matchAll(/^\s*([a-z_]+):/gm)].map(m => m[1]);
  same(M.CONTRACT_CONSTRAINTS.personProjection, base.concat(extra));
  assert.equal(M.CONTRACT_CONSTRAINTS.personProjection.length, 9);
});

test('Person projection carries no can_edit and no company_id, unlike the other kinds', () => {
  const block = reads.match(/if \(kind === "Person"\)\s*return \{([\s\S]*?)\};/)[1];
  assert(!/can_edit/.test(block));
  assert(!/company_id/.test(block));
  assert(/can_edit/.test(reads.slice(reads.indexOf('if (kind === "Organisation")'))));
  assert(!M.CONTRACT_CONSTRAINTS.personProjection.includes('can_edit'));
  assert(!M.CONTRACT_CONSTRAINTS.personProjection.includes('company_id'));
});

test('visibility("Person") is reproduced clause for clause', () => {
  const clause = reads.match(/if \(kind === "Person"\)\s*\n?\s*return `([\s\S]*?)`;/)[1];
  assert(clause.includes('ppo.person_company_contexts pc'));
  assert(clause.includes('pc.person_id=${alias}.id'));
  assert(clause.includes('scopeSql("pc.company_id")'));
  assert(clause.includes('ppo.sites ps'));
  assert(clause.includes('ps.primary_contact_id=${alias}.id'));
  assert(clause.includes('scopeSql("ps.company_id", "ps.id")'));
  assert(clause.includes(' OR '));
  const trace = M.personVisibility(state, M.P(1), 'sales');
  assert.equal(trace.steps.length, 2);
  assert(trace.steps[0].sql.includes('person_company_contexts'));
  assert(trace.steps[1].sql.includes('primary_contact_id'));
});

test('scopeSql is reproduced: a site-scoped grant cannot satisfy a NULL site argument', () => {
  const fn = permissions.match(/export function scopeSql\(([\s\S]*?)\n\}/)[0];
  assert(fn.includes("site = \"NULL::uuid\""));
  assert(fn.includes("g.scope_type='Workspace' OR (g.company_id=${company} AND (g.scope_type='Company' OR (g.scope_type='Site' AND g.site_id=${site})))"));
  assert.equal(M.scopeHolds('technician', 'shared.read', M.CO.a, null), false);
  assert.equal(M.scopeHolds('technician', 'shared.read', M.CO.a, M.SITE.nursery), true);
  assert.equal(M.scopeHolds('sales', 'shared.read', M.CO.a, null), true);
  assert.equal(M.scopeHolds('sales', 'shared.read', M.CO.b, null), false);
});

test('listShared refuses company_id and site_id for Person with the exact contract text', () => {
  assert(reads.includes('"Person scope is derived from authorised affiliations and primary contacts."'));
  assert(reads.includes('"This list does not accept a site filter."'));
  assert.equal(M.CONTRACT_REFUSALS.personScope,
    'Person scope is derived from authorised affiliations and primary contacts.');
  assert.throws(() => M.listSharedPeople(state, 'sales', {company_id: M.CO.a}), /derived from authorised/);
  assert.throws(() => M.listSharedPeople(state, 'sales', {site_id: M.SITE.nursery}), /derived from authorised/);
});

test('listShared orders by UUID and searches display_name only', () => {
  assert(reads.includes('ORDER BY r.id LIMIT $7'));
  assert.equal(M.LIST_SHARED.order, 'ORDER BY r.id');
  assert.equal(M.LIST_SHARED.searchField, 'display_name');
  const ids = M.listSharedPeople(state, 'sales', {}).items.map(i => i.id);
  same(ids, ids.slice().sort());
  assert.equal(M.listSharedPeople(state, 'sales', {q: 'agronomist'}).items.length, 0);
});

test('listShared reports Partial completeness when a next cursor exists', () => {
  assert(reads.includes('completeness'));
  const partial = M.listSharedPeople(state, 'sales', {limit: 3});
  assert.equal(partial.completeness, 'Partial');
  assert(partial.next_cursor);
  assert.equal(M.listSharedPeople(state, 'sales', {limit: 200}).completeness, 'Complete');
});

test('The directory columns and the sortable subset match src/crm/directory.ts', () => {
  const cols = directory.match(/people: \[([\s\S]*?)\]/)[1];
  same(M.DIRECTORY_COLUMNS, [...cols.matchAll(/"([a-z]+)"/g)].map(m => m[1]));
  const sortSql = directory.match(/const sortSql: Record<string, string> = \{([\s\S]*?)\n\};/)[1];
  const keys = [...sortSql.matchAll(/^\s*([a-z]+):/gm)].map(m => m[1]);
  for (const c of M.DIRECTORY_SORTABLE) assert(keys.includes(c), c);
  for (const c of M.DIRECTORY_COLUMNS.filter(c => !M.DIRECTORY_SORTABLE.includes(c)))
    assert(!keys.includes(c), c + ' is not sortable in the contract');
  same(M.DIRECTORY_COLUMNS.filter(c => !M.DIRECTORY_SORTABLE.includes(c)), ['organisations', 'preference']);
});

test('parseDirectory refuses a non-sortable column with the contract message', () => {
  assert(directory.includes('invalid("sort", "Choose a sortable column.")'));
  for (const c of ['organisations', 'preference'])
    assert.throws(() => M.parseDirectory({sort: c}), /Choose a sortable column\./);
  assert.doesNotThrow(() => M.parseDirectory({sort: 'deals'}));
});

test('The directory status filter and page sizes match the contract exactly', () => {
  assert(directory.includes('? ["", "Active", "Inactive"]'));
  assert(directory.includes('if (![25, 50, 100].includes(limit))'));
  assert(directory.includes('invalid("limit", "Choose 25, 50 or 100 rows.")'));
  same(M.DIRECTORY_STATUSES, ['', 'Active', 'Inactive']);
  same(M.DIRECTORY_LIMITS, [25, 50, 100]);
  assert.throws(() => M.parseDirectory({limit: 30}), /Choose 25, 50 or 100 rows\./);
  assert.throws(() => M.parseDirectory({status: 'Prospect'}), /available status/);
});

test('The owner filter is refused for people, as the contract refuses it', () => {
  assert(directory.includes('invalid("mine", "Owner filtering applies to organisations.")'));
  assert.throws(() => M.parseDirectory({mine: 'true'}), /Owner filtering applies to organisations\./);
});

test('Directory search covers the same concatenation the contract searches', () => {
  assert(directory.includes("concat_ws(' ',display_name,display_number,email,phone,sector,owner_name,organisations::text)"));
  const byOrg = M.readDirectory(state, 'sales', {q: 'rothwell'});
  assert(byOrg.total > 0, 'organisation name must match through the affiliation JSON');
  const byRole = M.readDirectory(state, 'sales', {q: 'agronomist'});
  assert(byRole.total > 0, 'role label must match through the affiliation JSON');
  assert(M.readDirectory(state, 'sales', {q: 'dale.whitmore@example.invalid'}).total === 1);
});

test('Directory organisations are current affiliations only, in the contract order', () => {
  assert(directory.includes("rel.valid_from<=CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to>CURRENT_DATE)"));
  assert(directory.includes("ORDER BY org.display_name,rel.role_label"));
  const ended = M.currentOrganisationsOf(state, M.P(3), 'sales');
  assert.equal(ended.length, 0, 'an ended affiliation is not a current organisation');
  const current = M.currentOrganisationsOf(state, M.P(1), 'sales');
  assert.equal(current.length, 1);
  same(current.map(o => o.name), current.map(o => o.name).slice().sort());
});

test('Directory returns an exact total, page, limit, observed_at and kind', () => {
  assert(directory.includes('(SELECT count(*)::int FROM filtered) AS total'));
  const d = M.readDirectory(state, 'sales', {limit: 25});
  for (const k of ['total', 'items', 'page', 'limit', 'observed_at', 'kind']) assert(k in d, k);
  assert.equal(d.kind, 'people');
  assert.equal(typeof d.total, 'number');
});

test('Saved views reproduce the twelve-view, sixty-character and version rules', () => {
  assert(directory.includes('b.views.length > 12'));
  assert(directory.includes('v.name.length > 60'));
  assert(directory.includes('"Your saved views changed. Reload them before saving again."'));
  const s = M.seed();
  const view = {name: 'Mine', q: '', status: '', mine: 'false', sort: 'name',
    direction: 'asc', limit: 25, columns: ['name', 'email']};
  assert.throws(() => M.saveDirectoryViews(s, 5, [view]), /Your saved views changed\./);
  assert.throws(() => M.saveDirectoryViews(s, 0, [Object.assign({}, view, {columns: ['email']})]),
    /including name/);
  assert.throws(() => M.saveDirectoryViews(s, 0, [view, view]), /unique view names/);
  assert.throws(() => M.saveDirectoryViews(s, 0, new Array(13).fill(0)
    .map((_, i) => Object.assign({}, view, {name: 'v' + i}))), /twelve/);
  assert.equal(M.saveDirectoryViews(s, 0, [view]).version, 1);
});

test('createPerson company-context rule is reproduced: 1–10, deduplicated, sorted, all checked', () => {
  assert(commands.includes('invalid("company_ids", "Provide 1–10 explicit company contexts.")'));
  assert(commands.includes('raw.company_ids.length > 10'));
  assert(commands.includes('[...new Set(raw.company_ids.map((v) => uuid(v, "company_ids")))].sort()')
    || commands.includes('new Set(raw.company_ids.map((v) => uuid(v, "company_ids"))),\n  ].sort()'));
  assert(commands.includes('for (const id of command.company_ids) await scope(c, p, id);'));
  assert.throws(() => M.checkCompanyContexts([], 'sales'), /1–10 explicit company contexts/);
  assert.throws(() => M.checkCompanyContexts(new Array(11).fill(M.CO.a), 'sales'), /1–10/);
  same(M.checkCompanyContexts([M.CO.a, M.CO.a], 'sales'), [M.CO.a]);
  assert.throws(() => M.checkCompanyContexts([M.CO.b], 'sales'), /required shared-data permission/);
  assert.throws(() => M.checkCompanyContexts([M.CO.a], 'service'), /required shared-data permission/);
});

test('people.active defaults true, is never written again, and is enforced in three runtimes', () => {
  assert(/active boolean NOT NULL DEFAULT true/.test(m0002));
  assert(commands.includes('active: true'));
  assert(!/UPDATE ppo\.people SET[^;]*active/.test(commands));
  assert(!/setPersonActive|deactivatePerson/.test(commands));
  assert(finance.includes('AND u.active'));
  assert(planner.includes('!person.active'));
  assert(/pe\.active/.test(migrations));
});

test('No command exists to update, deactivate, end-affiliate or merge a person', () => {
  const exported = [...commands.matchAll(/export async function (\w+)/g)].map(m => m[1]);
  same(exported.filter(n => /person|people|affiliation/i.test(n)).sort(),
    ['addAffiliation', 'createPerson']);
  for (const absent of ['revisePersonIdentity', 'setPersonActive', 'endAffiliation',
    'setSitePrimaryContact', 'mergePerson', 'updatePerson'])
    assert(!exported.includes(absent), absent + ' must not exist');
  for (const k of M.PROPOSAL_KINDS) assert(k.missing && k.missing.length > 20, k.id);
});

test('addAffiliation is concurrency-owned by the organisation, not the person', () => {
  const block = commands.match(/export async function addAffiliation\(([\s\S]*?)\n\}/)[0];
  assert(block.includes('expected_version: version(raw.expected_version)'));
  assert(block.includes('checkVersion(org.version, command.expected_version)'));
  assert(block.includes('await bump(c, p, "organisations", org.id)'));
  assert(!/bump\(c, p, "people"/.test(block));
  assert(block.includes('await scope(c, p, org.company_id, undefined, "shared.edit")'));
  const conc = M.affiliationConcurrency(state, M.ORG.willowbank);
  assert.equal(conc.owner, 'Organisation');
  assert.equal(conc.expectedVersion, 14);
  assert.equal(conc.onSuccess, 15);
  assert(conc.capability.includes('shared.edit'));
});

test('The affiliation exclusion constraint is reproduced exactly', () => {
  assert(m0002.includes("EXCLUDE USING gist(workspace_id WITH =,organisation_id WITH =,person_id WITH =,role_label WITH =,daterange(valid_from,valid_to,'[)') WITH &&)"));
  const overlap = {id: 'candidate', organisationId: M.ORG.willowbank, personId: M.P(1),
    roleLabel: 'Site contact — nursery', validFrom: '2020-01-01', validTo: null};
  assert.throws(() => M.checkAffiliation(state, overlap), /overlapping period/);
  /* A different label at the same organisation over the same period is permitted. */
  assert.doesNotThrow(() => M.checkAffiliation(state, Object.assign({}, overlap,
    {roleLabel: 'Biosecurity officer'})));
  /* The same label after the earlier period closed is permitted. */
  assert.doesNotThrow(() => M.checkAffiliation(state, {id: 'c2',
    organisationId: M.ORG.willowbank, personId: M.P(3), roleLabel: 'Pack room supervisor',
    validFrom: '2024-11-30', validTo: null}));
});

test('An affiliation requires a context row in the organisation’s company', () => {
  assert(m0002.includes('FOREIGN KEY(workspace_id,company_id,person_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id)'));
  assert(commands.includes('await related(c, p, "Person", command.person_id, org.company_id)'));
  assert.throws(() => M.checkAffiliation(state, {id: 'c3', organisationId: M.ORG.marchmont,
    personId: M.P(1), roleLabel: 'Site contact', validFrom: '2026-01-01', validTo: null}),
    /no context row in that company/);
});

test('valid_to must be after valid_from, as the CHECK constraint requires', () => {
  assert(m0002.includes('CHECK(isfinite(valid_from) AND (valid_to IS NULL OR (isfinite(valid_to) AND valid_to>valid_from)))'));
  assert.throws(() => M.checkAffiliation(state, {id: 'c4', organisationId: M.ORG.willowbank,
    personId: M.P(2), roleLabel: 'Trial role', validFrom: '2026-05-01', validTo: '2026-05-01'}),
    /after valid_from/);
});

test('register_identity(\'Person\',\'\') allocates no reference, and no counter type exists', () => {
  assert(m0002.includes("EXECUTE FUNCTION ppo.register_identity('Person','')"));
  assert(m0002.includes("record_type text NOT NULL CHECK(record_type IN ('ORG','SITE','AST','TKT'))"));
  same(M.CONTRACT_CONSTRAINTS.referenceCounterTypes, ['ORG', 'SITE', 'AST', 'TKT']);
  for (const p of state.people) assert(!/SYN-PPO-/.test(JSON.stringify(p)), p.id);
  assert(!/SYN-PPO-(CON|PER|PSN)-/.test(page), 'no invented person reference type');
});

test('immutable_evidence refuses deletion of people and relationships', () => {
  assert(m0002.includes('CREATE TRIGGER protect_content BEFORE DELETE ON ppo.people FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()'));
  assert(m0002.includes('CREATE TRIGGER protect_content BEFORE DELETE ON ppo.relationships FOR EACH ROW EXECUTE FUNCTION ppo.immutable_evidence()'));
  const s = M.seed();
  const before = s.people.length;
  M.resolveDuplicate(s, 'dup-01', M.P(6), 'Same person entered twice at handover.', 'sales');
  assert.equal(s.people.length, before, 'no person row is removed');
  assert(s.duplicates.find(d => d.id === 'dup-01').pointer.every(x => x.applied === false));
});

test('activity_links admits no Person value, so interaction history can only be derived', () => {
  assert(migrations.includes("object_type text NOT NULL CHECK(object_type IN ('Organisation','Site','Asset','Ticket'))"));
  assert(!/object_type IN \('Organisation','Site','Asset','Ticket','Person'\)/.test(migrations));
  same(M.CONTRACT_CONSTRAINTS.activityLinkTypes, ['Organisation', 'Site', 'Asset', 'Ticket']);
  for (const a of state.derivedActivity)
    assert(M.CONTRACT_CONSTRAINTS.activityLinkTypes.includes(a.linkedType), a.id);
  const derived = M.derivedActivityFor(state, M.P(1), 'sales');
  assert.equal(derived.derived, true);
  assert(derived.note.includes("admits only Organisation, Site, Asset and Ticket"));
  assert(derived.note.includes("No activity is linked to a person"));
});

test('site_parties allows one current Operator per site, with the contract roles', () => {
  assert(m0002.includes("role text NOT NULL CHECK(role IN ('Operator','BillingParty','Owner'))"));
  assert(m0002.includes("WHERE(role='Operator')"));
  same(M.CONTRACT_CONSTRAINTS.sitePartyRoles, ['Operator', 'BillingParty', 'Owner']);
  const s = M.seed();
  s.siteParties.push({id: 'sp-x', siteId: M.SITE.nursery, organisationId: M.ORG.rothwell,
    role: 'Operator', validFrom: '2026-01-01', validTo: null});
  assert.throws(() => M.validate(s), /one current Operator per site/);
});

test('sites.primary_contact_id requires a context row and has no updating command', () => {
  assert(m0002.includes('FOREIGN KEY(workspace_id,company_id,primary_contact_id) REFERENCES ppo.person_company_contexts(workspace_id,company_id,person_id)'));
  assert(commands.includes('export async function createSite'));
  assert(!/setSitePrimaryContact|UPDATE ppo\.sites SET[^;]*primary_contact_id/.test(commands));
  const s = M.seed();
  s.sites[0].primaryContactId = M.P(9);   /* a company B person on a company A site */
  assert.throws(() => M.validate(s), /context row in the site’s company/);
});

test('erp_account_mappings binds an organisation, never a person', () => {
  assert(m0002.includes("entity_type text COLLATE \"C\" NOT NULL CHECK(entity_type='Customer')"));
  assert(!/entity_type='Person'/.test(migrations));
  assert(!/erp/i.test(JSON.stringify(state.people)));
});

/* ------------------------------------------------------------------ visibility table */

const VISIBILITY_CASES = [
  ['company reader sees a person with a context in that company', M.P(1), 'sales', true],
  ['company reader sees an inactive person', M.P(4), 'sales', true],
  ['company reader does not reach another company', M.P(9), 'sales', false],
  ['service coordinator matches the sales population', M.P(2), 'service', true],
  ['finance reviewer matches the sales population', M.P(2), 'finance', true],
  ['site technician sees the primary contact of their own site', M.P(1), 'technician', true],
  ['site technician does not see another contact of the same organisation', M.P(2), 'technician', false],
  ['site technician does not see the primary contact of a sibling site', M.P(4), 'technician', false],
  ['site technician does not see an ended affiliate', M.P(3), 'technician', false],
  ['site technician does not reach another organisation', M.P(5), 'technician', false],
  ['site technician does not reach another company', M.P(9), 'technician', false]
];
for (const [label, id, role, expected] of VISIBILITY_CASES)
  test('Visibility: ' + label, () => assert.equal(M.personVisibility(state, id, role).visible, expected));

test('Visibility trace names the clause that passed and the clause that failed', () => {
  const tech = M.personVisibility(state, M.P(1), 'technician');
  assert.equal(tech.steps[0].pass, false);
  assert.equal(tech.steps[1].pass, true);
  assert.equal(tech.basis, 'site-primary-contact');
  assert(tech.note && tech.note.includes('no other contact'));
  assert(tech.steps[0].detail.includes('site-scoped grant can never satisfy this clause'));
  const sales = M.personVisibility(state, M.P(1), 'sales');
  assert.equal(sales.basis, 'company-context');
  const denied = M.personVisibility(state, M.P(9), 'sales');
  assert(denied.steps.every(s => s.pass === false));
});

test('The four preview roles produce genuinely different result sets', () => {
  const totals = R.map(r => M.readDirectory(state, r, {}).total);
  assert.equal(totals[0], 9);
  assert.equal(totals[2], 1, 'the site technician must see exactly one contact');
  assert(new Set(totals).size > 1);
  const relianceCounts = R.map(r => M.relianceFor(state, M.P(1), r).counts.visible);
  assert(new Set(relianceCounts).size > 1, 'finance must see a binding the others do not');
  assert.equal(M.relianceFor(state, M.P(1), 'finance').counts.restricted, 0);
  assert(M.relianceFor(state, M.P(1), 'sales').counts.restricted > 0);
});

/* ------------------------------------------------------------------ restricted versus empty */

test('customerContext returns the same empty array for restricted and for none', () => {
  assert(reads.includes('const contacts = companyRead'));
  assert(/:\s*\[\];/.test(reads.slice(reads.indexOf('const contacts = companyRead'),
    reads.indexOf('const sites = ('))), 'the contract really does return [] for a denied read');
});

test('Presence is a four-value fact and every value has distinct copy', () => {
  same(M.PRESENCE, ['present', 'restricted', 'none', 'unknown']);
  const copies = M.PRESENCE.map(p => M.PRESENCE_COPY[p]);
  assert.equal(new Set(copies.map(c => c.label)).size, 4);
  assert.equal(new Set(copies.map(c => c.detail)).size, 4);
  assert(M.PRESENCE_COPY.restricted.detail.includes('not an empty list'));
  assert(M.PRESENCE_COPY.none.detail.includes('not a permission problem'));
  assert(M.PRESENCE_COPY.unknown.detail.includes('not zero'));
  assert.equal(M.presenceOf({total: 4, visible: 0, restricted: 4}), 'restricted');
  assert.equal(M.presenceOf({total: 0, visible: 0, restricted: 0}), 'none');
  assert.equal(M.presenceOf({total: 4, visible: 0, restricted: 0}), 'unknown');
  assert.equal(M.presenceOf({total: 4, visible: 1, restricted: 3}), 'present');
});

test('An organisation with restricted contacts never reports none', () => {
  const tech = M.contactsForOrganisation(state, M.ORG.willowbank, 'technician');
  assert.equal(tech.counts.total, 4);
  assert.equal(tech.counts.visible, 1);
  assert.equal(tech.counts.restricted, 3);
  assert.notEqual(tech.presence, 'none');
  for (const row of tech.rows.filter(r => r.restricted)) {
    assert.equal(row.displayName, 'Restricted contact');
    assert.equal(row.email, null);
    assert.equal(row.phone, null);
    assert(row.roleLabel, 'the affiliation itself is still shown');
  }
});

test('Every list, count and panel distinguishes restricted, none and unknown', () => {
  for (const role of R) {
    const d = M.readDirectory(state, role, {});
    assert(M.PRESENCE.includes(d.presence));
    assert.equal(typeof d.withheld, 'number');
    for (const org of state.organisations) {
      const c = M.contactsForOrganisation(state, org.id, role);
      assert(M.PRESENCE.includes(c.presence));
      if (c.counts.restricted > 0) assert.notEqual(c.presence, 'none');
      if (c.counts.total === 0) assert.equal(c.presence, 'none');
    }
    for (const p of state.people) {
      const rel = M.relianceFor(state, p.id, role);
      assert(M.PRESENCE.includes(rel.presence));
      if (rel.counts.restricted > 0) assert.notEqual(rel.presence, 'none');
      for (const row of rel.rows.filter(r => !r.visible)) {
        assert.equal(row.subject, null);
        assert(row.consequence.includes('Your grants do not reach it'));
      }
    }
    const map = M.stakeholderMap(state, M.ORG.willowbank, role);
    for (const s of map.sites) assert(['present', 'restricted', 'none'].includes(s.presence));
  }
});

test('A site with no primary contact reports none, not restricted', () => {
  const map = M.stakeholderMap(state, M.ORG.willowbank, 'sales');
  const annexe = map.sites.find(s => s.primaryContactId === null);
  assert(annexe, 'the fixture must carry a site with no primary contact');
  assert.equal(annexe.presence, 'none');
  assert.equal(annexe.displayName, null);
  const restricted = M.stakeholderMap(state, M.ORG.willowbank, 'technician').sites
    .find(s => s.siteId === M.SITE.field);
  assert.equal(restricted.presence, 'restricted');
  assert.equal(restricted.displayName, 'Restricted contact');
});

test('The owner_unavailable precedent in src/projects/service.ts is the pattern followed', () => {
  assert(projects.includes("'Unavailable owner'"));
  assert(projects.includes('AS owner_unavailable'));
  assert(projects.includes('NOT ${visibility("Person", "pe")}'));
  assert(page.includes('owner_unavailable'), 'the page cites the existing precedent');
  assert(!/Unavailable owner/.test(JSON.stringify(state.people)));
});

test('Zero occurrences of an empty state standing in for a denied one, in the rendered page', () => {
  assert(page.includes('This is a permission result, not an empty directory.'));
  assert(page.includes('Records exist. Your grants do not reach them. This is not an empty list.'));
  assert(page.includes('No record of this kind exists. This is not a permission problem.'));
  assert(page.includes('not an all-clear'));
  assert(!/No contacts found\b/.test(page), 'no bare "not found" copy');
  assert(!/0 contacts\b/.test(page));
});

/* ------------------------------------------------------------------ command honesty */

test('No control implies a command that does not exist', () => {
  for (const banned of ['Save contact', 'Update contact', 'Deactivate contact', 'Merge contacts',
    'Merge duplicates', 'Delete contact', 'Edit contact'])
    assert(!page.includes(banned), banned);
  assert(page.includes('Propose a correction'));
  assert(page.includes('Simulated apply'));
});

test('Every apply carries a visible Simulated label and changes no record', () => {
  assert(app.includes("text: 'Simulated'"));
  assert(app.includes('simulatedTag()'));
  const s = M.seed();
  const before = M.stable(s.people);
  const pr = M.raiseProposal(s, 'sales', {kind: 'name', subjectId: M.P(3),
    after: 'Ruth Okafor-Bayeh', reason: 'Surname corrected at the handover meeting.',
    proposerId: 'u-priya', reviewerId: 'u-alex', expectedVersion: 4});
  M.reviewProposal(s, pr.id, 'Approved', 'u-alex', 'Confirmed against the signed handover note.');
  const applied = M.simulateApply(s, pr.id, true);
  assert.equal(applied.simulated, true);
  assert.equal(applied.changedRecords, 0);
  assert.equal(M.stable(s.people), before, 'the fixture is unchanged by an apply');
  assert.equal(M.person(s, M.P(3)).displayName, 'Ruth Okafor');
  assert.equal(M.person(s, M.P(3)).version, 4);
});

test('An apply is refused without explicit confirmation and is idempotent', () => {
  const s = M.seed();
  const pr = M.raiseProposal(s, 'sales', {kind: 'phone', subjectId: M.P(2), after: '+61 3 5550 0102',
    reason: 'Direct line supplied on the site visit.', proposerId: 'u-priya', reviewerId: 'u-alex'});
  assert.throws(() => M.simulateApply(s, pr.id, true), /Only an approved proposal/);
  M.reviewProposal(s, pr.id, 'Approved', 'u-alex', 'Checked against the visit note.');
  assert.throws(() => M.simulateApply(s, pr.id, false), /Confirm that this is a simulation/);
  assert.equal(M.simulateApply(s, pr.id, true).duplicate, false);
  assert.equal(M.simulateApply(s, pr.id, true).duplicate, true, 'repeating creates no duplicate');
});

test('A proposal requires a reason, a subject and an independent reviewer', () => {
  const s = M.seed();
  const base = {kind: 'email', subjectId: M.P(2), after: 'x@example.invalid',
    proposerId: 'u-priya', reviewerId: 'u-alex'};
  assert.throws(() => M.raiseProposal(s, 'sales', Object.assign({}, base, {reason: 'typo'})), /ten characters/);
  assert.throws(() => M.raiseProposal(s, 'sales', Object.assign({}, base,
    {reason: 'A good enough reason.', reviewerId: 'u-priya'})), /reviewed by its proposer/);
  assert.throws(() => M.raiseProposal(s, 'sales', Object.assign({}, base,
    {reason: 'A good enough reason.', subjectId: M.P(9)})), /not visible to this reader/);
  assert.throws(() => M.raiseProposal(s, 'service', Object.assign({}, base,
    {reason: 'A good enough reason.'})), /no shared.edit/);
});

test('A stale subject version is refused rather than silently overwritten', () => {
  const s = M.seed();
  assert.throws(() => M.raiseProposal(s, 'sales', {kind: 'name', subjectId: M.P(1),
    after: 'Dale Whitmore-Hale', reason: 'Double-barrelled surname confirmed.',
    proposerId: 'u-priya', reviewerId: 'u-alex', expectedVersion: 4}),
    /changed while you were editing/);
  assert.doesNotThrow(() => M.raiseProposal(s, 'sales', {kind: 'name', subjectId: M.P(1),
    after: 'Dale Whitmore-Hale', reason: 'Double-barrelled surname confirmed.',
    proposerId: 'u-priya', reviewerId: 'u-alex', expectedVersion: 5}));
});

test('A review is refused to anyone but the named independent reviewer', () => {
  const s = M.seed();
  const pr = M.raiseProposal(s, 'sales', {kind: 'preference', subjectId: M.P(2), after: 'Email only',
    reason: 'Stated at the agronomy review.', proposerId: 'u-priya', reviewerId: 'u-alex'});
  assert.throws(() => M.reviewProposal(s, pr.id, 'Approved', 'u-priya', 'Approving my own work.'),
    /named independent reviewer/);
  assert.throws(() => M.reviewProposal(s, pr.id, 'Approved', 'u-alex', 'ok'), /ten characters/);
  assert.equal(M.reviewProposal(s, pr.id, 'Returned', 'u-alex',
    'The stated preference needs confirming with the grower first.').state, 'Returned');
});

test('A changed proposal is a successor and inherits no review', () => {
  const s = M.seed();
  const first = M.raiseProposal(s, 'sales', {kind: 'phone', subjectId: M.P(2), after: '+61 3 5550 0199',
    reason: 'Number supplied verbally on site.', proposerId: 'u-priya', reviewerId: 'u-alex'});
  M.reviewProposal(s, first.id, 'Returned', 'u-alex', 'Confirm the number in writing first.');
  const next = M.reviseProposal(s, first.id, {after: '+61 3 5550 0102',
    reason: 'Number confirmed in writing by the grower.'}, 'sales');
  assert.equal(next.review, null);
  assert.equal(next.state, 'Draft');
  assert.equal(next.supersedes, first.id);
  assert.equal(s.proposals.find(p => p.id === first.id).state, 'Superseded');
  assert.notEqual(next.reference, first.reference);
});

test('Duplicate resolution proposes a pointer and executes no merge and no delete', () => {
  const s = M.seed();
  const before = M.stable(s);
  assert.throws(() => M.resolveDuplicate(s, 'dup-02', M.P(5), 'These look the same to me.', 'sales'),
    /two different people who share a name/);
  assert.equal(M.stable(s), before, 'a refused resolution changes nothing');
  const out = M.resolveDuplicate(s, 'dup-01', M.P(6),
    'One record was created again during the 2025 maintenance handover.', 'sales');
  assert.equal(out.merged, false);
  assert.equal(out.deleted, false);
  assert.equal(s.people.length, 10);
  assert.equal(s.affiliations.length, 10);
  assert(out.duplicate.pointer.every(x => x.kind === 'superseded-by' && x.applied === false));
  assert.throws(() => M.resolveDuplicate(s, 'dup-01', M.P(6), 'Short.', 'sales'), /Not a duplicate|ten characters|recorded as two/);
});

test('active is never rendered as editable', () => {
  assert(!/name="active"|id="f-active"/.test(page));
  const kind = M.PROPOSAL_KINDS.find(k => k.id === 'deactivate');
  assert(kind.missing.includes('never written again'));
  assert(page.includes('No command can write this column'));
});

/* ------------------------------------------------------------------ authority honesty */

test('Authority basis is one of three values on every stakeholder row', () => {
  same(M.AUTHORITY_BASIS, ['Recorded', 'Asserted by us', 'Unknown']);
  for (const role of R) for (const org of state.organisations) {
    for (const row of M.stakeholderMap(state, org.id, role).authority)
      assert(M.AUTHORITY_BASIS.includes(row.basis.value), org.id + ' ' + row.affiliationId);
  }
  assert.equal(M.authorityBasis(state, 'rel-01').value, 'Recorded');
  assert.equal(M.authorityBasis(state, 'rel-03').value, 'Unknown');
});

test('No rendered string asserts purchasing authority', () => {
  /* These sentences are the only permitted uses of the vocabulary, and each one denies
     the claim rather than making it. They are asserted present below, then removed, so
     the ban that follows applies to every remaining occurrence. */
  const disclaimers = [
    'distinguish a recorded role from assumed purchasing authority',
    'A recorded role is not purchasing authority',
    'no decision-maker flag exists anywhere in this package',
    'None of them says a person can commit the customer',
    'That is a recorded role, not an authority to commit',
    'contract records who may commit a customer',
    /* The assistant asks the question in order to answer it "No." */
    'Does a recorded role mean they can sign?',
    /* Source comments that state the rule the code enforces. */
    'Never a claim that a person can commit the customer',
    'never asserts that a person can commit\n     the customer',
    'distinguish a recorded role from assumed\n     purchasing authority'
  ];
  for (const d of disclaimers) assert(page.includes(d), 'missing disclaimer: ' + d);
  let stripped = page;
  for (const d of disclaimers) stripped = stripped.split(d).join('');
  for (const banned of ['decision maker', 'decision-maker', 'can sign', 'signing authority',
    'purchasing authority', 'authorised to commit', 'commit the customer',
    'has authority', 'approves purchases', 'authorised signatory'])
    assert(!new RegExp(banned, 'i').test(stripped), banned);
  assert(page.includes('Recorded, Asserted by us'));
  assert(M.AUTHORITY_BASIS.join(', ') === 'Recorded, Asserted by us, Unknown');
  /* The question about signing is only permitted because the answer is No. */
  assert(page.includes("a: () => 'No. Authority basis is Recorded, Asserted by us or Unknown."));
});

/* ------------------------------------------------------------------ reliance and decisions */

test('Every downstream binding names a real contract column or decision', () => {
  const columns = state.bindings.map(b => b.column);
  assert(columns.includes('sites.primary_contact_id'));
  assert(columns.includes('opportunities.primary_person_id'));
  assert(columns.includes('opportunities.contact_unknown_reason'));
  assert(columns.includes('tickets.requester_id'));
  assert(columns.includes('tickets.requester_description'));
  assert(columns.includes('project_tasks.external_owner_id'));
  assert(columns.includes('lead_candidates.primary_person_id'));
  assert(migrations.includes('primary_contact_id'));
  assert(migrations.includes('contact_unknown_reason'));
  assert(migrations.includes('requester_description'));
  assert(migrations.includes('external_owner_id'));
  assert(migrations.includes('lead_candidates'));
  for (const b of state.bindings) assert(b.owner && b.consequence && b.consequence.length > 30, b.id);
});

test('ADR-0014 is quoted exactly and the blocked approval is owned by SV-06', () => {
  const quote = 'If that contact is unavailable, approval is blocked and return remains available.';
  assert(adr14.includes(quote));
  assert(adr14.includes('The currently permitted active site primary contact is shown by name and explicitly selected before approval'));
  assert(page.includes('approval is blocked and return remains available'));
  const blocked = M.relianceFor(state, M.P(4), 'sales').blocked;
  assert(blocked.length >= 1);
  assert(blocked.some(b => b.owner === 'SV-06'));
  for (const b of blocked) assert.equal(b.resolvableHere, false);
  assert(reports.includes('site.primary_contact_id'));
});

test('The planner and finance refusals are reproduced from their own sources', () => {
  assert(planner.includes('!person.active') && planner.includes('site.primary_contact_id !== cmd.recipient_id'));
  assert(finance.includes('AND u.active AND EXISTS(SELECT 1 FROM ppo.person_company_contexts'));
  assert(finance.includes('SourceAudienceChanged'));
  const rows = state.bindings.filter(b => b.personId === M.P(4));
  assert(rows.some(b => b.owner === 'SV-04'));
  assert(page.includes('SourceAudienceChanged'));
});

test('A deal and a task require a current affiliation, which the database enforces', () => {
  assert(migrations.includes("RAISE EXCEPTION 'Contact affiliation required'"));
  assert(migrations.includes("RAISE EXCEPTION 'Current external affiliation required'"));
  assert(page.includes('Contact affiliation required'));
  const deal = state.bindings.find(b => b.kind === 'DealPrimaryContact');
  const current = M.affiliationsFor(state, deal.personId).filter(a => a.state === 'Current');
  assert(current.length > 0, 'the fixture deal contact must hold a current affiliation');
});

test('A ticket requester survives an ended affiliation, and the fixture proves it', () => {
  assert(read(path.join(root, 'db/migrations/0003-customer-intake.sql'))
    .includes('(requester_id IS NOT NULL OR length(btrim(requester_description))>0)'));
  const stale = state.bindings.find(b => b.stale);
  assert.equal(stale.kind, 'TicketRequester');
  assert(M.affiliationsFor(state, stale.personId).every(a => a.state !== 'Current'));
  assert.equal(M.queueCounts(state, 'sales').stale, 1);
});

test('Unknown is distinguished from restricted for a record with no contact', () => {
  const unknown = state.bindings.filter(b => b.personId === null && b.reason);
  assert.equal(unknown.length, 2);
  for (const b of unknown) {
    assert(b.reason.length > 10);
    assert(b.consequence.includes('not a restricted contact')
      || b.consequence.includes('satisfies it')
      || b.consequence.includes('recorded reason'));
  }
  assert(page.includes('No contact recorded'));
});

/* ------------------------------------------------------------------ queues and register checks */

test('The six attention queues are all reachable and all non-empty for some role', () => {
  same(M.QUEUES.map(q => q.id),
    ['stale', 'inactive', 'nocontact', 'duplicate', 'successor', 'restricted']);
  const sales = M.queueCounts(state, 'sales');
  for (const q of ['stale', 'inactive', 'nocontact', 'duplicate', 'successor']) assert(sales[q] > 0, q);
  assert(M.queueCounts(state, 'technician').restricted > 0);
});

test('Register check 1: the exact addressed site and named on-site location are identifiable', () => {
  for (const s of state.sites) {
    assert(s.id.startsWith('SYN-PPO-SITE-'), s.id);
    assert(s.name && s.location, s.id);
    assert(/fictional/i.test(s.location), s.id);
  }
  const map = M.stakeholderMap(state, M.ORG.willowbank, 'sales');
  assert(map.sites.every(s => s.siteName && s.siteId));
  assert(page.includes('12 Demonstration Road'));
});

test('Register check 2: a changed name or relationship retains stable identity and references', () => {
  const s = M.seed();
  const pr = M.raiseProposal(s, 'sales', {kind: 'name', subjectId: M.P(3), after: 'Ruth Okafor-Bayeh',
    reason: 'Surname corrected at the pack room handover.', proposerId: 'u-priya', reviewerId: 'u-alex'});
  M.reviewProposal(s, pr.id, 'Approved', 'u-alex', 'Checked against the signed handover note.');
  M.simulateApply(s, pr.id, true);
  assert.equal(M.person(s, M.P(3)).id, M.P(3), 'identity is stable');
  assert.equal(M.affiliationsFor(s, M.P(3)).length, 1, 'historical affiliation is retained');
  assert.equal(M.affiliationsFor(s, M.P(3))[0].state, 'Ended');
  assert(s.bindings.some(b => b.personId === M.P(3)), 'downstream reference still resolves');
  const ended = s.affiliations.find(a => a.id === 'rel-03');
  assert.equal(ended.validTo, '2024-11-30', 'the historical role is retained, not rewritten');
});

test('Register check 3: normal, missing-source and interrupted cases are all reachable', () => {
  /* Normal */
  const normal = M.stakeholderMap(state, M.ORG.rothwell, 'sales');
  assert(normal.contacts.rows.filter(r => r.state === 'Current').length >= 2);
  assert(normal.sites.some(s => s.presence === 'present'));
  /* Missing source */
  const missing = M.stakeholderMap(state, M.ORG.hadley, 'sales');
  assert(missing.gaps.some(g => g.kind === 'NoCurrentAffiliation'));
  assert(state.bindings.some(b => b.personId === null && b.reason));
  /* Interrupted and returned */
  const s = M.seed();
  const pr = M.raiseProposal(s, 'sales', {kind: 'email', subjectId: M.P(2),
    after: 'ilse.brandt@example.invalid', reason: 'Address confirmed at the agronomy review.',
    proposerId: 'u-priya', reviewerId: 'u-alex'});
  M.reviewProposal(s, pr.id, 'Returned', 'u-alex', 'Confirm with the grower before applying.');
  assert.equal(s.proposals[0].state, 'Returned');
  const successor = M.reviseProposal(s, pr.id, {reason: 'Confirmed in writing by the grower.'}, 'sales');
  assert.equal(successor.review, null);
  assert(page.includes('Outcome unknown'));
});

/* ------------------------------------------------------------------ fixtures */

test('The fixture population reconciles with CS-01 r01 and the application seed', () => {
  const cs01 = read(path.join(root, 'docs/design/customer-360/model.js'));
  assert(cs01.includes('SYN-PPO-ORG-000101') && cs01.includes('Willowbank Horticulture'));
  assert(cs01.includes('SYN-PPO-ORG-000102') && cs01.includes('Rothwell Glasshouse Group'));
  assert(cs01.includes('SYN-PPO-SITE-000201') && cs01.includes('SYN-PPO-SITE-000202')
    && cs01.includes('SYN-PPO-SITE-000211'));
  for (const id of ['SYN-PPO-ORG-000101', 'SYN-PPO-ORG-000102'])
    assert(state.organisations.some(o => o.id === id), id);
  for (const id of ['SYN-PPO-SITE-000201', 'SYN-PPO-SITE-000202', 'SYN-PPO-SITE-000211'])
    assert(state.sites.some(s => s.id === id), id);
  /* Company identifiers are the seed's own. */
  for (const c of state.companies) assert(seedSql.includes(c.id), c.id);
  /* The seed's role labels are the only ones that exist, and they are placeholders. */
  assert(seedSql.includes('SYN site contact') && seedSql.includes('SYN supplier liaison'));
});

test('All six required fixture scenarios are present and reachable', () => {
  /* 1 Normal */
  const normal = M.contactsForOrganisation(state, M.ORG.rothwell, 'sales');
  assert(normal.rows.filter(r => r.state === 'Current').length >= 2);
  assert(state.sites.some(s => s.organisationId === M.ORG.rothwell && s.primaryContactId));
  assert(state.successors.some(s => s.successorPersonId !== null));
  /* 2 Blocked */
  assert(state.people.some(p => !p.active));
  assert(M.relianceFor(state, M.P(4), 'sales').blocked.length > 0);
  /* 3 Restricted */
  const restricted = M.contactsForOrganisation(state, M.ORG.willowbank, 'technician');
  assert.equal(restricted.counts.total, 4);
  assert.equal(restricted.counts.visible, 1);
  /* 4 Ambiguous */
  const names = state.people.map(p => p.displayName);
  assert(names.filter(n => n === 'Marion Espie').length === 2, 'same name, different contexts');
  assert(names.filter(n => n === 'Jonas Reddick').length === 2, 'a genuine duplicate pair');
  assert(state.duplicates.some(d => d.state === 'Open'));
  assert(state.duplicates.some(d => d.state === 'NotDuplicate'));
  /* 5 Unknown */
  assert(state.bindings.some(b => b.column === 'opportunities.contact_unknown_reason'));
  assert(state.bindings.some(b => b.column === 'tickets.requester_description'));
  /* 6 Partial */
  assert.equal(M.listSharedPeople(state, 'sales', {limit: 3}).completeness, 'Partial');
});

test('The two same-named people are in different company contexts and are not duplicates', () => {
  const pair = state.duplicates.find(d => d.state === 'NotDuplicate');
  const [a, b] = pair.members.map(id => state.contexts.find(c => c.personId === id));
  assert.notEqual(a.companyId, b.companyId);
  assert.equal(pair.proposedSurvivor, null);
  assert(pair.survivorBasis.includes('Not a duplicate'));
});

test('The duplicate pair shares one company context and overlapping current affiliations', () => {
  const pair = state.duplicates.find(d => d.state === 'Open');
  const contexts = pair.members.map(id => state.contexts.find(c => c.personId === id).companyId);
  assert.equal(contexts[0], contexts[1]);
  for (const id of pair.members)
    assert(M.affiliationsFor(state, id).some(a => a.state === 'Current'));
  assert(pair.evidence.length >= 3);
});

test('Every fixture affiliation satisfies the contract constraints', () => {
  assert.doesNotThrow(() => M.validate(M.seed()));
  for (const a of state.affiliations) {
    assert(a.roleLabel.trim().length >= 1 && a.roleLabel.trim().length <= 200, a.id);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(a.validFrom), a.id);
    if (a.validTo) assert(a.validTo > a.validFrom, a.id);
    assert(!M.affiliationOverlaps(state, a), a.id);
  }
  for (const p of state.people) {
    if (p.email !== null) assert(M.CONTRACT_CONSTRAINTS.emailPattern.test(p.email), p.id);
    assert(/example\.invalid$/.test(p.email || 'x@example.invalid'), p.id);
  }
});

test('Fixture role labels are plausible and explicitly fictional, with no claimed vocabulary', () => {
  const labels = [...new Set(state.affiliations.map(a => a.roleLabel))];
  assert(labels.length >= 6);
  assert(page.includes('free text · no vocabulary exists')
    || page.includes('no vocabulary exists'));
  assert(M.PROPOSED.responsibility.today.includes('no vocabulary exists anywhere'));
  for (const l of labels) assert(!/director|authorised signatory|buyer/i.test(l), l);
});

/* ------------------------------------------------------------------ restore validation */

const broken = (mutate, pattern) => {
  const s = M.seed();
  mutate(s);
  assert.throws(() => M.validate(s), pattern);
};

test('Restore refuses a foreign schema', () =>
  assert.throws(() => M.validate({schema: 'other'}), /Unsupported saved workspace/));
test('Restore refuses an over-long display_name', () =>
  broken(s => { s.people[0].displayName = 'x'.repeat(201); }, /1–200 characters/));
test('Restore refuses an invalid email', () =>
  broken(s => { s.people[0].email = 'not-an-email'; }, /valid email address/));
test('Restore refuses a person with no company context', () =>
  broken(s => { s.contexts = s.contexts.filter(c => c.personId !== s.people[0].id); },
    /at least one company context/));
test('Restore refuses an affiliation without a context row in that company', () =>
  broken(s => { s.affiliations[0].organisationId = 'SYN-PPO-ORG-000104'; },
    /unknown organisation|context row in the organisation/));
test('Restore refuses overlapping affiliations for one role label', () =>
  broken(s => { s.affiliations.push(Object.assign({}, s.affiliations[0], {id: 'rel-dup'})); },
    /Overlapping affiliation/));
test('Restore refuses a duplicate person id', () =>
  broken(s => { s.people.push(Object.assign({}, s.people[0])); }, /Duplicate person id/));
test('Restore refuses a self-reviewed proposal', () =>
  broken(s => { s.proposals = [{id: 'p1', kind: 'name', proposerId: 'u1',
    review: {reviewerId: 'u1', decision: 'Approved', reason: 'x'}}]; },
    /reviewed by its proposer/));
test('Restore refuses an applied duplicate pointer', () =>
  broken(s => { s.duplicates[0].pointer = [{from: 'a', to: 'b', applied: true}]; },
    /never applied/));
test('Valid serialised state round-trips unchanged', () => {
  const s = M.seed();
  assert.equal(JSON.stringify(M.validate(s)), JSON.stringify(s));
});

/* ------------------------------------------------------------------ proposed model */

test('Every proposed extension is labelled, costed and states what exists today', () => {
  const keys = Object.keys(M.PROPOSED);
  assert(keys.length >= 6);
  for (const k of keys) {
    const p = M.PROPOSED[k];
    assert(p.id && p.label, k);
    assert(p.cost && p.cost.length > 30, k);
    assert(p.today && p.today.length > 30, k);
  }
  assert(page.includes('Proposed'));
  assert(M.PROPOSED.communication.today.includes('No automatic marketing consent inferred'));
});

test('contact_preference is rendered as free text with no consent semantics', () => {
  const dict = read(path.join(root, 'docs/contracts/service-data-dictionary.md'));
  assert(dict.includes('No automatic marketing consent inferred'));
  assert(page.includes('No automatic marketing consent inferred'));
  for (const banned of ['opted in', 'opt-in', 'consented to', 'subscribed', 'unsubscribe',
    'marketing consent granted'])
    assert(!new RegExp(banned, 'i').test(page.replace(/No automatic marketing consent inferred/g, '')), banned);
  assert(page.includes('contact_preference'));
});

test('Relationship health is derived, labelled proposed, and never asserted', () => {
  for (const p of state.people) {
    const h = M.relationshipHealth(state, p.id);
    assert(M.PROPOSED.health.values.includes(h.value), p.id);
    assert.equal(h.proposed, true);
    assert(h.derivation.length > 30);
  }
  assert.equal(M.relationshipHealth(state, M.P(8)).value, 'Not assessed');
});

/* ------------------------------------------------------------------ composition */

test('The assembled page is the module only, with one scope container and six views', () => {
  assert.equal((page.match(/id="ppo-contacts"/g) || []).length, 1);
  assert.equal(M.VIEWS.length, 6);
  assert(!/<nav[^>]*class="rail"|class="masthead"|<img /.test(page));
  assert(page.includes('<meta name="ppo-scope-id" content="CS-02">'));
  assert(page.includes('<meta name="ppo-scope-id-secondary" content="CS-03">'));
  assert(page.includes('<meta name="ppo-design-revision" content="r01">'));
});

test('Tokens are declared on the scope container, not on :root, reusing the shared core', () => {
  assert(!/:root\s*\{[^}]*--navy/.test(css));
  const block = css.match(/#ppo-contacts\{([^}]*)\}/)[1];
  const names = [...block.matchAll(/--([a-z-]+):/g)].map(m => m[1]);
  const adTokens = [...read(path.join(root, 'docs/design/access-review/workspace.css'))
    .match(/#ppo-access-review\{([^}]*)\}/)[1].matchAll(/--([a-z-]+):/g)].map(m => m[1]);
  for (const t of adTokens) assert(names.includes(t), 'shared core token missing: ' + t);
  assert(names.includes('surface-hover') && names.includes('line-soft') && names.includes('success-tint'));
});

test('Theme r22 is strictly additive over r20, measured rather than asserted', () => {
  const pins = JSON.parse(read(path.join(src, 'source-pins.json')));
  const board = path.join(root, pins.themeFile);
  assert(fs.existsSync(board), 'the pinned r22 board must exist');
  assert.equal(shaBytes(board), pins.themeSHA256);
  assert.equal(pins.themeSHA256,
    'a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0');
  const declarations = file => {
    const out = new Map();
    for (const m of read(file).matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;}\n]+)/g)) {
      const name = m[1], value = m[2].trim();
      if (!out.has(name)) out.set(name, new Set());
      out.get(name).add(value);
    }
    return out;
  };
  const r20 = declarations(path.join(root,
    'docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html'));
  const r22 = declarations(board);
  const removed = [...r20.keys()].filter(n => !r22.has(n));
  const added = [...r22.keys()].filter(n => !r20.has(n));
  const changed = [...r20.keys()].filter(n => r22.has(n)
    && [...r20.get(n)].sort().join('|') !== [...r22.get(n)].sort().join('|'));
  assert.deepEqual(removed, [], 'r22 removes no token');
  assert.deepEqual(changed, [], 'r22 changes no token value');
  assert.equal(added.length, 24, 'r22 adds exactly 24 tokens');
  assert(added.every(n => n.startsWith('--nca-') || n.startsWith('--ss22-')),
    'every added token is a component-local alias: ' + added.join(', '));
});

test('The r22 selection family is declared with the board’s own values', () => {
  const board = read(path.join(root,
    'docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html'));
  const boardBlock = board.match(/#selection-states \{([^}]*--ss22-[^}]*)\}/)[1];
  const boardTokens = new Map([...boardBlock.matchAll(/(--ss22-[a-z]+)\s*:\s*([^;}]+)/g)]
    .map(m => [m[1], m[2].trim()]));
  const ours = css.match(/#ppo-contacts\{([^}]*)\}/)[1];
  const ourTokens = new Map([...ours.matchAll(/(--ss22-[a-z]+)\s*:\s*([^;}]+)/g)]
    .map(m => [m[1], m[2].trim()]));
  assert.equal(ourTokens.size, boardTokens.size, 'the whole family is adopted, not part of it');
  for (const [name, value] of boardTokens)
    assert.equal(ourTokens.get(name), value, name + ' must carry the board value');
  /* Each alias resolves to a token this module already declares, or to a shadow built
     from the brand navy, so the family introduces no new colour. */
  for (const [name, value] of ourTokens) {
    if (value.startsWith('var(')) {
      const target = value.slice(4, -1);
      assert(ours.includes(target + ':'), name + ' aliases an undeclared token ' + target);
    } else {
      /* Permitted: white, a radius, or a shadow/tint whose only colour is the brand
         navy #242a37 expressed as rgba(36,42,55,…). Anything else is a new colour. */
      const literal = value === '#fff' || /^\d+px$/.test(value);
      const navyOnly = /rgba\(/.test(value)
        && [...value.matchAll(/rgba\(([^)]*)\)/g)].every(m => /^36,42,55,\./.test(m[1].trim()))
        && !/#(?!fff\b)[0-9a-f]{3,8}\b/i.test(value);
      assert(literal || navyOnly,
        name + ' introduces a value that is not brand navy, white or a radius: ' + value);
    }
  }
  /* The selected directory row and the view tabs use the family, not an invention. */
  assert(css.includes('tbody tr[aria-selected=true] td{background:var(--ss22-panel)'));
  assert(css.includes('--ss22-halo'));
  assert(css.includes('.tabs button[aria-selected=true]{background:var(--ss22-panel)'));
});

test('The three known token divergences adopt one side and say which', () => {
  const block = css.match(/#ppo-contacts\{([^}]*)\}/)[1];
  assert(block.includes('--surface-hover:#f0f2f5'));
  assert(block.includes('--line-soft:#e9ecf1'));
  assert(block.includes('--success-tint:#f3f7f1'));
  assert(css.includes('Field Technicians r05 side'));
  /* The r22 board carries the same three values, so this package's choice is the one
     the current theme already makes. That is measured here, not asserted in prose. */
  const board = read(path.join(root,
    'docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html'));
  for (const [name, value] of [['--surface-hover', '#f0f2f5'], ['--line-soft', '#e9ecf1'],
    ['--success-tint', '#f3f7f1']])
    assert(board.includes(name + ':' + value), name + ' in the r22 board');
});

test('Embedded fonts are byte-identical to the declared shared source', () => {
  assert.equal(sha(path.join(src, 'fonts.css')), sha(path.join(root, 'docs/design/my-work/fonts.css')));
  assert.equal(sha(path.join(src, 'fonts.css')), sha(path.join(root, 'docs/design/access-review/fonts.css')));
  assert(page.includes(read(path.join(src, 'fonts.css')).trim().slice(0, 400)));
});

test('The page makes no remote request and stores only under its own key', () => {
  assert(!/https?:\/\/(?!www\.w3\.org)[^"'\s)]*\.(js|css|woff2?|png|jpg|svg)/.test(page));
  assert(!/<link[^>]+href="https?:/.test(page));
  assert(!/fetch\(|XMLHttpRequest|navigator\.sendBeacon/.test(page));
  assert(page.includes('ppo-contacts-r01'));
  assert(!/sessionStorage|indexedDB/.test(page));
  assert.equal((page.match(/localStorage\.(getItem|setItem|removeItem)/g) || []).length, 3);
});

test('All eight UI states are reachable and distinct in the assembled page', () => {
  same(M.UI_STATES, ['loading', 'empty', 'failed', 'partial', 'denied', 'saving', 'saved', 'conflict']);
  for (const phrase of ['Reading contacts', 'No contacts match these filters',
    'The contact read failed', 'Partial results',
    'You are not permitted to read contacts here', 'Saving…', 'Saved locally', 'Conflict.'])
    assert(page.includes(phrase), phrase);
});

test('The page never claims enforcement and states the authority boundary', () => {
  assert(page.includes('The server decides who you can see'));
  assert(page.includes('it enforces nothing and sends nothing'));
  assert(page.includes('This module issues nothing, sends nothing and acknowledges nothing'));
  assert(page.includes('Preview roles are a local demonstration, not authentication'));
  assert(!/we will contact|email has been sent|notification sent/i.test(page));
});

test('The page states that a contact has no user-facing reference', () => {
  assert(page.includes('No contact reference is allocated') || page.includes('None allocated'));
  assert(page.includes("register_identity('Person','')"));
  assert(page.includes('SYN-PPO-ORG-'));
});

test('Phone viewport treatment exists and no layout is wider than its container', () => {
  assert(css.includes('@media(max-width:640px)'));
  assert(css.includes('table.cards'));
  assert(css.includes('min-width:0'));
  /* A fixed width wider than the narrowest declared viewport (390 px) would overflow it.
     max-width and min-width are bounds, not fixed widths, so they are excluded. */
  const fixedWidths = [...css.matchAll(/(^|[^-\w])width:\s*(\d+)px/g)]
    .map(m => Number(m[2])).filter(n => n >= 390);
  assert.equal(fixedWidths.length, 0, 'fixed widths at or beyond 390px: ' + fixedWidths.join(', '));
  assert(css.includes('min-height:44px'));
  /* §5.1: the module fills the slot it is given. Only the scope container may state a
     viewport height; nothing beneath it allocates a second one. */
  const viewportHeights = [...css.matchAll(/([^{]*)\{[^}]*\b(?:min-)?height:\s*100d?vh/g)]
    .map(m => m[1].trim().split(/\s*\n/).pop().trim());
  same(viewportHeights, ['#ppo-contacts']);
  assert(css.includes('min-height:0'), 'every flex ancestor needs min-height:0');
  assert(css.includes('overflow:auto'));
});

test('The builder is deterministic and the committed HTML matches its sources', () => {
  const pins = JSON.parse(read(path.join(src, 'source-pins.json')));
  for (const [name, expected] of Object.entries(pins.assetPins))
    assert.equal(sha(path.join(src, name)), expected, name);
  for (const [name, expected] of Object.entries(pins.contractPins))
    assert.equal(sha(path.join(root, name)), expected, name);
  assert.equal(pins.sourceCommit, '01b9824a63e468b393265b159fa681f83f6e668c');
  assert(!/\r/.test(page), 'the committed HTML is LF only, on every platform');
});

/* ------------------------------------------------------------------ evidence */

const out = {
  scope: 'CS-02 / CS-03',
  revision: 'r01',
  html_sha256: shaBytes(htmlPath),
  html_bytes: fs.statSync(htmlPath).size,
  fixture_sha256: createHash('sha256').update(M.stable(M.seed()), 'utf8').digest('hex'),
  fixture_manifest_sha256: sha(path.join(src, 'fixtures.json')),
  source_commit: '01b9824a63e468b393265b159fa681f83f6e668c',
  groups: results.length,
  results
};
if (process.argv.includes('--write-evidence')) {
  const dir = path.join(root, 'docs/testing/evidence/contacts-r01');
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'model-results.json'), JSON.stringify(out, null, 2) + '\n');
}
const failed = results.filter(r => r.result === 'Failed');
console.log(JSON.stringify({scope: out.scope, groups: out.groups, passed: out.groups - failed.length,
  failed: failed.length, html_sha256: out.html_sha256, fixture_sha256: out.fixture_sha256}, null, 2));
const LF = String.fromCharCode(10);
console.log(results.map(r => '  ' + r.result.padEnd(7) + r.name
  + (r.detail ? LF + '            ' + r.detail : '')).join(LF));
if (failed.length) process.exit(1);
