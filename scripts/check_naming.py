#!/usr/bin/env python3
"""Check adopted naming/document references; not runtime business behaviour."""
from pathlib import Path
import csv
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
FRONT_MATTER = re.compile(r'\A---\r?\n(.*?)\r?\n---\r?\n', re.S)


def require(condition, message):
    if not condition:
        ERRORS.append(message)


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def rows(path):
    with (ROOT / path).open(newline='', encoding='utf-8') as handle:
        return list(csv.DictReader(handle))


def grid(path):
    """Raw rows, so a field count can be checked before names are assigned."""
    with (ROOT / path).open(newline='', encoding='utf-8') as handle:
        return list(csv.reader(handle))


def front_matter(path):
    """Scalar front-matter fields of a markdown file; empty when it has none."""
    match = FRONT_MATTER.match(path.read_text(encoding='utf-8'))
    if not match:
        return {}
    return {k: v.strip() for k, v in re.findall(r'^([A-Za-z_]+):[ \t]*(\S.*?)[ \t]*$', match.group(1), re.M)}


def main():
    documents = rows('docs/standards/document-register.csv')
    table = grid('docs/standards/document-register.csv')
    for number, row in enumerate(table[1:], start=2):
        require(len(row) == len(table[0]), f'Register line {number}: {len(row)} fields, expected {len(table[0])}; quote any field containing a comma')
    ids = [r['document_id'] for r in documents]
    paths = [r['canonical_path'] for r in documents]
    require(len(ids) == len(set(ids)), 'Duplicate document identity')
    require(len(paths) == len(set(paths)), 'Duplicate canonical document path')
    require(len(paths) == len({p.casefold() for p in paths}), 'Case-insensitive document path collision')
    require({f'BP-{n:02}' for n in range(1, 10)} <= set(ids), 'Blueprint reservations missing')
    compared = 0
    for row in documents:
        path = ROOT / row['canonical_path']
        require(path.resolve().is_relative_to(ROOT), f'{row["document_id"]}: path escapes repository')
        if row['status'] != 'Planned':
            require(path.is_file(), f'{row["document_id"]}: missing canonical file')
        for field in ['title', 'owner', 'status']:
            require(bool(row[field]), f'{row["document_id"]}: missing {field}')
        if row['status'] != 'Planned' and path.is_file() and path.suffix == '.md':
            declared = front_matter(path)
            if 'revision' in declared:
                compared += 1
                require(declared['revision'] == row['revision'], f'{row["document_id"]}: register revision {row["revision"]}, front matter {declared["revision"]}')
            if 'document_id' in declared:
                require(declared['document_id'] == row['document_id'], f'{row["document_id"]}: front matter declares document_id {declared["document_id"]}')
    exceptions = rows('docs/standards/naming-exceptions.csv')
    require(len({r['exception_key'] for r in exceptions}) == len(exceptions), 'Duplicate naming exception')
    for row in exceptions:
        require(all(row[k] for k in ['scope','reason','owner','review_trigger']), 'Incomplete naming exception')
    standard = read('docs/standards/naming-conventions.md')
    current_revision = next((r['revision'] for r in documents if r['document_id'] == 'PPO-STD-001'), '')
    require(bool(re.fullmatch(r'r\d{2,}', current_revision)), 'Invalid naming-standard register revision')
    require(f'| Revision | **{current_revision}** |' in standard and 'Adopted for the Powerplants One private prototype' in standard, 'Adoption metadata inconsistent')
    for obsolete in ['docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint.md', 'docs/contracts/documents-and-issues.md']:
        require(not (ROOT / obsolete).exists(), f'Retired editable path still exists: {obsolete}')
    for path in ['AGENTS.md','CONTRIBUTING.md','docs/STATUS.md']:
        text = read(path)
        require('PPO-STD-001' in text, f'{path}: missing adopted naming authority')
        require('Use STD-001 naming' not in text and 'GEN is provisional' not in text and 'GEN remains provisional' not in text, f'{path}: obsolete naming instruction')
    instructions = read('docs/standards/chatgpt-project-instructions.md')
    require(len(instructions) <= 8000, 'Copy-ready project instructions exceed 8,000 characters')
    for token in ['Powerplants One', 'PPO-STD-001', 'AGENTS.md', 'docs/STATUS.md', 'MYOB Acumatica', 'SharePoint', 'P01', 'synthetic']:
        require(token in instructions, f'Project instructions missing {token}')
    api = read('docs/contracts/service-api.md')
    require(not re.search(r'`/(?:work-orders|tickets)(?:/|`)', api), 'API still contains unscoped ticket/work-order routes')
    for suffix in ['/service/work-orders/:id/authorise','/service/work-orders/:id/close','/service/tickets/:id/resolve','/service/tickets/:id/reopen']:
        require(suffix in api, f'Adopted route missing: {suffix}')
    dictionary = read('docs/contracts/service-data-dictionary.md')
    require('Pending reference' in dictionary and 'SYN-PPO-' in dictionary and 'allocate a new pack/report number' in dictionary, 'Readable-reference/offline/revision contract incomplete')
    output = read('docs/contracts/document-issue-distribution.md')
    for prefix in ['PACK','RPT','FH']:
        require(f'SYN-PPO-{prefix}-000001-' in output, f'{prefix}: output naming example missing')
    decisions = {r['decision_id']:r for r in rows('docs/decisions/decision-register.csv')}
    require(decisions['D-003']['status'] == 'Resolved for private prototype', 'Naming decision state inconsistent')
    print(json.dumps({'status':'failed' if ERRORS else 'passed','document_records':len(documents),'standing_exceptions':len(exceptions),'front_matter_revisions_compared':compared,'project_instruction_characters':len(instructions),'errors':ERRORS,'scope':'Naming and documentation consistency only; runtime behaviour is verified separately'}, indent=2))
    return bool(ERRORS)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError) as exc:
        print(f'Naming check could not complete: {exc}', file=sys.stderr)
        sys.exit(1)
