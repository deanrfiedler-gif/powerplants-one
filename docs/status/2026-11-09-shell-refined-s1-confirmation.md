---
title: Refined shell S1 remaining confirmation findings
date: 2026-11-09
---

Codex continues [PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874) from verified head `4dd99145` for [Claude's remaining findings](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#pullrequestreview-5820309653): 2/9 (768–780 end-zone containment), 5 (one current page in the breadcrumb band), 4 (a stable deferred notification deadline), and classification of the Library timeout. **Dean's decision, given in chat in Codex's session; no [DEAN] comment**: one new head without rebase/force-push, unchanged geometry assertion and timeouts, full suites, then confirmation of these items only.

The [build record](../decisions/shell-refined-s1-build.md#confirmation-continuation--9-november-2026) traces the context-revalidation timer reset and the Library test's automatic-read/403 race. It also records Dean's separate [[DEAN] acceptance](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6728218179) of the temporary opt-in breadcrumb band and its page-header replacement conditions. The staged-build instruction remains [comment 6727496497](https://github.com/deanrfiedler-gif/powerplants-one/pull/873#issuecomment-6727496497), and the named-version source instruction remains [comment 6727550965](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727550965).

New checks cover the current-page count before/after hierarchy opening and same-identity revalidation midway through the ten-second inbox deferral. The Library test waits for the successful automatic refresh before staging its denied manual refresh. No diagnostic rerun or timeout change was used. Chrome remains unavailable locally under cloud setup; final-head browser and full-suite results are reported on the PR, separately from owner acceptance.

On pushed head `2ceeee2ef`, compiled desktop-2 passed the breadcrumb, both notification cases and the Library case (400 passed, one failed). Geometry cleared 768/780 but then exposed the populated search mount's more-specific base selector at 834: 286/262/286 instead of 272/262/300. The prepared follow-up applies the tablet columns to both selector forms and adds that populated-mount fixture; the geometry assertions and timeouts remain unchanged.
