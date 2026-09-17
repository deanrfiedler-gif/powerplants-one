/* ES-04 standalone synthetic review model. No server, ERP or quotation command. */
(function (root) {
  'use strict';
  const TODAY = '2026-09-17';
  const ROLES = { reviewer: 'Alex Morgan', estimator: 'Riley Chen', approver: 'Casey Taylor', observer: 'Jordan Lee' };
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = message => { throw new Error(message); };
  const text = (value, label) => typeof value === 'string' && value.trim().length >= 3 && value.length <= 1200 ? value.trim() : fail(`${label} must contain 3–1,200 characters.`);
  function scaled(value, places = 2) {
    if (typeof value !== 'string' || !new RegExp(`^\\d{1,9}(?:\\.\\d{1,${places}})?$`).test(value)) fail(`Enter a non-negative number with up to ${places} decimal places.`);
    const [a, b = ''] = value.split('.');
    return BigInt(a) * 10n ** BigInt(places) + BigInt(b.padEnd(places, '0'));
  }
  const round = (n, d) => n < 0n ? -round(-n, d) : (n + d / 2n) / d;
  const fixed = n => `${n < 0n ? '-' : ''}${(n < 0n ? -n : n) / 100n}.${String((n < 0n ? -n : n) % 100n).padStart(2, '0')}`;
  function lineAmounts(line) {
    const q = line.quantity === null ? null : scaled(line.quantity, 3);
    const cost = q === null || line.cost === null ? null : round(q * scaled(line.cost), 1000n);
    const gross = q === null || line.sell === null ? null : round(q * scaled(line.sell), 1000n);
    const net = q === null || line.sell === null ? null : round(q * scaled(line.sell) * (10000n - scaled(line.discount)), 10000000n);
    return { cost, gross, net };
  }
  function totals(version) {
    let cost = 0n, gross = 0n, net = 0n, costComplete = true, sellComplete = true;
    for (const line of version.lines.filter(l => l.included)) {
      const x = lineAmounts(line);
      if (x.cost === null) costComplete = false; else cost += x.cost;
      if (x.net === null) sellComplete = false; else { net += x.net; gross += x.gross; }
    }
    const complete = costComplete && sellComplete;
    return { cost: fixed(cost), gross: fixed(gross), net: fixed(net), discount: sellComplete ? fixed(gross - net) : null,
      costComplete, sellComplete, profit: complete ? fixed(net - cost) : null,
      margin: complete && net !== 0n ? fixed(round((net - cost) * 10000n, net)) : null,
      markup: complete && cost !== 0n ? fixed(round((net - cost) * 10000n, cost)) : null };
  }
  const line = (id, category, description, quantity, unit, cost, sell, source, extra = {}) => ({ id, category, description, quantity, unit, cost, sell, discount: '0', source, sourceRevision: 'r01', sourceDate: '2026-09-12', validUntil: '2026-10-12', quantityBasis: 'Reviewed synthetic schedule r02', included: true, reviewed: false, ...extra });
  const policy = () => ({ id: 'SYN-PPO-POL-ES04-DEMO', revision: 'r01', label: 'Demonstration policy only', floor: '25.00', target: '30.00', discountLimit: '10.00', authority: 'Casey Taylor', expires: '2026-12-31', source: 'Authored scenario; no Powerplants commercial policy supplied' });
  const event = (action, actor = 'Synthetic source', detail = 'Fixture submitted for review.') => ({ at: '2026-09-16T04:15:00.000Z', action, actor, detail });
  function version(revision, lines, extras = {}) {
    return { revision, state: 'Submitted', submitted: '2026-09-16', scopeRevision: 'r02', sourceCurrent: 'r02', lines,
      scope: 'Supply, install and commission the selected system in the named growing area.', exclusions: 'Structural strengthening, mains electrical supply and crop relocation.', assumptions: 'Customer confirms an agreed access window before delivery planning.',
      documents: [{ name: 'Synthetic scope brief', revision: 'r02', status: 'Current' }, { name: 'Installation allowance worksheet', revision: 'r01', status: 'Current' }],
      findings: [], scopeChecked: false, review: null, approval: null, handover: null, exceptions: {}, policy: policy(), events: [event('Submitted')], ...extras };
  }
  function initial() {
    const records = [
      { id: 'northbank', ref: 'SYN-PPO-EST-000241', title: 'Greenhouse screen retrofit', customer: 'Northbank Nursery', site: 'Bundaberg site', areas: ['Greenhouse 2', 'Compartment A'], option: 'Option A · single screen', due: '2026-09-18', reviewer: ROLES.reviewer, owner: ROLES.estimator,
        versions: [version('r03', [
          line('screen', 'Parts', 'Screen fabric, drive and suspension assembly', '1', 'set', '46200', '66000', 'Supplier screen offer', { quantityBasis: 'ES-08 synthetic run r02 · 1,440 m²' }),
          line('labour', 'Installation', 'Installation labour', '120', 'h', '68', '110', 'Labour planning rate'),
          line('freight', 'Freight', 'Dedicated regional delivery', '1', 'shipment', '1250', '1750', 'Carrier estimate'),
          line('commission', 'Commissioning', 'Drive setup and commissioning', '16', 'h', null, '135', 'Source not supplied', { validUntil: null }),
          line('travel', 'Allowance', 'Travel and accommodation allowance', '1', 'allowance', '1400', '1900', 'Travel allowance worksheet'),
          line('structural', 'Exclusion', 'Structural assessment by others', '1', 'item', null, null, 'Scope exclusion', { included: false })
        ], { findings: [{ id: 'F-01', lineId: 'commission', severity: 'Blocking', title: 'Confirm commissioning cost and source', owner: ROLES.estimator, due: '2026-09-18', state: 'Open', response: null, resolution: null, createdBy: ROLES.reviewer, createdRevision: 'r03' }] })] },
      { id: 'valley', ref: 'SYN-PPO-EST-000242', title: 'Irrigation pump replacement', customer: 'Valley Glasshouses', site: 'Maryborough site', areas: ['Irrigation shed'], option: 'Option A · supply and fit', due: '2026-09-17', reviewer: ROLES.reviewer, owner: ROLES.estimator,
        versions: [version('r02', [line('pump','Parts','Replacement pump and fittings','1','set','8200','12200','Supplier pump offer'),line('fit','Labour','Remove, install and test','12','h','68','115','Labour planning rate'),line('delivery','Freight','Delivery to site','1','shipment','280','420','Carrier estimate')])] },
      { id: 'coastal', ref: 'SYN-PPO-EST-000243', title: 'Blueberry block control upgrade', customer: 'Coastal Berry Growers', site: 'Gin Gin site', areas: ['Irrigation Block 4', 'Irrigation shed'], option: 'Option B · staged controls', due: null, reviewer: ROLES.reviewer, owner: ROLES.estimator,
        versions: [version('r01',[line('controls','Parts','Control and sensor package','1','set','14800','19500','Synthetic control offer'),line('config','Commissioning','Configuration and proving','20','h','85','145','Commissioning estimate')],{policy:null})] },
      { id: 'riverbend', ref: 'SYN-PPO-EST-000244', title: 'Propagation lighting upgrade', customer: 'Riverbend Propagation', site: 'Childers site', areas: ['Propagation house 1'], option: 'Option A · lighting only', due: '2026-09-16', reviewer: ROLES.reviewer, owner: ROLES.estimator,
        versions: [version('r02',[line('lights','Parts','Propagation luminaires','24','ea','410','650','Supplier lighting offer',{discount:'15'}),line('install','Installation','Lighting installation','30','h','68','105','Installation plan')],{state:'Returned',returnReason:'Confirm the installation quantity and explain the proposed 15% discount.',findings:[{id:'F-01',lineId:'install',severity:'Blocking',title:'Reconcile installation hours to access plan',owner:ROLES.estimator,due:'2026-09-18',state:'Open',response:null,resolution:null,createdBy:ROLES.reviewer,createdRevision:'r02'}],events:[event('Submitted'),event('Returned',ROLES.reviewer,'Installation quantity needs evidence.')]})] },
      { id: 'orchard', ref: 'SYN-PPO-EST-000245', title: 'Weather station extension', customer: 'Orchard Lane Growers', site: 'Hervey Bay site', areas: ['Open field 2'], option: 'Option A · station and mast', due: '2026-09-19', reviewer: ROLES.reviewer, owner: ROLES.estimator,
        versions: [version('r01',[line('station','Parts','Weather station and mast','1','set','2700','4200','Supplier weather offer',{validUntil:'2026-09-10'})],{sourceCurrent:'r03',scope:'Install one station at the agreed mast location.',currentScope:'Install one station with a revised mast location and cable run.'})] }
    ];
    return { schema: 'ppo-es04-review/v1', version: 1, records };
  }
  const current = record => record.versions.at(-1);
  function basis(version) { return JSON.stringify({ revision: version.revision, scopeRevision: version.scopeRevision, scope: version.scope, exclusions: version.exclusions, assumptions: version.assumptions, lines: version.lines.map(l => { const value=clone(l); delete value.reviewed; return value; }), documents: version.documents, policy: version.policy }); }
  function issues(version) {
    const result = [];
    if (version.scopeRevision !== version.sourceCurrent) result.push('The source scope has changed; create and review a successor.');
    for (const l of version.lines.filter(x => x.included)) {
      if (l.quantity === null || l.cost === null || l.sell === null) result.push(`${l.description}: quantity, cost or sell price is unknown.`);
      if (!l.source || l.source === 'Source not supplied' || !l.validUntil || l.validUntil < TODAY) result.push(`${l.description}: cost-source evidence is missing or expired.`);
      if (l.quantity !== null && scaled(l.quantity,3) === 0n) result.push(`${l.description}: quantity must be greater than zero.`);
    }
    if (version.documents.some(d => d.status !== 'Current')) result.push('Supporting document evidence is incomplete.');
    for (const f of version.findings.filter(f => f.state !== 'Accepted')) result.push(`${f.id}: ${f.state === 'Responded' ? 'response awaits independent review' : f.title}.`);
    return result;
  }
  function exceptions(version) {
    if (!version.policy) return [];
    const t = totals(version), result = [];
    if (t.margin !== null && Number(t.margin) < Number(version.policy.floor)) result.push({ id:'margin', title:'Margin below demonstration minimum', detail:`${t.margin}% margin · ${version.policy.floor}% demonstration minimum` });
    for (const l of version.lines.filter(x => x.included)) if (scaled(l.discount) > scaled(version.policy.discountLimit)) result.push({id:`discount-${l.id}`, title:`Discount exception · ${l.description}`,detail:`${l.discount}% proposed · ${version.policy.discountLimit}% demonstration limit`});
    return result;
  }
  function approvalBlocks(version) {
    const result = issues(version);
    if (!version.review || version.review.basis !== basis(version)) result.push('An independent review of this exact revision is required.');
    if (!version.policy) result.push('Pricing thresholds and approval authority: Not configured.');
    else {
      if (version.policy.expires < TODAY) result.push('The demonstration policy has expired.');
      if (!version.policy.authority) result.push('Approval authority: Not configured.');
      for(const e of exceptions(version)) if (!version.exceptions[e.id] || version.exceptions[e.id].basis !== basis(version)) result.push(`${e.title}: authorised disposition required.`);
      const t = totals(version); if(t.profit !== null && Number(t.profit) < 0) result.push('Below-cost approval is blocked in this demonstration.');
    }
    return result;
  }
  function validateState(state) {
    if (!state || state.schema !== 'ppo-es04-review/v1' || !Number.isInteger(state.version) || !Array.isArray(state.records) || state.records.length !== 5) return false;
    try {
      const seed = initial();
      for (const r of state.records) {
        if (!seed.records.some(s=>s.id===r.id && s.ref===r.ref) || !Array.isArray(r.versions) || !r.versions.length) return false;
        for(const v of r.versions) {
          if (!['Draft','Submitted','Returned','Approved','Superseded'].includes(v.state) || !Array.isArray(v.lines) || !Array.isArray(v.findings) || !Array.isArray(v.events) || !Array.isArray(v.documents)) return false;
          for (const l of v.lines) { if (scaled(l.discount)>10000n) return false; lineAmounts(l); }
          basis(v); issues(v);
        }
      }
      return new Set(state.records.map(r=>r.id)).size === 5;
    } catch { return false; }
  }
  function apply(state, command, context) {
    if (!validateState(state)) fail('Saved data is not recognised. Preserve the original before resetting.');
    if (context.readState !== 'current') fail('Reload complete, current source information before making a change.');
    if (!ROLES[context.role] || context.role === 'observer') fail('This preview identity has read-only access.');
    if (command.expectedVersion !== state.version) fail('This workspace has changed. Reload the saved version before retrying.');
    const next = clone(state), r = next.records.find(x => x.id === command.recordId);
    if (!r) fail('The requested estimate is unavailable.');
    let v = current(r); const actor = ROLES[context.role];
    if (command.revision !== v.revision) fail('The selected revision is no longer current.');
    const requireRole = role => { if (context.role !== role) fail(`This action requires the ${role} preview identity.`); };
    const log = (action, detail) => v.events.push({ action, detail, actor, at: context.now || new Date().toISOString() });
    if (command.type === 'successor') {
      requireRole('estimator');
      if (!['Returned','Approved'].includes(v.state) && v.scopeRevision === v.sourceCurrent) fail('Return the submitted estimate before changing its commercial content.');
      const reason = text(command.reason,'Change reason'), previous = v;
      v = clone(previous); v.revision = `r${String(Number(previous.revision.slice(1))+1).padStart(2,'0')}`; v.state='Draft'; v.predecessor=previous.revision;
      v.scopeRevision = previous.sourceCurrent; v.scope=previous.currentScope || previous.scope; delete v.currentScope;
      v.scopeChecked=false;v.review=null;v.approval=null;v.handover=null;v.exceptions={};v.changeReason=reason;
      v.lines.forEach(l=>{l.reviewed=false;});v.findings=v.findings.filter(f=>f.state!=='Accepted').map(f=>({...f,state:'Open',response:null,resolution:null}));
      v.events=[]; r.versions.push(v);log('Draft successor created',`${previous.revision} → ${v.revision}. ${reason}`);
    } else if(command.type === 'editLine') {
      requireRole('estimator'); if(v.state!=='Draft') fail('Only a draft successor can be edited.');
      const l=v.lines.find(l=>l.id===command.lineId); if(!l || !l.included) fail('Select an included cost line.');
      const p=command.values;
      if(scaled(p.quantity,3)===0n) fail('Quantity must be greater than zero.');
      scaled(p.cost);scaled(p.sell);if(scaled(p.discount)>10000n) fail('Discount cannot exceed 100%.');
      if(!validDate(p.validUntil)) fail('Enter a source expiry date.');
      const sourceDate=p.sourceDate||l.sourceDate;
      if(!validDate(sourceDate)||sourceDate>TODAY||p.validUntil<sourceDate) fail('Source dates must be valid, already effective and in order.');
      Object.assign(l,{quantity:p.quantity,cost:p.cost,sell:p.sell,discount:p.discount,source:text(p.source,'Source'),sourceRevision:text(p.sourceRevision,'Source revision'),sourceDate,validUntil:p.validUntil,quantityBasis:text(p.quantityBasis,'Quantity basis'),reviewed:false});
      log('Draft line updated',`${l.description}. ${text(command.reason,'Change reason')}`);
    } else if(command.type === 'submit') {
      requireRole('estimator');if(v.state!=='Draft') fail('Only a draft can be submitted.');
      if(v.findings.some(f=>f.state==='Open')) fail('Respond to every carried finding before resubmission.');
      if(v.lines.some(l=>l.included&&(l.cost===null||l.quantity===null||l.sell===null||!l.validUntil||l.validUntil<TODAY))) fail('Complete the quantity, price and current source evidence before resubmission.');
      v.state='Submitted';v.submitted=TODAY;log('Submitted',text(command.reason,'Submission note'));
    } else if(command.type === 'respond') {
      requireRole('estimator');if(!['Draft','Returned'].includes(v.state)) fail('Respond within the returned estimate or its draft successor.');
      const f=v.findings.find(f=>f.id===command.findingId);if(!f || f.state!=='Open') fail('This finding is not awaiting a response.');
      f.response={text:text(command.reason,'Response and evidence'),actor,at:context.now||new Date().toISOString(),revision:v.revision};f.state='Responded';log('Finding response',`${f.id}: ${f.response.text}`);
    } else {
      if(v.state!=='Submitted' && command.type!=='prepare') fail('This action requires the current submitted revision.');
      if(v.scopeRevision!==v.sourceCurrent) fail('The source scope changed. Create a successor before continuing review.');
      if(command.type==='checkLine') {
        requireRole('reviewer');const l=v.lines.find(l=>l.id===command.lineId);if(!l || !l.included) fail('Select an included line.');
        if(l.cost===null||l.quantity===null||l.sell===null||!l.validUntil||l.validUntil<TODAY) fail('Resolve missing or expired source evidence before checking this line.');
        l.reviewed=!l.reviewed;v.review=null;log(l.reviewed?'Line checked':'Line check reopened',l.description);
      } else if(command.type==='checkScope') {
        requireRole('reviewer');v.scopeChecked=!v.scopeChecked;v.review=null;log('Scope check',v.scopeChecked?'Exact inclusions, exclusions and location reviewed.':'Scope check reopened.');
      } else if(command.type==='addFinding') {
        requireRole('reviewer');const title=text(command.title,'Finding'), owner=text(command.owner,'Owner');
        if(!validDate(command.due)) fail('A follow-up due date is required.');
        if(command.lineId && !v.lines.some(l=>l.id===command.lineId)) fail('The selected cost line is unavailable.');
        if(!['Blocking','Advisory'].includes(command.severity)) fail('Choose the finding classification.');
        const id=`F-${String(Math.max(0,...r.versions.flatMap(x=>x.findings.map(f=>Number(f.id.slice(2)))))+1).padStart(2,'0')}`;
        v.findings.push({id,title,owner,due:command.due,lineId:command.lineId||null,severity:command.severity,state:'Open',response:null,resolution:null,createdBy:actor,createdRevision:v.revision});v.review=null;log('Finding raised',`${id}: ${title}`);
      } else if(command.type==='acceptFinding') {
        requireRole('reviewer');const f=v.findings.find(f=>f.id===command.findingId);if(!f||f.state!=='Responded'||f.response.actor===actor) fail('An independent reviewer must inspect the response.');
        if(f.response.revision!==v.revision) fail('Request a response against this exact successor revision.');
        f.resolution={actor,text:text(command.reason,'Review evidence'),revision:v.revision};f.state='Accepted';v.review=null;log('Finding response accepted',`${f.id}: ${f.resolution.text}`);
      } else if(command.type==='return') {
        requireRole('reviewer');v.returnReason=text(command.reason,'Return reason');v.state='Returned';v.review=null;log('Returned',v.returnReason);
      } else if(command.type==='review') {
        requireRole('reviewer');if(actor===r.owner) fail('The preparer cannot independently review this example.');
        const blockers=issues(v);if(blockers.length) fail(blockers[0]);
        if(!v.scopeChecked||v.lines.some(l=>l.included&&!l.reviewed)) fail('Check the scope and every included cost line first.');
        if(v.review) fail('This revision already has a completed review.');
        v.review={actor,reason:text(command.reason,'Review conclusion'),basis:basis(v),revision:v.revision};log('Review completed',v.review.reason);
      } else if(command.type==='exception') {
        requireRole('approver');if(!v.policy||v.policy.authority!==actor||v.policy.expires<TODAY) fail('Current approval authority is not configured for this identity.');
        if(!v.review||v.review.basis!==basis(v)) fail('Complete the independent review first.');
        const e=exceptions(v).find(x=>x.id===command.exceptionId);if(!e) fail('The exception is not applicable to this revision.');
        if(v.exceptions[e.id]) fail('This exception already has a recorded disposition.');
        v.exceptions[e.id]={actor,reason:text(command.reason,'Exception rationale'),basis:basis(v),revision:v.revision};log('Pricing exception accepted',`${e.title}. ${v.exceptions[e.id].reason}`);
      } else if(command.type==='approve') {
        requireRole('approver');const b=approvalBlocks(v);if(b.length) fail(b[0]);if(v.policy.authority!==actor) fail('This identity is not the supplied approving authority.');
        v.approval={actor,reason:text(command.reason,'Approval rationale'),basis:basis(v),revision:v.revision,policy:clone(v.policy),at:context.now||new Date().toISOString()};v.state='Approved';log('Estimate approved — synthetic',v.approval.reason);
      } else if(command.type==='prepare') {
        requireRole('approver');if(v.state!=='Approved'||!v.approval||v.approval.basis!==basis(v)) fail('An exact current estimate approval is required.');
        if(v.handover) fail('The original handover is already prepared; inspect it instead.');
        const preparationReason=text(command.reason,'Preparation reason');
        v.handover={reason:preparationReason,id:`${r.ref}-${v.revision}-ES05`,state:'Prepared',revision:v.revision,basis:basis(v),receiver:'Quotation author · Morgan Ellis',preparedBy:actor,preparedAt:context.now||new Date().toISOString()};log('ES-05 handover prepared',preparationReason+' Prepared only. No transmission, quotation approval or issue.');
      } else fail('The requested action is not supported.');
    }
    next.version++;return next;
  }
  root.EstimateReview = { TODAY, ROLES, initial, clone, current, totals, lineAmounts, fixed, scaled, basis, issues, exceptions, approvalBlocks, validateState, apply };
})(globalThis);
