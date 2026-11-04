---
title: Findings browser CI actions follow the accepted phone controls
date: 2026-11-03
---

PR #801 merges main `b7bc7a460` cleanly in `dbd7cfbe7`, then repairs the browser test actions identified on `3ee4ee8c`. Phone tests now use the accepted view picker, whole-row selection and header Back action. Refresh starts before opening the covering desktop snapshot, then retains the window, snapshot node and History tab across the pending response. All 72 existing assertion/timeout expressions remain unchanged; the CRM spec and application behaviour are unchanged. The accepted Desktop Snapshot 02, Phone List 06 and Phone Finding 07 captures and decision record support these actions.

[Evidence](../testing/evidence/service-findings/README.md#browser-ci-repairs--3-november-2026) records every failed job from the newest CI runs: four browser jobs and two dependent summaries, covering four Findings scenarios and the compiled mobile CRM completion scenario. CRM passed in the Application mobile job on the same head but failed in compiled mobile. Its cause remains unresolved; it is not labelled pre-existing or not reproduced. Both phone-header files now match main, and the remaining shared-shell changes are exact Findings route additions.

Executed passes: foundation including design tokens, prototype, naming, status, studio, lint, typecheck, 1,356 units and production build; focused units 19/19. Ten restricted unit-file failures reproduced on clean main `b7bc7a460` before the successful network-enabled run. Serial Findings database files returned three passes and eight `RenderOrStorageFailure` cases, each recorded as **environment-blocked: browser** with names in the evidence table.

Setup reports database ready and browser unavailable. Both Findings and mobile CRM browser files on desktop and mobile, including the branch/main CRM comparison, are **not run here; left to GitHub CI**. Other browser, HTTP and broader database suites are **not run here; left to GitHub CI**. New-head CI, compiled CRM attribution and Claude's limited confirmation remain open. The PR remains ready for review; no new full review, visual acceptance, deployment or merge is claimed. Dean merges.
