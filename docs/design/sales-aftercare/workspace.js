/* CR-05 Sales Aftercare & Renewal Worklist — interaction layer.
   Five connected views over the local synthetic model. Every control acts on
   this browser session only: no message, booking, agreement, CRM record or
   application request is created. */
(function () {
  'use strict';
  const M = globalThis.AC_MODEL, KEY = 'ppo-sales-aftercare-r01', $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const icons = {
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>', arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    back: '<path d="M20 12H5m5 5-5-5 5-5"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 3a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2"/>'
  };
  const icon = k => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[k] || icons.arrow}</svg>`;

  let state = M.seed();
  let ui = {role: 'account', view: 'worklist', saved: 'all', filters: M.filters(), selected: 'ac-901', returnTo: null};
  let mode = 'complete', saveFailure = 'none', pending = null, damaged = null, storageOK = true, external = false;
  let busy = false, handler = null, origin = null, formDirty = false, timer;

  const me = () => M.people[M.roles[ui.role].person];
  const writable = () => ui.role !== 'observer';
  const day = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}) : 'Date needed';
  const time = d => new Date(d).toLocaleString('en-AU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne'}) + ' AEST';
  const button = (label, action, data = '', classes = '', disabled = false) => `<button type="button" data-action="${action}" ${data} class="${classes}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  const tag = (s, t) => `<span class="tag ${t || (/Completed|Accepted|Delivered|Confirmed|Closed|Conducted/.test(s) ? 'success' : /Overdue|Returned|Unknown|Superseded|Open ·/.test(s) ? 'danger' : /Date needed|Prepared|Requested|Submitted|Draft|Preparing|Partial|Not assessed/.test(s) ? 'warning' : 'info')}">${esc(s)}</span>`;
  const note = (title, body, t = 'neutral') => `<div class="note ${t}"><strong>${esc(title)}</strong><div>${body}</div></div>`;
  const card = (title, body, sub = '') => `<section class="card"><div class="card-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>${body}</section>`;
  const facts = rows => `<dl class="facts">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const field = (name, label, value = '', type = 'text', attrs = '') => `<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" aria-labelledby="label-${name}" ${attrs}></label>`;
  const select = (name, label, options, value) => `<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><select id="f-${name}" name="${name}" aria-labelledby="label-${name}">${options.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></label>`;
  const area = (name, label, value = '', required = true) => `<label class="field" for="f-${name}"><span id="label-${name}">${label}</span><textarea id="f-${name}" name="${name}" aria-labelledby="label-${name}" ${required ? 'required' : ''} maxlength="2000">${esc(value)}</textarea></label>`;
  const check = (name, label, checked = false) => `<label class="check-label"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
  const avatar = name => `<div class="owner"><span class="avatar" aria-hidden="true">${name ? esc(name.split(' ').map(x => x[0]).join('')) : '?'}</span><span>${esc(name || 'Owner needed')}</span></div>`;

  /* Receiving designs. Independent standalone sessions; they do not exchange records. */
  const base = 'https://github.com/deanrfiedler-gif/powerplants-one/blob/main/docs/reference/ui/';
  const receiving = {
    customer: ['Customers, Sites & Growing Areas r03', base + 'customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'],
    equipment: ['Equipment & Installed Base r02', base + 'equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html'],
    cases: ['Service Cases & Triage r02', base + 'service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html'],
    review: ['Service Review & Reports r02', base + 'service-review/PPO-Service-Review-and-Reports-Workspace-r02.html'],
    maintenance: ['Service Agreements & Maintenance r01', base + 'maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html'],
    crm: ['Deals board r35', base + 'crm/ppo-deal-pipeline_r35.html'],
    work: ['My Work & Action Centre r01', base + 'my-work/PPO-My-Work-and-Action-Centre-r01.html'],
    warranty: ['Warranty & Customer Resolution r01', base + 'warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html'],
    projects: ['Project Delivery Readiness r02 file (r01 content)', base + 'projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html'],
    supply: ['Supply Chain Material Readiness r03', base + 'supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html']
  };
  const receivingLink = key => `<a class="button small-button" href="${receiving[key][1]}" target="_blank" rel="noopener">Open ${esc(receiving[key][0])} ${icon('arrow')}</a>`;

  /* ---- Source-result scenarios (partial / failed / empty reads) ---- */
  const degraded = () => mode !== 'complete';
  const rows = () => {
    if (mode === 'failed' || mode === 'empty') return [];
    const all = M.query(state, ui.role, ui.filters, ui.saved);
    return mode === 'partial' ? all.filter(r => r.source.kind !== 'Agreement') : all;
  };
  const visible = () => {
    if (mode === 'failed') return [];
    const all = M.permitted(state, ui.role);
    return mode === 'partial' ? all.filter(r => r.source.kind !== 'Agreement') : all;
  };
  const current = () => visible().find(r => r.id === ui.selected) || null;

  /* ---- Session handling ---- */
  function save() {
    if (damaged || external) return;
    try { localStorage.setItem(KEY, JSON.stringify({schema: 'ppo-sales-aftercare-session/v1', state, ui})); storageOK = true; }
    catch { storageOK = false; }
    if ($('save-status')) $('save-status').textContent = storageOK ? 'Saved in this browser' : 'Session only · export before closing';
  }
  function toast(s) { clearTimeout(timer); $('toast').textContent = s; $('toast').hidden = false; timer = setTimeout(() => { $('toast').hidden = true; }, 4200); }
  function download(name, content, type = 'application/json') {
    const u = URL.createObjectURL(new Blob([content], {type})), a = document.createElement('a');
    a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  function close(force = false) {
    if (formDirty && !force && !window.confirm('Discard the unsaved entries in this form?')) return false;
    $('modal').close(); handler = null; formDirty = false;
    if (origin && origin.isConnected) origin.focus(); else $('content').focus();
    return true;
  }
  function dialog(title, body, fn = null, opts = {}) {
    if (!$('modal').open) origin = document.activeElement;
    formDirty = false;
    $('modal').className = opts.drawer ? 'drawer' : '';
    $('modal-title').textContent = title;
    $('modal-kicker').textContent = opts.kicker || 'Aftercare';
    $('modal-body').innerHTML = body;
    $('modal-error').hidden = true;
    $('modal-error').textContent = '';
    $('modal-submit').hidden = !fn;
    $('modal-submit').textContent = opts.submit || 'Save';
    $('cancel-button').textContent = fn ? 'Cancel' : 'Close';
    handler = fn; decorate();
    if (!$('modal').open) $('modal').showModal();
  }
  function decorate() { document.querySelectorAll('[data-icon]').forEach(e => e.innerHTML = icon(e.dataset.icon)); }

  function transact(type, payload, version = state.version) {
    if (external) throw new Error('Another tab changed this session. Copy unsaved entries, export saved records and reload.');
    if (pending) throw new Error('Recover the original save response before making another change.');
    if (mode === 'failed' || mode === 'empty') throw new Error('Refresh the source results before recording changes.');
    const cmd = {op: 'ac-' + crypto.randomUUID(), type, expectedVersion: version, payload};
    if (saveFailure === 'fail') { saveFailure = 'none'; throw new Error('Simulated save failure. Your entries are retained; retry the same form.'); }
    const r = M.command(state, cmd, ui.role);
    state = r.state; save();
    if (saveFailure === 'unknown') { saveFailure = 'none'; pending = {cmd, role: ui.role}; }
    return r;
  }
  function mutation(title, body, type, payload, opts = {}) {
    const expected = state.version;
    dialog(title, body, fd => {
      const r = transact(type, typeof payload === 'function' ? payload(fd) : payload, expected);
      close(true); render();
      toast(pending ? 'Saved; the original response was lost. Recover it before acting again.' : r.receipt.description);
    }, opts);
  }

  /* ---- Navigation ---- */
  function navigate(view, keepReturn = false) {
    if (!keepReturn) ui.returnTo = null;
    ui.view = view; render(); save(); $('content').focus();
  }
  function goToWorklist(saved, patch = {}) {
    ui.returnTo = {view: ui.view, saved: ui.saved, filters: M.clone(ui.filters)};
    ui.saved = saved; Object.assign(ui.filters, patch); ui.view = 'worklist';
    render(); save(); $('content').focus();
  }
  function goBack() {
    if (!ui.returnTo) return;
    ui.view = ui.returnTo.view; ui.saved = ui.returnTo.saved; ui.filters = M.clone(ui.returnTo.filters);
    ui.returnTo = null; render(); save(); $('content').focus();
  }

  /* ---- Shared fragments ---- */
  function sourceNotice() {
    if (mode === 'failed') return note('Aftercare records could not be loaded', `Counts are unavailable. This does not mean there is no outstanding follow-up. ${button('Retry sources', 'retry', '', 'small-button')}`, 'warning');
    if (mode === 'partial') return note('Partial source results', `Agreement-sourced records are unavailable in this scenario. Displayed counts cover the loaded permitted records only. ${button('Refresh all sources', 'retry', '', 'small-button')}`, 'warning');
    if (mode === 'empty') return note('Empty result scenario', `The simulated query returned no records; your saved aftercare records are unchanged. ${button('Restore source results', 'retry', '', 'small-button')}`);
    return `<p class="source-line">Complete fictional source set · demo date 16 September 2026 · current preview permissions applied</p>`;
  }
  function provenance(r) {
    const k = r.dueBasis.kind;
    const cls = k === 'User choice' ? 'choice' : k === 'Recorded commitment' ? 'commitment' : k === 'Sourced rule' ? 'rule' : 'none';
    return `<span class="provenance ${cls}">${esc(k === 'Not set' ? 'No date basis' : k)}</span>`;
  }
  function backBar() {
    return ui.returnTo ? `<div class="row" style="margin-bottom:14px">${button(icon('back') + ' Back to ' + esc(M.viewTitles[ui.returnTo.view]), 'back', '', 'small-button')}<span class="tiny">Filters and the selected view are preserved.</span></div>` : '';
  }
  function recordChips(r) {
    const o = M.org(state, r.customer);
    const areas = M.areaNames(state, r);
    return `<div class="chip-row">${tag(r.source.kind, 'source')}${tag(r.reason, 'info')}${tag(r.state)}${M.reviewDone(r) ? tag('Review conducted', 'success') : ''}${M.openObligations(r).length ? tag(M.openObligations(r).length + ' open obligation(s)', 'warning') : ''}${r.source.completeness.startsWith('Partial') || r.source.completeness.startsWith('Changed') ? tag('Source ' + r.source.completeness.split(' · ')[0].toLowerCase(), 'danger') : ''}</div>`;
  }

  function contextCard() {
    const r = current();
    const customers = state.customers.filter(c => M.roles[ui.role].customers.includes(c.id));
    const selectOptions = customers.map(c => [c.id, c.name]);
    const o = r ? M.org(state, r.customer) : customers[0];
    const site = r ? M.site(state, r) : null;
    if (['worklist', 'training', 'commercial'].includes(ui.view)) {
      return `<section class="context"><div><span class="eyebrow">Customer scope</span><h2>${esc(customers.map(c => c.name).join(' · '))}</h2><p class="small">${customers.length} permitted customer record(s) in this preview role. Counts, search, snapshots and exports never reach a customer outside this scope.</p><p class="small">${r ? `Selected aftercare record: <strong>${esc(r.ref)}</strong> · ${esc(M.org(state, r.customer).name)} · ${esc(site ? site.name : 'Site not recorded')}. New training needs and commercial discussions are recorded against it.` : 'No aftercare record is selected. Choose one in the worklist before recording a training need or a commercial discussion.'}</p></div><div class="context-controls"><div class="row">${r ? button('Record snapshot', 'openRecord', `data-id="${esc(r.id)}"`, 'small-button') : ''}${button('Open Customer 360', 'openCustomer', `data-id="${esc(o.id)}"`, 'small-button')}${receivingLink('customer')}</div></div></section>`;
    }
    if (!r) return `<section class="context"><div><span class="eyebrow">No record selected</span><h2>Select an aftercare record</h2><p class="small">Choose a record in the Aftercare worklist to use the review, training, commercial and history views.</p></div><div class="context-controls"><div class="row">${button('Go to the worklist', 'view', 'data-view="worklist"', 'small-button')}</div></div></section>`;
    return `<section class="context"><div><span class="eyebrow">${esc(r.ref)} · ${esc(o.name)}</span><h2>${esc(site ? site.name : 'Site not recorded')}${M.areaNames(state, r).length ? ' · ' + esc(M.areaNames(state, r).join(', ')) : ''}</h2><p class="small">Source ${esc(r.source.kind)} ${esc(r.source.ref)} ${esc(r.source.revision)} · ${esc(r.source.date)} · read as at ${esc(r.source.asAt)}. ${esc(r.source.completeness)}</p>${recordChips(r)}</div><div class="context-controls"><div class="row">${button('Record snapshot', 'openRecord', `data-id="${esc(r.id)}"`, 'small-button')}${button('Change record', 'view', 'data-view="worklist"', 'small-button')}</div></div></section>`;
  }

  function outcomeLedger(r) {
    return `<div class="ledger" role="group" aria-label="Distinct recorded outcomes">${M.outcomeKeys.map(([key, label]) => {
      const f = r.outcomes[key];
      return `<div class="ledger-row"><span>${esc(label)}</span><span class="ledger-value">${tag(f.value.length > 46 ? f.value.slice(0, 44) + '…' : f.value)}</span><span class="ledger-source">${esc(f.source)}${f.at ? ' · ' + esc(day(f.at)) : ''}</span></div>`;
    }).join('')}</div>`;
  }

  /* ---- View 1: Aftercare worklist ---- */
  function worklistView() {
    const r = rows();
    /* Counts describe the records actually loaded under the current scenario, so a
       partial read never presents a complete-looking total and a failed read shows
       no number at all rather than a misleading zero. */
    const loaded = mode === 'empty' ? [] : M.query(state, ui.role, ui.filters, 'all').filter(x => mode !== 'partial' || x.source.kind !== 'Agreement');
    const metrics = M.counts(state, ui.role, ui.filters, loaded).map(m => ({...m, value: mode === 'failed' ? null : m.value}));
    const table = r.length ? `<div class="table-wrap"><table class="queue-table"><caption class="sr-only">${esc(M.savedViewTitles[ui.saved])} · ${r.length} matching aftercare records</caption><thead><tr><th>Aftercare / customer</th><th>Source &amp; reason</th><th>Owners</th><th>Outstanding</th><th>Next action</th></tr></thead><tbody>${r.map(x => {
      const o = M.org(state, x.customer), site = M.site(state, x), next = M.nextAction(x);
      return `<tr class="${ui.selected === x.id ? 'selected-row' : ''}"><td data-label="Aftercare / customer"><button type="button" class="record-title" data-action="select" data-id="${esc(x.id)}">${esc(x.ref)}</button><p>${esc(o.name)} · ${esc(site ? site.name : 'Site not recorded')}</p><p>${esc(M.areaNames(state, x).join(', ') || 'No growing area recorded')}${M.assetList(state, x).length ? ' · ' + esc(M.assetList(state, x).map(a => a.name).join(', ')) : ''}</p><div class="row mt">${tag(x.state)}${M.reviewDone(x) ? tag('Review conducted', 'success') : ''}</div></td>
      <td data-label="Source &amp; reason"><p class="reason-text">${esc(x.reason)}</p><p>${esc(x.source.kind)} ${esc(x.source.ref)} ${esc(x.source.revision)} · ${esc(day(x.source.date))}</p><p>${esc(x.source.completeness)}</p></td>
      <td data-label="Owners">${avatar(x.accountOwner)}<p class="tiny">Account owner</p><div class="mt">${avatar(x.reviewOwner)}</div><p class="tiny">Review owner</p></td>
      <td data-label="Outstanding"><p>${M.openCommitments(x).length} commitment(s) · ${M.openObligations(x).length} action(s)</p><p>${M.outstandingTraining(x).length} training · ${x.commercial.length} commercial</p><p class="tiny">Last contact ${esc(x.lastContact ? day(x.lastContact) : 'not recorded')}</p></td>
      <td data-label="Next action"><p>${esc(day(x.planned))}</p><div class="row">${tag(M.dueState(x))}</div><div class="mt">${provenance(x)}</div><p class="next-action">${esc(next.title)} · ${esc(next.owner)}</p>${button('Open ' + icon('arrow'), 'openRecord', `data-id="${esc(x.id)}" aria-label="Open ${esc(x.ref)}"`, 'small-button')}</td></tr>`;
    }).join('')}</tbody></table></div>` : `<div class="empty"><h2>${mode === 'failed' ? 'Results unavailable' : 'No matching aftercare records'}</h2><p>${mode === 'failed' ? 'Retry the sources before drawing a conclusion about outstanding follow-up.' : 'Try a different view, customer, owner, source, reason, state or date filter.'}</p>${button('Clear filters', 'clear', '', 'small-button')}</div>`;

    return `${backBar()}<div class="page-heading"><div><h2>Aftercare worklist</h2><p>Customer reviews and follow-up obligations with an explicit source, owner and date basis.</p></div><span class="tiny">${r.length} matching record(s) · ${esc(M.savedViewTitles[ui.saved])}</span></div>
    ${sourceNotice()}
    <div class="snapshot">${metrics.map(m => button(`<span>${esc(m.label)}</span><strong>${m.value === null ? '—' : m.value}</strong><span class="tiny">${m.value === null ? 'Unavailable · retry the sources' : esc(m.caption) + (mode === 'partial' ? ' · loaded records only' : '')}</span>`, 'metric', `data-view="${m.key}" aria-pressed="${ui.saved === m.key}"`, '', m.value === null)).join('')}</div>
    <div class="columns"><div class="stack">${card('Aftercare records', `<div class="count-line">${r.length} matching record(s) · ${esc(M.savedViewTitles[ui.saved])} · ${mode === 'partial' ? 'partial' : 'fictional'} sources</div>${table}`)}</div>
    <aside class="stack">${selectedSummary(r)}${card('Due-date provenance', `<div class="pad"><p class="small">A follow-up date only appears when someone chose it, a commitment recorded it, or a source rule supplied it.</p>${facts([['User choice', 'Recorded with the person and their stated reason'], ['Recorded commitment', 'The promise and the record it was made in'], ['Sourced rule', 'The source reference and the exact rule revision'], ['Not set', 'Shown as <strong>Date needed</strong>; never replaced by a default interval']])}<p class="tiny mt">No delivery, visit or project type carries an automatic review interval in this design.</p></div>`)}</aside></div>`;
  }

  function selectedSummary(list) {
    const r = current();
    if (!r || mode === 'failed' || mode === 'empty') return card('Selected record', `<div class="pad"><p class="small">Select a visible row to inspect its source, outcomes and next action.</p></div>`);
    const o = M.org(state, r.customer), next = M.nextAction(r);
    return card('Selected record · next step', `<div class="pad"><h3>${esc(r.ref)}</h3>${!list.some(x => x.id === r.id) ? note('Outside current results', 'This selected record is outside the current view or filters. Its identity stays explicit rather than being silently dropped.', 'warning') : ''}
    <p class="small mt">${esc(o.name)} · ${esc(r.reason)}</p><div class="mt">${avatar(r.reviewOwner)}</div><p class="tiny">Review owner</p>
    <p class="small mt">${esc(next.title)}</p><p class="tiny">${esc(next.owner)} · ${esc(day(next.due))}</p>
    <div class="row mt">${button('Open record ' + icon('arrow'), 'openRecord', `data-id="${esc(r.id)}"`, 'primary')}</div>
    <div class="row mt">${button('Customer review', 'view', 'data-view="review"', 'small-button')}${button('Training', 'view', 'data-view="training"', 'small-button')}${button('Commercial', 'view', 'data-view="commercial"', 'small-button')}</div></div>`);
  }

  /* ---- View 2: Customer review ---- */
  function reviewView() {
    const r = current();
    if (!r) return `${backBar()}${note('No record selected', 'Choose an aftercare record in the worklist first.')}`;
    const o = M.org(state, r.customer), rev = r.review;
    const stepStates = ['None', 'Draft', 'Saved', 'Completed'];
    const idx = stepStates.indexOf(rev.state);
    const stepper = `<div class="stepper" role="group" aria-label="Review progress"><div class="${r.state !== 'Planned' ? 'done' : 'current'}"><b>Planned</b>${esc(day(r.planned))}</div><div class="${idx >= 1 || r.state === 'Preparing' ? 'done' : ''}"><b>Prepared</b>Source snapshot taken</div><div class="${idx >= 2 ? 'done' : idx === 1 ? 'current' : ''}"><b>Saved draft</b>Detail retained locally</div><div class="${idx >= 3 ? 'done' : idx === 2 ? 'current' : ''}"><b>Completed</b>${rev.completedAt ? esc(day(rev.completedAt.slice(0, 10))) : 'Outstanding'}</div><div class="${rev.corrections.length ? 'done' : ''}"><b>Corrections</b>${rev.corrections.length} retained</div></div>`;

    const before = card('Before the review · what we supplied and what is open', `<div class="pad">
      ${facts([
        ['Exact scope', esc([o.name, M.site(state, r) ? M.site(state, r).name : 'Site not recorded', ...M.areaNames(state, r)].join(' · '))],
        ['Equipment', M.assetList(state, r).map(a => `${esc(a.name)} · ${esc(a.model)} · ${esc(a.serial)}${a.software !== 'Not applicable' ? ' · ' + esc(a.software) : ''}`).join('<br>') || 'No equipment recorded on this record'],
        ['Source record', `${esc(r.source.kind)} ${esc(r.source.ref)} ${esc(r.source.revision)} · ${esc(day(r.source.date))}`],
        ['Source freshness', `Read as at ${esc(r.source.asAt)} · ${esc(r.source.completeness)}`],
        ['Purpose of the review', esc(r.reasonBasis)],
        ['Intended outcome', 'Establish whether the customer received the intended outcome, what support remains and what should be followed up.']
      ])}
      <div class="section-label">Distinct recorded outcomes</div>${outcomeLedger(r)}
      <p class="tiny mt">Each line has its own source. Completing an aftercare review sets only the aftercare line; it never completes delivery, acceptance, an Activity, a technical issue, training, an assessment, an opportunity or a renewal.</p>
      <div class="section-label">Open cases, warranty and unresolved findings</div>
      ${state.sources.cases.filter(c => c.customer === r.customer && c.status !== 'Closed').map(c => `<div class="candidate"><strong>${esc(c.ref)} · ${esc(c.title)}</strong><p>${esc(c.summary)}</p><div class="row mt">${tag(c.status)}${tag(c.owner, 'source')}${receivingLink('cases')}</div></div>`).join('') || '<p class="small">No open cases recorded for this customer.</p>'}
      <div class="section-label">Outstanding promises and documentation</div>
      ${r.commitments.map(c => `<div class="commitment"><strong>${esc(c.source)}</strong><p>${esc(c.title)}</p><div class="row">${tag(c.disposition)}${tag(c.owner, 'source')}<span class="tiny">${esc(day(c.due))}</span>${c.disposition === 'Open' && M.can(ui.role, 'commitment') ? button('Record disposition', 'commitment', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, 'link-button', !writable()) : ''}</div>${c.dispositionNote ? `<p class="tiny">${esc(c.dispositionNote)}</p>` : ''}</div>`).join('') || '<p class="small">No outstanding commitments recorded.</p>'}
      <div class="section-label">Existing maintenance agreements</div>
      ${state.sources.agreements.filter(a => a.customer === r.customer).map(a => `<div class="candidate"><strong>${esc(a.ref)} ${esc(a.revision)} · ${esc(a.title)}</strong><p>${esc(a.coverage)}</p><div class="row mt">${tag(a.status)}<span class="tiny">Expires ${esc(day(a.expiry))}</span>${a.renewalReview ? tag('MA-05 renewal review open', 'warning') : ''}</div></div>`).join('') || '<p class="small">No agreements recorded for this customer.</p>'}
      <div class="section-label">Relevant contacts and their recorded roles</div>
      ${o.contacts.map(c => `<div class="row" style="margin-bottom:8px">${avatar(c.name)}<span class="tiny">${esc(c.role)} · ${esc(c.recorded)} · ${esc(c.authority)}</span></div>`).join('')}
      <div class="section-label">Customer feedback recorded on this record</div>
      ${rev.feedback.length ? '' : '<p class="small">No feedback has been recorded on this aftercare record yet.</p>'}
      ${rev.feedback.map(f => feedbackBlock(f)).join('')}
      <p class="tiny mt">Once this review is completed, anything further is recorded as an explained correction rather than added here.</p>
    </div>`);

    const capture = card('During or after the review · what we recorded', `<div class="pad">
      ${rev.state === 'Completed' ? note('Completed review', `Completed by ${esc(rev.completedBy)} on ${esc(day(rev.completedAt.slice(0, 10)))}. The original record is retained; changes are appended as explained corrections.`, 'success') : ''}
      ${facts([
        ['Review date', esc(rev.date ? day(rev.date) : 'Not recorded')],
        ['Method', esc(rev.method || 'Not recorded')],
        ['Participants', rev.participants.map(p => `${esc(p.name)} · ${esc(p.role)}`).join('<br>') || 'Not recorded'],
        ['Reported benefits', esc(rev.benefits || 'Not recorded')],
        ['Remaining concerns', (rev.concernsText || 'Not recorded').split('\n').map(esc).join('<br>')],
        ['Questions for clarification', esc(rev.questions || 'None recorded')],
        ['Satisfaction rating', tag(rev.rating)]
      ])}
      ${note('Rating meaning, source and limits', esc(rev.ratingBasis) + ' No satisfaction score is mandatory in this design.', 'neutral')}
      <div class="section-label">Customer feedback</div>
      ${rev.feedback.map(f => feedbackBlock(f)).join('') || '<p class="small">No feedback recorded. Every item states whether it is quoted, paraphrased or an internal interpretation.</p>'}
      <div class="section-label">Agreed next steps</div>
      ${rev.steps.map(s => `<div class="decision"><strong>${esc(s.title)}</strong><p>${esc(s.owner)} · due ${esc(day(s.due))}</p></div>`).join('') || '<p class="small">No agreed next steps recorded.</p>'}
      ${rev.corrections.length ? `<div class="section-label">Corrections to the completed review</div>${rev.corrections.map(c => `<div class="decision"><strong>${esc(c.reason)}</strong><p>${esc(c.text)}</p><p class="tiny">${esc(c.actor)} · ${esc(time(c.at))}</p></div>`).join('')}` : ''}
    </div>
    <div class="form-actions"><div class="row">
      ${button('Record feedback', 'feedback', `data-id="${esc(r.id)}"`, '', !M.can(ui.role, 'feedback') || !writable() || rev.state === 'Completed')}
      ${button('Save review detail', 'saveReview', `data-id="${esc(r.id)}"`, '', !M.can(ui.role, 'review') || !writable() || rev.state === 'Completed')}
      ${button('Add agreed next step', 'step', `data-id="${esc(r.id)}"`, '', !M.can(ui.role, 'review') || !writable() || rev.state === 'Completed')}
    </div><div class="row">
      ${button('Complete review', 'completeReview', `data-id="${esc(r.id)}"`, 'primary', !M.can(ui.role, 'complete') || !writable() || rev.state === 'Completed' || rev.state === 'None')}
      ${button('Record a correction', 'correctReview', `data-id="${esc(r.id)}"`, '', !M.can(ui.role, 'correct') || !writable() || rev.state !== 'Completed')}
    </div></div>`);

    const mixed = card('Mixed outcomes and what stays open', `<div class="pad">
      <div class="compare"><div><h3>Customer statements</h3><p class="small">What the customer said, in their words or clearly paraphrased.</p>${rev.feedback.filter(f => f.basis !== 'Internal interpretation').map(f => `<p class="small mt">${esc(f.text)}</p>`).join('') || '<p class="small mt">None recorded.</p>'}</div>
      <div><h3>Measured or independently verified</h3><p class="small">Evidence from the source records, not from the conversation.</p>${facts([['Commissioning', esc(r.outcomes.installation.value)], ['Acceptance', esc(r.outcomes.acceptance.value)], ['Technical issue', esc(r.outcomes.technicalIssue.value)]])}</div></div>
      ${note('A positive comment certifies nothing', 'Customer satisfaction and equipment performance are separate records. A positive review comment does not certify performance, close a case, or accept a scope.', 'warning')}
      <div class="section-label">Remaining obligations after this review</div>
      ${M.openObligations(r).map(x => `<div class="decision"><strong>${esc(x.title)}</strong><p>${esc(x.owner)} · due ${esc(day(x.due))} · ${esc(x.source)}</p></div>`).join('') || '<p class="small">No open obligations on this record.</p>'}
      <div class="row mt">${receivingLink('work')}</div>
      <p class="tiny mt">The same obligation may appear in this view and in My Work. It keeps one identity and one completion history.</p>
    </div>`);

    const side = card('This review at a glance', `<div class="pad">${facts([
      ['Aftercare record', esc(r.ref)],
      ['Review owner', esc(r.reviewOwner)],
      ['Account owner', esc(r.accountOwner)],
      ['Planned date', `${esc(day(r.planned))} ${provenance(r)}`],
      ['Review state', tag(rev.state === 'None' ? 'Not started' : rev.state)],
      ['Feedback items', String(rev.feedback.length)],
      ['Open commitments', String(M.openCommitments(r).length)],
      ['Open obligations', String(M.openObligations(r).length)],
      ['Technical concerns', String(r.concerns.length)]
    ])}
    <div class="section-label">Next action</div><p class="small">${esc(M.nextAction(r).title)}</p><p class="tiny">${esc(M.nextAction(r).owner)} · ${esc(day(M.nextAction(r).due))}</p>
    <div class="section-label">Receiving designs</div><div class="row">${receivingLink('cases')}${receivingLink('work')}${receivingLink('review')}</div>
    <p class="tiny mt">Separate standalone design sessions. They do not exchange records with this workspace.</p></div>`);

    return `${backBar()}<div class="page-heading"><div><h2>Customer review</h2><p>Prepare from the exact source evidence, then capture what the customer actually said and what was agreed.</p></div>${button('Record snapshot', 'openRecord', `data-id="${esc(r.id)}"`, 'quiet')}</div>
      ${sourceNotice()}${stepper}
      ${r.state === 'Planned' && M.can(ui.role, 'prepare') ? `<div class="row" style="margin-bottom:16px">${button('Open review preparation', 'prepare', `data-id="${esc(r.id)}"`, 'primary', !writable())}<span class="tiny">Takes a source snapshot; it does not contact the customer.</span></div>` : ''}
      <div class="row jump-row"><a class="button small-button" href="#review-capture">Jump to review capture</a><span class="tiny">On a phone the preparation briefing comes first; this jumps to what you record during the visit.</span></div>
      <div class="columns"><div class="stack">${before}<div id="review-capture">${capture}</div>${mixed}</div><aside class="stack">${side}</aside></div>`;
  }
  function feedbackBlock(f) {
    const cls = f.basis === 'Quoted' ? 'quoted' : f.basis === 'Paraphrased' ? 'paraphrased' : 'interpretation';
    return `<div class="feedback ${cls}"><div class="row between">${tag(f.basis, f.basis === 'Internal interpretation' ? 'warning' : 'info')}<span class="tiny">${esc(f.speaker)}</span></div><p>${esc(f.text)}</p><p class="tiny">${esc(time(f.at))}</p></div>`;
  }

  /* ---- View 3: Training & follow-up ---- */
  function trainingView() {
    const all = visible().flatMap(r => r.training.map(t => ({r, t})));
    const r = current();
    const register = all.length ? `<div class="table-wrap"><table class="queue-table"><caption class="sr-only">Training and documentation needs</caption><thead><tr><th>Need / customer</th><th>Equipment &amp; material</th><th>Arrangement</th><th>Delivery &amp; assessment</th><th>Follow-up</th></tr></thead><tbody>${all.map(({r: rec, t}) => `<tr class="${ui.selected === rec.id ? 'selected-row' : ''}"><td data-label="Need / customer"><button type="button" class="record-title" data-action="select" data-id="${esc(rec.id)}">${esc(t.ref)}</button><p>${esc(M.org(state, rec.customer).name)} · ${esc(rec.ref)}</p><p>${esc(t.topic)}</p><p class="tiny">${esc(t.participants)}</p></td>
    <td data-label="Equipment &amp; material"><p>${esc(t.equipment)}</p><p class="tiny">Configuration: ${esc(t.configuration)}</p><p>${t.material.ref ? esc(t.material.ref + ' ' + t.material.revision) : 'No material selected'}</p><div class="row mt">${tag(t.material.state)}</div>${t.material.flag ? `<p class="tiny">${esc(t.material.flag)}</p>` : ''}</td>
    <td data-label="Arrangement">${tag(t.arrangement)}<p class="tiny">${esc(day(t.target))}</p><p class="tiny">${esc(t.trainer)}</p></td>
    <td data-label="Delivery &amp; assessment"><div class="row">${tag(t.attendance.length ? t.attendance.length + ' attended' : 'No attendance')}</div><div class="row mt">${tag(t.delivered ? 'Delivered' : 'Not delivered')}</div><div class="row mt">${tag(t.assessment)}</div></td>
    <td data-label="Follow-up"><p>${esc(t.followUpOwner)}</p><p class="tiny">${esc(day(t.followUpDue))}</p>${button('Open ' + icon('arrow'), 'openTraining', `data-id="${esc(rec.id)}" data-item="${esc(t.id)}"`, 'small-button')}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty"><h2>No training or documentation needs recorded</h2><p>Training needs are raised from a customer review, against exact equipment and material.</p></div>`;

    return `${backBar()}<div class="page-heading"><div><h2>Training &amp; follow-up</h2><p>Needs arising from customer reviews, with exact equipment applicability and an owned follow-up.</p></div>${r && M.can(ui.role, 'training') ? button(icon('plus') + ' Record a training need on ' + esc(r.ref), 'addTraining', `data-id="${esc(r.id)}"`, '', !writable()) : ''}</div>
    ${sourceNotice()}
    <div class="columns"><div class="stack">${card('Training and documentation register', register)}</div>
    <aside class="stack">
      ${note('Five separate states', '<ul><li><strong>Planned</strong> — a need is recorded.</li><li><strong>Confirmed</strong> — the customer agreed a date; the booking itself belongs to the scheduling workflow.</li><li><strong>Attendance</strong> — who was present.</li><li><strong>Delivered</strong> — the session happened, with evidence.</li><li><strong>Assessed</strong> — a separately defined judgement about understanding.</li></ul>')}
      ${note('Attendance is not competence', 'Attending a session does not establish that an operator understands the equipment or is authorised to perform technical work. Assessment is recorded separately, with its method and limits.', 'warning')}
      ${card('Material applicability', `<div class="pad"><p class="small">Material applies to an exact model, serial range and software or configuration. A superseded or missing revision is flagged rather than assumed.</p>${state.sources.documents.map(d => `<div class="decision"><strong>${esc(d.ref)} ${esc(d.revision)}</strong><p>${esc(d.title)}</p><p>${esc(d.applies.models.join(', '))} · ${esc(d.applies.software)}</p><div class="row">${tag(d.state)}${d.successor ? tag('Successor ' + d.successor, 'warning') : ''}</div></div>`).join('')}<p class="tiny mt">Document requests go to the established document workflow. CR-05 stores no documents and creates no second repository.</p></div>`)}
    </aside></div>`;
  }

  /* ---- View 4: Maintenance, renewal and upgrade ---- */
  function commercialView() {
    const all = visible().flatMap(r => r.commercial.map(c => ({r, c})));
    const r = current();
    const table = all.length ? `<div class="table-wrap"><table class="queue-table"><caption class="sr-only">Commercial follow-up opportunities</caption><thead><tr><th>Discussion / origin</th><th>Customer scope</th><th>Agreement &amp; renewal</th><th>Open issues</th><th>Owner &amp; next action</th></tr></thead><tbody>${all.map(({r: rec, c}) => `<tr class="${ui.selected === rec.id ? 'selected-row' : ''}"><td data-label="Discussion / origin"><button type="button" class="record-title" data-action="select" data-id="${esc(rec.id)}">${esc(c.ref)}</button><p>${esc(c.kind)} · from ${esc(rec.ref)}</p><p>${esc(c.observation)}</p><div class="row mt">${tag(c.state)}</div></td>
    <td data-label="Customer scope"><p>${esc(M.org(state, rec.customer).name)}</p><p>${esc(M.site(state, rec) ? M.site(state, rec).name : 'Site not recorded')}</p><p class="tiny">${esc(M.areaNames(state, rec).join(', ') || 'No growing area recorded')}</p><p class="tiny">Interest: ${esc(c.interest)}</p></td>
    <td data-label="Agreement &amp; renewal"><p>${esc(c.agreementRef || 'No agreement linked')}${c.agreementRevision ? ' ' + esc(c.agreementRevision) : ''}</p><p class="tiny">${esc(c.renewalReviewId || 'No MA-05 renewal review linked')}</p><p class="tiny">${esc(agreementDue(rec, c))}</p></td>
    <td data-label="Open issues">${c.openIssues.length ? c.openIssues.map(x => `<p class="tiny">${esc(x)}</p>`).join('') : '<p class="tiny">None recorded</p>'}${c.opportunityRef ? `<div class="row mt">${tag('Opportunity ' + c.opportunityRef, 'info')}</div>` : ''}</td>
    <td data-label="Owner &amp; next action">${avatar(c.owner)}<p class="next-action">${esc(c.nextAction)}</p>${button('Open ' + icon('arrow'), 'openCommercial', `data-id="${esc(rec.id)}" data-item="${esc(c.id)}"`, 'small-button')}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty"><h2>No commercial follow-up recorded</h2><p>A discussion is prepared from a recorded source observation and a stated customer need.</p></div>`;

    return `${backBar()}<div class="page-heading"><div><h2>Maintenance, renewal &amp; upgrade discussions</h2><p>Evidence-supported Sales follow-up. Agreement ownership, proposals and activation stay with MA-05.</p></div>${r && M.can(ui.role, 'commercial') ? button(icon('plus') + ' Prepare a discussion on ' + esc(r.ref), 'prepareCommercial', `data-id="${esc(r.id)}"`, '', !writable()) : ''}</div>
    ${sourceNotice()}
    <div class="columns"><div class="stack">${card('Commercial follow-up', table)}
      ${card('Four distinct commercial states', `<div class="stepper"><div class="done"><b>Informal discussion</b>A conversation, recorded with its evidence</div><div><b>Prepared opportunity</b>A CRM handover with scope, need and assumptions</div><div><b>Quotation</b>Owned by Estimating &amp; Quotation</div><div><b>Accepted agreement</b>Accepted and activated in MA-05</div><div><b>Nothing inferred</b>No step implies the next</div></div><div class="pad"><p class="small">An aftercare action never extends an agreement, infers warranty coverage or activates recurring maintenance. An unverified performance concern is never turned into an automatic product recommendation.</p></div>`)}
    </div>
    <aside class="stack">
      ${card('Agreements and MA-05 renewal reviews', `<div class="pad">${state.sources.agreements.filter(a => !r || a.customer === r.customer).map(a => `<div class="decision"><strong>${esc(a.ref)} ${esc(a.revision)}</strong><p>${esc(a.title)}</p>${facts([['Status', tag(a.status)], ['Source-defined expiry', esc(day(a.expiry))], ['Source-defined review date', esc(a.reviewDate ? day(a.reviewDate) : 'Not recorded')], ['MA-05 renewal review', a.renewalReview ? `${esc(a.renewalReview.id)} · ${esc(a.renewalReview.state)} · ${a.renewalReview.proposals} proposal(s) · ${esc(a.renewalReview.crmState)}` : 'None open']])}</div>`).join('') || '<p class="small">No agreements recorded.</p>'}<div class="row mt">${receivingLink('maintenance')}</div></div>`)}
      ${card('Existing CRM opportunities', `<div class="pad">${state.sources.opportunities.filter(o => !r || o.customer === r.customer).map(o => `<div class="decision"><strong>${esc(o.ref)}</strong><p>${esc(o.title)}</p><div class="row">${tag(o.stage)}${tag(o.owner, 'source')}</div><p class="tiny">${esc(o.qualification)}</p></div>`).join('') || '<p class="small">No opportunities recorded for this customer.</p>'}<div class="row mt">${receivingLink('crm')}</div></div>`)}
      ${note('Unresolved issues stay visible', 'Open technical and customer issues remain on screen while a commercial discussion is planned. They are not hidden because a renewal or upgrade is in view.', 'warning')}
    </aside></div>`;
  }
  function agreementDue(rec, c) {
    const a = state.sources.agreements.find(x => x.ref === c.agreementRef);
    return a ? `Expiry ${a.expiry} · review ${a.reviewDate || 'not recorded'}` : 'No source-defined expiry or review date linked';
  }

  /* ---- View 5: History & commercial handover ---- */
  function historyView() {
    const r = current();
    if (!r) return `${backBar()}${note('No record selected', 'Choose an aftercare record in the worklist first.')}`;
    /* The record timeline is the single chronological log. Item-level history stays
       in each item's own drawer, so one event is never listed twice here. */
    const groups = {
      'Source event': 'Source events',
      'Source change': 'Source changes',
      'Aftercare': 'Aftercare record',
      'Review': 'Review, feedback and corrections',
      'Concern': 'Service referrals and receiving outcomes',
      'Training': 'Training and documentation',
      'Commercial': 'Maintenance, renewal and CRM handover'
    };
    const events = r.timeline.map(t => ({at: t.at, group: groups[t.kind] || t.kind, actor: t.actor, text: t.text, ref: t.ref}));
    if (!events.some(e => e.ref === r.source.ref)) {
      events.unshift({at: r.source.date + 'T00:00:00Z', group: 'Source events', actor: r.source.owner, text: `${r.source.kind} ${r.source.ref} ${r.source.revision} — ${r.source.title}`, ref: r.source.ref});
    }
    events.sort((a, b) => String(a.at).localeCompare(String(b.at)));

    const handovers = r.commercial.filter(c => c.handover);
    return `${backBar()}<div class="page-heading"><div><h2>History &amp; commercial handover</h2><p>One chronological record of source events, reviews, referrals, training and commercial follow-up.</p></div><span class="tiny">${events.length} event(s) on ${esc(r.ref)}</span></div>
    ${sourceNotice()}
    <div class="columns"><div class="stack">
      ${card('Chronological history', `<div class="pad"><ul class="timeline">${events.map(e => `<li><strong>${esc(e.group)}</strong><small>${esc(time(e.at))} · ${esc(e.actor)}${e.ref ? ' · ' + esc(e.ref) : ''}</small>${esc(e.text)}</li>`).join('')}</ul><p class="tiny mt">One entry per event. Item-level history for a referral, training need or commercial discussion is retained in that item's own drawer.</p></div>`)}
      ${card('Commercial handovers', handovers.length ? `<div class="pad">${handovers.map(c => `<div class="decision"><div class="row between"><strong>${esc(c.handover.ref)}</strong>${tag(c.handover.state)}</div>${facts([
        ['Customer / site / equipment scope', esc(c.handover.scope)],
        ['Recorded need', esc(c.handover.need)],
        ['Source evidence', esc(c.handover.evidence)],
        ['Receiving owner', esc(c.handover.owner)],
        ['Next action', esc(c.handover.nextAction)],
        ['Unresolved assumptions', esc(c.handover.assumptions)],
        ['Open issues carried', c.handover.openIssues.length ? c.handover.openIssues.map(esc).join('<br>') : 'None recorded'],
        ['Qualification', esc(c.handover.qualification)],
        ['Confirmed receiving reference', esc(c.handover.receivingRef || 'Not confirmed')],
        ['Returned reason', esc(c.handover.returnedReason || 'Not returned')],
        ['Revisions', String(c.handover.revisions)]
      ])}<div class="row mt">${button('Submit handover', 'submitHandover', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, '', !M.can(ui.role, 'handover') || !writable() || c.handover.state !== 'Prepared')}${button('Record receiving outcome', 'receiveHandover', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, '', !M.can(ui.role, 'receiveHandover') || !writable() || !['Submitted', 'Unknown'].includes(c.handover.state))}${receivingLink('crm')}</div></div>`).join('')}</div>` : `<div class="pad"><p class="small">No handover prepared on this record. Prepare one from a commercial discussion in the Maintenance &amp; renewal view.</p></div>`)}
    </div>
    <aside class="stack">
      ${card('Outstanding and completed obligations', `<div class="pad"><div class="section-label">Open</div>${M.openObligations(r).map(o => `<div class="commitment"><strong>${esc(o.owner)}</strong><p>${esc(o.title)}</p><p class="tiny">Due ${esc(day(o.due))} · ${esc(o.source)}</p></div>`).join('') || '<p class="small">No open obligations.</p>'}<div class="section-label">Commitments</div>${r.commitments.map(c => `<div class="commitment"><strong>${esc(c.title)}</strong><div class="row">${tag(c.disposition)}</div><p class="tiny">${esc(c.dispositionNote || 'No disposition recorded yet.')}</p></div>`).join('') || '<p class="small">No commitments recorded.</p>'}</div>`)}
      ${card('Links back to the originating records', `<div class="pad">${facts([
        ['Customer 360', `${esc(M.org(state, r.customer).ref)} · ${esc(M.org(state, r.customer).name)}`],
        ['Originating record', `${esc(r.source.kind)} ${esc(r.source.ref)} ${esc(r.source.revision)}`],
        ['Linked cases', r.concerns.filter(c => c.link).map(c => esc(c.link.ref)).join('<br>') || 'None'],
        ['Accepted referrals', r.concerns.filter(c => c.referral && c.referral.receivingRef).map(c => esc(c.referral.receivingRef)).join('<br>') || 'None'],
        ['Agreements', r.commercial.filter(c => c.agreementRef).map(c => esc(c.agreementRef)).join('<br>') || 'None'],
        ['Opportunities', r.commercial.filter(c => c.opportunityRef).map(c => esc(c.opportunityRef)).join('<br>') || 'None']
      ])}<div class="row mt">${receivingLink('customer')}${receivingLink('projects')}${receivingLink('review')}</div>
      <p class="tiny mt">Routes marked as demonstration links open separate standalone design sessions. They do not exchange records with this workspace, and receiving functionality is outstanding.</p></div>`)}
      ${M.can(ui.role, 'complete') ? card('Close this aftercare record', `<div class="pad"><p class="small">Closing requires a completed review, every commitment dispositioned, no open obligations and no unreconciled receiving outcome.</p><div class="row mt">${button('Close record', 'closeRecord', `data-id="${esc(r.id)}"`, '', !writable() || r.state === 'Closed')}</div></div>`) : ''}
    </aside></div>`;
  }

  /* ---- Detail drawers ---- */
  function openRecord(id) {
    const r = visible().find(x => x.id === id);
    if (!r || ['failed', 'empty'].includes(mode)) {
      dialog('Record unavailable', note('Refresh the current source', 'This record is outside the current role scope, unavailable in this scenario, or superseded by a newer source revision. Refresh the worklist to open the current record. No hidden details are displayed.', 'warning'));
      return;
    }
    ui.selected = id; save();
    const o = M.org(state, r.customer), site = M.site(state, r), next = M.nextAction(r);
    let body = facts([
      ['Aftercare reference', esc(r.ref)],
      ['Customer', `${esc(o.name)} · ${esc(o.ref)}`],
      ['Site', site ? `${esc(site.name)} · ${esc(site.ref)}` : 'Site not recorded'],
      ['Facility / growing area', esc(M.areaNames(state, r).join(', ') || 'Not recorded')],
      ['Equipment', M.assetList(state, r).map(a => `${esc(a.name)} · ${esc(a.model)} · ${esc(a.serial)}`).join('<br>') || 'Not recorded'],
      ['Originating record', `${esc(r.source.kind)} ${esc(r.source.ref)} ${esc(r.source.revision)} · ${esc(day(r.source.date))}`],
      ['Reason for follow-up', esc(r.reason)],
      ['Basis for that reason', esc(r.reasonBasis)],
      ['Account owner', esc(r.accountOwner)],
      ['Review owner', esc(r.reviewOwner)],
      ['Planned review date', `${esc(day(r.planned))} ${provenance(r)}`],
      ['Date basis detail', esc(r.dueBasis.detail)],
      ['Date source / rule revision', esc([r.dueBasis.sourceRef, r.dueBasis.ruleRevision].filter(Boolean).join(' · ') || 'Not applicable')],
      ['Current state', tag(r.state)],
      ['Last contact or review', esc(r.lastContact ? day(r.lastContact) : 'Not recorded')],
      ['Source freshness', `Read as at ${esc(r.source.asAt)}`],
      ['Source completeness', esc(r.source.completeness)],
      ['Record version', String(r.version)]
    ]);
    if (o.accountOwnerConflict) body += note('Account owner recorded differently in two sources', esc(o.accountOwnerConflict), 'warning');
    body += `<div class="section-label">Distinct recorded outcomes</div>${outcomeLedger(r)}`;
    body += `<div class="section-label">Outstanding support and customer commitments</div>${r.commitments.map(c => `<div class="decision"><strong>${esc(c.title)}</strong><p>${esc(c.source)}</p><div class="row">${tag(c.disposition)}${tag(c.owner, 'source')}<span class="tiny">${esc(day(c.due))}</span></div>${c.dispositionNote ? `<p class="tiny">${esc(c.dispositionNote)}</p>` : ''}</div>`).join('') || '<p class="small">None recorded.</p>'}`;
    body += `<div class="section-label">Next action and its owner</div>${facts([['Next action', esc(next.title)], ['Owner', esc(next.owner)], ['Due', esc(day(next.due))]])}`;
    body += `<div class="section-label">Technical concerns</div>${r.concerns.map(c => concernBlock(r, c)).join('') || '<p class="small">No concerns recorded on this record.</p>'}`;

    let actions = '';
    if (writable()) {
      if (M.can(ui.role, 'plan') && r.state !== 'Closed') actions += button('Set or change the review date', 'plan', `data-id="${esc(r.id)}"`);
      if (M.can(ui.role, 'plan') && r.state !== 'Closed') actions += button('Change owners', 'owners', `data-id="${esc(r.id)}"`);
      if (M.can(ui.role, 'concern')) actions += button('Link an existing case', 'linkCase', `data-id="${esc(r.id)}"`);
      if (M.can(ui.role, 'refer')) actions += button('Prepare a Service referral', 'prepareReferral', `data-id="${esc(r.id)}"`, 'primary');
    }
    body += `<div class="row mt">${actions || '<span class="small">This preview role has no write capability on this record.</span>'}</div>`;
    body += `<div class="section-label">Open in a view</div><div class="row">${button('Customer review', 'gotoView', `data-view="review" data-id="${esc(r.id)}"`, 'small-button')}${button('Training', 'gotoView', `data-view="training" data-id="${esc(r.id)}"`, 'small-button')}${button('Commercial', 'gotoView', `data-view="commercial" data-id="${esc(r.id)}"`, 'small-button')}${button('History', 'gotoView', `data-view="history" data-id="${esc(r.id)}"`, 'small-button')}</div>`;
    if (r.history.length) body += `<details class="mt"><summary>Retained record history (${r.history.length})</summary>${r.history.slice().reverse().map(h => `<div class="decision"><strong>${esc(h.type)}</strong><p>${esc(h.text)}</p><p class="tiny">${esc(h.actor)} · ${esc(time(h.at))}</p></div>`).join('')}</details>`;
    dialog(r.ref, body, null, {drawer: true, kicker: o.name + ' · ' + r.reason});
  }

  function concernBlock(r, c) {
    const state2 = c.referral ? c.referral.state : (c.link ? 'Linked to existing case' : 'Recorded');
    return `<div class="decision"><div class="row between"><strong>${esc(c.ref || (c.link ? c.link.ref : 'Concern'))}</strong>${tag(state2)}</div>
    ${facts([
      ['Customer-reported symptom', esc(c.symptom)],
      ['Site, equipment and configuration', esc([c.siteScope, c.configuration].filter(Boolean).join(' · ') || 'Not recorded')],
      ['When it occurs', esc(c.occurs)],
      ['Reported operational or crop impact', esc(c.impact)],
      ['Evidence available', esc(c.evidence)],
      ['Troubleshooting attempted', esc(c.attempted)],
      ['Questions for specialist review', esc(c.questions || 'None recorded')],
      ['Proposed receiving owner', esc(c.proposedOwner)],
      ['Next contact commitment', esc(c.contactCommitment)],
      ['Linked existing case', c.link ? `${esc(c.link.ref)} · ${esc(c.link.status)} · ${esc(c.link.owner)}` : 'None'],
      ['Returned reason', esc(c.referral && c.referral.returnedReason ? c.referral.returnedReason : 'Not returned')],
      ['Confirmed receiving reference', esc(c.referral && c.referral.receivingRef ? c.referral.receivingRef : 'Not confirmed')]
    ])}
    <p class="tiny">No diagnosis, urgency category, service level or permission to intervene is inferred from this text.</p>
    <div class="row mt">${c.referral ? button('Submit referral', 'submitReferral', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, '', !M.can(ui.role, 'refer') || !writable() || !['Prepared', 'Returned'].includes(c.referral.state) || c.referral.state === 'Returned') : ''}
    ${c.referral && c.referral.state === 'Returned' ? button('Correct and resubmit', 'reviseReferral', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, 'primary', !M.can(ui.role, 'refer') || !writable()) : ''}
    ${c.referral ? button('Record receiving outcome', 'receiveReferral', `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`, '', !M.can(ui.role, 'receive') || !writable() || !['Submitted', 'Unknown'].includes(c.referral.state)) : ''}
    ${receivingLink('cases')}</div></div>`;
  }

  function openTraining(id, itemId) {
    const r = visible().find(x => x.id === id); if (!r) return;
    const t = r.training.find(x => x.id === itemId); if (!t) return;
    ui.selected = id; save();
    let body = facts([
      ['Training reference', esc(t.ref)],
      ['Customer / site', `${esc(M.org(state, r.customer).name)} · ${esc(M.site(state, r) ? M.site(state, r).name : 'Site not recorded')}`],
      ['Intended participants', esc(t.participants)],
      ['Equipment / model / serial', esc(t.equipment)],
      ['Software or configuration', esc(t.configuration)],
      ['Topic or knowledge gap', esc(t.topic)],
      ['Identified gap', esc(t.gap)],
      ['Requested outcome', esc(t.outcome)],
      ['Applicable material', t.material.ref ? `${esc(t.material.ref)} ${esc(t.material.revision)} · ${tag(t.material.state)}` : 'No material selected'],
      ['Material applicability', esc(t.material.applicability)],
      ['Proposed trainer / owner', esc(t.trainer)],
      ['Target date', esc(day(t.target))],
      ['Arrangement', tag(t.arrangement)],
      ['Arrangement note', esc(t.arrangementNote)],
      ['Attendance', t.attendance.length ? t.attendance.map(a => esc(a.name)).join('<br>') : 'Not recorded'],
      ['Delivery', tag(t.delivered ? 'Delivered' : 'Not delivered')],
      ['Delivery evidence', esc(t.deliveredNote || 'Not recorded')],
      ['Assessment of understanding', tag(t.assessment)],
      ['Assessment basis and limits', esc(t.assessmentBasis)],
      ['Remaining questions', esc(t.questions || 'None recorded')],
      ['Follow-up owner / due', `${esc(t.followUpOwner)} · ${esc(day(t.followUpDue))}`],
      ['Document request', t.documentRequest ? `${esc(t.documentRequest.ref)} · ${esc(t.documentRequest.state)}` : 'None']
    ]);
    if (t.material.flag) body += note('Material applicability', esc(t.material.flag), 'warning');
    body += note('Attendance, delivery and understanding are separate', 'Recording a requested date does not create a confirmed booking. A confirmed arrangement does not create an appointment. Attendance is not delivery, and delivery is not competence.', 'neutral');
    const d = `data-id="${esc(r.id)}" data-item="${esc(t.id)}"`;
    body += `<div class="row mt">
      ${button('Confirm arrangement', 'confirmTraining', d, '', !M.can(ui.role, 'training') || !writable() || t.arrangement !== 'Requested')}
      ${button('Record attendance', 'attendance', d, '', !M.can(ui.role, 'training') || !writable() || t.arrangement !== 'Confirmed')}
      ${button('Record delivery', 'deliverTraining', d, '', !M.can(ui.role, 'training') || !writable() || !t.attendance.length || t.delivered)}
      ${button('Record assessment', 'assessTraining', d, '', !M.can(ui.role, 'training') || !writable() || !t.delivered)}
      ${button('Request a document', 'documentRequest', d, '', !M.can(ui.role, 'document') || !writable() || !!t.documentRequest)}</div>`;
    body += `<div class="section-label">Scheduling and documents</div><p class="small">The actual appointment belongs to the scheduling workflow, and document issue belongs to the document workflow. Neither is created here.</p><div class="row">${receivingLink('review')}</div>`;
    if (t.history.length) body += `<details class="mt"><summary>Training history (${t.history.length})</summary>${t.history.slice().reverse().map(h => `<div class="decision"><p>${esc(h.text)}</p><p class="tiny">${esc(h.actor)} · ${esc(time(h.at))}</p></div>`).join('')}</details>`;
    dialog(t.ref, body, null, {drawer: true, kicker: 'Training & follow-up'});
  }

  function openCommercial(id, itemId) {
    const r = visible().find(x => x.id === id); if (!r) return;
    const c = r.commercial.find(x => x.id === itemId); if (!c) return;
    ui.selected = id; save();
    const agreement = state.sources.agreements.find(a => a.ref === c.agreementRef);
    let body = facts([
      ['Discussion reference', esc(c.ref)],
      ['Kind', esc(c.kind)],
      ['Originating aftercare record', esc(r.ref)],
      ['Source observation', esc(c.observation)],
      ['Identified customer need', esc(c.need)],
      ['Recorded customer interest', esc(c.interest)],
      ['Customer, site and equipment', esc([M.org(state, r.customer).name, M.site(state, r) ? M.site(state, r).name : 'Site not recorded', ...M.areaNames(state, r)].join(' · '))],
      ['Existing agreement', agreement ? `${esc(agreement.ref)} ${esc(agreement.revision)} · ${esc(agreement.status)}` : 'None linked'],
      ['Source-defined expiry', agreement ? esc(day(agreement.expiry)) : 'Not applicable'],
      ['Source-defined review date', agreement && agreement.reviewDate ? esc(day(agreement.reviewDate)) : 'Not recorded'],
      ['MA-05 renewal review', esc(c.renewalReviewId || 'None linked')],
      ['Existing CRM opportunity', esc(c.opportunityRef || 'None linked')],
      ['Responsible owner', esc(c.owner)],
      ['Next action', esc(c.nextAction)],
      ['State', tag(c.state)]
    ]);
    body += `<div class="section-label">Open technical and customer issues</div>${c.openIssues.length ? c.openIssues.map(x => `<p class="small">${esc(x)}</p>`).join('') : '<p class="small">None recorded.</p>'}`;
    body += note('MA-05 owns the agreement', 'CR-05 surfaces and coordinates the Sales follow-up. Agreement review, proposed successor terms and renewal acceptance belong to MA-05. No aftercare action extends an agreement, infers warranty coverage or activates recurring maintenance.', 'neutral');
    const d = `data-id="${esc(r.id)}" data-item="${esc(c.id)}"`;
    body += `<div class="row mt">
      ${button('Link an MA-05 renewal review', 'linkRenewal', d, '', !M.can(ui.role, 'commercial') || !writable() || !!c.renewalReviewId)}
      ${button('Link an existing opportunity', 'linkOpportunity', d, '', !M.can(ui.role, 'commercial') || !writable() || !!c.opportunityRef)}
      ${button('Prepare a CRM handover', 'prepareHandover', d, 'primary', !M.can(ui.role, 'handover') || !writable() || !!c.opportunityRef || (!!c.handover && c.handover.state !== 'Returned'))}</div>`;
    if (c.handover) body += `<div class="section-label">Prepared handover</div>${facts([['Reference', esc(c.handover.ref)], ['State', tag(c.handover.state)], ['Scope', esc(c.handover.scope)], ['Evidence', esc(c.handover.evidence)], ['Assumptions', esc(c.handover.assumptions)], ['Qualification', esc(c.handover.qualification)]])}<div class="row mt">${button('Submit handover', 'submitHandover', d, '', !M.can(ui.role, 'handover') || !writable() || c.handover.state !== 'Prepared')}${button('Record receiving outcome', 'receiveHandover', d, '', !M.can(ui.role, 'receiveHandover') || !writable() || !['Submitted', 'Unknown'].includes(c.handover.state))}</div>`;
    body += `<div class="row mt">${receivingLink('maintenance')}${receivingLink('crm')}</div>`;
    if (c.history.length) body += `<details class="mt"><summary>Discussion history (${c.history.length})</summary>${c.history.slice().reverse().map(h => `<div class="decision"><p>${esc(h.text)}</p><p class="tiny">${esc(h.actor)} · ${esc(time(h.at))}</p></div>`).join('')}</details>`;
    dialog(c.ref, body, null, {drawer: true, kicker: 'Maintenance, renewal & upgrade'});
  }

  function openCustomer(id) {
    const o = state.customers.find(c => c.id === id);
    if (!o || !M.roles[ui.role].customers.includes(o.id)) { toast('This customer is outside the selected preview scope.'); return; }
    let body = facts([
      ['Customer', `${esc(o.name)} · ${esc(o.ref)}`],
      ['Legal name', esc(o.legalName)],
      ['Sector', esc(o.sector)],
      ['Account owner', esc(o.accountOwner)],
      ['Record as at', esc(o.asAt)],
      ['Completeness', esc(o.completeness)]
    ]);
    if (o.accountOwnerConflict) body += note('Account owner recorded differently in two sources', esc(o.accountOwnerConflict), 'warning');
    body += `<div class="section-label">Sites</div>${o.sites.map(s => `<div class="decision"><strong>${esc(s.name)}</strong><p>${esc(s.ref)}</p><p>${esc(s.address)}</p></div>`).join('')}`;
    body += `<div class="section-label">Facilities and growing areas</div>${o.areas.map(a => `<p class="small">${esc(a.ref)} · ${esc(a.name)} · ${esc(a.kind)}</p>`).join('') || '<p class="small">No facility or growing-area records exist for this customer.</p>'}`;
    body += `<div class="section-label">Equipment</div>${o.assets.map(a => `<div class="decision"><strong>${esc(a.name)}</strong><p>${esc(a.ref)} · ${esc(a.model)} · ${esc(a.serial)}</p><p class="tiny">Installed in ${esc(o.areas.find(x => x.id === a.installedIn) ? o.areas.find(x => x.id === a.installedIn).name : 'not recorded')} · serves ${esc(a.serves.map(s => o.areas.find(x => x.id === s) ? o.areas.find(x => x.id === s).name : s).join(', ') || 'not recorded')}</p></div>`).join('') || '<p class="small">No equipment records exist for this customer.</p>'}`;
    body += `<div class="section-label">Contacts and recorded roles</div>${o.contacts.map(c => `<p class="small">${esc(c.name)} · ${esc(c.role)} · ${esc(c.recorded)} · ${esc(c.authority)}</p>`).join('')}`;
    body += `<div class="section-label">Aftercare records for this customer</div>${M.permitted(state, ui.role).filter(r => r.customer === o.id).map(r => `<div class="decision"><strong>${esc(r.ref)}</strong><p>${esc(r.reason)} · ${esc(r.state)}</p><div class="row mt">${button('Open', 'openRecord', `data-id="${esc(r.id)}"`, 'small-button')}</div></div>`).join('')}`;
    body += `<div class="row mt">${receivingLink('customer')}${receivingLink('equipment')}</div>`;
    dialog(o.name, body, null, {drawer: true, kicker: 'Customer 360'});
  }

  /* ---- Forms ---- */
  function act(action, el) {
    const id = el.dataset.id, itemId = el.dataset.item;
    const r = id ? visible().find(x => x.id === id) : null;
    const version = r ? r.version : 0;
    const d = {id, recordVersion: version};

    if (action === 'guide') return guide();
    if (action === 'options') return options();
    if (action === 'back') return goBack();
    if (action === 'view') return navigate(el.dataset.view);
    if (action === 'gotoView') { ui.selected = id; if ($('modal').open) close(true); return navigate(el.dataset.view); }
    if (action === 'select') { ui.selected = id; render(); save(); return; }
    if (action === 'clear') { ui.filters = M.filters(); ui.saved = 'all'; render(); save(); return; }
    if (action === 'metric') return goToWorklist(el.dataset.view);
    if (action === 'retry') { mode = 'complete'; render(); toast('Fictional source set refreshed; no new obligation was created.'); return; }
    if (action === 'openRecord') return openRecord(id);
    if (action === 'openTraining') return openTraining(id, itemId);
    if (action === 'openCommercial') return openCommercial(id, itemId);
    if (action === 'openCustomer') return openCustomer(id);

    if (action === 'plan') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Set or change the review date', note('Dates never default', 'A follow-up date comes from an explicit choice, a recorded commitment or a sourced rule. No delivery, visit or project type carries an automatic interval in this design.')
        + select('basis', 'Where does this date come from?', M.dueBasisKinds, r.dueBasis.kind === 'Not set' ? 'User choice' : r.dueBasis.kind)
        + field('planned', 'Planned review date', r.planned || '', 'date')
        + check('dateNeeded', 'Leave the date open and show Date needed', !r.planned)
        + area('detail', 'Basis for this date', r.dueBasis.detail)
        + field('sourceRef', 'Source reference (sourced rule only)', r.dueBasis.sourceRef)
        + field('ruleRevision', 'Rule revision (sourced rule only)', r.dueBasis.ruleRevision),
        'plan', fd => ({...d, basis: fd.get('basis'), planned: fd.get('planned'), dateNeeded: fd.has('dateNeeded'), detail: fd.get('detail'), sourceRef: fd.get('sourceRef'), ruleRevision: fd.get('ruleRevision')}),
        {submit: 'Record the date basis', kicker: r.ref});
    }
    if (action === 'owners') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Change account and review ownership', note('Three separate owners', 'The account owner, the review owner and individual action owners are distinct. Changing one never silently transfers the others.')
        + select('accountOwner', 'Account owner', M.owners, r.accountOwner)
        + select('reviewOwner', 'Review owner', M.owners, r.reviewOwner)
        + area('reason', 'Reason for the change'),
        'owners', fd => ({...d, accountOwner: fd.get('accountOwner'), reviewOwner: fd.get('reviewOwner'), reason: fd.get('reason')}),
        {submit: 'Record ownership', kicker: r.ref});
    }
    if (action === 'prepare') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Open review preparation', note('Local snapshot only', 'This takes a snapshot of the current source state for the review. No customer is contacted and no message is sent.')
        + facts([['Source record', esc(r.source.ref + ' ' + r.source.revision)], ['Currently read as at', esc(r.source.asAt)], ['Completeness', esc(r.source.completeness)]]),
        'prepare', () => ({...d, asAt: M.TODAY}), {submit: 'Take the snapshot', kicker: r.ref});
    }
    if (action === 'feedback') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Record customer feedback', note('Say what kind of statement this is', 'Quoted words, a paraphrase and an internal interpretation are recorded separately. A customer statement does not certify equipment performance or close a technical issue.')
        + select('basis', 'Basis', M.feedbackBases, 'Quoted')
        + field('speaker', 'Who said it', '', 'text', 'required maxlength="80"')
        + area('text', 'Feedback in clear language'),
        'feedback', fd => ({...d, basis: fd.get('basis'), speaker: fd.get('speaker'), text: fd.get('text')}),
        {submit: 'Record feedback', kicker: r.ref});
    }
    if (action === 'saveReview') {
      if (!r) throw new Error('Refresh this record.');
      const rev = r.review;
      const contacts = M.org(state, r.customer).contacts;
      return mutation('Save review detail', note('Draft, saved and completed are different', 'Saving retains the detail locally. Completing the review is a separate, deliberate step.')
        + field('date', 'Review date', rev.date || M.TODAY, 'date', 'required')
        + select('method', 'Review method', M.reviewMethods, rev.method || 'Site visit')
        + select('participant1', 'Customer participant and recorded role', contacts.map(c => [c.name + '|' + c.role, `${c.name} · ${c.role}`]), rev.participants[0] ? rev.participants[0].name + '|' + rev.participants[0].role : contacts[0].name + '|' + contacts[0].role)
        + select('participant2', 'Powerplants participant', M.owners.map(o => [o, o]), rev.participants[1] ? rev.participants[1].name : r.reviewOwner)
        + area('benefits', 'Reported benefits', rev.benefits, false)
        + area('concernsText', 'Remaining concerns', rev.concernsText, false)
        + area('questions', 'Questions requiring technical or commercial clarification', rev.questions, false),
        'saveReview', fd => {
          const [n1, r1] = String(fd.get('participant1')).split('|');
          return {...d, date: fd.get('date'), method: fd.get('method'), benefits: fd.get('benefits'), concernsText: fd.get('concernsText'), questions: fd.get('questions'),
            participants: [{name: n1, role: r1, recorded: 'Customer · recorded role from the contact directory'}, {name: fd.get('participant2'), role: 'Powerplants review participant', recorded: 'Powerplants'}]};
        }, {submit: 'Save review detail', kicker: r.ref});
    }
    if (action === 'step') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Add an agreed next step', note('One obligation, one identity', 'An agreed next step is projected as one owned action. It may appear in several views and keeps one identity and one completion history.')
        + field('title', 'Agreed next step', '', 'text', 'required maxlength="160"')
        + select('owner', 'Responsible owner', M.owners, r.reviewOwner)
        + field('due', 'Due date', M.TODAY, 'date', 'required'),
        'step', fd => ({...d, title: fd.get('title'), owner: fd.get('owner'), due: fd.get('due')}),
        {submit: 'Record next step', kicker: r.ref});
    }
    if (action === 'commitment') {
      if (!r) throw new Error('Refresh this record.');
      const item = r.commitments.find(x => x.id === itemId);
      if (!item) throw new Error('Select an outstanding commitment.');
      return mutation('Record a commitment disposition', note(item.title, `Source: ${esc(item.source)}. Every outstanding commitment needs a clear disposition and owner before a review can be completed.`)
        + select('disposition', 'Disposition', M.dispositions.filter(x => x !== 'Open'), 'Carried as owned action')
        + select('owner', 'Owner (when carried)', M.owners, item.owner)
        + field('due', 'Due date (when carried)', item.due || M.TODAY, 'date')
        + area('note', 'Disposition note'),
        'commitment', fd => ({...d, commitmentId: itemId, disposition: fd.get('disposition'), owner: fd.get('owner'), due: fd.get('due'), note: fd.get('note')}),
        {submit: 'Record disposition', kicker: r.ref});
    }
    if (action === 'completeReview') {
      if (!r) throw new Error('Refresh this record.');
      const open = M.openCommitments(r);
      return mutation('Complete the aftercare review', note('Completing this review completes nothing else', 'It does not complete delivery, acceptance, an Activity, a technical issue, training, an assessment, an opportunity or a renewal. Each of those has its own record and its own decision.', 'warning')
        + facts([['Outstanding commitments', open.length ? open.map(x => esc(x.title)).join('<br>') : 'None — all dispositioned'], ['Open obligations after completion', String(M.openObligations(r).length)], ['Feedback items recorded', String(r.review.feedback.length)]])
        + (open.length ? note('Disposition required first', 'Give every outstanding commitment a disposition and owner before completing the review.', 'danger') : '')
        + area('summary', 'Review outcome summary'),
        'completeReview', fd => ({...d, summary: fd.get('summary')}),
        {submit: 'Complete review', kicker: r.ref});
    }
    if (action === 'correctReview') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Record a correction', note('The original record is retained', 'A correction is appended with its explanation. The completed review, its feedback and its history are never overwritten or deleted.')
        + area('reason', 'Reason for the correction')
        + area('text', 'Corrected or added detail'),
        'correctReview', fd => ({...d, reason: fd.get('reason'), text: fd.get('text')}),
        {submit: 'Append correction', kicker: r.ref});
    }
    if (action === 'linkCase') {
      if (!r) throw new Error('Refresh this record.');
      const cases = state.sources.cases.filter(c => c.customer === r.customer);
      if (!cases.length) throw new Error('No existing cases are recorded for this customer.');
      return mutation('Link an existing case', note('Check before creating another record', 'Similar wording alone never merges records. Linking is a deliberate decision, made after reading the candidates below.')
        + cases.map(c => `<div class="candidate"><strong>${esc(c.ref)} · ${esc(c.title)}</strong><p>${esc(c.summary)}</p><div class="row mt">${tag(c.status)}${tag(c.owner, 'source')}</div></div>`).join('')
        + select('caseRef', 'Existing case', cases.map(c => [c.ref, `${c.ref} · ${c.title}`]), cases[0].ref)
        + area('symptom', 'Customer-reported symptom in the review')
        + field('siteScope', 'Site, equipment and configuration', '', 'text', 'maxlength="160"'),
        'linkCase', fd => ({...d, caseRef: fd.get('caseRef'), symptom: fd.get('symptom'), siteScope: fd.get('siteScope')}),
        {submit: 'Link the existing case', kicker: r.ref});
    }
    if (action === 'prepareReferral') {
      if (!r) throw new Error('Refresh this record.');
      const assets = M.assetList(state, r);
      const candidates = M.similarCases(state, r, [r.reason, r.review.concernsText, r.review.questions, ...r.review.feedback.map(f => f.text)].join(' '));
      const related = M.relatedActions(r);
      return mutation('Prepare a Service referral', note('Preparing is not submitting', 'This prepares a receiving handover for the Service Cases intake and triage workflow. Submitting it, and Service accepting responsibility, are separate steps.')
        + `<div class="section-label">Relevant existing cases and actions</div>`
        + (candidates.length ? candidates.map(x => `<div class="candidate"><strong>${esc(x.case.ref)} · ${esc(x.case.title)}</strong><p>${esc(x.case.summary)}</p><div class="row mt">${tag(x.case.status)}${x.linked ? tag('Already linked here', 'success') : ''}${x.sameAsset ? tag('Same equipment', 'warning') : ''}${x.sameArea ? tag('Same growing area', 'warning') : ''}${x.hits ? tag(x.hits + ' wording match(es)', 'info') : ''}</div></div>`).join('') : '<p class="small">No case is recorded for this customer. Check the Service Cases workspace if you are unsure.</p>')
        + (related.length ? related.map(x => `<div class="candidate"><strong>${esc(x.kind)}${x.ref ? ' · ' + esc(x.ref) : ''}</strong><p>${esc(x.title)}</p><div class="row mt">${tag(x.owner, 'source')}${x.due ? `<span class="tiny">${esc(day(x.due))}</span>` : ''}</div></div>`).join('') : '')
        + note('Wording alone decides nothing', 'A wording match is a prompt to look, not a reason to merge. Records are linked or created only by a deliberate choice.')
        + area('symptom', 'Customer-reported symptom')
        + field('siteScope', 'Exact site, equipment and configuration', assets[0] ? `${M.site(state, r) ? M.site(state, r).name : ''} · ${assets[0].name} · ${assets[0].serial}` : '', 'text', 'required maxlength="200"')
        + select('assetId', 'Equipment', [['', 'Not recorded'], ...assets.map(a => [a.id, `${a.name} · ${a.serial}`])], assets[0] ? assets[0].id : '')
        + field('configuration', 'Software or configuration', assets[0] ? assets[0].software : 'Not recorded', 'text', 'maxlength="120"')
        + area('occurs', 'When the issue occurs')
        + area('impact', 'Reported operational or crop impact')
        + area('evidence', 'Evidence already available', '', false)
        + area('attempted', 'Troubleshooting already attempted', '', false)
        + area('questions', 'Questions requiring specialist review', '', false)
        + select('proposedOwner', 'Proposed receiving owner or team', M.owners, 'Alex Morgan')
        + field('contactCommitment', 'Next contact commitment', '', 'text', 'required maxlength="160"')
        + note('No diagnosis is implied', 'Free-text feedback does not establish a diagnosis, an urgency category, a service level or permission to intervene. Triage belongs to Service Cases.', 'warning')
        + check('reviewed', 'I checked the existing cases and actions listed above before preparing another record.'),
        'prepareReferral', fd => ({...d, symptom: fd.get('symptom'), siteScope: fd.get('siteScope'), assetId: fd.get('assetId'), configuration: fd.get('configuration'), occurs: fd.get('occurs'), impact: fd.get('impact'), evidence: fd.get('evidence'), attempted: fd.get('attempted'), questions: fd.get('questions'), proposedOwner: fd.get('proposedOwner'), contactCommitment: fd.get('contactCommitment'), reviewed: fd.has('reviewed')}),
        {submit: 'Prepare referral', kicker: r.ref});
    }
    if (action === 'submitReferral') {
      if (!r) throw new Error('Refresh this record.');
      const c = r.concerns.find(x => x.id === itemId);
      return mutation('Submit the referral to Service', note(c.ref, 'Submitting sends the prepared referral for triage. Service accepting responsibility is a separate outcome that this workspace cannot decide.')
        + facts([['Symptom', esc(c.symptom)], ['Scope', esc(c.siteScope)], ['Proposed owner', esc(c.proposedOwner)], ['Next contact commitment', esc(c.contactCommitment)], ['Revision', String(c.referral.revisions)]]),
        'submitReferral', () => ({...d, concernId: itemId}), {submit: 'Submit referral', kicker: r.ref});
    }
    if (action === 'reviseReferral') {
      if (!r) throw new Error('Refresh this record.');
      const c = r.concerns.find(x => x.id === itemId);
      return mutation('Correct a returned referral', note('Returned for missing information', esc(c.referral.returnedReason) + ' The original request is retained and not rewritten; your correction is appended.', 'warning')
        + area('addition', 'Missing information now supplied'),
        'reviseReferral', fd => ({...d, concernId: itemId, addition: fd.get('addition')}), {submit: 'Record the correction', kicker: r.ref});
    }
    if (action === 'receiveReferral') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Record the receiving outcome', note('Accepted, returned or unknown', 'An unknown outcome is recorded honestly and must be reconciled before the referral is submitted again.')
        + select('outcome', 'Receiving outcome', ['Accepted', 'Returned', 'Unknown'], 'Accepted')
        + field('receivingRef', 'Receiving case reference (when accepted)', 'SYN-PPO-TKT-000204', 'text', 'maxlength="60"')
        + area('reason', 'Reason for returning (when returned)', '', false),
        'receiveReferral', fd => ({...d, concernId: itemId, outcome: fd.get('outcome'), receivingRef: fd.get('receivingRef'), reason: fd.get('reason')}),
        {submit: 'Record outcome', kicker: 'Service Cases receiving'});
    }
    if (action === 'addTraining') {
      if (!r) throw new Error('Refresh this record.');
      const assets = M.assetList(state, r);
      const docOptions = [['', 'No material selected']];
      for (const a of assets) for (const doc of state.sources.documents.filter(x => x.applies.models.includes(a.model))) docOptions.push([doc.revision, `${doc.ref} ${doc.revision} · ${doc.title} · ${doc.state}`]);
      return mutation('Record a training or documentation need', note('Requested is not confirmed', 'Recording a requested date does not create a confirmed booking, appointment or resource allocation. Scheduling is a separate workflow.')
        + field('participants', 'Intended participants', '', 'text', 'required maxlength="160"')
        + select('assetId', 'Relevant equipment', [['', 'Not recorded'], ...assets.map(a => [a.id, `${a.name} · ${a.model} · ${a.serial}`])], assets[0] ? assets[0].id : '')
        + area('topic', 'Topic or identified knowledge gap')
        + area('outcome', 'Requested outcome')
        + select('materialRevision', 'Applicable manual, procedure or training material', docOptions, '')
        + select('trainer', 'Proposed trainer or responsible owner', M.owners, 'Morgan Ellis')
        + field('target', 'Target date', M.TODAY, 'date', 'required')
        + area('questions', 'Remaining questions', '', false),
        'addTraining', fd => ({...d, participants: fd.get('participants'), assetId: fd.get('assetId'), topic: fd.get('topic'), outcome: fd.get('outcome'), materialRevision: fd.get('materialRevision'), trainer: fd.get('trainer'), target: fd.get('target'), questions: fd.get('questions')}),
        {submit: 'Record training need', kicker: r.ref});
    }
    if (action === 'confirmTraining') {
      if (!r) throw new Error('Refresh this record.');
      const t = r.training.find(x => x.id === itemId);
      return mutation('Confirm the training arrangement', note('This does not create a booking', 'Confirming records that the customer agreed a date. The appointment, resource and travel remain with the scheduling workflow.', 'warning')
        + facts([['Training', esc(t.ref)], ['Equipment', esc(t.equipment)], ['Material', esc(t.material.ref ? t.material.ref + ' ' + t.material.revision + ' · ' + t.material.state : 'None selected')]])
        + field('confirmed', 'Confirmed date', t.target, 'date', 'required')
        + area('note', 'Confirmation detail')
        + check('acknowledge', 'I understand that the scheduling workflow owns the actual booking.'),
        'confirmTraining', fd => ({...d, trainingId: itemId, confirmed: fd.get('confirmed'), note: fd.get('note'), acknowledge: fd.has('acknowledge')}),
        {submit: 'Confirm arrangement', kicker: t.ref});
    }
    if (action === 'attendance') {
      if (!r) throw new Error('Refresh this record.');
      const t = r.training.find(x => x.id === itemId);
      const contacts = M.org(state, r.customer).contacts;
      return mutation('Record attendance', note('Attendance is not competence', 'Recording who attended does not establish that an operator understands the equipment or is authorised to perform technical work.', 'warning')
        + contacts.map(c => check('attend-' + c.id, `${esc(c.name)} · ${esc(c.role)}`)).join('')
        + field('other', 'Other attendee (optional)', '', 'text', 'maxlength="80"'),
        'attendance', fd => {
          const names = contacts.filter(c => fd.has('attend-' + c.id)).map(c => c.name);
          if (fd.get('other')) names.push(String(fd.get('other')));
          return {...d, trainingId: itemId, names};
        }, {submit: 'Record attendance', kicker: t.ref});
    }
    if (action === 'deliverTraining') {
      if (!r) throw new Error('Refresh this record.');
      const t = r.training.find(x => x.id === itemId);
      return mutation('Record training delivery', note('Delivery is separate from understanding', 'Recording delivery does not assess whether the operator understood the material. That is a separate judgement with its own method and limits.')
        + area('evidence', 'Delivery or attendance evidence')
        + select('followUpOwner', 'Follow-up owner', M.owners, t.followUpOwner)
        + field('followUpDue', 'Follow-up due date', t.followUpDue, 'date', 'required'),
        'deliverTraining', fd => ({...d, trainingId: itemId, evidence: fd.get('evidence'), followUpOwner: fd.get('followUpOwner'), followUpDue: fd.get('followUpDue')}),
        {submit: 'Record delivery', kicker: t.ref});
    }
    if (action === 'assessTraining') {
      if (!r) throw new Error('Refresh this record.');
      const t = r.training.find(x => x.id === itemId);
      return mutation('Record a separate assessment', note('Define what was assessed', 'This design adopts no competence standard. Record the method used and its limits, so the result is not read as a qualification or an authorisation.', 'warning')
        + select('assessment', 'Assessment result', ['Assessed · met the stated outcome', 'Assessed · further support needed'], 'Assessed · met the stated outcome')
        + area('basis', 'Assessment method and its limits'),
        'assessTraining', fd => ({...d, trainingId: itemId, assessment: fd.get('assessment'), basis: fd.get('basis')}),
        {submit: 'Record assessment', kicker: t.ref});
    }
    if (action === 'documentRequest') {
      if (!r) throw new Error('Refresh this record.');
      const t = r.training.find(x => x.id === itemId);
      return mutation('Request a document', note('The document workflow owns documents', 'This prepares a request for the established document register and review workflow. CR-05 stores no documents and creates no second repository.')
        + area('what', 'What is needed, for which equipment and configuration', t.material.ref ? `Issue ${t.material.ref} at its current revision for ${t.equipment} (${t.configuration}).` : '')
        + select('owner', 'Owner', M.owners, t.trainer)
        + field('due', 'Due date', t.target, 'date', 'required'),
        'documentRequest', fd => ({...d, trainingId: itemId, what: fd.get('what'), owner: fd.get('owner'), due: fd.get('due')}),
        {submit: 'Prepare request', kicker: t.ref});
    }
    if (action === 'prepareCommercial') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Prepare a maintenance, renewal or upgrade discussion', note('Keep the source observation and the customer need', 'An unverified performance concern is never turned into an automatic product recommendation. Record what was observed and what the customer said they need.', 'warning')
        + select('kind', 'Discussion kind', ['Maintenance', 'Renewal', 'Upgrade'], 'Maintenance')
        + area('observation', 'Source observation')
        + area('need', 'Identified maintenance, support or upgrade need')
        + area('interest', 'Recorded customer interest or permission to continue (optional)', '', false)
        + select('owner', 'Responsible owner', M.owners, r.accountOwner)
        + field('nextAction', 'Next action', '', 'text', 'required maxlength="160"'),
        'prepareCommercial', fd => ({...d, kind: fd.get('kind'), observation: fd.get('observation'), need: fd.get('need'), interest: fd.get('interest'), owner: fd.get('owner'), nextAction: fd.get('nextAction')}),
        {submit: 'Prepare discussion', kicker: r.ref});
    }
    if (action === 'linkRenewal') {
      if (!r) throw new Error('Refresh this record.');
      const agreements = state.sources.agreements.filter(a => a.customer === r.customer);
      return mutation('Link an MA-05 renewal review', note('MA-05 owns the agreement', 'Linking surfaces the Sales follow-up beside the renewal review. It does not extend the agreement, infer warranty coverage, propose terms or activate recurring maintenance.')
        + agreements.map(a => `<div class="candidate"><strong>${esc(a.ref)} ${esc(a.revision)} · ${esc(a.title)}</strong><p>${esc(a.coverage)}</p><div class="row mt">${tag(a.status)}<span class="tiny">Expiry ${esc(day(a.expiry))}</span>${a.renewalReview ? tag(a.renewalReview.id + ' · ' + a.renewalReview.state) : tag('No renewal review', 'danger')}</div></div>`).join('')
        + select('agreementRef', 'Agreement', agreements.map(a => [a.ref, `${a.ref} ${a.revision} · ${a.title}`]), agreements[0] ? agreements[0].ref : ''),
        'linkRenewal', fd => ({...d, commercialId: itemId, agreementRef: fd.get('agreementRef')}),
        {submit: 'Link renewal review', kicker: r.ref});
    }
    if (action === 'linkOpportunity') {
      if (!r) throw new Error('Refresh this record.');
      const opportunities = M.similarOpportunities(state, r);
      if (!opportunities.length) throw new Error('No existing opportunities are recorded for this customer.');
      return mutation('Link an existing opportunity', note('Check before creating another', 'Preserve the originating aftercare relationship. Linking an existing opportunity avoids a duplicate record.')
        + opportunities.map(o => `<div class="candidate"><strong>${esc(o.ref)}</strong><p>${esc(o.title)}</p><div class="row mt">${tag(o.stage)}${tag(o.owner, 'source')}</div><p class="tiny">${esc(o.qualification)}</p></div>`).join('')
        + select('opportunityRef', 'Existing opportunity', opportunities.map(o => [o.ref, `${o.ref} · ${o.title}`]), opportunities[0].ref)
        + check('reviewed', 'I reviewed the existing opportunities listed above.'),
        'linkOpportunity', fd => ({...d, commercialId: itemId, opportunityRef: fd.get('opportunityRef'), reviewed: fd.has('reviewed')}),
        {submit: 'Link opportunity', kicker: r.ref});
    }
    if (action === 'prepareHandover') {
      if (!r) throw new Error('Refresh this record.');
      const c = r.commercial.find(x => x.id === itemId);
      const opportunities = M.similarOpportunities(state, r);
      const o = M.org(state, r.customer);
      return mutation('Prepare a CRM handover', note('Deliberate review before a new opportunity', 'Originating from an existing customer does not make a new opportunity qualified. CRM qualification rules apply on receipt.', 'warning')
        + (opportunities.length ? `<div class="section-label">Existing opportunities for this customer</div>${opportunities.map(x => `<div class="candidate"><strong>${esc(x.ref)}</strong><p>${esc(x.title)} · ${esc(x.stage)}</p></div>`).join('')}` : note('No existing opportunities', 'Nothing recorded for this customer.'))
        + (c.openIssues.length ? note('Unresolved issues stay visible', c.openIssues.map(esc).join('<br>'), 'warning') : '')
        + area('scope', 'Exact customer, site and equipment scope', [o.name, M.site(state, r) ? M.site(state, r).name : '', ...M.areaNames(state, r)].filter(Boolean).join(' · '))
        + area('evidence', 'Source evidence')
        + select('owner', 'Receiving owner', M.owners, r.accountOwner)
        + field('nextAction', 'Next action', c.nextAction, 'text', 'required maxlength="160"')
        + area('assumptions', 'Unresolved assumptions')
        + check('reviewed', 'I reviewed the existing opportunities above before preparing a new handover.'),
        'prepareHandover', fd => ({...d, commercialId: itemId, scope: fd.get('scope'), evidence: fd.get('evidence'), owner: fd.get('owner'), nextAction: fd.get('nextAction'), assumptions: fd.get('assumptions'), reviewed: fd.has('reviewed')}),
        {submit: 'Prepare handover', kicker: c.ref});
    }
    if (action === 'submitHandover') {
      if (!r) throw new Error('Refresh this record.');
      const c = r.commercial.find(x => x.id === itemId);
      return mutation('Submit the CRM handover', note(c.handover.ref, 'Submitting sends the prepared handover to CRM. The receiving outcome is not known until CRM responds, and no opportunity exists until it is accepted.')
        + facts([['Scope', esc(c.handover.scope)], ['Need', esc(c.handover.need)], ['Owner', esc(c.handover.owner)], ['Assumptions', esc(c.handover.assumptions)]]),
        'submitHandover', () => ({...d, commercialId: itemId}), {submit: 'Submit handover', kicker: c.ref});
    }
    if (action === 'receiveHandover') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Record the CRM receiving outcome', note('Accepted, returned or unknown', 'Accepting creates a CRM opportunity at Enquiry. It is not qualified by acceptance. An unknown outcome must be reconciled before submitting again.')
        + select('outcome', 'Receiving outcome', ['Accepted', 'Returned', 'Unknown'], 'Accepted')
        + field('receivingRef', 'Confirmed opportunity reference (when accepted)', 'SYN-PPO-OPP-000043', 'text', 'maxlength="60"')
        + area('reason', 'Reason for returning (when returned)', '', false),
        'receiveHandover', fd => ({...d, commercialId: itemId, outcome: fd.get('outcome'), receivingRef: fd.get('receivingRef'), reason: fd.get('reason')}),
        {submit: 'Record outcome', kicker: 'CRM receiving'});
    }
    if (action === 'closeRecord') {
      if (!r) throw new Error('Refresh this record.');
      return mutation('Close the aftercare record', note('Linked records keep their own states', 'Closing this aftercare record does not close a case, a training need, an agreement or an opportunity.')
        + facts([['Review', esc(r.review.state)], ['Open obligations', String(M.openObligations(r).length)], ['Open commitments', String(M.openCommitments(r).length)]])
        + area('reason', 'Closing basis'),
        'closeRecord', fd => ({...d, reason: fd.get('reason')}), {submit: 'Close record', kicker: r.ref});
    }
    if (action === 'scenario') {
      if (!r) throw new Error('Select an aftercare record first.');
      return mutation('Demonstrate a source change', note('Earlier content is retained', 'A changed source revision or a superseded document flags the affected record for reassessment. Nothing already recorded is deleted.', 'warning')
        + select('change', 'Scenario', [['sourceChanged', 'Originating record advances to a new revision'], ['documentSuperseded', 'Selected training material is superseded']], 'sourceChanged'),
        'scenario', fd => ({...d, change: fd.get('change')}), {submit: 'Apply scenario', kicker: r.ref});
    }
    if (action === 'recover') {
      const result = M.command(state, pending.cmd, pending.role);
      if (!result.recovered || JSON.stringify(result.state) !== JSON.stringify(state)) throw new Error('The original save could not be reconciled. Export the session for review.');
      pending = null; render();
      toast('Original save recovered. No duplicate referral, handover, action or opportunity was created.');
      return;
    }
    if (action === 'export') { download('PPO-CR-05-Sales-Aftercare-r01-session.json', JSON.stringify({schema: 'ppo-sales-aftercare-session/v1', state, ui}, null, 2)); toast('Saved records exported; unsaved form entries are separate.'); return; }
    if (action === 'raw') { download('PPO-CR-05-original-session.txt', damaged, 'text/plain'); return; }
    if (action === 'reset') {
      return dialog('Reset demonstration', note('Replace this local session', 'Export first if you need to keep these saved demonstration records. Other module sessions are separate.') + check('confirm', 'Replace the current CR-05 demonstration.'), fd => {
        if (!fd.has('confirm')) throw new Error('Confirm the reset.');
        state = M.seed();
        ui = {role: 'account', view: 'worklist', saved: 'all', filters: M.filters(), selected: 'ac-901', returnTo: null};
        damaged = null; pending = null; external = false; mode = 'complete'; saveFailure = 'none';
        close(true); save(); render();
      }, {submit: 'Reset demonstration'});
    }
    if (action === 'restore') {
      return dialog('Restore saved session', field('file', 'Exported CR-05 session', '', 'file', 'accept="application/json,.json" required')
        + note('Replace the current local session', 'Restoration validates the saved records and starts in a read-only preview role. No records are merged.')
        + check('confirm', 'Replace this session with the validated export.'), async fd => {
          if (!fd.has('confirm')) throw new Error('Confirm replacement of this session.');
          const file = fd.get('file');
          if (!file || file.size > 4 * 1024 * 1024) throw new Error('Choose a CR-05 JSON file up to 4 MiB.');
          const e = JSON.parse(await file.text());
          if (e.schema !== 'ppo-sales-aftercare-session/v1') throw new Error('Unsupported session export.');
          M.validate(e.state);
          state = e.state;
          ui = {role: 'observer', view: 'worklist', saved: 'all', filters: M.filters(), selected: null, returnTo: null};
          mode = 'complete'; pending = null; external = false;
          close(true); save(); render(); toast('Validated session restored in a read-only preview role.');
        }, {submit: 'Restore session'});
    }
    throw new Error('Unsupported action.');
  }

  /* ---- Guide and preview options ---- */
  function guide() {
    dialog('Explore CR-05', note('Fictional workflow, real distinctions', 'This preview coordinates aftercare follow-up across five views. It does not contact customers, book visits, activate agreements or create CRM records.')
      + `<ol class="guide-list">
      <li><strong>Start on the worklist.</strong> Open <code>SYN-PPO-ACR-000901</code>. Read the distinct recorded outcomes: goods delivered and commissioning are recorded, but the aftercare review is not conducted and a technical issue is open.</li>
      <li><strong>Prepare and hold the review.</strong> Open review preparation, record quoted feedback from Casey Taylor, save the review detail, then try to complete it. It refuses until both outstanding commitments have a disposition.</li>
      <li><strong>Keep the concern separate.</strong> From the record snapshot, link the existing case <code>SYN-PPO-TKT-000201</code> rather than creating a second record. Then prepare a new referral for the dosing-screen fault, submit it, and switch to the Service Manager role to return it for missing information. Correct it and resubmit.</li>
      <li><strong>Training with exact applicability.</strong> Open <code>SYN-PPO-ACR-000905</code> in Training &amp; follow-up. The selected manual is r02 for firmware 3.x while the delivered unit runs 4.2, so it is flagged as superseded. Confirm the arrangement, record attendance, record delivery, then record an assessment. Each is a separate state.</li>
      <li><strong>Renewal, coordinated not owned.</strong> Open <code>SYN-PPO-ACR-000904</code> in Maintenance &amp; renewal and link MA-05 renewal review <code>SYN-MA-RENEWAL-14</code>. The agreement, its proposals and its activation stay with MA-05.</li>
      <li><strong>Upgrade to CRM.</strong> On <code>SYN-PPO-ACR-000903</code>, prepare an upgrade discussion for the excluded Irrigation Block 02 scope, then prepare and submit a CRM handover. Switch to the Commercial reviewer and record Accepted, Returned or Unknown.</li>
      <li><strong>Completed with work still open.</strong> <code>SYN-PPO-ACR-000903</code> already has a completed review with two obligations carried. The review outcome and the outstanding work are shown separately.</li>
      <li><strong>Source change.</strong> Use Preview options to advance an originating record to a new revision, or supersede a selected training material. Earlier content is retained and flagged.</li>
      <li><strong>Lost response.</strong> Set the next save to lose its response, submit a handover, then use Recover original save. The original operation is recognised and no duplicate is created.</li>
      <li><strong>Identity isolation.</strong> Switch to the Training coordinator role: only Willowbank is in scope, and Fernbank records never appear in counts, search, snapshots or exports.</li>
      </ol>
      <details><summary>More review scenarios</summary><p class="small">Preview options can show partial, failed and empty source results, a failed save and a lost response. Export and restore retain the saved records. Roles are presentation controls; the standalone HTML provides no authentication and the receiving application must enforce equivalent scope and permission on the server.</p><p class="small">Attached theme r20; coverage register CR-05 with CS-01, CS-07, SC-07, SV-06/SV-07, EQ-01, MA-01/MA-05, DK-01/DK-02, CR-01/CR-03, SH-02/SH-05 boundaries. Roboto copyright 2011 Google Inc., Apache License 2.0. Full field definitions, provenance and receiving requirements are in the companion report.</p></details>`);
  }
  function options() {
    dialog('Preview options',
      select('role', 'Preview role', Object.keys(M.roles).map(k => [k, `${M.people[M.roles[k].person].name} · ${M.people[M.roles[k].person].title}`]), ui.role)
      + select('mode', 'Source result scenario', [['complete', 'Complete source set'], ['partial', 'Partial · agreement-sourced records unavailable'], ['failed', 'Failed loading · counts unavailable'], ['empty', 'Empty results · records preserved']], mode)
      + select('failure', 'Next source save', [['none', 'Normal save'], ['fail', 'Fail before saving'], ['unknown', 'Lose response after saving']], saveFailure)
      + note('Local demonstration', 'Use fictional data only. Roles illustrate permissions; the standalone HTML does not authenticate anyone. A session export contains the complete fictional fixture, including records outside the selected preview role, so treat an export as unrestricted.')
      + `<div class="row">${button('Export saved session', 'export')}${button('Restore session', 'restore')}${button('Reset demonstration', 'reset')}</div>`
      + (M.can(ui.role, 'scenario') && current() ? `<div class="mt">${button('Demonstrate a source change', 'scenario', `data-id="${esc(ui.selected)}"`)}</div>` : ''),
      fd => {
        ui.role = fd.get('role');
        ui.filters = M.filters(); ui.saved = 'all'; ui.returnTo = null;
        if (!M.roles[ui.role].customers.includes((current() || {customer: ''}).customer)) {
          const first = M.permitted(state, ui.role)[0];
          ui.selected = first ? first.id : null;
          if (!first) ui.view = 'worklist';
        }
        mode = fd.get('mode'); saveFailure = fd.get('failure');
        close(true); render(); save();
      }, {submit: 'Apply preview options'});
  }

  /* ---- Render ---- */
  function render() {
    $('role-label').textContent = me().name + ' · ' + me().title;
    if (damaged) {
      $('tabs').innerHTML = ''; $('context').innerHTML = ''; $('toolbar').innerHTML = '';
      $('content').innerHTML = note('Saved session needs attention', 'The original content is preserved. Export it before resetting this demonstration.', 'warning')
        + `<div class="row mt">${button('Export original content', 'raw')}${button('Reset demonstration', 'reset')}</div>`;
      $('save-status').textContent = 'Saved session could not be read';
      decorate(); return;
    }
    $('tabs').innerHTML = M.views.map(v => `<button type="button" data-view="${v}" aria-current="${ui.view === v ? 'page' : 'false'}">${esc(M.viewTitles[v])}</button>`).join('');
    $('recovery').innerHTML = external
      ? note('Another tab changed this session', 'Copy unsaved entries and export saved records before reloading. This tab cannot overwrite the newer session.', 'warning')
      : pending
        ? note('Save response needs recovery', `The original operation may already be recorded. ${button('Recover original save', 'recover', '', 'small-button')}`, 'warning')
        : !storageOK ? note('Session-only storage', 'Browser storage is unavailable, so this session is held in memory only. Export saved records before closing. This is browser persistence in one browser; it is not cross-device or production offline capability.', 'warning') : '';
    $('context').innerHTML = contextCard();
    const customers = state.customers.filter(c => M.roles[ui.role].customers.includes(c.id));
    const sites = customers.flatMap(c => c.sites);
    $('toolbar').innerHTML = ui.view === 'worklist'
      ? `<section class="filter-panel" aria-label="Aftercare worklist controls"><div class="filter-top"><label class="search-field"><span class="sr-only">Search aftercare records</span>${icon('search')}<input id="search" aria-label="Search aftercare records" placeholder="Search reference, customer, site, equipment or owner…" value="${esc(ui.filters.q)}" maxlength="200"></label>${select('filter-saved', 'View', M.savedViews.map(v => [v, M.savedViewTitles[v]]), ui.saved)}</div>
      <div class="filter-bottom">${select('filter-customer', 'Customer', [['', 'All permitted customers'], ...customers.map(c => [c.id, c.name])], ui.filters.customer)}${select('filter-site', 'Site', [['', 'All sites'], ...sites.map(s => [s.id, s.name])], ui.filters.site)}${select('filter-owner', 'Owner', [['all', 'All owners'], ['mine', 'My records'], ...M.owners], ui.filters.owner)}${select('filter-source', 'Source type', [['', 'All source types'], ...M.sourceKinds], ui.filters.source)}${select('filter-reason', 'Follow-up reason', [['', 'All reasons'], ...M.reasons], ui.filters.reason)}${select('filter-state', 'State', [['', 'All states'], ...M.states], ui.filters.state)}${select('filter-due', 'Due date', [['', 'All dates'], 'Overdue', 'Today', 'Upcoming', 'Date needed'], ui.filters.due)}${button('Clear filters', 'clear', '', 'link-button')}</div></section>`
      : '';
    const content = {worklist: worklistView, review: reviewView, training: trainingView, commercial: commercialView, history: historyView};
    $('content').innerHTML = content[ui.view]();
    decorate();
    $('save-status').textContent = storageOK ? 'Saved in this browser' : 'Session only · export before closing';
  }

  /* ---- Events ---- */
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { close(); return; }
    const nav = e.target.closest('#tabs [data-view]');
    if (nav && !nav.disabled) { navigate(nav.dataset.view); return; }
    const el = e.target.closest('[data-action]');
    if (el && !el.disabled) { try { act(el.dataset.action, el); } catch (err) { toast(err.message); } }
  });
  document.addEventListener('input', e => {
    if (e.target.closest('#modal-body') && handler) formDirty = true;
    if (e.target.id === 'search') {
      const pos = e.target.selectionStart;
      ui.filters.q = e.target.value;
      render();
      const box = $('search');
      if (box) { box.focus(); box.setSelectionRange(pos, pos); }
      save();
    }
  });
  document.addEventListener('change', e => {
    if (e.target.closest('#modal-body') && handler) formDirty = true;
    if (e.target.closest('#toolbar')) {
      const key = e.target.name.replace('filter-', '');
      if (key === 'saved') { ui.saved = e.target.value; render(); save(); return; }
      if (['customer', 'site', 'owner', 'source', 'reason', 'state', 'due'].includes(key)) { ui.filters[key] = e.target.value; render(); save(); }
    }
  });
  $('modal-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!handler || busy) return;
    busy = true; $('modal-submit').disabled = true;
    try { await handler(new FormData(e.target)); }
    catch (err) { $('modal-error').hidden = false; $('modal-error').textContent = err.message; $('modal-error').focus(); }
    finally { busy = false; $('modal-submit').disabled = false; }
  });
  $('modal').addEventListener('cancel', e => { e.preventDefault(); close(); });
  $('tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const a = [...$('tabs').querySelectorAll('button:not(:disabled)')], i = a.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? a.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + a.length) % a.length;
    a[j].focus();
  });
  window.addEventListener('beforeunload', e => { if (formDirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('storage', e => {
    if (e.key !== KEY) return;
    if ($('modal').open || pending) { external = true; render(); toast('Another tab changed this session; this tab cannot overwrite it.'); }
    else location.reload();
  });
  globalThis.AC_DEMO = {state: () => M.clone(state), ui: () => M.clone(ui), mode: () => mode};

  function init() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const e = JSON.parse(raw);
        if (e.schema !== 'ppo-sales-aftercare-session/v1') throw new Error('Unsupported session');
        M.validate(e.state);
        state = e.state;
        if (e.ui && M.roles[e.ui.role] && M.views.includes(e.ui.view) && M.savedViews.includes(e.ui.saved)) {
          M.query(state, e.ui.role, e.ui.filters, e.ui.saved);
          ui = Object.assign({returnTo: null}, e.ui);
        }
      }
    } catch (e) {
      try { damaged = localStorage.getItem(KEY); } catch { storageOK = false; }
      if (!damaged) storageOK = false;
      console.warn('CR-05 session requires recovery:', e.message);
    }
    render();
    if (!damaged) save();
  }
  init();
})();
