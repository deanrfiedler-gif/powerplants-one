#!/usr/bin/env python3
"""Build r03 while preserving issued r01 and r02 bytes. Evidence metadata is reused unchanged from r02."""
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]
base=root/'docs/design/specialist'
src=base/'r03'
html=(src/'template.html').read_text()
for key,path in [('FONTS',base/'fonts.css'),('CSS',src/'workspace.css'),('EVIDENCE',base/'r02/evidence.js'),('CATALOGUE',src/'catalogue.js'),('MODEL',src/'model.js'),('APP',src/'workspace.js')]:
    value=path.read_text()
    if key in ('EVIDENCE','CATALOGUE','MODEL','APP'):value=value.replace('</script','<\\/script')
    assert html.count('/* '+key+' */')==1,key
    html=html.replace('/* '+key+' */',value)
target=root/'docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html'
target.write_text(html)
print(str(target.relative_to(root)),hashlib.sha256(target.read_bytes()).hexdigest())
