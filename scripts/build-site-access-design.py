#!/usr/bin/env python3
"""Assemble the standalone CS-06 HTML from reviewable local sources."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/site-access'
target = root / 'docs/reference/ui/site-access/PPO-Site-Access-and-Horticultural-Readiness-r01.html'
html = (source / 'template.html').read_text()
for marker, filename in [('FONTS','fonts.css'),('CSS','workspace.css'),('MODEL','model.js'),('APP','workspace.js')]:
    assert html.count(f'/* {marker} */') == 1
    html = html.replace(f'/* {marker} */', (source / filename).read_text().replace('</script','<\\/script'))
target.write_text(html)
print(f'{target.relative_to(root)}: {hashlib.sha256(target.read_bytes()).hexdigest()}')
