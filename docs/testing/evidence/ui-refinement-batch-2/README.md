---
document_id: PPO-UI-REFINE-B2
title: Phase 00 refinement batch 2 — My Work pages, S6 dates, S5 wording and the S9 guide
revision: r01
date: 2026-10-09
owner: Dean Fiedler
status: Implemented and recaptured locally; owner re-review pending
base_commit: 184b9338
---

# Phase 00 refinement batch 2

On 9 October 2026 Dean replied: "24-hour; accept S5, S9 and all My Work proposals" ([decision](../../../decisions/ui-build-sequence.md#owner-decisions-9-october-2026)). This batch builds those decisions on the My Work pages.

The S5 and S6 instances on Sales, Planner, Appointment, Field and Offline pages follow with those pages' own refinements.

## What changed

| Item | Change |
|---|---|
| S6 dates | `src/shell/date-format.ts` is one formatter with 7 unit tests. Year always shown; 24-hour times; zone and offset on scheduled times ("4 Sep 2026, 10:00 AEST (UTC+10)"); "Updated 9 Oct 2026, 17:19 AEST" timestamps; one-day and cross-day ranges. No internal zone names. My Work helpers, footers, the overview schedule, the agenda header and the shared date-time field hint use it. |
| `route:/work/reviews` | One name everywhere. Same heading, filter bar, panel and footer as My actions. Plain tab and filter labels. Exact counts, with "+" only beyond a full source window. Protective note kept; source coverage moved behind "About these sources". Plain empty state. Phone tabs scroll on one row. |
| `route:/work/new` | Record page pattern inside the My Work shell. What needs doing? comes first; then category, owner and date; then Linked to and Who can see it. Plain labels for stored values. The company is filled in from the working company, or the only company the person can reach. A Cancel button. |
| `route:/work/[id]` | Record page pattern inside the My Work shell. Identity header with an overdue chip, status, owner and who can read the details. Complete and Reschedule take the person to the existing fields. One date format. Names before numbers in links. "Version" hidden. Continue in Sales in plain words. |
| `route:/work` | 24-hour rows with the due date beside the overdue count. Narrow lists show Reschedule as an icon, so titles get the width. Count badges stay with their heading. Phone: the weather card is hidden until a provider is connected; quick actions are labelled. |
| `route:/work/waiting` | The coverage note is in plain words, with a link to My actions. |
| S9 guide | The My Work guide is published from the information icon. The revision label shows only in the development workspace. |

## Captures

These are from the compiled build on this branch, with the same synthetic data, profiles and method as the [phase 00 evidence](../ui-review-phase-00-r01/README.md): headless Chromium at 1440 × 900 and 390 × 844, locale en-AU, zone Australia/Brisbane, axe-core 4.10.2. [`browser-results.json`](browser-results.json) holds the raw results and image hashes.

| Entry | View | Status | Overflow | axe | Console errors |
|---|---|---|---|---|---|
| `route:/work` | desktop | 200 | 0 | none | 0 |
| `route:/work` | phone | 200 | 0 | none | 0 |
| `route:/work/reviews` | desktop | 200 | 0 | none | 0 |
| `route:/work/reviews` | phone | 200 | 0 | none | 0 |
| `route:/work/new` | desktop | 200 | 0 | none | 0 |
| `route:/work/new` | phone | 200 | 0 | none | 0 |
| `route:/work/[id]` | desktop | 200 | 0 | none | 0 |
| `route:/work/[id]` | phone | 200 | 0 | none | 0 |
| `route:/work/waiting` | desktop | 200 | 0 | none | 0 |
| `route:/work/waiting` | phone | 200 | 0 | none | 0 |
| `system:guidance` | desktop | 200 | 0 | none | 0 |
| `system:guidance` | phone | 200 | 0 | none | 0 |

An earlier run on this branch flagged `link-in-text-block` on the Blocked & waiting note. The link is now underlined, and the final run above is clean.

## Limits

- **Development workspace:** the local server runs as the development workspace, so the guidance captures still show the development draft disclosure and "r17". The user view hides both. This is checked in code (`development` flag), not in these captures.
- **Synthetic data:** it holds no review tasks, so the Reviews & handovers rows and counts above zero are proved by the browser suites rather than these captures.
- **Tests:** browser suites (`my-work`, `my-work-mobile`, `sh-platform`, `sales-followup`, `integrated-journey`, `intake`) were updated for the new wording. CI runs them; the stable Chrome channel is not available locally.
- **Owner review:** this is visual and objective evidence only. Each entry's owner review stays stale until Dean looks at the built page (SD-05).
