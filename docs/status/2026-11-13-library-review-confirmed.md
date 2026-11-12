---
title: Independent review of PPO - Library confirmed in the file; one fill re-applied and eleven texts corrected
date: 2026-11-13
---

The session that made the [independent review](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) re-read the private Figma file "PPO - Library" on 13 November 2026. The session that holds the library had recorded the review as taken up and closed ([library audit](../decisions/library-audit.md), section 9). Section 9 of the review record holds the result.

- **Confirmed.** Ten of the thirteen findings are addressed as recorded: spacing, the separated ticked and chosen states, the option names, one count badge, shared placeholders, the Danger button's Pressed layer, the unavailable day, the clipped set, the phone buttons, the disabled Menu item and the band labels.
- **One was not quite met, and is now fixed.** Two variants of Grid / Cell · Edit no longer painted black, but they painted `#f5f7fa` where `surface/hover` is `#f0f2f5`. The earlier sweep looked only for colours that store black. This session re-applied the fill on both. They now store, resolve and render `#f0f2f5`.
- **Two wait, as planned.** The dialog corner value and the scopes of the copied colour variables go with the CSS-name reconciliation before publishing (B3).
- **Every bound colour compared with its variable.** 24,595 fills and outlines on all fourteen pages. Two differed before the fix and none after.
- **Text contrast, run again on every page.** No text in a resting state falls below 4.5:1, including the parts drawn since 12 November 2026. The only lower pairs are disabled labels, which WCAG exempts, and the Grid's deliberate origin slot.
- **Eleven texts corrected.** Review-board notes and component descriptions on the Controls, Grid, Board, Move and Phone pages still named options renamed on 12 November 2026: `Default` for `Rest`, `Type` for `Kind`, `Active` for `Selected`, and the two count badges merged into Controls / Count. Each now uses the current name. Nothing else changed.

**Claim.** One session edits the library at a time. The claim in pull request #922 had had no commit for more than seven hours and was stale under the contribution rules. For each of its two passes this session stated its claim in pull request #924 before editing, and both are released. No other open pull request claimed the library.

**Checked:** every page was read for option names, variant sizes, spacing and bound colours. The Pressed layer, the unavailable day and the fix were each confirmed from a render. Each text correction changed exactly one match and was read back. The search for old names, run again, finds none. The one line that grew was rendered and still fits. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py`.

**Not done:**
- The cause of the two paints drawing their stored colour is not established.
- Several sets the review did not name still put content or a choice into `State`. Changing them changes their options, so it is for the session that next draws the library, before the first publish.
- Some frame names still say `Default`; they are not shown on the canvas.
- Icon and outline contrast was not swept.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed, and no variable was added or changed.

<!-- decision-index -->
[PPO - Library independent review](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) now records, in section 9, the reviewer's confirmation on 13 November 2026 that its findings were addressed in the file, and the corrections made under a stated claim: the fill of two Grid / Cell · Edit variants re-applied so that they follow `surface/hover`, and eleven board texts and descriptions brought up to the current option names. It accepts no page and authorises no application code or deployment.
