#!/usr/bin/env python3
"""Check documentation provenance and traceability without external dependencies.

This is a repository-assurance utility, not an application acceptance suite.
"""
from pathlib import Path
import csv
import hashlib
import json
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / 'docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md'
ERRORS = []


def problem(message):
    ERRORS.append(message)


def rows(path):
    with (ROOT / path).open(newline='', encoding='utf-8') as handle:
        return list(csv.DictReader(handle))


def unique_sequence(values, expected, label):
    if len(values) != len(set(values)):
        problem(f'{label}: duplicate IDs')
    if set(values) != set(expected):
        problem(f'{label}: ID set differs; missing={set(expected)-set(values)}, extra={set(values)-set(expected)}')


def slug(text):
    text = text.lower()
    return ''.join(c for c in text if c.isalnum() or c in '_- ').replace(' ', '-')


def anchors(text):
    result = set()
    counts = {}
    in_fence = False
    marker = None
    for line in text.splitlines():
        fence = re.match(r'^\s*(`{3,}|~{3,})', line)
        if fence:
            if not in_fence:
                in_fence = True
                marker = fence[1][0]
            elif fence[1][0] == marker:
                in_fence = False
            continue
        if in_fence:
            continue
        match = re.match(r'^#{1,6}\s+(.+?)\s*#*$', line)
        if match:
            value = slug(match[1])
            suffix = counts.get(value, 0)
            counts[value] = suffix + 1
            result.add(value + (f'-{suffix}' if suffix else ''))
    return result


def check_sources():
    manifest = json.loads((ROOT / 'docs/reference/source-manifest.json').read_text())
    for entry in manifest['files']:
        path = ROOT / entry['path']
        if not path.is_file():
            problem(f'Missing reference: {entry["path"]}')
            continue
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != entry['sha256'] or len(data) != entry['bytes']:
            problem(f'Issued reference changed: {entry["path"]}; retain historical bytes or issue a controlled new version')
    return len(manifest['files'])


def check_registers():
    text = MASTER.read_text()
    source = text.split('## Appendix B —')[0]
    definitions = {}
    decisions_source = {}
    acceptance_source = {}
    for line in source.splitlines():
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if re.match(r'^\| (CRM|EST|ENG|PRJ|SVC|SCM|FIN|DOC|NFR)-\d{2} \|', line):
            definitions[cells[0]] = cells[1:]
        if re.match(r'^\| AT-\d{2} \|', line):
            acceptance_source[cells[0]] = cells[1:]
    section = text.split('### 29.1 Open decision register')[1].split('### 29.2')[0]
    for line in section.splitlines():
        if re.match(r'^\| D-\d{3} \|', line):
            cells = [c.strip() for c in line.split('|')[1:-1]]
            decisions_source[cells[0]] = cells[1:]
    requirements = rows('docs/requirements/requirements.csv')
    decisions = rows('docs/decisions/decision-register.csv')
    tests = rows('docs/testing/acceptance-scenarios.csv')
    expected = [f'{p}-{n:02}' for p, count in [('CRM',8),('EST',9),('ENG',7),('PRJ',8),('SVC',12),('SCM',8),('FIN',8),('DOC',6),('NFR',12)] for n in range(1,count+1)]
    unique_sequence([r['requirement_id'] for r in requirements], expected, 'Requirements')
    unique_sequence([r['decision_id'] for r in decisions], [f'D-{n:03}' for n in range(1,30)], 'Decisions')
    unique_sequence([r['acceptance_id'] for r in tests], [f'AT-{n:02}' for n in range(1,39)], 'Acceptance')
    backlog = json.loads((ROOT / 'docs/delivery/initial-backlog.json').read_text())['items']
    items = {item['id']: item for item in backlog}
    unique_sequence([item['id'] for item in backlog], [f'PPO-{n:03}' for n in range(1,17)], 'Initial backlog')
    trace = text.split('## Appendix B —')[1].split('## Appendix C —')[0]
    trace_rows = {}
    for line in trace.splitlines():
        if re.match(r'^\| (CRM|EST|ENG|PRJ|SVC|SCM|FIN|DOC|NFR)-\d{2} \|', line):
            cells = [c.strip() for c in line.split('|')[1:-1]]
            trace_rows[cells[0]] = cells[1:]
    for row in requirements:
        ident = row['requirement_id']
        if [row['requirement'], row['source_control']] != definitions.get(ident):
            problem(f'{ident}: source requirement wording differs')
        if [row[k] for k in ['evidence','proposed_owner','release_boundary','dependencies_and_spec','planned_acceptance']] != trace_rows.get(ident):
            problem(f'{ident}: source Appendix B traceability differs')
        linked = row['initial_backlog_ids'].split(';')
        if not linked or any(value not in items for value in linked):
            problem(f'{ident}: missing/invalid backlog mapping')
        for value in linked:
            if value in items and ident not in items[value]['requirement_ids']:
                problem(f'{ident}: reciprocal mapping missing in {value}')
        for value in re.findall(r'AT-\d{2}', row['planned_acceptance']):
            if value not in acceptance_source:
                problem(f'{ident}: undefined acceptance {value}')
    for row in decisions:
        if [row[k] for k in ['question','proposed_owner','closure_evidence_and_gate']] != decisions_source.get(row['decision_id']):
            problem(f'{row["decision_id"]}: source decision differs')
    for row in tests:
        if [row['scenario'], row['expected_result']] != acceptance_source.get(row['acceptance_id']):
            problem(f'{row["acceptance_id"]}: source acceptance differs')
    for item in backlog:
        if not item['acceptance_criteria'] or not item['objective']:
            problem(f'{item["id"]}: incomplete work package')
        for ident in item['decision_ids']:
            if ident not in decisions_source:
                problem(f'{item["id"]}: undefined decision {ident}')
        for ident in item['requirement_ids']:
            if ident not in definitions:
                problem(f'{item["id"]}: undefined requirement {ident}')
        number, url = item['github_issue_number'], item['github_issue_url']
        if bool(number) != bool(url):
            problem(f'{item["id"]}: incomplete GitHub issue mapping')
        if url and url != f'https://github.com/deanrfiedler-gif/powerplants-one/issues/{number}':
            problem(f'{item["id"]}: unexpected issue URL')
        if url and url not in (ROOT / 'docs/delivery/backlog.md').read_text():
            problem(f'{item["id"]}: issue link missing from backlog index')
        for dep in item['dependencies']:
            if dep not in items:
                problem(f'{item["id"]}: undefined dependency {dep}')
    seen, active = set(), set()
    def visit(ident):
        if ident in active:
            problem(f'Backlog dependency cycle at {ident}')
            return
        if ident in seen:
            return
        active.add(ident)
        for dep in items[ident]['dependencies']:
            if dep in items:
                visit(dep)
        active.remove(ident)
        seen.add(ident)
    for ident in items:
        visit(ident)
    return {'requirements':len(requirements), 'decisions':len(decisions), 'planned_acceptance':len(tests), 'backlog_items':len(backlog), 'linked_issues':sum(bool(x['github_issue_url']) for x in backlog)}


def check_links_and_hygiene():
    checked = 0
    docs = list(ROOT.rglob('*.md'))
    for path in docs:
        if '.git' in path.parts:
            continue
        text = path.read_text()
        for target in re.findall(r'\]\(([^\s)]+)\)', text):
            if urlsplit(target).scheme:
                continue
            parsed = urlsplit(target)
            candidate = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            if not candidate.is_relative_to(ROOT):
                problem(f'{path.relative_to(ROOT)}: local link escapes repository: {target}')
            elif not candidate.exists():
                problem(f'{path.relative_to(ROOT)}: broken local link: {target}')
            elif parsed.fragment and candidate.suffix == '.md' and unquote(parsed.fragment) not in anchors(candidate.read_text()):
                problem(f'{path.relative_to(ROOT)}: unknown heading: {target}')
            checked += 1
        if re.search(r'\]\((?:sandbox:|file:)|/workspace/scratch/', text):
            problem(f'{path.relative_to(ROOT)}: scratch-only reference in repository document')
    for path in ROOT.rglob('*'):
        if not path.is_file() or '.git' in path.parts:
            continue
        relative = path.relative_to(ROOT)
        if relative.parts[0] in {'local-data','exports','backups','tmp'} or (path.name.startswith('.env') and path.name != '.env.example') or path.suffix in {'.pem','.key','.p12','.pfx'}:
            problem(f'Unexpected sensitive/local-data path: {relative}')
        if path.suffix in {'.md','.json','.yml','.yaml','.csv'}:
            content = path.read_text()
            if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b', content):
                problem(f'Possible credential content: {relative}')
    return checked


def main():
    count = check_sources()
    registers = check_registers()
    links = check_links_and_hygiene()
    report = {'status':'failed' if ERRORS else 'passed', 'issued_sources':count, **registers, 'local_links_checked':links, 'errors':ERRORS, 'scope':'Documentation assurance only; no business acceptance tests executed'}
    print(json.dumps(report, indent=2))
    return 1 if ERRORS else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, IndexError) as exc:
        print(f'Foundation check could not complete: {exc}', file=sys.stderr)
        sys.exit(1)
