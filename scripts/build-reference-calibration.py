"""Assemble the ES-10 standalone HTML without network access or dependencies."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/reference-calibration'
OUTPUT = ROOT / 'docs/reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-r01.html'
html = (SOURCE / 'template.html').read_text(encoding='utf-8')
for marker, filename in [('FONTS','fonts.css'), ('CSS','workspace.css'), ('MODEL','model.js'), ('APP','workspace.js')]:
    html = html.replace('/* '+marker+' */', (SOURCE / filename).read_text(encoding='utf-8'))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(html, encoding='utf-8')
print(OUTPUT.relative_to(ROOT))
