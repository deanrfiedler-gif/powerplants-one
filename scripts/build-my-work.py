#!/usr/bin/env python3
"""Assemble the standalone My Work design using the existing PPO source pattern."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / "docs/design/my-work"
target = root / "docs/reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html"
html = (source / "template.html").read_text(encoding="utf-8")
for marker, filename in [("FONTS", "fonts.css"), ("CSS", "workspace.css"), ("ASSURANCE", "assurance-model.js"), ("MODEL", "model.js"), ("APP", "workspace.js")]:
    content = (source / filename).read_text(encoding="utf-8")
    if marker in {"ASSURANCE", "MODEL", "APP"}:
        content = content.replace("</script", "<\\/script")
    assert html.count(f"/* {marker} */") == 1
    html = html.replace(f"/* {marker} */", content)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding="utf-8")
print(f"{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}")
