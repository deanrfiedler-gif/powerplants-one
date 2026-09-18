/* Powerplants One - Order Fulfilment & Customer Delivery (SC-05, SC-06, SC-07)
   Synthetic coordination model. Source authority for ERP orders, inventory and account
   information remains MYOB Acumatica; every value here is a fictional observation or a
   locally owned coordination record. No MYOB endpoint, status code, field mapping or
   transaction semantic is invented or asserted as verified. */
(function(root){
  'use strict';
  const TODAY='2026-09-16', SCALE=1000, clone=x=>JSON.parse(JSON.stringify(x));
  const must=(v,m)=>{if(!v)throw Error(m);};
  const text=(v,label,min=8,max=2000)=>{must(typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max,`${label}: enter ${min}–${max.toLocaleString('en-AU')} characters.`);return v.trim();};
  const date=v=>{must(/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Enter a real calendar date.');return v;};

  /* ---------- Quantity algebra -------------------------------------------------------
     Quantities are held as integer thousandths of the line unit. No conversion between
     EA, SET, PACK, BOTTLE, HOUR or JOB exists; a differing unit is never summed. */
  const qty=(v,label='Quantity')=>{const s=String(v??'').trim();must(/^\d+(\.\d{1,3})?$/.test(s),`${label}: enter a quantity of at most three decimal places, using the line unit.`);const[a,b='']=s.split('.');return Number(a)*SCALE+Number((b+'000').slice(0,3));};
  const show=n=>{must(Number.isInteger(n)&&n>=0,'Invalid quantity.');const w=Math.trunc(n/SCALE),f=String(n%SCALE).padStart(3,'0').replace(/0+$/,'');return f?`${w}.${f}`:String(w);};
  const amount=(n,unit)=>n===null||n===undefined?'Unknown':`${show(n)} ${unit}`;
  const sum=list=>list.reduce((a,b)=>a+b,0);

  /* ---------- Fixed synthetic context ------------------------------------------------ */
  const companies={
    'PPA-AU':{id:'PPA-AU',name:'Powerplants Australia Pty Ltd',erpCompany:'SYN-ERP-CO-AU',currency:'AUD',timezone:'Australia/Melbourne'},
    'PPA-NZ':{id:'PPA-NZ',name:'Powerplants New Zealand Ltd',erpCompany:'SYN-ERP-CO-NZ',currency:'NZD',timezone:'Pacific/Auckland'}
  };
  const warehouses={
    'SYN-WH-MEL':{ref:'SYN-WH-MEL',name:'Melbourne store',company:'PPA-AU'},
    'SYN-WH-SYD':{ref:'SYN-WH-SYD',name:'Sydney satellite store',company:'PPA-AU'},
    'SYN-WH-AKL':{ref:'SYN-WH-AKL',name:'Auckland store',company:'PPA-NZ'}
  };
  const items={
    'SYN-PPO-PRD-0004':{ref:'SYN-PPO-PRD-0004',code:'SYN-L1000-L',name:'L1000 toplight',unit:'EA',status:'Active'},
    'SYN-PPO-PRD-0006':{ref:'SYN-PPO-PRD-0006',code:'SYN-S100',name:'S100 substrate sensor',unit:'EA',status:'Active'},
    'SYN-PPO-PRD-0009':{ref:'SYN-PPO-PRD-0009',code:'SYN-S100-BAT',name:'S100 battery pack',unit:'PACK',status:'Active'},
    'SYN-PPO-PRD-0003':{ref:'SYN-PPO-PRD-0003',code:'SYN-C200',name:'C200 climate controller',unit:'EA',status:'Active'},
    'SYN-PPO-PRD-0007':{ref:'SYN-PPO-PRD-0007',code:'SYN-F300-SEAL',name:'F300 seal kit',unit:'SET',status:'Active'},
    'SYN-PPO-PRD-0013':{ref:'SYN-PPO-PRD-0013',code:'SYN-F200',name:'F200 fertigation unit',unit:'EA',status:'Discontinued'},
    'SYN-PPO-PRD-0001':{ref:'SYN-PPO-PRD-0001',code:'SYN-F300-A',name:'F300 fertigation unit',unit:'EA',status:'Active'},
    'SYN-PPO-PRD-0008':{ref:'SYN-PPO-PRD-0008',code:'SYN-F300-MOUNT',name:'F300 mounting set',unit:'SET',status:'Active'}
  };
  const people={robin:'Robin Ellis',alex:'Alex Morgan',sam:'Sam Patel',casey:'Casey Reed',mia:'Mia Chen',jamie:'Jamie Walker'};
  const roles={
    coordinator:{key:'coordinator',name:people.robin,title:'Fulfilment coordinator',companies:['PPA-AU'],warehouses:['SYN-WH-MEL','SYN-WH-SYD'],commercial:true,write:true,
      can:['reserve','reconcileUnknown','refreshObservation','reviewFinding','prepareDispatch','issueDocuments','recordShipmentOutcome','correctDelivery','raiseException','resolveException','expectedCommitment','followUp']},
    warehouse:{key:'warehouse',name:people.alex,title:'Warehouse & dispatch',companies:['PPA-AU'],warehouses:['SYN-WH-MEL'],commercial:false,write:true,
      can:['pick','stage','proposeSubstitution','issueDocuments','recordMovement']},
    delivery:{key:'delivery',name:people.sam,title:'Delivery & proof of delivery',companies:['PPA-AU'],warehouses:[],commercial:false,write:true,
      can:['captureDelivery','acknowledgeDelivery','correctDelivery']},
    reviewer:{key:'reviewer',name:people.casey,title:'Commercial reviewer',companies:['PPA-AU'],warehouses:[],commercial:true,write:true,
      can:['decideSubstitution','confirmedCommitment','raiseException','resolveException','linkRecovery','followUp']},
    groupCoordinator:{key:'groupCoordinator',name:people.mia,title:'Group fulfilment coordinator',companies:['PPA-AU','PPA-NZ'],warehouses:['SYN-WH-MEL','SYN-WH-SYD','SYN-WH-AKL'],commercial:true,write:true,
      can:['reserve','reconcileUnknown','refreshObservation','reviewFinding','prepareDispatch','issueDocuments','recordShipmentOutcome','correctDelivery','raiseException','resolveException','expectedCommitment','followUp']},
    observer:{key:'observer',name:people.jamie,title:'Read-only observer',companies:['PPA-AU'],warehouses:[],commercial:false,write:false,can:[]}
  };
  const views=['register','stock','picking','delivery','exceptions'];
  const worklists=['all','Awaiting stock','Ready for picking','In preparation','Dispatched','Partially delivered','Needs follow-up'];
  const filters=()=>({q:'',customer:'',site:'',owner:'',warehouse:'',due:'',worklist:'all'});
  const can=(role,op)=>roles[role].write&&roles[role].can.includes(op);

  /* ---------- Seed ------------------------------------------------------------------- */
  function seed(){
    const av=(id,company,warehouse,bin,item,unit,x)=>({id,ref:'SYN-PPO-AVL-'+id.slice(-6),company,warehouse,bin,item,unit,
      onHand:null,sourceAvailable:null,sourceReserved:null,held:null,availableBasis:'Unknown',
      completeness:'Complete',observedAt:'2026-09-16T06:30:00+10:00',unitBasis:'Declared',anomaly:null,
      incoming:[],competing:[],version:1,...x});
    const rc=(ref,avLine,q,unit,inspection,at,source)=>({ref,avLine,qty:qty(q),unit,inspection,at,source});
    const line=(id,order,sourceLine,item,q,unit,x)=>({id,sourceLine,order,item,unit,ordered:qty(q),
      requested:'2026-09-17',confirmed:'2026-09-17',expectedVersion:1,cancelled:0,demandLink:null,version:1,...x});

    const availability=[
      av('avl-000001','PPA-AU','SYN-WH-MEL','A-03-02','SYN-PPO-PRD-0004','EA',{onHand:qty(6),sourceAvailable:qty(6),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000002','PPA-AU','SYN-WH-MEL','QA-HOLD-01','SYN-PPO-PRD-0004','EA',{onHand:qty(4),sourceAvailable:qty(0),sourceReserved:qty(0),held:qty(4),availableBasis:'Source available is reported net of held quantity',note:'Impact damage recorded at receipt; quarantined pending supplier disposition.'}),
      av('avl-000003','PPA-AU','SYN-WH-MEL','A-05-01','SYN-PPO-PRD-0006','EA',{onHand:qty(5),sourceAvailable:qty(5),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000004','PPA-AU','SYN-WH-MEL','A-05-02','SYN-PPO-PRD-0009','PACK',{onHand:qty(2),sourceAvailable:qty(2),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000005','PPA-AU','SYN-WH-SYD','S-02-01','SYN-PPO-PRD-0009','EA',{onHand:qty(12),sourceAvailable:qty(12),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations',unitBasis:'Unresolved',note:'The source reports this item in EA while the catalogue and order lines use PACK. No accepted conversion exists, so this observation is never added to a PACK quantity.'}),
      av('avl-000006','PPA-AU','SYN-WH-SYD','S-02-03','SYN-PPO-PRD-0003','EA',{completeness:'Partial',observedAt:'2026-09-15T18:05:00+10:00',note:'The warehouse source returned a partial result. Quantities are unknown, which is not the same as zero.'}),
      av('avl-000007','PPA-AU','SYN-WH-MEL','A-02-01','SYN-PPO-PRD-0007','SET',{onHand:qty(3),sourceAvailable:qty(3),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000008','PPA-AU','SYN-WH-MEL','A-01-01','SYN-PPO-PRD-0013','EA',{onHand:qty(0),sourceAvailable:qty(0),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations',note:'Catalogue status is Discontinued. No incoming supply is evidenced.'}),
      av('avl-000009','PPA-AU','SYN-WH-MEL','A-01-02','SYN-PPO-PRD-0001','EA',{onHand:qty(3),sourceAvailable:qty(3),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000010','PPA-AU','SYN-WH-MEL','A-04-01','SYN-PPO-PRD-0008','SET',{onHand:qty(2),sourceAvailable:qty(2),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'}),
      av('avl-000011','PPA-AU','SYN-WH-MEL','A-03-05','SYN-PPO-PRD-0004','EA',{onHand:qty(2),sourceAvailable:qty(3),sourceReserved:qty(0),held:qty(1),availableBasis:'Source available is reported net of held quantity',
        anomaly:{kind:'Source available exceeds its own physical basis',note:'The source reports 3 EA available while on hand 2 EA less held 1 EA leaves 1 EA. The original values are preserved for investigation and are not corrected, rounded or allocated here.'}}),
      av('avl-000012','PPA-NZ','SYN-WH-AKL','NZ-01-01','SYN-PPO-PRD-0004','EA',{onHand:qty(9),sourceAvailable:qty(9),sourceReserved:qty(0),held:qty(0),availableBasis:'Source available is reported net of source reservations'})
    ];
    availability[0].incoming=[{ref:'SYN-ERP-PO-002210-10',qty:qty(4),unit:'EA',expected:'2026-09-23',evidence:'SYN-PPO-PRM-000411 supplier confirmation recorded in Material Readiness r03',state:'Promised, not received'}];
    availability[2].competing=[{ref:'SYN-PPO-FUL-000002',label:'Greenhaven Berries order',qty:qty(4),unit:'EA',requiredBy:'2026-09-18'},{ref:'SYN-PPO-FUL-000003',label:'Willowbank Horticulture order',qty:qty(3),unit:'EA',requiredBy:'2026-09-18'}];

    const receipts=[
      rc('SYN-PPO-RCT-000301-10','avl-000001',6,'EA','Usable','2026-09-12T11:20:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-PPO-RCT-000301-20','avl-000002',4,'EA','Held','2026-09-12T11:26:00+10:00','Material Readiness r03 receipt, inspection and quarantine'),
      rc('SYN-PPO-RCT-000305-10','avl-000003',5,'EA','Usable','2026-09-10T09:05:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-PPO-RCT-000306-10','avl-000004',2,'PACK','Usable','2026-09-10T09:12:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-PPO-RCT-000308-10','avl-000007',3,'SET','Usable','2026-09-11T14:40:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-PPO-RCT-000309-10','avl-000009',3,'EA','Usable','2026-09-09T13:00:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-PPO-RCT-000310-10','avl-000010',8,'SET','Usable','2026-09-08T10:15:00+10:00','Material Readiness r03 receipt and inspection'),
      rc('SYN-ERP-NZ-RCT-000044','avl-000012',9,'EA','Usable','2026-09-09T15:30:00+12:00','Synthetic New Zealand receipt observation')
    ];

    const orders=[
      {id:'ful-000001',ref:'SYN-PPO-FUL-000001',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004411',erpAccount:'SYN-ERP-CUST-NBN01',customerPo:'PO-NBN-8842',
        organisation:{ref:'SYN-PPO-ORG-000101',name:'Northbank Nursery'},site:{ref:'SYN-PPO-SIT-000101',name:'Propagation site',address:'27 Demonstration Nursery Road, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Pack Room 01 — hardstand loading bay',useArea:'Glasshouse 02 and the Irrigation room',
        contact:{name:'Priya Raman',role:'Nursery manager'},instructions:'Telephone thirty minutes before arrival. Unload at the hardstand only; forklift access inside Pack Room 01 is not available.',
        handover:{ref:'SYN-PPO-HOV-000041',opportunity:'SYN-PPO-OPP-000041',acceptedAt:'2026-09-11T10:04:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 10 September 2026; opportunity marked Won 10 September 2026; ERP order created 11 September 2026.'},
        owner:people.robin,observedAt:'2026-09-16T06:30:00+10:00',completeness:'Complete',version:1},
      {id:'ful-000002',ref:'SYN-PPO-FUL-000002',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004418',erpAccount:'SYN-ERP-CUST-GHB01',customerPo:'PO-GHB-2291',
        organisation:{ref:'SYN-PPO-ORG-000102',name:'Greenhaven Berries'},site:{ref:'SYN-PPO-SIT-000102',name:'Berry tunnels',address:'310 Sample Berry Road, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Farm shed — eastern gate',useArea:'Tunnel 06',
        contact:{name:'Jordan Lee',role:'Field production manager'},instructions:'Eastern gate only. Wet-weather vehicle access is not confirmed; telephone before dispatch.',
        handover:{ref:'SYN-PPO-HOV-000045',opportunity:'SYN-PPO-OPP-000045',acceptedAt:'2026-09-12T08:30:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 11 September 2026; opportunity marked Won 11 September 2026; ERP order created 12 September 2026.'},
        owner:people.robin,observedAt:'2026-09-16T06:30:00+10:00',completeness:'Complete',version:1},
      {id:'ful-000003',ref:'SYN-PPO-FUL-000003',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004422',erpAccount:'SYN-ERP-CUST-WBH01',customerPo:'Not supplied',
        organisation:{ref:'SYN-PPO-ORG-000201',name:'Willowbank Horticulture'},site:{ref:'SYN-PPO-SIT-000301',name:'Nursery & propagation',address:'12 Demonstration Growers Lane, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Hardstand beside Pack Room 01',useArea:'Propagation benches — confirm with the nursery manager',
        contact:{name:'Casey Taylor',role:'Nursery manager'},instructions:'Check in at Gate A on the south boundary before entering any growing area.',
        handover:{ref:'SYN-PPO-HOV-000048',opportunity:'SYN-PPO-OPP-000048',acceptedAt:'2026-09-14T15:10:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 13 September 2026; opportunity marked Won 13 September 2026; ERP order created 14 September 2026.'},
        owner:people.robin,observedAt:'2026-09-16T06:30:00+10:00',completeness:'Complete',version:1},
      {id:'ful-000004',ref:'SYN-PPO-FUL-000004',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004430',erpAccount:'SYN-ERP-CUST-CVG01',customerPo:'PO-CVG-1180',
        organisation:{ref:'SYN-PPO-ORG-000103',name:'Cedar Vale Growers'},site:{ref:'SYN-PPO-SIT-000104',name:'Young plant facility',address:'8 Example Seedling Way, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Goods door 2 — north elevation',useArea:'Bay 03',
        contact:{name:'Morgan Hale',role:'Facility supervisor'},instructions:'Deliveries accepted 08:00–14:00 weekdays.',
        handover:{ref:'SYN-PPO-HOV-000052',opportunity:'SYN-PPO-OPP-000052',acceptedAt:'2026-09-15T09:45:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 14 September 2026; opportunity marked Won 14 September 2026; ERP order created 15 September 2026.'},
        owner:people.robin,observedAt:'2026-09-15T18:05:00+10:00',completeness:'Partial',version:1},
      {id:'ful-000005',ref:'SYN-PPO-FUL-000005',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004435',erpAccount:'SYN-ERP-CUST-NBN01',customerPo:'PO-NBN-8850',
        organisation:{ref:'SYN-PPO-ORG-000101',name:'Northbank Nursery'},site:{ref:'SYN-PPO-SIT-000101',name:'Propagation site',address:'27 Demonstration Nursery Road, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Pack Room 01 — hardstand loading bay',useArea:'Irrigation room',
        contact:{name:'Priya Raman',role:'Nursery manager'},instructions:'Telephone thirty minutes before arrival.',
        handover:{ref:'SYN-PPO-HOV-000055',opportunity:'SYN-PPO-OPP-000055',acceptedAt:'2026-09-15T16:20:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 15 September 2026; opportunity marked Won 15 September 2026; ERP order created 15 September 2026.'},
        owner:people.robin,observedAt:'2026-09-16T06:30:00+10:00',completeness:'Complete',version:1},
      {id:'ful-000006',ref:'SYN-PPO-FUL-000006',company:'PPA-AU',erpOrder:'SYN-ERP-SO-004440',erpAccount:'SYN-ERP-CUST-GHB01',customerPo:'PO-GHB-2298',
        organisation:{ref:'SYN-PPO-ORG-000102',name:'Greenhaven Berries'},site:{ref:'SYN-PPO-SIT-000102',name:'Berry tunnels',address:'310 Sample Berry Road, Sampletown VIC 3999, Australia',timezone:'Australia/Melbourne'},
        receivingPoint:'Farm shed — eastern gate',useArea:'Tunnel 06',
        contact:{name:'Jordan Lee',role:'Field production manager'},instructions:'Eastern gate only.',
        handover:{ref:'SYN-PPO-HOV-000038',opportunity:'SYN-PPO-OPP-000038',acceptedAt:'2026-09-09T11:00:00+10:00',receivingOwner:people.robin,basis:'Quotation accepted 8 September 2026; opportunity marked Won 8 September 2026; ERP order created 9 September 2026.'},
        owner:people.robin,observedAt:'2026-09-16T06:30:00+10:00',completeness:'Complete',version:1},
      {id:'ful-000007',ref:'SYN-PPO-FUL-000007',company:'PPA-NZ',erpOrder:'SYN-ERP-SO-NZ-000212',erpAccount:'SYN-ERP-CUST-KRG01',customerPo:'PO-KRG-0042',
        organisation:{ref:'SYN-PPO-ORG-000301',name:'Kauri Ridge Glasshouses'},site:{ref:'SYN-PPO-SIT-000401',name:'Ridge glasshouse',address:'19 Example Ridge Road, Sampletown 2105, New Zealand',timezone:'Pacific/Auckland'},
        receivingPoint:'Loading apron — west end',useArea:'House 4',
        contact:{name:'Tane Wiremu',role:'Glasshouse manager'},instructions:'Deliveries by prior arrangement only.',
        handover:{ref:'SYN-PPO-HOV-NZ-000009',opportunity:'SYN-PPO-OPP-NZ-000009',acceptedAt:'2026-09-14T13:00:00+12:00',receivingOwner:people.mia,basis:'Synthetic New Zealand company record, retained to demonstrate company isolation.'},
        owner:people.mia,observedAt:'2026-09-16T08:30:00+12:00',completeness:'Complete',version:1}
    ];

    const lines=[
      line('lin-000001','ful-000001','SYN-ERP-SO-004411-10','SYN-PPO-PRD-0004',10,'EA',{value:'4950.00'}),
      line('lin-000002','ful-000001','SYN-ERP-SO-004411-20','SYN-PPO-PRD-0007',3,'SET',{value:'195.00',demandLink:{kind:'Service',ref:'SYN-PPO-WO-000245',note:'Linked Service work order. Technical release, attendance and scheduling remain in Service Operations.'}}),
      line('lin-000003','ful-000002','SYN-ERP-SO-004418-10','SYN-PPO-PRD-0006',4,'EA',{requested:'2026-09-18',confirmed:'2026-09-18',value:'1180.00'}),
      line('lin-000004','ful-000003','SYN-ERP-SO-004422-10','SYN-PPO-PRD-0006',3,'EA',{requested:'2026-09-18',confirmed:'2026-09-18',value:'885.00'}),
      line('lin-000005','ful-000003','SYN-ERP-SO-004422-20','SYN-PPO-PRD-0009',2,'PACK',{requested:'2026-09-18',confirmed:'2026-09-18',value:'58.00'}),
      line('lin-000006','ful-000004','SYN-ERP-SO-004430-10','SYN-PPO-PRD-0003',1,'EA',{requested:'2026-09-21',confirmed:'2026-09-21',value:'3250.00'}),
      line('lin-000007','ful-000005','SYN-ERP-SO-004435-10','SYN-PPO-PRD-0013',2,'EA',{requested:'2026-09-24',confirmed:'2026-09-24',value:'21900.00',demandLink:{kind:'Project',ref:'SYN-PPO-PRJ-000031',note:'Linked Project demand. Installation, technical release and the project plan remain in Projects & Commercial Delivery.'}}),
      line('lin-000008','ful-000006','SYN-ERP-SO-004440-10','SYN-PPO-PRD-0008',6,'SET',{requested:'2026-09-15',confirmed:'2026-09-15',value:'870.00'}),
      line('lin-000009','ful-000007','SYN-ERP-SO-NZ-000212-10','SYN-PPO-PRD-0004',4,'EA',{requested:'2026-09-22',confirmed:'2026-09-22',value:'2180.00'})
    ];

    const reservations=[{id:'res-000001',ref:'SYN-PPO-RSV-000001',line:'lin-000008',avLine:'avl-000010',qty:qty(6),unit:'SET',state:'Confirmed',
      sourceRef:'SYN-ERP-ALLOC-000740',requestedAt:'2026-09-14T09:00:00+10:00',outcomeAt:'2026-09-14T09:00:18+10:00',actor:people.robin,basis:'Historical fixture reservation retained from the earlier fictional shipment.',failure:null}];
    const picks=[{id:'pck-000001',ref:'SYN-PPO-PCK-000001',line:'lin-000008',reservation:'res-000001',warehouse:'SYN-WH-MEL',bin:'A-04-01',
      required:qty(6),picked:qty(6),staged:qty(6),serials:[],picker:people.alex,at:'2026-09-14T13:20:00+10:00',findings:[],substitution:null,version:1}];
    const dispatches=[{id:'dsp-000001',ref:'SYN-PPO-DSP-000001',company:'PPA-AU',order:'ful-000006',lines:[{line:'lin-000008',qty:qty(6),unit:'SET'}],
      address:'310 Sample Berry Road, Sampletown VIC 3999, Australia',receivingPoint:'Farm shed — eastern gate',contact:'Jordan Lee',contactRole:'Field production manager',
      instructions:'Eastern gate only.',carrier:'Collected by Powerplants vehicle PPA-04',packages:[{ref:'SYN-PPO-PKG-000001',description:'One pallet, six cartons'}],
      documents:[{kind:'Pick list',ref:'SYN-PPO-DOC-000001',at:'2026-09-14T13:05:00+10:00',by:people.alex},{kind:'Packing document',ref:'SYN-PPO-DOC-000002',at:'2026-09-14T16:00:00+10:00',by:people.alex}],
      plannedDate:'2026-09-15',movementAt:'2026-09-15T06:40:00+10:00',movementBy:people.alex,
      erp:{ref:'SYN-ERP-SHP-006180',state:'Confirmed',at:'2026-09-15T06:41:12+10:00',basis:'Simulated source confirmation'},version:1,preparedBy:people.robin,preparedAt:'2026-09-14T16:10:00+10:00'}];
    const deliveries=[{id:'del-000001',ref:'SYN-PPO-DEL-000001',dispatch:'dsp-000001',order:'ful-000006',
      lines:[{line:'lin-000008',dispatched:qty(6),received:qty(5),damaged:qty(1),missing:qty(0),unit:'SET'}],
      at:'2026-09-15T11:05:00+10:00',timezone:'Australia/Melbourne',address:'310 Sample Berry Road, Sampletown VIC 3999, Australia',receivingPoint:'Farm shed — eastern gate',
      receiver:{name:'Jordan Lee',role:'Field production manager'},outcome:'Partial',
      notes:'One carton was crushed in transit. The receiving contact accepted five sets and disputes the recorded quantity for the sixth.',
      evidence:[{id:'evi-000001',kind:'Photograph reference',ref:'SYN-PPO-EVI-000001',caption:'Illustrative reference for the crushed carton; not a photograph.'},{id:'evi-000002',kind:'Delivery document',ref:'SYN-PPO-DOC-000003',caption:'Signed delivery document reference retained with the capture.'}],
      findings:[{kind:'Damaged',qty:qty(1),unit:'SET',note:'One set damaged in transit; retained at the customer site pending disposition.'},{kind:'Disputed receipt',qty:qty(1),unit:'SET',note:'The receiving contact disputes that the sixth set was presented.'}],
      acknowledgement:null,author:people.sam,capturedBy:people.sam,syncState:'Synced',predecessor:null,correctionReason:null,superseded:false,version:1}];

    const commitments=[];
    for(const l of lines){
      commitments.push({id:'cmt-'+l.id+'-req',line:l.id,kind:'Requested',date:l.requested,version:1,actor:'Customer purchase order',at:'2026-09-11T00:00:00+10:00',reason:'Customer requested date recorded on the accepted order.',predecessor:null});
      commitments.push({id:'cmt-'+l.id+'-con',line:l.id,kind:'Confirmed',date:l.confirmed,version:1,actor:people.robin,at:'2026-09-11T00:05:00+10:00',reason:'Commitment confirmed to the customer at order acceptance.',predecessor:null});
      commitments.push({id:'cmt-'+l.id+'-exp',line:l.id,kind:'Expected',date:l.confirmed,version:1,actor:people.robin,at:'2026-09-16T06:35:00+10:00',reason:'Current expected date, equal to the confirmed commitment at this observation.',predecessor:null});
    }

    const exceptions=[{id:'exc-000001',ref:'SYN-PPO-EXC-000001',kind:'Damage, shortage or disputed receipt',order:'ful-000006',line:'lin-000008',
      scope:'One SET of SYN-PPO-PRD-0008 recorded damaged and disputed on delivery SYN-PPO-DEL-000001.',owner:people.casey,nextAction:'Decide the replacement or credit route and record the customer outcome.',
      due:'2026-09-18',dateNeeded:false,source:'SYN-PPO-DEL-000001',state:'Open',raisedBy:people.sam,raisedAt:'2026-09-15T11:20:00+10:00',
      impact:{commitments:['Confirmed commitment for SYN-ERP-SO-004440-10 is met for 5 SET; 1 SET remains outstanding.'],projects:[],service:[]},
      linked:{name:'Warranty & Customer Resolution — returns and supplier recovery',ref:'SYN-PPO-RMA-000012',target:'warranty'},resolution:[],version:1}];

    return {schema:'ppo-order-fulfilment/v1',version:0,asAt:TODAY,
      availability,receipts,orders,lines,reservations,picks,dispatches,deliveries,commitments,exceptions,
      substitutions:[],followUps:[],history:[],receiptsLedger:[],sourceState:{newSupply:false}};
  }

  /* ---------- Projections ------------------------------------------------------------ */
  const order=(s,id)=>s.orders.find(o=>o.id===id);
  const lineOf=(s,id)=>s.lines.find(l=>l.id===id);
  const avOf=(s,id)=>s.availability.find(a=>a.id===id);
  const item=ref=>items[ref];

  function usableEvidence(s,avLineId){
    const a=avOf(s,avLineId);if(!a)return null;
    if(a.completeness!=='Complete')return null;
    if(a.unitBasis!=='Declared')return null;
    if(a.anomaly)return null;
    return sum(s.receipts.filter(r=>r.avLine===avLineId&&r.inspection==='Usable'&&r.unit===a.unit).map(r=>r.qty));
  }
  function pickedForReservation(s,reservationId){return sum(s.picks.filter(p=>p.reservation===reservationId).map(p=>p.picked));}
  function openReservations(s,lineId){return s.reservations.filter(r=>r.line===lineId&&r.state==='Confirmed'&&pickedForReservation(s,r.id)<r.qty);}
  function confirmedAgainst(s,avLineId){return sum(s.reservations.filter(r=>r.avLine===avLineId&&r.state==='Confirmed').map(r=>r.qty));}
  function blockingAgainst(s,avLineId){return sum(s.reservations.filter(r=>r.avLine===avLineId&&['Pending','Unknown'].includes(r.state)).map(r=>r.qty));}
  function remainingUsable(s,avLineId){const u=usableEvidence(s,avLineId);return u===null?null:Math.max(0,u-confirmedAgainst(s,avLineId)-blockingAgainst(s,avLineId));}

  function totals(s,lineId){
    const l=lineOf(s,lineId);
    const res=s.reservations.filter(r=>r.line===lineId);
    const reserved=sum(res.filter(r=>r.state==='Confirmed').map(r=>r.qty));
    const pk=s.picks.filter(p=>p.line===lineId);
    const picked=sum(pk.map(p=>p.picked)),staged=sum(pk.map(p=>p.staged));
    const dsp=s.dispatches.filter(d=>d.movementAt&&d.lines.some(x=>x.line===lineId));
    const dispatched=sum(dsp.map(d=>sum(d.lines.filter(x=>x.line===lineId).map(x=>x.qty))));
    const planned=sum(s.dispatches.filter(d=>d.lines.some(x=>x.line===lineId)).map(d=>sum(d.lines.filter(x=>x.line===lineId).map(x=>x.qty))));
    const del=s.deliveries.filter(d=>!d.superseded&&d.lines.some(x=>x.line===lineId));
    const received=sum(del.map(d=>sum(d.lines.filter(x=>x.line===lineId).map(x=>x.received))));
    const damaged=sum(del.map(d=>sum(d.lines.filter(x=>x.line===lineId).map(x=>x.damaged))));
    const missing=sum(del.map(d=>sum(d.lines.filter(x=>x.line===lineId).map(x=>x.missing))));
    const outstanding=Math.max(0,l.ordered-received-l.cancelled);
    return {ordered:l.ordered,reserved,picked,staged,dispatched,planned,received,damaged,missing,cancelled:l.cancelled,
      outstanding,unreserved:Math.max(0,l.ordered-l.cancelled-reserved),
      inTransit:Math.max(0,dispatched-received-damaged-missing),toPick:Math.max(0,reserved-picked),unit:l.unit,
      pendingReservation:sum(res.filter(r=>['Pending','Unknown'].includes(r.state)).map(r=>r.qty)),
      unknownReservation:res.some(r=>r.state==='Unknown')};
  }

  function readiness(s,dispatchId){
    const d=s.dispatches.find(x=>x.id===dispatchId);const checks=[];
    const add=(id,label,ok,detail)=>checks.push({id,label,ok,detail});
    for(const dl of d.lines){
      const t=totals(s,dl.line);
      add('reserved:'+dl.line,'Confirmed reservation covers every planned dispatch quantity',t.reserved>=t.planned,`${amount(t.reserved,dl.unit)} confirmed against ${amount(t.planned,dl.unit)} planned across all consignments.`);
      add('staged:'+dl.line,'Picked and staged quantities cover every planned dispatch quantity',t.staged>=t.planned,`${amount(t.staged,dl.unit)} staged against ${amount(t.planned,dl.unit)} planned across all consignments.`);
      const open=s.picks.filter(p=>p.line===dl.line).flatMap(p=>p.findings.filter(f=>!f.reviewed));
      add('findings:'+dl.line,'No unreviewed short pick, damage or missing-item finding',open.length===0,open.length?`${open.length} finding(s) await review.`:'No open findings recorded.');
      const sub=s.substitutions.filter(x=>x.line===dl.line&&x.state==='Proposed');
      add('substitution:'+dl.line,'No substitution awaiting review',sub.length===0,sub.length?'A proposed substitution must be decided before dispatch.':'No substitution proposed.');
    }
    add('address','Delivery address and receiving point recorded',!!(d.address&&d.receivingPoint),d.receivingPoint||'Not recorded');
    add('contact','Receiving contact recorded',!!d.contact,d.contact||'Not recorded');
    add('carrier','Carrier or collection arrangement recorded',!!d.carrier,d.carrier||'Not recorded');
    add('packages','At least one package reference recorded',d.packages.length>0,d.packages.length?d.packages.map(p=>p.ref).join(', '):'Not recorded');
    return {checks,ready:checks.every(c=>c.ok),blockers:checks.filter(c=>!c.ok)};
  }

  /* Coordination condition. These are PPO coordination views. No equivalence to a source
     status is asserted; the source's own order state is not read by this design. */
  function condition(s,orderId){
    const ls=s.lines.filter(l=>l.order===orderId),t=ls.map(l=>totals(s,l.id));
    if(t.every(x=>x.outstanding===0))return 'Completed';
    if(s.exceptions.some(e=>e.order===orderId&&e.state!=='Resolved'))return 'Needs follow-up';
    if(t.some(x=>x.received>0)&&t.some(x=>x.outstanding>0))return 'Partially delivered';
    if(t.some(x=>x.inTransit>0))return 'Dispatched';
    if(s.dispatches.some(d=>d.order===orderId&&!d.movementAt))return 'In preparation';
    if(t.every(x=>x.unreserved===0))return 'Ready for picking';
    return 'Awaiting stock';
  }

  function blockers(s,orderId){
    const out=[];
    for(const l of s.lines.filter(l=>l.order===orderId)){
      const t=totals(s,l.id),it=item(l.item);
      if(t.outstanding===0)continue;
      const need=t.unreserved;
      const pool=s.availability.filter(a=>a.item===l.item&&a.company===order(s,orderId).company);
      const unknown=pool.some(a=>a.completeness!=='Complete');
      const unresolved=pool.some(a=>a.unitBasis!=='Declared'&&a.unit!==l.unit);
      const usable=sum(pool.map(a=>remainingUsable(s,a.id)||0));
      if(t.unknownReservation)out.push({kind:'Unknown source outcome',line:l.id,detail:'A reservation response was not received. Reconcile the original operation before another attempt.'});
      else if(unknown&&need>0)out.push({kind:'Stock information incomplete',line:l.id,detail:`Availability for ${it.code} is Partial or Unavailable at this observation. Unknown is not zero and not confirmed availability.`});
      else if(need>usable&&need>0)out.push({kind:'Insufficient evidenced usable stock',line:l.id,detail:`${amount(need,l.unit)} still required; ${amount(usable,l.unit)} evidenced usable and unreserved.`});
      if(unresolved)out.push({kind:'Unresolved unit basis',line:l.id,detail:`A source observation reports ${it.code} in a different unit with no accepted conversion. It is excluded from every total.`});
      if(pool.some(a=>a.held&&a.held>0))out.push({kind:'Quarantine or inspection hold',line:l.id,detail:`Held quantity exists for ${it.code} and cannot support availability.`});
      if(pool.some(a=>a.anomaly))out.push({kind:'Source value under investigation',line:l.id,detail:'A source observation is internally inconsistent and is retained unchanged for investigation.'});
      const sub=s.substitutions.filter(x=>x.line===l.id&&x.state==='Proposed');
      if(sub.length)out.push({kind:'Substitution awaiting review',line:l.id,detail:'A proposed substitution requires commercial and engineering review before dispatch.'});
      const finds=s.picks.filter(p=>p.line===l.id).flatMap(p=>p.findings.filter(f=>!f.reviewed));
      if(finds.length)out.push({kind:'Picking finding awaiting review',line:l.id,detail:finds.map(f=>`${f.kind} ${amount(f.qty,f.unit)}`).join('; ')});
    }
    return out;
  }

  function commitmentsOf(s,lineId){
    const pick=kind=>s.commitments.filter(c=>c.line===lineId&&c.kind===kind).sort((a,b)=>b.version-a.version)[0]||null;
    return {requested:pick('Requested'),confirmed:pick('Confirmed'),expected:pick('Expected'),
      history:s.commitments.filter(c=>c.line===lineId).sort((a,b)=>a.at.localeCompare(b.at))};
  }

  /* Permission and information boundary. Commercial values never enter a projection for a
     role without the commercial grant, so they cannot reach a search, count, snapshot,
     drawer or export for that role. */
  function project(s,role,company,orderId){
    const o=clone(order(s,orderId));
    const grant=roles[role];
    o.lines=s.lines.filter(l=>l.order===orderId).map(l=>{
      const c=clone(l),t=totals(s,l.id);
      c.itemRecord=item(l.item);c.totals=t;c.commitments=commitmentsOf(s,l.id);
      if(!grant.commercial){delete c.value;c.valueRestricted=true;}
      return c;
    });
    o.condition=condition(s,orderId);o.blockers=blockers(s,orderId);
    o.companyRecord=companies[o.company];
    o.dispatches=s.dispatches.filter(d=>d.order===orderId).map(d=>({...clone(d),readiness:readiness(s,d.id)}));
    o.deliveries=s.deliveries.filter(d=>d.order===orderId).map(clone);
    o.exceptions=s.exceptions.filter(e=>e.order===orderId).map(clone);
    o.substitutions=s.substitutions.filter(x=>o.lines.some(l=>l.id===x.line)).map(clone);
    o.followUps=s.followUps.filter(f=>f.order===orderId).map(clone);
    o.outstanding=o.lines.map(l=>({line:l.id,sourceLine:l.sourceLine,item:l.item,qty:l.totals.outstanding,unit:l.unit}));
    return o;
  }

  function visibleOrders(s,role,company){
    const grant=roles[role];
    must(grant,'Choose a valid preview role.');
    if(!grant.companies.includes(company))return [];
    return s.orders.filter(o=>o.company===company).map(o=>project(s,role,company,o.id));
  }

  function visibleAvailability(s,role,company){
    const grant=roles[role];
    if(!grant.companies.includes(company))return [];
    /* An empty warehouse grant is no scope at all, never an implicit grant over every
       warehouse in the company. */
    const scope=grant.warehouses;
    return s.availability.filter(a=>a.company===company&&scope.includes(a.warehouse)).map(a=>({...clone(a),
      itemRecord:item(a.item),usableEvidence:usableEvidence(s,a.id),confirmedReserved:confirmedAgainst(s,a.id),
      blocking:blockingAgainst(s,a.id),remainingUsable:remainingUsable(s,a.id),
      warehouseRecord:warehouses[a.warehouse],
      evidence:s.receipts.filter(r=>r.avLine===a.id).map(clone),
      reservations:s.reservations.filter(r=>r.avLine===a.id).map(clone)}));
  }

  function criteria(f){
    must(f&&typeof f.q==='string'&&f.q.length<=200,'Search is too long.');
    must(worklists.includes(f.worklist),'Invalid worklist view.');
    must(['','Overdue','Today','Upcoming','Date needed'].includes(f.due),'Invalid date filter.');
    return f;
  }
  const dueState=d=>!d?'Date needed':d<TODAY?'Overdue':d===TODAY?'Today':'Upcoming';

  function query(s,role,company,f){
    criteria(f);
    const q=f.q.trim().toLowerCase();
    return visibleOrders(s,role,company).filter(o=>{
      if(f.worklist!=='all'&&o.condition!==f.worklist)return false;
      if(f.customer&&o.organisation.ref!==f.customer)return false;
      if(f.site&&o.site.ref!==f.site)return false;
      if(f.owner&&o.owner!==f.owner)return false;
      if(f.warehouse&&!s.availability.some(a=>a.warehouse===f.warehouse&&o.lines.some(l=>l.item===a.item)))return false;
      if(f.due&&!o.lines.some(l=>dueState(l.commitments.expected?.date||null)===f.due))return false;
      if(!q)return true;
      const hay=[o.ref,o.erpOrder,o.erpAccount,o.customerPo,o.organisation.name,o.site.name,o.receivingPoint,o.owner,o.handover.ref,
        ...o.lines.map(l=>[l.sourceLine,l.item,l.itemRecord.code,l.itemRecord.name].join(' '))].join(' ').toLowerCase();
      return hay.includes(q);
    }).sort((a,b)=>(a.lines[0]?.commitments.expected?.date||'9999').localeCompare(b.lines[0]?.commitments.expected?.date||'9999')||a.ref.localeCompare(b.ref));
  }

  function summary(s,role,company,f){
    const rows=query(s,role,company,{...f,worklist:'all'});
    const count=name=>rows.filter(o=>o.condition===name).length;
    return [
      {id:'Awaiting stock',label:'Awaiting stock',value:count('Awaiting stock'),caption:'No confirmed reservation covers the outstanding quantity'},
      {id:'Ready for picking',label:'Ready for picking',value:count('Ready for picking'),caption:'Confirmed reservations cover the outstanding quantity'},
      {id:'Dispatched',label:'In transit',value:count('Dispatched')+count('In preparation'),caption:'Prepared or physically dispatched, not yet recorded as received'},
      {id:'Needs follow-up',label:'Needs follow-up',value:count('Needs follow-up')+count('Partially delivered'),caption:'An open exception or an outstanding quantity after a delivery'}
    ];
  }

  /* ---------- Validation ------------------------------------------------------------- */
  function validate(s){
    must(s?.schema==='ppo-order-fulfilment/v1'&&Number.isInteger(s.version)&&s.version>=0,'Unsupported Order Fulfilment session.');
    for(const n of ['availability','receipts','orders','lines','reservations','picks','dispatches','deliveries','commitments','exceptions','substitutions','followUps','history','receiptsLedger'])
      must(Array.isArray(s[n]),`Session collection ${n} is incomplete.`);
    for(const c of ['orders','lines','reservations','picks','dispatches','deliveries','exceptions','availability','substitutions'])
      must(new Set(s[c].map(x=>x.id)).size===s[c].length,`Duplicate ${c} identity is not valid.`);
    for(const l of s.lines){
      must(order(s,l.order),'Every order line must belong to an order.');
      must(item(l.item),'Every order line must reference a catalogue item.');
      must(l.unit===item(l.item).unit,'An order line unit must match its catalogue unit; no conversion is permitted.');
      must(Number.isInteger(l.ordered)&&l.ordered>0,'Ordered quantity must be a positive quantity.');
      date(l.requested);date(l.confirmed);
      const t=totals(s,l.id);
      must(t.reserved<=t.ordered,`Reserved quantity exceeds the ordered quantity on ${l.sourceLine}.`);
      must(t.picked<=t.reserved,`Picked quantity exceeds the confirmed reservation on ${l.sourceLine}.`);
      must(t.staged<=t.picked,`Staged quantity exceeds the picked quantity on ${l.sourceLine}.`);
      must(t.dispatched<=t.staged,`Dispatched quantity exceeds the staged quantity on ${l.sourceLine}.`);
      must(t.received+t.damaged+t.missing<=t.dispatched,`Delivery quantities exceed the dispatched quantity on ${l.sourceLine}.`);
      must(t.outstanding>=0,'Outstanding quantity cannot be negative.');
    }
    for(const a of s.availability){
      const u=usableEvidence(s,a.id);
      if(u!==null)must(confirmedAgainst(s,a.id)<=u,`Confirmed reservations exceed the evidenced usable quantity on ${a.ref}.`);
    }
    for(const r of s.reservations){
      must(['Proposed','Pending','Confirmed','Failed','Unknown'].includes(r.state),'Invalid reservation state.');
      must(lineOf(s,r.line)&&avOf(s,r.avLine),'A reservation must bind an order line to an availability observation.');
      must(r.unit===lineOf(s,r.line).unit&&r.unit===avOf(s,r.avLine).unit,'A reservation must use one declared unit on both sides.');
    }
    for(const d of s.deliveries){
      must(['Delivered','Partial','Failed attempt','Refused','Access denied'].includes(d.outcome),'Invalid delivery outcome.');
      if(d.predecessor)must(s.deliveries.some(x=>x.id===d.predecessor&&x.superseded),'A corrected delivery must retain a superseded predecessor.');
      must(['Captured locally','Queued','Synced','Failed','Conflict'].includes(d.syncState),'Invalid delivery synchronisation state.');
    }
    for(const e of s.exceptions)must(['Open','In review','Resolved'].includes(e.state),'Invalid exception state.');
    return s;
  }

  /* ---------- Commands --------------------------------------------------------------- */
  function command(s,c,role,company){
    validate(s);
    must(roles[role],'Choose a valid preview role.');
    must(roles[role].write,'This preview role is read-only.');
    must(roles[role].companies.includes(company),'This company is outside the current preview grants.');
    text(c.op,'Operation identity',6);
    const signature=JSON.stringify({type:c.type,payload:c.payload,role,company});
    const old=s.receiptsLedger.find(r=>r.op===c.op);
    if(old){must(old.signature===signature,'This operation identity belongs to different content.');return {state:s,recovered:true,receipt:old};}
    must(c.expectedVersion===s.version,'This session changed. Reopen the form; your current entries have been retained.');
    must(can(role,c.type),`The ${roles[role].title} role cannot perform this operation.`);

    const next=clone(s),x=c.payload||{},actor=roles[role].name,at=c.at||new Date().toISOString();
    let description='',resultId=null;
    const scoped=id=>{const o=order(next,id);must(o&&o.company===company,'This order is outside the current company scope.');return o;};
    const scopedLine=id=>{const l=lineOf(next,id);must(l,'This order line is unavailable.');scoped(l.order);must(l.version===x.lineVersion,'The order line changed. Refresh its snapshot before acting.');return l;};
    const seq=(prefix,list)=>prefix+String(list.length+1).padStart(6,'0');

    if(c.type==='reserve'){
      const l=scopedLine(x.line),a=avOf(next,x.avLine);
      must(a&&a.company===company,'Select an availability observation in this company.');
      must(roles[role].warehouses.includes(a.warehouse),'This warehouse is outside the current preview grants.');
      must(a.unit===l.unit,'The observation unit differs from the order line unit. No conversion basis exists, so this reservation is refused.');
      must(a.completeness==='Complete','Stock information is incomplete for this observation. Unknown availability is not zero and cannot support a reservation.');
      must(!a.anomaly,'This observation is under investigation because the source values are internally inconsistent. Resolve it before allocating.');
      const t=totals(next,l.id);
      must(!t.unknownReservation,'An earlier reservation response is unknown. Reconcile the original operation before another attempt.');
      const want=qty(x.qty,'Reservation quantity');
      must(want>0,'Enter a reservation quantity greater than zero.');
      must(want<=t.unreserved,`Only ${amount(t.unreserved,l.unit)} on this line is not already reserved.`);
      const remaining=remainingUsable(next,a.id);
      must(remaining!==null,'No evidenced usable quantity exists for this observation.');
      must(want<=remaining,`Only ${amount(remaining,a.unit)} is evidenced usable and unreserved on ${a.ref}. This request is refused rather than over-allocated.`);
      const id='res-'+c.op.slice(-8);
      next.reservations.push({id,ref:seq('SYN-PPO-RSV-',next.reservations),line:l.id,avLine:a.id,qty:want,unit:a.unit,
        state:x.simulate==='unknown'?'Unknown':x.simulate==='fail'?'Failed':'Confirmed',
        sourceRef:x.simulate?null:'SYN-ERP-ALLOC-'+String(770+next.reservations.length).padStart(6,'0'),
        requestedAt:at,outcomeAt:x.simulate==='unknown'?null:at,actor,
        basis:text(x.reason,'Reservation basis'),failure:x.simulate==='fail'?'Simulated source refusal: the source reported insufficient quantity.':null});
      resultId=id;
      description=x.simulate==='unknown'?`Reservation request submitted; source outcome unknown for ${amount(want,a.unit)}`
        :x.simulate==='fail'?`Reservation refused by the simulated source for ${amount(want,a.unit)}`
        :`Reservation confirmed for ${amount(want,a.unit)} against ${a.ref}`;
    }
    else if(c.type==='reconcileUnknown'){
      const r=next.reservations.find(r=>r.id===x.id);
      must(r&&r.state==='Unknown','Select a reservation with an unknown source outcome.');
      scoped(lineOf(next,r.line).order);
      const reason=text(x.reason,'Reconciliation basis');
      must(['Confirmed in source','Not found after evidenced search','Still unknown'].includes(x.outcome),'Choose how the original operation was reconciled.');
      if(x.outcome==='Confirmed in source'){r.state='Confirmed';r.sourceRef=text(x.sourceRef,'Source reference',4,80);r.outcomeAt=at;}
      else if(x.outcome==='Not found after evidenced search'){r.state='Failed';r.failure='Evidenced absence: '+text(x.sourceRef,'Search evidence reference',4,200);r.outcomeAt=at;}
      else {r.failure='Reconciliation attempted; the source outcome remains unknown. No further business effect is permitted on this line.';}
      r.basis+=' · Reconciled: '+reason;
      resultId=r.id;description='Original reservation operation reconciled: '+x.outcome;
    }
    else if(c.type==='refreshObservation'){
      must(x.scenario==='newSupply'||x.scenario==='retry','Choose a source refresh scenario.');
      if(x.scenario==='newSupply'){
        must(!next.sourceState.newSupply,'The later confirmed receipt is already reflected in this observation.');
        const a=avOf(next,'avl-000001');
        a.onHand+=qty(4);a.sourceAvailable+=qty(4);a.observedAt=at;a.version++;a.incoming=[];
        next.receipts.push({ref:'SYN-PPO-RCT-000318-10',avLine:'avl-000001',qty:qty(4),unit:'EA',inspection:'Usable',at,source:'Material Readiness r03 receipt and inspection of purchase order line SYN-ERP-PO-002210-10'});
        next.sourceState.newSupply=true;
        description='Refreshed observation records a later confirmed receipt of 4 EA as usable';
      }else{
        const a=avOf(next,'avl-000006');
        a.completeness='Complete';a.onHand=qty(1);a.sourceAvailable=qty(1);a.sourceReserved=qty(0);a.held=qty(0);
        a.availableBasis='Source available is reported net of source reservations';a.observedAt=at;a.version++;
        a.note='Refreshed after a partial result. The earlier partial observation time is retained in history.';
        next.receipts.push({ref:'SYN-PPO-RCT-000315-10',avLine:'avl-000006',qty:qty(1),unit:'EA',inspection:'Usable',at,source:'Material Readiness r03 receipt and inspection'});
        description='Partial observation refreshed; quantities are now Complete at this observation time';
      }
      resultId=x.scenario;
    }
    else if(c.type==='pick'){
      const l=scopedLine(x.line),r=next.reservations.find(r=>r.id===x.reservation);
      must(r&&r.line===l.id&&r.state==='Confirmed','Picking requires a confirmed reservation on this line.');
      must(roles[role].warehouses.includes(r.avLine?avOf(next,r.avLine).warehouse:''),'This warehouse is outside the current preview grants.');
      const picked=qty(x.picked,'Picked quantity');
      const outstandingOnReservation=r.qty-pickedForReservation(next,r.id);
      must(outstandingOnReservation>0,'This reservation is already fully picked.');
      must(picked<=outstandingOnReservation,'Picked quantity exceeds the confirmed reservation for this line.');
      const findings=[];
      if(picked<outstandingOnReservation){
        must(x.findingKind&&['Short pick','Damaged stock','Missing item'].includes(x.findingKind),'A picked quantity below the reservation needs a recorded finding.');
        findings.push({kind:x.findingKind,qty:outstandingOnReservation-picked,unit:l.unit,note:text(x.findingNote,'Finding note'),reviewed:false,at,actor});
      }
      const id='pck-'+c.op.slice(-8);
      next.picks.push({id,ref:seq('SYN-PPO-PCK-',next.picks),line:l.id,reservation:r.id,warehouse:avOf(next,r.avLine).warehouse,
        bin:avOf(next,r.avLine).bin,required:r.qty,picked,staged:0,serials:x.serials?String(x.serials).split(/[,\n]/).map(v=>v.trim()).filter(Boolean):[],
        picker:actor,at,findings,substitution:null,version:1});
      resultId=id;
      description=`Picked ${amount(picked,l.unit)}${findings.length?` with a recorded ${findings[0].kind.toLowerCase()} of ${amount(findings[0].qty,l.unit)}`:''}`;
    }
    else if(c.type==='stage'){
      const p=next.picks.find(p=>p.id===x.id);
      must(p,'Select a recorded pick.');scoped(lineOf(next,p.line).order);
      must(p.version===x.pickVersion,'The pick changed. Refresh its snapshot before acting.');
      const staged=qty(x.staged,'Staged quantity');
      must(staged<=p.picked,'Staged quantity exceeds the picked quantity. Staging is a separate physical observation, not a repeat of the pick.');
      p.staged=staged;p.version++;p.stagedAt=at;p.stagedBy=actor;
      resultId=p.id;description=`Staged ${amount(staged,lineOf(next,p.line).unit)} for dispatch preparation`;
    }
    else if(c.type==='reviewFinding'){
      const p=next.picks.find(p=>p.id===x.id);
      must(p,'Select a recorded pick.');scoped(lineOf(next,p.line).order);
      must(p.version===x.pickVersion,'The pick changed. Refresh its snapshot before acting.');
      const f=p.findings[Number(x.index)];
      must(f&&!f.reviewed,'Select an unreviewed picking finding.');
      must(['Accepted as short supply','Returned to the warehouse for a recount','Quarantined pending disposition'].includes(x.outcome),'Choose a review outcome for this finding.');
      f.reviewed=true;f.reviewedBy=actor;f.reviewedAt=at;f.outcome=x.outcome;f.reviewNote=text(x.note,'Review note');
      p.version++;resultId=p.id;
      description=`Picking finding reviewed: ${x.outcome}. The recorded picked quantity is unchanged by this review.`;
    }
    else if(c.type==='proposeSubstitution'){
      const l=scopedLine(x.line);
      must(!next.substitutions.some(y=>y.line===l.id&&y.state==='Proposed'),'A substitution proposal is already awaiting review on this line.');
      must(items[x.proposed],'Select a catalogue item for the proposed substitution.');
      must(x.proposed!==l.item,'The proposed item is the accepted item.');
      must(items[x.proposed].unit===l.unit,'The proposed item uses a different unit. No conversion basis exists, so this proposal is refused.');
      const id='sub-'+c.op.slice(-8);
      next.substitutions.push({id,ref:seq('SYN-PPO-SUB-',next.substitutions),line:l.id,accepted:l.item,proposed:x.proposed,
        reason:text(x.reason,'Substitution reason'),state:'Proposed',proposedBy:actor,at,decidedBy:null,decidedAt:null,note:null,version:1});
      resultId=id;
      description='Substitution proposed for review. The accepted item, price, quantity and technical scope are unchanged by this proposal.';
    }
    else if(c.type==='decideSubstitution'){
      const sub=next.substitutions.find(y=>y.id===x.id);
      must(sub&&sub.state==='Proposed','Select a substitution awaiting review.');
      scoped(lineOf(next,sub.line).order);
      must(sub.version===x.substitutionVersion,'The substitution changed. Reopen it before deciding.');
      must(['Approved','Rejected'].includes(x.decision),'Choose whether the substitution is approved or rejected.');
      must(x.engineering===true,'Confirm that the engineering compatibility position has been obtained from its own source.');
      must(x.commercial===true,'Confirm that the commercial position on price and scope has been obtained from its own source.');
      sub.state=x.decision;sub.decidedBy=actor;sub.decidedAt=at;sub.note=text(x.reason,'Review basis');sub.version++;
      resultId=sub.id;
      description=x.decision==='Approved'
        ?'Substitution approved under review. A revised accepted scope must still be issued through Estimating and the order amended in the source before any dispatch.'
        :'Substitution rejected. The accepted item remains the only dispatchable scope.';
    }
    else if(c.type==='prepareDispatch'){
      const o=scoped(x.order);
      must(Array.isArray(x.lines)&&x.lines.length,'Select at least one order line for this dispatch.');
      const dl=[];
      for(const row of x.lines){
        const l=lineOf(next,row.line);must(l&&l.order===o.id,'Select lines from this order only.');
        const t=totals(next,l.id),want=qty(row.qty,'Dispatch quantity');
        must(want>0,'Enter a dispatch quantity greater than zero.');
        must(want<=t.staged-t.planned,`Only ${amount(Math.max(0,t.staged-t.planned),l.unit)} is staged and not already committed to a prepared dispatch on ${l.sourceLine}.`);
        dl.push({line:l.id,qty:want,unit:l.unit});
      }
      const id='dsp-'+c.op.slice(-8);
      next.dispatches.push({id,ref:seq('SYN-PPO-DSP-',next.dispatches),company,order:o.id,lines:dl,
        address:text(x.address,'Delivery address',8,300),receivingPoint:text(x.receivingPoint,'Receiving point',3,160),
        contact:text(x.contact,'Receiving contact',3,120),contactRole:text(x.contactRole,'Contact role',3,120),
        instructions:x.instructions?text(x.instructions,'Delivery instructions',0,600):'Not recorded',
        carrier:text(x.carrier,'Carrier or collection arrangement',3,160),
        packages:String(x.packages||'').split(/[,\n]/).map(v=>v.trim()).filter(Boolean).map((ref,i)=>({ref,description:'Package '+(i+1)})),
        documents:[],plannedDate:date(x.plannedDate),movementAt:null,movementBy:null,
        erp:{ref:null,state:'Not submitted',at:null,basis:'No source shipment transaction has been submitted.'},
        preparedBy:actor,preparedAt:at,version:1});
      resultId=id;description='Dispatch prepared. No goods have moved and no source shipment transaction exists.';
    }
    else if(c.type==='issueDocuments'){
      const d=next.dispatches.find(d=>d.id===x.id);
      must(d&&d.company===company,'Select a prepared dispatch in this company.');
      must(['Pick list','Packing document','Delivery document'].includes(x.kind),'Choose a document to issue.');
      d.documents.push({kind:x.kind,ref:'SYN-PPO-DOC-'+String(next.dispatches.reduce((n,y)=>n+y.documents.length,0)+1).padStart(6,'0'),at,by:actor});
      d.version++;resultId=d.id;
      description=`${x.kind} issued. Issuing a document records evidence only; it does not move goods or mark the order dispatched.`;
    }
    else if(c.type==='recordMovement'){
      const d=next.dispatches.find(d=>d.id===x.id);
      must(d&&d.company===company,'Select a prepared dispatch in this company.');
      must(!d.movementAt,'This physical movement is already recorded.');
      must(d.version===x.dispatchVersion,'The dispatch changed. Refresh its snapshot before acting.');
      const r=readiness(next,d.id);
      must(r.ready,'Dispatch readiness is not met: '+r.blockers.map(b=>b.label).join('; '));
      must(x.confirm===true,'Confirm that the listed lines and quantities physically left the store.');
      d.movementAt=at;d.movementBy=actor;d.version++;
      resultId=d.id;description='Physical dispatch recorded. The source shipment transaction is still separate and unconfirmed.';
    }
    else if(c.type==='recordShipmentOutcome'){
      const d=next.dispatches.find(d=>d.id===x.id);
      must(d&&d.company===company,'Select a dispatch in this company.');
      must(d.movementAt,'Record the physical movement before recording a source shipment outcome.');
      must(['Confirmed','Failed','Unknown'].includes(x.outcome),'Choose the observed source outcome.');
      must(d.erp.state!=='Confirmed','A confirmed source shipment reference is already recorded.');
      d.erp={ref:x.outcome==='Confirmed'?text(x.sourceRef,'Source shipment reference',4,80):null,state:x.outcome,at,
        basis:text(x.reason,'Observation basis')};
      d.version++;resultId=d.id;
      description=`Source shipment outcome recorded as ${x.outcome}. Physical evidence is unchanged by this observation.`;
    }
    else if(c.type==='captureDelivery'){
      const d=next.dispatches.find(d=>d.id===x.dispatch);
      must(d&&d.company===company,'Select a dispatched consignment in this company.');
      must(d.movementAt,'Delivery capture requires a recorded physical dispatch.');
      must(['Delivered','Partial','Failed attempt','Refused','Access denied'].includes(x.outcome),'Choose a delivery outcome.');
      const failed=['Failed attempt','Refused','Access denied'].includes(x.outcome);
      const dlines=[];
      for(const dl of d.lines){
        const row=(x.lines||[]).find(r=>r.line===dl.line)||{};
        const received=failed?0:qty(row.received??0,'Received quantity');
        const damaged=failed?0:qty(row.damaged??0,'Damaged quantity');
        const missing=failed?0:qty(row.missing??0,'Missing quantity');
        const prior=sum(next.deliveries.filter(y=>!y.superseded&&y.dispatch===d.id).flatMap(y=>y.lines.filter(z=>z.line===dl.line).map(z=>z.received+z.damaged+z.missing)));
        must(received+damaged+missing+prior<=dl.qty,'Recorded delivery quantities exceed the quantity dispatched on this consignment.');
        dlines.push({line:dl.line,dispatched:dl.qty,received,damaged,missing,unit:dl.unit});
      }
      must(failed||dlines.some(l=>l.received+l.damaged+l.missing>0),'Record at least one quantity, or choose a failed, refused or access-denied outcome.');
      const findings=[];
      for(const l of dlines){
        if(l.damaged>0)findings.push({kind:'Damaged',qty:l.damaged,unit:l.unit,note:text(x.findingNote,'Finding note')});
        if(l.missing>0)findings.push({kind:'Missing quantity',qty:l.missing,unit:l.unit,note:text(x.findingNote,'Finding note')});
      }
      if(failed)findings.push({kind:x.outcome,qty:0,unit:d.lines[0].unit,note:text(x.findingNote,'Finding note')});
      const id='del-'+c.op.slice(-8);
      next.deliveries.push({id,ref:seq('SYN-PPO-DEL-',next.deliveries),dispatch:d.id,order:d.order,lines:dlines,
        at,timezone:order(next,d.order).site.timezone,address:d.address,
        receivingPoint:failed?'Not reached':text(x.receivingPoint||d.receivingPoint,'Actual receiving point',3,160),
        receiver:failed?{name:'Not recorded',role:'Not recorded'}:{name:text(x.receiverName,'Receiving person',2,120),role:text(x.receiverRole,'Receiving person role',2,120)},
        outcome:x.outcome,notes:text(x.notes,'Delivery notes'),
        evidence:String(x.evidence||'').split(/[,\n]/).map(v=>v.trim()).filter(Boolean).map((ref,i)=>({id:'evi-'+c.op.slice(-8)+'-'+i,kind:'Evidence reference',ref,caption:'Labelled synthetic evidence reference recorded at capture.'})),
        findings,acknowledgement:null,author:actor,capturedBy:actor,
        syncState:x.syncState==='queued'?'Queued':'Captured locally',predecessor:null,correctionReason:null,superseded:false,version:1});
      resultId=id;
      description=failed?`Delivery attempt recorded as ${x.outcome}; no quantity has been received`:`Delivery evidence captured for ${dlines.map(l=>amount(l.received,l.unit)).join(', ')} received`;
    }
    else if(c.type==='acknowledgeDelivery'){
      const d=next.deliveries.find(d=>d.id===x.id);
      must(d&&!d.superseded,'Select a current delivery record.');
      scoped(d.order);
      must(!['Failed attempt','Refused','Access denied'].includes(d.outcome),'A failed, refused or access-denied attempt cannot carry a delivery acknowledgement.');
      must(!d.acknowledgement,'This delivery already carries an acknowledgement.');
      must(x.confirm===true,'Confirm that the acknowledgement covers only this delivery and these quantities.');
      d.acknowledgement={by:text(x.by,'Acknowledging person',2,120),role:text(x.role,'Acknowledging person role',2,120),at,
        scope:`Acknowledges receipt of the quantities recorded on ${d.ref} only.`,
        quantities:d.lines.map(l=>({line:l.line,received:l.received,unit:l.unit})),
        excludes:'This acknowledgement is not acceptance of installation quality, completion of a project, resolution of a service case, or approval to invoice or pay.'};
      d.version++;resultId=d.id;
      description='Customer acknowledgement recorded for this delivery and these quantities only';
    }
    else if(c.type==='correctDelivery'){
      const d=next.deliveries.find(d=>d.id===x.id);
      must(d&&!d.superseded,'Select a current delivery record.');
      scoped(d.order);
      must(d.version===x.deliveryVersion,'The delivery record changed. Reopen it before correcting.');
      const reason=text(x.reason,'Correction reason');
      const dispatch=next.dispatches.find(y=>y.id===d.dispatch);
      const dlines=d.lines.map(l=>{
        const row=(x.lines||[]).find(r=>r.line===l.line)||{};
        const received=qty(row.received??show(l.received),'Corrected received quantity');
        const damaged=qty(row.damaged??show(l.damaged),'Corrected damaged quantity');
        const missing=qty(row.missing??show(l.missing),'Corrected missing quantity');
        const other=sum(next.deliveries.filter(y=>!y.superseded&&y.id!==d.id&&y.dispatch===d.dispatch).flatMap(y=>y.lines.filter(z=>z.line===l.line).map(z=>z.received+z.damaged+z.missing)));
        const dq=dispatch.lines.find(z=>z.line===l.line).qty;
        must(received+damaged+missing+other<=dq,'Corrected quantities exceed the quantity dispatched on this consignment.');
        return {...l,received,damaged,missing};
      });
      d.superseded=true;
      const id='del-'+c.op.slice(-8);
      next.deliveries.push({...clone(d),id,ref:seq('SYN-PPO-DEL-',next.deliveries),lines:dlines,at,author:actor,capturedBy:d.capturedBy,
        predecessor:d.id,correctionReason:reason,superseded:false,version:1,acknowledgement:null,
        notes:d.notes+' · Corrected: '+reason,syncState:'Captured locally'});
      resultId=id;
      description='Correction recorded as a successor. The original capture, author and time are retained and excluded from totals.';
    }
    else if(c.type==='raiseException'){
      const o=scoped(x.order);
      const l=x.line?lineOf(next,x.line):null;
      must(!x.line||l?.order===o.id,'Select a line from this order.');
      const id='exc-'+c.op.slice(-8);
      must(['Insufficient or unavailable stock','Competing reservations','Quarantine or inspection hold','Short pick or substitution review',
        'Supplier or dispatch delay','Failed or partial delivery','Damage, shortage or disputed receipt','Unresolved source mapping',
        'Unknown source outcome','Changed customer commitment'].includes(x.kind),'Choose an exception category.');
      const key=[x.kind,o.id,x.line||'order'].join('|');
      const existing=next.exceptions.find(e=>e.key===key&&e.state!=='Resolved');
      must(!existing,`An open ${x.kind.toLowerCase()} exception already exists for this scope (${existing?.ref||''}). Add resolution evidence to it rather than creating a second obligation.`);
      next.exceptions.push({id,ref:seq('SYN-PPO-EXC-',next.exceptions),key,kind:x.kind,order:o.id,line:x.line||null,
        scope:text(x.scope,'Affected scope'),owner:x.owner||actor,nextAction:text(x.nextAction,'Next action'),
        due:x.dateNeeded?null:date(x.due),dateNeeded:!!x.dateNeeded,source:text(x.source,'Source record reference',4,120),
        state:'Open',raisedBy:actor,raisedAt:at,impact:{commitments:x.impactCommitments?[text(x.impactCommitments,'Commitment impact',0,600)]:[],projects:[],service:[]},
        linked:null,resolution:[],version:1});
      resultId=id;description='Exception raised with an owner, next action and retained source reference';
    }
    else if(c.type==='resolveException'){
      const e=next.exceptions.find(e=>e.id===x.id);
      must(e,'Select an exception.');scoped(e.order);
      must(e.version===x.exceptionVersion,'The exception changed. Reopen it before recording an outcome.');
      must(['In review','Resolved'].includes(x.state),'Choose whether the exception moves to review or is resolved.');
      e.resolution.push({at,actor,note:text(x.note,'Resolution evidence'),evidence:text(x.evidence,'Evidence reference',4,160),state:x.state});
      e.state=x.state;e.version++;resultId=e.id;
      description=x.state==='Resolved'?'Exception resolved with retained evidence':'Exception moved to review with retained evidence';
    }
    else if(c.type==='linkRecovery'){
      const e=next.exceptions.find(e=>e.id===x.id);
      must(e,'Select an exception.');scoped(e.order);
      must(['warranty','returns','supplier','credit'].includes(x.target),'Choose an existing workflow to route this matter to.');
      e.linked={name:{warranty:'Warranty & Customer Resolution',returns:'Returns and return authorisation (SC-08)',supplier:'Supplier claim and recovery',credit:'Finance credit and reconciliation'}[x.target],
        ref:text(x.ref,'External record reference',4,80),target:x.target,at,by:actor,
        note:'The decision and outcome remain in that workflow. This link records the routing only.'};
      e.version++;resultId=e.id;description='Matter routed to its existing workflow; its decision and outcome remain there';
    }
    else if(c.type==='expectedCommitment'||c.type==='confirmedCommitment'){
      const l=scopedLine(x.line),kind=c.type==='expectedCommitment'?'Expected':'Confirmed';
      const current=commitmentsOf(next,l.id)[kind.toLowerCase()];
      const when=date(x.date);
      must(when!==current.date,'The selected date matches the current commitment.');
      const reason=text(x.reason,'Change reason');
      if(kind==='Confirmed'){
        must(x.customerFollowUp===true,'A changed confirmed commitment needs an accountable customer follow-up.');
        must(x.acknowledgeImpact===true,'Confirm that this change does not reschedule a visit or amend a project plan.');
      }
      next.commitments.push({id:'cmt-'+c.op.slice(-8),line:l.id,kind,date:when,version:current.version+1,actor,at,reason,predecessor:current.id});
      l.version++;
      if(kind==='Confirmed'){
        const key=['Changed customer commitment',l.order,l.id].join('|');
        if(!next.exceptions.some(e=>e.key===key&&e.state!=='Resolved')){
          next.exceptions.push({id:'exc-'+c.op.slice(-8),ref:seq('SYN-PPO-EXC-',next.exceptions),key,kind:'Changed customer commitment',
            order:l.order,line:l.id,scope:`Confirmed commitment for ${l.sourceLine} moved from ${current.date} to ${when}.`,
            owner:actor,nextAction:'Contact the customer, record the response and review the effect on linked Project and Service work.',
            due:when,dateNeeded:false,source:'SYN-PPO-CMT-'+l.sourceLine,state:'Open',raisedBy:actor,raisedAt:at,
            impact:{commitments:[`Earlier confirmed commitment ${current.date} is retained unchanged as version ${current.version}.`],
              projects:l.demandLink?.kind==='Project'?[`${l.demandLink.ref} demand is affected. The project plan is not amended by this change.`]:[],
              service:l.demandLink?.kind==='Service'?[`${l.demandLink.ref} work is affected. No visit is rescheduled by this change.`]:[]},
            linked:null,resolution:[],version:1});
        }
      }
      resultId=l.id;
      description=`${kind} commitment for ${l.sourceLine} recorded as ${when}; the earlier commitment is retained as a separate version`;
    }
    else if(c.type==='followUp'){
      const o=scoped(x.order);
      const key=text(x.key,'Impact identity',4,160);
      const existing=next.followUps.find(f=>f.key===key&&f.state==='Open');
      if(existing){resultId=existing.id;description='An open follow-up already exists for this impact identity; no duplicate obligation was created.';}
      else{
        const id='fup-'+c.op.slice(-8);
        next.followUps.push({id,ref:seq('SYN-PPO-ACT-',next.followUps),key,order:o.id,line:x.line||null,
          title:text(x.title,'Follow-up title',4,160),detail:text(x.detail,'Follow-up detail'),owner:x.owner||actor,
          due:x.dateNeeded?null:date(x.due),dateNeeded:!!x.dateNeeded,state:'Open',createdBy:actor,at,
          surface:'Activities and My Work'});
        resultId=id;description='Follow-up created against the existing Activities and My Work pattern';
      }
    }
    else throw Error('Unsupported Order Fulfilment command.');

    next.version++;
    next.history.push({actor,role,company,at,type:c.type,description,source:resultId});
    const receipt={op:c.op,signature,version:next.version,at,resultId,description};
    next.receiptsLedger.push(receipt);
    validate(next);
    return {state:next,recovered:false,receipt};
  }

  root.OF_MODEL={TODAY,SCALE,companies,warehouses,items,people,roles,views,worklists,filters,criteria,dueState,usableEvidenceOf:usableEvidence,
    seed,clone,validate,command,qty,show,amount,sum,
    totals,readiness,condition,blockers,commitmentsOf,usableEvidence,confirmedAgainst,remainingUsable,pickedForReservation,openReservations,
    project,visibleOrders,visibleAvailability,query,summary,can,order,lineOf,avOf,item};
})(globalThis);
