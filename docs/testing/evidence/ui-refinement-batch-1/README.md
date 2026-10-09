---
document_id: PPO-UI-REFINE-B1
title: Phase 00 refinement batch 1 — shared shell findings S1 to S7
revision: r01
date: 2026-10-09
owner: Dean Fiedler
status: Implemented and recaptured locally; owner re-review pending
base_commit: 5ce150b7e8842bd7575b19e6a64e06c1c4670370
---

# Phase 00 refinement batch 1

Dean accepted the phase 00 verdicts on 9 October 2026 and asked to start the refinement batch. Under SD-02 and SD-03 the shared findings come first. This batch covers S1, S2, S3, S4 and S7 in the shell. S5, S6, S8 and S9, plus the page-level refinements, follow in later batches.

## What changed

| Finding | Change | Result |
|---|---|---|
| S1 contrast | The search shortcut hint, panel footer and lead empty state use `--text-secondary` | The shared axe contrast failure is gone from all 18 desktop pages |
| S2 phone title | One 17 px / 500 current-page title on pages without a section menu; r07 unchanged where a menu exists | Same title treatment on every phone header |
| S3 floating button | None: verified | At the end of the scroll, the last content ends at 692 px and the button starts at 708 px; nothing is covered. The finding is withdrawn |
| S4 back links | Shared `ppo-back-link`: at least 24 px, or 44 px on touch | Back links no longer appear in the phone small-target scan |
| S7 icons | Rail toggle chevrons; list icon for page hierarchy; clearer guide and help tooltips | The ellipsis now means only More |

## Before and after (same method as the phase 00 evidence)

Before: [phase 00 session 1](../ui-review-phase-00-r01/README.md), build `a52cb01`. After: this branch with batch 1 applied, on base `5ce150b`. Compiled build, same synthetic data and profiles, axe-core 4.10.2.

| Entry | View | axe before | axe after | Small targets before | after |
|---|---|---|---|---:|---:|
| `route:/` | desktop | color-contrast (kbd) | none | — | — |
| `route:/` | phone | none | none | 0 | 0 |
| `route:/login` | desktop | none | none | — | — |
| `route:/login` | phone | none | none | 0 | 0 |
| `route:/my-jobs` | desktop | color-contrast (kbd) | none | — | — |
| `route:/my-jobs` | phone | none | none | 1 | 1 |
| `route:/my-jobs/[id]` | desktop | color-contrast (kbd) | color-contrast (.ss) | — | — |
| `route:/my-jobs/[id]` | phone | color-contrast (.ss) | color-contrast (.ss) | 3 | 3 |
| `route:/my-jobs/site-readiness` | desktop | color-contrast (kbd) | none | — | — |
| `route:/my-jobs/site-readiness` | phone | none | none | 1 | 0 |
| `route:/offline/index.html` | desktop | none | none | — | — |
| `route:/offline/index.html` | phone | none | none | 0 | 0 |
| `route:/sales/leads` | desktop | color-contrast (kbd) | none | — | — |
| `route:/sales/leads` | phone | none | none | 0 | 0 |
| `route:/sales/leads/[id]` | desktop | none | none | — | — |
| `route:/sales/leads/[id]` | phone | none | none | 0 | 0 |
| `route:/sales/opportunities/new` | desktop | color-contrast (kbd) | none | — | — |
| `route:/sales/opportunities/new` | phone | none | none | 2 | 1 |
| `route:/sales/tasks` | desktop | color-contrast (kbd) | none | — | — |
| `route:/sales/tasks` | phone | none | none | 0 | 0 |
| `route:/schedule` | desktop | color-contrast (kbd) | none | — | — |
| `route:/schedule` | phone | none | none | 8 | 8 |
| `route:/service/appointments/[id]` | desktop | color-contrast (kbd) | none | — | — |
| `route:/service/appointments/[id]` | phone | none | none | 4 | 4 |
| `route:/work` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work` | phone | none | none | 0 | 0 |
| `route:/work/[id]` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/[id]` | phone | none | none | 7 | 6 |
| `route:/work/actions` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/actions` | phone | none | none | 0 | 0 |
| `route:/work/new` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/new` | phone | none | none | 2 | 1 |
| `route:/work/reviews` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/reviews` | phone | none | none | 0 | 0 |
| `route:/work/team` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/team` | phone | none | none | 0 | 0 |
| `route:/work/waiting` | desktop | color-contrast (kbd) | none | — | — |
| `route:/work/waiting` | phone | none | none | 0 | 0 |
| `system:guidance` | desktop | color-contrast (kbd) | none | — | — |
| `system:guidance` | phone | color-contrast (#shell-utility-panel > .ppo-panel-footer > .ppo-preview-label) | none | 3 | 3 |
| `system:shell` | desktop | color-contrast (kbd) | none | — | — |
| `system:theme` | desktop | color-contrast (kbd) | none | — | — |

## Retained captures

| Capture | SHA-256 |
|---|---|
| [my-work-phone-scroll-end.png](captures/my-work-phone-scroll-end.png) | `fb5f8f95e5ad2cf1c2d2691eba1ed54f3fc9113592a87400cb61820efe944a45` |
| [schedule-phone.png](captures/schedule-phone.png) | `92d8327ee12a3e8a3a77504d297f5f191034a700250a6d7ce7b2e079a432c1c4` |
| [shell-desktop.png](captures/shell-desktop.png) | `45d1a8292263d25e978ba70939b0e85b3835959408bde5fe8831220d15dc31f9` |
| [site-readiness-phone.png](captures/site-readiness-phone.png) | `5583799b691b0f337a18b8eae08e9b53b804726daf19c2f4dfffda8b3e394351` |
| [work-desktop.png](captures/work-desktop.png) | `1fd91e9046c14431a548a1fe7aeb51be84cb2c5cd1699a78fb4d667ad6f48085` |
| [work-new-phone.png](captures/work-new-phone.png) | `67756692b086140bd48503e13efb532b17f571b59087625a77668c9578a4ff3f` |

## Remaining and limits

- **Technician job page:** one contrast failure remains, the idle timer seconds digits (`.ss`). They are faint by design under the accepted work timer baseline, so the change is raised as a proposed departure for the FI-01 refinement rather than made here.
- **Small targets:** the remaining phone small targets are record links and buttons inside specific pages (planner, appointment, activity record, job page) and the development-only guide links. They belong to the page refinements and to S9.
- **Reviews:** the 28 phase 00 owner reviews are now stale, as intended: their shared sources changed. They need a fresh owner look.
- **Method:** headless Chromium on one synthetic dataset. Not device, screen-reader or operational acceptance. Playwright suites that need the stable Chrome channel run in CI.
