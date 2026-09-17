"""Build the DK-01/DK-02 standalone workspace from pinned shared primitives."""
from pathlib import Path
import hashlib
import json
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/document-library'
OUTPUT = ROOT / 'docs/reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html'
manifest = json.loads((SOURCE / 'source-manifest.json').read_text())
for path, expected in manifest.items():
    actual = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit(f'Source changed; review before updating the manifest: {path}')
html = (SOURCE / 'template.html').read_text(encoding='utf-8')
for marker, path in [('FONTS', ROOT / 'docs/design/supplier-pricing/fonts.css'),
                     ('SHARED_CSS', ROOT / 'docs/design/supplier-pricing/workspace.css'),
                     ('CSS', SOURCE / 'workspace.css'), ('MODEL', SOURCE / 'model.js'),
                     ('APP', SOURCE / 'workspace.js')]:
    html = html.replace('/* ' + marker + ' */', path.read_text(encoding='utf-8'))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(html, encoding='utf-8')
print(f'{OUTPUT.relative_to(ROOT)} · {OUTPUT.stat().st_size} bytes · {hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}')
