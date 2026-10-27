# Component bindings

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Schema:** 1 · **Decision:** [PPO-MERGE-CONFLICT-DEC](../../../decisions/merge-conflict-reduction.md), 27 October 2026 amendment

A page change records the components it uses in one new file here. It does not append to `../components.json`, so two page builds no longer conflict there. `components.json` is frozen at the size it had when this folder was introduced: 52 components, 427 states, 647 dependencies, 1,082 consumer keys and 299 alignment items. `npm run studio:check` fails if it grows. Existing records and items stay where they are and may be corrected in place.

## File

Name each file `YYYY-MM-DD-slug.json`, with the date of the change and a slug for the page or scope, for example `2026-10-28-pj02-project-record.json`. One file per change.

```json
{
  "schema_version": 1,
  "entries": [],
  "bindings": {
    "buttons": {
      "states": [{ "id": "pj02-record", "label": "PJ-02 record host", "description": "…" }],
      "dependencies": ["src/projects/record-screen.tsx"],
      "used_on": ["route:/projects/[id]"],
      "gaps": [{ "id": "buttons-pj02-review", "expected": "…", "actual": "…", "action": "…", "priority": "Medium", "owner": "Dean Fiedler" }]
    }
  }
}
```

- `bindings` names an existing component by `id` and lists the items to add to any of its four consumer lists: `states`, `dependencies`, `used_on` and `gaps`. Nothing else can be bound. A scalar field such as `desktop` or `limitations` is still edited in the component's own record.
- `entries` holds complete new component records, in the same form as `components.json`. Any binding file can bind to them, whether its name sorts before or after the defining file. A component `id` is defined once: in `components.json` or in one binding file.
- Either key may be left out.

## How it is read

`readComponentManifest` in `src/development/catalog.ts` reads `components.json` and then the files here, in a canonical order:

1. `components.json`'s records stay first, unchanged.
2. Every file's new records are registered, in file-name order. Each `id` is checked against all the records before it.
3. Every file's bound items are appended to the end of each list, in file-name order.

Because every record is registered before any binding is applied, a binding may name a component defined in any file. File-name order is not the order in which branches merge, so a binding's items can sit before those of a branch that merged earlier. The order is still fixed for any given set of files, which is what the fingerprints and displayed lists need.

Every reader sees that merged catalogue: the design system and component preview pages, `studio:check`, the hosted snapshot and the component tests. `scripts/design-system/merge-component-guides.py` applies the same rule in Python. `tests/unit/component-bindings.test.ts` and `scripts/test_documentation_component_bindings.py` share their fixtures, so a change to one reader needs the same change in the other. A component's fingerprint hashes its merged record, and a page that depends on `components.json` also hashes these files.

A file that names an unknown component or list, or is not named `YYYY-MM-DD-slug.json`, stops the catalogue with an error naming the file. Other files in this folder, such as this README, are ignored.

## Converting a branch that still appends

Take `main`'s `components.json`, then move the branch's own added items and records into one file here. Its diff of `components.json` lists everything to move.
