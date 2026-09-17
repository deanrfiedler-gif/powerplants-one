"""Assemble the DK-06 standalone review workspace from pinned shared primitives.

Source hashes are taken over line-ending-normalised text, because the repository's
.gitattributes sets `eol=lf` only for some extensions: a Windows checkout holds the
`.ts`, `.css` and `.js` sources with CRLF while the committed blobs are LF. Raw-byte
hashing would therefore report an unchanged source as changed on Windows. Binary
files are hashed byte for byte. The assembled artifact is written with explicit LF
so the same bytes are produced on every platform.
"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/template-management'
OUTPUT = ROOT / 'docs/reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html'


def content_hash(path):
    """SHA-256 of the file, with CRLF normalised to LF for text content."""
    data = path.read_bytes()
    if b'\x00' not in data:
        data = data.replace(b'\r\n', b'\n')
    return hashlib.sha256(data).hexdigest()


manifest = json.loads((SOURCE / 'source-manifest.json').read_text(encoding='utf-8'))
for path, expected in manifest['pinned_sources'].items():
    actual = content_hash(ROOT / path)
    if actual != expected:
        raise SystemExit(
            f'Source changed; review before updating the manifest: {path}\n'
            f'  expected {expected}\n  actual   {actual}'
        )

html = (SOURCE / 'template.html').read_text(encoding='utf-8')
for marker, path in [
    ('FONTS', ROOT / 'docs/design/supplier-pricing/fonts.css'),
    ('SHARED_CSS', ROOT / 'docs/design/supplier-pricing/workspace.css'),
    ('CSS', SOURCE / 'workspace.css'),
    ('SCHEMA', SOURCE / 'schema.js'),
    ('PREVIEW', SOURCE / 'preview.js'),
    ('VALIDATION', SOURCE / 'validation.js'),
    ('MODEL', SOURCE / 'model.js'),
    ('APP', SOURCE / 'workspace.js'),
]:
    marker_text = '/* ' + marker + ' */'
    if marker_text not in html:
        raise SystemExit(f'Assembly marker missing from template.html: {marker}')
    html = html.replace(marker_text, path.read_text(encoding='utf-8'))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT, 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(html)
print(f'{OUTPUT.relative_to(ROOT)} · {OUTPUT.stat().st_size} bytes · {hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}')
