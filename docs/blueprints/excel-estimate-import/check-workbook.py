"""Read-only structural and decimal checks of the authored workbook."""
import sys, json, zipfile, posixpath
from pathlib import Path
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from xml.etree import ElementTree as ET

file=Path(sys.argv[1]); output=Path(sys.argv[2])
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
with zipfile.ZipFile(file) as z:
    assert z.testzip() is None
    shared=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        shared=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    def parse(p): return ET.fromstring(z.read(p))
    def resolve(base,target): return posixpath.normpath(posixpath.join(posixpath.dirname(base),target)).lstrip('/')
    def rels(p): return {r.attrib['Id']:r.attrib['Target'] for r in parse(p)}
    workbook=parse('xl/workbook.xml');wr=rels('xl/_rels/workbook.xml.rels');tables={};formula_count=0;validation_count=0;views=[]
    for sheet in workbook.find('m:sheets',ns):
        sp=resolve('xl/workbook.xml',wr[sheet.attrib['{'+ns['r']+'}id']]);root=parse(sp);cells={}
        for c in root.findall('.//m:sheetData/m:row/m:c',ns):
            v=c.find('m:v',ns);f=c.find('m:f',ns);t=c.attrib.get('t');value=None
            if f is not None:
                formula_count+=1
                assert v is not None or t=='str', (sheet.attrib['name'],c.attrib['r'],'missing numeric formula cache')
            assert t!='e',(sheet.attrib['name'],c.attrib['r'],v.text if v is not None else 'error')
            if t=='s':value=shared[int(v.text)]
            elif t=='inlineStr':value=''.join(c.find('m:is',ns).itertext())
            elif t=='str':value=v.text or '' if v is not None else ''
            elif t=='b':value=v.text=='1'
            elif v is not None and v.text:value=float(v.text)
            cells[c.attrib['r']]=value
        validation_count+=len(root.findall('.//m:dataValidation',ns))
        views.append({'sheet':sheet.attrib['name'],'gridlines':root.find('m:sheetViews/m:sheetView',ns).attrib.get('showGridLines'),'frozen':root.find('m:sheetViews/m:sheetView/m:pane',ns) is not None,'protected':root.find('m:sheetProtection',ns) is not None})
        parts=root.find('m:tableParts',ns)
        if parts is None:continue
        rp=posixpath.join(posixpath.dirname(sp),'_rels',posixpath.basename(sp)+'.rels');rr=rels(rp)
        for part in parts:
            table=parse(resolve(sp,rr[part.attrib['{'+ns['r']+'}id']]))
            import re
            a,r,b,last=re.fullmatch(r'([A-Z]+)(\d+):([A-Z]+)(\d+)',table.attrib['ref']).groups();r=int(r);last=int(last)
            def ci(s):
                v=0
                for c in s:v=v*26+ord(c)-64
                return v
            def cn(i):
                s=''
                while i:i,n=divmod(i-1,26);s=chr(65+n)+s
                return s
            columns=[cn(i) for i in range(ci(a),ci(b)+1)];headers=[cells.get(c+str(r)) for c in columns];rows=[]
            for y in range(r+1,last+1):
                values=[cells.get(c+str(y)) for c in columns]
                if all(v is None or v=='' for v in values):continue
                rows.append(dict(zip(headers,['' if v is None else v for v in values])))
            tables[table.attrib['name']]=rows
    def calendar(value):return (datetime(1899,12,30)+timedelta(days=value)).strftime('%Y-%m-%d') if isinstance(value,(float,int)) else value
    metadata={r['field']:r['value'] for r in tables['PPO_Metadata']};metadata['formula_reviewed_at']=calendar(metadata['formula_reviewed_at']);metadata['schema_version']=str(int(metadata['schema_version']))
    lines=tables['PPO_Lines'];sources=tables['PPO_Sources']
    for line in lines:line['source_date']=calendar(line['source_date'])
    for source in sources:
        source['source_date']=calendar(source['source_date']);source['valid_until']=calendar(source['valid_until'])
    control={r['control']:r['value'] for r in tables['PPO_Control']}
    def extension(q,p):return (Decimal(str(q))*Decimal(str(p))).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
    cost=sum(extension(l['quantity'],l['unit_cost']) for l in lines);sell=sum(extension(l['quantity'],l['unit_sell']) for l in lines)
    assert cost==Decimal('62952.38') and sell==Decimal('85607.63')
    assert len(lines)==12 and int(control['line_count'])==12
    assert len(tables['PPO_Sections'])==7
    for l in lines:
        assert extension(l['quantity'],l['unit_cost'])==Decimal(str(l['workbook_cost']))
        assert extension(l['quantity'],l['unit_sell'])==Decimal(str(l['workbook_sell']))
    assert Decimal(str(control['workbook_cost']))==cost and Decimal(str(control['included_sell']))==sell
    assert len(views)==7 and validation_count>0 and all(v['gridlines']=='0' for v in views)
    result={'metadata':metadata,'lines':lines,'sections':tables['PPO_Sections'],'scope':tables['PPO_Scope'],'sources':sources,'control':control}
    output.write_text(json.dumps(result,indent=2))
    print(json.dumps({'status':'passed','lines':len(lines),'cost':str(cost),'sell':str(sell),'formula_cells':formula_count,'validation_rules':validation_count,'views':views},indent=2))
