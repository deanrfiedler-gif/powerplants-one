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
- `entries` holds complete new component records, in the same form as `components.json`. A later binding file can bind to them.
- Either key may be left out.

## How it is read

`readComponentManifest` in `src/development/catalog.ts` reads `components.json`, then applies every file here in name order: new records are added after the existing ones, and bound items are appended to the end of each list. Every reader sees that merged catalogue: the design system and component preview pages, `studio:check`, the hosted snapshot, the component tests and `scripts/design-system/merge-component-guides.py`. The result is the object that appending to `components.json` in the same order would have produced. A component's fingerprint hashes its merged record, and a page that depends on `components.json` also hashes these files.

A file that names an unknown component or list, or is not named `YYYY-MM-DD-slug.json`, stops the catalogue with an error naming the file. This README is ignored.

## Consumer note

A page's prose about how it uses a component goes in a Markdown note with the same name as its binding file, for example `2026-10-28-pj02-project-record.md`. It does not go at the end of the component's specification in `../components/`. Give the note one `##` section per component the binding names, and link evidence, page guides and decisions as the specification sections did; `check_foundation.py` checks those links.

Each component's fingerprint also hashes every note whose binding file names that component, so a changed note marks a recorded review stale. A note without its `.json` binding file stops the catalogue with an error.

The specifications are frozen at their size in paragraph blocks (runs of non-blank lines), recorded in [`../components/specification-sizes.json`](../components/specification-sizes.json). `npm run studio:check` fails if one grows. Corrections in place keep the count. A change to a component's own rules (desktop, mobile, keyboard, states, limits) that needs a new paragraph is a real shared change: make it in the specification and raise that file's number in the same pull request. A new component's specification is a new file and is not in the list.

## Converting a branch that still appends

Take `main`'s `components.json` and specifications, then move the branch's own added items and records into one `.json` file here, and its appended specification text into the `.md` note beside it. Its diff of those files lists everything to move.
