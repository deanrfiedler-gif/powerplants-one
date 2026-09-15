"""Assemble the self-contained Service Review design; no runtime dependency."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = root / "docs/design/service-review"
html = (source / "template.html").read_text(encoding="utf-8")
for marker, filename in [("FONTS", "fonts.css"), ("CSS", "workspace.css"), ("ICONS", "icons.json"), ("MODEL", "model.js"), ("APP", "workspace.js")]:
    html = html.replace("/* " + marker + " */", (source / filename).read_text(encoding="utf-8"))
output = root / "docs/reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r01.html"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html, encoding="utf-8")
print(output.relative_to(root))
