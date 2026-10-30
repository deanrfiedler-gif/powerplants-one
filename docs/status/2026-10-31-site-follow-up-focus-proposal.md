---
title: Site follow-up list keeps keyboard focus across refreshes
date: 2026-10-31
---

This closes the open question in the [25 October fragment](2026-10-25-p11-journey-pages-site-follow-ups-across-cs-04-refreshes.md). Dean chose option (a) of the [decision record](../decisions/site-follow-up-focus.md) on 31 October 2026, and it is now built. The Site page's Owned follow-up list stays on screen during its 15-second refresh, keeping rows, focus and scroll. It still clears when a read is denied, fails or stays unanswered past the next one, and it is removed at once when the Follow-ups source turns Restricted or Unavailable. Focus moves to a heading when a focused control is removed and when the user pages. [PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715), open and unmerged, specified the alternative of clearing and restoring focus.

Before the change, on the real Site page (dev server, Chrome through Playwright, 1440 px, synthetic reads, 50-item page), focus was lost 4 times in 60 seconds, and at 1, 2 and 3 Tabs a second a keyboard user never reached "Next linked activities" within 150 seconds. A temporary prototype reached it at all three paces. That pace test was not rerun on the build.

Checked locally: the six cases in `tests/browser/sites-follow-up-focus.spec.ts` pass at desktop and phone viewports and all fail on the previous code. The CS-04 follow-up case in `sites-native.spec.ts` and `quality-owned-follow-up.spec.ts` pass at both viewports. CI's browser lanes are the deciding run for the wider suite.

Not checked: a screen reader, the compiled application, the live API or a real window switch. Not built: focus still falls to the document when the whole Overview read fails. Second-model review, device review and owner visual review are pending. No API, permission or migration change.

<!-- decision-index -->
[Keeping keyboard focus when the Site follow-up list refreshes](../decisions/site-follow-up-focus.md) (PPO-SITE-FOLLOW-UP-FOCUS-DEC) records Dean's choice to keep the list on screen during routine refreshes.
