---
title: Design pull requests no longer share three generated or appended files
date: 2026-10-19
---

Amends open decision 4 of the merge-conflict record ([section 5](../decisions/merge-conflict-reduction.md#5-design-pull-requests-no-longer-share-generated-or-appended-files)). The UI build sequence is no longer committed (`python3 scripts/build-ui-sequence.py` writes it to `tmp/`; `docs/design/development/ui-build-sequence.md` is a pointer page and the `.json` is removed). New document-register rows go in `docs/standards/document-register-entries/`, and new design index entries in `docs/reference/ui/design-entries/`, one file per change; `check_naming.py` reads them as one register and `check_foundation.py` refuses new rows or notes in the old shared files and still derives the sequence.

Evidence: merging #604, #606, #610, #615, #616 and #617 pairwise with each converted to the new layout leaves conflicts on none of the three groups; only `STATUS.md` (open decision 2), #616's own edit to `build-ui-sequence.py` and an unrelated #604/#606 shell-components overlap remain. Not done: the converted branches were not built, and each open pull request still needs a one-time conversion when it next merges `main`. Branch protection and the access-review generated design are unchanged.

<!-- decision-index -->
[Reducing merge conflicts between parallel pull requests](../decisions/merge-conflict-reduction.md) (PPO-MERGE-CONFLICT-DEC) section 5, 19 October 2026: the UI build sequence stops being committed, and document-register rows and design index entries become one file per change.
