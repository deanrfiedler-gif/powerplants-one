#!/usr/bin/env python3
"""Build portable SH-06; source is the editable authority for this design."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/approvals-handover'
target = root / 'docs/reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html'
html = (source / 'template.html').read_text()
for marker, name in [('FONTS','fonts.css'),('CSS','workspace.css'),('ICONS','icons.json'),('MODEL','model.js'),('APP','workspace.js')]:
    value = (source / name).read_text()
    if marker in {'ICONS','MODEL','APP'}:
        value = value.replace('</script', '<\\/script')
    assert html.count(f'/* {marker} */') == 1
    html = html.replace(f'/* {marker} */', value)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html)
print(f'{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
