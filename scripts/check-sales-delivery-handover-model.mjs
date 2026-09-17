/* Deterministic model checks for the CR-03 Sales-to-Delivery Handover design.
   No browser and no DOM: these exercise the rules, guards and evidence only. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
await import('../docs/design/sales-delivery-handover/model.js');

const M = globalThis.HANDOVER_MODEL;
const results = [];
let state = M.seed();
let sequence = 0;
const H = (id) => state.handovers.find((h) => h.id === id);
const cmd = (type, payload, role, id, options) => {
  const command = {op: (options && options.op) || 'check-operation-' + (++sequence), type, payload,
    handoverId: id, expectedVersion: options && 'expectedVersion' in options ? options.expectedVersion : state.version};
  const result = M.command(state, command, role);
  state = result.state;
  return {command, result};
};
const refuse = (type, payload, role, id, pattern, options) => {
  const before = JSON.stringify(state);
  assert.throws(() => M.command(state, {op: 'refused-' + (++sequence), type, payload, handoverId: id,
    expectedVersion: options && 'expectedVersion' in options ? options.expectedVersion : state.version}, role), pattern);
  assert.equal(JSON.stringify(state), before, 'A refused command must change nothing');
};
const check = (name, fn) => { fn(); results.push({name, result: 'Passed'}); };

check('The seeded register reproduces the exact accepted Riverbend basis', () => {
  M.validate(state);
  const h = H('ho-1');
  assert.equal(h.commercial.quotation.ref, 'SYN-PPO-QUO-000142');
  assert.equal(h.commercial.quotation.revision, 2);
  assert.equal(h.commercial.quotation.documentHash, '7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a');
  assert.deepEqual(h.commercial.totals, {exGstCents: 15456667, gstCents: 1545667, inclGstCents: 17002334});
  assert.equal(M.money(h.commercial.totals.exGstCents), '$154,566.67');
  assert.equal(M.money(h.commercial.totals.gstCents), '$15,456.67');
  assert.equal(M.money(h.commercial.totals.inclGstCents), '$170,023.34');
  assert.equal(h.commercial.totals.exGstCents + h.commercial.totals.gstCents, h.commercial.totals.inclGstCents);
});

check('Every seeded handover reports a known state, destination and conversion outcome', () => {
  assert.deepEqual(state.handovers.map((h) => M.status(h)), [
    'Awaiting receiving review', 'Awaiting receiving review', 'Accepted — follow-through outstanding',
    'Awaiting preparation', 'Awaiting receiving review',
  ]);
  assert.deepEqual(state.handovers.map((h) => h.conversion.status), [
    'Confirmed', 'Confirmed', 'Confirmed', 'Not prepared', 'Partially confirmed',
  ]);
  for (const h of state.handovers) assert.ok(M.CONVERSION_STATES.includes(h.conversion.status));
});

check('A fully allocated destination carries the accepted discount; a partial one does not', () => {
  assert.equal(M.fullyAllocated(H('ho-1')), true);
  assert.equal(M.allocatedTotal(H('ho-1')), H('ho-1').commercial.totals.exGstCents);
  assert.equal(M.fullyAllocated(H('ho-4')), false);
  assert.equal(M.allocatedTotal(H('ho-4')), 0);
  assert.equal(H('ho-4').destination.allocation.unallocated.length, 2);
});

check('A Won opportunity with no bound acceptance cannot be prepared into a submission', () => {
  const gaps = M.informationGaps(H('ho-4'));
  assert.ok(gaps.some((g) => /acceptance evidence is missing/.test(g.text)));
  assert.ok(gaps.some((g) => /Routing decision required/.test(g.text)));
  assert.equal(H('ho-4').opportunity.handoverDue.status, 'Due');
  cmd('prepare', {note: 'Attempting a handover for a quotation with no customer response.'}, 'sales', 'ho-4');
  refuse('submit', {confirm: true, requiredResponseBy: '2026-09-21'}, 'sales', 'ho-4', /acceptance evidence is missing/);
  refuse('route', {type: 'Project', basis: 'Choosing a destination without an approved source.'}, 'sales', 'ho-4', /No approved source routes/);
});

check('Roles and receiving scope are enforced atomically', () => {
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'A sending owner attempting a receiving decision on their own handover.', confirm: true}, 'sales', 'ho-1', /receiving owner/);
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'A Service owner attempting a decision on a Project handover.', confirm: true}, 'service', 'ho-1', /routed to Project/);
  refuse('prepare', {note: 'A read-only viewer attempting to prepare a revision.'}, 'viewer', 'ho-1', /sending owner/);
  refuse('obligation', {id: 'OBL-030003-01', evidence: 'A viewer attempting to complete an obligation.'}, 'viewer', 'ho-3', /receiving owner/);
});

check('A stale expected version is refused without changing anything', () => {
  refuse('prepare', {note: 'A stale editor submitting against an out-of-date version.'}, 'sales', 'ho-1', /changed while you were working/, {expectedVersion: state.version - 1});
});

check('A return must identify what is missing, who responds and by when', () => {
  refuse('review', {rev: 'r01', decision: 'Return for clarification', reason: 'Returning without naming anything specific at all.', confirm: true, findings: []}, 'project', 'ho-1', /identify exactly what is missing/);
  refuse('review', {rev: 'r01', decision: 'Return for clarification', reason: 'Returning with a finding that has no owner or date.', confirm: true,
    findings: [{detail: 'The wiring schedule is not attached.', owner: '', due: '2026-09-18'}]}, 'project', 'ho-1', /detail and a responding owner/);
  refuse('review', {rev: 'r01', decision: 'Return for clarification', reason: 'Returning with a response date in the past.', confirm: true,
    findings: [{detail: 'The wiring schedule is not attached.', owner: 'Priya Raman', due: '2026-09-01'}]}, 'project', 'ho-1', /site calendar/);
  refuse('review', {rev: 'r01', decision: 'Return for clarification', reason: 'Returning with an impossible calendar date.', confirm: true,
    findings: [{detail: 'The wiring schedule is not attached.', owner: 'Priya Raman', due: '2026-02-30'}]}, 'project', 'ho-1', /site calendar/);
});

check('Responsibility cannot be accepted while acceptance evidence is outstanding', () => {
  const blockers = M.acceptanceBlockers(H('ho-1'));
  assert.ok(blockers.length >= 2);
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'Attempting to accept while acceptance evidence is still outstanding.', confirm: true}, 'project', 'ho-1', /cannot be accepted/);
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'Attempting to accept without an explicit confirmation.', confirm: false}, 'project', 'ho-1', /Confirm this decision/);
});

const originalSubmission = JSON.stringify(H('ho-1').revisions[0]);
check('A return preserves the submitted revision unchanged', () => {
  cmd('review', {rev: 'r01', decision: 'Return for clarification', confirm: true,
    reason: 'The technical brief and field wiring schedule are not attached at their issued revisions and the customer pump compatibility responsibility carries no evidence.',
    findings: [
      {requirement: 'req-brief', detail: 'Attach the control strategy brief and the field wiring schedule at their issued revisions.', owner: 'Priya Raman', due: '2026-09-18'},
      {requirement: 'req-customer', detail: 'Supply the pump compatibility confirmation or record it as an outstanding customer responsibility.', owner: 'Priya Raman', due: '2026-09-18'},
    ]}, 'project', 'ho-1');
  const h = H('ho-1');
  assert.equal(M.status(h), 'Returned for clarification');
  assert.equal(h.revisions[0].state, 'Returned');
  assert.equal(JSON.parse(originalSubmission).payload.commercial.quotation, h.revisions[0].payload.commercial.quotation);
  assert.deepEqual(JSON.parse(originalSubmission).payload, h.revisions[0].payload);
  assert.equal(h.reviews[0].findings.length, 2);
  assert.equal(h.reviews[0].responseOwner, 'Priya Raman');
});

check('A missing supporting document needs an exact revision and source, not a tick', () => {
  refuse('attach', {ref: 'SYN-PPO-DWG-000142', revision: 'draft', source: 'Engineering & Design Control drawing register.'}, 'sales', 'ho-1', /exact issued revision/);
  refuse('attach', {ref: 'SYN-PPO-DWG-000142', revision: 'r01', source: 'Eng'}, 'sales', 'ho-1', /owning workspace/);
  refuse('attach', {ref: 'SYN-PPO-QUO-000142', revision: 'r01', source: 'Attempting to re-record an available document.'}, 'sales', 'ho-1', /Only a missing supporting document/);
  cmd('attach', {ref: 'SYN-PPO-DWG-000142', revision: 'r01', source: 'Engineering & Design Control, issued drawing register.'}, 'sales', 'ho-1');
  const d = H('ho-1').commercial.documents.find((x) => x.ref === 'SYN-PPO-DWG-000142');
  assert.equal(d.state, 'Available');
  assert.equal(d.revision, 'r01');
  assert.match(d.suppliedFrom, /issued drawing register/);
});

check('Requirement outcomes retain their earlier finding and need a reason when not applicable', () => {
  refuse('requirement', {id: 'req-brief', status: 'Not applicable', finding: 'Recording a not-applicable outcome with no reason.', reason: ''}, 'project', 'ho-1', /needs its reason/);
  refuse('requirement', {id: 'req-brief', status: 'Reviewed', finding: 'Recording an outcome that is not in the vocabulary.'}, 'project', 'ho-1', /recorded requirement outcome/);
  cmd('requirement', {id: 'req-brief', status: 'Received — reviewed', sourceRef: 'SYN-PPO-BRF-000142 r02',
    finding: 'Technical brief r02 and the wiring schedule r01 were inspected against their issued revisions.'}, 'project', 'ho-1');
  cmd('requirement', {id: 'req-customer', status: 'Received — reviewed',
    finding: 'Pump compatibility is recorded as an outstanding customer responsibility with a named owner and date.'}, 'project', 'ho-1');
  const r = H('ho-1').requirements.find((x) => x.id === 'req-brief');
  assert.equal(r.status, 'Received — reviewed');
  assert.equal(r.history.length, 1);
  assert.equal(r.history[0].status, 'Not received');
  assert.equal(M.acceptanceBlockers(H('ho-1')).filter((b) => /Acceptance evidence outstanding/.test(b)).length, 0);
});

check('Correction creates a successor revision and a readable comparison', () => {
  cmd('prepare', {note: 'Attached the wiring schedule and answered both returned findings.'}, 'sales', 'ho-1');
  cmd('submit', {confirm: true, requiredResponseBy: '2026-09-21'}, 'sales', 'ho-1');
  const h = H('ho-1');
  assert.equal(h.revisions.length, 2);
  assert.equal(h.revisions[0].state, 'Returned');
  assert.equal(h.revisions[1].state, 'Submitted');
  assert.equal(h.revisions[1].respondsTo, h.reviews[0].id);
  const changed = M.changedFields(h, 'r01', 'r02');
  assert.ok(changed.length >= 3, 'The comparison must show the corrected fields');
  assert.ok(changed.some((c) => /documents/.test(c.field) && /Missing/.test(c.from) && /Available/.test(c.to)));
  assert.ok(changed.some((c) => /requirements/.test(c.field) && /Not received/.test(c.from)));
  assert.equal(M.compare(h, 'r01', 'r02').filter((c) => c.change === 'same').length > 0, true);
});

check('Acceptance binds the exact revision and does not clear release prerequisites', () => {
  const before = M.releasePrerequisites(H('ho-1')).length;
  assert.ok(before >= 3);
  cmd('review', {rev: 'r02', decision: 'Accept with outstanding obligations', confirm: true,
    reason: 'The corrected revision carries the reviewed technical brief and the named customer responsibility. Responsibility for the reviewed Project scope is accepted.',
    obligations: [{title: 'Obtain the customer pump compatibility confirmation', owner: 'Priya Raman', due: '2026-09-22'}]}, 'project', 'ho-1');
  const h = H('ho-1');
  const accepted = M.acceptance(h);
  assert.equal(accepted.rev, 'r02');
  assert.equal(accepted.revisionFingerprint, h.revisions[1].fingerprint);
  assert.equal(accepted.boundSources.quotation, 'SYN-PPO-QUO-000142 R02');
  assert.equal(accepted.boundSources.documentHash, '7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a');
  assert.equal(accepted.boundSources.conversion, 'SYN-PPO-COP-0001 · Confirmed');
  assert.equal(accepted.releaseAtAcceptance.length, before + 1, 'The obligation named at acceptance joins the release prerequisites');
  assert.ok(accepted.releaseAtAcceptance.includes('Obtain the customer pump compatibility confirmation'));
  assert.equal(h.obligations.length, 1);
  assert.equal(M.status(h), 'Accepted — follow-through outstanding');
  assert.equal(JSON.stringify(h.revisions[0].payload), JSON.stringify(JSON.parse(originalSubmission).payload));
});

check('An accepted handover cannot be accepted twice and rejects a new decision without a submission', () => {
  refuse('review', {rev: 'r02', decision: 'Accept responsibility', reason: 'Attempting a second acceptance of the same revision.', confirm: true}, 'project', 'ho-1', /No submitted revision/);
});

check('A later source change requires renewed acceptance and keeps the original decision', () => {
  const before = JSON.stringify(H('ho-1').reviews);
  cmd('sourceChange', {kind: 'quotation'}, 'sales', 'ho-1');
  const h = H('ho-1');
  assert.equal(JSON.stringify(h.reviews), before, 'A source change must not rewrite a recorded decision');
  assert.equal(h.commercial.quotation.revision, 3);
  assert.equal(h.commercial.acceptance.state, 'Superseded');
  assert.equal(M.status(h), 'Renewed acceptance required');
  assert.notEqual(M.acceptance(h).fingerprint, M.fingerprint(h));
  assert.equal(M.acceptance(h).boundSources.quotation, 'SYN-PPO-QUO-000142 R02');
});

check('A bound source that changes during review invalidates the submitted revision', () => {
  cmd('sourceChange', {kind: 'technical'}, 'sales', 'ho-2');
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'Attempting to accept after a bound source advanced during the review.', confirm: true}, 'fulfilment', 'ho-2', /changed while this revision was under review/);
  assert.ok(M.acceptanceBlockers(H('ho-2')).some((b) => /no longer matches its source/.test(b)));
});

check('An unresolved conversion blocks fulfilment acceptance and names ES-07', () => {
  const blockers = M.acceptanceBlockers(H('ho-5'));
  assert.ok(blockers.some((b) => /Partially confirmed/.test(b) && /CR3-RULE-01, hypothetical/.test(b)));
  refuse('review', {rev: 'r01', decision: 'Accept responsibility', reason: 'Attempting acceptance while one target outcome is unknown and one is a confirmed no-effect.', confirm: true}, 'fulfilment', 'ho-5', /cannot be accepted/);
  const targets = H('ho-5').conversion.targets.map((t) => t.status);
  assert.deepEqual(targets, ['Confirmed', 'Confirmed', 'OutcomeUnknown', 'FailedNoEffect']);
});

check('An unavailable receiving record blocks acceptance and is stated, not hidden', () => {
  cmd('sourceChange', {kind: 'destination', reason: 'The proposed receiving project was closed in its owning workspace.'}, 'sales', 'ho-1');
  assert.equal(H('ho-1').destination.available, false);
  assert.ok(M.acceptanceBlockers(H('ho-1')).some((b) => /receiving record is unavailable/.test(b)));
});

check('An original operation replays once and never surfaces under another identity or handover', () => {
  const op = 'lost-response-operation';
  const first = cmd('action', {title: 'Reconcile the unknown transducer target in ES-07', owner: 'Jordan · Conversion coordinator', due: '2026-09-21'}, 'fulfilment', 'ho-5', {op});
  assert.equal(first.result.recovered, false);
  const replay = M.command(state, {op, type: 'action', payload: first.command.payload, handoverId: 'ho-5', expectedVersion: -99}, 'fulfilment');
  assert.equal(replay.recovered, true);
  assert.equal(replay.state, state, 'A replay must return the original state, not a second effect');
  assert.equal(H('ho-5').actions.length, 1);
  assert.throws(() => M.command(state, {op, type: 'action', payload: {title: 'Different content under the same operation identity', owner: 'Sam Whitcombe', due: '2026-09-21'}, handoverId: 'ho-5', expectedVersion: state.version}, 'fulfilment'), /different content/);
  assert.throws(() => M.command(state, {op, type: 'action', payload: first.command.payload, handoverId: 'ho-2', expectedVersion: state.version}, 'fulfilment'), /another handover/);
  assert.throws(() => M.command(state, {op, type: 'action', payload: first.command.payload, handoverId: 'ho-5', expectedVersion: state.version}, 'project'), /another identity/);
});

check('One obligation is one record and cannot be duplicated or completed twice', () => {
  refuse('action', {title: 'Reconcile the unknown transducer target in ES-07', owner: 'Sam Whitcombe', due: '2026-09-21'}, 'fulfilment', 'ho-5', /already exists/);
  cmd('obligation', {id: 'OBL-030003-01', evidence: 'The site owner confirmed the segregated visitor route for the exact work area.'}, 'service', 'ho-3');
  refuse('obligation', {id: 'OBL-030003-01', evidence: 'Attempting to complete an obligation that is already closed.'}, 'service', 'ho-3', /open obligation/);
  const h = H('ho-3');
  assert.equal(h.obligations[0].status, 'Closed');
  assert.equal(h.obligations[1].status, 'Open');
  assert.equal(M.status(h), 'Accepted — follow-through outstanding');
  assert.ok(M.releasePrerequisites(h).length >= 2, 'Acceptance never clears a release prerequisite');
});

check('A receiving link is prepared once and creates no second record', () => {
  cmd('link', {target: 'Service', note: 'Review the accepted vent drive scope and the outstanding site prerequisite.'}, 'service', 'ho-3');
  refuse('link', {target: 'Service', note: 'Attempting to prepare the same receiving link twice.'}, 'service', 'ho-3', /already been prepared/);
  assert.equal(H('ho-3').links.length, 1);
  assert.equal(H('ho-3').links[0].state, 'Prepared locally');
  refuse('link', {target: 'Project', note: 'Attempting a receiving link before responsibility is accepted.'}, 'fulfilment', 'ho-5', /after responsibility is accepted/);
});

check('Withdrawal preserves the submission and records no responsibility', () => {
  cmd('withdraw', {reason: 'Withdrawn while the accepted source is corrected in the quotation lifecycle.'}, 'sales', 'ho-5');
  const h = H('ho-5');
  assert.equal(h.revisions[0].state, 'Withdrawn');
  assert.match(h.revisions[0].withdrawnReason, /quotation lifecycle/);
  assert.equal(h.reviews.length, 0);
  assert.equal(M.status(h), 'Awaiting preparation');
});

check('The nine-event responsibility chain is never collapsed', () => {
  const chain = M.chain(H('ho-3'));
  assert.equal(chain.length, 9);
  assert.deepEqual(chain.map((c) => c.n), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(chain[5].state, 'outside');
  assert.equal(chain[6].state, 'outside');
  assert.equal(chain[8].state, 'outside');
  const cedar = M.chain(H('ho-4'));
  assert.equal(cedar[0].state, 'blocked', 'Missing customer acceptance must show as not recorded');
  assert.equal(cedar[1].state, 'done', 'Won is recorded even when acceptance evidence is missing');
});

check('A serialised session validates and round-trips exactly', () => {
  const restored = M.validate(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.throws(() => M.validate({schema: 'something-else'}), /not a supported/);
  const broken = M.clone(state);
  broken.handovers[0].reviews[0].revisionFingerprint = 'tampered';
  assert.throws(() => M.validate(broken), /bound to the exact revision/);
  const doubled = M.clone(state);
  doubled.handovers[1].revisions.push({...doubled.handovers[1].revisions[0], rev: 'r02', state: 'Submitted'});
  doubled.handovers[1].revisions[0].state = 'Submitted';
  assert.throws(() => M.validate(doubled), /Only one revision can await review/);
  const misallocated = M.clone(state);
  misallocated.handovers[1].destination.allocation.lineIds.push('L9');
  assert.throws(() => M.validate(misallocated), /outside the accepted basis/);
});

check('Money and dates use Australian conventions', () => {
  assert.equal(M.money(17002334), '$170,023.34');
  assert.equal(M.pretty('2026-09-16'), '16 September 2026');
  assert.equal(M.isDate('2026-02-30'), false);
  assert.equal(M.isDate('2026-09-16'), true);
});

const html = await fs.readFile(new URL('../docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html', import.meta.url));
console.log(JSON.stringify({
  html_sha256: createHash('sha256').update(html).digest('hex'),
  groups: results.length, results,
}, null, 2));
