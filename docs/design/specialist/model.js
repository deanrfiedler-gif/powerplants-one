/* ES-08 design model. Reference snapshots are authored fixtures, never Screen Systems formulae. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const stable = value => JSON.stringify(value);
  const VERSION = 'PPO-ES08-DEMO-1';
  const CONTEXT = Object.freeze({estimate:'SYN-PPO-EST-000042',option:'SYN-OPT-A',revision:'Draft r03',customer:'Northbank Nursery',site:'Northbank · Glasshouse 02',facility:'SYN-FAC-NB-GH02',scope:'Screen Systems / Retractable Shade / Supply + install',configuration:'SYN-CFG-SCREEN-001'});
  const field = (key,label,unit,step,value,options) => ({key,label,unit,step,value,options:options||null});
  const fields = [
    field('variant','Screen variant','',0,'Retractable Shade',['Retractable Shade','Retractable Blackout','Replacement Screens']),
    field('builder','Greenhouse builder','',0,'Synthetic greenhouse builder'),field('brand','Greenhouse brand','',0,'Reference house'),
    field('spans','Spans','count',0,'4'),field('spanWidth','Span width','m',0,'8'),field('bays','Bays','count',0,'8'),field('baySize','Bay spacing','m',0,'4'),
    field('extraWallSpans','Extra wall spans','count',0,'0'),field('screenHeight','Height to screen','m',0,'3'),field('gutterHeight','Gutter height','m',0,'4.5'),
    field('longBay','Long bay present','',0,'No',['No','Yes']),field('oddBaySize','Odd bay size','m',0,''),
    field('trussShape','Truss shape','',0,'To be confirmed'),field('cordHeight','Truss chord height','mm',0,''),field('cordWidth','Truss chord width','mm',0,''),
    field('keepMotors','Keep motors and switchgear','',0,'Yes',['Yes','No']),field('keepDrive','Keep drive pipe and associated parts','',0,'Yes',['Yes','No']),
    field('outsideInstall','Installation outside this quote','',0,'Yes',['Yes','No']),
    field('cloth','Cloth reference','',1,'SYN-SHADE-01',['SYN-SHADE-01']),field('clothCost','Cloth unit cost override','AUD/m²',1,''),
    field('clothReason','Cloth cost override reason','',1,''),field('edgeSeal','Edge seal','',1,'Included',['Included','Excluded']),
    field('sealMaterial','Seal material reference','',1,'SYN-SEAL-01'),field('overhang','Overhang','mm',1,'150'),field('edgeFixing','Overhang edge fixing','',1,'Reference fixing'),
    field('shrinkage','Shrinkage allowance','%',1,'2'),field('screensPerSpan','Screens per span','count',1,'1'),field('cutWider','Cut from wider sheet','',1,'No',['No','Yes']),
    field('sheetWidth','Sheet width','m',1,''),field('bedFastening','Bed fastening reference','',1,'SYN-FIX-01'),field('clipSpacing','Clip spacing','mm',1,'500'),
    field('supportWire','Support and lacing wire reference','',1,'SYN-WIRE-01'),field('driveType','Drive type','',1,'Cable',['Cable','Pinion']),
    field('targetSpacing','Drive target spacing','m',1,'4'),field('drum','Drum reference','',1,'SYN-DRUM-01'),field('driveLocation','Drive location','',1,'Reference end bay'),
    field('pipeDiameter','Drive pipe diameter','mm',1,'34'),field('motorsAcross','Motors across','count',1,'1'),field('motorsDown','Motors down','count',1,'1'),
    field('power','Facility recorded power','',1,'400 V · 3 phase'),field('controlBox','Control box reference','',1,'SYN-CONTROL-01'),
    field('leadingEdge','Leading edge profile','',1,'SYN-EDGE-01'),field('mounting','Motor mounting reference','',1,'SYN-MOUNT-01'),
    field('hourly','Bill hourly','',2,'No',['No','Yes']),field('hourlyRate','Hourly billing rate','AUD/h',2,''),field('hoursDay','Work hours per day','h/day',2,'8'),
    field('installerDays','Installer · screen fitting','person-days',2,'4'),field('electricianDays','Electrician · control connection','person-days',2,'1'),
    field('travelDays','Travel time','person-days',2,'1'),field('expenseMargin','Expense margin','%',2,''),
    field('jobLocation','Job location','',2,'Synthetic Northbank region'),field('travelMode','Travel mode','',2,'Car',['Car','Plane']),
    field('nights','Accommodation','nights',2,'0'),field('mealDays','Meals','person-days',2,'0'),field('carHireDays','Car hire','days',2,'0'),
    field('parkingDays','Parking','days',2,'0'),field('liftDays','Scissor lift','days',2,'1'),
    field('internationalFreight','International freight mode','',3,'Sea',['Sea','Air']),field('localFreight','Local freight cost','AUD',3,'120'),
    field('freightPercent','Freight allowance','%',3,''),field('duty','Import duty allowance','%',3,''),field('spares','Spares allowance','%',3,''),
    field('label','Customer configuration label','',3,'Northbank · Glasshouse 02 · Retractable Shade')
  ];
  const resultDefinitions = [
    ['houseWidth','House width','m',32],['houseLength','House length','m',32],['area','Covered footprint','m²',1024],
    ['clothQty','Cloth allowance','m²',1120],['cableQty','Drive cable','m',240],['pipeQty','Drive pipe','m',32],
    ['motorsQty','Drive motors','each',1],['labourQty','Installation allowance','h',40]
  ];
  const baseInputs = Object.fromEntries(fields.map(f=>[f.key,f.value]));
  const fixtures = {
    A:{id:'A',version:'SYN-CASE-A-r01',title:'Original eight-bay reference',inputs:clone(baseInputs),results:resultDefinitions.map(r=>({key:r[0],label:r[1],unit:r[2],value:String(r[3])})),prices:'SYN-PRICE-r01',mapping:'SYN-PART-MAP-r01'},
    B:{id:'B',version:'SYN-CASE-B-r02',title:'Nine-bay revision reference',inputs:{...baseInputs,bays:'9'},results:resultDefinitions.map(r=>({key:r[0],label:r[1],unit:r[2],value:String(({houseLength:36,area:1152,clothQty:1260,cableQty:270,pipeQty:36,labourQty:48})[r[0]]||r[3])})),prices:'SYN-PRICE-r02',mapping:'SYN-PART-MAP-r02'}
  };
  const evidence = [
    {id:'DEF-01',name:'Executable Screen Systems definition',status:'Missing',owner:'Specialist definition owner',need:'Versioned expressions, dependencies, units, variants, active period, rounding and approved checksum.'},
    {id:'DEF-02',name:'Approved input ranges and catalogue choices',status:'Missing',owner:'Engineering reviewer',need:'Accepted min/max, units, conditional fields and operating assumptions for every supported branch.'},
    {id:'DEF-03',name:'Published parts and cost-source mappings',status:'Missing',owner:'Estimating / catalogue owner',need:'Stable rule and item identities, quantity expressions, procurement flags, cost and sell sources.'},
    {id:'DEF-04',name:'Accepted intermediate and final examples',status:'Missing',owner:'Specialist acceptance reviewer',need:'Approved golden cases and rerun differences for each supported variant and material branch.'},
    {id:'DOC-01',name:'Guide-derived field and workflow catalogue',status:'Reference only',owner:'Design evidence',need:'CREMS v05 Appendix J / X; guide pp138–151 cited by the source. Does not contain an executable formula library.'},
    {id:'SYN-01',name:'Two authored workflow reference cases',status:'Synthetic',owner:'HTML design',need:'Fixed A/B input and output snapshots, illustrative AUD prices. They have no engineering approval.'}
  ];
  const required = ['variant','spans','spanWidth','bays','baySize','screenHeight','cloth','edgeFixing','driveType','targetSpacing','motorsAcross','motorsDown','leadingEdge','jobLocation','travelMode'];
  const positive = ['spans','spanWidth','bays','baySize','screenHeight','targetSpacing','motorsAcross','motorsDown','screensPerSpan','hoursDay','hourlyRate','oddBaySize','sheetWidth'];
  const fail = message => {throw new Error(message);};
  function decimal(value,places,max,allowZero=true) {
    const s=String(value);
    if (!new RegExp('^\\d+(?:\\.\\d{1,'+places+'})?$').test(s)) fail('Use a non-negative decimal with at most '+places+' decimal places.');
    const [whole,fraction='']=s.split('.');
    const n=BigInt(whole)*10n**BigInt(places)+BigInt(fraction.padEnd(places,'0'));
    if ((!allowZero&&n===0n)||n>BigInt(max)*10n**BigInt(places)) fail('Value is outside the demonstration arithmetic limit.');
    return n;
  }
  function lineTotal(qty,price) {return Number((decimal(qty,3,100000,false)*decimal(price,2,1000000)+500n)/1000n);}
  function totals(lines) {
    let cost=0,sell=0,missing=0;
    for(const l of lines) {
      if(l.cost===''||l.sell===''){missing++;continue;}
      cost+=lineTotal(l.qty,l.cost);sell+=lineTotal(l.qty,l.sell);
    }
    return {cost,sell,missing,complete:missing===0};
  }
  function inputErrors(inputs) {
    const errors={};
    for(const f of fields) {
      const v=inputs[f.key];
      if(typeof v!=='string'||v.length>1000){errors[f.key]='Invalid or oversized value.';continue;}
      if(f.options&&!f.options.includes(v))errors[f.key]='Choose a listed reference value.';
      if(required.includes(f.key)&&!v.trim())errors[f.key]='Required for this configuration.';
      if(f.unit&&v!=='') {
        try{decimal(v,f.unit.startsWith('AUD')?2:3,1000000,!positive.includes(f.key));}catch(e){errors[f.key]=e.message;}
        if(f.unit==='count'&&!/^\d+$/.test(v))errors[f.key]='Enter a whole count.';
      }
    }
    if(inputs.hourly==='No'&&!inputs.hoursDay)errors.hoursDay='Work hours per day are required for itemised installation.';
    if(inputs.hourly==='Yes'&&!inputs.hourlyRate)errors.hourlyRate='An explicit hourly rate is required.';
    if(inputs.longBay==='Yes'&&!inputs.oddBaySize)errors.oddBaySize='Enter the odd bay size.';
    if(inputs.cutWider==='Yes'&&!inputs.sheetWidth)errors.sheetWidth='Enter the wider sheet width.';
    if(inputs.clothCost!==''&&!inputs.clothReason.trim())errors.clothReason='Record a reason for the explicit cloth cost override, including zero.';
    if(inputs.label.length>300)errors.label='Use no more than 300 characters.';
    return errors;
  }
  function matchCase(inputs) {
    const omitted=['label','clothCost','clothReason'];
    return Object.values(fixtures).find(f=>fields.every(k=>omitted.includes(k.key)||inputs[k.key]===f.inputs[k.key]))||null;
  }
  function seed() {
    return {schema:VERSION,context:clone(CONTEXT),inputs:clone(baseInputs),overrides:{},reviewedOverrides:{},
      configuration:null,runs:[],audit:[],pending:null,receipt:null,seq:0,rev:0,
      issued:{id:'SYN-ISSUED-EXAMPLE-r01',label:'Earlier issued illustration',totalCents:1184000,basis:'SYN-ISSUED-BASIS-r01',immutable:true}};
  }
  function linesFor(f,results,inputs) {
    const q=key=>results.find(r=>r.key===key).value;
    const line=(key,description,qty,unit,cost,sell,group,noPurchase=false)=>({key,item:'SYN-'+key.toUpperCase(),description,qty,unit,cost,sell,group,noPurchase,origin:'generated'});
    const lines=[
      line('cloth','Reference shade cloth',q('clothQty'),'m²',inputs.clothCost===''?'3.20':inputs.clothCost,'4.50','Screen material'),
      line('cable','Reference drive cable',q('cableQty'),'m','1.50','2.40','Drive & control'),
      line('pipe','Reference drive pipe',q('pipeQty'),'m','9.00','12.00','Drive & control'),
      line('motor','Reference motor assembly',q('motorsQty'),'each','380.00','510.00','Drive & control'),
      line('labour','Reference installation allowance',q('labourQty'),'h','48.00','75.00','Installation',true),
      line('freight','Reference local freight', '1','each','120.00','150.00','Freight',true)
    ];
    if(f.id==='A')lines.push(line('legacy-bracket','Reference bracket set','4','each','8.00','12.00','Drive & control'));
    else lines.push(line('support-kit','Reference support kit','1','each','68.00','95.00','Drive & control'));
    return lines;
  }
  function signature(s) {return stable({inputs:s.inputs,overrides:s.overrides,reviewed:s.reviewedOverrides,baseline:s.configuration,context:s.context,rev:s.rev});}
  function preview(s) {
    const errors=inputErrors(s.inputs),f=matchCase(s.inputs);
    const p={caseId:f?.id||null,operationalReady:false,errors,blockers:evidence.filter(e=>e.status==='Missing').map(e=>e.name),results:[],lines:[],warnings:[],signature:signature(s),fixtureReady:false};
    if(Object.keys(errors).length||!f){p.reason='No exact reference case matches these answers. Arbitrary Screen Systems calculation requires the missing approved definition.';return p;}
    p.results=clone(f.results);
    for(const r of p.results) {
      const o=s.overrides[r.key];
      if(o){r.original=r.value;r.value=o.value;r.overridden=true;if(o.basis!==f.version&&s.reviewedOverrides[r.key]!==f.version)p.warnings.push('Override '+r.label+' needs review against '+f.version+'.');}
    }
    p.lines=linesFor(f,p.results,s.inputs);
    if(p.lines.some(l=>Number(l.cost)>Number(l.sell)))p.errors.clothCost='Reference sell is below the overridden cost; a validated pricing decision is required.';
    p.totals=totals(p.lines);p.fixtureReady=!Object.keys(p.errors).length&&!p.warnings.length;
    return p;
  }
  function writable(s,gate) {
    if(gate.role!=='estimator')fail('Estimator editing permission is required.');
    if(gate.locked)fail('The estimate is locked. Start an authorised draft successor in the originating estimate.');
    if(gate.scopeChanged)fail('The committed scope has changed. Reconcile it in the originating estimate.');
    if(gate.stale)fail('Another tab changed this session. Export unsaved answers, then reload.');
    if(s.pending)fail('Recover the existing operation before another write.');
  }
  function setOverride(s,key,value,reason) {
    const p=preview(s),r=p.results.find(x=>x.key===key);
    if(!r||!['clothQty','cableQty','pipeQty','motorsQty','labourQty'].includes(key))fail('Only the five stated quantity outputs support a reference-case override.');
    decimal(value,3,100000,false);
    if(key==='motorsQty'&&!/^\d+$/.test(value))fail('Motor quantity must be a whole count.');
    if(!reason.trim()||reason.length>1000)fail('Record a concise override reason.');
    s.overrides[key]={value,unit:r.unit,reason:reason.trim(),original:r.original||r.value,basis:fixtures[p.caseId].version,actor:'Synthetic estimator',at:new Date().toISOString()};
    delete s.reviewedOverrides[key];s.rev++;
  }
  function diff(s,p=preview(s)) {
    if(!s.configuration)return p.lines.map(n=>({key:n.key,kind:'Added',old:null,next:clone(n),needs:false}));
    const old=s.configuration.lines,base=s.configuration.baseline,next=p.lines;
    for(const list of [old,base,next])if(new Set(list.map(l=>l.key)).size!==list.length)fail('Ambiguous stable part keys block the rerun.');
    const keys=[...new Set([...next.map(l=>l.key),...old.map(l=>l.key)])];
    return keys.map(key=>{
      const a=old.find(l=>l.key===key),b=base.find(l=>l.key===key),n=next.find(l=>l.key===key);
      if(a?.origin==='manual')return {key,kind:n?'Manual edit':'Retained manual',old:a,next:n||null,needs:!!n};
      const edited=a&&b&&stable(a)!==stable(b);
      return {key,kind:!a?'Added':!n?(edited?'Unmatched manual':'Removed'):edited?'Manual edit':stable(b)===stable(n)?'Unchanged':'Changed',old:a||null,next:n||null,needs:!!(edited||(!n&&a))};
    });
  }
  function resolvedLines(s,p,resolutions) {
    return diff(s,p).flatMap(d=>{
      const choice=resolutions[d.key];
      if(d.needs&&!['keep','generated','remove'].includes(choice))fail('Resolve '+d.key+' before staging this reference run.');
      if(d.kind==='Retained manual')return [clone(d.old)];
      if(d.kind==='Unmatched manual'||d.kind==='Removed') {
        if(!['keep','remove'].includes(choice))fail('Choose retain separately or remove for '+d.key+'.');
        return choice==='keep'?[{...clone(d.old),origin:'manual'}]:[];
      }
      if(d.kind==='Manual edit'){
        if(!['keep','generated'].includes(choice))fail('Choose keep manual or use generated for '+d.key+'.');
        return [clone(choice==='keep'?d.old:d.next)];
      }
      return d.next?[clone(d.next)]:[];
    });
  }
  function apply(s,gate,expected,resolutions={},mode='normal') {
    writable(s,gate);
    if(expected!==signature(s))fail('The preview changed. Review the current answers and rerun comparison.');
    if(!['normal','fail','lost','totals'].includes(mode))fail('Unknown demonstration outcome.');
    const p=preview(s);
    if(!p.fixtureReady)fail('Resolve invalid inputs, unmatched reference answers and override reviews first.');
    if(!gate.ack)fail('Acknowledge that this stages synthetic reference records only.');
    const lines=resolvedLines(s,p,resolutions),t=totals(lines);
    if(!t.complete)fail('Missing cost or sell sources block staging.');
    if(mode==='fail')fail('Simulated save failed before commit. No lines changed; answers and decisions remain available.');
    const f=fixtures[p.caseId],id='SYN-RUN-'+String(++s.seq).padStart(3,'0'),op='SYN-OP-'+s.seq;
    const run={id,operation:op,configuration:CONTEXT.configuration,context:clone(s.context),caseId:f.id,formula:'NOT SUPPLIED',reference:f.version,mapping:f.mapping,prices:f.prices,inputs:clone(s.inputs),overrides:clone(s.overrides),overrideReview:clone(s.reviewedOverrides),baseline:clone(p.lines),lines:clone(lines),resolutions:clone(resolutions),totalSnapshot:t,at:new Date().toISOString(),kind:s.configuration?'Rerun':'First staging'};
    s.runs.push(clone(run));s.configuration={id:CONTEXT.configuration,run:id,lines:clone(lines),baseline:clone(p.lines),totals:t,totalsState:mode==='totals'?'Stale totals':'Current'};
    s.audit.push({at:run.at,event:run.kind+' · '+id,detail:'Synthetic reference record committed. No approved engine or application write.'});
    s.receipt={operation:op,run:id};if(mode==='lost')s.pending=clone(s.receipt);
    s.rev++;return run;
  }
  function recover(s,gate) {
    const pending=s.pending;if(!pending)return false;
    writable({...s,pending:null},gate);
    if(s.receipt?.operation!==pending.operation||!s.runs.some(r=>r.id===pending.run))fail('No matching receipt. Preserve and investigate this session.');
    s.pending=null;return true;
  }
  function repair(s,gate) {
    writable(s,gate);if(!s.configuration)fail('No staged configuration.');
    s.configuration.totals=totals(s.configuration.lines);s.configuration.totalsState='Current';s.audit.push({at:new Date().toISOString(),event:'Totals repaired',detail:'Existing lines retained; no repeated generation.'});s.rev++;
  }
  function editLine(s,gate,key,values,reason) {
    writable(s,gate);const line=s.configuration?.lines.find(l=>l.key===key);if(!line)fail('Staged part not found.');
    decimal(values.qty,3,100000,false);decimal(values.cost,2,1000000);decimal(values.sell,2,1000000);
    if(Number(values.sell)<Number(values.cost))fail('Reference sell cannot be below cost.');
    if(!values.description.trim()||values.description.length>300||!reason.trim())fail('Description and manual-edit reason are required.');
    Object.assign(line,clone(values));s.configuration.totals=totals(s.configuration.lines);
    s.audit.push({at:new Date().toISOString(),event:'Manual part edit · '+key,detail:reason});s.rev++;
  }
  function loadCase(s,id) {
    if(!fixtures[id])fail('Unknown reference case.');
    if(s.configuration&&s.inputs.variant!==fixtures[id].inputs.variant)fail('Rerun variant is fixed to the applied snapshot.');
    s.inputs=clone(fixtures[id].inputs);s.rev++;
  }
  function startFresh(s) {s.inputs=clone(baseInputs);s.overrides={};s.reviewedOverrides={};s.rev++;}
  function restore(raw) {
    if(typeof raw!=='string'||raw.length>4000000)fail('Session exceeds the design import limit.');
    const s=JSON.parse(raw);
    if(s.schema!==VERSION||stable(s.context)!==stable(CONTEXT)||stable(s.issued)!==stable(seed().issued))fail('Unsupported or altered record context.');
    if(!s.inputs||Object.keys(s.inputs).length!==fields.length||fields.some(f=>typeof s.inputs[f.key]!=='string'||s.inputs[f.key].length>1000))fail('Invalid input snapshot.');
    if(!Number.isSafeInteger(s.rev)||s.rev<0||!Number.isSafeInteger(s.seq)||s.seq<0||!Array.isArray(s.runs)||s.runs.length>100||!Array.isArray(s.audit)||s.audit.length>1000)fail('Invalid run history.');
    if(new Set(s.runs.map(r=>r.id)).size!==s.runs.length)fail('Duplicate run identities.');
    for(const r of s.runs)if(!fixtures[r.caseId]||r.formula!=='NOT SUPPLIED'||!r.id||!Array.isArray(r.lines)||stable(r.context)!==stable(CONTEXT)||!Number.isFinite(Date.parse(r.at))||!r.totalSnapshot||!r.inputs||fields.some(f=>typeof r.inputs[f.key]!=='string')||r.reference!==fixtures[r.caseId].version||r.mapping!==fixtures[r.caseId].mapping||r.prices!==fixtures[r.caseId].prices)fail('Invalid reference run.');
    if(!s.overrides||!s.reviewedOverrides||Array.isArray(s.overrides))fail('Invalid override collection.');
    for(const [key,o]of Object.entries(s.overrides)){if(!['clothQty','cableQty','pipeQty','motorsQty','labourQty'].includes(key)||!o.reason||o.reason.length>1000||!Object.values(fixtures).some(f=>f.version===o.basis)||!Number.isFinite(Date.parse(o.at)))fail('Invalid override evidence.');decimal(o.value,3,100000,false);if(o.unit!==resultDefinitions.find(r=>r[0]===key)[2])fail('Override unit mismatch.');}
    for(const list of [...s.runs.flatMap(r=>[r.lines,r.baseline]),...(s.configuration?[s.configuration.lines,s.configuration.baseline]:[])]) {
      if(!Array.isArray(list)||list.length>100||new Set(list.map(l=>l.key)).size!==list.length)fail('Invalid or ambiguous part list.');
      for(const l of list){if(typeof l.key!=='string'||l.key.length>100||typeof l.description!=='string'||l.description.length>300||typeof l.unit!=='string'||l.unit.length>30||typeof l.group!=='string'||l.group.length>100||!['generated','manual'].includes(l.origin)||typeof l.noPurchase!=='boolean')fail('Invalid part.');decimal(l.qty,3,100000,false);if(l.cost!=='')decimal(l.cost,2,1000000);if(l.sell!=='')decimal(l.sell,2,1000000);}
    }
    for(const r of s.runs)if(stable(r.totalSnapshot)!==stable(totals(r.lines)))fail('Run totals do not match their saved line snapshot.');
    for(const a of s.audit)if(typeof a.event!=='string'||a.event.length>500||typeof a.detail!=='string'||a.detail.length>2000||!Number.isFinite(Date.parse(a.at)))fail('Invalid audit entry.');
    if(s.configuration&&!s.runs.some(r=>r.id===s.configuration.run))fail('Missing current run.');
    if(s.configuration&&(s.configuration.id!==CONTEXT.configuration||!['Current','Stale totals'].includes(s.configuration.totalsState)||stable(s.configuration.totals)!==stable(totals(s.configuration.lines))))fail('Invalid current configuration or totals.');
    if(s.pending&&(!s.receipt||s.pending.operation!==s.receipt.operation||s.pending.run!==s.receipt.run))fail('Unmatched pending receipt.');
    return clone(s);
  }
  root.SSModel={VERSION,CONTEXT,fields,fixtures,evidence,required,clone,stable,seed,decimal,lineTotal,totals,inputErrors,matchCase,preview,signature,setOverride,diff,resolvedLines,apply,recover,repair,editLine,loadCase,startFresh,restore,writable};
})(typeof globalThis!=='undefined'?globalThis:window);
