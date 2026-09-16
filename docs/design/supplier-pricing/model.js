/* Synthetic PD-03 / ES-03 design model. No operational prices or pricing policy. */
(() => {
  'use strict';
  const AS_OF = '2026-09-17';
  const clone = value => JSON.parse(JSON.stringify(value));
  const roles = { steward: 'Alex Morgan · Data steward', reviewer: 'Sam Taylor · Source reviewer', estimator: 'Riley Chen · Estimator', observer: 'Jordan Lee · Observer' };
  const source = (id, name, supplier, family, currency, unit, price, extra = {}) => ({
    id, name, supplier, family, currency, unit, product: `SYN-${id.toUpperCase()}`, company: 'PPO-AU-DEMO',
    owner: 'Alex Morgan', document: `SYN-${id.toUpperCase()}-2026-03`, revision: 3,
    effective: '2026-08-01', expires: '2026-12-31', leadDays: 28, mapping: true, available: true,
    tiers: [{ min: '1', price }], fx: currency === 'AUD' ? '1' : currency === 'EUR' ? '1.65' : '1.50',
    fxBasis: 'SYN-FX-AUG · authored demonstration assumption', fxDate: '2026-08-01',
    terms: 'Supply price only; excludes freight and import charges.', tax: 'Ex tax; no tax calculated',
    review: 'Reviewed', reviewer: 'Sam Taylor', reviewDate: '2026-08-01', ...extra
  });
  const SOURCES = [
    source('drive', 'Screen drive assemblies', 'Northline Motion · fictional', 'Screen Systems', 'EUR', 'each', '320', { tiers: [{ min: '1', price: '320' }, { min: '10', price: '300' }] }),
    source('rail', 'Screen rail · 6 m length', 'Cedar Mechanical · fictional', 'Screen Systems', 'USD', '6 m length', '48', { tiers: [{ min: '1', price: '48' }, { min: '20', price: '42' }] }),
    source('tube', 'Irrigation tube · 100 m roll', 'Clearwater Supply · fictional', 'Irrigation', 'AUD', '100 m roll', '200', { wholeUnits: true, terms: 'Tube supplied in complete 100 m rolls. Estimate basis is 200 m = 2 rolls.', leadDays: 14 }),
    source('control', 'Climate interface module', 'Canopy Controls · fictional', 'Climate', 'AUD', 'each', '1250', { expires: '2026-08-31', leadDays: null }),
    source('sensor', 'Wireless humidity sensor', 'Greenline Instruments · fictional', 'Sensors', 'USD', 'each', '120', { fx: null, fxBasis: 'Rate not supplied', fxDate: null }),
    source('valve', 'Fertigation valve assembly', 'Clearwater Supply · fictional', 'Irrigation', 'AUD', 'each', '84', { mapping: false, product: 'Unresolved supplier variant' }),
    source('freight', 'Consolidated import freight', 'Example Freight · fictional', 'Logistics', 'AUD', 'shipment', '460', { terms: 'Whole-shipment allowance; shown once as a separate estimate line.', leadDays: 35 }),
    source('spares', 'Screen service parts', 'Northline Motion · fictional', 'Screen Systems', 'EUR', 'kit', '175', { available: false, terms: 'Original supplier extract unavailable; metadata retained.' })
  ];
  const changed = (id, values, status = 'In review') => {
    const base = SOURCES.find(s => s.id === id);
    return { ...clone(base), ...values, id: `${id}-r4`, sourceId: id, revision: 4, document: `SYN-${id.toUpperCase()}-2026-04`,
      author: 'steward', status, reason: 'New synthetic supplier issue for comparison.',
      created: '2026-09-15T09:00:00Z', submitted: '2026-09-15T10:00:00Z',
      decisions: status === 'Reviewed' ? [{ actor: 'reviewer', outcome: 'Reviewed', reason: 'Synthetic source extract checked; applicability must still be checked for each estimate.', at: '2026-09-16T09:00:00Z' }] : [] };
  };
  const CANDIDATES = [
    changed('drive', { tiers: [{ min: '1', price: '346' }, { min: '10', price: '324' }], fx: '1.70', fxBasis: 'SYN-FX-SEP · 1 EUR = 1.70 AUD', fxDate: AS_OF, effective: '2026-09-17', leadDays: 35 }),
    changed('rail', { tiers: [{ min: '1', price: '50' }, { min: '20', price: '44' }], fx: '1.52', fxBasis: 'SYN-FX-SEP · 1 USD = 1.52 AUD', fxDate: AS_OF }, 'Reviewed'),
    changed('tube', { tiers: [{ min: '1', price: '208' }], leadDays: 21 }, 'Reviewed'),
    changed('control', { tiers: [{ min: '1', price: '1295' }], expires: '2026-09-10' }, 'Reviewed'),
    changed('sensor', { tiers: [{ min: '1', price: '125' }], fx: null }, 'Reviewed'),
    changed('valve', { tiers: [{ min: '1', price: '88' }] }, 'Reviewed')
  ];
  const LINES = [
    { id: 'L01', description: 'Screen drive assembly', quantity: '4', unit: 'each', sourceId: 'drive', conversion: '1', category: 'Equipment' },
    { id: 'L02', description: 'Screen rail · six-metre lengths', quantity: '24', unit: '6 m length', sourceId: 'rail', conversion: '1', category: 'Materials' },
    { id: 'L03', description: 'Irrigation tube', quantity: '200', unit: 'm', sourceId: 'tube', conversion: '0.01', conversionBasis: 'SYN-UOM-01 · 100 m per complete roll; 200 m = 2 rolls', category: 'Materials' },
    { id: 'L04', description: 'Climate interface module', quantity: '1', unit: 'each', sourceId: 'control', conversion: '1', category: 'Equipment' },
    { id: 'L05', description: 'Humidity sensors', quantity: '4', unit: 'each', sourceId: 'sensor', conversion: '1', category: 'Equipment' },
    { id: 'L06', description: 'Import freight allowance', quantity: '1', unit: 'shipment', sourceId: 'freight', conversion: '1', category: 'Freight' },
    { id: 'L07', description: 'Site commissioning', quantity: '8', unit: 'h', sourceId: null, conversion: '1', category: 'Commissioning', manual: { unitCost: '95', owner: 'Riley Chen', basis: 'SYN-MANUAL-01 · 8 h commissioning allowance', effective: '2026-09-01', review: 'Needs confirmation' } }
  ];
  const policy = { id: 'SYN-COST-01', currency: 'AUD', tax: 'Ex tax; no GST, duty or tax calculated', rounding: 'Round each extended line once to 2 decimals, half up; sum rounded cents', freight: 'One standalone freight line. Zero embedded freight. Import duty basis not supplied.' };
  function decimal(value, scale) {
    const str = String(value ?? '');
    if (!new RegExp(`^\\d{1,9}(?:\\.\\d{1,${scale}})?$`).test(str)) throw new Error('Use a non-negative decimal with supported precision.');
    const [whole, frac = ''] = str.split('.'); return BigInt(whole) * 10n ** BigInt(scale) + BigInt(frac.padEnd(scale, '0'));
  }
  function cents(amount) { return (BigInt(amount) < 0n ? '-' : '') + (BigInt(amount) < 0n ? -BigInt(amount) : BigInt(amount)).toString().padStart(3, '0').replace(/(..)$/, '.$1'); }
  function round(n, denominator) { return (n + denominator / 2n) / denominator; }
  function quantityInSource(line) { return decimal(line.quantity, 3) * decimal(line.conversion, 6); }
  function tierFor(line, basis) {
    const q = quantityInSource(line);
    return [...basis.tiers].sort((a, b) => Number(a.min) - Number(b.min)).filter(t => q >= decimal(t.min, 3) * 1000000n).at(-1) || null;
  }
  function cost(line, basis) {
    try {
      if (decimal(line.quantity, 3) <= 0n || decimal(line.conversion, 6) <= 0n) return { cents: null, reason: 'Quantity or conversion is not positive' };
      if (!basis) {
        if (!line.manual) return { cents: null, reason: 'Cost basis missing' };
        const amount = round(decimal(line.quantity, 3) * decimal(line.manual.unitCost, 4) * 100n, 10000000n);
        return { cents: amount.toString(), tier: null, unitPrice: line.manual.unitCost, fx: '1', basis: line.manual.basis };
      }
      if (basis.wholeUnits && quantityInSource(line) % 1000000000n !== 0n) return { cents: null, reason: 'Source requires complete supplier packs; resolve quantity explicitly' };
      const tier = tierFor(line, basis);
      if (!tier) return { cents: null, reason: 'Quantity below the supplier minimum' };
      if (!basis.fx || decimal(basis.fx, 6) <= 0n) return { cents: null, reason: 'AUD exchange-rate basis missing', tier: tier.min, unitPrice: tier.price, fx: basis.fx, basis: basis.document };
      const amount = round(quantityInSource(line) * decimal(tier.price, 4) * decimal(basis.fx, 6) * 100n, 10000000000000000000n);
      return { cents: amount.toString(), tier: tier.min, unitPrice: tier.price, fx: basis.fx, basis: basis.document };
    } catch { return { cents: null, reason: 'Invalid numeric source basis' }; }
  }
  function blockers(basis, line = null) {
    const list = [];
    if (!basis.available) list.push('Source extract unavailable');
    if (!basis.mapping) list.push('Product / company mapping unresolved');
    if (basis.effective > AS_OF) list.push('Source is not yet effective');
    if (basis.expires < AS_OF) list.push('Source has expired');
    if (!basis.fx || !basis.fxBasis || !basis.fxDate) list.push('Exchange-rate evidence missing');
    if (basis.status && basis.status !== 'Reviewed') list.push('Source revision has not been reviewed');
    if (line && (basis.currency !== line.source.currency || basis.unit !== line.source.unit || basis.product !== line.source.product || basis.company !== line.source.company)) list.push('Source identity or unit differs from the saved line');
    if (line && line.unit !== basis.unit && !line.conversionBasis) list.push('Unit conversion evidence missing');
    if (line && cost(line, basis).cents === null) list.push(cost(line, basis).reason);
    return [...new Set(list)];
  }
  const ESTIMATE = { id: 'SYN-EST-2407', revision: 3, customer: 'Fernhaven Demonstration Nursery', title: 'Growing-house screen and irrigation upgrade', status: 'Draft · incomplete cost basis', currency: 'AUD', scopeRevision: 'SYN-SCOPE-02', policy: clone(policy),
    lines: LINES.map(l => ({ ...clone(l), source: l.sourceId ? clone(SOURCES.find(s => s.id === l.sourceId)) : null })),
    issuedBasis: { id: 'SYN-QUO-2407', revision: 2, issued: '2026-08-12', sell: '14850.00', currency: 'AUD', note: 'Separate synthetic issued quotation. This module cannot alter or reissue it.' }
  };
  function initial() { return { schema: 1, version: 0, candidates: clone(CANDIDATES), successors: [], events: [] }; }
  function latest(state, sourceId) { return state.candidates.filter(c => c.sourceId === sourceId).sort((a, b) => b.revision - a.revision)[0] || null; }
  function total(lines) { let known = 0n; const unknown = []; lines.forEach(l => { const c = cost(l, l.source); if (c.cents === null) unknown.push(l.id); else known += BigInt(c.cents); }); return { cents: known.toString(), unknown, complete: unknown.length === 0 }; }
  function impact(state, ids) {
    const selected = [...new Set(ids)]; const details = ESTIMATE.lines.map(line => {
      const candidate = latest(state, line.sourceId); const before = cost(line, line.source);
      const issues = candidate ? blockers(candidate, line) : ['No proposed source revision'];
      const picked = selected.includes(line.id); const after = picked && candidate && !issues.length ? cost(line, candidate) : before;
      return { line: clone(line), candidate: clone(candidate), before, after, issues, selected: picked, delta: before.cents !== null && after.cents !== null ? (BigInt(after.cents) - BigInt(before.cents)).toString() : null };
    });
    const invalid = details.filter(d => d.selected && d.issues.length);
    const lines = details.map(d => ({ ...clone(d.line), source: d.selected && !d.issues.length ? clone(d.candidate) : clone(d.line.source) }));
    return { details, before: total(ESTIMATE.lines), after: total(lines), lines, invalid, selected, unknownIds: selected.filter(id => !ESTIMATE.lines.some(l => l.id === id)),
      fingerprint: JSON.stringify(details.filter(d => d.selected).map(d => [d.line.id, d.candidate])) };
  }
  function command(state, actor, expected, action, payload = {}, at = new Date().toISOString()) {
    if (state.version !== expected) throw new Error('Saved work changed. Reload the latest saved work before continuing.');
    if (!roles[actor]) throw new Error('Choose a supported preview role.');
    const next = clone(state); let result;
    if (action === 'propose' || action === 'edit') {
      if (actor !== 'steward') throw new Error('The Data steward prepares source revisions.');
      const base = SOURCES.find(s => s.id === payload.sourceId); if (!base) throw new Error('Choose a known supplier source.');
      const existing = latest(next, base.id);
      const editing = action === 'edit' ? next.candidates.find(c => c.id === payload.editId) : null;
      if (action === 'edit' && (!editing || editing.sourceId !== base.id || editing.status !== 'Draft' || editing.author !== actor)) throw new Error('Only an unsubmitted source draft can be edited by its author.');
      if (action === 'propose' && existing && ['Draft', 'In review'].includes(existing.status)) throw new Error('Finish or return the existing revision first.');
      if (!String(payload.reason || '').trim() || !String(payload.document || '').trim()) throw new Error('Source reference and change reason are required.');
      if (!validDate(payload.effective) || !validDate(payload.expires) || payload.effective > payload.expires) throw new Error('Provide an effective date on or before the expiry date.');
      if (decimal(payload.price, 4) <= 0n) throw new Error('Enter a positive unit cost.');
      if (decimal(payload.fx, 6) <= 0n || (base.currency === 'AUD' && payload.fx !== '1')) throw new Error('Enter a positive AUD rate; AUD sources use exactly 1.');
      if (!String(payload.fxBasis || '').trim()) throw new Error('Exchange-rate evidence is required.');
      const tiers = [{ min: '1', price: payload.price }];
      if (base.tiers.length > 1) { if (decimal(payload.tierPrice, 4) <= 0n) throw new Error('The quantity-break price is required.'); tiers.push({ min: base.tiers[1].min, price: payload.tierPrice }); }
      if (!/^\d{1,3}$/.test(payload.leadDays || '')) throw new Error('Enter lead time in whole days, including 0 if confirmed.');
      const rev = editing ? editing.revision : (existing?.revision || base.revision) + 1;
      result = { ...clone(base), id: `${base.id}-r${rev}`, sourceId: base.id, revision: rev, document: payload.document.trim(), reason: payload.reason.trim(), tiers, fx: payload.fx, fxBasis: payload.fxBasis.trim(), fxDate: AS_OF, effective: payload.effective, expires: payload.expires, leadDays: Number(payload.leadDays), author: actor, status: 'Draft', created: editing?.created || at, submitted: null, decisions: [] };
      if (editing) next.candidates[next.candidates.findIndex(c => c.id === editing.id)] = result; else next.candidates.push(result);
    } else if (action === 'submit' || action === 'decide') {
      result = next.candidates.find(c => c.id === payload.id); if (!result) throw new Error('This source revision is unavailable.');
      if (action === 'submit') {
        if (actor !== result.author || result.status !== 'Draft') throw new Error('Only the author can submit an exact draft revision.');
        if (!result.mapping || !result.available) throw new Error('Resolve the source availability and mapping before submission.');
        result.status = 'In review'; result.submitted = at;
      } else {
        if (actor !== 'reviewer' || actor === result.author || result.status !== 'In review') throw new Error('Independent source review is required for a submitted revision.');
        if (!['Reviewed', 'Returned', 'Rejected'].includes(payload.outcome) || !String(payload.reason || '').trim()) throw new Error('Select a decision and provide the review rationale.');
        const issues = blockers({ ...result, status: 'Reviewed' }); if (payload.outcome === 'Reviewed' && issues.length) throw new Error(`Cannot mark reviewed: ${issues.join('; ')}.`);
        result.status = payload.outcome; result.decisions.push({ actor, outcome: payload.outcome, reason: payload.reason.trim(), at });
      }
    } else if (action === 'successor') {
      if (actor !== 'estimator') throw new Error('Only the Estimator creates a draft estimate successor.');
      const preview = impact(next, payload.selected || []);
      if (!preview.selected.length || preview.invalid.length || preview.unknownIds.length) throw new Error('Select at least one eligible line; blocked or unknown lines cannot be refreshed.');
      if (preview.fingerprint !== payload.fingerprint) throw new Error('Source evidence changed since this preview. Reopen the impact comparison.');
      if (!String(payload.reason || '').trim() || payload.ack !== true) throw new Error('Record the change reason and acknowledge the incomplete draft basis.');
      if (next.successors.some(s => s.previewFingerprint === preview.fingerprint)) throw new Error('This exact refresh already has a saved successor. Open the saved revision.');
      result = { id: `SYN-EST-2407-D${4 + next.successors.length}`, revision: 4 + next.successors.length, predecessor: 'SYN-EST-2407/r3', created: at, actor, reason: payload.reason.trim(), status: 'Draft · needs cost review', selected: preview.selected, lines: preview.lines, total: preview.after, policy: clone(policy), previewFingerprint: preview.fingerprint, issuedQuotation: clone(ESTIMATE.issuedBasis), review: 'No inherited approval', unresolved: ['Humidity sensor FX basis is unknown.', 'Climate source expired; renewed quotation required.', 'Commissioning allowance needs confirmation.', 'Import duty and complete landed-cost policy remain unconfirmed.'] };
      next.successors.push(result);
    } else throw new Error('Unsupported action.');
    next.version++; next.events.push({ sequence: next.version, actor, action, record: result.id, at });
    return { state: next, result: clone(result) };
  }
  function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
  function validState(s) {
    if (!s || s.schema !== 1 || !Number.isSafeInteger(s.version) || s.version < 0 || !Array.isArray(s.candidates) || !Array.isArray(s.successors) || !Array.isArray(s.events)) return false;
    if (s.candidates.length > 300 || s.successors.length > 100 || s.events.length !== s.version) return false;
    const unique = a => new Set(a.map(x => x.id)).size === a.length;
    try {
      const allStrings = (v, fields) => fields.every(f => typeof v[f] === 'string' && v[f].length <= 5000);
      const validSource = c => {
        const base = SOURCES.find(b => b.id === c.sourceId);
        return base && allStrings(c,['id','name','supplier','unit','product','company','document','reason','currency','fxBasis','created','terms','tax']) && c.author === 'steward' && c.id === `${c.sourceId}-r${c.revision}` && Number.isInteger(c.revision) && c.revision > 3 && ['Draft','In review','Reviewed','Returned','Rejected'].includes(c.status) && c.currency === base.currency && c.unit === base.unit && c.company === base.company && c.product === base.product && typeof c.mapping === 'boolean' && typeof c.available === 'boolean' && validDate(c.effective) && validDate(c.expires) && c.effective <= c.expires && (c.fx === null || decimal(c.fx,6)>0n) && (c.fxDate === null || validDate(c.fxDate)) && (c.leadDays === null || Number.isInteger(c.leadDays) && c.leadDays >= 0 && c.leadDays <= 999) && Array.isArray(c.tiers) && c.tiers.length === base.tiers.length && c.tiers.every((t,i) => t.min === base.tiers[i].min && decimal(t.price,4)>0n) && Array.isArray(c.decisions) && c.decisions.every(d => d.actor === 'reviewer' && ['Reviewed','Returned','Rejected'].includes(d.outcome) && allStrings(d,['reason','at']));
      };
      if (!unique(s.candidates) || !unique(s.successors) || !s.candidates.every(validSource)) return false;
      if (!s.events.every((e,i) => e.sequence === i+1 && roles[e.actor] && ['propose','edit','submit','decide','successor'].includes(e.action) && allStrings(e,['record','at']))) return false;
      return s.successors.every(r => {
        if (!allStrings(r,['id','predecessor','created','reason','status','review','previewFingerprint']) || r.actor !== 'estimator' || !Array.isArray(r.lines) || r.lines.length !== ESTIMATE.lines.length || !Array.isArray(r.selected) || !Array.isArray(r.unresolved) || !r.unresolved.every(x=>typeof x==='string') || JSON.stringify(r.issuedQuotation)!==JSON.stringify(ESTIMATE.issuedBasis) || JSON.stringify(r.policy)!==JSON.stringify(policy)) return false;
        if (!r.lines.every((l,i) => {
          const base = ESTIMATE.lines[i];
          const stable = ['id','description','quantity','unit','sourceId','conversion','conversionBasis','category','manual'];
          if (!stable.every(k=>JSON.stringify(l[k])===JSON.stringify(base[k]))) return false;
          return JSON.stringify(l.source)===JSON.stringify(base.source) || l.source && validSource(l.source) && l.source.status === 'Reviewed' && l.source.sourceId === base.sourceId;
        })) return false;
        return JSON.stringify(total(r.lines)) === JSON.stringify(r.total);
      });
    } catch { return false; }
  }
  globalThis.PPOSupplierPricing = Object.freeze({ AS_OF, roles, SOURCES, ESTIMATE, policy, initial, latest, total, cost, blockers, impact, command, validState, decimal, cents, clone });
})();
