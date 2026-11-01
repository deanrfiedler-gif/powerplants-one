import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_design_tokens as tokens


class DesignTokenCheckTest(unittest.TestCase):
    def tree(self, css, variables, baseline=()):
        root = Path(tempfile.mkdtemp())
        (root / 'src').mkdir()
        (root / 'src/a.css').write_text(css, encoding='utf-8')
        (root / 'docs/design').mkdir(parents=True)
        (root / tokens.SNAPSHOT).write_text(json.dumps({'unmapped_baseline': list(baseline), 'variables': variables}), encoding='utf-8')
        return root

    def variable(self, value='#242a37', code='var(--ink)', status='mapped', name='text/ink'):
        return {'name': name, 'value': value, 'code': code, 'status': status}

    def test_repository_snapshot_passes(self):
        self.assertEqual(tokens.check(), [])

    def test_matching_value_alias_and_short_hex_pass(self):
        root = self.tree(':root{--navy:#242a37;--ink:var(--navy);--w:#FFF;--r:6px}', [
            self.variable(),
            self.variable('#ffffff', 'var(--w)', name='surface/white'),
            self.variable(6, 'var(--r)', name='radius/control'),
        ])
        self.assertEqual(tokens.check(root), [])

    def test_changed_value_fails(self):
        root = self.tree(':root{--ink:#000000}', [self.variable()])
        self.assertIn("no value matching", tokens.check(root)[0])

    def test_missing_property_fails(self):
        root = self.tree(':root{--other:#242a37}', [self.variable()])
        self.assertIn('not defined', tokens.check(root)[0])

    def test_new_unmapped_variable_fails(self):
        root = self.tree('', [self.variable(code='', status='unmapped')])
        self.assertIn('new variables need a CSS name', tokens.check(root)[0])

    def test_baseline_and_design_only_pass(self):
        root = self.tree('', [
            self.variable(code='', status='unmapped'),
            self.variable(code='', status='design-only', name='drawing/roof'),
        ], baseline=['text/ink'])
        self.assertEqual(tokens.check(root), [])

    def test_figma_link_fails(self):
        root = self.tree(':root{--ink:#242a37}', [dict(self.variable(), note='https://www.figma.com/design/x')])
        self.assertIn('Figma links', tokens.check(root)[0])

    def test_comments_do_not_count(self):
        root = self.tree('/* --ink:#242a37; */ a{color:#123456}', [self.variable()])
        self.assertIn('not defined', tokens.check(root)[0])
        self.assertEqual(tokens.read_css(root)[1], {'src/a.css': 1})


if __name__ == '__main__':
    unittest.main()
