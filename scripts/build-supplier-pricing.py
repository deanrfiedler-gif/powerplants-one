"""Assemble the standalone PD-03 / ES-03 review workspace deterministically."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/supplier-pricing'
OUTPUT = ROOT / 'docs/reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html'
html = (SOURCE / 'template.html').read_text(encoding='utf-8')
for marker, name in [('FONTS', 'fonts.css'), ('CSS', 'workspace.css'), ('MODEL', 'model.js'), ('APP', 'workspace.js')]:
    html = html.replace('/* ' + marker + ' */', (SOURCE / name).read_text(encoding='utf-8'))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(html, encoding='utf-8')
print(OUTPUT.relative_to(ROOT))
