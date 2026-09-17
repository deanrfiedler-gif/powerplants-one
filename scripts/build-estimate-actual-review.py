#!/usr/bin/env python3
"""Build the self-contained r01 ES-09 Estimate-to-Actual Outcome Review design."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / "docs/design/estimate-actual-review"
target = root / "docs/reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html"
html = (source / "template.html").read_text(encoding="utf-8")
for marker, filename in [("FONTS", "fonts.css"), ("CSS", "workspace.css"), ("MODEL", "model.js"), ("APP", "workspace.js")]:
    contents = (source / filename).read_text(encoding="utf-8")
    if marker in {"MODEL", "APP"}:
        contents = contents.replace("</script", "<\\/script")
    assert html.count(f"/* {marker} */") == 1
    html = html.replace(f"/* {marker} */", contents)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding="utf-8")
print(f"{target.relative_to(root)}\nbytes {target.stat().st_size}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}")
