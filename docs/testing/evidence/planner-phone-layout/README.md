---
document_id: PPO-PL-PHONE-E1
title: Planner phone layout — stage 4 of the refinement boards
revision: r01
date: 2026-10-10
owner: Dean Fiedler
status: Implemented and checked locally; device and owner review pending
base_commit: 1d34dc0
---

# Planner phone layout

Dean, 10 October 2026: "Yes to both, proceed with the phone layout" ([decision](../../../decisions/ui-build-sequence.md#planner-phone-layout-10-october-2026)).

## Checks run

See the pull request for the exact commands and results. In short: unit tests, type check, lint, the design-register and documentation checks, and the planner and scheduling browser specs on desktop and mobile against a task-owned dev server with a freshly reset disposable database. Captures were taken at 390 and 320 px with no page overflow; at both widths a visit's details open as a bottom sheet and its Move or reassign opens the move form.

## Captures

Full-page screenshots from the task-owned dev server, synthetic data (week of Mon 22 Sep 2031), headless Chromium in mobile emulation. Functional evidence, not a device or visual review.

| File | Size (px) | SHA-256 |
|---|---|---|
| [`phone-day-390-sheet.png`](phone-day-390-sheet.png) | 390 × 844 | `f4dade6fe206556bd0e3bfa46b25f015442bbdaea1487265ac0bdd2ddce829f6` |
| [`phone-day-390.png`](phone-day-390.png) | 390 × 844 | `3722e6a23f3ddc1eaa7ae67ef68d51a9716e83f0cff5dc9274a34fd847fb6398` |
| [`phone-week-390.png`](phone-week-390.png) | 390 × 844 | `561a4240f3972ea55f0ce122c97492e4348793260b044973d3a0346d47de18fb` |

## Limits

- Not checked on a real phone, with a screen reader or at 200% zoom.
- The board's To schedule tray is not built; the attention row jumps to the existing Proposed and cancelled list.
- The Scheduling tabs now scroll in one row on every Scheduling page on phones; the other Scheduling pages were not recaptured.
