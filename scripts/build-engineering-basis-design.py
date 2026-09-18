#!/usr/bin/env python3
"""Build the EN-02 standalone synthetic review artifact deterministically."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[1]
source = root / 'docs/design/engineering-basis'
target = root / 'docs/reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html'
html = (source / 'template.html').read_text()
for marker, filename in [('FONTS', 'fonts.css'), ('CSS', 'workspace.css'), ('LOCATIONS', 'location-context.json'), ('MODEL', 'model.js'), ('APP', 'workspace.js')]:
    content = (source / filename).read_text()
    if marker in {'MODEL', 'APP', 'LOCATIONS'}:
        content = content.replace('</script', '<\\/script')
    assert html.count(f'/* {marker} */') == 1
    html = html.replace(f'/* {marker} */', content)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html)
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
manifest = {
    'scope': 'EN-02', 'revision': 'r01',
    'source_checkpoint': '108b1600152ee12443c75ffaf7feb7cc857316f5',
    'status': 'Synthetic design; native browser and owner review pending',
    'artifact': {'path': str(target.relative_to(root)), 'bytes': target.stat().st_size, 'sha256': digest(target)},
    'inputs': [{'path': str((source / name).relative_to(root)), 'sha256': digest(source / name)}
               for name in ['template.html', 'fonts.css', 'workspace.css', 'location-context.json', 'model.js', 'workspace.js']],
    'references': {
        'theme': {'name': 'powerplants-one-theme-style-board-r22.html', 'supplied_version': 2, 'sha256': 'a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0'},
        'location_source': {'path': 'docs/reference/ui/customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html', 'sha256': digest(root / 'docs/reference/ui/customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html'), 'extraction': 'Unchanged parsed location-context JSON; authored EN-02 successor evidence is separate'}
    }
}
(source / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}')
