#!/usr/bin/env python3
"""Export the repository-native preview as one offline HTML file. No network."""
import argparse
import base64
import re
import html as html_escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent

def export(destination):
    html = (HERE / 'index.html').read_text()
    css = (HERE / 'styles.css').read_text()
    font = ROOT / 'public/brand/Roboto-variable.woff'
    logo = ROOT / 'docs/standards/ui-assets/powerplants-logo-green-white.png'
    css = css.replace('../../../public/brand/Roboto-variable.woff', 'data:font/woff;base64,' + base64.b64encode(font.read_bytes()).decode())
    html, count = re.subn(r'<link\s+rel="stylesheet"\s+href="styles.css"\s*/?>', lambda _: '<style>' + css + '</style>', html)
    assert count == 1, 'Expected exactly one stylesheet entry'
    for filename in ('fixtures.js', 'app.js'):
        js = (HERE / filename).read_text()
        js = js.replace('../../standards/ui-assets/powerplants-logo-green-white.png', 'data:image/png;base64,' + base64.b64encode(logo.read_bytes()).decode())
        html, count = re.subn(r'<script\s+src="' + re.escape(filename) + r'"\s*></script>', lambda _: '<script>' + js.replace('</script', '<\\/script') + '</script>', html)
        assert count == 1, f'Expected exactly one script entry for {filename}'
    assert '<script src=' not in html and 'href="styles.css"' not in html
    assert 'data:font/woff;base64,' in html and 'data:image/png;base64,' in html
    assert '../../../public/' not in html and '../../standards/ui-assets/' not in html
    licence = (ROOT / "public/brand/Roboto-OFL.txt").read_text()
    html = html.replace("</body>", '<template id="roboto-licence">' + html_escape.escape(licence) + "</template></body>")
    path = Path(destination)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html)
    print(f'Exported {path} ({path.stat().st_size} bytes)')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination')
    export(parser.parse_args().destination)
