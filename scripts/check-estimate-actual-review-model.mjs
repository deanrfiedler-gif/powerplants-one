import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
await import('../docs/design/estimate-actual-review/model.js');
const M = globalThis.EAR_MODEL, results = [];
let state = M.seed(), sequence = 0;
const r = () => M.review(state, 'ear-1');
const money = v => M.money(v);
const command = (type, payload = {}, role = 'preparer', reviewId = 'ear-1', op = null) =>
  ({cmd: {op: op || `check-operation-${++sequence}`, type, payload, reviewId, expectedVersion: state.version, at: '2026-09-16T01:00:00.000Z'}, role});
const run = (type, payload = {}, role = 'preparer', reviewId = 'ear-1') => {
  const c = command(type, payload, role, reviewId);
  const result = M.command(state, c.cmd, c.role);
  state = result.state;
  return result;
};
const refuse = (type, payload, pattern, role = 'preparer', reviewId = 'ear-1') => {
  const before = JSON.stringify(state), c = command(type, payload, role, reviewId);
  assert.throws(() => M.command(state, c.cmd, c.role), pattern);
  assert.equal(JSON.stringify(state), before);
};
const check = (name, fn) => { fn(); results.push({name, result: 'Passed'}); };

const declareBasis = () => run('selectBasis', {includeChanges: ['var-1'], acknowledgedMissingCost: ['var-2'],
  note: 'Accepted cost version r04 plus approved variation SYN-PPO-VAR-024101. SYN-PPO-VAR-024102 has no recorded cost basis.'}, 'preparer');
const disposeShared = () => run('treat', {id: 'o10', treatment: 'Unresolved', reason: 'Shared between two projects with no adopted allocation basis. Held until a basis is decided.'}, 'preparer');
const disposeUnmapped = () => run('treat', {id: 'o9', treatment: 'Excluded', reason: 'No comparison line exists for this item and its attribution to this scope is not established.'}, 'preparer');

check('Seeded register carries five reviews across four customers with distinct states', () => {
  M.validate(state);
  assert.equal(state.reviews.length, 5);
  assert.equal(new Set(state.reviews.map(x => x.customerId)).size, 4);
  assert.deepEqual(state.reviews.map(x => x.state), ['Draft', 'Reviewed', 'ReadyForReview', 'AwaitingEvidence', 'AwaitingEvidence']);
  assert.equal(r().lines.length, 7);
  assert.equal(r().observations.length, 13);
});

check('Issued, accepted and approved-change bases stay separate records', () => {
  const b = r().bases;
  assert.equal(b.issued.id, 'EV-r03');
  assert.equal(b.accepted.id, 'EV-r04');
  assert.equal(b.issued.lines.length, 5);
  assert.equal(b.accepted.lines.length, 4);
  assert.equal(r().approvedChanges.length, 2);
  assert.equal(r().approvedChanges[0].costBasisRecorded, true);
  assert.equal(r().approvedChanges[1].costBasisRecorded, false);
  assert.equal(money(M.basisTotals(r()).issued), '50424.00');
  assert.equal(money(M.basisTotals(r()).accepted), '46804.80');
});

check('An approved change with no cost basis cannot be added to the comparison basis', () => {
  refuse('selectBasis', {includeChanges: ['var-2'], acknowledgedMissingCost: [], note: 'Attempt to price a variation from its selling price.'}, /no recorded cost basis/);
  declareBasis();
  const b = M.basisTotals(r());
  assert.equal(money(b.changeCost), '4534.40');
  assert.equal(money(b.comparison), '51339.20');
  assert.deepEqual(b.missingCostChanges, ['SYN-PPO-VAR-024102']);
});

check('Declaring a basis never rewrites the issued or accepted originals', () => {
  assert.equal(money(M.basisTotals(r()).issued), '50424.00');
  assert.equal(r().bases.issued.versionRef, 'SYN-PPO-EST-000042 · cost version r03');
  assert.equal(r().bases.accepted.lines.length, 4);
});

check('Quantity classes are preserved and a store return reduces consumption on the same source', () => {
  const issue = M.obsOf(r(), 'o1'), ret = M.obsOf(r(), 'o2');
  assert.equal(issue.quantityClass, 'Issued');
  assert.equal(ret.quantityClass, 'Returned');
  const actual = M.lineActual(r(), 'l1');
  assert.equal(M.quantity(actual.qty), '2510');
  assert.equal(money(actual.cost), '22464.50');
  assert.equal(money(actual.rate), '8.95');
});

check('A commitment, customer billing and unreviewed capture can never be included as actual cost', () => {
  refuse('treat', {id: 'o11', treatment: 'Included', reason: 'Attempt to treat an open purchase order as incurred cost.'}, /commitment is not an incurred cost/);
  refuse('treat', {id: 'o12', treatment: 'Included', reason: 'Attempt to treat a customer progress invoice as a job cost.'}, /not job costs/);
  refuse('treat', {id: 'o2', treatment: 'Included', reason: 'x'}, /Treatment reason/);
  refuse('treat', {id: 'o2', treatment: 'Included', reason: 'Attempt to include captured field hours before Service review completes.'}, /not reviewed quantities/, 'preparer', 'ear-5');
});

check('Variance uses actual minus estimated and every percentage states an established denominator', () => {
  const c = M.lineComparison(r(), 'l1');
  assert.equal(money(c.estCost), '20428.80');
  assert.equal(money(c.actual.cost), '22464.50');
  assert.equal(money(c.costVariance), '2035.70');
  assert.equal(c.percent, 9.96);
  const access = M.lineComparison(r(), 'l7');
  assert.equal(access.estCost, null);
  assert.equal(money(access.actual.cost), '1960.00');
  assert.equal(access.costVariance, null);
  assert.equal(access.percent, null);
  assert.match(access.percentReason, /not established on both sides/);
  assert.equal(access.comparable, 'Actual only — no estimated cost basis');
});

check('Quantity, rate and joint effects reconcile exactly to every line variance', () => {
  r().lines.forEach(l => {
    const c = M.lineComparison(r(), l.id);
    if (!c.decomposition) return;
    const d = c.decomposition;
    assert.equal(d.quantityEffect + d.rateEffect + d.jointEffect + d.residual, c.costVariance, `${l.code} decomposition does not reconcile`);
    assert.equal(d.reconciles, true);
  });
  const cloth = M.lineComparison(r(), 'l1').decomposition;
  assert.equal(money(cloth.quantityEffect), '655.20');
  assert.equal(money(cloth.rateEffect), '1337.60');
  assert.equal(money(cloth.jointEffect), '42.90');
  assert.equal(cloth.residual, 0);
});

check('The three comparisons satisfy the recorded identity', () => {
  const t = M.totals(r()), id = M.identity(r());
  assert.equal(money(t.estimated), '51339.20');
  assert.equal(money(t.actual), '60933.54');
  assert.equal(money(t.deliveryVariance), '9594.34');
  assert.equal(t.deliveryPercent, 18.69);
  assert.equal(money(t.scopeMovement), '-3619.20');
  assert.equal(money(t.approvedChangeCost), '4534.40');
  assert.equal(money(t.totalAgainstIssued), '10509.54');
  assert.equal(id.available, true);
  assert.equal(id.reconciles, true);
  assert.equal(id.sum, id.total);
});

check('Negotiated price movement stays out of the cost comparison', () => {
  const c = M.commercialTotals(r());
  assert.equal(money(c.issued), '78400.00');
  assert.equal(money(c.accepted), '70280.00');
  assert.equal(money(c.negotiationMovement), '-8120.00');
  assert.equal(money(c.changes), '9250.00');
  assert.equal(c.components.length, 2);
  assert.equal(money(c.components[1].amount), '-4500.00');
  assert.equal(c.marginAvailable, false);
  assert.match(c.marginReason, /D-017/);
  assert.notEqual(money(M.totals(r()).scopeMovement), money(c.components[0].amount));
});

check('Actual with no estimated basis and commitments are reported outside the variance', () => {
  const t = M.totals(r());
  assert.equal(money(t.actualWithoutBasis), '1960.00');
  assert.equal(money(t.commitmentTotal), '3700.00');
  assert.equal(t.unmapped.length, 0);
  assert.equal(money(t.outstandingTotal), '8192.20');
});

check('Submission is blocked until every source is dispositioned', () => {
  const blockers = M.submitBlockers(r());
  assert.equal(blockers.length, 2);
  assert(blockers.every(b => /no recorded treatment/.test(b)));
  refuse('submit', {reason: 'Attempt to submit with undispositioned sources.'}, /no recorded treatment/);
});

check('A shared cost cannot be split equally without a recorded basis and reason', () => {
  run('treat', {id: 'o10', treatment: 'Included', reason: 'Provisionally included to test the allocation guard for a shared cost.'}, 'preparer');
  refuse('map', {observationId: 'o10', lineId: 'l4', share: 0.5, basis: 'equal', reason: 'Half each.'}, /never applied by default/);
  run('map', {observationId: 'o10', lineId: 'l4', share: 0.5, basis: 'measured',
    reason: 'Measured crane hours recorded against each project for the shared establishment invoice.'}, 'preparer');
  assert.equal(M.mappedShare(r(), 'o10'), 0.5);
  assert.equal(M.submitBlockers(r()).some(b => /unallocated remainder/.test(b)), true);
});

check('An unallocated remainder is preserved and reported, never forced to a line', () => {
  run('treat', {id: 'o10', treatment: 'Included', reason: 'Provisionally included to test the allocation guard for a shared cost.',
    unmappedReason: 'The remaining half belongs to SYN-PPO-PRJ-024102 and is outside this review.'}, 'preparer');
  assert.equal(M.mappedShare(r(), 'o10'), 0.5);
  assert.equal(M.submitBlockers(r()).some(b => /unallocated remainder/.test(b)), false);
  const t = M.totals(r());
  assert.equal(t.unmapped.length, 1);
  assert.equal(money(t.unmappedTotal), '2800.00');
});

check('Allocated shares can never exceed the source record', () => {
  refuse('map', {observationId: 'o10', lineId: 'l7', share: 0.6, basis: 'measured',
    reason: 'Attempting a second allocation that would exceed the shared invoice.'}, /exceed the source record/);
  disposeShared();
  assert.equal(M.mappedShare(r(), 'o10'), 0);
  assert.equal(money(M.totals(r()).unresolvedTotal), '7450.00');
});

check('Different units cannot be allocated together without a reviewed conversion', () => {
  run('treat', {id: 'o9', treatment: 'Included', reason: 'Temporarily included to test the unit guard on an unmatched invoice line.'}, 'preparer');
  refuse('map', {observationId: 'o9', lineId: 'l1', share: 1, basis: 'direct',
    reason: 'Attempting to allocate an each-priced bracket line to a square-metre comparison line.'}, /cannot be compared without a reviewed conversion/);
  disposeUnmapped();
  assert.equal(M.obsOf(r(), 'o9').treatment, 'Excluded');
});

check('Possible duplicates between two source systems block submission until one is excluded', () => {
  const before = JSON.stringify(state);
  const withDuplicate = M.clone(state), rr = M.review(withDuplicate, 'ear-1');
  rr.observations.push(M.clone(rr.observations[0]));
  rr.observations[rr.observations.length - 1].id = 'o14';
  rr.observations[rr.observations.length - 1].ref = 'SYN-INV-88118';
  rr.observations[rr.observations.length - 1].system = 'MYOB Acumatica (simulated read)';
  const conflicts = M.duplicateConflicts(rr);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].refs, ['SYN-ISS-4471', 'SYN-INV-88118']);
  assert(M.submitBlockers(rr).some(b => /Possible duplicate/.test(b)));
  assert.equal(JSON.stringify(state), before);
});

check('A different currency cannot be allocated without a documented conversion basis', () => {
  run('treat', {id: 'o1', treatment: 'Included',
    reason: 'Posted supplier invoice for the drive pipe supply; it is attributable but not yet expressible on the comparison basis.'}, 'preparer', 'ear-4');
  refuse('map', {observationId: 'o1', lineId: 'l1', share: 1, basis: 'direct',
    reason: 'Attempting to allocate a EUR invoice priced by mass to an AUD comparison priced by length.'}, /cannot be compared without a reviewed conversion/, 'preparer', 'ear-4');
  const blockers = M.submitBlockers(M.review(state, 'ear-4'));
  assert(blockers.some(b => /EUR cannot be compared with AUD/.test(b)));
  assert(blockers.some(b => /unallocated remainder needs a recorded reason/.test(b)));
  assert.equal(M.totals(M.review(state, 'ear-4')).comparableLines, 0);
});

check('A quantity-only comparison is supported when no cost rate is established', () => {
  const q = M.review(state, 'ear-3'), c = M.lineComparison(q, 'l2');
  assert.equal(c.estCost, null);
  assert.equal(c.actual.cost, null);
  assert.equal(c.comparable, 'Quantity only');
  assert.equal(M.quantity(c.estQty), '54');
  assert.equal(M.quantity(c.actual.qty), '61.5');
  assert.equal(M.quantity(c.qtyVariance), '7.5');
  assert.equal(M.totals(q).estimated, null);
  assert.equal(M.identity(q).available, false);
});

check('Submission requires a completeness declaration and its reason', () => {
  refuse('completeness', {completeness: 'Partial', reason: 'short'}, /Completeness reason/);
  run('completeness', {completeness: 'Partial',
    reason: 'One shared establishment invoice has no adopted allocation basis, one supplier credit is unconfirmed and one invoice line has no comparison line.'}, 'preparer');
  assert.equal(M.submitBlockers(r()).length, 0);
});

check('Wrong role and stale version are refused atomically', () => {
  refuse('submit', {reason: 'Reviewer attempting a preparer action.'}, /cannot perform this action/, 'reviewer');
  const c = command('submit', {reason: 'Submitting with a stale workspace version.'}, 'preparer');
  c.cmd.expectedVersion--;
  assert.throws(() => M.command(state, c.cmd, c.role), /changed since this form was opened/);
});

check('Submission and claim move the review without touching the originals', () => {
  const issued = JSON.stringify(r().bases.issued);
  run('submit', {reason: 'Sources dispositioned to the 31 August cut-off; two matters remain open and are recorded.'}, 'preparer');
  assert.equal(r().state, 'ReadyForReview');
  run('claim', {reason: 'Claimed for estimating and commercial review.'}, 'reviewer');
  assert.equal(r().state, 'InReview');
  assert.equal(JSON.stringify(r().bases.issued), issued);
});

check('Conclusion is blocked until materiality is declared and material variances are explained', () => {
  let blockers = M.concludeBlockers(r());
  assert(blockers.some(b => /materiality/.test(b)));
  run('materiality', {percent: 5, amount: '1500.00', note: 'Proposed review-level threshold; no Powerplants materiality policy is adopted.'}, 'reviewer');
  blockers = M.concludeBlockers(r());
  assert.equal(M.materialLines(r()).length, 6);
  assert(blockers.some(b => /material variance needs at least one reviewed reason/.test(b)));
  assert(blockers.some(b => /unresolved source cannot remain/.test(b)));
});

check('An unresolved source cannot remain inside a concluded comparison', () => {
  run('treat', {id: 'o10', treatment: 'Excluded',
    reason: 'Held outside this review until an allocation basis is adopted; the full amount stays visible as an outstanding matter.'}, 'finance');
  run('treat', {id: 'o13', treatment: 'Excluded',
    reason: 'An approved supplier claim with no issued credit is not netted against actual cost; it remains an owned outstanding recovery.'}, 'finance');
  assert(!M.concludeBlockers(r()).some(b => /unresolved source/.test(b)));
  assert.equal(money(M.totals(r()).actual), '60933.54');
  assert.equal(money(M.totals(r()).outstandingTotal), '8192.20');
});

check('Attributed shares cannot exceed the observed difference and a remainder is retained', () => {
  run('explain', {lineId: 'l1', code: 'RATE-PURCHASE', share: 0.65,
    note: 'The supplier price moved from 8.40 to 8.95 per square metre after the quotation validity expired.'}, 'reviewer');
  refuse('explain', {lineId: 'l1', code: 'QTY-ASSUMPTION', share: 0.5,
    note: 'Attempting to attribute more than the observed difference.'}, /exceed the observed difference/, 'reviewer');
  run('explain', {lineId: 'l1', code: 'QTY-ASSUMPTION', share: 0.3,
    note: 'The take-off did not allow for the shrinkage the installer applied on site.'}, 'reviewer');
  assert.equal(Math.round(M.explainedShare(r(), 'l1') * 100), 95);
  refuse('explain', {lineId: 'l1', code: 'RATE-PURCHASE', share: 0.05, note: 'Attempting to repeat a reason already recorded.'}, /already recorded/, 'reviewer');
});

check('Every remaining material variance can carry its own reviewed cause', () => {
  run('explain', {lineId: 'l2', code: 'RECOVERY', share: 1,
    note: 'A fifth drive unit replaced a transit-damaged unit. The approved supplier claim is not netted against this cost.'}, 'reviewer');
  run('explain', {lineId: 'l3', code: 'QTY-ASSUMPTION', share: 0.7,
    note: 'Installation hours were estimated on a four-span assumption without the additional gutter-height access time.'}, 'reviewer');
  run('explain', {lineId: 'l3', code: 'SITE-COND', share: 0.3,
    note: 'Crop re-planting under the work area reduced available working width for two weeks.'}, 'reviewer');
  run('explain', {lineId: 'l4', code: 'FREIGHT', share: 1,
    note: 'Inbound sea freight and customs handling exceeded the lump allowance carried in the estimate.'}, 'reviewer');
  run('explain', {lineId: 'l5', code: 'RATE-PURCHASE', share: 1,
    note: 'Blackout cloth was purchased at the current list rate rather than the rate held on the variation cost basis.'}, 'reviewer');
  run('explain', {lineId: 'l6', code: 'QTY-ASSUMPTION', share: 1,
    note: 'Variation installation hours were estimated without the additional edge-fixing work the blackout screen required.'}, 'reviewer');
  assert.equal(M.concludeBlockers(r()).length, 0);
});

check('A review with open financial matters cannot be concluded as complete', () => {
  const provisional = M.provisionalReasons(r());
  assert(provisional.length >= 3);
  refuse('conclude', {outcome: 'Reviewed', reason: 'Attempting to close a review while a supplier recovery is unresolved.'}, /cannot be concluded as complete/, 'reviewer');
});

check('A finding cites exact comparison evidence and states its limits', () => {
  const result = run('finding', {title: 'Screen installation hours do not scale with gutter height',
    evidence: ['l3'], family: 'Screen Systems',
    issue: 'Installation hours were estimated at a flat rate per span with no allowance for gutter height or access method.',
    explanation: 'Reviewed as an original quantity assumption with a contributing site condition.',
    limitations: 'One delivered job at one site. This is a single case, not a validated rule or a benchmark, and it has no sample size.',
    proposal: 'Propose an ES-10 reference case and an estimating input question for gutter height and access method.',
    owner: 'Dana Okafor', due: '2026-09-30',
    specialistReview: 'Estimating review and ES-08 specialist confirmation required before any input or range change.'}, 'reviewer');
  const f = r().findings.find(f => f.id === result.receipt.resultId);
  assert.equal(f.state, 'Suggestion');
  assert.deepEqual(f.evidence, ['l3']);
  refuse('handover', {id: f.id, note: 'Attempting to hand over an unreviewed suggestion.'}, /reviewed proposal can be prepared/, 'reviewer');
});

check('A suggestion, a reviewed proposal and an approved change stay three different things', () => {
  const f = r().findings[0];
  run('findingReview', {id: f.id, reason: 'Reviewed against the exact comparison evidence; the cause is accepted for this job only.'}, 'reviewer');
  assert.equal(r().findings[0].state, 'Reviewed proposal');
  run('handover', {id: f.id, note: 'Single reference case with its comparison evidence, reviewed cause and stated limits for ES-10.'}, 'reviewer');
  assert.equal(r().findings[0].state, 'Handed to ES-10');
  assert.match(r().findings[0].outcome, /No formula, input range, parts mapping, labour rate, catalogue price/);
  refuse('handover', {id: f.id, note: 'Attempting a duplicate handover for the same proposal.'}, /Only a reviewed proposal can be prepared/, 'reviewer');
  assert.equal(r().handovers.length, 1);
  assert.equal(r().handovers[0].status, 'Prepared locally');
});

check('The handover changes no estimating basis, rate or historical result', () => {
  assert.equal(M.money(M.basisTotals(r()).issued), '50424.00');
  assert.equal(M.lineOf(r(), 'l3').estRate, M.cents('68.00'));
  assert.equal(M.review(state, 'ear-2').state, 'Reviewed');
  assert.equal(M.money(M.totals(M.review(state, 'ear-2')).deliveryVariance), '340.00');
});

check('Provisional conclusion retains the cut-off, snapshot and outstanding matters', () => {
  run('conclude', {outcome: 'ReviewedProvisional',
    reason: 'Reviewed to the 31 August cut-off. The supplier recovery, the shared-cost allocation basis and one unmapped invoice line remain open and owned.'}, 'reviewer');
  const concluded = r().concluded;
  assert.equal(r().state, 'ReviewedProvisional');
  assert.equal(concluded.outcome, 'ReviewedProvisional');
  assert.equal(concluded.identity.reconciles, true);
  assert.equal(M.money(concluded.totals.deliveryVariance), '9594.34');
  assert(concluded.provisional.length >= 3);
  assert.equal(r().outstanding.filter(o => o.status === 'Open').length, 3);
});

check('Concluding an ES-09 review closes no originating record', () => {
  assert.equal(r().deliveryRef, 'SYN-PPO-PRJ-024101');
  assert.equal(M.obsOf(r(), 'o13').sourceStatus, 'Approved — credit not issued');
  assert.equal(r().outstanding.find(o => o.type === 'Supplier recovery').status, 'Open');
  assert.equal(r().actions.length, 0);
});

check('An anticipated recovery is never netted against actual cost', () => {
  const t = M.totals(r());
  assert.equal(M.money(t.actual), '60933.54');
  assert.equal(M.money(M.lineComparison(r(), 'l2').actual.cost), '9250.00');
  assert.equal(M.money(t.outstandingTotal), '8192.20');
});

check('A source change after conclusion preserves the earlier reviewed result', () => {
  const concluded = JSON.stringify(r().concluded);
  run('sourceChange', {observationId: 'o6', amount: '4620.00', sourceStatus: 'Posted — revised',
    reason: 'A revised freight invoice was posted after the review cut-off.'}, 'finance');
  assert.equal(r().refreshRequired, true);
  assert.equal(r().sourceRevision, 2);
  assert.equal(JSON.stringify(r().concluded), concluded);
  assert.equal(money(r().concluded.totals.deliveryVariance), '9594.34');
  assert.equal(money(M.totals(r()).deliveryVariance), '10034.34');
  assert.equal(M.identity(r()).reconciles, true);
  assert(M.concludeBlockers(r()).some(b => /refresh the comparison first/.test(b)));
});

check('New evidence creates a successor review and the predecessor stays readable', () => {
  const result = run('successor', {reason: 'A revised freight invoice was posted after the cut-off and needs its own reviewed comparison.'}, 'reviewer');
  const successor = M.review(state, result.receipt.resultId);
  assert.equal(successor.ref, 'SYN-EAR-0001-S2');
  assert.equal(successor.state, 'Draft');
  assert.equal(successor.supersedes, 'ear-1');
  assert.equal(successor.concluded, null);
  assert.equal(r().supersededBy, successor.id);
  assert.equal(r().state, 'ReviewedProvisional');
  assert.equal(M.money(r().concluded.totals.deliveryVariance), '9594.34');
  assert.equal(M.money(M.totals(successor).actual), '61373.54');
});

check('A repeated operation identity recovers the original result without a second effect', () => {
  const last = state.receipts[state.receipts.length - 1];
  const reviews = state.reviews.length;
  const replay = M.command(state, {op: last.op, type: 'successor', reviewId: 'ear-1',
    payload: {reason: 'A revised freight invoice was posted after the cut-off and needs its own reviewed comparison.'}, expectedVersion: -99}, 'reviewer');
  assert.equal(replay.recovered, true);
  assert.equal(replay.state, state);
  assert.equal(state.reviews.length, reviews);
  assert.throws(() => M.command(state, {op: last.op, type: 'successor', reviewId: 'ear-1',
    payload: {reason: 'Different content under the same operation identity.'}, expectedVersion: state.version}, 'reviewer'), /different content/);
});

check('A read-only observer holds no action authority', () => {
  ['selectBasis', 'treat', 'map', 'submit', 'claim', 'conclude', 'finding', 'handover', 'sourceChange'].forEach(action => {
    assert.equal(M.can('observer', action), false);
  });
  assert.equal(M.seesRestricted('observer'), false);
  assert.equal(M.seesRestricted('preparer'), true);
  refuse('action', {title: 'Observer attempting to record work', reason: 'Observers hold no action authority.', owner: 'Jordan Blake', due: '2026-09-30'}, /cannot perform this action/, 'observer');
});

check('Malformed saved state, unsupported codes and impossible shares are rejected', () => {
  assert.throws(() => M.validate({schema: 'wrong'}), /supported/);
  const broken = M.seed();
  broken.reviews[0].mappings.push({id: 'bad', observationId: 'missing', lineId: 'l1', share: 1, basis: 'direct', reason: 'x'});
  assert.throws(() => M.validate(broken), /unknown source observation/);
  const badShare = M.seed();
  badShare.reviews[0].explanations.push({id: 'x', lineId: 'l1', code: 'NOT-A-CODE', share: 0.5, note: 'x', actor: 'x', at: 'x'});
  assert.throws(() => M.validate(badShare), /unsupported reason code/);
  refuse('map', {observationId: 'o1', lineId: 'l1', share: 1.5, basis: 'direct', reason: 'Attempting an impossible share.'}, /greater than 0 and at most 1/, 'preparer', 'ear-5');
});

check('Serialised state round-trips with every retained record', () => {
  const restored = M.validate(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.equal(M.review(restored, 'ear-1').explanations.length, 8);
  assert.equal(M.review(restored, 'ear-1').findings.length, 1);
  assert.equal(M.review(restored, 'ear-2').findings[0].state, 'Handed to ES-10');
});

const html = await fs.readFile(new URL('../docs/reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html', import.meta.url));
console.log(JSON.stringify({html_sha256: createHash('sha256').update(html).digest('hex'), html_bytes: html.length, groups: results.length, results}, null, 2));
