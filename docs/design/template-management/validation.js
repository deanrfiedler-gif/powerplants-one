/* DK-06 scenario execution, diagnostic provenance and evidence currency.
   A result belongs to one exact definition, dependency set, sample, schema, audience,
   renderer profile and suite version. Any change to those inputs makes it out of date. */
(() => {
  'use strict';
  const S = globalThis.PPOTemplateSchema;
  const P = globalThis.PPOTemplatePreview;

  const SUITE_VERSION = 'DK06-SUITE-1';

  /* Scenario coverage follows the planned matrix. `expect` states what a correct
     definition should do with the sample, so a blocker can itself be a pass. */
  const SCENARIOS = [
    { id: 'SC-01', label: 'Normal complete record', shape: 'complete', expect: 'clean', note: 'Correct identity, source values, section order and required content.' },
    { id: 'SC-02', label: 'Missing mandatory source', shape: 'missing-mandatory', expect: 'blocker', note: 'Blocker points at the source binding; no invented placeholder.' },
    { id: 'SC-03', label: 'Optional field empty', shape: 'optional-empty', expect: 'clean', note: 'Clean presentation; source integrity unchanged.' },
    { id: 'SC-04', label: 'Zero, false and unknown', shape: 'zero-false-unknown', expect: 'distinct', note: 'Three meanings stay distinct; zero and false are never absent.' },
    { id: 'SC-05', label: 'Conditional branch unknown', shape: 'condition-unknown', expect: 'unknown-branch', note: 'Explicit uncertainty; required content cannot disappear.' },
    { id: 'SC-06', label: 'Long names and notes', shape: 'long-content', expect: 'clean', note: 'Readable continuation; no clipped labels.' },
    { id: 'SC-07', label: 'Repeating group with none', shape: 'repeat-none', needsRepeat: true, expect: 'clean', note: 'Explicit empty treatment.' },
    { id: 'SC-08', label: 'Repeating group with many', shape: 'repeat-many', needsRepeat: true, expect: 'stable-items', note: 'Stable item identity; no duplicated values.' },
    { id: 'SC-09', label: 'Unit or type mismatch', shape: null, expect: 'definition-error', codes: ['unit-mismatch', 'type-mismatch', 'unit-missing'], note: 'Binding validation fails explicitly rather than converting.' },
    { id: 'SC-10', label: 'Restricted source present', shape: 'restricted', expect: 'excluded', note: 'Restricted data removed before rendering, not hidden afterwards.' },
    { id: 'SC-11', label: 'Wrong company or audience', shape: null, expect: 'no-eligible', note: 'No eligible template; no cross-entity fallback.' },
    { id: 'SC-12', label: 'Missing or overlapping applicability', shape: null, expect: 'applicability', note: 'No match, missing context or ambiguous match.' },
    { id: 'SC-13', label: 'Changed shared asset or renderer', shape: null, expect: 'dependency', note: 'Stale validation and visible affected families.' },
    { id: 'SC-14', label: 'Unsupported definition or profile', shape: null, expect: 'unsupported', note: 'Clear Unsupported state; no false rendered success.' }
  ];

  const completeSample = samples => (samples || []).find(s => s.shape === 'complete') || (samples || [])[0] || null;

  function evidenceKey(definition, sample) {
    return S.sha256(S.canonical({
      definition: definition.fingerprint,
      dependencies: S.dependencyFingerprint(definition),
      sample: sample ? `${sample.id}@${sample.version}` : null,
      schema: `${definition.schemaId}@${definition.schemaVersion}`,
      audience: definition.audience,
      profile: definition.profile,
      suite: SUITE_VERSION
    }));
  }

  function runScenario(scenario, definition, samples, context) {
    const structural = S.validateDefinition(definition);
    const base = { id: scenario.id, label: scenario.label, at: context.now, suite: SUITE_VERSION };

    if (scenario.expect === 'definition-error') {
      const hits = structural.errors.filter(e => (scenario.codes || []).includes(e.code));
      return { ...base, outcome: hits.length ? 'failed' : 'passed', detail: hits.length ? `${hits.length} binding compatibility error: ${hits[0].message}` : 'No unit or type incompatibility remains in this definition.', findings: hits };
    }
    if (scenario.expect === 'unsupported') {
      const hits = structural.errors.filter(e => e.code === 'profile-unsupported' || e.code === 'profile-unknown' || e.code === 'schema-unknown');
      return { ...base, outcome: hits.length ? 'blocked' : 'passed', detail: hits.length ? hits[0].message : `${S.PROFILES[definition.profile]?.label} is supported and the source schema is known.`, findings: hits };
    }
    if (scenario.expect === 'no-eligible' || scenario.expect === 'applicability')
      return { ...base, outcome: context.applicability ? context.applicability.outcome : 'not run', detail: context.applicability ? context.applicability.detail : 'Run from Review and publication when an assignment exists.' };
    if (scenario.expect === 'dependency')
      return { ...base, outcome: context.dependency ? context.dependency.outcome : 'not run', detail: context.dependency ? context.dependency.detail : 'Run when a shared dependency successor is introduced.' };

    if (scenario.needsRepeat && !definition.sections.some(s => s.repeat))
      return { ...base, outcome: 'not applicable', detail: 'This definition contains no repeating section, so the repeated-item case does not apply to it.' };
    const sample = samples.find(s => s.shape === scenario.shape);
    if (!sample) return { ...base, outcome: 'not applicable', detail: 'No sample of this shape is registered for this family, so the case does not apply here.' };
    if (structural.errors.some(e => e.code === 'schema-unknown' || e.code === 'profile-unsupported' || e.code === 'profile-unknown'))
      return { ...base, outcome: 'blocked', detail: 'The definition cannot be rendered: its schema or rendering profile is unsupported.', sample: sample.id };

    const render = P.renderDocument(definition, sample, { answers: sample.answers || context.answers || {} });
    const blockers = render.diagnostics.filter(d => d.kind === 'blocker');
    const exclusions = render.excluded;
    const unknownBranches = render.diagnostics.filter(d => d.kind === 'condition' && d.result === S.UNKNOWN);
    const evidence = { outputSha256: render.outputSha256, outputBytes: render.outputBytes, sample: `${sample.id}@${sample.version}` };

    if (scenario.expect === 'clean')
      return { ...base, ...evidence, outcome: blockers.length ? 'failed' : 'passed', detail: blockers.length ? blockers[0].message : `Rendered ${render.outputBytes} bytes with no blocking diagnostic.`, findings: blockers };
    if (scenario.expect === 'blocker')
      return { ...base, ...evidence, outcome: blockers.length ? 'passed' : 'failed', detail: blockers.length ? `Blocked as expected: ${blockers[0].message}` : 'A mandatory source is absent but nothing blocked. A placeholder may have been substituted.', findings: blockers };
    if (scenario.expect === 'distinct') {
      const text = render.html;
      const hasZero = /tone-value">0(?:\s|<)/.test(text);
      const hasNo = text.includes('>No<');
      const hasUnknown = text.includes('>Unknown<');
      const ok = hasZero && hasNo && hasUnknown;
      return { ...base, ...evidence, outcome: ok ? 'passed' : 'failed', detail: ok ? 'Zero, No and Unknown are each rendered distinctly.' : `Distinct states missing (zero ${hasZero}, false ${hasNo}, unknown ${hasUnknown}).` };
    }
    if (scenario.expect === 'unknown-branch') {
      const hidden = !unknownBranches.length;
      return { ...base, ...evidence, outcome: hidden ? 'failed' : 'passed', detail: hidden ? 'No unknown branch was reported; a missing controlling value may have been treated as false.' : `${unknownBranches.length} condition evaluated Unknown with an explicit diagnostic.`, findings: unknownBranches };
    }
    if (scenario.expect === 'stable-items') {
      const ids = [...render.html.matchAll(/doc-item-id">([^<]+)</g)].map(m => m[1]);
      const unique = new Set(ids);
      return { ...base, ...evidence, outcome: ids.length && ids.length === unique.size ? 'passed' : 'failed', detail: `${ids.length} repeated item identities rendered, ${unique.size} distinct.` };
    }
    if (scenario.expect === 'excluded') {
      const leaked = render.html.includes('labourCost') || /\$?\d[\d,]*\.\d\d/.test(render.html) || render.html.includes('technicianNotes');
      return { ...base, ...evidence, outcome: exclusions.length && !leaked ? 'passed' : 'failed', detail: exclusions.length ? `${exclusions.length} restricted or internal source removed before rendering.` : 'No restricted source was present to exclude in this sample.', findings: exclusions };
    }
    return { ...base, outcome: 'not run', detail: 'No execution defined for this expectation.' };
  }

  function runAll(definition, samples, context) {
    const results = SCENARIOS.map(scenario => runScenario(scenario, definition, samples, context));
    return {
      id: `RUN-${context.now.replace(/[^0-9]/g, '').slice(0, 14)}-${S.short(evidenceKey(definition, samples[0]))}`,
      definitionId: definition.id,
      definitionFingerprint: definition.fingerprint,
      dependencyFingerprint: S.dependencyFingerprint(definition),
      schemaKey: `${definition.schemaId}@${definition.schemaVersion}`,
      audience: definition.audience, profile: definition.profile, suite: SUITE_VERSION,
      at: context.now, evidenceKey: evidenceKey(definition, completeSample(samples)),
      results,
      passed: results.filter(r => r.outcome === 'passed').length,
      failed: results.filter(r => r.outcome === 'failed').length,
      blocked: results.filter(r => r.outcome === 'blocked').length,
      notRun: results.filter(r => r.outcome === 'not run').length,
      notApplicable: results.filter(r => r.outcome === 'not applicable').length
    };
  }

  function currency(run, definition, samples) {
    if (!run) return { state: 'not run', reason: 'No validation has been executed for this definition.' };
    if (run.definitionFingerprint !== definition.fingerprint) return { state: 'out of date', reason: 'The definition changed after this run. Its content fingerprint no longer matches.' };
    if (run.dependencyFingerprint !== S.dependencyFingerprint(definition)) return { state: 'out of date', reason: 'A referenced asset or renderer dependency changed after this run.' };
    if (run.schemaKey !== `${definition.schemaId}@${definition.schemaVersion}`) return { state: 'out of date', reason: 'The bound source schema version changed after this run.' };
    if (run.audience !== definition.audience) return { state: 'out of date', reason: 'The intended audience changed after this run.' };
    if (run.profile !== definition.profile) return { state: 'out of date', reason: 'The rendering profile changed after this run.' };
    if (run.suite !== SUITE_VERSION) return { state: 'out of date', reason: 'The validation suite version changed after this run.' };
    const sample = samples.find(s => s.shape === 'complete');
    if (sample && run.evidenceKey !== evidenceKey(definition, sample)) return { state: 'out of date', reason: 'The sample snapshot changed after this run.' };
    return { state: 'current', reason: 'Every recorded input still matches this definition.' };
  }

  const complete = run => !!run && run.failed === 0 && run.blocked === 0 && run.notRun === 0;

  globalThis.PPOTemplateValidation = { SCENARIOS, SUITE_VERSION, runAll, runScenario, currency, complete, evidenceKey, completeSample };
})();
