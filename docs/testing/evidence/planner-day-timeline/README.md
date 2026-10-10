---
document_id: PPO-PL-DAY-E1
title: Planner Day timeline and details panel — stage 1 of the refinement boards
revision: r01
date: 2026-10-10
owner: Dean Fiedler
status: Implemented and checked locally; owner visual review pending
base_commit: ed3ccb8
---

# Planner Day timeline

Dean, 10 October 2026: "Yes to both, proceed with your recommendations" ([decision](../../../decisions/ui-build-sequence.md#planner-day-timeline-10-october-2026)). The Day view is now the refinement board's 07:00 to 18:00 timeline, with a details panel. Week, phone and Map follow.

## Checks run

| Check | Result |
|---|---|
| `tests/unit/day-timeline.test.ts` | 8 of 8 pass: minutes across midnight, axis and snapping, extended and not-working bands for 07:00–18:00 and 08:00–17:00 calendars, hours booked and free time, unavailable time and leave, today's free time from now, needs attention, initials |
| `tests/browser/planner.spec.ts` "SC-07 day/week" on a task-owned dev server (port 3110, disposable database) | Passes on desktop and mobile. Desktop now opens a visit's details with Enter and moves from there; mobile keeps the day list |
| The rest of `tests/browser/planner.spec.ts` on the same server, desktop | SC-08 passes twice in a row on a fresh database. The project-request test failed on this branch and on unmodified `main` alike (dev-server timing on the appointment page, not the planner board); CI runs the compiled app |
| Catalogue checks in `scheduling-workspaces.spec.ts` (long labels) and `scheduling-refinement.spec.ts` (closures) | 4 of 4 pass, desktop and mobile |
| Captured at 1440, 1024 and 390 px | No page overflow at any width; 390 px shows the existing day list |

## Captures

Element screenshots from the task-owned dev server with freshly seeded synthetic data (Mon 22 Sep 2031), headless Chromium. Functional evidence, not a visual review.

| File | Size (px) | SHA-256 |
|---|---|---|
| [`catalogue-default-1440.png`](catalogue-default-1440.png) | 1440 × 960 | `255fccdeb5159f2b26a4dc27bce27f556a95785483866551b091e79e45e76729` |
| [`day-1440-selected.png`](day-1440-selected.png) | 1324 × 913 | `fa913567cfcfd02811452bdce8a4b9e1404672786c44cd0642ae41583e1762e6` |
| [`day-1440.png`](day-1440.png) | 1324 × 913 | `e38577c153ff34c9271b237c0746d18beb2d56d543f3fe5f84ee468fd7688958` |

## Limits

- The timeline shows at 781 px and wider, and only when the display timezone is the resources' calendar timezone. Otherwise the existing day list shows.
- Week, the phone layout and Map are not changed in this stage.
- No capture of the Now line on real data: the seeded week is in 2031. The catalogue example fixes Now at 10:40.
