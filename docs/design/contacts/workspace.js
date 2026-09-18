/* CS-02 / CS-03 Contacts, Stakeholders & Relationships r01 — workspace controller.
   Six views over one record collection, four preview roles, eight reachable UI states,
   local storage with validated backup and restore, and a scripted assistant bound to the
   rendered record. Nothing here sends anything, issues anything or acknowledges anything. */
(function (root, document) {
  'use strict';

  const M = root.CONTACTS_MODEL;
  const KEY = 'ppo-contacts-r01';
  const CLOCK = '2026-09-18T10:00:00+10:00';
  const CLOCK_LABEL = '18 September 2026, 10:00 AEST';
  const ICONS = root.CONTACTS_ICONS || {};

  /* ------------------------------------------------------------------ state */

  const ui = {
    view: 'directory',
    role: 'sales',
    mode: 'complete',          /* complete | loading | empty | failed | partial | denied */
    save: 'ok',                /* ok | saving | fail | conflict | unknown */
    selectedPerson: M.P(1),
    selectedOrg: M.ORG.willowbank,
    queue: null,
    q: '',
    status: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
    limit: 25,
    storage: 'unknown',
    lastSavedAt: null,
    conflict: false,
    recovery: null
  };

  let state = M.seed();
  let modalContext = null;
  let modalDirty = false;
  let lastFocus = null;

  /* ------------------------------------------------------------------ helpers */

  const $ = sel => document.querySelector(sel);
  const el = (tag, attrs, children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of [].concat(children || [])) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  };
  const icon = name => {
    const svg = ICONS[name];
    if (!svg) return null;
    const span = el('span', { class: 'icon-wrap' });
    span.innerHTML = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">' + svg + '</svg>';
    return span.firstChild;
  };
  /* The template ships static [data-icon] placeholders and the icon set is injected by
     the builder, so nothing paints them unless this runs. Without it the icon-only
     controls render as blank boxes carrying an aria-label and nothing visible. */
  function paintIcons(scope) {
    for (const node of (scope || document).querySelectorAll('[data-icon]')) {
      const glyph = ICONS[node.getAttribute('data-icon')];
      if (!glyph) continue;
      node.innerHTML = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">'
        + glyph + '</svg>';
    }
  }

  const dash = '—';
  const orNone = (v, label) => v === null || v === undefined || v === ''
    ? el('span', { class: 'tag none', text: label || 'Not recorded' })
    : document.createTextNode(String(v));
  const dateLabel = iso => {
    if (!iso) return dash;
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00+10:00' : iso);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const stamp = iso => iso ? dateLabel(iso) + ', ' + new Date(iso)
    .toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : dash;

  /* Presence is rendered, never flattened. A restricted list and an empty list are
     different objects on the screen and different words in the copy. */
  function presenceTag(presence, counts) {
    const copy = M.PRESENCE_COPY[presence];
    const cls = presence === 'present' ? 'ok' : presence === 'restricted' ? 'restricted'
      : presence === 'none' ? 'none' : 'unknown';
    const text = presence === 'present' && counts
      ? counts.visible + ' shown' + (counts.restricted ? ' · ' + counts.restricted + ' restricted' : '')
      : copy.label;
    return el('span', { class: 'tag ' + cls, title: copy.detail, text });
  }

  function presenceLine(presence, counts) {
    const copy = M.PRESENCE_COPY[presence];
    return el('p', { class: 'presence' }, [
      presenceTag(presence, counts),
      el('span', { text: copy.detail })
    ]);
  }

  function proposedTag(label) {
    return el('span', { class: 'tag proposed', title: 'Proposed. Not adopted, not decided.',
      text: label || 'Proposed' });
  }

  function simulatedTag() {
    return el('span', { class: 'tag proposed', text: 'Simulated' });
  }

  /* ------------------------------------------------------------------ storage */

  function readStorage() {
    try {
      const raw = root.localStorage.getItem(KEY);
      if (!raw) { ui.storage = 'empty'; return null; }
      const parsed = JSON.parse(raw);
      M.validate(parsed);
      ui.storage = 'restored';
      return parsed;
    } catch (e) {
      ui.storage = 'refused';
      ui.recovery = { kind: 'storage', text: 'A saved workspace was found but refused: '
        + e.message + ' The built-in fixture is shown instead. Nothing was overwritten.' };
      return null;
    }
  }

  /* The configured outcome is passed in, because ui.save also carries the transient
     "saving" status and would otherwise mask the outcome being simulated. */
  function writeStorage(outcome) {
    if (outcome === 'fail') throw new Error('Simulated save failure. Nothing was written.');
    if (outcome === 'conflict') throw new Error('Another tab or session saved first. '
      + 'Your entries are kept; reload the latest before saving again.');
    try {
      root.localStorage.setItem(KEY, JSON.stringify(state));
      ui.lastSavedAt = CLOCK;
      ui.storage = 'saved';
    } catch {
      ui.storage = 'unavailable';
      throw new Error('Local storage is unavailable in this browser. Nothing was saved.');
    }
  }

  function save(afterLabel) {
    const outcome = ui.save;
    if (outcome === 'unknown') {
      try { writeStorage(outcome); } catch { /* the outcome is unknown, not the write */ }
      ui.recovery = { kind: 'unknown', text: 'Outcome unknown. The save may or may not have '
        + 'been accepted. Re-check before repeating it; repeating creates no duplicate.' };
      render();
      return;
    }
    try {
      setSaveStatus('Saving…');
      writeStorage(outcome);
      toast(afterLabel || 'Saved locally');
    } finally {
      ui.save = outcome;
      render();
    }
  }

  function setSaveStatus(text) {
    const node = $('#save-status');
    if (node) node.textContent = text;
  }

  /* ------------------------------------------------------------------ toast, panel, dialog */

  let toastTimer = null;
  function toast(text) {
    const node = $('#toast');
    node.textContent = text;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 4000);
  }

  function openPanel(kicker, title, body) {
    lastFocus = document.activeElement;
    $('#panel-kicker').textContent = kicker;
    $('#panel-title').textContent = title;
    const host = $('#panel-body');
    host.replaceChildren();
    for (const node of [].concat(body)) if (node) host.appendChild(node);
    $('#panel').hidden = false;
    $('#panel').querySelector('[data-action=closePanel]').focus();
  }

  function closePanel() {
    $('#panel').hidden = true;
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }

  function openModal(config) {
    modalContext = config;
    modalDirty = false;
    lastFocus = document.activeElement;
    $('#modal-kicker').textContent = config.kicker || 'Contacts';
    $('#modal-title').textContent = config.title;
    $('#modal-submit').textContent = config.submitLabel || 'Save';
    $('#modal-submit').hidden = config.submitLabel === null;
    $('#cancel-button').textContent = config.cancelLabel || 'Close';
    const body = $('#modal-body');
    body.replaceChildren();
    for (const node of [].concat(config.body)) if (node) body.appendChild(node);
    const err = $('#modal-error');
    err.hidden = true;
    err.textContent = '';
    $('#modal').showModal();
    body.addEventListener('input', () => { modalDirty = true; }, { once: true });
    const first = body.querySelector('input,select,textarea,button');
    if (first) first.focus();
  }

  function modalError(message) {
    const err = $('#modal-error');
    err.textContent = message;
    err.hidden = false;
    err.focus();
  }

  function closeModal() {
    modalContext = null;
    modalDirty = false;
    if ($('#modal').open) $('#modal').close();
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }

  /* ------------------------------------------------------------------ UI states */

  const STATE_COPY = {
    loading: { title: 'Reading contacts', body: 'The permitted contact population is being read. A count is not available yet; it is not zero.' },
    empty: { title: 'No contacts match these filters', body: 'Your filters returned nothing. This is a filter result, not a permission result and not an empty directory.' },
    failed: { title: 'The contact read failed', body: 'Nothing was read. This is not an all-clear and not an empty directory. Retry, or change nothing and check again later.' },
    partial: { title: 'Partial results', body: 'A page boundary was reached. The envelope reports completeness "Partial" and the count below is of this page only, not of the population.' },
    denied: { title: 'You are not permitted to read contacts here', body: 'Your grants do not reach this population. Records may exist. This is a permission result, not an empty directory.' }
  };

  function stateBlock(mode, retry) {
    const copy = STATE_COPY[mode];
    const cls = mode === 'denied' ? 'empty denied' : mode === 'failed' ? 'empty failed'
      : mode === 'loading' ? 'empty loading' : 'empty';
    return el('div', { class: cls, role: mode === 'failed' ? 'alert' : null }, [
      el('h2', { text: copy.title }),
      el('p', { text: copy.body }),
      mode === 'loading' ? el('div', { class: 'skeleton' }) : null,
      mode === 'loading' ? el('div', { class: 'skeleton', style: 'max-width:260px' }) : null,
      mode === 'failed' && retry ? el('div', { class: 'row', style: 'justify-content:center;margin-top:14px' },
        [el('button', { type: 'button', 'data-action': 'retry', text: 'Retry the read' })]) : null,
      mode === 'empty' ? el('div', { class: 'row', style: 'justify-content:center;margin-top:14px' },
        [el('button', { type: 'button', 'data-action': 'clearFilters', text: 'Clear filters' })]) : null
    ]);
  }

  /* ------------------------------------------------------------------ view: directory */

  function queueStrip() {
    const counts = M.queueCounts(state, ui.role);
    const strip = el('div', { class: 'queues' });
    for (const q of M.QUEUES) {
      const n = counts[q.id];
      const cls = 'queue' + (q.id === 'restricted' ? ' restricted' : n > 0 ? ' attention' : '');
      strip.appendChild(el('button', {
        type: 'button', class: cls, 'data-queue': q.id,
        'aria-pressed': ui.queue === q.id ? 'true' : 'false',
        onclick: () => { ui.queue = ui.queue === q.id ? null : q.id; ui.page = 1; render(); }
      }, [
        el('strong', { text: ui.mode === 'loading' || ui.mode === 'failed' ? dash : String(n) }),
        el('span', { text: q.label })
      ]));
    }
    return strip;
  }

  function directoryRows() {
    const result = M.readDirectory(state, ui.role, {
      q: ui.q, status: ui.status, sort: ui.sort, direction: ui.direction,
      page: ui.page, limit: ui.limit
    });
    if (!ui.queue) return result;
    const q = M.queues(state, ui.role);
    const ids = new Set(
      ui.queue === 'nocontact' ? [] :
      ui.queue === 'duplicate' ? state.duplicates.filter(d => q.duplicate.includes(d.id))
        .flatMap(d => d.members) :
      ui.queue === 'successor' ? state.affiliations
        .filter(a => q.successor.includes(a.id)).map(a => a.personId) :
      q[ui.queue] || []);
    const items = ui.queue === 'restricted' ? [] : result.items.filter(r => ids.has(r.id));
    return Object.assign({}, result, { items, total: items.length, queueFiltered: true });
  }

  function viewDirectory() {
    const nodes = [queueStrip()];

    if (ui.queue === 'restricted') {
      const q = M.queues(state, ui.role);
      nodes.push(el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [
          el('div', {}, [el('span', { class: 'eyebrow', text: 'Attention queue' }),
            el('h2', { text: 'Restricted from you' })]),
          presenceTag(q.restricted.length ? 'restricted' : 'none')
        ]),
        el('div', { class: 'card-body', style: 'display:grid;gap:12px' }, [
          el('p', { class: 'note', text: q.restricted.length
            ? q.restricted.length + ' contact record' + (q.restricted.length === 1 ? '' : 's')
              + ' exist in this workspace that your grants do not reach. Their names, channels '
              + 'and affiliations are withheld. This is the count of what is withheld, not a list of it.'
            : 'Every contact record in this workspace is within your grants. Nothing is withheld from you.' }),
          el('div', { class: 'callout' }, [icon('info'), el('div', {}, [
            el('p', { text: 'The running API cannot tell you this. customerContext returns '
              + 'contacts: [] both when the reader lacks company-level shared.read and when the '
              + 'organisation genuinely has no contacts. This page separates the two, following '
              + 'the owner_unavailable precedent already used for project task owners.' })])]),
          el('button', { type: 'button', class: 'small', style: 'width:max-content',
            onclick: () => explainRestricted(), text: 'Why can I not see them?' })
        ])
      ]));
      return nodes;
    }

    const result = directoryRows();
    if (ui.mode !== 'complete' && ui.mode !== 'partial') {
      nodes.push(stateBlock(ui.mode, true));
      return nodes;
    }
    if (!result.items.length) {
      nodes.push(stateBlock('empty'));
      return nodes;
    }

    const table = el('table', { class: 'cards register' });
    const columns = [
      { id: 'name', label: 'Name', sortable: true, col: 'c-identity', identity: true },
      { id: 'organisations', label: 'Organisations', sortable: false, col: 'c-org' },
      { id: 'email', label: 'Email', sortable: true, col: 'c-email' },
      { id: 'phone', label: 'Phone', sortable: true, col: 'c-phone' },
      { id: 'preference', label: 'Preference', sortable: false, col: 'c-pref' },
      { id: 'status', label: 'Status', sortable: true, col: 'c-status' },
      { id: 'deals', label: 'Deals', sortable: true, col: 'c-deals' }
    ];
    table.appendChild(el('colgroup', {}, columns.map(c => el('col', { class: c.col }))));
    const headRow = el('tr');
    for (const c of columns) {
      const cls = (c.sortable ? 'sortable' : 'fixed') + (c.identity ? ' identity' : '');
      if (c.sortable) {
        const active = ui.sort === c.id;
        headRow.appendChild(el('th', { class: cls, scope: 'col',
          'aria-sort': active ? (ui.direction === 'asc' ? 'ascending' : 'descending') : 'none' }, [
          el('button', { type: 'button', onclick: () => {
            if (ui.sort === c.id) ui.direction = ui.direction === 'asc' ? 'desc' : 'asc';
            else { ui.sort = c.id; ui.direction = 'asc'; }
            ui.page = 1; render();
          } }, [document.createTextNode(c.label),
            active ? el('span', { text: ui.direction === 'asc' ? '▲' : '▼' }) : null])
        ]));
      } else {
        /* parseDirectory refuses these two with "Choose a sortable column." so no sort
           affordance is drawn over a sort that would fail. */
        headRow.appendChild(el('th', { class: cls, scope: 'col' }, [
          document.createTextNode(c.label),
          el('em', { text: 'not sortable' })
        ]));
      }
    }
    table.appendChild(el('thead', {}, [headRow]));

    const body = el('tbody');
    for (const row of result.items) {
      const selected = row.id === ui.selectedPerson;
      const tr = el('tr', { 'aria-selected': selected ? 'true' : 'false' });
      tr.appendChild(el('td', { 'data-label': 'Name', class: 'identity' }, [
        el('button', { type: 'button', class: 'name-button', title: row.display_name,
          'aria-label': 'Open contact record for ' + row.display_name,
          onclick: () => { ui.selectedPerson = row.id; ui.view = 'contact'; render(); } },
          [document.createTextNode(row.display_name)])
      ]));
      const orgs = row.organisations.map(o => o.name + ' · ' + o.role).join(', ');
      tr.appendChild(el('td', { 'data-label': 'Organisations', title: orgs || null },
        row.organisations.length
          ? [document.createTextNode(orgs)]
          : [el('span', { class: 'tag none', text: 'No current affiliation' })]));
      tr.appendChild(el('td', { 'data-label': 'Email', title: row.email || null },
        [orNone(row.email, 'No email recorded')]));
      tr.appendChild(el('td', { 'data-label': 'Phone' }, [orNone(row.phone, 'No phone recorded')]));
      tr.appendChild(el('td', { 'data-label': 'Preference', title: row.contact_preference || null },
        [orNone(row.contact_preference, 'Not stated')]));
      tr.appendChild(el('td', { 'data-label': 'Status' }, [
        el('span', { class: 'tag ' + (row.status === 'Active' ? 'ok' : 'warn'), text: row.status })
      ]));
      tr.appendChild(el('td', { 'data-label': 'Deals', class: 'number', text: String(row.deals) }));
      body.appendChild(tr);
    }
    table.appendChild(body);

    const pages = Math.max(1, Math.ceil(result.total / result.limit));
    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [
          el('span', { class: 'eyebrow', text: 'CS-02 · Contact directory' }),
          el('h2', { text: result.total + ' contact' + (result.total === 1 ? '' : 's')
            + (ui.queue ? ' in this queue' : ' you may read') })
        ]),
        el('div', { class: 'row' }, [
          presenceTag(result.presence, { visible: result.total - 0, restricted: result.withheld }),
          ui.mode === 'partial' ? el('span', { class: 'tag warn', text: 'Completeness: Partial' }) : null
        ])
      ]),
      el('div', { class: 'scroll' }, [table]),
      el('div', { class: 'card-foot' }, [
        el('span', {}, [document.createTextNode('Exact total '),
          el('strong', { text: String(result.total) }),
          document.createTextNode(' · page ' + result.page + ' of ' + pages
            + ' · ' + result.limit + ' rows')]),
        el('span', { text: 'Contacts carry no reference: register_identity(\'Person\',\'\') allocates none.' }),
        state.people.some(x => !x.active)
          ? el('span', { text: 'Inactive is read-only. No command can write this column.' }) : null,
        result.withheld ? el('span', { class: 'tag restricted',
          text: result.withheld + ' withheld from you' }) : null,
        el('span', { style: 'margin-left:auto;display:flex;gap:8px' }, [
          el('button', { type: 'button', class: 'small', disabled: result.page <= 1,
            onclick: () => { ui.page -= 1; render(); }, text: 'Previous' }),
          el('button', { type: 'button', class: 'small', disabled: result.page >= pages,
            onclick: () => { ui.page += 1; render(); }, text: 'Next' })
        ])
      ])
    ]));

    if (ui.mode === 'partial') nodes.push(stateBlock('partial'));
    return nodes;
  }

  function explainRestricted() {
    const q = M.queues(state, ui.role);
    const rows = q.restricted.map(id => {
      const trace = M.personVisibility(state, id, ui.role);
      return el('div', { class: 'step fail' }, [
        el('h3', { text: 'A contact record you may not read' }),
        el('p', { class: 'note', text: 'Name withheld. The reason is the rule, not the record.' }),
        el('ul', { class: 'note' }, trace.steps.map(s =>
          el('li', { text: 'Clause ' + s.clause + ': ' + s.detail })))
      ]);
    });
    openPanel('Visibility', 'Restricted from you',
      rows.length ? rows : [el('p', { class: 'note', text: 'Nothing is withheld from you.' })]);
  }

  /* ------------------------------------------------------------------ view: contact record */

  function viewContact() {
    const id = ui.selectedPerson;
    const trace = M.personVisibility(state, id, ui.role);
    if (!trace.visible) {
      return [el('div', { class: 'empty denied' }, [
        el('h2', { text: 'This contact is restricted from you' }),
        el('p', { text: 'A person record exists. Your grants do not reach it, so its name, '
          + 'channels and affiliations are withheld. This is not a missing record.' }),
        el('div', { class: 'row', style: 'justify-content:center;margin-top:14px' }, [
          el('button', { type: 'button', onclick: () => { ui.view = 'history'; render(); },
            text: 'Show me why' })])
      ])];
    }
    const p = M.person(state, id);
    const affiliations = M.affiliationsFor(state, id);
    const contexts = state.contexts.filter(c => c.personId === id);
    const primaryOf = state.sites.filter(s => s.primaryContactId === id);
    const reliance = M.relianceFor(state, id, ui.role);

    const header = el('div', { class: 'context-strip' }, [
      el('div', {}, [el('small', { text: 'Contact' }), el('b', { text: p.displayName })]),
      el('div', {}, [el('small', { text: 'Reference' }),
        el('b', {}, [el('span', { class: 'tag none', text: 'None allocated' })])]),
      el('div', {}, [el('small', { text: 'Status' }),
        el('b', {}, [el('span', { class: 'tag ' + (p.active ? 'ok' : 'warn'),
          text: p.active ? 'Active' : 'Inactive' })])]),
      el('div', {}, [el('small', { text: 'Version' }), el('b', { text: String(p.version) })]),
      el('div', {}, [el('small', { text: 'Last updated' }), el('b', { text: stamp(p.updatedAt) })]),
      el('div', {}, [el('small', { text: 'Visible to you because' }),
        el('b', { text: trace.basis === 'company-context' ? 'A company context you may read'
          : 'A site where they are the primary contact' })])
    ]);

    const identity = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Identity and channels' }),
          el('h2', { text: 'Recorded fields' })]),
        el('button', { type: 'button', class: 'small',
          onclick: () => proposeDialog(id), text: 'Propose a correction' })
      ]),
      el('div', { class: 'card-body' }, [
        el('dl', { class: 'facts' }, [
          el('dt', { text: 'display_name' }), el('dd', {}, [document.createTextNode(p.displayName)]),
          el('dt', { text: 'email' }), el('dd', { class: 'wrap' }, [orNone(p.email, 'No email recorded')]),
          el('dt', { text: 'phone' }), el('dd', { class: 'wrap' }, [orNone(p.phone, 'No phone recorded')]),
          el('dt', {}, [document.createTextNode('contact_preference '),
            el('span', { class: 'note', text: '(free text)' })]),
          el('dd', { class: 'wrap' }, [orNone(p.contactPreference, 'Not stated')]),
          el('dt', { text: 'active' }), el('dd', {}, [
            el('span', { class: 'tag ' + (p.active ? 'ok' : 'warn'), text: String(p.active) })]),
          el('dt', { text: 'synthetic' }), el('dd', {}, [el('span', { class: 'tag', text: 'true' })])
        ]),
        el('div', { class: 'callout', style: 'margin-top:16px' }, [icon('info'), el('div', {}, [
          el('p', { text: 'No field above has an edit affordance because no command writes it. '
            + 'src/shared/commands.ts exports createPerson and addAffiliation for this record '
            + 'type and nothing else: no update, no deactivate, no end-affiliation, no merge.' }),
          el('p', { text: 'The Person projection also carries no can_edit flag, unlike '
            + 'Organisation, Site and Asset. The server tells the client nothing about whether '
            + 'this reader may change this person.' })
        ])]),
        p.contactPreference ? el('div', { class: 'callout proposed', style: 'margin-top:12px' },
          [icon('info'), el('div', {}, [
            el('p', {}, [proposedTag('Proposed'), document.createTextNode(
              ' A structured communication preference would replace this free text. '
              + 'It is not adopted. The data dictionary states "No automatic marketing consent '
              + 'inferred" and the API contract "no inferred consent", so nothing here is '
              + 'read as permission to contact.') ])])]) : null
      ])
    ]);

    const contextCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Company contexts' }),
          el('h2', { text: contexts.length + ' context row' + (contexts.length === 1 ? '' : 's') })])
      ]),
      el('div', { class: 'card-body', style: 'display:grid;gap:10px' }, [
        el('div', { class: 'chips' }, contexts.map(c =>
          el('span', { class: 'tag info', text: M.companyName(state, c.companyId) }))),
        el('p', { class: 'note', text: 'ppo.person_company_contexts. createPerson requires 1–10 '
          + 'explicit company contexts, deduplicated and sorted, and checks shared.create and '
          + 'shared.read in every one of them before inserting anything. A contact is not owned '
          + 'by one company context, and the Person projection carries no company_id.' })
      ])
    ]);

    const affCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Affiliations' }),
          el('h2', { text: affiliations.length + ' recorded' })]),
        presenceTag(affiliations.length ? 'present' : 'none',
          { visible: affiliations.length, restricted: 0 })
      ]),
      el('div', { class: 'card-body' }, [
        affiliations.length ? el('ul', { class: 'timeline' }, affiliations.map(a => {
          const conc = M.affiliationConcurrency(state, a.organisationId);
          const succ = state.successors.find(s => s.affiliationId === a.id);
          return el('li', { class: a.state.toLowerCase() }, [
            el('h3', {}, [document.createTextNode(a.roleLabel + ' · '
              + M.orgName(state, a.organisationId)),
              document.createTextNode(' '),
              el('span', { class: 'tag ' + (a.state === 'Current' ? 'ok' : a.state === 'Ended' ? '' : 'info'),
                text: a.state })]),
            el('p', { class: 'note', text: 'Valid from ' + dateLabel(a.validFrom)
              + (a.validTo ? ' to ' + dateLabel(a.validTo) : ' · no end date recorded') }),
            a.state === 'Ended' ? el('p', { class: 'note' }, [
              document.createTextNode('Successor: '),
              succ && succ.successorPersonId
                ? el('span', { class: 'tag ok', text: M.person(state, succ.successorPersonId).displayName })
                : el('span', { class: 'tag none', text: 'Not recorded' }),
              document.createTextNode(' The contract has no successor column; where one is shown '
                + 'it is fixture copy, labelled as such.')
            ]) : null,
            el('p', { class: 'note', text: 'Concurrency: this affiliation is owned by the '
              + conc.organisationName + ' record at version ' + conc.expectedVersion
              + '. addAffiliation takes the organisation’s expected_version and bumps the '
              + 'organisation on success, so two coordinators adding affiliations to one '
              + 'organisation will collide.' })
          ]);
        })) : el('p', { class: 'note', text: 'No affiliation row exists for this contact.' }),
        el('div', { class: 'row', style: 'margin-top:14px' }, [
          el('button', { type: 'button', class: 'small',
            onclick: () => affiliationDialog(id), text: 'Add an affiliation' })
        ])
      ])
    ]);

    const support = el('div', { class: 'stack' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', {}, [
          el('span', { class: 'eyebrow', text: 'Site primary contact' }),
          el('h2', { text: primaryOf.length ? primaryOf.length + ' site' + (primaryOf.length === 1 ? '' : 's') : 'None' })])]),
        el('div', { class: 'card-body', style: 'display:grid;gap:9px' },
          primaryOf.length ? primaryOf.map(s => el('div', {}, [
            el('b', { text: s.name }),
            el('p', { class: 'note', text: s.id + ' · ' + s.location })
          ])).concat([el('p', { class: 'note', text: 'sites.primary_contact_id is set at '
            + 'createSite and no command updates it afterwards.' })])
            : [el('p', { class: 'note', text: 'This contact is not the primary contact of any site.' })])
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', {}, [
          el('span', { class: 'eyebrow', text: 'Downstream reliance' }),
          el('h2', { text: reliance.rows.length + ' binding' + (reliance.rows.length === 1 ? '' : 's') })]),
          reliance.blocked.length ? el('span', { class: 'tag bad',
            text: reliance.blocked.length + ' blocked' }) : null]),
        el('div', { class: 'card-body', style: 'display:grid;gap:10px' }, [
          presenceLine(reliance.presence, reliance.counts),
          el('button', { type: 'button', class: 'small', style: 'width:max-content',
            onclick: () => { ui.view = 'reliance'; render(); }, text: 'Open the reliance view' })
        ])
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', {}, [
          el('span', { class: 'eyebrow', text: 'Proposed' }),
          el('h2', { text: 'Relationship health' })])]),
        el('div', { class: 'card-body' }, (() => {
          const h = M.relationshipHealth(state, id);
          return [el('p', {}, [proposedTag('Proposed'), document.createTextNode(' ' + h.value)]),
            el('p', { class: 'note', text: h.derivation })];
        })())
      ])
    ]);

    return [header, el('div', { class: 'split' }, [
      el('div', { class: 'stack' }, [identity, contextCard, affCard]), support])];
  }

  /* ------------------------------------------------------------------ view: stakeholders */

  function viewStakeholders() {
    const orgs = state.organisations.filter(o => M.organisationVisible(state, o.id, ui.role));
    if (!orgs.length) {
      return [el('div', { class: 'empty denied' }, [
        el('h2', { text: 'No organisation is visible to you' }),
        el('p', { text: 'Organisations exist in this workspace. Your grants do not reach any of '
          + 'them. This is a permission result, not an empty workspace.' })])];
    }
    if (!orgs.some(o => o.id === ui.selectedOrg)) ui.selectedOrg = orgs[0].id;
    const map = M.stakeholderMap(state, ui.selectedOrg, ui.role);

    const chooser = el('div', { class: 'row', style: 'margin-bottom:14px' }, orgs.map(o =>
      el('button', {
        type: 'button', class: 'small', 'aria-pressed': o.id === ui.selectedOrg ? 'true' : 'false',
        style: o.id === ui.selectedOrg
          ? 'background:var(--ss22-panel);border-color:var(--ss22-navy);'
            + 'box-shadow:0 0 0 2px var(--ss22-halo),var(--ss22-lift);color:var(--ss22-navy)'
          : null,
        onclick: () => { ui.selectedOrg = o.id; render(); }, text: o.name
      })));

    const authorityCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'CS-03 · Stakeholders and relationships' }),
          el('h2', { text: map.organisationName })]),
        presenceTag(map.contacts.presence, map.contacts.counts)
      ]),
      el('div', { class: 'card-body' }, [
        el('div', { class: 'callout warn' }, [icon('info'), el('div', {}, [
          el('p', { text: 'Authority basis is one of three values: Recorded, Asserted by us, '
            + 'Unknown. None of them says a person can commit the customer. The register asks '
            + 'this view to distinguish a recorded role from assumed purchasing authority, and '
            + 'no decision-maker flag exists anywhere in this package.' })])]),
        el('div', { class: 'scroll', style: 'margin-top:14px' }, [(() => {
          const t = el('table', { class: 'cards' });
          t.appendChild(el('thead', {}, [el('tr', {}, [
            el('th', { scope: 'col', text: 'Person' }),
            el('th', { scope: 'col', text: 'Recorded role' }),
            el('th', { scope: 'col', text: 'Period' }),
            el('th', { scope: 'col', text: 'Authority basis' })
          ])]));
          const tb = el('tbody');
          for (const row of map.contacts.rows) {
            const auth = map.authority.find(a => a.affiliationId === row.affiliationId);
            const tr = el('tr', { class: row.restricted ? 'restricted-row' : null });
            tr.appendChild(el('td', { 'data-label': 'Person' }, [
              row.restricted
                ? el('span', { class: 'restricted-name', text: 'Restricted contact' })
                : el('button', { type: 'button', class: 'name-button',
                    onclick: () => { ui.selectedPerson = row.personId; ui.view = 'contact'; render(); },
                    text: row.displayName }),
              row.restricted ? el('span', { class: 'rowsub',
                text: 'A person holds this role. Your grants do not reach them.' })
                : row.active === false ? el('span', { class: 'rowsub', text: 'Inactive' }) : null
            ]));
            tr.appendChild(el('td', { 'data-label': 'Recorded role', class: 'wrap' },
              [document.createTextNode(row.roleLabel),
               el('span', { class: 'rowsub', text: 'free text · no vocabulary exists' })]));
            tr.appendChild(el('td', { 'data-label': 'Period' }, [
              el('span', { class: 'tag ' + (row.state === 'Current' ? 'ok' : row.state === 'Ended' ? '' : 'info'),
                text: row.state }),
              el('span', { class: 'rowsub', text: dateLabel(row.validFrom)
                + (row.validTo ? ' – ' + dateLabel(row.validTo) : ' – open') })
            ]));
            tr.appendChild(el('td', { 'data-label': 'Authority basis' }, [
              el('span', { class: 'tag ' + (auth.basis.value === 'Recorded' ? 'ok' : 'unknown'),
                text: auth.basis.value }),
              el('button', { type: 'button', class: 'link-button', style: 'margin-top:6px',
                onclick: () => openPanel('Authority', auth.basis.value, [
                  el('p', { text: auth.basis.because }),
                  el('div', { class: 'callout warn' }, [icon('info'), el('div', {}, [
                    el('p', { text: 'A recorded role is not purchasing authority. Nothing in '
                      + 'the contract records who may commit a customer, and this page does '
                      + 'not invent it.' })])])
                ]), text: 'Why this basis?' })
            ]));
            tb.appendChild(tr);
          }
          t.appendChild(tb);
          return t;
        })()]),
        map.contacts.counts.restricted ? el('p', { class: 'note', style: 'margin-top:12px',
          text: map.contacts.counts.restricted + ' of these ' + map.contacts.counts.total
            + ' rows are withheld from you. The rows are shown because the affiliation exists; '
            + 'only the person is restricted. An empty list would have told you something false.' }) : null
      ])
    ]);

    const siteCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Sites and primary contacts' }),
        el('h2', { text: map.sites.length + ' site' + (map.sites.length === 1 ? '' : 's') })])]),
      el('div', { class: 'card-body', style: 'display:grid;gap:12px' },
        map.sites.map(s => el('div', { style: 'display:grid;gap:5px' }, [
          el('b', { text: s.siteName }),
          el('div', { class: 'row' }, [
            s.presence === 'present' ? el('span', { class: 'tag ok', text: s.displayName })
              : s.presence === 'restricted' ? el('span', { class: 'tag restricted', text: 'Restricted contact' })
              : el('span', { class: 'tag none', text: 'No primary contact recorded' }),
            s.active === false ? el('span', { class: 'tag bad', text: 'Inactive' }) : null
          ]),
          s.presence === 'none' ? el('p', { class: 'note', text: 'ADR-0014 blocks service '
            + 'report approval when there is no currently permitted active site primary '
            + 'contact to select. One optional primary contact per site is the contract limit.' }) : null,
          s.active === false ? el('p', { class: 'note', text: 'Finance selects this contact '
            + 'with AND u.active, and the planner refuses its contact command when the person '
            + 'is not active. No command can make them active again.' }) : null
        ])))
    ]);

    const partyCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Site parties' }),
        el('h2', { text: 'Organisation-level roles' })])]),
      el('div', { class: 'card-body' }, [
        el('div', { class: 'scroll' }, [(() => {
          const t = el('table', { class: 'cards' });
          t.appendChild(el('thead', {}, [el('tr', {}, [
            el('th', { scope: 'col', text: 'Site' }), el('th', { scope: 'col', text: 'Organisation' }),
            el('th', { scope: 'col', text: 'Role' }), el('th', { scope: 'col', text: 'Current' })])]));
          const tb = el('tbody');
          for (const sp of map.parties) tb.appendChild(el('tr', {}, [
            el('td', { 'data-label': 'Site', text: sp.siteName }),
            el('td', { 'data-label': 'Organisation', text: sp.organisationName }),
            el('td', { 'data-label': 'Role' }, [el('span', { class: 'tag', text: sp.role })]),
            el('td', { 'data-label': 'Current' }, [el('span', {
              class: 'tag ' + (sp.isCurrent ? 'ok' : ''), text: sp.isCurrent ? 'Current' : 'Ended' })])
          ]));
          t.appendChild(tb);
          return t;
        })()]),
        el('p', { class: 'note', style: 'margin-top:12px', text: 'ppo.site_parties carries '
          + 'Operator, BillingParty and Owner with validity periods, and an exclusion '
          + 'constraint allows one current Operator per site. siteContext computes is_current '
          + 'server-side. Sites carry organisations as parties and one person as primary '
          + 'contact; there is no other person-to-site relationship in the contract.' })
      ])
    ]);

    const gapCard = el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Coverage' }),
        el('h2', { text: map.gaps.length ? map.gaps.length + ' gap' + (map.gaps.length === 1 ? '' : 's')
          : 'No coverage gap found' })])]),
      el('div', { class: 'card-body', style: 'display:grid;gap:10px' },
        map.gaps.length ? map.gaps.map(g => el('div', { class: 'callout warn' },
          [icon('info'), el('div', {}, [el('b', { text: g.kind.replace(/([A-Z])/g, ' $1').trim() }),
            el('p', { text: g.detail })])]))
          : [el('p', { class: 'note', text: 'Every site of this organisation has a primary '
            + 'contact, a current affiliation exists, and every ended role has a recorded '
            + 'successor. This is a statement about recorded data, not about the real '
            + 'relationship.' })])
    ]);

    return [chooser, el('div', { class: 'stack' }, [authorityCard,
      el('div', { class: 'two' }, [siteCard, gapCard]), partyCard])];
  }

  /* ------------------------------------------------------------------ view: reliance */

  function viewReliance() {
    const id = ui.selectedPerson;
    const trace = M.personVisibility(state, id, ui.role);
    if (!trace.visible) return [stateBlock('denied')];
    const p = M.person(state, id);
    const rel = M.relianceFor(state, id, ui.role);

    const head = el('div', { class: 'context-strip' }, [
      el('div', {}, [el('small', { text: 'Contact' }), el('b', { text: p.displayName })]),
      el('div', {}, [el('small', { text: 'Status' }), el('b', {}, [
        el('span', { class: 'tag ' + (p.active ? 'ok' : 'warn'),
          text: p.active ? 'Active' : 'Inactive' })])]),
      el('div', {}, [el('small', { text: 'Bindings' }), el('b', { text: String(rel.counts.total) })]),
      el('div', {}, [el('small', { text: 'Blocked now' }), el('b', {}, [
        rel.blocked.length ? el('span', { class: 'tag bad', text: String(rel.blocked.length) })
          : el('span', { class: 'tag ok', text: '0' })])])
    ]);

    const blockedCase = rel.blocked.length ? el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Worked case' }),
        el('h2', { text: 'An inactive site primary contact blocks a report approval' })])]),
      el('div', { class: 'card-body', style: 'display:grid;gap:12px' }, [
        el('div', { class: 'callout bad' }, [icon('info'), el('div', {}, [
          el('p', { text: p.displayName + ' is the primary contact of Willowbank Field '
            + 'Production and people.active is false. ADR-0014: "The currently permitted active '
            + 'site primary contact is shown by name and explicitly selected before approval… '
            + 'If that contact is unavailable, approval is blocked and return remains available."' }),
          el('p', { text: 'The approval is blocked in SV-06. It is not resolvable here, and this '
            + 'page offers no control that would pretend otherwise. No command can make this '
            + 'contact active: people.active is written once by createPerson and never again.' })])]),
        el('div', { class: 'row' }, rel.blocked.map(b =>
          el('span', { class: 'tag bad', text: b.owner + ' · ' + b.subject })))
      ])
    ]) : null;

    const staleCase = rel.stale.length ? el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Worked case' }),
        el('h2', { text: 'Relied upon, no longer affiliated' })])]),
      el('div', { class: 'card-body' }, [
        el('div', { class: 'callout warn' }, [icon('info'), el('div', {}, rel.stale.map(b =>
          el('p', { text: b.label + ' (' + b.subject + ') still names this contact. '
            + b.consequence })))])
      ])
    ]) : null;

    const table = el('table', { class: 'cards' });
    table.appendChild(el('thead', {}, [el('tr', {}, [
      el('th', { scope: 'col', text: 'Binding' }), el('th', { scope: 'col', text: 'Contract column' }),
      el('th', { scope: 'col', text: 'Owned by' }),
      el('th', { scope: 'col', text: 'If this contact becomes unavailable' })])]));
    const tb = el('tbody');
    for (const b of rel.rows) {
      tb.appendChild(el('tr', { class: b.visible ? null : 'restricted-row' }, [
        el('td', { 'data-label': 'Binding', class: 'wrap' }, [
          el('b', { text: b.label }),
          b.subject ? el('span', { class: 'rowsub', text: b.subject })
            : el('span', { class: 'rowsub', text: 'Subject withheld' }),
          b.currentlyBlocked ? el('span', { class: 'tag bad', text: 'Blocked now' }) : null
        ]),
        el('td', { 'data-label': 'Contract column', class: 'wrap' },
          [el('code', { text: b.column })]),
        el('td', { 'data-label': 'Owned by' }, [el('span', { class: 'tag info', text: b.owner })]),
        el('td', { 'data-label': 'If this contact becomes unavailable', class: 'wrap' },
          [document.createTextNode(b.consequence)])
      ]));
    }
    table.appendChild(tb);

    return [head, blockedCase, staleCase, el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'CS-03 · Reliance and obligations' }),
          el('h2', { text: 'Everywhere this contact is depended on' })]),
        presenceTag(rel.presence, rel.counts)
      ]),
      el('div', { class: 'scroll' }, [table]),
      el('div', { class: 'card-foot', text: rel.note
        + (rel.counts.restricted ? ' ' + rel.counts.restricted + ' binding'
          + (rel.counts.restricted === 1 ? ' is' : 's are') + ' withheld from you: the record '
          + 'exists, your grants do not reach it.' : '') })
    ])].filter(Boolean);
  }

  /* ------------------------------------------------------------------ view: proposals */

  function viewProposals() {
    const canPropose = M.role(ui.role).mayPropose;
    const nodes = [];

    nodes.push(el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
      el('p', {}, [el('b', { text: 'Every apply on this page is simulated. ' }),
        document.createTextNode('There is no command to update a person, deactivate one, end an '
          + 'affiliation or merge duplicates. A proposal here records what someone would ask '
          + 'for and why. It changes no record, and the fixture is unchanged after an apply.')]),
      el('p', { text: 'A receiving contract for a future runtime increment is recorded in the '
        + 'decision record. Nothing in it is proposed for adoption here.' })
    ])]));

    if (!canPropose) nodes.push(el('div', { class: 'callout' }, [icon('info'), el('div', {}, [
      el('p', { text: 'The ' + M.role(ui.role).label + ' preview role holds no shared.edit at '
        + 'company level, so the controls below are unavailable rather than hidden. '
        + 'addAffiliation requires shared.edit on the organisation’s company.' })])]));

    const proposals = state.proposals;
    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Correction proposals' }),
          el('h2', { text: proposals.length + ' raised in this session' })]),
        el('button', { type: 'button', class: 'small', disabled: !canPropose,
          onclick: () => proposeDialog(ui.selectedPerson), text: 'Propose a correction' })
      ]),
      el('div', { class: 'card-body', style: 'display:grid;gap:12px' },
        proposals.length ? proposals.map(pr => {
          const subject = M.person(state, pr.subjectId);
          const kind = M.PROPOSAL_KINDS.find(k => k.id === pr.kind);
          return el('div', { class: 'card sim' }, [
            el('div', { class: 'card-head' }, [
              el('div', {}, [el('span', { class: 'eyebrow', text: pr.reference }),
                el('h3', { text: kind.label + ' · ' + subject.displayName })]),
              el('div', { class: 'row' }, [
                el('span', { class: 'tag ' + (pr.state === 'Approved' ? 'ok'
                  : pr.state === 'Returned' ? 'warn' : pr.state === 'Superseded' ? '' : 'info'),
                  text: pr.state }),
                pr.appliedSimulated ? simulatedTag() : null
              ])
            ]),
            el('div', { class: 'card-body', style: 'display:grid;gap:9px' }, [
              el('dl', { class: 'facts' }, [
                el('dt', { text: 'Field' }), el('dd', {}, [el('code', { text: pr.field })]),
                el('dt', { text: 'Recorded now' }), el('dd', { class: 'wrap' },
                  [orNone(pr.before === null ? null : String(pr.before), 'Not recorded')]),
                el('dt', { text: 'Proposed' }), el('dd', { class: 'wrap' },
                  [orNone(pr.after === null ? null : String(pr.after), 'Remove the value')]),
                el('dt', { text: 'Subject version at proposal' }),
                el('dd', { text: String(pr.subjectVersion) }),
                el('dt', { text: 'Reason' }), el('dd', { class: 'wrap', text: pr.reason }),
                el('dt', { text: 'Reviewer' }), el('dd', { text: pr.reviewerId }),
                pr.supersedes ? el('dt', { text: 'Supersedes' }) : null,
                pr.supersedes ? el('dd', { text: pr.supersedes + ' — a changed proposal is a '
                  + 'successor and inherits no review' }) : null
              ]),
              el('p', { class: 'note', text: 'Why no direct action: ' + kind.missing }),
              pr.review ? el('p', { class: 'note', text: 'Decision: ' + pr.review.decision
                + ' — ' + pr.review.reason }) : null,
              el('div', { class: 'row' }, [
                pr.state === 'Draft' ? el('button', { type: 'button', class: 'small',
                  disabled: !canPropose, onclick: () => reviewDialog(pr.id),
                  text: 'Record an independent review' }) : null,
                pr.state === 'Approved' ? el('button', { type: 'button', class: 'small',
                  disabled: !canPropose, onclick: () => applyDialog(pr.id),
                  text: 'Simulated apply' }) : null,
                pr.state === 'Returned' ? el('button', { type: 'button', class: 'small',
                  disabled: !canPropose, onclick: () => reviseDialog(pr.id),
                  text: 'Raise a successor' }) : null
              ])
            ])
          ]);
        }) : [el('p', { class: 'note', text: 'No proposal has been raised in this session. '
          + 'Proposals are held locally and reset when this page is reset.' })])
    ]));

    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Duplicates' }),
        el('h2', { text: 'Candidate sets' })])]),
      el('div', { class: 'card-body', style: 'display:grid;gap:14px' },
        state.duplicates.map(d => {
          const visible = d.members.every(m => M.personVisibility(state, m, ui.role).visible);
          if (!visible) return el('div', { class: 'callout' }, [icon('info'), el('div', {}, [
            el('p', { text: 'A duplicate candidate set exists that your grants do not reach. '
              + 'Its members are withheld. This is not an absence of duplicates.' })])]);
          return el('div', { class: 'card' }, [
            el('div', { class: 'card-head' }, [
              el('div', {}, [el('span', { class: 'eyebrow', text: d.id }),
                el('h3', { text: d.members.map(m => M.person(state, m).displayName).join(' · ') })]),
              el('span', { class: 'tag ' + (d.state === 'NotDuplicate' ? 'ok' : 'warn'),
                text: d.state === 'NotDuplicate' ? 'Not a duplicate' : d.state })
            ]),
            el('div', { class: 'card-body', style: 'display:grid;gap:9px' }, [
              el('ul', { class: 'note' }, d.evidence.map(e => el('li', { text: e }))),
              el('p', { class: 'note', text: 'Proposed survivor: '
                + (d.proposedSurvivor ? M.person(state, d.proposedSurvivor).displayName : 'none')
                + ' — ' + d.survivorBasis }),
              d.pointer ? el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
                el('p', {}, [simulatedTag(), document.createTextNode(' A superseded-by pointer '
                  + 'is proposed. No row is merged and no row is deleted: immutable_evidence '
                  + 'refuses deletion of people and relationships, the data dictionary says '
                  + '"no name-based automatic merge" and the API contract says "no identity '
                  + 'deduplication".')])])]) : null,
              d.state === 'Open' ? el('div', { class: 'row' }, [
                el('button', { type: 'button', class: 'small', disabled: !canPropose,
                  onclick: () => duplicateDialog(d.id), text: 'Propose a superseded-by pointer' })
              ]) : null
            ])
          ]);
        }))
    ]));

    return nodes;
  }

  /* ------------------------------------------------------------------ view: history */

  function viewHistory() {
    const id = ui.selectedPerson;
    const trace = M.personVisibility(state, id, ui.role);
    const nodes = [];

    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', {}, [
        el('span', { class: 'eyebrow', text: 'Visibility explanation' }),
        el('h2', { text: 'Why this reader can ' + (trace.visible ? '' : 'not ') + 'see this contact' })]),
        el('span', { class: 'tag ' + (trace.visible ? 'ok' : 'restricted'),
          text: trace.visible ? 'Visible' : 'Restricted' })]),
      el('div', { class: 'card-body', style: 'display:grid;gap:12px' }, [
        el('p', { class: 'note', text: 'visibility("Person") in src/shared/reads.ts. Two clauses, '
          + 'joined by OR. Either one is enough.' }),
        el('ul', { class: 'steps' }, trace.steps.map(s =>
          el('li', { class: 'step ' + (s.pass ? 'pass' : 'fail') }, [
            el('h3', {}, [document.createTextNode('Clause ' + s.clause + ' · ' + s.title + ' '),
              el('span', { class: 'tag ' + (s.pass ? 'ok' : 'bad'),
                text: s.pass ? 'Pass' : 'Fail' })]),
            el('p', { class: 'note', text: s.detail }),
            el('code', { text: s.sql })
          ]))),
        trace.note ? el('div', { class: 'callout' }, [icon('info'),
          el('div', {}, [el('p', { text: trace.note })])]) : null,
        el('p', { class: 'note', text: 'An explanation is not permission. This page renders the '
          + 'rule the server applies; the server still decides.' })
      ])
    ]));

    if (!trace.visible) return nodes;

    const hist = M.historyFor(state, id);
    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Version and audit history' }),
          el('h2', { text: hist.recorded + ' recorded · ' + hist.notRecorded + ' not recorded' })])]),
      el('div', { class: 'card-body' }, [
        el('ul', { class: 'timeline' }, hist.rows.map(r =>
          el('li', { class: r.provenanceOnly ? 'notrecorded' : '' }, [
            el('h3', {}, [document.createTextNode(r.type + ' · ' + r.objectType + ' '),
              el('span', { class: 'tag ' + (r.contract ? 'ok' : 'none'),
                text: r.contract ? 'Application audit' : 'Not recorded' })]),
            el('p', { class: 'note', text: stamp(r.when) + ' — ' + r.detail })
          ]))),
        el('p', { class: 'note', style: 'margin-top:12px', text: hist.note })
      ])
    ]));

    const act = M.derivedActivityFor(state, id, ui.role);
    nodes.push(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', {}, [el('span', { class: 'eyebrow', text: 'Interaction history' }),
          el('h2', { text: 'Derived, not linked' })]),
        el('div', { class: 'row' }, [presenceTag(act.presence,
          { visible: act.rows.length, restricted: 0 }), proposedTag('Derived')])]),
      el('div', { class: 'card-body', style: 'display:grid;gap:10px' }, [
        act.rows.length ? el('ul', { class: 'timeline' }, act.rows.map(a =>
          el('li', {}, [
            el('h3', { text: a.summary }),
            el('p', { class: 'note', text: stamp(a.when) + ' · activities.kind = ' + a.kind }),
            el('p', { class: 'note', text: 'Derivation: ' + a.derivation
              + ' (' + a.linkedType + ' ' + a.linkedId + ')' })
          ])))
          : el('p', {}, [el('span', { class: 'tag none', text: 'No derived activity' }),
            document.createTextNode(' No activity is linked to an object this contact is '
              + 'attached to. This is an absence of records, not a restriction.')]),
        el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
          el('p', { text: act.note || M.PROPOSED.personActivityLink.today }),
          el('p', {}, [proposedTag('Proposed'), document.createTextNode(' '
            + M.PROPOSED.personActivityLink.cost)])])])
      ])
    ]));

    return nodes;
  }

  /* ------------------------------------------------------------------ dialogs */

  function field(id, label, control, hint) {
    return el('label', { for: 'f-' + id }, [
      el('span', { text: label }), control,
      hint ? el('span', { class: 'note', style: 'display:block;margin-top:5px', text: hint }) : null
    ]);
  }
  const input = (id, attrs) => el('input', Object.assign({ id: 'f-' + id, name: id }, attrs || {}));
  const select = (id, options, value) => el('select', { id: 'f-' + id, name: id },
    options.map(o => el('option', { value: o.value, selected: o.value === value ? true : null,
      text: o.label })));

  function proposeDialog(personId) {
    const p = M.person(state, personId);
    if (!p) return;
    openModal({
      kicker: 'Proposed · simulated',
      title: 'Propose a correction',
      submitLabel: 'Save proposal',
      body: [
        el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
          el('p', { text: 'This raises a proposal with a reason and a named independent '
            + 'reviewer. It applies nothing. No command exists for any of these fields.' })])]),
        field('subject', 'Contact', input('subject', { value: p.displayName, readonly: true })),
        field('kind', 'What to correct', select('kind',
          M.PROPOSAL_KINDS.map(k => ({ value: k.id, label: k.label })), 'name')),
        field('after', 'Proposed value', input('after', { value: p.displayName }),
          'Leave blank to propose removing the recorded value.'),
        field('reason', 'Reason', el('textarea', { id: 'f-reason', name: 'reason' }),
          'At least ten characters. The reason is retained with the proposal.'),
        field('reviewer', 'Independent reviewer', select('reviewer', [
          { value: 'u-alex', label: 'SYN Alex Moreau · Service coordinator' },
          { value: 'u-priya', label: 'SYN Priya Raman · Relationship owner' }
        ], 'u-alex'), 'A proposal cannot be reviewed by its proposer.')
      ],
      submit: form => {
        const kind = form.kind.value;
        const proposal = M.raiseProposal(state, ui.role, {
          kind,
          subjectId: personId,
          after: form.after.value.trim() === '' ? null : form.after.value.trim(),
          reason: form.reason.value,
          proposerId: 'u-priya',
          reviewerId: form.reviewer.value,
          expectedVersion: p.version
        });
        save('Proposal ' + proposal.reference + ' saved locally');
        ui.view = 'proposals';
      }
    });
    const kindSelect = $('#f-kind');
    kindSelect.addEventListener('change', () => {
      const k = M.PROPOSAL_KINDS.find(x => x.id === kindSelect.value);
      const after = $('#f-after');
      after.value = k.field === 'display_name' ? p.displayName
        : k.field === 'email' ? (p.email || '')
        : k.field === 'phone' ? (p.phone || '')
        : k.field === 'contact_preference' ? (p.contactPreference || '')
        : k.field === 'active' ? 'false' : '';
    });
  }

  function reviewDialog(proposalId) {
    const pr = state.proposals.find(x => x.id === proposalId);
    openModal({
      kicker: pr.reference, title: 'Record an independent review', submitLabel: 'Record decision',
      body: [
        el('p', { class: 'note', text: 'The named reviewer is ' + pr.reviewerId
          + '. A proposal cannot be reviewed by its proposer.' }),
        field('reviewer', 'Deciding as', select('reviewer', [
          { value: 'u-alex', label: 'SYN Alex Moreau' },
          { value: 'u-priya', label: 'SYN Priya Raman (raised this proposal)' }
        ], pr.reviewerId)),
        field('decision', 'Decision', select('decision', [
          { value: 'Approved', label: 'Approve' }, { value: 'Returned', label: 'Return' }], 'Approved')),
        field('reason', 'Decision reason', el('textarea', { id: 'f-reason', name: 'reason' }),
          'At least ten characters.')
      ],
      submit: form => {
        M.reviewProposal(state, proposalId, form.decision.value, form.reviewer.value, form.reason.value);
        save('Decision recorded locally');
      }
    });
  }

  function applyDialog(proposalId) {
    const pr = state.proposals.find(x => x.id === proposalId);
    const kind = M.PROPOSAL_KINDS.find(k => k.id === pr.kind);
    openModal({
      kicker: pr.reference, title: 'Simulated apply', submitLabel: 'Run the simulation',
      body: [
        el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
          el('p', {}, [simulatedTag(), document.createTextNode(' ' + kind.missing)]),
          el('p', { text: 'Running this simulation changes no record. The contact keeps its '
            + 'current values and its current version.' })])]),
        el('label', { class: 'check' }, [
          el('input', { type: 'checkbox', name: 'confirm', id: 'f-confirm' }),
          el('span', { text: 'I understand this is a simulation and applies nothing.' })])
      ],
      submit: form => {
        const result = M.simulateApply(state, proposalId, form.confirm.checked);
        save(result.duplicate ? 'Already simulated. No duplicate was created.'
          : 'Simulated. ' + result.changedRecords + ' records changed.');
      }
    });
  }

  function reviseDialog(proposalId) {
    const pr = state.proposals.find(x => x.id === proposalId);
    openModal({
      kicker: pr.reference, title: 'Raise a successor proposal', submitLabel: 'Save successor',
      body: [
        el('p', { class: 'note', text: 'A changed proposal is a successor and inherits no '
          + 'review. The original is retained and marked superseded.' }),
        field('after', 'Proposed value', input('after', { value: pr.after || '' })),
        field('reason', 'Reason', el('textarea', { id: 'f-reason', name: 'reason', value: '' }),
          'At least ten characters.')
      ],
      submit: form => {
        const next = M.reviseProposal(state, proposalId,
          { after: form.after.value.trim() || null, reason: form.reason.value }, ui.role);
        save('Successor ' + next.reference + ' saved locally');
      }
    });
  }

  function duplicateDialog(duplicateId) {
    const d = state.duplicates.find(x => x.id === duplicateId);
    openModal({
      kicker: d.id, title: 'Propose a superseded-by pointer', submitLabel: 'Save proposal',
      body: [
        el('div', { class: 'callout proposed' }, [icon('info'), el('div', {}, [
          el('p', { text: 'This proposes which record other references should point at. It '
            + 'merges nothing and deletes nothing. immutable_evidence refuses deletion of '
            + 'people and relationships rows, so a merge command may never be possible.' })])]),
        field('survivor', 'Proposed survivor', select('survivor',
          d.members.map(m => ({ value: m, label: M.person(state, m).displayName + ' · version '
            + M.person(state, m).version })), d.proposedSurvivor)),
        field('reason', 'Evidence and reason', el('textarea', { id: 'f-reason', name: 'reason' }),
          'At least ten characters.')
      ],
      submit: form => {
        M.resolveDuplicate(state, duplicateId, form.survivor.value, form.reason.value, ui.role);
        save('Superseded-by pointer proposed. Nothing was merged.');
      }
    });
  }

  function affiliationDialog(personId) {
    const orgs = state.organisations.filter(o => M.organisationVisible(state, o.id, ui.role));
    openModal({
      kicker: 'Contract command', title: 'Add an affiliation', submitLabel: 'Check the command',
      body: [
        el('div', { class: 'callout' }, [icon('info'), el('div', {}, [
          el('p', { text: 'addAffiliation is a real command. This form checks the same rules it '
            + 'checks — the exclusion constraint, the context requirement and the organisation '
            + 'version — and then stops. This page issues nothing.' })])]),
        field('organisation', 'Organisation', select('organisation',
          orgs.map(o => ({ value: o.id, label: o.name + ' · version ' + o.version })),
          orgs.length ? orgs[0].id : null)),
        field('role', 'role_label', input('role', { maxlength: 200, value: '' }),
          'Free text, 1–200 characters. No vocabulary exists; any taxonomy would be Proposed.'),
        field('from', 'valid_from', input('from', { type: 'date', value: '2026-09-18' })),
        field('to', 'valid_to', input('to', { type: 'date' }), 'Optional. Must be after valid_from.'),
        field('version', 'Organisation expected_version', input('version',
          { type: 'number', value: orgs.length ? orgs[0].version : 1 }),
          'The affiliation is concurrency-owned by the organisation, not by the person.')
      ],
      submit: form => {
        const orgId = form.organisation.value;
        const org = state.organisations.find(o => o.id === orgId);
        if (Number(form.version.value) !== org.version)
          throw new Error('Another coordinator changed ' + org.name + '. Its version is now '
            + org.version + '. Reload before adding this affiliation.');
        if (!M.role(ui.role).mayPropose)
          throw new Error('addAffiliation requires shared.edit on the organisation’s company.');
        M.checkAffiliation(state, {
          id: 'candidate', organisationId: orgId, personId,
          roleLabel: form.role.value, validFrom: form.from.value,
          validTo: form.to.value || null
        });
        toast('The command would be accepted. Nothing was issued: this page runs no command.');
        closeModal();
        render();
      }
    });
  }

  function optionsDialog() {
    openModal({
      kicker: 'Preview', title: 'Preview options', submitLabel: 'Apply',
      body: [
        field('role', 'Preview role', select('role',
          M.ROLES.map(r => ({ value: r.id, label: r.label })), ui.role),
          M.ROLES.find(r => r.id === ui.role).description),
        field('mode', 'Read state', select('mode', [
          { value: 'complete', label: 'Complete' }, { value: 'loading', label: 'Loading' },
          { value: 'empty', label: 'No matches' }, { value: 'failed', label: 'Read failed' },
          { value: 'partial', label: 'Partial read' }, { value: 'denied', label: 'Denied' }
        ], ui.mode), 'Each state is reachable and distinct. A failed read is never rendered as zero.'),
        field('save', 'Save outcome', select('save', [
          { value: 'ok', label: 'Accepted' }, { value: 'fail', label: 'Save fails' },
          { value: 'conflict', label: 'Another session saved first' },
          { value: 'unknown', label: 'Outcome unknown' }
        ], ui.save)),
        field('limit', 'Rows per page', select('limit',
          M.DIRECTORY_LIMITS.map(n => ({ value: String(n), label: String(n) })), String(ui.limit)),
          'The directory contract admits exactly 25, 50 or 100.')
      ],
      submit: form => {
        ui.role = form.role.value;
        ui.mode = form.mode.value;
        ui.save = form.save.value;
        ui.limit = Number(form.limit.value);
        ui.page = 1;
        ui.queue = null;
        closeModal();
        render();
      }
    });
  }

  function storageDialog() {
    openModal({
      kicker: 'Local workspace', title: 'Backup, restore and reset', submitLabel: null,
      cancelLabel: 'Close',
      body: [
        el('p', { class: 'note', text: 'This page holds its proposals in localStorage under '
          + KEY + '. Nothing leaves the browser. A restore is validated against the contract '
          + 'rules before it is accepted, and a refused restore overwrites nothing.' }),
        el('div', { class: 'row' }, [
          el('button', { type: 'button', onclick: () => {
            const text = JSON.stringify(state, null, 1);
            openPanel('Backup', 'Copy this backup', [
              el('p', { class: 'note', text: 'Select and copy. This page offers no download, '
                + 'because a download from a sandboxed preview would not reach you.' }),
              el('textarea', { readonly: true, style: 'min-height:320px',
                value: text, onfocus: e => e.target.select() })
            ]);
            closeModal();
          }, text: 'Show a backup' }),
          el('button', { type: 'button', onclick: () => restoreDialog(), text: 'Restore' }),
          el('button', { type: 'button', class: 'danger-button', onclick: () => {
            try { root.localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
            state = M.seed();
            ui.conflict = false;
            ui.recovery = null;
            ui.storage = 'reset';
            closeModal();
            toast('Reset to the built-in fixture. Local proposals were discarded.');
            render();
          }, text: 'Reset to the fixture' })
        ])
      ]
    });
  }

  function restoreDialog() {
    openModal({
      kicker: 'Local workspace', title: 'Restore a backup', submitLabel: 'Validate and restore',
      body: [
        el('p', { class: 'note', text: 'The backup is validated against the contract rules '
          + 'before it is accepted: display_name length, the email pattern, the company-context '
          + 'range, the affiliation exclusion constraint, one current Operator per site, and the '
          + 'independent-reviewer rule. A refused restore changes nothing.' }),
        field('backup', 'Backup JSON', el('textarea', { id: 'f-backup', name: 'backup',
          style: 'min-height:220px' }))
      ],
      submit: form => {
        let parsed;
        try { parsed = JSON.parse(form.backup.value); }
        catch { throw new Error('That is not valid JSON. Nothing was changed.'); }
        M.validate(parsed);
        state = parsed;
        ui.selectedPerson = state.people[0].id;
        save('Backup validated and restored');
        closeModal();
      }
    });
  }

  function guideDialog() {
    openModal({
      kicker: 'Page guide', title: 'What this page is, and is not', submitLabel: null,
      body: [
        el('p', { text: 'Six views over one synthetic contact collection, covering page register '
          + 'entries CS-02 (contact directory and contact detail) and CS-03 (stakeholder and '
          + 'relationship view).' }),
        el('ul', {}, M.VIEWS.map(v => el('li', { text: v.label + ' — ' + ({
          directory: 'the permitted population, with attention queues and the real directory sorts',
          contact: 'identity, channels, contexts, affiliations and version',
          stakeholders: 'recorded roles, coverage and authority basis per organisation',
          reliance: 'every downstream binding and what breaks if this contact becomes unavailable',
          proposals: 'corrections and duplicates as proposals with reasons, always simulated',
          history: 'version history and the visibility explanation, traced step by step'
        })[v.id] }))),
        el('div', { class: 'callout warn' }, [icon('info'), el('div', {}, [
          el('p', { text: 'This is a design review artefact. It is not an application route, '
            + 'not approved policy, and not owner acceptance. No field, rule or command shown '
            + 'here has been implemented by this package.' })])])
      ]
    });
  }

  const ASSISTANT = [
    { q: 'Why can this role not see every contact?',
      a: () => {
        const q = M.queues(state, ui.role);
        return 'As ' + M.role(ui.role).label + ', ' + q.restricted.length + ' of '
          + state.people.length + ' contact records are withheld. visibility("Person") passes '
          + 'when the reader holds shared.read on a company where the person has a context row, '
          + 'or on a site where they are the primary contact. Open History & explanation for the '
          + 'step-by-step trace of the selected contact.';
      } },
    { q: 'Can I correct a contact’s name here?',
      a: () => 'No. src/shared/commands.ts exports createPerson and addAffiliation for this '
        + 'record type and nothing else. You can raise a proposal with a reason and an '
        + 'independent reviewer, and every apply on this page is labelled Simulated.' },
    { q: 'What breaks if the selected contact becomes unavailable?',
      a: () => {
        const rel = M.relianceFor(state, ui.selectedPerson, ui.role);
        return rel.counts.total + ' bindings name this contact, ' + rel.counts.restricted
          + ' of them withheld from you. ' + (rel.blocked.length
            ? rel.blocked.length + ' are blocked right now, owned by '
              + [...new Set(rel.blocked.map(b => b.owner))].join(' and ') + '.'
            : 'None is blocked right now.');
      } },
    { q: 'Does a recorded role mean they can sign?',
      a: () => 'No. Authority basis is Recorded, Asserted by us or Unknown. Nothing in the '
        + 'contract records who may commit a customer, and this page does not invent it.' },
    { q: 'What reference does a contact have?',
      a: () => 'None. register_identity(\'Person\',\'\') allocates no display_number and '
        + 'reference_counters.record_type admits only ORG, SITE, AST and TKT. Contacts are '
        + 'identified by name, affiliation and the organisation’s SYN-PPO-ORG- reference. '
        + 'A UUID is not a user-facing reference.' }
  ];

  function assistantDialog() {
    openModal({
      kicker: 'Scripted assistant', title: 'Ask about the rendered record', submitLabel: null,
      body: [
        el('p', { class: 'note', text: 'Scripted. It answers from the record currently rendered '
          + 'in this page and from nothing else. It will not answer from a stale local copy, and '
          + 'it has no access to any other system.' }),
        ui.conflict ? el('div', { class: 'callout bad' }, [icon('info'), el('div', {}, [
          el('p', { text: 'This page holds a stale copy: another tab saved after it was loaded. '
            + 'The assistant will not answer until the latest is reloaded.' })])]) : null,
        el('div', { class: 'stack' }, ASSISTANT.map(item =>
          el('details', {}, [
            el('summary', { text: item.q }),
            el('div', { class: 'inside' }, [
              el('p', { text: ui.conflict
                ? 'Refused. This page holds a stale copy; reload the latest first.'
                : item.a() })
            ])
          ])))
      ]
    });
  }

  /* ------------------------------------------------------------------ toolbar */

  function toolbar() {
    const host = $('#toolbar');
    host.replaceChildren();
    if (ui.view !== 'directory') return;
    host.appendChild(el('div', { class: 'field grow' }, [
      el('label', { for: 'f-q' }, [el('span', { text: 'Search' })]),
      el('input', { id: 'f-q', type: 'search', value: ui.q,
        placeholder: 'Name, email, phone, organisation or role label',
        oninput: e => { ui.q = e.target.value; ui.page = 1; render(true); } })
    ]));
    host.appendChild(el('div', { class: 'field' }, [
      el('label', { for: 'f-status' }, [el('span', { text: 'Status' })]),
      select('status', [{ value: '', label: 'Any status' },
        { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }], ui.status)
    ]));
    $('#f-status').addEventListener('change', e => { ui.status = e.target.value; ui.page = 1; render(); });
    /* These two are buttons, not inputs, so their own text is their accessible name.
       A <label for> here would override it with the group heading. */
    host.appendChild(el('div', { class: 'field' }, [
      el('span', { class: 'field-heading', 'aria-hidden': 'true', text: 'Saved views' }),
      el('button', { type: 'button', id: 'f-views', onclick: () => savedViewsDialog(),
        text: 'Saved views: ' + state.savedViews.views.length + ' · manage' })
    ]));
    host.appendChild(el('div', { class: 'field' }, [
      el('span', { class: 'field-heading', 'aria-hidden': 'true', text: 'Local workspace' }),
      el('button', { type: 'button', id: 'f-storage', onclick: () => storageDialog(),
        text: 'Backup, restore, reset' })
    ]));
  }

  function savedViewsDialog() {
    openModal({
      kicker: 'Saved views', title: 'Personal saved views', submitLabel: 'Save this view',
      body: [
        el('p', { class: 'note', text: 'crm_directory_preferences holds up to twelve views per '
          + 'user and kind, with unique names of up to sixty characters and an optimistic '
          + 'expected_version. Saved views are a personal preference, not a shared filter.' }),
        field('name', 'Name this view', input('name', { maxlength: 60, value: '' })),
        el('p', { class: 'note', text: 'Current version ' + state.savedViews.version
          + '. Saving against a stale version is refused with: "'
          + M.CONTRACT_REFUSALS.savedViews + '"' }),
        state.savedViews.views.length ? el('ul', {}, state.savedViews.views.map(v =>
          el('li', { text: v.name + ' — ' + (v.q || 'no search') + ' · ' + (v.status || 'any status')
            + ' · sorted by ' + v.sort })))
          : el('p', {}, [el('span', { class: 'tag none', text: 'No saved view' })])
      ],
      submit: form => {
        const views = state.savedViews.views.concat([{
          name: form.name.value, q: ui.q, status: ui.status, mine: 'false',
          sort: ui.sort, direction: ui.direction, limit: ui.limit,
          columns: ['name', 'organisations', 'email', 'status']
        }]);
        M.saveDirectoryViews(state, state.savedViews.version, views);
        save('Saved view stored locally');
      }
    });
  }

  /* ------------------------------------------------------------------ render */

  const VIEW_FN = {
    directory: viewDirectory, contact: viewContact, stakeholders: viewStakeholders,
    reliance: viewReliance, proposals: viewProposals, history: viewHistory
  };

  function renderTabs() {
    const host = $('#tabs');
    host.replaceChildren();
    for (const v of M.VIEWS) {
      host.appendChild(el('button', {
        type: 'button', role: 'tab', 'data-view': v.id,
        'aria-selected': ui.view === v.id ? 'true' : 'false',
        onclick: () => { ui.view = v.id; render(); }
      }, [el('span', { text: v.label })]));
    }
  }

  function renderRecovery() {
    const host = $('#recovery');
    host.replaceChildren();
    if (ui.conflict) {
      host.appendChild(el('div', { class: 'callout bad' }, [icon('info'), el('div', {}, [
        el('p', { text: 'Conflict. Another tab or session saved after this page was loaded. '
          + 'Nothing here was overwritten and your entries are kept.' }),
        el('button', { type: 'button', class: 'small', style: 'margin-top:9px',
          'data-action': 'reloadLatest', onclick: () => {
            const restored = readStorage();
            if (restored) state = restored;
            ui.conflict = false;
            ui.recovery = null;
            render();
            toast('Reloaded the latest local workspace');
          }, text: 'Reload the latest' })
      ])]));
    }
    if (ui.recovery) {
      host.appendChild(el('div', { class: 'callout warn' }, [icon('info'), el('div', {}, [
        el('p', { text: ui.recovery.text }),
        ui.recovery.kind === 'unknown' ? el('button', {
          type: 'button', class: 'small', style: 'margin-top:9px', 'data-action': 'recover',
          onclick: () => { ui.recovery = null; render();
            toast('Re-checked. The original operation was not repeated and no duplicate exists.'); },
          text: 'Re-check the outcome' }) : null
      ])]));
    }
  }

  function render(keepFocus) {
    const active = keepFocus ? document.activeElement : null;
    const activeId = active ? active.id : null;
    const selStart = active && active.selectionStart !== undefined ? active.selectionStart : null;

    renderTabs();
    renderRecovery();
    toolbar();

    $('#role-label').textContent = M.role(ui.role).label;
    const storageWord = { restored: 'Restored from this browser', saved: 'Saved locally',
      empty: 'Nothing saved yet', refused: 'Saved copy refused', reset: 'Reset to the fixture',
      unavailable: 'Local storage unavailable', unknown: 'Local workspace ready' }[ui.storage];
    setSaveStatus(storageWord + (ui.lastSavedAt ? ' · ' + CLOCK_LABEL : ''));
    $('#footer-context').textContent = 'Synthetic records · fixed clock ' + CLOCK_LABEL
      + ' · preview role ' + M.role(ui.role).label + ' · Proposed elements are labelled';

    const main = $('#content');
    main.replaceChildren();
    const nodes = ui.mode === 'denied' && ui.view !== 'history'
      ? [stateBlock('denied')]
      : VIEW_FN[ui.view]();
    for (const n of [].concat(nodes)) if (n) main.appendChild(n);

    if (activeId) {
      const again = document.getElementById(activeId);
      if (again) {
        again.focus();
        if (selStart !== null && again.setSelectionRange) {
          try { again.setSelectionRange(selStart, selStart); } catch { /* not a text input */ }
        }
      }
    }
  }

  /* ------------------------------------------------------------------ wiring */

  document.addEventListener('click', e => {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    if (action === 'options') optionsDialog();
    else if (action === 'guide') guideDialog();
    else if (action === 'assistant') assistantDialog();
    else if (action === 'closePanel') closePanel();
    else if (action === 'retry') { ui.mode = 'complete'; render(); toast('Re-read the contact population'); }
    else if (action === 'clearFilters') { ui.q = ''; ui.status = ''; ui.queue = null; ui.page = 1; render(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#panel').hidden && !$('#modal').open) closePanel();
  });

  $('#modal-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!modalContext || !modalContext.submit) return;
    /* A refused or failed submission must leave the record collection exactly as it was.
       The submit handlers mutate state before the save is attempted, so the whole
       collection is snapshotted and restored on any error. Entered values are untouched
       because they live in the form, not in state. */
    const snapshot = JSON.stringify(state);
    try {
      modalContext.submit(e.target.elements);
      if ($('#modal').open) closeModal();
      render();
    } catch (err) {
      state = JSON.parse(snapshot);
      modalError(err.message);
      render(true);
    }
  });

  for (const node of document.querySelectorAll('#modal [data-close]')) {
    node.addEventListener('click', () => {
      if (modalDirty && !root.confirm('Discard what you have entered?')) return;
      closeModal();
    });
  }
  $('#modal').addEventListener('cancel', e => {
    if (modalDirty && !root.confirm('Discard what you have entered?')) { e.preventDefault(); return; }
    modalContext = null;
    modalDirty = false;
  });
  $('#modal').addEventListener('close', () => { if (lastFocus && lastFocus.isConnected) lastFocus.focus(); });

  /* A competing tab writing the same key is a conflict, not a silent overwrite. */
  $('.skip').addEventListener('click', () => {
    /* After the default fragment navigation, not instead of it. */
    setTimeout(() => $('#content').focus(), 0);
  });

  root.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    ui.conflict = true;
    render();
  });

  /* ------------------------------------------------------------------ start */

  paintIcons();
  const restored = readStorage();
  if (restored) state = restored;
  render();

  /* Test surface for scripts/check-contacts-browser.mjs. Reads only. */
  root.CS_DEMO = {
    state: () => JSON.parse(JSON.stringify(state)),
    ui: () => JSON.parse(JSON.stringify(ui)),
    clock: CLOCK,
    key: KEY
  };
})(globalThis, document);
