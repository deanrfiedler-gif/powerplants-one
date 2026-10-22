"""Regression proofs for independent documentation contributions and PR boundaries."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import build_status as status
import check_documentation_scope as scope


class DocumentationFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        fragments = self.root / 'docs/status'
        fragments.mkdir(parents=True)
        (self.root / 'docs/decisions').mkdir()
        self.targets = {'STATUS': self.root / 'docs/STATUS.md', 'DECISIONS': self.root / 'docs/decisions/README.md'}
        self.patch = patch.multiple(status, ROOT=self.root, FRAGMENTS=fragments,
                                    LEGACY_INDEX=fragments / 'legacy-index.txt', TARGETS=self.targets,
                                    OUTPUT=self.root / 'tmp/documentation')
        self.patch.start()
        self.addCleanup(self.patch.stop)
        status.PROBLEMS.clear()
        self.write('docs/decisions/rule.md', '# Rule\n')
        for label, path in self.targets.items():
            legacy = '\n\n## Historic entry\n\nPreserved detail.\n' if label == 'STATUS' else '\n\nHistoric decision.\n'
            path.write_text('# Index\n\n' + status.START + status.PLACEHOLDER + status.END + legacy, encoding='utf-8', newline='\n')
        self.write('docs/status/legacy-index.txt', 'STATUS\t## Historic entry\nDECISIONS\tHistoric decision.\n')

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8', newline='\n')

    def fragment(self, slug='alpha', date='2026-10-22', title=None, body=None):
        name = f'docs/status/{date}-{slug}.md'
        self.write(name, f'---\ntitle: {title or slug}\ndate: {date}\n---\n\n' +
                   (body or f'{slug} implemented; review pending. [Rule](../decisions/rule.md).\n\n{status.DECISION_MARK}\n[Rule](../decisions/rule.md) — {slug}.\n'))
        return name

    def run_main(self, *args):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            return status.main(list(args))

    def sources(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in (self.root / 'docs').rglob('*') if p.is_file()}


class FragmentTests(DocumentationFixture):
    def test_two_fragments_render_newest_first_without_source_changes(self):
        self.fragment('alpha', '2026-10-21')
        self.fragment('beta')
        before = self.sources()
        self.assertEqual(self.run_main(), 0)
        content = (status.OUTPUT / 'STATUS.md').read_text(encoding='utf-8')
        self.assertLess(content.index('## beta'), content.index('## alpha'))
        self.assertLess(content.index('## alpha'), content.index('## Historic entry'))
        self.assertIn('(../../docs/decisions/rule.md)', content)
        self.assertEqual(before, self.sources())
        outputs = {p.name: p.read_bytes() for p in status.OUTPUT.iterdir()}
        self.assertEqual(self.run_main(), 0)
        self.assertEqual(outputs, {p.name: p.read_bytes() for p in status.OUTPUT.iterdir()})

    def test_check_accepts_new_fragment_without_rendered_output(self):
        self.fragment()
        self.assertEqual(self.run_main('--check'), 0)
        self.assertFalse(status.OUTPUT.exists())

    def test_web_artifact_is_bound_to_source_and_uses_permalinks(self):
        self.fragment()
        ref = 'a' * 40
        _, _, outputs = status.build(web_ref=ref)
        self.assertEqual(status.PROBLEMS, [])
        for content in outputs.values():
            self.assertIn(f'/commit/{ref}', content)
            self.assertIn(f'/blob/{ref}/docs/decisions/rule.md', content)
            self.assertNotIn('](../', content)

    def test_generated_prose_in_tracked_page_is_refused(self):
        path = self.targets['STATUS']
        path.write_text(path.read_text(encoding='utf-8').replace(status.PLACEHOLDER, '\nUnreviewed generated text\n'), encoding='utf-8')
        self.assertEqual(self.run_main('--check'), 1)
        self.assertTrue(any('fixed insertion marker' in p for p in status.PROBLEMS))

    def test_legacy_identity_change_fails_but_explicit_accept_is_bounded(self):
        path = self.targets['STATUS']
        path.write_text(path.read_text(encoding='utf-8').replace('## Historic entry', '## Corrected historic entry'), encoding='utf-8')
        before = path.read_bytes()
        self.assertEqual(self.run_main('--check'), 1)
        self.assertEqual(self.run_main('--accept-legacy'), 0)
        self.assertEqual(self.run_main('--check'), 0)
        self.assertEqual(before, path.read_bytes())
        self.assertFalse(status.OUTPUT.exists())

    def test_bad_marker_does_not_partially_accept_legacy_or_render(self):
        self.targets['DECISIONS'].write_text('# Missing marker\n', encoding='utf-8')
        before = status.LEGACY_INDEX.read_bytes()
        self.assertEqual(self.run_main('--accept-legacy'), 1)
        self.assertEqual(self.run_main(), 1)
        self.assertEqual(before, status.LEGACY_INDEX.read_bytes())
        self.assertFalse(status.OUTPUT.exists())

    def test_malformed_fragments_fail_without_writes(self):
        cases = [
            ('bad-name.md', '---\ntitle: A\ndate: 2026-10-22\n---\nA'),
            ('2026-10-22-a.md', 'Missing front matter'),
            ('2026-10-22-a.md', '---\ntitle: A\ndate: 2026-13-22\n---\nA'),
            ('2026-10-22-a.md', '---\ntitle: A\ndate: 2026-10-21\n---\nA'),
            ('2026-10-22-a.md', '---\ntitle: \ndate: 2026-10-22\n---\nA'),
            ('2026-10-22-a.md', '---\ntitle: A\ndate: 2026-10-22\n---\n\n'),
            ('2026-10-22-a.md', '---\ntitle: A\ndate: 2026-10-22\n---\n## Wrong heading'),
        ]
        for name, content in cases:
            with self.subTest(name=name, content=content):
                path = status.FRAGMENTS / name
                path.write_text(content, encoding='utf-8')
                self.assertEqual(self.run_main(), 1)
                self.assertFalse(status.OUTPUT.exists())
                path.unlink()

    def test_missing_and_escaping_links_fail(self):
        for link in ('../decisions/missing.md', '../../../outside.md'):
            with self.subTest(link=link):
                self.fragment(body=f'[Bad]({link})')
                self.assertEqual(self.run_main('--check'), 1)

    def test_local_links_preserve_encoding_query_and_fragment(self):
        self.write('docs/decisions/a space.md', '# Detail\n')
        self.fragment(body='[Detail](../decisions/a%20space.md?plain=1#detail)')
        self.assertEqual(self.run_main(), 0)
        content = (status.OUTPUT / 'STATUS.md').read_text(encoding='utf-8')
        self.assertIn('(../../docs/decisions/a%20space.md?plain=1#detail)', content)

    def test_fragment_creation_never_overwrites_an_existing_claim(self):
        with contextlib.redirect_stdout(io.StringIO()):
            status.new_fragment('Specific task', False)
            before = self.sources()
            with self.assertRaises(SystemExit):
                status.new_fragment('Specific task', False)
        self.assertEqual(before, self.sources())

    def test_invalid_web_ref_is_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            status.main(['--web-ref', 'main'])


class ScopeTests(unittest.TestCase):
    declaration_path = 'docs/maintenance/2026-10-22-setup.json'

    def declaration(self, **updates):
        value = {'kind': 'documentation-maintenance', 'reason': 'Correct repository onboarding after the reviewed setup change.',
                 'decision': 'docs/decisions/setup.md', 'paths': ['README.md']}
        value.update(updates)
        return json.dumps(value)

    def validate(self, changes, declaration=None):
        files = {self.declaration_path: declaration or self.declaration(), 'docs/decisions/setup.md': '# Setup decision\n'}
        return scope.validate(changes, files.__getitem__)

    def test_feature_sources_and_required_shared_contracts_are_allowed(self):
        self.assertEqual(self.validate({'src/feature.ts': 'M', 'docs/status/2026-10-22-feature.md': 'A',
                                       'docs/contracts/service-api.md': 'M', 'docs/design/development/register.json': 'M'}), [])

    def test_every_protected_file_requires_its_own_declaration(self):
        for path in scope.PROTECTED:
            with self.subTest(path=path):
                self.assertTrue(self.validate({path: 'M'}))
                self.assertTrue(self.validate({path: 'D'}))

    def test_new_exact_maintenance_declaration_is_allowed(self):
        self.assertEqual(self.validate({'README.md': 'M', self.declaration_path: 'A'}), [])

    def test_existing_declaration_cannot_exempt_a_later_pr(self):
        self.assertTrue(self.validate({'README.md': 'M'}))
        self.assertTrue(self.validate({'README.md': 'M', self.declaration_path: 'M'}))

    def test_invalid_and_broad_declarations_fail(self):
        for updates in ({'paths': ['*']}, {'paths': ['README.md', 'README.md']}, {'paths': ['docs/STATUS.md']},
                        {'paths': []}, {'kind': 'feature'}, {'reason': ''}, {'decision': '../outside.md'},
                        {'decision': 'docs/decisions/missing.md'}, {'extra': True}, {'paths': 'README.md'}):
            with self.subTest(updates=updates):
                self.assertTrue(self.validate({'README.md': 'M', self.declaration_path: 'A'}, self.declaration(**updates)))
        self.assertTrue(self.validate({self.declaration_path: 'A'}, '{bad json'))

    def test_generated_output_cannot_be_exempted(self):
        for path in [*scope.GENERATED, 'tmp/documentation/STATUS.md']:
            with self.subTest(path=path):
                self.assertTrue(self.validate({path: 'A', self.declaration_path: 'A'}, self.declaration(paths=[path])))
                self.assertEqual(self.validate({path: 'D'}), [])


class GitIntegrationTests(DocumentationFixture):
    def git(self, *args):
        result = subprocess.run(['git', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', *args],
                                cwd=self.root, capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout.strip()

    def initialise(self):
        self.write('.gitignore', '/tmp/\n')
        self.write('README.md', '# Repository\n')
        self.git('init', '-b', 'main')
        self.git('config', 'user.name', 'Documentation fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.commit('Initial sources')
        return self.git('rev-parse', 'HEAD')

    def commit(self, message):
        self.git('add', '.')
        self.git('commit', '-m', message)

    def test_independent_feature_branches_merge_without_generated_conflicts(self):
        base = self.initialise()
        self.git('switch', '-c', 'feature-alpha')
        self.fragment('alpha')
        self.assertEqual(self.run_main(), 0)
        self.commit('Alpha sources only')
        alpha = self.git('rev-parse', 'HEAD')
        self.git('switch', '-c', 'feature-beta', base)
        self.fragment('beta')
        self.assertEqual(self.run_main(), 0)
        self.commit('Beta sources only')
        beta = self.git('rev-parse', 'HEAD')
        self.assertEqual(scope.check(base, alpha, self.root), [])
        self.assertEqual(scope.check(base, beta, self.root), [])
        self.git('merge', '--no-edit', 'feature-alpha')
        self.assertEqual(self.run_main('--check'), 0)
        self.assertEqual(self.run_main(), 0)
        content = (status.OUTPUT / 'STATUS.md').read_text(encoding='utf-8')
        self.assertIn('## alpha', content)
        self.assertIn('## beta', content)
        self.assertEqual(self.git('status', '--porcelain'), '')

    def test_newer_main_changes_are_not_attributed_to_feature(self):
        base = self.initialise()
        self.git('switch', '-c', 'feature')
        self.fragment()
        self.commit('Feature fragment')
        feature = self.git('rev-parse', 'HEAD')
        self.git('switch', 'main')
        self.write('README.md', '# Updated onboarding\n')
        self.commit('Unrelated main maintenance')
        self.assertEqual(scope.check('main', feature, self.root), [])
        self.assertTrue(scope.check(base, 'main', self.root))

    def test_rename_of_protected_page_is_detected(self):
        base = self.initialise()
        self.git('mv', 'README.md', 'INTRODUCTION.md')
        self.commit('Rename protected page')
        self.assertTrue(any('README.md' in p for p in scope.check(base, 'HEAD', self.root)))

    def test_missing_base_fails_closed(self):
        self.initialise()
        with self.assertRaises(RuntimeError):
            scope.check('does-not-exist', 'HEAD', self.root)

    def test_web_publication_requires_exact_clean_head(self):
        self.fragment()
        ref = self.initialise()
        self.assertEqual(self.run_main('--web-ref', ref), 0)
        self.assertIn(f'/commit/{ref}', (status.OUTPUT / 'STATUS.md').read_text(encoding='utf-8'))
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            status.main(['--web-ref', 'b' * 40])
        self.write('docs/decisions/rule.md', '# Unsaved publication basis\n')
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            status.main(['--web-ref', ref])


if __name__ == '__main__':
    unittest.main()
