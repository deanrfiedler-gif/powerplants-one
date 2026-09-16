#!/usr/bin/env python3
"""Build r02 while preserving issued r01 bytes."""
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]
src=root/'docs/design/specialist/r02'
html=(src/'template.html').read_text()
for key,path in [('FONTS',src.parent/'fonts.css'),('CSS',src/'workspace.css'),('EVIDENCE',src/'evidence.js'),('MODEL',src/'model.js'),('APP',src/'workspace.js')]:
    value=path.read_text()
    if key in ('EVIDENCE','MODEL','APP'):value=value.replace('</script','<\\/script')
    assert html.count('/* '+key+' */')==1
    html=html.replace('/* '+key+' */',value)
target=root/'docs/reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r02.html'
target.write_text(html)
print(str(target.relative_to(root)),hashlib.sha256(target.read_bytes()).hexdigest())
