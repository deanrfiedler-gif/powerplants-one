/* DK-06 safe local document and form preview.
   Renders the exact selected definition against an audience-filtered synthetic sample.
   No network request, no script execution and no operational record is created. */
(() => {
  'use strict';
  const S = globalThis.PPOTemplateSchema;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const MISSING = 'missing', BLANK = 'blank', UNKNOWN_ANSWER = 'unknown';

  /* ---- audience filtering happens before projection, not in presentation ----------------- */

  function project(definition, sample) {
    const schemaKey = `${definition.schemaId}@${definition.schemaVersion}`;
    const audienceRank = S.CONFIDENTIALITY_ORDER[definition.audience];
    const source = {}, excluded = [], unknownPaths = [];
    for (const [key, value] of Object.entries(sample.source || {})) {
      const meta = S.schemaPath(schemaKey, key);
      const rank = meta ? S.CONFIDENTIALITY_ORDER[meta.confidentiality] : 0;
      if (meta && rank > audienceRank) { excluded.push({ path: key, classification: meta.confidentiality }); continue; }
      if (Array.isArray(value)) {
        source[key] = value.map(item => {
          const copy = { id: item.id };
          for (const [itemKey, itemValue] of Object.entries(item)) {
            if (itemKey === 'id') continue;
            const itemMeta = S.schemaPath(schemaKey, itemKey);
            if (itemMeta && S.CONFIDENTIALITY_ORDER[itemMeta.confidentiality] > audienceRank) { excluded.push({ path: itemKey, classification: itemMeta.confidentiality }); continue; }
            copy[itemKey] = itemValue;
          }
          return copy;
        });
        continue;
      }
      source[key] = value;
    }
    return { source, excluded, unknownPaths, schemaKey };
  }

  const stateOf = value => value === undefined ? MISSING : value === null ? BLANK : value === UNKNOWN_ANSWER ? UNKNOWN_ANSWER : 'present';

  function displayValue(field, raw) {
    const state = stateOf(raw);
    if (state === MISSING) return { state, text: 'Not supplied by this source', tone: 'missing' };
    if (state === BLANK) return { state, text: 'Recorded as blank', tone: 'blank' };
    if (state === UNKNOWN_ANSWER) return { state, text: 'Unknown', tone: 'unknown' };
    if (field.type === 'boolean3' || typeof raw === 'boolean') {
      const yes = raw === true || raw === 'yes' || raw === 'true';
      const no = raw === false || raw === 'no' || raw === 'false';
      return { state, text: yes ? 'Yes' : no ? 'No' : String(raw), tone: 'value' };
    }
    if (field.type === 'number' || typeof raw === 'number') return { state, text: `${raw}${field.unit ? ' ' + field.unit : ''}`, tone: 'value' };
    if (field.type === 'evidence') return { state, text: String(raw), tone: 'evidence' };
    return { state, text: String(raw), tone: 'value' };
  }

  /* ---- document preview ----------------------------------------------------------------- */

  function renderDocument(definition, sample, options = {}) {
    const { source, excluded, schemaKey } = project(definition, sample);
    const diagnostics = [];
    const context = { source, answers: options.answers || {} };
    const sections = [...definition.sections].sort((a, b) => a.sequence - b.sequence);
    const parts = [];

    parts.push(`<header class="doc-head"><p class="doc-kicker">${esc(definition.company)} · ${esc(S.AUDIENCES[definition.audience])} · Synthetic preview</p>` +
      `<h1>${esc(definition.title)}</h1><p class="doc-sub">${esc(definition.purpose)}</p>` +
      `<p class="doc-meta">Definition ${esc(definition.reference)} ${esc(definition.revision)} · fingerprint ${esc(S.short(definition.fingerprint))} · sample ${esc(sample.id)} v${esc(sample.version)} · ${esc(schemaKey)}</p></header>`);

    for (const section of sections) {
      const gate = S.evaluate(section.condition, context);
      if (section.condition) {
        diagnostics.push({ kind: 'condition', location: section.label, sectionId: section.id, result: gate.result, message: `${S.describe(section.condition)} → ${gate.result}. ${gate.reason}` });
        if (gate.result === S.FALSE) { parts.push(`<section class="doc-section doc-excluded"><h2>${esc(section.label)}</h2><p class="doc-note">Not applicable for this record. ${esc(gate.reason)}</p></section>`); continue; }
        if (gate.result === S.UNKNOWN) {
          const requiredInside = definition.fields.some(f => f.sectionId === section.id && f.required !== 'optional');
          parts.push(`<section class="doc-section doc-unknown"><h2>${esc(section.label)}</h2><p class="doc-note">Applicability unknown: ${esc(gate.reason)}${requiredInside ? ' Required content in this section cannot be hidden on unknown input.' : ''}</p></section>`);
          if (requiredInside) diagnostics.push({ kind: 'blocker', location: section.label, sectionId: section.id, message: 'A controlling value is unknown and this section carries required content. Obtain the source value or record a governed unknown state.' });
          continue;
        }
      }
      const fields = definition.fields.filter(f => f.sectionId === section.id).sort((a, b) => a.sequence - b.sequence);
      if (section.repeat) {
        const items = source[section.repeat];
        if (items === undefined) {
          parts.push(`<section class="doc-section"><h2>${esc(section.label)}</h2><p class="doc-note">Not supplied by this source.</p></section>`);
          diagnostics.push({ kind: 'missing', location: section.label, sectionId: section.id, message: `Repeating source ${section.repeat} was not supplied by sample ${sample.id}.` });
          continue;
        }
        if (!items.length) {
          parts.push(`<section class="doc-section"><h2>${esc(section.label)}</h2><p class="doc-note">None recorded for this visit.</p></section>`);
          continue;
        }
        const rows = items.map((item, index) => {
          const cells = fields.map(field => {
            const raw = field.binding ? item[field.binding] : undefined;
            const shown = displayValue(field, raw);
            if (shown.state === MISSING && field.required !== 'optional')
              diagnostics.push({ kind: field.required === 'source' ? 'blocker' : 'gap', location: `${section.label} · item ${item.id} · ${field.label}`, fieldId: field.id, message: `Source ${field.binding} is not supplied for item ${item.id}. No placeholder value is substituted.` });
            return `<div class="doc-pair"><dt>${esc(field.label)}</dt><dd class="tone-${shown.tone}">${esc(shown.text)}</dd></div>`;
          }).join('');
          return `<article class="doc-item"><h3>Item ${index + 1} · <span class="doc-item-id">${esc(item.id)}</span></h3><dl class="doc-pairs">${cells}</dl></article>`;
        }).join('');
        parts.push(`<section class="doc-section"><h2>${esc(section.label)} <span class="doc-count">${items.length} item${items.length === 1 ? '' : 's'}</span></h2>${rows}</section>`);
        continue;
      }
      const body = fields.map(field => {
        if (field.type === 'protected') {
          const block = (definition.protectedBlocks || []).find(b => b.id === field.protectedRef);
          return `<div class="doc-protected"><p class="doc-protected-label">${esc(block ? block.label : field.label)} · protected ${esc(block ? block.revision : 'reference')}</p><p>${esc(block ? block.text : 'Protected reference unavailable in this fixture.')}</p></div>`;
        }
        const gateField = S.evaluate(field.visibility, context);
        if (field.visibility) {
          diagnostics.push({ kind: 'condition', location: field.label, fieldId: field.id, result: gateField.result, message: `${S.describe(field.visibility)} → ${gateField.result}. ${gateField.reason}` });
          if (gateField.result === S.FALSE) return '';
          if (gateField.result === S.UNKNOWN && field.required !== 'optional')
            diagnostics.push({ kind: 'blocker', location: field.label, fieldId: field.id, message: 'A controlling value is unknown and this field is required. It is shown with an explicit uncertainty rather than hidden.' });
          else if (gateField.result === S.UNKNOWN) return `<div class="doc-pair"><dt>${esc(field.label)}</dt><dd class="tone-unknown">Shown state unknown: ${esc(gateField.reason)}</dd></div>`;
        }
        const raw = field.binding ? source[field.binding] : (options.answers || {})[field.id];
        const shown = displayValue(field, raw);
        if (shown.state === MISSING && field.required === 'source')
          diagnostics.push({ kind: 'blocker', location: field.label, fieldId: field.id, message: `Mandatory source ${field.binding || '(unbound)'} is not supplied by sample ${sample.id}. No invented placeholder is rendered.` });
        else if (shown.state === MISSING && field.required === 'input')
          diagnostics.push({ kind: 'gap', location: field.label, fieldId: field.id, message: 'Required entry has not been supplied in this sample.' });
        return `<div class="doc-pair"><dt>${esc(field.label)}${field.unit ? ` <span class="doc-unit">(${esc(field.unit)})</span>` : ''}</dt><dd class="tone-${shown.tone}">${esc(shown.text)}</dd></div>`;
      }).join('');
      parts.push(`<section class="doc-section"><h2>${esc(section.label)}</h2><dl class="doc-pairs">${body}</dl></section>`);
    }

    for (const item of excluded)
      diagnostics.push({ kind: 'exclusion', location: item.path, message: `${S.AUDIENCES[item.classification]} source ${item.path} was removed from the projection before rendering for a ${S.AUDIENCES[definition.audience]} definition.` });

    const html = `<article class="doc" lang="${esc(definition.locale)}">${parts.join('')}</article>`;
    return {
      html, diagnostics, excluded,
      outputSha256: S.sha256(html), outputBytes: S.byteLength(html),
      audience: definition.audience, sampleId: sample.id, sampleVersion: sample.version, schemaKey
    };
  }

  /* ---- form preview --------------------------------------------------------------------- */

  function formFields(definition, sample, answers) {
    const { source } = project(definition, sample);
    const context = { source, answers: answers || {} };
    const out = [];
    for (const section of [...definition.sections].sort((a, b) => a.sequence - b.sequence)) {
      const gate = S.evaluate(section.condition, context);
      const fields = definition.fields.filter(f => f.sectionId === section.id).sort((a, b) => a.sequence - b.sequence).map(field => {
        const visible = S.evaluate(field.visibility, context);
        const bound = field.binding ? source[field.binding] : undefined;
        return {
          field, visible: visible.result, visibleReason: visible.reason,
          bound, boundState: stateOf(bound),
          answer: (answers || {})[field.id], answerState: stateOf((answers || {})[field.id])
        };
      });
      out.push({ section, gate: gate.result, gateReason: gate.reason, fields });
    }
    return out;
  }

  function validateAnswers(definition, sample, answers) {
    const findings = [];
    for (const group of formFields(definition, sample, answers)) {
      if (group.gate === S.FALSE) continue;
      const requiredInside = group.fields.some(f => f.field.required !== 'optional');
      if (group.gate === S.UNKNOWN && requiredInside)
        findings.push({ severity: 'blocked', location: group.section.label, sectionId: group.section.id, message: `Controlling value unknown: ${group.gateReason} Required capture cannot be hidden.` });
      for (const entry of group.fields) {
        const f = entry.field;
        if (f.type === 'protected' || f.type === 'bound') continue;
        if (entry.visible === S.FALSE) continue;
        if (entry.visible === S.UNKNOWN && f.required !== 'optional') {
          findings.push({ severity: 'blocked', location: f.label, fieldId: f.id, message: `Controlling value unknown: ${entry.visibleReason} A required question is not hidden on unknown input.` });
          continue;
        }
        const state = entry.answerState;
        if (f.required === 'input' && (state === MISSING || state === 'blank')) {
          findings.push({ severity: 'failed', location: f.label, fieldId: f.id, message: 'Required answer is unanswered. Unanswered is not No, and not zero.' });
          continue;
        }
        if (state === 'present') {
          if (f.type === 'number' && !/^-?\d+(\.\d+)?$/.test(String(entry.answer)))
            findings.push({ severity: 'failed', location: f.label, fieldId: f.id, message: `"${entry.answer}" is not a number. No implicit conversion is applied.` });
          if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.answer)))
            findings.push({ severity: 'failed', location: f.label, fieldId: f.id, message: 'A date-only answer must be an explicit ISO 8601 date.' });
          if (f.type === 'choice' && (f.options || []).length && !f.options.some(o => o.id === entry.answer))
            findings.push({ severity: 'failed', location: f.label, fieldId: f.id, message: 'Answer is not one of the stable option identities for this field.' });
        }
      }
    }
    return findings;
  }

  /* ---- response compatibility ----------------------------------------------------------- */

  function compareResponse(response, definition) {
    const rows = [];
    for (const [fieldId, value] of Object.entries(response.answers || {})) {
      const original = (response.fieldMeta || {})[fieldId] || {};
      const current = definition.fields.find(f => f.id === fieldId);
      if (!current) { rows.push({ fieldId, value, effect: 'removed', detail: `Field ${fieldId} is not present in ${definition.revision}. The original answer keeps its own label, type and unit.` }); continue; }
      const changes = [];
      if (original.label && original.label !== current.label) changes.push(`label "${original.label}" → "${current.label}"`);
      if (original.type && original.type !== current.type) changes.push(`type ${original.type} → ${current.type}`);
      if ((original.unit || null) !== (current.unit || null)) changes.push(`unit ${original.unit || 'none'} → ${current.unit || 'none'}`);
      if (!changes.length) { rows.push({ fieldId, value, effect: 'compatible', detail: 'Identity, type and unit are unchanged.' }); continue; }
      const meaningChanged = (original.unit || null) !== (current.unit || null) || (original.type && original.type !== current.type);
      rows.push({ fieldId, value, effect: meaningChanged ? 'incompatible' : 'label-only', detail: changes.join('; ') });
    }
    return rows;
  }

  globalThis.PPOTemplatePreview = { esc, project, renderDocument, formFields, validateAnswers, compareResponse, displayValue, stateOf };
})();
