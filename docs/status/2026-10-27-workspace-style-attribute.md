---
title: New pages join shared workspace styles with an attribute
date: 2026-10-27
---

This is the third hotspot change under the 27 October amendment to the [merge-conflict record](../decisions/merge-conflict-reduction.md). A page that uses the shared workspace rules in `src/app/styles/my-work.css` and `figma-shell.css` now sets `data-ppo-workspace="shared"` on its root (through `SecondaryMenuFrame`'s existing `attributes`). It no longer adds its id to the 165 `:is(#ppo-…)` lists (145 and 20) that every such page joined. Those lists are frozen. #696 and #700 conflicted there because both added their ids to the same single-line selectors, and the two files conflicted in 8 and 7 merges since 19 October.

The change adds `,[data-ppo-workspace=shared]` once inside each of the 165 lists, the lists that hold `#ppo-people`. `:is()` takes its most specific argument's weight, so a page matched by the attribute gets the same (1,0,0) weight as one matched by its id. No element carries the attribute yet. `tests/unit/workspace-styles.test.ts` fails if an id is added to a shared list, or if a list that names the shared pages lacks the attribute. The [application-shell specification](../design/development/components/application-shell.md) records the rule in its secondary-menu section.

Verified:
- With the attribute arms removed, both files are byte-identical to `main`.
- In headless Chromium, with the real stylesheets, each of the 25 page-root ids they name (with and without `data-catalogue`) computes the same styles under `main` and this change: 55,600 nodes, no difference.
- A new root with only the attribute computes exactly the same styles as `#ppo-people` (915 nodes, no difference). A root with neither differs in 49,067 values; under `main`'s CSS the attribute alone changes nothing.
- Replaying #696 × #700 converted (their CSS edits replaced by the attribute on their own page roots) gives no CSS conflict.
- Visual equivalence in the application is left to the browser suites in CI.

Not changed: pages in the older irregular subsets, which keep their ids, and each page's own stylesheet.
