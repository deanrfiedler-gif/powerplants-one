/* ES-10 synthetic design model. No approved calculation or external adapter. */
(function (root) {
  'use strict';
  const TODAY = '2026-09-17';
  const KEY = 'ppo.es10.reference-calibration.r01';
  const actors = { estimator: 'Alex Morgan', reviewer: 'Sam Taylor', observer: 'Read-only observer' };
  const base = { family: 'Screen Systems', system: 'Retractable shade', driver: 'Installation labour', unit: 'h', currency: 'AUD', estimateClass: 'Defined scope', band: 'Routine installation', context: 'Clear-access greenhouse', quantityClass: 'Reviewed used hours', revision: 1, review: 'Reviewed', complete: true, expires: '2027-03-17', date: '2026-08-20', reviewer: 'Sam Taylor', source: 'Authored ES-10 fixture; no imported ES-09 review', cause: 'Access preparation and commissioning interfaces', lesson: 'Confirm access preparation and controls interface responsibilities before setting the labour allowance.' };
  function caseRow(id, customer, area, estimated, actual, extra = {}) {
    return { ...base, id, ref: `SYN-ES10-REF-${String(id).padStart(6, '0')}`, customer, title: `${customer} · shade installation`, site: `${customer} · Greenhouse 01`, area, estimated, actual, sourceRef: `SYN-PPO-RPT-${String(id).padStart(6, '0')}`, accepted: `Illustrative accepted basis ${id} / r02`, ...extra };
  }
  function seed() {
    return { schema: 1, version: 0, cases: [
      caseRow(1, 'Willowbank', 2000, 200, 240),
      caseRow(2, 'Fernhaven', 1600, 160, 184, { actual: 184, cause: 'Drive alignment and access preparation' }),
      caseRow(3, 'Riverbend', 2400, 240, 312, { cause: 'Controls handover and final limit adjustment' }),
      caseRow(4, 'Greenridge', 1200, 120, 132, { cause: 'Extra screen tension verification' }),
      caseRow(5, 'Wattle Creek', 1800, 180, 225, { cause: 'Access equipment setup and handover' }),
      caseRow(6, 'Northbank Nursery', 2432, 232, 291, { title: 'Northbank · ES-09 incoming evidence', site: 'Northbank · Glasshouse 02', review: 'Awaiting review', reviewer: 'Not yet reviewed', date: null, complete: false, source: 'ES-09 PR #220, source 19a029bb; ear-1 remains Draft / Partial', sourceRef: 'SYN-EAR-0001 · SCR-INST / o4', accepted: 'SYN-PPO-EST-000042 / accepted cost basis r04', cause: 'Attribution awaiting completed ES-09 review', lesson: 'Retain original issued, accepted and variation scope separately. This incoming record is not eligible for aggregation.' }),
      caseRow(7, 'Cedar Vale', 10000, 800, 1040, { band: 'Major bespoke', context: 'Occupied multi-zone greenhouse', lesson: 'Curated individual reference only; no pooled multiplier.' }),
      caseRow(8, 'Orchard Lane', 1500, 150, 180, { review: 'Superseded', expires: '2026-08-01', lesson: 'Earlier access assumption was superseded. Retain for history only.' }),
      caseRow(9, 'Coastal Propagation', 900, 90, 117, { system: 'Blackout', context: 'Propagation house', lesson: 'Blackout sealing and light-leak verification differ from retractable shade work.' })
    ], proposals: [], history: [] };
  }
  function comparable(c) {
    const reasons = [];
    if (c.review !== 'Reviewed') reasons.push(c.review);
    if (!c.complete) reasons.push('Source incomplete');
    if (c.expires < TODAY) reasons.push('Review expired');
    if (c.band !== base.band) reasons.push('Individual case only');
    if (c.system !== base.system || c.context !== base.context) reasons.push('Different system or growing context');
    if (c.unit !== base.unit || c.quantityClass !== base.quantityClass || c.currency !== base.currency || c.estimateClass !== base.estimateClass) reasons.push('Incompatible comparison basis');
    if (!Number.isFinite(c.estimated) || c.estimated <= 0 || !Number.isFinite(c.actual) || c.actual < 0) reasons.push('Quantity unavailable');
    return reasons;
  }
  function aggregate(state, selected) {
    const ids = [...new Set(selected)];
    const records = state.cases.filter(c => ids.includes(c.id));
    const eligible = records.filter(c => !comparable(c).length);
    const ratios = eligible.map(c => c.actual / c.estimated).sort((a,b) => a-b);
    const n = ratios.length;
    return { n, records, eligible, excluded: records.filter(c => comparable(c).length), mode: n < 3 ? 'Insufficient data' : n < 5 ? 'Indicative only' : 'Illustrative comparison', median: n < 3 ? null : (n % 2 ? ratios[(n-1)/2] : (ratios[n/2-1]+ratios[n/2])/2), low: n < 3 ? null : ratios[0], high: n < 3 ? null : ratios[n-1] };
  }
  function evidence(state, ids) {
    return [...new Set(ids)].sort((a,b)=>a-b).map(id=>state.cases.find(c=>c.id===id)).filter(Boolean).map(c=>({ id:c.id, ref:c.ref, revision:c.revision, estimated:c.estimated, actual:c.actual, review:c.review, complete:c.complete, sourceRef:c.sourceRef, expires:c.expires, system:c.system, context:c.context, unit:c.unit, quantityClass:c.quantityClass, currency:c.currency, estimateClass:c.estimateClass, band:c.band, driver:c.driver, family:c.family }));
  }
  function stale(state,p) { return JSON.stringify(p.evidence) !== JSON.stringify(evidence(state,p.caseIds)); }
  function requireRole(role, allowed) { if (!allowed.includes(role)) throw Error('This demonstration role cannot perform that action.'); }
  function validateDraft(state, data) {
    if (!data.title?.trim() || !data.reason?.trim() || !data.scope?.trim() || !data.limit?.trim()) throw Error('Add a title, evidence rationale, applicable scope and limitations.');
    if ([data.title,data.reason,data.scope,data.limit].some(s=>s.length>2000)) throw Error('Keep each field within 2,000 characters.');
    if (!['Labour allowance','Scope checklist','Formula validation request'].includes(data.kind)) throw Error('Choose a supported proposal type.');
    if (!data.caseIds?.length || data.caseIds.some(id=>!state.cases.some(c=>c.id===id))) throw Error('Choose at least one known reference case.');
    if (data.caseIds.some(id=>comparable(state.cases.find(c=>c.id===id)).length)) throw Error('Remove ineligible cases before preparing a proposal.');
    if (data.kind==='Labour allowance' && aggregate(state,data.caseIds).n<3) throw Error('At least three eligible cases are required for this illustrative labour proposal.');
    if (data.kind==='Labour allowance' && (!Number.isFinite(data.factor) || data.factor<0.1 || data.factor>5)) throw Error('Enter an illustrative factor from 0.10 to 5.00. This is a preview limit, not an approved range.');
  }
  function command(state, role, action, data = {}, expected = state.version) {
    if (expected !== state.version) throw Error('This copy has changed. Reload saved work before continuing.');
    const s = structuredClone(state); const actor=actors[role]; const at=new Date().toISOString();
    let p = s.proposals.find(x=>x.id===data.id);
    if(action==='create') {
      requireRole(role,['estimator']); validateDraft(s,data);
      const id=`SYN-ES10-CAL-${String(s.proposals.length+1).padStart(6,'0')}`;
      p={...data,id,revision:1,state:'Draft',author:actor,created:at,caseIds:[...new Set(data.caseIds)],evidence:evidence(s,data.caseIds),decisions:[],supersedes:null};
      s.proposals.push(p);
    } else if(action==='edit') {
      requireRole(role,['estimator']); if(!p || p.author!==actor || p.state!=='Draft') throw Error('Only the author can edit a draft.');
      validateDraft(s,data); if(stale(s,p)) throw Error('Evidence changed. Prepare a successor before editing.');
      for(const key of ['title','kind','scope','reason','limit','factor']) p[key]=data[key];
    } else if(action==='submit') {
      requireRole(role,['estimator']); if(!p || p.author!==actor || p.state!=='Draft') throw Error('Only the author can submit an editable draft.');
      validateDraft(s,p); if(stale(s,p)) throw Error('Evidence changed. Create a successor with current evidence.');
      p.state='In review'; p.submitted=at;
    } else if(action==='review') {
      requireRole(role,['reviewer']); if(!p || p.state!=='In review') throw Error('Select a submitted proposal.');
      if(p.author===actor) throw Error('An independent reviewer is required.');
      if(stale(s,p)) throw Error('Evidence changed. Return for revision before reviewing.');
      if(!data.note?.trim() || data.note.length>2000) throw Error('Record the review rationale.');
      if(!['Reviewed proposal','Returned','Rejected'].includes(data.outcome)) throw Error('Choose a valid review outcome.');
      p.state=data.outcome; p.decisions.push({actor,at,outcome:data.outcome,note:data.note.trim()});
    } else if(action==='returnStale') {
      requireRole(role,['reviewer']); if(!p || p.state!=='In review' || !stale(s,p)) throw Error('Select an in-review proposal with changed evidence.');
      p.state='Returned';p.decisions.push({actor,at,outcome:'Returned',note:'Source evidence changed; prepare a successor with a fresh basis.'});
    } else if(action==='successor') {
      requireRole(role,['estimator']); if(!p || !['Draft','Returned','Reviewed proposal','Rejected'].includes(p.state)) throw Error('Finish or return the current review first.');
      const prior=p; const id=`SYN-ES10-CAL-${String(s.proposals.length+1).padStart(6,'0')}`;
      p={...structuredClone(prior),id,revision:prior.revision+1,state:'Draft',author:actor,created:at,submitted:null,decisions:[],supersedes:prior.id,evidence:evidence(s,prior.caseIds)};s.proposals.push(p);
    } else if(action==='sourceChange') {
      requireRole(role,['reviewer']); const c=s.cases.find(x=>x.id===1); c.revision++;c.actual+=10;
    } else throw Error('Unknown action.');
    s.version++;s.history.push({at,actor,action,ref:p?.id||s.cases[0].ref,version:s.version});return s;
  }
  function validState(s) {
    return !!s && s.schema===1 && Number.isInteger(s.version) && s.version>=0 && Array.isArray(s.cases) && s.cases.length===9 && s.cases.every(c=>Number.isInteger(c.id)&&typeof c.customer==='string'&&Number.isInteger(c.revision)&&typeof c.expires==='string') && Array.isArray(s.proposals) && s.proposals.every(p=>typeof p.id==='string'&&Array.isArray(p.caseIds)&&Array.isArray(p.evidence)&&Array.isArray(p.decisions)&&['Draft','In review','Reviewed proposal','Returned','Rejected'].includes(p.state)) && Array.isArray(s.history);
  }
  const api = { TODAY, KEY, actors, seed, comparable, aggregate, evidence, stale, command, validState };
  if(typeof module !== 'undefined') module.exports=api; else root.PPOReferenceCalibration=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
