"""Build the self-contained CR-01 review artifact without external assets."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/deal-workspace'
TARGET = ROOT / 'docs/reference/ui/crm/PPO-Deal-Workspace-r01.html'
metadata = {
    'scope': 'CR-01', 'revision': 'r01', 'date': '2026-09-17',
    'status': 'Synthetic design for review; not application integration',
    'parents': ['CRM-02', 'CRM-03', 'CRM-04', 'CRM-05', 'CRM-07', 'CRM-08'],
    'pageType': 'Record detail', 'supportingTypes': ['Form / guided workflow', 'Document & evidence workspace'],
    'base': 'aa94dcdcb1dd08798be240325857c3d32d04af02',
    'r36Sha256': '918f8c54798d7844ce5b16d5d8cf3b9ff5a6b25940bca94563a3b9cb978b06f1',
    'themeR20Blob': '462dac4943fb4350cf5739787a1d29e7e096716d',
    'persistence': 'Session memory only; reload resets synthetic fixtures',
    'sourceHashes': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(SOURCE.iterdir()) if p.suffix in ['.js', '.css', '.json']}
}
html = (SOURCE / 'template.html').read_text()
for marker, name in [('FONTS','fonts.css'),('CSS','workspace.css'),('FIXTURES','fixtures.js'),('MODEL','model.js'),('APP','workspace.js'),('ICONS','icons.json')]:
    text = (SOURCE / name).read_text()
    if name.endswith('.js'):
        text = text.replace('</script', '<\\/script')
    html = html.replace('/* '+marker+' */', text)
html = html.replace('/* METADATA */', json.dumps(metadata, ensure_ascii=False))
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(html)
print(str(TARGET.relative_to(ROOT))+' '+hashlib.sha256(html.encode()).hexdigest())
