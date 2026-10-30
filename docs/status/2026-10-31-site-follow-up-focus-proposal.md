---
title: Site follow-up focus proposal for Dean's choice
date: 2026-10-31
---

The [proposal](../decisions/site-follow-up-focus.md) answers the open question in the [25 October fragment](2026-10-25-p11-journey-pages-site-follow-ups-across-cs-04-refreshes.md): how to stop the 15-second refresh of the Site page's Owned follow-up list from taking keyboard focus, without weakening the rule that revoked data must not stay on screen. It recommends keeping the list on screen during a routine refresh and clearing it only when a read is denied or fails, or the source turns Restricted or Unavailable. Dean has not yet chosen. [PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715), still open and unmerged, specifies the alternative of clearing and restoring focus, so this choice settles which goes forward.

Measured on 31 October 2026 on the real Site page (dev server, Chrome through Playwright, 1440 px, synthetic reads, 50-item page): focus was lost 4 times in 60 seconds, and at 1, 2 and 3 Tabs a second a keyboard user never reached "Next linked activities" within 150 seconds. A temporary prototype of the recommendation reached it at all three paces, and the Restricted, late-reply, denied and failed-read checks passed. Only the assertion at `sites-native.spec.ts:100` that a routine refresh empties the list failed. The prototype was removed and is not on any branch.

Not checked: a screen reader, a phone viewport, the compiled application, the live API, a real window switch or the full test suite. No application, test, API, permission or migration change is made here. Second-model review of the paper is still to come, and owner visual review of the page remains pending.

<!-- decision-index -->
[Keeping keyboard focus when the Site follow-up list refreshes](../decisions/site-follow-up-focus.md) (PPO-SITE-FOLLOW-UP-FOCUS-DEC) is a proposal for Dean's choice between three options.
