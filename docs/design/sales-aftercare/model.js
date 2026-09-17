/* CR-05 Sales Aftercare & Renewal Worklist — source model.
   Synthetic demonstration data and guarded local commands. No application,
   ERP, CRM, messaging, scheduling or agreement record is created or changed. */
(function (root) {
  'use strict';
  const TODAY = '2026-09-16';
  const clone = x => JSON.parse(JSON.stringify(x));
  const must = (ok, message) => { if (!ok) throw new Error(message); };
  const text = (v, label, min = 8, max = 2000) => {
    must(typeof v === 'string' && v.trim().length >= min && v.trim().length <= max, `${label}: enter ${min}–${max.toLocaleString('en-AU')} characters.`);
    return v.trim();
  };
  const date = v => {
    must(/^\d{4}-\d{2}-\d{2}$/.test(v || '') && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Enter a real calendar date.');
    return v;
  };
  const choose = (v, values, label) => { must(values.includes(v), `Choose a valid ${label}.`); return v; };

  /* ---- People. Preview identities only; no employee is assigned authority. ---- */
  const people = {
    drew:    {name: 'Drew Wilson',  title: 'Account owner · Sales'},
    riley:   {name: 'Riley Chen',   title: 'Aftercare review owner · Customer service'},
    alex:    {name: 'Alex Morgan',  title: 'Service Manager · receiving reviewer'},
    morgan:  {name: 'Morgan Ellis', title: 'Training coordinator'},
    avery:   {name: 'Avery Cole',   title: 'Commercial reviewer'},
    jamie:   {name: 'Jamie Walker', title: 'Read-only observer'}
  };
  const owners = ['Drew Wilson', 'Riley Chen', 'Alex Morgan', 'Morgan Ellis', 'Avery Cole'];
  /* Capability names are proposed presentation controls. The receiving application
     must enforce the equivalent scope and permission on the server. */
  const roles = {
    account:    {key: 'account',    person: 'drew',   team: true,  customers: ['org-willowbank', 'org-fernbank'], can: ['plan', 'prepare', 'review', 'feedback', 'complete', 'correct', 'concern', 'refer', 'training', 'document', 'commercial', 'handover', 'commitment', 'scenario']},
    review:     {key: 'review',     person: 'riley',  team: true,  customers: ['org-willowbank', 'org-fernbank'], can: ['plan', 'prepare', 'review', 'feedback', 'complete', 'correct', 'concern', 'refer', 'training', 'document', 'commitment', 'scenario']},
    service:    {key: 'service',    person: 'alex',   team: true,  customers: ['org-willowbank', 'org-fernbank'], can: ['receive', 'concern']},
    training:   {key: 'training',   person: 'morgan', team: false, customers: ['org-willowbank'],                 can: ['training', 'document']},
    commercial: {key: 'commercial', person: 'avery',  team: true,  customers: ['org-willowbank', 'org-fernbank'], can: ['commercial', 'handover', 'receiveHandover']},
    observer:   {key: 'observer',   person: 'jamie',  team: false, customers: ['org-willowbank'],                 can: []}
  };
  const actor = role => people[roles[role].person].name;
  const can = (role, capability) => !!roles[role] && roles[role].can.includes(capability);

  const views = ['worklist', 'review', 'training', 'commercial', 'history'];
  const viewTitles = {
    worklist: 'Aftercare worklist',
    review: 'Customer review',
    training: 'Training & follow-up',
    commercial: 'Maintenance & renewal',
    history: 'History & commercial handover'
  };
  const savedViews = ['all', 'mine', 'due', 'awaiting', 'internal', 'training', 'renewal'];
  const savedViewTitles = {
    all: 'All aftercare',
    mine: 'My follow-ups',
    due: 'Reviews due',
    awaiting: 'Awaiting customer response',
    internal: 'Needs internal action',
    training: 'Training outstanding',
    renewal: 'Renewal discussions'
  };
  const reasons = [
    'Delivered goods follow-up',
    'Installation and commissioning follow-up',
    'Service visit follow-up',
    'Resolved issue follow-up',
    'Project closeout follow-up',
    'Agreement expiry review'
  ];
  const sourceKinds = ['Order', 'Delivery', 'Project', 'Service visit', 'Resolved issue', 'Agreement'];
  const feedbackBases = ['Quoted', 'Paraphrased', 'Internal interpretation'];
  const reviewMethods = ['Site visit', 'Telephone call', 'Video call', 'Written response'];
  const dueBasisKinds = ['User choice', 'Recorded commitment', 'Sourced rule'];
  const states = ['Planned', 'Preparing', 'Review drafted', 'Review completed', 'Closed'];
  const dispositions = ['Open', 'Carried as owned action', 'Referred to Service', 'Closed with evidence', 'Withdrawn by customer'];
  const filters = () => ({q: '', customer: '', owner: 'all', site: '', source: '', reason: '', state: '', due: ''});

  /* ---- Shared customer context. Reused from the Service Cases r02 / Customers r03
     synthetic location fixture so identities stay stable across module designs. ---- */
  function customers() {
    return [{
      id: 'org-willowbank', ref: 'SYN-PPO-ORG-000201', name: 'Willowbank Horticulture',
      legalName: 'SYN Willowbank Horticulture Pty Ltd', sector: 'Commercial nursery & protected cropping',
      accountOwner: 'Drew Wilson',
      accountOwnerConflict: 'The shared location fixture records the account owner as Alex Morgan, who Service Cases r02 records as Service Manager. CR-05 displays Drew Wilson · Sales and keeps the difference visible instead of choosing silently.',
      asAt: '2026-09-15', completeness: 'Complete for the fields shown; ERP link not recorded.',
      sites: [
        {id: 'site-nursery', ref: 'SYN-PPO-SIT-000301', name: 'Nursery & propagation', address: '12 Demonstration Growers Lane, Sampletown VIC 3999, Australia'},
        {id: 'site-field', ref: 'SYN-PPO-SIT-000302', name: 'Field production', address: '84 Example Orchard Road, Sampletown VIC 3999, Australia'}
      ],
      areas: [
        {id: 'fac-401', ref: 'SYN-PPO-FAC-000401', site: 'site-nursery', name: 'Greenhouse 01', kind: 'Greenhouse'},
        {id: 'fac-402', ref: 'SYN-PPO-FAC-000402', site: 'site-nursery', name: 'Tunnel 01', kind: 'Polytunnel'},
        {id: 'fac-403', ref: 'SYN-PPO-FAC-000403', site: 'site-nursery', name: 'Propagation House 01', kind: 'Greenhouse'},
        {id: 'fac-405', ref: 'SYN-PPO-FAC-000405', site: 'site-nursery', name: 'Pack Room 01', kind: 'Non-growing facility'},
        {id: 'fac-406', ref: 'SYN-PPO-FAC-000406', site: 'site-nursery', name: 'Irrigation Shed 01', kind: 'Non-growing facility'},
        {id: 'fac-408', ref: 'SYN-PPO-FAC-000408', site: 'site-field', name: 'Irrigation Block 02 / Field', kind: 'Open growing area'}
      ],
      assets: [
        {id: 'ast-501', ref: 'SYN-PPO-AST-000501', name: 'Irrigation pump 01', model: 'SYN Pump P30', serial: 'SYN-WB-P01-240618', installedIn: 'fac-406', serves: ['fac-401', 'fac-402', 'fac-403'], software: 'Not applicable'},
        {id: 'ast-502', ref: 'SYN-PPO-AST-000502', name: 'Fertigation controller 01', model: 'SYN Dose D12', serial: 'SYN-WB-D12-260714', installedIn: 'fac-406', serves: ['fac-401', 'fac-403'], software: 'SYN firmware 4.2'}
      ],
      contacts: [
        {id: 'contact-1', name: 'Casey Taylor', role: 'Nursery manager', recorded: 'Site and crop access coordinator', authority: 'Purchasing authority not recorded'},
        {id: 'contact-2', name: 'Jordan Lee', role: 'Field production manager', recorded: 'Field access and delivery coordinator', authority: 'Purchasing authority not recorded'},
        {id: 'contact-3', name: 'Sam Patel', role: 'Accounts contact', recorded: 'Billing enquiries; no site-access authority', authority: 'Purchasing authority not recorded'}
      ]
    }, {
      id: 'org-fernbank', ref: 'SYN-PPO-ORG-000900', name: 'Fernbank Flower Farm',
      legalName: 'SYN Fernbank Flower Farm Pty Ltd', sector: 'Cut-flower production',
      accountOwner: 'Drew Wilson', accountOwnerConflict: '',
      asAt: '2026-09-10', completeness: 'Partial · site, facility and equipment records are not recorded for this secondary customer.',
      sites: [{id: 'site-fern', ref: 'SYN-PPO-SIT-000901', name: 'Fernbank main site', address: 'Address not recorded'}],
      areas: [], assets: [],
      contacts: [{id: 'contact-f1', name: 'Kit Alvarez', role: 'Owner', recorded: 'Single recorded contact', authority: 'Purchasing authority not recorded'}]
    }];
  }

  /* ---- Neighbouring source records. These stand for records owned by other
     modules; CR-05 reads and references them and never rewrites them. ---- */
  function sources() {
    return {
      cases: [
        {ref: 'SYN-PPO-TKT-000201', customer: 'org-willowbank', title: 'Irrigation pump stops between watering runs', asset: 'ast-501', areas: ['fac-401', 'fac-402', 'fac-403'], status: 'In progress', owner: 'Alex Morgan', opened: '2026-09-15', summary: 'Casey Taylor reported intermittent stopping between irrigation runs. Cause not established. Priority Urgent, recorded by Service Cases triage.'},
        {ref: 'SYN-PPO-TKT-000203', customer: 'org-willowbank', title: 'Pack Room 01 door drive requires a replacement part', asset: '', areas: ['fac-405'], status: 'Waiting on parts', owner: 'Robin Brooks', opened: '2026-09-12', summary: 'Separate structures and machinery case. Unrelated to fertigation scope.'}
      ],
      opportunities: [
        {ref: 'SYN-PPO-OPP-000041', customer: 'org-willowbank', title: 'Fertigation capacity extension — Glasshouse 02', stage: 'Qualified', owner: 'Drew Wilson', created: '2026-08-19', origin: 'Sales enquiry', qualification: 'Qualified in CRM on 2 September 2026 against the current CRM rules.'},
        {ref: 'SYN-PPO-OPP-000042', customer: 'org-fernbank', title: 'Fernbank irrigation scoping', stage: 'Enquiry', owner: 'Drew Wilson', created: '2026-09-08', origin: 'Inbound call', qualification: 'Not qualified. An existing customer does not make a new opportunity qualified.'}
      ],
      agreements: [
        {ref: 'SYN-PPO-AGR-080101', customer: 'org-willowbank', title: 'Irrigation care · Willowbank', revision: 'r02', status: 'Active', start: '2026-07-01', expiry: '2026-10-31', coverage: 'Routine inspection, filter cleaning, restart pressure observation and housing-seal condition recording for Irrigation pump 01. Repairs, replacement parts, controller changes and growing-area pipework are excluded.', reviewDate: '2026-09-30', sourceRef: 'SYN-AGREEMENT-1 r02', renewalReview: {id: 'SYN-MA-RENEWAL-14', state: 'Open', owner: 'Avery Cole', due: '2026-09-30', crmState: 'Activity preparation only', proposals: 0, note: 'MA-05 renewal review opened against agreement revision r02.'}},
        {ref: 'SYN-PPO-AGR-080103', customer: 'org-willowbank', title: 'Propagation support renewal', revision: 'r02', status: 'Expired', start: '2025-09-01', expiry: '2026-08-31', coverage: 'Propagation house support. Expired; no successor recorded.', reviewDate: '', sourceRef: 'SYN-AGREEMENT-3 r02', renewalReview: null}
      ],
      documents: [
        {ref: 'SYN-PPO-DOC-000301', title: 'SYN Dose D12 operator manual', revision: 'r02', state: 'Superseded', successor: 'r03', applies: {models: ['SYN Dose D12'], serials: 'All', software: 'SYN firmware 3.x'}, note: 'Written for firmware 3.x. It does not describe the delivered 4.2 dosing screens.'},
        {ref: 'SYN-PPO-DOC-000301', title: 'SYN Dose D12 operator manual', revision: 'r03', state: 'Current', successor: '', applies: {models: ['SYN Dose D12'], serials: 'All', software: 'SYN firmware 4.x'}, note: 'Current issue for the delivered firmware 4.2 configuration.'},
        {ref: 'SYN-PPO-DOC-000318', title: 'SYN Pump P30 quick reference card', revision: 'r01', state: 'Current', successor: '', applies: {models: ['SYN Pump P30'], serials: 'All', software: 'Not applicable'}, note: 'Single-page restart reference.'}
      ],
      records: [
        {ref: 'SYN-PPO-ORD-000451', kind: 'Order', title: 'Fertigation controller supply and installation', date: '2026-07-14'},
        {ref: 'SYN-PPO-DLV-000551', kind: 'Delivery', title: 'Controller delivery and proof of delivery', date: '2026-08-28'},
        {ref: 'SYN-PPO-PRJ-000031', kind: 'Project', title: 'Propagation irrigation upgrade', date: '2026-09-04'},
        {ref: 'SYN-PPO-WO-000503', kind: 'Service visit', title: 'Fertigation commissioning visit', date: '2026-09-05'},
        {ref: 'SYN-PPO-WO-000245', kind: 'Service visit', title: 'Berry tunnel service visit', date: '2026-09-09'}
      ]
    };
  }

  const outcomeKeys = [
    ['goodsDelivered', 'Goods delivered'],
    ['installation', 'Installation or commissioning completed'],
    ['acceptance', 'Customer acceptance of a defined scope'],
    ['aftercareReview', 'Aftercare review conducted'],
    ['activity', 'Activity completed'],
    ['technicalIssue', 'Technical issue resolved'],
    ['trainingDelivered', 'Training delivered'],
    ['competence', 'Operator understanding or competence assessed'],
    ['opportunity', 'Opportunity created'],
    ['renewalProposed', 'Renewal terms proposed'],
    ['renewalAccepted', 'Renewed agreement accepted and activated']
  ];
  const fact = (value, source, at) => ({value, source: source || 'No source recorded', at: at || ''});
  const notRecorded = () => fact('Not recorded', 'No source record');

  function blankReview() {
    return {state: 'None', date: '', method: '', participants: [], feedback: [], benefits: '', concernsText: '', questions: '', steps: [], rating: 'Not assessed', ratingBasis: 'No rating scale is defined in this design. "Not assessed" is preserved separately from a low score.', completedAt: '', completedBy: '', corrections: []};
  }

  function seed() {
    const aftercare = [];
    const push = r => {
      aftercare.push(Object.assign({
        version: 1, areas: [], assets: [], planned: null,
        dueBasis: {kind: 'Not set', detail: 'No follow-up date has been chosen, committed or sourced.', sourceRef: '', ruleRevision: ''},
        state: 'Planned', lastContact: null, commitments: [], review: blankReview(),
        concerns: [], training: [], commercial: [], obligations: [], timeline: [], history: [],
        outcomes: {goodsDelivered: notRecorded(), installation: notRecorded(), acceptance: notRecorded(), aftercareReview: fact('Not conducted', 'CR-05 aftercare record'), activity: fact('No Activity recorded', 'Shared Activities'), technicalIssue: fact('Not applicable', 'Service Cases'), trainingDelivered: fact('Not delivered', 'CR-05 training register'), competence: fact('Not assessed', 'No assessment definition adopted'), opportunity: fact('None', 'CRM'), renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')}
      }, r));
    };

    /* 1 — Delivered controller: positive feedback alongside an open technical concern. */
    push({
      id: 'ac-901', ref: 'SYN-PPO-ACR-000901', customer: 'org-willowbank', site: 'site-nursery',
      areas: ['fac-401', 'fac-403', 'fac-406'], assets: ['ast-502'],
      source: {kind: 'Delivery', ref: 'SYN-PPO-DLV-000551', title: 'Controller delivery and proof of delivery', date: '2026-08-28', revision: 'r01', owner: 'Riley Chen', asAt: '2026-09-15', completeness: 'Complete · proof of delivery and commissioning report both retrieved.'},
      reason: 'Installation and commissioning follow-up',
      reasonBasis: 'Sales recorded a commitment at handover to review the delivered configuration with the nursery manager.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Riley Chen',
      planned: '2026-09-15',
      dueBasis: {kind: 'Recorded commitment', detail: 'Drew Wilson committed on 28 August 2026 to review the installed configuration once the first full fertigation cycle had run.', sourceRef: 'SYN-PPO-DLV-000551 handover note', ruleRevision: ''},
      state: 'Preparing', lastContact: '2026-09-05',
      outcomes: {
        goodsDelivered: fact('Yes · 1 controller, 2 dosing lines', 'SYN-PPO-DLV-000551 proof of delivery r01', '2026-08-28'),
        installation: fact('Commissioned', 'SYN-PPO-WO-000503 commissioning report r01', '2026-09-05'),
        acceptance: fact('Accepted for the fertigation supply scope only', 'SYN-PPO-ACC-000551 r01', '2026-09-05'),
        aftercareReview: fact('Not conducted', 'CR-05 aftercare record'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('Open · SYN-PPO-TKT-000201 unresolved', 'Service Cases r02', '2026-09-15'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('None', 'CRM'), renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')
      },
      commitments: [
        {id: 'cm-901-1', title: 'Supply the current operator manual for the delivered firmware', source: 'SYN-PPO-DLV-000551 handover note', owner: 'Drew Wilson', due: '2026-09-12', disposition: 'Open', dispositionNote: ''},
        {id: 'cm-901-2', title: 'Confirm the dosing calibration record reached the nursery manager', source: 'SYN-PPO-WO-000503 commissioning report r01', owner: 'Riley Chen', due: '2026-09-18', disposition: 'Open', dispositionNote: ''}
      ],
      obligations: [{id: 'ob-901-1', title: 'Prepare the Willowbank aftercare review', owner: 'Riley Chen', due: '2026-09-15', state: 'Open', source: 'CR-05 · shared Activities projection'}],
      timeline: [
        {at: '2026-08-28T04:10:00Z', actor: 'Riley Chen', kind: 'Source event', text: 'Controller delivered; proof of delivery r01 recorded.', ref: 'SYN-PPO-DLV-000551'},
        {at: '2026-09-05T03:20:00Z', actor: 'Alex Morgan', kind: 'Source event', text: 'Commissioning visit completed; report r01 issued.', ref: 'SYN-PPO-WO-000503'},
        {at: '2026-09-15T00:10:00Z', actor: 'Riley Chen', kind: 'Aftercare', text: 'Aftercare record opened from the delivery and commissioning evidence.', ref: 'SYN-PPO-ACR-000901'}
      ]
    });

    /* 2 — Berry tunnel visit: awaiting a customer response. */
    push({
      id: 'ac-902', ref: 'SYN-PPO-ACR-000902', customer: 'org-willowbank', site: 'site-nursery',
      areas: ['fac-402'], assets: ['ast-501'],
      source: {kind: 'Service visit', ref: 'SYN-PPO-WO-000245', title: 'Berry tunnel service visit', date: '2026-09-09', revision: 'r01', owner: 'Alex Morgan', asAt: '2026-09-14', completeness: 'Partial · the customer report response is outstanding, so the service outcome is not confirmed.'},
      reason: 'Service visit follow-up',
      reasonBasis: 'The issued service report SYN-PPO-RPT-000245 has been sent and not yet acknowledged.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Drew Wilson',
      planned: '2026-09-17',
      dueBasis: {kind: 'User choice', detail: 'Drew Wilson chose 17 September 2026 while the report response was outstanding. No interval rule was applied.', sourceRef: '', ruleRevision: ''},
      state: 'Planned', lastContact: '2026-09-10',
      outcomes: {
        goodsDelivered: fact('Not applicable', 'No goods on this work order'),
        installation: fact('Not applicable', 'Service visit, not an installation'),
        acceptance: fact('Not recorded', 'Customer response outstanding'),
        aftercareReview: fact('Not conducted', 'CR-05 aftercare record'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('Reported resolved by the technician; customer confirmation outstanding', 'SYN-PPO-RPT-000245 r01', '2026-09-09'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('None', 'CRM'), renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')
      },
      commitments: [{id: 'cm-902-1', title: 'Obtain the customer response to service report SYN-PPO-RPT-000245', source: 'SV-06 report distribution record', owner: 'Drew Wilson', due: '2026-09-16', disposition: 'Open', dispositionNote: ''}],
      obligations: [{id: 'ob-902-1', title: 'Chase the outstanding service report response', owner: 'Drew Wilson', due: '2026-09-16', state: 'Open', source: 'CR-05 · shared Activities projection'}],
      timeline: [
        {at: '2026-09-09T05:00:00Z', actor: 'Alex Morgan', kind: 'Source event', text: 'Service visit completed and report r01 issued to the customer.', ref: 'SYN-PPO-WO-000245'},
        {at: '2026-09-10T22:00:00Z', actor: 'Drew Wilson', kind: 'Aftercare', text: 'Aftercare record opened while the report response is outstanding.', ref: 'SYN-PPO-ACR-000902'}
      ]
    });

    /* 3 — Project closeout: completed review that still carries open obligations. */
    push({
      id: 'ac-903', ref: 'SYN-PPO-ACR-000903', customer: 'org-willowbank', site: 'site-nursery',
      areas: ['fac-403'], assets: ['ast-501'],
      source: {kind: 'Project', ref: 'SYN-PPO-PRJ-000031', title: 'Propagation irrigation upgrade', date: '2026-09-04', revision: 'r02', owner: 'Robin Brooks', asAt: '2026-09-16', completeness: 'Complete for the accepted stage; two closeout items remain individually evidenced.'},
      reason: 'Project closeout follow-up',
      reasonBasis: 'PJ-09 staged acceptance recorded outstanding support obligations at handover.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Riley Chen',
      planned: '2026-09-11',
      dueBasis: {kind: 'Recorded commitment', detail: 'The staged acceptance record committed to a review within one week of handover.', sourceRef: 'SYN-PPO-PRJ-000031 acceptance r02', ruleRevision: ''},
      state: 'Review completed', lastContact: '2026-09-11',
      outcomes: {
        goodsDelivered: fact('Yes · pipework and fittings', 'SYN-PPO-PRJ-000031 delivery schedule r02', '2026-08-20'),
        installation: fact('Completed for Propagation House 01 only', 'SYN-PPO-PRJ-000031 acceptance r02', '2026-09-04'),
        acceptance: fact('Staged acceptance for Propagation House 01; Irrigation Block 02 is excluded', 'SYN-PPO-PRJ-000031 acceptance r02', '2026-09-04'),
        aftercareReview: fact('Conducted on 11 September 2026', 'SYN-PPO-ACR-000903 review', '2026-09-11'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('None reported', 'Service Cases'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('None', 'CRM'), renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')
      },
      commitments: [
        {id: 'cm-903-1', title: 'Issue the as-built irrigation layout for Propagation House 01', source: 'SYN-PPO-PRJ-000031 closeout list r02', owner: 'Robin Brooks', due: '2026-09-22', disposition: 'Carried as owned action', dispositionNote: 'Document issue is owned by Projects; the aftercare review did not close it.'},
        {id: 'cm-903-2', title: 'Confirm the excluded Irrigation Block 02 scope with the customer', source: 'SYN-PPO-PRJ-000031 acceptance r02', owner: 'Drew Wilson', due: '2026-09-25', disposition: 'Carried as owned action', dispositionNote: 'Remains open after the completed review; scope exclusion is unchanged.'}
      ],
      review: {
        state: 'Completed', date: '2026-09-11', method: 'Site visit',
        participants: [
          {name: 'Casey Taylor', role: 'Nursery manager', recorded: 'Customer · recorded role from the contact directory'},
          {name: 'Riley Chen', role: 'Aftercare review owner', recorded: 'Powerplants'},
          {name: 'Robin Brooks', role: 'Service delegate', recorded: 'Powerplants'}
        ],
        feedback: [
          {id: 'fb-903-1', basis: 'Quoted', speaker: 'Casey Taylor', text: '“The propagation benches are watering evenly now, which is what we asked for.”', at: '2026-09-11T00:30:00Z'},
          {id: 'fb-903-2', basis: 'Paraphrased', speaker: 'Casey Taylor', text: 'Casey said the as-built layout has not arrived and she cannot brief a new staff member without it.', at: '2026-09-11T00:35:00Z'},
          {id: 'fb-903-3', basis: 'Internal interpretation', speaker: 'Riley Chen', text: 'My reading is that documentation, not the installed work, is the outstanding concern here. This is an internal interpretation and has not been put to the customer.', at: '2026-09-11T02:00:00Z'}
        ],
        benefits: 'Even watering across the propagation benches was reported. This is a customer statement, not a measured performance result.',
        concernsText: 'The as-built layout has not been issued. The excluded Irrigation Block 02 scope has not been discussed since acceptance.',
        questions: 'Does the customer expect the excluded field block to be quoted this season? Commercial clarification required.',
        steps: [
          {id: 'st-903-1', title: 'Issue the as-built irrigation layout', owner: 'Robin Brooks', due: '2026-09-22'},
          {id: 'st-903-2', title: 'Discuss the excluded Irrigation Block 02 scope', owner: 'Drew Wilson', due: '2026-09-25'}
        ],
        rating: 'Not assessed', ratingBasis: 'No rating scale is defined in this design. "Not assessed" is preserved separately from a low score.',
        completedAt: '2026-09-11T02:10:00Z', completedBy: 'Riley Chen', corrections: []
      },
      obligations: [
        {id: 'ob-903-1', title: 'Issue the as-built irrigation layout', owner: 'Robin Brooks', due: '2026-09-22', state: 'Open', source: 'CR-05 · shared Activities projection'},
        {id: 'ob-903-2', title: 'Discuss the excluded Irrigation Block 02 scope', owner: 'Drew Wilson', due: '2026-09-25', state: 'Open', source: 'CR-05 · shared Activities projection'}
      ],
      timeline: [
        {at: '2026-09-04T01:00:00Z', actor: 'Robin Brooks', kind: 'Source event', text: 'Staged acceptance recorded for Propagation House 01; Irrigation Block 02 excluded.', ref: 'SYN-PPO-PRJ-000031'},
        {at: '2026-09-11T02:10:00Z', actor: 'Riley Chen', kind: 'Review', text: 'Aftercare review completed with two obligations carried as owned actions.', ref: 'SYN-PPO-ACR-000903'}
      ]
    });

    /* 4 — Agreement expiry review, sourced from MA-05. */
    push({
      id: 'ac-904', ref: 'SYN-PPO-ACR-000904', customer: 'org-willowbank', site: 'site-nursery',
      areas: ['fac-406'], assets: ['ast-501'],
      source: {kind: 'Agreement', ref: 'SYN-PPO-AGR-080101', title: 'Irrigation care · Willowbank', date: '2026-10-31', revision: 'r02', owner: 'Avery Cole', asAt: '2026-09-16', completeness: 'Complete · agreement revision r02 and its open MA-05 renewal review both retrieved.'},
      reason: 'Agreement expiry review',
      reasonBasis: 'The agreement source records an expiry of 31 October 2026 and a review date of 30 September 2026.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Drew Wilson',
      planned: '2026-09-23',
      dueBasis: {kind: 'Sourced rule', detail: 'MA-05 renewal review SYN-MA-RENEWAL-14 carries a source-defined review date of 30 September 2026; the Sales conversation is planned one week earlier.', sourceRef: 'SYN-PPO-AGR-080101 r02 · SYN-MA-RENEWAL-14', ruleRevision: 'MA-05 renewal review r01'},
      state: 'Planned', lastContact: '2026-08-14',
      outcomes: {
        goodsDelivered: fact('Not applicable', 'Agreement record'),
        installation: fact('Not applicable', 'Agreement record'),
        acceptance: fact('Not applicable', 'Agreement record'),
        aftercareReview: fact('Not conducted', 'CR-05 aftercare record'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('Open · SYN-PPO-TKT-000201 affects the covered pump', 'Service Cases r02', '2026-09-15'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('None', 'CRM'),
        renewalProposed: fact('None · MA-05 renewal review open with 0 proposals', 'SYN-MA-RENEWAL-14', '2026-09-16'),
        renewalAccepted: fact('None', 'MA-05')
      },
      commercial: [{
        id: 'cs-904-1', ref: 'SYN-PPO-CSG-000601', kind: 'Renewal',
        observation: 'Agreement SYN-PPO-AGR-080101 r02 expires on 31 October 2026 and MA-05 has an open renewal review.',
        need: 'The customer needs to know whether routine pump care continues past 31 October and on what terms.',
        interest: 'Not recorded', interestSource: '',
        agreementRef: '', agreementRevision: '', renewalReviewId: '',
        opportunityRef: '', owner: 'Drew Wilson', nextAction: 'Link the MA-05 renewal review, then hold the relationship conversation before its review date.',
        openIssues: ['SYN-PPO-TKT-000201 — unresolved pump stopping on the covered asset'],
        handover: null, state: 'Discussion prepared',
        history: [{at: '2026-09-16T00:00:00Z', actor: 'Avery Cole', text: 'Surfaced from the agreement expiry date. The MA-05 renewal review is not yet linked; agreement ownership stays with MA-05 either way.'}]
      }],
      obligations: [{id: 'ob-904-1', title: 'Prepare the Willowbank renewal conversation', owner: 'Drew Wilson', due: '2026-09-23', state: 'Open', source: 'CR-05 · shared Activities projection'}],
      timeline: [{at: '2026-09-16T00:00:00Z', actor: 'Avery Cole', kind: 'Commercial', text: 'MA-05 renewal review SYN-MA-RENEWAL-14 surfaced in the Sales worklist.', ref: 'SYN-MA-RENEWAL-14'}]
    });

    /* 5 — Resolved issue: training and documentation gap. */
    push({
      id: 'ac-905', ref: 'SYN-PPO-ACR-000905', customer: 'org-willowbank', site: 'site-nursery',
      areas: ['fac-401', 'fac-403'], assets: ['ast-502'],
      source: {kind: 'Resolved issue', ref: 'SYN-PPO-TKT-000203', title: 'Pack Room 01 door drive requires a replacement part', date: '2026-09-12', revision: 'r01', owner: 'Robin Brooks', asAt: '2026-09-16', completeness: 'Complete · resolution recorded; the customer has not been asked whether the outcome met expectations.'},
      reason: 'Resolved issue follow-up',
      reasonBasis: 'Service recorded a resolution and referred the relationship follow-up to Sales.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Riley Chen',
      planned: null,
      dueBasis: {kind: 'Not set', detail: 'No review date has been chosen, committed or sourced. This record shows as Date needed rather than defaulting to an interval.', sourceRef: '', ruleRevision: ''},
      state: 'Planned', lastContact: null,
      outcomes: {
        goodsDelivered: fact('Replacement part supplied', 'SYN-PPO-TKT-000203 resolution r01', '2026-09-12'),
        installation: fact('Fitted during the same visit', 'SYN-PPO-TKT-000203 resolution r01', '2026-09-12'),
        acceptance: fact('Not recorded', 'No acceptance record for a corrective repair'),
        aftercareReview: fact('Not conducted', 'CR-05 aftercare record'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('Resolved · SYN-PPO-TKT-000203 closed by Service', 'Service Cases r02', '2026-09-12'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('None', 'CRM'), renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')
      },
      training: [{
        id: 'tr-905-1', ref: 'SYN-PPO-TRN-000701',
        participants: 'Casey Taylor and two nursery staff (names not recorded)',
        assetId: 'ast-502', equipment: 'Fertigation controller 01 · SYN Dose D12 · SYN-WB-D12-260714', configuration: 'SYN firmware 4.2',
        topic: 'Dosing recipe changes on the delivered firmware',
        gap: 'Staff are using the firmware 3.x procedure from the superseded manual and cannot find the equivalent 4.2 screens.',
        outcome: 'Nursery staff can change a dosing recipe using the delivered 4.2 interface without calling Service.',
        material: {ref: 'SYN-PPO-DOC-000301', revision: 'r02', state: 'Superseded', applicability: 'Written for SYN firmware 3.x. It does not apply to the delivered 4.2 configuration.', flag: 'Superseded material — r03 is the current issue for firmware 4.x.'},
        trainer: 'Morgan Ellis', target: '2026-09-24', arrangement: 'Requested',
        arrangementNote: 'A date has been requested with the customer. No appointment, resource or booking exists.',
        attendance: [], delivered: false, deliveredNote: '',
        assessment: 'Not assessed', assessmentBasis: 'No competence definition or assessment method is adopted in this design.',
        questions: 'Which firmware revision is actually running on the delivered unit? The commissioning report records 4.2; the customer mentioned an update.',
        followUpOwner: 'Morgan Ellis', followUpDue: '2026-09-26',
        documentRequest: null,
        history: [{at: '2026-09-16T01:00:00Z', actor: 'Riley Chen', text: 'Training need recorded from the resolved-issue follow-up.'}]
      }],
      commitments: [{id: 'cm-905-1', title: 'Confirm the correct operator manual revision for the delivered firmware', source: 'SYN-PPO-TKT-000203 resolution note', owner: 'Morgan Ellis', due: '2026-09-19', disposition: 'Open', dispositionNote: ''}],
      obligations: [{id: 'ob-905-1', title: 'Arrange the dosing-recipe training session', owner: 'Morgan Ellis', due: '2026-09-24', state: 'Open', source: 'CR-05 · shared Activities projection'}],
      timeline: [
        {at: '2026-09-12T02:00:00Z', actor: 'Robin Brooks', kind: 'Source event', text: 'Case resolved and referred to Sales for relationship follow-up.', ref: 'SYN-PPO-TKT-000203'},
        {at: '2026-09-16T01:00:00Z', actor: 'Riley Chen', kind: 'Training', text: 'Training need SYN-PPO-TRN-000701 recorded against the delivered firmware configuration.', ref: 'SYN-PPO-TRN-000701'}
      ]
    });

    /* 6 — Secondary customer: identity isolation, partial source data. */
    push({
      id: 'ac-906', ref: 'SYN-PPO-ACR-000906', customer: 'org-fernbank', site: 'site-fern',
      areas: [], assets: [],
      source: {kind: 'Order', ref: 'SYN-PPO-ORD-000461', title: 'Fernbank starter irrigation parts order', date: '2026-09-01', revision: 'r01', owner: 'Drew Wilson', asAt: '2026-09-10', completeness: 'Partial · no site, facility or equipment records exist for this customer.'},
      reason: 'Delivered goods follow-up',
      reasonBasis: 'Sales chose to follow up a first order with a new customer.',
      accountOwner: 'Drew Wilson', reviewOwner: 'Drew Wilson',
      planned: '2026-09-19',
      dueBasis: {kind: 'User choice', detail: 'Drew Wilson chose 19 September 2026. No interval rule exists and none was applied.', sourceRef: '', ruleRevision: ''},
      state: 'Planned', lastContact: null,
      outcomes: {
        goodsDelivered: fact('Yes · parts order despatched', 'SYN-PPO-ORD-000461 r01', '2026-09-03'),
        installation: fact('Not applicable', 'Parts supply only'),
        acceptance: fact('Not recorded', 'No acceptance record'),
        aftercareReview: fact('Not conducted', 'CR-05 aftercare record'),
        activity: fact('No Activity recorded', 'Shared Activities'),
        technicalIssue: fact('None reported', 'Service Cases'),
        trainingDelivered: fact('Not delivered', 'CR-05 training register'),
        competence: fact('Not assessed', 'No assessment definition adopted'),
        opportunity: fact('SYN-PPO-OPP-000042 exists at Enquiry · not qualified', 'CRM', '2026-09-08'),
        renewalProposed: fact('None', 'MA-05'), renewalAccepted: fact('None', 'MA-05')
      },
      obligations: [{id: 'ob-906-1', title: 'Call Kit Alvarez about the first parts order', owner: 'Drew Wilson', due: '2026-09-19', state: 'Open', source: 'CR-05 · shared Activities projection'}],
      timeline: [{at: '2026-09-10T00:00:00Z', actor: 'Drew Wilson', kind: 'Aftercare', text: 'Aftercare record opened for the secondary synthetic customer.', ref: 'SYN-PPO-ACR-000906'}]
    });

    return {
      schema: 'ppo-sales-aftercare/v1', version: 0, today: TODAY,
      customers: customers(), sources: sources(), records: aftercare,
      scenario: {sourceChanged: false, documentSuperseded: false},
      history: [], receipts: []
    };
  }

  /* ---- Projections ---------------------------------------------------- */
  const org = (s, id) => s.customers.find(c => c.id === id);
  const site = (s, r) => org(s, r.customer)?.sites.find(x => x.id === r.site) || null;
  const areaNames = (s, r) => r.areas.map(id => org(s, r.customer)?.areas.find(a => a.id === id)?.name).filter(Boolean);
  const assetList = (s, r) => r.assets.map(id => org(s, r.customer)?.assets.find(a => a.id === id)).filter(Boolean);
  const openCommitments = r => r.commitments.filter(c => c.disposition === 'Open');
  const openObligations = r => r.obligations.filter(o => o.state === 'Open');
  const openConcerns = r => r.concerns.filter(c => !c.referral || c.referral.state !== 'Accepted');
  const outstandingTraining = r => r.training.filter(t => !t.delivered);
  const dueState = r => !r.planned ? 'Date needed' : r.planned < TODAY ? 'Overdue' : r.planned === TODAY ? 'Today' : 'Upcoming';
  const reviewDone = r => r.review.state === 'Completed';
  const nextAction = r => {
    if (r.state === 'Closed') return {title: 'No further action; record closed.', owner: '—', due: null};
    const step = r.review.steps.find(x => true);
    if (!reviewDone(r) && r.planned) return {title: 'Prepare and hold the customer review', owner: r.reviewOwner, due: r.planned};
    if (!reviewDone(r)) return {title: 'Choose a review date with an explicit basis', owner: r.reviewOwner, due: null};
    if (openCommitments(r).length) return {title: 'Give every outstanding commitment a disposition', owner: r.reviewOwner, due: openCommitments(r)[0].due};
    if (step) return {title: step.title, owner: step.owner, due: step.due};
    if (openObligations(r).length) return {title: openObligations(r)[0].title, owner: openObligations(r)[0].owner, due: openObligations(r)[0].due};
    return {title: 'Confirm the record can be closed', owner: r.accountOwner, due: null};
  };

  function permitted(s, role) {
    must(roles[role], 'Choose a valid preview role.');
    const scope = roles[role].customers;
    return s.records.filter(r => scope.includes(r.customer));
  }

  function criteria(f) {
    must(f && typeof f.q === 'string' && f.q.length <= 200, 'Search is too long.');
    must(['all', 'mine', ...owners].includes(f.owner), 'Invalid owner filter.');
    for (const [key, list] of [['source', ['', ...sourceKinds]], ['reason', ['', ...reasons]], ['state', ['', ...states]], ['due', ['', 'Overdue', 'Today', 'Upcoming', 'Date needed']]]) {
      must(list.includes(f[key]), `Invalid ${key} filter.`);
    }
    return f;
  }

  function query(s, role, f, saved = 'all') {
    criteria(f);
    must(savedViews.includes(saved), 'Choose a valid worklist view.');
    const me = actor(role);
    let rows = permitted(s, role);
    if (saved === 'mine') rows = rows.filter(r => r.accountOwner === me || r.reviewOwner === me || r.obligations.some(o => o.owner === me && o.state === 'Open'));
    if (saved === 'due') rows = rows.filter(r => !reviewDone(r) && (dueState(r) === 'Overdue' || dueState(r) === 'Today' || dueState(r) === 'Date needed'));
    if (saved === 'awaiting') rows = rows.filter(r => r.source.completeness.startsWith('Partial') || r.commitments.some(c => c.disposition === 'Open' && /response|confirm/i.test(c.title)));
    if (saved === 'internal') rows = rows.filter(r => openCommitments(r).length || openObligations(r).length);
    if (saved === 'training') rows = rows.filter(r => outstandingTraining(r).length);
    if (saved === 'renewal') rows = rows.filter(r => r.commercial.length);
    return rows.filter(r =>
      (!f.customer || r.customer === f.customer) &&
      (!f.site || r.site === f.site) &&
      (f.owner === 'all' || (f.owner === 'mine' ? (r.accountOwner === me || r.reviewOwner === me) : (r.accountOwner === f.owner || r.reviewOwner === f.owner))) &&
      (!f.source || r.source.kind === f.source) &&
      (!f.reason || r.reason === f.reason) &&
      (!f.state || r.state === f.state) &&
      (!f.due || dueState(r) === f.due) &&
      (!f.q || [r.ref, r.source.ref, r.reason, r.accountOwner, r.reviewOwner, org(s, r.customer)?.name, site(s, r)?.name, ...areaNames(s, r), ...assetList(s, r).map(a => a.name + ' ' + a.serial)].join(' ').toLowerCase().includes(f.q.trim().toLowerCase()))
    ).sort((a, b) => (a.planned || '9999-99-99').localeCompare(b.planned || '9999-99-99') || a.ref.localeCompare(b.ref));
  }

  function counts(s, role, f, rowList) {
    const rows = rowList || query(s, role, f, 'all');
    return [
      {key: 'due', label: 'Reviews due', value: rows.filter(r => !reviewDone(r) && ['Overdue', 'Today'].includes(dueState(r))).length, caption: 'Overdue or due today'},
      {key: 'awaiting', label: 'Date needed', value: rows.filter(r => !r.planned).length, caption: 'No chosen, committed or sourced date'},
      {key: 'internal', label: 'Outstanding commitments', value: rows.reduce((n, r) => n + openCommitments(r).length, 0), caption: 'Support or documents we still owe'},
      {key: 'renewal', label: 'Commercial follow-up', value: rows.reduce((n, r) => n + r.commercial.length, 0), caption: 'Evidence-supported discussions'}
    ];
  }

  /* Duplicate check. Returns every case recorded for this customer, ranked by
     equipment match and then wording overlap, so the person always sees the real
     candidates before creating another record. Ranking never merges anything. */
  function similarCases(s, r, symptomText) {
    const words = new Set(String(symptomText || '').toLowerCase().match(/[a-z]{4,}/g) || []);
    return s.sources.cases.filter(c => c.customer === r.customer).map(c => {
      const hay = (c.title + ' ' + c.summary).toLowerCase();
      const hits = [...words].filter(w => hay.includes(w)).length;
      const sameAsset = !!(c.asset && r.assets.includes(c.asset));
      const sameArea = c.areas.some(a => r.areas.includes(a));
      return {case: c, hits, sameAsset, sameArea, linked: r.concerns.some(x => x.link && x.link.ref === c.ref)};
    }).sort((a, b) => (b.sameAsset - a.sameAsset) || (b.sameArea - a.sameArea) || (b.hits - a.hits) || a.case.ref.localeCompare(b.case.ref));
  }
  /* Existing owned actions on this record, shown beside the case candidates. */
  function relatedActions(r) {
    return [
      ...r.obligations.filter(o => o.state === 'Open').map(o => ({kind: 'Owned action', ref: o.source, title: o.title, owner: o.owner, due: o.due})),
      ...r.concerns.map(c => ({kind: c.link ? 'Linked case' : 'Referral ' + (c.referral ? c.referral.state.toLowerCase() : 'recorded'), ref: c.link ? c.link.ref : (c.ref || ''), title: c.symptom.slice(0, 90), owner: c.proposedOwner, due: null}))
    ];
  }
  function similarOpportunities(s, r) {
    return s.sources.opportunities.filter(o => o.customer === r.customer);
  }

  function documentFor(s, assetId, org2) {
    const asset = org2?.assets.find(a => a.id === assetId);
    if (!asset) return null;
    const matches = s.sources.documents.filter(d => d.applies.models.includes(asset.model));
    const current = matches.find(d => d.state === 'Current') || null;
    return {asset, matches, current};
  }

  /* ---- Validation ----------------------------------------------------- */
  function validate(s) {
    must(s && s.schema === 'ppo-sales-aftercare/v1' && Number.isInteger(s.version) && s.version >= 0, 'Unsupported aftercare session.');
    for (const name of ['customers', 'records', 'history', 'receipts']) must(Array.isArray(s[name]), 'Session collections are incomplete.');
    must(s.sources && Array.isArray(s.sources.cases) && Array.isArray(s.sources.opportunities) && Array.isArray(s.sources.agreements) && Array.isArray(s.sources.documents), 'Source records are incomplete.');
    must(new Set(s.records.map(r => r.id)).size === s.records.length, 'Duplicate aftercare identities are not valid.');
    must(new Set(s.records.map(r => r.ref)).size === s.records.length, 'Duplicate aftercare references are not valid.');
    for (const r of s.records) {
      text(r.id, 'Identity', 1); text(r.ref, 'Reference', 1);
      must(org(s, r.customer), `${r.ref}: unknown customer.`);
      must(Number.isInteger(r.version) && r.version >= 1, `${r.ref}: invalid record version.`);
      must(states.includes(r.state), `${r.ref}: invalid aftercare state.`);
      must(reasons.includes(r.reason), `${r.ref}: invalid follow-up reason.`);
      must(sourceKinds.includes(r.source.kind), `${r.ref}: invalid source kind.`);
      must(owners.includes(r.accountOwner) && owners.includes(r.reviewOwner), `${r.ref}: invalid owner.`);
      if (r.planned !== null) date(r.planned);
      must([...dueBasisKinds, 'Not set'].includes(r.dueBasis.kind), `${r.ref}: invalid due-date basis.`);
      must(r.planned === null ? r.dueBasis.kind === 'Not set' : r.dueBasis.kind !== 'Not set', `${r.ref}: a planned date must state where it came from.`);
      for (const key of outcomeKeys.map(k => k[0])) must(r.outcomes[key] && typeof r.outcomes[key].value === 'string', `${r.ref}: outcome ${key} is missing.`);
      for (const c of r.commitments) must(dispositions.includes(c.disposition), `${r.ref}: invalid commitment disposition.`);
      for (const f of r.review.feedback) must(feedbackBases.includes(f.basis), `${r.ref}: customer feedback must state whether it is quoted, paraphrased or an internal interpretation.`);
      must(['None', 'Draft', 'Saved', 'Completed'].includes(r.review.state), `${r.ref}: invalid review state.`);
      must(r.review.state !== 'Completed' || (r.review.date && r.review.method && r.review.participants.length), `${r.ref}: a completed review needs a date, method and participants.`);
      must(r.state !== 'Review completed' || r.review.state === 'Completed', `${r.ref}: state and review state disagree.`);
      for (const c of r.concerns) must(!c.referral || ['Prepared', 'Submitted', 'Returned', 'Accepted', 'Unknown'].includes(c.referral.state), `${r.ref}: invalid referral state.`);
      for (const t of r.training) {
        must(['Requested', 'Confirmed'].includes(t.arrangement), `${r.ref}: invalid training arrangement state.`);
        must(typeof t.delivered === 'boolean', `${r.ref}: training delivery must be explicit.`);
        must(['Not assessed', 'Assessed · met the stated outcome', 'Assessed · further support needed'].includes(t.assessment), `${r.ref}: invalid assessment value.`);
        must(!(t.attendance.length && t.assessment !== 'Not assessed' && !t.delivered), `${r.ref}: an assessment cannot precede recorded delivery.`);
      }
      for (const c of r.commercial) must(['Discussion prepared', 'Opportunity linked', 'Handover prepared', 'Handover submitted', 'Handover accepted', 'Handover returned', 'Handover outcome unknown'].includes(c.state), `${r.ref}: invalid commercial state.`);
    }
    return s;
  }

  /* ---- Commands ------------------------------------------------------- */
  function command(s, c, role) {
    validate(s);
    must(roles[role], 'Choose a valid preview role.');
    must(role !== 'observer', 'This preview role is read-only.');
    text(c.op, 'Operation identity', 6);
    const signature = JSON.stringify({type: c.type, payload: c.payload, role});
    const previous = s.receipts.find(x => x.op === c.op);
    if (previous) {
      must(previous.signature === signature, 'This operation identity belongs to different content. Reconcile the original result before trying again.');
      return {state: s, recovered: true, receipt: previous};
    }
    must(c.expectedVersion === s.version, 'This session changed. Reopen the form; your current entries have been retained.');

    const next = clone(s), p = c.payload || {}, me = actor(role), at = c.at || new Date().toISOString();
    let description = '', resultRef = '';

    const record = () => {
      const r = next.records.find(x => x.id === p.id);
      must(r, 'This aftercare record is no longer available.');
      must(roles[role].customers.includes(r.customer), 'This customer is outside the selected preview scope.');
      must(r.version === p.recordVersion, 'The aftercare record changed. Refresh its snapshot before acting.');
      return r;
    };
    const touch = (r, kind, txt, ref) => {
      r.version++;
      r.timeline.push({at, actor: me, kind, text: txt, ref: ref || r.ref});
      r.history.push({at, actor: me, type: c.type, text: txt});
    };
    const need = capability => must(can(role, capability), 'This preview role does not have that capability.');

    if (c.type === 'plan') {
      need('plan');
      const r = record();
      must(r.state !== 'Closed', 'A closed aftercare record cannot be replanned.');
      choose(p.basis, dueBasisKinds, 'due-date basis');
      const detail = text(p.detail, 'Basis for this date', 12);
      if (p.dateNeeded === true) {
        must(p.basis === 'User choice', 'Only a user choice can leave the date open.');
        r.planned = null;
        r.dueBasis = {kind: 'Not set', detail, sourceRef: '', ruleRevision: ''};
        description = 'Review date left as Date needed with a recorded explanation.';
      } else {
        date(p.planned);
        if (p.basis === 'Sourced rule') {
          text(p.sourceRef, 'Source reference', 4);
          text(p.ruleRevision, 'Rule revision', 2);
        }
        r.planned = p.planned;
        r.dueBasis = {kind: p.basis, detail, sourceRef: p.sourceRef || '', ruleRevision: p.ruleRevision || ''};
        description = `Review date set to ${p.planned} on a recorded ${p.basis.toLowerCase()} basis.`;
      }
      touch(r, 'Aftercare', description);
      resultRef = r.ref;

    } else if (c.type === 'owners') {
      need('plan');
      const r = record();
      choose(p.accountOwner, owners, 'account owner');
      choose(p.reviewOwner, owners, 'review owner');
      text(p.reason, 'Reason for the ownership change', 10);
      const before = `${r.accountOwner} / ${r.reviewOwner}`;
      r.accountOwner = p.accountOwner;
      r.reviewOwner = p.reviewOwner;
      description = `Ownership recorded: ${before} → ${p.accountOwner} / ${p.reviewOwner}. Individual action owners are unchanged.`;
      touch(r, 'Aftercare', description);
      resultRef = r.ref;

    } else if (c.type === 'prepare') {
      need('prepare');
      const r = record();
      must(r.state === 'Planned' || r.state === 'Preparing', 'Preparation applies to a planned aftercare record.');
      r.state = 'Preparing';
      r.source.asAt = p.asAt || TODAY;
      description = 'Review preparation opened; the current source snapshot was taken.';
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'saveReview') {
      need('review');
      const r = record();
      must(r.state !== 'Closed', 'A closed record cannot be edited.');
      must(r.review.state !== 'Completed', 'Use a correction to change a completed review.');
      date(p.date);
      choose(p.method, reviewMethods, 'review method');
      must(Array.isArray(p.participants) && p.participants.length >= 1, 'Record at least one participant and their recorded role.');
      for (const x of p.participants) { text(x.name, 'Participant name', 2); text(x.role, 'Participant role', 2); }
      r.review.state = 'Saved';
      r.review.date = p.date;
      r.review.method = p.method;
      r.review.participants = clone(p.participants);
      r.review.benefits = String(p.benefits || '').trim();
      r.review.concernsText = String(p.concernsText || '').trim();
      r.review.questions = String(p.questions || '').trim();
      r.state = r.state === 'Planned' ? 'Preparing' : r.state === 'Preparing' ? 'Review drafted' : r.state;
      description = 'Review detail saved as a draft. No process outside this aftercare record has changed.';
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'feedback') {
      need('feedback');
      const r = record();
      must(r.review.state !== 'Completed', 'Use a correction to add feedback to a completed review.');
      choose(p.basis, feedbackBases, 'feedback basis');
      text(p.speaker, 'Who said it', 2);
      const body = text(p.text, 'Feedback', 10);
      r.review.feedback.push({id: 'fb-' + c.op, basis: p.basis, speaker: p.speaker.trim(), text: body, at});
      if (r.review.state === 'None') r.review.state = 'Draft';
      description = `${p.basis} feedback recorded from ${p.speaker.trim()}. A customer statement does not certify equipment performance or close a technical issue.`;
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'step') {
      need('review');
      const r = record();
      must(r.review.state !== 'Completed', 'Agreed next steps are added before the review is completed, or through a correction.');
      text(p.title, 'Next step', 6);
      choose(p.owner, owners, 'owner');
      date(p.due);
      const step = {id: 'st-' + c.op, title: p.title.trim(), owner: p.owner, due: p.due};
      r.review.steps.push(step);
      r.obligations.push({id: 'ob-' + c.op, title: step.title, owner: step.owner, due: step.due, state: 'Open', source: 'CR-05 · shared Activities projection'});
      description = `Agreed next step recorded and projected as one owned action: ${step.title}.`;
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'commitment') {
      need('commitment');
      const r = record();
      const item = r.commitments.find(x => x.id === p.commitmentId);
      must(item, 'Select an outstanding commitment.');
      choose(p.disposition, dispositions.filter(d => d !== 'Open'), 'disposition');
      const note = text(p.note, 'Disposition note', 10);
      if (p.disposition === 'Carried as owned action') {
        choose(p.owner, owners, 'owner');
        date(p.due);
        item.owner = p.owner;
        item.due = p.due;
        r.obligations.push({id: 'ob-' + c.op, title: item.title, owner: p.owner, due: p.due, state: 'Open', source: 'CR-05 · shared Activities projection'});
      }
      item.disposition = p.disposition;
      item.dispositionNote = note;
      description = `Commitment disposition recorded: ${item.title} — ${p.disposition}.`;
      touch(r, 'Aftercare', description);
      resultRef = r.ref;

    } else if (c.type === 'completeReview') {
      need('complete');
      const r = record();
      must(r.review.state === 'Saved' || r.review.state === 'Draft', 'Save the review detail before completing it.');
      must(r.review.date && r.review.method && r.review.participants.length, 'A completed review needs a date, method and at least one participant.');
      must(r.review.feedback.length >= 1, 'Record at least one item of customer feedback with its basis.');
      const stillOpen = openCommitments(r);
      must(stillOpen.length === 0, `Give every outstanding commitment a disposition first: ${stillOpen.map(x => x.title).join('; ')}.`);
      const orphan = [...r.review.steps, ...openObligations(r)].filter(x => !x.owner || !x.due);
      must(orphan.length === 0, 'Every remaining obligation needs an owner and a due date before the review can be completed.');
      text(p.summary, 'Review outcome summary', 12);
      r.review.state = 'Completed';
      r.review.completedAt = at;
      r.review.completedBy = me;
      r.review.summary = p.summary.trim();
      r.state = 'Review completed';
      r.lastContact = r.review.date;
      r.outcomes.aftercareReview = fact(`Conducted on ${r.review.date}`, r.ref + ' review', r.review.date);
      description = `Aftercare review completed. ${openObligations(r).length} obligation(s) remain open and visible; no other process was completed by this action.`;
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'correctReview') {
      need('correct');
      const r = record();
      must(r.review.state === 'Completed', 'Corrections apply to a completed review.');
      const reason = text(p.reason, 'Reason for the correction', 12);
      const addition = text(p.text, 'Corrected or added detail', 10);
      r.review.corrections.push({id: 'cr-' + c.op, at, actor: me, reason, text: addition, previous: clone({benefits: r.review.benefits, concernsText: r.review.concernsText, feedback: r.review.feedback.length})});
      r.review.concernsText = (r.review.concernsText ? r.review.concernsText + '\n' : '') + `[Correction ${at.slice(0, 10)}] ${addition}`;
      description = 'Correction appended. The original completed record and its history are retained unchanged.';
      touch(r, 'Review', description);
      resultRef = r.ref;

    } else if (c.type === 'linkCase') {
      need('concern');
      const r = record();
      const existing = next.sources.cases.find(x => x.ref === p.caseRef && x.customer === r.customer);
      must(existing, 'Select an existing case for this customer.');
      must(!r.concerns.some(x => x.link && x.link.ref === p.caseRef), 'This case is already linked to a concern on this record.');
      const symptom = text(p.symptom, 'Customer-reported symptom', 12);
      r.concerns.push({
        id: 'cn-' + c.op, ref: '', symptom, siteScope: p.siteScope || '', assetRef: p.assetRef || '', configuration: p.configuration || '',
        occurs: p.occurs || 'Not recorded', impact: p.impact || 'Not recorded', evidence: p.evidence || 'None recorded',
        attempted: p.attempted || 'Not recorded', questions: p.questions || '', proposedOwner: existing.owner,
        contactCommitment: p.contactCommitment || 'Not recorded',
        link: {kind: 'Existing case', ref: existing.ref, title: existing.title, status: existing.status, owner: existing.owner},
        referral: null,
        history: [{at, actor: me, text: `Linked to existing case ${existing.ref}; no second case record was created.`}]
      });
      description = `Concern linked to existing case ${existing.ref}. Similar wording alone never merges records; this was a deliberate link.`;
      touch(r, 'Concern', description, existing.ref);
      resultRef = existing.ref;

    } else if (c.type === 'prepareReferral') {
      need('refer');
      const r = record();
      const symptom = text(p.symptom, 'Customer-reported symptom', 12);
      text(p.siteScope, 'Exact site, equipment and configuration', 6);
      text(p.occurs, 'When the issue occurs', 6);
      text(p.impact, 'Reported operational or crop impact', 6);
      choose(p.proposedOwner, owners, 'proposed receiving owner');
      text(p.contactCommitment, 'Next contact commitment', 6);
      must(p.reviewed === true, 'Confirm that you checked the existing cases and actions listed before preparing another record.');
      const ref = 'SYN-PPO-REF-' + String(800 + next.records.reduce((n, x) => n + x.concerns.filter(y => y.referral).length, 0) + 1).padStart(6, '0');
      r.concerns.push({
        id: 'cn-' + c.op, ref, symptom, siteScope: p.siteScope.trim(), assetRef: p.assetRef || '', configuration: p.configuration || 'Not recorded',
        occurs: p.occurs.trim(), impact: p.impact.trim(), evidence: p.evidence || 'None recorded', attempted: p.attempted || 'Not recorded',
        questions: p.questions || '', proposedOwner: p.proposedOwner, contactCommitment: p.contactCommitment.trim(),
        link: null,
        referral: {state: 'Prepared', ref, submittedAt: '', returnedReason: '', receivingRef: '', opId: '', revisions: 1},
        history: [{at, actor: me, text: 'Referral prepared for Service. No diagnosis, urgency category or service level is implied by this text.'}]
      });
      description = `Service referral ${ref} prepared. Preparing is not submitting, and submitting is not acceptance.`;
      touch(r, 'Concern', description, ref);
      resultRef = ref;

    } else if (c.type === 'submitReferral') {
      need('refer');
      const r = record();
      const concern = r.concerns.find(x => x.id === p.concernId);
      must(concern && concern.referral, 'Select a prepared referral.');
      must(['Prepared', 'Returned'].includes(concern.referral.state), 'Only a prepared or corrected referral can be submitted.');
      concern.referral.state = 'Submitted';
      concern.referral.submittedAt = at;
      concern.referral.opId = c.op;
      concern.history.push({at, actor: me, text: 'Referral submitted to Service. The receiving team has not yet accepted responsibility.'});
      description = `Referral ${concern.referral.ref} submitted. The receiving outcome is not known until Service responds.`;
      touch(r, 'Concern', description, concern.referral.ref);
      resultRef = concern.referral.ref;

    } else if (c.type === 'reviseReferral') {
      need('refer');
      const r = record();
      const concern = r.concerns.find(x => x.id === p.concernId);
      must(concern && concern.referral && concern.referral.state === 'Returned', 'Select a returned referral.');
      text(p.addition, 'Missing information now supplied', 10);
      concern.evidence = (concern.evidence === 'None recorded' ? '' : concern.evidence + '\n') + p.addition.trim();
      concern.referral.state = 'Prepared';
      concern.referral.revisions += 1;
      concern.history.push({at, actor: me, text: `Returned referral corrected (revision ${concern.referral.revisions}); the original submission and return reason are retained.`});
      description = `Referral ${concern.referral.ref} corrected and ready to resubmit. The original request was not rewritten.`;
      touch(r, 'Concern', description, concern.referral.ref);
      resultRef = concern.referral.ref;

    } else if (c.type === 'receiveReferral') {
      need('receive');
      const r = record();
      const concern = r.concerns.find(x => x.id === p.concernId);
      must(concern && concern.referral && ['Submitted', 'Unknown'].includes(concern.referral.state), 'Select a submitted referral, or one whose outcome is unknown and needs reconciling.');
      choose(p.outcome, ['Accepted', 'Returned', 'Unknown'], 'receiving outcome');
      if (p.outcome === 'Returned') {
        concern.referral.returnedReason = text(p.reason, 'Reason for returning the referral', 10);
        concern.referral.state = 'Returned';
        description = `Referral ${concern.referral.ref} returned for missing information. The original submission is retained.`;
      } else if (p.outcome === 'Accepted') {
        concern.referral.receivingRef = text(p.receivingRef, 'Receiving case reference', 6);
        concern.referral.state = 'Accepted';
        description = `Service accepted responsibility as ${concern.referral.receivingRef}. Acceptance is separate from resolution.`;
      } else {
        concern.referral.state = 'Unknown';
        description = `Receiving outcome for ${concern.referral.ref} is unknown. Reconcile it before submitting again.`;
      }
      concern.history.push({at, actor: me, text: description});
      touch(r, 'Concern', description, concern.referral.ref);
      resultRef = concern.referral.ref;

    } else if (c.type === 'addTraining') {
      need('training');
      const r = record();
      text(p.participants, 'Intended participants', 4);
      text(p.topic, 'Topic or knowledge gap', 8);
      text(p.outcome, 'Requested outcome', 8);
      choose(p.trainer, owners, 'proposed trainer or owner');
      date(p.target);
      const customer = org(next, r.customer);
      const doc = p.assetId ? documentFor(next, p.assetId, customer) : null;
      const asset = doc ? doc.asset : null;
      const chosen = (doc ? doc.matches : []).find(d => d.revision === p.materialRevision) || null;
      let flag = '';
      if (!doc || !doc.matches.length) flag = 'No applicable material is recorded for this equipment. Raise a document request before training.';
      else if (!chosen) flag = 'No material revision was selected. Applicability to this exact model and configuration is unresolved.';
      else if (chosen.state === 'Superseded') flag = `Superseded material — ${doc.current ? doc.current.revision + ' is the current issue' : 'no current issue is recorded'}.`;
      const ref = 'SYN-PPO-TRN-' + String(700 + next.records.reduce((n, x) => n + x.training.length, 0) + 1).padStart(6, '0');
      r.training.push({
        id: 'tr-' + c.op, ref, participants: p.participants.trim(), assetId: p.assetId || '',
        equipment: asset ? `${asset.name} · ${asset.model} · ${asset.serial}` : 'Equipment not recorded',
        configuration: asset ? asset.software : 'Not recorded',
        topic: p.topic.trim(), gap: p.gap || p.topic.trim(), outcome: p.outcome.trim(),
        material: chosen ? {ref: chosen.ref, revision: chosen.revision, state: chosen.state, applicability: chosen.note, flag} : {ref: '', revision: '', state: 'Not recorded', applicability: 'No material selected.', flag},
        trainer: p.trainer, target: p.target, arrangement: 'Requested',
        arrangementNote: 'A date has been requested. Recording a requested date does not create a confirmed booking, appointment or resource allocation.',
        attendance: [], delivered: false, deliveredNote: '',
        assessment: 'Not assessed', assessmentBasis: 'No competence definition or assessment method is adopted in this design.',
        questions: p.questions || '', followUpOwner: p.trainer, followUpDue: p.target,
        documentRequest: null,
        history: [{at, actor: me, text: 'Training need recorded from the customer review.'}]
      });
      description = `Training need ${ref} recorded${flag ? ' with a material applicability flag' : ''}. No booking or attendance is implied.`;
      touch(r, 'Training', description, ref);
      resultRef = ref;

    } else if (c.type === 'confirmTraining') {
      need('training');
      const r = record();
      const t = r.training.find(x => x.id === p.trainingId);
      must(t, 'Select a training need.');
      must(t.arrangement === 'Requested', 'This arrangement is already confirmed.');
      date(p.confirmed);
      text(p.note, 'Confirmation detail', 8);
      must(p.acknowledge === true, 'Confirm that the scheduling workflow owns the actual booking.');
      t.arrangement = 'Confirmed';
      t.target = p.confirmed;
      t.arrangementNote = `Arrangement confirmed with the customer for ${p.confirmed}. ${p.note.trim()} The appointment itself belongs to the scheduling workflow and is not created here.`;
      t.history.push({at, actor: me, text: 'Arrangement confirmed; no appointment record was created by CR-05.'});
      description = `Training arrangement confirmed for ${p.confirmed}. Scheduling remains a separate workflow.`;
      touch(r, 'Training', description, t.ref);
      resultRef = t.ref;

    } else if (c.type === 'attendance') {
      need('training');
      const r = record();
      const t = r.training.find(x => x.id === p.trainingId);
      must(t, 'Select a training need.');
      must(t.arrangement === 'Confirmed', 'Attendance follows a confirmed arrangement.');
      must(Array.isArray(p.names) && p.names.length, 'Record who attended.');
      for (const n of p.names) text(n, 'Attendee', 2);
      t.attendance = p.names.map(n => ({name: n.trim(), at}));
      t.history.push({at, actor: me, text: 'Attendance recorded. Attendance is not proof of understanding, competence or authority to perform technical work.'});
      description = `Attendance recorded for ${t.ref}. Attendance does not establish competence or authorise technical work.`;
      touch(r, 'Training', description, t.ref);
      resultRef = t.ref;

    } else if (c.type === 'deliverTraining') {
      need('training');
      const r = record();
      const t = r.training.find(x => x.id === p.trainingId);
      must(t, 'Select a training need.');
      must(t.attendance.length, 'Record attendance before recording delivery.');
      must(!t.delivered, 'Delivery is already recorded.');
      text(p.evidence, 'Delivery evidence', 10);
      choose(p.followUpOwner, owners, 'follow-up owner');
      date(p.followUpDue);
      t.delivered = true;
      t.deliveredNote = p.evidence.trim();
      t.followUpOwner = p.followUpOwner;
      t.followUpDue = p.followUpDue;
      t.history.push({at, actor: me, text: 'Delivery recorded with evidence. Understanding remains separately assessed.'});
      r.outcomes.trainingDelivered = fact(`Delivered · ${t.ref}`, t.ref, at.slice(0, 10));
      r.obligations.push({id: 'ob-' + c.op, title: `Training follow-up for ${t.ref}`, owner: p.followUpOwner, due: p.followUpDue, state: 'Open', source: 'CR-05 · shared Activities projection'});
      description = `Training delivery recorded for ${t.ref}. Operator understanding is still Not assessed.`;
      touch(r, 'Training', description, t.ref);
      resultRef = t.ref;

    } else if (c.type === 'assessTraining') {
      need('training');
      const r = record();
      const t = r.training.find(x => x.id === p.trainingId);
      must(t, 'Select a training need.');
      must(t.delivered, 'An assessment cannot precede recorded delivery.');
      choose(p.assessment, ['Assessed · met the stated outcome', 'Assessed · further support needed'], 'assessment result');
      const basis = text(p.basis, 'Assessment method and its limits', 12);
      t.assessment = p.assessment;
      t.assessmentBasis = basis;
      t.history.push({at, actor: me, text: `Assessment recorded: ${p.assessment}.`});
      r.outcomes.competence = fact(p.assessment, `${t.ref} · ${basis.slice(0, 80)}`, at.slice(0, 10));
      description = `Assessment recorded separately from attendance and delivery for ${t.ref}.`;
      touch(r, 'Training', description, t.ref);
      resultRef = t.ref;

    } else if (c.type === 'documentRequest') {
      need('document');
      const r = record();
      const t = r.training.find(x => x.id === p.trainingId);
      must(t, 'Select a training need.');
      must(!t.documentRequest, 'A document request already exists for this training need.');
      text(p.what, 'What is needed', 8);
      choose(p.owner, owners, 'owner');
      date(p.due);
      const requestNumber = next.records.reduce((n, x) => n + x.training.filter(y => y.documentRequest).length, 0) + 1;
      t.documentRequest = {ref: 'SYN-PPO-DKR-' + String(300 + requestNumber).padStart(6, '0'), what: p.what.trim(), owner: p.owner, due: p.due, state: 'Prepared for the document workflow', at};
      t.history.push({at, actor: me, text: 'Document request prepared for the established document workflow. No copy is stored in CR-05.'});
      description = 'Document request prepared for DK-01/DK-02. CR-05 does not store documents or create another repository.';
      touch(r, 'Training', description, t.ref);
      resultRef = t.ref;

    } else if (c.type === 'prepareCommercial') {
      need('commercial');
      const r = record();
      choose(p.kind, ['Maintenance', 'Renewal', 'Upgrade'], 'discussion kind');
      const observation = text(p.observation, 'Source observation', 12);
      const need2 = text(p.need, 'Identified customer need', 12);
      choose(p.owner, owners, 'responsible owner');
      text(p.nextAction, 'Next action', 6);
      const open = openConcerns(r).map(x => x.link ? `${x.link.ref} — ${x.link.title}` : `${x.referral ? x.referral.ref : 'unreferred concern'} — ${x.symptom.slice(0, 60)}`);
      const caseOpen = next.sources.cases.filter(x => x.customer === r.customer && x.status !== 'Closed').map(x => `${x.ref} — ${x.title}`);
      const ref = 'SYN-PPO-CSG-' + String(600 + next.records.reduce((n, x) => n + x.commercial.length, 0) + 1).padStart(6, '0');
      r.commercial.push({
        id: 'cs-' + c.op, ref, kind: p.kind, observation, need: need2,
        interest: p.interest ? text(p.interest, 'Recorded customer interest', 6) : 'Not recorded',
        interestSource: p.interestSource || '',
        agreementRef: p.agreementRef || '', agreementRevision: p.agreementRevision || '', renewalReviewId: '',
        opportunityRef: '', owner: p.owner, nextAction: p.nextAction.trim(),
        openIssues: [...new Set([...open, ...caseOpen])],
        handover: null, state: 'Discussion prepared',
        history: [{at, actor: me, text: 'Commercial discussion prepared from a recorded observation and need. No quotation, agreement or opportunity exists yet.'}]
      });
      description = `${p.kind} discussion ${ref} prepared. An informal discussion is not a prepared opportunity, a quotation or an accepted agreement.`;
      touch(r, 'Commercial', description, ref);
      resultRef = ref;

    } else if (c.type === 'linkRenewal') {
      need('commercial');
      const r = record();
      const item = r.commercial.find(x => x.id === p.commercialId);
      must(item, 'Select a commercial discussion.');
      const agreement = next.sources.agreements.find(a => a.ref === p.agreementRef && a.customer === r.customer);
      must(agreement, 'Select an agreement recorded for this customer.');
      must(agreement.renewalReview, 'This agreement has no open MA-05 renewal review. Renewal reviews are opened in Service Agreements & Maintenance, not here.');
      must(!item.renewalReviewId, 'This discussion is already linked to a renewal review.');
      item.agreementRef = agreement.ref;
      item.agreementRevision = agreement.revision;
      item.renewalReviewId = agreement.renewalReview.id;
      item.history.push({at, actor: me, text: `Linked to MA-05 renewal review ${agreement.renewalReview.id}. Agreement terms, proposals and activation stay with MA-05.`});
      description = `Linked to MA-05 renewal review ${agreement.renewalReview.id}. CR-05 coordinates the Sales follow-up and does not extend, activate or vary the agreement.`;
      touch(r, 'Commercial', description, agreement.renewalReview.id);
      resultRef = agreement.renewalReview.id;

    } else if (c.type === 'linkOpportunity') {
      need('commercial');
      const r = record();
      const item = r.commercial.find(x => x.id === p.commercialId);
      must(item, 'Select a commercial discussion.');
      const opportunity = next.sources.opportunities.find(o => o.ref === p.opportunityRef && o.customer === r.customer);
      must(opportunity, 'Select an existing opportunity for this customer.');
      must(!item.opportunityRef, 'This discussion is already linked to an opportunity.');
      must(p.reviewed === true, 'Confirm that you reviewed the existing opportunities listed before linking.');
      item.opportunityRef = opportunity.ref;
      item.state = 'Opportunity linked';
      item.history.push({at, actor: me, text: `Linked to existing opportunity ${opportunity.ref} (${opportunity.stage}). No second opportunity was created.`});
      r.outcomes.opportunity = fact(`${opportunity.ref} · ${opportunity.stage}`, 'CRM · ' + opportunity.qualification, opportunity.created);
      description = `Linked to existing opportunity ${opportunity.ref}. Its CRM stage and qualification are unchanged by this link.`;
      touch(r, 'Commercial', description, opportunity.ref);
      resultRef = opportunity.ref;

    } else if (c.type === 'prepareHandover') {
      need('handover');
      const r = record();
      const item = r.commercial.find(x => x.id === p.commercialId);
      must(item, 'Select a commercial discussion.');
      must(!item.opportunityRef, 'This discussion is already linked to an existing opportunity. Use that opportunity rather than preparing a second one.');
      must(!item.handover || item.handover.state === 'Returned', 'A handover is already prepared for this discussion.');
      must(p.reviewed === true, 'Confirm that you reviewed the existing opportunities listed before preparing a new handover.');
      text(p.scope, 'Customer, site and equipment scope', 10);
      text(p.evidence, 'Source evidence', 10);
      choose(p.owner, owners, 'receiving owner');
      text(p.nextAction, 'Next action', 6);
      text(p.assumptions, 'Unresolved assumptions', 8);
      const handoverNumber = next.records.reduce((n, x) => n + x.commercial.filter(y => y.handover).length, 0) + 1;
      item.handover = {
        ref: 'SYN-PPO-HDV-' + String(650 + handoverNumber).padStart(6, '0'), state: 'Prepared',
        scope: p.scope.trim(), need: item.need, evidence: p.evidence.trim(), owner: p.owner,
        nextAction: p.nextAction.trim(), assumptions: p.assumptions.trim(),
        openIssues: item.openIssues, receivingRef: '', returnedReason: '', submittedAt: '', revisions: 1,
        qualification: 'Not qualified. Originating from an existing customer does not make a new opportunity qualified; CRM qualification rules apply on receipt.'
      };
      item.state = 'Handover prepared';
      item.history.push({at, actor: me, text: 'CRM handover prepared with the exact scope, recorded need, evidence, owner, next action and unresolved assumptions.'});
      description = `CRM handover ${item.handover.ref} prepared. Preparing is not submitting, and no opportunity exists yet.`;
      touch(r, 'Commercial', description, item.handover.ref);
      resultRef = item.handover.ref;

    } else if (c.type === 'submitHandover') {
      need('handover');
      const r = record();
      const item = r.commercial.find(x => x.id === p.commercialId);
      must(item && item.handover, 'Select a prepared handover.');
      must(item.handover.state === 'Prepared', 'Only a prepared handover can be submitted.');
      item.handover.state = 'Submitted';
      item.handover.submittedAt = at;
      item.handover.opId = c.op;
      item.state = 'Handover submitted';
      item.history.push({at, actor: me, text: 'Handover submitted to CRM. The receiving outcome is not known until CRM responds.'});
      description = `Handover ${item.handover.ref} submitted. The receiving outcome is not yet known.`;
      touch(r, 'Commercial', description, item.handover.ref);
      resultRef = item.handover.ref;

    } else if (c.type === 'receiveHandover') {
      need('receiveHandover');
      const r = record();
      const item = r.commercial.find(x => x.id === p.commercialId);
      must(item && item.handover && ['Submitted', 'Unknown'].includes(item.handover.state), 'Select a submitted handover, or one whose outcome is unknown and needs reconciling.');
      choose(p.outcome, ['Accepted', 'Returned', 'Unknown'], 'receiving outcome');
      if (p.outcome === 'Accepted') {
        const ref = text(p.receivingRef, 'Confirmed receiving opportunity reference', 6);
        must(!next.sources.opportunities.some(o => o.ref === ref), 'That opportunity reference already exists. Reconcile before recording a second acceptance.');
        item.handover.state = 'Accepted';
        item.handover.receivingRef = ref;
        item.opportunityRef = ref;
        item.state = 'Handover accepted';
        next.sources.opportunities.push({ref, customer: r.customer, title: item.need.slice(0, 70), stage: 'Enquiry', owner: item.handover.owner, created: at.slice(0, 10), origin: `CR-05 handover ${item.handover.ref}`, qualification: 'Not qualified. CRM qualification is a separate decision.'});
        r.outcomes.opportunity = fact(`${ref} · Enquiry`, `CRM · accepted from ${item.handover.ref}`, at.slice(0, 10));
        description = `CRM accepted handover ${item.handover.ref} as ${ref} at Enquiry. It is not qualified by acceptance.`;
      } else if (p.outcome === 'Returned') {
        item.handover.state = 'Returned';
        item.handover.returnedReason = text(p.reason, 'Reason for returning the handover', 10);
        item.state = 'Handover returned';
        description = `Handover ${item.handover.ref} returned. The original preparation and its evidence are retained.`;
      } else {
        item.handover.state = 'Unknown';
        item.state = 'Handover outcome unknown';
        description = `Receiving outcome for ${item.handover.ref} is unknown. Reconcile it before submitting again.`;
      }
      item.history.push({at, actor: me, text: description});
      touch(r, 'Commercial', description, item.handover.ref);
      resultRef = item.handover.ref;

    } else if (c.type === 'closeRecord') {
      need('complete');
      const r = record();
      must(r.review.state === 'Completed', 'Complete the aftercare review before closing the record.');
      must(openObligations(r).length === 0, 'Close or transfer every open obligation before closing this aftercare record.');
      must(openCommitments(r).length === 0, 'Every commitment needs a disposition before this record can be closed.');
      const unresolved = r.concerns.filter(x => x.referral && ['Submitted', 'Unknown', 'Returned'].includes(x.referral.state));
      must(unresolved.length === 0, 'Reconcile every submitted, returned or unknown referral outcome before closing.');
      text(p.reason, 'Closing basis', 10);
      r.state = 'Closed';
      description = 'Aftercare record closed. Linked cases, training, agreements and opportunities keep their own states.';
      touch(r, 'Aftercare', description);
      resultRef = r.ref;

    } else if (c.type === 'scenario') {
      need('scenario');
      choose(p.change, ['sourceChanged', 'documentSuperseded'], 'scenario');
      const r = record();
      if (p.change === 'sourceChanged') {
        next.scenario.sourceChanged = true;
        const old = r.source.revision;
        r.source.revision = 'r' + String(Number(old.replace('r', '')) + 1).padStart(2, '0');
        r.source.completeness = `Changed · the source record advanced from ${old} to ${r.source.revision} after this aftercare snapshot was taken.`;
        if (r.review.state === 'Completed') r.review.corrections.push({id: 'cr-' + c.op, at, actor: me, reason: 'Source revision changed after completion.', text: `Source ${r.source.ref} advanced to ${r.source.revision}. The completed review is retained and needs reassessment against the new revision.`, previous: {}});
        description = `Source ${r.source.ref} advanced to ${r.source.revision}. Earlier review content is retained and flagged for reassessment.`;
      } else {
        must(r.training.length, 'Select an aftercare record that has a training need with selected material.');
        next.scenario.documentSuperseded = true;
        let changed = 0;
        for (const t of r.training) {
          if (t.material.state === 'Current') {
            t.material.state = 'Superseded';
            t.material.flag = 'Superseded during this session. Confirm applicability to the exact model and configuration before training.';
            t.history.push({at, actor: me, text: 'Training material was superseded after it was selected.'});
            changed++;
          }
        }
        description = changed
          ? `${changed} selected training material revision(s) were superseded. Their applicability must be reconfirmed before training.`
          : 'No currently issued material was selected on this record; every selected revision was already superseded and remains flagged.';
      }
      touch(r, 'Source change', description);
      resultRef = r.ref;

    } else {
      throw new Error('Unsupported aftercare command.');
    }

    next.version++;
    next.history.push({at, actor: me, role, type: c.type, description, ref: resultRef});
    const receipt = {op: c.op, signature, version: next.version, at, resultRef, description};
    next.receipts.push(receipt);
    validate(next);
    return {state: next, recovered: false, receipt};
  }

  root.AC_MODEL = {
    TODAY, people, roles, owners, actor, can, views, viewTitles, savedViews, savedViewTitles,
    reasons, sourceKinds, feedbackBases, reviewMethods, dueBasisKinds, states, dispositions, outcomeKeys,
    filters, criteria, seed, clone, validate, command, query, counts, permitted,
    org, site, areaNames, assetList, openCommitments, openObligations, openConcerns, outstandingTraining,
    dueState, reviewDone, nextAction, similarCases, relatedActions, similarOpportunities, documentFor
  };
})(globalThis);
