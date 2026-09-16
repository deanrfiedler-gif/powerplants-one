#!/usr/bin/env python3
"""Build the self-contained CR-03 Sales-to-Delivery Handover design r01.

Deterministic, standard library only. Edit the sources under
docs/design/sales-delivery-handover/ and rebuild; never hand-edit the output.
"""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
source = root / "docs/design/sales-delivery-handover"
target = root / "docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html"

# The accepted commercial basis reproduces the retained customer quotation r03
# document. Its bytes must not have moved under the design.
quotation = root / "docs/reference/ui/quoting/ppo-quotation-module-r03.html"
expected = "7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a"
actual = hashlib.sha256(quotation.read_bytes()).hexdigest()
assert actual == expected, (
    f"Retained quotation r03 changed ({actual}). Review the accepted commercial "
    "basis before rebuilding; do not remove this guard."
)

# The embedded r20 Roboto faces are reused from the Quality & Site Assurance
# source rather than duplicated. Pin the bytes so a change upstream is a reviewed
# decision, not a silent difference in this output.
fonts = root / "docs/design/quality-site-assurance/fonts.css"
fonts_expected = "57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef"
fonts_actual = hashlib.sha256(fonts.read_bytes()).hexdigest()
assert fonts_actual == fonts_expected, (
    f"Shared r20 Roboto source changed ({fonts_actual}). Review the font provenance "
    "before rebuilding; do not remove this guard."
)

# The shared workspace styles are inherited from the Quality & Site Assurance
# source with this module's scope prefix, then extended by additions.css. The
# baseline is pinned for the same reason as the fonts: an upstream change must be
# a reviewed decision, not a silent difference here.
shared = root / "docs/design/quality-site-assurance/workspace.css"
shared_expected = "e50a0974bb7e60701aa7be30717229319adc57bde7693076bdf0d72f7ae12d8d"
shared_text = shared.read_text(encoding="utf-8")
shared_actual = hashlib.sha256(shared_text.encode("utf-8")).hexdigest()
assert shared_actual == shared_expected, (
    f"Shared workspace styles changed ({shared_actual}). Review the inherited "
    "baseline before rebuilding; do not remove this guard."
)
stylesheet = shared_text.replace("#ppo-assurance", "#ppo-handover") + (source / "additions.css").read_text(encoding="utf-8")

html = (source / "template.html").read_text(encoding="utf-8")
for marker, contents in [("FONTS", fonts.read_text(encoding="utf-8")), ("CSS", stylesheet),
                         ("MODEL", (source / "model.js").read_text(encoding="utf-8")),
                         ("APP", (source / "workspace.js").read_text(encoding="utf-8"))]:
    if marker in {"MODEL", "APP"}:
        contents = contents.replace("</script", "<\\/script")
    assert html.count(f"/* {marker} */") == 1, f"Template marker {marker} is missing or duplicated"
    html = html.replace(f"/* {marker} */", contents)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html, encoding="utf-8")
print(f"{target.relative_to(root)}\nSHA-256 {hashlib.sha256(target.read_bytes()).hexdigest()}\nQuotation r03 SHA-256 {actual}\nShared Roboto SHA-256 {fonts_actual}\nInherited workspace styles SHA-256 {shared_actual}")
