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
            self.variable(code='', status='unmapped', name='chart/1'),
            self.variable(code='', status='design-only', name='drawing/roof'),
        ], baseline=['chart/1'])
        self.assertEqual(tokens.check(root), [])

    def test_baseline_cannot_gain_a_name(self):
        # Adding a new name to both the variables and the snapshot's baseline must still fail.
        root = self.tree('', [self.variable(code='', status='unmapped', name='text/new')], baseline=['text/new'])
        self.assertIn('can only shrink', tokens.check(root)[0])

    def test_baseline_can_shrink(self):
        root = self.tree('', [self.variable(code='', status='unmapped', name='chart/1')], baseline=['chart/1'])
        self.assertEqual(tokens.check(root), [])

    def test_two_hop_alias_passes(self):
        root = self.tree(':root{--base:#242a37;--semantic:var(--base);--ink:var(--semantic)}', [self.variable()])
        self.assertEqual(tokens.check(root), [])

    def test_alias_cycle_does_not_loop(self):
        root = self.tree(':root{--a:var(--ink);--ink:var(--a)}', [self.variable()])
        self.assertIn('no value matching', tokens.check(root)[0])

    def test_quoted_text_is_not_a_declaration(self):
        root = self.tree('a::before{content:"--ink:#242a37;"}', [self.variable()])
        self.assertIn('not defined', tokens.check(root)[0])

    def test_quoted_value_stays_intact(self):
        root = self.tree(':root{--font:"Roboto; Light", sans-serif}', [])
        self.assertEqual(dict(tokens.read_css(root)[0]), {'--font': {'"roboto; light", sans-serif'}})

    def test_trailing_comment_is_not_part_of_the_value(self):
        root = self.tree(':root{--ink:#242a37/* accepted token */;}', [self.variable()])
        self.assertEqual(tokens.check(root), [])

    def test_comment_marker_inside_a_quoted_value_is_kept(self):
        root = self.tree(':root{--label:"a /* b */ c"}', [])
        self.assertEqual(dict(tokens.read_css(root)[0]), {'--label': {'"a /* b */ c"'}})

    def test_important_priority_is_not_part_of_the_value(self):
        root = self.tree(':root{--ink:#242a37 !important}', [self.variable()])
        self.assertEqual(tokens.check(root), [])

    def test_figma_link_fails(self):
        root = self.tree(':root{--ink:#242a37}', [dict(self.variable(), note='https://www.figma.com/design/x')])
        self.assertIn('Figma links', tokens.check(root)[0])

    def test_mapped_property_with_other_values_is_reported_not_failed(self):
        root = self.tree(':root{--ink:#242a37}.old{--ink:#000000;--other:#1;--other:#2}', [self.variable()])
        self.assertEqual(tokens.check(root), [])
        self.assertEqual(tokens.mapped_multi_valued(root), ['--ink'])

    def test_class_names_are_not_properties(self):
        root = self.tree('.button--danger:hover { color: red; } :root{--danger:#993b2a}', [])
        self.assertEqual(dict(tokens.read_css(root)[0]), {'--danger': {'#993b2a'}})

    def test_comments_do_not_count(self):
        root = self.tree('/* --ink:#242a37; */ a{color:#123456}', [self.variable()])
        self.assertIn('not defined', tokens.check(root)[0])
        self.assertEqual(tokens.read_css(root)[1], {'src/a.css': 1})


if __name__ == '__main__':
    unittest.main()
