"""One-time import of the authored r05 into the stable working master; never overwrites it."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
out = root / 'docs/design/development'
if (out / 'register.json').exists():
    raise SystemExit('Working master already exists. Use studio:sync for new routes; edit existing source deliberately.')
source = (root / 'docs/reference/ui/app-page-register/PPO-App-Page-Register-r05.html').read_text(encoding='utf-8')
data = json.loads(re.search(r'id="registerData">(.*?)</script>', source, re.S)[1])
assets = {a['asset_id']:a for a in data['mockup_assets']}
entries = []
shared = ['src/app/globals.css','src/app/desktop-shell.css','src/app/mobile-layout.css','src/components/shell-controls.tsx','src/components/ui/button.tsx','src/components/ui/controls.css']
for row in data['scopes'] + data['routes']:
    slug = re.sub(r'[^a-z0-9]+','-',row['key'].lower()).rstrip('-')
    md = 'docs/design/development/pages/' + slug + '.md'
    title = row.get('displayTitle',row['title'])
    source_paths = list(dict.fromkeys(p for p in [row.get('current_source'),row['source']] if p and (root/p).exists()))
    images = [assets[k]['source_path'] for k in row['image_ids']]
    design = row.get('design') if row.get('design') and (root/row['design']).exists() else None
    entries.append(dict(key=row['key'],title=title,kind=row['kind'],module=row['module'],summary=row['summary'],
        path=row['path'] if row['kind']=='route' else row['links']['path'],source_paths=source_paths,guide_key=row['guide_key'],design_path=md,html_path=design,
        image_paths=images,dependencies=[],scope_status=row['status'],visual_status='Needs review',functional_status='Not recorded here',
        deployment_status='Not verified',review_fingerprint=None,reviewed_at=None,owner='Dean Fiedler',
        build_rank=row['build']['rank'],related_keys=next(g['related_entry_keys'] for g in data['guides'] if g['entry_key']==row['key'])))
    article = next(g for g in data['guides'] if g['entry_key']==row['key'])
    steps = article['sections'][5]['steps']
    reference = '\n'.join('- ['+p.split('/')[-1]+'](../../../'+p.removeprefix('docs/')+')' for p in images + ([design] if design else [])) or 'No exact image or HTML reference is linked. Keep this gap visible.'
    text = f'''# {title} — design reference

Stable entry: `{row['key']}`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `{data['meta']['sha']}`. Application destination: `{row['links']['path']}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

{row['summary']}

''' + '\n'.join(f'{i+1}. {step}' for i,step in enumerate(steps)) + f'''

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

{reference}

## Behaviour, handovers and verification

The draft User Guide `{row['guide_key']}` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
'''
    file = root / md
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text(text,encoding='utf-8',newline='\n')

systems = [
 ('shell','Application shell','src/components/product-navigation.tsx','docs/reference/ui/application-shell/PPO-Application-Shell-r17.html','Navigation, global search, context, page guide and the local design-workspace entry.'),
 ('theme','Theme and shared controls','src/app/globals.css','docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html','Runtime tokens, typography, controls and documented visual exceptions.'),
 ('guidance','Contextual guidance','src/components/shell-page-guide.tsx',None,'Page-to-guide mapping, reader behaviour, release applicability and content review.'),
 ('offline','Offline and recovery','src/platform/installation.ts',None,'Installation and offline boundaries; a portable design reference does not enable offline business operations.'),
]
for key,title,source,html,summary in systems:
    path='docs/design/development/systems/'+key+'.md'
    entries.append(dict(key='system:'+key,title=title,kind='system',module='Shared',summary=summary,path=None,source_paths=[source],guide_key=None,
      design_path=path,html_path=html if html and (root/html).exists() else None,image_paths=[],dependencies=[],scope_status='Shared source',
      visual_status='Needs review',functional_status='See linked source evidence',deployment_status='Not verified',review_fingerprint=None,reviewed_at=None,
      owner='Dean Fiedler',build_rank=None,related_keys=['scope:DK-07'] if key=='guidance' else []))
    file=root/path
    file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text(f'''# {title} — working design reference

Stable entry: `system:{key}`. Owner: Dean Fiedler. Status: Draft for review.

{summary}

## Desktop

Use the actual shared application source `{source}`. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.
''',encoding='utf-8',newline='\n')
out.mkdir(parents=True,exist_ok=True)
(out/'register.json').write_text(json.dumps(dict(schema_version=1,title='Powerplants One · Design & build',source_baseline=data['meta']['sha'],local_base=data['meta']['base'],live_base=data['meta']['live_base'],shared_sources=shared,entries=entries),ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
(out/'guides.json').write_text(json.dumps(dict(schema_version=1,guides=data['guides']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Imported {len(entries)} entries and {len(data["guides"])} draft articles into the stable working master.')
