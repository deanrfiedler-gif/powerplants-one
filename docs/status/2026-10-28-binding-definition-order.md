---
title: Component bindings register every definition before applying bindings
date: 2026-10-28
---

The independent review of #720 found a defect in the component-binding loader. #720 had already merged, about ten seconds after that review posted.

The loader applied binding files one at a time in file-name order, so a binding could only name components defined in its own file or an earlier one. A consumer file such as `2026-10-27-a-consumer.json` that binds to a component defined in `2026-10-27-z-widget.json` failed with "unknown component", even when both files were present.

The loader now runs in two passes. `applyComponentBindings` in `src/development/component-model.ts` first checks every file and registers its new records, then applies every file's bindings. Both passes run in file-name order, and the existing records in `components.json` stay first. A component id that is already defined, in `components.json` or an earlier file, is refused with an error naming the file. Before, a duplicate id was silently added and its bindings went to the first record with that id.

`scripts/design-system/merge-component-guides.py` applies the same rule. It also now makes the TypeScript loader's other refusals:
- a file name not matching `YYYY-MM-DD-slug.json`;
- a schema other than 1;
- an unknown top-level key;
- a bound value that is not a list;
- a component without the bound list.

The [README](../design/development/component-bindings/README.md) and the two code comments now call file-name order a canonical order, not the order branches merge in. The previous wording said the date prefix kept the files in landing order.

Verified:
- **Unchanged results:** for every set of files the old loader accepted, the result is the same. Records and bound items still come in file-name order, and a binding to an earlier definition appends in the same place.
- **TypeScript tests:** `tests/unit/component-bindings.test.ts` adds a consumer whose definition file sorts after it, and both duplicate-id cases.
- **Python tests:** `scripts/test_documentation_component_bindings.py` holds the same fixtures and the refusals for the Python reader. The documentation workflow's test discovery runs it.
- **No binding files yet:** none exist on `main`, so the catalogue output is unchanged.
