import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import '../docs/design/template-management/schema.js';
import '../docs/design/template-management/preview.js';
import '../docs/design/template-management/validation.js';
import '../docs/design/template-management/model.js';

const S = globalThis.PPOTemplateSchema, P = globalThis.PPOTemplatePreview;
const V = globalThis.PPOTemplateValidation, M = globalThis.PPOTemplateManagement;
const groups = [];
const check = (name, fn) => { fn(); groups.push(name); };

let s = M.initial();
const run = (actor, action, payload) => { const r = M.command(s, actor, s.version, action, payload, s.clock); s = r.state; return r.result; };
const samples = family => M.samplesFor(family);
const report = () => M.findDefinition(s, 'DEF-REPORT-R02');
const sampleOf = (family, shape) => samples(family).find(x => x.shape === shape);

check('Seed catalogue, stored schema and seeded fingerprints are internally consistent', () => {
  assert.equal(M.FAMILIES.length, 8);
  assert.equal(s.definitions.length, 11);
  assert.equal(M.validState(s), true);
  for (const definition of s.definitions) assert.equal(S.fingerprint(definition), definition.fingerprint);
  assert.equal(Object.keys(M.SEED_FINGERPRINTS).length, 11);
});

check('Bundled SHA-256 matches node:crypto and canonical form is key-order independent', () => {
  for (const text of ['', 'abc', 'x'.repeat(1000), 'café · °C · m³/h'])
    assert.equal(S.sha256(text), crypto.createHash('sha256').update(text, 'utf8').digest('hex'));
  assert.equal(S.canonical({ b: 1, a: [2, { d: 4, c: 3 }] }), S.canonical({ a: [2, { c: 3, d: 4 }], b: 1 }));
  assert.notEqual(S.canonical({ a: [1, 2] }), S.canonical({ a: [2, 1] }));
});

check('DK06-T01 register projections are views over the same versioned records', () => {
  const published = s.definitions.filter(d => d.state === 'published');
  const retired = s.definitions.filter(d => d.state === 'retired');
  assert.ok(published.length >= 6);
  assert.equal(retired.length, 1);
  assert.equal(M.definitionsFor(s, 'FAM-REPORT').length, 2);
  assert.equal(M.ROLES.finance.families.join(), 'FAM-FINANCE');
  assert.equal(M.ROLES.readonly.can.length, 0);
});

let draft;
check('DK06-T02 a successor preserves the published definition bytes, dependencies and lineage', () => {
  const before = JSON.stringify(report());
  draft = run('author', 'successor', { fromDefinitionId: 'DEF-REPORT-R02', rationale: 'Make supplied remaining-work context easier to read.' });
  assert.equal(JSON.stringify(report()), before);
  assert.equal(draft.predecessorId, 'DEF-REPORT-R02');
  assert.equal(draft.state, 'draft');
  assert.equal(draft.runtimeVersion, null, 'A proposed revision must not claim a supported runtime version.');
  assert.notEqual(draft.id, report().id);
  assert.equal(draft.fingerprint, report().fingerprint, 'An unedited successor has identical content, so the content fingerprint is identical. Identity, revision label and state are separate from content.');
  assert.throws(() => M.command(s, 'author', s.version, 'successor', { fromDefinitionId: 'DEF-REPORT-R02', rationale: 'again' }), /already exists/);
  assert.throws(() => M.command(s, 'readonly', s.version, 'successor', { fromDefinitionId: 'DEF-REPORT-R02', rationale: 'x' }), /template author/);
});

check('DK06-T04 unsupported types, duplicate identities and unknown references are refused', () => {
  assert.throws(() => M.command(s, 'author', s.version, 'addField', { definitionId: draft.id, sectionId: 'SEC-IDENT', type: 'formula', label: 'Computed' }), /not supported/);
  assert.throws(() => M.command(s, 'author', s.version, 'addField', { definitionId: draft.id, id: 'FLD-REF', sectionId: 'SEC-IDENT', type: 'text', label: 'Duplicate' }), /already used/);
  assert.throws(() => M.command(s, 'author', s.version, 'addField', { definitionId: draft.id, sectionId: 'SEC-NOWHERE', type: 'text', label: 'Orphan' }), /section that exists/);
  assert.throws(() => M.command(s, 'author', s.version, 'addField', { definitionId: draft.id, sectionId: 'SEC-IDENT', type: 'protected', label: 'New protected block' }), /source owner/);
});

check('DK06-T13 protected branding and standing wording cannot be changed by ordinary editing', () => {
  assert.throws(() => M.command(s, 'author', s.version, 'updateField', { definitionId: draft.id, id: 'FLD-NOTE', label: 'Rewritten note' }), /read-only in ordinary editing/);
  assert.throws(() => M.command(s, 'author', s.version, 'removeField', { definitionId: draft.id, id: 'FLD-NOTE' }), /cannot be removed/);
  assert.equal(M.findDefinition(s, draft.id).protectedBlocks[0].revision, 'v4');
});

check('The conditional remaining-work panel binds existing source fields only', () => {
  run('author', 'addSection', { definitionId: draft.id, id: 'SEC-REMAINING', label: 'Remaining work', purpose: 'Work still to be done, where the record supplies it.', repeat: 'remainingWork', condition: { subject: { kind: 'source', path: 'remainingWork' }, operator: 'isPresent' } });
  run('author', 'addField', { definitionId: draft.id, id: 'FLD-RW-DESC', sectionId: 'SEC-REMAINING', type: 'bound', label: 'Remaining work', binding: 'remainingWork.description', required: 'source' });
  run('author', 'addField', { definitionId: draft.id, id: 'FLD-RW-OWNER', sectionId: 'SEC-REMAINING', type: 'bound', label: 'Owner', binding: 'remainingWork.owner' });
  run('author', 'addField', { definitionId: draft.id, id: 'FLD-RW-DATE', sectionId: 'SEC-REMAINING', type: 'bound', label: 'Date needed', binding: 'remainingWork.dateNeeded' });
  run('author', 'addField', { definitionId: draft.id, id: 'FLD-RW-PART', sectionId: 'SEC-REMAINING', type: 'bound', label: 'Part required', binding: 'remainingWork.partRequired' });
  assert.equal(S.validateDefinition(M.findDefinition(s, draft.id)).errors.length, 0);
});

check('DK06-T03 section reorder retains field identities, bindings and sequence integrity', () => {
  const before = M.findDefinition(s, draft.id).fields.map(f => `${f.id}:${f.binding}`).join('|');
  run('author', 'moveSection', { definitionId: draft.id, id: 'SEC-REMAINING', direction: 'up' });
  const after = M.findDefinition(s, draft.id);
  assert.equal(after.fields.map(f => `${f.id}:${f.binding}`).join('|'), before);
  assert.deepEqual(after.sections.map(x => x.sequence), after.sections.map((_, i) => i + 1));
  run('author', 'moveSection', { definitionId: draft.id, id: 'SEC-REMAINING', direction: 'down' });
  assert.throws(() => M.command(s, 'author', s.version, 'moveSection', { definitionId: draft.id, id: M.findDefinition(s, draft.id).sections[0].id, direction: 'up' }), /cannot move further/);
});

check('DK06-T08 type, unit and cardinality mismatches fail explicitly with the offending binding', () => {
  run('author', 'addField', { definitionId: draft.id, id: 'FLD-BAD-UNIT', sectionId: 'SEC-MEASURE', type: 'bound', label: 'Airflow', binding: 'measurement.airflow', unit: 'm/s' });
  let errors = S.validateDefinition(M.findDefinition(s, draft.id)).errors;
  assert.equal(errors.filter(e => e.code === 'unit-mismatch').length, 1);
  assert.match(errors.find(e => e.code === 'unit-mismatch').message, /No conversion is applied/);
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-BAD-UNIT', binding: 'equipment.hoursRun', unit: 'h' });
  errors = S.validateDefinition(M.findDefinition(s, draft.id)).errors;
  assert.equal(errors.filter(e => e.code === 'cardinality-mismatch').length, 1);
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-BAD-UNIT', binding: 'legacy.jobNote', unit: null, type: 'bound' });
  assert.equal(S.validateDefinition(M.findDefinition(s, draft.id)).errors.filter(e => e.code === 'binding-retired').length, 1);
  run('author', 'removeField', { definitionId: draft.id, id: 'FLD-BAD-UNIT' });
  assert.equal(S.validateDefinition(M.findDefinition(s, draft.id)).errors.length, 0);
});

check('DK06-T04 invalid references, self-reference, cycles and unsupported operators are refused', () => {
  const definitionId = draft.id;
  run('author', 'updateField', { definitionId, id: 'FLD-RW-OWNER', visibility: { subject: { kind: 'field', path: 'FLD-NOT-HERE' }, operator: 'isPresent' } });
  assert.equal(S.validateDefinition(M.findDefinition(s, definitionId)).errors.filter(e => e.code === 'reference-unknown').length, 1);
  run('author', 'updateField', { definitionId, id: 'FLD-RW-OWNER', visibility: { subject: { kind: 'field', path: 'FLD-RW-OWNER' }, operator: 'isPresent' } });
  const selfErrors = S.validateDefinition(M.findDefinition(s, definitionId)).errors.map(e => e.code);
  assert.ok(selfErrors.includes('self-reference') && selfErrors.includes('cycle'));
  run('author', 'updateField', { definitionId, id: 'FLD-RW-OWNER', visibility: { subject: { kind: 'source', path: 'remainingWork.owner' }, operator: 'containsRegex', value: '.*' } });
  assert.equal(S.validateDefinition(M.findDefinition(s, definitionId)).errors.filter(e => e.code === 'operator-unsupported').length, 1);
  run('author', 'updateField', { definitionId, id: 'FLD-RW-OWNER', visibility: null });
  assert.equal(S.validateDefinition(M.findDefinition(s, definitionId)).errors.length, 0);
});

check('DK06-T07 hiding a field removes neither the source obligation nor a disclosure control', () => {
  const definitionId = draft.id;
  assert.throws(() => M.command(s, 'author', s.version, 'addField', { definitionId, id: 'FLD-COST', sectionId: 'SEC-SUMMARY', type: 'bound', label: 'Internal labour cost', binding: 'internal.labourCost', unit: 'AUD', visibility: { subject: { kind: 'source', path: 'report.summary' }, operator: 'isAbsent' } }) && (() => { throw new Error('no throw'); })(), /no throw/);
  run('author', 'addField', { definitionId, id: 'FLD-COST', sectionId: 'SEC-SUMMARY', type: 'bound', label: 'Internal labour cost', binding: 'internal.labourCost', unit: 'AUD', visibility: { subject: { kind: 'source', path: 'report.summary' }, operator: 'isAbsent' } });
  const disclosure = S.validateDefinition(M.findDefinition(s, definitionId)).errors.find(e => e.code === 'disclosure');
  assert.ok(disclosure, 'A restricted binding on a customer definition must fail even when the field is conditionally hidden.');
  assert.match(disclosure.message, /hiding the field is not exclusion/i);
  run('author', 'removeField', { definitionId, id: 'FLD-COST' });
  run('author', 'removeField', { definitionId, id: 'FLD-SUMMARY' });
  const warning = S.validateDefinition(M.findDefinition(s, definitionId)).warnings.find(w => w.code === 'source-required-unbound');
  assert.match(warning.message, /Hiding it does not remove the source obligation/);
  run('author', 'addField', { definitionId, id: 'FLD-SUMMARY', sectionId: 'SEC-SUMMARY', type: 'bound', label: 'Work performed', binding: 'report.summary', required: 'source' });
  assert.equal(S.validateDefinition(M.findDefinition(s, definitionId)).warnings.filter(w => w.code === 'source-required-unbound').length, 0);
});

check('DK06-T06 conditions evaluate true, false and unknown, and unknown never hides required content', () => {
  const definition = M.findDefinition(s, draft.id);
  const present = P.renderDocument(definition, sampleOf('FAM-REPORT', 'complete'));
  const empty = P.renderDocument(definition, sampleOf('FAM-REPORT', 'zero-false-unknown'));
  const unknown = P.renderDocument(definition, sampleOf('FAM-REPORT', 'condition-unknown'));
  assert.match(present.html, /Remaining work/);
  assert.match(empty.html, /Not applicable for this record/);
  assert.equal(unknown.diagnostics.some(d => d.kind === 'condition' && d.result === 'unknown'), true);
  assert.equal(unknown.diagnostics.some(d => d.kind === 'blocker' && /controlling value is unknown/i.test(d.message)), true);
  assert.equal(S.evaluate({ subject: { kind: 'source', path: 'remainingWork' }, operator: 'isPresent' }, { source: { remainingWork: [] } }).result, 'false');
  assert.equal(S.evaluate({ subject: { kind: 'source', path: 'remainingWork' }, operator: 'isPresent' }, { source: {} }).result, 'unknown');
  assert.equal(S.evaluate({ operator: 'allOf', conditions: [{ subject: { kind: 'source', path: 'a' }, operator: 'isPresent' }, { subject: { kind: 'source', path: 'b' }, operator: 'isPresent' }] }, { source: { a: 1 } }).result, 'unknown');
  assert.equal(S.evaluate({ operator: 'anyOf', conditions: [{ subject: { kind: 'source', path: 'a' }, operator: 'isPresent' }, { subject: { kind: 'source', path: 'b' }, operator: 'isPresent' }] }, { source: { a: 1 } }).result, 'true');
});

check('DK06-T05 zero, false, unanswered, unknown and not applicable stay distinct', () => {
  const definition = M.findDefinition(s, draft.id);
  const zero = P.renderDocument(definition, sampleOf('FAM-REPORT', 'zero-false-unknown'));
  assert.match(zero.html, /tone-value">0 h</);
  assert.match(zero.html, /tone-value">0 °C</);
  assert.match(zero.html, />No</);
  assert.match(zero.html, /tone-unknown">Unknown</);
  assert.match(zero.html, /Not applicable for this record/);
  const survey = M.findDefinition(s, 'DEF-SURVEY-R02');
  const findings = P.validateAnswers(survey, sampleOf('FAM-SURVEY', 'complete'), { 'FLD-SV-ACCESS': 'gate-code', 'FLD-SV-IRRIGATION': 'no' });
  assert.match(findings.find(f => f.fieldId === 'FLD-SV-AREA').message, /Unanswered is not No, and not zero/);
  assert.equal(P.validateAnswers(survey, sampleOf('FAM-SURVEY', 'complete'), { 'FLD-SV-ACCESS': 'gate-code', 'FLD-SV-IRRIGATION': 'no', 'FLD-SV-AREA': 0 }).length, 0);
});

check('DK06-T11 long content and 0, 1 and many repeating groups preserve item identity', () => {
  const definition = M.findDefinition(s, draft.id);
  const none = P.renderDocument(definition, sampleOf('FAM-REPORT', 'repeat-none'));
  const many = P.renderDocument(definition, sampleOf('FAM-REPORT', 'repeat-many'));
  const longContent = P.renderDocument(definition, sampleOf('FAM-REPORT', 'long-content'));
  assert.match(none.html, /None recorded for this visit/);
  const ids = [...many.html.matchAll(/doc-item-id">([^<]+)</g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.filter(id => id.startsWith('SYN-EQ')).length, 5);
  assert.ok(longContent.outputBytes > many.outputBytes / 2);
  assert.equal(longContent.html.includes('<script'), false);
});

check('DK06-T12 and T31 restricted sources are removed before rendering and text cannot execute', () => {
  const definition = M.findDefinition(s, draft.id);
  const restricted = P.renderDocument(definition, sampleOf('FAM-REPORT', 'restricted'));
  assert.equal(restricted.html.includes('1840.5'), false);
  assert.equal(restricted.html.includes('revisit chargeable'), false);
  assert.equal(restricted.html.includes('Dana Cole'), false);
  assert.equal(restricted.excluded.length, 3);
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-RW-OWNER', label: 'Owner <img src=x onerror=alert(1)>' });
  const escaped = P.renderDocument(M.findDefinition(s, draft.id), sampleOf('FAM-REPORT', 'complete'));
  assert.equal(escaped.html.includes('<img'), false);
  assert.match(escaped.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-RW-OWNER', label: 'Owner' });
});

let first;
check('DK06-T09 preview uses the exact definition and sample and produces verifiable local bytes', () => {
  const definition = M.findDefinition(s, draft.id);
  const chosen = sampleOf('FAM-REPORT', 'complete');
  const render = P.renderDocument(definition, chosen);
  assert.equal(render.outputSha256, crypto.createHash('sha256').update(render.html, 'utf8').digest('hex'));
  assert.equal(render.outputBytes, Buffer.byteLength(render.html, 'utf8'));
  assert.equal(render.sampleId, chosen.id);
  assert.match(render.html, new RegExp(S.short(definition.fingerprint)));
  first = run('author', 'validate', { definitionId: draft.id });
  assert.equal(first.failed, 0);
  assert.equal(first.blocked, 0);
  assert.equal(first.notRun, 0);
  assert.equal(V.complete(first), true);
});

check('DK06-T10 any relevant definition, dependency, sample or suite change makes evidence out of date', () => {
  const definition = M.findDefinition(s, draft.id);
  assert.equal(V.currency(first, definition, samples('FAM-REPORT')).state, 'current');
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-RW-DATE', help: 'Retain the supplied date; never invent one.' });
  const after = M.findDefinition(s, draft.id);
  assert.equal(V.currency(first, after, samples('FAM-REPORT')).state, 'out of date');
  assert.equal(V.currency(first, { ...definition, audience: 'internal' }, samples('FAM-REPORT')).state, 'out of date');
  assert.equal(V.currency(first, { ...definition, profile: 'form-capture-r1' }, samples('FAM-REPORT')).state, 'out of date');
  assert.equal(V.currency(first, { ...definition, schemaVersion: 4 }, samples('FAM-REPORT')).state, 'out of date');
  assert.equal(V.currency(null, definition, samples('FAM-REPORT')).state, 'not run');
});

check('DK06-T15 submission requires a configured policy, a clean definition and current evidence', () => {
  assert.throws(() => M.command(s, 'author', s.version, 'submit', { definitionId: draft.id, purpose: 'Conditional summary.' }), /Current validation evidence is required/);
  run('author', 'validate', { definitionId: draft.id });
  assert.throws(() => M.command(s, 'author', s.version, 'submit', { definitionId: draft.id, purpose: '' }), /review purpose/);
  assert.throws(() => M.command(s, 'author', s.version, 'submit', { definitionId: 'DEF-HANDOVER-R02', purpose: 'x' }), /Only an editable draft/);
});

let submission;
check('DK06-T14 a submission freezes the exact snapshot and an answer alone does not close a finding', () => {
  submission = run('author', 'submit', { definitionId: draft.id, purpose: 'Add a conditional remaining-work summary using existing source fields.' });
  assert.equal(submission.fingerprint, M.findDefinition(s, draft.id).fingerprint);
  assert.equal(M.findDefinition(s, draft.id).state, 'submitted');
  assert.throws(() => M.command(s, 'author', s.version, 'updateField', { definitionId: draft.id, id: 'FLD-RW-OWNER', label: 'x' }), /read-only/);
  assert.throws(() => M.command(s, 'author', s.version, 'finding', { submissionId: submission.id, message: 'x' }), /domain template reviewer/);
  const finding = run('reviewer', 'finding', { submissionId: submission.id, location: 'Owner', message: 'An absent owner must stay absent rather than be attributed to the coordinator.' });
  assert.throws(() => M.command(s, 'reviewer', s.version, 'decide', { submissionId: submission.id, outcome: 'approved', reason: 'Looks fine' }), /finding is still open/);
  run('author', 'respond', { findingId: finding.id, response: 'Owner is bound read-only to the source; a missing owner shows an explicit missing state.' });
  assert.equal(M.findingsFor(s, submission.id)[0].state, 'open');
  assert.throws(() => M.command(s, 'reviewer', s.version, 'decide', { submissionId: submission.id, outcome: 'approved', reason: 'Answered' }), /finding is still open/);
  run('reviewer', 'decide', { submissionId: submission.id, outcome: 'returned', reason: 'Confirm the missing-owner treatment before approval.' });
  assert.equal(M.findDefinition(s, draft.id).state, 'returned');
  assert.throws(() => M.command(s, 'reviewer', s.version, 'decide', { submissionId: submission.id, outcome: 'approved', reason: 'again' }), /already has a recorded decision/);
});

let approval;
check('DK06-T15 changed content cannot inherit an earlier approval and self-review is held', () => {
  run('author', 'correct', { definitionId: draft.id });
  run('reviewer', 'acceptFinding', { findingId: M.findingsFor(s, submission.id)[0].id });
  run('author', 'updateField', { definitionId: draft.id, id: 'FLD-RW-OWNER', help: 'Supplied by the source record; absent stays absent.' });
  run('author', 'validate', { definitionId: draft.id });
  approval = run('author', 'submit', { definitionId: draft.id, purpose: 'Corrected submission; earlier findings and decisions retained.' });
  assert.notEqual(approval.fingerprint, submission.fingerprint);
  assert.equal(M.submissionsFor(s, draft.id).length, 2);
  assert.equal(M.findingsFor(s, submission.id).length, 1);
  run('reviewer', 'decide', { submissionId: approval.id, outcome: 'approved', reason: 'Bindings, conditions, units and audience treatment checked against the exact snapshot.' });
  assert.equal(M.findDefinition(s, draft.id).state, 'approved');

  let t = M.initial();
  const dual = (action, payload) => { const r = M.command(t, 'dual', t.version, action, payload, t.clock); t = r.state; return r.result; };
  const own = dual('successor', { fromDefinitionId: 'DEF-SURVEY-R02', rationale: 'Add a conditional controller question.' });
  dual('addField', { definitionId: own.id, id: 'FLD-SV-CTRL', sectionId: 'SEC-SV-ACCESS', type: 'text', label: 'Existing controller make and model', visibility: { subject: { kind: 'field', path: 'FLD-SV-IRRIGATION' }, operator: 'equals', value: 'yes' } });
  dual('validate', { definitionId: own.id });
  const ownSubmission = dual('submit', { definitionId: own.id, purpose: 'Conditional controller question.' });
  assert.throws(() => M.command(t, 'dual', t.version, 'finding', { submissionId: ownSubmission.id, message: 'x' }), /Independent review is required/);
  assert.throws(() => M.command(t, 'dual', t.version, 'decide', { submissionId: ownSubmission.id, outcome: 'approved', reason: 'ok' }), /forbids self-review/);
});

check('Policy not configured holds review and publication until a policy is selected', () => {
  let t = M.initial();
  assert.equal(t.policies['FAM-HANDOVER'], null);
  const held = M.publishChecks(t, 'DEF-HANDOVER-R02', null, t.clock, null);
  assert.equal(held.find(c => c.label === 'Review policy configured').ok, false);
  assert.throws(() => M.command(t, 'publisher', t.version, 'publish', { definitionId: 'DEF-HANDOVER-R02', scope: M.intendedScope(M.findDefinition(t, 'DEF-HANDOVER-R02')), from: t.clock }), /Policy not configured/);
  assert.throws(() => M.command(t, 'author', t.version, 'configurePolicy', { familyId: 'FAM-HANDOVER' }), /template publisher/);
  t = M.command(t, 'publisher', t.version, 'configurePolicy', { familyId: 'FAM-HANDOVER' }, t.clock).state;
  assert.equal(t.policies['FAM-HANDOVER'].id, 'SYN-POL-HANDOVER-01');
  assert.equal(M.publishChecks(t, 'DEF-HANDOVER-R02', null, t.clock, null).find(c => c.label === 'Review policy configured').ok, true);
  assert.equal(M.publishChecks(t, 'DEF-HANDOVER-R02', null, t.clock, null).find(c => c.label === 'Supported rendering profile and source schema').ok, false);
});

check('DK06-T26 an unsupported profile or unknown schema is an explicit blocker, not an empty success', () => {
  const finance = M.findDefinition(s, 'DEF-FINANCE-R02');
  const errors = S.validateDefinition(finance).errors.map(e => e.code);
  assert.ok(errors.includes('profile-unsupported'));
  const financeRun = V.runAll(finance, samples('FAM-FINANCE'), { now: s.clock, applicability: M.applicabilityEvidence(s, finance, s.clock), dependency: M.dependencyEvidence(s, finance) });
  assert.ok(financeRun.blocked >= 1);
  assert.equal(financeRun.results.find(r => r.id === 'SC-01').outcome, 'blocked');
  assert.equal(V.complete(financeRun), false);
  const handover = M.findDefinition(s, 'DEF-HANDOVER-R02');
  assert.ok(S.validateDefinition(handover).errors.some(e => e.code === 'schema-unknown'));
  assert.equal(M.impact(s, 'DEF-REPORT-R02').complete, false);
  assert.match(M.impact(s, 'DEF-REPORT-R02').sources.find(x => !x.complete).reason, /not evidence of zero usage/);
});

check('DK06-T17 and T18 no match, missing context and ambiguity are refusals, not silent choices', () => {
  const scope = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-10', purpose: 'customer-report', audience: 'customer', locale: 'en-AU' };
  assert.equal(M.resolve(s, scope, s.clock).definition.id, 'DEF-REPORT-R02');
  assert.equal(M.resolve(s, { ...scope, company: 'RTF-AU-DEMO' }, s.clock).outcome, 'no-match');
  assert.equal(M.resolve(s, { ...scope, audience: 'internal' }, s.clock).outcome, 'no-match');
  assert.deepEqual(M.resolve(s, { ...scope, locale: '' }, s.clock).missing, ['locale']);
  const ambiguous = M.resolve(s, { company: 'PPO-AU-DEMO', outputFamily: 'OUT-06', purpose: 'customer-quotation', audience: 'customer', locale: 'en-AU' }, s.clock);
  assert.equal(ambiguous.outcome, 'ambiguous');
  assert.equal(ambiguous.candidates.length, 2);
  assert.match(ambiguous.detail, /No precedence rule is configured/);
  assert.equal(M.resolve(s, { company: 'PPO-AU-DEMO', outputFamily: 'OUT-13', purpose: 'staged-handover', audience: 'customer', locale: 'en-AU' }, s.clock).outcome, 'no-match');
});

check('DK06-T16 approved, published, future effective and eligible now are distinct', () => {
  const transmittal = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-08', purpose: 'technical-transmittal', audience: 'internal', locale: 'en-AU' };
  const before = M.resolve(s, transmittal, s.clock);
  assert.equal(before.outcome, 'no-match');
  assert.match(before.detail, /later effective instant/);
  const later = new Date(new Date(s.clock).getTime() + 20 * 86400000).toISOString();
  assert.equal(M.resolve(s, transmittal, later).outcome, 'eligible');
  const publication = s.publications.find(p => p.id === 'PUB-TRANSMITTAL-R02');
  assert.equal(M.eligibilityState(s, publication, s.clock), 'Future effective');
  assert.equal(M.eligibilityState(s, publication, later), 'Eligible now');
  assert.equal(M.findDefinition(s, draft.id).state, 'approved');
  assert.equal(M.resolve(s, { company: 'PPO-AU-DEMO', outputFamily: 'OUT-10', purpose: 'customer-report', audience: 'customer', locale: 'en-AU' }, later).definition.id, 'DEF-REPORT-R02');
});

check('Publication refuses an unconfirmed succession and an unresolved overlap', () => {
  const scope = M.intendedScope(M.findDefinition(s, draft.id));
  const from = '2026-09-24T00:00:00+10:00';
  assert.throws(() => M.command(s, 'publisher', s.version, 'publish', { definitionId: draft.id, scope, from, to: null }), /Confirm that succession explicitly/);
  assert.throws(() => M.command(s, 'publisher', s.version, 'publish', { definitionId: draft.id, scope, from, to: '2026-09-20T00:00:00+10:00', supersede: true }), /end instant must be after/);
  assert.throws(() => M.command(s, 'publisher', s.version, 'publish', { definitionId: draft.id, scope, from: '', supersede: true }), /explicit effective instant/);
  assert.throws(() => M.command(s, 'author', s.version, 'publish', { definitionId: draft.id, scope, from, supersede: true }), /template publisher/);
});

let operation;
check('DK06-T19 a lost publication response reconciles to one operation and one assignment', () => {
  const scope = M.intendedScope(M.findDefinition(s, draft.id));
  const from = '2026-09-24T00:00:00+10:00';
  run('publisher', 'failNextPublish', {});
  const outcome = run('publisher', 'publish', { definitionId: draft.id, scope, from, to: null, supersede: true });
  operation = outcome.operation;
  assert.equal(operation.outcome, 'unknown');
  assert.equal(operation.receipt, null);
  assert.equal(outcome.publication.state, 'pending-unknown');
  assert.equal(M.findDefinition(s, draft.id).state, 'approved', 'An unknown outcome must not be recorded as published.');
  assert.equal(M.resolve(s, scope, '2026-09-30T00:00:00+10:00').definition.id, 'DEF-REPORT-R02');
  assert.throws(() => M.command(s, 'publisher', s.version, 'publish', { definitionId: draft.id, scope, from, supersede: true }), /unknown outcome/);
  run('publisher', 'reconcile', { operationId: operation.id });
  assert.equal(s.operations.filter(o => o.kind === 'publish').length, 1);
  assert.equal(s.publications.filter(p => p.definitionId === draft.id).length, 1);
  assert.equal(s.operations[0].receipt.startsWith('RCPT-'), true);
  assert.throws(() => M.command(s, 'publisher', s.version, 'reconcile', { operationId: operation.id }), /already has a single known outcome/);
  assert.equal(M.findDefinition(s, draft.id).state, 'published');
  assert.equal(M.resolve(s, scope, '2026-09-30T00:00:00+10:00').definition.id, draft.id);
  assert.equal(s.publications.find(p => p.id === 'PUB-REPORT-R02').to, from);
  assert.equal(M.resolve(s, scope, s.clock).definition.id, 'DEF-REPORT-R02');
});

check('DK06-T20 a stale expected version refuses the save and preserves the earlier state', () => {
  const before = JSON.stringify(s);
  assert.throws(() => M.command(s, 'author', s.version - 1, 'successor', { fromDefinitionId: 'DEF-REPORT-R02', rationale: 'stale' }), /changed since the form was opened/);
  assert.equal(JSON.stringify(s), before);
});

check('DK06-T22 and T21 issued bytes, template identity, acknowledgement and reserved work are preserved', () => {
  const issued = M.CONSUMERS.find(c => c.id === 'USE-04');
  assert.equal(issued.definitionId, 'DEF-REPORT-R01');
  assert.equal(issued.sha256, '7c2b9e1a04d5f38c6b7a2e91c4d0f5a8b3e6c1d9074a2f5b8c3e6d1a9f4b7c20');
  assert.equal(issued.bytes, 41288);
  assert.match(issued.acknowledgement, /Acknowledged by Robin Hale/);
  assert.equal(M.findDefinition(s, 'DEF-REPORT-R01').fingerprint, M.SEED_FINGERPRINTS['DEF-REPORT-R01']);
  const impact = M.impact(s, draft.id);
  const reserved = impact.consumers.find(c => c.kind === 'reserved');
  assert.match(reserved.treatment, /Revalidate the original template, policy and source at finalisation/);
  assert.match(impact.consumers.find(c => c.kind === 'generated').treatment, /Do not swap the template inside the stored bundle/);
  assert.match(impact.consumers.find(c => c.kind === 'issued').treatment, /original exact template/);
  assert.equal(impact.consumers.filter(c => c.definitionId !== 'DEF-REPORT-R02').length, 0);
});

check('DK06-T23 old form responses keep their original labels and units; a unit change is incompatible', () => {
  let t = M.initial();
  const next = M.command(t, 'author', t.version, 'successor', { fromDefinitionId: 'DEF-SURVEY-R02', rationale: 'Change the measured area unit and reword a label.' }, t.clock);
  t = next.state;
  t = M.command(t, 'author', t.version, 'updateField', { definitionId: next.result.id, id: 'FLD-SV-AREA', unit: 'ft²' }, t.clock).state;
  t = M.command(t, 'author', t.version, 'updateField', { definitionId: next.result.id, id: 'FLD-SV-NOTES', label: 'Surveyor observations' }, t.clock).state;
  t = M.command(t, 'author', t.version, 'removeField', { definitionId: next.result.id, id: 'FLD-SV-POWER' }, t.clock).state;
  const successor = M.findDefinition(t, next.result.id);
  const response = M.CONSUMERS.find(c => c.id === 'USE-07');
  const rows = P.compareResponse(response, successor);
  assert.equal(rows.find(r => r.fieldId === 'FLD-SV-AREA').effect, 'incompatible');
  assert.equal(rows.find(r => r.fieldId === 'FLD-SV-IRRIGATION').effect, 'compatible');
  assert.equal(response.fieldMeta['FLD-SV-AREA'].unit, 'm²');
  const differences = M.compare(M.findDefinition(t, 'DEF-SURVEY-R02'), successor);
  assert.equal(differences.meaning.length, 1);
  assert.equal(differences.labelOnly.length, 1);
  assert.equal(differences.removed.length, 1);
});

check('DK06-T24 a shared dependency successor exposes affected families and invalidates evidence', () => {
  let t = M.initial();
  const created = M.command(t, 'author', t.version, 'successor', { fromDefinitionId: 'DEF-REPORT-R02', rationale: 'Adopt the successor branding asset.' }, t.clock);
  t = created.state;
  t = M.command(t, 'author', t.version, 'validate', { definitionId: created.result.id }, t.clock).state;
  const before = M.latestRun(t, created.result.id);
  t = M.command(t, 'author', t.version, 'changeDependency', { definitionId: created.result.id }, t.clock).state;
  const changed = M.findDefinition(t, created.result.id);
  assert.equal(V.currency(before, changed, samples('FAM-REPORT')).state, 'out of date');
  const affected = M.impact(t, changed.id).sharedFamilies.map(f => f.familyId);
  assert.ok(affected.includes('FAM-PACK') && affected.includes('FAM-FINANCE'));
  assert.equal(M.findDefinition(t, 'DEF-PACK-R03').dependencies.find(d => d.path === M.SUCCESSOR_LOGO.path).sha256, '8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694');
  assert.match(M.dependencyEvidence(t, changed).detail, /out of date until re-run/);
});

check('DK06-T25 withdrawal prevents new use for the scope and preserves history', () => {
  const scope = M.intendedScope(M.findDefinition(s, draft.id));
  const publication = s.publications.find(p => p.definitionId === draft.id);
  assert.throws(() => M.command(s, 'author', s.version, 'retire', { publicationId: publication.id, reason: 'x' }), /template publisher/);
  assert.throws(() => M.command(s, 'publisher', s.version, 'retire', { publicationId: publication.id, reason: '' }), /Record why/);
  run('publisher', 'retire', { publicationId: publication.id, reason: 'Held pending a technical review of the follow-up wording.' });
  assert.equal(M.resolve(s, scope, '2026-09-30T00:00:00+10:00').outcome, 'no-match');
  assert.equal(M.findDefinition(s, draft.id).state, 'retired');
  assert.equal(s.submissions.filter(x => x.definitionId === draft.id).length, 2);
  assert.equal(s.operations.length, 1);
  assert.equal(M.findDefinition(s, 'DEF-REPORT-R01').fingerprint, M.SEED_FINGERPRINTS['DEF-REPORT-R01']);
  assert.equal(M.CONSUMERS.find(c => c.id === 'USE-04').acknowledgement.length > 0, true);
});

check('Coordinator handovers and follow-up tasks are prepared exactly once and issue nothing', () => {
  assert.throws(() => M.command(s, 'author', s.version, 'handover', { definitionId: draft.id }), /document coordinator/);
  const task = run('coordinator', 'handover', { definitionId: draft.id });
  assert.match(task.detail, /no document is issued and no message is sent/);
  assert.throws(() => M.command(s, 'coordinator', s.version, 'handover', { definitionId: draft.id }), /already prepared/);
  run('coordinator', 'followup', { consumerId: 'USE-02', note: 'Decide whether to re-prepare the reserved render against the successor.' });
  assert.throws(() => M.command(s, 'coordinator', s.version, 'followup', { consumerId: 'USE-02', note: 'again' }), /already prepared/);
  assert.equal(s.tasks.length, 2);
});

check('DK06-T27 malformed stored state, tampered seeds and altered fingerprints are rejected', () => {
  assert.equal(M.validState(s), true);
  assert.equal(M.validState({ schema: 1, version: 0, definitions: [], publications: [], submissions: [], findings: [], operations: [], runs: [], tasks: [], events: [], answers: {}, clock: 'not-a-date' }), false);
  assert.equal(M.validState({ ...M.clone(s), schema: 2 }), false);
  const tampered = M.clone(s);
  tampered.definitions.find(d => d.id === 'DEF-REPORT-R01').sections[0].label = 'Rewritten';
  assert.equal(M.validState(tampered), false);
  const relabelled = M.clone(s);
  relabelled.definitions.find(d => d.id === 'DEF-REPORT-R01').fingerprint = 'x'.repeat(64);
  assert.equal(M.validState(relabelled), false);
  const badOperation = M.clone(s);
  badOperation.operations[0].outcome = 'maybe';
  assert.equal(M.validState(badOperation), false);
  const badEvent = M.clone(s);
  badEvent.events.push({ id: 'EV-X', at: 'never', actor: 'author', type: 'edit', detail: 'x' });
  assert.equal(M.validState(badEvent), false);
});

check('Demonstration clock is an explicit local control with validated input', () => {
  const before = s.clock;
  assert.throws(() => M.command(s, 'author', s.version, 'advanceClock', { hours: 0 }), /positive number of hours/);
  assert.throws(() => M.command(s, 'author', s.version, 'advanceClock', { hours: 'soon' }), /positive number of hours/);
  run('author', 'advanceClock', { hours: 24 });
  assert.equal(new Date(s.clock).getTime() - new Date(before).getTime(), 86400000);
  assert.equal(M.validState(s), true);
});

check('Unsupported actions are refused and every recorded event keeps its actor and time', () => {
  assert.throws(() => M.command(s, 'author', s.version, 'deployToRuntime', {}), /not supported/);
  assert.ok(s.events.length > 20);
  for (const event of s.events) { assert.ok(event.at && !Number.isNaN(new Date(event.at).getTime())); assert.ok(event.actor); }
});

console.log(JSON.stringify({ passed: groups.length, groups }, null, 2));
