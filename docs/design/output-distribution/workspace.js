(() => {
  'use strict';
  const M = globalThis.PPOOutputs, KEY = 'ppo.output-distribution.r01', VIEW_KEY = KEY + '.view';
  const $ = id => document.getElementById(id), main = $('main'), dialog = $('dialog'), snapshot = $('snapshot');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pill = (t, tone = '') => `<span class="pill ${tone}">${esc(t)}</span>`;
  const button = (label, action, extra = '', className = '') => `<button class="${className}" data-action="${action}" ${extra}>${esc(label)}</button>`;
  const date = v => v ? new Date(v.length === 10 ? v + 'T12:00:00Z' : v).toLocaleDateString('en-AU', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}) : 'Date needed';
  const stamp = v => v ? `${date(v)} · ${v.slice(11, 16)} UTC` : 'Not recorded';
  const rev = n => `r${String(n).padStart(2, '0')}`;
  const bytes = n => n === null || n === undefined ? 'Not available' : `${n.toLocaleString('en-AU')} bytes`;
  const shortHash = h => h ? h.slice(0, 12) + '…' : 'No content identity';
  const tone = v => ['Met','Current','Delivered','Checked','Acknowledged','Received','Issued record','Ready for release','Ready to prepare','Generated'].includes(v) ? 'success'
    : ['Needs action','Superseded','Outcome unknown','Awaiting domain review','Blocked','Returned by the domain','Accepted with reservations','Prepared','Sent','Finalisation outcome unknown'].includes(v) ? 'warning'
    : ['Withdrawn','Failed','Missing exact item','Declined','Not configured','Access restricted'].includes(v) ? 'danger'
    : ['Unknown','Not applicable','Not supported','Unavailable'].includes(v) ? 'info' : '';
  const meta = items => `<dl class="meta">${items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  const options = (items, value, all) => `${all !== undefined ? `<option value="">${esc(all)}</option>` : ''}${items.map(i => { const [v, l] = Array.isArray(i) ? i : [i, i]; return `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}`;
  const field = (id, label, control, help = '') => `<div class="field"><label for="${id}">${esc(label)}</label>${control}${help ? `<small>${esc(help)}</small>` : ''}</div>`;
  const textarea = id => `<textarea id="${id}" name="reason" required maxlength="2000"></textarea>`;
  const ownerSelect = () => options(Object.values(M.PEOPLE), 'Riley Chen');

  let state = M.initial(), actor = 'coordinator', view = 'queue', selected = 'pack', selectedIssue = null, filters = {queue:'attention'}, advanced = false;
  let savedRaw = null, blocked = false, failNext = false, readMode = 'ready', directoryFailed = false, historyFilter = '', expanded = {}, previewItem = null;
  let form = null, formDirty = false, returnFocus = null, snapshotFocus = null, queueScroll = 0;
  try { savedRaw = localStorage.getItem(KEY); if (savedRaw) { const parsed = JSON.parse(savedRaw); if (!M.validState(parsed)) throw Error('invalid'); state = parsed; } } catch { blocked = true; }
  try { const v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null'); if (v && M.PEOPLE[v.actor]) { actor = v.actor; filters = v.filters && typeof v.filters === 'object' ? v.filters : {queue:'attention'}; advanced = !!v.advanced; } } catch { /* View preferences are optional; issue and distribution evidence is kept separately. */ }
  $('role').value = actor;

  const output = () => M.getOutput(selected);
  const issues = () => output() ? M.issuesOf(state, output()) : [];
  const issue = () => issues().find(i => i.id === selectedIssue) || issues().find(i => M.issueState(state, output(), i) === 'Current') || issues().at(-1) || null;
  const canAct = action => !blocked && M.can(actor, action);
  function ensureSelection() {
    if (!output() || !M.allowed(actor, output())) { selected = M.visibleOutputs(state, actor)[0]?.id || null; selectedIssue = null; previewItem = null; }
    if (!output()) return;
    if (!issues().some(i => i.id === selectedIssue)) selectedIssue = issue()?.id || null;
    const manifest = issue() ? M.manifestOf(state, output(), issue()) : [];
    if (!manifest.some(x => x.id === previewItem)) previewItem = manifest.find(x => x.availability === 'Available')?.id || manifest[0]?.id || null;
  }
  function reconcileSelection() { if (!M.visibleOutputs(state, actor, filters).some(o => o.id === selected)) { selected = null; selectedIssue = null; } }
  function persistView() { try { localStorage.setItem(VIEW_KEY, JSON.stringify({actor, filters, advanced})); } catch { $('saved-status').textContent = 'View preferences could not be saved; issue and distribution records are separate.'; } }
  function notify(message) { $('toast').textContent = message; $('toast').hidden = false; setTimeout(() => { $('toast').hidden = true; }, 4600); }
  function showBlocked(message = 'Saved local work could not be read safely. The original data has been retained.') {
    blocked = true; $('save-notice').hidden = false;
    $('save-notice').innerHTML = `${esc(message)} <div>${button('Reload saved work', 'reload')}${button('Download original saved data', 'raw-export')}${button('Reset demo', 'reset')}</div>`;
    $('saved-status').textContent = 'Changes paused · original data retained';
  }
  function save(action, payload) {
    if (blocked) throw Error('Changes are paused. Reload or recover the original saved work.');
    let raw; try { raw = localStorage.getItem(KEY); } catch { throw Error('Browser storage is unavailable. Your form has been retained.'); }
    if (raw !== savedRaw) { showBlocked('Another tab changed the saved work. Reload saved work before continuing.'); throw Error('Saved work changed in another tab. Your form has been retained.'); }
    const next = M.command(state, actor, state.version, action, payload, new Date().toISOString());
    if (failNext) { failNext = false; throw Error('Simulated save failed. Your entries are retained; try Save again.'); }
    const nextRaw = JSON.stringify(next);
    try { localStorage.setItem(KEY, nextRaw); } catch { throw Error('Save failed. Your entries are retained; free browser storage and try again.'); }
    state = next; savedRaw = nextRaw;
    $('saved-status').textContent = 'Saved in this browser · ' + new Date().toLocaleTimeString('en-AU', {hour:'2-digit', minute:'2-digit'});
    return next;
  }

  const views = [['queue','Output queue'],['detail','Output & issue detail'],['readiness','Readiness & domain review'],['distribution','Distribution & responses'],['exceptions','Exceptions & recovery'],['history','History & change impact']];
  function tabs() { document.querySelector('.tabs').innerHTML = views.map(([id, label]) => `<button id="tab-${id}" role="tab" data-view="${id}" aria-controls="main" aria-selected="${id === view}" tabindex="${id === view ? 0 : -1}">${label}</button>`).join(''); main.setAttribute('aria-labelledby', 'tab-' + view); }
  function go(target, focus = true) { if (view === 'queue') queueScroll = window.scrollY; view = target; closeSnapshot(); render(); window.scrollTo({top: target === 'queue' ? queueScroll : 0}); if (focus) main.focus({preventScroll:true}); }
  const typeIcon = o => `<span class="file-icon ${({'OUT-06':'quotation','OUT-02':'quotation','OUT-08':'drawing','OUT-14':'finance'})[o.type] || ''}" aria-hidden="true">${esc(o.type.replace('OUT-', 'O'))}</span>`;
  const pageHead = (title, subtitle, actions = '') => `<div class="page-head"><div><h2>${title}</h2><p>${subtitle}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

  /* Counts always state their population and are never shown while a read is incomplete. */
  function readState() {
    const copy = {loading:['Loading output references','Source results are pending. Counts are unavailable until this read completes.'], empty:['No outputs in this scope','There are no output records in this simulated permitted scope.'], failed:['Output sources unavailable','The last read failed. This is not an empty queue.']}[readMode];
    return `<section class="card read-state"><h3>${copy[0]}</h3><p>${copy[1]}</p>${readMode === 'loading' ? '<div class="skeleton"></div><div class="skeleton" style="max-width:420px"></div>' : ''}${button(readMode === 'loading' ? 'Finish simulated load' : 'Restore source results', 'restore-read', '', 'primary')}</section>`;
  }
  function distributionSummary(o, i) {
    if (directoryFailed) return '<span class="inline-warning">Recipient directory unavailable</span>';
    const recipients = M.recipientsOf(state, o, i), attempts = M.attemptsOf(state, o, i);
    const delivered = recipients.filter(r => attempts.some(a => a.recipient === r.id && M.outcomeOf(state, a) === 'Delivered')).length;
    const unknown = attempts.filter(a => M.outcomeOf(state, a) === 'Outcome unknown').length;
    const responses = M.responsesOf(state, o, i).length;
    return `<div class="status-stack"><small>${delivered} of ${recipients.length} recipients have delivery evidence</small><small>${responses} of ${recipients.length} explicit responses</small>${unknown ? pill(unknown + ' unknown outcome', 'warning') : ''}</div>`;
  }

  function queue() {
    if (readMode !== 'ready') return pageHead('Output queue', 'Find the outputs that need preparation, review, release, distribution or follow-up.') + readState();
    const permitted = M.visibleOutputs(state, actor), list = M.visibleOutputs(state, actor, filters), ex = M.exceptions(state, actor);
    const awaiting = permitted.filter(o => M.position(state, o).stage === 'Awaiting domain review').length;
    const outstanding = permitted.reduce((sum, o) => sum + M.outstandingResponses(state, actor, o).length, 0);
    const stats = [['Outputs in this preview scope', permitted.length, 'Permitted records, including retained issues'], ['Awaiting domain review', awaiting, 'Successor drafts with no retained decision'], ['Open exceptions', ex.length, 'Missing items, unknown outcomes and unconfigured rules'], ['Recipients without a response', outstanding, 'Counted across current issues only']];
    const fields = [['domain','Originating domain'],['type','Output type'],['owner','Owner'],['customer','Customer'],['site','Site'],['classification','Classification'],['state','Current issue state']];
    const queues = [['attention','Needs attention'],['all','All permitted outputs'],['mine','My outputs'],['review','Awaiting domain review'],['ready','Ready for preparation or release'],['response','Awaiting response'],['exceptions','Exceptions']];
    return `<div class="metrics">${stats.map(([l, v, h]) => `<div class="metric"><span class="label">${l}</span><span class="value">${v}</span><span class="hint">${h}</span></div>`).join('')}</div>`
      + `<div class="attention-strip"><div><strong>Drawing SYN-PPO-DOC-000101 r03 affects the issued technician pack r04.</strong> The issued pack still references r02 and does not update by itself.</div>${button('Open the affected pack', 'open-pack')}</div>`
      + `<section class="card output-register"><div class="doc-filters"><div class="search"><label for="search">Find an output</label><input id="search" type="search" placeholder="Title, reference, customer, location or linked record…" value="${esc(filters.search || '')}"></div><div><label for="quick-view">Queue view</label><select id="quick-view">${options(queues, filters.queue || 'attention')}</select></div><button class="filter-toggle" data-action="filters" aria-expanded="${advanced}" aria-controls="advanced-filters">${advanced ? 'Hide' : 'Show'} filters${Object.keys(filters).filter(k => !['search','queue'].includes(k) && filters[k]).length ? ' · active' : ''}</button></div>`
      + `<div id="advanced-filters" class="advanced-filters" ${advanced ? '' : 'hidden'}>${fields.map(([key, label]) => { const values = key === 'state' ? ['Current','Superseded','Withdrawn'] : [...new Set(permitted.map(o => o[key]))]; return `<div><label for="filter-${key}">${label}</label><select id="filter-${key}" data-filter="${key}">${options(values, filters[key] || '', 'All')}</select></div>`; }).join('')}</div>`
      + `<div class="register-summary"><span><strong>${list.length}</strong> matching outputs · ${permitted.length} permitted in this preview</span>${button('Clear filters', 'clear-filters')}</div>`
      + (list.length ? `<div class="table-wrap"><table class="output-table"><thead><tr><th>Output</th><th>Customer / site</th><th>Revision &amp; purpose</th><th>Preparation position</th><th>Distribution &amp; response</th><th>Owner and next action</th></tr></thead><tbody>${list.map(o => {
        const current = M.issuesOf(state, o).find(i => M.issueState(state, o, i) === 'Current'), place = M.position(state, o);
        return `<tr ${o.id === selected ? 'class="selected"' : ''}><td class="case-cell"><div class="doc-name">${typeIcon(o)}<div>${button(o.title, 'snapshot', `data-id="${o.id}"`, 'text-button')}<div class="case-sub">${esc(o.ref)} · ${esc(o.type)} ${esc(o.typeName)}</div><div class="case-sub">${esc(o.location)}</div></div></div></td>`
          + `<td data-label="Customer / site"><div>${esc(o.customer)}<div class="case-sub">${esc(o.site)}</div></div></td>`
          + `<td data-label="Revision &amp; purpose"><div class="status-stack">${current ? `<strong>${rev(current.revision)}</strong>${pill(M.issueState(state, o, current), tone(M.issueState(state, o, current)))}<small>${esc(current.purpose)}</small>` : pill('No issue retained', 'info')}</div></td>`
          + `<td data-label="Preparation position"><div class="status-stack">${pill(place.stage, tone(place.stage))}<small>${esc(o.domain)}</small></div></td>`
          + `<td data-label="Distribution &amp; response">${current ? distributionSummary(o, current) : '<small class="muted">No distribution</small>'}</td>`
          + `<td data-label="Owner and next action"><div class="status-stack"><strong>${esc(o.owner)}</strong><small>${esc(place.next)}</small></div></td></tr>`;
      }).join('')}</tbody></table></div>` : `<div class="empty"><h3>No matching outputs</h3><p>Adjust the queue view or filters. A record outside this preview scope is never selected automatically.</p>${button('Show all permitted outputs', 'clear-filters')}</div>`)
      + `<div class="card-foot">Select an output to open its snapshot. A filename, a generated file or a sent message does not establish an authorised issue.</div></section>`;
  }

  function recordToolbar() {
    const all = M.visibleOutputs(state, actor), list = issues();
    return `<div class="record-toolbar"><div class="pickers"><div><label for="output-select">Selected output</label><select id="output-select">${options(all.map(o => [o.id, o.title]), selected)}</select></div><div class="revision-picker"><label for="issue-select">Exact issue</label><select id="issue-select">${list.length ? options(list.slice().reverse().map(i => [i.id, `${rev(i.revision)} · ${M.issueState(state, output(), i)}`]), issue()?.id) : '<option>No issue retained</option>'}</select></div></div>${button('Return to queue', 'back-queue')}</div>`;
  }
  function issueBanner(o, i) {
    if (!i) return `<div class="callout neutral space"><strong>No issue has been retained for this output.</strong>Preparation and domain review still apply. Nothing here has been released.</div>`;
    const status = M.issueState(state, o, i), withdrawal = M.withdrawalOf(state, i);
    if (status === 'Current') return '';
    return `<div class="callout ${status === 'Withdrawn' ? 'warning' : 'neutral'} source-state"><strong>${status} · historical inspection</strong>${withdrawal ? `Withdrawn ${stamp(withdrawal.at)} by ${esc(withdrawal.actor)}. ${esc(withdrawal.reason)} ` : ''}The retained bytes, recipients and responses of this issue are unchanged. Current-use authority and acknowledgements do not transfer to or from it.</div>`;
  }
  function paper(o, i, entry) {
    if (!entry) return `<div class="read-state"><h3>No manifest item selected</h3><p>This issue has no inspectable item in the preview scope.</p></div>`;
    if (entry.availability !== 'Available') return `<div class="read-state"><h3>Exact item unavailable</h3><p>${esc(entry.availability)}. The newest available file is never substituted for a referenced exact version.</p>${button('Open the source exception', 'to-exceptions', '', 'primary')}</div>`;
    const identity = {purpose:i.purpose, ref:i.reservedRef || i.ref, preparedAt:i.preparedAt};
    return `<article class="document-paper"><div class="paper-heading"><div class="paper-meta"><span>${esc(o.ref)} / ${rev(i.revision)}</span><span>${esc(o.type)}</span></div><h3>${esc(entry.title)}</h3><div class="paper-meta"><span>${esc(o.customer)} · ${esc(o.site)}</span><span>Reserved issue ${esc(identity.ref)} · prepared ${stamp(identity.preparedAt)}</span></div></div><div class="paper-title">Authored synthetic output extract · ${esc(entry.purpose || i.purpose)}</div>${entry.sections.map(([k, t]) => `<section class="paper-section"><h4>${esc(k)}</h4><p>${esc(t)}</p></section>`).join('')}<div class="paper-footer">Synthetic prototype — not for operational use. The reserved issue identity and preparation time printed above are effective only on release; actual release time is recorded separately.</div></article>`;
  }
  function manifestTable(o, i) {
    const manifest = M.manifestOf(state, o, i);
    return `<div class="table-wrap"><table class="manifest-table"><thead><tr><th>Manifest item</th><th>Purpose</th><th>Availability</th><th class="num">Bytes</th><th>Content identity</th><th>Inspect</th></tr></thead><tbody>${manifest.map(x => `<tr class="${x.id === previewItem ? 'selected' : ''}"><td class="case-cell"><strong>${esc(x.title)}</strong><div class="case-sub">${esc(x.id)} · ${rev(i.revision)} · HTML</div></td><td data-label="Purpose">${esc(x.purpose || i.purpose)}</td><td data-label="Availability">${pill(x.availability, tone(x.availability))}</td><td data-label="Bytes" class="num">${esc(bytes(x.bytes))}</td><td data-label="Content identity"><code class="hash">${esc(shortHash(x.hash))}</code></td><td data-label="Inspect"><div class="row-actions">${button('Preview', 'preview-item', `data-item="${esc(x.id)}" ${x.availability === 'Available' ? '' : 'disabled'}`, 'text-button')}${button('Download', 'download-item', `data-item="${esc(x.id)}" ${x.availability === 'Available' ? '' : 'disabled'}`, 'text-button')}</div></td></tr>`).join('')}<tr><td class="case-cell"><strong>Controlled PDF rendition</strong><div class="case-sub">Not generated by this preview</div></td><td data-label="Purpose">${esc(i.purpose)}</td><td data-label="Availability">${pill('PDF not included in this preview', 'info')}</td><td data-label="Bytes" class="num">Not available</td><td data-label="Content identity"><code class="hash">No content identity</code></td><td data-label="Inspect"><small class="muted">Browser print is not an approved controlled PDF renderer.</small></td></tr></tbody></table></div><div class="table-legend"><span>Byte counts and SHA-256 identities are computed from the exact content this file can produce and download.</span><span>A content hash proves byte identity only. It does not prove approval, retention or authenticity.</span></div>`;
  }
  function detail() {
    const o = output(), i = issue();
    if (!i) return recordToolbar() + issueBanner(o, i) + pageHead('Output &amp; issue detail', 'This output has no retained issue in the preview scope.') + `<section class="card pad"><h3>${esc(o.title)}</h3>${meta([['Output reference', o.ref],['Type', `${o.type} · ${o.typeName}`],['Owning domain', o.domain],['Classification', o.classification],['Approved audience', o.audienceName],['Applicable policy', o.policy || 'Not configured']])}${button('Open readiness and domain review', 'to-readiness', '', 'primary')}</section>`;
    const manifest = M.manifestOf(state, o, i), entry = manifest.find(x => x.id === previewItem) || manifest[0];
    return recordToolbar()
      + `<section class="card record-banner"><div class="section-kicker">${esc(o.ref)} · ${esc(o.type)} ${esc(o.typeName)}</div><h2>${esc(o.title)}</h2><div class="label-row">${pill(rev(i.revision))}${pill(M.issueState(state, o, i), tone(M.issueState(state, o, i)))}${pill(i.purpose, 'info')}${pill(o.classification)}<span class="small muted">Issue ${esc(i.ref)} · owner ${esc(o.owner)}</span></div></section>`
      + issueBanner(o, i)
      + `<div class="document-layout"><section class="viewer" aria-label="Exact output preview"><div class="viewer-toolbar"><span>Exact content · ${esc(entry ? entry.id : 'none')} · ${rev(i.revision)}</span><div class="actions">${button('Text size +', 'zoom', 'aria-pressed="false"')}${button('Export manifest', 'download-manifest')}</div></div><div class="viewer-scroll" tabindex="0" aria-label="Output content">${paper(o, i, entry)}</div></section>`
      + `<aside class="stack inspector"><section class="card"><h3>Issue and preparation evidence</h3>${meta([['Business revision', rev(i.revision)],['Issue purpose', i.purpose],['Authorising decision', i.decision],['Issuer', i.issuer],['Output preparation time', stamp(i.preparedAt)],['Actual issue time', stamp(i.issuedAt)],['Reserved issue identity', i.reservedRef || i.ref],['Classification', o.classification],['Template', `${o.template.id} v${o.template.version}`]])}<p class="small muted">Preparation time and actual issue time are separate facts. No issued file is edited afterwards to add a time, signature or response mark.</p></section>`
      + `<section class="card"><h3>Selected source basis</h3>${meta(i.basis)}<p class="small muted">${esc(o.responseNote)}</p></section>`
      + `<section class="card"><h3>Linked records</h3>${meta([['Customer / site', `${o.customer} / ${o.site}`],['Location', o.location],['Linked', o.linked],['Approved audience', o.audienceName],['Distribution route', o.distributable ? 'Available in this preview' : 'None']])}${button('Open distribution and responses', 'to-distribution', '', 'text-button')}</section></aside></div>`
      + `<section class="card space manifest-card"><div class="card-head"><h3>Output bundle manifest · ${esc(i.ref)}</h3>${pill(manifest.length + ' item' + (manifest.length === 1 ? '' : 's'))}</div>${manifestTable(o, i)}</section>`;
  }

  function domainPanel(o) {
    const panels = {
      Estimating:['Commercial release preview', [['Approved scope and terms', 'Bound to the exact quotation revision and its selected options.'],['Validity and exclusions', 'Printed in the issued offer; not re-derived at distribution.'],['Response boundary', 'ES-06 owns customer response and negotiation. This centre records receipt only.']]],
      Engineering:['Engineering issue preview', [['Issue purpose', 'Issued for review, issued for construction and issued for procurement are separate authorisations and are never interchangeable.'],['Exact manifest', 'Each drawing carries its own identity, revision and purpose. A revised drawing does not replace the item in an earlier transmittal.'],['Native authoring', 'CAD authoring and file dependencies remain in the validated Engineering environment.']]],
      Service:['Service pack preview', [['Appointment and crew', 'Appointment SYN-PPO-APT-000044 with three fictional assignments.'],['Readiness', 'Pack checking, issue, withdrawal and acknowledgement semantics remain with Service.'],['Work authority', 'Acknowledging an issued pack does not authorise attendance or work.']]],
      Projects:['Project release preview', [['Reporting cutoff', 'The stated cutoff is part of the issued content and cannot be implied from the distribution date.'],['Stakeholder group', 'The approved distribution group is recorded with the issue.'],['Acceptance', 'A stakeholder receipt is not project acceptance or a commercial agreement.']]],
      Finance:['Finance evidence preview', [['Quantity basis', 'Captured, reviewed, allocated and billable quantities remain distinct.'],['Distribution', 'OUT-14 has no customer distribution route.'],['ERP authority', 'MYOB Acumatica remains the intended ERP authority; no posting is implied.']]]
    };
    const [title, rows] = panels[o.domain] || ['Domain release preview', [['Owning domain', 'The owning domain retains its own release rule.']]];
    return `<div class="callout neutral space"><strong>${esc(title)} · labelled preview</strong>These controls describe the owning domain's decision. No connected domain record is changed by this file.</div>${meta(rows)}`;
  }
  function readiness() {
    const o = output(), rows = M.readiness(state, o), draft = M.draftOf(state, o), review = M.reviewOf(state, o), preparation = M.preparationOf(state, o), place = M.position(state, o);
    const blockingRows = M.blocking(state, o);
    const step = (label, help, action, enabled, extra = '') => `<div class="step-row"><div><strong>${esc(label)}</strong><p class="small muted">${esc(help)}</p></div>${button(label, action, `${enabled ? '' : 'disabled'} ${extra}`, 'primary')}</div>`;
    return recordToolbar() + pageHead('Readiness &amp; domain review', 'Explain what the current evidence supports, and what is preventing the intended release.', pill(place.stage, tone(place.stage)))
      + `<div class="review-layout"><div class="stack"><section class="card"><div class="card-head"><h3>Readiness evidence</h3>${pill(blockingRows.length ? blockingRows.length + ' outstanding' : 'All checks met', blockingRows.length ? 'warning' : 'success')}</div><div class="table-wrap"><table class="readiness-table"><thead><tr><th>Check</th><th>Status</th><th>Reason</th><th>Evidence</th><th>Owner</th><th>Action</th></tr></thead><tbody>${rows.map(r => `<tr><td class="case-cell"><strong>${esc(r.name)}</strong></td><td data-label="Status">${pill(r.status, tone(r.status))}</td><td data-label="Reason">${esc(r.reason)}</td><td data-label="Evidence">${esc(r.evidence)}</td><td data-label="Owner">${esc(r.owner)}</td><td data-label="Action">${esc(r.action)}</td></tr>`).join('')}</tbody></table></div><div class="card-foot">An unknown source or an unconfigured rule is never counted as passed, and no completion percentage replaces this decision.</div></section>`
      + `<section class="card pad"><h3>Successor and release sequence</h3><p class="small muted">Each action rechecks the selected source, policy, audience and local model version. A changed basis retains the original attempt and requires an explicit fresh review.</p>`
      + (o.successor ? step('Create successor draft', review && review.outcome === 'Returned' ? 'The domain returned the last successor. Create a fresh one; the returned draft and its decision are retained.' : draft ? `Draft ${rev(draft.revision)} exists: ${draft.change}` : 'State the change that requires a successor revision.', 'successor', canAct('createSuccessor') && (!draft || (review && review.outcome === 'Returned'))) : `<p class="small muted">No successor definition exists for this output in the preview fixtures.</p>`)
      + (o.successor ? step('Open domain review', review ? `${review.outcome} by ${review.actor} for ${review.purpose}.` : 'The owning domain records the decision against this exact basis.', 'review', canAct('reviewDraft') && !!draft && !review) : '')
      + (o.successor ? step('Prepare exact output', preparation ? `Operation ${preparation.id} · ${preparation.state}` : 'Reserve the issue identity and generate the verified bundle.', 'prepare', canAct('prepareOutput') && M.releasable(state, o) && !preparation) : '')
      + (preparation && preparation.state === 'Finalisation outcome unknown' ? step('Recover original operation', 'Locate the retained bundle and continue the same operation. The document is not generated again.', 'recover', canAct('recoverPreparation')) : '')
      + (o.successor ? step('Record domain issue', preparation && preparation.state === 'Issued' ? 'This original operation is already released.' : 'Commit the immutable issue event and its actual issue time.', 'release', canAct('releaseIssue') && !!preparation && preparation.state === 'Generated') : '')
      + `</section></div>`
      + `<aside class="stack"><section class="card pad"><div class="section-kicker">Owning domain</div><h3>${esc(o.domain)}</h3>${meta([['Applicable policy', o.policy || 'Not configured'],['Approved audience', o.audienceName],['Reviewed source basis', o.sourceReviewed ? `${o.sourceReviewed.ref} · ${o.sourceReviewed.decision}` : 'Not recorded'],['Template', `${o.template.id} v${o.template.version}`],['Preview profile', `${M.ROLES[actor]} · ${M.PEOPLE[actor]}`]])}${button('Open domain review preview', 'domain-preview', '', 'text-button')}<p class="small muted">${actor === 'issuer' ? 'This profile may record the domain decision for permitted records.' : 'Select the Domain reviewer / issuer profile to record a decision.'}</p></section>`
      + (preparation ? `<section class="card pad"><div class="section-kicker">Original preparation operation</div><h3>${esc(preparation.id)}</h3>${meta([['State', preparation.state],['Reserved issue identity', preparation.reservedRef],['Output preparation time', stamp(preparation.reservedAt)],['Bundle items', String(preparation.bundle.length)],['Verified bytes', preparation.bundle.map(x => bytes(x.bytes)).join(', ')]])}${preparation.recovery ? `<div class="decision-record"><strong>Reconciled</strong><p>${esc(preparation.recovery.found)}</p><p>${esc(preparation.recovery.reason)}</p><span class="small">${esc(preparation.recovery.actor)} · ${stamp(preparation.recovery.at)}</span></div>` : ''}</section>` : '')
      + (review ? `<section class="card pad"><div class="section-kicker">Retained domain decision</div><h3>${esc(review.outcome)} · ${rev(review.revision)}</h3><p class="small">${esc(review.purpose)}</p><p class="small muted">${esc(review.reason)}</p><span class="small muted">${esc(review.actor)} · ${stamp(review.at)}</span></section>` : '')
      + `</aside></div>`;
  }

  function attemptRow(o, i, r) {
    const attempts = M.attemptsOf(state, o, i).filter(a => a.recipient === r.id), responses = M.responsesOf(state, o, i).filter(x => x.recipient === r.id);
    const latest = attempts.at(-1), outcome = latest ? M.outcomeOf(state, latest) : 'No attempt';
    const open = expanded[`${i.id}:${r.id}`];
    const current = M.issueState(state, o, i) === 'Current';
    return `<article class="recipient-card"><div class="recipient-main"><div><div class="section-kicker">${esc(r.organisation)} · ${esc(r.role)}</div><h3>${esc(r.name)}</h3><div class="case-sub wide-word">${esc(r.destination)}${r.channel === r.destination ? '' : ' · ' + esc(r.channel)}</div><div class="label-row space">${pill(outcome, tone(outcome))}${responses.length ? pill(responses[0].response, tone(responses[0].response)) : pill('No response recorded', 'info')}</div><p class="small muted">${esc(latest ? M.deliveryEvidence(state, latest, r) : 'No distribution attempt has been recorded for this recipient and issue.')}</p><p class="small muted">Open or download evidence: ${esc(M.openEvidence(r))}</p>${button(open ? 'Hide attempt detail' : attempts.length ? `Show ${attempts.length} attempt${attempts.length === 1 ? '' : 's'}` : 'Show attempt detail', 'expand', `data-key="${esc(i.id)}:${esc(r.id)}"`, 'text-button')}</div>`
      + `<div class="usage-action">${o.distributable ? button('Prepare distribution', 'distribute', `data-recipient="${esc(r.id)}" ${canAct('prepareDistribution') && current ? '' : 'disabled'}`, 'primary') : `<span class="inline-warning">${esc(o.distributionNote)}</span>`}`
      + (latest && latest.outcome === 'Prepared' ? button('Simulate attempt', 'simulate', `data-attempt="${esc(latest.id)}" ${canAct('simulateAttempt') ? '' : 'disabled'}`) : '')
      + (latest && outcome === 'Outcome unknown' ? button('Reconcile outcome', 'reconcile', `data-attempt="${esc(latest.id)}" ${canAct('reconcileAttempt') ? '' : 'disabled'}`) : '')
      + (!responses.length && o.responseKind !== 'Not applicable' && current ? button('Record response', 'response', `data-recipient="${esc(r.id)}" ${canAct('recordResponse') ? '' : 'disabled'}`) : '')
      + followupControl(o, `${i.id}:${r.id}`) + `</div></div>`
      + (open ? `<div class="attempt-list">${attempts.length ? attempts.map(a => { const reconciliation = state.reconciliations.find(x => x.attempt === a.id); return `<div class="attempt"><div class="label-row">${pill(M.outcomeOf(state, a), tone(M.outcomeOf(state, a)))}<span class="small muted">${esc(a.id)} · ${stamp(a.simulatedAt || a.at)} · ${esc(a.actor)}</span></div><p class="small">${esc(a.evidence)}</p>${a.reason ? `<p class="small muted">Reason: ${esc(a.reason)}</p>` : ''}${reconciliation ? `<div class="callout neutral small"><strong>Reconciled as ${esc(reconciliation.stated)}</strong>${esc(reconciliation.reason)} Original reference ${esc(reconciliation.reference)} · ${esc(reconciliation.actor)}.</div>` : ''}</div>`; }).join('') : '<p class="small muted">No attempt has been recorded. This is not evidence that the recipient was reached by another route.</p>'}`
        + responses.map(x => `<div class="attempt"><div class="label-row">${pill(x.response, tone(x.response))}<span class="small muted">${stamp(x.at)}</span></div><p class="small">Stated respondent ${esc(x.respondent)}; captured by ${esc(x.capturedBy)}.</p><p class="small muted">${esc(x.strength)}.${x.remarks ? ' ' + esc(x.remarks) : ''}</p><p class="small muted">Bound to presented content ${esc(shortHash(x.presentation))}</p></div>`).join('') + `</div>` : '')
      + '</article>';
  }
  function followupControl(o, target) {
    const followup = state.followups.find(f => f.target === target);
    return followup ? `<div class="followup-note">${pill('Prepared locally', 'info')}<span class="small"><strong>${esc(followup.owner)}</strong> · due ${date(followup.due)}</span><span class="small muted">${esc(followup.reason)}</span><span class="small muted">Receipt by ${esc(followup.domain)} is pending.</span></div>` : button('Prepare follow-up', 'followup', `data-output="${esc(o.id)}" data-target="${esc(target)}" ${canAct('prepareFollowup') ? '' : 'disabled'}`);
  }
  function distribution() {
    const o = output(), i = issue();
    if (!i) return recordToolbar() + pageHead('Distribution &amp; responses', 'No issue has been retained for this output, so no recipient evidence exists.');
    const recipients = M.recipientsOf(state, o, i);
    return recordToolbar() + pageHead('Distribution &amp; responses', 'One row per exact issue and recipient context, with its own attempts and explicit response.', pill(`${rev(i.revision)} · ${M.issueState(state, o, i)}`, tone(M.issueState(state, o, i))))
      + issueBanner(o, i)
      + `<div class="callout neutral space"><strong>${esc(i.ref)} · ${esc(i.purpose)}</strong>${distributionSummaryText(o, i)} ${esc(o.responseNote)}</div>`
      + (directoryFailed ? `<section class="card empty"><h3>Recipient directory unavailable</h3><p>The recipient read failed. No conclusion about recipients or delivery can be drawn from this state.</p>${button('Retry recipient read', 'restore-directory', '', 'primary')}</section>`
        : recipients.length ? `<div class="recipient-list">${recipients.map(r => attemptRow(o, i, r)).join('')}</div>`
        : `<section class="card empty"><h3>No recipients in this preview scope</h3><p>This issue has no permitted recipient context for the selected profile.</p></section>`)
      + `<div class="callout neutral" style="margin-top:20px"><strong>No message, invitation, sharing grant or customer notification is produced by this file.</strong>Sent, delivered, opened and acknowledged remain separate facts, and a coordinator completing a task never creates a recipient response.</div>`;
  }
  function distributionSummaryText(o, i) {
    const recipients = M.recipientsOf(state, o, i), attempts = M.attemptsOf(state, o, i);
    const delivered = recipients.filter(r => attempts.some(a => a.recipient === r.id && M.outcomeOf(state, a) === 'Delivered')).length;
    const responses = M.responsesOf(state, o, i).length;
    return `${delivered} of ${recipients.length} approved recipients have supported delivery evidence for this exact issue, and ${responses} of ${recipients.length} have recorded an explicit response. The remainder are not implied to have received it.`;
  }

  function exceptionView() {
    const items = M.exceptions(state, actor);
    const recovery = {'Missing exact item':['Inspect the affected issue manifest', 'open-manifest'], 'Distribution outcome unknown':['Reconcile the original attempt', 'reconcile-exception'], 'Distribution failed':['Prepare a new authorised attempt', 'open-distribution'], 'Source changed after preparation':['Open readiness and refresh the basis', 'to-readiness'], 'Domain release policy not configured':['Open readiness and domain review', 'to-readiness'], 'Finalisation outcome unknown':['Continue the original operation', 'recover-exception']};
    return pageHead('Exceptions &amp; recovery', 'Own what failed or remains uncertain, and take the safe action for that exact cause.', pill(items.length + ' open exception' + (items.length === 1 ? '' : 's'), items.length ? 'warning' : 'success'))
      + (items.length ? `<div class="exception-list">${items.map(e => { const o = M.getOutput(e.output), [label, action] = recovery[e.category] || ['Prepare owned follow-up', 'followup'];
        return `<article class="card exception-card"><div><div class="label-row">${pill(e.category, tone(e.category === 'Missing exact item' || e.category === 'Distribution failed' ? 'Failed' : 'Needs action'))}<span class="small muted">${esc(e.id)}</span></div><h3>${esc(o.title)}</h3><div class="record-id">${esc(o.ref)} · ${esc(o.domain)} · ${esc(o.customer)} / ${esc(o.site)}${e.issue ? ' · issue ' + esc(M.getIssue(state, o, e.issue)?.ref || e.issue) : ''}${e.recipient ? ' · recipient ' + esc(e.recipient) : ''}</div>`
          + meta([['What is known', e.known],['What is unknown', e.unknown],['Owner', e.owner],['Due date', 'Date needed'],['Recorded since', stamp(e.since)]])
          + `<p class="exception-next"><strong>Safe next action.</strong> ${esc(e.next)}</p>${button(label, action, `data-output="${esc(e.output)}" data-issue="${esc(e.issue || '')}" data-target="${esc(e.id)}" ${({'reconcile-exception':canAct('reconcileAttempt'), 'recover-exception':canAct('recoverPreparation')})[action] === false ? 'disabled' : ''}`, 'text-button')}${({'reconcile-exception':canAct('reconcileAttempt'), 'recover-exception':canAct('recoverPreparation')})[action] === false ? `<p class="small muted">${action === 'reconcile-exception' ? 'The Distribution coordinator profile owns reconciliation.' : 'The Output coordinator profile owns operation recovery.'}</p>` : ''}</div><div class="usage-action">${followupControl(o, e.id)}</div></article>`;
      }).join('')}</div>` : `<section class="card empty"><h3>No open exceptions in this preview scope</h3><p>This result covers the permitted records for the selected profile only.</p></section>`)
      + `<div class="callout neutral" style="margin-top:20px"><strong>Recovery is specific, not generic.</strong>An unknown outcome is reconciled before any repeat, a retained bundle is continued rather than regenerated, and a missing exact version is never replaced by the newest available file.</div>`;
  }

  function history() {
    const o = output(), draft = M.draftOf(state, o);
    const kinds = [['','All events'],['issue','Issue events'],['distribution','Distribution and responses'],['preparation','Preparation and review'],['followup','Owned follow-up']];
    const entries = [];
    for (const i of M.issuesOf(state, o)) {
      entries.push({at:i.issuedAt, kind:'issue', title:`Issued ${rev(i.revision)} · ${i.purpose}`, body:`${i.ref} released by ${i.issuer}. Output preparation time ${stamp(i.preparedAt)} is retained separately.`});
      const withdrawal = M.withdrawalOf(state, i);
      if (withdrawal) entries.push({at:withdrawal.at, kind:'issue', title:`Withdrawn ${rev(i.revision)}`, body:`${withdrawal.reason} Recorded by ${withdrawal.actor}. Permitted historical access is retained.`});
      for (const a of M.attemptsOf(state, o, i)) entries.push({at:a.simulatedAt || a.at, kind:'distribution', title:`Distribution attempt ${M.outcomeOf(state, a)} · ${a.recipient}`, body:`${a.evidence} Attempt ${a.id} on ${i.ref}.`});
      for (const r of M.responsesOf(state, o, i)) entries.push({at:r.at, kind:'distribution', title:`${r.response} · ${r.respondent}`, body:`${r.strength}. Bound to ${i.ref} ${rev(i.revision)}.`});
    }
    for (const e of state.events.filter(x => x.output === o.id)) entries.push({at:e.at, kind:['prepareFollowup'].includes(e.action) ? 'followup' : ['prepareDistribution','simulateAttempt','reconcileAttempt','recordResponse'].includes(e.action) ? 'distribution' : ['releaseIssue','withdrawIssue'].includes(e.action) ? 'issue' : 'preparation', title:({createSuccessor:'Successor draft created', reviewDraft:'Domain decision retained', prepareOutput:'Output preparation operation started', recoverPreparation:'Original operation reconciled', releaseIssue:'Domain issue event committed', withdrawIssue:'Issue withdrawn', prepareDistribution:'Distribution intent prepared', simulateAttempt:'Simulated attempt outcome recorded', reconcileAttempt:'Unknown outcome reconciled', recordResponse:'Explicit response recorded', prepareFollowup:'Owned follow-up prepared'})[e.action], body:`${e.actor} · local event ${e.id}`});
    const shown = entries.filter(e => !historyFilter || e.kind === historyFilter).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const all = M.issuesOf(state, o), current = all.find(i => M.issueState(state, o, i) === 'Current'), previous = all.filter(i => !current || i.id !== current.id).at(-1);
    return recordToolbar() + pageHead('History &amp; change impact', 'Retained events, revision comparison and the records or recipients a change affects.')
      + `<div class="history-layout"><div class="stack"><section class="card"><div class="card-head"><h3>Retained events</h3><div class="field" style="margin:0"><label for="history-filter" class="sr-only">Filter history</label><select id="history-filter">${options(kinds, historyFilter)}</select></div></div><div class="pad timeline-wrap">${shown.length ? shown.map(e => `<article class="timeline-item"><div class="stamp">${date(e.at)}<br>${esc(String(e.at).slice(11, 16))} UTC</div><div><h3>${esc(e.title)}</h3><p>${esc(e.body)}</p></div></article>`).join('') : '<p class="small muted">No events match this filter. Filtering narrows the view and never changes the retained history.</p>'}</div></section></div>`
      + `<aside class="stack"><section class="card pad"><div class="section-kicker">Revision comparison</div><h3>${current ? rev(current.revision) : 'No issue'}${previous ? ' against ' + rev(previous.revision) : ''}</h3>`
      + (current && previous ? `<div class="table-wrap"><table class="change-table"><thead><tr><th>Element</th><th>${rev(previous.revision)}</th><th>${rev(current.revision)}</th></tr></thead><tbody>${[...new Set([...previous.basis.map(x => x[0]), ...current.basis.map(x => x[0])])].map(k => { const a = previous.basis.find(x => x[0] === k)?.[1] || 'Not in this revision', b = current.basis.find(x => x[0] === k)?.[1] || 'Not in this revision'; return `<tr><td>${esc(k)}</td><td data-label="${rev(previous.revision)}" class="${a === b ? 'unchanged' : ''}">${esc(a)}</td><td data-label="${rev(current.revision)}" class="${a === b ? 'unchanged' : 'changed'}">${esc(b)}</td></tr>`; }).join('')}<tr><td>Manifest items</td><td data-label="${rev(previous.revision)}">${previous.items.map(x => esc(x.id)).join('<br>')}</td><td data-label="${rev(current.revision)}" class="changed">${current.items.map(x => esc(x.id)).join('<br>')}</td></tr></tbody></table></div><p class="small muted">The earlier manifest stays exact. A revised item creates a successor set; it never replaces the corresponding item in an earlier transmittal or handover pack.</p>` : '<p class="small muted">A comparison needs two retained issues for this output.</p>')
      + `</section>`
      + `<section class="card pad"><div class="section-kicker">Change impact</div><h3>Affected records and recipients</h3>${current ? `<ul class="scope-list">${M.recipientsOf(state, o, current).map(r => `<li>${esc(r.name)} · ${esc(r.organisation)}${M.responsesOf(state, o, current).some(x => x.recipient === r.id) ? '' : ' · response outstanding'}</li>`).join('')}<li>${esc(o.linked)}</li></ul>` : ''}${draft ? `<div class="callout warning"><strong>Successor draft ${rev(draft.revision)} exists.</strong>${esc(draft.change)}</div>` : ''}${current ? followupControl(o, current.id) : ''}<p class="small muted">Preparing a follow-up produces a local handover only. It does not replace a pack, reschedule a visit, accept a variation or change Finance processing.</p>${button(selected && issue() ? `Withdraw ${rev(issue().revision)}` : 'Withdraw this issue', 'withdraw', canAct('withdrawIssue') && issue() && M.issueState(state, o, issue()) === 'Current' ? '' : 'disabled')}<p class="small muted">Only the issue in force can be withdrawn. Select it in the Exact issue picker above.</p></section></aside></div>`;
  }

  function render() {
    ensureSelection(); tabs();
    main.innerHTML = (!output() && !['queue','exceptions'].includes(view))
      ? pageHead('Select an output', 'Choose a visible output in the queue to inspect its exact issue and evidence.') + button('Return to queue', 'back-queue', '', 'primary')
      : ({queue, detail, readiness, distribution, exceptions:exceptionView, history})[view]();
    if (blocked) showBlocked($('save-notice').dataset.message);
  }

  function openSnapshot(id) {
    snapshotFocus = document.activeElement; selected = id; selectedIssue = null; ensureSelection();
    const o = output(), i = issue(), place = M.position(state, o);
    $('snapshot-title').textContent = o.title;
    $('snapshot-body').innerHTML = `<div class="record-id">${esc(o.ref)} · ${esc(o.type)} ${esc(o.typeName)}</div><div class="label-row space">${i ? pill(rev(i.revision)) + pill(M.issueState(state, o, i), tone(M.issueState(state, o, i))) : pill('No issue retained', 'info')}${pill(place.stage, tone(place.stage))}</div>`
      + meta([['Owning domain', o.domain],['Customer / site', `${o.customer} / ${o.site}`],['Location', o.location],['Linked', o.linked],['Owner', o.owner],['Classification', o.classification],['Approved audience', o.audienceName],['Applicable policy', o.policy || 'Not configured'],['Issue purpose', i ? i.purpose : 'None retained'],['Actual issue time', i ? stamp(i.issuedAt) : 'Not issued']])
      + `<hr class="rule"><h3>Next action</h3><p class="small muted">${esc(place.next)}</p><h3>Distribution</h3><p class="small muted">${i ? esc(distributionSummaryText(o, i)) : 'No issue has been retained, so no recipient evidence exists.'}</p>`;
    if (snapshot.open) snapshot.close();
    if (window.innerWidth >= 1180) { snapshot.show(); document.body.classList.add('has-snapshot'); } else snapshot.showModal();
    snapshot.querySelector('button').focus();
  }
  function closeSnapshot() { if (snapshot.open) snapshot.close(); document.body.classList.remove('has-snapshot'); }
  snapshot.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !snapshot.matches(':modal')) return;
    const controls = [...snapshot.querySelectorAll('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')], first = controls[0], last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  snapshot.addEventListener('close', () => { document.body.classList.remove('has-snapshot'); if (snapshotFocus?.isConnected) snapshotFocus.focus({preventScroll:true}); });
  function openDialog(title, html, onSave = null) { returnFocus = document.activeElement; formDirty = false; form = onSave; $('dialog-title').textContent = title; $('dialog-body').innerHTML = html; dialog.showModal(); }
  function closeDialog(force = false) { if (!force && formDirty && !window.confirm('Discard unsaved form entries?')) return; formDirty = false; form = null; dialog.close(); $('dialog-body').innerHTML = ''; if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true}); }
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
  dialog.addEventListener('input', () => { formDirty = true; });
  const formFooter = label => `<div id="form-error" class="error" role="alert"></div><div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">${esc(label)}</button></div>`;

  function openForm(kind, params = {}) {
    const o = output(), i = issue(), draft = M.draftOf(state, o), preparation = M.preparationOf(state, o);
    const base = {output:o.id};
    let title, html, action, label;
    if (kind === 'successor') {
      title = 'Create successor draft'; action = 'createSuccessor'; label = 'Save successor draft';
      html = `<div class="callout neutral space"><strong>${esc(o.ref)} · ${rev(o.successor.revision)}</strong>${esc(o.successor.change)}</div>${meta(o.successor.basis)}${field('reason', 'Why a successor is required', textarea('reason'))}`;
    } else if (kind === 'review') {
      title = 'Record domain decision'; action = 'reviewDraft'; label = 'Save domain decision'; base.fingerprint = draft.fingerprint;
      html = domainPanel(o) + `<div class="callout neutral space"><strong>${esc(o.ref)} · ${rev(draft.revision)}</strong>The decision belongs to this exact basis, purpose and audience only.</div>`
        + field('outcome', 'Domain decision', '<select id="outcome" name="outcome"><option>Checked</option><option>Returned</option></select>')
        + field('purpose', 'Stated issue purpose', `<input id="purpose" name="purpose" required maxlength="300" value="${esc(draft.purpose)}">`)
        + field('reason', 'Decision rationale', textarea('reason'));
    } else if (kind === 'prepare') {
      title = 'Prepare exact output'; action = 'prepareOutput'; label = 'Prepare output'; base.fingerprint = draft.fingerprint;
      html = `<div class="callout neutral space"><strong>Reserved identity and preparation time</strong>The generated file prints a reserved issue identity and output-preparation time. Those are effective only on release; actual issue time is committed separately.</div>${meta([['Successor revision', rev(draft.revision)],['Manifest items', M.draftItems(o).map(x => x.id).join(', ')],['Template', `${o.template.id} v${o.template.version}`],['Approved audience', M.draftRecipients(o).map(r => r.name).join(', ')]])}<p class="small muted">Preparation is not issue. The bundle is verified before any release is offered.</p>`;
    } else if (kind === 'recover') {
      title = 'Reconcile original operation'; action = 'recoverPreparation'; label = 'Continue original operation'; base.operation = preparation.id;
      html = `<div class="callout warning space"><strong>Finalisation outcome unknown · ${esc(preparation.id)}</strong>The bundle was retained locally. The document must not be generated again, and another issue must not be created blindly.</div>${meta([['Reserved identity', preparation.reservedRef],['Retained items', preparation.bundle.map(x => `${x.id} · ${bytes(x.bytes)}`).join('; ')],['Recorded identity', preparation.bundle.map(x => shortHash(x.hash)).join('; ')]])}${field('reason', 'What the original lookup established', textarea('reason'))}`;
    } else if (kind === 'release') {
      title = 'Record domain issue'; action = 'releaseIssue'; label = 'Record issue event'; base.operation = preparation.id; base.fingerprint = preparation.fingerprint;
      html = domainPanel(o) + `<div class="callout neutral space"><strong>${esc(preparation.reservedRef)} · ${rev(preparation.revision)}</strong>Releasing commits an immutable issue event with its own actual issue time. The predecessor becomes superseded and keeps its bytes, recipients and responses.</div>${meta([['Verified bundle', preparation.bundle.map(x => `${x.id} · ${bytes(x.bytes)}`).join('; ')],['Content identity', preparation.bundle.map(x => shortHash(x.hash)).join('; ')],['Output preparation time', stamp(preparation.reservedAt)]])}`;
    } else if (kind === 'distribute') {
      title = 'Prepare distribution'; action = 'prepareDistribution'; label = 'Prepare distribution'; base.issue = i.id; base.recipient = params.recipient;
      const r = M.recipientsOf(state, o, i).find(x => x.id === params.recipient);
      html = `<div class="callout neutral space"><strong>${esc(r.name)} · ${esc(r.organisation)}</strong>${esc(r.role)}. Approved destination ${esc(r.destination)} over ${esc(r.channel)}.</div><p class="small muted">A free-text name or an inferred address is not evidence of the intended recipient. This records an authorised intent only; no message is produced.</p>${field('reason', 'Why this recipient receives this exact issue', textarea('reason'))}`;
    } else if (kind === 'simulate') {
      title = 'Record simulated attempt outcome'; action = 'simulateAttempt'; label = 'Record outcome'; base.issue = i.id; base.attempt = params.attempt;
      const attempt = M.attemptsOf(state, o, i).find(a => a.id === params.attempt), r = M.recipientsOf(state, o, i).find(x => x.id === attempt.recipient);
      html = `<div class="callout neutral space"><strong>${esc(attempt.id)} · ${esc(r.name)}</strong>${esc(r.channel)}. ${r.capability === 'delivery' ? 'This simulated channel can return delivery evidence.' : 'This simulated channel returns no delivery evidence; only Sent can be recorded.'}</div>`
        + field('outcome', 'Simulated outcome', `<select id="outcome" name="outcome">${options(r.capability === 'delivery' ? ['Sent','Delivered','Outcome unknown','Failed'] : ['Sent','Outcome unknown','Failed'], 'Delivered')}</select>`, 'Sent is not delivered, and delivered is not opened or acknowledged.');
    } else if (kind === 'reconcile') {
      title = 'Reconcile unknown outcome'; action = 'reconcileAttempt'; label = 'Record reconciliation'; base.issue = params.issue || i.id; base.attempt = params.attempt;
      const reconciled = M.recipientsOf(state, o, M.getIssue(state, o, base.issue)).find(x => x.id === M.attemptsOf(state, o, M.getIssue(state, o, base.issue)).find(a => a.id === params.attempt)?.recipient);
      html = `<div class="callout warning space"><strong>Original attempt ${esc(params.attempt)}</strong>The original attempt and its evidence are retained. Reconciliation is additive; it never rewrites the attempt.${reconciled && reconciled.capability !== 'delivery' ? ' This simulated channel supplies no delivery evidence, so a lookup cannot establish Delivered.' : ''}</div>`
        + field('finding', 'What the original lookup established', `<select id="finding" name="finding">${options(reconciled && reconciled.capability === 'delivery' ? ['Delivered', 'Failed', 'No provider record'] : ['Failed', 'No provider record'], 'Failed')}</select>`)
        + field('reference', 'Original provider or operation reference', '<input id="reference" name="reference" required maxlength="200" placeholder="For example: SYN-PPO-OP-000512">')
        + field('reason', 'Reconciliation note', textarea('reason'));
    } else if (kind === 'response') {
      title = 'Record explicit response'; action = 'recordResponse'; label = 'Record response'; base.issue = i.id; base.recipient = params.recipient; base.presentation = M.presentationHash(state, o, i);
      const r = M.recipientsOf(state, o, i).find(x => x.id === params.recipient);
      html = `<div class="callout neutral space"><strong>${esc(r.name)} · ${esc(o.responseKind)}</strong>Bound to the exact presented content ${esc(shortHash(base.presentation))} of ${esc(i.ref)} ${rev(i.revision)}.</div><p class="small muted">${esc(o.responseNote)} A response is never inferred from delivery, download or open tracking.</p>`
        + field('response', 'Response', `<select id="response" name="response">${options(['Acknowledged','Received','Accepted with reservations','Declined','Unavailable'], 'Acknowledged')}</select>`)
        + field('remarks', 'Remarks', '<textarea id="remarks" name="remarks" maxlength="2000"></textarea>', 'Required for accepted with reservations, declined and unavailable.');
    } else if (kind === 'withdraw') {
      title = 'Withdraw this issue'; action = 'withdrawIssue'; label = 'Record withdrawal'; base.issue = i.id;
      html = `<div class="callout warning space"><strong>${esc(i.ref)} · ${rev(i.revision)}</strong>Withdrawal does not delete or regenerate the issued bytes. Permitted historical access is retained with the reason, actor and time.</div>${field('reason', 'Withdrawal reason', textarea('reason'))}`;
    } else {
      title = 'Prepare owned follow-up'; action = 'prepareFollowup'; label = 'Save follow-up'; base.target = params.target;
      html = `<div class="callout neutral space"><strong>${esc(o.ref)} · ${esc(params.target)}</strong>Prepared locally for the receiving owner in ${esc(o.domain)}. This does not send, schedule, accept or complete the action.</div>`
        + field('reason', 'Next action', textarea('reason'))
        + `<div class="field-row">${field('owner', 'Action owner', `<select id="owner" name="owner">${ownerSelect()}</select>`)}${field('due', 'Due date', '<input id="due" name="due" type="date" value="2026-09-24">', 'Leave empty to show Date needed.')}</div>`;
    }
    openDialog(title, `<form id="output-form">${html}${formFooter(label)}</form>`, data => { save(action, {...base, ...data}); closeDialog(true); render(); notify('Saved in this browser. Retained issues, recipients and responses are unchanged.'); });
  }

  function download(content, name, type = 'application/json') {
    const blob = new Blob([content], {type}), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function guide() {
    openDialog('Review guide', `<p>This is the DK-03 standalone design for Powerplants One. Every output, issue, recipient, response and provider identity is fictional.</p>`
      + `<ol class="quiet-list"><li>Open the technician job pack and inspect issue r04, its recipients and their acknowledgements.</li><li>Open readiness and create the successor draft for the revised drawing r03.</li><li>Record the Service domain decision as the Domain reviewer / issuer profile.</li><li>Prepare the exact output. Finalisation is interrupted after the bundle is retained.</li><li>Reconcile the original operation, then record the domain issue event.</li><li>As the Distribution coordinator, prepare two attempts and record one delivered and one unknown outcome.</li><li>Reconcile the unknown attempt before any new distribution intent.</li><li>As the Service technician, record one explicit acknowledgement against r05.</li><li>Return to history to see the unchanged predecessor and the retained evidence.</li></ol>`
      + `<div class="callout neutral" style="margin-top:16px">Generated, reviewed, issued, sent, delivered, opened and acknowledged are separate facts. This file sends nothing, and client-side profile controls demonstrate scope rather than enforce security.</div>`
      + `<div class="test-controls"><h3>Review demonstration states</h3><div class="guide-grid">${button('Show loading state', 'demo-state', 'data-state="loading"')}${button('Show empty scope', 'demo-state', 'data-state="empty"')}${button('Fail output source read', 'demo-state', 'data-state="failed"')}${button('Fail recipient directory read', 'demo-directory')}${button('Fail next save once', 'fail-save')}${button('Reset demo', 'reset')}</div><p class="small muted" style="margin-top:12px">Finalisation interruption is ${state.interruptArmed ? '<strong>armed</strong> and will interrupt the next output preparation once' : 'already used in this saved work'}. Reset re-arms it and removes only this module's browser-local records and view preferences. Export your review copy first if it should be retained.</p></div>`);
  }

  document.addEventListener('submit', e => { if (e.target.id !== 'output-form') return; e.preventDefault(); try { form?.(Object.fromEntries(new FormData(e.target))); } catch (err) { $('form-error').textContent = err.message; } });
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.view) { go(b.dataset.view); return; }
    const a = b.dataset.action;
    try {
      if (a === 'close-dialog') closeDialog(); else if (a === 'close-snapshot') closeSnapshot();
      else if (a === 'snapshot') openSnapshot(b.dataset.id);
      else if (a === 'filters') { advanced = !advanced; persistView(); render(); main.querySelector('[data-action="filters"]').focus(); }
      else if (a === 'clear-filters') { filters = {queue:'all'}; persistView(); closeSnapshot(); render(); $('search')?.focus(); }
      else if (a === 'back-queue') go('queue');
      else if (a === 'to-distribution') go('distribution');
      else if (a === 'to-exceptions') go('exceptions');
      else if (a === 'to-readiness') { if (b.dataset.output) { selected = b.dataset.output; selectedIssue = null; } go('readiness'); }
      else if (a === 'open-pack') { selected = 'pack'; selectedIssue = null; go('detail'); }
      else if (a === 'open-distribution') { selected = b.dataset.output; selectedIssue = b.dataset.issue || null; go('distribution'); }
      else if (a === 'open-manifest') { selected = b.dataset.output; selectedIssue = b.dataset.issue || null; previewItem = null; go('detail'); }
      else if (a === 'expand') { expanded[b.dataset.key] = !expanded[b.dataset.key]; render(); main.querySelector(`[data-key="${b.dataset.key}"]`)?.focus(); }
      else if (a === 'preview-item') { previewItem = b.dataset.item; render(); main.querySelector(`[data-item="${b.dataset.item}"]`)?.focus(); }
      else if (a === 'domain-preview') openDialog('Domain release preview', domainPanel(output()) + `<p class="small muted">Opening this preview changes nothing. The owning domain screen retains the actual decision, its permissions and its concurrency checks.</p>`);
      else if (['successor','review','prepare','recover','release','withdraw'].includes(a)) openForm(a);
      else if (a === 'distribute') openForm('distribute', {recipient:b.dataset.recipient});
      else if (a === 'simulate') openForm('simulate', {attempt:b.dataset.attempt});
      else if (a === 'reconcile') openForm('reconcile', {attempt:b.dataset.attempt});
      else if (a === 'response') openForm('response', {recipient:b.dataset.recipient});
      else if (a === 'followup') { if (b.dataset.output) { selected = b.dataset.output; selectedIssue = null; ensureSelection(); } openForm('followup', {target:b.dataset.target}); }
      else if (a === 'reconcile-exception') { selected = b.dataset.output; selectedIssue = b.dataset.issue || null; ensureSelection(); openForm('reconcile', {attempt:b.dataset.target.replace('unknown:', ''), issue:b.dataset.issue}); }
      else if (a === 'recover-exception') { selected = b.dataset.output; selectedIssue = null; ensureSelection(); go('readiness'); openForm('recover'); }
      else if (a === 'zoom') { const box = main.querySelector('.viewer-scroll'); box.classList.toggle('text-zoom'); b.setAttribute('aria-pressed', String(box.classList.contains('text-zoom'))); b.textContent = box.classList.contains('text-zoom') ? 'Text size −' : 'Text size +'; }
      else if (a === 'download-item') {
        const o = output(), i = issue(), entry = M.manifestOf(state, o, i).find(x => x.id === b.dataset.item);
        if (!entry || entry.availability !== 'Available') throw Error('The exact item is not available.');
        const source = i.items.find(x => x.id === entry.id);
        download(M.itemContent(o, i.revision, source, {purpose:i.purpose, ref:i.reservedRef || i.ref, preparedAt:i.preparedAt}), entry.filename, 'text/html;charset=utf-8');
        notify(`Exact item downloaded · ${entry.bytes.toLocaleString('en-AU')} bytes · SHA-256 ${entry.hash.slice(0, 12)}…`);
      }
      else if (a === 'download-manifest') {
        const o = output(), i = issue();
        download(JSON.stringify({synthetic:true, output:o.ref, issue:i.ref, reservedIssueIdentity:i.reservedRef || i.ref, revision:i.revision, purpose:i.purpose, preparedAt:i.preparedAt, issuedAt:i.issuedAt, template:o.template, basis:i.basis, manifest:M.manifestOf(state, o, i).map(x => ({id:x.id, title:x.title, purpose:x.purpose, availability:x.availability, format:'HTML', bytes:x.bytes, sha256:x.hash})), note:'Structured manifest of the exact synthetic content. No controlled PDF rendition is included in this preview.'}, null, 2), `${i.ref}-manifest.json`);
        notify('Structured manifest exported. No issue or distribution event was created.');
      }
      else if (a === 'demo-state') { closeDialog(true); readMode = b.dataset.state; go('queue'); }
      else if (a === 'restore-read') { readMode = 'ready'; render(); }
      else if (a === 'demo-directory') { closeDialog(true); directoryFailed = true; go('distribution'); }
      else if (a === 'restore-directory') { directoryFailed = false; render(); notify('Simulated recipient read restored.'); }
      else if (a === 'fail-save') { failNext = true; closeDialog(true); notify('The next save will fail once; entries will be retained.'); }
      else if (a === 'reload') { let raw; try { raw = localStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : M.initial(); if (!M.validState(parsed)) throw Error('Invalid stored data.'); state = parsed; savedRaw = raw; blocked = false; $('save-notice').hidden = true; closeDialog(true); render(); notify('Saved work loaded. Reopen the selected issue before continuing.'); } catch { showBlocked(); } }
      else if (a === 'raw-export') { let raw; try { raw = localStorage.getItem(KEY) || ''; } catch { raw = savedRaw || ''; } download(raw, 'PPO-Output-Distribution-original-saved-data.txt', 'text/plain'); }
      else if (a === 'reset') {
        if (!window.confirm('Reset this module’s local demo? Export first to retain your local records.')) return;
        localStorage.removeItem(KEY); localStorage.removeItem(VIEW_KEY);
        state = M.initial(); savedRaw = null; blocked = false; filters = {queue:'attention'}; advanced = false; readMode = 'ready'; directoryFailed = false; failNext = false; expanded = {}; historyFilter = '';
        selected = 'pack'; selectedIssue = null; previewItem = null;
        $('save-notice').hidden = true; closeDialog(true); go('queue');
        $('saved-status').textContent = 'Demo reset · no local records';
      }
    } catch (err) { if (dialog.open && $('form-error')) $('form-error').textContent = err.message; else notify(err.message); }
  });
  $('guide').addEventListener('click', guide);
  $('export').addEventListener('click', () => download(JSON.stringify(M.exportState(state, actor), null, 2), 'PPO-Output-Distribution-review-copy.json'));
  $('open-full').addEventListener('click', () => { queueScroll = window.scrollY; go('detail'); });
  document.addEventListener('input', e => {
    if (e.target.id !== 'search') return;
    const position = e.target.selectionStart;
    filters.search = e.target.value; reconcileSelection(); persistView();
    if (snapshot.open) closeSnapshot();
    main.innerHTML = queue(); $('search').focus(); $('search').setSelectionRange(position, position);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'role') { actor = t.value; closeDialog(true); closeSnapshot(); filters = {}; expanded = {}; ensureSelection(); persistView(); render(); notify('Preview scope updated. Actual access must be enforced by the application server.'); }
    else if (t.dataset.filter) { filters[t.dataset.filter] = t.value; reconcileSelection(); persistView(); closeSnapshot(); render(); $('filter-' + t.dataset.filter)?.focus(); }
    else if (t.id === 'quick-view') { filters.queue = t.value; reconcileSelection(); persistView(); closeSnapshot(); render(); $('quick-view').focus(); }
    else if (t.id === 'output-select') { selected = t.value; selectedIssue = null; previewItem = null; render(); $('output-select').focus(); }
    else if (t.id === 'issue-select') { selectedIssue = t.value; previewItem = null; render(); $('issue-select').focus(); }
    else if (t.id === 'history-filter') { historyFilter = t.value; render(); $('history-filter').focus(); }
  });
  document.querySelector('.tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const index = views.findIndex(x => x[0] === view), next = e.key === 'Home' ? 0 : e.key === 'End' ? views.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length;
    go(views[next][0], false); $('tab-' + view).focus();
  });
  window.addEventListener('storage', e => { if (e.key === KEY && e.newValue !== savedRaw) { $('save-notice').dataset.message = 'Another tab changed the saved work. Reload saved work before continuing.'; showBlocked($('save-notice').dataset.message); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && snapshot.open && !dialog.open) closeSnapshot(); });
  window.addEventListener('resize', () => { if (snapshot.open) closeSnapshot(); });
  ensureSelection(); render(); if (blocked) showBlocked();
})();
