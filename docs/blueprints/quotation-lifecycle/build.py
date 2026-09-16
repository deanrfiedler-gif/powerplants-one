"""Reproduce the ES-05/06 standalone designs from retained references; stdlib only.

Run from any directory: python3 docs/blueprints/quotation-lifecycle/build.py
No retained reference is overwritten. The r03 CSS and assets remain authoritative.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUT = ROOT / 'docs/reference/ui/quoting'
original = (OUT / 'ppo-quotation-module-r03.html').read_text()
assert hashlib.sha256(original.encode()).hexdigest() == '7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a'
release = (OUT / 'PPO-Quotation-Approval-Issue-and-Distribution-r01.html').read_text()
assert hashlib.sha256(release.encode()).hexdigest() == 'f86a40bdb2410f05af2281316d3b4154b26ecefecdd03116e8fa6089ffd14654'

def literal(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

def swap(text, old, new):
    assert old in text, old[:100]
    return text.replace(old, new)

customer_style = re.search(r'<style id="ppo-quotation-styles">([\s\S]*?)</style>', original)[1]
mast = re.search(r'(<header class="ppq-mast"[\s\S]*?</header>)', original)[1]
document_js = re.search(r'const DOCUMENT = (Object.freeze\([\s\S]*?\n\}\));', original)[1]

# ES-05 remains script-free inside the output sandbox. It uses the same customer
# document CSS, masthead asset, cards, overview, two-column layout and print rules.
release = re.sub(r'<header class="global">[\s\S]*?</header>', '', release, count=1)
release = swap(release, "ppo-es05-quotation-r01", "ppo-es05-quotation-r02")
release = release.replace('Design preview · r01', 'Design preview · r02')
release = release.replace('PPO-Quotation-Demonstration-r01.json', 'PPO-Quotation-Demonstration-r02.json')
release = release.replace('Output definition: ES05-HTML-v1', 'Output definition: ES05-HTML-v2')
release = release.replace('padding:24px 28px 70px', 'padding:24px 24px 70px').replace('.workspace{padding-inline:36px}', '.workspace{padding-inline:24px}')
release = swap(release, '<style>', '<style>\n' + (HERE / 'workspace.css').read_text(),)
release = release.replace('<dialog id="dialog"', '<dialog id="basis-panel" class="inspection-panel" aria-labelledby="basis-title"></dialog><dialog id="dialog"')
start = release.index('function output(qq,rr)')
end = release.index('async function sha', start)
release = release[:start] + 'const CUSTOMER_STYLE=' + literal(customer_style) + ';\nconst CUSTOMER_MAST=' + literal(mast) + ';\n' + (HERE / 'release-output.js').read_text() + '\n' + release[end:]
release = swap(release, "if(action==='snapshot'){openDialog('Exact quotation basis',", "if(action==='snapshot'){openBasis('Exact quotation basis',")
release = swap(release, "if(action==='close'){closeDialog();return}", "if(action==='close-basis'){closeBasis();return}if(action==='close'){closeDialog();return}")
release = swap(release, "function closeDialog(){", (HERE / 'inspection-panel.js').read_text() + '\nfunction closeDialog(){')
release = swap(release, '<p>Review the exact offer.', '<p>Review the exact offer.')
release = swap(release, '<div class="kicker">ES-05 / Controlled quotation release</div>', '<div class="kicker">ES-05 / Controlled quotation release · r02</div>')
release = swap(release, '<p>Roles demonstrate separate responsibilities only.', '<p>Scope ES-05 · r20 review workspace with registers and document preview. Customer output reuses quotation r03. ES-06 owns responses; ES-07 owns conversion. Roles demonstrate separate responsibilities only.')
(OUT / 'PPO-Quotation-Approval-Issue-and-Distribution-r02.html').write_text(release)

# Adapt behaviour around the retained customer experience. No new visual system.
customer = original
customer = swap(customer, 'const canRespond = () => isOpen()', 'let responseContext = null;\nconst canRespond = () => !!responseContext?.allowed && isOpen()')
customer = swap(customer, '<style id="ppo-quotation-styles">', '<style>.ppq-preview-tools{display:none!important}html,body{margin:0;height:100%}#ppo-quotation-module{min-height:100vh}#ppo-quotation-module .ppq-field select,#ppo-quotation-module .ppq-field textarea{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #828e9f;border-radius:6px;padding:10px;font:inherit;background:white;color:#242a37}#ppo-quotation-module .ppq-field textarea{resize:vertical}</style><style id="ppo-quotation-styles">')
customer = swap(customer, 'Design preview · r03</b>', 'Customer preview · ES-06</b>')
customer = customer.replace('Fictional quotation · nothing is sent or saved', 'Fictional quotation · responses stay in this browser')
customer = customer.replace('does not create a contract, send a response or save your entries.', 'does not create a contract or send a response. Confirmed examples are retained in this browser.')
customer = customer.replace('Nothing will be sent or saved and no contract will be created.', 'This example response will be retained in this browser. Nothing is sent and no contract is created.')
customer = customer.replace('in page memory only. <strong>Nothing was sent or saved.</strong>', 'in this local demonstration. <strong>No customer message or order was sent.</strong>')
customer = customer.replace('A future connected module would need to save the exact response before sending a', 'A future connected module must use an authoritative saved response before sending a')
customer = customer.replace('Changes reset when this page is reloaded.', 'Responses in ES-06 are retained locally; browser data can be cleared.')
customer = swap(customer, "function connectionMessage(){\n", "function connectionMessage(){\n if(!responseContext)return '<div class=\"ppq-state-banner\"><strong>Read-only offer copy</strong><span>Open the ES-06 customer preview to demonstrate a response against this exact issue.</span></div>';\n")
customer = swap(customer, "if(JSON.stringify(pendingResponse.selection)!==JSON.stringify([...state.selection.entries()]))", "if(JSON.stringify(pendingResponse.selection)!==JSON.stringify([...state.selection.entries()]))")
start = customer.index(' state.acceptance={...pendingResponse,at:new Date().toISOString()};')
end = customer.index('\n}', start)
customer = customer[:start] + ''' const payload={...pendingResponse,signature:state.form.signature.trim(),consent:true};
 $("ppq-review-dialog").close();pendingResponse=null;reviewOpener=null;
 sendResponse('accept',payload);
''' + customer[end:]
start = customer.index('    state.lifecycle = "declined";', customer.index('function closeDecline'))
end = customer.index('\n  }', start)
customer = customer[:start] + "    sendResponse('decline',{reason:state.declineReason.trim()});" + customer[end:]
customer = re.sub(r"onView\(\$\(\"ppq-recover\"\),'click',[^\n]+", "onView($(\"ppq-recover\"),'click',()=>{parent.postMessage({type:'ppo-response-check',quotation:DOCUMENT.quotationNumber,revision:DOCUMENT.revision},'*');announce('Check the original operation in the staff response workspace.');});", customer)
customer = swap(customer, '<button type="button" class="ppq-btn ppq-btn-quiet" id="ppq-do-decline">Decline this quotation</button>', '<button type="button" class="ppq-btn ppq-btn-quiet" id="ppq-do-decline">Decline this quotation</button><button type="button" class="ppq-btn" id="ppq-ask">Ask a question / request a change</button>')
customer = swap(customer, 'onView($("ppq-do-decline"),\'click\',openDecline);', 'onView($("ppq-do-decline"),\'click\',openDecline);\n onView($("ppq-ask"),\'click\',openQuestion);')
# Remove original demonstration toggles: state is owned by ES-06, not the iframe.
start = customer.index('on($("ppq-state-select"), "change"')
end = customer.index('on($("ppq-dlg-cancel")', start)
customer = customer[:start] + (HERE / 'customer-bridge.js').read_text() + '\n' + customer[end:]
customer = swap(customer, 'render(false);\n\n})();', "render(false);\nparent.postMessage({type:'ppo-customer-ready',quotation:DOCUMENT.quotationNumber,revision:DOCUMENT.revision},'*');\n\n})();")

style = re.search(r'<style>([\s\S]*?)</style>', release)[1]
shell = (HERE / 'response-shell.html').read_text()
ui = (HERE / 'response-ui.js').read_text().replace('/* INSPECTION_PANEL */', (HERE / 'inspection-panel.js').read_text())
scripts = 'const SOURCE_DOCUMENT=' + document_js + ';\nconst ISSUED_HTML=' + literal(customer) + ';\n' + (HERE / 'response-model.js').read_text() + '\n' + ui
shell = shell.replace('/* WORKSPACE_STYLE */', style).replace('/* RESPONSE_STYLE */', (HERE / 'response.css').read_text()).replace('/* RESPONSE_SCRIPT */', scripts)
(OUT / 'PPO-Quotation-Response-and-Negotiation-r01.html').write_text(shell)
print('Built ES-05 r02 and ES-06 r01; retained reference bytes unchanged.')
