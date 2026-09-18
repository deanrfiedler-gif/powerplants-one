/* CS-02 / CS-03 Contacts, Stakeholders & Relationships r01 — contract and proposed model.
   Every CONTRACT_* string below is reproduced from the pinned source named beside it and is
   asserted against that file by scripts/check-contacts-model.mjs. Nothing here enforces
   anything: the server decides. This model exists so the page cannot quietly drift from
   the rules the running application already applies. */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ contract text */

  /* Reproduced from src/shared/reads.ts listShared. */
  const CONTRACT_REFUSALS = Object.freeze({
    personScope: 'Person scope is derived from authorised affiliations and primary contacts.',
    siteFilter: 'This list does not accept a site filter.',
    sortColumn: 'Choose a sortable column.',
    ownerFilter: 'Owner filtering applies to organisations.',
    pageLimit: 'Choose 25, 50 or 100 rows.',
    companyContexts: 'Provide 1–10 explicit company contexts.',
    savedViews: 'Your saved views changed. Reload them before saving again.',
    viewNames: 'Use unique view names of up to 60 characters.',
    viewColumns: 'Choose available columns, including name.'
  });

  /* Reproduced from db/migrations/0002-shared-foundation.sql. */
  const CONTRACT_CONSTRAINTS = Object.freeze({
    personProjection: Object.freeze(['id', 'version', 'synthetic', 'updated_at',
      'display_name', 'email', 'phone', 'active', 'contact_preference']),
    displayNameRange: Object.freeze([1, 200]),
    roleLabelRange: Object.freeze([1, 200]),
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    companyContextRange: Object.freeze([1, 10]),
    referenceCounterTypes: Object.freeze(['ORG', 'SITE', 'AST', 'TKT']),
    activityLinkTypes: Object.freeze(['Organisation', 'Site', 'Asset', 'Ticket']),
    sitePartyRoles: Object.freeze(['Operator', 'BillingParty', 'Owner']),
    identityObjectTypes: Object.freeze(['Ticket', 'Organisation', 'Person', 'Site', 'Facility',
      'Asset', 'Relationship', 'SiteParty', 'ErpAccountMapping', 'AssetConfiguration',
      'AssetLocationEvent', 'HistoryRecord'])
  });

  /* Reproduced from src/crm/directory.ts. */
  const DIRECTORY_COLUMNS = Object.freeze(['name', 'organisations', 'email', 'phone',
    'preference', 'status', 'deals']);
  const DIRECTORY_SORTABLE = Object.freeze(['name', 'status', 'email', 'phone', 'deals']);
  const DIRECTORY_STATUSES = Object.freeze(['', 'Active', 'Inactive']);
  const DIRECTORY_LIMITS = Object.freeze([25, 50, 100]);
  const SAVED_VIEW_MAX = 12;
  const SAVED_VIEW_NAME_MAX = 60;

  /* The generic /api/v1/people path. Narrower than the directory, and not what CS-02 refines. */
  const LIST_SHARED = Object.freeze({
    order: 'ORDER BY r.id',
    orderLabel: 'UUID order (r.id)',
    searchField: 'display_name',
    limitRange: Object.freeze([1, 200]),
    defaultLimit: 50,
    refusedFilters: Object.freeze(['company_id', 'site_id'])
  });

  /* Three permitted values. Never a claim that a person can commit the customer. */
  const AUTHORITY_BASIS = Object.freeze(['Recorded', 'Asserted by us', 'Unknown']);

  /* Presence is a four-value fact. An empty list never stands in for a denied one. */
  const PRESENCE = Object.freeze(['present', 'restricted', 'none', 'unknown']);

  const VIEWS = Object.freeze([
    { id: 'directory', label: 'Directory', kicker: 'CS-02' },
    { id: 'contact', label: 'Contact record', kicker: 'CS-02' },
    { id: 'stakeholders', label: 'Stakeholders', kicker: 'CS-03' },
    { id: 'reliance', label: 'Reliance', kicker: 'CS-03' },
    { id: 'proposals', label: 'Proposals & duplicates', kicker: 'Proposed' },
    { id: 'history', label: 'History & explanation', kicker: 'CS-02' }
  ]);

  const UI_STATES = Object.freeze(['loading', 'empty', 'failed', 'partial', 'denied',
    'saving', 'saved', 'conflict']);

  /* ------------------------------------------------------------------ identifiers */

  const WS = '10000000-0000-4000-8000-000000000001';
  const CO = Object.freeze({
    a: '20000000-0000-4000-8000-000000000001',
    b: '20000000-0000-4000-8000-000000000002'
  });
  const ORG = Object.freeze({
    willowbank: 'SYN-PPO-ORG-000101',
    rothwell: 'SYN-PPO-ORG-000102',
    hadley: 'SYN-PPO-ORG-000103',
    marchmont: 'SYN-PPO-ORG-000104'
  });
  const SITE = Object.freeze({
    nursery: 'SYN-PPO-SITE-000201',
    field: 'SYN-PPO-SITE-000202',
    propagation: 'SYN-PPO-SITE-000203',
    northbank: 'SYN-PPO-SITE-000211',
    coastal: 'SYN-PPO-SITE-000212'
  });
  /* People carry no SYN-PPO- reference: register_identity('Person','') allocates none and
     reference_counters.record_type admits only ORG, SITE, AST and TKT. A UUID is an internal
     identifier, not a user-facing reference, and the page says so. */
  const P = n => '60000000-0000-4000-8000-0000000001' + String(n).padStart(2, '0');

  /* ------------------------------------------------------------------ fixture */

  /* The fixture lives in fixtures.json and is injected by scripts/build-contacts-design.py
     as globalThis.CONTACTS_FIXTURES. seed() returns a fresh deep copy every call, so no
     view can mutate the baseline another view is reading. */
  function seed() {
    const source = root.CONTACTS_FIXTURES;
    if (!source) throw new Error('Fixture data was not loaded.');
    return JSON.parse(JSON.stringify(source));
  }

  /* ------------------------------------------------------------------ preview roles */

  /* Grants are Seed. They exist to make the derived visibility rule observable, and they
     are not authentication. The server decides access; this page explains and proposes. */
  const ROLES = Object.freeze([
    { id: 'sales', label: 'Sales coordinator',
      description: 'shared.read, shared.edit and shared.create at Company scope, SYN Northern Operations.',
      grants: [
        { capability: 'shared.read', scopeType: 'Company', companyId: CO.a, siteId: null },
        { capability: 'shared.edit', scopeType: 'Company', companyId: CO.a, siteId: null },
        { capability: 'shared.create', scopeType: 'Company', companyId: CO.a, siteId: null }
      ],
      mayPropose: true },
    { id: 'service', label: 'Service coordinator',
      description: 'shared.read and shared.internal.read at Company scope, SYN Northern Operations. No shared.edit.',
      grants: [
        { capability: 'shared.read', scopeType: 'Company', companyId: CO.a, siteId: null },
        { capability: 'shared.internal.read', scopeType: 'Company', companyId: CO.a, siteId: null }
      ],
      mayPropose: false },
    { id: 'technician', label: 'Site technician',
      description: 'shared.read at Site scope only — Willowbank Nursery & Propagation. No company-level grant.',
      grants: [
        { capability: 'shared.read', scopeType: 'Site', companyId: CO.a, siteId: SITE.nursery }
      ],
      mayPropose: false },
    { id: 'finance', label: 'Finance reviewer',
      description: 'shared.read and shared.finance.read at Company scope, SYN Northern Operations.',
      grants: [
        { capability: 'shared.read', scopeType: 'Company', companyId: CO.a, siteId: null },
        { capability: 'shared.finance.read', scopeType: 'Company', companyId: CO.a, siteId: null }
      ],
      mayPropose: false }
  ]);

  const role = id => ROLES.find(r => r.id === id) || ROLES[0];

  /* scopeSql(company, site) from src/platform/permissions.ts, evaluated locally:
     Workspace grant, OR company match with a Company grant, OR company AND site match
     with a Site grant. A Site grant can never satisfy a call whose site argument is NULL. */
  function scopeHolds(r, capability, companyId, siteId) {
    return role(r).grants.some(g => {
      if (g.capability !== capability) return false;
      if (g.scopeType === 'Workspace') return true;
      if (g.companyId !== companyId) return false;
      if (g.scopeType === 'Company') return true;
      return g.scopeType === 'Site' && siteId !== null && siteId !== undefined
        && g.siteId === siteId;
    });
  }

  /* ------------------------------------------------------------------ visibility */

  /* visibility("Person") from src/shared/reads.ts, clause for clause.
     Returns the trace as well as the verdict, because the explanation view renders it. */
  function personVisibility(state, personId, roleId) {
    const contexts = state.contexts.filter(c => c.personId === personId);
    const primarySites = state.sites.filter(s => s.primaryContactId === personId);
    const steps = [];

    const contextHits = contexts.filter(c => scopeHolds(roleId, 'shared.read', c.companyId, null));
    steps.push({
      clause: 1,
      title: 'A company context this reader may read',
      sql: 'EXISTS(SELECT 1 FROM ppo.person_company_contexts pc WHERE pc.person_id=r.id AND scopeSql(pc.company_id))',
      detail: contexts.length === 0
        ? 'This person holds no company context row.'
        : contextHits.length
          ? 'Context in ' + contextHits.map(c => companyName(state, c.companyId)).join(', ')
            + ', and this reader holds shared.read there.'
          : 'Context in ' + contexts.map(c => companyName(state, c.companyId)).join(', ')
            + '. This reader holds no company-scoped shared.read there. '
            + 'scopeSql passes NULL for the site, so a site-scoped grant can never satisfy this clause.',
      pass: contextHits.length > 0
    });

    const siteHits = primarySites.filter(s => scopeHolds(roleId, 'shared.read', s.companyId, s.id));
    steps.push({
      clause: 2,
      title: 'A site where this person is the primary contact',
      sql: 'EXISTS(SELECT 1 FROM ppo.sites ps WHERE ps.primary_contact_id=r.id AND scopeSql(ps.company_id, ps.id))',
      detail: primarySites.length === 0
        ? 'This person is not the primary contact of any site.'
        : siteHits.length
          ? 'Primary contact of ' + siteHits.map(s => siteName(state, s.id)).join(', ')
            + ', and this reader holds shared.read over that site.'
          : 'Primary contact of ' + primarySites.map(s => siteName(state, s.id)).join(', ')
            + '. This reader holds no grant covering that site.',
      pass: siteHits.length > 0
    });

    const visible = steps.some(s => s.pass);
    return {
      visible,
      steps,
      basis: visible ? (steps[0].pass ? 'company-context' : 'site-primary-contact') : null,
      note: visible && !steps[0].pass && steps[1].pass
        ? 'This reader sees this person through the site clause alone. They see no other contact of that organisation.'
        : null
    };
  }

  const companyName = (s, id) => (s.companies.find(c => c.id === id) || {}).name || 'Unknown company';
  const siteName = (s, id) => (s.sites.find(x => x.id === id) || {}).name || 'Unknown site';
  const orgName = (s, id) => (s.organisations.find(o => o.id === id) || {}).name || 'Unknown organisation';
  const person = (s, id) => s.people.find(p => p.id === id) || null;

  function organisationVisible(state, organisationId, roleId) {
    const org = state.organisations.find(o => o.id === organisationId);
    if (!org) return false;
    if (scopeHolds(roleId, 'shared.read', org.companyId, null)) return true;
    /* visibility("Organisation") second clause: a site party at a site the reader may read. */
    return state.siteParties.some(sp => {
      if (sp.organisationId !== organisationId) return false;
      const site = state.sites.find(s => s.id === sp.siteId);
      return site && scopeHolds(roleId, 'shared.read', site.companyId, site.id);
    });
  }

  /* ------------------------------------------------------------------ affiliations */

  const AS_AT = '2026-09-18';

  function affiliationState(a, asAt) {
    const at = asAt || AS_AT;
    if (a.validFrom > at) return 'Future';
    if (a.validTo && a.validTo <= at) return 'Ended';
    return 'Current';
  }

  function affiliationsFor(state, personId, asAt) {
    return state.affiliations
      .filter(a => a.personId === personId)
      .map(a => Object.assign({}, a, { state: affiliationState(a, asAt) }))
      .sort((x, y) => x.validFrom.localeCompare(y.validFrom) || x.id.localeCompare(y.id));
  }

  /* The GiST EXCLUDE constraint on (workspace, organisation, person, role_label,
     daterange(valid_from, valid_to, '[)')). Same label, overlapping period, refused.
     Two different labels at one organisation over one period are permitted. */
  function affiliationOverlaps(state, candidate) {
    const lo = candidate.validFrom, hi = candidate.validTo;
    return state.affiliations.some(a => {
      if (a.id === candidate.id) return false;
      if (a.organisationId !== candidate.organisationId) return false;
      if (a.personId !== candidate.personId) return false;
      if (a.roleLabel !== candidate.roleLabel) return false;
      const aHi = a.validTo;
      return (aHi === null || aHi > lo) && (hi === null || hi > a.validFrom);
    });
  }

  function checkAffiliation(state, candidate) {
    if (!candidate.roleLabel || candidate.roleLabel.trim().length < CONTRACT_CONSTRAINTS.roleLabelRange[0]
      || candidate.roleLabel.trim().length > CONTRACT_CONSTRAINTS.roleLabelRange[1])
      throw new Error('role_label must be 1–200 characters.');
    if (!candidate.validFrom) throw new Error('valid_from is required.');
    if (candidate.validTo && !(candidate.validTo > candidate.validFrom))
      throw new Error('valid_to must be after valid_from.');
    if (!state.contexts.some(c => c.personId === candidate.personId
      && c.companyId === (state.organisations.find(o => o.id === candidate.organisationId) || {}).companyId))
      throw new Error('This person holds no context row in that company.');
    if (affiliationOverlaps(state, candidate))
      throw new Error('An affiliation with this role label already covers an overlapping period.');
    return true;
  }

  /* addAffiliation takes the ORGANISATION's expected_version and bumps the ORGANISATION.
     Two coordinators adding affiliations to one organisation will collide. */
  function affiliationConcurrency(state, organisationId) {
    const org = state.organisations.find(o => o.id === organisationId);
    return {
      owner: 'Organisation',
      organisationId,
      organisationName: org ? org.name : 'Unknown organisation',
      expectedVersion: org ? org.version : null,
      onSuccess: org ? org.version + 1 : null,
      capability: 'shared.edit on the organisation’s company',
      note: 'The affiliation is concurrency-owned by the organisation record, not by the person.'
    };
  }

  /* createPerson: 1–10 explicit company contexts, deduplicated and sorted, every one of
     them checked for shared.create and shared.read before anything is inserted. */
  function checkCompanyContexts(ids, roleId) {
    if (!Array.isArray(ids) || ids.length < CONTRACT_CONSTRAINTS.companyContextRange[0]
      || ids.length > CONTRACT_CONSTRAINTS.companyContextRange[1])
      throw new Error(CONTRACT_REFUSALS.companyContexts);
    const sorted = [...new Set(ids)].sort();
    for (const id of sorted) {
      if (!scopeHolds(roleId, 'shared.create', id, null)
        || !scopeHolds(roleId, 'shared.read', id, null))
        throw new Error('This identity does not have the required shared-data permission.');
    }
    return sorted;
  }

  /* ------------------------------------------------------------------ presence */

  /* The single most important function in this model. customerContext returns contacts: []
     both when the reader lacks company-level shared.read and when there genuinely are none.
     Nothing in this page may repeat that. Every list, count and panel returns one of the
     four PRESENCE values, following the owner_unavailable precedent in src/projects/service.ts. */
  function presenceOf(counts) {
    if (counts.visible > 0) return 'present';
    if (counts.restricted > 0) return 'restricted';
    if (counts.total === 0) return 'none';
    return 'unknown';
  }

  const PRESENCE_COPY = Object.freeze({
    present: { label: 'Shown', detail: 'Records this reader is permitted to see.' },
    restricted: { label: 'Restricted from you', detail: 'Records exist. Your grants do not reach them. This is not an empty list.' },
    none: { label: 'None recorded', detail: 'No record of this kind exists. This is not a permission problem.' },
    unknown: { label: 'Unavailable', detail: 'The count could not be established. It is not zero.' }
  });

  function contactsForOrganisation(state, organisationId, roleId, asAt) {
    const at = asAt || AS_AT;
    const rows = state.affiliations
      .filter(a => a.organisationId === organisationId)
      .map(a => {
        const vis = personVisibility(state, a.personId, roleId);
        const p = person(state, a.personId);
        return {
          affiliationId: a.id,
          personId: a.personId,
          roleLabel: a.roleLabel,
          validFrom: a.validFrom,
          validTo: a.validTo,
          state: affiliationState(a, at),
          visible: vis.visible,
          displayName: vis.visible ? p.displayName : 'Restricted contact',
          email: vis.visible ? p.email : null,
          phone: vis.visible ? p.phone : null,
          active: vis.visible ? p.active : null,
          restricted: !vis.visible
        };
      })
      .sort((x, y) => x.validFrom.localeCompare(y.validFrom) || x.affiliationId.localeCompare(y.affiliationId));
    const counts = {
      total: rows.length,
      visible: rows.filter(r => r.visible).length,
      restricted: rows.filter(r => r.restricted).length
    };
    return { rows, counts, presence: presenceOf(counts) };
  }

  /* ------------------------------------------------------------------ directory */

  /* Built on the CRM directory contract in src/crm/directory.ts, not on listShared.
     Its real sorts, its Active/Inactive status filter, its exact total, its 25/50/100
     page sizes and its saved views. */
  /* The contract refuses control characters in q. Written as an explicit code-point
     test rather than an escaped character class, which does not survive every
     editing path intact. */
  function hasControlCharacter(value) {
    for (const ch of String(value)) if (ch.codePointAt(0) < 32) return true;
    return false;
  }

  function parseDirectory(input) {
    const raw = Object.assign({ q: '', status: '', mine: 'false', sort: 'name',
      direction: 'asc', page: 1, limit: 25 }, input || {});
    if (typeof raw.q !== 'string' || raw.q.length > 200 || hasControlCharacter(raw.q))
      throw new Error('Use at most 200 characters.');
    if (!DIRECTORY_STATUSES.includes(raw.status))
      throw new Error('Choose an available status.');
    if (!DIRECTORY_COLUMNS.includes(raw.sort) || !DIRECTORY_SORTABLE.includes(raw.sort))
      throw new Error(CONTRACT_REFUSALS.sortColumn);
    if (raw.direction !== 'asc' && raw.direction !== 'desc')
      throw new Error('Choose ascending or descending.');
    const page = Number(raw.page), limit = Number(raw.limit);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
      throw new Error('Choose a valid page.');
    if (!DIRECTORY_LIMITS.includes(limit)) throw new Error(CONTRACT_REFUSALS.pageLimit);
    if (raw.mine === 'true') throw new Error(CONTRACT_REFUSALS.ownerFilter);
    return { q: raw.q, status: raw.status, sort: raw.sort, direction: raw.direction,
      page, limit, mine: false };
  }

  /* Current affiliations only, company-scoped and organisation-visibility-filtered,
     ordered by organisation name then role label — exactly the directory's predicate. */
  function currentOrganisationsOf(state, personId, roleId, asAt) {
    const at = asAt || AS_AT;
    return state.affiliations
      .filter(a => a.personId === personId)
      .filter(a => a.validFrom <= at && (a.validTo === null || a.validTo > at))
      .filter(a => {
        const org = state.organisations.find(o => o.id === a.organisationId);
        if (!org) return false;
        if (!scopeHolds(roleId, 'shared.read', org.companyId, null)) return false;
        return organisationVisible(state, org.id, roleId);
      })
      .map(a => ({ id: a.organisationId, name: orgName(state, a.organisationId), role: a.roleLabel }))
      .sort((x, y) => x.name.localeCompare(y.name) || x.role.localeCompare(y.role));
  }

  function dealCount(state, personId) {
    return state.bindings.filter(b => b.kind === 'DealPrimaryContact' && b.personId === personId).length;
  }

  function directoryRow(state, p, roleId, asAt) {
    return {
      id: p.id,
      display_name: p.displayName,
      display_number: null,
      status: p.active ? 'Active' : 'Inactive',
      email: p.email,
      phone: p.phone,
      contact_preference: p.contactPreference,
      sector: null,
      owner_name: null,
      organisations: currentOrganisationsOf(state, p.id, roleId, asAt),
      deals: dealCount(state, p.id),
      updated_at: p.updatedAt
    };
  }

  const SORT_VALUE = {
    name: r => r.display_name.toLowerCase(),
    status: r => r.status,
    email: r => (r.email || '').toLowerCase(),
    phone: r => r.phone || '',
    deals: r => r.deals
  };

  function readDirectory(state, roleId, input, asAt) {
    const f = parseDirectory(input);
    const permitted = state.people
      .filter(p => personVisibility(state, p.id, roleId).visible)
      .map(p => directoryRow(state, p, roleId, asAt));
    const haystack = r => [r.display_name, r.display_number, r.email, r.phone, r.sector,
      r.owner_name, JSON.stringify(r.organisations)].filter(Boolean).join(' ').toLowerCase();
    const filtered = permitted
      .filter(r => f.q === '' || haystack(r).indexOf(f.q.toLowerCase()) >= 0)
      .filter(r => f.status === '' || r.status === f.status);
    const dir = f.direction === 'asc' ? 1 : -1;
    const value = SORT_VALUE[f.sort];
    const sorted = filtered.slice().sort((a, b) => {
      const av = value(a), bv = value(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return a.id < b.id ? -1 * dir : a.id > b.id ? 1 * dir : 0;
    });
    const start = (f.page - 1) * f.limit;
    const withheld = state.people.length - permitted.length;
    return {
      total: filtered.length,
      items: sorted.slice(start, start + f.limit),
      page: f.page,
      limit: f.limit,
      observed_at: state.observedAt,
      kind: 'people',
      /* Not part of the directory contract. Rendered as a design addition so that a
         permitted population of zero is never read as a population of zero. */
      withheld,
      presence: presenceOf({ total: state.people.length, visible: permitted.length, restricted: withheld })
    };
  }

  function saveDirectoryViews(state, expectedVersion, views) {
    if (state.savedViews.version !== expectedVersion)
      throw new Error(CONTRACT_REFUSALS.savedViews);
    if (!Array.isArray(views) || views.length > SAVED_VIEW_MAX)
      throw new Error('Save up to twelve views.');
    const names = new Set();
    for (const v of views) {
      const key = String(v.name || '').toLowerCase();
      if (!v.name || !String(v.name).trim() || String(v.name).length > SAVED_VIEW_NAME_MAX
        || names.has(key)) throw new Error(CONTRACT_REFUSALS.viewNames);
      names.add(key);
      if (!Array.isArray(v.columns) || !v.columns.includes('name')
        || v.columns.some(c => !DIRECTORY_COLUMNS.includes(c))
        || new Set(v.columns).size !== v.columns.length)
        throw new Error(CONTRACT_REFUSALS.viewColumns);
      parseDirectory(v);
    }
    state.savedViews = { version: state.savedViews.version + 1, views: views.slice() };
    return state.savedViews;
  }

  /* The generic path, reproduced so the page can show what it would and would not do. */
  function listSharedPeople(state, roleId, input) {
    const f = Object.assign({ q: '', limit: LIST_SHARED.defaultLimit, after: null }, input || {});
    if (f.company_id) throw new Error(CONTRACT_REFUSALS.personScope);
    if (f.site_id) throw new Error(CONTRACT_REFUSALS.personScope);
    if (f.limit < LIST_SHARED.limitRange[0] || f.limit > LIST_SHARED.limitRange[1])
      throw new Error('Choose a page size between 1 and 200.');
    const rows = state.people
      .filter(p => personVisibility(state, p.id, roleId).visible)
      .filter(p => f.q === '' || p.displayName.toLowerCase().indexOf(String(f.q).toLowerCase()) >= 0)
      .filter(p => f.after === null || p.id > f.after)
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const selected = rows.slice(0, f.limit);
    const more = rows.length > f.limit;
    return {
      items: selected.map(p => ({
        id: p.id, version: p.version, synthetic: true, updated_at: p.updatedAt,
        display_name: p.displayName, email: p.email, phone: p.phone,
        active: p.active, contact_preference: p.contactPreference
      })),
      next_cursor: more ? 'signed-cursor-bound-to-filter-fingerprint' : null,
      completeness: more ? 'Partial' : 'Complete',
      ordering: LIST_SHARED.orderLabel
    };
  }

  /* ------------------------------------------------------------------ queues */

  const QUEUES = Object.freeze([
    { id: 'stale', label: 'Relied upon but no longer affiliated' },
    { id: 'inactive', label: 'Site primary contact inactive' },
    { id: 'nocontact', label: 'No contact recorded' },
    { id: 'duplicate', label: 'Possible duplicate' },
    { id: 'successor', label: 'Affiliation ended, successor unknown' },
    { id: 'restricted', label: 'Restricted from you' }
  ]);

  function queues(state, roleId, asAt) {
    const at = asAt || AS_AT;
    const seen = id => personVisibility(state, id, roleId).visible;
    const stale = state.bindings
      .filter(b => b.stale && b.personId && seen(b.personId) && bindingVisible(state, b, roleId))
      .map(b => b.personId);
    const inactive = state.sites
      .filter(s => s.primaryContactId && seen(s.primaryContactId))
      .filter(s => { const p = person(state, s.primaryContactId); return p && !p.active; })
      .map(s => s.primaryContactId);
    const noContactOrgs = state.organisations
      .filter(o => organisationVisible(state, o.id, roleId))
      .filter(o => !state.affiliations.some(a => a.organisationId === o.id
        && a.validFrom <= at && (a.validTo === null || a.validTo > at)))
      .map(o => o.id);
    const noContactRecords = state.bindings
      .filter(b => b.personId === null && b.reason)
      .filter(b => bindingVisible(state, b, roleId))
      .map(b => b.id);
    const duplicate = state.duplicates
      .filter(d => d.state === 'Open')
      .filter(d => d.members.every(seen))
      .map(d => d.id);
    const successor = state.successors
      .filter(s => s.successorPersonId === null)
      .filter(s => {
        const a = state.affiliations.find(x => x.id === s.affiliationId);
        return a && affiliationState(a, at) === 'Ended' && seen(a.personId);
      })
      .map(s => s.affiliationId);
    const restricted = state.people.filter(p => !seen(p.id)).map(p => p.id);
    return {
      stale: [...new Set(stale)],
      inactive: [...new Set(inactive)],
      nocontact: { organisations: noContactOrgs, records: noContactRecords },
      duplicate,
      successor,
      restricted
    };
  }

  function queueCounts(state, roleId, asAt) {
    const q = queues(state, roleId, asAt);
    return {
      stale: q.stale.length,
      inactive: q.inactive.length,
      nocontact: q.nocontact.organisations.length + q.nocontact.records.length,
      duplicate: q.duplicate.length,
      successor: q.successor.length,
      restricted: q.restricted.length
    };
  }

  /* ------------------------------------------------------------------ stakeholders */

  /* Authority basis is one of three values and never asserts that a person can commit
     the customer. The register's own words: distinguish a recorded role from assumed
     purchasing authority. */
  function authorityBasis(state, affiliationId) {
    const a = state.affiliations.find(x => x.id === affiliationId);
    if (!a) return { value: 'Unknown', because: 'No affiliation row.' };
    const state_ = affiliationState(a, AS_AT);
    if (state_ === 'Current')
      return { value: 'Recorded',
        because: 'ppo.relationships holds role_label “' + a.roleLabel + '” valid from '
          + a.validFrom + '. That is a recorded role, not an authority to commit.' };
    if (state_ === 'Ended')
      return { value: 'Unknown',
        because: 'The affiliation ended on ' + a.validTo + '. Nothing records who holds the role now.' };
    return { value: 'Unknown', because: 'The affiliation has not started.' };
  }

  function stakeholderMap(state, organisationId, roleId, asAt) {
    const at = asAt || AS_AT;
    const contacts = contactsForOrganisation(state, organisationId, roleId, at);
    const sites = state.sites.filter(s => s.organisationId === organisationId);
    const siteRows = sites.map(s => {
      const vis = s.primaryContactId ? personVisibility(state, s.primaryContactId, roleId) : null;
      const p = s.primaryContactId ? person(state, s.primaryContactId) : null;
      return {
        siteId: s.id,
        siteName: s.name,
        primaryContactId: s.primaryContactId,
        presence: !s.primaryContactId ? 'none' : vis.visible ? 'present' : 'restricted',
        displayName: !s.primaryContactId ? null : vis.visible ? p.displayName : 'Restricted contact',
        active: !s.primaryContactId ? null : vis.visible ? p.active : null
      };
    });
    const parties = state.siteParties
      .filter(sp => sites.some(s => s.id === sp.siteId) || sp.organisationId === organisationId)
      .map(sp => Object.assign({}, sp, {
        organisationName: orgName(state, sp.organisationId),
        siteName: siteName(state, sp.siteId),
        isCurrent: sp.validFrom <= at && (sp.validTo === null || sp.validTo > at)
      }));
    const gaps = [];
    for (const s of siteRows) if (s.presence === 'none')
      gaps.push({ kind: 'SiteWithoutPrimaryContact', subject: s.siteId,
        detail: s.siteName + ' has no primary contact. ADR-0014 blocks report approval without one.' });
    if (contacts.rows.filter(r => r.state === 'Current').length === 0 && contacts.counts.total > 0)
      gaps.push({ kind: 'NoCurrentAffiliation', subject: organisationId,
        detail: orgName(state, organisationId) + ' has affiliation history but no current affiliation.' });
    for (const r of contacts.rows.filter(r => r.state === 'Ended')) {
      const succ = state.successors.find(s => s.affiliationId === r.affiliationId);
      if (!succ || succ.successorPersonId === null)
        gaps.push({ kind: 'RoleHeldByNobody', subject: r.affiliationId,
          detail: '“' + r.roleLabel + '” ended on ' + r.validTo + ' and no successor is recorded.' });
    }
    return {
      organisationId,
      organisationName: orgName(state, organisationId),
      contacts,
      sites: siteRows,
      parties,
      gaps,
      authority: contacts.rows.map(r => ({
        affiliationId: r.affiliationId,
        personId: r.personId,
        displayName: r.displayName,
        roleLabel: r.roleLabel,
        basis: authorityBasis(state, r.affiliationId)
      }))
    };
  }

  /* ------------------------------------------------------------------ reliance */

  /* A binding is a record in its own module, under its own scope. A reader who cannot
     read that record is told the binding is restricted — never that there is none. */
  function bindingVisible(state, binding, roleId) {
    return scopeHolds(roleId, binding.capability || 'shared.read',
      binding.companyId, binding.siteId);
  }

  function relianceFor(state, personId, roleId) {
    const all = state.bindings.filter(b => b.personId === personId);
    const p = person(state, personId);
    const rows = all.map(b => {
      const visible = bindingVisible(state, b, roleId);
      return Object.assign({}, b, {
        visible,
        label: visible ? b.label : 'Restricted reliance',
        subject: visible ? b.subject : null,
        consequence: visible ? b.consequence : 'A record in ' + b.owner
          + ' depends on this contact. Your grants do not reach it, so its detail is withheld.',
        personActive: p ? p.active : null,
        currentlyBlocked: visible && Boolean(b.blocked) && p && !p.active,
        resolvableHere: false,
        resolvedBy: b.owner
      });
    });
    const counts = {
      total: rows.length,
      visible: rows.filter(r => r.visible).length,
      restricted: rows.filter(r => !r.visible).length
    };
    return {
      personId,
      rows,
      counts,
      blocked: rows.filter(r => r.currentlyBlocked),
      stale: rows.filter(r => r.visible && r.stale),
      presence: presenceOf(counts),
      note: 'This view reads these bindings. It owns none of them and can resolve none of them.'
    };
  }

  /* ------------------------------------------------------------------ proposals */

  /* Proposals are simulated. There is no command to update a person, deactivate one,
     end an affiliation or merge duplicates: src/shared/commands.ts exports createPerson
     and addAffiliation and nothing else for this record type. */
  const PROPOSAL_KINDS = Object.freeze([
    { id: 'name', label: 'Correct the recorded name', field: 'display_name',
      missing: 'No command updates people.display_name. renameOrganisation is the nearest existing precedent, for a different record type.' },
    { id: 'email', label: 'Correct the email address', field: 'email',
      missing: 'No command updates people.email.' },
    { id: 'phone', label: 'Correct the phone number', field: 'phone',
      missing: 'No command updates people.phone.' },
    { id: 'preference', label: 'Correct the contact preference', field: 'contact_preference',
      missing: 'No command updates people.contact_preference.' },
    { id: 'deactivate', label: 'Mark the contact inactive', field: 'active',
      missing: 'people.active is set true by createPerson and never written again, yet Finance, the planner and project tasks all enforce it.' },
    { id: 'endAffiliation', label: 'End an affiliation', field: 'relationships.valid_to',
      missing: 'No command writes relationships.valid_to. The GiST exclusion constraint would still govern any replacement period.' }
  ]);

  function proposalReference(state) {
    return 'SYN-PPO-CCP-' + String(state.counters.proposal + 1).padStart(6, '0');
  }

  function raiseProposal(state, roleId, input) {
    if (!role(roleId).mayPropose)
      throw new Error('This preview role holds no shared.edit and cannot raise a proposal.');
    const kind = PROPOSAL_KINDS.find(k => k.id === input.kind);
    if (!kind) throw new Error('Choose a correction to propose.');
    if (!input.subjectId || !person(state, input.subjectId))
      throw new Error('Choose a contact.');
    if (!personVisibility(state, input.subjectId, roleId).visible)
      throw new Error('This contact is not visible to this reader.');
    const reason = String(input.reason || '').trim();
    if (reason.length < 10) throw new Error('Give a reason of at least ten characters.');
    if (!input.reviewerId) throw new Error('Name an independent reviewer.');
    if (input.reviewerId === input.proposerId)
      throw new Error('A proposal cannot be reviewed by its proposer.');
    if (input.expectedVersion !== undefined) {
      const current = person(state, input.subjectId).version;
      if (input.expectedVersion !== current)
        throw new Error('This contact changed while you were editing. Current version is '
          + current + '.');
    }
    state.counters.proposal += 1;
    const proposal = {
      id: 'prop-' + state.counters.proposal,
      reference: 'SYN-PPO-CCP-' + String(state.counters.proposal).padStart(6, '0'),
      kind: kind.id,
      field: kind.field,
      subjectId: input.subjectId,
      subjectVersion: person(state, input.subjectId).version,
      before: currentValue(state, input.subjectId, kind),
      after: input.after === undefined ? null : input.after,
      reason,
      proposerId: input.proposerId || 'preview-' + roleId,
      reviewerId: input.reviewerId,
      state: 'Draft',
      supersedes: input.supersedes || null,
      review: null,
      appliedSimulated: false,
      raisedAt: state.observedAt
    };
    state.proposals.push(proposal);
    return proposal;
  }

  function currentValue(state, personId, kind) {
    const p = person(state, personId);
    if (!p) return null;
    if (kind.field === 'display_name') return p.displayName;
    if (kind.field === 'email') return p.email;
    if (kind.field === 'phone') return p.phone;
    if (kind.field === 'contact_preference') return p.contactPreference;
    if (kind.field === 'active') return p.active;
    return null;
  }

  function reviewProposal(state, proposalId, decision, reviewerId, reason) {
    const prop = state.proposals.find(p => p.id === proposalId);
    if (!prop) throw new Error('Unknown proposal.');
    if (prop.reviewerId !== reviewerId)
      throw new Error('Only the named independent reviewer may decide this proposal.');
    if (prop.proposerId === reviewerId)
      throw new Error('A proposal cannot be reviewed by its proposer.');
    if (!['Approved', 'Returned'].includes(decision)) throw new Error('Choose approve or return.');
    if (String(reason || '').trim().length < 10)
      throw new Error('Give a decision reason of at least ten characters.');
    prop.review = { decision, reviewerId, reason: String(reason).trim(), at: state.observedAt };
    prop.state = decision;
    return prop;
  }

  /* A changed proposal is a successor and inherits no review. */
  function reviseProposal(state, proposalId, changes, roleId) {
    const prior = state.proposals.find(p => p.id === proposalId);
    if (!prior) throw new Error('Unknown proposal.');
    const next = raiseProposal(state, roleId, {
      kind: prior.kind,
      subjectId: prior.subjectId,
      after: changes.after === undefined ? prior.after : changes.after,
      reason: changes.reason || prior.reason,
      proposerId: prior.proposerId,
      reviewerId: changes.reviewerId || prior.reviewerId,
      supersedes: prior.id
    });
    prior.state = 'Superseded';
    return next;
  }

  /* Simulated only. Nothing is applied, and the fixture is not mutated by an apply. */
  function simulateApply(state, proposalId, confirmed) {
    const prop = state.proposals.find(p => p.id === proposalId);
    if (!prop) throw new Error('Unknown proposal.');
    /* Idempotency is checked before the state gate: a repeated apply of something already
       simulated is a no-op that reports itself, not a refusal and never a second record. */
    if (prop.appliedSimulated)
      return { proposal: prop, duplicate: true, simulated: true, changedRecords: 0 };
    if (prop.state !== 'Approved')
      throw new Error('Only an approved proposal can be simulated.');
    if (!confirmed)
      throw new Error('Confirm that this is a simulation and changes nothing.');
    prop.appliedSimulated = true;
    prop.state = 'SimulatedApplied';
    return {
      proposal: prop,
      duplicate: false,
      simulated: true,
      wouldRequire: PROPOSAL_KINDS.find(k => k.id === prop.kind).missing,
      changedRecords: 0
    };
  }

  /* Duplicate resolution proposes a survivor with evidence and executes no merge.
     immutable_evidence refuses deletion of people and relationships rows. */
  function resolveDuplicate(state, duplicateId, survivorId, reason, roleId) {
    if (!role(roleId).mayPropose)
      throw new Error('This preview role cannot propose a duplicate resolution.');
    const dup = state.duplicates.find(d => d.id === duplicateId);
    if (!dup) throw new Error('Unknown duplicate set.');
    if (dup.state === 'NotDuplicate')
      throw new Error('This set is recorded as two different people who share a name.');
    if (!dup.members.includes(survivorId)) throw new Error('Choose a survivor from the set.');
    if (String(reason || '').trim().length < 10)
      throw new Error('Give a reason of at least ten characters.');
    dup.state = 'SupersededByProposed';
    dup.proposedSurvivor = survivorId;
    dup.pointer = dup.members.filter(m => m !== survivorId)
      .map(m => ({ from: m, to: survivorId, kind: 'superseded-by', applied: false }));
    dup.resolutionReason = String(reason).trim();
    return {
      duplicate: dup,
      merged: false,
      deleted: false,
      note: 'A superseded-by pointer is proposed. No row is merged and no row is deleted.'
    };
  }

  /* ------------------------------------------------------------------ proposed model */

  /* Everything in this block is PROPOSED. None of it exists in a migration or in
     src/shared. Each entry carries what adopting it would cost, and the page renders a
     visible Proposed marker beside every value drawn from here. */
  const PROPOSED = Object.freeze({
    designation: {
      id: 'ContactDesignation',
      label: 'Primary and secondary designation',
      values: Object.freeze(['Primary', 'Secondary', 'None']),
      scope: 'Per organisation and per site',
      cost: 'A designation column on ppo.relationships, or a separate designation table, '
        + 'plus a command to set it. sites.primary_contact_id already carries one designation '
        + 'per site and no command updates it.',
      today: 'Nothing distinguishes one affiliation from another except its free-text role_label.'
    },
    responsibility: {
      id: 'ResponsibilityClass',
      label: 'Responsibility taxonomy over role_label',
      values: Object.freeze(['Site operations', 'Agronomy', 'Maintenance', 'Commercial',
        'Accounts', 'Property', 'Not classified']),
      cost: 'A controlled vocabulary, a migration to hold it, and a decision about the '
        + '200-character free text already recorded against every existing relationship.',
      today: 'role_label is free text, 1–200 characters, and no vocabulary exists anywhere '
        + 'in the repository. The seed carries only SYN site contact and SYN supplier liaison.'
    },
    communication: {
      id: 'CommunicationPreference',
      label: 'Structured communication preference',
      values: Object.freeze(['Phone', 'Email', 'SMS', 'Site radio', 'Not stated']),
      cost: 'A structured column replacing people.contact_preference, and an explicit '
        + 'decision about what a preference does and does not mean.',
      today: 'contact_preference is nullable free text. The data dictionary states '
        + '“No automatic marketing consent inferred” and the API contract “no inferred consent”. '
        + 'r01 renders the free text as the free text it is, with no consent semantics.'
    },
    health: {
      id: 'RelationshipHealth',
      label: 'Influence and relationship-health indicator',
      values: Object.freeze(['Recently in contact', 'No recent contact', 'Not assessed']),
      cost: 'A derivation rule the owner has to agree, and a place to record it. An '
        + 'indicator that looks measured but is guessed is worse than no indicator.',
      today: 'Nothing records relationship health. r01 derives only “when an activity last '
        + 'touched an object this person is attached to”, and says that is what it is.'
    },
    personActivityLink: {
      id: 'PersonActivityLink',
      label: "'Person' in activity_links.object_type",
      cost: 'A migration extending the CHECK constraint, and a decision about the existing '
        + 'rows. Until then interaction history against a contact can only be derived.',
      today: "activity_links.object_type admits Organisation, Site, Asset and Ticket only."
    },
    reasonVocabulary: {
      id: 'NoContactReasonVocabulary',
      label: 'A recorded reason vocabulary for “no contact available”',
      cost: 'A vocabulary, a migration, and a migration path for the free text already held.',
      today: 'opportunities.contact_unknown_reason and tickets.requester_description are '
        + 'both free text. r01 matches them.'
    },
    commands: {
      id: 'ContactMaintenanceCommands',
      label: 'Correction, deactivation, affiliation-end and duplicate commands',
      cost: 'revisePersonIdentity, setPersonActive, endAffiliation, setSitePrimaryContact and '
        + 'setContactDesignation, plus audit object types, plus a can_edit flag the Person '
        + 'projection does not carry, plus a capability decision.',
      today: 'src/shared/commands.ts exports createPerson and addAffiliation for this record '
        + 'type and nothing else.'
    }
  });

  /* Derived, never asserted. The derivation is stated on every row that uses it. */
  function relationshipHealth(state, personId, asAt) {
    const at = asAt || AS_AT;
    const rows = state.derivedActivity.filter(a => a.personId === personId);
    if (!rows.length)
      return { value: 'Not assessed', proposed: true,
        derivation: 'No activity is linked to an object this person is attached to.' };
    const last = rows.map(r => r.when).sort().at(-1);
    const days = Math.floor((Date.parse(at + 'T00:00:00+10:00') - Date.parse(last)) / 86400000);
    return {
      value: days <= 60 ? 'Recently in contact' : 'No recent contact',
      proposed: true,
      lastAt: last,
      days,
      derivation: 'Derived from the most recent activity linked to an object this person is '
        + 'attached to. No activity is linked to a person: activity_links.object_type has no '
        + "'Person' value."
    };
  }

  /* ------------------------------------------------------------------ history */

  function historyFor(state, personId) {
    const p = person(state, personId);
    const affiliations = affiliationsFor(state, personId);
    const rows = state.events.filter(e =>
      (e.objectType === 'Person' && e.objectId === personId)
      || (e.objectType === 'Relationship' && affiliations.some(a => a.id === e.objectId)));
    return {
      personId,
      personVersion: p ? p.version : null,
      updatedAt: p ? p.updatedAt : null,
      rows: rows.slice().sort((a, b) => a.when.localeCompare(b.when)),
      recorded: rows.filter(r => r.contract).length,
      notRecorded: rows.filter(r => r.provenanceOnly).length,
      note: 'Only rows marked as contract audit exist in the application. The rest are stated as not recorded, not invented.'
    };
  }

  function derivedActivityFor(state, personId, roleId) {
    const visible = personVisibility(state, personId, roleId).visible;
    if (!visible) return { rows: [], presence: 'restricted', derived: true };
    const rows = state.derivedActivity.filter(a => a.personId === personId);
    return {
      rows: rows.slice().sort((a, b) => b.when.localeCompare(a.when)),
      presence: presenceOf({ total: rows.length, visible: rows.length, restricted: 0 }),
      derived: true,
      note: 'Derived. activity_links.object_type admits only Organisation, Site, Asset and Ticket. '
        + 'No activity is linked to a person, so every row states the object it is actually linked to.'
    };
  }

  /* ------------------------------------------------------------------ validation */

  function validate(s) {
    if (!s || s.schema !== 'ppo-contacts-r01')
      throw new Error('Unsupported saved workspace.');
    if (!Array.isArray(s.people) || !Array.isArray(s.affiliations) || !Array.isArray(s.contexts))
      throw new Error('Saved workspace is missing its record collections.');
    const ids = new Set();
    for (const p of s.people) {
      if (ids.has(p.id)) throw new Error('Duplicate person id ' + p.id);
      ids.add(p.id);
      const n = String(p.displayName || '').trim().length;
      if (n < CONTRACT_CONSTRAINTS.displayNameRange[0] || n > CONTRACT_CONSTRAINTS.displayNameRange[1])
        throw new Error('display_name must be 1–200 characters.');
      if (p.email !== null && !CONTRACT_CONSTRAINTS.emailPattern.test(p.email))
        throw new Error('Enter a valid email address.');
      if (typeof p.active !== 'boolean') throw new Error('active must be a boolean.');
      if (!Number.isInteger(p.version) || p.version < 1)
        throw new Error('version must be a positive integer.');
      if (!s.contexts.some(c => c.personId === p.id))
        throw new Error('Every person needs at least one company context.');
      if (s.contexts.filter(c => c.personId === p.id).length > CONTRACT_CONSTRAINTS.companyContextRange[1])
        throw new Error(CONTRACT_REFUSALS.companyContexts);
    }
    const relIds = new Set();
    for (const a of s.affiliations) {
      if (relIds.has(a.id)) throw new Error('Duplicate affiliation id ' + a.id);
      relIds.add(a.id);
      if (!ids.has(a.personId)) throw new Error('Affiliation names an unknown person.');
      const org = s.organisations.find(o => o.id === a.organisationId);
      if (!org) throw new Error('Affiliation names an unknown organisation.');
      if (!s.contexts.some(c => c.personId === a.personId && c.companyId === org.companyId))
        throw new Error('Affiliation requires a context row in the organisation’s company.');
      const n = String(a.roleLabel || '').trim().length;
      if (n < 1 || n > 200) throw new Error('role_label must be 1–200 characters.');
      if (a.validTo !== null && !(a.validTo > a.validFrom))
        throw new Error('valid_to must be after valid_from.');
      if (affiliationOverlaps(s, a))
        throw new Error('Overlapping affiliation for the same role label.');
    }
    for (const site of s.sites) {
      if (site.primaryContactId === null) continue;
      if (!ids.has(site.primaryContactId))
        throw new Error('Site primary contact names an unknown person.');
      if (!s.contexts.some(c => c.personId === site.primaryContactId && c.companyId === site.companyId))
        throw new Error('sites.primary_contact_id requires a context row in the site’s company.');
    }
    const operators = {};
    for (const sp of s.siteParties) {
      if (!CONTRACT_CONSTRAINTS.sitePartyRoles.includes(sp.role))
        throw new Error('Unknown site party role ' + sp.role);
      if (sp.role !== 'Operator' || sp.validTo !== null) continue;
      if (operators[sp.siteId]) throw new Error('Only one current Operator per site.');
      operators[sp.siteId] = true;
    }
    for (const p of s.proposals || []) {
      if (p.review && p.review.reviewerId === p.proposerId)
        throw new Error('A proposal cannot be reviewed by its proposer.');
      if (p.state === 'SimulatedApplied' && !p.appliedSimulated)
        throw new Error('An applied proposal must be marked simulated.');
      if (!PROPOSAL_KINDS.some(k => k.id === p.kind))
        throw new Error('Unknown proposal kind ' + p.kind);
    }
    for (const d of s.duplicates || []) {
      if (d.pointer && d.pointer.some(x => x.applied))
        throw new Error('A duplicate pointer is never applied.');
    }
    return s;
  }

  /* Deterministic serialisation for the fixture manifest hash. */
  function stable(value) {
    const walk = v => {
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
        return out;
      }
      return v;
    };
    return JSON.stringify(walk(value));
  }

  /* ------------------------------------------------------------------ export */

  root.CONTACTS_MODEL = Object.freeze({
    CONTRACT_REFUSALS, CONTRACT_CONSTRAINTS, DIRECTORY_COLUMNS, DIRECTORY_SORTABLE,
    DIRECTORY_STATUSES, DIRECTORY_LIMITS, SAVED_VIEW_MAX, SAVED_VIEW_NAME_MAX,
    LIST_SHARED, AUTHORITY_BASIS, PRESENCE, PRESENCE_COPY, VIEWS, UI_STATES, QUEUES,
    PROPOSAL_KINDS, PROPOSED, ROLES, AS_AT, CO, ORG, SITE, P, relationshipHealth,
    seed, role, scopeHolds, personVisibility, organisationVisible,
    companyName, siteName, orgName, person,
    affiliationState, affiliationsFor, affiliationOverlaps, checkAffiliation,
    affiliationConcurrency, checkCompanyContexts,
    presenceOf, contactsForOrganisation,
    parseDirectory, readDirectory, saveDirectoryViews, listSharedPeople,
    currentOrganisationsOf, dealCount,
    queues, queueCounts, authorityBasis, stakeholderMap, relianceFor, bindingVisible,
    proposalReference, raiseProposal, reviewProposal, reviseProposal, simulateApply,
    resolveDuplicate, historyFor, derivedActivityFor,
    validate, stable
  });
})(globalThis);
