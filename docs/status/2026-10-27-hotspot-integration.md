---
title: Page-build hotspot changes land together
date: 2026-10-27
---

The five hotspot changes under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md) (recorded in #719) are on `main`. Dean asked for them to proceed. #720 (component bindings) merged on its own, because it was green and current. #721 (consumer notes), #722 (workspace style attribute), #723 (module integration files) and #724 (sorted route table) then merged through one integration branch. They touch separate files, so the integration needed one CI run instead of four in sequence. This is the same approach #717 used for the page builds.

The integration branch has one merge commit per pull request, and every merge was clean. Its one other change is the entry-folder line in `CONTRIBUTING.md`, which now names `docs/standards/ui-baselines/module-integrations/<id>.json`. #723 deferred this line because #720 and #721 edit the same line.

Two browser cases each failed once on a hotspot pull request and passed on their single re-run. Neither touches code those pull requests change.
- **CR05** (`tests/browser/sales-workflows.spec.ts:297`, desktop) failed on #720. The `Customer review` tab was not visible 5 s after the held review response arrived. [`ci-retained-suite-isolation.md`](../decisions/ci-retained-suite-isolation.md) records the same assertion failing on 22 September.
- **The P11 selected journey** (`tests/browser/quality-journey.spec.ts:5`, desktop, compiled shard 2) failed on #722. `Correct this observation entry` did not appear within 15 s after History opened.

Both remain intermittent, and no fix exists yet.

Still open:
- #719, the decision record, waits for its independent second-model review.
- Branches that still append to the frozen lists move over as the amendment's "Moving branches over" section describes. `studio:check` and the unit tests name the folder or attribute to use instead.
