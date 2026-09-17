/* DK-06 six-view workspace controller: register, structured editing, preview and validation,
   review and publication, usage impact, and history and recovery. Browser-local synthetic state. */
(() => {
  'use strict';
  const M = globalThis.PPOTemplateManagement;
  const S = globalThis.PPOTemplateSchema;
  const P = globalThis.PPOTemplatePreview;
  const V = globalThis.PPOTemplateValidation;

  const KEY = 'ppo.template-management.r01';
  const VIEW_KEY = 'ppo.template-management.r01.view';
  const VIEWS = [['register', 'Template register'], ['definition', 'Template & rules'], ['preview', 'Preview & validation'],
    ['review', 'Review & publication'], ['impact', 'Usage & change impact'], ['history', 'History & recovery']];

  let state = M.initial(), savedRaw = null, storageIssue = '', actor = 'author', timer;
  let view = 'register', familyId = 'FAM-REPORT', definitionId = 'DEF-REPORT-R02', sampleId = 'S-COMPLETE';
  let previewMode = 'document', search = '', filter = 'current', focusFieldId = null, showTechnical = false;
  let probe = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-10', purpose: 'customer-report', audience: 'customer', locale: 'en-AU' };

  try {
    savedRaw = localStorage.getItem(KEY);
    if (savedRaw) { const value = JSON.parse(savedRaw); if (!M.validState(value)) throw new Error('Invalid schema'); state = value; }
  } catch { storageIssue = 'Saved data could not be read and has not been overwritten. Export it before resetting this workspace.'; }
  try { const saved = localStorage.getItem(VIEW_KEY); if (saved && VIEWS.some(v => v[0] === saved)) view = saved; } catch { /* preference only */ }

  const esc = P.esc;
  const $ = id => document.getElementById(id);
  const DATE = new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' });
  const TIME = new Intl.DateTimeFormat('en-AU', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Australia/Sydney' });
  const day = value => value ? DATE.format(new Date(value)) : '—';
  const instant = value => value ? `${TIME.format(new Date(value))} (${M.TZ})` : '—';
  const tag = (text, tone = '') => `<span class="pill ${tone}">${esc(text)}</span>`;
  const button = (label, action, extra = '') => `<button data-action="${action}" ${extra}>${esc(label)}</button>`;
  const can = capability => (M.ROLES[actor].can || []).includes(capability);
  const permittedFamilies = () => (M.ROLES[actor].families ? M.FAMILIES.filter(f => M.ROLES[actor].families.includes(f.id)) : M.FAMILIES);
  const permitted = id => permittedFamilies().some(f => f.id === id);

  const STATE_TONE = { draft: '', submitted: 'info', returned: 'warning', approved: 'success', published: 'success', retired: 'danger' };
  const OUTCOME_TONE = { passed: 'success', failed: 'danger', blocked: 'warning', 'not run': '', 'not applicable': '' };

  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(timer); timer = setTimeout(() => { $('toast').hidden = true; }, 5000); }

  function status() {
    const notice = $('save-notice');
    if (storageIssue) { notice.hidden = false; notice.innerHTML = `${esc(storageIssue)} ${button('Reload saved work', 'reload')}${button('Export review copy', 'export-raw')}`; }
    else { notice.hidden = true; notice.innerHTML = ''; }
    $('saved-status').textContent = savedRaw ? 'Saved in this browser' : 'Browser-local review workspace · nothing saved yet';
    $('clock-label').textContent = `Demonstration time · ${instant(state.clock)}`;
  }

  function commit(action, payload) {
    const outcome = M.command(state, actor, state.version, action, payload, state.clock);
    const raw = JSON.stringify(outcome.state);
    let existing;
    try { existing = localStorage.getItem(KEY); } catch { throw new Error('Browser storage is unavailable. Your entries remain here; export or retry.'); }
    if (existing !== savedRaw) { storageIssue = 'Saved work changed in another tab. Reload saved work before continuing; unsaved form entries are retained.'; status(); throw new Error('This workspace changed in another tab. Reload saved work before saving again.'); }
    if (state.failNextSave) { state = { ...state, failNextSave: false }; throw new Error('Local save failed. Nothing was written and your entries remain here. Retry, or export a permitted draft copy.'); }
    try { localStorage.setItem(KEY, raw); } catch { throw new Error('Browser save failed. Your entries remain here. Free storage and retry, or export saved work.'); }
    state = outcome.state; savedRaw = raw; status();
    return outcome.result;
  }

  const definition = () => M.findDefinition(state, definitionId);
  const currentFamily = () => M.family(familyId);
  const samples = () => M.samplesFor(familyId);
  const sample = () => samples().find(s => s.id === sampleId) || samples()[0] || null;
  const structural = () => S.validateDefinition(definition());
  const run = () => M.latestRun(state, definitionId);
  const currency = () => V.currency(run(), definition(), samples());
  const answersFor = (definitionRecord, sampleRecord) => state.answers[`${definitionRecord.id}::${sampleRecord ? sampleRecord.id : ''}`] || (sampleRecord && sampleRecord.answers) || {};

  function selectDefinition(id) {
    const record = M.findDefinition(state, id);
    if (!record) return;
    definitionId = id; familyId = record.familyId;
    const list = M.samplesFor(familyId);
    if (!list.some(s => s.id === sampleId)) sampleId = list.length ? list[0].id : '';
    previewMode = currentFamily().kind === 'form' ? 'form' : 'document';
  }

  /* ---- shared fragments ------------------------------------------------------------------- */

  function head(title, subtitle, actions = '') {
    return `<div class="page-head"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="actions">${actions}</div></div>`;
  }

  function eligibility(record) {
    const active = M.publicationsFor(state, record.id).filter(p => p.state !== 'withdrawn');
    if (!active.length) return { label: record.state === 'draft' ? 'Draft' : record.state === 'submitted' ? 'Awaiting review' : record.state === 'returned' ? 'Returned' : record.state === 'approved' ? 'Approved, not published' : 'Not assigned', tone: record.state === 'returned' ? 'warning' : '' };
    const states = active.map(p => M.eligibilityState(state, p, state.clock));
    if (states.includes('Eligible now')) return { label: 'Eligible now', tone: 'success' };
    if (states.includes('Outcome unknown')) return { label: 'Outcome unknown', tone: 'danger' };
    if (states.includes('Future effective')) {
      const next = active.find(p => M.eligibilityState(state, p, state.clock) === 'Future effective');
      return { label: `Published — effective from ${day(next.from)}`, tone: 'info' };
    }
    return { label: 'Superseded for this scope', tone: '' };
  }

  function nextAction(record) {
    const family = M.family(record.familyId);
    if (!state.policies[record.familyId]) return 'Policy not configured — select a configured policy';
    if (record.state === 'draft') return 'Edit, validate and submit for review';
    if (record.state === 'submitted') return 'Reviewer decision outstanding';
    if (record.state === 'returned') return 'Correct and resubmit against the findings';
    if (record.state === 'approved') return 'Publish with an explicit use assignment';
    const check = S.validateDefinition(record).errors.find(e => ['profile-unsupported', 'schema-unknown', 'profile-unknown'].includes(e.code));
    if (check) return 'Unsupported — receiving work required';
    return family.editable ? 'In use — create a successor to propose a change' : 'In use — inspection only in this build';
  }

  function definitionRows() {
    const rows = [];
    for (const family of permittedFamilies())
      for (const record of M.definitionsFor(state, family.id)) rows.push({ family, record });
    const term = search.trim().toLowerCase();
    return rows.filter(({ family, record }) => {
      if (term && ![family.title, record.reference, record.revision, family.outputFamily, family.domain, record.purpose, family.owner].join(' ').toLowerCase().includes(term)) return false;
      const state1 = eligibility(record).label;
      switch (filter) {
        case 'current': return ['published', 'approved', 'draft', 'submitted', 'returned'].includes(record.state) && !(record.state === 'published' && state1 === 'Superseded for this scope');
        case 'eligible': return state1 === 'Eligible now';
        case 'drafts': return record.state === 'draft';
        case 'awaiting': return record.state === 'submitted';
        case 'approved': return record.state === 'approved';
        case 'future': return state1.startsWith('Published — effective from');
        case 'attention': return record.state === 'returned' || state1 === 'Outcome unknown' || S.validateDefinition(record).errors.length > 0 || !state.policies[record.familyId];
        case 'historical': return record.state === 'retired' || state1 === 'Superseded for this scope';
        default: return true;
      }
    });
  }

  /* ---- view 1 · register -------------------------------------------------------------------- */

  function register() {
    const rows = definitionRows();
    const all = permittedFamilies().flatMap(f => M.definitionsFor(state, f.id));
    const counts = {
      families: permittedFamilies().length,
      eligible: all.filter(r => eligibility(r).label === 'Eligible now').length,
      awaiting: all.filter(r => r.state === 'submitted').length,
      attention: all.filter(r => r.state === 'returned' || eligibility(r).label === 'Outcome unknown' || S.validateDefinition(r).errors.length > 0 || !state.policies[r.familyId]).length
    };
    const body = rows.map(({ family, record }) => {
      const use = eligibility(record);
      const errors = S.validateDefinition(record).errors.length;
      return `<tr>
<td class="case-cell"><button class="text-button" data-action="snapshot" data-id="${esc(record.id)}">${esc(family.title)}</button><div class="case-sub">${esc(record.reference)} · ${esc(record.purpose || family.title)}</div></td>
<td data-label="Domain and output">${esc(family.domain)}<div class="case-sub">${esc(family.outputFamily)} · ${esc(family.kind === 'form' ? 'Form definition' : 'Document output')}</div></td>
<td data-label="Definition">${esc(record.revision)} ${tag(record.state, STATE_TONE[record.state])}<div class="case-sub">${esc(S.short(record.fingerprint))}${record.runtimeVersion ? ` · runtime v${record.runtimeVersion}` : ' · no supported runtime version'}</div></td>
<td data-label="Purpose and audience">${esc((record.applicability.purposes || []).join(', '))}<div class="case-sub">${esc(S.AUDIENCES[record.audience])} · ${esc(record.locale)}</div></td>
<td data-label="Applicability">${esc(record.company)}<div class="case-sub">${esc(record.applicability.sites)}</div></td>
<td data-label="Review and publication">${esc(record.state)}<div class="case-sub">${M.publicationsFor(state, record.id).length} assignment${M.publicationsFor(state, record.id).length === 1 ? '' : 's'}${errors ? ` · ${errors} definition error${errors === 1 ? '' : 's'}` : ''}</div></td>
<td data-label="Eligible use">${tag(use.label, use.tone)}</td>
<td data-label="Owner">${esc(family.owner)}</td>
<td data-label="Next action"><div class="small">${esc(nextAction(record))}</div></td></tr>`;
    }).join('');
    return `${head('Template register', 'Which template and which exact version should I inspect or use? Counts describe the permitted population for this preview profile, not every record in the prototype.',
      button('Open selected template', 'open-current'))}
<div class="metrics">
<div class="metric"><span class="value number">${counts.families}</span><span class="label">Permitted families</span><span class="hint">${actor === 'finance' ? 'Restricted Finance scope only' : 'All eight synthetic families'}</span></div>
<div class="metric"><span class="value number">${counts.eligible}</span><span class="label">Eligible now</span><span class="hint">At ${esc(instant(state.clock))}</span></div>
<div class="metric"><span class="value number">${counts.awaiting}</span><span class="label">Awaiting review</span><span class="hint">Submitted, undecided</span></div>
<div class="metric"><span class="value number">${counts.attention}</span><span class="label">Needs attention</span><span class="hint">Returned, unsupported, unconfigured or unreconciled</span></div>
</div>
<div class="card space">
<div class="filters">
<div class="search"><label for="search">Find a template</label><input id="search" type="search" value="${esc(search)}" placeholder="Title, reference, output family, domain or owner"></div>
<div><label for="filter">Show</label><select id="filter">
${[['current', 'Current and proposed'], ['all', 'All permitted'], ['eligible', 'Eligible now'], ['drafts', 'Drafts'], ['awaiting', 'Awaiting review'], ['approved', 'Approved awaiting publication'], ['future', 'Future effective'], ['attention', 'Needs attention'], ['historical', 'Historical']]
    .map(([value, label]) => `<option value="${value}"${filter === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div>
<div>${button('Clear filters', 'clear-filters')}</div>
</div>
${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Template family and title</th><th>Domain and output</th><th>Definition</th><th>Purpose and audience</th><th>Applicability</th><th>Review and publication</th><th>Eligible use</th><th>Owner</th><th>Next action</th></tr></thead><tbody>${body}</tbody></table></div>`
      : `<div class="empty"><h3>No templates match this view</h3><p>This is a filtered view of the permitted population. It is not evidence that the register is empty.</p>${button('Clear filters', 'clear-filters')}</div>`}
<div class="card-foot">${rows.length} of ${all.length} permitted definitions shown. A failed or partial load would be reported here rather than presented as zero templates.</div>
</div>`;
  }

  function snapshotBody(record) {
    const family = M.family(record.familyId);
    const errors = S.validateDefinition(record).errors;
    const assignments = M.publicationsFor(state, record.id);
    const consumers = M.CONSUMERS.filter(c => c.definitionId === record.id);
    const use = eligibility(record);
    return `<div class="label-row">${tag(record.revision)} ${tag(record.state, STATE_TONE[record.state])} ${tag(use.label, use.tone)}</div>
<dl class="meta">
<dt>Source authority</dt><dd>${esc(family.owner)} · ${esc(record.schemaId)}@${esc(record.schemaVersion)}</dd>
<dt>Rendering profile</dt><dd>${esc(S.PROFILES[record.profile] ? S.PROFILES[record.profile].label : record.profile)}</dd>
<dt>Exact definition</dt><dd class="mono">${esc(record.fingerprint)}</dd>
<dt>Dependency set</dt><dd class="mono">${esc(S.dependencyFingerprint(record))}</dd>
<dt>Runtime version</dt><dd>${record.runtimeVersion ? `Supported runtime version ${record.runtimeVersion}` : 'Not a supported runtime version in the current application code'}</dd>
<dt>Effective interval</dt><dd>${assignments.length ? assignments.map(a => `${esc(day(a.from))} → ${a.to ? esc(day(a.to)) : 'open'} (${esc(a.state)})`).join('<br>') : 'No use assignment'}</dd>
<dt>Latest change</dt><dd>${esc(day(record.created))} · ${esc(record.rationale || 'No rationale recorded')}</dd>
<dt>Known consumers</dt><dd>${consumers.length ? consumers.map(c => esc(c.label)).join('<br>') : 'None recorded against this exact definition'}</dd>
<dt>Blocking findings</dt><dd>${errors.length ? errors.map(e => `${esc(e.location)}: ${esc(e.message)}`).join('<br>') : 'None'}</dd>
</dl>`;
  }

  /* ---- view 2 · template and rules ----------------------------------------------------------- */

  function conditionSummary(condition) { return condition ? esc(S.describe(condition)) : '<span class="muted">Always shown</span>'; }

  function fieldRow(record, f, editable) {
    const schemaKey = `${record.schemaId}@${record.schemaVersion}`;
    const source = f.binding ? S.schemaPath(schemaKey, f.binding) : null;
    const problems = S.validateDefinition(record).errors.filter(e => e.location === (f.label || f.id));
    return `<tr${focusFieldId === f.id ? ' class="selected"' : ''} id="field-${esc(f.id)}">
<td class="case-cell"><strong>${esc(f.label)}</strong><div class="case-sub">${esc(f.id)} · ${esc(S.FIELD_TYPES[f.type] ? S.FIELD_TYPES[f.type].label : f.type)}${f.unit ? ` · ${esc(f.unit)}` : ''}</div>${f.help ? `<div class="case-sub">${esc(f.help)}</div>` : ''}</td>
<td data-label="Source binding">${f.binding ? `<span class="mono small">${esc(f.binding)}</span>${source ? `<div class="case-sub">${esc(source.type)}${source.unit ? ` · ${esc(source.unit)}` : ''} · ${esc(source.cardinality)} · ${esc(S.AUDIENCES[source.confidentiality])}${source.retired ? ' · retired' : ''}</div>` : '<div class="case-sub">Unknown source path</div>'}`
      : f.type === 'protected' ? '<span class="muted">Protected reference</span>' : tag('Mapping needed', 'warning')}</td>
<td data-label="Requiredness">${esc({ source: 'Source mandatory', input: 'Entry required', optional: 'Optional' }[f.required] || f.required)}</td>
<td data-label="Shown when">${conditionSummary(f.visibility)}</td>
<td data-label="Checks">${problems.length ? problems.map(p => `<div class="blocked-label">${esc(p.message)}</div>`).join('') : '<span class="small muted">No error</span>'}</td>
<td data-label="Actions"><div class="row-actions">${editable && f.type !== 'protected' ? `${button('Edit', 'edit-field', `data-id="${esc(f.id)}"`)}${button('Remove', 'remove-field', `data-id="${esc(f.id)}"`)}` : f.type === 'protected' ? button('Why read-only', 'protected-why', `data-id="${esc(f.protectedRef || '')}"`) : '<span class="small muted">Read-only</span>'}</div></td></tr>`;
  }

  function definitionView() {
    const record = definition();
    if (!record) return `<div class="empty"><h3>Select a template</h3><p>Open a definition from the register.</p>${button('Back to register', 'go-register')}</div>`;
    const family = currentFamily();
    const check = structural();
    const editable = record.state === 'draft' && !record.seeded && can('edit');
    const actions = [
      family.editable && can('successor') && ['published', 'approved'].includes(record.state) ? button('Create successor', 'create-successor') : '',
      record.state === 'returned' && can('successor') ? button('Reopen for correction', 'correct') : '',
      editable ? button('Add section', 'add-section') : '',
      button('Preview and validate', 'go-preview')
    ].filter(Boolean).join('');
    const sections = [...record.sections].sort((a, b) => a.sequence - b.sequence).map((s, index, list) => {
      const fields = record.fields.filter(f => f.sectionId === s.id).sort((a, b) => a.sequence - b.sequence);
      return `<div class="card space">
<div class="card-head"><div><h3>${esc(s.label)}</h3><div class="case-sub">${esc(s.purpose || 'No purpose recorded')}${s.repeat ? ` · repeats over <span class="mono">${esc(s.repeat)}</span>` : ''}</div><div class="case-sub">Shown when: ${conditionSummary(s.condition)}</div></div>
<div class="row-actions">${editable ? `${button('Move up', 'move-section', `data-id="${esc(s.id)}" data-direction="up"${index === 0 ? ' disabled' : ''}`)}${button('Move down', 'move-section', `data-id="${esc(s.id)}" data-direction="down"${index === list.length - 1 ? ' disabled' : ''}`)}${button('Edit section', 'edit-section', `data-id="${esc(s.id)}"`)}${button('Add field', 'add-field', `data-id="${esc(s.id)}"`)}` : ''}</div></div>
${fields.length ? `<div class="table-wrap"><table><thead><tr><th>Field</th><th>Source binding</th><th>Requiredness</th><th>Shown when</th><th>Checks</th><th>Actions</th></tr></thead><tbody>${fields.map(f => fieldRow(record, f, editable)).join('')}</tbody></table></div>`
        : `<div class="pad small muted">No fields in this section yet.</div>`}</div>`;
    }).join('');
    const bindings = record.fields.filter(f => f.binding).map(f => {
      const source = S.schemaPath(`${record.schemaId}@${record.schemaVersion}`, f.binding);
      return `<tr><td class="case-cell"><strong>${esc(f.label)}</strong><div class="case-sub mono">${esc(f.binding)}</div></td>
<td data-label="Owning domain">${esc(family.domain)}</td>
<td data-label="Type and unit">${source ? `${esc(source.type)}${source.unit ? ` · ${esc(source.unit)}` : ''}` : tag('Unknown path', 'danger')}</td>
<td data-label="Cardinality">${source ? esc(source.cardinality) : '—'}</td>
<td data-label="Confidentiality">${source ? esc(S.AUDIENCES[source.confidentiality]) : '—'}</td>
<td data-label="Source requiredness">${source ? (source.required ? 'Mandatory in the source contract' : 'Optional in the source contract') : '—'}</td></tr>`;
    }).join('');
    return `${head(`${esc(family.title)} · ${esc(record.revision)}`,
      `${esc(record.purpose)} — ${esc(record.state === 'draft' ? 'editable draft' : `${record.state}; read-only`)}.`, actions)}
${record.state !== 'draft' ? `<div class="callout neutral space"><strong>${esc(record.state.charAt(0).toUpperCase() + record.state.slice(1))} definitions are read-only.</strong>${family.editable ? ' Create a successor to propose a change. The earlier definition, its dependencies and its evidence are unchanged.' : ' This family has register, detail and impact fixtures in r01; structured editing is demonstrated on the customer service report and the site survey capture form.'}</div>` : ''}
${record.seeded && record.state === 'draft' ? '<div class="callout warning space"><strong>Seeded fixture.</strong> This draft is part of the fixture catalogue and is read-only. Create a successor to edit.</div>' : ''}
<div class="two-col">
<div class="stack">
<div class="card"><div class="card-head"><h3>Identity and ownership</h3>${editable ? button('Edit identity', 'edit-identity') : ''}</div><div class="pad"><dl class="meta">
<dt>Family</dt><dd>${esc(family.title)} · <span class="mono">${esc(family.id)}</span></dd>
<dt>Readable reference</dt><dd>${esc(record.reference)}</dd>
<dt>Revision label</dt><dd>${esc(record.revision)} <span class="small muted">— a document revision label, separate from the runtime template version and from any output revision</span></dd>
<dt>Definition identity</dt><dd class="mono">${esc(record.id)}</dd>
<dt>Content fingerprint</dt><dd class="mono">${esc(record.fingerprint)}</dd>
<dt>Runtime version</dt><dd>${record.runtimeVersion ? `Supported runtime version ${record.runtimeVersion}` : 'No supported runtime version. A proposed revision here is not registered in the application code.'}</dd>
<dt>Owner</dt><dd>${esc(family.owner)}</dd>
<dt>Source schema</dt><dd>${esc(record.schemaId)}@${esc(record.schemaVersion)}</dd>
<dt>Rendering profile</dt><dd>${esc(S.PROFILES[record.profile] ? S.PROFILES[record.profile].label : record.profile)}</dd>
<dt>Audience</dt><dd>${esc(S.AUDIENCES[record.audience])}</dd>
<dt>Change rationale</dt><dd>${esc(record.rationale || 'No rationale recorded')}</dd>
</dl></div></div>

<div class="card"><div class="card-head"><h3>Applicability</h3></div><div class="pad"><dl class="meta">
<dt>Company or entity</dt><dd>${esc(record.company)} <span class="small muted">— a sister-entity context is not interchangeable with this one</span></dd>
<dt>Purpose</dt><dd>${esc((record.applicability.purposes || []).join(', '))}</dd>
<dt>Audience and classification</dt><dd>${esc(S.AUDIENCES[record.audience])}</dd>
<dt>Locale and format</dt><dd>${esc(record.locale)} · ${esc(S.PROFILES[record.profile] ? S.PROFILES[record.profile].label : record.profile)}</dd>
<dt>Site and equipment</dt><dd>${esc(record.applicability.sites)} · ${esc(record.applicability.equipment)}</dd>
</dl></div></div>

<h3>Sections and fields</h3>
${sections}

<div class="card space"><div class="card-head"><h3>Source bindings</h3></div>
${bindings ? `<div class="table-wrap"><table><thead><tr><th>Field</th><th>Owning domain</th><th>Type and unit</th><th>Cardinality</th><th>Confidentiality</th><th>Source requiredness</th></tr></thead><tbody>${bindings}</tbody></table></div>` : '<div class="pad small muted">No source bindings configured.</div>'}
<div class="card-foot">Source requiredness belongs to the business contract. Entry requiredness, display visibility and audience permission are separate. Hiding a field removes neither the source obligation nor a disclosure control.</div></div>

<div class="card space"><div class="card-head"><h3>Protected content</h3></div><div class="pad">
${(record.protectedBlocks || []).length ? (record.protectedBlocks || []).map(b => `<div class="source-note"><strong>${esc(b.label)} · ${esc(b.revision)}</strong><div class="case-sub">Owner: ${esc(b.owner)}</div><p class="small">${esc(b.text)}</p></div>`).join('')
        : '<p class="small muted">This definition references no protected block.</p>'}
<p class="small muted">Protected branding, terms and instructions cannot be changed through ordinary field editing. Prepare a separate proposed change to the authorised owner.</p></div></div>
</div>

<div class="stack">
<div class="card"><div class="card-head"><h3>Definition checks</h3></div><div class="pad">
${check.errors.length ? `<div class="error"><strong>${check.errors.length} error</strong><ul class="quiet-list">${check.errors.map(e => `<li><strong>${esc(e.location)}</strong> — ${esc(e.message)}</li>`).join('')}</ul></div>` : '<div class="callout success"><strong>No definition error.</strong> Structural checks do not prove technical, commercial or operational correctness.</div>'}
${check.warnings.length ? `<div class="callout warning"><strong>${check.warnings.length} note</strong><ul class="quiet-list">${check.warnings.map(w => `<li><strong>${esc(w.location)}</strong> — ${esc(w.message)}</li>`).join('')}</ul></div>` : ''}
</div></div>
<div class="card"><div class="card-head"><h3>Evidence currency</h3></div><div class="pad"><dl class="meta">
<dt>Latest run</dt><dd>${run() ? esc(run().id) : 'Not run'}</dd>
<dt>State</dt><dd>${tag(currency().state, currency().state === 'current' ? 'success' : 'warning')}</dd>
<dt>Reason</dt><dd>${esc(currency().reason)}</dd>
</dl><p class="small muted">Saved draft, validated and approved are three different things. A draft edit changes the fingerprint and makes earlier evidence out of date.</p></div></div>
<div class="card"><div class="card-head"><h3>Dependency set</h3></div><div class="pad">
<dl class="meta">${record.dependencies.map(d => `<dt>${esc(d.kind)}</dt><dd class="mono small">${esc(d.path)}<br>${d.sha256 ? esc(S.short(d.sha256)) : 'no pinned digest'}${d.bytes ? ` · ${d.bytes} bytes` : ''}</dd>`).join('')}</dl>
${editable && record.dependencies.some(d => d.path === M.SUCCESSOR_LOGO.path && d.sha256 !== M.SUCCESSOR_LOGO.sha256) ? button('Reference the successor branding asset', 'change-dependency') : ''}
<p class="small muted">A shared renderer or branding change may affect more than one output family. The original source bytes are never modified here.</p></div></div>
</div></div>`;
  }

  /* ---- view 3 · preview and validation --------------------------------------------------------- */

  function documentPreview(record, chosen) {
    const answers = answersFor(record, chosen);
    const render = P.renderDocument(record, chosen, { answers });
    const grouped = { blocker: [], gap: [], condition: [], missing: [], exclusion: [] };
    for (const d of render.diagnostics) (grouped[d.kind] || (grouped[d.kind] = [])).push(d);
    const findingList = [...grouped.blocker, ...grouped.gap, ...grouped.missing, ...grouped.condition, ...grouped.exclusion];
    return `<div class="preview-grid">
<div class="card"><div class="card-head"><h3>Document preview</h3><span class="small muted">${render.outputBytes} bytes · ${esc(S.short(render.outputSha256))}</span></div>
<div class="doc-frame">${render.html}</div>
<div class="card-foot">Real local HTML produced from this exact definition and the audience-filtered sample. ${S.PROFILES[record.profile] && S.PROFILES[record.profile].pdf ? 'A controlled PDF is not produced by this build.' : 'PDF preview is unavailable in this build; browser print is an informal preview only, not a controlled PDF or a PDF/UA proof.'}</div></div>
<div class="card"><div class="card-head"><h3>Findings</h3><span class="small muted">${findingList.length}</span></div><div class="pad stack">
${findingList.length ? findingList.map(d => `<div class="finding finding-${esc(d.kind)}"><div class="label-row">${tag(d.kind === 'blocker' ? 'Blocker' : d.kind === 'gap' ? 'Gap' : d.kind === 'exclusion' ? 'Excluded before render' : d.kind === 'missing' ? 'Missing source' : `Condition ${d.result || ''}`.trim(), d.kind === 'blocker' ? 'danger' : d.kind === 'exclusion' ? 'info' : 'warning')}<strong>${esc(d.location)}</strong></div><p class="small">${esc(d.message)}</p>${d.fieldId ? button('Go to field', 'go-field', `data-id="${esc(d.fieldId)}"`) : ''}</div>`).join('')
        : '<p class="small muted">No diagnostic for this sample. Data missing from a sample, a broken binding and an unsupported schema are reported separately when they occur.</p>'}
</div></div></div>`;
  }

  function formPreview(record, chosen) {
    const answers = answersFor(record, chosen);
    const groups = P.formFields(record, chosen, answers);
    const findings = P.validateAnswers(record, chosen, answers);
    const control = entry => {
      const f = entry.field;
      const value = entry.answer === undefined || entry.answer === null ? '' : entry.answer;
      if (f.type === 'bound') return `<p class="bound-value">${esc(P.displayValue(f, entry.bound).text)}</p>`;
      if (f.type === 'protected') return `<p class="small muted">Protected block · read-only</p>`;
      if (f.type === 'choice') return `<select name="${esc(f.id)}"><option value="">Unanswered</option>${(f.options || []).map(o => `<option value="${esc(o.id)}"${value === o.id ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      if (f.type === 'boolean3') return `<select name="${esc(f.id)}"><option value="">Unanswered</option>${[['yes', 'Yes'], ['no', 'No'], ['unknown', 'Unknown']].map(([v, l]) => `<option value="${v}"${String(value) === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
      if (f.type === 'textarea') return `<textarea name="${esc(f.id)}">${esc(value)}</textarea>`;
      if (f.type === 'number') return `<input name="${esc(f.id)}" inputmode="decimal" value="${esc(value)}">`;
      if (f.type === 'date') return `<input name="${esc(f.id)}" type="date" value="${esc(value)}">`;
      return `<input name="${esc(f.id)}" value="${esc(value)}">`;
    };
    return `<div class="preview-grid">
<div class="card"><div class="card-head"><h3>Form preview</h3><span class="small muted">Sample fixture only</span></div>
<form id="form-preview" class="pad" data-action="save-answers">
${groups.map(group => group.gate === S.FALSE ? `<section class="form-section"><h3>${esc(group.section.label)}</h3><p class="small muted">Not applicable for this record. ${esc(group.gateReason)}</p></section>`
      : `<section class="form-section"><h3>${esc(group.section.label)}</h3>${group.gate === S.UNKNOWN ? `<div class="callout warning"><strong>Applicability unknown.</strong> ${esc(group.gateReason)}</div>` : ''}
${group.fields.map(entry => entry.visible === S.FALSE ? '' : `<div class="field">
<label for="fld-${esc(entry.field.id)}">${esc(entry.field.label)}${entry.field.unit ? ` (${esc(entry.field.unit)})` : ''}${entry.field.required === 'input' ? ' <span class="req">required</span>' : ''}</label>
${entry.visible === S.UNKNOWN ? `<div class="callout warning small"><strong>Shown state unknown.</strong> ${esc(entry.visibleReason)} The question is not hidden on unknown input.</div>` : ''}
${control(entry).replace('<select ', `<select id="fld-${esc(entry.field.id)}" `).replace('<input ', `<input id="fld-${esc(entry.field.id)}" `).replace('<textarea ', `<textarea id="fld-${esc(entry.field.id)}" `)}
${entry.field.help ? `<small>${esc(entry.field.help)}</small>` : ''}
</div>`).join('')}</section>`).join('')}
<div class="dialog-actions">${can('answers') ? '<button class="primary" type="submit">Save sample answers</button>' : '<span class="small muted">This preview profile cannot record sample answers.</span>'}</div>
<p id="form-error" class="error" hidden></p>
</form>
<div class="card-foot">Completing this preview writes only to its sample fixture. No site survey, service report, inspection or other operational record is created.</div></div>
<div class="card"><div class="card-head"><h3>Input findings</h3><span class="small muted">${findings.length}</span></div><div class="pad stack">
${findings.length ? findings.map(f => `<div class="finding"><div class="label-row">${tag(f.severity === 'blocked' ? 'Blocked' : 'Failed', f.severity === 'blocked' ? 'warning' : 'danger')}<strong>${esc(f.location)}</strong></div><p class="small">${esc(f.message)}</p>${f.fieldId ? button('Go to field', 'go-field', `data-id="${esc(f.fieldId)}"`) : ''}</div>`).join('')
        : '<p class="small muted">Every shown required question has an explicit answer in this sample. Unanswered, Unknown, No and zero remain four different states.</p>'}
</div></div></div>`;
  }

  function previewView() {
    const record = definition();
    if (!record) return `<div class="empty"><h3>Select a template</h3>${button('Back to register', 'go-register')}</div>`;
    const chosen = sample();
    const check = structural();
    const blocked = check.errors.find(e => ['schema-unknown', 'profile-unsupported', 'profile-unknown'].includes(e.code));
    const latest = run(), cur = currency();
    const supportsForm = record.fields.some(f => S.FIELD_TYPES[f.type] && S.FIELD_TYPES[f.type].input);
    const results = latest ? latest.results.map(r => `<tr><td class="case-cell"><strong>${esc(r.label)}</strong><div class="case-sub">${esc(r.id)}${r.sample ? ` · ${esc(r.sample)}` : ''}</div></td>
<td data-label="Result">${tag(r.outcome, OUTCOME_TONE[r.outcome] || '')}</td>
<td data-label="Observation"><div class="small">${esc(r.detail)}</div></td>
<td data-label="Output">${r.outputSha256 ? `<span class="mono small">${esc(S.short(r.outputSha256))}</span><div class="case-sub">${r.outputBytes} bytes</div>` : '<span class="small muted">No bytes generated</span>'}</td></tr>`).join('') : '';
    return `${head('Preview and validation', 'Does this exact definition work across realistic examples? A result belongs to one definition, dependency set, sample, schema, audience, profile and suite version.',
      `${can('validate') ? button('Run scenario matrix', 'run-validation') : ''}${button('Back to template', 'go-definition')}`)}
<div class="card space"><div class="pad context-strip">
<div><span class="eyebrow">Exact definition</span><strong class="mono">${esc(S.short(record.fingerprint))}</strong><div class="case-sub">${esc(record.revision)} · ${esc(record.state)}</div></div>
<div><span class="eyebrow">Sample</span><strong>${esc(chosen ? chosen.label : 'None')}</strong><div class="case-sub">${esc(chosen ? `${chosen.id} v${chosen.version}` : '—')}</div></div>
<div><span class="eyebrow">Audience</span><strong>${esc(S.AUDIENCES[record.audience])}</strong><div class="case-sub">Filtered before rendering</div></div>
<div><span class="eyebrow">Source as at</span><strong>${esc(day(state.clock))}</strong><div class="case-sub">${esc(record.schemaId)}@${esc(record.schemaVersion)}</div></div>
<div><span class="eyebrow">Render profile</span><strong>${esc(S.PROFILES[record.profile] ? S.PROFILES[record.profile].label : record.profile)}</strong><div class="case-sub">Suite ${esc(V.SUITE_VERSION)}</div></div>
</div>
<div class="filters">
<div><label for="sample">Sample</label><select id="sample">${samples().map(s => `<option value="${esc(s.id)}"${s.id === sampleId ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select></div>
<div><label for="mode">Preview</label><select id="mode"><option value="document"${previewMode === 'document' ? ' selected' : ''}>Document preview</option>${supportsForm ? `<option value="form"${previewMode === 'form' ? ' selected' : ''}>Form preview</option>` : ''}</select></div>
<div class="small muted">${esc(chosen ? chosen.note : '')}</div>
</div></div>
${blocked ? `<div class="callout warning space"><strong>Unsupported.</strong> ${esc(blocked.message)} No rendered success is shown for an unsupported definition.</div>`
      : chosen ? (previewMode === 'form' && supportsForm ? formPreview(record, chosen) : documentPreview(record, chosen))
        : '<div class="callout neutral space"><strong>No sample registered.</strong> This family has no synthetic sample in r01, so no preview can be produced.</div>'}
<div class="card space"><div class="card-head"><h3>Validation scenario matrix</h3><div class="label-row">${tag(cur.state, cur.state === 'current' ? 'success' : 'warning')}${latest ? `<span class="small muted">${esc(latest.id)} · ${esc(instant(latest.at))}</span>` : ''}</div></div>
${latest ? `<div class="table-wrap"><table><thead><tr><th>Scenario</th><th>Result</th><th>Observation</th><th>Output evidence</th></tr></thead><tbody>${results}</tbody></table></div>
<div class="card-foot">${latest.passed} passed · ${latest.failed} failed · ${latest.blocked} blocked · ${latest.notRun} not run · ${latest.notApplicable} not applicable. ${esc(cur.reason)} Passing a structural check does not prove technical, commercial or operational correctness.</div>`
      : `<div class="empty"><h3>Not run</h3><p>No validation has been executed against this definition in this browser.</p>${can('validate') ? button('Run scenario matrix', 'run-validation') : ''}</div>`}</div>
${latest ? `<div class="card space"><div class="card-head"><h3>Run evidence</h3></div><div class="pad"><dl class="meta">
<dt>Definition fingerprint</dt><dd class="mono">${esc(latest.definitionFingerprint)}</dd>
<dt>Dependency fingerprint</dt><dd class="mono">${esc(latest.dependencyFingerprint)}</dd>
<dt>Source schema</dt><dd>${esc(latest.schemaKey)}</dd>
<dt>Audience</dt><dd>${esc(S.AUDIENCES[latest.audience])}</dd>
<dt>Renderer profile</dt><dd>${esc(S.PROFILES[latest.profile] ? S.PROFILES[latest.profile].label : latest.profile)}</dd>
<dt>Validation suite</dt><dd>${esc(latest.suite)}</dd>
<dt>Executed</dt><dd>${esc(instant(latest.at))}</dd>
<dt>Evidence key</dt><dd class="mono">${esc(latest.evidenceKey)}</dd>
</dl></div></div>` : ''}`;
  }

  /* ---- view 4 · review and publication ------------------------------------------------------- */

  function reviewView() {
    const record = definition();
    if (!record) return `<div class="empty"><h3>Select a template</h3>${button('Back to register', 'go-register')}</div>`;
    const policy = state.policies[record.familyId];
    const subs = M.submissionsFor(state, record.id);
    const open = subs.find(s => s.state === 'submitted');
    const scope = M.intendedScope(record);
    const resolution = M.resolve(state, probe, state.clock);
    const checks = M.publishChecks(state, record.id, scope, state.clock, null, { supersede: false });
    return `${head('Review and publication', 'Is this exact version approved, and is it eligible to publish? Approved, published, future effective and eligible now are four different things.',
      `${record.state === 'draft' && can('submit') ? button('Submit for review', 'submit-review') : ''}${record.state === 'approved' && can('publish') ? button('Publish with a use assignment', 'publish') : ''}`)}
${!policy ? `<div class="callout warning space"><strong>Policy not configured.</strong> No review or publication policy is configured for ${esc(currentFamily().title)}. Submission, review decisions and publication remain unavailable until a configured policy is selected. ${can('configure') ? button('Select a fictional configured policy', 'configure-policy') : 'A template publisher can select one in this preview.'}</div>`
      : `<div class="callout neutral space"><strong>${esc(policy.label)}</strong> (${esc(policy.id)}) — ${policy.reviewers} independent reviewer required; self-review ${policy.allowSelfReview ? 'permitted' : 'forbidden'}; current validation ${policy.requiresValidation ? 'required' : 'not required'}. Illustrative fictional policy, not adopted Powerplants authority.</div>`}
<div class="two-col">
<div class="stack">
<div class="card"><div class="card-head"><h3>Review queue for this family</h3></div>
${subs.length ? `<div class="table-wrap"><table><thead><tr><th>Submission</th><th>State</th><th>Exact snapshot</th><th>Decisions</th></tr></thead><tbody>
${subs.map(s => `<tr><td class="case-cell"><strong>${esc(s.id)}</strong><div class="case-sub">${esc(M.ROLES[s.author] ? M.ROLES[s.author].label : s.author)} · ${esc(instant(s.at))}</div><div class="case-sub">${esc(s.purpose)}</div></td>
<td data-label="State">${tag(s.state, s.state === 'approved' ? 'success' : s.state === 'returned' ? 'warning' : 'info')}</td>
<td data-label="Exact snapshot"><span class="mono small">${esc(S.short(s.fingerprint))}</span><div class="case-sub">${s.fingerprint === record.fingerprint ? 'Matches the current definition' : 'Definition has changed since submission'}</div><div class="case-sub">${s.runId ? `Validation ${esc(s.runId)}` : 'No validation recorded'}</div></td>
<td data-label="Decisions">${s.decisions.length ? s.decisions.map(d => `<div class="small"><strong>${esc(d.outcome)}</strong> · ${esc(M.ROLES[d.actor] ? M.ROLES[d.actor].label : d.actor)}<div class="case-sub">${esc(d.reason)}</div><div class="case-sub">${esc(instant(d.at))} · ${esc(S.short(d.fingerprint || ''))}</div></div>`).join('') : '<span class="small muted">Outstanding</span>'}</td></tr>`).join('')}
</tbody></table></div>` : '<div class="pad small muted">No submission has been recorded for this definition.</div>'}
<div class="card-foot">A reviewer inspects the submitted snapshot; they cannot silently edit the author’s submission while approving it.</div></div>

<div class="card"><div class="card-head"><h3>Findings</h3>${open && can('finding') ? button('Record a finding', 'record-finding', `data-id="${esc(open.id)}"`) : ''}</div><div class="pad stack">
${subs.flatMap(s => M.findingsFor(state, s.id)).length ? subs.flatMap(s => M.findingsFor(state, s.id)).map(f => `<div class="finding"><div class="label-row">${tag(f.state, f.state === 'accepted' ? 'success' : 'warning')}<strong>${esc(f.location)}</strong></div>
<p class="small">${esc(f.message)}</p><div class="case-sub">${esc(M.ROLES[f.raisedBy] ? M.ROLES[f.raisedBy].label : f.raisedBy)} · ${esc(instant(f.at))}</div>
${f.response ? `<div class="source-note small"><strong>Author response</strong><p>${esc(f.response.text)}</p><div class="case-sub">${esc(instant(f.response.at))}</div></div>` : ''}
<div class="row-actions">${!f.response && can('respond') ? button('Answer this finding', 'respond-finding', `data-id="${esc(f.id)}"`) : ''}${f.response && f.state === 'open' && can('decide') ? button('Accept the response', 'accept-finding', `data-id="${esc(f.id)}"`) : ''}</div>
${f.state === 'open' ? '<p class="small muted">An answer alone does not close a finding. The required reviewer records acceptance or requests correction.</p>' : ''}</div>`).join('')
      : '<p class="small muted">No finding has been recorded against this family’s submissions.</p>'}
</div>
${open && can('decide') ? `<div class="pad"><h3>Review decision</h3><form data-action="decide" data-id="${esc(open.id)}">
<div class="field"><label for="outcome">Decision</label><select id="outcome" name="outcome"><option value="approved">Approve this exact definition</option><option value="returned">Return for correction</option></select></div>
<div class="field"><label for="reason">Reason</label><textarea id="reason" name="reason" required></textarea></div>
<div class="dialog-actions"><button class="primary" type="submit">Record decision</button></div><p class="error" id="decide-error" hidden></p></form></div>` : ''}
</div>

<div class="card"><div class="card-head"><h3>Publication readiness</h3></div><div class="pad">
<ul class="check-list">${checks.map(c => `<li class="${c.ok ? 'ok' : 'not-ok'}"><strong>${esc(c.label)}</strong><span class="small">${esc(c.detail)}</span></li>`).join('')}</ul>
<hr class="rule">
<h3>Intended use assignment</h3>
<dl class="meta"><dt>Company</dt><dd>${esc(scope.company)}</dd><dt>Output family</dt><dd>${esc(scope.outputFamily)}</dd><dt>Purpose</dt><dd>${esc(scope.purpose)}</dd><dt>Audience</dt><dd>${esc(S.AUDIENCES[scope.audience])}</dd><dt>Locale</dt><dd>${esc(scope.locale)}</dd></dl>
<hr class="rule">
<h3>Selection probe</h3>
<p class="small muted">Ask the resolver for a request context and see exactly what it returns. Intervals are start-inclusive and end-exclusive, with an explicitly open end where no expiry applies.</p>
<form data-action="probe">
<div class="field-row"><div class="field"><label for="p-company">Company or entity</label><select id="p-company" name="company"><option value="">(not supplied)</option>${['PPO-AU-DEMO', 'RTF-AU-DEMO'].map(c => `<option value="${c}"${probe.company === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
<div class="field"><label for="p-output">Output or form family</label><select id="p-output" name="outputFamily"><option value="">(not supplied)</option>${['OUT-05', 'OUT-06', 'OUT-08', 'OUT-09', 'OUT-10', 'OUT-12', 'OUT-13', 'OUT-14'].map(c => `<option value="${c}"${probe.outputFamily === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div></div>
<div class="field-row"><div class="field"><label for="p-purpose">Purpose</label><select id="p-purpose" name="purpose"><option value="">(not supplied)</option>${['customer-report', 'discovery-capture', 'technician-instruction', 'customer-quotation', 'technical-transmittal', 'commissioning-record', 'staged-handover', 'finance-evidence'].map(c => `<option value="${c}"${probe.purpose === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
<div class="field"><label for="p-audience">Audience</label><select id="p-audience" name="audience"><option value="">(not supplied)</option>${Object.keys(S.AUDIENCES).map(c => `<option value="${c}"${probe.audience === c ? ' selected' : ''}>${esc(S.AUDIENCES[c])}</option>`).join('')}</select></div></div>
<div class="field"><label for="p-locale">Locale</label><select id="p-locale" name="locale"><option value="">(not supplied)</option><option value="en-AU"${probe.locale === 'en-AU' ? ' selected' : ''}>en-AU</option><option value="en-NZ"${probe.locale === 'en-NZ' ? ' selected' : ''}>en-NZ</option></select></div>
<div class="dialog-actions"><button class="primary" type="submit">Resolve at demonstration time</button></div></form>
<div class="callout ${resolution.outcome === 'eligible' ? 'success' : resolution.outcome === 'ambiguous' ? 'warning' : 'neutral'}" id="probe-result">
<strong>${esc({ eligible: 'Eligible', 'no-match': 'No match', ambiguous: 'Ambiguous match', 'missing-context': 'Missing context', unsupported: 'Unsupported' }[resolution.outcome])}</strong>
${esc(resolution.detail)}${resolution.outcome === 'eligible' ? ` <button class="text-button" data-action="open-definition" data-id="${esc(resolution.definition.id)}">Open ${esc(resolution.definition.revision)}</button>` : ''}
${resolution.outcome === 'ambiguous' ? `<ul class="quiet-list">${resolution.candidates.map(c => `<li>${esc(c.definition.revision)} under ${esc(c.publication.id)} from ${esc(day(c.publication.from))}</li>`).join('')}</ul>` : ''}
</div>
<hr class="rule">
<h3>Assignments for this family</h3>
<ul class="quiet-list">${M.definitionsFor(state, record.familyId).flatMap(d => M.publicationsFor(state, d.id)).map(p => `<li>${esc(p.id)} · ${esc(M.findDefinition(state, p.definitionId).revision)} · ${esc(day(p.from))} → ${p.to ? esc(day(p.to)) : 'open'} · ${esc(M.eligibilityState(state, p, state.clock))}${p.state === 'active' && can('retire') ? ` ${button('Withdraw from new use', 'retire', `data-id="${esc(p.id)}"`)}` : ''}${p.reason ? `<div class="case-sub">${esc(p.reason)}</div>` : ''}</li>`).join('')}</ul>
</div></div></div>`;
  }

  /* ---- view 5 · usage and change impact ---------------------------------------------------------- */

  function impactView() {
    const record = definition();
    if (!record) return `<div class="empty"><h3>Select a template</h3>${button('Back to register', 'go-register')}</div>`;
    const report = M.impact(state, record.id);
    const groups = [['draft', 'Draft document'], ['reserved', 'Reserved render request'], ['generated', 'Generated, unissued output'], ['issued', 'Issued document'], ['activeForm', 'Active capture form'], ['response', 'Submitted form response'], ['scheduled', 'Scheduled work without reserved output']];
    const differences = report.differences;
    const businessRows = [
      ['New content', differences.added, 'Appears for records that meet its condition.'],
      ['Removed content', differences.removed, 'No longer presented; historical answers keep their original identity.'],
      ['Wording only', differences.labelOnly, 'Presentation wording changes; the underlying value does not.'],
      ['Changed meaning', differences.meaning, 'A type or unit change alters interpretation and needs explicit compatibility treatment.'],
      ['Changed source', differences.binding, 'The value now comes from a different approved source path.'],
      ['Changed requiredness', differences.requiredness, 'What must be supplied or entered has changed.'],
      ['Changed conditions', differences.conditions, 'When content is shown has changed.'],
      ['Reordered', differences.reordered, 'Position changed; field identity did not.'],
      ['Dependencies', differences.dependencies, 'A renderer, font or shared asset reference changed.'],
      ['Applicability', differences.applicability, 'Where this definition may be used has changed.']
    ].filter(([, list]) => list.length);
    return `${head('Usage and change impact', 'What will change if this version becomes eligible? Actions here prepare review tasks. They do not upgrade consumers, rewrite responses or regenerate issued files.',
      `${can('handover') ? button('Prepare DK-03 template-selection handover', 'handover') : ''}${button('Technical summary', 'toggle-technical')}`)}
${report.complete ? '' : `<div class="callout warning space"><strong>Impact incomplete.</strong> ${esc(report.sources.find(s => !s.complete).reason)} Source as at ${esc(instant(report.sources.find(s => !s.complete).asOf))}. Zero returned rows from a failed lookup cannot justify publication.</div>`}
<div class="card space"><div class="card-head"><h3>Consumers of ${esc(report.predecessor ? report.predecessor.revision : record.revision)}</h3><span class="small muted">${report.consumers.length} recorded</span></div>
${report.consumers.length ? groups.map(([kind, label]) => {
      const list = report.consumers.filter(c => c.kind === kind);
      if (!list.length) return '';
      return `<div class="pad consumer-group"><h3>${esc(label)} <span class="tab-count">${list.length}</span></h3>
${list.map(c => `<div class="consumer"><div class="label-row"><strong>${esc(c.label)}</strong>${tag(c.domain)}</div>
<p class="small">${esc(c.detail)}</p><p class="small"><strong>Planned treatment:</strong> ${esc(c.treatment)}</p>
${c.sha256 ? `<div class="case-sub mono">${esc(c.sha256)} · ${c.bytes} bytes</div>` : ''}${c.acknowledgement ? `<div class="case-sub">${esc(c.acknowledgement)}</div>` : ''}
<div class="case-sub">Owner: ${esc(c.owner)}</div>
${can('followup') && !state.tasks.some(t => t.key === `followup:${c.id}`) ? button('Prepare owned follow-up', 'followup', `data-id="${esc(c.id)}"`) : state.tasks.some(t => t.key === `followup:${c.id}`) ? tag('Follow-up prepared', 'success') : ''}</div>`).join('')}</div>`;
    }).join('') : '<div class="pad small muted">No consumer is recorded against this definition in the fixture catalogue. Unknown usage remains an owned assessment gap, not a cleared one.</div>'}
<div class="card-foot">Counts are taken from the fixture usage sources listed below, with their own as-at times and completeness.</div></div>

<div class="card space"><div class="card-head"><h3>What changes between ${esc(report.predecessor ? report.predecessor.revision : '—')} and ${esc(record.revision)}</h3></div><div class="pad">
${report.predecessor ? (businessRows.length ? businessRows.map(([label, list, note]) => `<div class="difference"><h3>${esc(label)} <span class="tab-count">${list.length}</span></h3><p class="small muted">${esc(note)}</p><ul class="quiet-list">${list.map(item => `<li><strong>${esc(item.label)}</strong>${showTechnical ? ` — <span class="mono small">${esc(item.id)}</span>: ${esc(item.detail)}` : ` — ${esc(item.detail)}`}</li>`).join('')}</ul></div>`).join('')
      : '<p class="small muted">No difference from the earlier definition.</p>') : '<p class="small muted">This definition has no predecessor in the fixture catalogue.</p>'}
</div><div class="card-foot">Classification helps assessment. It does not automatically approve a change as harmless.</div></div>

${report.sharedFamilies.length ? `<div class="card space"><div class="card-head"><h3>Shared dependency impact</h3></div><div class="pad">
<div class="callout warning"><strong>${report.sharedFamilies.length} other families reference a changed dependency.</strong> Their validation and review evidence is out of date until re-run. The original source bytes are unchanged; this is a new exact dependency reference.</div>
<ul class="quiet-list">${report.sharedFamilies.map(f => `<li><strong>${esc(f.family.title)}</strong> (${esc(f.familyId)}) — ${f.paths.map(p => `<span class="mono small">${esc(p)}</span>`).join(', ')}</li>`).join('')}</ul>
</div></div>` : ''}

${report.responses.length ? `<div class="card space"><div class="card-head"><h3>Form response compatibility</h3></div>
${report.responses.map(r => `<div class="table-wrap"><table><thead><tr><th>Original field</th><th>Original answer</th><th>Effect</th><th>Detail</th></tr></thead><tbody>
${P.compareResponse(r, record).map(row => `<tr><td class="case-cell"><strong>${esc((r.fieldMeta[row.fieldId] || {}).label || row.fieldId)}</strong><div class="case-sub mono">${esc(row.fieldId)}</div></td>
<td data-label="Original answer">${esc(String(row.value))}${(r.fieldMeta[row.fieldId] || {}).unit ? ` ${esc(r.fieldMeta[row.fieldId].unit)}` : ''}</td>
<td data-label="Effect">${tag(row.effect, row.effect === 'incompatible' ? 'danger' : row.effect === 'removed' ? 'warning' : row.effect === 'label-only' ? 'info' : 'success')}</td>
<td data-label="Detail"><div class="small">${esc(row.detail)}</div></td></tr>`).join('')}
</tbody></table></div>`).join('')}
<div class="card-foot">A migration comparison may show suggested mappings. Applying them belongs to a separately authorised receiving workflow, not to template publication.</div></div>` : ''}

<div class="card space"><div class="card-head"><h3>Usage sources</h3></div><div class="table-wrap"><table><thead><tr><th>Domain</th><th>Completeness</th><th>Source as at</th><th>Note</th></tr></thead><tbody>
${report.sources.map(s => `<tr><td class="case-cell"><strong>${esc(s.domain)}</strong></td><td data-label="Completeness">${tag(s.complete ? 'Complete' : 'Partial', s.complete ? 'success' : 'warning')}</td><td data-label="Source as at">${esc(instant(s.asOf))}</td><td data-label="Note"><div class="small">${esc(s.reason || 'Full result returned for this scope.')}</div></td></tr>`).join('')}
</tbody></table></div></div>

${state.tasks.length ? `<div class="card space"><div class="card-head"><h3>Prepared tasks</h3></div><div class="pad"><ul class="quiet-list">${state.tasks.map(t => `<li><strong>${esc(t.label)}</strong><div class="case-sub">${esc(t.detail)}</div><div class="case-sub">${esc(instant(t.at))} · ${esc(M.ROLES[t.by] ? M.ROLES[t.by].label : t.by)}</div></li>`).join('')}</ul>
<p class="small muted">Prepared locally. Nothing is issued, sent or written to another module.</p></div></div>` : ''}`;
  }

  /* ---- view 6 · history and recovery -------------------------------------------------------------- */

  function historyView() {
    const record = definition();
    if (!record) return `<div class="empty"><h3>Select a template</h3>${button('Back to register', 'go-register')}</div>`;
    const lineage = M.definitionsFor(state, record.familyId).sort((a, b) => a.created < b.created ? -1 : 1);
    const issued = M.CONSUMERS.filter(c => c.kind === 'issued' && M.findDefinition(state, c.definitionId) && M.findDefinition(state, c.definitionId).familyId === record.familyId);
    const events = [...state.events].reverse();
    const unknown = state.operations.filter(o => o.outcome === 'unknown');
    return `${head('History and recovery', 'What happened, and how do I recover without losing evidence? Definitions, decisions, publications and retirements are retained exactly.',
      `${button('Recovery controls', 'recovery-controls')}`)}
${unknown.length ? `<div class="callout warning space"><strong>Outcome unknown.</strong> ${unknown.map(o => `Operation ${esc(o.id)} requested at ${esc(instant(o.at))} has no known result.`).join(' ')} Reconcile it before another publication is attempted, so one intended assignment produces one effect. ${can('reconcile') ? unknown.map(o => button(`Reconcile ${o.id}`, 'reconcile', `data-id="${esc(o.id)}"`)).join('') : 'A template publisher can reconcile it.'}</div>` : ''}
<div class="two-col"><div class="stack">
<div class="card"><div class="card-head"><h3>Definition lineage</h3></div><div class="table-wrap"><table><thead><tr><th>Definition</th><th>State</th><th>Created</th><th>Exact content</th><th></th></tr></thead><tbody>
${lineage.map(d => `<tr${d.id === record.id ? ' class="selected"' : ''}><td class="case-cell"><strong>${esc(d.revision)}</strong><div class="case-sub">${esc(d.id)}${d.predecessorId ? ` · successor of ${esc(M.findDefinition(state, d.predecessorId) ? M.findDefinition(state, d.predecessorId).revision : d.predecessorId)}` : ' · original definition'}</div><div class="case-sub">${esc(d.rationale || '')}</div></td>
<td data-label="State">${tag(d.state, STATE_TONE[d.state])}</td><td data-label="Created">${esc(day(d.created))}</td>
<td data-label="Exact content"><span class="mono small">${esc(S.short(d.fingerprint))}</span></td>
<td data-label="Actions">${button('Open', 'open-definition', `data-id="${esc(d.id)}"`)}</td></tr>`).join('')}
</tbody></table></div><div class="card-foot">Creating a successor never unlocks or modifies an earlier definition.</div></div>

<div class="card"><div class="card-head"><h3>Historical documents for this family</h3></div><div class="pad stack">
${issued.length ? issued.map(c => `<div class="consumer"><div class="label-row"><strong>${esc(c.label)}</strong>${tag(M.findDefinition(state, c.definitionId).revision)}</div>
<dl class="meta"><dt>Template identity</dt><dd>${esc(c.definitionId)} · <span class="mono">${esc(S.short(M.findDefinition(state, c.definitionId).fingerprint))}</span></dd>
<dt>Retained bytes</dt><dd>${c.bytes} bytes · <span class="mono">${esc(c.sha256)}</span></dd>
<dt>Response</dt><dd>${esc(c.acknowledgement || 'No recorded response')}</dd></dl>
<p class="small muted">Retrieval uses the retained exact bytes. Rerendering an old definition produces a reconstruction for comparison, not the issued file.</p>
${button('Open a labelled reconstruction', 'reconstruct', `data-id="${esc(c.definitionId)}"`)}</div>`).join('') : '<p class="small muted">No issued document is recorded for this family.</p>'}
</div></div>

<div class="card"><div class="card-head"><h3>Publication operations</h3></div>
${state.operations.length ? `<div class="table-wrap"><table><thead><tr><th>Operation</th><th>Outcome</th><th>Receipt</th><th>Requested</th></tr></thead><tbody>
${state.operations.map(o => `<tr><td class="case-cell"><strong>${esc(o.id)}</strong><div class="case-sub">${esc(o.definitionId)}</div><div class="case-sub mono">${esc(S.short(o.intent))}</div></td>
<td data-label="Outcome">${tag(o.outcome, o.outcome === 'completed' ? 'success' : 'danger')}</td>
<td data-label="Receipt">${o.receipt ? `<span class="mono small">${esc(o.receipt)}</span>` : '<span class="small muted">No receipt received</span>'}${o.reconciledAt ? `<div class="case-sub">Reconciled ${esc(instant(o.reconciledAt))}</div>` : ''}</td>
<td data-label="Requested">${esc(instant(o.at))}<div class="case-sub">${esc(M.ROLES[o.requestedBy] ? M.ROLES[o.requestedBy].label : o.requestedBy)}</div></td></tr>`).join('')}
</tbody></table></div>` : '<div class="pad small muted">No publication has been attempted in this browser session.</div>'}</div>
</div>

<div class="card"><div class="card-head"><h3>Retained history</h3><span class="small muted">${events.length} entries</span></div><div class="pad">
<ul class="history">${events.slice(0, 40).map(e => `<li><strong>${esc(e.type)}</strong> — ${esc(e.detail)}<small>${esc(instant(e.at))} · ${esc(M.ROLES[e.actor] ? M.ROLES[e.actor].label : e.actor)}</small></li>`).join('')}</ul>
${events.length > 40 ? `<p class="small muted">Showing the 40 most recent of ${events.length} entries.</p>` : ''}
</div></div></div>`;
  }

  /* ---- render ------------------------------------------------------------------------------------ */

  const RENDERERS = { register, definition: definitionView, preview: previewView, review: reviewView, impact: impactView, history: historyView };

  function render() {
    document.querySelector('.tabs').innerHTML = VIEWS.map(([id, label]) =>
      `<button role="tab" id="tab-${id}" aria-selected="${view === id}" aria-controls="main" tabindex="${view === id ? 0 : -1}" data-view="${id}">${label}</button>`).join('');
    $('main').setAttribute('aria-labelledby', `tab-${view}`);
    $('main').innerHTML = RENDERERS[view]();
    status();
    if (focusFieldId && view === 'definition') {
      const row = document.getElementById(`field-${focusFieldId}`);
      if (row) row.scrollIntoView({ block: 'center' });
    }
  }

  function go(id) {
    if (!VIEWS.some(v => v[0] === id)) return;
    if ($('snapshot').open) $('snapshot').close();
    view = id;
    try { localStorage.setItem(VIEW_KEY, id); } catch { /* preference only */ }
    render();
    $('main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function showDialog(title, html) { $('dialog-title').textContent = title; $('dialog-body').innerHTML = html; if (!$('dialog').open) $('dialog').showModal(); }
  const closeDialog = () => $('dialog').close();

  function openSnapshot(id) {
    const record = M.findDefinition(state, id);
    if (!record) return;
    selectDefinition(id);
    $('snapshot-title').textContent = `${M.family(record.familyId).title} · ${record.revision}`;
    $('snapshot-body').innerHTML = snapshotBody(record);
    if (!$('snapshot').open) $('snapshot').showModal();
  }

  /* ---- forms ------------------------------------------------------------------------------------- */

  function bindingOptions(record, selected) {
    const schema = S.SOURCE_SCHEMAS[`${record.schemaId}@${record.schemaVersion}`];
    if (!schema) return '<option value="">(source schema unavailable)</option>';
    return `<option value="">Mapping needed</option>` + schema.paths.map(p =>
      `<option value="${esc(p.id)}"${selected === p.id ? ' selected' : ''}>${esc(p.id)} · ${esc(p.type)}${p.unit ? ` (${esc(p.unit)})` : ''}${p.cardinality === 'many' ? ' · many' : ''}${p.confidentiality !== 'customer' ? ` · ${esc(S.AUDIENCES[p.confidentiality])}` : ''}${p.retired ? ' · RETIRED' : ''}</option>`).join('');
  }

  function conditionControls(record, condition, prefix) {
    const simple = condition && !S.OPERATORS[condition.operator]?.group ? condition : null;
    const schema = S.SOURCE_SCHEMAS[`${record.schemaId}@${record.schemaVersion}`];
    return `<fieldset class="condition-builder"><legend>Shown when</legend>
<div class="field"><label for="${prefix}-kind">Controlled by</label><select id="${prefix}-kind" name="${prefix}Kind">
<option value="">Always shown</option>
<option value="source"${simple && simple.subject.kind === 'source' ? ' selected' : ''}>A source value</option>
<option value="field"${simple && simple.subject.kind === 'field' ? ' selected' : ''}>Another field’s answer</option></select></div>
<div class="field"><label for="${prefix}-path">Source path</label><select id="${prefix}-path" name="${prefix}SourcePath">${(schema ? schema.paths : []).map(p => `<option value="${esc(p.id)}"${simple && simple.subject.path === p.id ? ' selected' : ''}>${esc(p.id)}</option>`).join('')}</select></div>
<div class="field"><label for="${prefix}-field">Field</label><select id="${prefix}-field" name="${prefix}FieldPath">${record.fields.map(f => `<option value="${esc(f.id)}"${simple && simple.subject.path === f.id ? ' selected' : ''}>${esc(f.label)} (${esc(f.id)})</option>`).join('')}</select></div>
<div class="field"><label for="${prefix}-operator">Operator</label><select id="${prefix}-operator" name="${prefix}Operator">${Object.keys(S.OPERATORS).filter(o => !S.OPERATORS[o].group).map(o => `<option value="${o}"${simple && simple.operator === o ? ' selected' : ''}>${esc(S.OPERATORS[o].label)}</option>`).join('')}</select></div>
<div class="field"><label for="${prefix}-value">Value</label><input id="${prefix}-value" name="${prefix}Value" value="${esc(simple && simple.value !== undefined ? simple.value : '')}"><small>Only equals, does not equal and is one of use a value. Arbitrary code, formulas and network paths are not accepted.</small></div>
</fieldset>`;
  }

  function readCondition(form, prefix) {
    const kind = form.elements[`${prefix}Kind`].value;
    if (!kind) return null;
    const path = kind === 'source' ? form.elements[`${prefix}SourcePath`].value : form.elements[`${prefix}FieldPath`].value;
    const operator = form.elements[`${prefix}Operator`].value;
    const value = form.elements[`${prefix}Value`].value;
    return { subject: { kind, path }, operator, value: S.OPERATORS[operator].value ? value : undefined };
  }

  function fieldForm(record, existing, sectionId) {
    const f = existing || { id: '', type: 'bound', label: '', help: '', unit: '', binding: '', required: 'optional', visibility: null, options: null, sectionId: sectionId || '' };
    return `<form data-action="${existing ? 'save-field' : 'create-field'}" data-id="${esc(existing ? existing.id : '')}" data-section="${esc(f.sectionId)}">
<div class="field"><label for="f-label">Label</label><input id="f-label" name="label" value="${esc(f.label)}" required maxlength="120"></div>
<div class="field-row">
<div class="field"><label for="f-type">Supported type</label><select id="f-type" name="type">${Object.keys(S.FIELD_TYPES).filter(t => t !== 'protected').map(t => `<option value="${t}"${f.type === t ? ' selected' : ''}>${esc(S.FIELD_TYPES[t].label)}</option>`).join('')}</select><small>Adding a field opens this structured form. It does not open a code editor.</small></div>
<div class="field"><label for="f-required">Requiredness</label><select id="f-required" name="required">
<option value="optional"${f.required === 'optional' ? ' selected' : ''}>Optional</option>
<option value="input"${f.required === 'input' ? ' selected' : ''}>Entry required</option>
<option value="source"${f.required === 'source' ? ' selected' : ''}>Source mandatory</option></select></div></div>
<div class="field"><label for="f-binding">Source binding</label><select id="f-binding" name="binding">${bindingOptions(record, f.binding)}</select></div>
<div class="field-row"><div class="field"><label for="f-unit">Unit</label><input id="f-unit" name="unit" value="${esc(f.unit || '')}"><small>A number field must declare a compatible unit. No conversion is applied.</small></div>
<div class="field"><label for="f-help">Help text</label><input id="f-help" name="help" value="${esc(f.help || '')}" maxlength="200"></div></div>
<div class="field"><label for="f-options">Choice options</label><textarea id="f-options" name="options" placeholder="one per line: stable-id|Label">${esc((f.options || []).map(o => `${o.id}|${o.label}`).join('\n'))}</textarea></div>
${conditionControls(record, f.visibility, 'cond')}
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">${existing ? 'Save field' : 'Add field'}</button></div>
<p class="error" id="form-error" hidden></p></form>`;
  }

  function sectionForm(record, existing) {
    const s = existing || { id: '', label: '', purpose: '', repeat: null, condition: null };
    const schema = S.SOURCE_SCHEMAS[`${record.schemaId}@${record.schemaVersion}`];
    const repeatable = schema ? schema.paths.filter(p => p.cardinality === 'many' && p.type === 'group') : [];
    return `<form data-action="${existing ? 'save-section' : 'create-section'}" data-id="${esc(existing ? existing.id : '')}">
<div class="field"><label for="s-label">Section label</label><input id="s-label" name="label" value="${esc(s.label)}" required maxlength="120"></div>
<div class="field"><label for="s-purpose">Purpose</label><input id="s-purpose" name="purpose" value="${esc(s.purpose)}" maxlength="200"></div>
<div class="field"><label for="s-repeat">Repeats over</label><select id="s-repeat" name="repeat"><option value="">Not repeating</option>${repeatable.map(p => `<option value="${esc(p.id)}"${s.repeat === p.id ? ' selected' : ''}>${esc(p.id)}</option>`).join('')}</select><small>A repeating section preserves the source item identities and their declared order.</small></div>
${conditionControls(record, s.condition, 'cond')}
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">${existing ? 'Save section' : 'Add section'}</button></div>
<p class="error" id="form-error" hidden></p></form>`;
  }

  function publishForm(record) {
    const scope = M.intendedScope(record);
    const from = new Date(new Date(state.clock).getTime() + 7 * 86400000).toISOString().slice(0, 10);
    return `<form data-action="do-publish">
<p class="small muted">Publication records the exact approved definition and the intended use assignment together. Publishing does not approve or issue any document created from this template.</p>
<dl class="meta"><dt>Definition</dt><dd>${esc(record.revision)} · <span class="mono">${esc(S.short(record.fingerprint))}</span></dd>
<dt>Scope</dt><dd>${esc(scope.company)} · ${esc(scope.outputFamily)} · ${esc(scope.purpose)} · ${esc(S.AUDIENCES[scope.audience])} · ${esc(scope.locale)}</dd></dl>
<div class="field-row">
<div class="field"><label for="pub-from">Effective from</label><input id="pub-from" name="from" type="date" value="${from}" required><small>Interpreted at 00:00 in ${esc(M.TZ)}. Start-inclusive.</small></div>
<div class="field"><label for="pub-to">Effective to</label><input id="pub-to" name="to" type="date"><small>Leave empty for an explicitly open end. End-exclusive when supplied.</small></div></div>
<label class="form-check"><input type="checkbox" name="supersede"> Close any open-ended earlier assignment for this exact scope at the stated instant</label>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Publish</button></div>
<p class="error" id="form-error" hidden></p></form>`;
  }

  function guide() {
    showDialog('Review this workspace', `<p class="small muted">Every template, source value, person, policy, date and document below is synthetic. The demonstration clock starts at ${esc(instant(M.DEMO_START))} and only moves when you advance it.</p>
<ol class="guide-list">
<li><strong>Find the eligible definition.</strong> In Template register, open Customer service report r02 and inspect its source authority, fingerprint, effective interval and consumers.</li>
<li><strong>Create a successor.</strong> In Template &amp; rules, choose Create successor. The published definition stays read-only.</li>
<li><strong>Add the remaining-work panel.</strong> Add a repeating section over <span class="mono">remainingWork</span> shown when that source is present, then add its bound fields.</li>
<li><strong>Validate.</strong> In Preview &amp; validation, run the scenario matrix across complete, missing, zero/false/unknown, unknown-branch, long-content, repeating and restricted samples.</li>
<li><strong>Break a binding and see the evidence go out of date.</strong> Change a unit so it disagrees with the source, then correct it and rerun.</li>
<li><strong>Submit, be returned, correct and be approved.</strong> Switch to the reviewer profile to record a finding and a decision. An answer alone does not close a finding.</li>
<li><strong>Inspect usage impact.</strong> See the draft, reserved render, generated bundle, issued report and scheduled visit, and the partial Projects lookup.</li>
<li><strong>Publish with a future effective instant.</strong> As publisher, use Recovery controls to lose the next publication response, then reconcile the original operation.</li>
<li><strong>Advance the demonstration clock</strong> past the effective instant and use the selection probe to see Eligible, No match, Ambiguous match and Missing context.</li>
<li><strong>Check history.</strong> Confirm the issued report’s retained bytes, template identity and acknowledgement are unchanged, then export a review copy.</li>
</ol>
<div class="test-controls"><h3>Recovery demonstrations</h3><p class="small muted">These affect only this local synthetic workspace.</p>
<div class="actions">${button('Fail next save once', 'fail-next-save')}${button('Lose next publication response', 'fail-next-publish')}${button('Export review copy', 'export')}${button('Reset demo', 'reset')}</div></div>`);
  }

  function exportCopy(raw = false) {
    let data;
    try {
      data = raw ? localStorage.getItem(KEY) : JSON.stringify({
        synthetic: true, module: 'DK-06 · Document and form template management', revision: 'r01',
        notice: 'Internal synthetic design review copy. Not approved template content, not a production backup, not a template installer and not an automatic import contract.',
        demonstrationClock: state.clock, exportedAt: new Date().toISOString(),
        suite: V.SUITE_VERSION, families: M.FAMILIES, definitions: state.definitions,
        publications: state.publications, submissions: state.submissions, findings: state.findings,
        operations: state.operations, runs: state.runs, tasks: state.tasks, events: state.events,
        policies: state.policies
      }, null, 2);
    } catch { toast('Storage cannot be read; export is unavailable.'); return; }
    if (data === null) { toast('Nothing has been saved in this browser yet.'); return; }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = raw ? 'ppo-dk06-saved-state.json' : 'ppo-dk06-template-management-review-copy.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Review copy exported. It is a review copy, not a production backup or template installer.');
  }

  function formError(form, message) {
    const target = form.querySelector('.error') || $('form-error');
    if (!target) { toast(message); return; }
    target.hidden = false; target.textContent = message;
  }

  function runCommand(action, payload, success, form) {
    try { const result = commit(action, payload); if (success) success(result); return true; }
    catch (error) { if (form) formError(form, error.message); else toast(error.message); return false; }
  }

  /* ---- events -------------------------------------------------------------------------------------- */

  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { go(viewButton.dataset.view); return; }
    const target = event.target.closest('[data-action]');
    if (!target || target.tagName === 'FORM') return;
    const action = target.dataset.action, id = target.dataset.id;
    const record = definition();
    switch (action) {
      case 'close-dialog': closeDialog(); break;
      case 'close-snapshot': $('snapshot').close(); break;
      case 'snapshot': openSnapshot(id); break;
      case 'open-definition': selectDefinition(id); focusFieldId = null; go('definition'); break;
      case 'open-current': go('definition'); break;
      case 'go-register': go('register'); break;
      case 'go-definition': go('definition'); break;
      case 'go-preview': go('preview'); break;
      case 'go-field': focusFieldId = id; go('definition'); break;
      case 'clear-filters': search = ''; filter = 'current'; render(); break;
      case 'toggle-technical': showTechnical = !showTechnical; render(); break;
      case 'reload': try { const value = JSON.parse(localStorage.getItem(KEY)); if (!M.validState(value)) throw new Error('bad'); state = value; savedRaw = localStorage.getItem(KEY); storageIssue = ''; render(); toast('Saved work reloaded.'); } catch { toast('Saved work still cannot be read. It has not been overwritten.'); } break;
      case 'export': exportCopy(); break;
      case 'export-raw': exportCopy(true); break;
      case 'recovery-controls': guide(); break;
      case 'fail-next-save': runCommand('failNextSave', {}, () => { closeDialog(); toast('The next local save will fail once.'); }); break;
      case 'fail-next-publish': runCommand('failNextPublish', {}, () => { closeDialog(); toast('The next publication response will be lost.'); }); break;
      case 'reset': showDialog('Reset this workspace', `<p>This clears only <span class="mono">${KEY}</span> and its view preference. Other modules and browser data are untouched. Exported review copies are not affected; unexported saved work cannot be recovered.</p><div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" data-action="confirm-reset">Reset synthetic workspace</button></div>`); break;
      case 'confirm-reset': try { localStorage.removeItem(KEY); localStorage.removeItem(VIEW_KEY); } catch { /* nothing stored */ } savedRaw = null; state = M.initial(); storageIssue = ''; definitionId = 'DEF-REPORT-R02'; familyId = 'FAM-REPORT'; sampleId = 'S-COMPLETE'; closeDialog(); go('register'); toast('Synthetic workspace reset.'); break;
      case 'advance': showDialog('Advance the demonstration clock', `<p class="small muted">This is a local scenario control. It is not a scheduled task, a background publication service or trusted server time. Runtime effective-time selection must use trusted server time and the adopted policy.</p>
<form data-action="do-advance"><div class="field"><label for="hours">Advance by</label><select id="hours" name="hours"><option value="1">1 hour</option><option value="24">1 day</option><option value="168" selected>7 days</option><option value="336">14 days</option></select></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Advance</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'create-successor': showDialog('Create a successor', `<p class="small muted">A successor is a linked editable draft. It does not unlock or modify ${esc(record.revision)}, its dependencies or its evidence.</p>
<form data-action="do-successor"><div class="field"><label for="rationale">Why is this change proposed?</label><textarea id="rationale" name="rationale" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Create successor</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'correct': runCommand('correct', { definitionId: record.id }, () => { render(); toast('Reopened for correction. Earlier findings and decisions remain attached.'); }); break;
      case 'add-section': showDialog('Add a section', sectionForm(record, null)); break;
      case 'edit-section': showDialog('Edit section', sectionForm(record, record.sections.find(s => s.id === id))); break;
      case 'move-section': runCommand('moveSection', { definitionId: record.id, id, direction: target.dataset.direction }, () => { render(); toast('Section moved. Field identities, bindings and response interpretation are unchanged.'); }); break;
      case 'add-field': showDialog('Add a field', fieldForm(record, null, id)); break;
      case 'edit-field': showDialog('Edit field', fieldForm(record, record.fields.find(f => f.id === id))); break;
      case 'remove-field': runCommand('removeField', { definitionId: record.id, id }, () => { render(); toast('Field removed from this draft.'); }); break;
      case 'protected-why': { const block = M.PROTECTED_BLOCKS.find(b => b.id === id); showDialog('Protected content', `<p>${esc(block ? `${block.label} · ${block.revision}` : 'Protected reference')} is owned by ${esc(block ? block.owner : 'its source owner')}.</p><p class="small">Ordinary field editing cannot change protected branding, terms or instructions. A change needs a separate proposal to the authorised owner and its own review.</p><div class="dialog-actions">${button('Close', 'close-dialog')}</div>`); break; }
      case 'change-dependency': runCommand('changeDependency', { definitionId: record.id }, () => { render(); toast('Successor asset referenced. Earlier validation evidence is now out of date.'); }); break;
      case 'run-validation': runCommand('validate', { definitionId: record.id, sampleId }, result => { render(); toast(`Scenario matrix executed: ${result.passed} passed, ${result.failed} failed, ${result.blocked} blocked.`); }); break;
      case 'configure-policy': runCommand('configurePolicy', { familyId: record.familyId }, () => { render(); toast('A fictional configured policy was selected for this preview.'); }); break;
      case 'submit-review': showDialog('Submit for review', `<p class="small muted">Submission freezes the exact definition, its dependency manifest and its validation evidence.</p>
<form data-action="do-submit"><div class="field"><label for="purpose">Review purpose</label><textarea id="purpose" name="purpose" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Submit exact definition</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'record-finding': showDialog('Record a finding', `<form data-action="do-finding" data-id="${esc(id)}">
<div class="field"><label for="location">Where</label><input id="location" name="location" value="Definition" required maxlength="120"></div>
<div class="field"><label for="message">Finding</label><textarea id="message" name="message" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Record finding</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'respond-finding': showDialog('Answer a finding', `<p class="small muted">An answer does not close a finding. The required reviewer records acceptance or requests correction.</p>
<form data-action="do-respond" data-id="${esc(id)}"><div class="field"><label for="response">Response</label><textarea id="response" name="response" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Save response</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'accept-finding': runCommand('acceptFinding', { findingId: id }, () => { render(); toast('Finding accepted by the reviewer.'); }); break;
      case 'publish': showDialog('Publish with a use assignment', publishForm(record)); break;
      case 'retire': showDialog('Withdraw from new use', `<p class="small muted">Retiring prevents new selection within this scope. It does not delete definitions, erase approvals, invalidate an issued acknowledgement or remove historical access.</p>
<form data-action="do-retire" data-id="${esc(id)}"><div class="field"><label for="retire-reason">Reason</label><textarea id="retire-reason" name="reason" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Withdraw</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'reconcile': runCommand('reconcile', { operationId: id }, result => { render(); toast(`Operation ${result.id} reconciled to one outcome with receipt ${result.receipt}.`); }); break;
      case 'handover': runCommand('handover', { definitionId: record.id }, () => { render(); toast('Template-selection handover prepared locally. No document was issued and no message was sent.'); }); break;
      case 'followup': showDialog('Prepare owned follow-up', `<form data-action="do-followup" data-id="${esc(id)}">
<div class="field"><label for="note">What must the receiving owner decide?</label><textarea id="note" name="note" required></textarea></div>
<div class="dialog-actions">${button('Cancel', 'close-dialog')}<button class="primary" type="submit">Prepare follow-up</button></div><p class="error" id="form-error" hidden></p></form>`); break;
      case 'reconstruct': {
        const historical = M.findDefinition(state, id);
        const chosen = M.samplesFor(historical.familyId).find(s => s.shape === 'complete');
        const render2 = P.renderDocument(historical, chosen, { answers: chosen.answers || {} });
        showDialog('Labelled reconstruction', `<div class="callout warning"><strong>This is a reconstruction, not the issued file.</strong> It was rendered now from the retained definition ${esc(historical.revision)} and the retained sample ${esc(chosen.id)}. The issued document keeps its own original bytes and hash.</div>
<div class="doc-frame">${render2.html}</div><p class="small muted">Reconstruction ${esc(S.short(render2.outputSha256))} · ${render2.outputBytes} bytes. This hash is of the reconstruction, not of any issued document.</p>
<div class="dialog-actions">${button('Close', 'close-dialog')}</div>`);
        break;
      }
      default: break;
    }
  });

  document.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target, action = form.dataset.action, id = form.dataset.id;
    const record = definition();
    const value = name => (form.elements[name] ? form.elements[name].value : '');
    switch (action) {
      case 'do-advance': runCommand('advanceClock', { hours: Number(value('hours')) }, () => { closeDialog(); render(); toast(`Demonstration time is now ${instant(state.clock)}.`); }, form); break;
      case 'do-successor': runCommand('successor', { fromDefinitionId: record.id, rationale: value('rationale') }, result => { closeDialog(); selectDefinition(result.id); render(); toast(`Successor ${result.revision} created. ${record.revision} is unchanged.`); }, form); break;
      case 'create-section':
      case 'save-section': {
        const condition = readCondition(form, 'cond');
        const payload = { definitionId: record.id, label: value('label'), purpose: value('purpose'), repeat: value('repeat') || null, condition };
        if (action === 'save-section') payload.id = id;
        runCommand(action === 'save-section' ? 'updateSection' : 'addSection', payload, () => { closeDialog(); render(); toast('Section saved to this draft.'); }, form);
        break;
      }
      case 'create-field':
      case 'save-field': {
        const options = value('options').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
          const [optionId, ...rest] = line.split('|');
          return { id: optionId.trim(), label: (rest.join('|') || optionId).trim() };
        });
        const payload = {
          definitionId: record.id, sectionId: form.dataset.section, label: value('label'), type: value('type'),
          help: value('help'), unit: value('unit') || null, binding: value('binding') || null,
          required: value('required'), visibility: readCondition(form, 'cond'), options: options.length ? options : null
        };
        if (action === 'save-field') payload.id = id;
        runCommand(action === 'save-field' ? 'updateField' : 'addField', payload, () => { closeDialog(); render(); toast('Field saved to this draft. Earlier validation evidence is now out of date.'); }, form);
        break;
      }
      case 'save-answers': {
        const answers = {};
        for (const element of form.elements) if (element.name && element.value !== '') answers[element.name] = element.type === 'number' || /^-?\d+(\.\d+)?$/.test(element.value) ? Number(element.value) : element.value;
        runCommand('saveAnswers', { definitionId: record.id, sampleId, answers }, () => { render(); toast('Sample answers saved to the fixture. No operational record was created.'); }, form);
        break;
      }
      case 'do-submit': runCommand('submit', { definitionId: record.id, purpose: value('purpose') }, result => { closeDialog(); go('review'); toast(`Submitted as ${result.id} against fingerprint ${S.short(result.fingerprint)}.`); }, form); break;
      case 'do-finding': runCommand('finding', { submissionId: id, location: value('location'), message: value('message') }, () => { closeDialog(); render(); toast('Finding recorded against the exact submission.'); }, form); break;
      case 'do-respond': runCommand('respond', { findingId: id, response: value('response') }, () => { closeDialog(); render(); toast('Response saved. The finding stays open until the reviewer disposes of it.'); }, form); break;
      case 'decide': runCommand('decide', { submissionId: id, outcome: value('outcome'), reason: value('reason') }, result => { render(); toast(`Decision recorded: ${result.state}.`); }, form); break;
      case 'do-publish': {
        const from = value('from') ? `${value('from')}T00:00:00+10:00` : '';
        const to = value('to') ? `${value('to')}T00:00:00+10:00` : null;
        runCommand('publish', { definitionId: record.id, scope: M.intendedScope(record), from, to, supersede: form.elements.supersede.checked },
          result => { closeDialog(); render(); toast(result.operation.outcome === 'completed' ? `Published under ${result.publication.id}, effective ${day(result.publication.from)}.` : `Publication result unknown. Reconcile operation ${result.operation.id} before publishing again.`); }, form);
        break;
      }
      case 'do-retire': runCommand('retire', { publicationId: id, reason: value('reason') }, () => { closeDialog(); render(); toast('Assignment withdrawn from new use. Historical evidence is preserved.'); }, form); break;
      case 'do-followup': runCommand('followup', { consumerId: id, note: value('note') }, () => { closeDialog(); render(); toast('Follow-up prepared. No consumer was upgraded and no output was regenerated.'); }, form); break;
      case 'probe': {
        probe = { company: value('company'), outputFamily: value('outputFamily'), purpose: value('purpose'), audience: value('audience'), locale: value('locale') };
        render();
        break;
      }
      default: break;
    }
  });

  document.addEventListener('input', event => { if (event.target.id === 'search') { search = event.target.value; render(); document.getElementById('search').focus(); } });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'role') { actor = target.value; focusFieldId = null; if (!permitted(familyId)) { const first = permittedFamilies()[0]; if (first) selectDefinition(M.definitionsFor(state, first.id)[0].id); } render(); }
    else if (target.id === 'filter') { filter = target.value; render(); }
    else if (target.id === 'sample') { sampleId = target.value; render(); }
    else if (target.id === 'mode') { previewMode = target.value; render(); }
  });

  document.querySelector('.tabs').addEventListener('keydown', event => {
    const index = VIEWS.findIndex(v => v[0] === view);
    const map = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: VIEWS.length - 1 };
    if (!(event.key in map)) return;
    event.preventDefault();
    const target = Math.max(0, Math.min(VIEWS.length - 1, map[event.key]));
    go(VIEWS[target][0]);
    document.getElementById(`tab-${VIEWS[target][0]}`).focus();
  });

  for (const modal of [$('dialog'), $('snapshot')]) modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  window.addEventListener('storage', event => {
    if (event.key === KEY && event.newValue !== savedRaw) {
      storageIssue = 'Saved work changed in another tab. Reload saved work before continuing; unsaved form entries are retained.';
      status();
    }
  });

  $('guide').addEventListener('click', guide);
  $('export').addEventListener('click', () => exportCopy());
  $('open-full').addEventListener('click', () => { $('snapshot').close(); go('definition'); });
  $('role').value = actor;

  selectDefinition(definitionId);
  render();
})();
