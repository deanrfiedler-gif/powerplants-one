#!/usr/bin/env python3
"""Compare the two complete browser executions from exact-head CI artifacts.

The caller verifies artifact/run provenance against the stated Git head. This
checks every case identity, expected outcome, actual outcome and attempt, and
permits only the existing warm-up duplicated by the desktop/mobile split.
"""
import argparse
from collections import Counter
import json
from pathlib import Path


def report(directory, suffix):
    paths = [p for p in Path(directory).rglob('results.json')
             if p.as_posix().endswith(suffix)]
    assert len(paths) == 1, paths
    data = json.loads(paths[0].read_text(encoding='utf-8-sig'))
    assert data['stats']['unexpected'] == data['stats']['flaky'] == 0, data['stats']
    cases = {}

    def walk(suite, parents=()):
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                key = (test['projectName'], spec['file'], *parents, spec['title'])
                assert key not in cases, key
                outcome = {
                    'expected': test['expectedStatus'], 'outcome': test['status'],
                    'attempts': [{'status': r['status'], 'retry': r.get('retry', 0)}
                                 for r in test['results']],
                }
                assert len(outcome['attempts']) == 1, (key, outcome)
                assert outcome['attempts'][0]['retry'] == 0, (key, outcome)
                cases[key] = outcome
        for child in suite.get('suites', []):
            walk(child, parents + (suite.get('title', ''),))

    for suite in data['suites']:
        walk(suite)
    return data['stats'], cases


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('full')
parser.add_argument('desktop')
parser.add_argument('mobile')
parser.add_argument('--head', required=True)
parser.add_argument('--passed', required=True, type=int)
parser.add_argument('--skipped', required=True, type=int)
parser.add_argument('--output', required=True)
args = parser.parse_args()
stats, full = report(args.full, 'p11-full-browser/results.json')
desktop_stats, desktop = report(args.desktop, 'compiled-browser/results.json')
mobile_stats, mobile = report(args.mobile, 'compiled-browser/results.json')
duplicates = set(desktop) & set(mobile)
assert len(duplicates) == 1 and next(iter(duplicates))[0] == 'warm-up', duplicates
for key in duplicates:
    assert desktop[key] == mobile[key], key
combined = desktop | mobile
assert full == combined, {
    'missing': sorted(set(full) - set(combined)),
    'extra': sorted(set(combined) - set(full)),
    'different': [k for k in sorted(set(full) & set(combined)) if full[k] != combined[k]],
}
counts = Counter(v['attempts'][0]['status'] for v in full.values())
assert counts == {'passed': args.passed, 'skipped': args.skipped}, counts
result = {
    'source_head': args.head, 'case_identities': len(full), 'outcomes': dict(counts),
    'full_stats': stats, 'desktop_stats': desktop_stats, 'mobile_stats': mobile_stats,
    'duplicated_warmup': sorted(duplicates), 'missing': [], 'extra': [],
    'different_outcomes': [], 'retried_or_flaky': 0,
    'cases': [{'identity': key, **full[key]} for key in sorted(full)],
}
Path(args.output).write_text(json.dumps(result, indent=2) + '\n', encoding='utf8')
print(json.dumps({k: v for k, v in result.items() if k != 'cases'}, indent=2))
