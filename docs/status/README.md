# Status fragments

`docs/STATUS.md` and the narrative index in `docs/decisions/README.md` are generated from the files in this folder, newest first, between `<!-- fragments:start -->` and `<!-- fragments:end -->`. Entries below the end marker are the frozen record from before 18 October 2026. Do not edit between the markers; add a fragment. Reasons and limits: [merge-conflict-reduction.md](../decisions/merge-conflict-reduction.md).

## Add a fragment

```sh
python3 scripts/build_status.py --new "Short title" [--decision]
# edit the file it prints, then:
python3 scripts/build_status.py
```

A fragment is `YYYY-MM-DD-slug.md` (the date in the name matches the front matter):

```
---
title: Short title
date: 2026-10-18
---

What is now true, what was checked, what is not done or not verified.

<!-- decision-index -->
[Record title](../decisions/merge-conflict-reduction.md) (ID) one or two sentences for the decisions index.
```

- The title is rendered as `## Title — 18 October 2026`; do not put `#` or `##` headings in the body.
- Write links relative to the fragment (`../decisions/x.md`); the script rewrites them for the file they land in.
- The `<!-- decision-index -->` section is optional and appears in `docs/decisions/README.md`. A decision still lives in exactly one record under `docs/decisions/`.
- Keep one fragment per change. A later correction is a new fragment, not an edit to an old one, unless the old text is wrong.

## After a conflict in the rendered files

Fragments never conflict. If `docs/STATUS.md` or `docs/decisions/README.md` conflicts after you merge `origin/main`, do not merge the text by hand:

```sh
git checkout origin/main -- docs/STATUS.md docs/decisions/README.md
python3 scripts/build_status.py
```

## Checks

`python3 scripts/build_status.py --check` (also run by `scripts/check_foundation.py`) fails when the rendered section is out of step, when the legacy part gains or loses an entry, or when a fragment is malformed. `legacy-index.txt` lists the legacy entries; after a reviewed correction that changes one, run `python3 scripts/build_status.py --accept-legacy`.

Throwaway docs-only probe for PR 584; closes unmerged.
