#!/usr/bin/env python3
"""Decide whether a pull request changes documentation only.

A documentation-only pull request cannot change what the database, browser and
application suites prove, so those workflows skip their heavy jobs when this
script says `docs_only=true` (see .github/workflows and
docs/decisions/merge-conflict-reduction.md). The required check names still
report: a job skipped by a condition counts as passing for a required check, and
the stable gate jobs are skipped with it.

    python3 scripts/ci_scope.py                      diff the merge ref against its base (CI)
    python3 scripts/ci_scope.py --base A --head B    diff two revisions
    python3 scripts/ci_scope.py --self-test          check the classifier itself

It writes `docs_only=true|false` to $GITHUB_OUTPUT and a short reason to
$GITHUB_STEP_SUMMARY. It always exits 0 and answers `false` when unsure (not a
pull request, no merge parents, a git error, an empty diff), so a fault here runs
the full suites, never fewer. Standard library only.

Policy. A changed path is documentation only when it is Markdown (or a CSV or
text register) in a prose folder listed in PROSE, or one of the root files
README.md, CONTRIBUTING.md, AGENTS.md and LICENSE. Never documentation only:
anything under docs/design/, docs/reference/ or docs/testing/evidence/ (the
application and its tests read those by directory), any other extension (JSON,
HTML, CSS, JS, images), and anything outside docs/ and the root files (source,
tests, scripts, migrations, workflows, package files). A prose file whose path
appears literally in source, tests, database, public or non-Python script files is
also not documentation only, because a test reads it (for example
docs/decisions/es08-design-board.md).
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ROOT_FILES = {'README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'LICENSE'}
MARKDOWN = ('.md',)
REGISTER = ('.md', '.csv', '.txt')
# (folder prefix, extensions that count as documentation there)
PROSE = (
    ('docs/status/', REGISTER),
    ('docs/decisions/', REGISTER),
    ('docs/delivery/', REGISTER),
    ('docs/contracts/', REGISTER),
    ('docs/requirements/', REGISTER),
    ('docs/prototype/', REGISTER),
    ('docs/standards/', REGISTER),
    ('docs/testing/', REGISTER),
    ('docs/architecture/', MARKDOWN),
    ('docs/interfaces/', MARKDOWN),
    ('docs/guides/', MARKDOWN),
    ('docs/blueprints/', MARKDOWN),
    ('db/reservations/', MARKDOWN),
)
NEVER = ('docs/design/', 'docs/reference/', 'docs/testing/evidence/')
# Where a test or the application could name a documentation file. Python scripts
# are the documentation checkers themselves and run in their own job.
CONSUMERS = (
    'src', 'tests', 'db', 'public', 'scripts', ':(exclude)scripts/*.py',
    'playwright*.ts', 'next.config.ts', 'eslint.config.mjs', 'tsconfig.json', 'package.json',
)


def is_prose(path):
    """True when the path alone makes it documentation (before the consumer check)."""
    if path in ROOT_FILES:
        return True
    if path.startswith(NEVER):
        return False
    if path.startswith('docs/') and path.count('/') == 1:  # docs/STATUS.md, docs/README.md
        return path.endswith(MARKDOWN)
    return any(path.startswith(prefix) and path.endswith(ext) for prefix, ext in PROSE)


def referenced(paths, root=ROOT):
    """The subset of paths that a consumer file names literally."""
    if not paths:
        return set()
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(sorted(paths)) + '\n')
        patterns = handle.name
    try:
        done = subprocess.run(
            ['git', 'grep', '-h', '-o', '-I', '-F', '-f', patterns, '--', *CONSUMERS],
            cwd=root, capture_output=True, text=True, encoding='utf-8', errors='replace')
    finally:
        os.unlink(patterns)
    if done.returncode not in (0, 1):  # 1 means no match
        raise RuntimeError(done.stderr.strip() or f'git grep exited {done.returncode}')
    return {line.strip() for line in done.stdout.splitlines()} & set(paths)


def classify(changed, consumers=referenced):
    """Return (docs_only, reason). `consumers` maps paths to those a consumer names."""
    if not changed:
        return False, 'no changed files found'
    code = sorted(path for path in changed if not is_prose(path))
    if code:
        more = f' and {len(code) - 1} more' if len(code) > 1 else ''
        return False, f'not documentation: {code[0]}{more}'
    # Root files have bare names that appear in comments; only a folder path is a real reference.
    named = sorted(consumers({path for path in changed if '/' in path}))
    if named:
        more = f' and {len(named) - 1} more' if len(named) > 1 else ''
        return False, f'read by source or tests: {named[0]}{more}'
    return True, f'{len(changed)} changed file(s), all documentation not read by source or tests'


def changed_files(base, head):
    done = subprocess.run(
        ['git', 'diff', '--name-only', '--no-renames', '-z', base, head],
        cwd=ROOT, capture_output=True, check=True)
    return [name for name in done.stdout.decode('utf-8', errors='replace').split('\0') if name]


def merge_parents(rev='HEAD'):
    done = subprocess.run(['git', 'rev-list', '--parents', '-n', '1', rev], cwd=ROOT, capture_output=True, text=True, check=True)
    return done.stdout.split()[1:]


def report(docs_only, reason):
    value = 'true' if docs_only else 'false'
    line = f'docs_only={value} ({reason})'
    print(line)
    for variable, text in (('GITHUB_OUTPUT', f'docs_only={value}\n'), ('GITHUB_STEP_SUMMARY', f'Change scope: {line}\n')):
        target = os.environ.get(variable)
        if target:
            with open(target, 'a', encoding='utf-8', newline='\n') as handle:
                handle.write(text)


def argument(flag, argv):
    return argv[argv.index(flag) + 1] if flag in argv and argv.index(flag) + 1 < len(argv) else None


def run(argv):
    if os.environ.get('GITHUB_EVENT_NAME', 'pull_request') != 'pull_request':
        return report(False, 'only pull requests are scoped; this event runs the full suites')
    base, head = argument('--base', argv), argument('--head', argv)
    try:
        if not (base and head):
            if len(merge_parents()) != 2:
                return report(False, 'HEAD is not a merge of the base and the pull request; running the full suites')
            base, head = 'HEAD^1', 'HEAD'
        docs_only, reason = classify(changed_files(base, head))
    except (subprocess.CalledProcessError, RuntimeError, OSError) as error:
        return report(False, f'could not decide ({str(error).strip()[:160]}); running the full suites')
    return report(docs_only, reason)


def self_test():
    never = lambda paths: set()
    cases = [
        (['docs/status/2026-10-18-x.md'], True),
        (['docs/decisions/x.md', 'docs/status/y.md', 'docs/STATUS.md', 'docs/decisions/README.md'], True),
        (['docs/standards/document-register.csv', 'docs/delivery/plan.md'], True),
        (['docs/blueprints/BP-01-master-blueprint.md', 'README.md', 'AGENTS.md', 'CONTRIBUTING.md'], True),
        (['db/reservations/0110.md'], True),
        (['docs/README.md'], True),
        (['src/app/page.tsx'], False),
        (['docs/decisions/x.md', 'src/app/page.tsx'], False),
        (['tests/unit/a.test.ts'], False),
        (['db/migrations/0110-x.sql'], False),
        (['db/seed.sql'], False),
        (['scripts/ci_scope.py'], False),
        (['.github/workflows/application.yml'], False),
        (['package.json'], False),
        (['package-lock.json'], False),
        (['docs/design/development/README.md'], False),
        (['docs/design/access-review/model.js'], False),
        (['docs/reference/ui/foo/page.html'], False),
        (['docs/reference/README.md'], False),
        (['docs/testing/evidence/products-native/a.md'], False),
        (['docs/testing/estimating-calculation-fixtures.json'], False),
        (['docs/standards/ui-baselines.json'], False),
        (['docs/standards/ui-assets/logo.png'], False),
        (['docs/blueprints/excel-estimate-import/fixture.json'], False),
        (['docs/blueprints/email-calendar-prototype/export.py'], False),
        (['docs/decisions/x.html'], False),
        (['docs/foo.png'], False),
        (['notes.md'], False),
        (['LICENSE.md'], False),
        ([], False),
    ]
    failures = [(paths, want) for paths, want in cases if classify(paths, never)[0] != want]
    named = classify(['docs/decisions/es08-design-board.md'], lambda paths: set(paths))
    failures += [(['consumer-read file'], False)] if named[0] else []
    root = classify(['AGENTS.md', 'LICENSE'], lambda paths: set(paths))  # root names are never looked up
    failures += [(['root files'], True)] if not root[0] else []
    for paths, want in failures:
        print(f'FAIL: {paths} should be docs_only={want}')
    print(f'{len(cases) + 2 - len(failures)} of {len(cases) + 2} classifier cases passed')
    return 1 if failures else 0


if __name__ == '__main__':
    if '--self-test' in sys.argv:
        sys.exit(self_test())
    run(sys.argv[1:])
