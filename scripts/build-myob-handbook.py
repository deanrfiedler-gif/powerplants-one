#!/usr/bin/env python3
"""Build the standalone discovery handbook and deterministic full mapping CSV."""
import argparse
import base64
import csv
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/myob-integration'


def build(output: Path) -> None:
    data = json.loads((SOURCE / 'content.json').read_text(encoding='utf-8'))
    mappings = data['mappings']
    assert len({m['id'] for m in mappings}) == len(mappings)
    assert all(m['evidence_status'] == 'Proposed' and m['api_entity_path'] is None
               and m['evidence_ref'] is None and m['approved_by'] is None for m in mappings)
    text = (SOURCE / 'template.html').read_text(encoding='utf-8')
    replacements = {
        '__BRAND_CSS__': (SOURCE / 'brand.css').read_text(encoding='utf-8'),
        '__STYLE__': (SOURCE / 'style.css').read_text(encoding='utf-8'),
        '__BRAND_SYMBOL__': 'data:image/svg+xml;base64,' + base64.b64encode((SOURCE / 'brand-symbol.svg').read_bytes()).decode(),
        '__DATA__': json.dumps(data, ensure_ascii=False).replace('<', '\\u003c'),
        '__SCRIPT__': (SOURCE / 'handbook.js').read_text(encoding='utf-8'),
    }
    for token, value in replacements.items():
        assert text.count(token) == 1, token
        text = text.replace(token, value)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text, encoding='utf-8', newline='\n')
    buffer = io.StringIO(newline='')
    writer = csv.DictWriter(buffer, fieldnames=list(mappings[0]), lineterminator='\n')
    writer.writeheader()
    for mapping in mappings:
        writer.writerow({key: '; '.join(value) if isinstance(value, list) else value for key, value in mapping.items()})
    (ROOT / 'docs/contracts/myob-field-mappings.csv').write_text(buffer.getvalue(), encoding='utf-8', newline='\n')
    print(f'Built {output}: {len(mappings)} proposed mappings; tenant API verifications: 0')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='Standalone HTML output path, normally outside Git')
    build(parser.parse_args().output.resolve())
