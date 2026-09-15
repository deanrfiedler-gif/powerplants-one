/* Standalone design model. No application API or persisted business effects. */
(function (global) {
  'use strict';
  const categories=['Product','Labour','Freight','Engineering','Subcontract'];
  const headers=['line_ref','section_ref','description','category','quantity','unit','unit_cost','unit_sell','allowance','source_ref','source_date','include','print','source_sheet','source_row','workbook_cost','workbook_sell'];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function scaled(v,p) {
    if(v===null||v===undefined||v==='')throw Error('Missing amount');
    const s=String(v);if(s.length>20||!new RegExp(`^(0|[1-9][0-9]*)(\\.[0-9]{1,${p}})?$`).test(s))throw Error('Unsupported decimal');
    const [a,b='']=s.split('.');return BigInt(a)*10n**BigInt(p)+BigInt(b.padEnd(p,'0'));
  }
  const extend=(q,p)=>(scaled(q,3)*scaled(p,2)+500n)/1000n;
  const amount=c=>`${c/100n}.${(c%100n).toString().padStart(2,'0')}`;
  const yes=v=>v===true||v==='Yes';
  const flag=v=>v===true||v===false||v==='Yes'||v==='No';
  const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  function fromFixture(f) {
    return {metadata:clone(f.metadata),sections:f.sections.map(r=>({section_ref:r[0],label:r[1],facility_ref:r[2],growing_area_ref:r[3],system:r[4],phase:r[5]})),scope:f.scope.map(r=>({scope_ref:r[0],kind:r[1],text:r[2]})),sources:f.sources.map(r=>({source_ref:r[0],source_kind:r[1],supplier_label:r[2],document_ref:r[3],source_date:r[4],valid_until:r[5],internal_notes:r[6]})),lines:f.lines.map((r,i)=>Object.fromEntries(headers.map((h,j)=>[h,j<13?r[j]:j===13?'Estimate lines':j===14?i+6:j===15?amount(extend(r[4],r[6])):amount(extend(r[4],r[7]))]))),control:{}};
  }
  function totals(lines) {
    let cost=0n,sell=0n,included=0n,unknown=0;
    let missingCost=false,missingSell=false,missingIncluded=false;
    for(const l of lines) {
      let incomplete=false,extension=null;
      try { cost+=extend(l.quantity,l.unit_cost); } catch { missingCost=true;incomplete=true; }
      try { extension=extend(l.quantity,l.unit_sell);sell+=extension; } catch { missingSell=true;incomplete=true; }
      if(!flag(l.include)){missingIncluded=true;incomplete=true;}
      else if(yes(l.include)){if(extension===null)missingIncluded=true;else included+=extension;}
      if(incomplete)unknown++;
    }
    return {cost:missingCost?null:amount(cost),sell:missingSell?null:amount(sell),included:missingIncluded?null:amount(included),unknown};
  }
  const keyed=(rows,key)=>JSON.stringify(rows.map(r=>Object.fromEntries(Object.keys(r).sort().map(k=>[k,r[k]]))).sort((a,b)=>String(a[key]).localeCompare(String(b[key]))));
  function controls(d){const t=totals(d.lines);d.control={line_count:d.lines.length,workbook_cost:t.cost,workbook_sell:t.sell,included_sell:t.included};return d;}
  function validate(d,target) {
    const issues=[];let rowIndex=null;
    const add=(code,message,line=null,field=null)=>issues.push({code,message,line,field,rowIndex:line===null?null:rowIndex,locator:line===null?null:d.lines[rowIndex]?.import_locator??null});
    const m=d.metadata||{};
    const required=['schema_version','template_ref','template_revision','workbook_ref','workbook_revision','opportunity_ref','option_ref','organisation_ref','site_ref','title','estimator','currency','tax_basis','calculation_policy','data_mode','formula_reviewed_by','formula_reviewed_at'];
    required.forEach(k=>{if(m[k]===undefined||m[k]===null||m[k]==='')add('Metadata',`Project: ${k} is required.`);});
    Object.keys(m).forEach(k=>{if(!required.includes(k))add('Metadata',`Project: unsupported field ${k}.`);});
    if(!validDate(m.formula_reviewed_at))add('Date','Project: enter a valid calculation-review date.');
    if(String(m.schema_version)!=='1'||m.template_ref!=='PPO-EST-WORKBOOK'||m.template_revision!=='r01')add('Template','Use the r01 PPO workbook structure.');
    if(m.data_mode!=='Synthetic')add('Data mode','This preview accepts synthetic examples only.');
    if(m.currency!=='AUD'||m.tax_basis!=='ExcludingTax'||m.calculation_policy!=='SYN-EST-ARITHMETIC-01')add('Policy','The pilot supports AUD excluding tax under the existing synthetic arithmetic policy.');
    ['opportunity_ref','option_ref','organisation_ref','site_ref'].forEach(k=>{if(target&&m[k]!==target[k])add('Context',`${k} does not match the selected estimating context.`);});
    if(target?.scope&&keyed(d.scope,'scope_ref')!==keyed(target.scope,'scope_ref'))add('Scope','Workbook scope differs from the selected demo basis. Review the scope revision before importing.');
    if(target?.sections&&keyed(d.sections,'section_ref')!==keyed(target.sections,'section_ref'))add('Scope','Workbook sections or facility context differ from the selected demo basis.');
    if(!d.lines.length)add('Empty','Add at least one complete estimate line.');
    if(d.lines.length>100)add('Capacity',`${d.lines.length} lines exceed the first pilot limit of 100. No lines will be dropped.`);
    const sections=new Set(),sources=new Set();
    const referenceCounts=new Map();
    for(const l of d.lines)referenceCounts.set(l.line_ref,(referenceCounts.get(l.line_ref)||0)+1);
    for(const s of d.sections){if(!s.section_ref||sections.has(s.section_ref))add('Section','Section references must be present and unique.');sections.add(s.section_ref);}
    for(const s of d.sources){if(!s.source_ref||sources.has(s.source_ref))add('Source','Source references must be present and unique.');sources.add(s.source_ref);if(!validDate(s.source_date))add('Source',`${s.source_ref}: a valid source date is required.`);if(s.valid_until&&!validDate(s.valid_until))add('Source',`${s.source_ref}: expiry date is invalid.`);}
    for(const [index,l] of d.lines.entries()){
      rowIndex=index;
      const ref=l.line_ref||'(missing reference)';
      if(!l.line_ref)add('Missing',`${ref}: a stable line reference is required.`,ref,'line_ref');
      else if(referenceCounts.get(l.line_ref)>1)add('Duplicate',`${ref}: line references must be unique.`,ref,'line_ref');
      for(const k of ['description','section_ref','unit','source_ref','source_date'])if(l[k]===''||l[k]==null)add('Missing',`${ref}: enter ${k.replaceAll('_',' ')}.`,ref,k);
      if(String(l.description??'').length>300)add('Text',`${ref}: description exceeds 300 characters.`,ref,'description');
      for(const k of ['line_ref','section_ref','description','unit','source_ref','source_sheet'])if(typeof l[k]!=='string'||!l[k].trim())add('Text',`${ref}: ${k.replaceAll('_',' ')} must be nonempty text.`,ref,k);
      if(!Number.isInteger(l.source_row)||l.source_row<1||l.source_row>1048576)add('Locator',`${ref}: source row must be a valid positive worksheet row.`,ref,'source_row');
      if(!['ea','m','m2','m3','h','lot'].includes(l.unit))add('Unit',`${ref}: unit requires a reviewed mapping.`,ref,'unit');
      if(!validDate(l.source_date))add('Date',`${ref}: enter a valid source date.`,ref,'source_date');
      const source=d.sources.find(s=>s.source_ref===l.source_ref);if(source&&source.source_date!==l.source_date)add('Date',`${ref}: line date differs from its source record.`,ref,'source_date');
      if(!sections.has(l.section_ref))add('Section',`${ref}: section is not defined.`,ref,'section_ref');
      if(!sources.has(l.source_ref))add('Source',`${ref}: cost source is not defined.`,ref,'source_ref');
      if(!categories.includes(l.category))add('Category',`${ref}: select a supported cost category.`,ref,'category');
      for(const k of ['allowance','include','print'])if(!flag(l[k]))add('Choice',`${ref}: ${k} needs an explicit Yes or No.`,ref,k);
      try{const q=scaled(l.quantity,3);if(q<=0n||q>100000000n)throw Error();}catch{add('Quantity',`${ref}: quantity must be positive, at most 100,000 and use up to three decimal places.`,ref,'quantity');}
      for(const k of ['unit_cost','unit_sell'])try{if(scaled(l[k],2)>100000000n)throw Error();}catch{add('Amount',`${ref}: ${k.replaceAll('_',' ')} must be 0–1,000,000 with up to two decimals.`,ref,k);}
      try{if(scaled(l.unit_sell,2)<scaled(l.unit_cost,2))add('Price',`${ref}: sell below cost is outside the pilot policy.`,ref,'unit_sell');}catch{}
      for(const [field,price] of [['workbook_cost','unit_cost'],['workbook_sell','unit_sell']])try{if(scaled(l[field],2)!==extend(l.quantity,l[price]))add('Difference',`${ref}: workbook ${field.endsWith('cost')?'cost':'sell'} differs from PPO calculation.`,ref,field);}catch{add('Calculation',`${ref}: ${field} cannot be reconciled.`,ref,field);}
    }
    const t=totals(d.lines);
    if(!Number.isInteger(d.control.line_count)||d.control.line_count!==d.lines.length)add('Control','Workbook line count does not match exported lines.');
    for(const k of Object.keys(d.control))if(!['line_count','workbook_cost','workbook_sell','included_sell'].includes(k))add('Control',`Unsupported control: ${k}.`);
    for(const [k,v] of [['workbook_cost',t.cost],['workbook_sell',t.sell],['included_sell',t.included]])try{if(scaled(d.control[k],2)!==scaled(v,2))add('Control',`${k.replaceAll('_',' ')} does not reconcile.`);}catch{add('Control',`${k.replaceAll('_',' ')} is missing or invalid.`);}
    return {issues,totals:t};
  }
  function difference(previous,next) {
    const a=new Map(previous.map(l=>[l.line_ref,l])),b=new Map(next.map(l=>[l.line_ref,l]));
    const normal=(l,k)=>{
      if(['allowance','include','print'].includes(k))return flag(l[k])?yes(l[k]):l[k];
      if(['quantity','unit_cost','unit_sell','workbook_cost','workbook_sell'].includes(k)){try{return scaled(l[k],k==='quantity'?3:2).toString();}catch{}}
      return l[k];
    };
    return [...new Set([...a.keys(),...b.keys()])].map(ref=>{
      const before=a.get(ref),after=b.get(ref);
      const fields=before&&after?headers.filter(k=>!['source_sheet','source_row'].includes(k)&&normal(before,k)!==normal(after,k)):[];
      return {ref,kind:!before?'Added':!after?'Removed':fields.length?'Changed':'Unchanged',fields,before,after};
    });
  }
  function adjustLine(line,cost,reason,confirmed) {
    if(!String(reason??'').trim())throw Error('Enter the reason and supporting source.');
    if(!confirmed)throw Error('Confirm the reviewed calculation difference.');
    if(scaled(cost,2)>100000000n)throw Error('Unit cost must be at most 1,000,000 AUD.');
    if(scaled(cost,2)>scaled(line.unit_sell,2))throw Error('Sell below cost is outside the pilot policy.');
    const after=clone(line);after.unit_cost=cost;
    after.workbook_cost=amount(extend(after.quantity,cost));
    after.workbook_sell=amount(extend(after.quantity,after.unit_sell));
    return {line_ref:line.line_ref,before:clone(line),after,reason:String(reason).trim()};
  }
  global.PPOImport={clone,scaled,extend,amount,yes,totals,fromFixture,controls,validate,difference,adjustLine,headers};
})(globalThis);
