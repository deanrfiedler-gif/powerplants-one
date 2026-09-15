"""Build the standalone review artifact from maintained model/app/styles and theme assets."""
from pathlib import Path
import re, json, hashlib, sys

HERE=Path(__file__).resolve().parent
if len(sys.argv)>1:
    theme=Path(sys.argv[1]).read_text(encoding='utf-8')
    expected='e55ccbabef40a0b07a95ee5847f99147a8f29e8f7c84f90497df2b4d5e6696ab'
    assert hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()==expected
    start=theme.index('#ppo-theme-board{');end=theme.index('}',start)
    tokens=theme[start:end+1].replace('#ppo-theme-board','#ppo-naming',1)
    fonts=re.findall(r'@font-face\s*\{[^}]*\}',theme)
    assert len(fonts)==3
    from html.parser import HTMLParser
    class Logo(HTMLParser):
        image=None
        def handle_starttag(self,tag,attrs):
            a=dict(attrs)
            if tag=='img' and 'r08-header-mark' in a.get('class',''): self.image=a['src']
    logo=Logo();logo.feed(theme);assert logo.image
    (HERE/'theme-assets.json').write_text(json.dumps({'source':'Powerplants One Theme & Style Board r18','source_sha256':expected,'tokens':tokens,'fonts':fonts,'logo':logo.image},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assets=json.loads((HERE/'theme-assets.json').read_text())
nav=[('filing','Filing','M6 3h8l4 4v14H6z M14 3v5h5 M9 12h6 M9 16h6'),('review','Naming review','M9 5h10v16H5V5h2 M9 3h6v4H9z M8 12l2 2 5-5 M8 18h8'),('communications','Communications','M3 5h18v14H3z M3 6l9 7 9-7'),('libraries','Libraries','M3 6h7l2 3h9v11H3z M3 6V4h7l2 2h8'),('history','History','M3 11a9 9 0 1 1 2 7 M3 5v6h6 M12 7v6l4 2')]
buttons=''.join(f'<button type="button" data-action="nav:{key}" aria-label="{label}" title="{label}"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="{path}"></path></svg><span class="nav-label">{label}</span>'+('<span class="count" id="review-count">4</span>' if key=='review' else '')+'</button>' for key,label,path in nav)
html='''<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="PPO Naming and Filing r01 — an isolated synthetic design review, not a live integration."><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>Powerplants One — Naming &amp; Filing · r01</title><link rel="icon" href="data:,"><style>'''+ '\n'.join(assets['fonts'])+'\n'+assets['tokens']+'\n'+(HERE/'styles.css').read_text()+'''</style></head>
<body id="ppo-naming"><a class="skip" href="#main">Skip to content</a><div class="shell"><aside class="rail"><div class="brand"><img alt="Powerplants One symbol" src="'''+assets['logo']+'''"><div><strong>Powerplants<br>One</strong><small>Connected work</small></div></div><p class="rail-caption">Information control</p><nav class="nav" aria-label="Naming and filing views">'''+buttons+'''</nav><div class="rail-foot"><span>Prototype r01</span>Synthetic information only<br>Theme board r18</div></aside><div class="workspace"><header class="topbar"><div class="crumb"><span>Documents &nbsp;/&nbsp; </span><b id="view-label">Naming &amp; filing</b></div><div class="top-actions"><span class="badge info">Design preview r01</span><button type="button" class="btn" id="actor-control" data-choice="actor-control" aria-label="Preview identity" aria-haspopup="menu" aria-expanded="false">Reviewer</button><button type="button" class="btn quiet small" data-action="reset" aria-label="Reset sample">Reset</button></div></header><main id="main" tabindex="-1"></main></div></div><div id="choice-menu" class="choice-popover" popover="manual" role="menu" aria-label="Choose an option"></div><dialog id="drawer" class="drawer" aria-labelledby="dialog-title"></dialog><div id="toast" class="toast" role="status" aria-live="polite"></div><script>'''+(HERE/'model.js').read_text()+'\n'+(HERE/'app.js').read_text()+'''</script></body></html>
'''
(HERE/'index.html').write_text(html,encoding='utf-8')
print(f'Built index.html: {len(html.encode())} bytes; embedded r18 source {assets["source_sha256"]}')
