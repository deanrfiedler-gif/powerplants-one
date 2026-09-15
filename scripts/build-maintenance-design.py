#!/usr/bin/env python3
"""Build the standalone MA-01–MA-05 design without runtime dependencies."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / "docs/design/maintenance"
target = root / "docs/reference/ui/maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html"
html = (source / "template.html").read_text(encoding="utf-8")
for marker, filename in [("FONTS", "fonts.css"), ("CSS", "workspace.css"), ("ICONS", "icons.json"), ("MODEL", "model.js"), ("APP", "workspace.js")]:
    contents = (source / filename).read_text(encoding="utf-8")
    if marker in {"APP", "MODEL", "ICONS"}:
        contents = contents.replace("</script", "<\\/script")
    assert html.count(f"/* {marker} */") == 1
    html = html.replace(f"/* {marker} */", contents)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding="utf-8")
print(f"{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}")
