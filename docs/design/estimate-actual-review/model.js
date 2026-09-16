/* ES-09 Estimate-to-Actual Outcome Review design model.
   Synthetic fixtures only. No accounting definition, overhead rule, margin formula,
   materiality threshold or allocation basis in this file is adopted policy. */
(function (root) {
  'use strict';
  const TODAY = '2026-09-16';
  const SCHEMA = 'ppo-outcome-review/v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const text = (value, label, min = 8) => { assert(typeof value === 'string' && value.trim().length >= min && value.trim().length <= 2000, `${label}: enter ${min}–2,000 characters.`); return value.trim(); };
  const pick = (value, options, label) => { assert(options.includes(value), `Choose a valid ${label}.`); return value; };
  const date = value => { assert(/^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, 'Enter a valid calendar date.'); return value; };

  /* ---------------------------------------------------------------- numbers */
  /* Money is held as exact integer cents; quantity as exact integer thousandths.
     Extension rounds HALF_UP to cents, matching the adopted E1 arithmetic subset.
     Nothing here converts currency or units without a recorded reviewed basis. */
  function scaled(value, places, label) {
    assert(typeof value === 'string' || typeof value === 'number', `${label}: enter a number.`);
    const raw = String(value).trim();
    assert(/^-?\d+(\.\d+)?$/.test(raw), `${label}: enter a plain decimal number.`);
    const negative = raw.startsWith('-');
    const [whole, fraction = ''] = raw.replace('-', '').split('.');
    assert(fraction.length <= places, `${label}: at most ${places} decimal places.`);
    const digits = whole + fraction.padEnd(places, '0');
    const value_ = Number(digits);
    assert(Number.isSafeInteger(value_), `${label}: value out of supported range.`);
    return negative ? -value_ : value_;
  }
  const cents = (value, label = 'Amount') => scaled(value, 2, label);
  const qty = (value, label = 'Quantity') => scaled(value, 3, label);
  const halfUp = (numerator, divisor) => {
    const sign = numerator < 0 ? -1 : 1, n = Math.abs(numerator);
    return sign * Math.floor((n * 2 + divisor) / (divisor * 2));
  };
  /* extension = quantity(thousandths) x rate(cents) / 1000, HALF_UP to cents */
  const extend = (quantityTh, rateCents) => halfUp(quantityTh * rateCents, 1000);
  const money = value => (value === null || value === undefined) ? null : (value / 100).toFixed(2);
  /* Quantities are held as exact integer thousandths. Display trims trailing
     display zeros only; no value is rounded and no precision is inferred. */
  const quantity = value => {
    if (value === null || value === undefined) return null;
    const text = (value / 1000).toFixed(3);
    return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
  };

  /* ---------------------------------------------------------- registries */
  /* Proposed registries. Adoption, ownership and approval authority are open. */
  const REASONS = [
    {code: 'QTY-ASSUMPTION', group: 'Quantity and technical', label: 'Original quantity assumption'},
    {code: 'RATE-PURCHASE', group: 'Rate and price', label: 'Different purchase rate'},
    {code: 'RATE-LABOUR', group: 'Rate and price', label: 'Different labour rate basis'},
    {code: 'SCOPE-APPROVED', group: 'Scope', label: 'Approved scope change'},
    {code: 'SCOPE-PENDING', group: 'Scope', label: 'Customer-requested change awaiting disposition'},
    {code: 'SITE-COND', group: 'Quantity and technical', label: 'Site conditions'},
    {code: 'FREIGHT', group: 'Rate and price', label: 'Freight or logistics difference'},
    {code: 'REWORK', group: 'Productivity', label: 'Rework'},
    {code: 'SUBSTITUTION', group: 'Quantity and technical', label: 'Substitution'},
    {code: 'RECOVERY', group: 'Commercial', label: 'Return or confirmed recovery'},
    {code: 'MAPPING-TIMING', group: 'Data', label: 'Mapping or timing difference'},
    {code: 'CAUSE-UNKNOWN', group: 'Data', label: 'Cause not yet established'}
  ];
  const ALLOCATION_BASES = [
    {id: 'direct', label: 'Direct — the record names this delivery scope', adopted: true},
    {id: 'measured', label: 'Measured quantity recorded against each scope', adopted: false},
    {id: 'time', label: 'Recorded time on each scope', adopted: false},
    {id: 'equal', label: 'Equal split between named scopes', adopted: false}
  ];
  const TREATMENTS = ['Undecided', 'Included', 'Excluded', 'Commitment', 'Unresolved'];
  const QUANTITY_CLASSES = ['Ordered', 'Received', 'Issued', 'Used', 'Returned', 'Invoiced', 'Paid', 'Not applicable'];
  const COMPLETENESS = ['Complete', 'Partial', 'Unavailable'];
  const STATES = ['Draft', 'AwaitingEvidence', 'ReadyForReview', 'InReview', 'Returned', 'ReviewedProvisional', 'Reviewed', 'NotComparable'];
  const STATE_LABELS = {
    Draft: 'Draft', AwaitingEvidence: 'Awaiting evidence', ReadyForReview: 'Ready for review',
    InReview: 'In review', Returned: 'Returned for correction', ReviewedProvisional: 'Reviewed — provisional',
    Reviewed: 'Reviewed', NotComparable: 'Not comparable'
  };
  const FINDING_STATES = ['Suggestion', 'Reviewed proposal', 'Handed to ES-10', 'Closed'];

  const roles = {
    preparer: {name: 'Jordan Blake', title: 'Delivery owner · preparer', restricted: true,
      actions: ['selectBasis', 'treat', 'map', 'unmap', 'completeness', 'submit', 'notComparable', 'explain', 'action']},
    reviewer: {name: 'Sam Whitfield', title: 'Estimating & commercial reviewer', restricted: true,
      actions: ['claim', 'return', 'materiality', 'explain', 'finding', 'findingReview', 'handover', 'conclude', 'notComparable', 'successor', 'action']},
    finance: {name: 'Priya Raman', title: 'Finance validation', restricted: true,
      actions: ['financeValidate', 'conversion', 'treat', 'outstanding', 'sourceChange', 'action']},
    observer: {name: 'Lee Nakamura', title: 'Read-only observer', restricted: false, actions: []}
  };
  const people = ['Jordan Blake', 'Sam Whitfield', 'Priya Raman', 'Dana Okafor'];
  const can = (role, action) => Boolean(roles[role] && roles[role].actions.includes(action));
  const seesRestricted = role => Boolean(roles[role] && roles[role].restricted);

  /* ------------------------------------------------------------- fixtures */
  const line = (id, code, label, unit, source, estQty, estRate, note) => ({
    id, code, label, unit, source,
    estQty: estQty === null ? null : qty(estQty, label),
    estRate: estRate === null ? null : cents(estRate, label),
    estCost: (estQty === null || estRate === null) ? null : extend(qty(estQty, label), cents(estRate, label)),
    note: note || ''
  });
  const basisLine = (code, label, unit, q, rate) => ({code, label, unit, qty: qty(q, label), rate: cents(rate, label), cost: extend(qty(q, label), cents(rate, label))});

  function observation(o) {
    return Object.assign({
      treatment: 'Undecided', treatmentReason: '', unmappedReason: '', dedupeKey: null,
      reviewer: '', question: '', restricted: true, sourceVersion: 1, observedAt: '2026-09-01',
      currency: 'AUD', taxBasis: 'Excluding GST', rate: null, amount: null, qty: null, unit: ''
    }, o);
  }

  function northbankScreens() {
    const issued = [
      basisLine('SCR-CLOTH', 'Retractable shade cloth supply', 'm2', '2560', '8.40'),
      basisLine('SCR-DRIVE', 'Drive and motor assemblies', 'EA', '4', '1850.00'),
      basisLine('SCR-INST', 'Screen installation labour', 'h', '240', '68.00'),
      basisLine('SCR-SEAL', 'Edge seal materials', 'm', '320', '6.25'),
      basisLine('FRT-INB', 'Inbound freight', 'lot', '1', '3200.00')
    ];
    const accepted = [
      basisLine('SCR-CLOTH', 'Retractable shade cloth supply', 'm2', '2432', '8.40'),
      basisLine('SCR-DRIVE', 'Drive and motor assemblies', 'EA', '4', '1850.00'),
      basisLine('SCR-INST', 'Screen installation labour', 'h', '232', '68.00'),
      basisLine('FRT-INB', 'Inbound freight', 'lot', '1', '3200.00')
    ];
    const variation = [
      basisLine('SCR-CLOTH-V1', 'Blackout screen cloth — bay 8 addition', 'm2', '304', '9.10'),
      basisLine('SCR-INST-V1', 'Blackout screen installation labour', 'h', '26', '68.00')
    ];
    return {
      id: 'ear-1', ref: 'SYN-EAR-0001', title: 'Retractable shade screens — supply and install',
      customerId: 'org-northbank', customer: 'Northbank Nursery', site: 'Northbank · Glasshouse 02',
      siteRef: 'SYN-PPO-SITE-000012', facility: 'SYN-FAC-NB-GH02', equipmentFamily: 'Screen Systems',
      workCategory: 'Major greenhouse project — supply and install',
      deliveryType: 'Project', deliveryRef: 'SYN-PPO-PRJ-024101',
      opportunityRef: 'SYN-PPO-OPP-000042', estimateRef: 'SYN-PPO-EST-000042', option: 'SYN-OPT-A',
      acceptedQuoteRef: 'SYN-PPO-QUO-000042', acceptedIssue: 'R02', acceptedAt: '2026-05-28',
      estimator: 'Dana Okafor', deliveryOwner: 'Jordan Blake', reviewOwner: 'Sam Whitfield',
      scopeCutOff: '2026-08-31', reportingCutOff: '2026-08-31',
      state: 'Draft', stateReason: '', completeness: 'Partial',
      completenessReason: 'One shared site-establishment invoice has no adopted allocation basis and one supplier credit is unconfirmed at the cut-off.',
      materiality: null, financeValidated: false, refreshRequired: false,
      supersedes: null, supersededBy: null, sourceRevision: 1, snapshotVersion: 1,
      comparison: {currency: 'AUD', taxBasis: 'Excluding GST', quantityClass: 'Used / reviewed quantity',
        costDefinition: 'PPO reviewed operational quantities valued at recorded supplier and labour source rates. Overhead allocation, capitalisation and margin are not defined (D-017 open).'},
      bases: {
        issued: {id: 'EV-r03', label: 'Issued estimate cost version', versionRef: 'SYN-PPO-EST-000042 · cost version r03',
          savedAt: '2026-05-11T04:12:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'ES-08 Screen Systems reference fixture · configuration SYN-CFG-SCREEN-001 (authored fixture, not an approved formula pack)',
          option: 'SYN-OPT-A', lines: issued,
          supplierSources: [
            {ref: 'SYN-SUP-Q-3391', supplier: 'Synthetic screen supply', validUntil: '2026-06-30', scope: 'Shade cloth and edge seal', currency: 'AUD'},
            {ref: 'SYN-SUP-Q-3402', supplier: 'Synthetic drive systems', validUntil: '2026-07-15', scope: 'Drive and motor assemblies', currency: 'AUD'}
          ],
          price: {total: cents('78400.00'), note: 'Issued quoted selling price, AUD excluding GST.'}},
        accepted: {id: 'EV-r04', label: 'Accepted scope cost version', versionRef: 'SYN-PPO-EST-000042 · cost version r04',
          savedAt: '2026-05-26T23:40:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'ES-08 Screen Systems reference fixture · configuration SYN-CFG-SCREEN-001',
          option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [
            {ref: 'SYN-SUP-Q-3391', supplier: 'Synthetic screen supply', validUntil: '2026-06-30', scope: 'Shade cloth', currency: 'AUD'},
            {ref: 'SYN-SUP-Q-3402', supplier: 'Synthetic drive systems', validUntil: '2026-07-15', scope: 'Drive and motor assemblies', currency: 'AUD'}
          ],
          price: {total: cents('70280.00'), note: 'Accepted quotation selling price, AUD excluding GST.'}}
      },
      approvedChanges: [
        {id: 'var-1', ref: 'SYN-PPO-VAR-024101', title: 'Blackout screen added to bay 8', approvedAt: '2026-07-02',
          reason: 'Customer approved an additional blackout screen over bay 8 after the propagation trial was extended.',
          costBasisRecorded: true, lines: variation, price: cents('6850.00'),
          evidence: 'Fictional signed variation advice SYN-VAR-ADV-024101-r01'},
        {id: 'var-2', ref: 'SYN-PPO-VAR-024102', title: 'Elevated access method change', approvedAt: '2026-07-19',
          reason: 'Approved change of access method after the crop was re-planted under the work area.',
          costBasisRecorded: false, lines: null, price: cents('2400.00'),
          evidence: 'Fictional variation advice SYN-VAR-ADV-024102-r01; no estimating cost version was prepared for this change.'}
      ],
      commercial: [
        {id: 'cm-1', type: 'Scope change at acceptance', amount: cents('-3620.00'), at: '2026-05-26',
          reason: 'Edge seal supply removed from the offer during negotiation; the customer arranged it separately.',
          evidence: 'Quotation SYN-PPO-QUO-000042 issue R01 to R02 comparison'},
        {id: 'cm-2', type: 'Negotiated discount conceded at close', amount: cents('-4500.00'), at: '2026-05-28',
          reason: 'Commercial discount agreed to close the order in the customer’s planting window. No cost basis changed.',
          evidence: 'Fictional acceptance note SYN-QUO-ACC-000042'}
      ],
      basisSelection: {declared: false, includeChanges: [], acknowledgedMissingCost: [], declaredAt: null, declaredBy: null, note: ''},
      lines: [
        line('l1', 'SCR-CLOTH', 'Retractable shade cloth supply', 'm2', 'accepted', '2432', '8.40'),
        line('l2', 'SCR-DRIVE', 'Drive and motor assemblies', 'EA', 'accepted', '4', '1850.00'),
        line('l3', 'SCR-INST', 'Screen installation labour', 'h', 'accepted', '232', '68.00'),
        line('l4', 'FRT-INB', 'Inbound freight', 'lot', 'accepted', '1', '3200.00'),
        line('l5', 'SCR-CLOTH-V1', 'Blackout screen cloth — bay 8 addition', 'm2', 'var-1', '304', '9.10'),
        line('l6', 'SCR-INST-V1', 'Blackout screen installation labour', 'h', 'var-1', '26', '68.00'),
        line('l7', 'ACCESS-V2', 'Elevated access method change', 'lot', 'var-2', null, null,
          'Approved variation with no recorded estimating cost basis. Variance cannot be computed for this line.')
      ],
      observations: [
        observation({id: 'o1', ref: 'SYN-ISS-4471', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-WO-024101', lineRef: 'Issue line 1', description: 'Shade cloth SYN-SHADE-01 issued to project',
          scopeRef: 'SYN-PPO-PRJ-024101 · Glasshouse 02', category: 'Material issue', quantityClass: 'Issued',
          qty: qty('2598'), unit: 'm2', rate: cents('8.95'), amount: extend(qty('2598'), cents('8.95')),
          date: '2026-06-18', sourceStatus: 'Posted', dedupeKey: 'material:SYN-SHADE-01:2026-06',
          treatment: 'Included', treatmentReason: 'Confirmed store issue to the exact project scope.'}),
        observation({id: 'o2', ref: 'SYN-RET-0219', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-WO-024101', lineRef: 'Return line 1', description: 'Unused shade cloth returned to store',
          scopeRef: 'SYN-PPO-PRJ-024101 · Glasshouse 02', category: 'Material return', quantityClass: 'Returned',
          qty: qty('-88'), unit: 'm2', rate: cents('8.95'), amount: extend(qty('-88'), cents('8.95')),
          date: '2026-08-04', sourceStatus: 'Posted',
          treatment: 'Included', treatmentReason: 'Unused material returned to store; reduces consumed quantity on the same source and unit.'}),
        observation({id: 'o3', ref: 'SYN-INV-88117', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88117', lineRef: 'Line 1', description: 'Drive and motor assemblies — five units invoiced',
          scopeRef: 'SYN-PPO-PRJ-024101', category: 'Supplier invoice', quantityClass: 'Invoiced',
          qty: qty('5'), unit: 'EA', rate: cents('1850.00'), amount: extend(qty('5'), cents('1850.00')),
          date: '2026-07-09', sourceStatus: 'Posted', dedupeKey: 'drive:SYN-DRIVE-01:2026-07',
          treatment: 'Included', treatmentReason: 'Five units invoiced; the fifth replaced a transit-damaged unit. Recovery is tracked separately and is not netted here.'}),
        observation({id: 'o4', ref: 'SYN-LAB-3318', system: 'PPO Service review', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-RPT-024101', lineRef: 'Reviewed labour · base scope', description: 'Reviewed installation labour — base screen scope',
          scopeRef: 'SYN-PPO-PRJ-024101 · task INST-BASE', category: 'Labour', quantityClass: 'Used',
          qty: qty('291'), unit: 'h', rate: cents('68.00'), amount: extend(qty('291'), cents('68.00')),
          date: '2026-08-14', sourceStatus: 'Reviewed', dedupeKey: 'labour:INST-BASE:2026-06/08',
          treatment: 'Included', treatmentReason: 'Service-reviewed hours for the base installation task; captured hours were reviewed before use.'}),
        observation({id: 'o5', ref: 'SYN-LAB-3319', system: 'PPO Service review', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-RPT-024101', lineRef: 'Reviewed labour · variation', description: 'Reviewed installation labour — blackout variation',
          scopeRef: 'SYN-PPO-PRJ-024101 · task INST-VAR1', category: 'Labour', quantityClass: 'Used',
          qty: qty('34'), unit: 'h', rate: cents('68.00'), amount: extend(qty('34'), cents('68.00')),
          date: '2026-08-14', sourceStatus: 'Reviewed', dedupeKey: 'labour:INST-VAR1:2026-07/08',
          treatment: 'Included', treatmentReason: 'Service-reviewed hours recorded against the approved variation task.'}),
        observation({id: 'o6', ref: 'SYN-INV-88190', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88190', lineRef: 'Line 1', description: 'Inbound sea freight and customs handling',
          scopeRef: 'SYN-PPO-PRJ-024101', category: 'Freight', quantityClass: 'Invoiced',
          qty: qty('1'), unit: 'lot', rate: cents('4180.00'), amount: cents('4180.00'),
          date: '2026-06-30', sourceStatus: 'Posted', dedupeKey: 'freight:SYN-INV-88190',
          treatment: 'Included', treatmentReason: 'Freight invoice raised against this project reference only.'}),
        observation({id: 'o7', ref: 'SYN-ISS-4502', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-WO-024101', lineRef: 'Issue line 7', description: 'Blackout cloth SYN-BLACK-01 issued for the approved variation',
          scopeRef: 'SYN-PPO-PRJ-024101 · variation SYN-PPO-VAR-024101', category: 'Material issue', quantityClass: 'Issued',
          qty: qty('312'), unit: 'm2', rate: cents('9.42'), amount: extend(qty('312'), cents('9.42')),
          date: '2026-07-22', sourceStatus: 'Posted', dedupeKey: 'material:SYN-BLACK-01:2026-07',
          treatment: 'Included', treatmentReason: 'Issued against the approved variation task; no return recorded.'}),
        observation({id: 'o8', ref: 'SYN-INV-88204', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88204', lineRef: 'Line 1', description: 'Elevated access platform hire — approved access change',
          scopeRef: 'SYN-PPO-PRJ-024101 · variation SYN-PPO-VAR-024102', category: 'Subcontract', quantityClass: 'Invoiced',
          qty: qty('1'), unit: 'lot', rate: cents('1960.00'), amount: cents('1960.00'),
          date: '2026-07-28', sourceStatus: 'Posted', dedupeKey: 'access:SYN-INV-88204',
          treatment: 'Included', treatmentReason: 'Attributable to the approved access variation, which has no recorded estimating cost basis.'}),
        observation({id: 'o9', ref: 'SYN-INV-88213', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88213', lineRef: 'Line 3', description: 'Gutter bracket sets — no breakdown code on the source line',
          scopeRef: 'SYN-PPO-PRJ-024101 (project reference only)', category: 'Supplier invoice', quantityClass: 'Invoiced',
          qty: qty('60'), unit: 'EA', rate: cents('12.37'), amount: extend(qty('60'), cents('12.37')),
          date: '2026-08-03', sourceStatus: 'Posted',
          reviewer: 'Sam Whitfield', question: 'No comparison line exists for this item. Confirm whether it belongs to this scope before it is included.'}),
        observation({id: 'o10', ref: 'SYN-INV-88228', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88228', lineRef: 'Line 1', description: 'Site establishment and crane hire shared with SYN-PPO-PRJ-024102',
          scopeRef: 'SYN-PPO-PRJ-024101 and SYN-PPO-PRJ-024102', category: 'Subcontract', quantityClass: 'Invoiced',
          qty: qty('1'), unit: 'lot', rate: cents('5600.00'), amount: cents('5600.00'),
          date: '2026-07-06', sourceStatus: 'Posted',
          reviewer: 'Priya Raman', question: 'Shared between two projects. No allocation basis is adopted; an equal split is not a default.'}),
        observation({id: 'o11', ref: 'SYN-PPO-REQ-024118', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-REQ-024118', lineRef: 'PO line 2', description: 'Open purchase order — two spare drive kits',
          scopeRef: 'SYN-PPO-PRJ-024101', category: 'Commitment', quantityClass: 'Ordered',
          qty: qty('2'), unit: 'EA', rate: cents('1850.00'), amount: extend(qty('2'), cents('1850.00')),
          date: '2026-08-20', sourceStatus: 'Committed',
          treatment: 'Commitment', treatmentReason: 'Ordered and not received at the cut-off. A commitment is not an incurred cost.'}),
        observation({id: 'o12', ref: 'SYN-CINV-55021', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-CINV-55021', lineRef: 'Line 1', description: 'Customer progress invoice — first claim',
          scopeRef: 'SYN-PPO-PRJ-024101', category: 'Customer billing', quantityClass: 'Invoiced',
          qty: null, unit: '', rate: null, amount: cents('42000.00'),
          date: '2026-07-31', sourceStatus: 'Posted',
          treatment: 'Excluded', treatmentReason: 'Customer billing is not a job cost. Retained for context only.'}),
        observation({id: 'o13', ref: 'SYN-CLM-00318', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-CLM-00318', lineRef: 'Claim line 1', description: 'Approved supplier claim for the transit-damaged drive unit',
          scopeRef: 'SYN-PPO-PRJ-024101', category: 'Credit', quantityClass: 'Not applicable',
          qty: qty('1'), unit: 'EA', rate: cents('1850.00'), amount: cents('-1850.00'),
          date: '2026-08-21', sourceStatus: 'Approved — credit not issued',
          treatment: 'Unresolved', treatmentReason: 'The supplier approved the claim; no credit note exists at the cut-off. An anticipated recovery is never netted against actual cost.'})
      ],
      mappings: [
        {id: 'm1', observationId: 'o1', lineId: 'l1', share: 1, basis: 'direct', reason: 'Issue line names the project and part.'},
        {id: 'm2', observationId: 'o2', lineId: 'l1', share: 1, basis: 'direct', reason: 'Return of the same part against the same project.'},
        {id: 'm3', observationId: 'o3', lineId: 'l2', share: 1, basis: 'direct', reason: 'Supplier invoice names the project and the drive assemblies.'},
        {id: 'm4', observationId: 'o4', lineId: 'l3', share: 1, basis: 'direct', reason: 'Reviewed hours recorded against the base installation task.'},
        {id: 'm5', observationId: 'o5', lineId: 'l6', share: 1, basis: 'direct', reason: 'Reviewed hours recorded against the variation task.'},
        {id: 'm6', observationId: 'o6', lineId: 'l4', share: 1, basis: 'direct', reason: 'Freight invoice names this project only.'},
        {id: 'm7', observationId: 'o7', lineId: 'l5', share: 1, basis: 'direct', reason: 'Issue line names the approved variation task.'},
        {id: 'm8', observationId: 'o8', lineId: 'l7', share: 1, basis: 'direct', reason: 'Invoice names the approved access variation.'}
      ],
      conversions: [], explanations: [], findings: [], handovers: [], actions: [], decisions: [],
      outstanding: [
        {id: 'ou1', type: 'Supplier recovery', label: 'Approved supplier claim SYN-CLM-00318 — credit not issued',
          amount: cents('1850.00'), status: 'Open', owner: 'Priya Raman', due: '2026-09-30',
          evidence: 'Fictional supplier claim approval note; no credit document exists at the cut-off.'},
        {id: 'ou2', type: 'Allocation decision', label: 'Shared site establishment SYN-INV-88228 — no adopted allocation basis',
          amount: cents('5600.00'), status: 'Open', owner: 'Priya Raman', due: '2026-09-26',
          evidence: 'Invoice names two projects. Allocation basis registry entries are proposed, not adopted.'},
        {id: 'ou3', type: 'Unmapped actual', label: 'SYN-INV-88213 line 3 — no comparison line',
          amount: extend(qty('60'), cents('12.37')), status: 'Open', owner: 'Jordan Blake', due: '2026-09-23',
          evidence: 'Attributable to the project reference only; no breakdown code on the source line.'}
      ],
      history: [
        {id: 'h1', at: '2026-09-14T22:10:00Z', actor: 'Jordan Blake', type: 'open', description: 'Outcome review opened against the accepted quotation and delivery project.'}
      ]
    };
  }

  function northbankController() {
    const accepted = [
      basisLine('CTL-UNIT', 'Fertigation controller unit', 'EA', '1', '4180.00'),
      basisLine('CTL-COMM', 'Controls commissioning labour', 'h', '12', '68.00')
    ];
    return {
      id: 'ear-2', ref: 'SYN-EAR-0002', title: 'Fertigation controller upgrade',
      customerId: 'org-northbank', customer: 'Northbank Nursery', site: 'Northbank · Irrigation room',
      siteRef: 'SYN-PPO-SITE-000012', facility: 'SYN-FAC-NB-IRR01', equipmentFamily: 'Fertigation and irrigation',
      workCategory: 'Equipment upgrade — service work order',
      deliveryType: 'Work order', deliveryRef: 'SYN-PPO-WO-000241',
      opportunityRef: 'SYN-PPO-OPP-000061', estimateRef: 'SYN-PPO-EST-000061', option: 'SYN-OPT-A',
      acceptedQuoteRef: 'SYN-PPO-QUO-000061', acceptedIssue: 'R01', acceptedAt: '2026-06-15',
      estimator: 'Dana Okafor', deliveryOwner: 'Jordan Blake', reviewOwner: 'Sam Whitfield',
      scopeCutOff: '2026-08-15', reportingCutOff: '2026-08-15',
      state: 'Reviewed', stateReason: 'Concluded with complete sources on 4 September 2026.',
      completeness: 'Complete', completenessReason: '',
      materiality: {basis: 'percent-or-amount', percent: 5, amount: cents('1500.00'),
        note: 'Proposed threshold only. No materiality policy is adopted.'},
      financeValidated: true, refreshRequired: false,
      supersedes: null, supersededBy: null, sourceRevision: 1, snapshotVersion: 1,
      comparison: {currency: 'AUD', taxBasis: 'Excluding GST', quantityClass: 'Used / reviewed quantity',
        costDefinition: 'PPO reviewed operational quantities valued at recorded supplier and labour source rates.'},
      bases: {
        issued: {id: 'EV-r01', label: 'Issued estimate cost version', versionRef: 'SYN-PPO-EST-000061 · cost version r01',
          savedAt: '2026-06-02T01:15:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry — no calculator used', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3510', supplier: 'Synthetic controls supply', validUntil: '2026-08-31', scope: 'Controller unit', currency: 'AUD'}],
          price: {total: cents('7450.00'), note: 'Issued quoted selling price, AUD excluding GST.'}},
        accepted: {id: 'EV-r01', label: 'Accepted scope cost version', versionRef: 'SYN-PPO-EST-000061 · cost version r01',
          savedAt: '2026-06-02T01:15:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry — no calculator used', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3510', supplier: 'Synthetic controls supply', validUntil: '2026-08-31', scope: 'Controller unit', currency: 'AUD'}],
          price: {total: cents('7450.00'), note: 'Accepted quotation selling price, AUD excluding GST. The offer was accepted without change.'}}
      },
      approvedChanges: [], commercial: [],
      basisSelection: {declared: true, includeChanges: [], acknowledgedMissingCost: [],
        declaredAt: '2026-09-02T03:00:00Z', declaredBy: 'Jordan Blake',
        note: 'Issued and accepted cost versions are the same saved version; the offer was accepted unchanged.'},
      lines: [
        line('l1', 'CTL-UNIT', 'Fertigation controller unit', 'EA', 'accepted', '1', '4180.00'),
        line('l2', 'CTL-COMM', 'Controls commissioning labour', 'h', 'accepted', '12', '68.00')
      ],
      observations: [
        observation({id: 'o1', ref: 'SYN-INV-87740', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-87740', lineRef: 'Line 1', description: 'Fertigation controller unit invoiced',
          scopeRef: 'SYN-PPO-WO-000241', category: 'Supplier invoice', quantityClass: 'Invoiced',
          qty: qty('1'), unit: 'EA', rate: cents('4180.00'), amount: cents('4180.00'),
          date: '2026-07-02', sourceStatus: 'Posted', dedupeKey: 'controller:SYN-INV-87740',
          treatment: 'Included', treatmentReason: 'Supplier invoice names the work order.'}),
        observation({id: 'o2', ref: 'SYN-LAB-3290', system: 'PPO Service review', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-RPT-000241', lineRef: 'Reviewed labour', description: 'Reviewed commissioning labour',
          scopeRef: 'SYN-PPO-WO-000241', category: 'Labour', quantityClass: 'Used',
          qty: qty('17'), unit: 'h', rate: cents('68.00'), amount: extend(qty('17'), cents('68.00')),
          date: '2026-07-11', sourceStatus: 'Reviewed', dedupeKey: 'labour:WO241:2026-07',
          treatment: 'Included', treatmentReason: 'Service-reviewed hours for the commissioning task.'})
      ],
      mappings: [
        {id: 'm1', observationId: 'o1', lineId: 'l1', share: 1, basis: 'direct', reason: 'Invoice names the work order and the unit.'},
        {id: 'm2', observationId: 'o2', lineId: 'l2', share: 1, basis: 'direct', reason: 'Reviewed hours recorded against the commissioning task.'}
      ],
      conversions: [],
      explanations: [
        {id: 'e1', lineId: 'l2', code: 'QTY-ASSUMPTION', share: 0.6, actor: 'Sam Whitfield', at: '2026-09-04T01:20:00Z',
          note: 'Commissioning was estimated at 12 hours on a single-zone assumption; the installed system had three zones.'},
        {id: 'e2', lineId: 'l2', code: 'SITE-COND', share: 0.4, actor: 'Sam Whitfield', at: '2026-09-04T01:22:00Z',
          note: 'Existing wiring required re-termination before the controller could be proved.'}
      ],
      findings: [
        {id: 'f1', at: '2026-09-04T01:30:00Z', actor: 'Sam Whitfield', title: 'Commissioning hours are estimated per unit, not per zone',
          evidence: ['l2'], family: 'Fertigation and irrigation', workType: 'Equipment upgrade',
          issue: 'The estimate carried a single commissioning allowance regardless of the number of irrigation zones proved.',
          explanation: 'Reviewed as an original quantity assumption with a contributing site condition.',
          limitations: 'One delivered job. This is a single case, not a validated general rule or a benchmark.',
          proposal: 'Propose an ES-10 reference case and an estimating input question for the number of zones to be proved at commissioning.',
          owner: 'Dana Okafor', due: '2026-09-30', specialistReview: 'Estimating review required before any input change',
          relatedCases: [], state: 'Handed to ES-10', outcome: 'Prepared locally for ES-10; no calculator, rate or catalogue change is made here.'}
      ],
      handovers: [
        {id: 'ho1', at: '2026-09-04T01:35:00Z', actor: 'Sam Whitfield', target: 'ES-10 Reference cases and calibration proposals',
          findingId: 'f1', status: 'Prepared locally', note: 'Single reference case with its comparison evidence and stated limitations.'}
      ],
      actions: [], decisions: [
        {id: 'd1', at: '2026-09-02T04:00:00Z', actor: 'Sam Whitfield', decision: 'Claimed for review', reason: 'Sources complete; comparison basis declared.'},
        {id: 'd2', at: '2026-09-04T01:40:00Z', actor: 'Sam Whitfield', decision: 'Reviewed', reason: 'Every material variance carries at least one reviewed reason and no financial matter is outstanding.'}
      ],
      outstanding: [],
      history: [
        {id: 'h1', at: '2026-09-02T03:00:00Z', actor: 'Jordan Blake', type: 'basis', description: 'Comparison basis declared.'},
        {id: 'h2', at: '2026-09-04T01:40:00Z', actor: 'Sam Whitfield', type: 'conclude', description: 'Review concluded as Reviewed.'}
      ]
    };
  }

  function greenhavenQuantityOnly() {
    const accepted = [
      basisLine('VNT-MOTOR', 'Vent motor assemblies', 'EA', '18', '0.00'),
      basisLine('VNT-INST', 'Vent motor replacement labour', 'h', '54', '0.00')
    ];
    const rec = {
      id: 'ear-3', ref: 'SYN-EAR-0003', title: 'Vent motor replacement batch',
      customerId: 'org-greenhaven', customer: 'Greenhaven Produce', site: 'Greenhaven · Range 3',
      siteRef: 'SYN-PPO-SITE-000031', facility: 'SYN-FAC-GH-R03', equipmentFamily: 'Climate and ventilation',
      workCategory: 'Product and parts sale with installation',
      deliveryType: 'Sales order', deliveryRef: 'SYN-PPO-SO-024210',
      opportunityRef: 'SYN-PPO-OPP-000074', estimateRef: 'SYN-PPO-EST-000074', option: 'SYN-OPT-A',
      acceptedQuoteRef: 'SYN-PPO-QUO-000074', acceptedIssue: 'R01', acceptedAt: '2026-07-06',
      estimator: 'Dana Okafor', deliveryOwner: 'Jordan Blake', reviewOwner: 'Sam Whitfield',
      scopeCutOff: '2026-08-31', reportingCutOff: '2026-08-31',
      state: 'ReadyForReview', stateReason: '',
      completeness: 'Partial',
      completenessReason: 'No supplier invoice is posted at the cut-off and the catalogue cost source expired before the order. Quantities are complete; cost rates are not established.',
      materiality: null, financeValidated: false, refreshRequired: false,
      supersedes: null, supersededBy: null, sourceRevision: 1, snapshotVersion: 1,
      comparison: {currency: 'AUD', taxBasis: 'Excluding GST', quantityClass: 'Used / reviewed quantity',
        costDefinition: 'Quantity comparison only. No cost definition is available because no established rate exists on either side.'},
      bases: {
        issued: {id: 'EV-r02', label: 'Issued estimate cost version', versionRef: 'SYN-PPO-EST-000074 · cost version r02',
          savedAt: '2026-06-28T02:00:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3466', supplier: 'Synthetic vent systems', validUntil: '2026-06-30', scope: 'Vent motors', currency: 'AUD'}],
          price: {total: cents('31200.00'), note: 'Issued quoted selling price, AUD excluding GST.'}},
        accepted: {id: 'EV-r02', label: 'Accepted scope cost version', versionRef: 'SYN-PPO-EST-000074 · cost version r02',
          savedAt: '2026-06-28T02:00:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3466', supplier: 'Synthetic vent systems', validUntil: '2026-06-30', scope: 'Vent motors', currency: 'AUD'}],
          price: {total: cents('31200.00'), note: 'Accepted quotation selling price, AUD excluding GST.'}}
      },
      approvedChanges: [], commercial: [],
      basisSelection: {declared: true, includeChanges: [], acknowledgedMissingCost: [],
        declaredAt: '2026-09-10T00:30:00Z', declaredBy: 'Jordan Blake',
        note: 'Quantity-only comparison. The estimate carried no retained unit cost for either line and no supplier invoice is posted.'},
      lines: [
        line('l1', 'VNT-MOTOR', 'Vent motor assemblies', 'EA', 'accepted', '18', null,
          'Estimated cost rate not retained on the saved version. Quantity comparison only.'),
        line('l2', 'VNT-INST', 'Vent motor replacement labour', 'h', 'accepted', '54', null,
          'Estimated labour cost rate not retained on the saved version. Quantity comparison only.')
      ],
      observations: [
        observation({id: 'o1', ref: 'SYN-ISS-4610', system: 'PPO Supply Chain', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-SO-024210', lineRef: 'Issue line 1', description: 'Vent motor assemblies issued to the order',
          scopeRef: 'SYN-PPO-SO-024210', category: 'Material issue', quantityClass: 'Issued',
          qty: qty('21'), unit: 'EA', rate: null, amount: null,
          date: '2026-08-05', sourceStatus: 'Posted', dedupeKey: 'vent:SYN-VNT-01:2026-08',
          treatment: 'Included', treatmentReason: 'Store issue against the sales order. No invoice is posted, so no cost rate is established.'}),
        observation({id: 'o2', ref: 'SYN-LAB-3402', system: 'PPO Service review', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-RPT-024210', lineRef: 'Reviewed labour', description: 'Reviewed replacement labour',
          scopeRef: 'SYN-PPO-SO-024210', category: 'Labour', quantityClass: 'Used',
          qty: qty('61.5'), unit: 'h', rate: null, amount: null,
          date: '2026-08-21', sourceStatus: 'Reviewed', dedupeKey: 'labour:SO024210:2026-08',
          treatment: 'Included', treatmentReason: 'Reviewed hours. No approved labour cost rate is available to this review.'})
      ],
      mappings: [
        {id: 'm1', observationId: 'o1', lineId: 'l1', share: 1, basis: 'direct', reason: 'Issue line names the sales order and the part family.'},
        {id: 'm2', observationId: 'o2', lineId: 'l2', share: 1, basis: 'direct', reason: 'Reviewed hours recorded against the order.'}
      ],
      conversions: [], explanations: [], findings: [], handovers: [], actions: [], decisions: [],
      outstanding: [
        {id: 'ou1', type: 'Cost evidence', label: 'No supplier invoice posted for the vent motors at the cut-off',
          amount: null, status: 'Open', owner: 'Priya Raman', due: '2026-09-30',
          evidence: 'Goods received; supplier invoice not posted. Cost comparison is withheld rather than estimated.'}
      ],
      history: [
        {id: 'h1', at: '2026-09-10T00:30:00Z', actor: 'Jordan Blake', type: 'basis', description: 'Quantity-only comparison basis declared.'}
      ]
    };
    rec.lines[0].estRate = null; rec.lines[0].estCost = null;
    rec.lines[1].estRate = null; rec.lines[1].estCost = null;
    rec.bases.issued.lines.forEach(l => { l.rate = null; l.cost = null; });
    rec.bases.accepted.lines.forEach(l => { l.rate = null; l.cost = null; });
    return rec;
  }

  function cedarValeIncomparable() {
    return {
      id: 'ear-4', ref: 'SYN-EAR-0004', title: 'Imported screen drive supply',
      customerId: 'org-cedarvale', customer: 'Cedar Vale Growers', site: 'Cedar Vale · House 4',
      siteRef: 'SYN-PPO-SITE-000044', facility: 'SYN-FAC-CV-H04', equipmentFamily: 'Screen Systems',
      workCategory: 'Supply-only import',
      deliveryType: 'Project', deliveryRef: 'SYN-PPO-PRJ-024140',
      opportunityRef: 'SYN-PPO-OPP-000088', estimateRef: 'SYN-PPO-EST-000088', option: 'SYN-OPT-B',
      acceptedQuoteRef: 'SYN-PPO-QUO-000088', acceptedIssue: 'R01', acceptedAt: '2026-06-22',
      estimator: 'Dana Okafor', deliveryOwner: 'Jordan Blake', reviewOwner: 'Sam Whitfield',
      scopeCutOff: '2026-08-31', reportingCutOff: '2026-08-31',
      state: 'AwaitingEvidence',
      stateReason: 'The supplier invoice is denominated in EUR and priced by mass; the estimate is in AUD and priced by length. No reviewed conversion basis exists for either difference.',
      completeness: 'Partial',
      completenessReason: 'One supplier invoice cannot be compared numerically against the estimate without a documented currency and unit conversion basis.',
      materiality: null, financeValidated: false, refreshRequired: false,
      supersedes: null, supersededBy: null, sourceRevision: 1, snapshotVersion: 1,
      comparison: {currency: 'AUD', taxBasis: 'Excluding GST', quantityClass: 'Invoiced quantity',
        costDefinition: 'PPO recorded supplier cost. No exchange-rate source or unit conversion is defined for this review.'},
      bases: {
        issued: {id: 'EV-r01', label: 'Issued estimate cost version', versionRef: 'SYN-PPO-EST-000088 · cost version r01',
          savedAt: '2026-06-09T06:00:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'ES-08 Screen Systems reference fixture · configuration SYN-CFG-SCREEN-004',
          option: 'SYN-OPT-B',
          lines: [basisLine('SCR-DRIVEPIPE', 'Drive pipe supply', 'm', '640', '18.75')],
          supplierSources: [{ref: 'SYN-SUP-Q-3588', supplier: 'Synthetic European drive supply', validUntil: '2026-07-31', scope: 'Drive pipe', currency: 'EUR'}],
          price: {total: cents('19800.00'), note: 'Issued quoted selling price, AUD excluding GST.'}},
        accepted: {id: 'EV-r01', label: 'Accepted scope cost version', versionRef: 'SYN-PPO-EST-000088 · cost version r01',
          savedAt: '2026-06-09T06:00:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'ES-08 Screen Systems reference fixture · configuration SYN-CFG-SCREEN-004',
          option: 'SYN-OPT-B',
          lines: [basisLine('SCR-DRIVEPIPE', 'Drive pipe supply', 'm', '640', '18.75')],
          supplierSources: [{ref: 'SYN-SUP-Q-3588', supplier: 'Synthetic European drive supply', validUntil: '2026-07-31', scope: 'Drive pipe', currency: 'EUR'}],
          price: {total: cents('19800.00'), note: 'Accepted quotation selling price, AUD excluding GST.'}}
      },
      approvedChanges: [], commercial: [],
      basisSelection: {declared: true, includeChanges: [], acknowledgedMissingCost: [],
        declaredAt: '2026-09-11T05:00:00Z', declaredBy: 'Jordan Blake',
        note: 'Accepted basis declared. The actual side cannot yet be expressed on this basis.'},
      lines: [line('l1', 'SCR-DRIVEPIPE', 'Drive pipe supply', 'm', 'accepted', '640', '18.75')],
      observations: [
        observation({id: 'o1', ref: 'SYN-INV-EU-4471', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-EU-4471', lineRef: 'Line 1', description: 'Drive pipe supply invoiced in EUR by mass',
          scopeRef: 'SYN-PPO-PRJ-024140', category: 'Supplier invoice', quantityClass: 'Invoiced',
          qty: qty('1184'), unit: 'kg', rate: cents('6.40'), amount: extend(qty('1184'), cents('6.40')),
          currency: 'EUR', date: '2026-07-24', sourceStatus: 'Posted',
          reviewer: 'Priya Raman',
          question: 'Currency differs from the comparison basis and the unit differs from the estimate. Both need a documented conversion basis before any numeric comparison.'})
      ],
      mappings: [], conversions: [], explanations: [], findings: [], handovers: [], actions: [], decisions: [],
      outstanding: [
        {id: 'ou1', type: 'Conversion basis', label: 'No approved exchange-rate source or date for EUR to AUD',
          amount: null, status: 'Open', owner: 'Priya Raman', due: '2026-09-30',
          evidence: 'D-017 is open; no exchange-rate definition is adopted.'},
        {id: 'ou2', type: 'Conversion basis', label: 'No reviewed kilogram-to-metre conversion for this pipe reference',
          amount: null, status: 'Open', owner: 'Dana Okafor', due: '2026-09-30',
          evidence: 'A mass-to-length conversion requires a reviewed product specification, not a description match.'}
      ],
      history: [
        {id: 'h1', at: '2026-09-11T05:00:00Z', actor: 'Jordan Blake', type: 'basis', description: 'Accepted basis declared; actual side held as incomparable.'}
      ]
    };
  }

  function willowbankPump() {
    const accepted = [
      basisLine('PMP-UNIT', 'Replacement irrigation pump', 'EA', '1', '6240.00'),
      basisLine('PMP-INST', 'Pump replacement labour', 'h', '16', '68.00'),
      basisLine('FRT-LOCAL', 'Local freight', 'lot', '1', '480.00')
    ];
    return {
      id: 'ear-5', ref: 'SYN-EAR-0005', title: 'Irrigation pump replacement',
      customerId: 'org-willowbank', customer: 'Willowbank Horticulture', site: 'Willowbank · Nursery & propagation',
      siteRef: 'SYN-PPO-SITE-000050', facility: 'SYN-FAC-WB-IRR01', equipmentFamily: 'Fertigation and irrigation',
      workCategory: 'Planned service — equipment replacement',
      deliveryType: 'Project', deliveryRef: 'SYN-PPO-PRJ-024001',
      opportunityRef: 'SYN-PPO-OPP-000095', estimateRef: 'SYN-PPO-EST-000095', option: 'SYN-OPT-A',
      acceptedQuoteRef: 'SYN-PPO-QUO-000095', acceptedIssue: 'R01', acceptedAt: '2026-08-04',
      estimator: 'Dana Okafor', deliveryOwner: 'Jordan Blake', reviewOwner: 'Sam Whitfield',
      scopeCutOff: '2026-09-05', reportingCutOff: '2026-09-05',
      state: 'AwaitingEvidence',
      stateReason: 'Delivery is complete; the freight invoice has not been posted and the reviewed labour is still in Service review.',
      completeness: 'Partial', completenessReason: 'Two sources are still open at the cut-off.',
      materiality: null, financeValidated: false, refreshRequired: false,
      supersedes: null, supersededBy: null, sourceRevision: 1, snapshotVersion: 1,
      comparison: {currency: 'AUD', taxBasis: 'Excluding GST', quantityClass: 'Used / reviewed quantity',
        costDefinition: 'PPO reviewed operational quantities valued at recorded supplier and labour source rates.'},
      bases: {
        issued: {id: 'EV-r01', label: 'Issued estimate cost version', versionRef: 'SYN-PPO-EST-000095 · cost version r01',
          savedAt: '2026-07-28T00:40:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3611', supplier: 'Synthetic pump supply', validUntil: '2026-09-30', scope: 'Pump unit', currency: 'AUD'}],
          price: {total: cents('11400.00'), note: 'Issued quoted selling price, AUD excluding GST.'}},
        accepted: {id: 'EV-r01', label: 'Accepted scope cost version', versionRef: 'SYN-PPO-EST-000095 · cost version r01',
          savedAt: '2026-07-28T00:40:00Z', costSchema: 'schema 1 — Product / Labour / Freight',
          calculator: 'Manual E1 entry', option: 'SYN-OPT-A', lines: accepted,
          supplierSources: [{ref: 'SYN-SUP-Q-3611', supplier: 'Synthetic pump supply', validUntil: '2026-09-30', scope: 'Pump unit', currency: 'AUD'}],
          price: {total: cents('11400.00'), note: 'Accepted quotation selling price, AUD excluding GST.'}}
      },
      approvedChanges: [], commercial: [],
      basisSelection: {declared: false, includeChanges: [], acknowledgedMissingCost: [], declaredAt: null, declaredBy: null, note: ''},
      lines: [
        line('l1', 'PMP-UNIT', 'Replacement irrigation pump', 'EA', 'accepted', '1', '6240.00'),
        line('l2', 'PMP-INST', 'Pump replacement labour', 'h', 'accepted', '16', '68.00'),
        line('l3', 'FRT-LOCAL', 'Local freight', 'lot', 'accepted', '1', '480.00')
      ],
      observations: [
        observation({id: 'o1', ref: 'SYN-INV-88301', system: 'MYOB Acumatica (simulated read)', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-INV-88301', lineRef: 'Line 1', description: 'Replacement pump unit invoiced',
          scopeRef: 'SYN-PPO-PRJ-024001', category: 'Supplier invoice', quantityClass: 'Invoiced',
          qty: qty('1'), unit: 'EA', rate: cents('6595.00'), amount: cents('6595.00'),
          date: '2026-08-27', sourceStatus: 'Posted', dedupeKey: 'pump:SYN-INV-88301',
          treatment: 'Included', treatmentReason: 'Supplier invoice names the project.'}),
        observation({id: 'o2', ref: 'SYN-LAB-3455', system: 'PPO Service review', entity: 'Powerplants Australia (synthetic)',
          recordRef: 'SYN-PPO-RPT-024001', lineRef: 'Captured labour', description: 'Captured field labour awaiting Service review',
          scopeRef: 'SYN-PPO-PRJ-024001', category: 'Labour', quantityClass: 'Used',
          qty: qty('19'), unit: 'h', rate: cents('68.00'), amount: extend(qty('19'), cents('68.00')),
          date: '2026-09-02', sourceStatus: 'Captured — not reviewed',
          reviewer: 'Jordan Blake', question: 'Captured hours are not reviewed hours. Hold until Service review completes.'})
      ],
      mappings: [
        {id: 'm1', observationId: 'o1', lineId: 'l1', share: 1, basis: 'direct', reason: 'Invoice names the project and the unit.'}
      ],
      conversions: [], explanations: [], findings: [], handovers: [], actions: [], decisions: [],
      outstanding: [
        {id: 'ou1', type: 'Cost evidence', label: 'Local freight invoice not posted at the cut-off',
          amount: null, status: 'Open', owner: 'Priya Raman', due: '2026-09-30',
          evidence: 'Carrier confirmed delivery; no invoice document exists at the cut-off.'}
      ],
      history: [
        {id: 'h1', at: '2026-09-12T02:00:00Z', actor: 'Jordan Blake', type: 'open', description: 'Outcome review opened after delivery completion.'}
      ]
    };
  }

  function seed() {
    return {schema: SCHEMA, version: 1, today: TODAY, receipts: [],
      reviews: [northbankScreens(), northbankController(), greenhavenQuantityOnly(), cedarValeIncomparable(), willowbankPump()]};
  }

  /* --------------------------------------------------------- derivations */
  const review = (state, id) => state.reviews.find(r => r.id === id);
  const lineOf = (r, id) => r.lines.find(l => l.id === id);
  const obsOf = (r, id) => r.observations.find(o => o.id === id);
  const mappedShare = (r, observationId) => r.mappings.filter(m => m.observationId === observationId).reduce((sum, m) => sum + m.share, 0);

  /* A comparison line is in the declared basis when it comes from the accepted
     cost version, or from an approved change the preparer deliberately included. */
  function lineBasisState(r, l) {
    if (l.source === 'accepted') return {inBasis: true, kind: 'Accepted cost version'};
    const change = r.approvedChanges.find(c => c.id === l.source);
    if (!change) return {inBasis: false, kind: 'Unknown source'};
    if (change.costBasisRecorded) {
      return r.basisSelection.includeChanges.includes(change.id)
        ? {inBasis: true, kind: `Approved change ${change.ref}`, change}
        : {inBasis: false, kind: `Approved change ${change.ref} — not included in the declared basis`, change};
    }
    return {inBasis: false, kind: `Approved change ${change.ref} — no recorded cost basis`, change, noCostBasis: true};
  }

  function basisTotals(r) {
    const sum = lines => lines.reduce((total, l) => l.cost === null ? total : total + l.cost, 0);
    const complete = lines => lines.every(l => l.cost !== null);
    const issued = r.bases.issued.lines, accepted = r.bases.accepted.lines;
    const included = r.approvedChanges.filter(c => r.basisSelection.includeChanges.includes(c.id) && c.costBasisRecorded);
    const changeCost = included.reduce((total, c) => total + sum(c.lines || []), 0);
    return {
      issued: complete(issued) ? sum(issued) : null,
      accepted: complete(accepted) ? sum(accepted) : null,
      changeCost,
      comparison: complete(accepted) ? sum(accepted) + changeCost : null,
      includedChanges: included.map(c => c.ref),
      missingCostChanges: r.approvedChanges.filter(c => !c.costBasisRecorded).map(c => c.ref)
    };
  }

  /* Actual cost attributed to a comparison line, on the declared comparison basis.
     Only Included observations contribute. Shares are applied to the source amount
     and each share is rounded HALF_UP to cents. */
  function lineActual(r, lineId) {
    const line_ = lineOf(r, lineId);
    let cost = 0, quantityTotal = 0, costKnown = true, quantityKnown = true, contributors = [];
    r.mappings.filter(m => m.lineId === lineId).forEach(m => {
      const o = obsOf(r, m.observationId);
      if (!o || o.treatment !== 'Included') return;
      contributors.push({mapping: m, observation: o});
      if (o.amount === null) costKnown = false; else cost += halfUp(o.amount * Math.round(m.share * 1000), 1000);
      if (o.qty === null || o.unit !== line_.unit) quantityKnown = false; else quantityTotal += halfUp(o.qty * Math.round(m.share * 1000), 1000);
    });
    return {
      contributors,
      cost: contributors.length && costKnown ? cost : null,
      qty: contributors.length && quantityKnown ? quantityTotal : null,
      rate: (contributors.length && costKnown && quantityKnown && quantityTotal !== 0) ? halfUp(cost * 1000, quantityTotal) : null
    };
  }

  /* Sign convention: variance = actual - estimated. Positive means more cost than
     the declared basis. Percentage uses the estimated amount on that basis as an
     explicit denominator; a zero, missing or unsuitable denominator yields null. */
  function lineComparison(r, lineId) {
    const l = lineOf(r, lineId), actual = lineActual(r, lineId);
    const estCost = l.estCost, estQty = l.estQty, estRate = l.estRate;
    const out = {
      line: l, actual, estCost, estQty, estRate, basis: lineBasisState(r, l),
      costVariance: (estCost === null || actual.cost === null) ? null : actual.cost - estCost,
      qtyVariance: (estQty === null || actual.qty === null) ? null : actual.qty - estQty,
      percent: null, percentReason: '', decomposition: null, comparable: 'Cost and quantity'
    };
    if (estCost === null && actual.cost !== null) out.comparable = 'Actual only — no estimated cost basis';
    else if (estCost !== null && actual.cost === null) out.comparable = 'Estimated only — no established actual cost';
    else if (estCost === null && actual.cost === null) out.comparable = estQty === null ? 'Not comparable' : 'Quantity only';
    if (out.costVariance !== null) {
      if (estCost === 0) out.percentReason = 'No percentage — the estimated basis for this line is zero.';
      else out.percent = Math.round((out.costVariance / estCost) * 10000) / 100;
    } else out.percentReason = 'No percentage — the cost comparison is not established on both sides.';
    if (out.costVariance !== null && estQty !== null && estRate !== null && actual.qty !== null && actual.rate !== null && estQty !== 0) {
      const dq = actual.qty - estQty, dr = actual.rate - estRate;
      const quantityEffect = halfUp(dq * estRate, 1000);
      const rateEffect = halfUp(dr * estQty, 1000);
      const jointEffect = halfUp(dq * dr, 1000);
      const residual = out.costVariance - (quantityEffect + rateEffect + jointEffect);
      out.decomposition = {quantityEffect, rateEffect, jointEffect, residual,
        reconciles: quantityEffect + rateEffect + jointEffect + residual === out.costVariance};
    }
    return out;
  }

  function totals(r) {
    const basis = basisTotals(r);
    let estimated = 0, actual = 0, comparableLines = 0, withheld = [];
    let actualWithoutBasis = 0, estimatedWithoutActual = 0, outsideBasis = 0;
    r.lines.forEach(l => {
      const c = lineComparison(r, l.id);
      if (!c.basis.inBasis) {
        if (c.basis.noCostBasis && c.actual.cost !== null) {
          actualWithoutBasis += c.actual.cost;
          withheld.push({lineId: l.id, reason: 'Approved change with no recorded estimating cost basis; variance cannot be computed'});
        } else {
          outsideBasis += (c.actual.cost || 0);
          withheld.push({lineId: l.id, reason: 'Outside the declared comparison basis'});
        }
        return;
      }
      if (c.estCost !== null && c.actual.cost !== null) { estimated += c.estCost; actual += c.actual.cost; comparableLines++; }
      else if (c.estCost === null && c.actual.cost !== null) { actualWithoutBasis += c.actual.cost; withheld.push({lineId: l.id, reason: 'No estimated cost basis recorded'}); }
      else if (c.estCost !== null && c.actual.cost === null) { estimatedWithoutActual += c.estCost; withheld.push({lineId: l.id, reason: 'No established actual cost'}); }
      else withheld.push({lineId: l.id, reason: 'Neither side established'});
    });
    const unmapped = r.observations.filter(o => o.treatment === 'Included' && mappedShare(r, o.id) < 0.9995)
      .map(o => ({id: o.id, ref: o.ref, amount: o.amount === null ? null : halfUp(o.amount * Math.round((1 - mappedShare(r, o.id)) * 1000), 1000), reason: o.unmappedReason}));
    const commitments = r.observations.filter(o => o.treatment === 'Commitment');
    const unresolved = r.observations.filter(o => o.treatment === 'Unresolved');
    const deliveryVariance = comparableLines ? actual - estimated : null;
    return {
      basis, estimated: comparableLines ? estimated : null, actual: comparableLines ? actual : null,
      comparableLines, withheld, actualWithoutBasis, estimatedWithoutActual, outsideBasis,
      deliveryVariance,
      deliveryPercent: (deliveryVariance !== null && estimated !== 0) ? Math.round((deliveryVariance / estimated) * 10000) / 100 : null,
      scopeMovement: (basis.issued !== null && basis.accepted !== null) ? basis.accepted - basis.issued : null,
      approvedChangeCost: basis.changeCost,
      totalAgainstIssued: (basis.issued !== null && comparableLines) ? actual - basis.issued : null,
      unmapped, unmappedTotal: unmapped.reduce((s, u) => s + (u.amount || 0), 0),
      commitments, commitmentTotal: commitments.reduce((s, o) => s + (o.amount || 0), 0),
      unresolved, unresolvedTotal: unresolved.reduce((s, o) => s + Math.abs(o.amount || 0), 0),
      outstandingTotal: r.outstanding.filter(o => o.status === 'Open' && o.amount !== null).reduce((s, o) => s + o.amount, 0),
      commercial: commercialTotals(r)
    };
  }

  function commercialTotals(r) {
    const issued = r.bases.issued.price ? r.bases.issued.price.total : null;
    const accepted = r.bases.accepted.price ? r.bases.accepted.price.total : null;
    const changes = r.approvedChanges.reduce((s, c) => s + (c.price || 0), 0);
    return {
      issued, accepted, changes,
      negotiationMovement: (issued === null || accepted === null) ? null : accepted - issued,
      components: r.commercial.map(c => ({type: c.type, amount: c.amount, reason: c.reason, at: c.at, evidence: c.evidence})),
      acceptedPlusChanges: accepted === null ? null : accepted + changes,
      marginAvailable: false,
      marginReason: 'No approved margin definition exists. D-017 leaves posted cost, committed cost, overhead treatment and margin undefined, so no margin or profitability figure is computed here.'
    };
  }

  /* Identity check enforced before conclusion:
     total cost variance against the issued basis
       = scope movement at acceptance + approved change cost basis + delivery variance */
  function identity(r) {
    const t = totals(r);
    if (t.totalAgainstIssued === null || t.scopeMovement === null || t.deliveryVariance === null) {
      return {available: false, reason: 'One of the three bases is not fully established on both sides.'};
    }
    if (t.estimated !== t.basis.comparison) {
      return {available: false, reason: 'Not every line of the declared comparison basis has an established actual cost, so the three comparisons cannot be reconciled.'};
    }
    const sum = t.scopeMovement + t.approvedChangeCost + t.deliveryVariance;
    return {available: true, total: t.totalAgainstIssued, scopeMovement: t.scopeMovement,
      approvedChangeCost: t.approvedChangeCost, deliveryVariance: t.deliveryVariance,
      sum, reconciles: sum === t.totalAgainstIssued};
  }

  function explainedShare(r, lineId) {
    return r.explanations.filter(e => e.lineId === lineId).reduce((s, e) => s + e.share, 0);
  }

  function materialLines(r) {
    if (!r.materiality) return [];
    return r.lines.filter(l => {
      const c = lineComparison(r, l.id);
      if (c.costVariance === null) return false;
      const size = Math.abs(c.costVariance);
      const pct = c.estCost ? size / c.estCost : 1;
      return size >= r.materiality.amount || pct >= r.materiality.percent / 100;
    });
  }

  function duplicateConflicts(r) {
    const seen = new Map(), conflicts = [];
    r.observations.filter(o => o.treatment === 'Included' && o.dedupeKey).forEach(o => {
      if (seen.has(o.dedupeKey)) conflicts.push({key: o.dedupeKey, refs: [seen.get(o.dedupeKey).ref, o.ref]});
      else seen.set(o.dedupeKey, o);
    });
    return conflicts;
  }

  function submitBlockers(r) {
    const blockers = [];
    if (!r.basisSelection.declared) blockers.push('Declare the comparison basis before submitting.');
    r.approvedChanges.forEach(c => {
      if (c.costBasisRecorded && !r.basisSelection.includeChanges.includes(c.id)) blockers.push(`${c.ref}: approved change is neither included nor excluded from the comparison basis.`);
      if (!c.costBasisRecorded && !r.basisSelection.acknowledgedMissingCost.includes(c.id)) blockers.push(`${c.ref}: approved change has no recorded cost basis and has not been acknowledged.`);
    });
    r.observations.forEach(o => {
      if (o.treatment === 'Undecided') blockers.push(`${o.ref}: source observation has no recorded treatment.`);
      if (o.treatment === 'Included' && o.currency !== r.comparison.currency && !r.conversions.some(c => c.observationId === o.id)) blockers.push(`${o.ref}: ${o.currency} cannot be compared with ${r.comparison.currency} without a reviewed conversion basis.`);
      if (o.treatment === 'Included' && mappedShare(r, o.id) < 0.9995 && !o.unmappedReason) blockers.push(`${o.ref}: an unallocated remainder needs a recorded reason.`);
      if (o.treatment === 'Included' && mappedShare(r, o.id) > 1.0005) blockers.push(`${o.ref}: allocated shares exceed the source record.`);
    });
    duplicateConflicts(r).forEach(c => blockers.push(`Possible duplicate: ${c.refs.join(' and ')} share the source key ${c.key}. Exclude one with a reason.`));
    if (!COMPLETENESS.includes(r.completeness)) blockers.push('Declare source completeness.');
    if (r.completeness !== 'Complete' && !r.completenessReason) blockers.push('Record why the sources are not complete.');
    return blockers;
  }

  function concludeBlockers(r) {
    const blockers = [];
    if (r.state !== 'InReview') blockers.push('Claim the review before concluding it.');
    if (!r.materiality) blockers.push('Declare the materiality basis used for attribution.');
    if (r.refreshRequired) blockers.push('Sources changed after the comparison was captured; refresh the comparison first.');
    r.observations.filter(o => o.treatment === 'Unresolved').forEach(o => blockers.push(`${o.ref}: an unresolved source cannot remain in a concluded comparison.`));
    materialLines(r).forEach(l => { if (explainedShare(r, l.id) <= 0) blockers.push(`${l.code}: a material variance needs at least one reviewed reason.`); });
    return blockers;
  }

  const provisionalReasons = r => {
    const reasons = [];
    r.outstanding.filter(o => o.status === 'Open').forEach(o => reasons.push(`${o.type}: ${o.label}`));
    if (r.completeness !== 'Complete') reasons.push(`Source completeness is ${r.completeness}.`);
    if (r.lines.some(l => lineComparison(r, l.id).comparable !== 'Cost and quantity')) reasons.push('At least one line is not comparable on both sides.');
    return reasons;
  };

  function validate(state) {
    assert(state && state.schema === SCHEMA, 'Saved session is not a supported outcome-review session.');
    assert(Array.isArray(state.reviews) && state.reviews.length > 0, 'Saved session has no outcome reviews.');
    state.reviews.forEach(r => {
      assert(STATES.includes(r.state), `${r.ref}: unsupported review state.`);
      assert(COMPLETENESS.includes(r.completeness), `${r.ref}: unsupported completeness declaration.`);
      r.observations.forEach(o => {
        assert(TREATMENTS.includes(o.treatment), `${o.ref}: unsupported treatment.`);
        assert(QUANTITY_CLASSES.includes(o.quantityClass), `${o.ref}: unsupported quantity class.`);
      });
      r.mappings.forEach(m => {
        assert(obsOf(r, m.observationId), `${r.ref}: mapping references an unknown source observation.`);
        assert(lineOf(r, m.lineId), `${r.ref}: mapping references an unknown comparison line.`);
        assert(m.share > 0 && m.share <= 1, `${r.ref}: an allocation share must be greater than zero and at most one.`);
      });
      r.explanations.forEach(e => {
        assert(lineOf(r, e.lineId), `${r.ref}: explanation references an unknown line.`);
        assert(REASONS.some(x => x.code === e.code), `${r.ref}: unsupported reason code.`);
      });
      r.lines.forEach(l => assert(explainedShare(r, l.id) <= 1.0005, `${l.code}: attributed shares exceed the variance.`));
    });
    return state;
  }

  /* ------------------------------------------------------------ commands */
  let counter = 0;
  const session = Date.now().toString(36).slice(-4);
  const uid = prefix => `${prefix}-${session}-${String(++counter).padStart(3, '0')}`;
  const stamp = () => new Date().toISOString();

  function command(state, cmd, role) {
    assert(cmd && typeof cmd.op === 'string' && cmd.op.length >= 6, 'A command needs a stable operation identity.');
    const signature = JSON.stringify({type: cmd.type, reviewId: cmd.reviewId, payload: cmd.payload || {}, role});
    const prior = state.receipts.find(receipt => receipt.op === cmd.op);
    if (prior) {
      assert(prior.signature === signature, 'That operation identity was already accepted with different content.');
      return {state, recovered: true, receipt: prior};
    }
    assert(can(role, cmd.type), `The ${roles[role] ? roles[role].title : 'selected'} role cannot perform this action.`);
    const next = clone(state);
    const r = review(next, cmd.reviewId);
    assert(r, 'Choose an existing outcome review.');
    assert(cmd.expectedVersion === next.version, 'The workspace changed since this form was opened. Reload the comparison and try again.');
    const x = cmd.payload || {}, at = cmd.at || stamp(), actor = roles[role].name;
    let description = '', resultId = null;

    if (cmd.type === 'selectBasis') {
      assert(Array.isArray(x.includeChanges), 'Select which approved changes belong in the comparison basis.');
      assert(Array.isArray(x.acknowledgedMissingCost), 'Acknowledge approved changes that have no cost basis.');
      x.includeChanges.forEach(id => {
        const c = r.approvedChanges.find(c => c.id === id);
        assert(c, 'Choose an existing approved change.');
        assert(c.costBasisRecorded, `${c.ref}: this approved change has no recorded cost basis and cannot be added to the comparison basis. Its selling price is not a cost budget.`);
      });
      r.approvedChanges.filter(c => !c.costBasisRecorded).forEach(c => {
        assert(!x.includeChanges.includes(c.id), `${c.ref}: cost basis is not recorded.`);
      });
      r.basisSelection = {declared: true, includeChanges: x.includeChanges.slice(), acknowledgedMissingCost: x.acknowledgedMissingCost.slice(),
        declaredAt: at, declaredBy: actor, note: text(x.note, 'Basis note')};
      r.lines.forEach(l => { if (l.source.startsWith('var-')) l.excluded = !x.includeChanges.includes(l.source); });
      description = 'Comparison basis declared';
    } else if (cmd.type === 'treat') {
      const o = obsOf(r, x.id); assert(o, 'Choose an existing source observation.');
      const treatment = pick(x.treatment, ['Included', 'Excluded', 'Commitment', 'Unresolved'], 'treatment');
      assert(!(treatment === 'Included' && o.category === 'Commitment'), 'A purchase commitment is not an incurred cost and cannot be included as actual cost.');
      assert(!(treatment === 'Included' && o.category === 'Customer billing'), 'Customer invoices and payments are not job costs.');
      assert(!(treatment === 'Included' && o.sourceStatus === 'Captured — not reviewed'), 'Captured quantities are not reviewed quantities. Complete the source review first.');
      o.treatment = treatment; o.treatmentReason = text(x.reason, 'Treatment reason');
      if (treatment !== 'Included') { r.mappings = r.mappings.filter(m => m.observationId !== o.id); o.unmappedReason = ''; }
      if (typeof x.unmappedReason === 'string' && x.unmappedReason.trim()) o.unmappedReason = text(x.unmappedReason, 'Unallocated remainder reason');
      description = `Source treatment recorded: ${treatment}`; resultId = o.id;
    } else if (cmd.type === 'map') {
      const o = obsOf(r, x.observationId), l = lineOf(r, x.lineId);
      assert(o && l, 'Choose an existing source observation and comparison line.');
      assert(o.treatment === 'Included', 'Only an included source observation can be allocated to a comparison line.');
      const share = Number(x.share);
      assert(Number.isFinite(share) && share > 0 && share <= 1, 'Enter an allocation share greater than 0 and at most 1.');
      const basisEntry = ALLOCATION_BASES.find(b => b.id === pick(x.basis, ALLOCATION_BASES.map(b => b.id), 'allocation basis'));
      assert(basisEntry.adopted || (typeof x.reason === 'string' && x.reason.trim().length >= 20),
        'A shared cost needs a recorded allocation basis and a reason of at least 20 characters. An equal split is never applied by default.');
      if (o.unit && l.unit && o.unit !== l.unit) {
        assert(r.conversions.some(c => c.observationId === o.id && c.toUnit === l.unit),
          `${o.unit} and ${l.unit} cannot be compared without a reviewed conversion. A similar description is not a conversion.`);
      }
      assert(o.currency === r.comparison.currency || r.conversions.some(c => c.observationId === o.id && c.toCurrency === r.comparison.currency),
        `${o.currency} cannot be allocated to a ${r.comparison.currency} comparison without a documented conversion basis.`);
      const existing = mappedShare(r, o.id);
      assert(existing + share <= 1.0005, 'Allocated shares would exceed the source record.');
      assert(!r.mappings.some(m => m.observationId === o.id && m.lineId === l.id), 'That source is already allocated to this line.');
      r.mappings.push({id: uid('MAP'), observationId: o.id, lineId: l.id, share, basis: basisEntry.id, reason: text(x.reason, 'Allocation reason', 10)});
      description = `Source allocated to ${l.code}`;
    } else if (cmd.type === 'unmap') {
      const before = r.mappings.length;
      r.mappings = r.mappings.filter(m => m.id !== x.id);
      assert(r.mappings.length < before, 'Choose an existing allocation.');
      description = 'Allocation removed';
    } else if (cmd.type === 'conversion') {
      const o = obsOf(r, x.observationId); assert(o, 'Choose an existing source observation.');
      r.conversions.push({id: uid('CONV'), observationId: o.id, toUnit: x.toUnit || null, toCurrency: x.toCurrency || null,
        factor: text(String(x.factor || ''), 'Conversion factor', 1), source: text(x.source, 'Conversion source'), actor, at});
      description = 'Reviewed conversion basis recorded';
    } else if (cmd.type === 'completeness') {
      r.completeness = pick(x.completeness, COMPLETENESS, 'completeness declaration');
      r.completenessReason = r.completeness === 'Complete' ? '' : text(x.reason, 'Completeness reason');
      description = `Source completeness declared: ${r.completeness}`;
    } else if (cmd.type === 'submit') {
      const blockers = submitBlockers(r); assert(blockers.length === 0, blockers.join(' · '));
      assert(['Draft', 'AwaitingEvidence', 'Returned'].includes(r.state), 'This review is not in a state that can be submitted.');
      r.state = 'ReadyForReview'; r.stateReason = text(x.reason, 'Submission note');
      r.snapshotVersion++;
      description = 'Submitted for review';
    } else if (cmd.type === 'claim') {
      assert(r.state === 'ReadyForReview', 'Only a submitted review can be claimed.');
      r.state = 'InReview'; r.reviewOwner = actor;
      r.decisions.push({id: uid('DEC'), at, actor, decision: 'Claimed for review', reason: text(x.reason, 'Claim note')});
      description = 'Review claimed';
    } else if (cmd.type === 'return') {
      assert(r.state === 'InReview', 'Only a claimed review can be returned.');
      r.state = 'Returned'; r.stateReason = text(x.reason, 'Return reason');
      r.decisions.push({id: uid('DEC'), at, actor, decision: 'Returned for correction', reason: r.stateReason});
      description = 'Returned for correction';
    } else if (cmd.type === 'materiality') {
      const percent = Number(x.percent), amount = cents(x.amount, 'Materiality amount');
      assert(Number.isFinite(percent) && percent > 0 && percent <= 100, 'Enter a materiality percentage between 0 and 100.');
      r.materiality = {basis: 'percent-or-amount', percent, amount, note: text(x.note, 'Materiality note')};
      description = 'Materiality basis declared for this review';
    } else if (cmd.type === 'explain') {
      const l = lineOf(r, x.lineId); assert(l, 'Choose an existing comparison line.');
      const c = lineComparison(r, l.id);
      assert(c.costVariance !== null || c.qtyVariance !== null || c.actual.cost !== null,
        'A reason can only be attached to an established difference or an established attributable actual.');
      const code = pick(x.code, REASONS.map(x => x.code), 'reason code');
      const share = Number(x.share);
      assert(Number.isFinite(share) && share > 0 && share <= 1, 'Enter a contribution share greater than 0 and at most 1.');
      assert(!r.explanations.some(e => e.lineId === l.id && e.code === code), 'That reason is already recorded for this line.');
      assert(explainedShare(r, l.id) + share <= 1.0005, 'Attributed shares would exceed the observed difference. Leave the remainder unexplained instead.');
      r.explanations.push({id: uid('EXP'), lineId: l.id, code, share, note: text(x.note, 'Reviewed explanation'), actor, at});
      description = `Reviewed explanation recorded against ${l.code}`;
    } else if (cmd.type === 'finding') {
      const evidence = Array.isArray(x.evidence) ? x.evidence.filter(id => lineOf(r, id)) : [];
      assert(evidence.length > 0, 'A finding must cite at least one comparison line as its evidence.');
      const finding = {id: uid('FIND'), at, actor, title: text(x.title, 'Finding title'),
        evidence, family: text(x.family, 'Equipment family or work type', 3), workType: r.workCategory,
        issue: text(x.issue, 'Observed issue'), explanation: text(x.explanation, 'Reviewed explanation'),
        limitations: text(x.limitations, 'Applicability and limitations'),
        proposal: text(x.proposal, 'Proposed improvement'),
        owner: pick(x.owner, people, 'owner'), due: date(x.due),
        specialistReview: text(x.specialistReview, 'Required specialist or commercial review'),
        relatedCases: Array.isArray(x.relatedCases) ? x.relatedCases.slice(0, 10) : [],
        state: 'Suggestion', outcome: ''};
      r.findings.push(finding); resultId = finding.id; description = 'Improvement suggestion recorded';
    } else if (cmd.type === 'findingReview') {
      const f = r.findings.find(f => f.id === x.id); assert(f, 'Choose an existing finding.');
      assert(f.state === 'Suggestion', 'Only a suggestion can be promoted to a reviewed proposal.');
      f.state = 'Reviewed proposal'; f.outcome = text(x.reason, 'Review outcome');
      description = 'Suggestion reviewed and recorded as a proposal';
    } else if (cmd.type === 'handover') {
      const f = r.findings.find(f => f.id === x.id); assert(f, 'Choose an existing finding.');
      assert(f.state === 'Reviewed proposal', 'Only a reviewed proposal can be prepared for ES-10.');
      assert(!r.handovers.some(h => h.findingId === f.id), 'That proposal already has a prepared ES-10 handover.');
      r.handovers.push({id: uid('HAND'), at, actor, target: 'ES-10 Reference cases and calibration proposals',
        findingId: f.id, status: 'Prepared locally', note: text(x.note, 'Receiving note')});
      f.state = 'Handed to ES-10';
      f.outcome = 'Prepared locally for ES-10. No formula, input range, parts mapping, labour rate, catalogue price, estimate, quotation or historical result is changed by this handover.';
      description = 'ES-10 handover prepared locally';
    } else if (cmd.type === 'conclude') {
      const blockers = concludeBlockers(r); assert(blockers.length === 0, blockers.join(' · '));
      const provisional = provisionalReasons(r);
      const requested = pick(x.outcome, ['Reviewed', 'ReviewedProvisional'], 'review outcome');
      assert(!(requested === 'Reviewed' && provisional.length > 0),
        `This review cannot be concluded as complete while matters remain open: ${provisional.join(' · ')}`);
      r.state = requested; r.stateReason = text(x.reason, 'Conclusion basis');
      r.concluded = {at, actor, outcome: requested, snapshotVersion: r.snapshotVersion, basis: clone(r.basisSelection),
        totals: totals(r), identity: identity(r), provisional};
      r.decisions.push({id: uid('DEC'), at, actor, decision: STATE_LABELS[requested], reason: r.stateReason});
      description = `Review concluded: ${STATE_LABELS[requested]}`;
    } else if (cmd.type === 'notComparable') {
      assert(r.state !== 'Reviewed' && r.state !== 'ReviewedProvisional', 'A concluded review is recorded through a successor, not by relabelling it.');
      r.state = 'NotComparable'; r.stateReason = text(x.reason, 'Not-comparable reason');
      r.decisions.push({id: uid('DEC'), at, actor, decision: 'Recorded as not comparable', reason: r.stateReason});
      description = 'Recorded as not comparable and excluded from aggregates';
    } else if (cmd.type === 'financeValidate') {
      r.financeValidated = x.confirm === true;
      assert(r.financeValidated, 'Confirm the cost definition and quantity class before validating.');
      r.comparison.costDefinition = text(x.definition, 'Cost definition');
      r.decisions.push({id: uid('DEC'), at, actor, decision: 'Finance validated the declared basis', reason: text(x.reason, 'Validation basis')});
      description = 'Finance validated the declared comparison basis';
    } else if (cmd.type === 'outstanding') {
      const item = {id: uid('OUT'), type: pick(x.type, ['Supplier recovery', 'Customer credit', 'Allocation decision', 'Cost evidence', 'Conversion basis', 'Unmapped actual', 'Correction'], 'outstanding type'),
        label: text(x.label, 'Outstanding matter'), amount: (x.amount === '' || x.amount === null || x.amount === undefined) ? null : cents(x.amount, 'Amount'),
        status: 'Open', owner: pick(x.owner, people, 'owner'), due: date(x.due), evidence: text(x.evidence, 'Evidence')};
      r.outstanding.push(item); resultId = item.id; description = 'Outstanding financial matter recorded';
    } else if (cmd.type === 'sourceChange') {
      r.sourceRevision++; r.refreshRequired = true;
      const note = text(x.reason, 'Source change');
      if (x.observationId) {
        const o = obsOf(r, x.observationId);
        assert(o, 'Choose an existing source observation.');
        o.sourceVersion++; o.observedAt = at.slice(0, 10);
        if (x.amount !== undefined && x.amount !== '') o.amount = cents(x.amount, 'Amount');
        if (x.sourceStatus) o.sourceStatus = x.sourceStatus;
      }
      r.history.push({id: uid('EVT'), at, actor, type: 'sourceChange', description: note});
      description = 'Source evidence changed after the comparison was captured';
    } else if (cmd.type === 'successor') {
      assert(['Reviewed', 'ReviewedProvisional'].includes(r.state), 'A successor review follows a concluded review.');
      assert(!r.supersededBy, 'This review already has a successor.');
      const copy = clone(r);
      copy.id = `${r.id}-s${next.reviews.length}`; copy.ref = `${r.ref}-S2`;
      copy.state = 'Draft'; copy.stateReason = text(x.reason, 'Successor reason');
      copy.supersedes = r.id; copy.supersededBy = null; copy.concluded = null;
      copy.refreshRequired = false; copy.snapshotVersion = 1;
      copy.decisions = []; copy.history = [{id: uid('EVT'), at, actor, type: 'open', description: `Successor review opened from ${r.ref}.`}];
      r.supersededBy = copy.id;
      next.reviews.push(copy); resultId = copy.id;
      description = `Successor review ${copy.ref} opened; the earlier reviewed result is preserved`;
    } else if (cmd.type === 'action') {
      const title = text(x.title, 'Action title');
      assert(!r.actions.some(a => a.status !== 'Closed' && a.title.toLowerCase() === title.toLowerCase()), 'That open action already exists for this review.');
      r.actions.push({id: uid('ACT'), title, owner: pick(x.owner, people, 'owner'), due: date(x.due),
        status: 'Open', reason: text(x.reason, 'Action reason'), actor, at});
      description = 'Owned follow-up recorded';
    }

    next.version++;
    r.history.push({id: uid('EVT'), at, actor, type: cmd.type, description});
    const receipt = {op: cmd.op, signature, resultId, at, version: next.version, reviewId: r.id, description};
    next.receipts.push(receipt);
    validate(next);
    return {state: next, recovered: false, receipt};
  }

  root.EAR_MODEL = {
    TODAY, SCHEMA, clone, roles, people, can, seesRestricted,
    REASONS, ALLOCATION_BASES, TREATMENTS, QUANTITY_CLASSES, COMPLETENESS, STATES, STATE_LABELS, FINDING_STATES,
    cents, qty, extend, halfUp, money, quantity,
    seed, validate, command,
    review, lineOf, obsOf, mappedShare, basisTotals, lineBasisState, lineActual, lineComparison, totals, commercialTotals,
    identity, explainedShare, materialLines, duplicateConflicts, submitBlockers, concludeBlockers, provisionalReasons
  };
})(globalThis);
