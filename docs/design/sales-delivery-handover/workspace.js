/* CR-03 Sales-to-Delivery Handover — workspace interaction layer.
   Six views, filters, snapshots, decisions, comparison and local recovery.
   Preview roles are presentation only and are not authentication. */
(function () {
  'use strict';
  const M = globalThis.HANDOVER_MODEL;
  const KEY = 'ppo-cr03-handover-r01';
  const VIEWS = [
    {id: 'register', label: 'Handover register'},
    {id: 'basis', label: 'Accepted commercial basis'},
    {id: 'destination', label: 'Delivery destination'},
    {id: 'readiness', label: 'Readiness review'},
    {id: 'decision', label: 'Receiving decision'},
    {id: 'history', label: 'History & follow-through'},
  ];
  const SAVED_VIEWS = [
    {id: 'all', label: 'All handovers'},
    {id: 'mine', label: 'My handovers'},
    {id: 'preparation', label: 'Awaiting preparation'},
    {id: 'review', label: 'Awaiting receiving review'},
    {id: 'returned', label: 'Returned for clarification'},
    {id: 'followthrough', label: 'Accepted with outstanding follow-through'},
  ];
  const ICONS = {
    help: 'M12 17h.01M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.2-1.3 2.1v.2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.1-1.2l-.3-2.5h-4l-.3 2.5a8 8 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5a8 8 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2.1 1.2l.3 2.5h4l.3-2.5a8 8 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
    close: 'M6 6l12 12M18 6L6 18',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-5-5',
    open: 'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    check: 'M20 6 9 17l-5-5',
    alert: 'M12 9v4m0 4h.01M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
    back: 'M19 12H5m7-7-7 7 7 7',
  };
  const el = (tag, props, children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k === 'on') for (const [evt, fn] of Object.entries(v)) node.addEventListener(evt, fn);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const child of [].concat(children || [])) if (child) node.append(child);
    return node;
  };
  const icon = (name) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ICONS[name] || ICONS.help); svg.append(path); return svg;
  };
  const dateText = (iso) => {
    if (!iso) return 'Not recorded';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00+10:00' : iso);
    return d.toLocaleDateString('en-AU', {day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne'});
  };
  const shortDate = (iso) => iso ? new Date(iso.length === 10 ? iso + 'T00:00:00+10:00' : iso)
    .toLocaleDateString('en-AU', {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Australia/Melbourne'}) : 'Not recorded';

  /* ------------------------------------------------------------- session */
  const ui = {
    view: 'register', savedView: 'all', selected: 'ho-1', role: 'sales',
    search: '', filters: {owner: '', destination: '', customer: '', site: '', state: '', due: ''},
    source: 'complete', nextSave: 'ok', compareFrom: '', compareTo: '',
    pending: null, damaged: null, storage: true, lastOp: null, banner: null,
  };
  let state = null;
  let modalContext = null;

  const RESTRICTED = {viewer: ['ho-4']};
  const permitted = (s) => s.handovers.filter((h) => !(RESTRICTED[ui.role] || []).includes(h.id));
  const restrictedCount = (s) => s.handovers.length - permitted(s).length;
  const commercialVisible = () => M.can(ui.role, 'commercial.read');
  const amountNode = (cents) => commercialVisible()
    ? el('span', {class: 'money', text: M.money(cents)})
    : el('span', {class: 'restricted-value', title: 'Commercial amounts are not available to this identity'}, ['Restricted']);

  const selected = () => permitted(state).find((h) => h.id === ui.selected) || permitted(state)[0] || null;

  /* ------------------------------------------------------------ storage */
  function save() {
    if (!ui.storage) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({schema: M.SCHEMA, savedAt: new Date().toISOString(), state}));
      setStatus('Saved in this browser · ' + new Date().toLocaleTimeString('en-AU', {hour: '2-digit', minute: '2-digit'}));
    } catch {
      ui.storage = false;
      setStatus('Browser storage unavailable — records are held in this page only', true);
    }
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch { ui.storage = false; }
    if (!raw) { state = M.seed(); return; }
    try {
      const envelope = JSON.parse(raw);
      state = M.validate(envelope.state);
      setStatus('Restored from this browser');
    } catch (error) {
      ui.damaged = {raw, message: error.message};
      state = M.seed();
    }
  }
  function setStatus(text, warn) {
    const node = document.getElementById('save-status');
    if (!node) return;
    node.textContent = text;
    node.style.color = warn ? 'var(--warning)' : 'var(--success)';
  }

  /* ------------------------------------------------------------ commands */
  let counter = 0;
  function run(type, payload, options) {
    const h = selected();
    const opts = options || {};
    const op = opts.op || (type + '-' + (++counter) + '-' + Date.now());
    if (ui.nextSave === 'fail' && !opts.recovery) {
      ui.nextSave = 'ok';
      throw new Error('This record could not be saved. Nothing was changed; your entries are retained.');
    }
    const result = M.command(state, {op, type, payload, handoverId: h.id, expectedVersion: opts.expectedVersion ?? state.version}, ui.role);
    if (ui.nextSave === 'unknown' && !opts.recovery) {
      ui.nextSave = 'ok';
      ui.pending = {op, type, payload, handoverId: h.id, expectedVersion: opts.expectedVersion ?? state.version, at: new Date().toISOString(), label: opts.label || type};
      state = result.state;
      save();
      ui.banner = {kind: 'unknown', text: 'The response to “' + (opts.label || type) + '” was lost. Recover the original operation before starting another consequential action.'};
      render();
      return result;
    }
    state = result.state;
    ui.lastOp = {op, type, recovered: result.recovered};
    save();
    return result;
  }
  function recoverPending() {
    if (!ui.pending) return;
    const p = ui.pending;
    const result = M.command(state, {op: p.op, type: p.type, payload: p.payload, handoverId: p.handoverId, expectedVersion: p.expectedVersion}, ui.role);
    ui.pending = null;
    ui.banner = {kind: 'recovered', text: result.recovered
      ? 'The original operation was recovered. Its recorded result is unchanged and no second record was created.'
      : 'No original operation was found for that identity; nothing was recovered.'};
    state = result.state;
    save();
    render();
  }

  /* -------------------------------------------------------------- modal */
  function openModal(config) {
    modalContext = config;
    const dialog = document.getElementById('modal');
    document.getElementById('modal-kicker').textContent = config.kicker || 'Sales-to-Delivery Handover';
    document.getElementById('modal-title').textContent = config.title;
    const body = document.getElementById('modal-body');
    body.replaceChildren(...[].concat(config.body || []));
    const error = document.getElementById('modal-error');
    error.hidden = true; error.textContent = '';
    const submit = document.getElementById('modal-submit');
    submit.textContent = config.submitLabel || 'Save';
    submit.hidden = !config.onSubmit;
    document.getElementById('cancel-button').textContent = config.cancelLabel || (config.onSubmit ? 'Cancel' : 'Close');
    dialog.classList.toggle('drawer', Boolean(config.drawer));
    if (!dialog.open) dialog.showModal();
    const focusable = body.querySelector('input,select,textarea,button,a[href]');
    if (focusable) focusable.focus();
  }
  function closeModal() {
    const dialog = document.getElementById('modal');
    if (dialog.open) dialog.close();
    modalContext = null;
  }
  function modalError(message) {
    const error = document.getElementById('modal-error');
    error.textContent = message; error.hidden = false; error.focus();
  }
  function toast(message) {
    const node = document.getElementById('toast');
    node.textContent = message; node.hidden = false;
    clearTimeout(node.dataset.timer);
    node.dataset.timer = setTimeout(() => { node.hidden = true; }, 5200);
  }

  const field = (label, control, hint) => el('div', {class: 'field'}, [
    el('label', {}, [el('span', {text: label}), control]),
    hint ? el('p', {class: 'tiny', style: 'margin-top:6px', text: hint}) : null,
  ]);
  const input = (name, attrs) => el('input', Object.assign({name, type: 'text'}, attrs || {}));
  /* A textarea carries its value as text content, not as an attribute. */
  const textarea = (name, attrs) => {
    const {value: initial, ...rest} = attrs || {};
    const node = el('textarea', Object.assign({name, rows: 3}, rest));
    if (initial) node.textContent = initial;
    return node;
  };
  const select = (name, options, value) => el('select', {name},
    options.map((o) => el('option', {value: o.value ?? o, selected: (o.value ?? o) === value}, [o.label ?? o])));
  const checkbox = (name, label) => el('label', {class: 'check-label'}, [el('input', {type: 'checkbox', name}), el('span', {text: label})]);
  const value = (name) => {
    const node = document.querySelector('#modal-form [name="' + name + '"]');
    if (!node) return '';
    return node.type === 'checkbox' ? node.checked : node.value;
  };

  /* ---------------------------------------------------------- snapshots */
  const SNAPSHOTS = {
    customer: (h) => ({title: 'Customer 360 · ' + h.customer.name, kicker: 'Customers, Sites & Growing Areas (CS-01/CS-02)', rows: [
      ['Organisation', h.customer.name + ' · ' + h.customer.ref],
      ['ABN', h.customer.abn],
      ['Primary contact', h.customer.contact + ' · ' + h.customer.position],
      ['Site operator', h.customer.operator],
      ['Site owner', h.customer.owner],
      ['Bill payer', h.customer.billTo],
      ['ERP account (intended authority: MYOB Acumatica)', h.customer.erpAccount],
      ['Provider entity', h.destination.entity],
      ['Site', h.site.name + ' · ' + h.site.ref],
      ['Address', h.site.address],
      ['Site timezone', h.site.timezone],
      ['Facilities and growing areas in scope', h.areas.map((a) => a.name + ' (' + a.ref + ')').join('; ') || 'None recorded'],
    ], note: 'Operator, owner and bill payer are separate meanings. Neither hierarchy nor relationship grants billing or site-access authority.'}),
    equipment: (h) => ({title: 'Equipment & Installed Base', kicker: 'Equipment r02 receiving boundary', rows: h.equipment.length
      ? h.equipment.flatMap((e) => [
        ['Asset', e.name + ' · ' + e.ref],
        ['Asset UUID', e.uuid],
        ['Installed location', e.location],
        ['Served areas', e.serves.join(', ')],
      ])
      : [['Equipment', 'No installed equipment is affected by this accepted scope.']],
      note: 'Installation location and served relationships are distinct. A served relationship is not an irrigation control group and proves no hydraulic capacity.'}),
    opportunity: (h) => ({title: 'Opportunity · ' + h.opportunity.ref, kicker: 'CRM five-stage pipeline', rows: [
      ['Title', h.opportunity.title],
      ['Outcome', 'Won · recorded ' + dateText(h.opportunity.wonAt)],
      ['Opportunity version at Won', 'v' + h.opportunity.opportunityVersion],
      ['Outcome event', h.opportunity.outcomeEventId],
      ['Acceptance note on the Won event', h.opportunity.acceptanceEvidenceNote],
      ['Closing owner', h.opportunity.ownerAtWon],
      ['Handover due record', h.opportunity.handoverDue.status + ' · created ' + dateText(h.opportunity.handoverDue.createdAt) + ' · owner ' + h.opportunity.handoverDue.owner],
      ['Implemented source', h.opportunity.handoverDue.source],
      ['Ownership transfers', h.opportunity.ownershipTransfers.length
        ? h.opportunity.ownershipTransfers.map((t) => t.from + ' → ' + t.to + ' on ' + shortDate(t.at) + ' · ' + t.reason).join(' | ')
        : 'None recorded'],
    ], note: h.opportunity.ownershipTransfers.length
      ? h.opportunity.ownershipTransfers[0].note
      : 'Opportunity ownership transfer changes who pursues the sale. It is a different event from delivery handover and neither confirms a receiving owner nor completes the handover obligation.'}),
    quotation: (h) => ({title: 'Accepted quotation issue', kicker: 'Quotation lifecycle ES-05 / ES-06', rows: [
      ['Quotation', h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0')],
      ['Issue state', h.commercial.quotation.state],
      ['Issued', dateText(h.commercial.quotation.issuedAt)],
      ['Valid until', dateText(h.commercial.quotation.validUntil)],
      ['Supersedes', h.commercial.quotation.supersedes || 'Nothing'],
      ['Issued document hash', h.commercial.quotation.documentHash],
      ['Customer acceptance', h.commercial.acceptance.state + (h.commercial.acceptance.at ? ' · ' + dateText(h.commercial.acceptance.at) + ' · ' + h.commercial.acceptance.by : '')],
      ['Acceptance channel', h.commercial.acceptance.channel],
      ['Acceptance evidence', h.commercial.acceptance.evidenceRef || 'None bound to an issue'],
    ], note: h.commercial.acceptance.note || 'Approval, issue, sent, delivered and acknowledged are distinct. Changed content requires a new revision and does not inherit an earlier acceptance.'}),
    conversion: (h) => ({title: 'Item resolution and conversion', kicker: 'ES-07 · conversion outcomes', rows: [
      ['Conversion operation', h.conversion.operationId || 'Not prepared'],
      ['Outcome', h.conversion.status],
      ['Order key', h.conversion.orderKey || 'None'],
      ['Provider entity', h.conversion.entity],
      ...h.conversion.targets.map((t) => ['Target ' + t.id, t.label + ' · ' + t.status + (t.externalKey ? ' · ' + t.externalKey : ' · no confirmed identity')]),
    ], note: 'ES-07 owns item resolution, conversion and reconciliation. This workspace reports the outcome; it creates no second conversion and offers no retry.'}),
    destination: (h) => ({title: 'Receiving record', kicker: h.destination.receivingTeam, rows: [
      ['Destination type', h.destination.type || 'Routing decision required'],
      ['Receiving record', h.destination.record.ref || h.destination.record.label],
      ['Record version', h.destination.record.ref ? 'v' + h.destination.record.version : 'Not allocated'],
      ['Receiving owner', h.destination.receivingOwner],
      ['Receiving team', h.destination.receivingTeam],
      ['Delivery location', h.destination.deliveryLocation],
      ['Availability', h.destination.available ? 'Available' : 'Unavailable · ' + h.destination.unavailableReason],
    ], note: 'A receiving record reference is not work authorisation, a confirmed booking or dispatch readiness.'}),
  };
  function openSnapshot(kind) {
    const h = selected();
    const snap = SNAPSHOTS[kind](h);
    openModal({
      kicker: snap.kicker, title: snap.title, drawer: true, cancelLabel: 'Close',
      body: [
        el('dl', {class: 'facts'}, snap.rows.flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
        el('div', {class: 'note neutral', style: 'margin-top:16px', text: snap.note}),
        el('p', {class: 'tiny', style: 'margin-top:12px', text: 'Synthetic snapshot taken from the selected record at ' + shortDate(M.TODAY) + '. It is a read of this demonstration session, not a live source.'}),
      ],
    });
  }

  /* ----------------------------------------------------------- register */
  function matches(h) {
    const f = ui.filters;
    const s = M.status(h);
    const text = [h.ref, h.opportunity.ref, h.opportunity.title, h.customer.name, h.site.name,
      h.destination.type || '', h.destination.receivingOwner, h.commercial.quotation.ref,
      ...h.areas.map((a) => a.name)].join(' ').toLowerCase();
    if (ui.search && !text.includes(ui.search.toLowerCase())) return false;
    if (f.owner && ![h.opportunity.ownerAtWon, h.destination.receivingOwner].includes(f.owner)) return false;
    if (f.destination && (h.destination.type || 'Routing decision required') !== f.destination) return false;
    if (f.customer && h.customer.name !== f.customer) return false;
    if (f.site && h.site.name !== f.site) return false;
    if (f.state && s !== f.state) return false;
    if (f.due) {
      const rev = M.currentSubmission(h);
      const due = rev ? rev.requiredResponseBy : null;
      if (f.due === 'none' && due) return false;
      if (f.due === 'overdue' && !(due && due < M.TODAY)) return false;
      if (f.due === 'today' && due !== M.TODAY) return false;
      if (f.due === 'week' && !(due && due >= M.TODAY && due <= '2026-09-23')) return false;
    }
    if (ui.savedView === 'mine' && ![h.opportunity.ownerAtWon, h.destination.receivingOwner].includes(M.ROLES[ui.role].person)) return false;
    if (ui.savedView === 'preparation' && s !== 'Awaiting preparation') return false;
    if (ui.savedView === 'review' && s !== 'Awaiting receiving review') return false;
    if (ui.savedView === 'returned' && s !== 'Returned for clarification') return false;
    if (ui.savedView === 'followthrough' && s !== 'Accepted — follow-through outstanding') return false;
    return true;
  }

  function stateTag(s) {
    const tone = s === 'Accepted — complete' ? 'success'
      : s === 'Accepted — follow-through outstanding' ? 'info'
      : s === 'Returned for clarification' ? 'warning'
      : s === 'Renewed acceptance required' ? 'danger' : '';
    return el('span', {class: 'tag ' + tone, text: s});
  }

  function registerView() {
    const all = permitted(state);
    if (ui.source === 'loading') {
      return el('div', {class: 'empty'}, [
        el('h2', {text: 'Loading the handover register'}),
        el('p', {text: 'The register has not finished loading. Counts and filters are withheld until the complete permitted set is available, so a partial list is never presented as the whole queue.'}),
      ]);
    }
    const rows = all.filter(matches);
    const counts = {
      preparation: all.filter((h) => M.status(h) === 'Awaiting preparation').length,
      review: all.filter((h) => M.status(h) === 'Awaiting receiving review').length,
      returned: all.filter((h) => M.status(h) === 'Returned for clarification').length,
      followthrough: all.filter((h) => M.status(h) === 'Accepted — follow-through outstanding').length,
    };
    const snapshot = el('div', {class: 'snapshot', role: 'group', 'aria-label': 'Handover summary'}, [
      ['preparation', 'Awaiting preparation', counts.preparation, 'Sender-owned gaps'],
      ['review', 'Awaiting receiving review', counts.review, 'Receiving decision due'],
      ['returned', 'Returned for clarification', counts.returned, 'Sender response due'],
      ['followthrough', 'Accepted with follow-through', counts.followthrough, 'Obligations or release prerequisites open'],
    ].map(([id, label, n, hint]) => el('button', {
      type: 'button', 'aria-pressed': ui.savedView === id, dataset: {action: 'savedView', view: id},
    }, [el('strong', {text: String(n)}), el('span', {text: label}), el('small', {text: hint})])));

    const owners = [...new Set(all.flatMap((h) => [h.opportunity.ownerAtWon, h.destination.receivingOwner]))].sort();
    const customers = [...new Set(all.map((h) => h.customer.name))].sort();
    const sites = [...new Set(all.map((h) => h.site.name))].sort();
    const toolbar = el('div', {class: 'toolbar'}, [
      el('div', {class: 'search'}, [icon('search'), el('label', {class: 'skip', for: 'search-input', text: 'Search handovers'}),
        el('input', {id: 'search-input', type: 'search', placeholder: 'Search handovers', 'aria-label': 'Search handovers', value: ui.search, dataset: {action: 'search'}})]),
      labelled('Owner', select('filter-owner', [{value: '', label: 'Any owner'}, ...owners.map((o) => ({value: o, label: o}))], ui.filters.owner), 'owner'),
      labelled('Destination', select('filter-destination', [{value: '', label: 'Any destination'}, ...M.DESTINATIONS.map((d) => ({value: d, label: d})), {value: 'Routing decision required', label: 'Routing decision required'}], ui.filters.destination), 'destination'),
      labelled('Customer', select('filter-customer', [{value: '', label: 'Any customer'}, ...customers.map((c) => ({value: c, label: c}))], ui.filters.customer), 'customer'),
      labelled('Site', select('filter-site', [{value: '', label: 'Any site'}, ...sites.map((c) => ({value: c, label: c}))], ui.filters.site), 'site'),
      labelled('State', select('filter-state', [{value: '', label: 'Any state'}, ...M.STATES.map((s) => ({value: s, label: s}))], ui.filters.state), 'state'),
      labelled('Response due', select('filter-due', [
        {value: '', label: 'Any date'}, {value: 'overdue', label: 'Overdue'}, {value: 'today', label: 'Due today'},
        {value: 'week', label: 'Due within seven days'}, {value: 'none', label: 'No response date recorded'},
      ], ui.filters.due), 'due'),
      el('button', {type: 'button', dataset: {action: 'clear'}, class: 'small-button'}, ['Clear filters']),
    ]);

    const table = el('table', {class: 'queue-table'}, [
      el('thead', {}, [el('tr', {}, ['Handover & opportunity', 'Customer, site and areas', 'Destination & receiving owner', 'Accepted basis', 'State', 'Submitted / response due', 'Blockers and owned gaps', 'Next action & owner', 'Conversion', 'Last activity']
        .map((h) => el('th', {scope: 'col', text: h})))]),
      el('tbody', {}, rows.map((h) => {
        const s = M.status(h);
        const rev = M.currentSubmission(h) || M.latestRevision(h);
        const gaps = M.informationGaps(h);
        const blockers = s.startsWith('Accepted') ? M.releasePrerequisites(h).map((x) => x.title) : M.acceptanceBlockers(h);
        const next = M.nextAction(h);
        const last = h.history.at(-1);
        return el('tr', {
          class: h.id === ui.selected ? 'selected-row' : '', tabindex: '0', role: 'button',
          dataset: {action: 'select', id: h.id},
          'aria-label': 'Open handover ' + h.ref + ' for ' + h.customer.name,
        }, [
          el('td', {dataset: {label: 'Handover'}}, [
            el('span', {class: 'record-title', text: h.ref}),
            el('span', {class: 'record-ref', text: h.opportunity.ref + ' · ' + h.opportunity.title}),
          ]),
          el('td', {dataset: {label: 'Customer'}}, [
            el('span', {text: h.customer.name}),
            el('span', {class: 'record-ref', text: h.site.name}),
            el('span', {class: 'record-ref', text: h.areas.map((a) => a.name).join(', ') || 'No area recorded'}),
          ]),
          el('td', {dataset: {label: 'Destination'}}, [
            el('span', {text: h.destination.type || 'Routing decision required'}),
            el('span', {class: 'record-ref', text: h.destination.receivingOwner + ' · ' + h.destination.receivingTeam}),
          ]),
          el('td', {dataset: {label: 'Accepted basis'}}, [
            el('span', {text: h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0')}),
            el('span', {class: 'record-ref'}, [amountNode(h.commercial.totals.exGstCents), ' ex GST']),
            el('span', {class: 'record-ref', text: 'Acceptance ' + h.commercial.acceptance.state.toLowerCase()}),
          ]),
          el('td', {dataset: {label: 'State'}}, [stateTag(s)]),
          el('td', {dataset: {label: 'Dates'}}, [
            el('span', {text: rev ? rev.rev + ' · ' + shortDate(rev.submittedAt) : 'Not submitted'}),
            el('span', {class: 'record-ref', text: rev && rev.state === 'Submitted' ? 'Response due ' + shortDate(rev.requiredResponseBy) : 'No response date recorded'}),
          ]),
          el('td', {dataset: {label: 'Blockers'}}, [
            el('span', {text: blockers.length ? blockers.length + ' outstanding' : 'None'}),
            gaps.length ? el('span', {class: 'record-ref', text: gaps.length + ' owned information gap(s)'}) : null,
            blockers[0] ? el('p', {class: 'next-action', text: blockers[0]}) : null,
          ]),
          el('td', {dataset: {label: 'Next action'}}, [
            el('p', {class: 'next-action', text: next.text}),
            el('span', {class: 'record-ref', text: next.owner}),
          ]),
          el('td', {dataset: {label: 'Conversion'}}, [
            el('span', {text: h.conversion.status}),
            el('span', {class: 'record-ref', text: h.conversion.orderKey || 'No order identity'}),
          ]),
          el('td', {dataset: {label: 'Last activity'}}, [
            el('span', {text: last ? shortDate(last.at) : 'None'}),
            el('span', {class: 'record-ref', text: last ? last.kind : '—'}),
            el('span', {class: 'record-ref', text: 'Source read ' + shortDate(M.TODAY)}),
          ]),
        ]);
      })),
    ]);

    const outside = all.length - rows.length;
    const parts = [
      el('div', {class: 'views'}, SAVED_VIEWS.map((v) => el('button', {type: 'button', 'aria-pressed': ui.savedView === v.id, dataset: {action: 'savedView', view: v.id}}, [v.label]))),
      snapshot, toolbar,
      el('p', {class: 'count-line', text: 'Showing ' + rows.length + ' of ' + all.length + ' permitted handover(s)'
        + (outside ? ' · ' + outside + ' outside the current view and filters' : '')
        + (restrictedCount(state) ? ' · ' + restrictedCount(state) + ' record(s) are not available to this identity and are excluded from every count, search and snapshot' : '')
        + (ui.source === 'partial' ? ' · one source could not be read' : '')}),
    ];
    if (ui.source === 'partial') parts.push(el('div', {class: 'note warning', style: 'margin:0 18px 16px'}, [
      'The Supply Chain source could not be read for this register. Material and lead-time evidence is shown as unavailable rather than as satisfied or absent. Unavailable and missing are different findings.']));
    parts.push(rows.length ? table : el('div', {class: 'empty'}, [
      el('h2', {text: 'No handover matches this view'}),
      el('p', {text: 'No permitted record matches the current saved view, search and filters. This is an empty result, not an unavailable source or a restricted record.'}),
      el('button', {type: 'button', class: 'primary', dataset: {action: 'clear'}}, ['Clear filters']),
    ]));
    return el('div', {class: 'card'}, parts);
  }
  const labelled = (label, control) => el('label', {class: 'tiny'}, [el('span', {text: label}), control]);

  /* --------------------------------------------------------------- basis */
  function basisView(h) {
    const q = h.commercial.quotation;
    const accepted = h.commercial.acceptance;
    const tone = accepted.state === 'Recorded' ? 'success' : accepted.state === 'Superseded' ? 'warning' : 'danger';
    const lines = el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', {scope: 'col', text: 'Accepted line'}), el('th', {scope: 'col', text: 'Section'}),
        el('th', {scope: 'col', text: 'Accepted quantity'}), el('th', {scope: 'col', class: 'amount-cell', text: 'Accepted amount (ex GST)'})])]),
      el('tbody', {}, [
        ...h.commercial.lines.map((l) => el('tr', {}, [
          el('td', {dataset: {label: 'Line'}}, [el('span', {class: 'record-title', text: l.id + ' · ' + l.description}), el('span', {class: 'record-ref', text: l.detail})]),
          el('td', {dataset: {label: 'Section'}, text: l.section}),
          el('td', {dataset: {label: 'Quantity'}, text: l.quantity + ' ' + l.unit}),
          el('td', {dataset: {label: 'Amount'}, class: 'amount-cell'}, [amountNode(l.amountCents)]),
        ])),
        ...h.commercial.selections.map((s) => el('tr', {}, [
          el('td', {dataset: {label: 'Selection'}}, [
            el('span', {class: 'record-title', text: s.offer}),
            el('span', {class: 'record-ref', text: s.label + ' — ' + (s.included ? 'selected by the customer' : 'offered and not selected')}),
            el('span', {class: 'record-ref', text: s.note}),
          ]),
          el('td', {dataset: {label: 'Section'}, text: 'Selection envelope'}),
          el('td', {dataset: {label: 'Quantity'}, text: s.included ? 'Included' : 'Not selected'}),
          el('td', {dataset: {label: 'Amount'}, class: 'amount-cell'}, [s.included ? amountNode(s.deltaCents) : el('span', {class: 'muted', text: '—'})]),
        ])),
        h.commercial.discount.amountCents ? el('tr', {}, [
          el('td', {dataset: {label: 'Discount'}}, [el('span', {class: 'record-title', text: h.commercial.discount.label})]),
          el('td', {dataset: {label: 'Section'}, text: 'Accepted basis'}),
          el('td', {dataset: {label: 'Quantity'}, text: '1'}),
          el('td', {dataset: {label: 'Amount'}, class: 'amount-cell'}, [commercialVisible() ? el('span', {class: 'money', text: '−' + M.money(h.commercial.discount.amountCents)}) : amountNode(0)]),
        ]) : null,
      ].filter(Boolean)),
    ]);
    const totals = el('div', {class: 'totals'}, [
      el('span', {text: 'Accepted total, excluding GST'}), amountNode(h.commercial.totals.exGstCents),
      el('span', {text: 'GST (10%)'}), amountNode(h.commercial.totals.gstCents),
      el('span', {class: 'grand', text: 'Accepted total, including GST'}), el('span', {class: 'grand'}, [amountNode(h.commercial.totals.inclGstCents)]),
    ]);
    return el('div', {class: 'columns'}, [
      el('div', {class: 'stack'}, [
        el('div', {class: 'basis-lock'}, [icon('check'), 'Immutable within this workspace. Preparation notes and receiving findings are recorded separately and never alter the accepted basis.']),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [
            el('div', {}, [el('h2', {text: 'Accepted quotation ' + q.ref + ' R' + String(q.revision).padStart(2, '0')}),
              el('p', {text: q.state + ' · issued ' + dateText(q.issuedAt) + ' · valid until ' + dateText(q.validUntil)})]),
            el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'quotation'}}, [icon('open'), 'Issue snapshot']),
          ]),
          el('div', {class: 'pad'}, [
            el('div', {class: 'note ' + (tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : ''), style: tone === 'danger' ? 'background:var(--danger-bg);color:var(--danger);border-color:#edc6bd' : ''}, [
              el('strong', {text: 'Customer acceptance: ' + accepted.state}),
              el('p', {text: accepted.state === 'Recorded'
                ? 'Accepted ' + dateText(accepted.at) + ' by ' + accepted.by + ' (' + accepted.position + ') through ' + accepted.channel + '. Evidence ' + accepted.evidenceRef + '.'
                : accepted.channel}),
              accepted.note ? el('p', {text: accepted.note}) : null,
              accepted.supersededNote ? el('p', {text: accepted.supersededNote}) : null,
            ]),
            el('dl', {class: 'facts', style: 'margin-top:16px'}, [
              ['Customer', h.customer.name + ' · ' + h.customer.ref],
              ['Opportunity', h.opportunity.ref + ' · Won ' + shortDate(h.opportunity.wonAt) + ' · v' + h.opportunity.opportunityVersion],
              ['Customer purchase order', h.commercial.customerPo ? h.commercial.customerPo.ref + ' · received ' + shortDate(h.commercial.customerPo.receivedAt) : 'Not supplied'],
              ['Currency and tax basis', h.commercial.currency + ' · ' + h.commercial.taxBasis],
              ['Supersedes', q.supersedes || 'Nothing'],
              ['Issued document hash', q.documentHash],
            ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
          ]),
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Accepted lines, selections and amounts'}),
            el('p', {text: 'Amounts are the accepted amounts. This workspace does not recompute, reprice or apportion them.'})])]),
          lines, totals,
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Scope, inclusions, exclusions and deliverables'})])]),
          el('div', {class: 'pad'}, [
            section('Inclusions', h.commercial.scope.inclusions),
            section('Exclusions', h.commercial.scope.exclusions),
            section('Deliverables', h.commercial.scope.deliverables),
          ]),
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Dates, commitments and recorded expectations'}),
            el('p', {text: 'A customer-requested date, a quoted assumption and a confirmed commitment are three different facts. None of them is a delivery promise made by this workspace.'})])]),
          el('div', {}, h.commercial.commitments.map((c) => el('div', {class: 'item-row'}, [
            el('div', {class: 'row between'}, [el('span', {class: 'tag ' + (c.kind === 'Confirmed commitment' ? 'success' : c.kind === 'Customer-requested date' ? 'info' : ''), text: c.kind}),
              c.date ? el('span', {class: 'tiny', text: dateText(c.date)}) : el('span', {class: 'tiny', text: 'No date'})]),
            el('p', {text: c.text}),
          ]))),
        ]),
      ]),
      el('div', {class: 'stack'}, [
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Supporting documents'}),
            el('p', {text: 'Exact revisions. A missing document stays missing whatever a checklist records.'})])]),
          el('div', {}, h.commercial.documents.map((d) => el('div', {class: 'source-row'}, [
            el('div', {class: 'row between'}, [el('span', {class: 'record-title', text: d.ref + ' ' + d.revision}),
              el('span', {class: 'tag ' + (d.state === 'Available' ? 'success' : d.state === 'Missing' ? 'danger' : d.state === 'Restricted' ? 'info' : 'warning'), text: d.state})]),
            el('p', {text: d.title}),
            el('div', {class: 'kv-inline'}, [
              el('span', {text: 'Owner: ' + d.owner}),
              el('span', {text: d.hash ? 'Hash ' + d.hash : 'No retained bytes'}),
              d.suppliedFrom ? el('span', {text: 'Referenced from ' + d.suppliedFrom + '; the bytes remain with the owning workspace'}) : null,
            ]),
            d.state === 'Missing' ? el('div', {class: 'source-actions'}, [
              el('button', {type: 'button', class: 'small-button', dataset: {action: 'attach', ref: d.ref},
                disabled: !M.can(ui.role, 'handover.prepare')}, ['Record it as supplied']),
            ]) : null,
          ]))),
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Clarifications and outstanding commitments'})])]),
          h.commercial.clarifications.length
            ? el('div', {}, h.commercial.clarifications.map((c) => el('div', {class: 'source-row'}, [
              el('p', {style: 'color:var(--ink);margin:0', text: c.text}),
              el('div', {class: 'kv-inline'}, [el('span', {text: 'Owner: ' + c.owner}), el('span', {text: c.status})]),
            ])))
            : el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No clarification is outstanding against the accepted basis.'})]),
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Need a commercial change?'})])]),
          el('div', {class: 'pad'}, [
            el('p', {class: 'small', text: 'Scope, price and terms changes belong to the quotation lifecycle. This workspace cannot amend an accepted basis; it records that a revision is required and who owns it.'}),
            el('div', {class: 'source-actions'}, [
              el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'quotation'}}, ['Open issue snapshot']),
              el('button', {type: 'button', class: 'small-button', dataset: {action: 'action', preset: 'commercial'}}, ['Record an owned commercial-revision request']),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
  const section = (label, items) => el('div', {}, [
    el('p', {class: 'section-label', text: label}),
    el('ul', {class: 'blockers'}, items.map((i) => el('li', {text: i}))),
  ]);

  /* --------------------------------------------------------- destination */
  function destinationView(h) {
    const d = h.destination;
    const routed = d.decision === 'Routed';
    const allocation = el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', {scope: 'col', text: 'Accepted line'}), el('th', {scope: 'col', text: 'Allocation'}), el('th', {scope: 'col', class: 'amount-cell', text: 'Amount (ex GST)'})])]),
      el('tbody', {}, [...h.commercial.lines, ...h.commercial.selections.filter((s) => s.included)].map((l) => {
        const on = d.allocation.lineIds.includes(l.id);
        return el('tr', {}, [
          el('td', {dataset: {label: 'Line'}, text: l.id + ' · ' + (l.description || l.offer)}),
          el('td', {dataset: {label: 'Allocation'}}, [el('span', {class: 'tag ' + (on ? 'success' : 'danger'), text: on ? (d.type || 'Allocated') : 'Not allocated'})]),
          el('td', {dataset: {label: 'Amount'}, class: 'amount-cell'}, [amountNode(l.amountCents ?? l.deltaCents)]),
        ]);
      })),
    ]);
    const targets = h.conversion.targets.length ? el('table', {}, [
      el('thead', {}, [el('tr', {}, ['Target', 'Outcome', 'Confirmed identity'].map((t) => el('th', {scope: 'col', text: t})))]),
      el('tbody', {}, h.conversion.targets.map((t) => el('tr', {}, [
        el('td', {dataset: {label: 'Target'}, text: t.id + ' · ' + t.label}),
        el('td', {dataset: {label: 'Outcome'}}, [el('span', {class: 'tag ' + (t.status === 'Confirmed' ? 'success' : t.status === 'FailedNoEffect' ? 'danger' : 'warning'), text: t.status})]),
        el('td', {dataset: {label: 'Identity'}, text: t.externalKey || 'No confirmed identity'}),
      ]))),
    ]) : el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No conversion has been prepared for this accepted scope.'})]);

    return el('div', {class: 'columns'}, [
      el('div', {class: 'stack'}, [
        routed ? el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [
            el('div', {}, [el('h2', {text: d.type + ' destination'}), el('p', {text: d.routingBasis})]),
            el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'destination'}}, [icon('open'), 'Receiving record']),
          ]),
          el('div', {class: 'pad'}, [
            !d.available ? el('div', {class: 'note', style: 'background:var(--danger-bg);color:var(--danger);border-color:#edc6bd;margin-bottom:16px'}, [
              el('strong', {text: 'Receiving record unavailable'}), el('p', {text: d.unavailableReason}),
              el('p', {text: 'Responsibility cannot be accepted against a receiving record that is no longer available. The submitted revision is preserved and the sending owner must route it again.'})]) : null,
            el('dl', {class: 'facts'}, [
              ['Receiving owner', d.receivingOwner],
              ['Receiving team', d.receivingTeam],
              [d.type === 'Service' ? 'Work order' : d.type === 'Project' ? 'Project record' : 'Fulfilment order',
                (d.record.ref || d.record.label) + (d.record.ref ? ' · v' + d.record.version : '')],
              ['Record state', d.record.proposed ? 'Proposed receiving record — no reference is allocated until responsibility is accepted' : d.record.label],
              ['Delivery location', d.deliveryLocation],
              ['Provider entity', d.entity],
              ['ERP account (MYOB Acumatica is the intended authority)', d.erpAccount],
              ['Customer / operator / owner / bill payer', [h.customer.name, h.customer.operator, h.customer.owner, h.customer.billTo].join(' · ')],
            ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
          ]),
          el('div', {class: 'class-band', text: d.type + ' dependencies'}),
          el('div', {}, d.dependencies.length ? d.dependencies.map((dep) => el('div', {class: 'item-row'}, [
            el('div', {class: 'row between'}, [el('span', {class: 'record-title', text: dep.title}),
              el('span', {class: 'tag ' + (dep.state === 'Outstanding' ? 'warning' : 'success'), text: dep.state})]),
            el('p', {text: dep.detail}),
            el('div', {class: 'kv-inline'}, [el('span', {text: 'Owner: ' + dep.owner})]),
          ])) : [el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No dependency is recorded for this destination.'})])]),
        ]) : el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Routing decision required'}),
            el('p', {text: 'No approved source routes this accepted scope to a Project, Service or parts-order destination.'})])]),
          el('div', {class: 'pad'}, [
            el('div', {class: 'note warning'}, [
              el('strong', {text: 'No routing threshold is invented here.'}),
              el('p', {text: 'Numerical routing rules remain unadopted in the estimating decisions. Until an approved source routes this scope, the workspace records the gap and its owner rather than choosing a destination.'}),
            ]),
            el('dl', {class: 'facts', style: 'margin-top:16px'}, [
              ['Routing owner', d.routingOwner],
              ['Unallocated accepted lines', d.allocation.unallocated.join(', ') || 'None'],
              ['Delivery location', d.deliveryLocation],
              ['Provider entity', d.entity],
              ['ERP account', d.erpAccount],
            ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
            el('div', {class: 'source-actions'}, [
              el('button', {type: 'button', class: 'primary small-button', dataset: {action: 'route'}, disabled: !M.can(ui.role, 'handover.prepare') || !d.routable}, ['Record the routing decision']),
              el('button', {type: 'button', class: 'small-button', dataset: {action: 'action', preset: 'routing'}}, ['Create an owned routing action']),
            ]),
            !d.routable ? el('p', {class: 'tiny', style: 'margin-top:10px', text: 'Routing is unavailable in this demonstration until an approved source exists. The owned action above is the recorded next step.'}) : null,
          ]),
        ]),
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [
            el('div', {}, [el('h2', {text: 'Scope allocation'}),
              el('p', {text: 'The allocated subtotal is the scope this destination is receiving. The accepted total is never duplicated across destinations.'})]),
            el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'quotation'}}, ['Accepted basis']),
          ]),
          allocation,
          el('div', {class: 'totals'}, [
            el('span', {text: 'Allocated to this destination, excluding GST'}), amountNode(M.allocatedTotal(h)),
            el('span', {text: 'Accepted total, excluding GST'}), amountNode(h.commercial.totals.exGstCents),
          ]),
          el('div', {class: 'card-foot', text: M.fullyAllocated(h)
            ? 'Every accepted line and selected option is allocated to this one destination, so the accepted discount is applied in full to the allocated subtotal.'
            : 'Not every accepted line is allocated. Splitting one accepted quotation across several destinations — and apportioning an accepted discount between them — is not defined by any approved source. It is recorded as open requirement OQ-03 and this journey stays bounded to one destination.'}),
        ]),
      ]),
      el('div', {class: 'stack'}, [
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [
            el('div', {}, [el('h2', {text: 'ERP conversion outcome'}), el('p', {text: 'Reported from ES-07. Not re-run here.'})]),
            el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'conversion'}}, [icon('open'), 'Snapshot']),
          ]),
          el('div', {class: 'pad'}, [
            el('div', {class: 'row'}, [el('span', {class: 'tag ' + (h.conversion.status === 'Confirmed' ? 'success' : h.conversion.status === 'Not prepared' ? '' : h.conversion.status === 'Failed — no effect' ? 'danger' : 'warning'), text: h.conversion.status})]),
            el('dl', {class: 'facts', style: 'margin-top:14px'}, [
              ['Conversion operation', h.conversion.operationId || 'Not prepared'],
              ['Order identity', h.conversion.orderKey || 'None'],
              ['Prepared', h.conversion.preparedAt ? dateText(h.conversion.preparedAt) : 'Not prepared'],
            ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
          ]),
          targets,
          el('div', {class: 'card-foot'}, [
            (h.conversion.status === 'Confirmed'
              ? 'Every target has a confirmed identity. A confirmed ERP order is still not a completed delivery handover. '
              : h.conversion.status === 'Not prepared'
                ? 'No conversion exists because no accepted source has been resolved. '
                : 'Unresolved outcomes are reconciled in ES-07 under the original conversion operation. ')
            + 'This workspace creates no second conversion, no retry and no compensating effect.',
          ]),
          h.conversion.status !== 'Confirmed' && h.conversion.status !== 'Not prepared' ? el('div', {class: 'pad'}, [
            el('button', {type: 'button', class: 'small-button', dataset: {action: 'action', preset: 'conversion'}}, ['Create an owned reconciliation action']),
          ]) : null,
        ]),
        contextLinksCard(h),
      ]),
    ]);
  }

  /* ----------------------------------------------------------- readiness */
  function readinessView(h) {
    const group = (cls, title, note) => {
      const items = h.requirements.filter((r) => r.class === cls);
      return el('div', {class: 'card'}, [
        el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: title}), el('p', {text: note})])]),
        el('div', {}, items.map((r) => {
          const tone = r.status === 'Received — reviewed' ? 'reviewed' : r.status === 'Not received' ? 'missing'
            : r.status === 'Received — insufficient' ? 'insufficient' : r.status === 'Restricted to this viewer' ? 'restricted' : 'na';
          const unavailable = ui.source === 'partial' && r.source.includes('Supply Chain');
          return el('div', {class: 'source-row'}, [
            el('div', {class: 'row between'}, [
              el('span', {class: 'record-title', text: r.title}),
              el('span', {class: 'req-status ' + (unavailable ? 'restricted' : tone), text: unavailable ? 'Source unavailable' : (r.applicable ? r.status : 'Not applicable')}),
            ]),
            el('p', {text: unavailable
              ? 'The Supply Chain source could not be read. This is an unavailable source, not a missing or satisfied requirement.'
              : (r.finding || 'No review outcome has been recorded against this requirement.')}),
            r.status === 'Not applicable' && r.reason ? el('p', {text: 'Not applicable because: ' + r.reason}) : null,
            el('div', {class: 'source-meta'}, [
              el('span', {text: 'Source: ' + r.source}),
              el('span', {text: 'Owner: ' + r.owner}),
              el('span', {text: 'Reviewed: ' + (r.reviewedAt ? dateText(r.reviewedAt) + ' by ' + r.reviewedBy : 'Not reviewed')}),
              r.sourceRef ? el('span', {text: 'Exact record: ' + r.sourceRef}) : null,
              r.history.length ? el('span', {text: r.history.length + ' earlier outcome(s) retained'}) : null,
            ]),
            el('div', {class: 'source-actions'}, [
              el('button', {type: 'button', class: 'small-button', dataset: {action: 'requirement', id: r.id},
                disabled: !(M.can(ui.role, 'handover.review') || M.can(ui.role, 'handover.prepare'))}, ['Record review outcome']),
              el('button', {type: 'button', class: 'link-button', dataset: {action: 'action', preset: 'requirement', id: r.id}}, ['Create an owned follow-up']),
            ]),
          ]);
        })),
      ]);
    };
    return el('div', {class: 'columns'}, [
      el('div', {class: 'stack'}, [
        el('div', {class: 'note warning'}, [
          el('strong', {text: 'A checklist acknowledgement is not permission.'}),
          el('p', {text: 'Recording a requirement as reviewed establishes that the information was received and assessed. It does not establish site permission, induction completion, work authority, a confirmed booking or dispatch readiness. Those remain decisions of their own workspaces.'}),
        ]),
        group('Acceptance', 'Required before receiving responsibility can be accepted',
          'Each item must be reviewed, or recorded as not applicable with its reason, before a receiving owner may accept responsibility for the reviewed scope.'),
        group('Release', 'May remain open at acceptance — must be satisfied before work release',
          'These prerequisites survive acceptance. They are carried forward as owned obligations and block work authorisation or release, not the transfer of responsibility.'),
      ]),
      el('div', {class: 'stack'}, [
        el('div', {class: 'card'}, [
          el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Applicability rule set'})])]),
          el('div', {class: 'pad'}, [
            el('div', {class: 'note neutral'}, [
              el('strong', {text: 'CR3-RULE-01 — hypothetical demonstration rule set'}),
              el('p', {text: 'Which requirements are mandatory before acceptance, per destination type, is a demonstration rule set for review. It is not corporate policy, approval authority or a spend limit, and no exception mechanism is implied.'}),
            ]),
            el('ul', {class: 'blockers', style: 'margin-top:14px'}, [
              'Project: commercial basis, technical brief, site scope and customer responsibilities before acceptance. Materials, access and document obligations may remain for release.',
              'Service: commercial basis, equipment identity, site scope and customer responsibilities before acceptance. Access constraints, materials and document obligations may remain for release.',
              'Parts order: commercial basis, delivery location, equipment identity and a confirmed or reconciled conversion outcome before acceptance. Stock and access evidence may remain for release.',
            ].map((t) => el('li', {text: t}))),
            el('p', {class: 'tiny', style: 'margin-top:12px', text: 'Documented rules used unchanged: Supply Chain readiness states (Not assessed, Evidence needed, At risk, Blocked, Ready), Service work-order authorisation binding an exact scope revision, scope version and policy version, and CS-06 visit-requirement review, which is source information and not site permission.'}),
          ]),
        ]),
        blockerCard(h),
        contextLinksCard(h),
      ]),
    ]);
  }

  function blockerCard(h) {
    const blockers = M.acceptanceBlockers(h);
    const release = M.releasePrerequisites(h);
    const gaps = M.informationGaps(h);
    return el('div', {class: 'card'}, [
      el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'What is outstanding'})])]),
      el('div', {class: 'pad'}, [
        el('p', {class: 'section-label', style: 'margin-top:0', text: 'Owned information gaps (sending owner)'}),
        gaps.length ? el('ul', {class: 'blockers'}, gaps.map((g) => el('li', {text: g.text + ' — ' + g.owner}))) : el('p', {class: 'small', text: 'None.'}),
        el('p', {class: 'section-label', text: 'Blocking a receiving acceptance'}),
        blockers.length ? el('ul', {class: 'blockers'}, blockers.map((b) => el('li', {text: b}))) : el('p', {class: 'small', text: 'None.'}),
        el('p', {class: 'section-label', text: 'Blocking work release (may remain open at acceptance)'}),
        release.length ? el('ul', {class: 'blockers'}, release.map((r) => el('li', {text: r.title + ' — ' + r.owner + ' · ' + shortDate(r.due) + ' · ' + r.why}))) : el('p', {class: 'small', text: 'None.'}),
      ]),
    ]);
  }

  function contextLinksCard(h) {
    const accepted = M.acceptance(h);
    return el('div', {class: 'card'}, [
      el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Connected records'}), el('p', {text: 'Back to the customer and opportunity; forward to the receiving workspace.'})])]),
      el('div', {class: 'pad'}, [
        el('div', {class: 'source-actions'}, [
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'customer'}}, ['Customer 360']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'opportunity'}}, ['Opportunity']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'equipment'}}, ['Equipment']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'conversion'}}, ['ES-07 conversion']),
        ]),
        el('p', {class: 'tiny', style: 'margin-top:14px', text: accepted
          ? 'Responsibility is accepted, so a receiving link may be prepared locally. A prepared link creates no application record, booking, order or notification.'
          : 'Receiving links become available once responsibility is accepted.'}),
        el('div', {class: 'source-actions'}, ['Project', 'Service', 'Parts order', 'My Work', 'Finance'].map((t) => el('button', {
          type: 'button', class: 'link-button', dataset: {action: 'link', target: t},
          disabled: !accepted || h.links.some((l) => l.target === t),
        }, [h.links.some((l) => l.target === t) ? t + ' link prepared' : 'Prepare ' + t + ' link']))),
      ]),
    ]);
  }

  /* ------------------------------------------------------------ decision */
  function decisionView(h) {
    const submitted = M.currentSubmission(h);
    const accepted = M.acceptance(h);
    const steps = el('div', {class: 'steps'}, [
      ['Prepare', h.revisions.length || h.draft ? 'done' : '', h.draft ? 'Draft ' + h.draft.rev : h.revisions.length ? 'Revision prepared' : 'Not started'],
      ['Submit', submitted || h.revisions.length ? 'done' : '', submitted ? submitted.rev + ' submitted' : h.revisions.length ? M.latestRevision(h).rev + ' · ' + M.latestRevision(h).state.toLowerCase() : 'Not submitted'],
      ['Review', h.reviews.length ? 'done' : '', h.reviews.length ? h.reviews.length + ' decision(s) recorded' : 'No decision'],
      ['Accepted', accepted ? 'done' : '', accepted ? accepted.decision : 'Responsibility not accepted'],
    ].map(([label, cls, detail]) => el('div', {class: cls}, [el('span', {text: label}), el('b', {text: detail}),
      el('span', {text: label === 'Accepted' && accepted ? accepted.by : ''})])));

    const revisionOptions = h.revisions.map((r) => ({value: r.rev, label: r.rev + ' · ' + r.state}));
    const from = ui.compareFrom && h.revisions.some((r) => r.rev === ui.compareFrom) ? ui.compareFrom : (h.revisions[0] ? h.revisions[0].rev : '');
    const to = ui.compareTo && h.revisions.some((r) => r.rev === ui.compareTo) ? ui.compareTo : (h.revisions.at(-1) ? h.revisions.at(-1).rev : '');
    let comparison = null;
    if (h.revisions.length > 1 && from && to && from !== to) {
      const rows = M.compare(h, from, to);
      const changed = rows.filter((r) => r.change !== 'same');
      comparison = el('div', {class: 'card'}, [
        el('div', {class: 'card-head'}, [
          el('div', {}, [el('h2', {text: 'Revision comparison'}), el('p', {text: changed.length + ' field(s) changed between ' + from + ' and ' + to + '. Unchanged fields are hidden.'})]),
          el('div', {class: 'row'}, [
            el('label', {class: 'tiny'}, [el('span', {text: 'From'}), select('compare-from', revisionOptions, from)]),
            el('label', {class: 'tiny'}, [el('span', {text: 'To'}), select('compare-to', revisionOptions, to)]),
          ]),
        ]),
        el('div', {class: 'pad'}, [
          changed.length ? el('div', {class: 'compare'}, [
            el('div', {class: 'head', text: 'Field'}), el('div', {class: 'head', text: from}), el('div', {class: 'head', text: to}),
            ...changed.flatMap((r) => [
              el('div', {text: r.field}),
              el('div', {class: r.change === 'added' ? '' : r.change === 'removed' ? 'removed' : 'changed', text: r.from}),
              el('div', {class: r.change === 'added' ? 'added' : r.change === 'removed' ? '' : 'changed', text: r.to}),
            ]),
          ]) : el('p', {class: 'small', text: 'The two revisions carry identical handover content.'}),
        ]),
      ]);
    }

    const senderActions = el('div', {class: 'form-actions'}, [
      el('div', {class: 'row'}, [
        el('button', {type: 'button', class: 'primary', dataset: {action: 'prepare'}, disabled: !M.can(ui.role, 'handover.prepare') || Boolean(submitted)},
          [h.draft ? 'Update draft ' + h.draft.rev : 'Prepare ' + M.nextRevisionLabel(h)]),
        el('button', {type: 'button', dataset: {action: 'submit'}, disabled: !M.can(ui.role, 'handover.submit') || !h.draft}, ['Submit for receiving review']),
        el('button', {type: 'button', dataset: {action: 'withdraw'}, disabled: !M.can(ui.role, 'handover.withdraw') || !submitted}, ['Withdraw submission']),
      ]),
      el('span', {class: 'tiny', text: 'Sending owner: ' + h.opportunity.ownerAtWon}),
    ]);

    const receivingDisabled = !M.can(ui.role, 'handover.decide') || M.receivesFor(ui.role) !== h.destination.type || !submitted;
    const receivingActions = el('div', {class: 'form-actions'}, [
      el('div', {class: 'row'}, [
        el('button', {type: 'button', class: 'primary', dataset: {action: 'decide'}, disabled: receivingDisabled}, ['Record receiving decision']),
      ]),
      el('span', {class: 'tiny', text: M.receivesFor(ui.role) && M.receivesFor(ui.role) !== h.destination.type
        ? 'This handover is routed to ' + (h.destination.type || 'no destination') + '. Another receiving team cannot decide it.'
        : 'Receiving owner: ' + h.destination.receivingOwner}),
    ]);

    return el('div', {class: 'stack'}, [
      steps,
      el('div', {class: 'columns'}, [
        el('div', {class: 'stack'}, [
          el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [
              el('h2', {text: submitted ? 'Revision ' + submitted.rev + ' under review' : h.draft ? 'Draft ' + h.draft.rev + ' in preparation' : 'No revision awaiting review'}),
              el('p', {text: submitted
                ? 'Submitted ' + dateText(submitted.submittedAt) + ' by ' + submitted.submittedBy + ' · response required by ' + dateText(submitted.requiredResponseBy)
                : h.draft ? h.draft.note : 'Prepare a revision to hand this scope to a receiving owner.'})])]),
            el('div', {class: 'pad'}, [
              el('dl', {class: 'facts'}, [
                ['Sending responsibility', h.opportunity.ownerAtWon + ' · closing owner of ' + h.opportunity.ref],
                ['Receiving responsibility', h.destination.receivingOwner + ' · ' + h.destination.receivingTeam],
                ['Commercial basis', h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0') + ' · ' + h.commercial.acceptance.state],
                ['Destination basis', (h.destination.type || 'Routing decision required') + ' · ' + (h.destination.record.ref || h.destination.record.label)],
                ['Conversion basis', h.conversion.status + (h.conversion.orderKey ? ' · ' + h.conversion.orderKey : '')],
                ['Current source fingerprint', submitted ? (submitted.fingerprint === M.fingerprint(h) ? 'Matches the submitted revision' : 'Differs from the submitted revision — a corrected successor is required') : 'No submitted revision'],
              ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
            ]),
            senderActions, receivingActions,
          ]),
          comparison,
          h.reviews.length ? el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Recorded decisions'}), el('p', {text: 'Each decision stays bound to the exact revision and sources it reviewed.'})])]),
            el('div', {}, h.reviews.slice().reverse().map((r) => el('div', {class: 'source-row'}, [
              el('div', {class: 'row between'}, [
                el('span', {class: 'record-title', text: r.decision + ' · ' + r.rev}),
                el('span', {class: 'tag ' + (r.decision === 'Return for clarification' ? 'warning' : 'success'), text: r.id}),
              ]),
              el('p', {text: r.reason}),
              el('div', {class: 'source-meta'}, [
                el('span', {text: r.by + ' · ' + dateText(r.at)}),
                el('span', {text: 'Bound quotation: ' + r.boundSources.quotation}),
                el('span', {text: 'Bound conversion: ' + r.boundSources.conversion}),
                el('span', {text: 'Bound destination: ' + r.boundSources.destination}),
                el('span', {text: 'Opportunity v' + r.boundSources.opportunityVersion}),
                el('span', {text: r.fingerprint === M.fingerprint(h) ? 'Still applicable to the current source' : 'Source has changed since this decision'}),
              ]),
              r.findings.length ? el('div', {}, [
                el('p', {class: 'section-label', text: 'Returned findings'}),
                el('ul', {class: 'blockers'}, r.findings.map((f) => el('li', {text: f.detail + ' — ' + f.owner + ' by ' + shortDate(f.due)}))),
              ]) : null,
              r.releaseAtAcceptance.length ? el('p', {class: 'tiny', text: 'Release prerequisites still open at this decision: ' + r.releaseAtAcceptance.join('; ') + '. Acceptance did not satisfy them.'}) : null,
            ]))),
          ]) : null,
        ]),
        el('div', {class: 'stack'}, [
          blockerCard(h),
          h.obligations.length ? el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Outstanding obligations'}), el('p', {text: 'Individually visible and owned. Acceptance never clears them.'})])]),
            el('div', {}, h.obligations.map((o) => el('div', {class: 'obligation'}, [
              el('div', {}, [
                el('span', {class: 'record-title', text: o.title}),
                el('p', {text: 'Owner ' + o.owner + ' · due ' + dateText(o.due) + ' · ' + o.source + (o.blocksRelease ? ' · blocks work release' : ' · does not block work release')}),
                o.closedBy ? el('p', {text: 'Completed ' + dateText(o.closedBy.at) + ' by ' + o.closedBy.by + ': ' + o.closedBy.evidence}) : null,
              ]),
              el('div', {class: 'row'}, [
                el('span', {class: 'tag ' + (o.status === 'Closed' ? 'success' : 'warning'), text: o.status}),
                o.status !== 'Closed' ? el('button', {type: 'button', class: 'small-button', dataset: {action: 'obligation', id: o.id},
                  disabled: !M.can(ui.role, 'obligation.manage') || M.receivesFor(ui.role) !== h.destination.type}, ['Complete']) : null,
              ]),
            ]))),
          ]) : null,
          contextLinksCard(h),
        ]),
      ]),
    ]);
  }

  /* ------------------------------------------------------------- history */
  function historyView(h) {
    const chain = el('div', {class: 'chain', role: 'list', 'aria-label': 'Responsibility chain'}, M.chain(h).map((step) => el('div', {
      role: 'listitem', class: step.state === 'done' ? 'done' : step.state === 'blocked' ? 'blocked' : 'outside',
    }, [
      el('span', {class: 'step-no', text: step.n + ' · ' + (step.state === 'done' ? 'Recorded' : step.state === 'blocked' ? 'Not recorded' : 'Outside this increment')}),
      el('b', {text: step.label}),
      el('span', {text: step.detail}),
      el('span', {text: 'Owner: ' + step.owner + ' · ' + step.source}),
    ])));
    return el('div', {class: 'stack'}, [
      el('div', {class: 'note neutral'}, [
        el('strong', {text: 'Nine separate events, never merged.'}),
        el('p', {text: 'Customer acceptance, the Won outcome, ERP conversion, handover submission, receiving acceptance, work release, scheduling, delivery and financial processing each have their own record, owner and time. Recording one never records another.'}),
      ]),
      chain,
      el('div', {class: 'columns'}, [
        el('div', {class: 'stack'}, [
          el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Chronological evidence'}), el('p', {text: h.history.length + ' retained entries for ' + h.ref + '. Nothing is removed by a later correction.'})])]),
            el('div', {class: 'pad'}, [
              h.history.length ? el('ul', {class: 'timeline'}, h.history.slice().reverse().map((e) => el('li', {}, [
                el('strong', {text: e.kind}),
                el('small', {text: dateText(e.at) + ' · ' + e.actor}),
                el('span', {text: e.text}),
              ]))) : el('p', {class: 'small', text: 'No activity is recorded for this handover.'}),
            ]),
          ]),
          el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Submitted revisions'})])]),
            el('div', {}, h.revisions.length ? h.revisions.map((r) => el('div', {class: 'source-row'}, [
              el('div', {class: 'row between'}, [el('span', {class: 'record-title', text: r.rev}), el('span', {class: 'tag ' + (r.state === 'Accepted' ? 'success' : r.state === 'Returned' ? 'warning' : r.state === 'Withdrawn' ? 'danger' : ''), text: r.state})]),
              el('p', {text: r.note}),
              el('div', {class: 'source-meta'}, [
                el('span', {text: 'Submitted ' + dateText(r.submittedAt) + ' by ' + r.submittedBy}),
                el('span', {text: 'Response required by ' + dateText(r.requiredResponseBy)}),
                r.respondsTo ? el('span', {text: 'Responds to ' + r.respondsTo}) : null,
                r.withdrawnReason ? el('span', {text: 'Withdrawn: ' + r.withdrawnReason}) : null,
              ]),
            ])) : [el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No revision has been submitted.'})])]),
          ]),
        ]),
        el('div', {class: 'stack'}, [
          el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Owned follow-up'}), el('p', {text: 'Shared Activities / My Work pattern. One obligation is one record.'})])]),
            el('div', {}, h.actions.length ? h.actions.map((a) => el('div', {class: 'item-row'}, [
              el('div', {class: 'row between'}, [el('span', {class: 'record-title', text: a.title}), el('span', {class: 'tag ' + (a.status === 'Closed' ? 'success' : 'warning'), text: a.status})]),
              el('p', {text: 'Owner ' + a.owner + ' · due ' + dateText(a.due) + ' · ' + a.source}),
              el('span', {class: 'tiny', text: a.id}),
            ])) : [el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No owned follow-up is recorded for this handover.'})])]),
            el('div', {class: 'pad'}, [el('button', {type: 'button', class: 'small-button', dataset: {action: 'action'}}, ['Create an owned follow-up'])]),
          ]),
          el('div', {class: 'card'}, [
            el('div', {class: 'card-head'}, [el('div', {}, [el('h2', {text: 'Receiving links'}), el('p', {text: 'Prepared locally only.'})])]),
            el('div', {}, h.links.length ? h.links.map((l) => el('div', {class: 'item-row'}, [
              el('div', {class: 'row between'}, [el('span', {class: 'record-title', text: l.target}), el('span', {class: 'tag', text: l.state})]),
              el('p', {text: (l.note || 'No note recorded.') + ' Prepared ' + dateText(l.at) + ' by ' + l.by + '.'}),
            ])) : [el('div', {class: 'pad'}, [el('p', {class: 'small', text: 'No receiving link has been prepared.'})])]),
          ]),
          contextLinksCard(h),
        ]),
      ]),
    ]);
  }

  /* --------------------------------------------------------------- forms */
  function formRequirement(h, id) {
    const r = h.requirements.find((x) => x.id === id);
    openModal({
      kicker: 'Readiness review', title: r.title, submitLabel: 'Record outcome',
      body: [
        el('div', {class: 'note neutral', text: 'Source: ' + r.source + ' · Owner: ' + r.owner + ' · Class: ' + (r.class === 'Acceptance' ? 'required before acceptance' : 'required before work release')}),
        field('Review outcome', select('status', M.REQUIREMENT_STATES.map((s) => ({value: s, label: s})), r.status),
          'Missing evidence and evidence reviewed and found insufficient are different findings and are recorded separately.'),
        field('Source, evidence or reason', textarea('finding', {rows: 3}), 'State what was reviewed and against which exact record.'),
        field('Exact source record (optional)', input('sourceRef', {placeholder: 'For example SYN-PPO-BRF-000142 r02'})),
        field('Reason, if not applicable', textarea('reason', {rows: 2}), 'Required only when the outcome is Not applicable.'),
      ],
      onSubmit() {
        run('requirement', {id, status: value('status'), finding: value('finding'), reason: value('reason'), sourceRef: value('sourceRef')},
          {label: 'Record review outcome'});
        toast(r.title + ' recorded as ' + value('status') + '.');
      },
    });
  }

  function formAttach(h, ref) {
    const d = h.commercial.documents.find((x) => x.ref === ref);
    openModal({
      kicker: 'Supporting document', title: 'Record ' + d.ref + ' as supplied', submitLabel: 'Record document',
      body: [
        el('div', {class: 'note warning', text: 'This records that the document exists at an exact revision in its owning workspace, with its source. It is not a checklist acknowledgement and this workspace does not hold the bytes. Without a revision and a source the document stays missing.'}),
        el('dl', {class: 'facts'}, [['Document', d.title], ['Owner', d.owner], ['Current state', d.state]]
          .flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
        field('Issued revision', input('revision', {placeholder: 'For example r01'})),
        field('Owning workspace and record', textarea('source', {rows: 2}), 'Where this revision is held and how it was identified.'),
      ],
      onSubmit() {
        run('attach', {ref, revision: value('revision'), source: value('source')}, {label: 'Record supporting document'});
        toast(d.ref + ' recorded as available.');
      },
    });
  }

  function formPrepare(h) {
    openModal({
      kicker: 'Preparation', title: 'Prepare ' + (h.draft ? h.draft.rev : M.nextRevisionLabel(h)), submitLabel: 'Save draft',
      body: [
        el('div', {class: 'note neutral', text: 'A correction creates a successor revision. The returned submission and every earlier revision are preserved unchanged.'}),
        field('What this revision adds or corrects', textarea('note', {rows: 3}, ), 'Recorded as preparation history. It is not part of the accepted commercial basis.'),
        M.latestReview(h) && M.latestReview(h).decision === 'Return for clarification' ? el('div', {}, [
          el('p', {class: 'section-label', text: 'Returned findings to answer'}),
          el('ul', {class: 'blockers'}, M.latestReview(h).findings.map((f) => el('li', {text: f.detail + ' — ' + f.owner + ' by ' + shortDate(f.due)}))),
        ]) : null,
      ],
      onSubmit() {
        run('prepare', {note: value('note')}, {label: 'Prepare revision'});
        toast('Draft saved. Submit it when the owned gaps are resolved.');
      },
    });
  }

  function formSubmit(h) {
    const gaps = M.informationGaps(h);
    openModal({
      kicker: 'Submission', title: 'Submit ' + h.draft.rev + ' for receiving review', submitLabel: 'Submit',
      body: [
        gaps.length ? el('div', {class: 'note warning'}, [el('strong', {text: 'Owned information gaps remain'}),
          el('ul', {class: 'blockers'}, gaps.map((g) => el('li', {text: g.text + ' — ' + g.owner})))]) : null,
        el('dl', {class: 'facts'}, [
          ['Receiving owner', h.destination.receivingOwner],
          ['Destination', (h.destination.type || 'Routing decision required') + ' · ' + (h.destination.record.ref || h.destination.record.label)],
          ['Accepted basis', h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0')],
          ['Allocated scope', commercialVisible() ? M.money(M.allocatedTotal(h)) + ' ex GST' : 'Restricted'],
        ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
        field('Required response date', el('input', {name: 'requiredResponseBy', type: 'date', value: '2026-09-21', min: M.TODAY})),
        checkbox('confirm', 'This revision is the scope I am handing over. Submitting does not authorise work, book attendance or create a financial effect.'),
      ],
      onSubmit() {
        run('submit', {confirm: value('confirm'), requiredResponseBy: value('requiredResponseBy')}, {label: 'Submit handover revision'});
        toast('Revision submitted to ' + h.destination.receivingOwner + '.');
      },
    });
  }

  function formWithdraw(h) {
    openModal({
      kicker: 'Submission', title: 'Withdraw ' + M.currentSubmission(h).rev, submitLabel: 'Withdraw',
      body: [
        el('div', {class: 'note warning', text: 'The withdrawn submission is preserved unchanged. Withdrawal is not a receiving decision and records no responsibility.'}),
        field('Why this submission is withdrawn', textarea('reason', {rows: 3})),
      ],
      onSubmit() { run('withdraw', {reason: value('reason')}, {label: 'Withdraw submission'}); toast('Submission withdrawn and preserved.'); },
    });
  }

  function formDecision(h) {
    const submitted = M.currentSubmission(h);
    const blockers = M.acceptanceBlockers(h);
    const release = M.releasePrerequisites(h);
    const findingRows = el('div', {id: 'finding-rows'});
    const obligationRows = el('div', {id: 'obligation-rows'});
    const addFinding = (requirement, detail) => findingRows.append(el('div', {class: 'check-grid', dataset: {row: 'finding'}}, [
      el('div', {class: 'full'}, [field('What is missing or unacceptable', textarea('f-detail', {rows: 2, value: detail || ''}))]),
      field('Who must respond', input('f-owner', {value: h.opportunity.ownerAtWon})),
      field('Response required by', el('input', {name: 'f-due', type: 'date', value: '2026-09-21', min: M.TODAY})),
      el('div', {class: 'full'}, [el('input', {type: 'hidden', name: 'f-requirement', value: requirement || ''})]),
    ]));
    const addObligation = () => obligationRows.append(el('div', {class: 'check-grid', dataset: {row: 'obligation'}}, [
      el('div', {class: 'full'}, [field('Outstanding obligation', input('o-title', {placeholder: 'What remains outstanding at acceptance'}))]),
      field('Owner', input('o-owner', {value: h.destination.receivingOwner})),
      field('Due', el('input', {name: 'o-due', type: 'date', value: '2026-09-22', min: M.TODAY})),
    ]));
    for (const b of blockers.slice(0, 2)) addFinding('', b);
    if (!blockers.length) addFinding('', '');
    addObligation();

    const decisionSelect = select('decision', M.DECISIONS.map((d) => ({value: d, label: d})), blockers.length ? 'Return for clarification' : 'Accept responsibility');
    const body = [
      el('dl', {class: 'facts'}, [
        ['Revision under review', submitted.rev + ' · submitted ' + dateText(submitted.submittedAt) + ' by ' + submitted.submittedBy],
        ['Sending responsibility', h.opportunity.ownerAtWon],
        ['Receiving responsibility', M.ROLES[ui.role].person + ' · ' + h.destination.receivingTeam],
        ['Commercial basis', h.commercial.quotation.ref + ' R' + String(h.commercial.quotation.revision).padStart(2, '0') + ' · ' + h.commercial.acceptance.state],
        ['Destination basis', (h.destination.type || '—') + ' · ' + (h.destination.record.ref || h.destination.record.label)],
        ['Conversion basis', h.conversion.status + (h.conversion.orderKey ? ' · ' + h.conversion.orderKey : '')],
      ].flatMap(([k, v]) => [el('dt', {text: k}), el('dd', {text: v})])),
      blockers.length ? el('div', {class: 'note warning'}, [el('strong', {text: 'Responsibility cannot be accepted yet'}),
        el('ul', {class: 'blockers'}, blockers.map((b) => el('li', {text: b})))]) : null,
      release.length ? el('div', {class: 'note'}, [el('strong', {text: 'These prerequisites will remain open after acceptance'}),
        el('ul', {class: 'blockers'}, release.map((r) => el('li', {text: r.title + ' — ' + r.owner}))),
        el('p', {text: 'Accepting responsibility does not satisfy them and does not authorise or release work.'})]) : null,
      field('Decision', decisionSelect),
      field('Reason and basis', textarea('reason', {rows: 3}), 'What was reviewed, against which revision and sources, and why this decision follows.'),
      el('div', {id: 'finding-block'}, [el('p', {class: 'section-label', text: 'Returned findings — required for a return'}), findingRows,
        el('button', {type: 'button', class: 'small-button', dataset: {action: 'addFinding'}}, ['Add another finding'])]),
      el('div', {id: 'obligation-block'}, [el('p', {class: 'section-label', text: 'Outstanding obligations — required when accepting with obligations'}), obligationRows,
        el('button', {type: 'button', class: 'small-button', dataset: {action: 'addObligation'}}, ['Add another obligation'])]),
      checkbox('confirm', 'I confirm this decision against revision ' + submitted.rev + ' and the exact sources listed above.'),
    ];
    const syncBlocks = () => {
      const d = value('decision');
      document.getElementById('finding-block').hidden = d !== 'Return for clarification';
      document.getElementById('obligation-block').hidden = d !== 'Accept with outstanding obligations';
    };
    openModal({
      kicker: 'Receiving decision · ' + h.destination.receivingTeam, title: 'Record the receiving decision', submitLabel: 'Record decision',
      body,
      onSubmit() {
        const decision = value('decision');
        const findings = [...findingRows.querySelectorAll('[data-row=finding]')].map((row) => ({
          requirement: row.querySelector('[name=f-requirement]').value,
          detail: row.querySelector('[name=f-detail]').value,
          owner: row.querySelector('[name=f-owner]').value,
          due: row.querySelector('[name=f-due]').value,
        })).filter((f) => f.detail.trim());
        const obligations = [...obligationRows.querySelectorAll('[data-row=obligation]')].map((row) => ({
          title: row.querySelector('[name=o-title]').value,
          owner: row.querySelector('[name=o-owner]').value,
          due: row.querySelector('[name=o-due]').value,
          blocksRelease: true,
        })).filter((o) => o.title.trim());
        run('review', {rev: submitted.rev, decision, reason: value('reason'), confirm: value('confirm'), findings, obligations},
          {label: 'Record receiving decision'});
        toast(decision + ' recorded against ' + submitted.rev + '.');
      },
    });
    document.querySelector('#modal-form [name=decision]').addEventListener('change', syncBlocks);
    syncBlocks();
  }

  function formRoute() {
    openModal({
      kicker: 'Delivery destination', title: 'Record the routing decision', submitLabel: 'Record routing',
      body: [
        el('div', {class: 'note neutral', text: 'The route must come from an approved source. No numerical routing threshold is adopted, so this form records an existing decision rather than deriving one.'}),
        field('Destination', select('type', M.DESTINATIONS.map((d) => ({value: d, label: d})), 'Project')),
        field('Approved source of this routing decision', textarea('basis', {rows: 3})),
      ],
      onSubmit() { run('route', {type: value('type'), basis: value('basis')}, {label: 'Record routing decision'}); toast('Routing recorded.'); },
    });
  }

  function formObligation(h, id) {
    const o = h.obligations.find((x) => x.id === id);
    openModal({
      kicker: 'Outstanding obligation', title: o.title, submitLabel: 'Record completion',
      body: [
        el('div', {class: 'note neutral', text: 'Owner ' + o.owner + ' · due ' + dateText(o.due) + ' · ' + (o.blocksRelease ? 'blocks work release' : 'does not block work release')}),
        field('Completion evidence', textarea('evidence', {rows: 3})),
      ],
      onSubmit() { run('obligation', {id, evidence: value('evidence')}, {label: 'Complete obligation'}); toast('Obligation completed.'); },
    });
  }

  const ACTION_PRESETS = {
    commercial: (h) => ({title: 'Request a commercial revision for ' + h.commercial.quotation.ref, owner: h.opportunity.ownerAtWon}),
    routing: (h) => ({title: 'Record the routing decision for the accepted scope', owner: h.destination.routingOwner}),
    conversion: () => ({title: 'Reconcile the unresolved conversion targets in ES-07', owner: 'Jordan · Conversion coordinator'}),
    requirement: (h, id) => {
      const r = h.requirements.find((x) => x.id === id);
      return {title: 'Obtain ' + r.title.toLowerCase(), owner: r.owner};
    },
  };
  function formAction(h, preset, id) {
    const seedValues = preset && ACTION_PRESETS[preset] ? ACTION_PRESETS[preset](h, id) : {title: '', owner: M.ROLES[ui.role].person};
    openModal({
      kicker: 'Owned follow-up', title: 'Create an owned follow-up', submitLabel: 'Create action',
      body: [
        el('div', {class: 'note neutral', text: 'This uses the shared Activities / My Work pattern. An open action with the same title is refused, so one obligation never becomes two.'}),
        field('What this follow-up requires', input('title', {value: seedValues.title})),
        field('Owner', input('owner', {value: seedValues.owner})),
        field('Due', el('input', {name: 'due', type: 'date', value: '2026-09-21', min: M.TODAY})),
        field('Source (optional)', input('source', {placeholder: 'Defaults to this handover'})),
      ],
      onSubmit() {
        run('action', {title: value('title'), owner: value('owner'), due: value('due'), source: value('source')}, {label: 'Create owned follow-up'});
        toast('Owned follow-up created.');
      },
    });
  }

  function formOptions() {
    openModal({
      kicker: 'Demonstration controls', title: 'Preview options', submitLabel: 'Apply',
      body: [
        el('div', {class: 'note neutral', text: 'Preview roles are presentation examples. A later application must enforce capabilities, record scope and restricted content on the server.'}),
        field('Preview role', select('role', Object.entries(M.ROLES).map(([k, v]) => ({value: k, label: v.label})), ui.role)),
        field('Register source', select('source', [
          {value: 'complete', label: 'Complete'},
          {value: 'partial', label: 'One source unavailable'},
          {value: 'loading', label: 'Still loading'},
        ], ui.source), 'No results, an unavailable source, incomplete loading and restricted access are shown as four different findings.'),
        field('Next record save', select('nextSave', [
          {value: 'ok', label: 'Succeeds'},
          {value: 'fail', label: 'Fails with an error'},
          {value: 'unknown', label: 'Response lost after the record was saved'},
        ], ui.nextSave)),
        el('p', {class: 'section-label', text: 'Source changes'}),
        el('div', {class: 'source-actions'}, [
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'sourceChange', kind: 'quotation'}}, ['Supersede the accepted quotation']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'sourceChange', kind: 'technical'}}, ['Advance a technical document revision']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'sourceChange', kind: 'destination'}}, ['Make the receiving record unavailable']),
        ]),
        el('p', {class: 'section-label', text: 'Session'}),
        el('div', {class: 'source-actions'}, [
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'export'}}, ['Export this session']),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'reset'}}, ['Reset the demonstration']),
        ]),
        el('p', {class: 'tiny', style: 'margin-top:12px', text: 'Records are kept in this browser only, under the key ' + KEY + '. Browser storage can be unavailable, cleared or blocked; when it is, the session is held in this page alone and the status line says so. Export is a download, not a delivery service.'}),
      ],
      onSubmit() {
        const role = value('role');
        if (role !== ui.role) {
          ui.role = role;
          ui.savedView = 'all';
          if (!permitted(state).some((h) => h.id === ui.selected)) ui.selected = permitted(state)[0].id;
        }
        ui.source = value('source');
        ui.nextSave = value('nextSave');
        toast('Preview options applied.');
      },
    });
  }

  function formGuide() {
    openModal({
      kicker: 'Page guide', title: 'Sales-to-Delivery Handover', drawer: true, cancelLabel: 'Close',
      body: [
        el('p', {class: 'small', text: 'This workspace answers one question: who has accepted responsibility for delivering the agreed work, what have they received, and what remains unresolved?'}),
        el('ol', {class: 'guide-list'}, [
          'Handover register — the queue of Won opportunities requiring a delivery handover, with owned gaps, blockers and the next action.',
          'Accepted commercial basis — the exact evidence being handed over. It is immutable here; commercial changes belong to the quotation lifecycle.',
          'Delivery destination — Project, Service or parts order, its receiving owner, the ES-07 conversion outcome and the allocated scope.',
          'Readiness review — what must be reviewed before responsibility is accepted, and what may remain open until work release.',
          'Receiving decision — prepare, submit, review, return, correct, compare, resubmit and accept, bound to the exact revision.',
          'History & follow-through — the nine separate events, the chronological record, obligations and receiving links.',
        ].map((t) => el('li', {text: t}))),
        el('div', {class: 'note neutral', text: 'Everything here is synthetic. No customer is contacted, no ERP record is written, no work is authorised, no attendance is booked and no financial effect is created.'}),
      ],
    });
  }

  /* -------------------------------------------------------------- render */
  function render() {
    const tabs = document.getElementById('tabs');
    tabs.replaceChildren(...VIEWS.map((v) => el('button', {
      type: 'button', dataset: {view: v.id}, 'aria-current': ui.view === v.id ? 'page' : null,
    }, [v.label])));

    const roleLabel = document.getElementById('role-label');
    roleLabel.textContent = M.ROLES[ui.role].label;

    const h = selected();
    const contextNode = document.getElementById('context');
    if (!h) {
      contextNode.replaceChildren(el('div', {}, [el('span', {class: 'eyebrow', text: 'Selected handover'}), el('h2', {text: 'No permitted handover'})]));
    } else {
      const s = M.status(h);
      contextNode.replaceChildren(
        el('div', {}, [
          el('span', {class: 'eyebrow', text: h.ref + ' · ' + h.opportunity.ref}),
          el('h2', {text: h.customer.name + ' — ' + h.opportunity.title}),
          el('p', {class: 'small', text: h.site.name + ' · ' + (h.areas.map((a) => a.name).join(', ') || 'No area recorded') + ' · ' + h.site.timezone}),
          el('div', {class: 'row', style: 'margin-top:10px'}, [
            stateTag(s),
            el('span', {class: 'tag source', text: 'Sending: ' + h.opportunity.ownerAtWon}),
            el('span', {class: 'tag source', text: 'Receiving: ' + h.destination.receivingOwner}),
            el('span', {class: 'tag source', text: 'Conversion: ' + h.conversion.status}),
          ]),
        ]),
        el('div', {class: 'context-controls'}, [
          el('label', {class: 'tiny'}, [el('span', {text: 'Select handover'}),
            select('handover-select', permitted(state).map((x) => ({value: x.id, label: x.ref + ' · ' + x.customer.name})), h.id)]),
          el('button', {type: 'button', class: 'small-button', dataset: {action: 'snapshot', kind: 'customer'}}, [icon('open'), 'Customer 360']),
        ]),
      );
    }

    const recovery = document.getElementById('recovery');
    const banners = [];
    if (ui.damaged) banners.push(el('div', {class: 'note', style: 'background:var(--danger-bg);color:var(--danger);border-color:#edc6bd'}, [
      el('strong', {text: 'Saved session needs attention'}),
      el('p', {text: 'The saved browser record could not be read: ' + ui.damaged.message + '. It has been preserved exactly as stored and a fresh demonstration session is shown instead.'}),
      el('div', {class: 'source-actions'}, [
        el('button', {type: 'button', class: 'small-button', dataset: {action: 'raw'}}, ['Export the damaged record']),
        el('button', {type: 'button', class: 'small-button', dataset: {action: 'discard'}}, ['Discard it and keep the fresh session']),
      ]),
    ]));
    if (ui.pending) banners.push(el('div', {class: 'note warning'}, [
      el('strong', {text: 'A response was lost'}),
      el('p', {text: 'The response to “' + ui.pending.label + '” did not arrive. The original operation must be reconciled before another consequential action is submitted. Retrying the same operation returns its original result and creates no second record.'}),
      el('div', {class: 'source-actions'}, [el('button', {type: 'button', class: 'primary small-button', dataset: {action: 'recover'}}, ['Recover the original operation'])]),
    ]));
    if (ui.banner) banners.push(el('div', {class: 'note ' + (ui.banner.kind === 'recovered' ? 'success' : 'warning'), text: ui.banner.text}));
    if (h && M.status(h) === 'Renewed acceptance required') banners.push(el('div', {class: 'note warning'}, [
      el('strong', {text: 'A bound source changed after acceptance'}),
      el('p', {text: 'The recorded acceptance is retained exactly as decided and is shown in history. It no longer applies to the current source, so a successor revision and a renewed receiving acceptance are required. Acceptance is never inherited silently.'}),
    ]));
    if (h && !h.destination.available) banners.push(el('div', {class: 'note', style: 'background:var(--danger-bg);color:var(--danger);border-color:#edc6bd'}, [
      el('strong', {text: 'Receiving record unavailable'}), el('p', {text: h.destination.unavailableReason}),
    ]));
    recovery.replaceChildren(...banners);

    const content = document.getElementById('content');
    let body;
    if (ui.view === 'register' || !h) body = registerView();
    else if (ui.view === 'basis') body = basisView(h);
    else if (ui.view === 'destination') body = destinationView(h);
    else if (ui.view === 'readiness') body = readinessView(h);
    else if (ui.view === 'decision') body = decisionView(h);
    else body = historyView(h);
    content.replaceChildren(el('div', {class: 'page-heading'}, [
      el('div', {}, [el('h2', {text: VIEWS.find((v) => v.id === ui.view).label}),
        el('p', {text: viewSubtitle(h)})]),
    ]), body);
  }

  function viewSubtitle(h) {
    if (!h) return 'No permitted record is available to this identity.';
    switch (ui.view) {
      case 'register': return 'Won opportunities requiring a delivery handover, with their owned gaps and the next action.';
      case 'basis': return 'The exact accepted evidence being handed over. Immutable in this workspace.';
      case 'destination': return 'Where the accepted scope is going, who receives it and what the ERP conversion actually produced.';
      case 'readiness': return 'What the receiving owner needs, separated into acceptance evidence and work-release prerequisites.';
      case 'decision': return 'Prepare, submit, review, return, correct, compare, resubmit and accept — bound to the exact revision.';
      default: return 'Every separate event, in order, with its own owner, time and evidence.';
    }
  }

  /* --------------------------------------------------------------- events */
  function onAction(target) {
    const h = selected();
    const action = target.dataset.action;
    try {
      if (action === 'guide') return formGuide();
      if (action === 'options') return formOptions();
      if (action === 'snapshot') return openSnapshot(target.dataset.kind);
      if (action === 'savedView') { ui.savedView = target.dataset.view; ui.view = 'register'; return render(); }
      if (action === 'clear') { ui.search = ''; ui.savedView = 'all'; ui.filters = {owner: '', destination: '', customer: '', site: '', state: '', due: ''}; return render(); }
      if (action === 'select') { ui.selected = target.dataset.id; ui.compareFrom = ''; ui.compareTo = ''; ui.banner = null; ui.view = 'basis'; return render(); }
      if (action === 'requirement') return formRequirement(h, target.dataset.id);
      if (action === 'attach') return formAttach(h, target.dataset.ref);
      if (action === 'prepare') return formPrepare(h);
      if (action === 'submit') return formSubmit(h);
      if (action === 'withdraw') return formWithdraw(h);
      if (action === 'decide') return formDecision(h);
      if (action === 'route') return formRoute(h);
      if (action === 'obligation') return formObligation(h, target.dataset.id);
      if (action === 'action') return formAction(h, target.dataset.preset, target.dataset.id);
      if (action === 'link') { run('link', {target: target.dataset.target, note: 'Prepared from the Sales-to-Delivery Handover workspace.'}, {label: 'Prepare receiving link'}); toast(target.dataset.target + ' link prepared locally.'); return render(); }
      if (action === 'addFinding') return document.getElementById('finding-rows').append(cloneRow('finding'));
      if (action === 'addObligation') return document.getElementById('obligation-rows').append(cloneRow('obligation'));
      if (action === 'sourceChange') { run('sourceChange', {kind: target.dataset.kind}, {label: 'Source change'}); closeModal(); toast('Source change applied to ' + h.ref + '.'); return render(); }
      if (action === 'recover') return recoverPending();
      if (action === 'export') return exportSession();
      if (action === 'raw') return download('ppo-cr03-damaged-session.txt', ui.damaged.raw, 'text/plain');
      if (action === 'discard') { ui.damaged = null; save(); return render(); }
      if (action === 'reset') { state = M.seed(); ui.selected = 'ho-1'; ui.view = 'register'; ui.banner = null; ui.pending = null; save(); closeModal(); toast('Demonstration reset.'); return render(); }
    } catch (error) {
      if (document.getElementById('modal').open) modalError(error.message);
      else toast(error.message);
      return;
    }
  }
  function cloneRow(kind) {
    const existing = document.querySelector('[data-row=' + kind + ']');
    const copy = existing.cloneNode(true);
    for (const node of copy.querySelectorAll('input,textarea')) if (node.type !== 'date' && node.type !== 'hidden') node.value = '';
    return copy;
  }
  function exportSession() {
    download('ppo-cr03-handover-session.json', JSON.stringify({schema: M.SCHEMA, exportedAt: new Date().toISOString(), synthetic: true, state}, null, 2), 'application/json');
    toast('Session exported as a download. Nothing was sent anywhere.');
  }
  function download(name, text, type) {
    const blob = new Blob([text], {type});
    const url = URL.createObjectURL(blob);
    const anchor = el('a', {href: url, download: name});
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function start() {
    for (const node of document.querySelectorAll('[data-icon]')) node.replaceWith(icon(node.dataset.icon));
    load();
    if (!permitted(state).some((x) => x.id === ui.selected)) ui.selected = permitted(state)[0].id;
    render();
    if (!ui.damaged) setStatus(ui.storage ? 'Saved in this browser' : 'Browser storage unavailable — records are held in this page only', !ui.storage);

    document.addEventListener('click', (event) => {
      const tab = event.target.closest('#tabs [data-view]');
      if (tab) { ui.view = tab.dataset.view; return render(); }
      const action = event.target.closest('[data-action]');
      if (action && !action.disabled) return onAction(action);
      const row = event.target.closest('tr[data-action]');
      if (row) return onAction(row);
    });
    document.addEventListener('keydown', (event) => {
      const tab = event.target.closest && event.target.closest('#tabs [data-view]');
      if (tab && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault();
        const index = VIEWS.findIndex((v) => v.id === tab.dataset.view);
        const next = VIEWS[(index + (event.key === 'ArrowRight' ? 1 : VIEWS.length - 1)) % VIEWS.length];
        ui.view = next.id; render();
        const node = document.querySelector('#tabs [data-view="' + next.id + '"]');
        if (node) node.focus();
        return;
      }
      const row = event.target.closest && event.target.closest('tr[data-action=select]');
      if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onAction(row); }
    });
    document.addEventListener('input', (event) => {
      if (event.target.dataset.action === 'search') { ui.search = event.target.value; render();
        const node = document.getElementById('search-input'); if (node) { node.focus(); node.setSelectionRange(node.value.length, node.value.length); } }
    });
    document.addEventListener('change', (event) => {
      const name = event.target.name;
      if (name === 'handover-select') { ui.selected = event.target.value; ui.compareFrom = ''; ui.compareTo = ''; ui.banner = null; return render(); }
      if (name === 'compare-from') { ui.compareFrom = event.target.value; return render(); }
      if (name === 'compare-to') { ui.compareTo = event.target.value; return render(); }
      if (name && name.startsWith('filter-')) { ui.filters[name.replace('filter-', '')] = event.target.value; return render(); }
    });
    document.getElementById('modal-form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!modalContext || !modalContext.onSubmit) return closeModal();
      try {
        modalContext.onSubmit();
        closeModal();
        render();
      } catch (error) {
        modalError(error.message);
      }
    });
    for (const node of document.querySelectorAll('[data-close]')) node.addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('close', () => { modalContext = null; render(); });
    document.querySelector('.skip').addEventListener('click', (event) => {
      event.preventDefault();
      const content = document.getElementById('content');
      content.focus();
    });
    globalThis.CR3_DEMO = {
      state: () => M.clone(state),
      ui: () => ({...ui}),
      select: (id) => { ui.selected = id; render(); },
      view: (id) => { ui.view = id; render(); },
      role: (id) => { ui.role = id; render(); },
      model: M,
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
