"""Read-only integrity checks for this documentation evidence package."""
from pathlib import Path
import hashlib
import json
import re

root = Path(__file__).resolve().parent
hashes = json.loads((root / 'SHA256SUMS.json').read_text(encoding='utf-8'))
actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file()}
assert set(hashes) == actual - {'SHA256SUMS.json'}, 'Unlisted or missing evidence files'
for name, expected in hashes.items():
    path = (root / name).resolve()
    assert path.is_relative_to(root), f'Escaping path: {name}'
    data = path.read_bytes()
    assert expected == {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}, name

manifest = json.loads((root / 'import-manifest.json').read_text(encoding='utf-8'))
original = json.loads((root / 'provenance/original-SHA256SUMS.json').read_text(encoding='utf-8'))
assert len(manifest['files']) == manifest['sourceArchive']['members'] == 43
assert len(original) == manifest['sourceArchive']['originalMemberHashesVerified'] == 42
assert len({row['publishedPath'] for row in manifest['files']}) == 43
for row in manifest['files']:
    data = (root / row['publishedPath']).read_bytes()
    assert len(data) == row['publishedBytes'], row['publishedPath']
    assert hashlib.sha256(data).hexdigest() == row['publishedSha256'], row['publishedPath']
    if row['archivePath'] in original:
        assert original[row['archivePath']] == {'bytes': row['originalBytes'], 'sha256': row['originalSha256']}
    assert row['transformed'] == (row['publishedSha256'] != row['originalSha256'])

report = root.parents[2] / 'architecture/cce-technical-specification.md'
text = report.read_text(encoding='utf-8')
blocks = re.findall(r'^```([^\n]*)\n(.*?)^```\s*$', text, re.M | re.S)
json_blocks = [body for language, body in blocks if language.strip() == 'json']
for body in json_blocks:
    json.loads(body)
for name, language in [('reference-schema.sql', 'sql'), ('expression.ts', 'typescript'), ('rule-schema.json', 'json')]:
    reference = (root / name).read_text(encoding='utf-8').strip()
    assert any(kind.strip() == language and body.strip() == reference for kind, body in blocks), name

print(json.dumps({'status': 'PASS', 'hashedFiles': len(hashes), 'importedFiles': len(manifest['files']),
                  'transformedImportedFiles': sum(row['transformed'] for row in manifest['files']),
                  'jsonBlocks': len(json_blocks), 'matchingReferenceBlocks': 3,
                  'scope': 'Byte integrity and report/source consistency only; not independent acceptance'}, indent=2))
