#!/usr/bin/env python3
"""Assemble the standalone Order Fulfilment & Customer Delivery design.

Uses the existing PPO source pattern: a semantic template with assembly markers,
the verified theme r20 Roboto faces, scoped styles, a pure coordination model and
the interactive workspace. The output is deterministic for a given source tree.
"""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / "docs/design/order-fulfilment"
target = root / "docs/reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html"
html = (source / "template.html").read_text(encoding="utf-8")
for marker, filename in [("FONTS", "fonts.css"), ("CSS", "workspace.css"), ("MODEL", "model.js"), ("APP", "workspace.js")]:
    content = (source / filename).read_text(encoding="utf-8")
    if marker in {"MODEL", "APP"}:
        content = content.replace("</script", "<\\/script")
    assert html.count(f"/* {marker} */") == 1, f"expected exactly one {marker} marker"
    html = html.replace(f"/* {marker} */", content)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding="utf-8")
print(f"{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}")
