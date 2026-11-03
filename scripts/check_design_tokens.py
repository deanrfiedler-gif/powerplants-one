#!/usr/bin/env python3
"""Compare the committed Figma variable snapshot with the application's CSS.

Enforced: each mapped variable's CSS property holds the Figma value somewhere in
src/, following var() aliases to any depth, and every variable without a CSS
name is listed as design-only or in the dated unmapped baseline. That baseline
can only shrink: it must stay within ORIGINAL_UNMAPPED_BASELINE. Declarations
are read outside comments and quoted strings, and a !important priority is not
part of the value. A pass does not prove every page uses that value.
Report-only until ADR-0067 stage 5: properties holding more than one value, and
hard-coded hex colours.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = 'docs/design/figma-variables.json'
PROPERTY = re.compile(r'(?<![\w-])(--[a-z0-9-]+)\s*:\s*([^;{}]+)[;}]', re.I)
HEX = re.compile(r'#[0-9a-f]{3,8}\b', re.I)
ALIAS = re.compile(r'var\((--[a-z0-9-]+)\)')
PRIORITY = re.compile(r'\s*!\s*important\s*$', re.I)
STATUSES = {'mapped', 'design-only', 'unmapped'}
# Variables without a CSS name at the first reading, 1 November 2026. The snapshot's
# own list may lose names at reconciliation but never gain one, so a refresh cannot
# grandfather a new omission. Change this set only to remove names.
ORIGINAL_UNMAPPED_BASELINE = frozenset({
    'shell/crumb-separator', 'shell/search-surface', 'shell/search-border', 'shell/action-hover',
    'shell/panel-border', 'shell/current-link', 'shell/link-text', 'shell/section-label',
    'shell/select-border', 'surface/row-selected', 'status/attention-dot', 'cpq/info-surface',
    'cpq/info-border', 'planner/attention-selected', 'chart/1', 'chart/2', 'chart/3', 'chart/4',
    'chart/5', 'chart/6', 'chart/neutral', 'chart/neutral-strong', 'space/4', 'space/8',
    'space/12', 'space/14', 'space/16', 'space/24', 'shell/rail-width-expanded',
    'shell/header-height', 'radius/rail-item', 'radius/panel',
})


def normalise(value):
    value = PRIORITY.sub('', str(value)).strip().lower()
    if re.fullmatch(r'#[0-9a-f]{3}', value):
        value = '#' + ''.join(c * 2 for c in value[1:])
    return value[:-2] if value.endswith('px') else value


def masked(text):
    """Blank comments and the inside of quoted strings, keeping every offset.

    Declarations are then found only in real CSS, while their values are still
    read from the original text, so a quoted value stays intact.
    """
    out, i, n = list(text), 0, len(text)
    while i < n:
        if text.startswith('/*', i):
            end = text.find('*/', i + 2)
            end = n if end < 0 else end + 2
            out[i:end] = ' ' * (end - i)
            i = end
        elif text[i] in '"\'':
            quote, j = text[i], i + 1
            while j < n and text[j] != quote and text[j] != '\n':
                j += 2 if text[j] == '\\' else 1
            end = min(j, n)
            out[i + 1:end] = 'x' * (end - i - 1)
            i = end + 1
        else:
            i += 1
    return ''.join(out)


def read_css(root):
    """Return every property's values and the hard-coded colour count per file."""
    definitions = defaultdict(set)
    hard_coded = {}
    for path in sorted((root / 'src').rglob('*.css')):
        text = path.read_text(encoding='utf-8', errors='ignore')
        mask = masked(text)
        spans = []
        for match in PROPERTY.finditer(mask):
            spans.append(match.span())
            definitions[match.group(1)].add(normalise(text[match.start(2):match.end(2)]))
        outside = ''.join(mask[a:b] for a, b in zip([0] + [e for _, e in spans], [s for s, _ in spans] + [len(mask)]))
        count = len(HEX.findall(outside))
        if count:
            hard_coded[path.relative_to(root).as_posix()] = count
    return definitions, hard_coded


def resolved(prop, definitions, seen=frozenset()):
    """Return the literal values a property can take, following var() aliases to any depth."""
    seen = seen | {prop}
    values = set()
    for value in definitions.get(prop, ()):
        alias = ALIAS.fullmatch(value)
        if not alias:
            values.add(value)
        elif alias.group(1) not in seen:
            values |= resolved(alias.group(1), definitions, seen)
    return values


def check(root=ROOT):
    """Return failure messages for the enforced rules."""
    data = json.loads((root / SNAPSHOT).read_text(encoding='utf-8'))
    definitions, _ = read_css(root)
    failures = []
    if 'figma.com' in json.dumps(data):
        failures.append(f'{SNAPSHOT}: Figma links never go in the repository')
    seen = set()
    for variable in data['variables']:
        name, status, code = variable['name'], variable.get('status'), variable.get('code', '')
        if name in seen:
            failures.append(f'{name}: listed twice')
        seen.add(name)
        if status not in STATUSES:
            failures.append(f'{name}: status must be one of {sorted(STATUSES)}')
        elif status == 'mapped':
            prop = ALIAS.fullmatch(code)
            if not prop:
                failures.append(f'{name}: a mapped variable needs a code name of the form var(--name)')
            elif prop.group(1) not in definitions:
                failures.append(f'{name}: {prop.group(1)} is not defined in src/')
            elif normalise(variable['value']) not in resolved(prop.group(1), definitions):
                failures.append(f"{name}: {prop.group(1)} has no value matching Figma's {variable['value']}")
        elif code:
            failures.append(f'{name}: has a code name, so its status must be mapped')
    baseline = set(data.get('unmapped_baseline', []))
    for name in sorted(baseline - ORIGINAL_UNMAPPED_BASELINE):
        failures.append(f'{name}: the unmapped baseline can only shrink; give it a CSS name, or design-only with a reason')
    for variable in data['variables']:
        if variable.get('status') == 'unmapped' and variable['name'] not in baseline:
            failures.append(f"{variable['name']}: new variables need a CSS name, or design-only with a reason")
    return failures


def mapped_multi_valued(root=ROOT):
    """Return mapped CSS properties whose other values a passing check does not rule out."""
    data = json.loads((root / SNAPSHOT).read_text(encoding='utf-8'))
    definitions, _ = read_css(root)
    props = (ALIAS.fullmatch(v.get('code', '')) for v in data['variables'] if v.get('status') == 'mapped')
    return sorted({p.group(1) for p in props if p and len(definitions.get(p.group(1), ())) > 1})


def report(root=ROOT):
    definitions, hard_coded = read_css(root)
    multi = sorted(name for name, values in definitions.items() if len(values) > 1)
    mapped = mapped_multi_valued(root)
    print(f'Custom properties: {len(definitions)}; holding more than one value: {len(multi)}')
    print(f'Mapped properties holding more than one value: {len(mapped)}. The check only proves the Figma value is one of them.')
    for name in mapped:
        print(f'  {name}: ' + ', '.join(sorted(definitions[name])))
    print(f'Hard-coded hex colours outside token definitions: {sum(hard_coded.values())}')
    for path, count in sorted(hard_coded.items(), key=lambda item: -item[1])[:10]:
        print(f'  {count:5} {path}')


def main():
    failures = check()
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    data = json.loads((ROOT / SNAPSHOT).read_text(encoding='utf-8'))
    counts = defaultdict(int)
    for variable in data['variables']:
        counts[variable['status']] += 1
    print(f"Design tokens OK: {counts['mapped']} mapped, {counts['design-only']} design-only, {counts['unmapped']} unmapped baseline")
    if '--report' in sys.argv:
        report()
    return 0


if __name__ == '__main__':
    sys.exit(main())
