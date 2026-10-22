#!/usr/bin/env python3
"""Check a PR's changed paths for routine shared-document edits.

Compare the head with its merge base, not with unrelated changes on newer main.
A newly added, exact-path maintenance declaration makes exceptional changes
visible to review. It is a declaration, not evidence of approval. No branch-name
or environment-variable bypass is provided. Standard library only.
"""
import argparse
import datetime
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PROTECTED = {
    'README.md', 'docs/README.md', 'docs/STATUS.md',
    'docs/decisions/README.md', 'docs/status/legacy-index.txt',
}
GENERATED = {
    'docs/design/development/ui-build-sequence.md',
    'docs/design/development/ui-build-sequence.json',
}
DECLARATIONS = 'docs/maintenance/'
DECLARATION_NAME = re.compile(r'^docs/maintenance/(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.json$')


def validate(changes, read_head):
    """changes maps path to A/M/D; read_head reads UTF-8 content at the PR head."""
    problems, declared = [], set()
    for path, status in changes.items():
        if path in GENERATED or path.startswith('tmp/'):
            if status != 'D':
                problems.append(f'{path}: generated output must not be committed; keep its sources only')
        if not path.startswith(DECLARATIONS) or not path.endswith('.json') or status == 'D':
            continue
        if status != 'A':
            problems.append(f'{path}: maintenance declarations are per contribution; add a new declaration instead of reusing one')
            continue
        match = DECLARATION_NAME.fullmatch(path)
        if not match:
            problems.append(f'{path}: name must be YYYY-MM-DD-slug.json')
            continue
        try:
            datetime.date.fromisoformat(match[1])
            declaration = json.loads(read_head(path))
            if not isinstance(declaration, dict) or set(declaration) != {'kind', 'reason', 'decision', 'paths'}:
                raise ValueError('expected exactly kind, reason, decision and paths')
            if declaration['kind'] != 'documentation-maintenance':
                raise ValueError('kind must be documentation-maintenance')
            if not isinstance(declaration['reason'], str) or len(declaration['reason'].strip()) < 20:
                raise ValueError('reason must explain the maintenance change (at least 20 characters)')
            decision = declaration['decision']
            if not isinstance(decision, str) or not re.fullmatch(r'docs/decisions/[a-zA-Z0-9-]+\.md', decision):
                raise ValueError('decision must be an exact Markdown record under docs/decisions/')
            if not read_head(decision).strip():
                raise ValueError('decision record is empty')
            paths = declaration['paths']
            if not isinstance(paths, list) or not paths or any(not isinstance(p, str) for p in paths):
                raise ValueError('paths must be a nonempty list of exact protected paths')
            if len(paths) != len(set(paths)) or any(p not in PROTECTED for p in paths):
                raise ValueError('paths must be unique protected paths, without wildcards')
            if any(p not in changes for p in paths):
                raise ValueError('paths must name only protected files changed in this contribution')
            if declared.intersection(paths):
                raise ValueError('a protected path may be declared only once per contribution')
            declared.update(paths)
        except (ValueError, KeyError, OSError, RuntimeError) as exc:
            problems.append(f'{path}: {exc}')
    for path in sorted(set(changes).intersection(PROTECTED) - declared):
        problems.append(f'{path}: routine PRs leave shared landing/history files unchanged. '
                        'Add a docs/status/ fragment or update the relevant chapter. '
                        'For repository maintenance, add an exact-path declaration under docs/maintenance/ (see its README).')
    return problems


def git(*args, root=ROOT):
    result = subprocess.run(['git', *args], cwd=root, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace').strip() or 'git failed')
    return result.stdout


def check(base, head='HEAD', root=ROOT):
    # Resolve refs first: malformed/missing refs fail closed, and cannot become options.
    base_sha = git('rev-parse', '--verify', '--end-of-options', f'{base}^{{commit}}', root=root).decode().strip()
    head_sha = git('rev-parse', '--verify', '--end-of-options', f'{head}^{{commit}}', root=root).decode().strip()
    ancestor = git('merge-base', base_sha, head_sha, root=root).decode().strip()
    fields = git('diff', '--name-status', '--no-renames', '-z', ancestor, head_sha, '--', root=root).decode('utf-8').split('\0')
    changes = {PurePosixPath(fields[i + 1]).as_posix(): fields[i] for i in range(0, len(fields) - 1, 2)}
    def read_head(path):
        return git('show', f'{head_sha}:{path}', root=root).decode('utf-8')
    return validate(changes, read_head)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True, help='PR base commit or current origin/main')
    parser.add_argument('--head', default='HEAD', help='committed PR head; default HEAD')
    args = parser.parse_args(argv)
    try:
        problems = check(args.base, args.head)
    except (OSError, RuntimeError, UnicodeError) as exc:
        print(f'documentation scope could not be checked: {exc}', file=sys.stderr)
        return 1
    for message in problems:
        print(message, file=sys.stderr)
    print('documentation scope: ' + ('failed' if problems else 'passed'))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
