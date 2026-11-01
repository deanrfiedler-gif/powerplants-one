"""The component guide merger reads binding files by the same rule as src/development/component-model.ts.

tests/unit/component-bindings.test.ts holds the same fixtures for the TypeScript loader.
"""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parent / 'design-system' / 'merge-component-guides.py'
spec = importlib.util.spec_from_file_location('merge_component_guides', SCRIPT)
guides = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guides)


def record(entry_id):
    return {'id': entry_id, 'states': [{'id': 'base', 'label': 'Base', 'description': 'Base state'}],
            'dependencies': ['src/base.ts'], 'used_on': ['route:/base'], 'gaps': []}


class ComponentBindings(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)

    def write(self, name, binding):
        (self.folder / name).write_text(json.dumps(binding), encoding='utf-8')

    def apply(self):
        return guides.apply_bindings([record('buttons'), record('menu')], self.folder)

    def test_a_binding_may_name_a_component_whose_definition_file_sorts_after_it(self):
        self.write('2026-10-27-a-consumer.json', {'schema_version': 1, 'bindings': {
            'future-widget': {'used_on': ['route:/new']}, 'buttons': {'used_on': ['route:/new']}}})
        self.write('2026-10-27-z-widget.json', {'schema_version': 1, 'entries': [record('future-widget')],
                                                'bindings': {'future-widget': {'used_on': ['route:/later']}}})
        entries = self.apply()
        self.assertEqual([e['id'] for e in entries], ['buttons', 'menu', 'future-widget'])
        self.assertEqual(entries[2]['used_on'], ['route:/base', 'route:/new', 'route:/later'])
        self.assertEqual(entries[0]['used_on'], ['route:/base', 'route:/new'])

    def test_a_component_is_defined_once(self):
        self.write('2026-10-27-a.json', {'schema_version': 1, 'entries': [record('buttons')]})
        with self.assertRaisesRegex(SystemExit, r'2026-10-27-a\.json: component already defined: buttons'):
            self.apply()
        (self.folder / '2026-10-27-a.json').unlink()
        self.write('2026-10-27-a.json', {'schema_version': 1, 'entries': [record('widget')]})
        self.write('2026-10-28-b.json', {'schema_version': 1, 'entries': [record('widget')]})
        with self.assertRaisesRegex(SystemExit, r'2026-10-28-b\.json: component already defined: widget'):
            self.apply()

    def test_a_binding_names_a_known_component_list_schema_and_file_name(self):
        cases = [
            ('2026-10-27-x.json', {'schema_version': 1, 'bindings': {'missing': {'used_on': []}}},
             r'unknown component: missing'),
            ('2026-10-27-x.json', {'schema_version': 1, 'bindings': {'buttons': {'title': []}}},
             r'buttons: only states, dependencies, used_on and gaps can be bound'),
            ('2026-10-27-x.json', {'schema_version': 1, 'bindings': {'buttons': {'used_on': 'route:/a'}}},
             r'buttons: used_on must be a list'),
            ('2026-10-27-x.json', {'schema_version': 2}, r'unsupported component binding schema'),
            ('2026-10-27-x.json', {'schema_version': 1, 'consumers': {}}, r'unknown key: consumers'),
            ('bindings.json', {'schema_version': 1}, r'must be YYYY-MM-DD-slug\.json'),
        ]
        for name, binding, message in cases:
            with self.subTest(message=message):
                for path in self.folder.iterdir():
                    path.unlink()
                self.write(name, binding)
                with self.assertRaisesRegex(SystemExit, message):
                    self.apply()


if __name__ == '__main__':
    unittest.main()
