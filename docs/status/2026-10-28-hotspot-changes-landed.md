---
title: Page-build hotspot changes landed
date: 2026-10-28
---

The hotspot changes under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md) are on `main`. Dates and times are UTC.
- **#720 (component bindings)** merged at 20:23 on 27 October as `4d4e4d9c`. Its independent review had posted a defect about ten seconds earlier: a binding could not name a component defined in a binding file whose name sorts after its own. The review had not been read before the merge. #729 corrects the loader.
- **#719 (the amendment)** merged as `892c1da5` after the second-model re-check of its corrections found no defects.
- **#721 (consumer notes), #722 (workspace style attribute), #723 (module integration files) and #724 (sorted route table)** merged one by one at about 23:38 on 27 October: `2e948b4c`, `d94cb4e7`, `3cde51f2` and `9a39e750`. Before that, the independent review of the four combined in #728 found no further defects.

This change adds the line #723 deferred because #720 and #721 edit the same line. The entry-folder line in `CONTRIBUTING.md` now names `docs/standards/ui-baselines/module-integrations/<id>.json`.

Three browser cases failed while these changes were landing. None touches code the changes alter.
- **CR05** (`tests/browser/sales-workflows.spec.ts:297`, desktop) failed once on #720. The `Customer review` tab was not visible 5 s after the held review response arrived. It passed on re-run. [`ci-retained-suite-isolation.md`](../decisions/ci-retained-suite-isolation.md) records the same assertion failing on 22 September.
- **The P11 selected journey** (`tests/browser/quality-journey.spec.ts:5`, desktop, compiled shard 2) failed three times: on #722, on `main` at `4d4e4d9c` and on #729 at `3765e195`. Each time, `Correct this observation entry` did not appear within 15 s after History opened. Both PR re-runs passed. Its cause is being investigated as a separate change.
- **P05 project requests** (`tests/browser/planner.spec.ts:504`, mobile) failed once on #719's first head and once on #729 at `3765e195`. The phone "More" dialog did not open within 5 s while the test switched identity.

None of the three has a fix yet.

Branches that still append to the frozen lists move over as the amendment's "Moving branches over" section describes. `studio:check` and the unit tests name the folder or attribute to use instead.
