"""Build the portable r05 register from immutable r04 and authored guide profiles."""
from pathlib import Path
import base64
import copy
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/design/app-page-register'
OUT = ROOT / 'docs/reference/ui/app-page-register'
SHA = 'ccc2251bbba9df266cac9027ddaa9418ab9abc1d'
DATE = '2026-09-23'
LIVE = 'https://ca-ppo-demo-90deea5d.ashyglacier-e6fb2158.australiaeast.azurecontainerapps.io'
subprocess.run(['git', 'diff', '--quiet', SHA, '--', 'src/app'], cwd=ROOT, check=True)
pinned_pages = {p for p in subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', SHA, '--', 'src/app'], cwd=ROOT, text=True).splitlines() if p.endswith('/page.tsx')}
assert pinned_pages == {p.relative_to(ROOT).as_posix() for p in (ROOT/'src/app').rglob('page.tsx')}, 'Route files differ from the pinned source; review and update the source issue first.'
original = (OUT / 'PPO-App-Page-Register-r04.html').read_bytes()
assert hashlib.sha256(original).hexdigest() == 'b049869ac8b500cced535360ebb86650c55bbc5cd3ee4a18872ef83ea0b4b16e'
html = original.decode('utf-8')
match = re.search(r'<script type="application/json" id="registerData">(.*?)</script>', html, re.S)
data = json.loads(match[1])
old_sha = data['meta']['sha']
profiles = {}
for line in (SOURCE / 'guide-profiles.txt').read_text(encoding='utf-8').splitlines():
    if not line or line.startswith('#'):
        continue
    key, path, inputs, steps, outcome, boundary = line.split('|')
    profiles[key] = dict(path=path, inputs=inputs, steps=steps.split(';'), outcome=outcome, boundary=boundary)
assert len(profiles) == 150
scope_by_code = {r['key'].removeprefix('scope:'): r for r in data['scopes']}
route_by_path = {r['path']: r for r in data['routes']}
old_keys = {r['key'] for r in data['scopes'] + data['routes']}

# Explicitly mapped source additions. Original scope assessments remain dated evidence.
families = [
    ('/facilities', 'CS', ['CS-05'], 'Facilities & growing areas'),
    ('/engineering/commissioning', 'EN', ['EN-08'], 'Commissioning & as-built'),
    ('/engineering/materials', 'EN', ['EN-06'], 'Materials & substitutions'),
    ('/engineering/changes', 'EN', ['EN-07'], 'Engineering change review'),
    ('/projects/acceptance', 'PJ', ['PJ-09'], 'Project acceptance & closeout'),
    ('/projects/programme', 'PJ', ['PJ-03'], 'Programme'),
    ('/estimating/configurations', 'ES', ['ES-08'], 'Screen Systems configurations'),
    ('/estimating/fertigation', 'ES', [], 'Priva Fertigation Configurator'),
    ('/estimating/quotes', 'ES', ['ES-05'], 'Quotations'),
    ('/finance/accounts', 'FN', ['FN-02'], 'Customer accounts'),
    ('/sales/pulse', 'CR', ['CR-04'], 'Sales Pulse'),
    ('/sales/tasks', 'SH', ['SH-02'], 'Sales Tasks'),
    ('/contacts', 'CS', ['CS-02'], 'Contacts'),
]
source_routes = {}
for f in (ROOT / 'src/app').rglob('page.tsx'):
    parts = [p for p in f.relative_to(ROOT / 'src/app').parts[:-1] if not p.startswith('(')]
    path = '/' + '/'.join(parts)
    source_routes[path] = f.relative_to(ROOT).as_posix()
added = []
aliases = []
for path, source in sorted(source_routes.items()):
    if path in route_by_path:
        route_by_path[path]['current_source'] = source
        continue
    if path.startswith('/crm/'):
        aliases.append({'path': path, 'source': source, 'note': 'Legacy CRM route; canonical Sales destinations are retained.'})
        continue
    family_path = re.sub(r'/engineering/\[id\]/(materials|changes)', r'/engineering/\1', path)
    family = next((f for f in families if family_path == f[0] or family_path.startswith(f[0] + '/')), None)
    if not family:
        raise ValueError('Unmapped source route: ' + path)
    prefix, module, scopes, name = family
    tail = family_path[len(prefix):].strip('/')
    suffix = {'': '', 'new': ' · create', '[id]': ' · detail', '[id]/edit': ' · edit'}.get(tail)
    if suffix is None:
        suffix = ' · ' + tail.replace('[id]/', '').replace('[view]', 'selected view').replace('-', ' ').replace('/', ' / ')
    basis = copy.deepcopy(scope_by_code[scopes[0]]['build'] if scopes else scope_by_code['ES-02']['build'])
    basis['scopeKeys'] = ['scope:' + s for s in scopes]
    row = dict(key='route:' + path, code='APP', title=name + suffix, module=module, kind='route',
               status='refine', summary='This route is present in application source at ' + SHA[:8] + '. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.',
               placement='Form' if path.endswith('/new') or path.endswith('/edit') else 'Record detail' if '[' in path else 'Page',
               design=scope_by_code[scopes[0]].get('design') if scopes else None,
               source=source, current_source=source, path=path,
               template=re.sub(r'\[([^\]]+)\]', r'{\1}', path),
               params=[{'key': p, 'label': 'View name' if p == 'view' else 'Record UUID', 'placeholder': 'Enter view name' if p == 'view' else 'Paste the target environment record UUID', 'format': 'slug' if p == 'view' else 'uuid'} for p in re.findall(r'\[([^\]]+)\]', path)],
               scopeIds=scopes, variants=[], routes=[], build=basis, added_in='r05')
    data['routes'].append(row)
    route_by_path[path] = row
    added.append({'key': row['key'], 'path': path, 'title': row['title'], 'scope_ids': scopes, 'source': source})
    for code in scopes:
        scope_by_code[code]['routes'].append(row['key'])

for route in data['routes']:
    for param in route['params']:
        if param['key'] == 'view':
            param['values'] = ['configure', 'parts', 'pricing', 'compare', 'definition', 'history']
            param['placeholder'] = 'configure, parts, pricing, compare, definition or history'

data['meta'].update(revision='r05', checked='23 September 2026', sha=SHA, scope_sha=old_sha,
    scope_checked='20 September 2026', live_base=LIVE, guide_schema_version=1,
    issue_date=DATE, source_r04_sha256=hashlib.sha256(original).hexdigest(),
    live_check={'checked_at': DATE, 'status': 401, 'result': 'Powerplants One sign-in page; no authenticated page availability asserted', 'source': 'docs/delivery/azure-private-demo.md'},
    local_check={'checked_at': DATE, 'result': 'Root returned HTTP 200 in the preceding planning check; individual page availability not asserted'},
    guide_review='Draft guidance; workflow walkthrough and business review pending')
data['route_changes'] = {'added': added, 'aliases': aliases, 'retained_route_count': 65, 'current_route_count': len(data['routes']), 'scope_assessment': 'All 150 r04 scope IDs, statuses and build ranks retained. New source routes do not automatically close scope work.'}

assets = [
 ('projects-list','docs/blueprints/projects-visuals/projects-register-desktop.png','Project register · design preview','Design mockup','r01',['scope:PJ-02','route:/projects']),
 ('projects-detail','docs/blueprints/projects-visuals/project-detail-desktop.png','Project detail · design preview','Design mockup','r01',['scope:PJ-03','route:/projects/[id]']),
 ('deals-board','docs/testing/evidence/department-navigation/sales-deals-populated.png','Deals Board · synthetic application capture','Implementation capture','22 September 2026',['scope:CR-04','route:/sales/opportunities']),
 ('wizard','docs/testing/evidence/es02-native-r01/read-only-summary.png','Estimation Wizard · saved read-only revision','Implementation capture','ES-02 native r01',['scope:ES-02','route:/estimating/discovery/[id]']),
 ('supplier-price','docs/testing/evidence/supplier-pricing-r01/desktop-price-comparison.png','Supplier price comparison · proposed design','Design mockup','r01',['scope:ES-03','scope:PD-03']),
 ('data-quality','docs/testing/evidence/data-quality-r01/repository/queue-desktop.png','Data quality queue · proposed design','Design mockup','r01 maintained preview',['scope:AD-03']),
 ('finance-account','docs/testing/evidence/department-navigation/finance-exact-account.png','Exact customer-account observations · synthetic capture','Implementation capture','22 September 2026',['scope:FN-02','route:/customers/[id]/account']),
 ('facilities','docs/testing/evidence/cs05-native-r01/captures/desktop-register-1440.png','Facilities & growing areas · synthetic capture','Implementation capture','CS-05 native r01',['scope:CS-05','route:/facilities']),
]
data['mockup_assets'] = []
for asset_id, path, title, kind, revision, keys in assets:
    raw = (ROOT / path).read_bytes()
    data['mockup_assets'].append(dict(asset_id=asset_id, source_path=path, title=title, kind=kind, revision=revision,
       entry_keys=keys, alt=title + '. Synthetic records; retained reference, not a claim of current live deployment.',
       sha256=hashlib.sha256(raw).hexdigest(), data_url='data:image/png;base64,' + base64.b64encode(raw).decode()))

special = {
 'leads': dict(path='/sales/leads', inputs='Enquiry title, organisation/contact, source, status and next activity', steps=['Use + Lead to capture the enquiry and its source', 'Use Everyone and Filters to narrow the list; review Inbox, Archived, Disqualified and Converted separately', 'Open the lead title or row menu to review, schedule follow-up or perform an available transition', 'Convert a qualified enquiry to its linked deal and retain the original lead history'], outcome='The enquiry has an accountable next action or an attributable conversion/disposition', boundary='Conversion preserves the lead history. A lead and a deal are distinct records; current server access is checked again when saving.'),
 'fertigation': dict(path='/estimating/fertigation', inputs='Exact facility context, valve/master register revisions, scope, source evidence and calculation basis', steps=['Select or create the permitted configurator scope', 'Review the exact valve and master-source revisions and unresolved bindings', 'Inspect calculated results and review evidence before preparing a controlled report'], outcome='A saved configuration has a reproducible input and evidence basis', boundary='The Priva configurator is separate from ES-08 Screen Systems. Supplier conclusions and equipment suitability require their own evidence.'),
 'login': dict(path='/login', inputs='Intended local or hosted environment and authorised identity', steps=['Confirm that you opened the intended PPO environment', 'Use the sign-in method offered by that environment', 'Return to the requested page after sign-in and check the current identity'], outcome='The intended permitted application context is open', boundary='The local development identity and hosted sign-in are different. This register does not grant access or store credentials.'),
 'home': dict(path='/work', inputs='Current identity and selected workspace', steps=['Open Powerplants One in the intended environment', 'Confirm the destination shown after the home redirect', 'Choose a permitted activity or page from My Work or the shared navigation'], outcome='You are oriented in the correct environment and workspace', boundary='The home address is an entry/redirect, not a second copy of My Work.'),
}
sources = {
 'CR':'docs/blueprints/BP-03-crm.md','ES':'docs/blueprints/BP-04-estimating-quotation.md',
 'PJ':'docs/blueprints/BP-06-projects-commercial-delivery.md','SV':'docs/blueprints/BP-07-service-operations.md',
 'PL':'docs/delivery/p05-handover.md','FI':'docs/delivery/p07-handover.md','FN':'docs/delivery/p10-handover.md',
 'DK':'docs/blueprints/contextual-help-design.md',
}
scope_sources = {'ES-02':'docs/delivery/es02-estimation-wizard-handover.md','CS-05':'docs/delivery/facilities-growing-areas-handover.md',
 'PL-01':'docs/delivery/pl01-demand-to-booking-handover.md','FI-02':'docs/delivery/p08-handover.md','SV-06':'docs/delivery/p09-handover.md',
 'EN-06':'docs/delivery/engineering-materials-substitutions-handover.md'}

def make_section(section_id, title, paragraphs=None, steps=None, rows=None, headers=None):
    return dict(section_id=section_id, title=title, paragraphs=paragraphs or [], steps=steps or [], rows=rows or [], headers=headers or [])

def page_mode(r):
    if r['kind'] == 'scope': return r['placement']
    path = r['path']
    if path in ('/login','/auth/login'): return 'Sign-in'
    if path == '/': return 'Home redirect'
    if path.endswith('/new'): return 'Creation form'
    if path.endswith('/edit'): return 'Edit form'
    if '[' in path: return 'Record workspace'
    return 'Register / workspace'

# Route-specific reading tasks supplement the broader authored scope profile.
# They describe the work to inspect, without inventing button labels or approvals.
route_focus = {
 'history': ('Historical evidence', ['Identify the event or saved revision relevant to your question.', 'Read its actor, time, source basis and result; distinguish the current state from an earlier snapshot.', 'Return to the current workspace before preparing a new change. Do not edit historical evidence.']),
 'handover': ('Receiving a handover', ['Identify the exact package/revision and intended receiving workflow.', 'Review what was prepared, what was actually transferred and what remains outstanding.', 'Confirm receipt and acceptance separately through the supported receiving workflow; retain exceptions and their owners.']),
 'impact': ('Impact assessment', ['Identify the proposed change and its current source revision.', 'Review the affected equipment, design, materials, delivery and commercial dependencies that apply.', 'Record evidence and owned unknowns before seeking the relevant review decision.']),
 'reviews': ('Review decisions', ['Read the exact submitted revision and decision requested.', 'Inspect its impact/evidence and any unresolved questions within your authority.', 'Use the available review action and inspect the resulting decision record; a revised submission needs its own review.']),
 'verification': ('Verification evidence', ['Identify the change, requirement and verification basis.', 'Inspect the actual result and its evidence rather than treating a planned check as completed.', 'Record an unresolved result or attributable completion and retain the link to the verified revision.']),
 'releases': ('Released evidence', ['Choose the exact release and inspect its content/source revision.', 'Distinguish working information from issued release evidence and any successor.', 'Confirm the receiving workflow uses the intended release; later edits do not silently revise an issued basis.']),
 'substitutions': ('Material substitutions', ['Identify the original material requirement and proposed alternative.', 'Compare technical suitability, supplier/source information and delivery/commercial impacts.', 'Retain the review/disposition and exact revision before passing the alternative to procurement or delivery.']),
 'mapping': ('Material mapping', ['Identify each requirement line and the source item or unmatched condition.', 'Inspect units, quantities, identity and the evidence supporting the proposed correspondence.', 'Keep unmatched or ambiguous lines explicit; only use the mapping after the applicable review.']),
 'basis': ('Commissioning basis', ['Select the exact scope and applicable requirements/design basis.', 'Inspect the source revisions, applicability and owned gaps.', 'Carry the reviewed basis forward to its checks and retained results.']),
 'configuration': ('Configuration evidence', ['Identify the relevant equipment/package and source configuration.', 'Compare the intended and recorded configuration with its effective revision.', 'Keep changed or unknown configuration explicit before relying on commissioning results.']),
 'results': ('Commissioning results', ['Identify the exact check, applicable basis and equipment context.', 'Read the measured/observed result, units, time and retained evidence.', 'Separate passed checks, unresolved findings and follow-up; an individual result does not close the whole package.']),
 'closeout': ('Project closeout', ['Confirm the project/stage and the acceptance basis being closed.', 'Review outstanding findings, required documents, customer responses and commercial handovers.', 'Inspect the actual closeout result; remaining actions require explicit ownership and do not disappear when the visit finishes.']),
 'outstanding': ('Outstanding work', ['Review open items for the selected project/stage.', 'Confirm each item has a source, responsible owner, next action and truthful due state.', 'Resolve through the owning workflow and check whether the acceptance/closeout evidence now reflects the result.']),
 'readiness': ('Acceptance readiness', ['Identify the stage, required acceptance evidence and current source versions.', 'Review fulfilled, missing and stale prerequisites separately.', 'Prepare an owned action for each unresolved condition; readiness alone is not customer acceptance.']),
 'costing': ('Saved cost projection', ['Identify the exact saved discovery revision and alternative being costed.', 'Review the source quantities, price/cost basis and any unknown values.', 'Compare options using their explicit cost versions; discovery edits do not automatically reprice or adopt an estimate basis.']),
 '[view]': ('Specialist configuration view', ['Enter the configuration UUID from the target environment.', 'Choose a supported view: configure, parts, pricing, compare, definition or history.', 'Inspect that view in the same configuration context; saved runs, working inputs and reviewed definitions remain distinct evidence.']),
 'edit': ('Updating an existing record', ['Confirm the record identity and current revision before changing fields.', 'Keep the source of the change and any unresolved values explicit.', 'Use the page save action and inspect the result; compare a concurrent revision before retrying.']),
}
route_focus['handovers'] = route_focus['handover']

all_rows = data['scopes'] + data['routes']
by_key = {r['key']: r for r in all_rows}
data['guides'] = []
data['guide_bindings'] = []
data['planned_routes'] = []
for r in all_rows:
    key = r['key']
    code = key.removeprefix('scope:') if r['kind'] == 'scope' else next(iter(r['scopeIds']), '')
    profile = profiles.get(code)
    if r['kind'] == 'route':
        if '/leads' in r['path']: profile = special['leads']
        elif '/fertigation' in r['path']: profile = special['fertigation']
        elif r['path'] in ('/login','/auth/login'): profile = special['login']
        elif r['path'] == '/': profile = special['home']
        elif r['path'] == '/sales/opportunities/new': profile = profiles['CR-01']
    assert profile, key
    guide_key = 'guide.' + (code.lower().replace('-', '.') if r['kind'] == 'scope' else 'page.' + r['path'].strip('/').replace('/', '.').replace('[','').replace(']','') or 'home')
    if r['kind'] == 'route' and r['path'] == '/': guide_key = 'guide.page.home'
    proposed_path = profile['path']
    linked_routes = [by_key[k] for k in r.get('routes',[]) if k in by_key]
    if r['kind'] == 'route':
        destination = r['template']
        params = r['params']
        route_state = 'Source route'
    else:
        base_path = proposed_path.split('?')[0]
        exact = route_by_path.get(base_path)
        if exact and '?' not in proposed_path:
            destination, params, route_state = exact['template'], exact['params'], 'Source entry point'
        elif proposed_path in route_by_path:
            exact = route_by_path[proposed_path]
            destination, params, route_state = exact['template'], exact['params'], 'Source entry point'
        else:
            destination, params, route_state = proposed_path, [], 'Planned view' if exact else 'Planned route'
            data['planned_routes'].append(dict(entry_key=key, path=destination, status=route_state, authority='Proposed reference destination; not a route implementation'))
    base_destination = re.sub(r'\{[^}]+\}', '[id]', destination.split('?')[0])
    ancestors = [p for p in route_by_path if '[' not in p and p not in ('/','/login','/foundation') and base_destination.startswith(p + '/')]
    parent = max(ancestors, key=len) if ancestors else (profile['path'].split('?')[0] if '{' not in profile['path'] else '/work')
    r['links'] = dict(path=destination, params=params, state=route_state, parent_path=parent, local_availability='Not individually checked', live_availability='Sign-in required; page deployment not verified')
    r['guide_key'] = guide_key
    r['image_ids'] = [a['asset_id'] for a in data['mockup_assets'] if key in a['entry_keys']]
    r['page_type'] = page_mode(r)
    r['baseline_status'] = r['status']
    r['guide_status'] = 'Draft'
    proposed = r['kind'] == 'scope' and r['status'] in ('unbuilt','conditional')
    has_current = bool(linked_routes) or route_state.startswith('Source')
    content_mode = 'Conditional proposal' if r['status'] == 'conditional' else 'Planned workflow' if proposed and not has_current else 'Existing foundation + proposed completion' if r['kind'] == 'scope' else 'Page workflow draft'
    r['guide_mode'] = content_mode
    title = r.get('displayTitle',r['title'])
    if proposed:
        applicability = 'This is a proposed task guide for the registered scope. Steps describe intended operation, not proof of available controls. Any linked source page supplies only its implemented subset.'
    else:
        applicability = 'This draft explains the registered workflow and its current source context. Verify exact controls against the running release. Wider scope and planned extensions remain separately identified.'
    if r.get('added_in'):
        applicability += ' This route was added to the register from the 23 September source inventory.'
    route_note = ('Use the record UUID from the selected environment; local and hosted IDs may differ. The parent link lets you choose a record first.' if params else 'Use Local app for your development server or Live app for the hosted sign-in environment.')
    if route_state.startswith('Planned'):
        route_note += ' The displayed address is a proposed future destination and may currently be unavailable.'
    before = ['Confirm the customer, site, equipment or other business context relevant to this task before changing a record.',
              'Prepare: ' + profile['inputs'] + '.',
              'Use your permitted role. Where an approval or receiving role is not established, keep the decision open and identify the owner rather than assuming authority.']
    task_steps = profile['steps']
    if r['kind'] == 'route' and r['path'].endswith('/new'):
        task_steps = ['Search the related register for an existing record before creating another.', 'Complete the information requested by the creation form; keep unknown values explicit.', 'Review the entered context, save through the page action and inspect the resulting record/confirmation.'] + ['Then continue the wider workflow: ' + profile['steps'][-1]]
    elif r['kind'] == 'route' and '[' in r['path']:
        task_steps = ['Confirm the record reference and customer/site context in this record workspace.'] + task_steps
    focus = route_focus.get(r.get('path','').split('/')[-1]) if r['kind'] == 'route' else None
    if focus:
        task_steps = focus[1] + ['Wider workflow outcome: ' + profile['outcome'] + '.']
    related = []
    if r['kind'] == 'route': related += ['scope:' + s for s in r['scopeIds']]
    else: related += r.get('routes',[]) + ['scope:' + s.removeprefix('scope:') for s in r['build'].get('after',[])]
    related = list(dict.fromkeys(k for k in related if k in by_key and k != key))
    evidence_paths = list(dict.fromkeys(p for p in [r.get('current_source'),r['source'],r.get('design'),scope_sources.get(code),sources.get(r['module'],'docs/blueprints/BP-01-master-blueprint.md')] if p and (ROOT / p).exists()))
    if '/fertigation' in r.get('path',''): evidence_paths.append('docs/delivery/priva-fertigation-native-handover.md')
    if '/leads' in r.get('path',''): evidence_paths.append('src/components/leads-guide.ts')
    sections = [
      make_section('purpose','Purpose and outcome',[f'Use {title} to work towards this outcome: {profile["outcome"]}.', applicability, profile['boundary']]),
      make_section('before','Before you start',before),
      make_section('quick-start','Quick start',steps=['Choose the correct local or hosted environment and confirm your identity.', route_note, 'Check the current scope, required information and outstanding decisions.', task_steps[0], 'Check the saved result or explicit pending/error state before leaving the workflow.']),
      make_section('page-tour','Understand this page',rows=[['Page context',title + ' · ' + r['page_type']],['Application links',route_note],['Source record or list','Use the displayed reference and context to choose the correct record. Filters and page counts represent the permitted selection, not necessarily the full business population.'],['Actions and outcomes','Navigation opens a workspace. Save, submit, review, issue and acknowledge are separate business actions where present. Read the resulting state.'],['Guide and design','User guide explains the task. UI mockup shows a retained visual reference; an image is not evidence of current deployment.']],headers=['Area','How to use it']),
      make_section('information','Information you need',[profile['inputs'] + '.', 'Use the field labels and validation in the actual form. These preparation topics do not invent mandatory fields, default amounts or approval thresholds. Record the source, time and units for measurements and financial information.', 'If information is missing, use a supported unknown state or retain an owned question. Do not substitute zero, a guessed date or an unrelated record merely to proceed.']),
      make_section('tasks','Complete the main task',[('Proposed workflow: confirm the implemented subset before using these steps.' if proposed else 'Task sequence for review against the applicable running release.')],steps=task_steps),
      make_section('completion','Completion and handover',[profile['outcome'] + '.', 'Check the resulting record, receipt or exact document rather than relying on a button click. Record the next owner/action and unresolved information before handing work on.',profile['boundary']]),
      make_section('states','Statuses, warnings and save state',rows=[['Draft / prepared','Review the information; it does not imply submission, approval or issue.'],['Saved / submitted','Read the exact confirmation and check what was retained or sent to review.'],['Pending / outcome unknown','Retain the original operation context. Inspect its outcome before attempting a duplicate action.'],['Validation / stale revision','Correct the identified information or compare the newer source before retrying through the supported workflow.'],['Read-only / access refused','Use the authorised review or support route; do not try another identity to bypass the boundary.'],['Planned / not available','The register contains a future reference. Review the design and dependencies; do not interpret the link as a working feature.']],headers=['State or situation','Meaning and response']),
      make_section('examples','Worked examples',[f'Synthetic normal case — Northbank Nursery: prepare {profile["inputs"].lower()}. Follow the task sequence and check that {profile["outcome"].lower()}. Keep the actual record reference with the outcome.',f'Synthetic exception — the source basis for {title} has changed while work is underway. Preserve your draft and compare the new information. Reconfirm the affected assumptions, owner and scope before a successor action. {profile["boundary"]}']),
      make_section('recovery','Troubleshooting',rows=[['Local page will not open','Check the local app is running and that App links points to its correct origin. A planned path may not exist yet.'],['Live sign-in or denied page','Use the normal authorised sign-in. Deployment and permissions differ from local development; the register does not grant access.'],['Record not found','Choose the record from the target environment register. Do not assume a local UUID exists in the hosted database.'],['Save result is unclear','Keep the original draft/operation context and inspect its receipt or supported recovery view before repeating the action.'],['Mockup is missing','Use the linked HTML design when available. Record the missing image in your local review note.'],['Guide differs from the page','Check the guide/source revision and running release. Stop relying on the mismatched instruction and record the discrepancy.']],headers=['Symptom','Check and recovery']),
      make_section('mobile','Mobile, keyboard and offline use',['In this register, use Tab and Shift+Tab to reach the entry actions. Enter or Space opens a button; Escape closes the top reading window. Contents links move to the relevant heading.', 'On a phone, the guide uses the full screen. Close it to return to the same register selection. Only the documented Offline workspace supports its verified offline business operations; opening a portable guide offline does not make every application page offline-capable.']),
      make_section('resources','Related guidance and procedures',['Related page and scope guides are listed below. Follow an application link only after checking its environment and availability.', 'No approved operational SOP is attached by this register. Use authoritative procedures through their normal access controls; a guide does not approve or replace them.']),
      make_section('review','Guide review and feedback',['Guide revision r01 · Draft for review · Prepared 23 September 2026. Business reviewer: not yet nominated. Running-workflow walkthrough: not performed for this article.', 'Use View details → Your review to record a correction or next step. Notes are saved only in this browser/session and can be exported; they are not sent to a support team or published into the guide.', 'Opening this guide is not training completion, SOP acknowledgement or acceptance of the underlying application.']),
    ]
    if focus:
        sections[0]['paragraphs'].insert(0, 'This page focuses on ' + focus[0].lower() + ' within the registered workflow.')
        sections[3]['rows'].insert(1, ['This page’s focus', focus[0] + '. The task sequence below is specific to this view.'])
    guide = dict(guide_key=guide_key, entry_key=key, title=title, revision='r01', status='Draft', locale='en-AU',
      content_mode=content_mode, owner_role='Prototype content owner: Dean Fiedler', reviewer=None, reviewed_at=None,
      prepared_at=DATE, source_commit=SHA, scope_baseline_commit=old_sha, runtime_evidence='Not run for this guide',
      sections=sections, related_entry_keys=related, source_paths=evidence_paths,
      change_summary='First detailed article for this entry; generated from authored scope profile and the retained/current route context.')
    guide.update(document_id='PPO-GUIDE-' + guide_key.removeprefix('guide.').replace('.','-').upper(),
      audience='Public synthetic prototype reference; runtime permissions must be applied by the application adapter',
      review_due_at=None, resource_ids=[], supersedes=None, section_aliases={},
      workflow_basis=evidence_paths, applicable_app_release=None)
    data['guides'].append(guide)
    variants = r.get('variants',[]) if r['kind'] == 'route' else []
    data['guide_bindings'].append(dict(entry_key=key, guide_key=guide_key, route_pattern=r.get('path'), proposed_path=destination,
      entry_section='quick-start', variants=[dict(path=v['path'],label=v['label'],section_id='page-tour') for v in variants],
      runtime_status='Reference mapping; application adapter not installed'))

assert len({g['guide_key'] for g in data['guides']}) == len(all_rows)
data['guide_contract'] = dict(schema_version=1, resolution='Explicit context first; exact static route before dynamic pattern; query variants select guide sections.',
  integration='Extend src/components/shell-page-guide.tsx and the existing information icon. Use stable guide keys, permission-filtered delivery and release-bound bundles.',
  lifecycle=['Draft','InReview','Published','Superseded','Withdrawn'], authoring_source='docs/design/app-page-register/guide-profiles.txt',
  limitations=['No application guide adapter installed by this artifact','No guide declared operationally approved','No authenticated live page audit','No live SOP integration'])

# Safely embedded JSON: data cannot terminate its script element.
packed = json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
html = html[:match.start(1)] + packed + html[match.end(1):]
html = html.replace('PPO-Page-Register-Source-r04.json','PPO-Page-Register-Source-r05.json')
html = html.replace('Standalone reference · r04','Standalone reference · r05').replace('r04 · PPO theme r22','r05 · PPO theme r22')
html = html.replace('main · 98aa2b47</span>','main · ccc2251</span>')
html = html.replace('<title>Powerplants One · App page register</title>','<title>Powerplants One · App page register r05</title>')
html = html.replace('Explore what’s built, what needs refinement, and the recommended order for what comes next.','Find every page, open its local or live destination, and follow its detailed user guide.')
html = html.replace('</style>', '\n' + (SOURCE / 'register-r05.css').read_text(encoding='utf-8') + '\n</style>',1)
# Old blanket close handler rerenders underlying forms and loses focus; replace with the r05 manager.
old_script = re.search(r'<script>\s*\x27use strict\x27;.*?</script>', original.decode('utf-8'), re.S)[0]
old_close = next(line for line in old_script.splitlines() if line.startswith("document.querySelectorAll('dialog').forEach"))
html = html.replace(old_close, '')
html = html.replace("const nextBase=validateBase($('baseInput').value.trim())", "const nextLive=validateBase($('liveBaseInput').value.trim()),nextBase=validateBase($('baseInput').value.trim())")
html = html.replace('base=nextBase;designRoot=nextDesignRoot;', 'base=nextBase;liveBase=nextLive;designRoot=nextDesignRoot;')
html = html.replace('</body>', (SOURCE / 'register-r05-dialogs.html').read_text(encoding='utf-8') + '\n<script>\n' + (SOURCE / 'register-r05.js').read_text(encoding='utf-8') + '\n</script>\n</body>')
(OUT / 'PPO-App-Page-Register-r05.html').write_text(html, encoding='utf-8', newline='\n')
portable = copy.deepcopy(data)
for asset in portable['mockup_assets']: asset.pop('data_url')
(SOURCE / 'guide-library.json').write_text(json.dumps({k:portable[k] for k in ('meta','guides','guide_bindings','guide_contract','planned_routes','mockup_assets','route_changes')},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
manifest = dict(revision='r05',date=DATE,source_commit=SHA,original_sha256=hashlib.sha256(original).hexdigest(),
 html_sha256=hashlib.sha256((OUT/'PPO-App-Page-Register-r05.html').read_bytes()).hexdigest(),scopes=len(data['scopes']),routes=len(data['routes']),guides=len(data['guides']),
 source_route_additions=len(added),planned_destinations=len(data['planned_routes']),images=len(assets),entries_with_images=sum(bool(r['image_ids']) for r in all_rows),
 source_keys_preserved=old_keys.issubset(by_key),guide_review='Draft; business review and workflow walkthrough pending')
(SOURCE/'build-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(manifest,indent=2))
