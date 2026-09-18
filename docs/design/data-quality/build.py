from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parent
ws=root.parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
pins=json.loads((root/'source-pins.json').read_text())
for name,expected in pins['assetPins'].items():
 assert sha(root/name)==expected,'Reused asset changed: '+name
for typ in ['theme','plan']:
 ref=ws/'references'/pins[typ+'File']
 if ref.exists():assert sha(ref)==pins[typ+'SHA256'],'Reference changed: '+typ
fonts=(root/'fonts.css').read_text()
(ws/'evidence').mkdir(exist_ok=True)
icons=json.loads((root/'icons.json').read_text())
meta={'scope':'AD-03','revision':'r01','buildDate':'2026-09-18','repositoryBaseline':'108b1600152ee12443c75ffaf7feb7cc857316f5','theme':'Powerplants One Theme & Style Board r22','themeSHA256':pins['themeSHA256'],'planSHA256':pins['planSHA256'],'sources':{p.name:sha(p) for p in root.iterdir() if p.suffix in ['.js','.css','.json','.html']},'receivingBoundary':'Local synthetic Equipment simulator only; no API connections','fontProvenance':'Embedded PPOBoardRoboto from supplied theme board; original source attribution and accompanying repository Roboto licence retained in the source package.'}
template=(root/'template.html').read_text()
for marker,value in {'FONTS':fonts,'CSS':(root/'workspace.css').read_text(),'META':json.dumps(meta,ensure_ascii=False),'SEED':(root/'fixtures.json').read_text(),'ICONS':json.dumps(icons),'MODEL':(root/'model.js').read_text(),'APP':(root/'workspace.js').read_text()}.items():
 assert template.count('/*'+marker+'*/')==1,marker
 if marker not in ['FONTS','CSS']:value=re.sub(r'</script',r'<\\/script',value,flags=re.I)
 template=template.replace('/*'+marker+'*/',value)
for m,n in {'SCAN':'check','PLUS':'plus','HELP':'info','OPTIONS':'more'}.items():template=template.replace('__ICON_'+m+'__','<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">'+icons[n]+'</svg>')
assert not re.search(r'/\*(FONTS|CSS|META|SEED|ICONS|MODEL|APP)\*/',template)
out=ws/'PPO-Data-Quality-Workbench-r01.html';out.write_text(template)
(ws/'evidence/build-manifest.json').write_text(json.dumps({**meta,'htmlSHA256':sha(out),'htmlBytes':out.stat().st_size},indent=2))
print(out, out.stat().st_size, sha(out))
