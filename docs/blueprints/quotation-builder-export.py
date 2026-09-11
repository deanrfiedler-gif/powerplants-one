#!/usr/bin/env python3
"""Export the standalone design with its existing brand assets embedded.

Usage: python3 docs/blueprints/quotation-builder-export.py /absolute/output.html
This does not generate or issue an application quotation.
"""
from pathlib import Path
import base64
import sys

source = Path(__file__).resolve().parent
repo = source.parents[1]
target = Path(sys.argv[1]).resolve()
html = (source / 'quotation-builder.html').read_text()
css = (source / 'quotation-builder.css').read_text()
js = (source / 'quotation-builder.js').read_text()
for relative, mime in [('../../public/brand/powerplants-logo-green-white.png', 'image/png'), ('../../public/brand/Roboto-variable.woff', 'font/woff')]:
    data = 'data:' + mime + ';base64,' + base64.b64encode((source / relative).read_bytes()).decode('ascii')
    html = html.replace(relative, data)
    css = css.replace(relative, data)
    js = js.replace(relative, data)
html = html.replace('<link rel="stylesheet" href="quotation-builder.css">', '<style>' + css + '</style>')
html = html.replace('<script src="quotation-builder.js"></script>', '<script>' + js + '</script>')
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(html)
print(target)
