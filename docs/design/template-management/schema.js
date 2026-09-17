/* DK-06 supported definition schema, source contracts and bounded rule evaluation.
   Synthetic design fixtures only. No operational template, schema or disclosure policy. */
(() => {
  'use strict';

  /* ---- canonical serialisation and exact fingerprints ---------------------------------- */

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }

  /* Synchronous SHA-256 so a fingerprint is a real digest, verifiable against node:crypto,
     rather than a display label. Web Crypto is asynchronous and cannot be used in render paths. */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  function utf8(text) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(text);
    const out = []; const s = unescape(encodeURIComponent(text));
    for (let i = 0; i < s.length; i += 1) out.push(s.charCodeAt(i));
    return Uint8Array.from(out);
  }

  function sha256(text) {
    const bytes = typeof text === 'string' ? utf8(text) : text;
    const length = bytes.length, bitLength = length * 8;
    const padded = new Uint8Array((((length + 9) >> 6) + 1) << 6);
    padded.set(bytes); padded[length] = 0x80;
    new DataView(padded.buffer).setUint32(padded.length - 4, bitLength >>> 0);
    new DataView(padded.buffer).setUint32(padded.length - 8, Math.floor(bitLength / 4294967296));
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64), view = new DataView(padded.buffer);
    const rr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t += 1) w[t] = view.getUint32(i + t * 4);
      for (let t = 16; t < 64; t += 1) {
        const s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t += 1) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      const next = [a, b, c, d, e, f, g, hh];
      for (let t = 0; t < 8; t += 1) h[t] = (h[t] + next[t]) >>> 0;
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('');
  }

  const byteLength = text => utf8(text).length;

  /* ---- supported building blocks -------------------------------------------------------- */

  const FIELD_TYPES = {
    bound: { label: 'Read-only bound value', binding: 'required', input: false },
    text: { label: 'Short text input', binding: 'optional', input: true },
    textarea: { label: 'Long text input', binding: 'optional', input: true },
    choice: { label: 'Choice', binding: 'optional', input: true, options: true },
    multichoice: { label: 'Multi-choice', binding: 'optional', input: true, options: true },
    number: { label: 'Number with unit', binding: 'optional', input: true, unit: true },
    date: { label: 'Date', binding: 'optional', input: true },
    datetime: { label: 'Date and time', binding: 'optional', input: true },
    boolean3: { label: 'Yes / no / unknown', binding: 'optional', input: true },
    evidence: { label: 'Evidence reference', binding: 'optional', input: true },
    protected: { label: 'Protected block', binding: 'forbidden', input: false, locked: true }
  };

  const OPERATORS = {
    equals: { label: 'equals', value: true },
    notEquals: { label: 'does not equal', value: true },
    isPresent: { label: 'is present', value: false },
    isAbsent: { label: 'is not present', value: false },
    isOneOf: { label: 'is one of', value: 'list' },
    allOf: { label: 'all of', group: true },
    anyOf: { label: 'any of', group: true }
  };

  const AUDIENCES = { customer: 'Customer', internal: 'Internal staff', crew: 'Assigned crew', restricted: 'Restricted Finance' };
  const CONFIDENTIALITY_ORDER = { customer: 0, crew: 1, internal: 2, restricted: 3 };

  /* ---- synthetic source schemas --------------------------------------------------------- */

  const path = (id, type, extra = {}) => ({
    id, type, unit: null, cardinality: 'one', confidentiality: 'customer', required: false, retired: false, ...extra
  });

  const SOURCE_SCHEMAS = {
    'SYN-SCHEMA-SERVICE-REPORT@3': {
      id: 'SYN-SCHEMA-SERVICE-REPORT', version: 3, domain: 'Service operations',
      owner: 'Service delivery (synthetic owner)',
      paths: [
        path('report.reference', 'text', { required: true }),
        path('report.visitDate', 'date', { required: true }),
        path('report.customerName', 'text', { required: true }),
        path('report.siteName', 'text', { required: true }),
        path('report.siteAddress', 'text'),
        path('report.technicianName', 'text', { confidentiality: 'crew' }),
        path('report.attendance', 'text'),
        path('report.summary', 'textarea', { required: true }),
        path('report.customerPresent', 'boolean3'),
        path('report.followUpRequired', 'boolean3'),
        path('equipment', 'group', { cardinality: 'many' }),
        path('equipment.assetReference', 'text', { cardinality: 'many', required: true }),
        path('equipment.model', 'text', { cardinality: 'many' }),
        path('equipment.hoursRun', 'number', { unit: 'h', cardinality: 'many' }),
        path('findings', 'group', { cardinality: 'many' }),
        path('findings.reference', 'text', { cardinality: 'many', required: true }),
        path('findings.description', 'textarea', { cardinality: 'many', required: true }),
        path('findings.severity', 'choice', { cardinality: 'many' }),
        path('findings.photo', 'evidence', { cardinality: 'many' }),
        path('remainingWork', 'group', { cardinality: 'many' }),
        path('remainingWork.description', 'textarea', { cardinality: 'many', required: true }),
        path('remainingWork.owner', 'text', { cardinality: 'many' }),
        path('remainingWork.dateNeeded', 'date', { cardinality: 'many' }),
        path('remainingWork.partRequired', 'boolean3', { cardinality: 'many' }),
        path('measurement.ventTemperature', 'number', { unit: '°C' }),
        path('measurement.airflow', 'number', { unit: 'm³/h' }),
        path('internal.labourCost', 'number', { unit: 'AUD', confidentiality: 'restricted' }),
        path('internal.technicianNotes', 'textarea', { confidentiality: 'internal' }),
        path('legacy.jobNote', 'text', { retired: true }),
        path('acknowledgement.name', 'text'),
        path('acknowledgement.at', 'datetime')
      ]
    },
    'SYN-SCHEMA-SITE-SURVEY@2': {
      id: 'SYN-SCHEMA-SITE-SURVEY', version: 2, domain: 'Service operations · discovery',
      owner: 'Site survey (synthetic owner)',
      paths: [
        path('survey.reference', 'text', { required: true }),
        path('survey.siteName', 'text', { required: true }),
        path('survey.surveyDate', 'date', { required: true }),
        path('survey.surveyorName', 'text', { confidentiality: 'crew' }),
        path('survey.growingArea', 'text'),
        path('survey.internalRate', 'number', { unit: 'AUD', confidentiality: 'restricted' })
      ]
    }
  };

  const schemaPath = (schemaKey, id) => (SOURCE_SCHEMAS[schemaKey]?.paths || []).find(p => p.id === id) || null;

  /* ---- supported renderer profiles ------------------------------------------------------ */

  const PROFILES = {
    'html-a4-r2': { label: 'Local HTML · A4 layout (profile r2)', supported: true, pdf: false },
    'form-capture-r1': { label: 'Structured form capture (profile r1)', supported: true, pdf: false },
    'pdf-ua-r1': { label: 'Tagged PDF / PDF-UA (profile r1)', supported: false, pdf: true }
  };

  /* ---- three-valued condition evaluation ------------------------------------------------ */

  const TRUE = 'true', FALSE = 'false', UNKNOWN = 'unknown';

  function subjectValue(condition, context) {
    const subject = condition.subject || {};
    if (subject.kind === 'field') {
      if (!(subject.path in (context.answers || {}))) return { state: 'missing', value: null };
      const value = context.answers[subject.path];
      return value === undefined || value === null || value === '' ? { state: 'blank', value: null } : { state: 'present', value };
    }
    if (!context.source || !(subject.path in context.source)) return { state: 'missing', value: null };
    const value = context.source[subject.path];
    if (value === undefined) return { state: 'missing', value: null };
    if (value === null) return { state: 'blank', value: null };
    if (Array.isArray(value)) return { state: value.length ? 'present' : 'empty', value };
    return { state: 'present', value };
  }

  function evaluate(condition, context) {
    if (!condition) return { result: TRUE, reason: 'No condition configured.' };
    if (OPERATORS[condition.operator]?.group) {
      const parts = (condition.conditions || []).map(c => evaluate(c, context));
      if (!parts.length) return { result: UNKNOWN, reason: 'Group condition has no members.' };
      if (condition.operator === 'allOf') {
        if (parts.some(p => p.result === FALSE)) return { result: FALSE, reason: 'At least one member condition is false.' };
        if (parts.some(p => p.result === UNKNOWN)) return { result: UNKNOWN, reason: 'At least one member condition is unknown.' };
        return { result: TRUE, reason: 'All member conditions are true.' };
      }
      if (parts.some(p => p.result === TRUE)) return { result: TRUE, reason: 'At least one member condition is true.' };
      if (parts.some(p => p.result === UNKNOWN)) return { result: UNKNOWN, reason: 'No member is true and at least one is unknown.' };
      return { result: FALSE, reason: 'Every member condition is false.' };
    }
    const found = subjectValue(condition, context);
    const label = `${condition.subject?.kind === 'field' ? 'Answer' : 'Source'} ${condition.subject?.path}`;
    if (found.state === 'missing') return { result: UNKNOWN, reason: `${label} was not supplied by this sample.`, unknownPath: condition.subject?.path };
    switch (condition.operator) {
      case 'isPresent':
        if (found.state === 'empty') return { result: FALSE, reason: `${label} is an explicitly empty set.` };
        if (found.state === 'blank') return { result: FALSE, reason: `${label} is explicitly blank.` };
        return { result: TRUE, reason: `${label} is present.` };
      case 'isAbsent':
        if (found.state === 'present') return { result: FALSE, reason: `${label} is present.` };
        return { result: TRUE, reason: `${label} is explicitly empty or blank.` };
      case 'equals':
      case 'notEquals': {
        if (found.state !== 'present') return { result: UNKNOWN, reason: `${label} has no comparable value in this sample.`, unknownPath: condition.subject?.path };
        const same = String(found.value) === String(condition.value);
        const match = condition.operator === 'equals' ? same : !same;
        return { result: match ? TRUE : FALSE, reason: `${label} is ${JSON.stringify(found.value)}.` };
      }
      case 'isOneOf': {
        if (found.state !== 'present') return { result: UNKNOWN, reason: `${label} has no comparable value in this sample.`, unknownPath: condition.subject?.path };
        const list = Array.isArray(condition.value) ? condition.value : String(condition.value || '').split(',').map(v => v.trim());
        return { result: list.map(String).includes(String(found.value)) ? TRUE : FALSE, reason: `${label} is ${JSON.stringify(found.value)}.` };
      }
      default:
        return { result: UNKNOWN, reason: `Operator ${condition.operator} is not supported.`, unsupported: true };
    }
  }

  function describe(condition) {
    if (!condition) return 'Always shown';
    if (OPERATORS[condition.operator]?.group)
      return `${condition.operator === 'allOf' ? 'All of' : 'Any of'}: ${(condition.conditions || []).map(describe).join('; ')}`;
    const subject = `${condition.subject?.kind === 'field' ? 'answer' : 'source'} ${condition.subject?.path}`;
    const operator = OPERATORS[condition.operator]?.label || condition.operator;
    return OPERATORS[condition.operator]?.value ? `${subject} ${operator} ${JSON.stringify(condition.value)}` : `${subject} ${operator}`;
  }

  /* ---- definition validation ------------------------------------------------------------ */

  function conditionSubjects(condition, out = []) {
    if (!condition) return out;
    if (OPERATORS[condition.operator]?.group) { (condition.conditions || []).forEach(c => conditionSubjects(c, out)); return out; }
    if (condition.subject) out.push(condition.subject);
    return out;
  }

  function validateDefinition(definition) {
    const errors = [], warnings = [];
    const add = (list, code, location, message) => list.push({ code, location, message });
    const schemaKey = `${definition.schemaId}@${definition.schemaVersion}`;
    const schema = SOURCE_SCHEMAS[schemaKey] || null;
    if (!schema) add(errors, 'schema-unknown', 'Definition', `Source schema ${schemaKey} is not supported by this build.`);
    const profile = PROFILES[definition.profile];
    if (!profile) add(errors, 'profile-unknown', 'Definition', `Rendering profile ${definition.profile} is not recognised.`);
    else if (!profile.supported) add(errors, 'profile-unsupported', 'Definition', `${profile.label} is not a supported rendering profile in this build.`);

    const seen = new Map();
    for (const field of definition.fields) {
      if (seen.has(field.id)) add(errors, 'duplicate-field', field.label || field.id, `Field identity ${field.id} is used more than once.`);
      seen.set(field.id, field);
      const type = FIELD_TYPES[field.type];
      if (!type) { add(errors, 'type-unsupported', field.label || field.id, `Field type ${field.type} is not supported.`); continue; }
      if (!definition.sections.some(s => s.id === field.sectionId))
        add(errors, 'orphan-field', field.label || field.id, 'Field is not attached to a section in this definition.');
      if (type.binding === 'required' && !field.binding)
        add(errors, 'mapping-needed', field.label || field.id, 'Mapping needed: a read-only bound value must reference an approved source path.');
      if (type.binding === 'forbidden' && field.binding)
        add(errors, 'binding-forbidden', field.label || field.id, 'A protected block cannot take a source binding.');
      if (field.binding && schema) {
        const source = schemaPath(schemaKey, field.binding);
        if (!source) add(errors, 'binding-unknown', field.label || field.id, `Source path ${field.binding} does not exist in ${schemaKey}.`);
        else {
          if (source.retired) add(errors, 'binding-retired', field.label || field.id, `Source path ${field.binding} is retired in ${schemaKey}.`);
          const compatible = source.type === field.type || (source.type === 'group' && field.type === 'bound') ||
            (field.type === 'bound' && ['text', 'textarea', 'number', 'date', 'datetime', 'choice', 'evidence', 'boolean3'].includes(source.type));
          if (!compatible) add(errors, 'type-mismatch', field.label || field.id, `Source ${field.binding} is ${source.type}; the field is ${field.type}.`);
          if (source.unit && field.unit && source.unit !== field.unit)
            add(errors, 'unit-mismatch', field.label || field.id, `Source ${field.binding} is recorded in ${source.unit}; the field declares ${field.unit}. No conversion is applied.`);
          if (source.unit && !field.unit)
            add(errors, 'unit-missing', field.label || field.id, `Source ${field.binding} carries unit ${source.unit}; the field must declare a compatible unit.`);
          const section = definition.sections.find(s => s.id === field.sectionId);
          if (source.cardinality === 'many' && !(section && section.repeat))
            add(errors, 'cardinality-mismatch', field.label || field.id, `Source ${field.binding} supplies many items; place it in a repeating section.`);
          const audience = definition.audience;
          if (CONFIDENTIALITY_ORDER[source.confidentiality] > CONFIDENTIALITY_ORDER[audience])
            add(errors, 'disclosure', field.label || field.id,
              `Source ${field.binding} is ${AUDIENCES[source.confidentiality]} information; this definition is issued to ${AUDIENCES[audience]}. Remove the binding — hiding the field is not exclusion.`);
        }
      }
      if (type.unit && !field.unit && !field.binding)
        add(errors, 'unit-missing', field.label || field.id, 'A number field must declare an explicit unit.');
      if (type.options && !(field.options || []).length)
        add(errors, 'options-missing', field.label || field.id, 'A choice field needs at least one stable option identity.');
    }

    for (const section of definition.sections) {
      if (section.repeat && schema) {
        const source = schemaPath(schemaKey, section.repeat);
        if (!source) add(errors, 'binding-unknown', section.label, `Repeating source ${section.repeat} does not exist in ${schemaKey}.`);
        else if (source.cardinality !== 'many') add(errors, 'cardinality-mismatch', section.label, `Repeating source ${section.repeat} does not supply many items.`);
      }
    }

    const conditions = [
      ...definition.sections.map(s => ({ location: s.label, condition: s.condition, ownerField: null })),
      ...definition.fields.map(f => ({ location: f.label || f.id, condition: f.visibility, ownerField: f.id }))
    ].filter(entry => entry.condition);

    for (const entry of conditions) {
      for (const subject of conditionSubjects(entry.condition)) {
        if (subject.kind === 'field' && !seen.has(subject.path))
          add(errors, 'reference-unknown', entry.location, `Condition references unknown field ${subject.path}.`);
        if (subject.kind === 'field' && subject.path === entry.ownerField)
          add(errors, 'self-reference', entry.location, 'A field cannot depend on its own visibility.');
        if (subject.kind === 'source' && schema && !schemaPath(schemaKey, subject.path))
          add(errors, 'reference-unknown', entry.location, `Condition references unknown source path ${subject.path}.`);
      }
      const walk = c => {
        if (OPERATORS[c.operator]?.group) { (c.conditions || []).forEach(walk); return; }
        if (!OPERATORS[c.operator]) add(errors, 'operator-unsupported', entry.location, `Operator ${c.operator} is not supported.`);
      };
      walk(entry.condition);
      if (entry.condition.operator === 'allOf') {
        const equals = (entry.condition.conditions || []).filter(c => c.operator === 'equals');
        for (const a of equals)
          for (const b of equals)
            if (a !== b && a.subject?.path === b.subject?.path && String(a.value) !== String(b.value))
              add(errors, 'contradiction', entry.location, `Condition requires ${a.subject.path} to equal two different values.`);
      }
    }

    const graph = new Map();
    for (const field of definition.fields)
      graph.set(field.id, conditionSubjects(field.visibility).filter(s => s.kind === 'field').map(s => s.path));
    const state = new Map();
    const cyclic = id => {
      if (state.get(id) === 'done') return false;
      if (state.get(id) === 'open') return true;
      state.set(id, 'open');
      for (const next of graph.get(id) || []) if (graph.has(next) && cyclic(next)) return true;
      state.set(id, 'done');
      return false;
    };
    for (const id of graph.keys())
      if (cyclic(id)) { add(errors, 'cycle', seen.get(id)?.label || id, `Condition dependency cycle reaches field ${id}.`); break; }

    for (const field of definition.fields)
      if (field.required === 'input' && field.visibility)
        warnings.push({ code: 'conditional-required', location: field.label || field.id, message: 'A required input is conditionally shown. An unknown controlling value will block validation rather than hide it.' });

    const boundPaths = new Set(definition.fields.filter(f => f.binding).map(f => f.binding));
    if (schema)
      for (const source of schema.paths)
        if (source.required && !source.retired && source.cardinality === 'one' && !boundPaths.has(source.id))
          warnings.push({ code: 'source-required-unbound', location: source.id, message: `Source ${source.id} is mandatory in ${schemaKey} and is not presented by this definition. Hiding it does not remove the source obligation.` });

    return { errors, warnings, ok: errors.length === 0 };
  }

  function definitionBody(definition) {
    return {
      familyId: definition.familyId, title: definition.title, purpose: definition.purpose,
      domain: definition.domain, outputFamily: definition.outputFamily, company: definition.company,
      audience: definition.audience, locale: definition.locale, profile: definition.profile,
      schemaId: definition.schemaId, schemaVersion: definition.schemaVersion,
      sections: definition.sections.map(s => ({ id: s.id, label: s.label, purpose: s.purpose, sequence: s.sequence, repeat: s.repeat || null, itemKey: s.itemKey || null, condition: s.condition || null })),
      fields: definition.fields.map(f => ({
        id: f.id, sectionId: f.sectionId, type: f.type, label: f.label, help: f.help || '', unit: f.unit || null,
        binding: f.binding || null, required: f.required, visibility: f.visibility || null, audience: f.audience || null,
        options: f.options || null, protectedRef: f.protectedRef || null, sequence: f.sequence
      })),
      applicability: definition.applicability, dependencies: definition.dependencies
    };
  }

  const fingerprint = definition => sha256(canonical(definitionBody(definition)));
  const dependencyFingerprint = definition => sha256(canonical(definition.dependencies));
  const short = hash => (hash || '').slice(0, 12);

  globalThis.PPOTemplateSchema = {
    canonical, sha256, byteLength, fingerprint, dependencyFingerprint, definitionBody, short,
    FIELD_TYPES, OPERATORS, AUDIENCES, CONFIDENTIALITY_ORDER, SOURCE_SCHEMAS, PROFILES,
    schemaPath, evaluate, describe, validateDefinition, conditionSubjects,
    TRUE, FALSE, UNKNOWN
  };
})();
