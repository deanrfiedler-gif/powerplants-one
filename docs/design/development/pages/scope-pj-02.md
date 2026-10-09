# Project overview and portfolio health — design reference

Stable entry: `scope:PJ-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend project register/detail with explained health, recovery actions, milestones and completeness.

1. Select the project and check its reporting basis
2. Review overdue milestones and explained health
3. Open the underlying issue before assigning recovery work

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

- [projects-register-desktop.png](../../../blueprints/projects-visuals/projects-register-desktop.png)
- [29-pj02-portfolio-desktop.png](../../../reference/ui/application-shell/navigation-architecture-board-r02/29-pj02-portfolio-desktop.png) · 1440 × 900 · Proposed Health view
- [30-pj02-portfolio-phone.png](../../../reference/ui/application-shell/navigation-architecture-board-r02/30-pj02-portfolio-phone.png) · 390 × 969 · Proposed Health view
- [31-pj02-portfolio-320.png](../../../reference/ui/application-shell/navigation-architecture-board-r02/31-pj02-portfolio-320.png) · 320 × 1013 · Proposed Health view

The three portfolio-health renders come from the private claude.ai design canvas "PPO Navigation Architecture", version 26 (capture set r02), recorded in [Navigation architecture board](../../../decisions/navigation-architecture-board.md). They propose a List / Health view switch on the existing register, shared at `/projects?view=health` with the breadcrumb Projects › Projects register › Health view. Schedule, cost and risk status are explained, and each measure is labelled: forecast finish against baseline, and milestone lateness. Unknown is shown whenever an input is missing. The thresholds shown are synthetic placeholders pending decision NAD-04 and D-017; they are not adopted rules.

## Behaviour, handovers and verification

The draft User Guide `guide.pj.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
