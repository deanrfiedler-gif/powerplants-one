# Login — design reference

Stable entry: `route:/login`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Accept**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/login`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Local sign-in presentation. Use the local prototype entry; Microsoft sign-in remains a hosted-demo feature.

1. Confirm that you opened the intended PPO environment
2. Use the sign-in method offered by that environment
3. Continue to the fixed destination after sign-in and check the current identity; caller-supplied return addresses are ignored ([login decision](../../../decisions/login-r02-integration.md), [System pages Q9](../../../decisions/system-pages-figma-design.md))

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No exact HTML reference is linked: `Powerplants-One-Login-r02.html` is not in the repository, so `src/login/` is the maintained source.

Accepted design: the [System pages design decision](../../../decisions/system-pages-figma-design.md) of 1 November 2026 redraws sign-in from `src/login/`, with [System pages design r01 captures](../../../reference/ui/application-shell/system-pages-design-r01/README.md): 01–06 desktop 1440, 10 tablet 1024, 12–14 phone, 21–25 other states, help, focus order and a 200% composition (icon-free PNGs; not a UI baseline). The application is not yet built to its departures D2, D3 and D12.

## Behaviour, handovers and verification

The draft User Guide `guide.page.login` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Accept.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** Clear, branded and responsive. Microsoft sign-in is correctly shown as unavailable locally.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
