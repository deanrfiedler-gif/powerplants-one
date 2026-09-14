/* Bounded browser-only OOXML reader for the design preview; no formula execution. */
(function(global){
  'use strict';
  const els=(n,tag)=>Array.from(n.getElementsByTagNameNS('*',tag));
  const xml=s=>{if(/<!DOCTYPE|<!ENTITY/i.test(s))throw Error('XML entities are unsupported.');const d=new DOMParser().parseFromString(s,'application/xml');if(els(d,'parsererror').length)throw Error('Workbook XML is invalid.');return d;};
  const resolve=(base,target)=>new URL(target,'https://workbook.invalid/'+base).pathname.slice(1);
  const toDate=v=>typeof v==='number'?new Date(Date.UTC(1899,11,30)+v*86400000).toISOString().slice(0,10):String(v??'');
  async function unzip(file){
    if(file.size>5*1024*1024)throw Error('This preview accepts files up to 5 MiB.');
    if(!/\.xlsx$/i.test(file.name))throw Error('Use a macro-free .xlsx workbook.');
    const buffer=await file.arrayBuffer(),v=new DataView(buffer),b=new Uint8Array(buffer),decode=new TextDecoder();
    let end=-1;for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){end=i;break;}
    if(end<0)throw Error('The file is not a supported Excel archive.');
    const count=v.getUint16(end+10,true);if(count>256)throw Error('The workbook contains too many archive parts for this preview.');
    let at=v.getUint32(end+16,true),total=0;const out=new Map();
    for(let i=0;i<count;i++){
      if(v.getUint32(at,true)!==0x02014b50)throw Error('Workbook archive index is invalid.');
      const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),compressed=v.getUint32(at+20,true),size=v.getUint32(at+24,true),nl=v.getUint16(at+28,true),el=v.getUint16(at+30,true),cl=v.getUint16(at+32,true),offset=v.getUint32(at+42,true),name=decode.decode(b.slice(at+46,at+46+nl));at+=46+nl+el+cl;
      total+=size;if(total>20*1024*1024||flags&1||name.includes('..')||out.has(name))throw Error('Unsupported or oversized workbook archive.');
      if(/vbaProject|externalLinks|embeddings|connections\.xml/i.test(name))throw Error('Remove macros, embedded objects and external connections for this pilot.');
      if(v.getUint32(offset,true)!==0x04034b50)throw Error('Invalid workbook part.');
      const start=offset+30+v.getUint16(offset+26,true)+v.getUint16(offset+28,true);const raw=b.slice(start,start+compressed);let bytes;
      if(method===0)bytes=raw;
      else if(method===8){const reader=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();const chunks=[];let actual=0;while(true){const {value,done}=await reader.read();if(done)break;actual+=value.length;if(actual>size||actual>20*1024*1024){await reader.cancel();throw Error('Expanded workbook part exceeds declared size.');}chunks.push(value);}bytes=new Uint8Array(actual);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}}
      else throw Error('Unsupported archive compression.');
      if(bytes.length!==size)throw Error('Workbook part is incomplete.');out.set(name,decode.decode(bytes));
    }
    return out;
  }
  async function read(file){
    const zip=await unzip(file);const doc=p=>{if(!zip.has(p))throw Error(`Workbook part missing: ${p}`);return xml(zip.get(p));};
    const book=doc('xl/workbook.xml');if(els(book,'workbookPr').some(x=>['1','true'].includes(x.getAttribute('date1904'))))throw Error('Use the standard 1900 Excel date system for this preview.');
    const shared=zip.has('xl/sharedStrings.xml')?els(doc('xl/sharedStrings.xml'),'si').map(si=>els(si,'t').map(t=>t.textContent).join('')):[];
    const relations=base=>new Map(els(doc(base),'Relationship').map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));
    const wr=relations('xl/_rels/workbook.xml.rels'),tables=Object.create(null);let formulaCount=0;
    for(const s of els(book,'sheet')){
      const sp=resolve('xl/workbook.xml',wr.get(s.getAttribute('r:id'))),sheet=doc(sp),cells=new Map();
      for(const c of els(sheet,'c')){
        const type=c.getAttribute('t'),value=els(c,'v')[0],f=els(c,'f')[0];let result=null;if(f)formulaCount++;
        if(f&&!value&&type!=='str')throw Error(`${s.getAttribute('name')}!${c.getAttribute('r')}: formula has no saved result. Recalculate and save in Excel.`);
        if(type==='e')throw Error(`${s.getAttribute('name')}!${c.getAttribute('r')}: formula error ${value?.textContent}.`);
        if(type==='s')result=shared[Number(value?.textContent)];else if(type==='inlineStr')result=els(c,'t').map(t=>t.textContent).join('');else if(type==='b')result=value?.textContent==='1';else if(type==='str')result=value?.textContent??'';else if(value&&value.textContent!=='')result=Number(value.textContent);
        cells.set(c.getAttribute('r'),result);
      }
      const tp=els(sheet,'tablePart');if(!tp.length)continue;
      const relPath=sp.replace(/([^/]+)$/,'_rels/$1.rels'),rels=relations(relPath);
      for(const part of tp){const table=els(doc(resolve(sp,rels.get(part.getAttribute('r:id')))),'table')[0];const name=table.getAttribute('name');if(tables[name])throw Error('Duplicate named table.');
        const match=table.getAttribute('ref').match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);if(!match)throw Error('Unsupported table range.');
        const number=c=>[...c].reduce((n,x)=>n*26+x.charCodeAt(0)-64,0);const letter=n=>{let a='';for(;n;n=Math.floor((n-1)/26))a=String.fromCharCode(65+(n-1)%26)+a;return a;};
        const first=Number(match[2]),last=Number(match[4]),c1=number(match[1]),c2=number(match[3]);if(last-first>1000||c2-c1>30)throw Error('Named table exceeds preview bounds.');
        const headers=Array.from({length:c2-c1+1},(_,i)=>String(cells.get(letter(c1+i)+first)||''));if(new Set(headers).size!==headers.length||headers.includes(''))throw Error('Missing or duplicate table headers.');
        const rows=[];for(let r=first+1;r<=last;r++){const values=headers.map((_,i)=>cells.get(letter(c1+i)+r)??'');if(values.every(x=>x===''))continue;rows.push(Object.fromEntries(headers.map((h,i)=>[h,values[i]])));}
        tables[name]=rows;
      }
    }
    for(const name of ['PPO_Metadata','PPO_Sections','PPO_Scope','PPO_Sources','PPO_Lines','PPO_Control'])if(!tables[name])throw Error(`Missing required table: ${name}.`);
    const expected={PPO_Metadata:['field','value'],PPO_Sections:['section_ref','label','facility_ref','growing_area_ref','system','phase'],PPO_Scope:['scope_ref','kind','text'],PPO_Sources:['source_ref','source_kind','supplier_label','document_ref','source_date','valid_until','internal_notes'],PPO_Lines:global.PPOImport.headers,PPO_Control:['control','value']};
    for(const [name,headers] of Object.entries(expected))for(const row of tables[name])if(Object.keys(row).length!==headers.length||headers.some(h=>!Object.hasOwn(row,h)))throw Error(`${name}: use the exact r01 columns.`);
    const uniquePairs=(rows,label)=>{const out=Object.create(null);for(const r of rows){const key=r.field??r.control;if(Object.hasOwn(out,key))throw Error(`Duplicate ${label}: ${key}`);out[key]=r.value;}return out;};
    const metadata=uniquePairs(tables.PPO_Metadata,'metadata field');metadata.formula_reviewed_at=toDate(metadata.formula_reviewed_at);
    return {metadata,sections:tables.PPO_Sections,scope:tables.PPO_Scope,sources:tables.PPO_Sources.map(s=>({...s,source_date:toDate(s.source_date),valid_until:toDate(s.valid_until)})),lines:tables.PPO_Lines.map(l=>({...l,source_date:toDate(l.source_date)})),control:uniquePairs(tables.PPO_Control,'control'),formulaCount};
  }
  global.PPOReadWorkbook=read;
})(globalThis);
