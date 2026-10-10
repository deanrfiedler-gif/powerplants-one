---
document_id: PPO-PL-WEEK-E1
title: Planner Week board — stage 3 of the refinement boards
revision: r01
date: 2026-10-10
owner: Dean Fiedler
status: Implemented and checked locally; owner visual review pending
base_commit: fb09fad
---

# Planner Week board

Dean, 10 October 2026: "Yes to both, proceed with the Week view" ([decision](../../../decisions/ui-build-sequence.md#planner-week-board-10-october-2026)).

## Checks run

| Check | Result |
|---|---|
| `tests/unit/day-timeline.test.ts` | 9 of 9 pass, including ISO week numbers, span subtraction and readable block kinds |
| `tests/browser/planner.spec.ts`, `scheduling-refinement.spec.ts` and `scheduling-workspaces.spec.ts`, desktop and mobile, on a task-owned dev server (port 3110, freshly reset disposable database) | 30 pass. The two failures are the project-request test, which fails the same way on unmodified `main` in this dev-server setup |
| Drag a Week tile to another day (`planner.spec.ts` controlled move) | Passes: the proposal opens, the saved move lands in the target day's cell and leaves the original |
| Catalogue `week` state at 1440 and 320 px | The continuing closure shows on 24, 25 and 26 September and not on the 27th; no page overflow |

## Captures

Element screenshots from the task-owned dev server, freshly seeded synthetic data (week of Mon 22 Sep 2031), headless Chromium at 1440 px. Functional evidence, not a visual review.

| File | Size (px) | SHA-256 |
|---|---|---|
| [`catalogue-week-1440.png`](catalogue-week-1440.png) | 1440 × 900 | `ea1cd73f51a79b7fc74070a46964800b15451316a58c0ec0603a67cd80118c8b` |
| [`week-1440-selected.png`](week-1440-selected.png) | 1324 × 849 | `6017ab9eef72e8c49a66670eb74289ff7320b7c1585586997aed11c7a0b0af3a` |
| [`week-1440.png`](week-1440.png) | 1324 × 849 | `71a15ad99e9790aa0dd5f8dd365265164c4ef2ec9914cf4f0b84952c094d01a5` |

## Limits

- Wide screens only (781 px and up) and only when the display timezone is the resources' own; otherwise the lane list shows.
- The phone layout and Map are not changed in this stage.
