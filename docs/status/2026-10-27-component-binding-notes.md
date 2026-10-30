---
title: Page consumer notes move beside their binding files
date: 2026-10-27
---

This is the second hotspot change under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md). It builds on the component binding files. A page's prose about how it uses a component now goes in a Markdown note with the same name as its binding file in [`docs/design/development/component-bindings/`](../design/development/component-bindings/README.md). It no longer goes at the end of each component's specification in `docs/design/development/components/`. Every pair of the four page builds merged by #717 had conflicted on those specifications: 25 conflicted files across six pairs, and 24 conflicted merges since 19 October.

Each component's fingerprint also hashes every note whose binding file names it, so a changed note marks a recorded review stale, as an appended section did. A note without its binding file is refused. `studio:check` fails if a specification grows beyond its size in paragraph blocks, recorded in `components/specification-sizes.json` (52 specifications, 1,860 blocks). A change to a component's own rules can still add a paragraph and raise that file's number deliberately; corrections in place keep the count.

Verified:
- On this branch and on the binding-file branch, the catalogue, component library and manifest are identical apart from fingerprints. Every changed fingerprint belongs to an entry that hashes one of the three edited source files, and no review state changed.
- Each of the four builds' specification changes was a pure append. Converted into notes (and binding files), the four no longer conflict on any component file in any of the six pairs; three pairs now merge cleanly. All 32 links in the converted notes resolve from the new folder.
- New unit tests cover the block count, the freeze and note hashing.

Not changed: existing specification sections, which stay where they are, because other documents link to some of them. The catalogue still links each specification on GitHub and does not render notes.
