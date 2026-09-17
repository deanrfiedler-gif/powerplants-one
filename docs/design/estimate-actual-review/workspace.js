(function () {
  'use strict';
  const M = globalThis.EAR_MODEL, KEY = 'ppo-estimate-actual-review-r01';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const icons = {
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>',
    scale: '<path d="M12 4v16M6 8h12M4 12l2-4 2 4a2 2 0 0 1-4 0Zm12 0 2-4 2 4a2 2 0 0 1-4 0Z"/>',
    link: '<path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 3a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/>'
  };
  const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.file}</svg>`;
  const tabs = [['register', 'Outcome review register'], ['basis', 'Estimate & accepted basis'], ['actuals', 'Actuals & source reconciliation'], ['variance', 'Variance review'], ['lessons', 'Lessons & proposals']];
  const namedViews = [
    ['all', 'All reviews'], ['awaiting', 'Awaiting evidence'], ['ready', 'Ready for review'],
    ['inreview', 'In review'], ['findings', 'Findings requiring action'], ['reviewed', 'Reviewed']
  ];

  let state = M.seed();
  let ui = {view: 'register', selected: 'ear-1', role: 'preparer', search: '', customer: 'all', owner: 'all', family: 'all', delivery: 'all', status: 'all', completeness: 'all', named: 'all', sourceFilter: 'all', returnTo: null};
  let storageOK = true, damaged = null, nextFailure = 'none', submitHandler = null, originFocus = null, toastTimer = null, busy = false, pending = null;

  const selected = () => state.reviews.find(r => r.id === ui.selected) || state.reviews[0];
  const allow = action => M.can(ui.role, action);
  const sees = () => M.seesRestricted(ui.role);
  const formatDate = d => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}) : 'Not recorded';
  const stampTime = d => new Date(d).toLocaleString('en-AU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne'}) + ' AEST';
  const group = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rawMoney = v => {
    const negative = v < 0, text = group((Math.abs(v) / 100).toFixed(2));
    return (negative ? '(' + text + ')' : text);
  };
  const money = (v, opts) => {
    if (v === null || v === undefined) return `<span class="withheld">${esc((opts && opts.blank) || 'Not established')}</span>`;
    if (!sees()) return '<span class="withheld">Restricted</span>';
    return esc(rawMoney(v));
  };
  const signed = v => {
    if (v === null || v === undefined) return '<span class="withheld">Not established</span>';
    if (!sees()) return '<span class="withheld">Restricted</span>';
    const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'nil';
    return `<span class="${cls}">${v > 0 ? '+' : v < 0 ? '−' : ''}${esc(group((Math.abs(v) / 100).toFixed(2)))}</span>`;
  };
  const pct = c => c.percent === null ? `<span class="withheld" title="${esc(c.percentReason)}">n/a</span>` : `${c.percent > 0 ? '+' : ''}${c.percent.toFixed(2)}%`;
  /* Narrative recorded beside restricted values may quote a supplier or labour
     rate in free text. Those fields are withheld from a role that cannot see the
     values themselves, in the page, in summaries and in the export. */
  const narrative = value => sees() ? esc(value ?? '') : '<span class="withheld">Restricted narrative</span>';
  const qty = v => v === null || v === undefined ? '<span class="withheld">Not established</span>' : esc(M.quantity(v));
  const tone = s => /Reviewed$|Complete|Included|Confirmed|Closed|Handed/.test(s) ? 'success' : /Not comparable|Returned|Unavailable|Unresolved|duplicate/.test(s) ? 'danger' : /Await|Partial|Draft|provisional|Commitment|Open|Suggestion|In review/.test(s) ? 'warning' : 'info';
  const tag = (s, kind) => `<span class="tag ${kind || tone(s)}">${esc(s)}</span>`;
  const btn = (label, action, data, classes, disabled) => `<button type="button" data-action="${action}" ${data || ''} class="${classes || ''}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  const facts = rows => `<dl class="facts">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const note = (title, body, type) => `<div class="note ${type || ''}"><strong>${esc(title)}</strong><div>${body}</div></div>`;
  const heading = (title, subtitle, actions) => `<div class="page-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="row">${actions || ''}</div></div>`;
  const card = (title, body, footer, sub) => `<section class="card"><div class="card-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>${body}${footer ? `<div class="card-foot">${footer}</div>` : ''}</section>`;
  const empty = (title, body, action) => `<div class="empty"><h2>${esc(title)}</h2><p>${esc(body)}</p>${action || ''}</div>`;
  const field = (name, label, value, type, attrs) => `<label class="field" for="field-${name}"><span>${label}</span><input id="field-${name}" name="${name}" type="${type || 'text'}" value="${esc(value ?? '')}" ${attrs || ''}></label>`;
  const textarea = (name, label, value, required) => `<label class="field" for="field-${name}"><span>${label}</span><textarea id="field-${name}" name="${name}" maxlength="2000" ${required === false ? '' : 'required'}>${esc(value ?? '')}</textarea></label>`;
  const selectField = (name, label, options, value) => `<label class="field" for="field-${name}"><span id="label-${name}">${label}</span><select id="field-${name}" name="${name}" aria-labelledby="label-${name}">${options.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select></label>`;
  const confirmField = label => `<label class="check-label"><input type="checkbox" name="confirm" required><span>${label}</span></label>`;
  const ownerDue = (name, due) => `<div class="two">${selectField('owner', 'Responsible owner', M.people, name || 'Jordan Blake')}${field('due', 'Due date', due || M.TODAY, 'date', 'required')}</div>`;

  const refBase = 'https://github.com/deanrfiedler-gif/powerplants-one/blob/main/';
  const receiving = {
    estimating: ['ES-08 Specialist configuration workbench', 'docs/reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html'],
    quoting: ['ES-06 Quotation module r03', 'docs/reference/ui/quoting/ppo-quotation-module-r03.html'],
    projects: ['Project delivery readiness & change control r02', 'docs/reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html'],
    service: ['Service review & reports r02', 'docs/reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html'],
    supply: ['Supply chain material readiness r03', 'docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html'],
    warranty: ['Warranty & customer resolution r01', 'docs/reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html'],
    finance: ['Finance & commercial controls r02', 'docs/reference/ui/finance/PPO-Finance-and-Commercial-Controls-r02.html'],
    work: ['Work orders workspace r01', 'docs/reference/ui/service/PPO-Work-Orders-Workspace-r01.html']
  };
  const link = key => `<a href="${refBase}${receiving[key][1]}" rel="noreferrer">${esc(receiving[key][0])}</a>`;

  /* ------------------------------------------------------------- storage */
  function persist() {
    if (damaged) return;
    try { localStorage.setItem(KEY, JSON.stringify({schema: M.SCHEMA, state, ui})); storageOK = true; } catch { storageOK = false; }
    $('save-status').textContent = storageOK ? 'Saved in this browser' : 'Session only · export before closing';
  }
  function restore() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch { storageOK = false; return; }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      state = M.validate(parsed.state);
      ui = Object.assign(ui, parsed.ui || {});
      if (!state.reviews.some(r => r.id === ui.selected)) ui.selected = state.reviews[0].id;
    } catch (error) { damaged = {raw, message: error.message}; }
  }
  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5200);
  }

  /* ------------------------------------------------------------ commands */
  function send(type, payload, options) {
    const opts = options || {};
    const cmd = {op: opts.op || `op-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      type, payload, reviewId: opts.reviewId || selected().id, expectedVersion: state.version, at: new Date().toISOString()};
    if (nextFailure === 'fail') { nextFailure = 'none'; throw new Error('The record could not be saved. Nothing was changed; your entries are preserved.'); }
    const result = M.command(state, cmd, ui.role);
    if (nextFailure === 'unknown') {
      nextFailure = 'none'; pending = {cmd, role: ui.role};
      state = result.state; persist(); render();
      throw new Error('The response to this save was lost. The record may or may not have been accepted. Recover the original operation before trying again.');
    }
    state = result.state; pending = null; persist();
    return result;
  }

  /* --------------------------------------------------------------- modal */
  function openModal(config) {
    originFocus = document.activeElement;
    $('modal-kicker').textContent = config.kicker || 'Outcome review';
    $('modal-title').textContent = config.title;
    $('modal-body').innerHTML = config.body;
    $('modal-error').hidden = true; $('modal-error').textContent = '';
    $('modal-submit').hidden = !config.onSubmit;
    $('modal-submit').textContent = config.submitLabel || 'Save';
    $('cancel-button').textContent = config.cancelLabel || (config.onSubmit ? 'Cancel' : 'Close');
    $('modal').classList.toggle('drawer', Boolean(config.drawer));
    submitHandler = config.onSubmit || null;
    $('modal').showModal();
    const firstField = $('modal-body').querySelector('input:not([type=hidden]),select,textarea,button');
    if (firstField) firstField.focus();
  }
  function closeModal() {
    $('modal').close(); submitHandler = null;
    if (originFocus && document.contains(originFocus)) originFocus.focus();
  }
  function formValues() {
    const data = new FormData($('modal-form')), values = {};
    data.forEach((value, key) => {
      if (values[key] === undefined) values[key] = value;
      else if (Array.isArray(values[key])) values[key].push(value);
      else values[key] = [values[key], value];
    });
    $('modal-body').querySelectorAll('input[type=checkbox]').forEach(box => {
      if (box.name && box.name !== 'confirm' && box.dataset.list) {
        values[box.name] = values[box.name] === undefined ? [] : (Array.isArray(values[box.name]) ? values[box.name] : [values[box.name]]);
      }
    });
    values.confirm = Boolean($('modal-body').querySelector('input[name=confirm]:checked'));
    return values;
  }
  function multi(name) {
    return Array.from($('modal-body').querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
  }

  /* ----------------------------------------------------------- rendering */
  function stateTag(r) {
    const label = M.STATE_LABELS[r.state];
    const kind = r.state === 'Reviewed' ? 'success' : r.state === 'NotComparable' ? 'danger' : r.state === 'ReviewedProvisional' ? 'warning' : r.state === 'Returned' ? 'danger' : r.state === 'InReview' ? 'info' : 'warning';
    return tag(label, kind);
  }
  function namedMatch(r, key) {
    const openFindings = r.findings.filter(f => f.state === 'Suggestion' || f.state === 'Reviewed proposal').length;
    if (key === 'awaiting') return r.state === 'Draft' || r.state === 'AwaitingEvidence' || r.state === 'NotComparable';
    if (key === 'ready') return r.state === 'ReadyForReview';
    if (key === 'inreview') return r.state === 'InReview' || r.state === 'Returned';
    if (key === 'findings') return openFindings > 0 || r.actions.some(a => a.status === 'Open');
    if (key === 'reviewed') return r.state === 'Reviewed' || r.state === 'ReviewedProvisional';
    return true;
  }
  function filtered() {
    const term = ui.search.trim().toLowerCase();
    return state.reviews.filter(r => {
      if (!namedMatch(r, ui.named)) return false;
      if (ui.customer !== 'all' && r.customerId !== ui.customer) return false;
      if (ui.owner !== 'all' && r.reviewOwner !== ui.owner && r.deliveryOwner !== ui.owner && r.estimator !== ui.owner) return false;
      if (ui.family !== 'all' && r.equipmentFamily !== ui.family) return false;
      if (ui.delivery !== 'all' && r.deliveryType !== ui.delivery) return false;
      if (ui.status !== 'all' && r.state !== ui.status) return false;
      if (ui.completeness !== 'all' && r.completeness !== ui.completeness) return false;
      if (!term) return true;
      /* Searchable text deliberately excludes every restricted money value. */
      return [r.ref, r.title, r.customer, r.site, r.deliveryRef, r.estimateRef, r.acceptedQuoteRef, r.opportunityRef, r.equipmentFamily, r.workCategory, r.estimator, r.deliveryOwner, r.reviewOwner]
        .join(' ').toLowerCase().includes(term);
    });
  }
  function nextAction(r) {
    if (r.state === 'NotComparable') return 'Recorded as not comparable. Reopen only when the evidence changes.';
    if (r.refreshRequired) return 'Sources changed after the comparison was captured — refresh before concluding.';
    if (r.state === 'Draft' || r.state === 'AwaitingEvidence') {
      const blockers = M.submitBlockers(r);
      return blockers.length ? blockers[0] : 'Ready to submit for review.';
    }
    if (r.state === 'ReadyForReview') return 'Awaiting a reviewer to claim it.';
    if (r.state === 'Returned') return `Returned: ${r.stateReason}`;
    if (r.state === 'InReview') {
      const blockers = M.concludeBlockers(r);
      return blockers.length ? blockers[0] : 'Every material variance is explained; the review can be concluded.';
    }
    const open = r.outstanding.filter(o => o.status === 'Open').length;
    if (r.state === 'ReviewedProvisional') return `Provisional — ${open} financial matter${open === 1 ? '' : 's'} still open.`;
    return 'Concluded. Corrections are made through a successor review.';
  }

  function renderContext() {
    const r = selected();
    const options = state.reviews.map(x => [x.id, `${x.ref} · ${x.customer} · ${x.title}`]);
    $('context').innerHTML = `<div class="context"><div>
      <span class="eyebrow">Selected outcome review</span>
      <h2>${esc(r.ref)} · ${esc(r.title)}</h2>
      <p class="small">${esc(r.customer)} · ${esc(r.site)} · ${esc(r.equipmentFamily)} · ${esc(r.deliveryType)} ${esc(r.deliveryRef)}</p>
      <p class="small">Estimate ${esc(r.estimateRef)} · accepted quotation ${esc(r.acceptedQuoteRef)} issue ${esc(r.acceptedIssue)} · scope cut-off ${esc(formatDate(r.scopeCutOff))}</p>
      <div class="row space-top">${stateTag(r)}${tag('Sources: ' + r.completeness)}${r.financeValidated ? tag('Finance validated', 'success') : tag('Finance validation outstanding', 'warning')}${r.refreshRequired ? tag('Source changed after capture', 'danger') : ''}${r.supersedes ? tag('Successor review', 'info') : ''}${r.supersededBy ? tag('Superseded by a successor', 'info') : ''}</div>
    </div><div class="context-controls">
      <label for="review-select"><span class="tiny">Select outcome review</span><select id="review-select">${options.map(([v, t]) => `<option value="${esc(v)}" ${v === r.id ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
      <div class="row">${btn(icon('file') + 'Delivery snapshot', 'snapshot', 'data-kind="delivery"', 'small-button')}${btn(icon('link') + 'Receiving links', 'snapshot', 'data-kind="receiving"', 'small-button')}</div>
    </div></div>`;
  }

  /* --------------------------------------------------- view 1: register */
  function viewRegister() {
    const rows = filtered();
    const counts = key => state.reviews.filter(r => namedMatch(r, key)).length;
    const uniq = (list) => Array.from(new Set(list));
    const cells = [
      ['awaiting', 'Awaiting evidence', counts('awaiting'), 'Sources incomplete or a basis is not declared'],
      ['ready', 'Ready for review', counts('ready'), 'Submitted with every source dispositioned'],
      ['inreview', 'In review', counts('inreview'), 'Claimed or returned for correction'],
      ['findings', 'Findings requiring action', counts('findings'), 'Open suggestions, proposals or owned actions'],
      ['reviewed', 'Reviewed', counts('reviewed'), 'Concluded, including provisional conclusions']
    ];
    return `${heading('Outcome review register', 'Delivery completion and financial completeness are separate. A completed job may still carry unposted cost, an open supplier claim or an unresolved allocation, so an incomplete source set is never shown as a zero-cost job or a favourable variance.')}
    <div class="snapshot">${cells.map(([key, label, count, sub]) => `<button type="button" data-action="named" data-named="${key}" aria-pressed="${ui.named === key}"><strong>${count}</strong><span>${esc(label)}</span><small>${esc(sub)}</small></button>`).join('')}</div>
    <section class="card">
      <div class="toolbar">
        <div class="search">${icon('search')}<input id="register-search" type="search" value="${esc(ui.search)}" placeholder="Search reviews, customers and references" aria-label="Search outcome reviews"></div>
        ${[['customer', 'Customer', [['all', 'All customers']].concat(uniq(state.reviews.map(r => r.customerId)).map(id => [id, state.reviews.find(r => r.customerId === id).customer]))],
          ['owner', 'Owner', [['all', 'All owners']].concat(uniq(state.reviews.flatMap(r => [r.estimator, r.deliveryOwner, r.reviewOwner])).map(n => [n, n]))],
          ['family', 'Equipment family', [['all', 'All families']].concat(uniq(state.reviews.map(r => r.equipmentFamily)).map(n => [n, n]))],
          ['delivery', 'Delivery type', [['all', 'All delivery types']].concat(uniq(state.reviews.map(r => r.deliveryType)).map(n => [n, n]))],
          ['status', 'Review status', [['all', 'All statuses']].concat(M.STATES.map(s => [s, M.STATE_LABELS[s]]))],
          ['completeness', 'Source completeness', [['all', 'All completeness']].concat(M.COMPLETENESS.map(s => [s, s]))]
        ].map(([name, label, options]) => `<label class="tiny" for="filter-${name}"><span class="tiny">${esc(label)}</span><select id="filter-${name}" data-filter="${name}">${options.map(([v, t]) => `<option value="${esc(v)}" ${ui[name] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}
        ${btn('Clear all', 'clear', '', 'small-button')}
      </div>
      <p class="count-line">${rows.length} of ${state.reviews.length} reviews shown · view: ${esc(namedViews.find(v => v[0] === ui.named)[1])}${ui.named === 'all' ? '' : ' · select the same summary cell again to return to all reviews'} · amounts in AUD excluding GST${sees() ? '' : ' · amounts restricted for this role'}</p>
      ${rows.length === 0 ? empty('No matching reviews', 'No outcome review matches the current search and filters. Clearing them restores the full register without losing your selected review.', btn('Clear all', 'clear', '', 'primary')) : `
      <div class="scroll-x"><table class="queue-table"><thead><tr>
        <th scope="col">Review</th><th scope="col">Customer and site</th><th scope="col">Commercial references</th><th scope="col">Delivery</th>
        <th scope="col">Owners</th><th scope="col">Cut-off</th><th scope="col">Status</th><th scope="col">Sources</th><th scope="col">Next action</th>
      </tr></thead><tbody>${rows.map(r => {
        const t = M.totals(r);
        const openItems = r.outstanding.filter(o => o.status === 'Open').length;
        return `<tr class="${r.id === ui.selected ? 'selected-row' : ''}">
        <td data-label="Review"><button type="button" class="link-button" data-action="select" data-review="${r.id}"><span class="record-title">${esc(r.title)}</span></button><span class="record-ref">${esc(r.ref)}${r.supersedes ? ' · successor' : ''}</span></td>
        <td data-label="Customer and site">${esc(r.customer)}<span class="record-ref">${esc(r.site)} · ${esc(r.equipmentFamily)}</span></td>
        <td data-label="Commercial references">${esc(r.opportunityRef)}<span class="record-ref">${esc(r.estimateRef)} · ${esc(r.acceptedQuoteRef)} ${esc(r.acceptedIssue)}</span></td>
        <td data-label="Delivery">${esc(r.deliveryType)}<span class="record-ref">${esc(r.deliveryRef)}</span></td>
        <td data-label="Owners">${esc(r.reviewOwner)}<span class="record-ref">Estimator ${esc(r.estimator)} · delivery ${esc(r.deliveryOwner)}</span></td>
        <td data-label="Cut-off">${esc(formatDate(r.scopeCutOff))}<span class="record-ref">Last source ${esc(formatDate(r.history[r.history.length - 1].at.slice(0, 10)))} · rev ${r.sourceRevision}</span></td>
        <td data-label="Status">${stateTag(r)}${openItems ? `<span class="record-ref">${openItems} financial matter${openItems === 1 ? '' : 's'} open</span>` : ''}</td>
        <td data-label="Sources">${tag(r.completeness)}<span class="record-ref">${t.comparableLines} comparable line${t.comparableLines === 1 ? '' : 's'}${t.withheld.length ? ` · ${t.withheld.length} withheld` : ''}</span></td>
        <td data-label="Next action"><p class="next-action">${esc(nextAction(r))}</p></td></tr>`;
      }).join('')}</tbody></table></div>`}
      <div class="card-foot">Selecting a review keeps the current search, filters and named view. Returning from a review restores this list unchanged.</div>
    </section>`;
  }

  /* ------------------------------------------------------ view 2: basis */
  function basisCard(b, kind, r) {
    const complete = b.lines.every(l => l.cost !== null);
    return card(`${esc(b.label)} · ${esc(b.id)}`, `<div class="pad">
      ${facts([
        ['Saved version', esc(b.versionRef)],
        ['Saved at', esc(stampTime(b.savedAt))],
        ['Commercial option', esc(b.option)],
        ['Cost schema', esc(b.costSchema)],
        ['Calculator / formula', esc(b.calculator)],
        ['Currency and tax', `${esc(r.comparison.currency)} · ${esc(r.comparison.taxBasis)}`]
      ])}
      <div class="section-label">Cost lines</div>
      <div class="scroll-x"><table><thead><tr><th scope="col">Code</th><th scope="col">Line</th><th scope="col" class="num">Quantity</th><th scope="col">Unit</th><th scope="col" class="num">Rate</th><th scope="col" class="num">Cost</th></tr></thead>
      <tbody>${b.lines.map(l => `<tr><td>${esc(l.code)}</td><td>${esc(l.label)}</td><td class="num">${qty(l.qty)}</td><td>${esc(l.unit)}</td><td class="num">${money(l.rate)}</td><td class="num">${money(l.cost)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="5">Estimated cost total</td><td class="num">${complete ? money(b.lines.reduce((s, l) => s + l.cost, 0)) : '<span class="withheld">Not established</span>'}</td></tr></tfoot></table></div>
      <div class="section-label">Supplier price sources</div>
      ${b.supplierSources.length ? b.supplierSources.map(s => `<p class="small">${esc(s.ref)} · ${esc(s.supplier)} · ${esc(s.scope)} · ${esc(s.currency)} · valid until ${esc(formatDate(s.validUntil))}</p>`).join('') : '<p class="small">No supplier price source recorded on this version.</p>'}
      <div class="section-label">Quoted selling price</div>
      <p class="small">${money(b.price.total)} — ${esc(b.price.note)} A quoted selling price is not a cost basis.</p>
    </div>`, `${btn(icon('file') + 'Inspect source snapshot', 'snapshot', `data-kind="basis" data-basis="${kind}"`, 'small-button')}`);
  }

  function viewBasis() {
    const r = selected(), t = M.totals(r), b = r.basisSelection;
    const changeRows = r.approvedChanges.map(c => `<div class="item-row">
      <div class="row between"><div><strong>${esc(c.ref)} — ${esc(c.title)}</strong><p class="small">Approved ${esc(formatDate(c.approvedAt))} · ${narrative(c.reason)}</p></div>
      <div>${c.costBasisRecorded ? tag('Cost basis recorded', 'success') : tag('No cost basis recorded', 'danger')}</div></div>
      <div class="source-meta"><span>Selling price ${money(c.price)}</span><span>${b.includeChanges.includes(c.id) ? 'Included in the comparison basis' : b.acknowledgedMissingCost.includes(c.id) ? 'Acknowledged without a cost basis' : 'Not yet dispositioned'}</span><span>${esc(c.evidence)}</span></div>
      ${c.costBasisRecorded ? `<div class="scroll-x"><table><thead><tr><th scope="col">Code</th><th scope="col">Line</th><th scope="col" class="num">Quantity</th><th scope="col">Unit</th><th scope="col" class="num">Rate</th><th scope="col" class="num">Cost</th></tr></thead><tbody>${c.lines.map(l => `<tr><td>${esc(l.code)}</td><td>${esc(l.label)}</td><td class="num">${qty(l.qty)}</td><td>${esc(l.unit)}</td><td class="num">${money(l.rate)}</td><td class="num">${money(l.cost)}</td></tr>`).join('')}</tbody></table></div>`
        : note('An approved variation’s selling price is not its cost budget', `No estimating cost version was prepared for ${esc(c.ref)}. Its attributable actual is reported separately and no variance is computed against a price.`, 'warning')}
    </div>`).join('');

    const commercial = M.commercialTotals(r);
    return `${heading('Estimate and accepted comparison basis', 'The issued basis, the accepted basis and each approved change are held separately. A combined comparison basis names exactly which records it includes; it never overwrites an original.',
      `${allow('selectBasis') ? btn(icon('scale') + 'Declare comparison basis', 'basis', '', 'primary') : ''}`)}
    ${b.declared
      ? note('Declared comparison basis', `${esc(b.note)}<br>Declared by ${esc(b.declaredBy)} on ${esc(stampTime(b.declaredAt))}. Includes: accepted cost version ${esc(r.bases.accepted.id)}${t.basis.includedChanges.length ? ' plus ' + esc(t.basis.includedChanges.join(', ')) : ''}.${t.basis.missingCostChanges.length ? ` Acknowledged without a cost basis: ${esc(t.basis.missingCostChanges.join(', '))}.` : ''}`, 'success')
      : note('No comparison basis is declared yet', 'Select which saved cost version and which approved changes this comparison uses. Until that is recorded the workspace will not accept a submission, and the latest estimate is never substituted for the historical version being assessed.', 'warning')}
    <div class="two mt">${basisCard(r.bases.issued, 'issued', r)}${basisCard(r.bases.accepted, 'accepted', r)}</div>
    <div class="mt">${card('Approved scope changes', changeRows || '<div class="pad"><p class="small">No approved variation is recorded against this delivery scope.</p></div>', 'Each approved change carries its own cost basis. Where none was prepared, the gap is shown rather than filled from the selling price.')}</div>
    <div class="mt">${card('Commercial movement — selling price only', `<div class="pad">
      ${facts([
        ['Issued quoted price', money(commercial.issued)],
        ['Accepted quotation price', money(commercial.accepted)],
        ['Movement between them', signed(commercial.negotiationMovement)],
        ['Approved change selling price', money(commercial.changes)],
        ['Accepted plus approved changes', money(commercial.acceptedPlusChanges)]
      ])}
      <div class="section-label">Recorded components of the movement</div>
      ${commercial.components.length ? commercial.components.map(c => `<div class="decision"><strong>${esc(c.type)}</strong> ${signed(c.amount)}<p>${narrative(c.reason)}</p><p class="tiny">${esc(formatDate(c.at))} · ${narrative(c.evidence)}</p></div>`).join('') : '<p class="small">No negotiated price change is recorded for this offer.</p>'}
      ${note('Margin and profitability are withheld', esc(commercial.marginReason), 'neutral')}
    </div>`, 'A customer discount changes the commercial outcome without changing the cost estimate. These figures never enter the cost comparison.')}</div>
    <div class="mt">${card('Exclusions, assumptions and scope boundary', `<div class="pad">${facts([
      ['Comparison currency', esc(r.comparison.currency)],
      ['Tax basis', esc(r.comparison.taxBasis)],
      ['Quantity class', esc(r.comparison.quantityClass)],
      ['Cost definition', esc(r.comparison.costDefinition)],
      ['Scope cut-off', esc(formatDate(r.scopeCutOff))],
      ['Reporting cut-off', esc(formatDate(r.reportingCutOff))]
    ])}${r.financeValidated ? '' : note('Finance validation outstanding', 'The declared cost definition and quantity class have not been validated by Finance for this review.', 'warning')}
    ${allow('financeValidate') ? `<div class="source-actions">${btn(icon('check') + 'Validate the declared basis', 'financeValidate', '', 'small-button')}</div>` : ''}</div>`)}</div>`;
  }

  /* ---------------------------------------------------- view 3: actuals */
  function observationRow(r, o) {
    const share = M.mappedShare(r, o.id);
    const maps = r.mappings.filter(m => m.observationId === o.id);
    const conflicts = M.duplicateConflicts(r).filter(c => c.refs.includes(o.ref));
    return `<div class="source-row" data-obs-row="${o.id}">
      <div class="row between"><div><strong>${esc(o.ref)} — ${esc(o.description)}</strong>
      <p class="small">${esc(o.system)} · ${esc(o.entity)} · record ${esc(o.recordRef)} · ${esc(o.lineRef)}</p></div>
      <div class="row">${tag(o.treatment)}${tag(o.quantityClass, 'source')}</div></div>
      <div class="source-meta">
        <span>Scope: ${esc(o.scopeRef)}</span>
        <span>Quantity: ${qty(o.qty)} ${esc(o.unit)}</span>
        <span>Rate: ${money(o.rate)}</span>
        <span>Amount: ${money(o.amount)} ${esc(o.currency)}</span>
        <span>${esc(o.taxBasis)}</span>
        <span>Date: ${esc(formatDate(o.date))}</span>
        <span>Source status: ${esc(o.sourceStatus)} · v${o.sourceVersion}</span>
        <span>Observed: ${esc(formatDate(o.observedAt))}</span>
      </div>
      ${o.treatmentReason ? `<p class="small">Treatment reason: ${narrative(o.treatmentReason)}</p>` : ''}
      ${o.question ? note('Reviewer question', `${narrative(o.question)}${o.reviewer ? ` — ${esc(o.reviewer)}` : ''}`, 'warning') : ''}
      ${conflicts.length ? note('Possible duplicate', `This observation shares the source key <span class="mono">${esc(conflicts[0].key)}</span> with ${esc(conflicts[0].refs.filter(x => x !== o.ref).join(', '))}. Exclude one with a reason before submitting.`, 'danger') : ''}
      ${maps.length ? `<div class="section-label">Allocation</div>${maps.map(m => {
        const l = M.lineOf(r, m.lineId), basis = M.ALLOCATION_BASES.find(b => b.id === m.basis);
        return `<p class="small">${Math.round(m.share * 1000) / 10}% to ${esc(l.code)} — ${esc(l.label)} · basis: ${esc(basis.label)}${basis.adopted ? '' : ' (proposed basis, not adopted)'} · ${narrative(m.reason)} ${allow('unmap') ? btn('Remove', 'unmap', `data-map="${m.id}"`, 'link-button') : ''}</p>`;
      }).join('')}${share < 0.9995 ? note('Unallocated remainder', `${Math.round((1 - share) * 1000) / 10}% of this record is not allocated to any comparison line. ${o.unmappedReason ? narrative(o.unmappedReason) : 'A recorded reason is required before submission.'}`, 'warning') : ''}`
      : o.treatment === 'Included' ? note('Not allocated', 'This included record is not allocated to any comparison line. Allocate it, or record why it cannot be mapped.', 'warning') : ''}
      <div class="source-actions">
        ${allow('treat') ? btn('Set treatment', 'treat', `data-obs="${o.id}"`, 'small-button') : ''}
        ${allow('map') && o.treatment === 'Included' && share < 0.9995 ? btn('Allocate to a line', 'map', `data-obs="${o.id}"`, 'small-button') : ''}
        ${allow('conversion') ? btn('Record a reviewed conversion', 'conversion', `data-obs="${o.id}"`, 'small-button') : ''}
        ${btn('Source snapshot', 'snapshot', `data-kind="observation" data-obs="${o.id}"`, 'small-button')}
      </div></div>`;
  }

  function viewActuals() {
    const r = selected(), t = M.totals(r);
    const term = ui.search.trim().toLowerCase();
    const list = r.observations.filter(o => {
      if (ui.sourceFilter !== 'all' && o.treatment !== ui.sourceFilter) return false;
      if (!term) return true;
      return [o.ref, o.description, o.system, o.recordRef, o.lineRef, o.scopeRef, o.category, o.quantityClass, o.sourceStatus].join(' ').toLowerCase().includes(term);
    });
    const blockers = M.submitBlockers(r);
    return `${heading('Actuals and source reconciliation', 'Ordered, received, issued, used, returned, invoiced and paid are preserved as distinct facts. A purchase order is a commitment, captured hours are not reviewed hours, and customer invoices are not job costs.',
      `${allow('completeness') ? btn('Declare completeness', 'completeness', '', 'small-button') : ''}${allow('outstanding') ? btn('Record an outstanding matter', 'outstanding', '', 'small-button') : ''}${allow('submit') ? btn(icon('arrow') + 'Submit for review', 'submit', '', 'primary', blockers.length > 0) : ''}`)}
    ${blockers.length ? note(`${blockers.length} matter${blockers.length === 1 ? '' : 's'} must be resolved before submission`, `<ul>${blockers.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`, 'warning') : note('Every source observation is dispositioned', 'The comparison basis is declared, no duplicate source key remains included, and every unallocated remainder carries a reason.', 'success')}
    <div class="three mt">
      ${card('Included in the comparison', `<div class="pad">${facts([
        ['Attributable actual cost', money(t.actual)],
        ['Comparable lines', String(t.comparableLines)],
        ['Actual with no estimated basis', money(t.actualWithoutBasis)]
      ])}</div>`, 'Only included observations contribute.')}
      ${card('Held out of the comparison', `<div class="pad">${facts([
        ['Commitments not incurred', money(t.commitmentTotal)],
        ['Unresolved amounts', money(t.unresolvedTotal)],
        ['Unmapped remainder', money(t.unmappedTotal)]
      ])}</div>`, 'Shown separately; never netted against actual cost.')}
      ${card('Outstanding financial matters', `<div class="pad">${r.outstanding.length ? r.outstanding.map(o => `<div class="decision"><strong>${esc(o.type)}</strong> ${tag(o.status)}<p>${esc(o.label)}</p><p class="tiny">${money(o.amount, {blank: 'No amount established'})} · ${esc(o.owner)} · due ${esc(formatDate(o.due))}</p><p class="tiny">${narrative(o.evidence)}</p></div>`).join('') : '<p class="small">No outstanding financial matter is recorded.</p>'}</div>`, 'An anticipated recovery is never subtracted from actual cost.')}
    </div>
    <section class="card mt">
      <div class="toolbar">
        <div class="search">${icon('search')}<input id="source-search" type="search" value="${esc(ui.search)}" placeholder="Search source records" aria-label="Search source records"></div>
        <label class="tiny" for="filter-source"><span class="tiny">Treatment</span><select id="filter-source" data-filter="sourceFilter">${[['all', 'All treatments']].concat(M.TREATMENTS.map(x => [x, x])).map(([v, tx]) => `<option value="${esc(v)}" ${ui.sourceFilter === v ? 'selected' : ''}>${esc(tx)}</option>`).join('')}</select></label>
        ${btn('Clear all', 'clear', '', 'small-button')}
      </div>
      <p class="count-line">${list.length} of ${r.observations.length} source observations · search matches record identity and description only, never a restricted amount</p>
      ${list.length ? list.map(o => observationRow(r, o)).join('') : empty('No matching source records', 'No source observation matches the current search or treatment filter.', btn('Clear all', 'clear', '', 'primary'))}
    </section>
    ${r.conversions.length ? `<div class="mt">${card('Reviewed conversions', `<div class="pad">${r.conversions.map(c => `<p class="small">${esc(c.observationId)} → ${esc(c.toUnit || c.toCurrency)} · factor ${esc(c.factor)} · ${esc(c.source)} · ${esc(c.actor)} ${esc(stampTime(c.at))}</p>`).join('')}</div>`, 'A description match is never a conversion.')}</div>` : ''}`;
  }

  /* --------------------------------------------------- view 4: variance */
  function decompositionCell(c) {
    if (!c.decomposition) return '<span class="withheld">Not available</span>';
    const d = c.decomposition;
    return `${signed(d.quantityEffect)} q · ${signed(d.rateEffect)} r · ${signed(d.jointEffect)} j${d.residual !== 0 ? ` · ${signed(d.residual)} rounding` : ''}`;
  }
  function viewVariance() {
    const r = selected(), t = M.totals(r), id = M.identity(r);
    const material = M.materialLines(r).map(l => l.id);
    const rows = r.lines.map(l => {
      const c = M.lineComparison(r, l.id);
      const explained = M.explainedShare(r, l.id);
      return `<tr>
        <td data-label="Line and basis"><span class="record-title">${esc(l.code)}</span><span class="record-ref">${esc(l.label)}</span><span class="record-ref">${esc(c.basis.kind)}</span></td>
        <td class="num" data-label="Estimated quantity">${qty(c.estQty)}</td><td class="num" data-label="Estimated rate">${money(c.estRate)}</td><td class="num" data-label="Estimated cost">${money(c.estCost)}</td>
        <td class="num" data-label="Actual quantity">${qty(c.actual.qty)}</td><td class="num" data-label="Actual rate">${money(c.actual.rate)}</td><td class="num" data-label="Actual cost">${money(c.actual.cost)}</td>
        <td class="num" data-label="Variance">${signed(c.costVariance)}</td><td class="num" data-label="Percentage">${pct(c)}</td>
        <td data-label="Decomposition">${decompositionCell(c)}</td>
        <td data-label="Status and attribution">${c.comparable === 'Cost and quantity' ? tag('Comparable', 'success') : tag(c.comparable, 'warning')}${material.includes(l.id) ? tag('Material', 'info') : ''}
          ${explained > 0 ? `<span class="record-ref">${Math.round(explained * 100)}% attributed${explained < 0.9995 ? `, ${Math.round((1 - explained) * 100)}% unexplained` : ''}</span>` : '<span class="record-ref">No reviewed reason recorded</span>'}
          ${allow('explain') && (c.costVariance !== null || c.actual.cost !== null) ? btn('Explain', 'explain', `data-line="${l.id}"`, 'link-button') : ''}</td>
      </tr>`;
    }).join('');

    const ladder = [
      ['Issued estimate cost basis', t.basis.issued, `${esc(r.bases.issued.versionRef)} · the exact historical version being assessed`],
      ['Scope change at acceptance', t.scopeMovement, 'Cost effect of the accepted scope against the issued scope. Recorded separately from any negotiated price change.'],
      ['Approved change cost basis', t.approvedChangeCost, t.basis.includedChanges.length ? `Included: ${esc(t.basis.includedChanges.join(', '))}` : 'No approved change is included in the declared basis.'],
      ['Comparison basis', t.basis.comparison, 'Accepted cost version plus each included approved change.'],
      ['Attributable actual cost', t.actual, `Declared basis: ${esc(r.comparison.quantityClass)} · ${esc(r.comparison.costDefinition)}`],
      ['Delivery variance', t.deliveryVariance, 'Actual minus comparison basis. Positive means more cost than the declared basis.'],
      ['Total cost variance against the issued basis', t.totalAgainstIssued, 'Actual minus issued estimate cost.']
    ];

    const explanations = r.explanations.map(e => {
      const reason = M.REASONS.find(x => x.code === e.code), l = M.lineOf(r, e.lineId);
      return `<div class="decision"><strong>${esc(l.code)}</strong> ${tag(reason.label, 'info')} <span class="tiny">${Math.round(e.share * 100)}% of the observed difference</span><p>${narrative(e.note)}</p><p class="tiny">${esc(e.actor)} · ${esc(stampTime(e.at))} · reason group: ${esc(reason.group)} · proposed registry, not adopted</p></div>`;
    }).join('');

    const provisional = M.provisionalReasons(r);
    const concludeBlockers = M.concludeBlockers(r);
    return `${heading('Variance review', 'Sign convention: variance = actual − estimated. A positive variance means more cost than the declared basis. Percentages use the estimated amount on that basis as an explicit denominator; a zero or unestablished denominator shows n/a rather than a misleading number.',
      `${allow('materiality') ? btn('Declare materiality', 'materiality', '', 'small-button') : ''}${allow('claim') && r.state === 'ReadyForReview' ? btn('Claim review', 'claim', '', 'primary') : ''}${allow('return') && r.state === 'InReview' ? btn('Return for correction', 'return', '', 'small-button') : ''}${allow('conclude') && r.state === 'InReview' ? btn(icon('check') + 'Conclude review', 'conclude', '', 'primary', concludeBlockers.length > 0) : ''}`)}
    ${r.refreshRequired ? note('Sources changed after this comparison was captured', 'One or more source records advanced after the comparison snapshot was taken. The earlier reviewed result is retained; a refreshed comparison or a successor review is required before another consequential decision.', 'danger') : ''}
    ${r.materiality ? note('Declared materiality for attribution', `A variance is treated as material at ${r.materiality.percent}% of the line basis or ${money(r.materiality.amount)}, whichever is greater. ${esc(r.materiality.note)}`, 'neutral') : note('No materiality basis is declared', 'A review cannot be concluded until the reviewer declares which variances require attribution. No materiality policy is adopted for Powerplants; the value chosen here is a review-level declaration.', 'warning')}
    <section class="card mt"><div class="card-head"><div><h2>Line comparison</h2><p>q = quantity effect, r = rate effect, j = joint effect. Components reconcile exactly to the line variance; any rounding residual is shown rather than absorbed.</p></div></div>
      <div class="scroll-x"><table class="compare-table"><thead><tr>
        <th scope="col">Line and basis</th><th scope="col" class="num">Est. qty</th><th scope="col" class="num">Est. rate</th><th scope="col" class="num">Est. cost</th>
        <th scope="col" class="num">Actual qty</th><th scope="col" class="num">Actual rate</th><th scope="col" class="num">Actual cost</th>
        <th scope="col" class="num">Variance</th><th scope="col" class="num">%</th><th scope="col">Decomposition</th><th scope="col">Status and attribution</th>
      </tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3" data-label="Totals">Comparable lines only (${t.comparableLines})</td><td class="num" data-label="Estimated cost">${money(t.estimated)}</td><td colspan="2" class="phone-hide"></td><td class="num" data-label="Actual cost">${money(t.actual)}</td><td class="num" data-label="Delivery variance">${signed(t.deliveryVariance)}</td><td class="num" data-label="Percentage">${t.deliveryPercent === null ? '<span class="withheld">n/a</span>' : (t.deliveryPercent > 0 ? '+' : '') + t.deliveryPercent.toFixed(2) + '%'}</td><td colspan="2" class="small" data-label="Denominator">Comparison basis of comparable lines</td></tr></tfoot></table></div>
      <div class="card-foot">Lines that are not comparable on both sides are shown and excluded from the totals rather than treated as zero. ${t.withheld.length} line${t.withheld.length === 1 ? ' is' : 's are'} withheld from the totals.</div>
    </section>
    <div class="columns mt"><div class="stack">
      ${card('Reconciliation', `<div class="ladder">${ladder.map(([label, value, sub]) => `<div class="ladder-row ${/Comparison basis|Total cost/.test(label) ? 'total' : ''}"><div>${esc(label)}<small>${sub}</small></div><div class="num">${/variance|Scope change/i.test(label) ? signed(value) : money(value)}</div></div>`).join('')}
      <div class="ladder-row check ${id.available && id.reconciles ? '' : 'fail'}"><div>Identity check<small>${id.available ? 'total cost variance = scope change at acceptance + approved change cost basis + delivery variance' : esc(id.reason)}</small></div><div class="num">${id.available ? (id.reconciles ? 'Reconciles' : 'Does not reconcile') : 'Not available'}</div></div></div>`,
        'A combined basis never overwrites the issued or accepted originals. Both remain inspectable in the basis view.')}
      ${card('Amounts held outside the comparison', `<div class="pad">${facts([
        ['Actual with no estimated basis', money(t.actualWithoutBasis)],
        ['Commitments not incurred', money(t.commitmentTotal)],
        ['Unresolved source amounts', money(t.unresolvedTotal)],
        ['Unmapped remainder', money(t.unmappedTotal)],
        ['Open financial matters', money(t.outstandingTotal)]
      ])}${note('These are not netted', 'None of these amounts is added to or subtracted from the delivery variance. Each is owned, dated and separately visible so that an incomplete source set is never read as a favourable result.', 'neutral')}</div>`)}
    </div><div class="stack">
      ${card('Reviewed explanations', `<div class="pad">${explanations || '<p class="small">No reviewed explanation is recorded yet. An observed difference, a suspected explanation and a reviewed finding are kept distinct.</p>'}</div>`, 'Reason codes name causes, not people. More than one cause may contribute and an unexplained remainder is retained.')}
      ${card('Conclusion', `<div class="pad">${r.concluded ? `<div class="stamp ${r.concluded.outcome === 'ReviewedProvisional' ? 'provisional' : ''}"><span class="eyebrow">${esc(M.STATE_LABELS[r.concluded.outcome])}</span><h2>${esc(r.ref)}</h2><p>${esc(r.stateReason)}</p><p class="tiny">${esc(r.concluded.actor)} · ${esc(stampTime(r.concluded.at))} · comparison snapshot v${r.concluded.snapshotVersion}</p>${r.concluded.provisional.length ? `<ul class="small">${r.concluded.provisional.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>
        ${allow('successor') && !r.supersededBy ? `<div class="source-actions">${btn('Open a successor review', 'successor', '', 'small-button')}</div>` : ''}`
        : concludeBlockers.length ? note('Cannot be concluded yet', `<ul>${concludeBlockers.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`, 'warning')
        : provisional.length ? note('Will be concluded as provisional', `<ul>${provisional.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`, 'warning')
        : note('Ready to conclude', 'Every material variance carries a reviewed reason and no financial matter is outstanding.', 'success')}
        ${r.decisions.length ? `<div class="section-label">Review decisions</div><ul class="timeline">${r.decisions.map(d => `<li><strong>${esc(d.decision)}</strong><small>${esc(d.actor)} · ${esc(stampTime(d.at))}</small>${esc(d.reason)}</li>`).join('')}</ul>` : ''}
      </div>`, 'Concluding an ES-09 review does not close the originating project, work order, supplier claim or Finance exception.')}
    </div></div>`;
  }

  /* ---------------------------------------------------- view 5: lessons */
  function viewLessons() {
    const r = selected();
    const findings = r.findings.map(f => `<div class="item-row">
      <div class="row between"><div><strong>${esc(f.title)}</strong><p class="small">${esc(f.family)} · ${esc(f.workType)}</p></div><div>${tag(f.state)}</div></div>
      ${facts([
        ['Comparison evidence', f.evidence.map(id => { const l = M.lineOf(r, id); const c = M.lineComparison(r, id); return `${esc(l.code)} (${signed(c.costVariance)})`; }).join(' · ')],
        ['Observed issue', esc(f.issue)],
        ['Reviewed explanation', esc(f.explanation)],
        ['Applicability and limits', esc(f.limitations)],
        ['Proposed improvement', esc(f.proposal)],
        ['Owner and due date', `${esc(f.owner)} · ${esc(formatDate(f.due))}`],
        ['Required review', esc(f.specialistReview)],
        ['Related source cases', f.relatedCases.length ? esc(f.relatedCases.join(', ')) : 'None recorded'],
        ['Receiving outcome', f.outcome ? esc(f.outcome) : 'Not yet recorded']
      ])}
      <div class="source-actions">
        ${allow('findingReview') && f.state === 'Suggestion' ? btn('Record as a reviewed proposal', 'findingReview', `data-finding="${f.id}"`, 'small-button') : ''}
        ${allow('handover') && f.state === 'Reviewed proposal' ? btn(icon('arrow') + 'Prepare ES-10 handover', 'handover', `data-finding="${f.id}"`, 'small-button') : ''}
      </div></div>`).join('');

    return `${heading('Lessons and improvement proposals', 'One job is evidence from one case. A finding here is not a validated general rule, a statistically reliable benchmark or an approved configuration change.',
      `${allow('finding') ? btn(icon('bulb') + 'Record a finding', 'finding', '', 'primary') : ''}${allow('action') ? btn('Record an owned action', 'action', '', 'small-button') : ''}`)}
    ${note('What this workspace will not do', `Preparing an ES-10 handover changes nothing automatically. Screen Systems formulas, approved input ranges, parts mappings, labour rates, catalogue prices, existing estimates and quotations, and historical job results are all left exactly as they are. An improvement suggestion, a reviewed proposal and an approved configuration change remain three separate things, and only the first two exist here.`, 'warning')}
    <section class="card mt"><div class="card-head"><div><h2>Findings</h2><p>Each finding cites the exact comparison lines it rests on.</p></div></div>
      ${findings || empty('No finding recorded', 'A finding records what was observed, how it was explained after review, what it does and does not support, and who owns the proposal.', '')}
    </section>
    <div class="two mt">
      ${card('Prepared ES-10 handovers', `<div class="pad">${r.handovers.length ? r.handovers.map(h => `<div class="decision"><strong>${esc(h.target)}</strong> ${tag(h.status, 'info')}<p>${esc(h.note)}</p><p class="tiny">${esc(h.actor)} · ${esc(stampTime(h.at))} · finding ${esc(h.findingId)}</p></div>`).join('') : '<p class="small">No ES-10 handover is prepared for this review.</p>'}
      ${note('Local proposal only', 'A prepared handover creates no ES-10 record, no notification and no calibration. ES-10 owns reference cases, sample sizes, limitations and any reviewed calibration proposal.', 'neutral')}</div>`)}
      ${card('Owned follow-up actions', `<div class="pad">${r.actions.length ? r.actions.map(a => `<div class="decision"><strong>${esc(a.title)}</strong> ${tag(a.status)}<p>${esc(a.reason)}</p><p class="tiny">${esc(a.owner)} · due ${esc(formatDate(a.due))}</p></div>`).join('') : '<p class="small">No owned action is recorded for this review.</p>'}</div>`)}
    </div>
    <div class="mt">${card('Receiving boundaries', `<div class="pad">${facts([
      ['Reference cases and calibration', 'ES-10 — reviewed comparable jobs, sample size, limitations and any calibration proposal'],
      ['Specialist configuration', link('estimating') + ' — Screen Systems inputs, ranges and generated parts'],
      ['Quotation lifecycle', link('quoting') + ' — issued revision, acceptance and negotiated change'],
      ['Project change control', link('projects') + ' — approved variations and their own cost basis'],
      ['Service evidence', link('service') + ' — reviewed labour, parts and findings'],
      ['Material movements', link('supply') + ' — issues, returns, receipts and supplier claims'],
      ['Returns and recovery', link('warranty') + ' — supplier claim, physical return and customer credit as separate outcomes'],
      ['Finance treatment', link('finance') + ' — cost definitions, reconciliation and ERP outcome'],
      ['Work authority', link('work') + ' — the delivery scope this review is attributed to']
    ])}</div>`, 'Links open repository designs for review. Nothing is read or written across modules by this page.')}</div>`;
  }

  /* -------------------------------------------------------- snapshots */
  function snapshotBody(kind, params) {
    const r = selected();
    if (kind === 'delivery') {
      return {title: 'Delivery and commercial context', body: `${note('Source snapshot', 'Read-only context taken from the selected review. Names and references are synthetic fixtures.', 'neutral')}
        ${facts([
          ['Customer', esc(r.customer)], ['Site', esc(r.site)], ['Site reference', esc(r.siteRef)], ['Facility', esc(r.facility)],
          ['Equipment family', esc(r.equipmentFamily)], ['Work category', esc(r.workCategory)],
          ['Opportunity', esc(r.opportunityRef)], ['Estimate', esc(r.estimateRef)], ['Commercial option', esc(r.option)],
          ['Accepted quotation', `${esc(r.acceptedQuoteRef)} issue ${esc(r.acceptedIssue)} accepted ${esc(formatDate(r.acceptedAt))}`],
          ['Delivery target', `${esc(r.deliveryType)} ${esc(r.deliveryRef)}`],
          ['Estimator', esc(r.estimator)], ['Delivery owner', esc(r.deliveryOwner)], ['Review owner', esc(r.reviewOwner)],
          ['Scope cut-off', esc(formatDate(r.scopeCutOff))], ['Reporting cut-off', esc(formatDate(r.reportingCutOff))],
          ['Source revision', String(r.sourceRevision)], ['Comparison snapshot', 'v' + r.snapshotVersion]
        ])}
        <div class="section-label">History</div><ul class="timeline">${r.history.map(h => `<li><strong>${esc(h.description)}</strong><small>${esc(h.actor)} · ${esc(stampTime(h.at))} · ${esc(h.type)}</small></li>`).join('')}</ul>`};
    }
    if (kind === 'receiving') {
      return {title: 'Receiving and source designs', body: `${note('Reference links', 'These open existing repository designs. This page performs no cross-module read or write.', 'neutral')}
        ${facts(Object.keys(receiving).map(key => [receiving[key][0], link(key)]))}`};
    }
    if (kind === 'basis') {
      const b = r.bases[params.basis];
      return {title: `${b.label} — retained snapshot`, body: `${note('Historical version', 'The latest estimate is never substituted for the version being assessed. This snapshot is read-only.', 'neutral')}
        ${facts([
          ['Version', esc(b.versionRef)], ['Saved at', esc(stampTime(b.savedAt))], ['Cost schema', esc(b.costSchema)],
          ['Calculator / formula', esc(b.calculator)], ['Option', esc(b.option)],
          ['Supplier sources', b.supplierSources.map(s => `${esc(s.ref)} (${esc(s.currency)}, valid to ${esc(formatDate(s.validUntil))})`).join('<br>') || 'None recorded'],
          ['Quoted selling price', money(b.price.total)]
        ])}
        <div class="section-label">Cost lines</div>
        <table><thead><tr><th scope="col">Code</th><th scope="col" class="num">Qty</th><th scope="col">Unit</th><th scope="col" class="num">Rate</th><th scope="col" class="num">Cost</th></tr></thead><tbody>${b.lines.map(l => `<tr><td>${esc(l.code)}</td><td class="num">${qty(l.qty)}</td><td>${esc(l.unit)}</td><td class="num">${money(l.rate)}</td><td class="num">${money(l.cost)}</td></tr>`).join('')}</tbody></table>`};
    }
    const o = M.obsOf(r, params.obs);
    return {title: `${o.ref} — source record`, body: `${note('Observation snapshot', `Recorded from ${esc(o.system)} at version ${o.sourceVersion}, observed ${esc(formatDate(o.observedAt))}. PPO does not own this record.`, 'neutral')}
      ${facts([
        ['Source system', esc(o.system)], ['Company / entity', esc(o.entity)], ['Record', esc(o.recordRef)], ['Line', esc(o.lineRef)],
        ['Description', esc(o.description)], ['Scope', esc(o.scopeRef)], ['Category', esc(o.category)], ['Quantity class', esc(o.quantityClass)],
        ['Quantity', `${qty(o.qty)} ${esc(o.unit)}`], ['Rate', money(o.rate)], ['Amount', `${money(o.amount)} ${esc(o.currency)}`],
        ['Tax basis', esc(o.taxBasis)], ['Transaction date', esc(formatDate(o.date))], ['Source status', esc(o.sourceStatus)],
        ['Treatment', esc(o.treatment)], ['Treatment reason', esc(o.treatmentReason || 'Not recorded')],
        ['Allocated', `${Math.round(M.mappedShare(r, o.id) * 1000) / 10}%`],
        ['Reviewer question', esc(o.question || 'None')]
      ])}`};
  }

  /* ------------------------------------------------------------- forms */
  const forms = {
    basis(r) {
      return {kicker: 'Comparison basis', title: 'Declare the comparison basis', submitLabel: 'Declare basis', body: `
        ${note('What a declared basis fixes', 'The exact issued cost version, the exact accepted cost version and which approved changes belong in the comparison. Originals are never overwritten; the declaration only names what the comparison includes.', 'neutral')}
        <p class="small"><strong>Issued:</strong> ${esc(r.bases.issued.versionRef)} · <strong>Accepted:</strong> ${esc(r.bases.accepted.versionRef)}</p>
        <div class="section-label">Approved changes with a recorded cost basis</div>
        ${r.approvedChanges.filter(c => c.costBasisRecorded).map(c => `<label class="check-label"><input type="checkbox" name="includeChanges" value="${c.id}" ${r.basisSelection.includeChanges.includes(c.id) ? 'checked' : ''}><span>Include <strong>${esc(c.ref)}</strong> — ${esc(c.title)} (cost basis ${money(c.lines.reduce((s, l) => s + l.cost, 0))})</span></label>`).join('') || '<p class="small">None.</p>'}
        <div class="section-label">Approved changes without a recorded cost basis</div>
        ${r.approvedChanges.filter(c => !c.costBasisRecorded).map(c => `<label class="check-label"><input type="checkbox" name="acknowledgedMissingCost" value="${c.id}" ${r.basisSelection.acknowledgedMissingCost.includes(c.id) ? 'checked' : ''}><span>Acknowledge <strong>${esc(c.ref)}</strong> — ${esc(c.title)}. Its selling price is not a cost budget, so no variance is computed for it and its attributable actual is reported separately.</span></label>`).join('') || '<p class="small">None.</p>'}
        ${textarea('note', 'What this comparison basis includes', r.basisSelection.note)}`,
        onSubmit(values) {
          send('selectBasis', {includeChanges: multi('includeChanges'), acknowledgedMissingCost: multi('acknowledgedMissingCost'), note: values.note});
          toast('Comparison basis declared. The issued and accepted originals are unchanged.');
        }};
    },
    treat(r, params) {
      const o = M.obsOf(r, params.obs);
      return {kicker: o.ref, title: 'Record the treatment of this source record', submitLabel: 'Record treatment', body: `
        ${note(esc(o.description), `${esc(o.system)} · ${esc(o.quantityClass)} quantity · ${money(o.amount)} ${esc(o.currency)} · source status ${esc(o.sourceStatus)}`, 'neutral')}
        ${selectField('treatment', 'Treatment', ['Included', 'Excluded', 'Commitment', 'Unresolved'], o.treatment === 'Undecided' ? 'Included' : o.treatment)}
        ${textarea('reason', 'Why this treatment applies', o.treatmentReason)}
        ${textarea('unmappedReason', 'Reason for any unallocated remainder (optional)', o.unmappedReason, false)}`,
        onSubmit(values) { send('treat', {id: o.id, treatment: values.treatment, reason: values.reason, unmappedReason: values.unmappedReason}); toast('Source treatment recorded.'); }};
    },
    map(r, params) {
      const o = M.obsOf(r, params.obs), remaining = 1 - M.mappedShare(r, o.id);
      return {kicker: o.ref, title: 'Allocate this source record to a comparison line', submitLabel: 'Record allocation', body: `
        ${note('Allocation rules', 'One source may serve several lines and one line may draw on several sources. A shared cost needs a recorded allocation basis and a reason; an equal split is never applied by default. Units and currencies are not converted without a reviewed basis.', 'neutral')}
        ${selectField('lineId', 'Comparison line', r.lines.map(l => [l.id, `${l.code} — ${l.label} (${l.unit})`]), r.lines[0].id)}
        ${field('share', 'Share of this source record (0 to 1)', String(Math.round(remaining * 1000) / 1000), 'number', 'min="0.001" max="1" step="0.001" required')}
        ${selectField('basis', 'Allocation basis', M.ALLOCATION_BASES.map(b => [b.id, b.adopted ? b.label : `${b.label} — proposed, not adopted`]), 'direct')}
        ${textarea('reason', 'Allocation evidence and reason')}`,
        onSubmit(values) { send('map', {observationId: o.id, lineId: values.lineId, share: Number(values.share), basis: values.basis, reason: values.reason}); toast('Allocation recorded.'); }};
    },
    conversion(r, params) {
      const o = M.obsOf(r, params.obs);
      return {kicker: o.ref, title: 'Record a reviewed conversion basis', submitLabel: 'Record conversion', body: `
        ${note('A description match is not a conversion', 'Record the reviewed source of the conversion. Different units or currencies are never compared numerically without one.', 'warning')}
        ${field('toUnit', 'Convert to unit (optional)', '', 'text')}
        ${field('toCurrency', 'Convert to currency (optional)', '', 'text')}
        ${field('factor', 'Conversion factor or rate', '', 'text', 'required')}
        ${textarea('source', 'Reviewed source of this conversion')}`,
        onSubmit(values) { send('conversion', {observationId: o.id, toUnit: values.toUnit, toCurrency: values.toCurrency, factor: values.factor, source: values.source}); toast('Reviewed conversion recorded.'); }};
    },
    completeness(r) {
      return {kicker: 'Source completeness', title: 'Declare source completeness', submitLabel: 'Declare completeness', body: `
        ${note('Completeness is declared, not inferred', 'An incomplete source set must never appear as a zero-cost job or a favourable variance. Say what is missing.', 'neutral')}
        ${selectField('completeness', 'Completeness of the source set', M.COMPLETENESS, r.completeness)}
        ${textarea('reason', 'What is missing or uncertain (required unless complete)', r.completenessReason, false)}`,
        onSubmit(values) { send('completeness', {completeness: values.completeness, reason: values.reason}); toast('Source completeness declared.'); }};
    },
    submit(r) {
      return {kicker: r.ref, title: 'Submit this comparison for review', submitLabel: 'Submit for review', body: `
        ${note('What is submitted', `The declared basis, every source disposition and allocation, and the completeness declaration (<strong>${esc(r.completeness)}</strong>). Nothing outside this review changes.`, 'neutral')}
        ${textarea('reason', 'Submission note for the reviewer')}`,
        onSubmit(values) { send('submit', {reason: values.reason}); toast('Submitted for review.'); }};
    },
    claim(r) {
      return {kicker: r.ref, title: 'Claim this review', submitLabel: 'Claim review', body: `${textarea('reason', 'Claim note')}`,
        onSubmit(values) { send('claim', {reason: values.reason}); toast('Review claimed.'); }};
    },
    return(r) {
      return {kicker: r.ref, title: 'Return this review for correction', submitLabel: 'Return for correction', body: `
        ${note('The submitted revision is retained', 'Returning records a reason against the exact submitted comparison. Nothing already recorded is deleted.', 'neutral')}
        ${textarea('reason', 'What needs correcting, and why')}`,
        onSubmit(values) { send('return', {reason: values.reason}); toast('Returned for correction.'); }};
    },
    materiality(r) {
      return {kicker: r.ref, title: 'Declare materiality for attribution', submitLabel: 'Declare materiality', body: `
        ${note('Not an adopted policy', 'No materiality threshold is adopted for Powerplants. This declaration applies to this review only and is recorded with it. A single dollar threshold cannot work across the delivered value range, so the greater of a percentage and an amount is used.', 'warning')}
        ${field('percent', 'Percentage of the line comparison basis', r.materiality ? String(r.materiality.percent) : '5', 'number', 'min="0.1" max="100" step="0.1" required')}
        ${field('amount', 'Or amount in AUD, whichever is greater', r.materiality ? String(r.materiality.amount / 100) : '1500.00', 'text', 'required')}
        ${textarea('note', 'Basis for this threshold', r.materiality ? r.materiality.note : '')}`,
        onSubmit(values) { send('materiality', {percent: Number(values.percent), amount: values.amount, note: values.note}); toast('Materiality declared for this review.'); }};
    },
    explain(r, params) {
      const l = M.lineOf(r, params.line), c = M.lineComparison(r, l.id);
      const remaining = 1 - M.explainedShare(r, l.id);
      const used = r.explanations.filter(e => e.lineId === l.id).map(e => e.code);
      return {kicker: l.code, title: 'Record a reviewed explanation', submitLabel: 'Record explanation', body: `
        ${note(`${esc(l.code)} — ${esc(l.label)}`, `Observed difference ${signed(c.costVariance)}${c.decomposition ? ` · quantity ${signed(c.decomposition.quantityEffect)}, rate ${signed(c.decomposition.rateEffect)}, joint ${signed(c.decomposition.jointEffect)}` : ''}. An observed difference, a suspected explanation and a reviewed finding are different things.`, 'neutral')}
        ${selectField('code', 'Contributing cause', M.REASONS.filter(x => !used.includes(x.code)).map(x => [x.code, `${x.label} (${x.group})`]), '')}
        ${field('share', 'Share of the observed difference (0 to 1)', String(Math.round(remaining * 100) / 100), 'number', 'min="0.01" max="1" step="0.01" required')}
        ${textarea('note', 'Reviewed explanation and its evidence')}
        <p class="tiny">Reason codes name causes, not people. More than one cause may contribute and any remainder stays visibly unexplained.</p>`,
        onSubmit(values) { send('explain', {lineId: l.id, code: values.code, share: Number(values.share), note: values.note}); toast('Reviewed explanation recorded.'); }};
    },
    finding(r) {
      return {kicker: r.ref, title: 'Record an improvement finding', submitLabel: 'Record finding', drawer: true, body: `
        ${note('One job is one case', 'A finding from a single delivered job is not a validated rule or a benchmark. Say what it does and does not support.', 'warning')}
        ${field('title', 'Finding title', '', 'text', 'required maxlength="160"')}
        <div class="section-label">Comparison evidence</div>
        ${r.lines.map(l => { const c = M.lineComparison(r, l.id); return `<label class="check-label"><input type="checkbox" name="evidence" value="${l.id}"><span>${esc(l.code)} — ${esc(l.label)} (${signed(c.costVariance)})</span></label>`; }).join('')}
        ${field('family', 'Affected equipment family or work type', r.equipmentFamily, 'text', 'required')}
        ${textarea('issue', 'Observed issue')}
        ${textarea('explanation', 'Reviewed explanation')}
        ${textarea('limitations', 'Applicability and limitations')}
        ${textarea('proposal', 'Proposed improvement')}
        ${ownerDue('Dana Okafor', '2026-09-30')}
        ${textarea('specialistReview', 'Required specialist or commercial review')}`,
        onSubmit(values) {
          send('finding', {title: values.title, evidence: multi('evidence'), family: values.family, issue: values.issue,
            explanation: values.explanation, limitations: values.limitations, proposal: values.proposal,
            owner: values.owner, due: values.due, specialistReview: values.specialistReview});
          toast('Improvement suggestion recorded. Nothing has been changed in estimating.');
        }};
    },
    findingReview(r, params) {
      return {kicker: 'Finding review', title: 'Record this suggestion as a reviewed proposal', submitLabel: 'Record proposal', body: `
        ${note('A proposal is still not a change', 'Promoting a suggestion records that it has been reviewed. It does not alter a formula, range, mapping, rate, price, estimate, quotation or historical result.', 'neutral')}
        ${textarea('reason', 'Review outcome and what the evidence supports')}`,
        onSubmit(values) { send('findingReview', {id: params.finding, reason: values.reason}); toast('Suggestion recorded as a reviewed proposal.'); }};
    },
    handover(r, params) {
      return {kicker: 'ES-10 handover', title: 'Prepare an ES-10 handover', submitLabel: 'Prepare handover', body: `
        ${note('Local proposal only', 'This prepares a local handover record for ES-10 — reference cases and calibration proposals. It creates no ES-10 record, sends no notification and changes no calculator, rate or catalogue price.', 'warning')}
        ${textarea('note', 'Receiving note for ES-10, including the limits of this single case')}`,
        onSubmit(values) { send('handover', {id: params.finding, note: values.note}); toast('ES-10 handover prepared locally.'); }};
    },
    conclude(r) {
      const provisional = M.provisionalReasons(r);
      return {kicker: r.ref, title: 'Conclude this outcome review', submitLabel: 'Conclude review', body: `
        ${provisional.length ? note('This review can only be concluded as provisional', `<ul>${provisional.map(p => `<li>${esc(p)}</li>`).join('')}</ul>Retain the cut-off, the included source snapshots, the excluded amounts and the owned follow-up. New evidence creates a successor review rather than a silent correction.`, 'warning')
          : note('This review can be concluded as complete', 'Every line is comparable on both sides, the source set is complete and no financial matter is outstanding.', 'success')}
        ${selectField('outcome', 'Review outcome', provisional.length ? [['ReviewedProvisional', 'Reviewed — provisional']] : [['Reviewed', 'Reviewed'], ['ReviewedProvisional', 'Reviewed — provisional']], provisional.length ? 'ReviewedProvisional' : 'Reviewed')}
        ${textarea('reason', 'Conclusion basis')}
        <p class="tiny">Concluding this review does not close the originating project, work order, supplier claim or Finance exception.</p>`,
        onSubmit(values) { send('conclude', {outcome: values.outcome, reason: values.reason}); toast('Review concluded. The originating records are unchanged.'); }};
    },
    notComparable(r) {
      return {kicker: r.ref, title: 'Record this review as not comparable', submitLabel: 'Record as not comparable', body: `
        ${note('Counted, never hidden', 'A review that cannot be attributed is a fact about the evidence, not a zero variance. It is counted and reported, and excluded from any aggregate.', 'neutral')}
        ${textarea('reason', 'Why this comparison cannot be established')}`,
        onSubmit(values) { send('notComparable', {reason: values.reason}); toast('Recorded as not comparable and excluded from aggregates.'); }};
    },
    financeValidate(r) {
      return {kicker: r.ref, title: 'Validate the declared comparison basis', submitLabel: 'Validate basis', body: `
        ${note('What validation covers', 'The cost definition and quantity class used by this comparison. It does not adopt a Powerplants accounting definition, a margin formula or an overhead rule.', 'neutral')}
        ${textarea('definition', 'Cost definition for this comparison', r.comparison.costDefinition)}
        ${textarea('reason', 'Validation basis')}
        ${confirmField('I confirm the cost definition and quantity class stated above for this review only.')}`,
        onSubmit(values) { send('financeValidate', {confirm: values.confirm, definition: values.definition, reason: values.reason}); toast('Finance validated the declared basis.'); }};
    },
    outstanding(r) {
      return {kicker: r.ref, title: 'Record an outstanding financial matter', submitLabel: 'Record matter', body: `
        ${note('Never netted', 'An anticipated recovery is not subtracted from actual cost. Customer credits, supplier credits, inventory corrections and payments stay separate and are applied only under their own approved treatment.', 'neutral')}
        ${selectField('type', 'Type', ['Supplier recovery', 'Customer credit', 'Allocation decision', 'Cost evidence', 'Conversion basis', 'Unmapped actual', 'Correction'], 'Supplier recovery')}
        ${field('label', 'What is outstanding', '', 'text', 'required maxlength="200"')}
        ${field('amount', 'Amount in AUD (leave blank if not established)', '', 'text')}
        ${ownerDue('Priya Raman', '2026-09-30')}
        ${textarea('evidence', 'Evidence and current status')}`,
        onSubmit(values) { send('outstanding', {type: values.type, label: values.label, amount: values.amount, owner: values.owner, due: values.due, evidence: values.evidence}); toast('Outstanding matter recorded.'); }};
    },
    successor(r) {
      return {kicker: r.ref, title: 'Open a successor review', submitLabel: 'Open successor', body: `
        ${note('The earlier reviewed result is preserved', 'A successor carries the same delivery scope forward with a new identity. The concluded review stays readable exactly as it was concluded.', 'neutral')}
        ${textarea('reason', 'Why a successor review is needed')}`,
        onSubmit(values) { const result = send('successor', {reason: values.reason}); ui.selected = result.receipt.resultId; toast('Successor review opened; the earlier result is preserved.'); }};
    },
    action(r) {
      return {kicker: r.ref, title: 'Record an owned follow-up action', submitLabel: 'Record action', body: `
        ${field('title', 'Action title', '', 'text', 'required maxlength="160"')}
        ${textarea('reason', 'Why this follow-up is required')}
        ${ownerDue('Jordan Blake', '2026-09-30')}`,
        onSubmit(values) { send('action', {title: values.title, reason: values.reason, owner: values.owner, due: values.due}); toast('Owned action recorded.'); }};
    }
  };

  function optionsForm() {
    return {kicker: 'Preview options', title: 'Preview options and demonstration controls', drawer: true, submitLabel: 'Apply', body: `
      ${note('Demonstration only', 'Role selection here is an explanatory display control, not authenticated access control. In the application every permission must be enforced on the server.', 'warning')}
      ${selectField('role', 'Preview role', Object.keys(M.roles).map(key => [key, `${M.roles[key].title} — ${M.roles[key].name}`]), ui.role)}
      ${selectField('failure', 'Next record save', [['none', 'Succeeds'], ['fail', 'Fails and changes nothing'], ['unknown', 'Response is lost after saving']], nextFailure)}
      <div class="section-label">Source and evidence demonstrations</div>
      <div class="row">${btn('Source changes after capture', 'sourceChange', '', 'small-button')}${btn('Export this session', 'export', '', 'small-button')}${btn('Reset to the seeded fixture', 'reset', '', 'small-button')}</div>
      <p class="tiny space-top">Export writes the current local records as labelled synthetic JSON. Restricted amounts are removed from the export when the read-only observer role is selected.</p>`,
      onSubmit(values) { ui.role = values.role; nextFailure = values.failure; toast(`Preview role: ${M.roles[ui.role].title}.`); }};
  }

  function guideBody() {
    return {kicker: 'Page guide', title: 'How this workspace is meant to be read', drawer: true, body: `
      <ol class="guide-list">
        <li><strong>Register.</strong> Delivery completion and financial completeness are separate columns. The named views filter the same register; summary cells open the contributing records without losing your search.</li>
        <li><strong>Estimate &amp; accepted basis.</strong> The issued cost version, the accepted cost version and each approved change are separate records. Declaring a comparison basis names what the comparison includes; it never rewrites an original. Quoted selling price and negotiated discount sit in their own card and never enter the cost comparison.</li>
        <li><strong>Actuals &amp; source reconciliation.</strong> Every source observation carries its system, record identity, quantity class, unit, currency, status, version and observation time. Treatment and allocation are recorded with reasons. Commitments, customer billing and unresolved amounts are held out of the comparison and shown separately.</li>
        <li><strong>Variance review.</strong> Variance = actual − estimated. Percentages state their denominator. Where quantity and rate are established on both sides, the difference is decomposed into quantity, rate and joint effects that reconcile exactly to the line variance. The reconciliation ladder enforces the identity between the issued basis, the accepted basis, approved changes and delivery.</li>
        <li><strong>Lessons &amp; proposals.</strong> A finding cites exact comparison lines, states its limits and is routed to ES-10 as a local proposal. Nothing in estimating, the catalogue or a historical result is changed from here.</li>
      </ol>
      ${note('What this page is not', 'It is a design. It performs no live integration, posts no accounting entry, changes no calculator or catalogue price, and adopts no financial definition, materiality threshold, allocation basis or reason registry.', 'neutral')}`};
  }

  function exportPayload() {
    const payload = M.clone(state);
    if (!sees()) {
      payload.restrictedRemoved = 'Amounts, rates, prices, narrative fields and retained command payloads are removed because the read-only observer role was selected.';
      /* Operation receipts retain the original command payload for idempotent
         recovery, so they are a disclosure surface in their own right. */
      payload.receipts = payload.receipts.map(receipt => ({op: receipt.op, at: receipt.at, version: receipt.version,
        reviewId: receipt.reviewId, description: receipt.description, signature: 'Restricted payload'}));
      payload.reviews.forEach(r => {
        r.lines.forEach(l => { l.estRate = null; l.estCost = null; });
        r.observations.forEach(o => { o.rate = null; o.amount = null; });
        r.outstanding.forEach(o => { o.amount = null; });
        r.approvedChanges.forEach(c => { c.price = null; if (c.lines) c.lines.forEach(l => { l.rate = null; l.cost = null; }); });
        r.commercial.forEach(c => { c.amount = null; c.reason = 'Restricted narrative'; c.evidence = 'Restricted narrative'; });
        r.explanations.forEach(e => { e.note = 'Restricted narrative'; });
        r.observations.forEach(o => { o.treatmentReason = 'Restricted narrative'; o.unmappedReason = o.unmappedReason ? 'Restricted narrative' : ''; });
        r.mappings.forEach(m => { m.reason = 'Restricted narrative'; });
        r.outstanding.forEach(o => { o.evidence = 'Restricted narrative'; });
        Object.keys(r.bases).forEach(key => { r.bases[key].price = null; r.bases[key].lines.forEach(l => { l.rate = null; l.cost = null; }); });
        if (r.materiality) r.materiality.amount = null;
        if (r.concluded) r.concluded.totals = 'Removed for the read-only observer role';
      });
    }
    return {schema: M.SCHEMA, exportedAt: new Date().toISOString(), role: ui.role, synthetic: true, state: payload};
  }

  /* ------------------------------------------------------------ actions */
  const actions = {
    guide() { openModal(guideBody()); },
    options() { openModal(optionsForm()); },
    named(el) { ui.named = ui.named === el.dataset.named ? 'all' : el.dataset.named; render(); },
    select(el) { ui.selected = el.dataset.review; ui.view = 'basis'; render(); },
    clear() { ui.search = ''; ui.customer = 'all'; ui.owner = 'all'; ui.family = 'all'; ui.delivery = 'all'; ui.status = 'all'; ui.completeness = 'all'; ui.sourceFilter = 'all'; render(); },
    snapshot(el) { const s = snapshotBody(el.dataset.kind, el.dataset); openModal({kicker: 'Source snapshot', title: s.title, body: s.body, drawer: true}); },
    unmap(el) { try { send('unmap', {id: el.dataset.map}); toast('Allocation removed.'); render(); } catch (error) { toast(error.message); } },
    sourceChange() {
      const r = selected();
      openModal({kicker: r.ref, title: 'Record a source change after capture', submitLabel: 'Record source change',
        body: `${note('History is retained', 'A source change advances the source revision and requires a refreshed comparison. Nothing already concluded is rewritten; a successor review carries the new evidence.', 'warning')}
        ${selectField('observationId', 'Source record that changed', [['', 'No specific record']].concat(r.observations.map(o => [o.id, `${o.ref} — ${o.description}`])), '')}
        ${field('amount', 'Revised amount in AUD (optional)', '', 'text')}
        ${textarea('reason', 'What changed in the source')}`,
        onSubmit(values) { send('sourceChange', {observationId: values.observationId || null, amount: values.amount, reason: values.reason}); toast('Source change recorded. The comparison needs refreshing.'); }});
    },
    export() {
      const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'ppo-es09-outcome-review-session.json';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('Session exported as labelled synthetic JSON.');
    },
    reset() { state = M.seed(); damaged = null; pending = null; ui.selected = state.reviews[0].id; persist(); closeModal(); render(); toast('Reset to the seeded synthetic fixture.'); },
    recover() {
      if (!pending) { toast('No operation is awaiting recovery.'); return; }
      try {
        const result = M.command(state, pending.cmd, pending.role);
        state = result.state; pending = null; persist(); render();
        toast(result.recovered ? 'The original save was recovered. No second record was created.' : 'The original operation completed once.');
      } catch (error) { toast(error.message); }
    },
    raw() {
      openModal({kicker: 'Damaged session', title: 'Saved session could not be read', drawer: true,
        body: `${note('The saved bytes are preserved', 'Nothing has been overwritten. Copy the saved content below, then reset to the seeded fixture when you are ready.', 'warning')}<pre class="mono">${esc(damaged.raw)}</pre><p class="small">Parser message: ${esc(damaged.message)}</p>`});
    }
  };
  ['basis', 'treat', 'map', 'conversion', 'completeness', 'submit', 'claim', 'return', 'materiality', 'explain',
    'finding', 'findingReview', 'handover', 'conclude', 'notComparable', 'financeValidate', 'outstanding', 'successor', 'action']
    .forEach(name => { actions[name] = el => openModal(forms[name](selected(), el ? el.dataset : {})); });

  /* ------------------------------------------------------------- render */
  function render() {
    $('role-label').textContent = `${M.roles[ui.role].title} · ${M.roles[ui.role].name}`;
    $('tabs').innerHTML = tabs.map(([id, label]) => `<button type="button" data-view="${id}" aria-current="${ui.view === id ? 'page' : 'false'}">${esc(label)}</button>`).join('');
    $('recovery').innerHTML = damaged
      ? `<div class="note danger"><strong>Saved session needs attention</strong><div>The stored demonstration session could not be read and has been preserved exactly as saved. ${btn('Inspect the saved content', 'raw', '', 'link-button')}</div></div>`
      : pending
        ? `<div class="note warning"><strong>A save response was lost</strong><div>The last record may or may not have been accepted. Recover the original operation instead of saving again. ${btn('Recover the original operation', 'recover', '', 'link-button')}</div></div>`
        : '';
    if (damaged) { $('context').innerHTML = ''; $('content').innerHTML = empty('Saved session needs attention', 'The saved bytes are preserved and can be inspected or exported. Reset to the seeded fixture from Preview options when you are ready.', ''); return; }
    renderContext();
    $('content').innerHTML = ui.view === 'register' ? viewRegister()
      : ui.view === 'basis' ? viewBasis()
      : ui.view === 'actuals' ? viewActuals()
      : ui.view === 'variance' ? viewVariance() : viewLessons();
    $('content').querySelectorAll('[data-icon]').forEach(node => { node.outerHTML = icon(node.dataset.icon); });
    persist();
  }

  /* -------------------------------------------------------------- wiring */
  document.querySelectorAll('[data-icon]').forEach(node => { node.outerHTML = icon(node.dataset.icon); });
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('#tabs [data-view]');
    if (viewButton) { ui.view = viewButton.dataset.view; render(); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton || busy) return;
    const handler = actions[actionButton.dataset.action];
    if (handler) { busy = true; try { handler(actionButton); } catch (error) { toast(error.message); } finally { busy = false; } }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'register-search' || event.target.id === 'source-search') {
      ui.search = event.target.value;
      const cursor = event.target.selectionStart, id = event.target.id;
      render();
      const field = $(id); if (field) { field.focus(); field.setSelectionRange(cursor, cursor); }
    }
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'review-select') { ui.selected = event.target.value; render(); return; }
    if (event.target.dataset && event.target.dataset.filter) { ui[event.target.dataset.filter] = event.target.value; render(); }
  });
  $('modal-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!submitHandler) { closeModal(); return; }
    try { submitHandler(formValues()); closeModal(); render(); }
    catch (error) { $('modal-error').hidden = false; $('modal-error').textContent = error.message; $('modal-error').focus(); }
  });
  $('modal').addEventListener('click', event => { if (event.target.closest('[data-close]')) closeModal(); });
  $('modal').addEventListener('close', () => { submitHandler = null; if (originFocus && document.contains(originFocus)) originFocus.focus(); });
  $('tabs').addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const buttons = Array.from($('tabs').querySelectorAll('[data-view]'));
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    buttons[(index + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length].focus();
  });

  restore();
  render();
  globalThis.EAR_DEMO = {
    state: () => state, ui: () => ui, model: M,
    totals: () => M.totals(selected()), identity: () => M.identity(selected()),
    exportPayload
  };
})();
