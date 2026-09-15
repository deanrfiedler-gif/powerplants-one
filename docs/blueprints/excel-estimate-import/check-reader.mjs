// Node component checks. Python's XML adapter is not browser DOM acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const dir=path.dirname(fileURLToPath(import.meta.url));
if(!process.argv[2])throw Error('Pass the delivered synthetic XLSX path.');
const python=process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python3';
const xmlScript=`import sys,json,xml.etree.ElementTree as E
def node(e):
 return {'tag':e.tag.split('}')[-1],'attrs':{('r:'+k.split('}')[-1] if k.startswith('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}') else k):v for k,v in e.attrib.items()},'text':''.join(e.itertext()),'children':[node(c) for c in e]}
try: print(json.dumps(node(E.fromstring(sys.stdin.read()))))
except E.ParseError: print(json.dumps({'tag':'parsererror','attrs':{},'text':'Invalid XML','children':[]}))`;
function dom(value){
  const children=value.children.map(dom);
  return {textContent:value.text,getAttribute:name=>value.attrs[name]??null,
    getElementsByTagNameNS:(_,tag)=>children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.getElementsByTagNameNS('*',tag)]),tag:value.tag};
}
const cache=new Map();
class XMLAdapter {
  parseFromString(text){
    if(!cache.has(text))cache.set(text,JSON.parse(execFileSync(python,['-c',xmlScript],{input:text,encoding:'utf8',maxBuffer:5*1024*1024})));
    return dom({tag:'#document',attrs:{},text:'',children:[cache.get(text)]});
  }
}
const context={DOMParser:XMLAdapter,URL,TextDecoder,Blob,DecompressionStream};
vm.createContext(context);
for(const name of ['model.js','workbook-reader.js'])vm.runInContext(await fs.readFile(path.join(dir,name),'utf8'),context);
const P=context.PPOImport,read=context.PPOReadWorkbook;
const bytes=await fs.readFile(process.argv[2]);
const file=(buffer,name='synthetic.xlsx')=>({name,size:buffer.length,arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)});
let count=0;
const check=async(name,fn)=>{await fn();count++;console.log(`PASS ${name}`);};
const actual=await read(file(bytes));
await check('actual compressed workbook is read and reconciled',()=>{
  assert.equal(actual.lines.length,12);assert.equal(P.validate(actual).issues.length,0);
  assert.equal(P.totals(actual.lines).cost,'62952.38');
  assert.equal(actual.lines[0].import_locator.sheet,'PPO export');assert.equal(actual.lines[0].import_locator.range,'A6:Q6');
});

// Read the existing parts. Mutated test archives are in memory and never exported.
const parts=JSON.parse(execFileSync(python,['-c',"import sys,json,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({n:z.read(n).decode('utf-8') for n in z.namelist()}))",process.argv[2]],{encoding:'utf8',maxBuffer:20*1024*1024}));
function archive(entries){
  const locals=[],central=[];let offset=0;
  for(const [name,text] of Object.entries(entries)){
    const n=Buffer.from(name),content=Buffer.from(text),local=Buffer.alloc(30),index=Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(content.length,18);local.writeUInt32LE(content.length,22);local.writeUInt16LE(n.length,26);
    index.writeUInt32LE(0x02014b50);index.writeUInt16LE(20,4);index.writeUInt16LE(20,6);index.writeUInt32LE(content.length,20);index.writeUInt32LE(content.length,24);index.writeUInt16LE(n.length,28);index.writeUInt32LE(offset,42);
    locals.push(local,n,content);central.push(index,n);offset+=local.length+n.length+content.length;
  }
  const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(entries).length,8);end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
}
const reject=async(parts,pattern)=>assert.rejects(()=>read(file(archive(parts))),pattern);
await check('stored archives retain the same estimate',async()=>assert.equal(P.totals((await read(file(archive(parts)))).lines).sell,'85607.63'));
await check('macro file extension refused',()=>assert.rejects(()=>read(file(bytes,'sample.xlsm')),/macro-free/));
await check('compressed file limit refused before reading',()=>assert.rejects(()=>read({...file(bytes),size:6*1024*1024}),/5 MiB/));
await check('embedded content refused',()=>reject({...parts,'xl/embeddings/object1.xml':'object'},/embedded/));
await check('external relationship refused',()=>reject({...parts,'xl/_rels/workbook.xml.rels':parts['xl/_rels/workbook.xml.rels'].replace('<Relationship ','<Relationship TargetMode="External" ')},/external/));
await check('unsupported date system refused',()=>reject({...parts,'xl/workbook.xml':parts['xl/workbook.xml'].replace(/<\/(?:\w+:)?workbook>/,'<workbookPr xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" date1904="true"/>$&')},/1900/));
const tablePath=Object.keys(parts).find(k=>k.startsWith('xl/tables/')&&parts[k].includes('name="PPO_Lines"'));
const ref=parts[tablePath].match(/\bref="([^"]+)"/)[1];
const subtotal=parts[tablePath].includes('totalsRowCount=')?parts[tablePath].replace(/totalsRowCount="[^"]+"/,'totalsRowCount="1"'):parts[tablePath].replace(/<(?:\w+:)?table /,'$&totalsRowCount="1" ');
await check('subtotal rows refused',()=>reject({...parts,[tablePath]:subtotal},/subtotal/));
const workingPath=Object.keys(parts).find(k=>k.startsWith('xl/tables/')&&parts[k].includes('name="PPO_EstimateLines"'));
await check('working-table subtotals do not alter export-table rules',async()=>assert.equal((await read(file(archive({...parts,[workingPath]:parts[workingPath].replace('totalsRowCount="0"','totalsRowCount="1"')})))).lines.length,12));
await check('empty tables still require the exact columns',()=>reject({...parts,[tablePath]:parts[tablePath].replace(`ref="${ref}"`,'ref="A5:P5"')},/exact r01 columns/));
await check('invalid table coordinates refused',()=>reject({...parts,[tablePath]:parts[tablePath].replace(`ref="${ref}"`,'ref="A0:Q105"')},/bounds/));
await check('XML entities refused',()=>reject({...parts,'xl/workbook.xml':'<!DOCTYPE workbook []>'+parts['xl/workbook.xml']},/entities/));
await check('truncated archive refused',()=>assert.rejects(()=>read(file(bytes.subarray(0,bytes.length-10)))));
const exportSheet=Object.keys(parts).find(k=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k)&&parts[k].includes('r="Q105"'));
const withDate=value=>parts[exportSheet].replace(/(<(?:\w+:)?c\b[^>]*\br="K6"[^>]*>[\s\S]*?<(?:\w+:)?v>)[^<]*/,`$1${value}`);
await check('Excel fictitious leap day refused',()=>reject({...parts,[exportSheet]:withDate(60)},/calendar date/));
await check('date time components cannot be silently discarded',()=>reject({...parts,[exportSheet]:withDate(46275.5)},/calendar date/));
console.log(JSON.stringify({checks:count,status:'passed',scope:'Node reader with Python XML adapter; browser DOM, event wiring and rendering remain unverified'}));
