#!/usr/bin/env python3
"""Check migration and seed numbering, and manage number reservations.

Two pull requests that each add "the next" migration collide on the number. The
runner needs unique, increasing versions, and many database suites pin the exact
list, so a collision is expensive to find late. This script finds it early.

    python3 scripts/check_migrations.py              check the working tree (CI)
    python3 scripts/check_migrations.py --next       print the next free number
    python3 scripts/check_migrations.py --reserve "purpose"   claim it in db/reservations/
    python3 scripts/check_migrations.py --open-prs   also compare with open pull requests (needs gh)

The tree check also runs from scripts/check_foundation.py, so the Documentation
assurance job covers it. It sees the merged tree of a pull request and `main`, so
a duplicate number introduced by either side shows up there. Standard library only.
Convention: docs/decisions/merge-conflict-reduction.md and CONTRIBUTING.md.
"""
from pathlib import Path
import datetime
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'scripts/migration-registry.ts'
MIGRATIONS = ROOT / 'db/migrations'
RESERVATIONS = ROOT / 'db/reservations'
# Not a migration: db:reset runs it to drop the schemas, and tests read it by name.
NOT_MIGRATIONS = {'0001-recover.sql'}
NAME = re.compile(r'^(\d{4})-[a-z0-9-]+\.sql$')
FIELDS = ('number', 'branch', 'owner', 'purpose', 'date')


def registry():
    text = REGISTRY.read_text(encoding='utf-8')
    files_block = re.search(r'export const migrationFiles = \[(.*?)\] as const;', text, re.S)
    seeds_block = re.search(r'export const seedFiles = \[(.*?)\] as const;', text, re.S)
    latest = re.search(r'export const latestMigrationVersion = (\d+);', text)
    if not (files_block and seeds_block and latest):
        raise ValueError('scripts/migration-registry.ts: could not find migrationFiles, seedFiles and latestMigrationVersion')
    files = re.findall(r'^\s*"([^"]+)",\s*$', re.sub(r'//.*', '', files_block.group(1)), re.M)
    seeds = [(int(v), f) for v, f in re.findall(r'\[(\d+),\s*"([^"]+)"\]', seeds_block.group(1))]
    return files, seeds, int(latest.group(1))


def reservations(problems):
    found = {}
    if not RESERVATIONS.is_dir():
        return found
    for path in sorted(RESERVATIONS.glob('*.md')):
        if path.name == 'README.md':
            continue
        label = f'db/reservations/{path.name}'
        match = re.fullmatch(r'(\d{4})\.md', path.name)
        if not match:
            problems.append(f'{label}: reservation files are named NNNN.md after the number they claim')
            continue
        head = re.match(r'^---\n(.*?)\n---', path.read_text(encoding='utf-8').replace('\r\n', '\n'), re.S)
        meta = {}
        for line in (head.group(1).splitlines() if head else []):
            key, sep, value = line.partition(':')
            if sep:
                meta[key.strip()] = value.strip()
        missing = [f for f in FIELDS if not meta.get(f)]
        if missing:
            problems.append(f'{label}: front matter is missing {", ".join(missing)}')
        elif meta['number'] != match.group(1):
            problems.append(f'{label}: number {meta["number"]} does not match the filename')
        found[int(match.group(1))] = meta
    return found


def check_tree():
    """Return a list of problem strings for the working tree."""
    problems = []
    files, seeds, latest = registry()

    versions = []
    for file in files:
        match = NAME.match(file)
        if not match:
            problems.append(f'migration-registry.ts: invalid migration filename {file}')
            continue
        versions.append(int(match.group(1)))
    for earlier, later in zip(versions, versions[1:]):
        if later == earlier:
            problems.append(f'migration-registry.ts: two migrations share version {later:04d}; the later merge renumbers')
        elif later < earlier:
            problems.append(f'migration-registry.ts: version {later:04d} follows {earlier:04d}; versions must increase')

    on_disk = sorted(p.name for p in MIGRATIONS.glob('*.sql') if p.name not in NOT_MIGRATIONS)
    by_number = {}
    for name in on_disk:
        match = NAME.match(name)
        if not match:
            problems.append(f'db/migrations/{name}: invalid migration filename')
            continue
        by_number.setdefault(int(match.group(1)), []).append(name)
    for number, names in sorted(by_number.items()):
        if len(names) > 1:
            problems.append(f'db/migrations: version {number:04d} is used by {len(names)} files ({", ".join(names)}); the later merge renumbers')
    for name in sorted(set(on_disk) - set(files)):
        problems.append(f'db/migrations/{name}: not listed in scripts/migration-registry.ts')
    for name in sorted(set(files) - set(on_disk)):
        problems.append(f'scripts/migration-registry.ts lists {name}, which is not in db/migrations')

    if versions and latest != max(versions):
        problems.append(f'migration-registry.ts: latestMigrationVersion is {latest} but the newest migration is {max(versions)}')

    previous, registered = 0, set(versions)
    for version, file in seeds:
        if version not in registered:
            problems.append(f'migration-registry.ts: seed {file} is registered against {version:04d}, which is not a migration')
        if version <= previous:
            problems.append(f'migration-registry.ts: seed {file} (version {version}) is not in increasing order or repeats a version')
        if not (ROOT / 'db' / file).is_file():
            problems.append(f'migration-registry.ts: seed file db/{file} does not exist')
        previous = version

    for number in reservations(problems):
        if number in registered or number in by_number:
            problems.append(f'db/reservations/{number:04d}.md: {number:04d} is already a migration; delete the reservation in the pull request that lands it')
    return problems


def next_free(include=()):
    files, _, _ = registry()
    numbers = {int(NAME.match(f).group(1)) for f in files if NAME.match(f)}
    numbers |= set(reservations([])) | set(include)
    return max(numbers) + 1


def run(*command):
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)


def claims_in_text(paths):
    claimed = set()
    for path in paths:
        match = re.match(r'db/migrations/(\d{4})-', path) or re.match(r'db/reservations/(\d{4})\.md$', path)
        if match:
            claimed.add(int(match.group(1)))
    return claimed


def open_pr_claims():
    listing = run('gh', 'pr', 'list', '--state', 'open', '--limit', '200', '--json', 'number,headRefName,files')
    if listing.returncode != 0:
        raise ValueError(f'gh pr list failed: {listing.stderr.strip() or "is gh installed and signed in?"}')
    claims = {}
    for pr in json.loads(listing.stdout):
        for number in claims_in_text(f['path'] for f in pr['files']):
            claims.setdefault(number, []).append((pr['number'], pr['headRefName']))
    return claims


def check_open_prs():
    """Compare numbers this branch adds with numbers other open pull requests add."""
    base = 'origin/main'
    if run('git', 'rev-parse', '--verify', base).returncode != 0:
        return [f'{base} is not available; run git fetch origin first']
    diff = run('git', 'diff', '--name-only', f'{base}...HEAD')
    mine = claims_in_text(diff.stdout.split())
    branch = run('git', 'branch', '--show-current').stdout.strip()
    problems = []
    for number, holders in sorted(open_pr_claims().items()):
        others = [(n, b) for n, b in holders if b != branch]
        if number in mine and others:
            listed = ', '.join(f'#{n} ({b})' for n, b in others)
            problems.append(f'{number:04d} is also claimed by open pull request {listed}; whoever merges second renumbers, so settle it now')
    return problems


def reserve(purpose):
    claims = open_pr_claims() if run('gh', '--version').returncode == 0 else {}
    number = next_free(claims.keys())
    branch = run('git', 'branch', '--show-current').stdout.strip() or 'unknown'
    owner = run('git', 'config', 'user.name').stdout.strip() or 'unknown'
    RESERVATIONS.mkdir(exist_ok=True)
    path = RESERVATIONS / f'{number:04d}.md'
    if path.exists():
        raise ValueError(f'{path.relative_to(ROOT)} already exists')
    body = f'---\nnumber: {number:04d}\nbranch: {branch}\nowner: {owner}\npurpose: {purpose}\ndate: {datetime.date.today().isoformat()}\n---\n'
    with path.open('w', encoding='utf-8', newline='\n') as handle:
        handle.write(body)
    print(path.relative_to(ROOT).as_posix())


def main(argv):
    try:
        if '--next' in argv:
            include = open_pr_claims().keys() if '--open-prs' in argv else ()
            print(f'{next_free(include):04d}')
            return 0
        if '--reserve' in argv:
            index = argv.index('--reserve')
            if index + 1 >= len(argv):
                sys.exit('--reserve needs a purpose, for example --reserve "customer communications"')
            reserve(argv[index + 1])
            return 0
        problems = check_tree()
        if '--open-prs' in argv:
            problems += check_open_prs()
    except (OSError, ValueError) as exc:
        print(f'Migration check could not complete: {exc}', file=sys.stderr)
        return 1
    for message in problems:
        print(message, file=sys.stderr)
    print('migration numbering: ' + ('failed' if problems else 'unique, registered and unreserved'))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
