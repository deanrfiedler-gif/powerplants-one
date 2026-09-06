#!/usr/bin/env python3
"""Validate PP-01 cross-file traceability, not application behaviour."""
from pathlib import Path
import csv
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []


def require(condition, message):
    if not condition:
        ERRORS.append(message)


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def csv_rows(path):
    with (ROOT / path).open(newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def expected(prefix, count, width=2):
    return {f'{prefix}{n:0{width}}' for n in range(1, count + 1)}


def main():
    paths = [
        'docs/prototype/README.md', 'docs/prototype/scope-and-journey.md',
        'docs/prototype/decisions-and-evidence.md', 'docs/prototype/assurance.md',
        'docs/architecture/BP-02-platform-architecture.md',
        'docs/blueprints/BP-07-service-operations.md',
        'docs/contracts/service-data-dictionary.md', 'docs/contracts/service-api.md',
        'docs/contracts/finance-handoff.md', 'docs/contracts/document-issue-distribution.md',
        'docs/testing/prototype-acceptance.md',
        'docs/delivery/prototype-implementation-plan.md',
    ]
    for path in paths:
        require((ROOT / path).is_file(), f'Missing package document {path}')
    parents = {x['requirement_id']: x for x in csv_rows('docs/requirements/requirements.csv')}
    dispositions = csv_rows('docs/prototype/traceability.csv')
    require(len(dispositions) == len(parents) == 78, 'Parent count mismatch')
    require({x['requirement_id'] for x in dispositions} == set(parents), 'Missing/extra parent disposition')
    require(len({x['requirement_id'] for x in dispositions}) == len(dispositions), 'Duplicate parent disposition')
    scenarios = json.loads(read('docs/testing/prototype-scenarios.json'))['cases']
    tests = {x['id']: x for x in scenarios}
    require(set(tests) == expected('PT-', 30) and len(scenarios) == 30, 'PT catalogue ID mismatch')
    master_tests = {x['acceptance_id'] for x in csv_rows('docs/testing/acceptance-scenarios.csv')}
    plan = read('docs/delivery/prototype-implementation-plan.md')
    plan_ids = set(re.findall(r'^\| (P\d{2}) ', plan, re.M))
    require(plan_ids == expected('P', 12), 'Implementation package IDs mismatch')
    plan_deps = {}
    for line in plan.splitlines():
        if re.match(r'^\| P\d{2} ', line):
            cells = [c.strip() for c in line.split('|')[1:-1]]
            ident = cells[0].split()[0]
            plan_deps[ident] = set(re.findall(r'\bP\d{2}\b', cells[1]))
    visited, active = set(), set()
    def visit(ident):
        if ident in active:
            ERRORS.append(f'Implementation dependency cycle at {ident}')
            return
        if ident in visited:
            return
        active.add(ident)
        for dep in plan_deps[ident]:
            require(dep in plan_ids, f'{ident}: missing dependency {dep}')
            if dep in plan_ids:
                visit(dep)
        active.remove(ident)
        visited.add(ident)
    for ident in plan_ids:
        visit(ident)
    test_doc = read('docs/testing/prototype-acceptance.md')
    for case in scenarios:
        ident = case['id']
        for key in ['title', 'preconditions', 'steps', 'expected', 'evidence', 'status']:
            require(bool(case.get(key)), f'{ident}: missing {key}')
        require(set(case['parent_acceptance_ids']) <= master_tests, f'{ident}: unknown parent AT')
        require(set(case['implementation_ids']) <= plan_ids, f'{ident}: unknown build package')
        require(f'### {ident} — {case["title"]}' in test_doc, f'{ident}: missing procedure heading')
        for key in ['preconditions','steps','expected','evidence']:
            require(case[key] in test_doc, f'{ident}: Markdown/JSON {key} differs')
        require(case['status'] == 'Not run', f'{ident}: authored procedure catalogue must not imply execution; record results separately')
    for row in dispositions:
        ident = row['requirement_id']
        require(row['requirement'] == parents[ident]['requirement'], f'{ident}: parent wording changed')
        require(row['disposition'] in {'Core','Partial','Deferred'}, f'{ident}: invalid disposition')
        require((ROOT / row['specification']).is_file(), f'{ident}: missing specification')
        require((ROOT / row['source']).is_file(), f'{ident}: missing source')
        pt = set(filter(None,row['prototype_test_ids'].split(';')))
        tasks = set(filter(None,row['implementation_ids'].split(';')))
        require(pt <= set(tests), f'{ident}: undefined PT mapping')
        require(tasks <= plan_ids, f'{ident}: undefined implementation mapping')
        if row['disposition'] != 'Deferred':
            require(bool(pt) and bool(tasks), f'{ident}: included scope lacks test/build mapping')
        else:
            require(not pt and not tasks, f'{ident}: deferred scope misleadingly mapped to implemented slice')
    svc = read('docs/blueprints/BP-07-service-operations.md')
    api = read('docs/contracts/service-api.md')
    register_counts = {}
    for prefix,count,content in [('SC-',15,svc),('CMP-',12,svc),('SR-',20,svc),('VAL-',24,svc),('TR-',16,svc),('API-C',26,api),('API-R',10,api)]:
        ids = set(re.findall(r'^\| ('+re.escape(prefix)+r'\d{2})\b',content,re.M))
        require(ids == expected(prefix,count), f'{prefix} register differs: {sorted(ids)}')
        register_counts[prefix.rstrip('-')] = len(ids)
    all_text = '\n'.join(read(p) for p in paths if (ROOT / p).exists())
    require(set(re.findall(r'\bPT-\d{2}\b',all_text)) <= set(tests), 'Undefined PT reference in package')
    require(set(re.findall(r'\bP\d{2}\b',all_text)) <= plan_ids, 'Undefined P reference in package')
    decision_ids = {x['decision_id'] for x in csv_rows('docs/decisions/decision-register.csv')}
    require(set(re.findall(r'\bD-\d{3}\b',all_text)) <= decision_ids, 'Undefined D reference in package')
    decisions_doc = read('docs/prototype/decisions-and-evidence.md')
    require(set(re.findall(r'^\| (D-\d{3}) ',decisions_doc,re.M)) == decision_ids, 'Decision disposition coverage mismatch')
    working = read('docs/blueprints/BP-01-master-blueprint.md')
    require(set(parents) <= set(re.findall(r'\b(?:CRM|EST|ENG|PRJ|SVC|SCM|FIN|DOC|NFR)-\d{2}\b',working)), 'Working master lost baseline parent IDs')
    report = {'status':'failed' if ERRORS else 'passed','package':'PP-01','documents':len(paths),'parent_dispositions':len(dispositions),'dispositions':{k:sum(x['disposition']==k for x in dispositions) for k in ['Core','Partial','Deferred']},'master_decisions':len(decision_ids),'prototype_procedures':len(tests),'implementation_packages':len(plan_ids),'registers':register_counts,'errors':ERRORS,'scope':'Documentation consistency only; authored catalogue defaults are not execution evidence; see recorded runs'}
    print(json.dumps(report,indent=2))
    return bool(ERRORS)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError,ValueError,KeyError,IndexError) as exc:
        print(f'Prototype check could not complete: {exc}',file=sys.stderr)
        sys.exit(1)
