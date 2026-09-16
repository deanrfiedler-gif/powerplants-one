/* CS-01 Customer 360 — standalone synthetic design model.
   No application API, no ERP endpoint and no server authority exists here.
   Every identity, address, person, order, amount and document below is fictional. */
(() => {
'use strict';

/* ---------------------------------------------------------------- basics */

const TODAY = '2026-09-16';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* Australian prose convention: dd Month yyyy. ISO 8601 is retained in data and filenames. */
function formatDate(iso){
 if(!iso) return null;
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
 if(!m) return null;
 return `${Number(m[3])} ${MONTHS[Number(m[2])-1]} ${m[1]}`;
}
function formatDateTime(iso){
 if(!iso) return null;
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso);
 if(!m) return null;
 return `${formatDate(iso.slice(0,10))}, ${m[4]}:${m[5]} AEST`;
}
function daysBetween(fromIso,toIso){
 return Math.round((Date.parse(toIso+'T00:00:00Z')-Date.parse(fromIso+'T00:00:00Z'))/86400000);
}
/* Age of an observation in whole hours, used only to describe freshness. */
function hoursSince(iso,nowIso){
 if(!iso) return null;
 return Math.floor((Date.parse(nowIso+':00Z')-Date.parse(iso+':00Z'))/3600000);
}
/* Amounts carry their currency. Two-decimal fixture basis; no tax rule is implied. */
function money(amount,currency){
 if(amount===null||amount===undefined) return null;
 return new Intl.NumberFormat('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount)+' '+currency;
}
function quantity(value,unit){
 if(value===null||value===undefined) return null;
 return new Intl.NumberFormat('en-AU',{maximumFractionDigits:3}).format(value)+(unit?' '+unit:'');
}

/* ------------------------------------------------------------ identities */

const ORG = {willowbank:'SYN-PPO-ORG-000101', rothwell:'SYN-PPO-ORG-000102'};

const organisations=[
 {id:ORG.willowbank,name:'Willowbank Horticulture',trading:'Willowbank Horticulture Pty Ltd (synthetic)',abn:'ABN 11 222 333 444 (fictional)',
  owner:'Priya Raman',ownerRole:'Relationship owner · Sales',serviceOwner:'Alex Moreau',serviceOwnerRole:'Service coordinator',
  since:'2019-03-11',segment:'Protected cropping — propagation and field',
  summary:'Two addressed sites, one shared irrigation asset and an active upgrade project.'},
 {id:ORG.rothwell,name:'Rothwell Glasshouse Group',trading:'Rothwell Glasshouse Group Pty Ltd (synthetic)',abn:'ABN 55 666 777 888 (fictional)',
  owner:'Priya Raman',ownerRole:'Relationship owner · Sales',serviceOwner:'Alex Moreau',serviceOwnerRole:'Service coordinator',
  since:'2024-08-02',segment:'Protected cropping — glasshouse tomato',
  summary:'One addressed site. Held here only to prove that switching customer context retains nothing from the other customer.'}
];

const people=[
 {id:'SYN-PPO-PER-000301',org:ORG.willowbank,name:'Jordan Lee',role:'Nursery manager',responsibility:'Operational contact for the nursery site',email:'jordan.lee@willowbank.example',phone:'+61 3 5550 0101',sites:['SYN-PPO-SITE-000201'],primary:true},
 {id:'SYN-PPO-PER-000302',org:ORG.willowbank,name:'Casey Taylor',role:'Production supervisor',responsibility:'Field production access and crop windows',email:'casey.taylor@willowbank.example',phone:'+61 3 5550 0102',sites:['SYN-PPO-SITE-000202'],primary:false},
 {id:'SYN-PPO-PER-000303',org:ORG.willowbank,name:'Robin Alvarez',role:'Accounts payable',responsibility:'Invoices, purchase orders and remittances',email:'accounts@willowbank.example',phone:'+61 3 5550 0110',sites:[],primary:false,finance:true},
 {id:'SYN-PPO-PER-000304',org:ORG.willowbank,name:'Sam Okafor',role:'Operations director',responsibility:'Commercial approval for projects and variations',email:'sam.okafor@willowbank.example',phone:'+61 3 5550 0100',sites:['SYN-PPO-SITE-000201','SYN-PPO-SITE-000202'],primary:false},
 {id:'SYN-PPO-PER-000311',org:ORG.rothwell,name:'Morgan Deng',role:'Site engineer',responsibility:'Glasshouse systems',email:'morgan.deng@rothwell.example',phone:'+61 7 5550 0301',sites:['SYN-PPO-SITE-000211'],primary:true}
];

/* Sites and growing areas are reused from the Customers, Sites & Growing Areas r03 workspace,
   which remains the owning design for the full hierarchy, forms and history. */
const sites=[
 {id:'SYN-PPO-SITE-000201',org:ORG.willowbank,name:'Willowbank Nursery & Propagation',address:'12 Demonstration Road, Sampletown VIC 3999, Australia (fictional)',timezone:'Australia/Melbourne',operator:'Willowbank Horticulture',propertyOwner:'Willowbank Horticulture',billingParty:'Willowbank Horticulture',erpAccount:'ACC-AU-WILLOW001'},
 {id:'SYN-PPO-SITE-000202',org:ORG.willowbank,name:'Willowbank Field Production',address:'84 Example Orchard Lane, Sampletown VIC 3999, Australia (fictional)',timezone:'Australia/Melbourne',operator:'Willowbank Horticulture',propertyOwner:'Hadley Pastoral Trust (synthetic)',billingParty:'Willowbank Horticulture',erpAccount:'ACC-AU-WILLOW001'},
 {id:'SYN-PPO-SITE-000211',org:ORG.rothwell,name:'Rothwell Glasshouse — Northbank',address:'6 Synthetic Grove, Examplefield QLD 4999, Australia (fictional)',timezone:'Australia/Brisbane',operator:'Rothwell Glasshouse Group',propertyOwner:'Rothwell Glasshouse Group',billingParty:'Rothwell Glasshouse Group',erpAccount:'ACC-AU-ROTH004'}
];

const areas=[
 {id:'SYN-PPO-FAC-000401',site:'SYN-PPO-SITE-000201',name:'Greenhouse 01',type:'Greenhouse',use:'Production',parent:null},
 {id:'SYN-PPO-FAC-000402',site:'SYN-PPO-SITE-000201',name:'Tunnel 01',type:'Polytunnel',use:'Production',parent:null},
 {id:'SYN-PPO-FAC-000403',site:'SYN-PPO-SITE-000201',name:'Propagation House 01',type:'Greenhouse',use:'Propagation',parent:null},
 {id:'SYN-PPO-FAC-000404',site:'SYN-PPO-SITE-000201',name:'Propagation Bay A',type:'Bay',use:'Propagation',parent:'SYN-PPO-FAC-000403'},
 {id:'SYN-PPO-FAC-000405',site:'SYN-PPO-SITE-000201',name:'Pack Room 01',type:'Building',use:'Non-growing',parent:null},
 {id:'SYN-PPO-FAC-000406',site:'SYN-PPO-SITE-000201',name:'Irrigation Shed 01',type:'Building',use:'Non-growing',parent:null},
 {id:'SYN-PPO-FAC-000407',site:'SYN-PPO-SITE-000202',name:'Irrigation Block A',type:'Field',use:'Production',parent:null},
 {id:'SYN-PPO-FAC-000408',site:'SYN-PPO-SITE-000202',name:'Irrigation Block B',type:'Field',use:'Production',parent:null},
 {id:'SYN-PPO-FAC-000411',site:'SYN-PPO-SITE-000211',name:'Glasshouse Bay 1',type:'Greenhouse',use:'Production',parent:null}
];

const assets=[
 {id:'SYN-PPO-AST-000501',org:ORG.willowbank,ref:'SYN-PPO-AST-000501',name:'Irrigation pump — Model SX-40 (synthetic)',site:'SYN-PPO-SITE-000201',
  installed:'SYN-PPO-FAC-000406',served:['SYN-PPO-FAC-000401','SYN-PPO-FAC-000402','SYN-PPO-FAC-000403'],
  serial:'SYN-SER-40122 (fictional)',commissioned:'2021-06-18',warrantyUntil:'2026-06-18',warrantyState:'Expired'},
 {id:'SYN-PPO-AST-000502',org:ORG.willowbank,ref:'SYN-PPO-AST-000502',name:'Climate controller — Model CC-12 (synthetic)',site:'SYN-PPO-SITE-000201',
  installed:'SYN-PPO-FAC-000401',served:['SYN-PPO-FAC-000401'],
  serial:'SYN-SER-88431 (fictional)',commissioned:'2025-11-04',warrantyUntil:'2027-11-04',warrantyState:'In warranty'},
 {id:'SYN-PPO-AST-000503',org:ORG.willowbank,ref:'SYN-PPO-AST-000503',name:'Field irrigation controller — Model FC-6 (synthetic)',site:'SYN-PPO-SITE-000202',
  installed:'SYN-PPO-FAC-000407',served:['SYN-PPO-FAC-000407','SYN-PPO-FAC-000408'],
  serial:'SYN-SER-51900 (fictional)',commissioned:'2022-02-09',warrantyUntil:'2024-02-09',warrantyState:'Expired'},
 {id:'SYN-PPO-AST-000511',org:ORG.rothwell,ref:'SYN-PPO-AST-000511',name:'Glasshouse vent drive — Model VD-3 (synthetic)',site:'SYN-PPO-SITE-000211',
  installed:'SYN-PPO-FAC-000411',served:['SYN-PPO-FAC-000411'],
  serial:'SYN-SER-22007 (fictional)',commissioned:'2025-03-30',warrantyUntil:'2027-03-30',warrantyState:'In warranty'}
];

/* -------------------------------------------------- ERP identity context */

/* One organisation can relate to several company-specific ERP accounts.
   Internal identity, provider, company/entity, account code and effective dates stay separate.
   No customer or order is ever matched on a name or a displayed order number alone. */
const erpConnection={id:'SYN-MYOB-CONN-01',provider:'MYOB Acumatica',mode:'Simulated adapter — no live endpoint, credential or tenant exists',
 endpoint:'https://{approved-instance}/entity/{verified-endpoint}/{verified-version}/{verified-entity}'};

const erpCompanies=[
 {id:'SYN-CO-AU-01',name:'Powerplants Australia Pty Ltd (synthetic company)',currency:'AUD',taxBasis:'GST — source-reported, definition awaiting validation'},
 {id:'SYN-CO-NZ-01',name:'Powerplants NZ Limited (synthetic company)',currency:'NZD',taxBasis:'GST (NZ) — source-reported, definition awaiting validation'}
];

const erpAccounts=[
 {id:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',code:'WILLOW001',name:'WILLOWBANK HORTICULTURE PTY LTD',currency:'AUD',
  org:ORG.willowbank,mapping:'Confirmed',effectiveFrom:'2025-07-01',effectiveTo:null,mappedBy:'Dana Whitfield',mappingRef:'SYN-PPO-MAP-000012'},
 {id:'ACC-NZ-WILLOWNZ',company:'SYN-CO-NZ-01',code:'WILLOW-NZ',name:'WILLOWBANK HORTICULTURE NZ',currency:'NZD',
  org:ORG.willowbank,mapping:'Confirmed',effectiveFrom:'2026-02-01',effectiveTo:null,mappedBy:'Dana Whitfield',mappingRef:'SYN-PPO-MAP-000019'},
 {id:'ACC-AU-UNRESOLVED',company:'SYN-CO-AU-01',code:'WILLOWBANK HORT',name:'WILLOWBANK HORT',currency:'AUD',
  org:null,mapping:'Unresolved',effectiveFrom:null,effectiveTo:null,mappedBy:null,mappingRef:null,
  note:'Returned by the source with a similar name. No confirmed mapping exists, so nothing here is attributed to a customer and nothing is counted.'},
 {id:'ACC-AU-ROTH004',company:'SYN-CO-AU-01',code:'ROTH004',name:'ROTHWELL GLASSHOUSE GROUP PTY LTD',currency:'AUD',
  org:ORG.rothwell,mapping:'Confirmed',effectiveFrom:'2024-09-01',effectiveTo:null,mappedBy:'Dana Whitfield',mappingRef:'SYN-PPO-MAP-000021'}
];

/* Every ERP-sourced group records its own run: scope, as-at, completeness and outcome.
   "No records returned", "data unavailable" and "not permitted" are three different results. */
const observations=[
 {id:'OBS-ORD-AU',feed:'Sales orders',company:'SYN-CO-AU-01',account:'ACC-AU-WILLOW001',
  scope:'Open and closed orders for account WILLOW001, order date on or after 01 January 2026',
  requestedAt:'2026-09-16T06:10',observedAt:'2026-09-16T06:10',sourceAsAt:'2026-09-16T05:55',
  outcome:'Complete',pagesDeclared:2,pagesReturned:2,rows:4,error:null},
 {id:'OBS-ORD-AU-STALE',feed:'Sales orders',company:'SYN-CO-AU-01',account:'ACC-AU-WILLOW001',
  scope:'Order SYN-MYOB-SO-004470 detail refresh',
  requestedAt:'2026-09-16T06:10',observedAt:'2026-09-12T22:40',sourceAsAt:'2026-09-12T22:30',
  outcome:'Failed',pagesDeclared:1,pagesReturned:0,rows:null,error:'Simulated adapter returned HTTP 503. Last successful observation retained.'},
 {id:'OBS-ORD-NZ',feed:'Sales orders',company:'SYN-CO-NZ-01',account:'ACC-NZ-WILLOWNZ',
  scope:'Open and closed orders for account WILLOW-NZ, order date on or after 01 January 2026',
  requestedAt:'2026-09-16T06:11',observedAt:'2026-09-16T06:11',sourceAsAt:'2026-09-16T05:55',
  outcome:'Complete',pagesDeclared:1,pagesReturned:1,rows:1,error:null},
 {id:'OBS-ORD-UNMAPPED',feed:'Sales orders',company:'SYN-CO-AU-01',account:'ACC-AU-UNRESOLVED',
  scope:'Orders for source account code WILLOWBANK HORT',
  requestedAt:'2026-09-16T06:11',observedAt:'2026-09-16T06:11',sourceAsAt:'2026-09-16T05:55',
  outcome:'Complete',pagesDeclared:1,pagesReturned:1,rows:1,error:null},
 {id:'OBS-ACC-AU',feed:'Customer account',company:'SYN-CO-AU-01',account:'ACC-AU-WILLOW001',
  scope:'Open and recently closed transactions for account WILLOW001',
  requestedAt:'2026-09-16T06:12',observedAt:'2026-09-16T06:12',sourceAsAt:'2026-09-16T05:55',
  outcome:'Incomplete',pagesDeclared:2,pagesReturned:1,rows:5,
  error:'Page 2 of 2 was not returned. No account total is derived from the rows that did arrive.'},
 {id:'OBS-ACC-NZ',feed:'Customer account',company:'SYN-CO-NZ-01',account:'ACC-NZ-WILLOWNZ',
  scope:'Open transactions for account WILLOW-NZ',
  requestedAt:'2026-09-16T06:12',observedAt:'2026-09-16T06:12',sourceAsAt:'2026-09-16T05:55',
  outcome:'Complete',pagesDeclared:1,pagesReturned:1,rows:1,error:null},
 {id:'OBS-ORD-ROTH',feed:'Sales orders',company:'SYN-CO-AU-01',account:'ACC-AU-ROTH004',
  scope:'Open and closed orders for account ROTH004, order date on or after 01 January 2026',
  requestedAt:'2026-09-16T06:13',observedAt:'2026-09-16T06:13',sourceAsAt:'2026-09-16T05:55',
  outcome:'Complete',pagesDeclared:1,pagesReturned:1,rows:1,error:null},
 {id:'OBS-ACC-ROTH',feed:'Customer account',company:'SYN-CO-AU-01',account:'ACC-AU-ROTH004',
  scope:'Open transactions for account ROTH004',
  requestedAt:'2026-09-16T06:13',observedAt:'2026-09-16T06:13',sourceAsAt:'2026-09-16T05:55',
  outcome:'NoRecords',pagesDeclared:1,pagesReturned:1,rows:0,error:null}
];

/* ------------------------------------------------------- sales orders */

/* Only a measure whose source and meaning are defined appears. `null` stays unknown and
   is never rendered as zero. Ordered / allocated / shipped / delivered / cancelled /
   returned / invoiced are separate quantities on every line. */
const orders=[
 {id:'SYN-MYOB-SO-004412',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ORD-AU',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WB-3391',orderDate:'2026-08-24',
  sourceStatus:'Open',sourceStatusRaw:'Open',hold:null,
  quotation:'SYN-PPO-QUO-000318',quotationRevision:'r02',opportunity:'SYN-PPO-OPP-000139',project:null,serviceRecord:null,
  deliverySite:'SYN-PPO-SITE-000201',deliveryAreas:['SYN-PPO-FAC-000401','SYN-PPO-FAC-000403'],
  deliveryAddress:'12 Demonstration Road, Sampletown VIC 3999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:18450.00,taxAmount:1845.00,orderAmountIncTax:20295.00,
  freight:320.00,discount:450.00,
  requestedDelivery:'2026-09-30',confirmedDelivery:'2026-10-02',expectedDelivery:'2026-10-02',
  comparison:{basis:'Accepted quotation SYN-PPO-QUO-000318 r02',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000701',description:'Irrigation controller FC-6 (synthetic)',unit:'EA',price:9800.00,
    ordered:1,allocated:1,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:'SYN-PPO-FAC-000401'},
   {line:'20',product:'SYN-PPO-PRD-000702',description:'Solenoid valve assembly 40 mm (synthetic)',unit:'EA',price:420.00,
    ordered:8,allocated:8,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:'SYN-PPO-FAC-000403'},
   {line:'30',product:null,description:'One-off item — commissioning and configuration service (resolved under ES-07)',unit:'EA',price:2400.00,
    ordered:3,allocated:3,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:null}
  ]},
 {id:'SYN-MYOB-SO-004380',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ORD-AU',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WB-3355',orderDate:'2026-08-10',
  sourceStatus:'Open',sourceStatusRaw:'Open',hold:'Credit hold on line 30 (source-reported hold code CRHLD)',
  quotation:'SYN-PPO-QUO-000315',quotationRevision:'r01',opportunity:null,project:'SYN-PPO-PRJ-000210',serviceRecord:null,
  deliverySite:'SYN-PPO-SITE-000202',deliveryAreas:['SYN-PPO-FAC-000407'],
  deliveryAddress:'84 Example Orchard Lane, Sampletown VIC 3999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:26700.00,taxAmount:2670.00,orderAmountIncTax:29370.00,
  freight:null,discount:0.00,
  requestedDelivery:'2026-09-05',confirmedDelivery:'2026-09-08',expectedDelivery:null,
  comparison:{basis:'Accepted quantities from SYN-PPO-QUO-000315 r01',
   differences:[
    {line:'20',field:'Ordered quantity',quoted:'40 M',ordered:'60 M',note:'Source order carries a larger quantity than the accepted quotation. Reason not supplied by the source.'}
   ]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000710',description:'Field irrigation controller FC-6 (synthetic)',unit:'EA',price:9800.00,
    ordered:1,allocated:1,shipped:1,delivered:1,cancelled:0,returned:0,invoiced:1,shipment:'SYN-MYOB-SHP-002210',invoice:'SYN-MYOB-INV-010044',area:'SYN-PPO-FAC-000407'},
   {line:'20',product:'SYN-PPO-PRD-000711',description:'Mainline pipe 63 mm (synthetic)',unit:'M',price:41.50,
    ordered:60,allocated:60,shipped:40,delivered:40,cancelled:0,returned:0,invoiced:40,shipment:'SYN-MYOB-SHP-002210',invoice:'SYN-MYOB-INV-010044',area:'SYN-PPO-FAC-000407'},
   {line:'30',product:'SYN-PPO-PRD-000712',description:'Filtration skid 4 in (synthetic)',unit:'EA',price:12600.00,
    ordered:1,allocated:0,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:'SYN-PPO-FAC-000407'},
   {line:'40',product:'SYN-PPO-PRD-000713',description:'Pressure transmitter 0–10 bar (synthetic)',unit:'EA',price:315.00,
    ordered:4,allocated:4,shipped:2,delivered:2,cancelled:0,returned:1,invoiced:2,shipment:'SYN-MYOB-SHP-002218',invoice:'SYN-MYOB-INV-010061',area:'SYN-PPO-FAC-000407'}
  ]},
 {id:'SYN-MYOB-SO-004301',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ORD-AU',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WB-3288',orderDate:'2026-05-12',
  sourceStatus:'Completed',sourceStatusRaw:'Completed',hold:null,
  quotation:'SYN-PPO-QUO-000302',quotationRevision:'r01',opportunity:null,project:null,serviceRecord:null,
  deliverySite:'SYN-PPO-SITE-000201',deliveryAreas:['SYN-PPO-FAC-000405'],
  deliveryAddress:'12 Demonstration Road, Sampletown VIC 3999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:3800.00,taxAmount:380.00,orderAmountIncTax:4180.00,
  freight:145.00,discount:0.00,
  requestedDelivery:'2026-05-28',confirmedDelivery:'2026-05-27',expectedDelivery:'2026-05-27',
  comparison:{basis:'Accepted quotation SYN-PPO-QUO-000302 r01',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000720',description:'Pack room bench fittings kit (synthetic)',unit:'EA',price:1900.00,
    ordered:2,allocated:2,shipped:2,delivered:2,cancelled:0,returned:0,invoiced:2,shipment:'SYN-MYOB-SHP-002101',invoice:'SYN-MYOB-INV-009912',area:'SYN-PPO-FAC-000405'}
  ]},
 {id:'SYN-MYOB-SO-004455',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ORD-AU',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WB-3402',orderDate:'2026-09-01',
  sourceStatus:'Cancelled',sourceStatusRaw:'Cancelled',hold:null,cancelledOn:'2026-09-04',cancelReason:'Source-reported reason code CUSTREQ',
  quotation:null,quotationRevision:null,opportunity:null,project:null,serviceRecord:null,
  deliverySite:'SYN-PPO-SITE-000201',deliveryAreas:[],
  deliveryAddress:'12 Demonstration Road, Sampletown VIC 3999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:1250.00,taxAmount:125.00,orderAmountIncTax:1375.00,
  freight:null,discount:0.00,
  requestedDelivery:'2026-09-18',confirmedDelivery:null,expectedDelivery:null,
  comparison:{basis:'No linked quotation in the source record',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000730',description:'Spare filter cartridges (synthetic)',unit:'EA',price:125.00,
    ordered:10,allocated:0,shipped:0,delivered:0,cancelled:10,returned:0,invoiced:0,shipment:null,invoice:null,area:null}
  ]},
 {id:'SYN-MYOB-SO-004470',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ORD-AU-STALE',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WB-3410',orderDate:'2026-09-08',
  sourceStatus:'Open',sourceStatusRaw:'Open (as at last successful observation)',hold:null,stale:true,
  quotation:null,quotationRevision:null,opportunity:null,project:null,serviceRecord:'SYN-PPO-TKT-000731',
  deliverySite:'SYN-PPO-SITE-000201',deliveryAreas:['SYN-PPO-FAC-000406'],
  deliveryAddress:'12 Demonstration Road, Sampletown VIC 3999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:2180.00,taxAmount:218.00,orderAmountIncTax:2398.00,
  freight:null,discount:0.00,
  requestedDelivery:'2026-09-22',confirmedDelivery:null,expectedDelivery:null,
  comparison:{basis:'No linked quotation in the last successful observation',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000740',description:'Pump seal kit SX-40 (synthetic)',unit:'EA',price:540.00,
    ordered:2,allocated:null,shipped:null,delivered:null,cancelled:null,returned:null,invoiced:null,shipment:null,invoice:null,area:'SYN-PPO-FAC-000406'},
   {line:'20',product:'SYN-PPO-PRD-000741',description:'Pressure relief valve 4 bar (synthetic)',unit:'EA',price:550.00,
    ordered:2,allocated:null,shipped:null,delivered:null,cancelled:null,returned:null,invoiced:null,shipment:null,invoice:null,area:'SYN-PPO-FAC-000406'}
  ]},
 {id:'SYN-MYOB-SO-006001',org:ORG.willowbank,account:'ACC-NZ-WILLOWNZ',company:'SYN-CO-NZ-01',observation:'OBS-ORD-NZ',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-WBNZ-0042',orderDate:'2026-08-30',
  sourceStatus:'Open',sourceStatusRaw:'Open',hold:null,
  quotation:null,quotationRevision:null,opportunity:null,project:null,serviceRecord:null,
  deliverySite:null,deliveryAreas:[],
  deliveryAddress:'9 Fictional Way, Sampleton 3999, New Zealand (fictional)',
  currency:'NZD',taxBasis:'GST (NZ) — source-reported',orderAmountExTax:5400.00,taxAmount:810.00,orderAmountIncTax:6210.00,
  freight:null,discount:0.00,
  requestedDelivery:'2026-09-26',confirmedDelivery:'2026-09-29',expectedDelivery:'2026-09-29',
  comparison:{basis:'No linked quotation in the source record',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000750',description:'Climate sensor set (synthetic)',unit:'EA',price:2700.00,
    ordered:2,allocated:2,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:null}
  ]},
 {id:'SYN-MYOB-SO-004489',org:null,account:'ACC-AU-UNRESOLVED',company:'SYN-CO-AU-01',observation:'OBS-ORD-UNMAPPED',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-3488',orderDate:'2026-09-05',
  sourceStatus:'Open',sourceStatusRaw:'Open',hold:null,unresolved:true,
  quotation:null,quotationRevision:null,opportunity:null,project:null,serviceRecord:null,
  deliverySite:null,deliveryAreas:[],
  deliveryAddress:'Address not supplied by the source',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:4100.00,taxAmount:410.00,orderAmountIncTax:4510.00,
  freight:null,discount:null,
  requestedDelivery:'2026-09-24',confirmedDelivery:null,expectedDelivery:null,
  comparison:{basis:'Not comparable — no confirmed customer mapping',differences:[]},
  lines:[
   {line:'10',product:null,description:'Description not supplied by the source',unit:'EA',price:null,
    ordered:null,allocated:null,shipped:null,delivered:null,cancelled:null,returned:null,invoiced:null,shipment:null,invoice:null,area:null}
  ]},
 {id:'SYN-MYOB-SO-005120',org:ORG.rothwell,account:'ACC-AU-ROTH004',company:'SYN-CO-AU-01',observation:'OBS-ORD-ROTH',
  orderType:'SO — Sales order (source-reported type)',customerPo:'PO-RG-7712',orderDate:'2026-09-02',
  sourceStatus:'Open',sourceStatusRaw:'Open',hold:null,
  quotation:null,quotationRevision:null,opportunity:null,project:null,serviceRecord:null,
  deliverySite:'SYN-PPO-SITE-000211',deliveryAreas:['SYN-PPO-FAC-000411'],
  deliveryAddress:'6 Synthetic Grove, Examplefield QLD 4999, Australia (fictional)',
  currency:'AUD',taxBasis:'GST — source-reported',orderAmountExTax:7250.00,taxAmount:725.00,orderAmountIncTax:7975.00,
  freight:null,discount:0.00,
  requestedDelivery:'2026-09-29',confirmedDelivery:'2026-09-30',expectedDelivery:'2026-09-30',
  comparison:{basis:'No linked quotation in the source record',differences:[]},
  lines:[
   {line:'10',product:'SYN-PPO-PRD-000760',description:'Vent drive spares kit (synthetic)',unit:'EA',price:3625.00,
    ordered:2,allocated:2,shipped:0,delivered:0,cancelled:0,returned:0,invoiced:0,shipment:null,invoice:null,area:'SYN-PPO-FAC-000411'}
  ]}
];

/* ------------------------------------------- opportunities and quotations */

const opportunities=[
 {id:'SYN-PPO-OPP-000144',org:ORG.willowbank,title:'Propagation house climate upgrade',stage:'Quoted',owner:'Priya Raman',
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000403'],value:32500.00,currency:'AUD',opened:'2026-07-28',
  nextAction:'Reconcile the conversion outcome for the accepted quotation',nextActionDue:'2026-09-17'},
 {id:'SYN-PPO-OPP-000139',org:ORG.willowbank,title:'Irrigation controller replacement',stage:'Won',owner:'Priya Raman',
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000401','SYN-PPO-FAC-000403'],value:18450.00,currency:'AUD',opened:'2026-06-30',
  nextAction:'Follow the linked order to delivery',nextActionDue:null},
 {id:'SYN-PPO-OPP-000151',org:ORG.willowbank,title:'Pack room cooling review',stage:'Qualified',owner:'Priya Raman',
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000405'],value:null,currency:'AUD',opened:'2026-09-09',
  nextAction:'Book the site survey before estimating (CS-08)',nextActionDue:'2026-09-25'},
 {id:'SYN-PPO-OPP-000160',org:ORG.rothwell,title:'Vent drive replacement programme',stage:'Quoted',owner:'Priya Raman',
  site:'SYN-PPO-SITE-000211',areas:['SYN-PPO-FAC-000411'],value:14800.00,currency:'AUD',opened:'2026-08-19',
  nextAction:'Await customer response',nextActionDue:'2026-09-23'}
];

/* Alternative estimate options are alternatives within one estimate, never separate commitments. */
const estimates=[
 {id:'SYN-PPO-EST-000212',org:ORG.willowbank,opportunity:'SYN-PPO-OPP-000144',title:'Propagation house climate upgrade',
  state:'Reviewed',owner:'Noor Haddad',options:[
   {ref:'Option A',description:'Replace controller and sensors',value:32500.00,selected:true},
   {ref:'Option B',description:'Replace controller only, retain sensors',value:24900.00,selected:false}
  ],currency:'AUD',note:'Two alternative options on one estimate. Only the selected option reached a quotation.'},
 {id:'SYN-PPO-EST-000205',org:ORG.willowbank,opportunity:'SYN-PPO-OPP-000139',title:'Irrigation controller replacement',
  state:'Reviewed',owner:'Noor Haddad',options:[
   {ref:'Option A',description:'Controller, valves and commissioning',value:18450.00,selected:true}
  ],currency:'AUD',note:null}
];

/* Draft / Reviewed / Issued / Sent / Accepted / Declined / Superseded are distinct where the source defines them.
   Successive revisions of one quotation are one commercial line of negotiation, not several commitments. */
const quotations=[
 {id:'SYN-PPO-QUO-000322',org:ORG.willowbank,revision:'r01',opportunity:'SYN-PPO-OPP-000144',estimate:'SYN-PPO-EST-000212',
  state:'Accepted',owner:'Priya Raman',value:32500.00,currency:'AUD',
  issued:'2026-09-09',sent:'2026-09-09',delivered:'2026-09-09',responded:'2026-09-14',
  customerResponse:'Accepted in writing by Sam Okafor (synthetic email)',
  conversion:'Unknown',conversionAttempted:'2026-09-15T16:42',order:null,
  conversionNote:'One conversion operation was sent and the simulated adapter returned an unknown outcome. Whether an ERP order exists has not been established. This is not an existing order and no second attempt is made from here.',
  nextAction:'Reconcile the conversion outcome under ES-07',nextActionDue:'2026-09-17'},
 {id:'SYN-PPO-QUO-000325',org:ORG.willowbank,revision:'r01',opportunity:'SYN-PPO-OPP-000151',estimate:null,
  state:'Sent',owner:'Priya Raman',value:6400.00,currency:'AUD',
  issued:'2026-09-11',sent:'2026-09-11',delivered:'2026-09-11',responded:null,
  customerResponse:null,
  conversion:'NotApplicable',conversionAttempted:null,order:null,conversionNote:null,
  nextAction:'Follow up the customer response under ES-06',nextActionDue:'2026-09-18'},
 {id:'SYN-PPO-QUO-000318',org:ORG.willowbank,revision:'r02',opportunity:'SYN-PPO-OPP-000139',estimate:'SYN-PPO-EST-000205',
  state:'Accepted',owner:'Priya Raman',value:18450.00,currency:'AUD',
  issued:'2026-08-20',sent:'2026-08-20',delivered:'2026-08-20',responded:'2026-08-22',
  customerResponse:'Accepted by purchase order PO-WB-3391',
  conversion:'Converted',conversionAttempted:'2026-08-24T09:05',order:'SYN-MYOB-SO-004412',conversionNote:null,
  nextAction:null,nextActionDue:null},
 {id:'SYN-PPO-QUO-000318-r01',org:ORG.willowbank,revision:'r01',opportunity:'SYN-PPO-OPP-000139',estimate:'SYN-PPO-EST-000205',
  displayRef:'SYN-PPO-QUO-000318',
  state:'Superseded',owner:'Priya Raman',value:19900.00,currency:'AUD',
  issued:'2026-08-12',sent:'2026-08-12',delivered:'2026-08-12',responded:null,
  customerResponse:null,conversion:'NotApplicable',conversionAttempted:null,order:null,
  conversionNote:'Superseded by r02. Retained for history; it carries no separate commitment.',
  nextAction:null,nextActionDue:null},
 {id:'SYN-PPO-QUO-000315',org:ORG.willowbank,revision:'r01',opportunity:null,estimate:null,
  state:'Accepted',owner:'Priya Raman',value:26700.00,currency:'AUD',
  issued:'2026-08-04',sent:'2026-08-04',delivered:'2026-08-05',responded:'2026-08-08',
  customerResponse:'Accepted by purchase order PO-WB-3355',
  conversion:'Converted',conversionAttempted:'2026-08-10T10:20',order:'SYN-MYOB-SO-004380',conversionNote:null,
  nextAction:null,nextActionDue:null},
 {id:'SYN-PPO-QUO-000310',org:ORG.willowbank,revision:'r03',opportunity:null,estimate:null,
  state:'Declined',owner:'Priya Raman',value:11250.00,currency:'AUD',
  issued:'2026-07-21',sent:'2026-07-21',delivered:'2026-07-21',responded:'2026-08-02',
  customerResponse:'Declined — budget deferred to next season (synthetic)',
  conversion:'NotApplicable',conversionAttempted:null,order:null,conversionNote:null,
  nextAction:null,nextActionDue:null},
 {id:'SYN-PPO-QUO-000341',org:ORG.rothwell,revision:'r01',opportunity:'SYN-PPO-OPP-000160',estimate:null,
  state:'Sent',owner:'Priya Raman',value:14800.00,currency:'AUD',
  issued:'2026-09-03',sent:'2026-09-03',delivered:'2026-09-03',responded:null,
  customerResponse:null,conversion:'NotApplicable',conversionAttempted:null,order:null,conversionNote:null,
  nextAction:'Follow up the customer response under ES-06',nextActionDue:'2026-09-23'}
];

/* ------------------------------------------------------- cases and service */

const cases=[
 {id:'SYN-PPO-TKT-000731',org:ORG.willowbank,title:'Irrigation pump cycling on high pressure',state:'In progress',resolution:null,
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000401','SYN-PPO-FAC-000402','SYN-PPO-FAC-000403'],asset:'SYN-PPO-AST-000501',
  owner:'Alex Moreau',raised:'2026-09-04',dateNeeded:'2026-09-19',priorityNote:'No service level is defined for this prototype.',
  reportedSymptom:'Customer reports the pump cycling and tripping on high pressure during the morning irrigation window.',
  suspectedCause:'Control setpoint drift after the August configuration change (suspected, not verified).',
  verifiedFinding:'Pressure relief valve bypassing at 4.2 bar against a 6.0 bar specification. Verified on site 11 September 2026.',
  agreedResolution:'Replace the relief valve. A quotation has not yet been issued, so no work is authorised beyond the completed visit.',
  workOrders:['SYN-PPO-WO-000488'],nextAction:'Raise the follow-up work order for the verified finding (SV-07)'},
 {id:'SYN-PPO-TKT-000744',org:ORG.willowbank,title:'Climate controller alarm after storm',state:'New',resolution:null,
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000401'],asset:'SYN-PPO-AST-000502',
  owner:'Alex Moreau',raised:'2026-09-15',dateNeeded:'2026-09-18',priorityNote:'No service level is defined for this prototype.',
  reportedSymptom:'Customer reports a recurring high-temperature alarm on the climate controller following a storm.',
  suspectedCause:'Not yet assessed.',verifiedFinding:null,agreedResolution:null,
  workOrders:[],nextAction:'Triage and confirm the scope before any attendance (SV-01)'},
 {id:'SYN-PPO-TKT-000702',org:ORG.willowbank,title:'Pack room bench fitting rework',state:'Resolved',resolution:'Rework completed and accepted by the customer on 02 July 2026.',
  site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000405'],asset:null,
  owner:'Alex Moreau',raised:'2026-06-20',dateNeeded:'2026-07-04',priorityNote:'No service level is defined for this prototype.',
  reportedSymptom:'Bench fittings loose after installation.',suspectedCause:'Incorrect fixing centres.',
  verifiedFinding:'Fixing centres did not match the supplied bench frame.',agreedResolution:'Rework at no charge.',
  workOrders:['SYN-PPO-WO-000451'],nextAction:null},
 {id:'SYN-PPO-TKT-000811',org:ORG.rothwell,title:'Vent drive intermittent stop',state:'In progress',resolution:null,
  site:'SYN-PPO-SITE-000211',areas:['SYN-PPO-FAC-000411'],asset:'SYN-PPO-AST-000511',
  owner:'Alex Moreau',raised:'2026-09-10',dateNeeded:'2026-09-20',priorityNote:'No service level is defined for this prototype.',
  reportedSymptom:'Vent drive stops intermittently.',suspectedCause:'Limit switch.',verifiedFinding:null,agreedResolution:null,
  workOrders:[],nextAction:'Triage and confirm the scope (SV-01)'}
];

const workOrders=[
 {id:'SYN-PPO-WO-000488',case:'SYN-PPO-TKT-000731',org:ORG.willowbank,title:'Attend and diagnose pump high-pressure trip',
  state:'Attended — findings recorded',authorisedBy:'Alex Moreau',authorisedOn:'2026-09-08',site:'SYN-PPO-SITE-000201',
  appointments:['SYN-PPO-APT-000615'],billingState:'Not yet handed to Finance'},
 {id:'SYN-PPO-WO-000451',case:'SYN-PPO-TKT-000702',org:ORG.willowbank,title:'Rework pack room bench fittings',
  state:'Closed',authorisedBy:'Alex Moreau',authorisedOn:'2026-06-22',site:'SYN-PPO-SITE-000201',
  appointments:['SYN-PPO-APT-000590'],billingState:'No charge — reviewed disposition recorded'}
];

const appointments=[
 {id:'SYN-PPO-APT-000615',workOrder:'SYN-PPO-WO-000488',org:ORG.willowbank,state:'Completed',
  scheduled:'2026-09-11T08:00',technician:'Rory Nakamura',site:'SYN-PPO-SITE-000201',
  outcome:'Attendance complete. Findings recorded. The case remains open.'},
 {id:'SYN-PPO-APT-000622',workOrder:null,agreement:'SYN-PPO-SVC-000090',org:ORG.willowbank,state:'Scheduled',
  scheduled:'2026-09-22T09:00',technician:'Rory Nakamura',site:'SYN-PPO-SITE-000201',
  outcome:'Planned service visit. Not yet attended.'},
 {id:'SYN-PPO-APT-000590',workOrder:'SYN-PPO-WO-000451',org:ORG.willowbank,state:'Completed',
  scheduled:'2026-06-27T09:30',technician:'Rory Nakamura',site:'SYN-PPO-SITE-000201',
  outcome:'Rework completed.'}
];

const serviceReports=[
 {id:'SYN-PPO-RPT-000254',revision:'r01',workOrder:'SYN-PPO-WO-000488',org:ORG.willowbank,
  state:'Issued',issued:'2026-09-12',sent:'2026-09-12',delivered:'2026-09-12',acknowledged:'2026-09-13',
  acknowledgedBy:'Jordan Lee',
  note:'Acknowledgement applies to this exact revision. Any changed content would need a new revision and would not inherit this acknowledgement.'}
];

const findings=[
 {id:'F-02',report:'SYN-PPO-RPT-000254',case:'SYN-PPO-TKT-000731',org:ORG.willowbank,
  description:'Pressure relief valve bypassing at 4.2 bar against a 6.0 bar specification.',
  state:'Unresolved — follow-up work not yet raised',owner:'Alex Moreau',dateNeeded:'2026-09-19'},
 {id:'F-01',report:'SYN-PPO-RPT-000254',case:'SYN-PPO-TKT-000731',org:ORG.willowbank,
  description:'Suction strainer cleaned during attendance.',
  state:'Closed on the visit',owner:'Rory Nakamura',dateNeeded:null}
];

const agreements=[
 {id:'SYN-PPO-SVC-000090',org:ORG.willowbank,title:'Irrigation and climate planned service',state:'Active',
  site:'SYN-PPO-SITE-000201',coverage:'Two planned visits each year; parts excluded',
  nextOccurrence:'2026-09-30',renewalDue:'2026-10-31',owner:'Alex Moreau',
  note:'Coverage wording is a synthetic example. It is not an approved entitlement definition.'}
];

const warrantyCases=[
 {id:'SYN-PPO-RC-000067',org:ORG.willowbank,title:'Climate controller replacement under warranty',state:'Customer outcome delivered; supplier recovery outstanding',
  asset:'SYN-PPO-AST-000502',site:'SYN-PPO-SITE-000201',raised:'2026-08-18',owner:'Alex Moreau',
  customerOutcome:'Replacement unit supplied 26 August 2026 at no charge to the customer.',
  supplierRecovery:'Claim SYN-PPO-SUP-000144 lodged 27 August 2026. No supplier decision has been received.',
  dateNeeded:'2026-09-26',
  note:'The customer outcome and the supplier recovery are separate facts. Neither implies the other.'}
];

/* ------------------------------------------------------------- projects */

const projects=[
 {id:'SYN-PPO-PRJ-000210',org:ORG.willowbank,title:'Field production irrigation upgrade — Stage 1',state:'In delivery',
  owner:'Marcus Webb',site:'SYN-PPO-SITE-000202',areas:['SYN-PPO-FAC-000407','SYN-PPO-FAC-000406'],
  started:'2026-07-14',technicalCompletion:null,customerAcceptance:null,commercialCloseout:null,
  nextMilestone:'Controller commissioning',nextMilestoneDue:'2026-10-09',
  deliverables:[
   {ref:'D-01',description:'Design basis issued',state:'Complete',due:'2026-08-01'},
   {ref:'D-02',description:'Mainline installation',state:'In progress',due:'2026-09-26'},
   {ref:'D-03',description:'Controller commissioning and as-built release',state:'Not started',due:'2026-10-09'}
  ],
  variations:[
   {ref:'VO-01',description:'Additional 20 m of mainline',state:'Approved by the customer 28 August 2026',value:830.00,currency:'AUD'},
   {ref:'VO-02',description:'Upgrade filtration skid to 4 in',state:'Awaiting customer approval',value:3400.00,currency:'AUD',dateNeeded:'2026-09-24'}
  ],
  commitments:'Commissioning attendance by the customer’s production supervisor; crop-access window applies from 05 October 2026.'},
 {id:'SYN-PPO-PRJ-000188',org:ORG.willowbank,title:'Nursery propagation bench replacement',state:'Delivered — commercial closeout outstanding',
  owner:'Marcus Webb',site:'SYN-PPO-SITE-000201',areas:['SYN-PPO-FAC-000403','SYN-PPO-FAC-000404'],
  started:'2026-04-02',technicalCompletion:'2026-06-30',customerAcceptance:'2026-07-14',commercialCloseout:null,
  nextMilestone:'Final claim reconciliation',nextMilestoneDue:'2026-09-30',
  deliverables:[
   {ref:'D-01',description:'Bench replacement',state:'Complete',due:'2026-06-30'},
   {ref:'D-02',description:'Final claim and reconciliation',state:'Outstanding',due:'2026-09-30'}
  ],
  variations:[],
  commitments:'Twelve-month workmanship undertaking recorded on the handover pack (synthetic).'},
 {id:'SYN-PPO-PRJ-000240',org:ORG.rothwell,title:'Northbank vent drive programme',state:'In delivery',
  owner:'Marcus Webb',site:'SYN-PPO-SITE-000211',areas:['SYN-PPO-FAC-000411'],
  started:'2026-08-25',technicalCompletion:null,customerAcceptance:null,commercialCloseout:null,
  nextMilestone:'Drive replacement — Bay 1',nextMilestoneDue:'2026-10-02',
  deliverables:[{ref:'D-01',description:'Drive replacement — Bay 1',state:'In progress',due:'2026-10-02'}],
  variations:[],commitments:'None recorded.'}
];

/* ------------------------------------------------- customer account records */

/* FD-01/FD-02/FD-04 basis. Remaining amounts appear only where the source supplies them.
   Deposits and unapplied cash are shown separately and never netted automatically. */
const financeRecords=[
 {id:'SYN-MYOB-INV-010044',type:'Invoice',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ACC-AU',
  date:'2026-08-29',due:'2026-09-28',currency:'AUD',original:1100.00,remaining:600.00,
  applied:[{kind:'Payment',ref:'SYN-MYOB-PMT-004402',amount:400.00},{kind:'Credit',ref:'SYN-MYOB-CRD-000318',amount:100.00}],
  sourceStatus:'Open',order:'SYN-MYOB-SO-004380',
  note:'Fixture F-01. Original and remaining are shown separately; the remaining amount is the value supplied by the source.'},
 {id:'SYN-MYOB-PMT-004411',type:'Unapplied receipt',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ACC-AU',
  date:'2026-09-10',due:null,currency:'AUD',original:200.00,remaining:200.00,applied:[],
  sourceStatus:'Unapplied',order:null,
  note:'Fixture F-02. Unapplied cash is shown on its own. It does not reduce any displayed invoice here.'},
 {id:'SYN-MYOB-DEP-000212',type:'Deposit',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ACC-AU',
  date:'2026-08-24',due:null,currency:'AUD',original:1500.00,remaining:1500.00,applied:[],
  sourceStatus:'Held',order:'SYN-MYOB-SO-004412',
  note:'Held against the order by the source. It is not applied to an invoice and does not make the order paid.'},
 {id:'SYN-MYOB-INV-010061',type:'Invoice',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ACC-AU',
  date:'2026-09-06',due:'2026-10-06',currency:'AUD',original:940.00,remaining:null,applied:[],
  sourceStatus:'Disputed',order:'SYN-MYOB-SO-004380',
  note:'The source reports a dispute and supplies no remaining amount. Remaining stays unknown; it is not rendered as zero.'},
 {id:'SYN-MYOB-INV-009912',type:'Invoice',org:ORG.willowbank,account:'ACC-AU-WILLOW001',company:'SYN-CO-AU-01',observation:'OBS-ACC-AU',
  date:'2026-05-29',due:'2026-06-28',currency:'AUD',original:4180.00,remaining:0.00,
  applied:[{kind:'Payment',ref:'SYN-MYOB-PMT-004180',amount:4180.00}],
  sourceStatus:'Closed',order:'SYN-MYOB-SO-004301',note:'Historical closed transaction.'},
 {id:'SYN-MYOB-INV-NZ-002201',type:'Invoice',org:ORG.willowbank,account:'ACC-NZ-WILLOWNZ',company:'SYN-CO-NZ-01',observation:'OBS-ACC-NZ',
  date:'2026-09-01',due:'2026-10-01',currency:'NZD',original:2300.00,remaining:2300.00,applied:[],
  sourceStatus:'Open',order:null,
  note:'A different legal company and currency. It is never added to the AUD figures without an approved consolidation definition.'}
];

/* ---------------------------------------------------- activity and documents */

const activities=[
 {id:'ACT-0001',org:ORG.willowbank,kind:'Email',subject:'Accepted — propagation house climate upgrade',
  when:'2026-09-14T11:05',author:'Sam Okafor (customer)',direction:'Inbound',record:'SYN-PPO-QUO-000322',recordLabel:'Quotation SYN-PPO-QUO-000322 r01',
  site:null,private:false,summary:'Customer confirmed acceptance of the quotation in writing.'},
 {id:'ACT-0002',org:ORG.willowbank,kind:'Document',subject:'Service report SYN-PPO-RPT-000254 r01 issued',
  when:'2026-09-12T16:20',author:'Alex Moreau',direction:'Outbound',record:'SYN-PPO-RPT-000254',recordLabel:'Service report SYN-PPO-RPT-000254 r01',
  site:'SYN-PPO-SITE-000201',private:false,documentRevision:'r01',
  summary:'Controlled report issued to the customer. The document master remains the owning register; this is a link, not a second copy.'},
 {id:'ACT-0003',org:ORG.willowbank,kind:'Call',subject:'Pump trip — customer call',
  when:'2026-09-04T08:40',author:'Alex Moreau',direction:'Inbound',record:'SYN-PPO-TKT-000731',recordLabel:'Case SYN-PPO-TKT-000731',
  site:'SYN-PPO-SITE-000201',private:false,summary:'Customer reported repeated pump trips during the morning irrigation window.'},
 {id:'ACT-0004',org:ORG.willowbank,kind:'Meeting',subject:'Stage 1 progress review',
  when:'2026-09-08T14:00',author:'Marcus Webb',direction:'Internal',record:'SYN-PPO-PRJ-000210',recordLabel:'Project SYN-PPO-PRJ-000210',
  site:'SYN-PPO-SITE-000202',private:false,summary:'Reviewed mainline progress and the outstanding filtration variation.'},
 {id:'ACT-0005',org:ORG.willowbank,kind:'Note',subject:'Commercial position — internal only',
  when:'2026-09-09T09:15',author:'Priya Raman',direction:'Internal',record:'SYN-PPO-OPP-000144',recordLabel:'Opportunity SYN-PPO-OPP-000144',
  site:null,private:true,summary:'Restricted internal commercial note. Visible only to the relationship owner role in this demonstration.'},
 {id:'ACT-0006',org:ORG.willowbank,kind:'Event',subject:'Sales order SYN-MYOB-SO-004380 partially shipped',
  when:'2026-09-08T18:30',author:'MYOB Acumatica (simulated adapter)',direction:'Source',record:'SYN-MYOB-SO-004380',recordLabel:'Sales order SYN-MYOB-SO-004380',
  site:'SYN-PPO-SITE-000202',private:false,
  summary:'Source-reported shipment against lines 10, 20 and 40. Reading this entry completes nothing.'},
 {id:'ACT-0007',org:ORG.willowbank,kind:'Event',subject:'Conversion outcome unknown for SYN-PPO-QUO-000322',
  when:'2026-09-15T16:42',author:'MYOB Acumatica (simulated adapter)',direction:'Source',record:'SYN-PPO-QUO-000322',recordLabel:'Quotation SYN-PPO-QUO-000322 r01',
  site:null,private:false,
  summary:'One conversion operation was sent; the adapter returned an unknown outcome. The result remains unresolved.'},
 {id:'ACT-0008',org:ORG.willowbank,kind:'Document',subject:'Quotation SYN-PPO-QUO-000318 r02 issued',
  when:'2026-08-20T10:02',author:'Priya Raman',direction:'Outbound',record:'SYN-PPO-QUO-000318',recordLabel:'Quotation SYN-PPO-QUO-000318 r02',
  site:null,private:false,documentRevision:'r02',summary:'Issued quotation document, revision r02.'},
 {id:'ACT-0011',org:ORG.rothwell,kind:'Email',subject:'Vent drive programme — quotation sent',
  when:'2026-09-03T09:30',author:'Priya Raman',direction:'Outbound',record:'SYN-PPO-QUO-000341',recordLabel:'Quotation SYN-PPO-QUO-000341 r01',
  site:'SYN-PPO-SITE-000211',private:false,summary:'Quotation issued to the customer.'}
];

/* ------------------------------------------- owned follow-up actions (PPO) */

/* These are Powerplants-owned next actions. None of them is an ERP action, and
   none of them changes a source record. Each names the originating record, why it
   needs attention, the responsible owner, a due date or an explicit "Date needed",
   and the one next action. `dueKind` distinguishes a contractual due date from an
   internally needed-by date; no service level or priority threshold is invented. */
const followUps=[
 {id:'FU-0001',org:ORG.willowbank,record:'SYN-PPO-QUO-000325',recordKind:'quotation',recordLabel:'Quotation SYN-PPO-QUO-000325 r01',
  section:'deals',title:'Issued quotation has no customer response',
  reason:'Sent on 11 September 2026. The source records no response.',
  owner:'Priya Raman',due:'2026-09-18',dueKind:'Follow-up due',
  action:'Follow up the customer response (ES-06 quotation response and negotiation).',finance:false},
 {id:'FU-0002',org:ORG.willowbank,record:'SYN-PPO-QUO-000322',recordKind:'quotation',recordLabel:'Quotation SYN-PPO-QUO-000322 r01',
  section:'deals',title:'Accepted quotation with an unknown conversion outcome',
  reason:'One conversion operation was sent on 15 September 2026 and returned an unknown result. Whether an ERP order exists is not established, so this is not an existing order.',
  owner:'Priya Raman',due:'2026-09-17',dueKind:'Date needed',
  action:'Reconcile the conversion outcome before any further attempt (ES-07 item resolution and conversion).',finance:false},
 {id:'FU-0003',org:ORG.willowbank,record:'SYN-MYOB-SO-004380',recordKind:'order',recordLabel:'Sales order SYN-MYOB-SO-004380',
  section:'orders',title:'Partial fulfilment with a source-reported hold and no expected date',
  reason:'Two lines remain outstanding, line 30 carries a source-reported credit hold, and the source supplies no expected delivery date.',
  owner:'Dana Whitfield',due:'2026-09-19',dueKind:'Date needed',
  action:'Confirm the outstanding supply and an expected date with the ERP account owner.',finance:false},
 {id:'FU-0004',org:ORG.willowbank,record:'SYN-MYOB-SO-004470',recordKind:'order',recordLabel:'Sales order SYN-MYOB-SO-004470',
  section:'orders',title:'Source observation failed; order detail is stale',
  reason:'The last successful observation was 12 September 2026 at 22:40. The refresh on 16 September 2026 failed with a simulated adapter error.',
  owner:'Dana Whitfield',due:'2026-09-16',dueKind:'Date needed',
  action:'Refresh the source, and investigate the adapter failure if it repeats (AD-04 integration health).',finance:false},
 {id:'FU-0005',org:ORG.willowbank,record:'SYN-PPO-TKT-000731',recordKind:'case',recordLabel:'Case SYN-PPO-TKT-000731',
  section:'cases',title:'Verified finding unresolved after a completed visit',
  reason:'The 11 September 2026 visit is complete and its report is acknowledged, but finding F-02 has no follow-up work order and the case remains open.',
  owner:'Alex Moreau',due:'2026-09-19',dueKind:'Date needed',
  action:'Raise the follow-up work order for finding F-02 (SV-07 unresolved findings).',finance:false},
 {id:'FU-0006',org:ORG.willowbank,record:'SYN-PPO-TKT-000744',recordKind:'case',recordLabel:'Case SYN-PPO-TKT-000744',
  section:'cases',title:'New case awaiting triage',
  reason:'Raised 15 September 2026. No work order or appointment exists.',
  owner:'Alex Moreau',due:'2026-09-18',dueKind:'Date needed',
  action:'Triage and confirm the scope before any attendance (SV-01 service desk and triage).',finance:false},
 {id:'FU-0007',org:ORG.willowbank,record:'SYN-PPO-PRJ-000210',recordKind:'project',recordLabel:'Project SYN-PPO-PRJ-000210',
  section:'projects',title:'Variation VO-02 awaiting customer approval',
  reason:'The filtration upgrade variation is not approved, and the controller commissioning milestone depends on it.',
  owner:'Marcus Webb',due:'2026-09-24',dueKind:'Date needed',
  action:'Confirm the customer decision on VO-02 (PJ-05 contract obligations and variations).',finance:false},
 {id:'FU-0008',org:ORG.willowbank,record:'SYN-PPO-PRJ-000188',recordKind:'project',recordLabel:'Project SYN-PPO-PRJ-000188',
  section:'projects',title:'Commercial closeout outstanding on an accepted project',
  reason:'Technical completion and customer acceptance are recorded. The final claim has not been reconciled, so the project is not commercially closed.',
  owner:'Marcus Webb',due:'2026-09-30',dueKind:'Date needed',
  action:'Complete the final claim reconciliation (PJ-09 staged acceptance and closeout).',finance:false},
 {id:'FU-0009',org:ORG.willowbank,record:'SYN-PPO-SVC-000090',recordKind:'agreement',recordLabel:'Agreement SYN-PPO-SVC-000090',
  section:'cases',title:'Service agreement renewal due',
  reason:'The agreement renewal date is 31 October 2026 and no renewal proposal exists.',
  owner:'Alex Moreau',due:'2026-10-31',dueKind:'Renewal due',
  action:'Prepare the renewal proposal (MA-05 renewals and service relationship review).',finance:false},
 {id:'FU-0010',org:ORG.willowbank,record:'SYN-PPO-RC-000067',recordKind:'warranty',recordLabel:'Warranty case SYN-PPO-RC-000067',
  section:'cases',title:'Supplier recovery outstanding after a delivered customer outcome',
  reason:'The replacement was supplied to the customer on 26 August 2026. The supplier claim lodged on 27 August 2026 has no decision.',
  owner:'Alex Moreau',due:'2026-09-26',dueKind:'Date needed',
  action:'Progress the supplier recovery claim (MA-07 supplier recovery coordination).',finance:false},
 {id:'FU-0011',org:ORG.willowbank,record:'ACC-AU-UNRESOLVED',recordKind:'mapping',recordLabel:'Source account WILLOWBANK HORT',
  section:'orders',title:'Source account has no confirmed customer mapping',
  reason:'One order was returned under a source account code that resembles this customer. Names alone do not establish a mapping, so nothing is attributed or counted.',
  owner:'Dana Whitfield',due:'2026-09-19',dueKind:'Date needed',
  action:'Resolve or reject the account mapping (AD-05 external mapping and reconciliation).',finance:false},
 {id:'FU-0012',org:ORG.willowbank,record:'SYN-MYOB-INV-010061',recordKind:'finance',recordLabel:'Invoice SYN-MYOB-INV-010061',
  section:'accounts',title:'Disputed invoice with no source-supplied remaining amount',
  reason:'The source reports a dispute and supplies no remaining amount, so the outstanding value is unknown.',
  owner:'Robin Alvarez (customer) / Finance',due:'2026-09-22',dueKind:'Date needed',
  action:'Review the dispute with Finance and obtain the source remaining amount.',finance:true},
 {id:'FU-0021',org:ORG.rothwell,record:'SYN-PPO-QUO-000341',recordKind:'quotation',recordLabel:'Quotation SYN-PPO-QUO-000341 r01',
  section:'deals',title:'Issued quotation has no customer response',
  reason:'Sent on 03 September 2026. The source records no response.',
  owner:'Priya Raman',due:'2026-09-23',dueKind:'Follow-up due',
  action:'Follow up the customer response (ES-06 quotation response and negotiation).',finance:false},
 {id:'FU-0022',org:ORG.rothwell,record:'SYN-PPO-TKT-000811',recordKind:'case',recordLabel:'Case SYN-PPO-TKT-000811',
  section:'cases',title:'Case awaiting triage',
  reason:'Raised 10 September 2026. No work order exists.',
  owner:'Alex Moreau',due:'2026-09-20',dueKind:'Date needed',
  action:'Triage and confirm the scope (SV-01 service desk and triage).',finance:false}
];

/* ------------------------------------------------------------ permissions */

/* This is a presentation demonstration only. It is not a security boundary,
   a server role or an authorisation grant. Server-enforced permissions are a
   receiving-application obligation recorded in the companion report. */
const roles=[
 {id:'coordinator',name:'Service coordinator',finance:false,privateNotes:false,
  note:'Operational context across the customer. Finance amounts and private internal notes are withheld.'},
 {id:'account-manager',name:'Account manager',finance:true,privateNotes:true,
  note:'Permitted to see customer account observations and the relationship owner’s private notes in this demonstration.'},
 {id:'technician',name:'Service technician',finance:false,privateNotes:false,operationalOnly:true,
  note:'Only the operational records needed for assigned work. Commercial registers are withheld entirely.'}
];

/* --------------------------------------------------------------- helpers */

const byId=(list,id)=>list.find(x=>x.id===id)||null;

function accountsForOrg(orgId){return erpAccounts.filter(a=>a.org===orgId&&a.mapping==='Confirmed');}
function unresolvedAccounts(){return erpAccounts.filter(a=>a.mapping==='Unresolved');}

function ordersForOrg(orgId){
 const codes=accountsForOrg(orgId).map(a=>a.id);
 return orders.filter(o=>o.org===orgId&&codes.includes(o.account));
}
function unresolvedOrders(){
 return orders.filter(o=>o.unresolved===true);
}

/* Outstanding supply is expressed per line and only where both measures are known.
   An unknown shipped quantity leaves the outstanding quantity unknown. */
function lineOutstanding(line){
 if(line.ordered===null||line.shipped===null) return null;
 const cancelled=line.cancelled===null?0:line.cancelled;
 return Math.max(0,line.ordered-line.shipped-cancelled);
}
function orderFulfilment(order){
 let known=0,unknown=0,outstandingLines=0;
 for(const line of order.lines){
  const out=lineOutstanding(line);
  if(out===null){unknown++;continue;}
  known++;
  if(out>0) outstandingLines++;
 }
 return {lines:order.lines.length,known,unknown,outstandingLines,
  complete:unknown===0&&outstandingLines===0,
  determinable:unknown===0};
}

/* Amounts are only ever summed inside one currency, and only across records that
   share a defined measure. Mixed currencies return a not-comparable result. */
function totalByCurrency(records,field){
 const map=new Map();
 let unknown=0;
 for(const r of records){
  const value=r[field];
  if(value===null||value===undefined){unknown++;continue;}
  map.set(r.currency,(map.get(r.currency)||0)+value);
 }
 return {byCurrency:[...map.entries()].map(([currency,amount])=>({currency,amount})),unknown};
}

/* A count is only meaningful with its scope. Every summary states what it counted. */
function describeScope(parts){return parts.filter(Boolean).join(' · ');}

function observationFor(id){return byId(observations,id);}
function observationState(obs,nowIso){
 if(!obs) return {tone:'neutral',label:'Source not recorded',stale:false};
 if(obs.outcome==='Failed') return {tone:'danger',label:'Last refresh failed',stale:true};
 if(obs.outcome==='Incomplete') return {tone:'warning',label:'Extraction incomplete',stale:false};
 if(obs.outcome==='NoRecords') return {tone:'neutral',label:'No records returned',stale:false};
 const age=hoursSince(obs.observedAt,nowIso||(TODAY+'T06:30'));
 if(age!==null&&age>24) return {tone:'warning',label:'Observation older than 24 hours',stale:true};
 return {tone:'success',label:'Observed',stale:false};
}

/* An account balance is shown only when the extraction was complete and the source
   supplied one. It is never derived by adding the rows that happen to be visible. */
function accountBalance(accountId){
 const account=byId(erpAccounts,accountId);
 const obs=observations.find(o=>o.feed==='Customer account'&&o.account===accountId);
 if(!obs) return {state:'Unavailable',reason:'No account observation is recorded for this account.',amount:null,currency:account?account.currency:null};
 if(obs.outcome==='Failed') return {state:'Unavailable',reason:'The last refresh failed. Last-good rows are retained with their own as-at time.',amount:null,currency:account.currency};
 if(obs.outcome==='Incomplete') return {state:'Unavailable',reason:obs.error,amount:null,currency:account.currency};
 if(obs.outcome==='NoRecords') return {state:'NoRecords',reason:'The source returned no open transactions for this account. That is a result, not a failure.',amount:null,currency:account.currency};
 return {state:'Unavailable',reason:'No source-supplied account balance is present in this synthetic feed, and no balance is derived from visible rows.',amount:null,currency:account.currency};
}

function searchText(record){
 return Object.values(record).filter(v=>typeof v==='string').join(' ').toLowerCase();
}

const Model=Object.freeze({
 TODAY,formatDate,formatDateTime,daysBetween,hoursSince,money,quantity,
 ORG,organisations,people,sites,areas,assets,
 erpConnection,erpCompanies,erpAccounts,observations,
 orders,opportunities,estimates,quotations,
 cases,workOrders,appointments,serviceReports,findings,agreements,warrantyCases,
 projects,financeRecords,activities,followUps,roles,
 byId,accountsForOrg,unresolvedAccounts,ordersForOrg,unresolvedOrders,
 lineOutstanding,orderFulfilment,totalByCurrency,describeScope,
 observationFor,observationState,accountBalance,searchText
});

window.Customer360Model=Model;
})();
