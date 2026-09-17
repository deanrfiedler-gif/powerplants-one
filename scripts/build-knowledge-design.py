#!/usr/bin/env python3
"""Build the dependency-free DK-04 review artifact from maintained source."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/knowledge'
target = root / 'docs/reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html'
html = (source / 'template.html').read_text()
for marker, filename in [('FONTS','fonts.css'),('CSS','workspace.css'),('ICONS','icons.json'),('MODEL','model.js'),('APP','workspace.js')]:
    content = (source / filename).read_text()
    if marker in {'ICONS','MODEL','APP'}:
        content = content.replace('</script', '<\\/script')
    assert html.count('/* '+marker+' */') == 1
    html = html.replace('/* '+marker+' */', content)
target.write_text(html)
print(str(target.relative_to(root)), hashlib.sha256(target.read_bytes()).hexdigest())
