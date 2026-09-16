(function (root) {
  'use strict';
  const TODAY = '2026-09-16';
  const clone = value => JSON.parse(JSON.stringify(value));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const text = (value, label, min = 8) => { assert(typeof value === 'string' && value.trim().length >= min && value.length <= 2000, `${label}: enter ${min}–2,000 characters.`); return value.trim(); };
  const pick = (value, options, label) => { assert(options.includes(value), `Choose a valid ${label}.`); return value; };
  const date = value => { assert(/^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Enter a valid calendar date.'); return value; };
  const people = ['Alex Morgan', 'Casey Reed', 'Robin Ellis'];
  const roles = {
    coordinator: {name: 'Robin Ellis', title: 'Service coordinator', actions: ['readiness', 'sourceChange', 'action', 'handover']},
    technician: {name: 'Alex Morgan', title: 'Assigned technician', actions: ['acknowledge', 'draft', 'submit', 'correct', 'retest', 'incident', 'action']},
    reviewer: {name: 'Casey Reed', title: 'Assurance reviewer', actions: ['readiness', 'sourceChange', 'review', 'release', 'incidentReview', 'action', 'handover']},
    observer: {name: 'Jamie Walker', title: 'Read-only observer', actions: []}
  };
  const template = {
    id: 'SYN-PPO-TPL-000012', revision: 4, title: 'Fertigation inspection', source: 'Fictional design criteria · retained from Equipment r02',
    checks: [
      {id: 'pressure', title: 'Delivery pressure', unit: 'bar', min: 4, max: 5, kind: 'number', photo: true},
      {id: 'ec', title: 'Nutrient conductivity', unit: 'mS/cm', min: 1.8, max: 2.2, kind: 'number', photo: true},
      {id: 'visual', title: 'Visible condition', kind: 'choice', photo: false}
    ]
  };
  const instruments = [
    {id: 'SYN-PPO-INS-000009', title: 'Pressure instrument', revision: 2, calibration: 'SYN-CAL-009-r02', validUntil: '2026-12-31', units: ['bar'], source: 'Fictional instrument evidence'},
    {id: 'SYN-PPO-INS-000010', title: 'Conductivity instrument', revision: 1, calibration: 'SYN-CAL-010-r01', validUntil: '2026-12-31', units: ['mS/cm'], source: 'Fictional instrument evidence'},
    {id: 'SYN-PPO-INS-000008', title: 'Pressure instrument · expired', revision: 1, calibration: 'SYN-CAL-008-r01', validUntil: '2026-08-31', units: ['bar'], source: 'Expired fictional evidence'}
  ];
  function blankDraft(p, predecessor = null) {
    return {revision: p.submissions.length + 1, predecessor, reason: '', values: {}, evidence: [], notes: '', acknowledgements: null};
  }
  function base(id, n, title, organisation, siteId, site, areaId, area, assetName, assetUuid, work, owner) {
    return {id, ref: `SYN-QA-${String(n).padStart(4, '0')}`, title, organisation, siteId, site, areaId, area, assetId: `e0${n}`, assetName, assetUuid,
      assetRef: `SYN-PPO-AST-${String(100 + n).padStart(6, '0')}`, serial: n === 1 ? 'SYN-MF40-24017' : n === 5 ? 'SYN-VD-25005' : 'SYN-LC-23006',
      work, scopeRevision: 3, configurationRevision: 2, scope: n === 1 ? 'Fertigation unit 01 · inspection and pressure verification' : title,
      excluded: n === 1 ? 'OEM firmware clarification; crop-system operation; whole-project acceptance' : 'Unrelated equipment and whole-site acceptance',
      servedArea: n === 1 ? 'Glasshouse 02' : area, timezone: 'Australia/Melbourne', visit: '2026-09-16 · 08:00–11:00 AEST', due: n === 6 ? '2026-09-15' : TODAY,
      owner, reviewer: 'Casey Reed', technician: 'Alex Morgan', sourceVersion: 1, template: clone(template),
      readiness: [
        {id: 'access', title: 'Access and crop window', status: n === 1 ? 'Needs confirmation' : 'Confirmed', source: `SYN-SITE-${siteId}-ACCESS`, revision: 2, owner: 'Robin Ellis', reviewed: '2026-09-15', validUntil: '2026-09-16', detail: 'Confirm the planned visit against the site contact’s approved work-area window.', evidence: n === 1 ? '' : 'Fictional site confirmation for this exact visit and area.'},
        {id: 'biosecurity', title: 'Site entry and biosecurity', status: 'Confirmed', source: `SYN-SITE-${siteId}-ENTRY`, revision: 1, owner: 'Robin Ellis', reviewed: '2026-09-15', validUntil: '2026-09-16', detail: 'Apply the current site-approved entry, movement and clean-down instructions for this area.', evidence: 'Fictional visitor instructions; actual method remains with the site owner.'},
        {id: 'isolation', title: 'Shutdown and work-scope controls', status: 'Confirmed', source: `SYN-WORK-${n}-CONTROL`, revision: 3, owner: 'Casey Reed', reviewed: '2026-09-15', validUntil: '2026-09-16', detail: 'The approved work-scope reference identifies the shutdown boundary and responsible site contact.', evidence: 'Fictional controlled work reference; no equipment settings are changed here.'},
        {id: 'induction', title: 'Induction and assigned personnel', status: 'Confirmed', source: `SYN-INDUCTION-${siteId}`, revision: 1, owner: 'Robin Ellis', reviewed: '2026-09-15', validUntil: '2026-10-01', detail: 'The assigned technician has a reviewed fictional induction record for the selected site.', evidence: 'Fictional induction and assignment evidence.'},
        {id: 'tools', title: 'Required tools and instruments', status: 'Confirmed', source: `SYN-TOOLS-${n}`, revision: 1, owner: 'Casey Reed', reviewed: '2026-09-15', validUntil: '2026-09-30', detail: 'Select each reading’s actual instrument; eligibility and calibration are checked independently.', evidence: 'Fictional instrument list; a tools checklist does not verify calibration.'}
      ], submissions: [], reviews: [], defects: [], incidents: [], releases: [], actions: [], handovers: [], history: [], draft: null};
  }
  const binding = p => JSON.stringify({scope: p.scopeRevision, config: p.configurationRevision, source: p.sourceVersion, template: p.template, readiness: p.readiness});
  const latest = p => p.submissions.at(-1);
  const latestReview = (p, submissionId) => p.reviews.filter(r => r.submissionId === submissionId).at(-1);
  function readinessBlockers(p) { return p.readiness.filter(r => r.status !== 'Confirmed' || r.validUntil < TODAY); }
  function seed() {
    const p = base('qa-1', 1, 'Glasshouse 02 · fertigation assurance', 'Northbank Nursery', 's1', 'Propagation site', 'f2', 'Irrigation room', 'Fertigation unit 01', '11111111-1111-4111-8111-111111111101', 'SYN-PPO-WO-000241', 'Robin Ellis');
    p.actions.push({id: 'action-oem', title: 'Obtain OEM firmware clarification', owner: 'Casey Reed', due: '2026-09-18', status: 'Open', blocking: false, reason: 'Separate technical follow-up. Excluded from pressure-verification release.', source: 'Equipment r02 unresolved OEM obligation', scope: p.excluded});
    const q = base('qa-2', 5, 'Tunnel 06 · vent-drive inspection', 'Greenhaven Berries', 's3', 'Berry tunnels', 'f12', 'Tunnel 06', 'Vent drive 05', '11111111-1111-4111-8111-111111111105', 'SYN-PPO-WO-000245', 'Casey Reed');
    q.template = {id: 'SYN-PPO-TPL-000016', revision: 4, title: 'Ventilation inspection', source: template.source, checks: [{id: 'travel', title: 'Travel time', unit: 's', min: 20, max: 30, kind: 'number', photo: true}, {id: 'visual', title: 'Visible condition', kind: 'choice', photo: false}]};
    q.submissions.push({id: 'SYN-QA-SUB-000501', revision: 1, predecessor: null, binding: binding(q), at: '2026-09-15T00:30:00.000Z', actor: 'Alex Morgan', context: context(q), template: clone(q.template), readiness: clone(q.readiness), results: [{id: 'travel', title: 'Travel time', value: '25', unit: 's', result: 'Pass', evidence: [{id: 'seed-fixture', origin: 'fixture', name: 'Illustrative vent-drive evidence', caption: 'Fictional timing record', checks: ['travel']}], instrument: {id: 'SYN-PPO-INS-000011', revision: 1, calibration: 'SYN-TIMER-011-r01', validUntil: '2026-12-31', units: ['s']}}, {id: 'visual', title: 'Visible condition', value: 'Satisfactory', result: 'Pass', evidence: []}], notes: 'Fictional submitted inspection, awaiting Casey’s review.', outcome: 'Pass'});
    q.incidents.push({id: 'SYN-QA-EVT-000501', type: 'Near miss', summary: 'Visitor route conflicted with the proposed work area', details: 'Fictional demonstration record; no personal or medical details.', owner: 'Robin Ellis', due: '2026-09-15', blocking: true, restricted: false, status: 'Open', at: '2026-09-15T00:45:00.000Z', actor: 'Alex Morgan', context: context(q), response: 'Site contact asked to confirm the segregated visitor route.', evidence: 'SYN-SITE-s3-ENTRY r01', decisions: []});
    const r = base('qa-3', 6, 'Bay 03 · lighting verification', 'Cedar Vale Growers', 's4', 'Young plant facility', 'f13', 'Bay 03', 'Lighting circuit 06', '11111111-1111-4111-8111-111111111106', 'SYN-PPO-WO-000246', 'Robin Ellis');
    r.template = {id: 'SYN-PPO-TPL-000017', revision: 4, title: 'Lighting inspection', source: 'Engineering criteria requested', checks: [{id: 'current', title: 'Operating current', unit: 'A', min: null, max: null, kind: 'number', photo: true}, {id: 'visual', title: 'Visible condition', kind: 'choice', photo: false}]};
    r.actions.push({id: 'action-criteria', title: 'Obtain approved electrical test criteria', owner: 'Casey Reed', due: '2026-09-15', status: 'Open', blocking: true, reason: 'Limits and eligible instrument evidence are unavailable. Do not infer acceptance.', source: 'Engineering criteria request', scope: r.scope});
    [p, q, r].forEach(x => { x.draft = blankDraft(x); });
    q.draft = null;
    return {schema: 'ppo-assurance-r01/v1', version: 0, packages: [p, q, r], receipts: []};
  }
  function context(p) { return clone({packageId: p.id, work: p.work, scope: p.scope, scopeRevision: p.scopeRevision, assetId: p.assetId, assetUuid: p.assetUuid, assetRef: p.assetRef, configurationRevision: p.configurationRevision, organisation: p.organisation, siteId: p.siteId, site: p.site, areaId: p.areaId, area: p.area, servedArea: p.servedArea, timezone: p.timezone, visit: p.visit}); }
  function can(role, action) { return Boolean(roles[role]?.actions.includes(action)); }
  function assess(p, draft) {
    return p.template.checks.map(c => {
      const input = draft.values[c.id] || {}, evidence = draft.evidence.filter(e => e.checks.includes(c.id));
      const result = {id: c.id, title: c.title, value: input.value ?? '', unit: input.unit || c.unit || '', reason: input.reason || '', evidence: clone(evidence), criterion: clone(c), result: 'Unavailable'};
      if (input.notPerformed) { result.result = 'Not performed'; return result; }
      if (c.kind === 'choice') { result.result = input.value === 'Satisfactory' ? 'Pass' : input.value === 'Issue observed' ? 'Fail' : 'Unavailable'; return result; }
      const instrument = instruments.find(i => i.id === input.instrument); result.instrument = instrument ? clone(instrument) : null;
      if (c.min === null || c.max === null || !instrument || instrument.validUntil < TODAY || !instrument.units.includes(c.unit) || input.unit !== c.unit || input.value === '' || input.value === undefined || !Number.isFinite(Number(input.value))) return result;
      result.result = Number(input.value) >= c.min && Number(input.value) <= c.max ? 'Pass' : 'Fail';
      return result;
    });
  }
  function releaseBlockers(p) {
    const reasons = readinessBlockers(p).map(r => r.title + ': ' + (r.validUntil < TODAY ? 'source expired' : r.status));
    const submission = latest(p);
    if (!submission) reasons.push('No submitted inspection evidence');
    else {
      if (submission.binding !== binding(p)) reasons.push('Current source or scope differs from the submitted evidence');
      if (submission.results.some(r => r.result !== 'Pass')) reasons.push('Failed, unavailable or not-performed inspection checks');
      if (latestReview(p, submission.id)?.decision !== 'Accept evidence') reasons.push('Latest submission needs reviewer acceptance');
    }
    if (p.defects.some(d => d.status !== 'Closed')) reasons.push('Open defects require an accepted passing retest');
    if (p.incidents.some(i => i.status !== 'Closed' && i.blocking)) reasons.push('An incident holds this work scope');
    if (p.actions.some(a => a.status !== 'Closed' && a.blocking)) reasons.push('An owned action holds this work scope');
    return reasons;
  }
  function currentRelease(p) { const r = p.releases.at(-1); return r && r.binding === binding(p) && r.submissionId === latest(p)?.id && releaseBlockers(p).length === 0 ? r : null; }
  function status(p) { if (currentRelease(p)) return 'Scope released'; if (readinessBlockers(p).length) return 'Preparation blocked'; if (p.defects.some(d => d.status !== 'Closed')) return 'Correction required'; if (latest(p) && latestReview(p, latest(p).id)?.decision !== 'Accept evidence') return 'Awaiting review'; if (latest(p)) return releaseBlockers(p).length ? 'Release held' : 'Ready for release'; return 'Inspection due'; }
  function validateEvidence(e) {
    assert(e && typeof e.id === 'string' && typeof e.name === 'string' && Array.isArray(e.checks) && e.checks.length > 0, 'Evidence needs its identity and check links.');
    text(e.caption, 'Evidence caption', 4);
    pick(e.origin, ['fixture', 'upload'], 'evidence origin');
    if (e.origin === 'upload') {
      assert(['image/png', 'image/jpeg', 'image/webp'].includes(e.type) && e.bytes > 0 && e.bytes <= 2 * 1024 * 1024 && e.width > 0 && e.height > 0 && e.width * e.height <= 16000000, 'Use a valid PNG, JPEG or WebP, up to 2 MiB and 16 megapixels.');
      assert(typeof e.data === 'string' && e.data.startsWith(`data:${e.type};base64,`) && e.data.length < 3000000, 'Image data does not match its declared format.');
    }
  }
  function validate(s) {
    assert(s?.schema === 'ppo-assurance-r01/v1' && Number.isInteger(s.version) && s.version >= 0 && Array.isArray(s.packages) && s.packages.length === 3 && Array.isArray(s.receipts), 'The saved session is not a supported assurance workspace.');
    const ids = new Set();
    for (const p of s.packages) {
      assert(['qa-1','qa-2','qa-3'].includes(p.id) && !ids.has(p.id), 'Saved work identities are invalid.'); ids.add(p.id);
      assert(typeof p.title === 'string' && typeof p.work === 'string' && typeof p.assetUuid === 'string' && p.scopeRevision > 0 && p.sourceVersion > 0 && p.template?.checks?.length > 0 && Array.isArray(p.readiness), 'Saved scope is incomplete.');
      for (const k of ['submissions','reviews','defects','incidents','releases','actions','handovers','history']) assert(Array.isArray(p[k]), `Saved ${k} records are invalid.`);
      for (const r of p.readiness) { date(r.validUntil); text(r.title,'Readiness title',1); pick(r.status,['Confirmed','Needs confirmation'],'readiness state'); }
      if (p.draft) { assert(typeof p.draft.values === 'object' && Array.isArray(p.draft.evidence), 'Saved draft is invalid.'); p.draft.evidence.forEach(validateEvidence); }
      for (const sub of p.submissions) { assert(typeof sub.id === 'string' && typeof sub.binding === 'string' && Array.isArray(sub.results) && sub.context?.work === p.work, 'Saved submission context is invalid.'); sub.results.forEach(r => { pick(r.result,['Pass','Fail','Unavailable','Not performed'],'result'); r.evidence.forEach(validateEvidence); }); }
      for (const d of p.defects) { assert(Array.isArray(d.submissions) && Array.isArray(d.corrections) && ['Open','Correction recorded','Closed'].includes(d.status), 'Saved defect is invalid.'); date(d.due); }
      for (const i of p.incidents) { assert(Array.isArray(i.decisions) && typeof i.blocking === 'boolean' && typeof i.restricted === 'boolean', 'Saved incident is invalid.'); date(i.due); }
    }
    return s;
  }
  function command(state, cmd, role) {
    validate(state);
    assert(can(role, cmd.type), 'This preview role cannot perform that action.');
    assert(typeof cmd.op === 'string' && cmd.op.length >= 6, 'An operation identity is required.');
    const signature = JSON.stringify({type: cmd.type, packageId: cmd.packageId, payload: cmd.payload, role});
    const receipt = state.receipts.find(r => r.op === cmd.op);
    if (receipt) { assert(receipt.signature === signature, 'This operation identity already belongs to different content.'); return {state, recovered: true, receipt}; }
    assert(cmd.expectedVersion === state.version, 'This workspace changed. Reopen the form against the current version; your entered text is retained.');
    const next = clone(state), p = next.packages.find(x => x.id === cmd.packageId), x = cmd.payload || {}, actor = roles[role].name, at = cmd.at || new Date().toISOString();
    assert(p, 'Select a valid work package.');
    const uid = prefix => `${prefix}-${String(next.version + 1).padStart(6,'0')}`;
    let description = '', resultId = null;
    if (cmd.type === 'readiness') {
      const r = p.readiness.find(r => r.id === x.id); assert(r, 'Select the applicable requirement.');
      assert(x.confirm === true, 'Confirm the exact source, work area and visit.');
      r.evidence = text(x.evidence, 'Confirmation evidence'); r.reviewed = TODAY; r.validUntil = date(x.validUntil); assert(r.validUntil >= TODAY, 'The source validity must cover the demonstration date.'); r.status = 'Confirmed'; r.revision++; p.sourceVersion++; description = `Source confirmation recorded: ${r.title}`;
    } else if (cmd.type === 'sourceChange') {
      const r = p.readiness.find(r => r.id === 'access'); r.revision++; r.status = 'Needs confirmation'; r.evidence = text(x.reason, 'Changed-source reason'); p.sourceVersion++; description = 'Changed access source requires renewed review';
    } else if (cmd.type === 'acknowledge') {
      assert(p.draft, 'Start a successor inspection first.'); assert(readinessBlockers(p).length === 0, 'Resolve the current preparation blockers first.'); assert(x.confirm === true, 'Confirm equipment identity and the current source instructions.');
      p.draft.acknowledgements = {binding: binding(p), actor, at, context: context(p)}; description = 'Current equipment and preparation acknowledged';
    } else if (cmd.type === 'draft') {
      assert(p.draft, 'Submitted evidence is retained. Start a successor inspection to capture changes.');
      assert(x.values && typeof x.values === 'object' && Array.isArray(x.evidence), 'Draft content is incomplete.'); assert(x.evidence.length <= 4, 'Use at most four images per revision.'); x.evidence.forEach(validateEvidence);
      assert(x.evidence.every(e => e.checks.every(id => p.template.checks.some(c => c.id === id))), 'Evidence must refer to a check in the current procedure.');
      for (const c of p.template.checks) { const v=x.values[c.id] || {}; assert(typeof v.value === 'string' && v.value.length <= 100, 'Reading value is invalid.'); assert(typeof (v.reason || '') === 'string' && (v.reason || '').length <= 2000, 'Check note is too long.'); }
      p.draft.values = clone(x.values); p.draft.evidence = clone(x.evidence); p.draft.notes = typeof x.notes === 'string' ? x.notes.slice(0,2000) : ''; description = 'Inspection draft saved';
    } else if (cmd.type === 'submit') {
      assert(p.draft && x.confirm === true, 'Confirm the exact draft before submission.'); assert(readinessBlockers(p).length === 0, 'Resolve current preparation blockers first.'); assert(p.draft.acknowledgements?.binding === binding(p), 'Acknowledge the current equipment, scope and preparation sources.');
      const results = assess(p, p.draft);
      for (const c of p.template.checks) {
        const v = p.draft.values[c.id] || {}, r = results.find(r => r.id === c.id);
        if (v.notPerformed) { text(v.reason, `${c.title}: why not performed`); continue; }
        if (c.kind === 'number') { assert(v.value !== '' && Number.isFinite(Number(v.value)), `${c.title}: enter a finite reading or mark Not performed.`); assert(v.unit === c.unit, `${c.title}: use ${c.unit}; no automatic conversion.`); assert(r.evidence.length > 0, `${c.title}: add captioned evidence.`); }
        else { pick(v.value, ['Satisfactory','Issue observed'], c.title); if (v.value === 'Issue observed') { text(v.reason, 'Visible-condition finding'); assert(r.evidence.length > 0, 'Add evidence for the visible-condition finding.'); } }
        if (r.result === 'Unavailable') text(v.reason, `${c.title}: explain unavailable assessment`);
      }
      const submission = {id: uid('SYN-QA-SUB'), revision: p.draft.revision, predecessor: p.draft.predecessor, reason: p.draft.reason, at, actor, binding: binding(p), context: context(p), template: clone(p.template), readiness: clone(p.readiness), acknowledgements: clone(p.draft.acknowledgements), results, notes: p.draft.notes, outcome: results.every(r => r.result === 'Pass') ? 'Pass' : results.some(r => r.result === 'Fail') ? 'Fail' : 'Unavailable'};
      p.submissions.push(submission); resultId = submission.id;
      for (const r of results.filter(r => r.result !== 'Pass')) {
        let defect = p.defects.find(d => d.checkId === r.id && d.status !== 'Closed');
        if (!defect) { defect = {id: `${uid('SYN-QA-DEF')}-${r.id}`, checkId: r.id, title: r.title + ': ' + r.result.toLowerCase(), status: 'Open', owner: 'Alex Morgan', due: TODAY, submissions: [], corrections: [], context: context(p), closedBy: null}; p.defects.push(defect); }
        defect.submissions.push(submission.id); defect.status = 'Open';
      }
      p.draft = null; description = `Inspection r${submission.revision} submitted: ${submission.outcome}`;
    } else if (cmd.type === 'correct') {
      const d = p.defects.find(d => d.id === x.id); assert(d && d.status !== 'Closed', 'Choose an open defect.');
      d.corrections.push({id: uid('CORRECTION'), actor, at, note: text(x.note, 'Corrective work'), evidence: text(x.evidence, 'Correction evidence'), owner: pick(x.owner, people, 'owner'), due: date(x.due), context: context(p)}); d.owner = x.owner; d.due = x.due; d.status = 'Correction recorded'; description = `Correction recorded; retest required: ${d.title}`;
    } else if (cmd.type === 'retest') {
      assert(!p.draft && latest(p), 'Finish the current draft before starting a successor.'); assert(p.defects.filter(d => d.status !== 'Closed').every(d => d.status === 'Correction recorded'), 'Record corrective work for every open defect before starting the retest.');
      p.draft = blankDraft(p, latest(p).id); p.draft.reason = text(x.reason, 'Successor reason'); description = 'Successor inspection opened with fresh preparation and evidence';
    } else if (cmd.type === 'review') {
      const sub = latest(p); assert(sub && sub.id === x.submissionId, 'Review the latest exact submission.'); assert(!p.draft || !Object.keys(p.draft.values).length, 'A successor draft is in progress; submit it before reviewing for acceptance.');
      const decision = pick(x.decision, ['Accept evidence','Return for correction','Hold review','Request clarification'], 'review decision');
      if (decision === 'Accept evidence') { assert(sub.binding === binding(p), 'Source or scope changed; a fresh successor submission is required.'); assert(sub.results.every(r => r.result === 'Pass'), 'Only complete passing evidence can be accepted.'); }
      const review = {id: uid('REVIEW'), submissionId: sub.id, decision, reason: text(x.reason,'Review reason'), actor, at, owner: decision === 'Accept evidence' ? actor : pick(x.owner, people,'follow-up owner'), due: decision === 'Accept evidence' ? TODAY : date(x.due), context: clone(sub.context)}; p.reviews.push(review);
      if (decision === 'Accept evidence') p.defects.filter(d => d.status !== 'Closed' && sub.results.find(r => r.id === d.checkId)?.result === 'Pass').forEach(d => { d.status = 'Closed'; d.closedBy = {reviewId: review.id, submissionId: sub.id, actor, at}; });
      resultId = review.id; description = `${decision}: ${sub.id}`;
    } else if (cmd.type === 'incident') {
      const incident = {id: uid('SYN-QA-EVT'), type: pick(x.type,['Observation','Near miss','Incident'],'event type'), summary: text(x.summary,'Event summary'), details: text(x.details,'Factual details'), response: text(x.response,'Response recorded'), evidence: text(x.evidence,'Source evidence'), owner: pick(x.owner,people,'owner'), due: date(x.due), blocking: x.blocking === true, restricted: x.restricted === true, status: 'Open', at, actor, context: context(p), decisions: []};
      p.incidents.push(incident); resultId = incident.id; description = 'Incident / corrective-action record created';
    } else if (cmd.type === 'incidentReview') {
      const i = p.incidents.find(i => i.id === x.id); assert(i && i.status !== 'Closed','Choose an open event.');
      const decision = pick(x.decision,['Close with evidence','Keep open'],'incident outcome'); assert(x.confirm === true,'Confirm the correction and its exact work scope.');
      i.decisions.push({id: uid('EVENT-REVIEW'), actor, at, decision, reason: text(x.reason,'Review basis'), evidence: text(x.evidence,'Closure / follow-up evidence'), owner: pick(x.owner,people,'owner'), due: date(x.due)});
      i.owner = x.owner; i.due = x.due; if (decision === 'Close with evidence') i.status = 'Closed'; description = `Incident outcome recorded: ${decision}`;
    } else if (cmd.type === 'action') {
      const title = text(x.title,'Action title'); assert(!p.actions.some(a => a.status !== 'Closed' && a.title.toLowerCase() === title.toLowerCase()), 'That open action already exists for this scope.');
      p.actions.push({id: uid('ACTION'), title, owner: pick(x.owner,people,'owner'), due: date(x.due), status: 'Open', blocking: false, reason: text(x.reason,'Action reason'), source: 'Reviewed assurance follow-up', scope: p.scope}); description = 'Owned remaining action recorded';
    } else if (cmd.type === 'release') {
      assert(x.confirm === true, 'Confirm the exact release boundary.'); assert(!p.draft, 'A successor draft is still open.'); const blockers=releaseBlockers(p); assert(blockers.length===0,blockers.join(' · ')); assert(!currentRelease(p),'This exact scope already has a current release.');
      const release={id:uid('SYN-QA-REL'),at,actor,binding:binding(p),submissionId:latest(p).id,reviewId:latestReview(p,latest(p).id).id,context:context(p),excluded:p.excluded,reason:text(x.reason,'Release basis'),remaining:clone(p.actions.filter(a=>a.status!=='Closed'))}; p.releases.push(release);resultId=release.id;description='Selected scope released; exclusions and remaining actions retained';
    } else if (cmd.type === 'handover') {
      const release=currentRelease(p);assert(release,'A current scope release is required before preparing this handover.'); const target=pick(x.target,['Service Review','Project Readiness'],'receiving workspace');
      assert(!p.handovers.some(h=>h.releaseId===release.id&&h.target===target),'This release already has a handover prepared for that workspace.');
      p.handovers.push({id:uid('HANDOVER'),at,actor,target,releaseId:release.id,context:clone(release.context),status:'Prepared locally',note:text(x.note,'Receiving note'),remaining:clone(release.remaining)});description=`Handover prepared for ${target}`;
    }
    next.version++; const entry={id:uid('EVENT'),at,actor,type:cmd.type,description,context:context(p)};p.history.push(entry);
    const saved={op:cmd.op,signature,resultId,at,version:next.version};next.receipts.push(saved);validate(next);return {state:next,recovered:false,receipt:saved};
  }
  root.QA_MODEL = {TODAY, clone, roles, people, instruments, seed, can, context, binding, latest, latestReview, readinessBlockers, assess, releaseBlockers, currentRelease, status, validate, validateEvidence, command};
})(globalThis);
