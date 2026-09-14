import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

// Run a copy in the primary runtime scratch directory. No operational prices.
const fixturePath = process.argv[2];
const outputDir = process.argv[3];
if (!fixturePath || !outputDir) throw Error('Pass fixture JSON and output directory.');
const data = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
await fs.mkdir(outputDir, { recursive: true });
const wb = Workbook.create();
const names = ['Overview', 'Project', 'Estimate lines', 'Scope', 'Sources', 'Calculation', 'PPO export'];
const sheets = Object.fromEntries(names.map(n => [n, wb.worksheets.add(n)]));
const navy='#242a37', green='#62bb46', pale='#fff5df', grey='#f5f6f8', ink='#242a37';
const money='"$"#,##0.00;[Red]("$"#,##0.00);"$"0.00';
const date = s => new Date(s+'T00:00:00Z');
const col = n => {let a='';for(++n;n;n=Math.floor((n-1)/26))a=String.fromCharCode(65+(n-1)%26)+a;return a;};
function base(s, range, title, note) {
  s.showGridLines=false;
  s.getRange(range).format={font:{name:'Roboto',size:11,color:ink},rowHeight:25,verticalAlignment:'center'};
  s.getRange('A2').values=[[title]];
  s.getRange('A2').format.font={name:'Roboto',size:17,bold:true,color:navy};
  s.getRange('A3').values=[[note]];
  s.getRange('A3').format.font={name:'Roboto',size:10,color:'#596779'};
}
function table(s, address, headers, name) {
  const row=Number(address.match(/\d+/)[0]);
  const start=address.split(':')[0].replace(/\d+/,'');
  s.getRange(`${start}${row}`).write([headers]);
  const t=s.tables.add(address,true,name);t.style='TableStyleMedium2';
  s.getRange(`${start}${row}:${address.split(':')[1].replace(/\d+/,String(row))}`).format={fill:navy,font:{name:'Roboto',size:11,bold:true,color:'#ffffff'},wrapText:true,rowHeight:42,horizontalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#ffffff'}}};
  return t;
}
function input(s, range) {s.getRange(range).format.fill=pale;}
function list(s, range, values) {s.getRange(range).dataValidation={rule:{type:'list',values}};}
function decimalValidation(s, range, min, max) {s.dataValidations.add({range,rule:{type:'decimal',operator:'between',formula1:min,formula2:max}});}

const p=sheets.Project;
base(p,'A1:D25','Project information','Replace the fictional references with context downloaded from PPO.');
p.getRange('A1:A25').format.columnWidth=28;p.getRange('B1:B25').format.columnWidth=58;p.getRange('C1:D25').format.columnWidth=20;
const meta=Object.entries(data.metadata).map(([k,v])=>[k,k==='formula_reviewed_at'?date(v):v]);
table(p,`A5:B${5+meta.length}`,['field','value'],'PPO_Metadata');p.getRange('A6').write(meta);input(p,`B6:B${5+meta.length}`);
p.getRange('B22').setNumberFormat('dd mmm yyyy');
list(p,'B17',['AUD']);list(p,'B18',['ExcludingTax']);list(p,'B20',['Synthetic']);
p.tabColor=green;

const s=sheets.Scope;
base(s,'A1:J18','Scope and sections','Sections preserve the facility, growing area, system and phase of the work.');
[16,30,28,28,18,20,4,17,18,76].forEach((w,i)=>s.getRange(`${col(i)}1:${col(i)}18`).format.columnWidth=w);
table(s,'A5:F12',['section_ref','label','facility_ref','growing_area_ref','system','phase'],'PPO_Sections');s.getRange('A6').write(data.sections);input(s,'A6:F12');
table(s,'H5:J8',['scope_ref','kind','text'],'PPO_Scope');s.getRange('H6').write(data.scope);input(s,'H6:J8');s.getRange('J6:J8').format.wrapText=true;s.getRange('H6:J8').format.rowHeight=62;
list(s,'I6:I8',['Inclusion','Exclusion','Assumption']);s.freezePanes.freezeRows(5);

const so=sheets.Sources;
base(so,'A1:G16','Cost sources','All sources and rates in this workbook are fictional.');
[16,22,29,25,20,20,62].forEach((w,i)=>so.getRange(`${col(i)}1:${col(i)}16`).format.columnWidth=w);
table(so,'A5:G11',['source_ref','source_kind','supplier_label','document_ref','source_date','valid_until','internal_notes'],'PPO_Sources');
so.getRange('A6').write(data.sources.map(r=>r.map((v,i)=>i===4||i===5?date(v):v)));input(so,'A6:G11');so.getRange('E6:F11').setNumberFormat('dd mmm yyyy');so.getRange('G6:G11').format.wrapText=true;so.getRange('A6:G11').format.rowHeight=44;so.freezePanes.freezeRows(5);

const c=sheets.Calculation;
base(c,'A1:H18','Installation labour build-up','Illustrative hours only. Engineering adequacy is outside this calculation.');
[30,18,22,18,24,22,24,24].forEach((w,i)=>c.getRange(`${col(i)}1:${col(i)}18`).format.columnWidth=w);
c.getRange('A5:D5').values=[['Task','Crew size','Days','Hours per day']];c.getRange('A5:D5').format={fill:navy,font:{color:'#ffffff',bold:true},rowHeight:32};
c.getRange('A6:D6').values=[['Mechanical installation',2,5,8]];input(c,'B6:D6');
c.getRange('A8').values=[['Calculated labour hours']];c.getRange('D8').formulas=[['=IF(COUNT(B6:D6)=3,B6*C6*D6,"")']];c.getRange('D8').setNumberFormat('0.000');c.getRange('A8:D8').format.fill=grey;
c.getRange('A11').values=[['Used by line L-008 on Estimate lines.']];
c.getRange('A13').values=[['Editable inputs are amber. Calculated cells are grey.']];
c.getRange('A14').values=[['Formula cells are not locked in this r01 workbook.']];
decimalValidation(c,'B6:D6',0,100);

const l=sheets['Estimate lines'];
base(l,'A1:P107','Estimate lines','Synthetic example. Replace the 12 sample lines, scope, sources and project context before reuse.');
const lineHeaders=['line_ref','section_ref','description','category','quantity','unit','unit_cost','unit_sell','allowance','source_ref','source_date','include','print','workbook_cost','workbook_sell','entry_status'];
[16,16,45,19,15,12,18,18,15,16,19,13,13,20,20,22].forEach((w,i)=>l.getRange(`${col(i)}1:${col(i)}107`).format.columnWidth=w);
table(l,'A5:P105',lineHeaders,'PPO_EstimateLines');
const rows=Array.from({length:100},(_,i)=>i<data.lines.length?data.lines[i].map((v,j)=>j===10?date(v):[8,11,12].includes(j)?(v?'Yes':'No'):v):Array(13).fill(null));l.getRange('A6:M105').values=rows;input(l,'A6:M105');
l.getRange('E13').formulas=[["=IF('Calculation'!D8=\"\",\"\",'Calculation'!D8)"]];l.getRange('E13').format.fill=grey;
l.getRange('N6').formulas=[['=IF(A6="","",IF(COUNT(E6,G6)=2,ROUND(E6*G6,2),""))']];l.getRange('N6:N105').fillDown();
l.getRange('O6').formulas=[['=IF(A6="","",IF(COUNT(E6,H6)=2,ROUND(E6*H6,2),""))']];l.getRange('O6:O105').fillDown();
l.getRange('P6').formulas=[['=IF(COUNTBLANK(A6:M6)=13,"",IF(AND(A6<>"",B6<>"",C6<>"",D6<>"",COUNT(E6,G6:H6)=3,E6>0,F6<>"",J6<>"",ISNUMBER(K6),OR(I6="Yes",I6="No"),OR(L6="Yes",L6="No"),OR(M6="Yes",M6="No")),"Review in PPO","Missing input"))']];l.getRange('P6:P105').fillDown();
l.getRange('N6:P105').format.fill=grey;l.getRange('E6:E105').setNumberFormat('0.000');l.getRange('G6:H105').setNumberFormat(money);l.getRange('N6:O105').setNumberFormat(money);l.getRange('K6:K105').setNumberFormat('dd mmm yyyy');
list(l,'D6:D105',['Product','Labour','Freight','Engineering','Subcontract']);list(l,'F6:F105',['ea','m','m2','m3','h','lot']);
for(const r of ['I6:I105','L6:L105','M6:M105'])list(l,r,['Yes','No']);
decimalValidation(l,'E6:E105',0.001,100000);decimalValidation(l,'G6:H105',0,1000000);
l.getRange('P6:P105').conditionalFormats.add('containsText',{text:'Missing input',format:{fill:'#fff1ed',font:{color:'#993b2a',bold:true}}});
l.freezePanes.freezeRows(5);l.freezePanes.freezeColumns(3);

const e=sheets['PPO export'];
base(e,'A1:Q107','PPO export','Calculated export. PPO reads named tables, checks every line and recomputes totals.');
const exportHeaders=[...lineHeaders.slice(0,13),'source_sheet','source_row','workbook_cost','workbook_sell'];
[16,16,45,19,15,12,18,18,15,16,19,13,13,22,16,20,20].forEach((w,i)=>e.getRange(`${col(i)}1:${col(i)}107`).format.columnWidth=w);
table(e,'A5:Q105',exportHeaders,'PPO_Lines');
for(let i=0;i<13;i++) {const a=col(i);e.getRange(`${a}6`).formulas=[[`=IF('Estimate lines'!$P6="","",IF('Estimate lines'!${a}6="","",'Estimate lines'!${a}6))`]];e.getRange(`${a}6:${a}105`).fillDown();}
e.getRange('N6').formulas=[['=IF(A6="","","Estimate lines")']];e.getRange('N6:N105').fillDown();
e.getRange('O6').formulas=[['=IF(A6="","",ROW())']];e.getRange('O6:O105').fillDown();
e.getRange('P6').formulas=[["=IF(A6=\"\",\"\",'Estimate lines'!N6)"]];e.getRange('P6:P105').fillDown();
e.getRange('Q6').formulas=[["=IF(A6=\"\",\"\",'Estimate lines'!O6)"]];e.getRange('Q6:Q105').fillDown();
e.getRange('A6:Q105').format.fill=grey;e.getRange('K6:K105').setNumberFormat('dd mmm yyyy');e.getRange('E6:E105').setNumberFormat('0.000');e.getRange('G6:H105').setNumberFormat(money);e.getRange('P6:Q105').setNumberFormat(money);e.freezePanes.freezeRows(5);e.freezePanes.freezeColumns(3);e.tabColor=navy;

const o=sheets.Overview;
base(o,'A1:G36','Powerplants One estimate workbook','r01 · Synthetic horticulture example · AUD excluding tax; tax is not calculated.');
[34,22,4,32,22,22,20].forEach((w,i)=>o.getRange(`${col(i)}1:${col(i)}36`).format.columnWidth=w);o.tabColor=navy;
o.getRange('A5:B5').values=[['Estimate measure','Amount']];o.getRange('A5:B5').format={fill:navy,font:{color:'#ffffff',bold:true},rowHeight:30};
o.getRange('A6:A10').values=[['All-line cost'],['All-line sell'],['Included quote sell'],['Line count'],['Lines missing input']];
o.getRange('B6:B10').formulas=[["=IF(OR(B9=0,COUNT('Estimate lines'!N6:N105)<>B9),\"\",SUM('Estimate lines'!N6:N105))"],["=IF(OR(B9=0,COUNT('Estimate lines'!O6:O105)<>B9),\"\",SUM('Estimate lines'!O6:O105))"],["=IF(OR(B9=0,COUNT('Estimate lines'!O6:O105)<>B9),\"\",SUMIFS('Estimate lines'!O6:O105,'Estimate lines'!L6:L105,\"Yes\"))"],["=100-COUNTBLANK('Estimate lines'!P6:P105)"],["=COUNTIFS('Estimate lines'!P6:P105,\"Missing input\")"]];o.getRange('B6:B8').setNumberFormat(money);
o.getRange('D5:F5').values=[['Section','Cost','Sell']];o.getRange('D5:F5').format={fill:navy,font:{color:'#ffffff',bold:true},rowHeight:30};
data.sections.forEach((section,i)=>{const row=i+6;o.getRange(`D${row}`).values=[[section[1]]];o.getRange(`E${row}:F${row}`).formulas=[[`=SUMIFS('Estimate lines'!N6:N105,'Estimate lines'!B6:B105,"${section[0]}")`,`=SUMIFS('Estimate lines'!O6:O105,'Estimate lines'!B6:B105,"${section[0]}")`]];});o.getRange('E6:F12').setNumberFormat(money);
table(o,'A15:B19',['control','value'],'PPO_Control');o.getRange('A16:A19').values=[['line_count'],['workbook_cost'],['workbook_sell'],['included_sell']];o.getRange('B16:B19').formulas=[['=B9'],['=B6'],['=B7'],['=B8']];o.getRange('B17:B19').setNumberFormat(money);
const notes=[
'1. Use Save As for each workbook revision. Keep line references stable.',
'2. Replace the fictional project, scope, sources and sample lines.',
'3. Enter costs and sell rates in amber cells. Grey cells contain formulas.',
'4. Recalculate in Excel, review outputs and record the reviewer on Project.',
'5. Upload, compare totals and resolve issues before creating a draft.',
'The 100 prepared rows match the first proposed pilot limit.',
'Blank is unknown. Zero is a deliberate numeric value. Allowance is explicit.',
'Do not add subtotal rows to the line table. Keep alternatives in separate files.',
'Include controls price. Print controls customer presentation only.',
'Workbook totals are control values, not proof of engineering adequacy.',
'Formula cells are visually identified but not locked in this r01 file.',
'PPO independently validates inputs; this workbook has no live connection.'
];notes.forEach((v,i)=>o.getRange(`A${23+i}`).values=[[v]]);
o.getRange('B10').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#fff1ed',font:{bold:true,color:'#993b2a'}}});

wb.recalculate();
// Check input propagation in a disposable edit, then restore it.
const before=o.getRange('B6:B8').values;
c.getRange('C6').values=[[6]];wb.recalculate();
const after=o.getRange('B6:B8').values;
if (Number(after[0][0])-Number(before[0][0])!==1120 || Number(after[1][0])-Number(before[1][0])!==1760) throw Error('Labour propagation failed');
c.getRange('C6').values=[[5]];wb.recalculate();
// Blank vs zero is preserved at the export boundary.
l.getRange('G6').values=[[null]];wb.recalculate();if(e.getRange('G6').values[0][0]!=='' )throw Error('Missing cost became zero');
l.getRange('G6').values=[[0]];wb.recalculate();if(Number(e.getRange('G6').values[0][0])!==0)throw Error('Explicit zero lost');
l.getRange('G6').values=[[14500]];wb.recalculate();
// A populated row without a reference must reach validation, not disappear.
l.getRange('A6').values=[[null]];wb.recalculate();
if(e.getRange('C6').values[0][0]!=='Climate controller and interface')throw Error('Missing-reference row disappeared');
l.getRange('A6').values=[['L-001']];
l.getRange('C18').values=[['Incomplete new line']];wb.recalculate();
if(e.getRange('C18').values[0][0]!=='Incomplete new line'||Number(o.getRange('B9').values[0][0])!==13||o.getRange('B6').values[0][0]!=='')throw Error('Incomplete row or total handling failed');
l.getRange('C18').values=[[null]];
// Last prepared row proves fill-down coverage and a half-cent boundary.
l.getRange('A105:M105').values=[['L-100','SEC-01','Rounding check','Product',0.001,'ea',5,5,'No','SRC-01',date('2026-09-10'),'Yes','Yes']];wb.recalculate();
if(Number(e.getRange('P105').values[0][0])!==0.01)throw Error('Last prepared row did not recalculate');
l.getRange('A105:M105').values=[Array(13).fill(null)];wb.recalculate();
const inspection=await wb.inspect({kind:'table',range:'Overview!A5:F19',include:'values,formulas',tableMaxRows:15,tableMaxCols:6,maxChars:5500});
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},maxChars:1500});
await fs.writeFile(path.join(outputDir,'workbook-checks.json'),JSON.stringify({before,after,inspection:inspection.ndjson,errors:errors.ndjson},null,2));
console.log(JSON.stringify({before,after,errors:errors.ndjson}));
const output=await SpreadsheetFile.exportXlsx(wb);await output.save(path.join(outputDir,'powerplants-one-estimate-workbook-r01.xlsx'));
for(const [name,range] of [['Overview','A1:F19'],['Project','A1:B23'],['Estimate lines','A1:H18'],['Estimate lines','I5:P18'],['Scope','A1:F12'],['Scope','H5:J8'],['Sources','A1:G11'],['Calculation','A1:F14'],['PPO export','A1:H18'],['PPO export','I5:Q18']]) {
  const image=await wb.render({sheetName:name,range,scale:1.5,format:'png'});
  await fs.writeFile(path.join(outputDir,`${name.toLowerCase().replaceAll(' ','-')}-${range.replace(':','-')}.png`),new Uint8Array(await image.arrayBuffer()));
}
