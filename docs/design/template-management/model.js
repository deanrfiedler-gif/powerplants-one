/* DK-06 template management model: fixture identity, immutable definitions, review,
   publication policy, applicability resolution, usage impact and original-operation recovery.
   Every person, template, source value, policy and date below is synthetic. Nothing here is
   adopted Powerplants policy, approved template content or an operational approval authority. */
(() => {
  'use strict';
  const S = globalThis.PPOTemplateSchema;
  const V = globalThis.PPOTemplateValidation;

  const DEMO_START = '2026-09-17T09:00:00+10:00';
  const TZ = 'Australia/Sydney (UTC+10)';
  const clone = value => JSON.parse(JSON.stringify(value));

  /* ---- preview capability profiles ------------------------------------------------------ */

  const ROLES = {
    author: { label: 'Template author · Alex Morgan', can: ['successor', 'edit', 'validate', 'submit', 'respond', 'answers', 'export'] },
    reviewer: { label: 'Domain template reviewer · Sam Taylor', can: ['finding', 'decide', 'export'] },
    publisher: { label: 'Template publisher · Priya Nair', can: ['publish', 'retire', 'reconcile', 'configure', 'export'] },
    dual: { label: 'Author and reviewer (same person) · Taylor Quinn', can: ['successor', 'edit', 'validate', 'submit', 'respond', 'answers', 'finding', 'decide', 'export'] },
    coordinator: { label: 'Document coordinator · Jordan Lee', can: ['handover', 'followup', 'export'] },
    finance: { label: 'Restricted Finance reviewer · Morgan Reid', can: ['export'], families: ['FAM-FINANCE'] },
    readonly: { label: 'Read-only user · Casey Wu', can: [] }
  };

  const SEED_POLICIES = {
    'FAM-REPORT': { id: 'SYN-POL-DOC-01', label: 'Service customer-document review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-SURVEY': { id: 'SYN-POL-FORM-01', label: 'Discovery capture review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-PACK': { id: 'SYN-POL-PACK-01', label: 'Technician pack review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-QUOTE': { id: 'SYN-POL-QUOTE-01', label: 'Commercial presentation review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-TRANSMITTAL': { id: 'SYN-POL-ENG-01', label: 'Technical transmittal review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-COMMISSION': { id: 'SYN-POL-QA-01', label: 'Commissioning record review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true },
    'FAM-HANDOVER': null,
    'FAM-FINANCE': { id: 'SYN-POL-FIN-01', label: 'Finance evidence review (fictional)', reviewers: 1, allowSelfReview: false, requiresValidation: true }
  };

  const CONFIGURABLE_POLICY = { id: 'SYN-POL-HANDOVER-01', label: 'Staged handover review (fictional, selected in this preview)', reviewers: 1, allowSelfReview: false, requiresValidation: true };

  /* ---- dependency manifests ------------------------------------------------------------- */

  const dep = (path, sha256, bytes, kind) => ({ path, sha256, bytes, kind });
  const RENDER_CORE = [
    dep('src/documents/render.ts', '782e936300ed1ad9f71a257c5be952a515ebcf0b604b03a9a9e9005b09ed4e60', 6598, 'renderer'),
    dep('public/brand/Roboto-variable.woff', 'f6338970a62542e9a9f46ebd5a1e1c776425021edae07ce043f959b3ea97a87d', 280272, 'font'),
    dep('public/brand/powerplants-logo-green-white.png', '8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694', 315536, 'asset')
  ];
  const REPORT_DEPS = [dep('src/reports/render.ts', '31adcf77fd3ee448432de0eceb77f4082b34847a26fb2c3ada0d4a422859cf26', 13424, 'renderer'), ...RENDER_CORE];
  const PACK_DEPS = [dep('src/documents/p11-render.ts', 'c78abc71cca67c8b900721f5b67755c01255bde74febc08a2f1d2373a55a8171', 5218, 'renderer'), ...RENDER_CORE];
  const FINANCE_DEPS = [dep('src/finance/render.ts', '2758cec4155450886ba5bed33009fc16d87d4001ae64c81e79972bb1e9c860f4', 7117, 'renderer'), ...RENDER_CORE];
  /* The form fixture engine is this prototype's own bounded renderer. It has no pinned runtime
     digest, and the null below says so rather than presenting an invented integrity value. */
  const FORM_DEPS = [{ path: 'docs/design/template-management/preview.js', sha256: null, bytes: null, kind: 'renderer', note: 'Local bounded fixture engine; not a runtime renderer and not separately fingerprinted.' }];

  /* The successor asset below is a fictional reference used to demonstrate shared-dependency
     impact. It does not modify the original branded source, which stays exactly as above. */
  const SUCCESSOR_LOGO = { path: 'public/brand/powerplants-logo-green-white.png', sha256: 'synthetic-successor-reference-not-a-real-digest', bytes: 318114, kind: 'asset', note: 'Fictional successor reference used to demonstrate shared dependency impact.' };

  /* ---- families -------------------------------------------------------------------------- */

  const FAMILIES = [
    { id: 'FAM-REPORT', reference: 'SYN-PPO-TPL-REPORT', title: 'Customer service report', domain: 'Service operations', outputFamily: 'OUT-10', kind: 'document', owner: 'Service delivery (synthetic owner)', editable: true, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 },
    { id: 'FAM-SURVEY', reference: 'SYN-PPO-TPL-SURVEY', title: 'Blank questionnaire · site survey capture', domain: 'Service operations · discovery', outputFamily: 'OUT-05', kind: 'form', owner: 'Site survey (synthetic owner)', editable: true, schemaId: 'SYN-SCHEMA-SITE-SURVEY', schemaVersion: 2, receiving: 'CS-08 receiving context' },
    { id: 'FAM-PACK', reference: 'SYN-PPO-TPL-PACK', title: 'Technician job pack', domain: 'Service operations', outputFamily: 'OUT-09', kind: 'document', owner: 'Service delivery (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 },
    { id: 'FAM-QUOTE', reference: 'SYN-PPO-TPL-QUOTE', title: 'Customer quotation', domain: 'Estimating & quotation', outputFamily: 'OUT-06', kind: 'document', owner: 'Commercial (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 },
    { id: 'FAM-TRANSMITTAL', reference: 'SYN-PPO-TPL-TRANSMITTAL', title: 'Design transmittal', domain: 'Engineering & design control', outputFamily: 'OUT-08', kind: 'document', owner: 'Engineering (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 },
    { id: 'FAM-COMMISSION', reference: 'SYN-PPO-TPL-COMMISSION', title: 'Commissioning and test record', domain: 'Quality', outputFamily: 'OUT-12', kind: 'form', owner: 'Quality (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 },
    { id: 'FAM-HANDOVER', reference: 'SYN-PPO-TPL-HANDOVER', title: 'Staged handover pack', domain: 'Projects & commercial delivery', outputFamily: 'OUT-13', kind: 'document', owner: 'Projects (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-HANDOVER', schemaVersion: 1 },
    { id: 'FAM-FINANCE', reference: 'SYN-PPO-TPL-FINANCE', title: 'Finance supporting evidence', domain: 'Finance & commercial controls', outputFamily: 'OUT-14', kind: 'document', owner: 'Finance (synthetic owner)', editable: false, schemaId: 'SYN-SCHEMA-SERVICE-REPORT', schemaVersion: 3 }
  ];

  const family = id => FAMILIES.find(f => f.id === id);

  /* ---- definition construction ----------------------------------------------------------- */

  const section = (id, label, extra = {}) => ({ id, label, purpose: '', sequence: 0, repeat: null, itemKey: null, condition: null, ...extra });
  const field = (id, sectionId, type, label, extra = {}) => ({
    id, sectionId, type, label, help: '', unit: null, binding: null, required: 'optional',
    visibility: null, audience: null, options: null, protectedRef: null, sequence: 0, ...extra
  });

  const PROTECTED_BLOCKS = [
    { id: 'PB-REPORT-NOTE', label: 'Service report standing note', revision: 'v4', owner: 'Service delivery (synthetic owner)', text: 'This synthetic report records the work performed at the visit described above. Fictional standing wording retained for demonstration; it is not approved Powerplants text.' },
    { id: 'PB-QUOTE-TERMS', label: 'Quotation terms reference', revision: 'v7', owner: 'Commercial (synthetic owner)', text: 'Fictional commercial terms reference. Actual terms, validity and acceptance wording remain owned by the commercial source.' },
    { id: 'PB-BRAND', label: 'Approved masthead reference', revision: 'v2', owner: 'Brand (synthetic owner)', text: 'Approved masthead and brand block reference. Ordinary field editing cannot change it.' }
  ];

  function definition(input) {
    const fam = family(input.familyId);
    const sections = (input.sections || []).map((s, i) => ({ ...s, sequence: i + 1 }));
    const fields = (input.fields || []).map((f, i) => ({ ...f, sequence: i + 1 }));
    const record = {
      id: input.id, familyId: input.familyId, reference: fam.reference, revision: input.revision,
      state: input.state, predecessorId: input.predecessorId || null,
      title: input.title || fam.title, purpose: input.purpose || '',
      domain: fam.domain, outputFamily: fam.outputFamily,
      company: input.company || 'PPO-AU-DEMO', audience: input.audience || 'customer',
      locale: input.locale || 'en-AU', profile: input.profile || 'html-a4-r2',
      schemaId: input.schemaId || fam.schemaId, schemaVersion: input.schemaVersion || fam.schemaVersion,
      runtimeVersion: input.runtimeVersion === undefined ? null : input.runtimeVersion,
      sections, fields, protectedBlocks: input.protectedBlocks || [],
      applicability: input.applicability || { purposes: ['customer-report'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      dependencies: input.dependencies || REPORT_DEPS,
      rationale: input.rationale || '', author: input.author || 'author',
      created: input.created || DEMO_START, seeded: true
    };
    record.fingerprint = S.fingerprint(record);
    return record;
  }

  /* ---- customer service report ------------------------------------------------------------ */

  const reportSections = () => [
    section('SEC-IDENT', 'Report identity', { purpose: 'Which visit this report describes.' }),
    section('SEC-SUMMARY', 'Visit summary', { purpose: 'What was done, in the customer’s words.' }),
    section('SEC-EQUIPMENT', 'Equipment attended', { purpose: 'Each item of equipment worked on.', repeat: 'equipment', itemKey: 'id' }),
    section('SEC-FINDINGS', 'Findings', { purpose: 'What was observed.', repeat: 'findings', itemKey: 'id' }),
    section('SEC-MEASURE', 'Recorded measurements', { purpose: 'Measured values supplied by the visit record.', condition: { subject: { kind: 'source', path: 'measurement.ventTemperature' }, operator: 'isPresent' } }),
    section('SEC-ACK', 'Customer acknowledgement', { purpose: 'Who acknowledged the visit and when.' }),
    section('SEC-NOTE', 'Standing note', { purpose: 'Protected standing wording.' })
  ];

  const reportFields = () => [
    field('FLD-REF', 'SEC-IDENT', 'bound', 'Report reference', { binding: 'report.reference', required: 'source' }),
    field('FLD-DATE', 'SEC-IDENT', 'bound', 'Visit date', { binding: 'report.visitDate', required: 'source' }),
    field('FLD-CUSTOMER', 'SEC-IDENT', 'bound', 'Customer', { binding: 'report.customerName', required: 'source' }),
    field('FLD-SITE', 'SEC-IDENT', 'bound', 'Site', { binding: 'report.siteName', required: 'source' }),
    field('FLD-ADDRESS', 'SEC-IDENT', 'bound', 'Site address', { binding: 'report.siteAddress' }),
    field('FLD-SUMMARY', 'SEC-SUMMARY', 'bound', 'Work performed', { binding: 'report.summary', required: 'source' }),
    field('FLD-ATTEND', 'SEC-SUMMARY', 'bound', 'Attendance', { binding: 'report.attendance' }),
    field('FLD-PRESENT', 'SEC-SUMMARY', 'bound', 'Customer representative present', { binding: 'report.customerPresent' }),
    field('FLD-FOLLOWUP', 'SEC-SUMMARY', 'bound', 'Follow-up required', { binding: 'report.followUpRequired' }),
    field('FLD-ASSET', 'SEC-EQUIPMENT', 'bound', 'Asset reference', { binding: 'equipment.assetReference', required: 'source' }),
    field('FLD-MODEL', 'SEC-EQUIPMENT', 'bound', 'Model', { binding: 'equipment.model' }),
    field('FLD-HOURS', 'SEC-EQUIPMENT', 'bound', 'Hours run', { binding: 'equipment.hoursRun', unit: 'h' }),
    field('FLD-FREF', 'SEC-FINDINGS', 'bound', 'Finding reference', { binding: 'findings.reference', required: 'source' }),
    field('FLD-FDESC', 'SEC-FINDINGS', 'bound', 'Finding', { binding: 'findings.description', required: 'source' }),
    field('FLD-FSEV', 'SEC-FINDINGS', 'bound', 'Severity', { binding: 'findings.severity' }),
    field('FLD-FPHOTO', 'SEC-FINDINGS', 'bound', 'Photo reference', { binding: 'findings.photo' }),
    field('FLD-VENT', 'SEC-MEASURE', 'bound', 'Vent temperature', { binding: 'measurement.ventTemperature', unit: '°C' }),
    field('FLD-ACKNAME', 'SEC-ACK', 'bound', 'Acknowledged by', { binding: 'acknowledgement.name' }),
    field('FLD-ACKAT', 'SEC-ACK', 'bound', 'Acknowledged at', { binding: 'acknowledgement.at' }),
    field('FLD-NOTE', 'SEC-NOTE', 'protected', 'Standing note', { protectedRef: 'PB-REPORT-NOTE' })
  ];

  /* ---- site survey capture form ----------------------------------------------------------- */

  const surveySections = () => [
    section('SEC-SV-IDENT', 'Survey identity', { purpose: 'Which survey this capture belongs to.' }),
    section('SEC-SV-ACCESS', 'Site access and existing services', { purpose: 'What the surveyor observed on arrival.' }),
    section('SEC-SV-AREA', 'Growing area measurement', { purpose: 'Measured area for the proposed works.' })
  ];

  const surveyFields = () => [
    field('FLD-SV-REF', 'SEC-SV-IDENT', 'bound', 'Survey reference', { binding: 'survey.reference', required: 'source' }),
    field('FLD-SV-SITE', 'SEC-SV-IDENT', 'bound', 'Site', { binding: 'survey.siteName', required: 'source' }),
    field('FLD-SV-DATE', 'SEC-SV-IDENT', 'bound', 'Survey date', { binding: 'survey.surveyDate', required: 'source' }),
    field('FLD-SV-AREAREF', 'SEC-SV-IDENT', 'bound', 'Growing area reference', { binding: 'survey.growingArea' }),
    field('FLD-SV-ACCESS', 'SEC-SV-ACCESS', 'choice', 'How was site access obtained?', {
      required: 'input', options: [{ id: 'gate-code', label: 'Gate code' }, { id: 'key-collected', label: 'Key collected' }, { id: 'escorted', label: 'Escorted by site staff' }]
    }),
    field('FLD-SV-IRRIGATION', 'SEC-SV-ACCESS', 'boolean3', 'Existing irrigation present', { required: 'input', help: 'Unanswered is not No. Record Unknown where it could not be established.' }),
    field('FLD-SV-POWER', 'SEC-SV-ACCESS', 'boolean3', 'Power available at the growing area', { help: 'Unanswered, No and Unknown are three different answers.' }),
    field('FLD-SV-AGE', 'SEC-SV-ACCESS', 'number', 'Approximate age of existing irrigation', {
      unit: 'years', visibility: { subject: { kind: 'field', path: 'FLD-SV-IRRIGATION' }, operator: 'equals', value: 'yes' }
    }),
    field('FLD-SV-AREA', 'SEC-SV-AREA', 'number', 'Measured growing area', { unit: 'm²', required: 'input', help: 'Record the measured value. Zero is a measurement; it is not blank.' }),
    field('FLD-SV-NOTES', 'SEC-SV-AREA', 'textarea', 'Surveyor notes', {}),
    field('FLD-SV-PHOTO', 'SEC-SV-AREA', 'evidence', 'Photo reference', {})
  ];

  /* ---- seeded definitions ----------------------------------------------------------------- */

  const SEED_DEFINITIONS = [
    definition({
      id: 'DEF-REPORT-R01', familyId: 'FAM-REPORT', revision: 'r01', state: 'published', runtimeVersion: 1,
      purpose: 'Customer-facing record of a completed planned-service visit.',
      sections: reportSections().filter(s => s.id !== 'SEC-MEASURE'),
      fields: reportFields().filter(f => f.sectionId !== 'SEC-MEASURE'),
      protectedBlocks: [PROTECTED_BLOCKS[0]],
      rationale: 'Original synthetic service-report definition.', created: '2025-11-04T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-REPORT-R02', familyId: 'FAM-REPORT', revision: 'r02', state: 'published', predecessorId: 'DEF-REPORT-R01', runtimeVersion: 2,
      purpose: 'Customer-facing record of a completed planned-service visit, with recorded measurements.',
      sections: reportSections(), fields: reportFields(), protectedBlocks: [PROTECTED_BLOCKS[0]],
      rationale: 'Added recorded measurements where the visit record supplies them.', created: '2026-04-08T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-SURVEY-R02', familyId: 'FAM-SURVEY', revision: 'r02', state: 'published', runtimeVersion: null,
      audience: 'crew', profile: 'form-capture-r1', dependencies: FORM_DEPS,
      purpose: 'Structured discovery capture for a proposed irrigation or climate upgrade.',
      sections: surveySections(), fields: surveyFields(),
      applicability: { purposes: ['discovery-capture'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Original synthetic capture definition with conditional irrigation age.', created: '2026-05-19T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-PACK-R03', familyId: 'FAM-PACK', revision: 'r03', state: 'published', runtimeVersion: 2,
      audience: 'crew', dependencies: PACK_DEPS,
      purpose: 'Instructions and source references issued to the attending crew.',
      sections: [section('SEC-PK-IDENT', 'Pack identity'), section('SEC-PK-INSTRUCT', 'Protected instructions')],
      fields: [field('FLD-PK-REF', 'SEC-PK-IDENT', 'bound', 'Pack reference', { binding: 'report.reference', required: 'source' }),
        field('FLD-PK-TECH', 'SEC-PK-IDENT', 'bound', 'Assigned technician', { binding: 'report.technicianName' }),
        field('FLD-PK-NOTE', 'SEC-PK-INSTRUCT', 'protected', 'Completion instructions', { protectedRef: 'PB-BRAND' })],
      protectedBlocks: [PROTECTED_BLOCKS[2]],
      applicability: { purposes: ['technician-instruction'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Current supported pack definition.', created: '2026-03-02T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-PACK-R04', familyId: 'FAM-PACK', revision: 'r04', state: 'returned', predecessorId: 'DEF-PACK-R03', runtimeVersion: null,
      audience: 'crew', dependencies: PACK_DEPS,
      purpose: 'Proposed pack revision adding a site-access section.',
      sections: [section('SEC-PK-IDENT', 'Pack identity'), section('SEC-PK-ACCESS', 'Site access'), section('SEC-PK-INSTRUCT', 'Protected instructions')],
      fields: [field('FLD-PK-REF', 'SEC-PK-IDENT', 'bound', 'Pack reference', { binding: 'report.reference', required: 'source' }),
        field('FLD-PK-TECH', 'SEC-PK-IDENT', 'bound', 'Assigned technician', { binding: 'report.technicianName' }),
        field('FLD-PK-ACCESS', 'SEC-PK-ACCESS', 'text', 'Access arrangement', { required: 'input' }),
        field('FLD-PK-NOTE', 'SEC-PK-INSTRUCT', 'protected', 'Completion instructions', { protectedRef: 'PB-BRAND' })],
      protectedBlocks: [PROTECTED_BLOCKS[2]],
      applicability: { purposes: ['technician-instruction'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Capture the access arrangement on the pack rather than by message.', created: '2026-09-10T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-QUOTE-R02', familyId: 'FAM-QUOTE', revision: 'r02', state: 'published', runtimeVersion: null,
      purpose: 'Accepted customer quotation presentation.',
      sections: [section('SEC-Q-IDENT', 'Quotation identity'), section('SEC-Q-TERMS', 'Protected terms')],
      fields: [field('FLD-Q-REF', 'SEC-Q-IDENT', 'bound', 'Quotation reference', { binding: 'report.reference', required: 'source' }),
        field('FLD-Q-CUST', 'SEC-Q-IDENT', 'bound', 'Customer', { binding: 'report.customerName', required: 'source' }),
        field('FLD-Q-TERMS', 'SEC-Q-TERMS', 'protected', 'Terms reference', { protectedRef: 'PB-QUOTE-TERMS' })],
      protectedBlocks: [PROTECTED_BLOCKS[1]],
      applicability: { purposes: ['customer-quotation'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Accepted presentation retained from the quotation design family.', created: '2026-02-11T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-QUOTE-R03', familyId: 'FAM-QUOTE', revision: 'r03', state: 'published', predecessorId: 'DEF-QUOTE-R02', runtimeVersion: null,
      purpose: 'Quotation presentation with a revised summary block.',
      sections: [section('SEC-Q-IDENT', 'Quotation identity'), section('SEC-Q-SUMMARY', 'Scope summary'), section('SEC-Q-TERMS', 'Protected terms')],
      fields: [field('FLD-Q-REF', 'SEC-Q-IDENT', 'bound', 'Quotation reference', { binding: 'report.reference', required: 'source' }),
        field('FLD-Q-CUST', 'SEC-Q-IDENT', 'bound', 'Customer', { binding: 'report.customerName', required: 'source' }),
        field('FLD-Q-SUM', 'SEC-Q-SUMMARY', 'bound', 'Scope summary', { binding: 'report.summary' }),
        field('FLD-Q-TERMS', 'SEC-Q-TERMS', 'protected', 'Terms reference', { protectedRef: 'PB-QUOTE-TERMS' })],
      protectedBlocks: [PROTECTED_BLOCKS[1]],
      applicability: { purposes: ['customer-quotation'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Second published definition retained to demonstrate an overlapping assignment.', created: '2026-08-20T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-TRANSMITTAL-R02', familyId: 'FAM-TRANSMITTAL', revision: 'r02', state: 'published', runtimeVersion: null,
      audience: 'internal',
      purpose: 'Exact document-set transmittal for a technical issue.',
      sections: [section('SEC-T-IDENT', 'Transmittal identity')],
      fields: [field('FLD-T-REF', 'SEC-T-IDENT', 'bound', 'Transmittal reference', { binding: 'report.reference', required: 'source' })],
      applicability: { purposes: ['technical-transmittal'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Future-dated presentation change.', created: '2026-09-01T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-COMMISSION-R01', familyId: 'FAM-COMMISSION', revision: 'r01', state: 'retired', runtimeVersion: null,
      audience: 'internal', profile: 'form-capture-r1', dependencies: FORM_DEPS,
      purpose: 'Commissioning and retest capture, withdrawn from new use.',
      sections: [section('SEC-C-IDENT', 'Record identity')],
      fields: [field('FLD-C-REF', 'SEC-C-IDENT', 'bound', 'Record reference', { binding: 'report.reference', required: 'source' })],
      applicability: { purposes: ['commissioning-record'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Retired pending a reviewed successor; history preserved.', created: '2025-09-30T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-HANDOVER-R02', familyId: 'FAM-HANDOVER', revision: 'r02', state: 'approved', runtimeVersion: null,
      schemaId: 'SYN-SCHEMA-HANDOVER', schemaVersion: 1,
      purpose: 'Staged handover document list and outstanding obligations.',
      sections: [section('SEC-H-IDENT', 'Handover identity')],
      fields: [field('FLD-H-REF', 'SEC-H-IDENT', 'bound', 'Handover reference', { binding: 'handover.reference', required: 'source' })],
      applicability: { purposes: ['staged-handover'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Approved against a source schema this build does not hold.', created: '2026-07-14T09:00:00+10:00'
    }),
    definition({
      id: 'DEF-FINANCE-R02', familyId: 'FAM-FINANCE', revision: 'r02', state: 'draft', runtimeVersion: null,
      audience: 'restricted', profile: 'pdf-ua-r1', dependencies: FINANCE_DEPS,
      purpose: 'Restricted Finance supporting evidence, proposed as tagged PDF.',
      sections: [section('SEC-F-IDENT', 'Evidence identity'), section('SEC-F-COST', 'Internal cost')],
      fields: [field('FLD-F-REF', 'SEC-F-IDENT', 'bound', 'Evidence reference', { binding: 'report.reference', required: 'source' }),
        field('FLD-F-COST', 'SEC-F-COST', 'bound', 'Recorded labour cost', { binding: 'internal.labourCost', unit: 'AUD' })],
      applicability: { purposes: ['finance-evidence'], sites: 'Any supported site', equipment: 'Any supported equipment' },
      rationale: 'Proposed PDF profile; not supported by this build.', created: '2026-09-12T09:00:00+10:00'
    })
  ];

  const SEED_FINGERPRINTS = Object.fromEntries(SEED_DEFINITIONS.map(d => [d.id, d.fingerprint]));

  /* ---- publications ------------------------------------------------------------------------ */

  const assignment = (id, definitionId, scope, from, to, extra = {}) => ({
    id, definitionId, scope, from, to: to || null, state: 'active',
    by: 'publisher', at: '2026-09-01T09:00:00+10:00', operationId: null, ...extra
  });

  const SCOPE_REPORT = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-10', purpose: 'customer-report', audience: 'customer', locale: 'en-AU' };
  const SCOPE_SURVEY = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-05', purpose: 'discovery-capture', audience: 'crew', locale: 'en-AU' };
  const SCOPE_PACK = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-09', purpose: 'technician-instruction', audience: 'crew', locale: 'en-AU' };
  const SCOPE_QUOTE = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-06', purpose: 'customer-quotation', audience: 'customer', locale: 'en-AU' };
  const SCOPE_TRANSMITTAL = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-08', purpose: 'technical-transmittal', audience: 'internal', locale: 'en-AU' };
  const SCOPE_COMMISSION = { company: 'PPO-AU-DEMO', outputFamily: 'OUT-12', purpose: 'commissioning-record', audience: 'internal', locale: 'en-AU' };

  const SEED_PUBLICATIONS = [
    assignment('PUB-REPORT-R01', 'DEF-REPORT-R01', SCOPE_REPORT, '2025-11-10T00:00:00+10:00', '2026-04-15T00:00:00+10:00', { at: '2025-11-05T09:00:00+10:00' }),
    assignment('PUB-REPORT-R02', 'DEF-REPORT-R02', SCOPE_REPORT, '2026-04-15T00:00:00+10:00', null, { at: '2026-04-10T09:00:00+10:00' }),
    assignment('PUB-SURVEY-R02', 'DEF-SURVEY-R02', SCOPE_SURVEY, '2026-05-25T00:00:00+10:00', null, { at: '2026-05-20T09:00:00+10:00' }),
    assignment('PUB-PACK-R03', 'DEF-PACK-R03', SCOPE_PACK, '2026-03-09T00:00:00+10:00', null, { at: '2026-03-04T09:00:00+10:00' }),
    assignment('PUB-QUOTE-R02', 'DEF-QUOTE-R02', SCOPE_QUOTE, '2026-02-18T00:00:00+10:00', null, { at: '2026-02-12T09:00:00+10:00' }),
    assignment('PUB-QUOTE-R03', 'DEF-QUOTE-R03', SCOPE_QUOTE, '2026-08-25T00:00:00+10:00', null, { at: '2026-08-21T09:00:00+10:00', note: 'Overlapping assignment retained deliberately: no precedence rule is configured.' }),
    assignment('PUB-TRANSMITTAL-R02', 'DEF-TRANSMITTAL-R02', SCOPE_TRANSMITTAL, '2026-10-01T00:00:00+10:00', null, { at: '2026-09-02T09:00:00+10:00' }),
    assignment('PUB-COMMISSION-R01', 'DEF-COMMISSION-R01', SCOPE_COMMISSION, '2025-10-06T00:00:00+10:00', '2026-06-30T00:00:00+10:00', { state: 'withdrawn', at: '2026-06-25T09:00:00+10:00', reason: 'Withdrawn from new use pending a reviewed successor.' })
  ];

  /* ---- samples ------------------------------------------------------------------------------ */

  const equipmentItem = (id, assetReference, model, hoursRun) => ({ id, 'equipment.assetReference': assetReference, 'equipment.model': model, 'equipment.hoursRun': hoursRun });
  const findingItem = (id, reference, description, severity, photo) => ({ id, 'findings.reference': reference, 'findings.description': description, 'findings.severity': severity, 'findings.photo': photo });
  const remainingItem = (id, description, owner, dateNeeded, partRequired) => ({ id, 'remainingWork.description': description, 'remainingWork.owner': owner, 'remainingWork.dateNeeded': dateNeeded, 'remainingWork.partRequired': partRequired });

  const reportBase = () => ({
    'report.reference': 'SYN-SR-4471',
    'report.visitDate': '2026-09-11',
    'report.customerName': 'Northbank Growers (fictional)',
    'report.siteName': 'Northbank · Glasshouse 2',
    'report.siteAddress': '14 Example Road, Northbank VIC (fictional)',
    'report.attendance': 'Attended 08:10 to 12:40',
    'report.summary': 'Completed the scheduled service on the climate and irrigation equipment listed below.',
    'report.customerPresent': true,
    'report.followUpRequired': true,
    'measurement.ventTemperature': 24.5,
    'acknowledgement.name': 'Robin Hale (fictional)',
    'acknowledgement.at': '2026-09-11T13:05:00+10:00',
    equipment: [equipmentItem('SYN-EQ-01', 'GH2-AHU-01', 'Climate air handler', 1240), equipmentItem('SYN-EQ-02', 'GH2-IRR-03', 'Fertigation skid', 860)],
    findings: [findingItem('SYN-F-01', 'F-01', 'Vent actuator travel slightly out of range; adjusted on site.', 'Minor', 'SYN-PHOTO-2211')],
    remainingWork: [remainingItem('SYN-RW-01', 'Replace the second-stage filter set at the next visit.', 'Service coordinator', '2026-10-09', true)]
  });

  const sample = (id, shape, version, label, note, source, answers = null) => ({ id, shape, version, label, note, source, answers });

  const long = 'Northbank Growers Cooperative Limited trading as Northbank Protected Cropping and Glasshouse Services (fictional entity used to test long-name wrapping in the report presentation)';

  const REPORT_SAMPLES = [
    sample('S-COMPLETE', 'complete', 4, 'Complete visit record', 'Every mandatory source supplied.', reportBase()),
    sample('S-MISSING-MANDATORY', 'missing-mandatory', 2, 'Missing mandatory source', 'Work performed is not supplied.', (() => { const s = reportBase(); delete s['report.summary']; return s; })()),
    sample('S-OPTIONAL-EMPTY', 'optional-empty', 2, 'Optional value explicitly blank', 'Site address recorded as blank.', { ...reportBase(), 'report.siteAddress': null }),
    sample('S-ZERO-FALSE-UNKNOWN', 'zero-false-unknown', 3, 'Zero, false and unknown', 'Zero hours, zero temperature, explicit No and explicit Unknown.', {
      ...reportBase(), 'measurement.ventTemperature': 0, 'report.followUpRequired': false, 'report.customerPresent': 'unknown',
      equipment: [equipmentItem('SYN-EQ-01', 'GH2-AHU-01', 'Climate air handler', 0)],
      remainingWork: []
    }),
    sample('S-CONDITION-UNKNOWN', 'condition-unknown', 2, 'Controlling values not supplied', 'Measurement and remaining work absent from the record.', (() => { const s = reportBase(); delete s['measurement.ventTemperature']; delete s.remainingWork; return s; })()),
    sample('S-LONG-CONTENT', 'long-content', 2, 'Long names and notes', 'Long customer name and a long finding.', {
      ...reportBase(), 'report.customerName': long,
      'report.summary': 'Completed the scheduled service. ' + 'Adjusted, inspected and retested each listed item in turn, recording the observed condition against the planned task list. '.repeat(6),
      findings: [findingItem('SYN-F-01', 'F-01', 'Vent actuator travel out of range across the full run; adjusted, retested and re-measured. '.repeat(5), 'Minor', 'SYN-PHOTO-2211')]
    }),
    sample('S-REPEAT-NONE', 'repeat-none', 2, 'Repeating groups empty', 'No equipment, findings or remaining work recorded.', { ...reportBase(), equipment: [], findings: [], remainingWork: [] }),
    sample('S-REPEAT-MANY', 'repeat-many', 2, 'Repeating group with many items', 'Five distinct equipment items.', {
      ...reportBase(),
      equipment: [equipmentItem('SYN-EQ-01', 'GH2-AHU-01', 'Climate air handler', 1240), equipmentItem('SYN-EQ-02', 'GH2-IRR-03', 'Fertigation skid', 860),
        equipmentItem('SYN-EQ-03', 'GH2-SCR-01', 'Screen drive', 430), equipmentItem('SYN-EQ-04', 'GH2-SCR-02', 'Screen drive', 430),
        equipmentItem('SYN-EQ-05', 'GH2-CO2-01', 'CO₂ distribution fan', 2110)]
    }),
    sample('S-RESTRICTED', 'restricted', 2, 'Restricted source present', 'Internal cost and technician notes supplied by the source.', {
      ...reportBase(), 'internal.labourCost': 1840.5, 'internal.technicianNotes': 'Internal note: revisit chargeable under the current agreement.', 'report.technicianName': 'Dana Cole (fictional)'
    })
  ];

  const surveyBase = () => ({
    'survey.reference': 'SYN-SV-2209', 'survey.siteName': 'Northbank · Glasshouse 2',
    'survey.surveyDate': '2026-09-15', 'survey.surveyorName': 'Dana Cole (fictional)',
    'survey.growingArea': 'Bay 3 — propagation'
  });
  const surveyAnswers = () => ({ 'FLD-SV-ACCESS': 'gate-code', 'FLD-SV-IRRIGATION': 'yes', 'FLD-SV-POWER': 'yes', 'FLD-SV-AGE': 12, 'FLD-SV-AREA': 1840, 'FLD-SV-NOTES': 'Existing mains run along the northern wall.' });

  const SURVEY_SAMPLES = [
    sample('SV-COMPLETE', 'complete', 3, 'Completed capture', 'Identity supplied and every required question answered.', surveyBase(), surveyAnswers()),
    sample('SV-MISSING-MANDATORY', 'missing-mandatory', 2, 'Missing mandatory source', 'The discovery record does not supply the site.', (() => { const s = surveyBase(); delete s['survey.siteName']; return s; })(), surveyAnswers()),
    sample('SV-OPTIONAL-EMPTY', 'optional-empty', 2, 'Optional value explicitly blank', 'Growing area reference recorded as blank.', { ...surveyBase(), 'survey.growingArea': null }, surveyAnswers()),
    sample('SV-ZERO-FALSE-UNKNOWN', 'zero-false-unknown', 2, 'Zero, false and unknown answers', 'Zero measured area, an explicit No and an explicit Unknown.', surveyBase(),
      { 'FLD-SV-ACCESS': 'escorted', 'FLD-SV-IRRIGATION': 'no', 'FLD-SV-POWER': 'unknown', 'FLD-SV-AREA': 0 }),
    sample('SV-CONDITION-UNKNOWN', 'condition-unknown', 2, 'Controlling answer not supplied', 'The irrigation question is unanswered, so its follow-up is unknown rather than hidden.', surveyBase(),
      { 'FLD-SV-ACCESS': 'gate-code', 'FLD-SV-AREA': 1840 }),
    sample('SV-LONG-CONTENT', 'long-content', 2, 'Long site name and notes', 'Long identity and a long surveyor note.', { ...surveyBase(), 'survey.siteName': long },
      { ...surveyAnswers(), 'FLD-SV-NOTES': 'Existing mains run along the northern wall and continue past the propagation bays. '.repeat(6) }),
    sample('SV-RESTRICTED', 'restricted', 2, 'Restricted rate supplied', 'A restricted internal rate is present in the source record.', { ...surveyBase(), 'survey.internalRate': 145 }, surveyAnswers())
  ];

  const SAMPLES = {
    'FAM-REPORT': REPORT_SAMPLES, 'FAM-PACK': REPORT_SAMPLES, 'FAM-QUOTE': REPORT_SAMPLES,
    'FAM-TRANSMITTAL': REPORT_SAMPLES, 'FAM-COMMISSION': REPORT_SAMPLES, 'FAM-FINANCE': REPORT_SAMPLES,
    'FAM-SURVEY': SURVEY_SAMPLES, 'FAM-HANDOVER': []
  };

  /* ---- consumers and usage sources ---------------------------------------------------------- */

  const CONSUMERS = [
    { id: 'USE-01', kind: 'draft', stage: 'Draft document', definitionId: 'DEF-REPORT-R02', domain: 'Service operations', label: 'Service report draft SYN-SR-4492', owner: 'Service coordinator (synthetic)', detail: 'Not yet prepared for issue. The owning domain decides whether to reselect a definition.' },
    { id: 'USE-02', kind: 'reserved', stage: 'Reserved render request', definitionId: 'DEF-REPORT-R02', domain: 'Service operations', label: 'Reserved render OP-RND-8841', owner: 'Report worker (synthetic)', detail: 'Reserved against the exact definition, policy and source at request time. Finalisation revalidates them.' },
    { id: 'USE-03', kind: 'generated', stage: 'Generated, unissued output', definitionId: 'DEF-REPORT-R02', domain: 'Service operations', label: 'Generated bundle SYN-SR-4488', owner: 'Report worker (synthetic)', detail: 'Stored bundle with its own manifest. Templates are never swapped inside a stored bundle.', bytes: 48211, sha256: 'a41f0c98d0a1c9d4f3b1a2e7c60b5d4489e2f7a8d1c3b60e5f2a7d4c1b9e8f30' },
    { id: 'USE-04', kind: 'issued', stage: 'Issued document', definitionId: 'DEF-REPORT-R01', domain: 'Service operations', label: 'Issued report SYN-SR-3310', owner: 'Northbank Growers (fictional)', detail: 'Issued to the customer and acknowledged. Original bytes and template identity are retained unchanged.', bytes: 41288, sha256: '7c2b9e1a04d5f38c6b7a2e91c4d0f5a8b3e6c1d9074a2f5b8c3e6d1a9f4b7c20', acknowledgement: 'Acknowledged by Robin Hale (fictional) on 14 March 2026' },
    { id: 'USE-05', kind: 'issued', stage: 'Issued document', definitionId: 'DEF-REPORT-R02', domain: 'Service operations', label: 'Issued report SYN-SR-4471', owner: 'Northbank Growers (fictional)', detail: 'Issued after the r02 assignment took effect.', bytes: 43907, sha256: '1d4f7a20c9b3e8561f0a2d7c4b9e35a8c2e6b1d9f473a0c5e8b2d6f1a9c34b70', acknowledgement: 'Acknowledged by Robin Hale (fictional) on 12 September 2026' },
    { id: 'USE-06', kind: 'activeForm', stage: 'Active capture form', definitionId: 'DEF-SURVEY-R02', domain: 'Service operations · discovery', label: 'Open survey capture SYN-SV-2211', owner: 'Dana Cole (fictional)', detail: 'Entered values are unsent. The original definition and schema stay attached to them.' },
    { id: 'USE-07', kind: 'response', stage: 'Submitted form response', definitionId: 'DEF-SURVEY-R02', domain: 'Service operations · discovery', label: 'Submitted survey SYN-SV-2209', owner: 'Dana Cole (fictional)', detail: 'Historical interpretation is exact. Migration is a separate linked operation.',
      answers: { 'FLD-SV-ACCESS': 'gate-code', 'FLD-SV-IRRIGATION': 'yes', 'FLD-SV-AGE': 12, 'FLD-SV-AREA': 1840 },
      fieldMeta: { 'FLD-SV-ACCESS': { label: 'How was site access obtained?', type: 'choice', unit: null }, 'FLD-SV-IRRIGATION': { label: 'Existing irrigation present', type: 'boolean3', unit: null }, 'FLD-SV-AGE': { label: 'Approximate age of existing irrigation', type: 'number', unit: 'years' }, 'FLD-SV-AREA': { label: 'Measured growing area', type: 'number', unit: 'm²' } } },
    { id: 'USE-08', kind: 'scheduled', stage: 'Scheduled work without reserved output', definitionId: 'DEF-REPORT-R02', domain: 'Service operations', label: 'Scheduled visit SYN-APT-5521 · 24 September 2026', owner: 'Service coordinator (synthetic)', detail: 'The eligible definition is re-evaluated at the domain’s defined selection point.' },
    { id: 'USE-09', kind: 'draft', stage: 'Draft document', definitionId: 'DEF-PACK-R03', domain: 'Service operations', label: 'Pack draft SYN-JP-7712', owner: 'Service coordinator (synthetic)', detail: 'Shares the renderer and branding dependency set with the report family.' },
    { id: 'USE-10', kind: 'draft', stage: 'Draft document', definitionId: 'DEF-FINANCE-R02', domain: 'Finance & commercial controls', label: 'Finance evidence draft SYN-FIN-2204', owner: 'Finance reviewer (synthetic)', detail: 'Restricted evidence. Shares the branding dependency set.' }
  ];

  const USAGE_SOURCES = [
    { domain: 'Service operations', complete: true, asOf: '2026-09-17T08:55:00+10:00' },
    { domain: 'Service operations · discovery', complete: true, asOf: '2026-09-17T08:55:00+10:00' },
    { domain: 'Finance & commercial controls', complete: true, asOf: '2026-09-17T08:55:00+10:00' },
    { domain: 'Projects & commercial delivery', complete: false, asOf: '2026-09-17T08:20:00+10:00', reason: 'The Projects usage lookup returned a partial result. Zero rows from a failed lookup is not evidence of zero usage.' }
  ];

  /* ---- state ---------------------------------------------------------------------------------- */

  function initial() {
    return {
      schema: 1, version: 0, clock: DEMO_START,
      definitions: clone(SEED_DEFINITIONS),
      publications: clone(SEED_PUBLICATIONS),
      submissions: [{
        id: 'SUB-PACK-R04', definitionId: 'DEF-PACK-R04', fingerprint: SEED_FINGERPRINTS['DEF-PACK-R04'],
        author: 'author', purpose: 'Add a site-access section to the technician pack.',
        at: '2026-09-10T10:30:00+10:00', state: 'returned', runId: null,
        decisions: [{ actor: 'reviewer', outcome: 'returned', reason: 'Access arrangements are owned by the service request. Bind the existing source rather than adding free text.', at: '2026-09-11T09:15:00+10:00' }]
      }],
      findings: [{ id: 'FND-PACK-01', submissionId: 'SUB-PACK-R04', location: 'Access arrangement', message: 'Free-text capture duplicates an existing source field and cannot be reconciled with it.', raisedBy: 'reviewer', at: '2026-09-11T09:10:00+10:00', response: null, state: 'open' }],
      operations: [], runs: [], answers: {}, tasks: [],
      policies: clone(SEED_POLICIES),
      failNextSave: false, failNextPublish: false,
      events: [{ id: 'EV-0', at: DEMO_START, actor: 'system', type: 'seed', detail: 'Synthetic fixture catalogue loaded.' }]
    };
  }

  /* ---- lookups --------------------------------------------------------------------------------- */

  const findDefinition = (state, id) => state.definitions.find(d => d.id === id) || null;
  const definitionsFor = (state, familyId) => state.definitions.filter(d => d.familyId === familyId);
  const samplesFor = familyId => SAMPLES[familyId] || [];
  const latestRun = (state, definitionId) => [...state.runs].filter(r => r.definitionId === definitionId).sort((a, b) => a.at < b.at ? 1 : -1)[0] || null;
  const submissionsFor = (state, definitionId) => state.submissions.filter(s => s.definitionId === definitionId);
  const findingsFor = (state, submissionId) => state.findings.filter(f => f.submissionId === submissionId);
  const publicationsFor = (state, definitionId) => state.publications.filter(p => p.definitionId === definitionId);

  const scopeEqual = (a, b) => ['company', 'outputFamily', 'purpose', 'audience', 'locale'].every(k => a[k] === b[k]);
  const time = value => new Date(value).getTime();

  /* Start-inclusive, end-exclusive. An open end is represented explicitly, not as a far date. */
  const covers = (publication, at) => time(publication.from) <= time(at) && (publication.to === null || time(at) < time(publication.to));

  function eligibilityState(state, publication, at) {
    if (publication.state === 'withdrawn') return 'Withdrawn';
    if (publication.state === 'pending-unknown') return 'Outcome unknown';
    if (time(at) < time(publication.from)) return 'Future effective';
    if (publication.to !== null && time(at) >= time(publication.to)) return 'Superseded for this scope';
    return 'Eligible now';
  }

  const REQUIRED_CONTEXT = ['company', 'outputFamily', 'purpose', 'audience', 'locale'];

  function resolve(state, request, at) {
    const missing = REQUIRED_CONTEXT.filter(key => !request[key]);
    if (missing.length) return { outcome: 'missing-context', missing, detail: `Selection context is incomplete: ${missing.join(', ')} not supplied. No default is assumed.` };
    const candidates = state.publications.filter(p => p.state === 'active' && scopeEqual(p.scope, request) && covers(p, at));
    const resolved = candidates.map(p => ({ publication: p, definition: findDefinition(state, p.definitionId) })).filter(c => c.definition);
    const future = state.publications.filter(p => p.state === 'active' && scopeEqual(p.scope, request) && time(at) < time(p.from));
    if (!resolved.length)
      return {
        outcome: 'no-match',
        detail: future.length
          ? `No definition is eligible at ${at}. ${future.length} assignment is published with a later effective instant; it is not eligible before it.`
          : `No published assignment covers this context at ${at}. No newer, alphabetical or apparently more specific definition is substituted.`,
        future
      };
    const distinct = new Set(resolved.map(c => c.definition.id));
    if (distinct.size > 1)
      return { outcome: 'ambiguous', candidates: resolved, detail: `${distinct.size} definitions are assigned to the same scope and interval. No precedence rule is configured, so the request is refused rather than resolved.` };
    const choice = resolved[0];
    const structural = S.validateDefinition(choice.definition);
    const unsupported = structural.errors.find(e => ['profile-unsupported', 'profile-unknown', 'schema-unknown'].includes(e.code));
    if (unsupported) return { outcome: 'unsupported', candidates: resolved, detail: unsupported.message };
    return { outcome: 'eligible', definition: choice.definition, publication: choice.publication, detail: `${choice.definition.revision} is eligible under assignment ${choice.publication.id}.` };
  }

  /* ---- comparison and impact ------------------------------------------------------------------- */

  function compare(previous, next) {
    const out = { added: [], removed: [], labelOnly: [], meaning: [], binding: [], requiredness: [], conditions: [], reordered: [], dependencies: [], applicability: [], sections: [] };
    if (!previous) return out;
    const before = new Map(previous.fields.map(f => [f.id, f]));
    const after = new Map(next.fields.map(f => [f.id, f]));
    for (const [id, f] of after) if (!before.has(id)) out.added.push({ id, label: f.label, detail: `New ${S.FIELD_TYPES[f.type]?.label || f.type} in ${next.sections.find(s => s.id === f.sectionId)?.label || f.sectionId}.` });
    for (const [id, f] of before) if (!after.has(id)) out.removed.push({ id, label: f.label, detail: 'Removed from the successor. Historical answers keep their original identity.' });
    for (const [id, f] of after) {
      const old = before.get(id); if (!old) continue;
      if (old.label !== f.label) out.labelOnly.push({ id, label: f.label, detail: `"${old.label}" → "${f.label}"` });
      if (old.type !== f.type || (old.unit || null) !== (f.unit || null))
        out.meaning.push({ id, label: f.label, detail: `type ${old.type} → ${f.type}; unit ${old.unit || 'none'} → ${f.unit || 'none'}. A change of unit or type changes meaning and needs explicit compatibility treatment.` });
      if ((old.binding || null) !== (f.binding || null)) out.binding.push({ id, label: f.label, detail: `${old.binding || 'unbound'} → ${f.binding || 'unbound'}` });
      if (old.required !== f.required) out.requiredness.push({ id, label: f.label, detail: `${old.required} → ${f.required}` });
      if (S.canonical(old.visibility || null) !== S.canonical(f.visibility || null)) out.conditions.push({ id, label: f.label, detail: `${S.describe(old.visibility)} → ${S.describe(f.visibility)}` });
      if (old.sequence !== f.sequence) out.reordered.push({ id, label: f.label, detail: `position ${old.sequence} → ${f.sequence}` });
    }
    const beforeSections = new Map(previous.sections.map(s => [s.id, s]));
    for (const s of next.sections) {
      const old = beforeSections.get(s.id);
      if (!old) { out.sections.push({ id: s.id, label: s.label, detail: 'New section.' }); continue; }
      if (S.canonical(old.condition || null) !== S.canonical(s.condition || null))
        out.conditions.push({ id: s.id, label: s.label, detail: `${S.describe(old.condition)} → ${S.describe(s.condition)}` });
    }
    for (const s of previous.sections) if (!next.sections.some(n => n.id === s.id)) out.sections.push({ id: s.id, label: s.label, detail: 'Section removed.' });
    const beforeDeps = new Map(previous.dependencies.map(d => [d.path, d]));
    for (const d of next.dependencies) {
      const old = beforeDeps.get(d.path);
      if (!old) out.dependencies.push({ id: d.path, label: d.path, detail: 'New dependency reference.' });
      else if (old.sha256 !== d.sha256) out.dependencies.push({ id: d.path, label: d.path, detail: `${S.short(old.sha256)} → ${S.short(d.sha256)}` });
    }
    if (S.canonical(previous.applicability) !== S.canonical(next.applicability))
      out.applicability.push({ id: 'applicability', label: 'Applicability', detail: 'Applicability configuration differs between these definitions.' });
    return out;
  }

  function sharedDependencyFamilies(state, definition) {
    const paths = new Set(definition.dependencies.map(d => d.path));
    const affected = new Map();
    for (const other of state.definitions) {
      if (other.familyId === definition.familyId) continue;
      const shared = other.dependencies.filter(d => paths.has(d.path));
      if (!shared.length) continue;
      const entry = affected.get(other.familyId) || { familyId: other.familyId, family: family(other.familyId), paths: new Set(), definitions: [] };
      shared.forEach(d => entry.paths.add(d.path));
      entry.definitions.push(other.id);
      affected.set(other.familyId, entry);
    }
    return [...affected.values()].map(e => ({ ...e, paths: [...e.paths] }));
  }

  function impact(state, definitionId) {
    const definition = findDefinition(state, definitionId);
    if (!definition) return null;
    const predecessor = definition.predecessorId ? findDefinition(state, definition.predecessorId) : null;
    const target = predecessor || definition;
    const consumers = CONSUMERS.filter(c => c.definitionId === target.id).map(c => ({
      ...c,
      treatment: {
        draft: 'Show both definitions; the owning domain decides whether to reselect and re-prepare.',
        reserved: 'Revalidate the original template, policy and source at finalisation. A mismatch remains a stale, owned operation.',
        generated: 'Do not swap the template inside the stored bundle. Re-preparation is a new checked intent.',
        issued: 'Remains attached to its original exact template and content. Bytes, fingerprints and the recipient response are unchanged.',
        activeForm: 'Keep the entered evidence and the original definition and schema. Compatibility is a receiving decision.',
        response: 'Historical interpretation stays exact. Corrections and migrations are separate linked operations.',
        scheduled: 'Re-evaluate the eligible definition at the domain’s defined selection point.'
      }[c.kind] || 'Owned assessment required.'
    }));
    const differences = compare(predecessor, definition);
    const changedPaths = new Set(differences.dependencies.map(d => d.id));
    const affected = changedPaths.size
      ? sharedDependencyFamilies(state, definition).filter(f => f.paths.some(p => changedPaths.has(p)))
      : [];
    return {
      definition, predecessor, consumers, differences,
      sharedFamilies: affected,
      sources: USAGE_SOURCES,
      complete: USAGE_SOURCES.every(s => s.complete),
      responses: consumers.filter(c => c.kind === 'response')
    };
  }

  /* ---- applicability and dependency evidence ------------------------------------------------------ */

  function intendedScope(definition) {
    return {
      company: definition.company, outputFamily: definition.outputFamily,
      purpose: (definition.applicability.purposes || [])[0] || '', audience: definition.audience, locale: definition.locale
    };
  }

  function applicabilityEvidence(state, definition, at) {
    const scope = intendedScope(definition);
    const incomplete = resolve(state, { ...scope, company: '' }, at);
    const otherEntity = resolve(state, { ...scope, company: 'RTF-AU-DEMO' }, at);
    const ok = incomplete.outcome === 'missing-context' && otherEntity.outcome === 'no-match';
    return {
      outcome: ok ? 'passed' : 'failed',
      detail: `Incomplete context → ${incomplete.outcome}; RTF-AU-DEMO entity context → ${otherEntity.outcome}. No newer, alphabetical or cross-entity definition was substituted.`
    };
  }

  function dependencyEvidence(state, definition) {
    const predecessor = definition.predecessorId ? findDefinition(state, definition.predecessorId) : null;
    const changed = predecessor ? compare(predecessor, definition).dependencies : [];
    if (!changed.length)
      return { outcome: 'passed', detail: 'No renderer, font or shared asset reference changed in this definition, so no other family’s evidence is invalidated by it.' };
    const affected = sharedDependencyFamilies(state, definition).filter(f => f.paths.some(p => changed.some(c => c.id === p)));
    return {
      outcome: 'passed',
      detail: `${changed.length} dependency reference changed (${changed.map(c => c.label).join(', ')}). Also referenced by ${affected.length ? affected.map(f => `${f.family.title} (${f.familyId})`).join(', ') : 'no other family'}. Validation and review evidence for those families is out of date until re-run.`
    };
  }

  /* ---- publication readiness -------------------------------------------------------------------- */

  function publishChecks(state, definitionId, scope, from, to, options = {}) {
    const definition = findDefinition(state, definitionId);
    const checks = [];
    const push = (label, ok, detail) => checks.push({ label, ok, detail });
    if (!definition) return [{ label: 'Definition', ok: false, detail: 'Definition not found.' }];
    const policy = state.policies[definition.familyId];
    push('Approved decision on this exact definition', definition.state === 'approved',
      definition.state === 'approved' ? 'An approval is recorded against this exact content fingerprint.' : `The definition is ${definition.state}. Only an approved definition can be published.`);
    push('Review policy configured', !!policy, policy ? `${policy.label} (${policy.id}).` : 'Policy not configured for this family. Select a fictional configured policy before review or publication.');
    const structural = S.validateDefinition(definition);
    const unsupported = structural.errors.find(e => ['profile-unsupported', 'profile-unknown', 'schema-unknown'].includes(e.code));
    push('Supported rendering profile and source schema', !unsupported, unsupported ? unsupported.message : `${S.PROFILES[definition.profile].label}; ${definition.schemaId}@${definition.schemaVersion}.`);
    const run = latestRun(state, definitionId);
    const currency = V.currency(run, definition, samplesFor(definition.familyId));
    push('Current validation evidence', currency.state === 'current' && V.complete(run),
      currency.state !== 'current' ? `Validation is ${currency.state}. ${currency.reason}` : V.complete(run) ? `${run.passed} scenarios passed in run ${run.id}.` : `Run ${run.id} still has ${run.failed} failed, ${run.blocked} blocked and ${run.notRun} not run.`);
    const overlapping = scope ? state.publications.filter(p => p.state === 'active' && p.definitionId !== definitionId && scopeEqual(p.scope, scope) &&
      (to === null || time(p.from) < time(to)) && (p.to === null || time(from) < time(p.to))) : [];
    const supersedable = overlapping.filter(p => p.to === null && time(p.from) < time(from));
    const conflicts = overlapping.filter(p => !supersedable.includes(p));
    const confirmed = supersedable.length === 0 || options.supersede === true;
    checks.push({
      label: 'Conflict-free use assignment', ok: conflicts.length === 0 && confirmed,
      detail: conflicts.length ? `${conflicts.length} active assignment already covers this scope and interval (${conflicts.map(c => c.id).join(', ')}) and cannot be resolved by succession. No arbitrary winner is chosen.`
        : supersedable.length ? `${supersedable.length} open-ended assignment (${supersedable.map(c => c.id).join(', ')}) would be superseded from the stated instant.${confirmed ? ' Succession confirmed.' : ' Confirm that succession explicitly before publishing.'}`
          : 'No overlapping active assignment for this scope and interval.',
      supersedes: supersedable.map(p => p.id), conflicts: conflicts.map(p => p.id)
    });
    const unknown = state.operations.filter(o => o.definitionId === definitionId && o.outcome === 'unknown');
    push('No unreconciled publication operation', unknown.length === 0,
      unknown.length ? `Operation ${unknown[0].id} has an unknown outcome. Reconcile it before publishing again.` : 'No original publication operation is awaiting reconciliation.');
    return checks;
  }

  /* ---- commands ---------------------------------------------------------------------------------- */

  const can = (actor, capability) => (ROLES[actor]?.can || []).includes(capability);
  const requireRole = (actor, capability, message) => { if (!can(actor, capability)) throw new Error(message); };
  const nextId = (prefix, list) => `${prefix}-${String(list.length + 1).padStart(2, '0')}`;

  function nextRevision(definitions, familyId) {
    const numbers = definitions.filter(d => d.familyId === familyId).map(d => Number(String(d.revision).replace(/[^0-9]/g, '')) || 0);
    return 'r' + String(Math.max(0, ...numbers) + 1).padStart(2, '0');
  }

  function refreshFingerprint(definition) { definition.fingerprint = S.fingerprint(definition); return definition; }

  function editable(state, definition, actor) {
    if (!definition) throw new Error('Definition not found.');
    requireRole(actor, 'edit', 'Only a template author can edit a definition in this preview.');
    if (definition.state !== 'draft') throw new Error(`A ${definition.state} definition is read-only. Create a successor to propose a change.`);
    if (definition.seeded) throw new Error('Seeded fixture definitions are read-only. Create a successor instead.');
    return definition;
  }

  function command(state, actor, expectedVersion, action, payload = {}, now) {
    if (expectedVersion !== state.version) throw new Error('This workspace changed since the form was opened. Review the newer version before saving.');
    const next = clone(state);
    const at = now || next.clock;
    let result = null;
    const event = (type, detail, refs = {}) => next.events.push({ id: `EV-${next.events.length}`, at, actor, type, detail, ...refs });

    switch (action) {
      case 'advanceClock': {
        const hours = Number(payload.hours);
        if (!Number.isFinite(hours) || hours <= 0) throw new Error('Advance the demonstration clock by a positive number of hours.');
        next.clock = new Date(time(next.clock) + hours * 3600000).toISOString();
        event('clock', `Demonstration clock advanced by ${hours} hours to ${next.clock}.`);
        result = next.clock;
        break;
      }
      case 'configurePolicy': {
        requireRole(actor, 'configure', 'Only a template publisher can select a configured policy in this preview.');
        if (next.policies[payload.familyId]) throw new Error('A policy is already configured for this family.');
        next.policies[payload.familyId] = clone(CONFIGURABLE_POLICY);
        event('policy', `Fictional review policy ${CONFIGURABLE_POLICY.id} selected for ${payload.familyId}.`);
        result = next.policies[payload.familyId];
        break;
      }
      case 'successor': {
        requireRole(actor, 'successor', 'Only a template author can create a successor in this preview.');
        const source = findDefinition(next, payload.fromDefinitionId);
        if (!source) throw new Error('Select an existing definition to succeed.');
        if (!String(payload.rationale || '').trim()) throw new Error('Record why this successor is proposed.');
        if (next.definitions.some(d => d.predecessorId === source.id && d.state === 'draft'))
          throw new Error('An editable successor draft already exists for this definition.');
        const draft = clone(source);
        draft.id = `DEF-${source.familyId.replace('FAM-', '')}-${nextRevision(next.definitions, source.familyId).toUpperCase()}`;
        draft.revision = nextRevision(next.definitions, source.familyId);
        draft.state = 'draft'; draft.predecessorId = source.id; draft.seeded = false;
        draft.runtimeVersion = null; draft.rationale = String(payload.rationale).trim();
        draft.author = actor; draft.created = at;
        refreshFingerprint(draft);
        next.definitions.push(draft);
        event('successor', `Successor ${draft.revision} created from ${source.revision}. The earlier definition is unchanged.`, { definitionId: draft.id });
        result = draft;
        break;
      }
      case 'addSection': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const label = String(payload.label || '').trim();
        if (!label) throw new Error('Give the section a label.');
        const id = payload.id || `SEC-${S.short(S.sha256(label + at)).toUpperCase()}`;
        if (definition.sections.some(s => s.id === id)) throw new Error('That section identity is already used.');
        definition.sections.push({ id, label, purpose: String(payload.purpose || '').trim(), sequence: definition.sections.length + 1, repeat: payload.repeat || null, itemKey: payload.repeat ? 'id' : null, condition: payload.condition || null });
        refreshFingerprint(definition);
        event('edit', `Section "${label}" added to ${definition.revision}.`, { definitionId: definition.id });
        result = definition.sections.at(-1);
        break;
      }
      case 'updateSection': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const target = definition.sections.find(s => s.id === payload.id);
        if (!target) throw new Error('Section not found.');
        if (payload.label !== undefined) target.label = String(payload.label).trim();
        if (payload.purpose !== undefined) target.purpose = String(payload.purpose).trim();
        if (payload.condition !== undefined) target.condition = payload.condition;
        if (payload.repeat !== undefined) { target.repeat = payload.repeat || null; target.itemKey = payload.repeat ? 'id' : null; }
        refreshFingerprint(definition);
        event('edit', `Section "${target.label}" updated in ${definition.revision}.`, { definitionId: definition.id });
        result = target;
        break;
      }
      case 'moveSection': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const index = definition.sections.findIndex(s => s.id === payload.id);
        const to = index + (payload.direction === 'up' ? -1 : 1);
        if (index < 0 || to < 0 || to >= definition.sections.length) throw new Error('That section cannot move further.');
        const identitiesBefore = definition.fields.map(f => f.id).join(',');
        const [moved] = definition.sections.splice(index, 1);
        definition.sections.splice(to, 0, moved);
        definition.sections.forEach((s, i) => { s.sequence = i + 1; });
        if (definition.fields.map(f => f.id).join(',') !== identitiesBefore) throw new Error('Reordering must not change field identity.');
        refreshFingerprint(definition);
        event('edit', `Section "${moved.label}" moved to position ${to + 1}. Field identities unchanged.`, { definitionId: definition.id });
        result = definition.sections;
        break;
      }
      case 'removeSection': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        if (definition.fields.some(f => f.sectionId === payload.id)) throw new Error('Remove or move the section’s fields first.');
        definition.sections = definition.sections.filter(s => s.id !== payload.id);
        definition.sections.forEach((s, i) => { s.sequence = i + 1; });
        refreshFingerprint(definition);
        event('edit', `Section removed from ${definition.revision}.`, { definitionId: definition.id });
        result = definition.sections;
        break;
      }
      case 'addField': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const label = String(payload.label || '').trim();
        if (!label) throw new Error('Give the field a label.');
        if (!S.FIELD_TYPES[payload.type]) throw new Error(`Field type ${payload.type} is not supported.`);
        if (payload.type === 'protected') throw new Error('Protected blocks are added by their source owner, not through ordinary field editing.');
        const id = String(payload.id || `FLD-${S.short(S.sha256(label + at)).toUpperCase()}`).trim();
        if (definition.fields.some(f => f.id === id)) throw new Error('That field identity is already used in this definition.');
        if (!definition.sections.some(s => s.id === payload.sectionId)) throw new Error('Choose a section that exists in this definition.');
        definition.fields.push(field(id, payload.sectionId, payload.type, label, {
          help: String(payload.help || '').trim(), unit: payload.unit || null, binding: payload.binding || null,
          required: payload.required || 'optional', visibility: payload.visibility || null,
          options: payload.options || null, sequence: definition.fields.length + 1
        }));
        refreshFingerprint(definition);
        event('edit', `Field "${label}" added to ${definition.revision}.`, { definitionId: definition.id });
        result = definition.fields.at(-1);
        break;
      }
      case 'updateField': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const target = definition.fields.find(f => f.id === payload.id);
        if (!target) throw new Error('Field not found.');
        if (target.type === 'protected') throw new Error('A protected block is read-only in ordinary editing. Prepare a separate proposed change to its owner.');
        for (const key of ['label', 'help', 'unit', 'binding', 'required', 'visibility', 'options', 'type'])
          if (payload[key] !== undefined) target[key] = key === 'label' || key === 'help' ? String(payload[key]).trim() : payload[key];
        if (!S.FIELD_TYPES[target.type]) throw new Error(`Field type ${target.type} is not supported.`);
        refreshFingerprint(definition);
        event('edit', `Field "${target.label}" updated in ${definition.revision}.`, { definitionId: definition.id });
        result = target;
        break;
      }
      case 'removeField': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const target = definition.fields.find(f => f.id === payload.id);
        if (!target) throw new Error('Field not found.');
        if (target.type === 'protected') throw new Error('A protected block cannot be removed through ordinary field editing.');
        definition.fields = definition.fields.filter(f => f.id !== payload.id);
        refreshFingerprint(definition);
        event('edit', `Field "${target.label}" removed from ${definition.revision}.`, { definitionId: definition.id });
        result = definition.fields;
        break;
      }
      case 'changeDependency': {
        const definition = editable(next, findDefinition(next, payload.definitionId), actor);
        const existing = definition.dependencies.findIndex(d => d.path === SUCCESSOR_LOGO.path);
        if (existing < 0) throw new Error('This definition does not reference the shared branding asset.');
        if (definition.dependencies[existing].sha256 === SUCCESSOR_LOGO.sha256) throw new Error('The successor asset reference is already selected.');
        definition.dependencies[existing] = clone(SUCCESSOR_LOGO);
        refreshFingerprint(definition);
        event('edit', 'Shared branding asset replaced by a new exact dependency reference. The original asset bytes are unchanged.', { definitionId: definition.id });
        result = definition.dependencies;
        break;
      }
      case 'validate': {
        requireRole(actor, 'validate', 'Only a template author can run the scenario matrix in this preview.');
        const definition = findDefinition(next, payload.definitionId);
        if (!definition) throw new Error('Definition not found.');
        const run = V.runAll(definition, samplesFor(definition.familyId), {
          now: at, answers: next.answers[`${definition.id}::${payload.sampleId || ''}`] || {},
          applicability: applicabilityEvidence(next, definition, at), dependency: dependencyEvidence(next, definition)
        });
        next.runs = next.runs.filter(r => r.definitionId !== definition.id || r.definitionFingerprint !== definition.fingerprint);
        next.runs.push(run);
        event('validate', `Scenario matrix executed for ${definition.revision}: ${run.passed} passed, ${run.failed} failed, ${run.blocked} blocked, ${run.notRun} not run.`, { definitionId: definition.id });
        result = run;
        break;
      }
      case 'saveAnswers': {
        requireRole(actor, 'answers', 'Only a template author can record sample answers in this preview.');
        const definition = findDefinition(next, payload.definitionId);
        if (!definition) throw new Error('Definition not found.');
        next.answers[`${definition.id}::${payload.sampleId}`] = clone(payload.answers || {});
        event('answers', `Sample answers saved against ${definition.revision} and sample ${payload.sampleId}. No operational record was created.`, { definitionId: definition.id });
        result = next.answers[`${definition.id}::${payload.sampleId}`];
        break;
      }
      case 'submit': {
        requireRole(actor, 'submit', 'Only a template author can submit a definition for review.');
        const definition = findDefinition(next, payload.definitionId);
        if (!definition) throw new Error('Definition not found.');
        if (definition.state !== 'draft') throw new Error(`This definition is ${definition.state}. Only an editable draft can be submitted.`);
        const policy = next.policies[definition.familyId];
        if (!policy) throw new Error('Policy not configured for this family. Review cannot proceed until a configured policy is selected.');
        const structural = S.validateDefinition(definition);
        if (structural.errors.length) throw new Error(`Resolve ${structural.errors.length} definition error before submitting: ${structural.errors[0].message}`);
        const run = latestRun(next, definition.id);
        const currency = V.currency(run, definition, samplesFor(definition.familyId));
        if (policy.requiresValidation && (currency.state !== 'current' || !V.complete(run)))
          throw new Error(`Current validation evidence is required by ${policy.id}. ${currency.state === 'current' ? 'The latest run is incomplete.' : currency.reason}`);
        if (!String(payload.purpose || '').trim()) throw new Error('State the review purpose.');
        const submission = {
          id: nextId('SUB', next.submissions), definitionId: definition.id, fingerprint: definition.fingerprint,
          author: actor, purpose: String(payload.purpose).trim(), at, state: 'submitted', runId: run ? run.id : null,
          decisions: []
        };
        next.submissions.push(submission);
        definition.state = 'submitted';
        event('submit', `${definition.revision} submitted for review against fingerprint ${S.short(definition.fingerprint)}.`, { definitionId: definition.id });
        result = submission;
        break;
      }
      case 'finding': {
        requireRole(actor, 'finding', 'Only a domain template reviewer can record a finding.');
        const submission = next.submissions.find(s => s.id === payload.submissionId);
        if (!submission) throw new Error('Submission not found.');
        if (submission.state !== 'submitted') throw new Error('Findings can only be recorded against an open submission.');
        if (submission.author === actor) throw new Error('Independent review is required: the author cannot review their own submission.');
        if (!String(payload.message || '').trim()) throw new Error('Describe the finding.');
        const finding = { id: nextId('FND', next.findings), submissionId: submission.id, location: String(payload.location || 'Definition').trim(), message: String(payload.message).trim(), raisedBy: actor, at, response: null, state: 'open' };
        next.findings.push(finding);
        event('finding', `Finding recorded on ${submission.id}: ${finding.message}`, { definitionId: submission.definitionId });
        result = finding;
        break;
      }
      case 'respond': {
        requireRole(actor, 'respond', 'Only the template author can answer a finding.');
        const finding = next.findings.find(f => f.id === payload.findingId);
        if (!finding) throw new Error('Finding not found.');
        if (!String(payload.response || '').trim()) throw new Error('Write the response.');
        finding.response = { by: actor, at, text: String(payload.response).trim() };
        event('respond', `Author answered finding ${finding.id}. The finding stays open until the reviewer disposes of it.`, {});
        result = finding;
        break;
      }
      case 'decide': {
        requireRole(actor, 'decide', 'Only a domain template reviewer can record a review decision.');
        const submission = next.submissions.find(s => s.id === payload.submissionId);
        if (!submission) throw new Error('Submission not found.');
        if (submission.state !== 'submitted') throw new Error('This submission already has a recorded decision.');
        const definition = findDefinition(next, submission.definitionId);
        const policy = next.policies[definition.familyId];
        if (!policy) throw new Error('Policy not configured for this family. No review decision can be recorded.');
        if (!policy.allowSelfReview && submission.author === actor) throw new Error(`${policy.id} forbids self-review.`);
        if (submission.fingerprint !== definition.fingerprint) throw new Error('The submitted content no longer matches this definition. Refresh the exact snapshot before deciding.');
        if (!String(payload.reason || '').trim()) throw new Error('Record the reason for this decision.');
        if (!['approved', 'returned'].includes(payload.outcome)) throw new Error('Choose approve or return.');
        const open = findingsFor(next, submission.id).filter(f => f.state === 'open');
        if (payload.outcome === 'approved' && open.length) throw new Error(`${open.length} finding is still open. A finding response does not close it; the reviewer must accept or return the work.`);
        submission.state = payload.outcome;
        submission.decisions.push({ actor, outcome: payload.outcome, reason: String(payload.reason).trim(), at, fingerprint: definition.fingerprint });
        definition.state = payload.outcome === 'approved' ? 'approved' : 'returned';
        event('decide', `${definition.revision} ${payload.outcome} by ${ROLES[actor].label} against fingerprint ${S.short(definition.fingerprint)}.`, { definitionId: definition.id });
        result = submission;
        break;
      }
      case 'acceptFinding': {
        requireRole(actor, 'decide', 'Only a domain template reviewer can dispose of a finding.');
        const finding = next.findings.find(f => f.id === payload.findingId);
        if (!finding) throw new Error('Finding not found.');
        if (!finding.response) throw new Error('There is no author response to accept.');
        finding.state = 'accepted';
        finding.disposition = { by: actor, at, outcome: 'accepted' };
        event('finding', `Finding ${finding.id} accepted by the reviewer.`, {});
        result = finding;
        break;
      }
      case 'correct': {
        requireRole(actor, 'successor', 'Only a template author can create a correction draft.');
        const returned = findDefinition(next, payload.definitionId);
        if (!returned || returned.state !== 'returned') throw new Error('Only a returned definition produces a correction draft.');
        returned.state = 'draft';
        event('correct', `${returned.revision} reopened for correction. Earlier findings and decisions remain attached.`, { definitionId: returned.id });
        result = returned;
        break;
      }
      case 'publish': {
        requireRole(actor, 'publish', 'Only a template publisher can publish a definition.');
        const definition = findDefinition(next, payload.definitionId);
        if (!definition) throw new Error('Definition not found.');
        const scope = payload.scope;
        const from = payload.from, to = payload.to || null;
        if (!from) throw new Error('Supply an explicit effective instant, including its timezone.');
        if (to !== null && time(to) <= time(from)) throw new Error('The end instant must be after the start instant.');
        const checks = publishChecks(next, definition.id, scope, from, to, { supersede: payload.supersede === true });
        const failed = checks.find(c => !c.ok);
        if (failed) throw new Error(`${failed.label}: ${failed.detail}`);
        const intent = S.sha256(S.canonical({ definitionId: definition.id, scope, from, to }));
        const operation = { id: `OP-${String(next.operations.length + 1).padStart(3, '0')}`, kind: 'publish', definitionId: definition.id, intent, requestedBy: actor, at, outcome: next.failNextPublish ? 'unknown' : 'completed', receipt: next.failNextPublish ? null : `RCPT-${S.short(intent).toUpperCase()}` };
        next.operations.push(operation);
        const publication = {
          id: `PUB-${S.short(intent).toUpperCase()}`, definitionId: definition.id, scope, from, to,
          state: operation.outcome === 'completed' ? 'active' : 'pending-unknown', by: actor, at, operationId: operation.id
        };
        const superseded = next.publications.filter(p => p.state === 'active' && p.definitionId !== definition.id && scopeEqual(p.scope, scope) && p.to === null && time(p.from) < time(from));
        if (operation.outcome === 'completed') for (const previous of superseded) previous.to = from;
        next.publications.push(publication);
        if (next.failNextPublish) next.failNextPublish = false;
        if (operation.outcome === 'completed') definition.state = 'published';
        event('publish', operation.outcome === 'completed'
          ? `${definition.revision} published for ${scope.company} · ${scope.outputFamily} · ${scope.purpose}, effective ${from}.`
          : `Publication of ${definition.revision} was requested but its result is unknown. Reconcile operation ${operation.id} before repeating the effect.`,
        { definitionId: definition.id });
        result = { publication, operation, superseded: superseded.map(p => p.id) };
        break;
      }
      case 'reconcile': {
        requireRole(actor, 'reconcile', 'Only a template publisher can reconcile an original operation.');
        const operation = next.operations.find(o => o.id === payload.operationId);
        if (!operation) throw new Error('Operation not found.');
        if (operation.outcome !== 'unknown') throw new Error('This operation already has a single known outcome.');
        operation.outcome = 'completed';
        operation.receipt = `RCPT-${S.short(operation.intent).toUpperCase()}`;
        operation.reconciledAt = at;
        const publication = next.publications.find(p => p.operationId === operation.id);
        if (publication && publication.state === 'pending-unknown') {
          publication.state = 'active';
          const published = findDefinition(next, publication.definitionId);
          if (published && published.state === 'approved') published.state = 'published';
          for (const previous of next.publications.filter(p => p.state === 'active' && p.id !== publication.id && p.definitionId !== publication.definitionId && scopeEqual(p.scope, publication.scope) && p.to === null && time(p.from) < time(publication.from)))
            previous.to = publication.from;
        }
        event('reconcile', `Operation ${operation.id} reconciled to one outcome with receipt ${operation.receipt}. No second publication effect was created.`, {});
        result = operation;
        break;
      }
      case 'retire': {
        requireRole(actor, 'retire', 'Only a template publisher can withdraw a definition from new use.');
        const publication = next.publications.find(p => p.id === payload.publicationId);
        if (!publication) throw new Error('Assignment not found.');
        if (publication.state !== 'active') throw new Error('Only an active assignment can be withdrawn.');
        if (!String(payload.reason || '').trim()) throw new Error('Record why this assignment is withdrawn.');
        publication.state = 'withdrawn';
        publication.reason = String(payload.reason).trim();
        publication.withdrawnBy = actor; publication.withdrawnAt = at;
        const definition = findDefinition(next, publication.definitionId);
        if (definition && !next.publications.some(p => p.definitionId === definition.id && p.state === 'active')) definition.state = 'retired';
        event('retire', `Assignment ${publication.id} withdrawn from new use. Historical evidence, issued documents and acknowledgements are unchanged.`, { definitionId: publication.definitionId });
        result = publication;
        break;
      }
      case 'handover': {
        requireRole(actor, 'handover', 'Only a document coordinator can prepare the receiving handover.');
        const definition = findDefinition(next, payload.definitionId);
        if (!definition) throw new Error('Definition not found.');
        const key = `handover:${definition.id}:${definition.fingerprint}`;
        if (next.tasks.some(t => t.key === key)) throw new Error('This exact template-selection handover is already prepared.');
        next.tasks.push({
          id: nextId('TASK', next.tasks), key, kind: 'handover', definitionId: definition.id, at, by: actor,
          label: `DK-03 template selection · ${definition.reference} ${definition.revision}`,
          detail: `Exact definition ${S.short(definition.fingerprint)}, ${definition.schemaId}@${definition.schemaVersion}, ${S.PROFILES[definition.profile].label}. Prepared locally; no document is issued and no message is sent.`
        });
        event('handover', `Template-selection handover prepared for ${definition.revision}.`, { definitionId: definition.id });
        result = next.tasks.at(-1);
        break;
      }
      case 'followup': {
        requireRole(actor, 'followup', 'Only a document coordinator can prepare owned follow-up.');
        const consumer = CONSUMERS.find(c => c.id === payload.consumerId);
        if (!consumer) throw new Error('Consumer not found.');
        if (!String(payload.note || '').trim()) throw new Error('Describe what the receiving owner must decide.');
        const key = `followup:${consumer.id}`;
        if (next.tasks.some(t => t.key === key)) throw new Error('Follow-up for this consumer is already prepared.');
        next.tasks.push({ id: nextId('TASK', next.tasks), key, kind: 'followup', consumerId: consumer.id, at, by: actor, label: `Owned follow-up · ${consumer.label}`, detail: String(payload.note).trim() });
        event('followup', `Follow-up prepared for ${consumer.label}. No consumer was upgraded and no output was regenerated.`, {});
        result = next.tasks.at(-1);
        break;
      }
      case 'failNextSave': { next.failNextSave = true; event('demo', 'The next local save will fail once, for recovery demonstration.'); result = true; break; }
      case 'failNextPublish': { next.failNextPublish = true; event('demo', 'The next publication response will be lost, for recovery demonstration.'); result = true; break; }
      default:
        throw new Error(`Action ${action} is not supported.`);
    }
    next.version = state.version + 1;
    return { state: next, result };
  }

  /* ---- stored-state validation --------------------------------------------------------------------- */

  function validState(value) {
    try {
      if (!value || value.schema !== 1 || typeof value.version !== 'number' || value.version < 0) return false;
      for (const key of ['definitions', 'publications', 'submissions', 'findings', 'operations', 'runs', 'tasks', 'events'])
        if (!Array.isArray(value[key])) return false;
      if (typeof value.answers !== 'object' || value.answers === null) return false;
      if (!value.clock || Number.isNaN(time(value.clock))) return false;
      for (const definition of value.definitions) {
        if (!definition.id || !definition.familyId || !family(definition.familyId)) return false;
        if (!Array.isArray(definition.sections) || !Array.isArray(definition.fields)) return false;
        if (S.fingerprint(definition) !== definition.fingerprint) return false;
        if (SEED_FINGERPRINTS[definition.id] && SEED_FINGERPRINTS[definition.id] !== definition.fingerprint) return false;
      }
      for (const publication of value.publications) {
        if (!publication.id || !publication.definitionId || !publication.scope) return false;
        if (Number.isNaN(time(publication.from))) return false;
        if (publication.to !== null && Number.isNaN(time(publication.to))) return false;
        if (!['active', 'withdrawn', 'pending-unknown'].includes(publication.state)) return false;
      }
      for (const operation of value.operations)
        if (!['completed', 'unknown'].includes(operation.outcome)) return false;
      for (const finding of value.findings)
        if (!finding || !finding.id || !finding.submissionId || !['open', 'accepted'].includes(finding.state)) return false;
      for (const event of value.events)
        if (!event || !event.at || Number.isNaN(time(event.at))) return false;
      return true;
    } catch { return false; }
  }

  globalThis.PPOTemplateManagement = {
    DEMO_START, TZ, ROLES, FAMILIES, CONSUMERS, USAGE_SOURCES, SAMPLES, PROTECTED_BLOCKS,
    SEED_DEFINITIONS, SEED_FINGERPRINTS, CONFIGURABLE_POLICY, SUCCESSOR_LOGO,
    initial, command, validState, resolve, impact, compare, publishChecks, eligibilityState,
    intendedScope, applicabilityEvidence, dependencyEvidence,
    findDefinition, definitionsFor, samplesFor, latestRun, submissionsFor, findingsFor, publicationsFor,
    family, scopeEqual, covers, clone, REQUIRED_CONTEXT, sharedDependencyFamilies
  };
})();
