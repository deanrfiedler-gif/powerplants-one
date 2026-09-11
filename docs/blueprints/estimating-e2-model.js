/* Standalone synthetic design model. No runtime imports, persistence or authority. */
globalThis.E2Model = Object.freeze({
  route(input) {
    const allowed = {
      engineering_required: ['Yes', 'No', 'Unknown'],
      project_management_required: ['Yes', 'No', 'Unknown'],
      scope_settled: ['Yes', 'No', 'Unknown'],
      enquiry_kind: ['DefinedSupply', 'ServiceRepair', 'Unknown'],
      supply_defined: ['Yes', 'No', 'Unknown'],
      prepayment_required: ['Yes', 'No', 'Unknown'],
    };
    const out = (rule, route, category = null, question = null) => ({ rule, route, category, question });
    if (!input || typeof input !== 'object' || Array.isArray(input)) return out('Invalid', 'Invalid');
    if (Object.keys(input).some(k => !allowed[k])) return out('Invalid', 'Invalid');
    for (const [key, values] of Object.entries(allowed)) {
      if (input[key] !== undefined && !values.includes(input[key])) return out('Invalid', 'Invalid', null, key);
    }
    const v = key => input[key] ?? 'Unknown';
    const stop = (r, q) => out(r, 'NeedsClarification', null, q);
    if (v('engineering_required') === 'Yes') return out('R01', 'Full', 'Project');
    if (v('engineering_required') === 'Unknown') return stop('R02', 'engineering_required');
    if (v('project_management_required') === 'Yes') return out('R03', 'Full', 'Project');
    if (v('project_management_required') === 'Unknown') return stop('R04', 'project_management_required');
    if (v('scope_settled') === 'No') return out('R05', 'Full', 'Project');
    if (v('scope_settled') === 'Unknown') return stop('R06', 'scope_settled');
    if (v('enquiry_kind') === 'Unknown') return stop('R07', 'enquiry_kind');
    if (v('enquiry_kind') === 'DefinedSupply') {
      if (v('supply_defined') === 'Yes') return out('R08', 'Express', 'SalesOrderCandidate');
      if (v('supply_defined') === 'No') return out('R09', 'Full', 'Project');
      return stop('R10', 'supply_defined');
    }
    if (v('prepayment_required') === 'Yes') return out('R11', 'Express', 'SalesOrderCandidate');
    if (v('prepayment_required') === 'No') return out('R12', 'Express', 'ServiceOrderCandidate');
    return stop('R13', 'prepayment_required');
  },
});
