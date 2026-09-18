#!/usr/bin/env python3
"""Assemble the standalone CS-02 / CS-03 Contacts, Stakeholders & Relationships design.

The builder is deterministic on every platform. Sources are read as bytes and normalised to
LF before assembly, because .css and .js are not pinned to LF by .gitattributes and would
otherwise carry CRLF into the HTML on a Windows checkout, while the committed .html is LF.
Normalising here is what makes "rebuild and compare byte for byte" mean the same thing in
CI and on a developer machine.

  python scripts/build-contacts-design.py            rebuild the design HTML
  python scripts/build-contacts-design.py --check    fail if the committed HTML is stale
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/design/contacts"
TARGET = ROOT / "docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html"
EVIDENCE = ROOT / "docs/testing/evidence/contacts-r01"

MARKERS = [
    ("FONTS", "fonts.css"),
    ("CSS", "workspace.css"),
    ("FIXTURES", "fixtures.json"),
    ("MODEL", "model.js"),
    ("APP", "workspace.js"),
]


def text(path: Path) -> str:
    """Read a source file with newlines normalised to LF, whatever the checkout did."""
    return path.read_bytes().replace(b"\r\n", b"\n").decode("utf-8")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Compare the rebuilt HTML with the committed file instead of writing it.")
    args = parser.parse_args()

    pins = json.loads(text(SOURCE / "source-pins.json"))

    # Reused assets are pinned. A changed font or icon set is a deliberate act, not a drift.
    for name, expected in pins["assetPins"].items():
        actual = sha(text(SOURCE / name).encode("utf-8"))
        if actual != expected:
            raise SystemExit(f"Reused asset changed: {name}\n  expected {expected}\n  actual   {actual}")

    # Contract sources are pinned by content, so the design cannot silently describe a rule
    # that has since been rewritten. A mismatch is a prompt to re-read, not a reason to edit.
    drift = []
    for name, expected in pins["contractPins"].items():
        path = ROOT / name
        if not path.exists():
            drift.append(f"{name}: missing at this commit")
            continue
        actual = sha(text(path).encode("utf-8"))
        if actual != expected:
            drift.append(f"{name}: {expected[:12]}… -> {actual[:12]}…")
    if drift:
        raise SystemExit("Pinned contract sources changed; re-read them before rebuilding:\n  "
                         + "\n  ".join(drift))

    icons = json.loads(text(SOURCE / "icons.json"))
    html = text(SOURCE / "template.html")

    for marker, filename in MARKERS:
        body = text(SOURCE / filename)
        if marker == "FIXTURES":
            # Keep the fixture exactly as committed, so the manifest hash describes the file.
            body = "globalThis.CONTACTS_FIXTURES=" + body.strip() + ";"
        if filename.endswith((".js", ".json")):
            body = re.sub(r"</script", r"<\\/script", body, flags=re.IGNORECASE)
        token = f"/* {marker} */"
        if html.count(token) != 1:
            raise SystemExit(f"Template marker {marker} appears {html.count(token)} times; expected 1.")
        html = html.replace(token, body)

    icon_js = "globalThis.CONTACTS_ICONS=" + json.dumps(icons, sort_keys=True, separators=(",", ":")) + ";"
    html = html.replace("globalThis.CONTACTS_FIXTURES=", icon_js + "globalThis.CONTACTS_FIXTURES=", 1)

    if re.search(r"/\* (FONTS|CSS|FIXTURES|MODEL|APP) \*/", html):
        raise SystemExit("An assembly marker survived the build.")

    data = html.encode("utf-8")

    if args.check:
        if not TARGET.exists():
            raise SystemExit(f"{TARGET.relative_to(ROOT)} does not exist. Run the builder first.")
        committed = TARGET.read_bytes()
        if committed != data:
            raise SystemExit(
                "The committed HTML is out of date.\n"
                f"  committed {sha(committed)} ({len(committed)} bytes)\n"
                f"  rebuilt   {sha(data)} ({len(data)} bytes)")
        print(f"Verified {TARGET.relative_to(ROOT)}")
        print(f"SHA-256 {sha(data)} · {len(data)} bytes")
        return 0

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_bytes(data)

    manifest = {
        "scope": "CS-02 / CS-03",
        "revision": "r01",
        "buildDate": "2026-09-18",
        "sourceCommit": pins["sourceCommit"],
        "themeEdition": pins["themeEdition"],
        "htmlSHA256": sha(data),
        "htmlBytes": len(data),
        "sources": {name: sha(text(SOURCE / name).encode("utf-8"))
                    for name in sorted(p.name for p in SOURCE.iterdir()
                                       if p.suffix in (".js", ".css", ".json", ".html"))},
        "contractPins": pins["contractPins"],
        "receivingBoundary": "Local synthetic contact records only. No API connection, no send, "
                             "no issue, no acknowledgement.",
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "build-manifest.json").write_bytes(
        (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8"))

    print(f"{TARGET.relative_to(ROOT)}")
    print(f"SHA-256 {sha(data)} · {len(data)} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
