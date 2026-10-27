---
title: Component catalogue reads one binding file per page change
date: 2026-10-27
---

This is the first hotspot change under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md). A page change now records its component records and consumer bindings in its own file in [`docs/design/development/component-bindings/`](../design/development/component-bindings/README.md). It no longer appends to `components.json`, which every pair of the four page builds merged by #717 conflicted on.

`readComponentManifest` (now in `src/development/catalog.ts`) applies the binding files in name order. It adds new records after the existing ones and appends bound states, dependencies, consumer keys and alignment items to the end of each list. Every reader goes through it: the catalogue, the component library and preview, `studio:check`, the hosted snapshot and the component tests. `scripts/design-system/merge-component-guides.py` applies the same rule in Python. A page that depends on `components.json` also hashes the binding files. `studio:check` fails if `components.json` grows beyond its frozen size (52 components, 427 states, 647 dependencies, 1,082 consumer keys, 299 alignment items).

Verified:
- On unmodified `main` and on this branch, the full catalogue, component library and merged manifest are identical apart from fingerprints. Every changed fingerprint belongs to an entry that hashes one of the three edited source files, and no review state changed.
- Each of the four builds' `components.json` changes was a pure append. As binding files, applied to the pre-#717 file in #717's merge order, they reproduce today's `components.json` exactly, by both the TypeScript loader and the Python reader.
- Converted that way, the four builds no longer conflict on `components.json` in any of the six pairs; before, all six did.
- New unit tests cover merge order, refusals and the freeze.

Not changed: the component specifications (`components/*.md`), which are the next hotspot, and existing records, which stay in `components.json`.
