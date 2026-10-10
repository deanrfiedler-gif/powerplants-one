---
document_id: PPO-PL-HOURS-E1
title: Planner working hours — standard-hours warning and calendar boundary
revision: r01
date: 2026-10-10
owner: Dean Fiedler
status: Implemented and checked locally; owner visual review pending
base_commit: 1427910
---

# Planner working hours

Dean's decision: calendars publish 07:00 to 18:00, and work outside the 08:00 to 17:00 standard hours is allowed with a warning ([decision](../../../decisions/ui-build-sequence.md#planner-working-hours-10-october-2026)).

## Checks run

| Check | Result |
|---|---|
| `node --import tsx --test tests/unit/working-hours.test.ts` | 6 tests pass: boundaries, travel before 08:00 and after 17:00, a visit itself outside, crossing midnight, a daylight-saving timezone and the notice text |
| `tests/database/planner.test.ts` on a disposable PostgreSQL 16 cluster | 20 of 20 pass, including the new test: travel may start at 07:00 and end at 18:00, and a minute beyond either is refused with `SkillOrTravelInvalid` |
| `tests/database/scheduling-workspaces.test.ts` and `policy-enforcement.test.ts` on the same cluster | 5 of 5 and 6 of 6 pass |
| Booking form and planner card on a task-owned dev server (port 3110, freshly seeded disposable database) | A move to 07:30–09:30 with 30 minutes' travel each way warns for both crew members, saves (the calendar now allows 07:00), and the card then shows "Extended hours · 07:00 to 10:00 including travel". A 15:30–17:30 move warns "15:00 to 18:00" at 390 px |

The browser assertion added to `tests/browser/planner.spec.ts` was not run locally: browser specs here only run against port 3000. CI runs it.

## Captures

Element screenshots from the dev server, headless Chromium, 1440 × 900 and 390 × 844 viewports. Synthetic data. These are functional evidence, not a visual review.

| File | Size (px) | SHA-256 |
|---|---|---|
| [`booking-form-extended-hours-desktop.png`](booking-form-extended-hours-desktop.png) | 690 × 123 | `a49056fa353f23bd4860f6a8455dc682c5e295cbf3ba22efdc6f1367cc3b3482` |
| [`booking-form-extended-hours-mobile.png`](booking-form-extended-hours-mobile.png) | 266 × 243 | `853f7e5e3ab1d8e455a2f5f03a57f9c024053ea3bb0427e038dc999f5ed3978e` |
| [`planner-card-extended-hours-desktop.png`](planner-card-extended-hours-desktop.png) | 1302 × 274 | `871c50173933921b3db792becf7c0b50d18ed498959943eb53e21ac541f114c9` |

## Limits

- Databases seeded before this change keep 08:00 to 17:00 calendars, because published calendars are immutable and seed 5 does not re-run. That includes Dean's local database and the hosted demo.
- Standard hours are a fixed rule in `src/scheduling/working-hours.ts`, not calendar data.
- The warning is worked out in the browser. The server neither records nor returns it.
- No 07:00 to 18:00 timeline: the live planner has no time axis.
