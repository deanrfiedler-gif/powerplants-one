#!/usr/bin/env python3
"""Assemble the ES-04 r01 standalone review artifact deterministically."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/estimate-review'
target = root / 'docs/reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-r01.html'
html = (source / 'template.html').read_text()
for marker, filename in [('FONTS', 'fonts.css'), ('CSS', 'workspace.css'), ('MODEL', 'model.js'), ('APP', 'workspace.js')]:
    value = (source / filename).read_text()
    if marker in {'MODEL', 'APP'}:
        value = value.replace('</script', '<\\/script')
    assert html.count(f'/* {marker} */') == 1
    html = html.replace(f'/* {marker} */', value)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html)
print(f'{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
