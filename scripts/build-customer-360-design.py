#!/usr/bin/env python3
"""Reproducibly assemble the CS-01 Customer 360 design into one portable HTML file.

The output is a single self-contained file: no external script, stylesheet, font or
image request is made. Design tokens in the metadata block are read from the CSS
itself, so the recorded token set cannot drift from the stylesheet it describes.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/customer-360'
TARGET = ROOT / 'docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html'

THEME_BOARD = ROOT / 'docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html'
FONT_SOURCE = ROOT / 'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html'


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tokens_from(css):
    """Read the :root custom-property block so the metadata matches the stylesheet."""
    match = re.search(r':root\{(.*?)\}', css, re.S)
    if not match:
        raise SystemExit('No :root token block found in workspace.css')
    pairs = re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', match.group(1))
    return {name: value.strip() for name, value in pairs}


def main():
    html = (SOURCE / 'template.html').read_text(encoding='utf-8')
    fonts = (SOURCE / 'fonts.css').read_text(encoding='utf-8')
    css = (SOURCE / 'workspace.css').read_text(encoding='utf-8')
    icons = (SOURCE / 'icons.json').read_text(encoding='utf-8').strip()
    choice = (SOURCE / 'choice.js').read_text(encoding='utf-8')
    model = (SOURCE / 'model.js').read_text(encoding='utf-8')
    app = (SOURCE / 'workspace.js').read_text(encoding='utf-8')

    metadata = {
        'revision': 'r01',
        'document_id': 'PPO-CS01-HTML',
        'title': 'Customer 360 Workspace',
        'register_entry': 'CS-01 — Customer register and customer 360',
        'theme_revision': 'r20',
        'theme_sha256': sha256(THEME_BOARD),
        'profile': 'Intake / data and forms, with register and review composition',
        'tokens': tokens_from(css),
        'font_source': 'docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html',
        'font_source_sha256': sha256(FONT_SOURCE),
        'fonts_css_sha256': hashlib.sha256(fonts.encode('utf-8')).hexdigest(),
        'coverage': ['CS-01', 'CS-02', 'CS-03'],
        'presents': ['CR-01', 'ES-05', 'ES-06', 'ES-07', 'SV-01', 'SV-02', 'SV-03', 'SV-06', 'SV-07',
                     'PJ-01', 'PJ-05', 'PJ-09', 'MA-01', 'MA-05', 'MA-06', 'MA-07',
                     'EQ-01', 'EQ-03', 'FN-02', 'AD-04', 'AD-05', 'EC-01', 'DK-02'],
        'extends': ['CS-04', 'CS-05', 'CS-06'],
        'erp_authority': 'MYOB Acumatica — intended authority for ERP order and account information; live integration outstanding',
        'composition': 'Workspace only; no application shell, brand masthead, global rail or global breadcrumb',
        'data': 'Synthetic throughout; every organisation, person, address, order, amount and document is fictional',
        'verification': 'Source and DOM emulation; no native browser, device or visual acceptance is asserted.',
    }

    replacements = [
        ('FONTS', fonts),
        ('CSS', css),
        ('METADATA', json.dumps(metadata, ensure_ascii=False)),
        ('ICONS', icons),
        ('CHOICE', choice),
        ('MODEL', model),
        ('APP', app),
    ]
    for marker, value in replacements:
        if marker in {'METADATA', 'ICONS', 'CHOICE', 'MODEL', 'APP'}:
            value = value.replace('</script', '<\\/script')
        token = f'/* {marker} */'
        if html.count(token) != 1:
            raise SystemExit(f'Template marker {token} must appear exactly once')
        html = html.replace(token, value)

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(html, encoding='utf-8', newline='\n')
    print(f'{TARGET.relative_to(ROOT)}\nbytes {TARGET.stat().st_size}\nSHA-256 {sha256(TARGET)}')


if __name__ == '__main__':
    main()
